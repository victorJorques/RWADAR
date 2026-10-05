/* =====================================================================
   RWAdar · prueba de la reapertura de cuentas (migración 26)
   ---------------------------------------------------------------------
   Monta un Postgres embebido con la misma cadena que producción
   (01-22, 24, 25 y las migraciones del catálogo), comprueba que hoy las
   cuentas están cerradas, aplica 26 y demuestra con dos personas que:

     · cada cual ve y edita solo su perfil, sin poder hacerse admin,
     · cada cual guarda y quita solo su vigilancia,
     · borrar la cuenta no deja rastro y no toca a nadie más,
     · opiniones, moderación, dispositivos y push siguen cerrados,
     · el catálogo público sigue igual,
     · volver a aplicar 25 lo cierra todo otra vez (marcha atrás).

       node probar-reabrir-cuentas.mjs
   ===================================================================== */
import fs from 'node:fs';
import { alta, baseCompleta, filas, informe, sesion } from './pruebas-soporte.mjs';

const ok = [], fail = [];
const paso = (texto, condicion) => (condicion ? ok : fail).push(texto);
const falla = async (fn) => { try { await fn(); return false; } catch { return true; } };
/* «Cerrado» solo cuenta si Postgres lo rechaza por permisos (42501), no
   por cualquier otro error que haría pasar la prueba sin demostrar nada. */
const denegado = async (fn) => {
  try { await fn(); return false; } catch (e) { return e?.code === '42501'; }
};
const leer = (archivo) => fs.readFileSync(archivo, 'utf8');

const db = await baseCompleta();
await db.exec('alter default privileges grant all on tables to anon, authenticated');
for (const archivo of ['db/24_catalogo_publico_verificado.sql', 'db/25_servicios_editoriales_solo_lectura.sql',
  'supabase/migrations/20260930084133_ofertas_documentacion_publica.sql',
  'supabase/migrations/20260930090621_catalogo_v2_colecciones.sql',
  'supabase/migrations/20261001150000_catalogo_siempre_disponible.sql']) {
  await db.exec(leer(archivo));
}

const ana = await alta(db, 'ana@ejemplo.test');
const luis = await alta(db, 'luis@ejemplo.test');
const [lofty] = await filas(db, `select id from plataformas where slug='lofty'`);
const [addx] = await filas(db, `select id from plataformas where slug='addx'`);
await db.query('insert into vigilancia(usuario_id, plataforma_id) values ($1,$2)', [luis.id, addx.id]);

/* --- hoy (25): cuentas en pausa ----------------------------------- */
await sesion(db, ana.id, 'authenticated');
paso('antes de 26, una cuenta no puede leer su perfil (pausa de 25)',
  await denegado(() => db.query('select * from mi_perfil')));
paso('antes de 26, una cuenta no puede vigilar',
  await denegado(() => db.query('insert into vigilancia(usuario_id, plataforma_id) values ($1,$2)', [ana.id, lofty.id])));
await sesion(db);

/* --- se aplica 26 dos veces y pasa su verificador ----------------- */
const migracion = leer('db/26_reabrir_cuentas.sql');
await db.exec(migracion);
await db.exec(migracion);
paso('la migración 26 se puede aplicar dos veces', true);
const verificador = leer('db/26_reabrir_cuentas_verificar.sql');
paso('el verificador de 26 termina sin excepción', !(await falla(() => db.exec(verificador))));

/* --- perfil propio ------------------------------------------------- */
await sesion(db, ana.id, 'authenticated');
const yo = await filas(db, 'select * from mi_perfil');
paso('Ana ve su perfil y solo el suyo', yo.length === 1 && yo[0].id === ana.id);
paso('el perfil nace sin permisos de administración', yo[0]?.es_admin === false);
const perfiles = await filas(db, 'select id from perfiles');
paso('en perfiles Ana solo ve su fila', perfiles.length === 1 && perfiles[0].id === ana.id);
await db.query(`update perfiles set nombre='Ana R.', avisos_correo=false where id=$1`, [ana.id]);
paso('Ana cambia su nombre y su preferencia de correo',
  (await filas(db, 'select nombre from mi_perfil'))[0]?.nombre === 'Ana R.');
paso('Ana no puede hacerse administradora',
  await denegado(() => db.query('update perfiles set es_admin=true where id=$1', [ana.id])));
const ajena = await db.query(`update perfiles set nombre='pirata' where id=$1`, [luis.id]);
paso('Ana no puede cambiar el perfil de Luis', ajena.affectedRows === 0);

/* --- manual de bienvenida: solo la fecha de la primera descarga ---- */
paso('Ana no puede escribirse la fecha del manual a mano',
  await denegado(() => db.query('update perfiles set manual_descargado_el=now() where id=$1', [ana.id])));
await db.query('select marcar_manual_descargado()');
const [primera] = await filas(db, 'select manual_descargado_el from perfiles');
await db.query('select marcar_manual_descargado()');
const [segunda] = await filas(db, 'select manual_descargado_el from perfiles');
paso('descargar el manual anota la fecha de la primera vez y no la cambia',
  primera.manual_descargado_el instanceof Date &&
  segunda.manual_descargado_el.getTime() === primera.manual_descargado_el.getTime());
await sesion(db);
const [recuento] = await filas(db, `select count(*) filter (where manual_descargado_el is not null)::int descargaron,
  count(*)::int cuentas from perfiles`);
paso('el recuento para Víctor sale con una consulta: 1 de 2 cuentas lo descargó',
  recuento.descargaron === 1 && recuento.cuentas === 2);
await sesion(db, ana.id, 'authenticated');

/* --- vigilancia propia -------------------------------------------- */
paso('Ana encuentra la plataforma por su nombre (como hace la web)',
  (await filas(db, `select id from plataformas where nombre='Lofty'`))[0]?.id === lofty.id);
await db.query('insert into vigilancia(usuario_id, plataforma_id) values ($1,$2)', [ana.id, lofty.id]);
const mias = await filas(db, `select v.plataforma_id, p.nombre from vigilancia v
  join plataformas p on p.id = v.plataforma_id`);
paso('Ana vigila Lofty y no ve la vigilancia de Luis',
  mias.length === 1 && mias[0].plataforma_id === lofty.id && mias[0].nombre === 'Lofty');
paso('el contador de mi_perfil cuenta sus vigiladas',
  Number((await filas(db, 'select plataformas_vigiladas from mi_perfil'))[0]?.plataformas_vigiladas) === 1);
paso('Ana no puede apuntar a Luis a una vigilancia',
  await denegado(() => db.query('insert into vigilancia(usuario_id, plataforma_id) values ($1,$2)', [luis.id, lofty.id])));
const borradoAjeno = await db.query('delete from vigilancia where usuario_id=$1', [luis.id]);
paso('Ana no puede borrar la vigilancia de Luis', borradoAjeno.affectedRows === 0);
await db.query('delete from vigilancia where plataforma_id=$1', [lofty.id]);
paso('Ana deja de vigilar Lofty', (await filas(db, 'select 1 from vigilancia')).length === 0);
await db.query('insert into vigilancia(usuario_id, plataforma_id) values ($1,$2)', [ana.id, lofty.id]);

/* --- lo que sigue cerrado ----------------------------------------- */
paso('publicar una opinión sigue cerrado',
  await denegado(() => db.query(`select guardar_opinion($1, 5, 'Texto de prueba suficientemente largo para opinar.')`, [lofty.id])));
paso('leer opiniones sigue cerrado', await denegado(() => db.query('select * from opiniones')));
paso('moderar sigue cerrado', await denegado(() => db.query(`select moderar(gen_random_uuid(), 'ocultar', 'x')`)));
paso('es_admin() sigue cerrado', await denegado(() => db.query('select es_admin()')));
paso('dispositivos de la app siguen cerrados', await denegado(() => db.query('select * from dispositivos')));
paso('una cuenta no puede escribir avisos de correo',
  await denegado(() => db.query('insert into avisos_correo(usuario_id) values ($1)', [ana.id])));

/* --- quien no ha entrado ------------------------------------------ */
await sesion(db, null, 'anon');
paso('anon no ve perfiles', await denegado(() => db.query('select * from perfiles')));
paso('anon no ve vigilancias', await denegado(() => db.query('select * from vigilancia')));
paso('anon no puede borrar cuentas', await denegado(() => db.query('select borrar_mi_cuenta()')));
paso('anon no puede anotar descargas del manual', await denegado(() => db.query('select marcar_manual_descargado()')));
paso('anon no ve seguimiento por instalación', await denegado(() => db.query('select * from seguimiento')));
paso('anon sigue leyendo el radar público',
  (await filas(db, 'select count(*)::int n from radar_publico'))[0].n > 0);

/* --- baja ---------------------------------------------------------- */
await sesion(db, ana.id, 'authenticated');
await db.query('select borrar_mi_cuenta()');
await sesion(db);
paso('borrar la cuenta elimina a Ana de Auth',
  (await filas(db, 'select 1 from auth.users where id=$1', [ana.id])).length === 0);
paso('y su perfil y su vigilancia',
  (await filas(db, 'select 1 from perfiles where id=$1', [ana.id])).length === 0 &&
  (await filas(db, 'select 1 from vigilancia where usuario_id=$1', [ana.id])).length === 0);
paso('Luis no se entera: su cuenta y su vigilancia siguen',
  (await filas(db, 'select 1 from perfiles where id=$1', [luis.id])).length === 1 &&
  (await filas(db, 'select 1 from vigilancia where usuario_id=$1', [luis.id])).length === 1);

/* --- marcha atrás: volver a aplicar 25 ---------------------------- */
await db.exec(leer('db/25_servicios_editoriales_solo_lectura.sql'));
await sesion(db, luis.id, 'authenticated');
paso('reaplicar 25 vuelve a cerrar las cuentas',
  await denegado(() => db.query('select * from mi_perfil')) &&
  await denegado(() => db.query('select * from vigilancia')));
await sesion(db);
paso('tras la marcha atrás, el verificador de 26 lo detecta',
  await falla(() => db.exec(verificador)));

informe('RWAdar · reapertura de cuentas (26)', ok, fail);

/* =====================================================================
   RWAdar · prueba de la comunidad (migración 27)
   ---------------------------------------------------------------------
   Misma cadena que producción + 26 + 27, con cuatro cuentas. Comprueba que
   las reglas las pone la base de datos: una publicación al día, sin
   enlaces, lectura pública sin datos personales, denuncias (3 la ocultan),
   moderación solo para administradores, borrar lo propio y nada ajeno, y
   que la marcha atrás cierra sin borrar.

       node probar-comunidad.mjs
   ===================================================================== */
import fs from 'node:fs';
import { alta, baseCompleta, filas, informe, sesion } from './pruebas-soporte.mjs';

const ok = [], fail = [];
const paso = (texto, condicion) => (condicion ? ok : fail).push(texto);
const error = async (fn) => { try { await fn(); return null; } catch (e) { return e; } };
const leer = (archivo) => fs.readFileSync(archivo, 'utf8');

const db = await baseCompleta();
await db.exec('alter default privileges grant all on tables to anon, authenticated');
for (const archivo of ['db/24_catalogo_publico_verificado.sql', 'db/25_servicios_editoriales_solo_lectura.sql',
  'supabase/migrations/20260930084133_ofertas_documentacion_publica.sql',
  'supabase/migrations/20260930090621_catalogo_v2_colecciones.sql',
  'supabase/migrations/20261001150000_catalogo_siempre_disponible.sql',
  'db/26_reabrir_cuentas.sql']) {
  await db.exec(leer(archivo));
}
paso('27 exige antes la 26', true);
const migracion = leer('db/27_comunidad.sql');
await db.exec(migracion);
await db.exec(migracion);
paso('la migración 27 se puede aplicar dos veces', true);

const [ana, luis, eva, admin] = [
  await alta(db, 'ana@ejemplo.test'), await alta(db, 'luis@ejemplo.test'),
  await alta(db, 'eva@ejemplo.test'), await alta(db, 'admin@ejemplo.test')];
await db.query(`update perfiles set nombre='Ana R.' where id=$1`, [ana.id]);
await db.query('update perfiles set es_admin=true where id=$1', [admin.id]);
const como = (u) => sesion(db, u.id, 'authenticated');

/* --- publicar ------------------------------------------------------ */
await como(ana);
const [primera] = await filas(db, `select * from publicar('Hoy he leído la lección 3 de la Academy y me ha aclarado mucho.', true)`);
paso('una cuenta publica y sale con su nombre si lo elige', primera?.autor === 'Ana R.');
const segunda = await error(() => db.query(`select * from publicar('Otra publicación el mismo día, no debería entrar.')`));
paso('una segunda publicación el mismo día se rechaza con un mensaje claro', /Ya has publicado hoy/.test(segunda?.message || ''));
await sesion(db);
await db.query(`update publicaciones set dia = dia - 1 where usuario_id=$1`, [ana.id]);
await como(ana);
const [manana] = await filas(db, `select * from publicar('Al día siguiente sí puedo volver a publicar algo.')`);
paso('al día siguiente se puede volver a publicar, y sin nombre sale como «Miembro de RWAdar»',
  manana?.autor === 'Miembro de RWAdar');

await como(luis);
for (const [texto, motivo] of [
  ['Mira https://estafa.example para ganar dinero rápido', 'enlace https'],
  ['Entra en www.ganatodo.com ya mismo, es seguro', 'www'],
  ['Escríbeme en inversionesfacil.xyz y te cuento', 'dominio suelto'],
  ['corto', 'demasiado corta'],
  ['x'.repeat(501), 'demasiado larga'],
]) {
  const e = await error(() => db.query('select * from publicar($1)', [texto]));
  paso(`se rechaza una publicación ${motivo}`, /entre 10 y 500 caracteres y no puede llevar enlaces/.test(e?.message || ''));
}
await db.query(`select * from publicar('Buscando plataformas de inmobiliario con acceso desde España.')`);

/* --- leer ----------------------------------------------------------- */
await sesion(db, null, 'anon');
const publicas = await filas(db, 'select id, autor, texto, creada_el from publicaciones order by creada_el desc');
paso('sin cuenta se leen las publicaciones visibles', publicas.length === 3);
paso('la lectura pública no da quién la escribió', !!(await error(() => db.query('select usuario_id from publicaciones'))));
paso('ni cuántas denuncias tiene', !!(await error(() => db.query('select denuncias from publicaciones'))));
paso('sin cuenta no se puede publicar', !!(await error(() => db.query(`select * from publicar('Intento sin cuenta de publicar algo.')`))));
paso('ni escribir directamente en la tabla', !!(await error(() => db.query(
  `insert into publicaciones(usuario_id, texto) values ($1, 'Inserción directa que no debe entrar.')`, [luis.id]))));
await como(luis);
paso('con cuenta tampoco se escribe directamente en la tabla', !!(await error(() => db.query(
  `insert into publicaciones(usuario_id, texto) values ($1, 'Inserción directa que no debe entrar.')`, [luis.id]))));
paso('ni se cambia una publicación ajena', !!(await error(() => db.query(
  `update publicaciones set texto='Cambiado por otra persona' where id=$1`, [primera.id]))));

/* --- borrar --------------------------------------------------------- */
paso('nadie borra una publicación ajena', (await filas(db, 'select borrar_mi_publicacion($1) b', [primera.id]))[0].b === false);
await como(ana);
const mias = await filas(db, 'select * from mis_publicaciones()');
paso('cada cuenta ve las suyas para poder borrarlas', mias.length === 2);
paso('y borra la suya', (await filas(db, 'select borrar_mi_publicacion($1) b', [manana.id]))[0].b === true);

/* --- denunciar y moderar --------------------------------------------- */
const propia = await error(() => db.query('select denunciar_publicacion($1)', [primera.id]));
paso('nadie denuncia su propia publicación', /propia publicación/.test(propia?.message || ''));
for (const u of [luis, eva]) { await como(u); await db.query(`select denunciar_publicacion($1, 'Publicidad')`, [primera.id]); }
await como(eva);
await db.query('select denunciar_publicacion($1)', [primera.id]);
await sesion(db, null, 'anon');
paso('dos denuncias (una repetida no cuenta) no la ocultan',
  (await filas(db, 'select 1 from publicaciones where id=$1', [primera.id])).length === 1);
await como(admin);
await db.query('select denunciar_publicacion($1)', [primera.id]);
await sesion(db, null, 'anon');
paso('con la tercera denuncia se oculta sola', (await filas(db, 'select 1 from publicaciones where id=$1', [primera.id])).length === 0);
await como(luis);
paso('quien no es administrador no ve la cola ni modera',
  !!(await error(() => db.query('select * from cola_publicaciones()'))) &&
  !!(await error(() => db.query(`select moderar_publicacion($1, 'restaurar')`, [primera.id]))));
await como(admin);
const cola = await filas(db, 'select * from cola_publicaciones()');
paso('el administrador ve la publicación oculta en su cola', cola.some((c) => c.id === primera.id && c.estado === 'oculta' && c.denuncias === 3));
await db.query(`select moderar_publicacion($1, 'restaurar')`, [primera.id]);
await sesion(db, null, 'anon');
paso('y puede restaurarla', (await filas(db, 'select 1 from publicaciones where id=$1', [primera.id])).length === 1);

/* --- borrar la cuenta se lleva sus publicaciones --------------------- */
await como(luis);
await db.query('select borrar_mi_cuenta()');
await sesion(db);
paso('al borrar la cuenta se borran sus publicaciones y denuncias',
  (await filas(db, 'select 1 from publicaciones where usuario_id=$1', [luis.id])).length === 0 &&
  (await filas(db, 'select 1 from denuncias_publicaciones where usuario_id=$1', [luis.id])).length === 0);

/* --- marcha atrás ---------------------------------------------------- */
await db.exec(leer('db/27_comunidad_cerrar.sql'));
await sesion(db, null, 'anon');
paso('cerrar la comunidad retira la lectura pública', !!(await error(() => db.query('select texto from publicaciones'))));
await como(eva);
paso('y la publicación', !!(await error(() => db.query(`select * from publicar('Después de cerrar no se puede publicar.')`))));
await sesion(db);
paso('sin borrar nada (queda la de Ana)', (await filas(db, 'select count(*)::int n from publicaciones'))[0].n === 1);

informe('RWAdar · comunidad (27)', ok, fail);

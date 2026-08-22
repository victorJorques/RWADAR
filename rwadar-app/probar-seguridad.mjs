/* Pruebas de regresión de la frontera de confianza de RWAdar. */
import {
  baseCompleta, reaplicaSeguridad, filas, sesion, alta, informe, MIGRACIONES,
} from './pruebas-soporte.mjs';

const db = await baseCompleta();
const ok = [], fail = [];
const paso = (texto, condicion) => (condicion ? ok : fail).push(texto);
const rechaza = async (sql, params, texto, codigo = null) => {
  try {
    await db.query(sql, params);
    fail.push(`NO rechaza: ${texto}`);
  } catch (error) {
    if (codigo && error.code !== codigo) {
      fail.push(`${texto}: esperaba ${codigo}, recibió ${error.code ?? error.message}`);
    } else {
      ok.push(`rechaza ${texto}`);
    }
  }
};

paso('la suite carga la cadena fresh-install segura 01-22',
  MIGRACIONES[0].startsWith('01_') && MIGRACIONES.at(-1).startsWith('22_')
  && MIGRACIONES.length === 19
  && !MIGRACIONES.some((f) => /^(13_|16_|14-15_)/.test(f)));
paso('la cadena instala correo/push bloqueados y emisiones disponibles',
  (await filas(db, "select count(*)::int n from pg_proc where proname='push_ciclo'"))[0].n === 1
  && (await filas(db, "select count(*)::int n from pg_proc where proname='avisos_ciclo'"))[0].n === 1
  && !(await filas(db, 'select habilitado from push_configuracion where singleton'))[0].habilitado
  && (await filas(db, `select count(*)::int n from cron.job
    where jobname in ('rwadar-avisos','rwadar-push')`))[0].n === 0
  && (await filas(db, "select count(*)::int n from pg_class where relname='emisiones'"))[0].n === 1);

// La migración correctora debe poder completar una ejecución anterior y
// volver a ejecutarse sin duplicar objetos ni perder datos.
await reaplicaSeguridad(db);
paso('14_seguridad_integral.sql se puede reaplicar', true);

const recuentos = await filas(db,
  "select estado::text, count(*)::int n from plataformas group by estado order by estado");
paso('el registro reproducible contiene 26 en radar y 4 descartadas',
  recuentos.find((r) => r.estado === 'en_radar')?.n === 26
  && recuentos.find((r) => r.estado === 'descartada')?.n === 4);
paso('ninguna descartada carece de fuente',
  (await filas(db, 'select count(*)::int n from descartadas_sin_fuente'))[0].n === 0);

const vistas = await filas(db, `
  select relname, coalesce(reloptions, array[]::text[]) opciones
    from pg_class
   where relname in ('radar_publico','opiniones_publicas','nota_media',
                     'mi_perfil','mis_opiniones','cola_moderacion')`);
paso('todas las vistas expuestas usan los permisos del invocador',
  vistas.length === 6
  && vistas.every((v) => v.opciones.includes('security_invoker=true')));

const permisos = (await filas(db, `
  select
    has_table_privilege('authenticated','perfiles','UPDATE') perfil_tabla,
    has_column_privilege('authenticated','perfiles','nombre','UPDATE') nombre,
    has_column_privilege('authenticated','perfiles','avisos_correo','UPDATE') avisos,
    has_column_privilege('authenticated','perfiles','es_admin','UPDATE') admin,
    has_table_privilege('authenticated','opiniones','INSERT') op_insert,
    has_table_privilege('authenticated','opiniones','UPDATE') op_update,
    has_column_privilege('authenticated','opiniones','estado','UPDATE') estado,
    has_column_privilege('authenticated','opiniones','denuncias','UPDATE') contador,
    has_table_privilege('authenticated','denuncias','INSERT') den_insert`))[0];
paso('el perfil solo concede nombre y avisos, nunca es_admin',
  !permisos.perfil_tabla && permisos.nombre && permisos.avisos && !permisos.admin);
paso('opiniones y denuncias no admiten escritura directa del cliente',
  !permisos.op_insert && !permisos.op_update && !permisos.estado
  && !permisos.contador && !permisos.den_insert);

// El x-instalacion es una credencial bearer aleatoria, no un identificador
// público. 22 valida su formato y evita que un cliente escriba columnas de
// identidad/retención que no necesita la app.
const [plataformaDispositivo] = await filas(db,
  "select id from plataformas where slug='reental'");
await filas(db, `insert into dispositivos(instalacion,sistema)
  values('inst_priv_otro_12345678','ios')`);
await sesion(db, null, 'anon');
await db.exec(`set request.headers =
  '{"x-instalacion":"inst_priv_cliente_12345678"}'`);
await filas(db, `insert into dispositivos
  (instalacion,token_push,sistema,visto_el)
  values('inst_priv_cliente_12345678',
         'ExponentPushToken[abcdefgh12345678]','android',now())`);
paso('una instalación fuerte registra y solo lee su propia fila',
  (await filas(db, 'select count(*)::int n from dispositivos'))[0].n === 1);
await rechaza(`update dispositivos set user_id=gen_random_uuid()
  where instalacion='inst_priv_cliente_12345678'`, [],
  'escribir user_id desde el cliente', '42501');
await rechaza(`update dispositivos set creado_el=now()-interval '10 years'
  where instalacion='inst_priv_cliente_12345678'`, [],
  'alterar la fecha de retención', '42501');
await rechaza(`update dispositivos set token_push='token-trivial'
  where instalacion='inst_priv_cliente_12345678'`, [],
  'guardar un token push sin formato Expo', '42501');
await filas(db, `insert into seguimiento(instalacion,plataforma_id)
  values('inst_priv_cliente_12345678',$1)`, [plataformaDispositivo.id]);
await rechaza(`insert into seguimiento(instalacion,plataforma_id,creado_el)
  values('inst_priv_cliente_12345678',$1,now()-interval '10 years')`,
  [plataformaDispositivo.id], 'forjar la fecha de seguimiento', '42501');
await sesion(db);
await db.exec('reset request.headers');
await sesion(db, null, 'anon');
await db.exec(`set request.headers = '{"x-instalacion":"inst_corta"}'`);
await rechaza(`insert into dispositivos(instalacion,sistema)
  values('inst_corta','ios')`, [], 'usar una credencial de instalación débil', '42501');
await sesion(db);
await db.exec('reset request.headers');

// Retención de instalaciones móviles: además del apoyo oportunista existe un
// trabajo diario independiente, acotado y con estado observable.
const [plataformaRetencion] = await filas(db, "select id from plataformas where slug='lofty'");
await filas(db, `alter table dispositivos disable trigger dispositivos_limpian_inactivos`);
for (const instalacion of ['inst-obsoleta-1', 'inst-obsoleta-2', 'inst-obsoleta-3']) {
  await filas(db, `insert into dispositivos(instalacion,sistema,visto_el)
                   values($1,'ios',now()-interval '181 days')`, [instalacion]);
  await filas(db, `insert into seguimiento(instalacion,plataforma_id)
                   values($1,$2)`, [instalacion, plataformaRetencion.id]);
}
await filas(db, `alter table dispositivos enable trigger dispositivos_limpian_inactivos`);
paso('el ciclo diario respeta el límite de lotes configurado',
  (await filas(db, 'select retencion_dispositivos_ciclo(2,1) n'))[0].n === 2
  && (await filas(db, `select count(*)::int n from dispositivos
    where instalacion like 'inst-obsoleta-%'`))[0].n === 1
  && (await filas(db, `select quedan_vencidos from retencion_dispositivos_estado
    where singleton`))[0].quedan_vencidos);
paso('la siguiente ejecución termina la retención y la cascada de seguimiento',
  (await filas(db, 'select retencion_dispositivos_ciclo(2,1) n'))[0].n === 1
  && (await filas(db, `select count(*)::int n from dispositivos
    where instalacion like 'inst-obsoleta-%'`))[0].n === 0
  && (await filas(db, `select count(*)::int n from seguimiento
    where instalacion like 'inst-obsoleta-%'`))[0].n === 0);
const [estadoRetencion] = await filas(db, `select ultima_ejecucion,
  ultimo_borrados,total_borrados,quedan_vencidos
  from retencion_dispositivos_estado where singleton`);
paso('la retención registra ejecución, resultado y posible atraso',
  estadoRetencion.ultima_ejecucion !== null
  && estadoRetencion.ultimo_borrados === 1
  && estadoRetencion.total_borrados === 3
  && !estadoRetencion.quedan_vencidos
  && (await filas(db, `select count(*)::int n from cron.job
    where jobname='rwadar-retencion-dispositivos'
      and schedule='17 3 * * *'`))[0].n === 1);

const autor = await alta(db, 'autor@prueba.invalid', { nombre: 'Autora desde metadata' });
const admin = await alta(db, 'admin@prueba.invalid');
const r1 = await alta(db, 'r1@prueba.invalid');
const r2 = await alta(db, 'r2@prueba.invalid');
const r3 = await alta(db, 'r3@prueba.invalid');
const [plataforma] = await filas(db, "select id from plataformas where slug='reental'");

paso('el trigger de alta conserva un nombre válido de metadata',
  (await filas(db, 'select nombre from perfiles where id=$1', [autor.id]))[0].nombre === 'Autora desde metadata');
await filas(db, 'update perfiles set nombre=null where id=$1', [autor.id]);
await reaplicaSeguridad(db);
paso('la migración rellena nombres antiguos desde metadata sin pisar otros',
  (await filas(db, 'select nombre from perfiles where id=$1', [autor.id]))[0].nombre === 'Autora desde metadata');

// Ataque 1: elevar privilegios desde una sesión normal.
await sesion(db, autor.id, 'authenticated');
await rechaza('update perfiles set es_admin=true where id=$1', [autor.id], 'autoasignarse es_admin', '42501');
await rechaza("select establecer_admin($1,true)", [autor.id], 'invocar la RPC reservada', '42501');
await sesion(db);
paso('los ataques no alteran el privilegio',
  (await filas(db, 'select es_admin from perfiles where id=$1', [autor.id]))[0].es_admin === false);

// Flujo válido de creación/edición: no recibe ni acepta usuario_id.
await sesion(db, autor.id, 'authenticated');
const opinionId = (await filas(db,
  'select guardar_opinion($1, $2, $3) opinion_id',
  [plataforma.id, 8, 'Una experiencia suficientemente detallada y útil para otras personas.']))[0].opinion_id;
paso('guardar_opinion crea y devuelve un UUID opaco', /^[0-9a-f-]{36}$/i.test(opinionId));

await rechaza(
  "update opiniones set estado='oculta', denuncias=99 where opinion_id=$1",
  [opinionId], 'cambiar estado o contador directamente', '42501');
await rechaza(
  `insert into denuncias(denunciante_id,usuario_id,plataforma_id,opinion_id,motivo)
   values ($1,$1,$2,$3,'ataque')`,
  [autor.id, plataforma.id, opinionId], 'forjar una denuncia directa', '42501');

const propia = (await filas(db, 'select * from mis_opiniones where opinion_id=$1', [opinionId]))[0];
paso('el intento no cambia estado ni contador', propia.estado === 'visible' && propia.denuncias === 0);
await rechaza("select denunciar_opinion($1,'propia')", [opinionId], 'denunciar la opinión propia', 'P0001');

await sesion(db, null, 'anon');
const publica = (await filas(db, 'select * from opiniones_publicas where opinion_id=$1', [opinionId]))[0];
paso('la vista pública expone opinion_id pero ningún identificador personal',
  publica.opinion_id === opinionId
  && !Object.keys(publica).some((k) => /usuario|user|email|correo/i.test(k)));

// Flujo válido de denuncia. El servidor deriva autor y denunciante.
await sesion(db, r1.id, 'authenticated');
await filas(db, "select denunciar_opinion($1,'contenido engañoso')", [opinionId]);
await rechaza("select denunciar_opinion($1,'repetida')", [opinionId], 'denunciar dos veces', '23505');
await sesion(db, r2.id, 'authenticated');
await filas(db, "select denunciar_opinion($1,'sin pruebas')", [opinionId]);
await sesion(db, r3.id, 'authenticated');
await filas(db, "select denunciar_opinion($1,'posible suplantación')", [opinionId]);
await sesion(db);
let estado = (await filas(db, 'select estado,denuncias from opiniones where opinion_id=$1', [opinionId]))[0];
paso('tres denunciantes distintos ocultan y contabilizan la opinión',
  estado.estado === 'oculta' && estado.denuncias === 3);

// Al borrar un denunciante, la cascada corrige el contador, pero una
// retirada no reaparece sin decisión humana.
await filas(db, 'delete from auth.users where id=$1', [r3.id]);
estado = (await filas(db, 'select estado,denuncias from opiniones where opinion_id=$1', [opinionId]))[0];
paso('borrar un denunciante corrige el contador sin restaurar contenido',
  estado.estado === 'oculta' && estado.denuncias === 2);

// Solo service_role concede administración; el admin modera por ID opaco.
await sesion(db, null, 'service_role');
await filas(db, 'select establecer_admin($1,true)', [admin.id]);
await sesion(db, admin.id, 'authenticated');
await filas(db, "select moderar($1,'restaurar','revisada por una persona')", [opinionId]);
await sesion(db);
estado = (await filas(db, 'select estado,denuncias from opiniones where opinion_id=$1', [opinionId]))[0];
paso('la moderación válida restaura y limpia denuncias',
  estado.estado === 'visible' && estado.denuncias === 0
  && (await filas(db, 'select count(*)::int n from denuncias where opinion_id=$1', [opinionId]))[0].n === 0);

// Supresión: los datos de cuenta y contenido desaparecen; el rastro de
// decisión sobrevive sin UUID del autor/moderador que ya se borraron.
await sesion(db, admin.id, 'authenticated');
await filas(db, 'select borrar_mi_cuenta()');
await sesion(db, autor.id, 'authenticated');
await filas(db, 'select borrar_mi_cuenta()');
await sesion(db);
const rastro = (await filas(db, 'select moderador_id,usuario_id,opinion_id from moderacion'))[0];
paso('borrar cuentas elimina perfil, opinión y denuncias relacionadas',
  (await filas(db, 'select count(*)::int n from perfiles where id in ($1,$2)', [autor.id, admin.id]))[0].n === 0
  && (await filas(db, 'select count(*)::int n from opiniones where opinion_id=$1', [opinionId]))[0].n === 0
  && (await filas(db, 'select count(*)::int n from denuncias where opinion_id=$1', [opinionId]))[0].n === 0);
paso('el historial necesario sobrevive anonimizado',
  rastro && rastro.moderador_id === null && rastro.usuario_id === null && rastro.opinion_id === opinionId);

informe('PRUEBAS DE SEGURIDAD INTEGRAL', ok, fail);
await db.close();

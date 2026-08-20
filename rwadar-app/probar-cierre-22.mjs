/* Regresión completa: demuestra la reapertura de 16 y el cierre de 22. */
import fs from 'node:fs';
import {
  MIGRACIONES, baseConMigraciones, leerMigracion, filas, sesion, informe,
} from './pruebas-soporte.mjs';

const hasta15 = MIGRACIONES.slice(0, MIGRACIONES.indexOf('17_avisos_push.sql'));
const db = await baseConMigraciones(hasta15);
const ok = [], fail = [];
const paso = (texto, condicion) => (condicion ? ok : fail).push(texto);
const rechaza = async (sql, params, texto) => {
  try {
    await db.query(sql, params);
    fail.push(`NO rechaza: ${texto}`);
  } catch {
    ok.push(`rechaza ${texto}`);
  }
};

// Reproduce el orden histórico que llegó a producción: 14/15 seguras,
// después 16 y las novedades 17-21.
await db.exec(leerMigracion('16_reparacion.sql'));
for (const nombre of [
  '17_avisos_push.sql', '18_emisiones.sql', '19_emisiones_estados.sql',
  '20_emisiones_realidad.sql', '21_emisiones_continuas.sql',
]) {
  await db.exec(leerMigracion(nombre));
}
paso('17 instala capacidad push apagada y sin cron automático',
  !(await filas(db, 'select habilitado from push_configuracion where singleton'))[0]
    .habilitado
  && (await filas(db, "select count(*)::int n from cron.job where jobname='rwadar-push'"))[0]
    .n === 0);

// Simula una fila pendiente creada por la versión histórica de 17 antes de
// apagar el servicio. 22 debe cerrarla y minimizar su copia del token.
const [plataformaLegada] = await filas(db,
  "select id from plataformas where slug='reental'");
await filas(db, `insert into dispositivos(instalacion,token_push,sistema)
  values('inst-legada','ExponentPushToken[legada]','android')`);
const [cambioLegado] = await filas(db, `insert into cambios_estado
  (plataforma_id,estado_nuevo,titular) values($1,'en_radar','Pendiente legado')
  returning id`, [plataformaLegada.id]);
const [colaLegada] = await filas(db, `insert into avisos_push
  (cambio_id,instalacion,token) values($1,'inst-legada','ExponentPushToken[legada]')
  returning id`, [cambioLegado.id]);

let permisos = (await filas(db, `select
  has_column_privilege('anon','opiniones','usuario_id','SELECT') anon_uuid,
  has_table_privilege('authenticated','opiniones','INSERT') op_insert,
  has_table_privilege('authenticated','denuncias','INSERT') den_insert`))[0];
paso('el escenario reproduce la regresión de permisos de 16',
  permisos.anon_uuid && permisos.op_insert && permisos.den_insert);
paso('el escenario reproduce la firma de moderación obsoleta',
  (await filas(db, "select to_regprocedure('moderar(uuid,uuid,text,text)') is not null x"))[0].x);

const sql22 = fs.readFileSync('db/22_cierre_regresiones.sql', 'utf8');
await db.exec(sql22);
await db.exec(sql22);
paso('22 se aplica y reaplica sin perder objetos', true);
await db.exec(fs.readFileSync('db/22_cierre_regresiones_verificar.sql', 'utf8'));
paso('el verificador fail-closed de 22 pasa', true);

let [estadoPush] = await filas(db, `select
  (select habilitado from push_configuracion where singleton) habilitado,
  (select count(*)::int from cron.job where jobname='rwadar-push') relojes,
  (select count(*)::int from cron.job
    where jobname='rwadar-retencion-dispositivos') retencion`);
paso('22 deja push apagado y conserva solo la retención diaria',
  !estadoPush.habilitado && estadoPush.relojes === 0 && estadoPush.retencion === 1);
const [legadaCerrada] = await filas(db,
  'select token,intentos,error from avisos_push where id=$1', [colaLegada.id]);
paso('22 minimiza y termina cualquier cola heredada pendiente',
  legadaCerrada.token === null && legadaCerrada.intentos === 5
  && legadaCerrada.error === 'Push desactivado por cierre 22');
await rechaza('select push_ciclo()', [], 'enviar push antes del opt-in');
paso('el estado apagado no produjo peticiones de red',
  (await filas(db, 'select count(*)::int n from net._peticiones'))[0].n === 0);

await db.exec(fs.readFileSync('db/activar_push.sql', 'utf8'));
await db.exec(fs.readFileSync('db/activar_push_verificar.sql', 'utf8'));
estadoPush = (await filas(db, `select
  (select habilitado from push_configuracion where singleton) habilitado,
  (select count(*)::int from cron.job where jobname='rwadar-push') relojes`))[0];
paso('solo el artefacto opt-in habilita y agenda push',
  estadoPush.habilitado && estadoPush.relojes === 1);

permisos = (await filas(db, `select
  has_column_privilege('anon','opiniones','usuario_id','SELECT') anon_uuid,
  has_table_privilege('authenticated','opiniones','INSERT') op_insert,
  has_table_privilege('authenticated','opiniones','UPDATE') op_update,
  has_table_privilege('authenticated','opiniones','DELETE') op_delete,
  has_table_privilege('authenticated','denuncias','INSERT') den_insert`))[0];
paso('22 vuelve a ocultar UUID y cierra toda escritura directa',
  !permisos.anon_uuid && !permisos.op_insert && !permisos.op_update
  && !permisos.op_delete && !permisos.den_insert);
paso('22 elimina la firma obsoleta y conserva la RPC por opinion_id',
  !(await filas(db, "select to_regprocedure('moderar(uuid,uuid,text,text)') is not null x"))[0].x
  && (await filas(db, "select to_regprocedure('moderar(uuid,text,text)') is not null x"))[0].x);

await sesion(db, null, 'anon');
await rechaza('select usuario_id from opiniones', [], 'que anon lea el UUID del autor');
await sesion(db);

const recuentos = await filas(db,
  'select estado::text, count(*)::int n from plataformas group by estado');
paso('fresh-install mantiene paridad 26 en radar y 4 descartadas',
  recuentos.find((r) => r.estado === 'en_radar')?.n === 26
  && recuentos.find((r) => r.estado === 'descartada')?.n === 4);

const vistas = await filas(db, `select relname,coalesce(reloptions,array[]::text[]) opciones
  from pg_class where relname in ('emisiones_publicas','emisiones_rancias')`);
paso('las dos vistas de emisiones respetan RLS del invocador',
  vistas.length === 2 && vistas.every((v) => v.opciones.includes('security_invoker=true')));

const [categoria] = await filas(db, 'select slug from categorias order by orden limit 1');
const [plataformaEmision] = await filas(db,
  "select id from plataformas where slug='reental'");
await filas(db, `insert into emisiones
  (plataforma_id,slug,titulo,categoria_slug,url,estado,continua,disponible_es)
  values($1,'prueba-continua','Producto continuo verificable',$2,
         'https://ejemplo.invalid/producto','abierta',true,true)`,
  [plataformaEmision.id, categoria.slug]);
const [emisionActual] = await filas(db, `select continua,disponible_es,ticket_minimo,
  cierra_el from emisiones_publicas where slug='prueba-continua'`);
paso('19-21 admiten oferta continua sin cierre ni ticket inventado',
  emisionActual.continua && emisionActual.disponible_es
  && emisionActual.ticket_minimo === null && emisionActual.cierra_el === null);
await rechaza(`insert into emisiones
  (plataforma_id,slug,titulo,categoria_slug,url,estado,continua,objetivo)
  values($1,'continua-incoherente','Producto continuo incoherente',$2,
         'https://ejemplo.invalid/invalido','abierta',true,1000)`,
  [plataformaEmision.id, categoria.slug], 'un producto continuo con objetivo');
paso('los estados programada y en_estudio existen en el fresh-install',
  (await filas(db, `select enum_range(null::rwa_emision)::text estados`))[0].estados
    .includes('programada')
  && (await filas(db, `select enum_range(null::rwa_emision)::text estados`))[0].estados
    .includes('en_estudio'));

// Rotación de token mientras una petición está en vuelo: un error para el
// token viejo nunca debe borrar el nuevo que acaba de registrar la app.
const [plataforma] = await filas(db, "select id from plataformas where slug='reental'");
await filas(db, `insert into dispositivos(instalacion,token_push,sistema)
  values('inst-rotacion','ExponentPushToken[viejo]','android')`);
await filas(db, `insert into seguimiento(instalacion,plataforma_id)
  values('inst-rotacion',$1)`, [plataforma.id]);
const [cambioViejo] = await filas(db, `insert into cambios_estado
  (plataforma_id,estado_anterior,estado_nuevo,titular,detalle)
  values($1,'en_radar','descartada','Cambio de prueba','Detalle') returning id`, [plataforma.id]);
await filas(db, 'select push_soltar()');
const [colaVieja] = await filas(db,
  'select id,peticion_id from avisos_push where cambio_id=$1', [cambioViejo.id]);
await filas(db, `update dispositivos set token_push='ExponentPushToken[nuevo]'
  where instalacion='inst-rotacion'`);
await filas(db, `insert into net._http_response(id,status_code,content,error_msg)
  values($1,200,$2,null)`, [colaVieja.peticion_id,
  JSON.stringify({ data: { status: 'error', details: { error: 'DeviceNotRegistered' } } })]);
await filas(db, 'select push_confirmar()');
const [dispositivo] = await filas(db,
  "select token_push from dispositivos where instalacion='inst-rotacion'");
const [fallido] = await filas(db,
  'select token,intentos,error from avisos_push where id=$1', [colaVieja.id]);
paso('un fallo del token viejo no borra el token rotado',
  dispositivo.token_push === 'ExponentPushToken[nuevo]');
paso('la cola finalizada elimina la copia del token',
  fallido.token === null && fallido.intentos === 5 && fallido.error === 'DeviceNotRegistered');

const [cambioOk] = await filas(db, `insert into cambios_estado
  (plataforma_id,estado_anterior,estado_nuevo,titular,detalle)
  values($1,'descartada','en_radar','Otro cambio','Detalle') returning id`, [plataforma.id]);
await filas(db, 'select push_soltar()');
const [colaOk] = await filas(db,
  'select id,peticion_id from avisos_push where cambio_id=$1', [cambioOk.id]);
await filas(db, `insert into net._http_response(id,status_code,content,error_msg)
  values($1,200,$2,null)`, [colaOk.peticion_id, JSON.stringify({ data: { status: 'ok' } })]);
// La forma de producción puede ser un array aun con un solo destinatario.
await filas(db, 'delete from net._http_response where id=$1', [colaOk.peticion_id]);
await filas(db, `insert into net._http_response(id,status_code,content,error_msg)
  values($1,200,$2,null)`, [colaOk.peticion_id,
  JSON.stringify({ data: [{ status: 'ok', id: 'ticket-prueba-ok' }] })]);
await filas(db, 'select push_confirmar()');
let [enviado] = await filas(db, `select token,enviado_el,ticket_id,ticket_el,peticion_id
  from avisos_push where id=$1`, [colaOk.id]);
paso('un ticket aceptado aún no se inventa como entrega',
  enviado.enviado_el === null && enviado.ticket_id === 'ticket-prueba-ok'
  && enviado.token === 'ExponentPushToken[nuevo]' && enviado.peticion_id === null);
paso('el cambio sigue pendiente mientras no exista recibo',
  (await filas(db, 'select notificado_el from cambios_estado where id=$1', [cambioOk.id]))[0]
    .notificado_el === null);

await filas(db, `update avisos_push
  set ticket_el=now()-interval '16 minutes', recibo_consultado_el=null
  where id=$1`, [colaOk.id]);
paso('tras 15 minutos solicita el recibo sin reenviar el push',
  (await filas(db, 'select push_soltar() n'))[0].n === 1);
const [consulta] = await filas(db, `select a.peticion_id,p.url,p.body
  from avisos_push a join net._peticiones p on p.id=a.peticion_id
  where a.id=$1`, [colaOk.id]);
paso('consulta getReceipts con el identificador exacto del ticket',
  consulta.url === 'https://exp.host/--/api/v2/push/getReceipts'
  && consulta.body.ids?.[0] === 'ticket-prueba-ok');

await filas(db, `insert into net._http_response(id,status_code,content,error_msg)
  values($1,200,$2,null)`, [consulta.peticion_id,
  JSON.stringify({ data: { 'ticket-prueba-ok': { status: 'ok' } } })]);
paso('solo el recibo positivo confirma la entrega',
  (await filas(db, 'select push_confirmar() n'))[0].n === 1);
[enviado] = await filas(db,
  'select token,enviado_el from avisos_push where id=$1', [colaOk.id]);
paso('al confirmar minimiza el token copiado',
  enviado.enviado_el !== null && enviado.token === null);

await filas(db, "update avisos_push set creado_el=now()-interval '31 days' where id=$1", [colaOk.id]);
await filas(db, 'select push_confirmar()');
paso('el rastro push finalizado caduca a los 30 días',
  (await filas(db, 'select count(*)::int n from avisos_push where id=$1', [colaOk.id]))[0].n === 0);

await db.exec(fs.readFileSync('db/push_fallo_cerrado.sql', 'utf8'));
[estadoPush] = await filas(db, `select
  (select habilitado from push_configuracion where singleton) habilitado,
  (select count(*)::int from cron.job where jobname='rwadar-push') relojes,
  (select count(*)::int from cron.job
    where jobname='rwadar-retencion-dispositivos') retencion`);
paso('el cierre limitado apaga push sin detener la retención',
  !estadoPush.habilitado && estadoPush.relojes === 0 && estadoPush.retencion === 1);

informe('CIERRE DE REGRESIONES 22', ok, fail);
await db.close();

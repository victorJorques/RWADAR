/* Prueba del contrato push VIGENTE (17 + cierre 22), sin llamadas de red. */
import fs from 'node:fs';
import {
  baseCompleta, filas, informe,
} from './pruebas-soporte.mjs';

const db = await baseCompleta();
const ok = [], fail = [];
const paso = (texto, condicion) => (condicion ? ok : fail).push(texto);
const una = async (sql, params = []) => (await filas(db, sql, params))[0];
const rechaza = async (sql, texto) => {
  try {
    await filas(db, sql);
    fail.push(`NO rechaza: ${texto}`);
  } catch {
    ok.push(`rechaza ${texto}`);
  }
};

const plataforma = await una(
  "select id,slug from plataformas where slug='reental'",
);
const apagadoInicial = await una(`select
  (select habilitado from push_configuracion where singleton) habilitado,
  (select count(*)::int from cron.job where jobname='rwadar-push') relojes,
  (select count(*)::int from cron.job
    where jobname='rwadar-retencion-dispositivos') retencion`);
paso('fresh-install deja push apagado, sin cron y con retención diaria',
  !apagadoInicial.habilitado && apagadoInicial.relojes === 0
  && apagadoInicial.retencion === 1);
await rechaza('select push_soltar()', 'enviar antes del opt-in');
paso('el intento apagado no crea ninguna petición de red',
  (await una('select count(*)::int n from net._peticiones')).n === 0);

for (const [instalacion, token] of [
  ['inst_push_ana', 'ExponentPushToken[ana]'],
  ['inst_push_luis', 'ExponentPushToken[luis]'],
]) {
  await filas(db, `insert into dispositivos(instalacion,token_push,sistema)
    values($1,$2,'android')`, [instalacion, token]);
  await filas(db, `insert into seguimiento(instalacion,plataforma_id)
    values($1,$2)`, [instalacion, plataforma.id]);
}

const cambioApagado = await una(`insert into cambios_estado
  (plataforma_id,estado_nuevo,titular) values($1,'en_radar','Push apagado')
  returning id`, [plataforma.id]);
paso('apagado tampoco copia tokens a la cola',
  (await una('select count(*)::int n from avisos_push where cambio_id=$1',
    [cambioApagado.id])).n === 0);

await db.exec(fs.readFileSync('db/activar_push.sql', 'utf8'));
await db.exec(fs.readFileSync('db/activar_push_verificar.sql', 'utf8'));
paso('solo el opt-in explícito habilita y agenda el reloj push',
  (await una('select habilitado from push_configuracion where singleton')).habilitado
  && (await una("select count(*)::int n from cron.job where jobname='rwadar-push'"))
    .n === 1);

const cambio = await una(`insert into cambios_estado
  (plataforma_id,estado_anterior,estado_nuevo,titular,detalle)
  values($1,'en_radar','descartada','Cambio push','Detalle comprobable')
  returning id`, [plataforma.id]);
paso('encola un aviso independiente por cada dispositivo con token',
  (await una('select count(*)::int n from avisos_push where cambio_id=$1',
    [cambio.id])).n === 2);

paso('valida el tamaño de tanda antes de hablar con Expo',
  await (async () => {
    try { await filas(db, 'select push_soltar(0)'); return false; } catch { return true; }
  })());
paso('suelta las dos peticiones iniciales',
  (await una('select push_soltar() n')).n === 2);

const ana = await una(`select * from avisos_push
  where cambio_id=$1 and instalacion='inst_push_ana'`, [cambio.id]);
const luis = await una(`select * from avisos_push
  where cambio_id=$1 and instalacion='inst_push_luis'`, [cambio.id]);
const peticionAna = await una(
  'select url,body from net._peticiones where id=$1', [ana.peticion_id],
);
paso('envía a la API de Expo el token y datos para abrir la ficha',
  peticionAna.url === 'https://exp.host/--/api/v2/push/send'
  && peticionAna.body.to === 'ExponentPushToken[ana]'
  && peticionAna.body.data.slug === plataforma.slug);
paso('una petición en vuelo no se vuelve a soltar',
  (await una('select push_soltar() n')).n === 0);

// Expo acepta Ana (forma array) y rechaza el payload de Luis dentro de un 200.
await filas(db, `insert into net._http_response(id,status_code,content,error_msg)
  values($1,200,$2,null),($3,200,$4,null)`, [
  ana.peticion_id,
  JSON.stringify({ data: [{ status: 'ok', id: 'ticket-ana' }] }),
  luis.peticion_id,
  JSON.stringify({
    data: { status: 'error', details: { error: 'MessageTooBig' } },
  }),
]);
paso('aceptar el ticket no cuenta todavía como entrega',
  (await una('select push_confirmar() n')).n === 0);
const ticketAna = await una(
  'select ticket_id,enviado_el,token from avisos_push where id=$1', [ana.id],
);
const errorLuis = await una(
  'select peticion_id,enviado_el,error from avisos_push where id=$1', [luis.id],
);
paso('guarda el ticket y conserva el token solo hasta consultar el recibo',
  ticketAna.ticket_id === 'ticket-ana' && ticketAna.enviado_el === null
  && ticketAna.token === 'ExponentPushToken[ana]');
paso('un error dentro de HTTP 200 vuelve a la cola, no se da por enviado',
  errorLuis.peticion_id === null && errorLuis.enviado_el === null
  && errorLuis.error === 'MessageTooBig');
paso('el cambio sigue pendiente con cualquier dispositivo sin resolver',
  (await una('select notificado_el from cambios_estado where id=$1', [cambio.id]))
    .notificado_el === null);

// Un error para el token antiguo no puede borrar uno rotado mientras estaba
// en vuelo. Esta segunda petición termina a Luis de forma controlada.
await filas(db, 'select push_soltar()');
const reintentoLuis = await una(
  'select peticion_id from avisos_push where id=$1', [luis.id],
);
await filas(db, `update dispositivos set token_push='ExponentPushToken[luis-nuevo]'
  where instalacion='inst_push_luis'`);
await filas(db, `insert into net._http_response(id,status_code,content,error_msg)
  values($1,200,$2,null)`, [reintentoLuis.peticion_id,
  JSON.stringify({
    data: { status: 'error', details: { error: 'DeviceNotRegistered' } },
  })]);
await filas(db, 'select push_confirmar()');
const luisFinal = await una(
  'select intentos,token,error from avisos_push where id=$1', [luis.id],
);
paso('DeviceNotRegistered termina el token enviado y minimiza su copia',
  luisFinal.intentos === 5 && luisFinal.token === null
  && luisFinal.error === 'DeviceNotRegistered');
paso('el error del token viejo conserva el token recién rotado',
  (await una(`select token_push from dispositivos
    where instalacion='inst_push_luis'`)).token_push
    === 'ExponentPushToken[luis-nuevo]');

// Expo recomienda consultar el recibo unos 15 minutos después. Una respuesta
// vacía conserva el ticket y no reenvía la notificación.
await filas(db, `update avisos_push
  set ticket_el=now()-interval '16 minutes', recibo_consultado_el=null
  where id=$1`, [ana.id]);
paso('solicita un recibo pasados 15 minutos',
  (await una('select push_soltar() n')).n === 1);
let consultaAna = await una(`select a.peticion_id,p.url,p.body
  from avisos_push a join net._peticiones p on p.id=a.peticion_id
  where a.id=$1`, [ana.id]);
paso('getReceipts lleva exactamente el ticket de esa fila',
  consultaAna.url === 'https://exp.host/--/api/v2/push/getReceipts'
  && consultaAna.body.ids?.[0] === 'ticket-ana');
await filas(db, `insert into net._http_response(id,status_code,content,error_msg)
  values($1,200,'{"data":{}}',null)`, [consultaAna.peticion_id]);
await filas(db, 'select push_confirmar()');
paso('un recibo aún ausente no entrega ni reenvía el push',
  (await una(`select enviado_el,ticket_id,peticion_id
    from avisos_push where id=$1`, [ana.id])).enviado_el === null);

await filas(db, `update avisos_push
  set recibo_consultado_el=now()-interval '16 minutes' where id=$1`, [ana.id]);
await filas(db, 'select push_soltar()');
consultaAna = await una(
  'select peticion_id from avisos_push where id=$1', [ana.id],
);
await filas(db, `insert into net._http_response(id,status_code,content,error_msg)
  values($1,200,$2,null)`, [consultaAna.peticion_id,
  JSON.stringify({ data: { 'ticket-ana': { status: 'ok' } } })]);
paso('solo un recibo positivo confirma una entrega',
  (await una('select push_confirmar() n')).n === 1);
const anaFinal = await una(
  'select enviado_el,token from avisos_push where id=$1', [ana.id],
);
paso('la entrega confirmada elimina la copia del token',
  anaFinal.enviado_el !== null && anaFinal.token === null);
paso('el cambio se cierra cuando todas sus filas están entregadas o terminales',
  (await una('select notificado_el from cambios_estado where id=$1', [cambio.id]))
    .notificado_el !== null);

// Un ticket sin recibo al caducar la ventana de Expo jamás pasa por entregado.
await filas(db, `delete from seguimiento where instalacion='inst_push_luis'`);
const cambioCaducado = await una(`insert into cambios_estado
  (plataforma_id,estado_nuevo,titular) values($1,'en_radar','Caducidad recibo')
  returning id`, [plataforma.id]);
const colaAntesDelQuinto = await una(
  'select id from avisos_push where cambio_id=$1', [cambioCaducado.id],
);
await filas(db, 'update avisos_push set intentos=4 where id=$1',
  [colaAntesDelQuinto.id]);
await filas(db, 'select push_soltar()');
const colaCaducada = await una(
  'select id,peticion_id from avisos_push where cambio_id=$1', [cambioCaducado.id],
);
await filas(db, `insert into net._http_response(id,status_code,content,error_msg)
  values($1,200,$2,null)`, [colaCaducada.peticion_id,
  JSON.stringify({ data: { status: 'ok', id: 'ticket-caducado' } })]);
await filas(db, 'select push_confirmar()');
const quintoAceptado = await una(
  'select intentos,ticket_id from avisos_push where id=$1', [colaCaducada.id],
);
paso('un ticket aceptado al quinto intento todavía pasa a fase de recibo',
  quintoAceptado.intentos === 0
  && quintoAceptado.ticket_id === 'ticket-caducado');
await filas(db, `update avisos_push set ticket_el=now()-interval '25 hours'
  where id=$1`, [colaCaducada.id]);
await filas(db, 'select push_soltar()');
const caducada = await una(
  'select intentos,enviado_el,error,token from avisos_push where id=$1',
  [colaCaducada.id],
);
paso('un recibo caducado termina como error, nunca como entrega',
  caducada.intentos === 5 && caducada.enviado_el === null
  && caducada.error === 'Recibo de Expo caducado' && caducada.token === null);

const reloj = await una(
  "select schedule,command from cron.job where jobname='rwadar-push'",
);
paso('el opt-in mantiene un único reloj push cada dos minutos',
  reloj?.schedule === '*/2 * * * *'
  && (await una("select count(*)::int n from cron.job where jobname='rwadar-push'"))
    .n === 1);
for (const funcion of ['push_soltar', 'push_confirmar', 'push_ciclo']) {
  paso(`${funcion} no es invocable por authenticated`,
    !(await una(`select has_function_privilege(
      'authenticated',p.oid,'execute') permiso
      from pg_proc p where p.proname=$1`, [funcion])).permiso);
}
for (const rol of ['anon', 'authenticated']) {
  paso(`${rol} no puede leer la cola y RLS sigue activo`,
    !(await una("select has_table_privilege($1,'avisos_push','select') permiso",
      [rol])).permiso
    && (await una(`select relrowsecurity activo from pg_class
      where oid='avisos_push'::regclass`)).activo);
}

await rechaza('select push_soltar(101)', 'una tanda superior a 100');
informe('PUSH CON TICKETS Y RECIBOS REALES', ok, fail);
await db.close();

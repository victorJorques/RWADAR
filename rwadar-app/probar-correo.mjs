/* Contrato local del opt-in de correo 23. pg_net, cron y Vault son dobles
   embebidos: la prueba no usa red ni toca ningún proyecto Supabase. */
import fs from 'node:fs';
import {
  alta, baseCompleta, filas, informe, sesion,
} from './pruebas-soporte.mjs';

const activarSql = fs.readFileSync('db/23_activar_correo.sql', 'utf8');
const verificarSql = fs.readFileSync('db/23_activar_correo_verificar.sql', 'utf8');
const cerrarSql = fs.readFileSync('db/correo_fallo_cerrado.sql', 'utf8');
const ok = [], fail = [];
const paso = (texto, condicion) => (condicion ? ok : fail).push(texto);
const una = async (db, sql, params = []) => (await filas(db, sql, params))[0];
const rechaza = async (db, sql, texto) => {
  try {
    await filas(db, sql);
    fail.push(`NO rechaza: ${texto}`);
  } catch {
    ok.push(`rechaza ${texto}`);
  }
};

// Sin los dos secretos, toda la transacción de activación debe abortar.
const sinVault = await baseCompleta();
let falloVault = false;
try {
  await sinVault.exec(activarSql);
} catch (error) {
  falloVault = /Vault|credenciales|BREVO/i.test(String(error));
}
paso('sin Vault la activación aborta antes de dejar correo operativo', falloVault);
await sinVault.close();

const db = await baseCompleta();
const plataforma = await una(db,
  "select id from plataformas where slug='reental'");
const ana = await alta(db, 'ana-correo@example.com', { nombre: 'Ana' });
await filas(db, 'insert into vigilancia(usuario_id,plataforma_id) values($1,$2)',
  [ana.id, plataforma.id]);

// Este cambio ocurre con 22 apagado y no debe salir de golpe al activar 23.
const [historico] = await filas(db, `insert into cambios_estado
  (plataforma_id,estado_nuevo,titular)
  values($1,'en_radar','Aviso histórico') returning id`, [plataforma.id]);
const [colaHistorica] = await filas(db,
  'select id from avisos_correo where cambio_id=$1', [historico.id]);

await filas(db, `insert into vault.decrypted_secrets(name,decrypted_secret)
  values('BREVO_API_KEY','xkeysib-clave-local-larga-no-real-123456789'),
        ('RWADAR_REMITENTE','avisos@rwadar.example')`);
await db.exec(activarSql);
await db.exec(verificarSql);

const estado = await una(db, `select
  (select habilitado from correo_configuracion where singleton) habilitado,
  (select origen_https from correo_configuracion where singleton) origen,
  (select count(*)::int from cron.job where jobname='rwadar-avisos') relojes,
  (select count(*)::int from cron.job
    where jobname='rwadar-retencion-dispositivos') retencion`);
paso('23 activa un flag auditable con el origen Cloudflare exacto',
  estado.habilitado && estado.origen === 'https://rwadar.pages.dev');
paso('23 deja un solo reloj de correo y conserva la retención diaria',
  estado.relojes === 1 && estado.retencion === 1);
const historicoFinal = await una(db,
  'select intentos,peticion_id,error from avisos_correo where id=$1',
  [colaHistorica.id]);
paso('la activación conserva pero no dispara la cola histórica',
  historicoFinal.intentos === 5 && historicoFinal.peticion_id === null
  && /anterior a la activación/.test(historicoFinal.error));
paso('activar no produjo llamadas de red para el histórico',
  (await una(db, 'select count(*)::int n from net._peticiones')).n === 0);

// Reaplicar debe conservar la frontera original y recomponer un único cron.
const activadoPrimero = (await una(db,
  'select activado_el from correo_configuracion where singleton')).activado_el;
await db.exec(`grant update on correo_configuracion to service_role;
  grant execute on function avisos_soltar(integer) to service_role;
  grant select on vault.decrypted_secrets to anon;`);
await db.exec(activarSql);
await db.exec(verificarSql);
const activadoSegundo = (await una(db,
  'select activado_el from correo_configuracion where singleton')).activado_el;
paso('23 es idempotente y conserva la fecha de la primera activación',
  String(activadoPrimero) === String(activadoSegundo)
  && (await una(db,
    "select count(*)::int n from cron.job where jobname='rwadar-avisos'")).n === 1);
paso('reaplicar 23 elimina ACL hostil previa de service_role',
  !(await una(db, `select has_table_privilege(
    'service_role','correo_configuracion','update') p`)).p
  && (await una(db, `select has_table_privilege(
    'service_role','correo_configuracion','select') p`)).p
  && !(await una(db, `select has_function_privilege(
    'service_role','avisos_soltar(integer)','execute') p`)).p
  && !(await una(db, `select has_table_privilege(
    'anon','vault.decrypted_secrets','select') p`)).p);

paso('23 invalida el true heredado porque no prueba consentimiento',
  !(await una(db, `select avisos_correo from perfiles where id=$1`,
    [ana.id])).avisos_correo);
await sesion(db, ana.id, 'authenticated');
await rechaza(db, `update perfiles set avisos_correo=true where id=auth.uid()`,
  'activar correo con PATCH directo sin consentimiento versionado');
await rechaza(db, `select configurar_avisos_correo(true,'texto-antiguo')`,
  'aceptar una versión de consentimiento incorrecta');
const consentimiento = await una(db,
  `select * from configurar_avisos_correo(true,'correo-v1-2026-08-22')`);
await sesion(db);
paso('solo la RPC autenticada registra opt-in afirmativo, fecha y versión',
  consentimiento.habilitado && consentimiento.aceptado_el !== null
  && consentimiento.version === 'correo-v1-2026-08-22');
const nuevoSinOptIn = await alta(db, 'nuevo-sin-optin@example.com');
paso('un perfil nuevo nace con correo apagado',
  !(await una(db, 'select avisos_correo from perfiles where id=$1',
    [nuevoSinOptIn.id])).avisos_correo);

// Los campos que llegan al HTML se prueban con un payload hostil.
await filas(db, "update perfiles set nombre='<b>Ana</b>' where id=$1", [ana.id]);
await filas(db, `update plataformas
  set nombre='<img src=x onerror="mal"> & Plataforma' where id=$1`, [plataforma.id]);
const [cambio] = await filas(db, `insert into cambios_estado
  (plataforma_id,estado_anterior,estado_nuevo,titular,detalle)
  values($1,'en_radar','descartada',$2,$3) returning id`, [
  plataforma.id,
  '<script>alert("x")</script> & titular',
  'Detalle <b>no fiable</b> & "texto"',
]);
paso('el cambio posterior a la activación se encola una sola vez',
  (await una(db,
    'select count(*)::int n from avisos_correo where cambio_id=$1',
    [cambio.id])).n === 1);
paso('el tamaño de tanda se valida antes de hablar con Brevo',
  await (async () => {
    try { await filas(db, 'select avisos_soltar(0)'); return false; } catch { return true; }
  })());
paso('el ciclo suelta exactamente el aviso nuevo',
  (await una(db, 'select avisos_soltar() n')).n === 1);

const peticion = await una(db, `select p.id,p.url,p.headers,p.body,p.timeout_milliseconds
  from net._peticiones p
  join avisos_correo a on a.peticion_id=p.id
  where a.cambio_id=$1`, [cambio.id]);
const html = peticion.body.htmlContent;
paso('el correo usa Brevo y enlaza únicamente a rwadar.pages.dev',
  peticion.url === 'https://api.brevo.com/v3/smtp/email'
  && peticion.timeout_milliseconds === 10000
  && html.includes('href="https://rwadar.pages.dev/"')
  && !html.toLowerCase().includes('netlify'));
paso('titular, detalle y plataforma quedan escapados en el HTML',
  html.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; titular')
  && html.includes('Detalle &lt;b&gt;no fiable&lt;/b&gt; &amp; &quot;texto&quot;')
  && html.includes('&lt;img src=x onerror=&quot;mal&quot;&gt; &amp; Plataforma')
  && !html.includes('<script>') && !html.includes('<img src=x'));
paso('la clave solo viaja en la cabecera privada de pg_net, no en el cuerpo',
  peticion.headers['api-key'] === 'xkeysib-clave-local-larga-no-real-123456789'
  && !JSON.stringify(peticion.body).includes('xkeysib-'));
paso('Brevo recibe UUID idempotente persistido y tracking por contacto apagado',
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(peticion.body.headers['Idempotency-Key'])
  && peticion.body.to[0].contactPixelTrackingConsent === false
  && peticion.body.to[0].name === undefined);

await filas(db, `insert into net._http_response(id,status_code,content,error_msg)
  values($1,201,'{"messageId":"local"}',null)`, [peticion.id]);
paso('solo Brevo 201 con messageId marca el aviso como aceptado',
  (await una(db, 'select avisos_confirmar() n')).n === 1
  && (await una(db, `select enviado_el,peticion_id,error,proveedor_mensaje_id
    from avisos_correo where cambio_id=$1`, [cambio.id])).enviado_el !== null
  && (await una(db, `select proveedor_mensaje_id
    from avisos_correo where cambio_id=$1`, [cambio.id])).proveedor_mensaje_id
    === 'local');

// Si pg_net pierde la respuesta, el reintento reutiliza la clave dentro del
// TTL de Brevo. duplicate_parameter prueba que el primer POST ya fue aceptado.
const [reintento] = await filas(db, `insert into cambios_estado
  (plataforma_id,estado_nuevo,titular)
  values($1,'en_radar','Idempotencia Brevo') returning id`, [plataforma.id]);
await filas(db, 'select avisos_soltar()');
let colaReintento = await una(db, `select id,peticion_id,idempotencia
  from avisos_correo where cambio_id=$1`, [reintento.id]);
const primeraPeticion = colaReintento.peticion_id;
await filas(db, `update avisos_correo
  set peticion_el=now()-interval '11 minutes' where id=$1`, [colaReintento.id]);
paso('una respuesta perdida se reintenta antes del TTL de Brevo',
  (await una(db, 'select avisos_soltar() n')).n === 1);
colaReintento = await una(db, `select id,peticion_id,idempotencia
  from avisos_correo where id=$1`, [colaReintento.id]);
const peticionesIdempotentes = await filas(db, `select id,body
  from net._peticiones where id in ($1,$2) order by id`,
  [primeraPeticion, colaReintento.peticion_id]);
paso('el reintento conserva exactamente el mismo UUID idempotente',
  peticionesIdempotentes.length === 2
  && peticionesIdempotentes[0].body.headers['Idempotency-Key']
    === peticionesIdempotentes[1].body.headers['Idempotency-Key']
  && peticionesIdempotentes[1].body.headers['Idempotency-Key']
    === colaReintento.idempotencia);
await filas(db, `insert into net._http_response(id,status_code,content,error_msg)
  values($1,400,'{"code":"duplicate_parameter"}',null)`,
  [colaReintento.peticion_id]);
paso('Brevo duplicate_parameter confirma aceptación previa sin tercer envío',
  (await una(db, 'select avisos_confirmar() n')).n === 1
  && (await una(db, `select enviado_el from avisos_correo where id=$1`,
    [colaReintento.id])).enviado_el !== null);

// Tres respuestas perdidas alcanzan el margen previo al TTL: no existe un
// cuarto POST que pudiera caer fuera de la deduplicación de Brevo.
const [incierto] = await filas(db, `insert into cambios_estado
  (plataforma_id,estado_nuevo,titular)
  values($1,'en_radar','Entrega incierta') returning id`, [plataforma.id]);
await filas(db, 'select avisos_soltar()');
let colaIncierta = await una(db, `select id,idempotencia,peticion_id
  from avisos_correo where cambio_id=$1`, [incierto.id]);
for (const minutos of [11, 21]) {
  await filas(db, `update avisos_correo
    set peticion_el=now()-interval '11 minutes',
        idempotencia_el=now()-($2::text || ' minutes')::interval
    where id=$1`, [colaIncierta.id, minutos]);
  await filas(db, 'select avisos_soltar()');
  colaIncierta = await una(db, `select id,idempotencia,peticion_id
    from avisos_correo where id=$1`, [colaIncierta.id]);
}
const peticionesTrasTres = (await una(db,
  'select count(*)::int n from net._peticiones')).n;
await filas(db, `update avisos_correo
  set peticion_el=now()-interval '11 minutes',
      idempotencia_el=now()-interval '31 minutes'
  where id=$1`, [colaIncierta.id]);
paso('tres respuestas perdidas terminan como inciertas antes de expirar el TTL',
  (await una(db, 'select avisos_soltar() n')).n === 0
  && (await una(db, `select intentos,error from avisos_correo where id=$1`,
    [colaIncierta.id])).intentos === 5
  && /Entrega incierta/.test((await una(db,
    'select error from avisos_correo where id=$1', [colaIncierta.id])).error)
  && (await una(db,
    'select count(*)::int n from net._peticiones')).n === peticionesTrasTres);

// Un fallo de Vault al soltar no puede deshacer una aceptación ya confirmada.
const [confirmaAunqueVaultCaiga] = await filas(db, `insert into cambios_estado
  (plataforma_id,estado_nuevo,titular)
  values($1,'en_radar','Confirmación durable') returning id`, [plataforma.id]);
await filas(db, 'select avisos_soltar()');
const colaDurable = await una(db, `select id,peticion_id from avisos_correo
  where cambio_id=$1`, [confirmaAunqueVaultCaiga.id]);
await filas(db, `insert into net._http_response(id,status_code,content,error_msg)
  values($1,201,'{"messageId":"durable-local"}',null)`, [colaDurable.peticion_id]);
await filas(db, "delete from vault.decrypted_secrets where name='BREVO_API_KEY'");
const cicloSinVault = (await una(db, 'select avisos_ciclo() resultado')).resultado;
paso('el ciclo conserva confirmaciones aunque Vault falle al soltar',
  /confirmados 1, soltados -1/.test(cicloSinVault)
  && (await una(db, `select enviado_el,proveedor_mensaje_id
    from avisos_correo where id=$1`, [colaDurable.id])).proveedor_mensaje_id
    === 'durable-local');
await filas(db, `insert into vault.decrypted_secrets(name,decrypted_secret)
  values('BREVO_API_KEY','xkeysib-clave-local-larga-no-real-123456789')`);

const [rechazoPermanente] = await filas(db, `insert into cambios_estado
  (plataforma_id,estado_nuevo,titular)
  values($1,'en_radar','Rechazo permanente') returning id`, [plataforma.id]);
await filas(db, 'select avisos_soltar()');
const colaRechazada = await una(db, `select id,peticion_id from avisos_correo
  where cambio_id=$1`, [rechazoPermanente.id]);
await filas(db, `insert into net._http_response(id,status_code,content,error_msg)
  values($1,401,'{"code":"unauthorized"}',null)`, [colaRechazada.peticion_id]);
await filas(db, 'select avisos_confirmar()');
paso('un 4xx permanente termina la fila y no consume cinco reintentos',
  (await una(db, `select intentos,peticion_id,error from avisos_correo
    where id=$1`, [colaRechazada.id])).intentos === 5
  && /HTTP 401/.test((await una(db,
    'select error from avisos_correo where id=$1', [colaRechazada.id])).error));

const [transitoriaAlBorde] = await filas(db, `insert into cambios_estado
  (plataforma_id,estado_nuevo,titular)
  values($1,'en_radar','Transitoria al borde') returning id`, [plataforma.id]);
await filas(db, 'select avisos_soltar()');
const colaTransitoria = await una(db, `select id,peticion_id
  from avisos_correo where cambio_id=$1`, [transitoriaAlBorde.id]);
await filas(db, `update avisos_correo
  set idempotencia_el=now()-interval '24 minutes' where id=$1`,
  [colaTransitoria.id]);
await filas(db, `insert into net._http_response(id,status_code,content,error_msg)
  values($1,500,'{"code":"temporary"}',null)`, [colaTransitoria.peticion_id]);
await filas(db, 'select avisos_confirmar()');
await filas(db, `update avisos_correo
  set idempotencia_el=now()-interval '26 minutes' where id=$1`,
  [colaTransitoria.id]);
const peticionesAntesTerminal = (await una(db,
  'select count(*)::int n from net._peticiones')).n;
paso('un transitorio sin peticion_id termina al vencer TTL y no queda atascado',
  (await una(db, 'select avisos_soltar() n')).n === 0
  && (await una(db, `select intentos,error from avisos_correo where id=$1`,
    [colaTransitoria.id])).intentos === 5
  && (await una(db,
    'select count(*)::int n from net._peticiones')).n === peticionesAntesTerminal);

// Una baja posterior a encolar también debe ganar la carrera al cron.
await filas(db, 'update perfiles set avisos_correo=true where id=$1', [ana.id]);
const [baja] = await filas(db, `insert into cambios_estado
  (plataforma_id,estado_nuevo,titular)
  values($1,'en_radar','No debe salir') returning id`, [plataforma.id]);
await filas(db, 'update perfiles set avisos_correo=false where id=$1', [ana.id]);
const peticionesAntes = (await una(db,
  'select count(*)::int n from net._peticiones')).n;
paso('una baja después de encolar impide el envío',
  (await una(db, 'select avisos_soltar() n')).n === 0
  && (await una(db,
    'select intentos from avisos_correo where cambio_id=$1', [baja.id])).intentos === 5
  && (await una(db,
    'select count(*)::int n from net._peticiones')).n === peticionesAntes);

await filas(db, 'update perfiles set avisos_correo=true where id=$1', [ana.id]);
const [sinVigilar] = await filas(db, `insert into cambios_estado
  (plataforma_id,estado_nuevo,titular)
  values($1,'en_radar','Ya no la vigila') returning id`, [plataforma.id]);
await filas(db, `delete from vigilancia
  where usuario_id=$1 and plataforma_id=$2`, [ana.id, plataforma.id]);
const peticionesAntesDejar = (await una(db,
  'select count(*)::int n from net._peticiones')).n;
paso('dejar de vigilar después de encolar también impide el envío',
  (await una(db, 'select avisos_soltar() n')).n === 0
  && (await una(db,
    'select intentos from avisos_correo where cambio_id=$1',
    [sinVigilar.id])).intentos === 5
  && (await una(db,
    'select count(*)::int n from net._peticiones')).n === peticionesAntesDejar);

for (const rol of ['public', 'anon', 'authenticated']) {
  paso(`${rol} no puede ejecutar las rutas internas de correo`,
    !(await una(db, `select has_function_privilege(
      $1,'avisos_soltar(integer)','execute') permiso`, [rol])).permiso
    && !(await una(db, `select has_function_privilege(
      $1,'avisos_confirmar()','execute') permiso`, [rol])).permiso);
}
paso('anon y authenticated no pueden leer la configuración de correo',
  !(await una(db,
    "select has_table_privilege('anon','correo_configuracion','select') p")).p
  && !(await una(db, `select has_table_privilege(
    'authenticated','correo_configuracion','select') p`)).p);
paso('anon y authenticated no pueden leer Vault ni la cola real de pg_net',
  !(await una(db, `select has_table_privilege(
    'anon','vault.decrypted_secrets','select') p`)).p
  && !(await una(db, `select has_table_privilege(
    'authenticated','vault.decrypted_secrets','select') p`)).p
  && !(await una(db, `select has_table_privilege(
    'anon','net.http_request_queue','select') p`)).p
  && !(await una(db, `select has_table_privilege(
    'authenticated','net.http_request_queue','select') p`)).p);

const pushAntes = await una(db,
  'select habilitado from push_configuracion where singleton');
await db.exec(cerrarSql);
const cierre = await una(db, `select
  (select habilitado from correo_configuracion where singleton) correo,
  (select habilitado from push_configuracion where singleton) push,
  (select count(*)::int from cron.job where jobname='rwadar-avisos') relojes,
  (select count(*)::int from cron.job
    where jobname='rwadar-retencion-dispositivos') retencion`);
paso('el cierre apaga solo correo y elimina todos sus relojes',
  !cierre.correo && cierre.push === pushAntes.habilitado && cierre.relojes === 0);
paso('el cierre conserva el reloj independiente de retención', cierre.retencion === 1);
await rechaza(db, 'select avisos_soltar()', 'enviar después del cierre de correo');

paso('los artefactos nuevos no contienen la URL Netlify heredada',
  !/https:\/\/rwadar\.netlify\.app/i.test(activarSql + verificarSql + cerrarSql));

informe('CORREO BREVO FAIL-CLOSED', ok, fail);
await db.close();

/* SQL real de cuentas sobre Postgres embebido. No abre red ni utiliza usuarios
   reales. Auth/GoTrue y la firma criptográfica de JWT se simulan expresamente:
   esto prueba permisos, RLS y funciones SQL, no la pasarela ni el correo real. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { alta, baseCompleta, filas, informe, sesion } from './pruebas-soporte.mjs';

const raiz = path.dirname(fileURLToPath(import.meta.url));
process.chdir(raiz);
const require = createRequire(import.meta.url);
const { cargarFuentesLocales, construirSqlImportacion, MANIFIESTO_CATALOGO_V2 } = require('./catalogo-publico');
const archivo = 'supabase/migrations/20261011074218_cuentas_sesion_confirmada.sql';
const leer = ruta => fs.readFileSync(path.join(raiz, ruta), 'utf8');
const sql = leer(archivo), ok = [], fail = [];
const paso = (titulo, resultado) => (resultado ? ok : fail).push(titulo);
const denegado = async tarea => {
  try { await tarea(); return false; } catch (error) { return error?.code === '42501'; }
};
const precondicionRechazada = async db => {
  try { await db.exec(sql); return false; }
  catch (error) { await db.exec('rollback'); return error?.code === 'P0001' && /Auth actual y la reapertura 26/.test(error.message); }
};
const cuenta = async (db, consulta, parametros = []) => Number((await filas(db, consulta, parametros))[0]?.n);

const db = await baseCompleta();
try {
  await db.exec('alter default privileges grant all on tables to anon, authenticated');
  for (const ruta of ['db/24_catalogo_publico_verificado.sql', 'db/25_servicios_editoriales_solo_lectura.sql',
    'supabase/migrations/20260930084133_ofertas_documentacion_publica.sql',
    'supabase/migrations/20260930090621_catalogo_v2_colecciones.sql',
    'supabase/migrations/20261001150000_catalogo_siempre_disponible.sql']) await db.exec(leer(ruta));
  paso('sin la reapertura 26 ni Auth actual, el SQL rechaza la aplicación', await precondicionRechazada(db));
  await db.exec(leer('db/26_reabrir_cuentas.sql'));
  paso('26 sola no permite omitir las precondiciones de Auth', await precondicionRechazada(db));

  // Solo infraestructura simulada. El soporte compartido ya modela auth.uid;
  // aquí se añade el contrato de auth.jwt/sessions que usa el SQL de verdad.
  await db.exec(`alter table auth.users add column is_anonymous boolean default false;
    -- El mock compartido tenía _sesion sin cualificar. El helper nuevo fija
    -- search_path vacío (correcto); cualificar el mock reproduce el aislamiento
    -- de la función auth.uid real sin debilitar ni modificar la migración.
    create or replace function auth.uid() returns uuid language sql stable security definer
      set search_path='' as $$ select uid from public._sesion limit 1 $$;
    create table auth.sessions (id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade);
    create function auth.jwt() returns jsonb language sql stable as $$
      select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
    $$;
    revoke all on auth.sessions, auth.users from public, anon, authenticated;`);
  paso('una instalación Auth sin sessions.not_after se rechaza', await precondicionRechazada(db));
  await db.exec('alter table auth.sessions add column not_after timestamptz');

  const ana = await alta(db, 'ana-cuentas@ejemplo.test', { es_admin: true, role: 'service_role' });
  const luis = await alta(db, 'luis-cuentas@ejemplo.test');
  const pendiente = await alta(db, 'pendiente-cuentas@ejemplo.test', { email_confirmed_at: '2026-10-11', es_admin: true });
  const anonimo = await alta(db, 'anonimo-cuentas@ejemplo.test', { is_anonymous: false });
  const incierto = await alta(db, 'anonimo-incierto@ejemplo.test');
  await db.query('update auth.users set email_confirmed_at=null where id=$1', [pendiente.id]);
  await db.query('update auth.users set is_anonymous=true where id=$1', [anonimo.id]);
  await db.query('update auth.users set is_anonymous=null where id=$1', [incierto.id]);
  const SID_ANA = '10000000-0000-4000-8000-000000000001';
  const SID_ANA_2 = '10000000-0000-4000-8000-000000000002';
  const SID_LUIS = '20000000-0000-4000-8000-000000000001';
  const SID_PENDIENTE = '30000000-0000-4000-8000-000000000001';
  const SID_ANONIMO = '40000000-0000-4000-8000-000000000001';
  const SID_VENCIDA = '50000000-0000-4000-8000-000000000001';
  const SID_INCIERTO = '60000000-0000-4000-8000-000000000001';
  for (const [id, usuario] of [[SID_ANA, ana.id], [SID_ANA_2, ana.id], [SID_LUIS, luis.id],
    [SID_PENDIENTE, pendiente.id], [SID_ANONIMO, anonimo.id], [SID_VENCIDA, ana.id], [SID_INCIERTO, incierto.id]]) {
    await db.query('insert into auth.sessions(id,user_id,not_after) values ($1,$2,$3)',
      [id, usuario, id === SID_VENCIDA ? '2000-01-01T00:00:00Z' : null]);
  }
  const [lofty] = await filas(db, "select id from plataformas where slug='lofty'");
  const [addx] = await filas(db, "select id from plataformas where slug='addx'");
  await db.query('insert into vigilancia(usuario_id,plataforma_id) values ($1,$2),($3,$4)',
    [ana.id, lofty.id, luis.id, addx.id]);
  const [cambio] = await filas(db, `insert into cambios_estado(plataforma_id,estado_nuevo,titular)
    values($1,'en_radar','Cambio sintético para RLS de avisos, sin envío') returning id`, [lofty.id]);
  await db.query(`insert into avisos_correo(usuario_id,cambio_id) values ($1,$3),($2,$3)
    on conflict (usuario_id,cambio_id) do nothing`, [ana.id, luis.id, cambio.id]);

  // Catálogo V2 sintético: misma forma 26/49 que el contrato público. Sus
  // fechas se sitúan en el día del ensayo; jamás se escribe este lote fuera.
  const fuente = cargarFuentesLocales('..', { revision: '2026-09-30' });
  const lote = structuredClone(fuente);
  lote.manifiesto = structuredClone(MANIFIESTO_CATALOGO_V2);
  lote.escaparate.versionEsquema = 2;
  lote.escaparate.ofertas = fuente.escaparate.ofertas.slice(0, 24).map(o => ({ ...structuredClone(o), coleccion: 'principales' }));
  for (const [coleccion, cantidad] of [['secundario', 21], ['en_camino', 4]]) {
    for (let i = 0; i < cantidad; i++) lote.escaparate.ofertas.push({ ...structuredClone(fuente.escaparate.ofertas[i]),
      slug: `prueba-cuentas-${coleccion.replace('_', '-')}-${i}`, coleccion,
      estadoRevision: 'no_verificable', precio: null, rentabilidad: null, puntuacion: null, disponibleEs: null });
  }
  const importacion = construirSqlImportacion(lote);
  await db.exec(importacion.sql);
  await db.query('update rwadar_catalogo.revisiones set verificado_el=current_date where id=$1', [importacion.revisionId]);
  await db.query('update rwadar_catalogo.fuentes set consultada_el=current_date where revision_id=$1', [importacion.revisionId]);
  await db.query('update rwadar_catalogo.ofertas set verificada_el=current_date where revision_id=$1', [importacion.revisionId]);
  await db.query(`update rwadar_catalogo.revisiones set estado='aprobada', aprobada_el=now(),
    aprobada_referencia='Fixture local para prueba de seguridad de cuentas' where id=$1`, [importacion.revisionId]);

  await db.exec(sql); await db.exec(sql);
  paso('la migración se aplica literalmente dos veces y es idempotente', true);
  paso('la RPC opcional de correo puede estar ausente sin impedir la aplicación',
    (await filas(db, "select to_regprocedure('public.configurar_avisos_correo(boolean,text)') rpc"))[0].rpc === null);
  const politica = await filas(db, `select c.relname,p.polpermissive from pg_policy p join pg_class c on c.oid=p.polrelid
    where p.polname='cuenta_sesion_confirmada' order by c.relname`);
  paso('las tres políticas nuevas son RESTRICTIVAS y no sustituyen las de propiedad', politica.length === 3 && politica.every(p => p.polpermissive === false));
  const [vista] = await filas(db, "select reloptions from pg_class where oid='public.mi_perfil'::regclass");
  paso('mi_perfil conserva security_invoker', vista.reloptions?.includes('security_invoker=true'));
  const funciones = await filas(db, `select p.proname,p.prosecdef,p.proconfig from pg_proc p
    where p.oid in ('rwadar_cuentas_privadas.sesion_confirmada()'::regprocedure,
      'public.borrar_mi_cuenta()'::regprocedure,'public.marcar_manual_descargado()'::regprocedure)`);
  paso('las funciones privilegiadas fijan search_path vacío', funciones.length === 3
    && funciones.every(f => f.prosecdef && f.proconfig?.some(v => v.startsWith('search_path=') && /^(search_path=|search_path="")$/.test(v))));
  paso('authenticated no recibe acceso a auth.users ni auth.sessions',
    !(await filas(db, `select has_table_privilege('authenticated','auth.users','SELECT') a,
      has_table_privilege('authenticated','auth.sessions','SELECT') s,
      has_table_privilege('authenticated','auth.sessions','DELETE') d`)).some(f => f.a || f.s || f.d));

  const epoch = async () => Number((await filas(db, 'select floor(extract(epoch from now()))::bigint instante'))[0].instante);
  const conJwt = async (usuario, sid, extras = {}, rol = 'authenticated') => {
    await sesion(db);
    const ahora = await epoch();
    const claims = { sub: usuario, role: 'authenticated', session_id: sid, exp: ahora + 3600,
      is_anonymous: false, amr: [{ method: 'password', timestamp: ahora }], ...extras };
    await db.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify(claims)]);
    await sesion(db, usuario, rol);
    return claims;
  };
  const confirmada = async () => (await filas(db, 'select rwadar_cuentas_privadas.sesion_confirmada() permitido'))[0].permitido;
  const catalogoPublico = async () => {
    await sesion(db, null, 'anon');
    const cantidades = [await cuenta(db, 'select count(*)::int n from public.catalogo_plataformas_publicas_v2'),
      await cuenta(db, 'select count(*)::int n from public.catalogo_ofertas_publicas_v2')];
    await sesion(db);
    return cantidades;
  };
  paso('el catálogo público completo sigue accesible al aplicar el endurecimiento', JSON.stringify(await catalogoPublico()) === '[26,49]');

  // Reproduce una instalación que conserve la RPC SECURITY DEFINER de 23,
  // sin activar el correo, Vault, cron ni ningún proveedor. Se ejecuta su
  // cuerpo SQL literal, no una función ficticia que solo devuelva true.
  const rpcCorreo = leer('db/23_activar_correo.sql').match(
    /create or replace function public\.configurar_avisos_correo\([\s\S]+?\$funcion\$;/)?.[0];
  if (!rpcCorreo) throw new Error('No se encuentra la definición real de configurar_avisos_correo en 23');
  await db.exec(`alter table public.perfiles add column if not exists avisos_correo_aceptado_el timestamptz;
    alter table public.perfiles add column if not exists avisos_correo_version text;`);
  await db.exec(rpcCorreo);
  await db.exec(`grant execute on function public.configurar_avisos_correo(boolean,text)
    to public, anon, authenticated, service_role;`);
  const permisoCorreo = async rol => (await filas(db,
    "select has_function_privilege($1,'public.configurar_avisos_correo(boolean,text)','EXECUTE') permitido", [rol]))[0].permitido;
  const llamadaCorreo = (habilitado = true) => db.query('select * from public.configurar_avisos_correo($1,$2)',
    [habilitado, habilitado ? 'correo-v1-2026-08-22' : null]);
  paso('la fixture antigua de correo es SECURITY DEFINER y conserva ACL abiertas',
    (await filas(db, "select prosecdef from pg_proc where oid='public.configurar_avisos_correo(boolean,text)'::regprocedure"))[0].prosecdef
    && await permisoCorreo('anon') && await permisoCorreo('authenticated') && await permisoCorreo('service_role'));
  await conJwt(ana.id, SID_ANA);
  paso('antes del refuerzo, la RPC antigua permite escribir el consentimiento propio',
    (await llamadaCorreo()).rows[0]?.habilitado === true);
  await sesion(db);
  await db.query('update public.perfiles set avisos_correo=false,avisos_correo_aceptado_el=null,avisos_correo_version=null where id=$1', [ana.id]);
  await db.exec(sql); await db.exec(sql);
  paso('con la RPC antigua presente, la migración vuelve a aplicarse dos veces sin error', true);
  paso('el refuerzo revoca EXECUTE heredado de PUBLIC en la RPC antigua',
    await cuenta(db, `select count(*)::int n from pg_proc p,
      lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
      where p.oid='public.configurar_avisos_correo(boolean,text)'::regprocedure
        and a.grantee=0 and a.privilege_type='EXECUTE'`) === 0);
  paso('anon ya no recibe EXECUTE directo ni heredado para correo', !(await permisoCorreo('anon')));
  paso('authenticated ya no recibe EXECUTE directo ni heredado para correo', !(await permisoCorreo('authenticated')));
  paso('el refuerzo conserva el permiso explícito de service_role', await permisoCorreo('service_role'));
  await conJwt(ana.id, SID_ANA);
  paso('incluso una contraseña recién comprobada no abre la RPC de correo pausada', await denegado(() => llamadaCorreo()));
  paso('la llamada denegada no modifica el consentimiento del perfil',
    (await filas(db, 'select avisos_correo,avisos_correo_aceptado_el,avisos_correo_version from public.perfiles'))
      .every(p => p.avisos_correo === false && p.avisos_correo_aceptado_el === null && p.avisos_correo_version === null));
  await conJwt(luis.id, SID_LUIS, {}, 'service_role');
  paso('el rol privado que conservó EXECUTE sigue pudiendo ejecutar la RPC',
    (await llamadaCorreo(false)).rows[0]?.habilitado === false);
  await sesion(db, null, 'anon');
  paso('anon tampoco puede ejecutar la RPC de correo mediante una llamada directa', await denegado(() => llamadaCorreo()));

  await conJwt(ana.id, SID_ANA);
  paso('Ana confirmada con sesión vigente supera el filtro', await confirmada());
  await sesion(db);
  await db.query("update auth.sessions set not_after=now()+interval '1 hour' where id=$1", [SID_ANA]);
  await conJwt(ana.id, SID_ANA);
  paso('un not_after futuro explícito también permite la sesión vigente', await confirmada());
  const perfilAna = await filas(db, 'select id,nombre,es_admin from public.mi_perfil');
  paso('Ana solo ve su perfil y metadatos editables no la hacen admin', perfilAna.length === 1 && perfilAna[0].id === ana.id && perfilAna[0].es_admin === false);
  paso('Ana solo ve su vigilancia, no la de Luis', (await filas(db, 'select usuario_id from public.vigilancia')).every(f => f.usuario_id === ana.id)
    && await cuenta(db, 'select count(*)::int n from public.vigilancia') === 1);
  paso('los avisos propios existentes se leen sin revelar los de Luis', await cuenta(db, 'select count(*)::int n from public.avisos_correo') === 1
    && (await filas(db, 'select usuario_id from public.avisos_correo')).every(f => f.usuario_id === ana.id));
  paso('el perfil propio se puede editar con sesión confirmada', (await db.query("update public.perfiles set nombre='Ana prueba' where id=$1", [ana.id])).affectedRows === 1);
  paso('el perfil ajeno no se puede editar', (await db.query("update public.perfiles set nombre='Intrusión' where id=$1", [luis.id])).affectedRows === 0);
  paso('authenticated no puede concederse administración', await denegado(() => db.query('update public.perfiles set es_admin=true where id=$1', [ana.id])));
  paso('no se puede insertar vigilancia a nombre de otro usuario', await denegado(() => db.query('insert into public.vigilancia(usuario_id,plataforma_id) values ($1,$2)', [luis.id, lofty.id])));
  paso('no se puede borrar vigilancia ajena', (await db.query('delete from public.vigilancia where usuario_id=$1', [luis.id])).affectedRows === 0);
  await db.query('insert into public.vigilancia(usuario_id,plataforma_id) values ($1,$2)', [ana.id, addx.id]);
  paso('Ana puede añadir una vigilancia propia', await cuenta(db, 'select count(*)::int n from public.vigilancia') === 2);
  paso('Ana puede quitar la vigilancia propia', (await db.query('delete from public.vigilancia where plataforma_id=$1', [addx.id])).affectedRows === 1);
  await db.query('select public.marcar_manual_descargado()');
  paso('el marcador del manual exige sesión y solo modifica el perfil propio', (await filas(db, 'select manual_descargado_el from public.perfiles'))[0].manual_descargado_el instanceof Date);

  const ahora = await epoch();
  const negativos = [
    ['correo sin confirmar aunque los metadatos lo afirmen', pendiente.id, SID_PENDIENTE, {}],
    ['usuario anónimo en Auth aunque el token lo niegue', anonimo.id, SID_ANONIMO, {}],
    ['anonimato NULL en Auth no se interpreta como usuario confirmado', incierto.id, SID_INCIERTO, {}],
    ['claim anónimo aunque el usuario esté confirmado', ana.id, SID_ANA, { is_anonymous: true }],
    ['SID robado de Luis', ana.id, SID_LUIS, {}],
    ['SID inexistente', ana.id, '99999999-9999-4999-8999-999999999999', {}],
    ['sesión con not_after vencido', ana.id, SID_VENCIDA, {}],
    ['JWT caducado', ana.id, SID_ANA, { exp: ahora - 1 }],
    ['exp ausente', ana.id, SID_ANA, { exp: null }],
    ['exp no numérico', ana.id, SID_ANA, { exp: 'NaN' }],
    ['exp excesivamente largo', ana.id, SID_ANA, { exp: '99999999999999999999' }],
    ['SID ausente', ana.id, null, {}],
    ['SID mal formado', ana.id, 'no-es-un-uuid', {}],
    ['SID como objeto', ana.id, { id: SID_ANA }, {}],
    ['subject de otro usuario', ana.id, SID_ANA, { sub: luis.id }],
    ['subject mal formado', ana.id, SID_ANA, { sub: 'malformado' }],
    ['subject ausente', ana.id, SID_ANA, { sub: null }],
    ['sin UID de Auth', null, SID_ANA, { sub: ana.id }],
    ['role incorrecto aunque metadatos prometan administración', ana.id, SID_ANA, { role: 'service_role', user_metadata: { role: 'authenticated', es_admin: true } }],
    ['role ausente', ana.id, SID_ANA, { role: null }],
  ];
  for (const [titulo, uid, sid, extras] of negativos) {
    await conJwt(uid, sid, extras);
    paso(`${titulo}: el helper rechaza`, !(await confirmada()));
    paso(`${titulo}: no lee perfiles, vigilancia ni avisos`, await cuenta(db, 'select count(*)::int n from public.mi_perfil') === 0
      && await cuenta(db, 'select count(*)::int n from public.vigilancia') === 0
      && await cuenta(db, 'select count(*)::int n from public.avisos_correo') === 0);
    paso(`${titulo}: no actualiza perfil ni borra vigilancia`, (await db.query("update public.perfiles set nombre='Prohibido' where id=$1", [ana.id])).affectedRows === 0
      && (await db.query('delete from public.vigilancia where usuario_id=$1', [ana.id])).affectedRows === 0);
    paso(`${titulo}: no inserta vigilancia`, await denegado(() => db.query('insert into public.vigilancia(usuario_id,plataforma_id) values ($1,$2)', [uid || ana.id, addx.id])));
    paso(`${titulo}: no anota descargas del manual`, await denegado(() => db.query('select public.marcar_manual_descargado()')));
    paso(`${titulo}: no borra la cuenta`, await denegado(() => db.query('select public.borrar_mi_cuenta()')));
  }

  await conJwt(ana.id, SID_ANA);
  paso('authenticated no puede leer ni revocar sesiones ajenas directamente', await denegado(() => db.query('select * from auth.sessions'))
    && await denegado(() => db.query('delete from auth.sessions where user_id=$1', [luis.id])));
  paso('authenticated no puede cambiar el helper privilegiado', await denegado(() => db.exec(`create or replace function rwadar_cuentas_privadas.sesion_confirmada()
    returns boolean language sql as $$ select true $$`)));
  paso('authenticated no puede crear objetos en el esquema privado', await denegado(() => db.exec('create table rwadar_cuentas_privadas.intrusion(id int)')));
  await sesion(db, null, 'anon');
  paso('anon no ejecuta el helper privado', await denegado(() => db.query('select rwadar_cuentas_privadas.sesion_confirmada()')));
  paso('anon no ejecuta bajas ni marcador de manual', await denegado(() => db.query('select public.borrar_mi_cuenta()'))
    && await denegado(() => db.query('select public.marcar_manual_descargado()')));
  paso('anon no puede acceder a tablas de cuentas', await denegado(() => db.query('select * from public.perfiles'))
    && await denegado(() => db.query('select * from public.vigilancia')));

  // Una revocación se representa como hace Auth: desaparece auth.sessions,
  // mientras el JWT conserva su firma y exp futuro. RLS lo bloquea ya.
  await sesion(db);
  await db.query('delete from auth.sessions where id=$1', [SID_ANA]);
  await conJwt(ana.id, SID_ANA);
  paso('logout revocado bloquea inmediatamente el JWT aún no vencido', !(await confirmada())
    && await cuenta(db, 'select count(*)::int n from public.mi_perfil') === 0);
  paso('tras logout, el JWT antiguo tampoco escribe ni borra la cuenta', await denegado(() => db.query('insert into public.vigilancia(usuario_id,plataforma_id) values ($1,$2)', [ana.id, addx.id]))
    && await denegado(() => db.query('select public.borrar_mi_cuenta()')));
  paso('tras logout, la RPC antigua de correo tampoco acepta el JWT aún no vencido', await denegado(() => llamadaCorreo()));
  await sesion(db);
  await db.query('insert into auth.sessions(id,user_id) values ($1,$2)', [SID_ANA, ana.id]);

  const sesionesAntes = await cuenta(db, 'select count(*)::int n from auth.sessions where user_id=$1', [ana.id]);
  for (const desfase of [-299, 20, 30]) {
    // now() queda fijo durante el caso: los límites AMR no dependen de la
    // velocidad del equipo ni del tiempo empleado por los casos anteriores.
    await db.exec('begin');
    let permitido = true;
    try {
      await conJwt(ana.id, SID_ANA, { amr: [{ method: 'password', timestamp: await epoch() + desfase }] });
      await db.query('select public.borrar_mi_cuenta()');
    } catch { permitido = false; }
    finally { await db.exec('rollback'); }
    paso(`AMR contraseña con desfase ${desfase}s está dentro de la ventana permitida`, permitido);
    await sesion(db);
  }
  for (const [titulo, crearAmr] of [
    ['recuperación sin contraseña', marca => [{ method: 'recovery', timestamp: marca }]],
    ['OTP en vez de contraseña', marca => [{ method: 'otp', timestamp: marca }]],
    ['contraseña comprobada hace más de cinco minutos', marca => [{ method: 'password', timestamp: marca - 310 }]],
    ['AMR ausente', () => null], ['AMR objeto en vez de lista', marca => ({ method: 'password', timestamp: marca })],
    ['fecha AMR inválida', () => [{ method: 'password', timestamp: 'invalid' }]],
    ['fecha AMR desmesurada', () => [{ method: 'password', timestamp: '99999999999999999999' }]],
    ['fecha AMR futura de 60 segundos', marca => [{ method: 'password', timestamp: marca + 60 }]],
    ['fecha AMR futura superior a tolerancia', marca => [{ method: 'password', timestamp: marca + 31 }]],
    ['fecha AMR negativa', () => [{ method: 'password', timestamp: -100 }]],
  ]) {
    await db.exec('begin');
    try {
      const amr = crearAmr(await epoch());
      await conJwt(ana.id, SID_ANA, { amr });
      paso(`${titulo}: la lectura propia sigue permitida, no el borrado`, await confirmada()
        && await denegado(() => db.query('select public.borrar_mi_cuenta()')));
    } finally { await db.exec('rollback'); }
    await sesion(db);
    paso(`${titulo}: no deja borrado parcial`, await cuenta(db, 'select count(*)::int n from auth.users where id=$1', [ana.id]) === 1
      && await cuenta(db, 'select count(*)::int n from auth.sessions where user_id=$1', [ana.id]) === sesionesAntes);
  }

  await conJwt(ana.id, SID_ANA, { amr: [{ method: 'recovery', timestamp: await epoch() },
    { method: 'password', timestamp: await epoch() }] });
  await db.query('select public.borrar_mi_cuenta()');
  await sesion(db);
  paso('una contraseña recién comprobada borra al usuario de Auth', await cuenta(db, 'select count(*)::int n from auth.users where id=$1', [ana.id]) === 0);
  paso('la baja revoca todas sus sesiones, no solo la usada', await cuenta(db, 'select count(*)::int n from auth.sessions where user_id=$1', [ana.id]) === 0);
  paso('la baja elimina su perfil, vigilancia y avisos por cascada', await cuenta(db, 'select count(*)::int n from public.perfiles where id=$1', [ana.id]) === 0
    && await cuenta(db, 'select count(*)::int n from public.vigilancia where usuario_id=$1', [ana.id]) === 0
    && await cuenta(db, 'select count(*)::int n from public.avisos_correo where usuario_id=$1', [ana.id]) === 0);
  paso('la baja no toca al usuario, sesiones ni vigilancia de Luis', await cuenta(db, 'select count(*)::int n from auth.users where id=$1', [luis.id]) === 1
    && await cuenta(db, 'select count(*)::int n from auth.sessions where user_id=$1', [luis.id]) === 1
    && await cuenta(db, 'select count(*)::int n from public.vigilancia where usuario_id=$1', [luis.id]) === 1
    && await cuenta(db, 'select count(*)::int n from public.avisos_correo where usuario_id=$1', [luis.id]) === 1);
  await conJwt(ana.id, SID_ANA_2);
  paso('el JWT que queda tras borrar tampoco permite reutilizar la cuenta', !(await confirmada())
    && await cuenta(db, 'select count(*)::int n from public.mi_perfil') === 0
    && await denegado(() => db.query('insert into public.vigilancia(usuario_id,plataforma_id) values ($1,$2)', [ana.id, addx.id]))
    && await denegado(() => db.query('select public.borrar_mi_cuenta()')));

  await sesion(db);
  await db.exec(leer('db/25_servicios_editoriales_solo_lectura.sql'));
  await conJwt(luis.id, SID_LUIS);
  paso('reaplicar 25 cierra lectura de cuentas y vigilancia', await denegado(() => db.query('select * from public.mi_perfil'))
    && await denegado(() => db.query('select * from public.vigilancia')));
  paso('reaplicar 25 cierra edición y borrado de cuenta', await denegado(() => db.query("update public.perfiles set nombre='No' where id=$1", [luis.id]))
    && await denegado(() => db.query('select public.borrar_mi_cuenta()')));
  paso('reaplicar 25 impide también la escritura privilegiada del marcador manual', await denegado(() => db.query('select public.marcar_manual_descargado()')));
  paso('reaplicar 25 no vuelve a abrir la RPC antigua de correo', await denegado(() => llamadaCorreo()));
  paso('el catálogo público no cambia por cerrar cuentas con 25', JSON.stringify(await catalogoPublico()) === '[26,49]');
} finally {
  await db.close();
}
informe('RWAdar · sesión confirmada y baja reautenticada (SQL local)', ok, fail);

/* =====================================================================
   RWAdar · prueba de la comunidad (migración 27)
   ---------------------------------------------------------------------
   Misma cadena que producción + 26 + sesión confirmada + 27. Comprueba que
   las reglas las pone la base de datos: una publicación al día, sin
   enlaces en texto y autor, lectura pública sin datos personales, denuncias
   (solo tres cuentas consolidadas la ocultan),
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
const migracion = leer('db/27_comunidad.sql');
const sinRefuerzo = await error(() => db.exec(migracion));
await db.exec('rollback');
paso('27 rechaza abrir sin el refuerzo previo de sesión confirmada', sinRefuerzo?.code === '55000');
// Infraestructura Auth simulada: no firma JWT ni envía correo. La migración
// real se ejecuta literalmente; auth.uid se cualifica por su search_path vacío.
await db.exec(`alter table auth.users add column is_anonymous boolean default false;
  alter table auth.users add column created_at timestamptz default now();
  create or replace function auth.uid() returns uuid language sql stable security definer
    set search_path='' as $$ select uid from public._sesion limit 1 $$;
  create table auth.sessions(id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,not_after timestamptz);
  create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb
  $$;
  revoke all on auth.users,auth.sessions from public,anon,authenticated;`);
await db.exec(leer('supabase/migrations/20261011074218_cuentas_sesion_confirmada.sql'));
await db.exec(migracion);
await db.exec(migracion);
const versionada = leer('supabase/migrations/20261022010741_comunidad_confirmada_y_moderacion.sql');
paso('el instalador 27 y la migración creada por CLI contienen el mismo SQL', versionada === migracion);
await db.exec(versionada); await db.exec(versionada);
paso('instalador y migración versionada se reaplican sin cambios ni pérdidas', true);

const [ana, luis, eva, admin] = [
  await alta(db, 'ana@ejemplo.test'), await alta(db, 'luis@ejemplo.test'),
  await alta(db, 'eva@ejemplo.test'), await alta(db, 'admin@ejemplo.test')];
await db.query(`update perfiles set nombre='Ana R.' where id=$1`, [ana.id]);
await db.query('update perfiles set es_admin=true where id=$1', [admin.id]);
await db.query(`update auth.users set created_at=now()-interval '8 days',email_confirmed_at=now()-interval '8 days'`);
const sesiones = new Map();
const como = async (u, extras={}) => {
  await sesion(db);
  if (!sesiones.has(u.id)) {
    const [s] = await filas(db,'insert into auth.sessions(id,user_id) values(gen_random_uuid(),$1) returning id',[u.id]);
    sesiones.set(u.id,s.id);
  }
  const [reloj] = await filas(db,'select floor(extract(epoch from now()))::bigint as instante');
  const claims={sub:u.id,role:'authenticated',session_id:sesiones.get(u.id),exp:Number(reloj.instante)+3600,
    is_anonymous:false,amr:[{method:'password',timestamp:Number(reloj.instante)}],...extras};
  await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify(claims)]);
  await sesion(db,u.id,'authenticated');
};
const publicasRpc = await filas(db,`select p.prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname in ('publicar','mis_publicaciones','borrar_mi_publicacion',
    'denunciar_publicacion','moderar_publicacion','cola_publicaciones')`);
paso('las seis RPC públicas son SECURITY INVOKER',publicasRpc.length===6 && publicasRpc.every(p=>!p.prosecdef));
const privadas = await filas(db,`select p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='rwadar_comunidad_privada' and p.prosecdef`);
paso('las seis implementaciones privadas fijan search_path vacío',privadas.length===6
  && privadas.every(p=>p.proconfig?.some(v=>/^(search_path=|search_path="")$/.test(v))));
const [acl]=await filas(db,`select has_schema_privilege('anon','rwadar_comunidad_privada','usage') as anon_schema,
  has_function_privilege('anon','rwadar_comunidad_privada.publicar(text,boolean)','execute') as anon_private,
  has_function_privilege('anon','public.publicar(text,boolean)','execute') as anon_rpc,
  has_table_privilege('authenticated','auth.users','select') as users,
  has_table_privilege('authenticated','auth.sessions','select') as sessions`);
paso('anon no accede al esquema privado ni RPC, y authenticated no lee Auth',Object.values(acl).every(v=>v===false));
// Simula una instalación vieja que ya guardó un autor con enlace. La nueva
// migración no lo borra; permite ocultarlo y evita restaurar el contenido inseguro.
await db.exec(`alter table publicaciones drop constraint publicaciones_autor_sin_enlaces;
  alter table publicaciones drop constraint publicaciones_texto_sin_enlaces;
  alter function public.mis_publicaciones() security definer;`);
const [heredada]=await filas(db,`insert into publicaciones(usuario_id,autor,texto,dia)
  values($1,'ofertas.example','Publicación histórica antes del filtro en autor.',current_date-2) returning id,dia`,[admin.id]);
await db.exec(versionada); await db.exec(versionada);
paso('la actualización conserva publicaciones anteriores y corrige RPC privilegiada pública',
  (await filas(db,'select id from publicaciones where id=$1',[heredada.id])).length===1
  && (await filas(db,"select prosecdef from pg_proc where oid='public.mis_publicaciones()'::regprocedure"))[0].prosecdef===false);
paso('la actualización reconstruye cupos de publicaciones anteriores',
  (await filas(db,'select dia from cupos_publicacion where usuario_id=$1 and dia=$2',[admin.id,heredada.dia])).length===1);
await como(admin);
paso('un autor antiguo con enlace se puede ocultar para moderación',
  (await filas(db,`select moderar_publicacion($1,'ocultar') as hecho`,[heredada.id]))[0].hecho===true);
paso('ese contenido inseguro no se restaura sin corregirlo',
  (await error(()=>db.query(`select moderar_publicacion($1,'restaurar')`,[heredada.id])))?.code==='23514');
await sesion(db); await db.query('delete from publicaciones where id=$1',[heredada.id]);

/* --- publicar ------------------------------------------------------ */
await como(ana);
const [primera] = await filas(db, `select * from publicar('Hoy he leído la lección 3 de la Academy y me ha aclarado mucho.', true)`);
paso('una cuenta publica y sale con su nombre si lo elige', primera?.autor === 'Ana R.');
for (const [nombre,extras] of [['JWT vencido',{exp:1}],['session_id inexistente',{session_id:'99999999-0000-4000-8000-000000000001'}],
  ['sin session_id',{session_id:null}],['JWT anónimo',{is_anonymous:true}],['sub de otra cuenta',{sub:luis.id}]]) {
  await como(admin,extras);
  const llamadas=[()=>db.query(`select * from publicar('Un intento sin sesión válida no debe entrar.')`),
    ()=>db.query('select * from mis_publicaciones()'),()=>db.query('select borrar_mi_publicacion($1)',[primera.id]),
    ()=>db.query('select denunciar_publicacion($1)',[primera.id]),
    ()=>db.query(`select moderar_publicacion($1,'ocultar')`,[primera.id]),()=>db.query('select * from cola_publicaciones()')];
  const errores=[]; for(const llamada of llamadas) errores.push(await error(llamada));
  paso(`las seis RPC rechazan ${nombre}`,errores.every(e=>e?.code==='42501'));
}
await sesion(db);
await db.query('delete from auth.sessions where id=$1',[sesiones.get(admin.id)]);
await como(admin);
paso('una sesión revocada no publica aunque el JWT aún no haya vencido',
  (await error(()=>db.query(`select * from publicar('JWT válido por fecha pero revocado en Auth.')`)))?.code==='42501');
sesiones.delete(admin.id);
await sesion(db);
await db.query(`update auth.sessions set not_after=now()-interval '1 hour' where user_id=$1`,[ana.id]);
await como(ana);
paso('not_after vencido de Auth deniega la sesión aún dentro del exp del JWT',
  (await error(()=>db.query('select * from mis_publicaciones()')))?.code==='42501');
await sesion(db); await db.query('update auth.sessions set not_after=null where user_id=$1',[ana.id]);
await db.query('update auth.users set email_confirmed_at=null where id=$1',[admin.id]);
await como(admin);
paso('un administrador sin correo confirmado no consulta la cola',
  (await error(()=>db.query('select * from cola_publicaciones()')))?.code==='42501');
await sesion(db);
await db.query(`update auth.users set email_confirmed_at=now()-interval '8 days',is_anonymous=true where id=$1`,[admin.id]);
await como(admin);
paso('el estado anónimo real de Auth no se oculta con claims no anónimos',
  (await error(()=>db.query('select * from mis_publicaciones()')))?.code==='42501');
await sesion(db); await db.query('update auth.users set is_anonymous=false where id=$1',[admin.id]);
await como(ana);
const segunda = await error(() => db.query(`select * from publicar('Otra publicación el mismo día, no debería entrar.')`));
paso('una segunda publicación el mismo día se rechaza con un mensaje claro', /Ya has publicado hoy/.test(segunda?.message || ''));
await sesion(db);
await db.query(`update publicaciones set dia = dia - 1 where usuario_id=$1`, [ana.id]);
await db.query(`update cupos_publicacion set dia = dia - 1 where usuario_id=$1`, [ana.id]);
await como(ana);
const [manana] = await filas(db, `select * from publicar('Al día siguiente sí puedo volver a publicar algo.')`);
paso('al día siguiente se puede volver a publicar, y sin nombre sale como «Miembro de RWAdar»',
  manana?.autor === 'Miembro de RWAdar');

await como(luis);
for (const [texto, motivo] of [
  ['Mira https://estafa.example para ganar dinero rápido', 'enlace https'],
  ['Entra en www.ganatodo.com ya mismo, es seguro', 'www'],
  ['Escríbeme en inversionesfacil.xyz y te cuento', 'dominio suelto'],
  ['Visita inversionesfacil.de, tenemos una oferta nueva.', 'dominio fuera de la lista antigua'],
  ['Visita inversiones\u200bfacil.xyz para continuar.', 'dominio con carácter invisible'],
  ['corto', 'demasiado corta'],
  ['x'.repeat(501), 'demasiado larga'],
]) {
  const e = await error(() => db.query('select * from publicar($1)', [texto]));
  paso(`se rechaza una publicación ${motivo}`, /entre 10 y 500 caracteres y no puede llevar enlaces/.test(e?.message || ''));
}
for(const nombre of ['www.estafa.example','asesor@estafa.example','ofertas.express','inversiones\u200bfacil.xyz']) {
  await sesion(db); await db.query('update perfiles set nombre=$2 where id=$1',[luis.id,nombre]); await como(luis);
  const e=await error(()=>db.query(`select * from publicar('Un texto permitido no convierte el nombre en un enlace.',true)`));
  paso(`autor con enlace ${nombre} se rechaza y no consume el cupo`,e?.code==='P0001' && /no puede llevar enlaces/.test(e.message));
}
const [publicacionLuis]=await filas(db,`select * from publicar('Buscando plataformas de inmobiliario con acceso desde España.')`);
paso('publicar sin mostrar un nombre con enlace usa el seudónimo seguro',
  publicacionLuis?.autor==='Miembro de RWAdar');

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
const trasBorrar = await error(() => db.query(`select * from publicar('Borro la de hoy y lo intento otra vez el mismo día.')`));
paso('borrar la de hoy no libera el cupo del día', /Ya has publicado hoy/.test(trasBorrar?.message || ''));
await sesion(db, null, 'anon');
paso('las cuentas no ven ni tocan el registro de cupos', !!(await error(() => db.query('select * from cupos_publicacion'))));
await como(ana);

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
await como(ana);
paso('su autora no puede borrar la oculta antes de la moderación',
  (await filas(db, 'select borrar_mi_publicacion($1) b', [primera.id]))[0].b === false);
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

/* --- las cuentas nuevas denuncian, pero no entierran contenido -------- */
await sesion(db);
const nuevas=[];
for(let i=0;i<3;i++) nuevas.push(await alta(db,`nueva-${i}@ejemplo.test`));
for(const nueva of nuevas) { await como(nueva); await db.query('select denunciar_publicacion($1)',[primera.id]); }
await sesion(db,null,'anon');
paso('tres cuentas recién creadas no ocultan una publicación',
  (await filas(db,'select id from publicaciones where id=$1',[primera.id])).length===1);
await como(admin);
paso('las tres denuncias nuevas sí llegan a la cola de moderación',
  (await filas(db,'select * from cola_publicaciones()')).some(p=>p.id===primera.id && p.estado==='visible' && p.denuncias===3));
await sesion(db);
await db.query(`update auth.users set created_at=now()-interval '8 days',email_confirmed_at=now()-interval '8 days'
  where id=any($1::uuid[])`,[nuevas.map(u=>u.id)]);
for(const nueva of nuevas) { await como(nueva); await db.query('select denunciar_publicacion($1)',[primera.id]); }
await sesion(db);
paso('las denuncias nuevas no maduran ni ganan peso al repetirse tras siete días',
  (await filas(db,'select apta_para_ocultar from denuncias_publicaciones where publicacion_id=$1',[primera.id]))
    .every(d=>d.apta_para_ocultar===false));
// Alta antigua con confirmación reciente tampoco da peso automático.
const recienConfirmada=await alta(db,'recien-confirmada@ejemplo.test');
await db.query(`update auth.users set created_at=now()-interval '30 days' where id=$1`,[recienConfirmada.id]);
await como(recienConfirmada); await db.query('select denunciar_publicacion($1)',[primera.id]);
await sesion(db);
paso('una cuenta antigua recién confirmada tampoco cuenta para ocultar',
  (await filas(db,'select apta_para_ocultar from denuncias_publicaciones where usuario_id=$1',[recienConfirmada.id]))[0]?.apta_para_ocultar===false);
for(const u of [luis,eva]) {await como(u); await db.query('select denunciar_publicacion($1)',[primera.id]);}
await sesion(db,null,'anon');
paso('dos cuentas consolidadas más las nuevas aún no ocultan',
  (await filas(db,'select id from publicaciones where id=$1',[primera.id])).length===1);
await como(admin); await db.query('select denunciar_publicacion($1)',[primera.id]);
await sesion(db,null,'anon');
paso('tres cuentas consolidadas distintas sí mantienen el umbral de protección',
  (await filas(db,'select id from publicaciones where id=$1',[primera.id])).length===0);
await como(admin); await db.query(`select moderar_publicacion($1,'restaurar')`,[primera.id]);

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
paso('el cierre también deniega las implementaciones privadas',
  (await error(()=>db.query('select * from rwadar_comunidad_privada.mis_publicaciones()')))?.code==='42501');
await sesion(db);
paso('sin borrar nada (queda la de Ana)', (await filas(db, 'select count(*)::int n from publicaciones'))[0].n === 1);

informe('RWAdar · comunidad (27)', ok, fail);

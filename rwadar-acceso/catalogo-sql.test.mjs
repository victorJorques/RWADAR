import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { PGlite } = createRequire(new URL('../rwadar-app/package.json', import.meta.url))('@electric-sql/pglite');
const adelante = fs.readFileSync(new URL('../rwadar-app/db/28_catalogo_cuenta_obligatoria.sql', import.meta.url), 'utf8');
const atras = fs.readFileSync(new URL('../rwadar-app/db/28_catalogo_cuenta_obligatoria_REVERTIR.sql', import.meta.url), 'utf8');
const tablas = ['rwadar_catalogo.revisiones','rwadar_catalogo.fuentes','rwadar_catalogo.plataformas',
  'rwadar_catalogo.plataforma_fuentes','rwadar_catalogo.alertas','rwadar_catalogo.alerta_fuentes',
  'rwadar_catalogo.ofertas','rwadar_catalogo.publicacion_v2','public.catalogo_publicacion',
  'public.categorias','public.regiones','public.plataformas','public.fuentes','public.cambios_estado','public.emisiones'];
const vistas = ['rwadar_catalogo.revision_publicable','rwadar_catalogo.revision_publicable_v2',
  'public.catalogo_plataformas_publicas','public.catalogo_ofertas_publicas',
  'public.catalogo_plataformas_publicas_v2','public.catalogo_ofertas_publicas_v2',
  'public.radar_publico','public.emisiones_publicas','public.emisiones_rancias'];
async function preparar() {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema rwadar_catalogo;
    create schema rwadar_cuentas_privadas;
    grant usage on schema public,rwadar_catalogo,rwadar_cuentas_privadas to anon,authenticated;
    -- Auth is simulated in this local test; SQL/ACL/RLS execute in real Postgres WASM.
    create function rwadar_cuentas_privadas.sesion_confirmada() returns boolean language sql stable
      as $$ select current_setting('prueba.confirmada',true)='si' $$;
    grant execute on function rwadar_cuentas_privadas.sesion_confirmada() to authenticated;`);
  for (const name of tablas) await db.exec(`create table ${name}(id int primary key, texto text);
    insert into ${name} values (1,'lote conservado'); alter table ${name} enable row level security;
    create policy lectura_anterior on ${name} for select to anon,authenticated using(true);
    grant select on ${name} to anon,authenticated;`);
  for (const name of vistas) await db.exec(`create view ${name} as select * from rwadar_catalogo.ofertas;
    grant select on ${name} to anon,authenticated;`);
  // Include old column-level grants and PUBLIC in the rollback evidence.
  await db.exec(`revoke select on public.categorias from anon;
    grant select(id) on public.categorias to anon;
    grant select(texto) on public.regiones to public;
    grant select on public.fuentes to authenticated with grant option;`);
  return db;
}
async function acl(db) {
  return (await db.query(`select n.nspname,c.relname,c.relacl::text,c.reloptions,
      a.attname,a.attacl::text,c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
      join pg_attribute a on a.attrelid=c.oid and a.attnum>0 and not a.attisdropped
      where n.nspname in ('public','rwadar_catalogo') and c.relkind in ('r','v')
      order by n.nspname,c.relname,a.attnum`)).rows;
}
async function como(db, rol, consulta, confirmada = 'no') {
  try {
    await db.exec(`set role ${rol}; set prueba.confirmada='${confirmada}'`);
    return await db.query(consulta);
  } finally { await db.exec('reset role'); }
}
test('SQL local: denegación anónima, sesión confirmada, conservación, idempotencia y reversión ACL', async () => {
  const db = await preparar();
  try {
    const anterior = await acl(db);
    await db.exec(adelante);
    for (const name of [...tablas, ...vistas]) {
      await assert.rejects(como(db, 'anon', `select * from ${name}`), error => error.code === '42501');
      assert.equal((await como(db, 'authenticated', `select * from ${name}`, 'no')).rows.length, 0, name);
      assert.equal((await como(db, 'authenticated', `select * from ${name}`, 'si')).rows.length, 1, name);
    }
    await assert.rejects(como(db, 'anon', 'select id from public.categorias'), e => e.code === '42501');
    await assert.rejects(como(db, 'anon', 'select texto from public.regiones'), e => e.code === '42501');
    assert.equal((await db.query('select count(*)::int n from rwadar_acceso_privado.catalogo_acl_20261023')).rows[0].n, 24);
    const despues = await acl(db);
    await db.exec(adelante); assert.deepEqual(await acl(db), despues);
    for (const name of tablas) assert.deepEqual((await db.query(`select * from ${name}`)).rows, [{ id: 1, texto: 'lote conservado' }]);
    await db.exec(atras); assert.deepEqual(await acl(db), anterior);
    await db.exec(atras); assert.deepEqual(await acl(db), anterior);
    await assert.rejects(db.exec(adelante), /Rollback previo/); await db.exec('rollback');
  } finally { await db.close(); }
});
test('SQL local: inventario incompleto aborta toda la operación sin cambiar permisos', async () => {
  const db = await preparar();
  try {
    await db.exec('drop view public.emisiones_rancias'); const anterior = await acl(db);
    await assert.rejects(db.exec(adelante), /Inventario inesperado/); await db.exec('rollback');
    assert.deepEqual(await acl(db), anterior);
    assert.equal((await db.query("select to_regclass('rwadar_acceso_privado.catalogo_acl_20261023') objeto")).rows[0].objeto, null);
  } finally { await db.close(); }
});
test('esquema real y lote 26/49: ACL 28 conserva joins/datos, exige Auth real del esquema y revierte', async () => {
  const cwd=process.cwd(), app=fileURLToPath(new URL('../rwadar-app/',import.meta.url));
  process.chdir(app);let db;
  try {
    const {baseCompleta,alta,filas,sesion}=await import('../rwadar-app/pruebas-soporte.mjs');
    db=await baseCompleta();
    await db.exec('alter default privileges grant all on tables to anon, authenticated');
    for(const file of ['db/24_catalogo_publico_verificado.sql','db/25_servicios_editoriales_solo_lectura.sql',
      'supabase/migrations/20260930084133_ofertas_documentacion_publica.sql',
      'supabase/migrations/20260930090621_catalogo_v2_colecciones.sql',
      'supabase/migrations/20261001150000_catalogo_siempre_disponible.sql','db/26_reabrir_cuentas.sql'])
      await db.exec(fs.readFileSync(path.join(app,file),'utf8'));
    // Only GoTrue infrastructure/JWT signing are simulated. The helper, policies,
    // joins, schema, import and all catalog rows below are actual repository SQL.
    await db.exec(`alter table auth.users add column is_anonymous boolean default false;
      create or replace function auth.uid() returns uuid language sql stable security definer
        set search_path='' as $$ select uid from public._sesion limit 1 $$;
      create table auth.sessions(id uuid primary key,user_id uuid not null references auth.users(id),not_after timestamptz);
      create function auth.jwt() returns jsonb language sql stable as $$
        select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
      revoke all on auth.sessions,auth.users from public,anon,authenticated;`);
    await db.exec(fs.readFileSync(path.join(app,'supabase/migrations/20261011074218_cuentas_sesion_confirmada.sql'),'utf8'));
    const usuario=await alta(db,'solo-fixture-acceso@ejemplo.test');
    const sid='10000000-0000-4000-8000-000000000001';
    await db.query('insert into auth.sessions(id,user_id) values($1,$2)',[sid,usuario.id]);
    await db.exec(fs.readFileSync(path.join(app,'data/importaciones/catalogo-2026-10-22-v2/aplicar-y-aprobar.sql'),'utf8'));
    const vista=async()=>({
      plataformas:await filas(db,'select * from public.catalogo_plataformas_publicas_v2 order by slug'),
      ofertas:await filas(db,'select * from public.catalogo_ofertas_publicas_v2 order by slug')});
    const snapshot=async()=>Object.fromEntries(await Promise.all(tablas.map(async name=>[name,
      await filas(db,`select to_jsonb(t)::text fila from ${name} t order by to_jsonb(t)::text`)])));
    await sesion(db,null,'anon');const antes=await vista();await sesion(db);
    assert.equal(antes.plataformas.length,26);assert.equal(antes.ofertas.length,49);
    const filasAntes=await snapshot(),aclAntes=await acl(db);
    await db.exec(adelante);await db.exec(adelante);
    await assert.rejects(como(db,'anon','select * from public.catalogo_ofertas_publicas_v2'),e=>e.code==='42501');
    const epoch=Number((await filas(db,'select extract(epoch from now())::int n'))[0].n);
    const claims={sub:usuario.id,role:'authenticated',session_id:sid,exp:epoch+3600,is_anonymous:false};
    await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify(claims)]);
    await sesion(db,usuario.id,'authenticated');
    assert.deepEqual(await vista(),antes,'misma copia completa 26/49 y joins reales, sin cambiar fechas');
    assert.equal((await filas(db,'select id from public.mi_perfil'))[0].id,usuario.id);
    await sesion(db);await db.query('update auth.users set email_confirmed_at=null where id=$1',[usuario.id]);
    await sesion(db,usuario.id,'authenticated');assert.equal((await vista()).ofertas.length,0);
    await sesion(db);await db.query('update auth.users set email_confirmed_at=now() where id=$1',[usuario.id]);
    await db.query('delete from auth.sessions where id=$1',[sid]);
    await sesion(db,usuario.id,'authenticated');assert.equal((await vista()).ofertas.length,0,'JWT no vencido con sesión revocada');
    await sesion(db);assert.deepEqual(await snapshot(),filasAntes);
    await db.exec(atras);assert.deepEqual(await acl(db),aclAntes);
    await sesion(db,null,'anon');assert.deepEqual(await vista(),antes);
  } finally {if(db)await db.close();process.chdir(cwd);}
});

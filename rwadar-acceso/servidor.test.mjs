import test from 'node:test';
import assert from 'node:assert/strict';
import { crearAccesoServidor, retornoSeguro } from './servidor.mjs';

const ORIGIN = 'https://rwadar.pages.dev';
const UID = '11111111-1111-4111-8111-111111111111';
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.prueba';
const ENV = { SUPABASE_URL: 'https://exgpmjpaaebyoolpwced.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_prueba' };
function entorno(options = {}) {
  const calls = []; let served = 0;
  const server = crearAccesoServidor({ fetchImpl: async (url, init) => {
    calls.push({ url, init });
    if (options.fetch) return options.fetch(url, init);
    if (url.includes('/token?')) return Response.json({ access_token: TOKEN });
    if (url.includes('/user')) return Response.json(options.user || { id: UID, email: 'cuenta@ejemplo.test', email_confirmed_at: '2026-10-23T10:00:00Z', is_anonymous: false });
    if (url.includes('/mi_perfil?')) return Response.json(options.profile === undefined ? [{ id: UID }] : options.profile);
    return Response.json({});
  } });
  async function run(path, { method = 'GET', data, token, origin = ORIGIN, accept = 'application/json', env = ENV, authorization } = {}) {
    const headers = { accept, ...(token ? { cookie: '__Host-rwadar-acceso=' + token } : {}) };
    if(authorization)headers.authorization=authorization;
    if (method === 'POST') Object.assign(headers, { origin, 'content-type': 'application/json' });
    return server.atender({ env, request: new Request(ORIGIN + path, { method, headers, ...(data ? { body: JSON.stringify(data) } : {}) }),
      next: async () => { served++; return new Response('CATALOGO PRIVADO', { headers: { 'Cache-Control': 'public,max-age=31536000' } }); } });
  }
  return { run, calls, served: () => served };
}
test('sin sesión no entrega HTML, snapshot, fotos, RSS ni rutas SEO', async () => {
  const e = entorno();
  for (const path of ['/', '/ofertas-editoriales/spiko/', '/assets/catalogo-publico.js', '/novedades.xml', '/sitemap.xml', '/ofertas-editoriales/spiko.webp']) {
    const response = await e.run(path); assert.equal(response.status, 401); assert.equal(e.served(), 0);
    assert.ok(!(await response.text()).includes('CATALOGO PRIVADO'));
  }
  assert.equal(e.calls.length, 0);
  const html = await e.run('/ofertas-editoriales/spiko', { accept: 'text/html' });
  assert.equal(html.status, 303); assert.ok(html.headers.get('location').startsWith('/acceso?volver='));
});
test('acceso, su JS/CSS versionado y legales quedan públicos', async () => {
  const e = entorno();
  for (const path of ['/acceso', '/privacidad', '/condiciones', '/aviso-legal', '/assets/acceso.123456789abc.js']) {
    assert.equal((await e.run(path)).status, 200);
  }
  assert.equal(e.calls.length, 0);
});
test('JWT confirmado pero sesión revocada no sirve catálogo', async () => {
  const e = entorno({ profile: [] }); const response = await e.run('/', { token: TOKEN });
  assert.equal(response.status, 401); assert.equal(e.served(), 0);
  assert.equal(e.calls.length, 2); assert.ok(e.calls[1].url.includes('/mi_perfil?'));
});
test('correo sin confirmar y usuario anónimo no acceden', async () => {
  for (const user of [{ id: UID, email: 'a@b.test', is_anonymous: true, email_confirmed_at: '2026-10-23T00:00:00Z' },
    { id: UID, email: 'a@b.test', is_anonymous: false }]) {
    const e = entorno({ user }); assert.equal((await e.run('/', { token: TOKEN })).status, 401);
    assert.equal(e.served(), 0); assert.equal(e.calls.length, 1);
  }
});
test('perfil de otra persona se rechaza aunque GoTrue valide token', async () => {
  const e = entorno({ profile: [{ id: '22222222-2222-4222-8222-222222222222' }] });
  assert.equal((await e.run('/', { token: TOKEN })).status, 401); assert.equal(e.served(), 0);
});
test('sesión confirmada y vigente sirve privado/no-store/noindex', async () => {
  const e = entorno(); const response = await e.run('/assets/catalogo-publico.js', { token: TOKEN });
  assert.equal(response.status, 200); assert.equal(await response.text(), 'CATALOGO PRIVADO');
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.equal(response.headers.get('vary'), 'Cookie');
});
test('Origin cruzado no envía claves a GoTrue ni crea cookies', async () => {
  const e = entorno(); const response = await e.run('/api/acceso/entrar', { method: 'POST',
    origin: 'https://atacante.test', data: { correo: 'a@b.test', clave: 'clave' } });
  assert.equal(response.status, 403); assert.equal(e.calls.length, 0); assert.equal(response.headers.get('set-cookie'), null);
});
test('login válido crea solo cookie HttpOnly/Secure/SameSite, no devuelve tokens', async () => {
  const e = entorno(); const response = await e.run('/api/acceso/entrar', { method: 'POST', data: { correo: 'a@b.test', clave: 'secreto-solo-prueba' } });
  assert.equal(response.status, 200); const set = response.headers.get('set-cookie');
  for (const part of ['__Host-rwadar-acceso=', 'HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/']) assert.ok(set.includes(part));
  const body = await response.text(); assert.ok(!body.includes(TOKEN)); assert.ok(!body.includes('secreto-solo-prueba'));
});
test('registro nunca crea acceso aunque proveedor devuelva sesión autoconfirmada', async () => {
  const e = entorno({ fetch: async () => Response.json({ access_token: TOKEN }) });
  const response = await e.run('/api/acceso/registrar', { method: 'POST', data: { correo: 'a@b.test', clave: 'una-clave-larga-12', aceptaCondiciones: true } });
  assert.equal(response.status, 200); assert.equal(response.headers.get('set-cookie'), null);
  assert.equal((await response.json()).confirmarCorreo, true); assert.equal(e.calls.length, 1);
});
test('inspección de enlace no adopta sesión; adoptar requiere confirmación explícita', async () => {
  const e = entorno(); const inspected = await e.run('/api/acceso/inspeccionar', { method: 'POST', data: { access_token: TOKEN } });
  assert.equal(inspected.status, 200); assert.equal(inspected.headers.get('set-cookie'), null);
  const denied = await e.run('/api/acceso/adoptar', { method: 'POST', data: { access_token: TOKEN } });
  assert.equal(denied.status, 400);
  const admitted = await e.run('/api/acceso/adoptar', { method: 'POST', data: { access_token: TOKEN, confirmarIdentidad: true } });
  assert.equal(admitted.status, 200); assert.ok(admitted.headers.get('set-cookie').includes(TOKEN));
});
test('configuración ausente falla cerrada y no inventa un usuario autenticado', async () => {
  const e = entorno(); assert.equal((await e.run('/api/acceso/sesion', { token: TOKEN, env: {} })).status, 503);
  assert.equal(e.served(), 0); assert.equal(e.calls.length, 0);
});
test('retorno no permite redirecciones externas, barras inversas ni Auth recursivo', () => {
  for (const value of ['https://atacante.test', '//atacante.test', '/\\atacante.test', '/api/acceso/entrar', '/acceso', '/acceso.html', '/x\r\nLocation:evil']) assert.equal(retornoSeguro(value, ORIGIN), '/');
  assert.equal(retornoSeguro('/ofertas-editoriales/spiko?access_token=no#no', ORIGIN), '/ofertas-editoriales/spiko');
});
test('proxy catálogo usa la sesión verificada, limita consultas y nunca devuelve el token', async () => {
  const e=entorno({fetch:async (url,init)=>{
    if(url.includes('/auth/v1/user'))return Response.json({id:UID,email:'a@b.test',email_confirmed_at:'2026-10-23T10:00:00Z'});
    if(url.includes('/mi_perfil?'))return Response.json([{id:UID}]);
    assert.equal(init.headers.Authorization,'Bearer '+TOKEN);
    return Response.json([{slug:'oferta-probada'}]);
  }});
  const r=await e.run('/api/acceso/catalogo/catalogo_ofertas_publicas_v2?select=*&limit=49',{token:TOKEN});
  assert.equal(r.status,200);assert.deepEqual(await r.json(),[{slug:'oferta-probada'}]);
  assert.equal(e.calls.length,3);
  assert.equal((await e.run('/api/acceso/catalogo/catalogo_ofertas_publicas_v2?limit=1002',{token:TOKEN})).status,400);
  assert.equal((await e.run('/api/acceso/catalogo/perfiles',{token:TOKEN})).status,404);
});
test('pasarela de cuenta rechaza rutas, métodos y RPC ajenos y no borra otra cookie en un fallo',async()=>{
  const e=entorno();
  for(const data of [{ruta:'//atacante.test'},{ruta:'/auth/users'},{ruta:'/rpc/establecer_admin',metodo:'POST'},
    {ruta:'/plataformas',metodo:'DELETE'},{ruta:'/perfiles',metodo:'POST'},{ruta:'/vigilancia',metodo:'PATCH'}]) {
    const r=await e.run('/api/acceso/datos',{method:'POST',token:TOKEN,data});
    assert.equal(r.status,400);assert.equal(r.headers.get('set-cookie'),null);
  }
  assert.ok(e.calls.every(x=>x.url.includes('/auth/v1/user')||x.url.includes('/mi_perfil?')));
});
test('pasarela conserva los filtros y la sesión de la cuenta en sus lecturas',async()=>{
  const e=entorno();
  const r=await e.run('/api/acceso/datos',{method:'POST',token:TOKEN,data:{ruta:'/vigilancia?select=usuario_id&usuario_id=eq.'+UID}});
  assert.equal(r.status,200); const call=e.calls.at(-1);
  assert.equal(call.init.headers.Authorization,'Bearer '+TOKEN);assert.ok(call.url.includes('usuario_id=eq.'+UID));
  assert.ok(!JSON.stringify(await r.json()).includes(TOKEN));
});
test('tutorial nativo exige Bearer confirmado; cookie sola y URL con token no lo abren',async()=>{
  const e=entorno();
  assert.equal((await e.run('/api/acceso/tutorial',{token:TOKEN})).status,401);
  assert.equal((await e.run('/api/acceso/tutorial?token='+TOKEN,{authorization:'Bearer '+TOKEN})).status,400);
  const r=await e.run('/api/acceso/tutorial',{authorization:'Bearer '+TOKEN});
  assert.equal(r.status,200);assert.equal(r.headers.get('location'),null);
  assert.ok(r.headers.get('set-cookie').includes('HttpOnly'));
  assert.equal(r.headers.get('access-control-allow-origin'),null);
  assert.ok(!(await r.text()).includes(TOKEN));
});
test('tutorial nativo rechaza la sesión revocada sin adoptar cookie',async()=>{
  const e=entorno({profile:[]});const r=await e.run('/api/acceso/tutorial',{authorization:'Bearer '+TOKEN});
  assert.equal(r.status,401);assert.equal(r.headers.get('set-cookie'),null);
});
test('login usa redirect manual compatible con Workers y conserva la comprobación de sesión',async()=>{
  const calls=[];
  const e=entorno({fetch:async(url,init)=>{
    calls.push(url);assert.equal(init.redirect,'manual');
    if(url.includes('/token?'))return Response.json({access_token:TOKEN});
    if(url.includes('/auth/v1/user'))return Response.json({id:UID,email:'cuenta@ejemplo.test',email_confirmed_at:'2026-10-23T10:00:00Z',is_anonymous:false});
    if(url.includes('/mi_perfil?'))return Response.json([{id:UID}]);
    throw new Error('Ruta inesperada');
  }});
  const r=await e.run('/api/acceso/entrar',{method:'POST',data:{correo:'cuenta@ejemplo.test',clave:'solo-prueba-sin-red'}});
  assert.equal(r.status,200);assert.equal(calls.length,3);assert.ok(r.headers.get('set-cookie').includes('HttpOnly'));
});
test('una redirección del proveedor se rechaza sin seguir Location ni adoptar sesión',async()=>{
  const e=entorno({fetch:async()=>new Response(null,{status:302,headers:{Location:'https://ajeno.example.invalid'}})});
  const r=await e.run('/api/acceso/entrar',{method:'POST',data:{correo:'cuenta@ejemplo.test',clave:'solo-prueba-sin-red'}});
  assert.equal(r.status,401);assert.equal(r.headers.get('set-cookie'),null);assert.equal(e.calls.length,1);
  assert.ok(e.calls[0].url.startsWith(ENV.SUPABASE_URL+'/auth/v1/token?'));
});

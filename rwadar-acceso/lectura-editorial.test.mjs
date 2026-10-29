import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { crearLecturaEditorial } = require('./lectura-editorial.cjs');
const UID = '11111111-1111-4111-8111-111111111111';
const TOKEN = 'eyJ0ZXN0.e30.ZmlybWE';

test('sin cuenta vigente no inicia la sincronización editorial', async () => {
  let llamadas = 0;
  await assert.rejects(crearLecturaEditorial('', { fetchImpl: () => { llamadas++; } }), /Falta RWADAR/);
  assert.equal(llamadas, 0);
});
test('verifica cuenta y sesión antes de leer; nunca envía su token a otro origen', async () => {
  const llamadas = [];
  const fetchImpl = async (url, options) => {
    llamadas.push({ url, options });
    const body = url.endsWith('/auth/v1/user')
      ? { id: UID, email: 'control@example.test', email_confirmed_at: '2026-10-23T00:00:00Z' }
      : url.includes('/mi_perfil?') ? [{ id: UID }] : [];
    return new Response(JSON.stringify(body), { status: 200 });
  };
  const leer = await crearLecturaEditorial(TOKEN, { fetchImpl });
  assert.equal(llamadas.length, 2);
  await assert.rejects(leer('https://otro.example/rest/v1/plataformas'), /solo admite GET/);
  await assert.rejects(leer('https://exgpmjpaaebyoolpwced.supabase.co/auth/v1/user'), /solo admite GET/);
  assert.equal(llamadas.length, 2);
  await leer('https://exgpmjpaaebyoolpwced.supabase.co/rest/v1/catalogo_ofertas_publicas_v2?select=*');
  const ultima = llamadas.at(-1);
  assert.equal(ultima.options.headers.get('authorization'), 'Bearer ' + TOKEN);
  assert.equal(ultima.options.redirect, 'error');
  assert.equal(ultima.options.cache, 'no-store');
});

test('la transición usa solo lectura pública vigente y conserva la denegación del servidor', async () => {
  let llamadas = 0;
  const leer = await crearLecturaEditorial(undefined, { permitirPublicaActual: true,
    fetchImpl: async (url, options) => {
      llamadas++; assert.equal(options.headers.has('authorization'), false);
      return new Response('Acceso denegado', { status: 403 });
    } });
  const resultado = await leer('https://exgpmjpaaebyoolpwced.supabase.co/rest/v1/catalogo_ofertas_publicas_v2?limit=1');
  assert.equal(resultado.status, 403);
  assert.equal(llamadas, 1);
});

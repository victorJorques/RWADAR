import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../rwadar-site/acceso.html', import.meta.url), 'utf8');
const script = fs.readFileSync(new URL('../rwadar-site/assets/acceso.js', import.meta.url), 'utf8');

function diferida() {
  let resolver;
  const promesa = new Promise(resolve => { resolver = resolve; });
  return { promesa, resolver };
}

function formulario(responder, { hash = '' } = {}) {
  const elementos = new Map(), botones = [], peticiones = [], destinos = [];
  const storage = new Map([['rwadar.cierre.pendiente', 'si']]);
  for (const [, tag, atributos] of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/g)) {
    const id = atributos.match(/\bid="([^"]+)"/)?.[1];
    const vista = atributos.match(/\bdata-vista="([^"]+)"/)?.[1];
    if (!id && !vista) continue;
    const elemento = { value: '', checked: false, disabled: false, textContent: '',
      hidden: /\bhidden\b/.test(atributos), dataset: { vista }, eventos: {},
      addEventListener(tipo, ejecutar) { this.eventos[tipo] = ejecutar; },
      reportValidity() { return true; }, focus() {} };
    if (id) elementos.set(id, elemento);
    if (tag === 'button' && vista) botones.push(elemento);
  }
  const context = vm.createContext({
    document: { getElementById: id => elementos.get(id), querySelectorAll: () => botones },
    sessionStorage: { getItem: key => storage.get(key) || null, removeItem: key => storage.delete(key) },
    location: { origin: 'https://rwadar.pages.dev', pathname: '/acceso', search: '', hash, replace: path => destinos.push(path) },
    history: { replaceState() {} }, URL, URLSearchParams, AbortController, setTimeout: () => 0, clearTimeout() {},
    fetch: async (ruta, opciones) => {
      peticiones.push(ruta);
      if (ruta.endsWith('/sesion')) {
        assert.equal(opciones.method, 'GET');
        assert.equal(opciones.credentials, 'same-origin');
        assert.equal(opciones.cache, 'no-store');
      }
      return responder(ruta, opciones);
    },
  });
  vm.runInContext(script, context);
  return { elemento: id => elementos.get(id), peticiones, destinos, storage };
}

function enviar(e) {
  e.elemento('correo').value = 'cuenta@example.test';
  e.elemento('clave').value = 'clave-solo-de-prueba';
  return e.elemento('formulario').eventos.submit({ preventDefault() {} });
}

test('Entrar espera el único cierre pendiente antes de crear la sesión nueva', async () => {
  const cierre = diferida();
  const e = formulario(ruta => ruta.endsWith('/salir') ? cierre.promesa : Response.json({ autenticada: true, usuario: { id: '11111111-1111-4111-8111-111111111111' } }));
  const entrada = enviar(e);
  assert.deepEqual(e.peticiones, ['/api/acceso/salir'], 'Carga y formulario deben compartir el cierre en curso');
  assert.deepEqual(e.destinos, [], 'No navega mientras el cierre puede borrar la cookie');
  cierre.resolver(Response.json({ cerrado: true }));
  await entrada;
  assert.deepEqual(e.peticiones, ['/api/acceso/salir', '/api/acceso/entrar', '/api/acceso/sesion']);
  assert.deepEqual(e.destinos, ['/']);
  assert.equal(e.storage.has('rwadar.cierre.pendiente'), false);
});

test('un cierre fallido impide entrar y permite un nuevo intento ordenado', async () => {
  const cierre = diferida(); let intentos = 0;
  const e = formulario(ruta => {
    if (ruta.endsWith('/salir')) return ++intentos === 1 ? cierre.promesa : Response.json({ cerrado: true });
    return Response.json({ autenticada: true, usuario: { id: '11111111-1111-4111-8111-111111111111' } });
  });
  const entrada = enviar(e);
  cierre.resolver(Response.json({ error: 'sin_red' }, { status: 503 }));
  await entrada;
  assert.deepEqual(e.peticiones, ['/api/acceso/salir']);
  assert.deepEqual(e.destinos, []);
  assert.equal(e.storage.get('rwadar.cierre.pendiente'), 'si');
  assert.equal(e.elemento('enviar').disabled, false);
  await enviar(e);
  assert.deepEqual(e.peticiones, ['/api/acceso/salir', '/api/acceso/salir', '/api/acceso/entrar', '/api/acceso/sesion']);
  assert.deepEqual(e.destinos, ['/']);
});

test('confirmar un enlace también espera el cierre compartido antes de adoptar la sesión', async () => {
  const cierre = diferida();
  const e = formulario(ruta => {
    if (ruta.endsWith('/salir')) return cierre.promesa;
    if (ruta.endsWith('/inspeccionar')) return Response.json({ usuario: { correo: 'cuenta@example.test' } });
    return Response.json({ autenticada: true, usuario: { id: '11111111-1111-4111-8111-111111111111' } });
  }, { hash: '#access_token=solo.prueba.token&type=signup' });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(e.elemento('identidad').hidden, false);
  const adopcion = e.elemento('adoptar').eventos.click();
  assert.equal(e.peticiones.filter(ruta => ruta.endsWith('/salir')).length, 1);
  assert.equal(e.peticiones.some(ruta => ruta.endsWith('/adoptar')), false);
  cierre.resolver(Response.json({ cerrado: true }));
  await adopcion;
  assert.deepEqual(e.peticiones.filter(ruta => !ruta.endsWith('/inspeccionar')),
    ['/api/acceso/salir', '/api/acceso/adoptar', '/api/acceso/sesion']);
  assert.deepEqual(e.destinos, ['/']);
});

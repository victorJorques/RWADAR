import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { crearAccesoServidor } from './servidor.mjs';

const html = fs.readFileSync(new URL('../rwadar-site/acceso.html', import.meta.url), 'utf8');
const script = fs.readFileSync(new URL('../rwadar-site/assets/acceso.js', import.meta.url), 'utf8');
const origin = 'https://rwadar.pages.dev';
const env = { SUPABASE_URL: 'https://exgpmjpaaebyoolpwced.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_prueba' };

function formulario(respuestaAuth, { hash = '' } = {}) {
  const elementos = new Map(), botones = [], peticiones = [], respuestas = [];
  let foco = null;
  const location = { origin, pathname: '/acceso', search: '', hash, replace() { assert.fail('El alta no inicia sesión'); } };
  const historial = [];
  // Los controles se descubren en el HTML real, incluido su estado hidden.
  for (const [, tag, atributos] of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/g)) {
    const id = atributos.match(/\bid="([^"]+)"/)?.[1];
    const vista = atributos.match(/\bdata-vista="([^"]+)"/)?.[1];
    if (!id && !vista) continue;
    const elemento = { value: '', checked: false, disabled: false, textContent: '',
      hidden: /\bhidden\b/.test(atributos), dataset: { vista }, eventos: {},
      addEventListener(tipo, ejecutar) { this.eventos[tipo] = ejecutar; },
      reportValidity() { return true; }, focus() { foco = id; } };
    if (id) elementos.set(id, elemento);
    if (tag === 'button' && vista) botones.push(elemento);
  }
  const servidor = crearAccesoServidor({ fetchImpl: async (url, opciones) => {
    peticiones.push(url);
    return Response.json(typeof respuestaAuth === 'function' ? respuestaAuth(url, opciones) : respuestaAuth);
  } });
  const context = vm.createContext({
    document: { getElementById: id => elementos.get(id), querySelectorAll: () => botones },
    sessionStorage: { getItem: () => null, removeItem() {} },
    location,
    history: { replaceState(_estado, _titulo, ruta) { historial.push(ruta); location.hash = ''; } },
    URL, URLSearchParams, AbortController, setTimeout, clearTimeout,
    fetch: async (ruta, opciones) => {
      const respuesta = await servidor.atender({ env,
        request: new Request(origin + ruta, { ...opciones, headers: { ...opciones.headers, origin } }),
        next() { assert.fail('El registro no sirve contenido privado'); } });
      respuestas.push({ estado: respuesta.status, cuerpo: await respuesta.clone().json(), cookie: respuesta.headers.get('set-cookie') });
      return respuesta;
    },
  });
  vm.runInContext(script, context);
  return { elemento: id => elementos.get(id), botones, peticiones, respuestas, historial, foco: () => foco };
}

test('alta nueva y repetida ofrecen la misma orientación y conservan el correo al entrar o recuperar', async () => {
  const mensajes = [];
  for (const respuestaAuth of [{ id: 'alta-nueva', identities: [{ provider: 'email' }] }, { id: 'respuesta-oculta', identities: [] }]) {
    for (const destino of ['entrar', 'recuperar']) {
      const e = formulario(respuestaAuth);
      e.botones.find(b => b.dataset.vista === 'registrar').eventos.click();
      e.elemento('correo').value = 'titular@example.test';
      e.elemento('clave').value = 'una-clave-solo-prueba';
      e.elemento('condiciones').checked = true;
      await e.elemento('formulario').eventos.submit({ preventDefault() {} });
      assert.equal(e.respuestas[0].estado, 200);
      assert.equal(e.respuestas[0].cookie, null);
      assert.equal(e.peticiones.length, 1, 'No inicia recuperación ni reenvío automáticamente');
      assert.match(e.peticiones[0], /\/auth\/v1\/signup\?/);
      assert.equal(e.elemento('formulario').hidden, true);
      assert.equal(e.elemento('acciones').hidden, true);
      assert.equal(e.elemento('siguiente-alta').hidden, false);
      assert.equal(e.foco(), 'entrar-tras-alta');
      const mensaje = e.elemento('estado').textContent;
      assert.match(mensaje, /Si la cuenta es nueva/);
      assert.match(mensaje, /Si ya tenías cuenta/);
      mensajes.push(mensaje);
      const opcionesAlta = e.botones.slice(0, 2);
      opcionesAlta.find(b => b.dataset.vista === destino).eventos.click();
      assert.equal(e.elemento('correo').value, 'titular@example.test');
      assert.equal(e.elemento('clave').value, '');
      assert.equal(e.elemento('estado').textContent, '');
      assert.equal(e.elemento('siguiente-alta').hidden, true);
      assert.equal(e.elemento('formulario').hidden, false);
      assert.equal(e.elemento('acciones').hidden, false);
      assert.equal(e.elemento('enviar').textContent, destino === 'entrar' ? 'Entrar' : 'Enviar enlace de recuperación');
      assert.equal(e.elemento('campo-clave').hidden, destino === 'recuperar');
      assert.equal(e.peticiones.length, 1, 'Cambiar de vista no envía correos');
    }
  }
  assert.equal(new Set(mensajes).size, 1, 'La respuesta no revela si la cuenta ya existía');
});

test('destino del correo queda fijado a producción o revisión en alta, recuperación y reenvío', async () => {
  for (const [origen, destino] of [
    ['https://rwadar.pages.dev', 'https://rwadar.pages.dev/'],
    ['https://revision.rwadar.pages.dev', 'https://revision.rwadar.pages.dev/'],
    ['https://cb16f29e.rwadar.pages.dev', 'https://revision.rwadar.pages.dev/'],
    ['https://cb16f29e.otro-proyecto.pages.dev', 'https://rwadar.pages.dev/'],
    ['https://revision.rwadar.pages.dev.atacante.test', 'https://rwadar.pages.dev/'],
    ['https://atacante.test', 'https://rwadar.pages.dev/'],
  ]) {
    for (const accion of ['registrar', 'recuperar', 'reenviar']) {
      const urls = [];
      const servidor = crearAccesoServidor({ fetchImpl: async url => { urls.push(url); return Response.json({}); } });
      const response = await servidor.atender({ env,
        request: new Request(origen + '/api/acceso/' + accion, { method: 'POST',
          headers: { origin: origen, 'Content-Type': 'application/json' },
          body: JSON.stringify({ correo: 'titular@example.test', clave: 'una-clave-solo-prueba', aceptaCondiciones: true }) }),
        next() { assert.fail('No sirve contenido privado'); } });
      assert.equal(response.status, 200);
      assert.equal(urls.length, 1);
      assert.equal(new URL(urls[0]).searchParams.get('redirect_to'), destino, origen + ' / ' + accion);
    }
  }
});

test('fragmento de recuperación se limpia y exige confirmar identidad antes de pedir nueva contraseña', async () => {
  const token = 'eyJ0ZXN0.e30.ZmlybWE';
  const e = formulario(url => url.endsWith('/auth/v1/user')
    ? { id: '11111111-1111-4111-8111-111111111111', email: 'titular@example.test', email_confirmed_at: '2026-10-11T08:00:00Z' }
    : [{ id: '11111111-1111-4111-8111-111111111111' }],
  { hash: '#access_token=' + token + '&type=recovery&expires_in=3600' });
  for (let intento = 0; intento < 20 && e.elemento('identidad').hidden; intento++) await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(e.historial, ['/acceso']);
  assert.equal(e.elemento('identidad').hidden, false);
  assert.equal(e.elemento('formulario').hidden, true);
  assert.equal(e.respuestas.length, 1);
  assert.equal(e.respuestas[0].cookie, null, 'Inspeccionar el enlace no inicia sesión');
  assert.ok(e.peticiones.every(url => !url.includes(token)), 'El token no va en las URL');
  await e.elemento('adoptar').eventos.click();
  assert.equal(e.elemento('identidad').hidden, true);
  assert.equal(e.elemento('formulario').hidden, false);
  assert.equal(e.elemento('correo').value, 'titular@example.test');
  assert.equal(e.elemento('correo').readOnly, true);
  assert.equal(e.elemento('enviar').textContent, 'Guardar nueva contraseña');
  assert.equal(e.elemento('clave').autocomplete, 'new-password');
  assert.equal(e.elemento('clave').required, true);
  assert.equal(e.respuestas.length, 1, 'Llegar al formulario no cambia contraseña ni envía mensajes');
});

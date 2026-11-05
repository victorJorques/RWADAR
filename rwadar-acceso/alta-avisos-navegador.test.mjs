import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Alta en /acceso (contrato: docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md):
// casilla obligatoria con los 18 años, casilla de avisos de novedades detrás de
// AVISOS_NOVEDADES_REMOTOS y vuelta a la lección tras confirmar el correo.
const html = fs.readFileSync(new URL('../rwadar-site/acceso.html', import.meta.url), 'utf8');
const original = fs.readFileSync(new URL('../rwadar-site/assets/acceso.js', import.meta.url), 'utf8');
const APAGADO = 'const AVISOS_NOVEDADES_REMOTOS = false;';
const encendido = original.replace(APAGADO, 'const AVISOS_NOVEDADES_REMOTOS = true;');
const TEXTO_ES = 'Quiero recibir avisos de RWAdar por correo y, si los activo en mi móvil, como notificaciones: ' +
  'ofertas nuevas en el radar y novedades de la web y la app. Es opcional: la Academy se desbloquea igual. ' +
  'Puedes darte de baja en cada aviso o en Perfil. Más información en Privacidad.';
const uid = '11111111-1111-4111-8111-111111111111';
const DIA = 24 * 60 * 60 * 1000;
const tick = () => new Promise(resolve => setImmediate(resolve));
const texto = fragmento => fragmento.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

function pagina({ script = original, search = '', hash = '', guardado = new Map(), almacenRoto = false } = {}) {
  const elementos = new Map(), botones = [], peticiones = [], destinos = [];
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
  const roto = () => { throw new Error('almacenamiento bloqueado'); };
  const localStorage = almacenRoto ? { getItem: roto, setItem: roto, removeItem: roto }
    : { getItem: clave => guardado.has(clave) ? guardado.get(clave) : null,
      setItem: (clave, valor) => guardado.set(clave, String(valor)), removeItem: clave => guardado.delete(clave) };
  const context = vm.createContext({
    document: { getElementById: id => elementos.get(id), querySelectorAll: () => botones },
    sessionStorage: { getItem: () => null, removeItem() {}, setItem() { assert.fail('Nada de credenciales en sessionStorage'); } },
    localStorage,
    location: { origin: 'https://rwadar.pages.dev', pathname: '/acceso', search, hash, replace: ruta => destinos.push(ruta) },
    history: { replaceState() {} }, URL, URLSearchParams, AbortController, setTimeout: () => 0, clearTimeout() {},
    fetch: async (ruta, opciones) => {
      const cuerpo = opciones.body ? JSON.parse(opciones.body) : null;
      peticiones.push({ ruta, cuerpo });
      if (ruta.endsWith('/inspeccionar')) return Response.json({ usuario: { id: uid, correo: 'alta@example.test' } });
      if (ruta.endsWith('/registrar')) return Response.json({ confirmarCorreo: true, mensaje: 'Si la cuenta es nueva, recibirás un enlace.' });
      if (ruta.endsWith('/sesion')) return Response.json({ autenticada: true, usuario: { id: uid } });
      return Response.json({ autenticada: true, usuario: { id: uid } });
    },
  });
  vm.runInContext(script, context);
  return {
    elemento: id => elementos.get(id), peticiones, destinos, guardado,
    vista: v => botones.find(b => b.dataset.vista === v && b !== elementos.get('entrar-tras-alta')),
    async registrar({ avisos = false } = {}) {
      elementos.get('correo').value = 'alta@example.test';
      elementos.get('clave').value = 'una-clave-solo-de-prueba';
      elementos.get('condiciones').checked = true;
      elementos.get('avisos-novedades').checked = avisos;
      await elementos.get('formulario').eventos.submit({ preventDefault() {} });
      return peticiones.find(p => p.ruta === '/api/acceso/registrar')?.cuerpo;
    },
  };
}

test('la casilla obligatoria dice que tienes 18 años o más, con condiciones y privacidad enlazadas', () => {
  const etiqueta = html.match(/<label id="campo-condiciones"[^>]*>([\s\S]*?)<\/label>/)[1];
  assert.equal(texto(etiqueta), 'Tengo 18 años o más, acepto las condiciones y he leído la privacidad.');
  assert.match(etiqueta, /href="\/privacidad#condiciones"/);
  assert.match(etiqueta, /href="\/privacidad"/);
});

test('la casilla de avisos lleva el texto exacto del contrato, aparte y sin marcar', () => {
  const etiqueta = html.match(/<label id="campo-avisos-novedades"([^>]*)>([\s\S]*?)<\/label>/);
  assert.ok(etiqueta, 'Existe la casilla #avisos-novedades');
  assert.match(etiqueta[1], /\bhidden\b/, 'Nace oculta en el HTML');
  assert.equal(texto(etiqueta[2]), TEXTO_ES);
  assert.ok(html.includes(TEXTO_ES), 'El texto va seguido, sin etiquetas dentro');
  assert.doesNotMatch(etiqueta[2], /\bchecked\b/);
  assert.ok(original.includes(APAGADO), 'El interruptor de la web nace apagado');
});

test('con el interruptor apagado no se ve la casilla y el alta no envía avisosNovedades', async () => {
  const p = pagina();
  p.vista('registrar').eventos.click();
  assert.equal(p.elemento('campo-condiciones').hidden, false);
  assert.equal(p.elemento('campo-avisos-novedades').hidden, true);
  const cuerpo = await p.registrar({ avisos: true });
  assert.ok(cuerpo, 'Se envía el alta');
  assert.equal(Object.hasOwn(cuerpo, 'avisosNovedades'), false, 'El JSON no lleva la clave');
  assert.equal(cuerpo.aceptaCondiciones, true);
});

test('con el interruptor encendido la casilla solo aparece al crear la cuenta y nace sin marcar', async () => {
  const p = pagina({ script: encendido });
  assert.equal(p.elemento('campo-avisos-novedades').hidden, true, 'En «Entrar» no se ve');
  p.vista('registrar').eventos.click();
  assert.equal(p.elemento('campo-avisos-novedades').hidden, false);
  assert.equal(p.elemento('avisos-novedades').checked, false);
  p.elemento('avisos-novedades').checked = true;
  for (const otra of ['entrar', 'recuperar', 'reenviar']) {
    p.vista(otra).eventos.click();
    assert.equal(p.elemento('campo-avisos-novedades').hidden, true, otra);
    p.vista('registrar').eventos.click();
    assert.equal(p.elemento('avisos-novedades').checked, false, 'Volver al alta la deja sin marcar');
  }
});

test('con el interruptor encendido el alta envía avisosNovedades como booleano estricto', async () => {
  for (const avisos of [false, true]) {
    const p = pagina({ script: encendido });
    p.vista('registrar').eventos.click();
    const cuerpo = await p.registrar({ avisos });
    assert.equal(cuerpo.avisosNovedades, avisos);
    assert.equal(typeof cuerpo.avisosNovedades, 'boolean');
  }
  // Entrar con una cuenta nunca manda la preferencia.
  const p = pagina({ script: encendido });
  p.elemento('correo').value = 'alta@example.test';
  p.elemento('clave').value = 'una-clave-solo-de-prueba';
  await p.elemento('formulario').eventos.submit({ preventDefault() {} });
  const entrar = p.peticiones.find(x => x.ruta === '/api/acceso/entrar').cuerpo;
  assert.equal(Object.hasOwn(entrar, 'avisosNovedades'), false);
});

test('sin la casilla de edad marcada no se envía nada', async () => {
  const p = pagina({ script: encendido });
  p.vista('registrar').eventos.click();
  p.elemento('correo').value = 'alta@example.test';
  p.elemento('clave').value = 'una-clave-solo-de-prueba';
  p.elemento('avisos-novedades').checked = true;
  await p.elemento('formulario').eventos.submit({ preventDefault() {} });
  assert.equal(p.peticiones.length, 0);
  assert.match(p.elemento('estado').textContent, /18 años o más/);
});

test('desde una lección se abre «Crear cuenta gratis» con su aviso y se guarda la vuelta 24 horas', async () => {
  const p = pagina({ search: '?volver=%2Facademy%2Fcomo-leer-el-radar' });
  assert.equal(p.elemento('titulo').textContent, 'Crea tu cuenta gratuita');
  assert.equal(p.elemento('enviar').textContent, 'Crear cuenta gratis');
  assert.equal(p.elemento('campo-condiciones').hidden, false);
  assert.match(p.elemento('introduccion').textContent, /^Las lecciones son gratis con cuenta\./);
  const antes = Date.now();
  await p.registrar();
  const guardado = JSON.parse(p.guardado.get('rwadar.alta.volver'));
  assert.deepEqual(Object.keys(guardado).sort(), ['hasta', 'ruta']);
  assert.equal(guardado.ruta, '/academy/como-leer-el-radar');
  assert.ok(guardado.hasta >= antes + DIA && guardado.hasta <= Date.now() + DIA);
  assert.deepEqual(p.destinos, [], 'El alta no inicia sesión ni navega');
});

test('solo cuenta como lección una ruta /academy/<slug> propia', async () => {
  for (const volver of ['/academy/', '/academy/index.html', '/', '//atacante.test/academy/x', '/academy/x?y=1',
    'https://atacante.test/academy/x', '/academy/../api/acceso/datos', '/academy/x/y', '/academy/%2F', '/\\academy/x']) {
    const p = pagina({ search: '?volver=' + encodeURIComponent(volver) });
    assert.notEqual(p.elemento('enviar').textContent, 'Crear cuenta gratis', volver + ' no abre el alta');
    assert.equal(p.elemento('introduccion').textContent, '', volver + ' no cambia la introducción');
    p.vista('registrar').eventos.click();
    await p.registrar();
    assert.equal(p.guardado.has('rwadar.alta.volver'), false, volver + ' no se guarda');
  }
  for (const volver of ['/academy/que-significa-tokenizar-un-activo', '/academy/cuanto-cuesta-tokenizar/', '/academy/es-tu-activo-tokenizable.html']) {
    const p = pagina({ search: '?volver=' + encodeURIComponent(volver) });
    assert.equal(p.elemento('enviar').textContent, 'Crear cuenta gratis', volver);
  }
});

test('sin almacenamiento el alta sigue y avisa igual de que revise el correo', async () => {
  const p = pagina({ search: '?volver=%2Facademy%2Fcomo-leer-el-radar', almacenRoto: true });
  await p.registrar();
  assert.match(p.elemento('estado').textContent, /Si la cuenta es nueva/);
  assert.equal(p.elemento('siguiente-alta').hidden, false);
});

async function confirmar(opciones) {
  const p = pagina({ hash: '#access_token=solo.prueba.token&type=signup', ...opciones });
  await tick();
  assert.equal(p.elemento('identidad').hidden, false, 'Pide comprobar la cuenta antes de seguir');
  await p.elemento('adoptar').eventos.click();
  return p;
}

test('al confirmar el correo vuelve a la lección guardada y la olvida', async () => {
  const guardado = new Map([['rwadar.alta.volver', JSON.stringify({ ruta: '/academy/como-leer-el-radar', hasta: Date.now() + DIA - 1000 })]]);
  const p = await confirmar({ guardado });
  assert.deepEqual(p.destinos, ['/academy/como-leer-el-radar']);
  assert.equal(guardado.has('rwadar.alta.volver'), false, 'Se usa una sola vez');
  assert.deepEqual(p.peticiones.map(x => x.ruta), ['/api/acceso/inspeccionar', '/api/acceso/adoptar', '/api/acceso/sesion']);
});

test('sin lección guardada, caducada, manipulada o sin almacenamiento va a /academy/ con el aviso de cuenta confirmada', async () => {
  const casos = [
    new Map(),
    new Map([['rwadar.alta.volver', JSON.stringify({ ruta: '/academy/como-leer-el-radar', hasta: Date.now() - 1 })]]),
    new Map([['rwadar.alta.volver', JSON.stringify({ ruta: '/academy/como-leer-el-radar', hasta: Date.now() + 30 * DIA })]]),
    new Map([['rwadar.alta.volver', JSON.stringify({ ruta: 'https://atacante.test/academy/x', hasta: Date.now() + 1000 })]]),
    new Map([['rwadar.alta.volver', JSON.stringify({ ruta: '/api/acceso/datos', hasta: Date.now() + 1000 })]]),
    new Map([['rwadar.alta.volver', '{no es json']]),
  ];
  for (const guardado of casos) {
    const p = await confirmar({ guardado });
    assert.deepEqual(p.destinos, ['/academy/#cuenta-confirmada']);
    assert.equal(guardado.has('rwadar.alta.volver'), false);
  }
  const p = await confirmar({ almacenRoto: true });
  assert.deepEqual(p.destinos, ['/academy/#cuenta-confirmada']);
});

test('si el enlace trae su propio «volver», manda ese y se descarta el guardado', async () => {
  const guardado = new Map([['rwadar.alta.volver', JSON.stringify({ ruta: '/academy/como-leer-el-radar', hasta: Date.now() + 1000 })]]);
  const p = await confirmar({ guardado, search: '?volver=%2Facademy%2Fcuanto-cuesta-tokenizar' });
  assert.deepEqual(p.destinos, ['/academy/cuanto-cuesta-tokenizar']);
  assert.equal(guardado.has('rwadar.alta.volver'), false);
});

test('entrar con la contraseña sigue volviendo a donde estaba, sin tocar la lección guardada', async () => {
  const guardado = new Map([['rwadar.alta.volver', JSON.stringify({ ruta: '/academy/como-leer-el-radar', hasta: Date.now() + 1000 })]]);
  const p = pagina({ guardado });
  p.elemento('correo').value = 'alta@example.test';
  p.elemento('clave').value = 'una-clave-solo-de-prueba';
  await p.elemento('formulario').eventos.submit({ preventDefault() {} });
  assert.deepEqual(p.destinos, ['/']);
  assert.equal(guardado.has('rwadar.alta.volver'), true);
});

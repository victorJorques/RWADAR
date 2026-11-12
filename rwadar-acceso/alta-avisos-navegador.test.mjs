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
// Versión novedades-v2-2026-11-06 (revisión legal del 06/11/2026), palabra por palabra.
const TEXTO_ES = 'Quiero recibir avisos de RWAdar por correo y, si los activo en mi móvil, como notificaciones: ' +
  'fichas nuevas en el radar y novedades de la web y la app. Es opcional: la Academy se desbloquea igual. ' +
  'Puedes darte de baja en Perfil o con el enlace de cada correo; las notificaciones también se quitan en los ' +
  'ajustes del móvil. Más información en Privacidad.';
const TEXTO_EN = 'I want to receive RWAdar notices by email and, if I enable them on my phone, as notifications: ' +
  'new listings on the radar and news about the website and the app. It\'s optional: the Academy unlocks anyway. ' +
  'You can unsubscribe in Profile or with the link in every email; notifications can also be turned off in your ' +
  'phone settings. More information in Privacy.';
// Información básica sobre los datos: fuera del texto versionado, junto a la casilla.
const INFO_ES = 'Información básica sobre tus datos. Responsable: Víctor Manuel Jorques Granero (RWAdar). ' +
  'Datos: tu correo, tu contraseña y, si lo das, tu nombre; con los avisos, además, tu permiso y, si activas las ' +
  'notificaciones, un identificador de entrega de tu móvil. Para qué: tu cuenta, con la que también abres la Academy, ' +
  'y, solo si marcas la casilla de avisos, enviarte esos avisos. Base: el servicio que pides (cuenta) y tu ' +
  'consentimiento (avisos), que puedes retirar cuando quieras sin que afecte a lo anterior. Proveedores: Supabase, ' +
  'Cloudflare y Google; para los avisos, Lettermint y Expo. Algunos tratan datos fuera de la UE con garantías. Derechos: ' +
  'acceso, rectificación, supresión, oposición, limitación y portabilidad, en Perfil o en rwadares@gmail.com; ' +
  'también puedes reclamar ante la AEPD. Más información en Privacidad.';
const CLAVE_VOLVER = 'rwadar.alta.volver';
const uid = '11111111-1111-4111-8111-111111111111';
const DIA = 24 * 60 * 60 * 1000;
const tick = () => new Promise(resolve => setImmediate(resolve));
const texto = fragmento => fragmento.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

// lang: el <html lang> que pondría idioma-web (sin él, como hoy en /acceso, no
// hay documentElement que leer). textoCasilla: lo que se ve en la casilla.
function pagina({ script = original, search = '', hash = '', guardado = new Map(), almacenRoto = false, lang, textoCasilla } = {}) {
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
  if (textoCasilla !== undefined) elementos.get('campo-avisos-novedades').textContent = textoCasilla;
  const context = vm.createContext({
    document: { getElementById: id => elementos.get(id), querySelectorAll: () => botones,
      ...(lang === undefined ? {} : { documentElement: { lang } }) },
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

test('la casilla de avisos lleva el texto exacto de la v2, aparte y sin marcar, con «Privacidad» enlazada', () => {
  const etiqueta = html.match(/<label id="campo-avisos-novedades"([^>]*)>([\s\S]*?)<\/label>/);
  assert.ok(etiqueta, 'Existe la casilla #avisos-novedades');
  assert.match(etiqueta[1], /\bhidden\b/, 'Nace oculta en el HTML');
  assert.equal(texto(etiqueta[2]), TEXTO_ES, 'El texto visible es el versionado, palabra por palabra');
  // Seguido y sin más etiquetas que el enlace final a la sección de avisos.
  assert.ok(etiqueta[2].endsWith(TEXTO_ES.replace(/Privacidad\.$/, '') + '<a href="/privacidad#avisos-novedades">Privacidad</a>.'));
  assert.equal([...etiqueta[2].matchAll(/<a\b/g)].length, 1);
  assert.doesNotMatch(etiqueta[2], /\bchecked\b/);
  assert.match(html, /<!-- Avisos de novedades, versión novedades-v2-2026-11-06:/);
  assert.ok(original.includes(APAGADO), 'El interruptor de la web nace apagado');
});

test('la información básica sobre los datos va junto a la casilla, oculta y con «Privacidad» enlazada', () => {
  const bloque = html.match(/<div id="info-datos"([^>]*)>([\s\S]*?)<\/div>/);
  assert.ok(bloque, 'Existe #info-datos');
  assert.match(bloque[1], /\bhidden\b/, 'Nace oculta en el HTML');
  assert.equal(texto(bloque[2]), INFO_ES);
  assert.ok(bloque[2].endsWith(INFO_ES.replace(/Privacidad\.$/, '') + '<a href="/privacidad">Privacidad</a>.'));
  // Justo después de la casilla de avisos, dentro del formulario y fuera de su <label>.
  const casilla = html.indexOf('<label id="campo-avisos-novedades"'), info = html.indexOf('<div id="info-datos"');
  assert.ok(casilla > 0 && info > casilla && info < html.indexOf('<div id="robot"'));
  assert.equal(html.slice(casilla, info).match(/<\/label>/g).length, 1);
});

test('la información básica solo se ve al crear la cuenta y con el interruptor encendido', () => {
  const apagado = pagina();
  for (const v of ['registrar', 'entrar', 'recuperar', 'reenviar']) {
    apagado.vista(v).eventos.click();
    assert.equal(apagado.elemento('info-datos').hidden, true, 'apagado: ' + v);
  }
  const p = pagina({ script: encendido });
  assert.equal(p.elemento('info-datos').hidden, true, 'En «Entrar» no se ve');
  p.vista('registrar').eventos.click();
  assert.equal(p.elemento('info-datos').hidden, false);
  for (const otra of ['entrar', 'recuperar', 'reenviar']) {
    p.vista(otra).eventos.click();
    assert.equal(p.elemento('info-datos').hidden, true, otra);
    p.vista('registrar').eventos.click();
    assert.equal(p.elemento('info-datos').hidden, false, 'registrar tras ' + otra);
  }
  // Llegando desde una lección se abre el alta, y con ella la información.
  assert.equal(pagina({ script: encendido, search: '?volver=%2Facademy%2Fcomo-leer-el-radar' }).elemento('info-datos').hidden, false);
  assert.equal(pagina({ search: '?volver=%2Facademy%2Fcomo-leer-el-radar' }).elemento('info-datos').hidden, true);
});

test('con el interruptor apagado no se ve la casilla y el alta no envía avisosNovedades ni idioma', async () => {
  const p = pagina();
  p.vista('registrar').eventos.click();
  assert.equal(p.elemento('campo-condiciones').hidden, false);
  assert.equal(p.elemento('campo-avisos-novedades').hidden, true);
  const cuerpo = await p.registrar({ avisos: true });
  assert.ok(cuerpo, 'Se envía el alta');
  assert.equal(Object.hasOwn(cuerpo, 'avisosNovedades'), false, 'El JSON no lleva la clave');
  assert.equal(Object.hasOwn(cuerpo, 'idioma'), false, 'Ni el idioma');
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

test('con el interruptor encendido el alta envía avisosNovedades como booleano estricto y el idioma de la casilla', async () => {
  for (const avisos of [false, true]) {
    const p = pagina({ script: encendido });
    p.vista('registrar').eventos.click();
    const cuerpo = await p.registrar({ avisos });
    assert.equal(cuerpo.avisosNovedades, avisos);
    assert.equal(typeof cuerpo.avisosNovedades, 'boolean');
    // /acceso no carga el traductor: la casilla se ve en castellano.
    assert.equal(cuerpo.idioma, 'es');
  }
  // Entrar con una cuenta nunca manda la preferencia ni el idioma.
  const p = pagina({ script: encendido });
  p.elemento('correo').value = 'alta@example.test';
  p.elemento('clave').value = 'una-clave-solo-de-prueba';
  await p.elemento('formulario').eventos.submit({ preventDefault() {} });
  const entrar = p.peticiones.find(x => x.ruta === '/api/acceso/entrar').cuerpo;
  assert.equal(Object.hasOwn(entrar, 'avisosNovedades'), false);
  assert.equal(Object.hasOwn(entrar, 'idioma'), false);
});

test('el idioma es «en» solo si la página está en inglés y la casilla se ve traducida', async () => {
  for (const [opciones, esperado] of [
    [{ lang: 'es', textoCasilla: TEXTO_ES }, 'es'],
    [{ lang: '', textoCasilla: TEXTO_ES }, 'es'],
    // En inglés pero sin traducción en el diccionario: se ve el castellano.
    [{ lang: 'en', textoCasilla: TEXTO_ES }, 'es'],
    [{ lang: 'en', textoCasilla: '' }, 'es'],
    [{ lang: 'en', textoCasilla: TEXTO_EN }, 'en'],
    [{ lang: 'en-GB', textoCasilla: TEXTO_EN }, 'en'],
    [{ lang: 'eng', textoCasilla: TEXTO_EN }, 'es'],
  ]) {
    const p = pagina({ script: encendido, ...opciones });
    p.vista('registrar').eventos.click();
    const cuerpo = await p.registrar({ avisos: true });
    assert.equal(cuerpo.idioma, esperado, JSON.stringify(opciones.lang) + ' ' + opciones.textoCasilla.slice(0, 20));
  }
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
  for (const volver of ['/', '//atacante.test/academy/x', '/academy/x?y=1', '/academy/?x=1',
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

test('el índice de la Academy (botón «Crea tu cuenta gratis» y puerta del tutorial) abre el alta sin guardar vuelta', async () => {
  for (const volver of ['/academy/', '/academy', '/academy/index.html']) {
    const p = pagina({ search: '?volver=' + encodeURIComponent(volver) });
    assert.equal(p.elemento('enviar').textContent, 'Crear cuenta gratis', volver + ' abre el alta');
    assert.equal(p.elemento('introduccion').textContent, 'Las lecciones son gratis con cuenta. Si ya la tienes, entra.', volver);
    await p.registrar();
    assert.equal(p.guardado.has('rwadar.alta.volver'), false, volver + ' no guarda vuelta');
  }
});

// Candado del índice (08/11/2026): «Crear cuenta gratis» va a /acceso?volver=/academy/
// y «Ya tengo cuenta: entrar» a /acceso?volver=/academy/&vista=entrar.
test('«Ya tengo cuenta: entrar» del candado abre «Entrar» y, al entrar, vuelve a /academy/', async () => {
  const p = pagina({ search: '?volver=%2Facademy%2F&vista=entrar' });
  assert.equal(p.elemento('enviar').textContent, 'Entrar');
  assert.equal(p.elemento('titulo').textContent, 'Tu radar, con tu cuenta');
  assert.equal(p.elemento('campo-condiciones').hidden, true);
  assert.equal(p.elemento('introduccion').textContent, 'Las lecciones son gratis con cuenta. Si ya la tienes, entra.');
  p.elemento('correo').value = 'alta@example.test';
  p.elemento('clave').value = 'una-clave-solo-de-prueba';
  await p.elemento('formulario').eventos.submit({ preventDefault() {} });
  assert.deepEqual(p.peticiones.map(x => x.ruta), ['/api/acceso/entrar', '/api/acceso/sesion'], 'entra y confirma la sesión antes de volver');
  assert.deepEqual(p.destinos, ['/academy/']);
  // vista=entrar solo cuenta llegando desde la Academy; cualquier otro valor abre el alta.
  for (const search of ['?volver=%2Facademy%2F&vista=registrar', '?volver=%2Facademy%2F&vista=otra', '?vista=entrar&volver=%2Facademy%2F']) {
    const q = pagina({ search });
    assert.equal(q.elemento('enviar').textContent, search.includes('vista=entrar') ? 'Entrar' : 'Crear cuenta gratis', search);
  }
  assert.equal(pagina({ search: '?vista=entrar' }).elemento('introduccion').textContent, '', 'sin volver a la Academy, /acceso como siempre');
});

// Revisión del 08/11/2026: regresar() validaba la cadena de «volver» pero navegaba a
// su ruta normalizada; '/.//x' sale '//x', que el navegador abre como otra web.
test('tras entrar, un «volver» cuya ruta normalizada empieza por // vuelve a la raíz, no a otra web', async () => {
  for (const volver of ['/.//atacante.test/', '/%2e//atacante.test/', '/academy/..//atacante.test/', '/./%2e/..//atacante.test/x']) {
    const p = pagina({ search: '?volver=' + encodeURIComponent(volver) + '&vista=entrar' });
    p.elemento('correo').value = 'alta@example.test';
    p.elemento('clave').value = 'una-clave-solo-de-prueba';
    await p.elemento('formulario').eventos.submit({ preventDefault() {} });
    assert.deepEqual(p.peticiones.map(x => x.ruta), ['/api/acceso/entrar', '/api/acceso/sesion'], volver);
    assert.deepEqual(p.destinos, ['/'], volver);
  }
  // Sin codificar en la dirección, igual.
  const q = pagina({ search: '?volver=/.//atacante.test/' });
  q.vista('entrar').eventos.click();
  q.elemento('correo').value = 'alta@example.test';
  q.elemento('clave').value = 'una-clave-solo-de-prueba';
  await q.elemento('formulario').eventos.submit({ preventDefault() {} });
  assert.deepEqual(q.destinos, ['/']);
  // Una ruta propia normal sigue funcionando.
  const r = pagina({ search: '?volver=%2Facademy%2F.%2Fcomo-leer-el-radar' });
  r.vista('entrar').eventos.click();
  r.elemento('correo').value = 'alta@example.test';
  r.elemento('clave').value = 'una-clave-solo-de-prueba';
  await r.elemento('formulario').eventos.submit({ preventDefault() {} });
  assert.deepEqual(r.destinos, ['/academy/como-leer-el-radar']);
});

test('«Crear cuenta gratis» del candado: tras el alta, entrar en esa misma página vuelve a /academy/', async () => {
  const p = pagina({ search: '?volver=%2Facademy%2F' });
  assert.equal(p.elemento('enviar').textContent, 'Crear cuenta gratis');
  await p.registrar();
  assert.equal(p.elemento('siguiente-alta').hidden, false, 'ofrece «Entrar con mi cuenta» tras el alta');
  assert.equal(p.guardado.has('rwadar.alta.volver'), false, 'el índice no guarda vuelta: al confirmar ya se va a /academy/');
  // Ya confirmado el correo, «Entrar con mi cuenta» en la misma pestaña.
  p.elemento('entrar-tras-alta').eventos.click();
  assert.equal(p.elemento('enviar').textContent, 'Entrar');
  p.elemento('correo').value = 'alta@example.test';
  p.elemento('clave').value = 'una-clave-solo-de-prueba';
  await p.elemento('formulario').eventos.submit({ preventDefault() {} });
  assert.deepEqual(p.destinos, ['/academy/']);
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

test('en cualquier carga de /acceso se borra una vuelta caducada, manipulada o ilegible, y se conserva la vigente', () => {
  const vigente = JSON.stringify({ ruta: '/academy/como-leer-el-radar', hasta: Date.now() + DIA - 1000 });
  const casos = [
    [JSON.stringify({ ruta: '/academy/como-leer-el-radar', hasta: Date.now() - 1 }), false, 'caducada'],
    [JSON.stringify({ ruta: '/academy/como-leer-el-radar', hasta: Date.now() + 30 * DIA }), false, 'más de 24 horas'],
    [JSON.stringify({ ruta: '/api/acceso/datos', hasta: Date.now() + 1000 }), false, 'no es una lección'],
    [JSON.stringify({ ruta: '/academy/como-leer-el-radar', hasta: 'mañana' }), false, 'sin fecha'],
    ['{no es json', false, 'ilegible'],
    ['null', false, 'vacía'],
    [vigente, true, 'vigente'],
  ];
  // Sin parámetros (entrar), con un enlace de recuperación o abriendo el alta desde una lección.
  for (const [search, hash] of [['', ''], ['', '#access_token=solo.prueba.token&type=recovery'],
    ['?volver=%2Facademy%2Fcuanto-cuesta-tokenizar', ''], ['?volver=%2F', '']]) {
    for (const [valor, queda, nombre] of casos) {
      const guardado = new Map([[CLAVE_VOLVER, valor]]);
      const p = pagina({ guardado, search, hash });
      assert.equal(guardado.has(CLAVE_VOLVER), queda, nombre + ' ' + search + hash);
      if (queda) assert.equal(guardado.get(CLAVE_VOLVER), valor, 'La vigente no se toca');
      assert.deepEqual(p.destinos, [], 'Limpiar no navega');
    }
  }
  // Sin nada guardado no se escribe nada, y sin almacenamiento la página carga igual.
  const vacio = new Map();
  pagina({ guardado: vacio });
  assert.equal(vacio.size, 0);
  const sinAlmacen = pagina({ almacenRoto: true });
  assert.equal(sinAlmacen.elemento('formulario').hidden, false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// /baja: baja de los avisos de novedades sin entrar en la cuenta
// (docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md).
const html = fs.readFileSync(new URL('../rwadar-site/baja.html', import.meta.url), 'utf8');
const script = fs.readFileSync(new URL('../rwadar-site/assets/baja-20261105.js', import.meta.url), 'utf8');
const UUID_BAJA = '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b';
const tick = () => new Promise(resolve => setImmediate(resolve));

function pagina(search, responder = async () => Response.json({ ok: true })) {
  const elementos = new Map(), peticiones = [], historial = [], orden = [];
  for (const [, , atributos] of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/g)) {
    const id = atributos.match(/\bid="([^"]+)"/)?.[1];
    if (!id) continue;
    elementos.set(id, { textContent: '', disabled: false, hidden: /\bhidden\b/.test(atributos), eventos: {},
      addEventListener(tipo, ejecutar) { this.eventos[tipo] = ejecutar; } });
  }
  const location = { origin: 'https://rwadar.pages.dev', pathname: '/baja', search, hash: '' };
  const context = vm.createContext({
    document: { getElementById: id => elementos.get(id) }, location, URLSearchParams, AbortController,
    setTimeout: () => 0, clearTimeout() {},
    history: { replaceState(_estado, _titulo, ruta) { historial.push(ruta); orden.push('limpia'); location.search = ruta.slice('/baja'.length); } },
    localStorage: { setItem() { assert.fail('El token no se guarda'); } },
    sessionStorage: { setItem() { assert.fail('El token no se guarda'); } },
    fetch: async (ruta, opciones) => { orden.push('fetch'); peticiones.push({ ruta, opciones }); return responder(ruta, opciones); },
  });
  vm.runInContext(script, context);
  return { elemento: id => elementos.get(id), peticiones, historial, orden, location };
}

test('la página no se indexa, no lleva scripts ni estilos en línea y no usa formularios', () => {
  assert.match(html, /<meta name="robots" content="noindex,nofollow">/);
  assert.match(html, /<script defer src="\/assets\/baja-20261105\.js"><\/script>/);
  assert.equal([...html.matchAll(/<script\b([^>]*)>/gi)].filter(m => !/\bsrc=/.test(m[1])).length, 0);
  assert.doesNotMatch(html, /<style\b|\sstyle\s*=|\son[a-z]+\s*=/i);
  assert.doesNotMatch(html, /<form\b/i, 'La CSP lleva form-action \'none\': se usa un botón');
  assert.match(html, /<button id="baja" type="button" hidden>Darme de baja de los avisos<\/button>/);
  assert.match(html, /<link rel="stylesheet" href="\/assets\/acceso\.css">/, 'Mismo estilo que /acceso');
});

// El mismo asunto que el pie y List-Unsubscribe de los correos (30_avisos_registrados.sql).
const ASUNTO = 'Baja de los avisos de RWAdar';
const MAILTO = 'mailto:RWAdar@protonmail.com?subject=Baja%20de%20los%20avisos%20de%20RWAdar';
test('sin JavaScript la página explica la baja por correo con el asunto de los correos', () => {
  const visible = html.replace(/<[^>]+\shidden[^>]*>[\s\S]*?<\/[a-z]+>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  assert.ok(visible.includes('escribiendo a RWAdar@protonmail.com con el asunto «' + ASUNTO + '»'));
  assert.equal(decodeURIComponent(MAILTO.split('subject=')[1]), ASUNTO);
  // Todos los mailto de la página llevan ese asunto; ninguno el antiguo «baja».
  const mailtos = [...html.matchAll(/href="(mailto:[^"]+)"/g)].map(m => m[1]);
  assert.ok(mailtos.length >= 2); assert.ok(mailtos.every(m => m === MAILTO), mailtos.join(' '));
  // <noscript>: quien no tiene JavaScript no ve el botón y lee ahí qué hacer.
  const aviso = html.match(/<noscript>([\s\S]*?)<\/noscript>/);
  assert.ok(aviso, 'Hay un <noscript>');
  assert.ok(aviso[1].includes('href="' + MAILTO + '"'));
  assert.ok(aviso[1].replace(/<[^>]+>/g, '').includes('con el asunto «' + ASUNTO + '»'));
  assert.ok(html.indexOf('<noscript>') > html.indexOf('id="estado"') && html.indexOf('<noscript>') < html.indexOf('id="baja"'),
    'Va donde el mensaje de estado, antes del botón');
});

test('el token sale de la dirección antes de cualquier petición y se envía al pulsar', async () => {
  const p = pagina('?t=' + UUID_BAJA);
  assert.deepEqual(p.historial, ['/baja'], 'Se quita t con history.replaceState');
  assert.equal(p.location.search, '');
  assert.equal(p.peticiones.length, 0, 'Abrir el enlace no da de baja: hace falta pulsar');
  assert.equal(p.elemento('baja').hidden, false);
  assert.match(p.elemento('estado').textContent, /Pulsa el botón/);
  await p.elemento('baja').eventos.click();
  assert.deepEqual(p.orden, ['limpia', 'fetch']);
  assert.equal(p.peticiones.length, 1);
  const { ruta, opciones } = p.peticiones[0];
  assert.equal(ruta, '/api/acceso/baja');
  assert.equal(opciones.method, 'POST');
  assert.equal(opciones.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(opciones.body), { token: UUID_BAJA });
  assert.equal(opciones.credentials, 'omit', 'La baja no necesita la cookie de sesión');
  assert.equal(opciones.cache, 'no-store');
  assert.equal(opciones.redirect, 'error');
  assert.equal(p.elemento('estado').textContent,
    'Hecho. Si este enlace correspondía a una suscripción, ya no recibirás avisos de novedades de RWAdar, ni por correo ni en el móvil.');
  assert.equal(p.elemento('baja').hidden, true);
  await p.elemento('baja').eventos.click();
  assert.equal(p.peticiones.length, 1, 'No se repite');
});

test('conserva otros parámetros y acepta el UUID en mayúsculas', async () => {
  const p = pagina('?utm=correo&t=' + UUID_BAJA.toUpperCase());
  assert.deepEqual(p.historial, ['/baja?utm=correo']);
  await p.elemento('baja').eventos.click();
  assert.deepEqual(JSON.parse(p.peticiones[0].opciones.body), { token: UUID_BAJA });
});

test('un token que no es un UUID no ofrece el botón ni llama al servidor, y también se borra', async () => {
  for (const search of ['', '?t=', '?t=123', '?t=' + UUID_BAJA + 'x', '?t=' + UUID_BAJA.replace(/-/g, ''), '?t=%3Cscript%3E']) {
    const p = pagina(search);
    assert.equal(p.elemento('baja').hidden, true, search);
    assert.match(p.elemento('estado').textContent, /no es válido o está incompleto/);
    assert.ok(p.elemento('estado').textContent.includes('RWAdar@protonmail.com con el asunto «' + ASUNTO + '»'));
    assert.equal(p.peticiones.length, 0);
    assert.deepEqual(p.historial, search.includes('t=') ? ['/baja'] : []);
  }
});

test('un fallo del servidor o de la red permite reintentar y da la alternativa por correo', async () => {
  for (const responder of [async () => Response.json({ error: 'servicio_no_disponible' }, { status: 503 }),
    async () => { throw new TypeError('sin red'); }]) {
    const p = pagina('?t=' + UUID_BAJA, responder);
    await p.elemento('baja').eventos.click();
    assert.match(p.elemento('estado').textContent, /No se ha podido completar la baja ahora/);
    assert.ok(p.elemento('estado').textContent.includes('asunto «' + ASUNTO + '»'));
    assert.equal(p.elemento('baja').hidden, false);
    assert.equal(p.elemento('baja').disabled, false);
  }
  const p = pagina('?t=' + UUID_BAJA, async () => Response.json({ error: 'intentos_excedidos' }, { status: 429 }));
  await p.elemento('baja').eventos.click();
  assert.match(p.elemento('estado').textContent, /Espera unos minutos/);
  assert.equal(p.elemento('baja').disabled, false);
  await tick();
});

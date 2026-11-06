// Prueba local de .github/comprobar-publicado.mjs contra el _worker.js compilado de
// rwadar-publicado/, con ASSETS de Pages y Auth simulados (probar-worker-local.mjs):
// sin red y sin Supabase. Necesita la web construida (npm run test:web va antes en npm test).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { arrancarWorkerLocal, TOKEN_PRUEBA, CORREO_PRUEBA, CLAVE_PRUEBA } from './probar-worker-local.mjs';

const require = createRequire(import.meta.url);
const { academyPublicada } = require('./compilar.cjs');
const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const PUBLICADO = path.join(RAIZ, 'rwadar-publicado');
const ejecutar = promisify(execFile);
const LECCION = '/academy/que-significa-tokenizar-un-activo';
function exigirConstruida() {
  assert.ok(fs.existsSync(path.join(PUBLICADO, '_worker.js')) && fs.existsSync(path.join(PUBLICADO, 'academy', 'index.html')),
    'Falta rwadar-publicado/: ejecuta antes npm run test:web (o node rwadar-publicar.js --local --sin-sincronizar).');
}

// Lanza el comprobador contra un worker local ya arrancado. vistaPrevia: lo juzga
// como una vista previa de Pages (RWADAR_COMPROBAR_VISTA_PREVIA=1).
async function comprobar(local, { vistaPrevia = false } = {}) {
  let salida = '', codigo = 0;
  const env = { ...process.env, RWADAR_COMPROBAR_LOCAL: '1' };
  delete env.RWADAR_COMPROBAR_VISTA_PREVIA;
  if (vistaPrevia) env.RWADAR_COMPROBAR_VISTA_PREVIA = '1';
  try {
    ({ stdout: salida } = await ejecutar(process.execPath, ['.github/comprobar-publicado.mjs', local.url], {
      cwd: RAIZ, env, maxBuffer: 16 * 1024 * 1024, timeout: 240000 }));
  } catch (error) { salida = error.stdout || ''; codigo = error.code; }
  const lineas = salida.split('\n');
  // En un clon superficial (CI descarga solo el último commit) Git no conoce fichas ni
  // ilustraciones retiradas: esas dos comprobaciones dependen del historial, no del worker.
  const historial = /^ {2}FALLA el historial de Git da las (?:fichas|ilustraciones) retiradas que hay que comprobar \(0\)$/;
  return { salida, codigo, lineas, fallidas: lineas.filter(linea => linea.startsWith('  FALLA ') && !historial.test(linea)),
    sinHistorial: lineas.filter(linea => historial.test(linea)).length };
}
const correcta = (lineas, linea) => lineas.some(l => l.startsWith('  OK    ') && l.endsWith(linea));

test('el comprobador de la web publicada pasa contra el worker compilado, sin red', async () => {
  exigirConstruida();
  const academy = academyPublicada();
  assert.equal(academy.acceso, 'cuenta');
  const local = await arrancarWorkerLocal({ raiz: PUBLICADO, puerto: 0 });
  let resultado;
  try { resultado = await comprobar(local); } finally { await local.cerrar(); }
  const { salida, codigo, fallidas, sinHistorial } = resultado;
  assert.deepEqual(fallidas, [], 'Fallos del comprobador:\n' + fallidas.join('\n'));
  assert.equal(codigo === 0, sinHistorial === 0);
  assert.match(salida, /\(producción\) …/);
  const esperadas = [
    'el mapa del sitio lista el índice de la Academy y ninguna lección (van con cuenta)',
    'el índice de la Academy responde 200 y se puede indexar',
    'el índice dice que es gratis con cuenta y enlaza el alta con vuelta a la Academy',
    'rwadar-publicado/ es lo que está publicado (el índice de la Academy coincide byte a byte)',
    `las ${academy.lecciones.length} lecciones de rwadar-publicado/ llevan su contenido, su revisión legal y noindex`,
    'HEAD de una lección sin sesión: 303: 303',
    'una lección pedida sin sesión fuera de una página da 401 sin guardarse: 401',
    'una cookie inventada no abre la lección ni se borra: 303',
    'una ruta de la Academy con %2F da 400: 400',
    'una lección que no existe da el 404 del worker sin mirar la sesión: 404',
    'las lecciones y fichas usan sus hojas, scripts y cuatro recursos de idioma con huella',
    // Desde el 06/11/2026 las nueve están publicadas: ninguna «Próximamente».
    `el índice muestra ${academy.lecciones.length} lecciones disponibles y ${academy.pendientes.length} «Próximamente»`,
    'la página de baja de avisos responde 200, sin indexar ni guardarse: 200',
    'la baja rechaza un enlace sin forma de UUID: 400',
    ...academy.lecciones.map(slug => `sin sesión: 303 a /acceso?volver=/academy/${slug}, sin guardarse: 303`),
  ];
  for (const linea of esperadas) assert.ok(correcta(resultado.lineas, linea), 'Falta: ' + linea);
  assert.equal(academy.lecciones.length, 9); assert.deepEqual([...academy.pendientes], []);
  assert.ok(!salida.includes('(Próximamente) no tiene página'), 'no queda ninguna lección «Próximamente» que pedir');
  // El worker solo preguntó a Auth por la cookie inventada (y Auth la rechazó).
  assert.deepEqual(local.peticionesSupabase.map(p => p.metodo + ' ' + p.ruta), ['GET /auth/v1/user']);
});

/* En una vista previa (revision.rwadar.pages.dev), Cloudflare Pages pone
   x-robots-tag: noindex a todo archivo servido. El comprobador no puede exigir
   allí que el índice de la Academy se indexe por la cabecera: le basta su HTML.
   En producción lo sigue exigiendo, y esa misma web le haría fallar. */
test('en una vista previa de Pages (noindex en cada archivo) el comprobador pasa; como producción, solo falla el índice', async () => {
  // Vale con "acceso": "cuenta" o "publico": la cabecera de la vista previa no depende de él.
  exigirConstruida();
  const conCuenta = academyPublicada().acceso === 'cuenta';
  const previa = await arrancarWorkerLocal({ raiz: PUBLICADO, puerto: 0, vistaPrevia: true });
  let comoPrevia, comoProduccion;
  try {
    // El arnés imita Pages: noindex en los archivos (también la 404.html y /baja,
    // por encima de _headers) y nada en lo que responde el propio worker.
    const indice = await fetch(previa.url + '/academy/', { redirect: 'manual' });
    assert.equal(indice.status, 200); assert.equal(indice.headers.get('x-robots-tag'), 'noindex');
    assert.match(await indice.text(), /<meta name="robots" content="index,follow/);
    assert.equal((await fetch(previa.url + '/baja')).headers.get('x-robots-tag'), 'noindex');
    const falsa = await fetch(previa.url + '/ofertas/rwadar-comprobacion-ficha-inexistente', { headers: { accept: 'text/html' } });
    assert.equal(falsa.status, 404); assert.equal(falsa.headers.get('x-robots-tag'), 'noindex, nofollow', 'la 404 del worker conserva su marca');
    if (conCuenta) {
      const sinSesion = await fetch(previa.url + LECCION, { redirect: 'manual', headers: { accept: 'text/html' } });
      assert.equal(sinSesion.status, 303); assert.equal(sinSesion.headers.get('x-robots-tag'), 'noindex, nofollow');
    }
    comoPrevia = await comprobar(previa, { vistaPrevia: true });
    comoProduccion = await comprobar(previa);
  } finally { await previa.cerrar(); }

  assert.deepEqual(comoPrevia.fallidas, [], 'Fallos del comprobador en la vista previa:\n' + comoPrevia.fallidas.join('\n'));
  assert.equal(comoPrevia.codigo === 0, comoPrevia.sinHistorial === 0);
  assert.match(comoPrevia.salida, /\(vista previa: Pages añade noindex en la cabecera\) …/);
  for (const linea of ['el índice de la Academy responde 200 y su HTML se puede indexar (en la vista previa, la cabecera noindex es de Pages)',
    'la página de baja de avisos responde 200, sin indexar ni guardarse: 200',
    `el índice muestra ${academyPublicada().lecciones.length} lecciones disponibles y 0 «Próximamente»`,
    'una ficha que nunca existió da el 404 del worker',
    ...(conCuenta ? ['una lección que no existe da el 404 del worker sin mirar la sesión: 404'] : [])]) {
    assert.ok(correcta(comoPrevia.lineas, linea), 'Falta: ' + linea);
  }
  assert.ok(!comoPrevia.salida.includes('el índice de la Academy responde 200 y se puede indexar'));

  // La misma web juzgada como producción: solo cae el índice, por la cabecera.
  assert.deepEqual(comoProduccion.fallidas, ['  FALLA el índice de la Academy responde 200 y se puede indexar']);
  assert.equal(comoProduccion.codigo, 1);
});

function pedirConHost(puerto, host) {
  return new Promise((resolver, rechazar) => {
    http.get({ host: '127.0.0.1', port: puerto, path: '/', headers: { Host: host } }, res => {
      res.resume(); res.on('end', () => resolver(res.statusCode));
    }).on('error', rechazar);
  });
}

test('el arnés local abre la lección con la sesión de prueba y la cierra sin ella', async () => {
  exigirConstruida();
  const local = await arrancarWorkerLocal({ raiz: PUBLICADO, puerto: 0 });
  const conSesion = await arrancarWorkerLocal({ raiz: PUBLICADO, puerto: 0, conSesion: true });
  try {
    const html = { accept: 'text/html' };
    const sin = await fetch(local.url + LECCION, { redirect: 'manual', headers: html });
    assert.equal(sin.status, 303); assert.equal(sin.headers.get('location'), '/acceso?volver=' + LECCION);
    for (const [url, cabeceras] of [[conSesion.url + LECCION, html],
      [local.url + LECCION, { ...html, cookie: '__Host-rwadar-acceso=' + TOKEN_PRUEBA }]]) {
      const r = await fetch(url, { redirect: 'manual', headers: cabeceras });
      assert.equal(r.status, 200);
      assert.equal(r.headers.get('cache-control'), 'private, no-store');
      assert.equal(r.headers.get('x-robots-tag'), 'noindex'); assert.match(r.headers.get('vary'), /Cookie/);
      const texto = await r.text();
      assert.ok(texto.includes('data-academy-leccion="que-significa-tokenizar-un-activo"'));
      assert.ok(texto.includes('<meta name="robots" content="noindex, nofollow">'));
      // En http local la CSP no sube los recursos a https; el resto, como en producción.
      assert.match(r.headers.get('content-security-policy'), /script-src 'self'/);
      assert.doesNotMatch(r.headers.get('content-security-policy'), /upgrade-insecure-requests/);
    }
    // Entrar por /acceso con la cuenta de prueba deja la cookie de sesión.
    const entrar = await fetch(local.url + '/api/acceso/entrar', { method: 'POST', headers: { origin: local.url,
      'content-type': 'application/json' }, body: JSON.stringify({ correo: CORREO_PRUEBA, clave: CLAVE_PRUEBA }) });
    assert.equal(entrar.status, 200);
    assert.match(entrar.headers.get('set-cookie'), new RegExp('^__Host-rwadar-acceso=' + TOKEN_PRUEBA.replace(/\./g, '\\.') + ';'));
    const mala = await fetch(local.url + '/api/acceso/entrar', { method: 'POST', headers: { origin: local.url,
      'content-type': 'application/json' }, body: JSON.stringify({ correo: CORREO_PRUEBA, clave: 'otra' }) });
    assert.equal(mala.status, 401); assert.equal(mala.headers.get('set-cookie'), null);
    // El índice sigue público; un Host ajeno no se atiende.
    assert.equal((await fetch(local.url + '/academy/')).status, 200);
    assert.equal(await pedirConHost(local.puerto, 'rwadar.example.test'), 421);
    assert.equal(await pedirConHost(local.puerto, 'localhost:' + local.puerto), 200);
  } finally {
    await local.cerrar(); await conSesion.cerrar();
  }
});

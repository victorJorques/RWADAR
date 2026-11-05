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

test('el comprobador de la web publicada pasa contra el worker compilado, sin red', async () => {
  exigirConstruida();
  const academy = academyPublicada();
  assert.equal(academy.acceso, 'cuenta');
  const local = await arrancarWorkerLocal({ raiz: PUBLICADO, puerto: 0 });
  let salida = '', codigo = 0;
  try {
    try {
      ({ stdout: salida } = await ejecutar(process.execPath, ['.github/comprobar-publicado.mjs', local.url], {
        cwd: RAIZ, env: { ...process.env, RWADAR_COMPROBAR_LOCAL: '1' }, maxBuffer: 16 * 1024 * 1024, timeout: 240000 }));
    } catch (error) { salida = error.stdout || ''; codigo = error.code; }
  } finally { await local.cerrar(); }
  const fallidas = salida.split('\n').filter(linea => linea.startsWith('  FALLA '));
  // En un clon superficial (CI descarga solo el último commit) Git no conoce fichas ni
  // ilustraciones retiradas: esas dos comprobaciones dependen del historial, no del worker.
  assert.ok(fallidas.every(linea => /^ {2}FALLA el historial de Git da las (?:fichas|ilustraciones) retiradas que hay que comprobar \(0\)$/.test(linea)),
    'Fallos del comprobador:\n' + fallidas.join('\n'));
  assert.equal(codigo === 0, fallidas.length === 0);
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
    'lección 8 (Próximamente) no tiene página: 404',
    'lección 9 (Próximamente) no tiene página: 404',
    'la página de baja de avisos responde 200, sin indexar ni guardarse: 200',
    'la baja rechaza un enlace sin forma de UUID: 400',
    ...academy.lecciones.map(slug => `sin sesión: 303 a /acceso?volver=/academy/${slug}, sin guardarse: 303`),
  ];
  for (const linea of esperadas) assert.ok(salida.split('\n').some(l => l.startsWith('  OK    ') && l.endsWith(linea)), 'Falta: ' + linea);
  // El worker solo preguntó a Auth por la cookie inventada (y Auth la rechazó).
  assert.deepEqual(local.peticionesSupabase.map(p => p.metodo + ' ' + p.ruta), ['GET /auth/v1/user']);
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

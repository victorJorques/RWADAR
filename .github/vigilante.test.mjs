// Pruebas locales, sin red, de .github/vigilante.mjs: respuestas buenas y malas
// simuladas para cada comprobación. Uso: node --test .github/vigilante.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import {
  WEB, VERSION_ANDROID, PREFIJO_APK, CATALOGO, CONSULTA_CRON,
  vigilar, informe, anotaciones, resumenMarkdown, main, taparDatos, revisarVersionAndroid, vigenciaCatalogo,
  crearPedir, leerAcademy, entornoPsql,
} from './vigilante.mjs';

const require = createRequire(import.meta.url);
const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const LECCION = 'que-significa-tokenizar-un-activo';
const ACADEMY = { acceso: 'cuenta', lecciones: [{ slug: 'proxima', estado: 'borrador' }, { slug: LECCION, estado: 'publicado' }] };
const AHORA = Date.parse('2026-11-07T05:17:00Z');
const H = 3600 * 1000;
const URL_DB = 'postgresql://postgres.abc:ContrasenaSecreta123@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';

const json = (datos, estado = 200) => new Response(JSON.stringify(datos), { status: estado, headers: { 'content-type': 'application/json' } });
const lote = (n = 26, extra = {}) => Array.from({ length: n }, () =>
  ({ verificado_lote_el: '2026-11-05', vigencia_lote_dias: 7, plataformas_esperadas: n, ...extra }));

function rutasBuenas() {
  return {
    [`${WEB}/`]: () => new Response('<!doctype html><title>RWAdar</title>', { status: 200 }),
    [`${WEB}/academy/${LECCION}`]: () => new Response(null, { status: 303,
      headers: { location: `/acceso?volver=/academy/${LECCION}`, 'cache-control': 'no-store' } }),
    [`${WEB}/privacidad`]: () => new Response('<h1>Privacidad</h1>', { status: 200 }),
    [VERSION_ANDROID]: () => json({ plataforma: 'android', version: '1.4.2', versionCode: 24, apk: `${PREFIJO_APK}v1.4.2/RWAdar.apk` }),
    [CATALOGO]: () => json(lote()),
    [`${WEB}/.well-known/security.txt`]: () => new Response('Contact: mailto:rwadares@gmail.com\nExpires: 2027-08-22T00:00:00.000Z\n', { status: 200 }),
  };
}

function fetchFalso(cambios = {}, registro = []) {
  const rutas = { ...rutasBuenas(), ...cambios };
  return async (url, opciones) => {
    registro.push({ url, opciones });
    const r = rutas[url];
    if (!r) return new Response('no existe', { status: 404 });
    return r(opciones);
  };
}

const psqlVacio = () => ({ codigo: 0, salida: '[]\n', error: '' });
const sinEspera = async () => {};

async function correr({ cambios, ahora = AHORA, academy = ACADEMY, dbUrl = URL_DB, ejecutarPsql = psqlVacio, registro } = {}) {
  return vigilar({ fetchImpl: fetchFalso(cambios, registro), esperar: sinEspera, ahora, academy, dbUrl, ejecutarPsql });
}
const buscar = (resultados, trozo) => {
  const r = resultados.find(x => x.nombre.includes(trozo));
  assert.ok(r, `no hay comprobación con «${trozo}»`);
  return r;
};
const fallidas = resultados => resultados.filter(r => !r.ok);

test('todo bien: siete comprobaciones correctas, sin cookies y la Academy pedida como navegador', async () => {
  const registro = [];
  const resultados = await correr({ registro });
  assert.equal(resultados.length, 7);
  assert.deepEqual(fallidas(resultados), []);
  const texto = informe(resultados, AHORA);
  assert.match(texto, /7 correctas, 0 fallidas/);
  assert.match(texto, /revisión del 05\/11\/2026, plazo 7 días: caduca el 13\/11\/2026 a las 00:00 UTC \(quedan 138 h\)/);
  assert.match(texto, /security\.txt .*caduca el 22\/08\/2027 \(quedan 287 días\)/);
  assert.match(texto, /versión 1\.4\.2 \(código 24\)/);
  for (const { opciones } of registro) {
    assert.equal(opciones.method, 'GET');
    assert.ok(!Object.keys(opciones.headers).some(c => /cookie|authorization/i.test(c)), 'nunca manda cookies ni tokens');
  }
  const academy = registro.find(r => r.url.includes('/academy/'));
  assert.equal(academy.opciones.headers.Accept, 'text/html');
  assert.equal(academy.opciones.redirect, 'manual');
  assert.equal(registro.find(r => r.url === VERSION_ANDROID).opciones.redirect, 'follow');
});

test('la portada caída se reintenta y, si sigue, falla diciendo qué hacer', async () => {
  let llamadas = 0, esperas = 0;
  const fetchImpl = fetchFalso({ [`${WEB}/`]: () => { llamadas++; return new Response('caída', { status: 503 }); } });
  const resultados = await vigilar({ fetchImpl, esperar: async () => { esperas++; }, ahora: AHORA, academy: ACADEMY, dbUrl: URL_DB, ejecutarPsql: psqlVacio });
  const portada = buscar(resultados, 'La portada');
  assert.equal(portada.ok, false);
  assert.equal(portada.detalle, 'da 503');
  assert.match(portada.queHacer, /Publicar web/);
  assert.equal(llamadas, 3);
  assert.equal(esperas, 2);
  assert.equal(fallidas(resultados).length, 1);
});

test('un corte de red pasajero no da fallo; uno que dura sí, con la causa', async () => {
  let veces = 0;
  const corte = () => { veces++; if (veces === 1) throw new TypeError('fetch failed', { cause: { code: 'ECONNRESET' } }); return new Response('ok', { status: 200 }); };
  assert.equal(buscar(await correr({ cambios: { [`${WEB}/privacidad`]: corte } }), 'privacidad').ok, true);
  const siempre = () => { throw new TypeError('fetch failed', { cause: { code: 'ENOTFOUND' } }); };
  const r = buscar(await correr({ cambios: { [`${WEB}/privacidad`]: siempre } }), 'privacidad');
  assert.equal(r.ok, false);
  assert.match(r.detalle, /no responde tras 3 intentos \(ENOTFOUND: fetch failed\)/);
});

test('con la web caída del todo, las seis comprobaciones van a la vez y fallan todas', async () => {
  let enCurso = 0, maximo = 0;
  const caida = async () => {
    enCurso++; maximo = Math.max(maximo, enCurso);
    await new Promise(r => setTimeout(r, 5));
    enCurso--; throw new TypeError('fetch failed', { cause: { code: 'ETIMEDOUT' } });
  };
  const resultados = await vigilar({ fetchImpl: caida, esperar: sinEspera, ahora: AHORA, academy: ACADEMY, dbUrl: URL_DB, ejecutarPsql: psqlVacio });
  assert.equal(maximo, 6);
  assert.equal(fallidas(resultados).length, 6);
  assert.ok(fallidas(resultados).every(r => /no responde tras 3 intentos \(ETIMEDOUT/.test(r.detalle)));
  assert.match(informe(resultados, AHORA), /1 correctas, 6 fallidas/);
});

test('un 404 no se reintenta', async () => {
  let llamadas = 0;
  const pedir = crearPedir({ fetchImpl: async () => { llamadas++; return new Response('', { status: 404 }); }, esperar: sinEspera });
  assert.equal((await pedir(`${WEB}/x`)).estado, 404);
  assert.equal(llamadas, 1);
});

test('Academy: una lección que se ve sin cuenta, o que manda a otro sitio, falla', async () => {
  const abierta = buscar(await correr({ cambios: { [`${WEB}/academy/${LECCION}`]: () => new Response('<h1>Lección</h1>', { status: 200 }) } }), 'Academy');
  assert.equal(abierta.ok, false);
  assert.equal(abierta.detalle, 'da 200: la lección se ve sin cuenta');
  assert.match(abierta.queHacer, /_worker\.js/);
  const otra = buscar(await correr({ cambios: { [`${WEB}/academy/${LECCION}`]: () =>
    new Response(null, { status: 302, headers: { location: '/acceso' } }) } }), 'Academy');
  assert.equal(otra.ok, false);
  assert.equal(otra.detalle, 'da 302 hacia /acceso');
  assert.match(otra.nombre, /303 a \/acceso\?volver=\/academy\/que-significa-tokenizar-un-activo/);
  const sinVuelta = buscar(await correr({ cambios: { [`${WEB}/academy/${LECCION}`]: () =>
    new Response(null, { status: 303, headers: { location: '/acceso?volver=/' } }) } }), 'Academy');
  assert.equal(sinVuelta.ok, false, 'tiene que volver a la misma lección');
  assert.equal(sinVuelta.detalle, 'da 303 hacia /acceso?volver=/');
});

test('Academy: si academy.json dice que son públicas, pide 200; sin academy.json falla claro', async () => {
  const publica = { ...ACADEMY, acceso: 'publico' };
  const r = buscar(await correr({ academy: publica, cambios: { [`${WEB}/academy/${LECCION}`]: () => new Response('ok', { status: 200 }) } }), 'Academy');
  assert.equal(r.ok, true);
  const sin = buscar(await correr({ academy: null }), 'Academy');
  assert.equal(sin.ok, false);
  assert.match(sin.detalle, /academy\.json/);
  // La de verdad del repositorio se lee y tiene alguna lección publicada.
  const real = leerAcademy();
  assert.ok(real && real.lecciones.some(l => l.estado === 'publicado'));
});

test('privacidad que no da 200 falla', async () => {
  const r = buscar(await correr({ cambios: { [`${WEB}/privacidad`]: () => new Response('', { status: 404 }) } }), 'privacidad');
  assert.equal(r.ok, false);
  assert.equal(r.detalle, 'da 404');
  assert.match(r.queHacer, /RGPD/);
});

test('version-android.json: falta, no es JSON, forma mala o enlace ajeno, todo falla', async () => {
  const casos = [
    [() => new Response('Not Found', { status: 404 }), /no se pudo descargar: da 404/],
    [() => new Response('<html>', { status: 200 }), /no es JSON válido/],
    [() => json({ plataforma: 'android', version: '1.4.2', versionCode: 24 }), /le falta apk/],
    [() => json({ plataforma: 'android', version: '1.4.2', versionCode: 24, apk: 'https://ejemplo.com/RWAdar.apk' }), /no empieza por https:\/\/github\.com\/victorJorques\/RWAdar-downloads\/releases\/download\//],
    [() => json({ plataforma: 'android', version: '1.4.2', versionCode: 24, apk: `${PREFIJO_APK}v1.4.1/RWAdar.apk` }), /el único enlace que acepta la app/],
    [() => json({ plataforma: 'ios', version: '1.4.2', versionCode: 24, apk: `${PREFIJO_APK}v1.4.2/RWAdar.apk` }), /"plataforma"/],
    [() => json({ plataforma: 'android', version: '1.4.2', versionCode: '24', apk: `${PREFIJO_APK}v1.4.2/RWAdar.apk` }), /"versionCode"/],
    [() => json([1, 2]), /no es un objeto JSON/],
    [() => new Response('{"a":"' + 'x'.repeat(5000) + '"}', { status: 200 }), /más de 4096 bytes/],
  ];
  for (const [respuesta, esperado] of casos) {
    const r = buscar(await correr({ cambios: { [VERSION_ANDROID]: respuesta } }), 'version-android');
    assert.equal(r.ok, false);
    assert.match(r.detalle, esperado);
    assert.match(r.queHacer, /RWAdar-downloads\/releases\/latest/);
  }
});

test('version-android.json: GitHub caído (5xx, 429 o sin red) no manda a editar la release', async () => {
  for (const [respuesta, esperado] of [
    [() => new Response('<title>Unicorn! · GitHub</title>', { status: 504 }), /GitHub no responde: da 504/],
    [() => new Response('lento', { status: 429 }), /GitHub no responde: da 429/],
    [() => { throw new TypeError('fetch failed'); }, /no responde tras 3 intentos/],
  ]) {
    const r = buscar(await correr({ cambios: { [VERSION_ANDROID]: respuesta } }), 'version-android');
    assert.equal(r.ok, false);
    assert.match(r.detalle, esperado);
    assert.match(r.queHacer, /pasajero/);
    assert.match(r.queHacer, /githubstatus\.com/);
    assert.doesNotMatch(r.queHacer, /edita esa release/);
  }
});

test('version-android.json: la regla es la misma que la de la app', () => {
  const { validarVersionPublicada } = require('../rwadar-movil/lib/actualizaciones-app.js');
  const bueno = { plataforma: 'android', version: '1.4.2', versionCode: 24, apk: `${PREFIJO_APK}v1.4.2/RWAdar.apk` };
  const muestras = [
    bueno, { ...bueno, extra: true }, { ...bueno, version: '1.4' }, { ...bueno, version: 142 }, { ...bueno, versionCode: 0 },
    { ...bueno, versionCode: 10000000 }, { ...bueno, versionCode: 24.5 }, { ...bueno, apk: `${PREFIJO_APK}1.4.2/RWAdar.apk` },
    { ...bueno, apk: `${PREFIJO_APK}v1.4.2/rwadar.apk` }, { ...bueno, plataforma: 'Android' }, null, [], 'texto', {},
  ];
  for (const m of muestras) {
    assert.equal(revisarVersionAndroid(m) === null, validarVersionPublicada(m) !== null, JSON.stringify(m));
  }
});

test('catálogo: avisa con menos de 48 h y falla si ya caducó', async () => {
  const quedan30 = buscar(await correr({ ahora: Date.parse('2026-11-11T18:00:00Z') }), 'catálogo');
  assert.equal(quedan30.ok, false);
  assert.match(quedan30.detalle, /caduca el 13\/11\/2026 a las 00:00 UTC: quedan 30 h/);
  assert.match(quedan30.queHacer, /haz la investigación/);
  const justo48 = buscar(await correr({ ahora: Date.parse('2026-11-11T00:00:00Z') }), 'catálogo');
  assert.equal(justo48.ok, true, 'con 48 h justas todavía no avisa');
  const caducado = buscar(await correr({ ahora: Date.parse('2026-11-14T06:00:00Z') }), 'catálogo');
  assert.equal(caducado.ok, false);
  assert.match(caducado.detalle, /ya caducó: revisión del 05\/11\/2026, plazo 7 días: caducó el 13\/11\/2026 a las 00:00 UTC \(hace 30 h\)/);
  assert.match(caducado.queHacer, /pendiente de renovar/);
});

test('catálogo: caduca exactamente cuando la web lo da por caducado', () => {
  // La misma cuenta que edadLoteDias() y CATALOGO_CADUCADO de rwadar-site/assets/rwadar-20260820.js.
  const web = (fecha, plazo, ahora) => {
    const hoy = new Date(ahora);
    const edad = Math.floor((Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()) - Date.parse(fecha + 'T00:00:00Z')) / 86400000);
    return edad > plazo;
  };
  const fuente = fs.readFileSync(path.join(raiz, 'rwadar-site/assets/rwadar-20260820.js'), 'utf8');
  assert.match(fuente, /CATALOGO_CADUCADO=edadLoteDias\(d\.fecha\)>d\.plataformas\[0\]\.vigencia_lote_dias/);
  assert.match(fuente, /return Math\.floor\(\(Date\.UTC\(hoy\.getUTCFullYear\(\),hoy\.getUTCMonth\(\),hoy\.getUTCDate\(\)\)-Date\.parse\(fecha\+'T00:00:00Z'\)\)\/86400000\);/);
  for (const plazo of [1, 3, 7]) {
    for (let t = Date.parse('2026-11-05T00:00:00Z'); t < Date.parse('2026-11-15T00:00:00Z'); t += 30 * 60 * 1000) {
      const v = vigenciaCatalogo(lote(3, { vigencia_lote_dias: plazo }), t);
      assert.equal(v.caducado, web('2026-11-05', plazo, t), `${plazo} días, ${new Date(t).toISOString()}`);
    }
  }
});

test('catálogo: lote incompleto, mezclado, sin filas, con plazo raro o fechado en el futuro, falla', async () => {
  const casos = [
    [() => json(lote(26).slice(0, 25)), /incompleto: 25 plataformas de 26/],
    [() => json([...lote(25, { plataformas_esperadas: 26 }), { verificado_lote_el: '2026-11-04', vigencia_lote_dias: 7, plataformas_esperadas: 26 }]), /lote mezclado/],
    [() => json([]), /no devuelve ninguna fila/],
    [() => json(lote(3, { vigencia_lote_dias: 9 })), /plazo de vigencia no es válido: 9/],
    [() => json(lote(3, { verificado_lote_el: '2026-02-30' })), /fecha de revisión no es válida/],
    [() => json(lote(3, { verificado_lote_el: '2026-11-09' })), /está en el futuro/],
    [() => json({ error: 'servicio' }, 502), /la pasarela del catálogo da 502/],
    [() => new Response('<html>', { status: 200 }), /no devuelve JSON/],
  ];
  for (const [respuesta, esperado] of casos) {
    const r = buscar(await correr({ cambios: { [CATALOGO]: respuesta } }), 'catálogo');
    assert.equal(r.ok, false, String(esperado));
    assert.match(r.detalle, esperado);
    assert.ok(r.queHacer.length > 40);
  }
});

test('catálogo: se lee por la pasarela pública de la web, sin clave', () => {
  assert.equal(new URL(CATALOGO).origin, WEB);
  assert.match(CATALOGO, /^https:\/\/rwadar\.pages\.dev\/api\/acceso\/catalogo\/catalogo_plataformas_publicas_v2\?select=/);
  const servidor = fs.readFileSync(path.join(raiz, 'rwadar-acceso/servidor.mjs'), 'utf8');
  assert.match(servidor, /\\\/api\\\/acceso\\\/catalogo\\\/\(catalogo_plataformas_publicas_v2\|/);
  assert.match(servidor, /\['select', 'limit', 'order', 'estado', 'slug', 'nombre'\]/);
  assert.doesNotMatch(fs.readFileSync(path.join(raiz, '.github/vigilante.mjs'), 'utf8'), /sb_publishable_[A-Za-z0-9]/);
});

test('security.txt: falla con menos de 30 días, caducado, sin Expires o sin archivo', async () => {
  const con = expires => () => new Response(`Contact: mailto:rwadares@gmail.com\n${expires}\n`, { status: 200 });
  const casos = [
    [con('Expires: 2026-11-27T00:00:00.000Z'), /caduca el 27\/11\/2026: quedan 19 días/],
    [con('Expires: 2026-11-01T00:00:00.000Z'), /ya caducó el 01\/11\/2026/],
    [con('Policy: https://rwadar.pages.dev/privacidad'), /no tiene una línea «Expires:»/],
    [con('Expires: pronto'), /no tiene una línea «Expires:»/],
    [() => new Response('', { status: 404 }), /da 404/],
  ];
  for (const [respuesta, esperado] of casos) {
    const r = buscar(await correr({ cambios: { [`${WEB}/.well-known/security.txt`]: respuesta } }), 'security.txt');
    assert.equal(r.ok, false);
    assert.match(r.detalle, esperado);
    assert.match(r.queHacer, /rwadar-site\/\.well-known\/security\.txt/);
  }
  const r = buscar(await correr({ cambios: { [`${WEB}/.well-known/security.txt`]: con('Expires: 2026-12-08T00:00:00.000Z') } }), 'security.txt');
  assert.equal(r.ok, true, 'con 30 días justos todavía no avisa');
});

test('pg_cron: un trabajo fallido falla con nombre, horas y mensaje recortado y sin datos de usuarios', async () => {
  const salida = JSON.stringify([
    { trabajo: 'rwadar-novedades', fallos: 12, primero: '2026-11-06T09:00:00.12+00:00', ultimo: '2026-11-07T04:55:00.5+00:00',
      mensaje: 'ERROR:  duplicate key value violates unique constraint "x" DETAIL: Key (correo)=(ana@ejemplo.com) already exists. usuario 3f2b8c1e-1a2b-4c3d-9e8f-0123456789ab token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.firma ' + 'x'.repeat(300) },
    { trabajo: 'rwadar-novedades-limpieza', fallos: 1, primero: '2026-11-07T04:41:00+00:00', ultimo: '2026-11-07T04:41:00+00:00',
      mensaje: 'ERROR: escribir a luis@correo.es falló' },
  ]);
  let recibido;
  const r = buscar(await correr({ ejecutarPsql: (url, sql) => { recibido = { url, sql }; return { codigo: 0, salida: `\n${salida}\n`, error: '' }; } }), 'pg_cron');
  assert.equal(r.ok, false);
  assert.equal(recibido.url, URL_DB);
  assert.equal(recibido.sql, CONSULTA_CRON);
  assert.match(r.detalle, /^rwadar-novedades: 12 fallos, el último el 07\/11\/2026 a las 04:55 UTC \(el primero, el 06\/11\/2026 a las 09:00 UTC\): «ERROR: duplicate key/);
  assert.match(r.detalle, /\| rwadar-novedades-limpieza: 1 fallo, el último el 07\/11\/2026 a las 04:41 UTC: «ERROR: escribir a «correo» falló»/);
  assert.doesNotMatch(r.detalle, /ana@ejemplo|luis@correo|3f2b8c1e|eyJhbGci|ContrasenaSecreta/);
  assert.match(r.detalle, /Key \(correo\)=\(«valor»\)/);
  assert.ok(r.detalle.split(' | ')[0].length < 300, 'el mensaje va recortado');
  assert.match(r.queHacer, /Integrations › Cron/);
});

test('pg_cron: sin fallos es correcto; con basura alrededor del JSON también se lee', async () => {
  const r = buscar(await correr({ ejecutarPsql: () => ({ codigo: 0, salida: 'SET\n[]\n', error: '' }) }), 'pg_cron');
  assert.equal(r.ok, true);
  assert.match(r.detalle, /ningún fallo desde el 05\/11\/2026 a las 05:17 UTC/);
  // Así saca psql un json_agg de dos filas: partido en dos líneas.
  const partida = '[{"trabajo":"a","fallos":1,"primero":"2026-11-07T01:00:00+00:00","ultimo":"2026-11-07T01:00:00+00:00","mensaje":"m"}, \n ' +
    '{"trabajo":"b","fallos":2,"primero":"2026-11-06T01:00:00+00:00","ultimo":"2026-11-07T02:00:00+00:00","mensaje":"n"}]\n';
  const dos = buscar(await correr({ ejecutarPsql: () => ({ codigo: 0, salida: partida, error: '' }) }), 'pg_cron');
  assert.equal(dos.ok, false);
  assert.match(dos.detalle, /^a: 1 fallo, .*\| b: 2 fallos, /);
});

/* El vigilante corre cada día y mira 48 h: sin esto, un fallo ya arreglado
   volvía a poner el flujo en rojo al día siguiente, con «Pide a Claude…». */
test('pg_cron: un fallo cuya última ejecución ya fue bien sale como «ya corregido» y no pone el flujo en rojo', async () => {
  const fila = (trabajo, ultimo_estado, ultimo = '2026-11-06T04:41:00+00:00') =>
    ({ trabajo, fallos: 1, primero: ultimo, ultimo, mensaje: 'ERROR: algo', ultimo_estado });
  const conSalida = filas => () => ({ codigo: 0, salida: JSON.stringify(filas) + '\n', error: '' });
  // El trabajo de las 04:41 falló el día antes y esta mañana (04:41) ya fue bien.
  const corregido = buscar(await correr({ ejecutarPsql: conSalida([fila('rwadar-novedades-limpieza', 'succeeded')]) }), 'pg_cron');
  assert.equal(corregido.ok, true);
  assert.match(corregido.detalle, /^ninguno sigue fallando; ya corregidos \(su última ejecución fue bien\): rwadar-novedades-limpieza: 1 fallo, el último el 06\/11\/2026 a las 04:41 UTC/);
  // Y el flujo sale en verde (código 0) si no hay nada más.
  const original = console.log;
  console.log = () => {};
  let codigo;
  try {
    codigo = await main([], { SUPABASE_DB_URL: URL_DB }, { fetchImpl: fetchFalso(), esperar: sinEspera, ahora: AHORA, academy: ACADEMY,
      ejecutarPsql: conSalida([fila('rwadar-novedades-limpieza', 'succeeded')]) });
  } finally { console.log = original; }
  assert.equal(codigo, 0);
  // Si la última sigue en «failed» (o no se sabe), sigue en rojo; los corregidos se mencionan aparte.
  const mezcla = buscar(await correr({ ejecutarPsql: conSalida([fila('rwadar-novedades', 'failed', '2026-11-07T05:10:00+00:00'),
    fila('rwadar-novedades-limpieza', 'succeeded'), fila('otro', null)]) }), 'pg_cron');
  assert.equal(mezcla.ok, false);
  assert.match(mezcla.detalle, /^rwadar-novedades: 1 fallo, el último el 07\/11\/2026 a las 05:10 UTC: «ERROR: algo» \| otro: 1 fallo/);
  assert.match(mezcla.detalle, /\. Aparte, ya corregidos \(su última ejecución fue bien\): rwadar-novedades-limpieza: /);
  assert.match(mezcla.queHacer, /Mientras falle/);
});

test('pg_cron: psql exige TLS (PGSSLMODE=require) salvo que se rebaje a mano', () => {
  assert.equal(entornoPsql({}).PGSSLMODE, 'require');
  assert.equal(entornoPsql({ PGSSLMODE: '' }).PGSSLMODE, 'require');
  assert.equal(entornoPsql({ PGSSLMODE: 'verify-full' }).PGSSLMODE, 'verify-full');
  assert.equal(entornoPsql({ PGSSLMODE: 'disable' }).PGSSLMODE, 'disable', 'solo a mano, contra un Postgres local');
  assert.equal(entornoPsql({}).PGAPPNAME, 'rwadar-vigilante');
});

test('pg_cron: sin secreto, sin psql, con error de conexión o con salida rara, falla claro y sin la contraseña', async () => {
  const sinSecreto = buscar(await correr({ dbUrl: '' }), 'pg_cron');
  assert.equal(sinSecreto.ok, false);
  assert.match(sinSecreto.detalle, /falta el secreto SUPABASE_DB_URL/);
  assert.match(sinSecreto.queHacer, /Secrets and variables › Actions/);
  const sinPsql = buscar(await correr({ ejecutarPsql: () => ({ codigo: null, salida: '', error: '', fallo: 'ENOENT' }) }), 'pg_cron');
  assert.match(sinPsql.detalle, /no está psql/);
  assert.match(sinPsql.queHacer, /Re-run jobs/);
  const conexion = buscar(await correr({ ejecutarPsql: () => ({ codigo: 2, salida: '',
    error: `psql: error: connection to server at "aws-0-eu-west-1.pooler.supabase.com" failed: FATAL:  password authentication failed for user "postgres.abc"\n(usando ${URL_DB})` }) }), 'pg_cron');
  assert.equal(conexion.ok, false);
  assert.match(conexion.detalle, /password authentication failed/);
  assert.doesNotMatch(conexion.detalle, /ContrasenaSecreta/);
  assert.match(conexion.queHacer, /actualiza el secreto SUPABASE_DB_URL/);
  const rara = buscar(await correr({ ejecutarPsql: () => ({ codigo: 0, salida: 'hola\n', error: '' }) }), 'pg_cron');
  assert.equal(rara.ok, false);
  assert.match(rara.detalle, /no es la lista esperada/);
});

test('pg_cron: la consulta es de solo lectura, de las últimas 48 h y solo de trabajos fallidos', () => {
  assert.match(CONSULTA_CRON, /^begin transaction read only;/);
  assert.match(CONSULTA_CRON, /rollback;\s*$/);
  assert.match(CONSULTA_CRON, /from cron\.job_run_details d/);
  assert.match(CONSULTA_CRON, /d\.status = 'failed'/);
  assert.match(CONSULTA_CRON, /interval '48 hours'/);
  assert.doesNotMatch(CONSULTA_CRON, /\b(insert|update|delete|truncate|drop|alter|create|grant|commit|call|perform|copy)\b/i);
  // Solo estas columnas: ninguna de una tabla con datos de usuarios.
  assert.deepEqual([...new Set(CONSULTA_CRON.match(/\b[dju]\.[a-z_]+/g))].sort(),
    ['d.jobid', 'd.return_message', 'd.start_time', 'd.status', 'j.jobid', 'j.jobname', 'u.jobid', 'u.start_time', 'u.status']);
  assert.deepEqual([...new Set(CONSULTA_CRON.match(/\bfrom [a-z_.]+/g))].sort(), ['from cron.job_run_details']);
  // La última ejecución terminada de cada trabajo, para saber si el fallo ya está corregido.
  assert.match(CONSULTA_CRON, /u\.status in \('succeeded', 'failed'\)[^;]*order by u\.start_time desc limit 1\) as ultimo_estado/);
});

test('taparDatos tapa correos, identificadores, tokens, claves, conexiones y valores; deja nombres de funciones', () => {
  assert.equal(taparDatos('fallo en rwadar_novedades.procesar_avisos_pendientes_de_envio'), 'fallo en rwadar_novedades.procesar_avisos_pendientes_de_envio');
  assert.equal(taparDatos('a@b.co y 3F2B8C1E-1A2B-4C3D-9E8F-0123456789AB'), '«correo» y «id»');
  assert.equal(taparDatos('clave sb_secret_abcDEF123 y Ab3' + 'x'.repeat(40)), 'clave «clave» y «clave»');
  assert.equal(taparDatos('teléfono 612345678901'), 'teléfono «número»');
  assert.equal(taparDatos(`ver ${URL_DB} ahora`), 'ver «conexión» ahora');
  assert.equal(taparDatos('Key (email, id)=(x@y.es, 7) existe'), 'Key (email, id)=(«valor») existe');
  assert.equal(taparDatos('  varias\n\n líneas  '), 'varias líneas');
  assert.equal(taparDatos('x'.repeat(500)).length, 160);
  assert.equal(taparDatos(null), '');
});

test('anotaciones de GitHub escapadas y resumen en Markdown', async () => {
  const resultados = await correr({ cambios: { [`${WEB}/privacidad`]: () => new Response('', { status: 500 }) } });
  const lineas = anotaciones(resultados);
  assert.equal(lineas.length, 1);
  assert.match(lineas[0], /^::error title=Vigilante%3A La página de privacidad \(\/privacidad\) responde 200::da 500\. Qué hacer: /);
  const raras = anotaciones([{ ok: false, nombre: 'a: b, c', detalle: '50%\nlínea', queHacer: 'x' }]);
  assert.equal(raras[0], '::error title=Vigilante%3A a%3A b%2C c::50%25%0Alínea. Qué hacer: x');
  const md = resumenMarkdown(resultados, AHORA);
  assert.match(md, /\| \*\*FALLA\*\* \| La página de privacidad/);
  assert.match(md, /\| OK \| La portada/);
});

test('main: sale con 1 si algo falla y escribe el resumen en GitHub; con --solo-web no mira la base', async () => {
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'vigilante-'));
  const resumen = path.join(carpeta, 'resumen.md');
  const salida = [];
  const original = console.log;
  console.log = (...a) => salida.push(a.join(' '));
  let codigo, soloWeb, mal;
  let psqlLlamado = false;
  try {
    codigo = await main([], { GITHUB_ACTIONS: 'true', GITHUB_STEP_SUMMARY: resumen, SUPABASE_DB_URL: URL_DB },
      { fetchImpl: fetchFalso({ [CATALOGO]: () => json(lote(26, { verificado_lote_el: '2026-10-01' })) }), esperar: sinEspera,
        ahora: AHORA, academy: ACADEMY, ejecutarPsql: psqlVacio });
    soloWeb = await main(['--solo-web'], {}, { fetchImpl: fetchFalso(), esperar: sinEspera, ahora: AHORA, academy: ACADEMY,
      ejecutarPsql: () => { psqlLlamado = true; return psqlVacio(); } });
  } finally { console.log = original; }
  const errorOriginal = console.error;
  console.error = () => {};
  try { mal = await main(['--produccion'], {}); } finally { console.error = errorOriginal; }
  assert.equal(codigo, 1);
  const texto = salida.join('\n');
  assert.match(texto, /FALLA El catálogo publicado sigue vigente al menos 48 h más: ya caducó/);
  assert.match(texto, /Qué hacer: .*haz la investigación/);
  assert.match(texto, /::error title=Vigilante%3A El catálogo publicado/);
  assert.match(texto, /6 correctas, 1 fallidas/);
  assert.match(fs.readFileSync(resumen, 'utf8'), /\| \*\*FALLA\*\* \| El catálogo publicado/);
  assert.doesNotMatch(texto, /ContrasenaSecreta/);
  assert.equal(soloWeb, 0);
  assert.equal(psqlLlamado, false);
  assert.match(texto, /OMITIDA Trabajos programados de la base \(pg_cron\): sin comprobar: se pidió --solo-web/);
  assert.equal(mal, 2);
  fs.rmSync(carpeta, { recursive: true, force: true });
});

test('el flujo diario: horario fijo fuera de 06-09 h del Pacífico, solo lectura, sin atajos', () => {
  const flujo = fs.readFileSync(path.join(raiz, '.github/workflows/vigilante.yml'), 'utf8');
  const cron = flujo.match(/^\s*- cron: '(\d+) (\d+) \* \* \*'/m);
  assert.ok(cron, 'tiene un horario diario fijo');
  const horaUTC = Number(cron[2]);
  for (const desfase of [7, 8]) { // verano e invierno en California
    const horaPacifico = (horaUTC - desfase + 24) % 24;
    assert.ok(horaPacifico < 6 || horaPacifico >= 9, `a las ${horaPacifico} h del Pacífico`);
  }
  assert.notEqual(Number(cron[1]) % 30, 0, 'no en punto ni a y media');
  assert.match(flujo, /^permissions:\n {2}contents: read\n/m);
  assert.doesNotMatch(flujo, /^ {2}(push|pull_request|workflow_run):/m);
  assert.match(flujo, /run: node \.github\/vigilante\.mjs\n/);
  assert.doesNotMatch(flujo, /--solo-web/);
  assert.match(flujo, /postgresql-client-17/);
  assert.match(flujo, /SUPABASE_DB_URL: \$\{\{ secrets\.SUPABASE_DB_URL \}\}/);
  for (const usa of flujo.match(/uses: \S+/g)) assert.match(usa, /@[0-9a-f]{40}$/, `${usa} va fijada por commit`);
});

test('el flujo diario avisa a Víctor con una incidencia y la cierra cuando todo va bien', () => {
  const flujo = fs.readFileSync(path.join(raiz, '.github/workflows/vigilante.yml'), 'utf8');
  // Solo el trabajo puede escribir incidencias; el script no recibe token.
  assert.match(flujo, /^ {4}permissions:\n {6}contents: read\n {6}issues: write\n/m);
  assert.equal((flujo.match(/issues: write/g) || []).length, 1);
  const paso = (nombre) => {
    const i = flujo.indexOf(`- name: ${nombre}`);
    assert.ok(i >= 0, `falta el paso «${nombre}»`);
    const siguiente = flujo.indexOf('\n      - name:', i + 1);
    return flujo.slice(i, siguiente < 0 ? undefined : siguiente);
  };
  const vigilar = paso('Vigilar la web, las descargas y la base');
  assert.doesNotMatch(vigilar, /GH_TOKEN|github\.token/);
  const avisar = paso('Avisar a Víctor si algo falla');
  assert.match(avisar, /if: failure\(\)/);
  assert.match(avisar, /continue-on-error: true/);
  assert.match(avisar, /@victorJorques/);
  assert.match(avisar, /gh issue comment "\$NUM"/);
  assert.match(avisar, /gh issue create --title "\$TITULO"/);
  assert.doesNotMatch(avisar, /SUPABASE_DB_URL|secrets\./);
  const cerrar = paso('Cerrar el aviso si ya está todo bien');
  assert.match(cerrar, /if: success\(\)/);
  assert.match(cerrar, /gh issue close "\$NUM"/);
  assert.doesNotMatch(cerrar, /SUPABASE_DB_URL|secrets\./);
  // El mismo título en los dos pasos, para que se encuentren.
  const titulos = flujo.match(/TITULO='([^']+)'/g);
  assert.equal(titulos.length, 2);
  assert.equal(new Set(titulos).size, 1);
});

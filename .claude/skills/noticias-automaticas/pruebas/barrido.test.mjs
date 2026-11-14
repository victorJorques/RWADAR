// El barrido y la comprobación de fuentes (un programa, no un agente) y la
// comprobación en vivo, contra servidores locales. Sin red.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { barrer, comprobarFuentes, filtrarElementos, LECTORES, pedirFuente } from '../lib/barrido.mjs';
import { comprobarVivo, comprobarVivoUnaVez } from '../lib/flujo.mjs';
import { buscarPersonas } from '../lib/personas.mjs';
import { Freno, sha256 } from '../lib/comun.mjs';
import { FECHA, BASE, RAIZ, tmp, escribir, servidor, edicionBuena } from './ayuda.mjs';

const CNMV = `<div class="blocks-single"><span class="fecha-con-hora">13/11/2026</span><span class="time">13:00</span>
  <a href="https://www.cnmv.es/webservices/verdocumento/ver?t=1">Advertencias de entidades no registradas</a></div>
  <div class="blocks-single"><span class="fecha-con-hora">10/11/2026</span><a href="https://www.cnmv.es/x">La CNMV publica su informe</a></div>`;
const RSS = `<?xml version="1.0"?><rss><channel>
  <item><title>ESMA publishes guidance on tokenised securities</title><link>https://www.esma.europa.eu/a</link><pubDate>Fri, 13 Nov 2026 09:00:00 +0100</pubDate></item>
  <item><title>Keynote speech on tokenised securities</title><link>https://www.esma.europa.eu/b</link><pubDate>Thu, 12 Nov 2026 09:00:00 +0100</pubDate></item>
  <item><title>Staff canteen menu</title><link>https://www.esma.europa.eu/c</link><pubDate>Thu, 12 Nov 2026 09:00:00 +0100</pubDate></item>
</channel></rss>`;
// Sumario del BOE inventado: un acuerdo del sector y un nombramiento (nombre de relleno, no real).
const BOE = `<?xml version="1.0"?><response><data><sumario><metadatos><fecha_publicacion>20261114</fecha_publicacion></metadatos>
  <item><titulo>Resolución de la CNMV sobre el registro de proveedores de criptoactivos</titulo><url_html>https://www.boe.es/1</url_html></item>
  <item><titulo>Real Decreto por el que se nombra a don Nombre Apellido Consejero de valores</titulo><url_html>https://www.boe.es/2</url_html></item>
  <item><titulo>Orden sobre ayudas agrarias</titulo><url_html>https://www.boe.es/3</url_html></item>
</sumario></data></response>`;

const fuentesDe = url => [
  { id: 'cnmv-notas', nombre: 'CNMV', url: `${url}/cnmv`, lector: 'cnmv-lista', critica: true, todoDelSector: true },
  { id: 'esma-rss', nombre: 'ESMA', url: `${url}/esma`, lector: 'rss', critica: true },
  { id: 'boe-sumario', nombre: 'BOE', url: `${url}/boe/{AAAAMMDD}`, lector: 'boe', accept: 'application/xml', sinEdicionEsNormal: true },
  { id: 'eba-rss', nombre: 'EBA', url: `${url}/eba`, lector: 'rss', vacioEsNormal: true },
  { id: 'comision', nombre: 'Comisión', url: `${url}/comision`, lector: 'huella' },
];
const RAPIDO = { separacionMs: 0, esperaBaseMs: 5, plazoMs: 3000 };

test('lectores: CNMV, RSS y BOE con sus fechas; el filtro deja fuera lo que no es del sector, los discursos y los nombramientos', () => {
  const cnmv = LECTORES['cnmv-lista'](CNMV);
  assert.deepEqual(cnmv[0], { fecha: '2026-11-13', hora: '13:00', titulo: 'Advertencias de entidades no registradas', enlace: 'https://www.cnmv.es/webservices/verdocumento/ver?t=1' });
  const rss = LECTORES.rss(RSS);
  assert.equal(rss.length, 3); assert.equal(rss[0].fecha, '2026-11-13');
  const f = filtrarElementos(rss);
  assert.deepEqual(f.guardados.map(e => e.enlace), ['https://www.esma.europa.eu/a']);
  assert.equal(f.conNombre, 1); assert.equal(f.fueraDelSector, 1);
  const boe = filtrarElementos(LECTORES.boe(BOE));
  assert.deepEqual(boe.guardados.map(e => e.enlace), ['https://www.boe.es/1']);
  assert.equal(boe.conNombre, 1);
  assert.ok(buscarPersonas('Real Decreto por el que se nombra a don Nombre Apellido'));
  assert.ok(buscarPersonas('President Nombre Apellido said'));
  assert.equal(buscarPersonas('La CNMV autoriza a Bit2Me STX'), null);
  assert.equal(buscarPersonas('ESMA: guidance on tokenisation', { titular: true }), null);
  assert.ok(buscarPersonas('Nombre Apellido: Made in Europe', { titular: true }));
});

test('un día bueno: todas leídas, «nuevos» desde la última edición, la fuente de cada noticia con su huella; BOE con nombramiento sin el nombre', async () => {
  const s = await servidor({ '/cnmv': { cuerpo: CNMV, tipo: 'text/html' }, '/esma': { cuerpo: RSS, tipo: 'application/rss+xml' },
    '/boe/20261114': req => (req.headers.accept === 'application/xml' ? { cuerpo: BOE, tipo: 'application/xml' } : { estado: 400 }),
    '/eba': { cuerpo: '<rss><channel></channel></rss>', tipo: 'application/rss+xml' }, '/comision': { redirigir: '/comision-nueva' }, '/comision-nueva': { cuerpo: 'pagina' },
    '/noticia': { cuerpo: 'pdf', tipo: 'application/pdf' } });
  try {
    const referencia = { actualizadoEl: '2026-11-13', noticias: [{ id: 'una', fuente: { url: `${s.url}/noticia` } }] };
    const crudo = tmp('crudo');
    const b = await barrer({ fecha: FECHA, ayer: '2026-11-13', fuentes: fuentesDe(s.url), referencia, crudo, opciones: RAPIDO,
      huellasAnteriores: new Map([['cnmv-notas', 'viejo'], [`${s.url}/noticia`, sha256('pdf')]]) });
    assert.deepEqual(b.criticasCaidas, []); assert.deepEqual(b.caidas, []);
    const cnmv = b.fuentes.find(f => f.id === 'cnmv-notas');
    assert.equal(cnmv.cambia, true);
    assert.deepEqual(cnmv.nuevos.map(e => e.fecha), ['2026-11-13']);
    const boe = b.fuentes.find(f => f.id === 'boe-sumario');
    assert.equal(boe.http, 200); assert.equal(boe.omitidosPorNombre, 1); assert.equal(boe.fueraDelSector, 1);
    assert.ok(!JSON.stringify(b).includes('Nombre Apellido'), 'el nombre llegaría a Git');
    assert.equal(b.fuentes.find(f => f.id === 'comision').http, 200);
    assert.deepEqual(b.deNoticias.map(d => [d.id, d.http, d.igualQuePublicada]), [['una', 200, true]]);
    assert.ok(fs.readdirSync(crudo).length >= 5, 'las copias en bruto, fuera del repositorio');
  } finally { await s.cerrar(); }
});

test('mutación 12: una fuente crítica caída (503 tres veces) va a «criticasCaidas»; una no crítica, solo a «caidas»; un 503 que se arregla, bien', async () => {
  const s = await servidor({ '/cnmv': { estado: 503 }, '/esma': (req, n) => (n < 3 ? { estado: 503 } : { cuerpo: RSS }), '/boe/20261114': { estado: 404 },
    '/eba': { estado: 500 }, '/comision': { cuerpo: 'x' } });
  try {
    const b = await barrer({ fecha: FECHA, ayer: '2026-11-13', fuentes: fuentesDe(s.url), referencia: { noticias: [] }, crudo: tmp('crudo'), opciones: RAPIDO });
    assert.deepEqual(b.criticasCaidas, ['cnmv-notas']);
    assert.deepEqual(b.caidas.map(c => c.id).sort(), ['cnmv-notas', 'eba-rss']);
    assert.equal(s.cuentas.get('/cnmv'), 3);
    assert.equal(b.fuentes.find(f => f.id === 'esma-rss').http, 200);
    assert.equal(b.fuentes.find(f => f.id === 'boe-sumario').sinEdicion, true);
  } finally { await s.cerrar(); }
  // Una crítica que responde pero ya no se entiende (cambió de forma): también caída.
  const s2 = await servidor({ '/cnmv': { cuerpo: '<html>otra cosa</html>' }, '/esma': { cuerpo: RSS }, '/boe/20261114': { estado: 404 }, '/eba': { cuerpo: '<rss/>' }, '/comision': { cuerpo: 'x' } });
  try {
    const b = await barrer({ fecha: FECHA, ayer: '2026-11-13', fuentes: fuentesDe(s2.url), referencia: { noticias: [] }, crudo: tmp('crudo'), opciones: RAPIDO });
    assert.deepEqual(b.criticasCaidas, ['cnmv-notas']);
  } finally { await s2.cerrar(); }
});

test('un plazo agotado cuenta como caída y se reintenta; un 403 no se reintenta', async () => {
  const s = await servidor({ '/lento': () => ({ estado: 200, cuerpo: 'x' }), '/prohibido': { estado: 403 } });
  try {
    const lento = await pedirFuente(`${s.url}/lento`, { plazoMs: 2000, esperaBaseMs: 1, pedir: async () => { throw Object.assign(new Error('x'), { name: 'TimeoutError' }); } });
    assert.equal(lento.http, 0); assert.equal(lento.error, 'TimeoutError');
    const r = await pedirFuente(`${s.url}/prohibido`, { esperaBaseMs: 1 });
    assert.equal(r.http, 403); assert.equal(s.cuentas.get('/prohibido'), 1);
  } finally { await s.cerrar(); }
});

test('comprobar-fuentes: el programa abre cada fuente de la edición y guarda HTTP y SHA-256', async () => {
  const s = await servidor({ '/a': { cuerpo: 'A', tipo: 'application/pdf' }, '/b': { estado: 503 } });
  try {
    const inv = await comprobarFuentes({ fecha: FECHA, edicion: { noticias: [{ fuente: { url: `${s.url}/a` } }, { fuente: { url: `${s.url}/b` } }, { fuente: { url: 'http://no-https' } }] }, opciones: RAPIDO });
    assert.deepEqual(inv.fuentes.map(f => [f.http, f.sha256 === sha256('A')]), [[200, true], [503, false], [0, false]]);
    // La abre aunque sea http (la regla «solo https» la juzga V-12, no esta orden).
  } finally { await s.cerrar(); }
});

/* ---- Comprobación en vivo ---- */
function sitio({ v2, v1, fotos, cambiar = {} }) {
  const r = { '/datos/noticias-v2.json': { cuerpo: v2, tipo: 'application/json' }, '/datos/noticias.json': { cuerpo: v1, tipo: 'application/json' },
    '/': { cuerpo: '<main data-noticias="portada">', tipo: 'text/html' }, '/mercado/': { cuerpo: '<main data-noticias="lista">', tipo: 'text/html' } };
  for (const [clave, bytes] of Object.entries(fotos)) r[`/noticias-editoriales/${clave}.webp`] = { cuerpo: bytes, tipo: 'image/webp' };
  return { ...r, ...cambiar };
}
test('comprobar-vivo: bien byte a byte; mal con un byte distinto, una foto con otro SHA-256, una foto que falta o el v1 con «imagen» (mutaciones 13 y 14)', async () => {
  const v2 = fs.readFileSync(path.join(RAIZ, 'rwadar-site/datos/noticias-v2.json'));
  const v1 = fs.readFileSync(path.join(RAIZ, 'rwadar-site/datos/noticias.json'));
  const claves = [...new Set(JSON.parse(v2).noticias.map(n => n.imagen))];
  const fotos = Object.fromEntries(claves.map(c => [c, fs.readFileSync(path.join(RAIZ, 'rwadar-editorial-source/noticias/fotos', `${c}.webp`))]));
  const probar = async cambiar => { const s = await servidor(sitio({ v2, v1, fotos, cambiar })); try { return await comprobarVivoUnaVez({ base: s.url, raiz: RAIZ }); } finally { await s.cerrar(); } };
  assert.deepEqual((await probar({})).fallos, []);
  assert.match((await probar({ '/datos/noticias-v2.json': { cuerpo: Buffer.concat([v2, Buffer.from(' ')]), tipo: 'application/json' } })).fallos.join(), /no es byte a byte/);
  assert.match((await probar({ [`/noticias-editoriales/${claves[0]}.webp`]: { cuerpo: 'otra', tipo: 'image/webp' } })).fallos.join(), /SHA-256 distinto/);
  assert.match((await probar({ [`/noticias-editoriales/${claves[0]}.webp`]: undefined })).fallos.join(), /HTTP 404/);
  const v1conImagen = Buffer.from(v1.toString().replace('"id"', '"imagen": "x", "id"'));
  assert.match((await probar({ '/datos/noticias.json': { cuerpo: v1conImagen, tipo: 'application/json' } })).fallos.join(), /noticias\.json/);
  assert.match((await probar({ '/': { cuerpo: '<main>', tipo: 'text/html' } })).fallos.join(), /portada/);
});
test('comprobar-vivo con reintentos: un 503 que se arregla al tercer intento pasa; si no se arregla, freno', async () => {
  const v2 = fs.readFileSync(path.join(RAIZ, 'rwadar-site/datos/noticias-v2.json'));
  const v1 = fs.readFileSync(path.join(RAIZ, 'rwadar-site/datos/noticias.json'));
  const claves = [...new Set(JSON.parse(v2).noticias.map(n => n.imagen))];
  const fotos = Object.fromEntries(claves.map(c => [c, fs.readFileSync(path.join(RAIZ, 'rwadar-editorial-source/noticias/fotos', `${c}.webp`))]));
  const s = await servidor(sitio({ v2, v1, fotos, cambiar: { '/datos/noticias-v2.json': (req, n) => (n < 3 ? { estado: 503 } : { cuerpo: v2, tipo: 'application/json' }) } }));
  try {
    const r = await comprobarVivo({ base: s.url, raiz: RAIZ, intentos: 4, esperaMs: 1 });
    assert.equal(r.intentos, 3);
  } finally { await s.cerrar(); }
  const s2 = await servidor(sitio({ v2, v1, fotos, cambiar: { '/datos/noticias-v2.json': { estado: 503 } } }));
  try {
    await assert.rejects(comprobarVivo({ base: s2.url, raiz: RAIZ, intentos: 2, esperaMs: 1 }), e => e instanceof Freno && /no sirve lo que hay en main/.test(e.motivo));
  } finally { await s2.cerrar(); }
  void edicionBuena; void BASE; void escribir;
});

// Entrega «2026-11-05» · lo que cambia en el repositorio DESPUÉS de aplicar el SQL en Supabase y de
// sincronizar (`node rwadar-app/sincronizar.js`). Sin red: solo lee y escribe archivos del repositorio.
//
//   1. Comprueba que el catálogo sincronizado es la revisión nueva: 25 plataformas y 24 ofertas, todas
//      verificadas el 05/11. Si no, no toca nada (la web nunca enseña una fecha que el catálogo en
//      línea aún no tiene).
//   2. rwadar-editorial-source/ofertas/transparencia.json (textos cortos y dos comprobaciones de la tarjeta):
//      - revisión, lote, revisadoEl y verificadaEl de las 24 ofertas, al 05/11;
//      - consultadaEl de «supervisada» y «documentoEspana» al 05/11 SOLO donde el expediente de hoy volvió
//        a consultar esa misma fuente (registros, documentos, afirmaciones o avisos del expediente); si
//        no, se deja la fecha vieja y se dice;
//      - mínimos cortos nuevos (Brickwise, Switzerlend, Hausera) y la salida corta de Pottendorfer; el de las
//        11 de reventa de Brickwise, «Desde X € la participación (05/11)», se comprueba contra el texto largo
//        del catálogo (es lo que enseña la tarjeta de la web y de la app);
//      - puntos fuertes con fuente de hoy (mercado de reventa de Brickwise);
//      - el motivo nuevo de «documentoEspana» de Spiko Euro y Dólar (DECISIONES-COORDINADOR.md).
//   El archivo se valida con transparencia.mjs (cargarTransparencia) antes de escribirlo.
//
// Se puede repetir: si ya está hecho, no cambia nada.
//
//   node rwadar-app/data/verificaciones/2026-11-05-v2/despues-de-aplicar.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../../../..');
const require = createRequire(import.meta.url);
const { leerBloquesCatalogo } = require(path.join(ROOT, 'rwadar-fichas.js'));
const { cargarTransparencia, FUENTE: TRANSPARENCIA } = await import(path.join(ROOT, 'rwadar-editorial-source/ofertas/transparencia.mjs'));
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const ETIQUETA = '2026-11-05', FECHA = '2026-11-05';
const revision = leer(path.join(ROOT, `rwadar-app/data/importaciones/catalogo-${ETIQUETA}-v2/revision.json`));

// 1 · el catálogo sincronizado es el de la entrega
const snap = leerBloquesCatalogo(fs.readFileSync(path.join(ROOT, 'rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8'));
assert.deepEqual([...new Set([...snap.plataformas, ...snap.ofertas].map(x => x.revisionId))], [revision.revisionId],
  `el catálogo sincronizado no es la revisión ${revision.revisionId}: aplica antes el SQL y ejecuta node rwadar-app/sincronizar.js`);
assert.equal(snap.plataformas.length, revision.plataformas);
assert.equal(snap.ofertas.length, revision.ofertas);
assert.ok(snap.ofertas.every(o => o.verificadaEl === FECHA), 'las ofertas sincronizadas no están verificadas el 05/11');

// 2 · transparencia.json
const texto = fs.readFileSync(TRANSPARENCIA, 'utf8');
const t = JSON.parse(texto);
assert.equal(JSON.stringify(t, null, 2) + '\n', texto, 'formato de transparencia.json inesperado');
assert.deepEqual(Object.keys(t.ofertas).sort(), snap.ofertas.map(o => o.slug).sort(), 'transparencia.json no tiene las 24 ofertas');
t.lote = ETIQUETA; t.revisionCatalogo = revision.revisionId; t.revisadoEl = FECHA;

// ¿Volvió a consultar hoy el expediente esta misma fuente? Se compara la dirección sin «www.», sin
// «.aspx», sin mayúsculas en la ruta y sin los parámetros de idioma o de pestaña (lang, vista).
const normal = u => { try { const x = new URL(u);
  const q = [...x.searchParams].filter(([k]) => !['lang', 'vista'].includes(k.toLowerCase())).map(([k, v]) => `${k.toLowerCase()}=${v}`).sort().join('&');
  return `${x.hostname.replace(/^www\./, '')}${x.pathname.replace(/\.aspx$/i, '').replace(/\/$/, '').toLowerCase()}?${q}`; } catch { return null; } };
const URLS = /https:\/\/[^\s"'«»)<>,]+/g;
const consultasDeHoy = slug => {
  const e = leer(path.join(DIR, 'expedientes', `${slug}.json`)), m = new Map();
  const toma = (lista, campo, nombre) => (lista || []).forEach((x, i) => { for (const u of String(x?.[campo] || '').match(URLS) || []) {
    const n = normal(u); if (n && !m.has(n)) m.set(n, `${nombre}[${i}]`); } });
  toma(e.registros, 'url', 'registros'); toma(e.documentos, 'url', 'documentos');
  toma(e.advertenciasReguladores, 'url', 'advertenciasReguladores'); toma(e.claims, 'fuentePrimaria', 'claims');
  toma(e.avisosConFecha, 'fuente', 'avisosConFecha'); toma(e.revisionAvisos, 'fuente', 'revisionAvisos');
  toma(e.cambiosRespectoPublicado, 'fuente', 'cambiosRespectoPublicado');
  return m;
};
const fechas = [];
for (const [slug, o] of Object.entries(t.ofertas)) {
  o.verificadaEl = FECHA;
  const hoy = consultasDeHoy(slug);
  for (const k of ['supervisada', 'documentoEspana']) {
    const donde = hoy.get(normal(o[k].fuente.url));
    if (donde) o[k].consultadaEl = FECHA;
    fechas.push({ slug, comprobacion: k, url: o[k].fuente.url, consultadaEl: o[k].consultadaEl, expediente: donde || null });
  }
}

// Mínimos y salidas cortos (máximo 40 caracteres), con el dato de hoy.
const CORTOS = {
  'vivienda-pluddemanngasse-101-graz': '75', 'vivienda-sonnleithnergasse-2-viena': '75', 'local-de-estanco-klagenfurt': '95',
  'vivienda-stallhofstra-e-28-gratwein': '69,90', 'vivienda-schwarzer-weg-18-graz': '66,67', 'drautalresidenz-paternion': '70',
  'randhartingergasse-9-viena': '78', 'apartamento-vacacional-hinterstoder-50': '77', 'vivienda-pottendorfer-stra-e-62-wr-neustadt': '74',
  'fotovoltaica-greenpoint': '100', 'fotovoltaica-cohotel': '110',
};
const snapPor = new Map(snap.ofertas.map(o => [o.slug, o]));
const tarjeta = (slug, etiqueta) => (snapPor.get(slug).documentacion?.referencias || []).find(r => r.etiqueta === etiqueta && r.fechaConsulta === FECHA)?.valor;
for (const [slug, precio] of Object.entries(CORTOS)) {
  assert.equal(tarjeta(slug, 'Mínimo de inversión'), `Desde ${precio} € la participación en reventa (05/11)`, `${slug}: mínimo del catálogo`);
  // La tarjeta de la web y de la app enseña este texto corto, no el largo: tiene que decir que es el
  // precio de una participación (revisión independiente del 05/11, C1; en 7 de las 11 la venta más
  // barata es un lote de varias).
  t.ofertas[slug].minimoCorto = `Desde ${precio} € la participación (05/11)`;
}
assert.equal(tarjeta('switzerlend', 'Mínimo de inversión'), '1 acción (68,01 CHF el 05/11)');
t.ofertas.switzerlend.minimoCorto = '1 acción (68,01 CHF, 05/11)';
assert.match(tarjeta('hausera-proximas-ofertas', 'Mínimo de inversión'), /^100 € según la FAQ de Hausera \(05\/11\)/);
t.ofertas['hausera-proximas-ofertas'].minimoCorto = '100 € según la FAQ de Hausera';
assert.match(tarjeta('vivienda-pottendorfer-stra-e-62-wr-neustadt', 'Salida'), /^Primera cancelación a los 15 años de la emisión;/);
t.ofertas['vivienda-pottendorfer-stra-e-62-wr-neustadt'].salidaCorta = 'Primera cancelación a 15 años; reventa';

// Puntos fuertes: el mercado de reventa de Brickwise se volvió a leer hoy.
for (const o of Object.values(t.ofertas)) for (const p of o.puntos)
  if (p.fuente.url === 'https://app.brickwise.at/desktopWeb/marketplace') p.fuente.titulo = p.fuente.titulo.replace(/\(\d{2}\/\d{2}\/2026\)$/, '(05/11/2026)');

// Spiko Euro y Dólar: «el fondo ya existía cuando su SICAV se inscribió» no prueba nada (revisión independiente).
const MOTIVO = 'KID oficial en español para todo inversor; la SICAV figura en la CNMV (n.º 2380) y la tabla de países de Spiko marca España.';
for (const slug of ['spiko-letras-del-tesoro-euro', 'spiko-letras-del-tesoro-dolar']) {
  const d = t.ofertas[slug].documentoEspana;
  assert.ok(d.motivo === MOTIVO || /CNMV \(n\.º 2380\)/.test(d.motivo), `${slug}: motivo de partida`);
  d.motivo = MOTIVO;
}

// Valida con las reglas de la web y de la app (transparencia.mjs) antes de escribir.
const valida = cargarTransparencia({ raiz: ROOT, datos: t });
// El mínimo corto de reventa es lo que lee el inversor en la tarjeta (web y app): mismo precio que el
// texto largo del catálogo, «la participación» y 40 caracteres como mucho (revisión del 05/11, R4).
for (const o of snap.ofertas.filter(x => x.coleccion === 'secundario' && x.plataformaSlug === 'brickwise')) {
  const corto = valida.ofertas[o.slug].minimoCorto, largo = tarjeta(o.slug, 'Mínimo de inversión');
  const precio = (largo || '').match(/^Desde ([\d.,]+) € la participación en reventa \(05\/11\)$/)?.[1];
  assert.ok(precio, `${o.slug}: mínimo largo del catálogo inesperado («${largo}»)`);
  assert.equal(corto, `Desde ${precio} € la participación (05/11)`, `${o.slug}: mínimo corto de la tarjeta`);
  assert.ok(corto.length <= 40, `${o.slug}: el mínimo corto pasa de 40 caracteres`);
}
assert.equal(snap.ofertas.filter(x => x.coleccion === 'secundario' && x.plataformaSlug === 'brickwise').length, Object.keys(CORTOS).length);
for (const [slug, o] of Object.entries(valida.ofertas))
  assert.ok(!/^Desde .* en reventa/.test(o.minimoCorto || '') || / la participación /.test(o.minimoCorto), `${slug}: mínimo de reventa sin «la participación»`);
const nuevo = JSON.stringify(t, null, 2) + '\n';
const cambios = [];
if (nuevo !== texto) { fs.writeFileSync(TRANSPARENCIA, nuevo); cambios.push('transparencia.json: revisión, lote, fechas del 05/11, mínimos cortos, puntos y motivos de Spiko'); }

console.log(cambios.length ? cambios.map(c => '· ' + c).join('\n') : 'Nada que cambiar: ya estaba hecho.');
const viejas = fechas.filter(f => f.consultadaEl !== FECHA);
console.log(`Comprobaciones de transparencia al 05/11: ${fechas.length - viejas.length} de ${fechas.length}.` +
  (viejas.length ? ' Con su fecha anterior (el expediente de hoy no volvió a leer esa fuente):\n' +
    viejas.map(f => `  · ${f.slug} · ${f.comprobacion}: ${f.consultadaEl} (${f.url})`).join('\n') : ''));
console.log('Siguiente: node rwadar-editorial-source/ofertas/transparencia.mjs && node rwadar-fichas.js && npm test');

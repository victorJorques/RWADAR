// Entrega «2026-11-11» · lo que cambia en el repositorio DESPUÉS de aplicar el SQL en Supabase y de
// sincronizar (`node rwadar-app/sincronizar.js`). Sin red: solo lee y escribe archivos del repositorio.
//
//   1. Comprueba que el catálogo sincronizado es la revisión nueva: 25 plataformas y 22 ofertas, todas
//      verificadas el 11/11. Si no, no toca nada (la web nunca enseña una fecha que el catálogo en
//      línea aún no tiene).
//   2. rwadar-editorial-source/ofertas/transparencia.json (DECISIONES §1: «se pone al día después de
//      aplicar, con fecha 11/11 solo donde el expediente de hoy volvió a consultar esa misma fuente.
//      Además, el mínimo corto de Brickwise»):
//      - revisión, lote, revisadoEl y verificadaEl de las 22 ofertas, al 11/11;
//      - consultadaEl de «supervisada» y «documentoEspana» al 11/11 SOLO donde el expediente de hoy volvió
//        a consultar esa misma fuente: la misma dirección en un registro, documento, afirmación o aviso
//        del expediente que lleve la fecha o la hora de hoy (o en sus cambios respecto de lo publicado).
//        Si no, se deja la fecha anterior y se dice;
//      - la fecha del título de los puntos fuertes («… (10/11/2026)») con la misma regla;
//      - los mínimos cortos de las 11 de Brickwise, que salen del texto largo del catálogo sincronizado
//        («Desde X € la participación en reventa (11/11)» → «Desde X € la participación (11/11)»);
//      - el mínimo corto de Switzerlend, con la fecha de su ficha (revisión de contenido, C1):
//        «1 acción (68,01 CHF, 10/11)» → «1 acción (68,01 CHF, 11/11)».
//      Nada más: ni motivos, ni textos de los puntos, ni otros mínimos o salidas cortas.
//   El archivo se valida con transparencia.mjs (cargarTransparencia) antes de escribirlo.
//
// Se puede repetir: si ya está hecho, no cambia nada.
//
//   node rwadar-app/data/verificaciones/2026-11-11-v2/despues-de-aplicar.mjs
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
const ETIQUETA = '2026-11-11', FECHA = '2026-11-11', FES = '11/11/2026', CORTA = '11/11';
const DESDE = '2026-11-10', FES_PREVIA = '10/11/2026';
const revision = leer(path.join(ROOT, `rwadar-app/data/importaciones/catalogo-${ETIQUETA}-v2/revision.json`));

// 1 · el catálogo sincronizado es el de la entrega
const snap = leerBloquesCatalogo(fs.readFileSync(path.join(ROOT, 'rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8'));
assert.deepEqual([...new Set([...snap.plataformas, ...snap.ofertas].map(x => x.revisionId))], [revision.revisionId],
  `el catálogo sincronizado no es la revisión ${revision.revisionId}: aplica antes el SQL y ejecuta node rwadar-app/sincronizar.js`);
assert.equal(snap.plataformas.length, revision.plataformas);
assert.equal(snap.ofertas.length, revision.ofertas);
assert.ok(snap.ofertas.every(o => o.verificadaEl === FECHA), 'las ofertas sincronizadas no están verificadas el 11/11');

// 2 · transparencia.json
const texto = fs.readFileSync(TRANSPARENCIA, 'utf8');
const t = JSON.parse(texto), antes = JSON.parse(texto);
assert.equal(JSON.stringify(t, null, 2) + '\n', texto, 'formato de transparencia.json inesperado');
assert.deepEqual(Object.keys(t.ofertas).sort(), snap.ofertas.map(o => o.slug).sort(), 'transparencia.json no tiene las 22 ofertas');
// De partida: la del 10/11 (revisión dfdc4c85) o ya la de hoy (repetición).
assert.ok((t.lote === DESDE && t.revisionCatalogo === revision.revisionAnterior && t.revisadoEl === DESDE) ||
  (t.lote === ETIQUETA && t.revisionCatalogo === revision.revisionId && t.revisadoEl === FECHA), 'transparencia.json de partida inesperado');
t.lote = ETIQUETA; t.revisionCatalogo = revision.revisionId; t.revisadoEl = FECHA;

// ¿Volvió a consultar hoy el expediente esta misma fuente? Se compara la dirección sin «www.», sin «.aspx», sin
// mayúsculas ni escapes en la ruta y sin los parámetros de idioma o de pestaña (lang, vista). Un campo que es solo
// una dirección se toma entero (así entran las que llevan paréntesis, como la de las condiciones finales «(LITEx)»).
// Cuenta solo si la entrada del expediente lleva la fecha o la hora de hoy, o es un cambio respecto de lo publicado.
const normal = u => { try { const x = new URL(u);
  const q = [...x.searchParams].filter(([k]) => !['lang', 'vista'].includes(k.toLowerCase())).map(([k, v]) => `${k.toLowerCase()}=${v}`).sort().join('&');
  return `${x.hostname.replace(/^www\./, '')}${decodeURIComponent(x.pathname).replace(/\.aspx$/i, '').replace(/\/$/, '').toLowerCase()}?${q}`; } catch { return null; } };
const URLS = /https:\/\/[^\s"'«»<>,]+/g;
const deHoy = x => /2026-11-11|11\/11\/2026|\b11\/11(?!\/\d)/.test(JSON.stringify(x));
const consultasDeHoy = slug => {
  const e = leer(path.join(DIR, 'expedientes', `${slug}.json`)), m = new Map();
  assert.equal(e.slug, slug); assert.equal(e.tipoExpediente, 'publicada');
  assert.ok(e.consulta.inicioUtc.startsWith(FECHA), `${slug}: expediente de hoy`);
  const toma = (lista, campo, nombre, siempre = false) => (lista || []).forEach((x, i) => {
    if (!siempre && !deHoy(x)) return;
    const v = String(x?.[campo] || '');
    const urls = /^https:\/\/\S+$/.test(v) ? [v] : (v.match(URLS) || []).map(u => u.replace(/[).;:]+$/, ''));
    for (const u of urls) { const n = normal(u); if (n && !m.has(n)) m.set(n, `${nombre}[${i}]`); }
  });
  toma(e.registros, 'url', 'registros'); toma(e.documentos, 'url', 'documentos');
  toma(e.advertenciasReguladores, 'url', 'advertenciasReguladores'); toma(e.claims, 'fuentePrimaria', 'claims');
  toma(e.avisosConFecha, 'fuente', 'avisosConFecha'); toma(e.revisionAvisos, 'fuente', 'revisionAvisos');
  toma(e.cambiosRespectoPublicado, 'fuente', 'cambiosRespectoPublicado', true);
  return m;
};
const fechas = [], puntos = [];
for (const [slug, o] of Object.entries(t.ofertas)) {
  assert.ok([DESDE, FECHA].includes(o.verificadaEl), `${slug}: verificadaEl de partida`);
  o.verificadaEl = FECHA;
  const hoy = consultasDeHoy(slug);
  for (const k of ['supervisada', 'documentoEspana']) {
    const donde = hoy.get(normal(o[k].fuente.url));
    if (donde) o[k].consultadaEl = FECHA;
    fechas.push({ slug, comprobacion: k, url: o[k].fuente.url, consultadaEl: o[k].consultadaEl, expediente: donde || null });
  }
  // Puntos fuertes: la fecha de consulta del título (la del 10/11), solo si el expediente de hoy volvió a consultar esa
  // fuente. Las fechas de un documento (p. ej. «KID … (01/09/2026)») no se tocan.
  for (const p of o.puntos) if (new RegExp(`\\(${FES_PREVIA}\\)$`).test(p.fuente.titulo)) {
    const donde = hoy.get(normal(p.fuente.url));
    if (donde) p.fuente.titulo = p.fuente.titulo.replace(`(${FES_PREVIA})`, `(${FES})`);
    puntos.push({ slug, titulo: p.fuente.titulo, expediente: donde || null });
  }
}

// Mínimos cortos de reventa de Brickwise (máximo 40 caracteres): el precio del texto largo del catálogo sincronizado
// (DECISIONES §2: Schwarzer Weg 69,90 €, Pottendorfer 73 €, el resto solo cambia de fecha).
const BRICKWISE = {
  'apartamento-vacacional-hinterstoder-50': '75', 'vivienda-schwarzer-weg-18-graz': '69,90', 'vivienda-stallhofstra-e-28-gratwein': '68,80',
  'drautalresidenz-paternion': '70', 'fotovoltaica-cohotel': '110', 'fotovoltaica-greenpoint': '100', 'randhartingergasse-9-viena': '78',
  'local-de-estanco-klagenfurt': '95', 'vivienda-pluddemanngasse-101-graz': '75', 'vivienda-pottendorfer-stra-e-62-wr-neustadt': '73',
  'vivienda-sonnleithnergasse-2-viena': '75',
};
const snapPor = new Map(snap.ofertas.map(o => [o.slug, o]));
const tarjeta = (slug, etiqueta) => (snapPor.get(slug).documentacion?.referencias || []).find(r => r.etiqueta === etiqueta && r.fechaConsulta === FECHA)?.valor;
const deBrickwise = snap.ofertas.filter(x => x.coleccion === 'secundario' && x.plataformaSlug === 'brickwise').map(o => o.slug);
assert.deepEqual(deBrickwise.sort(), Object.keys(BRICKWISE).sort(), 'las 11 de Brickwise');
for (const [slug, precio] of Object.entries(BRICKWISE)) {
  const largo = tarjeta(slug, 'Mínimo de inversión');
  assert.equal(largo, `Desde ${precio} € la participación en reventa (${CORTA})`, `${slug}: mínimo del catálogo`);
  const deCatalogo = largo.match(/^Desde ([\d.,]+) € la participación en reventa \(11\/11\)$/)[1];
  const hecho = `Desde ${deCatalogo} € la participación (${CORTA})`;
  assert.ok(/^Desde [\d,]+ € la participación \(10\/11\)$/.test(antes.ofertas[slug].minimoCorto) || antes.ofertas[slug].minimoCorto === hecho,
    `${slug}: mínimo corto de partida («${antes.ofertas[slug].minimoCorto}»)`);
  assert.ok(hecho.length <= 40, `${slug}: el mínimo corto pasa de 40 caracteres`);
  t.ofertas[slug].minimoCorto = hecho;
}
// Switzerlend (DECISIONES §2: mínimo «1 acción (68,01 CHF el 11/11)»). La tarjeta y «Lo esencial» enseñan el mínimo
// corto: tiene que llevar la misma fecha que la ficha (revisión de contenido, C1; como la C1 del 10/11).
assert.equal(tarjeta('switzerlend', 'Mínimo de inversión'), '1 acción (68,01 CHF el 11/11)', 'switzerlend: mínimo del catálogo');
assert.ok(['1 acción (68,01 CHF, 10/11)', '1 acción (68,01 CHF, 11/11)'].includes(antes.ofertas.switzerlend.minimoCorto),
  `switzerlend: mínimo corto de partida («${antes.ofertas.switzerlend.minimoCorto}»)`);
t.ofertas.switzerlend.minimoCorto = '1 acción (68,01 CHF, 11/11)';

// Nada más cambia: ni motivos, ni fuentes, ni textos de los puntos, ni los demás mínimos o salidas cortas, ni la
// fecha de alta. Solo verificadaEl, consultadaEl (donde se volvió a consultar), el título de los puntos con fecha
// del 10/11 (ídem) y los mínimos cortos de Brickwise y de Switzerlend.
{
  const quita = (x, slug) => { const o = structuredClone(x);
    o.verificadaEl = 'F'; o.supervisada.consultadaEl = 'F'; o.documentoEspana.consultadaEl = 'F';
    o.puntos = o.puntos.map(p => ({ ...p, fuente: { ...p.fuente, titulo: p.fuente.titulo.replace(/\((?:10|11)\/11\/2026\)$/, '(F)') } }));
    if (slug in BRICKWISE || slug === 'switzerlend') o.minimoCorto = 'F';
    return o; };
  for (const slug of Object.keys(t.ofertas)) assert.deepEqual(quita(t.ofertas[slug], slug), quita(antes.ofertas[slug], slug), `${slug}: cambio fuera de la lista`);
  const resto = x => { const { lote, revisionCatalogo, revisadoEl, ofertas, ...r } = x; return r; };
  assert.deepEqual(resto(t), resto(antes), 'transparencia.json: cambio fuera de las ofertas');
  for (const f of fechas) assert.ok([DESDE, FECHA].includes(f.consultadaEl) || !f.expediente, `${f.slug} · ${f.comprobacion}: fecha`);
}
// Valida con las reglas de la web y de la app (transparencia.mjs) antes de escribir.
const valida = cargarTransparencia({ raiz: ROOT, datos: t });
assert.deepEqual(valida.sinEntrada, []); assert.equal(valida.avisoRevision, '');
// El mínimo corto de reventa es lo que lee el inversor en la tarjeta (web y app): mismo precio que el texto largo del
// catálogo, «la participación» y 40 caracteres como mucho.
for (const slug of deBrickwise) {
  const corto = valida.ofertas[slug].minimoCorto, largo = tarjeta(slug, 'Mínimo de inversión');
  const precio = (largo || '').match(/^Desde ([\d.,]+) € la participación en reventa \(11\/11\)$/)?.[1];
  assert.ok(precio, `${slug}: mínimo largo del catálogo inesperado («${largo}»)`);
  assert.equal(corto, `Desde ${precio} € la participación (11/11)`, `${slug}: mínimo corto de la tarjeta`);
  assert.ok(corto.length <= 40, `${slug}: el mínimo corto pasa de 40 caracteres`);
}
for (const [slug, o] of Object.entries(valida.ofertas)) {
  assert.ok(!/^Desde .* en reventa/.test(o.minimoCorto || '') || / la participación /.test(o.minimoCorto), `${slug}: mínimo de reventa sin «la participación»`);
  assert.equal(o.verificadaEl, FECHA);
}
const nuevo = JSON.stringify(t, null, 2) + '\n';
const cambios = [];
if (nuevo !== texto) { fs.writeFileSync(TRANSPARENCIA, nuevo); cambios.push('transparencia.json: revisión, lote y verificadaEl al 11/11; fecha del 11/11 donde el expediente de hoy volvió a consultar la misma fuente (comprobaciones y títulos de los puntos); mínimos cortos de las 11 de Brickwise y de Switzerlend'); }

console.log(cambios.length ? cambios.map(c => '· ' + c).join('\n') : 'Nada que cambiar: ya estaba hecho.');
const viejas = fechas.filter(f => f.consultadaEl !== FECHA);
console.log(`Comprobaciones de transparencia al 11/11: ${fechas.length - viejas.length} de ${fechas.length}.` +
  (viejas.length ? ' Con su fecha anterior:\n' + viejas.map(f => `  · ${f.slug} · ${f.comprobacion}: ${f.consultadaEl} (la dirección ${f.url} no aparece entre las consultas de hoy del expediente)`).join('\n') : ''));
const puntosViejos = puntos.filter(p => !p.expediente);
console.log(`Títulos de puntos fuertes con fecha de consulta: ${puntos.length - puntosViejos.length} de ${puntos.length} pasan al 11/11.` +
  (puntosViejos.length ? ' Se quedan:\n' + puntosViejos.map(p => `  · ${p.slug}: ${p.titulo}`).join('\n') : ''));
console.log('Mínimos cortos de Brickwise: ' + Object.keys(BRICKWISE).map(s => `${s} «${valida.ofertas[s].minimoCorto}»`).join(', '));
console.log(`Mínimo corto de Switzerlend: «${valida.ofertas.switzerlend.minimoCorto}»`);
console.log('Siguiente: node rwadar-editorial-source/ofertas/transparencia.mjs && node rwadar-fichas.js && npm test');

// Entrega «2026-11-10» · lo que cambia en el repositorio DESPUÉS de aplicar el SQL en Supabase y de
// sincronizar (`node rwadar-app/sincronizar.js`). Sin red: solo lee y escribe archivos del repositorio.
//
//   1. Comprueba que el catálogo sincronizado es la revisión nueva: 25 plataformas y 22 ofertas, todas
//      verificadas el 10/11. Si no, no toca nada (la web nunca enseña una fecha que el catálogo en
//      línea aún no tiene).
//   2. rwadar-editorial-source/ofertas/transparencia.json (textos cortos y dos comprobaciones de la tarjeta):
//      - revisión, lote, revisadoEl y verificadaEl de las 22 ofertas, al 10/11;
//      - consultadaEl de «supervisada» y «documentoEspana» al 10/11 SOLO donde el expediente de hoy volvió
//        a consultar esa misma fuente (registros, documentos, afirmaciones o avisos del expediente); si
//        no, se deja la fecha vieja y se dice;
//      - Hausera, «documentoEspana»: el motivo del 05/11 hablaba de Alicante 2 («su ficha pide iniciar
//        sesión») y ya no es cierto. Se reescribe con el motivo nuevo de DECISIONES §1 (correcciones SQL-2,
//        C2 y O2 de la revisión de la entrega): documento de emisión de Alicante 3, consultado hoy;
//      - mínimos cortos nuevos de Brickwise (las 11 de reventa), Hausera y Switzerlend (corrección C1), y
//        salida corta de Hausera (correcciones C3 y O1), comprobados contra el texto largo del catálogo (es
//        lo que enseña la tarjeta de la web y de la app);
//      - la fecha del título de los puntos fuertes cuya fuente volvió a consultar hoy el expediente.
//   El archivo se valida con transparencia.mjs (cargarTransparencia) antes de escribirlo.
//
// Se puede repetir: si ya está hecho, no cambia nada.
//
//   node rwadar-app/data/verificaciones/2026-11-10-v2/despues-de-aplicar.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../../../..');
const require = createRequire(import.meta.url);
const { leerBloquesCatalogo } = require(path.join(ROOT, 'rwadar-fichas.js'));
const { cargarTransparencia, FUENTE: TRANSPARENCIA } = await import(path.join(ROOT, 'rwadar-editorial-source/ofertas/transparencia.mjs'));
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const ETIQUETA = '2026-11-10', FECHA = '2026-11-10', FES = '10/11/2026', CORTA = '10/11';
const revision = leer(path.join(ROOT, `rwadar-app/data/importaciones/catalogo-${ETIQUETA}-v2/revision.json`));

// 1 · el catálogo sincronizado es el de la entrega
const snap = leerBloquesCatalogo(fs.readFileSync(path.join(ROOT, 'rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8'));
assert.deepEqual([...new Set([...snap.plataformas, ...snap.ofertas].map(x => x.revisionId))], [revision.revisionId],
  `el catálogo sincronizado no es la revisión ${revision.revisionId}: aplica antes el SQL y ejecuta node rwadar-app/sincronizar.js`);
assert.equal(snap.plataformas.length, revision.plataformas);
assert.equal(snap.ofertas.length, revision.ofertas);
assert.ok(snap.ofertas.every(o => o.verificadaEl === FECHA), 'las ofertas sincronizadas no están verificadas el 10/11');

// 2 · transparencia.json
const texto = fs.readFileSync(TRANSPARENCIA, 'utf8');
const t = JSON.parse(texto);
assert.equal(JSON.stringify(t, null, 2) + '\n', texto, 'formato de transparencia.json inesperado');
assert.deepEqual(Object.keys(t.ofertas).sort(), snap.ofertas.map(o => o.slug).sort(), 'transparencia.json no tiene las 22 ofertas');
t.lote = ETIQUETA; t.revisionCatalogo = revision.revisionId; t.revisadoEl = FECHA;

// ¿Volvió a consultar hoy el expediente esta misma fuente? Se compara la dirección sin «www.», sin
// «.aspx», sin mayúsculas en la ruta y sin los parámetros de idioma o de pestaña (lang, vista).
const normal = u => { try { const x = new URL(u);
  const q = [...x.searchParams].filter(([k]) => !['lang', 'vista'].includes(k.toLowerCase())).map(([k, v]) => `${k.toLowerCase()}=${v}`).sort().join('&');
  return `${x.hostname.replace(/^www\./, '')}${x.pathname.replace(/\.aspx$/i, '').replace(/\/$/, '').toLowerCase()}?${q}`; } catch { return null; } };
const URLS = /https:\/\/[^\s"'«»)<>,]+/g;
const consultasDeHoy = slug => {
  const e = leer(path.join(DIR, 'expedientes', `${slug}.json`)), m = new Map();
  assert.ok(e.consulta.inicioUtc.startsWith(FECHA), `${slug}: expediente de hoy`);
  const toma = (lista, campo, nombre) => (lista || []).forEach((x, i) => { for (const u of String(x?.[campo] || '').match(URLS) || []) {
    const n = normal(u); if (n && !m.has(n)) m.set(n, `${nombre}[${i}]`); } });
  toma(e.registros, 'url', 'registros'); toma(e.documentos, 'url', 'documentos');
  toma(e.advertenciasReguladores, 'url', 'advertenciasReguladores'); toma(e.claims, 'fuentePrimaria', 'claims');
  toma(e.avisosConFecha, 'fuente', 'avisosConFecha'); toma(e.revisionAvisos, 'fuente', 'revisionAvisos');
  toma(e.cambiosRespectoPublicado, 'fuente', 'cambiosRespectoPublicado');
  return m;
};
// Hausera, «documentoEspana»: el motivo del 05/11 («Alicante 2 no tiene documento de emisión público: su ficha
// pide iniciar sesión…») ya no es cierto. Motivo nuevo de DECISIONES §1 (correcciones SQL-2, C2 y O2 de la
// revisión de la entrega). Sigue sin cumplirse: no es un folleto ni un KID. Solo se reescribe si está el de
// partida (o ya el nuevo); la portada y el conflicto 50 % / 70 % se exigen en el expediente de hoy. El motivo no
// lleva las cifras: transparencia.mjs no admite «%» en estos textos y DECISIONES no publica ese mínimo.
const HAUSERA = 'hausera-proximas-ofertas';
const DOC_HAUSERA_ANTES = {
  cumple: false,
  motivo: 'Alicante 2 no tiene documento de emisión público: su ficha pide iniciar sesión y no hay folleto ni ficha informativa.',
  fuente: { titulo: 'Hausera · ficha de Alicante 2 (redirige al inicio de sesión)', url: 'https://hausera.io/propiedad/alicante_2/' },
  consultadaEl: '2026-11-05',
};
const DOC_HAUSERA = {
  cumple: false,
  motivo: 'El documento de emisión de Alicante 3 es público, pero no es un folleto ni un KID: la CNMV no lo ha revisado y el 10/11/2026 la emisión aún no estaba inscrita. Además, sus documentos no coinciden en cuánto hay que colocar para que la emisión siga adelante.',
  fuente: { titulo: 'Hausera · documento de emisión de Alicante 3 (portada: «no es considerado un folleto informativo»)', url: 'https://drive.google.com/file/d/1cpWVN3J_Y1xdRDAxUzGnjmWXB-eTODH_' },
  consultadaEl: FECHA,
};
assert.ok([DOC_HAUSERA_ANTES, DOC_HAUSERA].some(x => isDeepStrictEqual(t.ofertas[HAUSERA].documentoEspana, x)), 'Hausera: documentoEspana de partida');
{
  const e = JSON.stringify(leer(path.join(DIR, 'expedientes', `${HAUSERA}.json`)));
  assert.ok(e.includes('El presente documento no es considerado un folleto informativo'), 'Hausera: portada del documento de emisión en el expediente');
  assert.ok(e.includes('Mínimo de la emisión de Alicante 3: 50 %') && e.includes('frente a 70 %'), 'Hausera: conflicto 50 % / 70 % en el expediente');
  assert.ok(e.includes('aún no están inscritas en el registro ERIR de la CNMV el 10/11/2026'), 'Hausera: sin inscribir el 10/11 según el expediente');
}
t.ofertas[HAUSERA].documentoEspana = structuredClone(DOC_HAUSERA);
const fechas = [];
for (const [slug, o] of Object.entries(t.ofertas)) {
  o.verificadaEl = FECHA;
  const hoy = consultasDeHoy(slug);
  for (const k of ['supervisada', 'documentoEspana']) {
    const donde = hoy.get(normal(o[k].fuente.url));
    if (donde) o[k].consultadaEl = FECHA;
    fechas.push({ slug, comprobacion: k, url: o[k].fuente.url, consultadaEl: o[k].consultadaEl, expediente: donde || null });
  }
  // Puntos fuertes: la fecha de consulta del título (la del 05/11), solo si el expediente de hoy volvió a
  // consultar esa fuente. Las fechas de un documento (p. ej. «KID … (01/09/2026)») no se tocan.
  for (const p of o.puntos) if (/\(05\/11\/2026\)$/.test(p.fuente.titulo) && hoy.has(normal(p.fuente.url)))
    p.fuente.titulo = p.fuente.titulo.replace(/\(05\/11\/2026\)$/, `(${FES})`);
}
assert.ok(fechas.some(f => f.slug === HAUSERA && f.comprobacion === 'documentoEspana' && f.expediente && f.consultadaEl === FECHA),
  'Hausera: el expediente de hoy consultó el documento de emisión de Alicante 3');

// Mínimos cortos (máximo 40 caracteres), con el dato de hoy: los 11 de Brickwise (tabla de DECISIONES), Hausera y
// Switzerlend (corrección C1: la ficha dice «el 10/11» y la tarjeta no puede decir «05/11»).
const BRICKWISE = {
  'apartamento-vacacional-hinterstoder-50': '75', 'vivienda-schwarzer-weg-18-graz': '65', 'vivienda-stallhofstra-e-28-gratwein': '68,80',
  'drautalresidenz-paternion': '70', 'fotovoltaica-cohotel': '110', 'fotovoltaica-greenpoint': '100', 'randhartingergasse-9-viena': '78',
  'local-de-estanco-klagenfurt': '95', 'vivienda-pluddemanngasse-101-graz': '75', 'vivienda-pottendorfer-stra-e-62-wr-neustadt': '74',
  'vivienda-sonnleithnergasse-2-viena': '75',
};
const snapPor = new Map(snap.ofertas.map(o => [o.slug, o]));
const tarjeta = (slug, etiqueta) => (snapPor.get(slug).documentacion?.referencias || []).find(r => r.etiqueta === etiqueta && r.fechaConsulta === FECHA)?.valor;
for (const [slug, precio] of Object.entries(BRICKWISE)) {
  assert.equal(tarjeta(slug, 'Mínimo de inversión'), `Desde ${precio} € la participación en reventa (${CORTA})`, `${slug}: mínimo del catálogo`);
  const hecho = `Desde ${precio} € la participación (${CORTA})`;
  assert.ok(/^Desde [\d,]+ € la participación \(05\/11\)$/.test(t.ofertas[slug].minimoCorto) || t.ofertas[slug].minimoCorto === hecho,
    `${slug}: mínimo corto de partida («${t.ofertas[slug].minimoCorto}»)`);
  t.ofertas[slug].minimoCorto = hecho;
}
assert.equal(tarjeta('hausera-proximas-ofertas', 'Mínimo de inversión'), 'Desde 100 € en Alicante 3, según su documento de emisión (10/11); la preventa abre el 18/11.');
assert.ok(['100 € según la FAQ de Hausera', 'Desde 100 € en Alicante 3 (10/11)'].includes(t.ofertas['hausera-proximas-ofertas'].minimoCorto), 'Hausera: mínimo corto de partida');
t.ofertas['hausera-proximas-ofertas'].minimoCorto = 'Desde 100 € en Alicante 3 (10/11)';
assert.equal(tarjeta('switzerlend', 'Mínimo de inversión'), '1 acción (68,01 CHF el 10/11)');
assert.ok(['1 acción (68,01 CHF, 05/11)', '1 acción (68,01 CHF, 10/11)'].includes(t.ofertas.switzerlend.minimoCorto), 'Switzerlend: mínimo corto de partida');
t.ofertas.switzerlend.minimoCorto = '1 acción (68,01 CHF, 10/11)';
// Salida corta de Hausera (correcciones C3 y O1): sin ella, «Lo esencial» recorta la salida a 40 caracteres
// («Cobras cuando se venden las viviendas…») y pierde «sin fecha cierta» y «sin mercado secundario».
assert.equal(tarjeta(HAUSERA, 'Salida'), 'Cobras cuando se venden las viviendas (previsto en 20 meses, sin fecha cierta); sin mercado secundario garantizado.');
assert.ok([null, 'Al vender las viviendas, sin fecha fija'].includes(t.ofertas[HAUSERA].salidaCorta), 'Hausera: salida corta de partida');
t.ofertas[HAUSERA].salidaCorta = 'Al vender las viviendas, sin fecha fija';

// Solo cambian de fecha los puntos del mercado de reventa de Brickwise (el resto de títulos, igual).
{
  const antes = JSON.parse(texto).ofertas, titulos = o => o.puntos.map(p => p.fuente.titulo);
  for (const [slug, o] of Object.entries(t.ofertas)) titulos(o).forEach((x, i) => {
    const a = titulos(antes[slug])[i];
    assert.ok(x === a || (a === 'Brickwise · mercado de reventa en la app (05/11/2026)' && x === `Brickwise · mercado de reventa en la app (${FES})`)
      || (a === x.replace(FES, '05/11/2026') && x.endsWith(`(${FES})`) && slug in BRICKWISE), `${slug}: título de punto «${a}» → «${x}»`);
  });
}
// Valida con las reglas de la web y de la app (transparencia.mjs) antes de escribir.
const valida = cargarTransparencia({ raiz: ROOT, datos: t });
assert.deepEqual(valida.sinEntrada, []); assert.equal(valida.avisoRevision, '');
// El mínimo corto de reventa es lo que lee el inversor en la tarjeta (web y app): mismo precio que el
// texto largo del catálogo, «la participación» y 40 caracteres como mucho.
const deBrickwise = snap.ofertas.filter(x => x.coleccion === 'secundario' && x.plataformaSlug === 'brickwise');
assert.deepEqual(deBrickwise.map(o => o.slug).sort(), Object.keys(BRICKWISE).sort());
for (const o of deBrickwise) {
  const corto = valida.ofertas[o.slug].minimoCorto, largo = tarjeta(o.slug, 'Mínimo de inversión');
  const precio = (largo || '').match(/^Desde ([\d.,]+) € la participación en reventa \(10\/11\)$/)?.[1];
  assert.ok(precio, `${o.slug}: mínimo largo del catálogo inesperado («${largo}»)`);
  assert.equal(corto, `Desde ${precio} € la participación (10/11)`, `${o.slug}: mínimo corto de la tarjeta`);
  assert.ok(corto.length <= 40, `${o.slug}: el mínimo corto pasa de 40 caracteres`);
}
assert.ok(valida.ofertas['hausera-proximas-ofertas'].minimoCorto.length <= 40);
assert.ok(valida.ofertas[HAUSERA].salidaCorta.length <= 40 && valida.ofertas.switzerlend.minimoCorto.length <= 40);
assert.deepEqual(valida.ofertas[HAUSERA].documentoEspana, DOC_HAUSERA, 'Hausera: documentoEspana validado');
for (const [slug, o] of Object.entries(valida.ofertas)) {
  assert.ok(!/^Desde .* en reventa/.test(o.minimoCorto || '') || / la participación /.test(o.minimoCorto), `${slug}: mínimo de reventa sin «la participación»`);
  assert.equal(o.verificadaEl, FECHA);
}
const nuevo = JSON.stringify(t, null, 2) + '\n';
const cambios = [];
if (nuevo !== texto) { fs.writeFileSync(TRANSPARENCIA, nuevo); cambios.push('transparencia.json: revisión, lote, fechas del 10/11, motivo nuevo de «documentoEspana» de Hausera, mínimos cortos de Brickwise, Hausera y Switzerlend, salida corta de Hausera y fecha de los puntos con fuente consultada hoy'); }

console.log(cambios.length ? cambios.map(c => '· ' + c).join('\n') : 'Nada que cambiar: ya estaba hecho.');
const viejas = fechas.filter(f => f.consultadaEl !== FECHA);
console.log(`Comprobaciones de transparencia al 10/11: ${fechas.length - viejas.length} de ${fechas.length}.` +
  (viejas.length ? ' Con su fecha anterior:\n' + viejas.map(f => `  · ${f.slug} · ${f.comprobacion}: ${f.consultadaEl} (la dirección ${f.url} no aparece entera entre las consultas del expediente de hoy)`).join('\n') : ''));
console.log('Siguiente: node rwadar-editorial-source/ofertas/transparencia.mjs && node rwadar-fichas.js && npm test');

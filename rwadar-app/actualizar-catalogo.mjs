// Renueva el catálogo con una sola orden: lee de nuevo todas las fuentes y
// todas las ofertas, comprueba el radar, pone al día cada ficha con lo que se
// lee hoy en su fuente oficial, monta el lote y lo prueba en PGlite. No toca
// Supabase ni publica nada: deja el SQL listo para pegar y un informe.
//
// Uso: node rwadar-app/actualizar-catalogo.mjs [--fecha=AAAA-MM-DD] [--capturas=archivo.json] [--sin-capturar]
//
// Reglas que aplica sola (las de docs/tareas/REVISION-CATALOGO-2026-10-19.md):
// - Una fuente del radar que no carga o que ya no dice lo que respalda
//   (data/comprobaciones-fuentes.json) para la revisión: no se monta nada y el
//   informe dice cuál revisar a mano.
// - Una cifra solo se renueva si se lee hoy en la fuente oficial; si no, la
//   ficha pasa a «no verificable», pierde la cifra y lleva un aviso.
// - Los avisos con datos del día se rehacen; los que no se pueden volver a
//   comprobar no se conservan con fecha nueva.
// Salida: data/verificaciones/<fecha>-v2/{cambios,contraste,informe}-<fecha>.*
// y, si todo cuadra, el lote de montar-revision.mjs. Código 0 si el lote queda
// listo; 2 si hay que revisar algo a mano antes de montarlo.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const APP = path.dirname(fileURLToPath(import.meta.url));
const VERIF = path.join(APP, 'data', 'verificaciones');
const IMPORT = path.join(APP, 'data', 'importaciones');
const arg = nombre => (process.argv.find(a => a.startsWith(`--${nombre}=`)) || '').split('=').slice(1).join('=');
const hayBandera = nombre => process.argv.includes(`--${nombre}`);

const hoyEspana = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());
const FECHA = arg('fecha') || hoyEspana();
assert.match(FECHA, /^\d{4}-\d{2}-\d{2}$/);
const anteriores = fs.readdirSync(IMPORT).map(d => d.match(/^catalogo-(\d{4}-\d{2}-\d{2})-v2$/)?.[1])
  .filter(f => f && f < FECHA && fs.existsSync(path.join(VERIF, `${f}-v2`, 'escaparate-publicacion.json'))).sort();
const DESDE = anteriores.at(-1);
assert.ok(DESDE, 'no hay ninguna revisión anterior de la que partir');
const fES = iso => iso.split('-').reverse().join('/');
const FES = fES(FECHA);

// ---------------------------------------------------------------- 1 · capturar
const CAPTURAS = path.resolve(arg('capturas') || path.join(os.tmpdir(), `rwadar-capturas-${FECHA}.json`));
if (!hayBandera('sin-capturar')) {
  console.log(`1/5 · Leyendo de nuevo las fuentes de la revisión del ${fES(DESDE)}…`);
  execFileSync(process.execPath, [path.join(APP, 'capturar-fuentes.mjs'), DESDE, CAPTURAS], { stdio: 'inherit' });
}
let CAP = JSON.parse(fs.readFileSync(CAPTURAS, 'utf8'));
const BLOQUEO = /^(Un momento|Just a moment|Attention Required|Access denied)/i;
const captura = url => CAP[url] || CAP[url.replace(/\/$/, '')] || CAP[url + '/'];
const legible = r => !!r && (r.texto || '').length > 100 && !BLOQUEO.test(r.titulo || '') &&
  !(typeof r.estado === 'number' && r.estado >= 400);
// Los espacios irrompibles (Brickwise: «ab €\u00a080,00») cuentan como espacios normales.
const plano = url => { const r = captura(url); return legible(r) ? `${r.titulo || ''} ${r.texto}`.replace(/[\s\u00a0\u202f]+/g, ' ') : ''; };
const lineas = url => { const r = captura(url); return legible(r)
  ? r.texto.split('\n').map(l => l.replace(/[\u00a0\u202f]/g, ' ').replace(/ +/g, ' ').trim()).filter(Boolean) : []; };

// ---------------------------------------------------------------- utilidades
const leer = (carpeta, archivo) => JSON.parse(fs.readFileSync(path.join(VERIF, carpeta, archivo), 'utf8'));
const radar = leer(`${DESDE}-v2`, 'radar-canonico-26.json');
const esc = Object.fromEntries(leer(`${DESDE}-v2`, 'escaparate-publicacion.json').ofertas.map(o => [o.slug, o]));
const doc = leer(`${DESDE}-v2`, 'documentacion-ofertas.json');
const COMPROBACIONES = JSON.parse(fs.readFileSync(path.join(APP, 'data', 'comprobaciones-fuentes.json'), 'utf8')).fuentes;

const numES = (n, dec = 2) => new Intl.NumberFormat('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec,
  useGrouping: 'always' }).format(n);
const entero = texto => Number(String(texto).replace(/[’'.\s]/g, ''));
const MESES = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const fechaIngles = t => { const [d, m, a] = t.split(' '); return `${String(d).padStart(2, '0')}/${String(MESES[m]).padStart(2, '0')}/${a}`; };
const fechaPuntos = t => t.split('.').map((x, i) => i < 2 ? x.padStart(2, '0') : x).join('/');
const ALC = `Visto en la fuente oficial el ${FES}. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.`;
const ref = (etiqueta, valor, fuente, alcance = ALC) =>
  ({ etiqueta: `${etiqueta} · ${FES}`, valor, fechaDato: null, fechaConsulta: FECHA, fuente, alcance });
const aviso = (texto, tono = 'warn') => ({ texto, tono });
// Aviso general de todas las fichas (redacción en producción desde el 11/10/2026).
const GEN = 'Referencia editorial gratuita. El proveedor comprueba admisión, condiciones y riesgos; RWAdar no recibe dinero de inversiones.';
const GEN_ANTERIOR = 'Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.';
// Avisos que dependen de datos del día: se rehacen o se quitan, nunca se re-fechan.
const DINAMICO = /\d{2}\/\d{2}\/\d{4}|agotada|precio de emisión|MINTING|No se pudo|campaña|preventa|^Hoy |inversión directa del emisor|acuerdo de registro|activo subyacente|abierta solo hasta|P2P de Reental no mostraba|no aparecía|no se mostraba|no mostraba la cifra|no coinciden en la fecha/i;

const fichas = {};      // slug -> entrada de cambios
const contraste = {};   // slug -> lo leído
const informe = { cifras: [], avisos: [], sinComprobar: [], notas: [] };
const ficha = slug => (fichas[slug] ??= { cambios: {}, referencias: [] });
const estaticos = slug => esc[slug].avisos.filter(a => !DINAMICO.test(a.texto))
  .map(({ texto, tono }) => ({ texto: texto === GEN_ANTERIOR ? GEN : texto, tono }));
function ponerAvisos(slug, dinamicos) {
  const lista = estaticos(slug);
  if (!lista.some(a => a.texto === GEN)) lista.unshift(aviso(GEN));
  ficha(slug).cambios.avisos = [...lista, ...dinamicos];
  for (const a of dinamicos) informe.avisos.push(`${esc[slug].titulo}: ${a.texto}`);
}
function ponerReferencias(slug, nuevas) {
  if (!nuevas.length) return;
  // Las referencias automáticas de revisiones anteriores se sustituyen por las de hoy.
  ficha(slug).documentacion = { ...(ficha(slug).documentacion || {}),
    referencias: doc[slug].referencias.filter(r => !r.alcance.startsWith('Visto en la fuente oficial el ')) };
  ficha(slug).referencias.push(...nuevas);
}
function sinCifra(slug, motivo) {
  const o = esc[slug];
  Object.assign(ficha(slug).cambios, { estadoRevision: 'no_verificable', rentabilidad: null, precio: null,
    metricas: o.metricas.filter(m => m.etiqueta === 'Moneda') });
  if (o.rentabilidad) informe.cifras.push(`${o.titulo}: ${o.rentabilidad.mostrada} → sin cifra (${motivo})`);
  informe.sinComprobar.push(`${o.titulo}: ${motivo}`);
}

// ---------------------------------------------------------------- 2 · radar
console.log('2/5 · Comprobando las fuentes del radar…');
const cumple = f => { const texto = plano(f.url); return !!texto && (COMPROBACIONES[f.id] || ['$^']).every(p => new RegExp(p, 'i').test(texto)); };
// Las webs fallan a ratos (Cloudflare, SPA que no termina de pintar): un segundo intento antes de rendirse.
const reintentar = [...new Set(radar.fuentes.filter(f => !cumple(f)).map(f => f.url))];
if (reintentar.length && !hayBandera('sin-capturar')) {
  console.log(`   Reintentando ${reintentar.length} fuente(s) dentro de 30 s: ${reintentar.join(' ')}`);
  await new Promise(resolve => setTimeout(resolve, 30000));
  execFileSync(process.execPath, [path.join(APP, 'capturar-fuentes.mjs'), DESDE, CAPTURAS, `--solo=${reintentar.join(',')}`], { stdio: 'inherit' });
  CAP = JSON.parse(fs.readFileSync(CAPTURAS, 'utf8'));
}
const radarContraste = [];
const bloqueos = [];
for (const f of radar.fuentes) {
  const r = captura(f.url);
  const texto = plano(f.url);
  const patrones = COMPROBACIONES[f.id];
  const entrada = { id: f.id, url: f.url, estado: r?.estado ?? r?.error ?? 'sin captura', metodo: r?.metodo || 'navegador' };
  if (!patrones) { bloqueos.push(`${f.id}: no tiene comprobaciones en comprobaciones-fuentes.json`); entrada.ok = false; }
  else if (!texto) { bloqueos.push(`${f.id}: no se pudo leer ${f.url} (${entrada.estado})`); entrada.ok = false; }
  else {
    entrada.literales = [];
    entrada.faltan = [];
    for (const p of patrones) {
      const m = texto.match(new RegExp(p, 'i'));
      if (m) entrada.literales.push(texto.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40));
      else entrada.faltan.push(p);
    }
    entrada.ok = !entrada.faltan.length;
    if (!entrada.ok) bloqueos.push(`${f.id}: ${f.url} ya no dice «${entrada.faltan.join('», «')}»`);
  }
  radarContraste.push(entrada);
}

// ---------------------------------------------------------------- 3 · fichas
console.log('3/5 · Poniendo al día las 49 fichas…');

// Brickwise: tarjetas de la app (hora de España) y API pública de la app.
const APP_BW = 'https://app.brickwise.at/desktopWeb/marketplace';
const API_BW = 'https://api.app.brickwise.at/api/v2/assets';
const WEB_BW = 'https://www.brickwise.at/marketplace';
const TARJETAS = {
  'fotovoltaica-greenpoint': 'Photovoltaik Anlage GreenPoint mit Überschussbeteiligung',
  'drautalresidenz-paternion': 'Drautalresidenz, Paternion',
  'terreno-con-arrendamiento-billa': 'Betriebsgrundstück mit langfristigem BILLA-Mietvertrag',
  'vivienda-stallhofstra-e-28-gratwein': 'Wohnung, Stallhofstraße 28, Gratwein',
  'fotovoltaica-cohotel': 'Photovoltaik Anlage Cohotel mit Überschussbeteiligung',
  'apartamento-vacacional-hinterstoder-50': 'Ferien-Appartement, Hinterstoder 50',
  'vivienda-pluddemanngasse-101-graz': 'Wohnung, Plüddemanngasse 101, Graz',
  'local-de-estanco-klagenfurt': 'Trafik, Kohldorfer Straße 102, Klagenfurt',
  'vivienda-schwarzer-weg-18-graz': 'Wohnung, Schwarzer Weg 18, Graz',
};
const ISIN_BW = { 'vivienda-sonnleithnergasse-2-viena': 'AT0000A2T4D7', 'vivienda-pottendorfer-stra-e-62-wr-neustadt': 'AT0000A324B4',
  'randhartingergasse-9-viena': 'AT0000A2ZT84', 'terreno-con-arrendamiento-billa': 'AT0000A3SE89' };
const lineasBW = lineas(APP_BW);
let apiBW = {};
try { apiBW = Object.fromEntries(JSON.parse(captura(API_BW)?.texto || '[]').map(a => [a.id, a])); } catch {}
function tarjetaBW(titulo) {
  const i = lineasBW.indexOf(titulo);
  if (i < 0) return null;
  const v = lineasBW.slice(i + 1, i + 14);
  const tras = etiqueta => { const j = v.indexOf(etiqueta); return j >= 0 ? v[j + 1] : null; };
  const t = { dist: v.find(l => /^[\d,]+ % p\.a\.$/.test(l))?.replace(' p.a.', '') };
  const precio = tras('Preis pro Anteil'); if (precio) t.precio = `desde ${precio.replace(/^ab € /, '')} EUR`;
  const minimo = tras('Mindestinvestition'); if (minimo) t.minimo = `${minimo.replace(/^€ /, '')} EUR`;
  const plazo = tras('Laufzeit:'); if (plazo) t.plazo = plazo === 'endlos' ? 'indefinido' : `hasta el ${fechaPuntos(plazo)}`;
  const proxima = tras('Erw. nächste Ausschüttung:'); if (proxima) t.proxima = fechaPuntos(proxima);
  const desde = tras('Ausschüttungen erw. ab:'); if (desde) t.desdeDist = fechaPuntos(desde);
  return t;
}
for (const slug of Object.keys(esc).filter(s => esc[s].plataformaSlug === 'brickwise')) {
  const refs = [];
  const t = TARJETAS[slug] && tarjetaBW(TARJETAS[slug]);
  const a = ISIN_BW[slug] && apiBW[ISIN_BW[slug]];
  const dinamicos = [];
  if (TARJETAS[slug]) {
    if (!t) {
      if (lineasBW.length) dinamicos.push(aviso(`El ${FES} esta participación no aparecía en el mercado público de Brickwise; confirma con el proveedor si sigue disponible.`));
      informe.sinComprobar.push(`${esc[slug].titulo}: ${lineasBW.length ? 'no aparece en el mercado de Brickwise' : 'no se pudo leer el mercado de Brickwise'}`);
    } else {
      refs.push(ref('Moneda', 'EUR', APP_BW));
      if (t.minimo) refs.push(ref('Entrada mínima', t.minimo, APP_BW));
      if (t.dist) refs.push(ref('Distribución anual esperada', t.dist, APP_BW));
      if (t.precio) refs.push(ref('Precio por participación', t.precio, APP_BW));
      if (t.plazo) refs.push(ref('Plazo', t.plazo, APP_BW));
      if (t.proxima) refs.push(ref('Próxima distribución esperada', t.proxima, APP_BW));
      if (t.desdeDist) refs.push(ref('Distribuciones esperadas desde', t.desdeDist, APP_BW));
    }
  }
  if (ISIN_BW[slug]) {
    if (!a) informe.sinComprobar.push(`${esc[slug].titulo}: no figura en la API de Brickwise (${ISIN_BW[slug]})`);
    else {
      if (!TARJETAS[slug]) refs.push(ref('Moneda', 'EUR', WEB_BW));
      if (a.rentalReturn != null && !TARJETAS[slug]) refs.push(ref('Rentabilidad por alquiler esperada (API de la app)', `${numES(a.rentalReturn)} %`, API_BW));
      refs.push(ref('Participaciones disponibles en emisión (API)', `${numES(a.availableBricks, 0)} de ${numES(a.bricks, 0)}`, API_BW));
      if (a.issuingSharePrice != null) refs.push(ref('Precio de emisión por participación (API)', `${numES(a.issuingSharePrice)} EUR`, API_BW));
      if (a.lowestOfferPrice != null) refs.push(ref('Precio más bajo en mercado secundario (API)', `${numES(a.lowestOfferPrice)} EUR`, API_BW));
      const agotada = esc[slug].avisos.some(x => /agotada/.test(x.texto));
      if (agotada && a.availableBricks === 0) dinamicos.push(aviso('La emisión primaria está agotada (0 participaciones disponibles); solo se puede comprar en el mercado secundario de Brickwise a precio de otros inversores.'));
      else if (agotada) informe.notas.push(`${esc[slug].titulo}: vuelve a tener ${a.availableBricks} participaciones en emisión; se quita el aviso de emisión agotada.`);
      if (a.issuingSharePrice && a.lowestOfferPrice && Math.abs(a.issuingSharePrice - a.lowestOfferPrice) / a.issuingSharePrice > 0.1)
        dinamicos.push(aviso(`El precio de emisión (${numES(a.issuingSharePrice)} €) y el precio más bajo del mercado secundario (${numES(a.lowestOfferPrice)} €) son muy distintos; comprueba en la app a qué precio compras realmente.`));
    }
  }
  if (slug === 'terreno-con-arrendamiento-billa' && t?.minimo && a?.issuingSharePrice != null) {
    ficha(slug).documentacion = { ...(ficha(slug).documentacion || {}), caracteristicas: doc[slug].caracteristicas.map(c => c.etiqueta !== 'Entrada mínima' ? c
      : { ...c, valor: `Precio por participación y suscripción mínima son distintos: el ${FES} la app de Brickwise pedía una inversión mínima de ${t.minimo} y su API daba ${numES(a.issuingSharePrice)} EUR como precio de emisión por participación.` }) };
  }
  ponerReferencias(slug, refs);
  ponerAvisos(slug, dinamicos);
  contraste[slug] = { tarjeta: t, api: a ? { rentalReturn: a.rentalReturn, bricks: a.bricks, availableBricks: a.availableBricks,
    issuingSharePrice: a.issuingSharePrice, lowestOfferPrice: a.lowestOfferPrice, stage: a.stage } : null };
}

// Midas: el APY solo cuenta si se lee en la página del producto.
const APY_7_DIAS = new Set(['mf-one', 'mtbill']);
const LLMS_MIDAS = 'https://midas.app/llms.txt';
const indiceMidas = (captura(LLMS_MIDAS)?.estado === 200 && captura(LLMS_MIDAS).texto) || '';
const enIndiceMidas = titulo => indiceMidas.match(new RegExp(`^- \\[${titulo.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')}\\]\\([^)]*\\): (.+)$`, 'm'))?.[1];
const NO_MIDAS = `No se pudo comprobar en la fuente oficial el ${FES}: Midas bloquea las consultas automáticas desde fuera de un navegador de uso normal.`;
for (const slug of Object.keys(esc).filter(s => esc[s].plataformaSlug === 'midas')) {
  const o = esc[slug];
  const t = plano(o.url);
  const producto = t.slice(Math.max(0, t.indexOf('BACK TO PRODUCTS')));
  const historico = (o.avisos.map(a => a.texto.match(/El \d{2}\/\d{2}\/\d{4} la página indicaba[^]*$/)?.[0]).find(Boolean)) || '';
  const lectura = {};
  if (t) {
    // mGLO y mGLOBAL pintan ahí el rendimiento de un mes («7.01% August 1-31»), no el de 7 días.
    const apy = producto.match(/APY\s*1?\s*7D\s*30D\s*([\d.]+)\s*%\s*(\w+)?/);
    if (apy && !/^(January|February|March|April|May|June|July|August|September|October|November|December)$/.test(apy[2] || '')) lectura.apy7 = apy[1];
    lectura.tvl = producto.match(/TVL \$([\d.]+)M/)?.[1];
    lectura.precio = producto.match(/PRICE \$([\d.]+)/)?.[1];
    lectura.gestion = producto.match(/MANAGEMENT ([\d.]+% annual on AUM)/)?.[1];
    lectura.exito = producto.match(/PERFORMANCE ([\d.]+%)/)?.[1];
    lectura.mintingCerrado = /MINTING CLOSED/i.test(producto);
    lectura.listaBlanca = /whitelisted addresses/i.test(producto);
  }
  contraste[slug] = { legible: !!t, ...lectura };
  const refs = [];
  const descripcion = enIndiceMidas(o.titulo);
  contraste[slug].enIndice = !!descripcion;
  if (descripcion) refs.push(ref('Descripción en el índice oficial de productos', `«${descripcion}»`, LLMS_MIDAS,
    `Texto visto en el índice oficial de productos de Midas el ${FES}. No acredita apertura, rendimiento ni elegibilidad.`));
  else informe.notas.push(`${o.titulo}: ya no aparece en el índice oficial de productos de Midas (${LLMS_MIDAS}).`);
  if (lectura.tvl) refs.push(ref('TVL', `${numES(Number(lectura.tvl))} M USD`, o.url));
  if (lectura.precio) refs.push(ref('Precio del token', `${numES(Number(lectura.precio), 4)} USD`, o.url));
  if (lectura.gestion) refs.push(ref('Comisión de gestión', lectura.gestion.replace('annual on AUM', 'anual sobre AUM').replace('.', ','), o.url));
  if (lectura.exito) refs.push(ref('Comisión de éxito', lectura.exito.replace('.', ','), o.url));
  const dinamicos = [];
  if (lectura.apy7 && APY_7_DIAS.has(slug)) {
    const mostrada = `${numES(Number(lectura.apy7))} %`;
    Object.assign(ficha(slug), { cifras: 'comprobadas' });
    Object.assign(ficha(slug).cambios, { estadoRevision: 'actual',
      rentabilidad: { mostrada, literal: 'APY ilustrativo de los últimos siete días; variable y no garantizado.' },
      metricas: [{ etiqueta: 'Moneda', valor: 'USD' }, { etiqueta: 'APY publicado · 7 días', valor: mostrada }] });
    refs.unshift(ref('APY publicado · 7 días', mostrada, o.url));
    informe.cifras.push(`${o.titulo}: ${o.rentabilidad?.mostrada || 'sin cifra'} → ${mostrada}`);
  } else if (t && (lectura.tvl || lectura.precio || lectura.mintingCerrado)) {
    if (o.rentabilidad || /APY publicado/.test(JSON.stringify(o.metricas))) sinCifra(slug, `la página se lee pero no muestra el APY`);
    else Object.assign(ficha(slug).cambios, { estadoRevision: 'actual', metricas: [{ etiqueta: 'Moneda', valor: o.moneda || 'USD' }] });
    if (lectura.mintingCerrado) dinamicos.push(aviso(`El ${FES} la página mostraba «MINTING CLOSED»: ahora no se pueden suscribir tokens nuevos.`));
    if (lectura.listaBlanca) dinamicos.push(aviso('Invertir, reembolsar y transferir solo está disponible para direcciones en lista blanca.'));
    if (o.rentabilidad || /APY publicado/.test(JSON.stringify(o.metricas))) dinamicos.push(aviso(`El ${FES} la página no mostraba la cifra de APY, así que RWAdar no publica rendimiento hasta poder leerlo en la fuente oficial.`));
  } else if (o.coleccion === 'en_camino') {
    const anuncio = plano('https://midas.app/products').match(/Introducing mGLOeuro[^.]*\./)?.[0];
    if (anuncio) refs.push(ref('Anuncio en la página de productos', `«${anuncio}»`, 'https://midas.app/products',
      `Texto visto en la página oficial de productos de Midas el ${FES}. No acredita apertura, rendimiento ni elegibilidad.`));
    dinamicos.push(aviso(`No se pudo abrir su página el ${FES} (Midas bloquea las consultas automáticas)${anuncio || descripcion ? '; solo se comprobó que Midas lo sigue anunciando' : ''}.`));
    informe.sinComprobar.push(`${o.titulo}: página bloqueada por Midas`);
  } else {
    if (o.rentabilidad || o.estadoRevision === 'actual') sinCifra(slug, 'Midas bloquea la consulta');
    else informe.sinComprobar.push(`${o.titulo}: Midas bloquea la consulta`);
    dinamicos.push(aviso(`${NO_MIDAS}${historico ? ' ' + historico : ''}${o.rentabilidad || /APY/.test(o.resumen) ? ' RWAdar no publica su rendimiento hasta poder leerlo allí.' : ''}`));
  }
  ponerReferencias(slug, refs);
  ponerAvisos(slug, dinamicos);
}

// Spiko: datos públicos del fondo.
{
  const slug = 'spiko-letras-del-tesoro-euro', D = 'https://data.spiko.io/eutbl/';
  const t = plano(D);
  const l = { r30: t.match(/30D YIELD ([\d.]+)%/)?.[1], nav: t.match(/LATEST NAV ([\d.]+) (\d{4}-\d{2}-\d{2})/),
    aum: t.match(/AUM €([\d.]+)M/)?.[1], minimo: t.match(/MINIMUM INITIAL SUBSCRIPTION ([\d.]+) EUR/)?.[1],
    comision: t.match(/MANAGEMENT FEES ([\d.]+)%/)?.[1] };
  contraste[slug] = { ...l, nav: l.nav?.slice(1) };
  if (l.r30) {
    const mostrada = `${numES(Number(l.r30))} %`;
    fichas[slug] = { ...ficha(slug), cifras: 'comprobadas' };
    Object.assign(ficha(slug).cambios, { estadoRevision: 'actual',
      rentabilidad: { mostrada, literal: `Rendimiento anualizado a 30 días observado el ${FES}; variable y no garantizado.` },
      metricas: [{ etiqueta: 'Moneda', valor: 'EUR' }, ...(l.minimo ? [{ etiqueta: 'Suscripción inicial publicada', valor: `${l.minimo} EUR` }] : []),
        { etiqueta: 'Rendimiento publicado · 30 días', valor: mostrada }] });
    if (esc[slug].rentabilidad?.mostrada !== mostrada) informe.cifras.push(`Spiko Letras del Tesoro Euro: ${esc[slug].rentabilidad?.mostrada || 'sin cifra'} → ${mostrada}`);
    ponerReferencias(slug, [ref('Rendimiento publicado · 30 días', mostrada, D),
      ...(l.minimo ? [ref('Suscripción inicial publicada', `${l.minimo} EUR`, D)] : []), ref('Moneda', 'EUR', D),
      ...(l.comision ? [ref('Comisión de gestión', `${numES(Number(l.comision))} %`, D)] : []),
      ...(l.nav ? [ref('Valor liquidativo', `${numES(Number(l.nav[1]), 4)} EUR (${fES(l.nav[2])})`, D)] : []),
      ...(l.aum ? [ref('Patrimonio gestionado', `${numES(Number(l.aum))} M EUR`, D)] : [])]);
    ponerAvisos(slug, []);
  } else {
    sinCifra(slug, 'no se pudo leer el rendimiento en data.spiko.io');
    ponerAvisos(slug, [aviso(`No se pudo comprobar el rendimiento en la fuente oficial el ${FES}.`)]);
  }
}

// Prosegur Digital Gold: condiciones publicadas en su tabla comparativa.
{
  const slug = 'prosegur-digital-gold', U = 'https://www.prosegurcrypto.com/digital-gold';
  const t = plano(U);
  const hechos = [['Compra mínima publicada', /Compra mínima ✔ 1 gramo/, '1 gramo'],
    ['Custodia publicada', /Tarifas de custodia ✔ Sin tarifas/, 'Sin tarifas de custodia según el proveedor'],
    ['Liquidación publicada', /Tiempo de liquidación ✔ Menos de 24 horas/, 'Menos de 24 horas según el proveedor'],
    ['Auditorías publicadas', /Auditorías periódicas ✔ Mensuales y certificadas/, 'Mensuales y certificadas según el proveedor']];
  const vistos = hechos.filter(([, re]) => re.test(t));
  contraste[slug] = { legible: !!t, vistos: vistos.map(h => h[0]) };
  if (t) ponerReferencias(slug, [ref('Moneda', 'EUR', U), ...vistos.map(([e, , v]) => ref(e, v, U))]);
  for (const [e] of hechos.filter(h => !vistos.includes(h))) informe.notas.push(`Prosegur Digital Gold: ya no se lee «${e}»`);
  if (!t) informe.sinComprobar.push('Prosegur Digital Gold: no se pudo leer la página');
  ponerAvisos(slug, []);
}

// Aktionariat y los portales que usan su tecnología.
const PORTALES = { aktionariat: 'https://shares.aktionariat.com/', 'boss-info': 'https://shares.bossinfo.com/',
  wemakeit: 'https://shares.wemakeit.com/', 'servicehunter-quitt': 'https://shares.quitt.ch/', switzerlend: 'https://shares.lend.ch/' };
for (const [slug, U] of Object.entries(PORTALES)) {
  const t = plano(U);
  if (!t) { informe.sinComprobar.push(`${esc[slug].titulo}: no se pudo leer ${U}`); ponerAvisos(slug, []); continue; }
  const precio = t.match(/Current Price CHF ([\d.]+) (Issuer Defined|Last trade • (\d{1,2} \w{3} \d{4}))/);
  const cap = t.match(/Market Cap CHF ([\d’']+)/)?.[1];
  const total = t.match(/Total Shares ([\d’']+)/)?.[1];
  const tok = t.match(/Tokenized Shares ([\d’']+) (\w+)/);
  const operaciones = [...t.matchAll(/(\d{1,2} \w{3} \d{4}) \/ [\d:]+ (Secondary Trade|Direct Investment) ([\d.]+) ZCHF/g)]
    .map(m => ({ fecha: fechaIngles(m[1]), tipo: m[2], precio: Number(m[3]) }));
  const directa = operaciones.find(o => o.tipo === 'Direct Investment');
  const secundaria = operaciones.find(o => o.tipo === 'Secondary Trade');
  const conDirecta = /Open Direct Investment/.test(t);
  const accionistas = t.match(/Shareholders ([\d’']+)/)?.[1];
  contraste[slug] = { precio: precio?.[1], tipoPrecio: precio?.[2], capitalizacion: cap, total, tokenizadas: tok?.slice(1), conDirecta, operaciones: operaciones.slice(0, 5) };
  const refs = [ref('Moneda', 'CHF', U)];
  if (precio?.[2] === 'Issuer Defined') refs.push(ref('Valor fijado por el emisor', `${numES(Number(precio[1]))} CHF`, U));
  else if (precio) refs.push(ref('Última operación publicada', `${numES(Number(precio[1]))} CHF (${fechaIngles(precio[3])})`, U));
  if (directa) refs.push(ref('Última inversión directa del emisor', `${numES(directa.precio)} ZCHF (${directa.fecha})`, U));
  if (secundaria) refs.push(ref('Último cruce secundario', `${numES(secundaria.precio)} ZCHF (${secundaria.fecha})`, U));
  if (cap) refs.push(ref(slug === 'switzerlend' ? 'Capitalización publicada (toda la empresa)' : 'Capitalización publicada', `${numES(entero(cap), 0)} CHF`, U));
  if (accionistas) refs.push(ref('Número de accionistas publicado', numES(entero(accionistas), 0), U));
  if (tok) refs.push(ref('Acciones tokenizadas', entero(tok[1]) === entero(total) ? `${numES(entero(tok[1]), 0)} ${tok[2]}`
    : `${numES(entero(tok[1]), 0)} ${tok[2]} de ${numES(entero(total), 0)}`, U));
  ponerReferencias(slug, refs);
  const dinamicos = [];
  const decia = esc[slug].avisos.map(a => a.texto).join(' ');
  if (/acuerdo de registro|acuerdos legales/.test(decia)) {
    if (/Registration Agreement N\/A/.test(t)) dinamicos.push(aviso('La página no enlaza el acuerdo de registro ni el de titular del token (ambos aparecen como «N/A»).'));
    // Sin la sección no se puede decir que los enlace: se avisa de lo que se vio.
    else if (!/Legal Documents/.test(t)) dinamicos.push(aviso(`El ${FES} la página no mostraba los acuerdos legales del token (registro y titular); consúltalos con el emisor.`));
    else informe.notas.push(`${esc[slug].titulo}: ya enlaza sus acuerdos; se quita el aviso.`);
  }
  if (/inversión directa del emisor/.test(decia)) {
    if (!conDirecta) {
      const cruces = operaciones.filter(o => o.tipo === 'Secondary Trade').slice(0, 2);
      const fechas = [...new Set(cruces.map(c => c.fecha))];
      const cuando = fechas.length === 1 && cruces.length > 1 ? `del ${fechas[0]}` : `(${fechas.join(' y ')})`;
      const fijado = precio?.[2] === 'Issuer Defined' ? ` El precio de ${numES(Number(precio[1]))} CHF lo fija el emisor y no es el de una operación real${cruces.length ? `: las últimas operaciones secundarias ${cuando} se cruzaron a ${[...new Set(cruces.map(c => numES(c.precio)))].join(' y ')} ZCHF por acción` : ''}.` : '';
      dinamicos.push(aviso(`El ${FES} la página no ofrecía inversión directa del emisor: solo negociación secundaria entre accionistas.${fijado}`));
    } else informe.notas.push(`${esc[slug].titulo}: vuelve a ofrecer inversión directa del emisor; se quita el aviso.`);
  }
  // El encabezado («Last trade») puede citar una operación que no está en la tabla histórica.
  if (precio?.[3] && operaciones.length && !operaciones.some(o => o.fecha === fechaIngles(precio[3])))
    dinamicos.push(aviso(`El encabezado del último cruce (${fechaIngles(precio[3])}) y la tabla histórica del portal (última operación del ${operaciones[0].fecha}) no coinciden en la fecha. No se presenta como precio actual ejecutable.`));
  ponerAvisos(slug, dinamicos);
}

// Alius Capital: Casa de Outeiro e IOD Occasio.
function alius(U) {
  const t = plano(U);
  if (!t) return null;
  const v = re => t.match(re)?.[1];
  const dias = v(/Días restantes (\d+)/);
  return { legible: true, objetivo: v(/Objetivo ([\d.]+,\d{2}) €/), producto: v(/Tipo de producto financiero (\w+)/),
    precioToken: v(/Precio por Token ([\d.]+,\d{2}) €/), minimo: v(/Inversión mínima ([\d.]+,\d{2}) €/),
    interes: v(/Interés anual ([\d,]+ %)/), plazo: v(/Plazo de devolución ([^A-Z]+?) Tokens/),
    tokensVenta: v(/Tokens a la venta ([\d.]+)/), tokensVendidos: v(/Tokens vendidos ([\d.]+)/),
    dias: dias == null ? null : Number(dias), recaudado: v(/Recaudado ([\d.]+,\d{2}) €/) };
}
const euros = s => s.replace(/,00$/, '');
{
  const slug = 'casa-de-outeiro', U = 'https://aliuscap.com/projects/casa-de-outeiro', W = 'https://casadeouteiro.com/emision-capital/';
  const a = alius(U);
  const hasta = plano(W).match(/EMISIÓN DE CAPITAL HASTA (\d{1,2}\/\d{1,2})/)?.[1];
  contraste[slug] = { ...a, hasta };
  const refs = [];
  if (plano(W)) refs.push(ref('Moneda', 'EUR', W));
  if (a?.minimo) refs.push(ref('Entrada mínima', `${euros(a.minimo)} EUR`, U));
  if (a?.precioToken) refs.push(ref('Precio por token', `${a.precioToken} EUR`, U));
  if (hasta) refs.push(ref('Plazo de la emisión', `hasta el ${hasta}`, W));
  if (a?.dias != null) refs.push(ref('Días restantes de campaña', String(a.dias), U));
  if (a?.recaudado) refs.push(ref('Recaudado', `${euros(a.recaudado)} EUR${a.objetivo ? ` de ${euros(a.objetivo)} EUR` : ''}`, U));
  ponerReferencias(slug, refs);
  if (a?.precioToken && a?.minimo) ficha(slug).documentacion = { ...ficha(slug).documentacion, caracteristicas: doc[slug].caracteristicas.map(c =>
    c.etiqueta !== 'Entrada mínima' ? c : { ...c, valor: `El ${FES} Alius Capital publicaba ${euros(a.precioToken)} EUR por token y una inversión mínima de ${euros(a.minimo)} EUR.` }) };
  const dinamicos = [];
  if (a?.dias > 0) dinamicos.push(aviso(`Según el emisor, la emisión de capital está abierta solo hasta el ${hasta || 'final de la campaña'}; el ${FES} Alius Capital mostraba ${a.dias} días restantes. Después puede cerrarse.`));
  else if (a) dinamicos.push(aviso(`El ${FES} la campaña ya no mostraba días restantes en Alius Capital: puede estar cerrada.`));
  else informe.sinComprobar.push('Casa de Outeiro: no se pudo leer la ficha de Alius Capital');
  ponerAvisos(slug, dinamicos);
}
{
  const slug = 'iod-occasio', U = esc['iod-occasio'].url;
  const a = alius(U);
  contraste[slug] = a;
  if (!a) { informe.sinComprobar.push('IOD Occasio: no se pudo leer la ficha de Alius Capital'); ponerAvisos(slug, []); }
  else {
    const abierta = a.dias > 0;
    const desc = `Bono tokenizado de IOD Applications en Alius Capital para anticipar cobros de facturas, con seguro de caución de hasta el 90 % según la plataforma. ` +
      (abierta ? `El ${FES} la campaña estaba abierta (${a.dias} días restantes); las condiciones son las del documento de emisión.`
        : `El ${FES} la campaña ya no estaba abierta${a.recaudado ? `: recaudó ${euros(a.recaudado)} € de ${euros(a.objetivo || '')} €` : ''}.`);
    Object.assign(ficha(slug).cambios, { resumen: desc });
    ficha(slug).documentacion = { ...ficha(slug).documentacion, descripcion: desc, caracteristicas: [
      { etiqueta: 'Estado', valor: abierta ? `Campaña abierta el ${FES} (${a.dias} días restantes)` : `Campaña no abierta el ${FES}` },
      { etiqueta: 'Moneda indicada', valor: 'EUR' },
      { etiqueta: 'Proveedor', valor: 'Alius Capital (proveedor de financiación participativa supervisado por la CNMV)' }] };
    ponerReferencias(slug, [
      ...(a.producto ? [ref('Tipo de producto', a.producto, U)] : []), ...(a.interes ? [ref('Interés anual publicado', a.interes, U)] : []),
      ...(a.plazo ? [ref('Plazo de devolución', a.plazo.trim(), U)] : []), ...(a.precioToken ? [ref('Precio por token', `${a.precioToken} EUR`, U)] : []),
      ...(a.recaudado ? [ref('Recaudado', `${euros(a.recaudado)} EUR de ${euros(a.objetivo || '')} EUR${a.tokensVendidos ? ` (${a.tokensVendidos} de ${a.tokensVenta} tokens)` : ''}`, U)] : []),
      ...(a.dias != null ? [ref('Días restantes de campaña', String(a.dias), U)] : [])]);
    ponerAvisos(slug, [abierta
      ? aviso(`El ${FES} la campaña figuraba abierta en Alius Capital con ${a.dias} días restantes; puede cerrarse o llenarse en cualquier momento. RWAdar no la recomienda: lee el documento de emisión.`, 'neutro')
      : aviso(`El ${FES} la campaña no estaba abierta; esta referencia queda en seguimiento por si hay nuevas emisiones.`, 'neutro')]);
  }
}

// Hausera: oportunidad destacada y trayectoria publicada.
{
  const slug = 'hausera-proximas-ofertas', H = 'https://hausera.io/', O = 'https://hausera.io/oportunidades/';
  const t = plano(O);
  const d = t.match(/opciones (.+?) (PREVENTA|ABIERTA|PRÓXIMAMENTE|EN ESTUDIO) (?:CRV|CRA) Importe a financiar: ([\d.]+)€(.*?)Más información/);
  const campo = (s, re) => s?.match(re)?.[1];
  const tr = plano(H).match(/(\d+) operaciones realizadas (\d+) operaciones terminadas [\d,]+% rentabilidad histórica (\d+)M€ total financiado/);
  contraste[slug] = { legible: !!t, destacada: d ? { nombre: d[1], estado: d[2], importe: d[3], detalle: d[4] } : null };
  if (!t) { informe.sinComprobar.push('Hausera: no se pudo leer la página de oportunidades'); ponerAvisos(slug, []); }
  else {
    const preventa = campo(d?.[4], /Inicio de preventa: ([\d/]+)/), publica = campo(d?.[4], /Inicio de oferta pública: ([\d/]+)/);
    const fin = campo(d?.[4], /Fin previsto de proyecto: ([\d/]+)/), meses = campo(d?.[4], /Duración \(meses\): (\d+)/);
    const roi = campo(d?.[4], /Rentabilidad sobre inversión: ([\d,]+%)/), anual = campo(d?.[4], /Rentabilidad anualizada: ([\d,]+%)/);
    const estado = d ? { PREVENTA: 'la preventa', ABIERTA: 'la oferta abierta', 'PRÓXIMAMENTE': 'la próxima apertura', 'EN ESTUDIO': 'el estudio' }[d[2]] : null;
    const desc = d ? `Seguimiento de nuevas ofertas de Hausera. El ${FES} anunciaba ${estado} de ${d[1]}${preventa ? ` (preventa desde el ${preventa}` : ''}${publica ? `, oferta pública desde el ${publica})` : preventa ? ')' : ''}.`
      : `Seguimiento de nuevas ofertas de Hausera. El ${FES} no anunciaba ninguna oportunidad abierta ni en preventa.`;
    Object.assign(ficha(slug).cambios, { resumen: desc });
    ficha(slug).documentacion = { descripcion: desc, caracteristicas: doc[slug].caracteristicas.map(c => c.etiqueta !== 'Estado' ? c
      : { ...c, valor: d ? `${d[1]}: ${d[2].toLowerCase()} el ${FES}${publica ? `; oferta pública desde el ${publica}` : ''}` : `Sin oportunidades anunciadas el ${FES}` }) };
    ponerReferencias(slug, [
      ...(d ? [ref('Próxima oportunidad anunciada', `${d[1]} · ${d[2].toLowerCase()}`, O), ref('Importe a financiar anunciado', `${d[3]} EUR`, O)] : []),
      ...(preventa || publica ? [ref('Calendario anunciado', [preventa && `preventa ${preventa}`, publica && `oferta pública ${publica}`, fin && `fin previsto ${fin}`].filter(Boolean).join(' · '), O)] : []),
      ...(anual ? [ref('Rentabilidad anualizada anunciada', `${anual.replace('%', ' %')}${roi ? ` (${roi.replace('%', ' %')} sobre la inversión${meses ? ` en ${meses} meses` : ''})` : ''}`, O,
        `Rentabilidad prevista que anuncia el promotor el ${FES}. No es rentabilidad garantizada ni realizada.`)] : []),
      ...(tr ? [ref('Historial publicado', `${tr[1]} operaciones, ${tr[2]} terminadas, ${tr[3]} M EUR financiados`, H)] : [])]);
    ponerAvisos(slug, [aviso(d && d[2] === 'ABIERTA'
      ? `El ${FES} Hausera tenía abierta la oferta de ${d[1]}; RWAdar no la recomienda: lee sus condiciones.`
      : 'Esta referencia está en seguimiento y no representa una oferta abierta: una preventa no es la oferta pública.', 'neutro')]);
  }
}

// Reental: catálogo de inmuebles y mercado P2P (todas sus páginas).
{
  const slug = 'reental-emision-primaria', RP = 'https://www.reental.co/properties';
  if (plano(RP)) ponerReferencias(slug, [ref('Catálogo de inmuebles', 'Fichas con estado «En reforma», «En explotación», «Financiado» o «Cerrado»; no indica cuáles admiten inversión nueva', RP,
    `Visto en la fuente oficial el ${FES}. El estado de obra o explotación no acredita que se pueda invertir.`)]);
  else informe.sinComprobar.push('Emisión primaria de Reental: no se pudo leer el catálogo');
  ponerAvisos(slug, []);
}
const P2P = 'https://p2p.rnt.finance/';
const libro = {};
for (const m of ('\n' + (legible(captura(P2P)) ? captura(P2P).texto : '')).matchAll(
  /\n([^\n]+)\n(\d+) (?:Ofertas?|order_list\.offers)\n([\d.]+) (?:tokens|order_list\.tokens)\n(?:Rango de precios|Precio del token|order_list\.range_price|order_list\.price_token)\n([\d.,]+)(?:\n-\n([\d.,]+))?/g)) {
  libro[m[1]] = { ordenes: Number(m[2]), tokens: m[3].replace('.', ','), precio: m[5] ? `${m[4]}–${m[5]}` : m[4] };
}
const p2pLegible = Object.keys(libro).length > 0;
const ORDEN = 'Una orden de venta no garantiza ejecución ni liquidez, y el precio pedido lo fija cada vendedor. El rendimiento anunciado por Reental no incluye necesariamente el retorno de capital.';
for (const slug of Object.keys(esc).filter(s => s.startsWith('reental-secundario-'))) {
  const o = esc[slug];
  const pagina = o.fuentesActuales.find(u => u.includes('reental.co/properties/'));
  const t = pagina ? plano(pagina) : '';
  const dinamicos = [];
  if (pagina && !t.includes(o.titulo)) informe.notas.push(`${o.titulo}: la ficha del inmueble en reental.co no se pudo leer o ya no lo nombra.`);
  if (o.avisos.some(a => /activo subyacente/.test(a.texto))) {
    if (/Austin 1 \(AUS-1\)/.test(t)) dinamicos.push(aviso('Reental indica que el activo subyacente de Dania Beach 1 se sustituyó el 15/4/2026 por Austin 1 (AUS-1) y que se requiere la validación expresa de cada inversor para ratificar su participación en el nuevo vehículo.'));
    else informe.notas.push(`${o.titulo}: no se pudo volver a leer el cambio de activo subyacente; se quita el aviso.`);
  }
  const l = libro[o.titulo];
  contraste[slug] = { p2p: l || null, fichaReental: !!t };
  if (!p2pLegible) {
    dinamicos.push(aviso(`No se pudo leer el mercado P2P de Reental el ${FES}; comprueba allí si hay órdenes de venta.`));
  } else if (l) {
    ponerReferencias(slug, [ref('Órdenes de venta en el P2P', `${l.ordenes} ${l.ordenes === 1 ? 'orden' : 'órdenes'} · ${l.tokens} ${l.tokens === '1' ? 'token' : 'tokens'}`, P2P),
      ref('Precio pedido por token en el P2P', l.precio, P2P)]);
  } else {
    dinamicos.push(aviso(`El ${FES} el listado público del mercado P2P de Reental no mostraba órdenes de venta de este token; puede haberlas más adelante.`));
  }
  const lista = estaticos(slug).filter(a => !/^Una orden de venta/.test(a.texto) && a.texto !== GEN);
  ficha(slug).cambios.avisos = [aviso(GEN), aviso(ORDEN), ...lista, ...dinamicos];
  for (const a of dinamicos) informe.avisos.push(`${o.titulo}: ${a.texto}`);
}
if (!p2pLegible) informe.sinComprobar.push('Mercado P2P de Reental: no se pudo leer el listado');

// Cualquier ficha sin regla propia conserva sus textos y se marca para revisar.
for (const slug of Object.keys(esc)) {
  if (!fichas[slug]) { ponerAvisos(slug, []); informe.notas.push(`${esc[slug].titulo}: sin regla automática; revisa a mano.`); }
  // Solo se anota un aviso que desaparece de verdad, no el que se rehace con la fecha nueva.
  const molde = s => s.replace(/\d{2}\/\d{2}\/\d{4}|\d+([.,]\d+)?/g, '#').slice(0, 60);
  for (const a of esc[slug].avisos.filter(a => DINAMICO.test(a.texto)))
    if (!fichas[slug].cambios.avisos.some(b => molde(b.texto) === molde(a.texto)))
      informe.notas.push(`${esc[slug].titulo}: se quita el aviso «${a.texto}»`);
}

// ---------------------------------------------------------------- 4 · escribir
const carpeta = path.join(VERIF, `${FECHA}-v2`);
fs.mkdirSync(carpeta, { recursive: true });
const cambios = {
  desde: DESDE,
  alcance: `Revisión editorial de fuentes primarias del ${FES}: las ${radar.fuentes.length} fuentes del radar se volvieron a consultar y siguen diciendo lo que respaldan. No acredita onboarding, oferta abierta ni rentabilidad.`,
  notaOrigen: `Revisión del ${FES}: fuentes del radar y de las ${Object.keys(esc).length} fichas consultadas de nuevo con rwadar-app/actualizar-catalogo.mjs. Las cifras se renuevan solo donde se vieron en la fuente oficial ese día.`,
  notaActualizacion: `Comprobación del ${FES} de destinos, fuentes y cifras de las ${Object.keys(esc).length} fichas.`,
  referenciaAprobacion: `Revisión del ${FES} (actualizar-catalogo.mjs); aprobada por Víctor`,
  ofertas: fichas,
};
const escribir = (archivo, valor) => fs.writeFileSync(path.join(carpeta, archivo), JSON.stringify(valor, null, 2) + '\n');
escribir(`cambios-${FECHA}.json`, cambios);
escribir(`contraste-${FECHA}.json`, { fecha: FECHA, desde: DESDE,
  metodo: 'rwadar-app/actualizar-catalogo.mjs: Chromium sin ventana, sin iniciar sesión ni aceptar nada, con hora de España; petición directa cuando el navegador recibe un bloqueo; PDF con pdftotext.',
  capturadoEn: (h => [h[0], h.at(-1)])(Object.values(CAP).map(r => r.consultada).filter(Boolean).sort()),
  radar: radarContraste, fichas: contraste });

// ---------------------------------------------------------------- 5 · montar y comprobar
let lote = null, comprobacion = null;
if (!bloqueos.length) {
  console.log('4/5 · Montando el lote…');
  const montar = spawnSync(process.execPath, [path.join(APP, 'montar-revision.mjs'), FECHA], { encoding: 'utf8' });
  lote = (montar.stdout + montar.stderr).trim();
  if (montar.status !== 0) bloqueos.push(`montar-revision.mjs falló: ${lote.split('\n').slice(-3).join(' ')}`);
  else {
    console.log('5/5 · Probándolo en PGlite sobre la cadena de producción…');
    const prueba = spawnSync(process.execPath, [path.join(APP, 'comprobar-revision.mjs'), FECHA], { encoding: 'utf8' });
    comprobacion = (prueba.stdout + prueba.stderr).trim().split('\n').at(-1);
    if (prueba.status !== 0) bloqueos.push(`comprobar-revision.mjs falló: ${(prueba.stdout + prueba.stderr).trim().split('\n').slice(-4).join(' ')}`);
  }
}

const lista = (titulo, elementos) => elementos.length ? `\n## ${titulo}\n\n${elementos.map(e => `- ${e}`).join('\n')}\n` : '';
const fuentesOk = radarContraste.filter(f => f.ok).length;
const md = `# Revisión del catálogo del ${FES}\n\n` +
  `Hecha con \`node rwadar-app/actualizar-catalogo.mjs\`, partiendo de la del ${fES(DESDE)}.\n\n` +
  `- **${bloqueos.length ? 'NO LISTA: revisa lo de abajo antes de montarla' : 'Lista para aplicar'}.**\n` +
  `- Radar: ${fuentesOk} de ${radar.fuentes.length} fuentes leídas y con su texto de respaldo.\n` +
  (lote ? `- ${lote.split('\n').at(-1)}\n` : '') + (comprobacion ? `- PGlite: ${comprobacion}\n` : '') +
  (bloqueos.length ? '' : `- Falta lo de Víctor: pegar \`rwadar-app/data/importaciones/catalogo-${FECHA}-v2/aplicar-y-aprobar.sql\` en Supabase › SQL Editor › Run (a partir de las 02:00 de España del ${FES}) y publicar la web.\n`) +
  lista('Bloqueos (hay que resolverlos a mano)', bloqueos) +
  lista('Cifras que cambian', informe.cifras) +
  lista('Fichas sin poder comprobar (pierden cifra o llevan aviso)', informe.sinComprobar) +
  lista('Avisos con datos del día', informe.avisos) +
  lista('Otros cambios para revisar', informe.notas);
fs.writeFileSync(path.join(carpeta, `informe-${FECHA}.md`), md);
console.log('\n' + md);
process.exit(bloqueos.length ? 2 : 0);

// Entrega del catálogo «2026-11-05»: investigación del día pedida por Víctor («Hazme la
// investigación de hoy de las ofertas, y actualiza la web y la app»). Preparación LOCAL: sin red
// ni servicios remotos.
//
//   node rwadar-app/data/verificaciones/2026-11-05-v2/preparar-entrega.mjs
//
// Parte exactamente de la revisión publicada 723968ce (entrega 2026-11-04.2), leída hoy como
// visitante (lectura-publica/), y aplica SOLO lo que dice DECISIONES-COORDINADOR.md:
// 1. Radar: las 67 fuentes comprobadas hoy (radar-contraste-2026-11-05.json, 67/67) y los cambios
//    de cambios-radar.json (fuente paxg-web en paxg.com y dos textos de Pax Gold).
// 2. Las 24 fichas, revisadas hoy con fuentes primarias (expedientes/) y revisión independiente
//    (revision-independiente/): verificadaEl 05/11, 7 días de vigencia, avisos con fecha de hoy y
//    los cambios por oferta. Cada texto «antes» se exige tal cual: si no está, el script falla.
// 3. Tres datos de la tarjeta (etiqueta fija): los publicados se conservan con consulta del 05/11;
//    los que cambian se reescriben en castellano llano, con fuente y fecha.
// 4. Las correcciones de la revisión independiente de la entrega (REVISION-ENTREGA.md, §8: R1, R2, R3,
//    R5, R6 y R7): nota de las participaciones en venta de Brickwise, fuente para personas de los países
//    de mTBILL, la comisión del 0 % del 01/11 en Aktionariat y Boss Info, datos de tarjeta conservados
//    de más de 120 caracteres, redacción del reembolso de Spiko Euro y fecha tope en la guarda.
// Hoy NO se toca public.plataformas ni public.fuentes: el SQL solo escribe en rwadar_catalogo.
// Reproducible byte a byte: ninguna salida depende de la hora de ejecución.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../../../..');
const require = createRequire(import.meta.url);
const { cargarFuentesLocales, construirSqlImportacion } = require('../../../catalogo-publico.js');
const { leerBloquesCatalogo } = require(path.join(ROOT, 'rwadar-fichas.js'));
const { idiomaCita } = require(path.join(ROOT, 'rwadar-site/assets/ficha-editorial-20261022.js'));
const ETIQUETA = '2026-11-05', FECHA = '2026-11-05', DESDE = '2026-11-04.2', HOY = '2026-11-05';
const FES = '05/11/2026', CORTA = '05/11';
const ULTIMO = '2026-11-12'; // último día vigente: verificadaEl 05/11 y 7 días
const PREVIA = '723968ce-00f7-7f42-b3e3-6c7f401b8f89';
const HASH_PREVIA = '723968ce00f77f42b3e36c7f401b8f8919eaa5dbc35b782f15fa40f5c5337585';
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const escribir = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); };
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const rel = p => path.relative(ROOT, p).split(path.sep).join('/');
const base = path.resolve(DIR, `../${DESDE}-v2`);

// ---------------------------------------------------------------- partida: la publicada
const previa = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: DESDE, versionEsquema: 2 }));
assert.equal(previa.revisionId, PREVIA, `la ${DESDE} local no es la revisión publicada`);
assert.equal(previa.hash, HASH_PREVIA, `identidad (huella) de la ${DESDE}`);
const snapshot = leerBloquesCatalogo(fs.readFileSync(path.join(ROOT, 'rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8'));
assert.ok([...snapshot.plataformas, ...snapshot.ofertas].every(x => x.revisionId === PREVIA), 'snapshot de la última sincronización');
const radarBase = leer(path.join(base, 'radar-canonico-26.json'));
const escaparateBase = leer(path.join(base, 'escaparate-publicacion.json'));
const docBase = leer(path.join(base, 'documentacion-ofertas.json'));
const manifiestoBase = leer(path.join(base, 'manifiesto-catalogo.json'));

// Lo leído hoy como visitante (lectura-publica/, 07:55:58–07:56:01 UTC) es exactamente la base local.
const lp = path.join(DIR, 'lectura-publica');
const pubO = leer(path.join(lp, 'ofertas-v2.json')), pubP = leer(path.join(lp, 'plataformas-v2.json'));
const pubT = leer(path.join(lp, 'plataformas-todas.json'));
assert.ok([...pubO, ...pubP].every(x => x.revision_id === PREVIA), 'la publicada leída hoy es la 723968ce');
assert.equal(pubO.length, escaparateBase.ofertas.length); assert.equal(pubP.length, escaparateBase.plataformas.length);
for (const o of pubO) {
  assert.deepEqual(o.documentacion, docBase[o.slug], `${o.slug}: documentación publicada = base local`);
  assert.deepEqual(o.fuentes_actuales, escaparateBase.ofertas.find(x => x.slug === o.slug).fuentesActuales, `${o.slug}: fuentes`);
  assert.equal(o.coleccion, escaparateBase.ofertas.find(x => x.slug === o.slug).coleccion, `${o.slug}: colección`);
}
// La vista devuelve las fuentes de cada campo en su orden y sin «publicadaEl» (la base no la guarda);
// la dirección y el título de cada fuente salen del radar (es lo que importa el SQL).
const fuenteRadarBase = new Map(radarBase.fuentes.map(f => [f.id, { id: f.id, tipo: f.tipo, titulo: f.titulo, url: f.url,
  primaria: true, consultadaEl: f.consultadaEl }]));
const ordenar = v => JSON.parse(JSON.stringify(v), (k, x) => k === 'publicadaEl' ? undefined
  : k === 'fuentes' && Array.isArray(x) ? [...x].map(f => fuenteRadarBase.get(f.id) || f).sort((a, b) => (a.id < b.id ? -1 : 1)) : x);
for (const p of pubP) assert.deepEqual(ordenar(p.verificacion_local),
  ordenar(escaparateBase.plataformas.find(x => x.slug === p.slug).verificacionLocal), `${p.slug}: verificación publicada = base local`);
assert.deepEqual(pubT.filter(p => p.estado === 'en_radar').map(p => p.slug).sort(), escaparateBase.plataformas.map(p => p.slug).sort(),
  'public.plataformas en el radar = las 25 del lote');
assert.equal(pubT.filter(p => p.estado === 'descartada').length, 5);

// ---------------------------------------------------------------- 1 · radar
const contrasteRuta = path.join(DIR, `radar-contraste-${FECHA}.json`), cambiosRadarRuta = path.join(DIR, 'cambios-radar.json');
const contraste = leer(contrasteRuta), cambiosRadar = leer(cambiosRadarRuta);
const radar = structuredClone(radarBase);
assert.ok(contraste.fecha === FECHA && contraste.fuentes === radar.fuentes.length && contraste.correctas === radar.fuentes.length &&
  !contraste.bloqueos.length, 'el radar no está comprobado hoy al completo: no se monta el lote');
assert.deepEqual(contraste.contraste.map(c => c.id), radar.fuentes.map(f => f.id), 'el contraste cubre las 67 fuentes, en orden');
assert.ok(contraste.contraste.every(c => c.ok));
assert.equal(cambiosRadar.fecha, FECHA);
assert.deepEqual(Object.keys(cambiosRadar.fuentes), ['paxg-web']);
assert.deepEqual(Object.keys(cambiosRadar.plataformas), ['pax-gold']);
for (const [id, c] of Object.entries(cambiosRadar.fuentes)) {
  const f = radar.fuentes.find(x => x.id === id);
  assert.deepEqual({ url: f.url, titulo: f.titulo }, c.antes, `${id}: fuente de partida`);
  assert.equal(contraste.contraste.find(x => x.id === id).url, c.url, `${id}: el contraste se hizo sobre la página nueva`);
  f.url = c.url; f.titulo = c.titulo;
}
for (const [slug, campos] of Object.entries(cambiosRadar.plataformas)) {
  const p = radar.plataformas.find(x => x.slug === slug);
  for (const [campo, c] of Object.entries(campos)) {
    assert.equal(p[campo].detalle, c.antes, `${slug}.${campo}: texto «antes»`);
    p[campo].detalle = c.detalle;
  }
}
radar.verificadoEl = FECHA;
radar.alcance = `Revisión editorial de fuentes primarias del ${FES}: las ${radar.fuentes.length} fuentes del radar se volvieron a ` +
  'consultar sin sesión y siguen diciendo lo que respaldan (las dos del registro REGAFI de la ACPR, por su API pública, porque la ' +
  'página daba error 502). La fuente de Pax Gold pasa a su web oficial (paxg.com). No acredita onboarding, oferta abierta ni rentabilidad.';
radar.fuentes = radar.fuentes.map(f => ({ ...f, consultadaEl: FECHA }));
const fuentePorId = new Map(radar.fuentes.map(f => [f.id, f]));
const conFuentes = campo => ({ ...campo, fuentes: campo.fuentes.map(id => {
  assert.ok(fuentePorId.has(id), `fuente inexistente: ${id}`);
  return fuentePorId.get(id);
}) });

// ---------------------------------------------------------------- 2 · ofertas
const CAMBIOS = [];
const anota = (slug, campo, antes, despues) => CAMBIOS.push({ slug, campo, antes, despues });
const ofertas = structuredClone(escaparateBase.ofertas);
const documentos = structuredClone(docBase);
const porSlug = new Map(ofertas.map(o => [o.slug, o]));
const oferta = slug => { const o = porSlug.get(slug); assert.ok(o, slug); return o; };
const unico = (lista, fn, que) => { const i = lista.map((x, n) => fn(x) ? n : -1).filter(n => n >= 0);
  assert.equal(i.length, 1, `${que}: ${i.length ? 'más de uno' : 'no encontrado'}`); return i[0]; };
const avisoCambia = (slug, viejo, nuevo) => {
  const o = oferta(slug), i = unico(o.avisos, a => a.texto.startsWith(viejo), `${slug}: aviso «${viejo}»`);
  anota(slug, 'aviso', o.avisos[i].texto, nuevo);
  o.avisos[i] = { ...o.avisos[i], texto: nuevo };
};
const avisoNuevo = (slug, texto, antesDe) => {
  const o = oferta(slug);
  assert.ok(!o.avisos.some(a => a.texto === texto), `${slug}: aviso ya publicado`);
  const i = unico(o.avisos, a => a.texto.startsWith(antesDe), `${slug}: aviso «${antesDe}»`);
  o.avisos.splice(i, 0, { texto, tono: 'warn', esAntiguedad: false, verificadaEl: FECHA });
  anota(slug, 'aviso', null, texto);
};
const metrica = (slug, etiquetaVieja, nueva) => {
  const o = oferta(slug), i = unico(o.metricas, m => m.etiqueta === etiquetaVieja, `${slug}: métrica «${etiquetaVieja}»`);
  assert.notDeepEqual(o.metricas[i], nueva, `${slug}: la métrica «${etiquetaVieja}» no cambia`);
  anota(slug, 'métrica', `${o.metricas[i].etiqueta}: ${o.metricas[i].valor}`, `${nueva.etiqueta}: ${nueva.valor}`);
  o.metricas[i] = nueva;
};
const conFuente = (slug, url) => { const d = documentos[slug]; if (!d.fuentes.includes(url)) { d.fuentes.push(url); anota(slug, 'fuente de la ficha', null, url); } };
const refIndice = (slug, etiqueta, valor) => unico(documentos[slug].referencias,
  r => r.etiqueta === etiqueta && (valor === undefined || r.valor.startsWith(valor)), `${slug}: referencia «${etiqueta}»`);
const refQuita = (slug, etiqueta, valor) => {
  const d = documentos[slug], i = refIndice(slug, etiqueta, valor);
  anota(slug, 'referencia de la ficha', `${d.referencias[i].etiqueta}: ${d.referencias[i].valor}`, null);
  d.referencias.splice(i, 1);
};
const refCambia = (slug, etiqueta, valor, nueva) => {
  const d = documentos[slug], i = refIndice(slug, etiqueta, valor), r = { ...d.referencias[i], ...nueva };
  assert.notDeepEqual(r, d.referencias[i]);
  anota(slug, 'referencia de la ficha', `${d.referencias[i].etiqueta}: ${d.referencias[i].valor}`, `${r.etiqueta}: ${r.valor}`);
  d.referencias[i] = r; conFuente(slug, r.fuente);
};
const refNueva = (slug, r) => {
  const d = documentos[slug];
  assert.ok(!d.referencias.some(x => x.etiqueta === r.etiqueta), `${slug}: referencia «${r.etiqueta}» ya existe`);
  d.referencias.push(r); conFuente(slug, r.fuente);
  anota(slug, 'referencia de la ficha', null, `${r.etiqueta}: ${r.valor}`);
};
const REF = (etiqueta, valor, fuente, fechaDato, alcance) => ({ etiqueta, valor, fechaDato, fechaConsulta: FECHA, fuente, alcance });

// Todas las fichas se revisaron hoy con sus fuentes primarias (un expediente por oferta).
const expedientes = {};
for (const o of ofertas) {
  const exp = expedientes[o.slug] = leer(path.join(DIR, 'expedientes', `${o.slug}.json`));
  assert.equal(exp.slug, o.slug); assert.equal(exp.tipoExpediente, 'publicada');
  assert.ok(['mantener', 'actualizar'].includes(exp.decision), `${o.slug}: decisión ${exp.decision}`);
  assert.ok(exp.consulta.inicioUtc.startsWith(FECHA), `${o.slug}: expediente de hoy`);
  o.verificadaEl = FECHA;
  o.vigenciaDias = 7;
  o.avisos = o.avisos.map(a => ({ ...a, verificadaEl: FECHA }));
}
for (const slug of Object.keys(documentos)) documentos[slug].revisadaEl = FECHA;

// Tres datos de la tarjeta: etiqueta fija (normas del 03/11). Los publicados se conservan con
// consulta del 05/11 salvo los que cambian abajo, que se reescriben con fuente y fecha.
const CANONICA = /^(?:M[ií]nimo de inversi[oó]n|Acceso desde Espa[ñn]a|Salida|Reembolso)(?: \([^)]{1,60}\))?$/;
const PREFIJO = /^(?:Comprobado de nuevo en la fuente el \d{2}\/\d{2}\/\d{4}(?: \([^)]*\))?\.|Redacción en castellano del dato comprobado en la fuente el \d{2}\/\d{2}\/\d{4}\.)\s*/;
const tarjetaAntes = {};
for (const [slug, d] of Object.entries(documentos)) {
  tarjetaAntes[slug] = d.referencias.filter(r => CANONICA.test(r.etiqueta)).map(r => r.etiqueta);
  d.referencias = d.referencias.map(r => !CANONICA.test(r.etiqueta) ? r : { ...r, fechaConsulta: FECHA,
    alcance: `Comprobado de nuevo en la fuente el ${FES}. ${r.alcance.replace(PREFIJO, '')}`.trim() });
}
const tarjetaNuevas = {};
const tarjeta = (slug, etiqueta, valor, fuente, fechaDato, nota) => {
  assert.ok(CANONICA.test(etiqueta), `${slug}: etiqueta fija`);
  const r = REF(etiqueta, valor, fuente, fechaDato, `Redacción en castellano del dato comprobado en la fuente el ${FES}. ${nota}`.trim());
  const d = documentos[slug], i = d.referencias.findIndex(x => x.etiqueta === etiqueta);
  if (i >= 0) {
    assert.equal(d.referencias.filter(x => x.etiqueta === etiqueta).length, 1);
    anota(slug, 'tarjeta', `${etiqueta}: ${d.referencias[i].valor}`, `${etiqueta}: ${valor}`);
    d.referencias[i] = r;
  } else { d.referencias.push(r); anota(slug, 'tarjeta', null, `${etiqueta}: ${valor}`); }
  conFuente(slug, fuente);
  (tarjetaNuevas[slug] ||= []).push(etiqueta);
};

// ---- Spiko: rendimiento publicado con el valor liquidativo del 04/11 (consulta del 05/11).
const SPIKO = {
  'spiko-letras-del-tesoro-euro': { pct: '2,39 %', antes: '2,34 %', metrica: 'Rentabilidad publicada · 31 días · 02/11/2026',
    nueva: 'Rentabilidad publicada · 31 días · 04/11/2026', ref: 'Rentabilidad publicada · 31 días', web: 'https://data.spiko.io/eutbl/',
    alcance: `Rendimiento neto anualizado de 31 días que publica Spiko (valor liquidativo del 04/11/2026, consultado el ${FES}). Variable y no garantizado.` },
  'spiko-letras-del-tesoro-dolar': { pct: '3,99 %', antes: '3,95 %', metrica: 'Rentabilidad publicada · 31 días · 02/11/2026 · en USD',
    nueva: 'Rentabilidad publicada · 31 días · 04/11/2026 · en USD', ref: 'Rentabilidad publicada · 31 días', web: 'https://data.spiko.io/ustbl/',
    alcance: `Rendimiento neto anualizado en dólares de 31 días que publica Spiko (valor liquidativo del 04/11/2026, consultado el ${FES}). No incluye la variación del euro frente al dólar. Variable y no garantizado.` },
  'spiko-smart-cash-euro': { pct: '2,84 %', antes: '2,84 %', metrica: 'Rentabilidad publicada · neta y variable · 02/11/2026',
    nueva: 'Rentabilidad publicada · neta y variable · 04/11/2026', ref: 'Rendimiento neto publicado', web: 'https://data.spiko.io/safo-eur',
    alcance: `Lo que creció el fondo en su último día de cálculo (valor liquidativo del 04/11/2026), pasado a un año y neto de comisiones, según publica Spiko; consultado el ${FES}. Variable: sigue al €STR.` },
};
for (const [slug, s] of Object.entries(SPIKO)) {
  const o = oferta(slug), prop = expedientes[slug].propuestaTarjeta.rentabilidad;
  assert.equal(o.rentabilidad.mostrada, s.antes, `${slug}: rentabilidad «antes»`);
  assert.equal(prop.mostrada, s.pct, `${slug}: el expediente da otra cifra`);
  assert.ok(prop.literal.includes('04/11/2026') && prop.literal.includes(`consultado el ${FES}`) && !prop.literal.includes('02/11/2026'));
  anota(slug, 'rentabilidad', `${o.rentabilidad.mostrada} · ${o.rentabilidad.literal}`, `${prop.mostrada} · ${prop.literal}`);
  o.rentabilidad = { mostrada: prop.mostrada, literal: prop.literal };
  metrica(slug, s.metrica, { etiqueta: s.nueva, valor: s.pct });
  refCambia(slug, s.ref, s.antes, { valor: s.pct, fechaDato: '2026-11-04', fechaConsulta: FECHA, fuente: s.web, alcance: s.alcance });
}
// Euro: fuera las cifras viejas que el revisor señaló (NAV del 28/09 y del 22/10, patrimonio del 22/10 y del 30/10).
refQuita('spiko-letras-del-tesoro-euro', 'Último NAV publicado', '1,0597 EUR');
refQuita('spiko-letras-del-tesoro-euro', 'NAV publicado', '1,0597 EUR');
refQuita('spiko-letras-del-tesoro-euro', 'Valor liquidativo · 22/10/2026', '1,0613 EUR');
refQuita('spiko-letras-del-tesoro-euro', 'Patrimonio gestionado · 22/10/2026', '467,94 M EUR');
refQuita('spiko-letras-del-tesoro-euro', 'Patrimonio y partícipes · consulta 01/11/2026', 'totalAssets 444519031.56 EUR');
// Dólar: la cifra en euros de GECO es la clase en dólares pasada a euros, no la clase EUR no cubierta.
{
  const slug = 'spiko-letras-del-tesoro-dolar', i = refIndice(slug, 'Precio · consulta 01/11/2026', 'amount 1.101207 USD');
  const r = documentos[slug].referencias[i], viejo = 'GECO muestra 0,98304 € al 30/10/2026, que corresponde a la clase EUR no cubierta.';
  assert.ok(r.alcance.startsWith(viejo), `${slug}: alcance «antes»`);
  const alcance = r.alcance.replace(viejo, 'GECO muestra 0,98304 € al 30/10/2026: es esta misma clase en dólares expresada en euros, ' +
    'no la clase EUR no cubierta (corregido el 05/11/2026; ese día GECO daba 0,97858 € para esta clase y 1,01881 € para la clase EUR).');
  anota(slug, 'referencia de la ficha (alcance)', `${r.etiqueta}: ${viejo}`, `${r.etiqueta}: ${alcance.slice(0, alcance.indexOf(').') + 2)}`);
  documentos[slug].referencias[i] = { ...r, alcance };
}
// Spiko Euro (Smart Cash): el reembolso de la tarjeta pasaba del máximo duro de 160 caracteres (172); se usa
// el texto que el revisor confirmó hoy, sin repetir «Reembolso» (la tarjeta ya lo pone delante) y sin dos
// puntos seguidos («Reembolso: Diario: …»; revisión independiente de la entrega, R6).
tarjeta('spiko-smart-cash-euro', 'Reembolso', 'Diario, con orden antes de las 15:00 (París) y abono al día hábil siguiente; puede limitarse (25 % del fondo)',
  'https://geco.amf-france.org/back-office/document/download/438274', '2026-09-01',
  'Folleto de la SICAV (§3.2.4) en la base GECO de la AMF y KID en español: orden antes de las 15:00 (hora de París), pago al día hábil siguiente y límite si las salidas netas de un día llegan al 25 % del fondo.');

// ---- Robinhood: métrica de salida (revisor: confirmado).
metrica('robinhood-classic-stock-tokens', 'Salida', { etiqueta: 'Salida', valor: 'Vendes a Robinhood en la app, 24/5; puede suspender el cierre' });

// ---- mTBILL: valor por token del oráculo del emisor (ronda 488, 04/11 17:45 UTC) y países de la web de Midas.
metrica('mtbill', 'Valor por token · 02/11/2026', { etiqueta: 'Valor por token · 04/11/2026', valor: '1,0773 USD (oráculo del emisor)' });
// La fuente es la página que ve una persona (midas.app); el archivo de código que se leyó, cuyo nombre cambia
// con cada versión de la web, va como localizador en el alcance (revisión independiente de la entrega, R2).
refNueva('mtbill', REF('Países de oferta según la web de Midas · consulta 05/11/2026',
  'España figura entre las 14 jurisdicciones permitidas del aviso de entrada de la web de Midas (versión 1.0.2), las mismas 14 de oferta pública de las Condiciones Finales',
  'https://midas.app/', '2026-11-05',
  'Aviso «Eligibility & Jurisdiction» (versión 1.0.2) que enseña la web de Midas al entrar. Se leyó el 05/11/2026 en el código que sirve esa página (localizador: midas.app/assets/main-C67ipI_t.js, «Permitted Jurisdictions»; el nombre del archivo cambia con cada versión de la web): la página da 403 a una lectura automática y no se vio en pantalla. Países: Austria, Bélgica, Francia, Alemania, Irlanda, Italia, Luxemburgo, Malta, Países Bajos, Polonia, Portugal, Rumanía, España y Suecia. No prueba que se acepte el alta de un residente en España (no se hizo KYC). El estado de la ficha no cambia: siguen en conflicto los límites de reembolso.'));

// ---- Aktionariat, Boss Info y Switzerlend (registro de FINMA, libro de órdenes y condiciones del portal de hoy).
const SIN_FINMA = `Sin supervisión prudencial: no figura en el registro de autorizados de FINMA (${FES})`;
const COMISION = 'Si vendes a otro accionista pagas una comisión del 1,9 %.';
metrica('aktionariat', 'Supervisor', { etiqueta: 'Supervisor', valor: SIN_FINMA });
metrica('aktionariat', 'Precio del emisor · 03/11/2026', { etiqueta: `Precio del emisor · ${FES}`, valor: '7,25 CHF por acción (fijo)' });
avisoCambia('aktionariat', 'Entre accionistas hay vendedores por debajo',
  `Entre accionistas hay vendedores por debajo del precio del emisor (6,20 ZCHF frente a 7,25 CHF el ${FES}).`);
avisoNuevo('aktionariat', COMISION, 'Entre accionistas hay vendedores por debajo');
refQuita('aktionariat', 'Comisiones · consulta 01/11/2026', 'Fee (0%)');
// El «Fee (0%)» que se veía el 01/11 era la comisión de la pestaña de compra: como dato de salida contradice
// el aviso de hoy (vender cuesta un 1,9 %). Se quita del valor de Aktionariat y se aclara en los dos
// alcances (revisión independiente de la entrega, R3).
const ACLARA_0 = `La comisión del 0 % que se veía ese día era la de la compra; al vender, el ${FES} se cobraba un 1,9 %.`;
{
  const slug = 'aktionariat', i = refIndice(slug, 'Salida · consulta 01/11/2026', 'Bid/Ask 6.00 / 6.20'), r = documentos[slug].referencias[i];
  assert.equal(r.valor, 'Bid/Ask 6.00 / 6.20 · Spread 3.23% · Fee (0%)', `${slug}: salida del 01/11 «antes»`);
  const viejo = 'Localizador: /trade renderizado, libro de órdenes.';
  assert.ok(r.alcance.endsWith(viejo), `${slug}: alcance «antes»`);
  const nueva = { ...r, valor: 'Bid/Ask 6.00 / 6.20 · Spread 3.23%', alcance: r.alcance.replace(viejo, `${ACLARA_0} ${viejo}`) };
  anota(slug, 'referencia de la ficha', `${r.etiqueta}: ${r.valor}`, `${nueva.etiqueta}: ${nueva.valor}`);
  documentos[slug].referencias[i] = nueva;
}
{
  const slug = 'boss-info', i = refIndice(slug, 'Salida · consulta 01/11/2026', 'Bid/Ask 7.30 / 8.40'), r = documentos[slug].referencias[i];
  const viejo = 'Solo ZCHF con monedero propio. Comisión mostrada 0 %. Localizador: /trade, libro de órdenes.';
  assert.equal(r.alcance, viejo, `${slug}: alcance «antes»`);
  const alcance = `Solo ZCHF con monedero propio. ${ACLARA_0} Localizador: /trade, libro de órdenes.`;
  anota(slug, 'referencia de la ficha (alcance)', `${r.etiqueta}: ${viejo}`, `${r.etiqueta}: ${alcance}`);
  documentos[slug].referencias[i] = { ...r, alcance };
}
refNueva('aktionariat', REF('Comisiones · consulta 05/11/2026', 'Entre accionistas: 0 % para quien compra y 1,9 % para quien vende',
  'https://shares.aktionariat.com/trade', FECHA,
  'Resumen de la orden en la página de operaciones (al vender, comisión del 1,9 %; al comprar, 0 %), configuración pública del mercado entre accionistas (comisión del vendedor 0,0190) y condiciones del portal, §4.1 (la paga quien vende). En cadena, el contrato del mercado cobra 190 puntos básicos. No consta desde cuándo se cobra.'));

const PORTAL = (slug, url) => tarjeta(slug, 'Acceso desde España',
  'Sí para comprar al emisor, según las condiciones del portal: admite Suiza y EEE, con tope total de 100.000 € en el EEE', url, '2026-10-30',
  'Condiciones del portal del emisor (versión 1.0 del 30/10/2026), §9.1: la venta directa del emisor se dirige solo a residentes en Suiza o el EEE, con un tope total de 100.000 € para el EEE. Entre accionistas no hay límite de países, salvo sanciones y personas de EE. UU. (§6). No se publica cuánto queda del tope.');
const AVISO_PORTAL = 'Según las condiciones de su portal (§9.1, versión del 30/10/2026), la venta del emisor es solo para residentes en Suiza o el EEE, con un tope total de 100.000 € para el EEE; no se publica cuánto queda.';

PORTAL('boss-info', 'https://shares.bossinfo.com/investor-page-terms');
avisoCambia('boss-info', 'Acceso desde España no confirmado', AVISO_PORTAL);
tarjeta('boss-info', 'Mínimo de inversión', `100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF el ${CORTA})`,
  'https://shares.bossinfo.com/api/brokerbotsettings?ticker=BOSS', FECHA,
  'Configuración pública de compra del emisor: mínimo de 100 CHF por transferencia (en la práctica, 12 acciones por 102,02 CHF) y un mínimo en cripto que el portal convierte en 2 acciones con el precio del emisor (8,50197) y su incremento.');
avisoNuevo('boss-info', COMISION, 'El precio del emisor está por encima');
avisoNuevo('boss-info', 'La página de preguntas del emisor describe una moneda estable distinta (XCHF) de la que usa hoy el portal (ZCHF, Frankencoin).',
  'El precio del emisor y las ofertas entre accionistas cambian');
metrica('boss-info', 'Supervisor', { etiqueta: 'Supervisor', valor: SIN_FINMA });

PORTAL('switzerlend', 'https://shares.lend.ch/investor-page-terms');
avisoCambia('switzerlend', 'Acceso desde España no confirmado: el portal no publica países admitidos.', AVISO_PORTAL);
avisoCambia('switzerlend', 'Su web dice que el emisor recompra acciones si tiene liquidez',
  `Su web dice que el emisor recompra acciones si tiene liquidez, pero el acuerdo firmado no le obliga y el ${FES} la recompra seguía desactivada y casi sin fondos (0,03 ZCHF).`);
avisoNuevo('switzerlend', COMISION, 'El precio del emisor y las ofertas entre accionistas cambian');
avisoNuevo('switzerlend', `Entre accionistas hay vendedores por debajo del precio del emisor (venta más barata 67,00 ZCHF el ${FES}).`,
  'El precio del emisor y las ofertas entre accionistas cambian');
tarjeta('switzerlend', 'Mínimo de inversión', `1 acción (68,01 CHF el ${CORTA})`, 'https://shares.lend.ch/invest', FECHA,
  'La página de compra del emisor enseña 68,01 CHF por acción; que no haya mínimo por transferencia ni en cripto sale de la configuración que carga esa página.');
metrica('switzerlend', 'Supervisor', { etiqueta: 'Supervisor',
  valor: `${SIN_FINMA}; afiliada a PolyReg solo a efectos de blanqueo` });

// ---- Brickwise: 11 de reventa (libro de órdenes de la app del 05/11) y BILLA.
const BW_APP = 'https://app.brickwise.at/desktopWeb/marketplace';
const BW_CUENTA = 'https://www.brickwise.at/support/kann-ich-einen-account-von-jedem-land-aus-eroffnen';
const BW_V1 = 'https://api.app.brickwise.at/api/v1/assets', BW_V2 = 'https://api.app.brickwise.at/api/v2/assets';
const BW_ACCESO = 'Sin confirmar: cuenta para residentes del EEE (España incluida); no consta que esta emisión se distribuya en España.';
// [precio del 03/11 publicado, precio del 05/11, órdenes de compra corregidas por el revisor]
const BRICKWISE = {
  'vivienda-pluddemanngasse-101-graz': ['80', '75'],
  'vivienda-sonnleithnergasse-2-viena': ['75', '75'],
  'local-de-estanco-klagenfurt': ['95', '95'],
  'vivienda-stallhofstra-e-28-gratwein': ['69,90', '69,90'],
  'vivienda-schwarzer-weg-18-graz': ['69,90', '66,67', '35,00 € (1 participación, orden del 01/07/2026)'],
  'drautalresidenz-paternion': ['70', '70'],
  'randhartingergasse-9-viena': ['78', '78'],
  'apartamento-vacacional-hinterstoder-50': ['72', '77'],
  'vivienda-pottendorfer-stra-e-62-wr-neustadt': ['78', '74', '19,00 € (3 participaciones, orden del 06/11/2025)'],
  'fotovoltaica-greenpoint': ['100', '100'],
  'fotovoltaica-cohotel': ['110', '110'],
};
const LIBRO = 'Libro de órdenes de la app de Brickwise leído el 05/11/2026 (08:01–08:22 UTC) en los datos que usa la app; ninguna página pública enseña las órdenes una a una. Cambia a diario.';
for (const [slug, [antes, ahora, mejorCompra]] of Object.entries(BRICKWISE)) {
  const exp = expedientes[slug].propuestaTarjeta, rf = Object.fromEntries(exp.referenciasFicha.map(r => [r.etiqueta.replace(/ · \d{2}\/\d{2}\/\d{4}$/, ''), r]));
  const minimo = documentos[slug].referencias.find(r => r.etiqueta === 'Mínimo de inversión');
  assert.equal(minimo.valor, `1 participación desde ${antes} € en reventa (03/11)`, `${slug}: mínimo publicado`);
  const barata = rf['Venta más barata'].valor, lote = barata.match(/^([\d.,]+) € por participación \((\d+) a ese precio\)$/);
  assert.ok(lote, `${slug}: venta más barata del expediente`);
  assert.equal(lote[1].replace(/,00$/, ''), ahora, `${slug}: precio del 05/11 (DECISIONES) = expediente`);
  tarjeta(slug, 'Mínimo de inversión', `Desde ${ahora} € la participación en reventa (${CORTA})`, BW_APP, FECHA,
    `Precio por participación de la venta más barata del mercado de la app ese día, más un 1,5 % de comisión; a ese precio había ${lote[2]} ${lote[2] === '1' ? 'participación' : 'participaciones'} a la venta. Brickwise no publica un mínimo en reventa ni si una orden se puede comprar en parte. El precio lo fija cada vendedor y cambia a diario. No es el precio de emisión.`);
  tarjeta(slug, 'Acceso desde España', BW_ACCESO, BW_CUENTA, null, 'Página de ayuda de Brickwise; documentos de la emisión solo en alemán.');
  // Referencias de la ficha (no de la tarjeta), con la mejor compra corregida donde el revisor lo pidió.
  const compra = rf['Mejor oferta de compra'].valor;
  if (mejorCompra) assert.notEqual(compra, mejorCompra, `${slug}: el expediente ya trae la corrección`);
  refNueva(slug, REF(`Venta más barata · ${FES}`, barata, BW_V1, FECHA, LIBRO));
  refNueva(slug, REF(`Participaciones en venta · ${FES}`, rf['Participaciones en venta'].valor, BW_V2, FECHA,
    // Es la cifra de esta emisión, no de todo el mercado (revisión independiente del 05/11, R1).
    'Participaciones de esta emisión a la venta entre inversores ese día (suma de las órdenes abiertas en la app). Cambia a diario.'));
  refNueva(slug, REF(`Mejor oferta de compra · ${FES}`, mejorCompra || compra, BW_V1, FECHA,
    `${LIBRO} Es lo más que ofrecía pagar un comprador ese día, antes de la comisión del 1,5 %${mejorCompra ? '; corregido por la revisión independiente (leído a las 08:22 UTC: entre las 08:01 y las 08:22 desaparecieron dos órdenes de compra)' : ''}.`));
  const des = rf.Desistimiento;
  assert.match(des.fuente, /^https:\/\/storage\.googleapis\.com\/brickwise_templates\/assets\/AT[0-9A-Z]{10}\/AT[0-9A-Z]{10}_Ruecktrittsbelehrung\.pdf$/);
  refNueva(slug, REF('Desistimiento', 'No hay derecho de desistimiento al comprar en reventa', des.fuente, '2026-07-10',
    'Instrucciones de desistimiento de Brickwise para esta emisión (en alemán, versión del 10/07/2026), punto 2: en el mercado secundario no hay derecho de desistimiento.'));
}
avisoCambia('vivienda-pluddemanngasse-101-graz', 'La base de alquiler de la API cita un contrato ya vencido',
  'La API describe un alquiler que terminó el 31/07/2024 y no informa de otro; la rentabilidad no se muestra.');
avisoCambia('vivienda-sonnleithnergasse-2-viena', 'El contrato de alquiler que figura vence el 2026-11-29',
  'La API fija el fin del alquiler el 29/11/2026, pero su texto dice que terminó el 30/09/2023 por rescisión y que se busca inquilino; la rentabilidad no se muestra.');
avisoCambia('vivienda-schwarzer-weg-18-graz', 'La base de alquiler de la API cita un contrato ya vencido',
  'La API describe un alquiler que terminó el 30/08/2023 y no informa de otro; la rentabilidad no se muestra.');
avisoCambia('vivienda-pottendorfer-stra-e-62-wr-neustadt', 'La base de alquiler de la API cita un contrato ya vencido',
  'La API describe un alquiler que terminó el 30/11/2025 y no informa de otro; la rentabilidad no se muestra.');
{
  const slug = 'vivienda-pottendorfer-stra-e-62-wr-neustadt', s = documentos[slug].referencias.find(r => r.etiqueta === 'Salida');
  assert.equal(s.valor, 'Primera cancelación posible a los 15 años de la emisión; antes, solo vendiendo en la app si hay comprador (1,5 % de comisión)');
  tarjeta(slug, 'Salida', 'Primera cancelación a los 15 años de la emisión; antes, solo vendiendo en la app si hay comprador (1,5 % de comisión)',
    s.fuente, null, 'Contrato de la emisión (en alemán), punto 10.2: la primera cancelación ordinaria es a los 15 años de la emisión y después cada 15 años.');
}
// BILLA (próxima): umbral con fecha de hoy; plazo vencido sin prórroga y desistimiento, vigentes.
metrica('terreno-con-arrendamiento-billa', 'Suscrito / umbral', { etiqueta: 'Suscrito / umbral', valor: `82 de 5.000 participaciones necesarias (API ${FES})` });
avisoCambia('terreno-con-arrendamiento-billa', 'La emisión solo se ejecuta si alcanza 500.000 €',
  `La emisión solo se ejecuta si alcanza 500.000 €; el ${FES} la API mostraba 82 participaciones suscritas (8.200 €, el 1,64 % del mínimo). Si no se alcanza, se devuelve el dinero sin intereses.`);
tarjeta('terreno-con-arrendamiento-billa', 'Acceso desde España', BW_ACCESO, BW_CUENTA, null, 'Página de ayuda de Brickwise; documentos de la emisión solo en alemán.');

// ---- Casa de Outeiro (próxima).
metrica('casa-de-outeiro', 'Recaudado · 03/11/2026', { etiqueta: `Recaudado · ${FES}`, valor: '1.121.000 € de un mínimo de 2.000.000 €' });
avisoCambia('casa-de-outeiro', 'La campaña en Alius tenía fin el 31/10/2026 y el 03/11/2026',
  `La campaña en Alius tenía fin el 31/10/2026 y el ${FES} seguía sin días restantes ni ampliación, aunque la ficha de datos del 30/10 cita el 31/03/2027. Confirma en Alius si sigue abierta antes de invertir.`);

// ---- Hausera · próximas ofertas.
{
  const slug = 'hausera-proximas-ofertas', o = oferta(slug), d = documentos[slug];
  const viejo = 'Seguimiento de las operaciones inmobiliarias de Hausera. El 02/11/2026 anunciaba Alicante 2 con preventa desde el 04/11 y oferta pública desde el 11/11/2026; sin documento de emisión publicado.';
  const nuevo = `Seguimiento de las operaciones inmobiliarias de Hausera. El ${FES} Alicante 2 estaba en preventa desde el 04/11 y anunciaba la oferta pública para el 11/11/2026; sin documento de emisión público.`;
  assert.equal(o.resumen, viejo); assert.ok(d.descripcion.startsWith(viejo));
  o.resumen = nuevo; d.descripcion = nuevo + d.descripcion.slice(viejo.length);
  anota(slug, 'resumen', viejo, nuevo);
}
metrica('hausera-proximas-ofertas', 'Próxima operación', { etiqueta: 'Próxima operación', valor: 'Alicante 2 · preventa desde el 04/11/2026, oferta pública 11/11/2026' });
avisoCambia('hausera-proximas-ofertas', 'La preventa es una reserva sin compromiso',
  `Apuntarte a la preventa no te obliga, pero si firmas el acuerdo de reserva debes transferir el dinero en el plazo fijado. El ${FES} el documento de emisión de Alicante 2 y su emisor no eran públicos.`);
tarjeta('hausera-proximas-ofertas', 'Mínimo de inversión',
  `100 € según la FAQ de Hausera (${CORTA}); las condiciones de Alicante 2 están en su documento de emisión, aún no público.`,
  'https://hausera.io/faq/', null,
  'Preguntas frecuentes de Hausera, pestaña «Inversión» («El importe mínimo son 100€»), y su portada. Es una regla general de la plataforma: el documento de emisión de Alicante 2, que no es público, podría fijar otra cifra.');

// ---- Datos de tarjeta publicados de más de 120 caracteres: se acortan sin cambiar el dato, la fuente
// ni su fecha (revisión independiente de la entrega, R5).
const acorta = (slug, etiqueta, antes, nuevo) => {
  const r = documentos[slug].referencias.find(x => x.etiqueta === etiqueta);
  assert.equal(r?.valor, antes, `${slug}: «${etiqueta}» publicado`);
  assert.ok(antes.length > 120 && nuevo.length <= 120 && nuevo.length < antes.length, `${slug}: «${etiqueta}» acortado`);
  tarjeta(slug, etiqueta, nuevo, r.fuente, r.fechaDato, r.alcance.replace(PREFIJO, ''));
};
acorta('robinhood-classic-stock-tokens', 'Acceso desde España',
  'Disponible para residentes en España: Robinhood Europe está inscrita en la CNMV para operar en España (libre prestación, n.º 5299).',
  'Disponible para residentes en España: Robinhood Europe está inscrita en la CNMV en libre prestación (n.º 5299).');
acorta('robinhood-classic-stock-tokens', 'Salida',
  'Cierras la posición con Robinhood Europe (24/5 según su web; el horario ampliado no siempre está disponible); el cierre puede suspenderse',
  'Cierras con Robinhood Europe (24/5 según su web; horario ampliado no siempre disponible); el cierre puede suspenderse');
acorta('kraken-xstocks', 'Acceso desde España',
  'Según Kraken UE, disponible para sus clientes ubicados en la UE que superen su evaluación o sean inversores profesionales',
  'Según Kraken UE, disponible para sus clientes en la UE que superen su evaluación o sean inversores profesionales');
acorta('casa-de-outeiro', 'Salida',
  'Si no se llega a 2 M€, te devuelven el dinero; si sale, solo podrás vender un 2,5 % de tus acciones al año de 2027 a 2030',
  'Si no llega a 2 M€, te devuelven el dinero; si sale, solo podrás vender un 2,5 % de tus acciones al año de 2027 a 2030');

// ---------------------------------------------------------------- comprobaciones de los textos
// Tarjeta: castellano llano, sin citas literales de otro idioma, ≤ 120 caracteres en lo nuevo
// (máximo duro 160 en todo), y sin «por participación» en el mínimo (resumenOferta lo descarta).
const largasConservadas = [];
for (const [slug, d] of Object.entries(documentos)) {
  const cartas = d.referencias.filter(r => CANONICA.test(r.etiqueta));
  assert.deepEqual(cartas.map(r => r.etiqueta).filter(e => !tarjetaAntes[slug].includes(e)).sort(),
    (tarjetaNuevas[slug] || []).filter(e => !tarjetaAntes[slug].includes(e)).sort(), `${slug}: datos de tarjeta nuevos`);
  for (const r of cartas) {
    assert.equal(r.fechaConsulta, FECHA, `${slug}: consulta de hoy`);
    assert.ok(/^https:\/\/\S+$/.test(r.fuente) && d.fuentes.includes(r.fuente), `${slug}: fuente`);
    assert.ok(r.valor.length <= 160, `${slug}: «${r.etiqueta}» pasa del máximo duro (${r.valor.length})`);
    if ((tarjetaNuevas[slug] || []).includes(r.etiqueta)) assert.ok(r.valor.length <= 120, `${slug}: «${r.etiqueta}» pasa de 120 (${r.valor.length})`);
    else if (r.valor.length > 120) largasConservadas.push({ slug, etiqueta: r.etiqueta, caracteres: r.valor.length });
    assert.ok(['', 'es'].includes(idiomaCita(r.valor)), `${slug}: «${r.valor}» parece una cita en otro idioma`);
    if (/^M[ií]nimo/.test(r.etiqueta)) assert.doesNotMatch(r.valor.normalize('NFD').replace(/[̀-ͯ]/g, ''), /por (?:token|participacion|accion)/i);
  }
}
assert.deepEqual(largasConservadas, [], 'quedan datos de tarjeta de más de 120 caracteres');
for (const c of CAMBIOS) if (c.despues && c.campo === 'aviso') assert.ok(['', 'es'].includes(idiomaCita(c.despues)), `${c.slug}: aviso en otro idioma`);
// Fuentes técnicas (API, JSON o código .js): solo las que ya estaban o las que la entrega 2026-11-04 dejó
// anotadas («seQuedan»). El código .js se añadió tras la revisión independiente de la entrega (R2).
const API = /\/api\/|public-api\.|[?&]wt=json|\.json(?:$|\?)|\.js(?:$|\?)/;
const quedan = new Set(leer(path.resolve(DIR, '../2026-11-04-v2/fuentes-para-personas.json')).seQuedan.map(s => s.url));
const todas = lote => [...lote.e.flatMap(o => [o.url, ...o.fuentesActuales]), ...Object.values(lote.d).flatMap(d => [...d.fuentes, ...d.referencias.map(r => r.fuente)])];
const antesApi = new Set(todas({ e: escaparateBase.ofertas, d: docBase }).filter(u => API.test(u)));
assert.deepEqual([...new Set(todas({ e: ofertas, d: documentos }).filter(u => API.test(u) && !antesApi.has(u) && !quedan.has(u)))], [],
  'fuente técnica nueva (API, JSON o .js) sin anotar');
const CSP = /<style\b|\sstyle\s*=|\son[a-z]+\s*=|<script/i;
assert.ok(!CSP.test(JSON.stringify(documentos)) && !CSP.test(JSON.stringify(ofertas)), 'texto que la compuerta CSP rechazaría');

// ---------------------------------------------------------------- nada más cambia
// Cada diferencia con la 2026-11-04.2 tiene que estar en CAMBIOS (o ser una fecha de hoy).
{
  const dif = (a, b) => [...a.filter(x => !b.includes(x)), ...b.filter(x => !a.includes(x))];
  const CAMPOS = new Set(['verificadaEl', 'avisos', 'metricas', 'rentabilidad', 'resumen']);
  for (const o of ofertas) {
    const b = escaparateBase.ofertas.find(x => x.slug === o.slug), c = CAMBIOS.filter(x => x.slug === o.slug);
    for (const k of Object.keys(b)) if (!CAMPOS.has(k)) assert.deepEqual(o[k], b[k], `${o.slug}.${k} no debía cambiar`);
    assert.deepEqual(Object.keys(o), Object.keys(b));
    const av = dif(b.avisos.map(a => a.texto), o.avisos.map(a => a.texto)).sort();
    assert.deepEqual(av, c.filter(x => x.campo === 'aviso').flatMap(x => [x.antes, x.despues]).filter(Boolean).sort(), `${o.slug}: avisos`);
    assert.ok(o.avisos.every(a => a.verificadaEl === FECHA && a.tono === 'warn' && a.esAntiguedad === false), `${o.slug}: avisos con fecha de hoy`);
    const me = dif(b.metricas.map(m => `${m.etiqueta}: ${m.valor}`), o.metricas.map(m => `${m.etiqueta}: ${m.valor}`)).sort();
    assert.deepEqual(me, c.filter(x => x.campo === 'métrica').flatMap(x => [x.antes, x.despues]).sort(), `${o.slug}: métricas`);
    if (JSON.stringify(o.rentabilidad) !== JSON.stringify(b.rentabilidad)) assert.ok(c.some(x => x.campo === 'rentabilidad'));
    if (o.resumen !== b.resumen) assert.ok(c.some(x => x.campo === 'resumen'));
    const d = documentos[o.slug], db = docBase[o.slug];
    for (const k of Object.keys(db)) if (!['revisadaEl', 'referencias', 'fuentes', 'descripcion'].includes(k)) assert.deepEqual(d[k], db[k], `${o.slug}: documentación.${k}`);
    assert.deepEqual(Object.keys(d), Object.keys(db));
    if (d.descripcion !== db.descripcion) assert.ok(c.some(x => x.campo === 'resumen'));
    assert.deepEqual(d.fuentes.slice(0, db.fuentes.length), db.fuentes, `${o.slug}: fuentes de antes, intactas`);
    assert.deepEqual(d.fuentes.slice(db.fuentes.length), c.filter(x => x.campo === 'fuente de la ficha').map(x => x.despues));
    // Referencias: sin contar la fecha de consulta y el alcance de las de la tarjeta conservadas.
    const clave = r => `${r.etiqueta}: ${r.valor}`;
    const comp = r => JSON.stringify([r.etiqueta, r.valor, r.fechaDato, r.fuente, CANONICA.test(r.etiqueta) ? '' : r.alcance, CANONICA.test(r.etiqueta) ? '' : r.fechaConsulta]);
    const refsC = c.filter(x => /^referencia|^tarjeta/.test(x.campo));
    const tocadas = new Set(refsC.flatMap(x => [x.antes, x.despues]).filter(Boolean).map(t => t.split(': ')[0]));
    for (const r of db.referencias) if (!tocadas.has(r.etiqueta)) assert.ok(d.referencias.some(x => comp(x) === comp(r)), `${o.slug}: referencia «${clave(r)}» cambió sin anotar`);
    for (const r of d.referencias) if (!tocadas.has(r.etiqueta)) assert.ok(db.referencias.some(x => comp(x) === comp(r)), `${o.slug}: referencia «${clave(r)}» nueva sin anotar`);
    assert.equal(d.referencias.length, db.referencias.length + refsC.filter(x => !x.antes).length - refsC.filter(x => !x.despues).length);
  }
}

// ---------------------------------------------------------------- escaparate y manifiesto
const colecciones = { principales: 0, secundario: 0, en_camino: 0 };
for (const o of ofertas) colecciones[o.coleccion]++;
assert.deepEqual(colecciones, { principales: 8, secundario: 13, en_camino: 3 });
assert.deepEqual(colecciones, manifiestoBase.colecciones_esperadas);
const escaparate = {
  versionEsquema: 2,
  fuente: {
    notaOrigen: `Revisión del ${FES} (investigación del día pedida por Víctor): las 24 fichas revisadas con fuentes primarias, ` +
      'un expediente por oferta y revisión independiente por grupo; 9 candidatas investigadas y ninguna admitida; sin altas ni retiradas. ' +
      `Parte de la publicada ${PREVIA.slice(0, 8)} (entrega ${DESDE}). Las cifras se publican solo donde se leyeron en la fuente oficial; ` +
      'en reventa y próximas, la tarjeta enseña mínimo, acceso desde España y salida en castellano, con fuente y fecha.',
    actualizacionLocal: { verificadoEl: FECHA,
      archivo: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/contraste-${ETIQUETA}.json`, publicable: false,
      derechosImagenVerificados: false,
      nota: `Lote del ${FES} (entrega ${ETIQUETA}): 24 fichas comprobadas (8 principales, 13 de reventa y 3 en camino) y ${radar.plataformas.length} plataformas.` },
    actualizacionRadarLocal: { verificadoEl: FECHA,
      archivo: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/radar-canonico-26.json`, publicable: false,
      plataformas: radar.plataformas.length, fuentesPrimarias: radar.fuentes.length },
  },
  plataformas: radar.plataformas.map(p => ({ slug: p.slug, verificacionLocal: {
    verificadoEl: FECHA, conservaFechaCanonica: true,
    estadoOperativo: conFuentes(p.estadoOperativo), licenciaRegistro: conFuentes(p.licenciaRegistro),
    acceso: conFuentes(p.acceso), alertasCriticas: p.alertasCriticas.map(conFuentes),
  } })),
  ofertas,
};
// Plataformas: iguales a la base salvo las fechas, Pax Gold y las dos fuentes del REGAFI (que la base
// local aún tenía con la dirección de la API; el radar y el SQL ya usaban la página desde el 04/11).
{
  const hojas = (v, ruta = '', out = new Map()) => { if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) hojas(x, `${ruta}/${k}`, out); else out.set(ruta, v); return out; };
  const a = hojas(escaparateBase.plataformas), b = hojas(escaparate.plataformas);
  assert.deepEqual([...a.keys()], [...b.keys()], 'misma forma');
  const distintas = [...a.keys()].filter(k => a.get(k) !== b.get(k));
  const idDe = k => b.get(k.replace(/\/[^/]+$/, '/id'));
  for (const k of distintas) {
    if (/\/verificadoEl$/.test(k)) { assert.equal(b.get(k), FECHA); continue; }
    if (/\/fuentes\/\d+\/consultadaEl$/.test(k)) { assert.equal(b.get(k), FECHA); continue; }
    if (/\/fuentes\/\d+\/(url|titulo)$/.test(k) && idDe(k) === 'paxg-web') { assert.equal(b.get(k), cambiosRadar.fuentes['paxg-web'][k.endsWith('url') ? 'url' : 'titulo']); continue; }
    if (/\/fuentes\/\d+\/url$/.test(k) && ['spiko-regafi', 'spiko-regafi-pasaporte-es'].includes(idDe(k))) { assert.equal(b.get(k), fuentePorId.get(idDe(k)).url); continue; }
    const m = k.match(/^\/(\d+)\/verificacionLocal\/(acceso|estadoOperativo)\/detalle$/);
    if (m && escaparate.plataformas[m[1]].slug === 'pax-gold') { assert.equal(b.get(k), cambiosRadar.plataformas['pax-gold'][m[2]].detalle); continue; }
    assert.fail(`plataformas: cambio inesperado en ${k}`);
  }
}
const manifiesto = { ...manifiestoBase };
assert.deepEqual(manifiesto, { version_esquema: 2, plataformas_esperadas: 25, ofertas_esperadas: 24, colecciones_esperadas: colecciones });

escribir(path.join(DIR, 'radar-canonico-26.json'), radar);
escribir(path.join(DIR, 'escaparate-publicacion.json'), escaparate);
escribir(path.join(DIR, 'documentacion-ofertas.json'), documentos);
escribir(path.join(DIR, 'manifiesto-catalogo.json'), manifiesto);

// ---------------------------------------------------------------- SQL
const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: ETIQUETA, versionEsquema: 2 }));
assert.notEqual(nueva.revisionId, PREVIA, 'la revisión nueva tiene otra identidad');
assert.equal(nueva.fecha, FECHA);
const destino = path.join(ROOT, `rwadar-app/data/importaciones/catalogo-${ETIQUETA}-v2`);
escribir(path.join(destino, 'catalogo.sql'), nueva.sql);
const guarda = `do $guarda$
declare actual uuid; retirada boolean;
begin
  select revision_id into actual from rwadar_catalogo.publicacion_v2 where unica for update;
  if actual is null or actual not in ('${PREVIA}'::uuid, '${nueva.revisionId}'::uuid) then
    raise exception 'Publicación distinta de la revisión anterior prevista: %. No aplicar este lote.', actual;
  end if;
  if actual = '${PREVIA}'::uuid and not exists (select 1 from rwadar_catalogo.revisiones where id = '${PREVIA}'::uuid
    and contenido_sha256 = '${HASH_PREVIA}' and estado = 'aprobada') then
    raise exception 'La revisión publicada no tiene la identidad prevista o no está aprobada. No aplicar este lote.';
  end if;
  select retirado into retirada from public.catalogo_publicacion where unica for update;
  if retirada is distinct from false then
    raise exception 'Catálogo retirado o control ausente: este lote no autoriza reactivarlo.';
  end if;
  if current_date < date '${HOY}' then raise exception 'Revisión futura'; end if;
  if current_date > date '${ULTIMO}' then
    raise exception 'Lote caducado: sus fichas valían hasta el ${ULTIMO.split('-').reverse().join('/')}. No aplicar este lote.';
  end if;
  if exists (select 1 from rwadar_catalogo.revisiones where id = '${nueva.revisionId}'::uuid
    and (contenido_sha256 <> '${nueva.hash}' or estado = 'retirada')) then
    raise exception 'La revisión destino existe con otra identidad o está retirada';
  end if;
end $guarda$;
`;
const aprobar = `do $aprobar$
declare v uuid := '${nueva.revisionId}';
begin
  if (select count(*) from rwadar_catalogo.plataformas where revision_id = v) <> ${escaparate.plataformas.length}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v) <> ${ofertas.length}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'principales') <> ${colecciones.principales}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'secundario') <> ${colecciones.secundario}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'en_camino') <> ${colecciones.en_camino} then
    raise exception 'Catálogo incompleto: se conserva el lote anterior';
  end if;
  update rwadar_catalogo.revisiones set estado = 'aprobada', aprobada_el = now(),
    aprobada_referencia = 'Entrega ${ETIQUETA}: radar (67 fuentes) y 24 fichas comprobados el ${FES} con fuentes primarias, expediente por oferta y revisión independiente; mismas 24 ofertas (8/13/3) y 25 plataformas. Investigación pedida por Víctor el ${FES}; ciclo autorizado por su orden.'
    where id = v and estado = 'borrador';
  if not exists (select 1 from rwadar_catalogo.revision_publicable_v2 where id = v) then
    raise exception 'Entrega no publicable: se deshace la transacción completa';
  end if;
  if (select revision_id from rwadar_catalogo.publicacion_v2 where unica) is distinct from v then
    raise exception 'La revisión nueva no quedó publicada: se deshace la transacción completa';
  end if;
end $aprobar$;
`;
const archivo = path.join(destino, 'aplicar-y-aprobar.sql');
escribir(archivo,
  `-- Entrega ${ETIQUETA} (preparada el ${FES}) sobre la revisión publicada ${DESDE} (${PREVIA}). Ciclo pedido y autorizado por Víctor.\n` +
  `-- Radar y 24 fichas comprobados hoy; ${escaparate.plataformas.length} plataformas y ${ofertas.length} ofertas (8/13/3). Solo escribe en rwadar_catalogo.\n` +
  `-- Generado por rwadar-app/data/verificaciones/${ETIQUETA}-v2/preparar-entrega.mjs; revisar antes de aplicar.\n` +
  nueva.sql.replace('-- El lote entra como BORRADOR. Este fichero nunca lo aprueba ni lo publica.',
    '-- Este aplicador importa y aprueba al final, únicamente si pasan todas las guardas.')
    .replace('begin;', () => 'begin isolation level serializable;\n' + guarda)
    .replace(/commit;\n$/, () => aprobar + 'commit;\n'));
{
  const sql = fs.readFileSync(archivo, 'utf8');
  assert.doesNotMatch(sql, /^\s*(?:insert\s+into|update|delete\s+from)\s+public\./im, 'hoy no se escribe en public.*');
  assert.doesNotMatch(sql, /^\s*(?:truncate|alter|drop|grant|revoke|create)\b/im, 'sin DDL ni permisos');
}
escribir(path.join(destino, 'revision.json'), { versionEsquema: 2, revisionId: nueva.revisionId, hash: nueva.hash,
  revisionAnterior: PREVIA, hashRevisionAnterior: HASH_PREVIA, revisionAnteriorComprobadaEnRemoto: true,
  lecturaPublica: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/lectura-publica/`, etiqueta: ETIQUETA, fechaRadar: FECHA,
  revisionDocumental: HOY, plataformas: escaparate.plataformas.length, ofertas: ofertas.length, colecciones,
  vigenciaDias: 7, venceTrasEl: ULTIMO, nuevasAltas: 0, retiradas: 0, tablasPublicas: [],
  estado: 'borrador', aplicadoEnRemoto: false, publicacionWeb: false });

// ---------------------------------------------------------------- contraste (lo que cambia)
const tarjetas = Object.fromEntries(Object.entries(documentos).map(([slug, d]) => [slug,
  Object.fromEntries(d.referencias.filter(r => CANONICA.test(r.etiqueta)).map(r => [r.etiqueta, r.valor]))]));
escribir(path.join(DIR, `contraste-${ETIQUETA}.json`), { tipo: 'revision_integral', fecha: FECHA, etiqueta: ETIQUETA,
  revisionAnterior: PREVIA, revisionNueva: nueva.revisionId,
  decision: `Víctor, ${FES}: «Hazme la investigación de hoy de las ofertas, y actualiza la web y la app». Lo que entra: DECISIONES-COORDINADOR.md.`,
  archivos: Object.fromEntries(['DECISIONES-COORDINADOR.md', `radar-contraste-${FECHA}.json`, 'cambios-radar.json']
    .map(n => [n, sha(path.join(DIR, n))])),
  radar: { fuentes: contraste.fuentes, correctas: contraste.correctas, verificacionesManuales: Object.keys(cambiosRadar.verificacionesManuales),
    cambios: { fuentes: { 'paxg-web': { antes: cambiosRadar.fuentes['paxg-web'].antes.url, despues: cambiosRadar.fuentes['paxg-web'].url } },
      plataformas: { 'pax-gold': Object.keys(cambiosRadar.plataformas['pax-gold']) } } },
  cifras: Object.fromEntries(Object.entries(SPIKO).map(([s, v]) => [s, { antes: v.antes, despues: v.pct, valorLiquidativo: '2026-11-04', consulta: FECHA }])),
  vigencia: { verificadaEl: FECHA, vigenciaDias: 7, ultimoDiaVigente: ULTIMO },
  cambios: CAMBIOS, tarjetaConservadasDeMasDe120: largasConservadas, tarjetas,
  sinCambios: ['las 25 plataformas del radar, salvo la fuente y dos textos de Pax Gold y las fechas de consulta',
    'public.plataformas y public.fuentes (el SQL no las toca)', 'colecciones 8/13/3, estados de revisión e imágenes'],
  altas: [], retiradas: [], colecciones });
console.log(JSON.stringify({ etiqueta: ETIQUETA, revisionId: nueva.revisionId, hash: nueva.hash, previa: PREVIA, sha256: sha(archivo),
  plataformas: escaparate.plataformas.length, fuentesRadar: radar.fuentes.length, ofertas: ofertas.length, colecciones, cambios: CAMBIOS.length }));

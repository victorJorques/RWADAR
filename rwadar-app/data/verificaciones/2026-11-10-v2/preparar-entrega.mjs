// Entrega del catálogo «2026-11-10»: investigación del día pedida por Víctor («Hazme la investigación
// en profundidad de RWAdar buscando nuevas ofertas y publica la actualización de hoy»). Preparación
// LOCAL: sin red ni servicios remotos. Reproducible byte a byte: ninguna salida depende de la hora.
//
//   node rwadar-app/data/verificaciones/2026-11-10-v2/preparar-entrega.mjs
//
// Parte exactamente de la revisión publicada 88d5a757 (entrega 2026-11-05.2), leída hoy como
// visitante (lectura-publica/), y aplica SOLO lo que dice DECISIONES-COORDINADOR.md (lista cerrada):
// 1. Radar: las 69 fuentes comprobadas hoy (radar-contraste-2026-11-10.json, 69/69). cambios-radar.json
//    no cambia ninguna dirección ni ningún texto: solo tres lecturas a mano y la comprobación de
//    spiko-access (ya en data/comprobaciones-fuentes.json).
// 2. Las 22 fichas, revisadas hoy con fuentes primarias (expedientes/) y revisión independiente por
//    grupo (revision-independiente/): verificadaEl 10/11, 7 días de vigencia (último día el 17/11),
//    avisos con fecha de hoy y los cambios por oferta de DECISIONES. Cada texto «antes» se exige tal
//    cual: si no está, el script falla.
// 3. Tres datos de la tarjeta (etiqueta fija): los publicados se conservan con consulta del 10/11; los
//    que cambian se reescriben en castellano llano, con fuente y fecha.
// Hoy NO se toca public.plataformas ni public.fuentes: el SQL solo escribe en rwadar_catalogo.
// Sin altas ni retiradas: 22 ofertas (8/13/1) y 25 plataformas.
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
const ETIQUETA = '2026-11-10', FECHA = '2026-11-10', DESDE = '2026-11-05.2', HOY = '2026-11-10';
const FES = '10/11/2026', CORTA = '10/11';
const ULTIMO = '2026-11-17'; // último día vigente: verificadaEl 10/11 y 7 días
const PREVIA = '88d5a757-3481-f70e-dc7c-6272704a00b3';
const HASH_PREVIA = '88d5a7573481f70edc7c6272704a00b3963248fcf32943caba65a10b86f789a8';
const ULTIMO_PREVIA = '2026-11-12';
const COLECCIONES = { principales: 8, secundario: 13, en_camino: 1 };
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const escribir = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); };
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base = path.resolve(DIR, `../${DESDE}-v2`);

// ---------------------------------------------------------------- partida: la publicada
const previa = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: DESDE, versionEsquema: 2 }));
assert.equal(previa.revisionId, PREVIA, `la ${DESDE} local no es la revisión publicada`);
assert.equal(previa.hash, HASH_PREVIA, `identidad (huella) de la ${DESDE}`);
const revisionDesde = leer(path.join(ROOT, `rwadar-app/data/importaciones/catalogo-${DESDE}-v2/revision.json`));
assert.deepEqual([revisionDesde.revisionId, revisionDesde.hash, revisionDesde.venceTrasEl], [PREVIA, HASH_PREVIA, ULTIMO_PREVIA]);
const snapshot = leerBloquesCatalogo(fs.readFileSync(path.join(ROOT, 'rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8'));
assert.ok([...snapshot.plataformas, ...snapshot.ofertas].every(x => x.revisionId === PREVIA), 'el catálogo sincronizado de la web no es la 88d5a757');
assert.deepEqual([snapshot.plataformas.length, snapshot.ofertas.length], [25, 22]);
const radarBase = leer(path.join(base, 'radar-canonico-26.json'));
const escaparateBase = leer(path.join(base, 'escaparate-publicacion.json'));
const docBase = leer(path.join(base, 'documentacion-ofertas.json'));
const manifiestoBase = leer(path.join(base, 'manifiesto-catalogo.json'));

// Lo leído hoy como visitante (lectura-publica/, 08:58:11–08:58:14 UTC) es exactamente la base local.
const lp = path.join(DIR, 'lectura-publica');
const pubO = leer(path.join(lp, 'ofertas-v2.json')), pubP = leer(path.join(lp, 'plataformas-v2.json'));
const pubT = leer(path.join(lp, 'plataformas-todas.json'));
assert.ok([...pubO, ...pubP].every(x => x.revision_id === PREVIA), 'la publicada leída hoy es la 88d5a757');
assert.equal(pubO.length, escaparateBase.ofertas.length); assert.equal(pubP.length, escaparateBase.plataformas.length);
for (const o of pubO) {
  const b = escaparateBase.ofertas.find(x => x.slug === o.slug);
  assert.ok(b, `${o.slug}: no está en la base local`);
  assert.deepEqual(o.documentacion, docBase[o.slug], `${o.slug}: documentación publicada = base local`);
  assert.deepEqual(o.fuentes_actuales, b.fuentesActuales, `${o.slug}: fuentes`);
  assert.deepEqual([o.coleccion, o.verificada_el, o.vigencia_dias, o.estado_revision], [b.coleccion, b.verificadaEl, b.vigenciaDias, b.estadoRevision], `${o.slug}: colección, fecha y estado`);
  // mTBILL (fuentes en conflicto) sale enmascarada en la vista; las demás, con sus avisos tal cual.
  if (o.estado_revision !== 'fuentes_en_conflicto') assert.deepEqual(o.avisos, b.avisos, `${o.slug}: avisos publicados = base local`);
}
const fuenteRadarBase = new Map(radarBase.fuentes.map(f => [f.id, { id: f.id, tipo: f.tipo, titulo: f.titulo, url: f.url,
  primaria: true, consultadaEl: f.consultadaEl }]));
const ordenar = v => JSON.parse(JSON.stringify(v), (k, x) => k === 'publicadaEl' ? undefined
  : k === 'fuentes' && Array.isArray(x) ? [...x].map(f => fuenteRadarBase.get(f.id) || f).sort((a, b) => (a.id < b.id ? -1 : 1)) : x);
for (const p of pubP) assert.deepEqual(ordenar(p.verificacion_local),
  ordenar(escaparateBase.plataformas.find(x => x.slug === p.slug).verificacionLocal), `${p.slug}: verificación publicada = base local`);
assert.deepEqual(pubT.filter(p => p.estado === 'en_radar').map(p => p.slug).sort(), escaparateBase.plataformas.map(p => p.slug).sort(),
  'public.plataformas en el radar = las 25 del lote');
assert.equal(pubT.filter(p => p.estado === 'descartada').length, 5);
assert.deepEqual(manifiestoBase, { version_esquema: 2, plataformas_esperadas: 25, ofertas_esperadas: 22, colecciones_esperadas: COLECCIONES });

// ---------------------------------------------------------------- 1 · radar
const contrasteRuta = path.join(DIR, `radar-contraste-${FECHA}.json`), cambiosRadarRuta = path.join(DIR, 'cambios-radar.json');
const contraste = leer(contrasteRuta), cambiosRadar = leer(cambiosRadarRuta);
const radar = structuredClone(radarBase);
assert.ok(contraste.fecha === FECHA && contraste.fuentes === radar.fuentes.length && contraste.correctas === radar.fuentes.length &&
  !contraste.bloqueos.length, 'el radar no está comprobado hoy al completo: no se monta el lote');
assert.equal(radar.fuentes.length, 69);
assert.deepEqual(contraste.contraste.map(c => c.id), radar.fuentes.map(f => f.id), 'el contraste cubre las 69 fuentes, en orden');
assert.deepEqual(contraste.contraste.map(c => c.url), radar.fuentes.map(f => f.url), 'el contraste se hizo sobre las mismas direcciones');
assert.ok(contraste.contraste.every(c => c.ok));
assert.equal(cambiosRadar.fecha, FECHA);
assert.deepEqual([cambiosRadar.fuentes, cambiosRadar.plataformas], [{}, {}], 'hoy no cambia ninguna dirección ni ningún texto del radar');
const COMPROBACIONES = leer(path.join(ROOT, 'rwadar-app/data/comprobaciones-fuentes.json')).fuentes;
const plano = t => t.replace(/[\s  ]+/g, ' ');
const cumple = (id, texto) => COMPROBACIONES[id].every(p => new RegExp(p, 'i').test(plano(texto)));
assert.deepEqual(Object.keys(cambiosRadar.comprobacionesCambiadas), ['spiko-access']);
{
  const c = cambiosRadar.comprobacionesCambiadas['spiko-access'];
  assert.deepEqual(c.antes, ['19183', 'ORIAS', 'CACEIS']);
  assert.deepEqual(COMPROBACIONES['spiko-access'], c.ahora, 'spiko-access: comprobaciones-fuentes.json ya tiene las de hoy');
  const pie = fs.readFileSync(path.join(DIR, 'radar-manual/spiko-web3-pie-legal.txt'), 'utf8');
  // El pie legal de hoy ya no nombra ORIAS; la frase de suscripción y reembolso está en el cuerpo de la página.
  assert.ok(/19183/.test(pie) && /CACEIS/.test(pie) && !/ORIAS/i.test(pie), 'spiko-access: copia de hoy del pie legal');
  const lit = contraste.contraste.find(x => x.id === 'spiko-access').literales.join(' ');
  assert.ok(cumple('spiko-access', lit), 'spiko-access: la captura de hoy dice lo que respalda');
}
assert.deepEqual(Object.keys(cambiosRadar.verificacionesManuales), ['spiko-regafi', 'spiko-regafi-pasaporte-es', 'paxg-occ']);
for (const [id, m] of Object.entries(cambiosRadar.verificacionesManuales)) {
  const c = contraste.contraste.find(x => x.id === id);
  assert.ok(c.ok && c.manual === m.motivo && c.urlLeida === m.url, `${id}: el contraste recoge la lectura a mano`);
  assert.deepEqual(c.literales, m.literales, `${id}: literales`);
  assert.match(m.metodo, /10\/11\/2026/);
}
{
  const copia = path.join(DIR, 'radar-manual/regafi-spiko-pasaporte-espagne.json');
  assert.equal(sha(copia), 'fdf10d2d445b2cc90fec0c31215cd065cdab7c0a325cba03fceb47d2a7de66c6', 'copia del pasaporte de REGAFI');
  const t = plano(fs.readFileSync(copia, 'utf8'));
  for (const l of ['"type_passeport": "Libre prestation de services"', '"pays": "ESPAGNE"', '"date_debut": "2026-01-08"'])
    assert.ok(t.includes(l), `REGAFI: falta ${l}`);
  const occ = plano(fs.readFileSync(path.join(DIR, 'radar-manual/occ-trust-by-name.txt'), 'utf8'));
  assert.ok(occ.includes('Trust Banks Active As of 9/30/2026') && /25379 Paxos Trust Company, National Association/.test(occ), 'OCC: lista con Paxos');
}
radar.verificadoEl = FECHA;
radar.alcance = `Revisión editorial de fuentes primarias del ${FES}: las ${radar.fuentes.length} fuentes del radar se volvieron a ` +
  'consultar sin sesión y siguen diciendo lo que respaldan (las dos del registro REGAFI de la ACPR, por su API pública, porque la ' +
  'página cargaba sin datos; la lista de la OCC, con curl). No acredita onboarding, oferta abierta ni rentabilidad.';
assert.ok(radar.alcance.length >= 20 && radar.alcance.length <= 500, 'origen de la revisión: entre 20 y 500 caracteres');
radar.fuentes = radar.fuentes.map(f => ({ ...f, consultadaEl: FECHA }));
{ // Nada más cambia en el radar: solo la fecha, el alcance y la consulta de cada fuente.
  const r = structuredClone(radar);
  r.verificadoEl = radarBase.verificadoEl; r.alcance = radarBase.alcance;
  r.fuentes = r.fuentes.map((f, i) => ({ ...f, consultadaEl: radarBase.fuentes[i].consultadaEl }));
  assert.deepEqual(r, radarBase, 'radar: solo la fecha, el alcance y la consulta de las fuentes');
}
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
  const o = oferta(slug), i = unico(o.avisos, a => a.texto === viejo, `${slug}: aviso «${viejo}»`);
  assert.notEqual(nuevo, viejo);
  anota(slug, 'aviso', viejo, nuevo);
  o.avisos[i] = { ...o.avisos[i], texto: nuevo };
};
const avisoQuita = (slug, viejo) => {
  const o = oferta(slug), i = unico(o.avisos, a => a.texto === viejo, `${slug}: aviso «${viejo}»`);
  anota(slug, 'aviso', viejo, null);
  o.avisos.splice(i, 1);
};
const metrica = (slug, etiqueta, valor, nueva) => {
  const o = oferta(slug), i = unico(o.metricas, m => m.etiqueta === etiqueta, `${slug}: métrica «${etiqueta}»`);
  assert.equal(o.metricas[i].valor, valor, `${slug}: métrica «${etiqueta}» «antes»`);
  assert.notDeepEqual(o.metricas[i], nueva, `${slug}: la métrica «${etiqueta}» no cambia`);
  anota(slug, 'métrica', `${etiqueta}: ${valor}`, `${nueva.etiqueta}: ${nueva.valor}`);
  o.metricas[i] = nueva;
};
const conFuente = (slug, url) => { const d = documentos[slug]; assert.match(url, /^https:\/\/\S+$/);
  if (!d.fuentes.includes(url)) { d.fuentes.push(url); anota(slug, 'fuente de la ficha', null, url); } };
const refIndice = (slug, etiqueta, valor) => unico(documentos[slug].referencias,
  r => r.etiqueta === etiqueta && (valor === undefined || r.valor === valor), `${slug}: referencia «${etiqueta}»${valor === undefined ? '' : ` = «${valor}»`}`);
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
const resumenCambia = (slug, viejo, nuevo) => {
  const o = oferta(slug), d = documentos[slug];
  assert.equal(o.resumen, viejo, `${slug}: resumen «antes»`);
  assert.ok(d.descripcion.startsWith(viejo + ' '), `${slug}: la descripción empieza por el resumen`);
  o.resumen = nuevo; d.descripcion = nuevo + d.descripcion.slice(viejo.length);
  anota(slug, 'resumen', viejo, nuevo);
};

// Todas las fichas se revisaron hoy con sus fuentes primarias (un expediente por oferta).
const expedientes = {};
for (const o of ofertas) {
  const exp = expedientes[o.slug] = leer(path.join(DIR, 'expedientes', `${o.slug}.json`));
  assert.equal(exp.slug, o.slug); assert.equal(exp.tipoExpediente, 'publicada');
  assert.ok(['mantener', 'actualizar'].includes(exp.decision), `${o.slug}: decisión ${exp.decision}`);
  assert.ok(exp.consulta.inicioUtc.startsWith(FECHA), `${o.slug}: expediente de hoy`);
  assert.equal(exp.propuestaTarjeta.coleccion ?? o.coleccion, o.coleccion, `${o.slug}: misma colección`);
  o.verificadaEl = FECHA;
  o.vigenciaDias = 7;
  o.avisos = o.avisos.map(a => ({ ...a, verificadaEl: FECHA }));
}
for (const slug of Object.keys(documentos)) documentos[slug].revisadaEl = FECHA;
const textoAviso = a => typeof a === 'string' ? a : a.texto;

// Tres datos de la tarjeta: etiqueta fija (normas del 03/11). Los publicados se conservan con
// consulta del 10/11 salvo los que cambian abajo, que se reescriben con fuente y fecha.
const CANONICA = /^(?:M[ií]nimo de inversi[oó]n|Acceso desde Espa[ñn]a|Salida|Reembolso)(?: \([^)]{1,60}\))?$/;
const PREFIJO = /^(?:Comprobado de nuevo en la fuente el \d{2}\/\d{2}\/\d{4}(?: \([^)]*\))?\.|Redacción en castellano del dato comprobado en la fuente el \d{2}\/\d{2}\/\d{4}\.)\s*/;
const tarjetaAntes = {};
for (const [slug, d] of Object.entries(documentos)) {
  tarjetaAntes[slug] = d.referencias.filter(r => CANONICA.test(r.etiqueta)).map(r => r.etiqueta);
  d.referencias = d.referencias.map(r => !CANONICA.test(r.etiqueta) ? r : { ...r, fechaConsulta: FECHA,
    alcance: `Comprobado de nuevo en la fuente el ${FES}. ${r.alcance.replace(PREFIJO, '')}`.trim() });
}
const tarjetaNuevas = {};
const tarjeta = (slug, etiqueta, valor, fuente, fechaDato, nota, antes) => {
  assert.ok(CANONICA.test(etiqueta), `${slug}: etiqueta fija`);
  const r = REF(etiqueta, valor, fuente, fechaDato, `Redacción en castellano del dato comprobado en la fuente el ${FES}. ${nota}`.trim());
  const d = documentos[slug], i = d.referencias.findIndex(x => x.etiqueta === etiqueta);
  if (i >= 0) {
    assert.equal(d.referencias.filter(x => x.etiqueta === etiqueta).length, 1);
    assert.equal(d.referencias[i].valor, antes, `${slug}: «${etiqueta}» publicado`);
    assert.notEqual(valor, antes, `${slug}: «${etiqueta}» no cambia`);
    anota(slug, 'tarjeta', `${etiqueta}: ${d.referencias[i].valor}`, `${etiqueta}: ${valor}`);
    d.referencias[i] = r;
  } else {
    assert.equal(antes, null, `${slug}: «${etiqueta}» no estaba publicado`);
    d.referencias.push(r); anota(slug, 'tarjeta', null, `${etiqueta}: ${valor}`);
  }
  conFuente(slug, fuente);
  (tarjetaNuevas[slug] ||= []).push(etiqueta);
};

// ---- Spiko: rendimiento publicado con el valor liquidativo del 09/11 (consulta y recálculo del 10/11).
const SPIKO = {
  'spiko-letras-del-tesoro-euro': { antes: '2,39 %', pct: '2,44 %', metrica: 'Rentabilidad publicada · 31 días · 04/11/2026',
    nueva: 'Rentabilidad publicada · 31 días · 09/11/2026', ref: 'Rentabilidad publicada · 31 días', web: 'https://data.spiko.io/eutbl/',
    alcance: `Rendimiento neto anualizado de 31 días que publica Spiko (valor liquidativo del 09/11/2026, consultado el ${FES} y recalculado ese día con los valores liquidativos del 08/10 y del 09/11: 1,060378 € → 1,062624 €). Variable y no garantizado.` },
  'spiko-letras-del-tesoro-dolar': { antes: '3,99 %', pct: '4,09 %', metrica: 'Rentabilidad publicada · 31 días · 04/11/2026 · en USD',
    nueva: 'Rentabilidad publicada · 31 días · 09/11/2026 · en USD', ref: 'Rentabilidad publicada · 31 días', web: 'https://data.spiko.io/ustbl/',
    alcance: `Rendimiento neto anualizado en dólares de 31 días que publica Spiko (valor liquidativo del 09/11/2026, consultado el ${FES} y recalculado ese día con los valores liquidativos del 09/10 y del 09/11: 1,098694 $ → 1,102439 $). No incluye la variación del euro frente al dólar. Variable y no garantizado.` },
  'spiko-smart-cash-euro': { antes: '2,84 %', pct: '2,84 %', metrica: 'Rentabilidad publicada · neta y variable · 04/11/2026',
    nueva: 'Rentabilidad publicada · neta y variable · 09/11/2026', ref: 'Rendimiento neto publicado', web: 'https://data.spiko.io/safo-eur',
    alcance: `Lo que creció el fondo en su último día de cálculo (valor liquidativo del 09/11/2026), pasado a un año y neto de comisiones, según publica Spiko; consultado el ${FES}. Variable: sigue al €STR.` },
};
for (const [slug, s] of Object.entries(SPIKO)) {
  const o = oferta(slug), prop = expedientes[slug].propuestaTarjeta.rentabilidad;
  assert.equal(o.rentabilidad.mostrada, s.antes, `${slug}: rentabilidad «antes»`);
  assert.equal(prop.mostrada, s.pct, `${slug}: el expediente da otra cifra`);
  assert.ok(prop.literal.includes('09/11/2026') && prop.literal.includes(`consultado el ${FES}`) && !prop.literal.includes('04/11/2026'), `${slug}: literal del expediente`);
  assert.deepEqual(expedientes[slug].propuestaTarjeta.metricas.find(m => m.etiqueta === s.nueva), { etiqueta: s.nueva, valor: s.pct }, `${slug}: métrica del expediente`);
  anota(slug, 'rentabilidad', `${o.rentabilidad.mostrada} · ${o.rentabilidad.literal}`, `${prop.mostrada} · ${prop.literal}`);
  o.rentabilidad = { mostrada: prop.mostrada, literal: prop.literal };
  metrica(slug, s.metrica, s.antes, { etiqueta: s.nueva, valor: s.pct });
  refCambia(slug, s.ref, s.antes, { valor: s.pct, fechaDato: '2026-11-09', fechaConsulta: FECHA, fuente: s.web, alcance: s.alcance });
}
// Dólar: el aviso del límite del 10 % dice también lo que dice la web (opción del revisor).
avisoCambia('spiko-letras-del-tesoro-dolar',
  'Capital no garantizado; el reembolso puede limitarse si las solicitudes superan el 10 % del patrimonio.',
  'Capital no garantizado; el reembolso puede limitarse si las solicitudes superan el 10 % del patrimonio, aunque la web de Spiko diga que no hay límite de importe.');
// Spiko Euro: la AMF ya publica la ficha del fondo en GECO (c124199).
const GECO = 'https://geco.amf-france.org/produit-d-epargne/c124199';
avisoQuita('spiko-smart-cash-euro', 'El enlace de la web de Spiko para «Verificar la autorización» lleva a la base pública de la AMF (GECO), pero allí este fondo todavía no tiene ficha publicada. Su autorización consta en el folleto que publica la AMF y en un certificado de la AMF que aloja Spiko.');
metrica('spiko-smart-cash-euro', 'Supervisor',
  'AMF (Francia): n.º SCV20260075, aún sin ficha pública en su base GECO · Spiko SICAV inscrita en la CNMV (n.º 2380); la CNMV no muestra qué fondos de la SICAV están dados de alta en España',
  { etiqueta: 'Supervisor', valor: 'AMF (Francia): n.º SCV20260075, autorizado el 17/02/2026 (ficha en su base GECO, aún sin clases de acciones ni valor liquidativo) · Spiko SICAV inscrita en la CNMV (n.º 2380); la CNMV no muestra qué fondos de la SICAV están dados de alta en España' });
assert.deepEqual(expedientes['spiko-smart-cash-euro'].propuestaTarjeta.metricas.find(m => m.etiqueta === 'Supervisor'),
  oferta('spiko-smart-cash-euro').metricas.find(m => m.etiqueta === 'Supervisor'), 'Spiko Euro: Supervisor = expediente');
{
  const slug = 'spiko-smart-cash-euro', d = documentos[slug];
  const viejo = 'autorizado por la AMF con el n.º SCV20260075 (así figura en un certificado de la AMF del 23/02/2026)';
  const nuevo = 'autorizado por la AMF el 17/02/2026 con el n.º SCV20260075 (ficha pública en GECO y certificado de la AMF del 23/02/2026)';
  assert.equal(d.descripcion.split(viejo).length, 2, `${slug}: descripción «antes»`);
  d.descripcion = d.descripcion.replace(viejo, nuevo);
  anota(slug, 'descripción', viejo, nuevo);
  refCambia(slug, 'Aprobación del compartimento', 'AMF, SCV20260075 (certificado del 23/02/2026)', {
    valor: 'Autorizado por la AMF el 17/02/2026 con el n.º SCV20260075 (ficha pública en GECO y certificado de la AMF del 23/02/2026)',
    fechaDato: '2026-02-17', fechaConsulta: FECHA, fuente: GECO,
    alcance: `Ficha pública del compartimento en la base GECO de la AMF, consultada el ${FES}: n.º SCV20260075, autorizado el 17/02/2026, vivo y abierto a todos los suscriptores; aún sin clases de acciones ni valor liquidativo. Lo confirma el certificado de la AMF del 23/02/2026 que aloja Spiko. No dice en qué países se comercializa.` });
}
// La retirada del aviso no toca el aviso 2 ni el acceso desde España (nadie confirma ni niega la venta en España).
assert.ok(oferta('spiko-smart-cash-euro').avisos.some(a => a.texto.startsWith('Spiko dice que se puede contratar desde España, pero no hemos podido confirmar')));

// ---- mTBILL: valor por token del oráculo del emisor (ronda 491, 09/11 14:23 UTC, leída el 10/11).
metrica('mtbill', 'Valor por token · 04/11/2026', '1,0773 USD (oráculo del emisor)',
  { etiqueta: 'Valor por token · 09/11/2026', valor: '1,0776 USD (oráculo del emisor)' });
assert.deepEqual(expedientes.mtbill.propuestaTarjeta.metricas.find(m => m.etiqueta === 'Valor por token · 09/11/2026'),
  { etiqueta: 'Valor por token · 09/11/2026', valor: '1,0776 USD (oráculo del emisor)' });
assert.equal(oferta('mtbill').estadoRevision, 'fuentes_en_conflicto', 'mTBILL sigue en conflicto (límites de reembolso)');

// ---- Aktionariat, Boss Info y Switzerlend: fechas al 10/11 y la operación nueva de Boss Info.
const SIN_FINMA = f => `Sin supervisión prudencial: no figura en el registro de autorizados de FINMA (${f})`;
metrica('aktionariat', 'Precio del emisor · 05/11/2026', '7,25 CHF por acción (fijo)', { etiqueta: `Precio del emisor · ${FES}`, valor: '7,25 CHF por acción (fijo)' });
metrica('aktionariat', 'Supervisor', SIN_FINMA('05/11/2026'), { etiqueta: 'Supervisor', valor: SIN_FINMA(FES) });
avisoCambia('aktionariat', 'Entre accionistas hay vendedores por debajo del precio del emisor (6,20 ZCHF frente a 7,25 CHF el 05/11/2026).',
  `Entre accionistas hay vendedores por debajo del precio del emisor (6,20 ZCHF frente a 7,25 CHF el ${FES}).`);

{
  const slug = 'boss-info', exp = expedientes[slug].propuestaTarjeta;
  const viejo = 'Acciones tokenizadas de Boss Info AG, integrador informático suizo. El emisor vende a 8,50 por acción, pero la última operación fue en el mercado entre accionistas a 6,70 el 28/09/2026.';
  const delExpediente = 'Acciones tokenizadas de Boss Info AG, integrador informático suizo. El emisor vende a 8,50, pero nadie le compra desde el 29/06/2026; la última operación fue entre accionistas, 1 acción a 8,40 el 05/11/2026.';
  assert.equal(exp.resumen, delExpediente, `${slug}: resumen del expediente`);
  // Con la moneda (recomendación del revisor): 8,50 CHF del emisor y 8,40 ZCHF entre accionistas.
  const nuevo = delExpediente.replace('vende a 8,50,', 'vende a 8,50 CHF,').replace('a 8,40 el 05/11/2026', 'a 8,40 ZCHF el 05/11/2026');
  assert.notEqual(nuevo, delExpediente);
  resumenCambia(slug, viejo, nuevo);
  refQuita(slug, 'Último cruce publicado', '6,70 CHF');
  refQuita(slug, 'Última operación publicada · 22/10/2026', '6,70 CHF (28/09/2026)');
  refQuita(slug, 'Último cruce secundario · 22/10/2026', '6,70 ZCHF (28/09/2026)');
  refNueva(slug, REF(`Última operación · ${FES}`, '8,40 ZCHF (1 acción, 05/11/2026)', 'https://shares.bossinfo.com/', '2026-11-05',
    `Última operación del mercado entre accionistas que enseña el portal del emisor (consultado el ${FES}): 1 acción a 8,40 ZCHF el 05/11/2026 a las 13:35 UTC; comprobada también en la cadena de bloques (quien vendió recibió 8,2404 ZCHF; la diferencia, el 1,9 %, es la comisión). La anterior era del 28/09/2026 (474 acciones a 6,70 ZCHF).`));
  avisoCambia(slug, 'El precio del emisor está por encima de la mejor oferta de venta entre accionistas.',
    `El precio del emisor está por encima de la mejor oferta de venta entre accionistas (venta más barata 8,40 ZCHF el ${FES}).`);
  const r = documentos[slug].referencias.find(x => x.etiqueta === 'Mínimo de inversión');
  assert.equal(exp.resumenTarjeta.minimo, `100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF el ${CORTA})`);
  tarjeta(slug, 'Mínimo de inversión', exp.resumenTarjeta.minimo, r.fuente, FECHA, r.alcance.replace(PREFIJO, ''),
    '100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF el 05/11)');
  metrica(slug, 'Supervisor', SIN_FINMA('05/11/2026'), { etiqueta: 'Supervisor', valor: SIN_FINMA(FES) });
}
{
  const slug = 'switzerlend';
  avisoCambia(slug, 'Su web dice que el emisor recompra acciones si tiene liquidez, pero el acuerdo firmado no le obliga y el 05/11/2026 la recompra seguía desactivada y casi sin fondos (0,03 ZCHF).',
    `Su web dice que el emisor recompra acciones si tiene liquidez, pero el acuerdo firmado no le obliga y el ${FES} la recompra seguía desactivada y casi sin fondos (0,03 ZCHF).`);
  avisoCambia(slug, 'Entre accionistas hay vendedores por debajo del precio del emisor (venta más barata 67,00 ZCHF el 05/11/2026).',
    `Entre accionistas hay vendedores por debajo del precio del emisor (venta más barata 67,00 ZCHF el ${FES}).`);
  const r = documentos[slug].referencias.find(x => x.etiqueta === 'Mínimo de inversión');
  assert.equal(expedientes[slug].propuestaTarjeta.resumenTarjeta.minimo, `1 acción (68,01 CHF el ${CORTA})`);
  tarjeta(slug, 'Mínimo de inversión', `1 acción (68,01 CHF el ${CORTA})`, r.fuente, FECHA, r.alcance.replace(PREFIJO, ''), '1 acción (68,01 CHF el 05/11)');
  metrica(slug, 'Supervisor', `${SIN_FINMA('05/11/2026')}; afiliada a PolyReg solo a efectos de blanqueo`,
    { etiqueta: 'Supervisor', valor: `${SIN_FINMA(FES)}; afiliada a PolyReg solo a efectos de blanqueo` });
}
// Los avisos y métricas de las tres, como en su expediente (sin contar el aviso editorial común).
for (const slug of ['aktionariat', 'boss-info', 'switzerlend']) {
  const o = oferta(slug), exp = expedientes[slug].propuestaTarjeta;
  assert.deepEqual(o.metricas, exp.metricas, `${slug}: métricas = expediente`);
  const faltan = exp.avisos.map(textoAviso).filter(t => !o.avisos.some(a => a.texto === t));
  // Boss Info: el expediente proponía también el aviso «Nadie ha comprado al emisor desde el 29/06/2026»
  // y otra redacción del de vendedores; DECISIONES no los recoge (el hecho va en el resumen).
  assert.deepEqual(faltan, slug === 'boss-info' ? ['Entre accionistas hay vendedores por debajo del precio del emisor (venta más barata 8,40 ZCHF el 10/11/2026).',
    'Nadie ha comprado al emisor desde el 29/06/2026.'] : [], `${slug}: avisos del expediente`);
}

// ---- Brickwise: 11 de reventa (libro de órdenes de la app del 10/11, idéntico a las 09:01 y a las 09:17 UTC).
const BW_APP = 'https://app.brickwise.at/desktopWeb/marketplace';
const BW_V1 = 'https://api.app.brickwise.at/api/v1/assets', BW_V2 = 'https://api.app.brickwise.at/api/v2/assets';
// [mínimo publicado el 05/11, mínimo del 10/11 (tabla de DECISIONES), mejor compra 05/11 → 10/11 si cambia]
const BRICKWISE = {
  'apartamento-vacacional-hinterstoder-50': ['77', '75', ['65,00 €', '20,00 €']],
  'vivienda-schwarzer-weg-18-graz': ['66,67', '65'],
  'vivienda-stallhofstra-e-28-gratwein': ['69,90', '68,80'],
  'drautalresidenz-paternion': ['70', '70', ['54,00 €', '60,00 €']],
  'fotovoltaica-cohotel': ['110', '110'],
  'fotovoltaica-greenpoint': ['100', '100', ['89,00 €', '84,00 €']],
  'randhartingergasse-9-viena': ['78', '78', ['40,50 €', '46,00 €']],
  'local-de-estanco-klagenfurt': ['95', '95'],
  'vivienda-pluddemanngasse-101-graz': ['75', '75'],
  'vivienda-pottendorfer-stra-e-62-wr-neustadt': ['74', '74'],
  'vivienda-sonnleithnergasse-2-viena': ['75', '75'],
};
assert.deepEqual(Object.keys(BRICKWISE).sort(), ofertas.filter(o => o.plataformaSlug === 'brickwise').map(o => o.slug).sort(), 'las 11 de Brickwise');
const LIBRO = `Libro de órdenes de la app de Brickwise leído el ${FES} (09:01–09:17 UTC) en los datos que usa la app; ninguna página pública enseña las órdenes una a una. Cambia a diario.`;
for (const [slug, [antes, ahora, compra]] of Object.entries(BRICKWISE)) {
  const exp = expedientes[slug].propuestaTarjeta, o = oferta(slug);
  assert.equal(o.coleccion, 'secundario');
  assert.equal(exp.resumenTarjeta.minimo, `Desde ${ahora} € la participación en reventa (${CORTA})`, `${slug}: mínimo del expediente = DECISIONES`);
  // Acceso, salida, avisos, métricas y resumen: sin cambios (comprobados hoy).
  const pubCarta = e => documentos[slug].referencias.find(r => r.etiqueta === e)?.valor;
  assert.equal(exp.resumenTarjeta.accesoEspana, pubCarta('Acceso desde España'), `${slug}: acceso sin cambios`);
  assert.equal(exp.resumenTarjeta.salida, pubCarta('Salida'), `${slug}: salida sin cambios`);
  assert.deepEqual(exp.avisos, o.avisos.slice(1).map(a => a.texto), `${slug}: avisos sin cambios`);
  assert.deepEqual(exp.metricas, o.metricas, `${slug}: métricas sin cambios`);
  assert.equal(exp.resumen, o.resumen, `${slug}: resumen sin cambios`);
  assert.ok((expedientes[slug].revisionAvisos || []).every(a => a.veredicto === 'vigente'), `${slug}: avisos vigentes`);
  const venta = exp.referenciasFicha.find(r => r.etiqueta === `Venta más barata · ${FES}`);
  assert.match(venta.valor, new RegExp(`^${ahora.replace(',', '\\,')}(?:,00)? € por participación \\((\\d+) a ese precio`), `${slug}: venta más barata del expediente`);
  const lote = venta.valor.match(/\((\d+) a ese precio/)[1];
  tarjeta(slug, 'Mínimo de inversión', exp.resumenTarjeta.minimo, BW_APP, FECHA,
    `Precio por participación de la venta más barata del mercado de la app ese día, más un 1,5 % de comisión; a ese precio había ${lote} ${lote === '1' ? 'participación' : 'participaciones'} a la venta. Brickwise no publica un mínimo en reventa ni si una orden se puede comprar en parte. El precio lo fija cada vendedor y cambia a diario. No es el precio de emisión.`,
    `Desde ${antes} € la participación en reventa (05/11)`);
  // Referencias del libro de órdenes, con la lectura de hoy.
  const nueva = e => { const r = exp.referenciasFicha.find(x => x.etiqueta === `${e} · ${FES}`); assert.ok(r, `${slug}: «${e}» del expediente`); return r; };
  const vieja = e => documentos[slug].referencias.find(x => x.etiqueta === `${e} · 05/11/2026`);
  const mc0 = vieja('Mejor oferta de compra').valor, mc1 = nueva('Mejor oferta de compra').valor;
  if (compra) { assert.ok(mc0.startsWith(compra[0] + ' ') && mc1.startsWith(compra[1] + ' '), `${slug}: mejor compra ${compra.join(' → ')}`); }
  else assert.equal(mc1, mc0, `${slug}: la mejor compra no cambia`);
  refCambia(slug, 'Venta más barata · 05/11/2026', vieja('Venta más barata').valor,
    { etiqueta: `Venta más barata · ${FES}`, valor: venta.valor, fechaDato: FECHA, fechaConsulta: FECHA, fuente: BW_V1, alcance: LIBRO });
  assert.equal(venta.fuente, BW_V1);
  refCambia(slug, 'Participaciones en venta · 05/11/2026', vieja('Participaciones en venta').valor,
    { etiqueta: `Participaciones en venta · ${FES}`, valor: nueva('Participaciones en venta').valor, fechaDato: FECHA, fechaConsulta: FECHA, fuente: BW_V2,
      alcance: 'Participaciones de esta emisión a la venta entre inversores ese día (suma de las órdenes abiertas en la app). Cambia a diario.' });
  assert.equal(nueva('Participaciones en venta').fuente, BW_V2);
  refCambia(slug, 'Mejor oferta de compra · 05/11/2026', mc0,
    { etiqueta: `Mejor oferta de compra · ${FES}`, valor: mc1, fechaDato: FECHA, fechaConsulta: FECHA, fuente: BW_V1,
      alcance: `${LIBRO} Es lo más que ofrecía pagar un comprador ese día, antes de la comisión del 1,5 %.` });
  assert.equal(nueva('Mejor oferta de compra').fuente, BW_V1);
}

// ---- Hausera · próximas ofertas: Alicante 2 se cubrió en la preventa; el seguimiento pasa a Alicante 3.
{
  const slug = 'hausera-proximas-ofertas', o = oferta(slug), d = documentos[slug], x = expedientes[slug], exp = x.propuestaTarjeta;
  const DOC = 'https://drive.google.com/file/d/1cpWVN3J_Y1xdRDAxUzGnjmWXB-eTODH_';
  assert.ok(x.documentos.some(z => z.url === DOC), `${slug}: documento de emisión en el expediente`);
  resumenCambia(slug, 'Seguimiento de las operaciones inmobiliarias de Hausera. El 05/11/2026 Alicante 2 estaba en preventa desde el 04/11 y anunciaba la oferta pública para el 11/11/2026; sin documento de emisión público.',
    exp.resumen);
  assert.equal(exp.resumen, 'Seguimiento de las operaciones inmobiliarias de Hausera. El 10/11/2026 Alicante 2 ya figuraba como financiada; la siguiente, Alicante 3 (14 viviendas en Orihuela Costa), abre la preventa el 18/11 y la suscripción el 25/11/2026.');
  // Métricas (DECISIONES): próxima operación, emisor, supervisor y comisiones (texto del revisor, sin cifras).
  const ex = Object.fromEntries(exp.metricas.map(m => [m.etiqueta, m.valor]));
  assert.deepEqual(Object.keys(ex), ['Próxima operación', 'Emisor', 'Supervisor', 'Comisiones']);
  assert.equal(ex.Supervisor, 'Hausera no está registrada en la CNMV; emisión sin folleto, pendiente de inscribir por Ursus-3 Capital A.V. (CNMV nº 251)');
  assert.equal(ex.Comisiones, 'Ninguna para el suscriptor (escritura de emisión de Alicante 3)');
  const nuevas = [
    { etiqueta: 'Próxima operación', valor: ex['Próxima operación'] },
    { etiqueta: 'Emisor', valor: ex.Emisor },
    { etiqueta: 'Supervisor', valor: ex.Supervisor.replace('CNMV nº 251', 'CNMV n.º 251') },
    { etiqueta: 'Comisiones', valor: 'Ninguna para el suscriptor; Hausera cobra con la plusvalía que supere el tope del inversor' },
  ];
  assert.equal(nuevas[0].valor, 'Alicante 3 · preventa desde el 18/11/2026, suscripción del 25/11/2026 al 30/06/2027');
  assert.equal(nuevas[1].valor, 'HAUSERA PROPERTY MANAGER SPV 11, S.A (documento de emisión de Alicante 3)');
  const m0 = Object.fromEntries(o.metricas.map(m => [m.etiqueta, m.valor]));
  assert.deepEqual(m0, { 'Próxima operación': 'Alicante 2 · preventa desde el 04/11/2026, oferta pública 11/11/2026',
    Supervisor: 'No registrada en la CNMV (sus términos dicen que no es empresa de servicios de inversión)', 'Coste de Hausera': 'Sin comisión por invertir (FAQ)' });
  anota(slug, 'métrica', `Próxima operación: ${m0['Próxima operación']}`, `Próxima operación: ${nuevas[0].valor}`);
  anota(slug, 'métrica', null, `Emisor: ${nuevas[1].valor}`);
  anota(slug, 'métrica', `Supervisor: ${m0.Supervisor}`, `Supervisor: ${nuevas[2].valor}`);
  anota(slug, 'métrica', `Coste de Hausera: ${m0['Coste de Hausera']}`, `Comisiones: ${nuevas[3].valor}`);
  o.metricas = nuevas;
  // Avisos: los seis del expediente (el de la reserva sustituye al del 05/11; entran dos nuevos).
  const textos = exp.avisos.map(textoAviso);
  assert.equal(textos.length, 6);
  const RESERVA_05 = 'Apuntarte a la preventa no te obliga, pero si firmas el acuerdo de reserva debes transferir el dinero en el plazo fijado. El 05/11/2026 el documento de emisión de Alicante 2 y su emisor no eran públicos.';
  const RESERVA_10 = 'Si firmas el acuerdo de reserva, transfieres el dinero antes de que la emisión esté inscrita y el emisor puede usarlo en el proyecto; solo se devuelve, sin intereses, si la emisión no sale adelante.';
  const FOLLETO = 'El documento de emisión no es un folleto y la CNMV no lo ha revisado. El 10/11/2026 Alicante 3 aún no estaba inscrita en el registro de la CNMV.';
  const PREVENTA = 'Las operaciones pueden cubrirse en la preventa: Alicante 2 ya figuraba como financiada el 10/11/2026, antes de su oferta pública del 11/11.';
  const seQuedan = o.avisos.slice(1).map(a => a.texto).filter(t => t !== RESERVA_05);
  assert.deepEqual(o.avisos.slice(1).map(a => a.texto).filter(t => t === RESERVA_05), [RESERVA_05], `${slug}: aviso de la reserva «antes»`);
  assert.ok(seQuedan.every(t => textos.includes(t)), `${slug}: los demás avisos publicados siguen`);
  assert.deepEqual(textos.filter(t => !seQuedan.includes(t)).sort(), [RESERVA_10, FOLLETO, PREVENTA].sort(), `${slug}: avisos nuevos del expediente`);
  const editorial = o.avisos[0];
  o.avisos = [editorial, ...textos.map(t => o.avisos.find(a => a.texto === t) || { texto: t, tono: 'warn', esAntiguedad: false, verificadaEl: FECHA })];
  anota(slug, 'aviso', RESERVA_05, RESERVA_10);
  anota(slug, 'aviso', null, FOLLETO);
  anota(slug, 'aviso', null, PREVENTA);
  // Fuentes de la oferta: las del expediente (oportunidades, ficha de Alicante 3, documento, términos y ERIR de la CNMV).
  assert.ok(o.fuentesActuales.every(u => exp.fuentesActuales.includes(u)));
  assert.deepEqual(exp.fuentesActuales, ['https://hausera.io/oportunidades/', 'https://hausera.io/propiedad/alicante_3/', DOC,
    'https://hausera.io/terms/', 'https://www.cnmv.es/portal/consultas/esi/erir_esi?nif=A86796182&lang=es']);
  anota(slug, 'fuentes de la oferta', o.fuentesActuales.join(' · '), exp.fuentesActuales.join(' · '));
  o.fuentesActuales = [...exp.fuentesActuales];
  for (const u of exp.fuentesActuales) conFuente(slug, u);
  // Característica «Emisor» de la ficha: decía que el de Alicante 2 no era público (ya no es cierto).
  {
    const i = unico(d.caracteristicas, c => c.etiqueta === 'Emisor', `${slug}: característica «Emisor»`);
    const antes = 'SPV del Grupo Hausera identificada en cada documento de emisión (para Alicante 2, no publicada)';
    assert.equal(d.caracteristicas[i].valor, antes);
    const ahora = 'Una sociedad por operación, identificada en su documento de emisión; la de Alicante 3 es HAUSERA PROPERTY MANAGER SPV 11, S.A';
    assert.match(x.emisor, /HAUSERA PROPERTY MANAGER SPV 11, S\.A/);
    d.caracteristicas[i] = { ...d.caracteristicas[i], valor: ahora };
    anota(slug, 'característica', `Emisor: ${antes}`, `Emisor: ${ahora}`);
  }
  // Referencias: fuera las tres de rentabilidad de octubre (eran de Alicante 1); historial del 10/11.
  for (const f of ['19/10/2026', '20/10/2026', '21/10/2026'])
    refQuita(slug, `Rentabilidad anualizada anunciada · ${f}`, '12,00 % (15,00 % sobre la inversión en 15 meses)');
  refCambia(slug, 'Historial publicado · 22/10/2026', '41 operaciones, 23 terminadas, 122 M EUR financiados', {
    etiqueta: `Historial publicado · ${FES}`, valor: '42 operaciones, 24 terminadas, 128 M€ financiados', fechaDato: null, fechaConsulta: FECHA,
    fuente: 'https://hausera.io/', alcance: `Cifras del promotor en su portada, consultada el ${FES}; ningún registro público las comprueba. No son una rentabilidad ni garantizan resultados.` });
  // Tarjeta: mínimo, acceso y salida (con la corrección obligatoria del revisor en la salida).
  const rt = exp.resumenTarjeta;
  assert.equal(rt.minimo, 'Desde 100 € en Alicante 3, según su documento de emisión (10/11); la preventa abre el 18/11.');
  assert.equal(rt.accesoEspana, 'Emisión española para particulares que pasen el test de idoneidad del emisor; Hausera no está registrada en la CNMV.');
  assert.equal(rt.salida, 'Cobras cuando se venden las viviendas (previsto en 20 meses, sin fecha cierta); no hay mercado secundario.', 'salida del expediente (la corrige el revisor)');
  tarjeta(slug, 'Mínimo de inversión', rt.minimo, DOC, null,
    'Documento de emisión de Alicante 3, público en su ficha de Hausera sin iniciar sesión: «Ticket mínimo: 100,00 euros» (cuadro resumen) y 100 € por obligación (5.11). Hoy no se puede invertir: la preventa abre el 18/11/2026 y la suscripción, el 25/11/2026.',
    '100 € según la FAQ de Hausera (05/11); las condiciones de Alicante 2 están en su documento de emisión, aún no público.');
  tarjeta(slug, 'Acceso desde España', rt.accesoEspana, DOC, null,
    'Documento de emisión de Alicante 3 (5.7): se dirige a inversores cualificados y a particulares que el emisor considere idóneos tras analizar su información, con alta y verificación de identidad en la web de Hausera; las obligaciones se rigen por la normativa española. Hausera (HOLDTX SPAIN, S.L.) no figura en la CNMV y dice no ser empresa de servicios de inversión.',
    null);
  tarjeta(slug, 'Salida', 'Cobras cuando se venden las viviendas (previsto en 20 meses, sin fecha cierta); sin mercado secundario garantizado.', DOC, null,
    'Documento de emisión de Alicante 3: el dinero se devuelve solo tras vender el inmueble (2.3.7), con una duración estimada de 20 meses sin vencimiento en fecha cierta (2.3.5); solo se puede transmitir a compradores autorizados (6) y los valores pueden no tener un mercado secundario líquido (8.6). Corrección obligatoria de la revisión independiente.',
    null);
  // No se publica el mínimo de emisión de Alicante 3 (conflicto 50 % / 70 %).
  const todo = JSON.stringify([o, d]);
  assert.doesNotMatch(todo, /\b[57]0 ?%/, `${slug}: no se publica el mínimo de emisión`);
  assert.ok(x.conflictos.some(c => /50 %.*70 %/.test(c)));
}

// ---------------------------------------------------------------- comprobaciones de los textos
// mTBILL: ningún texto usa la lista blanca desactivada como prueba de acceso (corrección del revisor).
assert.doesNotMatch(JSON.stringify([oferta('mtbill'), documentos.mtbill]), /lista blanca|greenlist|whitelist/i, 'mTBILL: sin «lista blanca»');
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
for (const c of CAMBIOS) if (c.despues && ['aviso', 'resumen', 'métrica'].includes(c.campo))
  assert.ok(['', 'es'].includes(idiomaCita(c.despues)), `${c.slug}: «${c.despues}» en otro idioma`);
// Fuentes técnicas (API, JSON o código .js): solo las que ya estaban publicadas.
const API = /\/api\/|public-api\.|[?&]wt=json|\.json(?:$|\?)|\.js(?:$|\?)/;
const todas = lote => [...lote.e.flatMap(o => [o.url, ...o.fuentesActuales]), ...Object.values(lote.d).flatMap(d => [...d.fuentes, ...d.referencias.map(r => r.fuente)])];
const antesApi = new Set(todas({ e: escaparateBase.ofertas, d: docBase }).filter(u => API.test(u)));
assert.deepEqual([...new Set(todas({ e: ofertas, d: documentos }).filter(u => API.test(u) && !antesApi.has(u)))], [],
  'fuente técnica nueva (API, JSON o .js)');
const CSP = /<style\b|\sstyle\s*=|\son[a-z]+\s*=|<script/i;
assert.ok(!CSP.test(JSON.stringify(documentos)) && !CSP.test(JSON.stringify(ofertas)), 'texto que la compuerta CSP rechazaría');
// Ningún texto nuevo arrastra una fecha del 05/11 como si fuera de hoy.
for (const c of CAMBIOS) if (c.despues && !/^referencia|^fuente/.test(c.campo)) assert.doesNotMatch(c.despues, /05\/11\/2026 \(|\(05\/11\)$/, `${c.slug}: fecha vieja en «${c.despues}»`);

// ---------------------------------------------------------------- nada más cambia
// Cada diferencia con la 2026-11-05.2 tiene que estar en CAMBIOS (o ser una fecha de hoy).
{
  const dif = (a, b) => [...a.filter(x => !b.includes(x)), ...b.filter(x => !a.includes(x))];
  const CAMPOS = new Set(['verificadaEl', 'avisos', 'metricas', 'rentabilidad', 'resumen', 'fuentesActuales']);
  for (const o of ofertas) {
    const b = escaparateBase.ofertas.find(x => x.slug === o.slug), c = CAMBIOS.filter(x => x.slug === o.slug);
    for (const k of Object.keys(b)) if (!CAMPOS.has(k)) assert.deepEqual(o[k], b[k], `${o.slug}.${k} no debía cambiar`);
    assert.deepEqual(Object.keys(o), Object.keys(b));
    const av = dif(b.avisos.map(a => a.texto), o.avisos.map(a => a.texto)).sort();
    assert.deepEqual(av, c.filter(x => x.campo === 'aviso').flatMap(x => [x.antes, x.despues]).filter(Boolean).sort(), `${o.slug}: avisos`);
    assert.ok(o.avisos.every(a => a.verificadaEl === FECHA && a.tono === 'warn' && a.esAntiguedad === false), `${o.slug}: avisos con fecha de hoy`);
    assert.deepEqual(o.avisos.filter(a => b.avisos.some(x => x.texto === a.texto)).map(a => a.texto),
      b.avisos.filter(a => o.avisos.some(x => x.texto === a.texto)).map(a => a.texto), `${o.slug}: orden de los avisos que siguen`);
    const me = dif(b.metricas.map(m => `${m.etiqueta}: ${m.valor}`), o.metricas.map(m => `${m.etiqueta}: ${m.valor}`)).sort();
    assert.deepEqual(me, c.filter(x => x.campo === 'métrica').flatMap(x => [x.antes, x.despues]).filter(Boolean).sort(), `${o.slug}: métricas`);
    if (JSON.stringify(o.rentabilidad) !== JSON.stringify(b.rentabilidad)) assert.ok(c.some(x => x.campo === 'rentabilidad'));
    if (o.resumen !== b.resumen) assert.ok(c.some(x => x.campo === 'resumen'));
    if (JSON.stringify(o.fuentesActuales) !== JSON.stringify(b.fuentesActuales)) assert.ok(c.some(x => x.campo === 'fuentes de la oferta'));
    const d = documentos[o.slug], db = docBase[o.slug];
    for (const k of Object.keys(db)) if (!['revisadaEl', 'referencias', 'fuentes', 'descripcion', 'caracteristicas'].includes(k)) assert.deepEqual(d[k], db[k], `${o.slug}: documentación.${k}`);
    assert.deepEqual(Object.keys(d), Object.keys(db));
    if (d.descripcion !== db.descripcion) assert.ok(c.some(x => ['resumen', 'descripción'].includes(x.campo)));
    if (JSON.stringify(d.caracteristicas) !== JSON.stringify(db.caracteristicas)) {
      const cc = c.filter(x => x.campo === 'característica');
      assert.ok(cc.length);
      assert.deepEqual(dif(db.caracteristicas.map(x => `${x.etiqueta}: ${x.valor}`), d.caracteristicas.map(x => `${x.etiqueta}: ${x.valor}`)).sort(),
        cc.flatMap(x => [x.antes, x.despues]).sort(), `${o.slug}: características`);
    }
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
// Ofertas sin cambios críticos (DECISIONES): solo las fechas de verificación.
for (const slug of ['robinhood-classic-stock-tokens', 'kraken-xstocks', 'prosegur-digital-gold'])
  assert.deepEqual(CAMBIOS.filter(c => c.slug === slug), [], `${slug}: solo fechas`);
assert.ok(oferta('kraken-xstocks').avisos[1].texto.length > 0, 'Kraken conserva su primer aviso');

// ---------------------------------------------------------------- escaparate y manifiesto
const colecciones = { principales: 0, secundario: 0, en_camino: 0 };
for (const o of ofertas) colecciones[o.coleccion]++;
const CANDIDATAS = fs.readdirSync(path.join(DIR, 'expedientes')).filter(n => n.endsWith('.json'))
  .map(n => leer(path.join(DIR, 'expedientes', n))).filter(e => e.tipoExpediente === 'candidata').length;
assert.deepEqual(colecciones, COLECCIONES);
assert.deepEqual(ofertas.map(o => o.slug), escaparateBase.ofertas.map(o => o.slug), 'las mismas 22, en el mismo orden');
assert.deepEqual(ofertas.map(o => o.estadoRevision), escaparateBase.ofertas.map(o => o.estadoRevision), 'los estados de revisión no cambian');
const escaparate = {
  versionEsquema: 2,
  fuente: {
    notaOrigen: `Revisión del ${FES} (investigación del día pedida por Víctor): las 22 fichas revisadas con fuentes primarias, ` +
      `un expediente por oferta y revisión independiente por grupo; ${CANDIDATAS} candidatas con expediente y ninguna admitida; sin altas ni retiradas. ` +
      `Parte de la publicada ${PREVIA.slice(0, 8)} (entrega ${DESDE}). Las cifras se publican solo donde se leyeron en la fuente oficial; ` +
      'en reventa y próximas, la tarjeta enseña mínimo, acceso desde España y salida en castellano, con fuente y fecha.',
    actualizacionLocal: { verificadoEl: FECHA,
      archivo: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/contraste-${ETIQUETA}.json`, publicable: false,
      derechosImagenVerificados: false,
      nota: `Lote del ${FES} (entrega ${ETIQUETA}): 22 fichas comprobadas (8 principales, 13 de reventa y 1 en camino) y ${radar.plataformas.length} plataformas.` },
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
assert.deepEqual(Object.keys(escaparate.fuente), Object.keys(escaparateBase.fuente));
// Plataformas: iguales a la base salvo las fechas (verificadoEl y la consulta de cada fuente).
{
  const hojas = (v, ruta = '', out = new Map()) => { if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) hojas(x, `${ruta}/${k}`, out); else out.set(ruta, v); return out; };
  const a = hojas(escaparateBase.plataformas), b = hojas(escaparate.plataformas);
  assert.deepEqual([...a.keys()], [...b.keys()], 'misma forma');
  for (const k of [...a.keys()].filter(k => a.get(k) !== b.get(k))) {
    if (/\/verificadoEl$/.test(k) || /\/fuentes\/\d+\/consultadaEl$/.test(k)) { assert.equal(b.get(k), FECHA); continue; }
    assert.fail(`plataformas: cambio inesperado en ${k}`);
  }
}
const manifiesto = { ...manifiestoBase };
assert.deepEqual(manifiesto, { version_esquema: 2, plataformas_esperadas: 25, ofertas_esperadas: 22, colecciones_esperadas: colecciones });

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
    aprobada_referencia = 'Entrega ${ETIQUETA}: radar (${radar.fuentes.length} fuentes) y ${ofertas.length} fichas comprobados el ${FES} con fuentes primarias, expediente por oferta y revisión independiente; mismas ${ofertas.length} ofertas (${colecciones.principales}/${colecciones.secundario}/${colecciones.en_camino}) y ${escaparate.plataformas.length} plataformas. Investigación pedida por Víctor el ${FES}; ciclo autorizado por su orden.'
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
  `-- Radar y ${ofertas.length} fichas comprobados hoy; ${escaparate.plataformas.length} plataformas y ${ofertas.length} ofertas (${colecciones.principales}/${colecciones.secundario}/${colecciones.en_camino}). Solo escribe en rwadar_catalogo.\n` +
  `-- Generado por rwadar-app/data/verificaciones/${ETIQUETA}-v2/preparar-entrega.mjs; revisar antes de aplicar.\n` +
  nueva.sql.replace('-- El lote entra como BORRADOR. Este fichero nunca lo aprueba ni lo publica.',
    '-- Este aplicador importa y aprueba al final, únicamente si pasan todas las guardas.')
    .replace('begin;', () => 'begin isolation level serializable;\n' + guarda)
    .replace(/commit;\n$/, () => aprobar + 'commit;\n'));
{
  const sql = fs.readFileSync(archivo, 'utf8');
  assert.ok(sql.includes(guarda) && sql.endsWith(aprobar + 'commit;\n'), 'guarda al principio y aprobación al final');
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
  decision: `Víctor, ${FES}: «Hazme la investigación en profundidad de RWAdar buscando nuevas ofertas y publica la actualización de hoy». Lo que entra: DECISIONES-COORDINADOR.md.`,
  archivos: Object.fromEntries(['DECISIONES-COORDINADOR.md', `radar-contraste-${FECHA}.json`, 'cambios-radar.json']
    .map(n => [n, sha(path.join(DIR, n))])),
  radar: { fuentes: contraste.fuentes, correctas: contraste.correctas, verificacionesManuales: Object.keys(cambiosRadar.verificacionesManuales),
    comprobacionesCambiadas: cambiosRadar.comprobacionesCambiadas, cambios: { fuentes: {}, plataformas: {} } },
  cifras: Object.fromEntries(Object.entries(SPIKO).map(([s, v]) => [s, { antes: v.antes, despues: v.pct, valorLiquidativo: '2026-11-09', consulta: FECHA }])),
  vigencia: { verificadaEl: FECHA, vigenciaDias: 7, ultimoDiaVigente: ULTIMO },
  cambios: CAMBIOS, tarjetaConservadasDeMasDe120: largasConservadas, tarjetas,
  sinCambios: ['las 25 plataformas del radar y sus textos, salvo las fechas de consulta', 'public.plataformas y public.fuentes (el SQL no las toca)',
    'colecciones 8/13/1, estados de revisión e imágenes', 'Robinhood, Kraken y Prosegur Digital Gold: solo las fechas'],
  altas: [], retiradas: [], colecciones });
console.log(JSON.stringify({ etiqueta: ETIQUETA, revisionId: nueva.revisionId, hash: nueva.hash, previa: PREVIA, sha256: sha(archivo),
  plataformas: escaparate.plataformas.length, fuentesRadar: radar.fuentes.length, ofertas: ofertas.length, colecciones, cambios: CAMBIOS.length }));

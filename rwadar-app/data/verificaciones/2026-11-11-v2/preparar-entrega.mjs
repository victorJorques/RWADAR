// Entrega del catálogo «2026-11-11»: puesta al día pedida por el responsable del proyecto («Actualiza las
// ofertas y el gráfico y las noticias…»). Preparación LOCAL: sin red ni servicios remotos. Reproducible
// byte a byte: ninguna salida depende de la hora.
//
//   node rwadar-app/data/verificaciones/2026-11-11-v2/preparar-entrega.mjs
//
// Parte exactamente de la revisión publicada dfdc4c85 (entrega 2026-11-10), leída hoy como visitante
// (lectura-publica/, 09:01:21–09:01:25 UTC), y aplica SOLO lo que dice DECISIONES-COORDINADOR.md (lista
// cerrada, con las correcciones de los revisores de §5):
// 1. Radar: las 69 fuentes comprobadas hoy (radar-contraste-2026-11-11.json, 69/69). cambios-radar.json no
//    cambia ninguna dirección ni ningún texto: solo dos lecturas a mano (REGAFI, por su API pública).
// 2. Las 22 fichas, revisadas hoy con fuentes primarias (expedientes/) y revisión independiente por grupo
//    (revision-independiente/): verificadaEl 11/11, 7 días de vigencia (último día el 18/11), avisos
//    comprobados hoy con fecha de hoy y los cambios por oferta de DECISIONES §2. Cada texto «antes» se exige
//    tal cual: si no está, el script falla.
// 3. Tres datos de la tarjeta (etiqueta fija): los publicados se conservan con consulta del 11/11; cambian
//    solo los mínimos de las 11 de Brickwise, de Boss Info y de Switzerlend.
// Hoy NO se toca public.plataformas ni public.fuentes: el SQL solo escribe en rwadar_catalogo.
// Sin altas ni retiradas: 22 ofertas (8/13/1) y 25 plataformas. Las noticias no son parte de esta entrega.
//
// Condición de hora de Spiko Euro (Smart Cash), corrección P1 del revisor: su cifra se fecha con la VL del
// 10/11 porque la entrega se montó el 11/11 antes de las 19:30 UTC (hora del siguiente cálculo de Spiko).
// El script no mira el reloj (así es reproducible); la hora del montaje está en INFORME-ENTREGA.md.
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
const ETIQUETA = '2026-11-11', FECHA = '2026-11-11', DESDE = '2026-11-10', HOY = '2026-11-11';
const FES = '11/11/2026', CORTA = '11/11';
const FES_PREVIA = '10/11/2026', CORTA_PREVIA = '10/11';
const ULTIMO = '2026-11-18'; // último día vigente: verificadaEl 11/11 y 7 días
const PREVIA = 'dfdc4c85-7f2f-fc4a-de27-a9f4a63f7656';
const HASH_PREVIA = 'dfdc4c857f2ffc4ade27a9f4a63f7656ab4be9edc43d0037d0ad42fb94ac015f';
const ULTIMO_PREVIA = '2026-11-17';
const COLECCIONES = { principales: 8, secundario: 13, en_camino: 1 };
const EDITORIAL = 'Referencia editorial gratuita. El proveedor comprueba admisión, condiciones y riesgos; RWAdar no recibe dinero de inversiones.';
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
assert.ok([...snapshot.plataformas, ...snapshot.ofertas].every(x => x.revisionId === PREVIA), 'el catálogo sincronizado de la web no es la dfdc4c85');
assert.deepEqual([snapshot.plataformas.length, snapshot.ofertas.length], [25, 22]);
assert.ok(snapshot.ofertas.every(o => o.verificadaEl === DESDE), 'el catálogo sincronizado está verificado el 10/11');
const radarBase = leer(path.join(base, 'radar-canonico-26.json'));
const escaparateBase = leer(path.join(base, 'escaparate-publicacion.json'));
const docBase = leer(path.join(base, 'documentacion-ofertas.json'));
const manifiestoBase = leer(path.join(base, 'manifiesto-catalogo.json'));

// Lo leído hoy como visitante (lectura-publica/, 09:01:21–09:01:25 UTC) es exactamente la base local.
const lp = path.join(DIR, 'lectura-publica');
const pubO = leer(path.join(lp, 'ofertas-v2.json')), pubP = leer(path.join(lp, 'plataformas-v2.json'));
const pubT = leer(path.join(lp, 'plataformas-todas.json'));
{
  const hora = fs.readFileSync(path.join(lp, 'hora-lectura.txt'), 'utf8');
  assert.match(hora, /2026-11-11T09:01:21Z – 2026-11-11T09:01:25Z/, 'hora de la lectura pública');
  const r = JSON.parse(hora.match(/Resultado: (\{.*\})/)[1]);
  assert.deepEqual([r.revision, r.plataformas, r.ofertas, r.colecciones, r.verificadaEl], [[PREVIA], 25, 22, COLECCIONES, [DESDE]]);
}
assert.ok([...pubO, ...pubP].every(x => x.revision_id === PREVIA), 'la publicada leída hoy es la dfdc4c85');
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
// Los tres datos publicados de la tarjeta, tal como los lee un visitante (para el «antes» de las suizas).
const CANONICA = /^(?:M[ií]nimo de inversi[oó]n|Acceso desde Espa[ñn]a|Salida|Reembolso)(?: \([^)]{1,60}\))?$/;
const publicadoTarjeta = slug => Object.fromEntries(pubO.find(o => o.slug === slug).documentacion.referencias
  .filter(r => CANONICA.test(r.etiqueta)).map(r => [r.etiqueta, r.valor]));

// ---------------------------------------------------------------- 1 · radar
const contrasteRuta = path.join(DIR, `radar-contraste-${FECHA}.json`), cambiosRadarRuta = path.join(DIR, 'cambios-radar.json');
const contraste = leer(contrasteRuta), cambiosRadar = leer(cambiosRadarRuta);
const radar = structuredClone(radarBase);
assert.ok(contraste.fecha === FECHA && contraste.fuentes === radar.fuentes.length && contraste.correctas === radar.fuentes.length &&
  Array.isArray(contraste.bloqueos) && !contraste.bloqueos.length, 'el radar no está comprobado hoy al completo: no se monta el lote');
assert.equal(radar.fuentes.length, 69);
assert.deepEqual(contraste.contraste.map(c => c.id), radar.fuentes.map(f => f.id), 'el contraste cubre las 69 fuentes, en orden');
assert.deepEqual(contraste.contraste.map(c => c.url), radar.fuentes.map(f => f.url), 'el contraste se hizo sobre las mismas direcciones');
assert.ok(contraste.contraste.every(c => c.ok));
assert.equal(cambiosRadar.fecha, FECHA);
assert.deepEqual([cambiosRadar.fuentes, cambiosRadar.plataformas], [{}, {}], 'hoy no cambia ninguna dirección ni ningún texto del radar');
assert.ok(!cambiosRadar.comprobacionesCambiadas || !Object.keys(cambiosRadar.comprobacionesCambiadas).length, 'hoy no cambia ninguna comprobación');
const COMPROBACIONES = leer(path.join(ROOT, 'rwadar-app/data/comprobaciones-fuentes.json')).fuentes;
const plano = t => t.replace(/[\s  ]+/g, ' ');
const cumple = (id, texto) => COMPROBACIONES[id].every(p => new RegExp(p, 'i').test(plano(texto)));
assert.deepEqual(Object.keys(cambiosRadar.verificacionesManuales), ['spiko-regafi', 'spiko-regafi-pasaporte-es']);
for (const [id, m] of Object.entries(cambiosRadar.verificacionesManuales)) {
  const c = contraste.contraste.find(x => x.id === id);
  assert.ok(c.ok && c.manual === m.motivo && c.urlLeida === m.url && c.metodo === m.metodo, `${id}: el contraste recoge la lectura a mano`);
  assert.deepEqual(c.literales, m.literales, `${id}: literales`);
  assert.match(m.metodo, /11\/11\/2026/);
  assert.ok(cumple(id, c.literales.join(' ')), `${id}: la lectura a mano dice lo que respalda`);
}
// Las demás 67: cada comprobación de comprobaciones-fuentes.json está en los literales capturados hoy.
for (const c of contraste.contraste.filter(x => !x.manual))
  assert.ok(cumple(c.id, c.literales.join(' ')), `${c.id}: los literales de hoy no dicen lo que respalda`);
{
  const copia = path.join(DIR, 'radar-manual/regafi-spiko-pasaporte-espagne.json');
  assert.equal(sha(copia), 'fdf10d2d445b2cc90fec0c31215cd065cdab7c0a325cba03fceb47d2a7de66c6', 'copia del pasaporte de REGAFI');
  const t = plano(fs.readFileSync(copia, 'utf8'));
  for (const l of ['"type_passeport": "Libre prestation de services"', '"pays": "ESPAGNE"', '"date_debut": "2026-01-08"'])
    assert.ok(t.includes(l), `REGAFI: falta ${l}`);
  const occ = contraste.contraste.find(x => x.id === 'paxg-occ');
  assert.ok(occ.literales.some(l => l.includes('Trust Banks Active As of 9/30/2026')) && occ.literales.some(l => /25379 Paxos Trust Company/.test(l)), 'OCC: lista con Paxos');
}
radar.verificadoEl = FECHA;
radar.alcance = `Revisión editorial de fuentes primarias del ${FES}: las ${radar.fuentes.length} fuentes del radar se volvieron a ` +
  'consultar sin sesión y siguen diciendo lo que respaldan (las dos del registro REGAFI de la ACPR, por su API pública, porque la ' +
  'página cargaba sin datos). No acredita onboarding, oferta abierta ni rentabilidad.';
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
const NO_APLICADO = [];
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
const refCambia = (slug, etiqueta, valor, nueva) => {
  const d = documentos[slug], i = refIndice(slug, etiqueta, valor), r = { ...d.referencias[i], ...nueva };
  assert.notDeepEqual(r, d.referencias[i]);
  anota(slug, 'referencia de la ficha', `${d.referencias[i].etiqueta}: ${d.referencias[i].valor}`, `${r.etiqueta}: ${r.valor}`);
  d.referencias[i] = r; conFuente(slug, r.fuente);
};
const REF = (etiqueta, valor, fuente, fechaDato, alcance) => ({ etiqueta, valor, fechaDato, fechaConsulta: FECHA, fuente, alcance });
const textoAviso = a => typeof a === 'string' ? a : a.texto;

// Todas las fichas se revisaron hoy con sus fuentes primarias (un expediente por oferta).
const expedientes = {};
for (const o of ofertas) {
  const exp = expedientes[o.slug] = leer(path.join(DIR, 'expedientes', `${o.slug}.json`));
  assert.equal(exp.slug, o.slug); assert.equal(exp.tipoExpediente, 'publicada');
  assert.ok(['mantener', 'actualizar'].includes(exp.decision), `${o.slug}: decisión ${exp.decision}`);
  assert.ok(exp.consulta.inicioUtc.startsWith(FECHA), `${o.slug}: expediente de hoy`);
  assert.equal(exp.propuestaTarjeta.coleccion ?? o.coleccion, o.coleccion, `${o.slug}: misma colección`);
  assert.equal(o.avisos[0].texto, EDITORIAL, `${o.slug}: el primer aviso es el editorial común`);
  o.verificadaEl = FECHA;
  o.vigenciaDias = 7;
}
for (const slug of Object.keys(documentos)) documentos[slug].revisadaEl = FECHA;
// Un expediente «publicada» por oferta y ninguno más. Los de candidatas (puede haber más mientras sigue la
// vigilancia) no entran (DECISIONES §3): solo se exige que ninguno proponga admitir. Nada de lo que se escribe
// depende de ellos, así que la salida es la misma aunque aparezcan otros.
{
  const todos = fs.readdirSync(path.join(DIR, 'expedientes')).filter(n => n.endsWith('.json')).sort().map(n => leer(path.join(DIR, 'expedientes', n)));
  assert.deepEqual(todos.filter(e => e.tipoExpediente === 'publicada').map(e => e.slug).sort(), ofertas.map(o => o.slug).sort(), 'un expediente «publicada» por oferta');
  for (const e of todos.filter(x => x.tipoExpediente !== 'publicada')) {
    assert.equal(e.tipoExpediente, 'candidata', `${e.slug}: tipo de expediente`);
    assert.doesNotMatch(String(e.decision), /^admit/, `${e.slug}: DECISIONES §3 no admite ninguna candidata hoy`);
    assert.ok(!porSlug.has(e.slug), `${e.slug}: candidata con el slug de una publicada`);
  }
}

// Tres datos de la tarjeta: etiqueta fija (normas del 03/11). Los publicados se conservan con consulta del
// 11/11 salvo los que cambian abajo, que se reescriben con fuente y fecha.
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
  assert.ok(i >= 0, `${slug}: «${etiqueta}» no estaba publicado (hoy no se añade ningún dato de tarjeta)`);
  assert.equal(d.referencias.filter(x => x.etiqueta === etiqueta).length, 1);
  assert.equal(d.referencias[i].valor, antes, `${slug}: «${etiqueta}» publicado`);
  assert.equal(publicadoTarjeta(slug)[etiqueta], antes, `${slug}: «${etiqueta}» = lo leído hoy como visitante`);
  assert.notEqual(valor, antes, `${slug}: «${etiqueta}» no cambia`);
  anota(slug, 'tarjeta', `${etiqueta}: ${d.referencias[i].valor}`, `${etiqueta}: ${valor}`);
  d.referencias[i] = r;
  conFuente(slug, fuente);
  (tarjetaNuevas[slug] ||= []).push(etiqueta);
};

// ---- Spiko: rendimiento con el valor liquidativo (VL) más reciente, consultado y recalculado el 11/11.
// [VL de partida, VL de llegada, días]: la cifra publicada se recalcula aquí y tiene que salir igual.
const SPIKO = {
  'spiko-letras-del-tesoro-euro': { antes: '2,44 %', pct: '2,41 %', metrica: 'Rentabilidad publicada · 31 días · 09/11/2026',
    nueva: 'Rentabilidad publicada · 31 días · 11/11/2026', ref: 'Rentabilidad publicada · 31 días', web: 'https://data.spiko.io/eutbl/',
    fechaDato: '2026-11-11', calculo: [1.060588, 1.062738, 31],
    literal: ['VL fechada el 11/11/2026', `consultado el ${FES}`],
    alcance: `Rendimiento neto anualizado de 31 días que publica Spiko (valor liquidativo fechado el 11/11/2026, que Spiko calculó el 10/11; consultado el ${FES} y recalculado ese día con los valores liquidativos del 11/10 y del 11/11: 1,060588 € → 1,062738 €). Variable y no garantizado.` },
  'spiko-letras-del-tesoro-dolar': { antes: '4,09 %', pct: '4,02 %', metrica: 'Rentabilidad publicada · 31 días · 09/11/2026 · en USD',
    nueva: 'Rentabilidad publicada · 31 días · 10/11/2026 · en USD', ref: 'Rentabilidad publicada · 31 días', web: 'https://data.spiko.io/ustbl/',
    fechaDato: '2026-11-10', calculo: [1.098694, 1.102496, 32],
    literal: ['(VL del 10/11/2026)', `consultado el ${FES}`],
    alcance: `Rendimiento neto anualizado en dólares de 31 días que publica Spiko (valor liquidativo del 10/11/2026, consultado el ${FES} y recalculado ese día con los valores liquidativos del 09/10 y del 10/11, porque el 10/10 fue sábado: 1,098694 $ → 1,102496 $). No incluye la variación del euro frente al dólar. Variable y no garantizado.` },
  'spiko-smart-cash-euro': { antes: '2,84 %', pct: '2,84 %', metrica: 'Rentabilidad publicada · neta y variable · 09/11/2026',
    nueva: 'Rentabilidad publicada · neta y variable · 10/11/2026', ref: 'Rendimiento neto publicado', web: 'https://data.spiko.io/safo-eur',
    fechaDato: '2026-11-10', calculo: [1.016874, 1.016952, 1],
    literal: ['(valor liquidativo del 10/11/2026;', `consultado el ${FES})`],
    alcance: `Lo que creció el fondo en su último día de cálculo (valor liquidativo del 10/11/2026), pasado a un año y neto de comisiones, según publica Spiko; consultado el ${FES}. Variable: sigue al €STR.` },
};
const pct = ([a, b, dias]) => ((Math.pow(b / a, 365 / dias) - 1) * 100).toFixed(2).replace('.', ',') + ' %';
for (const [slug, s] of Object.entries(SPIKO)) {
  const o = oferta(slug), prop = expedientes[slug].propuestaTarjeta.rentabilidad;
  assert.equal(pct(s.calculo), s.pct, `${slug}: la cifra no sale de los valores liquidativos (${pct(s.calculo)})`);
  assert.equal(o.rentabilidad.mostrada, s.antes, `${slug}: rentabilidad «antes»`);
  assert.equal(prop.mostrada, s.pct, `${slug}: el expediente da otra cifra`);
  assert.ok(s.literal.every(t => prop.literal.includes(t)) && !prop.literal.includes('09/11/2026'), `${slug}: literal del expediente`);
  assert.deepEqual(expedientes[slug].propuestaTarjeta.metricas.find(m => m.etiqueta === s.nueva), { etiqueta: s.nueva, valor: s.pct }, `${slug}: métrica del expediente`);
  anota(slug, 'rentabilidad', `${o.rentabilidad.mostrada} · ${o.rentabilidad.literal}`, `${prop.mostrada} · ${prop.literal}`);
  o.rentabilidad = { mostrada: prop.mostrada, literal: prop.literal };
  metrica(slug, s.metrica, s.antes, { etiqueta: s.nueva, valor: s.pct });
  refCambia(slug, s.ref, s.antes, { valor: s.pct, fechaDato: s.fechaDato, fechaConsulta: FECHA, fuente: s.web, alcance: s.alcance });
  // Lo demás de la ficha, como lo propone el expediente de hoy (métricas, avisos y resumen sin cambios).
  assert.deepEqual(o.metricas, expedientes[slug].propuestaTarjeta.metricas, `${slug}: métricas = expediente`);
  assert.equal(o.resumen, expedientes[slug].propuestaTarjeta.resumen, `${slug}: resumen sin cambios`);
}
// Smart Cash: el aviso 2 se mantiene (nadie confirma ni niega hoy que se comercialice en España).
assert.ok(oferta('spiko-smart-cash-euro').avisos.some(a => a.texto.startsWith('Spiko dice que se puede contratar desde España, pero no hemos podido confirmar')));
// Smart Cash: la condición de hora del revisor (P1) es la de las 19:30 UTC del 11/11.
assert.match(fs.readFileSync(path.join(DIR, 'revision-independiente/principales.md'), 'utf8'), /si la entrega se monta después de las 19:30\s+UTC del 11\/11, volver a leer la API y fechar con la VL del 11\/11/i);

// ---- mTBILL: valor por token del oráculo del emisor (ronda 492, 10/11 18:40 UTC, leída el 11/11 a las 09:25 UTC).
metrica('mtbill', 'Valor por token · 09/11/2026', '1,0776 USD (oráculo del emisor)',
  { etiqueta: 'Valor por token · 10/11/2026', valor: '1,0777 USD (oráculo del emisor)' });
{
  const x = expedientes.mtbill, p = x.propuestaTarjeta, o = oferta('mtbill');
  assert.deepEqual(p.metricas, o.metricas, 'mTBILL: métricas = expediente');
  assert.equal(o.estadoRevision, 'fuentes_en_conflicto', 'mTBILL sigue en conflicto (límites de reembolso)');
  assert.equal(o.rentabilidad, null, 'mTBILL: rentabilidad (APY) en null');
  // Corrección P2: el acceso ya no se apoya en la web de Midas (no se pudo volver a leer); la lectura de las 09:26 UTC
  // queda en el expediente con su hora. La ficha publicada no tiene datos de tarjeta propios: no se añade ninguno.
  assert.equal(p.resumenTarjeta.accesoEspana, 'Sí: oferta pública en España para particulares', 'mTBILL: acceso de la tarjeta del expediente');
  assert.doesNotMatch(x.prioridadEditorial.porQueDestaca, /permitid|Permitted|web/i, 'mTBILL: «por qué destaca» sin la web');
  const web = x.claims.filter(c => c.fuentePrimaria === 'https://midas.app/assets/main-DWqV5Q2W.js' && /Permitted Jurisdictions/.test(c.literal));
  assert.equal(web.length, 1); assert.match(web[0].alcanceYLimites, /main-DWqV5Q2W\.js a las 09:26 UTC/);
  assert.match(web[0].alcanceYLimites, /la tarjeta no se apoya en la web/);
  assert.deepEqual(tarjetaAntes.mtbill, [], 'mTBILL: sin datos de tarjeta publicados');
  NO_APLICADO.push({ slug: 'mtbill', que: 'Acceso de la tarjeta «Sí: oferta pública en España para particulares»',
    porque: 'La ficha publicada de mTBILL no tiene datos de tarjeta propios (ni mínimo, ni acceso, ni salida) y, por estar en «fuentes_en_conflicto», resumenOferta oculta los tres en la web y la app («Sin comprobar si se puede contratar desde España»). DECISIONES §1 conserva los datos de tarjeta publicados: no se añade uno nuevo. El texto corregido queda en el expediente y en «por qué destaca».' });
}

// ---- Aktionariat, Boss Info y Switzerlend: fechas al 11/11 (opción (a) del revisor: textos publicados).
const SIN_FINMA = f => `Sin supervisión prudencial: no figura en el registro de autorizados de FINMA (${f})`;
metrica('aktionariat', `Precio del emisor · ${FES_PREVIA}`, '7,25 CHF por acción (fijo)', { etiqueta: `Precio del emisor · ${FES}`, valor: '7,25 CHF por acción (fijo)' });
metrica('aktionariat', 'Supervisor', SIN_FINMA(FES_PREVIA), { etiqueta: 'Supervisor', valor: SIN_FINMA(FES) });
avisoCambia('aktionariat', `Entre accionistas hay vendedores por debajo del precio del emisor (6,20 ZCHF frente a 7,25 CHF el ${FES_PREVIA}).`,
  `Entre accionistas hay vendedores por debajo del precio del emisor (6,20 ZCHF frente a 7,25 CHF el ${FES}).`);
{
  const slug = 'boss-info', exp = expedientes[slug].propuestaTarjeta;
  metrica(slug, 'Supervisor', SIN_FINMA(FES_PREVIA), { etiqueta: 'Supervisor', valor: SIN_FINMA(FES) });
  avisoCambia(slug, `El precio del emisor está por encima de la mejor oferta de venta entre accionistas (venta más barata 8,40 ZCHF el ${FES_PREVIA}).`,
    `El precio del emisor está por encima de la mejor oferta de venta entre accionistas (venta más barata 8,40 ZCHF el ${FES}).`);
  const r = documentos[slug].referencias.find(x => x.etiqueta === 'Mínimo de inversión');
  const minimo = `100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF el ${CORTA})`;
  assert.equal(exp.resumenTarjeta.minimo, minimo, `${slug}: mínimo del expediente = DECISIONES`);
  tarjeta(slug, 'Mínimo de inversión', minimo, r.fuente, FECHA, r.alcance.replace(PREFIJO, ''),
    `100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF el ${CORTA_PREVIA})`);
  // «Última operación · 10/11/2026» (8,40 ZCHF, 05/11): DECISIONES no la re-fecha; se queda con su fecha.
  const ult = documentos[slug].referencias.filter(x => /^Última operación/.test(x.etiqueta));
  assert.deepEqual(ult.map(x => [x.etiqueta, x.valor]), [[`Última operación · ${FES_PREVIA}`, '8,40 ZCHF (1 acción, 05/11/2026)']]);
  assert.deepEqual(exp.referenciasFicha.map(x => [x.etiqueta, x.valor]), [[`Última operación · ${FES}`, '8,40 ZCHF (1 acción, 05/11/2026)']]);
  NO_APLICADO.push({ slug, que: `Referencia «Última operación · ${FES_PREVIA}» → «· ${FES}» (misma operación del 05/11)`,
    porque: 'DECISIONES §2 solo pasa al 11/11 «Precio del emisor», «Supervisor», los avisos con dato del día y el mínimo. La referencia sigue siendo cierta con su fecha del 10/11 (el revisor confirma que no hay operaciones nuevas).' });
}
{
  const slug = 'switzerlend', exp = expedientes[slug].propuestaTarjeta;
  avisoCambia(slug, `Su web dice que el emisor recompra acciones si tiene liquidez, pero el acuerdo firmado no le obliga y el ${FES_PREVIA} la recompra seguía desactivada y casi sin fondos (0,03 ZCHF).`,
    `Su web dice que el emisor recompra acciones si tiene liquidez, pero el acuerdo firmado no le obliga y el ${FES} la recompra seguía desactivada y casi sin fondos (0,03 ZCHF).`);
  avisoCambia(slug, `Entre accionistas hay vendedores por debajo del precio del emisor (venta más barata 67,00 ZCHF el ${FES_PREVIA}).`,
    `Entre accionistas hay vendedores por debajo del precio del emisor (venta más barata 67,00 ZCHF el ${FES}).`);
  const r = documentos[slug].referencias.find(x => x.etiqueta === 'Mínimo de inversión');
  assert.equal(exp.resumenTarjeta.minimo, `1 acción (68,01 CHF el ${CORTA})`, `${slug}: mínimo del expediente = DECISIONES`);
  tarjeta(slug, 'Mínimo de inversión', `1 acción (68,01 CHF el ${CORTA})`, r.fuente, FECHA, r.alcance.replace(PREFIJO, ''), `1 acción (68,01 CHF el ${CORTA_PREVIA})`);
  metrica(slug, 'Supervisor', `${SIN_FINMA(FES_PREVIA)}; afiliada a PolyReg solo a efectos de blanqueo`,
    { etiqueta: 'Supervisor', valor: `${SIN_FINMA(FES)}; afiliada a PolyReg solo a efectos de blanqueo` });
}
// Las tres: métricas y avisos como en su expediente; acceso y salida, los PUBLICADOS (opción (a), C1–C3), y el
// «antes» de cambiosRespectoPublicado corregido aquí con el texto publicado (el expediente no se edita).
const SUIZAS_CORREGIDAS = {};
for (const slug of ['aktionariat', 'boss-info', 'switzerlend']) {
  const o = oferta(slug), x = expedientes[slug], exp = x.propuestaTarjeta;
  assert.deepEqual(o.metricas, exp.metricas, `${slug}: métricas = expediente`);
  const faltan = exp.avisos.map(textoAviso).filter(t => !o.avisos.some(a => a.texto === t));
  assert.deepEqual(faltan, [], `${slug}: avisos del expediente`);
  assert.equal(o.resumen, exp.resumen, `${slug}: resumen sin cambios`);
  const pub = publicadoTarjeta(slug), ahora = Object.fromEntries(documentos[slug].referencias.filter(r => CANONICA.test(r.etiqueta)).map(r => [r.etiqueta, r.valor]));
  const campos = { minimo: 'Mínimo de inversión', accesoEspana: 'Acceso desde España', salida: 'Salida' };
  SUIZAS_CORREGIDAS[slug] = {};
  for (const [k, etiqueta] of Object.entries(campos)) {
    assert.ok(pub[etiqueta], `${slug}: «${etiqueta}» publicado`);
    if (k !== 'minimo') assert.equal(ahora[etiqueta], pub[etiqueta], `${slug}: «${etiqueta}» se conserva (opción (a))`);
    const delExpediente = x.cambiosRespectoPublicado.filter(c => /resumenTarjeta|Mínimo de inversión/.test(c.campo));
    SUIZAS_CORREGIDAS[slug][k] = { publicado: pub[etiqueta], propuestoPorElExpediente: exp.resumenTarjeta[k], entrega: ahora[etiqueta],
      ...(k === 'minimo' && delExpediente.length ? { antesSegunElExpediente: delExpediente.map(c => c.antes) } : {}) };
  }
}
// El «antes» del expediente era otro texto en las tres (C1–C3): Aktionariat dice que solo cambiaban fechas de unos textos
// que no son los publicados; Boss Info y Switzerlend no anotan que su acceso y su salida difieren de lo publicado.
assert.deepEqual(SUIZAS_CORREGIDAS.aktionariat.minimo.antesSegunElExpediente, ['«… (7,25 ZCHF el 10/11)» y «… (mejor compra 6,10 el 10/11)»']);
for (const slug of ['aktionariat', 'boss-info', 'switzerlend'])
  for (const k of ['accesoEspana', 'salida']) assert.notEqual(SUIZAS_CORREGIDAS[slug][k].propuestoPorElExpediente, SUIZAS_CORREGIDAS[slug][k].publicado, `${slug}.${k}`);
assert.notEqual(SUIZAS_CORREGIDAS.aktionariat.minimo.propuestoPorElExpediente, SUIZAS_CORREGIDAS.aktionariat.minimo.publicado);
assert.equal(SUIZAS_CORREGIDAS.aktionariat.minimo.entrega, SUIZAS_CORREGIDAS.aktionariat.minimo.publicado, 'Aktionariat: el mínimo publicado no lleva fecha y se queda');

// ---- Brickwise: 11 de reventa (libro de órdenes de la app del 11/11: API a las 09:16 UTC y app a las 09:20 UTC).
const BW_APP = 'https://app.brickwise.at/desktopWeb/marketplace';
const BW_V1 = 'https://api.app.brickwise.at/api/v1/assets', BW_V2 = 'https://api.app.brickwise.at/api/v2/assets';
// [mínimo publicado el 10/11, mínimo del 11/11 (DECISIONES §2), mejor compra 10/11 → 11/11 si cambia (DECISIONES §2)]
const BRICKWISE = {
  'apartamento-vacacional-hinterstoder-50': ['75', '75'],
  'vivienda-schwarzer-weg-18-graz': ['65', '69,90', ['35,00 €', '60,00 €']],
  'vivienda-stallhofstra-e-28-gratwein': ['68,80', '68,80'],
  'drautalresidenz-paternion': ['70', '70'],
  'fotovoltaica-cohotel': ['110', '110'],
  'fotovoltaica-greenpoint': ['100', '100'],
  'randhartingergasse-9-viena': ['78', '78', ['46,00 €', '56,00 €']],
  'local-de-estanco-klagenfurt': ['95', '95'],
  'vivienda-pluddemanngasse-101-graz': ['75', '75'],
  'vivienda-pottendorfer-stra-e-62-wr-neustadt': ['74', '73'],
  'vivienda-sonnleithnergasse-2-viena': ['75', '75'],
};
assert.deepEqual(Object.keys(BRICKWISE).sort(), ofertas.filter(o => o.plataformaSlug === 'brickwise').map(o => o.slug).sort(), 'las 11 de Brickwise');
const LIBRO = `Libro de órdenes de la app de Brickwise leído el ${FES} (09:16–09:20 UTC) en los datos que usa la app; ninguna página pública enseña las órdenes una a una. Cambia a diario.`;
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
  assert.ok((expedientes[slug].revisionAvisos || []).length && expedientes[slug].revisionAvisos.every(a => a.veredicto === 'vigente'), `${slug}: avisos vigentes`);
  const nueva = e => { const r = exp.referenciasFicha.find(x => x.etiqueta === `${e} · ${FES}`); assert.ok(r, `${slug}: «${e}» del expediente`); return r; };
  const vieja = e => { const r = documentos[slug].referencias.find(x => x.etiqueta === `${e} · ${FES_PREVIA}`); assert.ok(r, `${slug}: «${e} · ${FES_PREVIA}» publicada`); return r; };
  const venta = nueva('Venta más barata');
  assert.match(venta.valor, new RegExp(`^${ahora.replace(',', '\\,')}(?:,00)? € por participación \\((\\d+) a ese precio`), `${slug}: venta más barata del expediente`);
  if (antes === ahora) assert.equal(venta.valor, vieja('Venta más barata').valor, `${slug}: la venta más barata no cambia (solo la fecha)`);
  const lote = venta.valor.match(/\((\d+) a ese precio/)[1];
  tarjeta(slug, 'Mínimo de inversión', exp.resumenTarjeta.minimo, BW_APP, FECHA,
    `Precio por participación de la venta más barata del mercado de la app ese día, más un 1,5 % de comisión; a ese precio había ${lote} ${lote === '1' ? 'participación' : 'participaciones'} a la venta. Brickwise no publica un mínimo en reventa ni si una orden se puede comprar en parte. El precio lo fija cada vendedor y cambia a diario. No es el precio de emisión.`,
    `Desde ${antes} € la participación en reventa (${CORTA_PREVIA})`);
  // Referencias del libro de órdenes con la lectura de hoy: «el resto solo re-fecha» (DECISIONES §2 e indicaciones).
  const mc0 = vieja('Mejor oferta de compra').valor, mc1 = nueva('Mejor oferta de compra').valor;
  if (compra) assert.ok(mc0.startsWith(compra[0] + ' ') && mc1.startsWith(compra[1] + ' '), `${slug}: mejor compra ${compra.join(' → ')}`);
  else assert.equal(mc1, mc0, `${slug}: la mejor compra no cambia`);
  assert.equal(venta.fuente, BW_V1);
  refCambia(slug, `Venta más barata · ${FES_PREVIA}`, vieja('Venta más barata').valor,
    { etiqueta: `Venta más barata · ${FES}`, valor: venta.valor, fechaDato: FECHA, fechaConsulta: FECHA, fuente: BW_V1, alcance: LIBRO });
  const p0 = vieja('Participaciones en venta').valor, p1 = nueva('Participaciones en venta').valor;
  assert.equal(nueva('Participaciones en venta').fuente, BW_V2);
  if (p1 === p0) refCambia(slug, `Participaciones en venta · ${FES_PREVIA}`, p0,
    { etiqueta: `Participaciones en venta · ${FES}`, valor: p1, fechaDato: FECHA, fechaConsulta: FECHA, fuente: BW_V2,
      alcance: 'Participaciones de esta emisión a la venta entre inversores ese día (suma de las órdenes abiertas en la app). Cambia a diario.' });
  else {
    // Un cambio de cifra que DECISIONES no recoge: no se re-fecha (sería falso con la cifra vieja) ni se cambia.
    assert.deepEqual([slug, p0, p1], ['vivienda-schwarzer-weg-18-graz', '300', '299'], `${slug}: participaciones en venta ${p0} → ${p1} fuera de DECISIONES`);
    NO_APLICADO.push({ slug, que: `Referencia «Participaciones en venta»: ${p0} (${CORTA_PREVIA}) → ${p1} (${CORTA}), según el expediente y la tabla del revisor`,
      porque: `DECISIONES §2 solo recoge, en Brickwise, los mínimos (Schwarzer Weg 69,90 €, Pottendorfer 73 €), la mejor compra (Schwarzer Weg 60 €, Randhartingergasse 56 €) y que el resto solo cambia de fecha. Esta cifra cambia: re-fecharla con ${p0} sería falso, así que se queda «Participaciones en venta · ${FES_PREVIA}: ${p0}», cierta con su fecha.` });
  }
  assert.equal(nueva('Mejor oferta de compra').fuente, BW_V1);
  refCambia(slug, `Mejor oferta de compra · ${FES_PREVIA}`, mc0,
    { etiqueta: `Mejor oferta de compra · ${FES}`, valor: mc1, fechaDato: FECHA, fechaConsulta: FECHA, fuente: BW_V1,
      alcance: `${LIBRO} Es lo más que ofrecía pagar un comprador ese día, antes de la comisión del 1,5 %.` });
  // «Desistimiento»: igual que lo publicado (se queda con su fecha).
  const des = exp.referenciasFicha.find(x => x.etiqueta === 'Desistimiento');
  assert.equal(des.valor, documentos[slug].referencias.find(x => x.etiqueta === 'Desistimiento').valor, `${slug}: desistimiento sin cambios`);
}

// ---- Hausera · próximas ofertas: la tarjeta no cambia (DECISIONES §2); solo las fechas.
{
  const slug = 'hausera-proximas-ofertas', o = oferta(slug), x = expedientes[slug], exp = x.propuestaTarjeta;
  assert.equal(x.decision, 'mantener');
  const pub = publicadoTarjeta(slug);
  assert.deepEqual([exp.resumenTarjeta.minimo, exp.resumenTarjeta.accesoEspana, exp.resumenTarjeta.salida],
    [pub['Mínimo de inversión'], pub['Acceso desde España'], pub.Salida], 'Hausera: la tarjeta del expediente = la publicada');
  assert.deepEqual(exp.avisos.map(textoAviso), o.avisos.slice(1).map(a => a.texto), 'Hausera: avisos sin cambios');
  assert.deepEqual(exp.metricas, o.metricas, 'Hausera: métricas sin cambios');
  assert.equal(exp.resumen, o.resumen, 'Hausera: resumen sin cambios');
  // Corrección del revisor aplicada al expediente: Alicante 2 acuñó hoy 51.960 tokens; la tarjeta no cambia.
  assert.ok(JSON.stringify(x).includes('El de Alicante 2 acuñó 51.960 tokens el 11/11/2026'), 'Hausera: corrección de los tokens de Alicante 2 en el expediente');
  assert.doesNotMatch(JSON.stringify([o, documentos[slug]]), /\b[57]0 ?%/, `${slug}: no se publica el mínimo de emisión`);
}
// ---- Robinhood, Kraken y Prosegur Digital Gold: sin cambios (solo la fecha); el expediente dice lo mismo.
for (const slug of ['robinhood-classic-stock-tokens', 'kraken-xstocks', 'prosegur-digital-gold']) {
  const o = oferta(slug), exp = expedientes[slug].propuestaTarjeta;
  assert.equal(expedientes[slug].decision, 'mantener');
  assert.deepEqual(exp.metricas, o.metricas, `${slug}: métricas sin cambios`);
  assert.deepEqual(exp.avisos.map(textoAviso), o.avisos.map(a => a.texto), `${slug}: avisos sin cambios`);
  assert.equal(exp.resumen, o.resumen, `${slug}: resumen sin cambios`);
}

// ---- Avisos: se vuelven a fechar al 11/11 solo los comprobados hoy (DECISIONES §1): el editorial común y los
// que el expediente de hoy propone tal cual (todos los demás se revisaron uno a uno en el expediente).
{
  const sinComprobar = [];
  for (const o of ofertas) {
    const prop = new Set((expedientes[o.slug].propuestaTarjeta.avisos || []).map(textoAviso));
    o.avisos = o.avisos.map((a, i) => {
      if ((i === 0 && a.texto === EDITORIAL) || prop.has(a.texto)) return { ...a, verificadaEl: FECHA };
      sinComprobar.push(`${o.slug}: ${a.texto}`); return a;
    });
  }
  assert.deepEqual(sinComprobar, [], 'avisos publicados que el expediente de hoy no recoge');
}

// ---------------------------------------------------------------- comprobaciones de los textos
assert.doesNotMatch(JSON.stringify([oferta('mtbill'), documentos.mtbill]), /lista blanca|greenlist|whitelist/i, 'mTBILL: sin «lista blanca»');
// Tarjeta: castellano llano, sin citas literales de otro idioma, ≤ 120 caracteres en lo nuevo
// (máximo duro 160 en todo), y sin «por participación» en el mínimo (resumenOferta lo descarta).
const largasConservadas = [];
for (const [slug, d] of Object.entries(documentos)) {
  const cartas = d.referencias.filter(r => CANONICA.test(r.etiqueta));
  assert.deepEqual(cartas.map(r => r.etiqueta), tarjetaAntes[slug], `${slug}: mismos datos de tarjeta que lo publicado`);
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
// Fuentes técnicas (API, JSON o código .js): solo las que ya estaban publicadas. Hoy no entra ninguna fuente nueva.
const API = /\/api\/|public-api\.|[?&]wt=json|\.json(?:$|\?)|\.js(?:$|\?)/;
const todas = lote => [...lote.e.flatMap(o => [o.url, ...o.fuentesActuales]), ...Object.values(lote.d).flatMap(d => [...d.fuentes, ...d.referencias.map(r => r.fuente)])];
const antesApi = new Set(todas({ e: escaparateBase.ofertas, d: docBase }).filter(u => API.test(u)));
assert.deepEqual([...new Set(todas({ e: ofertas, d: documentos }).filter(u => API.test(u) && !antesApi.has(u)))], [],
  'fuente técnica nueva (API, JSON o .js)');
assert.deepEqual(CAMBIOS.filter(c => c.campo === 'fuente de la ficha'), [], 'hoy no entra ninguna fuente nueva en las fichas');
const CSP = /<style\b|\sstyle\s*=|\son[a-z]+\s*=|<script/i;
assert.ok(!CSP.test(JSON.stringify(documentos)) && !CSP.test(JSON.stringify(ofertas)), 'texto que la compuerta CSP rechazaría');
// Ningún aviso ni dato de tarjeta nuevo arrastra la fecha del 10/11 como si fuera de hoy.
for (const c of CAMBIOS) if (c.despues && ['aviso', 'tarjeta'].includes(c.campo)) assert.doesNotMatch(c.despues, /10\/11/, `${c.slug}: fecha vieja en «${c.despues}»`);
// Ningún texto nuevo apoya el acceso de mTBILL en la web de Midas.
for (const c of CAMBIOS) if (c.despues) assert.doesNotMatch(c.despues, /países permitidos|Permitted Jurisdictions/i, `${c.slug}: «${c.despues}»`);

// ---------------------------------------------------------------- nada más cambia
// Cada diferencia con la 2026-11-10 tiene que estar en CAMBIOS (o ser una fecha de hoy).
{
  const dif = (a, b) => [...a.filter(x => !b.includes(x)), ...b.filter(x => !a.includes(x))];
  const CAMPOS = new Set(['verificadaEl', 'avisos', 'metricas', 'rentabilidad', 'resumen', 'fuentesActuales']);
  for (const o of ofertas) {
    const b = escaparateBase.ofertas.find(x => x.slug === o.slug), c = CAMBIOS.filter(x => x.slug === o.slug);
    for (const k of Object.keys(b)) if (!CAMPOS.has(k)) assert.deepEqual(o[k], b[k], `${o.slug}.${k} no debía cambiar`);
    assert.deepEqual(Object.keys(o), Object.keys(b));
    assert.deepEqual(o.fuentesActuales, b.fuentesActuales, `${o.slug}: fuentes de la oferta sin cambios`);
    assert.equal(o.resumen, b.resumen, `${o.slug}: resumen sin cambios`);
    const av = dif(b.avisos.map(a => a.texto), o.avisos.map(a => a.texto)).sort();
    assert.deepEqual(av, c.filter(x => x.campo === 'aviso').flatMap(x => [x.antes, x.despues]).filter(Boolean).sort(), `${o.slug}: avisos`);
    assert.ok(o.avisos.every(a => a.verificadaEl === FECHA && a.tono === 'warn' && a.esAntiguedad === false), `${o.slug}: avisos con fecha de hoy`);
    assert.deepEqual(o.avisos.map(a => a.texto).length, b.avisos.length, `${o.slug}: mismo número de avisos`);
    const me = dif(b.metricas.map(m => `${m.etiqueta}: ${m.valor}`), o.metricas.map(m => `${m.etiqueta}: ${m.valor}`)).sort();
    assert.deepEqual(me, c.filter(x => x.campo === 'métrica').flatMap(x => [x.antes, x.despues]).filter(Boolean).sort(), `${o.slug}: métricas`);
    assert.deepEqual(o.metricas.map(m => m.etiqueta.replace(/\d{2}\/\d{2}\/\d{4}/, 'F')), b.metricas.map(m => m.etiqueta.replace(/\d{2}\/\d{2}\/\d{4}/, 'F')), `${o.slug}: orden de las métricas`);
    if (JSON.stringify(o.rentabilidad) !== JSON.stringify(b.rentabilidad)) assert.ok(c.some(x => x.campo === 'rentabilidad'));
    const d = documentos[o.slug], db = docBase[o.slug];
    for (const k of Object.keys(db)) if (!['revisadaEl', 'referencias'].includes(k)) assert.deepEqual(d[k], db[k], `${o.slug}: documentación.${k}`);
    assert.deepEqual(Object.keys(d), Object.keys(db));
    // Referencias: sin contar la fecha de consulta y el alcance de las de la tarjeta conservadas.
    const clave = r => `${r.etiqueta}: ${r.valor}`;
    const comp = r => JSON.stringify([r.etiqueta, r.valor, r.fechaDato, r.fuente, CANONICA.test(r.etiqueta) ? '' : r.alcance, CANONICA.test(r.etiqueta) ? '' : r.fechaConsulta]);
    const refsC = c.filter(x => /^referencia|^tarjeta/.test(x.campo));
    const tocadas = new Set(refsC.flatMap(x => [x.antes, x.despues]).filter(Boolean).map(t => t.split(': ')[0]));
    for (const r of db.referencias) if (!tocadas.has(r.etiqueta)) assert.ok(d.referencias.some(x => comp(x) === comp(r)), `${o.slug}: referencia «${clave(r)}» cambió sin anotar`);
    for (const r of d.referencias) if (!tocadas.has(r.etiqueta)) assert.ok(db.referencias.some(x => comp(x) === comp(r)), `${o.slug}: referencia «${clave(r)}» nueva sin anotar`);
    assert.equal(d.referencias.length, db.referencias.length, `${o.slug}: mismo número de referencias`);
    assert.deepEqual(d.referencias.map(r => r.etiqueta.replace(/\d{2}\/\d{2}\/\d{4}/, 'F')), db.referencias.map(r => r.etiqueta.replace(/\d{2}\/\d{2}\/\d{4}/, 'F')), `${o.slug}: orden de las referencias`);
  }
}
// Ofertas sin cambios (DECISIONES §2): solo las fechas de verificación.
for (const slug of ['robinhood-classic-stock-tokens', 'kraken-xstocks', 'prosegur-digital-gold', 'hausera-proximas-ofertas'])
  assert.deepEqual(CAMBIOS.filter(c => c.slug === slug), [], `${slug}: solo fechas`);
// Lo que cambia, ficha a ficha, es exactamente lo de DECISIONES §2.
{
  const cuenta = Object.fromEntries([...new Set(CAMBIOS.map(c => c.slug))].map(s => [s, CAMBIOS.filter(c => c.slug === s).map(c => c.campo).sort()]));
  const spiko = ['métrica', 'referencia de la ficha', 'rentabilidad'];
  const bw = ['referencia de la ficha', 'referencia de la ficha', 'referencia de la ficha', 'tarjeta'];
  assert.deepEqual(cuenta, {
    'spiko-letras-del-tesoro-euro': spiko, 'spiko-letras-del-tesoro-dolar': spiko, 'spiko-smart-cash-euro': spiko,
    mtbill: ['métrica'], aktionariat: ['aviso', 'métrica', 'métrica'], 'boss-info': ['aviso', 'métrica', 'tarjeta'],
    switzerlend: ['aviso', 'aviso', 'métrica', 'tarjeta'],
    ...Object.fromEntries(Object.keys(BRICKWISE).map(s => [s, s === 'vivienda-schwarzer-weg-18-graz' ? bw.slice(1) : bw])),
  }, 'cambios por ficha');
}

// ---------------------------------------------------------------- escaparate y manifiesto
const colecciones = { principales: 0, secundario: 0, en_camino: 0 };
for (const o of ofertas) colecciones[o.coleccion]++;
assert.deepEqual(colecciones, COLECCIONES);
assert.deepEqual(ofertas.map(o => o.slug), escaparateBase.ofertas.map(o => o.slug), 'las mismas 22, en el mismo orden');
assert.deepEqual(ofertas.map(o => o.estadoRevision), escaparateBase.ofertas.map(o => o.estadoRevision), 'los estados de revisión no cambian');
const escaparate = {
  versionEsquema: 2,
  fuente: {
    notaOrigen: `Revisión del ${FES} (puesta al día pedida por el responsable del proyecto): las 22 fichas revisadas con fuentes primarias, ` +
      'un expediente por oferta y revisión independiente por grupo; ninguna candidata admitida; sin altas ni retiradas. ' +
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
assert.match(escaparate.fuente.notaOrigen, /^Revisión del 11\/11\/2026 \(puesta al día pedida por el responsable del proyecto\)/, 'nota de origen sin nombres de personas');
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
    aprobada_referencia = 'Entrega ${ETIQUETA}: radar (${radar.fuentes.length} fuentes) y ${ofertas.length} fichas comprobados el ${FES} con fuentes primarias, expediente por oferta y revisión independiente; mismas ${ofertas.length} ofertas (${colecciones.principales}/${colecciones.secundario}/${colecciones.en_camino}) y ${escaparate.plataformas.length} plataformas. Puesta al día pedida por el responsable del proyecto el ${FES}; ciclo autorizado por su orden.'
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
  `-- Entrega ${ETIQUETA} (preparada el ${FES}) sobre la revisión publicada ${DESDE} (${PREVIA}). Ciclo pedido y autorizado por el responsable del proyecto.\n` +
  `-- Radar y ${ofertas.length} fichas comprobados hoy; ${escaparate.plataformas.length} plataformas y ${ofertas.length} ofertas (${colecciones.principales}/${colecciones.secundario}/${colecciones.en_camino}). Solo escribe en rwadar_catalogo.\n` +
  `-- Generado por rwadar-app/data/verificaciones/${ETIQUETA}-v2/preparar-entrega.mjs; revisar antes de aplicar.\n` +
  nueva.sql.replace('-- El lote entra como BORRADOR. Este fichero nunca lo aprueba ni lo publica.',
    '-- Este aplicador importa y aprueba al final, únicamente si pasan todas las guardas.')
    .replace('begin;', () => 'begin isolation level serializable;\n' + guarda)
    .replace(/commit;\n$/, () => aprobar + 'commit;\n'));
{
  const sql = fs.readFileSync(archivo, 'utf8');
  assert.ok(sql.includes(guarda) && sql.endsWith(aprobar + 'commit;\n'), 'guarda al principio y aprobación al final');
  assert.ok(sql.includes('-- Este aplicador importa y aprueba al final, únicamente si pasan todas las guardas.'), 'cabecera del aplicador');
  assert.equal(sql.match(/^begin isolation level serializable;$/gm).length, 1);
  assert.doesNotMatch(sql, /^\s*(?:insert\s+into|update|delete\s+from)\s+public\./im, 'hoy no se escribe en public.*');
  assert.doesNotMatch(sql, /^\s*(?:truncate|alter|drop|grant|revoke|create)\b/im, 'sin DDL ni permisos');
  assert.ok(sql.startsWith(`-- Entrega ${ETIQUETA} (preparada el ${FES}) sobre la revisión publicada ${DESDE} (${PREVIA}). Ciclo pedido y autorizado por el responsable del proyecto.\n`) &&
    sql.includes(`Puesta al día pedida por el responsable del proyecto el ${FES}; ciclo autorizado por su orden.'`), 'cabecera y referencia de aprobación sin nombres de personas');
}
const revision = { versionEsquema: 2, revisionId: nueva.revisionId, hash: nueva.hash,
  revisionAnterior: PREVIA, hashRevisionAnterior: HASH_PREVIA, revisionAnteriorComprobadaEnRemoto: true,
  lecturaPublica: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/lectura-publica/`, etiqueta: ETIQUETA, fechaRadar: FECHA,
  revisionDocumental: HOY, plataformas: escaparate.plataformas.length, ofertas: ofertas.length, colecciones,
  vigenciaDias: 7, venceTrasEl: ULTIMO, nuevasAltas: 0, retiradas: 0, tablasPublicas: [],
  estado: 'borrador', aplicadoEnRemoto: false, publicacionWeb: false };
escribir(path.join(destino, 'revision.json'), revision);

// ---------------------------------------------------------------- contraste (lo que cambia)
const tarjetas = Object.fromEntries(Object.entries(documentos).map(([slug, d]) => [slug,
  Object.fromEntries(d.referencias.filter(r => CANONICA.test(r.etiqueta)).map(r => [r.etiqueta, r.valor]))]));
escribir(path.join(DIR, `contraste-${ETIQUETA}.json`), { tipo: 'revision_integral', fecha: FECHA, etiqueta: ETIQUETA,
  revisionAnterior: PREVIA, revisionNueva: nueva.revisionId,
  decision: `Puesta al día pedida por el responsable del proyecto el ${FES} («Actualiza las ofertas y el gráfico y las noticias…»). Lo que entra: DECISIONES-COORDINADOR.md (lista cerrada).`,
  archivos: Object.fromEntries(['DECISIONES-COORDINADOR.md', `radar-contraste-${FECHA}.json`, 'cambios-radar.json']
    .map(n => [n, sha(path.join(DIR, n))])),
  radar: { fuentes: contraste.fuentes, correctas: contraste.correctas, verificacionesManuales: Object.keys(cambiosRadar.verificacionesManuales),
    cambios: { fuentes: {}, plataformas: {} } },
  cifras: Object.fromEntries(Object.entries(SPIKO).map(([s, v]) => [s, { antes: v.antes, despues: v.pct, valorLiquidativo: v.fechaDato,
    calculo: `(${v.calculo[1]} / ${v.calculo[0]})^(365/${v.calculo[2]}) − 1`, consulta: FECHA }])),
  condicionHora: { 'spiko-smart-cash-euro': 'VL del 10/11 válida solo si la entrega se monta antes de las 19:30 UTC del 11/11 (corrección P1 del revisor); si no, volver a leer la API y fechar con la VL del 11/11. La hora del montaje está en INFORME-ENTREGA.md.' },
  vigencia: { verificadaEl: FECHA, vigenciaDias: 7, ultimoDiaVigente: ULTIMO },
  cambios: CAMBIOS, tarjetaConservadasDeMasDe120: largasConservadas, tarjetas,
  expedientesSuizosCorregidos: { nota: 'Correcciones C1–C3 del revisor de reventa: el «antes» de resumenTarjeta tiene que ser el texto publicado. Los expedientes no se editan en el montaje: la corrección queda aquí. Opción (a): se conservan los textos publicados de acceso y salida; el mínimo de Boss Info y Switzerlend solo cambia de fecha; el de Aktionariat no lleva fecha y se queda.', ...SUIZAS_CORREGIDAS },
  noAplicadoTalCual: NO_APLICADO,
  sinCambios: ['las 25 plataformas del radar y sus textos, salvo las fechas de consulta', 'public.plataformas y public.fuentes (el SQL no las toca)',
    'colecciones 8/13/1, estados de revisión, fuentes de las ofertas e imágenes', 'Robinhood, Kraken, Prosegur Digital Gold y Hausera: solo las fechas',
    'las noticias (no son parte de esta entrega)'],
  altas: [], retiradas: [], colecciones });
console.log(JSON.stringify({ etiqueta: ETIQUETA, revisionId: nueva.revisionId, hash: nueva.hash, previa: PREVIA, sha256: sha(archivo),
  plataformas: escaparate.plataformas.length, fuentesRadar: radar.fuentes.length, ofertas: ofertas.length, colecciones, cambios: CAMBIOS.length,
  noAplicado: NO_APLICADO.length }));

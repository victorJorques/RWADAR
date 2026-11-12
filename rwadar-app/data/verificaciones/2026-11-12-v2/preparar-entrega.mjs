// Entrega del catálogo «2026-11-12»: puesta al día pedida por el responsable del proyecto («Tendrás que actualizar
// la información a hoy y acelerar»). Preparación LOCAL: sin red ni servicios remotos. Reproducible byte a byte:
// ninguna salida depende de la hora.
//
//   node rwadar-app/data/verificaciones/2026-11-12-v2/preparar-entrega.mjs
//
// Parte exactamente de la revisión publicada 24b5f7de (entrega 2026-11-11), leída hoy como visitante
// (lectura-publica/, 00:30:28–00:30:32 UTC), y aplica SOLO lo que dice DECISIONES-COORDINADOR.md (lista cerrada,
// con las correcciones obligatorias de los revisores de su §4):
// 1. Radar: las 69 fuentes comprobadas hoy (radar-contraste-2026-11-12.json, 69/69). cambios-radar.json no cambia
//    ninguna dirección ni ningún texto: solo dos lecturas a mano (REGAFI, por su API pública, a las 00:37 UTC).
// 2. Las 22 fichas, revisadas hoy con fuentes primarias (expedientes/) y revisión independiente por grupo
//    (revision-independiente/): verificadaEl 12/11, 7 días de vigencia (último día el 19/11), avisos comprobados
//    hoy con fecha de hoy y los cambios por oferta de DECISIONES §2. Cada texto «antes» se exige tal cual: si no
//    está, el script falla.
// 3. Tres datos de la tarjeta (etiqueta fija): los publicados se conservan con consulta del 12/11; cambian solo los
//    mínimos de las 11 de Brickwise, de Boss Info, de Switzerlend y de Hausera (solo la fecha; en el alcance del de
//    Hausera, «Hoy no se puede invertir» pasa a «El 12/11/2026 aún no se podía invertir», corrección R1 de las
//    revisiones de contenido y de cumplimiento).
// Hoy NO se toca public.plataformas ni public.fuentes: el SQL solo escribe en rwadar_catalogo.
// Sin altas ni retiradas: 22 ofertas (8/13/1) y 25 plataformas. Las noticias no son parte de esta entrega.
//
// Condición de hora de Spiko (Smart Cash con la VL del 11/11; Letras con las del 10 y 11/11): vale si la entrega se
// monta antes de las 18:00 UTC del 12/11 (indicación del coordinador; la API anuncia la siguiente cifra de las Letras
// a las 18:00 UTC y la de Smart Cash a las 19:30 UTC). El script no mira el reloj (así es reproducible); la hora del
// montaje está en INFORME-ENTREGA.md.
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
const ETIQUETA = '2026-11-12', FECHA = '2026-11-12', DESDE = '2026-11-11', HOY = '2026-11-12';
const FES = '12/11/2026', CORTA = '12/11';
const FES_PREVIA = '11/11/2026', CORTA_PREVIA = '11/11';
const ULTIMO = '2026-11-19'; // último día vigente: verificadaEl 12/11 y 7 días
const PREVIA = '24b5f7de-2834-3e15-6ae4-62a6d9565161';
const HASH_PREVIA = '24b5f7de28343e156ae462a6d9565161d49d251cb45b9422b208c0fb0bceec22';
const ULTIMO_PREVIA = '2026-11-18';
const COLECCIONES = { principales: 8, secundario: 13, en_camino: 1 };
const EDITORIAL = 'Referencia editorial gratuita. El proveedor comprueba admisión, condiciones y riesgos; RWAdar no recibe dinero de inversiones.';
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const escribir = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); };
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base = path.resolve(DIR, `../${DESDE}-v2`);
const REVISOR = path.join(DIR, 'revision-independiente');

// ---------------------------------------------------------------- partida: la publicada
const previa = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: DESDE, versionEsquema: 2 }));
assert.equal(previa.revisionId, PREVIA, `la ${DESDE} local no es la revisión publicada`);
assert.equal(previa.hash, HASH_PREVIA, `identidad (huella) de la ${DESDE}`);
const revisionDesde = leer(path.join(ROOT, `rwadar-app/data/importaciones/catalogo-${DESDE}-v2/revision.json`));
assert.deepEqual([revisionDesde.revisionId, revisionDesde.hash, revisionDesde.venceTrasEl], [PREVIA, HASH_PREVIA, ULTIMO_PREVIA]);
const snapshot = leerBloquesCatalogo(fs.readFileSync(path.join(ROOT, 'rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8'));
assert.ok([...snapshot.plataformas, ...snapshot.ofertas].every(x => x.revisionId === PREVIA), 'el catálogo sincronizado de la web no es la 24b5f7de');
assert.deepEqual([snapshot.plataformas.length, snapshot.ofertas.length], [25, 22]);
assert.ok(snapshot.ofertas.every(o => o.verificadaEl === DESDE), 'el catálogo sincronizado está verificado el 11/11');
const radarBase = leer(path.join(base, 'radar-canonico-26.json'));
const escaparateBase = leer(path.join(base, 'escaparate-publicacion.json'));
const docBase = leer(path.join(base, 'documentacion-ofertas.json'));
const manifiestoBase = leer(path.join(base, 'manifiesto-catalogo.json'));

// Lo leído hoy como visitante (lectura-publica/, 00:30:28–00:30:32 UTC) es exactamente la base local.
const lp = path.join(DIR, 'lectura-publica');
const pubO = leer(path.join(lp, 'ofertas-v2.json')), pubP = leer(path.join(lp, 'plataformas-v2.json'));
const pubT = leer(path.join(lp, 'plataformas-todas.json'));
{
  const hora = fs.readFileSync(path.join(lp, 'hora-lectura.txt'), 'utf8');
  assert.match(hora, /2026-11-12T00:30:28Z – 2026-11-12T00:30:32Z/, 'hora de la lectura pública');
  const r = JSON.parse(hora.match(/Resultado: (\{.*\})/)[1]);
  assert.deepEqual([r.revision, r.plataformas, r.ofertas, r.colecciones, r.verificadaEl], [[PREVIA], 25, 22, COLECCIONES, [DESDE]]);
}
assert.ok([...pubO, ...pubP].every(x => x.revision_id === PREVIA), 'la publicada leída hoy es la 24b5f7de');
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
// Los tres datos publicados de la tarjeta, tal como los lee un visitante.
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
// La cabecera de cambios-radar.json se quedó con la fecha y la nota del 11/11 (el archivo se copió del día
// anterior); sus dos lecturas a mano son de hoy (métodos con «12/11/2026 a las 00:37 UTC»). Corregida en la
// revisión de la entrega (recomendación de la revisión de SQL): fecha 2026-11-12 y nota del 12/11/2026. La salida
// no depende de la cabecera (solo el SHA-256 que guarda contraste-2026-11-12.json).
assert.equal(cambiosRadar.fecha, FECHA, 'cambios-radar.json: fecha inesperada');
assert.ok(cambiosRadar.nota.startsWith(`Cambios del radar comprobados a mano el ${FES}.`), 'cambios-radar.json: nota de hoy');
assert.deepEqual([cambiosRadar.fuentes, cambiosRadar.plataformas], [{}, {}], 'hoy no cambia ninguna dirección ni ningún texto del radar');
assert.ok(!cambiosRadar.comprobacionesCambiadas || !Object.keys(cambiosRadar.comprobacionesCambiadas).length, 'hoy no cambia ninguna comprobación');
const COMPROBACIONES = leer(path.join(ROOT, 'rwadar-app/data/comprobaciones-fuentes.json')).fuentes;
const plano = t => t.replace(/[\s  ]+/g, ' ');
const cumple = (id, texto) => COMPROBACIONES[id].every(p => new RegExp(p, 'i').test(plano(texto)));
assert.deepEqual(Object.keys(cambiosRadar.verificacionesManuales), ['spiko-regafi', 'spiko-regafi-pasaporte-es']);
for (const [id, m] of Object.entries(cambiosRadar.verificacionesManuales)) {
  const c = contraste.contraste.find(x => x.id === id);
  assert.ok(c.ok && c.manual === m.motivo && c.urlLeida === m.url && c.metodo === m.metodo, `${id}: el contraste recoge la lectura a mano`);
  assert.deepEqual(c.literales, m.literales, `${id}: literales`);
  assert.match(m.metodo, /12\/11\/2026 a las 00:37 UTC/, `${id}: lectura de hoy`);
  assert.ok(cumple(id, c.literales.join(' ')), `${id}: la lectura a mano dice lo que respalda`);
}
// Las demás 67: cada comprobación de comprobaciones-fuentes.json está en los literales capturados hoy.
for (const c of contraste.contraste.filter(x => !x.manual))
  assert.ok(cumple(c.id, c.literales.join(' ')), `${c.id}: los literales de hoy no dicen lo que respalda`);
{
  assert.equal(sha(path.join(DIR, 'radar-manual/regafi-spiko-entidad.json')), '62ab887b074058421fd6aaf90cc82190b9ed356166fbcea878a8b96dbf2dbb26', 'copia de la entidad en REGAFI');
  const copia = path.join(DIR, 'radar-manual/regafi-spiko-pasaporte-espagne.json');
  assert.equal(sha(copia), 'fdf10d2d445b2cc90fec0c31215cd065cdab7c0a325cba03fceb47d2a7de66c6', 'copia del pasaporte de REGAFI (igual que el 10 y el 11/11)');
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
// Aviso nuevo (DECISIONES §2): se inserta antes del aviso «antes» indicado (o al final) y queda comprobado hoy.
const AVISOS_NUEVOS = new Set();
const avisoNuevo = (slug, texto, antesDe = null) => {
  const o = oferta(slug);
  assert.ok(!o.avisos.some(a => a.texto === texto), `${slug}: el aviso nuevo ya estaba`);
  const i = antesDe == null ? o.avisos.length : unico(o.avisos, a => a.texto === antesDe, `${slug}: aviso «${antesDe}»`);
  o.avisos.splice(i, 0, { texto, tono: 'warn', esAntiguedad: false, verificadaEl: FECHA });
  AVISOS_NUEVOS.add(`${slug}\n${texto}`);
  anota(slug, 'aviso', null, texto);
};
const metrica = (slug, etiqueta, valor, nueva) => {
  const o = oferta(slug), i = unico(o.metricas, m => m.etiqueta === etiqueta, `${slug}: métrica «${etiqueta}»`);
  assert.equal(o.metricas[i].valor, valor, `${slug}: métrica «${etiqueta}» «antes»`);
  assert.notDeepEqual(o.metricas[i], nueva, `${slug}: la métrica «${etiqueta}» no cambia`);
  anota(slug, 'métrica', `${etiqueta}: ${valor}`, `${nueva.etiqueta}: ${nueva.valor}`);
  o.metricas[i] = nueva;
};
const metricaNueva = (slug, despuesDe, nueva) => {
  const o = oferta(slug), i = unico(o.metricas, m => m.etiqueta === despuesDe, `${slug}: métrica «${despuesDe}»`);
  assert.ok(!o.metricas.some(m => m.etiqueta === nueva.etiqueta), `${slug}: la métrica «${nueva.etiqueta}» ya estaba`);
  o.metricas.splice(i + 1, 0, nueva);
  anota(slug, 'métrica', null, `${nueva.etiqueta}: ${nueva.valor}`);
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
const refNueva = (slug, despuesDeEtiqueta, r) => {
  const d = documentos[slug], i = refIndice(slug, despuesDeEtiqueta);
  assert.ok(!d.referencias.some(x => x.etiqueta === r.etiqueta), `${slug}: la referencia «${r.etiqueta}» ya estaba`);
  d.referencias.splice(i + 1, 0, r);
  anota(slug, 'referencia de la ficha', null, `${r.etiqueta}: ${r.valor}`);
  conFuente(slug, r.fuente);
};
const refQuita = (slug, etiqueta, valor) => {
  const d = documentos[slug], i = refIndice(slug, etiqueta, valor);
  anota(slug, 'referencia de la ficha', `${etiqueta}: ${valor}`, null);
  d.referencias.splice(i, 1);
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
// Un expediente «publicada» por oferta y seis de candidatas, todas «no_admitir» (DECISIONES §3). Nada de lo que se
// escribe depende de las candidatas.
{
  const todos = fs.readdirSync(path.join(DIR, 'expedientes')).filter(n => n.endsWith('.json')).sort().map(n => leer(path.join(DIR, 'expedientes', n)));
  assert.deepEqual(todos.filter(e => e.tipoExpediente === 'publicada').map(e => e.slug).sort(), ofertas.map(o => o.slug).sort(), 'un expediente «publicada» por oferta');
  const candidatas = todos.filter(x => x.tipoExpediente !== 'publicada');
  for (const e of candidatas) {
    assert.equal(e.tipoExpediente, 'candidata', `${e.slug}: tipo de expediente`);
    assert.equal(e.decision, 'no_admitir', `${e.slug}: DECISIONES §3 no admite ninguna candidata hoy`);
    assert.ok(!porSlug.has(e.slug), `${e.slug}: candidata con el slug de una publicada`);
  }
  assert.equal(candidatas.length, 6, 'las seis candidatas de DECISIONES §3');
}

// Tres datos de la tarjeta: etiqueta fija (normas del 03/11). Los publicados se conservan con consulta del 12/11
// salvo los que cambian abajo, que se reescriben con fuente y fecha.
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

// ---- Spiko. Letras del Tesoro Euro y Dólar: sin cambios (mismos ficheros de la API que ayer; el 11/11 fue festivo
// en Francia y no hubo VL nueva). Smart Cash: 2,84 % con la VL del 11/11.
const API = n => leer(path.join(REVISOR, 'fuentes/principales', n));
{
  // Lo que leyó el revisor hoy (00:50 UTC) en la API pública: mismos archivos que el 11/11.
  assert.equal(sha(path.join(REVISOR, 'fuentes/principales/spiko-api-EUTBL-yield.json')).slice(0, 16), '9cc1e1bed0f4e10b');
  assert.equal(sha(path.join(REVISOR, 'fuentes/principales/spiko-api-USTBL-yield.json')).slice(0, 16), '1bbc7629f573156d');
  assert.equal(API('spiko-api-EUTBL-yield.json').monthlyYield, '0.0241');
  assert.equal(API('spiko-api-USTBL-yield.json').monthlyYield, '0.0402');
  assert.deepEqual([API('spiko-api-EUTBL-totals.json').netAssetValue.day, API('spiko-api-EUTBL-totals.json').netAssetValue.amount.value], ['2026-11-11T00:00:00.000Z', '1.062738']);
  assert.deepEqual([API('spiko-api-USTBL-totals.json').netAssetValue.day, API('spiko-api-USTBL-totals.json').netAssetValue.amount.value], ['2026-11-10T00:00:00.000Z', '1.102496']);
  for (const [slug, cifra] of [['spiko-letras-del-tesoro-euro', '2,41 %'], ['spiko-letras-del-tesoro-dolar', '4,02 %']]) {
    const o = oferta(slug), p = expedientes[slug].propuestaTarjeta;
    assert.equal(expedientes[slug].decision, 'mantener');
    assert.equal(o.rentabilidad.mostrada, cifra); assert.equal(p.rentabilidad.mostrada, cifra, `${slug}: el expediente da otra cifra`);
    assert.deepEqual(p.metricas, o.metricas, `${slug}: métricas = expediente`);
    assert.equal(p.resumen, o.resumen, `${slug}: resumen sin cambios`);
    // El expediente re-fecha la consulta del literal al 12/11; DECISIONES §2: «Solo cambia la fecha de verificación».
    assert.equal(p.rentabilidad.literal, o.rentabilidad.literal.replace(`consultado el ${FES_PREVIA}`, `consultado el ${FES}`), `${slug}: literal del expediente`);
  }
  NO_APLICADO.push({ slug: 'spiko-letras-del-tesoro-euro y spiko-letras-del-tesoro-dolar', que: `Literal de la rentabilidad «… consultado el ${FES_PREVIA}» → «… consultado el ${FES}» (propuesta de los expedientes)`,
    porque: 'DECISIONES §2: «sin cambios … Solo cambia la fecha de verificación». La cifra, la VL y la fuente son las mismas que ayer (mismos ficheros de la API); el literal publicado sigue siendo cierto con su fecha de consulta del 11/11, igual que la referencia «Rentabilidad publicada · 31 días».' });
}
{
  const slug = 'spiko-smart-cash-euro', o = oferta(slug), x = expedientes[slug], p = x.propuestaTarjeta;
  // API pública (lectura del revisor a las 00:50:49 UTC): 2,84 % con la VL de 1,017029 € del 11/11.
  const y = API('spiko-api-eurSAFO-yield.json'), t = API('spiko-api-eurSAFO-totals.json');
  assert.deepEqual([y.dailyYield, y.weeklyYield, y.monthlyYield], ['0.0284', '0.0284', '0.0284']);
  assert.deepEqual([t.netAssetValue.day, t.netAssetValue.amount.value], ['2026-11-11T00:00:00.000Z', '1.017029']);
  assert.equal(y.nextYieldTimestamp, String(Date.UTC(2026, 10, 12, 19, 30) / 1000), 'la siguiente cifra llega el 12/11 a las 19:30 UTC');
  // Por qué cambia la explicación del literal (revisor: «actualizar (fecha y explicación) · confirmado»): con la VL del
  // 11/11, «lo que creció el fondo en su último día de cálculo, pasado a un año» da 2,80 % capitalizando y 2,76 % a ritmo
  // simple (DECISIONES §4), no 2,84 %. Estas cifras no se publican: solo justifican el cambio de literal.
  const r1 = 1.017029 / 1.016952, aPct = x => (x * 100).toFixed(2).replace('.', ',') + ' %';
  const unDia = `${aPct(Math.pow(r1, 365) - 1)} capitalizando y ${aPct((r1 - 1) * 365)} a ritmo simple`;
  assert.equal(unDia, '2,80 % capitalizando y 2,76 % a ritmo simple', 'crecimiento de un día con la VL del 11/11');
  assert.equal(o.rentabilidad.mostrada, '2,84 %'); assert.equal(p.rentabilidad.mostrada, '2,84 %');
  assert.match(o.rentabilidad.literal, /lo que creció el fondo en su último día de cálculo, pasado a un año \(valor liquidativo del 10\/11\/2026; consultado el 11\/11\/2026\)/);
  // DECISIONES §2: «valor liquidativo del 11/11/2026; consultado el 12/11/2026». El literal del expediente (confirmado por
  // el revisor) lo dice con paréntesis: «con el valor liquidativo del 11/11/2026 (consultado el 12/11/2026)».
  assert.ok(p.rentabilidad.literal.includes('con el valor liquidativo del 11/11/2026 (consultado el 12/11/2026)') && !p.rentabilidad.literal.includes('10/11/2026'), `${slug}: literal del expediente`);
  assert.match(plano(fs.readFileSync(path.join(REVISOR, 'principales.md'), 'utf8')), /Spiko Euro \(Smart Cash\) \| actualizar \(fecha y explicación\) \| confirmado/);
  anota(slug, 'rentabilidad', `${o.rentabilidad.mostrada} · ${o.rentabilidad.literal}`, `${p.rentabilidad.mostrada} · ${p.rentabilidad.literal}`);
  o.rentabilidad = { mostrada: p.rentabilidad.mostrada, literal: p.rentabilidad.literal };
  metrica(slug, 'Rentabilidad publicada · neta y variable · 10/11/2026', '2,84 %', { etiqueta: 'Rentabilidad publicada · neta y variable · 11/11/2026', valor: '2,84 %' });
  refCambia(slug, 'Rendimiento neto publicado', '2,84 %', { valor: '2,84 %', fechaDato: '2026-11-11', fechaConsulta: FECHA, fuente: 'https://data.spiko.io/safo-eur',
    alcance: `Tipo neto de comisiones que publica Spiko con el valor liquidativo del 11/11/2026 (consultado el ${FES}); la web lo presenta como el tipo que paga cada día el banco con el que el fondo tiene el swap. Variable: sigue al €STR.` });
  assert.deepEqual(o.metricas, p.metricas, `${slug}: métricas = expediente`);
  assert.equal(o.resumen, p.resumen, `${slug}: resumen sin cambios`);
  NO_APLICADO.push({ slug, que: 'Literal de la rentabilidad: DECISIONES §2 cita «valor liquidativo del 11/11/2026; consultado el 12/11/2026» (con punto y coma, como el literal publicado)',
    porque: `Se usa el literal del expediente, que el revisor confirma («actualizar (fecha y explicación)»): dice lo mismo con paréntesis («con el valor liquidativo del 11/11/2026 (consultado el 12/11/2026)»). Cambiar solo las fechas del literal publicado dejaría «lo que creció el fondo en su último día de cálculo, pasado a un año», que con la VL del 11/11 da ${unDia} y no 2,84 %.` });
}
// Smart Cash: el aviso 2 se mantiene (nadie confirma ni niega hoy que se comercialice en España).
assert.ok(oferta('spiko-smart-cash-euro').avisos.some(a => a.texto.startsWith('Spiko dice que se puede contratar desde España, pero no hemos podido confirmar')));

// ---- mTBILL: rentabilidad pasada del oráculo del emisor (opción A del revisor), aviso con la ventana y fuera las
// referencias antiguas del APY de midas.app. Sigue en «fuentes_en_conflicto» (límites de reembolso).
{
  const slug = 'mtbill', o = oferta(slug), x = expedientes[slug], p = x.propuestaTarjeta;
  const rondas = API('mtbill-oraculo-rondas.json');
  const [r468, r492] = [rondas.rounds['468'], rondas.rounds['492']];
  assert.deepEqual(rondas.latest, r492, 'la ronda 492 sigue siendo la última');
  assert.deepEqual([r468[1], new Date(r468[2] * 1000).toISOString()], [107410723, '2026-10-06T14:16:11.000Z']);
  assert.deepEqual([r492[1], new Date(r492[2] * 1000).toISOString()], [107768132, '2026-11-10T18:40:23.000Z']);
  const dias = (r492[2] - r468[2]) / 86400, simple = (r492[1] / r468[1] - 1) * 365 / dias;
  assert.equal((simple * 100).toFixed(2).replace('.', ','), '3,45', `mTBILL: la cifra no sale de las rondas 468 → 492 (${simple})`);
  assert.equal(dias.toFixed(2), '35.18');
  assert.match(plano(fs.readFileSync(path.join(REVISOR, 'principales.md'), 'utf8')), /Publicar \*\*3,45 % anual en USD\*\*/);
  assert.equal(o.estadoRevision, 'fuentes_en_conflicto', 'mTBILL sigue en conflicto (límites de reembolso)');
  assert.equal(o.rentabilidad, null);
  metricaNueva(slug, `Valor por token · ${'10/11/2026'}`, { etiqueta: 'Rentabilidad pasada · 5 semanas hasta el 10/11/2026 · en USD', valor: '3,45 % anual' });
  avisoNuevo(slug, 'La rentabilidad es pasada y la calcula RWAdar con el valor que publica el emisor (del 06/10 al 10/11/2026): está en dólares, no descuenta el 0,07 % del reembolso inmediato ni el cambio euro/dólar, y no garantiza la futura.');
  refQuita(slug, 'APY observado', '3,41 %');
  refQuita(slug, 'Rendimiento publicado en Midas', '3,42 % · 7D APY');
  assert.ok(!documentos[slug].referencias.some(r => /APY/.test(`${r.etiqueta} ${r.valor}`)), 'mTBILL: sin APY antiguos en la ficha');
  // Lo demás, como lo publicado y el expediente (salvo la cifra de 3,53 %, rechazada por el revisor).
  assert.deepEqual(p.metricas.slice(0, -1), o.metricas.slice(0, -1), 'mTBILL: métricas publicadas = expediente');
  assert.deepEqual(p.avisos.slice(0, -1), o.avisos.slice(0, -1).map(a => a.texto), 'mTBILL: avisos publicados = expediente');
  assert.equal(p.metricas.at(-1).valor, '3,53 % anual'); assert.equal(p.rentabilidad.mostrada, '3,53 %');
  assert.equal(p.resumen, o.resumen);
  assert.deepEqual(tarjetaAntes.mtbill, [], 'mTBILL: sin datos de tarjeta publicados');
  NO_APLICADO.push({ slug, que: 'Campo «rentabilidad»: null → «3,45 %» con el literal del revisor («entre el 06/10/2026 (1,07410723 USD) y el 10/11/2026 (1,07768132 USD), 5 semanas»)',
    porque: 'El contrato del catálogo (validarOferta: «una oferta bloqueada conserva cifras comerciales») y la base de datos (rwadar_catalogo.ofertas: estado_revision = \'actual\' o rentabilidad y precio nulos) no admiten rentabilidad en una ficha que no está «actual», y DECISIONES §2 mantiene mTBILL en «fuentes_en_conflicto». La cifra entra como métrica («Rentabilidad pasada · 5 semanas hasta el 10/11/2026 · en USD: 3,45 % anual») y el aviso nuevo lleva la ventana; la vista pública tapa las métricas mientras dure el conflicto, como dice DECISIONES.' });
  NO_APLICADO.push({ slug, que: 'Datos de tarjeta propios (mínimo, acceso y salida del expediente)',
    porque: 'La ficha publicada no los tiene y DECISIONES no los añade; además, por estar en «fuentes_en_conflicto», la web y la app los ocultan.' });
}

// ---- Aktionariat, Boss Info y Switzerlend: fechas al 12/11 (se conservan los textos publicados de acceso y salida).
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
  // «Última operación» (C1 del revisor): fuente, la publicada (el portal), no la API POST getTrades (405 en un
  // navegador); alcance, lo comprobado hoy, y el importe del vendedor con su fecha (10/11).
  const prop = exp.referenciasFicha.find(x => /^Última operación/.test(x.etiqueta));
  assert.deepEqual([prop.etiqueta, prop.valor, prop.fuente], [`Última operación · ${FES}`, '8,40 ZCHF (1 acción, 05/11/2026)', 'https://shares.bossinfo.com/api/secondarymarkets/getTrades']);
  assert.match(plano(fs.readFileSync(path.join(REVISOR, 'suiza.md'), 'utf8')), /la fuente debe ser `https:\/\/shares\.bossinfo\.com\/` \(o `\/trade`\), no la API POST, que da 405/);
  const vieja = documentos[slug].referencias[refIndice(slug, 'Última operación · 10/11/2026', '8,40 ZCHF (1 acción, 05/11/2026)')];
  assert.equal(vieja.fuente, 'https://shares.bossinfo.com/');
  refCambia(slug, 'Última operación · 10/11/2026', '8,40 ZCHF (1 acción, 05/11/2026)', { etiqueta: `Última operación · ${FES}`,
    fechaDato: '2026-11-05', fechaConsulta: FECHA, fuente: 'https://shares.bossinfo.com/',
    alcance: `Última operación del mercado entre accionistas que enseña el portal del emisor: 1 acción a 8,40 ZCHF el 05/11/2026 a las 13:35 UTC. El ${FES} se comprobaron el portal, que el historial de operaciones es igual byte a byte que el del 11/11 (ninguna operación nueva) y que la operación existe en la cadena de bloques (05/11/2026, 13:35:35 UTC, contrato del mercado entre accionistas). El importe que recibió quien vendió (8,2404 ZCHF; la diferencia, el 1,9 %, es la comisión) se comprobó el 10/11/2026 y hoy no se ha vuelto a leer. La anterior era del 28/09/2026 (474 acciones a 6,70 ZCHF).` });
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
// Las tres: métricas, avisos y resumen como en su expediente; acceso y salida, los PUBLICADOS (sin cambios).
for (const slug of ['aktionariat', 'boss-info', 'switzerlend']) {
  const o = oferta(slug), exp = expedientes[slug].propuestaTarjeta;
  assert.deepEqual(o.metricas, exp.metricas, `${slug}: métricas = expediente`);
  assert.deepEqual(exp.avisos.map(textoAviso).filter(t => !o.avisos.some(a => a.texto === t)), [], `${slug}: avisos del expediente`);
  assert.equal(o.resumen, exp.resumen, `${slug}: resumen sin cambios`);
  const pub = publicadoTarjeta(slug), ahora = Object.fromEntries(documentos[slug].referencias.filter(r => CANONICA.test(r.etiqueta)).map(r => [r.etiqueta, r.valor]));
  for (const [k, etiqueta] of [['minimo', 'Mínimo de inversión'], ['accesoEspana', 'Acceso desde España'], ['salida', 'Salida']]) {
    assert.equal(ahora[etiqueta], exp.resumenTarjeta[k], `${slug}: «${etiqueta}» = expediente`);
    if (k !== 'minimo' || slug === 'aktionariat') assert.equal(ahora[etiqueta], pub[etiqueta], `${slug}: «${etiqueta}» se conserva`);
  }
}

// ---- Brickwise: 11 de reventa (libro de órdenes de la API a las 00:32:59 UTC y app a las 00:35 UTC del 12/11).
const BW_APP = 'https://app.brickwise.at/desktopWeb/marketplace';
const BW_V1 = 'https://api.app.brickwise.at/api/v1/assets', BW_V2 = 'https://api.app.brickwise.at/api/v2/assets';
// [mínimo publicado el 11/11, mínimo del 12/11 (DECISIONES §2)]
const BRICKWISE = {
  'apartamento-vacacional-hinterstoder-50': ['75', '75'],
  'vivienda-schwarzer-weg-18-graz': ['69,90', '69,90'],
  'vivienda-stallhofstra-e-28-gratwein': ['68,80', '68,80'],
  'drautalresidenz-paternion': ['70', '70'],
  'fotovoltaica-cohotel': ['110', '102'],
  'fotovoltaica-greenpoint': ['100', '102'],
  'randhartingergasse-9-viena': ['78', '78'],
  'local-de-estanco-klagenfurt': ['95', '95'],
  'vivienda-pluddemanngasse-101-graz': ['75', '75'],
  'vivienda-pottendorfer-stra-e-62-wr-neustadt': ['73', '80'],
  'vivienda-sonnleithnergasse-2-viena': ['75', '75'],
};
// Importes con el 1,5 % que DECISIONES §2 da corregidos (revisor: redondeo normal al céntimo).
const IMPORTES_DECISIONES = { 'local-de-estanco-klagenfurt': '96,43', 'vivienda-pluddemanngasse-101-graz': '100,49', 'vivienda-pottendorfer-stra-e-62-wr-neustadt': '116,73' };
const AVISO_BW = 'Cada venta se anuncia con su precio y su número de participaciones; no consta que se pueda comprar solo una parte. El comprador paga además un 1,5 % de comisión.';
const AVISO_BW_DIARIO = 'Los precios y el libro de órdenes cambian a diario: compruébalos en la app del proveedor antes de operar.';
assert.deepEqual(Object.keys(BRICKWISE).sort(), ofertas.filter(o => o.plataformaSlug === 'brickwise').map(o => o.slug).sort(), 'las 11 de Brickwise');
const LIBRO = `Libro de órdenes de la app de Brickwise leído el ${FES} (00:32–00:35 UTC) en los datos que usa la app; ninguna página pública enseña las órdenes una a una. Cambia a diario.`;
const libroRuta = path.join(DIR, 'grupos/brickwise/fuentes/libro-ordenes-resumen-2026-11-12.json');
const libro = leer(libroRuta);
assert.equal(libro.consultadoUtc, '2026-11-12T00:32:59Z');
const euros = n => n.toFixed(2).replace('.', ',');
const centimos = s => Math.round(Number(String(s).replace(',', '.')) * 100);
// Precio por participación + 1,5 %, redondeado al céntimo con 0,005 hacia arriba (en céntimos enteros, sin flotantes).
const con15 = precio => { const c = centimos(precio) * 1015; return euros(Math.floor((c + 500) / 1000) / 100); };
assert.deepEqual([con15(95), con15(99), con15(115), con15(68.8)], ['96,43', '100,49', '116,73', '69,83']);
const fechaEs = iso => iso.slice(0, 10).split('-').reverse().join('/');
assert.match(plano(fs.readFileSync(path.join(REVISOR, 'brickwise.md'), 'utf8')), /\| Klagenfurt \| 95 × 1,015 = 96,425 \| 96,42 € \| \*\*96,43 €\*\* \|/);
const sinCambioDeCifra = [];
for (const [slug, [antes, ahora]] of Object.entries(BRICKWISE)) {
  const x = expedientes[slug], exp = x.propuestaTarjeta, o = oferta(slug);
  assert.equal(o.coleccion, 'secundario');
  assert.equal(x.decision, 'actualizar');
  const a = libro.activos[x.identificador.replace(/^ISIN /, '')];
  assert.ok(a && a.stage === 'secondary', `${slug}: activo en el libro`);
  assert.equal(exp.resumenTarjeta.minimo, `Desde ${ahora} € la participación en reventa (${CORTA})`, `${slug}: mínimo del expediente = DECISIONES`);
  assert.equal(euros(a.ventaMasBarata).replace(/,00$/, ''), ahora, `${slug}: el libro da otra venta más barata`);
  // Acceso, salida, métricas y resumen: sin cambios (comprobados hoy). Avisos: los publicados más el común nuevo,
  // justo antes del de «Los precios y el libro de órdenes cambian a diario».
  const pubCarta = e => documentos[slug].referencias.find(r => r.etiqueta === e)?.valor;
  assert.equal(exp.resumenTarjeta.accesoEspana, pubCarta('Acceso desde España'), `${slug}: acceso sin cambios`);
  assert.equal(exp.resumenTarjeta.salida, pubCarta('Salida'), `${slug}: salida sin cambios`);
  assert.deepEqual(exp.metricas, o.metricas, `${slug}: métricas sin cambios`);
  assert.equal(exp.resumen, o.resumen, `${slug}: resumen sin cambios`);
  avisoNuevo(slug, AVISO_BW, AVISO_BW_DIARIO);
  assert.deepEqual(exp.avisos, o.avisos.slice(1).map(a => a.texto), `${slug}: avisos = expediente (con el común nuevo en su sitio)`);
  assert.ok(x.revisionAvisos.length && x.revisionAvisos.every(r => r.veredicto === (r.aviso === AVISO_BW ? 'nuevo' : 'vigente')), `${slug}: avisos vigentes`);
  const nueva = e => { const r = exp.referenciasFicha.find(y => y.etiqueta === `${e} · ${FES}`); assert.ok(r, `${slug}: «${e}» del expediente`); return r; };
  const vieja = (e, f = FES_PREVIA) => { const r = documentos[slug].referencias.find(y => y.etiqueta === `${e} · ${f}`); assert.ok(r, `${slug}: «${e} · ${f}» publicada`); return r; };
  // Venta más barata: con su precio, cantidad y órdenes del libro de hoy.
  const venta = nueva('Venta más barata'), v0 = vieja('Venta más barata').valor;
  assert.equal(venta.fuente, BW_V1);
  const deLibro = v => { const m = v.match(/^([\d,]+) € por participación \((\d+) a ese precio, (?:orden del (\d{2}\/\d{2}\/\d{4})|en (\d+) órdenes(?: de [\d, ]+)?)\)$/);
    assert.ok(m, `${slug}: «${v}»`); return { precio: m[1], cantidad: Number(m[2]), fecha: m[3] || null, ordenes: m[4] ? Number(m[4]) : 1 }; };
  const enLibro = { precio: euros(a.ventaMasBarata), cantidad: a.cantidadAVentaMasBarata, ordenes: a.ordenesAVentaMasBarata.length,
    fecha: a.ordenesAVentaMasBarata.length === 1 ? fechaEs(a.ordenesAVentaMasBarata[0].creada) : null };
  assert.deepEqual(deLibro(venta.valor), enLibro, `${slug}: venta más barata del expediente = libro`);
  let ventaHoy;
  if (antes === ahora) {
    // «Las otras 8 mantienen el precio y solo cambia la fecha»: el texto publicado, que el libro de hoy sostiene.
    assert.deepEqual(deLibro(v0), enLibro, `${slug}: la venta más barata publicada sigue igual en el libro de hoy`);
    ventaHoy = v0;
    if (venta.valor !== v0) sinCambioDeCifra.push({ slug, publicado: v0, expediente: venta.valor });
  } else ventaHoy = venta.valor;
  refCambia(slug, `Venta más barata · ${FES_PREVIA}`, v0,
    { etiqueta: `Venta más barata · ${FES}`, valor: ventaHoy, fechaDato: FECHA, fechaConsulta: FECHA, fuente: BW_V1, alcance: LIBRO });
  // Orden de venta de menor importe (nueva en la ficha), con el 1,5 % bien redondeado (DECISIONES §2 y revisor).
  const menor = nueva('Orden de venta de menor importe'), om = a.ordenMenorDesembolso;
  assert.equal(menor.fuente, BW_V1); assert.equal(om.cantidad, 1);
  const importe = con15(om.precio);
  if (IMPORTES_DECISIONES[slug]) {
    assert.equal(importe, IMPORTES_DECISIONES[slug], `${slug}: importe de DECISIONES`);
    assert.equal(menor.valor, `1 participación a ${euros(om.precio)} € (${euros(om.desembolsoMas1_5)} € con el 1,5 %)`, `${slug}: el expediente lleva el redondeo hacia abajo`);
    assert.notEqual(euros(om.desembolsoMas1_5), importe);
  } else assert.equal(menor.valor, `1 participación a ${euros(om.precio)} € (${importe} € con el 1,5 %)`, `${slug}: orden de menor importe del expediente`);
  refNueva(slug, `Venta más barata · ${FES}`, REF(`Orden de venta de menor importe · ${FES}`, `1 participación a ${euros(om.precio)} € (${importe} € con el 1,5 %)`, BW_V1, FECHA,
    `${LIBRO} Es la orden de venta abierta que pide menos dinero en total ese día; el importe entre paréntesis suma la comisión del 1,5 % que paga el comprador, redondeada al céntimo.`));
  // Mínimo de la tarjeta.
  const lote = String(a.cantidadAVentaMasBarata);
  tarjeta(slug, 'Mínimo de inversión', exp.resumenTarjeta.minimo, BW_APP, FECHA,
    `Precio por participación de la venta más barata del mercado de la app ese día, más un 1,5 % de comisión; a ese precio había ${lote} ${lote === '1' ? 'participación' : 'participaciones'} a la venta. Brickwise no publica un mínimo en reventa ni si una orden se puede comprar en parte. El precio lo fija cada vendedor y cambia a diario. No es el precio de emisión.`,
    `Desde ${antes} € la participación en reventa (${CORTA_PREVIA})`);
  // Participaciones en venta: se re-fecha solo si la cifra es la misma; si cambia, DECISIONES no lo recoge y se queda
  // la publicada con su fecha (cierta con ella), como el 11/11.
  const p1 = nueva('Participaciones en venta');
  assert.equal(p1.fuente, BW_V2); assert.equal(Number(p1.valor), a.participacionesEnVenta, `${slug}: participaciones del expediente = libro`);
  const pubPart = documentos[slug].referencias.filter(r => /^Participaciones en venta · /.test(r.etiqueta));
  assert.equal(pubPart.length, 1);
  if (pubPart[0].valor === p1.valor && pubPart[0].etiqueta === `Participaciones en venta · ${FES_PREVIA}`)
    refCambia(slug, `Participaciones en venta · ${FES_PREVIA}`, p1.valor,
      { etiqueta: `Participaciones en venta · ${FES}`, valor: p1.valor, fechaDato: FECHA, fechaConsulta: FECHA, fuente: BW_V2,
        alcance: 'Participaciones de esta emisión a la venta entre inversores ese día (suma de las órdenes abiertas en la app). Cambia a diario.' });
  else {
    assert.notEqual(pubPart[0].valor, p1.valor, `${slug}: participaciones`);
    NO_APLICADO.push({ slug, que: `Referencia «Participaciones en venta»: ${pubPart[0].valor} (${pubPart[0].etiqueta.split(' · ')[1]}) → ${p1.valor} (${FES}), según el expediente y el revisor`,
      porque: `DECISIONES §2 solo recoge, en Brickwise, los mínimos (Cohotel 102 €, GreenPoint 102 €, Pottendorfer 80 €; las otras 8, solo la fecha), el aviso común y los importes con el 1,5 %. Esta cifra cambia: re-fecharla con ${pubPart[0].valor} sería falso, así que se queda «${pubPart[0].etiqueta}: ${pubPart[0].valor}», cierta con su fecha (como el 11/11 con Schwarzer Weg).` });
  }
  // Mejor oferta de compra: la misma que ayer en las 11; se re-fecha con el texto publicado, que el libro sostiene.
  const mc0 = vieja('Mejor oferta de compra').valor, mc1 = nueva('Mejor oferta de compra');
  assert.equal(mc1.fuente, BW_V1);
  {
    const m = mc0.match(/^([\d,]+) € \((?:(\d+) participaci(?:ón|ones), orden del (\d{2}\/\d{2}\/\d{4})|(\d+) participaciones en (\d+) órdenes; la más antigua del (\d{2}\/\d{2}\/\d{4}))\)$/);
    assert.ok(m, `${slug}: «${mc0}»`);
    const aPrecio = a.mejoresCompras3.filter(c => euros(c[0]) === m[1]);
    assert.equal(euros(a.mejorCompra.precio), m[1], `${slug}: mejor compra del libro`);
    if (m[2]) assert.deepEqual([aPrecio.length, aPrecio[0][1], fechaEs(aPrecio[0][2])], [1, Number(m[2]), m[3]], `${slug}: mejor compra publicada = libro`);
    else assert.deepEqual([aPrecio.length, aPrecio.reduce((s, c) => s + c[1], 0), aPrecio.map(c => c[2]).sort()[0]].map(String),
      [m[5], m[4], m[6].split('/').reverse().join('-')], `${slug}: mejor compra publicada = libro`);
    if (mc1.valor !== mc0) sinCambioDeCifra.push({ slug, publicado: mc0, expediente: mc1.valor });
  }
  refCambia(slug, `Mejor oferta de compra · ${FES_PREVIA}`, mc0,
    { etiqueta: `Mejor oferta de compra · ${FES}`, valor: mc0, fechaDato: FECHA, fechaConsulta: FECHA, fuente: BW_V1,
      alcance: `${LIBRO} Es lo más que ofrecía pagar un comprador ese día, antes de la comisión del 1,5 %.` });
  // «Desistimiento»: igual que lo publicado (se queda con su fecha).
  const des = exp.referenciasFicha.find(y => y.etiqueta === 'Desistimiento');
  assert.equal(des.valor, documentos[slug].referencias.find(y => y.etiqueta === 'Desistimiento').valor, `${slug}: desistimiento sin cambios`);
  assert.equal(exp.referenciasFicha.length, 5, `${slug}: cinco referencias del libro y del desistimiento en el expediente`);
}
// Textos del expediente que dicen lo mismo con otras palabras: se queda el publicado (solo cambia la fecha).
assert.deepEqual(sinCambioDeCifra.map(x => x.slug), ['randhartingergasse-9-viena', 'apartamento-vacacional-hinterstoder-50', 'local-de-estanco-klagenfurt'].sort((a, b) =>
  Object.keys(BRICKWISE).indexOf(a) - Object.keys(BRICKWISE).indexOf(b)), 'textos del libro que el expediente redacta distinto');
NO_APLICADO.push({ slug: 'brickwise (3 fichas)', que: 'Redacción nueva de dos referencias del libro de órdenes con las mismas cifras: «… en 3 órdenes de 5, 10, 1» (Klagenfurt) y «… en 2 órdenes de 20, 1» (Randhartingergasse) en la venta más barata; «20,00 € (1 participación, orden del 19/05/2025)» (Hinterstoder) en la mejor compra',
  porque: 'DECISIONES §2: en esas fichas el precio no cambia y «solo cambia la fecha». El texto publicado sigue siendo exacto con el libro de hoy (el script lo comprueba orden a orden) y se re-fecha. En Hinterstoder el texto del expediente se queda corto: a 20 € hay 2 órdenes (1 y 3 participaciones), como dice lo publicado.', detalle: sinCambioDeCifra });

// ---- Hausera · próximas ofertas: sin cambios de contenido; se re-fecha al 12/11 solo lo que se volvió a consultar hoy.
{
  const slug = 'hausera-proximas-ofertas', o = oferta(slug), x = expedientes[slug], exp = x.propuestaTarjeta;
  assert.equal(x.decision, 'mantener');
  const pub = publicadoTarjeta(slug);
  assert.deepEqual([exp.resumenTarjeta.accesoEspana, exp.resumenTarjeta.salida], [pub['Acceso desde España'], pub.Salida], 'Hausera: acceso y salida = lo publicado');
  assert.deepEqual(exp.metricas, o.metricas, 'Hausera: métricas sin cambios');
  assert.equal(exp.resumen, o.resumen, 'Hausera: resumen sin cambios');
  const consultado = c => x.claims.find(y => y.campo === c);
  // El registro de la CNMV (ERIR de Ursus-3), hoy a las 00:33:13 UTC: Alicante 3 sigue sin inscribir.
  assert.ok(consultado('registro').consultadoUtc.startsWith(FECHA) && consultado('registro').fuentePrimaria === 'https://www.cnmv.es/portal/consultas/esi/erir_esi?nif=A86796182&lang=es');
  avisoCambia(slug, 'El documento de emisión no es un folleto y la CNMV no lo ha revisado. El 10/11/2026 Alicante 3 aún no estaba inscrita en el registro de la CNMV.',
    `El documento de emisión no es un folleto y la CNMV no lo ha revisado. El ${FES} Alicante 3 aún no estaba inscrita en el registro de la CNMV.`);
  // El documento de emisión, hoy a las 00:35:22 UTC (mismo SHA-256): el mínimo pasa a (12/11).
  assert.ok(consultado('minimo').consultadoUtc.startsWith(FECHA) && consultado('minimo').fuentePrimaria === 'https://drive.google.com/file/d/1cpWVN3J_Y1xdRDAxUzGnjmWXB-eTODH_');
  const r = documentos[slug].referencias.find(y => y.etiqueta === 'Mínimo de inversión');
  const minimo = `Desde 100 € en Alicante 3, según su documento de emisión (${CORTA}); la preventa abre el 18/11.`;
  assert.equal(exp.resumenTarjeta.minimo, minimo, 'Hausera: mínimo del expediente');
  // Corrección R1 (revisiones de contenido y de cumplimiento del 12/11): el alcance decía «Hoy no se puede
  // invertir: …», que deja de ser cierto en la vigencia de la ficha (la preventa abre el 18/11 a las 09:00 y la ficha
  // vale hasta el 19/11). Se fecha con la consulta de hoy (expediente, criterios.actividadYFecha: «12/11/2026: …
  // Alicante 3 abre la preventa el 18/11/2026 (09:00) … Hoy no se puede invertir.»). Mismo hecho, mismas fechas.
  assert.match(x.criterios.actividadYFecha.nota, /^12\/11\/2026: .*Alicante 3 abre la preventa el 18\/11\/2026 \(09:00\) y la suscripción del 25\/11\/2026 .*Hoy no se puede invertir\.$/);
  const HOY_HAUSERA = 'Hoy no se puede invertir: la preventa abre el 18/11/2026 y la suscripción, el 25/11/2026.';
  const alcanceMinimo = r.alcance.replace(PREFIJO, '');
  assert.equal(alcanceMinimo.split(HOY_HAUSERA).length, 2, 'Hausera: «Hoy no se puede invertir» en el alcance del mínimo publicado');
  tarjeta(slug, 'Mínimo de inversión', minimo, r.fuente, r.fechaDato,
    alcanceMinimo.replace(HOY_HAUSERA, `El ${FES} aún no se podía invertir: la preventa abre el 18/11/2026 y la suscripción, el 25/11/2026.`),
    'Desde 100 € en Alicante 3, según su documento de emisión (10/11); la preventa abre el 18/11.');
  // La portada (hoy a las 00:39:52 UTC): las mismas cifras del promotor.
  const portada = x.documentos.find(d => d.url === 'https://hausera.io/');
  assert.ok(portada.versionOFecha.startsWith(`consulta ${FECHA}`) && portada.nota.includes('Cifras del promotor iguales: 42 operaciones, 24 terminadas, 128 M€ financiados'));
  const hist = documentos[slug].referencias[refIndice(slug, 'Historial publicado · 10/11/2026', '42 operaciones, 24 terminadas, 128 M€ financiados')];
  refCambia(slug, 'Historial publicado · 10/11/2026', hist.valor, { etiqueta: `Historial publicado · ${FES}`, fechaConsulta: FECHA,
    alcance: hist.alcance.replace('consultada el 10/11/2026', `consultada el ${FES}`) });
  assert.ok(documentos[slug].referencias.some(y => y.alcance.includes(`Cifras del promotor en su portada, consultada el ${FES};`)));
  // Las demás fechas de Hausera son hechos, no consultas: «Alicante 2 ya figuraba como financiada el 10/11/2026, antes de
  // su oferta pública del 11/11» (aviso y resumen) se queda tal cual, también en el expediente.
  assert.deepEqual(exp.avisos.map(textoAviso), o.avisos.slice(1).map(a => a.texto), 'Hausera: avisos = expediente');
  assert.doesNotMatch(JSON.stringify([o, documentos[slug]]), /\b[57]0 ?%/, `${slug}: no se publica el mínimo de emisión`);
}
// ---- Robinhood, Kraken, Prosegur Digital Gold y Spiko Letras: sin cambios (solo la fecha); el expediente dice lo mismo.
for (const slug of ['robinhood-classic-stock-tokens', 'kraken-xstocks', 'prosegur-digital-gold', 'spiko-letras-del-tesoro-euro', 'spiko-letras-del-tesoro-dolar']) {
  const o = oferta(slug), exp = expedientes[slug].propuestaTarjeta;
  assert.equal(expedientes[slug].decision, 'mantener');
  assert.deepEqual(exp.metricas, o.metricas, `${slug}: métricas sin cambios`);
  assert.deepEqual(exp.avisos.map(textoAviso), o.avisos.map(a => a.texto), `${slug}: avisos sin cambios`);
  assert.equal(exp.resumen, o.resumen, `${slug}: resumen sin cambios`);
}
NO_APLICADO.push({ slug: 'varias', que: 'Propuestas de los expedientes fuera de DECISIONES: fuentes nuevas de las ofertas (API de Spiko, de Brickwise y de Midas); textos nuevos de tarjeta de Spiko, Robinhood, Kraken y Prosegur; datos de tarjeta de mTBILL',
  porque: 'DECISIONES-COORDINADOR.md es una lista cerrada y no los recoge: se conservan los publicados.' });

// ---- Avisos: se vuelven a fechar al 12/11 los comprobados hoy: el editorial común, los que el expediente de hoy
// propone tal cual (todos se revisaron uno a uno) y los nuevos de DECISIONES.
{
  const sinComprobar = [];
  for (const o of ofertas) {
    const prop = new Set((expedientes[o.slug].propuestaTarjeta.avisos || []).map(textoAviso));
    o.avisos = o.avisos.map((a, i) => {
      if ((i === 0 && a.texto === EDITORIAL) || prop.has(a.texto) || AVISOS_NUEVOS.has(`${o.slug}\n${a.texto}`)) return { ...a, verificadaEl: FECHA };
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
const APIRX = /\/api\/|public-api\.|[?&]wt=json|\.json(?:$|\?)|\.js(?:$|\?)/;
const todas = lote => [...lote.e.flatMap(o => [o.url, ...o.fuentesActuales]), ...Object.values(lote.d).flatMap(d => [...d.fuentes, ...d.referencias.map(r => r.fuente)])];
const antesApi = new Set(todas({ e: escaparateBase.ofertas, d: docBase }).filter(u => APIRX.test(u)));
assert.deepEqual([...new Set(todas({ e: ofertas, d: documentos }).filter(u => APIRX.test(u) && !antesApi.has(u)))], [],
  'fuente técnica nueva (API, JSON o .js)');
assert.deepEqual(CAMBIOS.filter(c => c.campo === 'fuente de la ficha'), [], 'hoy no entra ninguna fuente nueva en las fichas');
const CSP = /<style\b|\sstyle\s*=|\son[a-z]+\s*=|<script/i;
assert.ok(!CSP.test(JSON.stringify(documentos)) && !CSP.test(JSON.stringify(ofertas)), 'texto que la compuerta CSP rechazaría');
// Ningún aviso ni dato de tarjeta nuevo arrastra la fecha del 11/11 como si fuera de hoy.
for (const c of CAMBIOS) if (c.despues && ['aviso', 'tarjeta'].includes(c.campo)) assert.doesNotMatch(c.despues, /\b11\/11\b/, `${c.slug}: fecha vieja en «${c.despues}»`);
// Ningún texto nuevo apoya el acceso de mTBILL en la web de Midas, ni publica la cifra rechazada (3,53 %).
for (const c of CAMBIOS) if (c.despues) assert.doesNotMatch(c.despues, /países permitidos|Permitted Jurisdictions|(?<![\d,])3,53 ?%/i, `${c.slug}: «${c.despues}»`);

// ---------------------------------------------------------------- nada más cambia
// Cada diferencia con la 2026-11-11 tiene que estar en CAMBIOS (o ser una fecha de hoy).
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
    assert.equal(o.avisos.length, b.avisos.length + c.filter(x => x.campo === 'aviso' && !x.antes).length, `${o.slug}: número de avisos`);
    const me = dif(b.metricas.map(m => `${m.etiqueta}: ${m.valor}`), o.metricas.map(m => `${m.etiqueta}: ${m.valor}`)).sort();
    assert.deepEqual(me, c.filter(x => x.campo === 'métrica').flatMap(x => [x.antes, x.despues]).filter(Boolean).sort(), `${o.slug}: métricas`);
    const nuevasM = c.filter(x => x.campo === 'métrica' && !x.antes).map(x => x.despues);
    assert.deepEqual(o.metricas.filter(m => !nuevasM.includes(`${m.etiqueta}: ${m.valor}`)).map(m => m.etiqueta.replace(/\d{2}\/\d{2}\/\d{4}/, 'F')),
      b.metricas.map(m => m.etiqueta.replace(/\d{2}\/\d{2}\/\d{4}/, 'F')), `${o.slug}: orden de las métricas`);
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
    const nuevasR = refsC.filter(x => !x.antes).length, quitadasR = refsC.filter(x => !x.despues).length;
    assert.equal(d.referencias.length, db.referencias.length + nuevasR - quitadasR, `${o.slug}: número de referencias`);
    const nuevasE = new Set(refsC.filter(x => !x.antes).map(x => x.despues.split(': ')[0])), quitadasE = new Set(refsC.filter(x => !x.despues).map(x => x.antes.split(': ')[0]));
    assert.deepEqual(d.referencias.filter(r => !nuevasE.has(r.etiqueta)).map(r => r.etiqueta.replace(/\d{2}\/\d{2}\/\d{4}/, 'F')),
      db.referencias.filter(r => !quitadasE.has(r.etiqueta)).map(r => r.etiqueta.replace(/\d{2}\/\d{2}\/\d{4}/, 'F')), `${o.slug}: orden de las referencias`);
  }
}
// Ofertas sin cambios (DECISIONES §2): solo las fechas de verificación.
for (const slug of ['robinhood-classic-stock-tokens', 'kraken-xstocks', 'prosegur-digital-gold', 'spiko-letras-del-tesoro-euro', 'spiko-letras-del-tesoro-dolar'])
  assert.deepEqual(CAMBIOS.filter(c => c.slug === slug), [], `${slug}: solo fechas`);
// Lo que cambia, ficha a ficha, es exactamente lo de DECISIONES §2.
{
  const cuenta = Object.fromEntries([...new Set(CAMBIOS.map(c => c.slug))].map(s => [s, CAMBIOS.filter(c => c.slug === s).map(c => c.campo).sort()]));
  const r = n => Array(n).fill('referencia de la ficha');
  const bw = slug => ['aviso', ...r(['fotovoltaica-cohotel', 'fotovoltaica-greenpoint', 'vivienda-pottendorfer-stra-e-62-wr-neustadt', 'vivienda-schwarzer-weg-18-graz'].includes(slug) ? 3 : 4), 'tarjeta'];
  assert.deepEqual(cuenta, {
    'spiko-smart-cash-euro': ['métrica', 'referencia de la ficha', 'rentabilidad'],
    mtbill: ['aviso', 'métrica', ...r(2)], aktionariat: ['aviso', 'métrica', 'métrica'],
    'boss-info': ['aviso', 'métrica', 'referencia de la ficha', 'tarjeta'], switzerlend: ['aviso', 'aviso', 'métrica', 'tarjeta'],
    ...Object.fromEntries(Object.keys(BRICKWISE).map(s => [s, bw(s)])),
    'hausera-proximas-ofertas': ['aviso', 'referencia de la ficha', 'tarjeta'],
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
assert.match(escaparate.fuente.notaOrigen, /^Revisión del 12\/11\/2026 \(puesta al día pedida por el responsable del proyecto\)/, 'nota de origen sin nombres de personas');
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
  decision: `Puesta al día pedida por el responsable del proyecto el ${FES} («Tendrás que actualizar la información a hoy y acelerar»). Lo que entra: DECISIONES-COORDINADOR.md (lista cerrada).`,
  archivos: Object.fromEntries(['DECISIONES-COORDINADOR.md', `radar-contraste-${FECHA}.json`, 'cambios-radar.json']
    .map(n => [n, sha(path.join(DIR, n))])),
  radar: { fuentes: contraste.fuentes, correctas: contraste.correctas, verificacionesManuales: Object.keys(cambiosRadar.verificacionesManuales),
    cambios: { fuentes: {}, plataformas: {} } },
  cifras: {
    'spiko-letras-del-tesoro-euro': { antes: '2,41 %', despues: '2,41 %', valorLiquidativo: '2026-11-11', nota: 'mismo fichero de la API que el 11/11 (festivo en Francia)' },
    'spiko-letras-del-tesoro-dolar': { antes: '4,02 %', despues: '4,02 %', valorLiquidativo: '2026-11-10', nota: 'mismo fichero de la API que el 11/11 (festivo en Francia)' },
    'spiko-smart-cash-euro': { antes: '2,84 % (VL del 10/11)', despues: '2,84 % (VL del 11/11, 1,017029 €)', consulta: FECHA },
    mtbill: { antes: 'sin rentabilidad', despues: 'métrica 3,45 % anual en USD', calculo: '(1,07768132 / 1,07410723 − 1) × 365 / 35,18 días (rondas 468 → 492 del oráculo, 06/10 14:16 UTC → 10/11 18:40 UTC)', contraste: 'rwa.xyz 3,44 %' },
    brickwise: Object.fromEntries(Object.entries(BRICKWISE).map(([s, [a, b]]) => [s, `${a} € → ${b} €`])),
  },
  condicionHora: { spiko: 'VL del 11/11 (Smart Cash y Letras Euro) y del 10/11 (Letras Dólar) válidas si la entrega se monta antes de las 18:00 UTC del 12/11 (indicación del coordinador); si no, volver a leer la API pública de Spiko. La hora del montaje está en INFORME-ENTREGA.md.',
    mtbill: 'Ronda 492 (10/11, 18:40 UTC) última a las 00:53 UTC del 12/11; una ronda nueva cambiaría el valor por token, no la métrica de 5 semanas hasta el 10/11.' },
  vigencia: { verificadaEl: FECHA, vigenciaDias: 7, ultimoDiaVigente: ULTIMO },
  cambios: CAMBIOS, tarjetaConservadasDeMasDe120: largasConservadas, tarjetas,
  noAplicadoTalCual: NO_APLICADO,
  sinCambios: ['las 25 plataformas del radar y sus textos, salvo las fechas de consulta', 'public.plataformas y public.fuentes (el SQL no las toca)',
    'colecciones 8/13/1, estados de revisión, fuentes de las ofertas e imágenes', 'Spiko Letras Euro y Dólar, Robinhood, Kraken y Prosegur Digital Gold: solo las fechas',
    'las noticias (no son parte de esta entrega)'],
  altas: [], retiradas: [], colecciones });
console.log(JSON.stringify({ etiqueta: ETIQUETA, revisionId: nueva.revisionId, hash: nueva.hash, previa: PREVIA, sha256: sha(archivo),
  plataformas: escaparate.plataformas.length, fuentesRadar: radar.fuentes.length, ofertas: ofertas.length, colecciones, cambios: CAMBIOS.length,
  noAplicado: NO_APLICADO.length }));

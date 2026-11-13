// Entrega del catálogo «2026-11-13»: puesta al día pedida por el responsable del proyecto («Actualiza las noticias,
// las ofertas y el gráfico de la evolución de la tokenización a hoy… lo más rápido posible pero que esté bien hecho»).
// Preparación LOCAL: sin red ni servicios remotos. Reproducible byte a byte: ninguna salida depende de la hora.
//
//   node rwadar-app/data/verificaciones/2026-11-13-v2/preparar-entrega.mjs
//
// Parte exactamente de la revisión publicada a58dd22d (entrega 2026-11-12), leída hoy como visitante
// (lectura-publica/, 08:27:43–08:27:47 UTC), y aplica SOLO lo que dice DECISIONES-COORDINADOR.md (lista cerrada,
// con las correcciones obligatorias de los revisores de su §4):
// 1. Radar: las 69 fuentes comprobadas hoy (radar-contraste-2026-11-13.json, 69/69). cambios-radar.json no cambia
//    ninguna dirección ni ningún texto: solo dos lecturas a mano (REGAFI, por su API pública, a las 08:52 UTC).
// 2. Las 22 fichas, revisadas hoy con fuentes primarias (expedientes/) y revisión independiente por grupo
//    (revision-independiente/): verificadaEl 13/11, 7 días de vigencia (último día el 20/11), avisos comprobados
//    hoy con fecha de hoy y los cambios por oferta de DECISIONES §2. Cada texto «antes» se exige tal cual: si no
//    está, el script falla.
// 3. Correcciones obligatorias (DECISIONES §4): en las tres de Spiko, la fecha del dato de «Acceso desde España» pasa
//    al 06/11/2026 («Last updated: November 6, 2026» en la tabla de países) y, en Smart Cash, «(23/10/2026)» pasa a
//    «(06/11/2026)» en su alcance; en las suizas, las horas reales de consulta salen del inventario del grupo (ninguna
//    hora copiada del 12/11 llega a la entrega); Boss Info conserva la fuente del portal en «Última operación».
// Hoy NO se toca public.plataformas ni public.fuentes: el SQL solo escribe en rwadar_catalogo.
// Sin altas ni retiradas: 22 ofertas (8/13/1) y 25 plataformas. Las noticias no son parte de esta entrega.
//
// Condición de hora de Spiko (VL del 12/11 en las tres): vale si la entrega se monta antes de las 18:00 UTC del 13/11
// (la API anuncia la siguiente cifra de las Letras a las 18:00 UTC y la de Smart Cash a las 19:30 UTC). El script no
// mira el reloj (así es reproducible); la hora del montaje está en INFORME-ENTREGA.md.
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
const ETIQUETA = '2026-11-13', FECHA = '2026-11-13', DESDE = '2026-11-12', HOY = '2026-11-13';
const FES = '13/11/2026', CORTA = '13/11';
const FES_PREVIA = '12/11/2026', CORTA_PREVIA = '12/11';
const ULTIMO = '2026-11-20'; // último día vigente: verificadaEl 13/11 y 7 días
const PREVIA = 'a58dd22d-98a3-f94e-ba66-46898162215a';
const HASH_PREVIA = 'a58dd22d98a3f94eba6646898162215af1ea3d4faefbeaf46e14d9ac18b1ee21';
const ULTIMO_PREVIA = '2026-11-19';
const COLECCIONES = { principales: 8, secundario: 13, en_camino: 1 };
const EDITORIAL = 'Referencia editorial gratuita. El proveedor comprueba admisión, condiciones y riesgos; RWAdar no recibe dinero de inversiones.';
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const escribir = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); };
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base = path.resolve(DIR, `../${DESDE}-v2`);
const REVISOR = path.join(DIR, 'revision-independiente');
const plano = t => t.replace(/[\s  ]+/g, ' ');
const textoRevisor = n => plano(fs.readFileSync(path.join(REVISOR, n), 'utf8'));

// ---------------------------------------------------------------- partida: la publicada
const previa = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: DESDE, versionEsquema: 2 }));
assert.equal(previa.revisionId, PREVIA, `la ${DESDE} local no es la revisión publicada`);
assert.equal(previa.hash, HASH_PREVIA, `identidad (huella) de la ${DESDE}`);
const revisionDesde = leer(path.join(ROOT, `rwadar-app/data/importaciones/catalogo-${DESDE}-v2/revision.json`));
assert.deepEqual([revisionDesde.revisionId, revisionDesde.hash, revisionDesde.venceTrasEl], [PREVIA, HASH_PREVIA, ULTIMO_PREVIA]);
const snapshot = leerBloquesCatalogo(fs.readFileSync(path.join(ROOT, 'rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8'));
assert.ok([...snapshot.plataformas, ...snapshot.ofertas].every(x => x.revisionId === PREVIA), 'el catálogo sincronizado de la web no es la a58dd22d');
assert.deepEqual([snapshot.plataformas.length, snapshot.ofertas.length], [25, 22]);
assert.ok(snapshot.ofertas.every(o => o.verificadaEl === DESDE), 'el catálogo sincronizado está verificado el 12/11');
const radarBase = leer(path.join(base, 'radar-canonico-26.json'));
const escaparateBase = leer(path.join(base, 'escaparate-publicacion.json'));
const docBase = leer(path.join(base, 'documentacion-ofertas.json'));
const manifiestoBase = leer(path.join(base, 'manifiesto-catalogo.json'));

// Lo leído hoy como visitante (lectura-publica/, 08:27:43–08:27:47 UTC) es exactamente la base local.
const lp = path.join(DIR, 'lectura-publica');
const pubO = leer(path.join(lp, 'ofertas-v2.json')), pubP = leer(path.join(lp, 'plataformas-v2.json'));
const pubT = leer(path.join(lp, 'plataformas-todas.json'));
{
  const hora = fs.readFileSync(path.join(lp, 'hora-lectura.txt'), 'utf8');
  assert.match(hora, /2026-11-13T08:27:43Z – 2026-11-13T08:27:47Z/, 'hora de la lectura pública');
  const r = JSON.parse(hora.match(/Resultado: (\{.*\})/)[1]);
  assert.deepEqual([r.revision, r.plataformas, r.ofertas, r.colecciones, r.verificadaEl], [[PREVIA], 25, 22, COLECCIONES, [DESDE]]);
}
assert.ok([...pubO, ...pubP].every(x => x.revision_id === PREVIA), 'la publicada leída hoy es la a58dd22d');
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
assert.equal(cambiosRadar.fecha, FECHA, 'cambios-radar.json: fecha inesperada');
assert.ok(cambiosRadar.nota.startsWith(`Cambios del radar comprobados a mano el ${FES}.`), 'cambios-radar.json: nota de hoy');
assert.deepEqual([cambiosRadar.fuentes, cambiosRadar.plataformas], [{}, {}], 'hoy no cambia ninguna dirección ni ningún texto del radar');
assert.ok(!cambiosRadar.comprobacionesCambiadas || !Object.keys(cambiosRadar.comprobacionesCambiadas).length, 'hoy no cambia ninguna comprobación');
const COMPROBACIONES = leer(path.join(ROOT, 'rwadar-app/data/comprobaciones-fuentes.json')).fuentes;
const cumple = (id, texto) => COMPROBACIONES[id].every(p => new RegExp(p, 'i').test(plano(texto)));
assert.deepEqual(Object.keys(cambiosRadar.verificacionesManuales), ['spiko-regafi', 'spiko-regafi-pasaporte-es']);
for (const [id, m] of Object.entries(cambiosRadar.verificacionesManuales)) {
  const c = contraste.contraste.find(x => x.id === id);
  assert.ok(c.ok && c.manual === m.motivo && c.urlLeida === m.url && c.metodo === m.metodo, `${id}: el contraste recoge la lectura a mano`);
  assert.deepEqual(c.literales, m.literales, `${id}: literales`);
  assert.match(m.metodo, /13\/11\/2026 a las 08:52 UTC/, `${id}: lectura de hoy`);
  assert.ok(cumple(id, c.literales.join(' ')), `${id}: la lectura a mano dice lo que respalda`);
}
// Las demás 67: cada comprobación de comprobaciones-fuentes.json está en los literales capturados hoy.
for (const c of contraste.contraste.filter(x => !x.manual))
  assert.ok(cumple(c.id, c.literales.join(' ')), `${c.id}: los literales de hoy no dicen lo que respalda`);
{
  assert.equal(sha(path.join(DIR, 'radar-manual/regafi-spiko-entidad.json')), '62ab887b074058421fd6aaf90cc82190b9ed356166fbcea878a8b96dbf2dbb26', 'copia de la entidad en REGAFI (igual que el 12/11)');
  const copia = path.join(DIR, 'radar-manual/regafi-spiko-pasaporte-espagne.json');
  assert.equal(sha(copia), 'fdf10d2d445b2cc90fec0c31215cd065cdab7c0a325cba03fceb47d2a7de66c6', 'copia del pasaporte de REGAFI (igual que el 10, el 11 y el 12/11)');
  const t = plano(fs.readFileSync(copia, 'utf8'));
  for (const l of ['"type_passeport": "Libre prestation de services"', '"pays": "ESPAGNE"', '"date_debut": "2026-01-08"'])
    assert.ok(t.includes(l), `REGAFI: falta ${l}`);
  // La lista de la OCC es ya la del 31/10 (la del 12/11 era la del 30/09): sigue con Paxos.
  const occ = contraste.contraste.find(x => x.id === 'paxg-occ');
  assert.ok(occ.literales.some(l => l.includes('Trust Banks Active As of 10/31/2026')) && occ.literales.some(l => /25379 Paxos Trust Company/.test(l)), 'OCC: lista con Paxos');
  // centrifuge.io/terms dio 403 en la primera pasada y se volvió a capturar a las 08:55 UTC: hoy está bien.
  assert.match(cambiosRadar.nota, /centrifuge\.io\/terms dio 403 en la primera pasada y se volvió a capturar/);
  assert.ok(contraste.contraste.filter(c => /centrifuge\.io/.test(c.url)).every(c => c.ok && c.estado === 200), 'Centrifuge: capturado bien');
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
  assert.equal(radarBase.alcance, radar.alcance.replace(FES, FES_PREVIA), 'radar: el alcance solo cambia de fecha');
}
const fuentePorId = new Map(radar.fuentes.map(f => [f.id, f]));
const conFuentes = campo => ({ ...campo, fuentes: campo.fuentes.map(id => {
  assert.ok(fuentePorId.has(id), `fuente inexistente: ${id}`);
  return fuentePorId.get(id);
}) });

// ---------------------------------------------------------------- 2 · ofertas
const CAMBIOS = [];
const anota = (slug, campo, antes, despues, extra) => CAMBIOS.push({ slug, campo, antes, despues, ...(extra || {}) });
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
  assert.deepEqual(Object.keys(r), Object.keys(d.referencias[i]), `${slug}: «${etiqueta}» con los mismos campos`);
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
  assert.ok(exp.consulta.inicioUtc.startsWith(`${FECHA}T08:`), `${o.slug}: expediente de hoy (después de la orden de las 08:25 UTC)`);
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

// Tres datos de la tarjeta: etiqueta fija (normas del 03/11). Los publicados se conservan con consulta del 13/11
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
// Un dato de tarjeta que conserva el texto y cambia la fecha del dato (corrección de los revisores): se anota con el
// mismo «antes» y «ahora» y la fecha del dato a cada lado.
const tarjetaFechaDato = (slug, etiqueta, fechaAntes, fechaAhora, alcance) => {
  const d = documentos[slug], i = refIndice(slug, etiqueta), r = d.referencias[i];
  assert.equal(r.fechaDato, fechaAntes, `${slug}: «${etiqueta}» con fecha del dato ${fechaAntes}`);
  assert.equal(r.valor, publicadoTarjeta(slug)[etiqueta], `${slug}: «${etiqueta}» = lo leído hoy como visitante`);
  const nueva = { ...r, fechaDato: fechaAhora, ...(alcance ? { alcance: alcance(r.alcance) } : {}) };
  assert.notEqual(nueva.alcance, undefined);
  anota(slug, 'tarjeta', `${etiqueta}: ${r.valor}`, `${etiqueta}: ${r.valor}`,
    { fechaDato: { antes: fechaAntes, despues: fechaAhora }, ...(alcance ? { alcance: { antes: r.alcance, despues: nueva.alcance } } : {}) });
  d.referencias[i] = nueva;
};

// ---- Spiko. Letras del Tesoro Euro y Dólar: rentabilidad con la VL del 12/11 (2,40 % y 3,98 % en USD); Smart Cash:
// sigue en 2,84 %, con la VL del 12/11. Todo leído hoy (08:30–08:31 UTC el investigador, 08:45 UTC el revisor).
const PRINCIPALES = textoRevisor('principales.md');
const EXTRACTOS = plano(fs.readFileSync(path.join(REVISOR, 'fuentes/principales/extractos-principales.txt'), 'utf8'));
{
  // Lo que leyó el revisor en la API pública (08:45:18–08:45:20 UTC).
  for (const l of ['EUTBL: dailyYield 0.0226 · weeklyYield 0.0239 · monthlyYield 0.024 · updatedAt 2026-11-12T17:44:43.923Z · VL 1.062803 EUR del 2026-11-12',
    'USTBL: dailyYield 0.0333 · weeklyYield 0.0355 · monthlyYield 0.0398 · updatedAt 2026-11-12T17:44:58.257Z · VL 1.102694 USD del 2026-11-12',
    'eurSAFO: dailyYield 0.0284 · weeklyYield 0.0284 · monthlyYield 0.0284 · updatedAt 2026-11-13T08:45:19.952Z · VL 1.017107 EUR del 2026-11-12',
    'EUTBL 31 d (12/10→12/11) 2,400 %; USTBL 30 d (13/10→12/11; 12/10 sin VL) 3,984 %'])
    assert.ok(EXTRACTOS.includes(l), `extractos del revisor: falta «${l}»`);
  for (const l of ['| Spiko Letras del Tesoro Euro | actualizar a 2,40 % (VL 12/11) | confirmado con cambios (fecha de la tabla de países) |',
    '| Spiko Letras del Tesoro Dólar | actualizar a 3,98 % en USD (VL 12/11) | confirmado con cambios (la misma fecha) |',
    '| Spiko Euro (Smart Cash) | actualizar la fecha (2,84 %, VL 12/11) | confirmado con cambios (la misma fecha) |'])
    assert.ok(PRINCIPALES.includes(l), `revisión de principales: falta «${l}»`);
}
const SPIKO = {
  'spiko-letras-del-tesoro-euro': { antes: '2,41 %', pct: '2,40 %', metrica: 'Rentabilidad publicada · 31 días · 11/11/2026',
    nueva: 'Rentabilidad publicada · 31 días · 12/11/2026', ref: 'Rentabilidad publicada · 31 días', web: 'https://data.spiko.io/eutbl/',
    fechaDato: '2026-11-12', calculo: [1.060664, 1.062803, 31], vl: ['1,060664 €', '1,062803 €'], api: 'monthlyYield \\"0.024\\"',
    literal: ['publicado por Spiko el 12/11/2026 (VL fechada el 12/11/2026)', `consultado el ${FES}`],
    alcance: `Rendimiento neto anualizado de 31 días que publica Spiko (valor liquidativo del 12/11/2026, que Spiko calculó ese día; consultado el ${FES} y recalculado ese día con los valores liquidativos del 12/10 y del 12/11: 1,060664 € → 1,062803 €). Variable y no garantizado.` },
  'spiko-letras-del-tesoro-dolar': { antes: '4,02 %', pct: '3,98 %', metrica: 'Rentabilidad publicada · 31 días · 10/11/2026 · en USD',
    nueva: 'Rentabilidad publicada · 31 días · 12/11/2026 · en USD', ref: 'Rentabilidad publicada · 31 días', web: 'https://data.spiko.io/ustbl/',
    fechaDato: '2026-11-12', calculo: [1.099159, 1.102694, 30], vl: ['1,099159 $', '1,102694 $'], api: 'monthlyYield \\"0.0398\\"',
    literal: ['publicado por Spiko el 12/11/2026 (VL del 12/11/2026)', `consultado el ${FES}`],
    alcance: `Rendimiento neto anualizado en dólares de 31 días que publica Spiko (valor liquidativo del 12/11/2026, consultado el ${FES} y recalculado ese día con los valores liquidativos del 13/10 y del 12/11, porque el 12/10 fue festivo en EE. UU.: 1,099159 $ → 1,102694 $). No incluye la variación del euro frente al dólar. Variable y no garantizado.` },
};
const pct = ([a, b, dias]) => ((Math.pow(b / a, 365 / dias) - 1) * 100).toFixed(2).replace('.', ',') + ' %';
for (const [slug, s] of Object.entries(SPIKO)) {
  const o = oferta(slug), x = expedientes[slug], prop = x.propuestaTarjeta.rentabilidad;
  assert.equal(x.decision, 'actualizar');
  assert.equal(pct(s.calculo), s.pct, `${slug}: la cifra no sale de los valores liquidativos (${pct(s.calculo)})`);
  const claim = x.claims.find(c => c.campo === 'rentabilidad');
  assert.ok(claim.consultadoUtc.startsWith(`${FECHA}T08:30`) && JSON.stringify(claim.literal).includes(s.api) &&
    s.vl.every(v => claim.alcanceYLimites.includes(v)), `${slug}: la API y la serie de VL leídas hoy`);
  assert.equal(o.rentabilidad.mostrada, s.antes, `${slug}: rentabilidad «antes»`);
  assert.equal(prop.mostrada, s.pct, `${slug}: el expediente da otra cifra`);
  assert.ok(s.literal.every(t => prop.literal.includes(t)) && !/1[01]\/11\/2026/.test(prop.literal), `${slug}: literal del expediente`);
  assert.deepEqual(x.propuestaTarjeta.metricas.find(m => m.etiqueta === s.nueva), { etiqueta: s.nueva, valor: s.pct }, `${slug}: métrica del expediente`);
  anota(slug, 'rentabilidad', `${o.rentabilidad.mostrada} · ${o.rentabilidad.literal}`, `${prop.mostrada} · ${prop.literal}`);
  o.rentabilidad = { mostrada: prop.mostrada, literal: prop.literal };
  metrica(slug, s.metrica, s.antes, { etiqueta: s.nueva, valor: s.pct });
  refCambia(slug, s.ref, s.antes, { valor: s.pct, fechaDato: s.fechaDato, fechaConsulta: FECHA, fuente: s.web, alcance: s.alcance });
  // Lo demás de la ficha, como lo propone el expediente de hoy (métricas, avisos y resumen sin cambios).
  assert.deepEqual(o.metricas, x.propuestaTarjeta.metricas, `${slug}: métricas = expediente`);
  assert.deepEqual(x.propuestaTarjeta.avisos.map(textoAviso), o.avisos.map(a => a.texto), `${slug}: avisos sin cambios`);
  assert.equal(o.resumen, x.propuestaTarjeta.resumen, `${slug}: resumen sin cambios`);
}
{
  const slug = 'spiko-smart-cash-euro', o = oferta(slug), x = expedientes[slug], p = x.propuestaTarjeta;
  assert.equal(x.decision, 'actualizar');
  const claim = x.claims.find(c => c.campo === 'rentabilidad');
  assert.ok(claim.consultadoUtc.startsWith(`${FECHA}T08:30`) && claim.literal.startsWith('dailyYield "0.0284" · weeklyYield "0.0284" · monthlyYield "0.0284"') &&
    claim.alcanceYLimites.includes('1,017107 € del 12/11/2026'), `${slug}: la API leída hoy`);
  assert.equal(o.rentabilidad.mostrada, '2,84 %'); assert.equal(p.rentabilidad.mostrada, '2,84 %');
  assert.ok(o.rentabilidad.literal.includes('con el valor liquidativo del 11/11/2026 (consultado el 12/11/2026)'));
  assert.equal(p.rentabilidad.literal, o.rentabilidad.literal.replace('con el valor liquidativo del 11/11/2026 (consultado el 12/11/2026)',
    `con el valor liquidativo del 12/11/2026 (consultado el ${FES})`), `${slug}: el literal del expediente solo cambia las fechas`);
  anota(slug, 'rentabilidad', `${o.rentabilidad.mostrada} · ${o.rentabilidad.literal}`, `${p.rentabilidad.mostrada} · ${p.rentabilidad.literal}`);
  o.rentabilidad = { mostrada: p.rentabilidad.mostrada, literal: p.rentabilidad.literal };
  metrica(slug, 'Rentabilidad publicada · neta y variable · 11/11/2026', '2,84 %', { etiqueta: 'Rentabilidad publicada · neta y variable · 12/11/2026', valor: '2,84 %' });
  const r = documentos[slug].referencias[refIndice(slug, 'Rendimiento neto publicado', '2,84 %')];
  const alcance = `Tipo neto de comisiones que publica Spiko con el valor liquidativo del 12/11/2026 (consultado el ${FES}); la web lo presenta como el tipo que paga cada día el banco con el que el fondo tiene el swap. Variable: sigue al €STR.`;
  assert.equal(r.alcance, alcance.replace('12/11/2026', '11/11/2026').replace(FES, FES_PREVIA), `${slug}: el alcance publicado solo cambia de fechas`);
  refCambia(slug, 'Rendimiento neto publicado', '2,84 %', { valor: '2,84 %', fechaDato: '2026-11-12', fechaConsulta: FECHA, fuente: 'https://data.spiko.io/safo-eur', alcance });
  assert.deepEqual(o.metricas, p.metricas, `${slug}: métricas = expediente`);
  assert.deepEqual(p.avisos.map(textoAviso), o.avisos.map(a => a.texto), `${slug}: avisos sin cambios`);
  assert.equal(o.resumen, p.resumen, `${slug}: resumen sin cambios`);
}
// Smart Cash: el aviso 2 se mantiene (nadie confirma ni niega hoy que se comercialice en España).
assert.ok(oferta('spiko-smart-cash-euro').avisos.some(a => a.texto.startsWith('Spiko dice que se puede contratar desde España, pero no hemos podido confirmar')));
// Corrección obligatoria (DECISIONES §2 y §4; revisor de principales, 1 y 2): la tabla de países de Spiko dice hoy
// «Last updated: November 6, 2026» (la copia del 12/11 decía «October 23, 2026»). El claim de los expedientes se
// quedó con la fecha vieja; en la entrega, la referencia «Acceso desde España» lleva la fecha del dato 2026-11-06 y,
// en Smart Cash, su alcance cita la tabla del 06/11/2026. Las referencias históricas «· consulta 01/11/2026» no se tocan.
const SPIKO_PAISES = { literal: 'Last updated: November 6, 2026', fechaDato: '2026-11-06' };
{
  assert.ok(EXTRACTOS.includes('🇪🇸 Spain ✅ ✅ ✅ ❌') && EXTRACTOS.includes(`${SPIKO_PAISES.literal} (La copia del 12/11 a las 00:33 UTC decía «Last updated: October 23, 2026».)`), 'revisor: la tabla de países del 06/11');
  assert.ok(PRINCIPALES.includes('el literal pasa de «Last updated: October 23, 2026» a «Last updated: November 6, 2026»') &&
    PRINCIPALES.includes('`fechaDato` pasa de 2026-10-23 a 2026-11-06') &&
    PRINCIPALES.includes('en Spiko Euro, el alcance «Tabla de disponibilidad de Spiko (23/10/2026)» pasa a «(06/11/2026)»'), 'revisor: corrección obligatoria 1 y 2');
  for (const slug of ['spiko-letras-del-tesoro-euro', 'spiko-letras-del-tesoro-dolar', 'spiko-smart-cash-euro']) {
    const c = expedientes[slug].claims.find(y => y.campo === 'accesoEspana');
    assert.ok(c.literal.includes('Last updated: October 23, 2026') && c.fechaDato === '2026-10-23' && c.consultadoUtc === `${FECHA}T08:31:04Z`,
      `${slug}: el claim del expediente (sin corregir) es el que señala el revisor`);
    const smart = slug === 'spiko-smart-cash-euro';
    tarjetaFechaDato(slug, 'Acceso desde España', '2026-10-23', SPIKO_PAISES.fechaDato, smart ? a => {
      assert.equal(a.split('Tabla de disponibilidad de Spiko (23/10/2026).').length, 2, `${slug}: «(23/10/2026)» en el alcance`);
      return a.replace('Tabla de disponibilidad de Spiko (23/10/2026).', 'Tabla de disponibilidad de Spiko (06/11/2026).');
    } : null);
    const r = documentos[slug].referencias.find(y => y.etiqueta === 'Acceso desde España');
    assert.equal(r.fuente, 'https://docs.spiko.io/documentation/product_overview/fund_availability');
    assert.doesNotMatch(r.alcance, /23\/10\/2026|October 23/);
    // Las históricas se quedan como están.
    assert.ok(documentos[slug].referencias.filter(y => /^Acceso desde España · consulta 01\/11\/2026$/.test(y.etiqueta)).every(y => y.fechaDato === docBase[slug].referencias.find(z => z.etiqueta === y.etiqueta).fechaDato));
  }
}

// ---- mTBILL: sin cambios (DECISIONES §2). Sin ronda nueva del oráculo desde el 10/11: siguen 3,45 % (06/10 → 10/11) y
// el conflicto de reembolso 25 % / 15 % (fuentes_en_conflicto). Solo cambia la fecha de verificación.
{
  const slug = 'mtbill', o = oferta(slug), x = expedientes[slug], p = x.propuestaTarjeta;
  assert.equal(x.decision, 'mantener');
  const ronda = n => { const m = EXTRACTOS.match(new RegExp(`ronda ${n}: (1\\.\\d{8}) USD · \\w{3} (\\d{2})/(\\d{2})/(\\d{4}) (\\d{2}):(\\d{2}):(\\d{2}) UTC`));
    assert.ok(m, `mTBILL: ronda ${n} en los extractos del revisor`);
    return [Number(m[1]), Date.UTC(+m[4], +m[3] - 1, +m[2], +m[5], +m[6], +m[7]) / 1000]; };
  assert.ok(EXTRACTOS.includes('latestRoundData: ronda 492 · 1,07768132 USD · 10/11/2026 18:40:23 UTC (sigue siendo la última).'), 'mTBILL: la 492 sigue siendo la última');
  const [r468, r492] = [ronda(468), ronda(492)];
  const dias = (r492[1] - r468[1]) / 86400, simple = (r492[0] / r468[0] - 1) * 365 / dias;
  assert.equal((simple * 100).toFixed(2).replace('.', ','), '3,45', `mTBILL: la cifra no sale de las rondas 468 → 492 (${simple})`);
  assert.equal(dias.toFixed(2), '35.18');
  assert.match(PRINCIPALES, /\| mTBILL \| mantener \| confirmado \|/);
  assert.equal(o.estadoRevision, 'fuentes_en_conflicto', 'mTBILL sigue en conflicto (límites de reembolso)');
  assert.equal(o.rentabilidad, null); assert.equal(p.rentabilidad, null);
  assert.deepEqual(p.metricas, o.metricas, 'mTBILL: métricas = expediente');
  assert.deepEqual(p.avisos.map(textoAviso), o.avisos.map(a => a.texto), 'mTBILL: avisos = expediente');
  assert.equal(p.resumen, o.resumen);
  assert.ok(o.metricas.some(m => m.etiqueta === 'Rentabilidad pasada · 5 semanas hasta el 10/11/2026 · en USD' && m.valor === '3,45 % anual'));
  assert.deepEqual(tarjetaAntes.mtbill, [], 'mTBILL: sin datos de tarjeta publicados');
}

// ---- Aktionariat, Boss Info y Switzerlend: fechas al 13/11 (se conservan los textos publicados de acceso y salida).
const SUIZA = textoRevisor('suiza.md');
for (const l of ['### Aktionariat · `actualizar` · confirmado con cambios', '### Boss Info · `actualizar` · confirmado con cambios',
  '### Switzerlend · `actualizar` · confirmado con cambios'])
  assert.ok(SUIZA.includes(l), `revisión de suiza: falta «${l}»`);
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
  // «Última operación» (corrección 2 del revisor y DECISIONES §4): fuente, el portal (la API POST getTrades da 405 en un
  // navegador); alcance, lo comprobado hoy: el portal y el historial (investigador) y la operación en la cadena de
  // bloques con el importe del vendedor (revisor, eth.drpc.org a las 08:45:52 UTC).
  const prop = exp.referenciasFicha.find(x => /^Última operación/.test(x.etiqueta));
  assert.deepEqual([prop.etiqueta, prop.valor, prop.fuente], [`Última operación · ${FES}`, '8,40 ZCHF (1 acción, 05/11/2026)', 'https://shares.bossinfo.com/api/secondarymarkets/getTrades']);
  assert.ok(SUIZA.includes('**Corrección:** mantener `https://shares.bossinfo.com/` como fuente.') &&
    SUIZA.includes('en `https://eth.drpc.org` a las 08:45:52 UTC, 8,2404 ZCHF al vendedor y 0,1596 de comisión') &&
    SUIZA.includes('Bloque 26.348.969, 05/11/2026 13:35:35 UTC, al mercado entre accionistas; 1 BOSS por 8,40 ZCHF, 8,2404 al vendedor y 0,1596 de comisión (1,9 %).'), 'revisor de suiza: corrección 2');
  const act = expedientes[slug].claims.find(c => c.campo === 'actividad');
  assert.ok(act.dato.includes('Ninguna operación nueva desde el 12/11 (historial de 319 operaciones idéntico byte a byte)') &&
    act.localizador.includes('historial completo de 319 operaciones (08:31:21Z, mismo sha256 que el 12/11)') &&
    act.localizador.includes('«Last trade • 5 Nov 2026, 13:35» (08:33:29Z)'), `${slug}: historial y portal leídos hoy`);
  const vieja = documentos[slug].referencias[refIndice(slug, `Última operación · ${FES_PREVIA}`, '8,40 ZCHF (1 acción, 05/11/2026)')];
  assert.equal(vieja.fuente, 'https://shares.bossinfo.com/');
  assert.equal(vieja.alcance, 'Última operación del mercado entre accionistas que enseña el portal del emisor: 1 acción a 8,40 ZCHF el 05/11/2026 a las 13:35 UTC. El 12/11/2026 se comprobaron el portal, que el historial de operaciones es igual byte a byte que el del 11/11 (ninguna operación nueva) y que la operación existe en la cadena de bloques (05/11/2026, 13:35:35 UTC, contrato del mercado entre accionistas). El importe que recibió quien vendió (8,2404 ZCHF; la diferencia, el 1,9 %, es la comisión) se comprobó el 10/11/2026 y hoy no se ha vuelto a leer. La anterior era del 28/09/2026 (474 acciones a 6,70 ZCHF).');
  refCambia(slug, `Última operación · ${FES_PREVIA}`, '8,40 ZCHF (1 acción, 05/11/2026)', { etiqueta: `Última operación · ${FES}`,
    fechaDato: '2026-11-05', fechaConsulta: FECHA, fuente: 'https://shares.bossinfo.com/',
    alcance: `Última operación del mercado entre accionistas que enseña el portal del emisor: 1 acción a 8,40 ZCHF el 05/11/2026 a las 13:35 UTC. El ${FES} se comprobaron el portal, que el historial de operaciones es igual byte a byte que el del 12/11 (ninguna operación nueva) y, en la cadena de bloques, la operación (05/11/2026, 13:35:35 UTC, contrato del mercado entre accionistas) y lo que recibió quien vendió: 8,2404 ZCHF (la diferencia, 0,1596 ZCHF, el 1,9 %, es la comisión). La anterior era del 28/09/2026 (474 acciones a 6,70 ZCHF).` });
  NO_APLICADO.push({ slug, que: 'Fuente de la referencia «Última operación · 13/11/2026»: https://shares.bossinfo.com/api/secondarymarkets/getTrades (propuesta del expediente)',
    porque: 'Corrección 2 del revisor de suiza y DECISIONES §4: la API POST da 405 a un visitante; se mantiene la fuente del portal (https://shares.bossinfo.com/), que enseña la última operación. El alcance no atribuye al investigador la lectura en cadena: la de hoy es la del revisor (8,2404 ZCHF al vendedor y 0,1596 de comisión).' });
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
  assert.equal(expedientes[slug].decision, 'actualizar');
  assert.deepEqual(o.metricas, exp.metricas, `${slug}: métricas = expediente`);
  assert.deepEqual(exp.avisos.map(textoAviso), o.avisos.slice(1).map(a => a.texto), `${slug}: avisos = expediente`);
  assert.equal(o.resumen, exp.resumen, `${slug}: resumen sin cambios`);
  const pub = publicadoTarjeta(slug), ahora = Object.fromEntries(documentos[slug].referencias.filter(r => CANONICA.test(r.etiqueta)).map(r => [r.etiqueta, r.valor]));
  for (const [k, etiqueta] of [['minimo', 'Mínimo de inversión'], ['accesoEspana', 'Acceso desde España'], ['salida', 'Salida']]) {
    assert.equal(ahora[etiqueta], exp.resumenTarjeta[k], `${slug}: «${etiqueta}» = expediente`);
    if (k !== 'minimo' || slug === 'aktionariat') assert.equal(ahora[etiqueta], pub[etiqueta], `${slug}: «${etiqueta}» se conserva`);
  }
}
// Corrección obligatoria 1 de suiza (DECISIONES §4): los «consultadoUtc» de los tres expedientes llevan la hora del
// 12/11 con la fecha cambiada. La hora real de cada consulta sale del inventario del grupo
// (grupos/suiza/inventario-consultas.json, reloj del sistema): por la misma dirección y, si la entrada del expediente
// cita horas de hoy en su localizador o su texto, la primera de ellas que el inventario tenga para esa dirección. Las
// horas falsas no se escriben en ningún archivo de la entrega (se comprueba al final).
const SUIZA_LISTAS = ['claims', 'avisosConFecha', 'registros', 'advertenciasReguladores'];
const normalUrl = u => { try { const x = new URL(u);
  const q = [...x.searchParams].map(([k, v]) => `${k.toLowerCase()}=${v}`).sort().join('&');
  return `${x.hostname.replace(/^www\./, '')}${decodeURIComponent(x.pathname).replace(/\/$/, '').toLowerCase()}?${q}`; } catch { return null; } };
// Tres fuentes del expediente que el inventario anota con otra dirección: el registro de autorizados de FINMA y su
// lista de advertencias se consultaron por su API de búsqueda (una petición por nombre, con su cuerpo), y las lecturas
// en cadena, por el nodo público de Ethereum.
const FINMA_AUT = normalUrl('https://www.finma.ch/en/finma-public/authorised-institutions-individuals-and-products/');
const FINMA_ADV = normalUrl('https://www.finma.ch/en/finma-public/warnungen/warning-list/');
const NOMBRE_FINMA = { aktionariat: 'Aktionariat', 'boss-info': 'Boss Info', switzerlend: 'Switzerlend' };
const ETH = 'ethereum eth_call';
const inventarioSuiza = leer(path.join(DIR, 'grupos/suiza/inventario-consultas.json'));
assert.equal(inventarioSuiza.ciclo, '2026-11-13-v2');
const horasInventario = new Map();
for (const c of inventarioSuiza.consultas) {
  assert.match(c.consultadoUtc, /^2026-11-13T08:3[1-4]:\d{2}Z$/, `inventario de suiza: hora ${c.consultadoUtc}`);
  let n = /^Ethereum eth_call/.test(c.url) ? ETH : normalUrl(c.url);
  assert.ok(n, `inventario de suiza: dirección ${c.url}`);
  if (n === normalUrl('https://www.finma.ch/en/api/search/getresult')) {
    const q = (c.cuerpo || '').match(/(?:^|&)query=([^&]*)/);
    n = q ? `${FINMA_AUT}#${decodeURIComponent(q[1])}` : /^ds=\{1C6B8731-638C-4003-A93C-A625BF7A6800\}/.test(c.cuerpo) ? FINMA_ADV : n;
  }
  if (!horasInventario.has(n)) horasInventario.set(n, []);
  horasInventario.get(n).push(c.consultadoUtc);
}
assert.deepEqual(Object.values(NOMBRE_FINMA).map(nm => horasInventario.get(`${FINMA_AUT}#${nm}`)), [['2026-11-13T08:31:39Z'], ['2026-11-13T08:31:40Z'], ['2026-11-13T08:31:40Z']]);
assert.deepEqual(horasInventario.get(FINMA_ADV), ['2026-11-13T08:31:42Z']);
const HORAS_SUIZA = [], HORAS_FALSAS = new Set();
for (const slug of ['aktionariat', 'boss-info', 'switzerlend']) {
  const hoy = expedientes[slug], ayer = leer(path.join(base, 'expedientes', `${slug}.json`));
  let total = 0, copiadas = 0;
  for (const lista of SUIZA_LISTAS) (hoy[lista] || []).forEach((x, i) => {
    if (!x.consultadoUtc) return;
    total++;
    assert.ok(x.consultadoUtc.startsWith(FECHA), `${slug}.${lista}[${i}]: consulta de hoy`);
    const y = (ayer[lista] || [])[i], copiada = !!(y?.consultadoUtc && y.consultadoUtc.slice(11) === x.consultadoUtc.slice(11));
    const url = x.fuentePrimaria || x.url || x.fuente;
    const n = /^Ethereum, eth_call/.test(url) ? ETH : normalUrl(url) === FINMA_AUT ? `${FINMA_AUT}#${NOMBRE_FINMA[slug]}` : normalUrl(url);
    const deUrl = horasInventario.get(n) || [];
    const texto = [x.localizador, x.literal, x.alcance, x.alcanceYLimites, x.nota, x.resultado].filter(Boolean).join(' ');
    const citadas = [...texto.matchAll(/\b(08:3\d:\d{2})Z?\b/g)].map(m => `${FECHA}T${m[1]}Z`);
    const real = copiada ? (citadas.find(h => deUrl.includes(h)) || deUrl[0]) : x.consultadoUtc;
    assert.ok(real && /^2026-11-13T08:3[1-4]:\d{2}Z$/.test(real), `${slug}.${lista}[${i}]: sin hora real de consulta (${url})`);
    if (copiada) { copiadas++; HORAS_FALSAS.add(x.consultadoUtc); assert.match(x.consultadoUtc, /^2026-11-13T00:3\d:\d{2}Z$/); }
    else assert.ok(deUrl.includes(real), `${slug}.${lista}[${i}]: hora no copiada fuera del inventario`);
    HORAS_SUIZA.push({ slug, lista, indice: i, campo: x.campo || x.regulador || null, url, horaReal: real,
      origen: !copiada ? 'la del expediente (no copiada del 12/11)' : citadas.includes(real) ? 'citada en el expediente y en el inventario' : 'inventario, por la misma dirección' });
  });
  // El revisor: 26 de 27 en Aktionariat, 26 de 27 en Boss Info y 27 de 28 en Switzerlend.
  assert.deepEqual([copiadas, total], { aktionariat: [26, 27], 'boss-info': [26, 27], switzerlend: [27, 28] }[slug], `${slug}: horas copiadas del 12/11`);
}
assert.ok(SUIZA.includes('(26 de 27 en Aktionariat, 26 de 27 en Boss Info y 27 de 28 en Switzerlend)'), 'revisor de suiza: corrección 1');
NO_APLICADO.push({ slug: 'aktionariat, boss-info y switzerlend', que: 'Corregir dentro de los tres expedientes cada «consultadoUtc» copiado del 12/11 (79 de 82)',
  porque: 'El montador no edita los expedientes (prohibido en este encargo). La corrección obligatoria se aplica en la entrega: las horas reales salen del inventario del grupo y están en contraste-2026-11-13.json («horasRealesSuiza»); ninguna hora copiada llega a la entrega (se comprueba archivo a archivo) y despues-de-aplicar.mjs solo re-fecha una fuente suiza si tiene hora real de hoy.' });

// ---- Brickwise: 11 de reventa (libro de órdenes de la API a las 08:30:44 UTC y app a las 08:33 UTC del 13/11).
const BW_APP = 'https://app.brickwise.at/desktopWeb/marketplace';
const BW_V1 = 'https://api.app.brickwise.at/api/v1/assets', BW_V2 = 'https://api.app.brickwise.at/api/v2/assets';
// [mínimo publicado el 12/11, mínimo del 13/11 (DECISIONES §2)]
const BRICKWISE = {
  'apartamento-vacacional-hinterstoder-50': ['75', '75'],
  'vivienda-schwarzer-weg-18-graz': ['69,90', '69,90'],
  'vivienda-stallhofstra-e-28-gratwein': ['68,80', '68,80'],
  'drautalresidenz-paternion': ['70', '70'],
  'fotovoltaica-cohotel': ['102', '102'],
  'fotovoltaica-greenpoint': ['102', '102'],
  'randhartingergasse-9-viena': ['78', '78'],
  'local-de-estanco-klagenfurt': ['95', '95'],
  'vivienda-pluddemanngasse-101-graz': ['75', '75'],
  'vivienda-pottendorfer-stra-e-62-wr-neustadt': ['80', '73'],
  'vivienda-sonnleithnergasse-2-viena': ['75', '75'],
};
// Lo que DECISIONES §2 cambia en las referencias del libro (lo demás, solo la fecha 13/11).
const PARTICIPACIONES_DECISIONES = { 'fotovoltaica-cohotel': ['65', '59'], 'fotovoltaica-greenpoint': ['351', '347'], 'vivienda-schwarzer-weg-18-graz': ['300', '299'] };
const MEJOR_COMPRA_DECISIONES = { 'randhartingergasse-9-viena': ['56,00 € (1 participación, orden del 10/11/2026)', '64,00 € (1 participación, orden del 12/11/2026)'] };
const MENOR_IMPORTE_DECISIONES = { 'vivienda-pottendorfer-stra-e-62-wr-neustadt': ['1 participación a 115,00 € (116,73 € con el 1,5 %)', '1 participación a 73,00 € (74,10 € con el 1,5 %)'] };
const AVISO_BW = 'Cada venta se anuncia con su precio y su número de participaciones; no consta que se pueda comprar solo una parte. El comprador paga además un 1,5 % de comisión.';
const AVISO_BW_DIARIO = 'Los precios y el libro de órdenes cambian a diario: compruébalos en la app del proveedor antes de operar.';
assert.deepEqual(Object.keys(BRICKWISE).sort(), ofertas.filter(o => o.plataformaSlug === 'brickwise').map(o => o.slug).sort(), 'las 11 de Brickwise');
const LIBRO = `Libro de órdenes de la app de Brickwise leído el ${FES} (08:30–08:33 UTC) en los datos que usa la app; ninguna página pública enseña las órdenes una a una. Cambia a diario.`;
const libro = leer(path.join(DIR, 'grupos/brickwise/fuentes/libro-ordenes-resumen-2026-11-13.json'));
assert.equal(libro.consultadoUtc, '2026-11-13T08:30:44Z');
// El revisor calculó el libro por su cuenta (API a las 08:41:37 UTC, el mismo archivo que el investigador).
const libroRevisor = leer(path.join(REVISOR, 'fuentes/brickwise/libro-ordenes-revisor-2026-11-13.json'));
const BRICKWISE_REVISOR = textoRevisor('brickwise.md');
assert.ok(BRICKWISE_REVISOR.includes('**Aprobado.** Las 11 fichas quedan en `actualizar`') && /## Correcciones obligatorias Ninguna\./.test(BRICKWISE_REVISOR), 'revisor de Brickwise: aprobado sin correcciones');
const euros = n => n.toFixed(2).replace('.', ',');
const centimos = s => Math.round(Number(String(s).replace(',', '.')) * 100);
// Precio por participación + 1,5 %, redondeado al céntimo con 0,005 hacia arriba (en céntimos enteros, sin flotantes).
const con15 = precio => { const c = centimos(precio) * 1015; return euros(Math.floor((c + 500) / 1000) / 100); };
assert.deepEqual([con15(95), con15(99), con15(115), con15(68.8), con15(73)], ['96,43', '100,49', '116,73', '69,83', '74,10']);
const fechaEs = iso => iso.slice(0, 10).split('-').reverse().join('/');
assert.ok(BRICKWISE_REVISOR.includes('| Pottendorfer Straße 62 | Orden de menor importe 1 × 115 € → **1 × 73 € (74,10 €)** | 73 × 1,015 = 74,095 → 74,10 € (redondeo normal) | confirmado |'));
for (const [slug, [antes, ahora]] of Object.entries(BRICKWISE)) {
  const x = expedientes[slug], exp = x.propuestaTarjeta, o = oferta(slug);
  assert.equal(o.coleccion, 'secundario');
  assert.equal(x.decision, 'actualizar');
  const isin = x.identificador.replace(/^ISIN /, ''), a = libro.activos[isin];
  assert.ok(a && a.stage === 'secondary', `${slug}: activo en el libro`);
  assert.equal(exp.resumenTarjeta.minimo, `Desde ${ahora} € la participación en reventa (${CORTA})`, `${slug}: mínimo del expediente = DECISIONES`);
  assert.equal(euros(a.ventaMasBarata).replace(/,00$/, ''), ahora, `${slug}: el libro da otra venta más barata`);
  // Acceso, salida, métricas, avisos y resumen: sin cambios (comprobados hoy; el aviso común ya estaba).
  const pubCarta = e => documentos[slug].referencias.find(r => r.etiqueta === e)?.valor;
  assert.equal(exp.resumenTarjeta.accesoEspana, pubCarta('Acceso desde España'), `${slug}: acceso sin cambios`);
  assert.equal(exp.resumenTarjeta.salida, pubCarta('Salida'), `${slug}: salida sin cambios`);
  assert.deepEqual(exp.metricas, o.metricas, `${slug}: métricas sin cambios`);
  assert.equal(exp.resumen, o.resumen, `${slug}: resumen sin cambios`);
  assert.deepEqual(exp.avisos, o.avisos.slice(1).map(a => a.texto), `${slug}: avisos = expediente`);
  const iAviso = o.avisos.findIndex(y => y.texto === AVISO_BW);
  assert.ok(iAviso > 0 && o.avisos[iAviso + 1].texto === AVISO_BW_DIARIO, `${slug}: el aviso común, en su sitio`);
  assert.ok(x.revisionAvisos.length && x.revisionAvisos.every(r => r.veredicto === 'vigente'), `${slug}: avisos vigentes`);
  const nueva = e => { const r = exp.referenciasFicha.find(y => y.etiqueta === `${e} · ${FES}`); assert.ok(r, `${slug}: «${e}» del expediente`); return r; };
  const vieja = e => { const l = documentos[slug].referencias.filter(y => y.etiqueta.startsWith(`${e} · `)); assert.equal(l.length, 1, `${slug}: «${e}» publicada`); return l[0]; };
  // Venta más barata: con su precio, cantidad y órdenes del libro de hoy.
  const venta = nueva('Venta más barata'), v0 = vieja('Venta más barata');
  assert.equal(venta.fuente, BW_V1); assert.equal(v0.etiqueta, `Venta más barata · ${FES_PREVIA}`);
  const deLibro = v => { const m = v.match(/^([\d,]+) € por participación \((\d+) a ese precio, (?:orden del (\d{2}\/\d{2}\/\d{4})|en (\d+) órdenes(?: de [\d, ]+)?)\)$/);
    assert.ok(m, `${slug}: «${v}»`); return { precio: m[1], cantidad: Number(m[2]), fecha: m[3] || null, ordenes: m[4] ? Number(m[4]) : 1 }; };
  const enLibro = { precio: euros(a.ventaMasBarata), cantidad: a.cantidadAVentaMasBarata, ordenes: a.ordenesAVentaMasBarata.length,
    fecha: a.ordenesAVentaMasBarata.length === 1 ? fechaEs(a.ordenesAVentaMasBarata[0].creada) : null };
  assert.deepEqual(deLibro(venta.valor), enLibro, `${slug}: venta más barata del expediente = libro`);
  if (antes === ahora) assert.equal(venta.valor, v0.valor, `${slug}: la venta más barata publicada sigue igual en el libro de hoy`);
  else assert.notEqual(venta.valor, v0.valor);
  refCambia(slug, v0.etiqueta, v0.valor, { etiqueta: `Venta más barata · ${FES}`, valor: venta.valor, fechaDato: FECHA, fechaConsulta: FECHA, fuente: BW_V1, alcance: LIBRO });
  // Orden de venta de menor importe, con el 1,5 % bien redondeado.
  const menor = nueva('Orden de venta de menor importe'), m0 = vieja('Orden de venta de menor importe'), om = a.ordenMenorDesembolso;
  assert.equal(menor.fuente, BW_V1); assert.equal(om.cantidad, 1); assert.equal(m0.etiqueta, `Orden de venta de menor importe · ${FES_PREVIA}`);
  assert.equal(menor.valor, `1 participación a ${euros(om.precio)} € (${con15(om.precio)} € con el 1,5 %)`, `${slug}: orden de menor importe del expediente = libro`);
  if (MENOR_IMPORTE_DECISIONES[slug]) assert.deepEqual([m0.valor, menor.valor], MENOR_IMPORTE_DECISIONES[slug], `${slug}: orden de menor importe de DECISIONES`);
  else assert.equal(menor.valor, m0.valor, `${slug}: la orden de menor importe no cambia`);
  refCambia(slug, m0.etiqueta, m0.valor, { etiqueta: `Orden de venta de menor importe · ${FES}`, valor: menor.valor, fechaDato: FECHA, fechaConsulta: FECHA, fuente: BW_V1,
    alcance: `${LIBRO} Es la orden de venta abierta que pide menos dinero en total ese día; el importe entre paréntesis suma la comisión del 1,5 % que paga el comprador, redondeada al céntimo.` });
  // Mínimo de la tarjeta.
  const lote = String(a.cantidadAVentaMasBarata);
  tarjeta(slug, 'Mínimo de inversión', exp.resumenTarjeta.minimo, BW_APP, FECHA,
    `Precio por participación de la venta más barata del mercado de la app ese día, más un 1,5 % de comisión; a ese precio había ${lote} ${lote === '1' ? 'participación' : 'participaciones'} a la venta. Brickwise no publica un mínimo en reventa ni si una orden se puede comprar en parte. El precio lo fija cada vendedor y cambia a diario. No es el precio de emisión.`,
    `Desde ${antes} € la participación en reventa (${CORTA_PREVIA})`);
  // Participaciones en venta: todas al 13/11 (DECISIONES §2: Cohotel 59, GreenPoint 347, Schwarzer Weg 299; las demás,
  // la misma cifra con la fecha de hoy, también Pottendorfer, 107).
  const p1 = nueva('Participaciones en venta'), p0 = vieja('Participaciones en venta');
  assert.equal(p1.fuente, BW_V2); assert.equal(Number(p1.valor), a.participacionesEnVenta, `${slug}: participaciones del expediente = libro`);
  assert.equal(a.v2_availableBricksSecondary, a.participacionesEnVenta, `${slug}: la v2 da la misma cifra`);
  if (PARTICIPACIONES_DECISIONES[slug]) assert.deepEqual([p0.valor, p1.valor], PARTICIPACIONES_DECISIONES[slug], `${slug}: participaciones de DECISIONES`);
  else assert.equal(p1.valor, p0.valor, `${slug}: las participaciones en venta no cambian`);
  refCambia(slug, p0.etiqueta, p0.valor, { etiqueta: `Participaciones en venta · ${FES}`, valor: p1.valor, fechaDato: FECHA, fechaConsulta: FECHA, fuente: BW_V2,
    alcance: 'Participaciones de esta emisión a la venta entre inversores ese día (suma de las órdenes abiertas en la app). Cambia a diario.' });
  // Mejor oferta de compra: la del libro de hoy (Randhartingergasse 56 → 64 €); las demás, el texto publicado re-fechado.
  const mc0 = vieja('Mejor oferta de compra'), mc1 = nueva('Mejor oferta de compra');
  assert.equal(mc1.fuente, BW_V1); assert.equal(mc0.etiqueta, `Mejor oferta de compra · ${FES_PREVIA}`);
  {
    const m = mc1.valor.match(/^([\d,]+) € \((?:(\d+) participaci(?:ón|ones), orden del (\d{2}\/\d{2}\/\d{4})|(\d+) participaciones en (\d+) órdenes; la más antigua del (\d{2}\/\d{2}\/\d{4}))\)$/);
    assert.ok(m, `${slug}: «${mc1.valor}»`);
    const aPrecio = a.mejoresCompras3.filter(c => euros(c[0]) === m[1]);
    assert.equal(euros(a.mejorCompra.precio), m[1], `${slug}: mejor compra del libro`);
    if (m[2]) assert.deepEqual([aPrecio.length, aPrecio[0][1], fechaEs(aPrecio[0][2])], [1, Number(m[2]), m[3]], `${slug}: mejor compra del expediente = libro`);
    else assert.deepEqual([aPrecio.length, aPrecio.reduce((s, c) => s + c[1], 0), aPrecio.map(c => c[2]).sort()[0]].map(String),
      [m[5], m[4], m[6].split('/').reverse().join('-')], `${slug}: mejor compra del expediente = libro`);
  }
  if (MEJOR_COMPRA_DECISIONES[slug]) assert.deepEqual([mc0.valor, mc1.valor], MEJOR_COMPRA_DECISIONES[slug], `${slug}: mejor compra de DECISIONES`);
  else assert.equal(mc1.valor, mc0.valor, `${slug}: la mejor compra no cambia`);
  refCambia(slug, mc0.etiqueta, mc0.valor, { etiqueta: `Mejor oferta de compra · ${FES}`, valor: mc1.valor, fechaDato: FECHA, fechaConsulta: FECHA, fuente: BW_V1,
    alcance: `${LIBRO} Es lo más que ofrecía pagar un comprador ese día, antes de la comisión del 1,5 %.` });
  // «Desistimiento»: igual que lo publicado (se queda con su fecha).
  const des = exp.referenciasFicha.find(y => y.etiqueta === 'Desistimiento');
  assert.equal(des.valor, documentos[slug].referencias.find(y => y.etiqueta === 'Desistimiento').valor, `${slug}: desistimiento sin cambios`);
  assert.equal(exp.referenciasFicha.length, 5, `${slug}: cinco referencias del libro y del desistimiento en el expediente`);
  // El cálculo del revisor (por su cuenta, con aritmética decimal exacta) da lo mismo.
  const rv = Object.values(libroRevisor.fichas).filter(y => y.isin === isin);
  assert.equal(rv.length, 1, `${slug}: en el libro del revisor`);
  assert.deepEqual([rv[0].participacionesEnVenta_v1, rv[0].participacionesEnVenta_v2, rv[0].ventaMasBarata.precio, rv[0].ventaMasBarata.cantidad,
    rv[0].ordenMenorImporte[0].conComision1_5.replace('.', ','), rv[0].mejorCompra.precio],
    [a.participacionesEnVenta, a.participacionesEnVenta, a.ventaMasBarata, a.cantidadAVentaMasBarata, con15(om.precio), a.mejorCompra.precio], `${slug}: libro del revisor`);
}
assert.equal(libroRevisor.consultadoUtc.v1, '2026-11-13T08:41:37Z');
assert.equal(Object.keys(libroRevisor.fichas).length, 11);

// ---- Hausera · próximas ofertas: sin cambios de contenido; se re-fecha al 13/11 lo que se volvió a consultar hoy.
{
  const slug = 'hausera-proximas-ofertas', o = oferta(slug), x = expedientes[slug], exp = x.propuestaTarjeta;
  assert.equal(x.decision, 'mantener');
  assert.match(textoRevisor('vigilancia.md'), /\| Hausera · próximas ofertas \(publicada\) \| mantener \| confirmado \|/);
  const pub = publicadoTarjeta(slug);
  assert.deepEqual([exp.resumenTarjeta.accesoEspana, exp.resumenTarjeta.salida], [pub['Acceso desde España'], pub.Salida], 'Hausera: acceso y salida = lo publicado');
  assert.deepEqual(exp.metricas, o.metricas, 'Hausera: métricas sin cambios');
  assert.equal(exp.resumen, o.resumen, 'Hausera: resumen sin cambios');
  const consultado = c => x.claims.find(y => y.campo === c);
  // El registro de la CNMV (ERIR de Ursus-3), hoy a las 08:30:41 UTC: Alicante 3 sigue sin inscribir.
  assert.ok(consultado('registro').consultadoUtc === '2026-11-13T08:30:41Z' && consultado('registro').fuentePrimaria === 'https://www.cnmv.es/portal/consultas/esi/erir_esi?nif=A86796182&lang=es' &&
    consultado('registro').dato.includes(`el ${FES}`));
  avisoCambia(slug, `El documento de emisión no es un folleto y la CNMV no lo ha revisado. El ${FES_PREVIA} Alicante 3 aún no estaba inscrita en el registro de la CNMV.`,
    `El documento de emisión no es un folleto y la CNMV no lo ha revisado. El ${FES} Alicante 3 aún no estaba inscrita en el registro de la CNMV.`);
  // El documento de emisión, hoy a las 08:36:16 UTC (mismo SHA-256): el mínimo pasa a (13/11).
  assert.ok(consultado('minimo').consultadoUtc === '2026-11-13T08:36:16Z' && consultado('minimo').fuentePrimaria === 'https://drive.google.com/file/d/1cpWVN3J_Y1xdRDAxUzGnjmWXB-eTODH_');
  const r = documentos[slug].referencias.find(y => y.etiqueta === 'Mínimo de inversión');
  const minimo = `Desde 100 € en Alicante 3, según su documento de emisión (${CORTA}); la preventa abre el 18/11.`;
  assert.equal(exp.resumenTarjeta.minimo, minimo, 'Hausera: mínimo del expediente');
  // El alcance decía «El 12/11/2026 aún no se podía invertir…» (corrección R1 del 12/11): mismo hecho, comprobado hoy
  // (criterios.actividadYFecha: «13/11/2026: … Alicante 3 abre la preventa el 18/11/2026 (09:00) … Hoy no se puede invertir.»).
  assert.match(x.criterios.actividadYFecha.nota, /^13\/11\/2026: .*Alicante 3 abre la preventa el 18\/11\/2026 \(09:00\) y la suscripción del 25\/11\/2026 .*Hoy no se puede invertir\.$/);
  const NO_INVERTIR = f => `El ${f} aún no se podía invertir: la preventa abre el 18/11/2026 y la suscripción, el 25/11/2026.`;
  const alcanceMinimo = r.alcance.replace(PREFIJO, '');
  assert.equal(alcanceMinimo.split(NO_INVERTIR(FES_PREVIA)).length, 2, 'Hausera: «El 12/11/2026 aún no se podía invertir» en el alcance del mínimo publicado');
  tarjeta(slug, 'Mínimo de inversión', minimo, r.fuente, r.fechaDato, alcanceMinimo.replace(NO_INVERTIR(FES_PREVIA), NO_INVERTIR(FES)),
    `Desde 100 € en Alicante 3, según su documento de emisión (${CORTA_PREVIA}); la preventa abre el 18/11.`);
  // La portada (hoy a las 08:33:41 UTC): las mismas cifras del promotor.
  const portada = x.documentos.find(d => d.url === 'https://hausera.io/');
  assert.ok(portada.versionOFecha === 'consulta 2026-11-13T08:33:41Z' && portada.nota.includes('Cifras del promotor iguales: 42 operaciones, 24 terminadas, 128 M€ financiados'));
  const hist = documentos[slug].referencias[refIndice(slug, `Historial publicado · ${FES_PREVIA}`, '42 operaciones, 24 terminadas, 128 M€ financiados')];
  assert.equal(hist.alcance.split(`consultada el ${FES_PREVIA}`).length, 2);
  refCambia(slug, `Historial publicado · ${FES_PREVIA}`, hist.valor, { etiqueta: `Historial publicado · ${FES}`, fechaConsulta: FECHA,
    alcance: hist.alcance.replace(`consultada el ${FES_PREVIA}`, `consultada el ${FES}`) });
  // Las demás fechas de Hausera son hechos, no consultas: «Alicante 2 ya figuraba como financiada el 10/11/2026, antes de
  // su oferta pública del 11/11» (aviso y resumen) se queda tal cual, también en el expediente.
  assert.deepEqual(exp.avisos.map(textoAviso), o.avisos.slice(1).map(a => a.texto), 'Hausera: avisos = expediente');
  assert.doesNotMatch(JSON.stringify([o, documentos[slug]]), /\b[57]0 ?%/, `${slug}: no se publica el mínimo de emisión`);
}
// ---- Robinhood, Kraken y Prosegur Digital Gold: sin cambios (solo la fecha); el expediente dice lo mismo.
for (const slug of ['robinhood-classic-stock-tokens', 'kraken-xstocks', 'prosegur-digital-gold']) {
  const o = oferta(slug), exp = expedientes[slug].propuestaTarjeta;
  assert.equal(expedientes[slug].decision, 'mantener');
  assert.deepEqual(exp.metricas, o.metricas, `${slug}: métricas sin cambios`);
  assert.deepEqual(exp.avisos.map(textoAviso), o.avisos.map(a => a.texto), `${slug}: avisos sin cambios`);
  assert.equal(exp.resumen, o.resumen, `${slug}: resumen sin cambios`);
  assert.deepEqual(exp.rentabilidad, o.rentabilidad, `${slug}: rentabilidad sin cambios`);
  assert.match(PRINCIPALES, new RegExp(`\\| ${{ 'robinhood-classic-stock-tokens': 'Robinhood Classic Stock Tokens', 'kraken-xstocks': 'Kraken xStocks', 'prosegur-digital-gold': 'Prosegur Digital Gold' }[slug]} \\| mantener \\| confirmado \\|`));
}
NO_APLICADO.push({ slug: 'varias', que: 'Propuestas de los expedientes fuera de DECISIONES: textos nuevos de tarjeta (mínimo, acceso o salida con otras palabras) de las tres de Spiko, Robinhood, Kraken y Prosegur; datos de tarjeta de mTBILL; fuentes nuevas de las ofertas (API de Spiko, GECO, API de Brickwise, documentos y contratos de Midas); y los campos «lugar», «concepto» y «pasos» que traen los expedientes',
  porque: 'DECISIONES-COORDINADOR.md es una lista cerrada y no los recoge: se conservan los publicados. mTBILL sigue en «fuentes_en_conflicto» y la web y la app ocultan sus datos de tarjeta.' });
NO_APLICADO.push({ slug: 'spiko-letras-del-tesoro-euro, spiko-letras-del-tesoro-dolar y spiko-smart-cash-euro', que: 'Corregir dentro de los expedientes el claim «accesoEspana» («Last updated: October 23, 2026», fechaDato 2026-10-23) y la nota interna «en las cuatro columnas»',
  porque: 'El montador no edita los expedientes (prohibido en este encargo). La corrección se aplica en lo que se publica: la referencia «Acceso desde España» de las tres lleva fechaDato 2026-11-06 y, en Smart Cash, «Tabla de disponibilidad de Spiko (06/11/2026)»; el literal corregido («Last updated: November 6, 2026») y la nota corregida («en tres de las cuatro columnas: Smart Cash, T-Bills Euro y T-Bills Dollar») quedan en contraste-2026-11-13.json («correccionesRevisores»). Ningún texto publicado cita «October 23» salvo las referencias históricas «· consulta 01/11/2026», que el revisor deja como están.' });

// ---- Avisos: se vuelven a fechar al 13/11 los comprobados hoy: el editorial común y los que el expediente de hoy
// propone tal cual (todos se revisaron uno a uno).
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
const APIRX = /\/api\/|public-api\.|[?&]wt=json|\.json(?:$|\?)|\.js(?:$|\?)/;
const todas = lote => [...lote.e.flatMap(o => [o.url, ...o.fuentesActuales]), ...Object.values(lote.d).flatMap(d => [...d.fuentes, ...d.referencias.map(r => r.fuente)])];
const antesApi = new Set(todas({ e: escaparateBase.ofertas, d: docBase }).filter(u => APIRX.test(u)));
assert.deepEqual([...new Set(todas({ e: ofertas, d: documentos }).filter(u => APIRX.test(u) && !antesApi.has(u)))], [],
  'fuente técnica nueva (API, JSON o .js)');
assert.deepEqual(CAMBIOS.filter(c => c.campo === 'fuente de la ficha'), [], 'hoy no entra ninguna fuente nueva en las fichas');
const CSP = /<style\b|\sstyle\s*=|\son[a-z]+\s*=|<script/i;
assert.ok(!CSP.test(JSON.stringify(documentos)) && !CSP.test(JSON.stringify(ofertas)), 'texto que la compuerta CSP rechazaría');
// Ningún aviso ni dato de tarjeta nuevo arrastra la fecha del 12/11 como si fuera de hoy.
for (const c of CAMBIOS) if (c.despues && ['aviso', 'tarjeta'].includes(c.campo)) assert.doesNotMatch(c.despues, /\b12\/11\b/, `${c.slug}: fecha vieja en «${c.despues}»`);
// Ningún texto nuevo apoya el acceso de mTBILL en la web de Midas, ni publica la cifra rechazada (3,53 %).
for (const c of CAMBIOS) if (c.despues) assert.doesNotMatch(c.despues, /países permitidos|Permitted Jurisdictions|(?<![\d,])3,53 ?%/i, `${c.slug}: «${c.despues}»`);

// ---------------------------------------------------------------- nada más cambia
// Cada diferencia con la 2026-11-12 tiene que estar en CAMBIOS (o ser una fecha de hoy).
{
  const dif = (a, b) => [...a.filter(x => !b.includes(x)), ...b.filter(x => !a.includes(x))];
  const CAMPOS = new Set(['verificadaEl', 'avisos', 'metricas', 'rentabilidad']);
  for (const o of ofertas) {
    const b = escaparateBase.ofertas.find(x => x.slug === o.slug), c = CAMBIOS.filter(x => x.slug === o.slug);
    for (const k of Object.keys(b)) if (!CAMPOS.has(k)) assert.deepEqual(o[k], b[k], `${o.slug}.${k} no debía cambiar`);
    assert.deepEqual(Object.keys(o), Object.keys(b));
    const av = dif(b.avisos.map(a => a.texto), o.avisos.map(a => a.texto)).sort();
    assert.deepEqual(av, c.filter(x => x.campo === 'aviso').flatMap(x => [x.antes, x.despues]).filter(Boolean).sort(), `${o.slug}: avisos`);
    assert.ok(o.avisos.every(a => a.verificadaEl === FECHA && a.tono === 'warn' && a.esAntiguedad === false), `${o.slug}: avisos con fecha de hoy`);
    assert.equal(o.avisos.length, b.avisos.length, `${o.slug}: número de avisos`);
    assert.deepEqual(o.avisos.map(({ texto, verificadaEl, ...r }) => r), b.avisos.map(({ texto, verificadaEl, ...r }) => r), `${o.slug}: forma de los avisos`);
    const me = dif(b.metricas.map(m => `${m.etiqueta}: ${m.valor}`), o.metricas.map(m => `${m.etiqueta}: ${m.valor}`)).sort();
    assert.deepEqual(me, c.filter(x => x.campo === 'métrica').flatMap(x => [x.antes, x.despues]).filter(Boolean).sort(), `${o.slug}: métricas`);
    assert.deepEqual(o.metricas.map(m => m.etiqueta.replace(/\d{2}\/\d{2}\/\d{4}/, 'F')), b.metricas.map(m => m.etiqueta.replace(/\d{2}\/\d{2}\/\d{4}/, 'F')), `${o.slug}: orden de las métricas`);
    assert.equal(JSON.stringify(o.rentabilidad) !== JSON.stringify(b.rentabilidad), c.some(x => x.campo === 'rentabilidad'), `${o.slug}: rentabilidad`);
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
    assert.equal(d.referencias.length, db.referencias.length, `${o.slug}: número de referencias (hoy no se añade ni se quita ninguna)`);
    assert.deepEqual(d.referencias.map(r => r.etiqueta.replace(/\d{2}\/\d{2}\/\d{4}/, 'F')), db.referencias.map(r => r.etiqueta.replace(/\d{2}\/\d{2}\/\d{4}/, 'F')), `${o.slug}: orden de las referencias`);
    for (const [i, r] of d.referencias.entries()) assert.deepEqual(Object.keys(r), Object.keys(db.referencias[i]), `${o.slug}: campos de la referencia ${i}`);
  }
}
// Ofertas sin cambios (DECISIONES §2): solo las fechas de verificación.
for (const slug of ['robinhood-classic-stock-tokens', 'kraken-xstocks', 'prosegur-digital-gold', 'mtbill'])
  assert.deepEqual(CAMBIOS.filter(c => c.slug === slug), [], `${slug}: solo fechas`);
// Lo que cambia, ficha a ficha, es exactamente lo de DECISIONES §2 y §4.
{
  const cuenta = Object.fromEntries([...new Set(CAMBIOS.map(c => c.slug))].map(s => [s, CAMBIOS.filter(c => c.slug === s).map(c => c.campo).sort()]));
  const r = n => Array(n).fill('referencia de la ficha');
  const spiko = ['métrica', 'referencia de la ficha', 'rentabilidad', 'tarjeta'];
  assert.deepEqual(cuenta, {
    'spiko-letras-del-tesoro-euro': spiko, 'spiko-letras-del-tesoro-dolar': spiko, 'spiko-smart-cash-euro': spiko,
    aktionariat: ['aviso', 'métrica', 'métrica'],
    'boss-info': ['aviso', 'métrica', 'referencia de la ficha', 'tarjeta'], switzerlend: ['aviso', 'aviso', 'métrica', 'tarjeta'],
    ...Object.fromEntries(Object.keys(BRICKWISE).map(s => [s, [...r(4), 'tarjeta']])),
    'hausera-proximas-ofertas': ['aviso', 'referencia de la ficha', 'tarjeta'],
  }, 'cambios por ficha');
  // En Brickwise, las cifras que cambian son exactamente las de DECISIONES §2.
  const cifrasBw = CAMBIOS.filter(c => BRICKWISE[c.slug] && c.antes.split(': ').slice(1).join(': ') !== c.despues.split(': ').slice(1).join(': ') && c.campo !== 'tarjeta')
    .map(c => `${c.slug} · ${c.despues.split(' · ')[0]}`).sort();
  assert.deepEqual(cifrasBw, ['fotovoltaica-cohotel · Participaciones en venta', 'fotovoltaica-greenpoint · Participaciones en venta',
    'randhartingergasse-9-viena · Mejor oferta de compra', 'vivienda-pottendorfer-stra-e-62-wr-neustadt · Orden de venta de menor importe',
    'vivienda-pottendorfer-stra-e-62-wr-neustadt · Venta más barata', 'vivienda-schwarzer-weg-18-graz · Participaciones en venta'], 'Brickwise: cifras que cambian');
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
assert.equal(JSON.stringify(escaparate.fuente), JSON.stringify(escaparateBase.fuente).replaceAll(FES_PREVIA, FES).replaceAll(DESDE, ETIQUETA)
  .replace('Parte de la publicada 24b5f7de (entrega 2026-11-11)', `Parte de la publicada ${PREVIA.slice(0, 8)} (entrega ${DESDE})`), 'cabecera del escaparate: solo fechas y partida');
assert.match(escaparate.fuente.notaOrigen, /^Revisión del 13\/11\/2026 \(puesta al día pedida por el responsable del proyecto\)/, 'nota de origen sin nombres de personas');
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
  // La guarda: la publicada exacta, su huella, catálogo no retirado y del 13/11 al 20/11.
  assert.ok(sql.includes(`if current_date > date '2026-11-20' then`) && sql.includes(`if current_date < date '2026-11-13' then raise exception 'Revisión futura'`));
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
const contrasteSalida = path.join(DIR, `contraste-${ETIQUETA}.json`);
escribir(contrasteSalida, { tipo: 'revision_integral', fecha: FECHA, etiqueta: ETIQUETA,
  revisionAnterior: PREVIA, revisionNueva: nueva.revisionId,
  decision: `Puesta al día pedida por el responsable del proyecto el ${FES} («Actualiza las noticias, las ofertas y el gráfico de la evolución de la tokenización a hoy… lo más rápido posible pero que esté bien hecho»). Lo que entra: DECISIONES-COORDINADOR.md (lista cerrada).`,
  archivos: Object.fromEntries(['DECISIONES-COORDINADOR.md', `radar-contraste-${FECHA}.json`, 'cambios-radar.json']
    .map(n => [n, sha(path.join(DIR, n))])),
  radar: { fuentes: contraste.fuentes, correctas: contraste.correctas, verificacionesManuales: Object.keys(cambiosRadar.verificacionesManuales),
    cambios: { fuentes: {}, plataformas: {} } },
  cifras: {
    'spiko-letras-del-tesoro-euro': { antes: '2,41 % (VL del 11/11)', despues: '2,40 % (VL del 12/11, 1,062803 €)', calculo: '(1,062803 / 1,060664)^(365/31) − 1, del 12/10 al 12/11' },
    'spiko-letras-del-tesoro-dolar': { antes: '4,02 % en USD (VL del 10/11)', despues: '3,98 % en USD (VL del 12/11, 1,102694 $)', calculo: '(1,102694 / 1,099159)^(365/30) − 1, del 13/10 al 12/11 (el 12/10 fue festivo en EE. UU.)' },
    'spiko-smart-cash-euro': { antes: '2,84 % (VL del 11/11)', despues: '2,84 % (VL del 12/11, 1,017107 €)', consulta: FECHA },
    mtbill: { antes: 'métrica 3,45 % anual en USD (rondas 468 → 492)', despues: 'sin cambios: la ronda 492 (10/11, 18:40 UTC) sigue siendo la última' },
    brickwise: Object.fromEntries(Object.entries(BRICKWISE).map(([s, [a, b]]) => [s, `${a} € → ${b} €`])),
  },
  correccionesRevisores: {
    spikoAccesoEspana: { fichas: Object.keys(SPIKO).concat('spiko-smart-cash-euro'), fuente: 'https://docs.spiko.io/documentation/product_overview/fund_availability',
      claimCorregido: { literal: '🇪🇸 Spain ✅ ✅ ✅ ❌ (columnas Smart Cash, T-Bills Euro, T-Bills Dollar, T-Bills Pound) · Last updated: November 6, 2026.', fechaDato: SPIKO_PAISES.fechaDato },
      notaCorregida: 'España sigue marcada en tres de las cuatro columnas (Smart Cash, T-Bills Euro y T-Bills Dollar); en T-Bills Pound tiene ❌.',
      enLaEntrega: 'referencia «Acceso desde España» con fechaDato 2026-11-06 en las tres; en Smart Cash, «Tabla de disponibilidad de Spiko (06/11/2026)».' },
    suizaHoras: { nota: 'Horas reales de consulta del 13/11 (inventario del grupo suiza, reloj del sistema), en lugar de las copiadas del 12/11 que llevan los expedientes (79 de 82 entradas). Las copiadas no se escriben en la entrega.',
      copiadas: { aktionariat: '26 de 27', 'boss-info': '26 de 27', switzerlend: '27 de 28' } },
    bossInfoUltimaOperacion: { fuente: 'https://shares.bossinfo.com/', porque: 'la API POST getTrades da 405 a un visitante' },
  },
  horasRealesSuiza: HORAS_SUIZA,
  condicionHora: { spiko: 'VL del 12/11 en las tres, válidas si la entrega se monta antes de las 18:00 UTC del 13/11 (la API anuncia la siguiente cifra de las Letras a las 18:00 UTC y la de Smart Cash a las 19:30 UTC); si no, volver a leer la API pública de Spiko. La hora del montaje está en INFORME-ENTREGA.md.',
    mtbill: 'Ronda 492 (10/11, 18:40 UTC) última a las 08:45 UTC del 13/11 (revisor); una ronda nueva cambiaría el valor por token, no la métrica de 5 semanas hasta el 10/11.',
    brickwise: 'Pottendorfer: la orden de 1 participación a 73 € (creada el 12/11 a las 21:45 UTC) seguía abierta a las 08:48 UTC; el revisor recomienda volver a mirarla justo antes de aplicar.' },
  vigencia: { verificadaEl: FECHA, vigenciaDias: 7, ultimoDiaVigente: ULTIMO },
  cambios: CAMBIOS, tarjetaConservadasDeMasDe120: largasConservadas, tarjetas,
  noAplicadoTalCual: NO_APLICADO,
  sinCambios: ['las 25 plataformas del radar y sus textos, salvo las fechas de consulta', 'public.plataformas y public.fuentes (el SQL no las toca)',
    'colecciones 8/13/1, estados de revisión, fuentes de las ofertas e imágenes', 'mTBILL, Robinhood, Kraken y Prosegur Digital Gold: solo las fechas',
    'las noticias y el gráfico de la tokenización (no son parte de esta entrega)'],
  altas: [], retiradas: [], colecciones });

// ---------------------------------------------------------------- ninguna hora copiada del 12/11 llega a la entrega
{
  const salidas = [path.join(DIR, 'radar-canonico-26.json'), path.join(DIR, 'escaparate-publicacion.json'), path.join(DIR, 'documentacion-ofertas.json'),
    path.join(DIR, 'manifiesto-catalogo.json'), contrasteSalida, path.join(destino, 'catalogo.sql'), archivo, path.join(destino, 'revision.json')];
  assert.equal(HORAS_FALSAS.size > 0, true);
  for (const p of salidas) {
    const t = fs.readFileSync(p, 'utf8');
    for (const h of HORAS_FALSAS) assert.ok(!t.includes(h) && !t.includes(`${h.slice(11, 19)} UTC`) && !t.includes(`${h.slice(11, 16)} UTC`), `${path.basename(p)}: lleva la hora copiada ${h}`);
    assert.doesNotMatch(t, /13\/11\/2026 a las 00:|2026-11-13T00:/, `${path.basename(p)}: una hora de las 00 del 13/11`);
  }
}
console.log(JSON.stringify({ etiqueta: ETIQUETA, revisionId: nueva.revisionId, hash: nueva.hash, previa: PREVIA, sha256: sha(archivo),
  plataformas: escaparate.plataformas.length, fuentesRadar: radar.fuentes.length, ofertas: ofertas.length, colecciones, cambios: CAMBIOS.length,
  noAplicado: NO_APLICADO.length, horasRealesSuiza: HORAS_SUIZA.length }));

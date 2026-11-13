// Motor de la entrega · PREPARAR. Sin red ni servicios remotos; reproducible byte a byte (ninguna salida depende de la
// hora). Parte EXACTAMENTE de la entrega publicada («desde»), comprueba que es la que se leyó hoy como visitante y aplica
// SOLO lo que dice decisiones.json (cada texto «antes» se exige tal cual: si no está, falla). Escribe
// escaparate-publicacion.json, documentacion-ofertas.json, radar-canonico-26.json, manifiesto-catalogo.json y
// contraste-<etiqueta>.json en la carpeta del ciclo, y catalogo.sql, aplicar-y-aprobar.sql y revision.json en
// rwadar-app/data/importaciones/catalogo-<etiqueta>-v2/.
//
// Es la generalización de rwadar-app/data/verificaciones/2026-11-12-v2/preparar-entrega.mjs: las mismas guardas, con lo
// propio de cada día en decisiones.json (formato en FORMATO.md).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  RAIZ_REPO, require, EDITORIAL, CANONICA, PREFIJO, APIRX, CSP, leer, escribir, sha, plano, textoAviso, unico, escRx,
  capital, cargarDecisiones, contexto, resolverPrueba, comprobarCalculo,
} from './comun.mjs';
import { guarda, aprobacion, aplicarYAprobar } from './sql.mjs';

// El catálogo sincronizado de la web (por omisión, el de rwadar-site). Para repetir una entrega pasada se le pasa el de ese
// día (por ejemplo, sacado de Git), porque el de la carpeta ya es el de después.
export function leerWeb(raiz, archivo) {
  const { leerBloquesCatalogo } = require(path.join(raiz, 'rwadar-fichas.js'));
  return leerBloquesCatalogo(fs.readFileSync(archivo || path.join(raiz, 'rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8'));
}

// opciones: raiz (repositorio, de donde se lee), ciclo (carpeta del ciclo), decisiones (ruta; por omisión
// <ciclo>/decisiones.json), salida (raíz donde se escribe, por omisión la misma), web (catálogo sincronizado de la web,
// por omisión el de rwadar-site), comprobaciones (comprobaciones-fuentes.json, por omisión el del repositorio).
export function preparar(opciones = {}) {
  const raiz = path.resolve(opciones.raiz || RAIZ_REPO);
  const D = cargarDecisiones(opciones.decisiones || path.join(opciones.ciclo || path.join(raiz, 'rwadar-app/data/verificaciones', '_'), 'decisiones.json'));
  const C = contexto(D, { raiz, ciclo: opciones.ciclo });
  const { DIR, ETIQUETA, FECHA, DESDE, DESDE_FECHA, FES, CORTA, FES_PREVIA, CORTA_PREVIA, ULTIMO, PREVIA, HASH_PREVIA, ULTIMO_PREVIA, COLECCIONES } = C;
  const salida = path.resolve(opciones.salida || raiz);
  const DIR_SALIDA = path.join(salida, path.relative(raiz, DIR));
  const { cargarFuentesLocales, construirSqlImportacion } = require(path.join(raiz, 'rwadar-app/catalogo-publico.js'));
  const { idiomaCita } = require(path.join(raiz, 'rwadar-site/assets/ficha-editorial-20261022.js'));
  const base = path.join(raiz, 'rwadar-app/data/verificaciones', `${DESDE}-v2`);
  const nOfertas = C.OFERTAS;

  // ------------------------------------------------------------ partida: la publicada
  const previa = construirSqlImportacion(cargarFuentesLocales(raiz, { revision: DESDE, versionEsquema: 2 }));
  assert.equal(previa.revisionId, PREVIA, `la ${DESDE} local no es la revisión publicada`);
  assert.equal(previa.hash, HASH_PREVIA, `identidad (huella) de la ${DESDE}`);
  const revisionDesde = leer(path.join(raiz, `rwadar-app/data/importaciones/catalogo-${DESDE}-v2/revision.json`));
  assert.deepEqual([revisionDesde.revisionId, revisionDesde.hash, revisionDesde.venceTrasEl], [PREVIA, HASH_PREVIA, ULTIMO_PREVIA], `revision.json de la ${DESDE}`);
  const snapshot = opciones.web && typeof opciones.web === 'object' ? opciones.web : leerWeb(raiz, opciones.web);
  assert.ok([...snapshot.plataformas, ...snapshot.ofertas].every(x => x.revisionId === PREVIA), `el catálogo sincronizado de la web no es la ${PREVIA.slice(0, 8)}`);
  assert.deepEqual([snapshot.plataformas.length, snapshot.ofertas.length], [D.plataformas, nOfertas], 'el catálogo sincronizado de la web tiene otras cantidades');
  assert.ok(snapshot.ofertas.every(o => o.verificadaEl === DESDE_FECHA), `el catálogo sincronizado está verificado el ${FES_PREVIA}`);
  const radarBase = leer(path.join(base, 'radar-canonico-26.json'));
  const escaparateBase = leer(path.join(base, 'escaparate-publicacion.json'));
  const docBase = leer(path.join(base, 'documentacion-ofertas.json'));
  const manifiestoBase = leer(path.join(base, 'manifiesto-catalogo.json'));

  // Lo leído hoy como visitante (lectura-publica/) es exactamente la base local.
  const lp = path.join(DIR, 'lectura-publica');
  const pubO = leer(path.join(lp, 'ofertas-v2.json')), pubP = leer(path.join(lp, 'plataformas-v2.json'));
  const pubT = leer(path.join(lp, 'plataformas-todas.json'));
  {
    const hora = fs.readFileSync(path.join(lp, 'hora-lectura.txt'), 'utf8');
    assert.ok(hora.includes(D.lecturaPublica.hora), 'hora de la lectura pública');
    const r = JSON.parse(hora.match(/Resultado: (\{.*\})/)[1]);
    assert.deepEqual([r.revision, r.plataformas, r.ofertas, r.colecciones, r.verificadaEl], [[PREVIA], D.plataformas, nOfertas, COLECCIONES, [DESDE_FECHA]], 'resultado de la lectura pública');
  }
  assert.ok([...pubO, ...pubP].every(x => x.revision_id === PREVIA), `la publicada leída hoy es la ${PREVIA.slice(0, 8)}`);
  assert.equal(pubO.length, escaparateBase.ofertas.length); assert.equal(pubP.length, escaparateBase.plataformas.length);
  for (const o of pubO) {
    const b = escaparateBase.ofertas.find(x => x.slug === o.slug);
    assert.ok(b, `${o.slug}: no está en la base local`);
    assert.deepEqual(o.documentacion, docBase[o.slug], `${o.slug}: documentación publicada = base local`);
    assert.deepEqual(o.fuentes_actuales, b.fuentesActuales, `${o.slug}: fuentes`);
    assert.deepEqual([o.coleccion, o.verificada_el, o.vigencia_dias, o.estado_revision], [b.coleccion, b.verificadaEl, b.vigenciaDias, b.estadoRevision], `${o.slug}: colección, fecha y estado`);
    // Las fichas con fuentes en conflicto salen enmascaradas en la vista; las demás, con sus avisos tal cual.
    if (o.estado_revision !== 'fuentes_en_conflicto') assert.deepEqual(o.avisos, b.avisos, `${o.slug}: avisos publicados = base local`);
  }
  const fuenteRadarBase = new Map(radarBase.fuentes.map(f => [f.id, { id: f.id, tipo: f.tipo, titulo: f.titulo, url: f.url, primaria: true, consultadaEl: f.consultadaEl }]));
  const ordenar = v => JSON.parse(JSON.stringify(v), (k, x) => k === 'publicadaEl' ? undefined
    : k === 'fuentes' && Array.isArray(x) ? [...x].map(f => fuenteRadarBase.get(f.id) || f).sort((a, b) => (a.id < b.id ? -1 : 1)) : x);
  for (const p of pubP) assert.deepEqual(ordenar(p.verificacion_local),
    ordenar(escaparateBase.plataformas.find(x => x.slug === p.slug).verificacionLocal), `${p.slug}: verificación publicada = base local`);
  assert.deepEqual(pubT.filter(p => p.estado === 'en_radar').map(p => p.slug).sort(), escaparateBase.plataformas.map(p => p.slug).sort(),
    `public.plataformas en el radar = las ${D.plataformas} del lote`);
  assert.equal(pubT.filter(p => p.estado === 'descartada').length, D.lecturaPublica.descartadas, 'descartadas en public.plataformas');
  assert.deepEqual(manifiestoBase, { version_esquema: 2, plataformas_esperadas: D.plataformas, ofertas_esperadas: nOfertas, colecciones_esperadas: COLECCIONES },
    'el motor no monta altas ni retiradas: mismas cantidades que la publicada');
  const publicadoTarjeta = slug => Object.fromEntries(pubO.find(o => o.slug === slug).documentacion.referencias
    .filter(r => CANONICA.test(r.etiqueta)).map(r => [r.etiqueta, r.valor]));

  // ------------------------------------------------------------ 1 · radar
  const contrasteRuta = path.join(DIR, `radar-contraste-${FECHA}.json`), cambiosRadarRuta = path.join(DIR, 'cambios-radar.json');
  const contraste = leer(contrasteRuta), cambiosRadar = leer(cambiosRadarRuta);
  const radar = structuredClone(radarBase);
  assert.equal(radar.fuentes.length, D.radar.fuentes, 'número de fuentes del radar');
  assert.ok(contraste.fecha === FECHA && contraste.fuentes === radar.fuentes.length && contraste.correctas === radar.fuentes.length &&
    Array.isArray(contraste.bloqueos) && !contraste.bloqueos.length, 'el radar no está comprobado hoy al completo: no se monta el lote');
  assert.equal(cambiosRadar.fecha, FECHA, 'cambios-radar.json: fecha inesperada');
  assert.ok(cambiosRadar.nota.startsWith(`Cambios del radar comprobados a mano el ${FES}.`), 'cambios-radar.json: nota de hoy');
  // Cambios de dirección o de título de una fuente: { antes: { url, titulo }, url, titulo, motivo }.
  const cambiosFuentes = cambiosRadar.fuentes || {}, cambiosPlataformas = cambiosRadar.plataformas || {};
  for (const [id, c] of Object.entries(cambiosFuentes)) {
    const f = radar.fuentes.find(x => x.id === id);
    assert.ok(f, `cambios-radar.json: fuente desconocida ${id}`);
    assert.deepEqual([f.url, f.titulo], [c.antes.url, c.antes.titulo], `${id}: «antes» = lo publicado`);
    assert.ok(/^https:\/\/\S+$/.test(c.url) && c.titulo && c.motivo, `${id}: url https, título y motivo`);
    f.url = c.url; f.titulo = c.titulo;
  }
  assert.deepEqual(contraste.contraste.map(c => c.id), radar.fuentes.map(f => f.id), 'el contraste cubre todas las fuentes, en orden');
  assert.deepEqual(contraste.contraste.map(c => c.url), radar.fuentes.map(f => f.url), 'el contraste se hizo sobre las mismas direcciones');
  assert.ok(contraste.contraste.every(c => c.ok));
  const COMPROBACIONES = (opciones.comprobaciones || leer(path.join(raiz, 'rwadar-app/data/comprobaciones-fuentes.json'))).fuentes;
  for (const [id, c] of Object.entries(cambiosRadar.comprobacionesCambiadas || {}))
    assert.deepEqual(COMPROBACIONES[id], c.ahora, `${id}: comprobaciones-fuentes.json no tiene la comprobación nueva`);
  const cumple = (id, texto) => COMPROBACIONES[id].every(p => new RegExp(p, 'i').test(plano(texto)));
  assert.deepEqual(Object.keys(cambiosRadar.verificacionesManuales || {}), D.radar.manuales, 'lecturas a mano del radar');
  for (const [id, m] of Object.entries(cambiosRadar.verificacionesManuales || {})) {
    const c = contraste.contraste.find(x => x.id === id);
    assert.ok(c.ok && c.manual === m.motivo && c.urlLeida === m.url && c.metodo === m.metodo, `${id}: el contraste recoge la lectura a mano`);
    assert.deepEqual(c.literales, m.literales, `${id}: literales`);
    assert.ok(m.metodo.includes(`${FES} a las`), `${id}: lectura de hoy`);
    assert.ok(cumple(id, c.literales.join(' ')), `${id}: la lectura a mano dice lo que respalda`);
  }
  for (const c of contraste.contraste.filter(x => !x.manual))
    assert.ok(cumple(c.id, c.literales.join(' ')), `${c.id}: los literales de hoy no dicen lo que respalda`);
  for (const k of D.radar.copias || []) {
    const archivo = path.join(DIR, k.archivo);
    assert.equal(sha(archivo), k.sha256, `copia del radar ${k.archivo}`);
    const t = plano(fs.readFileSync(archivo, 'utf8'));
    for (const l of k.contiene || []) assert.ok(t.includes(l), `${k.archivo}: falta ${l}`);
  }
  for (const l of D.radar.literales || []) {
    const c = contraste.contraste.find(x => x.id === l.id);
    assert.ok(c, `radar: ${l.id} no está en el contraste`);
    for (const t of l.contiene || []) assert.ok(c.literales.some(x => x.includes(t)), `${l.id}: falta «${t}»`);
    for (const t of l.patron || []) assert.ok(c.literales.some(x => new RegExp(t).test(x)), `${l.id}: no casa /${t}/`);
  }
  for (const [slug, campos] of Object.entries(cambiosPlataformas)) {
    const p = radar.plataformas.find(x => x.slug === slug);
    assert.ok(p, `cambios-radar.json: plataforma desconocida ${slug}`);
    for (const [campo, c] of Object.entries(campos)) {
      assert.ok(['estadoOperativo', 'licenciaRegistro', 'acceso'].includes(campo), `${slug}.${campo}: el motor solo cambia estadoOperativo, licenciaRegistro o acceso`);
      assert.equal(p[campo].detalle, c.antes, `${slug}.${campo}: «antes» = lo publicado`);
      if (c.fuentesAntes) assert.deepEqual(p[campo].fuentes, c.fuentesAntes, `${slug}.${campo}: fuentes de antes`);
      assert.ok(c.detalle && c.motivo, `${slug}.${campo}: detalle y motivo`);
      p[campo] = { ...p[campo], detalle: c.detalle, ...(c.fuentes ? { fuentes: c.fuentes } : {}) };
    }
  }
  radar.verificadoEl = FECHA;
  radar.alcance = (D.textos && D.textos.alcanceRadar) || (`Revisión editorial de fuentes primarias del ${FES}: las ${radar.fuentes.length} fuentes del radar se volvieron a ` +
    `consultar sin sesión y siguen diciendo lo que respaldan${D.radar.alcanceNota ? ` (${D.radar.alcanceNota})` : ''}. No acredita onboarding, oferta abierta ni rentabilidad.`);
  assert.ok(radar.alcance.length >= 20 && radar.alcance.length <= 500, 'origen de la revisión: entre 20 y 500 caracteres');
  radar.fuentes = radar.fuentes.map(f => ({ ...f, consultadaEl: FECHA }));
  { // Nada más cambia en el radar: la fecha, el alcance, la consulta de cada fuente y lo declarado en cambios-radar.json.
    const r = structuredClone(radar);
    r.verificadoEl = radarBase.verificadoEl; r.alcance = radarBase.alcance;
    r.fuentes = r.fuentes.map((f, i) => ({ ...f, consultadaEl: radarBase.fuentes[i].consultadaEl,
      ...(cambiosFuentes[f.id] ? { url: cambiosFuentes[f.id].antes.url, titulo: cambiosFuentes[f.id].antes.titulo } : {}) }));
    for (const [slug, campos] of Object.entries(cambiosPlataformas)) {
      const p = r.plataformas.find(x => x.slug === slug), b = radarBase.plataformas.find(x => x.slug === slug);
      for (const campo of Object.keys(campos)) p[campo] = b[campo];
    }
    assert.deepEqual(r, radarBase, 'radar: solo la fecha, el alcance, la consulta de las fuentes y cambios-radar.json');
  }
  const fuentePorId = new Map(radar.fuentes.map(f => [f.id, f]));
  const conFuentes = campo => ({ ...campo, fuentes: campo.fuentes.map(id => {
    assert.ok(fuentePorId.has(id), `fuente inexistente: ${id}`);
    return fuentePorId.get(id);
  }) });

  // ------------------------------------------------------------ 2 · ofertas
  const CAMBIOS = [], PRUEBAS = [];
  const anota = (slug, campo, antes, despues) => CAMBIOS.push({ slug, campo, antes, despues });
  const ofertas = structuredClone(escaparateBase.ofertas);
  const documentos = structuredClone(docBase);
  const porSlug = new Map(ofertas.map(o => [o.slug, o]));
  const oferta = slug => { const o = porSlug.get(slug); assert.ok(o, `oferta desconocida: ${slug}`); return o; };
  const sinSlug = Object.keys(D.ofertas).filter(s => !porSlug.has(s));
  assert.deepEqual(sinSlug, [], 'decisiones.json: ofertas que no están publicadas (el motor no monta altas)');

  // Todas las fichas se revisaron hoy con sus fuentes primarias (un expediente por oferta).
  const expedientes = {};
  for (const o of ofertas) {
    const exp = expedientes[o.slug] = leer(path.join(DIR, 'expedientes', `${o.slug}.json`));
    assert.equal(exp.slug, o.slug); assert.equal(exp.tipoExpediente, 'publicada');
    assert.ok(['mantener', 'actualizar'].includes(exp.decision), `${o.slug}: decisión ${exp.decision}`);
    assert.ok(exp.consulta.inicioUtc.startsWith(FECHA), `${o.slug}: expediente de hoy`);
    assert.equal(exp.propuestaTarjeta.coleccion ?? o.coleccion, o.coleccion, `${o.slug}: misma colección`);
    assert.equal(o.avisos[0].texto, EDITORIAL, `${o.slug}: el primer aviso es el editorial común`);
    if (D.ofertas[o.slug]?.decision) assert.equal(exp.decision, D.ofertas[o.slug].decision, `${o.slug}: decisión del expediente`);
    o.verificadaEl = FECHA;
    o.vigenciaDias = D.vigenciaDias;
  }
  for (const slug of Object.keys(documentos)) documentos[slug].revisadaEl = FECHA;
  // Un expediente «publicada» por oferta y los de candidatas, todas «no_admitir» (el motor no monta altas).
  {
    const todos = fs.readdirSync(path.join(DIR, 'expedientes')).filter(n => n.endsWith('.json')).sort().map(n => leer(path.join(DIR, 'expedientes', n)));
    assert.deepEqual(todos.filter(e => e.tipoExpediente === 'publicada').map(e => e.slug).sort(), ofertas.map(o => o.slug).sort(), 'un expediente «publicada» por oferta');
    const candidatas = todos.filter(x => x.tipoExpediente !== 'publicada');
    for (const e of candidatas) {
      assert.equal(e.tipoExpediente, 'candidata', `${e.slug}: tipo de expediente`);
      assert.equal(e.decision, 'no_admitir', `${e.slug}: el motor no monta altas (candidata admitida: móntala a mano)`);
      assert.ok(!porSlug.has(e.slug), `${e.slug}: candidata con el slug de una publicada`);
    }
    assert.deepEqual(candidatas.map(e => e.slug).sort(), [...D.candidatas].sort(), 'las candidatas de decisiones.json = los expedientes de candidatas');
  }

  // Tres datos de la tarjeta (etiqueta fija): los publicados se conservan con consulta de hoy salvo los que cambian.
  const tarjetaAntes = {};
  for (const [slug, d] of Object.entries(documentos)) {
    tarjetaAntes[slug] = d.referencias.filter(r => CANONICA.test(r.etiqueta)).map(r => r.etiqueta);
    d.referencias = d.referencias.map(r => !CANONICA.test(r.etiqueta) ? r : { ...r, fechaConsulta: FECHA,
      alcance: `Comprobado de nuevo en la fuente el ${FES}. ${r.alcance.replace(PREFIJO, '')}`.trim() });
  }
  const tarjetaNuevas = {}, AVISOS_NUEVOS = new Set(), PERMITE_PREVIA = new WeakSet(), FUENTES_NUEVAS = new Set(D.fuentesNuevas || []);
  const FUENTES_DE_OFERTA = new Set();

  const conFuente = (slug, url) => {
    const d = documentos[slug]; assert.match(url, /^https:\/\/\S+$/);
    if (!d.fuentes.includes(url)) { d.fuentes.push(url); anota(slug, 'fuente de la ficha', null, url); }
  };
  const refIndice = (slug, etiqueta, valor) => unico(documentos[slug].referencias,
    r => r.etiqueta === etiqueta && (valor === undefined || r.valor === valor), `${slug}: referencia «${etiqueta}»${valor === undefined ? '' : ` = «${valor}»`}`);

  // Cada tipo de cambio, con su «antes» exigido tal cual.
  const APLICA = {
    rentabilidad(slug, c) {
      const o = oferta(slug);
      assert.deepEqual(o.rentabilidad, c.antes, `${slug}: rentabilidad «antes»`);
      assert.ok(c.despues && c.despues.mostrada && c.despues.literal, `${slug}: rentabilidad nueva con mostrada y literal`);
      assert.notDeepEqual(c.despues, c.antes, `${slug}: la rentabilidad no cambia`);
      anota(slug, 'rentabilidad', c.antes ? `${c.antes.mostrada} · ${c.antes.literal}` : null, `${c.despues.mostrada} · ${c.despues.literal}`);
      o.rentabilidad = { mostrada: c.despues.mostrada, literal: c.despues.literal };
    },
    metrica(slug, c) {
      const o = oferta(slug), i = unico(o.metricas, m => m.etiqueta === c.etiqueta, `${slug}: métrica «${c.etiqueta}»`);
      assert.equal(o.metricas[i].valor, c.antes, `${slug}: métrica «${c.etiqueta}» «antes»`);
      assert.deepEqual(Object.keys(c.despues), ['etiqueta', 'valor'], `${slug}: métrica nueva { etiqueta, valor }`);
      assert.notDeepEqual(o.metricas[i], c.despues, `${slug}: la métrica «${c.etiqueta}» no cambia`);
      anota(slug, 'métrica', `${c.etiqueta}: ${c.antes}`, `${c.despues.etiqueta}: ${c.despues.valor}`);
      o.metricas[i] = c.despues;
    },
    metricaNueva(slug, c) {
      const o = oferta(slug);
      const i = c.despuesDe == null ? o.metricas.length - 1 : unico(o.metricas, m => m.etiqueta === c.despuesDe, `${slug}: métrica «${c.despuesDe}»`);
      assert.deepEqual(Object.keys(c.despues), ['etiqueta', 'valor'], `${slug}: métrica nueva { etiqueta, valor }`);
      assert.ok(!o.metricas.some(m => m.etiqueta === c.despues.etiqueta), `${slug}: la métrica «${c.despues.etiqueta}» ya estaba`);
      o.metricas.splice(i + 1, 0, c.despues);
      anota(slug, 'métrica', null, `${c.despues.etiqueta}: ${c.despues.valor}`);
    },
    metricaQuita(slug, c) {
      const o = oferta(slug), i = unico(o.metricas, m => m.etiqueta === c.etiqueta, `${slug}: métrica «${c.etiqueta}»`);
      assert.equal(o.metricas[i].valor, c.antes, `${slug}: métrica «${c.etiqueta}» «antes»`);
      anota(slug, 'métrica', `${c.etiqueta}: ${c.antes}`, null);
      o.metricas.splice(i, 1);
    },
    aviso(slug, c) {
      const o = oferta(slug), i = unico(o.avisos, a => a.texto === c.antes, `${slug}: aviso «${c.antes}»`);
      assert.notEqual(c.despues, c.antes);
      anota(slug, 'aviso', c.antes, c.despues);
      o.avisos[i] = { ...o.avisos[i], texto: c.despues };
    },
    avisoNuevo(slug, c) {
      const o = oferta(slug);
      assert.ok(!o.avisos.some(a => a.texto === c.despues), `${slug}: el aviso nuevo ya estaba`);
      const i = c.antesDe == null ? o.avisos.length : unico(o.avisos, a => a.texto === c.antesDe, `${slug}: aviso «${c.antesDe}»`);
      o.avisos.splice(i, 0, { texto: c.despues, tono: 'warn', esAntiguedad: false, verificadaEl: FECHA });
      AVISOS_NUEVOS.add(`${slug}\n${c.despues}`);
      anota(slug, 'aviso', null, c.despues);
    },
    avisoQuita(slug, c) {
      const o = oferta(slug), i = unico(o.avisos, a => a.texto === c.antes, `${slug}: aviso «${c.antes}»`);
      assert.ok(i > 0 || c.antes !== EDITORIAL, `${slug}: el aviso editorial común no se quita`);
      anota(slug, 'aviso', c.antes, null);
      o.avisos.splice(i, 1);
    },
    referencia(slug, c) {
      const d = documentos[slug], i = refIndice(slug, c.etiqueta, c.antes), r = { ...d.referencias[i], ...c.despues };
      assert.ok(!CANONICA.test(c.etiqueta), `${slug}: «${c.etiqueta}» es un dato de tarjeta (usa el tipo «tarjeta»)`);
      assert.notDeepEqual(r, d.referencias[i], `${slug}: la referencia «${c.etiqueta}» no cambia`);
      anota(slug, 'referencia de la ficha', `${d.referencias[i].etiqueta}: ${d.referencias[i].valor}`, `${r.etiqueta}: ${r.valor}`);
      d.referencias[i] = r; conFuente(slug, r.fuente);
    },
    referenciaNueva(slug, c) {
      const d = documentos[slug], i = refIndice(slug, c.despuesDe);
      const r = { etiqueta: c.despues.etiqueta, valor: c.despues.valor, fechaDato: c.despues.fechaDato, fechaConsulta: FECHA, fuente: c.despues.fuente, alcance: c.despues.alcance };
      assert.ok(Object.values(r).every(x => typeof x === 'string' && x), `${slug}: referencia nueva con etiqueta, valor, fechaDato, fuente y alcance`);
      assert.ok(!d.referencias.some(x => x.etiqueta === r.etiqueta), `${slug}: la referencia «${r.etiqueta}» ya estaba`);
      d.referencias.splice(i + 1, 0, r);
      anota(slug, 'referencia de la ficha', null, `${r.etiqueta}: ${r.valor}`);
      conFuente(slug, r.fuente);
    },
    referenciaQuita(slug, c) {
      const d = documentos[slug], i = refIndice(slug, c.etiqueta, c.antes);
      anota(slug, 'referencia de la ficha', `${c.etiqueta}: ${c.antes}`, null);
      d.referencias.splice(i, 1);
    },
    tarjeta(slug, c) {
      assert.ok(CANONICA.test(c.etiqueta), `${slug}: «${c.etiqueta}» no es una etiqueta fija de la tarjeta`);
      const d = documentos[slug], i = d.referencias.findIndex(x => x.etiqueta === c.etiqueta);
      assert.ok(i >= 0, `${slug}: «${c.etiqueta}» no estaba publicado (el motor no añade datos de tarjeta)`);
      assert.equal(d.referencias.filter(x => x.etiqueta === c.etiqueta).length, 1);
      const previo = d.referencias[i];
      assert.equal(previo.valor, c.antes, `${slug}: «${c.etiqueta}» publicado`);
      assert.equal(publicadoTarjeta(slug)[c.etiqueta], c.antes, `${slug}: «${c.etiqueta}» = lo leído hoy como visitante`);
      assert.notEqual(c.despues, c.antes, `${slug}: «${c.etiqueta}» no cambia`);
      // fechaDato: la del dato (AAAA-MM-DD), null si no tiene, o la publicada si decisiones.json no la trae.
      const fechaDato = 'fechaDato' in c ? c.fechaDato : previo.fechaDato;
      assert.ok(fechaDato === null || /^\d{4}-\d{2}-\d{2}$/.test(fechaDato), `${slug}: «${c.etiqueta}»: fechaDato`);
      // La nota del alcance: la publicada (sin el prefijo de fecha), con «notaCambia» aplicado si lo hay, salvo que
      // decisiones.json traiga otra entera («nota»).
      assert.ok(!(c.nota && c.notaCambia), `${slug}: «nota» o «notaCambia», no las dos`);
      let nota = c.nota ?? previo.alcance.replace(PREFIJO, '');
      if (c.notaCambia) {
        assert.equal(nota.split(c.notaCambia.antes).length, 2, `${slug}: «${c.notaCambia.antes}» no está una sola vez en la nota publicada de «${c.etiqueta}»`);
        nota = nota.replace(c.notaCambia.antes, () => c.notaCambia.despues);
      }
      const r = { etiqueta: c.etiqueta, valor: c.despues, fechaDato, fechaConsulta: FECHA, fuente: c.fuente || previo.fuente,
        alcance: `Redacción en castellano del dato comprobado en la fuente el ${FES}. ${nota}`.trim() };
      anota(slug, 'tarjeta', `${c.etiqueta}: ${previo.valor}`, `${c.etiqueta}: ${c.despues}`);
      d.referencias[i] = r;
      conFuente(slug, r.fuente);
      (tarjetaNuevas[slug] ||= []).push(c.etiqueta);
    },
    // El resumen de la tarjeta. Si la descripción de la ficha empieza por él (así la genera la documentación), cambia igual.
    resumen(slug, c) {
      const o = oferta(slug), d = documentos[slug];
      assert.equal(o.resumen, c.antes, `${slug}: resumen «antes»`);
      assert.ok(typeof c.despues === 'string' && c.despues && c.despues !== c.antes, `${slug}: resumen nuevo`);
      anota(slug, 'resumen', c.antes, c.despues);
      o.resumen = c.despues;
      if (typeof d.descripcion === 'string' && d.descripcion.startsWith(c.antes + ' ')) d.descripcion = c.despues + d.descripcion.slice(c.antes.length);
    },
    descripcion(slug, c) {
      const d = documentos[slug];
      assert.equal(String(d.descripcion).split(c.antes).length, 2, `${slug}: «${c.antes}» no está una sola vez en la descripción`);
      assert.ok(typeof c.despues === 'string' && c.despues !== c.antes, `${slug}: descripción nueva`);
      anota(slug, 'descripción', c.antes, c.despues);
      d.descripcion = d.descripcion.replace(c.antes, () => c.despues);
    },
    caracteristica(slug, c) {
      const d = documentos[slug], i = unico(d.caracteristicas, x => x.etiqueta === c.etiqueta, `${slug}: característica «${c.etiqueta}»`);
      assert.equal(d.caracteristicas[i].valor, c.antes, `${slug}: característica «${c.etiqueta}» «antes»`);
      assert.ok(typeof c.despues === 'string' && c.despues !== c.antes, `${slug}: característica nueva`);
      anota(slug, 'característica', `${c.etiqueta}: ${c.antes}`, `${c.etiqueta}: ${c.despues}`);
      d.caracteristicas[i] = { ...d.caracteristicas[i], valor: c.despues };
    },
    fuentesOferta(slug, c) {
      const o = oferta(slug);
      assert.deepEqual(o.fuentesActuales, c.antes, `${slug}: fuentes de la oferta «antes»`);
      assert.ok(Array.isArray(c.despues) && c.despues.length && c.despues.every(u => /^https:\/\/\S+$/.test(u)), `${slug}: fuentes nuevas (https)`);
      anota(slug, 'fuentes de la oferta', c.antes.join(' · '), c.despues.join(' · '));
      o.fuentesActuales = [...c.despues];
      for (const u of c.despues.filter(u => !c.antes.includes(u))) FUENTES_DE_OFERTA.add(u);
    },
  };
  for (const [slug, o] of Object.entries(D.ofertas)) {
    for (const [n, c] of o.cambios.entries()) {
      const donde = `${slug} · cambio ${n + 1} (${c.tipo})`;
      PRUEBAS.push({ slug, cambio: n + 1, tipo: c.tipo, pruebas: resolverPrueba(c.prueba, { D, DIR, FECHA, expediente: expedientes[slug], donde }) });
      for (const k of c.calculos || []) {
        const r = comprobarCalculo(k, donde);
        assert.ok(JSON.stringify(c.despues).includes(r), `${donde}: el resultado del cálculo (${r}) no está en el texto nuevo`);
      }
      const n0 = CAMBIOS.length;
      APLICA[c.tipo](slug, c);
      // Un texto que lleva a propósito la fecha corta de la entrega anterior (p. ej. un hecho de ese día).
      if (c.permiteFechaPrevia) for (const x of CAMBIOS.slice(n0)) PERMITE_PREVIA.add(x);
    }
  }

  // Lo que propone el expediente de hoy (investigador y revisor) es lo que queda, salvo lo declarado en «difiere».
  const difiereUsado = [], faltan = [], sobran = [];
  for (const o of ofertas) {
    const exp = expedientes[o.slug].propuestaTarjeta, dif = D.ofertas[o.slug]?.difiere || {};
    const tarjeta = Object.fromEntries(documentos[o.slug].referencias.filter(r => CANONICA.test(r.etiqueta)).map(r => [r.etiqueta.replace(/ \(.*\)$/, ''), r.valor]));
    const comprobaciones = {
      resumen: () => exp.resumen === undefined || exp.resumen === o.resumen,
      metricas: () => exp.metricas === undefined || JSON.stringify(exp.metricas) === JSON.stringify(o.metricas),
      avisos: () => (exp.avisos || []).map(textoAviso).filter(t => t !== EDITORIAL).every(t => o.avisos.some(a => a.texto === t)),
      rentabilidad: () => exp.rentabilidad?.mostrada === undefined || exp.rentabilidad.mostrada === o.rentabilidad?.mostrada,
      'rentabilidad.literal': () => !exp.rentabilidad?.literal || exp.rentabilidad.literal === o.rentabilidad?.literal,
      'tarjeta.minimo': () => exp.resumenTarjeta?.minimo === undefined || exp.resumenTarjeta.minimo === tarjeta['Mínimo de inversión'],
      'tarjeta.accesoEspana': () => exp.resumenTarjeta?.accesoEspana === undefined || exp.resumenTarjeta.accesoEspana === tarjeta['Acceso desde España'],
      'tarjeta.salida': () => exp.resumenTarjeta?.salida === undefined || exp.resumenTarjeta.salida === (tarjeta.Salida ?? tarjeta.Reembolso),
    };
    let tarjetaDistinta = false;
    for (const [k, fn] of Object.entries(comprobaciones)) {
      const coincide = fn();
      // «difiere.tarjeta» vale para los tres datos de la tarjeta (mínimo, acceso desde España y salida).
      const motivo = dif[k] || (k.startsWith('tarjeta.') ? dif.tarjeta : undefined);
      if (k.startsWith('tarjeta.') && !coincide) tarjetaDistinta = true;
      if (motivo) { if (coincide && dif[k]) sobran.push(`${o.slug}.difiere.${k}`); else if (!coincide) difiereUsado.push({ slug: o.slug, campo: k, motivo }); }
      else if (!coincide) faltan.push(`${o.slug}.difiere.${k}`);
    }
    if (dif.tarjeta && !tarjetaDistinta) sobran.push(`${o.slug}.difiere.tarjeta`);
  }
  assert.deepEqual(sobran, [], '«difiere» declarado, pero coincide con el expediente de hoy (quítalo)');
  assert.deepEqual(faltan, [], 'difiere del expediente de hoy sin decirlo; si es a propósito, decláralo en decisiones.json (ofertas.<slug>.difiere.<campo>, con el motivo)');

  // Avisos: se vuelven a fechar hoy los comprobados hoy: el editorial común, los que el expediente propone tal cual y
  // los nuevos. Un aviso publicado que el expediente de hoy no recoge para el montaje.
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

  // ------------------------------------------------------------ comprobaciones de los textos
  // Tarjeta: castellano llano, sin citas en otro idioma, ≤ 120 caracteres en lo nuevo (máximo duro 160), sin
  // «por participación» en el mínimo (resumenOferta lo descarta).
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
      if (/^M[ií]nimo/.test(r.etiqueta)) assert.doesNotMatch(r.valor.normalize('NFD').replace(/[̀-ͯ]/g, ''), /por (?:token|participacion|accion)/i, `${slug}: el mínimo dice «por participación»`);
    }
  }
  assert.deepEqual(largasConservadas, [], 'quedan datos de tarjeta de más de 120 caracteres');
  for (const c of CAMBIOS) if (c.despues && ['aviso', 'resumen', 'métrica'].includes(c.campo))
    assert.ok(['', 'es'].includes(idiomaCita(c.despues)), `${c.slug}: «${c.despues}» en otro idioma`);
  // Fuentes técnicas (API, JSON o .js) y fuentes nuevas de las fichas: solo las que decisiones.json admite.
  const todas = lote => [...lote.e.flatMap(o => [o.url, ...o.fuentesActuales]), ...Object.values(lote.d).flatMap(d => [...d.fuentes, ...d.referencias.map(r => r.fuente)])];
  const antesApi = new Set(todas({ e: escaparateBase.ofertas, d: docBase }).filter(u => APIRX.test(u)));
  assert.deepEqual([...new Set(todas({ e: ofertas, d: documentos }).filter(u => APIRX.test(u) && !antesApi.has(u) && !FUENTES_NUEVAS.has(u)))], [],
    'fuente técnica nueva (API, JSON o .js) que decisiones.json no admite (fuentesNuevas)');
  assert.deepEqual([...FUENTES_DE_OFERTA].filter(u => !FUENTES_NUEVAS.has(u)), [], 'fuente nueva de una oferta que decisiones.json no admite (fuentesNuevas)');
  assert.deepEqual(CAMBIOS.filter(c => c.campo === 'fuente de la ficha' && !FUENTES_NUEVAS.has(c.despues)).map(c => `${c.slug}: ${c.despues}`), [],
    'fuente nueva en una ficha que decisiones.json no admite (fuentesNuevas)');
  assert.ok(!CSP.test(JSON.stringify(documentos)) && !CSP.test(JSON.stringify(ofertas)), 'texto que la compuerta CSP rechazaría');
  // Ningún aviso ni dato de tarjeta nuevo arrastra la fecha de la entrega anterior como si fuera de hoy.
  const previaCorta = new RegExp(`\\b${escRx(CORTA_PREVIA)}\\b`);
  for (const c of CAMBIOS) if (c.despues && ['aviso', 'tarjeta'].includes(c.campo) && !PERMITE_PREVIA.has(c))
    assert.doesNotMatch(c.despues, previaCorta, `${c.slug}: fecha vieja en «${c.despues}» (si es a propósito: permiteFechaPrevia)`);
  // Textos prohibidos del día (cifras rechazadas por el revisor, palabras que no se usan…).
  for (const p of D.prohibidos || []) {
    const rx = new RegExp(p.patron, p.flags || '');
    if (p.en === 'cambios') { for (const c of CAMBIOS) if (c.despues) assert.doesNotMatch(c.despues, rx, `${c.slug}: «${c.despues}» (${p.motivo || p.patron})`); }
    else assert.doesNotMatch(JSON.stringify([oferta(p.en), documentos[p.en]]), rx, `${p.en}: ${p.motivo || p.patron}`);
  }

  // ------------------------------------------------------------ nada más cambia
  {
    const dif = (a, b) => [...a.filter(x => !b.includes(x)), ...b.filter(x => !a.includes(x))];
    const CAMPOS = new Set(['verificadaEl', 'vigenciaDias', 'avisos', 'metricas', 'rentabilidad', 'resumen', 'fuentesActuales']);
    for (const o of ofertas) {
      const b = escaparateBase.ofertas.find(x => x.slug === o.slug), c = CAMBIOS.filter(x => x.slug === o.slug);
      for (const k of Object.keys(b)) if (!CAMPOS.has(k)) assert.deepEqual(o[k], b[k], `${o.slug}.${k} no debía cambiar`);
      assert.deepEqual(Object.keys(o), Object.keys(b));
      const de = campo => c.filter(x => x.campo === campo);
      if (de('fuentes de la oferta').length) assert.equal(o.fuentesActuales.join(' · '), de('fuentes de la oferta').at(-1).despues, `${o.slug}: fuentes de la oferta`);
      else assert.deepEqual(o.fuentesActuales, b.fuentesActuales, `${o.slug}: fuentes de la oferta sin cambios`);
      if (de('resumen').length) assert.equal(o.resumen, de('resumen').at(-1).despues, `${o.slug}: resumen`);
      else assert.equal(o.resumen, b.resumen, `${o.slug}: resumen sin cambios`);
      const av = dif(b.avisos.map(a => a.texto), o.avisos.map(a => a.texto)).sort();
      assert.deepEqual(av, c.filter(x => x.campo === 'aviso').flatMap(x => [x.antes, x.despues]).filter(Boolean).sort(), `${o.slug}: avisos`);
      assert.ok(o.avisos.every(a => a.verificadaEl === FECHA && a.tono === 'warn' && a.esAntiguedad === false), `${o.slug}: avisos con fecha de hoy`);
      assert.equal(o.avisos.length, b.avisos.length + c.filter(x => x.campo === 'aviso' && !x.antes).length - c.filter(x => x.campo === 'aviso' && !x.despues).length,
        `${o.slug}: número de avisos`);
      const me = dif(b.metricas.map(m => `${m.etiqueta}: ${m.valor}`), o.metricas.map(m => `${m.etiqueta}: ${m.valor}`)).sort();
      assert.deepEqual(me, c.filter(x => x.campo === 'métrica').flatMap(x => [x.antes, x.despues]).filter(Boolean).sort(), `${o.slug}: métricas`);
      const nuevasM = c.filter(x => x.campo === 'métrica' && !x.antes).map(x => x.despues), quitadasM = c.filter(x => x.campo === 'métrica' && !x.despues).map(x => x.antes);
      assert.deepEqual(o.metricas.filter(m => !nuevasM.includes(`${m.etiqueta}: ${m.valor}`)).map(m => m.etiqueta.replace(/\d{2}\/\d{2}\/\d{4}/, 'F')),
        b.metricas.filter(m => !quitadasM.includes(`${m.etiqueta}: ${m.valor}`)).map(m => m.etiqueta.replace(/\d{2}\/\d{2}\/\d{4}/, 'F')), `${o.slug}: orden de las métricas`);
      if (JSON.stringify(o.rentabilidad) !== JSON.stringify(b.rentabilidad)) assert.ok(c.some(x => x.campo === 'rentabilidad'));
      const d = documentos[o.slug], db = docBase[o.slug];
      for (const k of Object.keys(db)) if (!['revisadaEl', 'referencias', 'fuentes', 'descripcion', 'caracteristicas'].includes(k)) assert.deepEqual(d[k], db[k], `${o.slug}: documentación.${k}`);
      // Descripción: solo lo anotado (resumen al principio o un trozo con «descripcion»).
      {
        let x = db.descripcion;
        for (const k of c.filter(y => y.campo === 'resumen')) if (typeof x === 'string' && x.startsWith(k.antes + ' ')) x = k.despues + x.slice(k.antes.length);
        for (const k of c.filter(y => y.campo === 'descripción')) x = x.replace(k.antes, () => k.despues);
        assert.deepEqual(d.descripcion, x, `${o.slug}: documentación.descripcion`);
      }
      {
        const cc = c.filter(y => y.campo === 'característica'), cambiadas = new Map(cc.map(y => [y.despues.split(': ')[0], y.despues.slice(y.despues.indexOf(': ') + 2)]));
        assert.deepEqual(d.caracteristicas, db.caracteristicas === undefined ? undefined
          : db.caracteristicas.map(x => cambiadas.has(x.etiqueta) ? { ...x, valor: cambiadas.get(x.etiqueta) } : x), `${o.slug}: documentación.caracteristicas`);
      }
      assert.deepEqual(d.fuentes.filter(u => !c.some(x => x.campo === 'fuente de la ficha' && x.despues === u)), db.fuentes, `${o.slug}: documentación.fuentes`);
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
  // Las ofertas que decisiones.json da por «sin cambios»: solo las fechas.
  for (const slug of D.sinCambios || []) assert.deepEqual(CAMBIOS.filter(c => c.slug === slug), [], `${slug}: solo fechas`);

  // ------------------------------------------------------------ escaparate y manifiesto
  const colecciones = { principales: 0, secundario: 0, en_camino: 0 };
  for (const o of ofertas) colecciones[o.coleccion]++;
  assert.deepEqual(colecciones, COLECCIONES);
  assert.deepEqual(ofertas.map(o => o.slug), escaparateBase.ofertas.map(o => o.slug), 'las mismas ofertas, en el mismo orden');
  assert.deepEqual(ofertas.map(o => o.estadoRevision), escaparateBase.ofertas.map(o => o.estadoRevision), 'los estados de revisión no cambian');
  const T = D.textos || {};
  const escaparate = {
    versionEsquema: 2,
    fuente: {
      notaOrigen: T.notaOrigen || (`Revisión del ${FES} (${D.pedido}): las ${nOfertas} fichas revisadas con fuentes primarias, ` +
        'un expediente por oferta y revisión independiente por grupo; ninguna candidata admitida; sin altas ni retiradas. ' +
        `Parte de la publicada ${PREVIA.slice(0, 8)} (entrega ${DESDE}). Las cifras se publican solo donde se leyeron en la fuente oficial; ` +
        'en reventa y próximas, la tarjeta enseña mínimo, acceso desde España y salida en castellano, con fuente y fecha.'),
      actualizacionLocal: { verificadoEl: FECHA,
        archivo: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/contraste-${ETIQUETA}.json`, publicable: false,
        derechosImagenVerificados: false,
        nota: T.notaActualizacion || `Lote del ${FES} (entrega ${ETIQUETA}): ${nOfertas} fichas comprobadas (${colecciones.principales} principales, ${colecciones.secundario} de reventa y ${colecciones.en_camino} en camino) y ${radar.plataformas.length} plataformas.` },
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
  assert.doesNotMatch(escaparate.fuente.notaOrigen, /V[ií]ctor/, 'nota de origen sin nombres de personas');
  // Plataformas: iguales a la base salvo las fechas y lo declarado en cambios-radar.json.
  {
    const hojas = (v, ruta = '', out = new Map()) => { if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) hojas(x, `${ruta}/${k}`, out); else out.set(ruta, v); return out; };
    const a = hojas(escaparateBase.plataformas), b = hojas(escaparate.plataformas);
    const declaradas = new Set(Object.keys(cambiosPlataformas));
    if (!declaradas.size) assert.deepEqual([...a.keys()], [...b.keys()], 'misma forma');
    for (const k of new Set([...a.keys(), ...b.keys()])) {
      if (a.get(k) === b.get(k)) continue;
      if (/\/verificadoEl$/.test(k) || /\/fuentes\/\d+\/consultadaEl$/.test(k)) { assert.equal(b.get(k), FECHA); continue; }
      const m = k.match(/^\/(\d+)\/verificacionLocal\//);
      const slugP = m && escaparate.plataformas[Number(m[1])]?.slug;
      const fuenteId = (() => { const x = k.match(/^(.*\/fuentes\/\d+)\/(?:url|titulo)$/); if (!x) return null; return b.get(`${x[1]}/id`); })();
      if (fuenteId && cambiosFuentes[fuenteId]) continue;
      if (slugP && declaradas.has(slugP)) continue;
      assert.fail(`plataformas: cambio inesperado en ${k}`);
    }
  }
  const manifiesto = { ...manifiestoBase };
  assert.deepEqual(manifiesto, { version_esquema: 2, plataformas_esperadas: D.plataformas, ofertas_esperadas: nOfertas, colecciones_esperadas: colecciones });

  escribir(path.join(DIR_SALIDA, 'radar-canonico-26.json'), radar);
  escribir(path.join(DIR_SALIDA, 'escaparate-publicacion.json'), escaparate);
  escribir(path.join(DIR_SALIDA, 'documentacion-ofertas.json'), documentos);
  escribir(path.join(DIR_SALIDA, 'manifiesto-catalogo.json'), manifiesto);

  // ------------------------------------------------------------ SQL
  const nueva = construirSqlImportacion(cargarFuentesLocales(salida, { revision: ETIQUETA, versionEsquema: 2 }));
  assert.notEqual(nueva.revisionId, PREVIA, 'la revisión nueva tiene otra identidad');
  assert.equal(nueva.fecha, FECHA);
  const destino = path.join(salida, `rwadar-app/data/importaciones/catalogo-${ETIQUETA}-v2`);
  escribir(path.join(destino, 'catalogo.sql'), nueva.sql);
  const g = guarda({ PREVIA, HASH_PREVIA, NUEVA: nueva.revisionId, HASH_NUEVA: nueva.hash, FECHA, ULTIMO });
  const referencia = T.aprobadaReferencia || (`Entrega ${ETIQUETA}: radar (${radar.fuentes.length} fuentes) y ${ofertas.length} fichas comprobados el ${FES} con fuentes primarias, ` +
    `expediente por oferta y revisión independiente; mismas ${ofertas.length} ofertas (${colecciones.principales}/${colecciones.secundario}/${colecciones.en_camino}) y ` +
    `${escaparate.plataformas.length} plataformas. ${capital(D.pedido)} el ${FES}; ciclo autorizado por su orden.`);
  const a = aprobacion({ NUEVA: nueva.revisionId, plataformas: escaparate.plataformas.length, ofertas: ofertas.length, colecciones, referencia });
  const cabecera = `-- Entrega ${ETIQUETA} (preparada el ${FES}) sobre la revisión publicada ${DESDE} (${PREVIA}). Ciclo pedido y autorizado por el responsable del proyecto.\n` +
    `-- Radar y ${ofertas.length} fichas comprobados hoy; ${escaparate.plataformas.length} plataformas y ${ofertas.length} ofertas (${colecciones.principales}/${colecciones.secundario}/${colecciones.en_camino}). Solo escribe en rwadar_catalogo.\n` +
    `-- Generado por rwadar-app/data/verificaciones/${ETIQUETA}-v2/preparar-entrega.mjs; revisar antes de aplicar.\n`;
  const archivo = path.join(destino, 'aplicar-y-aprobar.sql');
  escribir(archivo, aplicarYAprobar({ cabecera, sqlCatalogo: nueva.sql, g, a }));
  assert.doesNotMatch(fs.readFileSync(archivo, 'utf8').split('\n').slice(0, 3).join('\n') + referencia, /V[ií]ctor/, 'cabecera y referencia de aprobación sin nombres de personas');
  const revision = { versionEsquema: 2, revisionId: nueva.revisionId, hash: nueva.hash,
    revisionAnterior: PREVIA, hashRevisionAnterior: HASH_PREVIA, revisionAnteriorComprobadaEnRemoto: true,
    lecturaPublica: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/lectura-publica/`, etiqueta: ETIQUETA, fechaRadar: FECHA,
    revisionDocumental: FECHA, plataformas: escaparate.plataformas.length, ofertas: ofertas.length, colecciones,
    vigenciaDias: D.vigenciaDias, venceTrasEl: ULTIMO, nuevasAltas: 0, retiradas: 0, tablasPublicas: [],
    estado: 'borrador', aplicadoEnRemoto: false, publicacionWeb: false };
  escribir(path.join(destino, 'revision.json'), revision);

  // ------------------------------------------------------------ contraste (lo que cambia)
  const tarjetas = Object.fromEntries(Object.entries(documentos).map(([slug, d]) => [slug,
    Object.fromEntries(d.referencias.filter(r => CANONICA.test(r.etiqueta)).map(r => [r.etiqueta, r.valor]))]));
  const K = D.contraste || {};
  escribir(path.join(DIR_SALIDA, `contraste-${ETIQUETA}.json`), { tipo: 'revision_integral', fecha: FECHA, etiqueta: ETIQUETA,
    revisionAnterior: PREVIA, revisionNueva: nueva.revisionId,
    decision: T.decision || `${capital(D.pedido)} el ${FES}${D.orden ? ` («${D.orden}»)` : ''}. Lo que entra: DECISIONES-COORDINADOR.md (lista cerrada).`,
    archivos: Object.fromEntries(['DECISIONES-COORDINADOR.md', `radar-contraste-${FECHA}.json`, 'cambios-radar.json'].map(n => [n, sha(path.join(DIR, n))])),
    radar: { fuentes: contraste.fuentes, correctas: contraste.correctas, verificacionesManuales: Object.keys(cambiosRadar.verificacionesManuales || {}),
      cambios: { fuentes: Object.fromEntries(Object.entries(cambiosFuentes).map(([id, c]) => [id, { antes: c.antes.url, despues: c.url }])),
        plataformas: Object.fromEntries(Object.entries(cambiosPlataformas).map(([s, c]) => [s, Object.keys(c)])) } },
    cifras: K.cifras || {}, condicionHora: K.condicionHora || {},
    vigencia: { verificadaEl: FECHA, vigenciaDias: D.vigenciaDias, ultimoDiaVigente: ULTIMO },
    cambios: CAMBIOS, tarjetaConservadasDeMasDe120: largasConservadas, tarjetas,
    noAplicadoTalCual: D.noAplicado.map(({ sigue, ...n }) => n),
    sinCambios: K.sinCambios || [],
    altas: [], retiradas: [], colecciones });
  return { D, C, etiqueta: ETIQUETA, revisionId: nueva.revisionId, hash: nueva.hash, previa: PREVIA, sha256: sha(archivo),
    plataformas: escaparate.plataformas.length, fuentesRadar: radar.fuentes.length, ofertas: ofertas.length, colecciones,
    cambios: CAMBIOS.length, noAplicado: D.noAplicado.length, pruebas: PRUEBAS, difiere: difiereUsado,
    salidas: [path.join(DIR_SALIDA, 'escaparate-publicacion.json'), path.join(DIR_SALIDA, 'documentacion-ofertas.json'),
      path.join(DIR_SALIDA, 'radar-canonico-26.json'), path.join(DIR_SALIDA, 'manifiesto-catalogo.json'),
      path.join(DIR_SALIDA, `contraste-${ETIQUETA}.json`), path.join(destino, 'aplicar-y-aprobar.sql'), path.join(destino, 'catalogo.sql'),
      path.join(destino, 'revision.json')] };
}

// Motor de la entrega · DESPUÉS DE APLICAR. Lo que cambia en el repositorio después de aplicar el SQL en Supabase y de
// sincronizar (`node rwadar-app/sincronizar.js`). Sin red: solo lee y escribe archivos del repositorio.
//   1. Comprueba que el catálogo sincronizado es la revisión nueva, con sus cantidades y verificado hoy. Si no, no toca
//      nada (la web nunca enseña una fecha que el catálogo en línea aún no tiene).
//   2. rwadar-editorial-source/ofertas/transparencia.json:
//      - revisión, lote, revisadoEl y verificadaEl de todas las ofertas, al día de hoy;
//      - consultadaEl de «supervisada» y «documentoEspana» a hoy SOLO donde el expediente de hoy volvió a consultar esa
//        misma fuente (la misma dirección en un registro, documento, afirmación o aviso del expediente que lleve la
//        fecha o la hora de hoy, o en sus cambios respecto de lo publicado); si no, se deja la fecha anterior y se dice;
//      - la fecha del título de los puntos fuertes («… (DD/MM/AAAA de la entrega anterior)») con la misma regla;
//      - los mínimos cortos de reventa (decisiones.json, transparencia.reventaDe), que salen del texto largo del catálogo
//        sincronizado: «Desde X € la participación en reventa (DD/MM)» → «Desde X € la participación (DD/MM)»;
//      - los mínimos cortos y los textos que decisiones.json da uno a uno (transparencia.minimosCortos y .textos), cada
//        uno con su «antes» exigido tal cual.
//      Nada más. El archivo se valida con transparencia.mjs (cargarTransparencia) antes de escribirlo.
//   Se puede repetir: si ya está hecho, no cambia nada.
// Es la generalización de rwadar-app/data/verificaciones/2026-11-12-v2/despues-de-aplicar.mjs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { RAIZ_REPO, require, leer, cargarDecisiones, contexto, consultasDeHoy, inicioCiclo, normalUrl, resolverPrueba, escRx } from './comun.mjs';

export async function despues(opciones = {}) {
  const raiz = path.resolve(opciones.raiz || RAIZ_REPO);
  const D = cargarDecisiones(opciones.decisiones || path.join(opciones.ciclo, 'decisiones.json'));
  const C = contexto(D, { raiz, ciclo: opciones.ciclo });
  const { DIR, ETIQUETA, FECHA, DESDE, DESDE_FECHA, FES, CORTA, FES_PREVIA, CORTA_PREVIA } = C;
  const log = opciones.silencio ? () => {} : console.log;
  const salida = path.resolve(opciones.salida || raiz);
  const { leerBloquesCatalogo } = require(path.join(raiz, 'rwadar-fichas.js'));
  const { cargarTransparencia, FUENTE } = await import(pathToFileURL(path.join(raiz, 'rwadar-editorial-source/ofertas/transparencia.mjs')).href);
  const revision = leer(path.join(salida, `rwadar-app/data/importaciones/catalogo-${ETIQUETA}-v2/revision.json`));
  const T = D.transparencia || {};

  // 1 · el catálogo sincronizado es el de la entrega
  const snap = opciones.web && typeof opciones.web === 'object' ? opciones.web
    : leerBloquesCatalogo(fs.readFileSync(opciones.web || path.join(raiz, 'rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8'));
  assert.deepEqual([...new Set([...snap.plataformas, ...snap.ofertas].map(x => x.revisionId))], [revision.revisionId],
    `el catálogo sincronizado no es la revisión ${revision.revisionId}: aplica antes el SQL y ejecuta node rwadar-app/sincronizar.js`);
  assert.equal(snap.plataformas.length, revision.plataformas);
  assert.equal(snap.ofertas.length, revision.ofertas);
  assert.ok(snap.ofertas.every(o => o.verificadaEl === FECHA), `las ofertas sincronizadas no están verificadas el ${CORTA}`);

  // 2 · transparencia.json
  const entrada = opciones.transparencia || FUENTE;
  // Con --salida, siempre dentro de la carpeta de salida (FUENTE es la ruta real del módulo: con enlaces simbólicos, otra).
  const destino = opciones.salida ? path.join(salida, 'rwadar-editorial-source/ofertas/transparencia.json') : entrada;
  const texto = fs.readFileSync(fs.existsSync(destino) && opciones.salida ? destino : entrada, 'utf8');
  const t = JSON.parse(texto), antes = JSON.parse(texto);
  assert.equal(JSON.stringify(t, null, 2) + '\n', texto, 'formato de transparencia.json inesperado');
  assert.deepEqual(Object.keys(t.ofertas).sort(), snap.ofertas.map(o => o.slug).sort(), `transparencia.json no tiene las ${snap.ofertas.length} ofertas`);
  // De partida: la de la entrega anterior o ya la de hoy (repetición).
  assert.ok((t.lote === DESDE && t.revisionCatalogo === revision.revisionAnterior && t.revisadoEl === DESDE_FECHA) ||
    (t.lote === ETIQUETA && t.revisionCatalogo === revision.revisionId && t.revisadoEl === FECHA), 'transparencia.json de partida inesperado');
  t.lote = ETIQUETA; t.revisionCatalogo = revision.revisionId; t.revisadoEl = FECHA;

  const expedientes = {};
  const consultas = slug => {
    if (!expedientes[slug]) {
      const e = leer(path.join(DIR, 'expedientes', `${slug}.json`));
      assert.equal(e.slug, slug); assert.equal(e.tipoExpediente, 'publicada');
      assert.ok(e.consulta.inicioUtc.startsWith(FECHA), `${slug}: expediente de hoy`);
      expedientes[slug] = { e, hoy: consultasDeHoy(e, FECHA, inicioCiclo(D)) };
    }
    return expedientes[slug];
  };
  const fechas = [], puntos = [];
  const tituloPrevio = new RegExp(`\\(${escRx(FES_PREVIA)}\\)$`);
  for (const [slug, o] of Object.entries(t.ofertas)) {
    assert.ok([DESDE_FECHA, FECHA].includes(o.verificadaEl), `${slug}: verificadaEl de partida`);
    o.verificadaEl = FECHA;
    const { hoy } = consultas(slug);
    for (const k of ['supervisada', 'documentoEspana']) {
      const donde = hoy.get(normalUrl(o[k].fuente.url));
      if (donde) o[k].consultadaEl = FECHA;
      fechas.push({ slug, comprobacion: k, url: o[k].fuente.url, consultadaEl: o[k].consultadaEl, expediente: donde || null });
    }
    // Puntos fuertes: la fecha de consulta del título, solo si el expediente de hoy volvió a consultar esa fuente. Las
    // fechas de un documento (p. ej. «KID … (01/09/2026)») no se tocan.
    for (const p of o.puntos) if (tituloPrevio.test(p.fuente.titulo)) {
      const donde = hoy.get(normalUrl(p.fuente.url));
      if (donde) p.fuente.titulo = p.fuente.titulo.replace(`(${FES_PREVIA})`, `(${FES})`);
      puntos.push({ slug, titulo: p.fuente.titulo, expediente: donde || null });
    }
  }

  // Mínimos cortos de reventa (máximo 40 caracteres): el precio del texto largo del catálogo sincronizado.
  const snapPor = new Map(snap.ofertas.map(o => [o.slug, o]));
  const tarjeta = (slug, etiqueta) => (snapPor.get(slug).documentacion?.referencias || []).find(r => r.etiqueta === etiqueta && r.fechaConsulta === FECHA)?.valor;
  const LARGO_RV = new RegExp(`^Desde ([\\d.,]+) € la participación en reventa \\(${escRx(CORTA)}\\)$`);
  const PARTIDA_RV = new RegExp(`^Desde [\\d.,]+ € la participación \\(${escRx(CORTA_PREVIA)}\\)$`);
  const reventa = snap.ofertas.filter(x => x.coleccion === 'secundario' && (T.reventaDe || []).includes(x.plataformaSlug)).map(o => o.slug);
  const CORTOS = new Set();
  for (const slug of reventa) {
    const largo = tarjeta(slug, 'Mínimo de inversión');
    const m = (largo || '').match(LARGO_RV);
    assert.ok(m, `${slug}: mínimo del catálogo inesperado («${largo}»)`);
    const hecho = `Desde ${m[1]} € la participación (${CORTA})`;
    assert.ok(PARTIDA_RV.test(antes.ofertas[slug].minimoCorto) || antes.ofertas[slug].minimoCorto === hecho, `${slug}: mínimo corto de partida («${antes.ofertas[slug].minimoCorto}»)`);
    assert.ok(hecho.length <= 40, `${slug}: el mínimo corto pasa de 40 caracteres`);
    t.ofertas[slug].minimoCorto = hecho; CORTOS.add(slug);
  }
  // Mínimos cortos uno a uno: la tarjeta del catálogo tiene que decir lo que decisiones.json espera (la misma fecha).
  for (const [slug, m] of Object.entries(T.minimosCortos || {})) {
    assert.ok(t.ofertas[slug], `transparencia.minimosCortos.${slug}: oferta desconocida`);
    assert.ok(!CORTOS.has(slug), `${slug}: ya sale de la regla de reventa`);
    assert.equal(tarjeta(slug, 'Mínimo de inversión'), m.tarjeta, `${slug}: mínimo del catálogo`);
    assert.ok([m.antes, m.despues].includes(antes.ofertas[slug].minimoCorto), `${slug}: mínimo corto de partida («${antes.ofertas[slug].minimoCorto}»)`);
    t.ofertas[slug].minimoCorto = m.despues; CORTOS.add(slug);
  }
  // Textos uno a uno (p. ej. la fecha de una consulta en un motivo), con su prueba de hoy.
  const valorEn = (o, ruta) => ruta.split('.').reduce((x, k) => x?.[k], o);
  const ponEn = (o, ruta, v) => { const k = ruta.split('.'); const padre = k.slice(0, -1).reduce((x, y) => x[y], o); padre[k.at(-1)] = v; };
  const TEXTOS = T.textos || [];
  for (const x of TEXTOS) {
    const actual = valorEn(t.ofertas[x.slug], x.campo);
    assert.equal(typeof actual, 'string', `${x.slug}.${x.campo}: no es un texto`);
    resolverPrueba(x.prueba, { D, DIR, FECHA, expediente: consultas(x.slug).e, donde: `transparencia · ${x.slug}.${x.campo}` });
    if (x.avisoCatalogo) assert.ok(snapPor.get(x.slug).avisos.some(a => a.texto === x.avisoCatalogo), `${x.slug}: el aviso del catálogo no dice «${x.avisoCatalogo}»`);
    assert.ok(actual.split(x.antes).length === 2 || actual.split(x.despues).length === 2, `${x.slug}.${x.campo}: de partida («${actual}»)`);
    ponEn(t.ofertas[x.slug], x.campo, actual.replace(x.antes, () => x.despues));
  }

  // Nada más cambia: ni otros motivos, ni fuentes, ni textos de los puntos, ni los demás mínimos o salidas cortas, ni la
  // fecha de alta.
  {
    const quita = (x, slug) => { const o = structuredClone(x);
      o.verificadaEl = 'F'; o.supervisada.consultadaEl = 'F'; o.documentoEspana.consultadaEl = 'F';
      const fechaTitulo = new RegExp(`\\((?:${escRx(FES_PREVIA)}|${escRx(FES)})\\)$`);
      o.puntos = o.puntos.map(p => ({ ...p, fuente: { ...p.fuente, titulo: p.fuente.titulo.replace(fechaTitulo, '(F)') } }));
      if (CORTOS.has(slug)) o.minimoCorto = 'F';
      for (const y of TEXTOS.filter(y => y.slug === slug)) ponEn(o, y.campo, valorEn(o, y.campo).replace(y.antes, '«T»').replace(y.despues, '«T»'));
      return o; };
    for (const slug of Object.keys(t.ofertas)) assert.deepEqual(quita(t.ofertas[slug], slug), quita(antes.ofertas[slug], slug), `${slug}: cambio fuera de la lista`);
    const resto = x => { const { lote, revisionCatalogo, revisadoEl, ofertas, ...r } = x; return r; };
    assert.deepEqual(resto(t), resto(antes), 'transparencia.json: cambio fuera de las ofertas');
    for (const f of fechas) assert.ok([DESDE_FECHA, FECHA].includes(f.consultadaEl) || !f.expediente, `${f.slug} · ${f.comprobacion}: fecha`);
  }
  // Valida con las reglas de la web y de la app (transparencia.mjs) antes de escribir.
  // Con el catálogo dado (opciones.web como objeto, ya comprobado arriba) se valida contra él; si no, contra el de la web.
  const valida = cargarTransparencia({ raiz, datos: t, catalogo: opciones.web && typeof opciones.web === 'object' ? snap : undefined });
  assert.deepEqual(valida.sinEntrada, []); assert.equal(valida.avisoRevision, '');
  for (const slug of reventa) {
    const corto = valida.ofertas[slug].minimoCorto, largo = tarjeta(slug, 'Mínimo de inversión');
    assert.equal(corto, `Desde ${largo.match(LARGO_RV)[1]} € la participación (${CORTA})`, `${slug}: mínimo corto de la tarjeta`);
    assert.ok(corto.length <= 40, `${slug}: el mínimo corto pasa de 40 caracteres`);
  }
  for (const [slug, o] of Object.entries(valida.ofertas)) {
    assert.ok(!/^Desde .* en reventa/.test(o.minimoCorto || '') || / la participación /.test(o.minimoCorto), `${slug}: mínimo de reventa sin «la participación»`);
    assert.equal(o.verificadaEl, FECHA);
    // Ningún mínimo corto que se toca hoy arrastra la fecha anterior si su ficha ya lleva la de hoy.
    if (CORTOS.has(slug)) assert.match(o.minimoCorto, new RegExp(`\\(?${escRx(CORTA)}\\)$`), `${slug}: mínimo corto con la fecha de la ficha`);
  }
  const nuevo = JSON.stringify(t, null, 2) + '\n';
  const cambios = [];
  if (nuevo !== texto || destino !== entrada) {
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, nuevo);
    if (nuevo !== texto) cambios.push(`transparencia.json: revisión, lote y verificadaEl al ${CORTA}; fecha del ${CORTA} donde el expediente de hoy volvió a consultar la misma fuente (comprobaciones y títulos de los puntos); ${CORTOS.size} mínimos cortos; ${TEXTOS.length} textos con fecha`);
  }
  log(cambios.length ? cambios.map(c => '· ' + c).join('\n') : 'Nada que cambiar: ya estaba hecho.');
  const viejas = fechas.filter(f => f.consultadaEl !== FECHA);
  log(`Comprobaciones de transparencia al ${CORTA}: ${fechas.length - viejas.length} de ${fechas.length}.` +
    (viejas.length ? ' Con su fecha anterior:\n' + viejas.map(f => `  · ${f.slug} · ${f.comprobacion}: ${f.consultadaEl} (la dirección ${f.url} no aparece entre las consultas de hoy del expediente)`).join('\n') : ''));
  const puntosViejos = puntos.filter(p => !p.expediente);
  log(`Títulos de puntos fuertes con fecha de consulta: ${puntos.length - puntosViejos.length} de ${puntos.length} pasan al ${CORTA}.` +
    (puntosViejos.length ? ' Se quedan:\n' + puntosViejos.map(p => `  · ${p.slug}: ${p.titulo}`).join('\n') : ''));
  log('Mínimos cortos: ' + [...CORTOS].map(s => `${s} «${valida.ofertas[s].minimoCorto}»`).join(', '));
  for (const x of TEXTOS) log(`${x.slug} · ${x.campo}: «${valorEn(valida.ofertas[x.slug], x.campo)}»`);
  log('Siguiente: node rwadar-editorial-source/ofertas/transparencia.mjs && node rwadar-editorial-source/plataformas/altas.mjs && node rwadar-fichas.js && npm test');
  return { cambios, destino, fechas, puntos, cortos: [...CORTOS] };
}

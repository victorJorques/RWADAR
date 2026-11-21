// Motor de la entrega del catálogo · utilidades comunes y lectura de decisiones.json.
//
// El motor sustituye a los guiones que el montador copiaba y adaptaba a mano cada día
// (preparar-entrega.mjs, comprobar-entrega.mjs y despues-de-aplicar.mjs). Lo que cambia un día
// está en <ciclo>/decisiones.json; las guardas son las mismas para todos los días.
// Formato de decisiones.json: FORMATO.md de esta carpeta.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const RAIZ_REPO = path.resolve(AQUI, '../../../..');
export const require = createRequire(import.meta.url);

export const EDITORIAL = 'Referencia editorial gratuita. El proveedor comprueba admisión, condiciones y riesgos; RWAdar no recibe dinero de inversiones.';
// Los tres datos de la tarjeta (normas del 03/11/2026): etiqueta fija con un paréntesis opcional.
export const CANONICA = /^(?:M[ií]nimo de inversi[oó]n|Acceso desde Espa[ñn]a|Salida|Reembolso)(?: \([^)]{1,60}\))?$/;
export const PREFIJO = /^(?:Comprobado de nuevo en la fuente el \d{2}\/\d{2}\/\d{4}(?: \([^)]*\))?\.|Redacción en castellano del dato comprobado en la fuente el \d{2}\/\d{2}\/\d{4}\.)\s*/;
// Fuentes técnicas (API, JSON o código): solo las que ya estaban publicadas o las que decisiones.json admite.
export const APIRX = /\/api\/|public-api\.|[?&]wt=json|\.json(?:$|\?)|\.js(?:$|\?)/;
export const CSP = /<style\b|\sstyle\s*=|\son[a-z]+\s*=|<script/i;

export const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
export const escribir = (p, v) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n');
};
export const shaTexto = t => crypto.createHash('sha256').update(t).digest('hex');
export const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export const plano = t => t.replace(/[\s  ]+/g, ' ');
export const textoAviso = a => typeof a === 'string' ? a : a.texto;
export const escRx = s => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
export const unico = (lista, fn, que) => {
  const i = lista.map((x, n) => fn(x) ? n : -1).filter(n => n >= 0);
  assert.equal(i.length, 1, `${que}: ${i.length ? 'más de uno' : 'no encontrado'}`);
  return i[0];
};

// AAAA-MM-DD → DD/MM/AAAA y DD/MM.
export const fechaLarga = f => f.slice(0, 10).split('-').reverse().join('/');
export const fechaCorta = f => fechaLarga(f).slice(0, 5);
export const masDias = (f, n) => new Date(Date.parse(`${f}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
export const capital = t => t.charAt(0).toUpperCase() + t.slice(1);

// Dirección comparable: sin «www.», sin «.aspx», sin mayúsculas ni escapes en la ruta y sin los parámetros de idioma o
// de pestaña (lang, vista). Es la regla de despues-de-aplicar.mjs desde el 10/11/2026.
export const normalUrl = u => {
  try {
    const x = new URL(u);
    const q = [...x.searchParams].filter(([k]) => !['lang', 'vista'].includes(k.toLowerCase())).map(([k, v]) => `${k.toLowerCase()}=${v}`).sort().join('&');
    return `${x.hostname.replace(/^www\./, '')}${decodeURIComponent(x.pathname).replace(/\.aspx$/i, '').replace(/\/$/, '').toLowerCase()}?${q}`;
  } catch { return null; }
};
const URLS = /https:\/\/[^\s"'«»<>,]+/g;

// Las direcciones que el expediente de hoy volvió a consultar: la misma dirección en un registro, documento,
// afirmación o aviso que lleve la fecha o la hora de hoy (o en sus cambios respecto de lo publicado).
// «inicio» (milisegundos, opcional): el comienzo del ciclo (la lectura pública). Una consulta con «consultadoUtc» de
// antes no es de hoy aunque lleve la fecha de hoy: es una hora copiada de otro día (13/11: las tres suizas).
export const inicioCiclo = D => Date.parse(String(D?.lecturaPublica?.hora || '').split(' – ')[0]);
export function consultasDeHoy(expediente, fecha, inicio = NaN) {
  const FES = fechaLarga(fecha), CORTA = fechaCorta(fecha);
  const deHoy = new RegExp(`${escRx(fecha)}|${escRx(FES)}|\\b${escRx(CORTA)}(?!\\/\\d)`);
  const hoy = x => deHoy.test(JSON.stringify(x));
  const copiada = x => Number.isFinite(inicio) && x && x.consultadoUtc != null && !(Date.parse(x.consultadoUtc) >= inicio);
  const m = new Map();
  const toma = (lista, campo, nombre, siempre = false) => (lista || []).forEach((x, i) => {
    if ((!siempre && !hoy(x)) || copiada(x)) return;
    const v = String(x?.[campo] || '');
    const urls = /^https:\/\/\S+$/.test(v) ? [v] : (v.match(URLS) || []).map(u => u.replace(/[).;:]+$/, ''));
    for (const u of urls) { const n = normalUrl(u); if (n && !m.has(n)) m.set(n, `${nombre}[${i}]`); }
  });
  const e = expediente;
  toma(e.registros, 'url', 'registros'); toma(e.documentos, 'url', 'documentos');
  toma(e.advertenciasReguladores, 'url', 'advertenciasReguladores'); toma(e.claims, 'fuentePrimaria', 'claims');
  toma(e.avisosConFecha, 'fuente', 'avisosConFecha'); toma(e.revisionAvisos, 'fuente', 'revisionAvisos');
  toma(e.cambiosRespectoPublicado, 'fuente', 'cambiosRespectoPublicado', true);
  return m;
}

// ------------------------------------------------------------------ decisiones.json
const ETIQUETA_RX = /^\d{4}-\d{2}-\d{2}(?:\.(?:[2-9]|[1-9]\d))?$/;
const FECHA_RX = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const TIPOS_CAMBIO = ['rentabilidad', 'metrica', 'metricaNueva', 'metricaQuita', 'aviso', 'avisoNuevo', 'avisoQuita', 'referencia',
  'referenciaNueva', 'referenciaQuita', 'tarjeta', 'tarjetaFecha', 'resumen', 'descripcion', 'caracteristica', 'fuentesOferta', 'fuenteQuita'];
export const DIFIERE = ['resumen', 'metricas', 'avisos', 'rentabilidad', 'rentabilidad.literal', 'tarjeta', 'tarjeta.minimo', 'tarjeta.accesoEspana', 'tarjeta.salida'];

// Plantillas: «{{NOMBRE}}» en cualquier texto de decisiones.json se sustituye por plantillas.NOMBRE (sin anidar).
function conPlantillas(v, plantillas, donde) {
  if (typeof v === 'string') return v.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, k) => {
    assert.ok(Object.hasOwn(plantillas, k), `${donde}: plantilla desconocida {{${k}}}`);
    return plantillas[k];
  });
  if (Array.isArray(v)) return v.map((x, i) => conPlantillas(x, plantillas, `${donde}[${i}]`));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, conPlantillas(x, plantillas, `${donde}.${k}`)]));
  return v;
}

export function cargarDecisiones(ruta) {
  const crudo = leer(ruta);
  assert.equal(crudo.formato, 1, 'decisiones.json: formato debe ser 1');
  const plantillas = crudo.plantillas || {};
  for (const [k, v] of Object.entries(plantillas)) {
    assert.match(k, /^[A-Z0-9_]+$/, `plantilla «${k}»: nombre en MAYÚSCULAS`);
    assert.ok(typeof v === 'string' && !/\{\{/.test(v), `plantilla «${k}»: texto sin otras plantillas`);
  }
  const D = conPlantillas(crudo, plantillas, 'decisiones');
  D.plantillas = plantillas;
  const falta = k => assert.ok(D[k] !== undefined && D[k] !== null, `decisiones.json: falta «${k}»`);
  for (const k of ['etiqueta', 'fecha', 'desde', 'previa', 'ultimoDia', 'vigenciaDias', 'colecciones', 'plataformas', 'cadena',
    'lecturaPublica', 'pedido', 'radar', 'candidatas', 'ofertas', 'noAplicado']) falta(k);
  const conocidas = new Set(['formato', 'etiqueta', 'fecha', 'desde', 'previa', 'ultimoDia', 'vigenciaDias', 'colecciones', 'plataformas', 'cadena',
    'pedido', 'orden', 'lecturaPublica', 'radar', 'candidatas', 'sinCambios', 'plantillas', 'pruebas', 'ofertas', 'prohibidos', 'fuentesNuevas',
    'noAplicado', 'contraste', 'textos', 'transparencia', 'comprobar']);
  for (const k of Object.keys(crudo)) assert.ok(conocidas.has(k), `decisiones.json: clave desconocida «${k}» (formato en FORMATO.md)`);
  assert.match(D.etiqueta, ETIQUETA_RX, 'etiqueta: AAAA-MM-DD o AAAA-MM-DD.N');
  assert.equal(D.etiqueta.slice(0, 10), D.fecha, 'la etiqueta empieza por la fecha');
  assert.match(D.fecha, FECHA_RX); assert.match(D.desde, ETIQUETA_RX); assert.match(D.ultimoDia, FECHA_RX);
  assert.ok(D.desde < D.etiqueta || D.desde.slice(0, 10) < D.fecha, 'desde: la entrega publicada es anterior');
  assert.ok(Number.isInteger(D.vigenciaDias) && D.vigenciaDias >= 1 && D.vigenciaDias <= 7, 'vigenciaDias: de 1 a 7');
  assert.equal(D.ultimoDia, masDias(D.fecha, D.vigenciaDias), `ultimoDia: la fecha más ${D.vigenciaDias} días`);
  assert.match(D.previa.revisionId, UUID_RX, 'previa.revisionId'); assert.match(D.previa.hash, /^[0-9a-f]{64}$/, 'previa.hash');
  assert.match(D.previa.ultimoDia, FECHA_RX, 'previa.ultimoDia');
  assert.deepEqual(Object.keys(D.colecciones), ['principales', 'secundario', 'en_camino'], 'colecciones: principales, secundario y en_camino');
  assert.ok(Array.isArray(D.cadena) && D.cadena.length >= 2 && D.cadena.at(-1) === D.desde, 'cadena: los lotes aplicados en producción, el último el de «desde»');
  assert.equal(new Set(D.cadena).size, D.cadena.length, 'cadena sin repetidos');
  // El pedido va a la cabecera del SQL y a la referencia de la aprobación: sin nombres de personas, con la fórmula de siempre.
  assert.ok(D.pedido === 'puesta al día pedida por el responsable del proyecto',
    'pedido: frase en minúscula que nombra al «responsable del proyecto» (p. ej. «puesta al día pedida por el responsable del proyecto»)');
  assert.ok(!D.orden || (typeof D.orden === 'string' && !/[«»]/.test(D.orden)), 'orden: la frase de la orden, sin comillas');
  assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z – \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(D.lecturaPublica.hora) && D.lecturaPublica.hora.startsWith(D.fecha),
    'lecturaPublica.hora: «AAAA-MM-DDThh:mm:ssZ – …» de hoy');
  assert.ok(Array.isArray(D.candidatas), 'candidatas: lista de slugs (todas no_admitir)');
  assert.ok(!D.sinCambios || (Array.isArray(D.sinCambios) && D.sinCambios.every(s => !(D.ofertas[s]?.cambios || []).length)),
    'sinCambios: slugs sin cambios en «ofertas»');
  assert.ok(Array.isArray(D.noAplicado), 'noAplicado: lista');
  for (const [i, n] of D.noAplicado.entries()) {
    assert.ok(n.slug && n.que && n.porque, `noAplicado[${i}]: slug, que y porque`);
    for (const [j, x] of (n.sigue || []).entries()) {
      const donde = `noAplicado[${i}].sigue[${j}]`;
      assert.ok(x.slug || /^[a-z0-9-]+$/.test(n.slug), `${donde}: falta el slug`);
      assert.ok((x.referencia && Array.isArray(x.valores)) || (x.campo && ('contiene' in x || 'es' in x)),
        `${donde}: { referencia, valores } o { campo, contiene | es }`);
    }
  }
  const T = D.transparencia || {};
  for (const k of Object.keys(T)) assert.ok(['reventaDe', 'minimosCortos', 'textos'].includes(k), `transparencia.${k}: clave desconocida`);
  for (const [slug, m] of Object.entries(T.minimosCortos || {}))
    assert.ok(m.tarjeta && m.antes && m.despues && m.despues.length <= 40, `transparencia.minimosCortos.${slug}: tarjeta, antes y despues (≤ 40 caracteres)`);
  for (const [i, x] of (T.textos || []).entries())
    assert.ok(x.slug && /^[a-zA-Z]+(?:\.[a-zA-Z]+)*$/.test(x.campo || '') && x.antes && x.despues && x.prueba, `transparencia.textos[${i}]: slug, campo, antes, despues y prueba`);
  const K = D.comprobar || {};
  for (const k of Object.keys(K)) assert.ok(['ausentes', 'fichasWeb'].includes(k), `comprobar.${k}: clave desconocida`);
  for (const [slug, o] of Object.entries(D.ofertas)) {
    assert.ok(Array.isArray(o.cambios), `ofertas.${slug}.cambios: lista`);
    for (const [i, c] of o.cambios.entries()) {
      assert.ok(TIPOS_CAMBIO.includes(c.tipo), `ofertas.${slug}.cambios[${i}]: tipo «${c.tipo}» desconocido (${TIPOS_CAMBIO.join(', ')})`);
      assert.ok(c.prueba, `ofertas.${slug}.cambios[${i}] (${c.tipo}): falta la prueba (fuente, literal y hora)`);
    }
    for (const [k, motivo] of Object.entries(o.difiere || {})) {
      assert.ok(DIFIERE.includes(k), `ofertas.${slug}.difiere.${k}: clave desconocida (${DIFIERE.join(', ')})`);
      assert.ok(typeof motivo === 'string' && motivo.length >= 10, `ofertas.${slug}.difiere.${k}: falta el motivo`);
    }
  }
  return D;
}

// Fechas y nombres que usan las tres fases.
export function contexto(D, { raiz = RAIZ_REPO, ciclo } = {}) {
  const ETIQUETA = D.etiqueta, FECHA = D.fecha, DESDE = D.desde, DESDE_FECHA = D.desde.slice(0, 10);
  const DIR = path.resolve(ciclo || path.join(raiz, 'rwadar-app/data/verificaciones', `${ETIQUETA}-v2`));
  assert.equal(path.basename(DIR), `${ETIQUETA}-v2`, `la carpeta del ciclo debe llamarse ${ETIQUETA}-v2`);
  return {
    raiz, DIR, ETIQUETA, FECHA, DESDE, DESDE_FECHA,
    FES: fechaLarga(FECHA), CORTA: fechaCorta(FECHA), FES_PREVIA: fechaLarga(DESDE_FECHA), CORTA_PREVIA: fechaCorta(DESDE_FECHA),
    ULTIMO: D.ultimoDia, CADUCA: masDias(D.ultimoDia, 1), PREVIA: D.previa.revisionId, HASH_PREVIA: D.previa.hash,
    ULTIMO_PREVIA: D.previa.ultimoDia, COLECCIONES: D.colecciones,
    OFERTAS: Object.values(D.colecciones).reduce((a, b) => a + b, 0), PLATAFORMAS: D.plataformas,
  };
}

// ------------------------------------------------------------------ pruebas de cada cambio
// Una prueba dice de dónde sale un cambio: fuente primaria, literal corto y hora de hoy. Tres formas (se pueden
// combinar en una lista, y todas tienen que pasar):
//   { "claim": "<campo>", "url"?: "…", "contiene"?: "…" }  afirmación del expediente de esa oferta, consultada hoy;
//   { "url", "hora", "literal", "copia": { "archivo", "sha256", "json"?: {ruta: valor}, "contiene"?: […] } }  copia guardada;
//   { "documento": "<archivo del ciclo>", "contiene": "…" }  lo que dice un documento del ciclo: el informe del revisor
//     independiente de ese grupo, DECISIONES-COORDINADOR.md o el informe de un revisor de la entrega («revisor» vale igual).
// Una cadena es el nombre de una prueba de «pruebas» (arriba del todo de decisiones.json).
const valorEn = (obj, ruta) => ruta.split('.').reduce((x, k) => (x == null ? undefined : x[k]), obj);
export function resolverPrueba(prueba, { D, DIR, FECHA, expediente, donde }) {
  const lista = (Array.isArray(prueba) ? prueba : [prueba]).map(p => {
    if (typeof p === 'string') { assert.ok(D.pruebas && D.pruebas[p], `${donde}: prueba «${p}» no definida en «pruebas»`); return D.pruebas[p]; }
    return p;
  }).flatMap(p => Array.isArray(p) ? p : [p]);
  assert.ok(lista.length, `${donde}: prueba vacía`);
  const resueltas = [];
  // Ninguna prueba de hoy puede ser de antes de empezar el ciclo (la lectura pública): sería una hora copiada de otro día
  // con la fecha de hoy (13/11: 79 «consultadoUtc» de las tres suizas con la hora del 12/11).
  const inicio = inicioCiclo(D);
  const despuesDelInicio = (hora, que) => assert.ok(!Number.isFinite(inicio) || Date.parse(hora) >= inicio,
    `${donde}: ${que} lleva la hora ${hora}, de antes de empezar el ciclo (lectura pública ${new Date(inicio).toISOString()}): hora copiada de otro día`);
  for (const p of lista) {
    if (p.claim) {
      assert.ok(expediente, `${donde}: prueba de expediente sin expediente`);
      const c = expediente.claims.filter(x => x.campo === p.claim && (!p.url || x.fuentePrimaria === p.url));
      assert.equal(c.length, 1, `${donde}: afirmación «${p.claim}»${p.url ? ` de ${p.url}` : ''} del expediente: ${c.length} encontradas`);
      assert.ok(String(c[0].consultadoUtc || '').startsWith(FECHA), `${donde}: la afirmación «${p.claim}» no se consultó hoy (${c[0].consultadoUtc})`);
      despuesDelInicio(c[0].consultadoUtc, `la afirmación «${p.claim}»`);
      assert.match(String(c[0].fuentePrimaria || ''), /https:\/\/\S+/, `${donde}: afirmación sin fuente primaria`);
      if (p.contiene) assert.ok(plano(`${c[0].literal || ''} ${c[0].dato || ''}`).includes(plano(p.contiene)), `${donde}: la afirmación «${p.claim}» no dice «${p.contiene}»`);
      resueltas.push({ url: c[0].fuentePrimaria, literal: c[0].literal || c[0].dato, hora: c[0].consultadoUtc, de: `expediente:${p.claim}` });
    } else if (p.documento || p.revisor) {
      // Un documento del ciclo (informe del revisor independiente, DECISIONES-COORDINADOR.md…) que dice esa frase.
      const nombre = p.documento || p.revisor, archivo = path.join(DIR, nombre);
      assert.ok(archivo.startsWith(DIR + path.sep) && fs.existsSync(archivo), `${donde}: no existe ${nombre}`);
      assert.ok(typeof p.contiene === 'string' && p.contiene.length >= 8, `${donde}: prueba de un documento sin frase`);
      assert.ok(plano(fs.readFileSync(archivo, 'utf8')).includes(plano(p.contiene)), `${donde}: ${nombre} no dice «${p.contiene}»`);
      resueltas.push({ url: null, literal: p.contiene, hora: null, de: `documento:${nombre}` });
    } else {
      assert.match(String(p.url || ''), /^https:\/\/\S+$/, `${donde}: prueba sin dirección https`);
      assert.ok(String(p.hora || '').startsWith(FECHA) && /T\d{2}:\d{2}(?::\d{2})?Z$/.test(p.hora), `${donde}: la hora de la prueba no es de hoy en UTC («${p.hora}»)`);
      despuesDelInicio(p.hora, 'la prueba');
      assert.ok(typeof p.literal === 'string' && p.literal.length >= 3 && p.literal.length <= 400, `${donde}: literal corto (3 a 400 caracteres)`);
      let viaCopia = false;
      if (p.copia) {
        const archivo = path.join(DIR, p.copia.archivo);
        assert.ok(archivo.startsWith(DIR + path.sep) && fs.existsSync(archivo), `${donde}: no existe la copia ${p.copia.archivo}`);
        assert.match(String(p.copia.sha256 || ''), /^[0-9a-f]{16,64}$/, `${donde}: la copia necesita su SHA-256 (16 a 64 caracteres)`);
        assert.ok(sha(archivo).startsWith(p.copia.sha256), `${donde}: la copia ${p.copia.archivo} no tiene el SHA-256 anotado`);
        const texto = fs.readFileSync(archivo, 'utf8');
        if (p.copia.json) {
          const j = JSON.parse(texto);
          for (const [ruta, valor] of Object.entries(p.copia.json)) assert.deepEqual(valorEn(j, ruta), valor, `${donde}: ${p.copia.archivo} → ${ruta}`);
        }
        for (const l of p.copia.contiene || []) assert.ok(plano(texto).includes(plano(l)), `${donde}: ${p.copia.archivo} no dice «${l}»`);
        if (!p.copia.json && !(p.copia.contiene || []).length) assert.ok(plano(texto).includes(plano(p.literal)), `${donde}: el literal no está en ${p.copia.archivo}`);
        viaCopia = true;
      }
      // Sin copia, la dirección tiene que estar entre las consultas de hoy del expediente de esa oferta.
      if (!viaCopia) {
        assert.ok(expediente, `${donde}: prueba sin copia ni expediente`);
        assert.ok(consultasDeHoy(expediente, FECHA, inicio).has(normalUrl(p.url)), `${donde}: ${p.url} no está entre las consultas de hoy del expediente; guarda una copia (copia.archivo y su SHA-256)`);
      }
      resueltas.push({ url: p.url, literal: p.literal, hora: p.hora, de: viaCopia ? `copia:${p.copia.archivo}` : 'expediente' });
    }
  }
  return resueltas;
}

// ------------------------------------------------------------------ cálculos que se pueden comprobar
// Cifras que calcula RWAdar: el motor las rehace y exige el resultado anotado.
const coma = (x, d = 2) => x.toFixed(d).replace('.', ',');
const num = s => Number(String(s).replace(/\./g, '').replace(',', '.'));
export function comprobarCalculo(c, donde) {
  if (c.tipo === 'anualSimple') {
    // (hasta / desde − 1) × 365 / días, en %, con 2 decimales. Días a partir de las marcas de tiempo (segundos).
    const dias = (c.hasta.ts - c.desde.ts) / 86400;
    const r = coma((c.hasta.valor / c.desde.valor - 1) * 365 / dias * 100);
    assert.equal(r, c.resultado, `${donde}: rentabilidad anual simple ${r} y no ${c.resultado}`);
    if (c.dias) assert.equal(dias.toFixed(2), c.dias, `${donde}: días`);
    return r;
  }
  if (c.tipo === 'comision') {
    // Precio por participación más una comisión, redondeado al céntimo con 0,005 hacia arriba (en enteros).
    const centimos = Math.round(num(c.precio) * 100), milesimas = Math.round(num(c.porcentaje) * 10);
    const r = coma(Math.floor((centimos * (1000 + milesimas) + 500) / 1000) / 100);
    assert.equal(r, c.resultado, `${donde}: ${c.precio} más el ${c.porcentaje} % da ${r} y no ${c.resultado}`);
    return r;
  }
  assert.fail(`${donde}: cálculo «${c.tipo}» desconocido (anualSimple, comision)`);
}

#!/usr/bin/env node
// vigia.mjs · RWAdar · vigía determinista de fuentes (sin agentes)
//
// En 2–4 minutos lee las fuentes que más cambian y las compara con la entrega
// PUBLICADA, para que el investigador del ciclo no tenga que releer a mano lo
// que no ha cambiado:
//   - Spiko: rendimientos y valor liquidativo (API pública, sin cuenta).
//   - Midas · mTBILL: oráculo en cadena (eth_call de solo lectura, nodo público).
//   - Brickwise: libro de órdenes de la API pública (venta más barata, cantidad,
//     participaciones en venta, orden de menor importe y mejor compra).
//   - Suizas (Aktionariat, Boss Info, Switzerlend): precio del emisor en cadena,
//     libro de órdenes, última operación y ajustes públicos del portal.
//   - Documentos: SHA-256 de cada PDF citado en documentacion-ofertas.json de la
//     entrega publicada, frente a la huella que dejó el ciclo que la publicó.
//   - CNMV: las búsquedas de advertencias que hizo el ciclo publicado, con una
//     búsqueda de control que debe dar resultados.
//
// Uso:
//   node .claude/skills/investigacion-catalogo/vigia.mjs --ciclo <carpeta del ciclo de hoy> --base <carpeta de la entrega publicada>
//     [--solo spiko,midas,brickwise,suiza,documentos,cnmv]
//     [--grabadas <carpeta>]   reproduce sin red una pasada grabada (su vigia-crudo/)
//     [--sin-crudo]            no guarda las respuestas en bruto
//     [--ahora <ISO>]          fija la hora de generación (solo para pruebas)
// Escribe <ciclo>/vigia.json y, en <ciclo>/vigia-crudo/, cada respuesta en bruto
// con su SHA-256 (fuera de Git: la API de Brickwise trae carteras de particulares).
//
// Reglas que este guion respeta (no las cambies):
//   - Petición normal: agente por defecto de Node, sin cookies, sin sesión, sin
//     token, sin cabeceras de navegador. TLS verificado (el del sistema y el proxy
//     de salida del entorno). Sin VPN ni proxy de país.
//   - Solo GET a páginas y API públicas; POST solo para JSON-RPC de solo lectura
//     (eth_call) y para el libro de órdenes que la página pública de los portales
//     suizos pide sin sesión.
//   - Un 403, un desafío anti-bots o un error se anotan como «no se pudo leer» y
//     NO se reintentan (solo se repite una vez un corte de conexión sin respuesta).
//   - Un mismo servidor recibe las peticiones de una en una.
//   - vigia.json solo lleva cifras agregadas, URL, horas y huellas: ni carteras,
//     ni identificadores de órdenes, ni nombres de personas.
//   - El vigía DETECTA; no publica ni decide. Lo que «cambia» lo confirma el
//     investigador con la fuente y lo reabre el revisor independiente.
// Sin dependencias. Node >= 22.21.

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ESTADOS = Object.freeze({ CAMBIA: 'cambia', IGUAL: 'no cambia', ILEGIBLE: 'no se pudo leer' });
const { CAMBIA, IGUAL, ILEGIBLE } = ESTADOS;
export const GRUPOS = ['spiko', 'midas', 'brickwise', 'suiza', 'documentos', 'cnmv'];

const SPIKO_API = 'https://public-api.spiko.io/v0/';
// Clase de la API y campo del rendimiento que publica la tarjeta (el mismo que leyeron los expedientes).
export const SPIKO = {
  'spiko-letras-del-tesoro-euro': { clase: 'EUTBL', campo: 'monthlyYield' },
  'spiko-letras-del-tesoro-dolar': { clase: 'USTBL', campo: 'monthlyYield' },
  'spiko-smart-cash-euro': { clase: 'eurSAFO', campo: 'dailyYield' },
};
export const RPC = 'https://ethereum-rpc.publicnode.com';
export const ORACULO_MTBILL = '0x056339c044055819e8db84e71f5f2e1f536b2e5b';
export const BW_V1 = 'https://api.app.brickwise.at/api/v1/assets';
export const BW_V2 = 'https://api.app.brickwise.at/api/v2/assets';
export const ZCHF = '0xb58e61c3098d85632df34eecfb899a1ed80921cb';
// Portales suizos con tecnología de Aktionariat: id de la empresa en su API pública y contrato del emisor (Brokerbot).
export const SUIZA = {
  aktionariat: { portal: 'https://shares.aktionariat.com', empresa: 77, ticker: 'DAKS', bot: '0x2f2c3cf0b2d6f4f6cd5f57665ae629eee813350b' },
  'boss-info': { portal: 'https://shares.bossinfo.com', empresa: 1664, ticker: 'BOSS', bot: '0x3e73d3fc22a8637b2c16790aa2c0e2d552d44e69' },
  switzerlend: { portal: 'https://shares.lend.ch', empresa: 40880, ticker: 'LENDS', bot: '0x8d90319fe817fe9e23973fcab9f1ff0f1e0d9b65' },
};
export const CNMV_CONTROL = 'https://www.cnmv.es/portal/ResultadoBusqueda?tipo=1&nombre=Trading';
// La web de la CNMV da error 500 con «accept-language: *» (lo que manda fetch): se pide un idioma, no se imita a nadie.
const CNMV_CABECERAS = { 'accept-language': 'es' };
export const SEL = {
  latestRoundData: '0xfeaf968c', getRoundData: '0x9a6fc8f5', getPrice: '0x98d5fdca', balanceOf: '0x70a08231', settings: '0xe06174e4',
};
// Brokerbot de Aktionariat: settings() es un campo de bits; 0x2 (SELLING_ENABLED) = el emisor recompra.
// La API del portal (onlyBuySide) no sirve: en Boss Info y LEND dice false con la recompra apagada en cadena.
export const BROKERBOT_RECOMPRA = 0x2n;
const TIEMPO_MAX_MS = 30_000;
const BYTES_MAX = 80 << 20;

// ---------------------------------------------------------------- utilidades
export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
export const horaIso = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, 'Z');
export const isoAEs = (iso) => String(iso).slice(0, 10).split('-').reverse().join('/');
/** Número escrito en castellano («1.234,56», «0,03») a Number. */
export const num = (s) => (s == null ? null : Number(String(s).trim().replace(/\./g, '').replace(',', '.')));
export const es = (n, dec = 2) => Number(n).toFixed(dec).replace('.', ',');
export const centimos = (n) => Math.round(Number(n) * 100);
/** Importe con el 1,5 % del comprador, al céntimo con la mitad hacia arriba, en céntimos enteros (como preparar-entrega). */
export const con15 = (euros) => es(Math.floor((centimos(euros) * 1015 + 500) / 1000) / 100);
export const pct = (fraccion) => `${es(Number(fraccion) * 100)} %`;
const fechaDe = (t) => (String(t || '').match(/(\d{2}\/\d{2}\/\d{4})/) || [])[1] || null;
const plural = (n, uno, varios) => (n === 1 ? uno : varios);
const leerJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

// ---------------------------------------------------------------- lo publicado
/** Lee la entrega publicada (escaparate, documentación, expedientes e inventarios del ciclo que la publicó). */
export function leerBase(base) {
  const escaparate = leerJson(path.join(base, 'escaparate-publicacion.json'));
  const documentacion = leerJson(path.join(base, 'documentacion-ofertas.json'));
  const ofertas = new Map(escaparate.ofertas.map((o) => [o.slug, o]));
  const expedientes = new Map();
  const dirExp = path.join(base, 'expedientes');
  if (fs.existsSync(dirExp)) for (const f of fs.readdirSync(dirExp).filter((x) => x.endsWith('.json'))) {
    try { const x = leerJson(path.join(dirExp, f)); if (x.slug) expedientes.set(x.slug, x); } catch { /* expediente ilegible: sin huellas */ }
  }
  // Huella publicada de cada documento: la del expediente (registro cuidado) y, si no, la copia del documento en un
  // inventario del ciclo (no los .txt que se extrajeron de él). Si hay varias, la consulta más reciente.
  const huellas = new Map();
  const anotar = (url, sha, origen, consultadoUtc) => {
    if (!url || !/^[0-9a-f]{64}$/.test(sha || '')) return;
    const prev = huellas.get(url);
    const rango = origen === 'expediente' ? 1 : 0;
    if (!prev || rango > prev.rango || (rango === prev.rango && String(consultadoUtc || '') > String(prev.consultadoUtc || '')))
      huellas.set(url, { sha256: sha, origen, consultadoUtc: consultadoUtc || null, rango });
  };
  for (const x of expedientes.values()) for (const d of x.documentos || []) anotar(d.url, d.sha256, 'expediente', d.consultadoUtc);
  const dirGrupos = path.join(base, 'grupos');
  if (fs.existsSync(dirGrupos)) for (const g of fs.readdirSync(dirGrupos)) {
    const f = path.join(dirGrupos, g, 'inventario-consultas.json');
    if (!fs.existsSync(f)) continue;
    let inv; try { inv = leerJson(f); } catch { continue; }
    for (const c of (Array.isArray(inv) ? inv : inv.consultas) || []) {
      if (!c || typeof c !== 'object' || c.http !== 200) continue;
      if (/\.(txt|md)$/i.test(c.archivo || '') || /texto extra[ií]do/i.test(c.nota || '')) continue;
      anotar(c.url, c.sha256, `inventario ${g}`, c.consultadoUtc);
    }
  }
  // Búsquedas de advertencias de la CNMV que hizo el ciclo publicado, ficha a ficha.
  const cnmv = new Map();
  for (const [slug, x] of expedientes) {
    if (!ofertas.has(slug)) continue;
    const l = [];
    for (const a of x.advertenciasReguladores || []) {
      if (!/CNMV/.test(a.regulador || '') || !/ResultadoBusqueda\?tipo=1&nombre=/i.test(a.url || '')) continue;
      const nombre = String(a.busqueda || '').replace(/\s*\(.*$/, '').trim();
      const sin = /^sin coincidencias|No hay datos disponibles/i.test(a.resultado || '');
      l.push({ nombre, url: a.url, conResultados: !sin, publicada: a.resultado || null, consultadoUtc: a.consultadoUtc || null });
    }
    if (l.length) cnmv.set(slug, l);
  }
  return { escaparate, documentacion, ofertas, expedientes, huellas, cnmv };
}

const referencia = (doc, re) => (doc?.referencias || []).find((r) => re.test(r.etiqueta));
const metrica = (o, re) => (o?.metricas || []).find((m) => re.test(m.etiqueta));
const aviso = (o, re) => (o?.avisos || []).map((a) => a.texto).find((t) => re.test(t));
export const esDocumento = (url) => { const p = String(url).replace(/[?#].*$/, '').toLowerCase(); return p.endsWith('.pdf') || p.includes('/document/download/'); };

// Textos publicados del libro de órdenes de Brickwise (mismo formato que preparar-entrega.mjs).
export function leerVentaPublicada(v) {
  const m = String(v || '').match(/^([\d.,]+) € por participación \((\d+) a ese precio, (?:orden del (\d{2}\/\d{2}\/\d{4})|en (\d+) órdenes(?: de [\d, ]+)?)\)$/);
  return m ? { precio: num(m[1]), cantidad: Number(m[2]), ordenes: m[4] ? Number(m[4]) : 1, fecha: m[3] || null } : null;
}
export function leerMenorPublicada(v) {
  const m = String(v || '').match(/^(\d+) participaci(?:ón|ones) a ([\d.,]+) € \(([\d.,]+) € con el 1,5 %\)$/);
  return m ? { cantidad: Number(m[1]), precio: num(m[2]), importe: num(m[3]) } : null;
}
export function leerCompraPublicada(v) {
  const m = String(v || '').match(/^([\d.,]+) € \((?:(\d+) participaci(?:ón|ones), orden del (\d{2}\/\d{2}\/\d{4})|(\d+) participaciones en (\d+) órdenes; la más antigua del (\d{2}\/\d{2}\/\d{4}))\)$/);
  if (!m) return null;
  return m[2] ? { precio: num(m[1]), cantidad: Number(m[2]), ordenes: 1, fecha: m[3] } : { precio: num(m[1]), cantidad: Number(m[4]), ordenes: Number(m[5]), fecha: m[6] };
}

/** Libro de órdenes de una emisión de Brickwise (respuesta v1), sin carteras ni identificadores. */
export function libroBrickwise(activo) {
  const abiertas = (activo?.offers || []).filter((o) => o.status === 'open');
  const porFecha = (a, b) => String(a.createdAt).localeCompare(String(b.createdAt));
  const ventas = abiertas.filter((o) => o.type === 'sell'), compras = abiertas.filter((o) => o.type === 'buy');
  const libro = { ventasAbiertas: ventas.length, comprasAbiertas: compras.length, participacionesEnVentaV1: ventas.reduce((s, o) => s + Number(o.amount), 0) };
  if (ventas.length) {
    const min = Math.min(...ventas.map((o) => Number(o.price)));
    const aPrecio = ventas.filter((o) => Number(o.price) === min).sort(porFecha);
    libro.venta = { precio: min, cantidad: aPrecio.reduce((s, o) => s + Number(o.amount), 0), ordenes: aPrecio.length,
      fecha: aPrecio.length === 1 ? isoAEs(aPrecio[0].createdAt) : null, cantidades: aPrecio.map((o) => Number(o.amount)),
      fechas: aPrecio.map((o) => isoAEs(o.createdAt)) };
    const menor = [...ventas].sort((a, b) => a.amount * a.price - b.amount * b.price || a.price - b.price || porFecha(a, b))[0];
    libro.menor = { cantidad: Number(menor.amount), precio: Number(menor.price), importe: num(con15(menor.amount * menor.price)) };
  }
  if (compras.length) {
    const max = Math.max(...compras.map((o) => Number(o.price)));
    const aPrecio = compras.filter((o) => Number(o.price) === max).sort(porFecha);
    libro.compra = { precio: max, cantidad: aPrecio.reduce((s, o) => s + Number(o.amount), 0), ordenes: aPrecio.length, fecha: isoAEs(aPrecio[0].createdAt) };
  }
  return libro;
}
export const textoVenta = (v) => `${es(v.precio)} € por participación (${v.cantidad} a ese precio, ${v.ordenes === 1 ? `orden del ${v.fecha}` : `en ${v.ordenes} órdenes de ${v.cantidades.join(', ')}`})`;
export const textoMenor = (m) => `${m.cantidad} ${plural(m.cantidad, 'participación', 'participaciones')} a ${es(m.precio)} € (${es(m.importe)} € con el 1,5 %)`;
export const textoCompra = (c) => c.ordenes === 1
  ? `${es(c.precio)} € (${c.cantidad} ${plural(c.cantidad, 'participación', 'participaciones')}, orden del ${c.fecha})`
  : `${es(c.precio)} € (${c.cantidad} participaciones en ${c.ordenes} órdenes; la más antigua del ${c.fecha})`;

// ---------------------------------------------------------------- red
/** Red real: fetch con el agente por defecto de Node, una petición a la vez por servidor y un solo reintento si no hubo respuesta. */
export function redEnVivo() {
  const colas = new Map();
  const unaVez = async ({ metodo, url, cuerpo, cabeceras }) => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), TIEMPO_MAX_MS);
    const inicio = Date.now();
    try {
      const r = await fetch(url, { method: metodo, headers: { ...cabeceras, ...(cuerpo != null ? { 'content-type': 'application/json' } : {}) },
        body: cuerpo ?? undefined, redirect: 'follow', signal: ctl.signal });
      const largo = Number(r.headers.get('content-length') || 0);
      if (largo > BYTES_MAX) { ctl.abort(); return { http: r.status, buf: Buffer.alloc(0), horaUtc: horaIso(inicio), error: `respuesta de ${largo} bytes: demasiado grande` }; }
      const buf = Buffer.from(await r.arrayBuffer());
      return { http: r.status, buf, horaUtc: horaIso(inicio), cf: r.headers.get('cf-mitigated') || '' };
    } catch (e) {
      return { http: 0, buf: Buffer.alloc(0), horaUtc: horaIso(inicio), error: e.cause?.code || e.name || String(e) };
    } finally { clearTimeout(t); }
  };
  return (pet) => {
    const host = new URL(pet.url).host;
    const previa = colas.get(host) || Promise.resolve();
    const esta = previa.then(async () => {
      let r = await unaVez(pet);
      // Solo un corte sin respuesta se repite, una vez. Un 403, un desafío o un 5xx se anotan y se sigue.
      if (r.http === 0 && !/demasiado grande/.test(r.error || '')) { await new Promise((ok) => setTimeout(ok, 1500)); r = await unaVez(pet); }
      return r;
    });
    colas.set(host, esta.catch(() => {}));
    return esta;
  };
}

const clave = (p) => `${p.metodo} ${p.url} ${p.cuerpo ?? ''}`;
/** Envuelve una red y guarda cada respuesta (cuerpo por su SHA-256 e índice) para poder reproducir la pasada sin red. */
export function conGrabacion(red, dir) {
  const indice = [];
  const pedir = async (pet) => {
    const r = await red(pet);
    const sha = r.buf?.length ? sha256(r.buf) : '';
    if (dir && sha) { fs.mkdirSync(dir, { recursive: true }); const f = path.join(dir, `${sha}.bin`); if (!fs.existsSync(f)) fs.writeFileSync(f, r.buf); }
    indice.push({ metodo: pet.metodo, url: pet.url, cuerpo: pet.cuerpo ?? null, http: r.http, horaUtc: r.horaUtc, sha256: sha, bytes: r.buf?.length || 0,
      ...(r.error ? { error: r.error } : {}), ...(r.cf ? { cf: r.cf } : {}) });
    return r;
  };
  pedir.guardarIndice = () => {
    if (!dir) return;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'indice.json'), JSON.stringify(indice, null, 1) + '\n');
    fs.writeFileSync(path.join(dir, 'SHA256SUMS.txt'), [...new Set(indice.filter((x) => x.sha256).map((x) => `${x.sha256}  ${x.sha256}.bin`))].join('\n') + '\n');
  };
  pedir.indice = indice;
  return pedir;
}

/** Reproduce una pasada grabada (carpeta con indice.json y <sha256>.bin), sin red. */
export function redGrabada(dir) {
  const indice = leerJson(path.join(dir, 'indice.json'));
  const mapa = new Map();
  for (const e of indice) { const k = clave(e); if (!mapa.has(k) || (mapa.get(k).http === 0 && e.http)) mapa.set(k, e); }
  return async (pet) => {
    const e = mapa.get(clave(pet));
    if (!e) return { http: 0, buf: Buffer.alloc(0), horaUtc: null, error: 'sin respuesta grabada' };
    const buf = e.sha256 ? fs.readFileSync(path.join(dir, `${e.sha256}.bin`)) : Buffer.alloc(0);
    if (e.sha256 && sha256(buf) !== e.sha256) throw new Error(`grabación alterada: ${e.sha256}.bin no tiene su huella`);
    return { http: e.http, buf, horaUtc: e.horaUtc, ...(e.error ? { error: e.error } : {}), ...(e.cf ? { cf: e.cf } : {}) };
  };
}

// ---------------------------------------------------------------- vigilancia
/**
 * Hace la pasada. red(pet) → { http, buf, horaUtc, error?, cf? }.
 * Devuelve el objeto que se escribe en vigia.json.
 */
export async function vigilar({ base, ciclo = null, red, ahora = () => Date.now(), solo = GRUPOS }) {
  const t0 = ahora();
  const pub = leerBase(base);
  const fuentes = [];
  const fichas = {};
  for (const o of pub.escaparate.ofertas) fichas[o.slug] = { plataforma: o.plataformaSlug, coleccion: o.coleccion, cifras: [], documentos: [], advertenciasCnmv: [] };
  const tiempos = {};

  const pedir = async (pet) => {
    const p = { metodo: 'GET', cuerpo: null, cabeceras: {}, ...pet };
    const r = await red(p);
    const sha = r.buf?.length ? sha256(r.buf) : null;
    const ok = r.http === 200 && !r.error && !r.cf;
    const motivo = ok ? null : r.error || (r.cf ? `HTTP ${r.http} con desafío anti-bots (no se elude)` : `HTTP ${r.http}`);
    fuentes.push({ metodo: p.metodo, url: p.url, ...(p.cuerpo != null && !p.url.startsWith(RPC) ? { cuerpo: p.cuerpo } : {}), http: r.http, horaUtc: r.horaUtc,
      sha256: sha, bytes: r.buf?.length || 0, ...(motivo ? { motivo } : {}) });
    return { ok, http: r.http, buf: r.buf || Buffer.alloc(0), horaUtc: r.horaUtc, sha256: sha, motivo, url: p.url };
  };
  const pedirJson = async (pet) => {
    const r = await pedir(pet);
    if (r.ok) { try { r.json = JSON.parse(r.buf.toString('utf8')); } catch { r.ok = false; r.motivo = 'la respuesta no es JSON'; } }
    return r;
  };
  // JSON-RPC de solo lectura: un lote por grupo; devuelve los resultados por id.
  const rpc = async (llamadas) => {
    const lote = llamadas.map((l) => ({ jsonrpc: '2.0', id: l.id, method: l.method || 'eth_call', params: l.params }));
    const r = await pedirJson({ metodo: 'POST', url: RPC, cuerpo: JSON.stringify(lote) });
    r.res = {};
    if (r.ok && Array.isArray(r.json)) for (const x of r.json) if (x && x.result && x.result !== '0x') r.res[x.id] = x.result;
    return r;
  };
  let bloqueP = null;
  const bloque = () => (bloqueP ||= rpc([{ id: 'bloque', method: 'eth_getBlockByNumber', params: ['latest', false] }]).then((r) => {
    const b = r.json?.find?.((x) => x.id === 'bloque')?.result;
    return b ? { tag: b.number, numero: Number(BigInt(b.number)), horaUtc: horaIso(Number(BigInt(b.timestamp)) * 1000), r } : { tag: 'latest', numero: null, horaUtc: null, r };
  }));
  const pal = (hex, i) => BigInt('0x' + (String(hex).slice(2).slice(i * 64, i * 64 + 64) || '0'));
  const llamada = (id, to, data, tag) => ({ id, params: [{ to, data }, tag] });

  const fuenteDe = (r) => ({ fuente: r.url, horaUtc: r.horaUtc, sha256: r.sha256 });
  const anotar = (slug, c) => { if (fichas[slug]) fichas[slug].cifras.push(c); };
  // estado: si la fuente no se leyó, «no se pudo leer»; si no hay cifra publicada con la que comparar, «cambia» (que se lea a mano).
  const cifra = (slug, campo, publicada, hoy, r, igual, nota) => anotar(slug, {
    campo, publicada: publicada ?? null, hoy: hoy ?? null, ...fuenteDe(r),
    estado: !r.ok || hoy == null ? ILEGIBLE : publicada == null ? CAMBIA : igual ? IGUAL : CAMBIA,
    ...(!r.ok ? { motivo: r.motivo } : hoy == null ? { motivo: 'la respuesta no trae el dato' } : publicada == null ? { motivo: 'sin cifra publicada con la que comparar: leer a mano' } : {}),
    ...(nota ? { nota } : {}),
  });
  const cronometro = async (g, fn) => { const t = ahora(); try { await fn(); } finally { tiempos[g] = Number(((ahora() - t) / 1000).toFixed(1)); } };

  const grupos = {
    // ---- Spiko: rendimiento que publica la API (el de la tarjeta) y fecha del valor liquidativo del literal.
    spiko: async () => Promise.all(Object.entries(SPIKO).filter(([s]) => pub.ofertas.has(s)).map(async ([slug, cfg]) => {
      const o = pub.ofertas.get(slug);
      const ry = await pedirJson({ url: `${SPIKO_API}share-classes/${cfg.clase}/yield` });
      const hoy = ry.json?.[cfg.campo] != null ? pct(ry.json[cfg.campo]) : null;
      cifra(slug, `Rentabilidad de la tarjeta (${cfg.campo} de ${cfg.clase})`, o.rentabilidad?.mostrada, hoy, ry, o.rentabilidad?.mostrada === hoy);
      const rn = await pedirJson({ url: `${SPIKO_API}net-asset-values/${cfg.clase}/latest` });
      const fPub = fechaDe((o.rentabilidad?.literal || '').match(/(?:VL|valor liquidativo)(?: fechada)? (?:del|de|el) \d{2}\/\d{2}\/\d{4}/)?.[0]);
      const fHoy = rn.json?.day ? isoAEs(rn.json.day) : null;
      cifra(slug, `Fecha del valor liquidativo (${cfg.clase})`, fPub, fHoy ? `${fHoy} (${rn.json.amount?.value} ${rn.json.amount?.currency})` : null, rn,
        fPub === fHoy, fPub !== fHoy && fHoy ? 'Valor liquidativo nuevo: cambia la fecha del literal y de la métrica aunque la cifra sea la misma.' : null);
    })),

    // ---- Midas · mTBILL: última ronda del oráculo del emisor y rentabilidad pasada de 5 semanas (orientativa).
    midas: async () => {
      const o = pub.ofertas.get('mtbill'); if (!o) return;
      const b = await bloque();
      const r = await rpc([llamada('oraculo', ORACULO_MTBILL, SEL.latestRoundData, b.tag)]);
      const mVal = metrica(o, /^Valor por token · \d{2}\/\d{2}\/\d{4}/), mRent = metrica(o, /^Rentabilidad pasada · /);
      const pubVal = mVal ? `${(mVal.valor.match(/^([\d,]+) USD/) || [])[1]} USD (${fechaDe(mVal.etiqueta)})` : null;
      const raw = r.res.oraculo;
      if (!raw) { cifra('mtbill', 'Valor por token (oráculo)', pubVal, null, r.ok ? { ...r, ok: false, motivo: 'el oráculo no devolvió datos' } : r, false); return; }
      const ronda = pal(raw, 0), valor = Number(pal(raw, 1)) / 1e8, ts = Number(pal(raw, 3));
      const fRonda = isoAEs(horaIso(ts * 1000));
      const hoyVal = `${es(valor, 4)} USD (${fRonda})`;
      cifra('mtbill', 'Valor por token (oráculo del emisor)', pubVal, hoyVal, r, pubVal === hoyVal,
        `Ronda ${ronda} del ${horaIso(ts * 1000)} (bloque ${b.numero ?? '?'} de las ${b.horaUtc ?? '?'}). La fecha del dato es la de la ronda.`);
      // Rentabilidad pasada: ronda más cercana a 35 días antes de la última, anualizada con los días exactos (como la publicada).
      const ids = []; for (let k = 30; k >= 18; k--) if (ronda - BigInt(k) >= 1n) ids.push(ronda - BigInt(k));
      const rr = await rpc(ids.map((id) => llamada(`r${id}`, ORACULO_MTBILL, SEL.getRoundData + id.toString(16).padStart(64, '0'), b.tag)));
      const rondas = ids.map((id) => rr.res[`r${id}`]).filter(Boolean).map((h) => ({ id: pal(h, 0), valor: Number(pal(h, 1)) / 1e8, ts: Number(pal(h, 3)) })).filter((x) => x.ts);
      const objetivo = ts - 35 * 86400;
      const inicio = rondas.sort((a, b2) => Math.abs(a.ts - objetivo) - Math.abs(b2.ts - objetivo))[0];
      const pubRent = mRent ? `${mRent.valor} hasta el ${fechaDe(mRent.etiqueta)}` : null;
      let hoyRent = null, nota = null;
      if (inicio) {
        const dias = (ts - inicio.ts) / 86400;
        hoyRent = `${es((valor / inicio.valor - 1) * 365 / dias * 100)} % anual hasta el ${fRonda}`;
        nota = `Orientativa: ronda ${inicio.id} (${horaIso(inicio.ts * 1000)}, ${inicio.valor} USD) → ronda ${ronda}, ${es(dias)} días exactos × 365. ` +
          'Si cambia, el investigador aplica la regla publicada (ventana de semanas completas sin festivo en los extremos) y la confirma en cadena.';
      }
      cifra('mtbill', 'Rentabilidad pasada de 5 semanas (en USD)', pubRent, hoyRent, inicio ? rr : { ...rr, ok: false, motivo: rr.motivo || 'sin rondas anteriores legibles' }, pubRent === hoyRent, nota);
    },

    // ---- Brickwise: libro de órdenes de la API pública (v1) y participaciones en venta (v2).
    brickwise: async () => {
      const slugs = [...pub.ofertas.values()].filter((o) => o.plataformaSlug === 'brickwise').map((o) => o.slug);
      if (!slugs.length) return;
      const [r1, r2] = await Promise.all([pedirJson({ url: BW_V1 }), pedirJson({ url: BW_V2 })]);
      for (const slug of slugs) {
        const doc = pub.documentacion[slug];
        const isin = (doc?.caracteristicas || []).map((c) => String(c.valor).match(/ISIN ([A-Z]{2}[A-Z0-9]{10})/)?.[1]).find(Boolean)
          || (pub.ofertas.get(slug).url || '').match(/([A-Z]{2}[A-Z0-9]{10})/i)?.[1]?.toUpperCase();
        const a1 = Array.isArray(r1.json) ? r1.json.find((a) => a.ISIN === isin) : null;
        const a2 = Array.isArray(r2.json) ? r2.json.find((a) => a.ISIN === isin) : null;
        const sinActivo = (r) => (r.ok && !(r === r1 ? a1 : a2) ? { ...r, ok: false, motivo: `la API no trae ${isin || 'el ISIN'}` } : r);
        const l = a1 ? libroBrickwise(a1) : {};
        const R1 = sinActivo(r1), R2 = sinActivo(r2);
        // Mínimo de la tarjeta: precio de la venta más barata.
        const mPub = num((referencia(doc, /^Mínimo de inversión$/)?.valor || '').match(/^Desde ([\d.,]+) €/)?.[1]);
        cifra(slug, 'Mínimo de la tarjeta (venta más barata)', mPub != null ? `${es(mPub)} €` : null, l.venta ? `${es(l.venta.precio)} €` : null, R1,
          l.venta && centimos(mPub) === centimos(l.venta.precio), a1 && !l.venta ? 'Sin órdenes de venta abiertas: puede que no se pueda comprar en reventa.' : null);
        const vRef = referencia(doc, /^Venta más barata · /), vPub = leerVentaPublicada(vRef?.valor);
        const vIgual = vPub && l.venta && centimos(vPub.precio) === centimos(l.venta.precio) && vPub.cantidad === l.venta.cantidad
          && vPub.ordenes === l.venta.ordenes && (vPub.ordenes !== 1 || vPub.fecha === l.venta.fecha);
        cifra(slug, 'Venta más barata', vRef?.valor, l.venta ? textoVenta(l.venta) : null, R1, vIgual);
        const mRef = referencia(doc, /^Orden de venta de menor importe · /), mnPub = leerMenorPublicada(mRef?.valor);
        cifra(slug, 'Orden de venta de menor importe', mRef?.valor, l.menor ? textoMenor(l.menor) : null, R1,
          mnPub && l.menor && mnPub.cantidad === l.menor.cantidad && centimos(mnPub.precio) === centimos(l.menor.precio) && centimos(mnPub.importe) === centimos(l.menor.importe));
        const pRef = referencia(doc, /^Participaciones en venta · /);
        const pHoy = a2 && a2.availableBricksSecondary != null ? Number(a2.availableBricksSecondary) : null;
        cifra(slug, 'Participaciones en venta', pRef ? `${pRef.valor} (${fechaDe(pRef.etiqueta)})` : null, pHoy == null ? null : String(pHoy), R2, !!pRef && num(pRef.valor) === pHoy,
          a1 && pHoy != null && l.participacionesEnVentaV1 !== pHoy ? `La v1 suma ${l.participacionesEnVentaV1} en órdenes abiertas: no cuadra con la v2.` : null);
        const cRef = referencia(doc, /^Mejor oferta de compra · /), cPub = leerCompraPublicada(cRef?.valor);
        cifra(slug, 'Mejor oferta de compra', cRef?.valor, l.compra ? textoCompra(l.compra) : null, R1,
          cPub && l.compra && centimos(cPub.precio) === centimos(l.compra.precio) && cPub.cantidad === l.compra.cantidad && cPub.ordenes === l.compra.ordenes
          && (cPub.ordenes !== 1 || cPub.fecha === l.compra.fecha));
      }
    },

    // ---- Suizas: precio del emisor en cadena (getPrice del Brokerbot), libro de órdenes y ajustes públicos del portal.
    suiza: async () => {
      const slugs = Object.keys(SUIZA).filter((s) => pub.ofertas.has(s));
      if (!slugs.length) return;
      const b = await bloque();
      const rc = await rpc(slugs.flatMap((s) => [llamada(`precio-${s}`, SUIZA[s].bot, SEL.getPrice, b.tag),
        llamada(`ajustes-${s}`, SUIZA[s].bot, SEL.settings, b.tag),
        llamada(`zchf-${s}`, ZCHF, SEL.balanceOf + SUIZA[s].bot.slice(2).padStart(64, '0'), b.tag)]));
      await Promise.all(slugs.map(async (slug) => {
        const cfg = SUIZA[slug], o = pub.ofertas.get(slug), doc = pub.documentacion[slug];
        const [ob, bs, tr] = await Promise.all([
          pedirJson({ metodo: 'POST', url: `${cfg.portal}/api/secondarymarkets/getOrderBook`, cuerpo: JSON.stringify({ company: cfg.empresa }) }),
          pedirJson({ url: `${cfg.portal}/api/brokerbotsettings?ticker=${cfg.ticker}` }),
          slug === 'boss-info' ? pedirJson({ metodo: 'POST', url: `${cfg.portal}/api/secondarymarkets/getTrades`, cuerpo: JSON.stringify({ company: cfg.empresa, limit: 5 }) }) : null,
        ]);
        const contratoOk = !bs.ok || String(bs.json?.marketAddress || '').toLowerCase() === cfg.bot;
        // Precio del emisor.
        const precioRaw = rc.res[`precio-${slug}`];
        const precio = precioRaw ? Number(pal(precioRaw, 0)) / 1e18 : null;
        const pPub = slug === 'aktionariat' ? (metrica(o, /^Precio del emisor · /)?.valor || '').match(/^([\d,]+) CHF/)?.[1]
          : slug === 'boss-info' ? (o.resumen || '').match(/vende a ([\d,]+) CHF/)?.[1]
            : (referencia(doc, /^Mínimo de inversión$/)?.valor || '').match(/\(([\d,]+) CHF el/)?.[1];
        cifra(slug, 'Precio del emisor (Brokerbot en cadena)', pPub ? `${pPub} CHF` : null, precio != null ? `${es(precio)} CHF` : null, rc,
          contratoOk && precio != null && pPub != null && centimos(num(pPub)) === centimos(precio),
          [precio != null ? `getPrice() = ${precio} en el bloque ${b.numero ?? '?'}` : null,
            contratoOk ? null : 'El portal anuncia otro contrato (marketAddress): revisar a mano.'].filter(Boolean).join('. ') || null);
        if (slug === 'boss-info') {
          const cPub = num((referencia(doc, /^Mínimo de inversión$/)?.valor || '').match(/unos (\d+) ZCHF/)?.[1]);
          cifra(slug, 'Mínimo en cripto (2 acciones al precio del emisor)', cPub != null ? `unos ${cPub} ZCHF` : null,
            precio != null ? `unos ${Math.round(2 * precio)} ZCHF` : null, rc, precio != null && cPub === Math.round(2 * precio));
        }
        // Mínimo por transferencia bancaria (ajustes públicos del portal).
        const tPub = num((referencia(doc, /^Mínimo de inversión$/)?.valor || '').match(/^(\d+) CHF por transferencia/)?.[1]);
        if (tPub != null) {
          const lim = bs.json?.bankTransferLimit;
          cifra(slug, 'Mínimo por transferencia bancaria', `${tPub} CHF`, lim ? (lim.enabled ? `${lim.min} CHF` : 'transferencia desactivada') : null, bs,
            !!lim?.enabled && Number(lim.min) === tPub);
        }
        // Recompra del emisor: lado de venta del Brokerbot en cadena (settings() & 0x2).
        const avRecompra = aviso(o, /no recompra|recompra seguía desactivada/);
        const aj = rc.res[`ajustes-${slug}`];
        const recompra = aj ? ((pal(aj, 0) & BROKERBOT_RECOMPRA) ? 'activa' : 'desactivada') : null;
        if (avRecompra) cifra(slug, 'Recompra del emisor (Brokerbot en cadena)', 'desactivada', recompra, rc, recompra === 'desactivada',
          aj ? `settings() = ${pal(aj, 0)} en el bloque ${b.numero ?? '?'}` : null);
        // Fondos de la recompra (ZCHF en el contrato), si la ficha los publica.
        const fondosPub = (aviso(o, /recompra.*\(([\d,]+) ZCHF\)/) || '').match(/\(([\d,]+) ZCHF\)/)?.[1];
        if (fondosPub) {
          const z = rc.res[`zchf-${slug}`];
          const zchf = z ? Number(pal(z, 0)) / 1e18 : null;
          cifra(slug, 'Fondos del emisor para recomprar', `${fondosPub} ZCHF`, zchf != null ? `${es(zchf)} ZCHF` : null, rc, zchf != null && es(zchf) === fondosPub);
        }
        // Venta más barata entre accionistas.
        const vPub = (aviso(o, /por debajo del precio del emisor|venta más barata/) || '').match(/([\d,]+) ZCHF/)?.[1];
        const asks = Array.isArray(ob.json?.asks) ? ob.json.asks.map((x) => ({ precio: Number(BigInt(x.sharePrice.big ?? x.sharePrice.value)) / 10 ** Number(x.sharePrice.decimals), acciones: Number(x.shares) })) : null;
        const ask = asks?.length ? asks.sort((a, b2) => a.precio - b2.precio)[0] : null;
        if (vPub) cifra(slug, 'Venta más barata entre accionistas', `${vPub} ZCHF`, ask ? `${es(ask.precio)} ZCHF × ${ask.acciones} acciones` : (asks ? 'sin ventas' : null), ob,
          !!ask && centimos(num(vPub)) === centimos(ask.precio));
        // Última operación (Boss Info la publica).
        if (tr) {
          const uRef = referencia(doc, /^Última operación · /);
          const t = tr.json?.trades?.[0];
          const hoyU = t ? `${es(Number(t.pricePerShare.big ?? t.pricePerShare.value) / 10 ** Number(t.pricePerShare.decimals))} ZCHF (${t.tradedShares} ${plural(Number(t.tradedShares), 'acción', 'acciones')}, ${isoAEs(t.whenCreated)})` : null;
          cifra(slug, 'Última operación', uRef?.valor, hoyU, tr, uRef?.valor === hoyU);
        }
      }));
    },

    // ---- Documentos citados en documentacion-ofertas.json: SHA-256 de hoy frente a la huella del ciclo publicado.
    documentos: async () => {
      const urls = new Map();
      for (const [slug, d] of Object.entries(pub.documentacion)) if (fichas[slug]) for (const u of d.fuentes || []) if (esDocumento(u)) {
        if (!urls.has(u)) urls.set(u, []);
        urls.get(u).push(slug);
      }
      await Promise.all([...urls].map(async ([url, slugs]) => {
        const r = await pedir({ url });
        const ref = pub.huellas.get(url);
        const estado = !r.ok || !r.sha256 ? ILEGIBLE : !ref ? CAMBIA : ref.sha256 === r.sha256 ? IGUAL : CAMBIA;
        const e = { url, sha256Publicada: ref?.sha256 || null, origenHuella: ref ? `${ref.origen}${ref.consultadoUtc ? ` (${ref.consultadoUtc})` : ''}` : null,
          sha256: r.sha256, horaUtc: r.horaUtc, bytes: r.buf.length, estado,
          ...(estado === ILEGIBLE ? { motivo: r.motivo } : !ref ? { motivo: 'sin huella publicada con la que comparar: tratar como documento nuevo y leerlo' } : {}) };
        for (const s of slugs) fichas[s].documentos.push(e);
      }));
      for (const f of Object.values(fichas)) f.documentos.sort((a, b2) => a.url.localeCompare(b2.url));
    },

    // ---- CNMV: las búsquedas de advertencias del ciclo publicado, con un control que debe dar resultados.
    cnmv: async () => {
      // Sin resultados: «No hay datos disponibles». Con resultados: la tabla gridAdvertencias (una fila por advertencia).
      const filas = (t) => (t.match(/<td data-th="Fecha">/g) || []).length;
      const lee = (r) => {
        if (!r.ok) return null;
        const t = r.buf.toString('utf8');
        const tabla = /id="[^"]*gridAdvertencias"/.test(t);
        if (/No hay datos disponibles/.test(t) && !tabla) return false;
        if (tabla && filas(t)) return true;
        return null; // ni «sin datos» ni tabla de resultados: no se sabe leer
      };
      const control = await pedir({ url: CNMV_CONTROL, cabeceras: CNMV_CABECERAS });
      const controlOk = lee(control) === true;
      const urls = new Map();
      for (const [slug, l] of pub.cnmv) for (const b of l) if (b.url !== CNMV_CONTROL) {
        if (!urls.has(b.url)) urls.set(b.url, []);
        urls.get(b.url).push({ slug, ...b });
      }
      await Promise.all([...urls].map(async ([url, quienes]) => {
        const r = await pedir({ url, cabeceras: CNMV_CABECERAS });
        const hay = controlOk ? lee(r) : null;
        const n = hay ? filas(r.buf.toString('utf8')) : 0;
        for (const q of quienes) fichas[q.slug].advertenciasCnmv.push({
          nombre: q.nombre, url, publicada: q.conResultados ? 'con resultados' : 'sin advertencias',
          hoy: hay == null ? null : hay ? `con resultados (${n} ${plural(n, 'fila', 'filas')} en la primera página)` : 'sin advertencias',
          horaUtc: r.horaUtc, sha256: r.sha256,
          estado: hay == null ? ILEGIBLE : hay === q.conResultados ? IGUAL : CAMBIA,
          ...(hay == null ? { motivo: !controlOk ? `el control («Trading») no dio resultados a las ${control.horaUtc}: la búsqueda no es fiable ahora` : r.ok ? 'la página no dice ni «No hay datos disponibles» ni trae resultados' : r.motivo } : {}),
        });
      }));
      return { control: { url: CNMV_CONTROL, horaUtc: control.horaUtc, sha256: control.sha256, ok: controlOk } };
    },
  };

  const extra = {};
  await Promise.all(GRUPOS.filter((g) => solo.includes(g)).map((g) => cronometro(g, async () => { extra[g] = await grupos[g](); })));

  // Lo que el vigía no cubre en cada ficha: se abre a mano, como siempre.
  const contar = (l) => l.reduce((a, x) => ((a[x.estado] = (a[x.estado] || 0) + 1), a), {});
  for (const [slug, f] of Object.entries(fichas)) {
    f.cifras.sort((a, b2) => a.campo.localeCompare(b2.campo));
    f.advertenciasCnmv.sort((a, b2) => a.nombre.localeCompare(b2.nombre));
    const leidas = f.cifras.length + f.documentos.length + f.advertenciasCnmv.length;
    f.noCubre = !f.cifras.length
      ? 'El vigía no lee ninguna cifra de esta ficha: sus datos de la tarjeta y sus avisos se abren a mano en su fuente primaria.'
      : 'Todo lo que no esté en «cifras», «documentos» o «advertenciasCnmv» (textos de la web, registros, acceso desde España, salida, avisos sin cifra) se abre a mano.';
    f.resumen = { leidas, cambia: [...f.cifras, ...f.documentos, ...f.advertenciasCnmv].filter((x) => x.estado === CAMBIA).length,
      ilegibles: [...f.cifras, ...f.documentos, ...f.advertenciasCnmv].filter((x) => x.estado === ILEGIBLE).length };
    void slug;
  }
  const todas = Object.values(fichas);
  const t1 = ahora();
  return {
    version: 1,
    generadoUtc: horaIso(t1),
    inicioUtc: horaIso(t0),
    duracionS: Number(((t1 - t0) / 1000).toFixed(1)),
    tiemposPorGrupoS: tiempos,
    base: path.relative(process.cwd(), path.resolve(base)) || base,
    ...(ciclo ? { ciclo: path.relative(process.cwd(), path.resolve(ciclo)) || ciclo } : {}),
    grupos: GRUPOS.filter((g) => solo.includes(g)),
    reglas: 'Petición normal (agente por defecto de Node, sin cookies ni sesión), TLS verificado, sin eludir bloqueos: un 403, un desafío o un error quedan como «no se pudo leer» y no se reintentan. Detecta, no decide: lo que cambia lo confirma el investigador en la fuente y lo reabre el revisor.',
    resumen: {
      fichas: todas.length,
      fichasConCifras: todas.filter((f) => f.cifras.length).length,
      cifras: contar(todas.flatMap((f) => f.cifras)),
      documentos: contar([...new Map(todas.flatMap((f) => f.documentos).map((d) => [d.url, d])).values()]),
      advertenciasCnmv: contar([...new Map(todas.flatMap((f) => f.advertenciasCnmv).map((d) => [d.url, d])).values()]),
      ...(extra.cnmv ? { controlCnmv: extra.cnmv.control } : {}),
      peticiones: fuentes.length,
    },
    fichas,
    fuentes,
  };
}

/** Resumen corto para la terminal: lo que cambia y lo que no se pudo leer. */
export function resumenTexto(v) {
  const l = [`Vigía · ${v.generadoUtc} · ${v.duracionS} s · ${v.resumen.peticiones} peticiones · base ${v.base}`,
    `Cifras: ${JSON.stringify(v.resumen.cifras)} · documentos: ${JSON.stringify(v.resumen.documentos)} · CNMV: ${JSON.stringify(v.resumen.advertenciasCnmv)}`];
  for (const [slug, f] of Object.entries(v.fichas)) {
    for (const c of f.cifras) if (c.estado !== IGUAL) l.push(`  [${c.estado}] ${slug} · ${c.campo}: ${c.publicada ?? '—'} → ${c.hoy ?? '—'}${c.motivo ? ` (${c.motivo})` : ''}`);
    for (const d of f.documentos) if (d.estado !== IGUAL) l.push(`  [${d.estado}] ${slug} · documento ${d.url}${d.motivo ? ` (${d.motivo})` : ''}`);
    for (const a of f.advertenciasCnmv) if (a.estado !== IGUAL) l.push(`  [${a.estado}] ${slug} · CNMV «${a.nombre}»: ${a.publicada} → ${a.hoy ?? '—'}${a.motivo ? ` (${a.motivo})` : ''}`);
  }
  return l.join('\n');
}

// ---------------------------------------------------------------- línea de órdenes
async function main(argv) {
  const opt = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);
  const ciclo = opt('--ciclo'), base = opt('--base'), grabadas = opt('--grabadas'), ahoraFija = opt('--ahora');
  const solo = opt('--solo') ? opt('--solo').split(',').map((s) => s.trim()).filter(Boolean) : GRUPOS;
  if (!ciclo || !base) { console.error('Uso: node vigia.mjs --ciclo <carpeta del ciclo> --base <carpeta de la entrega publicada> [--solo g1,g2] [--grabadas <carpeta>] [--sin-crudo]'); return 2; }
  if (solo.some((g) => !GRUPOS.includes(g))) { console.error(`--solo: grupos válidos ${GRUPOS.join(', ')}`); return 2; }
  for (const f of ['escaparate-publicacion.json', 'documentacion-ofertas.json']) if (!fs.existsSync(path.join(base, f))) { console.error(`Falta ${path.join(base, f)}`); return 2; }
  // Node solo usa HTTPS_PROXY con fetch si NODE_USE_ENV_PROXY=1: se relanza a sí mismo una vez (como comprobar-rutas.mjs).
  if (!grabadas && (process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...argv], { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1', NODE_NO_WARNINGS: '1' } });
    return r.status ?? 1;
  }
  fs.mkdirSync(ciclo, { recursive: true });
  const dirCrudo = grabadas || argv.includes('--sin-crudo') ? null : path.join(ciclo, 'vigia-crudo');
  const red = conGrabacion(grabadas ? redGrabada(grabadas) : redEnVivo(), dirCrudo);
  let reloj = ahoraFija ? Date.parse(ahoraFija) : null;
  const ahora = reloj != null ? () => reloj : () => Date.now();
  const v = await vigilar({ base, ciclo, red, ahora, solo });
  red.guardarIndice();
  if (grabadas) v.reproducidaDe = path.relative(process.cwd(), path.resolve(grabadas)) || grabadas;
  if (dirCrudo) v.crudo = path.relative(process.cwd(), dirCrudo);
  fs.writeFileSync(path.join(ciclo, 'vigia.json'), JSON.stringify(v, null, 1) + '\n');
  console.log(resumenTexto(v));
  console.log(`\nEscrito ${path.join(ciclo, 'vigia.json')}${dirCrudo ? ` (respuestas en bruto en ${dirCrudo}, fuera de Git)` : ''}`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((c) => process.exit(c), (e) => { console.error(e); process.exit(1); });
}

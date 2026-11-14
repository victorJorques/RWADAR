// Pruebas de la página del informe: reglas de artefacto (colores solo como
// variables, tema oscuro, márgenes seguros, sin JavaScript), escape de lo que
// viene de fuera y que aguante datos vacíos o rotos.
import test from 'node:test';
import assert from 'node:assert/strict';
import { AVISO } from '../lib/comun.mjs';
import { ema, vwapDiario } from '../lib/indicadores.mjs';
import { documentoInforme, esc, paginaInforme } from '../lib/informe.mjs';
import { generarVelas } from './sinteticas.mjs';

const HORA = 3_600_000;
const AHORA = Date.UTC(2026, 10, 14, 10, 20);
const TITULAR_MALO = '<script>alert("x")</script> Bitcoin & #fff "ETF" outflows <img src=x onerror=alert(1)>';

function datosDePrueba({ hipotetica = false } = {}) {
  const velas = generarVelas({ semilla: 7, n: 120, intervalo: '1h', inicio: AHORA - 120 * HORA, precio: 61000, volatilidad: 0.004, patron: 'tendencia-bajista' });
  const cierres = velas.map(v => v.c);
  const ultimo = cierres.at(-1);
  const entrada = ultimo;
  const stop = Math.round(ultimo * 0.99);
  const objetivo = Math.round(ultimo * 1.02);
  return {
    version: 1, hora: AHORA, par: 'BTC-EUR', moneda: 'EUR', hipotetica,
    conclusion: hipotetica
      ? { tipo: 'hipotetica', frase: 'Hoy no hay jugada según tus reglas. Lo demás es una entrada HIPOTÉTICA.', detalle: 'El gestor de riesgo dice PASA.', vigilar: 'Qué vigilar: por arriba 62.000 €.' }
      : { tipo: 'jugada', frase: 'Hay jugada en papel: Ruptura de rango en 1h.', detalle: 'Disparó.', vigilar: '' },
    pasos: {
      escanear: {
        hora: AHORA, par: 'BTC-EUR', moneda: 'EUR', precio: ultimo,
        precio_actual: { precio: ultimo, fuente: 'coinbase', hora: AHORA },
        tendencias: { '15m': 'bajista', '1h': 'bajista', '4h': 'lateral', '1d': 'alcista' },
        tendencias_motivo: { '15m': 'Por debajo de la EMA200.', '1h': 'Por debajo.', '4h': 'Mezclado.', '1d': 'Por encima.' },
        setups: [{ id: 'ruptura-rango', nombre: 'Ruptura de rango', intervalo: '1h', direccion: 'larga', estado: 'activo', nivel_entrada: entrada - 50, nivel_invalidacion: stop, fuerza: 64, motivo: 'Rompe el máximo de 24 horas.', operable: true }],
        niveles_clave: {
          precio: ultimo,
          arriba: [{ precio: 62000, nombre: 'máximo de 4h (12/11/2026 08:00) + máximo diario (12/11/2026) + máximo de 1h (13/11/2026 09:00) + VWAP de hoy', distancia_pct: 1.2 }],
          abajo: [{ precio: 60000, nombre: 'mínimo diario (10/11/2026)', distancia_pct: -1.5 }],
          resistencia: { precio: 62000, nombre: 'máximo de 4h', distancia_pct: 1.2 },
          soporte: { precio: 60000, nombre: 'mínimo diario', distancia_pct: -1.5 },
          que_vigilar: 'No hay jugada clara ahora mismo.',
        },
        contexto: { precio: ultimo, cambio_24h_pct: -3.1, cambio_72h_pct: -8.9, ema200_diaria: 70500, distancia_ema200_diaria_pct: -13.4, intervalos: { '1h': { rsi: 31.2, atr_pct: 0.62 } } },
        fuentes_velas: { '15m': { fuente: 'coinbase' }, '1h': { fuente: 'coinbase' } },
        precios_exchanges: { precios: [{ fuente: 'coinbase', precio: ultimo }, { fuente: 'kraken', precio: ultimo + 12 }], divergencia_pct: 0.02 },
        grafico: {
          intervalo: '1h', fuente: 'coinbase',
          velas: velas.map(v => [v.t, v.o, v.h, v.l, v.c]),
          ema20: ema(cierres, 20), ema50: ema(cierres, 50), vwap: vwapDiario(velas),
        },
      },
      noticias: {
        hora: AHORA, horas: 24,
        noticias: [
          { titulo: 'Fed holds rates', enlace: 'https://example.com/fed?a=1&b=2#parte', fuente: 'CoinDesk', fecha: new Date(AHORA - 2 * HORA).toISOString(), impacto: 'medio', sentido: 'neutro' },
          { titulo: TITULAR_MALO, enlace: 'javascript:alert(1)', fuente: 'Decrypt', fecha: new Date(AHORA - 5 * HORA).toISOString(), impacto: 'alto', sentido: 'negativo' },
        ],
        fuentes: [{ nombre: 'Decrypt', ok: true }, { nombre: 'CoinDesk', ok: true }, { nombre: 'Cointelegraph', ok: false, error: 'HTTP 503' }],
        alto_impacto: [],
        miedo_codicia: { valor: 13, clase: 'miedo extremo', fecha: new Date(AHORA).toISOString() },
      },
      entrada: { estado: hipotetica ? 'hipotetica' : 'disparo', motivo: 'Una vela de 5m cerró por encima.', hipotetica },
      salida: { entrada, stop, objetivo, rr: 2, rr_neto: 0.6, salida_por_tiempo: AHORA + 24 * HORA, avisos: ['Con costes, el R:R real baja.'], valido: true },
      maquina: {
        simulacion: {
          simulaciones: 10000, horas: 24, dias_usados: 60, objetivo_primero_pct: 31.2, stop_primero_pct: 52.4, abierta_pct: 16.4,
          resultado_pct: { mediana: -1.1, p5: -1.4, p25: -1.3, p75: 1.2, p95: 2.3, media: -0.2 }, esperanza_R: -0.12, k_volatilidad: 1.52,
          histograma: Array.from({ length: 20 }, (_, k) => ({ desde: -1.5 + k * 0.2, hasta: -1.3 + k * 0.2, n: k === 0 ? 5000 : k === 19 ? 3000 : 100 })),
          metodo: 'Se han rehecho 10.000 veces las próximas 24 h.', avisos: [],
        },
        historico: { nombre: 'Ruptura de rango', senales: 12, objetivo: 4, stop: 7, abiertas: 1, acierto_pct: 33.33, esperanza_R: -0.2, R_total: -2.4, desde: AHORA - 180 * 24 * HORA, hasta: AHORA, lista: [{ t_entrada: AHORA - 50 * HORA, entrada: 60500, salida: 60100, resultado: 'stop', R: -1.3 }] },
      },
      presupuesto: { btc: 0.04081106, coste: 2500, perdida_si_stop: 30.61, limitado_por: 'posicion_max', motivo: 'Compra 0,04081106 BTC.' },
      riesgo: {
        veredicto: 'BLOQUEADA', motivos: ['Ventana'],
        comprobaciones: [{ regla: 'solo_papel', nombre: 'Solo papel', ok: true, detalle: 'Modo papel.' }, { regla: 'ventana_entrada', nombre: 'Ventana de entrada (UTC)', ok: false, detalle: 'Fuera de <ventana>.' }],
        avisos: [],
      },
      ticket: { texto: 'EN PAPEL (sin dinero real) · COMPRA 0,04081106 BTC', vigente: false, veredicto: 'BLOQUEADA', motivo_no_vigente: 'el gestor de riesgo la bloquea.' },
    },
    cartera: {
      resumen: { moneda: 'EUR', capital: 4970.98, efectivo: 2470.98, pnl_total: -29.02, pnl_total_pct: -0.58, pnl_hoy: -29.02, saldo_inicial: 5000, posiciones: [{ id: 'P-20261114-2', btc: 0.04, precio_entrada: 61000, stop: 60400, objetivo: 62200, pnl_latente: -12.5, salida_por_tiempo: AHORA + 20 * HORA }] },
      historial: [{ id: 'P-20261114-1', motivo: 'stop', precio_entrada: 61424.55, precio_salida: 61015.73, pnl: -29.02, cerrada: AHORA - HORA }],
      precio_de: { precio: ultimo, fuente: 'coinbase', hora: AHORA },
    },
    generado: AHORA + 60_000,
  };
}

// Contenido entre la llave que abre en `desde` y su pareja.
function entreLlaves(texto, desde) {
  const abre = texto.indexOf('{', desde);
  let nivel = 0;
  for (let k = abre; k < texto.length; k++) {
    if (texto[k] === '{') nivel++;
    else if (texto[k] === '}' && --nivel === 0) return { cuerpo: texto.slice(abre + 1, k), fin: k + 1 };
  }
  throw new Error('llaves sin cerrar');
}

function bloquesDeColor(html) {
  const css = html.slice(html.indexOf('<style>') + 7, html.indexOf('</style>'));
  const iClaro = css.indexOf(':root {');
  const iMedia = css.indexOf('@media (prefers-color-scheme: dark)');
  const iOscuro = css.indexOf(':root[data-theme="dark"] {');
  assert.ok(iClaro >= 0 && iMedia >= 0 && iOscuro >= 0, 'están los tres bloques de color');
  const claro = entreLlaves(css, iClaro);
  const media = entreLlaves(css, iMedia);
  assert.match(media.cuerpo, /:root:not\(\[data-theme="light"\]\) \{/);
  const oscuroMedia = entreLlaves(media.cuerpo, media.cuerpo.indexOf(':root:not'));
  const oscuro = entreLlaves(css, iOscuro);
  return { css, claro, media, oscuroMedia, oscuro, rangos: [[iClaro, claro.fin], [iMedia, media.fin], [iOscuro, oscuro.fin]] };
}

const nombres = cuerpo => [...cuerpo.matchAll(/--([a-z0-9-]+)\s*:/g)].map(m => m[1]).sort();

for (const [nombre, html] of [['fragmento', () => paginaInforme(datosDePrueba())], ['documento', () => documentoInforme(datosDePrueba({ hipotetica: true }))]]) {
  test(`${nombre}: los colores son variables de :root y los dos bloques oscuros tienen los mismos nombres`, () => {
    const { claro, oscuroMedia, oscuro } = bloquesDeColor(html());
    const n = nombres(claro.cuerpo);
    assert.ok(n.length >= 15, 'hay variables de color');
    for (const k of ['fondo', 'superficie', 'tinta', 'acento', 'sube', 'baja']) assert.ok(n.includes(k), `falta --${k}`);
    assert.deepEqual(nombres(oscuroMedia.cuerpo), n);
    assert.deepEqual(nombres(oscuro.cuerpo), n);
    assert.match(oscuroMedia.cuerpo, /color-scheme: dark/);
    assert.match(oscuro.cuerpo, /color-scheme: dark/);
    assert.match(claro.cuerpo, /--acento: #f7931a/i, 'el naranja de bitcoin');
  });

  test(`${nombre}: ningún color literal fuera de los bloques de variables`, () => {
    const h = html();
    const { css, rangos } = bloquesDeColor(h);
    let resto = css;
    for (const [a, b] of [...rangos].sort((x, y) => y[0] - x[0])) resto = resto.slice(0, a) + resto.slice(b);
    const fuera = h.replace(css, resto);
    assert.doesNotMatch(fuera, /#[0-9a-f]{3,8}\b/i, 'sin #hex');
    assert.doesNotMatch(fuera, /\brgba?\(/i, 'sin rgb()');
    assert.doesNotMatch(fuera, /\bhsla?\(/i, 'sin hsl()');
    assert.match(css, /body \{[^}]*background: var\(--fondo\);[^}]*color: var\(--tinta\);/);
    // En el SVG, los colores van por clase con var(--…), nunca en fill/stroke sueltos.
    assert.doesNotMatch(fuera, /\s(fill|stroke)="(?!none)[^"]*"/);
  });

  test(`${nombre}: márgenes laterales seguros en un solo contenedor, cifras tabulares y fuentes con respaldo`, () => {
    const h = html();
    assert.equal((h.match(/padding-left: max\(16px, env\(safe-area-inset-left, 0px\)\)/g) ?? []).length, 1);
    assert.equal((h.match(/padding-right: max\(16px, env\(safe-area-inset-right, 0px\)\)/g) ?? []).length, 1);
    assert.match(h, /\.pagina \{[^}]*padding-block:/);
    assert.match(h, /<main class="pagina">/);
    assert.match(h, /font-variant-numeric: tabular-nums/);
    assert.match(h, /<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2\?family=IBM\+Plex\+Mono[^"]*IBM\+Plex\+Sans/);
    assert.match(h, /'IBM Plex Sans', system-ui/);
    assert.match(h, /overflow-x: auto/);
    assert.doesNotMatch(h, /<script/i, 'sin JavaScript');
    assert.match(h, /<title>BTC en papel<\/title>/);
    assert.ok(h.includes(AVISO), 'el aviso al pie');
  });
}

test('el fragmento no trae doctype, html, head ni body y sí la meta de los bordes', () => {
  const h = paginaInforme(datosDePrueba());
  assert.doesNotMatch(h, /<!doctype|<html[\s>]|<head[\s>]|<body[\s>]/i);
  assert.match(h, /^<title>BTC en papel<\/title>/);
  assert.match(h, /<meta name="claude:viewport-fit-sides" content="cover">/);
  assert.match(h, /<style>[\s\S]+<\/style>/);
});

test('el documento completo trae doctype, lang="es", charset y viewport-fit=cover', () => {
  const h = documentoInforme(datosDePrueba());
  assert.match(h, /^<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">/);
  assert.match(h, /<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">/);
  assert.match(h, /<body>[\s\S]+<\/body>\n<\/html>\n$/);
});

test('los titulares se escapan y los enlaces que no son http(s) no se enlazan', () => {
  const h = paginaInforme(datosDePrueba());
  assert.ok(!h.includes('<script>alert'), 'el <script> del titular no entra crudo');
  assert.ok(!h.includes('<img src=x'), 'ni la etiqueta <img>');
  assert.ok(h.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; Bitcoin &amp; &num;fff &quot;ETF&quot;'));
  assert.ok(!h.includes('javascript:'), 'un enlace javascript: no se pone');
  assert.match(h, /<a href="https:\/\/example\.com\/fed\?a=1&amp;b=2&num;parte" target="_blank" rel="noopener">Fed holds rates<\/a>/);
  assert.match(h, /Fuera de &lt;ventana&gt;\./, 'también el detalle de las reglas');
  assert.equal(esc(`a < b & "c" 'd' #e`), 'a &lt; b &amp; &quot;c&quot; &apos;d&apos; &num;e');
});

test('contenido: conclusión, gráfico a escala con sus niveles, máquina del tiempo, riesgo y cartera', () => {
  const d = datosDePrueba();
  const h = paginaInforme(d);
  assert.match(h, /<h1 class="conclusion">Hay jugada en papel: Ruptura de rango en 1h\.<\/h1>/);
  assert.match(h, /Coinbase/);
  // Dos versiones del gráfico (ancha y estrecha), con viewBox y al 100 %.
  assert.equal((h.match(/<svg class="(ancho|estrecho)" viewBox="0 0 \d+ \d+" width="100%"/g) ?? []).length, 2);
  const svg = h.slice(h.indexOf('<svg class="ancho"'), h.indexOf('</svg>', h.indexOf('<svg class="ancho"')));
  assert.equal((svg.match(/class="vela-(sube|baja)"/g) ?? []).length, 120, 'una vela por hora');
  assert.match(svg, /class="linea linea-ema20"/);
  assert.match(svg, /class="linea linea-ema50"/);
  assert.match(svg, /class="linea linea-vwap"/);
  const y = clave => Number(new RegExp(`class="nivel nivel-${clave}" x1="[\\d.]+" x2="[\\d.]+" y1="([\\d.]+)"`).exec(svg)[1]);
  assert.ok(y('objetivo') < y('entrada') && y('entrada') < y('stop'), 'objetivo arriba, stop abajo (a escala)');
  for (const t of ['Objetivo', 'Entrada', 'Stop']) assert.match(svg, new RegExp(`>${t} \\d{2}\\.\\d{3} €</text>`));
  // Máquina del tiempo: barra apilada con los tres porcentajes e histograma.
  assert.match(h, /class="seg-objetivo" style="width: 31\.2%"/);
  assert.match(h, /class="seg-abierta" style="width: 16\.4%"/);
  assert.match(h, /class="seg-stop" style="width: 52\.4%"/);
  assert.match(h, /<div class="histograma"><svg viewBox/);
  assert.match(h, /«Ruptura de rango» repetida en el pasado real/);
  // Riesgo con PASA y BLOQUEA, y la cartera.
  assert.match(h, /chapa-pasa">PASA<\/span><\/span><span class="nombre">Solo papel/);
  assert.match(h, /chapa-bloquea">BLOQUEA<\/span><\/span><span class="nombre">Ventana de entrada/);
  assert.match(h, /P-20261114-2/);
  assert.match(h, /P-20261114-1/);
  assert.match(h, /13<\/strong> de 100/);
  assert.match(h, /y 2 más/, 'los niveles con muchos nombres se acortan');
  // Arriba va el estado del ticket, no un PASA en verde que empuje a operar.
  assert.match(h, /<dt>Ticket<\/dt><dd><span class="chapa chapa-bloquea">bloqueado por tus reglas<\/span>/);
  // Las noticias de alto impacto van primero aunque sean más viejas.
  assert.ok(h.indexOf('&lt;script&gt;alert') < h.indexOf('Fed holds rates'));
});

test('la versión hipotética lo dice arriba y en el gráfico', () => {
  const h = paginaInforme(datosDePrueba({ hipotetica: true }));
  assert.match(h, /class="franja-hipotetica"><strong>HIPOTÉTICA<\/strong>/);
  assert.match(h, />Entrada hipotética \d/);
  const listo = datosDePrueba({ hipotetica: true });
  listo.pasos.ticket = { texto: 'HIPOTÉTICA · EN PAPEL', vigente: true, veredicto: 'PASA' };
  assert.match(paginaInforme(listo), /chapa-acento">hipotético · falta tu «sí»</);
  listo.pasos.ticket.usado = 'P-20261114-3';
  assert.match(paginaInforme(listo), /abierto como P-20261114-3/);
});

test('aguanta datos vacíos, nulos o rotos sin romper', () => {
  for (const d of [undefined, null, {}, { pasos: null }, { pasos: { escanear: { grafico: { velas: [] } } } }]) {
    const h = paginaInforme(d);
    assert.match(h, /<title>BTC en papel<\/title>/);
    assert.ok(h.includes(AVISO));
    assert.match(h, /No hay velas de 1 h para dibujar/);
  }
  const roto = datosDePrueba();
  roto.pasos.escanear.grafico.velas = [[1, NaN, 2, 3, 4], [AHORA, 61000, 61100, 60900, 61050]];
  roto.pasos.escanear.grafico.ema20 = [null];
  roto.pasos.maquina = { omitido: true, motivo: 'No hay jugada.' };
  roto.pasos.salida = { omitido: true };
  roto.pasos.noticias.miedo_codicia = null;
  roto.cartera = null;
  const h = paginaInforme(roto);
  assert.doesNotMatch(h, /NaN|undefined/);
  assert.match(h, /No hay jugada\./);
  // Una sola vela válida: se dibuja sin dividir entre cero.
  const una = datosDePrueba();
  una.pasos.escanear.grafico = { velas: [[AHORA, 61000, 61000, 61000, 61000], [AHORA + HORA, 61000, 61000, 61000, 61000]] };
  una.pasos.salida = { omitido: true };
  una.pasos.escanear.niveles_clave = {};
  assert.doesNotMatch(paginaInforme(una), /NaN|Infinity/);
});

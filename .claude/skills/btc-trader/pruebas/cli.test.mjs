// Pruebas de punta a punta de btc.mjs sin red: un mercado de mentira (los
// cuatro exchanges, los RSS y el índice de miedo y codicia) y el estado en
// una carpeta temporal.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { AVISO, INTERVALOS } from '../lib/comun.mjs';
import { agregar } from '../lib/datos.mjs';
import { prepararContexto } from '../lib/escaner.mjs';
import { ejecutar } from '../btc.mjs';
import { fetchFalso, generarVelas, mercadoFalso, respuesta } from './sinteticas.mjs';

const M5 = INTERVALOS['5m'];
const FIN = Date.UTC(2026, 10, 14, 10, 0);
const c2 = x => Math.round(x * 100) / 100;

// 40 días de 5 min alrededor de 61.000 €; el resto de temporalidades sale de agregarlas.
function mercadoLateral({ semilla = 3, dias = 40 } = {}) {
  const n = dias * 288;
  return generarVelas({ semilla, n, intervalo: '5m', inicio: FIN - n * M5, precio: 61000, volatilidad: 0.0012, patron: 'lateral' });
}

// Una hora que rompe el máximo de las 24 anteriores con el triple de volumen y,
// después, una vela de 5 min que cierra por encima con volumen: entrada disparada.
function conRuptura(base) {
  const velas = [...base];
  const max24 = Math.max(...agregar(velas, INTERVALOS['1h']).slice(-24).map(v => v.h));
  let p = velas.at(-1).c;
  const t0 = velas.at(-1).t + M5;
  const meta = max24 * 1.0008;
  for (let k = 0; k < 12; k++) {
    const c = c2(p + (meta - p) * ((k + 1) / 12));
    velas.push({ t: t0 + k * M5, o: p, h: c2(Math.max(p, c) * 1.0002), l: c2(Math.min(p, c) * 0.9998), c, v: 3.5 });
    p = c;
  }
  const ctx = prepararContexto(agregar(velas, INTERVALOS['1h']), '1h');
  const i = ctx.velas.length - 1;
  const c = c2(ctx.donchian24.max[i] + 0.25 * ctx.atr[i]);
  velas.push({ t: t0 + 12 * M5, o: p, h: c2(Math.max(p, c) * 1.0002), l: c2(Math.min(p, c) * 0.9999), c, v: 6 });
  return { velas, ahora: t0 + 13 * M5 + 60_000 };
}

// Añade velas de 5 min que van del último cierre hasta `hasta` (y se quedan ahí).
function seguirHasta(velas, hasta, n = 6) {
  const salida = [...velas];
  let p = salida.at(-1).c;
  for (let k = 0; k < n; k++) {
    const c = c2(p + (hasta - p) / (n - k));
    salida.push({ t: salida.at(-1).t + M5, o: p, h: c2(Math.max(p, c) + 3), l: c2(Math.min(p, c) - 3), c, v: 1.5 });
    p = c;
  }
  return { velas: salida, ahora: salida.at(-1).t + M5 + 30_000 };
}

function rss(nombre, items) {
  const cuerpo = items.map(i => `<item><title>${i.titulo}</title><link>${i.enlace}</link><pubDate>${new Date(i.fecha).toUTCString()}</pubDate><description>${i.resumen ?? ''}</description></item>`).join('');
  return `<?xml version="1.0"?><rss version="2.0"><channel><title>${nombre}</title>${cuerpo}</channel></rss>`;
}

function red(velas5m, ahora, { noticias = [], caido = false } = {}) {
  if (caido) return fetchFalso([[/./, respuesta(503, { message: 'Servicio no disponible (simulado)' })]]);
  const v = { '5m': velas5m };
  for (const iv of ['15m', '1h', '4h', '1d']) v[iv] = agregar(velas5m, INTERVALOS[iv]);
  const mercado = mercadoFalso({ velas: v, ahora });
  const medios = fetchFalso({
    'cointelegraph.com': rss('Cointelegraph', noticias),
    'decrypt.co': rss('Decrypt', []),
    'bitcoinmagazine.com': rss('Bitcoin Magazine', []),
    'coindesk.com': rss('CoinDesk', []),
    'alternative.me': { name: 'Fear and Greed Index', data: [{ value: '13', value_classification: 'Extreme Fear', timestamp: String(Math.floor(ahora / 1000)) }], metadata: { error: null } },
  });
  return (url, init) => (/cointelegraph|decrypt|bitcoinmagazine|coindesk|alternative\.me/.test(String(url)) ? medios(url, init) : mercado(url, init));
}

// Estado nuevo en una carpeta temporal para cada prueba.
function estadoNuevo(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'btc-papel-'));
  const antes = process.env.BTC_TRADER_ESTADO;
  process.env.BTC_TRADER_ESTADO = dir;
  t.after(() => {
    if (antes === undefined) delete process.env.BTC_TRADER_ESTADO; else process.env.BTC_TRADER_ESTADO = antes;
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}

async function correr(args, { velas, ahora, noticias, caido }) {
  let escrito = '';
  const r = await ejecutar(args, {
    fetch: red(velas, ahora, { noticias, caido }), ahora, salida: t => { escrito += t; }, pausaMs: 0, esperar: async () => {},
  });
  assert.equal(escrito, r.texto, 'lo que devuelve es lo que escribe');
  return r;
}

const leer = (dir, nombre) => JSON.parse(fs.readFileSync(path.join(dir, `${nombre}.json`), 'utf8'));
const acabaConAviso = texto => assert.ok(texto.trimEnd().endsWith(AVISO), `la salida acaba con el aviso:\n${texto.slice(-300)}`);

test('todo sin setup largo activo dice que hoy no hay jugada, da los niveles a vigilar y se para', async t => {
  const dir = estadoNuevo(t);
  const velas = mercadoLateral();
  const r = await correr(['todo'], { velas, ahora: FIN + 120_000 });
  assert.equal(r.codigo, 0, r.texto);
  assert.match(r.texto, /hoy no hay jugada según tus reglas/i);
  assert.match(r.texto, /Qué vigilar: por arriba .*€.*por abajo .*€/);
  assert.match(r.texto, /1\. ESCÁNER/);
  assert.match(r.texto, /2\. NOTICIAS/);
  assert.match(r.texto, /Miedo y codicia: 13\/100, miedo extremo/);
  assert.doesNotMatch(r.texto, /4\. SALIDA|8\. TICKET/);
  assert.match(r.texto, /todo --hipotetica/);
  assert.match(r.texto, /14\/11\/2026 11:02 \(10:02 UTC\)/, 'lleva la hora de Madrid y la UTC');
  acabaConAviso(r.texto);
  const todo = leer(dir, 'todo');
  assert.equal(todo.conclusion.tipo, 'sin_jugada');
  for (const paso of ['salida', 'maquina', 'presupuesto', 'riesgo', 'ticket']) {
    assert.equal(leer(dir, paso).omitido, true, `${paso} queda marcado como omitido`);
  }
  assert.ok(fs.existsSync(path.join(dir, 'escanear.json')));
  assert.ok(fs.existsSync(path.join(dir, 'noticias.json')));
});

test('todo --hipotetica sigue hasta el ticket y lo marca como HIPOTÉTICA en todas partes', async t => {
  const dir = estadoNuevo(t);
  const r = await correr(['todo', '--hipotetica'], { velas: mercadoLateral(), ahora: FIN + 120_000 });
  assert.equal(r.codigo, 0, r.texto);
  for (const n of ['1. ESCÁNER', '2. NOTICIAS', '3. ENTRADA', '4. SALIDA', '5. MÁQUINA DEL TIEMPO', '6. PRESUPUESTO', '7. RIESGO', '8. TICKET']) {
    assert.ok(r.texto.includes(n), `falta ${n}`);
  }
  assert.match(r.texto, /MODO HIPOTÉTICO/);
  assert.match(r.texto, /HIPOTÉTICA \(no sale de ningún setup\) · EN PAPEL \(sin dinero real\) · COMPRA/);
  assert.match(r.texto, /10\.000 futuros/);
  assert.match(r.texto, /no sale de ninguna regla/);
  assert.match(r.texto, /papel abrir --confirmar sí --hipotetica/);
  acabaConAviso(r.texto);
  const todo = leer(dir, 'todo');
  assert.equal(todo.hipotetica, true);
  assert.equal(todo.conclusion.tipo, 'hipotetica');
  for (const paso of ['entrada', 'salida', 'maquina', 'presupuesto', 'riesgo', 'ticket']) assert.equal(leer(dir, paso).hipotetica, true, paso);
  const ticket = leer(dir, 'ticket');
  assert.equal(ticket.orden.setup, 'hipotetica');
  assert.ok(ticket.orden.stop < ticket.orden.entrada && ticket.orden.entrada < ticket.orden.objetivo);
  assert.equal(leer(dir, 'maquina').simulacion.simulaciones, 10000);
  assert.ok(!fs.existsSync(path.join(dir, 'papel.json')), 'todo no abre nada');
});

test('con un setup disparado, todo deja un ticket vigente y se para sin abrir nada', async t => {
  const dir = estadoNuevo(t);
  const m = conRuptura(mercadoLateral());
  const r = await correr(['todo', '--setup', 'ruptura-rango'], m);
  assert.equal(r.codigo, 0, r.texto);
  assert.match(r.texto, /Estado: DISPARO/);
  assert.match(r.texto, /Hay jugada en papel: Ruptura de rango en 1h/);
  assert.match(r.texto, /Histórico de la regla «Ruptura de rango» en 1h/);
  const ticket = leer(dir, 'ticket');
  assert.equal(ticket.vigente, true);
  assert.equal(ticket.entrada_estado, 'disparo');
  assert.equal(ticket.veredicto, 'PASA');
  assert.ok(ticket.orden.btc > 0);
  assert.ok(!fs.existsSync(path.join(dir, 'papel.json')));
});

test('papel abrir sin «sí» falla y no toca la cartera', async t => {
  const dir = estadoNuevo(t);
  const m = conRuptura(mercadoLateral());
  assert.equal((await correr(['todo', '--setup', 'ruptura-rango'], m)).codigo, 0);
  for (const args of [['papel', 'abrir'], ['papel', 'abrir', '--confirmar'], ['papel', 'abrir', '--confirmar', 'vale'], ['papel', 'abrir', '--confirmar', 'SÍ']]) {
    const r = await correr(args, m);
    assert.equal(r.codigo, 1, args.join(' '));
    assert.match(r.texto, /No se abre nada: para abrir EN PAPEL hay que escribir --confirmar sí/);
    assert.match(r.texto, /La cartera no se ha tocado/);
    acabaConAviso(r.texto);
  }
  assert.ok(!fs.existsSync(path.join(dir, 'papel.json')));
});

test('papel abrir con «sí» abre la orden del ticket, vuelve a pasar el riesgo y no deja abrirla dos veces', async t => {
  const dir = estadoNuevo(t);
  const m = conRuptura(mercadoLateral());
  assert.equal((await correr(['todo', '--setup', 'ruptura-rango'], m)).codigo, 0);
  const ticket = leer(dir, 'ticket');
  const r = await correr(['papel', 'abrir', '--confirmar', 'sí'], m);
  assert.equal(r.codigo, 0, r.texto);
  assert.match(r.texto, /P-20261114-1 abierta EN PAPEL/);
  assert.match(r.texto, /Riesgo vuelto a pasar con el precio de ahora: PASA/);
  const cartera = leer(dir, 'papel');
  assert.equal(cartera.posiciones.length, 1);
  const pos = cartera.posiciones[0];
  assert.equal(pos.btc, ticket.orden.btc);
  assert.equal(pos.stop, ticket.orden.stop);
  assert.equal(pos.objetivo, ticket.orden.objetivo);
  assert.equal(pos.setup, 'ruptura-rango');
  assert.ok(cartera.efectivo < 5000);
  assert.equal(leer(dir, 'ticket').usado, 'P-20261114-1');

  const otra = await correr(['papel', 'abrir', '--confirmar', 'sí'], m);
  assert.equal(otra.codigo, 1);
  assert.match(otra.texto, /ya se abrió como P-20261114-1/);
  assert.equal(leer(dir, 'papel').posiciones.length, 1);

  const estado = await correr(['papel', 'estado'], m);
  assert.equal(estado.codigo, 0);
  assert.match(estado.texto, /Cartera EN PAPEL/);
  assert.match(estado.texto, /P-20261114-1: 0,0\d+ BTC/);
});

test('un ticket HIPOTÉTICO solo se abre si se repite --hipotetica', async t => {
  const dir = estadoNuevo(t);
  const m = { velas: mercadoLateral(), ahora: FIN + 120_000 };
  assert.equal((await correr(['todo', '--hipotetica'], m)).codigo, 0);
  const sin = await correr(['papel', 'abrir', '--confirmar', 'sí'], m);
  assert.equal(sin.codigo, 1);
  assert.match(sin.texto, /HIPOTÉTICO/);
  assert.ok(!fs.existsSync(path.join(dir, 'papel.json')));
  const con = await correr(['papel', 'abrir', '--confirmar', 'si', '--hipotetica'], m);
  assert.equal(con.codigo, 0, con.texto);
  assert.match(con.texto, /^HIPOTÉTICA · P-20261114-1 abierta EN PAPEL/m);
  assert.equal(leer(dir, 'papel').posiciones[0].setup, 'hipotetica');
});

test('papel abrir no abre si el riesgo de ahora bloquea (noticia de alto impacto recién salida)', async t => {
  const dir = estadoNuevo(t);
  const m = conRuptura(mercadoLateral());
  assert.equal((await correr(['todo', '--setup', 'ruptura-rango'], m)).codigo, 0);
  const noticias = [{ titulo: 'Bitcoin exchange hack: hackers drain $400 million in BTC', enlace: 'https://example.com/hack', fecha: m.ahora - 5 * 60_000, resumen: 'A major exchange was hacked and bitcoin withdrawals were halted.' }];
  const r = await correr(['papel', 'abrir', '--confirmar', 'sí'], { ...m, noticias });
  assert.equal(r.codigo, 1, r.texto);
  assert.match(r.texto, /el gestor de riesgo dice BLOQUEADA/);
  assert.match(r.texto, /alto impacto/);
  assert.ok(!fs.existsSync(path.join(dir, 'papel.json')));
  assert.equal(leer(dir, 'papel-abrir').abierta, false);
});

test('papel revisar cierra por stop cuando el precio cae', async t => {
  const dir = estadoNuevo(t);
  const m = conRuptura(mercadoLateral());
  await correr(['todo', '--setup', 'ruptura-rango'], m);
  assert.equal((await correr(['papel', 'abrir', '--confirmar', 'sí'], m)).codigo, 0);
  const pos = leer(dir, 'papel').posiciones[0];
  const r = await correr(['papel', 'revisar'], seguirHasta(m.velas, pos.stop * 0.996));
  assert.equal(r.codigo, 0, r.texto);
  assert.match(r.texto, /P-20261114-1 cerrada por stop/);
  const cartera = leer(dir, 'papel');
  assert.equal(cartera.posiciones.length, 0);
  assert.equal(cartera.historial[0].motivo, 'stop');
  assert.ok(cartera.historial[0].pnl < 0);
  assert.ok(Math.abs(cartera.historial[0].pnl) <= 50, 'no pierde más que el límite por operación');
});

test('papel revisar cierra en el objetivo cuando el precio sube', async t => {
  const dir = estadoNuevo(t);
  const m = conRuptura(mercadoLateral());
  await correr(['todo', '--setup', 'ruptura-rango'], m);
  assert.equal((await correr(['papel', 'abrir', '--confirmar', 'sí'], m)).codigo, 0);
  const pos = leer(dir, 'papel').posiciones[0];
  const r = await correr(['papel', 'revisar'], seguirHasta(m.velas, pos.objetivo * 1.002));
  assert.equal(r.codigo, 0, r.texto);
  assert.match(r.texto, /P-20261114-1 cerrada en el objetivo/);
  const h = leer(dir, 'papel').historial[0];
  assert.equal(h.motivo, 'objetivo');
  assert.ok(h.pnl > 0);
  // Sin posiciones abiertas, revisar no necesita red y no rompe.
  const otra = await correr(['papel', 'revisar'], { ...seguirHasta(m.velas, pos.objetivo), caido: true });
  assert.equal(otra.codigo, 0, otra.texto);
  assert.match(otra.texto, /No hay posiciones abiertas/);
});

test('informe escribe la página completa y, con --fragmento, el fragmento para el artefacto', async t => {
  const dir = estadoNuevo(t);
  const m = conRuptura(mercadoLateral());
  await correr(['todo', '--setup', 'ruptura-rango'], m);
  const r = await correr(['informe'], m);
  assert.equal(r.codigo, 0, r.texto);
  const ruta = r.datos.ruta;
  assert.equal(path.dirname(ruta), dir);
  assert.match(path.basename(ruta), /^informe-2026-11-14-\d{4}\.html$/);
  const html = fs.readFileSync(ruta, 'utf8');
  assert.match(html, /^<!doctype html>/);
  assert.match(html, /<html lang="es">/);
  assert.match(html, /<title>BTC en papel<\/title>/);
  assert.match(html, /<svg class="ancho" viewBox="0 0 960 380"/);
  assert.match(html, /Hay jugada en papel/);
  assert.ok(html.includes(AVISO));

  const f = await correr(['informe', '--fragmento'], m);
  assert.equal(f.codigo, 0, f.texto);
  assert.match(path.basename(f.datos.ruta), /-fragmento\.html$/);
  const frag = fs.readFileSync(f.datos.ruta, 'utf8');
  assert.doesNotMatch(frag, /<!doctype|<html[\s>]|<head[\s>]|<body[\s>]/i);
  assert.match(frag, /<meta name="claude:viewport-fit-sides" content="cover">/);

  const fuera = path.join(dir, 'otra', 'mio.html');
  const s = await correr(['informe', '--salida', fuera], m);
  assert.equal(s.codigo, 0, s.texto);
  assert.ok(fs.existsSync(fuera));
});

test('informe sin una pasada de todo explica qué hacer', async t => {
  estadoNuevo(t);
  const r = await correr(['informe'], { velas: mercadoLateral(), ahora: FIN });
  assert.equal(r.codigo, 1);
  assert.match(r.texto, /corre primero .*btc\.mjs todo/);
  acabaConAviso(r.texto);
});

test('--json saca el JSON del paso con el aviso', async t => {
  estadoNuevo(t);
  const r = await correr(['escanear', '--json'], { velas: mercadoLateral(), ahora: FIN + 120_000 });
  assert.equal(r.codigo, 0);
  const j = JSON.parse(r.texto);
  assert.equal(j.aviso, AVISO);
  assert.equal(j.par, 'BTC-EUR');
  assert.ok(Array.isArray(j.setups));
  assert.equal(j.precio_actual.fuente, 'coinbase');
  assert.equal(j.grafico.velas.length, 120);
});

test('alertas: se crean, se listan y saltan una sola vez al comprobar', async t => {
  estadoNuevo(t);
  const m = { velas: mercadoLateral(), ahora: FIN + 120_000 };
  const nivel = Math.round(m.velas.at(-1).c + 300);
  const a = await correr(['alertas', 'sobre', String(nivel), 'romper', 'arriba'], m);
  assert.equal(a.codigo, 0, a.texto);
  assert.match(a.texto, /Alerta guardada\. A-20261114-1: avisa si BTC sube a/);
  const mal = await correr(['alertas', 'bajo', String(nivel)], m);
  assert.equal(mal.codigo, 1, 'una alerta que ya se cumple no se crea');
  assert.match((await correr(['alertas'], m)).texto, /A-20261114-1/);
  const nada = await correr(['alertas', 'comprobar'], m);
  assert.match(nada.texto, /Ninguna alerta ha saltado \(1 pendiente\)/);
  const sube = seguirHasta(m.velas, nivel + 100);
  const salta = await correr(['alertas', 'comprobar'], sube);
  assert.match(salta.texto, /Alerta A-20261114-1: BTC ha subido a/);
  const otra = await correr(['alertas', 'comprobar'], sube);
  assert.match(otra.texto, /No hay alertas pendientes/);
});

test('maquina y presupuesto con cifras a mano', async t => {
  const dir = estadoNuevo(t);
  const m = { velas: mercadoLateral(), ahora: FIN + 120_000 };
  const r = await correr(['maquina', '--entrada', '61.000', '--stop', '60.500', '--setup', 'rebote-sobreventa'], m);
  assert.equal(r.codigo, 0, r.texto);
  assert.match(r.texto, /objetivo 62\.000 €/);
  assert.match(r.texto, /Objetivo primero .* · stop primero .* · sin tocar ninguno/);
  const maq = leer(dir, 'maquina');
  assert.equal(maq.historico.setup, 'rebote-sobreventa');
  assert.ok(maq.historico.verificacion.hecha, 'el histórico comprueba que la regla no mira al futuro');
  const p = await correr(['presupuesto', '--entrada', '61000', '--stop', '60500'], m);
  assert.equal(p.codigo, 0, p.texto);
  assert.match(p.texto, /Compra 0,0\d+ BTC a 61\.000,00 €/);
  const mal = await correr(['presupuesto', '--entrada', 'mucho', '--stop', '60500'], m);
  assert.equal(mal.codigo, 1);
  assert.match(mal.texto, /no es un número positivo/);
});

test('errores en castellano: sin red, orden desconocida, setup desconocido y opción rara', async t => {
  estadoNuevo(t);
  const m = { velas: mercadoLateral(), ahora: FIN + 120_000 };
  const caido = await correr(['todo'], { ...m, caido: true });
  assert.equal(caido.codigo, 1);
  assert.match(caido.texto, /No he podido leer velas de ningún exchange/);
  acabaConAviso(caido.texto);
  const desconocida = await correr(['vende-todo'], m);
  assert.equal(desconocida.codigo, 1);
  assert.match(desconocida.texto, /No conozco la orden «vende-todo»/);
  const setup = await correr(['todo', '--setup', 'cohete'], m);
  assert.equal(setup.codigo, 1);
  assert.match(setup.texto, /No conozco el setup «cohete»/);
  const opcion = await correr(['todo', '--apalancado'], m);
  assert.equal(opcion.codigo, 1);
  assert.match(opcion.texto, /No conozco la opción «--apalancado»/);
  const ayuda = await correr(['ayuda'], m);
  assert.equal(ayuda.codigo, 0);
  assert.match(ayuda.texto, /SOLO EN PAPEL/);
  acabaConAviso(ayuda.texto);
});

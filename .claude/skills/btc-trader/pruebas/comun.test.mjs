// Pruebas de lib/comun.mjs (sin red; el estado va a una carpeta temporal).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'btc-comun-'));
process.env.BTC_TRADER_ESTADO = path.join(tmp, 'estado');

const C = await import('../lib/comun.mjs');

before(() => fs.mkdirSync(tmp, { recursive: true }));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

test('INTERVALOS y AVISO', () => {
  assert.deepEqual({ ...C.INTERVALOS }, {
    '1m': 60_000, '5m': 300_000, '15m': 900_000, '1h': 3_600_000, '4h': 14_400_000, '1d': 86_400_000,
  });
  assert.ok(Object.isFrozen(C.INTERVALOS));
  assert.equal(C.AVISO, 'Herramienta educativa en papel. No es asesoramiento financiero. Simular no garantiza resultados: la mayoría de quienes hacen trading intradía pierden dinero.');
  assert.equal(C.msIntervalo('4h'), 14_400_000);
  assert.throws(() => C.msIntervalo('2h'), /Intervalo desconocido: «2h».*1m, 5m, 15m, 1h, 4h, 1d/);
});

test('dirEstado usa BTC_TRADER_ESTADO y crea la carpeta', () => {
  const dir = C.dirEstado();
  assert.equal(dir, path.join(tmp, 'estado'));
  assert.ok(fs.statSync(dir).isDirectory());
});

test('leerEstado / escribirEstado: ida y vuelta, defecto, subcarpetas', () => {
  assert.deepEqual(C.leerEstado('no-existe', { vacio: true }), { vacio: true });
  assert.equal(C.leerEstado('no-existe'), null);
  const ruta = C.escribirEstado('papel', { efectivo: 5000, posiciones: [] });
  assert.equal(ruta, path.join(tmp, 'estado', 'papel.json'));
  assert.deepEqual(C.leerEstado('papel'), { efectivo: 5000, posiciones: [] });
  assert.deepEqual(C.leerEstado('papel.json'), { efectivo: 5000, posiciones: [] }, 'con o sin .json');
  C.escribirEstado('informes/hoy', { ok: 1 });
  assert.deepEqual(C.leerEstado('informes/hoy'), { ok: 1 });
  // Sin restos de archivos temporales tras escribir.
  assert.deepEqual(fs.readdirSync(path.join(tmp, 'estado')).filter(n => n.endsWith('.tmp')), []);
});

test('leerEstado con un archivo roto devuelve el defecto y guarda una copia', () => {
  const ruta = path.join(C.dirEstado(), 'roto.json');
  fs.writeFileSync(ruta, '{"a": 1,');
  assert.deepEqual(C.leerEstado('roto', { a: 0 }), { a: 0 });
  assert.equal(fs.readFileSync(path.join(C.dirEstado(), 'roto.roto.json'), 'utf8'), '{"a": 1,');
});

test('el nombre de estado no puede salirse de la carpeta', () => {
  assert.throws(() => C.leerEstado('../fuera'), /se sale de la carpeta de estado/);
  assert.throws(() => C.escribirEstado('../../x', {}), /se sale de la carpeta de estado/);
  assert.throws(() => C.escribirEstado('', {}), /Falta el nombre/);
});

test('cargarConfig: sin escribir no crea nada; luego crea la copia del ejemplo', () => {
  const rutaPropia = path.join(C.dirEstado(), 'config.json');
  fs.rmSync(rutaPropia, { force: true });
  const ejemplo = JSON.parse(fs.readFileSync(path.join(C.RAIZ, 'config.ejemplo.json'), 'utf8'));
  assert.deepEqual(C.cargarConfig({ escribir: false }), ejemplo);
  assert.deepEqual(C.cargarConfig(false), ejemplo);
  assert.equal(fs.existsSync(rutaPropia), false);
  assert.deepEqual(C.cargarConfig(), ejemplo);
  assert.deepEqual(JSON.parse(fs.readFileSync(rutaPropia, 'utf8')), ejemplo);
});

test('cargarConfig fusiona en profundidad (objetos se mezclan, arrays y null sustituyen)', () => {
  const rutaPropia = path.join(C.dirEstado(), 'config.json');
  fs.writeFileSync(rutaPropia, JSON.stringify({
    riesgo: { perdida_max_operacion: 20, ventana_entrada_utc: [8, 20] },
    escaner: { intervalos: ['1h'] },
    noticias: null,
    nuevo: { a: 1 },
  }));
  const config = C.cargarConfig({ escribir: false });
  assert.equal(config.riesgo.perdida_max_operacion, 20);
  assert.equal(config.riesgo.perdida_max_dia, 150, 'lo demás del ejemplo se queda');
  assert.deepEqual(config.riesgo.ventana_entrada_utc, [8, 20]);
  assert.deepEqual(config.escaner.intervalos, ['1h'], 'los arrays se sustituyen, no se mezclan');
  assert.equal(config.noticias, null);
  assert.deepEqual(config.nuevo, { a: 1 });
  assert.equal(config.papel, true);
  // La fusión no toca los objetos de partida.
  const base = { a: { b: 1, c: [1, 2] } };
  const encima = { a: { c: [3] } };
  const r = C.fusionar(base, encima);
  r.a.c.push(9);
  assert.deepEqual(base, { a: { b: 1, c: [1, 2] } });
  assert.deepEqual(encima, { a: { c: [3] } });
});

test('cargarConfig con estado/config.json roto avisa en castellano', () => {
  const rutaPropia = path.join(C.dirEstado(), 'config.json');
  fs.writeFileSync(rutaPropia, '{ "riesgo": ');
  assert.throws(() => C.cargarConfig(), /config\.json no es JSON válido.*Arréglalo o bórralo/);
  fs.writeFileSync(rutaPropia, '[1, 2]');
  assert.throws(() => C.cargarConfig(), /debe ser un objeto JSON/);
  fs.rmSync(rutaPropia);
});

test('fmtDinero en formato español', () => {
  assert.equal(C.fmtDinero(61027.86), '61.027,86 €');
  assert.equal(C.fmtDinero(5000), '5.000,00 €');
  assert.equal(C.fmtDinero(0.5), '0,50 €');
  assert.equal(C.fmtDinero(-150), '-150,00 €');
  assert.equal(C.fmtDinero(1234567.891), '1.234.567,89 €');
  assert.equal(C.fmtDinero(61027.86, 'USD'), '61.027,86 US$');
  for (const raro of [NaN, null, undefined, Infinity, '12']) assert.equal(C.fmtDinero(raro), '—');
  assert.ok(!/[  ]/.test(C.fmtDinero(61027.86)), 'espacio normal, no duro');
});

test('fmtBtc con 8 decimales y fmtPct', () => {
  assert.equal(C.fmtBtc(0.00123456), '0,00123456 BTC');
  assert.equal(C.fmtBtc(1.5), '1,50000000 BTC');
  assert.equal(C.fmtBtc(0.000000019), '0,00000002 BTC');
  assert.equal(C.fmtBtc(NaN), '—');
  assert.equal(C.fmtPct(9), '9,00 %');
  assert.equal(C.fmtPct(-9.123), '-9,12 %');
  assert.equal(C.fmtPct(0.5, 1), '0,5 %');
  assert.equal(C.fmtPct(1234.5, 0), '1.235 %');
  assert.equal(C.fmtPct(2.5, 2, { signo: true }), '+2,50 %');
  assert.equal(C.fmtPct(0, 2, { signo: true }), '0,00 %');
  assert.equal(C.fmtPct(null), '—');
});

test('fmtHora en Europe/Madrid, con la UTC al lado si se pide', () => {
  assert.equal(C.fmtHora(Date.UTC(2026, 10, 14, 10, 20)), '14/11/2026 11:20');
  assert.equal(C.fmtHora(Date.UTC(2026, 6, 1, 22, 5)), '02/07/2026 00:05', 'en verano, UTC+2');
  assert.equal(C.fmtHora(Date.UTC(2026, 10, 14, 10, 20), { utc: true }), '14/11/2026 11:20 (10:20 UTC)');
  assert.equal(C.fmtHora(new Date(Date.UTC(2026, 0, 1, 0, 0))), '01/01/2026 01:00');
  assert.equal(C.fmtHora(NaN), '—');
  assert.equal(C.fmtHora(null), '—');
});

test('diaMadrid exacto en los cambios de hora', () => {
  assert.equal(C.diaMadrid(Date.UTC(2026, 10, 14, 10, 20)), '2026-11-14');
  // Invierno (UTC+1): 23:30 UTC ya es el día siguiente en Madrid.
  assert.equal(C.diaMadrid(Date.UTC(2026, 10, 14, 22, 59)), '2026-11-14');
  assert.equal(C.diaMadrid(Date.UTC(2026, 10, 14, 23, 0)), '2026-11-15');
  // Verano (UTC+2): la medianoche de Madrid es a las 22:00 UTC.
  assert.equal(C.diaMadrid(Date.UTC(2026, 6, 1, 21, 59)), '2026-07-01');
  assert.equal(C.diaMadrid(Date.UTC(2026, 6, 1, 22, 0)), '2026-07-02');
  // 29/03/2026: a las 01:00 UTC se pasa de UTC+1 a UTC+2.
  assert.equal(C.diaMadrid(Date.UTC(2026, 2, 28, 22, 59)), '2026-03-28');
  assert.equal(C.diaMadrid(Date.UTC(2026, 2, 28, 23, 0)), '2026-03-29');
  assert.equal(C.diaMadrid(Date.UTC(2026, 2, 29, 21, 59)), '2026-03-29');
  assert.equal(C.diaMadrid(Date.UTC(2026, 2, 29, 22, 0)), '2026-03-30', 'tras el cambio, medianoche = 22:00 UTC');
  // 25/10/2026: a las 01:00 UTC se vuelve de UTC+2 a UTC+1.
  assert.equal(C.diaMadrid(Date.UTC(2026, 9, 24, 21, 59)), '2026-10-24');
  assert.equal(C.diaMadrid(Date.UTC(2026, 9, 24, 22, 0)), '2026-10-25');
  assert.equal(C.diaMadrid(Date.UTC(2026, 9, 25, 22, 59)), '2026-10-25');
  assert.equal(C.diaMadrid(Date.UTC(2026, 9, 25, 23, 0)), '2026-10-26', 'tras el cambio, medianoche = 23:00 UTC');
  assert.throws(() => C.diaMadrid(NaN), /no es válida/);
});

test('prng: mulberry32 reproducible, en [0, 1) y uniforme', () => {
  const a = C.prng(19);
  const b = C.prng(19);
  const sa = Array.from({ length: 5 }, a);
  assert.deepEqual(sa, Array.from({ length: 5 }, b));
  assert.notDeepEqual(sa, Array.from({ length: 5 }, C.prng(20)));
  // Valor de referencia de mulberry32 con semilla 1 (implementación canónica de Tommy Ettinger).
  assert.equal(C.prng(1)(), 0.6270739405881613);
  assert.equal(C.prng(1.9)(), C.prng(1)(), 'la semilla se trunca a entero');
  const r = C.prng(7);
  const cubos = new Array(10).fill(0);
  let suma = 0;
  for (let i = 0; i < 100_000; i++) {
    const x = r();
    assert.ok(x >= 0 && x < 1);
    cubos[Math.floor(x * 10)]++;
    suma += x;
  }
  assert.ok(Math.abs(suma / 100_000 - 0.5) < 0.01);
  for (const n of cubos) assert.ok(Math.abs(n - 10_000) < 500, `cubo con ${n}`);
  assert.throws(() => C.prng(NaN), /semilla debe ser un número entero/);
  assert.throws(() => C.prng('19'), /semilla/);
});

test('redondearAbajo a satoshis y otros pasos', () => {
  assert.equal(C.redondearAbajo(0.123456789, 1e-8), 0.12345678);
  assert.equal(C.redondearAbajo(0.29, 0.01), 0.29, '0.29/0.01 no se queda en 0.28');
  assert.equal(C.redondearAbajo(1.005, 0.01), 1);
  assert.equal(C.redondearAbajo(0.00081967, 1e-8), 0.00081967);
  assert.equal(C.redondearAbajo(1234, 100), 1200);
  assert.equal(C.redondearAbajo(-0.015, 0.01), -0.02, 'hacia abajo también en negativos');
  assert.equal(C.redondearAbajo(0, 1e-8), 0);
  assert.ok(Number.isNaN(C.redondearAbajo(NaN, 0.01)));
  assert.throws(() => C.redondearAbajo(1, 0), /paso debe ser un número positivo/);
  assert.throws(() => C.redondearAbajo(1, NaN), /paso/);
});

test('mediana', () => {
  assert.equal(C.mediana([3, 1, 2]), 2);
  assert.equal(C.mediana([4, 1, 3, 2]), 2.5);
  assert.equal(C.mediana([5, NaN, null, 1]), 3);
  assert.equal(C.mediana([]), null);
  assert.equal(C.mediana(null), null);
});

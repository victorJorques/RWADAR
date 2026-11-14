// Pruebas del gestor de riesgo (sin red; el estado va a una carpeta temporal).
// Orden base: compra de 0,03573 BTC a 61.000 € con stop 60.000 € y objetivo 63.000 €.
// Con c = 0,0025 y d = 0,0005 (c + d = 0,003):
//   riesgo por BTC = 1000 + 61000·0,003 + 60000·0,003 = 1363
//   pérdida si stop = 0,03573 · 1363 = 48,69999 → 48,70 €
//   nominal = 0,03573 · 61000 = 2179,53 €; coste = 2179,53 · 1,003 = 2186,06859 → 2186,07 €
//   ganancia = 0,03573 · (2000 − 183 − 157,5) = 0,03573 · 1659,5 = 59,29 €
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'btc-riesgo-'));
process.env.BTC_TRADER_ESTADO = path.join(tmp, 'estado');

const { RAIZ } = await import('../lib/comun.mjs');
const { comprobar, textoRiesgo, REGLAS } = await import('../lib/riesgo.mjs');

after(() => fs.rmSync(tmp, { recursive: true, force: true }));

const CONFIG = JSON.parse(fs.readFileSync(path.join(RAIZ, 'config.ejemplo.json'), 'utf8'));
const conRiesgo = cambios => ({ ...CONFIG, riesgo: { ...CONFIG.riesgo, ...cambios } });
const AHORA = Date.UTC(2026, 10, 14, 10, 20); // 14/11/2026 11:20 en Madrid
const ORDEN = Object.freeze({ lado: 'larga', btc: 0.03573, entrada: 61000, stop: 60000, objetivo: 63000 });
const CUENTA = Object.freeze({ efectivo: 5000, capital: 5000, pnl_hoy: 0, operaciones_hoy: 0, posiciones: [] });
const CONTEXTO = Object.freeze({ ahora: AHORA, precio_actual: 61050, noticias_alto_impacto: [], divergencia_pct: 0.12 });

function caso({ orden = {}, cuenta = {}, config = CONFIG, contexto = {} } = {}) {
  return comprobar({ orden: { ...ORDEN, ...orden }, cuenta: { ...CUENTA, ...cuenta }, config, contexto: { ...CONTEXTO, ...contexto } });
}
const fallan = r => r.comprobaciones.filter(x => !x.ok).map(x => x.regla);
const detalle = (r, regla) => r.comprobaciones.find(x => x.regla === regla).detalle;

/** Solo falla `regla`, con este detalle exacto, y el veredicto es BLOQUEADA. */
function soloFalla(r, regla, texto) {
  assert.equal(r.veredicto, 'BLOQUEADA');
  assert.deepEqual(fallan(r), [regla]);
  assert.equal(detalle(r, regla), texto);
  assert.deepEqual(r.motivos, [texto]);
}

test('la orden base PASA y cada regla dice su porqué con cifras', () => {
  const r = caso();
  assert.equal(r.veredicto, 'PASA');
  assert.deepEqual(r.motivos, []);
  assert.deepEqual(r.avisos, []);
  assert.deepEqual(r.comprobaciones.map(x => x.regla), REGLAS.map(x => x.regla));
  assert.deepEqual(r.comprobaciones.map(x => x.regla), [
    'solo_papel', 'solo_largos', 'sin_apalancamiento', 'perdida_max_operacion', 'perdida_max_dia', 'operaciones_dia', 'rr_minimo',
    'posicion_max', 'efectivo', 'ventana_entrada', 'noticias', 'divergencia', 'coherencia', 'precio_cerca',
  ]);
  assert.ok(r.comprobaciones.every(x => x.ok === true));
  assert.deepEqual(Object.fromEntries(r.comprobaciones.map(x => [x.regla, x.detalle])), {
    solo_papel: 'Modo papel: no se mueve dinero real.',
    solo_largos: 'Es una compra (larga).',
    sin_apalancamiento: 'La orden mueve 2.179,53 € y tienes 5.000,00 € en efectivo: no hace falta dinero prestado.',
    perdida_max_operacion: 'Si salta el stop pierdes 48,70 €; tu límite por operación es 50,00 €.',
    perdida_max_dia: 'Hoy llevas 0,00 € perdidos, las posiciones abiertas pueden perder 0,00 € más y esta orden 48,70 €: en el peor caso 48,70 € de un límite diario de 150,00 €.',
    operaciones_dia: 'Hoy (2026-11-14, Madrid) llevas 0 operaciones; con esta serían 1 y el máximo es 3.',
    // 2000 / 1000 = 2; neto 1659,5 / 1363 = 1,2175… → 1,22
    rr_minimo: 'Ganas 2 por cada 1 que arriesgas (1,22 contando comisiones y deslizamiento); el mínimo es 1,5.',
    // 2186,06859 / 5000 = 43,72 %
    posicion_max: 'La posición cuesta 2.186,07 € con costes, el 43,7 % de tu capital (5.000,00 €); el máximo es el 50 % (2.500,00 €).',
    efectivo: 'Con comisión y deslizamiento la compra cuesta 2.186,07 € y tienes 5.000,00 € libres.',
    ventana_entrada: 'Sin ventana horaria: BTC cotiza a todas horas.',
    noticias: 'Ninguna noticia de alto impacto en los últimos 30 minutos.',
    divergencia: 'Los exchanges se separan un 0,12 % entre sí; el máximo es 0,50 %.',
    coherencia: 'Stop 60.000,00 € < entrada 61.000,00 € < objetivo 63.000,00 €, y 0,03573000 BTC pasa del mínimo de orden.',
    // 50 / 61000 = 0,0819… %
    precio_cerca: 'El precio ahora (61.050,00 €) está a un 0,08 % de tu entrada (61.000,00 €); el máximo es 0,60 %.',
  });
  assert.deepEqual(r.cifras, {
    nominal: 2179.53, coste: 2186.07, perdida_si_stop: 48.7, ganancia_si_objetivo: 59.29,
    rr: 2, rr_neto: 1.22, distancia_entrada_pct: 0.082, efectivo: 5000, capital: 5000,
    perdida_max_operacion: 50, hueco_dia: 150,
  });
  assert.deepEqual(r.orden, { ...ORDEN });
  assert.equal(r.dia, '2026-11-14');
  assert.equal(r.hora, AHORA);
  assert.match(textoRiesgo(r), /^Gestor de riesgo: PASA\.\n✔ Solo papel: /);
});

test('solo papel: si config.papel no es true, bloquea siempre', () => {
  soloFalla(caso({ config: { ...CONFIG, papel: false } }), 'solo_papel',
    'config.papel no está en true (está en false): este paquete solo opera en papel.');
  soloFalla(caso({ config: { ...CONFIG, papel: 'true' } }), 'solo_papel',
    'config.papel no está en true (está en "true"): este paquete solo opera en papel.');
  const { papel: _fuera, ...sinPapel } = CONFIG;
  soloFalla(caso({ config: sinPapel }), 'solo_papel', 'config.papel no está en true (está en null): este paquete solo opera en papel.');
});

test('solo largos: un corto se bloquea salvo con riesgo.cortos = true', () => {
  // Corto: 0,03573 · (1000 + 183 + 186) = 48,91 € ≤ 50; R:R 2000 / 1000 = 2.
  const corto = { lado: 'corta', stop: 62000, objetivo: 59000 };
  soloFalla(caso({ orden: corto }), 'solo_largos', 'Es una venta en corto y tienes los cortos desactivados (riesgo.cortos = false).');
  const r = caso({ orden: corto, config: conRiesgo({ cortos: true }) });
  assert.equal(r.veredicto, 'PASA');
  assert.equal(detalle(r, 'solo_largos'), 'Es un corto y tienes los cortos activados (riesgo.cortos = true).');
  assert.equal(r.cifras.perdida_si_stop, 48.91);
});

test('sin apalancamiento: lo que mueve la orden tiene que caber en el efectivo', () => {
  // 2179,53 € > 2000 €: falla esta regla y la de efectivo (2186,07 − 2000 = 186,07 €). El 21,9 % del capital, bien.
  const r = caso({ cuenta: { efectivo: 2000, capital: 10000 } });
  assert.deepEqual(fallan(r), ['sin_apalancamiento', 'efectivo']);
  assert.equal(detalle(r, 'sin_apalancamiento'), 'La orden mueve 2.179,53 € y solo tienes 2.000,00 € en efectivo: haría falta apalancamiento y aquí no se usa.');
  assert.equal(detalle(r, 'efectivo'), 'Con comisión y deslizamiento la compra cuesta 2.186,07 € y solo tienes 2.000,00 € libres (faltan 186,07 €).');
  soloFalla(caso({ config: conRiesgo({ apalancamiento: true }) }), 'sin_apalancamiento',
    'riesgo.apalancamiento está en true, pero este paquete no simula apalancamiento: ponlo en false.');
});

test('pérdida máxima por operación', () => {
  // 0,04 · 1363 = 54,52 € > 50 € (el coste, 0,04 · 61183 = 2447,32 €, cabe en el 50 %).
  soloFalla(caso({ orden: { btc: 0.04 } }), 'perdida_max_operacion',
    'Si salta el stop pierdes 54,52 €; tu límite por operación es 50,00 €. Reduce el tamaño (presupuesto) o acerca el stop.');
  // Justo en el límite: 0,03668378 · 1363 = 49,99999 → 50,00 € pasa.
  assert.equal(caso({ orden: { btc: 0.03668378 } }).veredicto, 'PASA');
});

test('pérdida máxima del día: lo perdido hoy + lo que pueden perder las abiertas + esta orden', () => {
  // 60 + 45 + 48,70 = 153,70 € > 150 €
  const r = caso({ cuenta: { pnl_hoy: -60, posiciones: [{ id: 'P-1', perdida_si_stop: 45 }] } });
  soloFalla(r, 'perdida_max_dia',
    'Hoy llevas 60,00 € perdidos, las posiciones abiertas pueden perder 45,00 € más y esta orden 48,70 €: en el peor caso 153,70 € de un límite diario de 150,00 €.');
  assert.equal(r.cifras.hueco_dia, 45, 'a esta orden solo le quedan 150 − 60 − 45 = 45 €');
  // Justo en el límite: 56,30 + 45 + 48,69999 = 149,99999 → 150,00 € pasa.
  const justo = caso({ cuenta: { pnl_hoy: -56.3, posiciones: [{ id: 'P-1', perdida_si_stop: 45 }] } });
  assert.equal(justo.veredicto, 'PASA');
  assert.match(detalle(justo, 'perdida_max_dia'), /en el peor caso 150,00 € de un límite diario de 150,00 €\.$/);
  // Lo ganado hoy no compensa: max(0, −80) = 0 → 0 + 45 + 48,70 = 93,70 €.
  assert.match(detalle(caso({ cuenta: { pnl_hoy: 80, posiciones: [{ id: 'P-1', perdida_si_stop: 45 }] } }), 'perdida_max_dia'),
    /^Hoy llevas 0,00 € perdidos, .* en el peor caso 93,70 €/);
  // Posición sin perdida_si_stop: se calcula, 0,02 · 1363 = 27,26 € → 27,26 + 48,70 = 75,96 €.
  assert.match(detalle(caso({ cuenta: { posiciones: [{ id: 'P-2', btc: 0.02, precio_entrada: 61000, stop: 60000 }] } }), 'perdida_max_dia'),
    /las posiciones abiertas pueden perder 27,26 € más y esta orden 48,70 €: en el peor caso 75,96 €/);
  // Sin pnl_hoy: cuenta como 0, con aviso.
  const sinPnl = comprobar({ orden: ORDEN, cuenta: { efectivo: 5000, capital: 5000, operaciones_hoy: 0, posiciones: [] }, config: CONFIG, contexto: CONTEXTO });
  assert.equal(sinPnl.veredicto, 'PASA');
  assert.deepEqual(sinPnl.avisos, ['La cuenta no trae pnl_hoy: se cuenta como 0.']);
});

test('operaciones por día', () => {
  soloFalla(caso({ cuenta: { operaciones_hoy: 3 } }), 'operaciones_dia',
    'Hoy (2026-11-14, Madrid) llevas 3 operaciones; con esta serían 4 y el máximo es 3.');
  assert.equal(caso({ cuenta: { operaciones_hoy: 2 } }).veredicto, 'PASA');
  assert.equal(detalle(caso({ cuenta: { operaciones_hoy: 1 } }), 'operaciones_dia'),
    'Hoy (2026-11-14, Madrid) llevas 1 operación; con esta serían 2 y el máximo es 3.');
  soloFalla(caso({ cuenta: { operaciones_hoy: 'dos' } }), 'operaciones_dia',
    'La cuenta no trae operaciones_hoy (llegó "dos"): no se puede comprobar.');
});

test('R:R mínimo (bruto; el neto de costes se enseña)', () => {
  // 1400 / 1000 = 1,4 < 1,5; neto (1400 − 183 − 62400·0,0025 = 1061) / 1363 = 0,778… → 0,78
  soloFalla(caso({ orden: { objetivo: 62400 } }), 'rr_minimo',
    'Ganas 1,4 por cada 1 que arriesgas (0,78 contando comisiones y deslizamiento); el mínimo es 1,5.');
  // Justo 1,5 pasa; 1,4999 no, y se enseña con los decimales que hacen falta.
  assert.equal(caso({ orden: { objetivo: 62500 } }).veredicto, 'PASA');
  assert.match(detalle(caso({ orden: { objetivo: 62499.9 } }), 'rr_minimo'), /^Ganas 1,4999 por cada 1 que arriesgas/);
});

test('tamaño máximo de la posición', () => {
  soloFalla(caso({ config: conRiesgo({ posicion_max_pct: 30 }) }), 'posicion_max',
    'La posición cuesta 2.186,07 € con costes, el 43,7 % de tu capital (5.000,00 €); el máximo es el 30 % (1.500,00 €).');
  soloFalla(caso({ cuenta: { capital: 0 } }), 'posicion_max', 'Tu capital es 0,00 €: no hay con qué abrir una posición.');
});

test('efectivo disponible: el nominal cabe pero con costes no', () => {
  // 2179,53 ≤ 2180 (sin apalancamiento, bien) pero 2186,07 > 2180: faltan 6,07 €.
  soloFalla(caso({ cuenta: { efectivo: 2180 } }), 'efectivo',
    'Con comisión y deslizamiento la compra cuesta 2.186,07 € y solo tienes 2.180,00 € libres (faltan 6,07 €).');
});

test('ventana de entrada en horas UTC (también cruzando la medianoche)', () => {
  assert.equal(detalle(caso({ config: conRiesgo({ ventana_entrada_utc: [8, 20] }) }), 'ventana_entrada'),
    'Son las 10:20 UTC (14/11/2026 11:20 en Madrid) y tu ventana de entrada es de 08:00 a 20:00 UTC.');
  soloFalla(caso({ config: conRiesgo({ ventana_entrada_utc: [12, 20] }) }), 'ventana_entrada',
    'Son las 10:20 UTC (14/11/2026 11:20 en Madrid) y tu ventana de entrada es de 12:00 a 20:00 UTC: fuera de ella no se entra.');
  assert.equal(caso({ config: conRiesgo({ ventana_entrada_utc: ['08:30', '20:00'] }) }).veredicto, 'PASA');
  // [22, 6]: de 22:00 a 06:00 UTC. A las 10:20 fuera; a las 05:59 dentro.
  assert.deepEqual(fallan(caso({ config: conRiesgo({ ventana_entrada_utc: [22, 6] }) })), ['ventana_entrada']);
  const deMadrugada = Date.UTC(2026, 10, 14, 5, 59);
  assert.equal(caso({ config: conRiesgo({ ventana_entrada_utc: [22, 6] }), contexto: { ahora: deMadrugada } }).veredicto, 'PASA');
  soloFalla(caso({ config: conRiesgo({ ventana_entrada_utc: 'mañana' }) }), 'ventana_entrada',
    'config.riesgo.ventana_entrada_utc no se entiende ("mañana"): debe ser null o [desde, hasta] en horas UTC, por ejemplo [8, 20].');
  assert.deepEqual(fallan(caso({ config: conRiesgo({ ventana_entrada_utc: [8, 8] }) })), ['ventana_entrada']);
  assert.deepEqual(fallan(caso({ config: conRiesgo({ ventana_entrada_utc: [8, 25] }) })), ['ventana_entrada']);
});

test('noticia de alto impacto reciente: bloquea durante bloqueo_noticias_min minutos', () => {
  const hace = min => new Date(AHORA - min * 60_000).toISOString();
  // 10:08 UTC + 30 min = 10:38 UTC = 11:38 en Madrid
  soloFalla(caso({ contexto: { noticias_alto_impacto: [{ titulo: 'La SEC demanda a un exchange', fecha: hace(12) }] } }), 'noticias',
    'Hace 12 min salió «La SEC demanda a un exchange», de alto impacto: espera a que pasen 30 min, hasta las 14/11/2026 11:38.');
  // Con dos, manda la más reciente.
  assert.equal(detalle(caso({ contexto: { noticias_alto_impacto: [{ titulo: 'Vieja', fecha: hace(25) }, { titulo: 'Nueva', fecha: hace(3) }] } }), 'noticias'),
    'Hace 3 min salió «Nueva» (y 1 otra), de alto impacto: espera a que pasen 30 min, hasta las 14/11/2026 11:47.');
  // «Menos de» 30 minutos: a los 30 ya no bloquea; tampoco a los 31.
  assert.equal(caso({ contexto: { noticias_alto_impacto: [{ titulo: 'x', fecha: hace(30) }] } }).veredicto, 'PASA');
  assert.equal(caso({ contexto: { noticias_alto_impacto: [{ titulo: 'x', fecha: hace(31) }] } }).veredicto, 'PASA');
  // Fecha en ms y en el futuro cercano (evento con hora): también bloquea.
  assert.equal(detalle(caso({ contexto: { noticias_alto_impacto: [{ titulo: 'La Fed decide tipos', fecha: AHORA + 10 * 60_000 }] } }), 'noticias'),
    'Dentro de 10 minutos sale «La Fed decide tipos», de alto impacto: espera a que pasen 30 min, hasta las 14/11/2026 12:00.');
  assert.equal(detalle(caso({ contexto: { noticias_alto_impacto: [{ fecha: hace(0) }] } }), 'noticias'),
    'Hace menos de 1 min salió «sin título», de alto impacto: espera a que pasen 30 min, hasta las 14/11/2026 11:50.');
  // Fechas que no se entienden se ignoran; basura en la lista no rompe.
  assert.equal(caso({ contexto: { noticias_alto_impacto: [{ titulo: 'x', fecha: 'ayer' }, null, 7] } }).veredicto, 'PASA');
  // Con bloqueo 0 no bloquea nunca.
  assert.equal(caso({ config: conRiesgo({ bloqueo_noticias_min: 0 }), contexto: { noticias_alto_impacto: [{ titulo: 'x', fecha: hace(0) }] } }).veredicto, 'PASA');
  // Sin datos de noticias: pasa, pero lo avisa.
  const sinDatos = caso({ contexto: { noticias_alto_impacto: null } });
  assert.equal(sinDatos.veredicto, 'PASA');
  assert.deepEqual(sinDatos.avisos, ['No llegaron las noticias de alto impacto: no se ha podido comprobar si acaba de salir alguna.']);
});

test('divergencia entre exchanges', () => {
  soloFalla(caso({ contexto: { divergencia_pct: 0.62 } }), 'divergencia',
    'Los exchanges se separan un 0,62 % entre sí; el máximo es 0,50 %. Algún dato está mal o el mercado está muy nervioso: espera a que se igualen.');
  assert.equal(caso({ contexto: { divergencia_pct: 0.5 } }).veredicto, 'PASA');
  assert.match(detalle(caso({ contexto: { divergencia_pct: 0.5004 } }), 'divergencia'), /^Los exchanges se separan un 0,5004 % entre sí; el máximo es 0,50 %\./);
  const sinDatos = caso({ contexto: { divergencia_pct: undefined } });
  assert.equal(sinDatos.veredicto, 'PASA');
  assert.deepEqual(sinDatos.avisos, ['No llegó la comparación de precios entre exchanges: no se ha podido comprobar que coincidan.']);
});

test('coherencia: stop < entrada < objetivo, números válidos y mínimo de orden', () => {
  const r = caso({ orden: { stop: 61500 } });
  const sinComprobar = 'Sin comprobar: la orden no trae BTC, entrada, stop y objetivo válidos y en orden.';
  assert.deepEqual(fallan(r), ['perdida_max_operacion', 'perdida_max_dia', 'rr_minimo', 'coherencia']);
  assert.equal(detalle(r, 'coherencia'), 'En una compra tiene que ser stop < entrada < objetivo, y llegó stop 61.500,00 €, entrada 61.000,00 €, objetivo 63.000,00 €.');
  assert.deepEqual(r.motivos, [sinComprobar, detalle(r, 'coherencia')], 'los motivos no se repiten');
  soloFalla(caso({ orden: { btc: 0.000005 } }), 'coherencia', '0,00000500 BTC no llega al mínimo de orden (0,00001000 BTC).');
  const roto = caso({ orden: { btc: NaN, objetivo: null } });
  assert.equal(roto.veredicto, 'BLOQUEADA');
  assert.equal(detalle(roto, 'coherencia'), 'La orden no trae btc, objetivo como números positivos.');
  assert.equal(detalle(roto, 'efectivo'), sinComprobar);
  assert.deepEqual(roto.cifras.perdida_si_stop, null);
  assert.equal(detalle(caso({ orden: { lado: 'arriba' } }), 'coherencia'), 'El lado de la orden no vale ("arriba").');
});

test('el precio de ahora tiene que seguir cerca de la entrada', () => {
  // 400 / 61000 = 0,6557 % > 0,6 %
  soloFalla(caso({ contexto: { precio_actual: 61400 } }), 'precio_cerca',
    'El precio ahora (61.400,00 €) está a un 0,66 % de tu entrada (61.000,00 €); el máximo es 0,60 %: la entrada ya no vale, recalcula el plan.');
  soloFalla(caso({ contexto: { precio_actual: null } }), 'precio_cerca', 'No llegó el precio actual: no se puede comprobar que la entrada siga cerca.');
  // 366 / 61000 = 0,6 % justo: pasa.
  assert.equal(caso({ contexto: { precio_actual: 60634 } }).veredicto, 'PASA');
  // 369 / 61000 = 0,6049 %: con 2 decimales se vería igual que el límite, así que se enseña con 3.
  assert.equal(detalle(caso({ contexto: { precio_actual: 61369 } }), 'precio_cerca'),
    'El precio ahora (61.369,00 €) está a un 0,605 % de tu entrada (61.000,00 €); el máximo es 0,60 %: la entrada ya no vale, recalcula el plan.');
});

test('el día es el de Madrid, también en el cambio de hora de octubre', () => {
  // 25/10/2026: a las 01:00 UTC Madrid pasa de UTC+2 a UTC+1.
  const ms = iso => Date.parse(iso);
  const cartera = {
    moneda: 'EUR', saldo_inicial: 5000, efectivo: 4930, posiciones: [],
    historial: [
      // Abierta el 24 a las 23:59 de Madrid (21:59 UTC, verano) y cerrada el 25 a las 00:10: cuenta en el pnl del 25, no en sus operaciones.
      { id: 'P-20261024-1', abierta: ms('2026-10-24T21:59:00Z'), cerrada: ms('2026-10-24T22:10:00Z'), pnl: -40 },
      // Abierta el 25 a las 00:30 de Madrid (22:30 UTC del 24) y cerrada tras el cambio: cuenta en las dos.
      { id: 'P-20261025-1', abierta: ms('2026-10-24T22:30:00Z'), cerrada: ms('2026-10-25T01:30:00Z'), pnl: -30 },
    ],
  };
  const orden = { ...ORDEN };
  const a = comprobar({ orden, cuenta: cartera, config: CONFIG, contexto: { ...CONTEXTO, ahora: ms('2026-10-25T22:59:00Z'), precio_actual: 61000 } });
  assert.equal(a.dia, '2026-10-25'); // 23:59 en Madrid (UTC+1)
  assert.equal(detalle(a, 'operaciones_dia'), 'Hoy (2026-10-25, Madrid) llevas 1 operación; con esta serían 2 y el máximo es 3.');
  assert.equal(detalle(a, 'perdida_max_dia'),
    'Hoy llevas 70,00 € perdidos, las posiciones abiertas pueden perder 0,00 € más y esta orden 48,70 €: en el peor caso 118,70 € de un límite diario de 150,00 €.');
  // Un minuto después ya es el 26 en Madrid: se empieza de cero.
  const b = comprobar({ orden, cuenta: cartera, config: CONFIG, contexto: { ...CONTEXTO, ahora: ms('2026-10-25T23:00:00Z'), precio_actual: 61000 } });
  assert.equal(b.dia, '2026-10-26');
  assert.equal(detalle(b, 'operaciones_dia'), 'Hoy (2026-10-26, Madrid) llevas 0 operaciones; con esta serían 1 y el máximo es 3.');
  assert.match(detalle(b, 'perdida_max_dia'), /^Hoy llevas 0,00 € perdidos/);
  // Un resumen hecho otro día no vale.
  const viejo = caso({ cuenta: { dia: '2026-11-13' } });
  assert.deepEqual(fallan(viejo), ['perdida_max_dia', 'operaciones_dia']);
  assert.deepEqual(viejo.motivos, ['El resumen de la cartera es del 2026-11-13 y hoy es 2026-11-14 (día de Madrid): vuelve a calcularlo.']);
  assert.equal(caso({ cuenta: { dia: '2026-11-14' } }).veredicto, 'PASA');
});

test('entradas raras: errores claros y sin TypeError', () => {
  assert.throws(() => comprobar(), /comprobar: falta la orden/);
  assert.throws(() => comprobar({ orden: ORDEN }), /comprobar: falta la cuenta/);
  assert.throws(() => comprobar({ orden: ORDEN, cuenta: [] }), /comprobar: falta la cuenta/);
  assert.throws(() => comprobar({ orden: ORDEN, cuenta: CUENTA, config: conRiesgo({ perdida_max_dia: -1 }) }),
    /config\.riesgo\.perdida_max_dia debe ser un número mayor que 0 \(llegó -1\)/);
  // Sin contexto: sin precio actual bloquea; noticias y divergencia avisan.
  const sinContexto = comprobar({ orden: ORDEN, cuenta: CUENTA, config: CONFIG });
  assert.equal(sinContexto.veredicto, 'BLOQUEADA');
  assert.ok(fallan(sinContexto).includes('precio_cerca'));
  assert.equal(sinContexto.avisos.length, 2);
  // Cuenta vacía: las reglas de dinero no se pueden comprobar y bloquean.
  const vacia = comprobar({ orden: ORDEN, cuenta: {}, config: CONFIG, contexto: CONTEXTO });
  assert.deepEqual(fallan(vacia), ['sin_apalancamiento', 'operaciones_dia', 'posicion_max', 'efectivo']);
  assert.match(textoRiesgo(vacia), /^Gestor de riesgo: BLOQUEADA\.\n/);
  assert.match(textoRiesgo(vacia), /✘ Efectivo disponible: La cuenta no trae el efectivo: no se puede comprobar\./);
  assert.throws(() => textoRiesgo(null), /falta el resultado de comprobar/);
});

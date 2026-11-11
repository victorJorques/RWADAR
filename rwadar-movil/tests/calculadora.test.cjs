'use strict';

/* «Calcula tus números» (11/11/2026): el motor común de la web y la app
   (lib/calculadora.js). Cada caso va calculado a mano en su comentario;
   el código solo comprueba que el motor da lo mismo. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const c = require('../lib/calculadora');

const RAIZ = path.resolve(__dirname, '../..');
const casi = (real, esperado, msg, tol = 0.005) => assert.ok(Math.abs(real - esperado) <= tol, `${msg || ''}: ${real} ≠ ${esperado}`);
const calc = (entradas) => c.calcular(c.validarEntradas({ comisionAnual: '', comisionEntrada: '', impuestos: '', ...entradas }));
/* El motor pone un espacio que no se parte entre la cifra y «€» o «%»
   («1.000\u00a0€»): aquí se escribe con espacio normal y se convierte. */
const nb = (x) => (typeof x === 'string' ? x.replace(/(\d) (€|%)/g, '$1\u00a0$2')
  : Array.isArray(x) ? x.map(nb) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, nb(v)])) : x);
const eq = (real, esperado, msg) => assert.deepStrictEqual(real, nb(esperado), msg);
const sinRaros = (x) => assert.doesNotMatch(JSON.stringify(x), /NaN|Infinity/, 'sin NaN ni Infinity');

/* ---- Leer lo que escribe la persona ---- */
test('1 · acepta coma o punto decimal y puntos de miles: «10.000», «2,5», «1.234,56», «1,234.56», «300 000», «−3»', () => {
  const v = (t, o) => c.leerNumero(t, o).valor;
  eq(v('10.000'), 10000);
  eq(v('1.000.000'), 1000000);
  eq(v('1,000'), 1000, 'una marca y tres cifras, en un importe: miles');
  eq(v('2,5'), 2.5);
  eq(v('2.5'), 2.5);
  eq(v('1.234,56'), 1234.56);
  eq(v('1,234.56'), 1234.56);
  eq(v('300 000'), 300000);
  eq(v('10.000,5 €'), 10000.5);
  eq(v('−3'), -3);
  eq(v('+4 %'), 4);
  eq(v('5 años'), 5);
  // Lo que no es de miles: «0,500» y «1234.567» son decimales; en un porcentaje, «2.840» es 2,84.
  eq(v('0,500'), 0.5);
  eq(v('1234.567'), 1234.567);
  eq(v('2.840', { miles: false }), 2.84);
  // A medio escribir no salta un error: «12,» vale 12 y «,5», 0,5.
  eq(v('12,'), 12);
  eq(v(',5'), 0.5);
});

test('2 · entradas raras: texto, exponentes, marcas mal puestas, vacío, null, NaN e Infinity dan un error y nunca un número', () => {
  for (const t of ['abc', '1e5', 'Infinity', '1.2.3', '1.000.', '1..0', '12,34,5', '1.234,5.6', '-', '.', '€', '4%%x', '0x10']) {
    eq(c.leerNumero(t).ok, false, t);
  }
  eq(c.leerNumero(''), { ok: false, error: 'vacio' });
  eq(c.leerNumero('   '), { ok: false, error: 'vacio' });
  eq(c.leerNumero(null), { ok: false, error: 'vacio' });
  eq(c.leerNumero(Number.NaN), { ok: false, error: 'formato' });
  eq(c.leerNumero(Infinity), { ok: false, error: 'formato' });
  eq(c.leerNumero(-0).valor, 0);
});

/* ---- Validar ---- */
test('3 · límites: 1 € a 10.000.000 €, −20 % a 30 %, 1 a 40 años, comisiones de 0 a 10 % e impuestos de 0 a 50 %', () => {
  const base = { inversion: '1.000', rentabilidad: '4', anios: '5' };
  const error = (campo, valor) => c.validarEntradas({ ...base, [campo]: valor }).errores[campo]?.codigo;
  eq(error('inversion', '0'), 'rango');
  eq(error('inversion', '0,99'), 'rango');
  eq(error('inversion', '1'), undefined);
  eq(error('inversion', '10.000.000'), undefined);
  eq(error('inversion', '10.000.001'), 'rango');
  eq(error('rentabilidad', '-20'), undefined);
  eq(error('rentabilidad', '-20,01'), 'rango');
  eq(error('rentabilidad', '30'), undefined);
  eq(error('rentabilidad', '31'), 'rango');
  eq(error('anios', '0'), 'rango');
  eq(error('anios', '41'), 'rango');
  eq(error('anios', '2,5'), 'entero');
  eq(error('comisionAnual', '10,5'), 'rango');
  eq(error('comisionAnual', '-1'), 'rango');
  eq(error('comisionEntrada', '11'), 'rango');
  eq(error('impuestos', '51'), 'rango');
  eq(error('impuestos', '50'), undefined);
  eq(error('inversion', ''), 'vacio');
  eq(error('inversion', 'mil'), 'formato');
  // Fuera de los límites, un mensaje claro (y nada que calcular).
  const v = c.validarEntradas({ ...base, inversion: '20.000.000', rentabilidad: '45', anios: '2,5' });
  eq(v.ok, false);
  eq(c.calcular(v), null);
  eq(c.mensajeError(v.errores.inversion), 'Pon entre 1 € y 10.000.000 €.');
  eq(c.mensajeError(v.errores.rentabilidad), 'Pon entre −20 % y 30 %.');
  eq(c.mensajeError(v.errores.anios), 'Pon un número entero de años, de 1 a 40.');
  eq(c.mensajeError({ codigo: 'rango', campo: 'anios' }), 'Pon entre 1 y 40 años.');
  eq(c.mensajeError({ codigo: 'rango', campo: 'impuestos' }), 'Pon entre 0 % y 50 %.');
  eq(c.mensajeError({ codigo: 'formato', campo: 'inversion' }), 'Escribe solo números, por ejemplo 1.000 o 2,5.');
  eq(c.mensajeError({ codigo: 'rango', campo: 'inversion' }, 'en'), 'Enter between €1 and €10,000,000.');
  const r = c.resumen(null);
  eq(r.signo, 'error');
  eq(r.titular, 'Revisa los datos marcados para ver el resultado.');
  eq(c.pasos(null), []);
  eq(c.barras(null), null);
});

test('4 · los opcionales vacíos: comisiones 0, impuestos vacíos = sin impuestos, activo y precio sin usar; el modo raro vuelve a «Lo cobro»', () => {
  const v = c.validarEntradas({ inversion: '1000', rentabilidad: '4', anios: '5', comisionAnual: '', comisionEntrada: ' ', impuestos: '', valorActivo: '', precioParticipacion: null, modo: 'otro' });
  eq(v.ok, true);
  eq(v.valores, { inversion: 1000, rentabilidad: 4, anios: 5, comisionAnual: 0, comisionEntrada: 0, impuestos: 0, valorActivo: null, precioParticipacion: null, modo: 'cobrar' });
  // El ejemplo de partida: 1.000 €, 4 %, 5 años, «Lo cobro» e impuestos del 19 %; importes rápidos de 500 a 10.000 €.
  eq({ ...c.PREDETERMINADOS }, { inversion: 1000, rentabilidad: 4, anios: 5, modo: 'cobrar', comisionAnual: 0, comisionEntrada: 0, impuestos: 19, valorActivo: null, precioParticipacion: null });
  eq([...c.IMPORTES_RAPIDOS], [500, 1000, 5000, 10000]);
});

/* ---- Cobrar: interés simple, impuestos cada año sobre lo cobrado ---- */
test('5 · el ejemplo: 1.000 € al 4 % durante 5 años, lo cobro, impuestos 19 %', () => {
  // 1.000 × 4 % = 40 € al año; impuestos 40 × 19 % = 7,60 €; cobras 32,40 € (2,70 € al mes).
  // En 5 años, 5 × 32,40 = 162 €; tendrías 1.000 + 162 = 1.162 €; media 162 / 1.000 / 5 = 3,24 % al año.
  const r = calc({ inversion: '1.000', rentabilidad: '4', anios: '5', modo: 'cobrar', impuestos: '19' });
  casi(r.primerAnio.bruto, 40); casi(r.primerAnio.impuestos, 7.6); casi(r.primerAnio.neto, 32.4); casi(r.primerAnio.mes, 2.7);
  casi(r.cobradoNeto, 162); casi(r.cobradoBruto, 200); casi(r.impuestos, 38);
  casi(r.finalBruto, 1200); casi(r.finalNeto, 1162); casi(r.gananciaNeta, 162); casi(r.rentNetaAnual, 3.24, 'media', 1e-9);
  eq(r.tipoMedia, 'simple');
  eq(r.tabla.map((f) => Math.round(f.valorNeto * 100) / 100), [1032.4, 1064.8, 1097.2, 1129.6, 1162]);
  assert.ok(r.tabla.every((f) => f.capitalFin === 1000), 'si cobras, el capital no crece');
  eq(c.resumen(r), { signo: 'gana', titular: 'Cobrarías unos 32,40 € al año (2,70 € al mes)',
    detalle: 'Ganancia neta en 5 años: 162 €, un 3,24 % al año, ya con impuestos.' });
});

test('6 · lo cobro, sin impuestos ni comisiones: 10.000 € al 5 % durante 10 años', () => {
  // 10.000 × 5 % = 500 € al año, 41,67 € al mes; 10 × 500 = 5.000 €; tendrías 15.000 €; media 5 %.
  const r = calc({ inversion: '10.000', rentabilidad: '5', anios: '10', modo: 'cobrar' });
  casi(r.primerAnio.neto, 500); casi(r.primerAnio.mes, 41.67); casi(r.finalNeto, 15000); casi(r.rentNetaAnual, 5, 'media', 1e-9);
  eq(c.resumen(r).titular, 'Cobrarías unos 500 € al año (41,67 € al mes)');
  eq(c.resumen(r).detalle, 'Ganancia neta en 10 años: 5.000 €, un 5,00 % al año, sin comisiones ni impuestos.');
});

test('7 · comisión anual sobre el capital: 10.000 € al 5 % con un 1 % de comisión, lo cobro un año', () => {
  // Rendimiento 500 €; comisión 10.000 × 1 % = 100 €; cobras 400 €.
  const r = calc({ inversion: '10000', rentabilidad: '5', anios: '1', modo: 'cobrar', comisionAnual: '1' });
  casi(r.primerAnio.bruto, 500); casi(r.primerAnio.comision, 100); casi(r.primerAnio.neto, 400); casi(r.comisiones, 100);
  eq(c.resumen(r).detalle, 'Ganancia neta en 1 año: 400 €, un 4,00 % al año, ya con comisiones, sin impuestos.');
});

test('8 · impuestos sobre lo cobrado ya sin comisión, nunca sobre el capital: 10.000 € al 6 %, 1 % de comisión, 20 % de impuestos, 3 años', () => {
  // Cada año: 600 − 100 = 500 €; impuestos 100 €; cobras 400 €. En 3 años, 1.200 €; impuestos 300 €; tendrías 11.200 €.
  const r = calc({ inversion: '10000', rentabilidad: '6', anios: '3', modo: 'cobrar', comisionAnual: '1', impuestos: '20' });
  casi(r.primerAnio.impuestos, 100); casi(r.cobradoNeto, 1200); casi(r.impuestos, 300); casi(r.finalNeto, 11200); casi(r.rentNetaAnual, 4, '', 1e-9);
});

test('9 · lo cobro con rentabilidad negativa: no se cobra nada, la pérdida baja el capital y no hay impuestos', () => {
  // 1.000 € al −10 %: año 1, −100 € → 900 €; año 2, −90 € → 810 €. Pierdes 190 €.
  const r = calc({ inversion: '1000', rentabilidad: '-10', anios: '2', modo: 'cobrar', impuestos: '19' });
  eq(r.tabla.map((f) => [f.cobrado, f.impuestos, f.capitalFin]), [[0, 0, 900], [0, 0, 810]]);
  casi(r.impuestos, 0); casi(r.finalNeto, 810); casi(r.gananciaNeta, -190); casi(r.rentNetaAnual, -9.5, '', 1e-9);
  eq(c.resumen(r), { signo: 'pierde', titular: 'No cobrarías nada: al cabo de 2 años tendrías 810 €', detalle: 'Pierdes 190 € de lo que pusiste.' });
});

test('10 · rentabilidad 0: ni ganas ni pierdes (y no dice «pierdes 0 €»)', () => {
  const r = calc({ inversion: '1000', rentabilidad: '0', anios: '3', modo: 'cobrar', impuestos: '19' });
  eq(c.resumen(r), { signo: 'igual', titular: 'No cobrarías nada: al cabo de 3 años tendrías 1.000 €', detalle: 'Lo mismo que pusiste: ni ganas ni pierdes.' });
  const re = calc({ inversion: '1000', rentabilidad: '0', anios: '3', modo: 'reinvertir', impuestos: '19' });
  eq(c.resumen(re).detalle, 'Lo mismo que pusiste: ni ganas ni pierdes.');
});

/* ---- Reinvertir: interés compuesto, impuestos al final sobre la ganancia ---- */
test('11 · reinvierto, sin impuestos: 10.000 € al 5 % durante 10 años', () => {
  // 10.000 × 1,05^10 = 16.288,95 €.
  const r = calc({ inversion: '10.000', rentabilidad: '5', anios: '10', modo: 'reinvertir' });
  casi(r.finalBruto, 16288.95); casi(r.finalNeto, 16288.95); casi(r.gananciaNeta, 6288.95); casi(r.rentNetaAnual, 5, '', 1e-9);
  eq(r.tipoMedia, 'compuesta');
  eq(c.resumen(r).titular, 'Al cabo de 10 años tendrías unos 16.289 €');
});

test('12 · reinvierto, impuestos al final sobre la ganancia acumulada: 1.000 € al 4 %, 5 años, 19 %', () => {
  // 1.000 × 1,04^5 = 1.216,65 €; ganancia 216,65 €; impuestos 19 % = 41,16 €; neto 1.175,49 €.
  // Equivale a (1.175,49 / 1.000)^(1/5) − 1 = 3,29 % al año.
  const r = calc({ inversion: '1.000', rentabilidad: '4', anios: '5', modo: 'reinvertir', impuestos: '19' });
  casi(r.finalBruto, 1216.65); casi(r.impuestosFinales, 41.16); casi(r.finalNeto, 1175.49); casi(r.gananciaNeta, 175.49);
  casi(r.rentNetaAnual, 3.2865, '', 0.0001);
  assert.ok(r.tabla.every((f) => f.impuestos === 0), 'ningún impuesto por el camino');
  eq(c.resumen(r), { signo: 'gana', titular: 'Al cabo de 5 años tendrías unos 1.175 €',
    detalle: 'Ganancia neta: 175,49 €, como un 3,3 % al año, ya con impuestos.' });
});

test('13 · reinvierto con comisión anual: 10.000 € al 5 % con un 1 % de comisión, 2 años', () => {
  // 10.000 × (1 + 5 % − 1 %)^2 = 10.816 €.
  const r = calc({ inversion: '10000', rentabilidad: '5', anios: '2', modo: 'reinvertir', comisionAnual: '1' });
  casi(r.finalBruto, 10816); casi(r.comisiones, 100 + 104);
});

test('14 · reinvierto con pérdida: sin ganancia no hay impuesto (nunca se paga sobre el capital)', () => {
  // 1.000 × 0,9^2 = 810 €; impuestos 0.
  const r = calc({ inversion: '1000', rentabilidad: '-10', anios: '2', modo: 'reinvertir', impuestos: '19' });
  casi(r.finalBruto, 810); eq(r.impuestosFinales, 0); casi(r.finalNeto, 810);
  eq(c.resumen(r).detalle, 'Pierdes 190 € de lo que pusiste.');
});

/* ---- Comisión de entrada y participaciones ---- */
test('15 · comisión de entrada: se invierte lo que queda y cuenta como lo que pagas (1.000 €, 2 %, 10 %, 2 años, 20 %)', () => {
  // Se invierten 980 €; 980 × 1,1^2 = 1.185,80 €; ganancia sobre los 1.000 € pagados = 185,80 €;
  // impuestos 37,16 €; neto 1.148,64 €; ganancia neta 148,64 €.
  const r = calc({ inversion: '1000', rentabilidad: '10', anios: '2', modo: 'reinvertir', comisionEntrada: '2', impuestos: '20' });
  casi(r.capital, 980); casi(r.comisionEntrada, 20); casi(r.finalBruto, 1185.8); casi(r.impuestosFinales, 37.16); casi(r.finalNeto, 1148.64); casi(r.gananciaNeta, 148.64);
  // Lo cobro: 980 × 5 % = 49 € al año; tendrías 980 + 49 = 1.029 €.
  const s = calc({ inversion: '1000', rentabilidad: '5', anios: '1', modo: 'cobrar', comisionEntrada: '2' });
  casi(s.primerAnio.neto, 49); casi(s.finalNeto, 1029); casi(s.gananciaNeta, 29);
});

test('16 · precio de participación: cuántas compras y lo que sobra (1.000 € en participaciones de 300 €)', () => {
  // ⌊1.000 / 300⌋ = 3 participaciones = 900 €; sobran 100 €, que no se invierten.
  const r = calc({ inversion: '1000', rentabilidad: '5', anios: '1', modo: 'cobrar', precioParticipacion: '300' });
  eq(r.participaciones, 3); casi(r.capital, 900); casi(r.pagado, 900); casi(r.sobra, 100); casi(r.primerAnio.neto, 45);
  eq(c.pasos(r).slice(0, 3), [{ op: 'Lo que pones', res: '1.000 €' },
    { op: 'Participaciones de 300 € que compras', res: '3 (900 €)' }, { op: 'Te sobra (no se invierte)', res: '100 €' }]);
});

test('17 · participaciones con comisión de entrada: 1.000 €, 5 %, participaciones de 100 €', () => {
  // Llegan 950 €: 9 participaciones (900 €). Pagas 900 / 0,95 = 947,37 € (comisión 47,37 €) y te sobran 52,63 €.
  const r = calc({ inversion: '1000', rentabilidad: '5', anios: '1', modo: 'cobrar', comisionEntrada: '5', precioParticipacion: '100' });
  eq(r.participaciones, 9); casi(r.capital, 900); casi(r.pagado, 947.37); casi(r.comisionEntrada, 47.37); casi(r.sobra, 52.63);
  // 45 € cobrados sobre 947,37 € pagados: tendrías 945 €, −2,37 €.
  casi(r.finalNeto, 945); casi(r.gananciaNeta, -2.37);
  // Sin llegar a una participación, un mensaje claro.
  const v = c.validarEntradas({ inversion: '50', rentabilidad: '5', anios: '1', precioParticipacion: '100' });
  eq(v.errores.precioParticipacion.codigo, 'sin-participaciones');
  eq(c.mensajeError(v.errores.precioParticipacion), 'Con 50 € no llegas a una participación de 100 €: sube lo que inviertes o baja el precio.');
});

/* ---- El activo entero (el ejemplo del explicador, ya sin fijar) ---- */
test('18 · el local de 300.000 € en trozos de 100 €: 2.500 € al 6 % son 25 trozos, el 0,83 % y 150 € al año', () => {
  // 300.000 / 100 = 3.000 trozos; 2.500 / 100 = 25 trozos; 25 / 3.000 = 0,8333 %; el local renta 18.000 €; tu parte, 150 €.
  const r = calc({ inversion: '2.500', rentabilidad: '6', anios: '1', modo: 'cobrar', valorActivo: '300.000', precioParticipacion: '100' });
  eq(r.participaciones, 25); eq(r.participacionesTotales, 3000);
  casi(r.porcentajeActivo, 0.8333, '', 0.0001); casi(r.rentaActivo, 18000); casi(r.primerAnio.bruto, 150);
  eq(c.tituloExplicador(c.EJEMPLO_EXPLICADOR), 'Un local de 300.000 €, partido en 3.000 trozos de 100 €');
  eq(c.tituloExplicador({ valorActivo: 250000, precioParticipacion: 300 }), 'Un local de 250.000 €, partido en unos 833 trozos de 300 €');
  eq(c.tituloExplicador(c.EJEMPLO_EXPLICADOR, 'en'), 'A €300,000 property divided into 3,000 units of €100');
  const pasos = c.pasos(r).map((p) => p.op);
  assert.ok(pasos.includes(nb('Parte del activo de 300.000 € que es tuya (25 de 3.000)')));
  assert.ok(pasos.includes(nb('El activo entero rinde un 6,0 % al año')));
  // Lo que inviertes no puede valer más que el activo entero.
  const v = c.validarEntradas({ inversion: '5.000', rentabilidad: '6', anios: '1', valorActivo: '1.000' });
  eq(c.mensajeError(v.errores.valorActivo), 'El activo no puede valer menos de lo que inviertes: revisa los dos importes.');
});

/* ---- Formato, tabla, gráfico y textos ---- */
test('19 · formato español «1.234,56 €» y «4,0 %»; en inglés «€1,234.56» y «4.0%»; negativos con «−»', () => {
  eq(c.euros(1234.56), '1.234,56 €');
  eq(c.euros(1000), '1.000 €');
  eq(c.euros(32.4), '32,40 €');
  eq(c.euros(-125), '−125 €');
  eq(c.euros(1234.56, 'en'), '€1,234.56');
  eq(c.euros(-125, 'en'), '−€125');
  eq(c.porcentaje(4), '4,0 %');
  eq(c.porcentaje(3.2865, 'es', 2), '3,29 %');
  eq(c.porcentaje(4, 'en'), '4.0%');
  eq(c.eurosAprox(42762.03), '42.762 €');
  eq(c.eurosAprox(32.4), '32,40 €');
  eq(c.euros(Number.NaN), '—');
  eq(c.porcentaje(Infinity), '—');
  eq(c.numero(1.005, 'es', 2), '1,01', 'redondeo sin el error de coma flotante');
  // Lo que se escribe en el campo al salir: con su formato y sin cambiar la cifra.
  eq(c.valorCampo(1000, 'es', 'inversion'), '1.000');
  eq(c.valorCampo(1000.5, 'es', 'inversion'), '1.000,50');
  eq(c.valorCampo(2.845, 'es', 'rentabilidad'), '2,845');
  eq(c.valorCampo(-3, 'es', 'rentabilidad'), '-3');
  eq(c.valorCampo(10000, 'en', 'inversion'), '10,000');
});

test('20 · la tabla año a año y el capital: una fila por año, y la última cuadra con el final', () => {
  const r = calc({ inversion: '5.000', rentabilidad: '7', anios: '12', modo: 'reinvertir', impuestos: '21', comisionAnual: '0,5' });
  eq(r.tabla.length, 12);
  eq(r.tabla.map((f) => f.anio), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  // Cada año: capital × (1 + 7 % − 0,5 %).
  r.tabla.forEach((f, i) => casi(f.capitalFin, 5000 * 1.065 ** (i + 1), `año ${i + 1}`, 1e-6));
  casi(r.tabla.at(-1).capitalFin, r.finalBruto, '', 1e-9);
  casi(r.tabla.at(-1).valorNeto, r.finalNeto, '', 1e-9);
  casi(r.finalNeto, 5000 + (5000 * 1.065 ** 12 - 5000) * 0.79, '', 1e-6);
  casi(r.rentNetaAnual, ((r.finalNeto / 5000) ** (1 / 12) - 1) * 100, '', 1e-9);
});

test('21 · los extremos no dan NaN ni Infinity: 10.000.000 € al 30 % durante 40 años, y 1 € al −20 % con un 10 % de comisión', () => {
  const grande = calc({ inversion: '10.000.000', rentabilidad: '30', anios: '40', modo: 'reinvertir', impuestos: '50', comisionAnual: '0' });
  sinRaros(grande); sinRaros(c.resumen(grande)); sinRaros(c.pasos(grande)); sinRaros(c.barras(grande));
  casi(grande.finalBruto, 1e7 * 1.3 ** 40, '', 1);
  const pequeno = calc({ inversion: '1', rentabilidad: '-20', anios: '40', modo: 'cobrar', comisionAnual: '10', comisionEntrada: '10', impuestos: '50' });
  sinRaros(pequeno); sinRaros(c.resumen(pequeno)); sinRaros(c.pasos(pequeno)); sinRaros(c.barras(pequeno));
  assert.ok(pequeno.finalNeto > 0 && pequeno.finalNeto < 1);
  eq(c.resumen(pequeno).signo, 'pierde');
});

test('22 · la cuenta paso a paso del ejemplo, entera: no hay nada escondido', () => {
  const r = calc({ inversion: '1.000', rentabilidad: '4', anios: '5', modo: 'cobrar', impuestos: '19' });
  eq(c.pasos(r), [
    { op: 'Lo que pones', res: '1.000 €' },
    { op: 'Rendimiento del primer año: 4,0 % de 1.000 €', res: '40 €' },
    { op: 'Impuestos del 19 % sobre lo que cobras', res: '−7,60 €' },
    { op: 'Cobras el primer año', res: '32,40 €' },
    { op: 'Cobrado en 5 años, ya con impuestos', res: '162 €' },
    { op: 'Tu capital al final', res: '1.000 €' },
    { op: 'Lo que tendrías al final, neto', res: '1.162 €' },
    { op: 'Ganancia neta (sobre los 1.000 € que pagas)', res: '162 €' },
    { op: 'Rentabilidad neta media al año', res: '3,24 %' },
  ]);
  const re = calc({ inversion: '1.000', rentabilidad: '4', anios: '5', modo: 'reinvertir', impuestos: '19' });
  eq(c.pasos(re).slice(2), [
    { op: 'Reinviertes 5 años: tu capital al final, antes de impuestos', res: '1.216,65 €' },
    { op: 'Impuestos del 19 % al vender, sobre lo ganado (216,65 €)', res: '−41,16 €' },
    { op: 'Lo que tendrías al final, neto', res: '1.175,49 €' },
    { op: 'Ganancia neta (sobre los 1.000 € que pagas)', res: '175,49 €' },
    { op: 'Rentabilidad neta equivalente al año (compuesta)', res: '3,3 %' },
  ]);
  // La regla de los impuestos, en una línea, y lo que no se afina.
  eq(c.notaImpuestos('cobrar'), 'Si cobras, pagas impuestos cada año sobre lo que cobras. Es una aproximación con un solo tipo: cada producto y cada persona pueden tributar distinto.');
  assert.match(c.notaImpuestos('reinvertir'), /^Si reinviertes, pagas impuestos al final, al vender, sobre lo ganado: en España un fondo o un token suele tributar así\./);
  assert.equal(c.IMPUESTOS_NOTA.es, 'En España, la ganancia del ahorro tributa del 19 % al 30 % según cuánto ganes.');
});

test('23 · en inglés, las mismas cifras con su formato', () => {
  const r = calc({ inversion: '1000', rentabilidad: '4', anios: '5', modo: 'cobrar', impuestos: '19' });
  eq(c.resumen(r, 'en'), { signo: 'gana', titular: 'You would receive about €32.40 a year (€2.70 a month)',
    detalle: 'Net gain over 5 years: €162, 3.24% a year, after tax.' });
  const re = calc({ inversion: '25000', rentabilidad: '6.5', anios: '10', modo: 'reinvertir', impuestos: '19' });
  assert.match(c.resumen(re, 'en').titular, /^After 10 years you would have about €42,762$/);
  eq(c.pasos(r, 'en')[0].op, 'What you put in');
});

test('24 · el minigráfico: una barra por año, lo que pones abajo y lo ganado arriba; rótulos 1, mitad y último con más de 6 años', () => {
  const r = calc({ inversion: '1000', rentabilidad: '4', anios: '5', modo: 'cobrar', impuestos: '19' });
  const g = c.barras(r, { ancho: 300, alto: 140, margenArriba: 20, margenAbajo: 20 });
  eq(g.barras.length, 5);
  eq(g.etiquetas, [1, 2, 3, 4, 5]);
  // La más alta (1.162 €) toca el techo; lo que pones (1.000 €) es la misma altura en todas.
  casi(g.barras[4].y, 20, '', 1e-9);
  assert.ok(g.barras.every((b) => Math.abs(b.yPuesto - g.yBase) < 1e-9 && b.gana && b.altoGanancia > 0));
  assert.ok(g.barras.every((b, i) => i === 0 || b.altoGanancia > g.barras[i - 1].altoGanancia));
  const total = g.barras.at(-1).x + g.barras.at(-1).ancho;
  casi(total, 300, 'ocupa el ancho', 1e-9);
  const largo = c.barras(calc({ inversion: '1000', rentabilidad: '4', anios: '40', modo: 'reinvertir' }));
  eq(largo.etiquetas, [1, 20, 40]);
  assert.ok(largo.barras.every((b) => b.ancho >= 2));
  // Con pérdidas, la barra queda por debajo de lo que pusiste y no pinta ganancia.
  const pierde = c.barras(calc({ inversion: '1000', rentabilidad: '-10', anios: '3', modo: 'reinvertir' }));
  assert.ok(pierde.barras.every((b) => !b.gana && b.altoGanancia === 0 && b.y > pierde.yBase));
});

/* ---- «Usa la rentabilidad de una oferta» ---- */
const oferta = (slug, extra = {}) => ({ slug, titulo: `Fondo ${slug}: con detalle`, plataformaNombre: 'Plataforma', coleccion: 'principales',
  estadoRevision: 'actual', verificadaEl: '2026-11-10', vigenciaDias: 7, rentabilidad: { mostrada: '2,84 %', literal: 'Cifra publicada.' },
  metricas: [{ etiqueta: 'Rentabilidad publicada · neta y variable · 09/11/2026', valor: '2,84 %' }], ...extra });

test('25 · las ofertas con rentabilidad publicada y vigente, del catálogo: nombre corto, %, fecha, dólares y ficha; nunca caducadas', () => {
  const ahora = new Date('2026-11-11T12:00:00Z');
  const lista = [
    oferta('a'),
    oferta('b', { rentabilidad: { mostrada: '4,09 %', literal: 'En dólares.' }, metricas: [{ etiqueta: 'Moneda', valor: 'USD (dólar)' },
      { etiqueta: 'Rentabilidad publicada · neta · 09/11/2026', valor: '4,09 %' }] }),
    oferta('c', { coleccion: 'secundario' }),
    oferta('d', { estadoRevision: 'fuentes_en_conflicto' }),
    oferta('e', { verificadaEl: '2026-11-01' }),
    oferta('f', { rentabilidad: { mostrada: 'Hasta un 8 %', literal: 'x' } }),
    oferta('g', { rentabilidad: null }),
    oferta('a'),
    oferta('h', { rentabilidad: { mostrada: '45 %', literal: 'x' } }),
    oferta('i', { documentacion: { referencias: [{ valor: '2,84 %', fechaDato: '2026-11-12' }] } }),
    oferta('Mal Slug'),
    null,
  ];
  const r = c.ofertasConRentabilidad(lista, { ahora });
  eq(r.map((o) => o.slug), ['a', 'b'], 'el orden del catálogo, sin repetidas ni caducadas, ni rangos, ni de fuera de los límites, ni con fecha futura');
  assert.deepEqual(r[0], { slug: 'a', nombre: 'Fondo a', titulo: 'Fondo a: con detalle', plataforma: 'Plataforma', rentabilidad: 2.84, texto: '2,84 %',
    fecha: '2026-11-09', moneda: null, enDolares: false, ficha: '/ofertas/a' });
  eq(r[1].enDolares, true);
  eq(c.textoOferta(r[0]), 'Fondo a · 2,84 % · 09/11/2026');
  assert.match(c.notaOferta(r[1]), /^Rentabilidad que publicó Plataforma con fecha 09\/11\/2026\. Puede cambiar y no está garantizada; .* Es en dólares: en euros, el resultado cambia con el tipo de cambio\.$/);
  // El catálogo caducado (o sin comprobar) no da ninguna: el bloque no sale.
  eq(c.ofertasConRentabilidad(lista, { ahora: new Date('2026-11-18T00:00:00Z') }), []);
  eq(c.ofertasConRentabilidad(lista, { ahora, catalogoVigente: false }), []);
  eq(c.ofertasConRentabilidad(null, { ahora }), []);
  eq(c.ofertasConRentabilidad('x', { ahora }), []);
  // Como mucho 8.
  eq(c.ofertasConRentabilidad(Array.from({ length: 12 }, (_, i) => oferta('o' + i)), { ahora }).length, c.MAX_OFERTAS);
});

test('26 · con el catálogo publicado de hoy salen las de Spiko con su cifra y su fecha (y la de dólares lo dice)', () => {
  const src = fs.readFileSync(path.join(RAIZ, 'rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8');
  const ctx = {}; vm.createContext(ctx); vm.runInContext(src + ';globalThis.__EMI=EMI;', ctx);
  const emi = JSON.parse(JSON.stringify(ctx.__EMI));   // del contexto de vm a este (mismos prototipos)
  const verificada = emi.find((o) => o.coleccion === 'principales' && o.estadoRevision === 'actual').verificadaEl;
  const ahora = new Date(verificada + 'T12:00:00Z');
  const r = c.ofertasConRentabilidad(emi, { ahora });
  const conCifra = emi.filter((o) => o.coleccion === 'principales' && o.estadoRevision === 'actual' && o.rentabilidad && /^\d+(,\d+)?\s%$/.test(o.rentabilidad.mostrada));
  eq(r.map((o) => o.slug), conCifra.map((o) => o.slug), 'todas las principales vigentes con una cifra publicada, y solo esas');
  for (const o of r) {
    const original = emi.find((x) => x.slug === o.slug);
    assert.equal(o.texto, original.rentabilidad.mostrada.trim());
    assert.match(o.fecha, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(o.fecha <= verificada);
  }
  // Cada oferta en dólares lo dice (por su moneda o por su texto).
  for (const o of r) eq(o.enDolares, /dólar|USD/i.test(JSON.stringify(emi.find((x) => x.slug === o.slug).metricas.find((m) => m.etiqueta === 'Moneda') || '') + o.titulo), o.slug);
});

test('27 · la web lleva una copia exacta del motor y da los mismos resultados', () => {
  const r = spawnSync(process.execPath, [path.join(RAIZ, 'rwadar-app/calculadora/copiar-modelo-web.cjs'), '--comprobar'], { encoding: 'utf8' });
  eq(r.status, 0, r.stderr);
  const web = fs.readFileSync(path.join(RAIZ, 'rwadar-site/assets/calculadora-modelo-20261111.js'), 'utf8');
  assert.ok(web.includes(fs.readFileSync(path.join(__dirname, '../lib/calculadora.js'), 'utf8')));
  const ventana = {}; vm.createContext({ window: ventana });
  const ctx = vm.createContext({ window: ventana }); vm.runInContext(web, ctx);
  const m = ventana.RWAdarCalculadoraModelo;
  const entradas = { inversion: '25.000', rentabilidad: '6,5', anios: '10', modo: 'reinvertir', impuestos: '19', comisionAnual: '0,5', comisionEntrada: '1', valorActivo: '300.000', precioParticipacion: '100' };
  eq(JSON.stringify(m.pasos(m.calcular(m.validarEntradas(entradas)))), JSON.stringify(c.pasos(c.calcular(c.validarEntradas(entradas)))));
  // Sin dependencias, sin red y sin Intl (Hermes).
  const fuente = fs.readFileSync(path.join(__dirname, '../lib/calculadora.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(fuente, /require\(|import |fetch\(|Intl\.|toLocaleString/);
});

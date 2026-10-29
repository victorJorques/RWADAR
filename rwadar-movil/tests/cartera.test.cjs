const test = require('node:test');
const assert = require('node:assert/strict');
const c = require('../lib/cartera');
const HOY = '2026-10-23';
function posicion(moneda = 'EUR', id = 'p1') { return c.crearPosicion({ id, nombre: 'Operación de prueba', moneda }, HOY); }
function comprar(p, datos = {}) { return c.anadirMovimiento(p, { id: 'c1', tipo: 'compra', fecha: '2026-10-20', cantidad: '10', precio: '100', comision: '10', ...datos }, HOY); }

test('compra, comisión y cotización calculan el resultado económico, sin usar rentabilidad anunciada', () => {
  const p = c.fijarValoracion(comprar(posicion()), { precio: '120', fecha: HOY }, HOY);
  const r = c.resumirPosicion(p, HOY);
  assert.equal(r.aportadoCentimos, 101000); assert.equal(r.valorActualCentimos, 120000);
  assert.equal(r.resultadoCentimos, 19000); assert.equal(r.rentabilidadPorcentaje, 18.81);
  assert.equal(r.precioMedioCompras, '100'); assert.equal(r.cantidad, '10');
});
test('venta parcial y cobros no se confunden con ganancia ni se cuentan dos veces', () => {
  let p = comprar(posicion());
  p = c.anadirMovimiento(p, { id: 'v1', tipo: 'venta', fecha: '2026-10-21', cantidad: '4', precio: '110', comision: '4' }, HOY);
  p = c.anadirMovimiento(p, { id: 'd1', tipo: 'cobro', fecha: '2026-10-22', importe: '20' }, HOY);
  p = c.anadirMovimiento(p, { id: 'g1', tipo: 'gasto', fecha: '2026-10-22', importe: '3' }, HOY);
  p = c.fijarValoracion(p, { precio: '120', fecha: HOY }, HOY);
  const r = c.resumirPosicion(p, HOY);
  assert.equal(r.cantidad, '6'); assert.equal(r.cobradoCentimos, 45600);
  assert.equal(r.aportadoCentimos, 101300); assert.equal(r.costesCentimos, 1700);
  assert.equal(r.valorActualCentimos, 72000); assert.equal(r.resultadoCentimos, 16300);
});
test('sin valoración no se publica una pérdida ficticia de todo lo invertido', () => {
  const r = c.resumirPosicion(comprar(posicion()), HOY);
  assert.equal(r.valorActualCentimos, null); assert.equal(r.resultadoCentimos, null);
  assert.equal(r.rentabilidadPorcentaje, null); assert.equal(r.requiereValoracion, true);
});
test('una cotización anterior a una nueva compra no valora unidades posteriores', () => {
  const p = c.fijarValoracion(comprar(posicion()), { precio: '120', fecha: '2026-10-19' }, HOY);
  assert.equal(c.resumirPosicion(p, HOY).resultadoCentimos, null);
});
test('venta total calcula resultado realizado sin exigir cotización de unidades inexistentes', () => {
  const p = c.anadirMovimiento(comprar(posicion()), { id: 'v1', tipo: 'venta', fecha: HOY, cantidad: '10', precio: '110', comision: '5' }, HOY);
  const r = c.resumirPosicion(p, HOY);
  assert.equal(r.cerrada, true); assert.equal(r.valorActualCentimos, 0); assert.equal(r.resultadoCentimos, 8500);
});
test('un cobro posterior exige valoración nueva para evitar sumar dividendo y precio anterior al reparto', () => {
  let p = c.fijarValoracion(comprar(posicion()), { precio: '100', fecha: '2026-10-20' }, HOY);
  p = c.anadirMovimiento(p, { id: 'd', tipo: 'cobro', fecha: '2026-10-21', importe: '100' }, HOY);
  assert.equal(c.resumirPosicion(p, HOY).resultadoCentimos, null);
  p = c.fijarValoracion(p, { precio: '90', fecha: HOY }, HOY);
  assert.equal(c.resumirPosicion(p, HOY).resultadoCentimos, -1000);
});
test('la valoración cero explícita se diferencia de la valoración desconocida', () => {
  const p = c.fijarValoracion(comprar(posicion()), { precio: '0', fecha: HOY }, HOY);
  assert.equal(c.resumirPosicion(p, HOY).resultadoCentimos, -101000);
});
test('rechaza ventas imposibles, incluida una venta retroactiva antes de adquirir unidades', () => {
  const p = comprar(posicion());
  assert.throws(() => c.anadirMovimiento(p, { id: 'v', tipo: 'venta', fecha: HOY, cantidad: '11', precio: '1', comision: '0' }, HOY), /más unidades/);
  assert.throws(() => c.anadirMovimiento(p, { id: 'v', tipo: 'venta', fecha: '2026-10-19', cantidad: '1', precio: '1', comision: '0' }, HOY), /más unidades/);
});
test('redondea cada operación a céntimos sin errores de coma flotante', () => {
  const p = comprar(posicion(), { cantidad: '0,3', precio: '0,1', comision: '0' });
  assert.equal(c.resumirPosicion(p, HOY).aportadoCentimos, 3);
  const q = comprar(posicion(), { cantidad: '0.5', precio: '0.01', comision: '0' });
  assert.equal(c.resumirPosicion(q, HOY).aportadoCentimos, 1);
});
test('mantiene la precisión de NAV y participaciones fraccionadas', () => {
  const p = comprar(posicion(), { cantidad: '12.345678', precio: '1.0613', comision: '0' });
  const r = c.resumirPosicion(p, HOY);
  assert.equal(r.cantidad, '12.345678'); assert.equal(r.precioMedioCompras, '1.0613'); assert.equal(r.aportadoCentimos, 1310);
});
test('no suma euros, dólares o stablecoins ni convierte monedas por inferencia', () => {
  const grupos = c.resumirCartera([comprar(posicion('EUR', 'e')), comprar(posicion('USD', 'u')), comprar(posicion('USDC', 's'))], HOY);
  assert.deepEqual(grupos.map(g => g.moneda), ['EUR', 'USD', 'USDC']);
  assert.ok(grupos.every(g => g.aportadoCentimos === 101000 && g.resultadoCentimos === null));
});
test('un total de una moneda sigue sin valoración si falta una de sus inversiones', () => {
  const p = c.fijarValoracion(comprar(posicion('EUR', 'a')), { precio: '120', fecha: HOY }, HOY);
  const grupo = c.resumirCartera([p, comprar(posicion('EUR', 'b'))], HOY)[0];
  assert.equal(grupo.pendientesValoracion, 1); assert.equal(grupo.valorActualCentimos, null); assert.equal(grupo.resultadoCentimos, null);
});
test('conserva fecha de valoración y avisa de antigüedad sin rejuvenecerla', () => {
  const p = c.fijarValoracion(comprar(posicion(), { fecha: '2026-10-01' }), { precio: '120', fecha: '2026-10-10' }, HOY);
  const r = c.resumirPosicion(p, HOY);
  assert.equal(r.fechaValoracion, '2026-10-10'); assert.equal(r.valoracionAntigua, true);
});
test('valida fechas reales, decimales, signo y rangos antes de guardar', () => {
  for (const datos of [{ fecha: '2026-02-30' }, { fecha: '2026-10-24' }, { cantidad: '-1' }, { cantidad: '1e3' }, { precio: '1.234,56' }, { comision: '0.001' }, { cantidad: '0' }]) {
    assert.throws(() => comprar(posicion(), datos));
  }
  assert.throws(() => posicion('BTC'), /moneda/);
});
test('no acepta movimientos ni posiciones duplicadas', () => {
  const p = comprar(posicion());
  assert.throws(() => comprar(p), /duplicados/); assert.throws(() => c.serializarCartera([p, p], HOY), /duplicadas/);
});
test('persistencia versionada conserva registros y rechaza datos corruptos sin sustituirlos por vacío', () => {
  const p = comprar(posicion()); const raw = c.serializarCartera([p], HOY);
  assert.deepEqual(c.deserializarCartera(raw, HOY), [p]);
  assert.throws(() => c.deserializarCartera('dato roto', HOY), /No lo sobrescribas/);
  assert.throws(() => c.deserializarCartera('{"version":2,"posiciones":[]}', HOY), /versión/);
});
test('rechaza totales y valoraciones fuera de rango antes de persistir o renderizar', () => {
  assert.throws(() => comprar(posicion(), { cantidad: '1000000000', precio: '1000000000' }), /rango/);
  const p = comprar(posicion(), { cantidad: '1000000', precio: '1000000', comision: '0' });
  assert.throws(() => c.fijarValoracion(p, { precio: '1000000000', fecha: HOY }, HOY), /rango/);
  const q = { ...p, id: 'otra' };
  assert.throws(() => c.serializarCartera([p, q], HOY), /rango/);
});
test('no escribe un tamaño de registro que su propia lectura rechazaría', () => {
  const muchos = Array.from({ length: 100 }, (_, i) => {
    let p = posicion('EUR', `p${i}`);
    p.movimientos = Array.from({ length: 130 }, (_, n) => ({ id: `operacion-${n}-${'x'.repeat(70)}`, tipo: 'compra', fecha: HOY, cantidad: '0.01', precio: '1', comision: '0' }));
    return p;
  });
  assert.throws(() => c.serializarCartera(muchos, HOY), /tamaño/);
});
test('agrupación y posición redondean las pérdidas con el mismo criterio decimal', () => {
  const p = c.fijarValoracion(comprar(posicion(), { cantidad: '1', precio: '160', comision: '0' }), { precio: '158.20', fecha: HOY }, HOY);
  assert.equal(c.resumirPosicion(p, HOY).rentabilidadPorcentaje, -1.13);
  assert.equal(c.resumirCartera([p], HOY)[0].rentabilidadPorcentaje, -1.13);
});

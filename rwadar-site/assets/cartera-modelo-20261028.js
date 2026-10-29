(function () { 'use strict'; const module={exports:{}};
// Registro personal manual. Ningún dato de rendimiento anunciado se usa aquí.
const MONEDAS = Object.freeze(['EUR', 'USD', 'CHF', 'GBP', 'USDC', 'USDT']);
const ESCALA = 1000000n;
const LIMITE_CENTIMOS = 100000000000000n;
function exigir(ok, mensaje) { if (!ok) throw new Error(mensaje); }
function fechaHoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fecha(valor, hoy) {
  exigir(typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor), 'Introduce una fecha AAAA-MM-DD.');
  const d = new Date(`${valor}T00:00:00Z`);
  exigir(Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === valor, 'La fecha no existe.');
  exigir(valor <= hoy, 'La fecha no puede ser futura.');
  return valor;
}
function texto(valor, maximo, etiqueta, vacio = false) {
  exigir(typeof valor === 'string', `Revisa ${etiqueta}.`);
  const t = valor.trim();
  exigir((vacio || t.length > 0) && t.length <= maximo && !/[\u0000-\u001f]/.test(t), `Revisa ${etiqueta}.`);
  return t;
}
function decimal(valor, decimales, positivo, etiqueta) {
  exigir(typeof valor === 'string' && valor.length <= 30, `Revisa ${etiqueta}.`);
  const t = valor.trim().replace(',', '.');
  exigir(new RegExp(`^\\d+(?:\\.\\d{1,${decimales}})?$`).test(t), `${etiqueta}: usa coma o punto decimal, sin separadores de miles.`);
  const [entero, fraccion = ''] = t.split('.');
  const unidades = BigInt(entero) * 10n ** BigInt(decimales) + BigInt(fraccion.padEnd(decimales, '0'));
  exigir(unidades >= (positivo ? 1n : 0n) && unidades <= 1000000000000n * 10n ** BigInt(decimales), `Revisa ${etiqueta}: importe fuera de rango.`);
  const fr = fraccion.replace(/0+$/, '');
  return { valor: unidades, texto: `${BigInt(entero)}${fr ? `.${fr}` : ''}` };
}
function redondear(numerador, divisor) { return (numerador + divisor / 2n) / divisor; }
function porcentajeResultado(resultado, aportado) {
  if (resultado === null || aportado === 0n) return null;
  return Number((resultado < 0n ? -1n : 1n) * redondear((resultado < 0n ? -resultado : resultado) * 10000n, aportado)) / 100;
}
function centimos(precio, cantidad) { return redondear(precio * cantidad, 10000000000n); }
function numero(n) { exigir(n <= LIMITE_CENTIMOS && n >= -LIMITE_CENTIMOS, 'El total supera el rango admitido.'); return Number(n); }
function unidadesTexto(n) { const parte = String(n % ESCALA).padStart(6, '0').replace(/0+$/, ''); return `${n / ESCALA}${parte ? `.${parte}` : ''}`; }
function crearPosicion(datos, hoy = fechaHoy()) {
  exigir(datos && typeof datos === 'object', 'Revisa la inversión.');
  const moneda = texto(datos.moneda, 4, 'la moneda').toUpperCase();
  exigir(MONEDAS.includes(moneda), 'Selecciona una moneda admitida.');
  return { id: texto(datos.id, 100, 'el identificador'), nombre: texto(datos.nombre, 160, 'el nombre'),
    proveedor: texto(datos.proveedor || '', 120, 'el proveedor', true), ofertaSlug: texto(datos.ofertaSlug || '', 160, 'la oferta', true),
    moneda, creadaEl: fecha(hoy, hoy), movimientos: [], valoracion: null };
}
function movimiento(m, hoy) {
  exigir(m && typeof m === 'object', 'Revisa el movimiento.');
  const base = { id: texto(m.id, 100, 'el movimiento'), tipo: m.tipo, fecha: fecha(m.fecha, hoy) };
  exigir(['compra', 'venta', 'cobro', 'gasto'].includes(m.tipo), 'El tipo de movimiento no está admitido.');
  if (m.tipo === 'compra' || m.tipo === 'venta') {
    base.cantidad = decimal(m.cantidad, 6, true, 'Cantidad').texto;
    base.precio = decimal(m.precio, 6, m.tipo === 'compra', 'Precio por unidad').texto;
    base.comision = decimal(m.comision === undefined ? '0' : m.comision, 2, false, 'Comisión pagada').texto;
  } else base.importe = decimal(m.importe, 2, true, 'Importe').texto;
  return base;
}
function validarPosicion(pos, hoy = fechaHoy()) {
  exigir(pos && typeof pos === 'object' && Array.isArray(pos.movimientos) && pos.movimientos.length <= 1000, 'El registro de movimientos no es válido.');
  const limpia = crearPosicion(pos, hoy);
  limpia.creadaEl = fecha(pos.creadaEl, hoy);
  limpia.movimientos = pos.movimientos.map(m => movimiento(m, hoy)).sort((a, b) => a.fecha.localeCompare(b.fecha));
  exigir(new Set(limpia.movimientos.map(m => m.id)).size === limpia.movimientos.length, 'Hay movimientos duplicados.');
  let cantidad = 0n, aportado = 0n, cobrado = 0n, costes = 0n;
  for (const m of limpia.movimientos) {
    if (m.tipo === 'compra' || m.tipo === 'venta') {
      const q = decimal(m.cantidad, 6, true, 'Cantidad').valor;
      const importe = centimos(decimal(m.precio, 6, false, 'Precio').valor, q);
      const comision = decimal(m.comision, 2, false, 'Comisión').valor;
      numero(importe); costes += comision;
      if (m.tipo === 'compra') { cantidad += q; aportado += importe + comision; }
      else { cantidad -= q; cobrado += importe - comision; }
    } else {
      const importe = decimal(m.importe, 2, true, 'Importe').valor;
      if (m.tipo === 'cobro') cobrado += importe;
      else { aportado += importe; costes += importe; }
    }
    exigir(cantidad >= 0n, 'No puedes vender más unidades de las que tenías en esa fecha.');
    numero(aportado); numero(cobrado); numero(costes);
  }
  if (pos.valoracion != null) limpia.valoracion = {
    precio: decimal(pos.valoracion.precio, 6, false, 'Precio actual').texto,
    fecha: fecha(pos.valoracion.fecha, hoy), origen: 'manual',
  };
  if (limpia.valoracion) numero(centimos(decimal(limpia.valoracion.precio, 6, false, 'Precio').valor, cantidad));
  return limpia;
}
function anadirMovimiento(pos, m, hoy = fechaHoy()) {
  return validarPosicion({ ...pos, movimientos: [...pos.movimientos, movimiento(m, hoy)] }, hoy);
}
function fijarValoracion(pos, valoracion, hoy = fechaHoy()) { return validarPosicion({ ...pos, valoracion }, hoy); }
function resumirPosicion(original, hoy = fechaHoy()) {
  const p = validarPosicion(original, hoy);
  let cantidad = 0n, compradas = 0n, precioPorUnidades = 0n, aportado = 0n, cobrado = 0n, costes = 0n, ultimaOperacion = null;
  for (const m of p.movimientos) {
    ultimaOperacion = m.fecha;
    if (m.tipo === 'compra' || m.tipo === 'venta') {
      const q = decimal(m.cantidad, 6, true, 'Cantidad').valor;
      const precio = decimal(m.precio, 6, false, 'Precio').valor;
      const comision = decimal(m.comision, 2, false, 'Comisión').valor;
      const importe = centimos(precio, q);
      costes += comision;
      if (m.tipo === 'compra') { cantidad += q; compradas += q; precioPorUnidades += precio * q; aportado += importe + comision; }
      else { cantidad -= q; cobrado += importe - comision; }
    } else {
      const importe = decimal(m.importe, 2, true, 'Importe').valor;
      if (m.tipo === 'cobro') cobrado += importe;
      else { aportado += importe; costes += importe; }
    }
  }
  const cerrada = compradas > 0n && cantidad === 0n;
  const cotizacionValida = p.valoracion && (!ultimaOperacion || p.valoracion.fecha >= ultimaOperacion);
  const valor = cerrada ? 0n : (cantidad > 0n && cotizacionValida ? centimos(decimal(p.valoracion.precio, 6, false, 'Precio').valor, cantidad) : null);
  const resultado = valor === null || aportado === 0n ? null : valor + cobrado - aportado;
  const porcentaje = porcentajeResultado(resultado, aportado);
  const antiguedad = p.valoracion ? Math.floor((Date.parse(hoy) - Date.parse(p.valoracion.fecha)) / 86400000) : null;
  return { id: p.id, nombre: p.nombre, proveedor: p.proveedor, ofertaSlug: p.ofertaSlug, moneda: p.moneda, cantidad: unidadesTexto(cantidad),
    aportadoCentimos: numero(aportado), cobradoCentimos: numero(cobrado), costesCentimos: numero(costes), valorActualCentimos: valor === null ? null : numero(valor),
    resultadoCentimos: resultado === null ? null : numero(resultado), rentabilidadPorcentaje: porcentaje,
    precioMedioCompras: compradas ? unidadesTexto(redondear(precioPorUnidades, compradas)) : null,
    precioActual: p.valoracion?.precio ?? null, fechaValoracion: p.valoracion?.fecha ?? null,
    requiereValoracion: !cerrada && !cotizacionValida, valoracionAntigua: !cerrada && antiguedad > 7, cerrada, movimientos: p.movimientos };
}
function validarCartera(posiciones, hoy = fechaHoy()) {
  exigir(Array.isArray(posiciones) && posiciones.length <= 100, 'El registro de inversiones no es válido.');
  const limpias = posiciones.map(p => validarPosicion(p, hoy));
  exigir(new Set(limpias.map(p => p.id)).size === limpias.length, 'Hay inversiones duplicadas.');
  const totales = new Map();
  for (const p of limpias) {
    const r = resumirPosicion(p, hoy);
    const g = totales.get(r.moneda) || { aportadoCentimos: 0n, cobradoCentimos: 0n, costesCentimos: 0n, valorActualCentimos: 0n, resultadoCentimos: 0n };
    for (const key of Object.keys(g)) { g[key] += BigInt(r[key] || 0); numero(g[key]); }
    totales.set(r.moneda, g);
  }
  return limpias;
}
function resumirCartera(posiciones, hoy = fechaHoy()) {
  const grupos = new Map();
  for (const p of validarCartera(posiciones, hoy)) {
    const r = resumirPosicion(p, hoy);
    const g = grupos.get(r.moneda) || { moneda: r.moneda, posiciones: 0, aportadoCentimos: 0, cobradoCentimos: 0, costesCentimos: 0, valorActualCentimos: 0, resultadoCentimos: 0, pendientesValoracion: 0 };
    g.posiciones += 1;
    for (const clave of ['aportadoCentimos', 'cobradoCentimos', 'costesCentimos']) g[clave] = numero(BigInt(g[clave]) + BigInt(r[clave]));
    if (r.valorActualCentimos === null) g.pendientesValoracion += 1;
    else { g.valorActualCentimos += r.valorActualCentimos; g.resultadoCentimos += r.resultadoCentimos || 0; }
    grupos.set(r.moneda, g);
  }
  return [...grupos.values()].map(g => ({ ...g, valorActualCentimos: g.pendientesValoracion ? null : numero(BigInt(g.valorActualCentimos)), resultadoCentimos: g.pendientesValoracion ? null : numero(BigInt(g.resultadoCentimos)),
    rentabilidadPorcentaje: g.pendientesValoracion ? null : porcentajeResultado(BigInt(g.resultadoCentimos), BigInt(g.aportadoCentimos)) }));
}
function serializarCartera(posiciones, hoy = fechaHoy()) {
  const raw = JSON.stringify({ version: 1, posiciones: validarCartera(posiciones, hoy) });
  exigir(raw.length <= 2000000, 'El registro supera el tamaño admitido. No se ha guardado.');
  return raw;
}
function deserializarCartera(raw, hoy = fechaHoy()) {
  exigir(typeof raw === 'string' && raw.length <= 2000000, 'El registro guardado no es válido.');
  let objeto; try { objeto = JSON.parse(raw); } catch { throw new Error('No se pudo leer el registro guardado. No lo sobrescribas.'); }
  exigir(objeto?.version === 1, 'La versión del registro no está admitida.');
  return validarCartera(objeto.posiciones, hoy);
}
module.exports = { MONEDAS, fechaHoy, crearPosicion, anadirMovimiento, fijarValoracion, validarPosicion, validarCartera, resumirPosicion, resumirCartera, serializarCartera, deserializarCartera };

window.RWAdarCarteraModelo=module.exports; })();

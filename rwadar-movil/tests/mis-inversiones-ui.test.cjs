const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const modelo = require('../lib/cartera');
const U1 = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const U2 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

function nodos(arbol) {
  if (arbol == null || typeof arbol !== 'object') return [];
  if (Array.isArray(arbol)) return arbol.flatMap(nodos);
  return [arbol, ...nodos(arbol.children)];
}
function texto(arbol) {
  if (arbol == null || typeof arbol === 'boolean') return '';
  if (Array.isArray(arbol)) return arbol.map(texto).join(' ');
  return typeof arbol === 'object' ? texto(arbol.children) : String(arbol);
}
const tick = () => new Promise(resolve => setImmediate(resolve));

function entorno(opciones = {}) {
  const estados = [], refs = [], efectos = [], guardados = [], consultas = [], alertas = [];
  let indice = 0, ref = 0, efecto = 0, arbol;
  const React = {
    createElement(tipo, props, ...children) {
      if (typeof tipo === 'function' && ['Boton', 'Campo', 'Dato'].includes(tipo.name)) return tipo({ ...props, children });
      return { tipo: typeof tipo === 'function' ? tipo.name : tipo, props: props || {}, children };
    },
    useState(inicial) {
      const i = indice++;
      if (!(i in estados)) estados[i] = typeof inicial === 'function' ? inicial() : inicial;
      return [estados[i], valor => { estados[i] = typeof valor === 'function' ? valor(estados[i]) : valor; }];
    },
    useRef(inicial) { return refs[ref++] ||= { current: inicial }; },
    useEffect(fn, deps) {
      const i = efecto++, previo = efectos[i];
      if (!previo || deps.some((d, j) => d !== previo.deps[j])) {
        previo?.limpiar?.(); efectos[i] = { deps, ejecutar: fn };
      }
    },
  };
  const mocks = {
    react: React,
    'react-native': { ActivityIndicator: 'ActivityIndicator', StyleSheet: { create: valor => valor } },
    './Idioma': { ...Object.fromEntries(['Pressable', 'ScrollView', 'Text', 'TextInput', 'View'].map(n => [n, n])),
      Alert: { alert: (...args) => alertas.push(args) } },
    '../lib/cartera': modelo,
    '../lib/cartera-local': {
      async cargarCartera(usuarioId) { consultas.push(usuarioId); if (opciones.falloCarga) throw Error('lectura'); return opciones.posiciones || []; },
      async guardarCartera(usuarioId, posiciones) { if (opciones.falloGuardar) throw Error('disco'); guardados.push({ usuarioId, posiciones }); },
    },
    '../lib/tema': { C: {}, F: {}, R: {}, T: {}, UI: { boton: 48, tactil: 44 } },
  };
  const ruta = path.join(__dirname, '../componentes/MisInversiones.js');
  const codigo = babel.transformSync(fs.readFileSync(ruta, 'utf8'), { filename: ruta, babelrc: false, configFile: false,
    plugins: [require('@babel/plugin-transform-modules-commonjs'), require('@babel/plugin-transform-react-jsx')] }).code;
  const modulo = { exports: {} };
  new Function('module', 'exports', 'require', codigo)(modulo, modulo.exports, nombre => {
    assert.ok(Object.hasOwn(mocks, nombre), nombre); return mocks[nombre];
  });
  const props = { usuarioId: U1, ...opciones.props };
  function render() {
    indice = ref = efecto = 0; arbol = modulo.exports.CarteraUsuario(props);
    for (const e of efectos) if (e.ejecutar) { const fn = e.ejecutar; e.ejecutar = null; e.limpiar = fn(); }
    return arbol;
  }
  function control(etiqueta) {
    const n = nodos(arbol).find(n => n.props.accessibilityLabel === etiqueta);
    assert.ok(n, `falta control ${etiqueta}`); return n;
  }
  return { ui: modulo.exports, render, props, guardados, consultas, alertas,
    get texto() { return texto(arbol); }, get nodos() { return nodos(arbol); }, control,
    pulsar(etiqueta) { control(etiqueta).props.onPress(); return render(); },
    campo(etiqueta, valor) { control(etiqueta).props.onChangeText(valor); return render(); },
  };
}

async function cargar(opciones) { const e = entorno(opciones); e.render(); await tick(); e.render(); return e; }
function posicion() {
  return modelo.anadirMovimiento(modelo.crearPosicion({ id: 'p1', nombre: 'Mi inversión', moneda: 'EUR' }),
    { id: 'm1', tipo: 'compra', fecha: modelo.fechaHoy(), cantidad: '2', precio: '10', comision: '0' });
}

test('sin usuario no dibuja datos y cambiar de usuario monta un estado separado', () => {
  const e = entorno(); assert.equal(e.ui.default({}), null);
  assert.equal(e.ui.default({ usuarioId: U1 }).props.key, U1);
  assert.equal(e.ui.default({ usuarioId: U2 }).props.key, U2);
  assert.equal(e.ui.importeVisible(1234, 'USDC'), '12,34 USDC');
});

test('prefijar desde una oferta no registra compras ni inventa moneda, cantidad, precio o comisión', async () => {
  const e = await cargar({ props: { ofertaInicial: { titulo: 'Oferta de ejemplo', plataformaNombre: 'Proveedor', slug: 'ejemplo', rentabilidad: '90%' } } });
  assert.equal(e.control('Nombre de la inversión').props.value, 'Oferta de ejemplo');
  for (const campo of ['Cantidad de unidades', 'Precio pagado por unidad', 'Comisión (0 si no hubo)']) assert.equal(e.control(campo).props.value, '');
  assert.ok(e.nodos.filter(n => n.props.accessibilityRole === 'radio').every(n => !n.props.accessibilityState.checked));
  assert.equal(e.guardados.length, 0);
});

test('registra una compra con comisión explícita en la cuenta correcta y deja el resultado sin valoración', async () => {
  const e = await cargar(); e.pulsar('Registrar inversión');
  e.campo('Nombre de la inversión', 'Mi inversión'); e.pulsar('EUR');
  e.campo('Cantidad de unidades', '2,5'); e.campo('Precio pagado por unidad', '10,20');
  e.pulsar('Guardar movimiento');
  assert.match(e.texto, /escribe 0 si no hubo comisión/); assert.equal(e.guardados.length, 0);
  e.campo('Comisión (0 si no hubo)', '0'); e.pulsar('Guardar movimiento'); await tick(); e.render();
  assert.equal(e.guardados.length, 1); assert.equal(e.guardados[0].usuarioId, U1);
  const p = e.guardados[0].posiciones[0];
  assert.equal(p.moneda, 'EUR'); assert.equal(p.movimientos[0].cantidad, '2.5'); assert.equal(p.valoracion, null);
  assert.match(e.texto, /Sin valoración/); assert.match(e.texto, /25,50 EUR/);
  assert.equal(e.texto.includes('90%'), false);
});

test('permite precio fechado, conserva cantidad e identifica el resultado sin anualizar', async () => {
  const e = await cargar({ posiciones: [posicion()] });
  assert.match(e.texto, /Sin valoración/);
  e.pulsar('Actualizar precio · Mi inversión'); e.campo('Precio actual por unidad', '12');
  e.pulsar('Guardar precio'); await tick(); e.render();
  assert.equal(e.guardados[0].posiciones[0].valoracion.precio, '12');
  assert.match(e.texto, /24,00 EUR/); assert.match(e.texto, /20,00 %/);
  assert.match(e.texto, /Resultado sin anualizar/);
});

test('los fallos de carga o escritura no confirman movimientos ni borran los registros anteriores', async () => {
  const a = await cargar({ falloCarga: true });
  assert.equal(a.control('Registrar inversión').props.disabled, true); assert.match(a.texto, /No se sobrescribirá/);
  const b = await cargar({ posiciones: [posicion()], falloGuardar: true });
  b.pulsar('Actualizar precio · Mi inversión'); b.campo('Precio actual por unidad', '12'); b.pulsar('Guardar precio'); await tick(); b.render();
  assert.equal(b.guardados.length, 0); assert.match(b.texto, /el cambio no se ha confirmado/);
  assert.match(b.texto, /Mi inversión/); assert.ok(b.control('Guardar precio'));
});

test('eliminar exige confirmar y mantiene la operación en el mismo usuario', async () => {
  const e = await cargar({ posiciones: [posicion()] });
  e.pulsar('Movimientos de Mi inversión'); e.pulsar('Eliminar inversión · Mi inversión');
  assert.equal(e.guardados.length, 0);
  const opciones = e.alertas[0][2];
  assert.equal(opciones.find(o => o.text === 'Cancelar').style, 'cancel');
  opciones.find(o => o.text === 'Eliminar').onPress(); await tick(); e.render();
  assert.equal(e.guardados[0].usuarioId, U1); assert.deepEqual(e.guardados[0].posiciones, []);
});

test('un cobro usa importe real y una venta imposible devuelve el error sin guardarse', async () => {
  const e = await cargar({ posiciones: [posicion()] });
  e.pulsar('Añadir movimiento · Mi inversión'); e.pulsar('Cobro');
  e.campo('Importe cobrado', '3,25'); e.pulsar('Guardar movimiento'); await tick(); e.render();
  assert.equal(e.guardados.length, 1);
  assert.equal(e.guardados[0].posiciones[0].movimientos.at(-1).importe, '3.25');
  e.pulsar('Añadir movimiento · Mi inversión'); e.pulsar('Venta');
  e.campo('Cantidad de unidades', '3'); e.campo('Precio de venta por unidad', '12'); e.campo('Comisión (0 si no hubo)', '0');
  e.pulsar('Guardar movimiento');
  assert.match(e.texto, /No puedes vender más unidades/);
  assert.equal(e.guardados.length, 1);
  assert.ok(e.nodos.some(n => n.props.accessibilityRole === 'alert'));
});

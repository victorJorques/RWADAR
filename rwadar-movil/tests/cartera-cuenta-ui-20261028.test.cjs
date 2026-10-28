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


test('el resumen manual agrupa por moneda y no supone valor cero sin valoración',async()=>{
 let eur=posicion();
 let usd=modelo.anadirMovimiento(modelo.crearPosicion({id:'usd',nombre:'USD',moneda:'USD'}),{id:'m-usd',tipo:'compra',fecha:modelo.fechaHoy(),cantidad:'1',precio:'500',comision:'0'});
 eur=modelo.fijarValoracion(eur,{precio:'15',fecha:modelo.fechaHoy()});
 const e=await cargar({posiciones:[eur,usd]});
 assert.match(e.texto,/Tu resumen/);assert.match(e.texto,/30,00 EUR/);assert.match(e.texto,/10,00 EUR/);assert.match(e.texto,/500,00 USD/);assert.match(e.texto,/Faltan valoraciones/);
});
test('leer cuenta conserva copia local y no la importa sin confirmación',async()=>{
 const escrituras=[];
 const e=await cargar({posiciones:[posicion()],props:{cargar:async()=>({posiciones:[],version:7}),guardar:async(p,v)=>{escrituras.push({p,v});return {posiciones:p,version:v+1};}}});
 assert.equal(escrituras.length,0);assert.match(e.texto,/Tu copia anterior se conserva/);assert.match(e.texto,/Sin compras/);
 e.pulsar('Importar copia local a mi cuenta');assert.equal(escrituras.length,0);
 const acciones=e.alertas.at(-1)[2];assert.equal(acciones[0].text,'Cancelar');
 acciones.find(a=>a.text==='Importar a mi cuenta').onPress();await tick();e.render();
 assert.equal(escrituras.length,1);assert.equal(escrituras[0].v,7);assert.equal(e.guardados.length,0);assert.match(e.texto,/Copia local importada/);
});
test('una cuenta no vacía no ofrece sustituirse por la copia local',async()=>{
 const e=await cargar({posiciones:[posicion()],props:{cargar:async()=>({posiciones:[posicion()],version:2}),guardar:async()=>{throw Error('no escribir');}}});
 assert.match(e.texto,/No se han combinado ni sustituido/);assert.ok(!e.nodos.some(n=>n.props.accessibilityLabel==='Importar copia local a mi cuenta'));
});
test('un conflicto remoto conserva el estado mostrado y el formulario sin guardar localmente',async()=>{
 const e=await cargar({props:{cargar:async()=>({posiciones:[posicion()],version:3}),guardar:async()=>{throw Object.assign(Error('conflicto'),{code:'cartera_conflicto'});}}});
 e.pulsar('Añadir movimiento · Mi inversión');e.pulsar('Cobro');e.campo('Importe cobrado','5');e.pulsar('Guardar movimiento');await tick();e.render();
 assert.match(e.texto,/No se pudo confirmar el guardado/);assert.match(e.texto,/20,00 EUR/);assert.equal(e.guardados.length,0);assert.equal(e.control('Importe cobrado').props.value,'5');
});
test('una respuesta de una carga anterior no se adopta al cambiar el adaptador',async()=>{
 let terminar;
 const e=entorno({props:{cargar:()=>new Promise(resolve=>{terminar=resolve;}),guardar:async()=>{}}});e.render();
 e.props.cargar=async()=>({posiciones:[],version:9});e.render();await tick();e.render();
 terminar({posiciones:[posicion()],version:1});await tick();e.render();
 assert.match(e.texto,/Sin compras/);assert.ok(!e.texto.includes('Mi inversión'));
});

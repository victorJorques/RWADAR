'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');
const jsx = require('@babel/plugin-transform-react-jsx');
const {soporteIdioma}=require('./soporte-idioma.cjs');
const ROOT = path.join(__dirname,'..');
function cargar(file,mocks,diagnostico={info(){}}) {
  const filename = path.join(ROOT,file);
  const source = babel.transformSync(fs.readFileSync(filename,'utf8'),{filename,babelrc:false,configFile:false,plugins:[commonjs,jsx]}).code;
  const module = {exports:{}};
  new Function('module','exports','require','console',source)(module,module.exports,n=>{
    if(n==='./Idioma')return soporteIdioma(mocks.react,mocks['react-native']);
    if(n==='../lib/idioma')return require('../lib/idioma');
    assert.ok(Object.hasOwn(mocks,n),'Unexpected dependency: '+n); return mocks[n];
  },diagnostico);
  return module.exports;
}
const tema = cargar('lib/tema.js',{'react-native':{Platform:{select:v=>v.android}}});
function radar(width=360) {
  const trazas=[];
  const createElement = (type,props,...children)=>({type,props,children});
  const styles = {};
  const native = {Animated:{Value:class {interpolate(){return 0;}},View:'AnimatedView'},
    Easing:{},Pressable:'Pressable',Text:'Text',View:'View',useWindowDimensions:()=>({width}),
    StyleSheet:{absoluteFill:{},hairlineWidth:1,create:v=>{Object.assign(styles,v);return v;}}};
  const r = cargar('componentes/Radar.js',{
    react:{createElement,useRef:v=>({current:v}),useState:v=>[v,()=>{}],useEffect(){},useMemo:fn=>fn()},
    'react-native':native,'react-native-svg':Object.fromEntries(['default','Circle','Defs','G','Line','Path','RadialGradient','Stop','Text'].map(x=>[x,x])),
    '../lib/tema':tema,'../lib/verificacion-local':{etiquetaEstadoVerificacionLocal:()=> 'Sin comprobar'},
  },{info:(prefix,data)=>{assert.equal(prefix,'RWADAR_RADAR_TOUCH');trazas.push(JSON.parse(data));}});
  return {...r,styles,trazas};
}
const fixture = require('../fixtures/escaparate-local.json').plataformas;
const canon = JSON.parse(fs.readFileSync(path.join(ROOT,'..','rwadar-app','data','verificaciones','2026-10-22-v2','radar-canonico-26.json'),'utf8'));
const porSlug = new Map(canon.plataformas.map(p=>[p.slug,p]));
const datos = fixture.map(p=>({...p,verificacionLocal:porSlug.get(p.slug)}));
function nodos(n) {return !n || typeof n!=='object' ? [] : Array.isArray(n) ? n.flatMap(nodos) : [n,...nodos(n.children)];}

test('las 26 plataformas mantienen punto y halo completos dentro del perímetro con margen',()=>{
  const ui = radar();
  const g = ui.GEOMETRIA_RADAR;
  const antes = structuredClone(datos);
  const puntos = ui.puntosRadar(datos);
  assert.equal(puntos.length,26);
  for(const {p,x,y} of puntos) {
    assert.ok(Number.isFinite(x) && Number.isFinite(y),p.slug);
    assert.ok(Math.hypot(x-g.cx,y-g.cy)+g.radioHalo+g.trazoHalo/2 <= g.radio-g.margen+1e-9,p.slug);
  }
  for(const slug of ['lofty','pax-gold','securitize','tzero','figure','swarm']) assert.ok(puntos.some(x=>x.p.slug===slug),slug);
  assert.deepEqual(datos,antes);
});

test('el escalón de un sector denso tampoco expulsa puntos ni dianas en pantallas pequeñas o grandes',()=>{
  for(const width of [320,360,720,1280]) {
    const ui = radar(width);
    const arbol = ui.default({datos,onAbrir(){},onFiltrar(){}});
    const lado = Math.min(340,width-34);
    const dianas = nodos(arbol).filter(n=>n.type==='Pressable' && n.props.style?.[0]===ui.styles.diana);
    assert.equal(dianas.length,26);
    for(const n of dianas) {
      const position=n.props.style[1];
      assert.ok(position.left>=0 && position.top>=0);
      assert.ok(position.left+ui.styles.diana.width<=lado && position.top+ui.styles.diana.height<=lado);
    }
    const densos = Array.from({length:256},(_,i)=>({...datos[0],slug:'plataforma-'+i}));
    for(const p of ui.puntosRadar(densos)) {
      const g=ui.GEOMETRIA_RADAR;
      assert.ok(Math.hypot(p.x-g.cx,p.y-g.cy)+g.radioHalo+g.trazoHalo/2<=g.radio-g.margen+1e-9);
    }
  }
});

test('pulsar los 26 centros abre su plataforma aunque otra caja superior reciba el toque',()=>{
  for(const width of [320,360,720,1280]) {
    const ui=radar(width); let abierta;
    const arbol=ui.default({datos,onAbrir:p=>{abierta=p;},onFiltrar(){}});
    const dianas=nodos(arbol).filter(n=>n.type==='Pressable' && n.props.style?.[0]===ui.styles.diana);
    let interceptados=0;
    for(let i=0;i<dianas.length;i++) {
      const propia=dianas[i].props.style[1];
      const x=Math.round((propia.left+22)*4)/4, y=Math.round((propia.top+22)*4)/4;
      // Orden nativo de apilado: la última caja que contiene el píxel recibe
      // el evento. Se ejecuta SU handler real, no el de la plataforma buscada.
      const receptor=dianas.findLast(n=>{const b=n.props.style[1]; return x>=b.left && x<=b.left+44 && y>=b.top && y<=b.top+44;});
      if(receptor!==dianas[i])interceptados++;
      const b=receptor.props.style[1];
      const nativeEvent={locationX:x-b.left,locationY:y-b.top,changedTouches:[{identifier:1}],touches:[]};
      receptor.props.onPressIn({type:'responderGrant',nativeEvent});
      receptor.props.onPress({type:'responderRelease',nativeEvent});
      assert.equal(abierta.slug,datos[i].slug,`${width}dp: ${datos[i].slug}`);
      assert.equal(ui.trazas.at(-1).changedTouches,1);
      assert.equal(ui.trazas.at(-1).selectedSlug,datos[i].slug);
    }
    if(width===320)assert.ok(interceptados>=8,'la regresión realmente debe cubrir los centros bajo cajas posteriores');
  }
});

test('activar los 26 botones por accesibilidad conserva el destino anunciado sin coordenadas táctiles',()=>{
  const ui=radar(320); let abierta;
  const arbol=ui.default({datos,onAbrir:p=>{abierta=p;},onFiltrar(){}});
  const dianas=nodos(arbol).filter(n=>n.type==='Pressable' && n.props.style?.[0]===ui.styles.diana);
  for(let i=0;i<dianas.length;i++) {
    for(const evento of [undefined,{type:'click',nativeEvent:{locationX:0,locationY:0}},
      {nativeEvent:{locationX:0,locationY:0,changedTouches:[]}}]) {
      dianas[i].props.onPress(evento);
      assert.equal(abierta.slug,datos[i].slug);
    }
  }
});

test('la escala de lectura crece sin bloquear fuente del sistema ni fijar altura de texto en tarjetas y navegación',()=>{
  assert.ok(tema.T.cuerpo.fontSize>=16 && tema.T.cuerpo.lineHeight>=24);
  assert.ok(tema.T.ficha.fontSize>=20 && tema.T.menor.fontSize>=14);
  for(const file of ['componentes/Ofertas.js','componentes/Navegacion.js']) {
    const source=fs.readFileSync(path.join(ROOT,file),'utf8');
    assert.doesNotMatch(source,/allowFontScaling=\{false\}|maxFontSizeMultiplier/);
  }
  const nav=fs.readFileSync(path.join(ROOT,'componentes/Navegacion.js'),'utf8');
  // Cinco botones: el rótulo baja a 11 px (GUIA-ACABADOS §6; ESPEC-INICIO §4) y sigue sin altura fija.
  assert.match(nav,/fontSize: 11, lineHeight: 15/);
  assert.doesNotMatch(nav,/e\.etiqueta[^\n]*numberOfLines/);
});

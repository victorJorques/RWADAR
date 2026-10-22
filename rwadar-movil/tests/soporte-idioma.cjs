'use strict';
// Existing screen harnesses keep their native doubles after the import move.
// Dedicated idioma tests exercise the real translation adapter separately.
const ReactReal=require('react');
const idioma=require('../lib/idioma');
const {crearPrimitivasIdioma}=require('../lib/idioma-nativo');
function soporteIdioma(react,nativo={}) {
  const React=react||ReactReal;
  if(typeof React.forwardRef!=='function'||typeof React.useSyncExternalStore!=='function') {
    return {...nativo,FuenteOriginal:'FuenteOriginal',SelectorIdioma:'SelectorIdioma',useIdioma:()=>idioma.obtenerIdioma()};
  }
  const primitives=crearPrimitivasIdioma(React,nativo,idioma);
  return {...primitives,FuenteOriginal:({children,style,idiomaOriginal='es-ES'})=>
    React.createElement(nativo.Text,{style,accessibilityLanguage:idiomaOriginal},children),SelectorIdioma:()=>null};
}
module.exports={soporteIdioma};

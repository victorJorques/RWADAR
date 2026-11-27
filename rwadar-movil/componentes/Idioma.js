import React, {useEffect,useState} from 'react';
import * as Native from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {C,F,R,UI} from '../lib/tema';
import * as idioma from '../lib/idioma';
import {crearPrimitivasIdioma} from '../lib/idioma-nativo';

const primitivas=crearPrimitivasIdioma(React,Native,idioma);
export const {Text,Pressable,View,Image,TextInput,ScrollView,Alert,useIdioma}=primitivas;
export function FuenteOriginal({children,idiomaOriginal='es-ES',style,aviso=true}){
  const actual=useIdioma();
  return <Native.View>
    {aviso&&actual==='en'?<Native.Text style={e.aviso}>Original source text ({idiomaOriginal.startsWith('es')?'Spanish':idiomaOriginal.startsWith('en')?'English':idiomaOriginal})</Native.Text>:null}
    {children!=null?<Native.Text style={style} accessibilityLanguage={idiomaOriginal}>{children}</Native.Text>:null}
  </Native.View>;
}
let carga;
// El idioma guardado se lee al abrir la app, no al entrar en Perfil: desde
// que el selector vive solo en Perfil, quien eligió English veía la app en
// castellano en cada arranque (prueba en móvil, 04/11/2026).
export function cargarIdiomaGuardado(){
  if(!carga)carga=idioma.cargarIdioma(AsyncStorage).catch(()=>idioma.obtenerIdioma());
  return carga;
}
export function SelectorIdioma({estilo}={}){
  const actual=useIdioma();
  const [error,setError]=useState(false);
  useEffect(()=>{cargarIdiomaGuardado();},[]);
  async function elegir(valor){
    setError(false);
    try{await idioma.cambiarIdioma(valor);}catch{setError(true);}
  }
  return <Native.View style={[e.contenedor,estilo]}>
    <Native.View style={e.fila} accessibilityRole="radiogroup"
      accessibilityLabel={idioma.traducir('Elige idioma')}>
      {['es','en'].map(valor=><Native.Pressable key={valor} onPress={()=>elegir(valor)}
        accessibilityRole="radio" accessibilityState={{checked:actual===valor}}
        accessibilityLabel={valor==='es'?'Español':'English'}
        style={({pressed})=>[e.boton,actual===valor&&e.activo,pressed&&e.pulsado]}>
        <Native.Text style={[e.texto,actual===valor&&e.textoActivo]}>{valor==='es'?'Español':'English'}</Native.Text>
      </Native.Pressable>)}
    </Native.View>
    {error?<Text accessibilityRole="alert" style={e.aviso}>No se pudo guardar el idioma. Puedes seguir usándolo durante esta sesión.</Text>:null}
  </Native.View>;
}
const e=Native.StyleSheet.create({
  contenedor:{paddingHorizontal:16,paddingVertical:8,backgroundColor:C.s0},
  fila:{flexDirection:'row',alignSelf:'flex-end',gap:4,flexWrap:'wrap'},
  // Como el segmentado de la web (GUIA-ACABADOS §7): sin borde, la opción
  // elegida en relieve tonal y nunca rellena de verde.
  boton:{minWidth:80,minHeight:UI.tactil||44,justifyContent:'center',alignItems:'center',
    paddingHorizontal:12,borderRadius:R.m||12},
  activo:{backgroundColor:C.ton2},pulsado:{backgroundColor:C.ton},
  texto:{fontFamily:F.media,fontSize:14,lineHeight:20,color:C.tx2},
  textoActivo:{color:C.tx,fontFamily:F.semi},aviso:{color:C.tx2,fontSize:13,lineHeight:19},
});

'use strict';
// Adaptador inyectable: comprueba referencias y eventos sin cargar Android en Node.
function crearPrimitivasIdioma(React,nativo,idioma){
  const leer=()=>idioma.obtenerIdioma();
  function useIdioma(){return React.useSyncExternalStore(idioma.suscribirIdioma,leer,leer);}
  const t=idioma.traducir;
  function hijos(valor){
    if(typeof valor==='string')return t(valor);
    if(Array.isArray(valor))return valor.map(hijos);
    return valor;
  }
  function propiedades(entrada){
    const salida={...entrada};
    delete salida.noTraducir;delete salida.idiomaOriginal;
    if(entrada.noTraducir){salida.accessibilityLanguage=entrada.idiomaOriginal||'es-ES';return salida;}
    for(const clave of ['accessibilityLabel','accessibilityHint','placeholder','title','alt'])
      if(typeof salida[clave]==='string')salida[clave]=t(salida[clave]);
    if(salida.accessibilityValue&&typeof salida.accessibilityValue.text==='string')
      salida.accessibilityValue={...salida.accessibilityValue,text:t(salida.accessibilityValue.text)};
    // Nunca traducir value/defaultValue: pueden contener correo, contraseña,
    // nombre u otro texto del usuario. Tampoco se cambian acciones ni IDs.
    return salida;
  }
  function envolver(nombre,traducirHijos=false){
    function Traducido(entrada,ref){
      useIdioma();
      const props=propiedades(entrada);
      if(ref)props.ref=ref;
      if(traducirHijos&&!entrada.noTraducir)props.children=hijos(props.children);
      return React.createElement(nativo[nombre],props);
    }
    const componente=React.forwardRef(Traducido);
    componente.displayName='Idioma'+nombre;
    return componente;
  }
  const Alert={...nativo.Alert,alert(titulo,mensaje,botones,opciones){
    return nativo.Alert.alert(t(titulo),t(mensaje),botones?.map(b=>({...b,text:t(b.text)})),opciones);
  }};
  return {useIdioma,propiedades,hijos,Alert,
    Text:envolver('Text',true),Pressable:envolver('Pressable'),View:envolver('View'),
    Image:envolver('Image'),TextInput:envolver('TextInput'),ScrollView:envolver('ScrollView')};
}
module.exports={crearPrimitivasIdioma};

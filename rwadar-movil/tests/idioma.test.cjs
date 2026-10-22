'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const idioma=require('../lib/idioma');
const {crearPrimitivasIdioma}=require('../lib/idioma-nativo');

test('español es el valor por defecto y los textos se conservan exactamente',()=>{
  const g=idioma.crearGestorIdioma();
  assert.equal(g.obtener(),'es');
  assert.equal(g.traducir('  Mínimo en euros\n'),'  Mínimo en euros\n');
});
test('las pantallas esenciales tienen traducciones completas y no cambian nombres',()=>{
  assert.equal(idioma.ingles('Inicio'),'Home');
  assert.equal(idioma.ingles('Buscar'),'Search');
  assert.equal(idioma.ingles('Mínimo en euros'),'Minimum in euros');
  assert.equal(idioma.ingles('Sin comprobar desde España'),'Not checked for access from Spain');
  assert.equal(idioma.ingles('Reventa entre inversores; depende de que haya compradores'),'Resale between investors; it depends on finding buyers');
  assert.equal(idioma.ingles('Lofty'),'Lofty');
});
test('las URL y correos embebidos son inmutables en etiquetas traducidas',()=>{
  for(const s of ['Ver fuente: https://example.test/Inmobiliario','Ver fuente: https://example.test/Inicio?x=Ofertas#Perfil',
    'Cerrar https://example.test/Inicio','Guardar mailto:Nombre.Inicio@example.test',
    'Correo: Nombre.Inicio@example.test']){
    const antes=s.match(/https?:\/\/\S+|mailto:\S+|[\w.+-]+@[\w.-]+/g);
    const despues=idioma.ingles(s).match(/https?:\/\/\S+|mailto:\S+|[\w.+-]+@[\w.-]+/g);
    assert.deepEqual(despues,antes,s);
  }
});
test('documentos sin traducción completa no sufren sustituciones parciales',()=>{
  const s='Condición de Inmobiliario: exige una inversión de 1.000,50 EUR; el contrato original prevalece.';
  assert.equal(idioma.ingles(s),s);
  const formato='  Nota original:\nInmobiliario  y  1.000,50 EUR\n';
  assert.equal(idioma.ingles(formato),formato);
  assert.equal(idioma.ingles('Cerrar Juan  Carlos'),'Close Juan  Carlos');
  const fuente=idioma.fuenteOriginal(s);
  assert.equal(fuente.texto,s);assert.equal(fuente.idioma,'es');assert.equal(fuente.esOriginal,true);
});
test('las traducciones recursivas no contaminan la caché de nivel superior',()=>{
  idioma.ingles('Cerrar Cerrar Cerrar Cerrar Cerrar Spiko');
  assert.equal(idioma.ingles('Cerrar Spiko'),'Close Spiko');
  assert.equal(idioma.ingles('Ver ficha de Spiko en Spiko'),'View details for Spiko from Spiko');
});
test('fragmentos JSX y etiquetas accesibles reales se traducen conservando cifras',()=>{
  assert.deepEqual([26,' de ',26].map(s=>typeof s==='string'?idioma.ingles(s):s),[26,' of ',26]);
  assert.deepEqual([12,' referencias'].map(s=>typeof s==='string'?idioma.ingles(s):s),[12,' references']);
  assert.equal(idioma.ingles('Mostrar ofertas'),'Show offers');
  assert.equal(idioma.ingles('Mostrar plataformas'),'Show platforms');
  assert.equal(idioma.ingles('Brickwise: ver 12 referencias'),'Brickwise: view 12 references');
  assert.equal(idioma.ingles('Guardar'),'Save');
  assert.equal(idioma.ingles('☆ Guardar'),'☆ Save');
  assert.equal(idioma.ingles('★ Guardada'),'★ Saved');
  assert.equal(idioma.ingles('Guardar Spiko en Perfil'),'Save Spiko to Profile');
  assert.equal(idioma.ingles('Quitar Spiko de guardadas'),'Remove Spiko from saved items');
  assert.equal(idioma.ingles('Ver 12 referencias →'),'View 12 references →');
});
test('las etiquetas de accesibilidad compuestas conservan el nombre del producto',()=>{
  const casos={
    'Ver ficha de':'View details for','en Perfil':'in Profile','de guardadas':'from saved offers',
    'Cerrar ficha de':'Close platform details for','Estado de acceso:':'Access status:',
    'Abrir ficha.':'Open details.','ver':'view','revisado el':'reviewed on',
    'Fuente consultada 22/10/2026':'Source checked on 22/10/2026',
    'Revisión documental 22/10/2026':'Documentary review 22/10/2026',
    'Perfil, 3':'Profile, 3','Filtrar por Inmobiliario':'Filter by Property',
  };
  for(const [es,en]of Object.entries(casos))assert.equal(idioma.ingles(es),en);
});
test('la elección sobrevive a una instancia nueva sin persistir otros datos',async()=>{
  const valores=new Map();const escritos=[];
  const almacen={getItem:async k=>valores.get(k),setItem:async(k,v)=>{escritos.push([k,v]);valores.set(k,v);}};
  const g=idioma.crearGestorIdioma();await g.cargar(almacen);await g.cambiar('en');
  const nuevo=idioma.crearGestorIdioma();await nuevo.cargar(almacen);
  assert.equal(nuevo.obtener(),'en');assert.deepEqual(escritos,[[idioma.CLAVE_IDIOMA,'en']]);
});
test('un valor guardado inválido no habilita idiomas ni código arbitrarios',async()=>{
  const g=idioma.crearGestorIdioma();await g.cargar({getItem:async()=>'<script>alert(1)</script>',setItem:async()=>{}});
  assert.equal(g.obtener(),'es');assert.throws(()=>g.cambiar('fr'),RangeError);
});
test('una lectura antigua no revierte una selección explícita reciente',async()=>{
  let resolver;
  const g=idioma.crearGestorIdioma();
  const carga=g.cargar({getItem:()=>new Promise(r=>resolver=r),setItem:async()=>{}});
  await g.cambiar('en');resolver('es');await carga;
  assert.equal(g.obtener(),'en');
});
test('cambios rápidos se guardan por orden y prevalece la última selección',async()=>{
  let valor;
  const g=idioma.crearGestorIdioma();await g.cargar({getItem:async()=>null,setItem:async(k,v)=>{await new Promise(r=>setTimeout(r,v==='en'?5:0));valor=v;}});
  await Promise.all([g.cambiar('en'),g.cambiar('es')]);assert.equal(valor,'es');assert.equal(g.obtener(),'es');
});
test('un fallo de almacenamiento conserva el idioma elegido en memoria',async()=>{
  const g=idioma.crearGestorIdioma();await g.cargar({getItem:async()=>{throw Error('read');},setItem:async()=>{throw Error('write');}});
  await assert.rejects(g.cambiar('en'));assert.equal(g.obtener(),'en');
});
test('la suscripción notifica cambios y se elimina sin desmontar la aplicación',async()=>{
  const g=idioma.crearGestorIdioma();let n=0;const quitar=g.suscribir(()=>n++);
  await g.cambiar('en');await g.cambiar('en');quitar();await g.cambiar('es');assert.equal(n,1);
});
function adaptador(g){
  const React={useSyncExternalStore:(suscribir,leer)=>leer(),forwardRef:render=>({render}),createElement:(tipo,props)=>({tipo,props})};
  const alertas=[];const nativo={...Object.fromEntries(['Text','Pressable','View','Image','TextInput','ScrollView'].map(s=>[s,s])),Alert:{alert:(...args)=>alertas.push(args)}};
  const api={obtenerIdioma:g.obtener,suscribirIdioma:g.suscribir,traducir:g.traducir};
  return {ui:crearPrimitivasIdioma(React,nativo,api),alertas};
}
test('el adaptador nativo traduce placeholder y a11y y conserva valor, ref y eventos',async()=>{
  const g=idioma.crearGestorIdioma();await g.cambiar('en');const {ui}=adaptador(g);
  const evento=()=>{},ref={current:null};const entrada={value:'Inicio',defaultValue:'Guardar',placeholder:'Correo',accessibilityLabel:'Mostrar ofertas',onChangeText:evento};
  const nodo=ui.TextInput.render(entrada,ref);
  assert.equal(nodo.props.placeholder,'Email');assert.equal(nodo.props.accessibilityLabel,'Show offers');
  assert.equal(nodo.props.value,'Inicio');assert.equal(nodo.props.defaultValue,'Guardar');
  assert.equal(nodo.props.onChangeText,evento);assert.equal(nodo.props.ref,ref);assert.equal(entrada.placeholder,'Correo');
});
test('el texto original y sus cifras quedan intactos y conservan idioma accesible',async()=>{
  const g=idioma.crearGestorIdioma();await g.cambiar('en');const {ui}=adaptador(g);
  const s='Mínimo en euros';const n=ui.Text.render({children:s,noTraducir:true,idiomaOriginal:'es-ES'});
  assert.equal(n.props.children,s);assert.equal(n.props.accessibilityLanguage,'es-ES');assert(!Object.hasOwn(n.props,'noTraducir'));
});
test('los hijos textuales cambian sin cambiar cifras ni elementos anidados',async()=>{
  const g=idioma.crearGestorIdioma();await g.cambiar('en');const {ui}=adaptador(g),elemento={tipo:'View'};
  const n=ui.Text.render({children:[26,' de ',26,elemento]});assert.deepEqual(n.props.children,[26,' of ',26,elemento]);
});
test('los diálogos de cuenta conservan callbacks y la palabra de confirmación BORRAR',async()=>{
  const g=idioma.crearGestorIdioma();await g.cambiar('en');const {ui,alertas}=adaptador(g),fn=()=>{};
  ui.Alert.alert('Borrar mi cuenta','Escribe BORRAR para confirmar la baja.',[{text:'Cancelar',onPress:fn}]);
  assert.equal(alertas[0][0],'Delete my account');assert.match(alertas[0][1],/BORRAR/);assert.equal(alertas[0][2][0].text,'Cancel');assert.equal(alertas[0][2][0].onPress,fn);
});

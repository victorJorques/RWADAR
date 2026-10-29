'use strict';
/* Leaflet 1.9.4 se sirve localmente. Las teselas solo se solicitan tras
   «Cargar mapa». La búsqueda es local; la posición vive solo en memoria. */
(() => {
 function iniciar(){
  const U=globalThis.RWADARMapaUtil,panel=document.getElementById('buscarMapa'),lista=document.getElementById('emiLista');
  if(!U||!panel||!lista)return;
  const porId=id=>document.getElementById(id),estado=porId('mapaEstado'),cargar=porId('mapaCargar');
  const zona=porId('mapaZona'),usar=porId('mapaUbicacion'),borrar=porId('mapaQuitarUbicacion');
  const coleccionMapa=porId('mapaColeccion'),coleccionesLista=porId('emiColecciones');
  let mapa=null,grupo=null,posicion=null,origen=null,limites=null,ubicaciones=[],cargando=false,peticion=0,coleccionesListaOcultas=null;
  const texto=(etiqueta,valor,clase)=>{const n=document.createElement(etiqueta);n.textContent=valor;if(clase)n.className=clase;return n;};
  const anunciar=mensaje=>{estado.textContent=mensaje;};
  const fecha=iso=>iso.split('-').reverse().join('/');
  function actuales(){
   if(typeof CATALOGO_EMBEBIDO_BLOQUEADO!=='undefined'&&CATALOGO_EMBEBIDO_BLOQUEADO)return [];
   const ofertas=typeof EMI!=='undefined'?EMI:[];
   const coleccion=coleccionMapa.value||'todas';
   return ofertas.filter(o=>o?.catalogo===true&&(coleccion==='todas'||o.coleccion===coleccion)&&
    (typeof ofertaLocalValida!=='function'||ofertaLocalValida(o))&&
    (typeof coincideOfertaLocal!=='function'||coincideOfertaLocal(o)));
  }
  function filas(){
   let datos=U.buscar(U.unir(actuales(),ubicaciones),zona.value);
   if(limites)datos=datos.filter(f=>limites.contains([f.ubicacion.lat,f.ubicacion.lng]));
   return U.ordenar(datos,origen);
  }
  function precision(p){return p.precision==='ciudad'?'Ciudad aproximada · no señala el inmueble':'Ubicación indicada por el proveedor';}
  function datosFicha(f,popup=false){
   const o=f.oferta,p=f.ubicacion,n=document.createElement('article');n.className=popup?'mapa-popup':'mapa-ficha';
   // Nombres y direcciones documentales no se traducen como interfaz.
   const nombre=texto('h4',o.titulo);nombre.setAttribute('translate','no');n.appendChild(nombre);
   n.appendChild(texto('span',({principales:'Principal',secundario:'Reventa',en_camino:'Próxima'})[o.coleccion]||'Referencia','mapa-coleccion'));
   const lugar=texto('p',p.lugar);lugar.setAttribute('translate','no');n.appendChild(lugar);
   n.appendChild(texto('span',precision(p),'mapa-precision'));
   if(f.distanciaKm!==null){
    const km=f.distanciaKm<1?'< 1':Math.round(f.distanciaKm).toLocaleString('es-ES');
    n.appendChild(texto('p','Aprox. '+km+' km '+(p.precision==='ciudad'?'hasta la ciudad':'hasta el punto publicado'),'mapa-distancia'));
   }
   if(p.nota)n.appendChild(texto('p',p.nota));
   const fuente=document.createElement('a');fuente.href=p.fuente;fuente.target='_blank';fuente.rel='noopener noreferrer';
   fuente.className='mapa-fuente';fuente.textContent='Fuente · '+fecha(p.fechaConsulta);n.appendChild(fuente);
   n.appendChild(document.createElement('br'));
   const ficha=document.createElement('a');ficha.href='/ofertas/'+encodeURIComponent(o.slug);ficha.className='mapa-ficha-enlace';
   ficha.textContent='Ver ficha →';ficha.setAttribute('aria-label','Ver ficha de '+o.titulo);n.appendChild(ficha);return n;
  }
  function pintar(ajustar=false){
   if(!mapa||panel.hidden)return;
   if(coleccionesLista)coleccionesLista.hidden=true;
   const datos=filas(),elegibles=actuales(),conPunto=U.unir(elegibles,ubicaciones),sinPunto=elegibles.length-conPunto.length;
   grupo.clearLayers();
   for(const conjunto of U.agrupar(datos)){
    const p=conjunto[0].ubicacion,aproximado=conjunto.every(f=>f.ubicacion.precision==='ciudad');
    const icono=L.divIcon({className:'mapa-marcador'+(aproximado?' aproximado':''),html:String(conjunto.length),iconSize:[32,32],iconAnchor:[16,16]});
    const titulo=conjunto.map(f=>f.oferta.titulo).join(', ');
    const marcador=L.marker([p.lat,p.lng],{icon:icono,title:titulo,alt:titulo,keyboard:true});
    const contenido=document.createElement('div');conjunto.forEach(f=>contenido.appendChild(datosFicha(f,true)));
    marcador.bindPopup(contenido,{maxWidth:300});grupo.addLayer(marcador);
   }
   const resultados=porId('mapaResultados');resultados.replaceChildren();
   for(const f of datos){const li=document.createElement('li');li.appendChild(datosFicha(f));resultados.appendChild(li);}
   porId('mapaResultadosTitulo').textContent=origen?'Más próximos al '+(origen.tipo==='ubicacion'?'punto de tu ubicación':'centro de la zona'):'Activos con ubicación documentada';
   porId('mapaCuenta').textContent=datos.length+' fichas en '+U.agrupar(datos).length+' puntos. '+sinPunto+
    ' de '+elegibles.length+' fichas de esta selección no tienen una ubicación del activo documentada; siguen disponibles en Lista.';
   porId('mapaVacio').hidden=datos.length>0;
   porId('mapaOrigen').textContent=origen?'Distancias en línea recta y orientativas; no son rutas ni recomendaciones. '+
    (origen.tipo==='ubicacion'&&Number.isFinite(origen.precision)?'El dispositivo estima tu posición con un margen de '+Math.ceil(origen.precision).toLocaleString('es-ES')+' m.':'Se calculan desde el centro de la zona seleccionada.'):
    'Selecciona una zona o usa tu ubicación para ordenar por distancia. Los números agrupan fichas que comparten coordenadas.';
   if(ajustar&&datos.length){
    const puntos=datos.map(f=>[f.ubicacion.lat,f.ubicacion.lng]);
    mapa.fitBounds(L.latLngBounds(puntos),{padding:[36,36],maxZoom:13,animate:false});
   }
   requestAnimationFrame(()=>mapa?.invalidateSize({pan:false}));
  }
  function cambiarVista(vista){
   const esMapa=vista==='mapa';lista.hidden=esMapa;panel.hidden=!esMapa;
   if(coleccionesLista){
    if(esMapa){if(coleccionesListaOcultas===null)coleccionesListaOcultas=coleccionesLista.hidden;coleccionesLista.hidden=true;}
    else if(coleccionesListaOcultas!==null){coleccionesLista.hidden=coleccionesListaOcultas;coleccionesListaOcultas=null;}
   }
   for(const b of document.querySelectorAll('[data-buscar-vista]'))b.setAttribute('aria-pressed',String(b.dataset.buscarVista===vista));
   if(esMapa){if(mapa)pintar();else anunciar('Pulsa Cargar mapa para conectar con OpenStreetMap.');}
  }
  function cargarBiblioteca(){
   if(globalThis.L)return Promise.resolve();
   const rutaCss=panel.dataset.leafletCss,rutaJs=panel.dataset.leafletJs;
   // El publicador pone la huella en el HTML, también en estos atributos.
   // Solo admitimos las rutas locales concretas de esta biblioteca.
   const rutaValida=(ruta,extension)=>new RegExp('^/assets/leaflet-1\\.9\\.4(?:\\.[a-f0-9]{12})?\\.'+extension+'$').test(ruta||'');
   if(!rutaValida(rutaCss,'css')||!rutaValida(rutaJs,'js'))return Promise.reject(Error('Las rutas locales del mapa no son válidas.'));
   return new Promise((resolver,rechazar)=>{
    const css=document.createElement('link');css.rel='stylesheet';css.href=rutaCss;
    const js=document.createElement('script');js.src=rutaJs;
    let cssLista=false,jsLista=false,terminado=false;
    const fin=error=>{if(terminado)return;if(error){terminado=true;clearTimeout(reloj);css.remove();js.remove();rechazar(error);}
     else if(cssLista&&jsLista){terminado=true;clearTimeout(reloj);resolver();}};
    const reloj=setTimeout(()=>fin(Error('No se pudo cargar la biblioteca del mapa.')),12000);
    css.onload=()=>{cssLista=true;fin();};js.onload=()=>{jsLista=!!globalThis.L;fin(jsLista?null:Error('Biblioteca del mapa no disponible.'));};
    css.onerror=js.onerror=()=>fin(Error('No se pudo cargar la biblioteca del mapa.'));
    document.head.append(css,js);
   });
  }
  async function activar(){
   if(cargando||mapa)return;cargando=true;cargar.disabled=true;anunciar('Cargando mapa…');
   try{
    const respuesta=await fetch('/assets/mapa-ubicaciones-20261027.json',{credentials:'omit',cache:'default'});
    if(!respuesta.ok)throw Error('No se pudieron cargar las ubicaciones documentadas.');
    ubicaciones=U.validar(await respuesta.json());await cargarBiblioteca();
    porId('mapaExperiencia').hidden=false;
    mapa=L.map('mapaLienzo',{scrollWheelZoom:false,keyboard:true,tap:true}).setView([30,0],2);
    // Peticiones normales del navegador, sin precarga, descarga masiva ni
    // proxy. Origin identifica RWAdar aun cuando Auth use no-referrer.
    const teselas=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
     attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
     maxZoom:19,keepBuffer:0,updateWhenIdle:true,detectRetina:false,referrerPolicy:'origin'}).addTo(mapa);
    teselas.on('tileerror',()=>anunciar('Algunas teselas no se han podido cargar. Las fichas y sus fuentes siguen disponibles en el listado del mapa.'));
    grupo=L.featureGroup().addTo(mapa);
    mapa.zoomControl.getContainer().setAttribute('aria-label','Zoom del mapa');
    mapa.zoomControl.getContainer().querySelector('.leaflet-control-zoom-in').setAttribute('aria-label','Acercar mapa');
    mapa.zoomControl.getContainer().querySelector('.leaflet-control-zoom-out').setAttribute('aria-label','Alejar mapa');
    porId('mapaLienzo').setAttribute('aria-label','Mapa de activos. Usa las flechas para moverte y más o menos para acercar o alejar. Las mismas fichas están en el listado de al lado.');
    porId('mapaPermiso').hidden=true;pintar(true);
    usar.disabled=!navigator.geolocation;
    anunciar(navigator.geolocation?'Mapa listo. Puedes moverte, ampliar o buscar por zona sin compartir tu ubicación.':'El navegador no ofrece geolocalización. Puedes buscar por zona y mover el mapa.');
   }catch(error){
    if(mapa){mapa.remove();mapa=null;grupo=null;}
    porId('mapaExperiencia').hidden=true;porId('mapaPermiso').hidden=false;
    anunciar(error.message||'El mapa no está disponible. Puedes continuar en Lista.');
   }finally{cargando=false;cargar.disabled=false;}
  }
  function solicitarUbicacion(){
   if(!mapa||!navigator.geolocation)return;
   const solicitud=++peticion;usar.disabled=true;anunciar('Esperando tu permiso para usar la ubicación una vez…');
   navigator.geolocation.getCurrentPosition(p=>{
    if(solicitud!==peticion)return;usar.disabled=false;
    const punto={lat:p.coords.latitude,lng:p.coords.longitude,tipo:'ubicacion',precision:p.coords.accuracy};
    if(!U.coordenadas(punto)){anunciar('El dispositivo no facilitó una posición válida. Prueba la búsqueda por zona.');return;}
    origen=punto;limites=null;zona.value='';
    if(posicion)mapa.removeLayer(posicion);
    posicion=L.circleMarker([punto.lat,punto.lng],{radius:8,color:'#fff',weight:3,fillColor:'#2463cf',fillOpacity:1}).addTo(mapa);
    mapa.setView([punto.lat,punto.lng],10,{animate:false});borrar.hidden=false;pintar();
    anunciar('Ubicación usada una vez. Mostramos las fichas ordenadas por distancia; la posición no se guarda.');
   },error=>{
    if(solicitud!==peticion)return;usar.disabled=false;
    anunciar(error.code===1?'No has dado permiso para la ubicación. Puedes buscar por zona y mover el mapa.':
     error.code===3?'La ubicación ha tardado demasiado. Puedes reintentar o buscar por zona.':'No se ha podido obtener la ubicación. Puedes buscar por zona.');
   },{enableHighAccuracy:false,timeout:10000,maximumAge:0});
  }
  for(const b of document.querySelectorAll('[data-buscar-vista]'))b.addEventListener('click',()=>cambiarVista(b.dataset.buscarVista));
  cargar.addEventListener('click',activar);usar.addEventListener('click',solicitarUbicacion);
  borrar.addEventListener('click',()=>{
   ++peticion;origen=null;if(posicion){mapa.removeLayer(posicion);posicion=null;}borrar.hidden=true;usar.disabled=false;pintar();
   anunciar('Tu posición se ha quitado de esta vista.');
  });
  zona.addEventListener('input',()=>{limites=null;pintar();});
  coleccionMapa.addEventListener('change',()=>{limites=null;pintar(true);});
  porId('mapaZonaForm').addEventListener('submit',e=>{
   e.preventDefault();limites=null;const datos=filas();
   if(!datos.length){pintar();anunciar('No hay activos documentados que coincidan con esa zona y los filtros actuales. Prueba otra localidad o Lista.');return;}
   pintar(true);const centro=mapa.getCenter();origen={lat:centro.lat,lng:centro.lng,tipo:'zona'};pintar();
   anunciar('Zona encontrada en las ubicaciones documentadas. Las distancias parten de su centro.');
  });
  porId('mapaBuscarZona').addEventListener('click',()=>{
   limites=mapa.getBounds();const centro=mapa.getCenter();origen={lat:centro.lat,lng:centro.lng,tipo:'zona'};pintar();
   anunciar('Mostramos los activos de la zona visible, ordenados desde el centro del mapa.');
  });
  porId('mapaVerTodas').addEventListener('click',()=>{limites=null;zona.value='';pintar(true);anunciar('Se muestran todos los puntos documentados de los filtros actuales.');});
  porId('mapaVolverLista').addEventListener('click',()=>cambiarVista('lista'));
  new MutationObserver(()=>pintar()).observe(lista,{childList:true});
  globalThis.RWADARMapa=Object.freeze({refrescar:()=>pintar()});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
})();

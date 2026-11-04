'use strict';
/* Leaflet 1.9.4 se sirve localmente. Las teselas solo se solicitan tras
   «Cargar mapa». La búsqueda es local; la posición vive solo en memoria. */
(() => {
 // Mismo orden que CATMETA (rwadar-20260820.js): la clase cat-N pinta cada
 // tipo de activo con el color del radar.
 const CATEGORIAS=['Inmobiliario','Crédito privado','Tesoro y fondos','Acciones y capital privado','Materias primas','Infraestructura'];
 const CORTAS={'Crédito privado':'Crédito','Tesoro y fondos':'Tesoro','Acciones y capital privado':'Acciones'};
 const COLECCIONES={principales:'Oferta principal',secundario:'Reventa',en_camino:'Próxima'};
 const PRECISIONES={activo:'Punto indicado por el proveedor',ciudad:'Ciudad aproximada'};
 function iniciar(){
  const U=globalThis.RWADARMapaUtil,panel=document.getElementById('buscarMapa'),lista=document.getElementById('emiLista');
  if(!U||!panel||!lista)return;
  const porId=id=>document.getElementById(id),estado=porId('mapaEstado'),cargar=porId('mapaCargar'),lienzo=porId('mapaLienzo');
  const zona=porId('mapaZona'),usar=porId('mapaUbicacion'),borrar=porId('mapaQuitarUbicacion');
  const coleccionMapa=porId('mapaColeccion'),coleccionesLista=porId('emiColecciones'),sinTeselas=porId('mapaSinTeselas');
  const aviso=porId('mapaAviso'),avisoTexto=porId('mapaAvisoTexto'),avisos=porId('mapaAvisos');
  let mapa=null,grupo=null,teselas=null,posicion=null,origen=null,limites=null,ubicaciones=null,pedidas=null;
  let conVista=false,cargando=false,peticion=0,coleccionesListaOcultas=null,visibles=[],huella='',abierta=null;
  // Dos marcadores a menos de esto se tapan (28 px y su aro): van en uno.
  const RADIO=40,ZOOM_TOPE=18;
  const texto=(etiqueta,valor,clase)=>{const n=document.createElement(etiqueta);n.textContent=valor;if(clase)n.className=clase;return n;};
  // Nombres y direcciones documentales no se traducen como interfaz.
  const original=n=>{n.setAttribute('translate','no');return n;};
  const decorativo=n=>{n.setAttribute('aria-hidden','true');return n;};
  // Lo rutinario solo se anuncia; lo que pide hacer algo también se ve:
  // antes de cargar, bajo la tarjeta; con el mapa, como aviso sobre él, para
  // no empujar los mandos que se acaban de pulsar.
  const anunciar=(mensaje,visible=false)=>{
   const enMapa=!!mapa&&!porId('mapaExperiencia').hidden;
   estado.textContent=mensaje;estado.dataset.visible=visible&&!enMapa?'si':'no';
   if(aviso){aviso.hidden=!(visible&&enMapa);if(visible&&enMapa)avisoTexto.textContent=mensaje;}
  };
  const fecha=iso=>iso.split('-').reverse().join('/');
  const ofertas=n=>n+(n===1?' oferta':' ofertas');
  const orden=()=>typeof CATMETA!=='undefined'?Object.keys(CATMETA):CATEGORIAS;
  const claseTipo=c=>{const i=orden().indexOf(c);return i<0?'':' cat-'+i;};
  const corta=c=>typeof catCorta==='function'?catCorta(c):CORTAS[c]||c;
  // Cifras con el formato del idioma elegido: «15.000» en inglés se lee 15.
  const cifra=(n,decimales=0)=>n.toLocaleString(globalThis.RWAdarIdioma?.obtenerIdioma?.()==='en'?'en-GB':'es-ES',{maximumFractionDigits:decimales});
  const km=d=>d<1?'< 1 km':cifra(Math.round(d))+' km';
  const margenTexto=m=>m>=1000?'± '+cifra(m/1000,1)+' km':'± '+cifra(Math.ceil(m))+' m';
  function actuales(){
   if(typeof CATALOGO_EMBEBIDO_BLOQUEADO!=='undefined'&&CATALOGO_EMBEBIDO_BLOQUEADO)return [];
   const lote=typeof EMI!=='undefined'?EMI:[];
   const coleccion=coleccionMapa.value||'todas';
   return lote.filter(o=>o?.catalogo===true&&(coleccion==='todas'||o.coleccion===coleccion)&&
    (typeof ofertaLocalValida!=='function'||ofertaLocalValida(o))&&
    (typeof coincideOfertaLocal!=='function'||coincideOfertaLocal(o)));
  }
  function filas(){
   let datos=U.buscar(U.unir(actuales(),ubicaciones||[]),zona.value);
   if(limites)datos=datos.filter(f=>limites.contains([f.ubicacion.lat,f.ubicacion.lng]));
   return U.ordenar(datos,origen);
  }
  // El archivo de ubicaciones es propio y local: pedirlo al abrir Mapa no
  // contacta con OpenStreetMap y permite decir cuántas ofertas se sitúan.
  function cargarUbicaciones(){
   if(ubicaciones)return Promise.resolve(ubicaciones);
   if(!pedidas)pedidas=fetch('/assets/mapa-ubicaciones-20261027.json',{credentials:'omit',cache:'default'})
    .then(r=>{if(!r.ok)throw Error();return r.json();})
    .then(d=>{ubicaciones=U.validar(d);return ubicaciones;})
    .catch(()=>{pedidas=null;throw Error('No se pudieron cargar las ubicaciones documentadas.');});
   return pedidas;
  }
  function pintarPermiso(){
   const linea=porId('mapaPermisoCuenta');
   if(!ubicaciones){linea.hidden=true;return;}
   const elegibles=actuales(),n=U.unir(elegibles,ubicaciones).length;
   linea.textContent=n?n+' de '+ofertas(elegibles.length)+(n===1?' tiene':' tienen')+' ubicación documentada.':
    'Ninguna oferta de esta selección tiene ubicación documentada.';
   linea.hidden=false;
  }
  function tipo(f){
   const o=f.oferta,p=document.createElement('p');p.className='mapa-tipo';
   const punto=decorativo(document.createElement('span'));punto.className='mapa-punto'+claseTipo(o.categoria);
   p.append(punto,texto('span',corta(o.categoria)),decorativo(texto('span',' · ','mapa-sep')),
    texto('span',COLECCIONES[o.coleccion]||'Referencia','mapa-coleccion'));
   if(f.distanciaKm!==null&&f.distanciaKm!==undefined)p.append(decorativo(texto('span',' · ','mapa-sep')),texto('span','≈ '+km(f.distanciaKm),'mapa-distancia'));
   return p;
  }
  function fuente(p){
   const a=document.createElement('a');a.href=p.fuente;a.target='_blank';a.rel='noopener noreferrer';a.className='mapa-fuente';
   a.append(texto('span','Fuente'),texto('span',' · '+fecha(p.fechaConsulta)),decorativo(texto('span',' ↗')));
   return a;
  }
  // Abre la misma ficha que la lista: el clic sube hasta #emisiones, que
  // atiende [data-oferta-detalle]. Leaflet 1.9 no corta el clic del popup.
  function verFicha(o){
   const b=document.createElement('button');b.type='button';b.className='mapa-ver';b.dataset.ofertaDetalle=o.slug;
   b.setAttribute('aria-label','Ver ficha de '+o.titulo);
   b.append(texto('span','Ver ficha'),decorativo(texto('span',' →')));
   return b;
  }
  const lugar=p=>original(texto('p',p.lugar,'mapa-lugar'));
  const precision=p=>texto('p',PRECISIONES[p.precision],'mapa-precision '+p.precision);
  const puntos=conjunto=>conjunto.map(f=>[f.ubicacion.lat,f.ubicacion.lng]);
  function contenidoPopup(conjunto,separables){
   const n=document.createElement('div');n.className='mapa-popup';
   const cerrar=document.createElement('button');cerrar.type='button';cerrar.className='mapa-popup-cerrar';cerrar.setAttribute('aria-label','Cerrar');
   cerrar.addEventListener('click',()=>mapa&&mapa.closePopup());n.appendChild(cerrar);
   // Ofertas cercanas pero no en el mismo punto: un botón acerca hasta separarlas.
   if(separables){
    const cab=document.createElement('div');cab.className='mapa-popup-grupo';
    const acercar=document.createElement('button');acercar.type='button';acercar.className='mapa-acercar';acercar.textContent='Acercar';
    acercar.addEventListener('click',()=>{if(!mapa)return;mapa.closePopup();
     mapa.fitBounds(L.latLngBounds(puntos(conjunto)),{padding:[64,64],maxZoom:ZOOM_TOPE});});
    cab.append(texto('p',ofertas(conjunto.length)+' en esta zona'),acercar);n.appendChild(cab);
   }
   for(const f of conjunto){
    const a=document.createElement('article');a.className='mapa-popup-oferta';
    const pie=document.createElement('div');pie.className='mapa-popup-pie';pie.append(fuente(f.ubicacion),verFicha(f.oferta));
    const titulo=original(texto('h4',f.oferta.titulo));titulo.tabIndex=-1;
    a.append(titulo,tipo(f),lugar(f.ubicacion),precision(f.ubicacion),pie);n.appendChild(a);
   }
   // Con el foco dentro de la ficha, Leaflet no atiende Escape: lo hacemos aquí.
   n.addEventListener('keydown',e=>{if(e.key==='Escape'&&mapa){e.stopPropagation();mapa.closePopup();}});
   return n;
  }
  function miniatura(o){
   const datos=typeof imagenOfertaLocal==='function'?imagenOfertaLocal(o):null;
   if(!datos||!datos.src)return null;
   const img=document.createElement('img');img.className='mapa-fila-img';img.src=datos.src;img.alt='';
   img.loading='lazy';img.decoding='async';img.width=64;img.height=64;
   if(datos.respaldo)img.dataset.respaldo=datos.respaldo;
   return img;
  }
  function filaLista(f){
   const a=document.createElement('article');a.className='mapa-fila';
   const img=miniatura(f.oferta);if(img)a.appendChild(img);
   const pie=document.createElement('p');pie.className='mapa-fila-pie';pie.appendChild(fuente(f.ubicacion));
   a.append(original(texto('h4',f.oferta.titulo)),tipo(f),lugar(f.ubicacion),precision(f.ubicacion),pie,verFicha(f.oferta));
   return a;
  }
  // Leaflet lee el margen del autoPan al abrir cada ficha: se calcula en ese
  // momento para que no quede bajo la cabecera fija, la barra inferior ni
  // los botones de zoom, que van abajo a la derecha.
  function margen(lado){
   return {x:12,get y(){
    const r=lienzo.getBoundingClientRect();
    if(lado==='arriba'){
     let tope=0;
     for(const n of document.querySelectorAll('.hdr,.movil-cabecera'))if(n.getClientRects().length)tope=Math.max(tope,n.getBoundingClientRect().bottom);
     // Los avisos van arriba, sobre el mapa: la ficha se abre por debajo.
     if(avisos&&avisos.offsetHeight)tope=Math.max(tope,avisos.getBoundingClientRect().bottom);
     return 12+Math.max(0,tope-r.top);
    }
    let suelo=innerHeight;
    for(const n of document.querySelectorAll('.movil-nav'))if(n.getClientRects().length)suelo=Math.min(suelo,n.getBoundingClientRect().top);
    const zoom=lienzo.querySelector('.leaflet-control-zoom');
    return 12+Math.max(zoom?r.bottom-zoom.getBoundingClientRect().top:0,r.bottom-suelo);
   }};
  }
  function marcador(conjunto){
   // Un grupo se dibuja en el centro de sus puntos; uno solo, en el suyo.
   const p={lat:conjunto.reduce((s,f)=>s+f.ubicacion.lat,0)/conjunto.length,lng:conjunto.reduce((s,f)=>s+f.ubicacion.lng,0)/conjunto.length};
   const tipos=new Set(conjunto.map(f=>f.oferta.categoria));
   const aproximado=conjunto.every(f=>f.ubicacion.precision==='ciudad');
   const separables=conjunto.length>1&&typeof mapa.project==='function'&&
    U.agruparCerca(conjunto,u=>mapa.project([u.lat,u.lng],ZOOM_TOPE),RADIO).length>1;
   const icono=typeof CATMETA!=='undefined'&&CATMETA[conjunto[0].oferta.categoria]?.ic;
   // Contenido propio (cifras y trazos de CATMETA), sin datos del catálogo.
   const dentro=conjunto.length>1?'<b>'+conjunto.length+'</b>':icono?'<svg viewBox="0 0 24 24" aria-hidden="true">'+icono+'</svg>':'';
   const clases='mapa-pin'+(tipos.size===1?claseTipo(conjunto[0].oferta.categoria):' mixto')+(aproximado?' aproximado':'');
   const titulo=conjunto.map(f=>f.oferta.titulo).join(', ');
   const marca=L.marker([p.lat,p.lng],{icon:L.divIcon({className:'mapa-marcador',html:'<span class="'+clases+'">'+dentro+'</span>',
    iconSize:[44,44],iconAnchor:[22,22],popupAnchor:[0,-14]}),title:titulo,alt:titulo,keyboard:true,riseOnHover:true});
   // Alto máximo: lo que queda entre arriba y el zoom (abajo), para que una
   // ficha de varias ofertas se desplace por dentro y no tape los botones.
   const contenido=contenidoPopup(conjunto,separables);
   marca.bindPopup(contenido,{minWidth:248,maxWidth:288,maxHeight:Math.max(200,Math.min(380,(lienzo.clientHeight||480)-200)),
    closeButton:false,className:'mapa-popup-caja',autoPanPaddingTopLeft:margen('arriba'),autoPanPaddingBottomRight:margen('abajo')});
   marca.slugs=conjunto.map(f=>f.oferta.slug);
   marca.nombre=conjunto.length>1?ofertas(conjunto.length)+': '+titulo:titulo;
   // El foco entra en la ficha al abrirla y vuelve a su marcador al cerrarla
   // (con la X, Escape o «Acercar»), salvo que el usuario ya esté en otro sitio.
   marca.on?.({popupopen:()=>{abierta=marca;marca.getElement()?.classList.add('activo');contenido.querySelector('h4')?.focus({preventScroll:true});},
    popupclose:()=>{
     if(abierta===marca)abierta=null;
     const el=marca.getElement(),foco=document.activeElement;if(!el)return;el.classList.remove('activo');
     if(!foco||foco===document.body||contenido.contains(foco))el.focus({preventScroll:true});
    }});
   return marca;
  }
  // Se agrupa con la proyección del zoom actual y se rehace al cambiar de
  // zoom; si los grupos no cambian, no se toca nada (la ficha sigue abierta).
  function agrupados(){
   if(typeof mapa.project!=='function'||typeof mapa.getZoom!=='function')return U.agrupar(visibles);
   const z=mapa.getZoom();return U.agruparCerca(visibles,u=>mapa.project([u.lat,u.lng],z),RADIO);
  }
  function pintarMarcadores(forzar=false){
   const grupos=agrupados(),nueva=grupos.map(g=>g.map(f=>f.oferta.slug).join('+')).join('|');
   if(!forzar&&nueva===huella)return;
   huella=nueva;
   const activo=document.activeElement,enMapa=activo?.closest?.('.mapa-marcador,.leaflet-popup');
   const slugFoco=enMapa?(activo.closest('.mapa-marcador')?.dataset.ofertas||abierta?.slugs?.join(' ')||'').split(' ')[0]:'';
   grupo.clearLayers();
   for(const conjunto of grupos){
    const marca=marcador(conjunto);grupo.addLayer(marca);
    const el=marca.getElement?.();if(el){el.dataset.ofertas=marca.slugs.join(' ');el.setAttribute('aria-label',marca.nombre);}
   }
   pintarLeyenda(visibles,grupos);
   if(slugFoco)lienzo.querySelector?.('.mapa-marcador[data-ofertas~="'+slugFoco+'"]')?.focus({preventScroll:true});
  }
  function pintarLeyenda(datos,grupos){
   const leyenda=porId('mapaLeyenda'),entradas=[],presentes=new Set(datos.map(f=>f.oferta.categoria));
   const entrada=(clase,etiqueta,dentro='')=>{const li=document.createElement('li');const punto=decorativo(texto('span',dentro,'mapa-punto'+clase));
    li.append(punto,texto('span',etiqueta));entradas.push(li);};
   for(const c of orden())if(presentes.has(c))entrada(claseTipo(c),corta(c));
   if(datos.some(f=>f.ubicacion.precision==='ciudad')){entrada(' neutro','Punto indicado por el proveedor');entrada(' neutro aproximado','Ciudad aproximada');}
   if(grupos.some(g=>g.length>1))entrada(' neutro numero','Varias ofertas juntas','2');
   leyenda.replaceChildren(...entradas);leyenda.hidden=!entradas.length;
  }
  function pintar(ajustar=false){
   pintarPermiso();
   if(!mapa||panel.hidden)return;
   if(coleccionesLista)coleccionesLista.hidden=true;
   const datos=filas(),elegibles=actuales(),sinPunto=elegibles.length-U.unir(elegibles,ubicaciones).length;
   // Primero la vista y luego los marcadores: se agrupan con su zoom.
   visibles=datos;
   if(ajustar&&datos.length){
    mapa.fitBounds(L.latLngBounds(puntos(datos)),{padding:[48,48],maxZoom:13,animate:false});conVista=true;
   }else if(!conVista){mapa.setView([30,0],2,{animate:false});conVista=true;}
   pintarMarcadores(true);
   const resultados=porId('mapaResultados');resultados.replaceChildren();
   for(const f of datos){const li=document.createElement('li');li.appendChild(filaLista(f));resultados.appendChild(li);}
   const enZona=!!limites||!!zona.value.trim(),cercania=origen?.tipo==='ubicacion';
   porId('mapaResultadosTitulo').textContent=ofertas(datos.length)+(cercania?', por distancia a tu ubicación':enZona?' en esta zona':' en el mapa');
   porId('mapaOrigenLinea').hidden=!origen;
   porId('mapaOrigen').textContent=cercania?'Distancias en línea recta desde tu ubicación, que no se guarda.':'Distancias en línea recta desde el centro de la zona.';
   porId('mapaMargen').textContent=cercania&&Number.isFinite(origen.precision)?margenTexto(origen.precision):'';
   porId('mapaVacio').hidden=datos.length>0;
   const cuenta=porId('mapaCuenta');cuenta.hidden=!sinPunto;
   cuenta.textContent=sinPunto?sinPunto+' de '+ofertas(elegibles.length)+(sinPunto===1?' no tiene ubicación documentada; sigue en Lista.':' no tienen ubicación documentada; siguen en Lista.'):'';
   const notas=porId('mapaNotas');notas.replaceChildren(...[...new Set(datos.map(f=>f.ubicacion.nota).filter(Boolean))].map(t=>texto('span',t)));
   notas.hidden=!datos.length;
   requestAnimationFrame(()=>mapa?.invalidateSize({pan:false}));
  }
  function cambiarVista(vista){
   const esMapa=vista==='mapa';lista.hidden=esMapa;panel.hidden=!esMapa;
   if(coleccionesLista){
    if(esMapa){if(coleccionesListaOcultas===null)coleccionesListaOcultas=coleccionesLista.hidden;coleccionesLista.hidden=true;}
    else if(coleccionesListaOcultas!==null){coleccionesLista.hidden=coleccionesListaOcultas;coleccionesListaOcultas=null;}
   }
   for(const b of document.querySelectorAll('[data-buscar-vista]'))b.setAttribute('aria-pressed',String(b.dataset.buscarVista===vista));
   if(!esMapa)return;
   if(mapa){pintar();return;}
   anunciar('Pulsa Cargar mapa para conectar con OpenStreetMap.');
   cargarUbicaciones().then(()=>pintarPermiso(),()=>{});
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
  // Si no llega ninguna tesela de una tanda, un aviso claro sustituye al
  // fondo vacío; los puntos y la lista siguen funcionando.
  function vigilarTeselas(){
   let bien=0,mal=0;
   teselas.on('loading',()=>{bien=0;mal=0;}).on('tileload',()=>{bien++;sinTeselas.hidden=true;}).on('tileerror',()=>{mal++;}).on('load',()=>{
    if(mal&&!bien){sinTeselas.hidden=false;anunciar('No se ha podido cargar el mapa base. Los puntos y las fichas siguen disponibles.');}
    else if(mal)anunciar('Parte del mapa base no se ha podido cargar. Las ofertas y sus fuentes siguen en la lista.',true);
   });
  }
  async function activar(){
   if(cargando||mapa)return;cargando=true;cargar.disabled=true;anunciar('Cargando mapa…');
   try{
    await cargarUbicaciones();await cargarBiblioteca();
    porId('mapaExperiencia').hidden=false;porId('mapaPermiso').hidden=true;
    mapa=L.map('mapaLienzo',{scrollWheelZoom:false,keyboard:true});
    grupo=L.featureGroup().addTo(mapa);
    mapa.on?.('zoomend',()=>pintarMarcadores());
    // La vista se fija antes de añadir las teselas: así solo se piden las
    // de la zona con ofertas, no las del mundo entero.
    conVista=false;pintar(true);
    // Peticiones normales del navegador, sin precarga, descarga masiva ni
    // proxy. Origin identifica RWAdar aun cuando Auth use no-referrer.
    teselas=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
     attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
     maxZoom:19,keepBuffer:0,updateWhenIdle:true,detectRetina:false,referrerPolicy:'origin'}).addTo(mapa);
    vigilarTeselas();
    const zoom=mapa.zoomControl;zoom.setPosition?.('bottomright');
    const caja=zoom.getContainer();caja.setAttribute('aria-label','Zoom del mapa');
    for(const [clase,nombre]of [['in','Acercar'],['out','Alejar']]){
     const b=caja.querySelector('.leaflet-control-zoom-'+clase);b.setAttribute('aria-label',nombre);b.setAttribute('title',nombre);
    }
    lienzo.setAttribute('aria-label','Mapa de activos. Las mismas ofertas están en la lista.');
    usar.disabled=!navigator.geolocation;
    anunciar(navigator.geolocation?'Mapa listo. Puedes moverte, ampliar o buscar por zona sin compartir tu ubicación.':'El navegador no ofrece geolocalización. Puedes buscar por zona y mover el mapa.');
    lienzo.focus?.({preventScroll:true});
   }catch(error){
    if(mapa){mapa.remove();mapa=null;grupo=null;teselas=null;}
    porId('mapaExperiencia').hidden=true;porId('mapaPermiso').hidden=false;
    anunciar(error.message||'El mapa no está disponible. Puedes continuar en Lista.',true);
   }finally{cargando=false;cargar.disabled=false;}
  }
  function solicitarUbicacion(){
   if(!mapa||!navigator.geolocation)return;
   const solicitud=++peticion;usar.disabled=true;anunciar('Esperando tu permiso para usar la ubicación una vez…',true);
   navigator.geolocation.getCurrentPosition(p=>{
    if(solicitud!==peticion)return;usar.disabled=false;
    const punto={lat:p.coords.latitude,lng:p.coords.longitude,tipo:'ubicacion',precision:p.coords.accuracy};
    if(!U.coordenadas(punto)){anunciar('El dispositivo no facilitó una posición válida. Prueba la búsqueda por zona.',true);return;}
    origen=punto;limites=null;zona.value='';
    if(posicion)mapa.removeLayer(posicion);
    posicion=L.circleMarker([punto.lat,punto.lng],{radius:8,color:'#fff',weight:3,fillColor:'#2463cf',fillOpacity:1}).addTo(mapa);
    // La vista incluye tu punto y las tres ofertas más cercanas: desde lejos
    // (hoy todas están en Austria) un zoom fijo dejaría el mapa vacío.
    const cerca=filas().slice(0,3);
    if(cerca.length)mapa.fitBounds(L.latLngBounds([[punto.lat,punto.lng],...puntos(cerca)]),{padding:[48,48],maxZoom:13,animate:false});
    else mapa.setView([punto.lat,punto.lng],10,{animate:false});
    borrar.hidden=false;usar.dataset.activa='si';pintar();
    anunciar('Ubicación usada una vez. Mostramos las fichas ordenadas por distancia; la posición no se guarda.');
   },error=>{
    if(solicitud!==peticion)return;usar.disabled=false;
    anunciar(error.code===1?'No has dado permiso para la ubicación. Puedes buscar por zona y mover el mapa.':
     error.code===3?'La ubicación ha tardado demasiado. Puedes reintentar o buscar por zona.':'No se ha podido obtener la ubicación. Puedes buscar por zona.',true);
   },{enableHighAccuracy:false,timeout:10000,maximumAge:0});
  }
  for(const b of document.querySelectorAll('[data-buscar-vista]'))b.addEventListener('click',()=>cambiarVista(b.dataset.buscarVista));
  cargar.addEventListener('click',activar);usar.addEventListener('click',solicitarUbicacion);
  borrar.addEventListener('click',()=>{
   ++peticion;origen=null;if(posicion){mapa.removeLayer(posicion);posicion=null;}usar.disabled=false;usar.dataset.activa='no';
   // El botón se oculta: el foco pasa a «Usar mi ubicación» y no se pierde.
   usar.focus?.({preventScroll:true});borrar.hidden=true;pintar();
   anunciar('Tu posición se ha quitado de esta vista.');
  });
  zona.addEventListener('input',()=>{limites=null;pintar();});
  coleccionMapa.addEventListener('change',()=>{limites=null;pintar(true);});
  porId('mapaZonaForm').addEventListener('submit',e=>{
   e.preventDefault();limites=null;const datos=filas();
   if(!datos.length){pintar();anunciar('No hay activos documentados que coincidan con esa zona y los filtros actuales. Prueba otra localidad o Lista.',true);return;}
   pintar(true);const centro=mapa.getCenter();origen={lat:centro.lat,lng:centro.lng,tipo:'zona'};pintar();
   anunciar('Zona encontrada en las ubicaciones documentadas. Las distancias parten de su centro.');
   zona.blur?.();
  });
  porId('mapaBuscarZona').addEventListener('click',()=>{
   limites=mapa.getBounds();const centro=mapa.getCenter();origen={lat:centro.lat,lng:centro.lng,tipo:'zona'};pintar();
   anunciar('Mostramos los activos de la zona visible, ordenados desde el centro del mapa.');
  });
  porId('mapaVerTodas').addEventListener('click',()=>{
   limites=null;zona.value='';if(origen?.tipo==='zona')origen=null;pintar(true);
   anunciar('Se muestran todos los puntos documentados de los filtros actuales.');
  });
  porId('mapaReintentar').addEventListener('click',()=>{sinTeselas.hidden=true;teselas?.redraw();});
  porId('mapaAvisoCerrar')?.addEventListener('click',()=>{aviso.hidden=true;lienzo.focus?.({preventScroll:true});});
  porId('mapaVolverLista').addEventListener('click',()=>cambiarVista('lista'));
  new MutationObserver(()=>pintar()).observe(lista,{childList:true});
  // Al cambiar de idioma se repinta para dar las cifras en su formato.
  try{globalThis.RWAdarIdioma?.suscribirIdioma?.(()=>pintar());}catch{}
  globalThis.RWADARMapa=Object.freeze({refrescar:()=>pintar()});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
})();

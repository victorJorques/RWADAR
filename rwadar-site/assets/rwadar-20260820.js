/* =================================================================
   ▸ PLATAFORMAS EN EL RADAR · las que pasan los 4 criterios
     Para añadir una, copia un bloque { … } entero y pégalo al final.
     cat:    Inmobiliario | Crédito privado | Tesoro y fondos |
             Acciones y capital privado | Materias primas | Infraestructura
     acceso: Minorista | Acreditado | Institucional | Empresas
     aval:   el motivo concreto por el que supera el filtro
   ================================================================= */
/* El servidor de revisión solo escucha en loopback. Esta comprobación
   deliberadamente estrecha impide que el escaparate interno se active por
   un parámetro, una ruta o un dominio que simplemente contenga "local". */
const MODO_LOCAL_SEGURO=typeof location!=='undefined'&&
 /^(?:localhost|127\.0\.0\.1)$/.test(String(location.hostname||''))&&
 /^https?:$/.test(String(location.protocol||''));
/* servicios-usuario:inicio */
/* El catálogo público no habilita cuentas. Esta capacidad pertenece al corte
   editorial y no se puede activar con un dominio, un enlace o almacenamiento.
   Es una guarda del cliente: no modifica los permisos del servidor. */
const SERVICIOS_USUARIO_REMOTOS=true;
const SERVICIOS_USUARIO_DISPONIBLES=SERVICIOS_USUARIO_REMOTOS&&!MODO_LOCAL_SEGURO;
/* Las cuentas se reabren por fases (docs/tareas/REABRIR-CUENTAS.md). La
   fase 1 (db/26) abre perfil, vigilancia y baja; opiniones con su
   moderación y avisos por correo necesitan su propio permiso en el servidor
   y su propia prueba, así que tienen interruptor aparte y nunca se encienden
   sin las cuentas. */
const OPINIONES_REMOTAS=false;
const OPINIONES_DISPONIBLES=SERVICIOS_USUARIO_DISPONIBLES&&OPINIONES_REMOTAS;
const AVISOS_CORREO_REMOTOS=false;
const AVISOS_CORREO_DISPONIBLES=SERVICIOS_USUARIO_DISPONIBLES&&AVISOS_CORREO_REMOTOS;
/* Comunidad (db/27): una publicación al día por cuenta. Necesita las cuentas. */
const PUBLICACIONES_REMOTAS=false;
const PUBLICACIONES_DISPONIBLES=SERVICIOS_USUARIO_DISPONIBLES&&PUBLICACIONES_REMOTAS;
function limpiarRetornoSinServiciosUsuario(){
 if(SERVICIOS_USUARIO_DISPONIBLES||typeof location==='undefined'||
    typeof history==='undefined'||typeof history.replaceState!=='function')return;
 try{
  const u=new URL(location.href),fragmento=new URLSearchParams(u.hash.slice(1));
  const sensibles=['access_token','refresh_token','provider_token','provider_refresh_token',
   'token','token_hash','code','error','error_code','error_description'];
  const retorno=sensibles.some(k=>u.searchParams.has(k)||fragmento.has(k));
  if(!retorno)return;
  [...sensibles,'type','token_type','expires_in','expires_at'].forEach(k=>u.searchParams.delete(k));
  if(sensibles.some(k=>fragmento.has(k)))u.hash='';
  history.replaceState(null,'',u.pathname+u.search+u.hash);
 }catch(e){} /* Un enlace defectuoso tampoco inicia autenticación. */
}
/* servicios-usuario:fin */
/* favoritos-locales:inicio */
/* =================================================================
   FAVORITOS · empresas y ofertas guardadas en este navegador
   -----------------------------------------------------------------
   Mientras las cuentas están en pausa, «Guardar» funciona igual que en
   la app: se queda en el almacenamiento local, no se envía a RWAdar y se
   borra desde Perfil. Solo guarda nombres de empresa y slugs de oferta.
   ================================================================= */
const Favoritos=(function(){
 const CLAVE='rwadar.favoritos.v1',MAX=200;
 const oyentes=new Set();
 let datos={empresas:[],ofertas:[]},identidad=null;
 const uid=()=>typeof window!=='undefined'&&window.RWADAR_ACCESO?.usuario()?.id||null;
 const claveCuenta=()=>{const id=uid();return id?CLAVE+':'+id:null;};
 const limpia=lista=>Array.isArray(lista)
  ?[...new Set(lista.filter(x=>typeof x==='string'&&x.length>0&&x.length<=160))].slice(0,MAX):[];
 function leer(){
  try{
   identidad=uid();const clave=claveCuenta();
   const j=JSON.parse(clave?localStorage.getItem(clave)||'null':'null');
   datos=j&&typeof j==='object'?{empresas:limpia(j.empresas),ofertas:limpia(j.ofertas)}:{empresas:[],ofertas:[]};
  }catch(e){datos={empresas:[],ofertas:[]};}
 }
 function avisarCambio(){oyentes.forEach(f=>{try{f();}catch(e){}});}
 function guardar(){try{const clave=claveCuenta();if(clave)localStorage.setItem(clave,JSON.stringify(datos));}catch(e){}}
 function alternar(tipo,clave){
  if(uid()!==identidad)leer();if(!uid())return false;
  if(!Object.hasOwn(datos,tipo)||typeof clave!=='string'||!clave)return false;
  const i=datos[tipo].indexOf(clave);
  if(i>=0)datos[tipo].splice(i,1);else datos[tipo]=[clave,...datos[tipo]].slice(0,MAX);
  guardar();avisarCambio();return i<0;
 }
 function borrar(){datos={empresas:[],ofertas:[]};try{const clave=claveCuenta();if(clave)localStorage.removeItem(clave);}catch(e){}avisarCambio();}
 if(typeof localStorage!=='undefined')leer();
 if(typeof window!=='undefined'&&window.addEventListener)
  window.addEventListener('storage',e=>{if(e.key===claveCuenta()){leer();avisarCambio();}});
 if(typeof document!=='undefined'&&document.addEventListener)
  document.addEventListener('rwadar:sesion',()=>{leer();avisarCambio();});
 return {
  tiene:(tipo,clave)=>Object.hasOwn(datos,tipo)&&datos[tipo].includes(clave),
  lista:tipo=>Object.hasOwn(datos,tipo)?datos[tipo].slice():[],
  total:()=>datos.empresas.length+datos.ofertas.length,
  alternar,borrar,alCambiar:f=>{oyentes.add(f);}
 };
})();
function botonGuardarOferta(o){
 const on=typeof Favoritos!=='undefined'&&Favoritos.tiene('ofertas',o.slug);
 return '<button class="escaparate-guardar fav-local'+(on?' on':'')+'" type="button" data-guardar-oferta="'+escHtml(o.slug)+'" aria-pressed="'+on+'" aria-label="'+
  escHtml((on?'Quitar de guardadas: ':'Guardar: ')+o.titulo)+'">'+(on?'★ Guardada':'☆ Guardar')+'</button>';
}
if(typeof document!=='undefined'&&document.addEventListener&&typeof fetch!=='undefined')
 document.addEventListener('click',e=>{
  const b=e.target&&e.target.closest&&e.target.closest('[data-guardar-oferta]');
  if(!b)return;
  e.preventDefault();
  if(window.RWADAR_ACCESO&&!window.RWADAR_ACCESO.usuario()){window.RWADAR_ACCESO.entrar();return;}
  const slug=b.dataset.guardarOferta,ahora=Favoritos.alternar('ofertas',slug);
  document.querySelectorAll('[data-guardar-oferta]').forEach(x=>{
   if(x.dataset.guardarOferta!==slug||x.closest('#perfilOfertas'))return;
   x.classList.toggle('on',ahora);x.setAttribute('aria-pressed',String(ahora));x.textContent=ahora?'★ Guardada':'☆ Guardar';
  });
  avisar(ahora?'Oferta guardada. La tienes en Perfil.':'Oferta quitada de guardadas.');
 });
/* favoritos-locales:fin */
const FECHA_VERIFICACION_LOCAL='2026-09-21';
let ESCAPARATE_LOCAL=null;
let MANIFIESTO_EDITORIAL_LOCAL=null;
let CATALOGO_EMBEBIDO_BLOQUEADO=false;
/* El catálogo se publica siempre salvo orden expresa de retirada (Víctor,
   1/10/2026). Caducado, o si no se puede comprobar la revisión remota, se
   muestra la última copia completa con un aviso; las cifras vencidas siguen
   ocultas oferta a oferta. Solo public.catalogo_publicacion.retirado lo oculta. */
let CATALOGO_CADUCADO=false,CATALOGO_SIN_COMPROBAR=false,CATALOGO_RETIRADO=false;
/* Manifiesto de la última copia completa aceptada en esta pestaña. Desde el
   02/11/2026 ya no es un mínimo: un lote nuevo y coherente puede tener más o
   menos fichas (decisión de Víctor). */
let MANIFIESTO_CATALOGO_V2_ACEPTADO={plataformas:26,ofertas:49,
 colecciones:{principales:24,secundario:21,en_camino:4}};
/* Activos propios, no fotografías del emisor. La compuerta de publicación
   comprueba por separado el manifiesto y sus huellas antes de copiarlos. */
const EDITORIAL_OFERTA_POR_CATEGORIA={
 'Inmobiliario':{src:'/ofertas-editoriales/inmobiliario-rwadar.webp',alt:'Ilustración editorial de un activo inmobiliario tokenizado'},
 'Tesoro y fondos':{src:'/ofertas-editoriales/tesoro-fondos-rwadar.webp',alt:'Ilustración editorial de tesorería y fondos tokenizados'},
 'Materias primas':{src:'/ofertas-editoriales/materias-primas-rwadar.webp',alt:'Ilustración editorial de materias primas tokenizadas'},
 'Acciones y capital privado':{src:'/ofertas-editoriales/capital-privado-rwadar.webp',alt:'Ilustración editorial de acciones y capital privado tokenizados'},
 'Crédito privado':{src:'/ofertas-editoriales/capital-privado-rwadar.webp',alt:'Ilustración editorial financiera; no representa un activo concreto'}
};
/* Ilustración propia de cada ficha (explica la inversión en una imagen). Si
   falta, o la ficha cambió de categoría, se usa la de su categoría. */
/* fichas-editoriales:inicio (generado por rwadar-editorial-source/ofertas/generar.mjs) */
const EDITORIAL_OFERTA_POR_SLUG=Object.freeze({"aktionariat":{"src":"/ofertas-editoriales/oferta-aktionariat.webp","alt":"Ilustración editorial de un edificio de oficinas moderno a orillas del lago de Zúrich, como imagen de una empresa suiza con su capital repartido en acciones, imagen generada con IA. Pasos: compras acciones; eres accionista; reventa entre socios. No es una foto del activo real.","categoria":"Acciones y capital privado","lugar":"Erlenbach · Suiza"},"apartamento-vacacional-hinterstoder-50":{"src":"/ofertas-editoriales/oferta-apartamento-vacacional-hinterstoder-50.webp","alt":"Ilustración editorial de un complejo de apartamentos vacacionales de madera en un valle alpino austriaco, parecido al real, imagen generada con IA. Pasos: compras participaciones; el apartamento se alquila; reparto o venta en la app. No es una foto del activo real.","categoria":"Inmobiliario","lugar":"Hinterstoder · Austria"},"boss-info":{"src":"/ofertas-editoriales/oferta-boss-info.webp","alt":"Ilustración editorial de un pequeño edificio de oficinas en un pueblo suizo al pie del Jura, como imagen de una empresa suiza con su capital repartido en acciones, imagen generada con IA. Pasos: compras acciones; eres accionista; reventa entre socios. No es una foto del activo real.","categoria":"Acciones y capital privado","lugar":"Farnern · Suiza"},"drautalresidenz-paternion":{"src":"/ofertas-editoriales/oferta-drautalresidenz-paternion.webp","alt":"Ilustración editorial de un edificio residencial de pocas plantas con jardín ante montañas de Carintia, parecido al real, imagen generada con IA. Pasos: compras participaciones; la vivienda se alquila; reparto o venta en la app. No es una foto del activo real.","categoria":"Inmobiliario","lugar":"Paternion · Austria"},"fotovoltaica-cohotel":{"src":"/ofertas-editoriales/oferta-fotovoltaica-cohotel.webp","alt":"Ilustración editorial de unos paneles solares en la cubierta plana de un edificio comercial austriaco, imagen generada con IA. Pasos: compras participaciones; los paneles dan energía; reparto del excedente. No es una foto del activo real.","categoria":"Infraestructura","lugar":"Steyregg · Austria"},"fotovoltaica-greenpoint":{"src":"/ofertas-editoriales/oferta-fotovoltaica-greenpoint.webp","alt":"Ilustración editorial de unos paneles solares en la cubierta de un edificio de oficinas de una ciudad austriaca, imagen generada con IA. Pasos: compras participaciones; los paneles dan energía; reparto del excedente. No es una foto del activo real.","categoria":"Infraestructura","lugar":"Wiener Neustadt · Austria"},"hausera-proximas-ofertas":{"src":"/ofertas-editoriales/oferta-hausera-proximas-ofertas.webp","alt":"Ilustración editorial de un edificio de viviendas mediterráneo recién reformado en la costa de Orihuela (Alicante), como imagen de viviendas que se compran, se reforman y se venden, imagen generada con IA. Pasos: reservas en la preventa; se reforma y se vende; cobro tras la venta. No es una foto del activo real.","categoria":"Inmobiliario","lugar":"Orihuela Costa · Alicante"},"kraken-xstocks":{"src":"/ofertas-editoriales/oferta-kraken-xstocks.webp","alt":"Ilustración editorial de un distrito financiero mediterráneo genérico al anochecer, junto al paseo marítimo, como imagen de certificados tokenizados que siguen acciones estadounidenses, imagen generada con IA. Pasos: abres cuenta y test; compras con euros; vendes o retiras. No es una foto del activo real.","categoria":"Acciones y capital privado","lugar":"Limasol · Chipre"},"local-de-estanco-klagenfurt":{"src":"/ofertas-editoriales/oferta-local-de-estanco-klagenfurt.webp","alt":"Ilustración editorial de un edificio de viviendas con un pequeño local comercial en planta baja, en una esquina de una ciudad austriaca, imagen generada con IA. Pasos: compras participaciones; el local se alquila; reparto o venta en la app. No es una foto del activo real.","categoria":"Inmobiliario","lugar":"Klagenfurt · Austria"},"mtbill":{"src":"/ofertas-editoriales/oferta-mtbill.webp","alt":"Ilustración editorial de un edificio institucional neoclásico genérico, como imagen de las letras del Tesoro de Estados Unidos, imagen generada con IA. Pasos: compras el token; sigue letras del Tesoro; pides el reembolso. No es una foto del activo real.","categoria":"Tesoro y fondos","lugar":"Estados Unidos"},"prosegur-digital-gold":{"src":"/ofertas-editoriales/oferta-prosegur-digital-gold.webp","alt":"Ilustración editorial de unos lingotes de oro sin marcas en una cámara acorazada, imagen generada con IA. Pasos: compras gramos de oro; se guarda en una cámara; vendes y cobras en euros. No es una foto del activo real.","categoria":"Materias primas","lugar":"Custodia en España"},"randhartingergasse-9-viena":{"src":"/ofertas-editoriales/oferta-randhartingergasse-9-viena.webp","alt":"Ilustración editorial de un ático reformado con terraza sobre un edificio clásico de Viena, parecido al real, imagen generada con IA. Pasos: compras participaciones; la vivienda se alquila; reparto o venta en la app. No es una foto del activo real.","categoria":"Inmobiliario","lugar":"Viena · Austria"},"robinhood-classic-stock-tokens":{"src":"/ofertas-editoriales/oferta-robinhood-classic-stock-tokens.webp","alt":"Ilustración editorial de la fachada genérica de un edificio de bolsa neoclásico al anochecer, como imagen de derivados sobre acciones estadounidenses, imagen generada con IA. Pasos: abres cuenta y test; compras en euros; cierras con la contraparte. No es una foto del activo real.","categoria":"Acciones y capital privado","lugar":"Estados Unidos"},"spiko-letras-del-tesoro-dolar":{"src":"/ofertas-editoriales/oferta-spiko-letras-del-tesoro-dolar.webp","alt":"Ilustración editorial de un edificio federal neoclásico genérico de Estados Unidos, como imagen de un fondo que compra letras del Tesoro estadounidense, imagen generada con IA. Pasos: abres cuenta con KYC; compras participaciones; pides el reembolso. No es una foto del activo real.","categoria":"Tesoro y fondos","lugar":"Estados Unidos"},"spiko-letras-del-tesoro-euro":{"src":"/ofertas-editoriales/oferta-spiko-letras-del-tesoro-euro.webp","alt":"Ilustración editorial de un edificio ministerial neoclásico genérico, como imagen de un fondo que compra letras del Tesoro de la zona euro, imagen generada con IA. Pasos: compras participaciones; el fondo compra letras; pides el reembolso. No es una foto del activo real.","categoria":"Tesoro y fondos","lugar":"Zona euro"},"spiko-smart-cash-euro":{"src":"/ofertas-editoriales/oferta-spiko-smart-cash-euro.webp","alt":"Ilustración editorial de una calle financiera parisina genérica al amanecer, con fachadas de piedra y luz suave, como imagen de un fondo en euros ligado al tipo interbancario, imagen generada con IA. Pasos: abres cuenta con KYC; transfieres euros; pides el reembolso. No es una foto del activo real.","categoria":"Tesoro y fondos","lugar":"París · Francia"},"switzerlend":{"src":"/ofertas-editoriales/oferta-switzerlend.webp","alt":"Ilustración editorial de un edificio de oficinas de cristal y piedra en Zúrich, como imagen de una empresa suiza con su capital repartido en acciones, imagen generada con IA. Pasos: compras acciones; eres accionista; reventa entre socios. No es una foto del activo real.","categoria":"Acciones y capital privado","lugar":"Zúrich · Suiza"},"vivienda-pluddemanngasse-101-graz":{"src":"/ofertas-editoriales/oferta-vivienda-pluddemanngasse-101-graz.webp","alt":"Ilustración editorial de un bloque de pisos moderno de fachada blanca en Graz, parecido al real, imagen generada con IA. Pasos: compras participaciones; la vivienda se alquila; reparto o venta en la app. No es una foto del activo real.","categoria":"Inmobiliario","lugar":"Graz · Austria"},"vivienda-pottendorfer-stra-e-62-wr-neustadt":{"src":"/ofertas-editoriales/oferta-vivienda-pottendorfer-stra-e-62-wr-neustadt.webp","alt":"Ilustración editorial de un edificio de viviendas blanco y gris en una esquina de Wiener Neustadt, parecido al real, imagen generada con IA. Pasos: compras participaciones; la vivienda se alquila; reparto o venta en la app. No es una foto del activo real.","categoria":"Inmobiliario","lugar":"Wiener Neustadt · Austria"},"vivienda-schwarzer-weg-18-graz":{"src":"/ofertas-editoriales/oferta-vivienda-schwarzer-weg-18-graz.webp","alt":"Ilustración editorial de un edificio residencial moderno de tres alturas con terrazas en Graz, parecido al real, imagen generada con IA. Pasos: compras participaciones; la vivienda se alquila; reparto o venta en la app. No es una foto del activo real.","categoria":"Inmobiliario","lugar":"Graz · Austria"},"vivienda-sonnleithnergasse-2-viena":{"src":"/ofertas-editoriales/oferta-vivienda-sonnleithnergasse-2-viena.webp","alt":"Ilustración editorial de un gran conjunto residencial blanco con patio arbolado en Viena, parecido al real, imagen generada con IA. Pasos: compras participaciones; la vivienda se alquila; reparto o venta en la app. No es una foto del activo real.","categoria":"Inmobiliario","lugar":"Viena · Austria"},"vivienda-stallhofstra-e-28-gratwein":{"src":"/ofertas-editoriales/oferta-vivienda-stallhofstra-e-28-gratwein.webp","alt":"Ilustración editorial de un edificio residencial de dos plantas ante colinas boscosas de Estiria, parecido al real, imagen generada con IA. Pasos: compras participaciones; la vivienda se alquila; reparto o venta en la app. No es una foto del activo real.","categoria":"Inmobiliario","lugar":"Gratwein · Austria"}});
/* fichas-editoriales:fin */
/* Transparencia de cada oferta (comprobaciones editoriales, puntos fuertes y
   textos cortos). Falla cerrado: sin entrada, o con otra verificadaEl, nada. */
/* transparencia:inicio */
/* GENERADO por rwadar-editorial-source/ofertas/transparencia.mjs desde transparencia.json: no se edita a mano.
   Dos de las cinco comprobaciones, los puntos fuertes y los textos cortos de cada oferta. No es una recomendación. */
const TRANSPARENCIA_CRITERIOS=Object.freeze([{"id":"contratable","texto":"Se contrata hoy desde España"},{"id":"supervisada","texto":"La entidad que la ofrece está autorizada por un supervisor de la UE e inscrita en la CNMV"},{"id":"documentoEspana","texto":"Hay un documento oficial (KID o folleto) que cubre su venta en España"},{"id":"minimoSalida","texto":"El mínimo y la forma de salir están documentados"},{"id":"vigente","texto":"Revisada esta semana y sin fuentes en conflicto"}]);
const TRANSPARENCIA_POR_SLUG=Object.freeze({"aktionariat":{"verificadaEl":"2026-11-10","anadidaEl":"2026-09-30","supervisada":{"cumple":false,"motivo":"La vende el propio emisor suizo, que no figura en el registro de entidades autorizadas de FINMA ni en ningún registro de la CNMV.","fuente":{"titulo":"FINMA · Registro de entidades autorizadas (búsqueda «Aktionariat»: 0 resultados)","url":"https://www.finma.ch/en/finma-public/authorised-institutions-individuals-and-products/"},"consultadaEl":"2026-11-10"},"documentoEspana":{"cumple":false,"motivo":"No hay folleto ni KID: la oferta se acoge a umbrales de exención y no publica ningún documento equivalente.","fuente":{"titulo":"Aktionariat · Aviso legal (oferta en el EEE limitada a 100.000 € en total, sin folleto)","url":"https://www.aktionariat.com/disclaimer"},"consultadaEl":"2026-11-10"},"minimoCorto":"500 CHF","salidaCorta":"Venta a otros accionistas","puntos":[{"texto":"Compra directa al emisor","fuente":{"titulo":"Fuente de la ficha · Aktionariat · DAKS","url":"https://shares.aktionariat.com/invest"}}]},"apartamento-vacacional-hinterstoder-50":{"verificadaEl":"2026-11-10","anadidaEl":"2026-09-30","supervisada":{"cumple":false,"motivo":"Effecta (BaFin) figura en la CNMV, pero Brickwise, el agente que te vende, no consta notificado para operar en España.","fuente":{"titulo":"CNMV · Effecta GmbH en libre prestación (nº 5003), pestaña Agentes: sin datos","url":"https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5003&vista=8"},"consultadaEl":"2026-11-10"},"documentoEspana":{"cumple":false,"motivo":"Solo hay un KID en alemán y una ficha de la ley austriaca de financiación alternativa; ninguno cubre su venta en España.","fuente":{"titulo":"Basisinformationsblatt (KID) del emisor, solo en alemán (ISIN AT0000A31KP7)","url":"https://cdn.brickwise.at/3aa9bf9c-ae7d-4dde-ab03-f6169dc9327a.pdf"},"consultadaEl":"2026-11-10"},"minimoCorto":"Desde 75 € la participación (10/11)","salidaCorta":"Reventa en la app, si hay comprador","puntos":[{"texto":"Reventa activa en la app","fuente":{"titulo":"Brickwise · mercado de reventa en la app (10/11/2026)","url":"https://app.brickwise.at/desktopWeb/marketplace"}}]},"boss-info":{"verificadaEl":"2026-11-10","anadidaEl":"2026-09-30","supervisada":{"cumple":false,"motivo":"Vende el propio emisor suizo, sin licencia de un supervisor del EEE ni registro en la CNMV; su portal dice que no está supervisado.","fuente":{"titulo":"Portal de acciones de Boss Info · aviso legal («not subject to prudential supervision»)","url":"https://shares.bossinfo.com/"},"consultadaEl":"2026-11-10"},"documentoEspana":{"cumple":false,"motivo":"No hay folleto, KID ni ficha informativa, y el emisor no dice en qué exención se apoya para vender fuera de Suiza.","fuente":{"titulo":"Portal de acciones de Boss Info · compra directa al emisor (sin folleto ni KID publicados)","url":"https://shares.bossinfo.com/invest"},"consultadaEl":"2026-11-10"},"minimoCorto":"100 CHF","salidaCorta":"Venta a otros accionistas","puntos":[{"texto":"Compra directa al emisor","fuente":{"titulo":"Fuente de la ficha · Aktionariat · BOSS","url":"https://shares.bossinfo.com/"}}]},"drautalresidenz-paternion":{"verificadaEl":"2026-11-10","anadidaEl":"2026-09-30","supervisada":{"cumple":false,"motivo":"Effecta (BaFin) figura en la CNMV, pero Brickwise, el agente que te vende, no consta notificado para operar en España.","fuente":{"titulo":"CNMV · Effecta GmbH en libre prestación (nº 5003), pestaña Agentes: sin datos","url":"https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5003&vista=8"},"consultadaEl":"2026-11-10"},"documentoEspana":{"cumple":false,"motivo":"Solo hay un KID en alemán y una ficha de la ley austriaca de financiación alternativa; ninguno cubre su venta en España.","fuente":{"titulo":"Basisinformationsblatt (KID) del emisor, solo en alemán (ISIN AT0000A2YPQ0)","url":"https://cdn.brickwise.at/2dcc086d-98b7-4707-8281-4ff3fa354109.pdf"},"consultadaEl":"2026-11-10"},"minimoCorto":"Desde 70 € la participación (10/11)","salidaCorta":"Reventa en la app, si hay comprador","puntos":[{"texto":"Reventa activa en la app","fuente":{"titulo":"Brickwise · mercado de reventa en la app (10/11/2026)","url":"https://app.brickwise.at/desktopWeb/marketplace"}}]},"fotovoltaica-cohotel":{"verificadaEl":"2026-11-10","anadidaEl":"2026-09-30","supervisada":{"cumple":false,"motivo":"Effecta (BaFin) figura en la CNMV, pero Brickwise, el agente que te vende, no consta notificado para operar en España.","fuente":{"titulo":"CNMV · Effecta GmbH en libre prestación (nº 5003), pestaña Agentes: sin datos","url":"https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5003&vista=8"},"consultadaEl":"2026-11-10"},"documentoEspana":{"cumple":false,"motivo":"Solo hay un KID en alemán y una ficha de la ley austriaca de financiación alternativa; ninguno cubre su venta en España.","fuente":{"titulo":"Basisinformationsblatt (KID) del emisor, solo en alemán (ISIN AT0000A38J40)","url":"https://cdn.brickwise.at/da8e1df3-d334-4075-9311-299f93c8563e.pdf"},"consultadaEl":"2026-11-10"},"minimoCorto":"Desde 110 € la participación (10/11)","salidaCorta":"Nominal en 2038; antes, reventa","puntos":[{"texto":"Reventa activa en la app","fuente":{"titulo":"Brickwise · mercado de reventa en la app (10/11/2026)","url":"https://app.brickwise.at/desktopWeb/marketplace"}}]},"fotovoltaica-greenpoint":{"verificadaEl":"2026-11-10","anadidaEl":"2026-09-30","supervisada":{"cumple":false,"motivo":"Effecta (BaFin) figura en la CNMV, pero Brickwise, el agente que te vende, no consta notificado para operar en España.","fuente":{"titulo":"CNMV · Effecta GmbH en libre prestación (nº 5003), pestaña Agentes: sin datos","url":"https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5003&vista=8"},"consultadaEl":"2026-11-10"},"documentoEspana":{"cumple":false,"motivo":"Solo hay un KID en alemán y una ficha de la ley austriaca de financiación alternativa; ninguno cubre su venta en España.","fuente":{"titulo":"Basisinformationsblatt (KID) del emisor, solo en alemán (ISIN AT0000A38J32)","url":"https://cdn.brickwise.at/f6c7c7ff-f2f1-4272-86dd-39e02432868c.pdf"},"consultadaEl":"2026-11-10"},"minimoCorto":"Desde 100 € la participación (10/11)","salidaCorta":"Nominal en 2038; antes, reventa","puntos":[{"texto":"Reventa activa en la app","fuente":{"titulo":"Brickwise · mercado de reventa en la app (10/11/2026)","url":"https://app.brickwise.at/desktopWeb/marketplace"}}]},"hausera-proximas-ofertas":{"verificadaEl":"2026-11-10","anadidaEl":"2026-09-30","supervisada":{"cumple":false,"motivo":"Hausera (HOLDTX SPAIN) dice no ser empresa de servicios de inversión y no figura como plataforma de crowdfunding en la CNMV.","fuente":{"titulo":"CNMV · Listado de proveedores de servicios de financiación participativa (Hausera/HOLDTX no figura)","url":"https://www.cnmv.es/portal/consultas/servicios-financiacion-participativa/listado-proveedores.aspx?lang=es"},"consultadaEl":"2026-11-10"},"documentoEspana":{"cumple":false,"motivo":"El documento de emisión de Alicante 3 es público, pero no es un folleto ni un KID: la CNMV no lo ha revisado y el 10/11/2026 la emisión aún no estaba inscrita. Además, sus documentos no coinciden en cuánto hay que colocar para que la emisión siga adelante.","fuente":{"titulo":"Hausera · documento de emisión de Alicante 3 (portada: «no es considerado un folleto informativo»)","url":"https://drive.google.com/file/d/1cpWVN3J_Y1xdRDAxUzGnjmWXB-eTODH_"},"consultadaEl":"2026-11-10"},"minimoCorto":"Desde 100 € en Alicante 3 (10/11)","salidaCorta":"Al vender las viviendas, sin fecha fija","puntos":[]},"kraken-xstocks":{"verificadaEl":"2026-11-10","anadidaEl":"2026-11-03","supervisada":{"cumple":true,"motivo":"Payward Europe Digital Solutions (CY), que vende en Kraken UE, tiene licencia CySEC y figura en la CNMV (n.º 4474) en libre prestación.","fuente":{"titulo":"CNMV · Payward Europe Digital Solutions (CY) Limited, ESI del EEE en libre prestación n.º 4474","url":"https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp?tipo=CLP&numero=4474"},"consultadaEl":"2026-11-10"},"documentoEspana":{"cumple":false,"motivo":"El folleto se notificó a la CNMV, pero las condiciones finales solo ofrecen el producto en Liechtenstein y Suiza, no en España.","fuente":{"titulo":"Backed Assets (JE) · Condiciones finales n.º 159 (LITEx), apartado «Country(ies) of offer(s)»","url":"https://cdn.prod.website-files.com/655f3efc4be468487052e35a/69c684c9cf6e1070cfdd8851_Backed%20Assets_Final%20Terms%20Nr%20159%20(LITEx)_20260326.pdf"},"consultadaEl":"2026-11-10"},"minimoCorto":"1 €","salidaCorta":"Venta a Kraken, 24/5","puntos":[{"texto":"Inscrita en la CNMV (UE)","fuente":{"titulo":"CNMV · Payward Europe Digital Solutions (CY) Limited, ESI del EEE en libre prestación n.º 4474","url":"https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp?tipo=CLP&numero=4474"}}]},"local-de-estanco-klagenfurt":{"verificadaEl":"2026-11-10","anadidaEl":"2026-09-30","supervisada":{"cumple":false,"motivo":"Effecta (BaFin) figura en la CNMV, pero Brickwise, el agente que te vende, no consta notificado para operar en España.","fuente":{"titulo":"CNMV · Effecta GmbH en libre prestación (nº 5003), pestaña Agentes: sin datos","url":"https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5003&vista=8"},"consultadaEl":"2026-11-10"},"documentoEspana":{"cumple":false,"motivo":"Solo hay un KID en alemán y una ficha de la ley austriaca de financiación alternativa; ninguno cubre su venta en España.","fuente":{"titulo":"Basisinformationsblatt (KID) del emisor, solo en alemán (ISIN AT0000A2U5V3)","url":"https://cdn.brickwise.at/a53b857c-4664-4a58-a6a6-11e8b2a4f911.pdf"},"consultadaEl":"2026-11-10"},"minimoCorto":"Desde 95 € la participación (10/11)","salidaCorta":"Reventa en la app, si hay comprador","puntos":[{"texto":"Reventa activa en la app","fuente":{"titulo":"Brickwise · mercado de reventa en la app (10/11/2026)","url":"https://app.brickwise.at/desktopWeb/marketplace"}}]},"mtbill":{"verificadaEl":"2026-11-10","anadidaEl":"2026-09-30","supervisada":{"cumple":false,"motivo":"La vende el propio emisor, Midas Software GmbH, que no figura en BaFin ni en la CNMV; su KID dice que no está supervisado.","fuente":{"titulo":"BaFin · Base de datos de empresas (búsqueda «Midas»: solo una sociedad danesa distinta)","url":"https://portal.mvp.bafin.de/database/InstInfo/sucheForm.do?institutName=Midas&sucheButtonInstitut=Suche"},"consultadaEl":"2026-11-10"},"documentoEspana":{"cumple":true,"motivo":"Folleto aprobado en Liechtenstein y notificado a la CNMV; las condiciones finales incluyen España y minoristas, y hay KID en español.","fuente":{"titulo":"Midas · Documentación legal de mTBILL (condiciones finales del 17/07/2026 y KID en español)","url":"https://docs.midas.app/resources/legal-product-documentation/mtbill"},"consultadaEl":"2026-11-10"},"minimoCorto":null,"salidaCorta":null,"puntos":[{"texto":"Folleto notificado a la CNMV","fuente":{"titulo":"Midas · Documentación legal de mTBILL (condiciones finales del 17/07/2026 y KID en español)","url":"https://docs.midas.app/resources/legal-product-documentation/mtbill"}},{"texto":"KID en español","fuente":{"titulo":"Midas · Documentación legal de mTBILL (condiciones finales del 17/07/2026 y KID en español)","url":"https://docs.midas.app/resources/legal-product-documentation/mtbill"}}]},"prosegur-digital-gold":{"verificadaEl":"2026-11-10","anadidaEl":"2026-09-30","supervisada":{"cumple":false,"motivo":"Prosegur Crypto figura en la CNMV solo para custodiar y transferir criptoactivos; su contrato dice que este oro no está supervisado.","fuente":{"titulo":"CNMV · Relación de proveedores de servicios de criptoactivos (Prosegur: custodia, recepción de órdenes y transferencia)","url":"https://www.cnmv.es/Docportal/Proveedores-Servicios-Criptoactivos/Listado_ProveedoresCriptoactivos.pdf"},"consultadaEl":"2026-11-10"},"documentoEspana":{"cumple":false,"motivo":"No tiene KID ni folleto: su contrato dice que no es un producto financiero y solo hay términos y condiciones de la empresa.","fuente":{"titulo":"Prosegur Gold · Términos y condiciones generales (08/07/2026)","url":"https://app.prosegurdigitalgold.com/#/terms-service"},"consultadaEl":"2026-11-10"},"minimoCorto":"1 gramo de oro","salidaCorta":"Recompra por Prosegur","puntos":[{"texto":"Empresa española","fuente":{"titulo":"CNMV · Relación de proveedores de servicios de criptoactivos (Prosegur: custodia, recepción de órdenes y transferencia)","url":"https://www.cnmv.es/Docportal/Proveedores-Servicios-Criptoactivos/Listado_ProveedoresCriptoactivos.pdf"}},{"texto":"Oro custodiado en España","fuente":{"titulo":"Fuente de la ficha · Prosegur Crypto","url":"https://www.prosegurcrypto.com/digital-gold"}}]},"randhartingergasse-9-viena":{"verificadaEl":"2026-11-10","anadidaEl":"2026-09-30","supervisada":{"cumple":false,"motivo":"Effecta (BaFin) figura en la CNMV, pero Brickwise, el agente que te vende, no consta notificado para operar en España.","fuente":{"titulo":"CNMV · Effecta GmbH en libre prestación (nº 5003), pestaña Agentes: sin datos","url":"https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5003&vista=8"},"consultadaEl":"2026-11-10"},"documentoEspana":{"cumple":false,"motivo":"Solo hay un KID en alemán y una ficha de la ley austriaca de financiación alternativa; ninguno cubre su venta en España.","fuente":{"titulo":"Basisinformationsblatt (KID) del emisor, solo en alemán (ISIN AT0000A2ZT84)","url":"https://cdn.brickwise.at/8c331bfe-ab6a-436c-9d07-bb9c36aabad9.pdf"},"consultadaEl":"2026-11-10"},"minimoCorto":"Desde 78 € la participación (10/11)","salidaCorta":"Reventa en la app, si hay comprador","puntos":[{"texto":"Reventa activa en la app","fuente":{"titulo":"Brickwise · mercado de reventa en la app (10/11/2026)","url":"https://app.brickwise.at/desktopWeb/marketplace"}}]},"robinhood-classic-stock-tokens":{"verificadaEl":"2026-11-10","anadidaEl":"2026-11-02","supervisada":{"cumple":true,"motivo":"Robinhood Europe está autorizada por el Banco de Lituania y figura en la CNMV en libre prestación (n.º 5299) con derivados en su programa.","fuente":{"titulo":"CNMV · Robinhood Europe, UAB, ESI del EEE en libre prestación n.º 5299","url":"https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp?tipo=CLP&numero=5299"},"consultadaEl":"2026-11-10"},"documentoEspana":{"cumple":true,"motivo":"Tiene KID PRIIPs en español (1 de julio de 2026), enlazado desde su web española, para minoristas y sin excluir España.","fuente":{"titulo":"Robinhood Europe · Documento de datos fundamentales en español (derivado sobre acciones/ETP de EE. UU.)","url":"https://cdn.robinhood.com/assets/robinhood/legal/stock_and_etf_tokens_kid_es.pdf"},"consultadaEl":"2026-11-10"},"minimoCorto":"1 €","salidaCorta":"Cierre con Robinhood, 24/5","puntos":[{"texto":"Inscrita en la CNMV (UE)","fuente":{"titulo":"CNMV · Robinhood Europe, UAB, ESI del EEE en libre prestación n.º 5299","url":"https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp?tipo=CLP&numero=5299"}},{"texto":"KID en español","fuente":{"titulo":"Robinhood Europe · Documento de datos fundamentales en español (derivado sobre acciones/ETP de EE. UU.)","url":"https://cdn.robinhood.com/assets/robinhood/legal/stock_and_etf_tokens_kid_es.pdf"}}]},"spiko-letras-del-tesoro-dolar":{"verificadaEl":"2026-11-10","anadidaEl":"2026-11-02","supervisada":{"cumple":true,"motivo":"Spiko Finance está autorizada en Francia (ACPR) y figura en la CNMV (n.º 5325) para tramitar órdenes sobre fondos.","fuente":{"titulo":"CNMV · Spiko Finance SASU, ESI del EEE en libre prestación n.º 5325","url":"https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp?tipo=CLP&numero=5325&lang=es"},"consultadaEl":"2026-11-10"},"documentoEspana":{"cumple":true,"motivo":"KID oficial en español para todo inversor; la SICAV figura en la CNMV (n.º 2380) y la tabla de países de Spiko marca España.","fuente":{"titulo":"Spiko US T-Bills Money Market Fund · Documento de datos fundamentales en español (01/09/2026)","url":"https://cdn.spiko.finance/legal_docs/ES/KID_USTBL_ES.pdf"},"consultadaEl":"2026-11-10"},"minimoCorto":"1 USD","salidaCorta":"Reembolso diario","puntos":[{"texto":"Inscrita en la CNMV (UE)","fuente":{"titulo":"CNMV · Spiko Finance SASU, ESI del EEE en libre prestación n.º 5325","url":"https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp?tipo=CLP&numero=5325&lang=es"}},{"texto":"KID en español","fuente":{"titulo":"Spiko US T-Bills Money Market Fund · Documento de datos fundamentales en español (01/09/2026)","url":"https://cdn.spiko.finance/legal_docs/ES/KID_USTBL_ES.pdf"}}]},"spiko-letras-del-tesoro-euro":{"verificadaEl":"2026-11-10","anadidaEl":"2026-09-30","supervisada":{"cumple":true,"motivo":"Spiko Finance está autorizada en Francia (ACPR) y figura en la CNMV (n.º 5325) para tramitar órdenes sobre fondos.","fuente":{"titulo":"CNMV · Spiko Finance SASU, ESI del EEE en libre prestación n.º 5325","url":"https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp?tipo=CLP&numero=5325&lang=es"},"consultadaEl":"2026-11-10"},"documentoEspana":{"cumple":true,"motivo":"KID oficial en español para todo inversor; la SICAV figura en la CNMV (n.º 2380) y la tabla de países de Spiko marca España.","fuente":{"titulo":"Spiko EU T-Bills Money Market Fund · Documento de datos fundamentales en español (01/09/2026)","url":"https://cdn.spiko.finance/legal_docs/ES/KID_EUTBL_ES.pdf"},"consultadaEl":"2026-11-10"},"minimoCorto":"1 €","salidaCorta":"Reembolso diario","puntos":[{"texto":"Inscrita en la CNMV (UE)","fuente":{"titulo":"CNMV · Spiko Finance SASU, ESI del EEE en libre prestación n.º 5325","url":"https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp?tipo=CLP&numero=5325&lang=es"}},{"texto":"KID en español","fuente":{"titulo":"Spiko EU T-Bills Money Market Fund · Documento de datos fundamentales en español (01/09/2026)","url":"https://cdn.spiko.finance/legal_docs/ES/KID_EUTBL_ES.pdf"}}]},"spiko-smart-cash-euro":{"verificadaEl":"2026-11-10","anadidaEl":"2026-11-03","supervisada":{"cumple":true,"motivo":"Spiko Finance está autorizada en Francia (ACPR) y figura en la CNMV (n.º 5325) para tramitar órdenes sobre fondos.","fuente":{"titulo":"CNMV · Spiko Finance SASU, ESI del EEE en libre prestación n.º 5325","url":"https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp?tipo=CLP&numero=5325&lang=es"},"consultadaEl":"2026-11-10"},"documentoEspana":{"cumple":false,"motivo":"Hay KID en español, pero ningún registro público de la CNMV ni de la AMF muestra que este fondo esté dado de alta en España.","fuente":{"titulo":"CNMV · Spiko SICAV, IIC extranjera n.º 2380 (no muestra sus fondos uno a uno)","url":"https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0401205J&lang=es"},"consultadaEl":"2026-11-10"},"minimoCorto":"1 €","salidaCorta":"Reembolso diario, con límites","puntos":[{"texto":"Inscrita en la CNMV (UE)","fuente":{"titulo":"CNMV · Spiko Finance SASU, ESI del EEE en libre prestación n.º 5325","url":"https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp?tipo=CLP&numero=5325&lang=es"}}]},"switzerlend":{"verificadaEl":"2026-11-10","anadidaEl":"2026-09-30","supervisada":{"cumple":false,"motivo":"Vende el propio emisor suizo; solo está afiliado a PolyReg (antiblanqueo), sin licencia del EEE ni registro en la CNMV.","fuente":{"titulo":"Switzerlend AG · Investor Relations (afiliación a PolyReg y mercado no supervisado)","url":"https://www.lend.ch/de/investor-relations"},"consultadaEl":"2026-11-10"},"documentoEspana":{"cumple":false,"motivo":"No hay folleto ni KID: su página de inversores dice que «no es un folleto» y ningún documento dice qué países pueden comprar.","fuente":{"titulo":"Switzerlend AG · Investor Relations («weder Anlageberatung noch ein Prospekt»)","url":"https://www.lend.ch/de/investor-relations"},"consultadaEl":"2026-11-10"},"minimoCorto":"1 acción (68,01 CHF, 10/11)","salidaCorta":"Venta a otros accionistas","puntos":[{"texto":"Compra directa al emisor","fuente":{"titulo":"Fuente de la ficha · Aktionariat · LENDS","url":"https://shares.lend.ch/"}}]},"vivienda-pluddemanngasse-101-graz":{"verificadaEl":"2026-11-10","anadidaEl":"2026-09-30","supervisada":{"cumple":false,"motivo":"Effecta (BaFin) figura en la CNMV, pero Brickwise, el agente que te vende, no consta notificado para operar en España.","fuente":{"titulo":"CNMV · Effecta GmbH en libre prestación (nº 5003), pestaña Agentes: sin datos","url":"https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5003&vista=8"},"consultadaEl":"2026-11-10"},"documentoEspana":{"cumple":false,"motivo":"Solo hay un KID en alemán y una ficha de la ley austriaca de financiación alternativa; ninguno cubre su venta en España.","fuente":{"titulo":"Basisinformationsblatt (KID) del emisor, solo en alemán (ISIN AT0000A2RAH5)","url":"https://cdn.brickwise.at/f96b7e13-f9cb-4e13-a3f8-10974353ec4e.pdf"},"consultadaEl":"2026-11-10"},"minimoCorto":"Desde 75 € la participación (10/11)","salidaCorta":"Reventa en la app, si hay comprador","puntos":[{"texto":"Reventa activa en la app","fuente":{"titulo":"Brickwise · mercado de reventa en la app (10/11/2026)","url":"https://app.brickwise.at/desktopWeb/marketplace"}}]},"vivienda-pottendorfer-stra-e-62-wr-neustadt":{"verificadaEl":"2026-11-10","anadidaEl":"2026-09-30","supervisada":{"cumple":false,"motivo":"Effecta (BaFin) figura en la CNMV, pero Brickwise, el agente que te vende, no consta notificado para operar en España.","fuente":{"titulo":"CNMV · Effecta GmbH en libre prestación (nº 5003), pestaña Agentes: sin datos","url":"https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5003&vista=8"},"consultadaEl":"2026-11-10"},"documentoEspana":{"cumple":false,"motivo":"Solo hay un KID en alemán y una ficha de la ley austriaca de financiación alternativa; ninguno cubre su venta en España.","fuente":{"titulo":"Basisinformationsblatt (KID) del emisor, solo en alemán (ISIN AT0000A324B4)","url":"https://cdn.brickwise.at/03bdd125-b005-4948-b29f-4e575d58e985.pdf"},"consultadaEl":"2026-11-10"},"minimoCorto":"Desde 74 € la participación (10/11)","salidaCorta":"Primera cancelación a 15 años; reventa","puntos":[{"texto":"Reventa activa en la app","fuente":{"titulo":"Brickwise · mercado de reventa en la app (10/11/2026)","url":"https://app.brickwise.at/desktopWeb/marketplace"}}]},"vivienda-schwarzer-weg-18-graz":{"verificadaEl":"2026-11-10","anadidaEl":"2026-09-30","supervisada":{"cumple":false,"motivo":"Effecta (BaFin) figura en la CNMV, pero Brickwise, el agente que te vende, no consta notificado para operar en España.","fuente":{"titulo":"CNMV · Effecta GmbH en libre prestación (nº 5003), pestaña Agentes: sin datos","url":"https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5003&vista=8"},"consultadaEl":"2026-11-10"},"documentoEspana":{"cumple":false,"motivo":"Solo hay un KID en alemán y una ficha de la ley austriaca de financiación alternativa; ninguno cubre su venta en España.","fuente":{"titulo":"Basisinformationsblatt (KID) del emisor, solo en alemán (ISIN AT0000A2WCE8)","url":"https://cdn.brickwise.at/4d0dd404-4a76-417a-b21d-606a1f11ba63.pdf"},"consultadaEl":"2026-11-10"},"minimoCorto":"Desde 65 € la participación (10/11)","salidaCorta":"Reventa en la app, si hay comprador","puntos":[{"texto":"Reventa activa en la app","fuente":{"titulo":"Brickwise · mercado de reventa en la app (10/11/2026)","url":"https://app.brickwise.at/desktopWeb/marketplace"}}]},"vivienda-sonnleithnergasse-2-viena":{"verificadaEl":"2026-11-10","anadidaEl":"2026-09-30","supervisada":{"cumple":false,"motivo":"Effecta (BaFin) figura en la CNMV, pero Brickwise, el agente que te vende, no consta notificado para operar en España.","fuente":{"titulo":"CNMV · Effecta GmbH en libre prestación (nº 5003), pestaña Agentes: sin datos","url":"https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5003&vista=8"},"consultadaEl":"2026-11-10"},"documentoEspana":{"cumple":false,"motivo":"Solo hay un KID en alemán y una ficha de la ley austriaca de financiación alternativa; ninguno cubre su venta en España.","fuente":{"titulo":"Basisinformationsblatt (KID) del emisor, solo en alemán (ISIN AT0000A2T4D7)","url":"https://cdn.brickwise.at/8d71cb16-1152-4535-8c36-d41c07e5ec05.pdf"},"consultadaEl":"2026-11-10"},"minimoCorto":"Desde 75 € la participación (10/11)","salidaCorta":"Reventa en la app, si hay comprador","puntos":[{"texto":"Reventa activa en la app","fuente":{"titulo":"Brickwise · mercado de reventa en la app (10/11/2026)","url":"https://app.brickwise.at/desktopWeb/marketplace"}}]},"vivienda-stallhofstra-e-28-gratwein":{"verificadaEl":"2026-11-10","anadidaEl":"2026-09-30","supervisada":{"cumple":false,"motivo":"Effecta (BaFin) figura en la CNMV, pero Brickwise, el agente que te vende, no consta notificado para operar en España.","fuente":{"titulo":"CNMV · Effecta GmbH en libre prestación (nº 5003), pestaña Agentes: sin datos","url":"https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5003&vista=8"},"consultadaEl":"2026-11-10"},"documentoEspana":{"cumple":false,"motivo":"Solo hay un KID en alemán y una ficha de la ley austriaca de financiación alternativa; ninguno cubre su venta en España.","fuente":{"titulo":"Basisinformationsblatt (KID) del emisor, solo en alemán (ISIN AT0000A2WCD0)","url":"https://cdn.brickwise.at/4f7737ce-d8b6-45e2-88ef-d6f6d6acafee.pdf"},"consultadaEl":"2026-11-10"},"minimoCorto":"Desde 68,80 € la participación (10/11)","salidaCorta":"Reventa en la app, si hay comprador","puntos":[{"texto":"Reventa activa en la app","fuente":{"titulo":"Brickwise · mercado de reventa en la app (10/11/2026)","url":"https://app.brickwise.at/desktopWeb/marketplace"}}]}});
/* transparencia:fin */



/* Estas portadas explican visualmente el tipo de activo. No son fotografías
   de un proyecto concreto de la empresa: el distintivo y la ficha lo dicen
   de forma visible, y la procedencia completa queda en fuentes.json. */
const PORTADAS_GENERADAS_MOVIL=new Set([
 'ADDX','Archax','ARTEX Global Markets','Backed Finance','Blocksquare','Centrifuge',
 'Courtyard','Figure','Fireblocks','Franklin Templeton','INX','Lofty','Maple Finance',
 'Midas','Ondo Finance','OpenEden','Pax Gold','Reental','Republic','Securitize','Spiko',
 'Superstate','Swarm','Taurus','Tokeny','tZERO'
]);
const portadaEsIlustrativa=p=>PORTADAS_GENERADAS_MOVIL.has(p.n);

/* P, FUERA y EMI se declaran una sola vez en el snapshot generado del
   catálogo, cargado con defer antes de este comportamiento. Solo un lote
   íntegro validado puede sustituir sus contenidos; se conserva su identidad. */
/* ---- categorías: seis colores que se distinguen sobre negro ----
   Sobre papel bastaba una rampa de azules; sobre un fondo de noche los
   tonos oscuros desaparecen. Estos seis están elegidos por separación de
   matiz y todos tienen luz suficiente para leerse a 8 px de diámetro. */
const CATMETA={
 "Inmobiliario":{c:"#F2B23C",ic:'<path d="M3 10.5L12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'},
 "Crédito privado":{c:"#5B8CFF",ic:'<path d="M3 7h18v11H3z"/><circle cx="12" cy="12.5" r="2.6"/>'},
 "Tesoro y fondos":{c:"#32C9F5",ic:'<path d="M4 20h16M6 20V10M10 20V10M14 20V10M18 20V10M3 9l9-5 9 5z"/>'},
 "Acciones y capital privado":{c:"#B583FF",ic:'<path d="M4 18l5-5 3.5 3.5L20 8"/><path d="M15 8h5v5"/>'},
 "Materias primas":{c:"#FF8A5B",ic:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>'},
 "Infraestructura":{c:"#9AA6BF",ic:'<circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="18" r="2.4"/><circle cx="12" cy="6" r="2.4"/><path d="M12 8.4v3.2M10.3 13.2L7.4 16M13.7 13.2L16.6 16"/>'},
};
/* Nombre corto para chips y casillas del móvil: «Acciones y capital privado»
   no cabe en una fila de 390 px sin partirse. El nombre completo sigue en
   escritorio, en el radar y en cada ficha. */
const CAT_CORTA={"Crédito privado":"Crédito","Tesoro y fondos":"Tesoro","Acciones y capital privado":"Acciones"};
const catCorta=c=>CAT_CORTA[c]||c;
/* Dos textos y el CSS enseña uno: largo en escritorio, corto en el móvil. */
const nombreCatHtml=c=>catCorta(c)===c?escHtml(c):
 '<span class="f-largo">'+escHtml(c)+'</span><span class="f-corto">'+escHtml(catCorta(c))+'</span>';
const ACCESOS=["Minorista","Acreditado","Institucional","Empresas"];
/* «Acreditado» sigue siendo el valor del filtro; solo cambia lo que se lee. */
const etiquetaAcceso=a=>a==="Acreditado"?"Inversor acreditado":a;
const TICKETS=["Bajo","Medio","Alto","No aplica"];

/* ---- logotipo inline (CSS puede animarlo; <use> no) ----
   El cubo isométrico del centro se ha ido: ahora es un hexágono, la misma
   forma que las piezas del explicador. Marca y dibujo dicen lo mismo. */
const MARK=`
<g class="aro" fill="none" stroke="currentColor" stroke-width="1.6">
 <circle cx="52" cy="52" r="46"/><circle cx="52" cy="52" r="35"/><circle cx="52" cy="52" r="24"/></g>
<g class="cruz" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
 <path d="M52 4v14M52 86v14M4 52h14M86 52h14"/></g>
<path class="barrido" d="M52 52 L64.74 20.48 A34 34 0 0 1 83.52 39.26 Z" fill="#25E39A" opacity=".38"/>
<g>
 <path d="M65 52L58.5 63.26L45.5 63.26L39 52L45.5 40.74L58.5 40.74Z" fill="#25E39A"/>
 <path d="M65 52L58.5 63.26L45.5 63.26L39 52Z" fill="#0F7A57"/>
 <path d="M58.5 40.74L65 52L58.5 63.26" fill="none" stroke="#6BF0C0" stroke-width="1.6" stroke-linejoin="round"/></g>
<g fill="#25E39A">
 <circle class="eco" cx="22" cy="30" r="3.1"/>
 <circle class="eco" cx="25" cy="78" r="2.6"/>
 <circle class="eco" cx="82" cy="76" r="2.9"/></g>`;
document.querySelectorAll('svg.mk').forEach(s=>{s.innerHTML=MARK});

const irA=id=>{
 if(id==='explain'&&typeof Movil!=='undefined'&&Movil.tutorial&&Movil.tutorial(document.activeElement))return;
 const el=document.getElementById(id);if(el&&el.scrollIntoView)el.scrollIntoView();
};

/* =================================================================
   EL DIBUJO · 127 fichas hexagonales
   -----------------------------------------------------------------
   Antes era una torre de cubos. Una torre explica un edificio, pero no
   explica un token: para eso hace falta que la pieza suelta ya tenga
   forma de ficha. Un panal de hexágonos resuelve las dos cosas a la vez
   — encaja sin dejar un solo hueco, así que pegado se lee como UNA pieza
   maciza, y separado se lee como 127 fichas idénticas.

   Motor propio de WebGL2 con dibujado instanciado: las 127 piezas salen
   en una sola llamada y la interpolación entre estados, el escalonado y
   el arco al cambiar de mano se calculan en la tarjeta gráfica.
   ================================================================= */
const GL_VS=`#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNrm;
layout(location=2) in vec3 aPosA;
layout(location=3) in vec3 aPosB;
layout(location=4) in vec3 aRotA;
layout(location=5) in vec3 aRotB;
layout(location=6) in vec4 aMeta;   /* x retardo · y semilla · z arco · w luz */
uniform mat4 uProj,uView; uniform float uMix,uSize,uArco,uModo,uSuelo;
out vec3 vN,vW,vFwd; out float vSem,vAlt,vLuz;
mat3 rot3(vec3 r){
 float cx=cos(r.x),sx=sin(r.x),cy=cos(r.y),sy=sin(r.y),cz=cos(r.z),sz=sin(r.z);
 return mat3(cz,sz,0.,-sz,cz,0.,0.,0.,1.)*mat3(cy,0.,-sy,0.,1.,0.,sy,0.,cy)*mat3(1.,0.,0.,0.,cx,sx,0.,-sx,cx);}
void main(){
 float t=clamp((uMix-aMeta.x*0.42)/0.58,0.0,1.0);
 t=t*t*(3.0-2.0*t);
 vec3 P=mix(aPosA,aPosB,t);
 /* el arco: quien cambia de dueño pasa POR ENCIMA del resto. Sin altura
    las piezas se cruzarían atravesándose y no se leería el intercambio */
 P.y+=aMeta.z*uArco*4.0*t*(1.0-t);
 mat3 M=rot3(mix(aRotA,aRotB,t));
 vec3 w=M*(aPos*uSize)+P;
 vec3 n=M*aNrm;

 /* Un mismo programa pinta las tres pasadas. Cambiar de programa por
    pasada obligaría a duplicar la geometría y los atributos de instancia;
    así las 91 piezas se dibujan tres veces con la misma malla. */
 vAlt=P.y-uSuelo;
 if(uModo>1.5){
   /* SOMBRA · la pieza aplastada contra el suelo. Cuanto más alta vuela,
      más se abre y más se deshace: eso es lo que hace que se lea la
      altura. Sin sombra, un objeto flotando no tiene sitio. */
   w.xz=(w.xz-P.xz)*(1.0+max(vAlt,0.0)*0.13)+P.xz;
   w.y=uSuelo+0.03;
 }else if(uModo>0.5){
   /* REFLEJO · la escena espejada bajo el suelo pulido.
      Se espeja la posición pero NO la normal. Volteándola también, las
      caras de abajo quedaban mirando a la luz principal y el reflejo
      salía encendido, con la retícula del panal marcada como un tablero
      de ajedrez. Sin voltearla, el envés se queda en penumbra —que es lo
      que un suelo pulido devuelve de verdad. */
   w.y=2.0*uSuelo-w.y;
 }
 vN=normalize(n); vW=w; vSem=aMeta.y; vLuz=aMeta.w;
 /* Hacia dónde mira este panel. Se necesita en el fragmento para saber
    qué parte es VIDRIO y qué parte es marco: solo la cara frontal plana
    puede estar encendida. Sin esta distinción se ilumina el panel entero,
    cantos incluidos, y en vez de una ventana parece una bombilla. */
 vFwd=normalize(M*vec3(0.0,0.0,1.0));
 gl_Position=uProj*uView*vec4(w,1.0);}`;

const GL_FS=`#version 300 es
precision highp float;
in vec3 vN,vW,vFwd; in float vSem,vAlt,vLuz;
uniform vec3 uCam,uColA,uNiebla;
uniform float uIndiv,uCerca,uLejos,uModo,uRadioSuelo,uSuelo;
out vec4 o;

/* El color es el dueño.
   Mientras el activo está entero todas las piezas comparten un oro único,
   porque hay un único propietario. Al repartirse, cada participación toma
   el suyo. Ese cambio de color explica la propiedad fraccionada mejor que
   cualquier rótulo. Cuatro tonos y ninguno se parece a otro: tres fríos y
   uno cálido, que es el que impide que se lea "todo igual con matices".

   Bajados de tono respecto a la primera versión: en pastel el conjunto
   parecía un juego de mesa. Un color de propiedad tiene que pesar. */
vec3 duenno(float s){
 vec3 a=vec3(0.106,0.706,0.478);   /* verde  #1BB47A */
 vec3 b=vec3(0.216,0.494,0.925);   /* azul   #377EEC */
 vec3 c=vec3(0.576,0.353,0.918);   /* violeta#935AEA */
 vec3 d=vec3(0.902,0.647,0.243);   /* ámbar  #E6A53E */
 float k=floor(s*4.0);
 if(k<1.0) return a;
 if(k<2.0) return b;
 if(k<3.0) return c;
 return d;}

/* El cielo que se refleja en el metal. No hay mapa de entorno —cargarlo
   serían kilobytes y una petición más—, así que se sintetiza: claro
   arriba, oscuro abajo y una banda caliente en el horizonte, que es lo
   que de verdad hace que una superficie curva parezca metal. */
vec3 cielo(vec3 d){
 float h=d.y*0.5+0.5;
 vec3 arriba=vec3(0.36,0.38,0.44);
 vec3 medio =vec3(0.44,0.42,0.38);
 vec3 abajo =vec3(0.025,0.025,0.028);
 float horiz=exp(-abs(d.y)*7.0);
 return mix(mix(abajo,arriba,smoothstep(0.35,0.9,h)),medio,horiz*0.8);}

void main(){
 /* SOMBRA · no se ilumina, se dibuja. Negro con la opacidad cayendo
    según la altura a la que vuele la pieza. */
 if(uModo>1.5){
   float r=length(vW.xz);
   if(r>uRadioSuelo) discard;
   float a=0.66*exp(-max(vAlt,0.0)*0.36)*(1.0-smoothstep(uRadioSuelo*0.6,uRadioSuelo,r));
   o=vec4(0.0,0.0,0.0,a);
   return;
 }
 vec3 N=normalize(vN), V=normalize(uCam-vW);
 /* Dos luces, como en un plató: una llave alta que define el volumen y un
    relleno frío por el lado contrario para que la sombra no caiga a negro.
    Con una sola luz todo parece plástico. */
 vec3 Lk=normalize(vec3( 0.38,0.90, 0.44));
 vec3 Lf=normalize(vec3(-0.72,0.18,-0.56));

 vec3 tono=mix(uColA,duenno(vSem),uIndiv);
 /* Cada pieza tiñe un pelo distinto para que el conjunto no parezca
    pintado de plano — pero SOLO cuando ya está repartido. Con el activo
    entero la variación delataría las juntas justo en el paso en el que
    hay que creerse que es una sola cosa. */
 tono*=mix(1.0,0.94+vSem*0.12,uIndiv);

 float dif=max(dot(N,Lk),0.0);
 float rel=max(dot(N,Lf),0.0);
 float esp=pow(max(dot(N,normalize(Lk+V)),0.0),150.0);  /* apretado = metal */
 float esp2=pow(max(dot(N,normalize(Lf+V)),0.0),22.0);  /* ancho = volumen */
 float fres=pow(1.0-max(dot(N,V),0.0),4.5);             /* canto encendido */

 /* Ambiente bajo a propósito. Un ambiente alto ilumina por igual la cara
    que da a la luz y la que no, y entonces el volumen desaparece: la
    torre se ve como una silueta plana recortada. Bajándolo, la cara en
    sombra se hunde y el edificio tiene dos lados. */
 vec3 amb=mix(vec3(0.018,0.019,0.024),vec3(0.082,0.086,0.098),0.5+0.5*N.y);
 /* Ese ambiente azul da atmósfera con el activo entero, pero en cuanto
    cada pieza tiene color propio lo aplana todo en un único azul y se
    pierde justo lo que hay que enseñar. Al repartir se vuelve neutro. */
 amb=mix(amb,vec3(0.062,0.066,0.080),uIndiv*0.86);

 /* Lo que separa el metal del plástico no es el brillo puntual sino el
    ENTORNO reflejado: una superficie metálica devuelve la habitación
    entera, deformada. El oro la devuelve teñida de oro; el color de
    dueño, siendo mate, casi no la devuelve. */
 vec3 refl=cielo(reflect(-V,N));
 float metal=1.0-uIndiv*0.72;
 vec3 brillo=mix(uColA*1.8,vec3(1.0),uIndiv*0.78);

 vec3 col = tono*(amb + dif*1.10 + rel*vec3(0.10,0.14,0.23))
          + refl*mix(vec3(1.0),tono,0.55)*metal*0.62
          + brillo*esp*1.35
          + brillo*esp2*0.08
          + mix(vec3(0.86,0.85,0.82),tono*1.5,uIndiv)*fres*0.44;

 /* ---- LA VENTANA ENCENDIDA ----------------------------------------
    Un tercio de los paneles tiene luz dentro. No es un adorno: es lo que
    convierte un volumen geométrico en un edificio habitado, y por tanto
    en algo que apetece. Y explica el reparto sin una palabra — con el
    activo entero todas las ventanas son del mismo oro; repartido, cada
    ventana brilla del color de su dueño.

    La emisión NO se multiplica por la luz de la escena: por eso se ve
    igual de encendida en la cara en sombra, que es exactamente lo que
    hace que se lea como luz propia y no como reflejo. */
 /* Solo el vidrio se enciende, no el marco: la cara frontal plana es la
    única cuya normal coincide con la dirección del panel. Los biseles y
    los cantos quedan oscuros, y ese contraste entre el hueco encendido y
    su marco en sombra es exactamente lo que se ve en una fachada de
    noche. Encendiendo el panel entero parecía una bombilla. */
 float vidrio=smoothstep(0.86,0.985,dot(N,normalize(vFwd)));
 vec3 luzDentro=mix(vec3(1.00,0.78,0.42),duenno(vSem)*1.35+vec3(0.10),uIndiv);
 col+=luzDentro*vLuz*vidrio*0.62;

 col=mix(col,uNiebla,smoothstep(uCerca,uLejos,length(uCam-vW))*0.5);

 /* REFLEJO · más oscuro, y se apaga con la altura y hacia el borde del
    suelo. Un reflejo a plena luz delata que es un truco; medio apagado,
    convence. */
 if(uModo>0.5){
   float r=length(vW.xz);
   if(r>uRadioSuelo) discard;
   /* La caída se mide en cada PÍXEL, no por pieza: la altura original de
      este fragmento sobre el suelo es la distancia especular. Así el
      reflejo es intenso donde la ficha toca el cristal y se deshace hacia
      arriba, que es como se comporta un reflejo de verdad. Midiéndolo por
      pieza, todas se desvanecían por igual y el reflejo quedaba como una
      calcomanía plana debajo. */
   float alto=max(uSuelo-vW.y,0.0);
   float f=exp(-alto*0.85)*(1.0-smoothstep(uRadioSuelo*0.30,uRadioSuelo*0.8,r));
   o=vec4(col*0.40,f*0.80);
   return;
 }
 o=vec4(col,1.0);}`;

/* El suelo es una pantalla de radar: anillos, radios y un barrido que gira.
   Es el logotipo convertido en escenario, y de paso da suelo a las piezas
   —sin nada debajo, los objetos flotan en un vacío sin escala—. */
/* El suelo, justo debajo de la planta baja: la torre se apoya en él.
   Un reflejo solo convence cuando el objeto lo toca —y entonces, además,
   la sombra pasa a ser sombra de contacto y el conjunto deja de flotar en
   la nada para plantarse sobre un cristal negro. Con una torre de quince
   metros reflejándose entera, además, la escena gana el doble de alto. */
const SUELO_Y=-13.1;
const SU_VS=`#version 300 es
precision highp float;
layout(location=0) in vec2 aXZ;
uniform mat4 uProj,uView; uniform float uR,uY;
out vec2 vXZ;
void main(){vXZ=aXZ;gl_Position=uProj*uView*vec4(aXZ.x*uR,uY,aXZ.y*uR,1.0);}`;
const SU_FS=`#version 300 es
precision highp float;
in vec2 vXZ; uniform float uR,uAncho,uBarrido; out vec4 o;
void main(){
 float d=length(vXZ);
 if(d>1.0){o=vec4(0.0);return;}
 float w=d*uR;
 float f=fract(w/4.2);
 float anillo=smoothstep(0.962,1.0,f)+smoothstep(0.038,0.0,f);
 float ang=atan(vXZ.y,vXZ.x);
 float radios=smoothstep(0.9962,1.0,abs(cos(ang*3.0)));
 float da=mod(uBarrido-ang,6.28318);
 float barr=exp(-da*2.7);
 float vinneta=1.0-smoothstep(0.12,1.0,d);
 /* Ya no se falsea la sombra apagando el suelo: ahora hay sombras de
    verdad, una por pieza, proyectadas en su pasada. Lo que queda aquí es
    solo el grafismo del radar, y va con poca opacidad a propósito para
    que el reflejo se vea A TRAVÉS de él. Un suelo opaco taparía el
    reflejo y volveríamos a tener las piezas flotando en el vacío. */
 float a=(anillo*0.30+radios*0.09+barr*0.26+0.022)*vinneta;
 vec3 col=mix(vec3(0.14,0.135,0.125),vec3(0.145,0.890,0.604),clamp(barr*0.85+anillo*0.30,0.0,1.0));
 o=vec4(col,a);}`;

/* La viñeta, en una última pasada a pantalla completa.
   Es el detalle que más barato convierte "un render" en "una foto": el ojo
   da por hecho que hay una lente delante, y una lente siempre oscurece las
   esquinas. Sin esto la imagen tiene el mismo brillo en el centro que en
   el borde, que es algo que no ocurre en ninguna fotografía. */
const VI_VS=`#version 300 es
precision highp float;
layout(location=0) in vec2 aXY;
out vec2 vUV;
void main(){vUV=aXY;gl_Position=vec4(aXY,0.0,1.0);}`;
const VI_FS=`#version 300 es
precision highp float;
in vec2 vUV; uniform float uAsp,uFase; out vec4 o;
void main(){
 vec2 p=vec2(vUV.x*max(uAsp,1.0),vUV.y);
 float d=length(p)/length(vec2(max(uAsp,1.0),1.0));
 if(uFase<0.5){
   /* HALO · un resplandor cálido bajo y ancho, pintado ANTES que nada y
      sumado. Recorta la silueta de la torre contra algo en vez de contra
      el vacío, y da la sensación de ciudad de noche al fondo. Es el paso
      más barato de todos y el que más cambia la escena. */
   float h=1.0-smoothstep(-0.9,0.75,vUV.y);         /* concentrado abajo */
   float c=exp(-pow(abs(vUV.x)*1.15,2.0));          /* y hacia el centro */
   /* Neutro y apenas cálido: es la bruma de una ciudad de noche, no un
      foco dorado. Con el halo naranja de antes, todo el 3D volvía a
      teñirse del dorado que se ha quitado de la interfaz. */
   o=vec4(vec3(0.132,0.126,0.118)*h*c,1.0);
   return;
 }
 o=vec4(0.0,0.0,0.0,smoothstep(0.42,1.08,d)*0.66);}`;

function mPersp(f,a,n,fa){const t=1/Math.tan(f/2);
 return new Float32Array([t/a,0,0,0, 0,t,0,0, 0,0,(fa+n)/(n-fa),-1, 0,0,2*fa*n/(n-fa),0]);}
function mMirar(e,c,u){
 let z=[e[0]-c[0],e[1]-c[1],e[2]-c[2]];let l=Math.hypot(z[0],z[1],z[2])||1;z=z.map(v=>v/l);
 let x=[u[1]*z[2]-u[2]*z[1],u[2]*z[0]-u[0]*z[2],u[0]*z[1]-u[1]*z[0]];l=Math.hypot(x[0],x[1],x[2])||1;x=x.map(v=>v/l);
 const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];
 return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,
  -(x[0]*e[0]+x[1]*e[1]+x[2]*e[2]),-(y[0]*e[0]+y[1]*e[1]+y[2]*e[2]),-(z[0]*e[0]+z[1]*e[1]+z[2]*e[2]),1]);}

/* azar reproducible: la misma pieza se comporta igual en cada visita */
const gHash=(i,k)=>{const v=Math.sin(i*127.1+k*311.7)*43758.5453;return v-Math.floor(v);};

/* =================================================================
   EL EDIFICIO
   -----------------------------------------------------------------
   Antes esto era un panal plano de fichas hexagonales. Se veía bien y
   explicaba mal: una moneda partida en gajos es una metáfora, y encima
   una metáfora que hay que traducir. El texto de al lado habla de un
   local, de un edificio, de inquilinos que pagan un alquiler — y el
   dibujo enseñaba galletas.

   Ahora el activo es lo que dice ser: un rascacielos de casi 900 paneles
   de fachada, de pie sobre el cristal negro. Cada panel es una
   participación. Se lee sin traducir.

   Lo que separa esta versión de la anterior —que parecía un montón de
   piezas de Lego— son cuatro decisiones, y ninguna es un ajuste fino:

   1 · PROPORCIÓN. La torre es esbelta (22 plantas sobre una base de siete
       metros escasos) y los paneles son ALTOS Y ESTRECHOS, 0,62 × 1,0,
       como el despiece de un muro cortina de verdad. Con paneles
       cuadrados sobre una caja rechoncha no hay iluminación que salve el
       resultado: se lee como cubos apilados.
   2 · VENTANAS ENCENDIDAS. Un tercio de los paneles emite luz propia.
       Es lo que convierte un volumen en un edificio habitado, y lo que
       hace que apetezca. Además explica sola la idea: con el activo
       entero todas las ventanas son del mismo oro; repartido, cada
       ventana brilla del color de su dueño.
   3 · ORO QUE PARECE ORO. Reflejo de entorno fuerte y brillo especular
       apretado. El oro mate se lee como ocre, que es plástico.
   4 · ATMÓSFERA. Un halo cálido detrás recorta la silueta y da aire a la
       escena. Sin él, el objeto flota en un vacío sin profundidad.
   ================================================================= */
const PISO=1.0;                   /* altura de planta */
const BAHIA=0.62;                 /* ancho de calle vertical de fachada */
function gEdificio(){
 /* Tres cuerpos con retranqueo: la silueta escalonada es lo que hace que
    una caja se lea como "rascacielos" y no como "caja". Cada cuerpo se
    define por su número de bahías por lado, así el ancho de panel sale
    idéntico en los tres y el despiece no baila al subir. */
 /* El cuarto cuerpo es el remate: dos bahías de lado y cuatro plantas.
    Sin él la torre termina de golpe y se lee como tres cajas apiladas;
    con él tiene corona, que es lo que hace iconico a un rascacielos. */
 const cuerpos=[{nb:11,y0:0,y1:10},{nb:8,y0:10,y1:17},{nb:5,y0:17,y1:21},{nb:3,y0:21,y1:25}];
 const ALTO=25, yOff=-(ALTO*PISO)/2;
 const P=[];
 const semiancho=nb=>nb*BAHIA/2;
 cuerpos.forEach((s,si)=>{
  /* Cada panel va en el PLANO de su fachada, no en el centro de una
     celda: puesto en el centro, las cuatro paredes no casan en las
     esquinas y la torre parece un montón de cajas apiladas. */
  const m=semiancho(s.nb);
  for(let y=s.y0;y<s.y1;y++){
   const yy=y*PISO+yOff;
   for(let k=0;k<s.nb;k++){
    const u=-m+BAHIA*(k+0.5);
    P.push({p:[ m,yy,u], r:[0, Math.PI/2,0]});   /* cara +X */
    P.push({p:[-m,yy,u], r:[0,-Math.PI/2,0]});   /* cara -X */
    P.push({p:[ u,yy, m], r:[0,0,0]});           /* cara +Z */
    P.push({p:[ u,yy,-m], r:[0,Math.PI,0]});     /* cara -Z */
   }
  }
  /* La cornisa del retranqueo. El panel tumbado mide 1,0 en radial y 0,62
     en tangencial, que es justo el anillo entre un cuerpo y el siguiente:
     encaja sin tener que escalar nada por instancia. */
  const sig=cuerpos[si+1];
  const y=s.y1*PISO+yOff-PISO*0.5;
  if(sig){
   const mi=semiancho(sig.nb), rc=(m+mi)/2;
   const n=Math.max(4,Math.round(2*rc/BAHIA));
   for(let k=0;k<n;k++){
    const u=-rc+(2*rc/n)*(k+0.5);
    P.push({p:[ rc,y,u], r:[-Math.PI/2, Math.PI/2,0]});
    P.push({p:[-rc,y,u], r:[-Math.PI/2, Math.PI/2,0]});
    P.push({p:[ u,y, rc], r:[-Math.PI/2,0,0]});
    P.push({p:[ u,y,-rc], r:[-Math.PI/2,0,0]});
   }
  }else{
   /* la azotea, para que no se vea el hueco por arriba */
   const n=Math.max(3,Math.round(2*m/BAHIA));
   for(let i=0;i<n;i++) for(let j=0;j<n;j++)
    P.push({p:[-m+(2*m/n)*(i+0.5), y, -m+(2*m/n)*(j+0.5)], r:[-Math.PI/2,0,0]});
  }
 });
 return P;
}

let colocar=()=>{};        // lo sustituye el motor si arranca
let escenaVisible=false;

(function init3D(){
 const cv=document.getElementById('gl');
 const fall=document.getElementById('glfall');
 const pista=document.getElementById('sceneHint');
 const host=document.getElementById('scene');
 if(!cv||!host) return;
 let gl=null;
 try{ gl=cv.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance'}); }catch(e){}
 if(!gl){ cv.hidden=true; if(fall) fall.hidden=false; if(pista) pista.hidden=true; return; }

 function sh(t,src){const o=gl.createShader(t);gl.shaderSource(o,src);gl.compileShader(o);
  if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o;}
 function prog(v,f){const o=gl.createProgram();gl.attachShader(o,sh(gl.VERTEX_SHADER,v));
  gl.attachShader(o,sh(gl.FRAGMENT_SHADER,f));gl.linkProgram(o);
  if(!gl.getProgramParameter(o,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(o));return o;}

 let P1,P2,P3;
 try{ P1=prog(GL_VS,GL_FS); P2=prog(SU_VS,SU_FS); P3=prog(VI_VS,VI_FS); }
 catch(e){ cv.hidden=true; if(fall) fall.hidden=false; if(pista) pista.hidden=true; return; }

 /* --- el panel de fachada ---
    Una caja fina con la cara delantera rehundida y un bisel alrededor,
    como un vidrio dentro de su marco. El bisel es lo que recoge la línea
    de luz en todo el contorno y lo que separa el panel de sus vecinos sin
    necesidad de dibujar una junta. Cada cara lleva su propia normal para
    que la luz las distinga; por eso los vértices van repetidos.
    Mira hacia +Z: la rotación de cada instancia lo orienta a su fachada. */
 const gp=[],gn=[],gi=[];
 (function panel(){
  /* 0,62 × 1,0: alto y estrecho. La proporción del panel es la mitad del
     carácter del edificio — cuadrado da cubo, vertical da rascacielos. */
  const A=BAHIA/2, B=PISO/2, D=0.07, BIS=0.055;
  const AI=A-BIS, BI=B-BIS;
  const V=(x,y,z,n)=>{gp.push(x,y,z);gn.push(n[0],n[1],n[2]);return gp.length/3-1;};
  const quad=(a,b,c,d)=>{gi.push(a,b,c,a,c,d);};
  const N_FR=[0,0,1], N_AT=[0,0,-1];
  /* cara delantera, rehundida */
  quad(V(-AI,-BI,D,N_FR),V(AI,-BI,D,N_FR),V(AI,BI,D,N_FR),V(-AI,BI,D,N_FR));
  /* cara trasera */
  quad(V(AI,-BI,-D,N_AT),V(-AI,-BI,-D,N_AT),V(-AI,BI,-D,N_AT),V(AI,BI,-D,N_AT));
  /* el bisel del contorno: cuatro trapecios entre la cara rehundida y el borde */
  const k=0.62, m=0.78;
  const bis=[
   [[-AI,BI,D],[AI,BI,D],[A,B,0],[-A,B,0],[0,m,k]],        /* arriba */
   [[AI,-BI,D],[-AI,-BI,D],[-A,-B,0],[A,-B,0],[0,-m,k]],   /* abajo */
   [[AI,BI,D],[AI,-BI,D],[A,-B,0],[A,B,0],[m,0,k]],        /* derecha */
   [[-AI,-BI,D],[-AI,BI,D],[-A,B,0],[-A,-B,0],[-m,0,k]],   /* izquierda */
  ];
  bis.forEach(([p1,p2,p3,p4,n])=>{
   const l=Math.hypot(n[0],n[1],n[2]), nn=[n[0]/l,n[1]/l,n[2]/l];
   quad(V(p1[0],p1[1],p1[2],nn),V(p2[0],p2[1],p2[2],nn),
        V(p3[0],p3[1],p3[2],nn),V(p4[0],p4[1],p4[2],nn));
  });
  /* los cantos, del borde a la cara trasera */
  const lados=[
   [[-A,B,0],[A,B,0],[AI,BI,-D],[-AI,BI,-D],[0,1,0]],
   [[A,-B,0],[-A,-B,0],[-AI,-BI,-D],[AI,-BI,-D],[0,-1,0]],
   [[A,B,0],[A,-B,0],[AI,-BI,-D],[AI,BI,-D],[1,0,0]],
   [[-A,-B,0],[-A,B,0],[-AI,BI,-D],[-AI,-BI,-D],[-1,0,0]],
  ];
  lados.forEach(([p1,p2,p3,p4,n])=>{
   quad(V(p1[0],p1[1],p1[2],n),V(p2[0],p2[1],p2[2],n),
        V(p3[0],p3[1],p3[2],n),V(p4[0],p4[1],p4[2],n));
  });
 })();
 const N_IDX=gi.length;

 const celdas=gEdificio(), N=celdas.length;
 const SP=[[],[],[],[]], SR=[[],[],[],[]];

 /* Cuatro estados, y la narración está en las diferencias entre ellos:
    0 · entero    · paneles pegados: la torre se lee como UN edificio
    1 · partido   · todos se separan de la fachada; se ve de qué está hecho
    2 · con dueño · misma forma; lo único que cambia es el COLOR
    3 · circulando· unos cuantos se intercambian, y doce salen a orbitar

    Que 2 y 3 conserven la silueta es deliberado: si el edificio se
    deshiciera al vender una parte, el dibujo diría lo contrario que el
    texto. La torre sigue en pie; lo que se mueve son los dueños. */
 const SEPARA=0.80;                 /* cuánto se despega cada panel */
 for(let i=0;i<N;i++){
  const c=celdas[i], p=c.p, r=c.r;
  SP[0].push(p[0],p[1],p[2]);                 SR[0].push(r[0],r[1],r[2]);
  /* Se separan hacia FUERA de su propia fachada, siguiendo su normal: si
     se separasen radialmente desde el centro, las esquinas se abrirían más
     que el resto y la silueta se deformaría. */
  const dx=Math.sin(r[1])*(r[0]===0?1:0), dz=Math.cos(r[1])*(r[0]===0?1:0);
  const dy=r[0]!==0?1:0;
  /* Todos se separan LO MISMO. Con separaciones distintas (0,55 a 1,45)
     parecía una explosión, y una explosión dice justo lo contrario que el
     texto: si las piezas fueran desiguales no serían participaciones.
     Queda un ±8 % de variación, lo justo para que no parezca un patrón
     estampado. */
  const s=SEPARA*(0.92+gHash(i,7)*0.16);
  SP[1].push(p[0]+dx*s,p[1]+dy*s,p[2]+dz*s);  SR[1].push(r[0],r[1],r[2]);
  SP[2].push(p[0]+dx*s,p[1]+dy*s,p[2]+dz*s);  SR[2].push(r[0],r[1],r[2]);
  SP[3].push(p[0]+dx*s,p[1]+dy*s,p[2]+dz*s);  SR[3].push(r[0],r[1],r[2]);
 }

 /* Quién cambia de manos. Los que se intercambian van en cadena —cada uno
    al sitio del siguiente— así que ningún hueco queda vacío. Y doce salen
    a orbitar la torre: son las participaciones que están en el mercado
    ahora mismo. Doce de 297 es un 4 %: se ven, y no desmontan nada. */
 const arco=new Float32Array(N);
 const mueven=[], orbitan=[];
 for(let i=0;i<N;i++){
  if(gHash(i,41)<0.045 && orbitan.length<12) orbitan.push(i);
  else if(gHash(i,31)<0.10) mueven.push(i);
 }
 for(let k=0;k<mueven.length;k++){
  const a=mueven[k], b=mueven[(k+1)%mueven.length];
  SP[3][a*3]=SP[2][b*3]; SP[3][a*3+1]=SP[2][b*3+1]; SP[3][a*3+2]=SP[2][b*3+2];
  SR[3][a*3+1]=SR[2][b*3+1]+(gHash(a,32)<0.5?1:-1)*Math.PI*2;
  arco[a]=1.6+gHash(a,33)*2.2;
 }
 orbitan.forEach((a,k)=>{
  const ang=k/orbitan.length*Math.PI*2, rad=8.5+gHash(a,34)*3.0;
  SP[3][a*3]  =Math.sin(ang)*rad;
  SP[3][a*3+1]=-8+gHash(a,35)*18;
  SP[3][a*3+2]=Math.cos(ang)*rad;
  SR[3][a*3]  =(gHash(a,36)-0.5)*1.1;
  SR[3][a*3+1]=ang+Math.PI;                 /* mirando hacia la torre */
  SR[3][a*3+2]=(gHash(a,37)-0.5)*0.9;
  arco[a]=2.2+gHash(a,38)*2.0;
 });

 const ST={P:SP.map(x=>new Float32Array(x)),R:SR.map(x=>new Float32Array(x))};
 const ANCHO=[4.2,5.4,5.4,11.5];
 /* La torre mide 27 unidades con la corona. El campo de visión vertical
    abarca 0,73·d, así que 40 la mete entera dejando ver el suelo y el
    reflejo por debajo. */
 const CAMD=[40,41,41,46];
 /* Nada de 0,075 en el primer paso. A cuatro grados la fachada se ve tan
    rasante que los paneles —que tienen 17 cm de canto— se tapan unos a
    otros y la torre parece un derrumbe. El ángulo bajo era heroico y
    también ilegible. */
 const CAMY=[0.17,0.19,0.21,0.14];
 const INDIV=[0,0.08,1,1];
 /* 0,97: ni se tocan ni se solapan, y las dos cosas importan.
    Solapados (1,15) son 353 losas gruesas metidas unas dentro de otras y
    se ven todas las intersecciones: la fachada queda como un empedrado.
    Tocándose justo (1,0) las caras laterales de dos paneles contiguos
    quedan coplanarias y pelean por la profundidad — el clásico
    z-fighting—, que es lo que llenaba la fachada de manchas claras y
    oscuras al azar. Con 0,97 queda una junta limpia de tres centésimas
    entre paneles: exactamente el despiece de un muro cortina. */
 const TAM=[0.97,0.86,0.86,0.86];

 const vao=gl.createVertexArray(); gl.bindVertexArray(vao);
 const mk=(loc,data,size,inst)=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);
  gl.bufferData(gl.ARRAY_BUFFER,data,inst?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);
  gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0);
  if(inst)gl.vertexAttribDivisor(loc,1);return b;};
 mk(0,new Float32Array(gp),3,0); mk(1,new Float32Array(gn),3,0);
 const bA=mk(2,ST.P[0],3,1),bB=mk(3,ST.P[0],3,1),rA=mk(4,ST.R[0],3,1),rB=mk(5,ST.R[0],3,1);
 /* El retardo va por ALTURA: la torre se despliega de abajo arriba, como
    se construye y como se mira. Todas a la vez sería un pestañeo.

    Ojo con este cálculo: `celdas` pasó de ser pares [x,z] a ser objetos
    {p,r} al cambiar el panal por el edificio, y mientras siguió leyendo
    `celdas[i][0]` metía NaN en el atributo. Un NaN aquí no rompe nada de
    forma visible — simplemente cada panel interpola por su cuenta y la
    fachada aparece desalineada al azar, que es de los fallos más difíciles
    de encontrar mirando. */
 let minY=Infinity, maxY=-Infinity;
 for(let i=0;i<N;i++){const y=celdas[i].p[1]; if(y<minY)minY=y; if(y>maxY)maxY=y;}
 const rangoY=Math.max(0.0001,maxY-minY);
 const meta=new Float32Array(N*4);
 for(let i=0;i<N;i++){
  meta[i*4]  =(celdas[i].p[1]-minY)/rangoY*0.78+gHash(i,11)*0.22;
  meta[i*4+1]=gHash(i,12);
  meta[i*4+2]=arco[i];
  /* Qué ventanas están encendidas. No es azar puro: se cruzan dos hashes,
     uno por planta y otro por panel, así que la luz sale a manchas —unas
     plantas más despiertas que otras— en vez de en un salpicado uniforme.
     Un edificio de noche nunca tiene las luces repartidas por igual, y esa
     irregularidad es justo lo que hace que parezca habitado.
     Las cornisas y la azotea nunca se encienden: no son ventanas. */
  const esVentana=celdas[i].r[0]===0;
  const planta=Math.round((celdas[i].p[1]-minY)/PISO);
  meta[i*4+3]= esVentana && (gHash(planta,61)*0.55+gHash(i,62)*0.45)<0.26 ? 1 : 0;
 }
 mk(6,meta,4,1);
 const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);
 gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(gi),gl.STATIC_DRAW);
 gl.bindVertexArray(null);

 const svao=gl.createVertexArray(); gl.bindVertexArray(svao);
 const sb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,sb);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,1,1,-1,-1,1,1,-1,1]),gl.STATIC_DRAW);
 gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
 gl.bindVertexArray(null);

 const U=(p,n)=>gl.getUniformLocation(p,n);
 const u1={proj:U(P1,'uProj'),view:U(P1,'uView'),mix:U(P1,'uMix'),size:U(P1,'uSize'),arco:U(P1,'uArco'),
  cam:U(P1,'uCam'),cA:U(P1,'uColA'),ind:U(P1,'uIndiv'),cerca:U(P1,'uCerca'),lejos:U(P1,'uLejos'),
  nieb:U(P1,'uNiebla'),modo:U(P1,'uModo'),suelo:U(P1,'uSuelo'),rsuelo:U(P1,'uRadioSuelo')};
 const u2={proj:U(P2,'uProj'),view:U(P2,'uView'),r:U(P2,'uR'),ancho:U(P2,'uAncho'),
  barr:U(P2,'uBarrido'),y:U(P2,'uY')};
 const u3={asp:U(P3,'uAsp'),fase:U(P3,'uFase')};
 const R_SUELO=30;

 let mixT=1, de=0, a=0;
 const lerpArr=(x,y,t)=>{const o=new Float32Array(x.length);
  for(let i=0;i<x.length;i++)o[i]=x[i]+(y[i]-x[i])*t; return o;};
 colocar=function(idx){
  if(idx===a && mixT>=1) return;
  const cp=mixT>=1?ST.P[a]:lerpArr(ST.P[de],ST.P[a],mixT);
  const cr=mixT>=1?ST.R[a]:lerpArr(ST.R[de],ST.R[a],mixT);
  gl.bindBuffer(gl.ARRAY_BUFFER,bA);gl.bufferSubData(gl.ARRAY_BUFFER,0,cp);
  gl.bindBuffer(gl.ARRAY_BUFFER,rA);gl.bufferSubData(gl.ARRAY_BUFFER,0,cr);
  gl.bindBuffer(gl.ARRAY_BUFFER,bB);gl.bufferSubData(gl.ARRAY_BUFFER,0,ST.P[idx]);
  gl.bindBuffer(gl.ARRAY_BUFFER,rB);gl.bufferSubData(gl.ARRAY_BUFFER,0,ST.R[idx]);
  de=a; a=idx; mixT=0;
 };

 /* el puntero orbita la cámara; en táctil se deja para desplazarse */
 let mx=0,my=0;
 const lento=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 host.addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse')return;
  const r=host.getBoundingClientRect();
  mx=(e.clientX-r.left)/r.width-.5; my=(e.clientY-r.top)/r.height-.5;});
 host.addEventListener('pointerleave',()=>{mx=0;my=0;});

 /* sólo se dibuja si la escena está en pantalla: no gasta batería de fondo */
 escenaVisible=true;
 if('IntersectionObserver' in window)
  new IntersectionObserver(e=>{escenaVisible=e[0].isIntersecting;},{threshold:.01}).observe(host);

 let ultimo=performance.now(), giro=0, barrido=0;
 function pintar(ahora){
  requestAnimationFrame(pintar);
  /* El delta se acota por arriba y por abajo. Sin el suelo en 0, un salto
     del reloj hacia atrás deja dt negativo, la interpolación retrocede y
     el explicador se congela sin recuperarse jamás. */
  const dt=Math.max(0,Math.min((ahora-ultimo)/1000,.05)); ultimo=ahora;
  if(!escenaVisible) return;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const w=Math.round(cv.clientWidth*dpr), h=Math.round(cv.clientHeight*dpr);
  if(w<2||h<2) return;
  if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}
  gl.viewport(0,0,w,h);
  if(mixT<1) mixT=Math.min(1,mixT+dt/1.45);
  if(!lento){giro+=dt*0.115; barrido-=dt*0.9;}

  const asp=w/h;
  /* Con una torre manda el ALTO, y el alto que abarca la cámara no
     depende de la proporción del lienzo: solo del campo de visión y de la
     distancia. Por eso aquí no hay que alejarse en pantalla estrecha —al
     revés que con el panal plano de antes, donde el ancho era el límite. */
  const ajuste=1;
  const az=giro+mx*0.95;
  const el=(CAMY[de]+(CAMY[a]-CAMY[de])*mixT)+my*0.28;
  const R=(CAMD[de]+(CAMD[a]-CAMD[de])*mixT)*ajuste;
  /* El punto de mira va por debajo del panal a propósito: así el objeto
     monta por encima del centro del cuadro y el suelo ocupa la parte de
     abajo. Mirando al centro exacto queda medio cuadro de cielo vacío. */
  const cam=[R*Math.cos(el)*Math.sin(az),R*Math.sin(el),R*Math.cos(el)*Math.cos(az)];
  const proj=mPersp(0.70,asp,0.1,140), view=mMirar(cam,[0,-0.6,0],[0,1,0]);

  gl.clearColor(0.033,0.031,0.029,1);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.disable(gl.CULL_FACE);

  /* 0 · HALO — el resplandor del fondo, antes que nada y sin profundidad */
  gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE,gl.ONE);
  gl.useProgram(P3); gl.bindVertexArray(svao);
  gl.uniform1f(u3.asp,asp); gl.uniform1f(u3.fase,0);
  gl.drawArrays(gl.TRIANGLES,0,6);

  gl.enable(gl.DEPTH_TEST);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);

  /* --- ajustes comunes de las piezas, para las tres pasadas --- */
  gl.useProgram(P1); gl.bindVertexArray(vao);
  gl.uniformMatrix4fv(u1.proj,false,proj); gl.uniformMatrix4fv(u1.view,false,view);
  gl.uniform1f(u1.mix,mixT);
  gl.uniform1f(u1.size,TAM[de]+(TAM[a]-TAM[de])*mixT);
  gl.uniform1f(u1.arco,(de===3||a===3)?1:0);
  gl.uniform3fv(u1.cam,cam);
  /* Piedra clara, no oro. Una torre de oro macizo pedía una interfaz
     dorada, y ese era justo el problema. En piedra caliza con las
     ventanas encendidas en cálido, el edificio se parece a un edificio
     de verdad de noche — y el salto a los colores de dueño es mucho más
     fuerte saliendo de un neutro que saliendo de un dorado. */
  gl.uniform3f(u1.cA,0.815,0.795,0.745);
  /* El reparto de la propiedad entra algo más tarde que el movimiento:
     primero se ve separarse, y entonces aparecen los dueños. */
  gl.uniform1f(u1.ind,INDIV[de]+(INDIV[a]-INDIV[de])*Math.min(1,Math.max(0,(mixT-.18)/.82)));
  gl.uniform1f(u1.cerca,30); gl.uniform1f(u1.lejos,72);
  gl.uniform3f(u1.nieb,0.033,0.031,0.029);
  gl.uniform1f(u1.suelo,SUELO_Y);
  gl.uniform1f(u1.rsuelo,R_SUELO);

  /* 1 · REFLEJO — la escena espejada bajo el suelo. Va primero porque
     todo lo demás se pinta encima. */
  gl.enable(gl.BLEND); gl.depthMask(true);
  gl.uniform1f(u1.modo,1);
  gl.drawElementsInstanced(gl.TRIANGLES,N_IDX,gl.UNSIGNED_SHORT,0,N);

  /* 2 · SUELO — el grafismo del radar, translúcido, por encima del
     reflejo. Sin escribir profundidad: no tiene que tapar nada. */
  gl.depthMask(false);
  gl.useProgram(P2); gl.bindVertexArray(svao);
  gl.uniformMatrix4fv(u2.proj,false,proj); gl.uniformMatrix4fv(u2.view,false,view);
  gl.uniform1f(u2.r,R_SUELO); gl.uniform1f(u2.y,SUELO_Y);
  gl.uniform1f(u2.ancho,ANCHO[de]+(ANCHO[a]-ANCHO[de])*mixT);
  gl.uniform1f(u2.barr,barrido);
  gl.drawArrays(gl.TRIANGLES,0,6);

  /* 3 · SOMBRAS — una por pieza, aplastada contra el suelo */
  gl.useProgram(P1); gl.bindVertexArray(vao);
  gl.uniform1f(u1.modo,2);
  gl.drawElementsInstanced(gl.TRIANGLES,N_IDX,gl.UNSIGNED_SHORT,0,N);

  /* 4 · LAS PIEZAS — opacas y escribiendo profundidad */
  gl.disable(gl.BLEND); gl.depthMask(true);
  gl.uniform1f(u1.modo,0);
  gl.drawElementsInstanced(gl.TRIANGLES,N_IDX,gl.UNSIGNED_SHORT,0,N);

  /* 5 · VIÑETA — a pantalla completa, lo último de todo */
  gl.enable(gl.BLEND); gl.depthMask(false); gl.disable(gl.DEPTH_TEST);
  gl.useProgram(P3); gl.bindVertexArray(svao);
  gl.uniform1f(u3.asp,asp); gl.uniform1f(u3.fase,1);
  gl.drawArrays(gl.TRIANGLES,0,6);
  gl.depthMask(true);
 }
 requestAnimationFrame(pintar);

 cv.addEventListener('webglcontextlost',e=>{e.preventDefault();},false);
 /* Asa de inspección. `pinta` existe porque las capturas de pantalla no
    componen fotogramas: sin poder pedir uno a mano no hay forma de
    comprobar que el dibujo sale, y ya perdimos una tarde persiguiendo un
    fallo inexistente por fiarnos de una captura en negro. */
 window.__gl3d={N,estado:()=>a,mix:()=>mixT,visible:()=>escenaVisible,pinta:t=>pintar(t)};
})();

/* ---- el paso a paso ---- */
const ROTULOS=["1 · Entero","2 · Partido en 3.000","3 · Cada trozo, un dueño","4 · Cambian de dueño"];
const VENTAJAS_POR_PASO=[[],[0],[0,1],[0,1,2,3]];
let paso=0, reloj=null;
const menos=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function irPaso(i,manual){
  if(!Number.isInteger(i)||i<0||i>=ROTULOS.length)return;
  paso=i;
  colocar(i);
  const rot=document.getElementById('exRot');
  if(rot) rot.textContent=ROTULOS[i];
  const anterior=document.getElementById('exAnterior'),siguiente=document.getElementById('exSiguiente');
  const progreso=document.getElementById('exProgreso'),final=document.getElementById('exFinal');
  if(anterior)anterior.disabled=i===0;
  if(siguiente)siguiente.disabled=i===ROTULOS.length-1;
  if(progreso)progreso.textContent=`Paso ${i+1} de ${ROTULOS.length}`;
  if(final)final.hidden=i!==ROTULOS.length-1;
  document.querySelectorAll('.paso').forEach((d,k)=>{
   const activa=k===i;d.classList.toggle('on',activa);d.setAttribute('aria-pressed',activa?'true':'false');
  });
  document.querySelectorAll('.ventaja').forEach((b,k)=>b.classList.toggle('on',VENTAJAS_POR_PASO[i].indexOf(k)>-1));
  /* La animación automática permanece silenciosa. El sonido solo responde
     cuando la persona elige un paso de forma deliberada. */
  if(manual&&escenaVisible) Sonido.paso(i);
  if(manual && reloj){ clearInterval(reloj); reloj=null;
    const l=document.getElementById('exSteps'); if(l) l.classList.remove('auto'); }
}
function reiniciarPasosAutomaticos(){
  const l=document.getElementById('exSteps'); if(!l) return;
  if(reloj){clearInterval(reloj);reloj=null;}
  l.classList.remove('auto');
  irPaso(0,false);
}
reiniciarPasosAutomaticos();
document.getElementById('exAnterior')?.addEventListener('click',()=>irPaso(paso-1,true));
document.getElementById('exSiguiente')?.addEventListener('click',()=>irPaso(paso+1,true));
document.getElementById('exVolverAcademy')?.addEventListener('click',()=>{
 if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage('rwadar:tutorial-finalizado');return;}
 if(typeof Movil!=='undefined'&&Movil.volverAcademy&&Movil.volverAcademy())return;
 document.getElementById('academyTit')?.scrollIntoView({block:'start'});
});
document.getElementById('exPrimeraLeccion')?.addEventListener('click',event=>{
 if(window.ReactNativeWebView){event.preventDefault();window.ReactNativeWebView.postMessage('rwadar:tutorial-primera-leccion');}
});

/* =================================================================
   LA CALCULADORA DEL EXPLICADOR
   -----------------------------------------------------------------
   El ejemplo de partida sigue siendo de números redondos: un local de
   300.000 € partido en trozos de 100 €. Desde el 11/11/2026 el valor del
   activo y el precio de cada trozo se pueden cambiar, y la cuenta sale del
   motor de «Calcula tus números» (rwadar-movil/lib/calculadora.js, copiado
   en calculadora-modelo-20261111.js), el mismo de Inicio y de la app: lo
   que cobras es tu parte del activo por lo que renta el activo entero.
   Los textos con cifras se escriben ya en el idioma elegido (translate="no").
   ================================================================= */
(function calculadora(){
 const $=id=>document.getElementById(id);
 const bEur=$('calcEuros'), bRent=$('calcRent'), cValor=$('calcValor'), cPrecio=$('calcPrecio');
 const M=window.RWAdarCalculadoraModelo;
 if(!bEur||!bRent||!$('tRent')||!M) return;
 const lengua=()=>window.RWAdarIdioma&&RWAdarIdioma.obtenerIdioma&&RWAdarIdioma.obtenerIdioma()==='en'?'en':'es';
 const pon=(id,v)=>{const el=$(id); if(el){el.textContent=v;el.setAttribute('translate','no');}};
 /* Una línea de la cuenta: trozos de texto y cifras en negrita. */
 const linea=(id,partes)=>{const el=$(id);if(!el)return;el.setAttribute('translate','no');
  el.replaceChildren(...partes.map((x,i)=>{if(i%2===0)return document.createTextNode(x);const b=document.createElement('b');b.textContent=x;return b;}));};
 /* Los dos importes del activo: se aceptan «300.000», «300000» o «1,5»; un
    error se dice junto al campo y la cuenta se queda con el último válido. */
 let valido={valorActivo:M.EJEMPLO_EXPLICADOR.valorActivo,precioParticipacion:M.EJEMPLO_EXPLICADOR.precioParticipacion};
 function errorCampo(campo,input,error){
  const caja=$(input.id+'Error');if(!caja)return;
  if(error){input.setAttribute('aria-invalid','true');caja.textContent=M.mensajeError(error,lengua());caja.setAttribute('translate','no');caja.hidden=false;}
  else{input.removeAttribute('aria-invalid');caja.textContent='';caja.hidden=true;}
 }
 function actualiza(){
  const L=lengua(),e=parseInt(bEur.value,10)||2500,r=(parseInt(bRent.value,10)||60)/10;   /* la barra va en décimas */
  const entrada={inversion:e,rentabilidad:r,anios:1,modo:'cobrar',comisionAnual:0,comisionEntrada:0,impuestos:0,
   valorActivo:cValor?cValor.value:valido.valorActivo,precioParticipacion:cPrecio?cPrecio.value:valido.precioParticipacion};
  const v=M.validarEntradas(entrada);
  if(cValor)errorCampo('valorActivo',cValor,v.errores.valorActivo);
  if(cPrecio)errorCampo('precioParticipacion',cPrecio,v.errores.precioParticipacion);
  if(v.ok)valido={valorActivo:v.valores.valorActivo,precioParticipacion:v.valores.precioParticipacion};
  /* Con un dato mal escrito, la cuenta sigue con los últimos importes válidos
     (y si con ellos tampoco cuadra, con el trozo más pequeño que se pueda). */
  let res=M.calcular(v.ok?v:{...entrada,...valido});
  if(!res)res=M.calcular({...entrada,valorActivo:M.EJEMPLO_EXPLICADOR.valorActivo,precioParticipacion:M.EJEMPLO_EXPLICADOR.precioParticipacion});
  const V=res.valorActivo,p=res.precioParticipacion,n=res.participaciones,total=res.participacionesTotales,parte=res.porcentajeActivo;
  const eur=x=>M.euros(x,L),pct=(x,d)=>M.porcentaje(x,L,d),num=x=>M.numero(x,L,0);
  const exacto=Math.abs(total-Math.round(total))<1e-9,trozos=num(exacto?total:Math.floor(total+1e-9));
  /* La rentabilidad recibida sale de dividir lo que cobras entre lo que
     pusiste. Con trozos enteros da exactamente la del local, y esa
     coincidencia es justo lo que hay que enseñar. */
  const tuyo=res.primerAnio.bruto,tuRent=res.capital>0?tuyo/res.capital*100:0;
  pon('calcTitulo',M.tituloExplicador({valorActivo:V,precioParticipacion:p},L));
  pon('calcEuros_v',eur(e));
  pon('calcRent_v',L==='en'?pct(r,1)+' a year':pct(r,1)+' al año');
  bEur.setAttribute('aria-valuetext',eur(e));
  bRent.setAttribute('aria-valuetext',L==='en'?pct(r,1)+' a year':pct(r,1)+' al año');
  pon('tRent',pct(tuRent,1));
  pon('tAnual',M.euros(tuyo,L,tuyo<100&&tuyo%1?2:0));
  pon('tMes',M.euros(tuyo/12,L,2));
  const unid=x=>L==='en'?(x===1?' unit':' units'):(x===1?' trozo':' trozos');
  linea('c1op',L==='en'?['You invest ',eur(e),' and each unit costs ',eur(p)]:['Pones ',eur(e),' y cada trozo cuesta ',eur(p)]);
  pon('c1b',num(n)+unid(n)+(res.sobra>0.005?(L==='en'?' ('+eur(res.sobra)+' left over)':' (sobran '+eur(res.sobra)+')'):''));
  linea('c2op',L==='en'?['You hold ',num(n),' of the property’s ',(exacto?'':'about ')+trozos,' units']:['Tienes ',num(n),' de los ',(exacto?'':'unos ')+trozos,' trozos del local']);
  pon('c2b',L==='en'?'You hold '+pct(parte,2):pct(parte,2)+' es tuyo');
  linea('c3op',L==='en'?['The property earns ',pct(r,1),' on '+eur(V)]:['El local renta un ',pct(r,1),' sobre '+eur(V)]);
  pon('c3b',L==='en'?eur(res.rentaActivo)+' a year':eur(res.rentaActivo)+' al año');
  linea('c4op',L==='en'?['Your ',pct(parte,2),' of that '+eur(res.rentaActivo)]:['Tu ',pct(parte,2),' de esos '+eur(res.rentaActivo)]);
  pon('c4b',L==='en'?M.euros(tuyo,L,tuyo<100&&tuyo%1?2:0)+' a year':M.euros(tuyo,L,tuyo<100&&tuyo%1?2:0)+' al año');
 }

 /* El tic del deslizador, como el de una rueda dentada: suena UNA vez por
    escalón, no en cada píxel del arrastre. Sin esta guarda es una
    ametralladora; con ella, engancha. */
 let ultimo=null;
 const tic=b=>{ if(b.value!==ultimo){ ultimo=b.value; Sonido.tic(); } };
 [bEur,bRent].forEach(b=>{
  b.addEventListener('input',()=>{actualiza(); tic(b);});
 });
 /* Los importes del activo: cuenta al escribir y formato al salir («300000» → «300.000»). */
 [[cValor,'valorActivo'],[cPrecio,'precioParticipacion']].forEach(([c,campo])=>{
  if(!c)return;
  c.addEventListener('input',actualiza);
  c.addEventListener('change',()=>{const l=M.leerNumero(c.value);if(l.ok&&!c.hasAttribute('aria-invalid'))c.value=M.valorCampo(l.valor,lengua(),campo);actualiza();});
 });
 /* «Calcula con tus números →»: lleva al bloque de Inicio. Dentro de la app
    (el explicador va en un WebView), solo si la app sabe abrirlo: la app
    nueva lo avisa con window.RWAdarCalculadoraApp (o data-rwadar-calculadora-app
    en <html>) antes de cargar la página, y otra vez al terminar de cargarla. */
 const ir=$('calcIrInicio');
 if(ir){
  const appSabe=()=>window.RWAdarCalculadoraApp===true||document.documentElement.hasAttribute('data-rwadar-calculadora-app');
  if(window.ReactNativeWebView&&!appSabe()){ir.hidden=true;window.addEventListener('load',()=>{if(appSabe())ir.hidden=false;},{once:true});}
  ir.addEventListener('click',ev=>{
   if(window.ReactNativeWebView){ev.preventDefault();window.ReactNativeWebView.postMessage('rwadar:tutorial-calculadora');return;}
   const destino=$('calculadora');if(!destino)return;
   ev.preventDefault();
   let hecho=false;
   const llevar=()=>{if(hecho)return;hecho=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{
    destino.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    const campo=$('ciInversion');if(campo)campo.focus({preventScroll:true});
   }));};
   /* En el móvil, Inicio es una pestaña y el explicador va dentro de Academy:
      al cerrarla, la web vuelve arriba (y atrás en el historial). Se baja al
      bloque cuando eso ha terminado. */
   const movil=typeof Movil!=='undefined'&&Movil.cambiar&&document.documentElement.classList.contains('movil-ui');
   if(movil){
    window.addEventListener('popstate',()=>setTimeout(llevar,80),{once:true});
    try{Movil.cambiar('inicio',{arriba:false});}catch(e){}
    setTimeout(llevar,450);
   }else llevar();
  });
 }
 try{if(window.RWAdarIdioma&&RWAdarIdioma.suscribirIdioma)RWAdarIdioma.suscribirIdioma(()=>{
  [[cValor,'valorActivo'],[cPrecio,'precioParticipacion']].forEach(([c,campo])=>{if(!c)return;const l=M.leerNumero(c.value);if(l.ok)c.value=M.valorCampo(l.valor,lengua(),campo);});
  actualiza();});}catch(e){}
 actualiza();
})();

/* =================================================================
   RADAR
   ================================================================= */
const initials=n=>n.replace(/[^A-Za-zÀ-ÿ ]/g,'').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
/* Todo lo que llega de la base se trata como texto, aunque sea contenido
   editorial. Así una fila alterada no puede convertirse en HTML al pintar
   el radar, las fichas, el comparador o las fuentes. */
const escHtml=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>
 ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const urlHttps=s=>{const v=String(s||'').trim();
 if(!/^https:\/\/[^\s<>"'\\]+$/i.test(v))return'';
 try{if(typeof URL==='function'){const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}return v}catch(e){return''}};
/* Una consulta técnica (una API o una respuesta en JSON) sirve para comprobar
   un dato, pero no es una página para personas: abrirla da un error o datos en
   bruto. No se enlaza: se lee «Consulta técnica · fecha» (QA 04/11/2026,
   n.º 12). La misma regla está en rwadar-fichas.js y en ficha-pagina. */
const consultaTecnica=s=>{try{const u=new URL(String(s||''));
 return /(?:^|\/)api(?:\/|$)/i.test(u.pathname)||/\.json$/i.test(u.pathname)||/(?:^|&)(?:format|output)=json(?:&|$)/i.test(u.search.slice(1))}catch(e){return false}};
function desenlazarConsultasTecnicas(raiz,fechaDe){
 if(!raiz||typeof raiz.querySelectorAll!=='function'||typeof document==='undefined'||typeof document.createElement!=='function')return;
 raiz.querySelectorAll('a[href]').forEach(a=>{
  const url=a.getAttribute('href');if(!consultaTecnica(url))return;
  /* Se conserva el título; no «Ver fuente», «Fuente ↗», la flecha ni la fecha ISO. */
  const titulo=String(a.textContent||'').replace(/\s*↗\s*$/,'').replace(/\s·\s\d{4}-\d{2}-\d{2}$/,'').trim()
   .replace(/^(?:Abrir fuente|Ver fuente|Fuente)(?:\s·\s|$)/,'').trim();
  /* Si justo detrás ya pone «consultada el …», no se repite la fecha. */
  const fechada=a.nextSibling&&/^\s*·?\s*consultada el/i.test(a.nextSibling.textContent||'');
  const f=fechada?'':(String(a.textContent||'').match(/(\d{4}-\d{2}-\d{2})\s*↗?\s*$/)||[])[1]||(fechaDe&&fechaDe(url))||'';
  const s=document.createElement('span');s.className='consulta-tecnica';
  if(titulo)s.appendChild(document.createTextNode(titulo+' · '));
  const r=document.createElement('span');r.textContent='Consulta técnica';s.appendChild(r);
  if(f)s.appendChild(document.createTextNode(' · '+fechaES(f)));
  a.replaceWith(s);
 });
}
/* Las fechas salen del dato, nunca escritas a mano: una fecha de revisión
   que se queda vieja sin que nadie lo note destruye la credibilidad de un
   registro que se vende precisamente por estar al día. */
const fCorta=s=>{if(!s)return'';const[a,m,d]=String(s).split('-');return `${d}/${m}/${a.slice(2)}`};
const fLarga=s=>{if(!s)return'';const[a,m,d]=String(s).split('-');return `${d}/${m}/${a}`};
const revisionVisible=p=>p&&p.verificacionLocal?p.verificacionLocal.verificadoEl:p&&p.ver;
const accesoVisible=p=>p&&p.verificacionLocal
 ?etiquetaVerificacionLocal(p.verificacionLocal.acceso.estado):p&&p.acceso;
const accesoClasificado=p=>p&&p.verificacionLocal&&p.verificacionLocal.acceso.estado==='no_verificable'
 ?'':p&&p.acceso;
const ultimaRevision=()=>{const ds=P.map(revisionVisible).filter(Boolean).sort();return ds.length?fLarga(ds[ds.length-1]):''};
function textoBusquedaPlataforma(p){
 const v=p&&p.verificacionLocal;
 const verificado=v?[
  v.estadoOperativo.estado,v.estadoOperativo.detalle,
  v.licenciaRegistro.estado,v.licenciaRegistro.detalle,
  v.acceso.estado,v.acceso.detalle,
  ...v.alertasCriticas.flatMap(alerta=>[alerta.codigo,alerta.detalle])
 ]:[p.nota,p.aval,p.acceso];
 return [p.n,p.cat,p.reg,p.cadenas,...verificado].filter(Boolean).join(' ').toLowerCase();
}
function resumenVerificacionLocalHtml(verificacion){
 if(!verificacion)return'';
 const campos=[['Actividad',verificacion.estadoOperativo],
  ['Licencia o registro',verificacion.licenciaRegistro],['Acceso',verificacion.acceso]];
 return '<div class="verificacion-local-resumen" aria-label="Revisión editorial '+escHtml(fechaES(verificacion.verificadoEl))+'">'+
  '<div class="verificacion-local-fecha">Revisión editorial · '+escHtml(fechaES(verificacion.verificadoEl))+'</div><div class="verificacion-local-estados">'+
  campos.map(([nombre,campo])=>'<span class="verificacion-local-estado '+
   ((campo.estado==='no_verificable'||campo.estado==='sin_registro_declarado')?'atencion':'')+'"><b>'+escHtml(nombre)+'</b>'+escHtml(etiquetaVerificacionLocal(campo.estado))+'</span>').join('')+
  '</div>'+verificacion.alertasCriticas.map(alerta=>'<p class="verificacion-local-alerta"><b>Importante</b>'+escHtml(alerta.detalle)+'</p>').join('')+'</div>';
}
function detalleVerificacionLocalHtml(verificacion,resumen=''){
 /* Si el detalle repite el resumen de la ficha, no se vuelve a escribir. */
 const repite=t=>!!textoLocal(resumen)&&textoLocal(t)===textoLocal(resumen);
 if(!verificacion)return'';
 const campos=[['Actividad',verificacion.estadoOperativo],
  ['Licencia o registro',verificacion.licenciaRegistro],['Acceso',verificacion.acceso]];
 return '<section class="pn-seccion pn-verificacion-local" aria-labelledby="dwVerificacionLocalTit">'+
  '<div class="pn-verificacion-local-cab"><h4 id="dwVerificacionLocalTit">Revisión editorial</h4><time datetime="'+
  escHtml(verificacion.verificadoEl)+'">'+escHtml(fechaES(verificacion.verificadoEl))+'</time></div><div class="pn-verificacion-local-campos">'+
  campos.map(([nombre,campo])=>'<article class="pn-verificacion-local-campo '+
   ((campo.estado==='no_verificable'||campo.estado==='sin_registro_declarado')?'atencion':'')+'"><div><b>'+escHtml(nombre)+'</b><span>'+escHtml(etiquetaVerificacionLocal(campo.estado))+'</span></div>'+(repite(campo.detalle)?'':'<p>'+escHtml(campo.detalle)+'</p>')+'</article>').join('')+
  '</div><div class="pn-verificacion-local-alertas"><h5>Avisos importantes</h5><ul>'+
  verificacion.alertasCriticas.map(alerta=>'<li>'+escHtml(alerta.detalle)+'</li>').join('')+
  '</ul></div>'+fuentesVerificacionHtml(verificacion)+'<p class="pn-nota">Que una plataforma tenga registro, documentos o una web que funciona no significa que esté avalada, que tenga licencia para todo ni que se pueda contratar desde España.</p></section>';
}
function fuentesVerificacionHtml(verificacion){
 const fuentes=[...new Map([
  ...['estadoOperativo','licenciaRegistro','acceso'].flatMap(c=>verificacion[c]?.fuentes||[]),
  ...(verificacion.alertasCriticas||[]).flatMap(a=>a.fuentes||[])
 ].filter(f=>f&&urlHttps(f.url)).map(f=>[f.url,f])).values()];
 if(!fuentes.length)return'';
 return '<div class="fuentes"><span class="fuentes-t">Fuentes consultadas</span>'+fuentes.map(f=>
  '<a href="'+escHtml(urlHttps(f.url))+'" target="_blank" rel="noopener nofollow">'+escHtml(f.titulo||f.url)+
  (f.consultadaEl?' · '+escHtml(fechaES(f.consultadaEl)):'')+' ↗</a>').join('')+'</div>';
}
const colOf=p=>(CATMETA[p.cat]||{c:'#7C8699'}).c;
const catClase=p=>' cat-'+Math.max(0,Object.keys(CATMETA).indexOf(p.cat));
const aplicaCat=(el,p)=>{if(!el)return;for(let i=0;i<6;i++)el.classList.remove('cat-'+i);el.classList.add(catClase(p).trim())};
const siglaEl=(p,cls='sigla')=>`<span class="${escHtml(cls)} ${catClase(p)}">${escHtml(initials(String(p.n||'')))}</span>`;
const okSVG=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3FD69B" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4.5 4.5L19 7"/></svg>`;
const escudoSVG=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"><path d="M12 3l7.5 3v6c0 4.4-3 7.8-7.5 9-4.5-1.2-7.5-4.6-7.5-9V6z"/><path d="M9 12l2.2 2.2L15.5 10" stroke-linecap="round"/></svg>`;

/* =================================================================
   EL RADAR DE PORTADA
   -----------------------------------------------------------------
   El registro entero, dibujado como lo que dice ser. No es un adorno:
   sale de la misma lista `P` que las fichas, se actualiza cuando la base
   de datos cambia y cada punto abre su ficha.

   Dónde cae cada plataforma:
     · el SECTOR (ángulo) es el tipo de activo — seis, uno por categoría;
     · el RADIO es a quién deja entrar. Las abiertas a cualquiera caen
       cerca del centro, las que solo admiten institucionales quedan en
       el borde. Así "lo que puedo tocar yo" se lee de un vistazo, que es
       la pregunta con la que llega casi todo el que entra.
   ================================================================= */
const RADIO_ACCESO={"Minorista":0.40,"Acreditado":0.60,"Empresas":0.76,"Institucional":0.90};
const VUELTA=8;   /* segundos que tarda el barrido en dar la vuelta */

/* Dónde cae cada plataforma en el radar. La comparten el radar de Buscar
   y la portada de Inicio, para que los dos dibujen exactamente lo mismo. */
function puntosRadar(CX,CY,RMAX){
 const cats=Object.keys(CATMETA);
 const pol=(ang,rad)=>[CX+Math.cos(ang*Math.PI/180)*rad, CY+Math.sin(ang*Math.PI/180)*rad];
 return P.map((p,i)=>{
  const ci=Math.max(0,cats.indexOf(p.cat));
  const n=P.filter(x=>x.cat===p.cat).length;
  const k=P.filter(x=>x.cat===p.cat).indexOf(p);
  /* Repartidas dentro de su sector, y separadas TAMBIÉN en radio.
     Repartirlas solo en ángulo no bastaba: dos plataformas de la misma
     categoría y el mismo tipo de acceso caen en el mismo anillo y se
     tocaban.

     Estos tres números no son a ojo. Se buscaron probando el espacio
     entero y midiendo la distancia mínima entre puntos, con dos límites
     que no se pueden cruzar: la apertura no puede pasar de 56° o algún
     punto se sale de su sector y parece de otra categoría, y el escalón
     no puede pasar de 0,12 o invade el anillo de al lado y se pierde la
     lectura de "distancia = a quién deja entrar". Dentro de eso, el mejor
     reparto deja 11,2 unidades entre los dos puntos más juntos, frente a
     las 9,4 de antes. Y el azar sobra: jitter 0 gana a cualquier jitter,
     porque desordena sin separar. */
  const ang=-90+ci*60+(((k+0.5)/Math.max(n,1))-0.5)*56;
  /* Un acceso que el overlay actual no pudo confirmar no conserva en el
     dibujo la posición histórica de «Minorista». Se lleva al perímetro,
     fuera de los cuatro anillos con significado, para no codificar como
     hecho visual precisamente lo que la revisión deja abierto. */
  const accesoRadar=p.verificacionLocal&&p.verificacionLocal.acceso.estado==='no_verificable'
   ?'__no_verificable':p.acceso;
  const base=accesoRadar==='__no_verificable'?0.98:
   (RADIO_ACCESO[accesoRadar]!=null?RADIO_ACCESO[accesoRadar]:0.7);
  const mismos=P.filter(x=>x.cat===p.cat&&(
   x.verificacionLocal&&x.verificacionLocal.acceso.estado==='no_verificable'
    ?'__no_verificable':x.acceso)===accesoRadar);
  const kk=mismos.indexOf(p);
  const escalon=mismos.length>1 ? ((kk/(mismos.length-1))-0.5)*0.115 : 0;
  /* Reservamos el radio del halo/anillo seleccionado y su margen. El
     escalón del acceso sin verificar nunca puede empujar un punto fuera. */
  const RADIO_VISUAL_MAX=12,MARGEN_BORDE=2;
  const rad=Math.max(0,Math.min(RMAX-RADIO_VISUAL_MAX-MARGEN_BORDE,RMAX*(base+escalon)));
  const [x,y]=pol(ang,rad);
  const col=colOf(p);
  return {p,i,x,y,ang,col};
 });
}

function pintarRadar(){
 const svg=document.getElementById('radarHero');
 if(!svg) return;
 /* RMAX=140, no 168: los rótulos van FUERA del círculo y con 168 el de la
    izquierda se salía del lienzo y aparecía cortado. */
 const CX=200, CY=200, RMAX=140;
 const cats=Object.keys(CATMETA);
 /* Los mismos nombres cortos que los chips y que Inicio (catCorta). */
 const pol=(ang,rad)=>[CX+Math.cos(ang*Math.PI/180)*rad, CY+Math.sin(ang*Math.PI/180)*rad];

 let s='';
 /* Anillos, uno por nivel de acceso. Sin rótulo dentro: los cuatro nombres
    caían justo encima de los puntos del sector de arriba y no se leía ni
    una cosa ni la otra. La escala se explica en una línea debajo del
    dibujo, que además se lee sin tener que buscarla. */
 [0.40,0.60,0.76,0.90].forEach(f=>{
  s+=`<circle class="radar-anillo" cx="${CX}" cy="${CY}" r="${(RMAX*f).toFixed(1)}"/>`;
 });
 s+=`<circle class="radar-borde" cx="${CX}" cy="${CY}" r="${RMAX}"/>`;

 /* Marcas de grado en el borde. Puro oficio: no informan de nada, pero sin
    ellas el círculo parece un gráfico y con ellas parece un aparato.
    36 y no 72: con una cada cinco grados el borde se convertía en una
    línea gruesa y sucia en vez de en una escala. */
 for(let g=0;g<36;g++){
  const a=g*10, largo=(g%3===0)?7:3.5;
  const [x1,y1]=pol(a,RMAX), [x2,y2]=pol(a,RMAX+largo);
  s+=`<line class="radar-tick${g%6===0?' fuerte':''}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
 }

 /* Los seis sectores. El rótulo es un botón: filtra el radar de abajo y
    baja hasta él. Convierte el dibujo en un mando de navegación en vez
    de en una lámina que solo se mira. */
 cats.forEach((c,i)=>{
  const a=-90+i*60-30;
  const [x,y]=pol(a,RMAX);
  s+=`<line class="radar-sector" x1="${CX}" y1="${CY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
  /* Arriba y abajo, centrado; a los lados, pegado por fuera del aro, para
     que «Materias primas» e «Infraestructura» quepan enteros. */
  const lado=i%3===0?0:i<3?1:-1,[mx,ty]=pol(-90+i*60,RMAX+19);
  const tx=lado?CX+lado*(Math.sqrt(Math.max(0,(RMAX+12)**2-(ty-CY)**2))+4):mx,ancla=lado>0?'start':lado<0?'end':'middle';
  const zx=lado>0?tx-4:lado<0?tx-100:tx-48,largo=catCorta(c).length>9&&lado;
  s+=`<g class="radar-etg" tabindex="0" role="button" aria-label="Ver solo ${escHtml(c)} en el radar"`
   +` data-filtra="${escHtml(c)}">`
   /* El rótulo va del color de su categoría, y con eso el radar gana la
      leyenda que le faltaba: se ve de un vistazo qué color es cada tipo
      de activo, sin una tabla aparte. Va en `style` y no en `fill`
      porque un atributo de presentación pierde contra la clase CSS. */
   /* 66 de alto (44 px aun a 360, donde el radar se dibuja a ~0,67):
      lo que crece va hacia fuera del aro, para no tapar los puntos. */
   +`<rect class="radar-et-zona" x="${zx.toFixed(1)}" y="${(ty-22-(ty<CY?22:0)).toFixed(1)}" width="${lado?104:96}" height="66" rx="13" fill="transparent"/>`
   +`<text class="radar-et${largo?' radar-et-largo':''}" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${ancla}" dominant-baseline="middle" fill="${CATMETA[c].c}">${escHtml(catCorta(c))}</text></g>`;
 });

 /* El barrido: una cola larga que se apaga, no una porción de tarta. Un
    radar deja estela de fósforo; el borde duro delataba el truco. */
 s+=`<g class="radar-barrido">`
   +`<path d="M${CX} ${CY} L${CX+RMAX} ${CY} A${RMAX} ${RMAX} 0 0 0 ${(CX+RMAX*Math.cos(-88*Math.PI/180)).toFixed(1)} ${(CY+RMAX*Math.sin(-88*Math.PI/180)).toFixed(1)} Z" fill="url(#gBarrido)"/>`
   +`<line x1="${CX}" y1="${CY}" x2="${CX+RMAX}" y2="${CY}" stroke="#25E39A" stroke-width="1.3" opacity=".75"/></g>`;
 s+=`<circle class="radar-centro" cx="${CX}" cy="${CY}" r="2.6"/>`;

 /* y los puntos: uno por plataforma */
 puntosRadar(CX,CY,RMAX).forEach(({p,i,x,y,col})=>{
  s+=`<g class="blip" tabindex="0" role="button" data-cat="${escHtml(p.cat)}" data-i="${i}"`
   +` data-x="${x.toFixed(1)}" data-y="${y.toFixed(1)}"`
   +` aria-label="${escHtml(p.n)}. ${escHtml(p.cat)}. Estado de acceso: ${escHtml(accesoVisible(p))}. Abrir ficha.">`
   +`<title>${escHtml(p.n)} · ${escHtml(p.cat)} · acceso: ${escHtml(accesoVisible(p))}</title>`
   +`<circle class="halo" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="${col}"/>`
   +`<circle class="anillo" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="none" stroke="${col}"/>`
   /* el borde oscuro separa dos puntos que se rocen: sin él, dos colores
      contiguos se funden en una mancha */
   +`<circle class="punto" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.6" fill="${col}" stroke="#0B0A0A" stroke-width="1.4"/>`
   +`<circle class="zona" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="22" fill="transparent" pointer-events="none"/>`
   +`</g>`;
 });
 svg.innerHTML=`<defs><radialGradient id="gBarrido" cx="0" cy="0.5" r="1">`
  +`<stop offset="0" stop-color="#25E39A" stop-opacity=".26"/>`
  +`<stop offset=".55" stop-color="#25E39A" stop-opacity=".07"/>`
  +`<stop offset="1" stop-color="#25E39A" stop-opacity="0"/></radialGradient></defs>`+s;
}

/* La lectura: qué plataforma es el punto que tienes debajo del ratón o
   enfocado con el tabulador. Va por delegación en el contenedor porque el
   SVG se vuelve a pintar entero cuando cambia la base de datos. */
(function radarInteractivo(){
 const svg=document.getElementById('radarHero');
 const caja=document.getElementById('radarLee');
 if(!svg||!caja) return;
 const vacio=caja.querySelector('.rl-vacio'), dato=caja.querySelector('.rl-dato');
 const $=id=>document.getElementById(id);

 function lee(i){
  const p=P[i]; if(!p) return;
  caja.classList.add('viva');
  aplicaCat(caja,p);
  vacio.hidden=true; dato.hidden=false;
  aplicaCat($('rlPunto'),p);
  $('rlNom').textContent=p.n;
  $('rlMeta').textContent=p.cat+' · acceso: '+accesoVisible(p)+' · '+p.reg;
 }
 function limpia(){
  caja.classList.remove('viva');
  vacio.hidden=false; dato.hidden=true;
 }
 const deEvento=e=>{const g=e.target.closest?e.target.closest('.blip'):null;
  return g?parseInt(g.dataset.i,10):null;};
 function masCercano(e){
  const matriz=svg.getScreenCTM&&svg.getScreenCTM();
  if(!matriz||!svg.createSVGPoint)return null;
  let punto;
  try{
   punto=svg.createSVGPoint();punto.x=e.clientX;punto.y=e.clientY;
   punto=punto.matrixTransform(matriz.inverse());
  }catch{return null;}
  /* Diana de 22 px de radio en pantalla (44 px de diámetro) aunque el radar
     se dibuje más pequeño; gana el punto más cercano. */
  const escala=Math.abs(matriz.a)||1,radio=Math.max(22,22/escala);
  let mejor=null,distancia=radio*radio;
  svg.querySelectorAll('.blip').forEach(g=>{
   const dx=punto.x-Number(g.dataset.x),dy=punto.y-Number(g.dataset.y),d=dx*dx+dy*dy;
   if(Number.isFinite(d)&&d<=distancia){distancia=d;mejor=parseInt(g.dataset.i,10);}
  });
  return Number.isInteger(mejor)?mejor:null;
 }

 svg.addEventListener('pointermove',e=>{const i=masCercano(e);i!=null?lee(i):limpia();});
 svg.addEventListener('pointerleave',limpia);
 svg.addEventListener('focusin',e=>{const i=deEvento(e); if(i!=null) lee(i);});
 svg.addEventListener('focusout',limpia);
 svg.addEventListener('click',e=>{
  const et=e.target.closest?e.target.closest('.radar-etg'):null;
  if(et)return filtraDesdeRadar(et.dataset.filtra);
  const i=masCercano(e);if(i!=null)openDrawer(i);
 });
 svg.addEventListener('keydown',e=>{
  const blip=e.target.closest?e.target.closest('.blip'):null;
  if(blip&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openDrawer(parseInt(blip.dataset.i,10));return;}
  const et=e.target.closest?e.target.closest('.radar-etg'):null;
  if(et&&(e.key==='Enter'||e.key===' ')){e.preventDefault();filtraDesdeRadar(et.dataset.filtra);}
 });
})();

/* Pulsar el nombre de un sector filtra la lista de abajo y baja hasta
   ella: el radar deja de ser una lámina y pasa a ser el índice. */
function filtraDesdeRadar(cat){
 S2.cat=cat; render();
 llevaAResultados({categoria:cat,devolverFoco:true});
}

let S2={cat:"",reg:"",acc:"",tic:"",q:"",view:"grid"};
let compare=[];
const LIMITE_MOVIL_RESULTADOS=6;
let movilResultadosExpandidos=false;
let movilFiltrosAbiertos=false;

function llevaAResultados({categoria='',devolverFoco=false,soloMovil=false}={}){
 requestAnimationFrame(()=>{
  const esMovil=Boolean(document.documentElement&&document.documentElement.classList&&
   document.documentElement.classList.contains('movil-ui'));
  if(soloMovil&&!esMovil)return;
  const destino=document.getElementById('plataformasResultados')||document.getElementById('count');
  if(destino&&destino.scrollIntoView)
   destino.scrollIntoView({block:'start',behavior:menos?'auto':'smooth'});
  if(!devolverFoco)return;
  const equivalente=[...document.querySelectorAll('[data-filtrar-cat]')]
   .find(nodo=>(nodo.dataset.filtrarCat||'')===categoria);
  if(equivalente)equivalente.focus({preventScroll:true});
 });
}

function actualizarFiltrosMoviles(){
 const boton=document.getElementById('movilFiltrosToggle');
 const panel=document.getElementById('movilFiltrosAvanzados');
 const cuenta=document.getElementById('movilFiltrosCuenta');
 const activos=[S2.reg,S2.acc,S2.tic].filter(Boolean).length;
 if(boton){
  boton.setAttribute('aria-expanded',movilFiltrosAbiertos?'true':'false');
  boton.classList.toggle('tiene-filtros',activos>0);
 }
 if(panel)panel.classList.toggle('abiertos',movilFiltrosAbiertos);
 if(cuenta){cuenta.hidden=activos===0;cuenta.textContent=String(activos);}
}
function alternarFiltrosMoviles(){
 movilFiltrosAbiertos=!movilFiltrosAbiertos;
 actualizarFiltrosMoviles();
 if(movilFiltrosAbiertos)requestAnimationFrame(()=>document.getElementById('fReg')?.focus({preventScroll:true}));
 else document.getElementById('movilFiltrosToggle')?.focus({preventScroll:true});
}

function hayFiltrosPlataformas(){
 return Boolean(S2.cat||S2.reg||S2.acc||S2.tic||S2.q);
}
function actualizarResultadosMoviles(total){
 const g=document.getElementById('grid'),b=document.getElementById('movilResultadosMas');
 if(!g||!b)return;
 const filtrando=hayFiltrosPlataformas();
 const todos=movilResultadosExpandidos||filtrando||S2.view!=='grid';
 g.classList.toggle('movil-resultados-abiertos',todos);
 b.hidden=S2.view!=='grid'||filtrando||total<=LIMITE_MOVIL_RESULTADOS;
 b.setAttribute('aria-expanded',movilResultadosExpandidos?'true':'false');
 b.textContent=movilResultadosExpandidos
  ?'Mostrar solo 6'
  :'Ver '+(total-LIMITE_MOVIL_RESULTADOS)+' más';
}
function alternarResultadosMoviles(){
 movilResultadosExpandidos=!movilResultadosExpandidos;
 const total=filtered().length;
 actualizarResultadosMoviles(total);
 if(!movilResultadosExpandidos){
  const cuenta=document.getElementById('count');
  if(cuenta)cuenta.scrollIntoView({block:'start',behavior:menos?'auto':'smooth'});
 }
}

function rellenaRegiones(){
 const s=document.getElementById('fReg');if(!s)return;
 const elegida=S2&&S2.reg||'';
 if(s.options)while(s.options.length>1)s.remove(1);
 [...new Set(P.map(p=>p.reg))].sort((a,b)=>a.localeCompare(b,'es')).forEach(r=>s.add(new Option(r,r)));
 if(!s.options)return; /* el DOM mínimo del pre-render no modela <option> */
 s.value=Array.from(s.options).some(o=>o.value===elegida)?elegida:'';
 if(!s.value)S2.reg='';
}
rellenaRegiones();
ACCESOS.forEach(a=>document.getElementById('fAcc').add(new Option(etiquetaAcceso(a),a)));
TICKETS.forEach(t=>document.getElementById('fTic').add(new Option(t==="No aplica"?"Mínimo: no aplica":"Mínimo "+t.toLowerCase(),t)));
document.getElementById('fReg').onchange=e=>{S2.reg=e.target.value;Sonido.filtro();render();llevaAResultados({soloMovil:true})};
document.getElementById('fAcc').onchange=e=>{S2.acc=e.target.value;Sonido.filtro();render();llevaAResultados({soloMovil:true})};
document.getElementById('fTic').onchange=e=>{S2.tic=e.target.value;Sonido.filtro();render();llevaAResultados({soloMovil:true})};
document.getElementById('q').oninput=e=>{S2.q=e.target.value.toLowerCase();render()};
function resetAll(){S2={cat:"",reg:"",acc:"",tic:"",q:"",view:S2.view};movilResultadosExpandidos=false;document.getElementById('q').value='';['fReg','fAcc','fTic'].forEach(i=>document.getElementById(i).value='');render()}

document.getElementById('s1').textContent=P.length;
document.getElementById('s3').textContent=new Set(P.map(p=>p.cat)).size;
document.getElementById('s4').textContent=FUERA.length;
/* El rotulo del radar tambien: estaba escrito a mano y se quedo en 24
   cuando el registro crecio. Ahora sale de P como todo lo demas. */
{const rt=document.getElementById('rlTotal');if(rt)rt.textContent=P.length+' plataformas en el radar';}

function filtered(){
 return P.filter(p=>{
  if(S2.cat&&p.cat!==S2.cat)return false;
  if(S2.reg&&p.reg!==S2.reg)return false;
  if(S2.acc&&accesoClasificado(p)!==S2.acc)return false;
  if(S2.tic&&p.ticket!==S2.tic)return false;
  if(S2.q&&!textoBusquedaPlataforma(p).includes(S2.q))return false;
  return true;
 }).sort((a,b)=>a.n.localeCompare(b.n,'es'));
}
function setView(v){S2.view=v;['vGrid','vMat'].forEach((id,i)=>{const b=document.getElementById(id),on=(i===0)===(v==='grid');b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')});render();llevaAResultados({soloMovil:true})}

function render(){
 document.getElementById('pills').innerHTML=
  `<button class="f ${S2.cat===''?'on':''}" data-filtrar-cat="" aria-pressed="${S2.cat===''?'true':'false'}">Todas <span class="ct">${P.length}</span></button>`+
  Object.keys(CATMETA).map(c=>{const n=P.filter(p=>p.cat===c).length;
   const cp={cat:c};return `<button class="f ${S2.cat===c?'on':''}" data-cat="${escHtml(c)}" data-filtrar-cat="${escHtml(c)}" aria-pressed="${S2.cat===c?'true':'false'}"><span class="punto ${catClase(cp)}"></span>${nombreCatHtml(c)} <span class="ct">${n}</span></button>`}).join('');
 const f=filtered();
 document.getElementById('count').innerHTML=CATALOGO_EMBEBIDO_BLOQUEADO?'<b>0</b> plataformas · catálogo no disponible temporalmente':`<b>${f.length}</b> de ${P.length} plataformas · última revisión ${ultimaRevision()}${CATALOGO_CADUCADO?' · pendiente de renovar':''}`;
 document.getElementById('grid').classList.toggle('hide',S2.view!=='grid');
 document.getElementById('matrix').classList.toggle('show',S2.view==='matrix');
 S2.view==='grid'?renderGrid(f):renderMatrix(f);
 actualizarResultadosMoviles(f.length);
 actualizarFiltrosMoviles();
 pintarRadar();
 renderCmpBar();
 pulir();   /* al filtrar se crean fichas nuevas: vuelven a entrar animadas */
}
function renderGrid(f){
 const g=document.getElementById('grid');
 if(CATALOGO_EMBEBIDO_BLOQUEADO){g.innerHTML='<div class="vacio"><p>Catálogo no disponible temporalmente. Las plataformas volverán a mostrarse en cuanto se publique de nuevo.</p></div>';return}
 if(!f.length){g.innerHTML=`<div class="vacio"><p>Ninguna plataforma cumple estos filtros.</p><button class="f" data-accion="limpiar">Limpiar filtros</button></div>`;return}
 g.innerHTML=f.map(p=>{const i=P.indexOf(p),on=compare.includes(i),ilustrativa=portadaEsIlustrativa(p);
  const portada=String(p.n).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const compararTexto=on?`Quitar ${p.n} de la comparación`:`Añadir ${p.n} a la comparación`;
  const v=p.verificacionLocal;
  const nota=v?v.estadoOperativo.detalle:p.nota;
  const aval=v?v.licenciaRegistro.detalle:p.aval;
  const marcaRevision=v?'Revisión editorial: '+fLarga(v.verificadoEl):'Ficha verificada';
  const marcas=v?resumenVerificacionLocalHtml(v):
   `<div class="marcas"><span class="m acc">${escHtml(etiquetaAcceso(p.acceso))}</span><span class="m">Mínimo: ${escHtml(String(p.ticket).toLowerCase())}</span><span class="m">${escHtml(p.cadenas)}</span></div>`;
  return `<div class="ficha ${on?'sel':''} ${catClase(p)}">
   <button type="button" class="empresa-visual__abrir" data-abrir="${i}" aria-label="Abrir la ficha de ${escHtml(p.n)}${ilustrativa?'; portada ilustrativa':''}">
    <img class="empresa-visual__imagen" src="/plataformas/${portada}.webp" alt="" width="720" height="720" loading="lazy" decoding="async" draggable="false">
    <span class="empresa-visual__sombra" aria-hidden="true"></span>
    <span class="empresa-visual__categoria">${escHtml(catCorta(p.cat))}</span>
    <span class="empresa-visual__texto"><strong>${escHtml(p.n)}</strong><small><span>${escHtml(p.tipo)}</span> · <span>${escHtml(p.reg)}</span></small></span>
    ${v?`<span class="empresa-visual__verificada"><span>${escHtml(marcaRevision)}</span></span>`:
     `<span class="empresa-visual__verificada">${okSVG}<span>Ficha verificada</span></span>`}
    <span class="empresa-visual__flecha" aria-hidden="true">›</span>
   </button>
   <button type="button" class="cmp empresa-visual__comparar ${on?'on':''}" data-comparar="${i}" aria-pressed="${on?'true':'false'}" aria-label="${escHtml(compararTexto)}" title="${escHtml(compararTexto)}"><span aria-hidden="true">${on?'✓':'+'}</span></button>
   <div class="ficha-alto">${siglaEl(p)}<div class="ficha-nom"><h3><button class="abrir" data-cat="${escHtml(p.cat)}" data-abrir="${i}">${escHtml(p.n)}</button></h3><div class="sub"><span>${escHtml(p.tipo)}</span> · <span>${escHtml(p.reg)}</span></div></div></div>
   <p class="nota">${escHtml(nota)}</p>
   <div class="aval${v?' aval-local':''}">${v?'':escudoSVG}<span>${escHtml(aval)}</span></div>
   ${marcas}
   <div class="ficha-pie"><span class="verif">${v?'':' '+okSVG}${v?'Revisión editorial: '+escHtml(fLarga(v.verificadoEl)):' Verificado '+escHtml(fCorta(p.ver))}</span>
    <button class="cmp ${on?'on':''}" data-comparar="${i}" aria-pressed="${on?'true':'false'}">${on?'✓ Comparando':'+ Comparar'}</button>
    <button class="movil-ficha-abrir" data-abrir="${i}">Ver ficha <span aria-hidden="true">›</span></button></div></div>`}).join('');
}
function renderMatrix(f){
 const accesos=[...ACCESOS,''];
 document.getElementById('matrix').innerHTML=`<table class="tabla">
  <thead><tr><th>Tipo de activo ↓ &nbsp;/&nbsp; Quién puede entrar →</th>${accesos.map(a=>`<th>${escHtml(a||'Sin comprobar')}</th>`).join('')}</tr></thead>
  <tbody>${Object.keys(CATMETA).map(c=>`<tr><th>${escHtml(c)}</th>${accesos.map(a=>{
   const l=f.filter(p=>p.cat===c&&accesoClasificado(p)===a);
   return `<td><div class="celda">${l.length?l.map(p=>{const i=P.indexOf(p);
    return `<button class="mm" data-abrir="${i}"><span class="md ${catClase(p)}">${escHtml(initials(p.n))}</span>${escHtml(p.n)}</button>`}).join(''):'<span class="nada">—</span>'}</div></td>`}).join('')}</tr>`).join('')}</tbody></table>`;
}
function openDrawer(i){
 const p=P[i];
 if(!p)return;
 const web=urlHttps(p.web);
 const propia=rutaFichaPublica('plataformas',p.slug);
 const v=p.verificacionLocal;
 const resumen=v?v.estadoOperativo.detalle:p.nota;
 const origenVisual=portadaEsIlustrativa(p)
  ? `<aside class="pn-origen-visual" aria-label="Origen de la portada"><strong>Imagen ilustrativa</strong><span>Representación editorial creada por RWAdar para explicar ${escHtml(p.cat.toLowerCase())}. No muestra un activo concreto de ${escHtml(p.n)}.</span></aside>`
  : `<aside class="pn-origen-visual oficial" aria-label="Origen de la portada"><strong>Imagen oficial</strong><span>Portada procedente de una fuente oficial y usada con finalidad informativa.</span></aside>`;
 document.getElementById('dwId').innerHTML=`${siglaEl(p)}<div><h3 id="dwTitulo">${escHtml(p.n)}</h3><div class="cat">${escHtml(p.cat)}</div></div>`;
 document.getElementById('dwBody').innerHTML=`
  <section class="pn-seccion pn-resumen" aria-labelledby="dwResumenTit">
   <h4 id="dwResumenTit">Resumen</h4>
   <p id="dwResumen">${escHtml(p.nota)}</p>
   ${propia?enlaceFichaPublicaHtml(propia):''}
   <div class="pn-claves" aria-label="Datos principales">
    <span>${escHtml(p.tipo)}</span><span>${escHtml(p.reg)}</span><span>Acceso: ${escHtml(accesoVisible(p))}</span>
   </div>
  </section>
  ${origenVisual}
  ${v?detalleVerificacionLocalHtml(v,resumen):`<section class="pn-seccion pn-verificacion" aria-labelledby="dwVerificacionTit">
   <h4 id="dwVerificacionTit">Verificación RWAdar</h4>
   <div class="aval aval-detalle">${escudoSVG}<span>${escHtml(p.aval)}</span></div>
  </section>`}
  <div class="pn-datos-grid">
   <section class="pn-seccion pn-datos" aria-labelledby="dwAccesoTit">
    <h4 id="dwAccesoTit">Acceso e inversión</h4>
    <dl class="datos">
     <div><dt>Tipo de empresa</dt><dd>${escHtml(p.tipo)}</dd></div>
     <div><dt>Quién puede entrar</dt><dd>${escHtml(etiquetaAcceso(p.acceso))}</dd></div>
     <div><dt>Importe de entrada</dt><dd>${escHtml(p.ticket)}</dd></div>
    </dl>
   </section>
   <section class="pn-seccion pn-datos" aria-labelledby="dwActivoTit">
    <h4 id="dwActivoTit">Activo y alcance</h4>
    <dl class="datos">
     <div><dt>Tipo de activo</dt><dd>${escHtml(p.cat)}</dd></div>
     <div><dt>Región y normativa</dt><dd>${escHtml(p.reg)}</dd></div>
     <div><dt>Blockchains</dt><dd>${escHtml(p.cadenas)}</dd></div>
     <div><dt>Última verificación</dt><dd>${escHtml(fLarga(p.ver))}</dd></div>
    </dl>
   </section>
  </div>
  <section class="pn-seccion pn-seguimiento" aria-labelledby="dwSeguimientoTit">
   <h4 id="dwSeguimientoTit">Seguimiento</h4>
   <div id="dwVigilar"></div>
  </section>
  <div class="pn-web-escritorio">
   ${web?`<a class="pn-cta" href="${escHtml(web)}" target="_blank" rel="noopener">Abrir ${escHtml(p.n)} ↗</a>`:'<p class="pn-nota">Web oficial no disponible.</p>'}
   <p class="pn-nota">Se abre la web oficial en otra pestaña. Comprueba siempre los datos en la web oficial.</p>
  </div>
  <p class="pn-nota pn-web-movil-nota">El botón «Web oficial» abre otra pestaña. Comprueba siempre los datos en la web oficial.</p>
  ${v?'':`<section class="pn-seccion pn-opiniones-seccion" aria-label="Puntuación y opiniones">
   <div id="dwOpiniones"></div>
  </section>`}`;
 if(v){
  const resumenLocal=document.getElementById('dwResumen');
  if(resumenLocal)resumenLocal.textContent=resumen;
  const filas=[...document.querySelectorAll('#dwBody .datos>div')];
  const accesoLocal=filas.find(fila=>fila.querySelector('dt')&&fila.querySelector('dt').textContent==='Quién puede entrar');
  if(accesoLocal){accesoLocal.querySelector('dt').textContent='Estado de acceso';accesoLocal.querySelector('dd').textContent=accesoVisible(p);}
  const revisionLocal=filas.find(fila=>fila.querySelector('dt')&&fila.querySelector('dt').textContent==='Última verificación');
  if(revisionLocal){revisionLocal.querySelector('dt').textContent='Revisión editorial';revisionLocal.querySelector('dd').textContent=fechaES(v.verificadoEl);}
 }
 const acciones=document.getElementById('dwAcciones');
 acciones.classList.toggle('sin-web',!web);
 acciones.innerHTML=(web
  ? `<a class="pn-accion-principal" href="${escHtml(web)}" target="_blank" rel="noopener" aria-label="Abrir la web oficial de ${escHtml(p.n)}">Web oficial <span aria-hidden="true">↗</span></a>`
  : '<span class="pn-accion-no-web">Web oficial no disponible</span>')+
  '<button class="pn-accion-cerrar" type="button" data-accion="cerrar-panel">Cerrar ficha</button>';
 /* const en el nivel superior NO se cuelga de window: hay que preguntar
    por el nombre, no por la propiedad. */
 if(typeof Cuenta!=="undefined") Cuenta.pintarVigilar(p.n);
 /* Las opiniones se cargan de la red, asi que van despues de abrir el
    panel: primero se ve la ficha, y ellas entran cuando lleguen. */
 if(typeof Opiniones!=="undefined"&&OPINIONES_DISPONIBLES){const c=document.getElementById("dwOpiniones");if(c)Opiniones.pinta(p.n,c);}
 const cuerpo=document.getElementById('dwBody');if(cuerpo)cuerpo.scrollTop=0;
 /* n.º 12: las fuentes que son una API (REGAFI…) no se enlazan. */
 if(typeof desenlazarConsultasTecnicas==='function')desenlazarConsultasTecnicas(cuerpo,()=>p.verificacionLocal&&p.verificacionLocal.verificadoEl||'');
 openPanel('drawer');
}
function toggleCompare(i){
 const a=compare.indexOf(i);
 if(a>-1)compare.splice(a,1);
 else{if(compare.length>=3){avisar('Puedes comparar hasta tres plataformas a la vez.');return;}compare.push(i)}
 render();requestAnimationFrame(()=>{
  const boton=[...document.querySelectorAll('[data-comparar="'+i+'"]')]
   .find(nodo=>nodo.getClientRects&&nodo.getClientRects().length);
  if(boton)boton.focus({preventScroll:true});
 });
}
function clearCompare(){compare=[];render()}
function renderCmpBar(){
 document.getElementById('cmpbar').classList.toggle('show',compare.length>0);
 document.getElementById('cmpAvs').innerHTML=compare.map(i=>siglaEl(P[i])).join('');
 document.getElementById('cmpTxt').textContent=compare.length===1?'1 seleccionada · elige otra':`${compare.length} seleccionadas`;
 document.getElementById('cmpGo').disabled=compare.length<2;
}
/* Mínimo real de una plataforma en el comparador: el más bajo documentado en
   euros entre sus ofertas del catálogo con la revisión vigente; si no hay
   ninguno, «Sin documentar». «Bajo», «Medio» y «Alto» son niveles de entrada,
   no importes: antes salía «Mínimo: Alto» en todas (QA 04/11/2026, n.º 18).
   Los proveedores de infraestructura no venden inversiones: «No aplica». */
function minimoPlataformaTexto(p){
 if(p&&p.ticket==='No aplica')return 'No aplica';
 const resumenes=(typeof EMI!=='undefined'&&Array.isArray(EMI)?EMI:[]).filter(o=>o&&o.plataformaSlug===p.slug)
  .map(o=>resumenEditorialOferta(o)).filter(r=>r&&!pendienteRevalidarLocal(r)&&r.minimo&&Number.isFinite(r.minimo.euros));
 if(!resumenes.length)return 'Sin documentar';
 const menor=resumenes.reduce((a,b)=>b.minimo.euros<a.minimo.euros?b:a);
 return (resumenes.length>1?'Desde ':'')+textoLocal(menor.minimo.texto);
}
function openCompare(){
 const sel=compare.map(i=>P[i]);
 const datoLocal=(p,campo)=>p.verificacionLocal
  ?`<span class="comp-estado">${escHtml(etiquetaVerificacionLocal(p.verificacionLocal[campo].estado))}</span><span class="comp-nota">${escHtml(p.verificacionLocal[campo].detalle)}</span>`
  :null;
 const rows=[['Tipo de activo',p=>escHtml(p.cat)],['Tipo de empresa',p=>escHtml(p.tipo)],['Región y normativa',p=>escHtml(p.reg)],
  ['Estado de acceso',p=>datoLocal(p,'acceso')||`<span class="m acc">${escHtml(etiquetaAcceso(p.acceso))}</span>`],['Mínimo',p=>escHtml(minimoPlataformaTexto(p))],['Blockchains',p=>escHtml(p.cadenas)],
  ['Licencia o registro',p=>datoLocal(p,'licenciaRegistro')||`<span class="comp-aval">${escHtml(p.aval)}</span>`],
  ['Actividad',p=>datoLocal(p,'estadoOperativo')||`<span class="comp-nota">${escHtml(p.nota)}</span>`],
  ['Avisos importantes',p=>p.verificacionLocal?`<span class="comp-alerta">${p.verificacionLocal.alertasCriticas.map(a=>escHtml(a.detalle)).join('<br>')}</span>`:'—'],
  ['Revisión',p=>escHtml(p.verificacionLocal?p.verificacionLocal.verificadoEl:fLarga(p.ver))],
  ['',p=>{const u=urlHttps(p.web);return u?`<a href="${escHtml(u)}" target="_blank" rel="noopener" class="comp-enlace">Abrir ↗</a>`:'—'}]];
 document.getElementById('modalBody').innerHTML=`<table class="comp">
  <thead><tr><th></th>${sel.map(p=>`<th><div class="hc">${siglaEl(p)}<strong>${escHtml(p.n)}</strong></div></th>`).join('')}</tr></thead>
  <tbody>${rows.map(([l,fn])=>`<tr><th>${escHtml(l)}</th>${sel.map(p=>`<td>${fn(p)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
 openPanel('modal');
}
/* Paneles: mientras uno está abierto el resto de la página queda inerte, así
   el tabulador no se escapa por detrás y el lector de pantalla no lo anuncia. */
const fondo=()=>[...document.querySelectorAll(
 '.hdr,.movil-cabecera,[data-selector-idioma],main,.movil-panel,footer,#cmpbar,#movilNav'
)];
let focoPrevio=null;
let panelHistorialActivo=false;
function openPanel(id){
 focoPrevio=document.activeElement;
 const el=document.getElementById(id);
 if(!el)return;
 el.removeAttribute('inert');
 el.classList.add('show');
 el.scrollTop=0;
 const cuerpo=el.querySelector('.pn-body,.modal-body');if(cuerpo)cuerpo.scrollTop=0;
 document.getElementById('ovl').classList.add('show');
 document.body.classList.add('locked');
 fondo().forEach(n=>n.setAttribute('inert',''));
 const c=el.querySelector('.cerrar');
 if(c)c.focus({preventScroll:true});
 if(!panelHistorialActivo){
  const previo=history.state&&typeof history.state==='object'?history.state:{};
  history.pushState({...previo,rwadarPanel:true},'',location.href);
  panelHistorialActivo=true;
 }
}
function cierraPanelVisual(){
 ['drawer','modal','perfilPanel'].forEach(id=>{
  const el=document.getElementById(id);
  el.classList.remove('show');
  el.setAttribute('inert','');
 });
 document.getElementById('ovl').classList.remove('show');
 document.body.classList.remove('locked');
 fondo().forEach(n=>n.removeAttribute('inert'));
 if(focoPrevio && document.contains(focoPrevio)){focoPrevio.focus({preventScroll:true});focoPrevio=null}
}
function closeAll(){
 const retiraEntrada=panelHistorialActivo&&history.state&&history.state.rwadarPanel===true;
 panelHistorialActivo=false;
 cierraPanelVisual();
 if(retiraEntrada)history.back();
}
window.addEventListener('popstate',()=>{
 if(panelHistorialActivo||document.querySelector('#drawer.show,#modal.show,#perfilPanel.show')){
  panelHistorialActivo=false;cierraPanelVisual();
 }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll()});

/* ---- emisiones abiertas ---- */
const milesES=x=>Math.round(Number(x)||0).toLocaleString('es-ES');
const cortoES=x=>{const n=Number(x)||0;
 if(n>=1e6)return (Math.round(n/1e5)/10).toString().replace('.',',')+' M';
 if(n>=1000)return Math.round(n/1000)+' mil';
 return milesES(n)};
const fechaES=iso=>{const p=String(iso||'').split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:'—'};
const diasHasta=iso=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(iso||'')))return null;
 const d=new Date(iso+'T00:00:00'),h=new Date();
 return Number.isFinite(d.getTime())?Math.ceil((d-new Date(h.getFullYear(),h.getMonth(),h.getDate()))/86400000):null};
const numeroFinito=(v,def=0)=>Number.isFinite(Number(v))?Number(v):def;
const emisionValida=e=>e&&typeof e==='object'&&String(e.t||'').trim()&&
 String(e.pl||'').trim()&&Object.hasOwn(CATMETA,String(e.cat||''))&&urlHttps(e.url)&&
 /^\d{4}-\d{2}-\d{2}$/.test(String(e.ver||''));

let emiOrden='cierra',emiCat='',emiColeccion='principales';
function emisionesVisibles(){
 const estados=new Set(['abierta','programada','en_estudio']);
 const actuales=EMI.filter(emisionValida).filter(e=>estados.has(e.est||'abierta')).filter(e=>{const d=diasHasta(e.cierra);return d===null||d>=0});
 const filtradas=emiCat?actuales.filter(e=>e.cat===emiCat):actuales;
 const orden={
  cierra:(a,b)=>(diasHasta(a.cierra)??9e9)-(diasHasta(b.cierra)??9e9),
  rent:(a,b)=>numeroFinito(b.rent,-1)-numeroFinito(a.rent,-1),
  min:(a,b)=>numeroFinito(a.min)-numeroFinito(b.min),
  pct:(a,b)=>numeroFinito(b.pct)-numeroFinito(a.pct),
 }[emiOrden]||(()=>0);
 return filtradas.slice().sort(orden);
}
/* Lo que ve la persona cuando el catálogo no está al día: nunca un vacío,
   sino la última copia completa con su fecha y qué hacer. */
function textoAvisoCatalogo(){
 if(MODO_LOCAL_SEGURO||CATALOGO_EMBEBIDO_BLOQUEADO||!P.length)return '';
 const fecha=fechaES(P[0].verificado_lote_el);
 if(CATALOGO_SIN_COMPROBAR)return 'No hemos podido comprobar la revisión más reciente. Mostramos la última revisión completa, del '+
  fecha+'. Comprueba cada dato en la web del emisor antes de decidir.';
 if(CATALOGO_CADUCADO)return 'Revisión pendiente. Estos datos se revisaron el '+fecha+
  ' y su revisión semanal ha caducado. Las cifras caducadas se ocultan; comprueba cada dato en la web del emisor antes de decidir.';
 return '';
}
function textoPieRevision(){
 if(CATALOGO_EMBEBIDO_BLOQUEADO)return 'Catálogo no disponible temporalmente';
 return 'Última revisión del catálogo: '+ultimaRevision()+(CATALOGO_CADUCADO||CATALOGO_SIN_COMPROBAR?' · pendiente de renovar':'');
}
function pintarAvisoCatalogo(){
 const texto=textoAvisoCatalogo();
 ['avisoCatalogoRadar','avisoCatalogoOfertas'].forEach(id=>{
  const el=document.getElementById(id);if(!el)return;
  el.textContent=texto;el.hidden=!texto;
 });
 if(!MODO_LOCAL_SEGURO){const pie=document.getElementById('pieRevision');if(pie)pie.textContent=textoPieRevision();}
}
function pintarEmisiones(){
 pintarAvisoCatalogo();
 /* Las pruebas cargan pintarEmisiones sola, sin Inicio. */
 if(typeof pintarInicio==='function')pintarInicio();
 /* «Calcula tus números» (11/11/2026): las ofertas con rentabilidad publicada
    y vigente salen de este mismo catálogo (calculadora-20261111.js). */
 if(typeof RWAdarCalculadoraInicio!=='undefined'&&RWAdarCalculadoraInicio.ofertas)RWAdarCalculadoraInicio.ofertas(EMI,catalogoSinCifrasLocal());
 const caja=document.getElementById('emiLista');if(!caja)return;
 if(MODO_LOCAL_SEGURO&&ESCAPARATE_LOCAL){pintarEscaparateLocal();return;}
 if(CATALOGO_EMBEBIDO_BLOQUEADO){
  const seccion=document.getElementById('emisiones');if(seccion)seccion.classList.add('sin-emisiones');
  const estado=document.getElementById('movilOfertasEstado');if(estado){estado.textContent='Catálogo no disponible';estado.classList.remove('hay-ofertas')}
  caja.innerHTML='<div class="emis-vacio"><h3>Catálogo no disponible</h3><p>El catálogo se ha retirado temporalmente. Volverá a mostrarse en cuanto se publique de nuevo.</p></div>';
  return;
 }
 const catalogo=EMI.filter(e=>e&&e.catalogo===true);
 if(catalogo.length){
  if(catalogo.length!==EMI.length||!catalogo.every(ofertaLocalValida)){
   caja.innerHTML='<div class="emis-vacio"><h3>Catálogo no disponible</h3><p>Los datos que hemos recibido están incompletos, así que no mostramos las ofertas a medias.</p></div>';
   return;
  }
  const principales=catalogo.filter(o=>o.coleccion==='principales');
  /* Buscar abarca las tres colecciones: una coincidencia de reventa no debe
     quedar oculta detrás de la pestaña inicial de principales. */
  if(emiBusquedaLocal&&!catalogo.some(o=>o.coleccion===emiColeccion&&coincideOfertaLocal(o))){
   const destino=['principales','secundario','en_camino'].find(c=>catalogo.some(o=>o.coleccion===c&&coincideOfertaLocal(o)));
   if(destino)emiColeccion=destino;
  }
  const visibles=ordenarOfertasLocales(principales.filter(coincideOfertaLocal));
  const seccion=document.getElementById('emisiones');if(seccion)seccion.classList.remove('sin-emisiones');
  const futuro=document.getElementById('movilOfertasFuturo');if(futuro)futuro.hidden=true;
  const informacion=document.getElementById('emisInformacion');if(informacion)informacion.open=true;
  const estado=document.getElementById('movilOfertasEstado');
  const seleccion=catalogo.filter(o=>o.coleccion===emiColeccion),coincidencias=seleccion.filter(coincideOfertaLocal);
  const recuento=coincidencias.length+' de '+seleccion.length+' '+({principales:'principales',secundario:'en reventa',en_camino:'próximas'}[emiColeccion]);
  if(estado){estado.textContent=recuento;estado.classList.toggle('hay-ofertas',coincidencias.length>0)}
  /* Como en la app: una pestaña por colección y se ve una cada vez. */
  const cuantas=c=>catalogo.filter(o=>o.coleccion===c).length;
  if(caja.dataset)caja.dataset.coleccion=emiColeccion;
  const pestanas=document.getElementById('emiColecciones');
  if(pestanas){pestanas.hidden=false;pestanas.innerHTML=
   [['principales','Principales'],['secundario','Reventa'],['en_camino','Próximas']].map(([c,t])=>
    '<button type="button" role="tab" data-emi-coleccion="'+c+'" class="'+(emiColeccion===c?'on':'')+'" aria-selected="'+(emiColeccion===c)+'">'+t+' <em>'+cuantas(c)+'</em></button>').join('');}
  const movil=vistaMovilOfertas(),elegidas=movil&&emiOrden!=='nuevas'?visibles.filter(enSeleccionOferta):[];
  const resto=visibles.filter(o=>!elegidas.includes(o));
  /* Móvil: primero la Selección (las que cumplen las cinco comprobaciones) y
     después el resto, cada bloque en el orden del selector. Con «Más nuevas
     primero», una sola lista: la más nueva arriba. */
  /* Sin resultados por la búsqueda: lo dice y ofrece borrarla (QA móvil 04/11/2026). */
  const filas=!visibles.length?(emiBusquedaLocal?'<div class="emis-vacio"><h3>Ninguna oferta coincide con «'+escHtml(emiBusquedaLocal)+'»</h3><p>Prueba con otra palabra o borra la búsqueda.</p>'+
   '<button type="button" class="b3" data-emi-borrar-busqueda>Borrar búsqueda</button></div>':
   '<div class="emis-vacio"><h3>Ninguna oferta coincide</h3><p>Cambia los filtros para volver a ver todas las ofertas.</p></div>'):
   elegidas.length?'<div class="catalogo-bloque catalogo-seleccion" role="group" aria-labelledby="emiSeleccionTit"><header class="catalogo-bloque-cab"><h3 id="emiSeleccionTit">Selección RWAdar <span>· pasan nuestras 5 comprobaciones</span></h3>'+
    '</header>'+elegidas.map(o=>tarjetaOfertaLocal(o,{nivel:4})).join('')+'</div>'+
    (resto.length?'<div class="catalogo-bloque" role="group" aria-labelledby="emiRestoTit"><header class="catalogo-bloque-cab"><h3 id="emiRestoTit">Otras ofertas principales</h3></header>'+resto.map(o=>tarjetaOfertaLocal(o,{nivel:4})).join('')+'</div>':''):
   tarjetasPorProveedorHtml(visibles);
  /* Con un filtro o una búsqueda, el recuento también a la vista (el lector ya lo oye en #movilOfertasEstado). */
  caja.innerHTML=(movil?(emiCat||emiBusquedaLocal?'<p class="catalogo-recuento" aria-hidden="true">'+escHtml(recuento)+'</p>':'')+
   '<p class="catalogo-nota-movil">No es una recomendación de inversión · RWAdar no recibe dinero de las inversiones.</p>':'')+
   '<header class="catalogo-coleccion-cab"><h3>Ofertas principales</h3><p>'+visibles.length+' de '+principales.length+' fichas. Son informativas y gratuitas. Si puedes invertir, las condiciones y los riesgos los confirma la empresa que ofrece cada producto. RWAdar no recibe dinero de las inversiones.</p></header>'+
   '<div class="catalogo-principales">'+filas+'</div>'+
   seccionReferenciasCatalogo(catalogo,'secundario')+seccionReferenciasCatalogo(catalogo,'en_camino')+
   '<p class="nota-ilustrativa catalogo-nota-imagenes">Imágenes ilustrativas, no fotos del activo</p>';
  return;
 }
 const v=emisionesVisibles();
 const hayPublicadas=EMI.some(emisionValida);
 const seccion=document.getElementById('emisiones');
 const futuro=document.getElementById('movilOfertasFuturo');
 const informacion=document.getElementById('emisInformacion');
 const estadoMovil=document.getElementById('movilOfertasEstado');
 if(seccion)seccion.classList.toggle('sin-emisiones',!hayPublicadas);
 if(futuro)futuro.hidden=hayPublicadas;
 if(estadoMovil){
  estadoMovil.textContent=v.length===1?'1 abierta':v.length+' abiertas';
  estadoMovil.classList.toggle('hay-ofertas',v.length>0);
 }
 const movilUI=Boolean(document.documentElement&&document.documentElement.classList&&
  document.documentElement.classList.contains('movil-ui'));
 if(informacion)informacion.open=hayPublicadas||!movilUI;
 if(!v.length){
  caja.innerHTML=hayPublicadas
   ?'<div class="emis-vacio"><h3>Nada abierto con ese filtro</h3><p>Prueba con otra categoría o vuelve en unos días: el catálogo cambia cuando verificamos novedades.</p></div>'
   :'<div class="emis-vacio"><h3>Sin emisiones abiertas</h3><p>Publicaremos aquí las primeras cuando su origen y sus cifras estén comprobados.</p></div>';
  return;
 }
 caja.innerHTML=v.map(e=>{
  const d=diasHasta(e.cierra),pct=Math.max(0,Math.min(100,numeroFinito(e.pct)));
  let cierre='';
  if(e.cont)cierre='<span class="emi-cierra continua">abierto siempre</span>';
  else if(e.est==='programada'||e.est==='en_estudio'){
   const da=diasHasta(String(e.abre||'').slice(0,10));
   const texto=da===null?(e.est==='en_estudio'?'en estudio':'aún no abre'):da<=0?'abre hoy':da===1?'abre mañana':'abre en '+da+' días';
   cierre='<span class="emi-cierra proximo">'+escHtml(texto)+'</span>';
  }else if(d!==null){
   const urg=d<=3?' ultimo':d<=10?' pronto':'';
   cierre='<span class="emi-cierra'+urg+'">'+(d===0?'cierra hoy':d===1?'cierra mañana':'cierra en '+d+' días')+'</span>';
  }else if(pct>=90)cierre='<span class="emi-cierra ultimo">al '+pct+'%, casi lleno</span>';
  else if(pct>=70)cierre='<span class="emi-cierra pronto">al '+pct+'%</span>';
  else cierre='<span class="emi-cierra">'+(pct>0?'al '+pct+'%':'abierta')+'</span>';

  const donde=['<b>'+escHtml(e.pl)+'</b>',escHtml(e.cat)];
  if(e.ub)donde.push(escHtml(e.ub));
  if(numeroFinito(e.plazo)>0)donde.push(numeroFinito(e.plazo)+' meses');
  if(e.tipo)donde.push(escHtml(e.tipo));
  const objetivo=Math.max(0,numeroFinito(e.obj));
  const avance=objetivo>0
   ?'<progress class="emi-barra" max="100" value="'+pct+'" aria-label="'+pct+'% captado"></progress>'+ 
    '<div class="emi-avance"><span>'+pct+'% captado</span><span>de '+cortoES(objetivo)+' '+escHtml(e.mon)+'</span></div>'
   :'';
  const rent=Number(e.rent),min=Math.max(0,numeroFinito(e.min));
  return '<article class="emi'+catClase(e)+'">'+
   (e.pat?'<span class="emi-pat">Patrocinada</span>':'')+
   '<div class="emi-alto"><div><h3 class="emi-tit">'+escHtml(e.t)+'</h3><div class="emi-donde">'+donde.join('<span>·</span>')+'</div></div>'+cierre+'</div>'+ 
   '<div class="emi-cifras">'+
   (Number.isFinite(rent)?'<div class="emi-cifra"><span class="v oro">'+escHtml(String(rent).replace('.',','))+'<small>%</small></span><span class="l">anual, según la plataforma</span></div>':
    e.rentNo?'<div class="emi-cifra"><span class="v emi-sin-dato">—</span><span class="l">no publica rentabilidad</span></div>':'')+
   (min?'<div class="emi-cifra"><span class="v">'+milesES(min)+'<small> '+escHtml(e.mon)+'</small></span><span class="l">entrada mínima</span></div>':
    '<div class="emi-cifra"><span class="v emi-sin-dato">—</span><span class="l">entrada mínima sin publicar</span></div>')+'</div>'+ 
   (e.esNo===false?'<p class="emi-aviso">No disponible para residentes en España.</p>':'')+
   (e.rest?'<p class="emi-aviso">Acceso restringido: '+escHtml(e.rest)+'</p>':'')+
   (e.vinc===false?'<p class="emi-aviso">Es una reserva sin desembolso, no una compra.</p>':'')+
   (e.res?'<p class="emi-nota">'+escHtml(e.res)+'</p>':'')+avance+
   '<div class="emi-pie"><span class="emi-ver">Cifras de la plataforma,<br>comprobadas el '+fechaES(e.ver)+'</span>'+ 
   '<a class="emi-ir" href="'+escHtml(urlHttps(e.url))+'" target="_blank" rel="noopener nofollow'+(e.pat?' sponsored':'')+'">'+
   /* Revisión legal 06/11/2026, 5.3: «Ver oferta en» pide «Se contrata hoy desde
      España» y «supervisada» en «Sí». Estas emisiones antiguas no traen la
      comprobación de supervisión, así que el enlace siempre dice que sales. */
   'Ir a la web del proveedor (sales de RWAdar) ↗</a></div></article>';
 }).join('');
}
function seccionReferenciasCatalogo(catalogo,coleccion){
 const todas=catalogo.filter(o=>o.coleccion===coleccion);
 const visibles=todas.filter(o=>(!emiCat||o.categoria===emiCat)&&coincideBusquedaOfertaLocal(o))
  .sort(emiOrden==='nuevas'?masNuevasPrimero:(a,b)=>a.plataformaNombre.localeCompare(b.plataformaNombre,'es')||a.titulo.localeCompare(b.titulo,'es'));
 const titulo=coleccion==='secundario'?'Reventa entre inversores':'Próximas ofertas';
 const alcance=coleccion==='secundario'
  ?'Ofertas de reventa entre inversores, tal como aparecen en su fuente. No confirman el precio de hoy, que se pueda comprar o vender ni que sigan disponibles.'
  :'Ofertas anunciadas en su fuente. No confirman que vayan a abrir, cuándo lo harán ni que puedas invertir.';
 return '<details class="catalogo-referencias" data-coleccion="'+coleccion+'"'+(emiColeccion===coleccion?' open':'')+'><summary><h3>'+titulo+'</h3><span>'+visibles.length+' de '+todas.length+' ofertas</span></summary>'+
  '<p>'+alcance+' Ordenar por rentabilidad o por mínimo solo cambia el orden de las ofertas principales.</p><div class="emis-rejilla">'+
  (visibles.length?tarjetasPorProveedorHtml(visibles):'<p>Ninguna referencia coincide con la búsqueda y la categoría.</p>')+'</div></details>';
}
function pintarFiltrosEmision(){
 const caja=document.getElementById('emiFiltros');if(!caja)return;
 const hayCatalogo=EMI.some(e=>e&&e.catalogo===true);
 const origen=MODO_LOCAL_SEGURO&&ESCAPARATE_LOCAL?ESCAPARATE_LOCAL.ofertas:
  hayCatalogo?EMI.filter(ofertaLocalValida):EMI.filter(emisionValida);
 /* Orden fijo de CATMETA, no el de llegada: un lote remoto ordenado por slug
    movía «Inmobiliario» al borde y la fila lo enseñaba partido. */
 const presentes=new Set(origen.map(e=>e.categoria||e.cat).filter(Boolean));
 const cats=[...Object.keys(CATMETA).filter(c=>presentes.has(c)),...[...presentes].filter(c=>!Object.hasOwn(CATMETA,c))];
 caja.innerHTML=cats.length?'<button class="f'+(emiCat?'':' on')+'" type="button" data-emi-cat="" aria-pressed="'+(!emiCat)+'">Todas</button>'+cats.map(c=>
  '<button class="f'+(emiCat===c?' on':'')+'" type="button" data-emi-cat="'+escHtml(c)+'" aria-pressed="'+(emiCat===c)+'"><span class="punto'+catClase({cat:c})+'"></span>'+nombreCatHtml(c)+'</button>').join(''):'';
}
(function mandosEmision(){
 activarDetallesOfertas();
 const filtros=document.getElementById('emiFiltros'),orden=document.getElementById('emiOrden');
 const pestanasEmi=document.getElementById('emiColecciones');
 if(pestanasEmi&&pestanasEmi.addEventListener)pestanasEmi.addEventListener('click',ev=>{const b=ev.target&&ev.target.closest&&ev.target.closest('[data-emi-coleccion]');if(!b)return;
  emiColeccion=b.getAttribute('data-emi-coleccion')||'principales';pintarEmisiones();
  const nueva=pestanasEmi.querySelector('[data-emi-coleccion="'+emiColeccion+'"]');if(nueva&&nueva.focus)nueva.focus();});
 if(filtros&&filtros.addEventListener)filtros.addEventListener('click',ev=>{const b=ev.target&&ev.target.closest&&ev.target.closest('[data-emi-cat]');if(!b)return;
  emiCat=b.getAttribute('data-emi-cat')||'';pintarFiltrosEmision();pintarEmisiones();if(typeof Sonido!=='undefined'&&Sonido.marcar)Sonido.marcar()});
 if(orden&&orden.addEventListener)orden.addEventListener('change',()=>{emiOrden=orden.value||'cierra';pintarEmisiones()});
})();

/* =================================================================
   INICIO EN EL MÓVIL · LA HISTORIA (HISTORIA-v2, ESPEC-INICIO, 04/11/2026)
   -----------------------------------------------------------------
   Arriba, el radar real del registro con cuatro lecturas en sus esquinas;
   debajo, seis capítulos, la Selección y las fuentes. Todo lo que es cifra
   del catálogo sale de P, EMI, FUERA y transparencia.json al pintar: ni una
   cifra escrita a mano. Si la revisión ha vencido o no se pudo comprobar, se
   quitan las cifras y la Selección, y queda la fecha. Sin rentabilidades.
   ================================================================= */
let huellaInicio='';
function fechaBarras(iso){const p=String(iso||'').split('-');return p.length===3&&/^\d{4}$/.test(p[0])?p[2]+'/'+p[1]+'/'+p[0]:''}
function inicioSinCifras(){return Boolean(CATALOGO_CADUCADO||CATALOGO_SIN_COMPROBAR||CATALOGO_EMBEBIDO_BLOQUEADO||!P.length)}
function ofertasCatalogoInicio(){
 if(CATALOGO_EMBEBIDO_BLOQUEADO||(MODO_LOCAL_SEGURO&&ESCAPARATE_LOCAL))return [];
 const l=EMI.filter(o=>o&&o.catalogo===true);
 return l.length&&l.length===EMI.length&&l.every(ofertaLocalValida)?l:[];
}
function movimientoReducido(){
 try{return typeof window!=='undefined'&&typeof window.matchMedia==='function'&&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches===true}catch(e){return false}
}
/* El mismo reparto de puntos que el radar de Buscar (puntosRadar), más
   grande. El barrido y los ecos van con animación SVG: cada eco lleva su
   retardo como atributo, algo que la CSP no permite con style, y así se
   encienden justo cuando el barrido pasa. Con movimiento reducido, quieto. */
function radarInicioSvg(sin){
 const CX=200,CY=200,R=136,quieto=movimientoReducido(),cats=Object.keys(CATMETA);
 const pol=(a,r)=>[CX+Math.cos(a*Math.PI/180)*r,CY+Math.sin(a*Math.PI/180)*r];
 const n1=v=>v.toFixed(1);
 let s='<defs><radialGradient id="gBarridoInicio" cx="0" cy="0.5" r="1"><stop offset="0" stop-color="#25E39A" stop-opacity=".36"/>'+
  '<stop offset=".6" stop-color="#25E39A" stop-opacity=".08"/><stop offset="1" stop-color="#25E39A" stop-opacity="0"/></radialGradient>'+
  '<radialGradient id="gFondoInicio"><stop offset="0" stop-color="#25E39A" stop-opacity=".13"/><stop offset=".7" stop-color="#25E39A" stop-opacity=".03"/>'+
  '<stop offset="1" stop-color="#25E39A" stop-opacity="0"/></radialGradient></defs>'+
  '<circle cx="200" cy="200" r="'+R+'" fill="url(#gFondoInicio)"/>';
 [0.40,0.60,0.76,0.90].forEach(f=>{s+='<circle class="radar-anillo" cx="200" cy="200" r="'+n1(R*f)+'"/>'});
 s+='<circle class="radar-borde" cx="200" cy="200" r="'+R+'"/>';
 for(let g=0;g<72;g++){
  const [x1,y1]=pol(g*5,R),[x2,y2]=pol(g*5,R+(g%6===0?8:g%2===0?4:2.5));
  s+='<line class="radar-tick'+(g%18===0?' fuerte':'')+'" x1="'+n1(x1)+'" y1="'+n1(y1)+'" x2="'+n1(x2)+'" y2="'+n1(y2)+'"/>';
 }
 /* Mismos nombres cortos que los chips y las casillas (Inmobiliario, Crédito,
    Tesoro, Acciones, Materias primas, Infraestructura); el número es de
    plataformas. A los lados, pegados al borde y por encima del aro, para que
    ningún rótulo pise el círculo ni se salga de la pantalla. */
 cats.forEach((c,i)=>{
  const [x,y]=pol(-120+i*60,R),n=P.filter(p=>p.cat===c).length,cifra=sin||!n?'':String(n),nombre=catCorta(c);
  s+='<line class="radar-sector" x1="200" y1="200" x2="'+n1(x)+'" y2="'+n1(y)+'"/>';
  if(i%3===0){const ty=i?CY+R+21:CY-R-15;
   s+='<text class="ir-et" x="200" y="'+ty+'" text-anchor="middle" dominant-baseline="middle" fill="'+CATMETA[c].c+'">'+escHtml(nombre)+
    (cifra?' <tspan class="ir-et-n">'+cifra+'</tspan>':'')+'</text>';return;}
  /* Una sola línea por nombre (así se traduce entero) y el número debajo. */
  const der=i<3,tx=der?385:3,arriba=i===1||i===5,lineas=cifra?[nombre,cifra]:[nombre];
  const y0=arriba?CY-92-(lineas.length-1)*15:CY+102;
  s+='<text class="ir-et" x="'+tx+'" y="'+y0+'" text-anchor="'+(der?'end':'start')+'" fill="'+CATMETA[c].c+'">'+
   lineas.map((l,k)=>'<tspan'+(cifra&&k===lineas.length-1?' class="ir-et-n"':'')+' x="'+tx+'"'+(k?' dy="15"':'')+'>'+escHtml(l)+'</tspan>').join('')+'</text>';
 });
 const fin=pol(-88,R);
 s+='<g'+(quieto?' transform="rotate(-38 200 200)"':'')+'><path d="M200 200 L'+(CX+R)+' 200 A'+R+' '+R+' 0 0 0 '+n1(fin[0])+' '+n1(fin[1])+' Z" fill="url(#gBarridoInicio)"/>'+
  '<line x1="200" y1="200" x2="'+(CX+R)+'" y2="200" stroke="#25E39A" stroke-width="1.6" opacity=".85"/>'+
  (quieto?'':'<animateTransform attributeName="transform" type="rotate" from="0 200 200" to="360 200 200" dur="'+VUELTA+'s" repeatCount="indefinite"/>')+'</g>';
 puntosRadar(CX,CY,R).forEach(({x,y,ang,col})=>{
  const X=n1(x),Y=n1(y),t=((((ang%360)+360)%360)/360*VUELTA).toFixed(2);
  if(!quieto)s+='<circle cx="'+X+'" cy="'+Y+'" r="5" fill="'+col+'" opacity="0">'+
   '<animate attributeName="opacity" values=".8;0;0" keyTimes="0;.2;1" dur="'+VUELTA+'s" begin="'+t+'s" repeatCount="indefinite"/>'+
   '<animate attributeName="r" values="5;15;15" keyTimes="0;.2;1" dur="'+VUELTA+'s" begin="'+t+'s" repeatCount="indefinite"/></circle>';
  s+='<circle cx="'+X+'" cy="'+Y+'" r="5.6" fill="'+col+'" stroke="#0B0A0A" stroke-width="1.6"/>';
 });
 /* En el centro, el hexágono de la marca. */
 return s+'<g transform="translate(200 200) scale(1.15) translate(-52 -52)"><path d="M65 52L58.5 63.26L45.5 63.26L39 52L45.5 40.74L58.5 40.74Z" fill="#25E39A" stroke="#0B0A0A" stroke-width="1.4"/></g>';
}
/* Miniatura quieta del radar para la franja plegada de Plataformas: los
   mismos puntos, sin rótulos ni barrido. */
function radarMiniSvg(){
 let s='<circle class="radar-borde" cx="200" cy="200" r="136"/>';
 [0.40,0.60,0.76,0.90].forEach(f=>{s+='<circle class="radar-anillo" cx="200" cy="200" r="'+(136*f).toFixed(1)+'"/>'});
 s+='<path d="M200 200 L336 200 A136 136 0 0 0 204.7 64.1 Z" fill="rgba(37,227,154,.16)"/>';
 return s+puntosRadar(200,200,136).map(({x,y,col})=>'<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="9" fill="'+col+'"/>').join('');
}
function fechaRevisionOferta(o){const d=documentacionOfertaLocal(o);return d&&d.revisadaEl||o.verificadaEl||''}
/* Selección de Inicio: la letra pequeña de cada oferta es texto editorial de
   RWAdar (HISTORIA-v2 §2.7); título, mínimo y foto salen del catálogo. Una
   oferta que entre nueva lleva, al menos, la línea de riesgo. */
const NOTAS_SELECCION={
 'robinhood-classic-stock-tokens':'Es un derivado que sigue el precio de la acción. No eres su dueño ni votas, y puedes perder todo lo invertido.',
 'spiko-letras-del-tesoro-euro':'Es un fondo monetario, no una letra del Tesoro ni un depósito. No está garantizado: puedes perder parte de lo invertido.',
 'spiko-letras-del-tesoro-dolar':'Es un fondo monetario en dólares, no una letra del Tesoro ni un depósito. No está garantizado: puedes perder parte de lo invertido, también si baja el dólar.'};
/* Las 5 comprobaciones en llano, a la vista en Inicio (HISTORIA-v2 §2.7).
   La 2 dice quién autoriza: un supervisor de la UE; la CNMV las inscribe. */
const CRITERIOS_INICIO={contratable:'Se contrata hoy desde España.',supervisada:'La entidad que la ofrece está autorizada por un supervisor de la UE e inscrita en la CNMV.',
 documentoEspana:'Tiene un documento oficial para su venta en España: folleto o KID.',
 minimoSalida:'Están documentados el mínimo y cómo salir.',vigente:'La revisamos esta semana y sus fuentes coinciden.'};
const minimoCortoInicio=o=>{const e=transparenciaOferta(o);return e?textoLocal(e.minimoCorto).replace(/^(\d+(?:,\d+)?) USD$/,'$1 $'):''};
const idiomaInicio=()=>{try{return typeof RWAdarIdioma!=='undefined'&&RWAdarIdioma.obtenerIdioma()==='en'?'en':'es'}catch(e){return 'es'}};
/* Todas las cifras del relato salen de aquí: catálogo, transparencia.json y la
   Selección. Ninguna va escrita en el HTML. */
function cifrasInicio(){
 const ofertas=ofertasCatalogoInicio(),orden=Object.keys(NOTAS_SELECCION);
 const iso=P[0]&&fechaLocalValida(P[0].verificado_lote_el)?P[0].verificado_lote_el:'';
 const dias=P[0]&&Number.isInteger(P[0].vigencia_lote_dias)?P[0].vigencia_lote_dias:0;
 const minimos=ofertas.filter(o=>/^1 [€$]$/.test(minimoCortoInicio(o)));
 return {sin:inicioSinCifras(),ofertas:ofertas.length,plataformas:P.length,descartadas:FUERA.length,revisado:iso,
  hasta:iso&&dias>0?new Date(Date.parse(iso+'T00:00:00Z')+dias*86400000).toISOString().slice(0,10):'',
  minimos:minimos.length,usd:minimos.filter(o=>/\$$/.test(minimoCortoInicio(o))).length,
  seleccion:ofertas.filter(o=>o.coleccion==='principales'&&enSeleccionOferta(o)).sort((a,b)=>((orden.indexOf(a.slug)+1)||99)-((orden.indexOf(b.slug)+1)||99)||
   String(a.plataformaNombre).localeCompare(String(b.plataformaNombre),'es')||String(a.titulo).localeCompare(String(b.titulo),'es'))};
}
/* Una frase con cifra: su plantilla en castellano o en inglés, o null si falta
   alguna cifra (entonces se queda la frase sin número del HTML). */
function plantillaInicio(p,c,en){
 const v={ofertas:c.ofertas,plataformas:c.plataformas,seleccion:c.seleccion.length,minimos:c.minimos,revisado:fechaBarras(c.revisado),hasta:fechaBarras(c.hasta),
  /* «de 1 € o de 1 $», no «de 1 € (una de ellas, de 1 $)», que se contradice. */
  usd:!c.usd?'':en?' or $1':' o de 1 $'};
 const claves=[...String(p||'').matchAll(/\{(\w+)\}/g)].map(m=>m[1]);
 return !p||c.sin||claves.some(k=>!(k in v)||(k!=='usd'&&!v[k]))?null:p.replace(/\{(\w+)\}/g,(_,k)=>String(v[k]));
}
/* «Recién añadidas» de Inicio (04/11/2026): altaOferta, ofertaNueva y
   masNuevasPrimero van junto a transparenciaOferta. Solo Principales: es la
   lista que abre «Ver todas las ofertas nuevas». */
const ofertasRecienAnadidas=()=>ofertasCatalogoInicio().filter(o=>o.coleccion==='principales'&&ofertaNueva(o,30)).sort(masNuevasPrimero).slice(0,6);
function lugarTarjetaHtml(lugar){
 const partes=String(lugar).split(' · '),pais=partes.pop();
 return '<span class="rel-lugar">'+(partes.length?'<span translate="no" lang="es">'+escHtml(partes.join(' · '))+'</span> · ':'')+'<span>'+escHtml(pais)+'</span></span>';
}
function tarjetaNuevaHtml(o,i){
 const img=imagenOfertaLocal(o),id='relNueva'+i,t=String(o.titulo||''),f=altaOferta(o);
 /* Su línea de riesgo, como la Selección; y, como la tarjeta de Ofertas
    (05/11/2026), solo el aviso crítico entero: los demás, en la ficha. */
 const bloqueo=avisoBloqueoOferta(o);
 return '<li class="rel-tarjeta rel-nueva"><article aria-labelledby="'+id+'">'+
  (img?'<div class="rel-tarjeta-img"><img data-src="'+escHtml(img.src)+'" alt="'+escHtml(img.alt)+'"'+respaldoImagen(img)+' width="640" height="440" loading="lazy" decoding="async"></div>':'')+
  '<div class="rel-tarjeta-cuerpo"><h3 id="'+id+'" lang="es" translate="no"><button class="rel-nueva-abrir" type="button" data-perfil-oferta="'+escHtml(o.slug)+'"><span>'+escHtml(t)+'</span></button></h3>'+
  /* Lugar en su propio bloque (no empieza línea con «·»); el país se traduce. */
  '<p class="rel-tarjeta-plat"><span translate="no" lang="es">'+escHtml(o.plataformaNombre||'')+'</span>'+(img&&img.lugar?' · '+lugarTarjetaHtml(img.lugar):'')+'</p>'+
  '<p class="rel-tarjeta-nota">'+escHtml(NOTAS_SELECCION[o.slug]||'Puedes perder parte o todo lo que inviertas.')+'</p>'+
  (bloqueo?'<p class="rel-nueva-aviso rel-nueva-bloqueo"><b>Importante</b> · <span lang="es" translate="no">'+escHtml(textoLocal(bloqueo.texto))+'</span></p>':'')+
  '<p class="rel-nueva-meta">'+(ofertaNueva(o)?'<span class="etq etq-ok">Nueva</span> ':'')+'<span><span>Añadida el</span> <time datetime="'+escHtml(f)+'">'+escHtml(fechaES(f))+'</time></span></p></div></article></li>';
}
/* Ofertas de Inicio (rediseño del 10/11/2026): un solo carrusel con las
   recién añadidas y las que pasan las 5 comprobaciones, sin duplicados y
   6 como mucho. Primero las nuevas (de la más nueva a la más antigua);
   después, las de la Selección que no estén ya, con 3 huecos guardados para
   ellas aunque haya muchas nuevas. Cada tarjeta dice por qué está («Nueva»,
   «Pasa las 5 comprobaciones») y abre su ficha. */
function ofertasInicio(c,nuevas){
 const enNuevas=new Set(nuevas.map(o=>o.slug)),resto=c.seleccion.filter(o=>o&&!enNuevas.has(o.slug)).slice(0,3);
 const vistas=new Set(),lista=[];
 for(const o of [...nuevas.slice(0,6-resto.length),...resto]){if(!o||vistas.has(o.slug))continue;vistas.add(o.slug);lista.push(o);if(lista.length===6)break;}
 return lista;
}
function tarjetaInicioHtml(o,i,seleccion){
 const img=imagenOfertaLocal(o),id='relNueva'+i,t=String(o.titulo||''),f=altaOferta(o),nueva=ofertaNueva(o,30),sel=seleccion.has(o.slug);
 const bloqueo=avisoBloqueoOferta(o),nota=NOTAS_SELECCION[o.slug];
 return '<li class="rel-tarjeta rel-nueva"><article aria-labelledby="'+id+'">'+
  (img?'<div class="rel-tarjeta-img"><img data-src="'+escHtml(img.src)+'" alt="'+escHtml(img.alt)+'"'+respaldoImagen(img)+' width="640" height="440" loading="lazy" decoding="async"></div>':'')+
  '<div class="rel-tarjeta-cuerpo"><p class="rel-nueva-meta">'+(nueva?'<span class="etq etq-ok">Nueva</span>':'')+(sel?'<span class="etq ini-etq-cinco">Pasa las 5 comprobaciones</span>':'')+'</p>'+
  '<h3 id="'+id+'" lang="es" translate="no"><button class="rel-nueva-abrir" type="button" data-perfil-oferta="'+escHtml(o.slug)+'"><span>'+escHtml(t)+'</span></button></h3>'+
  '<p class="rel-tarjeta-plat"><span translate="no" lang="es">'+escHtml(o.plataformaNombre||'')+'</span>'+(img&&img.lugar?' · '+lugarTarjetaHtml(img.lugar):'')+'</p>'+
  (nota?'<p class="rel-tarjeta-nota">'+escHtml(nota)+'</p>':'')+
  (bloqueo?'<p class="rel-nueva-aviso rel-nueva-bloqueo"><b>Importante</b> · <span lang="es" translate="no">'+escHtml(textoLocal(bloqueo.texto))+'</span></p>':'')+
  (nueva&&f?'<p class="rel-nueva-fecha"><span>Añadida el</span> <time datetime="'+escHtml(f)+'">'+escHtml(fechaES(f))+'</time></p>':'')+
  '</div></article></li>';
}
/* Las fotos de la Selección se piden al acercarse a la pantalla: con solo
   loading=lazy el navegador las adelanta 1250 px. */
let observadorFotosInicio=null;
function diferirFotosInicio(){
 if(typeof document==='undefined'||typeof document.querySelectorAll!=='function')return;
 const fotos=[...document.querySelectorAll('#movilPanelInicio img[data-src]')];if(!fotos.length)return;
 const cargar=img=>{const src=img.getAttribute('data-src');img.removeAttribute('data-src');if(src)img.src=src;};
 if(typeof IntersectionObserver!=='function'){fotos.forEach(cargar);return;}
 if(!observadorFotosInicio)observadorFotosInicio=new IntersectionObserver(entradas=>entradas.forEach(e=>{
  if(e.isIntersecting){observadorFotosInicio.unobserve(e.target);cargar(e.target);}}),{rootMargin:'48px 160px'});
 fotos.forEach(img=>observadorFotosInicio.observe(img));
}
function pintarInicio(){
 const panel=document.getElementById('movilPanelInicio');
 if(!panel)return;
 const c=cifrasInicio(),sin=c.sin,en=idiomaInicio()==='en',nuevas=sin?[]:ofertasRecienAnadidas();
 const huella=[P.length,FUERA.length,sin,CATALOGO_EMBEBIDO_BLOQUEADO,c.revisado,c.hasta,en,c.ofertas,c.minimos,c.usd,
  P.map(p=>p.slug+p.cat).join(),c.seleccion.map(o=>o.slug+fechaRevisionOferta(o)).join(),nuevas.map(o=>o.slug).join()].join('|');
 if(huella===huellaInicio)return;
 huellaInicio=huella;
 const pon=(id,html)=>{const el=document.getElementById(id);if(el)el.innerHTML=html;return el;};
 const ocultar=(id,si)=>{const el=document.getElementById(id);if(el)el.hidden=si;};
 pon('inicioRadar',P.length?radarInicioSvg(sin):'');
 pon('movilRadarMini',P.length?radarMiniSvg():'');
 /* Los recuentos del radar, también para el lector de pantalla (el SVG va oculto). */
 ocultar('inicioRadarLista',sin||!P.length);
 pon('inicioRadarLista',sin?'':Object.keys(CATMETA).map(k=>{const n=P.filter(p=>p.cat===k).length;
  return n?'<li><span>'+escHtml(catCorta(k))+'</span> <span>'+n+(n===1?' plataforma':' plataformas')+'</span></li>':''}).join(''));
 const fecha=fechaBarras(c.revisado)||ultimaRevision();
 const t=c.revisado?'<time datetime="'+escHtml(c.revisado)+'">'+escHtml(fecha)+'</time>':escHtml(fecha);
 /* Tres cifras clave en la cabecera: ofertas, plataformas y fecha de revisión.
    El rótulo va antes que el valor en el DOM, en el orden en que se ve: el
    lector de pantalla dice «revisado el 10/11/2026» (WCAG 1.3.2). */
 pon('inicioCifras',CATALOGO_EMBEBIDO_BLOQUEADO?'<li class="ini-cifra ini-cifra-aviso"><b>Catálogo no disponible</b> <span>Volverá en cuanto se publique de nuevo</span></li>':
  sin?'<li class="ini-cifra ini-cifra-aviso"><b>Revisión pendiente</b> <span>Sin cifras hasta renovarla</span></li><li class="ini-cifra ini-cifra-fecha"><span>última revisión</span> <b>'+t+'</b></li>':
  (c.ofertas?'<li class="ini-cifra"><span>ofertas</span> <b>'+c.ofertas+'</b></li>':'')+
  '<li class="ini-cifra"><span>plataformas</span> <b>'+c.plataformas+'</b></li>'+
  '<li class="ini-cifra ini-cifra-fecha"><span>revisado el</span> <b>'+t+'</b></li>');
 if(typeof panel.querySelectorAll==='function')[...panel.querySelectorAll('[data-rel-plantilla]')].forEach(el=>{
  /* Sin cifras, la frase en castellano de data-rel-sin (el idioma la traduce
     si hace falta): no la que hubiera en pantalla, que puede estar en inglés. */
  const texto=plantillaInicio(el.getAttribute(en&&el.hasAttribute('data-rel-plantilla-en')?'data-rel-plantilla-en':'data-rel-plantilla'),c,en)??el.getAttribute('data-rel-sin')??'';
  if(el.textContent!==texto)el.textContent=texto;
 });
 const destacadas=sin?[]:ofertasInicio(c,nuevas),enSeleccion=new Set(c.seleccion.map(o=>o.slug));
 ocultar('relEscaparate',sin||!destacadas.some(o=>enSeleccion.has(o.slug)));
 pon('inicioCriterios',criteriosTransparencia().map(k=>'<li>'+escHtml(CRITERIOS_INICIO[k.id]||k.texto)+'</li>').join(''));
 ocultar('relNuevas',!destacadas.length);
 pon('relNuevasLista',destacadas.map((o,i)=>tarjetaInicioHtml(o,i,enSeleccion)).join(''));
 diferirFotosInicio();
 if(relatoInicio)relatoInicio.repintar();
}
/* Plataformas en el móvil: el radar grande vive en Inicio; en Buscar se
   pliega para que la galería se vea antes, y se despliega con un toque. */
function sincronizarRadarPlegado(){
 const panel=document.getElementById('movilPanelRadar'),b=document.getElementById('movilRadarAlternar');
 if(!panel||!b||!panel.classList||typeof b.setAttribute!=='function')return;
 const abierto=panel.classList.contains('movil-radar-abierto');
 b.setAttribute('aria-expanded',abierto?'true':'false');
 b.textContent=abierto?'Ocultar el radar':'Ver el radar';
}
/* El relato: aparecer al bajar (quieto con «reducir movimiento»), el carrusel
   «Quién más se ha movido», «Fuentes de este apartado», la
   portada a la altura de la pantalla y la barra de progreso de lectura. */
var relatoInicio=(function(){
 const $=id=>document.getElementById(id),panel=$('movilPanelInicio'),raiz=document.documentElement;
 const b=$('movilRadarAlternar');
 if(b&&typeof b.addEventListener==='function')b.addEventListener('click',()=>{
  const radar=$('movilPanelRadar');
  if(radar&&radar.classList){radar.classList.toggle('movil-radar-abierto');sincronizarRadarPlegado();}
 });
 try{const mq=typeof window!=='undefined'&&typeof window.matchMedia==='function'?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
  if(mq&&typeof mq.addEventListener==='function')mq.addEventListener('change',()=>{const r=$('inicioRadar');
   if(r&&typeof P!=='undefined'&&P.length)r.innerHTML=radarInicioSvg(inicioSinCifras());});}catch(e){}
 if(!panel||typeof panel.addEventListener!=='function'||!raiz||!raiz.classList||typeof panel.querySelectorAll!=='function')return null;
 const quieto=movimientoReducido,todos=s=>[...panel.querySelectorAll(s)];
 let io=null,origen=null;
 if(!quieto()&&typeof IntersectionObserver==='function'){
  raiz.classList.add('rel-anim');
  io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visto');io.unobserve(e.target);}}),{rootMargin:'0px 0px -6% 0px'});
 }
 const revelar=()=>todos('.rel-revela:not(.visto)').forEach(n=>io?io.observe(n):n.classList.add('visto'));
 /* «Quién más se ha movido»: sin tamaño (Inicio oculto) se supone el principio,
    y un ResizeObserver repinta en cuanto lo hay. */
 const lista=$('relQuienLista'),items=lista?[...lista.children]:[],pos=$('relQuienPos'),ant=panel.querySelector('.rel-quien-ant'),sig=panel.querySelector('.rel-quien-sig');
 if($('relQuienTotal'))$('relQuienTotal').textContent=String(items.length);
 const paso=()=>items.length>1?items[1].offsetLeft-items[0].offsetLeft:lista.clientWidth;
 const actual=()=>{const p=paso();return p>0?Math.max(0,Math.min(items.length-1,Math.round(lista.scrollLeft/p))):0;};
 function quien(){
  if(!lista)return;
  const ancho=lista.clientWidth;
  if(pos)pos.textContent=String(ancho?actual()+1:1);
  if(ant)ant.disabled=!ancho||lista.scrollLeft<4;
  if(sig)sig.disabled=ancho?lista.scrollLeft+ancho>=lista.scrollWidth-4:items.length<2;
 }
 const ir=d=>lista.scrollTo({left:Math.max(0,actual()+d)*paso(),behavior:quieto()?'auto':'smooth'});
 if(lista){
  let raf=0;lista.addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;quien();});},{passive:true});
  if(ant)ant.addEventListener('click',()=>ir(-1));
  if(sig)sig.addEventListener('click',()=>ir(1));
  lista.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();ir(e.key==='ArrowRight'?1:-1);}});
  if(typeof ResizeObserver==='function')new ResizeObserver(quien).observe(lista);
 }
 /* Rótulos del radar a 12 px en pantalla (11 por debajo de 380 px) aunque el SVG se escale. */
 function rotulos(){
  const r=$('inicioRadar');if(!r||typeof r.getScreenCTM!=='function'||!r.style)return;
  const m=r.getScreenCTM();if(!m||!m.a)return;
  const fs=Math.max(12,(window.innerWidth<380?11:12)/m.a);
  r.style.setProperty('--ir-fs',fs.toFixed(2)+'px');
  r.querySelectorAll('text.ir-et').forEach(t=>{const ts=t.querySelectorAll('tspan[dy]');if(!ts.length)return;
   if(!t.dataset.y0)t.dataset.y0=t.getAttribute('y');const y0=parseFloat(t.dataset.y0),salto=fs*1.2;
   ts.forEach(s=>s.setAttribute('dy',salto.toFixed(1)));if(y0<200)t.setAttribute('y',(y0+15*ts.length-salto*ts.length).toFixed(1));});
 }
 /* «Fuentes de este apartado»: abre la lista en su grupo; «Volver al texto» regresa. */
 const refs=$('relRefs');
 const llevar=(n,centro)=>{n.scrollIntoView({block:centro?'center':'start',behavior:quieto()?'auto':'smooth'});n.focus({preventScroll:true});};
 panel.addEventListener('click',e=>{
  /* «Ver todas las ofertas nuevas»: Principales con «Más nuevas primero»
     (data-movil-ir hace el resto). */
  const o=e.target.closest&&e.target.closest('[data-emi-orden]');
  if(o){emiOrden=o.dataset.emiOrden;emiColeccion='principales';const s=$('emiOrden');if(s)s.value=emiOrden;
   /* Sin los filtros ni la búsqueda de antes, para que se vean todas las nuevas. */
   emiCat='';emiTipoLocal='todos';emiBusquedaLocal='';const b=$('emiBuscar');if(b)b.value='';
   pintarFiltrosEmision();pintarTiposOfertaLocal();pintarEmisiones();}
  /* Tocar el radar o «Explorar el radar» abre el radar de Plataformas. */
  /* En tableta y escritorio (768 px o más) no hay pestañas: cada botón baja a su
     sección, el radar al radar interactivo de Plataformas y cada tarjeta abre su ficha. */
  const esc=!raiz.classList.contains('movil-ui')&&e.target.closest&&e.target.closest('[data-inicio-radar],[data-movil-ir],[data-perfil-oferta]');
  if(esc){e.preventDefault();if(esc.dataset.perfilOferta){abrirDetalleOfertaLocal(esc.dataset.perfilOferta);return;}
   const id=esc.hasAttribute('data-inicio-radar')?'tool':esc.dataset.movilIr,dest=$(id);irA(id);
   /* El foco baja con la página, al primer título visible del destino (como Movil.ir). */
   const foco=dest&&([...dest.querySelectorAll('h2,h3')].find(x=>x.offsetWidth>1&&x.getClientRects().length)||dest);
   if(foco&&foco.focus){if(!/^(?:A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(foco.tagName)&&!foco.hasAttribute('tabindex'))foco.setAttribute('tabindex','-1');
    foco.focus({preventScroll:true});}
   return;}
  const r=e.target.closest&&e.target.closest('[data-inicio-radar]');
  if(r&&typeof Movil!=='undefined'&&Movil.ir){e.preventDefault();const radar=$('movilPanelRadar');
   if(radar)radar.classList.add('movil-radar-abierto');sincronizarRadarPlegado();Movil.ir('movilRadarIntro',r);return;}
  const a=e.target.closest&&e.target.closest('a[data-rel-fuentes]');
  if(a){
   const g=$('fuentes-'+a.dataset.relFuentes);if(!g||!refs)return;
   e.preventDefault();e.stopPropagation();refs.open=true;origen=a;
   todos('.rel-refs-grupo').forEach(x=>{const on=x===g;x.classList.toggle('activa',on);x.querySelector('.rel-refs-volver').hidden=!on;});
   llevar(g,false);return;
  }
  const v=e.target.closest&&e.target.closest('.rel-refs-volver');
  if(v&&origen&&origen.isConnected){e.preventDefault();v.hidden=true;llevar(origen,true);}
 });
 /* Un enlace directo a «#fuentes-…» abre la lista en su grupo. */
 if(typeof location!=='undefined'&&refs){const m=/^#fuentes-(\w+)$/.exec(location.hash||''),g=m&&$('fuentes-'+m[1]);
  if(g){refs.open=true;todos('.rel-refs-grupo').forEach(x=>x.classList.toggle('activa',x===g));
   setTimeout(()=>requestAnimationFrame(()=>llevar(g,false)),120);}}
 /* Con el teclado, la tarjeta que recibe el foco entra entera en su carrusel. */
 panel.addEventListener('focusin',e=>{const li=e.target&&e.target.closest&&e.target.closest('.rel-tarjetas>li');
  if(li)li.scrollIntoView({block:'nearest',inline:'nearest',behavior:quieto()?'auto':'smooth'});});
 /* La portada ocupa la pantalla y solo se recalcula si cambia el ancho (la barra
    de direcciones del móvil cambia el alto al bajar). */
 const portada=$('relPortada'),barra=$('relProgreso'),relleno=barra&&barra.querySelector('span');
 let ancho=0,pendiente=false;
 function alto(){
  if(!portada)return;
  const cab=$('movilCabecera'),nav=$('movilNav'),hdr=document.querySelector('.hdr'),arriba=(cab&&cab.offsetHeight)||(hdr&&hdr.offsetHeight)||0;
  /* El alto real de la cabecera (en escritorio, a 1024 px, ocupa dos líneas):
     lo usan la barra de progreso y el salto a «Fuentes». Se mide siempre
     porque cambia con el idioma aunque no cambie el ancho. */
  const estilo=raiz.style&&raiz.style.setProperty?raiz.style:barra&&barra.style;
  if(estilo)estilo.setProperty('--rel-arriba',arriba+'px');
  if(window.innerWidth===ancho)return;ancho=window.innerWidth;
  portada.style.setProperty('--rel-alto',Math.max(320,window.innerHeight-arriba-(nav?nav.offsetHeight:0))+'px');
 }
 function progreso(){
  if(!relleno||panel.hidden)return;
  const total=panel.offsetHeight-window.innerHeight,y=-panel.getBoundingClientRect().top;
  relleno.style.transform='scaleX('+(total>0?Math.min(1,Math.max(0,y/total)):0).toFixed(4)+')';
  barra.classList.toggle('on',!!portada&&window.scrollY>portada.offsetHeight*.6&&y<total+window.innerHeight);
 }
 window.addEventListener('scroll',()=>{if(pendiente)return;pendiente=true;requestAnimationFrame(()=>{pendiente=false;progreso();});},{passive:true});
 window.addEventListener('resize',()=>{alto();rotulos();quien();progreso();},{passive:true});
 try{if(typeof RWAdarIdioma!=='undefined')RWAdarIdioma.suscribirIdioma(()=>{huellaInicio='';pintarInicio();});}catch(e){}
 const repintar=()=>{alto();rotulos();quien();revelar();progreso();};
 /* Al volver a Inicio, el radar y el carrusel ya tienen tamaño: se miden otra vez. */
 if(typeof MutationObserver==='function'&&document.body)new MutationObserver(()=>{if(document.body.dataset.movilPestana==='inicio')requestAnimationFrame(repintar);})
  .observe(document.body,{attributes:true,attributeFilter:['data-movil-pestana']});
 repintar();
 return {repintar};
})();

/* ---- escaparate de revisión local ---------------------------------
   Los datos no se incrustan en el sitio. El servidor loopback los sirve
   desde rwadar-movil/fixtures y esta capa los valida antes de pintar. */
let emiTipoLocal='todos',emiBusquedaLocal='';
if(typeof document!=='undefined'&&document.addEventListener)document.addEventListener('click',e=>{
 if(!(e.target.closest&&e.target.closest('[data-emi-borrar-busqueda]')))return;
 emiBusquedaLocal='';const b=document.getElementById('emiBuscar');if(b){b.value='';b.focus();}
 pintarEmisiones();
});
const textoLocal=v=>typeof v==='string'?v.trim():'';
const fechaLocalValida=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&
 Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
const normalizaBuscaLocal=v=>String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function tipoOfertaLocal(o){
 const t=normalizaBuscaLocal(o&&o.tipo);
 return t==='valor'?'valor':t==='secundario'?'secundario':'rendimiento';
}
function valorLocal(v){
 if(v==null)return '';
 if(typeof v==='string'||typeof v==='number')return String(v);
 if(typeof v==='object'){
  for(const k of ['mostrado','mostrada','display','valor','texto','literal','importe']){
   if(v[k]!=null&&String(v[k]).trim())return String(v[k]).trim();
  }
 }
 return '';
}
function numeroLocal(v,def){
 const t=valorLocal(v).replace(/\./g,'').replace(',','.').match(/-?\d+(?:\.\d+)?/);
 const n=t?Number(t[0]):NaN;return Number.isFinite(n)?n:def;
}
function imagenOfertaLocal(o){
 if(o&&o.catalogo===true){
  if(typeof o.slug!=='string'||o.slug.length>160||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(o.slug))return null;
  const entrada=EDITORIAL_OFERTA_POR_CATEGORIA[o.categoria]||
   {src:EDITORIAL_OFERTA_POR_CATEGORIA['Acciones y capital privado'].src,alt:'Ilustración editorial financiera; no representa un activo concreto'};
  const propia=Object.hasOwn(EDITORIAL_OFERTA_POR_SLUG,o.slug)?EDITORIAL_OFERTA_POR_SLUG[o.slug]:null;
  if(propia&&propia.categoria!==o.categoria)return {src:entrada.src,alt:entrada.alt,etiqueta:'Ilustración editorial'};
  return propia&&propia.categoria===o.categoria?
   {src:propia.src,alt:propia.alt,etiqueta:'Ilustración editorial',respaldo:entrada.src,lugar:textoLocal(propia.lugar)}:
   {src:'/ofertas-editoriales/oferta-'+o.slug+'.webp',
    alt:'Ilustración editorial generada con IA; no es fotografía del activo. '+
     (typeof o.documentacion?.imagenEditorialAlt==='string'&&o.documentacion.imagenEditorialAlt.trim().length>=20&&
      o.documentacion.imagenEditorialAlt.trim().length<=400&&!/[\u0000-\u001f\u007f]/.test(o.documentacion.imagenEditorialAlt)
       ?o.documentacion.imagenEditorialAlt.trim():textoLocal(o.titulo)),
    respaldo:entrada.src,etiqueta:'Ilustración editorial'};}
 const m=textoLocal(o&&o.imagen).match(/^ofertas\/([a-z0-9-]+\.webp)$/);
 if(!m||!MANIFIESTO_EDITORIAL_LOCAL)return null;
 const entrada=MANIFIESTO_EDITORIAL_LOCAL.porCategoria[o.categoria];
 if(!entrada)return null;
 const propia=MANIFIESTO_EDITORIAL_LOCAL.porSlug.get(textoLocal(o.slug));
 return propia&&propia.categoria===o.categoria?
  {src:'/ofertas-editoriales/'+propia.archivo,alt:propia.alt,etiqueta:MANIFIESTO_EDITORIAL_LOCAL.etiqueta,
   respaldo:'/ofertas-editoriales/'+entrada.archivo,lugar:textoLocal(propia.lugar)}:
  {src:'/ofertas-editoriales/'+entrada.archivo,alt:entrada.alt,etiqueta:MANIFIESTO_EDITORIAL_LOCAL.etiqueta};
}
/* Si la ilustración propia no carga, la tarjeta pasa una sola vez a la de su
   categoría. Se escucha en captura porque el error de <img> no burbujea, y
   desde aquí porque la CSP no admite manejadores en el HTML. */
const respaldoImagen=i=>i&&i.respaldo?' data-respaldo="'+escHtml(i.respaldo)+'"':'';
if(typeof document!=='undefined'&&typeof document.addEventListener==='function')document.addEventListener('error',ev=>{
 const img=ev.target;
 if(!(img instanceof HTMLImageElement)||!img.dataset.respaldo)return;
 const respaldo=img.dataset.respaldo;delete img.dataset.respaldo;img.src=respaldo;
},true);
function ofertaLocalValida(o){
 return o&&typeof o==='object'&&textoLocal(o.slug)&&textoLocal(o.titulo)&&
   textoLocal(o.plataformaNombre)&&textoLocal(o.categoria)&&urlHttps(o.url)&&
   fechaLocalValida(o.verificadaEl)&&imagenOfertaLocal(o)&&
   (!o.catalogo||['actual','no_verificable','fuentes_en_conflicto'].includes(o.estadoRevision));
}
function estadoVigenciaLocal(o,ahora=new Date()){
 if(o.coleccion!=null&&o.coleccion!=='principales')return {clase:'caducado',texto:o.coleccion==='en_camino'?'anunciada · sin confirmar que abra':'reventa · sin confirmar que se pueda operar'};
 if(o.estadoRevision==='no_verificable')return {clase:'caducado',texto:'apertura no confirmada'};
 if(o.estadoRevision==='fuentes_en_conflicto')return {clase:'caducado',texto:'fuentes en conflicto'};
 const base=Date.parse(o.verificadaEl+'T00:00:00Z'),ttl=Number(o.vigenciaDias);
 if(!fechaLocalValida(o.verificadaEl)||!Number.isFinite(base)||new Date(base).toISOString().slice(0,10)!==o.verificadaEl||
    !Number.isInteger(ttl)||ttl<1||!Number.isFinite(new Date(base+ttl*86400000).getTime())||!Number.isFinite(ahora.getTime())||
    (o.estadoRevision!=null&&o.estadoRevision!=='actual'))return {clase:'caducado',texto:'sin fecha de validez'};
 const hoyUTC=Date.UTC(ahora.getUTCFullYear(),ahora.getUTCMonth(),ahora.getUTCDate());
 if(base>hoyUTC)return {clase:'caducado',texto:'fecha de revisión errónea'};
 const resta=Math.floor((base+ttl*86400000-hoyUTC)/86400000);
 if(resta<0)return {clase:'caducado',texto:'cifras por actualizar'};
 /* Dicen hasta cuándo valen las cifras, en días enteros (LISTA-FINAL fila 14). */
 const texto=resta===0?'cifras válidas hasta hoy':'cifras válidas '+resta+(resta===1?' día más':' días más');
 return {clase:o.permanente?'permanente':'vigente',texto};
}
// La documentación tiene su propia fecha: no amplía el TTL de una cifra ni
// confirma apertura. Mantener la semántica de validarDocumentacionOferta del
// contrato compartido; las pruebas comparan ambos validadores sin añadir un bundle.
function documentacionOfertaLocal(o,ahora=new Date()){
 const d=o&&o.documentacion,hoy=Number.isFinite(ahora.getTime())?ahora.toISOString().slice(0,10):'';
 const texto=(v,min=1,max=Infinity)=>typeof v==='string'&&v.trim().length>=min&&v.trim().length<=max;
 const fuente=v=>{try{const u=new URL(v);return typeof v==='string'&&u.protocol==='https:'&&!u.username&&!u.password}catch{return false}};
 const fecha=v=>fechaLocalValida(v)&&v<=hoy;
 if(!hoy)return null;
 if(d==null){
  if(!fecha(o&&o.verificadaEl)||!Array.isArray(o&&o.fuentesActuales)||!o.fuentesActuales.length||!o.fuentesActuales.every(fuente))return null;
  return {revisadaEl:o.verificadaEl,descripcion:'',fuentes:[...new Set(o.fuentesActuales)],caracteristicas:[],referencias:[]};
 }
 if(typeof d!=='object'||Array.isArray(d)||!fecha(d.revisadaEl)||!texto(d.descripcion,20,6000)||
    !Array.isArray(d.fuentes)||!d.fuentes.length||!d.fuentes.every(fuente)||new Set(d.fuentes).size!==d.fuentes.length||
    !Array.isArray(d.caracteristicas)||!d.caracteristicas.length||!d.caracteristicas.every(c=>texto(c&&c.etiqueta,1,180)&&texto(c&&c.valor,1,3000))||
    !Array.isArray(d.referencias)||!d.referencias.every(r=>r&&texto(r.etiqueta,1,180)&&texto(r.valor,1,3000)&&texto(r.alcance,12,3000)&&
      fecha(r.fechaConsulta)&&r.fechaConsulta<=d.revisadaEl&&(r.fechaDato===null||(fecha(r.fechaDato)&&r.fechaDato<=r.fechaConsulta))&&
      fuente(r.fuente)&&d.fuentes.includes(r.fuente)))return null;
 return d;
}
/* Rótulo legible de una referencia («accesoEspana · consulta …» → «Acceso
   desde España») e idioma de su cita; la lógica vive en ficha-editorial.js. */
function rotuloRefLocal(e){const api=typeof globalThis!=='undefined'&&globalThis.RWAdarFichaEditorial;return api&&api.rotuloReferencia?api.rotuloReferencia(e):textoLocal(e)}
function rotuloTraducibleLocal(e){const api=typeof globalThis!=='undefined'&&globalThis.RWAdarFichaEditorial;return !!(api&&api.rotuloTraducible&&api.rotuloTraducible(e))}
function idiomaCitaLocal(v){const api=typeof globalThis!=='undefined'&&globalThis.RWAdarFichaEditorial;return api&&api.idiomaCita?api.idiomaCita(v):''}
const NOMBRE_IDIOMA_CITA={en:'inglés',fr:'francés',de:'alemán'};
function nombreFuenteLocal(url){
 try{return new URL(url).hostname.replace(/^www\./,'')}catch{return 'Fuente documental'}
}
/* Las tres partes por separado (la ficha las coloca en su orden); juntas, para quien las pida enteras. */
function documentacionOfertaHtml(d,opciones){const x=partesDocumentacionOferta(d,opciones);return x?x.ficha+x.referencias+x.fuentes:''}
function partesDocumentacionOferta(d,{resumen='',ultima=''}={}){
 if(!d)return null;
 const fecha=v=>escHtml(fechaES(v));
 const r=textoLocal(resumen),resto=r&&d.descripcion.startsWith(r)?d.descripcion.slice(r.length).trim():d.descripcion;
 /* «Qué se adquiere: …» ya sale en Características: no se repite arriba, tampoco
    al final de una descripción que no empieza por el resumen (remates 04/11/2026). */
 const desc=d.caracteristicas.reduce((t,c)=>{const f=textoLocal(c.etiqueta)+': '+textoLocal(c.valor);return f.length>2&&t.endsWith(f)?t.slice(0,-f.length).trim():t},resto);
 const ficha=d.descripcion?'<details class="escaparate-dialogo-seccion escaparate-detalle-ampliable"><summary>Sobre esta oferta</summary>'+
  (desc?'<p class="escaparate-dialogo-resumen">'+escHtml(desc)+'</p>':'')+'<h4>Características</h4><dl class="escaparate-documentacion-caracteristicas">'+
  d.caracteristicas.map(c=>'<div><dt>'+escHtml(c.etiqueta)+'</dt><dd>'+escHtml(c.valor)+'</dd></div>').join('')+'</dl></details>':'';
 const referencias=d.referencias.length?'<details class="escaparate-dialogo-seccion escaparate-detalle-ampliable"><summary>Datos con su fecha <span>'+d.referencias.length+'</span></summary>'+
  '<p class="escaparate-documentacion-aviso">Datos publicados en las fechas indicadas. No son precios actuales ni garantizan rentabilidad, apertura o disponibilidad para contratar.</p>'+
  '<div class="escaparate-referencias-fechadas">'+d.referencias.map(r=>{
    /* El rótulo es de la interfaz (se traduce); el valor y el alcance, citas de la fuente. */
    const rotulo=rotuloRefLocal(r.etiqueta),interno=rotuloTraducibleLocal(r.etiqueta),idioma=idiomaCitaLocal(r.valor);
    return '<article><h4'+(interno?'':' class="ref-etiqueta-original"')+'>'+escHtml(rotulo)+'</h4><p class="ref-valor"><b'+(idioma?' lang="'+idioma+'"':'')+'>'+escHtml(r.valor)+'</b></p>'+
    (NOMBRE_IDIOMA_CITA[idioma]?'<p class="ref-nota-idioma">Cita literal de la fuente, en '+NOMBRE_IDIOMA_CITA[idioma]+'.</p>':'')+
    '<p>Fecha del dato: '+(r.fechaDato?fecha(r.fechaDato):'no indicada en la fuente')+' · Consultado el '+fecha(r.fechaConsulta)+'</p>'+
    '<p class="ref-alcance">'+escHtml(r.alcance)+'</p><a href="'+escHtml(r.fuente)+'" target="_blank" rel="noopener nofollow" aria-label="'+escHtml('Ver fuente · '+nombreFuenteLocal(r.fuente)+' de '+rotulo+': '+r.fuente)+'">Ver fuente · '+escHtml(nombreFuenteLocal(r.fuente))+' ↗</a></article>'}).join('')+'</div></details>':'';
 return {ficha,referencias,fuentes:'<details class="escaparate-dialogo-seccion escaparate-detalle-ampliable"><summary>Fuentes consultadas · '+fecha(d.revisadaEl)+'</summary>'+ultima+'<ul class="escaparate-fuentes-documentales">'+
  d.fuentes.map((u,i)=>'<li><a href="'+escHtml(u)+'" target="_blank" rel="noopener nofollow" aria-label="'+escHtml('Fuente '+(i+1)+' · '+nombreFuenteLocal(u)+': '+u)+'">Fuente '+(i+1)+' · '+escHtml(nombreFuenteLocal(u))+' ↗</a></li>').join('')+'</ul></details>'};
}
function etiquetaMetricaLocal(valor,indice){
 const v=normalizaBuscaLocal(valor);
 if(/meses|sin plazo|perpetuo|emision primaria|en euros/.test(v))return 'Estructura';
 if(/reparto|vencimiento|acumulacion|retirada/.test(v))return 'Cobro / salida';
 if(/^desde /.test(v))return 'Mínimo';
 if(/tvl| en el fondo/.test(v))return 'Tamaño';
 if(/financiad|colocado/.test(v))return 'Financiación';
 if(/pagas |prima|descuento/.test(v))return 'Precio relativo';
 if(/cruce|operacion/.test(v))return 'Actividad';
 if(/inquilino|contrato/.test(v))return 'Contrato';
 if(/tasador|valoracion/.test(v))return 'Valoración';
 if(/colateral/.test(v))return 'Garantía / uso';
 return 'Detalle '+(indice+1);
}
const pulirMetricaLocal=v=>String(v).replace(/\bUltima\b/g,'Última').replace(/\bultima\b/g,'última')
 .replace(/\bUltimo\b/g,'Último').replace(/\bultimo\b/g,'último').replace(/\boperacion\b/g,'operación');
function metricasOfertaLocal(o){
 if(estadoVigenciaLocal(o).clase==='caducado')return [];
 const m=Array.isArray(o.metricas)?o.metricas:[];
 const limpias=m.map((x,i)=>typeof x==='string'?{etiqueta:etiquetaMetricaLocal(x,i),valor:pulirMetricaLocal(x)}:{
  etiqueta:pulirMetricaLocal(textoLocal(x&&x.etiqueta)||etiquetaMetricaLocal(valorLocal(x&&x.valor),i)),valor:pulirMetricaLocal(valorLocal(x&&x.valor))
 }).filter(x=>x.valor).slice(0,8);
 if(valorLocal(o.rentabilidad)&&!limpias.some(x=>/rent|apy|tir/i.test(x.etiqueta)))
  limpias.unshift({etiqueta:'Rentabilidad publicada',valor:valorLocal(o.rentabilidad)});
 if(valorLocal(o.precio)&&!limpias.some(x=>/precio|entrada|ticket/i.test(x.etiqueta)))
  limpias.push({etiqueta:'Precio / entrada',valor:valorLocal(o.precio)});
 return limpias.slice(0,8);
}
function avisosOfertaLocal(o){
 return (Array.isArray(o.avisos)?o.avisos:[]).filter(x=>typeof x==='string'||
  (x&&x.tono!=='ok'&&(!x.esAntiguedad||x.tono==='stop'))).map(x=>typeof x==='string'?x:textoLocal(x&&x.texto)).filter(Boolean);
}
function coincideBusquedaOfertaLocal(o){
 if(!emiBusquedaLocal)return true;
 const bolsa=[o.titulo,o.plataformaNombre,o.categoria,o.pais,estadoVigenciaLocal(o).clase==='caducado'?'':o.resumen,
  ...metricasOfertaLocal(o).flatMap(x=>[x.etiqueta,x.valor]),...avisosOfertaLocal(o)].join(' ');
 return normalizaBuscaLocal(bolsa).includes(normalizaBuscaLocal(emiBusquedaLocal));
}
function coincideOfertaLocal(o){
 const tipo=tipoOfertaLocal(o);
 return (emiTipoLocal==='todos'||tipo===emiTipoLocal)&&(!emiCat||o.categoria===emiCat)&&coincideBusquedaOfertaLocal(o);
}
function ordenarOfertasLocales(lista){
 const estado=o=>estadoVigenciaLocal(o).clase==='caducado'?1:0;
 const entrada=o=>resumenEditorialOferta(o).minimo.euros??Infinity;
 const prioridad=o=>resumenEditorialOferta(o).vencida?3:o.estadoRevision==='actual'?0:o.estadoRevision==='fuentes_en_conflicto'?1:2;
 const fechaFuente=o=>resumenEditorialOferta(o).fechas.comprobadaEl||'';
 const orden={
  cierra:(a,b)=>prioridad(a)-prioridad(b)||fechaFuente(b).localeCompare(fechaFuente(a))||
   String(a.plataformaNombre||'').localeCompare(String(b.plataformaNombre||''),'es')||String(a.titulo||'').localeCompare(String(b.titulo||''),'es'),
  rent:(a,b)=>(estado(b)?-Infinity:numeroLocal(b.rentabilidad,-Infinity))-(estado(a)?-Infinity:numeroLocal(a.rentabilidad,-Infinity)),
  min:(a,b)=>entrada(a)-entrada(b)||estado(a)-estado(b),
  az:(a,b)=>String(a.plataformaNombre||'').localeCompare(String(b.plataformaNombre||''),'es')||
   String(a.titulo||'').localeCompare(String(b.titulo||''),'es'),
  nuevas:masNuevasPrimero,
 }[emiOrden]||(()=>0);
 return lista.slice().sort(orden);
}
function clavesOfertaLocal(o,secundario){
 if(o.coleccion==='secundario'||o.coleccion==='en_camino')return {
  destacado:{etiqueta:'Precio y condiciones',valor:'Consúltalos en su web'},auxiliares:[]};
 if(estadoVigenciaLocal(o).clase==='caducado')return {
  destacado:{etiqueta:'Condiciones actuales',valor:'Consultar emisor'},auxiliares:[]};
 const tipo=tipoOfertaLocal(o),rentabilidad=valorLocal(o.rentabilidad),precio=valorLocal(o.precio);
 const destacado=secundario
  ? {etiqueta:'Precio observado',valor:precio||'Consultar mercado'}
  : tipo==='valor'
   ? {etiqueta:'Precio de referencia',valor:precio||'Consúltalo en su web'}
   : {etiqueta:'Rentabilidad publicada',valor:rentabilidad||'No publicada'};
 const metricas=metricasOfertaLocal(o).filter(x=>
  !/rentabilidad publicada|precio \/ entrada/i.test(normalizaBuscaLocal(x.etiqueta)));
 const preferidas=[];
 const literalRentabilidad=textoLocal(o&&o.rentabilidad&&o.rentabilidad.literal);
 const unidadPrecio=textoLocal(o&&o.precio&&o.precio.unidad);
 const patrones=secundario
  ? [/rent|apy|tir/i,/ultima operacion|actividad/i,/profundidad|liquidez/i]
  : tipo==='rendimiento'
   ? [/entrada|ticket/i,/estructura|plazo|cobro|salida/i,/actividad|liquidez|tamano/i]
   : [/inversion minima|entrada|ticket/i,/respaldo|representa|sector/i,/prima|descuento|liquidez/i];
 if(secundario&&rentabilidad)preferidas.push({etiqueta:'Rentabilidad ajustada',valor:rentabilidad});
 if(!secundario&&tipo==='rendimiento'&&literalRentabilidad)
  preferidas.push({etiqueta:'Método / ventana',valor:literalRentabilidad});
 if(!secundario&&tipo==='valor'&&unidadPrecio)
  preferidas.push({etiqueta:'Unidad / referencia',valor:unidadPrecio});
 patrones.forEach(p=>{const m=metricas.find(x=>p.test(normalizaBuscaLocal(x.etiqueta))&&!preferidas.includes(x));if(m)preferidas.push(m)});
 metricas.forEach(x=>{if(!preferidas.includes(x))preferidas.push(x)});
 return {destacado,auxiliares:preferidas.slice(0,2)};
}
const AVISO_GENERAL_OFERTA=/^Referencia editorial gratuita\b/;
/* Revisión legal del 06/11/2026, punto 5.3: el enlace al proveedor de una
   oferta que no consta que se contrate hoy desde España, o cuya entidad no
   consta supervisada, no dice «Ver oferta en X»: dice que se sale de RWAdar
   (igual en las fichas fijas y en la app). */
const SALIR_AL_PROVEEDOR='Ir a la web del proveedor (sales de RWAdar)';
/* Lo primero que piden los usuarios en una tarjeta: quién supervisa la
   plataforma. Sale del radar; sin promesas ni sellos que no consten. */
const ICONO_SUPERVISOR='<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z"/></svg>';
function supervisionOferta(o){
 const p=(typeof P!=='undefined'&&Array.isArray(P)?P:[]).find(x=>x&&x.slug===o.plataformaSlug);
 const estado=p&&p.verificacionLocal&&p.verificacionLocal.licenciaRegistro&&p.verificacionLocal.licenciaRegistro.estado;
 if(estado==='confirmada_regulador')return {clase:'ok',texto:'Plataforma registrada ante su supervisor'};
 if(estado==='confirmada_documento_producto')return {clase:'ok',texto:'Documentación de producto consultada'};
 if(p)return {clase:'pendiente',texto:'Registro de la plataforma por confirmar'};
 return {clase:'pendiente',texto:'Plataforma aún no evaluada en el radar'};
}
function resumenEditorialOferta(o){
 const api=typeof globalThis!=='undefined'&&globalThis.RWAdarFichaEditorial;
 if(api&&typeof api.resumenOferta==='function')return api.resumenOferta(o,typeof P!=='undefined'?P:[]);
 /* Si no carga el helper, el catálogo sigue accesible sin inventar condiciones. */
 return {minimo:{texto:'No documentado en euros'},accesoEspana:{texto:'Sin comprobar si se puede contratar desde España'},
  salida:{texto:'Salida no documentada'},costes:{texto:'Costes no documentados'},fechas:{revisadaEl:o.verificadaEl}};
}
/* El snapshot del arranque y sus páginas pasan la misma lista cerrada durante
   el build. Una ampliación recibida por alDia todavía no tiene página estática;
   conserva su diálogo, sin ofrecer un enlace que respondería 404. */
const RUTAS_FICHAS_DESPLEGADAS=new Set([
 ...P.map(p=>'/plataformas/'+p.slug),...EMI.map(o=>'/ofertas/'+o.slug)
]);
function rutaFichaPublica(tipo,slug){
 const ruta=['ofertas','plataformas'].includes(tipo)&&typeof slug==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  ?'/'+tipo+'/'+slug:'';
 return RUTAS_FICHAS_DESPLEGADAS.has(ruta)?ruta:'';
}
function enlaceFichaPublicaHtml(ruta){
 if(!ruta)return '';
 return '<div class="ficha-permanente"><a href="'+escHtml(ruta)+'" aria-label="Ficha completa">Ficha completa</a>'+
  '<button type="button" data-copiar-ficha="'+escHtml(ruta)+'">Copiar enlace</button></div>';
}
async function copiarEnlaceFicha(ruta){
 if(!/^\/(?:ofertas|plataformas)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(ruta||''))return;
 const url='https://rwadar.pages.dev'+ruta;
 try{
  if(typeof navigator==='undefined'||!navigator.clipboard||!navigator.clipboard.writeText)throw new Error('Sin portapapeles');
  await navigator.clipboard.writeText(url);avisar('Enlace de la ficha copiado.');
 }catch(_){avisar('Abre «Ficha completa» y copia la dirección de esa página.');}
}
function textoBreveDatoTarjetaLocal(campo){
 /* Un mínimo documentado en otra moneda o unidad (1 USD, 1 gramo, 500 CHF) se
    enseña tal cual en vez de «No verificado»: está comprobado, solo que no en euros. */
 if(campo&&campo.texto==='No documentado en euros'&&textoLocal(campo.unidadDocumentada))return textoLocal(campo.unidadDocumentada);
 return ({'No documentado en euros':'No verificado','Sin mínimo vigente en euros':'No verificado',
  'Sin comprobar si se puede contratar desde España':'Sin confirmar','Salida no documentada':'Sin documentar',
  /* La fila ya dice «España»: no se repite dentro del dato. */
  'Disponible desde España según la fuente':'Disponible',
  'No disponible desde España según la fuente':'No disponible'})[campo.texto]||campo.texto;
}
function datosClaveOfertaHtml(resumen,completo=false,metricas=[]){
 /* Si el mínimo está en otra moneda o unidad, la fila no dice «(EUR)». */
 const otraUnidad=!completo&&resumen.minimo&&resumen.minimo.texto==='No documentado en euros'&&!!textoLocal(resumen.minimo.unidadDocumentada);
 const datos=[[completo?'Mínimo en euros':otraUnidad?'Mínimo':'Mínimo (EUR)',resumen.minimo],[completo?'Desde España':'España',resumen.accesoEspana],['Salida',resumen.salida]];
 if(completo)datos.push(['Costes',resumen.costes]);
 return '<dl class="escaparate-datos-clave'+(completo?' escaparate-datos-completos':'')+'">'+datos.map(([nombre,campo])=>{
  const referencias=completo&&Array.isArray(campo.referencias)?campo.referencias.filter(r=>r&&urlHttps(r.fuente)&&fechaLocalValida(r.fechaConsulta)):[];
  let citas='';
  if(completo&&referencias.length>1)citas='<ul>'+referencias.map((r,i)=>'<li><a href="'+escHtml(urlHttps(r.fuente))+'" target="_blank" rel="noopener nofollow" aria-label="Fuente '+(i+1)+' · '+escHtml(rotuloRefLocal(r.etiqueta))+' de '+escHtml(nombre)+'">Fuente '+(i+1)+' · '+escHtml(rotuloRefLocal(r.etiqueta))+' ↗</a><small>Consultada el '+escHtml(fechaES(r.fechaConsulta))+
    (r.fechaDato?' · Dato del '+escHtml(fechaES(r.fechaDato)):'')+'</small></li>').join('')+'</ul>';
  else if(completo){const fuente=referencias[0]&&referencias[0].fuente||campo.fuente,fecha=referencias[0]&&referencias[0].fechaConsulta||campo.consultadaEl;
   citas=(urlHttps(fuente)?' <a href="'+escHtml(urlHttps(fuente))+'" target="_blank" rel="noopener nofollow" aria-label="Fuente de '+escHtml(nombre)+'">Fuente ↗</a>':'')+
    (fecha?'<small>Consultada el '+escHtml(fechaES(fecha))+'</small>':'');}
  /* La fila «Salida» no repite «Salida:». En la ficha, los costes van con la
     métrica en castellano del catálogo y la cita original debajo. */
  const breve=(completo?campo.texto:textoBreveDatoTarjetaLocal(campo)).replace(nombre==='Salida'?/^Salida:\s*/i:/$^/,'');
  const coste=completo&&nombre==='Costes'&&metricas.find(x=>/comisi|coste|gasto|tarifa/i.test(normalizaBuscaLocal(x.etiqueta)));
  /* Costes: el rótulo («Comisiones») es interfaz y se traduce; la cita va
     aparte, con su idioma y la misma nota que en «Datos con su fecha». */
  const refsCoste=completo&&nombre==='Costes'&&Array.isArray(campo.referencias)?campo.referencias.filter(r=>r&&textoLocal(r.valor)):[];
  const idiomas=new Set();
  const citaCostes=refsCoste.length?'<small class="escaparate-cita-costes">'+refsCoste.map(r=>{
    const rotulo=rotuloRefLocal(r.etiqueta).replace(/\s*·\s*\d{2}\/\d{2}\/\d{4}\s*$/,''),idioma=idiomaCitaLocal(r.valor);
    if(NOMBRE_IDIOMA_CITA[idioma])idiomas.add(idioma);
    return '<span'+(rotuloTraducibleLocal(r.etiqueta)?'':' data-idioma-fuente')+'>'+escHtml(rotulo)+'</span>: <span data-idioma-fuente'+(idioma?' lang="'+idioma+'"':'')+'>'+escHtml(textoLocal(r.valor))+'</span>'}).join('; ')+'</small>'+
    [...idiomas].map(i=>'<small class="ref-nota-idioma">Cita literal de la fuente, en '+NOMBRE_IDIOMA_CITA[i]+'.</small>').join(''):'';
  /* El dato va en su propio span: es texto de la fuente; las citas son interfaz y se traducen. */
  if(coste)return '<div><dt>'+escHtml(nombre)+'</dt><dd><span class="dato-fuente">'+escHtml(coste.valor)+'</span>'+(citaCostes||'<small class="escaparate-cita-original">'+escHtml(breve)+'</small>')+citas+'</dd></div>';
  if(citaCostes)return '<div><dt>'+escHtml(nombre)+'</dt><dd>'+citaCostes+citas+'</dd></div>';
  return '<div><dt>'+escHtml(nombre)+'</dt><dd>'+(citas?'<span class="dato-fuente">'+escHtml(breve)+'</span>':escHtml(breve))+citas+'</dd></div>';
 }).join('')+'</dl>';
}
/* ---- Transparencia de cada oferta (03/11/2026) ----------------------
   Cinco comprobaciones de la documentación, no una recomendación ni una
   nota: dos salen de transparencia.json (con su motivo y su fuente) y tres
   del catálogo. Falla cerrado: sin entrada, o con otra verificadaEl, la
   oferta no enseña puntos fuertes ni entra en la Selección. */
function criteriosTransparencia(){
 const t=typeof TRANSPARENCIA_CRITERIOS!=='undefined'&&Array.isArray(TRANSPARENCIA_CRITERIOS)?TRANSPARENCIA_CRITERIOS:[];
 return [['contratable','Se contrata hoy desde España'],['supervisada','La entidad que la ofrece está autorizada por un supervisor de la UE e inscrita en la CNMV'],
  ['documentoEspana','Hay un documento oficial (KID o folleto) que cubre su venta en España'],
  ['minimoSalida','El mínimo y la forma de salir están documentados'],['vigente','Revisada esta semana y sin fuentes en conflicto']].map(([id,texto])=>{const c=t.find(x=>x&&x.id===id);return {id,texto:c&&textoLocal(c.texto)||texto}});
}
function transparenciaOferta(o){
 const t=typeof TRANSPARENCIA_POR_SLUG!=='undefined'&&TRANSPARENCIA_POR_SLUG?TRANSPARENCIA_POR_SLUG:null;
 const e=t&&o&&typeof o.slug==='string'&&Object.hasOwn(t,o.slug)?t[o.slug]:null;
 return e&&fechaLocalValida(o.verificadaEl)&&e.verificadaEl===o.verificadaEl?e:null;
}
/* Recién añadidas (04/11/2026). La fecha de alta en el radar es un hecho
   (anadidaEl de transparencia.json), no una nota: en Inicio, las altas de los
   últimos 30 días, de la más nueva a la más antigua y 6 como mucho; en
   Ofertas, «Nueva» durante 14 días y el orden «Más nuevas primero». Con el
   catálogo caducado no sale nada. La app copia esto en lib/recien-anadidas.js. */
function altaOferta(o){const t=typeof TRANSPARENCIA_POR_SLUG!=='undefined'&&TRANSPARENCIA_POR_SLUG,e=t&&o&&typeof o.slug==='string'&&Object.hasOwn(t,o.slug)?t[o.slug]:null;
 return e&&fechaLocalValida(e.anadidaEl)?e.anadidaEl:''}
function ofertaNueva(o,dias=14){const f=altaOferta(o),h=new Date();if(!f||catalogoSinCifrasLocal())return false;
 const d=Math.round((Date.UTC(h.getFullYear(),h.getMonth(),h.getDate())-Date.parse(f+'T00:00:00Z'))/86400000);return d>=0&&d<dias}
function masNuevasPrimero(a,b){return altaOferta(b).localeCompare(altaOferta(a))||String(a.plataformaNombre||'').localeCompare(String(b.plataformaNombre||''),'es')||
 String(a.titulo||'').localeCompare(String(b.titulo||''),'es')}
function catalogoSinCifrasLocal(){
 return [typeof CATALOGO_CADUCADO!=='undefined'&&CATALOGO_CADUCADO,typeof CATALOGO_SIN_COMPROBAR!=='undefined'&&CATALOGO_SIN_COMPROBAR,
  typeof CATALOGO_EMBEBIDO_BLOQUEADO!=='undefined'&&CATALOGO_EMBEBIDO_BLOQUEADO].some(Boolean);
}
function minimoDocumentadoLocal(r){return !!(r&&r.minimo&&(Number.isFinite(r.minimo.euros)||textoLocal(r.minimo.unidadDocumentada)))}
function salidaDocumentadaLocal(r){return !!(r&&r.salida&&textoLocal(r.salida.texto)&&!['Salida no documentada','Salida por volver a comprobar'].includes(r.salida.texto))}
/* Con la revisión vencida el dato existe pero falta revalidarlo: no es «sin documentar». */
function pendienteRevalidarLocal(r){return !!(r&&(r.vencida===true||catalogoSinCifrasLocal()||r.salida&&r.salida.texto==='Salida por volver a comprobar'))}
function comprobacionesOferta(o,resumen=resumenEditorialOferta(o)){
 const e=transparenciaOferta(o),estado=estadoVigenciaLocal(o),textos=criteriosTransparencia();
 const cita=c=>c&&urlHttps(c.fuente)?{url:urlHttps(c.fuente),titulo:nombreFuenteLocal(c.fuente),fecha:fechaLocalValida(c.consultadaEl)?c.consultadaEl:''}:null;
 /* Los motivos de supervisada y documentoEspana son texto editorial de
    transparencia.json (deFuente); los demás los escribe la interfaz. */
 const editorial=campo=>e&&e[campo]?{cumple:e[campo].cumple===true,motivo:textoLocal(e[campo].motivo),deFuente:true,
  fuente:urlHttps(e[campo].fuente&&e[campo].fuente.url)?{url:urlHttps(e[campo].fuente.url),titulo:textoLocal(e[campo].fuente.titulo),fecha:e[campo].consultadaEl}:null}:
  {cumple:false,motivo:'Todavía no hemos comprobado este punto en la revisión actual.',fuente:null};
 /* Falla cerrado como la vigencia: con el catálogo caducado o sin comprobar
    no se afirma nada sobre «hoy», y siempre lleva la fuente del acceso. */
 const caducado=catalogoSinCifrasLocal()||estado.clase==='caducado';
 const contratable=o.coleccion==='principales'&&o.disponibleEs===true&&!caducado&&!!(resumen.accesoEspana&&resumen.accesoEspana.estado==='si'&&cita(resumen.accesoEspana));
 const pendiente=caducado||pendienteRevalidarLocal(resumen),minimo=!pendiente&&minimoDocumentadoLocal(resumen),salida=!pendiente&&salidaDocumentadaLocal(resumen);
 const vigente=o.estadoRevision==='actual'&&!caducado;
 const vencida='Pendiente de volver a comprobar: la revisión semanal ha caducado.';
 /* Mínimo y salida: la etiqueta es de la interfaz y el dato, de la fuente. */
 const partes=[minimo?['Mínimo:',textoBreveDatoTarjetaLocal(resumen.minimo).replace(/\.$/,'')]:[pendiente?'Mínimo por volver a comprobar.':'Mínimo sin documentar.'],
  salida?['Salida:',textoLocal(resumen.salida.texto).replace(/^Salida:\s*/,'').replace(/\.$/,'')]:[pendiente?'Salida por volver a comprobar.':'Salida sin documentar.']];
 const lista={
  contratable:{cumple:contratable,fuente:cita(resumen.accesoEspana),motivo:contratable?'Es una oferta principal y la fuente dice que se contrata desde España.':
   o.coleccion==='secundario'?'Es una referencia de reventa entre inversores, no una oferta abierta.':
   o.coleccion==='en_camino'?'Es un anuncio: todavía no se puede contratar.':
   o.disponibleEs===false?'La fuente dice que no se contrata desde España.':caducado?vencida:'No consta en la fuente que se contrate desde España.'},
  supervisada:editorial('supervisada'),documentoEspana:editorial('documentoEspana'),
  minimoSalida:{cumple:minimo&&salida,fuente:minimo?cita(resumen.minimo):cita(resumen.salida),partes,
   motivo:partes.map(x=>x.length>1?x[0]+' '+x[1]+'.':x[0]).join(' ')},
  vigente:{cumple:vigente,fuente:null,motivo:vigente?'Revisada el '+fechaES(o.verificadaEl)+'; '+estado.texto+'.':
   o.estadoRevision==='fuentes_en_conflicto'?'Las fuentes no coinciden.':
   o.estadoRevision==='no_verificable'?'No se pudo confirmar en la revisión.':'La revisión semanal ha caducado.'},
 };
 return textos.map(c=>({...c,...lista[c.id]}));
}
function avisoBloqueoOferta(o){return (o&&Array.isArray(o.avisos)?o.avisos:[]).find(x=>x&&x.tono==='stop'&&textoLocal(x.texto))||null}
/* Una oferta con aviso crítico nunca entra en la Selección (falla cerrado). */
function enSeleccionOferta(o){return !!transparenciaOferta(o)&&!avisoBloqueoOferta(o)&&comprobacionesOferta(o).every(c=>c.cumple)}
function puntosFuertesOferta(o){
 const e=transparenciaOferta(o);
 return e&&Array.isArray(e.puntos)?e.puntos.filter(x=>x&&textoLocal(x.texto)):[];
}
/* Corta en una palabra, nunca a media palabra. */
function textoCortoLocal(v,max=40){
 const t=textoLocal(v);if(t.length<=max)return t;
 const c=t.slice(0,max+1),i=c.lastIndexOf(' ');return (i>12?c.slice(0,i):t.slice(0,max)).replace(/[\s,;:·.(-]+$/,'')+'…';
}
/* Mínimo · España · Salida en forma corta (decisión de Víctor del 03/11). Sin
   revisión vigente no hay cifras: manda lo que calcula resumenOferta. */
/* España y Salida se escriben con UNA función para la tarjeta (escritorio y
   móvil) y para «Lo esencial» de la ficha: antes la tarjeta de escritorio
   decía «Disponible» y la ficha «Sí, según la fuente» (QA 04/11/2026, n.º 18). */
/* La lista dice solo «Sí» o «No» (decisión de Víctor del 05/11/2026); la
   ficha, con «según la fuente» y la fuente al lado. */
function textoEspanaOferta(resumen,corto=false){
 const acceso=resumen&&resumen.accesoEspana&&resumen.accesoEspana.estado;
 return acceso==='si'?(corto?'Sí':'Sí, según la fuente'):acceso==='no'?(corto?'No':'No, según la fuente'):'Sin confirmar';
}
function textoSalidaOferta(o,resumen){
 const e=transparenciaOferta(o);
 return salidaDocumentadaLocal(resumen)?e&&textoLocal(e.salidaCorta)||textoCortoLocal(textoBreveDatoTarjetaLocal(resumen.salida).replace(/^Salida:\s*/,'')):
  pendienteRevalidarLocal(resumen)?'Pendiente de volver a comprobar':'Sin documentar';
}
function datosCortosOferta(o,resumen){
 const e=transparenciaOferta(o);
 const minimo=minimoDocumentadoLocal(resumen)?e&&textoLocal(e.minimoCorto)||textoCortoLocal(textoBreveDatoTarjetaLocal(resumen.minimo)):
  textoBreveDatoTarjetaLocal(resumen.minimo);
 return {minimo,espana:textoEspanaOferta(resumen),espanaCorta:textoEspanaOferta(resumen,true),salida:textoSalidaOferta(o,resumen)};
}
/* La tarjeta de la lista: una sola línea con el mínimo y el acceso desde España.
   Si la oferta no se contrata desde España, el dato dice «No» (nunca «Sin
   confirmar» al lado de «No disponible en España»). */
function datosTarjetaOfertaHtml(o,resumen,noEspana=false){
 const d=datosCortosOferta(o,resumen);
 return '<dl class="escaparate-datos-clave escaparate-datos-linea">'+[['Mínimo',d.minimo],['España',noEspana?'No':d.espanaCorta]]
  .map(([dt,dd])=>'<div><dt>'+escHtml(dt)+'</dt><dd>'+escHtml(dd)+'</dd></div>').join('')+'</dl>';
}
/* Un problema de la revisión (caducada, no verificable o con fuentes en
   conflicto) se ve en la tarjeta. En Reventa y Próximas «no verificable» es
   su estado de siempre (liquidez o apertura sin confirmar): lo explican el
   encabezado de la sección y la ficha, y no se repite en cada fila. */
function problemaRevisionOferta(o){
 const principal=o.coleccion==null||o.coleccion==='principales';
 const e=estadoVigenciaLocal(principal?o:{...o,coleccion:'principales',estadoRevision:o.estadoRevision==='no_verificable'?'actual':o.estadoRevision});
 return e.clase==='caducado'?e.texto:'';
}
/* En la ficha: los cinco criterios con su motivo y su fuente; todos los puntos
   fuertes. Solo el texto de transparencia.json y los datos del catálogo se
   marcan como fuente (no se traducen); lo que escribe la interfaz, sí. */
function transparenciaDetalleHtml(o,resumen){
 const fecha=v=>fechaLocalValida(v)?' · consultada el '+escHtml(fechaES(v)):'';
 const fuente=(f,de)=>{if(!f)return '';const t=f.titulo||nombreFuenteLocal(f.url);
  return '<a href="'+escHtml(f.url)+'" target="_blank" rel="noopener nofollow" aria-label="'+escHtml(t+' · fuente de: '+de)+'"><span><span class="escaparate-fuente-titulo">'+escHtml(t)+'</span> ↗</span></a>'+fecha(f.fecha);};
 const dato=t=>'<span class="escaparate-comprobacion-dato">'+escHtml(t)+'</span>';
 const motivo=c=>c.partes?'<p>'+c.partes.map(x=>x.length>1?'<span>'+escHtml(x[0])+'</span> '+dato(x[1])+'.':'<span>'+escHtml(x[0])+'</span>').join(' ')+'</p>':
  '<p'+(c.deFuente?' class="escaparate-comprobacion-motivo-fuente"':'')+'>'+escHtml(c.motivo)+'</p>';
 const puntos=puntosFuertesOferta(o);
 return '<details class="escaparate-dialogo-seccion escaparate-detalle-ampliable escaparate-transparencia">'+
  '<summary id="detalleTransparenciaTit">Lo que hemos comprobado</summary>'+
  '<p class="escaparate-transparencia-aviso">Es una comprobación de la documentación, no una recomendación de inversión.</p>'+
  '<ul class="escaparate-comprobaciones">'+comprobacionesOferta(o,resumen).map(c=>'<li class="'+(c.cumple?'cumple':'no-cumple')+'">'+
   '<span class="escaparate-comprobacion-marca" aria-hidden="true">'+(c.cumple?'✓':'✗')+'</span><div><b>'+escHtml(c.texto)+
   '<span class="solo-lector">'+(c.cumple?': sí':': no')+'</span></b>'+motivo(c)+(c.fuente?'<p class="escaparate-comprobacion-fuente">'+fuente(c.fuente,c.texto)+'</p>':'')+'</div></li>').join('')+'</ul>'+
  /* «Datos comprobados a favor» (antes «Puntos fuertes»): revisión legal del 06/11/2026, punto 5.3. */
  (puntos.length?'<h4>Datos comprobados a favor, con su fuente</h4><ul class="escaparate-puntos-detalle">'+puntos.map(x=>'<li><b>'+escHtml(x.texto)+'</b>'+
   (x.fuente&&urlHttps(x.fuente.url)?' '+fuente({url:urlHttps(x.fuente.url),titulo:textoLocal(x.fuente.titulo)},x.texto):'')+'</li>').join('')+'</ul>':'')+
  '</details>';
}
/* Tarjeta de la lista (decisión de Víctor del 05/11/2026: «veo demasiada
   información así de primeras, me marea»). Solo lo que sirve para decidir
   qué abrir: imagen y guardar, «Patrocinada» y «Nueva», título, proveedor ·
   lugar y una línea con el mínimo y el acceso desde España. Por seguridad,
   solo si existen: el aviso crítico entero, un problema de la revisión y «No
   disponible en España». Los puntos fuertes, la vigencia, la salida, los
   avisos ordinarios y las fechas siguen en la ficha. Toda la tarjeta abre la
   ficha con un único botón («›»); guardar va aparte. */
function tarjetaOfertaLocal(o,{secundario=false,nivel=3}={}){
 const estado=estadoVigenciaLocal(o),resumen=resumenEditorialOferta(o),imagen=imagenOfertaLocal(o);
 const bloqueo=avisoBloqueoOferta(o),revision=problemaRevisionOferta(o),nueva=ofertaNueva(o);
 const noEspana=estado.clase!=='caducado'&&o.disponibleEs===false;
 const cat=Object.hasOwn(CATMETA,o.categoria)?catClase({cat:o.categoria}):'';
 return '<article class="emi escaparate-oferta'+cat+(secundario?' escaparate-oferta-secundaria':'')+'">'+
  '<div class="escaparate-imagen"><img src="'+escHtml(imagen.src)+'" alt="'+escHtml(imagen.alt)+'"'+respaldoImagen(imagen)+' loading="lazy" decoding="async" width="640" height="440">'+botonGuardarOferta(o)+'</div>'+
  '<div class="escaparate-cuerpo">'+
   (o.patrocinada||nueva?'<p class="escaparate-marcas">'+(o.patrocinada?'<span class="escaparate-patrocinada">Patrocinada</span>':'')+
    (nueva?'<span class="etq etq-ok emi-nueva">Nueva</span>':'')+'</p>':'')+
   '<h'+nivel+' class="emi-tit" title="'+escHtml(o.titulo)+'">'+escHtml(o.titulo)+'</h'+nivel+'>'+
   '<p class="escaparate-procedencia"><b class="emi-donde">'+escHtml(o.plataformaNombre)+'</b>'+
   /* La ciudad es un dato (no se traduce); el país, sí, como en «Recién añadidas». */
   (imagen&&imagen.lugar?'<span class="emi-lugar">'+lugarTarjetaHtml(imagen.lugar)+'</span>':'')+'</p>'+
   datosTarjetaOfertaHtml(o,resumen,noEspana)+
   (revision||noEspana?'<p class="escaparate-alertas">'+(revision?'<span class="escaparate-estado escaparate-estado-linea caducado">'+escHtml(revision)+'</span>':'')+
    (noEspana?'<span class="escaparate-no-disponible">No disponible en España</span>':'')+'</p>':'')+
   (bloqueo?'<p class="escaparate-aviso-compacto escaparate-aviso-bloqueo"><b>Importante</b> · <span lang="es" translate="no">'+escHtml(textoLocal(bloqueo.texto))+'</span></p>':'')+
   '<button class="escaparate-detalle-boton" type="button" data-oferta-detalle="'+escHtml(o.slug)+'" aria-label="Ver ficha de '+escHtml(o.titulo)+' en '+escHtml(o.plataformaNombre)+'"><span aria-hidden="true">›</span></button>'+
  '</div></article>';
}
/* En el móvil las filas son compactas y van sueltas, sin grupos por
   proveedor (una sola nota común arriba). En escritorio siguen los grupos
   plegados, como antes. */
let gruposPintadosMovil=null;
function vistaMovilOfertas(){
 try{return typeof window!=='undefined'&&typeof window.matchMedia==='function'&&
  window.matchMedia('(max-width: 767px), (max-width: 960px) and (max-height: 540px) and (hover: none) and (pointer: coarse)').matches===true;}
 catch(e){return false}
}
function tarjetasPorProveedorHtml(ofertas){
 gruposPintadosMovil=vistaMovilOfertas();
 /* Con «Más nuevas primero», sin grupos: la más nueva arriba también en escritorio. */
 if(gruposPintadosMovil||emiBusquedaLocal||emiCat||emiTipoLocal!=='todos'||emiOrden==='nuevas')return ofertas.map(o=>tarjetaOfertaLocal(o)).join('');
 const grupos=new Map();
 ofertas.forEach(o=>{const clave=o.plataformaSlug||o.plataformaNombre;
  if(!grupos.has(clave))grupos.set(clave,[]);grupos.get(clave).push(o);});
 return [...grupos.values()].map(grupo=>grupo.length<2?tarjetaOfertaLocal(grupo[0]):
  '<details class="ofertas-grupo"><summary><b>'+escHtml((P.find(p=>p.slug===grupo[0].plataformaSlug)||{}).n||grupo[0].plataformaNombre.split(' · ')[0])+'</b><span>Ver sus '+grupo.length+' ofertas</span></summary>'+
  '<p>Ofertas de la misma empresa. Cada una tiene su fuente, sus condiciones y su fecha; no sumamos ni comparamos sus rentabilidades.</p>'+
  '<div class="ofertas-grupo-rejilla">'+grupo.map(o=>tarjetaOfertaLocal(o)).join('')+'</div></details>').join('');
}
function filaSecundariaLocal(o){
 const estado=estadoVigenciaLocal(o),imagen=imagenOfertaLocal(o),vigente=estado.clase!=='caducado';
 const precio=vigente?(valorLocal(o.precio)||'Consultar'):'Consultar emisor';
 const rentabilidad=vigente?(valorLocal(o.rentabilidad)||'No publicada'):'Consultar emisor';
 const ultima=metricasOfertaLocal(o).find(x=>/ultima operacion/i.test(normalizaBuscaLocal(x.etiqueta)));
 const urlMercado=urlHttps(o.urlMercado),urlFicha=urlHttps(o.url),url=urlMercado||urlFicha;
 return '<article class="escaparate-sec-fila"><div class="escaparate-sec-imagen"><img src="'+escHtml(imagen.src)+'" alt="'+
  escHtml(imagen.alt)+'"'+respaldoImagen(imagen)+' loading="lazy" decoding="async" width="640" height="440"></div><div class="escaparate-sec-contenido">'+
  '<div class="escaparate-sec-meta"><b>'+escHtml(o.plataformaNombre)+'</b><span class="escaparate-estado '+estado.clase+'">'+escHtml(estado.texto)+'</span></div>'+
  '<h4>'+escHtml(o.titulo)+'</h4><div class="escaparate-sec-cifras"><span><b>'+escHtml(rentabilidad)+'</b><small>Rentabilidad ajustada</small></span>'+
  '<span><b>'+escHtml(precio)+'</b><small>Precio observado</small></span></div>'+
  '<div class="escaparate-sec-pie">'+(ultima?'<span>'+escHtml(ultima.valor)+'</span>':'<span>Sin última operación publicada</span>')+
  '<span class="escaparate-sec-enlaces">'+botonGuardarOferta(o)+'<button type="button" data-oferta-detalle="'+escHtml(o.slug)+'" aria-label="Detalle de '+escHtml(o.titulo)+' en '+escHtml(o.plataformaNombre)+'">Detalle</button><a href="'+escHtml(url)+'" target="_blank" rel="noopener nofollow" aria-label="Abrir mercado para '+escHtml(o.titulo)+'">Mercado ↗</a>'+
  (urlMercado&&urlFicha&&urlFicha!==urlMercado?'<a href="'+escHtml(urlFicha)+'" target="_blank" rel="noopener nofollow" aria-label="Abrir ficha oficial de '+escHtml(o.titulo)+'">Ficha</a>':'')+
  '</span></div></div></article>';
}
function ofertaDetalleLocalPorSlug(slug){
 const local=typeof MODO_LOCAL_SEGURO!=='undefined'&&MODO_LOCAL_SEGURO;
 if(local&&ESCAPARATE_LOCAL){
  return [...ESCAPARATE_LOCAL.ofertas,...ESCAPARATE_LOCAL.secundario]
   .find(o=>textoLocal(o&&o.slug)===textoLocal(slug)&&ofertaLocalValida(o))||null;
 }
 if(typeof CATALOGO_EMBEBIDO_BLOQUEADO!=='undefined'&&CATALOGO_EMBEBIDO_BLOQUEADO)return null;
 const catalogo=typeof EMI!=='undefined'?EMI:[];
 if(!catalogo.length||!catalogo.every(o=>o&&o.catalogo===true&&ofertaLocalValida(o)))return null;
 return catalogo.find(o=>textoLocal(o.slug)===textoLocal(slug))||null;
}
function activarDetallesOfertas(){
 const seccion=document.getElementById('emisiones');
 if(seccion&&!seccion.dataset.detalleOfertaActivo){seccion.dataset.detalleOfertaActivo='1';seccion.addEventListener('click',e=>{
  const b=e.target&&e.target.closest&&e.target.closest('[data-oferta-detalle]');if(b)abrirDetalleOfertaLocal(b.dataset.ofertaDetalle);
 })}
}
function restaurarFocoOfertaLocal(d){
 const origen=d.rwadarOrigen;d.rwadarOrigen=null;
 const slug=d.getAttribute('data-oferta-slug');
 const destino=origen&&document.contains(origen)?origen:
  [...document.querySelectorAll('[data-oferta-detalle],[data-perfil-oferta]')].find(n=>
   (n.dataset.ofertaDetalle||n.dataset.perfilOferta)===slug&&n.getClientRects&&n.getClientRects().length);
 if(destino)destino.focus({preventScroll:true});
}
function dialogoOfertaLocal(){
 let d=document.getElementById('escaparateDetalleLocal');
 if(d)return d;
 d=document.createElement('dialog');
 d.id='escaparateDetalleLocal';d.className='escaparate-dialogo';
 d.setAttribute('aria-labelledby','escaparateDetalleTitulo');
 d.setAttribute('tabindex','-1');
 d.addEventListener('click',e=>{
  if(e.target===d||e.target.closest('[data-cerrar-detalle]'))d.close();
 });
 d.addEventListener('close',()=>{
  document.body.classList.remove('detalle-local-abierto');
  restaurarFocoOfertaLocal(d);
  /* Cerrada con ×, Escape o el fondo: se retira su paso del historial. Al
     volver atrás, Chrome aplica otra vez el #fragmento y deja el foco en
     <body>: se devuelve a la tarjeta en cuanto termina. */
  if(d.rwadarHistorial){d.rwadarHistorial=false;if(history.state&&history.state.rwadarOferta){
   const foco=document.activeElement;
   if(foco&&foco!==document.body)window.addEventListener('popstate',()=>setTimeout(()=>{
    const ahora=document.activeElement;if(document.contains(foco)&&(!ahora||ahora===document.body))foco.focus({preventScroll:true});},0),{once:true});
   history.back();}}
 });
 /* Atrás cierra la ficha y deja la página donde estaba, sin salir de la web. */
 if(typeof window!=='undefined'&&typeof window.addEventListener==='function')window.addEventListener('popstate',()=>{
  if(d.open&&d.rwadarHistorial&&!(history.state&&history.state.rwadarOferta)){d.rwadarHistorial=false;d.close();}
 });
 document.body.appendChild(d);return d;
}
function abrirDetalleOfertaLocal(slug){
 const o=ofertaDetalleLocalPorSlug(slug);
 if(!o){
  const anterior=document.getElementById('escaparateDetalleLocal');
  if(anterior){if(anterior.open)anterior.close();anterior.innerHTML='';anterior.removeAttribute('data-oferta-slug')}
  document.body.classList.remove('detalle-local-abierto');return;
 }
 const d=dialogoOfertaLocal(),secundario=tipoOfertaLocal(o)==='secundario';
 const yaAbierta=d.open&&d.getAttribute('data-oferta-slug')===o.slug;
 const cuerpoAnterior=d.querySelector('.escaparate-dialogo-cuerpo');
 const desplazamiento=yaAbierta&&cuerpoAnterior?cuerpoAnterior.scrollTop:0;
 if(!d.open)d.rwadarOrigen=document.activeElement;
 d.setAttribute('data-oferta-slug',o.slug);
 const estado=estadoVigenciaLocal(o),claves=clavesOfertaLocal(o,secundario);
 const resumen=resumenEditorialOferta(o);
 const documentacion=documentacionOfertaLocal(o),vigente=estado.clase!=='caducado';
 const referencia=vigente?textoLocal(tipoOfertaLocal(o)==='rendimiento'?o.rentabilidad&&o.rentabilidad.literal:o.precio&&o.precio.unidad):'';
 const metricas=metricasOfertaLocal(o),imagen=imagenOfertaLocal(o);
 /* Todos los avisos del catálogo, tal cual; el genérico ya lo dice la línea del botón. */
 const avisos=avisosOfertaLocal(o).filter(t=>!AVISO_GENERAL_OFERTA.test(t));
 const urlFicha=urlHttps(o.url),urlMercado=urlHttps(o.urlMercado),cortos=datosCortosOferta(o,resumen);
 const supervisada=comprobacionesOferta(o,resumen).find(c=>c.id==='supervisada');
 const rel='noopener nofollow'+(o.patrocinada?' sponsored':'');
 const enlace=(url,texto,etiqueta)=>'<a class="emi-ir" href="'+escHtml(url)+'" target="_blank" rel="'+rel+'" aria-label="'+escHtml(etiqueta)+'">'+escHtml(texto)+' ↗</a>';
 /* Revisión legal 06/11/2026, punto 5.3: «Ver oferta en X» solo si «Se contrata
    hoy desde España» es «Sí» y la entidad que la ofrece está supervisada
    («supervisada» en «Sí»); si no, el enlace dice que sales de RWAdar. */
 const verOferta=comprobacionesOferta(o,resumen).some(c=>c.id==='contratable'&&c.cumple===true)&&!!supervisada&&supervisada.cumple===true;
 const textoFicha=secundario?'Ficha oficial':verOferta?'Ver oferta en '+o.plataformaNombre:SALIR_AL_PROVEEDOR;
 const enlaces=(secundario&&urlMercado?enlace(urlMercado,'Abrir mercado','Abrir mercado de '+o.titulo+' en '+o.plataformaNombre):'')+
  (urlFicha?enlace(urlFicha,textoFicha,textoFicha+': '+o.titulo):'');
 /* Un precio o una rentabilidad solo salen si hay cifra publicable (nunca «Consultar fuente» en grande). */
 const cifra=vigente&&claves.destacado&&!/^(?:Consultar|Consúlta|No publicada)/.test(claves.destacado.valor)?claves.destacado:null;
 /* Sin cifra, una línea normal que dice dónde mirar. */
 const sinCifra=cifra?null:o.coleccion==='secundario'||o.coleccion==='en_camino'||secundario?['Precio y condiciones','Consúltalos en su web']:
  !vigente?['Condiciones actuales','Consultar emisor']:tipoOfertaLocal(o)==='valor'?['Precio','En la web del proveedor']:null;
 const fila=(dt,dd,clase='')=>'<div><dt>'+escHtml(dt)+'</dt><dd'+(clase?' class="'+clase+'"':'')+'>'+dd+'</dd></div>';
 const revision=vigente?'<span>Revisadas el '+escHtml(fechaES(o.verificadaEl))+'</span> · <span>'+escHtml(estado.texto.replace(/^cifras /,''))+'</span>':
  '<span class="escaparate-estado caducado">'+escHtml(estado.texto)+'</span>';
 const esencial='<section class="escaparate-dialogo-seccion escaparate-esencial" aria-labelledby="detalleEsencialTit"><h3 id="detalleEsencialTit">Lo esencial</h3><dl>'+
  (o.resumen&&vigente?fila('Qué es','<span class="escaparate-dialogo-resumen">'+escHtml(o.resumen)+'</span>'):'')+
  fila('Quién la vende','<span class="escaparate-esencial-dato">'+escHtml(o.plataformaNombre)+'</span>'+
   (supervisada&&supervisada.cumple&&supervisada.motivo?'<small class="escaparate-comprobacion-motivo-fuente">'+escHtml(supervisada.motivo)+'</small>':''))+
  (cifra?fila(cifra.etiqueta,'<b>'+escHtml(cifra.valor)+'</b>'+(referencia?'<small class="escaparate-referencia">'+escHtml(referencia)+'</small>':'')):
   sinCifra?fila(sinCifra[0],escHtml(sinCifra[1])):'')+
  fila('Mínimo','<span class="escaparate-esencial-dato">'+escHtml(cortos.minimo)+'</span>')+fila('España',escHtml(cortos.espana))+
  fila('Salida','<span class="escaparate-esencial-dato">'+escHtml(cortos.salida)+'</span>')+fila('Cifras',revision)+'</dl></section>';
 const ultima=resumen.fechas.comprobadaEl?'<p class="escaparate-fechas">Consultamos la fuente por última vez el '+escHtml(fechaES(resumen.fechas.comprobadaEl))+
  (resumen.fechas.fechaDato?'; el dato es del '+escHtml(fechaES(resumen.fechas.fechaDato)):'')+'. Cada dato lleva su propia fecha.</p>':'';
 const doc=partesDocumentacionOferta(documentacion,{resumen:vigente?o.resumen:'',ultima})||{ficha:'',referencias:'',fuentes:ultima};
 d.innerHTML='<div class="escaparate-dialogo-marco"><header class="escaparate-dialogo-cab">'+
  '<div><span>'+(o.coleccion==='en_camino'?'Próxima':o.coleccion==='secundario'||secundario?'Reventa entre inversores':'Oferta principal')+'</span><h2 id="escaparateDetalleTitulo">'+escHtml(o.titulo)+'</h2></div>'+
  '<button type="button" data-cerrar-detalle aria-label="Cerrar detalle">×</button></header>'+
  '<div class="escaparate-dialogo-cuerpo">'+esencial+
  (avisos.length?'<section class="escaparate-dialogo-seccion" aria-labelledby="detalleAvisosTit"><h3 id="detalleAvisosTit">Avisos de esta oferta</h3><ul class="escaparate-dialogo-avisos">'+
   avisos.map(x=>'<li>'+escHtml(x)+'</li>').join('')+'</ul></section>':'')+
  '<div class="escaparate-dialogo-imagen"><img src="'+escHtml(imagen.src)+'" alt="'+
   escHtml(imagen.alt)+'"'+respaldoImagen(imagen)+' width="960" height="540" decoding="async"></div><p class="nota-ilustrativa">Imágenes ilustrativas, no fotos del activo</p>'+
  '<section class="escaparate-dialogo-seccion escaparate-antes-fuente"><h3>Antes de invertir</h3><ul><li>Puedes perder parte o todo lo que inviertas.</li><li>La salida depende del contrato y puede requerir compradores.</li><li>Comprueba quién custodia el activo y quién responde.</li><li>El registro de una empresa no cubre todos sus productos.</li></ul></section>'+
  /* Un div, no un footer: la regla global de footer lo ocultaba en el móvil. */
  '<div class="escaparate-dialogo-pie"><p>No es una recomendación de inversión. RWAdar no vende ni recibe tu dinero: confirma las condiciones con el proveedor.</p><div>'+enlaces+'</div></div>'+
  enlaceFichaPublicaHtml(rutaFichaPublica('ofertas',o.slug))+
  transparenciaDetalleHtml(o,resumen)+
  '<details class="escaparate-dialogo-seccion escaparate-detalle-ampliable"><summary>Acceso, salida y costes, con su fuente</summary>'+datosClaveOfertaHtml(resumen,true,metricas)+'</details>'+
  doc.ficha+doc.referencias+
  (metricas.length?'<details class="escaparate-dialogo-seccion escaparate-detalle-ampliable"><summary>Datos publicados <span>'+metricas.length+'</span></summary><div class="escaparate-dialogo-metricas">'+
   metricas.map(x=>'<div><b>'+escHtml(x.valor)+'</b><span>'+escHtml(x.etiqueta)+'</span></div>').join('')+'</div></details>':'')+
  doc.fuentes+
  '</div></div>';
 /* n.º 12: sin enlaces a API ni JSON; la fecha, la de la consulta de esa fuente. */
 if(typeof desenlazarConsultasTecnicas==='function')desenlazarConsultasTecnicas(d,u=>(documentacion&&documentacion.referencias||[]).filter(r=>r.fuente===u).map(r=>r.fechaConsulta).sort().at(-1)||
  (documentacion&&documentacion.revisadaEl)||o.verificadaEl);
 if(!d.open){if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');
  if(typeof history!=='undefined'&&typeof history.pushState==='function'&&typeof location!=='undefined'){
   const previo=history.state&&typeof history.state==='object'?history.state:{};
   history.pushState({...previo,rwadarOferta:o.slug},'',location.href);d.rwadarHistorial=true;}}
 document.body.classList.add('detalle-local-abierto');
 d.scrollTop=0;
 const cuerpo=d.querySelector('.escaparate-dialogo-cuerpo');if(cuerpo)cuerpo.scrollTop=desplazamiento;
 const cerrar=d.querySelector('[data-cerrar-detalle]');
 if(!yaAbierta&&cerrar)cerrar.focus({preventScroll:true});
}
function refrescarDetalleOfertaAbierto(){
 const detalle=document.getElementById('escaparateDetalleLocal');
 if(detalle&&detalle.open)abrirDetalleOfertaLocal(detalle.getAttribute('data-oferta-slug'));
}
function pintarEscaparateLocal(){
 const caja=document.getElementById('emiLista');if(!caja||!ESCAPARATE_LOCAL)return;
 const ofertas=ordenarOfertasLocales(ESCAPARATE_LOCAL.ofertas.filter(ofertaLocalValida).filter(coincideOfertaLocal));
 const sec=ESCAPARATE_LOCAL.secundario.filter(ofertaLocalValida).filter(coincideBusquedaOfertaLocal);
 const seccion=document.getElementById('emisiones');if(seccion)seccion.classList.remove('sin-emisiones');
 caja.innerHTML=ofertas.length?ofertas.map(o=>tarjetaOfertaLocal(o)).join(''):
  '<div class="emis-vacio"><h3>'+escHtml(sec.length&&emiBusquedaLocal?'Sin coincidencias en la selección principal':'Ninguna oferta coincide')+'</h3><p>'+
  (sec.length&&emiBusquedaLocal?'Hay '+sec.length+' coincidencia'+(sec.length===1?'':'s')+' en mercado secundario, justo debajo.':'Cambia la búsqueda o los filtros para volver a ver el escaparate.')+'</p></div>';
 const estado=document.getElementById('movilOfertasEstado');
 if(estado){estado.textContent=ofertas.length+' de '+ESCAPARATE_LOCAL.ofertas.length;estado.classList.toggle('hay-ofertas',ofertas.length>0)}
 const listaSec=document.getElementById('escaparateSecundarioLista');
 if(listaSec)listaSec.innerHTML=sec.length?sec.map(filaSecundariaLocal).join(''):
  '<div class="emis-vacio"><h3>Sin coincidencias en secundario</h3><p>Prueba con otro término de búsqueda.</p></div>';
 const cuentaSec=document.getElementById('escaparateSecundarioCuenta');if(cuentaSec)cuentaSec.textContent=sec.length+' de '+ESCAPARATE_LOCAL.secundario.length;
 const panelSec=document.getElementById('escaparateSecundario');if(panelSec&&emiBusquedaLocal&&sec.length)panelSec.open=true;
}
function pintarTiposOfertaLocal(){
 const caja=document.getElementById('emiTipoFiltros');if(!caja||!ESCAPARATE_LOCAL)return;
 const cuenta=t=>ESCAPARATE_LOCAL.ofertas.filter(o=>tipoOfertaLocal(o)===t).length;
 caja.innerHTML=[['todos','Todas',ESCAPARATE_LOCAL.ofertas.length],['rendimiento','Rendimiento',cuenta('rendimiento')],['valor','Revalorización',cuenta('valor')]]
  .map(x=>'<button class="f'+(emiTipoLocal===x[0]?' on':'')+'" data-emi-tipo="'+x[0]+'" aria-pressed="'+(emiTipoLocal===x[0])+'">'+x[1]+' <small>'+x[2]+'</small></button>').join('');
}
function pintarExclusionesLocales(){
 const caja=document.getElementById('escaparateExclusionesLista');if(!caja||!ESCAPARATE_LOCAL)return;
 caja.innerHTML=ESCAPARATE_LOCAL.exclusionesOfertas.map(x=>{
  const u=urlHttps(x.urlFuente);
  return '<article class="escaparate-exclusion"><b>'+escHtml(x.nombre)+(x.alcance?' · '+escHtml(x.alcance):'')+'</b><p>'+escHtml(x.motivo)+(u?' <a href="'+escHtml(u)+'" target="_blank" rel="noopener nofollow">Fuente ↗</a>':'')+'</p></article>';
 }).join('');
 const n=document.getElementById('escaparateExclusionesCuenta');if(n)n.textContent=ESCAPARATE_LOCAL.exclusionesOfertas.length+' exclusiones';
}
function pintarFuenteLocal(){
 const caja=document.getElementById('escaparateFuente');if(!caja||!ESCAPARATE_LOCAL)return;
 const f=ESCAPARATE_LOCAL.fuente||{},u=urlHttps(f.url);
 caja.innerHTML='<b>Procedencia:</b> '+escHtml(f.titulo||'Escaparate RWAdar')+' · barrido '+escHtml(fechaES(f.barridoEl))+
  (u?' · <a href="'+escHtml(u)+'" target="_blank" rel="noopener nofollow">abrir artefacto original ↗</a>':'')+'<br>'+escHtml(f.aviso||'Instantánea interna; confirma cada dato en el origen.')+
  (f.uso?'<br><b>Uso:</b> '+escHtml(f.uso):'');
}
function activarBusquedaOfertas(){
 const busqueda=document.getElementById('escaparateBusqueda');if(busqueda)busqueda.hidden=false;
 const busca=document.getElementById('emiBuscar');
 if(busca&&!busca.dataset.escaparateActivo){busca.dataset.escaparateActivo='1';busca.addEventListener('input',()=>{emiBusquedaLocal=busca.value.trim();pintarEmisiones()})}
}
function activaControlesEscaparateLocal(v2=false){
 activarBusquedaOfertas();
 if(!v2)document.querySelectorAll('.solo-escaparate-local').forEach(x=>{x.hidden=false});
 const aviso=document.getElementById('escaparateLocalAviso');if(aviso)aviso.hidden=false;
 const tipos=document.getElementById('emiTipoFiltros');
 if(tipos&&!tipos.dataset.escaparateActivo){tipos.dataset.escaparateActivo='1';tipos.addEventListener('click',e=>{const b=e.target.closest('[data-emi-tipo]');if(!b)return;emiTipoLocal=b.dataset.emiTipo;pintarTiposOfertaLocal();pintarEmisiones()})}
 activarDetallesOfertas();
 if(v2)return;
 const orden=document.getElementById('emiOrden');
 if(orden)orden.innerHTML='<option value="cierra">Las más al día primero</option><option value="rent">Rentabilidad publicada (mayor primero)</option><option value="min">Mínimo en euros (menor primero)</option><option value="az">Empresa (A-Z)</option>';
 const fechaOferta=ESCAPARATE_LOCAL&&ESCAPARATE_LOCAL.fuente&&ESCAPARATE_LOCAL.fuente.actualizacionLocal
  ?ESCAPARATE_LOCAL.fuente.actualizacionLocal.verificadoEl:'';
 const tit=document.getElementById('emiTitulo');if(tit)tit.textContent='Ofertas observadas'+
  (fechaLocalValida(fechaOferta)?' · revisión '+fechaES(fechaOferta):'');
 const bajada=document.getElementById('emiBajada');if(bajada)bajada.textContent='28 fichas principales con imagen, cifra clave y vigencia editorial. Las referencias de mercado secundario se consultan en su bloque independiente.';
 const mt=document.getElementById('movilOfertasTitulo');if(mt)mt.textContent='Escaparate interno';
 const mb=document.getElementById('movilOfertasBajada');if(mb)mb.textContent='Copia local, sin conexión a producción.';
}

/* ---- descartadas ---- */
function pintarDescartadas(){
 document.getElementById('outlist').innerHTML=FUERA.map(f=>{
  const src=(Array.isArray(f.fuentes)?f.fuentes:[]).map(s=>{const u=urlHttps(s&&s.url);
   return u?`<a href="${escHtml(u)}" target="_blank" rel="noopener nofollow">${escHtml(s&&s.titulo)}</a>`:''}).join('');
  return `<div class="fila"><div class="fn">${escHtml(f.n)} <span class="sello">${escHtml(f.badge)}</span></div>
   <div><p class="por">${escHtml(f.why)}</p>${src?`<div class="fuentes"><span class="fuentes-t">Comprobado en</span>${src}</div>`:''}</div></div>`;
 }).join('');
}
pintarDescartadas();

/* ---- CSV ---- */
function downloadCSV(){
 const h=['Estado','Nombre','Categoria','Tipo','Region','Cadenas','Entrada','Acceso','Web','Descripcion','Por que','Fuentes'];
 const inR=P.map(p=>{const v=p.verificacionLocal;return ['En el radar',p.n,p.cat,p.tipo,p.reg,p.cadenas,p.ticket,
  accesoVisible(p),p.web,v?v.estadoOperativo.detalle:p.nota,v?v.licenciaRegistro.detalle:p.aval,
  v?[...new Set(['estadoOperativo','licenciaRegistro','acceso'].flatMap(c=>(v[c].fuentes||[]).map(f=>urlHttps(f.url))).filter(Boolean))].join(' | '):''];});
 const outR=FUERA.map(f=>['Descartada',f.n,'','','','','','','','',f.badge+': '+f.why,
   (f.fuentes||[]).map(s=>s.url).join(' | ')]);
 const celda=v=>{let s=String(v==null?'':v);if(/^[\t\r\n ]*[=+\-@]/.test(s))s="'"+s;
   return `"${s.replace(/"/g,'""')}"`};
 const rows=[...inR,...outR].map(r=>r.map(celda).join(','));
 /* El ﻿ de delante hace que Excel en español lea los acentos bien. */
 const blob=new Blob(['﻿'+[h.join(','),...rows].join('\n')],{type:'text/csv;charset=utf-8;'});
 const u=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=u;a.download='rwadar.csv';document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u);
}

/* =================================================================
   SONIDO DE INTERFAZ
   -----------------------------------------------------------------
   Sintetizado localmente con Web Audio, sin descargar ficheros ni hacer
   peticiones de red. Usa dos parciales suaves, un ataque de 5 ms y un
   paso bajo para evitar el antiguo efecto metálico de «gota». No incluye
   ruido, paneo aleatorio, reverberación ni barridos largos. Empieza
   apagado, solo responde a acciones deliberadas y el avance automático
   de la lección 3D permanece siempre silencioso.
   ================================================================= */
/* En navegación privada o dentro de un iframe restringido, tocar
   localStorage lanza excepción. Se accede siempre protegido. */
const recuerda={
 leer(k){try{return localStorage.getItem(k)}catch{return null}},
 guardar(k,v){try{localStorage.setItem(k,v)}catch{}}
};

const Sonido=(()=>{
 let ctx=null, maestro=null, seco=null;
 /* Opt-in real: una instalación nueva empieza en silencio. */
 let on=recuerda.leer('rwadar.sonido')==='1';
 let despierto=false;    /* ¿ha habido ya un gesto del usuario? */

 const dar=()=>{
  if(ctx&&ctx.state==='closed'){ctx=null;maestro=null;seco=null;}
  if(!ctx){
   const A=window.AudioContext||window.webkitAudioContext; if(!A) return null;
   try{ ctx=new A(); }catch(e){ return null; }
   maestro=ctx.createGain(); maestro.gain.value=.45;

   /* Un paso bajo en la salida general. Es la diferencia entre "sonido de
      interfaz" y "sonido de aviso de electrodoméstico": por encima de 7
      kHz no hay nada que aporte, y sí mucho que moleste. */
   const suave=ctx.createBiquadFilter();
   suave.type='lowpass'; suave.frequency.value=2800; suave.Q.value=0.7;

   /* NO un DynamicsCompressor: tiene detector de envolvente y un sonido
      de interfaz dura milisegundos. Medido en este mismo grafo, aplastaba
      un transitorio de 0,30 hasta 0,074. Un recortador instantáneo hace
      lo que hacía falta: por debajo de 0,6 es una recta y no toca nada. */
   const tope=ctx.createWaveShaper();
   const PTOS=2048, curva=new Float32Array(PTOS), CODO=0.6;
   for(let i=0;i<PTOS;i++){
    const x=i*2/(PTOS-1)-1, a=Math.abs(x);
    curva[i]=a<=CODO ? x : Math.sign(x)*(CODO+(1-CODO)*Math.tanh((a-CODO)/(1-CODO)));
   }
   tope.curve=curva; tope.oversample='2x';

   maestro.connect(suave); suave.connect(tope); tope.connect(ctx.destination);

   seco=ctx.createGain(); seco.gain.value=1; seco.connect(maestro);
  }
  if(ctx.state==='suspended') ctx.resume().catch(()=>{});
  return ctx;
 };

 const salida=c=>{
  const g=c.createGain(); g.gain.value=1;
  g.connect(seco);
  return g;
 };

 /* Pulso cálido: dos parciales fijos, sin ruido, paneo, azar ni barridos
    de varias octavas. La entrada de 5 ms evita el clic digital y todo el
    gesto termina antes de que compita con la lectura. */
 let ultimoTic=0;
 function pulsoCalido(o){
  if(!on||!despierto||(typeof document!=='undefined'&&document.hidden))return;
  const c=dar();if(!c)return;o=o||{};
  const f=o.f||247,f2=o.f2||f,dur=o.dur||.065,vol=o.vol||.07;
  const t=c.currentTime+(o.retraso||0)+.004,out=salida(c);
  const osc=c.createOscillator(),g=c.createGain();osc.type='sine';
  osc.frequency.setValueAtTime(f,t);osc.frequency.linearRampToValueAtTime(f2,t+Math.min(.03,dur*.45));
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+.005);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  osc.connect(g);g.connect(out);osc.start(t);osc.stop(t+dur+.012);
  const arm=c.createOscillator(),ga=c.createGain();arm.type='triangle';
  arm.frequency.setValueAtTime(f*1.5,t);ga.gain.setValueAtTime(.0001,t);
  ga.gain.linearRampToValueAtTime(vol*.13,t+.006);ga.gain.exponentialRampToValueAtTime(.0001,t+dur*.72);
  arm.connect(ga);ga.connect(out);arm.start(t);arm.stop(t+dur+.012);
 }

 return {
  get activo(){return on},
  set activo(v){
   if(!v){pulsoCalido({f:294,f2:277,dur:.07,vol:.06});on=false;}
   else{on=true;despierto=true;dar();pulsoCalido({f:262,f2:277,dur:.085,vol:.07});}
   recuerda.guardar('rwadar.sonido',v?'1':'0');
  },
  despertar(){ despierto=true; },
  get listo(){ return despierto; },

  /* El golpecito en el dedo.
     En un móvil Android, ocho milisegundos de vibración al pulsar hacen
     por la sensación de respuesta más que cualquier animación. iOS no lo
     permite desde el navegador, así que allí simplemente no ocurre.
     Va atado al mismo interruptor que el sonido para que haya un único
     mando: quien apaga el sonido no quiere que el móvil le conteste. */
  toca(ms){
   if(!on) return;
   try{ if(navigator.vibrate) navigator.vibrate(ms||8); }catch(e){}
  },

  /* Pulsaciones muy breves y próximas entre sí: informan sin convertirse
     en una melodía ni competir con el contenido. */
  toque : ()=>pulsoCalido({f:220,f2:210,dur:.045,vol:.055}),
  /* el tic del deslizador: lo más pequeño que puede sonar sin desaparecer */
  tic   : ()=>{const ahora=performance.now();if(ahora-ultimoTic<45)return;ultimoTic=ahora;pulsoCalido({f:270,dur:.022,vol:.035});},
  filtro: ()=>pulsoCalido({f:294,f2:311,dur:.05,vol:.05}),
  /* Abrir y cerrar se distinguen con movimientos pequeños, nunca con un
     barrido de varias octavas. */
  abrir : ()=>pulsoCalido({f:262,f2:277,dur:.085,vol:.075}),
  /* Cerrar no es un tobogán. La primera versión caía una octava y media
     de golpe y sonaba a decepción, a "se ha estropeado". Cerrar un panel
     no es un fracaso: es dejar algo bien puesto. Así que apenas baja un
     tono, dura poco y tiene cuerpo — el ruido de una tapa que asienta. */
  cerrar: ()=>pulsoCalido({f:330,f2:294,dur:.065,vol:.06}),
  /* Dos pulsos suaves distinguen cambios de selección y descargas. */
  marcar: ()=>{pulsoCalido({f:392,dur:.05,vol:.06});pulsoCalido({f:523,dur:.06,vol:.055,retraso:.038});},
  desmarcar:()=>{pulsoCalido({f:523,dur:.045,vol:.05});pulsoCalido({f:392,dur:.055,vol:.045,retraso:.038});},
  descarga:()=>{pulsoCalido({f:330,dur:.06,vol:.06});pulsoCalido({f:494,dur:.095,vol:.055,retraso:.045});},

  /* Los filtros comparten una única firma sonora para no crear ruido. */
  categoria:()=>pulsoCalido({f:294,f2:311,dur:.05,vol:.05}),

  /* La lección 3D solo responde a un paso elegido manualmente. El avance
     automático nunca reproduce audio. */
  paso(i){
   if(!on||!despierto) return;
   const pasos=[220,233,247,262];
   pulsoCalido({f:pasos[i%4],dur:.055,vol:.045});
  }
 };
})();

(function interruptorSonido(){
 const b=document.getElementById('snd'); if(!b) return;
 const pinta=()=>b.setAttribute('aria-pressed',Sonido.activo?'true':'false');
 pinta();
 b.addEventListener('click',()=>{Sonido.despertar();Sonido.activo=!Sonido.activo; pinta();});
})();

/* Pointerdown se reserva para la respuesta táctil. Los sonidos viven en
   click para que ratón, tacto, Enter, Espacio y lector de pantalla reciban
   exactamente el mismo cue y nunca dos. */
document.addEventListener('pointerdown',ev=>{
 Sonido.despertar();
 const t=ev.target;
 /* la vibración va con cualquier control, incluido el interruptor de
    sonido: es la respuesta física al dedo, no un aviso */
 if(t.closest('button,.blip,input[type=range],select,a')) Sonido.toca(8);
});
document.addEventListener('click',ev=>{
 Sonido.despertar();
 const t=ev.target;
 if(t.closest('#snd')||t.closest('.paso'))return;
 const marca=t.closest('.cmp');
 if(marca) return marca.classList.contains('on')?Sonido.desmarcar():Sonido.marcar();
 if(t.closest('.abrir,.mm,.movil-ficha-abrir,.empresa-visual__abrir'))return Sonido.abrir();
 const conCat=t.closest('[data-cat]');
 if(conCat && CATMETA[conCat.dataset.cat]) return Sonido.categoria();
 if(t.closest('.cerrar')||t.id==='ovl')      return Sonido.cerrar();
 if(t.closest('.csv'))                       return Sonido.descarga();
 if(t.closest('.f,.paso,.btn-p,.btn-s,.hdr-cta,.limpiar,.vista button,.cmpbar .go,.cmpbar .x'))
   return Sonido.toque();
});
document.addEventListener('keydown',()=>{Sonido.despertar();});

/* =================================================================
   REVELADO Y CONTADORES
   -----------------------------------------------------------------
   El estado inicial (invisible) lo aplica JavaScript mediante la clase
   .anim en <html>. Sin JavaScript no hay nada oculto, que es lo que
   protege el pre-renderizado frente al robot de Google.
   ================================================================= */
let observador=null, redSeguridad=null;
const revelar=el=>{el.classList.add('rev','dentro')};

/* Red de seguridad: una animación de entrada nunca puede dejar contenido
   invisible. Si el observador no llega a ejecutarse —pestaña en segundo
   plano, navegador raro, error nuestro— a los dos segundos se muestra todo. */
function todoVisible(){
 document.querySelectorAll('.rev:not(.dentro)').forEach(el=>el.classList.add('dentro'));
}

let yaPulido=false;
function pulir(){
 /* La entrada escalonada es un saludo, no un tic: se hace una sola vez.
    Repetirla en cada filtro cansaría y retrasaría la respuesta, que es
    justo lo contrario de lo que se busca. */
 if(yaPulido) return;
 yaPulido=true;
 if(menos||!('IntersectionObserver' in window)){todoVisible();return}
 document.documentElement.classList.add('anim');
 if(!observador){
   observador=new IntersectionObserver(entradas=>{
     entradas.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('dentro'); observador.unobserve(e.target); }});
   },{threshold:.06,rootMargin:'0px 0px -40px 0px'});
 }
 const alto=window.innerHeight||800;
 document.querySelectorAll('.ficha,.fila,.criterio,.marcador li,.ventaja').forEach((el,i)=>{
   if(el.classList.contains('rev')) return;
   /* Lo que ya está a la vista se muestra sin esconderse primero: así no
      hay parpadeo al filtrar ni dependemos del observador para lo visible. */
   if(el.getBoundingClientRect().top < alto+120){ revelar(el); return; }
   const demora=Math.min(i,7);el.classList.add('rev');
   if(demora)el.classList.add('rev-d'+demora);
   observador.observe(el);
 });
 clearTimeout(redSeguridad);
 redSeguridad=setTimeout(todoVisible,2000);
}

/* Solo se anima la parte numérica: «0 €» y «€0» (inglés) conservan su
   símbolo, y lo que no es una cifra entera («—») no se toca. Antes
   parseInt('€0') daba NaN y «0 €» perdía el € (QA 04/11/2026, n.º 1). */
function partesCifra(texto){
 const m=/^(\D*?)(\d+)(\D*)$/.exec(String(texto==null?'':texto).trim());
 return m?{antes:m[1],valor:parseInt(m[2],10),despues:m[3]}:null;
}
function contarHasta(el,fin){
 if(!el) return;
 const c=partesCifra(fin);
 /* Sin cifra, o con 0, no hay nada que contar: el texto se queda como está. */
 if(!c||c.valor===0)return;
 if(menos){el.textContent=String(fin).trim();return}
 const t0=performance.now(),dur=1100;
 let escrito='';
 const pinta=v=>{escrito=c.antes+v+c.despues;el.textContent=escrito;};
 const tic=t=>{
   /* Si otra parte de la página reescribe la cifra (datos en vivo, idioma),
      manda ese texto: el contador se retira. */
   if(el.textContent!==escrito) return;
   const p=Math.min(1,(t-t0)/dur), e=1-Math.pow(1-p,3);
   pinta(Math.round(c.valor*e));
   if(p<1) requestAnimationFrame(tic);
 };
 pinta(0);
 requestAnimationFrame(tic);
}

(function contadores(){
 const m=document.querySelector('.marcador'); if(!m) return;
 if(menos||!('IntersectionObserver' in window)) return;
 /* La cifra se lee al entrar en pantalla, no al cargar: así cuenta hasta el
    dato vigente y en el idioma que se esté viendo. */
 const io=new IntersectionObserver(es=>{
   if(es[0].isIntersecting){ m.querySelectorAll('.n').forEach(el=>contarHasta(el,el.textContent)); io.disconnect(); }
 },{threshold:.4});
 io.observe(m);
})();

/* La barra de filtros del radar (.barra, sticky) se pega bajo la cabecera
   real: su alto cambia (una o dos filas, idioma, zoom), así que se mide con
   ResizeObserver y se publica en --alto-cabecera. Al terminar la lista de
   plataformas, el final de la lista la empuja hacia arriba, como un sticky
   dentro de su propio contenedor; así no se queda fija sobre Descartadas,
   Academy ni el pie (QA 04/11/2026, n.º 8). En el móvil no es sticky. */
(function barraFiltros(){
 const hdr=document.querySelector('.hdr'),barra=document.querySelector('.barra');
 const raiz=document.documentElement;
 if(!hdr||!barra||!raiz||!raiz.style||typeof raiz.style.setProperty!=='function'||typeof getComputedStyle!=='function')return;
 let pendiente=false;
 function empujar(){
  pendiente=false;
  const lista=document.getElementById('plataformasResultados');
  if(!lista||getComputedStyle(barra).position!=='sticky'){barra.classList.remove('barra-empujada');return;}
  const empuje=Math.min(0,Math.round(lista.getBoundingClientRect().bottom-(hdr.offsetHeight||0)-barra.offsetHeight));
  barra.style.setProperty('--barra-empuje',empuje+'px');
  barra.classList.toggle('barra-empujada',empuje<0);
 }
 function medir(){raiz.style.setProperty('--alto-cabecera',(hdr.offsetHeight||0)+'px');empujar();}
 /* Al filtrar con la lista desplazada, la lista encoge y su final queda por
    encima de la barra: sin esto la barra seguía fija sobre Academy y, al
    primer desplazamiento, se iba con el foco dentro. Si se filtra desde la
    barra, la vista vuelve al principio de los resultados, justo bajo ella. */
 function listaCambia(){
  const lista=document.getElementById('plataformasResultados');
  if(lista&&barra.contains(document.activeElement)&&getComputedStyle(barra).position==='sticky'){
   const tope=(hdr.offsetHeight||0)+barra.offsetHeight,caja=lista.getBoundingClientRect();
   const y=Math.max(0,window.scrollY+caja.top-tope);
   if(caja.top<tope-1&&caja.bottom<(window.innerHeight||0)){try{window.scrollTo({top:y,behavior:'instant'});}catch(e){window.scrollTo(0,y);}}
  }
  empujar();
 }
 if(typeof ResizeObserver==='function'){
  new ResizeObserver(medir).observe(hdr);
  const lista=document.getElementById('plataformasResultados');
  if(lista)new ResizeObserver(listaCambia).observe(lista);
 }
 window.addEventListener('scroll',()=>{if(!pendiente){pendiente=true;requestAnimationFrame(empujar);}},{passive:true});
 window.addEventListener('resize',medir,{passive:true});
 medir();
})();

(function cabeceraElevada(){
 const h=document.querySelector('.hdr'); if(!h) return;
 let ultimo=null;
 const mirarScroll=()=>{
   const debe=window.scrollY>8;
   if(debe!==ultimo){ h.classList.toggle('elevada',debe); ultimo=debe; }
 };
 addEventListener('scroll',mirarScroll,{passive:true});
 mirarScroll();
})();

/* =================================================================
   AL DÍA SIN VOLVER A PUBLICAR
   -----------------------------------------------------------------
   La página se sirve pre-renderizada: rápida, y el robot de Google la
   lee sin ejecutar nada. Pero ese HTML es una foto del momento en que
   se publicó. En cuanto carga, la página pregunta a la base de datos
   y, si el registro ha cambiado desde entonces, se actualiza sola.

   Resultado: el visitante nunca ve una versión vieja aunque nadie
   haya vuelto a publicar el sitio. Si la base no responde, no pasa
   nada: se queda la foto, que es contenido válido.
   ================================================================= */
const API='https://exgpmjpaaebyoolpwced.supabase.co/rest/v1';
const CLAVE_PUB='sb_publishable_IjVAwxotgiimcVqI3Nnn3Q_dk7UOB5n';

/* La huella incluye todos los campos visibles. La anterior omitía textos y
   fuentes, de modo que una corrección editorial podía no llegar al visitante. */
const huella=(a,b,e=[])=>JSON.stringify({
 p:a.map(x=>[x.slug,x.n,x.cat,x.tipo,x.reg,x.cadenas,x.ticket,x.acceso,x.web,x.aval,x.nota,x.ver,x.verificacionLocal,x.revisionId])
     .sort((x,y)=>String(x[0]).localeCompare(String(y[0]),'es')),
 f:b.map(x=>[x.n,x.badge,x.why,(Array.isArray(x.fuentes)?x.fuentes:[]).map(s=>[s.url,s.titulo])])
    .sort((x,y)=>String(x[0]).localeCompare(String(y[0]),'es')),
 e:e.map(x=>x.catalogo?['catalogo',x]:[x.s,x.t,x.res,x.pl,x.plw,x.cat,x.ub,x.mon,x.min,x.obj,x.cap,x.pct,
       x.rent,x.plazo,x.tipo,x.cierra,x.abre,x.est,x.cont,x.esNo,x.vinc,x.rest,x.rentNo,x.url,x.ver,x.pat])
    .sort((x,y)=>String(x[0]).localeCompare(String(y[0]),'es'))
});

function textoDato(v,nombre,max){
 if(typeof v!=='string')throw new Error(nombre+' no es texto');
 const s=v.trim();if(!s||s.length>max)throw new Error(nombre+' no válido');return s;
}
/* El tipo de empresa es un valor fijo del catálogo (rwa_actor). «Marketplace» se
   lee «Mercado de compraventa» (LISTA-FINAL fila 19); el valor de la base no cambia. */
function tipoEmpresaVisible(t){return t==='Marketplace'?'Mercado de compraventa':t}
function plataformaRemota(p){
 const x={n:textoDato(p.nombre,'nombre',120),cat:textoDato(p.categoria,'categoría',80),
  tipo:tipoEmpresaVisible(textoDato(p.actor,'actor',80)),reg:textoDato(p.region,'región',100),
  cadenas:textoDato(p.cadenas,'cadenas',160),ticket:textoDato(p.ticket,'entrada',40),
  acceso:textoDato(p.acceso,'acceso',40),web:urlHttps(p.web),
  aval:textoDato(p.aval,'aval',2000),nota:textoDato(p.nota,'descripción',3000),
  ver:textoDato(p.verificada_el,'fecha',10)};
 if(!Object.prototype.hasOwnProperty.call(CATMETA,x.cat)||!ACCESOS.includes(x.acceso)||!TICKETS.includes(x.ticket)||
    !x.web||!/^\d{4}-\d{2}-\d{2}$/.test(x.ver))throw new Error('plataforma fuera del contrato público');
 return x;
}
function descarteRemoto(x){
 const fuentes=Array.isArray(x.fuentes)?x.fuentes.map(s=>{
  const url=urlHttps(s&&s.url),titulo=textoDato(s&&s.titulo,'título de fuente',300);
  if(!url)throw new Error('fuente sin HTTPS');return {url:url,titulo:titulo};
 }):[];
 return {n:textoDato(x.nombre,'nombre descartado',120),
  badge:textoDato(x.etiqueta_descarte,'etiqueta',100),
  why:textoDato(x.motivo_descarte,'motivo',3000),fuentes:fuentes};
}

const textoOpcional=(v,nombre,max)=>v==null?'':textoDato(v,nombre,max);
const numeroRemoto=(v,nombre,def=0)=>{if(v==null)return def;const n=Number(v);
 if(!Number.isFinite(n))throw new Error(nombre+' no es numérico');return n};
const booleanoOpcional=(v,nombre)=>{if(v==null)return null;
 if(typeof v!=='boolean')throw new Error(nombre+' no es booleano');return v};
function emisionRemota(e){
 const estado=textoDato(e.estado,'estado de emisión',30);
 if(!['abierta','programada','en_estudio'].includes(estado))throw new Error('estado de emisión no público');
 const x={
  s:textoDato(e.slug,'slug de emisión',140),t:textoDato(e.titulo,'título de emisión',240),
  res:textoOpcional(e.resumen,'resumen de emisión',3000),pl:textoDato(e.plataforma,'plataforma de emisión',120),
  plw:urlHttps(e.plataforma_web),cat:textoDato(e.categoria,'categoría de emisión',80),
  ub:textoOpcional(e.ubicacion,'ubicación de emisión',160),mon:textoDato(e.moneda,'moneda de emisión',12),
  min:numeroRemoto(e.ticket_minimo,'entrada mínima'),obj:numeroRemoto(e.objetivo,'objetivo'),
  cap:numeroRemoto(e.captado,'captado'),pct:numeroRemoto(e.porcentaje,'porcentaje'),
  rent:e.rentabilidad==null?null:numeroRemoto(e.rentabilidad,'rentabilidad'),
  plazo:e.plazo_meses==null?null:numeroRemoto(e.plazo_meses,'plazo'),
  tipo:textoOpcional(e.tipo_rendimiento,'tipo de rendimiento',100),
  cierra:textoOpcional(e.cierra_el,'cierre de emisión',10),abre:textoOpcional(e.abre_en,'apertura de emisión',40),
  est:estado,cont:e.continua===true,esNo:booleanoOpcional(e.disponible_es,'disponibilidad en España'),
  vinc:booleanoOpcional(e.vinculante,'carácter vinculante'),
  rest:textoOpcional(e.acceso_restringido,'restricción de acceso',300),
  rentNo:e.rentabilidad_no_publicada===true,url:urlHttps(e.url),
  ver:textoDato(e.verificada_el,'fecha de emisión',10),pat:e.patrocinada===true,
 };
 if(!Object.prototype.hasOwnProperty.call(CATMETA,x.cat)||!x.plw||!x.url||
    !/^\d{4}-\d{2}-\d{2}$/.test(x.ver)||
    (x.cierra&&!/^\d{4}-\d{2}-\d{2}$/.test(x.cierra))||
    [x.min,x.obj,x.cap,x.pct].some(n=>n<0)||x.min>1e12||x.obj>1e15||x.cap>1e15||x.pct>10000)
   throw new Error('emisión fuera del contrato público');
 return x;
}

const ESTADOS_VERIFICACION_LOCAL={
 estadoOperativo:new Set(['observada','no_verificable']),
 licenciaRegistro:new Set(['confirmada_regulador','confirmada_documento_producto',
  'no_aplica_plataforma','no_verificable','sin_registro_declarado']),
 acceso:new Set(['confirmado_condicionado','no_aplica_plataforma','no_verificable'])
};
const ETIQUETAS_VERIFICACION_LOCAL={
 observada:'Activa al revisarla',no_verificable:'No verificable',
 confirmada_regulador:'Registro confirmado',
 confirmada_documento_producto:'Consta en el documento del producto',
 no_aplica_plataforma:'No aplica a la plataforma',
 sin_registro_declarado:'Sin registro declarado',
 confirmado_condicionado:'Con requisitos'
};
function etiquetaVerificacionLocal(estado){
 return ETIQUETAS_VERIFICACION_LOCAL[estado]||'No verificado';
}
function fuenteVerificacionLocal(fuente,fecha,contexto){
 const x={
  id:textoDato(fuente&&fuente.id,contexto+' id',120),
  tipo:textoDato(fuente&&fuente.tipo,contexto+' tipo',40),
  titulo:textoDato(fuente&&fuente.titulo,contexto+' título',300),
  url:urlHttps(fuente&&fuente.url),
  primaria:fuente&&fuente.primaria===true,
  consultadaEl:textoDato(fuente&&fuente.consultadaEl,contexto+' fecha',10)
 };
 if(!x.url||!x.primaria||x.consultadaEl!==fecha)throw new Error(contexto+' fuera del contrato local');
 return x;
}
function campoVerificacionLocal(campo,nombre,fecha){
 const estados=ESTADOS_VERIFICACION_LOCAL[nombre];
 if(!campo||!estados||!estados.has(campo.estado))throw new Error(nombre+' local fuera de contrato');
 const detalle=textoDato(campo.detalle,nombre+' detalle',3000);
 if(detalle.length<24||!Array.isArray(campo.fuentes)||!campo.fuentes.length)
  throw new Error(nombre+' local incompleto');
 return {estado:campo.estado,detalle,
  fuentes:campo.fuentes.map((fuente,indice)=>fuenteVerificacionLocal(
   fuente,fecha,nombre+' fuente '+indice))};
}
function validarVerificacionLocal(verificacion,fechaEsperada=FECHA_VERIFICACION_LOCAL){
 if(!verificacion||verificacion.verificadoEl!==fechaEsperada||
     verificacion.conservaFechaCanonica!==true)
  throw new Error('verificación local ausente, desactualizada o no conservadora');
 const x={
  verificadoEl:verificacion.verificadoEl,
  conservaFechaCanonica:true,
  estadoOperativo:campoVerificacionLocal(verificacion.estadoOperativo,'estadoOperativo',verificacion.verificadoEl),
  licenciaRegistro:campoVerificacionLocal(verificacion.licenciaRegistro,'licenciaRegistro',verificacion.verificadoEl),
  acceso:campoVerificacionLocal(verificacion.acceso,'acceso',verificacion.verificadoEl),
  alertasCriticas:[]
 };
 if(!Array.isArray(verificacion.alertasCriticas)||!verificacion.alertasCriticas.length)
  throw new Error('alertas críticas locales ausentes');
 x.alertasCriticas=verificacion.alertasCriticas.map((alerta,indice)=>{
  if(!alerta||!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(alerta.codigo||''))
   throw new Error('código de alerta local no válido');
  const detalle=textoDato(alerta.detalle,'alerta local',3000);
  if(detalle.length<24||!Array.isArray(alerta.fuentes)||!alerta.fuentes.length)
   throw new Error('alerta crítica local incompleta');
  return {codigo:alerta.codigo,detalle,
   fuentes:alerta.fuentes.map((fuente,j)=>fuenteVerificacionLocal(
    fuente,verificacion.verificadoEl,'alerta '+indice+' fuente '+j))};
 });
 return x;
}

function plataformaCatalogoRemota(p,fecha){
 const x=plataformaRemota(p);
 x.revisionId=textoDato(p.revision_id,'revisión de plataforma',36);
 x.slug=textoDato(p.slug,'slug de plataforma',140);
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.slug))throw new Error('slug de plataforma no válido');
 x.verificacionLocal=validarVerificacionLocal(p.verificacion_local,fecha);
 if(p.version_esquema===2)Object.assign(x,metadatosCatalogoV2(p));
 return x;
}

function cifraCatalogoRemota(valor,nombre){
 if(valor==null)return null;
 if(!valor||typeof valor!=='object'||Array.isArray(valor))throw new Error(nombre+' no es un objeto');
 const x={};
 for(const clave of ['mostrado','mostrada','literal','unidad']){
  if(valor[clave]!=null)x[clave]=textoDato(valor[clave],nombre+' '+clave,500);
 }
 if(!Object.keys(x).length)throw new Error(nombre+' vacío');
 return x;
}
function ofertaCatalogoRemota(e,fecha){
 if(e?.patrocinada!==false)throw new Error('patrocinio no habilitado en el catálogo editorial gratuito');
 const estado=textoDato(e.estado_revision,'estado de oferta',40);
 if(!['actual','no_verificable','fuentes_en_conflicto'].includes(estado))throw new Error('estado de oferta no público');
 const metricas=Array.isArray(e.metricas)?e.metricas.map((m,i)=>({
  etiqueta:textoDato(m&&m.etiqueta,'métrica '+i+' etiqueta',120),
  valor:textoDato(m&&m.valor,'métrica '+i+' valor',500)})):[];
 const avisos=Array.isArray(e.avisos)?e.avisos.map((a,i)=>{
  if(typeof a==='string')return textoDato(a,'aviso '+i,1000);
  return {texto:textoDato(a&&a.texto,'aviso '+i,1000),
   tono:a&&typeof a.tono==='string'?textoDato(a.tono,'tono '+i,30):'',
   esAntiguedad:a&&a.esAntiguedad===true,
   verificadaEl:a&&a.verificadaEl==null?e.verificada_el:textoDato(a.verificadaEl,'fecha de aviso',10)};
 }):[];
 const fuentes=Array.isArray(e.fuentes_actuales)?e.fuentes_actuales.map((u,i)=>{
  const url=urlHttps(u);if(!url)throw new Error('fuente de oferta '+i+' no HTTPS');return url;
 }):[];
 const vigencia=Number(e.vigencia_dias),disponible=booleanoOpcional(e.disponible_es,'disponibilidad en España');
 const eu=booleanoOpcional(e.eu,'ámbito UE'),puntuacion=e.puntuacion==null?null:numeroRemoto(e.puntuacion,'puntuación');
 const x={catalogo:true,revisionId:textoDato(e.revision_id,'revisión de oferta',36),slug:textoDato(e.slug,'slug de oferta',180),
  tipo:textoDato(e.tipo,'tipo de oferta',30),titulo:textoDato(e.titulo,'título de oferta',180),
  plataformaSlug:textoDato(e.plataforma_slug,'slug de proveedor',140),
  plataformaNombre:textoDato(e.plataforma_nombre,'proveedor',120),
  categoria:textoDato(e.categoria,'categoría de oferta',80),
  pais:e.pais==null?null:textoDato(e.pais,'país de oferta',100),
  resumen:textoDato(e.resumen,'resumen de oferta',3000),url:urlHttps(e.url),
  verificadaEl:textoDato(e.verificada_el,'fecha de oferta',10),vigenciaDias:vigencia,
  permanente:e.permanente===true,disponibleEs:disponible,eu:eu,
  fueraLadrillo:e.fuera_ladrillo===true,puntuacion:puntuacion,
  rentabilidad:cifraCatalogoRemota(e.rentabilidad,'rentabilidad'),
  precio:cifraCatalogoRemota(e.precio,'precio'),metricas:metricas,avisos:avisos,
  estadoRevision:estado,fuentesActuales:fuentes,patrocinada:e.patrocinada===true};
 const documentacion=e.documentacion==null?null:documentacionOfertaLocal({documentacion:e.documentacion});
 if(e.documentacion!=null&&!documentacion)throw new Error('documentación de oferta fuera del contrato público');
 x.documentacion=documentacion?{
  revisadaEl:documentacion.revisadaEl,descripcion:documentacion.descripcion,fuentes:[...documentacion.fuentes],
  caracteristicas:documentacion.caracteristicas.map(({etiqueta,valor})=>({etiqueta,valor})),
  referencias:documentacion.referencias.map(({etiqueta,valor,fechaDato,fechaConsulta,fuente,alcance})=>
   ({etiqueta,valor,fechaDato,fechaConsulta,fuente,alcance}))}:null;
 if(e.version_esquema===2){
  Object.assign(x,metadatosCatalogoV2(e));x.coleccion=e.coleccion;
  if(!['principales','secundario','en_camino'].includes(x.coleccion)||!['rendimiento','valor'].includes(x.tipo)||!x.documentacion||
    (x.coleccion!=='principales'&&(estado!=='no_verificable'||x.precio!==null||x.rentabilidad!==null||
     x.puntuacion!==null||x.disponibleEs!==null)))throw new Error('colección fuera del contrato documental');
 }
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.slug)||!x.url||!fechaOfertaPublicaValida(x.verificadaEl,fecha)||
    !Number.isInteger(vigencia)||vigencia<1||vigencia>7||!Object.hasOwn(CATMETA,x.categoria)||
    !metricas.length||!avisos.length||!fuentes.length||
    (estado!=='actual'&&(x.rentabilidad!==null||x.precio!==null)))
  throw new Error('oferta fuera del contrato público');
 return x;
}
function fechaOfertaPublicaValida(fecha,fechaRadar){
 return fechaLocalValida(fecha)&&fechaLocalValida(fechaRadar)&&
  fecha<=new Date().toISOString().slice(0,10)&&
  Date.parse(fecha+'T00:00:00Z')<=Date.parse(fechaRadar+'T00:00:00Z')+7*86400000;
}
function validarRevisionCatalogo(revisiones){
 const ids=new Set(revisiones);
 if(ids.size!==1||!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test([...ids][0]||''))
  throw new Error('lote público con revisiones mezcladas o sin revision_id');
}
function validarLoteCatalogoRemoto(plataformas,ofertas){
 if(!Array.isArray(plataformas)||plataformas.length!==26||
    !Array.isArray(ofertas)||ofertas.length!==28)throw new Error('lote público incompleto');
 if(new Set(plataformas.map(p=>p.slug)).size!==26||new Set(ofertas.map(o=>o.slug)).size!==28)
  throw new Error('lote público con slugs duplicados');
 validarRevisionCatalogo([...plataformas,...ofertas].map(x=>x.revision_id));
 const fechas=new Set(plataformas.map(p=>p.verificacion_local&&p.verificacion_local.verificadoEl));
 if(fechas.size!==1)throw new Error('lote público con fechas mezcladas');
 const fecha=[...fechas][0];
 if(!fechaLocalValida(fecha))throw new Error('fecha de lote inválida');
 const base=Date.parse(fecha+'T00:00:00Z'),hoy=new Date(),hoyUTC=Date.UTC(hoy.getUTCFullYear(),hoy.getUTCMonth(),hoy.getUTCDate());
 const edad=Math.floor((hoyUTC-base)/86400000);
 if(!Number.isFinite(base)||edad<0||edad>7)throw new Error('lote público futuro o caducado');
 if(!ofertas.every(o=>fechaOfertaPublicaValida(o.verificada_el,fecha)))throw new Error('fecha individual de oferta inválida');
 return fecha;
}

function metadatosCatalogoV2(fila){
 return {version_esquema:fila.version_esquema,plataformas_esperadas:fila.plataformas_esperadas,
  ofertas_esperadas:fila.ofertas_esperadas,colecciones_esperadas:{...fila.colecciones_esperadas},
  verificado_lote_el:fila.verificado_lote_el,vigencia_lote_dias:fila.vigencia_lote_dias};
}
function validarManifiestoCatalogoV2(plataformas,ofertas){
 /* Desde el 02/11/2026 un lote puede tener menos ofertas que el anterior
    (decisión de Víctor). Un lote cortado se sigue rechazando porque debe
    traer exactamente las filas que declara su propio manifiesto. */
 const p=Array.isArray(plataformas)&&plataformas[0];
 const plataformasEsperadas=p&&p.plataformas_esperadas,ofertasEsperadas=p&&p.ofertas_esperadas;
 const esperadas=p&&p.colecciones_esperadas;
 if(!Number.isInteger(plataformasEsperadas)||plataformasEsperadas<1||plataformasEsperadas>256||
    !Number.isInteger(ofertasEsperadas)||ofertasEsperadas<1||ofertasEsperadas>1000||
    !esperadas||Array.isArray(esperadas)||Object.keys(esperadas).length!==3||
    !['principales','secundario','en_camino'].every(c=>Number.isInteger(esperadas[c])&&esperadas[c]>=0)||
    !(esperadas.principales>0)||
    Object.values(esperadas).reduce((a,b)=>a+b,0)!==ofertasEsperadas||
    !Array.isArray(plataformas)||plataformas.length!==plataformasEsperadas||!Array.isArray(ofertas)||ofertas.length!==ofertasEsperadas||
    new Set(plataformas.map(p=>p.slug)).size!==plataformasEsperadas||new Set(ofertas.map(o=>o.slug)).size!==ofertasEsperadas)
  throw new Error('V2: lote incompleto o duplicado');
 const filas=[...plataformas,...ofertas],fecha=filas[0].verificado_lote_el,plazo=filas[0].vigencia_lote_dias;
 if(!fechaLocalValida(fecha)||!Number.isInteger(plazo)||plazo<1||plazo>7)
  throw new Error('V2: fecha o plazo del lote inválido');
 if(!filas.every(f=>f.version_esquema===2&&f.plataformas_esperadas===plataformasEsperadas&&f.ofertas_esperadas===ofertasEsperadas&&
    f.verificado_lote_el===fecha&&f.vigencia_lote_dias===plazo&&f.colecciones_esperadas&&
    !Array.isArray(f.colecciones_esperadas)&&Object.keys(f.colecciones_esperadas).length===3&&
    Object.keys(esperadas).every(c=>f.colecciones_esperadas[c]===esperadas[c])))
  throw new Error('V2: metadatos mezclados o ajenos al manifiesto');
 if(!Object.keys(esperadas).every(c=>ofertas.filter(o=>o.coleccion===c).length===esperadas[c]))
  throw new Error('V2: colección incompleta');
 const hoy=new Date(),edad=Math.floor((Date.UTC(hoy.getUTCFullYear(),hoy.getUTCMonth(),hoy.getUTCDate())-
  Date.parse(fecha+'T00:00:00Z'))/86400000);
 if(!Number.isFinite(edad)||edad<0)throw new Error('V2: lote fechado en el futuro');
 return fecha;
}
function recordarManifiestoCatalogoV2(plataformas){
 const p=plataformas[0];
 MANIFIESTO_CATALOGO_V2_ACEPTADO={plataformas:p.plataformas_esperadas,ofertas:p.ofertas_esperadas,
  colecciones:{...p.colecciones_esperadas}};
}
function edadLoteDias(fecha){
 const hoy=new Date();
 return Math.floor((Date.UTC(hoy.getUTCFullYear(),hoy.getUTCMonth(),hoy.getUTCDate())-Date.parse(fecha+'T00:00:00Z'))/86400000);
}
function validarLoteCatalogoRemotoV2(plataformas,ofertas){
 const fecha=validarManifiestoCatalogoV2(plataformas,ofertas);
 validarRevisionCatalogo([...plataformas,...ofertas].map(x=>x.revision_id));
 plataformas.forEach(p=>validarVerificacionLocal(p.verificacion_local,fecha));
 ofertas.forEach(o=>ofertaCatalogoRemota(o,fecha));
 return fecha;
}

/* El pre-render es la última copia completa publicada. Si envejece mientras
   Supabase falla o no responde con un lote completo, se sigue mostrando con
   el aviso de revisión pendiente. Solo se elimina si está dañada, fechada en
   el futuro o si llega la orden expresa de retirada. */
function comprobarCatalogoEmbebido(){
 if(CATALOGO_EMBEBIDO_BLOQUEADO)return false;
 const catalogo=EMI.filter(e=>e&&e.catalogo===true);
 if(!catalogo.length)return true; /* fuente interna anterior, aún sin lote */
 try{
  if(EMI.length!==catalogo.length)throw new Error('lote embebido mezclado');
  const fecha=validarManifiestoCatalogoV2(P,catalogo);
  validarRevisionCatalogo([...P,...catalogo].map(x=>x.revisionId));
  const fechas=new Set(P.map(p=>p.verificacionLocal&&p.verificacionLocal.verificadoEl));
  if(fechas.size!==1)throw new Error('fechas embebidas mezcladas');
  if([...fechas][0]!==fecha)throw new Error('fecha de revisión distinta del manifiesto');
  const base=Date.parse(fecha+'T00:00:00Z'),hoy=new Date();
  const hoyUTC=Date.UTC(hoy.getUTCFullYear(),hoy.getUTCMonth(),hoy.getUTCDate());
  const edad=Math.floor((hoyUTC-base)/86400000);
  if(!fechaLocalValida(fecha)||!Number.isFinite(base)||edad<0)
   throw new Error('lote embebido fechado en el futuro');
  P.forEach(p=>validarVerificacionLocal(p.verificacionLocal,fecha));
  if(!catalogo.every(o=>ofertaLocalValida(o)&&fechaOfertaPublicaValida(o.verificadaEl,fecha)&&
      Array.isArray(o.metricas)&&o.metricas.length&&Array.isArray(o.avisos)&&o.avisos.length&&
      Array.isArray(o.fuentesActuales)&&o.fuentesActuales.length&&o.fuentesActuales.every(urlHttps)&&
      documentacionOfertaLocal(o)&&o.documentacion&&
      (o.estadoRevision==='actual'||(o.rentabilidad==null&&o.precio==null))&&
      (o.coleccion==='principales'||(o.estadoRevision==='no_verificable'&&o.puntuacion==null&&o.disponibleEs==null))))
   throw new Error('oferta embebida fuera de contrato');
  CATALOGO_CADUCADO=edad>P[0].vigencia_lote_dias;
  recordarManifiestoCatalogoV2(P);
  /* El snapshot trae el valor de la base; se enseña como el lote remoto. */
  P.forEach(p=>{p.tipo=tipoEmpresaVisible(p.tipo)});
  return true;
 }catch(_){
  P.length=0;EMI.length=0;CATALOGO_EMBEBIDO_BLOQUEADO=true;
  return false;
 }
}

function plataformaDesdeEscaparate(p){
 const x={n:textoDato(p.nombre,'nombre local',120),cat:textoDato(p.categoria,'categoría local',80),
  tipo:tipoEmpresaVisible(textoDato(p.actor,'actor local',80)),reg:textoDato(p.region,'región local',100),
  cadenas:textoDato(p.cadenas,'cadenas locales',160),ticket:textoDato(p.ticket,'entrada local',40),
  acceso:textoDato(p.acceso,'acceso local',40),web:urlHttps(p.web),
  aval:textoDato(p.aval,'aval local',2000),nota:textoDato(p.nota,'descripción local',3000),
  ver:textoDato(p.verificadaEl||p.verificada_el,'fecha local',10),
  slug:textoDato(p.slug,'slug local',140),
  verificacionLocal:validarVerificacionLocal(p.verificacionLocal)};
 if(!Object.hasOwn(CATMETA,x.cat)||!ACCESOS.includes(x.acceso)||!TICKETS.includes(x.ticket)||
    !x.web||!fechaLocalValida(x.ver))throw new Error('plataforma local fuera de contrato');
 return x;
}
function descarteDesdeEscaparate(x){
 const fuentes=(Array.isArray(x.fuentes)?x.fuentes:[]).map(s=>{
  const url=urlHttps(s&&s.url),titulo=textoDato(s&&s.titulo,'fuente local',300);
  if(!url)throw new Error('fuente local sin HTTPS');return {url,titulo};
 });
 return {n:textoDato(x.nombre||x.n,'nombre descartado local',120),
  badge:textoDato(x.etiqueta||x.etiquetaDescarte||x.etiqueta_descarte||x.badge,'etiqueta descartada local',100),
  why:textoDato(x.motivo||x.motivoDescarte||x.motivo_descarte||x.why,'motivo descartado local',3000),fuentes};
}
function validarEscaparateLocal(d){
 if(!d||d.versionEsquema!==1||!d.fuente||!urlHttps(d.fuente.url))throw new Error('cabecera local no válida');
 for(const [nombre,n] of [['plataformas',26],['descartes',4],['ofertas',28],['secundario',24],['exclusionesOfertas',15]]){
  if(!Array.isArray(d[nombre])||d[nombre].length!==n)throw new Error(nombre+' no contiene '+n+' elementos');
 }
 if(!d.ofertas.every(ofertaLocalValida)||!d.secundario.every(ofertaLocalValida))throw new Error('oferta local fuera de contrato');
 const plataformas=d.plataformas.map(plataformaDesdeEscaparate);
 if(new Set(plataformas.map(p=>p.slug)).size!==26)throw new Error('slug de plataforma local duplicado');
 const slugs=[...d.ofertas,...d.secundario].map(x=>x.slug);
 if(new Set(slugs).size!==slugs.length)throw new Error('slug local duplicado');
 if(!d.exclusionesOfertas.every(x=>textoLocal(x.nombre)&&textoLocal(x.motivo)&&urlHttps(x.urlFuente)))
  throw new Error('exclusión local fuera de contrato');
 return d;
}
function validarEscaparateLocalV2(d){
 if(!d||d.versionEsquema!==2||typeof d.preparado!=='boolean'||
    !d.fuente||d.fuente.url!=='https://rwadar.pages.dev/'||!fechaLocalValida(d.fuente.revision)||
    !(d.preparado?/^\d{4}-\d{2}-\d{2}(?:\.\d{1,2})?-v2$/.test(d.lote||''):d.lote==='snapshot-publicable')||
    !Array.isArray(d.plataformas)||!Array.isArray(d.ofertas)||!Array.isArray(d.descartes)||!d.descartes.length)
  throw new Error('cabecera de snapshot local V2 no válida');
 /* El servidor entrega la misma forma camelCase que el JS público. La
    adaptamos al contrato REST probado para validar tipos, fuentes y lote. */
 const remotas=d.plataformas.map(p=>({...p,nombre:p.n,categoria:p.cat,actor:p.tipo,region:p.reg,
  verificada_el:p.ver,revision_id:p.revisionId,verificacion_local:p.verificacionLocal}));
 const ofertasRemotas=d.ofertas.map(o=>({...o,revision_id:o.revisionId,plataforma_slug:o.plataformaSlug,
  plataforma_nombre:o.plataformaNombre,verificada_el:o.verificadaEl,vigencia_dias:o.vigenciaDias,
  disponible_es:o.disponibleEs,fuera_ladrillo:o.fueraLadrillo,estado_revision:o.estadoRevision,fuentes_actuales:o.fuentesActuales}));
 const fecha=validarLoteCatalogoRemotoV2(remotas,ofertasRemotas);
 if(fecha!==d.fuente.revision||(d.preparado&&d.lote!==fecha+'-v2'))throw new Error('fecha del snapshot local incoherente');
 const plataformas=remotas.map(p=>plataformaCatalogoRemota(p,fecha));
 const ofertas=ofertasRemotas.map(o=>ofertaCatalogoRemota(o,fecha));
 if(plataformas.some(p=>!fechaLocalValida(p.ver)||p.ver>fecha))throw new Error('fecha canónica de plataforma no válida');
 const descartes=d.descartes.map(descarteDesdeEscaparate);
 /* Cuántas descartadas hay lo dice el catálogo (04/11/2026, ARTEX pasa a Descartadas). */
 if(new Set(descartes.map(x=>x.n)).size!==descartes.length||descartes.some(x=>!x.fuentes.length))
  throw new Error('descartes del snapshot local sin fuentes o duplicados');
 return {plataformas,ofertas,descartes,fecha,preparado:d.preparado,lote:d.lote};
}
function validarManifiestoEditorialLocal(m){
 if(!m||m.versionEsquema!==2||m.etiquetaVisibleObligatoria!=='Ilustración editorial'||
    !Array.isArray(m.archivos)||m.archivos.length!==4||!Array.isArray(m.fichas))
  throw new Error('manifiesto editorial local fuera de contrato');
 const categorias=new Set(),archivos=new Set(),porCategoria={};
 for(const x of m.archivos){
  if(!x||!Object.hasOwn(CATMETA,x.categoria)||categorias.has(x.categoria)||
     !/^[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/.test(x.archivo||'')||archivos.has(x.archivo)||
     x.ancho!==640||x.alto!==440||!Number.isInteger(x.bytes)||x.bytes<=1024||
     !/^[a-f0-9]{64}$/.test(x.hashSha256||'')||
     !textoLocal(x.alt).startsWith(m.etiquetaVisibleObligatoria+' '))
   throw new Error('entrada editorial local fuera de contrato');
  categorias.add(x.categoria);archivos.add(x.archivo);porCategoria[x.categoria]=x;
 }
 const porSlug=new Map();
 for(const x of m.fichas){
  const slug=textoLocal(x&&x.slug);
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||porSlug.has(slug)||!Object.hasOwn(CATMETA,x.categoria)||
     x.archivo!=='oferta-'+slug+'.webp'||x.ancho!==960||x.alto!==660||!Number.isInteger(x.bytes)||x.bytes<=1024||
     !/^[a-f0-9]{64}$/.test(x.hashSha256||'')||!textoLocal(x.alt).startsWith(m.etiquetaVisibleObligatoria+' '))
   throw new Error('ficha editorial local fuera de contrato');
  porSlug.set(slug,x);
 }
 return {etiqueta:m.etiquetaVisibleObligatoria,porCategoria,porSlug};
}
async function cargarEscaparateLocal(){
 if(!MODO_LOCAL_SEGURO)return false;
 document.body.classList.add('modo-local-seguro');
 /* Se conserva la última copia completa mientras llegan los dos recursos.
    Ningún array compartido cambia antes de validar el snapshot entero. */
 const aviso=document.getElementById('escaparateLocalAviso');
 if(aviso){aviso.hidden=false;const b=aviso.querySelector('b');if(b)b.textContent='Cargando escaparate local aislado…'}
 const opciones={method:'GET',cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'};
 const [r,m]=await Promise.all([
  fetch('/__rwadar_local/escaparate.json',opciones),
  fetch('/ofertas-editoriales/manifest.json',opciones)
 ]);
 if(!r.ok||!m.ok)throw new Error('HTTP '+(!r.ok?r.status:m.status)+' al leer el escaparate local');
 const manifiesto=validarManifiestoEditorialLocal(await m.json());
 const recibido=await r.json();
 if(recibido&&recibido.versionEsquema===2){
  const d=validarEscaparateLocalV2(recibido);
  if(manifiesto.porSlug.size!==d.ofertas.length||d.ofertas.some(o=>
     !manifiesto.porSlug.has(o.slug)||manifiesto.porSlug.get(o.slug).categoria!==o.categoria))
   throw new Error('el manifiesto editorial no corresponde al snapshot local V2');
  MANIFIESTO_EDITORIAL_LOCAL=manifiesto;ESCAPARATE_LOCAL=null;compare=[];
  P.splice(0,P.length,...d.plataformas);FUERA.splice(0,FUERA.length,...d.descartes);EMI.splice(0,EMI.length,...d.ofertas);
  recordarManifiestoCatalogoV2(P);
  CATALOGO_EMBEBIDO_BLOQUEADO=false;CATALOGO_SIN_COMPROBAR=false;CATALOGO_RETIRADO=false;
  CATALOGO_CADUCADO=edadLoteDias(d.fecha)>d.plataformas[0].vigencia_lote_dias;
  activaControlesEscaparateLocal(true);pintarFiltrosEmision();pintarEmisiones();rellenaRegiones();pintarDescartadas();render();
  document.getElementById('s1').textContent=P.length;document.getElementById('s3').textContent=new Set(P.map(p=>p.cat)).size;
  document.getElementById('s4').textContent=FUERA.length;
  const rt=document.getElementById('rlTotal');if(rt)rt.textContent=P.length+' plataformas en el radar';
  const pie=document.getElementById('pieRevision');if(pie)pie.textContent=textoPieRevision();
  if(aviso){const b=aviso.querySelector('b');if(b)b.textContent=d.preparado?'Lote '+fechaES(d.fecha)+' preparado · SIN aplicar':'Snapshot publicable · revisión '+fechaES(d.fecha);
   const p=aviso.querySelector('p');if(p)p.textContent='Revisión local aislada: '+P.length+' plataformas, '+EMI.length+' referencias y '+FUERA.length+' descartes. Sin conexión a producción.';}
  return true;
 }
 const d=validarEscaparateLocal(recibido);
 const categoriasOfertas=new Set([...d.ofertas,...d.secundario].map(o=>o.categoria));
 if(categoriasOfertas.size!==4||[...categoriasOfertas].some(c=>!manifiesto.porCategoria[c]))
  throw new Error('el fallback editorial no cubre todas las ofertas locales');
 const plataformas=d.plataformas.map(plataformaDesdeEscaparate);
 const descartes=d.descartes.map(descarteDesdeEscaparate);
 MANIFIESTO_EDITORIAL_LOCAL=manifiesto;ESCAPARATE_LOCAL=d;compare=[];
 P.length=0;P.push(...plataformas);
 FUERA.length=0;FUERA.push(...descartes);
 activaControlesEscaparateLocal();
 pintarTiposOfertaLocal();pintarFiltrosEmision();pintarEmisiones();pintarExclusionesLocales();pintarFuenteLocal();
 rellenaRegiones();pintarDescartadas();render();
 document.getElementById('s1').textContent=P.length;
 document.getElementById('s3').textContent=new Set(P.map(p=>p.cat)).size;
 document.getElementById('s4').textContent=FUERA.length;
 const rt=document.getElementById('rlTotal');if(rt)rt.textContent=P.length+' plataformas en el radar';
 const pie=document.getElementById('pieRevision');if(pie)pie.textContent='Fuentes del radar: '+
  fechaES(d.fuente.actualizacionRadarLocal.verificadoEl)+' · Ofertas: '+
  fechaES(d.fuente.actualizacionLocal.verificadoEl)+' · Secundario: '+
  [...new Set(d.secundario.map(o=>o.verificadaEl))].sort().map(fechaES).join(', ');
 if(aviso){const b=aviso.querySelector('b');if(b)b.textContent='Escaparate de revisión aislado de producción'}
 return true;
}

async function alDia(){
 if(typeof MODO_LOCAL_SEGURO!=='undefined'&&MODO_LOCAL_SEGURO)throw new Error('Supabase está bloqueado en el modo local seguro');
 const cab={apikey:CLAVE_PUB};
 const pide=u=>{
   if(!window.RWADAR_ACCESO)throw new Error('Falta la pasarela de acceso');
   const [tabla,consulta='']=u.slice(1).split('?');return window.RWADAR_ACCESO.catalogo(tabla,consulta);
 };
  const respuestas=await Promise.allSettled([
    pide('/catalogo_plataformas_publicas_v2?select=*'),
    pide('/plataformas?estado=eq.descartada&select=nombre,etiqueta_descarte,motivo_descarte,fuentes(url,titulo)&order=nombre'),
    pide('/catalogo_ofertas_publicas_v2?select=*'),
    pide('/catalogo_publicacion?select=retirado,motivo')
  ]);
  // Solo la orden expresa de retirada oculta el catálogo. Si esa consulta
  // falla, o la base todavía no tiene la tabla, no se toma como una orden.
  const orden=respuestas[3].status==='fulfilled'&&Array.isArray(respuestas[3].value)?respuestas[3].value[0]:null;
  if(orden&&orden.retirado===true){
   P.length=0;EMI.length=0;CATALOGO_EMBEBIDO_BLOQUEADO=true;CATALOGO_RETIRADO=true;
   refrescarVigenciaOfertas();throw new Error('catálogo retirado por orden expresa');
  }
  // Una vista vacía o incompleta ya no retira el lote: se conserva la última
  // copia completa y se avisa de que no se ha podido comprobar la más reciente.
  // «Incompleta» es respecto a lo que declara el propio lote, no al anterior.
  if([[0,'plataformas_esperadas'],[2,'ofertas_esperadas']].some(([i,campo])=>
   respuestas[i].status==='fulfilled'&&(!Array.isArray(respuestas[i].value)||!respuestas[i].value.length||
    respuestas[i].value.length!==respuestas[i].value[0]?.[campo]))){
   CATALOGO_SIN_COMPROBAR=true;
   refrescarVigenciaOfertas();throw new Error('catálogo remoto incompleto: se conserva la última copia completa');
  }
  const fallo=respuestas.slice(0,3).find(r=>r.status==='rejected');if(fallo)throw fallo.reason;
  const [r,f,e]=respuestas.map(r=>r.value);
  // Cuántas descartadas hay lo dice el catálogo (04/11/2026: ARTEX pasa a Descartadas y son 5);
  // vacío no vale, cada una con alguna fuente, y descarteRemoto exige su etiqueta y su motivo.
  if(!Array.isArray(f)||!f.length||f.some(x=>!Array.isArray(x&&x.fuentes)||!x.fuentes.length))throw new Error('descartes públicos incompletos');
  let fecha,nP,nE;
  try{
   fecha=validarLoteCatalogoRemotoV2(r,e);
   nP=r.map(p=>plataformaCatalogoRemota(p,fecha)).sort((a,b)=>a.n.localeCompare(b.n,'es'));
   nE=e.map(o=>ofertaCatalogoRemota(o,fecha)).sort((a,b)=>a.slug.localeCompare(b.slug,'es'));
  }catch(error){
   // Un lote remoto que no supera el contrato tampoco borra la copia buena.
   CATALOGO_SIN_COMPROBAR=true;
   refrescarVigenciaOfertas();throw error;
  }
  const nF=f.map(descarteRemoto).sort((a,b)=>a.n.localeCompare(b.n,'es'));
  recordarManifiestoCatalogoV2(nP);
  const caducadoRemoto=edadLoteDias(fecha)>r[0].vigencia_lote_dias;
  const cambiaAviso=CATALOGO_SIN_COMPROBAR||CATALOGO_RETIRADO||CATALOGO_CADUCADO!==caducadoRemoto;
  CATALOGO_SIN_COMPROBAR=false;CATALOGO_RETIRADO=false;CATALOGO_CADUCADO=caducadoRemoto;

 if(huella(nP,nF,nE)===huella(P,FUERA,EMI)){   /* ya estaba al día */
  if(cambiaAviso)refrescarVigenciaOfertas();
  return false;
 }

 P.length=0;    P.push(...nP);
 FUERA.length=0; FUERA.push(...nF);
  EMI.length=0;  EMI.push(...nE);
  CATALOGO_EMBEBIDO_BLOQUEADO=false;
 refrescarDetalleOfertaAbierto();
 rellenaRegiones();
 document.getElementById('s1').textContent=P.length;
 document.getElementById('s3').textContent=new Set(P.map(p=>p.cat)).size;
 document.getElementById('s4').textContent=FUERA.length;
/* El rotulo del radar tambien: estaba escrito a mano y se quedo en 24
   cuando el registro crecio. Ahora sale de P como todo lo demas. */
{const rt=document.getElementById('rlTotal');if(rt)rt.textContent=P.length+' plataformas en el radar';}
 pintarDescartadas();
 pintarFiltrosEmision();
 pintarEmisiones();
 render();
 const pie=document.getElementById('pieRevision');
 if(pie) pie.textContent=textoPieRevision();
 return true;
}

/* Todo el contrato está inicializado antes del primer render, también cuando
   sincronizar.js ha embebido el nuevo lote. */
activarBusquedaOfertas();
if(!comprobarCatalogoEmbebido())pintarCierreCatalogo();
pintarFiltrosEmision();pintarEmisiones();

function avisar(texto){
 let t=document.getElementById('avisoGlobal');
 if(!t){t=document.createElement('div');t.id='avisoGlobal';t.className='aviso';
   t.setAttribute('role','status');t.setAttribute('aria-live','polite');document.body.appendChild(t);}
 t.textContent=texto; clearTimeout(avisar._fuera); clearTimeout(avisar._borra);
 t.classList.remove('dentro');
 requestAnimationFrame(()=>t.classList.add('dentro'));
 avisar._fuera=setTimeout(()=>{t.classList.remove('dentro');
   avisar._borra=setTimeout(()=>{if(t.parentNode)t.remove()},400)},4200);
}

/* Al cargar, y de nuevo si la pestaña vuelve a primer plano tras un rato:
   quien deja la página abierta todo el día también merece ver lo último. */
let ultimaMirada=0;
function pintarCierreCatalogo(){
 // Invalidar los datos también retira todas sus representaciones ya abiertas.
 // La comparación debe vaciarse antes de render: sus índices dejan de existir.
 compare=[];
 const panelCatalogo=['drawer','modal'].some(id=>document.getElementById(id)?.classList.contains('show'));
 if(panelCatalogo)closeAll();
 ['dwId','dwBody','dwAcciones','modalBody','grid','matrix'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=''});
 ['s1','s3'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='0'});
 const lectura=document.getElementById('radarLee');
 if(lectura){lectura.classList.remove('viva');const dato=lectura.querySelector('.rl-dato'),vacio=lectura.querySelector('.rl-vacio');if(dato)dato.hidden=true;if(vacio)vacio.hidden=false}
 ['rlNom','rlMeta'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=''});
 const total=document.getElementById('rlTotal');if(total)total.textContent='0 plataformas · catálogo no disponible temporalmente';
 const pie=document.getElementById('pieRevision');if(pie)pie.textContent='Catálogo no disponible temporalmente';
 rellenaRegiones();
 resetAll();
}
function refrescarVigenciaOfertas(){
 if(MODO_LOCAL_SEGURO){
  if(ESCAPARATE_LOCAL)pintarEscaparateLocal();
 }else{
  if(!comprobarCatalogoEmbebido())pintarCierreCatalogo();
  pintarFiltrosEmision();pintarEmisiones();
 }
 refrescarDetalleOfertaAbierto();
}
/* No basta con comprobar al descargar: una pestaña puede cruzar medianoche
   o volver de suspensión sin que el catálogo remoto haya cambiado. */
function programarRevisionVigenciaOfertas(){
 const ahora=new Date(),siguienteDia=new Date(ahora);
 siguienteDia.setUTCHours(24,0,0,100);
 setTimeout(()=>{refrescarVigenciaOfertas();programarRevisionVigenciaOfertas()},siguienteDia-ahora);
}
programarRevisionVigenciaOfertas();
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refrescarVigenciaOfertas()});
async function mirar(){
 if(MODO_LOCAL_SEGURO)return;
 refrescarVigenciaOfertas();
 if(Date.now()-ultimaMirada<60000) return;
 /* En la primera carga el catálogo en vivo sustituye al embebido sin avisar:
    para quien llega no ha cambiado nada. Solo se avisa si cambia después,
    con la página ya abierta (y el aviso se traduce con el diccionario). */
 const primera=!ultimaMirada;
 ultimaMirada=Date.now();
 try{ if(await alDia()&&!primera) avisar('Registro actualizado'); }
 catch{refrescarVigenciaOfertas()}
}
/* Primero se pinta lo que ya venía en el HTML, y solo después se
   consulta la base: así la página está usable de inmediato y la
   actualización, si la hay, llega sin bloquear nada. */
render();
pulir();
(function pieFecha(){const p=document.getElementById('pieRevision');
 if(p) p.textContent=textoPieRevision();})();
if(MODO_LOCAL_SEGURO){
 cargarEscaparateLocal().catch(e=>{
  document.body.classList.add('modo-local-seguro');
  if(comprobarCatalogoEmbebido()){
   CATALOGO_SIN_COMPROBAR=true;activaControlesEscaparateLocal(true);
   pintarFiltrosEmision();pintarEmisiones();render();
  }
  const aviso=document.getElementById('escaparateLocalAviso');
  if(aviso){aviso.hidden=false;const b=aviso.querySelector('b');if(b)b.textContent='No se pudo abrir el escaparate local';
   const p=aviso.querySelector('p');if(p)p.textContent='Se conserva la última copia completa del catálogo. No se ha podido cargar la revisión local nueva y no se contacta producción.';}
 });
}else{
 mirar();
 document.addEventListener('visibilitychange',()=>{ if(!document.hidden) mirar(); });
}


/* =================================================================
   OPINIONES DE USUARIOS
   -----------------------------------------------------------------
   Tres cosas que NO son adorno y no conviene quitar:

   1 · El aviso de que no comprobamos que quien opina haya sido
       cliente. La normativa europea de reseñas obliga a declarar si
       se verifica y cómo. Decir que sí sin hacerlo es una infracción.
   2 · El botón de denunciar. Alojar lo que escriben terceros solo
       está amparado si existe una vía para avisar y se actúa. Sin él,
       RWAdar respondería como si lo hubiera escrito ella.
   3 · La media no se publica con menos de tres opiniones. Un solo
       enfadado no es una nota, es una anécdota.
   ================================================================= */
const Opiniones=(function(){
 const REST=API;                       /* el mismo que usa el registro */
 const cab=async()=>{const c={apikey:CLAVE_PUB,'Content-Type':'application/json'};
   const t=await Cuenta.token();if(!t){const e=new Error('La sesión ha caducado.');e.status=401;throw e;}
   c.Authorization='Bearer '+t;return c;};

 async function pide(ruta,opc){
  if(!OPINIONES_DISPONIBLES)throw new Error('Opiniones desactivadas en esta versión editorial');
  if(window.RWADAR_ACCESO)return window.RWADAR_ACCESO.datos(ruta,opc);
  const cfg=Object.assign({cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'},opc||{});
  cfg.headers=Object.assign({apikey:CLAVE_PUB},(opc&&opc.headers)||{});
  const r=await fetch(REST+ruta,cfg);
  const texto=await r.text(); let j=null;
  try{j=texto?JSON.parse(texto):null}catch(e){j=texto||null}
  if(!r.ok){
   const err=new Error((j&&typeof j==='object'&&(j.message||j.error_description||j.hint))||('HTTP '+r.status));
   err.status=r.status; err.code=j&&typeof j==='object'&&j.code; throw err;
  }
  return j;
 }

 const idDe=Object.create(null);        /* nombre de plataforma -> uuid, sin prototipo */
 async function idPlataforma(nombre){
  if(idDe[nombre])return idDe[nombre];
  const j=await pide('/plataformas?select=id,nombre&nombre=eq.'+encodeURIComponent(nombre));
  if(!Array.isArray(j)||!j.length)throw new Error('no encuentro la plataforma');
  return (idDe[nombre]=j[0].id);
 }

 const fecha=s=>{const d=new Date(s);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'})};
 const limpio=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const uuid=s=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
 const nota=s=>{const n=Number(s);return Number.isInteger(n)&&n>=1&&n<=10?n:null};

 async function pinta(nombre,host){
  if(!OPINIONES_DISPONIBLES){host.innerHTML='';return;}
  host.innerHTML='<p class="op-cargando">Cargando opiniones…</p>';
  let pid;
  try{ pid=await idPlataforma(nombre); }catch(e){ host.innerHTML=''; return; }

  let lista=[],media=null,mia=null,propiaDisponible=true;
  try{
   const [a,b]=await Promise.all([
     pide('/opiniones_publicas?select=opinion_id,plataforma_id,autor,nota,texto,creado_el,editada&plataforma_id=eq.'+encodeURIComponent(pid)+'&order=creado_el.desc'),
     pide('/nota_media?select=plataforma_id,opiniones,media&plataforma_id=eq.'+encodeURIComponent(pid))
   ]);
   lista=(Array.isArray(a)?a:[]).filter(o=>o&&uuid(o.opinion_id)&&nota(o.nota)!==null&&typeof o.texto==='string')
     .map(o=>Object.assign({},o,{nota:nota(o.nota)}));
   if(Array.isArray(b)&&b[0]){
    const m=Number(b[0].media),n=Number(b[0].opiniones);
    if(Number.isFinite(m)&&Number.isInteger(n)&&n>=3)media={media:Math.round(m*10)/10,opiniones:n};
   }
  }catch(e){ host.innerHTML='<p class="op-cargando">Opiniones temporalmente no disponibles.</p>'; return; }
  if(Cuenta.hay()){
   try{
    const j=await pide('/mis_opiniones?select=opinion_id,plataforma_id,nota,texto,estado,denuncias,creado_el,actualizado_el&plataforma_id=eq.'+encodeURIComponent(pid),{headers:await cab()});
    if(Array.isArray(j)&&j[0]&&uuid(j[0].opinion_id)&&nota(j[0].nota)!==null&&typeof j[0].texto==='string')
      mia=Object.assign({},j[0],{nota:nota(j[0].nota)});
   }catch(e){propiaDisponible=false;}
  }

  const cabecera='<div class="op-cab"><span class="op-tit">Opiniones de usuarios</span>'+
    (media&&media.media!=null
      ? '<span class="op-media"><span class="n">'+media.media+'</span><span class="de">/ 10 · '+media.opiniones+' opiniones</span></span>'
      : '<span class="de op-conteo">'+(lista.length?lista.length+' opini'+(lista.length===1?'ón':'ones'):'sin opiniones todavía')+'</span>')+'</div>';

  const aviso='<p class="op-aviso">Esto lo escriben usuarios, no es la verificación de RWAdar. '+
    '<b>No comprobamos que quien opina haya sido cliente de la plataforma.</b> '+
    'La media solo se publica a partir de tres opiniones. Si ves algo falso o difamatorio, denúncialo.</p>';

  const filas=lista.map(o=>{
    const cls=o.nota>=7?'alta':(o.nota<=4?'baja':'');
    return '<li><div class="op-fila"><span class="op-nota '+cls+'">'+o.nota+'/10</span>'+
      '<span class="op-autor">'+limpio(o.autor)+'</span>'+
      '<span class="op-fecha">'+fecha(o.creado_el)+(o.editada?' · editada':'')+'</span></div>'+
      '<p class="op-texto">'+limpio(o.texto)+'</p>'+
      '<div class="op-acciones"><button class="den" data-den="'+limpio(o.opinion_id)+'">Denunciar</button></div></li>';
  }).join('');

  let formulario;
  if(!Cuenta.hay()){
   formulario='<div class="op-cuenta">Para dejar tu nota y contar tu experiencia hace falta una cuenta. '+
     'Es gratis y también permite guardar las plataformas que quieres seguir. '+
     '<button type="button" id="opEntrar">Crear cuenta o entrar</button></div>';
  }else if(!propiaDisponible){
   formulario='<p class="op-cargando">Tu editor de opiniones no está disponible ahora. Vuelve a intentarlo más tarde.</p>';
  }else{
   const n=mia?mia.nota:0;
   formulario='<form class="op-form" id="opForm">'+
     '<div class="op-tit op-form-tit">'+(mia?'Tu opinión':'Escribe la tuya')+'</div>'+
     (mia&&mia.estado==='oculta'?'<p class="op-aviso op-aviso-oculta">Tu opinión está retirada tras varias denuncias. Puedes editarla.</p>':'')+
     '<div class="op-notas" id="opNotas" role="group" aria-label="Nota del 1 al 10">'+
       [1,2,3,4,5,6,7,8,9,10].map(i=>'<button type="button" aria-label="'+i+' sobre 10" aria-pressed="'+(i===n?'true':'false')+'" data-n="'+i+'"'+(i===n?' class="on"':'')+'>'+i+'</button>').join('')+
     '</div>'+
     '<label class="op-tit op-experiencia" for="opTexto">Tu experiencia</label>'+
     '<textarea id="opTexto" required maxlength="1200" minlength="20" placeholder="Qué tal te ha ido: cómo entraste, qué cobraste, qué tardó. Concreto y sin insultos.">'+limpio(mia?mia.texto:'')+'</textarea>'+
     '<button class="op-enviar" type="submit">'+(mia?'Guardar cambios':'Publicar opinión')+'</button>'+
     (mia?' <button class="op-enviar op-borrar" type="button" id="opBorrar">Borrar</button>':'')+
     '</form>';
  }

  host.innerHTML='<div class="op-bloque">'+cabecera+aviso+
    (filas?'<ul class="op-lista">'+filas+'</ul>':'')+
    '<div class="op-form-wrap">'+formulario+'</div></div>';

  const ent=host.querySelector('#opEntrar');
  if(ent)ent.onclick=()=>Cuenta.abrir('registro');

  const notas=host.querySelector('#opNotas');
  if(notas)notas.onclick=e=>{const b=e.target.closest('button[data-n]');if(!b)return;
    notas.querySelectorAll('button').forEach(x=>{x.classList.remove('on');x.setAttribute('aria-pressed','false')});
    b.classList.add('on');b.setAttribute('aria-pressed','true');};

  const form=host.querySelector('#opForm');
  if(form)form.onsubmit=async e=>{
    e.preventDefault();
    const sel=notas.querySelector('button.on');
    const texto=host.querySelector('#opTexto').value.trim();
    if(!sel){aviso2('Pon una nota del 1 al 10.');return;}
    if(texto.length<20){aviso2('Cuenta un poco más: mínimo 20 caracteres.');return;}
    const b=form.querySelector('button[type=submit]');b.disabled=true;b.textContent='Guardando…';
    try{
     await pide('/rpc/guardar_opinion',{method:'POST',headers:await cab(),
       body:JSON.stringify({p_plataforma:pid,p_nota:+sel.dataset.n,p_texto:texto})});
     Sonido&&Sonido.marcar&&Sonido.marcar();
     aviso2('Publicada. Gracias.');
     await pinta(nombre,host);
    }catch(err){ b.disabled=false; b.textContent=mia?'Guardar cambios':'Publicar opinión';
      aviso2(err.code==='22023'?'Revisa la nota y el texto antes de guardar.':
        (err.status===401||err.status===403?'La sesión ha caducado. Vuelve a entrar.':'No se ha podido guardar.')); }
  };

  const borrar=host.querySelector('#opBorrar');
  if(borrar)borrar.onclick=async()=>{
    if(!confirm('¿Borrar tu opinión sobre '+nombre+'?'))return;
    borrar.disabled=true;
    try{
     await pide('/rpc/borrar_mi_opinion',{method:'POST',headers:await cab(),
       body:JSON.stringify({p_opinion_id:mia.opinion_id})});
     aviso2('Opinión borrada.'); await pinta(nombre,host);
    }catch(e){borrar.disabled=false;aviso2('No se ha podido borrar la opinión.');}
  };

  host.querySelectorAll('button[data-den]').forEach(b=>{
    b.onclick=async()=>{
      if(!Cuenta.hay()){Cuenta.abrir('entrar');return;}
      const motivo=prompt('¿Por qué la denuncias? (falsa, insultos, datos personales…)');
      if(motivo===null)return;
      b.disabled=true;
      try{
       const limpioMotivo=motivo.trim().slice(0,300);
       await pide('/rpc/denunciar_opinion',{method:'POST',headers:await cab(),
         body:JSON.stringify({p_opinion_id:b.dataset.den,p_motivo:limpioMotivo||null})});
       b.textContent='Denunciada'; aviso2('Denuncia enviada. La revisaremos.');
      }catch(e){
       b.disabled=false;
       if(e.code==='23505') aviso2('Ya habías denunciado esta opinión.');
       else if(e.code==='P0001') aviso2('No puedes denunciar tu propia opinión.');
       else if(e.code==='P0002') aviso2('La opinión ya no está disponible.');
       else if(e.status===401||e.status===403) aviso2('La sesión ha caducado. Vuelve a entrar.');
       else aviso2('No se ha podido enviar la denuncia.');
      }
    };
  });
 }

 function aviso2(t){avisar(t)}

 return {pinta:pinta};
})();

/* correo-consentimiento:inicio */
const VERSION_CONSENTIMIENTO_CORREO='correo-v1-2026-08-22';
function consentimientoCorreoVigente(datos){
 if(!datos||datos.avisos_correo!==true||
    datos.avisos_correo_version!==VERSION_CONSENTIMIENTO_CORREO||
    typeof datos.avisos_correo_aceptado_el!=='string')return false;
 return Number.isFinite(Date.parse(datos.avisos_correo_aceptado_el));
}
function perfilConCorreoSeguro(base,datos){
 const vigente=consentimientoCorreoVigente(datos);
 return Object.assign({},base||{}, {
  avisos_correo:vigente,
  avisos_correo_aceptado_el:vigente?datos.avisos_correo_aceptado_el:null,
  avisos_correo_version:vigente?VERSION_CONSENTIMIENTO_CORREO:null
 });
}
function perfilDesdeRespuestaCorreo(base,fila,esperado){
 if(!fila||fila.habilitado!==esperado)throw new Error('respuesta de consentimiento no válida');
 const datos={avisos_correo:fila.habilitado,
  avisos_correo_aceptado_el:fila.aceptado_el,avisos_correo_version:fila.version};
 if(esperado&&!consentimientoCorreoVigente(datos))
  throw new Error('el consentimiento no quedó registrado');
 if(!esperado&&(fila.aceptado_el!==null||fila.version!==null))
  throw new Error('la retirada no quedó registrada');
 return perfilConCorreoSeguro(base,datos);
}
/* correo-consentimiento:fin */


/* =================================================================
   CUENTA · registro, sesión y lista de vigilancia
   -----------------------------------------------------------------
   Sin librerías: se habla directamente con la API de Supabase, igual
   que hace alDia con el registro. Meter el SDK habría roto lo único
   que hace especial a esta página —un archivo, cero dependencias— a
   cambio de ahorrar unas cuantas llamadas a fetch.

   La cuenta confirmada da acceso al registro, a la vigilancia y a la opinión. La
   entrega de avisos por correo se activará solo cuando esté configurada.
   ================================================================= */
const Cuenta = (function(){
 const servidor=typeof window!=='undefined'&&window.RWADAR_ACCESO;
 const usuarioServidor=u=>({id:u.id,email:u.correo,email_confirmed_at:u.correoConfirmadoEl,is_anonymous:false});
 const AUTH='https://exgpmjpaaebyoolpwced.supabase.co/auth/v1';
 /* Correos reales comprobados el 11/10/2026: alta recibida y confirmada por
    su titular; recuperación recibida en su buzón. Confirm email sigue
    activo. El cambio final de contraseña de una persona solo lo hace ella:
    esa prueba real no se confunde con los ensayos aislados de la interfaz.
    Evidencia y límites: docs/VERIFICACION-CUENTAS-2026-10-11.md. */
 const CORREO_AUTH_E2E=true;
 /* Manual de bienvenida: apagado. Víctor lo reserva a usuarios registrados;
    no activar una descarga pública ni una ruta estática para ese documento.
    Requiere entrega autenticada y revisión propia antes de habilitarse. */
 const MANUAL_BIENVENIDA='';
 /* Comprobación anti-robots (Cloudflare Turnstile) al crear cuenta, entrar
    y pedir correos, para que nadie use el alta para mandar correos en masa.
    Vacío: apagada y sin cargar nada de fuera. Encenderla exige también la
    clave secreta en Supabase (Attack Protection), abrir la CSP a
    https://challenges.cloudflare.com y contarlo en la privacidad: pasos en
    docs/tareas/REABRIR-CUENTAS.md. */
 const TURNSTILE_SITEKEY='';
 /* Avisos de novedades (docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md).
    Apagado hasta tener la base (30), la plantilla de confirmación de Auth y
    la privacidad al día; se enciende a la vez que el de assets/acceso.js y el
    de la app. Encendido, Perfil enseña «Avisos de novedades» con su
    interruptor en lugar de «Próximamente · Avisos de cambios». Apagado, la
    web no pide ni muestra nada de estos avisos. */
 const AVISOS_NOVEDADES_REMOTOS=false;
 const AVISOS_NOVEDADES_DISPONIBLES=SERVICIOS_USUARIO_DISPONIBLES&&AVISOS_NOVEDADES_REMOTOS;
 /* Bandeja de avisos sin correo ni push (07/11/2026). Interruptor aparte del
    anterior, con el mismo nombre que el de la app (lib/modo-local.js), que se
    enciende a la vez. Encendido, el panel de la cuenta enseña SOLO la lista de
    avisos recibidos: la bienvenida y los anuncios publicados, que la base ya da
    a cualquier cuenta confirmada (rpc/mis_avisos_recientes de db/30, por
    /api/acceso/datos). Sin casilla, sin permiso, sin correo y sin push; la web
    no guarda nada. Apagado, no pide ni muestra nada. */
 const AVISOS_BANDEJA_REMOTA=false;
 const AVISOS_BANDEJA_DISPONIBLE=SERVICIOS_USUARIO_DISPONIBLES&&AVISOS_BANDEJA_REMOTA;
 const VERSION_AVISOS_NOVEDADES='novedades-v2-2026-11-06';
 /* El mismo texto que la base, la app y la casilla de /acceso: cambiar una
    palabra obliga a crear una versión nueva. v2: revisión legal del 06/11/2026. */
 const TEXTO_AVISOS_NOVEDADES='Quiero recibir avisos de RWAdar por correo y, si los activo en mi móvil, como notificaciones: fichas nuevas en el radar y novedades de la web y la app. Es opcional: la Academy se desbloquea igual. Puedes darte de baja en Perfil o con el enlace de cada correo; las notificaciones también se quitan en los ajustes del móvil. Más información en Privacidad.';
 /* Información básica sobre los datos (LOPDGDD, art. 11), junto al interruptor.
    Va fuera del texto versionado: cambiarla no pide una versión nueva. */
 const INFO_DATOS_AVISOS='Información básica sobre tus datos. Responsable: Víctor Manuel Jorques Granero (RWAdar). Datos: tu correo, tu contraseña y, si lo das, tu nombre; con los avisos, además, tu permiso y, si activas las notificaciones, un identificador de entrega de tu móvil. Para qué: tu cuenta, con la que también abres la Academy, y, solo si marcas la casilla de avisos, enviarte esos avisos. Base: el servicio que pides (cuenta) y tu consentimiento (avisos), que puedes retirar cuando quieras sin que afecte a lo anterior. Proveedores: Supabase, Cloudflare y Google; para los avisos, Lettermint y Expo. Algunos tratan datos fuera de la UE con garantías. Derechos: acceso, rectificación, supresión, oposición, limitación y portabilidad, en Perfil o en RWAdar@protonmail.com; también puedes reclamar ante la AEPD. Más información en Privacidad.';
 /* En la web, «Privacidad» del final es un enlace; el texto visible no cambia. */
 const conEnlacePrivacidad=(texto,href)=>esc(texto.replace(/Privacidad\.$/,''))+'<a href="'+href+'">Privacidad</a>.';
 let ses=null, perfil=null, vigiladas=new Map(), modo='entrar', fichaAbierta=null,
     identidadConfirmada=false,versionSesion=0,versionCuenta=0,renovacion=null,cuentaRenovacion=-1,focoCuenta=null,
     correoPendiente='',operacionCuenta=0,temporizadorReenvio=null,cuentaHistorial=false,bajaPendiente=null,
     restauracionCuenta=null,datosCuentaError=false;

 const $=id=>document.getElementById(id);
 function normalizaSesion(s){
  if(!s||typeof s!=='object'||typeof s.access_token!=='string'||!s.access_token) return null;
  const expira=Number(s.expira);
  return {access_token:s.access_token,
    refresh_token:typeof s.refresh_token==='string'?s.refresh_token:'',
    expira:Number.isFinite(expira)?expira:0,
    correo:typeof s.correo==='string'?s.correo:'',
    uid:typeof s.uid==='string'?s.uid:''};
 }
 /* Los tokens se conservan solo en memoria. Una recarga exige volver a entrar,
    pero reduce la exposición: ninguna sesión queda persistida en localStorage. */
 const guarda=(s,mismaCuenta=false)=>{ses=normalizaSesion(s);versionSesion++;
  if(!mismaCuenta){versionCuenta++;identidadConfirmada=false;perfil=null;vigiladas=new Map();datosCuentaError=false;}
 };
 const vigente=inicio=>inicio===versionCuenta&&!!ses;
 function cancelada(){const e=new Error('La cuenta ha cambiado. Vuelve a intentarlo.');e.code='cuenta_cancelada';return e;}

 /* El plazo incluye la descarga del cuerpo, no solo las cabeceras. Ni una
    conexión congelada ni una respuesta enorme pueden dejar el formulario
    bloqueado. No se siguen redirecciones con el testigo de la cuenta. */
 async function peticionCuenta(url,opciones){
  const abortar=new AbortController();let reloj;
  const espera=new Promise((_,mal)=>{reloj=setTimeout(()=>{
   abortar.abort();mal(new Error('La conexión ha tardado demasiado. Vuelve a intentarlo.'));
  },8000);});
  const pide=(async()=>{
   const r=await fetch(url,Object.assign({},opciones,{signal:abortar.signal,redirect:'error'}));
   const limite=131072;
   if(Number(r.headers&&r.headers.get('content-length'))>limite)throw new Error('La respuesta es demasiado grande.');
   let texto='';
   if(r.body&&typeof r.body.getReader==='function'){
    const lector=r.body.getReader(),decodificador=new TextDecoder('utf-8',{fatal:true});let bytes=0;
    try{
     for(;;){const trozo=await lector.read();if(trozo.done)break;
      bytes+=trozo.value.byteLength;if(bytes>limite)throw new Error('La respuesta es demasiado grande.');
      texto+=decodificador.decode(trozo.value,{stream:true});
     }
     texto+=decodificador.decode();
    }catch(e){lector.cancel().catch(()=>{});throw e;}finally{lector.releaseLock();}
   }else{texto=await r.text();if(texto.length>limite)throw new Error('La respuesta es demasiado grande.');}
   return {r,texto};
  })();
  try{return await Promise.race([pide,espera]);}finally{clearTimeout(reloj);abortar.abort();}
 }

 /* --- la API de autenticación ------------------------------------ */
 async function auth(ruta,cuerpo,opc){
  if(!SERVICIOS_USUARIO_DISPONIBLES)throw new Error('Cuentas desactivadas en esta versión editorial');
  if(servidor){
   if(ruta==='/user'&&(!opc||opc.metodo==='GET'))return usuarioServidor(await servidor.verificar());
   if(ruta==='/token?grant_type=password'){
    const u=await servidor.reautenticar(cuerpo&&cuerpo.password,cuerpo&&cuerpo.gotrue_meta_security&&cuerpo.gotrue_meta_security.captcha_token);
    return {access_token:'sesion-http-only',user:usuarioServidor(u),expires_in:3600};
   }
   if(ruta.startsWith('/logout'))return servidor.salir();
   throw new Error('Gestiona el acceso desde la página de tu cuenta.');
  }
  let r,t;
  try{
   const respuesta=await peticionCuenta(AUTH+ruta,{method:(opc&&opc.metodo)||'POST',
     headers:Object.assign({apikey:CLAVE_PUB,'Content-Type':'application/json'},
       (opc&&opc.token)?{Authorization:'Bearer '+opc.token}:{}),
     body:cuerpo?JSON.stringify(cuerpo):undefined,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
   r=respuesta.r;t=respuesta.texto;
  }catch(e){throw new Error('No se ha podido conectar. Comprueba la conexión y vuelve a intentarlo.');}
  let j={};
  if(t){
   try{j=JSON.parse(t);}
   catch(e){
    if(r.ok)throw new Error('La respuesta de autenticación no es válida. Inténtalo más tarde.');
    j={};
   }
  }
  if(!r.ok){const e=new Error(traduce(j.msg||j.error_description||j.message||('HTTP '+r.status)));
    e.status=r.status;e.code=j.code||j.error_code||'';throw e;}
  return j;
 }
 /* El fragmento pertenece al enlace, no a Auth: nunca mostramos su descripción.
    Solo se admiten códigos cerrados y texto propio, incluso si viene escapado. */
 function mensajeErrorRetorno(parametros){
  const codigo=parametros.get('error_code')||parametros.get('error')||'';
  const mensajes={
   otp_expired:'El enlace no es válido o ha caducado. Solicita uno nuevo.',
   flow_state_expired:'El enlace no es válido o ha caducado. Solicita uno nuevo.',
   invalid_token:'El enlace no es válido o ha caducado. Solicita uno nuevo.',
   access_denied:'No se ha podido validar el enlace. Solicita uno nuevo desde RWAdar.'
  };
  return Object.prototype.hasOwnProperty.call(mensajes,codigo)?mensajes[codigo]:
   'No se ha podido validar el enlace. Solicita uno nuevo desde RWAdar.';
 }
 /* Los mensajes de Supabase llegan en inglés y son crípticos. */
 function traduce(m){
  const t=String(m).toLowerCase();
  if(t.includes('invalid login')) return 'El correo o la contraseña no son correctos.';
  if(t.includes('email not confirmed')) return 'Falta confirmar el correo. Mira tu bandeja, y también el spam.';
  if(t.includes('expired')||t.includes('invalid token')||t.includes('otp_expired')) return 'El enlace no es válido o ha caducado. Solicita uno nuevo.';
  if(t.includes('already registered')||t.includes('already been registered')) return 'Ese correo ya tiene cuenta. Prueba a entrar.';
  if(t.includes('password should be')||t.includes('at least 12')||t.includes('at least 8')) return 'La contraseña necesita al menos 12 caracteres.';
  if(t.includes('rate limit')||t.includes('too many')) return 'Demasiados intentos seguidos. Espera un minuto y vuelve a probar.';
  if(t.includes('unable to validate email')||t.includes('invalid format')) return 'Esa dirección de correo no parece válida.';
  if(t.includes('captcha')) return 'No hemos podido comprobar que no eres un robot. Vuelve a intentarlo.';
  if(t.includes('sending confirmation email')||t.includes('sending recovery email')||t.includes('smtp')||
     t.includes('application-specific password')||t.includes('username and password not accepted'))
   return 'No se ha podido enviar el correo. Prueba más tarde; si sigue fallando, contacta con RWAdar.';
  return 'No se ha podido completar la operación. Vuelve a intentarlo; si continúa, contacta con RWAdar.';
 }

 /* --- anti-robots (Turnstile) --------------------------------------
    Solo se carga al pedir algo a Auth, nunca al abrir la página. Cada
    petición lleva un testigo nuevo: Turnstile no admite reutilizarlos. */
 let turnstileCarga=null,turnstileWidget=null,cancelaRobot=null;
 function cargaTurnstile(){
  if(window.turnstile)return Promise.resolve(window.turnstile);
  if(!turnstileCarga)turnstileCarga=new Promise((ok,mal)=>{
   const s=document.createElement('script');
   s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
   s.async=true;
   const falla=()=>{turnstileCarga=null;s.remove();mal(new Error('turnstile'));};
   s.onload=()=>window.turnstile?ok(window.turnstile):falla();
   s.onerror=falla;
   document.head.appendChild(s);
  });
  return turnstileCarga;
 }
 function quitaAntiRobots(){
  if(cancelaRobot){const c=cancelaRobot;cancelaRobot=null;c();}
  if(turnstileWidget!==null&&window.turnstile){try{window.turnstile.remove(turnstileWidget);}catch(e){}}
  turnstileWidget=null;
  const caja=$('cuentaRobot');if(caja){caja.hidden=true;caja.textContent='';}
 }
 async function antiRobots(){
  if(!TURNSTILE_SITEKEY)return null;
  const op=operacionCuenta;
  let ts;
  try{ts=await cargaTurnstile();}
  catch(e){throw new Error('No se ha podido cargar la comprobación anti-robots. Revisa la conexión o permite este sitio en tu bloqueador y vuelve a intentarlo.');}
  /* Si mientras cargaba se cerró la ventana o se cambió de pantalla, no se
     sigue: antes la entrada cancelada acababa enviándose igualmente. */
  if(op!==operacionCuenta)throw new Error('Operación cancelada.');
  quitaAntiRobots();
  const caja=$('cuentaRobot');caja.hidden=false;
  return new Promise((ok,mal)=>{
   let reloj=null;
   /* Cada comprobación solo puede cerrar la suya: una respuesta tardía de
      una anterior no debe resolver ni bloquear la que está en curso. */
   const cancela=()=>{clearTimeout(reloj);mal(new Error('Operación cancelada.'));};
   const fin=(f,v)=>{if(cancelaRobot!==cancela)return;cancelaRobot=null;clearTimeout(reloj);f(v);};
   const falla=()=>{fin(mal,new Error('No hemos podido comprobar que no eres un robot. Vuelve a intentarlo.'));return true;};
   cancelaRobot=cancela;
   reloj=setTimeout(falla,120000);
   try{
    turnstileWidget=ts.render(caja,{sitekey:TURNSTILE_SITEKEY,language:'es',appearance:'interaction-only',
     callback:t=>fin(ok,t),'error-callback':falla,'expired-callback':falla,'timeout-callback':falla});
   }catch(e){falla();}
  });
 }
 async function conAntiRobots(cuerpo){
  const op=operacionCuenta,t=await antiRobots();
  if(op!==operacionCuenta)throw new Error('Operación cancelada.');
  return t?Object.assign({},cuerpo,{gotrue_meta_security:{captcha_token:t}}):cuerpo;
 }

 /* Renueva el testigo si ha caducado. Sin esto, la sesión se cae sola
    al cabo de una hora y parece que el sitio te ha echado. */
 async function testigo(){
  if(!SERVICIOS_USUARIO_DISPONIBLES)return null;
  if(!ses) return null;
  if(servidor){
   const u=await servidor.verificar();if(!ses||u.id!==ses.uid)return null;
   return 'sesion-http-only';
  }
  if(ses.expira && Date.now() < ses.expira-60000) return ses.access_token;
  if(!ses.refresh_token){guarda(null);identidadConfirmada=false;pinta();return null;}
  if(renovacion&&cuentaRenovacion===versionCuenta)return renovacion;
  const inicio=versionSesion,anterior=Object.assign({},ses);
  cuentaRenovacion=versionCuenta;
  const pendiente=(async()=>{
   try{
    const j=await auth('/token?grant_type=refresh_token',{refresh_token:anterior.refresh_token});
    if(versionSesion!==inicio)return null; /* hubo logout u otra entrada mientras esperaba */
    if(!j||typeof j.access_token!=='string'||!j.access_token||
       (anterior.uid&&j.user&&j.user.id&&j.user.id!==anterior.uid))throw new Error('La renovación no es válida.');
    guarda({access_token:j.access_token,refresh_token:j.refresh_token||anterior.refresh_token,
            expira:Date.now()+(j.expires_in||3600)*1000,
            correo:(j.user&&j.user.email)||anterior.correo,
            uid:(j.user&&j.user.id)||anterior.uid},true);
    return ses&&ses.access_token;
   }catch(e){
    if(versionSesion===inicio){guarda(null);identidadConfirmada=false;pinta();}
    return null;
   }finally{if(renovacion===pendiente)renovacion=null;}
  })();
  renovacion=pendiente;
  return renovacion;
 }

 async function confirmarIdentidad(){
  const cuenta=versionCuenta,tk=await testigo(); if(!tk||!vigente(cuenta))return false;
  const inicio=versionSesion;
  try{
   const u=await auth('/user',null,{metodo:'GET',token:tk});
   if(!u||typeof u.id!=='string'||!u.id||!correoValido(u.email||'')||
      !u.email_confirmed_at||!Number.isFinite(Date.parse(u.email_confirmed_at))||u.is_anonymous===true)
    throw new Error('identidad no válida');
   if(versionSesion!==inicio||!ses||ses.access_token!==tk)return false;
   guarda(Object.assign({},ses,{uid:u.id,correo:u.email||''}),true);identidadConfirmada=true;return true;
  }catch(e){
   /* Un token que no hemos podido revalidar nunca queda utilizable en memoria,
      tampoco ante cortes de red o errores 5xx. */
   if(vigente(cuenta)&&versionSesion===inicio){identidadConfirmada=false;guarda(null,true);pinta();}
   return false;
  }
 }

 /* --- datos propios (la base ya filtra por RLS) ------------------- */
 async function rest(ruta,opc,cuenta){
  if(!SERVICIOS_USUARIO_DISPONIBLES)throw new Error('Datos de cuenta desactivados en esta versión editorial');
  if(cuenta===undefined)cuenta=versionCuenta;
  if(!vigente(cuenta))throw cancelada();
  if(servidor){const j=await servidor.datos(ruta,opc);if(!vigente(cuenta))throw cancelada();return j;}
  const tk=await testigo();if(!tk){const e=new Error('La sesión ha caducado. Vuelve a entrar.');e.status=401;throw e;}
  if(!vigente(cuenta))throw cancelada();
  const cfg=Object.assign({cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'},opc||{});
  cfg.headers=Object.assign({apikey:CLAVE_PUB,Authorization:'Bearer '+tk,
    'Content-Type':'application/json',Prefer:'return=representation'},(opc&&opc.headers)||{});
  const {r,texto}=await peticionCuenta(API+ruta,cfg);
  if(!vigente(cuenta))throw cancelada();
  let j=null;try{j=texto?JSON.parse(texto):null}catch(e){throw new Error('La respuesta de la cuenta no es válida.');}
  if(!r.ok){const e=new Error((j&&typeof j==='object'&&(j.message||j.hint))||('HTTP '+r.status));
    e.status=r.status;e.code=j&&typeof j==='object'&&j.code;throw e;}
  return j==null?[]:j;
 }
 async function cargarMio(cuenta=versionCuenta){
  if(!vigente(cuenta)||!identidadConfirmada)return false;
  const uid=ses.uid;
  try{
   const p=await rest('/mi_perfil?select=*',null,cuenta);let propio=(p&&p[0])||null;
   if(!Array.isArray(p)||!propio||propio.id!==uid)throw new Error('No se ha podido cargar tu perfil.');
   if(propio){
    let preferencia=null;
    if(AVISOS_CORREO_DISPONIBLES){
     try{
      const filas=await rest('/perfiles?select=avisos_correo,avisos_correo_aceptado_el,avisos_correo_version&id=eq.'+
        encodeURIComponent(uid),null,cuenta);
      preferencia=(filas&&filas[0])||null;
     }catch(e){}
    }
    propio=perfilConCorreoSeguro(propio,preferencia);
   }
   const v=await rest('/vigilancia?select=plataforma_id,plataformas(nombre)',null,cuenta);
   if(!vigente(cuenta)||ses.uid!==uid||!Array.isArray(v))return false;
   if(servidor&&servidor.usuario()?.id!==uid)throw cancelada();
   perfil=propio;datosCuentaError=false;
   vigiladas=new Map((v||[]).map(x=>[x.plataformas&&x.plataformas.nombre,x.plataforma_id]));
   return true;
  }catch(e){
   if(vigente(cuenta)){
    perfil=null;vigiladas=new Map();datosCuentaError=true;
    // A secondary read failure must not revoke a valid server session.
    // The bridge independently clears its identity on a real Auth rejection.
    if(servidor&&servidor.usuario()?.id!==uid){guarda(null);identidadConfirmada=false;}
   }
   return false;
  }
 }

 /* --- vigilar / dejar de vigilar --------------------------------- */
 async function idDe(nombre){
  const r=await rest('/plataformas?select=id&nombre=eq.'+encodeURIComponent(nombre));
  return r&&r[0]&&r[0].id;
 }
 async function alternar(nombre){
  if(!SERVICIOS_USUARIO_DISPONIBLES){avisar('El seguimiento está en pausa. Puedes consultar las fichas sin cuenta.');return;}
  if(!identidadConfirmada){abrir('registro','Crea una cuenta para guardar '+nombre+' en tu lista de seguimiento.');return;}
  const cuenta=versionCuenta,uid=ses.uid;
  const b=$('btnVig'); if(b) b.disabled=true;
  try{
   if(vigiladas.has(nombre)){
    const id=vigiladas.get(nombre);
    const filas=await rest('/vigilancia?plataforma_id=eq.'+id,{method:'DELETE'},cuenta);
    if(!Array.isArray(filas)||filas.length!==1||filas[0].plataforma_id!==id)
     throw new Error('No se ha podido confirmar el cambio en tu lista.');
    vigiladas.delete(nombre); aviso(nombre+': ya no la sigues');
   }else{
    const id=await idDe(nombre); if(!id) throw new Error('no encuentro esa plataforma');
    if(!vigente(cuenta))return;
    const filas=await rest('/vigilancia',{method:'POST',body:JSON.stringify({usuario_id:uid,plataforma_id:id})},cuenta);
    if(!Array.isArray(filas)||filas.length!==1||filas[0].plataforma_id!==id)
     throw new Error('No se ha podido confirmar el cambio en tu lista.');
    vigiladas.set(nombre,id); aviso('Sigues '+nombre+(AVISOS_NOVEDADES_DISPONIBLES?'. Seguir una plataforma no envía avisos.':'. Todavía no enviamos avisos por correo.'));
   }
  }catch(e){ if(vigente(cuenta))aviso('No se ha podido guardar: '+e.message); }
  if(!vigente(cuenta))return;
  if(b) b.disabled=false;
  pintarVigilar(nombre); pinta();
 }
 function pintarVigilar(nombre){
  fichaAbierta=nombre; const c=$('dwVigilar'); if(!c) return;
  if(!SERVICIOS_USUARIO_DISPONIBLES){
   const fav=typeof Favoritos!=='undefined'&&Favoritos.tiene('empresas',nombre);
   c.innerHTML=(typeof Favoritos!=='undefined'
     ?'<button class="btn-vigilar fav-local'+(fav?' on':'')+'" id="btnFav" type="button" aria-pressed="'+fav+'">'+
       (fav?'★ Guardada en favoritos':'☆ Guardar en favoritos')+'</button>'+
      '<p class="pn-nota pn-nota-separada fav-local">Se guarda solo en este navegador. La encontrarás en Perfil.</p>':'')+
    '<p class="pn-nota pn-nota-separada fav-escritorio">El seguimiento está en pausa. Puedes consultar esta ficha y visitar la web del proveedor sin cuenta.</p>';
   const bf=typeof Favoritos!=='undefined'?$('btnFav'):null;
   if(bf)bf.addEventListener('click',()=>{
    const ahora=Favoritos.alternar('empresas',nombre);
    avisar(ahora?nombre+' guardada en favoritos. La tienes en Perfil.':nombre+' quitada de favoritos.');
    pintarVigilar(nombre);
   });
   return;
  }
  const on=vigiladas.has(nombre);
  c.innerHTML='<button class="btn-vigilar'+(on?' on':'')+'" id="btnVig">'+
   (on?'✓ La sigues':'+ Seguir esta plataforma')+'</button>'+
   '<p class="pn-nota pn-nota-separada">'+
   (identidadConfirmada?(AVISOS_NOVEDADES_DISPONIBLES?'Guardada en tu lista. Seguir una plataforma no envía avisos.':'Guardada en tu lista. Todavía no enviamos avisos por correo.')
       :'Necesitas una cuenta para que tu lista se guarde entre visitas.')+'</p>';
  const b=$('btnVig'); if(b) b.addEventListener('click',()=>alternar(nombre));
 }

 /* --- la ventana de entrar / registro / recuperar ------------------ */
 const TEXTOS={
  entrar:{t:'Entrar',s:OPINIONES_DISPONIBLES?'Para guardar tu lista de seguimiento y gestionar tus opiniones.':'Para guardar tu lista de seguimiento entre visitas y dispositivos.',b:'Entrar',otro:'Crear una cuenta'},
  registro:{t:'Crear cuenta',s:'Es opcional y gratis. Tendrás que confirmar el correo antes de entrar.',b:'Crear cuenta',otro:'Ya tengo cuenta'},
  recuperar:{t:'Recuperar el acceso',s:'Solicita un enlace para poner una contraseña nueva.',b:'Solicitar el enlace',otro:'Volver a entrar'},
  nueva_clave:{t:'Elige una contraseña nueva',s:'El enlace ya ha verificado tu solicitud. Escribe la contraseña que usarás desde ahora.',b:'Guardar contraseña',otro:''},
  borrar_cuenta:{t:'Borrar mi cuenta',s:'Se borrarán tu cuenta, tu perfil y tu lista de seguimiento. No se puede deshacer. Confirma con tu contraseña actual y escribe BORRAR.',b:'Borrar definitivamente',otro:''},
  registro_pausado:{t:'Alta temporalmente en pausa',s:'Puedes consultar todo RWAdar sin crear una cuenta.'},
  recuperar_pausado:{t:'Recuperación temporalmente en pausa',s:'Las cuentas existentes siguen pudiendo entrar.'},
  confirmacion_pendiente:{t:'Confirma tu correo para entrar',s:'La solicitud se ha recibido.'},
  recuperacion_pendiente:{t:'Revisa tu correo para recuperar el acceso',s:'La solicitud se ha recibido.'}
 };
 const MODOS_ESTADO=new Set(['registro_pausado','recuperar_pausado','confirmacion_pendiente','recuperacion_pendiente']);
 const correoValido=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)&&v.length<=254;
 function limpiaSecretos(){
  $('cClave').value='';$('cClave2').value='';
 }
 function limpiaErroresCuenta(){
  ['cNombre','cCorreo','cClave','cClave2'].forEach(id=>{$(id).removeAttribute('aria-invalid');});
 }
 function errorCuenta(texto,campo){
  const e=new Error(texto);e.campo=campo;return e;
 }
 function estadoCuenta(){
  const pausado=modo==='registro_pausado'||modo==='recuperar_pausado';
  const registro=modo==='confirmacion_pendiente';
  const e=$('cuentaEstado');
  $('cuentaEstadoMarca').textContent=pausado?'Cuentas en pausa':'Solicitud recibida';
  if(pausado){
   $('cuentaEstadoTexto').textContent='La confirmación obligatoria está activa, pero RWAdar todavía no tiene un servicio de correo propio probado. Para no dejar cuentas bloqueadas, no recogemos nuevas altas ni solicitudes de recuperación por ahora.';
   $('cuentaEstadoCorreo').hidden=true;$('cuentaEstadoCorreo').textContent='';
   $('cuentaPaso1').textContent='Puedes usar todo el radar sin cuenta.';
   $('cuentaPaso2').textContent='Las cuentas que ya funcionan pueden seguir entrando.';
   $('cuentaPaso3').textContent='Reabriremos este paso cuando hayamos comprobado que el correo funciona de principio a fin.';
  }else{
   $('cuentaEstadoTexto').textContent=registro
    ?'Hemos pedido que te envíen el correo, pero no podemos confirmar que te llegue. Si lo recibes, abre su enlace.'
    :'Hemos pedido que te envíen el correo, pero no podemos confirmar que te llegue. Si lo recibes, abre su enlace para elegir una contraseña nueva.';
   $('cuentaEstadoCorreo').hidden=!correoPendiente;
   $('cuentaEstadoCorreo').textContent=correoPendiente;
   $('cuentaPaso1').textContent='Solicitud aceptada.';
   $('cuentaPaso2').textContent=registro?'Confirmación del correo pendiente.':'Enlace de recuperación pendiente.';
   $('cuentaPaso3').textContent=registro?'Después vuelve a RWAdar e inicia sesión.':'Elige la contraseña nueva desde el enlace.';
  }
  const manual=$('cuentaManual');
  if(manual){manual.hidden=!(registro&&MANUAL_BIENVENIDA);if(!manual.hidden)manual.href=MANUAL_BIENVENIDA;}
  $('cuentaEstadoEntrar').textContent=pausado?'Ya tengo cuenta · Entrar':'Ya lo he hecho · Entrar';
  $('cuentaReenviar').hidden=pausado||!CORREO_AUTH_E2E;
  $('cuentaCambiarCorreo').hidden=pausado;
  e.hidden=false;
 }
 function abrir(m,motivo){
  if(servidor&&['entrar','registro','recuperar'].includes(m||'entrar')){
   if(restauracionCuenta){abrirGestion();return;}
   location.assign('/acceso?volver='+encodeURIComponent(location.pathname));return;
  }
  if(!SERVICIOS_USUARIO_DISPONIBLES){avisar('Las cuentas están en pausa. Puedes consultar todo el radar sin registrarte.');return;}
  const solicitado=m||'entrar';
  modo=!CORREO_AUTH_E2E&&solicitado==='registro'?'registro_pausado':
       !CORREO_AUTH_E2E&&solicitado==='recuperar'?'recuperar_pausado':solicitado;
  const T=TEXTOS[modo];if(!T)return;
  operacionCuenta++;bajaPendiente=null;limpiaSecretos();limpiaErroresCuenta();quitaAntiRobots();
  if(temporizadorReenvio){clearTimeout(temporizadorReenvio);temporizadorReenvio=null;}
  /* Cambiar de modo invalida la operación en curso, que ya no reactivará el
     botón al terminar: sin esto, tras «Confirma tu correo» → «Entrar» el
     botón se quedaba desactivado y no había forma de entrar sin recargar. */
  $('cuentaEnviar').disabled=false;$('cuentaForm').removeAttribute('aria-busy');
  $('cuentaTit').textContent=T.t;
  $('cuentaSub').textContent=(modo===solicitado&&motivo)||T.s;
  const identidad=$('cuentaIdentidad');
  if(identidad){
   const mostrarIdentidad=modo==='nueva_clave'&&identidadConfirmada&&ses&&correoValido(ses.correo||'');
   identidad.hidden=!mostrarIdentidad;
   identidad.textContent=mostrarIdentidad?'Estás cambiando la contraseña de '+ses.correo+'. Si no es tu cuenta, cierra esta ventana.':'';
  }
  $('cuentaEnviar').textContent=T.b||'';
  $('irCambiar').textContent=T.otro||'';
  const esEstado=MODOS_ESTADO.has(modo);
  $('cuentaForm').hidden=esEstado;
  $('cuentaEnlaces').hidden=esEstado;
  $('cuentaEstado').hidden=!esEstado;
  $('campoNombre').hidden=modo!=='registro';
  const borrarCuenta=modo==='borrar_cuenta',sinCorreo=modo==='nueva_clave'||borrarCuenta;
  $('campoCorreo').hidden=sinCorreo;
  $('cCorreo').required=!sinCorreo;
  $('campoClave').hidden=modo==='recuperar';
  $('etiquetaClave').textContent=modo==='nueva_clave'?'Contraseña nueva':'Contraseña';
  $('cClave').required=modo!=='recuperar';
  $('cClave').autocomplete=(modo==='registro'||modo==='nueva_clave')?'new-password':'current-password';
  $('campoClave2').hidden=modo!=='nueva_clave'&&!borrarCuenta;
  $('cClave2').required=modo==='nueva_clave'||borrarCuenta;
  $('cClave2').type=borrarCuenta?'text':'password';
  $('cClave2').minLength=borrarCuenta?6:12;
  $('cClave2').autocomplete=borrarCuenta?'off':'new-password';
  const etiqueta2=$('campoClave2').querySelector&&$('campoClave2').querySelector('label');
  if(etiqueta2)etiqueta2.textContent=borrarCuenta?'Escribe BORRAR para confirmar':'Repite la contraseña nueva';
  $('irRecuperar').hidden=modo==='recuperar'||sinCorreo;
  $('irCambiar').hidden=sinCorreo;
  $('cuentaLegal').hidden=modo!=='registro';
  if(esEstado)estadoCuenta();
  msj('');
  const caja=$('cuentaCaja'),yaAbierta=caja.classList.contains('on');
  if(!yaAbierta){
   /* Cambiar de un panel a esta ventana no navega atrás: ese popstate
      tardío cerraba la confirmación de baja nada más abrirla. */
   if(document.querySelector('#drawer.show,#modal.show,#perfilPanel.show')){
    panelHistorialActivo=false;cierraPanelVisual();
    if(history.state&&history.state.rwadarPanel===true)
     history.replaceState({...history.state,rwadarPanel:false},'',location.href);
   }
   focoCuenta=document.activeElement;
   fondo().forEach(n=>n.setAttribute('inert',''));
  }
  $('velo').classList.add('on');
  caja.classList.add('on'); caja.removeAttribute('inert');
  document.body.classList.add('locked');
  caja.scrollTop=0;
  const movil=typeof matchMedia==='function'&&matchMedia('(max-width:767px),(pointer:coarse)').matches;
  if(!yaAbierta&&movil&&typeof history!=='undefined'&&history.pushState){
   const previo=history.state&&typeof history.state==='object'?history.state:{};
   history.pushState({...previo,rwadarCuenta:true},'',location.href);cuentaHistorial=true;
  }
  /* Si la persona ya está escribiendo en un campo de la ventana, no se le
     mueve el cursor: antes, en un equipo lento, la contraseña acababa
     escrita en el campo del correo. */
  setTimeout(()=>{try{
   const activo=document.activeElement;
   if(activo&&activo.tagName==='INPUT'&&caja.contains(activo))return;
   if(esEstado||movil)caja.focus();
   else $(sinCorreo?'cClave':'cCorreo').focus();
  }catch(e){}},60);
 }
 function cerrar(forzar=false){
  const caja=$('cuentaCaja'),estabaAbierta=caja.classList.contains('on');
  if(!forzar&&estabaAbierta&&cuentaHistorial&&history.state&&history.state.rwadarCuenta===true){
   cuentaHistorial=false;history.back();return;
  }
  operacionCuenta++;quitaAntiRobots();
  $('velo').classList.remove('on');
  caja.classList.remove('on'); caja.setAttribute('inert','');
  limpiaSecretos();$('cCorreo').value='';$('cNombre').value='';correoPendiente='';bajaPendiente=null;
  $('cuentaForm').removeAttribute('aria-busy');
  if(temporizadorReenvio){clearTimeout(temporizadorReenvio);temporizadorReenvio=null;}
  document.body.classList.remove('locked');
  if(estabaAbierta){cuentaHistorial=false;fondo().forEach(n=>n.removeAttribute('inert'));
   if(focoCuenta&&document.contains(focoCuenta))focoCuenta.focus();focoCuenta=null;}
 }
 function msj(txt,bien){
  const m=$('cuentaMsj'); m.className='cuenta-msj'+(txt?(bien?' bien':' mal'):'');
  m.setAttribute('role',txt&&!bien?'alert':'status');
  m.textContent=txt||'';
 }
 function aviso(txt){
  avisar(txt);
 }

 async function enviar(e){
  e.preventDefault();
  if(!SERVICIOS_USUARIO_DISPONIBLES)return;
  const correo=$('cCorreo').value.trim(), clave=$('cClave').value, nombre=$('cNombre').value.trim();
  const modoEnvio=modo,operacion=++operacionCuenta;
  const bot=$('cuentaEnviar'); bot.disabled=true;$('cuentaForm').setAttribute('aria-busy','true');
  limpiaErroresCuenta();msj('');
  try{
   if(['entrar','registro','recuperar'].includes(modoEnvio)&&!correoValido(correo))
    throw errorCuenta('Escribe una dirección de correo válida.','cCorreo');
   if(modoEnvio==='entrar'&&!clave)throw errorCuenta('Escribe tu contraseña.','cClave');
   if(modoEnvio==='registro'&&!CORREO_AUTH_E2E)
    throw new Error('El alta está temporalmente en pausa hasta comprobar el correo de confirmación.');
   if(modoEnvio==='recuperar'&&!CORREO_AUTH_E2E)
    throw new Error('La recuperación está temporalmente en pausa hasta comprobar el correo.');
   if(modoEnvio==='borrar_cuenta'){
    const baja=bajaPendiente;
    if(!baja||!vigente(baja.cuenta)||ses.uid!==baja.uid)throw new Error('La cuenta ha cambiado. Vuelve a entrar.');
    if(!clave)throw errorCuenta('Escribe tu contraseña actual.','cClave');
    if($('cClave2').value.trim()!=='BORRAR')throw errorCuenta('Escribe BORRAR para confirmar la baja.','cClave2');
    const j=await auth('/token?grant_type=password',await conAntiRobots({email:baja.correo,password:clave}));
    if(operacion!==operacionCuenta||modo!==modoEnvio||!vigente(baja.cuenta))return;
    if(!j||typeof j.access_token!=='string'||!j.access_token)throw new Error('No se ha podido confirmar tu contraseña.');
    const u=await auth('/user',null,{metodo:'GET',token:j.access_token});
    if(operacion!==operacionCuenta||modo!==modoEnvio||!vigente(baja.cuenta))return;
    if(!u||u.id!==baja.uid||!u.email_confirmed_at||!Number.isFinite(Date.parse(u.email_confirmed_at))||u.is_anonymous===true)
     throw new Error('No se ha podido verificar la misma cuenta.');
    guarda({access_token:j.access_token,refresh_token:j.refresh_token,expira:Date.now()+(j.expires_in||3600)*1000,
      uid:baja.uid,correo:baja.correo},true);
    await rest('/rpc/borrar_mi_cuenta',{method:'POST',body:'{}'},baja.cuenta);
    if(operacion!==operacionCuenta||modo!==modoEnvio||!vigente(baja.cuenta))return;
    guarda(null);cerrar(true);cerrarPanelPerfil();pinta();
    if(fichaAbierta)pintarVigilar(fichaAbierta);
    aviso('Cuenta y datos asociados borrados.');
   }else if(modoEnvio==='nueva_clave'){
    if(clave.length<12)throw errorCuenta('La contraseña necesita al menos 12 caracteres.','cClave');
    if(clave!==$('cClave2').value)throw errorCuenta('Las dos contraseñas no coinciden.','cClave2');
    const tk=await testigo();if(!tk)throw new Error('El enlace ha caducado. Solicita uno nuevo.');
    if(operacion!==operacionCuenta||modo!==modoEnvio)return;
    await auth('/user',{password:clave},{metodo:'PUT',token:tk});
    if(operacion!==operacionCuenta||modo!==modoEnvio)return;
    msj('Contraseña cambiada. La sesión sigue abierta.',true);
   }else if(modoEnvio==='recuperar'){
    const vuelta=encodeURIComponent(location.origin+'/');
    await auth('/recover?redirect_to='+vuelta,await conAntiRobots({email:correo}));
    if(operacion!==operacionCuenta||modo!==modoEnvio)return;
    correoPendiente=correo;abrir('recuperacion_pendiente');
   }else if(modoEnvio==='registro'){
    if(clave.length<12)throw errorCuenta('La contraseña necesita al menos 12 caracteres.','cClave');
    const vuelta=encodeURIComponent(location.origin+'/');
    const j=await auth('/signup?redirect_to='+vuelta,await conAntiRobots({email:correo,password:clave,
      data:nombre?{nombre:nombre}:undefined}));
    if(operacion!==operacionCuenta||modo!==modoEnvio)return;
    if(j&&typeof j.access_token==='string'&&j.access_token){ await entrarCon(j); }
    else if(j&&typeof j.id==='string'&&j.id&&typeof j.email==='string'){
     correoPendiente=correo;$('cNombre').value='';$('cCorreo').value='';
     abrir('confirmacion_pendiente');
    }else throw new Error('Algo ha fallado al crear la cuenta y no podemos confirmar que se haya creado. Inténtalo de nuevo.');
   }else{
    const j=await auth('/token?grant_type=password',await conAntiRobots({email:correo,password:clave}));
    if(operacion!==operacionCuenta||modo!==modoEnvio)return;
    await entrarCon(j);
   }
  }catch(err){
   if(operacion===operacionCuenta&&modo===modoEnvio){
    msj(err.message);if(err.campo){$(err.campo).setAttribute('aria-invalid','true');$(err.campo).focus();}
   }
  }finally{
   if(operacion===operacionCuenta){limpiaSecretos();bot.disabled=false;$('cuentaForm').removeAttribute('aria-busy');quitaAntiRobots();}
  }
 }
 async function reenviarConfirmacion(){
  if(!CORREO_AUTH_E2E||!correoValido(correoPendiente))return;
  const bot=$('cuentaReenviar'),operacion=++operacionCuenta,modoEnvio=modo;
  bot.disabled=true;bot.setAttribute('aria-busy','true');msj('');
  try{
   const vuelta=encodeURIComponent(location.origin+'/');
   if(modoEnvio==='confirmacion_pendiente')
    await auth('/resend?redirect_to='+vuelta,await conAntiRobots({type:'signup',email:correoPendiente}));
   else if(modoEnvio==='recuperacion_pendiente')
    await auth('/recover?redirect_to='+vuelta,await conAntiRobots({email:correoPendiente}));
   else return;
   if(operacion!==operacionCuenta||modo!==modoEnvio)return;
   msj('Hemos pedido el reenvío, pero no podemos confirmar que el correo te llegue.',true);
   bot.textContent='Espera un minuto para reintentar';
   temporizadorReenvio=setTimeout(()=>{
    if(modo===modoEnvio){bot.disabled=false;bot.textContent='Reintentar correo';}
    temporizadorReenvio=null;
   },60000);
  }catch(err){if(operacion===operacionCuenta&&modo===modoEnvio){msj(err.message);bot.disabled=false;}}
  finally{if(operacion===operacionCuenta){bot.removeAttribute('aria-busy');quitaAntiRobots();}}
 }
 async function entrarCon(j){
  if(!j||typeof j.access_token!=='string'||!j.access_token)
   throw new Error('La sesión recibida no es válida.');
  guarda({access_token:j.access_token,refresh_token:j.refresh_token,
          expira:Date.now()+(j.expires_in||3600)*1000,
          correo:(j.user&&j.user.email)||'', uid:(j.user&&j.user.id)||''});
  identidadConfirmada=false;
  const cuenta=versionCuenta,operacion=operacionCuenta;
  if(!await confirmarIdentidad()){
   if(cuenta!==versionCuenta||operacion!==operacionCuenta)return;
   guarda(null);identidadConfirmada=false;pinta();
   throw new Error('No se ha podido verificar la sesión. Vuelve a entrar.');
  }
  if(cuenta!==versionCuenta)return;
  if(operacion!==operacionCuenta){guarda(null);pinta();return;}
  if(modo==='registro'&&$('cNombre').value.trim()){
   try{ await rest('/perfiles?id=eq.'+encodeURIComponent(ses.uid),{method:'PATCH',body:JSON.stringify({nombre:$('cNombre').value.trim()})},cuenta); }catch(e){}
  }
  const cargado=await cargarMio(cuenta);
  if(cuenta!==versionCuenta)return;
  if(operacion!==operacionCuenta){guarda(null);pinta();return;}
  if(!cargado){guarda(null);pinta();throw new Error('No se ha podido cargar tu cuenta. Vuelve a entrar.');}
  cerrar(); pinta();
  if(fichaAbierta) pintarVigilar(fichaAbierta);
  aviso('Hola' + (perfil&&perfil.nombre?' '+perfil.nombre:'') + '. Sesión iniciada.');
 }

 /* --- el área de la persona --------------------------------------- */
 let carteraVista=null;
 function abrirPerfil(soloPintar=false){
  if(carteraVista){carteraVista.desmontar();carteraVista=null;}
  if(!identidadConfirmada||!ses)return;
  const cuenta=versionCuenta;
  const c=$('perfilCuerpo'); if(!c) return;
  const nom=(perfil&&perfil.nombre)||(ses.correo||'').split('@')[0];
  const dias=Math.max(0,Number.parseInt(perfil&&perfil.dias_de_miembro,10)||0);
  const avisosRecibidos=Math.max(0,Number.parseInt(perfil&&perfil.avisos_recibidos,10)||0);
  const desde=perfil&&perfil.miembro_desde?new Date(perfil.miembro_desde).toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'}):'—';
  const lista=[...vigiladas.keys()].filter(Boolean).sort((a,b)=>a.localeCompare(b,'es'));
  const correoConsentido=consentimientoCorreoVigente(perfil);
  c.innerHTML=
   '<div class="perfil-cab"><div class="perfil-ini" translate="no">'+esc(nom.slice(0,1))+'</div>'+
   '<div><div class="quien" translate="no">'+esc(nom)+'</div><div class="correo" translate="no">'+esc(ses.correo||'')+'</div></div></div>'+
   (datosCuentaError?'<p class="perfil-nota" role="status">No se pudieron cargar los datos de tu cuenta. Tu sesión sigue abierta. <button id="pfReintentarCuenta" type="button">Reintentar datos de cuenta</button></p>':'')+
   '<div id="pfInversiones"></div>'+
   (AVISOS_BANDEJA_DISPONIBLE
     ? '<section class="perfil-bandeja" aria-labelledby="pfBandejaTit"><h3 id="pfBandejaTit">Avisos recibidos</h3>'+
       '<p class="perfil-nota perfil-ayuda">La bienvenida de tu cuenta y los anuncios de RWAdar.</p><div id="pfBandeja"></div></section>'
     : '')+
   '<details class="perfil-opciones"><summary>Cuenta y plataformas que sigues</summary>'+
   '<div class="perfil-cifras">'+
    '<div><span class="n">'+dias+'</span><span class="l">Días<br>de miembro</span></div>'+
    '<div><span class="n">'+lista.length+'</span><span class="l">Plataformas<br>que sigues</span></div>'+
    '<div><span class="n">'+avisosRecibidos+'</span><span class="l">Avisos<br>recibidos</span></div>'+
   '</div>'+
   '<p class="perfil-nota">Miembro desde el '+desde+'.</p>'+ 
   '<div class="perfil-sec">'+(OPINIONES_DISPONIBLES?'Identidad pública':'Tu nombre')+'</div>'+
   '<div class="perfil-editar"><label for="pfNombre">'+(OPINIONES_DISPONIBLES?'Nombre junto a tus opiniones':'Cómo quieres que te saludemos')+
     '<input id="pfNombre" translate="no" type="text" maxlength="60" autocomplete="name" value="'+esc((perfil&&perfil.nombre)||'')+'"></label>'+
     '<button id="pfGuardarNombre" type="button">Guardar nombre</button></div>'+
   (OPINIONES_DISPONIBLES
     ? '<p class="perfil-nota perfil-ayuda">Si lo dejas vacío, tus opiniones aparecen como «Anónimo».</p>'
     : '<p class="perfil-nota perfil-ayuda">Solo lo ves tú. Las opiniones llegarán próximamente.</p>')+ 
   (MANUAL_BIENVENIDA
     ? '<div class="perfil-sec">Manual de uso</div>'+
       '<p class="perfil-nota">Cómo verificamos, cómo leer una ficha, los filtros, el comparador y por qué conviene mirar «Descartadas» primero.</p>'+
       '<a class="perfil-manual" id="pfManual" href="'+esc(MANUAL_BIENVENIDA)+'" target="_blank" rel="noopener">Descargar el manual (PDF, 10 páginas)</a>'
     : '')+
   '<div class="perfil-sec">Las que sigues</div>'+
   (lista.length
     ? '<ul class="vig-lista">'+lista.map(n=>'<li><span>'+esc(n)+'</span><button data-q="'+esc(n)+'">quitar</button></li>').join('')+'</ul>'
     : '<p class="perfil-nota">Todavía no sigues ninguna. Abre la ficha de cualquier plataforma del radar y pulsa «Seguir» para guardarla aquí.</p>')+
   '<div class="perfil-sec">Avisos</div>'+
   (AVISOS_NOVEDADES_DISPONIBLES
     ? '<label class="fila-opcion"><input type="checkbox" role="switch" id="pfNovedades" disabled><span><b>Avisos de novedades.</b> '+conEnlacePrivacidad(TEXTO_AVISOS_NOVEDADES,'/privacidad#avisos-novedades')+'</span></label>'+
       '<p class="perfil-nota perfil-ayuda" id="pfNovedadesEstado" role="status"></p>'+
       '<p class="perfil-nota perfil-ayuda">'+conEnlacePrivacidad(INFO_DATOS_AVISOS,'/privacidad')+'</p>'
     : AVISOS_CORREO_DISPONIBLES
     ? '<label class="fila-opcion"><input type="checkbox" id="optAvisos" aria-describedby="optAvisosAyuda"'+(correoConsentido?' checked':'')+'>'+
       '<span><b>Quiero recibir por correo avisos de cambios</b> en las plataformas que sigo. Al marcarlo doy mi consentimiento explícito, que puedo retirar aquí cuando quiera.</span></label>'+
       '<p class="perfil-nota perfil-ayuda" id="optAvisosAyuda">Está desactivado por defecto. Aunque lo aceptes, todavía no enviamos estos avisos: falta configurar el servicio de correo y probar que los mensajes llegan. Consulta la <a href="/privacidad">política de privacidad</a>.</p>'
     : '<p class="perfil-nota">Próximamente: avisos por correo cuando cambie una plataforma que sigues. Se activarán solo si tú lo pides. Mientras tanto, tu lista queda guardada en tu cuenta.</p>')+
   '</details><div class="perfil-pie">'+
    '<button id="pfSalir">Cerrar sesión</button>'+
    '<button class="peligro" id="pfBorrar">Borrar mi cuenta</button>'+
   '</div>';
  const contenedorInversiones=$('pfInversiones');
  try{
   if(!window.RWAdarInversionesUI||!window.RWAdarCarteraCuenta||!window.RWAdarCarteraModelo)throw new Error('Registro no disponible');
   const uidCartera=ses.uid,cuentaVigente=()=>vigente(cuenta)&&identidadConfirmada&&ses&&ses.uid===uidCartera;
   const adaptador=window.RWAdarCarteraCuenta.paraUsuario(uidCartera,{vigente:cuentaVigente});
   const vista=window.RWAdarInversionesUI.montar(contenedorInversiones,{...adaptador,usuarioId:uidCartera,modelo:window.RWAdarCarteraModelo,vigente:cuentaVigente});
   carteraVista={desmontar(){vista.desmontar();if(adaptador.destruir)adaptador.destruir();}};
  }catch(_){
   contenedorInversiones.innerHTML='<h3>Mis inversiones</h3><p class="perfil-nota">No se pudo abrir el registro. Cierra y vuelve a abrir tu cuenta para reintentar. Tus datos se conservan.</p>';
  }
  const reintentar=$('pfReintentarCuenta');if(reintentar)reintentar.addEventListener('click',async()=>{
   reintentar.disabled=true;await cargarMio(cuenta);
   if(vigente(cuenta)&&identidadConfirmada){pinta();abrirPerfil(true);}
  });
  c.querySelectorAll('.vig-lista button').forEach(b=>b.addEventListener('click',async()=>{
   const nombre=b.dataset.q;b.disabled=true;await alternar(nombre);if(vigente(cuenta))abrirPerfil(true);
  }));
  const g=$('pfGuardarNombre');if(g)g.addEventListener('click',async()=>{
   const n=$('pfNombre').value.trim();g.disabled=true;
   try{const uid=ses.uid,filas=await rest('/perfiles?id=eq.'+encodeURIComponent(uid),{method:'PATCH',body:JSON.stringify({nombre:n||null})},cuenta);
     if(!Array.isArray(filas)||filas.length!==1||filas[0].id!==uid||filas[0].nombre!==(n||null))
      throw new Error('No se ha podido confirmar el cambio de nombre.');
     if(perfil)perfil.nombre=n||null;pinta();abrirPerfil();aviso(OPINIONES_DISPONIBLES?'Nombre público guardado.':'Nombre guardado.');
   }catch(e){if(vigente(cuenta)){g.disabled=false;aviso('No se ha podido guardar el nombre.');}}
  });
  const o=$('optAvisos'); if(o) o.addEventListener('change',async()=>{
   const anterior=correoConsentido,deseado=o.checked;o.disabled=true;
   try{
    const filas=await rest('/rpc/configurar_avisos_correo',{method:'POST',body:JSON.stringify({
     p_habilitado:deseado,p_version:VERSION_CONSENTIMIENTO_CORREO
    })},cuenta);
    perfil=perfilDesdeRespuestaCorreo(perfil,filas&&filas[0],deseado);
    o.checked=consentimientoCorreoVigente(perfil);
    aviso(deseado
     ? 'Consentimiento guardado. Todavía no enviamos estos avisos: falta configurar el servicio de correo y probar que los mensajes llegan.'
     : 'Consentimiento retirado. No se enviarán nuevos avisos de cambios por correo.');
   }catch(e){
    if(!vigente(cuenta))return;
    o.checked=anterior;
    aviso(deseado
     ? 'No se ha guardado el consentimiento; sigue desactivado.'
     : 'No se ha podido confirmar la retirada; la preferencia sigue activada. Vuelve a intentarlo.');
   }finally{if(vigente(cuenta))o.disabled=false;}
  });
  const pfn=$('pfNovedades');
  if(pfn&&AVISOS_NOVEDADES_DISPONIBLES){pfn.addEventListener('change',cambiarNovedades);pintarNovedades();cargarNovedades().catch(()=>{});}
  if(AVISOS_BANDEJA_DISPONIBLE){pintarBandeja();cargarBandeja().catch(()=>{});}
  /* Solo se anota la fecha de la primera descarga, en el propio perfil. */
  const m=$('pfManual'); if(m) m.addEventListener('click',()=>{
   rest('/rpc/marcar_manual_descargado',{method:'POST',body:'{}',keepalive:true}).catch(()=>{});
  });
  const s=$('pfSalir'); if(s) s.addEventListener('click',salir);
  const b=$('pfBorrar'); if(b) b.addEventListener('click',borrar);
  if(!soloPintar)openPanel('perfilPanel');
  /* La moderación se pide DESPUÉS de abrir: si la base dice que no eres
     administrador devuelve cero filas y aquí no aparece nada. */
  if(OPINIONES_DISPONIBLES && perfil && perfil.es_admin) pintarModeracion();
 }
 /* --- moderación (solo administradores) --------------------------- */
 async function pintarModeracion(){
  const c=$('perfilCuerpo'); if(!c) return;
  let caja=$('modZona');
  if(!caja){ caja=document.createElement('div'); caja.id='modZona';
    c.querySelector('.perfil-pie').insertAdjacentElement('beforebegin',caja); }
  caja.innerHTML='<div class="perfil-sec">Moderación</div><p class="perfil-nota">Cargando…</p>';

  let filas=[];
  try{ filas=(await rest('/cola_moderacion?select=*'))||[]; }
  catch(e){ caja.innerHTML='<div class="perfil-sec">Moderación</div><p class="perfil-nota">No se ha podido cargar la cola.</p>'; return; }

  if(!filas.length){
   caja.innerHTML='<div class="perfil-sec">Moderación</div>'+
     '<p class="perfil-nota">Nada pendiente. Aquí aparecen las opiniones denunciadas y las que se han ocultado solas.</p>';
   return;
  }

  caja.innerHTML='<div class="perfil-sec">Moderación · '+filas.length+' pendiente'+(filas.length===1?'':'s')+'</div>'+
   '<p class="mod-aviso">Con tres denuncias la opinión se oculta sola. Revísala: si la queja no justifica retirarla, restáurala — '+
   'restaurar borra las denuncias para que no la vuelvan a tumbar. Cada decisión queda fechada y asociada a tu cuenta mientras exista.</p>'+
   '<ul class="mod-lista">'+filas.map(f=>{
     const motivos=(Array.isArray(f.motivos)?f.motivos:[]).map(m=>esc(m)).join(' · ');
     const denuncias=Math.max(0,Number.parseInt(f.denuncias,10)||0);
     const nota=Number(f.nota);const notaVisible=Number.isFinite(nota)?Math.max(1,Math.min(10,nota)):'—';
     return '<li class="'+(f.estado==='oculta'?'oculta':'')+'">'+
      '<div class="mod-cab"><span class="mod-den">'+denuncias+' denuncia'+(denuncias===1?'':'s')+'</span>'+
      '<span class="op-nota">'+notaVisible+'/10</span>'+
      '<span class="op-autor">'+esc(f.autor)+'</span>'+
      '<span class="mod-estado">'+esc(f.plataforma)+' · '+(f.estado==='oculta'?'oculta':'visible')+'</span></div>'+
      '<p class="mod-texto">'+esc(f.texto)+'</p>'+
      (motivos?'<p class="mod-motivos"><b>Motivos:</b> '+motivos+'</p>':'')+
      '<div class="mod-bot">'+
        (f.estado==='oculta'
          ? '<button class="restaurar" data-a="restaurar" data-o="'+esc(f.opinion_id)+'">Restaurar</button>'
          : '<button class="ocultar" data-a="ocultar" data-o="'+esc(f.opinion_id)+'">Ocultar</button>')+
      '</div></li>';
   }).join('')+'</ul>';

  caja.querySelectorAll('.mod-bot button').forEach(b=>b.addEventListener('click',async()=>{
    const motivo=prompt(b.dataset.a==='ocultar'
      ? '¿Por qué la ocultas? (queda registrado)'
      : '¿Por qué la restauras? (queda registrado)');
    if(motivo===null) return;
    b.disabled=true; b.textContent='…';
    try{
     await rest('/rpc/moderar',{method:'POST',body:JSON.stringify({
       p_opinion_id:b.dataset.o,p_accion:b.dataset.a,p_motivo:motivo.trim().slice(0,500)||null})});
     aviso(b.dataset.a==='ocultar'?'Opinión ocultada.':'Opinión restaurada.');
     await pintarModeracion();
    }catch(e){ b.disabled=false; b.textContent=b.dataset.a==='ocultar'?'Ocultar':'Restaurar'; aviso('No se ha podido.'); }
  }));
 }
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

 async function salir(){
  const tk=ses&&ses.access_token;
  operacionCuenta++;
  guarda(null);identidadConfirmada=false;perfil=null;vigiladas=new Map();cerrarPanelPerfil();pinta();
  if(servidor){await servidor.salir();return;}
  if(fichaAbierta) pintarVigilar(fichaAbierta);
  const cuenta=versionCuenta;
  aviso('Has salido de esta pestaña. Comprobando el cierre en el servidor…');
  /* La interfaz sale antes de esperar a la red. Una respuesta de la sesión
     anterior no puede cerrar otra entrada posterior. */
  try{
   if(tk)await auth('/logout?scope=local',null,{token:tk});
   if(cuenta===versionCuenta)aviso('Sesión cerrada.');
  }catch(e){
   if(cuenta===versionCuenta)aviso('Has salido de esta pestaña, pero no hemos podido confirmar el cierre en el servidor. Puede que la sesión siga abierta en otros dispositivos. Si quieres cerrarla en todos, contacta con RWAdar.');
  }
 }
 function borrar(){
  if(!identidadConfirmada||!ses)return;
  const baja={cuenta:versionCuenta,uid:ses.uid,correo:ses.correo};
  abrir('borrar_cuenta');bajaPendiente=baja;
 }
 function cerrarPanelPerfil(){
  if(carteraVista){carteraVista.desmontar();carteraVista=null;}
  closeAll();
 }

 /* --- avisos de novedades (solo con AVISOS_NOVEDADES_DISPONIBLES) --- */
 /* El permiso vive en la base (rpc/estado_mis_avisos y
    rpc/configurar_avisos_novedades, por /api/acceso/datos). Aquí solo se
    guarda en memoria lo último que dijo la base para esta cuenta. */
 let novedades=null,novedadesCuenta=-1,novedadesError=false,novedadesGuardando=false,novedadesDeseado=false;
 const novedadesActivas=()=>!!novedades&&novedades.novedades===true&&novedades.version===novedades.version_vigente;
 function estadoNovedades(j){
  if(!j||typeof j!=='object'||Array.isArray(j)||typeof j.novedades!=='boolean'||typeof j.version_vigente!=='string')
   throw new Error('Respuesta de avisos no válida.');
  return {novedades:j.novedades,version:typeof j.version==='string'?j.version:null,version_vigente:j.version_vigente,
   correo_activo:j.correo_activo===true,push_activo:j.push_activo===true};
 }
 function textoNovedades(){
  if(!identidadConfirmada||!ses)return 'Entra en tu cuenta para activarlos o desactivarlos.';
  if(novedadesError)return 'No se ha podido comprobar tu preferencia. Recarga la página para reintentarlo.';
  if(!novedades)return 'Comprobando tu preferencia…';
  if(novedades.version_vigente!==VERSION_AVISOS_NOVEDADES)return 'El texto de los avisos ha cambiado. Recarga la página para verlo.';
  if(novedadesGuardando)return 'Guardando…';
  if(!novedadesActivas())return 'Desactivados. Puedes activarlos cuando quieras.';
  return novedades.correo_activo||novedades.push_activo
   ?'Activados. Puedes desactivarlos cuando quieras.':'Activados. Todavía no hemos empezado a enviarlos.';
 }
 /* Idioma en que se ve el texto junto al interruptor, para guardarlo con el
    permiso: «en» solo si la web está en inglés y ese texto se ha traducido de
    verdad (si falta en el diccionario, se ve en castellano). Si no, «es». */
 function idiomaNovedades(o){
  try{
   const ingles=typeof RWAdarIdioma!=='undefined'&&RWAdarIdioma.obtenerIdioma()==='en';
   const texto=String((o.closest('label')||{}).textContent||'').trim();
   return ingles&&texto!==''&&!texto.includes('Quiero recibir avisos')?'en':'es';
  }catch(e){return 'es';}
 }
 function pintarNovedades(){
  if(!AVISOS_NOVEDADES_DISPONIBLES)return;
  const tarjeta=$('perfilAvisosNovedades'),anterior=$('perfilAvisosProximamente');
  if(tarjeta)tarjeta.hidden=false;
  if(anterior)anterior.hidden=true;
  for(const [idOpcion,idEstado] of [['perfilNovedadesOpcion','perfilNovedadesEstado'],['pfNovedades','pfNovedadesEstado']]){
   const o=$(idOpcion),e=$(idEstado);if(!o||!e)continue;
   o.checked=novedadesGuardando?novedadesDeseado:novedadesActivas();
   o.disabled=!identidadConfirmada||!ses||!novedades||novedadesGuardando||novedades.version_vigente!==VERSION_AVISOS_NOVEDADES;
   e.textContent=textoNovedades();
  }
 }
 async function cargarNovedades(){
  if(!AVISOS_NOVEDADES_DISPONIBLES||!identidadConfirmada||!ses||novedadesCuenta===versionCuenta)return;
  const cuenta=versionCuenta;
  novedadesCuenta=cuenta;novedades=null;novedadesError=false;novedadesGuardando=false;pintarNovedades();
  try{
   const j=estadoNovedades(await rest('/rpc/estado_mis_avisos',{method:'POST',body:'{}'},cuenta));
   if(!vigente(cuenta))return;
   novedades=j;
  }catch(e){
   if(!vigente(cuenta))return;
   novedadesError=true;novedadesCuenta=-1;
  }
  pintarNovedades();
 }
 async function cambiarNovedades(evento){
  const o=evento&&evento.target;
  if(!AVISOS_NOVEDADES_DISPONIBLES||!o||!identidadConfirmada||!ses||!novedades||novedadesGuardando)return;
  const cuenta=versionCuenta,deseado=o.checked===true,idioma=idiomaNovedades(o);
  novedadesGuardando=true;novedadesDeseado=deseado;pintarNovedades();
  try{
   const j=estadoNovedades(await rest('/rpc/configurar_avisos_novedades',{method:'POST',body:JSON.stringify({
    p_activar:deseado,p_version:VERSION_AVISOS_NOVEDADES,p_canal:'web',p_idioma:idioma})},cuenta));
   if(!vigente(cuenta))return;
   novedades=j;
   if(novedadesActivas()!==deseado)throw new Error('Cambio no confirmado.');
   aviso(deseado?'Avisos de novedades activados. Puedes darte de baja aquí o con el enlace de cada correo.':'Avisos de novedades desactivados.');
  }catch(e){
   if(!vigente(cuenta))return;
   aviso(deseado?'No se han activado los avisos de novedades. Vuelve a intentarlo.'
    :'No se ha podido confirmar la baja de los avisos de novedades. Vuelve a intentarlo.');
  }finally{
   if(vigente(cuenta)){novedadesGuardando=false;pintarNovedades();}
  }
 }

 /* --- bandeja de avisos (solo con AVISOS_BANDEJA_DISPONIBLE) ----- */
 /* Lo que dice la base de esta cuenta, en memoria; nada se guarda en el
    navegador. Las mismas reglas que la app (lib/avisos-cuenta.js): un aviso
    con un campo raro no se enseña y un enlace solo vale si es de
    https://rwadar.pages.dev. */
 let bandeja=null,bandejaCuenta=-1,bandejaError=false;
 const TIPOS_BANDEJA=['bienvenida','ofertas','actualizacion','novedad'];
 const ENLACE_BANDEJA=/^https:\/\/rwadar\.pages\.dev(\/[A-Za-z0-9._~%-]+)*\/?([?#][A-Za-z0-9._~%=&-]*)?$/;
 function avisoBandeja(f){
  if(!f||typeof f!=='object'||Array.isArray(f)||!TIPOS_BANDEJA.includes(f.tipo))return null;
  const bienvenida=f.tipo==='bienvenida';
  if(typeof f.id!=='string'||!/^(?:bienvenida|[1-9]\d{0,18})$/.test(f.id)||(f.id==='bienvenida')!==bienvenida)return null;
  const texto=(v,max)=>typeof v==='string'&&v.trim()&&v.length<=max&&!/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/.test(v)?v.trim():'';
  const titulo=texto(f.titulo,120),cuerpo=texto(f.texto,600);
  if(!titulo||!cuerpo)return null;
  let enlace='';
  if(f.enlace!==null){
   if(typeof f.enlace!=='string'||f.enlace.length>200||!ENLACE_BANDEJA.test(f.enlace))return null;
   try{const u=new URL(f.enlace);if(u.username||u.password||u.port)return null;enlace=u.pathname+u.search+u.hash;}catch(e){return null;}
  }
  const valida=typeof f.creado_el==='string'&&f.creado_el.length<=40&&/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(f.creado_el)&&Number.isFinite(Date.parse(f.creado_el));
  if(!valida&&!(bienvenida&&f.creado_el===null))return null;
  return {id:f.id,titulo,texto:cuerpo,enlace,fecha:valida?new Date(f.creado_el):null};
 }
 function pintarBandeja(){
  const caja=$('pfBandeja');
  if(!AVISOS_BANDEJA_DISPONIBLE||!caja)return;
  /* Solo lo de la cuenta abierta: nunca la lista de otra que salió antes. */
  const propia=bandejaCuenta===versionCuenta,lista=propia?bandeja:null;
  const dos=n=>String(n).padStart(2,'0'),dia=d=>dos(d.getDate())+'/'+dos(d.getMonth()+1)+'/'+d.getFullYear();
  const iso=d=>d.getFullYear()+'-'+dos(d.getMonth()+1)+'-'+dos(d.getDate());
  caja.innerHTML=propia&&bandejaError
   ?'<p class="perfil-nota" role="status">No se pudieron cargar tus avisos. Cierra y vuelve a abrir tu cuenta para reintentarlo.</p>'
   :!lista?'<p class="perfil-nota" role="status">Cargando tus avisos…</p>'
   :!lista.length?'<p class="perfil-nota">Aquí verás la bienvenida y los anuncios de RWAdar.</p>'
   :'<ul class="bandeja-avisos">'+lista.map(a=>'<li><b>'+esc(a.titulo)+'</b><p>'+esc(a.texto)+'</p>'+
     (a.fecha?'<time datetime="'+iso(a.fecha)+'">'+dia(a.fecha)+'</time>':'')+
     (a.enlace?' <a href="'+esc(a.enlace)+'" aria-label="'+esc('Abrir '+a.titulo)+'">Abrir</a>':'')+'</li>').join('')+'</ul>';
 }
 async function cargarBandeja(){
  if(!AVISOS_BANDEJA_DISPONIBLE||!identidadConfirmada||!ses)return;
  /* Ya cargada o en camino para esta cuenta; tras un error, se reintenta. */
  if(bandejaCuenta===versionCuenta&&!bandejaError)return;
  const cuenta=versionCuenta;
  bandejaCuenta=cuenta;bandeja=null;bandejaError=false;pintarBandeja();
  try{
   const filas=await rest('/rpc/mis_avisos_recientes',{method:'POST',body:JSON.stringify({p_limite:10})},cuenta);
   if(!vigente(cuenta))return;
   if(!Array.isArray(filas)||filas.length>50)throw new Error('Respuesta de avisos no válida.');
   const vistos=new Set();
   bandeja=filas.map(avisoBandeja).filter(a=>a&&!vistos.has(a.id)&&vistos.add(a.id)).slice(0,10);
  }catch(e){
   if(!vigente(cuenta))return;
   bandejaError=true;
  }
  pintarBandeja();
 }

 /* --- estado del botón de la cabecera ----------------------------- */
 function pinta(){
  /* La comunidad escucha este aviso para enseñar u ocultar el formulario. */
  if(typeof document!=='undefined'&&document.dispatchEvent&&typeof CustomEvent==='function')
   document.dispatchEvent(new CustomEvent('rwadar:sesion'));
  const b=$('btnCuenta'); if(!b) return;
  b.disabled=!SERVICIOS_USUARIO_DISPONIBLES;
  if(!SERVICIOS_USUARIO_DISPONIBLES){
   b.textContent='Cuentas en pausa';b.setAttribute('aria-label','Cuentas en pausa; consulta el radar sin registrarte');
   pintaMovil();return;
  }
  if(identidadConfirmada&&ses){
   const nom=(perfil&&perfil.nombre)||(ses.correo||'?').split('@')[0];
   b.innerHTML='<span class="ini" translate="no">'+esc(nom.slice(0,1))+'</span><span>Mis inversiones</span>';
   b.setAttribute('aria-label','Mis inversiones y mi cuenta');
  /* Sin sesión el botón lleva a entrar: dice «Entrar» (QA 04/11/2026, n.º 27). */
  }else{ b.textContent='Entrar'; b.setAttribute('aria-label','Entrar o crear una cuenta para registrar mis inversiones'); }
  pintaMovil();
 }
 function pintaMovil(){
  /* Solo la tarjeta «Tu perfil». Empresas y ofertas guardadas las pinta
     Movil desde Favoritos, haya o no cuenta. */
  const titulo=$('movilPerfilTitulo'),texto=$('movilSiguiendoTexto'),accion=$('movilCuentaAccion');
  if(!SERVICIOS_USUARIO_DISPONIBLES){
   if(titulo)titulo.textContent='Sin cuenta, por ahora';
   if(texto)texto.textContent='Las cuentas llegarán pronto. Mientras tanto, lo que guardas se queda en este navegador.';
   if(accion){accion.textContent='Cuentas en pausa';accion.disabled=true;}
   return;
  }
  const cantidad=vigiladas.size;
  if(titulo)titulo.textContent=identidadConfirmada&&ses
   ?((perfil&&perfil.nombre)||(ses.correo||'').split('@')[0]||'Tu cuenta'):'Mis inversiones';
  if(titulo){if(identidadConfirmada&&ses){titulo.setAttribute('translate','no');titulo.setAttribute('lang','es');}else{titulo.removeAttribute('translate');titulo.removeAttribute('lang');}}
  if(texto)texto.textContent=identidadConfirmada
   ?'Tu registro manual de compras, valoraciones y cobros, compartido entre la web y la app con tu cuenta.'
   :'Registra tus compras, valoraciones y cobros y consulta tu resultado. Entra o crea una cuenta gratuita; el registro es manual.';
  /* El HTML nace con el botón desactivado (pausa); al abrir cuentas hay que
     habilitarlo aquí o en el móvil no habría forma de entrar. */
  if(accion){accion.disabled=false;accion.textContent=identidadConfirmada?'Ver mis inversiones':'Entrar o crear cuenta';}
  if(AVISOS_NOVEDADES_DISPONIBLES){
   if(!identidadConfirmada||!ses){novedades=null;novedadesCuenta=-1;novedadesError=false;novedadesGuardando=false;}
   pintarNovedades();cargarNovedades().catch(()=>{});
  }
 }
 async function abrirGestion(){
  if(!SERVICIOS_USUARIO_DISPONIBLES){avisar('Las cuentas están en pausa. Para gestionar datos anteriores, escribe a RWAdar@protonmail.com.');return;}
  if(restauracionCuenta){avisar('Comprobando tu sesión…');await restauracionCuenta;}
  if(identidadConfirmada&&ses)abrirPerfil();
  else abrir('entrar','Entra o crea una cuenta gratuita para registrar tus compras, valoraciones y cobros y consultar tu resultado.');
 }

 /* --- arranque ---------------------------------------------------- */
 function iniciar(){
  if(typeof window!=='undefined'&&window.ReactNativeWebView&&typeof location!=='undefined'&&location.pathname==='/'&&location.hash==='#explain')return;
  if(!SERVICIOS_USUARIO_DISPONIBLES)return;
  const b=$('btnCuenta'); if(!b) return;          /* en el pre-renderizado no hay DOM */
  b.addEventListener('click',()=>abrirGestion());
  $('cuentaX').addEventListener('click',cerrar);
  $('velo').addEventListener('click',()=>{cerrar();cerrarPanelPerfil();});
  $('perfilX').addEventListener('click',cerrarPanelPerfil);
  $('cuentaForm').addEventListener('submit',enviar);
  $('irCambiar').addEventListener('click',()=>abrir(modo==='entrar'?'registro':'entrar'));
  $('irRecuperar').addEventListener('click',()=>abrir('recuperar'));
  $('cuentaEstadoEntrar').addEventListener('click',()=>{
   const correo=correoPendiente;abrir('entrar');
   if(correo)$('cCorreo').value=correo;
  });
  $('cuentaReenviar').addEventListener('click',reenviarConfirmacion);
  $('cuentaCambiarCorreo').addEventListener('click',()=>{
   const correo=correoPendiente;abrir('registro');
   if(CORREO_AUTH_E2E&&correo)$('cCorreo').value=correo;
  });
  $('cuentaVolver').addEventListener('click',cerrar);
  const opcionNovedades=$('perfilNovedadesOpcion');
  if(opcionNovedades&&AVISOS_NOVEDADES_DISPONIBLES)opcionNovedades.addEventListener('change',cambiarNovedades);
  document.addEventListener('keydown',e=>{
   if(e.key==='Escape'&&$('cuentaCaja').classList.contains('on')){e.preventDefault();cerrar();}
  });
  window.addEventListener('popstate',()=>{
   if($('cuentaCaja').classList.contains('on')&&!(history.state&&history.state.rwadarCuenta===true))cerrar(true);
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){cerrar();cerrarPanelPerfil();}});

  const parametrosRetorno=typeof location!=='undefined'&&location.hash
    ?new URLSearchParams(location.hash.slice(1)):null;
  const retorno=!!(parametrosRetorno&&(parametrosRetorno.get('access_token')||
    parametrosRetorno.has('error')||parametrosRetorno.has('error_code')||parametrosRetorno.has('error_description')));
  pinta();

  if(servidor){
   restauracionCuenta=servidor.verificar().then(async u=>{
    guarda({access_token:'sesion-http-only',uid:u.id,correo:u.correo,expira:0});
    identidadConfirmada=true;
    await cargarMio();
    pinta();if(fichaAbierta)pintarVigilar(fichaAbierta);
   }).catch(()=>{}).finally(()=>{restauracionCuenta=null;});
   return;
  }

  /* Confirmación de correo y recuperación usan un fragmento para que los
     testigos no viajen al servidor ni queden en su registro de accesos. */
  if(retorno){
   const p=parametrosRetorno;
   const error=p.has('error_description')||p.has('error')||p.has('error_code');
   const tipo=p.get('type')||'';
   const acceso=p.get('access_token');
   history.replaceState(null,'',location.pathname+location.search);
   if(error){abrir('entrar');msj(mensajeErrorRetorno(p));}
   else if(acceso&&ses){
    aviso('Ya hay una cuenta abierta en esta pestaña. Cierra la sesión antes de usar otro enlace.');
   }else if(acceso&&!['signup','recovery'].includes(tipo)){
    guarda(null);identidadConfirmada=false;abrir('entrar');
    msj('El tipo de enlace no es válido. Solicita uno nuevo desde RWAdar.');
   }else if(acceso){
    guarda({access_token:acceso,refresh_token:p.get('refresh_token')||'',
      expira:Date.now()+(Number(p.get('expires_in'))||3600)*1000,correo:'',uid:''});
    const cuenta=versionCuenta,operacion=operacionCuenta;
    confirmarIdentidad().then(async ok=>{
     if(cuenta!==versionCuenta)return;
     if(operacion!==operacionCuenta){guarda(null);pinta();return;}
     if(!ok){pinta();abrir('entrar');msj('El enlace no es válido o ha caducado. Solicita uno nuevo.');return;}
     const cargado=await cargarMio(cuenta);
     if(cuenta!==versionCuenta)return;
     if(operacion!==operacionCuenta){guarda(null);pinta();return;}
     if(!cargado){guarda(null);pinta();abrir('entrar');msj('No se ha podido cargar tu cuenta. Vuelve a entrar.');return;}
     pinta();if(fichaAbierta)pintarVigilar(fichaAbierta);
     if(tipo==='recovery')abrir('nueva_clave');
     else{
      abrirPerfil();
      aviso('Correo confirmado. Has entrado como '+ses.correo+'. Si no es tu cuenta, cierra la sesión.');
     }
    });
   }
  }
 }
 /* El pre-renderizado ejecuta este script en un DOM de juguete donde NO
    existen fetch ni location. Sin fetch este modulo no puede hacer nada,
    asi que esa es la senal mas fiable para salirse sin ruido. Ojo: no
    vale mirar el DOM, porque alli getElementById devuelve un nodo falso
    para cualquier id y la comprobacion pasaria igual. */
 if(typeof fetch!=='undefined' && typeof location!=='undefined'){
  if(SERVICIOS_USUARIO_DISPONIBLES)iniciar();
  else{limpiarRetornoSinServiciosUsuario();pinta();}
 }

 return {abrir:abrir,abrirGestion:abrirGestion,pintarVigilar:pintarVigilar,
         actualizarMovil:pintaMovil,hay:()=>SERVICIOS_USUARIO_DISPONIBLES&&identidadConfirmada&&!!ses,
         uid:()=>SERVICIOS_USUARIO_DISPONIBLES&&identidadConfirmada&&ses&&ses.uid,
         token:()=>identidadConfirmada&&ses?testigo():Promise.resolve(null)};
})();

/* comunidad:inicio */
/* =================================================================
   COMUNIDAD · una publicación al día por cuenta (db/27)
   -----------------------------------------------------------------
   Las reglas las pone la base de datos (una al día, sin enlaces, tres
   denuncias la ocultan); aquí solo se avisa antes para ahorrar un viaje.
   La lectura es pública y nunca trae quién escribió cada publicación.
   ================================================================= */
const Comunidad=(function(){
 const $=id=>document.getElementById(id);
 let mias=new Set();
 async function api(ruta,opc,conSesion){
  if(!PUBLICACIONES_DISPONIBLES)throw new Error('Comunidad desactivada en esta versión');
  if(window.RWADAR_ACCESO)return window.RWADAR_ACCESO.datos(ruta,opc);
  const cab={apikey:CLAVE_PUB,'Content-Type':'application/json'};
  if(conSesion){
   const t=await Cuenta.token();
   if(!t){const e=new Error('Entra en tu cuenta para continuar.');e.status=401;throw e;}
   cab.Authorization='Bearer '+t;
  }
  let r;
  try{r=await fetch(API+ruta,Object.assign({cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'},opc||{},{headers:cab}));}
  catch(e){throw new Error('No se ha podido conectar. Comprueba la conexión.');}
  const texto=await r.text();let j=null;try{j=texto?JSON.parse(texto):null}catch(e){}
  if(!r.ok){const e=new Error((j&&typeof j==='object'&&j.message)||'No se ha podido completar. Inténtalo más tarde.');e.status=r.status;throw e;}
  return j;
 }
 function cuando(iso){
  const d=new Date(iso);if(Number.isNaN(d.getTime()))return '';
  const hoy=new Date(),ayer=new Date(hoy);ayer.setDate(hoy.getDate()-1);
  const hora=d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
  if(d.toDateString()===hoy.toDateString())return 'hoy, '+hora;
  if(d.toDateString()===ayer.toDateString())return 'ayer, '+hora;
  return d.toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'});
 }
 function estado(texto,bien){const p=$('comunidadEstado');if(p){p.textContent=texto||'';p.className='comunidad-estado'+(texto?(bien?' bien':' mal'):'');}}
 function pintarLista(items){
  const lista=$('comunidadLista');if(!lista)return;
  const conCuenta=Cuenta.hay();
  lista.innerHTML=items.length?items.map(p=>
   '<li class="comunidad-item"><p class="comunidad-meta"><b>'+escHtml(p.autor)+'</b><span>'+escHtml(cuando(p.creada_el))+'</span></p>'+
   '<p class="comunidad-texto">'+escHtml(p.texto)+'</p>'+
   (conCuenta?(mias.has(p.id)
     ?'<button type="button" class="comunidad-accion" data-comunidad-borrar="'+escHtml(p.id)+'">Borrar</button>'
     :'<button type="button" class="comunidad-accion" data-comunidad-denunciar="'+escHtml(p.id)+'">Denunciar</button>'):'')+
   '</li>').join('')
   :'<li class="comunidad-vacia">Todavía no hay publicaciones. ¿Empiezas tú?</li>';
 }
 async function cargar(){
  if(!PUBLICACIONES_DISPONIBLES)return;
  try{
   const items=await api('/publicaciones?select=id,autor,texto,creada_el&order=creada_el.desc&limit=30');
   mias=new Set();
   if(Cuenta.hay()){
    try{mias=new Set(((await api('/rpc/mis_publicaciones',{method:'POST',body:'{}'},true))||[]).map(x=>x.id));}catch(e){}
   }
   pintarLista(Array.isArray(items)?items:[]);
  }catch(e){const lista=$('comunidadLista');if(lista)lista.innerHTML='<li class="comunidad-vacia">No se han podido cargar las publicaciones.</li>';}
 }
 function pintarFormulario(){
  if(!PUBLICACIONES_DISPONIBLES)return;
  const hay=Cuenta.hay();
  const f=$('comunidadForm'),entrar=$('comunidadEntrar');
  if(f)f.hidden=!hay;
  if(entrar){entrar.hidden=hay;entrar.disabled=false;}
 }
 async function publicar(e){
  e.preventDefault();
  const area=$('comunidadTexto'),boton=$('comunidadPublicar');
  const texto=area.value.trim();
  if(texto.length<10){estado('Escribe al menos 10 caracteres.');area.focus();return;}
  if(/https?:\/\/|www\./i.test(texto)){estado('Las publicaciones no pueden llevar enlaces.');area.focus();return;}
  boton.disabled=true;estado('');
  try{
   await api('/rpc/publicar',{method:'POST',body:JSON.stringify({p_texto:texto,p_mostrar_nombre:$('comunidadNombre').checked})},true);
   area.value='';$('comunidadCuenta').textContent='0';
   estado('Publicado. Mañana podrás volver a publicar.',true);
   await cargar();
  }catch(err){estado(err.message);}
  finally{boton.disabled=false;}
 }
 function iniciar(){
  if(!PUBLICACIONES_DISPONIBLES)return;
  const caja=$('comunidad'),proxima=$('comunidadProximamente');
  if(!caja)return;
  caja.hidden=false;if(proxima)proxima.hidden=true;
  const seccionComunidad=$('perfilComunidad');if(seccionComunidad)seccionComunidad.hidden=false;
  $('comunidadForm').addEventListener('submit',publicar);
  $('comunidadTexto').addEventListener('input',e=>{$('comunidadCuenta').textContent=String(e.target.value.length);});
  $('comunidadLista').addEventListener('click',async e=>{
   const borrar=e.target.closest&&e.target.closest('[data-comunidad-borrar]');
   const denunciar=e.target.closest&&e.target.closest('[data-comunidad-denunciar]');
   try{
    if(borrar){
     if(!confirm('¿Borrar tu publicación? No se puede deshacer.'))return;
     await api('/rpc/borrar_mi_publicacion',{method:'POST',body:JSON.stringify({p_id:borrar.dataset.comunidadBorrar})},true);
     avisar('Publicación borrada.');await cargar();
    }else if(denunciar){
     const motivo=prompt('¿Por qué la denuncias? (opcional: publicidad, estafa, insultos…)');
     if(motivo===null)return;
     await api('/rpc/denunciar_publicacion',{method:'POST',body:JSON.stringify({p_id:denunciar.dataset.comunidadDenunciar,p_motivo:motivo})},true);
     denunciar.disabled=true;denunciar.textContent='Denunciada';
     avisar('Denuncia enviada. Con tres denuncias se oculta hasta revisarla.');
    }
   }catch(err){avisar(err.message);}
  });
  document.addEventListener('rwadar:sesion',()=>{pintarFormulario();cargar();});
  pintarFormulario();cargar();
 }
 if(typeof fetch!=='undefined'&&typeof location!=='undefined')iniciar();
 return {cargar,pintarFormulario};
})();
/* comunidad:fin */

/* =================================================================
   SHELL MÓVIL / PWA
   -----------------------------------------------------------------
   Cinco botones comunes a iPhone y Android (Inicio, Ofertas, Plataformas,
   Academy y Perfil; Ofertas y Plataformas son las dos vistas de Buscar),
   sin convertir la web de escritorio en otra cosa. La composición móvil cambia de jerarquía,
   pero comparte el mismo DOM y estado: no duplica datos, filtros, 3D ni
   lógica de cuenta.
   ================================================================= */
const Movil = (function(){
 const media=window.matchMedia('(max-width: 767px), (max-width: 960px) and (max-height: 540px) and (hover: none) and (pointer: coarse)');
 const tabs=[...document.querySelectorAll('#movilNav [data-movil-tab]')];
 const paneles=new Map([...document.querySelectorAll('[data-movil-panel]')]
  .map(p=>[p.dataset.movilPanel,p]));
 const panelBuscar=paneles.get('buscar');
 const panelAcademy=paneles.get('academy');
 /* Tableta y escritorio (768 px o más): Inicio cuenta arriba la misma historia
    que en el móvil y el radar interactivo pasa a Plataformas. Inicio ya va en
    el HTML al principio de <main> (así «#top» lo abre) y idioma-previo marca
    html.escritorio-relato antes de pintar: nada se mueve ni salta al cargar. */
 const ancho=window.matchMedia('(min-width: 768px)');
 const emisiones=document.getElementById('emisiones');
 const portada=document.querySelector('#movilPanelRadar>.portada');
 const portadaTexto=document.querySelector('.portada-txt');
 const marcador=document.querySelector('.marcador');
 const radarIntro=document.getElementById('movilRadarIntro');
 const radarPortada=document.querySelector('.portada-radar');
 const herramienta=document.getElementById('tool');
 const barra=document.querySelector('#movilPanelRadar>.barra');
 const resultados=document.getElementById('plataformasResultados');
 const transparencia=document.getElementById('movilTransparencia');
 const academia=document.getElementById('academy');
 const explicador=document.getElementById('explain');
 const academyLeccion=document.getElementById('academyLeccion');
 const leccionesAcademy=document.querySelector('.academia-lecciones');
 const contenedorAcademy=document.getElementById('movilAcademyLecciones');
 const metodo=document.getElementById('metodo');
 const fuera=document.getElementById('fuera');
 const detalles=new Map([
  ['presentacion',portadaTexto],['metodo',metodo],['fuera',fuera]
 ].filter(([,nodo])=>Boolean(nodo)));
 const ordenMovil=[emisiones,herramienta,barra,radarIntro,radarPortada,marcador,resultados,transparencia,academia,portadaTexto,portada].filter(Boolean);
 const ordenEscritorio=[portada,emisiones,herramienta,barra,resultados,metodo,fuera,academia].filter(Boolean);
 const movibles=[...ordenMovil,explicador,leccionesAcademy].filter(Boolean);
 const anclas=new Map();
 if(typeof document.createComment==='function')movibles.forEach((nodo,indice)=>{
  if(!nodo.parentNode)return;
  const ancla=document.createComment('rwadar: posición de escritorio '+indice);
  nodo.parentNode.insertBefore(ancla,nodo);anclas.set(nodo,ancla);
 });
 const cabEtiqueta=document.getElementById('movilCabeceraEtiqueta');
 const cabTitulo=document.getElementById('movilCabeceraTitulo');
 const cabSub=document.getElementById('movilCabeceraSub');
 const total=(document.getElementById('s1')&&document.getElementById('s1').textContent.trim())||String(P.length);
 const textos={
  inicio:['RWAdar','Inicio','Novedades y por dónde empezar'],
  buscar:['Explorar RWAdar','Ofertas','Cada una con su fuente y su fecha'],
  plataformas:['Explorar RWAdar','Plataformas',total+' plataformas revisadas'],
  academy:['Lecciones gratuitas','Academy','Lecciones por niveles, con test y revisión legal'],
  cuenta:['Tu cuenta','Perfil','Lo que guardas, avisos y privacidad']
 };
 /* La app abre en Inicio. Un enlace con ancla (#emisiones, #fuera…) va a
    Buscar, que es donde está ese contenido; si el ancla es de Inicio
    (#fuentes-cap3), se queda en Inicio. */
 const anclaEnInicio=()=>{try{const n=document.getElementById(decodeURIComponent(location.hash.slice(1)));return !!(n&&n.closest&&n.closest('#movilPanelInicio'))}catch(e){return false}};
 const destinoInicial=typeof location!=='undefined'&&location.hash&&location.hash.length>1?(anclaEnInicio()?'inicio':'buscar'):'inicio';
 let activa=destinoInicial,academyAbierta=false,academyOrigen=null,academyHistorial=false,avisosHistorial=false;
 let detalleAbierto=null,detalleOrigen=null,detalleHistorial=false;
 let modoMovilPrevio=media.matches;

 const reduce=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const visible=nodo=>Boolean(nodo&&nodo.isConnected&&nodo.getClientRects&&nodo.getClientRects().length);
 const enVista=nodo=>{
  if(!visible(nodo)||!nodo.getBoundingClientRect)return false;
  const r=nodo.getBoundingClientRect();
  return r.bottom>0&&r.top<window.innerHeight&&r.right>0&&r.left<window.innerWidth;
 };
 function devolverFoco(origen,alternativo){
  const destino=visible(origen)?origen:alternativo;
  if(!visible(destino))return;
  setTimeout(()=>{
   if(!visible(destino))return;
   if(!enVista(destino)&&destino.scrollIntoView)
    destino.scrollIntoView({block:'center',behavior:'auto'});
   destino.focus({preventScroll:true});
  },60);
 }
 function estadoBaseSubvista(){
  const estado=typeof history!=='undefined'&&history.state&&typeof history.state==='object'
   ?{...history.state}:{};
  delete estado.rwadarDetalle;delete estado.rwadarAcademy;delete estado.rwadarAvisos;
  return estado;
 }
 function geometria(){
  /* hidden deja canvas y SVG a ancho cero. Dos fotogramas permiten que
     el navegador recomponga antes de que WebGL vuelva a medir. */
  requestAnimationFrame(()=>requestAnimationFrame(()=>window.dispatchEvent(new Event('resize'))));
 }
 function cabecera(id){
  const t=id==='buscar'&&document.body.dataset.movilBuscar==='plataformas'?textos.plataformas:textos[id]||textos.buscar;
  if(cabEtiqueta)cabEtiqueta.textContent=t[0];
  if(cabTitulo)cabTitulo.textContent=t[1];
  if(cabSub)cabSub.textContent=t[2];
 }
 function restaurarEscritorio(){
  anclas.forEach((ancla,nodo)=>{
   if(ancla&&ancla.parentNode&&ancla.nextSibling!==nodo)ancla.parentNode.insertBefore(nodo,ancla.nextSibling);
  });
  /* El orden de lectura y de Tab coincide con el visual. Academy reúne las
     lecciones y la explicación 3D; no duplica una sección antes del buscador. */
  ordenEscritorio.forEach(nodo=>panelBuscar.appendChild(nodo));
  if(ancho.matches&&portada&&herramienta&&herramienta.parentNode===panelBuscar)panelBuscar.insertBefore(portada,herramienta.nextSibling);
  if(explicador&&academyLeccion)academyLeccion.appendChild(explicador);
 }
 function ordenarBuscar(esMovil){
  if(!panelBuscar)return;
  if(esMovil){
   /* Mover los nodos reales evita que flex order enseñe una cosa mientras
      Tab y el lector de pantalla recorren otra. No se clona ningún dato. */
   const referencia=metodo&&metodo.parentNode===panelBuscar?metodo:null;
   ordenMovil.forEach(nodo=>panelBuscar.insertBefore(nodo,referencia));
   if(explicador&&academyLeccion&&explicador.parentNode!==academyLeccion)academyLeccion.appendChild(explicador);
   if(leccionesAcademy&&contenedorAcademy&&leccionesAcademy.parentNode!==contenedorAcademy)
    contenedorAcademy.appendChild(leccionesAcademy);
   if(academia)academia.hidden=!academyAbierta;
   if(academyAbierta&&panelAcademy)panelAcademy.appendChild(academia);
   const informacion=document.getElementById('emisInformacion');
   if(informacion)informacion.open=!emisiones||!emisiones.classList.contains('sin-emisiones');
  }else{
   restaurarEscritorio();
   academyAbierta=false;academyHistorial=false;academyOrigen=null;
   detalleAbierto=null;detalleHistorial=false;detalleOrigen=null;
   detalles.forEach(nodo=>nodo.classList.remove('movil-detalle-activo'));
   if(academia)academia.hidden=false;
   const informacion=document.getElementById('emisInformacion');if(informacion)informacion.open=true;
   panelBuscar.classList.remove('movil-academy-abierta','movil-detalle-abierto');
   if(panelAcademy)panelAcademy.classList.remove('movil-academy-abierta');
  }
 }
 function cabeceraAcademy(){
  if(cabEtiqueta)cabEtiqueta.textContent='Lecciones gratuitas';
  if(cabTitulo)cabTitulo.textContent='Academy';
  if(cabSub)cabSub.textContent='Lecciones por niveles, con test y revisión legal';
 }
 function cerrarAcademyVisual(enfocar=true){
  if(!academyAbierta)return;
  academyAbierta=false;academyHistorial=false;
  if(panelBuscar)panelBuscar.classList.remove('movil-academy-abierta');
  if(academia)academia.hidden=true;
  document.querySelectorAll('[data-movil-action="academy"]').forEach(b=>b.setAttribute('aria-expanded','false'));
  if(panelAcademy)panelAcademy.classList.remove('movil-academy-abierta');
  cabecera('academy');
  window.scrollTo({top:0,behavior:reduce()?'auto':'smooth'});
  const origen=academyOrigen;academyOrigen=null;
  if(enfocar)devolverFoco(origen,document.getElementById('movilTabAcademy'));
 }
 function mostrarAcademy(mostrar,enfocar=true,gestionarHistorial=true,origen=null){
  if(!media.matches||!academia||!panelBuscar)return;
  if(mostrar){
   if(!academyAbierta){
    academyOrigen=origen||document.activeElement;
    academyAbierta=true;academia.hidden=false;
    if(panelAcademy){panelAcademy.appendChild(academia);panelAcademy.classList.add('movil-academy-abierta');}
    document.querySelectorAll('[data-movil-action="academy"]').forEach(b=>b.setAttribute('aria-expanded','true'));
    cabeceraAcademy();
    /* La lección se abre siempre por el principio. El temporizador puede
       seguir contando mientras la subvista está oculta, pero nunca debe
       recibir a la persona en el último paso sin haberlo elegido. */
    if(typeof irPaso==='function')irPaso(0,false);
    if(typeof reiniciarPasosAutomaticos==='function')reiniciarPasosAutomaticos();
    if(gestionarHistorial&&typeof history!=='undefined'&&history.pushState){
     history.pushState({...estadoBaseSubvista(),rwadarAcademy:true},'',location.href);academyHistorial=true;
    }
   }
   window.scrollTo({top:0,behavior:reduce()?'auto':'smooth'});geometria();
   if(enfocar)setTimeout(()=>document.getElementById('movilCerrarAcademy')?.focus({preventScroll:true}),60);
  }else if(academyAbierta){
   if(gestionarHistorial&&academyHistorial&&history.state&&history.state.rwadarAcademy===true)history.back();
   else cerrarAcademyVisual(enfocar);
  }
 }
 function abrirAcademyDesde(origen){
  if(academyAbierta){
   window.scrollTo({top:0,behavior:reduce()?'auto':'smooth'});
   setTimeout(()=>document.getElementById('movilCerrarAcademy')?.focus({preventScroll:true}),60);
   return;
  }
  /* Si Academy sustituye a un detalle abierto, reutiliza la misma entrada
     del historial. Así Atrás vuelve una sola vez a Buscar y el popstate del
     detalle anterior no cierra la lección recién abierta. */
  const sustituyeDetalle=detalleAbierto&&detalleHistorial&&history.state&&
   history.state.rwadarDetalle===detalleAbierto;
  const vistaAvisos=document.getElementById('movilVistaAvisos');
  const sustituyeAvisos=vistaAvisos&&!vistaAvisos.hidden&&avisosHistorial&&history.state&&
   history.state.rwadarAvisos===true;
  if(detalleAbierto)cerrarDetalleVisual(false);
  if(vistaAvisos&&!vistaAvisos.hidden){avisosHistorial=false;mostrarAvisos(false,false,false);}
  cambiar('academy',{arriba:false});
  if((sustituyeDetalle||sustituyeAvisos)&&typeof history!=='undefined'&&history.replaceState){
   const estado={...estadoBaseSubvista(),rwadarAcademy:true};
   history.replaceState(estado,'',location.href);
   mostrarAcademy(true,true,false,origen);academyHistorial=true;
  }else mostrarAcademy(true,true,true,origen);
 }
 const textosDetalle={
  presentacion:['Qué incluye RWAdar','Qué analiza RWAdar','Qué entra, qué no y cómo leer cada ficha'],
  metodo:['Cómo elegimos','Método de selección','Cómo decidimos qué plataformas entran'],
  fuera:['Transparencia','Descartadas','Descartes publicados con su motivo y sus fuentes']
 };
 function cabeceraDetalle(id){
  const t=textosDetalle[id]||textos.buscar;
  if(cabEtiqueta)cabEtiqueta.textContent=t[0];
  if(cabTitulo)cabTitulo.textContent=t[1];
  if(cabSub)cabSub.textContent=t[2];
 }
 function cerrarDetalleVisual(enfocar=true){
  if(!detalleAbierto)return;
  const anterior=detalleAbierto;
  detalleAbierto=null;detalleHistorial=false;
  if(panelBuscar)panelBuscar.classList.remove('movil-detalle-abierto');
  detalles.forEach(nodo=>nodo.classList.remove('movil-detalle-activo'));
  document.querySelectorAll('[data-movil-action="detalle"]').forEach(b=>
   b.setAttribute('aria-expanded','false'));
  cabecera('buscar');
  const origen=detalleOrigen;detalleOrigen=null;
  /* Abierto desde Inicio (el caso RealT): Atrás o «Volver» regresan a Inicio,
     junto al enlace, en vez de dejar al lector en Buscar. */
  if(enfocar&&origen&&origen.closest&&origen.closest('#movilPanelInicio'))cambiar('inicio',{arriba:false});
  else window.scrollTo({top:0,behavior:reduce()?'auto':'smooth'});
  const alternativo=document.getElementById('q')||document.getElementById('movilTabRadar');
  if(enfocar)devolverFoco(origen,alternativo);
  return anterior;
 }
 function mostrarDetalle(id,enfocar=true,gestionarHistorial=true,origen=null){
  const objetivo=detalles.get(id);
  if(!media.matches||!objetivo||!panelBuscar)return;
  if(detalleAbierto===id){
   if(gestionarHistorial&&detalleHistorial&&history.state&&history.state.rwadarDetalle===id)history.back();
   else cerrarDetalleVisual(enfocar);
   return;
  }
  if(detalleAbierto)cerrarDetalleVisual(false);
  if(academyAbierta)cerrarAcademyVisual(false);
  movilFiltrosAbiertos=false;actualizarFiltrosMoviles();
  detalleOrigen=origen||document.activeElement;
  detalleAbierto=id;
  detalles.forEach((nodo,clave)=>nodo.classList.toggle('movil-detalle-activo',clave===id));
  panelBuscar.classList.add('movil-detalle-abierto');
  document.querySelectorAll('[data-movil-action="detalle"]').forEach(b=>
   b.setAttribute('aria-expanded',b.dataset.movilDetalle===id?'true':'false'));
  cabeceraDetalle(id);
  if(gestionarHistorial&&typeof history!=='undefined'&&history.pushState){
   history.pushState({...estadoBaseSubvista(),rwadarDetalle:id},'',location.href);detalleHistorial=true;
  }
  window.scrollTo({top:0,behavior:reduce()?'auto':'smooth'});geometria();
  if(enfocar)setTimeout(()=>objetivo.querySelector('.movil-subvista-volver')?.focus({preventScroll:true}),60);
 }
 function mostrarAvisos(mostrar,enfocar=true,gestionarHistorial=true){
  const panel=document.getElementById('movilPanelMas');
  const vista=document.getElementById('movilVistaAvisos');
  const abre=document.getElementById('movilAbrirAvisos');
  if(!panel||!vista||!abre)return;
  const estabaAbierta=!vista.hidden;
  if(mostrar&&!estabaAbierta&&gestionarHistorial&&media.matches&&typeof history!=='undefined'&&history.pushState){
   history.pushState({...estadoBaseSubvista(),rwadarAvisos:true},'',location.href);avisosHistorial=true;
  }
  if(!mostrar&&estabaAbierta&&gestionarHistorial&&avisosHistorial&&history.state&&history.state.rwadarAvisos===true){
   avisosHistorial=false;history.back();if(enfocar)return;
  }
  vista.hidden=!mostrar;
  panel.classList.toggle('movil-subvista-abierta',mostrar);
  abre.setAttribute('aria-expanded',mostrar?'true':'false');
  if(!mostrar)avisosHistorial=false;
  if(!enfocar)return;
  if(mostrar){
   window.scrollTo({top:0,behavior:reduce()?'auto':'smooth'});
   requestAnimationFrame(()=>document.getElementById('movilCerrarAvisos')?.focus({preventScroll:true}));
  }else abre.focus({preventScroll:true});
 }
 function pintarSonidoMovil(){
  const boton=document.getElementById('movilSonido');
  const estado=document.getElementById('movilSonidoEstado');
  if(boton)boton.setAttribute('aria-pressed',Sonido.activo?'true':'false');
  if(estado)estado.textContent=Sonido.activo?'Activado':'Desactivado';
 }
 /* Perfil: empresas y ofertas guardadas en este navegador. */
 function pintarPerfil(){
  const empresas=Favoritos.lista('empresas'),ofertas=Favoritos.lista('ofertas');
  const total=Favoritos.total();
  const n=(id,v)=>{const x=document.getElementById(id);if(x)x.textContent=String(v);};
  n('movilGuardadosTotal',total);n('perfilEmpresasN',empresas.length);n('perfilOfertasN',ofertas.length);
  const insignia=document.getElementById('movilGuardadosBadge');
  if(insignia){insignia.textContent=total>99?'99+':String(total);insignia.hidden=!total;}
  const tab=document.getElementById('movilTabMas');
  if(tab)tab.setAttribute('aria-label',total?'Perfil, '+total+' guardados':'Perfil');
  const lista=document.getElementById('perfilEmpresas'),vacio=document.getElementById('perfilEmpresasVacio');
  if(lista&&vacio){
   const filas=empresas.map(nombre=>{const i=P.findIndex(p=>p.n===nombre);return i<0?null:[P[i],i];}).filter(Boolean);
   lista.hidden=!filas.length;vacio.hidden=filas.length>0;
   lista.innerHTML=filas.map(([p,i])=>`
    <article class="movil-seguida ${catClase(p)}">
     ${siglaEl(p)}
     <div><h3>${escHtml(p.n)}</h3><p><span>${escHtml(p.tipo)}</span> · <span>${escHtml(p.reg)}</span></p></div>
     <button type="button" data-abrir="${i}" aria-label="Abrir la ficha de ${escHtml(p.n)}">›</button>
    </article>`).join('');
  }
  const listaO=document.getElementById('perfilOfertas'),vacioO=document.getElementById('perfilOfertasVacio');
  if(listaO&&vacioO){
   listaO.hidden=!ofertas.length;vacioO.hidden=ofertas.length>0;
   listaO.innerHTML=ofertas.map(slug=>{
    const o=typeof ofertaDetalleLocalPorSlug==='function'?ofertaDetalleLocalPorSlug(slug):null;
    if(!o)return `
    <article class="perfil-oferta perfil-oferta-retirada">
     <div><h3>Ya no está en el catálogo</h3><p>La referencia que guardaste se ha retirado o está en revisión.</p></div>
     <button type="button" class="perfil-oferta-quitar" data-guardar-oferta="${escHtml(slug)}" aria-pressed="true">Quitar</button>
    </article>`;
    return `
    <article class="perfil-oferta">
     <div><h3>${escHtml(o.titulo)}</h3><p>${escHtml(o.plataformaNombre)} · ${escHtml(o.categoria||'')}</p></div>
     <button type="button" class="perfil-oferta-ver" data-perfil-oferta="${escHtml(o.slug)}">Detalles</button>
     <button type="button" class="perfil-oferta-quitar" data-guardar-oferta="${escHtml(o.slug)}" aria-pressed="true" aria-label="Quitar ${escHtml(o.titulo)} de guardadas">Quitar</button>
    </article>`;
   }).join('');
  }
 }
 /* Academy: cuántas lecciones has marcado como leídas en este navegador
    (la misma clave que usan las páginas de /academy/). */
 function pintarAcademy(){
  const titulo=document.getElementById('movilAcademyProgreso');
  if(!titulo||!leccionesAcademy)return;
  const slugs=[...leccionesAcademy.querySelectorAll('a[href^="/academy/"]')]
   .map(a=>a.getAttribute('href').replace('/academy/','')).filter(Boolean);
  let leidas=0;
  try{
   const uid=window.RWADAR_ACCESO?.usuario()?.id;
   const j=JSON.parse(uid?localStorage.getItem('rwadar.academy.v1:'+uid)||'null':'null');
   if(j&&Array.isArray(j.leidas))leidas=slugs.filter(x=>j.leidas.includes(x)).length;
  }catch(e){}
  titulo.textContent=slugs.length?leidas+' de '+slugs.length+' lecciones leídas':'Aprende gratis con tu cuenta';
 }
 Favoritos.alCambiar(pintarPerfil);
 function cambiar(id,opciones){
  if(!media.matches||!paneles.has(id))return;
  if(detalleAbierto){
   const volver=detalleHistorial&&history.state&&history.state.rwadarDetalle===detalleAbierto;
   cerrarDetalleVisual(false);if(volver)history.back();
  }
  if(academyAbierta){
   const volver=academyHistorial&&history.state&&history.state.rwadarAcademy===true;
   cerrarAcademyVisual(false);if(volver)history.back();
  }
  if(id!=='buscar'&&movilFiltrosAbiertos){movilFiltrosAbiertos=false;actualizarFiltrosMoviles();}
  if(id!=='cuenta'||activa==='cuenta')mostrarAvisos(false,false);
  activa=id;
  document.body.dataset.movilPestana=id;
  paneles.forEach((panel,nombre)=>{panel.hidden=nombre!==id;});
  marcarTabs();
  cabecera(id);
  if(id==='cuenta')pintarPerfil();
  if(id==='academy')pintarAcademy();
  if(!opciones||opciones.arriba!==false){
   window.scrollTo({top:0,behavior:reduce()?'auto':'smooth'});
  }
  if(id==='buscar')geometria();
 }
 /* Una sola pestaña marcada: en Buscar, la de su vista (Ofertas o Plataformas). */
 function marcarTabs(){
  const vista=document.body.dataset.movilBuscar||'ofertas';
  tabs.forEach(tab=>{
   const elegida=tab.dataset.movilTab===activa&&(!tab.dataset.navVista||tab.dataset.navVista===vista);
   tab.setAttribute('aria-selected',elegida?'true':'false');
   tab.tabIndex=elegida?0:-1;
  });
 }
 function adaptar(){
  const esMovil=media.matches,relato=!esMovil&&ancho.matches;
  if(document.documentElement&&document.documentElement.classList)document.documentElement.classList.toggle('escritorio-relato',relato);
  /* En escritorio el h1 de la portada antigua no se ve: el título de Inicio hace de h1. */
  const titInicio=document.getElementById('inicioPortadaTit');
  if(titInicio&&titInicio.setAttribute&&titInicio.removeAttribute){if(relato)titInicio.setAttribute('aria-level','1');else titInicio.removeAttribute('aria-level');}
  modoMovilPrevio=esMovil;
  ordenarBuscar(esMovil);
  if(document.documentElement&&document.documentElement.classList)
   document.documentElement.classList.toggle('movil-ui',esMovil);
  /* Las filas de ofertas abren sus grupos solo en el móvil: al cruzar el
     punto de corte se vuelven a pintar con el estado que toca. */
  if(gruposPintadosMovil!==null&&gruposPintadosMovil!==esMovil&&typeof pintarEmisiones==='function')pintarEmisiones();
  if(esMovil){cambiar(activa,{arriba:false});Cuenta.actualizarMovil();pintarSonidoMovil();pintarPerfil();pintarAcademy();}
  else{
   mostrarAvisos(false,false);
   document.body.removeAttribute('data-movil-pestana');
   document.body.classList.remove('movil-teclado');
   paneles.forEach((panel,nombre)=>{panel.hidden=nombre!=='buscar'&&!(relato&&nombre==='inicio');});
   if(relato&&typeof relatoInicio!=='undefined'&&relatoInicio)requestAnimationFrame(relatoInicio.repintar);
   geometria();
  }
 }
 /* Ofertas o Plataformas: las dos vistas de Buscar, cada una con su botón en
    la barra (solo en el móvil). La vista se guarda en body[data-movil-buscar]. */
 const DE_PLATAFORMAS=new Set(['tool','plataformasResultados','movilRadarIntro','fuera']);
 function verEnBuscar(que){
  document.body.dataset.movilBuscar=que;
  const panelBuscar=document.getElementById('movilPanelRadar');
  if(panelBuscar&&typeof panelBuscar.setAttribute==='function')panelBuscar.setAttribute('aria-labelledby',que==='plataformas'?'movilTabPlataformas':'movilTabRadar');
  marcarTabs();
  if(activa==='buscar'&&!detalleAbierto&&!academyAbierta)cabecera('buscar');
 }
 function elegirTab(tab){
  if(tab.dataset.navVista)verEnBuscar(tab.dataset.navVista);
  cambiar(tab.dataset.movilTab);
 }
 verEnBuscar(typeof location!=='undefined'&&DE_PLATAFORMAS.has((location.hash||'').slice(1))?'plataformas':'ofertas');
 function ir(destino,origen=null){
  if(destino==='explain'){abrirAcademyDesde(origen);return;}
  cambiar('buscar',{arriba:false});
  if(destino==='emisiones')verEnBuscar('ofertas');
  else if(DE_PLATAFORMAS.has(destino))verEnBuscar('plataformas');
  if(detalles.has(destino)){
   requestAnimationFrame(()=>mostrarDetalle(destino,true,true,origen));
   return;
  }
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   const objetivo=destino==='top'?document.getElementById('top'):document.getElementById(destino);
   if(objetivo){objetivo.scrollIntoView({block:'start',behavior:reduce()?'auto':'smooth'});
    /* Si el foco se quedó en el panel que se acaba de ocultar, pasa al destino:
       su pestaña activa o su primer título visible. */
    const activo=document.activeElement;
    if(!activo||activo===document.body||activo.closest&&activo.closest('[hidden]')){
     const foco=[...objetivo.querySelectorAll('[role="tab"][aria-selected="true"],h2,h3')].find(e=>e.offsetWidth>1&&e.getClientRects().length)||objetivo;
     if(!/^(?:A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(foco.tagName)&&!foco.hasAttribute('tabindex'))foco.setAttribute('tabindex','-1');
     foco.focus({preventScroll:true});
    }}
   geometria();
  }));
 }

 tabs.forEach((tab,indice)=>{
  tab.addEventListener('click',()=>elegirTab(tab));
  tab.addEventListener('keydown',e=>{
   let siguiente=null;
   if(e.key==='ArrowRight')siguiente=(indice+1)%tabs.length;
   if(e.key==='ArrowLeft')siguiente=(indice-1+tabs.length)%tabs.length;
   if(e.key==='Home')siguiente=0;
   if(e.key==='End')siguiente=tabs.length-1;
   if(siguiente==null)return;
   e.preventDefault();elegirTab(tabs[siguiente]);
   tabs[siguiente].focus({preventScroll:true});
  });
 });
 document.addEventListener('click',e=>{
  if(!media.matches)return;
  const ofertaPerfil=e.target.closest&&e.target.closest('[data-perfil-oferta]');
  if(ofertaPerfil){e.preventDefault();abrirDetalleOfertaLocal(ofertaPerfil.dataset.perfilOferta);return;}
  const cambio=e.target.closest&&e.target.closest('[data-movil-cambiar]');
  if(cambio){e.preventDefault();e.stopImmediatePropagation();cambiar(cambio.dataset.movilCambiar);return;}
  const destino=e.target.closest&&e.target.closest('[data-movil-ir]');
  if(destino){e.preventDefault();e.stopImmediatePropagation();ir(destino.dataset.movilIr,destino);return;}
  const accion=e.target.closest&&e.target.closest('[data-movil-action]');
  if(!accion)return;
  e.stopImmediatePropagation();
  if(accion.dataset.movilAction==='ayuda'){
   e.preventDefault();abrirAcademyDesde(accion);
  }
  if(accion.dataset.movilAction==='academy'){
   e.preventDefault();abrirAcademyDesde(accion);
  }
  if(accion.dataset.movilAction==='detalle'){
   e.preventDefault();cambiar('buscar',{arriba:false});mostrarDetalle(accion.dataset.movilDetalle,true,true,accion);
  }
  if(accion.dataset.movilAction==='cerrar-detalle'){
   e.preventDefault();
   if(detalleHistorial&&history.state&&history.state.rwadarDetalle===detalleAbierto)history.back();
   else cerrarDetalleVisual(true);
  }
  if(accion.dataset.movilAction==='cerrar-academy'){e.preventDefault();mostrarAcademy(false);}
  if(accion.dataset.movilAction==='cuenta'){e.preventDefault();Cuenta.abrirGestion();}
  if(accion.dataset.movilAction==='borrar-guardados'){
   e.preventDefault();
   if(!Favoritos.total()){avisar('No hay nada guardado en este navegador.');return;}
   if(confirm('Se borrarán las empresas y ofertas guardadas en este navegador. ¿Seguimos?')){
    Favoritos.borrar();avisar('Guardados borrados de este navegador.');
   }
  }
  if(accion.dataset.movilAction==='avisos'){e.preventDefault();mostrarAvisos(true);}
  if(accion.dataset.movilAction==='cerrar-avisos'){e.preventDefault();mostrarAvisos(false);}
  if(accion.dataset.movilAction==='sonido'){
   e.preventDefault();
   const interruptor=document.getElementById('snd');
   if(interruptor)interruptor.click();
   pintarSonidoMovil();
  }
 });
 document.addEventListener('focusin',e=>{
  if(media.matches&&e.target.matches&&e.target.matches('input:not([type="range"]),textarea,select'))
   document.body.classList.add('movil-teclado');
 });
 document.addEventListener('focusout',()=>setTimeout(()=>{
  const a=document.activeElement;
  if(!a||!a.matches||!a.matches('input:not([type="range"]),textarea,select'))
   document.body.classList.remove('movil-teclado');
 },80));
 document.addEventListener('keydown',e=>{
  if(!media.matches||e.key!=='Escape')return;
  if(detalleAbierto){
   e.preventDefault();
   if(detalleHistorial&&history.state&&history.state.rwadarDetalle===detalleAbierto)history.back();
   else cerrarDetalleVisual(true);
   return;
  }
  if(academyAbierta){e.preventDefault();mostrarAcademy(false);return;}
  if(movilFiltrosAbiertos){
   e.preventDefault();movilFiltrosAbiertos=false;actualizarFiltrosMoviles();
   document.getElementById('movilFiltrosToggle')?.focus({preventScroll:true});return;
  }
  const avisos=document.getElementById('movilVistaAvisos');
  if(avisos&&!avisos.hidden){e.preventDefault();mostrarAvisos(false);}
 });
 function reconciliarEstadoSubvista(enfocar=true){
  if(!media.matches)return;
  const estado=history.state&&typeof history.state==='object'?history.state:{};
  if(estado.rwadarDetalle&&detalles.has(estado.rwadarDetalle)){
   if(detalleAbierto!==estado.rwadarDetalle){
    if(detalleAbierto)cerrarDetalleVisual(false);
    if(academyAbierta)cerrarAcademyVisual(false);
    cambiar('buscar',{arriba:false});
    const origen=document.querySelector('[data-movil-action="detalle"][data-movil-detalle="'+estado.rwadarDetalle+'"]');
    mostrarDetalle(estado.rwadarDetalle,enfocar,false,origen);detalleHistorial=true;
   }
  }else if(estado.rwadarAcademy===true){
   if(!academyAbierta){
    if(detalleAbierto)cerrarDetalleVisual(false);
    cambiar('academy',{arriba:false});
    mostrarAcademy(true,enfocar,false,document.getElementById('movilTabAcademy'));academyHistorial=true;
   }
  }else{
   if(detalleAbierto)cerrarDetalleVisual(enfocar);
   if(academyAbierta)cerrarAcademyVisual(enfocar);
  }
  const avisos=document.getElementById('movilVistaAvisos');
  if(avisos&&avisos.hidden&&estado.rwadarAvisos===true){
   cambiar('cuenta',{arriba:false});
   mostrarAvisos(true,enfocar,false);avisosHistorial=true;
  }else if(avisos&&!avisos.hidden&&estado.rwadarAvisos!==true){
   avisosHistorial=false;mostrarAvisos(false,enfocar,false);
  }
 }
 window.addEventListener('popstate',()=>reconciliarEstadoSubvista(true));
 const standalone=(typeof navigator!=='undefined'&&navigator.standalone===true)||
  window.matchMedia('(display-mode: standalone)').matches;
 if(document.documentElement&&document.documentElement.classList)
  document.documentElement.classList.toggle('pwa-standalone',standalone);
 if(media.addEventListener){media.addEventListener('change',adaptar);ancho.addEventListener('change',adaptar);}
 else if(media.addListener)media.addListener(adaptar);
 window.addEventListener('resize',()=>{
  /* Algunos WebViews cambian el viewport sin emitir change en MediaQueryList
     (por ejemplo, al pasar de una ventana compacta a una grande). */
  if(media.matches!==modoMovilPrevio)adaptar();
 });
 window.addEventListener('pageshow',e=>{
  /* BFCache conserva DOM y variables. Repetir adaptar() en ese caso
     cerraría una subvista válida y podría lanzar un history.back() antes
     de reconciliarla. Solo se recompone si hubo carga real o cambió el
     breakpoint mientras la página estaba aparcada. */
  if(!e.persisted||media.matches!==modoMovilPrevio)adaptar();
  if(media.matches){reconciliarEstadoSubvista(false);if(activa==='buscar')geometria();}
  /* /#fuera y /#metodo abren su detalle, como un toque en su enlace. Va tras
     adaptar(), que si no lo cerraría al cargar. */
  if(detalleDeAncla&&media.matches){const d=detalleDeAncla;detalleDeAncla='';ir(d);}
 });
 let detalleDeAncla=typeof location!=='undefined'&&detalles.has((location.hash||'').slice(1))?location.hash.slice(1):'';
 adaptar();
 /* «Saltar al contenido» (#tool) en el móvil: lleva al contenido de la
    pestaña visible (Inicio, Buscar, Academy o Perfil), no a un panel oculto. */
 const saltar=document.querySelector('.saltar');
 if(saltar)saltar.addEventListener('click',e=>{
  if(!media.matches)return;
  const panel=[...paneles.values()].find(visible);
  const destino=panel&&([...panel.querySelectorAll('h1,h2')].find(visible)||panel);
  if(!destino)return;
  e.preventDefault();
  if(!destino.hasAttribute('tabindex'))destino.setAttribute('tabindex','-1');
  destino.focus({preventScroll:true});
  if(destino.scrollIntoView)destino.scrollIntoView({block:'start',behavior:reduce()?'auto':'smooth'});
 });
 if(typeof location!=='undefined'&&location.hash==='#explain')abrirAcademyDesde(document.getElementById('movilTabAcademy'));
 window.addEventListener('hashchange',()=>{if(location.hash==='#explain')abrirAcademyDesde(document.activeElement);});
 return {cambiar:cambiar,ir:ir,verEnBuscar:verEnBuscar,
  tutorial(origen){if(!media.matches)return false;abrirAcademyDesde(origen);return true;},
  volverAcademy(){if(!media.matches)return false;mostrarAcademy(false);return true;}
 };
})();

/* Una sola delegación sustituye todos los atributos onclick/onkeydown.
   Mantener el comportamiento fuera del marcado permite una CSP estricta. */
document.addEventListener('click',e=>{
 const b=e.target.closest&&e.target.closest('[data-ir],[data-vista],[data-accion],[data-filtrar-cat],[data-abrir],[data-comparar],[data-copiar-ficha],.paso[data-s]');
 if(!b)return;
 if(b.dataset.copiarFicha)return copiarEnlaceFicha(b.dataset.copiarFicha);
 if(b.dataset.ir)return irA(b.dataset.ir);
 if(b.classList.contains('paso'))return irPaso(Number(b.dataset.s),true);
 if(b.dataset.vista)return setView(b.dataset.vista);
 if(b.hasAttribute('data-filtrar-cat')){
  const valor=b.dataset.filtrarCat||'';S2.cat=valor;render();
  requestAnimationFrame(()=>[...document.querySelectorAll('[data-filtrar-cat]')]
   .find(x=>(x.dataset.filtrarCat||'')===valor)?.focus({preventScroll:true}));return;
 }
 if(b.dataset.abrir!=null){const i=Number(b.dataset.abrir);if(Number.isInteger(i))return openDrawer(i);}
 if(b.dataset.comparar!=null){const i=Number(b.dataset.comparar);if(Number.isInteger(i))return toggleCompare(i);}
 if(b.dataset.accion==='limpiar')return resetAll();
 if(b.dataset.accion==='alternar-filtros')return alternarFiltrosMoviles();
 if(b.dataset.accion==='alternar-resultados')return alternarResultadosMoviles();
 if(b.dataset.accion==='comparar')return openCompare();
 if(b.dataset.accion==='vaciar-comparacion')return clearCompare();
 if(b.dataset.accion==='cerrar-panel')return closeAll();
 if(b.dataset.accion==='descargar-csv')return downloadCSV();
});

/* En iPhone y iPad el APK de Android no se puede instalar. Los enlaces a
   /android explican cómo añadir la web a la pantalla de inicio: queda como
   una app y siempre en su última versión. Ya instalada, no se ofrece. */
(function instalarEnIphone(){
 if(typeof navigator==='undefined'||typeof document==='undefined')return;
 const ios=/iPhone|iPad|iPod/.test(navigator.userAgent||'')||
  (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 if(!ios)return;
 const enlaces=()=>[...document.querySelectorAll('a[href="/android"]')];
 const instalada=navigator.standalone===true||
  (typeof matchMedia==='function'&&matchMedia('(display-mode: standalone)').matches);
 if(instalada){enlaces().forEach(a=>{a.style.display='none';});return;}
 const textos=()=>document.documentElement.lang==='en'?{
  enlace:'RWAdar on your iPhone',icono:'Add RWAdar to your home screen',etiqueta:'RWAdar on iPhone',
  titulo:'Keep it like an app, with nothing to download',cerrar:'Close',
  intro:'On iPhone you do not need to install anything: the website <b>is</b> the app and it is always up to date.',
  pasos:['Tap the <b>Share</b> button (a square with an arrow pointing up). In Safari it is at the bottom; in Chrome, at the top right.',
   'Choose <b>«Add to Home Screen»</b>. If you do not see it, scroll the list up.',
   'Tap <b>Add</b>. The RWAdar icon appears next to your apps.'],
  final:'It opens full screen, keeps your session and always shows the latest version.',
  nota:'The Android app is downloaded separately and does not work on iPhone.'
 }:{
  enlace:'RWAdar en tu iPhone',icono:'Añadir RWAdar a la pantalla de inicio',etiqueta:'RWAdar en iPhone',
  titulo:'Tenla como una app, sin descargar nada',cerrar:'Cerrar',
  intro:'En iPhone no hace falta instalar nada: la web <b>es</b> la app y siempre está actualizada.',
  pasos:['Pulsa el botón <b>Compartir</b> (un cuadrado con una flecha hacia arriba). En Safari está abajo; en Chrome, arriba a la derecha.',
   'Elige <b>«Añadir a pantalla de inicio»</b>. Si no lo ves, desliza la lista hacia arriba.',
   'Pulsa <b>Añadir</b>. El icono de RWAdar aparece junto a tus apps.'],
  final:'Se abre a pantalla completa, conserva tu sesión y siempre muestra la última versión.',
  nota:'La app para Android se descarga aparte y no funciona en iPhone.'
 };
 function etiquetar(){
  const t=textos();
  enlaces().forEach(a=>{
   a.setAttribute('translate','no');
   if(a.classList.contains('movil-descarga'))a.setAttribute('aria-label',t.icono);
   else a.textContent=t.enlace;
  });
 }
 function abrir(origen){
  const t=textos();
  let d=document.getElementById('instalarIphone');
  if(!d){
   d=document.createElement('dialog');
   d.id='instalarIphone';d.className='escaparate-dialogo instalar-iphone';
   d.setAttribute('aria-labelledby','instalarIphoneTitulo');d.setAttribute('translate','no');
   d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-cerrar-iphone]'))d.close();});
   d.addEventListener('close',()=>{if(d._origen&&document.contains(d._origen))d._origen.focus({preventScroll:true});});
   document.body.appendChild(d);
  }
  d._origen=origen;
  d.innerHTML='<div class="escaparate-dialogo-marco"><header class="escaparate-dialogo-cab"><div><span>'+t.etiqueta+
   '</span><h2 id="instalarIphoneTitulo">'+t.titulo+'</h2></div><button type="button" data-cerrar-iphone aria-label="'+t.cerrar+
   '">×</button></header><div class="instalar-iphone-cuerpo"><p>'+t.intro+'</p><ol>'+t.pasos.map(p=>'<li>'+p+'</li>').join('')+
   '</ol><p>'+t.final+'</p><p class="instalar-iphone-nota">'+t.nota+'</p></div></div>';
  if(!d.open){if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');}
  const cerrar=d.querySelector('[data-cerrar-iphone]');if(cerrar)cerrar.focus({preventScroll:true});
 }
 etiquetar();
 new MutationObserver(etiquetar).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 document.addEventListener('click',e=>{
  const a=e.target.closest&&e.target.closest('a[href="/android"]');
  if(!a)return;
  e.preventDefault();e.stopImmediatePropagation();abrir(a);
 },true);
})();

/* El trabajador solo se registra en HTTP(S), nunca durante el pre-render ni
   al abrir el archivo directamente. `updateViaCache:none` y update() evitan
   que iOS reanude durante horas un trabajador ya superado. Cuando cambia el
   controlador se recarga una sola vez el documento que ya estaba abierto:
   en la página nueva el controlador ya existe y no se crea ningún bucle. */
if(typeof navigator!=='undefined'&&'serviceWorker' in navigator&&
   typeof location!=='undefined'&&/^https?:$/.test(location.protocol)){
 window.addEventListener('load',async()=>{
  const trabajador=navigator.serviceWorker;
  const yaControlada=!!trabajador.controller;
  let recargando=false;
  trabajador.addEventListener('controllerchange',()=>{
   if(!yaControlada||recargando)return;
   recargando=true;
   location.reload();
  });
  try{
   const registro=await trabajador.register('/sw.js',{updateViaCache:'none'});
   const revisar=()=>registro.update().catch(()=>{});
   window.addEventListener('pageshow',e=>{if(e.persisted)revisar();});
   document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible')revisar();
   });
   await revisar();
  }catch(_){}
 },{once:true});
}

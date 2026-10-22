'use strict';
// Traducción local de presentación. Sin innerHTML, servicios ni envío de textos.
(() => {
  const idioma=globalThis.RWAdarIdioma;
  if(!idioma||globalThis.RWAdarIdiomaWebActivo)return;
  globalThis.RWAdarIdiomaWebActivo=true;
  const textos=new WeakMap(),atributos=new WeakMap();
  // Etiquetas propias de las páginas de consulta, separadas del catálogo y
  // del motor compartido ya congelado para el APK.
  const uiConsulta={
    'Cerrar detalle':'Close offer details','Oferta principal':'Primary offer',
    'Documentación de producto consultada':'Product documentation reviewed',
    'Plataforma registrada ante su supervisor':'Platform registered with its supervisor',
    'Registro de la plataforma por confirmar':'Platform registration unconfirmed',
    'Plataforma aún no evaluada en el radar':'Platform not yet assessed on the radar',
    'Qué es y quién lo ofrece':'What it is and who provides it','Proveedor':'Provider',
    'Tipo de activo':'Asset type','Supervisión de la plataforma':'Platform supervision',
    'Consultar ficha de plataforma':'View platform details','Cómo se recupera el dinero':'How you can exit',
    'Fuentes y fechas':'Sources and dates','Quién es':'Who they are',
    'Cómo funciona y qué se ha comprobado':'How it works and what has been checked',
    'Supervisión y alcance':'Supervision and scope','Quién puede acceder':'Who can access it',
    'Referencias documentales de esta plataforma':'Documented references from this platform',
    'Antes de ir a la fuente':'Before visiting the source','¿Ves un error en esta ficha?':'See an error in these details?',
    'Saltar al contenido':'Skip to content','Principal':'Main navigation','Información':'Information',
    'Comunicar un error':'Report an error','Cómo verificamos':'How we check sources',
    'Independencia editorial':'Editorial independence','Privacidad y aviso legal':'Privacy and legal notice'
  };
  const traducibles=['aria-label','aria-description','title','placeholder','alt'];
  const selectorProtegido='script,style,code,pre,textarea,[contenteditable],[translate="no"],[data-idioma-control],[data-idioma-fuente]';
  // Solo cambia la interfaz. Datos, citas, nombres y texto documental no
  // pasan por el diccionario aunque coincidan con una etiqueta como Inicio.
  const originales=[
    '#emiLista .emi-tit','#emiLista .emi-donde','#emiLista .emi-lugar',
    '#emiLista .escaparate-dato-principal b','#emiLista .escaparate-referencia','#emiLista .escaparate-aviso-compacto',
    '.escaparate-datos-clave dd:has(a)','#emiLista time','.escaparate-dialogo-cab h2','.escaparate-dialogo-imagen img',
    '.escaparate-dialogo-identidad','.escaparate-dialogo-resumen','.escaparate-documentacion-caracteristicas',
    '.escaparate-referencias-fechadas','.escaparate-fuentes-documentales','.escaparate-dialogo-metricas','.escaparate-dialogo-avisos',
    '#grid .empresa-visual__texto strong','#grid .empresa-visual__imagen','#grid .ficha-nom h3','#grid .sub','#grid .nota','#grid .aval',
    '#matrix .mm','#rlNom','#rlMeta','#dwId h3','#dwBody .pn-resumen>p','#dwBody .pn-claves','#dwBody .pn-origen-visual>span',
    '#dwBody .pn-verificacion-local-campo>p','#dwBody .pn-verificacion-local-alertas ul','#dwBody .pn-datos-grid dd','#dwBody .pn-fuentes',
    '#modal thead strong','#modal tbody td','#outlist .fn','#outlist .por','#outlist .fuentes',
    '#perfilCuerpo .quien','#perfilCuerpo .correo','#perfilCuerpo .perfil-ini','#perfilCuerpo input[name="name"]',
    '#perfilOfertas .perfil-oferta h3','#perfilOfertas .perfil-oferta p','#perfilEmpresas .movil-seguida h3','#perfilEmpresas .movil-seguida p','#cuentaIdentidad','#cuentaEstadoCorreo',
    '.comunidad-autor','.comunidad-texto','.ac-articulo','.ac-tldr ol','.ac-glosario dl','.ac-leccion-cab h1',
    '.ac-pregunta legend','.ac-opcion-texto','.ac-explicacion','.ac-aviso-legal','main[data-idioma-documental]',
    'main[data-ficha-consulta] p:not(.migas):not(:has(a))','main[data-ficha-consulta] .riesgos','main[data-ficha-consulta] .fuentes','main[data-ficha-consulta] figure'
  ].join(',');
  const superficies='#emiLista,#grid,#matrix,#radarLee,#dwBody,#modalBody,.escaparate-dialogo-cuerpo,#outlist,#perfilCuerpo,.ac-texto,main[data-idioma-documental],main[data-ficha-consulta]';
  function traducir(origen){
    if(idioma.obtenerIdioma()==='en'){
      const limpio=origen.trim(),m=limpio.match(/^Ver las referencias documentales y sus fechas \((\d+)\)$/);
      if(limpio==='Todas')return origen.replace(limpio,idioma.traducir('Todos'));
      if(Object.hasOwn(uiConsulta,limpio))return origen.replace(limpio,uiConsulta[limpio]);
      if(m)return origen.replace(limpio,'View documentary references and dates ('+m[1]+')');
    }
    return idioma.traducir(origen);
  }
  function proteger(raiz){
    if(raiz.nodeType!==Node.ELEMENT_NODE&&raiz.nodeType!==Node.DOCUMENT_NODE)return;
    const nodos=[...(raiz.nodeType===Node.ELEMENT_NODE&&raiz.matches(originales)?[raiz]:[]),...raiz.querySelectorAll(originales)];
    for(const n of nodos){if(n.hasAttribute('data-idioma-fuente'))continue;n.setAttribute('data-idioma-fuente','es');n.lang='es';n.setAttribute('translate','no');}
  }
  const excluido=n=>n.parentElement?.closest(selectorProtegido);
  function texto(n){
    if(excluido(n)||!n.nodeValue?.trim())return;
    let dato=textos.get(n);
    if(!dato||n.nodeValue!==dato.ultimo)dato={original:n.nodeValue,ultimo:n.nodeValue};
    const nuevo=traducir(dato.original);
    if(n.nodeValue!==nuevo)n.nodeValue=nuevo;
    dato.ultimo=nuevo;textos.set(n,dato);
  }
  function atributo(n,nombre){
    if(!n.hasAttribute(nombre)||n.closest('[translate="no"],[contenteditable],[data-idioma-control],[data-idioma-fuente]'))return;
    let registro=atributos.get(n);if(!registro){registro={};atributos.set(n,registro);}
    const actual=n.getAttribute(nombre);
    let dato=registro[nombre];if(!dato||actual!==dato.ultimo)dato={original:actual,ultimo:actual};
    let origen=dato.original;
    const oferta=typeof EMI!=='undefined'&&EMI.find(o=>o.slug===(n.dataset.ofertaDetalle||n.dataset.guardarOferta||n.dataset.perfilOferta));
    const indice=n.dataset.abrir??n.dataset.comparar??(n.classList.contains('blip')?n.dataset.i:undefined);
    const plataforma=typeof P!=='undefined'&&indice!==undefined?P[Number(indice)]:null;
    const nombres=[...new Set([oferta&&oferta.titulo,oferta&&oferta.plataformaNombre,plataforma&&plataforma.n].filter(Boolean))].sort((a,b)=>b.length-a.length);
    const tokens=nombres.map((valor,i)=>({valor,token:'⟦RWADAR_DATO_'+i+'⟧'}));
    for(const {valor,token}of tokens)origen=origen.split(valor).join(token);
    let nuevo=traducir(origen);
    for(const {valor,token}of tokens)nuevo=nuevo.split(token).join(valor);
    if(actual!==nuevo)n.setAttribute(nombre,nuevo);
    dato.ultimo=nuevo;registro[nombre]=dato;
  }
  function recorrer(raiz,preparar=true){
    if(!raiz)return;
    if(raiz.nodeType===Node.TEXT_NODE){texto(raiz);return;}
    if(raiz.nodeType!==Node.ELEMENT_NODE&&raiz.nodeType!==Node.DOCUMENT_NODE)return;
    if(preparar)proteger(raiz);
    if(raiz.nodeType===Node.ELEMENT_NODE){
      if(raiz.hasAttribute('data-idioma-fuente')){marcarFuente(raiz);return;}
      if(raiz.matches(selectorProtegido))return;for(const a of traducibles)atributo(raiz,a);
    }
    for(const n of raiz.childNodes)recorrer(n,false);
  }
  function marcarFuente(fuente){
    if(!fuente.lang)fuente.lang=fuente.dataset.idiomaFuente||'es';
    fuente.setAttribute('translate','no');
    const dialogo=fuente.closest('.escaparate-dialogo');
    const superficie=(dialogo&&dialogo.querySelector('.escaparate-dialogo-cuerpo'))||fuente.closest(superficies)||fuente;
    if(superficie!==fuente)fuente.removeAttribute('data-idioma-fuente-etiqueta');
    if(idioma.obtenerIdioma()==='en'){
      const etiqueta='Original source text ('+(fuente.lang.startsWith('es')?'Spanish':fuente.lang.startsWith('en')?'English':fuente.lang)+')';
      superficie.setAttribute('data-idioma-fuente-etiqueta',etiqueta);
    }else superficie.removeAttribute('data-idioma-fuente-etiqueta');
  }
  function controles(){
    const actual=idioma.obtenerIdioma();
    document.documentElement.lang=actual;
    for(const b of document.querySelectorAll('[data-elegir-idioma]'))b.setAttribute('aria-pressed',String(b.dataset.elegirIdioma===actual));
    for(const s of document.querySelectorAll('[data-idioma-estado]'))s.textContent=actual==='en'?'Language':'Idioma';
    for(const fuente of document.querySelectorAll('[data-idioma-fuente]'))marcarFuente(fuente);
  }
  function actualizar(){recorrer(document.body);recorrer(document.head.querySelector('title'));controles();}
  async function cambiar(valor){
    const x=window.scrollX,y=window.scrollY,foco=document.activeElement;
    const desplazamientos=[...document.querySelectorAll('.pn-body,.escaparate-dialogo-cuerpo,#modal')].map(n=>[n,n.scrollTop,n.scrollLeft]);
    try{await idioma.cambiarIdioma(valor);}catch{
      const aviso=document.querySelector('[data-idioma-aviso]');if(aviso){aviso.hidden=false;aviso.textContent=idioma.traducir('No se pudo guardar el idioma. Puedes seguir usándolo durante esta sesión.');}
    }
    requestAnimationFrame(()=>{window.scrollTo({left:x,top:y,behavior:'instant'});for(const [n,top,left]of desplazamientos){n.scrollTop=top;n.scrollLeft=left;}if(foco&&document.contains(foco))foco.focus({preventScroll:true});});
  }
  function iniciar(){
    const barra=document.createElement('nav');barra.className='idioma-selector';barra.dataset.idiomaControl='';
    barra.setAttribute('aria-label','Español / English');
    const etiqueta=document.createElement('span');etiqueta.dataset.idiomaEstado='';barra.appendChild(etiqueta);
    for(const [id,nombre]of [['es','Español'],['en','English']]){
      const boton=document.createElement('button');boton.type='button';boton.dataset.elegirIdioma=id;
      boton.lang=id;boton.textContent=nombre;boton.addEventListener('click',()=>cambiar(id));barra.appendChild(boton);
    }
    const aviso=document.createElement('span');aviso.dataset.idiomaAviso='';aviso.hidden=true;aviso.setAttribute('role','status');barra.appendChild(aviso);
    const lugar=document.querySelector('[data-selector-idioma]');
    if(lugar)lugar.appendChild(barra);else document.body.insertBefore(barra,document.body.firstChild);
    idioma.suscribirIdioma(actualizar);
    const observado=new MutationObserver(cambios=>{
      for(const c of cambios){
        if(c.type==='characterData')texto(c.target);
        else if(c.type==='attributes'){
          if(c.attributeName==='data-idioma-fuente')marcarFuente(c.target);else atributo(c.target,c.attributeName);
        }
        else for(const n of c.addedNodes)recorrer(n);
      }
    });
    observado.observe(document.documentElement,{subtree:true,characterData:true,childList:true,attributes:true,attributeFilter:[...traducibles,'data-idioma-fuente']});
    let almacenamiento;
    try{almacenamiento={getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)};}catch{almacenamiento={getItem:()=>null,setItem:()=>{throw Error('storage unavailable');}};}
    idioma.cargarIdioma(almacenamiento).then(actualizar);
    actualizar();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
})();

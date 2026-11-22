'use strict';

// Páginas de consulta y RSS derivados del snapshot íntegro leído de Supabase.
// No interpreta la presencia de una ficha como elegibilidad ni oferta abierta.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { parse } = createRequire(path.join(__dirname,'rwadar-app/package.json'))('acorn');
const { validarLotePublicoV2, MANIFIESTO_CATALOGO_V2 } = require('./rwadar-movil/lib/contrato-catalogo');
const permitidas = require('./rwadar-fichas-manifiesto');
const { cargarActivosEditoriales } = require('./rwadar-ofertas-editoriales');
const fotosOfertas = require('./rwadar-movil/lib/fotos-ofertas');
const { paginasAcademy } = require('./rwadar-academy');
const { resumenOferta, rotuloReferencia } = require('./rwadar-movil/lib/ficha-editorial');
// Transparencia de cada oferta (validada por rwadar-editorial-source/ofertas/transparencia.mjs).
const TRANSPARENCIA = JSON.parse(fs.readFileSync(path.join(__dirname,'rwadar-editorial-source/ofertas/transparencia.json'),'utf8'));
const RAIZ = __dirname;
const SITIO = path.join(RAIZ, 'rwadar-site');
const ORIGEN = 'https://rwadar.pages.dev';
const CSS = 'assets/fichas-20261022.css';
const JS = 'assets/ficha-pagina-20261022.js';
const COMPARTIDO = 'assets/ficha-editorial-20261022.js';
const ORIGINAL = ' data-idioma-fuente="es" lang="es" translate="no"';
const esc = valor => String(valor ?? '').replace(/[&<>"']/g, c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json = valor => JSON.stringify(valor).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
const slug = texto => String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fecha = valor => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor))) return null;
  const instante=Date.parse(valor+'T00:00:00Z');
  return Number.isFinite(instante) && new Date(instante).toISOString().slice(0,10)===valor ? valor : null;
};
const corta = valor => fecha(valor) ? valor.split('-').reverse().join('/') : 'Sin fecha publicada';
const enlace = valor => { try {
  const u = new URL(valor);
  return u.protocol === 'https:' && !u.username && !u.password && !/(^|\.)claude\.ai$/i.test(u.hostname) ? u.href : null;
} catch { return null; } };
const rutaOferta = o => '/ofertas/' + o.slug;
const rutaPlataforma = p => '/plataformas/' + p.slug;
// «Marketplace» es un valor fijo del catálogo (rwa_actor); se lee «Mercado de compraventa»
// (LISTA-FINAL fila 19), como en la web. El valor de la base no cambia.
const tipoEmpresaVisible = t => t === 'Marketplace' ? 'Mercado de compraventa' : t;
/* Una consulta técnica (una API o una respuesta en JSON) sirve para comprobar
   un dato, pero no es una página para personas: abrirla da un error o datos en
   bruto. No se enlaza; se lee «Consulta técnica» con su fecha (QA 04/11/2026,
   n.º 12). La misma regla está en la web (rwadar-20260820.js) y en ficha-pagina. */
function consultaTecnica(url) {
  try {
    const u = new URL(String(url));
    return /(?:^|\/)api(?:\/|$)/i.test(u.pathname) || /\.json$/i.test(u.pathname) ||
      /(?:^|&)(?:format|output)=json(?:&|$)/i.test(u.search.slice(1));
  } catch { return false; }
}
const desescapa = t => String(t).replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
function sinEnlacesTecnicos(html, fechaDe = () => null) {
  return String(html).replace(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>(?: <span>· consultada el (\d{2}\/\d{2}\/\d{4})<\/span>)?/g,
    (todo, href, interior, consultada) => {
      const url = desescapa(href);
      if (!consultaTecnica(url)) return todo;
      // El título (ya escapado) se conserva; «Abrir fuente», «Fuente ↗» y la flecha, no.
      const titulo = interior.replace(/<[^>]*>/g, '').replace(/\s*↗\s*$/, '').trim()
        .replace(/^(?:Abrir fuente|Ver fuente|Fuente)(?:\s·\s|$)/, '').trim();
      const f = consultada || (fecha(fechaDe(url)) ? corta(fechaDe(url)) : '');
      return '<span class="consulta-tecnica">' + (titulo ? titulo + ' · ' : '') + '<span>Consulta técnica</span>' + (f ? ' · ' + f : '') + '</span>';
    });
}

function leerBloquesCatalogo(codigo) {
  const ast = parse(codigo, {ecmaVersion:'latest'});
  const nombres = new Set(['P','FUERA','EMI']);
  assert(ast.body.every(n => n.type==='ExpressionStatement' && n.directive==='use strict' ||
    n.type==='VariableDeclaration' && n.kind==='const' && n.declarations.length===1 &&
    n.declarations[0].id.type==='Identifier' && nombres.has(n.declarations[0].id.name)),
    'El snapshot solo admite las tres declaraciones de datos del catálogo');
  const literal = nodo => {
    assert(nodo,'El catálogo no admite huecos en sus literales');
    if (nodo.type==='Literal') {
      assert(nodo.value===null || ['string','boolean','number'].includes(typeof nodo.value),
        'El catálogo solo admite datos literales');
      assert(typeof nodo.value!=='number' || Number.isFinite(nodo.value),'Número de catálogo no válido');
      return nodo.value;
    }
    if (nodo.type==='UnaryExpression' && nodo.operator==='-' && nodo.argument.type==='Literal' &&
      typeof nodo.argument.value==='number') return -nodo.argument.value;
    if (nodo.type==='ArrayExpression') return nodo.elements.map(literal);
    assert(nodo.type==='ObjectExpression','El catálogo no puede ejecutar expresiones');
    const claves = new Set();
    return Object.fromEntries(nodo.properties.map(p=>{
      assert(p.type==='Property' && p.kind==='init' && !p.method && !p.computed && !p.shorthand,
        'El catálogo solo admite propiedades de datos');
      const clave = p.key.type==='Identifier' ? p.key.name : p.key.value;
      assert(typeof clave==='string' && !['__proto__','constructor','prototype'].includes(clave) && !claves.has(clave),
        'Propiedad de catálogo no válida');
      claves.add(clave);
      return [clave,literal(p.value)];
    }));
  };
  const leer = nombre => {
    const nodos = ast.body.filter(n=>n.type==='VariableDeclaration').flatMap(n=>n.declarations)
      .filter(n=>n.id.type==='Identifier' && n.id.name===nombre);
    assert(nodos.length===1 && nodos[0].init?.type==='ArrayExpression','Falta el bloque único ' + nombre);
    return literal(nodos[0].init);
  };
  return {plataformas:leer('P'),ofertas:leer('EMI'),fuera:leer('FUERA')};
}

function validarCatalogoSnapshot({plataformas,ofertas,fuera}, {
  hoy = new Date(), manifiesto = MANIFIESTO_CATALOGO_V2, paginasPermitidas = permitidas,
} = {}) {
  const lote = validarLotePublicoV2(
    plataformas.map(p=>({...p,nombre:p.n,revision_id:p.revisionId,verificacion_local:p.verificacionLocal})),
    ofertas.map(o=>({...o,revision_id:o.revisionId,plataforma_slug:o.plataformaSlug,
      plataforma_nombre:o.plataformaNombre,verificada_el:o.verificadaEl,vigencia_dias:o.vigenciaDias,
      estado_revision:o.estadoRevision,fuentes_actuales:o.fuentesActuales,disponible_es:o.disponibleEs})),
    {hoy,manifiesto,permitirAmpliacion:true,permitirCaducado:true});
  assert(plataformas.every(p=>enlace(p.web)) && ofertas.every(o=>enlace(o.url)),
    'El catálogo contiene enlaces de proveedor no válidos');
  assert(Array.isArray(fuera) && fuera.length===paginasPermitidas.filter(n=>n.startsWith('fuera-del-radar/')).length &&
    new Set(fuera.map(f=>slug(f.n))).size===fuera.length && fuera.every(f=>slug(f.n) &&
      typeof f.badge==='string' && f.badge.trim() && typeof f.why==='string' && f.why.trim() &&
      Array.isArray(f.fuentes) && f.fuentes.length>0 && f.fuentes.every(s=>enlace(s.url))),
    'Los descartes no corresponden al manifiesto cerrado o carecen de fuentes');
  return {plataformas,ofertas,fuera,revision:lote.fecha,manifiesto:lote.manifiesto};
}

function leerCatalogo(raiz = RAIZ, opciones) {
  return validarCatalogoSnapshot(leerBloquesCatalogo(fs.readFileSync(
    path.join(raiz,'rwadar-site/assets/catalogo-publico-20261022.js'),'utf8')),opciones);
}

function validarRutasCatalogo(catalogo, paginasPermitidas = permitidas) {
  assert(Array.isArray(paginasPermitidas) && new Set(paginasPermitidas).size===paginasPermitidas.length &&
    paginasPermitidas.every(n=>/^(?:(?:ofertas|plataformas|fuera-del-radar)\/[a-z0-9]+(?:-[a-z0-9]+)*\.html|(?:metodologia|cambios)\.html|novedades\.xml)$/.test(n)),
    'Manifiesto cerrado de rutas no válido');
  const rutas = ['cambios.html','metodologia.html','novedades.xml',
    ...catalogo.plataformas.map(p=>'plataformas/'+p.slug+'.html'),
    ...catalogo.ofertas.map(o=>'ofertas/'+o.slug+'.html'),
    ...catalogo.fuera.map(f=>'fuera-del-radar/'+slug(f.n)+'.html')];
  assert.deepEqual(rutas.sort(),[...paginasPermitidas].sort(),
    'Las páginas deben coincidir con el manifiesto cerrado revisado');
  return rutas;
}

function fuentes(lista) {
  const vistas = new Set();
  return '<ul class="fuentes">' + lista.filter(Boolean).map(f => typeof f === 'string' ? {url:f} : f)
    .filter(f => enlace(f.url) && !vistas.has(f.url) && vistas.add(f.url)).map(f =>
      '<li><a href="' + esc(enlace(f.url)) + '" target="_blank" rel="noopener noreferrer">' +
      esc(f.titulo || new URL(f.url).hostname) + ' ↗</a>' + (f.consultadaEl ?
        ' <span>· consultada el ' + esc(corta(f.consultadaEl)) + '</span>' : '') + '</li>').join('') + '</ul>';
}

function pagina({titulo,descripcion,ruta,contenido,revision,imagen='/og.png',organizacion,oferta}) {
  const tituloPestana = (titulo.length > 55 ? titulo.slice(0,54).trimEnd() + '…' : titulo) + ' · RWAdar';
  const descripcionMeta = descripcion.replace(/\s+/g,' ').slice(0,159);
  // n.º 12: las consultas técnicas no se enlazan; su fecha es la de la consulta.
  const refsFuente = (oferta && oferta.documentacion && oferta.documentacion.referencias) || [];
  contenido = sinEnlacesTecnicos(contenido, url => refsFuente.filter(r => enlace(r.fuente) === url)
    .map(r => r.fechaConsulta).filter(fecha).sort().at(-1) || oferta?.documentacion?.revisadaEl || revision);
  const datos = { '@context':'https://schema.org','@type':'WebPage',url:ORIGEN+ruta,
    name:titulo,description:descripcionMeta,inLanguage:'es',dateModified:revision,
    isPartOf:{'@type':'WebSite',name:'RWAdar',url:ORIGEN+'/'},
    ...(organizacion ? {about:{'@type':'Organization',name:organizacion.nombre,
      ...(enlace(organizacion.url) ? {url:enlace(organizacion.url)} : {})}} : {}),
    breadcrumb:{'@type':'BreadcrumbList',itemListElement:[
      {'@type':'ListItem',position:1,name:'Inicio',item:ORIGEN+'/'},
      {'@type':'ListItem',position:2,name:titulo,item:ORIGEN+ruta}]}};
  return '<!doctype html>\n<html lang="es"><head><meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' +
    '<title>'+esc(tituloPestana)+'</title><meta name="description" content="'+esc(descripcionMeta)+'">\n' +
    '<link rel="canonical" href="'+ORIGEN+ruta+'"><link rel="icon" href="/icono-192.png">\n' +
    '<meta property="og:type" content="article"><meta property="og:title" content="'+esc(titulo)+'">\n' +
    '<meta property="og:description" content="'+esc(descripcionMeta)+'"><meta property="og:url" content="'+ORIGEN+ruta+'">\n' +
    '<meta property="og:image" content="'+ORIGEN+imagen+'"><meta name="theme-color" content="#10100e">\n' +
    // Vista previa grande también en X y apps que solo leen twitter:card (QA 04/11/2026, n.º 29).
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<link rel="alternate" type="application/rss+xml" title="Novedades de RWAdar" href="/novedades.xml">\n' +
    '<script src="/assets/idioma-previo-20261104.js" data-idioma-en="/assets/idioma-en-20261022.js"></script><link rel="stylesheet" href="/'+CSS+'"><link rel="stylesheet" href="/assets/idioma-20261022.css">\n<script type="application/ld+json">'+json(datos)+'</script>\n' +
    (oferta ? '<script src="/'+COMPARTIDO+'" defer></script>\n' : '') +
    '<script src="/assets/idioma-20261022.js" defer></script><script src="/assets/idioma-web-20261022.js" defer></script>\n'+
    (oferta ? '<script src="/'+JS+'" defer></script>\n' : '') +
    '</head><body><a class="saltar" href="#contenido">Saltar al contenido</a><header class="cabecera"><a class="marca" href="/" aria-label="RWAdar · Inicio">RWA<span>dar</span></a>' +
    '<nav aria-label="Principal"><a href="/#emisiones" data-volver="ofertas">Ofertas</a><a href="/#tool">Plataformas</a><a href="/academy/">Academy</a><a href="/cambios">Novedades</a></nav></header>' +
    '<div data-selector-idioma></div><main id="contenido"'+(organizacion ? ' data-ficha-consulta' : ' data-idioma-documental="es"')+(oferta ? ' data-oferta="'+esc(json(oferta))+'"' : '')+'><p class="migas"><a href="/">Inicio</a> / <span'+ORIGINAL+'>'+esc(titulo)+'</span></p>' +
    '<h1'+(organizacion ? ORIGINAL : '')+'>'+esc(titulo)+'</h1>'+contenido+'</main><footer><p>RWAdar es un catálogo gratuito con información propia. Que algo aparezca aquí no es una recomendación ni una garantía. Si inviertes, lo haces directamente con el proveedor.</p>' +
    '<nav aria-label="Información"><a href="/metodologia">Cómo verificamos</a><a href="/transparencia-comercial">Transparencia comercial</a><a href="/privacidad">Privacidad y aviso legal</a>' +
    '<a href="/novedades.xml">RSS</a><a href="mailto:rwadares@gmail.com">Comunicar un error</a></nav></footer></body></html>\n';
}

const riesgos = '<section aria-labelledby="riesgos"><h2 id="riesgos">Antes de invertir</h2><ul class="riesgos">' +
  '<li><strong>Pérdida:</strong> puedes perder el dinero invertido y lo que esperabas ganar.</li>' +
  '<li><strong>Salida:</strong> la reventa depende de compradores; tokenizar no garantiza liquidez.</li>' +
  '<li><strong>Custodia:</strong> comprueba quién guarda el activo y qué derecho te da.</li>' +
  '<li><strong>Supervisión:</strong> que la plataforma esté registrada no cubre todos sus productos ni confirma que tú puedas invertir.</li></ul></section>';

/* «Se contrata hoy desde España» (la primera comprobación de transparencia):
   oferta principal, disponibleEs verdadero y acceso desde España con fuente. */
function accesoContratable(o,r) {
  const acceso = r.accesoEspana.estado==='si' && enlace(r.accesoEspana.fuente) ? {url:r.accesoEspana.fuente,fecha:r.accesoEspana.consultadaEl} : null;
  return {acceso, contratable:o.coleccion==='principales' && o.disponibleEs===true && Boolean(acceso)};
}
const resumenDeLaRevision = (o,catalogo) => resumenOferta(o,catalogo.plataformas,new Date(o.verificadaEl+'T12:00:00Z'));
/* «La entidad que la ofrece está autorizada por un supervisor de la UE e
   inscrita en la CNMV» (comprobación editorial de transparencia.json, de la
   misma revisión). Falla cerrado: sin entrada de esa fecha, no consta. */
const supervisadaCumple = o => { const t = TRANSPARENCIA.ofertas[o.slug];
  return Boolean(t && t.verificadaEl===o.verificadaEl && t.supervisada && t.supervisada.cumple===true); };
/* Revisión legal del 06/11/2026, punto 5.3: «Ver oferta en X» solo donde «Se
   contrata hoy desde España» es «Sí» Y la entidad que la ofrece está
   supervisada («supervisada» en «Sí»): la revisión nombra las dos condiciones.
   En las demás fichas, el enlace al proveedor dice que se sale de RWAdar.
   ficha-pagina lo cambia también si al abrir la página «Se contrata hoy desde
   España» pasa a «No». */
const SALIR_AL_PROVEEDOR = 'Ir a la web del proveedor (sales de RWAdar)';
const verOfertaEnProveedor = (o,catalogo) => accesoContratable(o,resumenDeLaRevision(o,catalogo)).contratable && supervisadaCumple(o);

/* «Transparencia: lo que hemos comprobado», como en la ficha de la web. Falla
   cerrado: sin entrada con la misma verificadaEl, no hay datos a favor y las
   dos comprobaciones editoriales salen en «No». Lo que depende de «hoy»
   (contratable, mínimo y salida, vigencia) lo vuelve a mirar ficha-pagina al
   abrir la página. Solo el texto de transparencia.json y los datos del
   catálogo van como texto de la fuente; lo que escribe RWAdar se traduce. */
function transparenciaOferta(o,catalogo) {
  const t = TRANSPARENCIA.ofertas[o.slug], e = t && t.verificadaEl === o.verificadaEl ? t : null;
  const r = resumenDeLaRevision(o,catalogo);
  const texto = Object.fromEntries(TRANSPARENCIA.criterios.map(c=>[c.id,c.texto]));
  const minimo = Number.isFinite(r.minimo.euros) || Boolean(r.minimo.unidadDocumentada);
  const salida = !['Salida no documentada','Salida por volver a comprobar'].includes(r.salida.texto);
  const fuente = f => f && enlace(f.url) ? '<p><a href="'+esc(enlace(f.url))+'" target="_blank" rel="noopener noreferrer"><span'+ORIGINAL+'>'+esc(f.titulo || new URL(f.url).hostname.replace(/^www\./,''))+'</span> ↗</a>'+
    (fecha(f.fecha) ? ' <span>· consultada el '+esc(corta(f.fecha))+'</span>' : '')+'</p>' : '';
  const fila = (id,cumple,motivo,f,{campo='',original=false}={}) => '<li data-cumple="'+(cumple?'si':'no')+'"><strong><span class="comprobacion-marca">'+(cumple?'✓ Sí':'✗ No')+'</span> '+esc(texto[id])+'</strong>'+
    '<p'+(campo ? ' data-campo="'+campo+'"' : '')+(original ? ORIGINAL : ' class="ui"')+'>'+motivo+'</p>'+fuente(f)+'</li>';
  const editorial = id => e ? fila(id,e[id].cumple===true,esc(e[id].motivo),{...e[id].fuente,fecha:e[id].consultadaEl},{original:true}) :
    fila(id,false,esc('Todavía no hemos comprobado este punto en la revisión actual.'));
  const {acceso, contratable} = accesoContratable(o,r);
  const dato = v => '<span'+ORIGINAL+'>'+esc(v)+'</span>';
  const textoMinimo = r.minimo.texto==='No documentado en euros' && r.minimo.unidadDocumentada ? r.minimo.unidadDocumentada : r.minimo.texto;
  const motivoMinimo = (minimo ? '<span>Mínimo:</span> '+dato(textoMinimo)+'.' : 'Mínimo sin documentar.')+' '+
    (salida ? '<span>Salida:</span> '+dato(r.salida.texto.replace(/^Salida:\s*/,'').replace(/\.$/,''))+'.' : 'Salida sin documentar.');
  const fuenteMinimo = minimo && enlace(r.minimo.fuente) ? {url:r.minimo.fuente,fecha:r.minimo.consultadaEl} :
    enlace(r.salida.fuente) ? {url:r.salida.fuente,fecha:r.salida.consultadaEl} : null;
  const puntos = e ? e.puntos : [];
  return '<section aria-labelledby="transparencia"><h2 id="transparencia">Transparencia: lo que hemos comprobado</h2>'+
    '<p class="ui">Es una comprobación de la documentación, no una recomendación de inversión.</p><ul class="comprobaciones">'+
    fila('contratable',contratable,esc(contratable ? 'Es una oferta principal y la fuente dice que se contrata desde España.' :
      o.coleccion==='secundario' ? 'Está en Reventa: RWAdar no confirma que se pueda contratar hoy; compruébalo en la fuente.' :
      o.coleccion==='en_camino' ? 'Es un anuncio: todavía no se puede contratar.' :
      o.disponibleEs===false ? 'La fuente dice que no se contrata desde España.' : 'No consta en la fuente que se contrate desde España.'),acceso,{campo:'contratable'})+
    editorial('supervisada')+editorial('documentoEspana')+
    fila('minimoSalida',minimo && salida,motivoMinimo,fuenteMinimo,{campo:'minimoSalida'})+
    fila('vigente',false,esc('Se comprueba al abrir la página con la fecha de hoy.'),null,{campo:'vigencia'})+'</ul>'+
    /* «Datos comprobados a favor» (antes «Puntos fuertes»): revisión legal del 06/11/2026, punto 5.3. */
    (puntos.length ? '<h3>Datos comprobados a favor, con su fuente</h3><ul class="fuentes puntos">'+puntos.map(x=>'<li><strong>'+esc(x.texto)+'</strong>'+fuente(x.fuente)+'</li>').join('')+'</ul>' : '')+
    '</section>';
}

/* «Qué se adquiere: …» va en su fila de «Qué es y quién lo ofrece» y no también
   al final del párrafo inicial (QA 04/11/2026, n.º 17). Solo se separa si es la
   misma frase que la característica; si la descripción cuenta otra cosa, se queda. */
function separarAdquiere(d) {
  const texto = String(d.descripcion || ''), i = texto.lastIndexOf('Qué se adquiere:');
  const c = (d.caracteristicas || []).find(x=>x && x.etiqueta==='Qué se adquiere');
  const norma = v => String(v || '').trim().replace(/\.$/,'').replace(/^./,x=>x.toLowerCase());
  if (!c || i<0 || !norma(c.valor) || norma(texto.slice(i+16))!==norma(c.valor)) return {intro:texto, adquiere:''};
  const valor = String(c.valor).trim();
  return {intro:texto.slice(0,i).trim(), adquiere:/[.!?…]$/.test(valor) ? valor : valor+'.'};
}

/* El pie de la imagen (22/11/2026): una ilustración dice que es de IA; una foto
   real de Wikimedia Commons, qué muestra (el activo, o su lugar o su tema, «no
   del activo»), su autor, su licencia y su página, en castellano y en inglés
   (la hoja de estilos enseña el del idioma elegido), con lib/fotos-ofertas.js. */
function pieFigura(imagen) {
  if (imagen.clase !== 'foto') return 'Ilustración editorial generada con IA. No es una fotografía del activo real.';
  return ['es','en'].map(l=>{
    const pie = fotosOfertas.pieFotoOferta(imagen.foto, l);
    return '<span class="foto-oferta-pie-'+l+'" lang="'+l+'">'+pie.partes.map(x=>x.enlace && enlace(x.enlace)
      ? '<a href="'+esc(enlace(x.enlace))+'" target="_blank" rel="noopener noreferrer">'+esc(x.texto)+'</a>' : esc(x.texto)).join('')+
      (pie.generico ? '' : ' · '+esc(pie.recorte))+'.</span>';
  }).join('');
}
function paginaOferta(o,catalogo,imagen) {
  const d = o.documentacion || {}, {intro, adquiere} = separarAdquiere(d);
  const refs = (d.referencias || []).filter(r=>enlace(r.fuente) && fecha(r.fechaConsulta));
  const p = catalogo.plataformas.find(p=>p.slug===o.plataformaSlug);
  /* Supervisión: si la comprobación «supervisada» se cumple, su motivo y su fuente
     (transparencia.json); si no, lo que diga la plataforma del radar. */
  const sup = supervisadaCumple(o) ? TRANSPARENCIA.ofertas[o.slug].supervisada : null;
  const supervision = sup ? esc(sup.motivo)+(enlace(sup.fuente && sup.fuente.url) ? ' <a href="'+esc(enlace(sup.fuente.url))+'" target="_blank" rel="noopener noreferrer">Fuente ↗</a>' : '') :
    esc(p?.verificacionLocal?.licenciaRegistro?.detalle || 'Todavía no hemos evaluado esta plataforma. Que publiquemos esta oferta no significa que hayamos revisado al proveedor.');
  /* Los avisos de la oferta, tal cual y arriba; el genérico ya lo dice la línea del botón. */
  const avisos = (o.avisos || []).map(a=>typeof a==='string' ? a : a && a.tono!=='ok' && (!a.esAntiguedad || a.tono==='stop') ? a.texto : '')
    .filter(x=>x && !/^Referencia editorial gratuita\b/.test(x));
  const fichaImagen = imagen ? '<figure><img src="/'+esc(imagen.salida)+'" alt="'+esc(imagen.alt)+'" width="960" height="660"><figcaption>'+pieFigura(imagen)+'</figcaption></figure>' : '';
  const contenido = '<p class="intro"'+ORIGINAL+'>'+esc(intro || o.resumen)+'</p>'+fichaImagen+
    '<p class="estado" role="status" data-campo="estado">Confirma las condiciones actuales en las fuentes.</p>'+
    (avisos.length ? '<section aria-labelledby="avisos"><h2 id="avisos">Avisos de esta oferta</h2><ul class="riesgos"'+ORIGINAL+'>'+avisos.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></section>' : '')+
    '<section aria-labelledby="que"><h2 id="que">Qué es y quién lo ofrece</h2><dl><div><dt>Proveedor</dt><dd'+ORIGINAL+'>'+esc(o.plataformaNombre)+'</dd></div>' +
    '<div><dt>Tipo de activo</dt><dd'+ORIGINAL+'>'+esc(o.categoria)+'</dd></div>'+
    (adquiere ? '<div><dt>Qué se adquiere</dt><dd'+ORIGINAL+'>'+esc(adquiere)+'</dd></div>' : '')+'<div><dt>Supervisión de la plataforma</dt><dd'+ORIGINAL+'>'+supervision+'</dd></div></dl>'+
    (p ? '<p><a href="'+rutaPlataforma(p)+'">Consultar ficha de plataforma</a></p>' : '')+'</section>' +
    '<section aria-labelledby="acceso"><h2 id="acceso">Acceso y condiciones</h2><p>La admisión depende de tu residencia, categoría de inversor y de las condiciones del proveedor.</p><dl>'+
    '<div><dt>Mínimo</dt><dd data-campo="minimo"'+ORIGINAL+'>Consulta la fuente; no se presupone un mínimo vigente.</dd></div>'+
    '<div><dt>Acceso desde España</dt><dd data-campo="accesoEspana"'+ORIGINAL+'>Sin comprobar si se puede contratar desde España.</dd></div>'+
    '<div><dt>Costes</dt><dd data-campo="costes"'+ORIGINAL+'>Confirma los costes actuales con el proveedor.</dd></div></dl></section>'+
    '<section aria-labelledby="salida"><h2 id="salida">Cómo se recupera el dinero</h2><p data-campo="salida"'+ORIGINAL+'>La salida no se da por garantizada; consulta la documentación del proveedor.</p></section>'+riesgos+
    /* El botón, con su línea, justo después de los avisos y los riesgos (como en la ficha de la web). */
    '<p class="aviso">No es una recomendación de inversión. RWAdar no vende ni recibe tu dinero: confirma las condiciones con el proveedor.</p>'+
    '<p><a class="boton" href="'+esc(enlace(o.url))+'" target="_blank" rel="noopener noreferrer" data-campo="botonProveedor">'+
    (verOfertaEnProveedor(o,catalogo) ? 'Ver oferta en '+esc(o.plataformaNombre) : SALIR_AL_PROVEEDOR)+' ↗</a></p>'+transparenciaOferta(o,catalogo)+
    '<section aria-labelledby="fuentes"><h2 id="fuentes">Fuentes y fechas</h2><p>Revisamos esta ficha el <time datetime="'+esc(o.verificadaEl)+'">'+esc(corta(o.verificadaEl))+'</time>. Esa fecha no garantiza que las cifras sigan igual ni que la oferta siga abierta.</p>'+
    '<p>Cada fuente lleva el día en que la consultamos. El dato puede ser más antiguo, y algunas fuentes no dicen de qué fecha es.</p>'+
    (refs.length ? '<details><summary>Ver los '+refs.length+' datos consultados y sus fechas</summary><ul class="referencias"'+ORIGINAL+'>'+refs.map(r=>'<li><strong>'+esc(rotuloReferencia(r.etiqueta))+'</strong><br>Dato fechado: '+esc(corta(r.fechaDato))+' · Consulta: '+esc(corta(r.fechaConsulta))+'<br><a href="'+esc(enlace(r.fuente))+'" target="_blank" rel="noopener noreferrer">Abrir fuente ↗</a><p>'+esc(r.alcance || '')+'</p></li>').join('')+'</ul></details>' : '')+
    fuentes([...(d.fuentes || []),...(o.fuentesActuales || [])])+'</section>'+
    '<p><a href="mailto:rwadares@gmail.com?subject='+encodeURIComponent('Corrección de ficha: '+o.titulo)+'">¿Ves un error en esta ficha?</a></p>';
  return pagina({titulo:o.titulo,descripcion:o.resumen,ruta:rutaOferta(o),contenido,revision:o.verificadaEl,
    imagen:imagen ? '/'+imagen.salida : '/og.png',organizacion:{nombre:o.plataformaNombre,url:o.url},oferta:o});
}

function paginaPlataforma(p,catalogo) {
  const v = p.verificacionLocal || {};
  const asociadas = catalogo.ofertas.filter(o=>o.plataformaSlug===p.slug);
  const contenido = '<p class="intro"'+ORIGINAL+'>'+esc(p.nota)+'</p><section><h2>Quién es</h2><p'+ORIGINAL+'>'+esc(tipoEmpresaVisible(p.tipo))+' · '+esc(p.cat)+' · '+esc(p.reg)+'</p><p'+ORIGINAL+'>'+esc(v.estadoOperativo?.detalle || '')+'</p></section>'+
    '<section><h2>Cómo funciona y qué se ha comprobado</h2><p'+ORIGINAL+'>'+esc(p.aval)+'</p><h3>Supervisión y alcance</h3><p'+ORIGINAL+'>'+esc(v.licenciaRegistro?.detalle || 'Consulta el alcance del registro en la fuente.')+'</p>'+fuentes(v.licenciaRegistro?.fuentes || [])+'</section>'+
    '<section><h2>Quién puede acceder</h2><p'+ORIGINAL+'>'+esc(v.acceso?.detalle || p.acceso)+'</p><p>La presencia en el radar no confirma acceso desde España ni aprobación de un producto concreto.</p>'+fuentes(v.acceso?.fuentes || [])+'</section>'+
    /* Los avisos importantes de la plataforma, con su fuente (auditoría del radar del 21/11/2026: se veían en el radar, no en su página). */
    ((v.alertasCriticas || []).some(a=>a && a.detalle) ? '<section aria-labelledby="avisos-plataforma"><h2 id="avisos-plataforma">Avisos importantes</h2><ul class="riesgos"'+ORIGINAL+'>'+
      v.alertasCriticas.filter(a=>a && a.detalle).map(a=>'<li>'+esc(a.detalle)+'</li>').join('')+'</ul>'+fuentes(v.alertasCriticas.flatMap(a=>a.fuentes || []))+'</section>' : '')+riesgos+
    '<section><h2>Fuentes y fechas</h2><p>Revisión editorial: '+esc(corta(v.verificadoEl || p.ver))+'. Cada fuente mantiene su propia fecha de consulta.</p>'+fuentes([...(v.estadoOperativo?.fuentes || []),...(v.alertasCriticas || []).flatMap(a=>a.fuentes || [])])+'</section>'+
    '<section><h2>Ofertas de esta plataforma en RWAdar</h2>'+(asociadas.length ? '<ul'+ORIGINAL+'>'+asociadas.map(o=>'<li><a href="'+rutaOferta(o)+'">'+esc(o.titulo)+'</a></li>').join('')+'</ul>' : '<p>Todavía no tenemos fichas de ofertas concretas de esta plataforma. Eso no quiere decir que no tenga productos.</p>')+'</section>'+
    '<p><a class="boton" href="'+esc(enlace(p.web))+'" target="_blank" rel="noopener noreferrer">Ir a la web de '+esc(p.n)+' ↗</a></p>';
  return pagina({titulo:p.n,descripcion:p.nota,ruta:rutaPlataforma(p),contenido,revision:v.verificadoEl || p.ver,organizacion:{nombre:p.n,url:p.web}});
}

function novedades(catalogo) {
  const noticias = JSON.parse(fs.readFileSync(path.join(RAIZ,'rwadar-noticias/noticias.json'),'utf8')).noticias;
  const ruta = path.join(RAIZ,'rwadar-app/data/verificaciones',catalogo.revision+'-v2','cambios-'+catalogo.revision+'.json');
  const cambio = fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta,'utf8')) : null;
  const entradas = noticias.map(n=>({id:'noticia-'+n.id,fecha:n.fecha,titulo:n.titulo,texto:n.texto,url:ORIGEN+'/cambios#noticia-'+n.id}));
  if (cambio) entradas.push({id:'catalogo-'+catalogo.revision,fecha:catalogo.revision,titulo:'Revisión documental del catálogo del '+corta(catalogo.revision),
    texto:'Revisadas las fuentes de '+catalogo.plataformas.length+' plataformas y '+catalogo.ofertas.length+' ofertas. Haber revisado una ficha no significa que la oferta esté abierta, y las cifras que no hemos vuelto a leer en su fuente no se dan por actuales.',url:ORIGEN+'/cambios#catalogo-'+catalogo.revision});
  return entradas.sort((a,b)=>b.fecha.localeCompare(a.fecha) || a.id.localeCompare(b.id));
}

function construirSalidas({catalogo, paginasPermitidas = permitidas} = {}) {
  const c = catalogo ? validarCatalogoSnapshot(catalogo,{paginasPermitidas}) : leerCatalogo();
  validarRutasCatalogo(c,paginasPermitidas);
  const fotos = new Map(cargarActivosEditoriales(RAIZ).fichas.map(f=>[f.slug,f]));
  const salidas = new Map();
  for (const o of c.ofertas) salidas.set('ofertas/'+o.slug+'.html',paginaOferta(o,c,fotos.get(o.slug)));
  for (const p of c.plataformas) salidas.set('plataformas/'+p.slug+'.html',paginaPlataforma(p,c));
  for (const f of c.fuera) {
    const ruta='/fuera-del-radar/'+slug(f.n);
    salidas.set(ruta.slice(1)+'.html',pagina({titulo:f.n+' · Plataforma descartada',descripcion:f.why,ruta,revision:c.revision,
      contenido:'<p class="estado">'+esc(f.badge)+'</p><section><h2>Por qué la descartamos</h2><p>'+esc(f.why)+'</p></section><section><h2>Fuentes</h2>'+fuentes(f.fuentes || [])+'</section><p>Solo descartamos una plataforma si hay una fuente que lo justifique. Si sabes que algo ha cambiado, escríbenos y lo revisamos.</p>'}));
  }
  salidas.set('metodologia.html',pagina({titulo:'Cómo verificamos',descripcion:'Qué comprueba RWAdar, qué significa cada fecha y cómo se ordena un catálogo editorial independiente.',ruta:'/metodologia',revision:c.revision,
    contenido:'<p class="intro">Cada dato de RWAdar dice de dónde sale. Aparecer es gratis y nadie puede pagar para cambiar lo que decimos de su oferta.</p><section><h2>Qué comprobamos</h2><p>Miramos por separado la plataforma, la empresa que hay detrás, su registro ante el supervisor y cada producto. Así no damos a una oferta un permiso que en realidad tiene otra empresa. Las condiciones salen de los documentos de quien emite la oferta, y lo que está supervisado, del registro oficial.</p></section>'+
    '<section><h2>Tres fechas distintas</h2><dl><div><dt>Revisión editorial</dt><dd>Cuándo revisamos o preparamos ese grupo de fichas, incluidos los intentos que no permitieron comprobar datos.</dd></div><div><dt>Consulta de la fuente</dt><dd>Cuándo se leyó la referencia concreta. No cambia la fecha original del dato.</dd></div><div><dt>Fecha del dato</dt><dd>La indicada expresamente por el proveedor. Si falta, se declara que no fue publicada.</dd></div></dl></section>'+
    '<section><h2>Estado y vigencia</h2><p>«No verificable» significa que no se confirmó el dato o la apertura, por ejemplo porque la web no nos dejó leerla. «Fuentes en conflicto» indica discrepancias. No son pruebas de fraude. Si una cifra lleva demasiado tiempo sin revisarse, la ocultamos; la ficha y el catálogo siguen visibles, con un aviso.</p></section>'+
    '<section><h2>Cómo ordenamos</h2><p>El orden editorial no depende de pagos ni utiliza la rentabilidad como criterio por defecto. Separamos las ofertas principales, la reventa entre inversores y los anuncios que aún no han abierto. Los filtros solo ordenan datos: no te dicen qué te conviene.</p></section>'+
    '<section><h2>Cómo corregimos</h2><p>Escribe a <a href="mailto:rwadares@gmail.com">rwadares@gmail.com</a> indicando la ficha y una fuente primaria. Conservamos los informes con fecha y mostramos las novedades de cada revisión.</p></section>'}));
  const entradas=novedades(c);
  salidas.set('cambios.html',pagina({titulo:'Novedades y revisiones',descripcion:'Historial editorial de RWAdar, con fechas y un canal RSS que no pide registro.',ruta:'/cambios',revision:c.revision,
    contenido:'<p class="intro">Cambios en las fichas y novedades de RWAdar. <a href="/novedades.xml">Suscribirse por RSS</a> permite seguirlos sin cuenta ni correo.</p><ol class="novedades">'+entradas.map(e=>'<li id="'+esc(e.id)+'"><article><time datetime="'+e.fecha+'">'+corta(e.fecha)+'</time><h2>'+esc(e.titulo)+'</h2><p>'+esc(e.texto)+'</p></article></li>').join('')+'</ol>'}));
  salidas.set('novedades.xml','<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>RWAdar · Novedades</title><link>'+ORIGEN+'/cambios</link><description>Revisiones y novedades editoriales, sin registro.</description><language>es</language>'+entradas.map(e=>'<item><title>'+esc(e.titulo)+'</title><link>'+esc(e.url)+'</link><guid isPermaLink="true">'+esc(e.url)+'</guid><pubDate>'+new Date(e.fecha+'T00:00:00Z').toUTCString()+'</pubDate><description>'+esc(e.texto)+'</description></item>').join('')+'</channel></rss>\n');
  assert.deepEqual([...salidas.keys()].sort(),[...paginasPermitidas].sort(),'Las páginas deben coincidir con el manifiesto cerrado');
  salidas.set(COMPARTIDO,fs.readFileSync(path.join(RAIZ,'rwadar-movil/lib/ficha-editorial.js'),'utf8'));
  const originales=fs.readFileSync(path.join(SITIO,'sitemap.xml'),'utf8').replace(/\s*<!--fichas:ini-->[\s\S]*?<!--fichas:fin-->/,'');
  const urls=[...salidas.keys()].filter(n=>n.endsWith('.html')).map(n=>'<url><loc>'+ORIGEN+'/'+n.slice(0,-5)+'</loc><lastmod>'+c.revision+'</lastmod></url>').join('\n');
  salidas.set('sitemap.xml',originales.replace('</urlset>','  <!--fichas:ini-->\n'+urls+'\n  <!--fichas:fin-->\n</urlset>'));
  return salidas;
}

function comprobar() {
  return [...construirSalidas()].filter(([n,c])=>!fs.existsSync(path.join(SITIO,n)) || fs.readFileSync(path.join(SITIO,n),'utf8')!==c).map(([n])=>n);
}
function generar() {
  const cambiados=[];
  for (const [nombre,contenido] of construirSalidas()) {
    const archivo=path.join(SITIO,nombre);
    if (fs.existsSync(archivo) && fs.readFileSync(archivo,'utf8')===contenido) continue;
    fs.mkdirSync(path.dirname(archivo),{recursive:true}); fs.writeFileSync(archivo,contenido,'utf8'); cambiados.push(nombre);
  }
  return cambiados;
}
module.exports={leerBloquesCatalogo,validarCatalogoSnapshot,validarRutasCatalogo,leerCatalogo,
  construirSalidas,comprobar,generar,rutaOferta,rutaPlataforma,esc,enlace,consultaTecnica,sinEnlacesTecnicos};
if (require.main===module) {
  const pendientes=process.argv.includes('--comprobar') ? comprobar() : generar();
  console.log((process.argv.includes('--comprobar') ? 'Diferencias: ' : 'Archivos actualizados: ')+pendientes.length);
  if (process.argv.includes('--comprobar') && pendientes.length) {console.error(pendientes.join('\n'));process.exitCode=1;}
}

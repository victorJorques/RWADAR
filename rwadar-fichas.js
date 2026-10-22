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
const { paginasAcademy } = require('./rwadar-academy');
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
  hoy = new Date(), manifiesto = MANIFIESTO_CATALOGO_V2,
} = {}) {
  const lote = validarLotePublicoV2(
    plataformas.map(p=>({...p,nombre:p.n,revision_id:p.revisionId,verificacion_local:p.verificacionLocal})),
    ofertas.map(o=>({...o,revision_id:o.revisionId,plataforma_slug:o.plataformaSlug,
      plataforma_nombre:o.plataformaNombre,verificada_el:o.verificadaEl,vigencia_dias:o.vigenciaDias,
      estado_revision:o.estadoRevision,fuentes_actuales:o.fuentesActuales,disponible_es:o.disponibleEs})),
    {hoy,manifiesto,permitirAmpliacion:true,permitirCaducado:true});
  assert(plataformas.every(p=>enlace(p.web)) && ofertas.every(o=>enlace(o.url)),
    'El catálogo contiene enlaces de proveedor no válidos');
  assert(Array.isArray(fuera) && fuera.length===permitidas.filter(n=>n.startsWith('fuera-del-radar/')).length &&
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
        ' <span>· consulta citada ' + esc(corta(f.consultadaEl)) + '</span>' : '') + '</li>').join('') + '</ul>';
}

function pagina({titulo,descripcion,ruta,contenido,revision,imagen='/og.png',organizacion,oferta}) {
  const tituloPestana = (titulo.length > 55 ? titulo.slice(0,54).trimEnd() + '…' : titulo) + ' · RWAdar';
  const descripcionMeta = descripcion.replace(/\s+/g,' ').slice(0,159);
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
    '<link rel="alternate" type="application/rss+xml" title="Novedades de RWAdar" href="/novedades.xml">\n' +
    '<link rel="stylesheet" href="/'+CSS+'"><link rel="stylesheet" href="/assets/idioma-20261022.css">\n<script type="application/ld+json">'+json(datos)+'</script>\n' +
    (oferta ? '<script src="/'+COMPARTIDO+'" defer></script>\n' : '') +
    '<script src="/assets/idioma-en-20261022.js" defer></script><script src="/assets/idioma-20261022.js" defer></script><script src="/assets/idioma-web-20261022.js" defer></script>\n'+
    (oferta ? '<script src="/'+JS+'" defer></script>\n' : '') +
    '</head><body><a class="saltar" href="#contenido">Saltar al contenido</a><header class="cabecera"><a class="marca" href="/" aria-label="RWAdar · Inicio">RWA<span>dar</span></a>' +
    '<nav aria-label="Principal"><a href="/#emisiones" data-volver="ofertas">Ofertas</a><a href="/#tool">Plataformas</a><a href="/academy/">Academy</a><a href="/cambios">Noticias de RWAdar</a></nav></header>' +
    '<div data-selector-idioma></div><main id="contenido"'+(organizacion ? ' data-ficha-consulta' : ' data-idioma-documental="es"')+(oferta ? ' data-oferta="'+esc(json(oferta))+'"' : '')+'><p class="migas"><a href="/">Inicio</a> / <span'+ORIGINAL+'>'+esc(titulo)+'</span></p>' +
    '<h1'+(organizacion ? ORIGINAL : '')+'>'+esc(titulo)+'</h1>'+contenido+'</main><footer><p>RWAdar es una referencia editorial gratuita. La inclusión no es recomendación ni garantía. Las operaciones se realizan con el proveedor.</p>' +
    '<nav aria-label="Información"><a href="/metodologia">Cómo verificamos</a><a href="/transparencia-comercial">Independencia editorial</a><a href="/privacidad">Privacidad y aviso legal</a>' +
    '<a href="/novedades.xml">RSS</a><a href="mailto:RWAdar@protonmail.com">Comunicar un error</a></nav></footer></body></html>\n';
}

const riesgos = '<section aria-labelledby="riesgos"><h2 id="riesgos">Antes de ir a la fuente</h2><ul class="riesgos">' +
  '<li><strong>Pérdida:</strong> el capital y el rendimiento pueden perderse.</li>' +
  '<li><strong>Salida:</strong> la reventa depende de compradores; tokenizar no garantiza liquidez.</li>' +
  '<li><strong>Custodia:</strong> comprueba quién mantiene el activo y qué derecho recibes.</li>' +
  '<li><strong>Supervisión:</strong> un registro de la plataforma no protege cada producto ni confirma tu elegibilidad.</li></ul></section>';

function paginaOferta(o,catalogo,imagen) {
  const d = o.documentacion || {};
  const refs = (d.referencias || []).filter(r=>enlace(r.fuente) && fecha(r.fechaConsulta));
  const p = catalogo.plataformas.find(p=>p.slug===o.plataformaSlug);
  const fichaImagen = imagen ? '<figure><img src="/'+esc(imagen.salida)+'" alt="'+esc(imagen.alt)+'" width="960" height="660"><figcaption>Ilustración editorial generada con IA. No es una fotografía del activo real.</figcaption></figure>' : '';
  const contenido = '<p class="intro"'+ORIGINAL+'>'+esc(d.descripcion || o.resumen)+'</p>'+fichaImagen+
    '<p class="estado" role="status" data-campo="estado">Referencia documental: confirma las condiciones actuales en las fuentes.</p>'+
    '<section aria-labelledby="que"><h2 id="que">Qué es y quién lo ofrece</h2><dl><div><dt>Proveedor</dt><dd'+ORIGINAL+'>'+esc(o.plataformaNombre)+'</dd></div>' +
    '<div><dt>Tipo de activo</dt><dd'+ORIGINAL+'>'+esc(o.categoria)+'</dd></div><div><dt>Supervisión de la plataforma</dt><dd'+ORIGINAL+'>'+esc(p?.verificacionLocal?.licenciaRegistro?.detalle || 'Esta plataforma aún no tiene una evaluación propia en el radar. Su oferta no equivale a una evaluación del proveedor.')+'</dd></div></dl>'+
    (p ? '<p><a href="'+rutaPlataforma(p)+'">Consultar ficha de plataforma</a></p>' : '')+'</section>' +
    '<section aria-labelledby="acceso"><h2 id="acceso">Acceso y condiciones</h2><p>La admisión depende de tu residencia, categoría de inversor y de las condiciones del proveedor.</p><dl>'+
    '<div><dt>Mínimo en euros</dt><dd data-campo="minimo"'+ORIGINAL+'>Consulta la fuente; no se presupone un mínimo vigente.</dd></div>'+
    '<div><dt>Acceso desde España</dt><dd data-campo="accesoEspana"'+ORIGINAL+'>Sin comprobar desde España.</dd></div>'+
    '<div><dt>Costes</dt><dd data-campo="costes"'+ORIGINAL+'>Confirma los costes actuales con el proveedor.</dd></div></dl></section>'+
    '<section aria-labelledby="salida"><h2 id="salida">Cómo se recupera el dinero</h2><p data-campo="salida"'+ORIGINAL+'>La salida no se da por garantizada; consulta la documentación del proveedor.</p></section>'+riesgos+
    '<section aria-labelledby="fuentes"><h2 id="fuentes">Fuentes y fechas</h2><p>Revisión editorial del lote: <time datetime="'+esc(o.verificadaEl)+'">'+esc(corta(o.verificadaEl))+'</time>. Esta fecha no renueva las cifras ni la apertura de la oferta.</p>'+
    '<p>Las consultas citadas se muestran por separado. La fecha del dato puede ser anterior y una fuente puede no publicar una fecha propia.</p>'+
    (refs.length ? '<details><summary>Ver las referencias documentales y sus fechas ('+refs.length+')</summary><ul class="referencias"'+ORIGINAL+'>'+refs.map(r=>'<li><strong>'+esc(r.etiqueta)+'</strong><br>Dato fechado: '+esc(corta(r.fechaDato))+' · Consulta: '+esc(corta(r.fechaConsulta))+'<br><a href="'+esc(enlace(r.fuente))+'" target="_blank" rel="noopener noreferrer">Abrir fuente ↗</a><p>'+esc(r.alcance || '')+'</p></li>').join('')+'</ul></details>' : '')+
    fuentes([...(d.fuentes || []),...(o.fuentesActuales || [])])+'</section>'+
    '<p class="aviso">Consulta documentación, admisión, riesgos y condiciones actuales antes de decidir. RWAdar no tramita inversiones ni recibe tu dinero.</p>'+
    '<p><a class="boton" href="'+esc(enlace(o.url))+'" target="_blank" rel="noopener noreferrer">Consultar fuente</a></p>'+
    '<p><a href="mailto:RWAdar@protonmail.com?subject='+encodeURIComponent('Corrección de ficha: '+o.titulo)+'">¿Ves un error en esta ficha?</a></p>';
  return pagina({titulo:o.titulo,descripcion:o.resumen,ruta:rutaOferta(o),contenido,revision:o.verificadaEl,
    imagen:imagen ? '/'+imagen.salida : '/og.png',organizacion:{nombre:o.plataformaNombre,url:o.url},oferta:o});
}

function paginaPlataforma(p,catalogo) {
  const v = p.verificacionLocal || {};
  const asociadas = catalogo.ofertas.filter(o=>o.plataformaSlug===p.slug);
  const contenido = '<p class="intro"'+ORIGINAL+'>'+esc(p.nota)+'</p><section><h2>Quién es</h2><p'+ORIGINAL+'>'+esc(p.tipo)+' · '+esc(p.cat)+' · '+esc(p.reg)+'</p><p'+ORIGINAL+'>'+esc(v.estadoOperativo?.detalle || '')+'</p></section>'+
    '<section><h2>Cómo funciona y qué se ha comprobado</h2><p'+ORIGINAL+'>'+esc(p.aval)+'</p><h3>Supervisión y alcance</h3><p'+ORIGINAL+'>'+esc(v.licenciaRegistro?.detalle || 'Consulta el alcance del registro en la fuente.')+'</p>'+fuentes(v.licenciaRegistro?.fuentes || [])+'</section>'+
    '<section><h2>Quién puede acceder</h2><p'+ORIGINAL+'>'+esc(v.acceso?.detalle || p.acceso)+'</p><p>La presencia en el radar no confirma acceso desde España ni aprobación de un producto concreto.</p>'+fuentes(v.acceso?.fuentes || [])+'</section>'+riesgos+
    '<section><h2>Fuentes y fechas</h2><p>Revisión editorial: '+esc(corta(v.verificadoEl || p.ver))+'. Cada fuente mantiene su propia fecha de consulta.</p>'+fuentes([...(v.estadoOperativo?.fuentes || []),...(v.alertasCriticas || []).flatMap(a=>a.fuentes || [])])+'</section>'+
    '<section><h2>Referencias documentales de esta plataforma</h2>'+(asociadas.length ? '<ul'+ORIGINAL+'>'+asociadas.map(o=>'<li><a href="'+rutaOferta(o)+'">'+esc(o.titulo)+'</a></li>').join('')+'</ul>' : '<p>El catálogo no contiene una oferta individual documentada de esta plataforma. No implica que el proveedor carezca de productos.</p>')+'</section>'+
    '<p><a class="boton" href="'+esc(enlace(p.web))+'" target="_blank" rel="noopener noreferrer">Consultar fuente</a></p>';
  return pagina({titulo:p.n,descripcion:p.nota,ruta:rutaPlataforma(p),contenido,revision:v.verificadoEl || p.ver,organizacion:{nombre:p.n,url:p.web}});
}

function novedades(catalogo) {
  const noticias = JSON.parse(fs.readFileSync(path.join(RAIZ,'rwadar-noticias/noticias.json'),'utf8')).noticias;
  const ruta = path.join(RAIZ,'rwadar-app/data/verificaciones',catalogo.revision+'-v2','cambios-'+catalogo.revision+'.json');
  const cambio = fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta,'utf8')) : null;
  const entradas = noticias.map(n=>({id:'noticia-'+n.id,fecha:n.fecha,titulo:n.titulo,texto:n.texto,url:ORIGEN+'/cambios#noticia-'+n.id}));
  if (cambio) entradas.push({id:'catalogo-'+catalogo.revision,fecha:catalogo.revision,titulo:'Revisión documental del catálogo del '+corta(catalogo.revision),
    texto:'Revisadas las fuentes de '+catalogo.plataformas.length+' plataformas y '+catalogo.ofertas.length+' referencias. La revisión no acredita apertura ni renueva cifras que no se hayan leído en su fuente.',url:ORIGEN+'/cambios#catalogo-'+catalogo.revision});
  return entradas.sort((a,b)=>b.fecha.localeCompare(a.fecha) || a.id.localeCompare(b.id));
}

function construirSalidas({catalogo, paginasPermitidas = permitidas} = {}) {
  const c = catalogo ? validarCatalogoSnapshot(catalogo) : leerCatalogo();
  validarRutasCatalogo(c,paginasPermitidas);
  const fotos = new Map(cargarActivosEditoriales(RAIZ).fichas.map(f=>[f.slug,f]));
  const salidas = new Map();
  for (const o of c.ofertas) salidas.set('ofertas/'+o.slug+'.html',paginaOferta(o,c,fotos.get(o.slug)));
  for (const p of c.plataformas) salidas.set('plataformas/'+p.slug+'.html',paginaPlataforma(p,c));
  for (const f of c.fuera) {
    const ruta='/fuera-del-radar/'+slug(f.n);
    salidas.set(ruta.slice(1)+'.html',pagina({titulo:f.n+' · Fuera del radar',descripcion:f.why,ruta,revision:c.revision,
      contenido:'<p class="estado">'+esc(f.badge)+'</p><section><h2>Motivo publicado</h2><p>'+esc(f.why)+'</p></section><section><h2>Fuentes citables</h2>'+fuentes(f.fuentes || [])+'</section><p>Un descarte requiere fuente. Si conoces un cambio, comunícalo para revisarlo.</p>'}));
  }
  salidas.set('metodologia.html',pagina({titulo:'Cómo verificamos',descripcion:'Qué comprueba RWAdar, qué significa cada fecha y cómo se ordena un catálogo editorial independiente.',ruta:'/metodologia',revision:c.revision,
    contenido:'<p class="intro">RWAdar informa con la fuente al lado. Aparecer es gratuito y el veredicto editorial no se vende.</p><section><h2>Qué comprobamos</h2><p>Separar plataforma, entidad jurídica, registro y producto evita atribuir a una oferta permisos que pertenecen a otra entidad. Las fuentes del emisor describen sus condiciones; el registro del regulador delimita la supervisión.</p></section>'+
    '<section><h2>Tres fechas distintas</h2><dl><div><dt>Revisión editorial</dt><dd>Cuándo se revisó o preparó el lote, incluidos los intentos que no permitieron comprobar datos.</dd></div><div><dt>Consulta de la fuente</dt><dd>Cuándo se leyó la referencia concreta. No cambia la fecha original del dato.</dd></div><div><dt>Fecha del dato</dt><dd>La indicada expresamente por el proveedor. Si falta, se declara que no fue publicada.</dd></div></dl></section>'+
    '<section><h2>Estado y vigencia</h2><p>«No verificable» significa que no se confirmó el dato o la apertura, por ejemplo por un bloqueo de lectura. «Fuentes en conflicto» indica discrepancias. No son pruebas de fraude. Las cifras que vencen se ocultan; la ficha y el catálogo completo siguen disponibles con aviso.</p></section>'+
    '<section><h2>Cómo ordenamos</h2><p>El orden editorial no depende de pagos ni utiliza la rentabilidad como criterio por defecto. Se distinguen referencias principales, reventa y anuncios con apertura sin confirmar. Los filtros describen datos, no perfiles personales ni recomendaciones.</p></section>'+
    '<section><h2>Cómo corregimos</h2><p>Escribe a <a href="mailto:RWAdar@protonmail.com">RWAdar@protonmail.com</a> indicando la ficha y una fuente primaria. Conservamos los informes con fecha y mostramos las novedades de cada revisión.</p></section>'}));
  const entradas=novedades(c);
  salidas.set('cambios.html',pagina({titulo:'Novedades y revisiones',descripcion:'Historial editorial de RWAdar, con fechas y una fuente RSS sin registro.',ruta:'/cambios',revision:c.revision,
    contenido:'<p class="intro">Cambios documentales y novedades del proyecto. <a href="/novedades.xml">Suscribirse por RSS</a> permite seguirlos sin cuenta ni correo.</p><ol class="novedades">'+entradas.map(e=>'<li id="'+esc(e.id)+'"><article><time datetime="'+e.fecha+'">'+corta(e.fecha)+'</time><h2>'+esc(e.titulo)+'</h2><p>'+esc(e.texto)+'</p></article></li>').join('')+'</ol>'}));
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
  construirSalidas,comprobar,generar,rutaOferta,rutaPlataforma,esc,enlace};
if (require.main===module) {
  const pendientes=process.argv.includes('--comprobar') ? comprobar() : generar();
  console.log((process.argv.includes('--comprobar') ? 'Diferencias: ' : 'Archivos actualizados: ')+pendientes.length);
  if (process.argv.includes('--comprobar') && pendientes.length) {console.error(pendientes.join('\n'));process.exitCode=1;}
}

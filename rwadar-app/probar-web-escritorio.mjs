// Pruebas funcionales del barrido de calidad de escritorio (QA 04/11/2026).
// Viven aparte para que probar-web.mjs no pase su presupuesto de probar-orden.mjs;
// probar-web.mjs las llama con sus propios datos (código de la web, páginas y prueba()).
import vm from 'node:vm';
import { createRequire } from 'node:module';

export function probarEscritorio({ js, html, lee, prueba, ARCHIVOS_PUBLICABLES, privacidad, transparenciaComercial, paraEmpresas }) {
  // Orden de los scripts de Inicio: idioma-previo va en <head> y sin defer (tiene
  // que marcar el inglés antes de pintar); el resto, en orden clásico con defer.
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi)];
  const rutaIdiomaPrevio = '/assets/idioma-previo-20261104.js';
  // El candado de las lecciones (08/11/2026) va en <head>, sin defer, detrás de
  // idioma-previo: marca html.candado-comprobando antes de pintar (revisión del
  // 08/11/2026) y pregunta por la sesión en DOMContentLoaded, con la pasarela ya cargada.
  const rutaCandado = '/assets/academy-candado-20261108.js';
  // La tokenización en el mundo (10/11/2026): su motor y su sección, antes del snapshot.
  prueba('idioma previo y candado en head sin defer; analítica, acceso, mapa, tokenización, snapshot, helper, idioma y comportamiento cargan en orden clásico con defer',
    JSON.stringify(scripts.map(s=>s[1])) === JSON.stringify([rutaIdiomaPrevio, rutaCandado, '/assets/analitica-20260927.js', '/assets/acceso-privado.js',
      '/assets/mapa-buscar-util-20261027.js','/assets/mapa-buscar-20261027.js','/assets/tokenizacion-modelo-20261110.js','/assets/tokenizacion-20261110.js','/assets/catalogo-publico-20261022.js',
      '/assets/ficha-editorial-20261022.js','/assets/idioma-en-20261022.js','/assets/idioma-20261022.js','/assets/idioma-web-20261022.js','/assets/cartera-modelo-20261028.js','/assets/cartera-cuenta-20261028.js','/assets/cartera-cuenta-ui-20261028.js','/assets/rwadar-20260820.js']) &&
    html.indexOf(rutaIdiomaPrevio) < html.indexOf('</head>') && html.indexOf(rutaCandado) < html.indexOf('</head>') &&
    scripts.slice(0, 2).every(script => !/\b(?:defer|async)\b/.test(script[0])) &&
    scripts.slice(2).every(script => /\bdefer\b/.test(script[0]) && !/\basync\b/.test(script[0])));
  // QA escritorio 04/11/2026, n.º 1: la franja de cifras anima solo los números
  // y conserva el símbolo (antes «€0» acababa en «NaN» y «0 €» en «0»).
  {
    const inicio = js.indexOf('function partesCifra('), fin = js.indexOf('(function cabeceraElevada');
    const codigoContador = js.slice(inicio, fin);
    for (const [idioma, textos] of [['es', ['0 €', '26', '6', '4', '—']], ['en', ['€0', '26', '6', '4', '—']]]) {
      const nodos = textos.map(t => ({ textContent: t, vistos: [] }));
      const cola = []; let reloj = 0;
      const contexto = vm.createContext({
        menos: false, performance: { now: () => reloj },
        requestAnimationFrame: fn => cola.push(fn),
        window: { IntersectionObserver: true },
        IntersectionObserver: function (fn) { this.observe = () => fn([{ isIntersecting: true }]); this.disconnect = () => {}; },
        document: { querySelector: s => s === '.marcador' ? { querySelectorAll: () => nodos } : null },
      });
      contexto.window = contexto;
      vm.runInContext(codigoContador, contexto);
      for (let i = 0; cola.length && i < 400; i++) {
        reloj += 16; cola.shift()(reloj);
        nodos.forEach(n => n.vistos.push(n.textContent));
      }
      const todos = nodos.flatMap(n => n.vistos.concat(n.textContent));
      prueba(`el contador de la franja (${idioma}) termina en el mismo texto, conserva el € y nunca escribe NaN`,
        cola.length === 0 && nodos.every((n, i) => n.textContent === textos[i]) && !todos.some(t => /NaN/.test(t)) &&
        nodos[0].vistos.every(t => t === textos[0]) && nodos[1].vistos.some(t => t !== '26') && nodos[1].vistos.every(t => /^\d+$/.test(t)));
    }
  }
  // QA escritorio 04/11/2026, n.º 7: en escritorio y en inglés la página nace
  // oculta hasta traducirse, con tope de 1,5 s desde la navegación. En el móvil
  // (no saltaba) no se oculta, y lang lo pone idioma-web, no idioma-previo.
  {
    const codigoPrevio = lee('assets/idioma-previo-20261104.js');
    const ensayo = (guardado, pasos, { movil = false, ahora = 200 } = {}) => {
      const clases = new Set(), eventos = {}, relojes = [], consultas = [];
      const raiz = { lang: 'es', classList: { add: c => clases.add(c), remove: c => clases.delete(c) } };
      const contexto = vm.createContext({
        localStorage: { getItem: k => { if (guardado instanceof Error) throw guardado; return k === 'rwadar.idioma' ? guardado : null; } },
        document: { documentElement: raiz, addEventListener: (t, fn) => { eventos[t] = fn; } },
        matchMedia: q => { consultas.push(q); return { matches: movil && /max-width:767px/.test(q) }; },
        performance: { now: () => ahora },
        setTimeout: (fn, ms) => relojes.push([fn, ms]),
      });
      contexto.globalThis = contexto;
      vm.runInContext(codigoPrevio, contexto);
      const inicial = { lang: raiz.lang, oculta: clases.has('idioma-previo') };
      pasos({ eventos, relojes, listo: () => contexto.RWAdarIdiomaListo && contexto.RWAdarIdiomaListo() });
      return { inicial, final: { lang: raiz.lang, oculta: clases.has('idioma-previo') }, relojes, consultas };
    };
    const traducida = ensayo('en', ({ eventos, listo }) => { listo(); eventos.DOMContentLoaded(); });
    const soloTraducida = ensayo('en', ({ listo }) => listo());
    const tope = ensayo('en', ({ relojes }) => relojes.forEach(([fn]) => fn()));
    const movil = ensayo('en', () => {}, { movil: true });
    const tarde = ensayo('en', () => {}, { ahora: 1600 });
    const castellano = ensayo('es', () => {});
    const sinAlmacen = ensayo(new Error('bloqueado'), () => {});
    prueba('idioma-previo oculta en escritorio y en inglés solo hasta traducir y cargar, con tope de 1,5 s desde la navegación; en el móvil, no',
      traducida.inicial.oculta && !traducida.final.oculta && traducida.inicial.lang === 'es' && traducida.final.lang === 'es' &&
      soloTraducida.final.oculta && tope.relojes.length === 1 && tope.relojes[0][1] === 1300 && !tope.final.oculta && tope.final.lang === 'es' &&
      !movil.inicial.oculta && movil.relojes.length === 0 && movil.consultas.length === 1 &&
      !tarde.inicial.oculta && tarde.relojes.length === 0 &&
      castellano.inicial.lang === 'es' && !castellano.inicial.oculta && castellano.relojes.length === 0 &&
      !sinAlmacen.inicial.oculta && sinAlmacen.inicial.lang === 'es');
    prueba('idioma-web avisa a idioma-previo cuando termina la primera traducción',
      /cargarIdioma\(almacenamiento\)\.then\(\(\)=>\{actualizar\(\);[^}]*RWAdarIdiomaListo\(\)/.test(lee('assets/idioma-web-20261022.js')) &&
      /html\.idioma-previo body\{visibility:hidden\}/.test(lee('assets/idioma-20261022.css')) &&
      ARCHIVOS_PUBLICABLES.includes('assets/idioma-previo-20261104.js'));
  }
  // QA escritorio 04/11/2026, n.º 8: si la lista de plataformas cambia de alto
  // (filtro), la barra se recalcula; si se filtra desde la barra con la lista
  // desplazada, la vista vuelve al principio de los resultados, bajo la barra.
  {
    const inicio = js.indexOf('(function barraFiltros(){'), fin = js.indexOf('(function cabeceraElevada');
    const ensayo = ({ foco, caja }) => {
      const observados = new Map(), desplazamientos = [], clases = new Set();
      const hdr = { offsetHeight: 69 }, campo = {}, lista = { getBoundingClientRect: () => caja };
      const barra = { offsetHeight: 76, contains: n => n === campo, style: { setProperty() {} },
        classList: { toggle: (c, si) => (si ? clases.add(c) : clases.delete(c)), remove: c => clases.delete(c) } };
      const contexto = vm.createContext({
        document: { documentElement: { style: { setProperty() {} } }, activeElement: foco ? campo : {},
          querySelector: s => (s === '.hdr' ? hdr : s === '.barra' ? barra : null),
          getElementById: id => (id === 'plataformasResultados' ? lista : null) },
        getComputedStyle: () => ({ position: 'sticky' }), requestAnimationFrame: fn => fn(),
        ResizeObserver: function (fn) { this.observe = n => observados.set(n, fn); },
        addEventListener() {}, scrollY: 5000, innerHeight: 800, scrollTo: o => desplazamientos.push(o),
      });
      contexto.window = contexto;
      vm.runInContext(js.slice(inicio, fin), contexto);
      if (observados.has(lista)) observados.get(lista)();
      return { desplazamientos, empujada: clases.has('barra-empujada'), observaLista: observados.has(lista) };
    };
    const filtrada = ensayo({ foco: true, caja: { top: -2500, bottom: -1737 } });
    const sinFoco = ensayo({ foco: false, caja: { top: -2500, bottom: -1737 } });
    const debajo = ensayo({ foco: true, caja: { top: 300, bottom: 900 } });
    prueba('la barra de filtros sigue el alto de la lista y, al filtrar desde ella, la vista vuelve al principio de los resultados',
      inicio > 0 && fin > inicio && filtrada.observaLista && filtrada.desplazamientos.length === 1 &&
      filtrada.desplazamientos[0].top === 5000 - 2500 - 69 - 76 &&
      sinFoco.desplazamientos.length === 0 && sinFoco.empujada && debajo.desplazamientos.length === 0 && !debajo.empujada);
  }
  // QA escritorio 04/11/2026, n.º 12: en el panel y en la ficha de la web, una
  // API o una respuesta JSON se cita sin enlace, con su fecha.
  {
    const inicio = js.indexOf('const consultaTecnica='), fin = js.indexOf('/* Las fechas salen del dato');
    const fechaESCodigo = js.match(/const fechaES=[^\n]+/)[0];
    const contexto = vm.createContext({ URL, document: { createElement: tag => ({ tag, hijos: [], appendChild(n) { this.hijos.push(n); } }),
      createTextNode: t => ({ tag: '#text', textContent: t }) } });
    vm.runInContext(fechaESCodigo + '\n' + js.slice(inicio, fin) + '\nthis.desenlazar=desenlazarConsultasTecnicas;this.tecnica=consultaTecnica;', contexto);
    const enlaces = [['https://shares.aktionariat.com/api/brokerbotsettings?ticker=DAKS', 'Ver fuente · shares.aktionariat.com ↗'],
      ['https://www.regafi.fr/api/explore/v2.1/catalog/datasets/x/records', 'REGAFI (ACPR) · Spiko · 2026-11-02 ↗'],
      ['https://shares.aktionariat.com/invest', 'Fuente 1 · shares.aktionariat.com ↗'],
      // Si detrás ya pone «consultada el …», la fecha no se repite.
      ['https://shares.aktionariat.com/api/secondarymarkets/getTrades', 'shares.aktionariat.com ↗', ' · consultada el 01/11/2026']
    ].map(([href, texto, detras]) => ({ href, textContent: texto, nextSibling: detras ? { textContent: detras } : null,
        getAttribute: () => href, replaceWith(n) { this.sustituto = n; } }));
    contexto.desenlazar({ querySelectorAll: () => enlaces }, () => '2026-11-03');
    const leido = n => n.tag === '#text' ? n.textContent : n.textContent || n.hijos.map(leido).join('');
    prueba('la web cita sin enlace las consultas técnicas (API o JSON), con su fecha, y deja el resto de fuentes',
      leido(enlaces[0].sustituto) === 'shares.aktionariat.com · Consulta técnica · 03/11/2026' &&
      leido(enlaces[1].sustituto) === 'REGAFI (ACPR) · Spiko · Consulta técnica · 02/11/2026' &&
      enlaces[0].sustituto.className === 'consulta-tecnica' && !enlaces[2].sustituto &&
      leido(enlaces[3].sustituto) === 'shares.aktionariat.com · Consulta técnica' &&
      contexto.tecnica('https://example.com/datos.json') && !contexto.tecnica('https://api-docs.example.com/guia') &&
      /desenlazarConsultasTecnicas\(d,/.test(js) && /desenlazarConsultasTecnicas\(cuerpo,/.test(js));
  }
  // QA escritorio 04/11/2026, n.º 27: sin sesión, el botón de la cabecera dice «Entrar».
  {
    const inicio = js.indexOf(' function pinta(){'), fin = js.indexOf(' function pintaMovil(){');
    const boton = { textContent: '', innerHTML: '', disabled: true, atributos: {}, setAttribute(k, v) { this.atributos[k] = v; } };
    new Function('b', `const SERVICIOS_USUARIO_DISPONIBLES=true,document=undefined;let identidadConfirmada=false,ses=null,perfil=null;
      const $=id=>id==='btnCuenta'?b:null,esc=s=>s,pintaMovil=()=>{};${js.slice(inicio, fin)}\npinta();`)(boton);
    prueba('sin sesión, el botón de la cabecera dice «Entrar» y está activo',
      inicio > 0 && fin > inicio && boton.textContent === 'Entrar' && boton.disabled === false && /^Entrar /.test(boton.atributos['aria-label']));
  }
  // Remates 04/11/2026: Inicio sin salto al cargar (CLS). idioma-previo marca en
  // <head>, con la misma consulta que Movil, html.escritorio-relato (768 px o más,
  // salvo móvil apaisado) o html.movil-relato (móvil sin ancla, hasta que el JS
  // elige pestaña). El panel va el primero en <main> y se ve aunque nazca con [hidden].
  {
    const codigoPrevio = lee('assets/idioma-previo-20261104.js'), css = lee('assets/rwadar-20260820.css');
    const movil = (js.match(/const media=window\.matchMedia\('([^']+)'\)/) || [])[1] || '';
    const cumple = (q, { ancho, alto, tactil }) => q.split(/\s*,\s*/).some(parte => parte.split(/\s+and\s+/).every(c => {
      const [, k, v] = c.match(/^\(([a-z-]+):\s*([a-z0-9]+)\)$/) || [], n = parseInt(v, 10);
      return k === 'min-width' ? ancho >= n : k === 'max-width' ? ancho <= n : k === 'max-height' ? alto <= n :
        k === 'hover' ? (v === 'none') === tactil : k === 'pointer' ? (v === 'coarse') === tactil : false;
    }));
    const ensayo = ({ ruta = '/', hash = '', ancho, alto = 900, tactil = false, almacen = null }) => {
      const clases = new Set(), eventos = {};
      const contexto = vm.createContext({
        location: { pathname: ruta, hash },
        matchMedia: q => ({ matches: cumple(q, { ancho, alto, tactil }) }),
        localStorage: { getItem: () => { if (almacen) throw almacen; return null; } },
        document: { documentElement: { lang: 'es', classList: { add: c => clases.add(c), remove: c => clases.delete(c), contains: c => clases.has(c) } },
          addEventListener: (t, fn) => { (eventos[t] = eventos[t] || []).push(fn); } },
        setTimeout: () => {},
      });
      contexto.globalThis = contexto;
      vm.runInContext(codigoPrevio, contexto);
      const inicial = [...clases].join(' ');
      (eventos.DOMContentLoaded || []).forEach(fn => fn());
      return { inicial, cargada: [...clases].join(' ') };
    };
    const tableta = ensayo({ ancho: 820, alto: 1180 }), escritorio = ensayo({ ancho: 1366, alto: 860, almacen: new Error('bloqueado') });
    const telefono = ensayo({ ancho: 390, alto: 844, tactil: true }), apaisado = ensayo({ ancho: 900, alto: 400, tactil: true });
    const otras = [ensayo({ ancho: 390, alto: 844, tactil: true, hash: '#emisiones' }), ensayo({ ruta: '/academy/', ancho: 1366 }),
      ensayo({ ruta: '/academy/', ancho: 390, tactil: true })];
    prueba('Inicio nace como historia desde <head>: desde 768 px salvo móvil apaisado y, en el móvil sin ancla, hasta que carga el JS; solo en «/»',
      movil.includes('max-height: 540px') && codigoPrevio.includes(`'${movil}'`) &&
      /const ancho=window\.matchMedia\('\(min-width: 768px\)'\)/.test(js) && !/insertBefore\(panelInicio/.test(js) &&
      tableta.inicial === 'escritorio-relato' && tableta.cargada === 'escritorio-relato' && escritorio.inicial === 'escritorio-relato' &&
      telefono.inicial === 'movil-relato' && telefono.cargada === '' && apaisado.inicial === 'movil-relato' &&
      otras.every(r => r.inicial === ''));
    const principal = html.slice(html.indexOf('<main id="top">'), html.indexOf('</main>'));
    const portada = (html.match(/<section class="rel-nuevas" id="relNuevas"[^>]*>/) || [''])[0];
    const letra = (css.match(/font-family:'Geist';font-style:normal;[^}]*src:url\(([^)]+)\)/) || [])[1];
    prueba('el panel de Inicio va el primero en <main>, se ve con [hidden] (también en el móvil antes del JS) y «Recién añadidas» no aparece de golpe',
      /^<main id="top">\s*(?:<!--[\s\S]*?-->\s*)?<section class="movil-panel" id="movilPanelInicio"/.test(principal) &&
      principal.indexOf('id="movilPanelInicio"') < principal.indexOf('id="movilPanelRadar"') &&
      /@media \(min-width:768px\)\{\s*\.escritorio-relato #movilPanelInicio\{display:block\}/.test(css) &&
      /\.movil-relato:not\(\.movil-ui\) #movilPanelInicio\{display:block!important\}/.test(css) &&
      /\.movil-relato:not\(\.movil-ui\) :is\(#movilPanelRadar,body>\[data-selector-idioma\]\)\{display:none\}/.test(css) &&
      portada && !/\shidden\b/.test(portada));
    prueba('la letra principal se precarga en <head> con el mismo archivo que usa el CSS',
      Boolean(letra) && html.slice(0, html.indexOf('</head>')).includes(`<link rel="preload" href="${letra}" as="font" type="font/woff2" crossorigin>`));
  }
  // QA escritorio 04/11/2026, n.º 29: privacidad, transparencia comercial y para
  // empresas se comparten con og:* y twitter:card. /para-empresas sigue sin indexar
  // (decisión pendiente de Víctor).
  prueba('privacidad, transparencia comercial y para empresas llevan og:* y twitter:card; para empresas sigue en noindex',
    [privacidad, transparenciaComercial, paraEmpresas].every(pagina => {
      const cabeza = pagina.slice(0, pagina.indexOf('</head>'));
      const canonica = (cabeza.match(/<link rel="canonical" href="([^"]+)">/) || [])[1];
      return canonica && cabeza.includes('<meta property="og:url" content="' + canonica + '">') &&
        ['og:title', 'og:description', 'og:type', 'og:site_name'].every(m => cabeza.includes('<meta property="' + m + '" content="')) &&
        cabeza.includes('<meta property="og:image" content="https://rwadar.pages.dev/og.png">') &&
        cabeza.includes('<meta name="twitter:card" content="summary_large_image">') &&
        cabeza.includes('<script src="/assets/idioma-previo-20261104.js"></script>');
    }) && /<meta name="robots" content="noindex,nofollow">/.test(paraEmpresas));
}

// Necesita el contexto de la web ya cargado (pestanaCatalogo) con EMI y P.
export function probarTarjetaYComparador({ c, prueba }) {
  // Tarjeta sencilla (decisión de Víctor del 05/11/2026), en cada oferta del
  // catálogo: Mínimo y España en corto (la misma función que «Lo esencial»),
  // un único botón «›» con nombre accesible y nada anidado; y lo que sale de
  // la tarjeta (puntos fuertes, vigencia, Salida, avisos ordinarios y fechas)
  // sigue en la ficha. Se compara el HTML que ve la persona, no el código.
  const revisar = () => EMI.map(o => {
    const r = resumenEditorialOferta(o), d = datosCortosOferta(o, r), e = estadoVigenciaLocal(o), t = tarjetaOfertaLocal(o);
    abrirDetalleOfertaLocal(o.slug);
    const f = document.getElementById('escaparateDetalleLocal').innerHTML, esencial = (f.match(/escaparate-esencial[\s\S]*?<\/section>/) || [''])[0];
    const doc = documentacionOfertaLocal(o), bloqueo = avisoBloqueoOferta(o);
    const fechas = [o.verificadaEl, doc && doc.revisadaEl, r.fechas.fechaDato].filter(Boolean).map(fechaES);
    const ordinarios = avisosOfertaLocal(o).filter(x => !AVISO_GENERAL_OFERTA.test(x) && !(bloqueo && textoLocal(bloqueo.texto) === x)).map(escHtml);
    const puntos = puntosFuertesOferta(o).map(x => escHtml(textoLocal(x.texto)));
    const fuera = [...puntos, ...ordinarios, ...fechas];
    return { datos: [...t.matchAll(/<dt>([^<]+)<\/dt><dd>([^<]+)<\/dd>/g)].map(m => m[1] + '=' + m[2]).join('|'),
      esperado: 'Mínimo=' + escHtml(d.minimo) + '|España=' + escHtml(d.espanaCorta), corta: d.espanaCorta, larga: d.espana,
      botones: (t.match(/<button\b/g) || []).length, anidado: /<button\b[^>]*>(?:(?!<\/button>)[\s\S])*<button\b/.test(t),
      ver: t.includes('<button class="escaparate-detalle-boton" type="button" data-oferta-detalle="' + escHtml(o.slug) + '" aria-label="Ver ficha de ' +
        escHtml(o.titulo) + ' en ' + escHtml(o.plataformaNombre) + '"><span aria-hidden="true">›</span></button>'),
      sobra: [...fuera, '<time', '<dt>Salida</dt>', 'cifras válidas', 'Liquidez no confirmada', 'Apertura no confirmada', 'en la ficha'].filter(x => t.includes(x)),
      ficha: [['Mínimo', d.minimo], ['España', d.espana], ['Salida', d.salida]].every(([k, v]) => esencial.includes('<dt>' + k + '</dt>') && esencial.includes(escHtml(v))) &&
        fuera.every(x => f.includes(x)) && f.includes(escHtml(e.clase === 'caducado' ? e.texto : e.texto.replace(/^cifras /, ''))) };
  });
  const filas = vm.runInContext('(' + revisar + ')()', c);
  prueba('cada tarjeta: Mínimo y España en corto (misma función que la ficha) y un único «›» con nombre accesible, sin botones anidados',
    filas.length > 0 && filas.every(f => f.datos === f.esperado && f.botones === 2 && !f.anidado && f.ver &&
      ({ 'Sí': 'Sí, según la fuente', 'No': 'No, según la fuente', 'Sin confirmar': 'Sin confirmar' })[f.corta] === f.larga));
  prueba('lo que sale de la tarjeta (puntos fuertes, vigencia, Salida, avisos ordinarios y fechas) sigue en la ficha de cada oferta',
    filas.every(f => f.sobra.length === 0 && f.ficha));
  // Los textos nuevos de la tarjeta tienen su inglés (diccionario compartido con la app).
  const { ingles } = createRequire(import.meta.url)('../rwadar-movil/lib/idioma.js');
  prueba('inglés: «Sí», la línea de encima de la lista y el nombre del botón se traducen',
    ingles('Sí') === 'Yes' && ingles('Ver ficha de Spiko Euro en Spiko') === 'View details for Spiko Euro from Spiko' &&
    ingles('No es una recomendación de inversión · RWAdar no recibe dinero de las inversiones.') ===
      'This is not an investment recommendation · RWAdar receives no money from investments.');
  // El comparador enseña el mínimo real (o «Sin documentar»), no el nivel de entrada.
  const minimosComparador=vm.runInContext(`P.map(p=>[p.slug,p.ticket,minimoPlataformaTexto(p),EMI.some(o=>o.plataformaSlug===p.slug)])`,c);
  vm.runInContext(`compare=[P.findIndex(p=>p.slug==='spiko'),P.findIndex(p=>p.slug==='addx')];openCompare()`,c);
  const tablaComparador=c.document.getElementById('modalBody').innerHTML;
  // Los proveedores de infraestructura (ticket «No aplica») siguen diciendo «No aplica».
  prueba('el comparador muestra el mínimo documentado, «Sin documentar» o «No aplica», nunca «Bajo», «Medio» o «Alto»',
    minimosComparador.some(([,ticket])=>ticket==='No aplica')&&
    minimosComparador.every(([,ticket,texto,ofertas])=>ticket==='No aplica'?texto==='No aplica':
      texto!==ticket&&!/^(?:Bajo|Medio|Alto|No aplica)$/.test(texto)&&(ofertas||texto==='Sin documentar'))&&
    /€/.test(minimosComparador.find(m=>m[0]==='spiko')[2])&&
    /<th>Mínimo<\/th><td>[^<]*€[^<]*<\/td><td>Sin documentar<\/td>/.test(tablaComparador));
}

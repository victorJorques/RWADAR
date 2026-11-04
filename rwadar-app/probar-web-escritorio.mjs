// Pruebas funcionales del barrido de calidad de escritorio (QA 04/11/2026).
// Viven aparte para que probar-web.mjs no pase su presupuesto de probar-orden.mjs;
// probar-web.mjs las llama con sus propios datos (código de la web, páginas y prueba()).
import vm from 'node:vm';

export function probarEscritorio({ js, html, lee, prueba, ARCHIVOS_PUBLICABLES, privacidad, transparenciaComercial, paraEmpresas }) {
  // Orden de los scripts de Inicio: idioma-previo va en <head> y sin defer (tiene
  // que marcar el inglés antes de pintar); el resto, en orden clásico con defer.
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi)];
  const rutaIdiomaPrevio = '/assets/idioma-previo-20261104.js';
  prueba('idioma previo en head; acceso, analítica, mapa, snapshot, helper, idioma y comportamiento cargan en orden clásico con defer',
    JSON.stringify(scripts.map(s=>s[1])) === JSON.stringify([rutaIdiomaPrevio, '/assets/analitica-20260927.js', '/assets/acceso-privado.js',
      '/assets/mapa-buscar-util-20261027.js','/assets/mapa-buscar-20261027.js','/assets/catalogo-publico-20261022.js',
      '/assets/ficha-editorial-20261022.js','/assets/idioma-en-20261022.js','/assets/idioma-20261022.js','/assets/idioma-web-20261022.js','/assets/cartera-modelo-20261028.js','/assets/cartera-cuenta-20261028.js','/assets/cartera-cuenta-ui-20261028.js','/assets/rwadar-20260820.js']) &&
    html.indexOf(rutaIdiomaPrevio) < html.indexOf('</head>') && !/\b(?:defer|async)\b/.test(scripts[0][0]) &&
    scripts.slice(1).every(script => /\bdefer\b/.test(script[0]) && !/\basync\b/.test(script[0])));
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
  // QA escritorio 04/11/2026, n.º 18: la tarjeta de escritorio dice España y
  // Salida igual que «Lo esencial» de la ficha (una sola función).
  const mismaFila=vm.runInContext(`(()=>{const antes=window.matchMedia;window.matchMedia=()=>({matches:false});
    try{return EMI.map(o=>{const d=datosCortosOferta(o,resumenEditorialOferta(o)),t=tarjetaOfertaLocal(o);
      return [t.includes('<dt>España</dt><dd>'+escHtml(d.espana)+'</dd>'),t.includes('<dt>Salida</dt><dd>'+escHtml(d.salida)+'</dd>'),vistaMovilOfertas()];});}
    finally{window.matchMedia=antes;}})()`,c);
  prueba('en escritorio la tarjeta y la ficha escriben España y Salida con la misma función',
    mismaFila.length>0&&mismaFila.every(([espana,salida,movil])=>espana&&salida&&movil===false));
  // El comparador enseña el mínimo real (o «Sin documentar»), no el nivel de entrada.
  const minimosComparador=vm.runInContext(`P.map(p=>[p.slug,p.ticket,minimoPlataformaTexto(p),EMI.some(o=>o.plataformaSlug===p.slug)])`,c);
  vm.runInContext(`compare=[P.findIndex(p=>p.slug==='spiko'),P.findIndex(p=>p.slug==='addx')];openCompare()`,c);
  const tablaComparador=c.document.getElementById('modalBody').innerHTML;
  prueba('el comparador muestra el mínimo documentado o «Sin documentar», nunca «Bajo», «Medio» o «Alto»',
    minimosComparador.every(([,ticket,texto,ofertas])=>texto!==ticket&&!/^(?:Bajo|Medio|Alto|No aplica)$/.test(texto)&&(ofertas||texto==='Sin documentar'))&&
    /€/.test(minimosComparador.find(m=>m[0]==='spiko')[2])&&
    /<th>Mínimo<\/th><td>[^<]*€[^<]*<\/td><td>Sin documentar<\/td>/.test(tablaComparador));
}

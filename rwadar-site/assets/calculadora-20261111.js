'use strict';
/* =====================================================================
   RWAdar · «Calcula tus números» en Inicio (11/11/2026)
   ---------------------------------------------------------------------
   El encargo: «hazle su propia sección en Inicio para que la gente
   calcule sus números, y que pongan ellos los números, no que sea sí o sí
   los 300.000». Pinta [data-calculadora="inicio"]:
   - campos de escritura libre (lo que inviertes, la rentabilidad y los
     años; el modo «Lo cobro» / «Lo reinvierto»; y, en «Afinar», las
     comisiones, los impuestos, el valor del activo y el precio de cada
     participación). Los valores de partida son un ejemplo editable;
   - el resultado arriba; el lector de pantalla lo oye en #ciAnuncio
     (role="status"), una vez, 700 ms después de dejar de escribir;
   - un minigráfico de barras por año (SVG propio) con su tabla para
     lectores de pantalla, y la cuenta paso a paso;
   - «Usa la rentabilidad de una oferta»: las ofertas del catálogo con
     rentabilidad publicada y vigente, leídas del catálogo que la web ya
     carga (rwadar-20260820.js llama a RWAdarCalculadoraInicio.ofertas en
     pintarEmisiones). Sin ofertas, ese bloque no sale.
   Todas las cuentas y los textos con cifras, en rwadar-movil/lib/calculadora.js
   (copiado en calculadora-modelo-20261111.js): aquí solo se dibuja. Los
   textos fijos van en el diccionario (idioma-en); los que llevan cifras se
   escriben ya en el idioma elegido (translate="no"). Sin innerHTML y sin
   estilos en línea (la CSP no lleva 'unsafe-inline').
   ===================================================================== */
(() => {
  const modelo = globalThis.RWAdarCalculadoraModelo;
  const SVG = 'http://www.w3.org/2000/svg';
  const CAMPOS = { inversion: 'ciInversion', rentabilidad: 'ciRentabilidad', anios: 'ciAnios', comisionAnual: 'ciComisionAnual',
    comisionEntrada: 'ciComisionEntrada', impuestos: 'ciImpuestos', valorActivo: 'ciValorActivo', precioParticipacion: 'ciPrecioParticipacion' };
  let raiz = null, entradas = {}, ofertas = [], ofertaElegida = null, crudo = null, huellaOfertas = '', tocado = false;
  let reloj = null, relojAnuncio = null, suscrito = false, ultimo = null, anchoGrafico = 0;
  // El idioma con el que están escritos los campos (el HTML viene en español):
  // al cambiar de idioma, se leen con este y se reescriben con el nuevo.
  let idiomaCampos = 'es';

  const idioma = () => (globalThis.RWAdarIdioma?.obtenerIdioma?.() === 'en' ? 'en' : 'es');
  // Los textos fijos, del diccionario compartido con la app (idioma-en).
  const t = es => (idioma() === 'en' && globalThis.RWAdarIdioma?.traducir ? globalThis.RWAdarIdioma.traducir(es, 'en') : es);
  const $ = id => document.getElementById(id);
  function el(etiqueta, clase, texto) {
    const n = document.createElement(etiqueta);
    if (clase) n.className = clase;
    if (texto !== undefined) { n.textContent = texto; n.setAttribute('translate', 'no'); }
    return n;
  }
  function svg(etiqueta, atributos = {}) {
    const n = document.createElementNS(SVG, etiqueta);
    for (const [k, v] of Object.entries(atributos)) n.setAttribute(k, String(v));
    return n;
  }
  const leer = () => {
    const valores = { modo: raiz.querySelector('input[name="ciModo"]:checked')?.value || 'cobrar' };
    for (const [campo, input] of Object.entries(entradas)) valores[campo] = input.value;
    return valores;
  };

  /* ---- Errores por campo: texto visible, aria-invalid y el resultado sin cifras ---- */
  function marcarErrores(errores) {
    for (const [campo, input] of Object.entries(entradas)) {
      const caja = $(CAMPOS[campo] + 'Error'), error = errores[campo];
      if (error) { input.setAttribute('aria-invalid', 'true'); caja.textContent = modelo.mensajeError(error, idioma()); caja.setAttribute('translate', 'no'); caja.hidden = false; }
      else { input.removeAttribute('aria-invalid'); caja.textContent = ''; caja.hidden = true; }
      input.closest('.ci-campo')?.classList.toggle('ci-campo--error', !!error);
    }
    // Un error dentro de «Afinar» abre el desplegable: que no quede escondido.
    if (Object.keys(errores).some(c => ['comisionAnual', 'comisionEntrada', 'impuestos', 'valorActivo', 'precioParticipacion'].includes(c))) $('ciAfinar').open = true;
  }

  /* ---- El minigráfico: una barra por año (lo que pones abajo, lo ganado arriba) ---- */
  function grafico(res) {
    const lienzo = $('ciGrafLienzo');
    const ancho = Math.max(240, Math.round(lienzo.clientWidth || 320));
    anchoGrafico = ancho;
    const g = modelo.barras(res, { ancho, alto: 150, margenArriba: 22, margenAbajo: 24 });
    const s = svg('svg', { class: 'ci-svg', width: ancho, height: g.alto, viewBox: `0 0 ${ancho} ${g.alto}`, focusable: 'false' });
    s.append(svg('line', { class: 'ci-suelo', x1: 0, x2: ancho, y1: g.suelo + 0.5, y2: g.suelo + 0.5 }));
    for (const b of g.barras) {
      const grupo = svg('g', { class: 'ci-barra' + (b.gana ? ' ci-barra--gana' : '') });
      if (b.altoPuesto > 0) grupo.append(svg('rect', { class: 'ci-barra-puesto', x: b.x.toFixed(2), y: b.yPuesto.toFixed(2), width: b.ancho.toFixed(2), height: b.altoPuesto.toFixed(2), rx: Math.min(3, b.ancho / 3) }));
      if (b.altoGanancia > 0.5) grupo.append(svg('rect', { class: 'ci-barra-ganado', x: b.x.toFixed(2), y: b.yGanancia.toFixed(2), width: b.ancho.toFixed(2), height: b.altoGanancia.toFixed(2), rx: Math.min(3, b.ancho / 3) }));
      s.append(grupo);
    }
    // La línea de puntos de lo que pones, con su rótulo (como el valor de partida de «Mercado»).
    s.append(svg('line', { class: 'ci-base', x1: 0, x2: ancho, y1: g.yBase.toFixed(2), y2: g.yBase.toFixed(2) }));
    const ultima = g.barras[g.barras.length - 1];
    const valor = svg('text', { class: 'ci-eje ci-eje-valor', x: Math.min(ancho, ultima.x + ultima.ancho).toFixed(2), y: Math.max(12, ultima.y - 6).toFixed(2), 'text-anchor': 'end' });
    valor.textContent = modelo.eurosAprox(ultima.valor, idioma());
    s.append(valor);
    for (const n of g.etiquetas) {
      const b = g.barras[n - 1];
      const anio = svg('text', { class: 'ci-eje', x: (b.x + b.ancho / 2).toFixed(2), y: g.alto - 6, 'text-anchor': n === 1 && g.barras.length > 6 ? 'start' : n === g.barras.length && g.barras.length > 6 ? 'end' : 'middle' });
      if (n === 1 && g.barras.length > 6) anio.setAttribute('x', b.x.toFixed(2));
      if (n === g.barras.length && g.barras.length > 6) anio.setAttribute('x', (b.x + b.ancho).toFixed(2));
      anio.textContent = (idioma() === 'en' ? 'Year ' : 'Año ') + n;
      s.append(anio);
    }
    lienzo.replaceChildren(s);
    // La misma información, en una tabla para lectores de pantalla.
    const tabla = $('ciTabla');
    const cab = el('tr');
    const cobrar = res.modo === 'cobrar';
    for (const c of [t('Año'), t('Lo que tendrías, neto'), cobrar ? t('Cobras ese año, neto') : t('Capital antes de impuestos')]) {
      const th = el('th', '', c); th.setAttribute('scope', 'col'); cab.append(th);
    }
    const cuerpo = el('tbody');
    for (const f of res.tabla) {
      const fila = el('tr'), th = el('th', '', String(f.anio));
      th.setAttribute('scope', 'row');
      fila.append(th, el('td', '', modelo.euros(f.valorNeto, idioma())), el('td', '', modelo.euros(cobrar ? f.cobrado : f.capitalFin, idioma())));
      cuerpo.append(fila);
    }
    const thead = el('thead'); thead.append(cab);
    tabla.replaceChildren(el('caption', '', t('Lo que tendrías cada año, neto')), thead, cuerpo);
  }

  function pasos(res) {
    const lista = $('ciPasos');
    lista.replaceChildren(...modelo.pasos(res, idioma()).map(p => {
      const li = el('li');
      li.append(el('span', 'ci-paso-op', p.op), el('span', 'ci-paso-res', p.res));
      return li;
    }));
    const nota = $('ciNotaImpuestos');
    nota.textContent = modelo.notaImpuestos(res.modo, idioma()) + ' ' + modelo.IMPUESTOS_NOTA[idioma()];
    nota.setAttribute('translate', 'no');
  }

  function pintar() {
    if (!raiz) return;
    clearTimeout(reloj); reloj = null;
    const valido = modelo.validarEntradas(leer(), { idioma: idiomaCampos });
    marcarErrores(valido.errores);
    const res = valido.ok ? modelo.calcular(valido) : null;
    const r = modelo.resumen(res, idioma());
    const estado = $('ciEstado');
    estado.className = 'ci-estado ci-estado--' + r.signo;
    const titular = $('ciTitular'), detalle = $('ciDetalle');
    titular.textContent = r.titular; titular.setAttribute('translate', 'no');
    detalle.textContent = r.detalle; detalle.setAttribute('translate', 'no'); detalle.hidden = !r.detalle;
    $('ciGraf').hidden = !res; $('ciCuenta').hidden = !res;
    const ahora = $('ciAfinarAhora');
    if (valido.ok) { ahora.textContent = modelo.resumenAfinar(valido.valores, idioma()); ahora.setAttribute('translate', 'no'); }
    if (res) { grafico(res); pasos(res); }
    ultimo = res;
    // La oferta elegida sigue marcada solo mientras su rentabilidad siga escrita.
    if (ofertaElegida) {
      const of = ofertas.find(o => o.slug === ofertaElegida);
      if (!of || !valido.ok || Math.abs(valido.valores.rentabilidad - of.rentabilidad) > 1e-9) ofertaElegida = null;
    }
    marcarOfertas();
    raiz.dataset.calculadoraEstado = res ? 'ok' : 'error';
    // El lector de pantalla oye el resultado una vez, cuando se deja de
    // escribir (como la app): #ciEstado se repinta a cada tecla y no se anuncia.
    clearTimeout(relojAnuncio);
    relojAnuncio = setTimeout(() => {
      const a = $('ciAnuncio'), frase = [r.titular, r.detalle].filter(Boolean).join('. ');
      // Lo mismo otra vez no se repite (al salir de un campo, al pulsar el mismo chip…).
      if (a && a.textContent !== frase) { a.textContent = frase; a.setAttribute('translate', 'no'); }
    }, 700);
  }
  const programar = () => { clearTimeout(reloj); reloj = setTimeout(pintar, 180); };

  /* ---- Importes rápidos: solo rellenan el campo ---- */
  function pintarRapidos() {
    const caja = $('ciRapidos');
    caja.replaceChildren(...modelo.IMPORTES_RAPIDOS.map(v => {
      const b = el('button', 'ci-rapido', modelo.euros(v, idioma()));
      b.type = 'button'; b.dataset.importe = String(v);
      b.setAttribute('aria-label', (idioma() === 'en' ? 'Enter ' : 'Poner ') + modelo.euros(v, idioma()));
      return b;
    }));
  }

  /* ---- «Usa la rentabilidad de una oferta» ---- */
  function pintarOfertas() {
    const caja = $('ciOfertas');
    if (!caja) return;
    caja.hidden = !ofertas.length;
    const lista = $('ciOfertasLista');
    lista.replaceChildren(...ofertas.map(of => {
      const li = el('li', 'ci-oferta');
      const b = el('button', 'ci-chip');
      b.type = 'button'; b.dataset.ofertaRentabilidad = of.slug; b.setAttribute('translate', 'no');
      b.setAttribute('aria-pressed', String(ofertaElegida === of.slug));
      const pct = modelo.porcentaje(of.rentabilidad, idioma(), 2), fecha = modelo.fechaCorta(of.fecha, idioma());
      b.append(el('span', 'ci-chip-nom', of.nombre), el('span', 'ci-chip-pct', pct), el('span', 'ci-chip-fecha', fecha));
      if (of.enDolares) b.append(el('span', 'ci-chip-usd', t('en dólares')));
      b.setAttribute('aria-label', modelo.etiquetaOferta(of, idioma()));
      const a = el('a', 'ci-ficha', t('Ficha'));
      a.href = of.ficha; a.dataset.perfilOferta = of.slug;
      a.setAttribute('aria-label', (idioma() === 'en' ? 'Details for ' : 'Ficha de ') + of.nombre);
      const flecha = el('span', 'ci-ficha-flecha', '→'); flecha.setAttribute('aria-hidden', 'true');
      a.append(flecha);
      li.append(b, a);
      return li;
    }));
    marcarOfertas();
  }
  function marcarOfertas() {
    const nota = $('ciOfertaNota');
    for (const b of raiz.querySelectorAll('[data-oferta-rentabilidad]')) b.setAttribute('aria-pressed', String(b.dataset.ofertaRentabilidad === ofertaElegida));
    if (!nota) return;
    const of = ofertas.find(o => o.slug === ofertaElegida);
    if (of) { nota.textContent = modelo.notaOferta(of, idioma()); nota.setAttribute('translate', 'no'); }
    else { nota.removeAttribute('translate'); nota.textContent = t('Solo salen las ofertas que publican una rentabilidad con fecha. Al pulsar una, se rellena la rentabilidad; puedes cambiarla.'); }
  }
  /* Lo llama rwadar-20260820.js cada vez que pinta el catálogo. */
  function recibirOfertas(lista, sinCifras) {
    crudo = { lista, sinCifras };
    if (!raiz) return;
    const nuevas = modelo.ofertasConRentabilidad(lista, { ahora: new Date(), catalogoVigente: !sinCifras });
    const huella = nuevas.map(o => o.slug + o.texto + o.fecha).join('|') + idioma();
    if (huella === huellaOfertas) return;
    huellaOfertas = huella; ofertas = nuevas;
    if (ofertaElegida && !ofertas.some(o => o.slug === ofertaElegida)) ofertaElegida = null;
    pintarOfertas();
  }

  /* En el móvil, los chips quedan por debajo del resultado: al pulsar uno,
     se sube hasta el resultado si no se ve entero (bajo la cabecera). */
  function verResultado() {
    if (!matchMedia('(max-width: 767px)').matches) return;
    // Se ha pulsado un chip: ya no se escribe (el resultado deja de ir pegado arriba).
    raiz.classList.remove('ci-editando');
    const caja = $('ciResultado'), b = caja.getBoundingClientRect();
    const tope = parseFloat(getComputedStyle(caja).scrollMarginTop) || 0;
    if (b.top >= tope - 1 && b.bottom <= innerHeight) return;
    caja.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  /* ---- Al cambiar de idioma: los campos con su formato y todo repintado ---- */
  function cambiarIdioma() {
    const antes = idiomaCampos;
    idiomaCampos = idioma();
    for (const [campo, input] of Object.entries(entradas)) {
      // Se lee con el idioma de antes: «1,5» en español es 1,5; «1,500» en inglés, 1.500.
      const l = modelo.LIMITES[campo], leido = modelo.leerNumero(input.value, { miles: l.unidad === 'euros', idioma: antes });
      if (input.value.trim() && leido.ok) input.value = modelo.valorCampo(leido.valor, idioma(), campo);
    }
    huellaOfertas = ''; pintarRapidos();
    if (crudo) recibirOfertas(crudo.lista, crudo.sinCifras); else pintarOfertas();
    pintar();
  }

  function suscribirIdioma() {
    if (suscrito || !raiz || !globalThis.RWAdarIdioma?.suscribirIdioma) return;
    suscrito = true;
    globalThis.RWAdarIdioma.suscribirIdioma(cambiarIdioma);
    if (idioma() === 'en') cambiarIdioma();
  }

  function iniciar() {
    raiz = document.querySelector('[data-calculadora="inicio"]');
    if (!raiz || !modelo) return;
    for (const [campo, id] of Object.entries(CAMPOS)) entradas[campo] = $(id);
    if (Object.values(entradas).some(x => !x)) { raiz = null; return; }
    pintarRapidos();
    raiz.addEventListener('input', e => {
      if (!e.target.matches('.ci-input')) return;
      if (!tocado) { tocado = true; $('ciEjemplo').hidden = true; }
      programar();
    });
    // Al salir del campo, la cifra con su formato («1000» → «1.000»).
    raiz.addEventListener('change', e => {
      if (e.target.matches('input[name="ciModo"]')) { if (!tocado) { tocado = true; $('ciEjemplo').hidden = true; } pintar(); return; }
      if (!e.target.matches('.ci-input')) return;
      const campo = e.target.name, l = modelo.LIMITES[campo], leido = modelo.leerNumero(e.target.value, { miles: l?.unidad === 'euros', idioma: idiomaCampos });
      if (l && e.target.value.trim() && leido.ok && leido.valor >= l.min && leido.valor <= l.max) e.target.value = modelo.valorCampo(leido.valor, idioma(), campo);
      pintar();
    });
    raiz.addEventListener('click', e => {
      const rapido = e.target.closest('[data-importe]');
      if (rapido) {
        entradas.inversion.value = modelo.valorCampo(Number(rapido.dataset.importe), idioma(), 'inversion');
        if (!tocado) { tocado = true; $('ciEjemplo').hidden = true; }
        pintar(); return;
      }
      const chip = e.target.closest('[data-oferta-rentabilidad]');
      if (chip) {
        const of = ofertas.find(o => o.slug === chip.dataset.ofertaRentabilidad);
        if (!of) return;
        entradas.rentabilidad.value = modelo.valorCampo(of.rentabilidad, idioma(), 'rentabilidad');
        ofertaElegida = of.slug;
        if (!tocado) { tocado = true; $('ciEjemplo').hidden = true; }
        pintar();
        verResultado();
      }
    });
    // En el móvil, mientras se escribe, el resultado se queda arriba (bajo la
    // cabecera): el teclado no lo tapa.
    raiz.addEventListener('focusin', e => { if (e.target.matches('.ci-input')) raiz.classList.add('ci-editando'); });
    raiz.addEventListener('focusout', e => {
      if (!e.target.matches('.ci-input')) return;
      setTimeout(() => { if (!raiz.contains(document.activeElement) || !document.activeElement.matches('.ci-input')) raiz.classList.remove('ci-editando'); }, 0);
    });
    window.addEventListener('resize', () => {
      const ancho = Math.round($('ciGrafLienzo').clientWidth || 0);
      if (ultimo && ancho && Math.abs(ancho - anchoGrafico) > 1) grafico(ultimo);
    }, { passive: true });
    // El idioma (idioma-20261022.js) se carga después de este script: la
    // suscripción espera a que esté (DOMContentLoaded llega tras los defer).
    suscribirIdioma();
    if (!suscrito) {
      document.addEventListener('DOMContentLoaded', suscribirIdioma, { once: true });
      window.addEventListener('load', suscribirIdioma, { once: true });
    }
    if (crudo) recibirOfertas(crudo.lista, crudo.sinCifras);
    pintar();
    // El gráfico se mide cuando Inicio ya tiene ancho (en el móvil es una pestaña).
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(() => { const a = Math.round($('ciGrafLienzo').clientWidth || 0); if (ultimo && a && Math.abs(a - anchoGrafico) > 1) grafico(ultimo); })
        .observe($('ciGrafLienzo'));
    }
  }

  /* «Calcula con tus números →» del explicador trae sus números (lo que pones,
     la rentabilidad, el valor del activo y el precio de cada trozo). */
  function poner(valores) {
    if (!raiz || !valores) return;
    for (const [campo, v] of Object.entries(valores)) {
      if (entradas[campo] && typeof v === 'number' && Number.isFinite(v)) entradas[campo].value = modelo.valorCampo(v, idiomaCampos, campo);
    }
    if (!tocado) { tocado = true; $('ciEjemplo').hidden = true; }
    pintar();
  }

  globalThis.RWAdarCalculadoraInicio = Object.freeze({ ofertas: recibirOfertas, poner });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  else iniciar();
})();

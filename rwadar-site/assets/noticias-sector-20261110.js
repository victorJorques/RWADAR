'use strict';
/* =====================================================================
   RWAdar · «Noticias del sector» en Inicio (10/11/2026)
   ---------------------------------------------------------------------
   Pinta la sección #noticias con /datos/noticias.json (estático, del
   propio despliegue; el navegador no habla con nadie más):
   - un carrusel horizontal con ajuste (scroll-snap) de tarjetas grandes:
     la ilustración propia de su categoría y ámbito, solo el titular encima
     (3 líneas como mucho, con «…» solo a la vista) y «Hoy» si es del día;
   - cada tarjeta es un botón cuyo nombre es el titular entero; con el
     teclado, Tab o las flechas recorren el carrusel; con ratón, ‹ y ›;
   - al pulsar, un <dialog> con la fecha, el titular, el resumen, «Por qué
     te importa», la fuente y «Leer en la fuente (sales de RWAdar) ↗»
     (rel="noopener noreferrer"). Escape o «×» lo cierran y el foco vuelve
     a la tarjeta.
   Los textos de cada noticia salen del archivo en el idioma elegido (los
   campos «en» en inglés) y no pasan por el diccionario; los de la interfaz
   los traduce idioma-web con lib/idioma-en.js. Todo se escribe con
   textContent y el DOM de SVG: ningún dato puede meter marcado.
   ===================================================================== */
(() => {
  const modelo = globalThis.RWAdarNoticiasModelo;
  const RUTA = '/datos/noticias.json', PLAZO_MS = 10000;
  const SVG = 'http://www.w3.org/2000/svg';
  let seccion, lista, estado, fecha, nota, mandos, dialogo, cuerpoDlg, datos = null, abierta = null, origenFoco = null, suscrito = false;

  const idioma = () => (globalThis.RWAdarIdioma?.obtenerIdioma?.() === 'en' ? 'en' : 'es');
  function el(etiqueta, clase, texto) {
    const n = document.createElement(etiqueta);
    if (clase) n.className = clase;
    if (texto !== undefined) n.textContent = texto;
    return n;
  }
  /* Un dato de la noticia: en su idioma y sin pasar por el diccionario. */
  function dato(etiqueta, clase, texto) {
    const n = el(etiqueta, clase, texto);
    n.setAttribute('translate', 'no');
    n.lang = idioma();
    return n;
  }
  const kebab = k => k.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
  function dibujo(noticia, { velo, clase, encuadre }) {
    const d = modelo.ilustracion(noticia, { velo, prefijo: velo ? 'ntt' : 'ntd' });
    const s = document.createElementNS(SVG, 'svg');
    s.setAttribute('viewBox', `0 0 ${d.ancho} ${d.alto}`);
    s.setAttribute('preserveAspectRatio', encuadre);
    s.setAttribute('class', clase);
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('focusable', 'false');
    const defs = document.createElementNS(SVG, 'defs');
    for (const g of d.defs) {
      const n = document.createElementNS(SVG, g.el);
      for (const [k, v] of Object.entries(g.a)) n.setAttribute(k, String(v));
      for (const p of g.stops) {
        const stop = document.createElementNS(SVG, 'stop');
        stop.setAttribute('offset', String(p.offset));
        stop.setAttribute('stop-color', p.color);
        stop.setAttribute('stop-opacity', String(p.opacity));
        n.append(stop);
      }
      defs.append(n);
    }
    s.append(defs);
    for (const f of d.formas) {
      const n = document.createElementNS(SVG, f.el);
      for (const [k, v] of Object.entries(f.a)) n.setAttribute(kebab(k), String(v));
      s.append(n);
    }
    return s;
  }

  async function cargar() {
    const abort = new AbortController(), reloj = setTimeout(() => abort.abort(), PLAZO_MS);
    try {
      const r = await fetch(RUTA, { credentials: 'omit', cache: 'no-cache', headers: { Accept: 'application/json' }, signal: abort.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return modelo.validarNoticias(await r.json());
    } catch { return null; } finally { clearTimeout(reloj); }
  }

  function tarjeta(n) {
    const t = modelo.textos(n, idioma());
    const li = el('li', 'nt-item');
    const b = el('button', 'nt-tarjeta');
    b.type = 'button';
    b.dataset.ntId = n.id;
    b.append(dibujo(n, { velo: true, clase: 'nt-arte', encuadre: 'xMidYMid slice' }));
    const tit = el('span', 'nt-titular');
    tit.append(dato('span', 'nt-titular-txt', t.titulo));
    b.append(tit);
    // El nombre del botón es el titular entero (el «…» es solo visual) y,
    // después, «Hoy»: la etiqueta va detrás en el DOM y arriba a la vista.
    if (n.seccion === 'hoy') b.append(el('span', 'nt-hoy', 'Hoy'));
    li.append(b);
    return li;
  }

  function pintarLista() {
    lista.replaceChildren(...datos.noticias.map(tarjeta));
    actualizarMandos();
  }
  function pintar() {
    if (!seccion) return;
    // idioma-web carga después (defer, en orden): se suscribe al pintar.
    if (!suscrito && globalThis.RWAdarIdioma?.suscribirIdioma) { suscrito = true; globalThis.RWAdarIdioma.suscribirIdioma(pintar); }
    seccion.dataset.noticiasEstado = datos ? 'listo' : 'sin-datos';
    if (!datos) {
      lista.hidden = true; nota.hidden = true; fecha.hidden = true; mandos.hidden = true;
      estado.hidden = false;
      estado.textContent = 'Ahora no podemos mostrar las noticias. Vuelve a intentarlo más tarde.';
      return;
    }
    estado.hidden = true;
    estado.textContent = '';
    fecha.replaceChildren(el('span', '', 'Actualizadas el'), ' ');
    const cuando = el('time', 'nt-fecha', modelo.fechaBreve(datos.actualizadoEl, idioma()));
    cuando.dateTime = datos.actualizadoEl;
    cuando.setAttribute('translate', 'no');
    fecha.append(cuando);
    fecha.hidden = false;
    nota.hidden = false;
    lista.hidden = false;
    // Repintar no mueve el carrusel ni pierde el foco de la tarjeta.
    const x = lista.scrollLeft, enfocada = document.activeElement?.closest?.('.nt-tarjeta')?.dataset.ntId;
    pintarLista();
    lista.scrollLeft = x;
    if (enfocada) lista.querySelector(`[data-nt-id="${CSS.escape(enfocada)}"]`)?.focus({ preventScroll: true });
    if (abierta && dialogo.open) pintarDetalle(abierta);
  }

  /* ---- Carrusel: flechas del teclado y botones ‹ › ---- */
  function tarjetas() { return [...lista.querySelectorAll('.nt-tarjeta')]; }
  function actualizarMandos() {
    const max = lista.scrollWidth - lista.clientWidth;
    mandos.hidden = !(max > 4);
    const [antes, despues] = mandos.querySelectorAll('[data-nt-paso]');
    antes.disabled = lista.scrollLeft <= 4;
    despues.disabled = lista.scrollLeft >= max - 4;
  }
  function paso(direccion) {
    const primera = lista.querySelector('.nt-item');
    const ancho = primera ? primera.getBoundingClientRect().width + 12 : lista.clientWidth;
    const cuantas = Math.max(1, Math.floor(lista.clientWidth / ancho));
    lista.scrollBy({ left: direccion * cuantas * ancho, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  function teclas(ev) {
    const todas = tarjetas(), i = todas.indexOf(document.activeElement);
    if (i < 0) return;
    const destino = ev.key === 'ArrowRight' ? i + 1 : ev.key === 'ArrowLeft' ? i - 1 : ev.key === 'Home' ? 0 : ev.key === 'End' ? todas.length - 1 : null;
    if (destino === null) return;
    ev.preventDefault();
    const t = todas[Math.max(0, Math.min(todas.length - 1, destino))];
    t.focus({ preventScroll: true });
    t.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  /* ---- Detalle ---- */
  function pintarDetalle(n) {
    const lengua = idioma(), t = modelo.textos(n, lengua);
    const marco = el('article', 'nt-dlg-art');
    const arte = el('div', 'nt-dlg-arte');
    arte.append(dibujo(n, { velo: false, clase: 'nt-arte', encuadre: 'xMidYMin slice' }));
    const meta = el('p', 'nt-dlg-meta');
    const cuando = dato('time', '', modelo.fechaCorta(n.fecha, lengua));
    cuando.dateTime = n.fecha;
    meta.append(cuando, ' · ', dato('span', '', modelo.etiquetaCategoria(n.categoria, lengua)), ' · ', dato('span', '', modelo.etiquetaAmbito(n.ambito, lengua)));
    if (n.seccion === 'hoy') meta.append(' ', el('span', 'nt-hoy nt-hoy--dlg', 'Hoy'));
    const titulo = dato('h2', 'nt-dlg-tit', t.titulo);
    titulo.id = 'ntDlgTit';
    marco.append(arte, meta, titulo);
    if (t.tituloInformativo) marco.append(dato('p', 'nt-dlg-entradilla', t.tituloInformativo));
    marco.append(dato('p', 'nt-dlg-resumen', t.resumen));
    const importa = el('section', 'nt-dlg-bloque nt-dlg-importa');
    importa.append(el('h3', '', 'Por qué te importa'), dato('p', '', t.porQueImporta));
    const fuente = el('section', 'nt-dlg-bloque nt-dlg-fuente');
    // El nombre de la fuente va como lo escribe RWAdar, en castellano.
    const nombre = el('p', 'nt-dlg-fuente-nombre', n.fuente.nombre);
    nombre.lang = 'es'; nombre.setAttribute('translate', 'no');
    const consulta = el('p', 'nt-dlg-consulta');
    const dia = el('time', '', modelo.fechaCorta(n.consultadaEl, lengua));
    dia.dateTime = n.consultadaEl; dia.setAttribute('translate', 'no');
    consulta.append(el('span', '', 'Consultada el'), ' ', dia);
    fuente.append(el('h3', '', 'Fuente'), nombre, consulta);
    const ir = el('a', 'nt-dlg-ir');
    ir.href = n.fuente.url;
    ir.target = '_blank';
    ir.rel = 'noopener noreferrer';
    ir.append(el('span', '', 'Leer en la fuente (sales de RWAdar)'), ' ');
    const flecha = el('span', '', '↗'); flecha.setAttribute('aria-hidden', 'true');
    ir.append(flecha);
    const aviso = el('p', 'nt-dlg-aviso', 'Selección editorial de RWAdar con enlace a la fuente. No es una recomendación.');
    marco.append(importa, fuente, ir, aviso);
    cuerpoDlg.replaceChildren(marco);
  }
  function abrir(id, boton) {
    const n = datos?.noticias.find(x => x.id === id);
    if (!n) return;
    abierta = n;
    origenFoco = boton;
    pintarDetalle(n);
    cuerpoDlg.scrollTop = 0;
    if (!dialogo.open) {
      if (typeof dialogo.showModal === 'function') dialogo.showModal(); else dialogo.setAttribute('open', '');
    }
    document.documentElement.classList.add('nt-dialogo-abierto');
    dialogo.querySelector('[data-nt-cerrar]').focus({ preventScroll: true });
  }
  function cerrar() { if (dialogo.open) dialogo.close(); }
  function alCerrar() {
    abierta = null;
    document.documentElement.classList.remove('nt-dialogo-abierto');
    const destino = origenFoco && document.contains(origenFoco) ? origenFoco
      : lista.querySelector(`[data-nt-id="${CSS.escape(origenFoco?.dataset?.ntId || '')}"]`);
    origenFoco = null;
    destino?.focus({ preventScroll: true });
  }

  async function iniciar() {
    seccion = document.querySelector('[data-noticias]');
    lista = document.getElementById('ntLista');
    estado = document.getElementById('ntEstado');
    fecha = document.getElementById('ntFecha');
    nota = document.getElementById('ntNota');
    mandos = document.getElementById('ntMandos');
    dialogo = document.getElementById('ntDialogo');
    cuerpoDlg = document.getElementById('ntDlgCuerpo');
    if (!seccion || !lista || !estado || !fecha || !nota || !mandos || !dialogo || !cuerpoDlg || !modelo) return;
    lista.addEventListener('click', ev => {
      const b = ev.target.closest('.nt-tarjeta');
      if (b) abrir(b.dataset.ntId, b);
    });
    lista.addEventListener('keydown', teclas);
    lista.addEventListener('scroll', actualizarMandos, { passive: true });
    addEventListener('resize', () => { if (datos) actualizarMandos(); }, { passive: true });
    mandos.addEventListener('click', ev => {
      const b = ev.target.closest('[data-nt-paso]');
      if (b) paso(Number(b.dataset.ntPaso));
    });
    dialogo.addEventListener('click', ev => {
      // Pulsar fuera de la caja (en el fondo oscuro) también cierra.
      if (ev.target.closest('[data-nt-cerrar]') || ev.target === dialogo) cerrar();
    });
    dialogo.addEventListener('close', alCerrar);
    datos = await cargar();
    pintar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  else iniciar();
})();

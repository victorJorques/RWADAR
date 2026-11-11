'use strict';
/* =====================================================================
   RWAdar · «Noticias del sector» (10/11/2026; rediseño de Inicio, el mismo día)
   ---------------------------------------------------------------------
   Pinta la sección [data-noticias] con /datos/noticias-v2.json (estático,
   del propio despliegue; el navegador no habla con nadie más). Dos modos:
   - data-noticias="portada" (Inicio, bloque «Mercado y noticias» del
     11/11/2026): las 3 primeras, compactas, con una foto pequeña, la fuente,
     la fecha y el titular. Cada una es un enlace a su detalle en
     /mercado/#<id>. «Hoy» o «Ayer» según la fecha de quien mira.
   - data-noticias="lista" (/mercado/, «Noticias relacionadas», como en una
     app de bolsa; /noticias/ lleva ahí): las 8, cada una con la fuente y la
     fecha en pequeño, el titular grande, una línea de resumen y la foto
     (data-noticias-nivel="3": los titulares son h3). Al pulsar, un
     <dialog> con todo el detalle: «Por qué te importa», la fuente y «Leer
     en la fuente (sales de RWAdar) ↗» (rel="noopener noreferrer"). Escape o
     «×» lo cierran y el foco vuelve a la tarjeta. Un enlace /noticias/#<id>
     abre esa noticia (/noticias/#<id> lleva a /mercado/#<id>).
   Las fotos son ilustrativas, generadas con IA y servidas por RWAdar en
   /noticias-editoriales/<clave>.webp (la clave es el campo «imagen»). Si una
   no carga o la noticia no trae «imagen», queda el fondo oscuro y el titular
   sigue legible.
   Los textos de cada noticia salen del archivo en el idioma elegido (los
   campos «en» en inglés) y no pasan por el diccionario; los de la interfaz
   los traduce idioma-web con lib/idioma-en.js. Todo se escribe con
   textContent: ningún dato puede meter marcado.
   ===================================================================== */
(() => {
  const modelo = globalThis.RWAdarNoticiasModelo;
  const RUTA = '/datos/noticias-v2.json', PLAZO_MS = 10000, EN_PORTADA = 3;
  let seccion, modo, lista, estado, fecha, nota, dialogo, cuerpoDlg, datos = null, abierta = null, origenFoco = null, suscrito = false;

  const idioma = () => (globalThis.RWAdarIdioma?.obtenerIdioma?.() === 'en' ? 'en' : 'es');
  const quieto = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  // «Hoy» y «Ayer» se cuentan con el día local de quien mira.
  const hoy = () => modelo.fechaLocal(new Date());
  function el(etiqueta, clase, texto) {
    const n = document.createElement(etiqueta);
    if (clase) n.className = clase;
    if (texto !== undefined) n.textContent = texto;
    return n;
  }
  function etiqueta(n, clase) {
    const cual = modelo.etiquetaReciente(n, hoy());
    return cual ? el('span', `nt-hoy${cual === 'Ayer' ? ' nt-hoy--ayer' : ''}${clase ? ' ' + clase : ''}`, cual) : null;
  }
  /* Un dato de la noticia: en su idioma y sin pasar por el diccionario. */
  function dato(etiqueta, clase, texto) {
    const n = el(etiqueta, clase, texto);
    n.setAttribute('translate', 'no');
    n.lang = idioma();
    return n;
  }
  /* La foto: decorativa (el titular ya lo dice todo), perezosa y sin datos de
     quien mira para nadie más que RWAdar. Si falla, se quita y queda el fondo. */
  function foto(n, clase, { perezosa = true, ancho = 1200, alto = 800 } = {}) {
    const caja = el('span', clase);
    caja.setAttribute('aria-hidden', 'true');
    const ruta = modelo.rutaFoto(n);
    if (!ruta) { caja.classList.add('nt-foto--sin'); return caja; }
    const img = document.createElement('img');
    img.alt = '';
    img.width = ancho; img.height = alto;
    img.decoding = 'async';
    if (perezosa) img.loading = 'lazy';
    img.addEventListener('error', () => { img.remove(); caja.classList.add('nt-foto--sin'); }, { once: true });
    img.src = ruta;
    caja.append(img);
    return caja;
  }
  function meta(n, clase) {
    const lengua = idioma(), p = el('p', clase);
    const cuando = dato('time', '', modelo.fechaCorta(n.fecha, lengua));
    cuando.dateTime = n.fecha;
    p.append(cuando, ' · ', dato('span', '', modelo.etiquetaCategoria(n.categoria, lengua)), ' · ', dato('span', '', modelo.etiquetaAmbito(n.ambito, lengua)));
    return p;
  }
  /* Como en una app de bolsa: la fuente (lo que va antes de la primera coma
     de su nombre, tal como lo escribe RWAdar) y la fecha, en pequeño. */
  const fuenteCorta = n => String(n.fuente?.nombre || '').split(',')[0].trim();
  function metaFuente(n, clase) {
    const p = el('p', clase), cuando = dato('time', '', modelo.fechaCorta(n.fecha, idioma()));
    cuando.dateTime = n.fecha;
    const fuente = el('span', 'nt-fuente-corta', fuenteCorta(n));
    fuente.lang = 'es'; fuente.setAttribute('translate', 'no');
    p.append(fuente, ' · ', cuando);
    return p;
  }

  async function cargar() {
    const abort = new AbortController(), reloj = setTimeout(() => abort.abort(), PLAZO_MS);
    try {
      const r = await fetch(RUTA, { credentials: 'omit', cache: 'no-cache', headers: { Accept: 'application/json' }, signal: abort.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return modelo.validarNoticias(await r.json());
    } catch { return null; } finally { clearTimeout(reloj); }
  }

  /* Inicio: una fila compacta (foto pequeña, fuente y fecha, titular), enlace a
     su detalle en /mercado/. El nombre del enlace empieza por el titular. */
  function tarjetaPortada(n, i) {
    const t = modelo.textos(n, idioma());
    const li = el('li', 'nt-c-item');
    const a = el('a', 'nt-c');
    a.href = '/mercado/#' + encodeURIComponent(n.id);
    a.dataset.ntId = n.id;
    a.append(foto(n, 'nt-foto', { perezosa: i > 0, ancho: 144, alto: 144 }));
    const texto = el('span', 'nt-c-txt');
    const tit = dato('span', 'nt-c-tit', t.titulo);
    const m = metaFuente(n, 'nt-c-meta');
    const reciente = etiqueta(n);
    if (reciente) m.append(' ', reciente);
    texto.append(tit, m);
    a.append(texto);
    li.append(a);
    return li;
  }
  /* /mercado/: la fuente y la fecha, el titular, una línea de resumen y la
     foto; el titular es un botón que abre el detalle entero (toda la fila). */
  function tarjetaLista(n, i) {
    const t = modelo.textos(n, idioma());
    const li = el('li', 'nt-fila');
    li.id = n.id;
    const art = el('article', 'nt-art');
    art.setAttribute('aria-labelledby', 'nt-t-' + n.id);
    art.append(foto(n, 'nt-art-foto', { perezosa: i > 1 }));
    const texto = el('div', 'nt-art-txt');
    const m = metaFuente(n, 'nt-art-meta');
    const reciente = etiqueta(n, 'nt-hoy--dlg');
    if (reciente) m.append(' ', reciente);
    const h = el(seccion.dataset.noticiasNivel === '3' ? 'h3' : 'h2', 'nt-art-tit');
    h.id = 'nt-t-' + n.id;
    const b = el('button', 'nt-art-abrir');
    b.type = 'button';
    b.dataset.ntId = n.id;
    b.append(dato('span', '', t.titulo));
    h.append(b);
    texto.append(m, h, dato('p', 'nt-art-resumen', t.resumen));
    art.append(texto);
    li.append(art);
    return li;
  }

  function pintar() {
    if (!seccion) return;
    // idioma-web carga después (defer, en orden): se suscribe al pintar.
    if (!suscrito && globalThis.RWAdarIdioma?.suscribirIdioma) { suscrito = true; globalThis.RWAdarIdioma.suscribirIdioma(pintar); }
    seccion.dataset.noticiasEstado = datos ? 'listo' : 'sin-datos';
    if (!datos) {
      lista.hidden = true; nota.hidden = true; if (fecha) fecha.hidden = true;
      estado.hidden = false;
      estado.textContent = 'Ahora no podemos mostrar las noticias. Vuelve a intentarlo más tarde.';
      return;
    }
    estado.hidden = true;
    estado.textContent = '';
    if (fecha) {
      fecha.replaceChildren(el('span', '', 'Actualizadas el'), ' ');
      const cuando = el('time', 'nt-fecha', modelo.fechaBreve(datos.actualizadoEl, idioma()));
      cuando.dateTime = datos.actualizadoEl;
      cuando.setAttribute('translate', 'no');
      fecha.append(cuando);
      fecha.hidden = false;
    }
    nota.hidden = false;
    lista.hidden = false;
    const enfocada = document.activeElement?.closest?.('[data-nt-id]')?.dataset.ntId;
    lista.replaceChildren(...(modo === 'lista' ? datos.noticias.map(tarjetaLista) : datos.noticias.slice(0, EN_PORTADA).map(tarjetaPortada)));
    if (enfocada) lista.querySelector(`[data-nt-id="${CSS.escape(enfocada)}"]`)?.focus({ preventScroll: true });
    if (abierta && dialogo?.open) pintarDetalle(abierta);
  }

  /* ---- Detalle (/noticias/) ---- */
  function pintarDetalle(n) {
    const lengua = idioma(), t = modelo.textos(n, lengua);
    const marco = el('article', 'nt-dlg-art');
    const arte = foto(n, 'nt-dlg-arte', { perezosa: false });
    const m = meta(n, 'nt-dlg-meta');
    const reciente = etiqueta(n, 'nt-hoy--dlg');
    if (reciente) m.append(' ', reciente);
    const titulo = dato('h2', 'nt-dlg-tit', t.titulo);
    titulo.id = 'ntDlgTit';
    // Sin «tituloInformativo»: repetía el titular con otras palabras.
    marco.append(arte, m, titulo, dato('p', 'nt-dlg-resumen', t.resumen));
    const importa = el('section', 'nt-dlg-bloque nt-dlg-importa');
    importa.append(el('h3', '', 'Por qué te importa'), dato('p', '', t.porQueImporta));
    const fuente = el('section', 'nt-dlg-bloque nt-dlg-fuente');
    // El nombre de la fuente va como lo escribe RWAdar, en castellano; en
    // inglés se avisa, como hace FuenteOriginal en la app.
    const nombre = el('p', 'nt-dlg-fuente-nombre', n.fuente.nombre);
    nombre.lang = 'es'; nombre.setAttribute('translate', 'no');
    const enCastellano = lengua === 'en' ? el('p', 'nt-dlg-fuente-idioma', 'Texto original de la fuente (en castellano)') : null;
    const consulta = el('p', 'nt-dlg-consulta');
    const dia = el('time', '', modelo.fechaCorta(n.consultadaEl, lengua));
    dia.dateTime = n.consultadaEl; dia.setAttribute('translate', 'no');
    consulta.append(el('span', '', 'Consultada el'), ' ', dia);
    fuente.append(el('h3', '', 'Fuente'), ...(enCastellano ? [enCastellano] : []), nombre, consulta);
    const ir = el('a', 'nt-dlg-ir');
    ir.href = n.fuente.url;
    ir.target = '_blank';
    ir.rel = 'noopener noreferrer';
    // La flecha va dentro del mismo texto, pegada a la última palabra con un
    // espacio de no separación: si el texto pasa a dos líneas, baja con ella.
    const leer = el('span', 'nt-dlg-ir-txt', 'Leer en la fuente (sales de RWAdar)');
    const flecha = el('span', 'nt-dlg-ir-flecha', ' ↗'); flecha.setAttribute('aria-hidden', 'true');
    leer.append(flecha);
    ir.append(leer);
    const aviso = el('p', 'nt-dlg-aviso', 'Selección editorial de RWAdar con enlace a la fuente. No es una recomendación.');
    marco.append(importa, fuente, ir, aviso);
    cuerpoDlg.replaceChildren(marco);
  }
  function abrir(id, boton) {
    const n = datos?.noticias.find(x => x.id === id);
    if (!n || !dialogo) return;
    abierta = n;
    origenFoco = boton || lista.querySelector(`[data-nt-id="${CSS.escape(id)}"]`);
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
    // El enlace /noticias/#id ya se ha usado: no vuelve a abrir al recargar.
    if (/^#[a-z0-9-]+$/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
    const destino = origenFoco && document.contains(origenFoco) ? origenFoco : null;
    origenFoco = null;
    if (destino) {
      destino.scrollIntoView({ block: 'nearest', behavior: quieto() ? 'auto' : 'smooth' });
      destino.focus({ preventScroll: true });
    }
  }
  /* /noticias/#<id>: abre esa noticia (llegando desde Inicio). */
  function abrirDesdeAncla() {
    const m = /^#([a-z0-9-]+)$/.exec(location.hash || '');
    if (m && datos?.noticias.some(n => n.id === m[1])) abrir(m[1]);
  }

  async function iniciar() {
    seccion = document.querySelector('[data-noticias]');
    lista = document.getElementById('ntLista');
    estado = document.getElementById('ntEstado');
    fecha = document.getElementById('ntFecha');
    nota = document.getElementById('ntNota');
    dialogo = document.getElementById('ntDialogo');
    cuerpoDlg = document.getElementById('ntDlgCuerpo');
    if (!seccion || !lista || !estado || !nota || !modelo) return;
    modo = seccion.dataset.noticias === 'lista' ? 'lista' : 'portada';
    if (modo === 'lista') {
      if (!dialogo || !cuerpoDlg) return;
      lista.addEventListener('click', ev => {
        const b = ev.target.closest('.nt-art-abrir');
        if (b) abrir(b.dataset.ntId, b);
      });
      dialogo.addEventListener('click', ev => {
        // Pulsar fuera de la caja (en el fondo oscuro) también cierra.
        if (ev.target.closest('[data-nt-cerrar]') || ev.target === dialogo) cerrar();
      });
      dialogo.addEventListener('close', alCerrar);
      addEventListener('hashchange', abrirDesdeAncla);
    }
    datos = await cargar();
    pintar();
    if (modo === 'lista') abrirDesdeAncla();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  else iniciar();
})();

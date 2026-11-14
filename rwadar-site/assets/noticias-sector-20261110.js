'use strict';
/* =====================================================================
   RWAdar · «Noticias del sector» (10/11/2026; rediseño de Inicio, el mismo día)
   ---------------------------------------------------------------------
   Pinta la sección [data-noticias] con /datos/noticias-v2.json (estático,
   del propio despliegue; el navegador no habla con nadie más). Dos modos:
   Desde el 14/11/2026 («noticias que entran por los ojos») las dos son la
   misma rejilla (<ul class="nt-v">): la primera noticia, de portada, con la
   foto grande y el titular encima; las demás, tarjetas con su foto.
   - data-noticias="portada" (Inicio, bloque «Mercado y noticias» del
     11/11/2026): la portada y dos tarjetas. Cada una es un enlace a su
     detalle en /mercado/#<id>. «Hoy» o «Ayer» según la fecha de quien mira.
     Llegan ya escritas en el HTML publicado (rwadar-noticias-portada.js):
     si son de esta edición y la página está en castellano, no se rehacen.
   - data-noticias="lista" (/mercado/, «Noticias relacionadas»; /noticias/
     lleva ahí): todas; debajo de la portada, «Por qué te importa»
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
  const RUTA = '/datos/noticias-v2.json', PLAZO_MS = 10000;
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
  /* La foto: decorativa (el titular ya lo dice todo) y sin datos de quien mira
     para nadie más que RWAdar. Los atributos (src, srcset, sizes, loading…)
     los da el modelo (atributosFoto), los mismos que escribe el publicador en
     Inicio: aquí no se escribe ninguno a mano. Si falla, se quita y queda el fondo. */
  function foto(n, clase, papel) {
    const caja = el('span', clase);
    caja.setAttribute('aria-hidden', 'true');
    const a = modelo.atributosFoto(n, papel);
    if (!a) { caja.classList.add('nt-foto--sin'); return caja; }
    const img = document.createElement('img');
    img.alt = '';
    for (const k of ['width', 'height', 'decoding', 'loading']) if (a[k] !== undefined) img.setAttribute(k, a[k]);
    img.addEventListener('error', () => { img.remove(); caja.classList.add('nt-foto--sin'); }, { once: true });
    for (const k of ['src', 'srcset', 'sizes']) img.setAttribute(k, a[k]);
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
     de su nombre, tal como lo escribe RWAdar; en inglés, los organismos
     traducidos: modelo.fuenteCorta) y la fecha, en pequeño. El mismo marcado
     que escribe el publicador en Inicio (rwadar-noticias-portada.js). */
  function metaFuente(n) {
    const p = el('span', 'nt-meta');
    const fuente = el('span', 'nt-fuente-corta', modelo.fuenteCorta(n, idioma()));
    fuente.lang = modelo.fuenteTraducida(n, idioma()) ? 'en' : 'es'; fuente.setAttribute('translate', 'no');
    const cuando = el('time');
    cuando.setAttribute('translate', 'no'); cuando.lang = idioma();
    cuando.dateTime = n.fecha; cuando.textContent = modelo.fechaCorta(n.fecha, idioma());
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

  /* Una noticia de la rejilla (14/11/2026, «noticias que entran por los
     ojos»): la primera, de portada (foto a sangre y el titular encima, sobre
     un velo que nunca baja de 0,72 detrás de una letra); las demás, tarjetas
     con su foto. En Inicio cada una es un enlace a su detalle en /mercado/;
     en /mercado/ el titular es un botón que abre el diálogo (su ::after cubre
     la tarjeta). El nombre del enlace o del botón empieza por el titular: la
     píldora de categoría va oculta al lector y la fuente, después. «ancha»:
     la última, cuando queda sola en su fila (modelo.esAncha). */
  function tarjeta(n, i, total) {
    const t = modelo.textos(n, idioma());
    const portada = i === 0, ancha = modelo.esAncha(i, total);
    const pre = portada ? 'nt-p' : 'nt-t';
    const li = el('li', portada ? 'nt-v-portada' : (ancha ? 'nt-v-ancha' : ''));
    const papel = portada ? 'portada' : modelo.papelTarjeta(i, total);
    let caja;
    if (modo === 'lista') {
      li.id = n.id;
      caja = el('article', pre);
      caja.setAttribute('aria-labelledby', 'nt-t-' + n.id);
      const h = el(seccion.dataset.noticiasNivel === '3' ? 'h3' : 'h2', pre + '-tit nt-titular');
      h.id = 'nt-t-' + n.id;
      const b = el('button', 'nt-abrir');
      b.type = 'button';
      b.dataset.ntId = n.id;
      b.append(dato('span', '', t.titulo));
      h.append(b);
      caja.append(foto(n, pre + '-foto', papel), textoTarjeta(n, pre, h, portada, 'div'));
    } else {
      caja = el('a', pre);
      caja.href = '/mercado/#' + encodeURIComponent(n.id);
      caja.dataset.ntId = n.id;
      caja.append(foto(n, pre + '-foto', papel), textoTarjeta(n, pre, dato('span', pre + '-tit', t.titulo), portada, 'span'));
    }
    li.append(caja);
    // /mercado/: debajo de la portada, por qué te importa (el detalle lleva el resumen y eso).
    if (portada && modo === 'lista') {
      const importa = el('p', 'nt-v-importa');
      importa.append(el('span', 'nt-v-importa-rot', 'Por qué te importa'), ': ', dato('span', '', t.porQueImporta));
      li.append(importa);
    }
    return li;
  }
  /* El texto: dentro de un enlace (Inicio), span; en /mercado/ lleva un h3, div. */
  function textoTarjeta(n, pre, titular, portada, etiquetaCaja) {
    const caja = el(etiquetaCaja, pre + '-txt');
    if (portada) {
      const cat = el('span', 'nt-p-cat nt-cat--' + n.categoria);
      cat.setAttribute('aria-hidden', 'true');
      cat.textContent = modelo.etiquetaCategoria(n.categoria, idioma());
      caja.append(cat);
    }
    caja.append(titular, metaFuente(n));
    return caja;
  }
  /* «Hoy» o «Ayer», según el día de quien mira, al final de «fuente · fecha». */
  function ponerRecientes() {
    for (const m of lista.querySelectorAll('.nt-meta')) {
      m.querySelector('.nt-hoy')?.remove();
      const id = m.closest('[data-nt-id]')?.dataset.ntId || m.closest('li[id]')?.id;
      const n = datos.noticias.find(x => x.id === id);
      const cual = n && etiqueta(n);
      if (cual) m.append(' ', cual);
    }
  }

  function pintar() {
    if (!seccion) return;
    // idioma-web carga después (defer, en orden): se suscribe al pintar.
    if (!suscrito && globalThis.RWAdarIdioma?.suscribirIdioma) { suscrito = true; globalThis.RWAdarIdioma.suscribirIdioma(pintar); }
    /* Sin el archivo, la lista que trae Inicio ya escrita es la misma edición
       publicada: se queda (solo en castellano) en lugar del aviso de error. */
    if (!datos && lista.dataset.ntPrepintado && lista.children.length && idioma() === 'es') {
      seccion.dataset.noticiasEstado = 'prepintado';
      estado.hidden = true;
      return;
    }
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
    /* Inicio llega con las tres ya escritas por el publicador
       (data-nt-prepintado = la firma de lo pintado): si es la misma edición y
       la página está en castellano, no se rehacen, solo se pone «Hoy» o
       «Ayer». Si no (inglés, otra edición), se rehacen. */
    if (modo === 'portada' && !modelo.debeRepintar({ prepintado: lista.dataset.ntPrepintado, datos, idioma: idioma() })) {
      ponerRecientes();
      return;
    }
    delete lista.dataset.ntPrepintado;
    const enfocada = document.activeElement?.closest?.('[data-nt-id]')?.dataset.ntId;
    const noticias = modo === 'lista' ? datos.noticias : datos.noticias.slice(0, modelo.EN_INICIO);
    lista.replaceChildren(...noticias.map((n, i) => tarjeta(n, i, noticias.length)));
    ponerRecientes();
    if (enfocada) lista.querySelector(`[data-nt-id="${CSS.escape(enfocada)}"]`)?.focus({ preventScroll: true });
    if (abierta && dialogo?.open) pintarDetalle(abierta);
  }

  /* ---- Detalle (/noticias/) ---- */
  function pintarDetalle(n) {
    const lengua = idioma(), t = modelo.textos(n, lengua);
    const marco = el('article', 'nt-dlg-art');
    const arte = foto(n, 'nt-dlg-arte', 'detalle');
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
        const b = ev.target.closest('.nt-abrir');
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

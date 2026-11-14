'use strict';
/* =====================================================================
   RWAdar · «Novedades de RWAdar» (12/11/2026): la ventana y la página
   ---------------------------------------------------------------------
   Encargo: «que salga al abrir la app y como las novedades, tipo
   un texto informativo muy fácil de leer con las novedades y si clickan que
   salga en detalle». El contenido sale de /datos/novedades-producto.json (lo
   valida assets/novedades-producto-modelo-20261112.js) y no hay ningún texto
   de las novedades en este archivo.

   - En Inicio ([data-novedades-producto="ventana"] en index.html): una vez
     por «version», cuando la página ha cargado y no hay otro diálogo abierto
     (la cuenta, una ficha, la comparativa, la campana…: si lo hay, espera a
     que se cierre). Enseña el título, la fecha y los puntos del resumen
     (icono y una línea) con dos botones: «Ver en detalle» (lleva a
     /novedades-rwadar/) y «Entendido» (la cierra). Cerrarla de cualquier
     forma (Entendido, ×, Escape o fuera) cuenta como vista: se guarda la
     versión en el almacenamiento local (rwadar.novedades.vista) y no vuelve
     a salir hasta la siguiente. Desde el 14/11/2026, el recuadro «Activa
     los avisos» con su botón «Activar avisos»: sale salvo que las
     notificaciones ya estén activas en este navegador (lo decide
     modelo.estadoAvisosNavegador; si no se sabe, sale). Desde la versión
     2026-11-14.3 va ARRIBA del cuerpo, antes de los puntos, y compacto: se ve
     sin desplazar en un iPhone 13 (390 × 664) y en un Android pequeño
     (360 × 640). Qué hace el botón lo dice la web
     (window.RWAdarAvisosSinCuenta.paraVentana, de rwadar-20260820.js):
       · 'directo' (sin sesión, en un móvil que puede y con las notificaciones
         sin cuenta encendidas): enseña el texto versionado del permiso y su
         información básica, y el botón las activa AQUÍ MISMO (el permiso se
         pide en el mismo toque); el resultado se dice en el recuadro;
       · 'instalar' (iPhone sin la web en la pantalla de inicio): cierra la
         ventana y abre los pasos para añadirla;
       · 'perfil' (lo demás: con sesión, en el ordenador, base apagada…):
         cierra la ventana y lleva a Perfil › Avisos (/#perfil-avisos).
     Pulsarlo cuenta como vista. No sale:
       · si el navegador no deja leer o guardar lo visto (se prueba a
         guardar antes: no se puede prometer «una vez»);
       · si se llega a Inicio a otra cosa concreta: una notificación
         (?avisos=1, abre la campana), un enlace de la Academy (#explain), el
         camino a Perfil › Avisos (#perfil-avisos) o la vuelta de un correo
         de la cuenta (#access_token…);
       · dentro de la app de Android (ReactNativeWebView: la app enseña la
         suya) ni en navegadores automatizados (navigator.webdriver: robots y
         pruebas; la prueba de la ventana lo simula).
   - En /novedades-rwadar/ ([data-novedades-producto="detalle"]): el resumen
     como índice, cada sección con sus párrafos y su «Cómo se hace», y el
     camino a Perfil › Avisos (/#perfil-avisos) para activar las
     notificaciones. Al verla, la versión cuenta como vista.

   Los textos salen del archivo en el idioma elegido (sus campos «en») y los
   de la interfaz, de UI (abajo): todo con translate="no" y su lang, para que
   el diccionario no los toque. Todo se escribe con textContent y los iconos
   con createElementNS: ningún dato puede meter marcado (CSP estricta).
   ===================================================================== */
(() => {
  const modelo = globalThis.RWAdarNovedadesProducto;
  if (!modelo || typeof document === 'undefined') return;
  const PLAZO_MS = 10000, ESPERA_MS = 900, REVISION_MS = 1500, ESPERA_MAXIMA_MS = 10 * 60 * 1000, PLAZO_AVISOS_MS = 2500;
  const SVG = 'http://www.w3.org/2000/svg';
  const UI = Object.freeze({
    es: Object.freeze({
      cerrar: 'Cerrar las novedades', detalle: 'Ver en detalle', entendido: 'Entendido',
      fechaPagina: 'Novedades del ', pasos: 'Cómo se hace', resumen: 'Resumen de las novedades',
      cargando: 'Cargando las novedades…', error: 'Ahora no podemos mostrar las novedades. Vuelve a intentarlo más tarde.',
      irAvisos: 'Ir a Perfil › Avisos para activarlos',
      ctaTit: '¿Quieres enterarte de las próximas novedades?',
      ctaTexto: 'Activa los avisos en Perfil › Avisos. Es gratis y los puedes quitar cuando quieras.',
      ctaBoton: 'Ir a Perfil › Avisos', tituloPagina: t => t + ' · RWAdar',
      recTit: 'Activa los avisos', recTexto: 'Recibe cada novedad en el móvil, como un WhatsApp. Es gratis y puedes quitar los avisos cuando quieras.',
      recBoton: 'Activar avisos', recInfo: 'Información básica sobre tus datos', recEspera: 'Un momento…',
      recHecho: 'Notificaciones activadas en este móvil. Así te llegarán las novedades.',
      recNo: 'No se han activado. En Perfil › Avisos te explicamos cómo permitirlas.', recIrPerfil: 'Ir a Perfil › Avisos',
    }),
    en: Object.freeze({
      cerrar: 'Close the news', detalle: 'See details', entendido: 'Got it',
      fechaPagina: 'News from ', pasos: 'How to do it', resumen: 'Summary of the news',
      cargando: 'Loading the news…', error: 'We cannot show the news right now. Please try again later.',
      irAvisos: 'Go to Profile › Alerts to turn them on',
      ctaTit: 'Want to hear about what comes next?',
      ctaTexto: 'Turn on alerts in Profile › Alerts. It is free and you can turn them off whenever you like.',
      ctaBoton: 'Go to Profile › Alerts', tituloPagina: t => t + ' · RWAdar',
      recTit: 'Turn on alerts', recTexto: 'Get RWAdar news on your phone, like a WhatsApp message. It is free and you can turn alerts off whenever you like.',
      recBoton: 'Turn on alerts', recInfo: 'Basic information about your data', recEspera: 'One moment…',
      recHecho: 'Notifications turned on for this phone. This is how the news will reach you.',
      recNo: 'They were not turned on. In Profile › Alerts we explain how to allow them.', recIrPerfil: 'Go to Profile › Alerts',
    }),
  });
  const RUTA_AVISOS = '/#perfil-avisos';
  const PLAZO_SIN_CUENTA_MS = 3000;
  /* Lo que puede hacer el botón del recuadro (ver arriba). Sin la web de la
     cuenta cargada, o si tarda, 'perfil'. */
  async function modoRecordatorio() {
    const api = globalThis.RWAdarAvisosSinCuenta;
    if (!api || typeof api.paraVentana !== 'function') return { modo: 'perfil' };
    let reloj = null;
    const plazo = new Promise(ok => { reloj = setTimeout(() => ok({ modo: 'perfil' }), PLAZO_SIN_CUENTA_MS); });
    try {
      const r = await Promise.race([api.paraVentana(), plazo]);
      return r && ['directo', 'instalar', 'activos', 'perfil'].includes(r.modo) ? r : { modo: 'perfil' };
    } catch { return { modo: 'perfil' }; } finally { clearTimeout(reloj); }
  }
  /* Un mensaje de la web (en castellano) en el idioma de la ventana. */
  const enSuIdioma = texto => (idioma() === 'en' && globalThis.RWAdarEnglish && typeof globalThis.RWAdarEnglish[texto] === 'string'
    ? globalThis.RWAdarEnglish[texto] : texto);
  // La dirección al llegar (antes de que rwadar-20260820.js quite ?avisos=1); null si no se puede leer.
  const llegada = (() => {
    try { return { busqueda: location.search || '', ancla: location.hash || '' }; } catch { return null; }
  })();

  const idioma = () => (globalThis.RWAdarIdioma?.obtenerIdioma?.() === 'en' ? 'en' : 'es');
  const ui = () => UI[idioma()];
  function almacenLocal() {
    try { return globalThis.localStorage || null; } catch { return null; }
  }
  function el(etiqueta, clase, texto) {
    const n = document.createElement(etiqueta);
    if (clase) n.className = clase;
    if (texto !== undefined) n.textContent = texto;
    return n;
  }
  /* Un texto de las novedades o de su interfaz: en su idioma y sin pasar por el diccionario. */
  function propio(n) {
    n.setAttribute('translate', 'no');
    n.lang = idioma();
    return n;
  }
  function icono(clave) {
    const caja = el('span', 'nov-icono');
    caja.setAttribute('aria-hidden', 'true');
    const svg = document.createElementNS(SVG, 'svg');
    for (const [k, v] of [['width', '22'], ['height', '22'], ['viewBox', '0 0 24 24'], ['fill', 'none'], ['stroke', 'currentColor'],
      ['stroke-width', '1.75'], ['stroke-linecap', 'round'], ['stroke-linejoin', 'round'], ['focusable', 'false']]) svg.setAttribute(k, v);
    for (const d of modelo.trazosIcono(clave)) {
      const p = document.createElementNS(SVG, 'path');
      p.setAttribute('d', d);
      svg.append(p);
    }
    caja.append(svg);
    return caja;
  }

  async function cargar() {
    const abort = typeof AbortController === 'function' ? new AbortController() : null;
    const reloj = abort ? setTimeout(() => abort.abort(), PLAZO_MS) : null;
    try {
      const r = await fetch(modelo.RUTA, { credentials: 'omit', cache: 'no-cache', headers: { Accept: 'application/json' }, signal: abort?.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return modelo.validarTexto(await r.text());
    } catch { return null; } finally { if (reloj) clearTimeout(reloj); }
  }

  /* ¿Notificaciones ya activas en este navegador? Solo se mira lo que el
     navegador sabe (soporte, permiso y si hay suscripción de push), sin
     preguntar a nadie ni pedir permiso; lo decide el modelo. Con plazo: si
     el navegador no contesta, 'desconocido' (y el recuadro sale). */
  async function avisosDelNavegador() {
    let reloj = null;
    const plazo = new Promise((_, mal) => { reloj = setTimeout(() => mal(new Error('plazo')), PLAZO_AVISOS_MS); });
    try {
      const nav = globalThis.navigator;
      const soporte = !!nav && 'serviceWorker' in nav && 'PushManager' in globalThis && 'Notification' in globalThis;
      if (!soporte) return modelo.estadoAvisosNavegador({ soporte });
      const permiso = globalThis.Notification.permission;
      if (permiso !== 'granted') return modelo.estadoAvisosNavegador({ soporte, permiso });
      const registro = await Promise.race([nav.serviceWorker.getRegistration('/'), plazo]);
      const suscripcion = registro && registro.pushManager ? await Promise.race([registro.pushManager.getSubscription(), plazo]) : null;
      return modelo.estadoAvisosNavegador({ soporte, permiso, suscrito: !!suscripcion });
    } catch { return 'desconocido'; } finally { clearTimeout(reloj); }
  }

  /* Los puntos del resumen: icono y una línea (el título y su frase). En la
     página, cada punto lleva a su sección. */
  function puntos(lista, textos, { enlazar = false } = {}) {
    lista.replaceChildren(...textos.resumen.map(p => {
      const li = el('li', 'nov-punto');
      const caja = enlazar && textos.detalle.some(s => s.id === p.id) ? el('a', 'nov-punto-caja nov-punto-enlace') : el('span', 'nov-punto-caja');
      if (caja.tagName === 'A') caja.href = '#' + encodeURIComponent(idSeccion(p.id));
      const frase = el('span', 'nov-punto-frase');
      frase.append(propio(el('strong', 'nov-punto-tit', p.titulo)), ' ', propio(el('span', 'nov-punto-txt', p.texto)));
      caja.append(icono(p.icono), frase);
      li.append(caja);
      return li;
    }));
  }

  /* ---- La ventana de Inicio ---- */
  /* Cuándo sale lo deciden modelo.motivoSinVentana (antes de cargar) y
     modelo.estadoVentana (en cada vistazo: otro diálogo abierto o la pestaña
     oculta, espera). */
  function iniciarVentana() {
    if (!llegada) return;
    const almacen = almacenLocal();
    if (modelo.motivoSinVentana({ ...llegada, enApp: !!globalThis.ReactNativeWebView,
      automatizado: globalThis.navigator?.webdriver === true, almacen })) return;
    const empezar = () => setTimeout(async () => {
      const datos = await cargar();
      if (!datos) return;
      const limite = Date.now() + ESPERA_MAXIMA_MS;
      const ahora = () => modelo.estadoVentana({ almacen, version: datos.version, doc: document, oculta: document.visibilityState === 'hidden' });
      const mirar = async () => {
        if (Date.now() > limite) return;
        let estado = ahora();
        // Los avisos de este navegador, justo antes de enseñarla (mientras esperaba se han podido activar).
        if (estado === 'ensenar') {
          let avisos = await avisosDelNavegador();
          // Qué puede hacer el botón del recuadro (con su texto, si activa aquí mismo).
          const rec = modelo.conRecordatorioAvisos(avisos) ? await modoRecordatorio() : { modo: 'perfil' };
          if (rec.modo === 'activos') avisos = 'activos';
          estado = ahora();
          if (estado === 'ensenar') { mostrar(datos, almacen, avisos, rec); return; }
        }
        if (estado === 'esperar') setTimeout(mirar, REVISION_MS);
      };
      mirar();
    }, ESPERA_MS);
    if (document.readyState === 'complete') empezar();
    else addEventListener('load', empezar, { once: true });
  }

  /* El recuadro «Activa los avisos» (14/11/2026): título, una línea y el
     botón. Desde la 2026-11-14.3, arriba del cuerpo y compacto. En el orden
     del Tab va entre × y «Ver en detalle». rec: lo que dijo modoRecordatorio
     y, tras pulsar, rec.paso ('espera', 'hecho' o 'fallo') y rec.mensaje. */
  function recordatorio(t, rec) {
    const lengua = idioma();
    const caja = propio(el('section', 'nov-rec'));
    caja.setAttribute('aria-labelledby', 'novedadesRecTit');
    caja.dataset.novRecordatorio = '';
    caja.dataset.novModo = rec.modo;
    const cab = el('div', 'nov-rec-cab');
    const tit = propio(el('h3', 'nov-rec-tit', t.recTit));
    tit.id = 'novedadesRecTit';
    cab.append(icono('notificacion'), tit);
    caja.append(cab);
    if (rec.modo === 'directo') {
      // Un texto de la web tal cual y en su idioma; su «Privacidad» final enlaza a su apartado.
      const conPrivacidad = (clase, texto, href) => {
        const p = propio(el('p', clase));
        const m = /^(.*\s)(Privacidad|Privacy)\.$/.exec(texto);
        if (m) {
          const a = el('a', '', m[2]);
          a.href = href;
          p.append(m[1], a, '.');
        } else p.textContent = texto;
        return p;
      };
      // El texto versionado del permiso.
      caja.append(conPrivacidad('nov-rec-txt nov-rec-permiso', (rec.texto && rec.texto[lengua]) || '', rec.privacidad || '/privacidad'));
      const estado = propio(el('p', 'nov-rec-estado'));
      estado.id = 'novedadesRecEstado';
      estado.setAttribute('role', rec.paso === 'fallo' ? 'alert' : 'status');
      estado.textContent = rec.paso === 'espera' ? t.recEspera : rec.paso === 'hecho' ? t.recHecho : rec.paso === 'fallo' ? enSuIdioma(rec.mensaje || '') : '';
      estado.hidden = !estado.textContent;
      caja.append(estado);
      if (rec.paso !== 'hecho') {
        const boton = propio(el('button', 'b1 nov-rec-boton', t.recBoton));
        boton.type = 'button'; boton.dataset.novAvisos = ''; boton.dataset.novFoco = 'avisos';
        boton.disabled = rec.paso === 'espera';
        caja.append(boton);
      }
      // Quién interviene en la entrega, junto al botón (anexo legal, 7.3), a la vista.
      const quien = (rec.quien && rec.quien[lengua]) || '';
      if (quien) caja.append(conPrivacidad('nov-rec-info nov-rec-quien', quien, rec.garantias || '/privacidad#garantias-push'));
      const info = propio(el('details', 'nov-rec-info'));
      const resumen = el('summary', '', t.recInfo);
      resumen.dataset.novFoco = 'info';
      info.append(resumen, el('p', '', (rec.info && rec.info[lengua]) || ''));
      caja.append(info);
      return caja;
    }
    caja.append(propio(el('p', 'nov-rec-txt', rec.paso === 'fallo' ? t.recNo : t.recTexto)));
    if (rec.modo === 'instalar') {
      const boton = propio(el('button', 'b1 nov-rec-boton', t.recBoton));
      boton.type = 'button'; boton.dataset.novAvisos = ''; boton.dataset.novFoco = 'avisos';
      caja.append(boton);
    } else {
      const boton = propio(el('a', 'b1 nov-rec-boton', rec.paso === 'fallo' ? t.recIrPerfil : t.recBoton));
      boton.href = RUTA_AVISOS; boton.dataset.novAvisos = ''; boton.dataset.novFoco = 'avisos';
      caja.append(boton);
    }
    return caja;
  }

  function pintarVentana(d, datos, avisos, rec) {
    const textos = modelo.enIdioma(datos, idioma()), t = ui();
    const enfocado = document.activeElement && d.contains(document.activeElement) ? document.activeElement.dataset.novFoco : '';
    propio(d);
    const marco = el('div', 'escaparate-dialogo-marco nov-marco');
    // Cabecera propia (no .escaparate-dialogo-cab): idioma-web toma el h2 de esa como texto de una
    // ficha («Original source text») y le pondría lang="es" también en inglés.
    const cab = el('header', 'nov-cab');
    const titulos = el('div');
    const fecha = el('time', 'nov-fecha', modelo.fechaLarga(datos.version, idioma()));
    fecha.dateTime = modelo.fechaISO(datos.version);
    const h2 = el('h2', 'nov-tit', textos.titulo);
    h2.id = 'novedadesTit'; h2.tabIndex = -1; h2.dataset.novFoco = 'titulo';
    titulos.append(fecha, h2);
    const cerrar = el('button', 'bi nov-cerrar');
    cerrar.type = 'button'; cerrar.dataset.novCerrar = ''; cerrar.dataset.novFoco = 'cerrar';
    cerrar.setAttribute('aria-label', t.cerrar);
    const aspa = el('span', '', '×');
    aspa.setAttribute('aria-hidden', 'true');
    cerrar.append(aspa);
    cab.append(titulos, cerrar);
    const cuerpo = el('div', 'nov-cuerpo');
    const lista = el('ul', 'nov-puntos');
    lista.id = 'novedadesPuntos';
    lista.setAttribute('role', 'list');
    puntos(lista, textos);
    // El recuadro, arriba: a la vista sin desplazar en los móviles pequeños.
    if (modelo.conRecordatorioAvisos(avisos)) cuerpo.append(recordatorio(t, rec));
    cuerpo.append(lista);
    const acciones = el('div', 'nov-acciones');
    const ver = el('a', 'b2 nov-ver', t.detalle);
    ver.href = modelo.PAGINA; ver.dataset.novVer = ''; ver.dataset.novFoco = 'ver';
    const vale = el('button', 'b1 nov-entendido', t.entendido);
    vale.type = 'button'; vale.dataset.novEntendido = ''; vale.dataset.novFoco = 'entendido';
    acciones.append(ver, vale);
    marco.append(cab, cuerpo, acciones);
    d.replaceChildren(marco);
    if (enfocado) d.querySelector(`[data-nov-foco="${enfocado}"]`)?.focus({ preventScroll: true });
  }

  function mostrar(datos, almacen, avisos, rec = { modo: 'perfil' }) {
    if (document.getElementById('novedadesDialogo')) return;
    const d = el('dialog', 'escaparate-dialogo nov-dialogo');
    d.id = 'novedadesDialogo';
    d.setAttribute('aria-labelledby', 'novedadesTit');
    d.setAttribute('aria-describedby', 'novedadesPuntos');
    d.dataset.novedadesVersion = datos.version;
    d.dataset.novedadesAvisos = avisos;
    const origen = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
    const visto = () => modelo.marcarVista(almacen, datos.version);
    pintarVentana(d, datos, avisos, rec);
    d.addEventListener('click', e => {
      if (e.target === d || e.target.closest?.('[data-nov-cerrar],[data-nov-entendido]')) { d.close(); return; }
      if (e.target.closest?.('[data-nov-avisos]')) {
        visto();
        // Aquí mismo, sin cuenta: el permiso se pide en este mismo toque (antes de cualquier espera).
        if (rec.modo === 'directo' && rec.paso !== 'espera' && rec.paso !== 'hecho' && globalThis.RWAdarAvisosSinCuenta?.activar) {
          const promesa = globalThis.RWAdarAvisosSinCuenta.activar('novedades');
          rec.paso = 'espera'; rec.mensaje = '';
          pintarVentana(d, datos, avisos, rec);
          Promise.resolve(promesa).then(r => {
            if (r && r.ok) { rec.paso = 'hecho'; rec.mensaje = ''; }
            else if (r && r.mensaje) { rec.paso = 'fallo'; rec.mensaje = r.mensaje; }
            // Sin mensaje (permiso bloqueado): Perfil › Avisos explica cómo permitirlas.
            else { rec.modo = 'perfil'; rec.paso = 'fallo'; }
          }, () => { rec.modo = 'perfil'; rec.paso = 'fallo'; }).finally(() => {
            if (!d.open) return;
            pintarVentana(d, datos, avisos, rec);
            // El foco, en el botón para volver a intentarlo o en «Entendido».
            (d.querySelector('[data-nov-foco="avisos"]') || d.querySelector('[data-nov-foco="entendido"]'))?.focus({ preventScroll: true });
          });
          return;
        }
        // iPhone sin la web en la pantalla de inicio: se cierra y salen los pasos para añadirla.
        if (rec.modo === 'instalar' && typeof globalThis.rwadarInstalarIphone === 'function') {
          d.close();
          globalThis.rwadarInstalarIphone(null);
          return;
        }
        // A Perfil › Avisos: cuenta como vista y se cierra antes (el enlace sigue su camino).
        d.close();
        return;
      }
      // «Ver en detalle»: la página nueva; cuenta como vista antes de salir.
      if (e.target.closest?.('[data-nov-ver]')) visto();
    });
    d.addEventListener('close', () => {
      visto();
      document.documentElement.classList.remove('nov-abierta');
      d.remove();
      if (origen && document.contains(origen)) origen.focus({ preventScroll: true });
    });
    let suscrito = null;
    if (globalThis.RWAdarIdioma?.suscribirIdioma) suscrito = globalThis.RWAdarIdioma.suscribirIdioma(() => { if (d.open) pintarVentana(d, datos, avisos, rec); });
    d.addEventListener('close', () => { if (typeof suscrito === 'function') suscrito(); }, { once: true });
    document.body.append(d);
    document.documentElement.classList.add('nov-abierta');
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    // El foco, en el título: el lector de pantalla lee la ventana desde arriba; Tab va a los botones.
    d.querySelector('#novedadesTit')?.focus({ preventScroll: true });
  }

  /* ---- La página /novedades-rwadar/ ---- */
  const libre = id => (document.getElementById(id) && !document.getElementById(id).closest('[data-nov-seccion]') ? 'nov-' + id : id);
  const idsSeccion = new Map();
  function idSeccion(id) {
    if (!idsSeccion.has(id)) idsSeccion.set(id, libre(id));
    return idsSeccion.get(id);
  }
  function enlaceAvisos(clase, texto) {
    const a = propio(el('a', clase));
    a.href = RUTA_AVISOS;
    a.append(el('span', '', texto), ' ');
    const flecha = el('span', 'ini-ver-flecha', '→');
    flecha.setAttribute('aria-hidden', 'true');
    a.append(flecha);
    return a;
  }
  function pintarPagina(raiz, datos) {
    const lengua = idioma(), textos = modelo.enIdioma(datos, lengua), t = ui();
    document.title = t.tituloPagina(textos.titulo);
    const h1 = raiz.querySelector('#novTit');
    if (h1) { h1.textContent = textos.titulo; propio(h1); }
    const fecha = raiz.querySelector('#novFecha');
    if (fecha) {
      const cuando = el('time', '', modelo.fechaLarga(datos.version, lengua));
      cuando.dateTime = modelo.fechaISO(datos.version);
      fecha.replaceChildren(t.fechaPagina, cuando);
      propio(fecha);
      fecha.hidden = false;
    }
    const resumen = raiz.querySelector('#novResumen');
    if (resumen) {
      resumen.setAttribute('aria-label', t.resumen);
      propio(resumen);
      puntos(resumen, textos, { enlazar: true });
      resumen.hidden = false;
    }
    const detalle = raiz.querySelector('#novDetalle');
    if (detalle) detalle.replaceChildren(...textos.detalle.map(s => {
      const sec = el('section', 'nov-sec');
      sec.id = idSeccion(s.id);
      sec.dataset.novSeccion = s.id;
      sec.setAttribute('aria-labelledby', 'nov-t-' + s.id);
      const h2 = propio(el('h2', 'nov-sec-tit', s.titulo));
      h2.id = 'nov-t-' + s.id;
      sec.append(h2, ...s.parrafos.map(p => propio(el('p', 'nov-sec-p', p))));
      if (s.pasos.length) {
        const h3 = propio(el('h3', 'nov-pasos-tit', t.pasos));
        const ol = el('ol', 'nov-pasos');
        // Con list-style:none, Safari con VoiceOver deja de leerla como lista: se le devuelve el papel.
        ol.setAttribute('role', 'list');
        ol.append(...s.pasos.map(p => propio(el('li', '', p))));
        sec.append(h3, ol);
      }
      // Los avisos del móvil: el camino a Perfil › Avisos, justo después de explicarlos.
      if (s.id === 'avisos-movil') sec.append(enlaceAvisos('ini-ver nov-ir-avisos', t.irAvisos));
      return sec;
    }));
    const cta = raiz.querySelector('#novCta');
    if (cta) {
      const h2 = propio(el('h2', 'nov-cta-tit', t.ctaTit));
      h2.id = 'novCtaTit';
      cta.replaceChildren(h2, propio(el('p', 'nov-cta-txt', t.ctaTexto)), enlaceAvisos('b1 nov-cta-boton', t.ctaBoton));
      cta.hidden = false;
    }
    const estado = raiz.querySelector('#novEstado');
    if (estado) { estado.textContent = ''; estado.hidden = true; }
    raiz.setAttribute('aria-busy', 'false');
    raiz.dataset.novedadesEstado = 'listo';
  }
  async function iniciarPagina(raiz) {
    const estado = raiz.querySelector('#novEstado');
    if (estado) { estado.textContent = ui().cargando; propio(estado); }
    const datos = await cargar();
    if (!datos) {
      raiz.setAttribute('aria-busy', 'false');
      raiz.dataset.novedadesEstado = 'sin-datos';
      if (estado) { estado.textContent = ui().error; propio(estado); estado.hidden = false; }
      return;
    }
    pintarPagina(raiz, datos);
    // Quien ve la página ha visto las novedades: la ventana de Inicio ya no sale para esta versión.
    modelo.marcarVista(almacenLocal(), datos.version);
    if (globalThis.RWAdarIdioma?.suscribirIdioma) globalThis.RWAdarIdioma.suscribirIdioma(() => pintarPagina(raiz, datos));
    // El contenido llega después de la carga: un enlace /novedades-rwadar/#<id> se busca ahora.
    const ancla = (() => { try { return decodeURIComponent((location.hash || '').slice(1)); } catch { return ''; } })();
    const destino = ancla && document.getElementById(idsSeccion.get(ancla) || ancla);
    if (destino && destino.closest('#novDetalle')) {
      destino.scrollIntoView({ block: 'start' });
      if (!destino.hasAttribute('tabindex')) destino.tabIndex = -1;
      destino.focus({ preventScroll: true });
    }
  }

  const raizPagina = document.querySelector('[data-novedades-producto="detalle"]');
  if (raizPagina) {
    // idioma-web carga después (defer, en orden): se pinta con el idioma ya leído.
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => iniciarPagina(raizPagina), { once: true });
    else iniciarPagina(raizPagina);
  } else if (document.querySelector('[data-novedades-producto="ventana"]')) iniciarVentana();
})();

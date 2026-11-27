/* ---------------------------------------------------------------------
   País de residencia del usuario (27/11/2026). La web deja de mirar solo
   España: cada oferta dice su disponibilidad para el país que elija quien
   mira (motor común con la app: disponibilidad-pais-20261127.js).

   - País detectado por la conexión (Cloudflare, /cdn-cgi/trace, sin pedir
     permisos de ubicación): solo orientativo.
   - El que elija el usuario manda y se guarda en este navegador.
   - Sin nada: España, como hasta ahora.
   Los textos se escriben en castellano y los traduce el diccionario común
   (nombres de países y estados incluidos); los datos con versión inglesa
   (nota, requisito) llevan las dos y la hoja de estilos enseña la de su idioma.
   --------------------------------------------------------------------- */
(function () {
  'use strict';
  const CLAVE = 'rwadar-pais-residencia';
  const motor = () => (typeof window !== 'undefined' && window.RWAdarDisponibilidad) || null;
  let estado = { codigo: 'ES', origen: 'defecto' };
  let soloAccesibles = false;
  const oyentes = [];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fechaES = iso => /^\d{4}-\d{2}-\d{2}$/.test(String(iso || '')) ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : '';
  const https = u => /^https:\/\//.test(String(u || '')) ? String(u) : '';

  function avisar() { for (const f of oyentes.slice()) { try { f(estado); } catch (e) { /* un oyente no rompe a los demás */ } } }
  function leerGuardado() {
    try {
      const m = motor(), c = m && m.normalizarCodigo(localStorage.getItem(CLAVE));
      if (c) { estado = { codigo: c, origen: 'elegido' }; return true; }
    } catch (e) { /* almacenamiento bloqueado: se queda el de por defecto */ }
    return false;
  }
  function elegir(codigo) {
    const m = motor(), c = m && m.normalizarCodigo(codigo);
    if (!c) return false;
    estado = { codigo: c, origen: 'elegido' };
    try { localStorage.setItem(CLAVE, c); } catch (e) { /* sin guardar: vale para esta visita */ }
    avisar();
    return true;
  }
  function detectar() {
    if (estado.origen === 'elegido' || typeof fetch !== 'function') return;
    fetch('/cdn-cgi/trace', { cache: 'no-store', credentials: 'omit' })
      .then(r => (r.ok ? r.text() : ''))
      .then(t => {
        const m = motor(), c = m && m.paisDesdeTrace(t);
        if (c && estado.origen !== 'elegido') { estado = { codigo: c, origen: 'detectado' }; avisar(); }
      })
      .catch(() => { /* sin red o servidor local: España por defecto */ });
  }

  const nombre = c => { const m = motor(); return m ? m.nombrePais(c || estado.codigo, 'es') : 'España'; };
  /* {estado, requisito, requisitoEn}: sin motor, lo de siempre (España desde disponibleEs). */
  function estadoOferta(o) {
    const m = motor();
    if (m) return m.estadoEnPais(o, estado.codigo);
    const es = o && o.disponibleEs;
    return { estado: estado.codigo === 'ES' && es === true ? 'disponible' : estado.codigo === 'ES' && es === false ? 'no_disponible' : 'sin_confirmar', requisito: '', requisitoEn: '' };
  }
  const etiqueta = e => { const m = motor(); return m ? m.etiquetaEstado(e, 'es') : 'Sin confirmar'; };
  const tieneReglas = o => { const m = motor(); return !!(m && m.disponibilidadDe(o)); };
  const accesible = o => { const e = estadoOferta(o).estado; return e === 'disponible' || e === 'con_requisitos'; };
  const pasaFiltro = o => !soloAccesibles || accesible(o);

  /* El selector de la cabecera de Ofertas: país (con «detectado por tu conexión») y el filtro. */
  function montarSelector(caja) {
    const m = motor();
    if (!caja || !m) return;
    const opciones = m.listaPaises('es').map(p => '<option value="' + p.codigo + '"' + (p.codigo === estado.codigo ? ' selected' : '') + '>' + esc(p.nombre) + '</option>').join('');
    caja.innerHTML = '<div class="emis-pais-fila">' +
      '<label class="emis-pais-chip" for="emiPais"><span class="emis-pais-globo" aria-hidden="true">◎</span><span class="emis-pais-rotulo">Tu país</span>' +
      '<select id="emiPais" autocomplete="country" aria-label="Tu país de residencia"' + (estado.origen === 'detectado' ? ' aria-describedby="emiPaisNota"' : '') + '>' + opciones + '</select></label>' +
      '<button type="button" class="f f-pais' + (soloAccesibles ? ' on' : '') + '" aria-pressed="' + soloAccesibles + '" data-emi-solo-pais><span class="f-switch" aria-hidden="true"></span><span>Solo las disponibles en tu país</span></button>' +
      '</div>' + (estado.origen === 'detectado' ? '<p class="emis-pais-nota" id="emiPaisNota">Detectado por tu conexión. Si resides en otro país, cámbialo.</p>' : '');
    const s = caja.querySelector('#emiPais'), f = caja.querySelector('[data-emi-solo-pais]');
    if (s) s.addEventListener('change', () => elegir(s.value));
    if (f) f.addEventListener('click', () => { soloAccesibles = !soloAccesibles; avisar(); });
  }

  /* La ficha ampliada (27/11/2026): arriba, tu país y su estado en una tarjeta; debajo, los países por grupo
     como chips; las fuentes, plegadas. Los datos con versión inglesa llevan las dos (la hoja enseña la suya). */
  function detalleHtml(o) {
    const m = motor();
    if (!m) return '';
    const es = m.detalleDisponibilidad(o, estado.codigo, 'es'), en = m.detalleDisponibilidad(o, estado.codigo, 'en');
    const dos = (a, b) => a === b ? esc(a) : '<span data-es lang="es">' + esc(a) + '</span><span data-en lang="en">' + esc(b) + '</span>';
    const chips = nombres => '<ul class="disp-chips">' + nombres.map(n => '<li>' + esc(n) + '</li>').join('') + '</ul>';
    const grupo = (clase, titulo, nombres, extra) => nombres.length ? '<div class="disp-grupo ' + clase + '"><h4>' + titulo + '</h4>' + chips(nombres) + (extra || '') + '</div>' : '';
    const reglas = tieneReglas(o);
    const fuentes = es.fuentes.filter(f => https(f.url));
    return '<section class="escaparate-dialogo-seccion disp-pais" aria-labelledby="dispPaisTit">' +
      '<h3 id="dispPaisTit">Disponibilidad por país</h3>' +
      '<div class="disp-tarjeta disp-' + es.estado + '">' +
        '<p class="disp-tarjeta-cab"><span class="disp-tarjeta-pais">' + esc(es.nombre) + '</span><span class="disp-pill">' + esc(es.texto) + '</span></p>' +
        (es.requisito ? '<p class="disp-tarjeta-txt">' + dos(es.requisito, en.requisito) + '</p>' : '') +
        (es.estado === 'sin_confirmar' ? '<p class="disp-tarjeta-txt">No hay información oficial suficiente para tu país. No suponemos que esté disponible solo porque no aparezca excluido.</p>' : '') +
      '</div>' +
      (reglas ? (es.nota ? '<p class="disp-nota">' + dos(es.nota, en.nota) + '</p>' : '') +
        '<div class="disp-grupos">' + grupo('disp-g-si', 'Países admitidos', es.admitidos) +
          es.conRequisitos.map((r, i) => grupo('disp-g-req', 'Con requisitos', r.paises, r.requisito === es.requisito ? '' : '<p class="disp-grupo-txt">' + dos(r.requisito, en.conRequisitos[i].requisito) + '</p>')).join('') +
          grupo('disp-g-no', 'Países excluidos', es.excluidos) + '</div>' +
        (fuentes.length ? '<details class="disp-fuentes"><summary><span>Ver fuentes</span> <span class="disp-num">' + fuentes.length + '</span></summary><ol>' +
          fuentes.map(f => '<li><p class="disp-fuente-cab"><a href="' + esc(f.url) + '" target="_blank" rel="noopener nofollow"><span>' + esc(f.titulo) + '</span> ↗</a>' +
            (fechaES(f.consultadaEl) ? '<span class="disp-fecha">' + fechaES(f.consultadaEl) + '</span>' : '') + '</p>' +
            '<blockquote lang="und" translate="no">' + esc(f.literal) + '</blockquote></li>').join('') + '</ol></details>' : '')
        : '<p class="disp-nota">Esta oferta todavía no tiene la comprobación por país.</p>') +
      '<p class="disp-aviso">La disponibilidad depende de tu país de residencia, no de dónde te conectes. Compruébala siempre en la fuente antes de decidir.</p>' +
      '</section>';
  }

  /* Inicio, lo primero (27/11/2026): el país de residencia. Sin elegir, la pregunta con el detectado ya marcado y
     «Confirmar»; elegido, el país, cuántas ofertas están a su alcance y «Cambiar». Se ven todas las ofertas igual. */
  const bandera = c => /^[A-Z]{2}$/.test(c || '') ? String.fromCodePoint(...[...c].map(x => 0x1F1E6 + x.charCodeAt(0) - 65)) : '';
  /* Inicio (27/11/2026, versión compacta): una fila con la bandera, el país y «Cambiar ▾», y las cifras en una línea. */
  function inicioPaisHtml(ofertas) {
    const m = motor();
    if (!m) return '';
    const lista = Array.isArray(ofertas) ? ofertas : [];
    const n = e => lista.filter(o => estadoOferta(o).estado === e).length;
    const opciones = m.listaPaises('es').map(p => '<option value="' + p.codigo + '"' + (p.codigo === estado.codigo ? ' selected' : '') + '>' + esc(p.nombre) + '</option>').join('');
    const select = '<select data-ini-pais aria-label="Tu país de residencia">' + opciones + '</select>';
    const elegido = estado.origen === 'elegido';
    return '<section class="ini-pais' + (elegido ? ' ini-pais-elegido' : '') + '" aria-labelledby="iniPaisTit">' +
      (elegido
        ? '<div class="ini-pais-fila"><span class="ini-pais-bandera" aria-hidden="true">' + bandera(estado.codigo) + '</span>' +
          '<div class="ini-pais-cab"><p class="ini-pais-ante">Tu país de residencia</p><h2 id="iniPaisTit" class="ini-pais-nombre">' + esc(nombre()) + '</h2></div>' +
          '<label class="ini-pais-cambiar"><span>Cambiar</span>' + select + '</label></div>' +
          '<ul class="ini-pais-cifras"><li class="ini-cifra-ok"><b>' + n('disponible') + '</b> <span>Disponibles</span></li>' +
          '<li class="ini-cifra-req"><b>' + n('con_requisitos') + '</b> <span>Con requisitos</span></li>' +
          '<li><b>' + lista.length + '</b> <span>En el radar</span></li></ul>'
        : '<h2 id="iniPaisTit" class="ini-pais-pregunta">¿Cuál es tu país de residencia?</h2>' +
          '<p class="ini-pais-sub">Así te decimos qué ofertas están a tu alcance. Verás todas las ofertas del mundo igualmente.</p>' +
          '<div class="ini-pais-elegir"><label class="emis-pais-chip"><span class="emis-pais-globo" aria-hidden="true">◎</span>' + select + '</label>' +
          '<button type="button" class="b1 ini-pais-ok" data-ini-pais-ok>Confirmar</button></div>' +
          (estado.origen === 'detectado' ? '<p class="emis-pais-nota">Detectado por tu conexión. Si resides en otro país, cámbialo.</p>' : '')) +
      '</section>';
  }
  function montarInicio(caja) {
    if (!caja) return;
    const s = caja.querySelector('[data-ini-pais]'), b = caja.querySelector('[data-ini-pais-ok]');
    if (s) s.addEventListener('change', () => { if (estado.origen === 'elegido') elegir(s.value); });
    if (b) b.addEventListener('click', () => elegir(s ? s.value : estado.codigo));
  }

  /* Inicio: cuántas ofertas hay de cada país (el país de la oferta, no el del usuario). */
  function porPaisHtml(ofertas) {
    const m = motor();
    if (!m || !Array.isArray(ofertas) || !ofertas.length) return '';
    const cuenta = new Map();
    for (const o of ofertas) { const c = m.normalizarCodigo(o && o.pais); if (c) cuenta.set(c, (cuenta.get(c) || 0) + 1); }
    const filas = [...cuenta.keys()].sort((a, b) => m.nombrePais(a, 'es').localeCompare(m.nombrePais(b, 'es'), 'es'));
    if (!filas.length) return '';
    /* Bandera y nombre en chips que se deslizan de lado (27/11/2026, compacto); el país del usuario, el primero. */
    const orden = [...filas.filter(c => c === estado.codigo), ...filas.filter(c => c !== estado.codigo)];
    return '<section class="ini-por-pais" aria-labelledby="iniPorPaisTit"><h2 id="iniPorPaisTit">Ofertas por país</h2>' +
      '<p class="ini-por-pais-sub">Países donde se emiten u ofrecen las ofertas del radar.</p>' +
      '<ul class="ini-por-pais-lista">' + orden.map(c => '<li' + (c === estado.codigo ? ' class="es-tuyo"' : '') + '><span class="ini-por-pais-bandera" aria-hidden="true">' + bandera(c) + '</span><span class="ini-por-pais-nombre">' + esc(m.nombrePais(c, 'es')) + '</span></li>').join('') + '</ul></section>';
  }

  leerGuardado();
  if (typeof document !== 'undefined' && document.readyState === 'loading') document.addEventListener('DOMContentLoaded', detectar);
  else detectar();

  window.RWAdarPais = {
    codigo: () => estado.codigo, origen: () => estado.origen, nombre, elegir, alCambiar: f => { if (typeof f === 'function') oyentes.push(f); },
    estadoOferta, etiqueta, tieneReglas, accesible, pasaFiltro, soloAccesibles: () => soloAccesibles,
    ponerSoloAccesibles: v => { soloAccesibles = !!v; avisar(); },
    montarSelector, detalleHtml, porPaisHtml, inicioPaisHtml, montarInicio,
  };
})();

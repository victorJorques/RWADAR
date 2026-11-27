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
    caja.innerHTML =
      '<label class="emis-pais-campo"><span>Tu país de residencia</span><select id="emiPais" autocomplete="country">' + opciones + '</select></label>' +
      '<label class="emis-pais-filtro"><input type="checkbox" id="emiSoloPais"' + (soloAccesibles ? ' checked' : '') + '> <span>Solo las disponibles en tu país</span></label>' +
      (estado.origen === 'detectado' ? '<p class="emis-pais-nota">Detectado por tu conexión. Si resides en otro país, cámbialo.</p>' : '');
    const s = caja.querySelector('#emiPais'), f = caja.querySelector('#emiSoloPais');
    if (s) s.addEventListener('change', () => elegir(s.value));
    if (f) f.addEventListener('change', () => { soloAccesibles = !!f.checked; avisar(); });
  }

  /* La ficha ampliada: qué dicen las fuentes del país elegido y de los demás. */
  function detalleHtml(o) {
    const m = motor();
    if (!m) return '';
    const es = m.detalleDisponibilidad(o, estado.codigo, 'es'), en = m.detalleDisponibilidad(o, estado.codigo, 'en');
    const dos = (a, b) => a === b ? esc(a) : '<span data-es lang="es">' + esc(a) + '</span><span data-en lang="en">' + esc(b) + '</span>';
    const lista = (titulo, nombres) => nombres.length ? '<div><dt>' + titulo + '</dt><dd><ul class="disp-pais-lista">' + nombres.map(n => '<li>' + esc(n) + '</li>').join('') + '</ul></dd></div>' : '';
    const reglas = tieneReglas(o);
    return '<details class="escaparate-dialogo-seccion escaparate-detalle-ampliable disp-pais" open>' +
      '<summary>Disponibilidad por país</summary>' +
      '<p class="disp-pais-estado disp-' + es.estado + '"><b>' + esc(es.nombre) + '</b> <span>' + esc(es.texto) + '</span></p>' +
      (es.requisito ? '<p class="disp-pais-requisito"><span>Requisito:</span> ' + dos(es.requisito, en.requisito) + '</p>' : '') +
      (es.estado === 'sin_confirmar' ? '<p class="disp-pais-sin">No hay información oficial suficiente para tu país. No suponemos que esté disponible solo porque no aparezca excluido.</p>' : '') +
      (reglas ? (es.nota ? '<p class="disp-pais-nota">' + dos(es.nota, en.nota) + '</p>' : '') +
        '<dl class="disp-pais-reglas">' + lista('Países admitidos', es.admitidos) + lista('Países excluidos', es.excluidos) +
        es.conRequisitos.map((r, i) => lista('Con requisitos', r.paises) + '<div><dt>Requisito</dt><dd>' + dos(r.requisito, en.conRequisitos[i].requisito) + '</dd></div>').join('') + '</dl>' +
        (es.fuentes.length ? '<h4>Fuentes de la disponibilidad</h4><ul class="disp-pais-fuentes">' : '') + es.fuentes.map(f => https(f.url) ?
          '<li><a href="' + esc(f.url) + '" target="_blank" rel="noopener nofollow"><span>' + esc(f.titulo) + '</span> ↗</a>' +
          (fechaES(f.consultadaEl) ? ' · <span>Consultada el</span> ' + fechaES(f.consultadaEl) : '') +
          '<blockquote lang="und" translate="no">' + esc(f.literal) + '</blockquote></li>' : '').join('') + (es.fuentes.length ? '</ul>' : '') +
        (fechaES(es.verificadaEl) ? '<p class="disp-pais-fecha"><span>Disponibilidad comprobada el</span> ' + fechaES(es.verificadaEl) + '</p>' : '')
        : '<p class="disp-pais-nota">Esta oferta todavía no tiene la comprobación por país.</p>') +
      '<p class="disp-pais-aviso">La disponibilidad depende de tu país de residencia, no de dónde te conectes. Compruébala siempre en la fuente antes de decidir.</p>' +
      '</details>';
  }

  /* Inicio: cuántas ofertas hay de cada país (el país de la oferta, no el del usuario). */
  function porPaisHtml(ofertas) {
    const m = motor();
    if (!m || !Array.isArray(ofertas) || !ofertas.length) return '';
    const cuenta = new Map();
    for (const o of ofertas) { const c = m.normalizarCodigo(o && o.pais); if (c) cuenta.set(c, (cuenta.get(c) || 0) + 1); }
    const filas = [...cuenta.entries()].sort((a, b) => b[1] - a[1] || m.nombrePais(a[0], 'es').localeCompare(m.nombrePais(b[0], 'es'), 'es'));
    if (!filas.length) return '';
    return '<section class="ini-por-pais wrap" aria-labelledby="iniPorPaisTit"><h2 id="iniPorPaisTit">Ofertas por país</h2>' +
      '<p class="ini-por-pais-sub"><span>' + ofertas.length + ' ofertas de ' + filas.length + ' países, según dónde se emiten u ofrecen.</span></p>' +
      '<ul class="ini-por-pais-lista">' + filas.map(([c, n]) => '<li><span class="ini-por-pais-nombre">' + esc(m.nombrePais(c, 'es')) + '</span><b>' + n + '</b></li>').join('') + '</ul></section>';
  }

  leerGuardado();
  if (typeof document !== 'undefined' && document.readyState === 'loading') document.addEventListener('DOMContentLoaded', detectar);
  else detectar();

  window.RWAdarPais = {
    codigo: () => estado.codigo, origen: () => estado.origen, nombre, elegir, alCambiar: f => { if (typeof f === 'function') oyentes.push(f); },
    estadoOferta, etiqueta, tieneReglas, accesible, pasaFiltro, soloAccesibles: () => soloAccesibles,
    montarSelector, detalleHtml, porPaisHtml,
  };
})();

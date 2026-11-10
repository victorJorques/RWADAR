'use strict';
/* =====================================================================
   RWAdar · «La tokenización en el mundo» en Inicio (10/11/2026)
   ---------------------------------------------------------------------
   Pinta la sección #tokenizacion con lo que devuelve /api/tokenizacion
   (nuestro servidor lee CoinGecko; el navegador no habla con nadie más):
   - la cifra grande del valor total;
   - una cápsula por periodo (24 h · 7 días · 30 días · 1 año · Total), con
     flecha, signo y color (verde sube, rojo baja; nunca solo el color);
   - una barra por tipo de activo con su cuota y su cambio en 24 h;
   - la línea de evolución con las fotos diarias guardadas (con dos o más);
   - y, para lectores de pantalla, las mismas cifras en dos tablas.
   Si el servidor no responde, usa el histórico estático del despliegue
   (/datos/tokenizacion-historico.json) con su fecha; si tampoco, un estado
   vacío honesto. Ninguna cifra se inventa. Todo se escribe con
   textContent, así que ningún dato puede meter marcado.
   Los textos van en castellano y los traduce idioma-web con
   lib/idioma-en.js; las cifras se escriben en el formato de cada idioma
   (rwadar-movil/lib/tokenizacion.js, copiado en tokenizacion-modelo).
   ===================================================================== */
(() => {
  const modelo = globalThis.RWAdarTokenizacionModelo;
  const RUTA_API = '/api/tokenizacion', RUTA_HISTORICO = '/datos/tokenizacion-historico.json', PLAZO_MS = 10000;
  const SVG = 'http://www.w3.org/2000/svg';
  const FLECHA = { sube: '▲', baja: '▼', igual: '=' };
  let seccion, cuerpo, hora, datos, suscrito = false;

  const idioma = () => (globalThis.RWAdarIdioma?.obtenerIdioma?.() === 'en' ? 'en' : 'es');
  function el(etiqueta, clase, texto) {
    const n = document.createElement(etiqueta);
    if (clase) n.className = clase;
    if (texto !== undefined) n.textContent = texto;
    return n;
  }
  function svg(etiqueta, atributos) {
    const n = document.createElementNS(SVG, etiqueta);
    for (const [k, v] of Object.entries(atributos)) n.setAttribute(k, String(v));
    return n;
  }
  const finito = v => typeof v === 'number' && Number.isFinite(v);

  async function pedir(url) {
    const abort = new AbortController(), reloj = setTimeout(() => abort.abort(), PLAZO_MS);
    try {
      const r = await fetch(url, { credentials: 'omit', cache: 'no-store', headers: { Accept: 'application/json' }, signal: abort.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } finally { clearTimeout(reloj); }
  }
  /* Solo se pinta lo que tiene la forma esperada (la misma regla que la app). */
  const valido = d => modelo.resumenValido(d);
  async function cargar() {
    try { const d = await pedir(RUTA_API); if (valido(d)) return d; } catch { /* se prueba la copia estática */ }
    try {
      const d = modelo.resumir({ historico: await pedir(RUTA_HISTORICO) });
      if (valido(d) && d.fuente !== 'sin-datos') return d;
    } catch { /* estado vacío */ }
    return null;
  }

  function cambio(p, conTexto) {
    const dir = modelo.direccion(p), n = el('span', 'tk-cambio tk-' + dir);
    if (dir === 'sin-datos') { n.textContent = '—'; return n; }
    n.append(el('span', 'tk-flecha', FLECHA[dir]), el('span', 'tk-cifra', modelo.porcentaje(p, idioma())));
    n.firstChild.setAttribute('aria-hidden', 'true');
    if (conTexto) n.append(' ', el('span', 'tk-cambio-etq', 'en 24 h'));
    return n;
  }
  function periodos(d) {
    const lista = el('ul', 'tk-periodos');
    lista.setAttribute('aria-hidden', 'true');
    for (const p of d.periodos) {
      const dir = p.estado === 'ok' ? modelo.direccion(p.cambio) : 'sin-datos';
      const li = el('li', 'tk-periodo tk-' + dir);
      li.append(el('span', 'tk-periodo-nom', p.nombre));
      if (dir === 'sin-datos') li.append(el('span', 'tk-periodo-cifra', '—'), el('span', 'tk-periodo-nota', 'aún sin datos'));
      else {
        // Signo en la cifra; flecha y palabra debajo: el color nunca va solo.
        const nota = el('span', 'tk-periodo-nota');
        nota.append(el('span', 'tk-flecha', FLECHA[dir]), ' ', el('span', '', dir === 'sube' ? 'sube' : dir === 'baja' ? 'baja' : 'sin cambios'));
        li.append(el('span', 'tk-periodo-cifra', modelo.porcentaje(p.cambio, idioma())), nota);
      }
      lista.append(li);
    }
    return lista;
  }
  function tipos(d) {
    const lista = el('ul', 'tk-tipos');
    lista.setAttribute('aria-hidden', 'true');
    for (const t of d.tipos) {
      const li = el('li', 'tk-tipo');
      const cab = el('div', 'tk-tipo-cab');
      cab.append(el('span', 'tk-tipo-nom', t.nombre), el('span', 'tk-tipo-valor', modelo.millones(t.valor, idioma())));
      const barra = el('div', 'tk-barra'), relleno = el('span', 'tk-barra-relleno');
      // CSSOM, no un atributo style: la CSP sigue sin 'unsafe-inline'.
      relleno.style.setProperty('--tk-ancho', Math.max(1.5, Math.min(100, t.cuota)).toFixed(2) + '%');
      barra.append(relleno);
      const pie = el('div', 'tk-tipo-pie');
      const cuota = el('span', 'tk-tipo-cuota');
      cuota.append(el('b', '', modelo.cuota(t.cuota, idioma())), ' ', el('span', '', 'del total'));
      pie.append(cuota, cambio(t.cambio24h, true));
      li.append(cab, barra, pie);
      if (t.clave === 'materias-primas' && d.oro && finito(d.oro.valor)) {
        const oro = el('p', 'tk-tipo-oro');
        oro.append(el('span', '', 'De ello, oro:'), ' ', el('b', '', modelo.millones(d.oro.valor, idioma())));
        li.append(oro);
      }
      lista.append(li);
    }
    return lista;
  }
  function linea(d) {
    const caja = el('div', 'tk-linea');
    const serie = d.serie.filter(p => /^\d{4}-\d{2}-\d{2}$/.test(p.fecha));
    if (serie.length < 2) {
      caja.append(el('p', 'tk-nota', 'La línea de evolución aparecerá cuando haya dos fotos diarias guardadas.'));
      return caja;
    }
    const W = 320, H = 112, M = 8;
    const t = serie.map(p => Date.parse(p.fecha + 'T00:00:00Z')), v = serie.map(p => p.valor);
    const t0 = t[0], t1 = t[t.length - 1], min = Math.min(...v), max = Math.max(...v);
    const x = i => M + (t1 > t0 ? (t[i] - t0) / (t1 - t0) : 0) * (W - 2 * M);
    const y = i => H - M - (max > min ? (v[i] - min) / (max - min) : 0.5) * (H - 2 * M);
    const puntos = serie.map((_, i) => x(i).toFixed(1) + ',' + y(i).toFixed(1));
    const dibujo = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'tk-linea-svg', role: 'img', focusable: 'false' });
    const ini = modelo.fechaCorta(serie[0].fecha), fin = modelo.fechaCorta(serie[serie.length - 1].fecha);
    const v0 = modelo.millones(v[0], idioma()), v1 = modelo.millones(v[v.length - 1], idioma());
    dibujo.setAttribute('aria-label', idioma() === 'en'
      ? `Total value from ${ini} to ${fin}: from ${v0} to ${v1}, ${serie.length} daily snapshots`
      : `Valor total del ${ini} al ${fin}: de ${v0} a ${v1}, ${serie.length} fotos diarias`);
    dibujo.append(svg('path', { class: 'tk-linea-area', d: `M${x(0).toFixed(1)},${H - M} L${puntos.join(' L')} L${x(serie.length - 1).toFixed(1)},${H - M} Z` }),
      svg('polyline', { class: 'tk-linea-trazo', points: puntos.join(' ') }),
      svg('circle', { class: 'tk-linea-punto', cx: x(serie.length - 1).toFixed(1), cy: y(serie.length - 1).toFixed(1), r: 4 }));
    const eje = el('div', 'tk-linea-eje');
    eje.setAttribute('aria-hidden', 'true');
    eje.append(el('span', '', ini), el('span', '', fin));
    caja.append(dibujo, eje);
    return caja;
  }
  function tablas(d) {
    const caja = el('div', 'solo-lector');
    const t1 = el('table'); t1.append(el('caption', '', 'Cambio del valor total por periodo'));
    const c1 = el('tr'); c1.append(el('th', '', 'Periodo'), el('th', '', 'Cambio'), el('th', '', 'Desde'));
    t1.append(c1);
    for (const p of d.periodos) {
      const fila = el('tr'), ok = p.estado === 'ok' && finito(p.cambio);
      fila.append(el('th', '', p.nombre), el('td', '', ok ? modelo.porcentaje(p.cambio, idioma()) : 'aún sin datos'),
        el('td', '', p.desde ? modelo.fechaCorta(p.desde) : '—'));
      fila.firstChild.setAttribute('scope', 'row');
      t1.append(fila);
    }
    const t2 = el('table'); t2.append(el('caption', '', 'Valor por tipo de activo'));
    const c2 = el('tr'); c2.append(el('th', '', 'Tipo de activo'), el('th', '', 'Valor'), el('th', '', 'Cuota del total'), el('th', '', 'Cambio en 24 h'));
    t2.append(c2);
    for (const t of d.tipos) {
      const fila = el('tr');
      fila.append(el('th', '', t.nombre), el('td', '', modelo.millones(t.valor, idioma())), el('td', '', modelo.cuota(t.cuota, idioma())),
        el('td', '', modelo.porcentaje(t.cambio24h, idioma())));
      fila.firstChild.setAttribute('scope', 'row');
      t2.append(fila);
    }
    for (const fila of [c1, c2]) for (const th of fila.children) th.setAttribute('scope', 'col');
    caja.append(t1, t2);
    return caja;
  }

  function pintar() {
    if (!cuerpo) return;
    // El motor de idioma carga después que este script (defer, en orden): la
    // suscripción se hace al pintar, cuando ya existe, para repintar las cifras
    // en el formato del idioma elegido.
    if (!suscrito && globalThis.RWAdarIdioma?.suscribirIdioma) { suscrito = true; globalThis.RWAdarIdioma.suscribirIdioma(pintar); }
    const d = datos;
    cuerpo.replaceChildren();
    cuerpo.removeAttribute('aria-busy');
    hora.replaceChildren();
    seccion.dataset.tokenizacionEstado = d ? d.fuente : 'sin-datos';
    if (!d || d.fuente === 'sin-datos') {
      cuerpo.append(el('p', 'tk-estado', 'Ahora no podemos mostrar los datos de CoinGecko. Vuelve a intentarlo más tarde.'));
      return;
    }
    if (d.fuente === 'foto-guardada') {
      const aviso = el('p', 'tk-aviso');
      aviso.append(el('span', '', 'CoinGecko no responde ahora. Enseñamos la última foto guardada, del'), ' ',
        el('b', '', modelo.horaDato(d.actualizado)));
      cuerpo.append(aviso);
    }
    const total = el('div', 'tk-total');
    // «49.684 M$»: la unidad, más pequeña, para que la cifra se lea de un vistazo.
    const [cifraTotal, unidad] = modelo.millones(d.total.valor, idioma()).split('\u00a0');
    const grande = el('span', 'tk-total-cifra', cifraTotal);
    if (unidad) grande.append(el('span', 'tk-total-unidad', '\u00a0' + unidad));
    total.append(grande,
      el('span', 'tk-total-etq', 'Valor total de los activos tokenizados'));
    cuerpo.append(total, periodos(d));
    if (d.periodos.some(p => p.clave !== '24h' && p.estado !== 'ok')) {
      const nota = el('p', 'tk-nota');
      nota.append(el('span', '', 'Los periodos sin datos se rellenarán solos con las fotos diarias que guarda RWAdar desde el'), ' ',
        el('b', '', modelo.fechaCorta(d.guardadoDesde || d.fecha)));
      cuerpo.append(nota);
    }
    const graficos = el('div', 'tk-graficos');
    const porTipo = el('div', 'tk-bloque'), evolucion = el('div', 'tk-bloque');
    porTipo.append(el('h3', 'tk-h3', 'Por tipo de activo'), tipos(d));
    evolucion.append(el('h3', 'tk-h3', 'Evolución del valor total'), linea(d));
    graficos.append(porTipo, evolucion);
    cuerpo.append(graficos, tablas(d));
    hora.append(' · ', el('span', '', d.fuente === 'coingecko' ? 'Dato del' : 'Foto guardada del'), ' ',
      el('time', '', modelo.horaDato(d.actualizado)));
    hora.lastChild.dateTime = d.actualizado;
  }

  async function iniciar() {
    seccion = document.querySelector('[data-tokenizacion]');
    cuerpo = document.getElementById('tkCuerpo');
    hora = document.getElementById('tkHora');
    if (!seccion || !cuerpo || !hora || !modelo) return;
    datos = await cargar();
    pintar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  else iniciar();
})();

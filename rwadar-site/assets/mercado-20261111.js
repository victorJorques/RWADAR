'use strict';
/* =====================================================================
   RWAdar · «Mercado y noticias» al estilo de una app de bolsa (11/11/2026)
   ---------------------------------------------------------------------
   Pinta [data-mercado] con dos lecturas de nuestro propio despliegue (el
   navegador no habla con nadie más):
   - /api/tokenizacion: el dato de hoy en vivo (nuestro servidor lee
     CoinGecko) y los tipos; si falla, la última foto diaria guardada
     (/datos/tokenizacion-historico.json), con su fecha;
   - /datos/tokenizacion-serie.json: la serie diaria de un año, suma de los
     40 mayores tokens de la categoría (rwadar-app/tokenizacion/serie-diaria.mjs).
   Dos modos:
   - data-mercado="completo" (/mercado/): el nombre, la cifra grande y el
     cambio del periodo (signo, flecha y texto: el color nunca va solo),
     pestañas 1 S · 1 M · 3 M · 6 M · YTD · 1 A (1 M por defecto), el gráfico
     de área SVG propio (eje de valores a la derecha, fechas abajo, rejilla
     suave, línea de puntos en el valor de partida y una cruz con la fecha y
     el valor al pasar el ratón, al arrastrar el dedo o con las flechas del
     teclado), su tabla para lectores de pantalla, los datos clave y las
     barras por tipo. Las noticias, debajo, las pinta noticias-sector.
   - data-mercado="inicio": la tarjeta tipo cotización de Inicio (nombre,
     cifra, cambio del mes y un minigráfico del último mes), que lleva a
     /mercado/.
   Todos los cálculos están en rwadar-movil/lib/tokenizacion.js (copiado en
   tokenizacion-modelo): aquí solo se dibuja. Ninguna cifra se inventa.
   Los textos se escriben ya en el idioma elegido (translate="no") y se
   repintan al cambiarlo. Todo con textContent y atributos: sin marcado de
   los datos y sin estilos en línea (la CSP no lleva 'unsafe-inline').
   ===================================================================== */
(() => {
  const modelo = globalThis.RWAdarTokenizacionModelo;
  const RUTA_API = '/api/tokenizacion', RUTA_HISTORICO = '/datos/tokenizacion-historico.json';
  const RUTA_SERIE = '/datos/tokenizacion-serie.json', PLAZO_MS = 10000;
  const SVG = 'http://www.w3.org/2000/svg';
  const FLECHA = { sube: '▲', baja: '▼', igual: '=' };
  let raiz, modo, vivo = null, serie = null, pestana = null, suscrito = false, cruz = null, quitarRedimension = null;
  // Tras un toque, la cruz se queda 3 s (o hasta otro toque fuera del gráfico).
  const CRUZ_FIJA_MS = 3000;
  let cruzFija = null, tactil = null;

  const idioma = () => (globalThis.RWAdarIdioma?.obtenerIdioma?.() === 'en' ? 'en' : 'es');
  const tx = (es, en) => (idioma() === 'en' ? en : es);
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
  const finito = v => typeof v === 'number' && Number.isFinite(v);

  async function pedir(url) {
    const abort = new AbortController(), reloj = setTimeout(() => abort.abort(), PLAZO_MS);
    try {
      const r = await fetch(url, { credentials: 'omit', cache: 'no-cache', headers: { Accept: 'application/json' }, signal: abort.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } finally { clearTimeout(reloj); }
  }
  async function cargarVivo() {
    try { const d = await pedir(RUTA_API); if (modelo.resumenValido(d) && d.fuente !== 'sin-datos') return d; } catch { /* la copia estática */ }
    try {
      const d = modelo.resumir({ historico: await pedir(RUTA_HISTORICO) });
      if (modelo.resumenValido(d) && d.fuente !== 'sin-datos') return d;
    } catch { /* sin dato de hoy */ }
    return null;
  }
  async function cargarSerie() {
    try { const s = await pedir(RUTA_SERIE); return modelo.serieValida(s) ? modelo.validarSerie(s) : null; } catch { return null; }
  }

  /* ---- Piezas comunes ---- */
  const nombrePestana = clave => modelo.PESTANAS.find(p => p.clave === clave);
  function cambio(g, clase) {
    const n = el('span', 'mk-cambio mk-' + g.direccion + (clase ? ' ' + clase : ''));
    const f = el('span', 'mk-flecha', FLECHA[g.direccion] || '');
    f.setAttribute('aria-hidden', 'true');
    n.append(f, el('span', 'mk-cambio-cifra', g.cambioTexto));
    return n;
  }
  function cifraGrande(valor, clase) {
    const caja = el('p', clase);
    const [cifra, unidad] = modelo.millones(valor, idioma()).split(' ');
    const grande = el('span', 'mk-cifra-num', cifra);
    if (unidad) grande.append(el('span', 'mk-cifra-unidad', ' ' + unidad));
    grande.setAttribute('aria-hidden', 'true');
    caja.append(grande, el('span', 'solo-lector', modelo.millonesHablados(valor, idioma())));
    return caja;
  }
  function valorHoy() {
    if (vivo?.total) return { valor: vivo.total.valor, en: vivo.actualizado, fuente: vivo.fuente };
    const ultimo = serie?.puntos.at(-1);
    return ultimo ? { valor: ultimo.valor, en: null, fuente: 'serie' } : null;
  }
  // La serie vieja (más de 3 días antes del dato de hoy) no pone su cambio al lado de la cifra en vivo.
  const atrasada = () => !!(vivo && serie && modelo.serieAtrasada(serie, vivo.actualizado));
  const avisoAtrasada = () => tx('Serie hasta el ', 'Series to ') + modelo.fechaCorta(serie.puntos.at(-1).fecha, idioma()) +
    tx(': el cambio del periodo no se pone junto a la cifra de hoy.', ": the period change isn't shown next to today's figure.");
  function lineaFuente({ conSerie = true } = {}) {
    const p = el('p', 'mk-fuente');
    p.append(el('span', '', tx('Datos:', 'Data:')), ' ');
    const a = el('a', '', 'CoinGecko');
    a.href = modelo.FUENTE.url; a.target = '_blank'; a.rel = 'noopener nofollow';
    p.append(a);
    if (vivo) {
      const cuando = el('time', '', modelo.horaDato(vivo.actualizado, idioma()));
      cuando.dateTime = vivo.actualizado;
      p.append(' · ', el('span', '', vivo.fuente === 'coingecko' ? tx('dato de hoy del', "today's figure from") : tx('última foto guardada, del', 'last saved snapshot, from')), ' ', cuando);
    }
    if (serie && conSerie) p.append(' · ', el('span', '', tx('serie diaria hasta el', 'daily series to') + ' ' + modelo.fechaCorta(serie.puntos.at(-1).fecha, idioma())));
    return p;
  }

  /* ---- El gráfico de área ---- */
  function dibujarGrafico(caja, g) {
    const ancho = Math.round(caja.clientWidth);
    if (ancho < 120) return;
    const escritorio = matchMedia('(min-width:768px)').matches;
    const EJE = escritorio ? 64 : 54, ALTO = escritorio ? 300 : 240, ARRIBA = 10, ABAJO = 28;
    const PW = ancho - EJE, PH = ALTO - ARRIBA - ABAJO;
    const coords = modelo.coordenadas(g, PW, PH).map(c => ({ x: c.x, y: c.y + ARRIBA }));
    const yDe = v => ARRIBA + PH - (v - g.escala.lo) / (g.escala.hi - g.escala.lo) * PH;
    const dibujo = svg('svg', { width: ancho, height: ALTO, viewBox: `0 0 ${ancho} ${ALTO}`, class: 'mk-svg', 'aria-hidden': 'true', focusable: 'false' });
    const id = 'mkDeg' + Math.random().toString(36).slice(2, 8);
    const defs = svg('defs'), deg = svg('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 });
    deg.append(svg('stop', { offset: '0', class: 'mk-stop', 'stop-opacity': '0.34' }), svg('stop', { offset: '1', class: 'mk-stop', 'stop-opacity': '0' }));
    defs.append(deg);
    dibujo.append(defs);
    // Rejilla muy suave: una raya por marca de valor y por fecha.
    const rejilla = svg('g', { class: 'mk-rejilla' });
    for (const m of g.marcasValores) {
      const y = yDe(m.valor);
      rejilla.append(svg('line', { x1: 0, x2: PW, y1: y.toFixed(1), y2: y.toFixed(1) }));
    }
    for (const m of g.marcasFechas) {
      const x = coords[m.indice].x;
      rejilla.append(svg('line', { x1: x.toFixed(1), x2: x.toFixed(1), y1: ARRIBA, y2: ARRIBA + PH }));
    }
    rejilla.append(svg('line', { class: 'mk-suelo', x1: 0, x2: ancho, y1: ARRIBA + PH, y2: ARRIBA + PH }));
    dibujo.append(rejilla);
    // El área (degradado del color de la línea a transparente) y la línea de 2 px.
    // Tramo a tramo: donde falta un día, la línea se corta (no se une con una recta).
    // El área de fondo no se corta; el hueco se une con un trazo de puntos tenue.
    const { linea: trazo, area, puentes } = modelo.trazosSvg(coords, modelo.tramosSeguidos(g), ARRIBA + PH);
    dibujo.append(svg('path', { class: 'mk-area', d: area, fill: `url(#${id})` }));
    if (puentes) dibujo.append(svg('path', { class: 'mk-puente', d: puentes }));
    // La línea de puntos con el valor de partida del periodo, como en bolsa.
    const yBase = yDe(g.estadisticas.inicio);
    dibujo.append(svg('line', { class: 'mk-base', x1: 0, x2: PW, y1: yBase.toFixed(1), y2: yBase.toFixed(1) }));
    dibujo.append(svg('path', { class: 'mk-linea', d: trazo }));
    // Ejes: valores a la derecha, fechas abajo.
    const textos = svg('g', { class: 'mk-eje' });
    for (const m of g.marcasValores) {
      const t = svg('text', { x: PW + 8, y: (yDe(m.valor) + 4).toFixed(1) });
      t.textContent = m.texto;
      textos.append(t);
    }
    const unidad = svg('text', { class: 'mk-eje-unidad', x: ancho - 2, y: ALTO - 9, 'text-anchor': 'end' });
    unidad.textContent = idioma() === 'en' ? '$M' : 'M$';
    textos.append(unidad);
    g.marcasFechas.forEach(m => {
      const x = coords[m.indice].x;
      const anclaje = x < 24 ? 'start' : x > PW - 24 ? 'end' : 'middle';
      const t = svg('text', { x: x.toFixed(1), y: ALTO - 9, 'text-anchor': anclaje });
      t.textContent = m.texto;
      textos.append(t);
    });
    dibujo.append(textos);
    // La cruz: una raya vertical, una horizontal y el punto. Oculta hasta que se usa.
    const grupo = svg('g', { class: 'mk-cruz', visibility: 'hidden' });
    const v = svg('line', { y1: ARRIBA, y2: ARRIBA + PH }), h = svg('line', { x1: 0, x2: PW }), punto = svg('circle', { r: 5 });
    grupo.append(v, h, punto);
    dibujo.append(grupo);
    caja.querySelector('.mk-svg')?.remove();
    caja.prepend(dibujo);
    cruz = { coords, grupo, v, h, punto, PW, ancho, g };
  }

  function ponerCruz(caja, burbuja, i) {
    if (!cruz) return;
    const { coords, grupo, v, h, punto, PW, ancho, g } = cruz;
    const k = Math.max(0, Math.min(coords.length - 1, i)), c = coords[k], p = g.puntos[k];
    v.setAttribute('x1', c.x.toFixed(1)); v.setAttribute('x2', c.x.toFixed(1));
    h.setAttribute('y1', c.y.toFixed(1)); h.setAttribute('y2', c.y.toFixed(1));
    punto.setAttribute('cx', c.x.toFixed(1)); punto.setAttribute('cy', c.y.toFixed(1));
    grupo.setAttribute('visibility', 'visible');
    const lengua = idioma();
    const desdeInicio = modelo.porcentaje(modelo.cambioPct(p.valor, g.estadisticas.inicio), lengua);
    burbuja.replaceChildren(el('span', 'mk-burbuja-fecha', modelo.fechaCorta(p.fecha, lengua)), el('b', 'mk-burbuja-valor', modelo.millones(p.valor, lengua)),
      el('span', 'mk-burbuja-cambio', desdeInicio + ' ' + tx('desde el inicio', 'since start')));
    burbuja.hidden = false;
    // La burbuja sigue a la cruz sin salirse del gráfico (CSSOM, sin style en línea).
    const anchoB = burbuja.offsetWidth || 150;
    burbuja.style.setProperty('--mk-x', Math.max(0, Math.min(Math.max(0, PW - anchoB), c.x - anchoB / 2)).toFixed(0) + 'px');
    caja.setAttribute('aria-valuenow', String(k));
    caja.setAttribute('aria-valuetext', `${modelo.fechaCorta(p.fecha, lengua)}: ${modelo.millonesHablados(p.valor, lengua)}`);
    caja.dataset.indice = String(k);
    void ancho;
  }
  function quitarCruz(caja, burbuja) {
    clearTimeout(cruzFija); cruzFija = null; tactil = null;
    cruz?.grupo.setAttribute('visibility', 'hidden');
    burbuja.hidden = true;
    delete caja.dataset.indice;
  }

  function graficoInteractivo(g) {
    const marco = el('div', 'mk-graf-marco mk-' + g.direccion);
    const caja = el('div', 'mk-graf');
    caja.tabIndex = 0;
    caja.setAttribute('role', 'slider');
    caja.setAttribute('aria-orientation', 'horizontal');
    caja.setAttribute('aria-label', tx('Gráfico del mercado', 'Market chart') + ', ' + g.periodoTexto + '. ' + g.etiqueta + ' ' +
      tx('Usa las flechas para recorrer los días.', 'Use the arrow keys to move through the days.'));
    caja.setAttribute('aria-valuemin', '0');
    caja.setAttribute('aria-valuemax', String(g.puntos.length - 1));
    caja.setAttribute('aria-valuenow', String(g.puntos.length - 1));
    caja.setAttribute('aria-valuetext', `${modelo.fechaCorta(g.puntos.at(-1).fecha, idioma())}: ${modelo.millonesHablados(g.puntos.at(-1).valor, idioma())}`);
    const burbuja = el('div', 'mk-burbuja');
    burbuja.hidden = true;
    burbuja.setAttribute('aria-hidden', 'true');
    caja.append(burbuja);
    marco.append(caja);
    const indiceEn = ev => {
      const r = caja.getBoundingClientRect();
      return modelo.indiceCercano(cruz?.coords || [], ev.clientX - r.left);
    };
    let tocando = false;
    caja.addEventListener('pointerdown', ev => { tocando = true; clearTimeout(cruzFija); ponerCruz(caja, burbuja, indiceEn(ev)); });
    caja.addEventListener('pointermove', ev => { if (ev.pointerType === 'mouse' || tocando) ponerCruz(caja, burbuja, indiceEn(ev)); });
    // Ratón: la cruz se va al salir. Dedo o lápiz: al soltar se queda 3 s (o hasta tocar fuera), para poder leerla.
    const soltar = ev => {
      tocando = false;
      if (ev.pointerType === 'mouse') { if (ev.type === 'pointerleave') quitarCruz(caja, burbuja); return; }
      if (ev.type === 'pointerleave') return;
      if (ev.type === 'pointercancel') { quitarCruz(caja, burbuja); return; }
      clearTimeout(cruzFija);
      tactil = { caja, burbuja };
      cruzFija = setTimeout(() => quitarCruz(caja, burbuja), CRUZ_FIJA_MS);
    };
    caja.addEventListener('pointerup', soltar);
    caja.addEventListener('pointercancel', soltar);
    caja.addEventListener('pointerleave', soltar);
    caja.addEventListener('keydown', ev => {
      const n = g.puntos.length, i = caja.dataset.indice === undefined ? n - 1 : Number(caja.dataset.indice);
      const paso = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -7, PageUp: 7 }[ev.key];
      if (paso !== undefined) { ev.preventDefault(); ponerCruz(caja, burbuja, i + paso); }
      else if (ev.key === 'Home') { ev.preventDefault(); ponerCruz(caja, burbuja, 0); }
      else if (ev.key === 'End') { ev.preventDefault(); ponerCruz(caja, burbuja, n - 1); }
      else if (ev.key === 'Escape') quitarCruz(caja, burbuja);
    });
    caja.addEventListener('focus', () => { if (caja.matches(':focus-visible')) ponerCruz(caja, burbuja, g.puntos.length - 1); });
    caja.addEventListener('blur', () => quitarCruz(caja, burbuja));
    requestAnimationFrame(() => dibujarGrafico(caja, g));
    quitarRedimension?.();
    let ultimoAncho = 0;
    const ro = new ResizeObserver(() => {
      const a = Math.round(caja.clientWidth);
      if (a !== ultimoAncho) { ultimoAncho = a; dibujarGrafico(caja, g); quitarCruz(caja, burbuja); }
    });
    ro.observe(caja);
    quitarRedimension = () => ro.disconnect();
    return marco;
  }

  /* La misma serie en una tabla, para lectores de pantalla. */
  function tablaSerie(g) {
    const caja = el('div', 'solo-lector');
    const t = el('table');
    t.append(el('caption', '', tx('Valor diario, ', 'Daily value, ') + g.periodoTexto + tx(' (suma de los mayores tokens)', ' (sum of the largest tokens)')));
    const cab = el('tr');
    cab.append(el('th', '', tx('Fecha', 'Date')), el('th', '', tx('Valor', 'Value')));
    for (const th of cab.children) th.setAttribute('scope', 'col');
    t.append(cab);
    for (const p of g.puntos) {
      const fila = el('tr');
      fila.append(el('th', '', modelo.fechaCorta(p.fecha, idioma())), el('td', '', modelo.millones(p.valor, idioma())));
      fila.firstChild.setAttribute('scope', 'row');
      t.append(fila);
    }
    caja.append(t);
    return caja;
  }

  function datosClave(g) {
    const lista = el('dl', 'mk-clave');
    const fila = (rotulo, valor, extra, texto = false) => {
      const d = el('div', 'mk-clave-item' + (texto ? ' mk-clave-texto' : ''));
      d.append(el('dt', '', rotulo));
      const dd = el('dd');
      if (valor instanceof Node) dd.append(valor); else dd.append(el('span', '', valor));
      if (extra) dd.append(el('small', '', extra));
      d.append(dd);
      lista.append(d);
    };
    const hoy = valorHoy(), lengua = idioma();
    fila(tx('Valor total hoy', 'Total value today'), hoy ? modelo.millones(hoy.valor, lengua) : '—');
    if (vivo && finito(vivo.total.cambio24h)) {
      const dir = modelo.direccion(vivo.total.cambio24h);
      const c = el('span', 'mk-cambio mk-' + dir);
      const f = el('span', 'mk-flecha', FLECHA[dir] || ''); f.setAttribute('aria-hidden', 'true');
      c.append(f, el('span', '', modelo.porcentaje(vivo.total.cambio24h, lengua)));
      fila(tx('Cambio en 24 h', '24 h change'), c);
    } else fila(tx('Cambio en 24 h', '24 h change'), '—');
    if (g) {
      const e = g.estadisticas;
      fila(tx('Máximo del periodo', 'Period high'), modelo.millones(e.max.valor, lengua), modelo.fechaCorta(e.max.fecha, lengua));
      fila(tx('Mínimo del periodo', 'Period low'), modelo.millones(e.min.valor, lengua), modelo.fechaCorta(e.min.fecha, lengua));
    }
    if (serie) fila(tx('Tokens en el gráfico', 'Tokens in the chart'), `${serie.incluidos}`,
      tx(`${modelo.cuota(serie.cobertura, lengua)} del total`, `${modelo.cuota(serie.cobertura, lengua)} of the total`));
    const mayor = vivo?.tipos?.[0];
    if (mayor) fila(tx('Tipo mayor', 'Largest type'), traducirTipo(mayor.nombre), tx(`${modelo.cuota(mayor.cuota, lengua)} del total`, `${modelo.cuota(mayor.cuota, lengua)} of the total`), true);
    return lista;
  }
  const TIPOS_EN = { 'Crédito privado': 'Private credit', 'Letras del Tesoro': 'Treasury bills', 'Materias primas': 'Commodities', Acciones: 'Stocks',
    'Fondos monetarios': 'Money market funds', 'Otros créditos': 'Other credit', ETF: 'ETFs', Inmuebles: 'Real estate', Otros: 'Other' };
  const traducirTipo = nombre => (idioma() === 'en' ? TIPOS_EN[nombre] || nombre : nombre);

  function porTipo() {
    const caja = el('section', 'mk-tipos');
    caja.setAttribute('aria-labelledby', 'mkTiposTit');
    const h = el('h2', 'mk-h2', tx('Por tipo de activo', 'By asset type'));
    h.id = 'mkTiposTit';
    caja.append(h, el('p', 'mk-h2-sub', tx('Hoy. Las categorías de CoinGecko pueden solaparse.', "Today. CoinGecko's categories can overlap.")));
    const lista = el('ul', 'mk-tipos-lista');
    for (const t of vivo.tipos) {
      const li = el('li', 'mk-tipo');
      const dir = modelo.direccion(t.cambio24h);
      li.append(el('span', 'mk-tipo-nom', traducirTipo(t.nombre)), el('span', 'mk-tipo-valor', modelo.millones(t.valor, idioma())));
      const barra = el('span', 'mk-tipo-barra'), relleno = el('span', 'mk-tipo-relleno');
      relleno.style.setProperty('--mk-ancho', Math.max(1.5, Math.min(100, t.cuota)).toFixed(2) + '%');
      relleno.style.setProperty('--mk-color', modelo.colorTipo(vivo, t.clave));
      barra.append(relleno);
      barra.setAttribute('aria-hidden', 'true');
      const cuota = el('span', 'mk-tipo-cuota', modelo.cuota(t.cuota, idioma()) + ' ' + tx('del total', 'of the total'));
      const c = el('span', 'mk-tipo-24h mk-' + dir, dir === 'sin-datos' ? '—' : `${FLECHA[dir]} ${modelo.porcentaje(t.cambio24h, idioma())} ${tx('en 24 h', 'in 24 h')}`);
      li.append(barra, cuota, c);
      if (t.clave === 'materias-primas' && vivo.oro && finito(vivo.oro.valor)) li.append(el('span', 'mk-tipo-oro', tx('De ello, oro: ', 'Of which gold: ') + modelo.millones(vivo.oro.valor, idioma())));
      lista.append(li);
    }
    caja.append(lista);
    return caja;
  }

  /* La nota bajo el gráfico: una línea corta a la vista y el resto en «Cómo se calcula». */
  function notaGrafico() {
    const caja = el('div', 'mk-nota-caja');
    const como = el('details', 'mk-como');
    como.append(el('summary', 'mk-como-tit', tx('Cómo se calcula', 'How it is calculated')), el('p', 'mk-nota-larga', modelo.notaSerie(serie, idioma())));
    caja.append(el('p', 'mk-nota', modelo.notaCorta(serie, idioma())), como);
    return caja;
  }

  /* ---- /mercado/ ---- */
  function pintarCompleto() {
    const cuerpo = raiz.querySelector('#mkCuerpo');
    const hoy = valorHoy();
    cuerpo.removeAttribute('aria-busy');
    if (!hoy) {
      cuerpo.replaceChildren(el('p', 'mk-estado', tx('Ahora no podemos mostrar los datos de CoinGecko. Vuelve a intentarlo más tarde.',
        "We can't show CoinGecko's data right now. Please try again later.")));
      raiz.dataset.mercadoEstado = 'sin-datos';
      return;
    }
    raiz.dataset.mercadoEstado = vivo ? vivo.fuente + (serie ? '+serie' : '') : 'solo-serie';
    const g = serie ? modelo.graficoPestana(serie, pestana, idioma()) : null;
    const cab = el('div', 'mk-cab');
    cab.append(cifraGrande(hoy.valor, 'mk-cifra'));
    const linea = el('p', 'mk-linea-cambio');
    const vieja = atrasada();
    if (g && !vieja) {
      // El % es el de la suma de la serie (los N mayores), no el de la cifra total de arriba: se dice.
      const alcance = el('span', 'mk-alcance');
      alcance.setAttribute('translate', 'no');
      alcance.append(el('span', 'mk-sep', '· '), g.alcance);
      linea.append(cambio(g), ' ', el('span', 'mk-periodo', g.cambioFrase), ' ', alcance);
      linea.setAttribute('aria-live', 'polite');
    } else linea.append(el('span', 'mk-periodo', tx('Valor total, en millones de dólares', 'Total value, in millions of dollars')));
    cab.append(linea);
    if (g && !vieja && g.avisoTokens) cab.append(el('p', 'mk-aviso mk-aviso-tokens', g.avisoTokens[0].toUpperCase() + g.avisoTokens.slice(1) + '.'));
    if (vieja) cab.append(el('p', 'mk-aviso mk-aviso-serie', avisoAtrasada()));
    if (!vivo) cab.append(el('p', 'mk-aviso', tx('Sin el dato de hoy: la cifra es la suma de los mayores tokens del último día de la serie.',
      "Without today's figure: this is the sum of the largest tokens on the series' last day.")));
    else if (vivo.fuente === 'foto-guardada') cab.append(el('p', 'mk-aviso', tx('Cifra de la última foto diaria de RWAdar, del ', "Figure from RWAdar's last daily snapshot, ") + modelo.horaDato(vivo.actualizado, idioma())));
    // Pestañas: botones con aria-pressed (el seleccionado, marcado y con su raya).
    const pestanas = el('div', 'mk-pestanas');
    pestanas.setAttribute('role', 'group');
    pestanas.setAttribute('aria-label', tx('Periodo del gráfico', 'Chart period'));
    for (const p of modelo.PESTANAS) {
      const b = el('button', 'mk-pestana', idioma() === 'en' ? { '1s': '1W', '1m': '1M', '3m': '3M', '6m': '6M', ytd: 'YTD', '1a': '1Y' }[p.clave] : p.corto);
      b.type = 'button';
      b.dataset.pestana = p.clave;
      b.setAttribute('aria-pressed', String(p.clave === pestana));
      b.setAttribute('aria-label', idioma() === 'en' ? { '1s': '1 week', '1m': '1 month', '3m': '3 months', '6m': '6 months', ytd: 'Year to date', '1a': '1 year' }[p.clave] : p.nombre);
      const sinDatos = !serie || !modelo.tramo(serie.puntos, p.clave);
      if (sinDatos) b.disabled = true;
      pestanas.append(b);
    }
    pestanas.addEventListener('click', ev => {
      const b = ev.target.closest('[data-pestana]');
      if (!b || b.disabled || b.dataset.pestana === pestana) return;
      pestana = b.dataset.pestana;
      pintar();
      raiz.querySelector(`[data-pestana="${pestana}"]`)?.focus({ preventScroll: true });
    });
    const partes = [cab, pestanas];
    if (g) partes.push(graficoInteractivo(g), tablaSerie(g), notaGrafico());
    else partes.push(el('p', 'mk-estado', tx('El gráfico no está disponible ahora. La cifra de hoy sí.', "The chart isn't available right now. Today's figure is.")));
    partes.push(datosClave(g), lineaFuente());
    if (vivo?.tipos?.length) partes.push(porTipo());
    cuerpo.replaceChildren(...partes);
  }

  /* ---- Inicio: la tarjeta tipo cotización ---- */
  function minigrafico(g) {
    const W = 112, H = 44, M = 3;
    const coords = modelo.coordenadas(g, W - 2 * M, H - 2 * M).map(c => ({ x: c.x + M, y: c.y + M }));
    const { linea: d, area, puentes } = modelo.trazosSvg(coords, modelo.tramosSeguidos(g), H);
    const id = 'mkMini' + Math.random().toString(36).slice(2, 8);
    const s = svg('svg', { class: 'mk-mini-svg mk-' + g.direccion, width: W, height: H, viewBox: `0 0 ${W} ${H}`, 'aria-hidden': 'true', focusable: 'false' });
    const defs = svg('defs'), deg = svg('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 });
    deg.append(svg('stop', { offset: '0', class: 'mk-stop', 'stop-opacity': '0.3' }), svg('stop', { offset: '1', class: 'mk-stop', 'stop-opacity': '0' }));
    defs.append(deg);
    const yBase = coords[0].y;
    s.append(defs, svg('path', { class: 'mk-area', d: area, fill: `url(#${id})` }),
      svg('line', { class: 'mk-base', x1: M, x2: W - M, y1: yBase.toFixed(1), y2: yBase.toFixed(1) }), svg('path', { class: 'mk-linea', d }));
    if (puentes) s.append(svg('path', { class: 'mk-puente', d: puentes }));
    return s;
  }
  function pintarInicio() {
    const cuerpo = raiz.querySelector('#mkCuerpo');
    const hoy = valorHoy();
    cuerpo.removeAttribute('aria-busy');
    raiz.dataset.mercadoEstado = !hoy ? 'sin-datos' : vivo ? vivo.fuente + (serie ? '+serie' : '') : 'solo-serie';
    if (!hoy) {
      cuerpo.replaceChildren(el('p', 'mk-estado', tx('Ahora no podemos mostrar los datos de CoinGecko. Vuelve a intentarlo más tarde.',
        "We can't show CoinGecko's data right now. Please try again later.")));
      return;
    }
    const g = serie && !atrasada() ? modelo.graficoPestana(serie, '1m', idioma()) : null;
    const a = el('a', 'mk-ct');
    a.href = '/mercado/';
    const izq = el('span', 'mk-ct-izq');
    izq.append(el('span', 'mk-ct-nom', tx('Activos tokenizados', 'Tokenised assets')), el('span', 'mk-ct-sub', tx('Mercado mundial', 'Global market')));
    const der = el('span', 'mk-ct-der');
    der.append(el('span', 'mk-ct-cifra', modelo.millones(hoy.valor, idioma())));
    if (g) {
      const c = cambio(g, 'mk-ct-cambio');
      der.append(c, el('span', 'mk-ct-periodo', g.periodoTexto), el('span', 'mk-ct-alcance', g.alcance));
    } else if (atrasada()) der.append(el('span', 'mk-ct-periodo', tx('serie hasta el ', 'series to ') + modelo.fechaCorta(serie.puntos.at(-1).fecha, idioma())));
    a.append(izq);
    if (g) a.append(minigrafico(g));
    a.append(der);
    a.setAttribute('aria-label', tx('Mercado de activos tokenizados', 'Tokenised asset market') + ': ' + modelo.millonesHablados(hoy.valor, idioma()) +
      (g ? ', ' + (g.direccion === 'sube' ? tx('sube', 'up') : g.direccion === 'baja' ? tx('baja', 'down') : tx('sin cambios', 'unchanged')) + ' ' + g.cambioTexto + ' ' + g.cambioFrase + ', ' + g.alcance + (g.avisoTokens ? '; ' + g.avisoTokens : '') : '') +
      '. ' + tx('Ver el gráfico', 'See the chart'));
    cuerpo.replaceChildren(a, lineaFuente({ conSerie: false }));
  }

  function pintar() {
    if (!raiz) return;
    if (!suscrito && globalThis.RWAdarIdioma?.suscribirIdioma) { suscrito = true; globalThis.RWAdarIdioma.suscribirIdioma(pintar); }
    if (modo === 'inicio') pintarInicio(); else pintarCompleto();
  }

  async function iniciar() {
    // Un toque fuera del gráfico quita la cruz que se quedó fija.
    document.addEventListener('pointerdown', ev => { if (tactil && !tactil.caja.contains(ev.target)) quitarCruz(tactil.caja, tactil.burbuja); }, { passive: true });
    raiz = document.querySelector('[data-mercado]');
    if (!raiz || !modelo || !raiz.querySelector('#mkCuerpo')) return;
    modo = raiz.dataset.mercado === 'inicio' ? 'inicio' : 'completo';
    pestana = modelo.PESTANA_INICIAL;
    [vivo, serie] = await Promise.all([cargarVivo(), cargarSerie()]);
    // Si 1 M no tiene datos, la primera pestaña que sí.
    if (serie && !modelo.tramo(serie.puntos, pestana)) pestana = modelo.PESTANAS.find(p => modelo.tramo(serie.puntos, p.clave))?.clave || pestana;
    pintar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  else iniciar();
})();

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
     mayores tokens de la categoría con historia completa en CoinGecko (hoy
     29 de los 40 mayores; rwadar-app/tokenizacion/serie-diaria.mjs).
   La cifra grande es el último punto de la serie (QA del 11/11/2026): la
   misma que el final de la línea, la cruz en el último día, el cambio, el
   máximo y el mínimo. El total de la categoría, con todos sus tokens, va en
   gris bajo el gráfico, tras la nota, y en los datos clave, con su hora (en
   la cabecera empujaba el gráfico fuera de la primera pantalla del móvil).
   Dos modos:
   - data-mercado="completo" (/mercado/): el nombre, la cifra grande y el
     cambio del periodo (signo, flecha y texto: el color nunca va solo) con
     lo que mide, pestañas 1 S · 1 M · 3 M · 6 M · 2026 · 1 A (1 M por
     defecto; en inglés, «YTD»), el gráfico de área SVG propio (eje de
     valores a la derecha con el último valor marcado, fechas abajo, rejilla
     suave, línea de puntos en el valor de partida y una cruz con la fecha y
     el valor al pasar el ratón, al arrastrar el dedo o con las flechas del
     teclado), su tabla para lectores de pantalla, los datos clave y las
     barras por tipo. Las noticias, debajo, las pinta noticias-sector.
   - data-mercado="inicio": la tarjeta tipo cotización de Inicio (nombre,
     cifra, cambio del mes y un minigráfico del último mes: la misma cifra
     que el final del minigráfico), que lleva a /mercado/.
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
  // Los desplegables siguen como los dejó quien lee al cambiar de pestaña o de idioma.
  let tiposAbierto = null, comoAbierto = false;

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
    // millones() separa la unidad con un espacio duro (U+00A0), que en el código no se
    // distinguía de un espacio normal: /\s/ lo deja claro y es lo mismo que en la app.
    const [cifra, unidad] = modelo.millones(valor, idioma()).split(/\s/);
    const grande = el('span', 'mk-cifra-num', cifra);
    if (unidad) grande.append(el('span', 'mk-cifra-unidad', ' ' + unidad));
    grande.setAttribute('aria-hidden', 'true');
    caja.append(grande, el('span', 'solo-lector', modelo.millonesHablados(valor, idioma())));
    return caja;
  }
  // La cifra grande: el último punto de la serie; sin serie, el total de la categoría.
  const valorHoy = () => modelo.cifraGrande(serie, vivo);
  // La serie vieja (más de 3 días antes del dato de hoy): la cifra grande y el gráfico son de su último día, y se dice.
  const atrasada = () => !!(vivo && serie && modelo.serieAtrasada(serie, vivo.actualizado));
  const avisoAtrasada = () => tx('La serie llega hasta el ', 'The series ends on ') + modelo.fechaCorta(serie.puntos.at(-1).fecha, idioma()) +
    tx(': la cifra grande y el gráfico son de ese día.', ': the large figure and the chart are from that day.');
  /* La fuente: CoinGecko, hasta qué día llega la serie y, en /mercado/, de
     cuándo es el total de la categoría («hoy, …» solo si es de hoy). */
  function lineaFuente({ conTotal = true } = {}) {
    const p = el('p', 'mk-fuente');
    if (conTotal) p.append(el('span', '', tx('En millones de dólares (M$).', 'In millions of dollars ($M).')), ' ');
    p.append(el('span', '', tx('Datos:', 'Data:')), ' ');
    const a = el('a', '', 'CoinGecko');
    a.href = modelo.FUENTE.url; a.target = '_blank'; a.rel = 'noopener nofollow';
    p.append(a);
    if (serie) p.append(' · ', el('span', '', tx('serie diaria hasta el', 'daily series to') + ' ' + modelo.fechaCorta(serie.puntos.at(-1).fecha, idioma())));
    if (vivo && conTotal) {
      const cuando = el('time', '', modelo.cuandoDato(vivo, idioma()));
      cuando.dateTime = vivo.actualizado;
      p.append(' · ', el('span', '', tx('total de la categoría:', 'category total:')), ' ', cuando);
    }
    return p;
  }

  /* ---- El gráfico de área ---- */
  function dibujarGrafico(caja, g) {
    const ancho = Math.round(caja.clientWidth);
    if (ancho < 120) return;
    const escritorio = matchMedia('(min-width:768px)').matches;
    // ARRIBA: una franja libre de 40 px para la burbuja de la cruz, que así no tapa la línea.
    const EJE = escritorio ? 64 : 54, ALTO = escritorio ? 330 : 270, ARRIBA = 40, ABAJO = 28;
    const PW = ancho - EJE, PH = ALTO - ARRIBA - ABAJO;
    // HOLGURA: la línea acaba 8 px antes del eje, así el punto de la cruz en el
    // último día no toca la píldora del último valor (revisión del 11/11/2026).
    const HOLGURA = 8;
    const coords = modelo.coordenadas(g, PW - HOLGURA, PH).map(c => ({ x: c.x, y: c.y + ARRIBA }));
    const yDe = v => ARRIBA + PH - (v - g.escala.lo) / (g.escala.hi - g.escala.lo) * PH;
    const dibujo = svg('svg', { width: ancho, height: ALTO, viewBox: `0 0 ${ancho} ${ALTO}`, class: 'mk-svg', 'aria-hidden': 'true', focusable: 'false' });
    const id = 'mkDeg' + Math.random().toString(36).slice(2, 8);
    const defs = svg('defs'), deg = svg('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 });
    deg.append(svg('stop', { offset: '0', class: 'mk-stop', 'stop-opacity': '0.34' }), svg('stop', { offset: '0.6', class: 'mk-stop', 'stop-opacity': '0.08' }),
      svg('stop', { offset: '1', class: 'mk-stop', 'stop-opacity': '0' }));
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
    // El suelo acaba donde el dibujo: no tacha la marca más baja del eje.
    rejilla.append(svg('line', { class: 'mk-suelo', x1: 0, x2: PW, y1: ARRIBA + PH, y2: ARRIBA + PH }));
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
    // Con muchos puntos (6 M, 2026 y 1 A), una línea algo más fina: a 2 px parecía peluda.
    dibujo.append(svg('path', { class: 'mk-linea' + (g.puntos.length > 120 ? ' mk-linea--densa' : ''), d: trazo }));
    // Ejes: valores a la derecha, fechas abajo. El último valor, en una píldora a su altura
    // (es la cifra grande); las marcas que chocarían con ella no se escriben.
    const yUltimo = coords[coords.length - 1].y;
    const textos = svg('g', { class: 'mk-eje' });
    for (const m of g.marcasValores) {
      if (Math.abs(yDe(m.valor) - yUltimo) < 15) continue;
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
    const pildora = svg('g', { class: 'mk-ultimo' });
    const anchoP = EJE - 6;
    pildora.append(svg('rect', { x: PW + 3, y: (yUltimo - 9).toFixed(1), width: anchoP, height: 18, rx: 9 }));
    const tu = svg('text', { x: (PW + 3 + anchoP / 2).toFixed(1), y: (yUltimo + 4).toFixed(1), 'text-anchor': 'middle' });
    tu.textContent = modelo.marcaValor(g.estadisticas.fin, g.estadisticas.fin >= 1e8 ? 1e6 : 1e5, idioma());
    pildora.append(tu);
    dibujo.append(pildora);
    // La cruz: solo la raya vertical (dos rayas discontinuas se confundían con la
    // línea de partida) y el punto. Oculta hasta que se usa.
    const grupo = svg('g', { class: 'mk-cruz', visibility: 'hidden' });
    const v = svg('line', { y1: ARRIBA - 10, y2: ARRIBA + PH }), punto = svg('circle', { r: 5 });
    grupo.append(v, punto);
    dibujo.append(grupo);
    caja.querySelector('.mk-svg')?.remove();
    caja.prepend(dibujo);
    cruz = { coords, grupo, v, punto, PW, ancho, g };
  }

  function ponerCruz(caja, burbuja, i) {
    if (!cruz) return;
    const { coords, grupo, v, punto, ancho, g } = cruz;
    const k = Math.max(0, Math.min(coords.length - 1, i)), c = coords[k], p = g.puntos[k];
    v.setAttribute('x1', c.x.toFixed(1)); v.setAttribute('x2', c.x.toFixed(1));
    punto.setAttribute('cx', c.x.toFixed(1)); punto.setAttribute('cy', c.y.toFixed(1));
    grupo.setAttribute('visibility', 'visible');
    const lengua = idioma();
    // En una línea, encima del dibujo: fecha · valor · cambio desde el primer día del periodo.
    const desdeInicio = modelo.porcentaje(modelo.cambioPct(p.valor, g.estadisticas.inicio), lengua);
    burbuja.replaceChildren(el('span', 'mk-burbuja-fecha', modelo.fechaCorta(p.fecha, lengua)), el('b', 'mk-burbuja-valor', modelo.millones(p.valor, lengua)),
      el('span', 'mk-burbuja-cambio', desdeInicio));
    burbuja.hidden = false;
    // La burbuja sigue a la cruz sin salirse del gráfico (CSSOM, sin style en línea).
    const anchoB = burbuja.offsetWidth || 200;
    burbuja.style.setProperty('--mk-x', Math.max(0, Math.min(Math.max(0, ancho - anchoB), c.x - anchoB / 2)).toFixed(0) + 'px');
    caja.setAttribute('aria-valuenow', String(k));
    caja.setAttribute('aria-valuetext', `${modelo.fechaCorta(p.fecha, lengua)}: ${modelo.millonesHablados(p.valor, lengua)}`);
    caja.dataset.indice = String(k);
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
    t.append(el('caption', '', tx('Valor diario, ', 'Daily value, ') + g.periodoTexto + ' (' + g.alcance + tx(' tokens', ' tokens') + ')'));
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
    // Dos cifras distintas, cada una con su nombre: la de la serie (la cifra grande) y la de toda la categoría.
    if (serie && hoy?.fuente === 'serie') fila(tx(`Valor hoy (${serie.incluidos} mayores)`, `Value today (${serie.incluidos} largest)`), modelo.millones(hoy.valor, lengua), modelo.fechaCorta(hoy.fecha, lengua));
    fila(tx('Total de la categoría hoy', 'Category total today'), vivo ? modelo.millones(vivo.total.valor, lengua) : '—',
      vivo ? tx('todos los tokens · CoinGecko', 'all tokens · CoinGecko') : null);
    // 24 h: el de la serie si sus dos últimos días son seguidos; si no, el de CoinGecko si es creíble; si no, «—».
    const c24 = modelo.cambio24h(serie, vivo);
    if (c24.cambio !== null) {
      const dir = modelo.direccion(c24.cambio);
      const c = el('span', 'mk-cambio mk-' + dir);
      const f = el('span', 'mk-flecha', FLECHA[dir] || ''); f.setAttribute('aria-hidden', 'true');
      c.append(f, el('span', '', modelo.porcentaje(c24.cambio, lengua)));
      fila(tx('Cambio en 24 h', '24 h change'), c, c24.fuente === 'serie' ? tx(`${serie.incluidos} mayores`, `${serie.incluidos} largest`) : tx('toda la categoría', 'whole category'));
    } else fila(tx('Cambio en 24 h', '24 h change'), '—');
    if (g) {
      const e = g.estadisticas;
      fila(tx('Máximo del periodo', 'Period high'), modelo.millones(e.max.valor, lengua), modelo.fechaCorta(e.max.fecha, lengua));
      fila(tx('Mínimo del periodo', 'Period low'), modelo.millones(e.min.valor, lengua), modelo.fechaCorta(e.min.fecha, lengua));
    }
    // La misma cuota y con el mismo redondeo que la nota del gráfico («86 %»).
    if (serie) fila(tx('Tokens en el gráfico', 'Tokens in the chart'), `${serie.incluidos}`,
      tx(`${modelo.coberturaTexto(serie, lengua)} del total`, `${modelo.coberturaTexto(serie, lengua)} of the total`));
    const mayor = vivo?.tipos?.[0];
    if (mayor) fila(tx('El tipo que más pesa', 'Largest asset type'), traducirTipo(mayor.nombre), tx(`${modelo.cuota(mayor.cuota, lengua)} del total`, `${modelo.cuota(mayor.cuota, lengua)} of the total`), true);
    return lista;
  }
  const TIPOS_EN = { 'Crédito privado': 'Private credit', 'Letras del Tesoro': 'Treasury bills', 'Materias primas': 'Commodities', Acciones: 'Stocks',
    'Fondos monetarios': 'Money market funds', 'Otros créditos': 'Other credit', ETF: 'ETFs', Inmuebles: 'Real estate', Otros: 'Other' };
  const traducirTipo = nombre => (idioma() === 'en' ? TIPOS_EN[nombre] || nombre : nombre);

  /* Por tipo de activo. En el móvil, la lista va plegada (las noticias quedan
     más arriba) con un avance de los dos mayores; en escritorio, abierta.
     Solo la cifra del cambio va en color. */
  function porTipo() {
    const caja = el('section', 'mk-tipos');
    caja.setAttribute('aria-labelledby', 'mkTiposTit');
    const h = el('h2', 'mk-h2', tx('Por tipo de activo', 'By asset type'));
    h.id = 'mkTiposTit';
    caja.append(h, el('p', 'mk-h2-sub', tx('Hoy. Un mismo token puede contar en dos tipos, así que las cifras no suman el total.',
      "Today. A token can count in two types, so the figures don't add up to the total.")));
    const plegable = el('details', 'mk-tipos-det');
    plegable.open = tiposAbierto ?? matchMedia('(min-width:768px)').matches;
    plegable.addEventListener('toggle', () => { tiposAbierto = plegable.open; });
    const [t1, t2] = vivo.tipos;
    const resumen = el('summary', 'mk-tipos-sum');
    resumen.append(el('span', 'mk-tipos-ver', tx(`Ver los ${vivo.tipos.length} tipos`, `See the ${vivo.tipos.length} types`)),
      el('span', 'mk-tipos-avance', `${traducirTipo(t1.nombre)} ${modelo.cuota(t1.cuota, idioma())}` + (t2 ? ` · ${traducirTipo(t2.nombre)} ${modelo.cuota(t2.cuota, idioma())}…` : '')));
    plegable.append(resumen);
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
      const c = el('span', 'mk-tipo-24h');
      // Sin cambio, se dice con palabras («—» suelto no se entendía); la flecha, del mismo tamaño que en los datos clave.
      if (dir === 'sin-datos') c.append(el('span', '', tx('Sin dato en 24 h', 'No 24 h data')));
      else {
        const cifra = el('span', 'mk-tipo-24h-cifra mk-' + dir), f = el('span', 'mk-flecha', FLECHA[dir]);
        f.setAttribute('aria-hidden', 'true');
        cifra.append(f, el('span', '', modelo.porcentaje(t.cambio24h, idioma())));
        c.append(cifra, ' ', el('span', '', tx('en 24 h', 'in 24 h')));
      }
      li.append(barra, cuota, c);
      if (t.clave === 'materias-primas' && vivo.oro && finito(vivo.oro.valor)) li.append(el('span', 'mk-tipo-oro', tx('De ello, oro: ', 'Of which gold: ') + modelo.millones(vivo.oro.valor, idioma())));
      lista.append(li);
    }
    plegable.append(lista);
    caja.append(plegable);
    return caja;
  }

  /* La nota bajo el gráfico: una línea corta a la vista, con el total de la
     categoría, y el resto en «Cómo se calcula», con cuántos entran a mitad
     del periodo elegido. */
  function notaGrafico() {
    const caja = el('div', 'mk-nota-caja');
    const como = el('details', 'mk-como');
    como.open = comoAbierto;
    como.addEventListener('toggle', () => { comoAbierto = como.open; });
    como.append(el('summary', 'mk-como-tit', tx('Cómo se calcula', 'How it is calculated')), el('p', 'mk-nota-larga', modelo.notaSerie(serie, idioma(), pestana)));
    // La nota corta (la misma coletilla que el subtítulo) y, en gris, el total de la categoría con su hora.
    const nota = el('p', 'mk-nota', modelo.notaCorta(serie, idioma()));
    const total = modelo.lineaTotalCategoria(serie, vivo, idioma());
    if (total) nota.append(' ', el('span', 'mk-total-cat', total));
    caja.append(nota, como);
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
    // Qué suma la cifra grande y de qué día; la cifra es el último punto de la línea.
    cab.append(el('p', 'mk-sub', modelo.subtituloCifra(serie, idioma())), cifraGrande(hoy.valor, 'mk-cifra'));
    if (g) {
      const linea = el('p', 'mk-linea-cambio');
      linea.append(cambio(g), ' ', el('span', 'mk-periodo', g.cambioFrase));
      linea.setAttribute('aria-live', 'polite');
      // Qué mide ese % (no es una rentabilidad) y, si en el periodo entran tokens, que parte de la subida es eso.
      cab.append(linea, el('p', 'mk-explica', modelo.explicacionCambio(idioma())));
      if (g.avisoTokens) cab.append(el('p', 'mk-aviso mk-aviso-tokens', g.avisoTokens[0].toUpperCase() + g.avisoTokens.slice(1) + '.'));
    }
    if (atrasada()) cab.append(el('p', 'mk-aviso mk-aviso-serie', avisoAtrasada()));
    // El total de la categoría va bajo el gráfico (notaGrafico); sin serie, la cifra grande ya es ese total y se dice.
    if (hoy.fuente === 'total') cab.append(el('p', 'mk-aviso', tx('Sin la serie diaria, la cifra es el total de la categoría en CoinGecko (', "Without the daily series, the figure is CoinGecko's category total (") +
      modelo.cuandoDato(vivo, idioma()) + ').'));
    // Pestañas: botones con aria-pressed (el seleccionado, marcado). El nombre accesible contiene lo que se ve.
    const pestanas = el('div', 'mk-pestanas');
    pestanas.setAttribute('role', 'group');
    pestanas.setAttribute('aria-label', tx('Periodo del gráfico', 'Chart period'));
    for (const p of modelo.PESTANAS) {
      const et = modelo.etiquetaPestana(p.clave, idioma(), serie);
      const b = el('button', 'mk-pestana', et.corto);
      b.type = 'button';
      b.dataset.pestana = p.clave;
      b.setAttribute('aria-pressed', String(p.clave === pestana));
      b.setAttribute('aria-label', et.nombre);
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
    // preserveAspectRatio="none": en escritorio se estira a lo ancho de su columna sin engordar la línea.
    const s = svg('svg', { class: 'mk-mini-svg mk-' + g.direccion, width: W, height: H, viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false' });
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
    // La misma cifra que el final del minigráfico: el último punto de la serie.
    const g = serie ? modelo.graficoPestana(serie, '1m', idioma()) : null;
    const a = el('a', 'mk-ct');
    a.href = '/mercado/';
    const izq = el('span', 'mk-ct-izq');
    izq.append(el('span', 'mk-ct-nom', tx('Activos tokenizados', 'Tokenised assets')),
      el('span', 'mk-ct-sub', serie ? tx(`Los ${serie.incluidos} mayores · CoinGecko`, `${serie.incluidos} largest · CoinGecko`) : tx('Toda la categoría · CoinGecko', 'Whole category · CoinGecko')));
    const der = el('span', 'mk-ct-der');
    der.append(el('span', 'mk-ct-cifra', modelo.millones(hoy.valor, idioma())));
    if (g) der.append(cambio(g, 'mk-ct-cambio'), el('span', 'mk-ct-periodo', g.periodoTexto));
    if (atrasada()) der.append(el('span', 'mk-ct-periodo mk-ct-hasta', tx('serie hasta el ', 'series to ') + modelo.fechaCorta(serie.puntos.at(-1).fecha, idioma())));
    a.append(izq);
    if (g) a.append(minigrafico(g));
    a.append(der);
    a.setAttribute('aria-label', tx('Mercado de activos tokenizados', 'Tokenised asset market') + ', ' +
      (serie ? tx(`suma de los ${serie.incluidos} mayores tokens`, `sum of the ${serie.incluidos} largest tokens`) : tx('total de la categoría', 'category total')) + ': ' +
      modelo.millonesHablados(hoy.valor, idioma()) +
      (g ? ', ' + (g.direccion === 'sube' ? tx('sube', 'up') : g.direccion === 'baja' ? tx('baja', 'down') : tx('sin cambios', 'unchanged')) + ' ' + g.cambioTexto + ' ' + g.cambioFrase + (g.avisoTokens ? '; ' + g.avisoTokens : '') : '') +
      (atrasada() ? '; ' + tx('serie hasta el ', 'series to ') + modelo.fechaCorta(serie.puntos.at(-1).fecha, idioma()) : '') +
      '. ' + tx('Ver el gráfico', 'See the chart'));
    const partes = [a];
    // El % del mes es del tamaño del mercado, no una rentabilidad: también aquí.
    if (g) partes.push(el('p', 'mk-explica mk-ct-explica', modelo.explicacionCambio(idioma())));
    partes.push(lineaFuente({ conTotal: false }));
    cuerpo.replaceChildren(...partes);
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

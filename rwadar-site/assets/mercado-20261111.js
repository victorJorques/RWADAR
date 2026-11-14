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
     30 de los 40 mayores; rwadar-app/tokenizacion/serie-diaria.mjs);
   - /datos/tokenizacion-serie-fina.json (13/11/2026): de los mismos tokens,
     un punto cada 5 minutos de las últimas 24 horas y uno cada hora de los
     últimos 30 días. Solo se usa si es de la misma ejecución que la diaria y
     acaba en su mismo punto (unirSerieFina); si falta, no vale o no casa, el
     gráfico sigue con la diaria como antes y «24 h» sale desactivada.
   - /api/tokenizacion/directo (14/11/2026): el gráfico en directo. La base
     pide a CoinGecko cada 5 minutos (migración 35) y nuestro servidor lo
     sirve. Se pide a la vez que la diaria y, si vale y casa con ella
     (unirDirecto), es lo que se pinta y la cifra grande; con la página a la
     vista se vuelve a pedir en cuanto toca el dato siguiente. La edad se mide
     con la cabecera Date de la respuesta (el reloj del servidor), no con la
     hora del aparato. Si no vale, la fina publicada (como antes) y, si el
     directo está encendido y falla, una línea lo dice; apagado, nada.
   La cifra grande es el último punto de la serie (QA del 11/11/2026): la
   misma que el final de la línea, la cruz en el último día, el cambio, el
   máximo y el mínimo. El total de la categoría, con todos sus tokens, va en
   gris bajo el gráfico, tras la nota, y en los datos clave, con su hora (en
   la cabecera empujaba el gráfico fuera de la primera pantalla del móvil).
   Dos modos:
   - data-mercado="completo" (/mercado/): el nombre, la cifra grande y el
     cambio del periodo (signo, flecha y texto: el color nunca va solo) con
     lo que mide, pestañas 24 h · 1 S · 1 M · 3 M · 6 M · 2026 · 1 A (1 M
     por defecto; en inglés, «24H» y «YTD»), el gráfico de área SVG propio
     (eje de valores a la derecha con el último valor marcado, el tiempo
     abajo, rejilla suave, línea de puntos en el valor de partida y una cruz
     con el instante y el valor al pasar el ratón, al arrastrar el dedo o con
     las flechas del teclado), su tabla para lectores de pantalla, los datos
     clave y las barras por tipo. Las noticias, debajo, las pinta
     noticias-sector. Cada pestaña usa la serie más fina que la cubre
     (seriePestana): 24 h, un punto cada 5 minutos (abajo, horas «06:00» y en
     la cruz «16:20», en hora de España); 1 S y 1 M, cada hora (abajo, días;
     en la cruz, «8 nov, 18:00»); 3 M, 6 M, el año y 1 A, la diaria (abajo,
     días o meses; en la cruz, la fecha). Con cientos de puntos, el trazo se
     simplifica para pintar sin perder ningún máximo ni mínimo
     (indicesPintar) y la cruz los recorre todos (indiceCercano).
   - data-mercado="inicio": la tarjeta tipo cotización de Inicio (nombre,
     cifra, cambio del mes y un minigráfico del último mes, cada hora si hay
     serie fina: la misma cifra que el final del minigráfico), que lleva a
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
  // Las series finas, en un archivo aparte; como en la app, nada de más de 256 kB (hoy ocupa unos 39).
  const RUTA_SERIE_FINA = '/datos/tokenizacion-serie-fina.json', MAX_FINA = 256 * 1024;
  // El directo: unos 40 kB; nada de más de 128 kB. Se vuelve a pedir con el dato siguiente
  // (la base lo hace cada 5 minutos); si no vale, cada 5 minutos.
  const RUTA_DIRECTO = '/api/tokenizacion/directo', MAX_DIRECTO = 128 * 1024, SIGUIENTE_MS = 6.5 * 60000, REFRESCO_MS = 5 * 60000;
  const SVG = 'http://www.w3.org/2000/svg';
  const FLECHA = { sube: '▲', baja: '▼', igual: '=' };
  let raiz, modo, vivo = null, serie = null, pestana = null, suscrito = false, cruz = null, quitarRedimension = null;
  // De dónde sale la serie ('directo' | 'archivo' | 'diaria'), por qué no vale el directo y cuándo se vuelve a pedir.
  let origen = null, motivoDirecto = null, proximo = 0, temporizador = null;
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

  async function pedir(url, maximo = 0) {
    const abort = new AbortController(), reloj = setTimeout(() => abort.abort(), PLAZO_MS);
    try {
      const r = await fetch(url, { credentials: 'omit', cache: 'no-cache', headers: { Accept: 'application/json' }, signal: abort.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      if (!maximo) return await r.json();
      const texto = await r.text();
      if (texto.length > maximo) throw new Error('demasiado grande');
      return JSON.parse(texto);
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
  /* El directo: { cuerpo, edadMs } o { motivo } ('apagado', 'no_casa',
     'atrasado'…, o 'red'). Nunca lanza. La edad, con la cabecera Date de la
     respuesta más lo que ha pasado desde que llegó (el mayor de
     performance.now() y Date.now(): el primero se para si el aparato duerme). */
  async function pedirDirecto() {
    const abort = new AbortController(), reloj = setTimeout(() => abort.abort(), PLAZO_MS);
    try {
      const r = await fetch(RUTA_DIRECTO, { credentials: 'omit', cache: 'no-cache', headers: { Accept: 'application/json' }, signal: abort.signal });
      const perf0 = performance.now(), fecha0 = Date.now(), fechaServidor = r.headers.get('date');
      const texto = await r.text();
      if (texto.length > MAX_DIRECTO) return { motivo: 'red' };
      let cuerpo = null;
      try { cuerpo = JSON.parse(texto); } catch { cuerpo = null; }
      if (r.status !== 200) return { motivo: modelo.motivoDirecto(r.status, cuerpo) };
      const edadMs = modelo.edadDirecto({ generado: cuerpo?.fina?.generado, fechaServidor,
        transcurrido: modelo.transcurridoMs({ perf0, perf1: performance.now(), fecha0, fecha1: Date.now() }) });
      return { cuerpo, edadMs };
    } catch { return { motivo: 'red' }; } finally { clearTimeout(reloj); }
  }
  /* La serie que se pinta y de dónde sale. A la vez, la diaria y el directo;
     si el directo vale y casa (unirDirecto), «directo». Si no, la fina
     publicada, que solo entra si vale y casa con la diaria (unirSerieFina):
     «archivo»; si tampoco, la diaria sola, como antes de las series finas. */
  async function cargarSerie() {
    const [diaria, directo] = await Promise.all([pedir(RUTA_SERIE).catch(() => null), pedirDirecto()]);
    if (!modelo.serieValida(diaria)) return { serie: null, origen: null, motivo: null, proximo: Date.now() + REFRESCO_MS };
    let motivo = directo.motivo || null;
    if (!motivo) {
      const r = modelo.unirDirecto(diaria, directo.cuerpo, { edadMs: directo.edadMs });
      if (r.serie) return { serie: r.serie, origen: 'directo', motivo: null, proximo: Date.now() + Math.max(15000, SIGUIENTE_MS - directo.edadMs) };
      motivo = r.motivo;
    }
    const fina = await pedir(RUTA_SERIE_FINA, MAX_FINA).catch(() => null);
    const unida = fina && modelo.unirSerieFina(diaria, fina);
    // Apagado a propósito no se vuelve a preguntar tan a menudo.
    const despues = Date.now() + (motivo === 'apagado' ? 3 * REFRESCO_MS : REFRESCO_MS);
    if (unida?.fina) return { serie: unida, origen: 'archivo', motivo, proximo: despues };
    return { serie: modelo.validarSerie(diaria), origen: 'diaria', motivo, proximo: despues };
  }
  function aplicarSerie(r) {
    serie = r.serie; origen = r.origen; motivoDirecto = r.motivo; proximo = r.proximo;
    memo.clear();
    if (!raiz) return;
    if (origen) raiz.dataset.mercadoOrigen = origen; else delete raiz.dataset.mercadoOrigen;
    if (serie) raiz.dataset.mercadoSeries = finasUnidas().join(',') || 'diaria';
  }
  // El aviso cuando el directo está encendido y no se puede usar ('' si va bien o está apagado).
  const avisoDirecto = () => (origen === 'directo' ? '' : modelo.avisoDirecto(motivoDirecto, serie, idioma()));
  /* Con la página a la vista, se vuelve a pedir cuando toca (el dato
     siguiente del directo, o cada 5 minutos); oculta, nada; al volver, si ya
     tocaba, enseguida. Se repinta sin perder la pestaña, el idioma ni los
     desplegables; con la cruz a la vista, se espera a que se quite. */
  function programar() {
    clearTimeout(temporizador);
    temporizador = null;
    if (document.hidden || !serie) return;
    temporizador = setTimeout(refrescar, Math.max(1000, proximo - Date.now()));
  }
  async function refrescar() {
    temporizador = null;
    if (document.hidden) return;
    if (raiz.querySelector('.mk-graf')?.dataset.indice !== undefined) { temporizador = setTimeout(refrescar, 3000); return; }
    const r = await cargarSerie();
    // Si la pestaña elegida se queda sin datos (en «24 h», el directo falla y la copia publicada no trae la de 5 minutos),
    // la primera que sí, como al empezar y como la app con «elegida» (revisión del 14/11).
    if (r.serie) { aplicarSerie(r); pestanaConDatos(); pintar(); } else proximo = r.proximo;
    programar();
  }

  /* ---- Piezas comunes ---- */
  /* El instante de un punto, según la serie de la pestaña: en 24 h, la hora
     («16:20») y, si el punto es del día anterior al último, también el día
     («12 nov, 16:05»: el primero y el último tienen la misma hora y no se
     distinguían; como en la app); en 1 S y 1 M, el día y la hora («8 nov,
     18:00»); en las diarias, la fecha. Las horas, de España peninsular. Con
     «largo» (lector de pantalla), la fecha entera y «(hora de España)». */
  const deAyer = (p, g) => g.resolucion === '5m' && modelo.horaEspana(p.ms).fecha !== modelo.horaEspana(g.puntos.at(-1).ms).fecha;
  const instante = (p, g) => modelo.textoInstante(p, idioma(), deAyer(p, g) ? '1h' : g.resolucion);
  const instanteLargo = (p, g) => modelo.textoInstante(p, idioma(), g.resolucion, { largo: true });
  // Un máximo o un mínimo: en 24 h también el día (la ventana cruza la medianoche).
  const instanteDia = (p, g) => modelo.textoInstante(p, idioma(), g.resolucion === '5m' ? '1h' : g.resolucion);
  // «13/11/2026, 16:05» en hora de España, como el subtítulo de la cifra.
  function fechaHora(ms) {
    const h = modelo.horaEspana(ms);
    return modelo.fechaCorta(h.fecha, idioma()) + ', ' + h.hora;
  }
  const finasUnidas = () => (serie ? ['5m', '1h'].filter(c => modelo.serieFinaDe(serie, c)) : []);
  /* Lo que solo depende de la serie (que no cambia tras cargar), de la
     pestaña y del idioma se calcula una vez: cada cálculo del modelo vuelve a
     validar la serie, y con las finas cambiar de pestaña tardaba el doble en
     un móvil lento (perfil del 13/11/2026: la mitad del tiempo, validando). */
  const memo = new Map();
  function una(clave, calcular) {
    if (!memo.has(clave)) memo.set(clave, calcular());
    return memo.get(clave);
  }
  const disponible = clave => una('disponible|' + clave, () => modelo.pestanaDisponible(serie, clave));
  // Si la pestaña elegida no tiene datos con esta serie, la primera que sí.
  function pestanaConDatos() {
    if (serie && !disponible(pestana)) pestana = modelo.PESTANAS.find(p => disponible(p.clave))?.clave || pestana;
  }
  const graficoDe = clave => una('grafico|' + clave + '|' + idioma(), () => modelo.graficoPestana(serie, clave, idioma()));
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
    // Con la serie fina, hasta qué hora (la de la cifra grande); si no, hasta qué día.
    const hoy = valorHoy();
    if (serie && hoy?.t) p.append(' · ', el('span', '', tx('serie hasta el', 'series to') + ' ' + fechaHora(modelo.msMinuto(hoy.t)) + tx(' (hora de España)', ' (Spain time)')));
    else if (serie) p.append(' · ', el('span', '', tx('serie diaria hasta el', 'daily series to') + ' ' + modelo.fechaCorta(serie.puntos.at(-1).fecha, idioma())));
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
    // Con muchos puntos (24 h, 1 S, 1 M, 6 M, 2026 y 1 A), una línea algo más fina: a 2 px parecía peluda.
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
      const t = svg('text', { x: x.toFixed(1), y: ALTO - 9, 'text-anchor': anclaje, 'data-fecha': '' });
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
    // Las fechas de abajo que se pisarían (a 360 px en inglés, «Dec 2025» y «Mar» en 1 A): ya pintadas, se
    // miden y se quita la que empieza a menos de 3 px de donde acaba la anterior. Sin medida (0), no se toca.
    let finFecha = -Infinity;
    for (const t of dibujo.querySelectorAll('.mk-eje text[data-fecha]')) {
      const b = t.getBBox();
      if (!b.width) continue;
      if (b.x < finFecha + 3) t.remove(); else finFecha = b.x + b.width;
    }
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
    // En una línea, encima del dibujo: instante · valor · cambio desde el primer punto del periodo.
    const desdeInicio = modelo.porcentaje(modelo.cambioPct(p.valor, g.estadisticas.inicio), lengua);
    burbuja.replaceChildren(el('span', 'mk-burbuja-fecha', instante(p, g)), el('b', 'mk-burbuja-valor', modelo.millones(p.valor, lengua)),
      el('span', 'mk-burbuja-cambio', desdeInicio));
    burbuja.hidden = false;
    // La burbuja sigue a la cruz sin salirse del gráfico (CSSOM, sin style en línea). Se mide en x = 0: medida
    // donde estaba, con un texto más largo («12 nov, 16:05» tras «16:05» en 24 h), asomaba por la derecha y
    // Chromium dejaba la página 21 px más ancha a 390 px aunque luego volviera a su sitio (13/11/2026).
    burbuja.style.setProperty('--mk-x', '0px');
    const anchoB = burbuja.offsetWidth || 200;
    burbuja.style.setProperty('--mk-x', Math.max(0, Math.min(Math.max(0, ancho - anchoB), c.x - anchoB / 2)).toFixed(0) + 'px');
    caja.setAttribute('aria-valuenow', String(k));
    caja.setAttribute('aria-valuetext', `${instanteLargo(p, g)}: ${modelo.millonesHablados(p.valor, lengua)}`);
    caja.dataset.indice = String(k);
  }
  function quitarCruz(caja, burbuja) {
    clearTimeout(cruzFija); cruzFija = null; tactil = null;
    cruz?.grupo.setAttribute('visibility', 'hidden');
    burbuja.hidden = true;
    delete caja.dataset.indice;
  }

  /* El teclado, según la serie de la pestaña: las flechas van de punto en
     punto y Re Pág / Av Pág saltan una hora (cada 5 minutos), un día (cada
     hora) o una semana (diaria). */
  const SALTO = { '5m': 12, '1h': 24, '1d': 7 };
  const AYUDA_TECLADO = {
    '5m': ['Usa las flechas para ir de 5 en 5 minutos y Re Pág y Av Pág para saltar una hora.', 'Use the arrow keys to move 5 minutes at a time and Page Up and Page Down to jump an hour.'],
    '1h': ['Usa las flechas para recorrer las horas y Re Pág y Av Pág para saltar un día.', 'Use the arrow keys to move through the hours and Page Up and Page Down to jump a day.'],
    '1d': ['Usa las flechas para recorrer los días.', 'Use the arrow keys to move through the days.'],
  };
  function graficoInteractivo(g) {
    const marco = el('div', 'mk-graf-marco mk-' + g.direccion);
    const caja = el('div', 'mk-graf');
    caja.tabIndex = 0;
    caja.setAttribute('role', 'slider');
    caja.setAttribute('aria-orientation', 'horizontal');
    caja.setAttribute('aria-label', tx('Gráfico del mercado', 'Market chart') + ', ' + g.periodoTexto + '. ' + g.etiqueta + ' ' +
      tx(...(AYUDA_TECLADO[g.resolucion] || AYUDA_TECLADO['1d'])));
    caja.setAttribute('aria-valuemin', '0');
    caja.setAttribute('aria-valuemax', String(g.puntos.length - 1));
    caja.setAttribute('aria-valuenow', String(g.puntos.length - 1));
    caja.setAttribute('aria-valuetext', `${instanteLargo(g.puntos.at(-1), g)}: ${modelo.millonesHablados(g.puntos.at(-1).valor, idioma())}`);
    // Qué serie pinta la pestaña y cuántos puntos tiene (lo leen las pruebas).
    caja.dataset.resolucion = g.resolucion;
    caja.dataset.puntos = String(g.puntos.length);
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
      const salto = SALTO[g.resolucion] || 7;
      const paso = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -salto, PageUp: salto }[ev.key];
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

  /* La misma serie en una tabla, para lectores de pantalla: todos los puntos,
     con su fecha y, en las finas, su hora de España. */
  const CAPTION = { '5m': ['Valor cada 5 minutos, ', 'Value every 5 minutes, '], '1h': ['Valor cada hora, ', 'Hourly value, '], '1d': ['Valor diario, ', 'Daily value, '] };
  function tablaSerie(g) {
    const caja = el('div', 'solo-lector');
    const t = el('table'), fina = g.resolucion !== '1d';
    t.append(el('caption', '', tx(...(CAPTION[g.resolucion] || CAPTION['1d'])) + g.periodoTexto + ' (' + g.alcance + tx(' tokens', ' tokens') + ')'));
    const cab = el('tr');
    cab.append(el('th', '', fina ? tx('Fecha y hora de España', 'Date and Spain time') : tx('Fecha', 'Date')), el('th', '', tx('Valor', 'Value')));
    for (const th of cab.children) th.setAttribute('scope', 'col');
    t.append(cab);
    for (const p of g.puntos) {
      const fila = el('tr');
      fila.append(el('th', '', fina ? fechaHora(p.ms) : modelo.fechaCorta(p.fecha, idioma())), el('td', '', modelo.millones(p.valor, idioma())));
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
    // Con la serie fina, de cuándo es: el día y la hora de España («13/11/2026, 16:05»).
    if (serie && hoy?.fuente === 'serie') fila(tx(`Valor hoy (${serie.incluidos} mayores)`, `Value today (${serie.incluidos} largest)`), modelo.millones(hoy.valor, lengua),
      hoy.t ? fechaHora(modelo.msMinuto(hoy.t)) : modelo.fechaCorta(hoy.fecha, lengua));
    fila(tx('Total de la categoría hoy', 'Category total today'), vivo ? modelo.millones(vivo.total.valor, lengua) : '—',
      vivo ? tx('todos los tokens · CoinGecko', 'all tokens · CoinGecko') : null);
    // 24 h: con la serie fina, el de la pestaña «24 h» (el mismo que se pinta); si no, el de la diaria si sus dos
    // últimos días son seguidos; si no, el de CoinGecko si es creíble; si no, «—».
    const c24 = una('cambio24h', () => modelo.cambio24h(serie, vivo));
    if (c24.cambio !== null) {
      const dir = modelo.direccion(c24.cambio);
      const c = el('span', 'mk-cambio mk-' + dir);
      const f = el('span', 'mk-flecha', FLECHA[dir] || ''); f.setAttribute('aria-hidden', 'true');
      c.append(f, el('span', '', modelo.porcentaje(c24.cambio, lengua)));
      let quienes = tx('toda la categoría', 'whole category');
      if (c24.fuente === 'serie') {
        // Si en la serie de 24 h queda algún token fuera, cuántos suma.
        const n = serie.incluidos, dentro = n - una('fuera24h', () => modelo.seriePestana(serie, '1d')?.fuera.length || 0);
        quienes = dentro === n ? tx(`${n} mayores`, `${n} largest`) : tx(`${dentro} de los ${n} mayores`, `${dentro} of the ${n} largest`);
      }
      fila(tx('Cambio en 24 h', '24 h change'), c, quienes);
    } else fila(tx('Cambio en 24 h', '24 h change'), '—');
    if (g) {
      // En las pestañas finas, también la hora del máximo y del mínimo («12 nov, 18:40»).
      const e = g.estadisticas;
      fila(tx('Máximo del periodo', 'Period high'), modelo.millones(e.max.valor, lengua), instanteDia(e.max, g));
      fila(tx('Mínimo del periodo', 'Period low'), modelo.millones(e.min.valor, lengua), instanteDia(e.min, g));
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
    como.append(el('summary', 'mk-como-tit', tx('Cómo se calcula', 'How it is calculated')), el('p', 'mk-nota-larga', una('nota|' + pestana + '|' + idioma(), () => modelo.notaSerie(serie, idioma(), pestana))));
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
    const g = serie ? graficoDe(pestana) : null;
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
      // En una pestaña fina con tokens fuera, su línea acaba por debajo de la cifra grande: se dice cuánto y por qué.
      if (g.avisoFuera) cab.append(el('p', 'mk-aviso mk-aviso-fuera', g.avisoFuera[0].toUpperCase() + g.avisoFuera.slice(1) + '.'));
    }
    // El directo encendido que no se puede usar: el gráfico es la copia publicada, y se dice hasta cuándo llega.
    const directo = avisoDirecto();
    if (directo) cab.append(el('p', 'mk-aviso mk-aviso-directo', directo));
    if (atrasada()) cab.append(el('p', 'mk-aviso mk-aviso-serie', avisoAtrasada()));
    // Una pestaña fina con la serie fina de más de 26 horas antes del dato de hoy: se dice hasta cuándo llega
    // (se hace una vez al día y la web se publica a mano; sin esto, «24 h» seguía en el día de la publicación).
    else if (g && g.resolucion !== '1d' && vivo && modelo.finaAtrasada(serie, vivo.actualizado)) {
      cab.append(el('p', 'mk-aviso mk-aviso-serie mk-aviso-fina', tx('Los datos cada 5 minutos y cada hora llegan hasta el ', 'The 5-minute and hourly data end on ') +
        fechaHora(modelo.msMinuto(valorHoy().t)) + tx(' (hora de España).', ' (Spain time).')));
    }
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
      // «24 h» solo con serie fina; las demás, con la fina o con la diaria (seriePestana).
      const sinDatos = !serie || !disponible(p.clave);
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
    // En escritorio se estira a lo ancho de su columna (unos 600 px): se dibuja a ese ancho para que el trazo
    // simplificado (indicesPintar, con la serie de cada hora) no se note al estirarlo.
    const W = matchMedia('(min-width:768px)').matches ? 600 : 112, H = 44, M = 3;
    const coords = modelo.coordenadas(g, W - 2 * M, H - 2 * M).map(c => ({ x: c.x + M, y: c.y + M }));
    const { linea: d, area, puentes } = modelo.trazosSvg(coords, modelo.tramosSeguidos(g), H);
    const id = 'mkMini' + Math.random().toString(36).slice(2, 8);
    // preserveAspectRatio="none": en escritorio se estira a lo ancho de su columna sin engordar la línea.
    const s = svg('svg', { class: 'mk-mini-svg mk-' + g.direccion, width: W, height: H, viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false' });
    s.dataset.resolucion = g.resolucion;
    s.dataset.puntos = String(g.puntos.length);
    const defs = svg('defs'), deg = svg('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 });
    deg.append(svg('stop', { offset: '0', class: 'mk-stop', 'stop-opacity': '0.3' }), svg('stop', { offset: '1', class: 'mk-stop', 'stop-opacity': '0' }));
    defs.append(deg);
    const yBase = coords[0].y;
    s.append(defs, svg('path', { class: 'mk-area', d: area, fill: `url(#${id})` }),
      svg('line', { class: 'mk-base', x1: M, x2: W - M, y1: yBase.toFixed(1), y2: yBase.toFixed(1) }),
      // Con la serie de cada hora (721 puntos), una línea más fina: a 1,75 px el mes se veía apelmazado.
      svg('path', { class: 'mk-linea' + (g.puntos.length > 120 ? ' mk-linea--densa' : ''), d }));
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
    const g = serie ? graficoDe('1m') : null;
    const a = el('a', 'mk-ct');
    a.href = '/mercado/';
    const izq = el('span', 'mk-ct-izq');
    izq.append(el('span', 'mk-ct-nom', tx('Activos tokenizados', 'Tokenised assets')),
      el('span', 'mk-ct-sub', serie ? tx(`Los ${serie.incluidos} mayores · CoinGecko`, `${serie.incluidos} largest · CoinGecko`) : tx('Toda la categoría · CoinGecko', 'Whole category · CoinGecko')));
    const der = el('span', 'mk-ct-der');
    der.append(el('span', 'mk-ct-cifra', modelo.millones(hoy.valor, idioma())));
    if (g) der.append(cambio(g, 'mk-ct-cambio'), el('span', 'mk-ct-periodo', g.periodoTexto));
    if (atrasada()) der.append(el('span', 'mk-ct-periodo mk-ct-hasta', tx('serie hasta el ', 'series to ') + modelo.fechaCorta(serie.puntos.at(-1).fecha, idioma())));
    // Sin el directo (encendido y fallando): «copia de las 16:05», la de la copia publicada.
    else if (avisoDirecto()) der.append(el('span', 'mk-ct-periodo mk-ct-copia', hoy.t ? tx('copia de las ', 'copy from ') + modelo.horaEspana(modelo.msMinuto(hoy.t)).hora : tx('copia publicada', 'published copy')));
    a.append(izq);
    if (g) a.append(minigrafico(g));
    a.append(der);
    a.setAttribute('aria-label', tx('Mercado de activos tokenizados', 'Tokenised asset market') + ', ' +
      (serie ? tx(`suma de los ${serie.incluidos} mayores tokens`, `sum of the ${serie.incluidos} largest tokens`) : tx('total de la categoría', 'category total')) + ': ' +
      modelo.millonesHablados(hoy.valor, idioma()) +
      (g ? ', ' + (g.direccion === 'sube' ? tx('sube', 'up') : g.direccion === 'baja' ? tx('baja', 'down') : tx('sin cambios', 'unchanged')) + ' ' + g.cambioTexto + ' ' + g.cambioFrase +
        (g.avisoTokens ? '; ' + g.avisoTokens : '') + (g.avisoFuera ? '; ' + g.avisoFuera : '') : '') +
      (atrasada() ? '; ' + tx('serie hasta el ', 'series to ') + modelo.fechaCorta(serie.puntos.at(-1).fecha, idioma()) : '') +
      '. ' + tx('Ver el gráfico', 'See the chart'));
    const partes = [a];
    // El % del mes es del tamaño del mercado, no una rentabilidad: también aquí.
    if (g) partes.push(el('p', 'mk-explica mk-ct-explica', modelo.explicacionCambio(idioma())));
    // Si en la serie del mes queda un token fuera, el minigráfico acaba algo por debajo de la cifra: se dice.
    if (g?.avisoFuera) partes.push(el('p', 'mk-aviso mk-aviso-fuera', g.avisoFuera[0].toUpperCase() + g.avisoFuera.slice(1) + '.'));
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
    const [v, r] = await Promise.all([cargarVivo(), cargarSerie()]);
    vivo = v;
    // Con qué series se pinta («5m,1h», «1h» o «diaria») y de dónde salen (directo, archivo o diaria): lo leen las pruebas.
    aplicarSerie(r);
    // Si 1 M no tiene datos, la primera pestaña que sí.
    pestanaConDatos();
    pintar();
    programar();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { clearTimeout(temporizador); temporizador = null; return; }
      if (Date.now() >= proximo) refrescar(); else programar();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  else iniciar();
})();

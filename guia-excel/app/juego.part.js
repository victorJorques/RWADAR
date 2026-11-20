  /* ================= capa de juego: iconos ================= */
  const ICO = {
    fuego: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 1.8c.4 3-1.1 4.9-2.6 6.6-1.4 1.6-2.7 3.1-2.4 5.5-.9-.6-1.5-1.7-1.6-3C5 12.5 4 14.6 4 16.8 4 20.2 7.6 23 12 23s8-2.8 8-6.6c0-5.5-4.9-7.6-6.5-14.6Zm-1.2 19.4c-2 0-3.5-1.3-3.5-3 0-1.9 1.6-3 2.4-4.6.6 1.3 1.6 1.8 2.6 1.8.3 1.3 2 1.9 2 3.3 0 1.4-1.5 2.5-3.5 2.5Z"/></svg>',
    rayo: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.2 1 3.5 13.6h6.8L9 23l10.4-13.3h-6.9L13.2 1Z"/></svg>',
    estrella: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 1.8 3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.9l-6.4 3.5L7 14.3l-5.3-5 7.2-.9L12 1.8Z"/></svg>',
    candado: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10.5" rx="2.5" fill="currentColor" stroke="none"/><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7"/></svg>',
    bandera: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 2h2v20H5zM8 3h11l-2.6 4.5L19 12H8z"/></svg>',
    libro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M3.5 9h17M3.5 14.5h17M9.5 3.5v17"/></svg>',
    maletin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 3h6a2 2 0 0 1 2 2v1.5h3A2 2 0 0 1 22 8.5v10A2.5 2.5 0 0 1 19.5 21h-15A2.5 2.5 0 0 1 2 18.5v-10a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2Zm0 2v1.5h6V5H9Z"/></svg>',
    trofeo: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 2h12v2h3v3a5 5 0 0 1-4.6 5A6 6 0 0 1 13 15.9V19h4v3H7v-3h4v-3.1A6 6 0 0 1 7.6 12 5 5 0 0 1 3 7V4h3V2Zm0 4H5v1a3 3 0 0 0 1.4 2.5A6 6 0 0 1 6 8V6Zm12 0v2c0 .5 0 1-.2 1.5A3 3 0 0 0 19 7V6h-1Z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    sonido: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
    silencio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="m16 9.5 5 5m0-5-5 5"/></svg>',
  };
  const icono = (n, cls) => { const s = h('span', { class: cls || '', html: ICO[n] }); s.style.display = 'inline-grid'; return s; };
  const COLORES_NIVEL = ['#5b7083', '#1f4fd1', '#0f8a6a', '#7a4bd1', '#c9572a', '#b0157a', '#c98a00'];
  function svgInsignia(i, gris) {
    const c = COLORES_NIVEL[i % COLORES_NIVEL.length];
    return `<svg class="insignia-nivel${gris ? ' gris' : ''}" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 3 57 17.5v29L32 61 7 46.5v-29Z" fill="${c}"/><path d="M32 9.5 51.5 20.8v22.4L32 54.5 12.5 43.2V20.8Z" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2"/><text x="32" y="40" text-anchor="middle" font-family="Archivo, Arial, sans-serif" font-weight="800" font-size="22" fill="#fff">${i}</text></svg>`;
  }

  /* ================= capa de juego: experiencia, racha, logros ================= */
  const METAS = [[20, 'Tranquila', '≈ 1 lección al día'], [50, 'Constante', '≈ 2-3 lecciones'], [100, 'Intensa', '≈ 5 lecciones']];
  function xpHoy() { return (P.dias || {})[hoy()] || 0; }
  function rachaActual() {
    const d = P.dias || {}; let n = 0; const f = new Date();
    if (!d[f.toISOString().slice(0, 10)]) f.setDate(f.getDate() - 1);
    while (d[f.toISOString().slice(0, 10)]) { n++; f.setDate(f.getDate() - 1); }
    return n;
  }
  let xpSesion = 0;
  function ganarXP(n, origen) {
    if (!n) return;
    P.xp = (P.xp || 0) + n; P.dias = P.dias || {}; P.dias[hoy()] = (P.dias[hoy()] || 0) + n; xpSesion += n;
    P.mejorRacha = Math.max(P.mejorRacha || 0, rachaActual());
    if (origen) { const r = origen.getBoundingClientRect ? origen.getBoundingClientRect() : null; if (r) { const f = h('div', { class: 'xp-flotante', style: { left: (r.left + r.width / 2 - 20) + 'px', top: (r.top - 10) + 'px' } }, '+' + n + ' XP'); document.body.append(f); setTimeout(() => f.remove(), 1200); } }
    pintarHUD(true);
  }
  /* sonido: tonos cortos con WebAudio (solo tras interacción) */
  let audio = null;
  function tono(notas) {
    if (P.sonido === false) return;
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); const t0 = audio.currentTime;
      notas.forEach(([f, d, cuando], i) => { const o = audio.createOscillator(); const g = audio.createGain(); o.type = 'triangle'; o.frequency.value = f; const t = t0 + (cuando ?? i * 0.09); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(audio.destination); o.start(t); o.stop(t + d + 0.02); });
    } catch (e) { /* sin audio */ }
  }
  const sonidoBien = () => tono([[660, 0.12], [880, 0.2]]);
  const sonidoMal = () => tono([[220, 0.22]]);
  const sonidoFin = () => tono([[523, 0.14], [659, 0.14], [784, 0.14], [1047, 0.4]]);
  function confeti() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = h('canvas', { class: 'confeti', 'aria-hidden': 'true' }); document.body.append(c);
    const ctx = c.getContext('2d'); const W = c.width = innerWidth; const H = c.height = innerHeight;
    const cols = ['#1f4fd1', '#17784c', '#c98a00', '#e0561b', '#7a4bd1'];
    const ps = Array.from({ length: 110 }, (_, i) => ({ x: W / 2 + (Math.random() - .5) * 120, y: H * 0.35, vx: (Math.random() - .5) * 13, vy: -Math.random() * 13 - 4, r: Math.random() * 6 + 4, a: Math.random() * 6, c: cols[i % cols.length] }));
    let t = 0; (function paso() { ctx.clearRect(0, 0, W, H); for (const p of ps) { p.vy += 0.42; p.x += p.vx; p.y += p.vy; p.a += 0.2; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore(); } if (++t < 95) requestAnimationFrame(paso); else c.remove(); })();
  }

  const LOGROS = [
    { id: 'primer_paso', t: 'Primer paso', d: 'Terminar tu primera lección', ok: (s) => s.lecciones >= 1 },
    { id: 'primera_formula', t: 'Primera fórmula', d: 'Acertar tu primera fórmula en la hoja', ok: (s) => s.formulas >= 1 },
    { id: 'sin_red', t: 'Sin red', d: '10 fórmulas acertadas a la primera y sin pistas', ok: (s) => s.formulasLimpias >= 10 },
    { id: 'dolar', t: 'Domadora del $', d: '5 ejercicios de copiar fórmulas con referencias fijas', ok: (s) => s.copias >= 5 },
    { id: 'cazadora', t: 'Cazadora de errores', d: 'Arreglar 5 fórmulas que venían mal', ok: (s) => s.arregladas >= 5 },
    { id: 'perfecta', t: 'Lección perfecta', d: 'Sacar 3 estrellas en una lección', ok: (s) => s.tresEstrellas >= 1 },
    { id: 'perfeccionista', t: 'Perfeccionista', d: '10 lecciones con 3 estrellas', ok: (s) => s.tresEstrellas >= 10 },
    { id: 'diez', t: 'En marcha', d: '10 lecciones terminadas', ok: (s) => s.lecciones >= 10 },
    { id: 'treinta', t: 'Imparable', d: '30 lecciones terminadas', ok: (s) => s.lecciones >= 30 },
    { id: 'racha3', t: 'Tres días seguidos', d: 'Practicar 3 días seguidos', ok: (s) => s.racha >= 3 },
    { id: 'racha7', t: 'Una semana', d: 'Racha de 7 días', ok: (s) => s.racha >= 7 },
    { id: 'racha30', t: 'Hábito de hierro', d: 'Racha de 30 días', ok: (s) => s.racha >= 30 },
    { id: 'memoria', t: 'Buena memoria', d: 'Repasar 50 tarjetas', ok: (s) => s.repasos >= 50 },
    { id: 'excel_real', t: 'Manos a la obra', d: 'Cuadrar los totales de un reto en tu Excel', ok: (s) => s.retos >= 1 },
    { id: 'primer_nivel', t: 'Primera insignia', d: 'Aprobar un examen de nivel', ok: (s) => s.examenes >= 1 },
    { id: 'proyecto', t: 'Primer encargo', d: 'Entregar tu primer proyecto', ok: (s) => s.proyectos >= 1 },
    { id: 'proyectos4', t: 'Profesional', d: 'Entregar 4 proyectos', ok: (s) => s.proyectos >= 4 },
    { id: 'certificada', t: 'Certificada', d: 'Conseguir el certificado final', ok: () => !!(P.certificado && P.certificado.fecha) },
  ];
  function estadisticas() {
    const ejs = Object.entries(P.ej || {});
    const esFormula = (id) => EJ_INDEX[id] && EJ_INDEX[id].modo === 'formula';
    return {
      lecciones: LECCIONES.filter((l) => estadoLeccion(l.id) === 'hecha').length,
      formulas: ejs.filter(([id, e]) => e.ok && esFormula(id)).length,
      formulasLimpias: ejs.filter(([id, e]) => e.ok && e.primera && esFormula(id)).length,
      copias: ejs.filter(([id, e]) => e.ok && esFormula(id) && (EJ_INDEX[id].copiar_a || []).length && /\$/.test(EJ_INDEX[id].solucion)).length,
      arregladas: ejs.filter(([id, e]) => e.ok && esFormula(id) && EJ_INDEX[id].inicial).length,
      tresEstrellas: Object.values(P.estrellas || {}).filter((x) => x >= 3).length,
      racha: Math.max(rachaActual(), P.mejorRacha || 0), repasos: P.repasos || 0,
      retos: ejs.filter(([id, e]) => e.ok && EJ_INDEX[id] && EJ_INDEX[id].modo === 'excel').length,
      examenes: Object.values(P.examenes || {}).filter((x) => x.aprobado).length,
      proyectos: Object.values(P.proyectos || {}).filter((x) => x.terminado).length,
    };
  }
  let logrosNuevos = [];
  function comprobarLogros() {
    const s = estadisticas(); P.logros = P.logros || {};
    for (const l of LOGROS) if (!P.logros[l.id] && l.ok(s)) { P.logros[l.id] = hoy(); logrosNuevos.push(l); ganarXP(25); if (!document.body.classList.contains('jugando')) toast('Logro conseguido: ' + l.t); }
  }
  function svgLogro(l, si) {
    const c = si ? 'var(--oro)' : 'var(--rejilla-2)';
    return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="${c}"/><circle cx="24" cy="24" r="16" fill="none" stroke="var(--hoja)" stroke-width="2" stroke-dasharray="3 3"/><g transform="translate(12 12)" fill="var(--hoja)">${ICO.estrella.replace('<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">', '').replace('</svg>', '')}</g></svg>`;
  }

  /* ================= nodos del mapa ================= */
  function construirNodos() {
    const mundos = [];
    niveles.forEach((n, ni) => {
      const nodos = [];
      for (const m of n.modulos) {
        const mod = MOD[m.id]; if (!mod) continue;
        mod.lecciones.forEach((l, li) => nodos.push({ tipo: 'leccion', id: l.id, titulo: l.titulo, num: nodos.filter((x) => x.tipo === 'leccion').length + 1, href: '#jugar-' + l.id }));
        if (mod.practica_excel) nodos.push({ tipo: 'reto', id: mod.id + '-excel', titulo: 'Reto en tu Excel: ' + mod.titulo, href: '#reto-' + mod.id });
      }
      if ((D.examenes_nivel || {})[n.id]) nodos.push({ tipo: 'examen', id: 'examen-' + n.id, titulo: 'Examen del nivel ' + ni, href: '#examen-' + n.id, nivel: n.id });
      mundos.push({ nivel: n, idx: ni, nodos });
    });
    if ((D.proyectos || []).length || D.examen) {
      const nodos = (D.proyectos || []).map((p) => ({ tipo: 'proyecto', id: p.id, titulo: p.titulo, href: '#proyecto-' + p.id }));
      if (D.examen) nodos.push({ tipo: 'final', id: 'final', titulo: 'Examen final y certificado', href: '#examen' });
      mundos.push({ nivel: { id: 'proyectos', nombre: 'Proyectos de empresa', lema: 'Encargos completos, de principio a fin, como en una oficina de verdad.' }, idx: niveles.length, nodos, final: true });
    }
    return mundos;
  }
  function nodoHecho(nd) {
    if (nd.tipo === 'leccion') return ['hecha', 'saltada'].includes(estadoLeccion(nd.id));
    if (nd.tipo === 'reto') return !!(P.ej[nd.id] && (P.ej[nd.id].ok || P.ej[nd.id].saltado));
    if (nd.tipo === 'examen') return !!(P.examenes && P.examenes[nd.nivel] && P.examenes[nd.nivel].aprobado);
    if (nd.tipo === 'proyecto') return !!(P.proyectos[nd.id] && P.proyectos[nd.id].terminado);
    if (nd.tipo === 'final') return !!(P.certificado && P.certificado.fecha);
    return false;
  }
  function estadoNodos() {
    const mundos = construirNodos();
    let anteriorHecho = true; let actual = null;
    for (const w of mundos) for (const nd of w.nodos) {
      nd.hecho = nodoHecho(nd);
      // los retos no bloquean; el examen de nivel no bloquea el nivel siguiente (sí el certificado)
      nd.abierto = anteriorHecho || nd.hecho;
      if (!actual && nd.abierto && !nd.hecho) actual = nd;
      if (nd.tipo === 'leccion' || nd.tipo === 'proyecto') anteriorHecho = nd.hecho || (nd.abierto && false) ? nd.hecho : nd.hecho;
      if (nd.tipo === 'proyecto') anteriorHecho = true; // los proyectos se hacen en cualquier orden
    }
    for (const w of mundos) for (const nd of w.nodos) nd.actual = nd === actual;
    return { mundos, actual };
  }

  function pintarCamino(w) {
    const N = w.nodos.length; const paso = 104; const alto = N * paso + 30;
    const pts = w.nodos.map((nd, i) => ({ x: 50 + 26 * Math.sin(i * 0.95 + w.idx * 0.7), y: 52 + i * paso }));
    const camino = h('ol', { class: 'camino', style: { height: alto + 'px' } });
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p.x + ' ' + p.y).join(' ');
    camino.append(h('li', { 'aria-hidden': 'true', style: { listStyle: 'none' }, html: `<svg class="ruta" viewBox="0 0 100 ${alto}" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="var(--rejilla-2)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 12" vector-effect="non-scaling-stroke"/></svg>` }));
    w.nodos.forEach((nd, i) => {
      const p = pts[i]; const izq = p.x > 50;
      const clases = ['nodo', nd.tipo, nd.hecho ? 'hecho' : '', !nd.abierto ? 'bloqueado' : '', nd.actual ? 'actual' : '', izq ? 'izq' : ''].join(' ');
      const est = P.estrellas && P.estrellas[nd.id];
      const contenido = !nd.abierto ? icono('candado') : nd.tipo === 'leccion' ? (nd.hecho ? icono('check') : String(nd.num)) : nd.tipo === 'reto' ? icono('libro') : nd.tipo === 'examen' ? icono('bandera') : nd.tipo === 'proyecto' ? icono('maletin') : icono('trofeo');
      const etiquetaTexto = `${nd.titulo}${nd.hecho ? ' (completado)' : !nd.abierto ? ' (bloqueado)' : ''}`;
      const bola = nd.abierto ? h('a', { class: 'bola', href: nd.href, 'aria-label': etiquetaTexto }, contenido) : h('button', { class: 'bola', type: 'button', 'aria-label': etiquetaTexto, onclick: (e) => mostrarBloqueado(e, nd) }, contenido);
      const etq = h('div', { class: 'etiqueta' }, nd.titulo, nd.tipo === 'leccion' && nd.hecho && est ? h('div', { class: 'estrellas', 'aria-label': `${est} estrellas` }, [1, 2, 3].map((k) => icono('estrella', 'estrella' + (k <= est ? ' si' : '')))) : null);
      camino.append(h('li', { class: clases, style: { left: p.x + '%', top: p.y + 'px' } }, bola, etq));
    });
    return camino;
  }
  function mostrarBloqueado(e, nd) {
    document.querySelectorAll('.burbuja').forEach((b) => b.remove());
    const li = e.currentTarget.closest('li');
    const b = h('div', { class: 'burbuja', role: 'dialog', 'aria-label': 'Lección bloqueada', style: { top: '4.4rem' } }, h('h3', null, nd.titulo), h('p', { class: 'tenue' }, 'Se desbloquea al terminar lo anterior. Así cada paso se apoya en el que ya sabes.'), h('div', { class: 'fila' }, h('button', { class: 'boton peq', type: 'button', onclick: () => b.remove() }, 'Vale'), h('a', { class: 'boton fantasma peq', href: nd.href }, 'Abrir igualmente')));
    li.append(b); setTimeout(() => document.addEventListener('click', function fuera(ev) { if (!b.contains(ev.target)) { b.remove(); document.removeEventListener('click', fuera); } }), 0);
  }

  /* ================= portada: el mapa ================= */
  function vistaMapa() {
    titulo(null);
    const { mundos, actual } = estadoNodos();
    const total = LECCIONES.length; const hechas = LECCIONES.filter((l) => estadoLeccion(l.id) === 'hecha').length;
    const meta = P.meta || 50; const pct = Math.min(100, Math.round(xpHoy() / meta * 100));
    const racha = rachaActual();
    const nuevo = !hechas && !Object.keys(P.ej || {}).length;
    const panel = h('section', { class: 'panel-hoy' },
      h('div', { class: 'pila' },
        h('div', { class: 'sobretitulo' }, nuevo ? 'Excel desde cero, jugando' : (P.nombre ? `Hola, ${P.nombre}` : 'Tu partida')),
        h('h1', null, nuevo ? 'Aprende Excel nivel a nivel hasta trabajar sola' : actual ? actual.titulo : '¡Lo has completado todo!'),
        nuevo ? h('p', { class: 'entradilla' }, 'Lecciones de 10 minutos, ejercicios que se corrigen al momento y proyectos reales de oficina. Empieza por la primera: no hace falta saber nada.') : null,
        h('div', { class: 'stats' },
          h('div', { class: 'stat' }, icono('fuego', racha ? '' : ''), h('div', null, h('b', { style: { color: racha ? 'var(--fuego)' : 'var(--tinta-3)' } }, racha), h('span', null, racha === 1 ? 'día de racha' : 'días de racha'))),
          h('div', { class: 'stat', style: { color: 'var(--oro)' } }, icono('rayo'), h('div', null, h('b', null, P.xp || 0), h('span', null, 'puntos de experiencia'))),
          h('div', { class: 'stat' }, h('div', { class: 'anillo', style: { '--p': pct } }), h('div', null, h('b', null, `${xpHoy()}/${meta}`), h('span', null, 'meta de hoy'))),
          h('div', { class: 'stat' }, h('div', null, h('b', null, `${hechas}/${total}`), h('span', null, 'lecciones'))))),
      h('div', { class: 'pila', style: { alignItems: 'stretch' } },
        actual ? h('a', { class: 'boton primario gigante', href: actual.href }, nuevo ? 'Empezar' : 'Continuar') : h('a', { class: 'boton primario gigante', href: '#perfil' }, 'Ver mi certificado'),
        tarjetasPendientes().length ? h('a', { class: 'boton', href: '#repaso' }, `Repaso del día (${tarjetasPendientes().length})`) : null,
        nuevo ? h('a', { class: 'boton fantasma', href: '#prueba' }, '¿Ya sabes algo? Prueba de nivel') : null));
    const lista = h('div', { class: 'pila-g' });
    for (const w of mundos) {
      const p = w.final ? { pct: w.nodos.filter((n) => n.hecho).length / Math.max(1, w.nodos.length), hechas: w.nodos.filter((n) => n.hecho).length, total: w.nodos.length } : progresoNivel(w.nivel);
      const aprobado = !w.final && P.examenes && P.examenes[w.nivel.id] && P.examenes[w.nivel.id].aprobado;
      lista.append(h('section', { class: 'mundo', id: 'mundo-' + w.nivel.id },
        h('header', { class: 'mundo-cab' }, h('div', { html: w.final ? `<svg class="insignia-nivel${(P.certificado && P.certificado.fecha) ? '' : ' gris'}" viewBox="0 0 24 24" style="color:var(--oro)">${ICO.trofeo.replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>` : svgInsignia(w.idx, !aprobado) }),
          h('div', { class: 'pila', style: { gap: '.35rem' } }, h('div', { class: 'sobretitulo' }, w.final ? 'Nivel final' : `Nivel ${w.idx}`), h('h2', null, w.nivel.nombre), h('p', null, w.nivel.lema || ''),
            h('div', { class: 'barra-prog' + (p.pct === 1 ? ' bien' : '') }, h('i', { style: { width: Math.round(p.pct * 100) + '%' } })),
            h('div', { class: 'entre' }, h('span', { class: 'tenue' }, `${p.hechas} de ${p.total}${w.nivel.horas ? ' · unas ' + w.nivel.horas + ' h' : ''}`), w.final ? null : h('a', { href: '#nivel-' + w.nivel.id, class: 'tenue' }, 'Qué aprenderás')))),
        pintarCamino(w)));
    }
    vista().replaceChildren(h('div', { class: 'pila-g' }, panel, lista));
    if (actual && !nuevo) setTimeout(() => { const el = document.querySelector('.nodo.actual'); if (el && el.getBoundingClientRect().top > innerHeight) el.scrollIntoView({ block: 'center' }); }, 50);
  }

  /* ================= reproductor de lección (pantalla a pantalla) ================= */
  let escuchaEj = null;
  function pantallasDe(l) {
    const mod = MOD[l.modulo]; const out = [];
    out.push({ tipo: 'intro' });
    if (mod.lecciones[0].id === l.id) for (const e of mod.repaso_inicial || []) out.push({ tipo: 'ej', ej: e, etq: 'Calentamiento: repaso de lo anterior', fuera: true });
    let cur = null;
    if (mod.lecciones[0].id === l.id && mod.intro) { cur = { tipo: 'explica', bloques: [{ tipo: 'texto', md: mod.intro }] }; out.push(cur); }
    for (const b of l.bloques) {
      if (b.tipo === 'ejercicio') { out.push({ tipo: 'ej', ej: b }); cur = null; }
      else if (cur && ['aviso', 'hoja', 'atajos'].includes(b.tipo) && cur.bloques.length < 3) cur.bloques.push(b);
      else { cur = { tipo: 'explica', bloques: [b] }; out.push(cur); }
    }
    for (const e of l.recuerda || []) out.push({ tipo: 'ej', ej: e, etq: 'Recuerda sin mirar' });
    return out;
  }
  const REPETIBLES = ['test', 'predice', 'respuesta_corta', 'cinta', 'ordenar', 'senala'];
  function vistaJugar(id) {
    const l = LEC[id]; if (!l) return vistaMapa();
    leccionActual = l; titulo(l.titulo); document.body.classList.add('jugando');
    if (estadoLeccion(id) === 'pendiente') marcarLeccion(id, 'empezada');
    P.ultima = '#jugar-' + id; guardar();
    const nIdx = niveles.findIndex((n) => n.id === l.nivel);
    const ctx = { titulo: l.titulo, objetivo: l.objetivo, nivel: niveles[nIdx].nombre, texto: l.bloques.filter((b) => b.tipo === 'texto').map((b) => b.md).join('\n').slice(0, 3000) };
    const pantallas = pantallasDe(l);
    const repetidos = new Set(); const resultados = {}; let i = 0; xpSesion = 0; logrosNuevos = [];
    const barraProg = h('div', { class: 'progreso-leccion', role: 'progressbar', 'aria-label': 'Progreso de la lección' }, h('i', { style: { width: '0%' } }));
    const btnSonido = h('button', { class: 'cerrar', type: 'button', 'aria-label': 'Sonido', title: 'Sonido', onclick: () => { P.sonido = P.sonido === false; guardar(); btnSonido.replaceChildren(icono(P.sonido === false ? 'silencio' : 'sonido')); } }, icono(P.sonido === false ? 'silencio' : 'sonido'));
    const cab = h('div', { class: 'jugar-cab' }, h('a', { class: 'cerrar', href: '#inicio', 'aria-label': 'Salir al mapa', title: 'Salir al mapa' }, '✕'), barraProg, btnSonido);
    const zona = h('div', { class: 'pantalla-jugar' });
    const msj = h('span', { class: 'msj-barra', role: 'status' });
    const btn = h('button', { class: 'boton primario gigante', type: 'button' }, 'Continuar');
    const saltar = h('button', { class: 'boton fantasma peq', type: 'button', hidden: true }, 'Hacerlo luego');
    const barra = h('div', { class: 'barra-continuar' }, h('div', { class: 'in' }, h('div', { class: 'fila' }, msj, saltar), btn));
    const cont = h('div', { class: 'jugar' }, cab, zona, barra);
    function estadoBarra(clase, texto, habilitado) { barra.className = 'barra-continuar' + (clase ? ' ' + clase : ''); msj.textContent = texto || ''; btn.disabled = !habilitado; }
    function pintar() {
      const p = pantallas[i];
      barraProg.firstChild.style.width = Math.round(i / pantallas.length * 100) + '%';
      zona.innerHTML = ''; saltar.hidden = true; escuchaEj = null;
      if (p.tipo === 'intro') {
        zona.append(h('div', { class: 'pila', style: { gap: '1rem', paddingTop: '1rem' } }, h('div', { class: 'etq-pantalla' }, `Nivel ${nIdx} · ${MOD[l.modulo].titulo}`), h('h1', null, l.titulo), l.objetivo ? h('p', { class: 'entradilla' }, l.objetivo) : null,
          h('div', { class: 'fila' }, h('span', { class: 'chip' }, `${l.minutos || 12} min`), h('span', { class: 'chip' }, `${pantallas.filter((x) => x.tipo === 'ej').length} ejercicios`), (l.funciones || []).map((f) => h('span', { class: 'chip fn' }, f))),
          h('p', { class: 'tenue' }, 'Ve a tu ritmo. Si fallas algo, no pasa nada: lo repasamos al final.')));
        estadoBarra('', '', true); btn.textContent = 'Empezar';
      } else if (p.tipo === 'explica') {
        zona.append(h('div', { class: 'pila', style: { gap: '1rem' } }, p.bloques.map((b) => renderBloque(b, ctx))));
        estadoBarra('', '', true); btn.textContent = 'Continuar';
      } else if (p.tipo === 'ej') {
        const ej = p.ej; const yaResuelto = resultados[ej.id + (p.rep ? '-r' : '')];
        if (p.etq || p.rep) zona.append(h('div', { class: 'etq-pantalla' }, p.rep ? 'Otra vez: este se te resistió' : p.etq));
        zona.append(renderEjercicio(ej, ctx));
        btn.textContent = 'Continuar';
        const libre = ['abierta', 'excel'].includes(ej.modo);
        estadoBarra('', libre ? '' : 'Responde para seguir', libre || !!yaResuelto);
        if (ej.modo === 'excel') { saltar.hidden = false; saltar.onclick = () => { registrarEj(ej.id, false, { saltado: true }); siguiente(); }; }
        escuchaEj = (id, ok, info) => {
          if (id !== ej.id) return;
          const clave = ej.id + (p.rep ? '-r' : '');
          const primera = !(clave in resultados);
          if (primera) resultados[clave] = ok;
          if (ok) { sonidoBien(); estadoBarra('bien', info && info.xp ? `¡Bien! +${info.xp} XP` : '¡Bien!', true); }
          else if (info && info.vista) { estadoBarra('mal', 'Mira la solución y sigue', true); }
          else {
            sonidoMal();
            if (ej.modo === 'formula') estadoBarra('mal', 'Casi. Prueba otra vez o pide una pista', false);
            else { estadoBarra('mal', 'No pasa nada: lo repasamos al final', true); if (primera && !p.rep && REPETIBLES.includes(ej.modo) && !repetidos.has(ej.id)) { repetidos.add(ej.id); pantallas.push({ tipo: 'ej', ej, rep: true }); } }
          }
        };
      }
      btn.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
    function siguiente() { i++; if (i >= pantallas.length) return terminar(); pintar(); }
    btn.addEventListener('click', () => { if (!btn.disabled) siguiente(); });
    function terminar() {
      escuchaEj = null;
      const propios = [...l.bloques.filter((b) => b.tipo === 'ejercicio'), ...(l.recuerda || [])].filter((e) => !['abierta', 'excel'].includes(e.modo));
      const limpios = propios.filter((e) => P.ej[e.id] && P.ej[e.id].ok && P.ej[e.id].primera).length;
      const ratio = propios.length ? limpios / propios.length : 1;
      const estrellas = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1;
      completarLeccion(l, estrellas);
      document.body.classList.remove('jugando');
      sonidoFin(); confeti();
      const idx = LECCIONES.indexOf(l); const sig = LECCIONES[idx + 1];
      const { actual } = estadoNodos();
      const destino = actual ? actual.href : '#inicio';
      const meta = P.meta || 50;
      cont.replaceChildren(h('div', { class: 'resultado' },
        h('div', { class: 'estrellas-grandes', 'aria-label': `${estrellas} de 3 estrellas` }, [1, 2, 3].map((k) => h('span', { class: '', html: ICO.estrella.replace('<svg ', `<svg class="${k <= estrellas ? 'si' : ''}" `) }))),
        h('h1', null, estrellas === 3 ? '¡Lección perfecta!' : estrellas === 2 ? '¡Muy bien!' : '¡Lección completada!'),
        h('p', { class: 'entradilla' }, estrellas === 3 ? 'Todo a la primera y sin pistas. Esto ya es tuyo.' : `Has acertado a la primera ${limpios} de ${propios.length}. ${estrellas < 3 ? 'Repítela cuando quieras para conseguir las 3 estrellas.' : ''}`),
        h('div', { class: 'recuadros' }, h('div', { class: 'recuadro oro' }, h('b', null, '+' + xpSesion), h('span', null, 'XP')), h('div', { class: 'recuadro fuego' }, h('b', null, rachaActual()), h('span', null, 'días de racha')), h('div', { class: 'recuadro verde' }, h('b', null, `${Math.min(100, Math.round(xpHoy() / meta * 100))}%`), h('span', null, 'meta de hoy'))),
        logrosNuevos.map((g) => h('div', { class: 'logro-nuevo' }, h('span', { html: svgLogro(g, true) }), h('div', null, h('b', null, 'Logro: ' + g.t), h('div', { class: 'tenue' }, g.d)))),
        (l.tarjetas || []).length ? h('p', { class: 'tenue' }, `${l.tarjetas.length} tarjeta${l.tarjetas.length > 1 ? 's' : ''} nueva${l.tarjetas.length > 1 ? 's' : ''} en tu repaso.`) : null,
        h('div', { class: 'fila', style: { justifyContent: 'center' } }, h('a', { class: 'boton primario gigante', href: destino }, sig && destino === '#jugar-' + sig.id ? 'Siguiente lección' : 'Seguir'), h('a', { class: 'boton', href: '#inicio' }, 'Volver al mapa'), h('a', { class: 'boton fantasma', href: '#leccion-' + l.id }, 'Ver la lección entera'))));
      window.scrollTo(0, 0);
    }
    vista().replaceChildren(cont);
    pintar();
  }
  function completarLeccion(l, estrellas) {
    const primeraVez = estadoLeccion(l.id) !== 'hecha';
    marcarLeccion(l.id, 'hecha'); desbloquearTarjetas(l);
    P.estrellas = P.estrellas || {};
    const antes = P.estrellas[l.id] || 0;
    if (estrellas) P.estrellas[l.id] = Math.max(antes, estrellas);
    if (primeraVez) ganarXP(20);
    if (estrellas === 3 && antes < 3) ganarXP(10);
    comprobarLogros(); guardar();
  }

  /* ================= examen de nivel ================= */
  function vistaExamenNivel(nid) {
    const ex = (D.examenes_nivel || {})[nid]; const ni = niveles.findIndex((n) => n.id === nid);
    if (!ex || ni < 0) return vistaMapa();
    titulo('Examen del nivel ' + ni);
    const prev = P.examenes && P.examenes[nid];
    const preguntas = ex.preguntas || [];
    const umbral = ex.umbral || 0.8;
    const inicio = h('div', { class: 'jugar' }, h('div', { class: 'jugar-cab' }, h('a', { class: 'cerrar', href: '#inicio', 'aria-label': 'Salir al mapa' }, '✕'), h('div'), h('span')),
      h('div', { class: 'resultado' }, h('div', { html: svgInsignia(ni, !(prev && prev.aprobado)) }), h('div', { class: 'sobretitulo' }, `Nivel ${ni} · ${niveles[ni].nombre}`), h('h1', null, ex.titulo || 'Examen del nivel'), h('p', { class: 'entradilla' }, ex.intro || `${preguntas.length} preguntas. Para aprobar necesitas acertar a la primera el ${Math.round(umbral * 100)} %. Sin pistas.`),
        prev ? h('p', { class: 'tenue' }, `Tu mejor nota: ${Math.round(prev.nota * 100)} %${prev.aprobado ? ' · aprobado' : ''}`) : null,
        h('div', { class: 'fila', style: { justifyContent: 'center' } }, h('button', { class: 'boton primario gigante', type: 'button', onclick: empezar }, prev ? 'Repetir el examen' : 'Empezar el examen'), h('a', { class: 'boton', href: '#nivel-' + nid }, 'Repasar el nivel antes'))));
    function empezar() {
      document.body.classList.add('jugando'); modoExamen = true;
      const res = {}; let i = 0;
      const barraProg = h('div', { class: 'progreso-leccion' }, h('i', { style: { width: '0%' } }));
      const zona = h('div', { class: 'pantalla-jugar' });
      const msj = h('span', { class: 'msj-barra', role: 'status' });
      const btn = h('button', { class: 'boton primario gigante', type: 'button', disabled: true }, 'Continuar');
      const barra = h('div', { class: 'barra-continuar' }, h('div', { class: 'in' }, msj, btn));
      const cont = h('div', { class: 'jugar' }, h('div', { class: 'jugar-cab' }, h('a', { class: 'cerrar', href: '#inicio', 'aria-label': 'Abandonar', onclick: () => { modoExamen = false; } }, '✕'), barraProg, h('span', { class: 'tenue mono' }, '')), zona, barra);
      function pintar() {
        const q = { ...preguntas[i], id: `ex-${nid}-${preguntas[i].id || i}-${Date.now() % 100000}` };
        barraProg.firstChild.style.width = Math.round(i / preguntas.length * 100) + '%';
        cont.querySelector('.jugar-cab .mono').textContent = `${i + 1}/${preguntas.length}`;
        zona.replaceChildren(renderEjercicio(q, { titulo: 'examen' }));
        barra.className = 'barra-continuar'; msj.textContent = ''; btn.disabled = true;
        escuchaEj = (id, ok) => { if (id !== q.id || (i in res)) return; res[i] = ok; btn.disabled = false; barra.className = 'barra-continuar ' + (ok ? 'bien' : 'mal'); msj.textContent = ok ? 'Correcta' : 'Incorrecta'; ok ? sonidoBien() : sonidoMal(); };
        window.scrollTo(0, 0);
      }
      btn.addEventListener('click', () => { i++; if (i < preguntas.length) pintar(); else fin(); });
      function fin() {
        modoExamen = false; escuchaEj = null; document.body.classList.remove('jugando');
        const aciertos = Object.values(res).filter(Boolean).length; const nota = aciertos / preguntas.length; const aprobado = nota >= umbral;
        P.examenes = P.examenes || {}; const antes = P.examenes[nid];
        const primeraAprobada = aprobado && !(antes && antes.aprobado);
        if (!antes || nota >= antes.nota) P.examenes[nid] = { nota, aprobado: aprobado || !!(antes && antes.aprobado), fecha: hoy() };
        if (primeraAprobada) { ganarXP(100); sonidoFin(); confeti(); }
        comprobarLogros(); guardar();
        const falladas = preguntas.map((q, k) => ({ q, k })).filter((x) => !res[x.k]);
        cont.replaceChildren(h('div', { class: 'resultado' }, h('div', { html: svgInsignia(ni, !aprobado) }), h('h1', null, aprobado ? '¡Nivel superado!' : 'Aún no, pero estás cerca'), h('p', { class: 'entradilla' }, `${aciertos} de ${preguntas.length} correctas (${Math.round(nota * 100)} %). ${aprobado ? 'Has ganado la insignia del nivel ' + ni + '.' : `Necesitas ${Math.round(umbral * 100)} %. Repasa lo que has fallado y vuelve a intentarlo: cada intento cuenta.`}`),
          falladas.length ? h('div', { class: 'pila', style: { textAlign: 'left', width: '100%', maxWidth: '36rem' } }, h('h3', null, 'Para repasar'), h('ul', { class: 'lista-sola' }, falladas.map(({ q }) => h('li', null, h('span', { html: enLinea(String(q.pregunta || q.enunciado || '').split('\n')[0].slice(0, 140)) }), q.leccion && LEC[q.leccion] ? [' · ', h('a', { href: '#leccion-' + q.leccion }, 'ver lección')] : null)))) : null,
          h('div', { class: 'fila', style: { justifyContent: 'center' } }, aprobado ? h('button', { class: 'boton primario gigante', type: 'button', onclick: () => descargarCertificado({ tipo: 'nivel', nivel: ni }) }, 'Descargar el certificado del nivel') : h('button', { class: 'boton primario gigante', type: 'button', onclick: () => vistaExamenNivel(nid) }, 'Volver a intentarlo'), h('a', { class: 'boton', href: '#inicio' }, 'Volver al mapa'))));
        window.scrollTo(0, 0);
      }
      vista().replaceChildren(cont); pintar();
    }
    vista().replaceChildren(inicio);
  }
  let modoExamen = false;

  /* ================= reto de Excel real (nodo del mapa) ================= */
  function vistaReto(modId) {
    const mod = MOD[modId]; if (!mod || !mod.practica_excel) return vistaMapa();
    titulo('Reto: ' + mod.titulo);
    const ej = { id: mod.id + '-excel', modo: 'excel', ...mod.practica_excel };
    vista().replaceChildren(h('div', { class: 'jugar' }, h('div', { class: 'jugar-cab' }, h('a', { class: 'cerrar', href: '#inicio', 'aria-label': 'Volver al mapa' }, '✕'), h('div', { class: 'etq-pantalla' }, 'Reto en tu Excel'), h('span')),
      h('h1', null, mod.titulo), h('p', { class: 'entradilla' }, 'Lo que acabas de aprender, ahora en tu Excel de verdad. Descarga el libro, sigue las instrucciones de la primera hoja y comprueba aquí tus totales.'),
      renderEjercicio(ej, { titulo: mod.titulo }),
      h('div', { class: 'siguiente' }, h('button', { class: 'boton fantasma', type: 'button', onclick: () => { registrarEj(ej.id, false, { saltado: true }); location.hash = '#inicio'; } }, 'Lo haré más tarde'), h('a', { class: 'boton primario', href: '#inicio' }, 'Volver al mapa'))));
  }

  /* ================= perfil, logros, expediente ================= */
  function vistaPerfil() {
    titulo('Mi progreso');
    const s = estadisticas();
    const nombre = h('input', { class: 'entrada-corta', type: 'text', id: 'perfil-nombre', placeholder: 'Tu nombre (para el certificado)', value: P.nombre || '', 'aria-label': 'Tu nombre' });
    nombre.addEventListener('change', () => { P.nombre = nombre.value.trim(); guardar(); toast('Guardado'); });
    const metas = h('div', { class: 'fila' }, METAS.map(([v, t, d]) => h('button', { class: 'boton' + ((P.meta || 50) === v ? ' primario' : ''), type: 'button', onclick: () => { P.meta = v; guardar(); vistaPerfil(); } }, `${t} · ${v} XP`, h('span', { class: 'oculto-visual' }, d))));
    const exp = niveles.map((n, i) => { const p = progresoNivel(n); const e = P.examenes && P.examenes[n.id]; return h('tr', null, h('td', null, h('b', null, `Nivel ${i}`), ' · ', n.nombre), h('td', null, `${p.hechas}/${p.total}`), h('td', null, e ? `${Math.round(e.nota * 100)} %` : '—'), h('td', null, e && e.aprobado ? h('span', { style: { color: 'var(--bien)', fontWeight: 700 } }, 'Superado') : p.pct === 1 ? 'Examen pendiente' : 'En curso')); });
    const archivo = h('input', { type: 'file', accept: 'application/json,.json', class: 'oculto-visual', id: 'importar', onchange: async (e) => { const f = e.target.files[0]; if (!f) return; try { const datos = JSON.parse(await f.text()); if (datos.v !== 1) throw new Error(); P = fusionar(P, datos); guardar(); toast('Progreso cargado'); vistaPerfil(); } catch (x) { toast('Ese archivo no es un progreso de Hoja a hoja.'); } } });
    vista().replaceChildren(h('div', { class: 'pila-g' },
      h('section', { class: 'panel-hoy' }, h('div', { class: 'pila' }, h('div', { class: 'sobretitulo' }, 'Mi progreso'), h('h1', null, P.nombre || 'Tu perfil'), h('div', { class: 'stats' },
        h('div', { class: 'stat', style: { color: 'var(--fuego)' } }, icono('fuego'), h('div', null, h('b', null, rachaActual()), h('span', null, `racha · mejor: ${P.mejorRacha || 0}`))),
        h('div', { class: 'stat', style: { color: 'var(--oro)' } }, icono('rayo'), h('div', null, h('b', null, P.xp || 0), h('span', null, 'XP en total'))),
        h('div', { class: 'stat' }, h('div', null, h('b', null, s.lecciones), h('span', null, 'lecciones'))),
        h('div', { class: 'stat' }, h('div', null, h('b', null, Object.values(P.ej || {}).filter((e) => e.ok).length), h('span', null, 'ejercicios resueltos'))))),
        h('div', { class: 'pila' }, nombre, h('label', { class: 'fila tenue' }, h('input', { type: 'checkbox', checked: P.sonido !== false, onchange: (e) => { P.sonido = e.target.checked; guardar(); } }), 'Sonidos al acertar'))),
      h('section', { class: 'pila' }, h('h2', null, 'Meta diaria'), h('p', { class: 'tenue' }, 'Mejor poco cada día que mucho un día suelto: la constancia es lo que hace que se quede.'), metas),
      h('section', { class: 'pila' }, h('h2', null, 'Insignias de nivel'), h('div', { class: 'insignias' }, niveles.map((n, i) => { const ok = P.examenes && P.examenes[n.id] && P.examenes[n.id].aprobado; return h('div', { class: 'logro' + (ok ? '' : ' no') }, h('span', { html: svgInsignia(i, !ok) }), h('b', null, n.nombre), h('span', null, ok ? 'Conseguida ' + P.examenes[n.id].fecha.split('-').reverse().join('/') : 'Aprueba el examen del nivel'), ok ? h('button', { class: 'boton fantasma peq', type: 'button', onclick: () => descargarCertificado({ tipo: 'nivel', nivel: i }) }, 'Certificado') : null); }))),
      h('section', { class: 'pila' }, h('h2', null, 'Logros'), h('div', { class: 'logros' }, LOGROS.map((l) => { const ok = P.logros && P.logros[l.id]; return h('div', { class: 'logro' + (ok ? '' : ' no') }, h('span', { html: svgLogro(l, !!ok) }), h('b', null, l.t), h('span', null, l.d)); }))),
      h('section', { class: 'pila' }, h('h2', null, 'Expediente'), h('div', { class: 'tabla-env expediente' }, h('table', { class: 'tabla-datos' }, h('thead', null, h('tr', null, h('th', null, 'Nivel'), h('th', null, 'Lecciones'), h('th', null, 'Examen'), h('th', null, 'Estado'))), h('tbody', null, exp))), h('div', null, h('a', { class: 'boton primario', href: '#certificado' }, 'Ver los requisitos del certificado'))),
      h('section', { class: 'pila' }, h('h2', null, 'Copia de seguridad'), h('p', { class: 'tenue' }, dbDoc ? 'Tu progreso se guarda en tu cuenta y en este navegador.' : 'Tu progreso se guarda en este navegador. Si cambias de ordenador, descarga una copia y cárgala en el otro.'),
        h('div', { class: 'fila' }, h('button', { class: 'boton', type: 'button', onclick: async () => { if (!CAP.downloads) { toast('La descarga no está disponible aquí.'); return; } try { await CAP.downloads.save({ filename: 'progreso-hoja-a-hoja.json', data: JSON.stringify(P) }); } catch (e) { /* */ } } }, 'Descargar mi progreso'), h('label', { class: 'boton', for: 'importar' }, 'Cargar un progreso'), archivo))));
  }

  /* ================= certificado ================= */
  function requisitos() {
    const examenes = niveles.filter((n) => (D.examenes_nivel || {})[n.id]);
    const aprob = examenes.filter((n) => P.examenes && P.examenes[n.id] && P.examenes[n.id].aprobado).length;
    const proyMin = Math.min(4, (D.proyectos || []).length);
    const proyOk = (D.proyectos || []).filter((p) => { const e = P.proyectos[p.id]; if (!e || !e.terminado) return false; const r = p.rubrica || []; return r.every((_, i) => (e.rubrica || {})[i] >= 2); }).length;
    const fin = P.examenFinal || null;
    return [
      { t: `Aprobar los ${examenes.length} exámenes de nivel (80 % o más)`, v: aprob, total: examenes.length },
      { t: `Entregar ${proyMin} proyectos con todos los criterios de la rúbrica en «Bien» o «Excelente»`, v: Math.min(proyOk, proyMin), total: proyMin },
      { t: 'Superar el examen final (todos los totales de control cuadrados)', v: fin && fin.aprobado ? 1 : 0, total: 1 },
    ];
  }
  function codigoCertificado(nombre, fecha) { let x = 2166136261; for (const c of nombre + '|' + fecha + '|' + (P.xp || 0)) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619) >>> 0; } return 'HH-' + fecha.slice(0, 4) + '-' + x.toString(16).toUpperCase().padStart(8, '0').replace(/(.{4})(.{4})/, '$1-$2'); }
  function dibujarCertificado(o) {
    const c = document.createElement('canvas'); const W = 1754, H = 1240; c.width = W; c.height = H; const x = c.getContext('2d');
    x.fillStyle = '#fbfaf7'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#1f2a44'; x.lineWidth = 6; x.strokeRect(50, 50, W - 100, H - 100); x.lineWidth = 1.5; x.strokeRect(70, 70, W - 140, H - 140);
    x.strokeStyle = 'rgba(31,79,209,.08)'; x.lineWidth = 1; for (let gx = 70; gx < W - 70; gx += 40) { x.beginPath(); x.moveTo(gx, 70); x.lineTo(gx, H - 70); x.stroke(); } for (let gy = 70; gy < H - 70; gy += 24) { x.beginPath(); x.moveTo(70, gy); x.lineTo(W - 70, gy); x.stroke(); }
    x.fillStyle = '#1f2a44'; x.textAlign = 'center';
    x.font = '700 30px Archivo, Arial'; x.fillText('HOJA A HOJA · PROGRAMA DE EXCEL PROFESIONAL', W / 2, 190);
    x.font = '800 74px Archivo, Arial'; x.fillText(o.titulo, W / 2, 310);
    x.font = '400 30px Inter, Arial'; x.fillStyle = '#4a5263'; x.fillText('Se certifica que', W / 2, 410);
    x.font = '800 92px Archivo, Arial'; x.fillStyle = '#1f4fd1'; x.fillText(o.nombre, W / 2, 520);
    x.fillStyle = '#1f2a44'; x.font = '400 30px Inter, Arial';
    const lineas = o.texto; lineas.forEach((t, i) => x.fillText(t, W / 2, 610 + i * 46));
    x.textAlign = 'left'; x.font = '600 24px Inter, Arial'; x.fillStyle = '#4a5263';
    (o.competencias || []).slice(0, 8).forEach((t, i) => { const col = i % 2, fila = Math.floor(i / 2); x.fillText('✓ ' + t, 260 + col * 640, 790 + fila * 40); });
    x.textAlign = 'center'; x.fillStyle = '#1f2a44'; x.font = '600 26px Inter, Arial';
    x.fillText(`Fecha: ${o.fecha.split('-').reverse().join('/')}   ·   Código: ${o.codigo}`, W / 2, H - 170);
    x.font = '400 20px Inter, Arial'; x.fillStyle = '#6b7385'; x.fillText('Evaluado con ejercicios corregidos automáticamente, exámenes de nivel, proyectos con rúbrica y examen final práctico.', W / 2, H - 125);
    return c;
  }
  async function descargarCertificado(o) {
    const nombre = P.nombre || ''; if (!nombre) { toast('Escribe tu nombre en «Mi progreso» para el certificado.'); location.hash = '#perfil'; return; }
    let datos;
    if (o.tipo === 'nivel') {
      const n = niveles[o.nivel]; const e = P.examenes[n.id];
      datos = { titulo: `Certificado del Nivel ${o.nivel}`, nombre, texto: [`ha superado el nivel «${n.nombre}»`, `con una nota de ${Math.round(e.nota * 100)} % en el examen del nivel.`], competencias: (n.puede_hacer_sola || []).slice(0, 8), fecha: e.fecha, codigo: codigoCertificado(nombre, e.fecha + n.id) };
    } else {
      const fecha = (P.certificado && P.certificado.fecha) || hoy();
      datos = { titulo: 'Certificado de Excel profesional', nombre, texto: ['ha completado el programa completo de Excel en español, del nivel 0 a la autonomía,', `con ${LECCIONES.length} lecciones, ${niveles.length} exámenes de nivel, proyectos de empresa evaluados con rúbrica y examen final práctico.`], competencias: niveles.map((n) => n.nombre), fecha, codigo: codigoCertificado(nombre, fecha) };
    }
    const c = dibujarCertificado(datos);
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    if (CAP.downloads) { try { await CAP.downloads.save({ filename: `${datos.titulo} - ${nombre}.png`, data: blob }); toast('Certificado descargado'); } catch (e) { /* rechazado */ } }
    else { const v = h('div', { class: 'pila' }, h('p', { class: 'tenue' }, 'La descarga no está disponible aquí: mantén pulsada la imagen para guardarla.'), h('img', { class: 'cert-previa', src: c.toDataURL('image/png'), alt: datos.titulo })); vista().prepend(v); }
  }
  function vistaCertificado() {
    titulo('Certificado');
    const req = requisitos(); const listo = req.every((r) => r.v >= r.total);
    if (listo && !(P.certificado && P.certificado.fecha)) { P.certificado = { fecha: hoy() }; ganarXP(300); comprobarLogros(); guardar(); confeti(); sonidoFin(); }
    const nombre = h('input', { class: 'entrada-corta', type: 'text', placeholder: 'Tu nombre completo', value: P.nombre || '', 'aria-label': 'Nombre para el certificado' });
    nombre.addEventListener('change', () => { P.nombre = nombre.value.trim(); guardar(); });
    let previa = null;
    if (listo && P.nombre) { const c = dibujarCertificado({ titulo: 'Certificado de Excel profesional', nombre: P.nombre, texto: ['ha completado el programa completo de Excel en español, del nivel 0 a la autonomía,', `con ${LECCIONES.length} lecciones, exámenes de nivel, proyectos evaluados con rúbrica y examen final.`], competencias: niveles.map((n) => n.nombre), fecha: P.certificado.fecha, codigo: codigoCertificado(P.nombre, P.certificado.fecha) }); previa = h('img', { class: 'cert-previa', src: c.toDataURL('image/png'), alt: 'Vista previa del certificado' }); }
    vista().replaceChildren(h('div', { class: 'pila-g lectura' },
      h('div', { class: 'pila' }, h('div', { class: 'sobretitulo' }, 'Certificado final'), h('h1', null, listo ? '¡Lo has conseguido!' : 'Tu camino al certificado'), h('p', { class: 'entradilla' }, 'El certificado no se regala: acredita que has demostrado cada nivel en un examen, que has resuelto encargos reales de principio a fin y que has superado una prueba práctica como las de una empresa.')),
      h('section', { class: 'pila' }, req.map((r) => h('div', { class: 'req' }, h('span', { class: r.v >= r.total ? 'ok' : 'pend' }, r.v >= r.total ? '✓' : '○'), h('span', null, r.t), h('b', { class: 'mono' }, `${r.v}/${r.total}`)))),
      h('section', { class: 'pila' }, h('label', { class: 'pila', style: { gap: '.3rem' } }, h('span', null, 'Nombre que aparecerá en el certificado'), nombre), listo ? h('div', { class: 'fila' }, h('button', { class: 'boton primario gigante', type: 'button', onclick: () => { P.nombre = nombre.value.trim(); guardar(); descargarCertificado({ tipo: 'final' }); } }, 'Descargar mi certificado')) : h('p', { class: 'tenue' }, 'Cuando completes los tres requisitos, aquí podrás descargarlo.'), previa)));
  }

  /* ================= pantalla de Excel simulada ================= */
  const ZONAS = {
    titulo: ['Barra de título', 'Muestra el nombre del libro (archivo) que tienes abierto. «Libro1» es el nombre provisional hasta que lo guardas.'],
    guardar: ['Guardar', 'Guarda el libro. Atajo: [[Ctrl]]+[[G]]. Si el libro está en OneDrive, el Autoguardado lo hace solo.'],
    buscar: ['Buscar', 'Escribe lo que quieres hacer («formato condicional», «inmovilizar») y Excel te lleva al botón.'],
    archivo: ['Pestaña Archivo', 'Abrir, guardar como, imprimir, exportar a PDF y opciones de Excel.'],
    pestanas_cinta: ['Pestañas de la cinta', 'Inicio, Insertar, Disposición de página, Fórmulas, Datos, Revisar, Vista… Cada pestaña agrupa botones de un tipo.'],
    cinta: ['Cinta de opciones', 'Los botones de la pestaña elegida, ordenados en grupos (Portapapeles, Fuente, Alineación…).'],
    cuadro_nombres: ['Cuadro de nombres', 'Dice qué celda tienes seleccionada (A1). También sirve para ir a una celda: escribe C25 y pulsa Intro.'],
    insertar_funcion: ['Insertar función (fx)', 'Abre un asistente que te ayuda a elegir una función y rellenar sus argumentos.'],
    barra_formulas: ['Barra de fórmulas', 'Muestra lo que hay DE VERDAD dentro de la celda: si es una fórmula, verás la fórmula, no el resultado. Aquí también se escribe.'],
    seleccionar_todo: ['Seleccionar todo', 'La esquina de arriba a la izquierda: selecciona toda la hoja.'],
    encabezado_columna: ['Encabezados de columna', 'Las letras (A, B, C…). Cada columna es vertical. Haz clic en una letra para seleccionar la columna entera.'],
    encabezado_fila: ['Encabezados de fila', 'Los números (1, 2, 3…). Cada fila es horizontal.'],
    celda_activa: ['Celda activa', 'La celda seleccionada, con el borde grueso. Su «dirección» es la letra de su columna y el número de su fila: B3.'],
    controlador_relleno: ['Controlador de relleno', 'El cuadradito de la esquina de la celda activa. Arrástralo para copiar una fórmula o continuar una serie (enero, febrero…).'],
    pestanas_hoja: ['Pestañas de hoja', 'Un libro tiene varias hojas, como las páginas de un cuaderno. Haz clic para cambiar de hoja; doble clic para cambiarle el nombre.'],
    nueva_hoja: ['Nueva hoja (+)', 'Añade una hoja nueva al libro.'],
    barra_estado: ['Barra de estado', 'Si seleccionas varias celdas con números, aquí ves su suma, promedio y recuento sin escribir ninguna fórmula.'],
    zoom: ['Zoom', 'Acerca o aleja la vista. No cambia nada del archivo.'],
  };
  function crearPantallaExcel(cfg) {
    const z = (id, cls, ...cont) => { const b = h('button', { type: 'button', class: 'zona ' + (cls || ''), 'data-zona': id, 'aria-label': ZONAS[id][0] }, ...cont); if (cfg.marcar === id) b.classList.add('marcada'); return b; };
    const letras = ['A', 'B', 'C', 'D', 'E', 'F'];
    const rejilla = h('div', { class: 'xs-rejilla' }, z('seleccionar_todo', 'cab', '◢'), letras.map((l) => z('encabezado_columna', 'cab', l)));
    for (let f = 1; f <= 5; f++) { rejilla.append(z('encabezado_fila', 'cab', String(f))); letras.forEach((l, k) => { if (f === 2 && k === 1) rejilla.append(z('celda_activa', 'act', h('span', { class: 'relleno' }))); else rejilla.append(h('div', null, f === 1 && k === 0 ? 'Ventas' : '')); }); }
    // controlador de relleno como zona propia sobre la celda activa
    const act = rejilla.querySelector('.act'); const rell = act.querySelector('.relleno'); rell.remove(); const zr = z('controlador_relleno', 'relleno'); zr.style.position = 'absolute'; act.append(zr);
    const el = h('div', { class: 'excel-sim', role: 'group', 'aria-label': 'Ventana de Excel simulada' },
      h('div', { class: 'xs-titulo' }, z('guardar', '', '💾'), z('titulo', '', 'Libro1 - Excel'), z('buscar', 'buscar', '🔍 Buscar')),
      h('div', { class: 'xs-pestanas' }, z('archivo', '', 'Archivo'), z('pestanas_cinta', 'act', 'Inicio'), ['Insertar', 'Disposición de página', 'Fórmulas', 'Datos', 'Revisar', 'Vista'].map((t) => z('pestanas_cinta', '', t))),
      z('cinta', 'xs-cinta', ['Portapapeles', 'Fuente', 'Alineación', 'Número', 'Estilos', 'Celdas', 'Edición'].map((g) => h('div', { class: 'xs-grupo' }, h('div', null, h('i'), h('i', { style: { width: '70%' } })), h('span', null, g)))),
      h('div', { class: 'xs-formulas' }, z('cuadro_nombres', '', 'B2'), z('insertar_funcion', '', 'fx'), z('barra_formulas', '', '=SUMA(B3:B5)')),
      rejilla,
      h('div', { class: 'xs-hojas' }, z('pestanas_hoja', 'hoja1', 'Hoja1'), z('pestanas_hoja', '', 'Hoja2'), z('nueva_hoja', '', '+')),
      h('div', { class: 'xs-estado' }, z('barra_estado', '', 'Listo · Suma: 0'), z('zoom', '', '— + 100 %')));
    el.querySelectorAll('.zona').forEach((b) => b.addEventListener('click', () => cfg.alTocar && cfg.alTocar(b.dataset.zona, b, el)));
    return el;
  }
  function bloquePantalla(b) {
    const info = h('div', { class: 'respuesta info info-zona', 'aria-live': 'polite' }, b.resaltar && ZONAS[b.resaltar] ? h('div', null, h('b', null, ZONAS[b.resaltar][0] + '. '), h('span', { html: enLinea(ZONAS[b.resaltar][1]) })) : 'Toca cualquier parte de la ventana para saber qué es.');
    const el = crearPantallaExcel({ marcar: b.resaltar, alTocar: (id, btnZona, cont) => { cont.querySelectorAll('.marcada').forEach((x) => x.classList.remove('marcada')); cont.querySelectorAll(`[data-zona="${id}"]`).forEach((x) => x.classList.add('marcada')); info.replaceChildren(h('b', null, ZONAS[id][0] + '. '), h('span', { html: enLinea(ZONAS[id][1]) })); } });
    return h('div', { class: 'pila', style: { gap: '.6rem' } }, b.md ? md(b.md) : null, el, info);
  }
  function ejSenala(ej) {
    const cont = h('section', { class: 'ejercicio', id: 'ej-' + ej.id });
    cont.append(cabeceraEj('Señala en la pantalla', ej.id), md(ej.pregunta));
    const zona = h('div', { 'aria-live': 'polite' }); let fallos = 0; let cerrado = false;
    const el = crearPantallaExcel({ alTocar: (id, b, pant) => {
      if (cerrado) return;
      const ok = id === ej.zona;
      registrarEj(ej.id, ok);
      pant.querySelectorAll('.incorrecta').forEach((x) => x.classList.remove('incorrecta'));
      if (ok) { cerrado = true; pant.querySelectorAll(`[data-zona="${id}"]`).forEach((x) => x.classList.add('correcta')); cont.classList.add('hecho'); zona.replaceChildren(respuesta('bien', '¡Eso es!', `**${ZONAS[id][0]}**: ${ZONAS[id][1]}`)); }
      else { fallos++; b.classList.add('incorrecta'); zona.replaceChildren(respuesta('mal', `Eso es: ${ZONAS[id][0]}`, fallos >= 2 ? 'Te lo marco en verde: ' + ZONAS[ej.zona][0] + '.' : 'Prueba otra vez.')); if (fallos >= 2) { cerrado = true; pant.querySelectorAll(`[data-zona="${ej.zona}"]`).forEach((x) => x.classList.add('correcta')); } }
    } });
    cont.append(el, zona);
    return cont;
  }

/* Hoja a hoja · aplicación de la guía (sin dependencias salvo HyperFormula para la hoja de práctica). */
(function () {
  'use strict';
  const D = window.DATOS;
  const M = window.MotorExcel;
  let HF = null; // HyperFormula listo
  const $ = (s, r = document) => r.querySelector(s);

  /* ================= utilidades ================= */
  function h(tag, attrs, ...hijos) {
    const el = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'style' && typeof v === 'object') { for (const [sk, sv] of Object.entries(v)) { if (sk.startsWith('--')) el.style.setProperty(sk, sv); else el.style[sk] = sv; } }
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of hijos.flat(Infinity)) { if (c === null || c === undefined || c === false) continue; el.append(c instanceof Node ? c : document.createTextNode(String(c))); }
    return el;
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function enLinea(t) {
    let s = esc(t);
    const codigos = [];
    s = s.replace(/`([^`]+)`/g, (_, c) => { codigos.push(c); return `\u0000${codigos.length - 1}\u0000`; });
    s = s.replace(/\[\[([^\]]+)\]\]/g, (_, k) => k.split('+').map((x) => `<kbd>${x.trim()}</kbd>`).join('+'));
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codigos[+i]}</code>`);
    return s;
  }
  function md(texto) {
    if (!texto) return h('div', { class: 'md' });
    const lineas = String(texto).replace(/\r/g, '').split('\n');
    let html = ''; let i = 0;
    while (i < lineas.length) {
      const l = lineas[i];
      if (!l.trim()) { i++; continue; }
      if (/^\s*[-*] /.test(l)) { let li = ''; while (i < lineas.length && /^\s*[-*] /.test(lineas[i])) { li += `<li>${enLinea(lineas[i].replace(/^\s*[-*] /, ''))}</li>`; i++; } html += `<ul>${li}</ul>`; continue; }
      if (/^\s*\d+[.)] /.test(l)) { let li = ''; while (i < lineas.length && /^\s*\d+[.)] /.test(lineas[i])) { li += `<li>${enLinea(lineas[i].replace(/^\s*\d+[.)] /, ''))}</li>`; i++; } html += `<ol>${li}</ol>`; continue; }
      if (/^\|/.test(l)) { const filas = []; while (i < lineas.length && /^\|/.test(lineas[i])) { filas.push(lineas[i]); i++; }
        const celdas = (f) => f.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
        const cab = celdas(filas[0]); const cuerpo = filas.slice(filas[1] && /^\|[\s:-|]+\|?$/.test(filas[1]) ? 2 : 1);
        html += `<div class="tabla-env"><table><thead><tr>${cab.map((c) => `<th>${enLinea(c)}</th>`).join('')}</tr></thead><tbody>${cuerpo.map((f) => `<tr>${celdas(f).map((c) => `<td>${enLinea(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; continue; }
      if (/^#{2,4} /.test(l)) { html += `<h4>${enLinea(l.replace(/^#+ /, ''))}</h4>`; i++; continue; }
      if (/^> /.test(l)) { let q = ''; while (i < lineas.length && /^> /.test(lineas[i])) { q += enLinea(lineas[i].slice(2)) + '<br>'; i++; } html += `<blockquote>${q}</blockquote>`; continue; }
      let p = ''; while (i < lineas.length && lineas[i].trim() && !/^\s*([-*]|\d+[.)]) /.test(lineas[i]) && !/^\||^#{2,4} |^> /.test(lineas[i])) { p += (p ? '<br>' : '') + enLinea(lineas[i]); i++; }
      html += `<p>${p}</p>`;
    }
    return h('div', { class: 'md', html });
  }
  function toast(t) { const el = h('div', { class: 'toast', role: 'status' }, t); document.body.append(el); setTimeout(() => el.remove(), 2600); }
  const hoy = () => new Date().toISOString().slice(0, 10);
  const sumarDias = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

  /* ================= índices del contenido ================= */
  const niveles = D.curso.niveles;
  const MOD = D.modulos; // id -> módulo
  const LECCIONES = []; // orden lineal
  const LEC = {};
  for (const n of niveles) for (const m of n.modulos) {
    const mod = MOD[m.id]; if (!mod) continue;
    for (const l of mod.lecciones) { const x = { ...l, nivel: n.id, modulo: m.id }; LECCIONES.push(x); LEC[l.id] = x; }
  }
  const ejerciciosDe = (lec) => [...lec.bloques.filter((b) => b.tipo === 'ejercicio'), ...(lec.recuerda || [])];
  const EJ_INDEX = {};
  for (const m of Object.values(MOD)) { for (const e of m.repaso_inicial || []) EJ_INDEX[e.id] = e; for (const l of m.lecciones) for (const e of ejerciciosDe(l)) EJ_INDEX[e.id] = e; if (m.practica_excel) EJ_INDEX[m.id + '-excel'] = { modo: 'excel', ...m.practica_excel }; }

  /* ================= progreso ================= */
  const CLAVE = 'hoja-a-hoja-progreso-v1';
  const progresoVacio = () => ({ v: 1, actualizado: 0, lecciones: {}, ej: {}, tarjetas: {}, proyectos: {}, checklist: {}, prueba: null, examen: null, ultima: null, tema: null, xp: 0, dias: {}, meta: 50, estrellas: {}, logros: {}, examenes: {}, nombre: '', sonido: true, mejorRacha: 0, repasos: 0, examenFinal: null, certificado: null, cofres: {} });
  let P = progresoVacio();
  try { const g = JSON.parse(localStorage.getItem(CLAVE) || 'null'); if (g && g.v === 1) P = Object.assign(P, g); } catch (e) { /* sin almacenamiento */ }
  let dbDoc = null; let temporizador = null;
  // Dónde queda guardado el progreso: 'comprobando' mientras el visor responde, 'cuenta' cuando una escritura
  // en la cuenta ha funcionado de verdad, 'navegador' cuando solo queda en este navegador (sin permiso de escritura o fuera de claude.ai).
  let guardadoEn = 'comprobando';
  let escribiendo = false; let otraVez = false;
  function copiaParaCuenta() { // el documento de la cuenta admite 256 KiB: se recortan los textos largos si hiciera falta
    const c = JSON.parse(JSON.stringify(P));
    if (JSON.stringify(c).length > 230000) for (const e of Object.values(c.ej || {})) delete e.texto;
    return c;
  }
  function cambiarGuardado(estado) {
    if (guardadoEn === estado) return;
    guardadoEn = estado;
    if (/^(#inicio|#mapa|#perfil|)$/.test(location.hash)) router(); // solo repinta pantallas sin ejercicio a medias
  }
  async function subir(reintento) {
    if (!dbDoc) return;
    if (escribiendo) { otraVez = true; return; }
    escribiendo = true;
    try {
      await dbDoc.set(copiaParaCuenta());
      cambiarGuardado('cuenta');
    } catch (e) {
      const c = e && e.code;
      if ((c === 'unavailable' || c === 'resource_exhausted') && !reintento) { escribiendo = false; setTimeout(() => subir(true), 2000 + Math.random() * 2000); return; }
      if (c !== 'unavailable' && c !== 'resource_exhausted') { dbDoc = null; cambiarGuardado('navegador'); }
    }
    escribiendo = false;
    if (otraVez && dbDoc) { otraVez = false; subir(); }
  }
  function guardar() {
    P.actualizado = Date.now();
    try { localStorage.setItem(CLAVE, JSON.stringify(P)); } catch (e) { /* */ }
    if (dbDoc) { clearTimeout(temporizador); temporizador = setTimeout(() => subir(), 1500); }
    pintarInsignias();
  }
  // Si cierra la pestaña antes de que salte el temporizador, se sube en ese momento.
  document.addEventListener('visibilitychange', () => { if (document.hidden && dbDoc && temporizador) { clearTimeout(temporizador); temporizador = null; subir(); } });
  async function guardarCopia() {
    if (!CAP.downloads) { toast('Aquí no se puede descargar. Abre la guía desde claude.ai.'); return false; }
    const hoy = new Date(); const f = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    try {
      await CAP.downloads.save({ filename: `progreso-hoja-a-hoja-${f}.json`, data: JSON.stringify(P) });
      P.copia = Date.now(); guardar(); toast('Copia guardada. Si cambias de ordenador, cárgala en «Mi progreso».');
      return true;
    } catch (e) { if (e && e.code === 'declined') toast('No se ha guardado la copia.'); else toast('No se ha podido descargar la copia.'); return false; }
  }
  function fechaCorta(t) { const d = new Date(t); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; }
  function avisoGuardado() { // solo cuando el progreso NO llega a la cuenta
    if (guardadoEn !== 'navegador') return null;
    const reciente = P.copia && Date.now() - P.copia < 7 * 864e5;
    const boton = h('button', { class: 'boton peq', type: 'button', onclick: async () => { if (await guardarCopia()) router(); } }, 'Guardar una copia ahora');
    if (reciente) return h('p', { class: 'tenue guardado-linea' }, `Tu progreso está en este navegador · última copia: ${fechaCorta(P.copia)} · `, h('a', { href: '#perfil' }, 'más'));
    return h('div', { class: 'aviso cuidado guardado-aviso', role: 'note' },
      h('div', { class: 't' }, h('span', { class: 'etq' }, 'Importante'), 'Tu progreso solo está guardado en este navegador'),
      h('p', null, 'Si borras el historial o cambias de ordenador, lo pierdes. Para que se guarde en tu cuenta, pide a quien te pasó la guía que te invite por correo con permiso para editar.'),
      h('p', null, P.copia ? `Mientras tanto, guarda una copia cada semana. La última es del ${fechaCorta(P.copia)}.` : 'Mientras tanto, guarda una copia cada semana: es un archivo pequeño que puedes volver a cargar.'),
      h('div', { class: 'fila' }, boton, h('a', { class: 'boton fantasma peq', href: '#perfil' }, 'Cargar una copia')));
  }
  function fusionar(a, b) { // une dos progresos quedándose con lo más avanzado
    // «Empezar de cero» deja la marca «reinicio»: lo guardado antes de esa fecha (otro navegador, la cuenta) ya no vuelve.
    if ((a.reinicio || 0) > (b.actualizado || 0)) return JSON.parse(JSON.stringify(a));
    if ((b.reinicio || 0) > (a.actualizado || 0)) return JSON.parse(JSON.stringify(b));
    const r = JSON.parse(JSON.stringify(a.actualizado >= b.actualizado ? a : b));
    const otro = a.actualizado >= b.actualizado ? b : a;
    for (const [k, v] of Object.entries(otro.lecciones || {})) if (!r.lecciones[k] || (r.lecciones[k].estado !== 'hecha' && v.estado === 'hecha')) r.lecciones[k] = v;
    for (const [k, v] of Object.entries(otro.ej || {})) if (!r.ej[k] || (!r.ej[k].ok && v.ok)) r.ej[k] = v;
    for (const [k, v] of Object.entries(otro.tarjetas || {})) if (!r.tarjetas[k]) r.tarjetas[k] = v;
    r.xp = Math.max(a.xp || 0, b.xp || 0); r.dias = { ...(otro.dias || {}), ...(r.dias || {}) };
    for (const k of ['estrellas', 'logros', 'examenes', 'proyectos', 'cofres']) r[k] = { ...(otro[k] || {}), ...(r[k] || {}) };
    return r;
  }
  function estadoLeccion(id) { return (P.lecciones[id] || {}).estado || 'pendiente'; }
  function marcarLeccion(id, estado) { const prev = estadoLeccion(id); if (prev === 'hecha' && estado !== 'hecha') return; P.lecciones[id] = { estado, t: Date.now() }; guardar(); }
  function registrarEj(id, ok, extra) {
    if (modoSesion) { if (escuchaEj) escuchaEj(id, ok, { vista: !!(extra && extra.vista) }); return; }
    const e = P.ej[id] || { ok: false, n: 0 }; const yaOk = e.ok;
    e.n++;
    if (ok && !yaOk) { e.ok = true; e.primera = e.n === 1 && !e.pistas && !e.vista; }
    Object.assign(e, extra || {}); P.ej[id] = e;
    let xp = 0;
    if (ok && !yaOk && !modoExamen && !/^(ex-|prueba-)/.test(id)) { xp = e.primera ? 10 : 5; ganarXP(xp); }
    if (!modoExamen) comprobarLogros();
    guardar();
    if (escuchaEj) escuchaEj(id, ok, { xp, vista: !!(extra && extra.vista) });
  }
  function anotarPista(id) { if (modoSesion) { sesionPista = true; return; } const e = P.ej[id] || { ok: false, n: 0 }; e.pistas = (e.pistas || 0) + 1; P.ej[id] = e; guardar(); }
  function progresoNivel(n) {
    const ids = []; for (const m of n.modulos) for (const l of (MOD[m.id]?.lecciones || [])) ids.push(l.id);
    const hechas = ids.filter((i) => ['hecha', 'saltada'].includes(estadoLeccion(i))).length;
    return { total: ids.length, hechas, pct: ids.length ? hechas / ids.length : 0 };
  }

  /* ================= capacidades del visor ================= */
  const CAP = { sample: null, downloads: null, db: null, user: null, imagenes: false };
  async function iniciarCapacidades() {
    if (!window.claude || typeof window.claude.use !== 'function') { cambiarGuardado('navegador'); return; }
    const [sample, downloads, db, user] = await Promise.all(['sample', 'downloads', 'db', 'user'].map((n) => window.claude.use(n).catch(() => null)));
    CAP.sample = sample; CAP.downloads = downloads; CAP.db = db; CAP.user = user;
    if (sample) { try { const l = await sample.limits(); CAP.imagenes = !!(l && l.images); CAP.limites = l; } catch (e) { /* */ } }
    document.body.classList.toggle('con-tutora', !!sample);
    $('#btn-tutora').hidden = !sample;
    if (db && user) {
      try {
        const id = await user.id();
        if (id) {
          dbDoc = db.doc('data/users/' + id + '/progreso');
          const snap = await Promise.race([dbDoc.get(), new Promise((_, r) => setTimeout(() => r(new Error('tiempo')), 10000))]);
          if (snap && snap.exists) { const remoto = snap.data(); if (remoto && remoto.v === 1) { P = fusionar(P, remoto); try { localStorage.setItem(CLAVE, JSON.stringify(P)); } catch (e) { /* */ } } }
          // Se escribe ya: sube lo que hubiera solo en este navegador y comprueba de verdad que la cuenta acepta escrituras.
          await Promise.race([subir(), new Promise((r) => setTimeout(r, 10000))]);
        }
      } catch (e) { dbDoc = null; }
    }
    if (!dbDoc) guardadoEn = 'navegador';
    router();
  }
  async function descargar(archivo, nombre) {
    try {
      const r = await fetch('libros/' + archivo + '.b64.txt');
      if (!r.ok) throw new Error('no encontrado');
      const b64 = (await r.text()).trim(); const bin = atob(b64); const bytes = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
      const tipos = { xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', zip: 'application/zip', csv: 'text/csv', txt: 'text/plain' };
      const blob = new Blob([bytes], { type: tipos[archivo.split('.').pop()] || 'application/octet-stream' });
      if (CAP.downloads) { await CAP.downloads.save({ filename: nombre || archivo, data: blob }); toast('Descargado: ' + (nombre || archivo)); return; }
      const url = URL.createObjectURL(blob); window.open(url, '_blank');
    } catch (e) {
      if (e && e.code === 'declined') return;
      toast('No se ha podido descargar ahora. Prueba a abrir la guía en claude.ai.');
    }
  }
  function botonDescarga(archivo, texto) {
    if (!archivo) return null;
    const info = (D.libros || {})[archivo] || {};
    return h('button', { class: 'boton', type: 'button', onclick: () => descargar(archivo) }, '⬇ ', texto || ('Descargar ' + archivo), info.tamano ? h('span', { class: 'tenue' }, ' · ' + info.tamano) : null);
  }

  /* ================= hoja interactiva ================= */
  const REF = D.referencia || {};
  const FUNCS = (REF.funciones || []).filter((f) => f.es);
  const FUNC_ES = new Map(FUNCS.map((f) => [f.es.toUpperCase(), f]));
  function mapaFormatos(hoja) {
    const m = {}; for (const [r, f] of Object.entries(hoja.formatos || {})) for (const c of M.celdasDeRango(r)) m[c] = f; return m;
  }
  function dimensiones(hoja, extras) {
    let maxC = 0, maxR = 0;
    const refs = [...Object.keys(hoja.celdas || {}), ...(extras || []).flatMap((r) => { try { return M.celdasDeRango(r); } catch (e) { return []; } })];
    for (const r of refs) { const d = M.dir(r); maxC = Math.max(maxC, d.col); maxR = Math.max(maxR, d.row); }
    return { cols: Math.max(hoja.columnas || 0, maxC + 2), filas: Math.max(hoja.filas || 0, maxR + 2) };
  }
  function claseValor(v) { if (v && typeof v === 'object' && v.error) return 'err'; if (typeof v === 'number') return 'num'; if (typeof v === 'boolean') return 'log'; return 'txt'; }

  /* Ayuda de sintaxis: función abierta en la posición del cursor y número de argumento */
  function contextoFuncion(texto, pos) {
    const t = M.tokenizar(texto.slice(0, pos).replace(/^=/, ''));
    const pila = [];
    for (let i = 0; i < t.length; i++) {
      if (t[i].k === '(') { let j = i - 1; while (j >= 0 && t[j].k === 'sp') j--; pila.push({ n: j >= 0 && t[j].k === 'id' ? t[j].v.toUpperCase() : null, arg: 0 }); }
      else if (t[i].k === ')') pila.pop();
      else if (t[i].k === ';' && pila.length) pila[pila.length - 1].arg++;
    }
    for (let k = pila.length - 1; k >= 0; k--) if (pila[k].n) return pila[k];
    return null;
  }
  function sintaxisResaltada(f, arg) {
    const s = f.sintaxis_es || (f.es + '(…)');
    const m = s.match(/^([^(]+)\((.*)\)$/); if (!m) return esc(s);
    const partes = m[2].split(';').map((x) => x.trim());
    return `<b>${esc(m[1])}</b>(${partes.map((p, i) => (i === Math.min(arg, partes.length - 1) ? `<u><b>${esc(p)}</b></u>` : esc(p))).join('; ')})`;
  }
  function conectarAyudas(input, ayuda, contenedorAuto) {
    let lista = null; let activa = 0; let candidatos = [];
    const cerrar = () => { if (lista) { lista.remove(); lista = null; } };
    function palabraActual() {
      const pos = input.selectionStart; const antes = input.value.slice(0, pos);
      const m = antes.match(/(?:^=|[=(;+\-*/&<>^ ])([A-Za-zÁÉÍÓÚÑáéíóúñ][A-Za-zÁÉÍÓÚÑáéíóúñ0-9.]*)$/);
      return m ? { palabra: m[1], inicio: pos - m[1].length, fin: pos } : null;
    }
    function elegir(f) {
      const p = palabraActual(); if (!p) return;
      const antes = input.value.slice(0, p.inicio); const despues = input.value.slice(p.fin);
      input.value = antes + f.es + '(' + despues; const pos = (antes + f.es + '(').length; input.setSelectionRange(pos, pos); cerrar(); actualizar(); input.focus();
    }
    function actualizar() {
      if (!input.value.startsWith('=')) { ayuda.hidden = true; cerrar(); return; }
      const c = contextoFuncion(input.value, input.selectionStart);
      const f = c && FUNC_ES.get(c.n);
      if (f) { ayuda.innerHTML = sintaxisResaltada(f, c.arg); ayuda.hidden = false; } else ayuda.hidden = true;
      const p = palabraActual();
      if (!p || p.palabra.length < 2 || /^[A-Z]{1,3}\d/i.test(p.palabra)) { cerrar(); return; }
      const q = norm(p.palabra);
      candidatos = FUNCS.filter((x) => norm(x.es).startsWith(q)).slice(0, 8);
      if (!candidatos.length) { cerrar(); return; }
      cerrar(); activa = 0;
      lista = h('div', { class: 'autocompletar', role: 'listbox' }, candidatos.map((x, i) => h('button', { type: 'button', role: 'option', class: i === 0 ? 'activa' : '', onmousedown: (e) => { e.preventDefault(); elegir(x); } }, h('b', null, x.es), h('small', null, x.sintaxis_es || x.descripcion || ''))));
      contenedorAuto.append(lista);
    }
    input.addEventListener('input', actualizar);
    input.addEventListener('click', actualizar);
    input.addEventListener('keyup', (e) => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) actualizar(); });
    input.addEventListener('blur', () => setTimeout(cerrar, 150));
    input.addEventListener('keydown', (e) => {
      if (!lista) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); activa = (activa + (e.key === 'ArrowDown' ? 1 : -1) + candidatos.length) % candidatos.length; [...lista.children].forEach((b, i) => b.classList.toggle('activa', i === activa)); }
      else if (e.key === 'Tab') { e.preventDefault(); elegir(candidatos[activa]); }
      else if (e.key === 'Escape') cerrar();
    });
    return { cerrar };
  }

  /* Crea una hoja. modo: 'ver' | 'ejercicio' | 'libre' */
  function crearHoja(cfg) {
    const hoja = cfg.hoja || { celdas: {} };
    const formatos = mapaFormatos(hoja);
    const extras = [cfg.objetivo, ...(cfg.copiar_a || []).flatMap((r) => M.celdasDeRango(r)), ...(cfg.extras || [])].filter(Boolean);
    const dim = dimensiones(hoja, extras);
    const copias = new Set((cfg.copiar_a || []).flatMap((r) => M.celdasDeRango(r)));
    const resaltar = new Set((cfg.resaltar || []).flatMap((r) => M.celdasDeRango(r)));
    let contenidos = { ...(hoja.celdas || {}) }; // para modo libre
    let valores = {}; let sel = cfg.objetivo || 'A1'; let derrames = new Set(); let marcas = {};
    const nombre = h('div', { class: 'cuadro-nombre', 'aria-label': 'Celda seleccionada' }, sel);
    const input = h('input', { class: 'entrada-formula', type: 'text', spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off', 'aria-label': cfg.modo === 'ejercicio' ? `Escribe tu fórmula para la celda ${cfg.objetivo}` : 'Barra de fórmulas', placeholder: cfg.modo === 'ejercicio' ? `Escribe aquí tu fórmula para ${cfg.objetivo}, empieza por =` : '', readonly: cfg.modo === 'ver' ? true : null });
    const barra = h('div', { class: 'barra-formulas' }, nombre, h('div', { class: 'fx', 'aria-hidden': 'true' }, 'fx'), input);
    const ayuda = h('div', { class: 'ayuda-sintaxis', hidden: true, 'aria-live': 'polite' });
    if (cfg.modo !== 'ver') conectarAyudas(input, ayuda, barra);
    const tabla = h('table', { class: 'rejilla' });
    const env = h('div', { class: 'hoja-env' }, barra, ayuda, h('div', { class: 'rejilla-env' }, tabla), cfg.pie ? h('div', { class: 'pie-hoja' }, cfg.pie) : null);
    const ancho = (col) => { const L = M.numeroALetra(col); const a = (hoja.anchos || {})[L]; return a ? `${a}ch` : null; };

    function calcular(formulaUsuario) {
      if (!HF) { valores = {}; for (const [r, v] of Object.entries(contenidos)) valores[r] = typeof v === 'string' && v.startsWith('=') ? '' : (v && v.fecha ? v.fecha : v); return; }
      try {
        const ctx = M.construir(HF, { ...hoja, celdas: contenidos });
        derrames = new Set();
        if (formulaUsuario && cfg.objetivo) {
          try { M.escribir(ctx, cfg.objetivo, formulaUsuario); if (cfg.copiar_a) M.copiarA(ctx, cfg.objetivo, cfg.copiar_a); } catch (e) { /* fórmula no válida */ }
          for (const c of [cfg.objetivo, ...copias]) for (const x of M.rangoDerramado(ctx, c)) if (x !== c) derrames.add(x);
        }
        for (const [r, v] of Object.entries(contenidos)) if (typeof v === 'string' && v.startsWith('=')) for (const x of M.rangoDerramado(ctx, r)) if (x !== r) derrames.add(x);
        valores = M.valoresHoja(ctx, dim.cols + 3, dim.filas + 3);
      } catch (e) { valores = {}; }
    }
    function textoCelda(ref) {
      const v = valores[ref]; if (v === undefined) return '';
      if (cfg.mostrar_formulas && typeof contenidos[ref] === 'string' && contenidos[ref].startsWith('=')) return contenidos[ref];
      return M.formatear(v && v.error ? v.error : v, formatos[ref]);
    }
    function pintar() {
      tabla.innerHTML = '';
      const cab = h('tr', null, h('th', { scope: 'col', 'aria-label': 'Esquina' }, ''));
      for (let c = 0; c < dim.cols; c++) cab.append(h('th', { scope: 'col', style: ancho(c) ? { minWidth: ancho(c) } : null }, M.numeroALetra(c)));
      tabla.append(h('thead', null, cab));
      const cuerpo = h('tbody');
      for (let r = 0; r < dim.filas; r++) {
        const tr = h('tr', null, h('th', { scope: 'row' }, r + 1));
        for (let c = 0; c < dim.cols; c++) {
          const ref = M.numeroALetra(c) + (r + 1);
          const v = valores[ref];
          const clases = [claseValor(v)];
          if (r === 0 && typeof v === 'string' && hoja.cabecera !== false) clases.push('cab');
          if (ref === cfg.objetivo) clases.push('objetivo');
          if (copias.has(ref)) clases.push('copia');
          if (resaltar.has(ref)) clases.push('resaltada');
          if (derrames.has(ref)) clases.push('derrame');
          if (ref === sel) clases.push('sel');
          if (marcas[ref]) clases.push(marcas[ref]);
          if (cfg.modo === 'libre') clases.push('libre');
          const txt = textoCelda(ref);
          const td = h('td', { class: clases.join(' '), 'data-ref': ref, title: copias.has(ref) ? 'Aquí se copiará tu fórmula' : (String(txt).length > 14 ? String(txt) : null) }, txt);
          if (cfg.modo !== 'ejercicio' || ref === cfg.objetivo) td.addEventListener('click', () => seleccionar(ref));
          else td.addEventListener('click', () => { nombre.textContent = ref; const cont = contenidos[ref]; ayudaCelda(ref, cont); });
          tr.append(td);
        }
        cuerpo.append(tr);
      }
      tabla.append(cuerpo);
    }
    function ayudaCelda(ref, cont) {
      // en ejercicios, al tocar otra celda se muestra su contenido sin perder lo escrito
      if (cfg.modo === 'ejercicio') { env.dataset.vista = ref; input.title = cont !== undefined ? `${ref}: ${typeof cont === 'object' && cont.fecha ? cont.fecha : cont}` : ''; }
    }
    function seleccionar(ref) {
      sel = ref; nombre.textContent = ref;
      if (cfg.modo === 'libre') { const v = contenidos[ref]; input.value = v === undefined ? '' : (typeof v === 'object' && v.fecha ? v.fecha.split('-').reverse().join('/') : typeof v === 'number' ? String(v).replace('.', ',') : String(v)); input.focus(); }
      else if (cfg.modo === 'ver') { const v = contenidos[ref]; input.value = v === undefined ? '' : (typeof v === 'object' && v.fecha ? v.fecha.split('-').reverse().join('/') : typeof v === 'number' ? M.formatear(v) : String(v)); }
      pintar();
    }
    if (cfg.modo === 'libre') {
      input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const t = input.value.trim();
        if (t === '') delete contenidos[sel]; else contenidos[sel] = t.startsWith('=') ? t : M.interpretarNumeroES(t);
        calcular(); const d = M.dir(sel); const abajo = M.numeroALetra(d.col) + (d.row + 2);
        if (d.row + 2 <= dim.filas) seleccionar(abajo); else pintar();
        if (cfg.alCambiar) cfg.alCambiar(contenidos);
      });
    }
    calcular(); pintar();
    if (cfg.modo === 'ver') seleccionar(cfg.objetivo || [...resaltar][0] || 'A1');
    // en pantallas estrechas, que se vea la celda donde hay que escribir
    requestAnimationFrame(() => { const td = tabla.querySelector('td.objetivo') || tabla.querySelector('td.sel'); const env2 = tabla.parentElement; if (td && env2 && env2.scrollWidth > env2.clientWidth) { const x = td.offsetLeft + td.offsetWidth - env2.clientWidth + 24; if (x > 0) env2.scrollLeft = x; } });
    return {
      el: env, input,
      mostrarUsuario(f, marcasNuevas) { marcas = marcasNuevas || {}; calcular(f); pintar(); },
      reiniciar(celdasNuevas) { contenidos = { ...(celdasNuevas || hoja.celdas || {}) }; marcas = {}; calcular(); pintar(); },
      contenidos: () => contenidos,
    };
  }

  /* ================= ejercicios ================= */
  function cabeceraEj(etq, id) {
    const hecho = P.ej[id] && P.ej[id].ok;
    return h('div', { class: 'cab-ej' }, h('div', { class: 'etq-ej' }, etq, hecho ? h('span', { class: 'marca-ok', 'aria-label': 'Hecho' }, '✓ hecho') : null));
  }
  function respuesta(clase, titulo, cuerpo) {
    return h('div', { class: 'respuesta ' + clase, role: 'status' }, titulo ? h('div', { class: 'tit' }, titulo) : null, typeof cuerpo === 'string' ? md(cuerpo) : cuerpo);
  }
  function botonTutora(contexto) {
    if (!CAP.sample) return null;
    return h('button', { class: 'boton fantasma peq', type: 'button', onclick: () => abrirTutora(contexto) }, 'Preguntar a la tutora');
  }

  function ejFormula(ej, ctxLeccion) {
    const cont = h('section', { class: 'ejercicio', id: 'ej-' + ej.id });
    if (P.ej[ej.id]?.ok) cont.classList.add('hecho');
    cont.append(cabeceraEj('Practica en la hoja', ej.id), md(ej.enunciado));
    if (!HF) { cont.append(respuesta('info', 'La hoja de práctica se está cargando', 'Necesita conexión a internet la primera vez. Si no aparece, recarga la página.')); return cont; }
    const hoja = crearHoja({ modo: 'ejercicio', hoja: ej.hoja, objetivo: ej.objetivo, copiar_a: ej.copiar_a, resaltar: ej.resaltar, extras: ej.comparar });
    if (ej.inicial) hoja.input.value = ej.inicial;
    const zona = h('div', { class: 'pila', 'aria-live': 'polite' });
    const pistasEl = h('div', { class: 'pistas' });
    let pistasDadas = 0; let fallos = 0;
    const btnPista = h('button', { class: 'boton peq', type: 'button', onclick: darPista }, `Pista (${(ej.pistas || []).length})`);
    const btnSol = h('button', { class: 'boton fantasma peq', type: 'button', onclick: verSolucion, disabled: true }, 'Ver solución');
    if (!(ej.pistas || []).length || modoExamen) btnPista.hidden = true;
    if (modoExamen) btnSol.hidden = true;
    function darPista() {
      if (pistasDadas >= ej.pistas.length) return;
      pistasEl.append(h('div', { class: 'pista' }, h('b', null, `Pista ${pistasDadas + 1}. `), h('span', { html: enLinea(ej.pistas[pistasDadas]) })));
      pistasDadas++; anotarPista(ej.id); btnPista.textContent = pistasDadas < ej.pistas.length ? `Otra pista (${ej.pistas.length - pistasDadas})` : 'Sin más pistas';
      if (pistasDadas >= ej.pistas.length) { btnPista.disabled = true; btnSol.disabled = false; }
    }
    function verSolucion() {
      zona.innerHTML = '';
      zona.append(respuesta('info', 'Una solución', h('div', { class: 'pila' }, h('p', null, h('code', null, ej.solucion), ' ', h('button', { class: 'boton fantasma peq', type: 'button', onclick: () => { hoja.input.value = ej.solucion; comprobar(); } }, 'Probarla en la hoja')), ej.explicacion ? md(ej.explicacion) : null, (ej.alternativas || []).length ? h('p', { class: 'tenue' }, 'También valdría: ', ej.alternativas.map((a, i) => [i ? ' · ' : '', h('code', null, a)])) : null)));
      registrarEj(ej.id, false, { vista: true });
    }
    function comprobar() {
      const f = hoja.input.value;
      let r;
      try { r = M.comprobar(HF, ej, f); } catch (e) { r = { ok: false, mensajes: ['No he podido calcular esta fórmula. Revisa que esté bien escrita.'], valores: {} }; }
      const marcas = {}; for (const c of r.celdas || []) marcas[c] = r.ok ? 'bien-celda' : '';
      hoja.mostrarUsuario(f.startsWith('=') ? f : null, marcas);
      zona.innerHTML = '';
      registrarEj(ej.id, r.ok);
      if (r.ok) {
        cont.classList.add('hecho');
        zona.append(respuesta('bien', '¡Correcto!', h('div', { class: 'pila' }, ej.explicacion ? md(ej.explicacion) : null, (ej.alternativas || []).length ? h('p', { class: 'tenue' }, 'Otras formas válidas: ', ej.alternativas.map((a, i) => [i ? ' · ' : '', h('code', null, a)])) : null)));
        cont.querySelector('.etq-ej')?.replaceWith(cabeceraEj('Practica en la hoja', ej.id).firstChild);
      } else {
        fallos++;
        zona.append(respuesta('mal', 'Todavía no', h('div', { class: 'pila' }, r.mensajes.map((m) => h('p', null, m)))));
        if (fallos >= 2) btnSol.disabled = false;
        if (CAP.sample && fallos >= 1 && !modoExamen) zona.append(h('div', { class: 'fila' }, botonTutora({ tipo: 'ejercicio', ej, formula: f, mensajes: r.mensajes, leccion: ctxLeccion })));
      }
    }
    hoja.input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.defaultPrevented) { e.preventDefault(); comprobar(); } });
    cont.append(hoja.el, h('div', { class: 'fila' }, h('button', { class: 'boton primario', type: 'button', onclick: comprobar }, 'Comprobar'), btnPista, btnSol, h('span', { class: 'tenue' }, 'Intro también comprueba')), pistasEl, zona);
    return cont;
  }

  function ejPredice(ej) {
    const cont = h('section', { class: 'ejercicio', id: 'ej-' + ej.id });
    cont.append(cabeceraEj('Predice el resultado', ej.id), md(ej.enunciado || '¿Qué devolverá esta fórmula?'));
    const hojaCfg = { modo: 'ver', hoja: ej.hoja, resaltar: [ej.celda], extras: [ej.celda] };
    const hoja = crearHoja(hojaCfg);
    cont.append(hoja.el, h('p', null, 'En ', h('b', null, ej.celda), ' se escribe ', h('code', null, ej.formula)));
    const entrada = h('input', { class: 'entrada-corta mono', type: 'text', 'aria-label': 'Tu predicción', placeholder: 'Tu respuesta' });
    const zona = h('div', { 'aria-live': 'polite' });
    function ver() {
      const dado = entrada.value.trim(); if (!dado) { entrada.focus(); return; }
      const esperado = String(ej.respuesta ?? (HF ? M.mostrar(M.evaluar(HF, ej.hoja, ej.celda, ej.formula).valor, ej.formato_resultado || null) : ''));
      const a = M.interpretarNumeroES(dado); const b = M.interpretarNumeroES(esperado);
      const ok = typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b)) : norm(dado) === norm(esperado);
      registrarEj(ej.id, ok);
      if (HF) { const tmp = { ...ej.hoja, celdas: { ...ej.hoja.celdas, [ej.celda]: ej.formula } }; hoja.reiniciar(tmp.celdas); }
      zona.innerHTML = '';
      zona.append(respuesta(ok ? 'bien' : 'mal', ok ? '¡Exacto!' : `Excel devuelve ${esperado}`, ej.explicacion || ''));
      if (ok) cont.classList.add('hecho');
    }
    entrada.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); ver(); } });
    cont.append(h('div', { class: 'fila' }, entrada, h('button', { class: 'boton primario', type: 'button', onclick: ver }, 'Ver qué pasa')), zona);
    return cont;
  }

  function ejTest(ej) {
    const cont = h('section', { class: 'ejercicio', id: 'ej-' + ej.id });
    cont.append(cabeceraEj(ej.multiple ? 'Elige todas las correctas' : 'Elige una', ej.id), md(ej.pregunta));
    const zona = h('div', { 'aria-live': 'polite' });
    const elegidas = new Set();
    const botones = ej.opciones.map((o, i) => {
      const b = h('button', { class: 'opcion', type: 'button', 'aria-pressed': 'false' }, h('span', { class: 'letra' }, String.fromCharCode(97 + i) + ')'), h('span', { html: enLinea(o.texto) }));
      b.addEventListener('click', () => {
        if (cont.dataset.cerrado) return;
        if (ej.multiple) { if (elegidas.has(i)) elegidas.delete(i); else elegidas.add(i); b.setAttribute('aria-pressed', elegidas.has(i)); return; }
        elegidas.clear(); elegidas.add(i); corregir();
      });
      return b;
    });
    function corregir() {
      cont.dataset.cerrado = '1';
      const ok = ej.opciones.every((o, i) => !!o.correcta === elegidas.has(i));
      ej.opciones.forEach((o, i) => {
        const b = botones[i];
        if (elegidas.has(i) || o.correcta) { b.classList.add(o.correcta ? 'correcta' : 'incorrecta'); if (o.porque) b.append(h('span', { class: 'porque', html: enLinea(o.porque) })); }
        b.setAttribute('aria-pressed', elegidas.has(i));
      });
      registrarEj(ej.id, ok);
      zona.innerHTML = ''; zona.append(respuesta(ok ? 'bien' : 'mal', ok ? '¡Correcto!' : 'No del todo: mira la explicación de cada opción.', ej.explicacion || ''));
      if (ok) cont.classList.add('hecho');
      if (!modoExamen && !escuchaEj) zona.append(h('button', { class: 'boton fantasma peq', type: 'button', onclick: () => { cont.replaceWith(ejTest(ej)); } }, 'Volver a intentarlo'));
    }
    cont.append(h('div', { class: 'opciones' }, botones));
    if (ej.multiple) cont.append(h('div', null, h('button', { class: 'boton primario', type: 'button', onclick: () => elegidas.size && corregir() }, 'Comprobar')));
    cont.append(zona);
    return cont;
  }

  function barajar(arr, semilla) { const a = arr.slice(); let s = 0; for (const c of semilla) s = (s * 31 + c.charCodeAt(0)) >>> 0; for (let i = a.length - 1; i > 0; i--) { s = (s * 1103515245 + 12345) >>> 0; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } if (a.every((x, i) => x === arr[i]) && a.length > 1) [a[0], a[1]] = [a[1], a[0]]; return a; }

  function ejOrdenar(ej) {
    const cont = h('section', { class: 'ejercicio', id: 'ej-' + ej.id });
    cont.append(cabeceraEj('Ordena los pasos', ej.id), md(ej.enunciado));
    let orden = barajar(ej.pasos.map((p, i) => i), ej.id);
    const lista = h('ol', { class: 'lista-ordenar' });
    const zona = h('div', { 'aria-live': 'polite' });
    function pintar(marcar) {
      lista.innerHTML = '';
      orden.forEach((idx, pos) => {
        const li = h('li', { class: marcar ? (idx === pos ? 'bien-celda' : 'mal-celda') : '' }, h('span', { class: 'num' }, pos + 1), h('span', { html: enLinea(ej.pasos[idx]) }), h('span', { class: 'flechas' },
          h('button', { type: 'button', 'aria-label': 'Subir', disabled: pos === 0, onclick: () => { [orden[pos - 1], orden[pos]] = [orden[pos], orden[pos - 1]]; pintar(); } }, '↑'),
          h('button', { type: 'button', 'aria-label': 'Bajar', disabled: pos === orden.length - 1, onclick: () => { [orden[pos + 1], orden[pos]] = [orden[pos], orden[pos + 1]]; pintar(); } }, '↓')));
        lista.append(li);
      });
    }
    pintar();
    cont.append(lista, h('div', null, h('button', { class: 'boton primario', type: 'button', onclick: () => {
      const ok = orden.every((idx, pos) => idx === pos); registrarEj(ej.id, ok); pintar(true);
      zona.innerHTML = ''; zona.append(respuesta(ok ? 'bien' : 'mal', ok ? '¡Orden correcto!' : 'Hay pasos fuera de sitio (en rojo). Muévelos y vuelve a comprobar.', ok ? (ej.explicacion || '') : ''));
      if (ok) cont.classList.add('hecho');
    } }, 'Comprobar orden')), zona);
    return cont;
  }

  function crearCinta(alElegir, marcarRuta) {
    const modelo = D.cinta || [];
    let pestana = modelo.find((t) => t.pestana === 'Inicio') || modelo[0];
    const tabs = h('div', { class: 'cinta-pestanas', role: 'tablist' });
    const grupos = h('div', { class: 'cinta-grupos' });
    const el = h('div', { class: 'cinta' }, tabs, grupos);
    function pintar(sol) {
      tabs.innerHTML = ''; grupos.innerHTML = '';
      for (const t of modelo) tabs.append(h('button', { type: 'button', role: 'tab', 'aria-selected': t === pestana ? 'true' : 'false', title: t.contextual ? 'Pestaña que solo aparece al seleccionar una tabla, tabla dinámica o gráfico' : null, style: t.contextual ? { fontStyle: 'italic' } : null, onclick: () => { pestana = t; pintar(sol); } }, t.pestana));
      for (const g of pestana.grupos || []) {
        grupos.append(h('div', { class: 'cinta-grupo' }, h('div', { class: 'cmds' }, g.comandos.map((c) => {
          const b = h('button', { type: 'button' }, c);
          if (sol && sol.ruta[0] === pestana.pestana && sol.ruta[1] === g.grupo && sol.ruta[2] === c) b.classList.add('correcta');
          if (sol && sol.elegida && sol.elegida.join('|') === [pestana.pestana, g.grupo, c].join('|') && !b.classList.contains('correcta')) b.classList.add('incorrecta');
          b.addEventListener('click', () => alElegir && alElegir([pestana.pestana, g.grupo, c], (s) => pintar(s)));
          return b;
        })), h('div', { class: 'nombre-grupo' }, g.grupo)));
      }
    }
    pintar(marcarRuta ? { ruta: marcarRuta } : null);
    if (marcarRuta) { pestana = modelo.find((t) => t.pestana === marcarRuta[0]) || pestana; pintar({ ruta: marcarRuta }); }
    return el;
  }
  function rutaCinta(ruta) { return h('span', { class: 'ruta-cinta' }, ruta.map((r, i) => [i ? h('i', { 'aria-hidden': 'true' }, '›') : null, h('span', null, r)])); }

  function ejCinta(ej) {
    const cont = h('section', { class: 'ejercicio', id: 'ej-' + ej.id });
    cont.append(cabeceraEj('Encuéntralo en la cinta', ej.id), md(ej.enunciado));
    const zona = h('div', { 'aria-live': 'polite' });
    let intentos = 0;
    const cinta = crearCinta((elegida, repintar) => {
      const ok = elegida.slice(0, ej.ruta.length).join('|') === ej.ruta.join('|');
      intentos++; registrarEj(ej.id, ok);
      zona.innerHTML = '';
      if (ok) { repintar({ ruta: ej.ruta }); cont.classList.add('hecho'); zona.append(respuesta('bien', '¡Ahí está!', h('div', { class: 'pila' }, rutaCinta(ej.ruta), ej.explicacion ? md(ej.explicacion) : null))); }
      else { repintar({ ruta: intentos >= 2 ? ej.ruta : [], elegida }); zona.append(respuesta('mal', 'Ese no es', intentos >= 2 ? h('div', { class: 'pila' }, h('p', null, 'Está en: '), rutaCinta(ej.ruta)) : 'Pista: mira la pestaña ' + ej.ruta[0] + '.')); }
    });
    cont.append(cinta, zona);
    return cont;
  }

  function ejCorta(ej) {
    const cont = h('section', { class: 'ejercicio', id: 'ej-' + ej.id });
    cont.append(cabeceraEj('Responde', ej.id), md(ej.pregunta));
    const entrada = h('input', { class: 'entrada-corta', type: 'text', 'aria-label': 'Tu respuesta' });
    const zona = h('div', { 'aria-live': 'polite' });
    const limpiar = (s) => norm(s).replace(/control/g, 'ctrl').replace(/mayusculas|mayus|shift/g, 'mayus').replace(/\s*\+\s*/g, '+').replace(/\s+/g, '+');
    function ver() {
      if (!entrada.value.trim()) return;
      const ok = ej.aceptadas.some((a) => limpiar(a) === limpiar(entrada.value));
      registrarEj(ej.id, ok); zona.innerHTML = '';
      zona.append(respuesta(ok ? 'bien' : 'mal', ok ? '¡Correcto!' : `La respuesta es: ${ej.aceptadas[0]}`, ej.explicacion || ''));
      if (ok) cont.classList.add('hecho');
    }
    entrada.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); ver(); } });
    cont.append(h('div', { class: 'fila' }, entrada, h('button', { class: 'boton primario', type: 'button', onclick: ver }, 'Comprobar')), zona);
    return cont;
  }

  function ejAbierta(ej, ctxLeccion) {
    const cont = h('section', { class: 'ejercicio', id: 'ej-' + ej.id });
    cont.append(cabeceraEj('Piensa y escribe', ej.id), md(ej.pregunta));
    const clave = 'ab-' + ej.id;
    const area = h('textarea', { class: 'entrada-corta', 'aria-label': 'Tu respuesta', id: 'txt-' + ej.id }, (P.ej[ej.id] && P.ej[ej.id].texto) || '');
    const zona = h('div', { class: 'pila', 'aria-live': 'polite' });
    area.addEventListener('change', () => { const e = P.ej[ej.id] || { ok: false, n: 0 }; e.texto = area.value; P.ej[ej.id] = e; guardar(); });
    const btnModelo = h('button', { class: 'boton', type: 'button', onclick: () => {
      if (!area.value.trim()) { area.focus(); toast('Escribe primero tu respuesta: así se aprende de verdad.'); return; }
      registrarEj(ej.id, true, { texto: area.value });
      zona.innerHTML = ''; cont.classList.add('hecho');
      zona.append(respuesta('info', 'Compárala con una respuesta modelo', h('div', { class: 'pila' }, md(ej.modelo), (ej.criterios || []).length ? h('div', null, h('p', { class: 'tit' }, 'Revisa si la tuya:'), h('ul', { class: 'lista-sola' }, ej.criterios.map((c) => h('li', null, c)))) : null)));
    } }, 'Ver respuesta modelo');
    const btnIA = CAP.sample ? h('button', { class: 'boton primario', type: 'button', onclick: async () => {
      if (!area.value.trim()) { area.focus(); return; }
      const salida = h('div', { class: 'respuesta info' }, h('div', { class: 'tit' }, 'La tutora está leyendo tu respuesta…'));
      zona.innerHTML = ''; zona.append(salida);
      const prompt = `${INSTRUCCIONES_TUTORA}\n\nTAREA: evalúa la respuesta de la alumna a este ejercicio abierto. Sé concreta y amable, en español de España, máximo 180 palabras. Estructura: 1) Qué está bien (1-2 frases). 2) Qué falta o mejorar, criterio por criterio (lista breve). 3) Una versión mejorada de UNA frase o idea, no toda la respuesta. No pongas nota numérica.\n\nLección: ${ctxLeccion ? ctxLeccion.titulo : ''}\nPregunta: ${ej.pregunta}\nCriterios: ${(ej.criterios || []).join(' | ')}\nRespuesta modelo (no la copies entera): ${ej.modelo}\n\nRESPUESTA DE LA ALUMNA:\n${area.value}`;
      try {
        await CAP.sample(prompt, { onText: ({ text }) => { salida.innerHTML = ''; salida.append(h('div', { class: 'tit' }, 'Comentario de la tutora'), md(text)); } });
        registrarEj(ej.id, true, { texto: area.value }); cont.classList.add('hecho');
      } catch (e) { salida.innerHTML = ''; salida.append(md(textoErrorTutora(e))); }
    } }, 'Que la tutora me lo revise') : null;
    cont.append(area, h('div', { class: 'fila' }, btnIA, btnModelo), zona);
    return cont;
  }

  function ejExcel(ej) {
    const cont = h('section', { class: 'ejercicio', id: 'ej-' + ej.id });
    cont.append(cabeceraEj('En tu Excel', ej.id), md(ej.enunciado));
    if (ej.archivo) cont.append(h('div', { class: 'fila' }, botonDescarga(ej.archivo), h('span', { class: 'tenue' }, 'Ábrelo en Excel y vuelve aquí con los resultados.')));
    const zona = h('div', { class: 'pila', 'aria-live': 'polite' });
    const entradas = (ej.controles || []).map((c, i) => {
      const inp = h('input', { class: 'entrada-corta mono', type: 'text', inputmode: 'decimal', 'aria-label': c.pregunta, id: `ctl-${ej.id}-${i}` });
      return { c, inp, fila: h('label', { class: 'pila', style: { gap: '.3rem' } }, h('span', null, c.pregunta), inp) };
    });
    if (entradas.length) {
      cont.append(h('div', { class: 'pila' }, h('p', { class: 'tenue' }, 'Totales de control: escribe lo que te sale para comprobar tu trabajo.'), entradas.map((e) => e.fila)));
      cont.append(h('div', null, h('button', { class: 'boton primario', type: 'button', onclick: () => {
        zona.innerHTML = ''; let todos = true;
        for (const { c, inp } of entradas) {
          const v = M.interpretarNumeroES(inp.value.trim()); const esperado = typeof c.respuesta === 'number' ? c.respuesta : M.interpretarNumeroES(String(c.respuesta));
          const ok = typeof esperado === 'number' ? (typeof v === 'number' && Math.abs(v - esperado) <= (c.tolerancia ?? 0.005) + 1e-9) : norm(v) === norm(esperado);
          inp.classList.toggle('bien-celda', ok); inp.style.borderColor = ok ? 'var(--bien)' : 'var(--mal)';
          if (!ok) { todos = false; zona.append(respuesta('mal', c.pregunta, c.pista || 'Revisa este cálculo.')); }
        }
        registrarEj(ej.id, todos);
        if (todos) { cont.classList.add('hecho'); zona.prepend(respuesta('bien', '¡Todo cuadra!', ej.explicacion || 'Tus totales coinciden con los de la solución.')); }
      } }, 'Comprobar mis totales')));
    }
    if (ej.solucion_md) cont.append(h('details', { class: 'plegable' }, h('summary', null, 'Ver cómo se resuelve'), h('div', null, md(ej.solucion_md), ej.archivo_solucion ? botonDescarga(ej.archivo_solucion, 'Descargar la solución') : null, ej.archivo_solucion ? h('p', { class: 'tenue' }, 'Si al abrir la solución ves ceros, pulsa «Habilitar edición» en la barra amarilla: Excel calculará las fórmulas.') : null)));
    cont.append(zona);
    return cont;
  }

  function renderEjercicio(ej, ctx) {
    switch (ej.modo) {
      case 'formula': return ejFormula(ej, ctx);
      case 'predice': return ejPredice(ej);
      case 'test': return ejTest(ej);
      case 'ordenar': return ejOrdenar(ej);
      case 'cinta': return ejCinta(ej);
      case 'respuesta_corta': return ejCorta(ej);
      case 'abierta': return ejAbierta(ej, ctx);
      case 'excel': return ejExcel(ej);
      case 'senala': return ejSenala(ej);
      default: return h('div', null, '');
    }
  }

  /* ================= bloques ================= */
  function renderBloque(b, ctx) {
    switch (b.tipo) {
      case 'texto': return md(b.md);
      case 'aviso': {
        const etq = { atajo: 'Atajo', cuidado: 'Cuidado', empresa: 'En la empresa', truco: 'Truco', dato: 'Dato' }[b.estilo] || 'Nota';
        return h('aside', { class: 'aviso ' + (b.estilo || '') }, h('div', { class: 't' }, h('span', { class: 'etq' }, etq), b.titulo || ''), md(b.md));
      }
      case 'hoja': return h('figure', { class: 'pila', style: { margin: 0, gap: '.5rem' } }, b.titulo ? h('figcaption', { class: 'bloque-titulo' }, b.titulo) : null, crearHoja({ modo: 'ver', hoja: b.hoja, resaltar: b.resaltar, objetivo: (b.resaltar || []).length ? M.celdasDeRango(b.resaltar[0])[0] : null, mostrar_formulas: false, pie: b.pie }).el,
        b.mostrar_formulas ? formulasDeHoja(b.hoja, b.resaltar) : null);
      case 'pasos': return h('div', { class: 'pila' }, b.titulo ? h('div', { class: 'bloque-titulo' }, b.titulo) : null, h('ol', { class: 'pasos-resueltos' }, b.pasos.map((p) => h('li', null, h('div', { class: 'pila', style: { gap: '.5rem' } }, md(p.md), p.hoja ? crearHoja({ modo: 'ver', hoja: p.hoja, resaltar: p.resaltar }).el : null, p.ruta ? rutaCinta(p.ruta) : null)))));
      case 'tabla': return h('div', { class: 'pila', style: { gap: '.4rem' } }, b.titulo ? h('div', { class: 'bloque-titulo' }, b.titulo) : null, h('div', { class: 'tabla-env' }, h('table', { class: 'tabla-datos' }, h('thead', null, h('tr', null, (b.cabecera || []).map((c) => h('th', null, c)))), h('tbody', null, (b.filas || []).map((f) => h('tr', null, f.map((c) => h('td', { html: enLinea(String(c)) })))))) ), b.pie ? h('p', { class: 'tenue' }, b.pie) : null);
      case 'cinta': return h('div', { class: 'pila', style: { gap: '.5rem' } }, b.md ? md(b.md) : null, rutaCinta(b.ruta), D.cinta ? crearCinta(null, b.ruta) : null);
      case 'atajos': return h('div', { class: 'tabla-env' }, h('table', { class: 'tabla-datos' }, h('tbody', null, (b.atajos || []).map((a) => h('tr', null, h('td', { class: 'mono', html: enLinea(a.teclas.split(' o ').map((t) => `[[${t}]]`).join(' o ')) }), h('td', null, a.accion))))));
      case 'comparar': return h('div', { class: 'tabla-env' }, h('table', { class: 'tabla-datos' }, h('thead', null, h('tr', null, h('th', null, b.izq || 'Así no'), h('th', null, b.der || 'Así sí'))), h('tbody', null, (b.filas || []).map((f) => h('tr', null, h('td', { html: enLinea(f[0]) }), h('td', { html: enLinea(f[1]) }))))));
      case 'ejercicio': return renderEjercicio(b, ctx);
      case 'pantalla': return bloquePantalla(b);
      case 'mensaje': return burbujaMensaje(b.de, b.puesto, b.md);
      default: return null;
    }
  }
  function burbujaMensaje(de, puesto, texto) {
    const ini = String(de || '?').split(/\s+/).map((x) => x[0]).slice(0, 2).join('').toUpperCase();
    return h('div', { class: 'mensaje' }, h('div', { class: 'avatar', 'aria-hidden': 'true' }, ini), h('div', { class: 'globo' }, h('div', { class: 'quien' }, h('b', null, de || ''), puesto ? h('span', null, ' · ' + puesto) : null), md(texto)));
  }
  function formulasDeHoja(hoja, resaltar) {
    const fs = Object.entries(hoja.celdas || {}).filter(([, v]) => typeof v === 'string' && v.startsWith('='));
    if (!fs.length) return null;
    const res = new Set((resaltar || []).flatMap((r) => M.celdasDeRango(r)));
    const lista = fs.filter(([r]) => !res.size || res.has(r));
    return h('p', { class: 'tenue' }, 'Fórmulas: ', (lista.length ? lista : fs).map(([r, f], i) => [i ? ' · ' : '', h('b', null, r), ' ', h('code', null, f)]));
  }

  /* ================= vistas ================= */
  const vista = () => $('#vista');
  function titulo(t) { document.title = t ? `${t} · Hoja a hoja` : 'Hoja a hoja'; }
  function siguientePendiente() { return LECCIONES.find((l) => !['hecha', 'saltada'].includes(estadoLeccion(l.id))) || null; }

  function mapaNiveles() {
    const sig = siguientePendiente();
    return h('div', { class: 'niveles' }, niveles.map((n, i) => {
      const p = progresoNivel(n);
      return h('a', { class: 'nivel-tarjeta' + (sig && sig.nivel === n.id ? ' actual' : ''), href: '#nivel-' + n.id },
        h('span', { class: 'tab' }, 'Nivel ' + i),
        h('h3', null, n.nombre), h('p', null, n.lema || ''),
        h('div', { class: 'barra-prog' + (p.pct === 1 ? ' bien' : '') }, h('i', { style: { width: Math.round(p.pct * 100) + '%' } })),
        h('span', { class: 'tenue' }, `${p.hechas} de ${p.total} lecciones · ${n.horas ? n.horas + ' h' : ''}`));
    }));
  }
  function vistaRuta() {
    titulo('La ruta');
    vista().replaceChildren(h('div', { class: 'pila-g' }, h('div', { class: 'pila lectura' }, h('div', { class: 'sobretitulo' }, 'La ruta completa'), h('h1', null, 'Del nivel 0 a la autonomía'), h('p', { class: 'entradilla' }, 'Cada nivel termina con algo que ya puedes hacer sola en el trabajo. Puedes saltarte lo que ya sepas con la prueba de nivel.')), mapaNiveles(),
      ...niveles.map((n, i) => h('section', { class: 'pila' }, h('h2', null, h('span', { class: 'mono tenue' }, `Nivel ${i} · `), n.nombre), listaModulos(n)))));
  }
  function listaModulos(n) {
    return h('div', { class: 'pila' }, n.modulos.map((m) => {
      const mod = MOD[m.id]; if (!mod) return null;
      return h('div', { class: 'modulo' }, h('div', { class: 'entre' }, h('h3', null, mod.titulo), h('span', { class: 'tenue' }, `${mod.lecciones.length} lecciones`)),
        h('ul', { class: 'lista-lecciones' }, mod.lecciones.map((l) => { const e = estadoLeccion(l.id); return h('li', null, h('a', { href: '#jugar-' + l.id }, h('span', { class: 'estado ' + e, 'aria-label': { hecha: 'Hecha', empezada: 'Empezada', saltada: 'Saltada', pendiente: 'Pendiente' }[e] }, e === 'hecha' ? '✓' : ''), h('span', null, l.titulo), h('span', { class: 'tenue mono' }, `${l.minutos || 12} min`))); })));
    }));
  }
  function vistaNivel(id) {
    const i = niveles.findIndex((n) => n.id === id); const n = niveles[i]; if (!n) return vistaMapa();
    titulo(n.nombre);
    const p = progresoNivel(n);
    const libros = Object.entries(D.libros || {}).filter(([, v]) => v.nivel === n.id);
    vista().replaceChildren(h('div', { class: 'pila-g' },
      h('div', { class: 'pila lectura' }, h('div', { class: 'migas' }, h('a', { href: '#ruta' }, 'La ruta'), '›', `Nivel ${i}`),
        h('h1', null, n.nombre), h('p', { class: 'entradilla' }, n.lema || ''),
        h('div', { class: 'barra-prog' + (p.pct === 1 ? ' bien' : '') }, h('i', { style: { width: Math.round(p.pct * 100) + '%' } })),
        h('p', { class: 'tenue' }, `${p.hechas} de ${p.total} lecciones · unas ${n.horas || '?'} horas`),
        (n.puede_hacer_sola || []).length ? h('aside', { class: 'aviso empresa' }, h('div', { class: 't' }, h('span', { class: 'etq' }, 'Al terminar'), 'Esto ya lo podrás hacer sola'), h('ul', { class: 'lista-sola' }, n.puede_hacer_sola.map((x) => h('li', null, x)))) : null,
        libros.length ? h('div', { class: 'pila' }, h('h3', null, 'Libros de práctica de este nivel'), libros.map(([a, v]) => h('div', { class: 'fila' }, botonDescarga(a, v.titulo || a), h('span', { class: 'tenue' }, v.descripcion || '')))) : null),
      listaModulos(n),
      h('div', { class: 'siguiente' }, i > 0 ? h('a', { class: 'boton', href: '#nivel-' + niveles[i - 1].id }, '← ' + niveles[i - 1].nombre) : h('span'), niveles[i + 1] ? h('a', { class: 'boton', href: '#nivel-' + niveles[i + 1].id }, niveles[i + 1].nombre + ' →') : h('a', { class: 'boton primario', href: '#proyectos' }, 'Proyectos →'))));
  }

  let leccionActual = null;
  function vistaLeccion(id) {
    const l = LEC[id]; if (!l) return vistaMapa();
    leccionActual = l; titulo(l.titulo);
    if (estadoLeccion(id) === 'pendiente') marcarLeccion(id, 'empezada');
    P.ultima = '#leccion-' + id; guardar();
    const idx = LECCIONES.indexOf(l); const ant = LECCIONES[idx - 1]; const sig = LECCIONES[idx + 1];
    const mod = MOD[l.modulo]; const nIdx = niveles.findIndex((n) => n.id === l.nivel);
    const esPrimera = mod.lecciones[0].id === l.id;
    const ctx = { titulo: l.titulo, objetivo: l.objetivo, nivel: niveles[nIdx].nombre, texto: l.bloques.filter((b) => b.tipo === 'texto').map((b) => b.md).join('\n').slice(0, 3000) };
    const cuerpo = h('article', { class: 'pila-g', style: { minWidth: 0 } },
      h('header', { class: 'pila' }, h('div', { class: 'migas' }, h('a', { href: '#nivel-' + l.nivel }, `Nivel ${nIdx} · ${niveles[nIdx].nombre}`), '›', mod.titulo),
        h('h1', null, l.titulo),
        h('div', { class: 'fila' }, h('span', { class: 'chip' }, `${l.minutos || 12} min`), (l.funciones || []).map((f) => h('span', { class: 'chip fn' }, f))),
        l.objetivo ? h('p', { class: 'entradilla' }, l.objetivo) : null),
      esPrimera && (mod.repaso_inicial || []).length ? h('details', { class: 'plegable', open: true }, h('summary', null, 'Calentamiento: repaso de lo anterior'), h('div', null, h('p', { class: 'tenue' }, 'Recordar antes de aprender algo nuevo ayuda a que todo se conecte.'), mod.repaso_inicial.map((e) => renderEjercicio(e, ctx)))) : null,
      esPrimera && mod.intro ? md(mod.intro) : null,
      ...l.bloques.map((b) => renderBloque(b, ctx)),
      (l.recuerda || []).length ? h('section', { class: 'recuerda' }, h('h2', null, 'Recuerda sin mirar'), h('p', { class: 'tenue' }, 'Contesta de memoria: el esfuerzo de recordar es lo que fija lo aprendido.'), l.recuerda.map((e) => renderEjercicio(e, ctx))) : null,
      mod.practica_excel && mod.lecciones[mod.lecciones.length - 1].id === l.id ? h('section', { class: 'pila' }, h('h2', null, 'Práctica en Excel'), renderEjercicio({ id: mod.id + '-excel', modo: 'excel', ...mod.practica_excel }, ctx)) : null,
      h('div', { class: 'siguiente' },
        ant ? h('a', { class: 'boton', href: '#leccion-' + ant.id }, '← Anterior') : h('span'),
        h('a', { class: 'boton', href: '#jugar-' + id }, 'Hacerla en modo juego'),
        h('button', { class: 'boton primario', type: 'button', onclick: () => { completarLeccion(l, null); toast('Lección terminada'); location.hash = '#inicio'; } }, 'Marcar como terminada')));
    const indice = h('nav', { class: 'indice', 'aria-label': 'En esta lección' }, h('div', { class: 'sobretitulo' }, 'En esta lección'),
      l.bloques.filter((b) => b.tipo === 'ejercicio').map((b, i) => h('a', { href: '#leccion-' + id, onclick: (e) => { e.preventDefault(); document.getElementById('ej-' + b.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, `Ejercicio ${i + 1}`)));
    const lado = h('aside', null, indice, CAP.sample ? h('button', { class: 'boton', type: 'button', onclick: () => abrirTutora({ tipo: 'leccion', leccion: ctx }) }, 'Preguntar a la tutora') : null, h('a', { class: 'boton fantasma', href: '#consulta' }, 'Consulta rápida'));
    vista().replaceChildren(h('div', { class: 'leccion' }, cuerpo, lado));
    window.scrollTo(0, 0);
  }

  /* ================= repaso espaciado ================= */
  const INTERVALOS = [0, 1, 3, 7, 16, 35];
  function todasTarjetas() {
    const out = [];
    for (const l of LECCIONES) (l.tarjetas || []).forEach((t, i) => out.push({ id: `${l.id}-t${i}`, leccion: l.id, ...t }));
    return out;
  }
  function desbloquearTarjetas(l) { (l.tarjetas || []).forEach((t, i) => { const id = `${l.id}-t${i}`; if (!P.tarjetas[id]) P.tarjetas[id] = { caja: 1, prox: hoy() }; }); guardar(); }
  function tarjetasPendientes() { const T = todasTarjetas(); return T.filter((t) => P.tarjetas[t.id] && P.tarjetas[t.id].prox <= hoy()); }
  function vistaRepaso() {
    titulo('Repaso');
    const pend = tarjetasPendientes(); const T = todasTarjetas();
    const activas = T.filter((t) => P.tarjetas[t.id]);
    const cajas = [1, 2, 3, 4, 5].map((c) => activas.filter((t) => P.tarjetas[t.id].caja === c).length);
    const zona = h('div', { class: 'pila' });
    let i = 0;
    function pintar() {
      zona.innerHTML = '';
      if (i >= pend.length) { zona.append(h('div', { class: 'tarjeta-repaso' }, h('div', { class: 'frente' }, pend.length ? 'Repaso de hoy terminado' : 'Nada que repasar hoy'), h('p', { class: 'tenue' }, activas.length ? 'Las tarjetas vuelven en 1, 3, 7, 16 y 35 días según lo bien que las sepas.' : 'Las tarjetas aparecen cuando terminas lecciones.'))); return; }
      const t = pend[i];
      const dorso = h('div', { class: 'dorso', hidden: true, html: enLinea(t.dorso) });
      const botones = h('div', { class: 'fila', style: { justifyContent: 'center' }, hidden: true },
        [['No la sabía', 0], ['Dudé', 1], ['La sabía', 2]].map(([txt, q]) => h('button', { class: 'boton' + (q === 2 ? ' primario' : ''), type: 'button', onclick: () => {
          P.repasos = (P.repasos || 0) + 1; P.repasoHoy = hoy(); if (q === 2) ganarXP(2); else if (q === 1) ganarXP(1);
          const e = P.tarjetas[t.id]; e.caja = q === 0 ? 1 : q === 1 ? Math.max(1, e.caja) : Math.min(5, e.caja + 1); e.prox = sumarDias(q === 0 ? 0 : INTERVALOS[e.caja]); if (q === 0) pend.push(t); guardar(); i++; pintar();
        } }, txt)));
      const mostrar = h('button', { class: 'boton primario', type: 'button', onclick: () => { dorso.hidden = false; botones.hidden = false; mostrar.hidden = true; } }, 'Mostrar respuesta');
      zona.append(h('p', { class: 'tenue' }, `Tarjeta ${i + 1} de ${pend.length} · ${t.tipo || 'concepto'}`), h('div', { class: 'tarjeta-repaso' }, h('div', { class: 'frente', html: enLinea(t.frente) }), dorso, h('div', { class: 'fila', style: { justifyContent: 'center' } }, mostrar), botones));
    }
    pintar();
    vista().replaceChildren(h('div', { class: 'pila-g lectura' }, h('div', { class: 'pila' }, h('div', { class: 'sobretitulo' }, 'Repaso espaciado'), h('h1', null, 'Repaso de hoy'), h('p', { class: 'entradilla' }, 'Intenta recordar antes de dar la vuelta a la tarjeta. Sé sincera: si dudas, vuelve antes.')),
      h('div', { class: 'cajas' }, cajas.map((n, k) => h('div', { class: 'caja' }, h('b', null, n), `Caja ${k + 1}`))), zona));
  }

  /* ================= hoja libre ================= */
  function vistaHojaLibre() {
    titulo('Hoja libre');
    const base = D.hoja_libre || { celdas: { A1: 'Fecha', B1: 'Comercial', C1: 'Zona', D1: 'Importe', A2: { fecha: '2026-10-01' }, B2: 'Lucía', C2: 'Norte', D2: 1250, A3: { fecha: '2026-10-03' }, B3: 'Marcos', C3: 'Sur', D3: 830, A4: { fecha: '2026-10-07' }, B4: 'Lucía', C4: 'Sur', D4: 2100, A5: { fecha: '2026-10-12' }, B5: 'Ana', C5: 'Norte', D5: 640, A6: { fecha: '2026-10-15' }, B6: 'Marcos', C6: 'Norte', D6: 1475 }, formatos: { 'A2:A20': 'fecha', 'D2:D20': 'eur' }, anchos: { A: 12, B: 11, D: 12 }, columnas: 8, filas: 14 };
    let guardada = null; try { guardada = JSON.parse(localStorage.getItem('hoja-libre') || 'null'); } catch (e) { /* */ }
    const hoja = HF ? crearHoja({ modo: 'libre', hoja: { ...base, celdas: guardada || base.celdas }, alCambiar: (c) => { try { localStorage.setItem('hoja-libre', JSON.stringify(c)); } catch (e) { /* */ } } }) : null;
    vista().replaceChildren(h('div', { class: 'pila-g' }, h('div', { class: 'pila lectura' }, h('div', { class: 'sobretitulo' }, 'Experimenta sin miedo'), h('h1', null, 'Hoja libre'),
      h('p', { class: 'entradilla' }, 'Haz clic en una celda, escribe en la barra y pulsa Intro. Prueba cualquier función: al escribir te sugiere nombres y te recuerda los argumentos.'),
      h('p', { class: 'tenue' }, 'Los datos de partida son de ejemplo. Aquí no se pueden hacer tablas dinámicas, gráficos ni formato condicional: para eso, los libros de práctica en tu Excel.')),
      hoja ? hoja.el : h('p', { class: 'cargando' }, 'Cargando la hoja…'),
      h('div', { class: 'fila' }, h('button', { class: 'boton', type: 'button', onclick: () => { try { localStorage.removeItem('hoja-libre'); } catch (e) { /* */ } hoja && hoja.reiniciar(base.celdas); } }, 'Volver a los datos de ejemplo'), h('a', { class: 'boton fantasma', href: '#consulta-funciones' }, 'Ver todas las funciones'))));
  }

  /* ================= consulta ================= */
  function vistaConsulta(pestana) {
    titulo('Consulta');
    const pestanas = [['funciones', 'Funciones ES ↔ EN'], ['errores', 'Errores'], ['atajos', 'Atajos'], ['cinta', 'La cinta'], ['glosario', 'Glosario'], ['entrega', 'Antes de entregar']];
    const actual = pestanas.find((p) => p[0] === pestana) ? pestana : 'funciones';
    const cont = h('div', { class: 'pila' });
    const sub = h('div', { class: 'subnav', role: 'tablist' }, pestanas.map(([k, t]) => h('button', { type: 'button', role: 'tab', 'aria-selected': k === actual ? 'true' : 'false', onclick: () => { location.hash = '#consulta-' + k; } }, t)));
    if (actual === 'funciones') {
      const q = h('input', { class: 'buscador', type: 'search', placeholder: 'Busca en español o en inglés: buscarx, vlookup, fecha…', 'aria-label': 'Buscar función' });
      const tbody = h('tbody');
      const cats = [...new Set(FUNCS.map((f) => f.categoria).filter(Boolean))].sort();
      const selCat = h('select', { class: 'entrada-corta', 'aria-label': 'Categoría', style: { maxWidth: '16rem' } }, h('option', { value: '' }, 'Todas las categorías'), cats.map((c) => h('option', { value: c }, c)));
      const filtrar = () => {
        const t = norm(q.value); const c = selCat.value; tbody.innerHTML = '';
        const lista = FUNCS.filter((f) => (!c || f.categoria === c) && (!t || norm(f.es).includes(t) || norm(f.en).includes(t) || norm(f.descripcion || '').includes(t))).slice(0, 300);
        for (const f of lista) tbody.append(h('tr', { class: 'fn-fila' }, h('td', null, f.es), h('td', { class: 'mono' }, f.en), h('td', null, h('div', { class: 'mono', style: { fontSize: '.8rem' } }, f.sintaxis_es || ''), f.descripcion ? h('div', { class: 'tenue' }, f.descripcion) : null), h('td', { class: 'tenue' }, f.disponible || '')));
        if (!lista.length) tbody.append(h('tr', null, h('td', { colspan: 4 }, 'Sin resultados. Prueba con otra palabra.')));
      };
      q.addEventListener('input', filtrar); selCat.addEventListener('change', filtrar); filtrar();
      cont.append(h('div', { class: 'fila' }, q, selCat), h('p', { class: 'tenue' }, `${FUNCS.length} funciones. En español los argumentos van separados por punto y coma (;).`), h('div', { class: 'tabla-env' }, h('table', { class: 'tabla-datos' }, h('thead', null, h('tr', null, h('th', null, 'Español'), h('th', null, 'Inglés'), h('th', null, 'Sintaxis'), h('th', null, 'Versiones'))), tbody)));
    } else if (actual === 'errores') {
      cont.append(h('div', { class: 'tabla-env' }, h('table', { class: 'tabla-datos' }, h('thead', null, h('tr', null, h('th', null, 'Error'), h('th', null, 'En inglés'), h('th', null, 'Qué significa y cómo se arregla'))), h('tbody', null, (REF.errores || []).map((e) => h('tr', null, h('td', { class: 'mono' }, h('b', null, e.es)), h('td', { class: 'mono tenue' }, e.en), h('td', null, e.significa)))))));
    } else if (actual === 'atajos') {
      let so = 'win';
      const tabla = h('div');
      const pintarA = () => { const lista = so === 'win' ? (REF.atajos_windows || []) : (REF.atajos_mac || []); tabla.replaceChildren(h('div', { class: 'tabla-env' }, h('table', { class: 'tabla-datos' }, h('thead', null, h('tr', null, h('th', null, 'Acción'), h('th', null, 'Teclas'), h('th', null, 'Nota'))), h('tbody', null, lista.map((a) => h('tr', null, h('td', null, a.accion), h('td', { class: 'mono', html: enLinea(String(a.es_ES || a.teclas || a.mac || '').split(/\s+o\s+|\s*\/\s*/).map((t) => `[[${t}]]`).join(' o ')) }), h('td', { class: 'tenue' }, a.nota || ''))))))); };
      cont.append(h('div', { class: 'fila' }, h('button', { class: 'boton peq', type: 'button', onclick: () => { so = 'win'; pintarA(); } }, 'Windows'), h('button', { class: 'boton peq', type: 'button', onclick: () => { so = 'mac'; pintarA(); } }, 'Mac')), h('p', { class: 'tenue' }, 'Ojo: en el Excel en español varios atajos cambian respecto a los tutoriales en inglés (Ctrl+G guarda; Ctrl+N es negrita).'), tabla);
      pintarA();
    } else if (actual === 'cinta') {
      cont.append(h('p', { class: 'entradilla' }, 'La cinta de opciones de Excel para Microsoft 365 en español. Toca las pestañas para ver dónde está cada cosa.'), crearCinta(null, null), (REF.dialogos || []).length ? h('div', { class: 'pila' }, h('h3', null, 'Cuadros de diálogo que usarás a menudo'), h('div', { class: 'tabla-env' }, h('table', { class: 'tabla-datos' }, h('tbody', null, REF.dialogos.map((d) => h('tr', null, h('td', null, h('b', null, d.es)), h('td', { html: enLinea(d.acceso || '') }))))))) : null);
    } else if (actual === 'glosario') {
      const q = h('input', { class: 'buscador', type: 'search', placeholder: 'Busca un término', 'aria-label': 'Buscar término' });
      const tbody = h('tbody');
      const filtrar = () => { const t = norm(q.value); tbody.replaceChildren(...(REF.terminos || []).filter((x) => !t || norm(x.es).includes(t) || norm(x.en).includes(t) || norm(x.definicion || '').includes(t)).map((x) => h('tr', null, h('td', null, h('b', null, x.es)), h('td', { class: 'tenue' }, x.en), h('td', null, x.definicion || '')))); };
      q.addEventListener('input', filtrar); filtrar();
      cont.append(q, h('div', { class: 'tabla-env' }, h('table', { class: 'tabla-datos' }, h('thead', null, h('tr', null, h('th', null, 'Español'), h('th', null, 'Inglés'), h('th', null, 'Qué es'))), tbody)));
    } else if (actual === 'entrega') {
      const lista = D.checklist || [];
      cont.append(h('p', { class: 'entradilla' }, 'Repásala cada vez que vayas a enviar un archivo. Las marcas se guardan en este navegador.'), h('button', { class: 'boton peq', type: 'button', onclick: () => { P.checklist = {}; guardar(); vistaConsulta('entrega'); } }, 'Desmarcar todo'),
        ...lista.map((g) => h('section', { class: 'pila' }, h('h3', null, g.grupo), h('ul', { class: 'check-lista' }, g.puntos.map((p, i) => { const k = g.grupo + i; return h('li', null, h('label', null, h('input', { type: 'checkbox', checked: !!P.checklist[k], onchange: (e) => { P.checklist[k] = e.target.checked; guardar(); } }), h('span', { html: enLinea(p) }))); })))));
    }
    vista().replaceChildren(h('div', { class: 'pila-g' }, h('div', { class: 'pila' }, h('div', { class: 'sobretitulo' }, 'Para el día a día'), h('h1', null, 'Consulta rápida')), sub, cont));
  }

  /* ================= proyectos ================= */
  function vistaProyectos() {
    titulo('Proyectos');
    vista().replaceChildren(h('div', { class: 'pila-g' }, h('div', { class: 'pila lectura' }, h('div', { class: 'sobretitulo' }, 'Nivel final · autonomía'), h('h1', null, 'Proyectos de empresa'),
      h('p', { class: 'entradilla' }, 'Encargos completos como los de una oficina: un correo con dudas que aclarar, datos que hay que limpiar, un resultado que se comprueba con totales de control y una entrega que se evalúa con rúbrica.')),
      h('div', { class: 'proyectos' }, (D.proyectos || []).map((p) => { const est = P.proyectos[p.id] || {}; return h('a', { class: 'proyecto-tarjeta', href: '#proyecto-' + p.id }, h('div', { class: 'sobretitulo' }, p.departamento || ''), h('h3', null, p.titulo), h('p', { class: 'tenue' }, p.resumen || ''), h('div', { class: 'chips' }, h('span', { class: 'chip' }, (p.horas || '?') + ' h'), est.terminado ? h('span', { class: 'chip', style: { color: 'var(--bien)', borderColor: 'var(--bien)' } }, '✓ entregado') : null)); })),
      D.examen ? h('section', { class: 'aviso empresa' }, h('div', { class: 't' }, h('span', { class: 'etq' }, 'Examen final'), D.examen.titulo || 'Prueba técnica'), h('p', null, D.examen.resumen || ''), h('div', null, h('a', { class: 'boton primario', href: '#examen' }, 'Ir al examen final'))) : null));
  }
  function vistaProyecto(id) {
    const p = (D.proyectos || []).find((x) => x.id === id); if (!p) return vistaProyectos();
    titulo(p.titulo);
    const est = P.proyectos[id] = P.proyectos[id] || { pasos: {}, rubrica: {} };
    const ctx = { titulo: 'Proyecto: ' + p.titulo, objetivo: p.resumen };
    const sec = [];
    sec.push(h('header', { class: 'pila lectura' }, h('div', { class: 'migas' }, h('a', { href: '#proyectos' }, 'Proyectos'), '›', p.departamento || ''), h('h1', null, p.titulo), h('p', { class: 'entradilla' }, p.resumen || ''), h('div', { class: 'chips' }, h('span', { class: 'chip' }, (p.horas || '?') + ' horas'), (p.habilidades || []).map((x) => h('span', { class: 'chip' }, x)))));
    if (p.correo) sec.push(h('section', { class: 'pila lectura' }, h('h2', null, '1. El encargo'), h('div', { class: 'correo' }, h('div', { class: 'cab-correo' }, h('span', null, 'De'), h('span', null, p.correo.de), h('span', null, 'Para'), h('span', null, p.correo.para || 'ti'), h('span', null, 'Asunto'), h('span', null, h('b', null, p.correo.asunto))), h('div', { class: 'cuerpo' }, p.correo.cuerpo))));
    if (p.preguntas_previas) sec.push(h('section', { class: 'pila lectura' }, h('h2', null, '2. Antes de abrir Excel: ¿qué preguntarías?'), renderEjercicio({ id: p.id + '-preguntas', modo: 'abierta', pregunta: p.preguntas_previas.pregunta || 'Escribe las preguntas que harías a quien te hace el encargo antes de empezar.', modelo: p.preguntas_previas.modelo, criterios: p.preguntas_previas.criterios }, ctx),
      (p.aclaraciones || []).length ? h('details', { class: 'plegable' }, h('summary', null, 'Lo que te contestan'), h('div', null, h('div', { class: 'tabla-env' }, h('table', { class: 'tabla-datos' }, h('tbody', null, p.aclaraciones.map((a) => h('tr', null, h('td', null, h('b', null, a.pregunta)), h('td', null, a.respuesta)))))))) : null));
    if ((p.archivos || []).length) sec.push(h('section', { class: 'pila lectura' }, h('h2', null, '3. Los datos'), p.datos_md ? md(p.datos_md) : null, p.archivos.map((a) => h('div', { class: 'fila' }, botonDescarga(a.archivo, a.titulo || a.archivo), h('span', { class: 'tenue' }, a.descripcion || '')))));
    if ((p.pasos || []).length) sec.push(h('section', { class: 'pila lectura' }, h('h2', null, '4. Plan de trabajo'), h('p', { class: 'tenue' }, 'Intenta cada paso tú sola. Abre la ayuda solo si te atascas.'), h('ul', { class: 'check-lista' }, p.pasos.map((s, i) => h('li', null, h('div', { class: 'pila', style: { gap: '.35rem' } }, h('label', null, h('input', { type: 'checkbox', checked: !!est.pasos[i], onchange: (e) => { est.pasos[i] = e.target.checked; guardar(); } }), h('span', null, h('b', null, s.titulo))), s.md ? md(s.md) : null, s.pista ? h('details', { class: 'plegable' }, h('summary', null, 'Ayuda para este paso'), h('div', null, md(s.pista))) : null))))));
    if ((p.controles || []).length) sec.push(h('section', { class: 'pila lectura' }, h('h2', null, '5. Totales de control'), renderEjercicio({ id: p.id + '-controles', modo: 'excel', enunciado: 'Antes de entregar, comprueba tus cifras. Si alguna no cuadra, revisa la limpieza de datos: suele estar ahí.', controles: p.controles, explicacion: 'Tus cifras coinciden con las de la solución.' }, ctx)));
    if ((p.entregables || []).length || (p.rubrica || []).length) {
      const filas = (p.rubrica || []).map((r, ri) => h('tr', null, h('th', null, r.criterio), r.niveles.map((n, ni) => { const td = h('td', { class: 'opc' + (est.rubrica[ri] === ni ? ' elegida' : ''), tabindex: '0', role: 'button', 'aria-pressed': est.rubrica[ri] === ni ? 'true' : 'false' }, n); const fn = () => { est.rubrica[ri] = ni; guardar(); vistaProyecto(id); }; td.addEventListener('click', fn); td.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } }); return td; })));
      sec.push(h('section', { class: 'pila' }, h('h2', null, '6. Entrega y autoevaluación'), (p.entregables || []).length ? h('div', { class: 'lectura pila' }, h('p', null, 'Entregables:'), h('ul', { class: 'lista-sola' }, p.entregables.map((x) => h('li', null, x)))) : null,
        (p.rubrica || []).length ? h('div', { class: 'rubrica' }, h('table', null, h('thead', null, h('tr', null, h('th', null, 'Criterio'), ['En desarrollo', 'Aceptable', 'Bien', 'Excelente'].map((t) => h('th', null, t)))), h('tbody', null, filas))) : null,
        h('p', { class: 'tenue' }, 'Marca en cada fila el nivel en el que estás de verdad. Si algo queda en «En desarrollo», mira la solución y repítelo.')));
    }
    if (CAP.sample) sec.push(h('section', { class: 'pila lectura' }, h('h2', null, 'Revisión de la tutora'), h('p', null, 'Sube una captura de tu hoja (o pega el texto de tu correo de entrega) y te dirá qué mejorar según la rúbrica.'), h('div', null, h('button', { class: 'boton primario', type: 'button', onclick: () => abrirTutora({ tipo: 'proyecto', proyecto: p }) }, 'Abrir la revisión'))));
    if (p.correo_entrega) sec.push(h('section', { class: 'pila lectura' }, h('h2', null, '7. El correo de entrega'), renderEjercicio({ id: p.id + '-entrega', modo: 'abierta', pregunta: p.correo_entrega.pregunta || 'Escribe el correo con el que entregas el trabajo.', modelo: p.correo_entrega.modelo, criterios: p.correo_entrega.criterios }, ctx)));
    if (p.solucion_md || p.archivo_solucion) sec.push(h('section', { class: 'pila lectura' }, h('details', { class: 'plegable' }, h('summary', null, 'Ver la solución comentada'), h('div', null, md(p.solucion_md || ''), p.archivo_solucion ? botonDescarga(p.archivo_solucion, 'Descargar el libro resuelto') : null, p.archivo_solucion ? h('p', { class: 'tenue' }, 'Si al abrir la solución ves ceros, pulsa «Habilitar edición» en la barra amarilla: Excel calculará las fórmulas.') : null)),
      (p.errores_tipicos || []).length ? h('aside', { class: 'aviso cuidado' }, h('div', { class: 't' }, h('span', { class: 'etq' }, 'Cuidado'), 'Errores típicos en este encargo'), h('ul', { class: 'lista-sola' }, p.errores_tipicos.map((x) => h('li', null, x)))) : null,
      (p.ampliaciones || []).length ? h('aside', { class: 'aviso truco' }, h('div', { class: 't' }, h('span', { class: 'etq' }, 'Para subir nivel'), 'Ampliaciones'), h('ul', { class: 'lista-sola' }, p.ampliaciones.map((x) => h('li', null, x)))) : null));
    sec.push(h('div', { class: 'siguiente' }, h('a', { class: 'boton', href: '#proyectos' }, '← Todos los proyectos'), h('button', { class: 'boton primario', type: 'button', onclick: () => { const ya = est.terminado; est.terminado = true; if (!ya) { ganarXP(150); confeti(); sonidoFin(); } comprobarLogros(); guardar(); toast('Proyecto entregado: +150 XP'); location.hash = '#inicio'; } }, 'Marcar como entregado')));
    vista().replaceChildren(h('div', { class: 'pila-g' }, ...sec));
    guardar();
  }

  /* ================= prueba de nivel y examen ================= */
  function vistaPrueba() {
    titulo('Prueba de nivel');
    const pr = D.prueba_nivel; if (!pr) return vistaMapa();
    const respuestas = {};
    const preguntas = pr.preguntas || [];
    const zona = h('div', { class: 'pila' });
    const lista = h('div', { class: 'pila' }, preguntas.map((q, i) => {
      const el = renderEjercicio({ ...q, id: 'prueba-' + (q.id || i) });
      el.addEventListener('click', () => setTimeout(() => { respuestas[i] = P.ej['prueba-' + (q.id || i)]; }, 0));
      el.addEventListener('keydown', () => setTimeout(() => { respuestas[i] = P.ej['prueba-' + (q.id || i)]; }, 0));
      return h('div', { class: 'pila', style: { gap: '.3rem' } }, h('span', { class: 'tenue mono' }, `Pregunta ${i + 1} de ${preguntas.length}`), el);
    }));
    function resultado() {
      const porNivel = {};
      preguntas.forEach((q, i) => { const r = P.ej['prueba-' + (q.id || i)]; const n = q.nivel; porNivel[n] = porNivel[n] || { ok: 0, total: 0 }; porNivel[n].total++; if (r && r.ok && r.n === 1) porNivel[n].ok++; });
      let inicio = niveles[0].id;
      for (const n of niveles) { const x = porNivel[n.id]; if (x && x.ok / x.total >= (pr.umbral || 0.8)) inicio = niveles[Math.min(niveles.indexOf(n) + 1, niveles.length - 1)].id; else if (x) break; }
      P.prueba = { porNivel, inicio, fecha: hoy() }; guardar();
      const ni = niveles.findIndex((n) => n.id === inicio);
      zona.replaceChildren(h('aside', { class: 'aviso atajo' }, h('div', { class: 't' }, h('span', { class: 'etq' }, 'Resultado'), `Te recomendamos empezar en el Nivel ${ni}: ${niveles[ni].nombre}`),
        h('ul', { class: 'lista-sola' }, niveles.filter((n) => porNivel[n.id]).map((n) => h('li', null, `${n.nombre}: ${porNivel[n.id].ok} de ${porNivel[n.id].total} a la primera`))),
        h('div', { class: 'fila' }, h('button', { class: 'boton primario', type: 'button', onclick: () => { for (const l of LECCIONES) { if (niveles.findIndex((n) => n.id === l.nivel) < ni && estadoLeccion(l.id) === 'pendiente') P.lecciones[l.id] = { estado: 'saltada', t: Date.now() }; } guardar(); location.hash = '#nivel-' + inicio; } }, 'Saltar lo que ya sé e ir allí'), h('a', { class: 'boton', href: '#nivel-' + niveles[0].id }, 'Prefiero empezar desde el principio'))));
      zona.scrollIntoView({ behavior: 'smooth' });
    }
    vista().replaceChildren(h('div', { class: 'pila-g lectura' }, h('div', { class: 'pila' }, h('div', { class: 'sobretitulo' }, 'Unos 15 minutos'), h('h1', null, 'Prueba de nivel'), md(pr.intro || 'Contesta sin buscar. Si no sabes algo, elige lo que creas: no pasa nada, solo sirve para saber por dónde empezar.')), lista, h('div', null, h('button', { class: 'boton primario', type: 'button', onclick: resultado }, 'Ver mi resultado')), zona));
  }
  function vistaExamen() {
    titulo('Examen final');
    const ex = D.examen; if (!ex) return vistaProyectos();
    const ctx = { titulo: 'Examen final' };
    vista().replaceChildren(h('div', { class: 'pila-g lectura' }, h('div', { class: 'pila' }, h('div', { class: 'sobretitulo' }, `${ex.duracion || 120} minutos · como una prueba técnica de empresa`), h('h1', null, ex.titulo || 'Examen final'), md(ex.intro || '')),
      (ex.archivos || []).length ? h('div', { class: 'pila' }, h('h2', null, 'Material'), ex.archivos.map((a) => h('div', { class: 'fila' }, botonDescarga(a.archivo, a.titulo || a.archivo), h('span', { class: 'tenue' }, a.descripcion || '')))) : null,
      ...(ex.partes || []).map((parte) => h('section', { class: 'pila' }, h('h2', null, parte.titulo), parte.md ? md(parte.md) : null, (parte.ejercicios || []).map((e) => renderEjercicio(e, ctx)))),
      h('div', { class: 'pila' }, h('button', { class: 'boton primario gigante', type: 'button', onclick: () => {
        const ejs = (ex.partes || []).flatMap((p) => p.ejercicios || []).filter((e) => !['abierta'].includes(e.modo));
        const ok = ejs.filter((e) => P.ej[e.id] && P.ej[e.id].ok).length; const excelOk = ejs.filter((e) => e.modo === 'excel').every((e) => P.ej[e.id] && P.ej[e.id].ok);
        const nota = ejs.length ? ok / ejs.length : 0; const aprobado = nota >= 0.8 && excelOk;
        P.examenFinal = { nota, aprobado: aprobado || !!(P.examenFinal && P.examenFinal.aprobado), fecha: hoy() }; guardar();
        if (aprobado) { confeti(); sonidoFin(); toast('¡Examen final superado!'); location.hash = '#certificado'; }
        else toast(`Nota: ${Math.round(nota * 100)} %. ${excelOk ? '' : 'Te faltan totales de control por cuadrar. '}Necesitas un 80 %.`);
      } }, 'Entregar el examen'), h('p', { class: 'tenue' }, 'Se aprueba con un 80 % de respuestas correctas y todos los totales de control cuadrados.')),
      ex.rubrica ? h('details', { class: 'plegable' }, h('summary', null, 'Cómo se evalúa'), h('div', null, md(ex.rubrica))) : null,
      ex.solucion_md ? h('details', { class: 'plegable' }, h('summary', null, 'Solución (ábrela solo al terminar)'), h('div', null, md(ex.solucion_md), ex.archivo_solucion ? botonDescarga(ex.archivo_solucion, 'Descargar el libro resuelto') : null)) : null));
  }

  /* ================= tutora ================= */
  const INSTRUCCIONES_TUTORA = `Eres «la tutora» de Hoja a hoja, una guía para aprender Excel desde cero hasta trabajar sola en una empresa española. Hablas con una alumna adulta.
Reglas: escribe en español de España, claro y cercano, sin tecnicismos innecesarios. Usa SIEMPRE el Excel en español: nombres de funciones en español (SUMA, BUSCARX, SUMAR.SI.CONJUNTO, SI.ERROR...), argumentos separados por punto y coma (;), coma decimal, menús en español (Inicio, Insertar, Datos, Fórmulas...). Si das una fórmula, ponla entre acentos graves, por ejemplo \`=SUMA(B2:B10)\`.
Enseña, no resuelvas por ella: ante un ejercicio, primero una pista o una pregunta que la haga pensar; da la solución completa solo si te la pide expresamente o tras dos intentos. Sé breve (máximo 150 palabras salvo que pida más). Si no estás segura de algo de Excel, dilo. No inventes funciones. Formato: párrafos cortos y listas con guiones; sin tablas.`;
  let turnos = []; let ctxTutora = null; let imagenesAdj = []; let ctlTutora = null;
  function textoErrorTutora(e) {
    const c = e && e.code;
    if (c === 'not_granted') return 'La tutora necesita tu permiso para usar Claude. Puedes darlo en el menú de permisos del artefacto.';
    if (c === 'rate_limited') return 'Demasiadas preguntas seguidas. Espera un minuto y vuelve a intentarlo.';
    if (c === 'cancelled') return '';
    return 'La tutora no está disponible ahora mismo. Vuelve a intentarlo en un rato.';
  }
  function contextoTexto(c) {
    if (!c) return '';
    if (c.tipo === 'ejercicio') return `CONTEXTO: la alumna está en el ejercicio «${(c.ej.enunciado || '').slice(0, 500)}». Hoja (celdas): ${JSON.stringify(c.ej.hoja.celdas).slice(0, 1500)}. Debe escribir la fórmula en ${c.ej.objetivo}${c.ej.copiar_a ? ' y se copiará a ' + c.ej.copiar_a.join(', ') : ''}. Su fórmula: ${c.formula}. El corrector dijo: ${c.mensajes.join(' ')}. Una solución correcta (NO se la des salvo que la pida): ${c.ej.solucion}.`;
    if (c.tipo === 'leccion') return `CONTEXTO: lección «${c.leccion.titulo}» (${c.leccion.nivel}). Objetivo: ${c.leccion.objetivo || ''}. Extracto: ${c.leccion.texto || ''}`;
    if (c.tipo === 'proyecto') return `CONTEXTO: proyecto «${c.proyecto.titulo}». Encargo: ${(c.proyecto.correo && c.proyecto.correo.cuerpo || '').slice(0, 1500)}. Entregables: ${(c.proyecto.entregables || []).join('; ')}. Rúbrica: ${(c.proyecto.rubrica || []).map((r) => r.criterio + ' → excelente: ' + r.niveles[3]).join(' | ')}. Si te manda una captura, revisa lo que se ve contra la rúbrica: estructura, fórmulas visibles, formato, errores, y di 3 mejoras concretas.`;
    return '';
  }
  function abrirTutora(contexto) {
    const panel = $('#tutora');
    if (contexto) { ctxTutora = contexto; turnos = []; imagenesAdj = []; }
    panel.hidden = false;
    pintarTutora(contexto);
    $('#tutora textarea').focus();
  }
  function pintarTutora(nuevoCtx) {
    const msjs = $('#tutora .mensajes');
    if (nuevoCtx) {
      msjs.innerHTML = '';
      const t = nuevoCtx.tipo === 'ejercicio' ? 'Vamos con este ejercicio. ¿Qué parte te lía? Si quieres, te doy una pista sin destriparte la solución.' : nuevoCtx.tipo === 'proyecto' ? 'Sube una captura de tu hoja con el botón «Adjuntar captura» o pega tu correo de entrega, y te digo qué mejorar.' : `Estoy aquí para la lección «${nuevoCtx.leccion?.titulo || ''}». Pregúntame lo que quieras, o pídeme que te lo explique de otra forma.`;
      msjs.append(h('div', { class: 'msj ella' }, t), h('div', { class: 'msj nota' }, 'La tutora es una IA y puede equivocarse: contrasta con la lección. Usa tu cuenta de Claude. No compartas datos personales ni de clientes.'));
    }
    $('#tutora .adjuntar').hidden = !CAP.imagenes;
  }
  async function enviarTutora(texto) {
    if (!CAP.sample || !texto.trim()) return;
    const msjs = $('#tutora .mensajes');
    msjs.append(h('div', { class: 'msj yo' }, texto + (imagenesAdj.length ? `\n📎 ${imagenesAdj.length} imagen` : '')));
    const burbuja = h('div', { class: 'msj ella' }, 'Pensando…'); msjs.append(burbuja); msjs.scrollTop = msjs.scrollHeight;
    turnos.push({ role: 'user', content: texto });
    const entrada = [{ role: 'user', content: INSTRUCCIONES_TUTORA + '\n\n' + contextoTexto(ctxTutora) + (leccionActual && !ctxTutora ? `\nLección abierta: ${leccionActual.titulo}` : '') }, ...turnos.slice(-10)];
    ctlTutora = new AbortController();
    try {
      const opts = { signal: ctlTutora.signal, cache: false, onText: ({ text }) => { burbuja.replaceChildren(md(text)); msjs.scrollTop = msjs.scrollHeight; } };
      if (imagenesAdj.length) opts.images = imagenesAdj;
      const { text } = await CAP.sample(entrada, opts);
      turnos.push({ role: 'assistant', content: text });
    } catch (e) {
      burbuja.replaceChildren(md(e && e.text ? e.text : textoErrorTutora(e)));
      turnos.pop();
    } finally { imagenesAdj = []; $('#tutora .adjunto').textContent = ''; }
  }

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
  const COLORES_NIVEL = ['#0b8a9a', '#1f4fd1', '#0f8a6a', '#7a4bd1', '#c9572a', '#b0157a', '#c98a00'];
  function svgInsignia(i, gris) {
    const c = COLORES_NIVEL[i % COLORES_NIVEL.length];
    return `<svg class="insignia-nivel${gris ? ' gris' : ''}" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 3 57 17.5v29L32 61 7 46.5v-29Z" fill="${c}"/><path d="M32 9.5 51.5 20.8v22.4L32 54.5 12.5 43.2V20.8Z" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2"/><text x="32" y="40" text-anchor="middle" font-family="Archivo, Arial, sans-serif" font-weight="800" font-size="22" fill="#fff">${i}</text></svg>`;
  }

  /* ================= capa de juego: experiencia, racha, logros ================= */
  const METAS = [[20, 'Tranquila', '≈ 1 lección al día'], [50, 'Constante', '≈ 2-3 lecciones'], [100, 'Intensa', '≈ 5 lecciones']];
  function xpHoy() { return (P.dias || {})[hoy()] || 0; }
  function rachaActual() {
    // Días seguidos con práctica. Un día de descanso cada 7 no la rompe (comodín): las rachas rotas desaniman (Silverman y Barasch 2023).
    const d = P.dias || {}; let n = 0; const f = new Date(); const clave = () => f.toISOString().slice(0, 10);
    if (!d[clave()]) f.setDate(f.getDate() - 1);
    let desdeComodin = 7;
    for (let guard = 0; guard < 2000; guard++) {
      if (d[clave()]) { n++; desdeComodin++; }
      else if (desdeComodin >= 7 && n > 0) { const g = new Date(f); g.setDate(g.getDate() - 1); if (!d[g.toISOString().slice(0, 10)]) break; desdeComodin = 0; }
      else break;
      f.setDate(f.getDate() - 1);
    }
    return n;
  }
  const RANGOS = [[0, 'Recién llegada'], [150, 'Auxiliar administrativa'], [500, 'Administrativa'], [1200, 'Administrativa sénior'], [2200, 'Técnica de administración'], [3500, 'Analista'], [5000, 'Analista sénior'], [7000, 'Responsable de informes']];
  function rango(xp) { let k = 0; RANGOS.forEach((r, i) => { if ((xp || 0) >= r[0]) k = i; }); const sig = RANGOS[k + 1]; return { n: k, nombre: RANGOS[k][1], desde: RANGOS[k][0], siguiente: sig ? sig[1] : null, hasta: sig ? sig[0] : null }; }
  let xpSesion = 0;
  function ganarXP(n, origen) {
    if (!n) return;
    const rAntes = rango(P.xp).n; const hoyAntes = xpHoy(); const meta = P.meta || 50;
    P.xp = (P.xp || 0) + n; P.dias = P.dias || {}; P.dias[hoy()] = (P.dias[hoy()] || 0) + n; xpSesion += n;
    P.mejorRacha = Math.max(P.mejorRacha || 0, rachaActual());
    if (origen) { const r = origen.getBoundingClientRect ? origen.getBoundingClientRect() : null; if (r) { const f = h('div', { class: 'xp-flotante', style: { left: (r.left + r.width / 2 - 20) + 'px', top: (r.top - 10) + 'px' } }, '+' + n + ' XP'); document.body.append(f); setTimeout(() => f.remove(), 1200); } }
    if (rango(P.xp).n > rAntes) { ascensos.push(rango(P.xp).nombre); if (!document.body.classList.contains('jugando')) { toast('¡Ascenso! Ahora eres ' + rango(P.xp).nombre); sonidoFin(); } }
    if (hoyAntes < meta && xpHoy() >= meta) { metaHoyCumplida = true; if (!document.body.classList.contains('jugando')) { toast('¡Meta de hoy cumplida!'); confeti(); } }
    pintarHUD(true);
  }
  let ascensos = [];
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

  /* ================= capa de diversión: A1, la mascota ================= */
  // A1 es la celda seleccionada del logotipo (borde azul y controlador de relleno en la esquina) con cara.
  function svgMascota(estado) {
    const bocas = {
      normal: '<path d="M25 37q7 5.5 14 0" fill="none" stroke="var(--tinta)" stroke-width="3" stroke-linecap="round"/>',
      feliz: '<path d="M23 34.5q9 12 18 0z" fill="var(--tinta)"/><path d="M27 39.5q5 3 10 0" fill="none" stroke="var(--fuego)" stroke-width="2.4" stroke-linecap="round"/>',
      fiesta: '<path d="M22 33.5q10 14 20 0z" fill="var(--tinta)"/><path d="M26.5 39.5q5.5 3.4 11 0" fill="none" stroke="var(--fuego)" stroke-width="2.4" stroke-linecap="round"/>',
      animo: '<path d="M26.5 38.5q5.5 3 11 0" fill="none" stroke="var(--tinta)" stroke-width="3" stroke-linecap="round"/><path d="M50 19q2 4 0 5.5q-2-1.5 0-5.5z" fill="var(--entrada)" opacity=".55"/>',
      pensando: '<path d="M27 38.5h9" fill="none" stroke="var(--tinta)" stroke-width="3" stroke-linecap="round"/>',
    };
    const ojoY = estado === 'pensando' ? 25 : 27.5;
    const mejillas = ['feliz', 'fiesta'].includes(estado) ? '<circle cx="17.5" cy="35" r="3.4" fill="var(--fuego)" opacity=".3"/><circle cx="46.5" cy="35" r="3.4" fill="var(--fuego)" opacity=".3"/>' : '';
    const brazos = estado === 'fiesta' ? '<path d="M9 30L2.5 17M55 30l6.5-13" stroke="var(--entrada)" stroke-width="4" stroke-linecap="round"/>'
      : estado === 'feliz' ? '<path d="M9 33L3 25M55 33l6-8" stroke="var(--entrada)" stroke-width="4" stroke-linecap="round"/>'
      : '<path d="M9 35L4 42M55 35l5 7" stroke="var(--entrada)" stroke-width="4" stroke-linecap="round"/>';
    const chispas = estado === 'fiesta' ? '<path class="m-chispa" d="M6 4l1.6 3.4L11 9l-3.4 1.6L6 14l-1.6-3.4L1 9l3.4-1.6z" fill="var(--oro)"/><path class="m-chispa b" d="M58 0l1.3 2.7L62 4l-2.7 1.3L58 8l-1.3-2.7L54 4l2.7-1.3z" fill="var(--oro)"/>' : '';
    const cejas = estado === 'animo' ? '<path d="M19.5 21.5l7-2.6M44.5 21.5l-7-2.6" stroke="var(--tinta)" stroke-width="2.4" stroke-linecap="round"/>' : '';
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${chispas}<g class="m-cuerpo">${brazos}<path d="M23 50v7M37 50v7" stroke="var(--entrada)" stroke-width="4" stroke-linecap="round"/><rect x="9" y="12" width="46" height="38" rx="9" fill="var(--hoja)" stroke="var(--entrada)" stroke-width="4"/><rect x="48.5" y="43.5" width="11" height="11" rx="2" fill="var(--entrada)" stroke="var(--hoja)" stroke-width="2"/>${mejillas}${cejas}<g class="m-ojos"><ellipse cx="24" cy="${ojoY}" rx="3.6" ry="4.4" fill="var(--tinta)"/><ellipse cx="40" cy="${ojoY}" rx="3.6" ry="4.4" fill="var(--tinta)"/><circle cx="25.2" cy="${ojoY - 1.6}" r="1.2" fill="var(--hoja)"/><circle cx="41.2" cy="${ojoY - 1.6}" r="1.2" fill="var(--hoja)"/></g>${bocas[estado] || bocas.normal}</g></svg>`;
  }
  function mascota(estado, clase) { return h('span', { class: 'mascota ' + (estado || 'normal') + (clase ? ' ' + clase : ''), html: svgMascota(estado || 'normal') }); }
  function dice(estado, texto, clase) { return h('div', { class: 'mascota-dice' + (clase ? ' ' + clase : '') }, mascota(estado), h('div', { class: 'bocadillo' }, h('span', { html: enLinea(texto) }))); }
  const al = (lista) => lista[Math.floor(Math.random() * lista.length)];
  const VITORES = ['¡Eso es!', '¡Exacto!', '¡Bordado!', '¡Perfecto!', '¡Muy bien!', '¡Toma ya!', '¡Clavado!', '¡Así se hace!'];
  const ANIMOS = ['Casi', 'Uy, por poco', 'Tranquila', 'Se aprende fallando'];
  function flotar(texto, el) {
    if (!el || !el.getBoundingClientRect) return;
    const r = el.getBoundingClientRect();
    const f = h('div', { class: 'xp-flotante' }, texto);
    f.style.left = (r.left + r.width / 2 - 24) + 'px'; f.style.top = (r.top - 12) + 'px';
    document.body.append(f); setTimeout(() => f.remove(), 1200);
  }
  function contarHasta(el, fin, ms) { // número que sube hasta su valor
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = fin; return; }
    const t0 = performance.now(); const pre = el.dataset.pre || '';
    (function paso(t) { const k = Math.min(1, (t - t0) / ms); el.textContent = pre + Math.round(fin * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(paso); })(t0);
  }
  // Barra inferior de los tres modos de juego (lección, examen, entrenamiento): un solo botón grande.
  // Mientras hay que responder dice «Comprobar» (y pulsa el «Comprobar» del ejercicio); después, «Continuar».
  function crearBarraJuego(alContinuar, conMascota) {
    const cara = h('span', { class: 'msj-cara', 'aria-hidden': 'true' });
    const tit = h('b', { class: 'msj-tit' }); const sub = h('span', { class: 'msj-sub' });
    const msj = h('div', { class: 'msj-barra', role: 'status' }, tit, sub);
    const extra = h('div', { class: 'msj-extra' });
    const btn = h('button', { class: 'boton primario gigante', type: 'button' }, 'Continuar');
    const barra = h('div', { class: 'barra-continuar' }, h('div', { class: 'in' }, h('div', { class: 'msj-caja' }, cara, msj, extra), btn));
    let modo = 'continuar'; let interno = null; let zonaEj = null; let etiqueta = 'Comprobar';
    btn.addEventListener('click', () => { if (btn.disabled) return; if (modo === 'comprobar' && interno) interno.click(); else alContinuar(); });
    function estado(clase, titulo, subtitulo, habilitado) {
      barra.className = 'barra-continuar' + (clase ? ' ' + clase : '');
      tit.textContent = titulo || ''; sub.textContent = subtitulo || '';
      cara.replaceChildren(conMascota !== false && clase ? mascota(clase === 'bien' ? 'feliz' : 'animo') : '');
      btn.disabled = !habilitado;
      if (clase === 'mal' && zonaEj) { const s = zonaEj.querySelector('section.ejercicio'); if (s) { s.classList.remove('tiembla'); void s.offsetWidth; s.classList.add('tiembla'); } }
    }
    function ejercicio(zona, ej, yaResuelto) { // prepara la barra para un ejercicio nuevo
      zonaEj = zona; modo = 'continuar'; interno = null; btn.textContent = 'Continuar';
      if (!yaResuelto && !['excel', 'abierta'].includes(ej.modo)) {
        interno = [...zona.querySelectorAll('section.ejercicio button.boton.primario')].find((b) => /^(Comprobar|Ver qué pasa)/.test(b.textContent.trim())) || null;
        if (interno) { etiqueta = interno.textContent.trim(); interno.classList.add('comprobar-en-barra'); modo = 'comprobar'; btn.textContent = etiqueta; }
      }
      return modo === 'comprobar';
    }
    function resuelto(sigueComprobando) { // tras una respuesta: «Continuar», o «Comprobar» si puede reintentar (fórmulas)
      if (sigueComprobando && interno) { modo = 'comprobar'; btn.textContent = etiqueta; btn.disabled = false; }
      else { modo = 'continuar'; btn.textContent = 'Continuar'; }
    }
    function texto(t) { btn.textContent = t; modo = 'continuar'; }
    return { barra, btn, extra, estado, ejercicio, resuelto, texto };
  }

  /* ================= cofres: un premio al terminar cada módulo ================= */
  const ICO_COFRE = (abierto) => abierto
    ? '<svg viewBox="0 0 96 84" aria-hidden="true"><g class="c-brillo"><path d="M48 6v14M24 14l7 11M72 14l-7 11M12 30l11 5M84 30l-11 5" stroke="var(--oro)" stroke-width="4" stroke-linecap="round"/></g><path d="M14 44h68v30a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6z" fill="var(--oro)" stroke="var(--tinta)" stroke-width="3.5"/><path d="M14 44l6-16h56l6 16z" fill="color-mix(in srgb, var(--oro) 55%, var(--tinta))" stroke="var(--tinta)" stroke-width="3.5" stroke-linejoin="round"/><path d="M14 58h68" stroke="var(--tinta)" stroke-width="3.5"/><rect x="42" y="52" width="12" height="13" rx="2" fill="var(--hoja)" stroke="var(--tinta)" stroke-width="3"/></svg>'
    : '<svg viewBox="0 0 96 84" aria-hidden="true"><path d="M14 40h68v34a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6z" fill="var(--oro)" stroke="var(--tinta)" stroke-width="3.5"/><path d="M14 40v-8c0-11 9-18 20-18h28c11 0 20 7 20 18v8z" fill="var(--oro)" stroke="var(--tinta)" stroke-width="3.5" stroke-linejoin="round"/><path d="M14 40h68M30 14v66M66 14v66" stroke="var(--tinta)" stroke-width="3.5"/><rect x="41" y="33" width="14" height="16" rx="3" fill="var(--hoja)" stroke="var(--tinta)" stroke-width="3"/><circle cx="48" cy="40" r="2.2" fill="var(--tinta)"/><path d="M48 42v3" stroke="var(--tinta)" stroke-width="2.4" stroke-linecap="round"/></svg>';
  function premioCofre() { const r = Math.random(); return r < 0.3 ? 15 : r < 0.6 ? 20 : r < 0.8 ? 25 : r < 0.95 ? 30 : 50; }
  function vistaCofre(modId) {
    const mod = MOD[modId]; if (!mod) return vistaMapa();
    titulo('Cofre'); document.body.classList.add('jugando');
    const id = 'cofre-' + modId; P.cofres = P.cofres || {};
    const pendientes = mod.lecciones.filter((l) => !['hecha', 'saltada'].includes(estadoLeccion(l.id)));
    const trucos = mod.lecciones.flatMap((l) => l.tarjetas || []);
    const seguir = () => { const { actual } = estadoNodos(); location.hash = actual ? actual.href : '#inicio'; };
    const cofre = h('div', { class: 'cofre', html: ICO_COFRE(!!P.cofres[id]) });
    const zona = h('div', { class: 'pila', style: { alignItems: 'center', textAlign: 'center', gap: '1rem' } });
    const cab = h('div', { class: 'jugar-cab' }, h('a', { class: 'cerrar', href: '#inicio', 'aria-label': 'Volver al mapa' }, '✕'), h('div'), h('span'));
    const cont = h('div', { class: 'jugar' }, cab, h('div', { class: 'resultado cofre-pantalla' }, h('div', { class: 'sobretitulo' }, 'Módulo terminado · ' + mod.titulo), cofre, zona));
    if (pendientes.length) {
      zona.append(h('h1', null, 'Este cofre aún está cerrado'), h('p', { class: 'entradilla' }, `Se abre al terminar las lecciones del módulo. Te ${pendientes.length === 1 ? 'queda 1' : 'quedan ' + pendientes.length}.`), h('a', { class: 'boton primario gigante', href: '#jugar-' + pendientes[0].id }, 'Ir a la lección'));
    } else if (P.cofres[id]) {
      zona.append(h('h1', null, 'Cofre abierto'), h('p', { class: 'entradilla' }, `Tenía +${P.cofres[id].xp} XP. Lo abriste el ${P.cofres[id].fecha.split('-').reverse().join('/')}.`), h('button', { class: 'boton primario gigante', type: 'button', onclick: seguir }, 'Seguir'));
    } else {
      const abrir = h('button', { class: 'boton primario gigante', type: 'button' }, 'Abrir el cofre');
      zona.append(dice('feliz', '¡Has terminado el módulo entero! Esto se merece un premio. Ábrelo.'), abrir);
      abrir.addEventListener('click', () => {
        abrir.disabled = true; cofre.classList.add('agita'); tono([[392, 0.08], [440, 0.08], [494, 0.08], [523, 0.08]]);
        setTimeout(() => {
          const xp = premioCofre(); P.cofres[id] = { xp, fecha: hoy() };
          cofre.classList.remove('agita'); cofre.classList.add('abierto'); cofre.innerHTML = ICO_COFRE(true);
          ganarXP(xp); comprobarLogros(); guardar(); sonidoFin(); confeti();
          const num = h('b', { 'data-pre': '+' }, '+0');
          const truco = trucos.length ? al(trucos) : null;
          zona.replaceChildren(h('div', { class: 'premio-xp' }, num, h('span', null, 'XP')), h('h1', null, xp >= 50 ? '¡Premio gordo!' : xp >= 30 ? '¡Buen botín!' : '¡Premio!'),
            truco ? h('div', { class: 'truco-regalo' }, h('div', { class: 'sobretitulo' }, 'Y un truco de regalo'), h('b', { html: enLinea(truco.frente) }), h('span', { html: enLinea(truco.dorso) })) : null,
            h('button', { class: 'boton primario gigante', type: 'button', onclick: seguir }, 'Seguir'));
          contarHasta(num, xp, 900);
        }, 900);
      });
    }
    vista().replaceChildren(cont);
  }

  /* ================= tarjeta de empleada ================= */
  function tarjetaEmpleada() {
    const nombre = (P.nombre || 'Nueva incorporación').trim();
    const iniciales = nombre.split(/\s+/).map((x) => x[0]).slice(0, 2).join('').toUpperCase();
    const desde = (P.bienvenida || hoy()).split('-').reverse().join('/');
    let num = 7; for (const c of nombre + desde) num = (num * 31 + c.charCodeAt(0)) % 9000;
    return h('div', { class: 'tarjeta-empleada', role: 'img', 'aria-label': `Tarjeta de empleada de ${nombre}, ${rango(P.xp).nombre}` },
      h('div', { class: 'te-agujero', 'aria-hidden': 'true' }),
      h('div', { class: 'te-cab' }, h('span', { class: 'marca-celda' }, 'A1'), h('div', null, h('b', null, 'Electro Cierzo'), h('span', null, 'Suministros, S.L. · Zaragoza'))),
      h('div', { class: 'te-cuerpo' }, h('div', { class: 'te-foto' }, iniciales || 'A1'),
        h('div', { class: 'te-datos' }, h('span', { class: 'te-etq' }, 'Nombre'), h('b', { class: 'te-nombre' }, nombre), h('span', { class: 'te-etq' }, 'Puesto'), h('span', null, rango(P.xp).nombre + ' · Administración'))),
      h('div', { class: 'te-pie' }, h('span', null, 'Desde ' + desde), h('span', { class: 'mono' }, 'Nº ' + String(1000 + num))));
  }
  let metaHoyCumplida = false;

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
        nodos.push({ tipo: 'cofre', id: 'cofre-' + mod.id, titulo: 'Cofre: ' + mod.titulo, href: '#cofre-' + mod.id });
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
    if (nd.tipo === 'cofre') return !!(P.cofres && P.cofres[nd.id]);
    return false;
  }
  function estadoNodos() {
    const mundos = construirNodos();
    const cursoIncompleto = niveles.some((n) => n.incompleto || !n.modulos.length);
    const lineal = []; for (const w of mundos) for (const nd of w.nodos) lineal.push(nd);
    let previaHecha = true; // ¿está hecha la lección anterior?
    let ultimaHecha = -1;
    lineal.forEach((nd, k) => {
      nd.hecho = nodoHecho(nd);
      // lecciones en orden; retos y exámenes se abren al llegar a ellos y no bloquean; proyectos en cualquier orden
      nd.abierto = previaHecha || nd.hecho;
      if (nd.tipo === 'leccion') { previaHecha = nd.hecho; if (nd.hecho) ultimaHecha = k; }
      if (nd.tipo === 'proyecto' || nd.tipo === 'final') nd.abierto = (previaHecha && !cursoIncompleto) || nd.hecho;
    });
    const candidatos = lineal.map((nd, k) => ({ nd, k })).filter((x) => x.nd.abierto && !x.nd.hecho);
    const sig = candidatos.find((x) => x.k > ultimaHecha) || candidatos[0] || null;
    const actual = sig ? sig.nd : null;
    for (const nd of lineal) nd.actual = nd === actual;
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
      const contenido = nd.tipo === 'cofre' ? h('span', { class: 'mini-cofre', html: ICO_COFRE(nd.hecho) }) : !nd.abierto ? icono('candado') : nd.tipo === 'leccion' ? (nd.hecho ? icono('check') : String(nd.num)) : nd.tipo === 'reto' ? icono('libro') : nd.tipo === 'examen' ? icono('bandera') : nd.tipo === 'proyecto' ? icono('maletin') : icono('trofeo');
      const etiquetaTexto = `${nd.titulo}${nd.hecho ? ' (completado)' : !nd.abierto ? ' (bloqueado)' : ''}`;
      const bola = nd.abierto ? h('a', { class: 'bola', href: nd.href, 'aria-label': etiquetaTexto }, contenido) : h('button', { class: 'bola', type: 'button', 'aria-label': etiquetaTexto, onclick: (e) => mostrarBloqueado(e, nd) }, contenido);
      const etq = h('div', { class: 'etiqueta' }, nd.titulo, nd.tipo === 'leccion' && nd.hecho && est ? h('div', { class: 'estrellas', 'aria-label': `${est} estrellas` }, [1, 2, 3].map((k) => icono('estrella', 'estrella' + (k <= est ? ' si' : '')))) : null);
      const globo = nd.actual ? h('div', { class: 'globo-actual', 'aria-hidden': 'true' }, nd.tipo === 'cofre' ? '¡Ábrelo!' : nd.tipo === 'examen' ? '¡A por el examen!' : estadoLeccion(nd.id) === 'empezada' ? 'Sigue aquí' : '¡Empieza!') : null;
      const guia = nd.actual ? mascota(nd.tipo === 'cofre' ? 'feliz' : 'normal', 'mascota-mapa') : null;
      camino.append(h('li', { class: clases, style: { left: p.x + '%', top: p.y + 'px' } }, globo, bola, guia, etq));
    });
    return camino;
  }
  function mostrarBloqueado(e, nd) {
    document.querySelectorAll('.burbuja').forEach((b) => b.remove());
    const li = e.currentTarget.closest('li');
    const b = h('div', { class: 'burbuja', role: 'dialog', 'aria-label': 'Lección bloqueada', style: { top: '2.9rem' } }, h('h3', null, nd.titulo), h('p', { class: 'tenue' }, 'Se desbloquea al terminar lo anterior. Así cada paso se apoya en el que ya sabes.'), h('div', { class: 'fila' }, h('button', { class: 'boton peq', type: 'button', onclick: () => b.remove() }, 'Vale'), h('a', { class: 'boton fantasma peq', href: nd.href }, 'Abrir igualmente')));
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
        h('div', { class: 'sobretitulo' }, nuevo ? 'Excel desde cero, jugando' : (P.nombre ? `Hola, ${P.nombre} · siguiente paso` : 'Siguiente paso')),
        h('h1', null, nuevo ? 'Aprende Excel nivel a nivel hasta trabajar sola' : actual ? actual.titulo : '¡Lo has completado todo!'),
        nuevo ? h('p', { class: 'entradilla' }, 'Lecciones de 10 minutos, ejercicios que se corrigen al momento y proyectos reales de oficina. Empieza por la primera: no hace falta saber nada.') : null,
        h('div', { class: 'stats' },
          h('div', { class: 'stat', style: { color: racha ? 'var(--fuego)' : 'var(--tinta-3)' } }, icono('fuego'), h('div', null, h('b', null, racha), h('span', null, racha === 1 ? 'día de racha' : 'días de racha'))),
          h('div', { class: 'stat', style: { color: 'var(--oro)' } }, icono('rayo'), h('div', null, h('b', null, P.xp || 0), h('span', null, 'puntos de experiencia'))),
          h('div', { class: 'stat' }, h('div', { class: 'anillo', style: { '--p': pct } }), h('div', null, h('b', null, `${xpHoy()}/${meta}`), h('span', null, 'meta de hoy'))),
          h('div', { class: 'stat' }, h('div', null, h('b', null, `${hechas}/${total}`), h('span', null, 'lecciones'))))),
      h('div', { class: 'pila', style: { alignItems: 'stretch' } },
        actual ? h('a', { class: 'boton primario gigante', href: actual.href }, nuevo ? 'Empezar' : 'Continuar') : h('a', { class: 'boton primario gigante', href: '#perfil' }, 'Ver mi certificado'),
        entrenoPendiente().length ? h('a', { class: 'boton', href: '#entrenar' }, `Entrenamiento (${Math.min(7, entrenoPendiente().length)})`) : null,
        tarjetasPendientes().length ? h('a', { class: 'boton', href: '#repaso' }, `Tarjetas de repaso (${tarjetasPendientes().length})`) : null,
        nuevo && D.prueba_nivel ? h('a', { class: 'boton fantasma', href: '#prueba' }, '¿Ya sabes algo? Prueba de nivel') : null));
    const lista = h('div', { class: 'pila-g' });
    for (const w of mundos) {
      const p = w.final ? { pct: w.nodos.filter((n) => n.hecho).length / Math.max(1, w.nodos.length), hechas: w.nodos.filter((n) => n.hecho).length, total: w.nodos.length } : progresoNivel(w.nivel);
      const aprobado = !w.final && P.examenes && P.examenes[w.nivel.id] && P.examenes[w.nivel.id].aprobado;
      lista.append(h('section', { class: 'mundo', id: 'mundo-' + w.nivel.id, style: { '--c': w.final ? 'var(--oro)' : COLORES_NIVEL[w.idx % COLORES_NIVEL.length] } },
        h('header', { class: 'mundo-cab' }, h('div', { html: w.final ? `<svg class="insignia-nivel${(P.certificado && P.certificado.fecha) ? '' : ' gris'}" viewBox="0 0 24 24" style="color:var(--oro)">${ICO.trofeo.replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>` : svgInsignia(w.idx, !aprobado) }),
          h('div', { class: 'pila', style: { gap: '.35rem' } }, h('div', { class: 'sobretitulo' }, w.final ? 'Nivel final' : `Nivel ${w.idx}`), h('h2', null, w.nivel.nombre), h('p', null, w.nivel.lema || ''),
            h('div', { class: 'barra-prog' + (p.pct === 1 ? ' bien' : '') }, h('i', { style: { width: Math.round(p.pct * 100) + '%' } })),
            h('div', { class: 'entre' }, h('span', { class: 'tenue' }, `${p.hechas} de ${p.total}${w.nivel.horas ? ' · unas ' + w.nivel.horas + ' h' : ''}`), w.final ? null : h('a', { href: '#nivel-' + w.nivel.id, class: 'tenue' }, 'Qué aprenderás')))),
        w.nodos.length ? pintarCamino(w) : h('p', { class: 'tenue', style: { textAlign: 'center', padding: '.5rem 0 1rem' } }, 'Este nivel se está terminando de preparar. Aparecerá aquí en cuanto esté listo: ', (w.nivel.previstos || []).join(' · ')),
        w.nodos.length && w.nivel.incompleto ? h('p', { class: 'tenue', style: { textAlign: 'center' } }, 'Faltan módulos de este nivel: se añadirán en cuanto estén listos.') : null));
    }
    const rg = rango(P.xp);
    const tiraRango = nuevo ? null : h('div', { class: 'rango' }, h('div', { class: 'entre' }, h('span', null, h('b', null, rg.nombre), ' en Electro Cierzo'), rg.siguiente ? h('span', { class: 'tenue' }, `${rg.hasta - (P.xp || 0)} XP para ${rg.siguiente}`) : null), rg.siguiente ? h('div', { class: 'barra-prog' }, h('i', { style: { width: Math.round(((P.xp || 0) - rg.desde) / (rg.hasta - rg.desde) * 100) + '%', background: 'var(--oro)' } })) : null);
    vista().replaceChildren(h('div', { class: 'pila-g mapa' }, panel, nuevo ? null : avisoGuardado(), tiraRango, nuevo ? null : panelMision(), lista, h('p', { class: 'tenue', style: { textAlign: 'center' } }, h('a', { href: '#metodo' }, 'Por qué aquí se aprende de verdad: el método y la investigación que hay detrás'))));
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
    const repetidos = new Set(); const resultados = {}; let i = 0; xpSesion = 0; logrosNuevos = []; ascensos = []; let combo = 0;
    const barraProg = h('div', { class: 'progreso-leccion', role: 'progressbar', 'aria-label': 'Progreso de la lección' }, h('i', { style: { width: '0%' } }));
    const chipCombo = h('span', { class: 'combo', hidden: true, 'aria-live': 'polite' });
    function pintarCombo() { chipCombo.hidden = combo < 2; chipCombo.replaceChildren(icono('fuego'), h('b', null, '×' + combo)); chipCombo.classList.remove('pop'); void chipCombo.offsetWidth; chipCombo.classList.add('pop'); barraProg.classList.toggle('en-racha', combo >= 3); }
    const btnSonido = h('button', { class: 'cerrar', type: 'button', 'aria-label': 'Sonido', title: 'Sonido', onclick: () => { P.sonido = P.sonido === false; guardar(); btnSonido.replaceChildren(icono(P.sonido === false ? 'silencio' : 'sonido')); } }, icono(P.sonido === false ? 'silencio' : 'sonido'));
    const cab = h('div', { class: 'jugar-cab' }, h('a', { class: 'cerrar', href: '#inicio', 'aria-label': 'Salir al mapa', title: 'Salir al mapa' }, '✕'), h('div', { class: 'prog-y-combo' }, barraProg, chipCombo), btnSonido);
    const zona = h('div', { class: 'pantalla-jugar' });
    const JB = crearBarraJuego(() => siguiente());
    const btn = JB.btn; const barra = JB.barra;
    const saltar = h('button', { class: 'boton fantasma peq', type: 'button', hidden: true }, 'Hacerlo luego'); JB.extra.append(saltar);
    const cont = h('div', { class: 'jugar' }, cab, zona, barra);
    function estadoBarra(clase, texto, habilitado, subtitulo) { JB.estado(clase, texto, subtitulo, habilitado); }
    function pintar() {
      const p = pantallas[i];
      barraProg.firstChild.style.width = Math.round(i / pantallas.length * 100) + '%';
      zona.innerHTML = ''; saltar.hidden = true; escuchaEj = null;
      if (p.tipo === 'intro') {
        zona.append(h('div', { class: 'pila', style: { gap: '1rem', paddingTop: '1rem' } }, h('div', { class: 'etq-pantalla' }, `Nivel ${nIdx} · ${MOD[l.modulo].titulo}`), h('h1', null, l.titulo),
          l.mision ? h('div', { class: 'pila', style: { gap: '.5rem' } }, h('div', { class: 'etq-pantalla', style: { color: 'var(--entrada)' } }, 'Tu misión'), burbujaMensaje(l.mision.de, l.mision.puesto, l.mision.texto)) : null,
          l.objetivo ? h('p', { class: 'entradilla' }, l.objetivo) : null,
          h('div', { class: 'fila' }, h('span', { class: 'chip' }, `${l.minutos || 12} min`), h('span', { class: 'chip' }, `${pantallas.filter((x) => x.tipo === 'ej').length} ejercicios`), (l.funciones || []).map((f) => h('span', { class: 'chip fn' }, f))),
          h('p', { class: 'tenue' }, 'Ve a tu ritmo. Si fallas algo, no pasa nada: lo repasamos al final.')));
        estadoBarra('', '', true); JB.texto('Empezar');
      } else if (p.tipo === 'explica') {
        zona.append(h('div', { class: 'pila', style: { gap: '1rem' } }, p.bloques.map((b) => renderBloque(b, ctx))));
        estadoBarra('', '', true); JB.texto('Continuar');
      } else if (p.tipo === 'ej') {
        const ej = p.ej; const yaResuelto = resultados[ej.id + (p.rep ? '-r' : '')];
        if (p.etq || p.rep) zona.append(h('div', { class: 'etq-pantalla' }, p.rep ? 'Otra vez: este se te resistió' : p.etq));
        zona.append(renderEjercicio(ej, ctx));
        const libre = ['abierta', 'excel'].includes(ej.modo);
        const conComprobar = JB.ejercicio(zona, ej, !!yaResuelto);
        estadoBarra('', libre || yaResuelto || conComprobar ? '' : 'Elige una respuesta', libre || !!yaResuelto || conComprobar);
        if (ej.modo === 'excel') { saltar.hidden = false; saltar.onclick = () => { registrarEj(ej.id, false, { saltado: true }); siguiente(); }; }
        escuchaEj = (id, ok, info) => {
          if (id !== ej.id) return;
          const clave = ej.id + (p.rep ? '-r' : '');
          const primera = !(clave in resultados);
          if (primera) resultados[clave] = ok;
          if (ok) {
            if (primera) combo++; let extra = '';
            if (primera && [3, 5, 8, 12].includes(combo)) { ganarXP(combo, btn); extra = ` · ¡${combo} seguidas! +${combo} XP extra`; tono([[784, 0.1], [988, 0.1], [1319, 0.25]]); } else sonidoBien();
            JB.resuelto(false);
            estadoBarra('bien', al(VITORES), true, (info && info.xp ? `+${info.xp} XP` : '') + extra);
            if (info && info.xp) flotar('+' + info.xp + ' XP', btn);
          }
          else if (info && info.vista) { combo = 0; JB.resuelto(false); estadoBarra('mal', 'Mírala con calma', true, 'Te la volveremos a preguntar otro día'); }
          else {
            combo = 0; sonidoMal();
            if (ej.modo === 'formula') { JB.resuelto(true); estadoBarra('mal', al(ANIMOS), true, 'Prueba otra vez o pide una pista'); }
            else { JB.resuelto(false); estadoBarra('mal', al(ANIMOS), true, 'Lo repasamos al final de la lección'); if (primera && !p.rep && REPETIBLES.includes(ej.modo) && !repetidos.has(ej.id)) { repetidos.add(ej.id); pantallas.push({ tipo: 'ej', ej, rep: true }); } }
          }
          pintarCombo();
        };
      }
      btn.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
    function siguiente() { i++; if (i >= pantallas.length) return terminar(); pintar(); }
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
      [1, 2, 3].slice(0, estrellas).forEach((k) => setTimeout(() => tono([[523 * Math.pow(1.26, k - 1), 0.18]]), 350 + k * 260));
      const numXP = h('b', { 'data-pre': '+' }, '+0'); setTimeout(() => contarHasta(numXP, xpSesion, 900), 500);
      const meta1 = metaHoyCumplida; metaHoyCumplida = false;
      const etqSig = destino.startsWith('#cofre-') ? 'Abrir el cofre' : sig && destino === '#jugar-' + sig.id ? 'Siguiente lección' : 'Seguir';
      cont.replaceChildren(h('div', { class: 'resultado' },
        mascota(estrellas === 3 ? 'fiesta' : 'feliz', 'grande'),
        h('div', { class: 'estrellas-grandes', 'aria-label': `${estrellas} de 3 estrellas` }, [1, 2, 3].map((k) => h('span', { class: 'estrella-pop', style: { '--d': (350 + k * 260) + 'ms' }, html: ICO.estrella.replace('<svg ', `<svg class="${k <= estrellas ? 'si' : ''}" `) }))),
        h('h1', null, estrellas === 3 ? '¡Lección perfecta!' : estrellas === 2 ? '¡Muy bien!' : '¡Lección completada!'),
        l.mision && l.mision.logro ? h('div', { class: 'logro-nuevo', style: { borderColor: 'var(--bien)', background: 'var(--bien-suave)' } }, h('span', { style: { color: 'var(--bien)', width: '2.4rem' }, html: ICO.check }), h('div', null, h('b', null, 'Misión cumplida'), h('div', null, l.mision.logro))) : null,
        ascensos.map((a) => h('div', { class: 'logro-nuevo' }, h('span', { style: { color: 'var(--oro)', width: '2.4rem' }, html: ICO.trofeo }), h('div', null, h('b', null, '¡Ascenso!'), h('div', { class: 'tenue' }, 'Ahora eres ' + a)))),
        h('p', { class: 'entradilla' }, estrellas === 3 ? 'Todo a la primera y sin pistas. Esto ya es tuyo.' : `Has acertado a la primera ${limpios} de ${propios.length}. ${estrellas < 3 ? 'Repítela cuando quieras para conseguir las 3 estrellas.' : ''}`),
        h('div', { class: 'recuadros' }, h('div', { class: 'recuadro oro' }, numXP, h('span', null, 'XP')), h('div', { class: 'recuadro fuego' }, h('b', null, rachaActual()), h('span', null, 'días de racha')), h('div', { class: 'recuadro verde' }, h('b', null, `${Math.min(100, Math.round(xpHoy() / meta * 100))}%`), h('span', null, 'meta de hoy'))),
        meta1 ? h('div', { class: 'logro-nuevo', style: { borderColor: 'var(--fuego)' } }, h('span', { style: { color: 'var(--fuego)', width: '2.4rem' }, html: ICO.fuego }), h('div', null, h('b', null, '¡Meta de hoy cumplida!'), h('div', { class: 'tenue' }, 'Has llegado a tus ' + meta + ' XP. Mañana, a por otra.'))) : null,
        logrosNuevos.map((g) => h('div', { class: 'logro-nuevo' }, h('span', { html: svgLogro(g, true) }), h('div', null, h('b', null, 'Logro: ' + g.t), h('div', { class: 'tenue' }, g.d)))),
        (l.tarjetas || []).length ? h('p', { class: 'tenue' }, `${l.tarjetas.length} tarjeta${l.tarjetas.length > 1 ? 's' : ''} nueva${l.tarjetas.length > 1 ? 's' : ''} en tu repaso.`) : null,
        h('div', { class: 'fila', style: { justifyContent: 'center' } }, h('a', { class: 'boton primario gigante', href: destino }, etqSig), h('a', { class: 'boton', href: '#inicio' }, 'Volver al mapa'), h('a', { class: 'boton fantasma', href: '#leccion-' + l.id }, 'Ver la lección entera'))));
      window.scrollTo(0, 0);
    }
    vista().replaceChildren(cont);
    pintar();
  }
  function completarLeccion(l, estrellas) {
    const primeraVez = estadoLeccion(l.id) !== 'hecha';
    marcarLeccion(l.id, 'hecha'); desbloquearTarjetas(l); programarEntreno(l);
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
      document.body.classList.add('jugando'); modoExamen = true; modoSesion = true;
      const res = {}; let i = 0;
      const barraProg = h('div', { class: 'progreso-leccion' }, h('i', { style: { width: '0%' } }));
      const zona = h('div', { class: 'pantalla-jugar' });
      const JB = crearBarraJuego(() => { i++; if (i < preguntas.length) pintar(); else fin(); }, false);
      const barra = JB.barra;
      const cont = h('div', { class: 'jugar' }, h('div', { class: 'jugar-cab' }, h('a', { class: 'cerrar', href: '#inicio', 'aria-label': 'Abandonar', onclick: () => { modoExamen = false; } }, '✕'), barraProg, h('span', { class: 'tenue mono' }, '')), zona, barra);
      function pintar() {
        const q = { ...preguntas[i], id: `ex-${nid}-${preguntas[i].id || i}` };
        barraProg.firstChild.style.width = Math.round(i / preguntas.length * 100) + '%';
        cont.querySelector('.jugar-cab .mono').textContent = `${i + 1}/${preguntas.length}`;
        zona.replaceChildren(renderEjercicio(q, { titulo: 'examen' }));
        const conComprobar = JB.ejercicio(zona, q, false);
        JB.estado('', '', '', conComprobar);
        escuchaEj = (id, ok) => { if (id !== q.id || (i in res)) return; res[i] = ok; JB.resuelto(false); JB.estado(ok ? 'bien' : 'mal', ok ? 'Correcta' : 'Incorrecta', '', true); ok ? sonidoBien() : sonidoMal(); };
        window.scrollTo(0, 0);
      }
      function fin() {
        modoExamen = false; modoSesion = false; escuchaEj = null; document.body.classList.remove('jugando');
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
    const archivo = h('input', { type: 'file', accept: 'application/json,.json', class: 'oculto-visual', id: 'importar', onchange: async (e) => { const f = e.target.files[0]; if (!f) return; try { const datos = JSON.parse(await f.text()); if (datos.v !== 1) throw new Error(); P = fusionar({ ...P, reinicio: 0 }, { ...datos, reinicio: 0 }); guardar(); toast('Progreso cargado'); vistaPerfil(); } catch (x) { toast('Ese archivo no es un progreso de Hoja a hoja.'); } } });
    vista().replaceChildren(h('div', { class: 'pila-g' },
      h('section', { class: 'panel-hoy' }, h('div', { class: 'pila' }, h('div', { class: 'sobretitulo' }, 'Mi progreso · ' + rango(P.xp).nombre), h('h1', null, P.nombre || 'Tu perfil'), h('div', { class: 'stats' },
        h('div', { class: 'stat', style: { color: 'var(--fuego)' } }, icono('fuego'), h('div', null, h('b', null, rachaActual()), h('span', null, `racha · mejor: ${P.mejorRacha || 0}`))),
        h('div', { class: 'stat', style: { color: 'var(--oro)' } }, icono('rayo'), h('div', null, h('b', null, P.xp || 0), h('span', null, 'XP en total'))),
        h('div', { class: 'stat' }, h('div', null, h('b', null, s.lecciones), h('span', null, 'lecciones'))),
        h('div', { class: 'stat' }, h('div', null, h('b', null, Object.values(P.ej || {}).filter((e) => e.ok).length), h('span', null, 'ejercicios resueltos'))))),
        h('div', { class: 'pila' }, nombre, h('label', { class: 'fila tenue' }, h('input', { type: 'checkbox', checked: P.sonido !== false, onchange: (e) => { P.sonido = e.target.checked; guardar(); } }), 'Sonidos al acertar'))),
      h('section', { class: 'pila', style: { alignItems: 'center' } }, tarjetaEmpleada()),
      h('section', { class: 'pila' }, h('h2', null, 'Meta diaria'), h('p', { class: 'tenue' }, 'Mejor poco cada día que mucho un día suelto: la constancia es lo que hace que se quede.'), metas),
      h('section', { class: 'pila' }, h('h2', null, 'Insignias de nivel'), h('div', { class: 'insignias' }, niveles.map((n, i) => { const ok = P.examenes && P.examenes[n.id] && P.examenes[n.id].aprobado; return h('div', { class: 'logro' + (ok ? '' : ' no') }, h('span', { html: svgInsignia(i, !ok) }), h('b', null, n.nombre), h('span', null, ok ? 'Conseguida ' + P.examenes[n.id].fecha.split('-').reverse().join('/') : 'Aprueba el examen del nivel'), ok ? h('button', { class: 'boton fantasma peq', type: 'button', onclick: () => descargarCertificado({ tipo: 'nivel', nivel: i }) }, 'Certificado') : null); }))),
      h('section', { class: 'pila' }, h('h2', null, 'Logros'), h('div', { class: 'logros' }, LOGROS.map((l) => { const ok = P.logros && P.logros[l.id]; return h('div', { class: 'logro' + (ok ? '' : ' no') }, h('span', { html: svgLogro(l, !!ok) }), h('b', null, l.t), h('span', null, l.d)); }))),
      h('section', { class: 'pila' }, h('h2', null, 'Expediente'), h('div', { class: 'tabla-env expediente' }, h('table', { class: 'tabla-datos' }, h('thead', null, h('tr', null, h('th', null, 'Nivel'), h('th', null, 'Lecciones'), h('th', null, 'Examen'), h('th', null, 'Estado'))), h('tbody', null, exp))), h('div', null, h('a', { class: 'boton primario', href: '#certificado' }, 'Ver los requisitos del certificado'))),
      h('section', { class: 'pila' }, h('h2', null, 'Dónde se guarda tu progreso'),
        guardadoEn === 'cuenta' ? h('p', { class: 'guardado-ok' }, icono('check'), ' Se guarda solo, en tu cuenta y en este navegador. Puedes seguir desde cualquier ordenador.')
          : guardadoEn === 'comprobando' ? h('p', { class: 'tenue' }, 'Comprobando si se puede guardar en tu cuenta…')
          : avisoGuardado(),
        h('p', { class: 'tenue' }, P.copia ? `Última copia descargada: ${fechaCorta(P.copia)}.` : 'Aún no has descargado ninguna copia.', ' La copia es un archivo pequeño (.json) con todo tu avance: lecciones, puntos, racha, exámenes y certificados.'),
        h('div', { class: 'fila' }, h('button', { class: 'boton', type: 'button', onclick: async () => { if (await guardarCopia()) vistaPerfil(); } }, 'Descargar una copia'), h('label', { class: 'boton', for: 'importar' }, 'Cargar una copia'), archivo)),
      seccionEmpezarDeCero()));
  }
  function seccionEmpezarDeCero() { // borra todo el avance, con confirmación dentro de la página (el visor no muestra confirm())
    const caja = h('div', { class: 'pila' });
    const pintarCaja = (confirmando) => caja.replaceChildren(...(confirmando
      ? [h('div', { class: 'aviso cuidado', role: 'alertdialog', 'aria-label': 'Confirmar' }, h('div', { class: 't' }, h('span', { class: 'etq' }, 'Seguro'), 'Se borrará todo tu avance'),
          h('p', null, 'Lecciones, puntos, racha, cofres, exámenes y certificados. No se puede deshacer. Si quieres conservarlo, descarga antes una copia.'),
          h('div', { class: 'fila' }, h('button', { class: 'boton peligro', type: 'button', id: 'borrar-todo', onclick: empezarDeCero }, 'Sí, borrar todo y empezar'), h('button', { class: 'boton', type: 'button', onclick: () => pintarCaja(false) }, 'Cancelar')))]
      : [h('p', { class: 'tenue' }, 'Vuelve a la bienvenida con todo a cero, como el primer día.'), h('div', null, h('button', { class: 'boton', type: 'button', id: 'empezar-de-cero', onclick: () => pintarCaja(true) }, 'Empezar de cero'))]));
    pintarCaja(false);
    return h('section', { class: 'pila' }, h('h2', null, 'Empezar de cero'), caja);
  }
  function empezarDeCero() {
    const sonido = P.sonido;
    P = progresoVacio(); P.sonido = sonido; P.reinicio = Date.now(); P.actualizado = P.reinicio;
    try { localStorage.setItem(CLAVE, JSON.stringify(P)); localStorage.removeItem('hoja-libre'); } catch (e) { /* */ }
    if (dbDoc) { clearTimeout(temporizador); subir(); }
    pintarHUD(); pintarInsignias();
    location.hash = '#bienvenida';
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
    cuadro_nombres: ['Cuadro de nombres', 'Dice qué celda tienes seleccionada (aquí, B2). También sirve para ir a una celda: escribe C25 y pulsa Intro.'],
    insertar_funcion: ['Insertar función (fx)', 'Abre un asistente que te ayuda a elegir una función y rellenar sus argumentos.'],
    barra_formulas: ['Barra de fórmulas', 'Muestra lo que hay DE VERDAD dentro de la celda: si es una fórmula, verás la fórmula, no el resultado. Aquí también se escribe.'],
    seleccionar_todo: ['Seleccionar todo', 'La esquina de arriba a la izquierda: selecciona toda la hoja.'],
    encabezado_columna: ['Encabezados de columna', 'Las letras (A, B, C…). Cada columna es vertical. Haz clic en una letra para seleccionar la columna entera.'],
    encabezado_fila: ['Encabezados de fila', 'Los números (1, 2, 3…). Cada fila es horizontal.'],
    celda_activa: ['Celda activa', 'La celda seleccionada, con el borde grueso. Su «dirección» es la letra de su columna y el número de su fila: aquí, B2 (columna B, fila 2).'],
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
    for (let f = 1; f <= 5; f++) { rejilla.append(z('encabezado_fila', 'cab', String(f))); letras.forEach((l, k) => { if (f === 2 && k === 1) rejilla.append(z('celda_activa', 'act', '0', h('span', { class: 'relleno' }))); else rejilla.append(h('div', null, f === 1 && k === 0 ? 'Ventas' : '')); }); }
    // controlador de relleno como zona propia sobre la celda activa
    const act = rejilla.querySelector('.act'); const rell = act.querySelector('.relleno'); rell.remove(); const zr = z('controlador_relleno', 'relleno'); zr.style.position = 'absolute'; act.append(zr);
    const el = h('div', { class: 'excel-sim', role: 'group', 'aria-label': 'Ventana de Excel simulada' },
      h('div', { class: 'xs-titulo' }, z('guardar', '', h('span', { html: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M4 3h13l4 4v14H3V3h1Zm3 2v5h9V5H7Zm5 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/></svg>' })), z('titulo', '', 'Libro1 - Excel'), z('buscar', 'buscar', 'Buscar')),
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


  /* ================= entrenamiento diario: recuperar, espaciar y mezclar ================= */
  const AUTO = ['formula', 'predice', 'test', 'respuesta_corta', 'cinta', 'senala', 'ordenar'];
  const SALTOS = [0, 1, 3, 7, 16, 35]; // días hasta el siguiente repaso según la caja
  function programarEntreno(l) {
    // Al terminar una lección: vuelven mañana los ejercicios fallados o con ayuda (su «gemelo») y, a los 3 días, dos ejercicios clave.
    P.mem = P.mem || {};
    const ejs = ejerciciosDe(l).filter((e) => AUTO.includes(e.modo));
    const flojos = ejs.filter((e) => P.ej[e.id] && !P.ej[e.id].primera);
    const formulas = ejs.filter((e) => e.modo === 'formula' && !flojos.includes(e));
    const clave = [...formulas.slice(-1), ...ejs.filter((e) => !flojos.includes(e) && !formulas.slice(-1).includes(e)).slice(-1)];
    for (const e of flojos) if (!P.mem[e.id]) P.mem[e.id] = { caja: 1, prox: sumarDias(1) };
    for (const e of clave) if (!P.mem[e.id]) P.mem[e.id] = { caja: 2, prox: sumarDias(3) };
  }
  function entrenoPendiente() {
    const m = P.mem || {}; const h0 = hoy();
    return Object.entries(m).filter(([id, v]) => v.prox && v.prox <= h0 && EJ_INDEX[id]).sort((a, b) => (a[1].prox < b[1].prox ? -1 : 1));
  }
  function elegirEntreno(max) {
    const porLeccion = {}; const out = [];
    for (const [id] of entrenoPendiente()) {
      const lec = id.replace(/-(e|q|r|s)\d+$/, '');
      porLeccion[lec] = (porLeccion[lec] || 0) + 1;
      if (porLeccion[lec] > 2) continue; // mezclar: como mucho dos de la misma lección
      out.push(id); if (out.length >= max) break;
    }
    return barajar(out, hoy());
  }
  let modoSesion = false; let sesionPista = false;
  function vistaEntrenar() {
    titulo('Entrenamiento');
    const ids = elegirEntreno(7);
    if (!ids.length) {
      vista().replaceChildren(h('div', { class: 'jugar' }, h('div', { class: 'jugar-cab' }, h('a', { class: 'cerrar', href: '#inicio', 'aria-label': 'Volver al mapa' }, '✕'), h('div'), h('span')), h('div', { class: 'resultado' }, h('h1', null, 'Hoy no toca entrenar'), h('p', { class: 'entradilla' }, 'El entrenamiento te trae de vuelta ejercicios de lecciones pasadas justo cuando empiezan a olvidarse. Aparecerán aquí a partir de mañana de tu primera lección.'), h('a', { class: 'boton primario gigante', href: '#inicio' }, 'Volver al mapa'))));
      return;
    }
    document.body.classList.add('jugando'); modoSesion = true;
    const cola = ids.map((id) => ({ id })); const res = {}; let i = 0; let xp0 = P.xp || 0;
    const barraProg = h('div', { class: 'progreso-leccion' }, h('i', { style: { width: '0%' } }));
    const zona = h('div', { class: 'pantalla-jugar' });
    const JB = crearBarraJuego(() => { i++; if (i < cola.length) pintar(); else fin(); });
    const btn = JB.btn; const barra = JB.barra;
    const cont = h('div', { class: 'jugar' }, h('div', { class: 'jugar-cab' }, h('a', { class: 'cerrar', href: '#inicio', 'aria-label': 'Salir' }, '✕'), barraProg, h('span', { class: 'tenue mono' }, '')), zona, barra);
    function pintar() {
      const item = cola[i]; const orig = EJ_INDEX[item.id]; const lec = LEC[item.id.replace(/-(e|q|r|s)\d+$/, '')];
      const q = { ...orig, id: 'en-' + item.id + '-' + i };
      sesionPista = false;
      barraProg.firstChild.style.width = Math.round(i / cola.length * 100) + '%';
      cont.querySelector('.jugar-cab .mono').textContent = `${i + 1}/${cola.length}`;
      zona.replaceChildren(h('div', { class: 'etq-pantalla' }, item.rep ? 'Otra vez: a por él' : 'De una lección anterior' + (lec ? ': ' + lec.titulo : '')), renderEjercicio(q, { titulo: lec ? lec.titulo : 'entrenamiento' }));
      const conComprobar = JB.ejercicio(zona, q, false);
      JB.estado('', '', 'Recuerda cómo se hacía antes de mirar nada', conComprobar);
      let primerIntento = true;
      escuchaEj = (id, ok, info) => {
        if (id !== q.id) return;
        const limpio = ok && primerIntento && !sesionPista && !(info && info.vista);
        if (primerIntento && !item.rep) {
          res[item.id] = limpio;
          const m = P.mem[item.id];
          if (limpio) { m.caja = Math.min(5, (m.caja || 1) + 1); m.prox = m.caja >= 5 ? null : sumarDias(SALTOS[m.caja]); ganarXP(5, btn); }
          else { m.caja = 1; m.prox = sumarDias(1); if (AUTO.includes(orig.modo)) cola.push({ id: item.id, rep: true }); }
        }
        primerIntento = false;
        if (ok) { sonidoBien(); JB.resuelto(false); JB.estado('bien', limpio ? '¡Lo recuerdas!' : al(VITORES), limpio ? '+5 XP' : '', true); }
        else if (info && info.vista) { JB.resuelto(false); JB.estado('mal', 'Mírala con calma', 'Mañana vuelve a salirte', true); }
        else { sonidoMal(); if (orig.modo === 'formula') { JB.resuelto(true); JB.estado('mal', al(ANIMOS), 'Inténtalo otra vez o pide una pista', true); } else { JB.resuelto(false); JB.estado('mal', al(ANIMOS), 'Mañana vuelve a salirte', true); } }
      };
      window.scrollTo(0, 0);
    }
    function fin() {
      modoSesion = false; escuchaEj = null; document.body.classList.remove('jugando');
      P.entreno = hoy(); ganarXP(10); comprobarLogros(); guardar(); sonidoFin();
      const bien = Object.values(res).filter(Boolean).length; const total = Object.keys(res).length;
      cont.replaceChildren(h('div', { class: 'resultado' }, h('h1', null, bien === total ? '¡Memoria de elefanta!' : 'Entrenamiento hecho'), h('p', { class: 'entradilla' }, `Has recordado a la primera ${bien} de ${total}. ${bien < total ? 'Lo que ha fallado vuelve mañana; lo que has acertado, dentro de más días.' : 'Cada acierto aleja el siguiente repaso: así se queda para siempre.'}`),
        h('div', { class: 'recuadros' }, h('div', { class: 'recuadro oro' }, h('b', null, '+' + ((P.xp || 0) - xp0)), h('span', null, 'XP')), h('div', { class: 'recuadro fuego' }, h('b', null, rachaActual()), h('span', null, 'días de racha')), h('div', { class: 'recuadro verde' }, h('b', null, entrenoPendiente().length), h('span', null, 'pendientes'))),
        h('div', { class: 'fila', style: { justifyContent: 'center' } }, entrenoPendiente().length ? h('button', { class: 'boton', type: 'button', onclick: () => vistaEntrenar() }, 'Otra tanda') : null, h('a', { class: 'boton primario gigante', href: '#inicio' }, 'Volver al mapa'))));
      window.scrollTo(0, 0);
    }
    vista().replaceChildren(cont); pintar();
  }

  /* ================= misión de hoy ================= */
  function misionDeHoy() {
    const meta = P.meta || 50; const tareas = [];
    tareas.push({ t: `Consigue ${meta} XP`, hecho: xpHoy() >= meta, href: null, detalle: `${Math.min(xpHoy(), meta)}/${meta}` });
    const nE = entrenoPendiente().length;
    if (nE || P.entreno === hoy()) tareas.push({ t: 'Haz el entrenamiento', hecho: P.entreno === hoy(), href: '#entrenar', detalle: P.entreno === hoy() ? '' : `${Math.min(nE, 7)} ejercicio${Math.min(nE, 7) === 1 ? '' : 's'}` });
    const nT = tarjetasPendientes().length;
    if (nT || P.repasoHoy === hoy()) tareas.push({ t: 'Repasa tus tarjetas', hecho: !nT, href: '#repaso', detalle: nT ? `${nT} tarjeta${nT === 1 ? '' : 's'}` : '' });
    const todas = tareas.every((x) => x.hecho);
    return { tareas, todas, cobrado: P.cofre === hoy() };
  }
  function panelMision() {
    const m = misionDeHoy();
    const fila = (x) => { const cont = [h('span', { class: x.hecho ? 'ok' : 'pend' }, x.hecho ? '✓' : '○'), h('span', null, x.t), h('span', { class: 'tenue mono' }, x.detalle || '')]; return x.href && !x.hecho ? h('a', { class: 'req', href: x.href, style: { textDecoration: 'none', color: 'inherit' } }, cont) : h('div', { class: 'req' }, cont); };
    return h('section', { class: 'mision-hoy' }, h('div', { class: 'entre' }, h('h3', null, 'Misión de hoy'), P.plan ? h('span', { class: 'tenue' }, 'Tu plan: ' + P.plan) : null), m.tareas.map(fila),
      m.todas && !m.cobrado ? h('button', { class: 'boton primario', type: 'button', onclick: (e) => { P.cofre = hoy(); ganarXP(15, e.currentTarget); confeti(); sonidoFin(); guardar(); vistaMapa(); } }, 'Misión cumplida: recoge +15 XP') : m.cobrado ? h('p', { class: 'tenue' }, 'Misión de hoy cumplida. Mañana, más.') : null);
  }

  /* ================= el método (la ciencia que hay detrás) ================= */
  const METODO = [
    { t: 'Recordar sin mirar enseña más que releer', dato: 'Una semana después, quienes se habían examinado recordaban el 56 % del texto; quienes lo habían releído, el 42 %. Y los que releyeron creían estar mejor preparados.', cita: 'Roediger y Karpicke (2006), Psychological Science 17(3), 249-255', aqui: 'Cada lección termina con «Recuerda sin mirar», cada módulo empieza con un repaso y casi todo lo que haces es contestar, no leer.' },
    { t: 'Repasar con huecos que crecen', dato: 'El hueco ideal entre repasos depende de cuánto tiempo quieres recordar: entre el 20 y el 40 % de ese tiempo si es una semana, entre el 5 y el 10 % si es un año.', cita: 'Cepeda, Vul, Rohrer, Wixted y Pashler (2008), Psychological Science 19(11), 1095-1102', aqui: 'Las tarjetas y el entrenamiento vuelven al cabo de 1, 3, 7, 16 y 35 días: cada acierto aleja el siguiente repaso.' },
    { t: 'Mezclar problemas distintos', dato: 'Con práctica mezclada, la nota un mes después fue del 74 %; con práctica por bloques del mismo tipo, del 42 %.', cita: 'Rohrer, Dedrick y Stershic (2015), Journal of Educational Psychology 107(3)', aqui: 'El entrenamiento diario mezcla ejercicios de lecciones diferentes: así aprendes a elegir la herramienta, que es lo difícil en la oficina.' },
    { t: 'Primero un ejemplo resuelto, luego a medias, luego sola', dato: 'Quitar la ayuda poco a poco (primero los últimos pasos) da mejores resultados que pasar de golpe del ejemplo al problema.', cita: 'Renkl, Atkinson, Maier y Staley (2002), Journal of Experimental Education 70(4), 293-315', aqui: 'El primer ejercicio de cada idea viene casi hecho, el siguiente tiene pistas y el último lo resuelves tú.' },
    { t: 'Guía clara al empezar; equivocarse sin miedo después', dato: 'Quien parte de cero aprende mejor con explicaciones y ejemplos que descubriendo sola. Y entrenar animando a explorar y a equivocarse mejora la capacidad de resolver tareas nuevas (efecto medio d = 0,44; 18 de los 24 estudios eran de aprender un programa de ordenador).', cita: 'Kirschner, Sweller y Clark (2006), Educational Psychologist 41(2), 75-86; Keith y Frese (2008), Journal of Applied Psychology 93(1), 59-69', aqui: 'En los primeros niveles se explica y se muestra antes de pedir. Después hay ejercicios de «arregla el error», y fallar nunca penaliza: el ejercicio simplemente vuelve.' },
    { t: 'Una corrección que explica', dato: 'Decir solo «bien» o «mal» apenas enseña (d = 0,46); explicar qué ha pasado, por qué y qué hacer enseña el doble (d = 0,99).', cita: 'Wisniewski, Zierer y Hattie (2020), Frontiers in Psychology 10, 3087', aqui: 'La hoja te dice en qué celda falla tu fórmula, qué da y qué debería dar; cada opción de un test explica por qué es correcta o no.' },
    { t: 'Una pantalla, una idea', dato: 'Ir y venir entre unas instrucciones y el programa satura la memoria de trabajo y se aprende menos.', cita: 'Chandler y Sweller (1996), Applied Cognitive Psychology 10(2), 151-170', aqui: 'Cada pantalla tiene una sola idea o un solo ejercicio, y la hoja está siempre junto al enunciado.' },
    { t: 'Tareas completas y reales desde el principio', dato: 'Los modelos de formación profesional más contrastados ponen en el centro tareas enteras con sentido, no piezas sueltas.', cita: 'van Merriënboer y Kirschner, Ten Steps to Complex Learning (modelo 4C/ID)', aqui: 'Cada lección resuelve un encargo de una compañera de Electro Cierzo, y el curso termina con ocho proyectos de empresa.' },
    { t: 'Desconfiar del resultado', dato: 'En auditorías a fondo, el 94 % de 85 hojas de cálculo de empresa tenían errores, y al revisarlas solo se detecta de media el 60 % de los errores.', cita: 'Panko (2015), ponencia en el congreso de EuSpRIG (European Spreadsheet Risks Interest Group)', aqui: 'Desde el nivel 2 aprendes a comprobar: totales de control, celdas que avisan y casos límite antes de entregar.' },
    { t: 'No avanzar con lagunas', dato: 'Los programas que exigen dominar cada unidad antes de pasar a la siguiente dieron resultados positivos en 108 evaluaciones controladas.', cita: 'Kulik, Kulik y Bangert-Drowns (1990), Review of Educational Research 60(2), 265-299', aqui: 'Cada nivel acaba con un examen que se aprueba con el 80 % a la primera y sin pistas. Puedes repetirlo cuantas veces haga falta.' },
    { t: 'Un plan concreto y una racha que perdona', dato: 'Decidir de antemano «si pasa X, entonces hago Y» ayuda a cumplir lo que te propones (efecto medio d = 0,65 en 94 estudios; revisiones recientes lo rebajan a entre 0,15 y 0,35). Y ver una racha rota quita ganas de volver, salvo que se pueda reparar.', cita: 'Gollwitzer y Sheeran (2006); Sheeran, Listrom y Gollwitzer (2024), European Review of Social Psychology 36(1); Silverman y Barasch (2023), Journal of Consumer Research 49(6), 1095-1117', aqui: 'Al empezar eliges cuándo vas a practicar, y la racha te perdona un día de descanso a la semana.' },
    { t: 'El juego, al servicio del aprendizaje', dato: 'Los elementos de juego mejoran el aprendizaje de forma modesta pero real (g = 0,49). Pero las clasificaciones y las insignias vacías pueden quitar motivación.', cita: 'Sailer y Homner (2020), Educational Psychology Review 32(1), 77-112; Hanus y Fox (2015), Computers & Education 80, 152-161', aqui: 'Aquí los puntos, las estrellas y los logros solo se ganan haciendo cosas reales (acertar a la primera, cuadrar un total, entregar un proyecto). No hay clasificaciones ni castigos.' },
  ];
  function vistaMetodo() {
    titulo('El método');
    vista().replaceChildren(h('div', { class: 'pila-g lectura' },
      h('div', { class: 'pila' }, h('div', { class: 'sobretitulo' }, 'Por qué aquí se aprende de verdad'), h('h1', null, 'El método'), h('p', { class: 'entradilla' }, 'Esta guía no está hecha «como siempre se ha enseñado Excel». Cada decisión de diseño sale de estudios publicados sobre cómo aprendemos las personas. Estas son las doce ideas, lo que encontró la investigación y dónde las verás.')),
      ...METODO.map((m, i) => h('section', { class: 'pila', style: { gap: '.5rem' } }, h('h2', { style: { fontSize: '1.2rem' } }, `${i + 1}. ${m.t}`), h('p', null, m.dato), h('aside', { class: 'aviso atajo' }, h('div', { class: 't' }, h('span', { class: 'etq' }, 'En esta guía')), h('p', null, m.aqui)), h('p', { class: 'tenue' }, m.cita))),
      h('section', { class: 'pila' }, h('h2', { style: { fontSize: '1.2rem' } }, 'Lo que no hacemos'), h('p', null, 'No adaptamos nada a «estilos de aprendizaje» (visual, auditivo…): no hay pruebas de que funcione.'), h('p', { class: 'tenue' }, 'Pashler, McDaniel, Rohrer y Bjork (2008), Psychological Science in the Public Interest 9(3), 105-119')),
      h('p', { class: 'tenue' }, 'Ninguna investigación puede demostrar que un curso concreto sea «el mejor del mundo». Lo que sí se puede hacer, y es lo que hemos hecho, es construirlo con las técnicas que mejor resultado han dado en estudios controlados.'),
      h('div', null, h('a', { class: 'boton primario', href: '#inicio' }, 'Volver al mapa'))));
  }

  /* ================= bienvenida (primera vez) ================= */
  function vistaBienvenida() {
    titulo('Bienvenida');
    let paso = 0; const datos = { nombre: P.nombre || '', meta: P.meta || 50, experiencia: null, plan: P.plan || null };
    const PASOS = 5; // nombre, meta, momento, experiencia y la tarjeta de empleada
    const cont = h('div', { class: 'jugar bienvenida' });
    const op = (marcada, onclick, ...hijos) => h('button', { class: 'opcion', type: 'button', 'aria-pressed': marcada ? 'true' : 'false', onclick }, h('span', { class: 'letra' }, marcada ? '●' : '○'), h('span', null, ...hijos));
    function pintar() {
      const prog = h('div', { class: 'progreso-leccion' }, h('i', { style: { width: Math.round(paso / (PASOS - 1) * 100) + '%' } }));
      let cuerpo; let listo = true; const btn = h('button', { class: 'boton primario gigante', type: 'button' }, paso < PASOS - 2 ? 'Continuar' : paso === PASOS - 2 ? 'Terminar' : 'Empezar mi primer día');
      if (paso === 0) {
        listo = datos.nombre.length >= 2;
        const inp = h('input', { class: 'entrada-corta', type: 'text', id: 'bienvenida-nombre', placeholder: 'Escribe tu nombre', value: datos.nombre, autocomplete: 'given-name', maxlength: 40, style: { fontSize: '1.2rem', maxWidth: '22rem' } });
        inp.addEventListener('input', () => { datos.nombre = inp.value.trim(); btn.disabled = datos.nombre.length < 2; });
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !btn.disabled) btn.click(); });
        cuerpo = h('div', { class: 'pila', style: { gap: '1.1rem' } }, dice('normal', 'Hola, soy **A1**, la primera celda de cualquier hoja de Excel. Te acompaño desde hoy.'),
          h('h1', null, 'Bienvenida a Electro Cierzo. Hoy es tu primer día.'),
          h('p', { class: 'entradilla' }, 'Eres la nueva administrativa de una empresa de material eléctrico de Zaragoza. Tus compañeras te irán pidiendo cosas, y con cada encargo aprenderás Excel: de cero a llevar tus propios proyectos.'),
          h('label', { for: 'bienvenida-nombre', class: 'etq-pantalla' }, '¿Cómo te llamas?'), inp, h('p', { class: 'tenue' }, 'Saldrá en tu tarjeta de empleada y en tus certificados.'));
        setTimeout(() => inp.focus(), 50);
      } else if (paso === 1) {
        cuerpo = h('div', { class: 'pila', style: { gap: '1.1rem' } }, dice('feliz', `¡Qué bien tenerte aquí, ${datos.nombre}!`), h('h1', null, '¿Cuánto quieres practicar al día?'), h('p', { class: 'entradilla' }, 'Mejor poco cada día que mucho un día suelto. Lo puedes cambiar luego.'),
          h('div', { class: 'opciones' }, METAS.map(([v, t, d]) => op(datos.meta === v, () => { datos.meta = v; pintar(); }, h('b', null, t), ` · ${v} XP al día · ${d}`))));
      } else if (paso === 2) {
        listo = !!datos.plan;
        const momentos = ['con el café de la mañana', 'a la hora de comer', 'al salir del trabajo', 'después de cenar'];
        cuerpo = h('div', { class: 'pila', style: { gap: '1.1rem' } }, dice('pensando', 'Un truco que funciona: decidir antes en qué momento vas a practicar.'), h('h1', null, '¿Cuándo vas a practicar?'),
          h('div', { class: 'opciones' }, momentos.map((t) => op(datos.plan === t, () => { datos.plan = t; pintar(); }, t[0].toUpperCase() + t.slice(1)))),
          datos.plan ? h('aside', { class: 'aviso atajo' }, h('div', { class: 't' }, h('span', { class: 'etq' }, 'Tu plan')), h('p', null, `«Cada día, ${datos.plan}, abro Hoja a hoja y hago una lección.»`)) : null);
      } else if (paso === 3) {
        listo = datos.experiencia !== null;
        const ops = [['nunca', 'Nunca lo he usado, o casi nunca'], ['algo', 'Lo he usado para cosas sencillas (sumar, hacer listas)'], ['bastante', 'Lo uso a menudo y sé hacer fórmulas']];
        cuerpo = h('div', { class: 'pila', style: { gap: '1.1rem' } }, dice('normal', 'Sin vergüenza: aquí todo el mundo empieza por algún sitio.'), h('h1', null, '¿Has usado Excel alguna vez?'),
          h('div', { class: 'opciones' }, ops.map(([k, t]) => op(datos.experiencia === k, () => { datos.experiencia = k; pintar(); }, t))),
          datos.experiencia && datos.experiencia !== 'nunca' && D.prueba_nivel ? h('p', { class: 'tenue' }, 'Te propondremos una prueba de nivel de 15 minutos para saltarte lo que ya sabes.') : null);
      } else {
        cuerpo = h('div', { class: 'pila', style: { gap: '1.25rem', alignItems: 'center', textAlign: 'center' } }, dice('fiesta', `¡Ya eres del equipo, ${datos.nombre}!`, 'centrado'),
          h('h1', null, 'Aquí tienes tu tarjeta'), tarjetaEmpleada(),
          h('p', { class: 'entradilla' }, 'Tu puesto sube a medida que ganas experiencia: de recién llegada a responsable de informes.'));
      }
      btn.disabled = !listo;
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        if (paso === PASOS - 2) { // se guarda al terminar las preguntas y se celebra con la tarjeta
          P.nombre = datos.nombre; P.meta = datos.meta; P.plan = datos.plan; P.experiencia = datos.experiencia; P.bienvenida = hoy(); guardar();
          paso++; pintar(); sonidoFin(); confeti(); return;
        }
        if (paso < PASOS - 1) { paso++; pintar(); tono([[660, 0.08]]); return; }
        location.hash = P.experiencia && P.experiencia !== 'nunca' && D.prueba_nivel ? '#prueba' : (LECCIONES[0] ? '#jugar-' + LECCIONES[0].id : '#inicio');
      });
      const atras = paso > 0 && paso < PASOS - 1 ? h('button', { class: 'cerrar', type: 'button', 'aria-label': 'Volver al paso anterior', title: 'Atrás', onclick: () => { paso--; pintar(); } }, '←') : h('span');
      cont.replaceChildren(h('div', { class: 'jugar-cab' }, atras, prog, h('span')), cuerpo, h('div', { class: 'barra-continuar' }, h('div', { class: 'in' }, h('span'), btn)));
    }
    document.body.classList.add('jugando');
    pintar();
    vista().replaceChildren(cont);
  }

  /* ================= marco y router ================= */
  function pintarHUD(sube) {
    const r = rachaActual(); const hr = $('#hud-racha'); const hx = $('#hud-xp'); if (!hr || !hx) return;
    hr.querySelector('b').textContent = r; hr.classList.toggle('apagada', !xpHoy()); hr.title = r ? `${r} días seguidos practicando` : 'Practica hoy para empezar una racha';
    hx.querySelector('b').textContent = P.xp || 0;
    if (sube) { hx.classList.remove('sube'); void hx.offsetWidth; hx.classList.add('sube'); }
  }
  function pintarInsignias() {
    pintarHUD();
    const n = tarjetasPendientes().length;
    document.querySelectorAll('[data-insignia="repaso"]').forEach((el) => { el.textContent = n || ''; el.hidden = !n; });
  }
  const RUTAS = [
    [/^#?$|^#inicio$|^#mapa$/, () => (!P.bienvenida && !P.xp && !Object.keys(P.ej || {}).length ? vistaBienvenida() : vistaMapa()), 'inicio'],
    [/^#bienvenida$/, () => vistaBienvenida(), 'inicio'],
    [/^#cofre-([\w-]+)$/, (m) => vistaCofre(m[1]), 'inicio'],
    [/^#jugar-([\w-]+)$/, (m) => vistaJugar(m[1]), 'inicio'],
    [/^#examen-([\w-]+)$/, (m) => vistaExamenNivel(m[1]), 'inicio'],
    [/^#reto-([\w-]+)$/, (m) => vistaReto(m[1]), 'inicio'],
    [/^#perfil$/, () => vistaPerfil(), 'perfil'],
    [/^#entrenar$/, () => vistaEntrenar(), 'inicio'],
    [/^#metodo$/, () => vistaMetodo(), 'perfil'],
    [/^#certificado$/, () => vistaCertificado(), 'perfil'],
    [/^#ruta$/, () => vistaRuta(), 'ruta'],
    [/^#nivel-([\w-]+)$/, (m) => vistaNivel(m[1]), 'ruta'],
    [/^#leccion-([\w-]+)$/, (m) => vistaLeccion(m[1]), 'ruta'],
    [/^#repaso$/, () => vistaRepaso(), 'repaso'],
    [/^#hoja$/, () => vistaHojaLibre(), 'hoja'],
    [/^#consulta(?:-([\w]+))?$/, (m) => vistaConsulta(m[1]), 'consulta'],
    [/^#proyectos$/, () => vistaProyectos(), 'proyectos'],
    [/^#proyecto-([\w-]+)$/, (m) => vistaProyecto(m[1]), 'proyectos'],
    [/^#prueba$/, () => vistaPrueba(), 'inicio'],
    [/^#examen$/, () => vistaExamen(), 'proyectos'],
    [/^#progreso$/, () => vistaPerfil(), 'perfil'],
  ];
  function router() {
    const hs = location.hash || '#inicio';
    document.body.classList.remove('jugando'); escuchaEj = null; modoExamen = false; modoSesion = false;
    for (const [re, fn, sec] of RUTAS) {
      const m = hs.match(re);
      if (m) {
        document.querySelectorAll('[data-sec]').forEach((a) => { if (a.dataset.sec === sec) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
        try { fn(m); } catch (e) { console.error(e); vista().replaceChildren(h('div', { class: 'pila lectura' }, h('h1', null, 'Algo ha fallado al abrir esta página'), h('p', null, 'Vuelve a la portada e inténtalo de nuevo.'), h('a', { class: 'boton', href: '#inicio' }, 'Ir a la portada'))); }
        if (!/^#leccion/.test(hs)) window.scrollTo(0, 0);
        pintarInsignias();
        return;
      }
    }
    vistaMapa();
  }

  function montarMarco() {
    const enlaces = [['#inicio', 'Mapa', 'inicio'], ['#repaso', 'Repaso', 'repaso'], ['#hoja', 'Hoja libre', 'hoja'], ['#consulta', 'Consulta', 'consulta'], ['#perfil', 'Mi progreso', 'perfil']];
    const nav = h('nav', { class: 'nav', 'aria-label': 'Secciones' }, enlaces.map(([href, t, s]) => h('a', { href, 'data-sec': s }, t, s === 'repaso' ? h('span', { class: 'insignia', 'data-insignia': 'repaso', hidden: true }) : null)));
    const tutBtn = h('button', { class: 'boton peq boton-tutora', id: 'btn-tutora', type: 'button', hidden: true, onclick: () => { const p = $('#tutora'); if (p.hidden) abrirTutora(ctxTutora ? null : (leccionActual ? { tipo: 'leccion', leccion: { titulo: leccionActual.titulo, objetivo: leccionActual.objetivo, nivel: '' } } : { tipo: 'leccion', leccion: { titulo: 'general' } })); else p.hidden = true; } }, h('span', { 'aria-hidden': 'true' }, '✦'), h('span', { class: 'txt' }, ' Tutora'));
    const hud = h('div', { class: 'hud' }, h('a', { class: 'hud-item racha', id: 'hud-racha', href: '#perfil', style: { textDecoration: 'none' } }, icono('fuego'), h('b', null, '0'), h('span', { class: 'oculto-visual' }, ' días de racha')), h('a', { class: 'hud-item xp', id: 'hud-xp', href: '#perfil', style: { textDecoration: 'none' } }, icono('rayo'), h('b', null, '0'), h('span', { class: 'oculto-visual' }, ' puntos de experiencia')));
    const barra = h('header', { class: 'barra' }, h('div', { class: 'barra-in' }, h('a', { class: 'marca', href: '#inicio' }, h('span', { class: 'marca-celda', 'aria-hidden': 'true' }, 'A1'), 'Hoja a hoja'), nav, hud, tutBtn));
    const pestanas = h('nav', { class: 'pestanas', 'aria-label': 'Secciones' }, enlaces.map(([href, t, s]) => h('a', { href, 'data-sec': s }, t, s === 'repaso' ? h('span', { class: 'insignia', 'data-insignia': 'repaso', hidden: true }) : null)));
    const area = h('textarea', { 'aria-label': 'Escribe tu pregunta', placeholder: 'Pregunta lo que quieras sobre Excel…', rows: 2, id: 'tutora-texto' });
    const adj = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif', class: 'oculto-visual', id: 'tutora-img', onchange: (e) => { imagenesAdj = [...e.target.files].slice(0, 2); $('#tutora .adjunto').textContent = imagenesAdj.length ? `${imagenesAdj.length} imagen lista para enviar` : ''; } });
    const form = h('form', null, h('div', { class: 'sugerencias' }, ['Explícamelo más fácil', 'Ponme otro ejemplo', 'Hazme una pregunta para comprobar', 'Dame una pista'].map((s) => h('button', { type: 'button', onclick: () => enviarTutora(s) }, s))), area, h('div', { class: 'entre' }, h('span', null, h('label', { class: 'boton fantasma peq adjuntar', for: 'tutora-img', hidden: true }, 'Adjuntar captura'), adj, h('span', { class: 'adjunto' })), h('div', { class: 'fila' }, h('button', { class: 'boton fantasma peq', type: 'button', onclick: () => ctlTutora && ctlTutora.abort() }, 'Parar'), h('button', { class: 'boton primario peq', type: 'submit' }, 'Enviar'))));
    form.addEventListener('submit', (e) => { e.preventDefault(); const t = area.value; area.value = ''; enviarTutora(t); });
    area.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
    const panel = h('div', { class: 'tutora', id: 'tutora', hidden: true, role: 'dialog', 'aria-label': 'Tutora' }, h('div', { class: 'cab-t' }, h('b', null, 'Tutora'), h('button', { class: 'boton fantasma peq', type: 'button', 'aria-label': 'Cerrar', onclick: () => { $('#tutora').hidden = true; } }, 'Cerrar')), h('div', { class: 'mensajes', 'aria-live': 'polite' }), form);
    const pie = h('footer', { class: 'pie-pagina' }, h('span', null, 'Hoja a hoja · Excel para Microsoft 365 en español (es-ES). Capturas y nombres de menús pueden variar según tu versión.'), h('span', null, D.fecha ? 'Contenido revisado en ' + D.fecha : ''));
    document.body.prepend(barra);
    document.body.append(pestanas, panel, pie);
  }

  function cargarScript(src) {
    return new Promise((ok, mal) => { const s = document.createElement('script'); s.src = src; s.async = true; s.crossOrigin = 'anonymous'; s.onload = ok; s.onerror = mal; document.head.append(s); });
  }
  async function cargarMotor() {
    const listo = () => window.HyperFormula && window.HyperFormula.languages && window.HyperFormula.languages.esES;
    try {
      if (!window.HyperFormula) await cargarScript('https://cdn.jsdelivr.net/npm/hyperformula@3.5.0/dist/hyperformula.full.min.js');
      if (!listo()) await cargarScript('https://cdn.jsdelivr.net/npm/hyperformula@3.5.0/dist/languages/esES.js');
    } catch (e) { console.error('No se pudo cargar HyperFormula', e); }
    if (!listo()) return;
    try { M.preparar(window.HyperFormula, window.HyperFormula.languages.esES); HF = window.HyperFormula; } catch (e) { console.error(e); }
  }

  montarMarco();
  window.addEventListener('hashchange', router);
  cargarMotor().then(() => { router(); });
  router();
  iniciarCapacidades();
})();

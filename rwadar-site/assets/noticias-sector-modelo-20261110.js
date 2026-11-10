(function () { 'use strict'; const module={exports:{}};
'use strict';
/* ---------------------------------------------------------------------
   «Noticias del sector» en Inicio (10/11/2026)
   ---------------------------------------------------------------------
   Un solo motor para la web (assets/noticias-sector-modelo-20261110.js, copia
   exacta hecha por rwadar-app/noticias/copiar-modelo-web.cjs), la app y el
   generador de la web (rwadar-publicar.js valida con él /datos/noticias.json
   antes de publicar). Sin dependencias, sin red y sin Intl (Hermes).

   Datos: rwadar-site/datos/noticias.json, la selección verificada de cada
   ciclo de investigación. La web lo sirve en /datos/noticias.json y la app
   lo lee de https://rwadar.pages.dev/datos/noticias.json. Aquí no se escribe
   ninguna noticia: solo se comprueba la forma, se ordena (las de hoy
   primero) y se eligen los textos del idioma.

   Ilustraciones: dibujos propios, deterministas, uno por categoría
   (regulación, mercado, producto, riesgo) con el acento de su ámbito
   (España, UE, Mundo). Sin texto, logotipos, banderas ni personas, y sin
   fotos de prensa: no hay derechos y cargarlas de terceros filtraría la IP
   de quien mira. `ilustracion()` devuelve una descripción en datos que la
   web pinta con el DOM de SVG y la app con react-native-svg.
   --------------------------------------------------------------------- */
const RUTA = '/datos/noticias.json';
const URL_DATOS = 'https://rwadar.pages.dev/datos/noticias.json';
const MAX_NOTICIAS = 24;
const SECCIONES = Object.freeze(['hoy', 'importante']);
const CATEGORIAS = Object.freeze({
  regulacion: Object.freeze({ es: 'Regulación', en: 'Regulation', color: '#9B8CFF' }),
  mercado: Object.freeze({ es: 'Mercado', en: 'Market', color: '#32C9F5' }),
  producto: Object.freeze({ es: 'Producto', en: 'Product', color: '#4FE0B0' }),
  riesgo: Object.freeze({ es: 'Riesgo', en: 'Risk', color: '#FF8A80' }),
});
const AMBITOS = Object.freeze({
  'España': Object.freeze({ es: 'España', en: 'Spain', color: '#F2B23C' }),
  'UE': Object.freeze({ es: 'UE', en: 'EU', color: '#5B8CFF' }),
  'Mundo': Object.freeze({ es: 'Mundo', en: 'World', color: '#8FD8FF' }),
});
const TIPOS_FUENTE = Object.freeze(['regulador', 'empresa', 'organismo', 'medio']);
const MAX = Object.freeze({ titulo: 80, resumen: 320, porQueImporta: 240, tituloInformativo: 140, nombre: 220, url: 400, nota: 400 });
const MESES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ---- Forma ---- */
const esObjeto = v => v !== null && typeof v === 'object' && !Array.isArray(v);
function claves(obj, permitidas, obligatorias, donde) {
  if (!esObjeto(obj)) throw new Error(`${donde}: no es un objeto`);
  for (const k of Object.keys(obj)) if (!permitidas.includes(k)) throw new Error(`${donde}: forma inesperada («${k}»)`);
  for (const k of obligatorias) if (!Object.hasOwn(obj, k)) throw new Error(`${donde}: falta «${k}»`);
}
function fechaValida(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const d = new Date(valor + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor;
}
function fecha(valor, donde) {
  if (!fechaValida(valor)) throw new Error(`${donde}: fecha no válida`);
  return valor;
}
function texto(valor, donde, max) {
  if (typeof valor !== 'string' || !valor.trim()) throw new Error(`${donde}: falta el texto`);
  if (valor !== valor.trim()) throw new Error(`${donde}: espacios sobrantes`);
  if ([...valor].length > max) throw new Error(`${donde}: más de ${max} caracteres`);
  // Se pinta siempre como texto, pero un < o un > en una noticia es un error.
  if (/[<>\u0000-\u001f\u007f\u2028\u2029]/.test(valor)) throw new Error(`${donde}: caracteres no permitidos`);
  return valor;
}
function urlFuente(valor, donde) {
  texto(valor, donde, MAX.url);
  // Solo https, con servidor y sin usuario ni contraseña: el enlace sale de RWAdar.
  if (!/^https:\/\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+(?::\d{2,5})?(?:[/?#][^\s"'\\]*)?$/i.test(valor)) {
    throw new Error(`${donde}: el enlace no es https`);
  }
  return valor;
}
function validarNoticia(n, i, actualizadoEl) {
  const donde = `noticia ${i + 1}`;
  claves(n, ['id', 'fecha', 'seccion', 'categoria', 'ambito', 'titulo', 'resumen', 'porQueImporta', 'en', 'fuente', 'consultadaEl',
    'tituloInformativo'], ['id', 'fecha', 'seccion', 'categoria', 'ambito', 'titulo', 'resumen', 'porQueImporta', 'en', 'fuente', 'consultadaEl'], donde);
  if (typeof n.id !== 'string' || n.id.length > 80 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(n.id)) throw new Error(`${donde}: id no válido`);
  const salida = { id: n.id };
  salida.fecha = fecha(n.fecha, `${donde}, fecha`);
  salida.consultadaEl = fecha(n.consultadaEl, `${donde}, consultadaEl`);
  if (salida.fecha > actualizadoEl || salida.consultadaEl > actualizadoEl) throw new Error(`${donde}: fecha posterior a la actualización`);
  if (salida.consultadaEl < salida.fecha) throw new Error(`${donde}: consultada antes de su fecha`);
  if (!SECCIONES.includes(n.seccion)) throw new Error(`${donde}: sección desconocida`);
  if (!Object.hasOwn(CATEGORIAS, n.categoria)) throw new Error(`${donde}: categoría desconocida`);
  if (!Object.hasOwn(AMBITOS, n.ambito)) throw new Error(`${donde}: ámbito desconocido`);
  salida.seccion = n.seccion; salida.categoria = n.categoria; salida.ambito = n.ambito;
  salida.titulo = texto(n.titulo, `${donde}, titulo`, MAX.titulo);
  salida.resumen = texto(n.resumen, `${donde}, resumen`, MAX.resumen);
  salida.porQueImporta = texto(n.porQueImporta, `${donde}, porQueImporta`, MAX.porQueImporta);
  if (n.tituloInformativo !== undefined) salida.tituloInformativo = texto(n.tituloInformativo, `${donde}, tituloInformativo`, MAX.tituloInformativo);
  claves(n.en, ['titulo', 'resumen', 'porQueImporta', 'tituloInformativo'], ['titulo', 'resumen', 'porQueImporta'], `${donde}, en`);
  salida.en = {
    titulo: texto(n.en.titulo, `${donde}, en.titulo`, MAX.titulo),
    resumen: texto(n.en.resumen, `${donde}, en.resumen`, MAX.resumen),
    porQueImporta: texto(n.en.porQueImporta, `${donde}, en.porQueImporta`, MAX.porQueImporta),
  };
  if (n.en.tituloInformativo !== undefined) salida.en.tituloInformativo = texto(n.en.tituloInformativo, `${donde}, en.tituloInformativo`, MAX.tituloInformativo);
  claves(n.fuente, ['nombre', 'url', 'tipo'], ['nombre', 'url', 'tipo'], `${donde}, fuente`);
  if (!TIPOS_FUENTE.includes(n.fuente.tipo)) throw new Error(`${donde}: tipo de fuente desconocido`);
  salida.fuente = { nombre: texto(n.fuente.nombre, `${donde}, fuente.nombre`, MAX.nombre), url: urlFuente(n.fuente.url, `${donde}, fuente.url`), tipo: n.fuente.tipo };
  return salida;
}

/* Comprueba el archivo entero y devuelve una copia limpia: las de hoy
   primero y, dentro de cada sección, de la más nueva a la más antigua (a
   igual fecha, en el orden del archivo). Lanza un error si algo no cuadra. */
function validarNoticias(datos) {
  claves(datos, ['version', 'actualizadoEl', 'nota', 'noticias'], ['version', 'actualizadoEl', 'noticias'], 'noticias.json');
  if (datos.version !== 1) throw new Error('noticias.json: versión desconocida');
  const actualizadoEl = fecha(datos.actualizadoEl, 'noticias.json, actualizadoEl');
  if (datos.nota !== undefined) texto(datos.nota, 'noticias.json, nota', MAX.nota);
  if (!Array.isArray(datos.noticias) || !datos.noticias.length || datos.noticias.length > MAX_NOTICIAS) {
    throw new Error(`noticias.json: entre 1 y ${MAX_NOTICIAS} noticias`);
  }
  const vistas = new Set();
  const noticias = datos.noticias.map((n, i) => {
    const limpia = validarNoticia(n, i, actualizadoEl);
    if (vistas.has(limpia.id)) throw new Error(`noticia ${i + 1}: id repetido`);
    vistas.add(limpia.id);
    return { limpia, i };
  }).sort((a, b) => (SECCIONES.indexOf(a.limpia.seccion) - SECCIONES.indexOf(b.limpia.seccion)) ||
    (a.limpia.fecha < b.limpia.fecha ? 1 : a.limpia.fecha > b.limpia.fecha ? -1 : 0) || a.i - b.i).map(x => x.limpia);
  return { version: 1, actualizadoEl, ...(datos.nota !== undefined ? { nota: datos.nota } : {}), noticias };
}
function noticiasValidas(datos) {
  try { validarNoticias(datos); return true; } catch { return false; }
}

/* ---- Textos del idioma elegido ---- */
function textos(n, idioma = 'es') {
  const en = idioma === 'en' && n.en ? n.en : null;
  return {
    titulo: en ? en.titulo : n.titulo,
    resumen: en ? en.resumen : n.resumen,
    porQueImporta: en ? en.porQueImporta : n.porQueImporta,
    tituloInformativo: (en ? en.tituloInformativo : n.tituloInformativo) || null,
  };
}
const etiquetaCategoria = (c, idioma = 'es') => CATEGORIAS[c]?.[idioma === 'en' ? 'en' : 'es'] || '';
const etiquetaAmbito = (a, idioma = 'es') => AMBITOS[a]?.[idioma === 'en' ? 'en' : 'es'] || '';
// «10/11/2026» o «10 Nov 2026».
function fechaCorta(iso, idioma = 'es') {
  if (!fechaValida(iso)) return '';
  const [a, m, d] = iso.split('-');
  return idioma === 'en' ? `${Number(d)} ${MESES_EN[Number(m) - 1]} ${a}` : `${d}/${m}/${a}`;
}
// «10/11» o «10 Nov».
function fechaBreve(iso, idioma = 'es') {
  if (!fechaValida(iso)) return '';
  const [, m, d] = iso.split('-');
  return idioma === 'en' ? `${Number(d)} ${MESES_EN[Number(m) - 1]}` : `${d}/${m}`;
}

/* ---- Ilustraciones ---- */
/* Mezcla dos colores #RRGGBB (t = 0, el primero; t = 1, el segundo). */
function mezclar(a, b, t) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
/* Azar con semilla (FNV-1a + mulberry32): la misma noticia, el mismo dibujo. */
function azar(semilla) {
  let h = 2166136261;
  for (const c of String(semilla)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return () => {
    h = (h + 0x6D2B79F5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r1 = n => Math.round(n * 10) / 10;
const ANCHO = 320, ALTO = 400;
const FONDO = '#0B0A0A', TINTA = '#F7F5F0';

function motivoAmbito(ambito, color, cx, cy, rnd, f) {
  if (ambito === 'Mundo') {
    // Un globo de meridianos y paralelos, sin continentes ni banderas.
    const R = 96;
    f.push({ el: 'circle', a: { cx, cy, r: R, fill: 'none', stroke: color, strokeOpacity: 0.5, strokeWidth: 1.5 } });
    for (const k of [0.32, 0.68]) f.push({ el: 'ellipse', a: { cx, cy, rx: r1(R * k), ry: R, fill: 'none', stroke: color, strokeOpacity: 0.3, strokeWidth: 1 } });
    f.push({ el: 'ellipse', a: { cx, cy, rx: R, ry: r1(R * 0.3), fill: 'none', stroke: color, strokeOpacity: 0.3, strokeWidth: 1 } });
    for (const dy of [-0.62, 0.62]) {
      const y = cy + R * dy, w = R * Math.sqrt(1 - dy * dy);
      f.push({ el: 'line', a: { x1: r1(cx - w), y1: r1(y), x2: r1(cx + w), y2: r1(y), stroke: color, strokeOpacity: 0.26, strokeWidth: 1 } });
    }
    f.push({ el: 'ellipse', a: { cx, cy, rx: R + 26, ry: r1((R + 26) * 0.26), fill: 'none', stroke: color, strokeOpacity: 0.4, strokeWidth: 1.2, strokeDasharray: '2 6', strokeLinecap: 'round' } });
  } else if (ambito === 'UE') {
    // Una red de nodos enlazados: plataformas que se conectan. Ni estrellas ni círculo de doce.
    const n = 8, nodos = [];
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + rnd() * 0.5 - 0.25;
      const rad = 0.78 + rnd() * 0.3;
      nodos.push([r1(cx + Math.cos(ang) * 122 * rad), r1(cy + Math.sin(ang) * 92 * rad)]);
    }
    const enlaces = nodos.map((p, i) => [p, nodos[(i + 1) % n]]).concat([[nodos[0], nodos[3]], [nodos[2], nodos[6]], [nodos[5], nodos[1]]]);
    f.push({ el: 'path', a: { d: enlaces.map(([a, b]) => `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`).join(''), fill: 'none', stroke: color, strokeOpacity: 0.32, strokeWidth: 1.2 } });
    nodos.forEach((p, i) => {
      const r = i % 3 === 0 ? 5 : 3.2;
      f.push({ el: 'circle', a: { cx: p[0], cy: p[1], r: r * 2.6, fill: color, fillOpacity: 0.14 } });
      f.push({ el: 'circle', a: { cx: p[0], cy: p[1], r, fill: color, fillOpacity: 0.9 } });
    });
  } else {
    // España: los anillos y el barrido del radar de RWAdar, en ámbar.
    for (const [r, o] of [[70, 0.34], [108, 0.24], [146, 0.16], [184, 0.1]]) {
      f.push({ el: 'circle', a: { cx, cy, r, fill: 'none', stroke: color, strokeOpacity: o, strokeWidth: 1.2, ...(r === 146 ? { strokeDasharray: '3 7', strokeLinecap: 'round' } : {}) } });
    }
    const a0 = -2.2 + rnd() * 0.6, a1 = a0 + 0.75, R = 184;
    f.push({ el: 'path', a: { d: `M${cx} ${cy}L${r1(cx + Math.cos(a0) * R)} ${r1(cy + Math.sin(a0) * R)}A${R} ${R} 0 0 1 ${r1(cx + Math.cos(a1) * R)} ${r1(cy + Math.sin(a1) * R)}Z`,
      fill: `url(#${f.id}-barrido)` } });
    f.push({ el: 'line', a: { x1: cx, y1: cy, x2: r1(cx + Math.cos(a1) * R), y2: r1(cy + Math.sin(a1) * R), stroke: color, strokeOpacity: 0.55, strokeWidth: 1.5, strokeLinecap: 'round' } });
  }
}

function motivoCategoria(categoria, color, cx, cy, rnd, f) {
  const claro = mezclar(color, TINTA, 0.45), oscuro = mezclar(color, FONDO, 0.55), sombra = mezclar(color, FONDO, 0.78);
  if (categoria === 'regulacion') {
    // Una institución: frontón, cuatro columnas y escalones.
    const top = cy - 92;
    f.push({ el: 'path', a: { d: `M${cx - 92} ${top + 46}L${cx} ${top}L${cx + 92} ${top + 46}Z`, fill: `url(#${f.id}-cuerpo)` } });
    f.push({ el: 'circle', a: { cx, cy: top + 30, r: 7, fill: sombra, fillOpacity: 0.7 } });
    f.push({ el: 'rect', a: { x: cx - 96, y: top + 50, width: 192, height: 12, rx: 3, fill: claro, fillOpacity: 0.9 } });
    for (const dx of [-74, -32, 14, 56]) {
      f.push({ el: 'rect', a: { x: cx + dx, y: top + 68, width: 18, height: 96, rx: 3, fill: `url(#${f.id}-cuerpo)` } });
      f.push({ el: 'rect', a: { x: cx + dx + 3, y: top + 72, width: 3, height: 88, rx: 1.5, fill: TINTA, fillOpacity: 0.22 } });
    }
    f.push({ el: 'rect', a: { x: cx - 102, y: top + 168, width: 204, height: 10, rx: 3, fill: claro, fillOpacity: 0.75 } });
    f.push({ el: 'rect', a: { x: cx - 114, y: top + 182, width: 228, height: 10, rx: 3, fill: oscuro, fillOpacity: 0.9 } });
  } else if (categoria === 'mercado') {
    // Barras que suben y la línea de tendencia con su punto final.
    const n = 7, base = cy + 92, ancho = 22, paso = 32, x0 = cx - ((n - 1) * paso) / 2 - ancho / 2;
    const tops = [];
    for (let i = 0; i < n; i++) {
      const h = 46 + i * 15 + rnd() * 26;
      const x = x0 + i * paso, y = r1(base - h);
      tops.push([r1(x + ancho / 2), y]);
      f.push({ el: 'rect', a: { x: r1(x), y, width: ancho, height: r1(h), rx: 5, fill: `url(#${f.id}-cuerpo)`, fillOpacity: 0.55 + i * 0.06 } });
    }
    f.push({ el: 'line', a: { x1: cx - 128, y1: base + 4, x2: cx + 128, y2: base + 4, stroke: TINTA, strokeOpacity: 0.16, strokeWidth: 1 } });
    const linea = tops.map(([x, y]) => `${x},${r1(y - 18)}`).join(' ');
    f.push({ el: 'polyline', a: { points: linea, fill: 'none', stroke: claro, strokeOpacity: 0.35, strokeWidth: 9, strokeLinejoin: 'round', strokeLinecap: 'round' } });
    f.push({ el: 'polyline', a: { points: linea, fill: 'none', stroke: claro, strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' } });
    const [ux, uy] = tops[n - 1];
    f.push({ el: 'circle', a: { cx: ux, cy: r1(uy - 18), r: 15, fill: claro, fillOpacity: 0.22 } });
    f.push({ el: 'circle', a: { cx: ux, cy: r1(uy - 18), r: 6, fill: TINTA } });
  } else if (categoria === 'producto') {
    // Tres fichas apiladas (tokens) y una pequeña que flota.
    const rx = 80, ry = 24, grosor = 16;
    for (const dy of [56, 22, -12]) {
      const y = cy + dy;
      f.push({ el: 'path', a: { d: `M${cx - rx} ${y}L${cx - rx} ${y + grosor}A${rx} ${ry} 0 0 0 ${cx + rx} ${y + grosor}L${cx + rx} ${y}Z`, fill: oscuro } });
      f.push({ el: 'ellipse', a: { cx, cy: y, rx, ry, fill: `url(#${f.id}-cuerpo)` } });
      f.push({ el: 'ellipse', a: { cx, cy: y, rx: 52, ry: 15, fill: 'none', stroke: sombra, strokeOpacity: 0.55, strokeWidth: 2 } });
      f.push({ el: 'ellipse', a: { cx, cy: y, rx: 22, ry: 6.5, fill: TINTA, fillOpacity: 0.18 } });
    }
    const hx = r1(cx + 84 + rnd() * 10), hy = r1(cy - 72 + rnd() * 10), hr = 18;
    const hex = [0, 1, 2, 3, 4, 5].map(k => `${r1(hx + Math.cos(Math.PI / 6 + (k * Math.PI) / 3) * hr)},${r1(hy + Math.sin(Math.PI / 6 + (k * Math.PI) / 3) * hr)}`).join(' ');
    f.push({ el: 'polygon', a: { points: hex, fill: color, fillOpacity: 0.22, stroke: claro, strokeWidth: 1.5, strokeLinejoin: 'round' } });
    for (const [dx, dy, r] of [[-104, -58, 3], [-86, -84, 2], [110, 10, 2.5]]) f.push({ el: 'circle', a: { cx: cx + dx, cy: cy + dy, r, fill: claro, fillOpacity: 0.8 } });
  } else {
    // Riesgo: un escudo agrietado entre ondas de alarma.
    for (const [r, o] of [[118, 0.28], [150, 0.16]]) f.push({ el: 'circle', a: { cx, cy: cy - 6, r, fill: 'none', stroke: color, strokeOpacity: o, strokeWidth: 1.4, strokeDasharray: '4 8', strokeLinecap: 'round' } });
    const t = cy - 88, b = cy + 96;
    const escudo = (m) => `M${cx} ${t + m}C${cx + 40 - m} ${t + 16 + m} ${cx + 66 - m} ${t + 20 + m} ${cx + 78 - m} ${t + 22 + m}L${cx + 78 - m} ${cy + 4}` +
      `C${cx + 78 - m} ${cy + 50} ${cx + 44 - m} ${b - 22} ${cx} ${b - m}C${cx - 44 + m} ${b - 22} ${cx - 78 + m} ${cy + 50} ${cx - 78 + m} ${cy + 4}` +
      `L${cx - 78 + m} ${t + 22 + m}C${cx - 66 + m} ${t + 20 + m} ${cx - 40 + m} ${t + 16 + m} ${cx} ${t + m}Z`;
    f.push({ el: 'path', a: { d: escudo(0), fill: `url(#${f.id}-cuerpo)` } });
    f.push({ el: 'path', a: { d: escudo(12), fill: 'none', stroke: TINTA, strokeOpacity: 0.18, strokeWidth: 1.5 } });
    const grieta = [[cx + 2, t + 4]];
    let x = cx + 2;
    for (let y = t + 30; y < b - 8; y += 26) { x = cx + (grieta.length % 2 ? -1 : 1) * (8 + rnd() * 14); grieta.push([r1(x), y]); }
    grieta.push([cx - 3, b - 4]);
    const pts = grieta.map(p => p.join(',')).join(' ');
    f.push({ el: 'polyline', a: { points: pts, fill: 'none', stroke: FONDO, strokeOpacity: 0.85, strokeWidth: 5, strokeLinejoin: 'miter', strokeLinecap: 'round' } });
    f.push({ el: 'polyline', a: { points: pts, fill: 'none', stroke: claro, strokeOpacity: 0.7, strokeWidth: 1.2, strokeLinejoin: 'miter' } });
    for (const [dx, dy, s] of [[-104, -40, 9], [98, -62, 7], [112, 30, 6]]) {
      f.push({ el: 'polygon', a: { points: `${cx + dx},${cy + dy - s} ${cx + dx + s},${cy + dy + s} ${cx + dx - s},${cy + dy + s * 0.6}`, fill: color, fillOpacity: 0.5 } });
    }
  }
}

/* La ilustración de una noticia: { id, ancho, alto, defs, formas }. Cada
   elemento es { el, a } (y { stops } en los degradados), con nombres de
   atributo en camelCase, como react-native-svg; la web los pasa a SVG.
   Con velo: true, un degradado oscuro abajo para leer el titular encima. */
function ilustracion(noticia, { velo = false, prefijo = 'nt' } = {}) {
  const cat = CATEGORIAS[noticia?.categoria] ? noticia.categoria : 'mercado';
  const amb = AMBITOS[noticia?.ambito] ? noticia.ambito : 'Mundo';
  const color = CATEGORIAS[cat].color, acento = AMBITOS[amb].color;
  const rnd = azar(`${noticia?.id || ''}|${cat}|${amb}`);
  const id = `${prefijo}-${String(noticia?.id || 'x').replace(/[^a-z0-9-]/gi, '')}`;
  const cx = r1(160 + (rnd() - 0.5) * 16), cy = r1(142 + (rnd() - 0.5) * 12);
  const esquina = rnd() < 0.5 ? 0.12 : 0.88;
  const defs = [
    { el: 'linearGradient', a: { id: `${id}-fondo`, x1: 0, y1: 0, x2: 0, y2: 1 },
      stops: [{ offset: 0, color: mezclar(FONDO, color, 0.2), opacity: 1 }, { offset: 0.65, color: mezclar(FONDO, color, 0.06), opacity: 1 }, { offset: 1, color: FONDO, opacity: 1 }] },
    { el: 'radialGradient', a: { id: `${id}-halo`, cx: r1(cx / ANCHO * 100) / 100, cy: r1(cy / ALTO * 100) / 100, r: 0.62 },
      stops: [{ offset: 0, color, opacity: 0.42 }, { offset: 0.55, color, opacity: 0.1 }, { offset: 1, color, opacity: 0 }] },
    { el: 'radialGradient', a: { id: `${id}-acento`, cx: esquina, cy: 0.06, r: 0.7 },
      stops: [{ offset: 0, color: acento, opacity: 0.34 }, { offset: 1, color: acento, opacity: 0 }] },
    { el: 'linearGradient', a: { id: `${id}-cuerpo`, x1: 0, y1: 0, x2: 0, y2: 1 },
      stops: [{ offset: 0, color: mezclar(color, TINTA, 0.22), opacity: 1 }, { offset: 1, color: mezclar(color, FONDO, 0.5), opacity: 1 }] },
    { el: 'linearGradient', a: { id: `${id}-barrido`, x1: 0, y1: 0, x2: 1, y2: 1 },
      stops: [{ offset: 0, color: acento, opacity: 0.2 }, { offset: 1, color: acento, opacity: 0 }] },
  ];
  const formas = [];
  formas.id = id;
  formas.push({ el: 'rect', a: { x: 0, y: 0, width: ANCHO, height: ALTO, fill: `url(#${id}-fondo)` } });
  formas.push({ el: 'rect', a: { x: 0, y: 0, width: ANCHO, height: ALTO, fill: `url(#${id}-acento)` } });
  // Una rejilla finísima, como la del radar.
  let rejilla = '';
  for (let x = 32; x < ANCHO; x += 32) rejilla += `M${x} 0V${ALTO}`;
  for (let y = 32; y < ALTO; y += 32) rejilla += `M0 ${y}H${ANCHO}`;
  formas.push({ el: 'path', a: { d: rejilla, fill: 'none', stroke: TINTA, strokeOpacity: 0.04, strokeWidth: 1 } });
  formas.push({ el: 'rect', a: { x: 0, y: 0, width: ANCHO, height: ALTO, fill: `url(#${id}-halo)` } });
  motivoAmbito(amb, acento, cx, cy, rnd, formas);
  motivoCategoria(cat, color, cx, cy, rnd, formas);
  if (velo) {
    defs.push({ el: 'linearGradient', a: { id: `${id}-velo`, x1: 0, y1: 0, x2: 0, y2: 1 },
      stops: [{ offset: 0, color: FONDO, opacity: 0 }, { offset: 0.4, color: FONDO, opacity: 0 }, { offset: 0.62, color: FONDO, opacity: 0.8 }, { offset: 1, color: FONDO, opacity: 0.97 }] });
    formas.push({ el: 'rect', a: { x: 0, y: 0, width: ANCHO, height: ALTO, fill: `url(#${id}-velo)` } });
  }
  return { id, ancho: ANCHO, alto: ALTO, defs, formas: formas.slice() };
}

module.exports = { RUTA, URL_DATOS, MAX_NOTICIAS, SECCIONES, CATEGORIAS, AMBITOS, TIPOS_FUENTE, MAX, validarNoticias, noticiasValidas,
  textos, etiquetaCategoria, etiquetaAmbito, fechaCorta, fechaBreve, ilustracion, mezclar };

window.RWAdarNoticiasModelo=module.exports; })();

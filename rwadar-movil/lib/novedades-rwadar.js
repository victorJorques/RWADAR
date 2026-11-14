'use strict';
/* ---------------------------------------------------------------------
   «Novedades de RWAdar» en la app (12/11/2026)
   ---------------------------------------------------------------------
   Encargo: «que salga al abrir la app y como las novedades, tipo un texto
   informativo muy fácil de leer con las novedades y si clickan que salga en
   detalle». Una sola fuente para la web y la app:
   rwadar-site/datos/novedades-producto.json, que la web sirve en
   https://rwadar.pages.dev/datos/novedades-producto.json. La app lo lee de
   ahí sin cookies, sin sesión y sin datos del usuario (6 s como mucho) y
   trae una copia idéntica (lib/novedades-producto.js) para verlo sin red y
   antes de la primera descarga. Si las dos valen, gana la más nueva.

   Forma, estricta (una clave de más o de menos, un texto vacío, largo o con
   < >, más de 32 KB o algo que no sea JSON, y se usa la copia incluida):
     { version: 'AAAA-MM-DD' (o 'AAAA-MM-DD.N' si hay otra el mismo día),
       titulo, en: { titulo },
       resumen: [1-6 × { id, icono, titulo, texto, en: { titulo, texto } }],
       detalle: [1-10 × { id, titulo, parrafos: [1-8], pasos: [0-8],
                          en: { titulo, parrafos, pasos } }] }
   El inglés va en «en» de cada elemento, como en noticias-v2.json, con los
   mismos párrafos y pasos que el castellano. «icono» es una clave en
   minúsculas (notificacion, contador, sesion, correo, calculadora, grafico, noticias): una
   desconocida se pinta con el icono genérico, sin rechazar el archivo.
   Los límites y el orden de las versiones son los del modelo de la web
   (rwadar-site/assets/novedades-producto-modelo-20261112.js): lo que la web
   publica, la app lo acepta.

   Qué versión se ha visto ya se guarda en el móvil (lib/datos.js,
   leerNovedadesVistas y marcarNovedadesVistas). Sin red ni almacenamiento:
   aquí solo se valida, se compara y se eligen los textos del idioma.
   --------------------------------------------------------------------- */
const { NOVEDADES_PRODUCTO } = require('./novedades-producto');

const URL_NOVEDADES_PRODUCTO = 'https://rwadar.pages.dev/datos/novedades-producto.json';
const PLAZO_MS = 6000;
// La web no publica más de 32 KB; en caracteres nunca pasa de ahí.
const MAX_CARACTERES = 32 * 1024;
const MAX = Object.freeze({ titulo: 80, puntoTitulo: 60, puntoTexto: 120, detalleTitulo: 100, parrafo: 420, paso: 220 });
const LIMITES = Object.freeze({ resumen: [1, 6], detalle: [1, 10], parrafos: [1, 8], pasos: [0, 8] });
const VERSION = /^(\d{4}-\d{2}-\d{2})(?:\.(\d{1,2}))?$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ICONO = /^[a-z]{1,24}$/;
const MESES = Object.freeze({
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
});

const esObjeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
function claves(obj, permitidas, donde) {
  if (!esObjeto(obj)) throw new Error(`${donde}: no es un objeto`);
  for (const k of Object.keys(obj)) if (!permitidas.includes(k)) throw new Error(`${donde}: forma inesperada («${k}»)`);
  for (const k of permitidas) if (!Object.hasOwn(obj, k)) throw new Error(`${donde}: falta «${k}»`);
}
function texto(valor, donde, max) {
  if (typeof valor !== 'string' || !valor.trim()) throw new Error(`${donde}: falta el texto`);
  if (valor !== valor.trim()) throw new Error(`${donde}: espacios sobrantes`);
  if (valor.length > max) throw new Error(`${donde}: más de ${max} caracteres`);
  // Se pinta siempre como texto; aun así, un < o un > (o un salto de línea) es un error.
  if (/[<>\u0000-\u001f\u007f\u2028\u2029]/.test(valor)) throw new Error(`${donde}: caracteres no permitidos`);
  return valor;
}
function lista(valor, [minimo, maximo], donde) {
  if (!Array.isArray(valor) || valor.length < minimo || valor.length > maximo) throw new Error(`${donde}: entre ${minimo} y ${maximo}`);
  return valor;
}
function textos(valor, limites, max, donde) {
  return lista(valor, limites, donde).map((t, i) => texto(t, `${donde} ${i + 1}`, max));
}
function identificador(valor, vistos, donde) {
  if (typeof valor !== 'string' || valor.length > 40 || !ID.test(valor)) throw new Error(`${donde}: id no válido`);
  if (vistos.has(valor)) throw new Error(`${donde}: id repetido`);
  vistos.add(valor);
  return valor;
}

/* «2026-11-12», o «2026-11-12.2» para otra del mismo día; la fecha tiene
   que existir y ser de 2026 en adelante. */
function versionValida(valor) {
  const m = typeof valor === 'string' ? VERSION.exec(valor) : null;
  if (!m || Number(m[1].slice(0, 4)) < 2026) return false;
  const d = new Date(m[1] + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === m[1];
}
/* Negativo si «a» es anterior a «b», cero si son la misma, positivo si es posterior. */
function compararVersiones(a, b) {
  const [, fa, na] = VERSION.exec(a) || [];
  const [, fb, nb] = VERSION.exec(b) || [];
  if (!fa || !fb) throw new Error('versión de novedades no válida');
  if (fa !== fb) return fa < fb ? -1 : 1;
  return Number(na || 0) - Number(nb || 0);
}
/* ¿Hay que enseñarlas? Solo si no se ha visto ninguna o la vista es anterior:
   sin red, la copia incluida (más vieja) nunca vuelve a salir. */
function hayNovedadesSinVer(datos, vista) {
  if (!datos || !versionValida(datos.version)) return false;
  return !versionValida(vista) || compararVersiones(datos.version, vista) > 0;
}

/* El recuadro «Activa los avisos» de la ventana (14/11/2026). Encargo: «que
   para activar las notificaciones salga el aviso al salir la notificación de
   novedades al entrar a la app, para recordar e incitar a la gente a que las
   activen». Sale salvo que las notificaciones ya estén activas en ESTE móvil,
   como lo enseña el interruptor «Notificaciones en este móvil» de Perfil ›
   Avisos (useAvisosNovedades: movil.activo, de lib/avisos-cuenta.js). Con el
   permiso quitado en los ajustes del móvil ('sin-permiso') no llegan, así que
   también se recuerda. Recibe lo que devuelve useAvisosNovedades y dice
   'activos', 'inactivos', 'comprobando' (aún no se sabe: la ventana espera un
   poco) o 'desconocido' (sin cuenta o con un error: sale, mejor recordar). */
function estadoAvisosMovil(avisos) {
  if (!avisos || avisos.activo !== true) return 'desconocido';
  const movil = avisos.movil;
  if (esObjeto(movil)) return movil.activo === true && movil.estado !== 'sin-permiso' ? 'activos' : 'inactivos';
  return avisos.errorCarga ? 'desconocido' : 'comprobando';
}
/* ¿Sale el recuadro? Siempre, salvo con las notificaciones activas en este
   móvil o con los avisos apagados en la app ('apagados': no hay Perfil ›
   Avisos al que llevar). */
const conRecordatorioAvisos = (estado) => estado !== 'activos' && estado !== 'apagados';

/* Comprueba el archivo entero y devuelve una copia limpia. Lanza si algo no cuadra. */
function validarNovedadesProducto(datos) {
  claves(datos, ['version', 'titulo', 'en', 'resumen', 'detalle'], 'novedades');
  if (!versionValida(datos.version)) throw new Error('novedades: versión no válida');
  claves(datos.en, ['titulo'], 'novedades, en');
  const salida = {
    version: datos.version,
    titulo: texto(datos.titulo, 'novedades, titulo', MAX.titulo),
    en: { titulo: texto(datos.en.titulo, 'novedades, en.titulo', MAX.titulo) },
  };
  const idsResumen = new Set();
  salida.resumen = lista(datos.resumen, LIMITES.resumen, 'resumen').map((p, i) => {
    const donde = `resumen ${i + 1}`;
    claves(p, ['id', 'icono', 'titulo', 'texto', 'en'], donde);
    if (typeof p.icono !== 'string' || !ICONO.test(p.icono)) throw new Error(`${donde}: icono no válido`);
    claves(p.en, ['titulo', 'texto'], `${donde}, en`);
    return {
      id: identificador(p.id, idsResumen, donde), icono: p.icono,
      titulo: texto(p.titulo, `${donde}, titulo`, MAX.puntoTitulo), texto: texto(p.texto, `${donde}, texto`, MAX.puntoTexto),
      en: { titulo: texto(p.en.titulo, `${donde}, en.titulo`, MAX.puntoTitulo), texto: texto(p.en.texto, `${donde}, en.texto`, MAX.puntoTexto) },
    };
  });
  const idsDetalle = new Set();
  salida.detalle = lista(datos.detalle, LIMITES.detalle, 'detalle').map((d, i) => {
    const donde = `detalle ${i + 1}`;
    claves(d, ['id', 'titulo', 'parrafos', 'pasos', 'en'], donde);
    claves(d.en, ['titulo', 'parrafos', 'pasos'], `${donde}, en`);
    const seccion = {
      id: identificador(d.id, idsDetalle, donde),
      titulo: texto(d.titulo, `${donde}, titulo`, MAX.detalleTitulo),
      parrafos: textos(d.parrafos, LIMITES.parrafos, MAX.parrafo, `${donde}, párrafo`),
      pasos: textos(d.pasos, LIMITES.pasos, MAX.paso, `${donde}, paso`),
      en: {
        titulo: texto(d.en.titulo, `${donde}, en.titulo`, MAX.detalleTitulo),
        parrafos: textos(d.en.parrafos, LIMITES.parrafos, MAX.parrafo, `${donde}, en.párrafo`),
        pasos: textos(d.en.pasos, LIMITES.pasos, MAX.paso, `${donde}, en.paso`),
      },
    };
    // El inglés dice lo mismo: ni un párrafo ni un paso de más o de menos.
    if (seccion.en.parrafos.length !== seccion.parrafos.length || seccion.en.pasos.length !== seccion.pasos.length) {
      throw new Error(`${donde}: el inglés no tiene los mismos párrafos y pasos`);
    }
    return seccion;
  });
  return salida;
}
function novedadesValidas(datos) {
  try { return validarNovedadesProducto(datos); } catch { return null; }
}

// La copia incluida en la app; si no valiera, las pruebas lo dicen antes de publicar.
const RESPALDO = validarNovedadesProducto(NOVEDADES_PRODUCTO);

/* Lo que pinta la pantalla, en el idioma elegido (castellano si no es 'en'). */
function textosNovedades(datos, idioma = 'es') {
  const n = datos || RESPALDO;
  const en = idioma === 'en';
  const [a, m, d] = n.version.slice(0, 10).split('-').map(Number);
  return {
    version: n.version,
    lengua: en ? 'en' : 'es-ES',
    titulo: en ? n.en.titulo : n.titulo,
    fecha: en ? `${d} ${MESES.en[m - 1]} ${a}` : `${d} de ${MESES.es[m - 1]} de ${a}`,
    resumen: n.resumen.map((p) => ({ id: p.id, icono: p.icono, titulo: en ? p.en.titulo : p.titulo, texto: en ? p.en.texto : p.texto })),
    detalle: n.detalle.map((s) => ({ id: s.id, ...(en ? s.en : { titulo: s.titulo, parrafos: s.parrafos, pasos: s.pasos }) })),
  };
}

/* Descarga el JSON de la web y lo compara con la copia incluida. Nunca
   lanza: con cualquier fallo (sin red, plazo vencido, HTML, demasiado
   grande o forma rara) devuelve la copia incluida. */
async function cargarNovedadesProducto({ fetchImpl = (...args) => fetch(...args), plazoMs = PLAZO_MS, respaldo = RESPALDO } = {}) {
  const abort = typeof AbortController === 'function' ? new AbortController() : null;
  let reloj;
  // Aunque el fetch no respete la señal, a los plazoMs se deja de esperar.
  const plazo = new Promise((_, rechazar) => {
    reloj = setTimeout(() => { abort?.abort(); rechazar(new Error('novedades_plazo')); }, plazoMs);
  });
  const conPlazo = (promesa) => Promise.race([promesa, plazo]);
  try {
    const r = await conPlazo(fetchImpl(URL_NOVEDADES_PRODUCTO, { method: 'GET', credentials: 'omit',
      headers: { Accept: 'application/json' }, ...(abort ? { signal: abort.signal } : {}) }));
    if (!r || !r.ok) throw new Error('novedades_http_' + (r?.status ?? 0));
    const tipo = String(r.headers?.get?.('content-type') || '').toLowerCase();
    if (tipo && !/^application\/(?:[\w.+-]+\+)?json\b/.test(tipo)) throw new Error('novedades_tipo');
    // Un cuerpo anunciado que no puede caber ni se lee (cada carácter ocupa como mucho 3 bytes).
    const anunciado = Number(r.headers?.get?.('content-length'));
    if (Number.isFinite(anunciado) && anunciado > MAX_CARACTERES * 3) { abort?.abort(); throw new Error('novedades_tamano'); }
    const cuerpo = await conPlazo(r.text());
    if (typeof cuerpo !== 'string' || cuerpo.length > MAX_CARACTERES) throw new Error('novedades_tamano');
    if (!cuerpo.trimStart().startsWith('{')) throw new Error('novedades_no_json');
    const remota = validarNovedadesProducto(JSON.parse(cuerpo));
    return compararVersiones(remota.version, respaldo.version) >= 0
      ? { datos: remota, origen: 'web' } : { datos: respaldo, origen: 'respaldo' };
  } catch (error) {
    return { datos: respaldo, origen: 'respaldo', error: String(error?.message || error).slice(0, 120) };
  } finally { clearTimeout(reloj); }
}

module.exports = { URL_NOVEDADES_PRODUCTO, PLAZO_MS, MAX_CARACTERES, MAX, LIMITES, RESPALDO,
  versionValida, compararVersiones, hayNovedadesSinVer, validarNovedadesProducto, novedadesValidas,
  textosNovedades, cargarNovedadesProducto, estadoAvisosMovil, conRecordatorioAvisos };

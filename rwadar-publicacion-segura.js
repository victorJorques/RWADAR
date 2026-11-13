'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const PAGINAS_FICHAS = require('./rwadar-fichas-manifiesto');

const SUPABASE_AUTH = 'https://exgpmjpaaebyoolpwced.supabase.co/auth/v1';
const CLAVE_PUBLICA = 'sb_publishable_IjVAwxotgiimcVqI3Nnn3Q_dk7UOB5n';
const ORIGEN_PUBLICO = 'https://rwadar.pages.dev';
const ORIGEN_LEGADO = 'https://rwadar.netlify.app';
const PROYECTO_CLOUDFLARE = 'rwadar';
const VERSION_MANIFIESTO_RELANZAMIENTO = 3;
const PERFILES_PUBLICACION = Object.freeze(['editorial-gratuito', 'comercial']);
const CAPACIDADES_COMERCIALES = Object.freeze(['comisiones', 'publicidad', 'atribucion', 'cobros']);
const MAX_ANTIGUEDAD_MANIFIESTO_DIAS = 7;
const ESTADOS_LEGALES_PUBLICABLES = Object.freeze(new Set([
  'acuerdo-pendiente-de-documentar',
  'identidad-pendiente-de-verificar',
  'titular-identificado-revision-pendiente',
  'acuerdo-documentado',
]));
const ESTADOS_CONTROL_RELANZAMIENTO = Object.freeze(new Set([
  'pendiente',
  'en_progreso',
  'aprobado',
]));
const TIPOS_EVIDENCIA_RELANZAMIENTO = Object.freeze(new Set([
  'aprobacion',
  'contrato',
  'documento',
  'fuente-primaria',
  'prueba',
]));
const CONTROLES_RELANZAMIENTO = Object.freeze([
  'identidad_legal_y_fiscal',
  'revision_legal',
  'aviso_legal_y_condiciones',
  'primer_acuerdo_patrocinio',
  'facturacion_y_cobro',
  'catalogo_actual_y_citable',
  'derechos_de_imagen',
  'beta_segura_extremo_a_extremo',
  'operacion_monitorizacion_y_rollback',
  'alcance_editorial_sin_monetizacion',
]);
const CONTROLES_SOLO_COMERCIALES = Object.freeze(['primer_acuerdo_patrocinio', 'facturacion_y_cobro']);

function controlesExigidosPorPerfil(perfil) {
  return CONTROLES_RELANZAMIENTO.filter(id => perfil === 'editorial-gratuito'
    ? !CONTROLES_SOLO_COMERCIALES.includes(id)
    : id !== 'alcance_editorial_sin_monetizacion');
}

function huellaAlcancePublicacion(estado) {
  const alcance = {
    perfilPublicacion: estado?.perfilPublicacion,
    modeloComercial: estado?.modeloComercial,
    comisionVariableSobreInversion: estado?.comisionVariableSobreInversion,
    actividadComercial: Object.fromEntries(CAPACIDADES_COMERCIALES.map(
      id => [id, estado?.actividadComercial?.[id]])),
  };
  return `sha256:${crypto.createHash('sha256').update(JSON.stringify(alcance)).digest('hex')}`;
}
/* El manifiesto vive fuera de esta lista para que pueda registrar una huella
   ya revisada sin intentar contener el hash de sí mismo. El commit aprobado
   puede ser ancestro del commit que incorpora el manifiesto, pero ninguna de
   estas rutas puede haber cambiado desde entonces. */
const RUTAS_CONTENIDO_APROBADO = Object.freeze([
  'rwadar-site',
  'rwadar-acceso',
  'functions',
  'rwadar-academy',
  'rwadar-academy.js',
  'rwadar-noticias',
  'rwadar-noticias.js',
  'rwadar-fichas.js',
  'rwadar-fichas-manifiesto.js',
  'rwadar-adelgazar.js',
  'rwadar-app/sincronizar.js',
  'rwadar-app/catalogo-publico.js',
  'rwadar-movil/lib/contrato-catalogo.js',
  'rwadar-movil/lib/cartera.js',
  // Motor de «La tokenización en el mundo» (10/11/2026): lo usan la web, el worker y la app.
  'rwadar-movil/lib/tokenizacion.js',
  // Y de dónde saca rwadar-publicar.js el histórico que publica en /datos/.
  'rwadar-tokenizacion-historico.js',
  // Motor de «Calcula tus números» (11/11/2026): la web publica su copia exacta.
  'rwadar-movil/lib/calculadora.js',
  // Motor de «Noticias del sector» (10/11/2026): valida /datos/noticias-v2.json.
  'rwadar-movil/lib/noticias-sector.js',
  // /datos/noticias.json sin «imagen» para la app ya instalada, validado con
  // la copia congelada del motor de esa app (rediseño de Inicio, 10/11/2026).
  'rwadar-app/noticias/noticias-v1.cjs',
  'rwadar-app/noticias/motor-app-26664c9.cjs',
  // Fotos editoriales de las noticias (rediseño de Inicio, 10/11/2026): solo
  // lo que se publica (el manifiesto y los WebP), no el script que las genera.
  'rwadar-editorial-source/noticias/fotos.json',
  'rwadar-editorial-source/noticias/fotos',
  'rwadar-noticias-editoriales.js',
  'rwadar-movil/lib/ficha-editorial.js',
  'rwadar-movil/lib/idioma.js',
  'rwadar-movil/lib/idioma-en.js',
  'rwadar-movil/scripts/copiar-idiomas-web.cjs',
  'rwadar-movil/assets/ofertas-editoriales',
  'rwadar-ofertas-editoriales.js',
  'rwadar-publicacion-segura.js',
  'rwadar-publicar.js',
  'rwadar-precargar-imagenes.js',
  'rwadar-editorial-source/ofertas/precargas',
]);

/* Lista cerrada del único árbol que puede llegar al artefacto desplegable.
   Un archivo ignorado por Git sigue siendo un archivo publicable si se copia
   a ciegas; por eso aquí no se confía ni en .gitignore ni en extensiones. */
/* Las páginas de RWAdar Academy las genera rwadar-academy.js a partir de
   rwadar-academy/. Publicar una lección nueva exige añadirla aquí a mano:
   así ninguna página llega a producción sin una decisión revisable. */
const PAGINAS_ACADEMY = Object.freeze([
  'academy/index.html',
  'academy/que-significa-tokenizar-un-activo.html',
  'academy/quien-es-quien-actores-tokenizacion.html',
  'academy/es-tu-activo-tokenizable.html',
  'academy/marco-legal-cuando-tu-token-es-un-valor.html',
  'academy/cuanto-cuesta-tokenizar.html',
  'academy/liquidez-como-evaluarla.html',
  'academy/como-leer-el-radar.html',
  'academy/expediente-de-tokenizacion.html',
  'academy/despues-de-emitir-ciclo-de-vida.html',
].sort());

/* Las secciones de Inicio (rediseño del 10/11/2026): el detalle del
   mercado, las noticias y los seis capítulos que antes iban en Inicio. */
const PAGINAS_SECCIONES = Object.freeze([
  'mercado/index.html',
  'noticias/index.html',
  'aprende/index.html',
  // «Novedades de RWAdar» en detalle (12/11/2026): adonde lleva la ventana de Inicio.
  'novedades-rwadar/index.html',
]);

const ARCHIVOS_PUBLICABLES = Object.freeze([
  '.well-known/security.txt',
  '_headers',
  '_redirects',
  '404.html',
  'acceso.html',
  // Baja de los avisos de novedades sin cuenta (contrato del 05/11/2026).
  'baja.html',
  ...PAGINAS_ACADEMY,
  ...PAGINAS_SECCIONES,
  ...PAGINAS_FICHAS,
  'assets/academy-20261002.css',
  'assets/acceso.css',
  'assets/acceso.js',
  'assets/acceso-privado.js',
  'assets/academy-20261002.js',
  // Candado de las lecciones sin cuenta (índice y portada), 08/11/2026.
  'assets/academy-candado-20261108.css',
  'assets/academy-candado-20261108.js',
  'assets/analitica-20260927.js',
  'assets/baja-20261105.js',
  'assets/error-20260820.css',
  'assets/ficha-editorial-20261022.js',
  'assets/ficha-pagina-20261022.js',
  'assets/fichas-20261022.css',
  'assets/fuentes/geist-normal-6ab67a4f11f1.woff2',
  'assets/fuentes/geist-italic-0138eaff66cd.woff2',
  'assets/fuentes/geist-mono-normal-7ead591194e0.woff2',
  'assets/privacidad-20260820.css',
  'assets/mapa-buscar-util-20261027.js',
  'assets/mapa-buscar-20261027.js',
  'assets/mapa-buscar-20261027.css',
  'assets/mapa-ubicaciones-20261027.json',
  'assets/vendor/leaflet-1.9.4/license.txt',
  'assets/leaflet-1.9.4.js',
  'assets/leaflet-1.9.4.css',
  'assets/images/layers.png',
  'assets/images/layers-2x.png',
  'assets/images/marker-icon.png',
  'assets/images/marker-icon-2x.png',
  'assets/images/marker-shadow.png',
  'assets/rwadar-20260820.css',
  'assets/rwadar-20260820.js',
  'assets/catalogo-publico-20261022.js',
  'assets/idioma-en-20261022.js',
  // Inglés de la campana y de las notificaciones de la web (12/11/2026), solo de la web.
  'assets/idioma-en-avisos-20261112.js',
  'assets/idioma-20261022.js',
  'assets/idioma-web-20261022.js',
  'assets/idioma-previo-20261104.js',
  'assets/idioma-20261022.css',
  'assets/cartera-modelo-20261028.js',
  'assets/cartera-cuenta-20261028.js',
  'assets/cartera-cuenta-ui-20261028.js',
  'assets/cartera-cuenta-ui-20261028.css',
  // «La tokenización en el mundo» en Inicio (10/11/2026): el motor (copia de
  // rwadar-movil/lib/tokenizacion.js), la sección, su hoja y la semilla del
  // histórico (rwadar-publicar.js la cambia por el de la rama datos-tokenizacion).
  'assets/tokenizacion-modelo-20261110.js',
  'datos/tokenizacion-historico.json',
  // «Mercado y noticias» al estilo de una app de bolsa (11/11/2026): la
  // sección (/mercado/ y la tarjeta de Inicio), su hoja, el paso de /noticias/
  // a /mercado/ y la semilla de la serie de un año (rwadar-publicar.js la
  // cambia por la de la rama datos-tokenizacion si es más reciente).
  'assets/mercado-20261111.js',
  'assets/mercado-20261111.css',
  'assets/noticias-a-mercado-20261111.js',
  'datos/tokenizacion-serie.json',
  // Las series finas del gráfico (13/11/2026: cada 5 minutos y cada hora), en
  // un archivo aparte; la semilla es «sin serie fina» y rwadar-publicar.js la
  // cambia por la de la rama datos-tokenizacion si casa con la diaria.
  'datos/tokenizacion-serie-fina.json',
  // «Noticias del sector» en Inicio (10/11/2026): el motor (copia de
  // rwadar-movil/lib/noticias-sector.js), la sección, su hoja y las noticias
  // verificadas del último ciclo (rwadar-publicar.js las valida antes de publicar):
  // noticias-v2.json con la foto de cada una (web y app nuevas) y noticias.json
  // sin «imagen», con la forma que acepta la app ya instalada.
  'assets/noticias-sector-modelo-20261110.js',
  'assets/noticias-sector-20261110.js',
  'assets/noticias-sector-20261110.css',
  'datos/noticias.json',
  'datos/noticias-v2.json',
  // Inicio por bloques y sus secciones (rediseño del 10/11/2026).
  'assets/secciones-20261110.css',
  // «Calcula tus números» en Inicio (11/11/2026): el motor (copia de
  // rwadar-movil/lib/calculadora.js), el bloque y su hoja (también la de los
  // dos campos nuevos del explicador).
  'assets/calculadora-modelo-20261111.js',
  'assets/calculadora-20261111.js',
  'assets/calculadora-20261111.css',
  // «Novedades de RWAdar» (12/11/2026): el modelo (valida el archivo), la
  // ventana de Inicio y la página /novedades-rwadar/, su hoja y el contenido,
  // que lee también la app (rwadar-publicar.js no lo publica si no valida).
  'assets/novedades-producto-modelo-20261112.js',
  'assets/novedades-producto-20261112.js',
  'assets/novedades-producto-20261112.css',
  'datos/novedades-producto.json',
  'assets/aprende-20261110.js',
  'c9417d2d5003bb9a41fee63c7f5ec00f.txt',
  'google6b2e3e5f58b7e557.html',
  'icono-192.png',
  'icono-512.png',
  'icono-maskable-512.png',
  'index.html',
  'manifest.webmanifest',
  'og.png',
  'para-empresas.html',
  'plataformas/addx.webp',
  'plataformas/archax.webp',
  'plataformas/artex-global-markets.webp',
  'plataformas/backed-finance.webp',
  'plataformas/blocksquare.webp',
  'plataformas/centrifuge.webp',
  'plataformas/courtyard.webp',
  'plataformas/figure.webp',
  'plataformas/fireblocks.webp',
  'plataformas/franklin-templeton.webp',
  'plataformas/fuentes.json',
  'plataformas/inx.webp',
  'plataformas/lofty.webp',
  'plataformas/maple-finance.webp',
  'plataformas/midas.webp',
  'plataformas/ondo-finance.webp',
  'plataformas/openeden.webp',
  'plataformas/pax-gold.webp',
  'plataformas/reental.webp',
  'plataformas/republic.webp',
  'plataformas/securitize.webp',
  'plataformas/spiko.webp',
  'plataformas/superstate.webp',
  'plataformas/swarm.webp',
  'plataformas/taurus.webp',
  'plataformas/tokeny.webp',
  'plataformas/tzero.webp',
  'privacidad.html',
  'transparencia-comercial.html',
  'robots.txt',
  'rwadar.csv',
  'sitemap.xml',
  'sw.js',
].sort());

function rutaPortable(base, archivo) {
  return path.relative(base, archivo).split(path.sep).join('/');
}

function comprobarOrigenPublico(valor = ORIGEN_PUBLICO) {
  let url;
  try { url = new URL(String(valor || '')); }
  catch { throw new Error('origen público no válido'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port ||
      url.pathname !== '/' || url.search || url.hash || url.origin !== String(valor) ||
      url.origin !== ORIGEN_PUBLICO) {
    throw new Error('el origen público debe ser un origen HTTPS exacto, sin credenciales, puerto, ruta, consulta ni fragmento');
  }
  return url.origin;
}

function validarOrigenPublicable(directorio, origen = ORIGEN_PUBLICO) {
  const base = path.resolve(directorio);
  const canonico = comprobarOrigenPublico(origen);
  const leer = nombre => fs.readFileSync(path.join(base, ...nombre.split('/')), 'utf8');
  const index = leer('index.html');
  const privacidad = leer('privacidad.html');
  const transparenciaComercial = leer('transparencia-comercial.html');
  const paraEmpresas = leer('para-empresas.html');
  const robots = leer('robots.txt');
  const sitemap = leer('sitemap.xml');
  const seguridad = leer('.well-known/security.txt');
  const fallos = [];
  if (!index.includes(`<link rel="canonical" href="${canonico}/">`) || index.includes(ORIGEN_LEGADO)) {
    fallos.push('canonical/metadatos de index.html');
  }
  if (!privacidad.includes(`<link rel="canonical" href="${canonico}/privacidad">`)) {
    fallos.push('canonical de privacidad.html');
  }
  if (!transparenciaComercial.includes(
    `<link rel="canonical" href="${canonico}/transparencia-comercial">`)) {
    fallos.push('canonical de transparencia-comercial.html');
  }
  const metasRobotsEmpresas = [...paraEmpresas.matchAll(/<meta\b[^>]*>/gi)]
    .map(coincidencia => coincidencia[0])
    .filter(etiqueta => /\bname\s*=\s*(["'])robots\1/i.test(etiqueta));
  const contenidoRobotsEmpresas = metasRobotsEmpresas.length === 1 &&
    metasRobotsEmpresas[0].match(/\bcontent\s*=\s*(["'])([^"']*)\1/i)?.[2] || '';
  if (!paraEmpresas.includes(`<link rel="canonical" href="${canonico}/para-empresas">`) ||
      !/\bnoindex\b/i.test(contenidoRobotsEmpresas) ||
      !/\bnofollow\b/i.test(contenidoRobotsEmpresas)) {
    fallos.push('canonical/noindex de para-empresas.html');
  }
  if (!robots.includes(`Sitemap: ${canonico}/sitemap.xml`)) fallos.push('robots.txt');
  if (!sitemap.includes(`<loc>${canonico}/</loc>`) ||
      !sitemap.includes(`<loc>${canonico}/privacidad</loc>`) ||
      !sitemap.includes(`<loc>${canonico}/transparencia-comercial</loc>`) ||
      sitemap.includes(`<loc>${canonico}/para-empresas</loc>`) ||
      sitemap.includes(ORIGEN_LEGADO)) {
    fallos.push('sitemap.xml');
  }
  if (!seguridad.includes(`Canonical: ${canonico}/.well-known/security.txt`)) {
    fallos.push('security.txt');
  }
  if (fallos.length) throw new Error(`origen público incoherente en: ${fallos.join(', ')}`);
  return canonico;
}

function listarArchivosRegulares(directorio) {
  const base = path.resolve(directorio);
  const archivos = [];

  function visitar(actual) {
    for (const entrada of fs.readdirSync(actual, { withFileTypes: true })) {
      const archivo = path.join(actual, entrada.name);
      const estado = fs.lstatSync(archivo);
      const relativa = rutaPortable(base, archivo);
      if (estado.isSymbolicLink()) throw new Error(`enlace no permitido: ${relativa}`);
      if (estado.isDirectory()) visitar(archivo);
      else if (estado.isFile()) archivos.push(relativa);
      else throw new Error(`tipo de archivo no permitido: ${relativa}`);
    }
  }

  visitar(base);
  return archivos.sort();
}

function validarArbolPublicable(directorio, esperados = ARCHIVOS_PUBLICABLES) {
  const encontrados = listarArchivosRegulares(directorio);
  const permitidos = [...esperados].sort();
  const conjunto = new Set(permitidos);
  const reales = new Set(encontrados);
  const desconocidos = encontrados.filter(nombre => !conjunto.has(nombre));
  const faltan = permitidos.filter(nombre => !reales.has(nombre));
  if (desconocidos.length) {
    throw new Error(`archivo no permitido en rwadar-site: ${desconocidos.join(', ')}`);
  }
  if (faltan.length) throw new Error(`falta archivo publicable: ${faltan.join(', ')}`);
  return encontrados;
}

function huellaContenido(contenido, longitud = 12) {
  if (!Number.isInteger(longitud) || longitud < 8 || longitud > 64) {
    throw new Error('longitud de huella no válida');
  }
  return crypto.createHash('sha256').update(contenido).digest('hex').slice(0, longitud);
}

function nombreAssetVersionado(nombre, contenido) {
  const normal = String(nombre).split(path.sep).join('/');
  if (!/^assets\/[a-z0-9][a-z0-9._-]*\.(?:css|js)$/i.test(normal)) {
    throw new Error(`asset no versionable: ${nombre}`);
  }
  const extension = path.posix.extname(normal);
  return normal.slice(0, -extension.length) + '.' + huellaContenido(contenido) + extension;
}

function versionCacheDesdeEntradas(entradas) {
  const pares = entradas instanceof Map ? [...entradas.entries()] : Object.entries(entradas);
  const hash = crypto.createHash('sha256');
  /* Orden binario estable: localeCompare puede cambiar entre sistemas/ICU y
     producir una VERSION distinta con exactamente los mismos bytes. */
  for (const [nombre, contenido] of pares.sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    hash.update(String(nombre));
    hash.update('\0');
    hash.update(contenido);
    hash.update('\0');
  }
  return `rwadar-v-${hash.digest('hex').slice(0, 16)}`;
}

/* La política puede declarar identidad o acuerdos pendientes en local, pero
   un destino remoto exige siempre el estado documentado. El llamador remoto
   debe activar exigirDocumentado; así la revisión local no finge que el
   contrato ya existe y la publicación falla cerrada. */
function comprobarEstadoLegalPublicacion(contenido, { exigirDocumentado = false } = {}) {
  const privacidad = String(contenido || '');
  if (/\bdata-deploy-blocker\b/i.test(privacidad)) {
    throw new Error('la política de privacidad conserva data-deploy-blocker');
  }
  const patronEstado = /\bdata-deploy-legal-status\s*=\s*(["'])([^"']+)\1/gi;
  const declaraciones = [...privacidad.matchAll(patronEstado)];
  const principales = [...privacidad.matchAll(/<main\b[^>]*>/gi)];
  if (declaraciones.length !== 1 || principales.length !== 1 ||
      !/\bdata-deploy-legal-status\s*=\s*(["'])([^"']+)\1/i.test(principales[0][0])) {
    throw new Error('data-deploy-legal-status debe aparecer una sola vez y dentro de <main>');
  }
  const estado = declaraciones[0][2];
  if (!estado || !ESTADOS_LEGALES_PUBLICABLES.has(estado)) {
    throw new Error('data-deploy-legal-status ausente o no reconocido');
  }
  if (exigirDocumentado && estado !== 'acuerdo-documentado') {
    throw new Error('la publicación remota exige data-deploy-legal-status="acuerdo-documentado"');
  }
  return estado;
}

function esObjetoPlano(valor) {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return false;
  const prototipo = Object.getPrototypeOf(valor);
  return prototipo === Object.prototype || prototipo === null;
}

function fechaISOaMs(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor || ''))) return null;
  const ms = Date.parse(`${valor}T00:00:00.000Z`);
  if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 10) !== valor) return null;
  return ms;
}

const TEXTOS_TRIVIALES = new Set([
  'aprobado', 'hecho', 'n/a', 'na', 'ok', 'prueba', 'si', 'verificado',
]);

function esTextoSustancial(valor, minimo, maximo) {
  if (typeof valor !== 'string') return false;
  const texto = valor.trim();
  if (texto.length < minimo || texto.length > maximo || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(texto)) {
    return false;
  }
  const normal = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ');
  return !TEXTOS_TRIVIALES.has(normal);
}

function fallo(codigo, mensaje) {
  return { codigo, mensaje };
}

function revisionAprobadaConFormaValida(revision) {
  return esObjetoPlano(revision) &&
    /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(String(revision.commit || '')) &&
    /^sha256:[0-9a-f]{64}$/.test(String(revision.contenidoSha256 || '')) &&
    /^sha256:[0-9a-f]{64}$/.test(String(revision.alcanceSha256 || ''));
}

function evaluarPreparacionRelanzamiento(manifiesto, {
  ahora = new Date(),
  maxAntiguedadDias = MAX_ANTIGUEDAD_MANIFIESTO_DIAS,
  destino = 'produccion',
} = {}) {
  const estado = esObjetoPlano(manifiesto) ? manifiesto : null;
  if (!estado) return [fallo('MANIFIESTO_INVALIDO', 'el estado de relanzamiento no es un objeto JSON')];

  const instanteActual = ahora instanceof Date ? new Date(ahora.getTime()) : new Date(ahora);
  if (!Number.isFinite(instanteActual.getTime()) || !Number.isInteger(maxAntiguedadDias) ||
      maxAntiguedadDias < 1 || maxAntiguedadDias > 31) {
    return [fallo('VALIDACION_INVALIDA', 'la fecha de referencia o la ventana de vigencia no son válidas')];
  }

  const fallos = [];
  if (!['produccion', 'preview'].includes(destino)) {
    fallos.push(fallo('DESTINO_INVALIDO', 'el destino de revisión no está reconocido'));
  }
  const camposRaiz = new Set([
    'version', 'actualizadoEl', 'publicacionSolicitada', 'modeloComercial',
    'comisionVariableSobreInversion', 'nota', 'revisionAprobada', 'controles',
    'perfilPublicacion', 'actividadComercial',
  ]);
  for (const campo of Object.keys(estado)) {
    if (!camposRaiz.has(campo)) {
      fallos.push(fallo('CAMPO_DESCONOCIDO', `el manifiesto contiene el campo no reconocido ${campo}`));
    }
  }
  if (estado.version !== VERSION_MANIFIESTO_RELANZAMIENTO) {
    fallos.push(fallo('VERSION_NO_RECONOCIDA', 'la versión del estado de relanzamiento no es compatible'));
  }

  const actualizadoMs = fechaISOaMs(estado.actualizadoEl);
  const hoyMs = Date.UTC(
    instanteActual.getUTCFullYear(), instanteActual.getUTCMonth(), instanteActual.getUTCDate());
  if (actualizadoMs === null) {
    fallos.push(fallo('FECHA_MANIFIESTO_INVALIDA', 'actualizadoEl debe ser una fecha ISO real YYYY-MM-DD'));
  } else if (actualizadoMs > hoyMs) {
    fallos.push(fallo('FECHA_MANIFIESTO_FUTURA', 'actualizadoEl no puede estar en el futuro'));
  } else if (hoyMs - actualizadoMs > maxAntiguedadDias * 24 * 60 * 60 * 1000) {
    fallos.push(fallo(
      'MANIFIESTO_CADUCADO',
      `el manifiesto supera ${maxAntiguedadDias} días sin una revisión explícita`,
    ));
  }

  if (estado.publicacionSolicitada !== true) {
    fallos.push(fallo('PUBLICACION_NO_SOLICITADA', 'no consta una decisión expresa de relanzamiento'));
  }
  const editorial = estado.perfilPublicacion === 'editorial-gratuito';
  if (!PERFILES_PUBLICACION.includes(estado.perfilPublicacion)) {
    fallos.push(fallo('PERFIL_NO_RECONOCIDO', 'falta elegir expresamente un perfil de publicación reconocido'));
  }
  const actividad = estado.actividadComercial;
  if (!esObjetoPlano(actividad) || Object.keys(actividad).length !== CAPACIDADES_COMERCIALES.length ||
      CAPACIDADES_COMERCIALES.some(id => typeof actividad[id] !== 'boolean')) {
    fallos.push(fallo('ACTIVIDAD_COMERCIAL_INVALIDA', 'deben declararse explícitamente comisiones, publicidad, atribución y cobros'));
  } else if (editorial && CAPACIDADES_COMERCIALES.some(id => actividad[id] !== false)) {
    fallos.push(fallo('EDITORIAL_CON_MONETIZACION', 'el perfil editorial exige todas las capacidades comerciales desactivadas'));
  }
  if (estado.comisionVariableSobreInversion !== false ||
      (editorial ? !['publicidad-en-app-pendiente', 'comision-por-conversion-pendiente', 'sin-monetizacion'].includes(estado.modeloComercial)
        : estado.modeloComercial !== 'tarifa-fija-b2b') ||
      (!editorial && actividad?.comisiones === true)) {
    fallos.push(fallo(
      'MODELO_COMERCIAL_NO_APROBADO',
      'modelo sin habilitación técnica: anuncios de red y comisiones requieren controles específicos implementados y revisados; cambiar el manifiesto no los activa',
    ));
  }
  if (!esTextoSustancial(estado.nota, 20, 1000)) {
    fallos.push(fallo('NOTA_INVALIDA', 'la nota del manifiesto debe explicar su alcance de forma no trivial'));
  }

  if (!revisionAprobadaConFormaValida(estado.revisionAprobada)) {
    fallos.push(fallo(
      'REVISION_NO_APROBADA',
      'faltan el commit y las huellas sha256 del contenido y del alcance revisados',
    ));
  } else {
    const desconocidos = Object.keys(estado.revisionAprobada)
      .filter(campo => !['commit', 'contenidoSha256', 'alcanceSha256'].includes(campo));
    if (desconocidos.length) {
      fallos.push(fallo(
        'REVISION_INVALIDA',
        `revisionAprobada contiene campos no reconocidos: ${desconocidos.join(', ')}`,
      ));
    }
    if (estado.revisionAprobada.alcanceSha256 !== huellaAlcancePublicacion(estado)) {
      fallos.push(fallo('ALCANCE_NO_APROBADO', 'el perfil o las capacidades difieren del alcance revisado'));
    }
  }

  const controles = esObjetoPlano(estado.controles) ? estado.controles : null;
  if (!controles) {
    fallos.push(fallo('CONTROLES_INVALIDOS', 'controles debe ser un objeto'));
    return fallos;
  }
  for (const id of Object.keys(controles)) {
    if (!CONTROLES_RELANZAMIENTO.includes(id)) {
      fallos.push(fallo('CONTROL_DESCONOCIDO', `el control ${id} no está reconocido`));
    }
  }

  const exigidos = controlesExigidosPorPerfil(estado.perfilPublicacion);
  for (const id of CONTROLES_RELANZAMIENTO) {
    const control = controles[id];
    if (!esObjetoPlano(control)) {
      fallos.push(fallo('CONTROL_AUSENTE', `falta el control ${id}`));
      continue;
    }
    const camposControl = Object.keys(control).filter(campo =>
      !['estado', 'evidencias', 'detalle'].includes(campo));
    if (camposControl.length) {
      fallos.push(fallo(
        'CONTROL_INVALIDO',
        `${id} contiene campos no reconocidos: ${camposControl.join(', ')}`,
      ));
    }
    if (!ESTADOS_CONTROL_RELANZAMIENTO.has(control.estado)) {
      fallos.push(fallo('ESTADO_CONTROL_INVALIDO', `${id} usa un estado no reconocido`));
    } else if (exigidos.includes(id) && control.estado !== 'aprobado' &&
      !(destino === 'preview' && estado.perfilPublicacion === 'editorial-gratuito' &&
        id === 'beta_segura_extremo_a_extremo' && control.estado === 'en_progreso' &&
        Array.isArray(control.evidencias) && control.evidencias.length > 0)) {
      fallos.push(fallo('CONTROL_NO_APROBADO', `${id} no está aprobado`));
    }
    if (!esTextoSustancial(control.detalle, 20, 1000)) {
      fallos.push(fallo('DETALLE_INVALIDO', `${id} no explica el resultado de forma suficiente`));
    }
    if (!Array.isArray(control.evidencias) || control.evidencias.length > 50) {
      fallos.push(fallo('EVIDENCIAS_INVALIDAS', `${id}.evidencias debe ser un array acotado`));
      continue;
    }
    if (control.estado === 'aprobado' && control.evidencias.length === 0) {
      fallos.push(fallo('EVIDENCIA_AUSENTE', `${id} no registra evidencia`));
    }

    const referencias = new Set();
    for (const [indice, evidencia] of control.evidencias.entries()) {
      const ubicacion = `${id}.evidencias[${indice}]`;
      if (!esObjetoPlano(evidencia)) {
        fallos.push(fallo('EVIDENCIA_INVALIDA', `${ubicacion} debe ser un objeto estructurado`));
        continue;
      }
      const camposEvidencia = Object.keys(evidencia).filter(campo =>
        !['tipo', 'referencia', 'verificadoEl', 'resumen', 'sha256'].includes(campo));
      if (camposEvidencia.length) {
        fallos.push(fallo(
          'EVIDENCIA_INVALIDA',
          `${ubicacion} contiene campos no reconocidos: ${camposEvidencia.join(', ')}`,
        ));
      }
      if (!TIPOS_EVIDENCIA_RELANZAMIENTO.has(evidencia.tipo)) {
        fallos.push(fallo('EVIDENCIA_INVALIDA', `${ubicacion}.tipo no está reconocido`));
      }
      if (!esTextoSustancial(evidencia.referencia, 12, 500)) {
        fallos.push(fallo('EVIDENCIA_TRIVIAL', `${ubicacion}.referencia no identifica una prueba o documento`));
      } else {
        const referencia = evidencia.referencia.trim().toLowerCase();
        if (referencias.has(referencia)) {
          fallos.push(fallo('EVIDENCIA_DUPLICADA', `${ubicacion}.referencia está duplicada`));
        }
        referencias.add(referencia);
      }
      if (!esTextoSustancial(evidencia.resumen, 20, 1000)) {
        fallos.push(fallo('EVIDENCIA_TRIVIAL', `${ubicacion}.resumen no describe qué se comprobó`));
      }
      const evidenciaMs = fechaISOaMs(evidencia.verificadoEl);
      if (evidenciaMs === null) {
        fallos.push(fallo('FECHA_EVIDENCIA_INVALIDA', `${ubicacion}.verificadoEl debe ser YYYY-MM-DD`));
      } else if (evidenciaMs > hoyMs || (actualizadoMs !== null && evidenciaMs > actualizadoMs)) {
        fallos.push(fallo(
          'FECHA_EVIDENCIA_INCOHERENTE',
          `${ubicacion}.verificadoEl no puede ser futura ni posterior a actualizadoEl`,
        ));
      }
      if (evidencia.sha256 !== undefined &&
          !/^sha256:[0-9a-f]{64}$/.test(String(evidencia.sha256))) {
        fallos.push(fallo('HUELLA_EVIDENCIA_INVALIDA', `${ubicacion}.sha256 no es una huella completa`));
      }
    }
  }
  return fallos;
}

function comprobarPreparacionRelanzamiento(manifiesto, opciones) {
  const fallos = evaluarPreparacionRelanzamiento(manifiesto, opciones);
  if (fallos.length) {
    throw new Error(fallos.map(({ codigo, mensaje }) => `[${codigo}] ${mensaje}`).join('; '));
  }
  return true;
}

function comprobarContenidoPerfilPublicacion({ manifiesto, transparencia, empresas }) {
  if (manifiesto?.perfilPublicacion !== 'editorial-gratuito') return true;
  const atributoUnico = (contenido, nombre, esperado, enMain = false) => {
    const html = String(contenido || '').replace(/<!--[\s\S]*?-->/g, '');
    const patron = new RegExp(`\\b${nombre}\\s*=\\s*(["'])([^"']*)\\1`, 'gi');
    const valores = [...html.matchAll(patron)];
    const main = [...html.matchAll(/<main\b[^>]*>/gi)];
    return valores.length === 1 && valores[0][2] === esperado &&
      (!enMain || (main.length === 1 && new RegExp(`\\b${nombre}\\s*=`).test(main[0][0])));
  };
  if (!atributoUnico(transparencia, 'data-commercial-status', 'inactive', true) ||
      !atributoUnico(transparencia, 'data-investor-commission', '0', true) ||
      !atributoUnico(transparencia, 'data-advertising-status', 'under-review') ||
      !atributoUnico(empresas, 'data-partner-status', 'interest-only', true) ||
      !atributoUnico(empresas, 'data-commercial-status', 'legal-approval-pending', true) ||
      !atributoUnico(empresas, 'data-investor-commission', '0', true)) {
    throw new Error('el perfil editorial no admite páginas con contratación, anuncios o cobros declarados activos');
  }
  return true;
}

function dentroDeDirectorio(base, destino) {
  return destino === base || destino.startsWith(base + path.sep);
}

function listarContenidoAprobado(raiz) {
  const base = path.resolve(raiz);
  const archivos = [];

  function visitar(archivo) {
    const estado = fs.lstatSync(archivo);
    const relativa = rutaPortable(base, archivo);
    if (!dentroDeDirectorio(base, path.resolve(archivo))) {
      throw new Error(`ruta de aprobación fuera del proyecto: ${relativa}`);
    }
    if (estado.isSymbolicLink()) throw new Error(`enlace no permitido en contenido aprobado: ${relativa}`);
    if (estado.isDirectory()) {
      for (const entrada of fs.readdirSync(archivo, { withFileTypes: true })) {
        visitar(path.join(archivo, entrada.name));
      }
    } else if (estado.isFile()) {
      archivos.push(relativa);
    } else {
      throw new Error(`tipo no permitido en contenido aprobado: ${relativa}`);
    }
  }

  for (const relativa of RUTAS_CONTENIDO_APROBADO) {
    const archivo = path.resolve(base, ...relativa.split('/'));
    if (!dentroDeDirectorio(base, archivo) || !fs.existsSync(archivo)) {
      throw new Error(`falta contenido sujeto a aprobación: ${relativa}`);
    }
    visitar(archivo);
  }
  return archivos.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
}

function huellaContenidoAprobado(raiz) {
  const base = path.resolve(raiz);
  const hash = crypto.createHash('sha256');
  hash.update('rwadar-contenido-aprobado-v1\0');
  for (const relativa of listarContenidoAprobado(base)) {
    const bytes = fs.readFileSync(path.resolve(base, ...relativa.split('/')));
    hash.update(`ruta:${Buffer.byteLength(relativa, 'utf8')}:`);
    hash.update(relativa, 'utf8');
    hash.update(`\0bytes:${bytes.length}:`);
    hash.update(bytes);
    hash.update('\0');
  }
  return `sha256:${hash.digest('hex')}`;
}

function errorCompuerta(codigo, mensaje) {
  const error = new Error(mensaje);
  error.codigo = codigo;
  return error;
}

function ejecutarGitPredeterminado(argumentos, raiz) {
  return spawnSync('git', argumentos, {
    cwd: raiz,
    encoding: 'utf8',
    windowsHide: true,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
    maxBuffer: 1024 * 1024,
  });
}

function ejecutarGitComprobado(argumentos, raiz, ejecutarGit, codigo, mensaje) {
  let resultado;
  try { resultado = ejecutarGit(argumentos, raiz); }
  catch (error) {
    throw errorCompuerta(codigo, `${mensaje}: ${error.message}`);
  }
  if (!resultado || resultado.error || resultado.status !== 0) {
    const detalle = resultado && String(resultado.stderr || '').trim();
    throw errorCompuerta(codigo, `${mensaje}${detalle ? `: ${detalle}` : ''}`);
  }
  return String(resultado.stdout || '').trim();
}

function comprobarArbolGitLimpio({ raiz, ejecutarGit = ejecutarGitPredeterminado } = {}) {
  const base = path.resolve(raiz || __dirname);
  const raizGit = ejecutarGitComprobado(
    ['rev-parse', '--show-toplevel'], base, ejecutarGit,
    'GIT_NO_VERIFICABLE', 'no se pudo localizar la raíz Git',
  );
  const normalizarRuta = valor => {
    const resuelta = path.resolve(valor);
    return process.platform === 'win32' ? resuelta.toLowerCase() : resuelta;
  };
  if (normalizarRuta(raizGit) !== normalizarRuta(base)) {
    throw errorCompuerta('RAIZ_GIT_INCORRECTA', 'la publicación debe ejecutarse desde la raíz exacta del repositorio');
  }
  const head = ejecutarGitComprobado(
    ['rev-parse', '--verify', 'HEAD'], base, ejecutarGit,
    'GIT_NO_VERIFICABLE', 'no se pudo resolver HEAD',
  ).toLowerCase();
  if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(head)) {
    throw errorCompuerta('GIT_NO_VERIFICABLE', 'HEAD no es un identificador Git completo');
  }
  const salida = ejecutarGitComprobado(
    ['status', '--porcelain=v1', '--untracked-files=all'], base, ejecutarGit,
    'GIT_NO_VERIFICABLE', 'no se pudo comprobar el estado del árbol Git',
  );
  const cambios = salida.split(/\r?\n/).map(linea => linea.trimEnd()).filter(Boolean);
  if (cambios.length) {
    throw errorCompuerta(
      'ARBOL_GIT_SUCIO',
      `el árbol Git contiene ${cambios.length} cambio(s); primero consolida o descarta de forma consciente`,
    );
  }
  return { head };
}

function comprobarRevisionGitPublicable({
  raiz,
  manifiesto,
  ejecutarGit = ejecutarGitPredeterminado,
} = {}) {
  if (!revisionAprobadaConFormaValida(manifiesto && manifiesto.revisionAprobada)) {
    throw errorCompuerta('REVISION_NO_APROBADA', 'el manifiesto no identifica un commit y una huella aprobados');
  }
  if (manifiesto.revisionAprobada.alcanceSha256 !== huellaAlcancePublicacion(manifiesto)) {
    throw errorCompuerta('ALCANCE_NO_APROBADO', 'el perfil o las capacidades cambiaron desde la revisión');
  }
  const base = path.resolve(raiz || __dirname);
  const limpio = comprobarArbolGitLimpio({ raiz: base, ejecutarGit });
  const commitAprobado = manifiesto.revisionAprobada.commit;
  const resuelto = ejecutarGitComprobado(
    ['rev-parse', '--verify', `${commitAprobado}^{commit}`], base, ejecutarGit,
    'COMMIT_NO_VERIFICABLE', 'el commit aprobado no existe en este repositorio',
  ).toLowerCase();
  if (resuelto !== commitAprobado) {
    throw errorCompuerta('COMMIT_NO_VERIFICABLE', 'el commit aprobado no se resolvió de forma exacta');
  }

  const ancestro = ejecutarGit(['merge-base', '--is-ancestor', commitAprobado, limpio.head], base);
  if (!ancestro || ancestro.error || ancestro.status !== 0) {
    throw errorCompuerta('COMMIT_NO_ANCESTRO', 'el commit aprobado no es ancestro de HEAD');
  }
  const diferencia = ejecutarGit(
    ['diff', '--quiet', '--no-ext-diff', commitAprobado, '--', ...RUTAS_CONTENIDO_APROBADO],
    base,
  );
  if (!diferencia || diferencia.error || ![0, 1].includes(diferencia.status)) {
    throw errorCompuerta('GIT_NO_VERIFICABLE', 'no se pudo comparar el contenido con el commit aprobado');
  }
  if (diferencia.status === 1) {
    throw errorCompuerta('CONTENIDO_NO_APROBADO', 'el contenido publicable cambió después del commit aprobado');
  }

  const contenidoSha256 = huellaContenidoAprobado(base);
  if (contenidoSha256 !== manifiesto.revisionAprobada.contenidoSha256) {
    throw errorCompuerta('HUELLA_NO_APROBADA', 'la huella del contenido no coincide con la aprobada');
  }
  return { head: limpio.head, commitAprobado, contenidoSha256 };
}

async function comprobarConfiguracionAuth({
  fetchFn = globalThis.fetch,
  timeoutMs = 8000,
  signal,
} = {}) {
  if (typeof fetchFn !== 'function') throw new Error('fetch no está disponible');
  const controlador = signal ? null : new AbortController();
  const temporizador = controlador && setTimeout(() => controlador.abort(), timeoutMs);
  if (temporizador && typeof temporizador.unref === 'function') temporizador.unref();

  try {
    const respuesta = await fetchFn(`${SUPABASE_AUTH}/settings`, {
      method: 'GET',
      headers: { apikey: CLAVE_PUBLICA, Accept: 'application/json' },
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      signal: signal || controlador.signal,
    });
    if (!respuesta || !respuesta.ok) {
      throw new Error(`Auth settings no verificable (HTTP ${respuesta && respuesta.status || 'sin respuesta'})`);
    }
    let ajustes;
    try { ajustes = await respuesta.json(); }
    catch { throw new Error('Auth settings no devolvió JSON válido'); }
    if (!ajustes || ajustes.mailer_autoconfirm !== false) {
      throw new Error('mailer_autoconfirm debe ser exactamente false antes de publicar');
    }
    return ajustes;
  } finally {
    if (temporizador) clearTimeout(temporizador);
  }
}

module.exports = {
  ARCHIVOS_PUBLICABLES,
  PAGINAS_ACADEMY,
  PAGINAS_SECCIONES,
  CONTROLES_RELANZAMIENTO,
  CAPACIDADES_COMERCIALES,
  controlesExigidosPorPerfil,
  MAX_ANTIGUEDAD_MANIFIESTO_DIAS,
  ORIGEN_LEGADO,
  ORIGEN_PUBLICO,
  PROYECTO_CLOUDFLARE,
  RUTAS_CONTENIDO_APROBADO,
  VERSION_MANIFIESTO_RELANZAMIENTO,
  comprobarArbolGitLimpio,
  comprobarConfiguracionAuth,
  comprobarEstadoLegalPublicacion,
  comprobarPreparacionRelanzamiento,
  comprobarContenidoPerfilPublicacion,
  comprobarOrigenPublico,
  comprobarRevisionGitPublicable,
  huellaContenido,
  huellaContenidoAprobado,
  huellaAlcancePublicacion,
  listarContenidoAprobado,
  listarArchivosRegulares,
  nombreAssetVersionado,
  validarOrigenPublicable,
  validarArbolPublicable,
  evaluarPreparacionRelanzamiento,
  versionCacheDesdeEntradas,
};

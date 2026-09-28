import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..');
const LOTE_PREDETERMINADO = path.join(
  AQUI, 'data', 'importaciones', 'escaparate-2026-08-27', 'lote.json'
);
const EXTENSIONES_IMAGEN = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
const CAMPOS_LOTE = new Set([
  '$schema', 'versionEsquema', 'idLote', 'estado', 'publicable', 'uso', 'nota',
  'fuente', 'catalogo', 'imagenes', 'proveedores', 'politica', 'evidencias',
  'derechosImagenes',
]);
const CAMPOS_OFERTA = new Set([
  'country', 'cta', 'description', 'details', 'eligible_spain', 'europe', 'flags',
  'image_index', 'kind', 'meta', 'outside_real_estate', 'permanent', 'platform',
  'price_display', 'score', 'source_index', 'title', 'unit', 'url', 'verified_at',
  'yield_display', 'yield_literal', 'slug', 'platform_slug', 'category', 'ttl_days',
  'image_source_file',
]);
const CAMPOS_SECUNDARIA = new Set([
  'slug', 'title', 'platform', 'platform_slug', 'category', 'country', 'kind',
  'adjusted_yield', 'advertised_yield', 'ask', 'last_trade', 'depth', 'payout',
  'url', 'market_url', 'image_index', 'image_source_file', 'eligible_spain',
  'verified_at', 'ttl_days',
]);

function error(codigo, mensaje, ruta = '') {
  return { codigo, mensaje, ruta };
}

function objeto(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

function fechaValida(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

function fechaUTC(valor) {
  return fechaValida(valor) ? new Date(`${valor}T00:00:00Z`) : null;
}

function diasEntre(desde, hasta) {
  return Math.floor((hasta.getTime() - desde.getTime()) / 86_400_000);
}

function ipNoPublica(hostOriginal) {
  const host = hostOriginal.replace(/^\[|\]$/g, '').toLowerCase();
  const version = net.isIP(host);
  if (version === 4) {
    const [a, b] = host.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224
      || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168)
      || (a === 198 && (b === 18 || b === 19));
  }
  if (version === 6) {
    if (host === '::' || host === '::1') return true;
    if (/^(?:fc|fd)/.test(host) || /^fe[89ab]/.test(host)) return true;
    if (host.startsWith('::ffff:')) return ipNoPublica(host.slice(7));
  }
  return false;
}

export function esUrlHttpsPublica(valor) {
  try {
    const url = new URL(valor);
    const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    if (url.protocol !== 'https:' || url.username || url.password) return false;
    if (url.port && url.port !== '443') return false;
    if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')
        || host.endsWith('.internal') || host.endsWith('.home.arpa')) return false;
    if (net.isIP(host)) return !ipNoPublica(host);
    if (!host.includes('.') || host.endsWith('.invalid') || host.endsWith('.test')
        || host.endsWith('.example')) return false;
    return true;
  } catch {
    return false;
  }
}

function camposDesconocidos(valor, permitidos, ruta, errores) {
  if (!objeto(valor)) {
    errores.push(error('ESQUEMA_TIPO_INVALIDO', 'Se esperaba un objeto.', ruta));
    return;
  }
  for (const campo of Object.keys(valor)) {
    if (!permitidos.has(campo)) {
      errores.push(error('ESQUEMA_CAMPO_DESCONOCIDO', `Campo no permitido: ${campo}.`, `${ruta}.${campo}`));
    }
  }
}

export function validarEstructuraLote(lote) {
  const errores = [];
  camposDesconocidos(lote, CAMPOS_LOTE, 'lote', errores);
  if (!objeto(lote)) return errores;
  const requeridos = [
    '$schema', 'versionEsquema', 'idLote', 'estado', 'publicable', 'uso', 'fuente',
    'catalogo', 'imagenes', 'proveedores', 'politica', 'evidencias', 'derechosImagenes',
  ];
  for (const campo of requeridos) {
    if (!Object.hasOwn(lote, campo)) errores.push(error('ESQUEMA_CAMPO_AUSENTE', `Falta ${campo}.`, `lote.${campo}`));
  }
  if (lote.versionEsquema !== 1) errores.push(error('ESQUEMA_VERSION', 'versionEsquema debe ser 1.', 'lote.versionEsquema'));
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(lote.idLote || ''))) {
    errores.push(error('ESQUEMA_ID_LOTE', 'idLote no es un slug válido.', 'lote.idLote'));
  }
  if (!['staging', 'revisado', 'aprobado'].includes(lote.estado)) {
    errores.push(error('ESQUEMA_ESTADO', 'Estado de lote no admitido.', 'lote.estado'));
  }
  if (typeof lote.publicable !== 'boolean') errores.push(error('ESQUEMA_PUBLICABLE', 'publicable debe ser booleano.', 'lote.publicable'));
  if (!Array.isArray(lote.evidencias)) errores.push(error('ESQUEMA_EVIDENCIAS', 'evidencias debe ser un array.', 'lote.evidencias'));
  if (!Array.isArray(lote.derechosImagenes)) errores.push(error('ESQUEMA_DERECHOS', 'derechosImagenes debe ser un array.', 'lote.derechosImagenes'));

  camposDesconocidos(lote.fuente, new Set([
    'tipo', 'url', 'titulo', 'barridoEl', 'capturadoEl', 'verificacionIndependiente',
  ]), 'lote.fuente', errores);
  camposDesconocidos(lote.catalogo, new Set(['ruta', 'sha256', 'bytes', 'formato']), 'lote.catalogo', errores);
  camposDesconocidos(lote.imagenes, new Set([
    'manifiestoRuta', 'sha256', 'bytes', 'duplicadasEnLote', 'derechosVerificados',
  ]), 'lote.imagenes', errores);
  camposDesconocidos(lote.proveedores, new Set(['ruta', 'sha256', 'bytes', 'formato']), 'lote.proveedores', errores);
  camposDesconocidos(lote.politica, new Set([
    'maxAntiguedadBarridoDias', 'exigirFuentePrimaria', 'exigirDerechosImagen',
    'permitirFechaImportacionComoVerificacion',
  ]), 'lote.politica', errores);
  return errores;
}

function validarFuenteSegura(valor, ruta, errores) {
  if (!esUrlHttpsPublica(valor)) {
    errores.push(error('URL_INSEGURA', 'La URL no es HTTPS pública o apunta a una red reservada.', ruta));
  }
}

function validarCamposCatalogo(entrada, permitidos, ruta, errores) {
  camposDesconocidos(entrada, permitidos, ruta, errores);
  if (!objeto(entrada)) return;
  for (const campo of ['slug', 'title', 'platform_slug', 'url', 'verified_at', 'ttl_days', 'image_index', 'image_source_file']) {
    if (!Object.hasOwn(entrada, campo)) errores.push(error('CATALOGO_CAMPO_AUSENTE', `Falta ${campo}.`, `${ruta}.${campo}`));
  }
}

export function validarContenido({ lote, catalogo, manifiestoImagenes, proveedoresCanonicos, hoy = new Date() }) {
  const errores = [...validarEstructuraLote(lote)];
  if (!objeto(lote) || !objeto(catalogo) || !objeto(manifiestoImagenes)) {
    errores.push(error('DOCUMENTO_INVALIDO', 'Lote, catálogo y manifiesto de imágenes deben ser objetos.'));
    return errores;
  }

  if (lote.estado !== 'aprobado' || lote.publicable !== true) {
    errores.push(error('LOTE_NO_PUBLICABLE', 'El lote no está aprobado y marcado como publicable.', 'lote.publicable'));
  }
  if (lote.fuente?.verificacionIndependiente !== true) {
    errores.push(error('FUENTE_NO_VERIFICADA', 'La fuente no tiene verificación independiente.', 'lote.fuente.verificacionIndependiente'));
  }
  validarFuenteSegura(lote.fuente?.url, 'lote.fuente.url', errores);

  const hoyFecha = hoy instanceof Date ? hoy : new Date(`${hoy}T00:00:00Z`);
  const hoyDia = new Date(Date.UTC(hoyFecha.getUTCFullYear(), hoyFecha.getUTCMonth(), hoyFecha.getUTCDate()));
  const barrido = fechaUTC(lote.fuente?.barridoEl);
  if (!barrido) {
    errores.push(error('FECHA_INVALIDA', 'La fecha de barrido no es válida.', 'lote.fuente.barridoEl'));
  } else {
    const maxDias = Number(lote.politica?.maxAntiguedadBarridoDias);
    if (!Number.isInteger(maxDias) || maxDias < 1) {
      errores.push(error('POLITICA_INVALIDA', 'maxAntiguedadBarridoDias debe ser entero positivo.', 'lote.politica.maxAntiguedadBarridoDias'));
    } else if (diasEntre(barrido, hoyDia) > maxDias) {
      errores.push(error('BARRIDO_RANCIO', `El barrido tiene ${diasEntre(barrido, hoyDia)} días; el máximo es ${maxDias}.`, 'lote.fuente.barridoEl'));
    }
  }

  if (catalogo.source?.url !== lote.fuente?.url
      || catalogo.source?.sweep_date !== lote.fuente?.barridoEl
      || catalogo.source?.captured_at !== lote.fuente?.capturadoEl) {
    errores.push(error('METADATOS_FUENTE_NO_COINCIDEN', 'El lote no conserva los metadatos exactos del catálogo.', 'catalogo.source'));
  }

  const principales = Array.isArray(catalogo.offers) ? catalogo.offers : [];
  const secundarias = Array.isArray(catalogo.secondary_market) ? catalogo.secondary_market : [];
  if (!Array.isArray(catalogo.offers) || !Array.isArray(catalogo.secondary_market)) {
    errores.push(error('CATALOGO_COLECCION_INVALIDA', 'El catálogo debe contener offers y secondary_market.'));
  }

  const imagenes = Array.isArray(manifiestoImagenes.imagenes) ? manifiestoImagenes.imagenes : [];
  const imagenPorSlug = new Map();
  for (const [indice, imagen] of imagenes.entries()) {
    if (!imagen?.slug) continue;
    if (imagenPorSlug.has(imagen.slug)) errores.push(error('DUPLICADO_IMAGEN', `Imagen repetida para ${imagen.slug}.`, `manifiestoImagenes.imagenes[${indice}]`));
    imagenPorSlug.set(imagen.slug, imagen);
  }

  const evidenciaPorSlug = new Map();
  for (const [indice, entrada] of (Array.isArray(lote.evidencias) ? lote.evidencias : []).entries()) {
    const slug = String(entrada?.slug || '');
    if (evidenciaPorSlug.has(slug)) errores.push(error('DUPLICADO_EVIDENCIA', `Evidencia repetida para ${slug}.`, `lote.evidencias[${indice}]`));
    evidenciaPorSlug.set(slug, entrada);
    for (const [j, fuente] of (Array.isArray(entrada?.fuentes) ? entrada.fuentes : []).entries()) {
      validarFuenteSegura(fuente?.url, `lote.evidencias[${indice}].fuentes[${j}].url`, errores);
    }
  }

  const derechosPorSlug = new Map();
  for (const [indice, entrada] of (Array.isArray(lote.derechosImagenes) ? lote.derechosImagenes : []).entries()) {
    const slug = String(entrada?.slug || '');
    if (derechosPorSlug.has(slug)) errores.push(error('DUPLICADO_DERECHOS', `Derechos repetidos para ${slug}.`, `lote.derechosImagenes[${indice}]`));
    derechosPorSlug.set(slug, entrada);
    validarFuenteSegura(entrada?.fuenteUrl, `lote.derechosImagenes[${indice}].fuenteUrl`, errores);
  }

  const vistos = new Set();
  const todos = [
    ...principales.map((oferta, indice) => ({ oferta, ruta: `catalogo.offers[${indice}]`, permitidos: CAMPOS_OFERTA })),
    ...secundarias.map((oferta, indice) => ({ oferta, ruta: `catalogo.secondary_market[${indice}]`, permitidos: CAMPOS_SECUNDARIA })),
  ];
  for (const { oferta, ruta, permitidos } of todos) {
    validarCamposCatalogo(oferta, permitidos, ruta, errores);
    if (!objeto(oferta)) continue;
    const slug = String(oferta.slug || '');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) errores.push(error('SLUG_INVALIDO', `Slug inválido: ${slug}.`, `${ruta}.slug`));
    if (vistos.has(slug)) errores.push(error('DUPLICADO_SLUG', `Slug duplicado: ${slug}.`, `${ruta}.slug`));
    vistos.add(slug);

    if (!proveedoresCanonicos.has(oferta.platform_slug)) {
      errores.push(error('PROVEEDOR_DESCONOCIDO', `El proveedor ${oferta.platform_slug} no está en el radar canónico.`, `${ruta}.platform_slug`));
    }
    validarFuenteSegura(oferta.url, `${ruta}.url`, errores);
    if (Object.hasOwn(oferta, 'market_url')) validarFuenteSegura(oferta.market_url, `${ruta}.market_url`, errores);

    const verificada = fechaUTC(oferta.verified_at);
    const ttl = Number(oferta.ttl_days);
    if (!verificada) errores.push(error('FECHA_INVALIDA', `verified_at no es una fecha válida para ${slug}.`, `${ruta}.verified_at`));
    if (!Number.isInteger(ttl) || ttl < 1 || ttl > 365) errores.push(error('TTL_INVALIDO', `ttl_days inválido para ${slug}.`, `${ruta}.ttl_days`));
    if (verificada && barrido && verificada > barrido) {
      errores.push(error('FECHA_ARTIFICIAL', `La verificación de ${slug} es posterior al barrido de origen.`, `${ruta}.verified_at`));
    }
    if (verificada && Number.isInteger(ttl) && diasEntre(verificada, hoyDia) > ttl) {
      errores.push(error('OFERTA_RANCIA', `${slug} supera su TTL de ${ttl} días.`, `${ruta}.verified_at`));
    }

    const evidencia = evidenciaPorSlug.get(slug);
    const fuentesPrimarias = Array.isArray(evidencia?.fuentes)
      ? evidencia.fuentes.filter((fuente) => fuente?.primaria === true)
      : [];
    if (!fuentesPrimarias.length) {
      errores.push(error('FUENTE_PRIMARIA_AUSENTE', `Falta una fuente primaria explícita para ${slug}.`, `lote.evidencias.${slug}`));
    }

    const derechos = derechosPorSlug.get(slug);
    if (!derechos || derechos.publicacionAutorizada !== true
        || !String(derechos.titular || '').trim() || !String(derechos.licencia || '').trim()) {
      errores.push(error('DERECHOS_IMAGEN_AUSENTES', `No hay autorización de imagen verificable para ${slug}.`, `lote.derechosImagenes.${slug}`));
    }
    if (!imagenPorSlug.has(slug)) {
      errores.push(error('IMAGEN_NO_REFERENCIADA', `El manifiesto no contiene la imagen de ${slug}.`, ruta));
    }
  }

  for (const slug of evidenciaPorSlug.keys()) {
    if (!vistos.has(slug)) errores.push(error('EVIDENCIA_HUERFANA', `La evidencia no corresponde a una oferta: ${slug}.`, 'lote.evidencias'));
  }
  for (const slug of derechosPorSlug.keys()) {
    if (!vistos.has(slug)) errores.push(error('DERECHOS_HUERFANOS', `Los derechos no corresponden a una oferta: ${slug}.`, 'lote.derechosImagenes'));
  }
  if (lote.imagenes?.derechosVerificados !== true || manifiestoImagenes.procedenciaVerificada !== true) {
    errores.push(error('DERECHOS_MANIFIESTO_NO_VERIFICADOS', 'El lote o el manifiesto declaran derechos/procedencia no verificados.', 'lote.imagenes'));
  }
  return errores;
}

async function sha256(ruta) {
  return createHash('sha256').update(await fs.readFile(ruta)).digest('hex');
}

async function leerJson(ruta) {
  return JSON.parse(await fs.readFile(ruta, 'utf8'));
}

function resolverReferencia(loteRuta, referencia) {
  if (typeof referencia !== 'string' || !referencia || path.isAbsolute(referencia)) {
    throw new Error('referencia absoluta o vacía');
  }
  const resuelta = path.resolve(path.dirname(loteRuta), referencia);
  const relativa = path.relative(RAIZ, resuelta);
  if (!relativa || relativa.startsWith('..') || path.isAbsolute(relativa)) {
    throw new Error('referencia fuera del espacio de trabajo');
  }
  return resuelta;
}

async function comprobarArchivo(loteRuta, descriptor, campoRuta, errores) {
  try {
    const ruta = resolverReferencia(loteRuta, descriptor?.[campoRuta]);
    const estadistica = await fs.stat(ruta);
    const hash = await sha256(ruta);
    if (estadistica.size !== descriptor.bytes || hash !== descriptor.sha256) {
      errores.push(error('HASH_INCORRECTO', `La integridad no coincide para ${descriptor?.[campoRuta]}.`, campoRuta));
    }
    return ruta;
  } catch (causa) {
    errores.push(error('REFERENCIA_INVALIDA', `No se pudo abrir ${descriptor?.[campoRuta] || '(vacío)'}: ${causa.message}.`, campoRuta));
    return null;
  }
}

function extraerProveedoresCanonicos(sql) {
  const slugs = new Set();
  for (const linea of sql.split(/\r?\n/)) {
    if (!/insert into plataformas/i.test(linea) || !linea.includes("'en_radar'")) continue;
    const coincidencia = /values\s*\(\s*'([^']+)'/i.exec(linea);
    if (coincidencia) slugs.add(coincidencia[1]);
  }
  return slugs;
}

async function imagenesEnDirectorio(ruta) {
  const entradas = await fs.readdir(ruta, { withFileTypes: true });
  return entradas.filter((entrada) => entrada.isFile() && EXTENSIONES_IMAGEN.has(path.extname(entrada.name).toLowerCase()));
}

export async function validarArchivo({ loteRuta = LOTE_PREDETERMINADO, hoy = new Date() } = {}) {
  const rutaAbsoluta = path.resolve(loteRuta);
  const errores = [];
  let lote;
  try {
    lote = await leerJson(rutaAbsoluta);
  } catch (causa) {
    return { ok: false, errores: [error('LOTE_ILEGIBLE', causa.message, rutaAbsoluta)], resumen: null };
  }
  errores.push(...validarEstructuraLote(lote));

  const catalogoRuta = await comprobarArchivo(rutaAbsoluta, lote.catalogo, 'ruta', errores);
  const imagenesRuta = await comprobarArchivo(rutaAbsoluta, lote.imagenes, 'manifiestoRuta', errores);
  const proveedoresRuta = await comprobarArchivo(rutaAbsoluta, lote.proveedores, 'ruta', errores);
  try {
    const esquemaRuta = resolverReferencia(rutaAbsoluta, lote.$schema);
    const esquema = await leerJson(esquemaRuta);
    if (esquema.$id !== 'urn:rwadar:esquema:oferta-importacion:1') {
      errores.push(error('ESQUEMA_NO_RECONOCIDO', 'El $id del esquema no coincide.', 'lote.$schema'));
    }
  } catch (causa) {
    errores.push(error('ESQUEMA_ILEGIBLE', causa.message, 'lote.$schema'));
  }

  const manifiestoRuta = path.join(path.dirname(rutaAbsoluta), 'manifiesto.json');
  try {
    const manifiesto = await leerJson(manifiestoRuta);
    if (manifiesto.idLote !== lote.idLote || manifiesto.publicable !== false
        || manifiesto.imagenesDuplicadas !== false || manifiesto.imagenesCopiadas !== 0) {
      errores.push(error('MANIFIESTO_INCOHERENTE', 'El manifiesto no conserva el carácter no publicable o duplica imágenes.', manifiestoRuta));
    }
  } catch (causa) {
    errores.push(error('MANIFIESTO_ILEGIBLE', causa.message, manifiestoRuta));
  }

  const imagenesCopiadas = await imagenesEnDirectorio(path.dirname(rutaAbsoluta));
  if (imagenesCopiadas.length) {
    errores.push(error('IMAGEN_DUPLICADA_EN_STAGING', `El staging contiene imágenes: ${imagenesCopiadas.map((x) => x.name).join(', ')}.`, path.dirname(rutaAbsoluta)));
  }

  if (catalogoRuta && imagenesRuta && proveedoresRuta) {
    try {
      const [catalogo, manifiestoImagenes, sql] = await Promise.all([
        leerJson(catalogoRuta), leerJson(imagenesRuta), fs.readFile(proveedoresRuta, 'utf8'),
      ]);
      const proveedoresCanonicos = extraerProveedoresCanonicos(sql);
      if (!proveedoresCanonicos.size) errores.push(error('PROVEEDORES_ILEGIBLES', 'No se extrajo ningún proveedor canónico.', proveedoresRuta));
      errores.push(...validarContenido({ lote, catalogo, manifiestoImagenes, proveedoresCanonicos, hoy }));
      return {
        ok: errores.length === 0,
        errores,
        resumen: {
          lote: lote.idLote,
          ofertas: (catalogo.offers || []).length,
          secundarias: (catalogo.secondary_market || []).length,
          imagenes: (manifiestoImagenes.imagenes || []).length,
          proveedoresCanonicos: proveedoresCanonicos.size,
          modo: 'dry-run',
        },
      };
    } catch (causa) {
      errores.push(error('REFERENCIA_ILEGIBLE', causa.message));
    }
  }
  return { ok: false, errores, resumen: { lote: lote.idLote, modo: 'dry-run' } };
}

function argumentos(argv) {
  const opciones = { loteRuta: LOTE_PREDETERMINADO, hoy: new Date(), json: false, aplicar: false };
  for (let i = 0; i < argv.length; i += 1) {
    const valor = argv[i];
    if (valor === '--json') opciones.json = true;
    else if (valor === '--apply' || valor === '--aplicar') opciones.aplicar = true;
    else if (valor.startsWith('--lote=')) opciones.loteRuta = valor.slice(7);
    else if (valor === '--lote') opciones.loteRuta = argv[++i];
    else if (valor.startsWith('--hoy=')) opciones.hoy = new Date(`${valor.slice(6)}T00:00:00Z`);
    else if (valor === '--hoy') opciones.hoy = new Date(`${argv[++i]}T00:00:00Z`);
    else throw new Error(`Argumento desconocido: ${valor}`);
  }
  if (Number.isNaN(opciones.hoy.getTime())) throw new Error('La fecha de --hoy no es válida');
  return opciones;
}

async function principal() {
  let opciones;
  try {
    opciones = argumentos(process.argv.slice(2));
  } catch (causa) {
    console.error(`ERROR: ${causa.message}`);
    process.exitCode = 2;
    return;
  }
  if (opciones.aplicar) {
    console.error('ERROR: este comando solo admite dry-run local; no contiene ninguna ruta de escritura remota.');
    process.exitCode = 2;
    return;
  }
  const resultado = await validarArchivo(opciones);
  if (opciones.json) {
    console.log(JSON.stringify(resultado, null, 2));
  } else {
    console.log('=== INTAKE RWADAR · DRY-RUN LOCAL ===');
    if (resultado.resumen) {
      console.log(`${resultado.resumen.lote}: ${resultado.resumen.ofertas ?? '?'} principales, ${resultado.resumen.secundarias ?? '?'} secundarias, ${resultado.resumen.imagenes ?? '?'} imágenes referenciadas.`);
    }
    if (resultado.ok) {
      console.log('APTO PARA REVISIÓN: 0 bloqueos. Este dry-run no ha escrito datos.');
    } else {
      const limite = 40;
      console.log(`NO PUBLICABLE: ${resultado.errores.length} bloqueo(s).`);
      for (const entrada of resultado.errores.slice(0, limite)) {
        console.log(`  [${entrada.codigo}] ${entrada.ruta ? `${entrada.ruta}: ` : ''}${entrada.mensaje}`);
      }
      if (resultado.errores.length > limite) console.log(`  … ${resultado.errores.length - limite} bloqueo(s) adicionales; usa --json para verlos.`);
      console.log('Dry-run finalizado sin red, sin SQL y sin modificar el catálogo.');
    }
  }
  process.exitCode = resultado.ok ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await principal();
}

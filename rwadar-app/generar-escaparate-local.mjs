import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { aplicarRevalidacion } = require('./revalidar-escaparate-local.js');
const SOLO_DATOS = process.argv.includes('--solo-datos');
let sharp;
try {
  if (!SOLO_DATOS) sharp = require('sharp');
} catch (error) {
  throw new Error(
    'Falta sharp. Instala las dependencias de la raiz o define NODE_PATH con el runtime local.',
    { cause: error }
  );
}

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..');
const MOVIL = path.join(RAIZ, 'rwadar-movil');
const MAESTROS = path.join(MOVIL, 'fixtures', 'ofertas-originales');
const ACTIVOS = path.join(MOVIL, 'assets', 'ofertas');
const ARCHIVO_FIXTURE = path.join(MOVIL, 'fixtures', 'escaparate-local.json');
const ARCHIVO_MANIFIESTO = path.join(MOVIL, 'fixtures', 'fuentes-imagenes.json');
const ARCHIVO_MAPA = path.join(MOVIL, 'fixtures', 'imagenes-ofertas.js');
const ARCHIVO_RADAR = path.join(RAIZ, 'rwadar-site', 'assets', 'rwadar-20260820.js');
const ARCHIVO_ACTUALIZACIONES = path.join(
  AQUI, 'data', 'verificaciones', '2026-09-21', 'actualizaciones-escaparate-local.json');
const ARCHIVO_VERIFICACION_RADAR = path.join(
  AQUI, 'data', 'verificaciones', '2026-09-21', 'radar-canonico-26.json');
const ARCHIVO_REVALIDACION = path.join(
  AQUI, 'data', 'verificaciones', '2026-09-27', 'revalidacion-ofertas.json');

const AVISO_DERECHOS =
  'Procedencia y derechos de las imágenes no verificados; uso solo interno, no publicable.';
const PROCEDENCIA = 'Artefacto aportado por el usuario; procedencia no verificada de forma independiente.';
const USO = 'Solo interno; no publicable.';

const CATEGORIAS = {
  'Inmobiliario': { color: '#1B2E63', orden: 1 },
  'Crédito privado': { color: '#1C4A73', orden: 2 },
  'Tesoro y fondos': { color: '#17616F', orden: 3 },
  'Acciones y capital privado': { color: '#1B7263', orden: 4 },
  'Materias primas': { color: '#24805A', orden: 5 },
  'Infraestructura': { color: '#3F4A6B', orden: 6 },
};

const PROVEEDORES_SOLO_ESCAPARATE = [
  { slug: 'brickwise', nombre: 'Brickwise', categoria: 'Inmobiliario' },
  { slug: 'prosegur-crypto', nombre: 'Prosegur Crypto', categoria: 'Materias primas' },
  { slug: 'alius-capital', nombre: 'Alius Capital', categoria: 'Acciones y capital privado' },
  { slug: 'aktionariat', nombre: 'Aktionariat', categoria: 'Acciones y capital privado' },
].map((proveedor) => ({
  plataforma_id: `local-escaparate:${proveedor.slug}`,
  ...proveedor,
  soloEscaparate: true,
}));

function argumentoEntrada(argumentos) {
  const igual = argumentos.find((valor) => valor.startsWith('--entrada='));
  if (igual) return igual.slice('--entrada='.length);
  const indice = argumentos.indexOf('--entrada');
  if (indice >= 0) return argumentos[indice + 1];
  return argumentos.find((valor) => !valor.startsWith('-')) || MAESTROS;
}

function asegurar(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

async function existe(ruta) {
  try {
    await fs.access(ruta);
    return true;
  } catch {
    return false;
  }
}

async function leerJson(ruta) {
  return JSON.parse(await fs.readFile(ruta, 'utf8'));
}

async function hashArchivo(ruta) {
  const bytes = await fs.readFile(ruta);
  return createHash('sha256').update(bytes).digest('hex');
}

async function describirArchivo(ruta) {
  const estadistica = await fs.stat(ruta);
  return { hashSha256: await hashArchivo(ruta), bytes: estadistica.size };
}

async function copiarSiDistinto(origen, destino) {
  if (path.resolve(origen) === path.resolve(destino)) return;
  await fs.copyFile(origen, destino);
}

function slugificar(valor) {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function extraerArrayLiteral(codigo, nombre) {
  const coincidencia = new RegExp(`\\bconst\\s+${nombre}\\s*=\\s*\\[`).exec(codigo);
  asegurar(coincidencia, `No se encontro const ${nombre} en ${ARCHIVO_RADAR}`);
  const inicio = coincidencia.index + coincidencia[0].lastIndexOf('[');
  let profundidad = 0;
  let comilla = null;
  let escapado = false;

  for (let i = inicio; i < codigo.length; i += 1) {
    const caracter = codigo[i];
    if (comilla) {
      if (escapado) escapado = false;
      else if (caracter === '\\') escapado = true;
      else if (caracter === comilla) comilla = null;
      continue;
    }
    if (caracter === '"' || caracter === "'" || caracter === '`') {
      comilla = caracter;
    } else if (caracter === '[') {
      profundidad += 1;
    } else if (caracter === ']') {
      profundidad -= 1;
      if (profundidad === 0) return codigo.slice(inicio, i + 1);
    }
  }
  throw new Error(`El array ${nombre} no termina correctamente`);
}

function leerArrayDatos(codigo, nombre) {
  const literal = extraerArrayLiteral(codigo, nombre);
  const valor = vm.runInNewContext(`(${literal})`, Object.create(null), { timeout: 1_000 });
  return JSON.parse(JSON.stringify(valor));
}

function validarVerificacionRadar(datos, registro) {
  asegurar(registro && registro.version === 1, 'La verificación del radar debe usar version 1');
  asegurar(registro.publicable === false, 'La verificación del radar nunca puede declararse publicable');
  asegurar(/^\d{4}-\d{2}-\d{2}$/.test(registro.verificadoEl || ''),
    'La verificación del radar requiere fecha válida');
  asegurar(Array.isArray(registro.fuentes) && registro.fuentes.length > 0,
    'La verificación del radar no contiene fuentes');
  asegurar(Array.isArray(registro.plataformas) && registro.plataformas.length === 26,
    'La verificación del radar debe clasificar exactamente 26 plataformas');

  const fuentesPorId = new Map(registro.fuentes.map((fuente) => [fuente.id, fuente]));
  asegurar(fuentesPorId.size === registro.fuentes.length,
    'La verificación del radar contiene fuentes duplicadas');
  asegurar(registro.fuentes.every((fuente) =>
    typeof fuente.id === 'string'
    && fuente.primaria === true
    && fuente.consultadaEl === registro.verificadoEl
    && /^https:\/\//.test(fuente.url || '')
    && ['empresa', 'regulador', 'documento_legal', 'folleto_regulatorio'].includes(fuente.tipo)),
  'Toda fuente del radar debe ser primaria, HTTPS, fechada y tipificada');

  const porSlug = new Map(registro.plataformas.map((plataforma) => [plataforma.slug, plataforma]));
  asegurar(porSlug.size === registro.plataformas.length,
    'La verificación del radar contiene slugs duplicados');
  const slugsCanonicos = new Set(datos.map((plataforma) => slugificar(plataforma.n)));
  asegurar(porSlug.size === slugsCanonicos.size
    && [...porSlug.keys()].every((slug) => slugsCanonicos.has(slug)),
  'La verificación del radar no coincide exactamente con las 26 plataformas canónicas');

  const estadosOperativos = new Set(['observada', 'no_verificable']);
  const estadosLicencia = new Set([
    'confirmada_regulador', 'confirmada_documento_producto', 'no_aplica_plataforma',
    'no_verificable', 'sin_registro_declarado',
  ]);
  const estadosAcceso = new Set(['confirmado_condicionado', 'no_aplica_plataforma', 'no_verificable']);
  const referenciasUsadas = new Set();
  const validarCampo = (campo, estados, contexto) => {
    asegurar(campo && estados.has(campo.estado) && typeof campo.detalle === 'string'
      && campo.detalle.length >= 24 && Array.isArray(campo.fuentes) && campo.fuentes.length > 0,
    `Campo de verificación incompleto en ${contexto}`);
    campo.fuentes.forEach((id) => {
      asegurar(fuentesPorId.has(id), `Fuente desconocida ${id} en ${contexto}`);
      referenciasUsadas.add(id);
    });
  };

  for (const dato of datos) {
    const slug = slugificar(dato.n);
    const plataforma = porSlug.get(slug);
    asegurar(plataforma.nombre === dato.n, `El nombre verificado no coincide para ${slug}`);
    asegurar(plataforma.fechaCanonicaConservada === dato.ver,
      `La verificación intentó rejuvenecer la fecha canónica de ${slug}`);
    validarCampo(plataforma.estadoOperativo, estadosOperativos, `${slug}.estadoOperativo`);
    validarCampo(plataforma.licenciaRegistro, estadosLicencia, `${slug}.licenciaRegistro`);
    validarCampo(plataforma.acceso, estadosAcceso, `${slug}.acceso`);
    asegurar(Array.isArray(plataforma.alertasCriticas) && plataforma.alertasCriticas.length > 0,
      `Faltan alertas críticas para ${slug}`);
    plataforma.alertasCriticas.forEach((alerta, indice) => {
      asegurar(/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(alerta.codigo || '')
        && typeof alerta.detalle === 'string' && alerta.detalle.length >= 24
        && Array.isArray(alerta.fuentes) && alerta.fuentes.length > 0,
      `Alerta crítica incompleta en ${slug}[${indice}]`);
      alerta.fuentes.forEach((id) => {
        asegurar(fuentesPorId.has(id), `Fuente desconocida ${id} en ${slug}.alertasCriticas`);
        referenciasUsadas.add(id);
      });
    });
  }
  asegurar(referenciasUsadas.size === fuentesPorId.size,
    'La verificación del radar contiene fuentes sin trazabilidad a una plataforma');
  return { porSlug, fuentesPorId };
}

function convertirPlataformas(datos, registro) {
  const { porSlug, fuentesPorId } = validarVerificacionRadar(datos, registro);
  const resolverFuentes = (ids) => ids.map((id) => ({ ...fuentesPorId.get(id) }));
  const resolverCampo = (campo) => ({
    ...campo,
    fuentes: resolverFuentes(campo.fuentes),
  });

  return datos.map((plataforma) => {
    const categoria = CATEGORIAS[plataforma.cat];
    asegurar(categoria, `Categoria desconocida para ${plataforma.n}: ${plataforma.cat}`);
    const slug = slugificar(plataforma.n);
    const verificacion = porSlug.get(slug);
    return {
      plataforma_id: `local:${slug}`,
      slug,
      nombre: plataforma.n,
      categoria: plataforma.cat,
      color: categoria.color,
      categoria_orden: categoria.orden,
      region: plataforma.reg,
      actor: plataforma.tipo,
      acceso: plataforma.acceso,
      ticket: plataforma.ticket,
      cadenas: plataforma.cadenas,
      web: plataforma.web,
      aval: plataforma.aval,
      nota: plataforma.nota,
      verificada_el: plataforma.ver,
      fuentes: [],
      verificacionLocal: {
        verificadoEl: registro.verificadoEl,
        conservaFechaCanonica: true,
        estadoOperativo: resolverCampo(verificacion.estadoOperativo),
        licenciaRegistro: resolverCampo(verificacion.licenciaRegistro),
        acceso: resolverCampo(verificacion.acceso),
        alertasCriticas: verificacion.alertasCriticas.map((alerta) => ({
          ...alerta,
          fuentes: resolverFuentes(alerta.fuentes),
        })),
      },
    };
  });
}

function convertirDescartes(datos) {
  return datos.map((plataforma) => ({
    slug: slugificar(plataforma.n),
    nombre: plataforma.n,
    etiqueta_descarte: plataforma.badge,
    motivo_descarte: plataforma.why,
    verificada_el: '2026-08-06',
    fuentes: plataforma.fuentes,
  }));
}

function convertirTtl(ttl) {
  return {
    'prosegur-crypto': ttl.prosegur,
    midas: ttl.midas,
    hausera: ttl.hausera,
    brickwise: ttl.brickwise,
    'alius-capital': ttl.alius,
    spiko: ttl.spiko,
    reental: ttl.reental,
    aktionariat: ttl.aktionariat,
  };
}

function metricasOferta(oferta) {
  return [
    ...(oferta.meta || []).map((valor) => ({ etiqueta: null, valor })),
    ...(oferta.details || []).map(({ label, value }) => ({ etiqueta: label, valor: value })),
  ];
}

function avisosOferta(oferta) {
  return (oferta.flags || []).map((aviso) => ({
    texto: aviso.text,
    tono: aviso.tone,
    esAntiguedad: aviso.is_age,
    verificadaEl: aviso.verified_at,
  }));
}

function camposComunes(oferta, imagen, tipo) {
  return {
    slug: oferta.slug,
    tipo,
    titulo: oferta.title,
    plataformaSlug: oferta.platform_slug,
    plataformaNombre: oferta.platform,
    categoria: oferta.category,
    pais: oferta.country,
    resumen: oferta.description,
    url: oferta.url,
    cta: oferta.cta,
    imagen: `ofertas/${oferta.slug}.webp`,
    imagenAlt: imagen.name,
    verificadaEl: oferta.verified_at,
    vigenciaDias: oferta.ttl_days,
    permanente: oferta.permanent,
    disponibleEs: oferta.eligible_spain,
    eu: oferta.europe,
    fueraLadrillo: oferta.outside_real_estate,
    puntuacion: oferta.score,
    rentabilidad: oferta.yield_display === null
      ? null
      : { mostrada: oferta.yield_display, literal: oferta.yield_literal },
    precio: oferta.price_display === null
      ? null
      : { mostrado: oferta.price_display, unidad: oferta.unit },
    metricas: metricasOferta(oferta),
    avisos: avisosOferta(oferta),
  };
}

function convertirOferta(oferta, imagen) {
  let resumen = oferta.description;
  if (oferta.slug === 'fotovoltaica-cohotel') {
    resumen = resumen.replace('+ias', '47 dias').replace('+ías', '47 días');
  }
  if (oferta.slug === 'mglobal') {
    resumen = resumen.replace('lleva dos ventanas idéntico', 'lleva dos ventanas idénticas');
  }
  const corregida = resumen === oferta.description ? oferta : { ...oferta, description: resumen };
  return camposComunes(corregida, imagen, oferta.kind === 'yield' ? 'rendimiento' : 'valor');
}

const CAMPOS_ACTUALIZABLES = new Set([
  'slug', 'estadoRevision', 'verificadaEl', 'vigenciaDias', 'disponibleEs',
  'rentabilidad', 'precio', 'resumen', 'metricas', 'avisos', 'fuentesActuales', 'url',
]);

function aplicarActualizaciones(ofertas, registro) {
  asegurar(registro && registro.version === 1, 'La actualización local debe usar version 1');
  asegurar(registro.publicable === false, 'La actualización local nunca puede declararse publicable');
  asegurar(registro.derechosImagenVerificados === false,
    'La actualización no puede atribuir derechos de imagen no documentados');
  asegurar(/^\d{4}-\d{2}-\d{2}$/.test(registro.verificadoEl || ''),
    'La actualización local requiere fecha de verificación');
  asegurar(Array.isArray(registro.ofertas), 'La actualización local no contiene ofertas');
  const porSlug = new Map(registro.ofertas.map((cambio) => [cambio.slug, cambio]));
  asegurar(porSlug.size === registro.ofertas.length, 'La actualización local contiene slugs duplicados');
  asegurar(porSlug.size === ofertas.length,
    'La actualización debe clasificar todas las ofertas principales, sin omitir ninguna');
  const estados = new Set(['actual', 'no_verificable', 'fuentes_en_conflicto']);

  return ofertas.map((oferta) => {
    const cambio = porSlug.get(oferta.slug);
    asegurar(cambio, `Falta actualización para ${oferta.slug}`);
    asegurar(Object.keys(cambio).every((campo) => CAMPOS_ACTUALIZABLES.has(campo)),
      `Campo de actualización no permitido en ${oferta.slug}`);
    asegurar(estados.has(cambio.estadoRevision),
      `Estado de revisión no permitido en ${oferta.slug}`);
    asegurar(cambio.verificadaEl === registro.verificadoEl,
      `La fecha de ${oferta.slug} no coincide con el barrido`);
    asegurar(Number.isInteger(cambio.vigenciaDias) && cambio.vigenciaDias > 0,
      `La vigencia de ${oferta.slug} no es válida`);
    asegurar(Array.isArray(cambio.fuentesActuales) && cambio.fuentesActuales.length > 0 &&
      cambio.fuentesActuales.every((url) => /^https:\/\//.test(url)),
    `Las fuentes actuales de ${oferta.slug} no son URL HTTPS`);
    return { ...oferta, ...cambio };
  });
}

function convertirSecundaria(oferta, imagen) {
  return {
    slug: oferta.slug,
    tipo: 'secundario',
    titulo: oferta.title,
    plataformaSlug: oferta.platform_slug,
    plataformaNombre: oferta.platform,
    categoria: oferta.category,
    pais: oferta.country,
    resumen: `Oferta en el mercado secundario de ${oferta.platform}.`,
    url: oferta.url,
    urlMercado: oferta.market_url,
    cta: 'Ver la ficha',
    imagen: `ofertas/${oferta.slug}.webp`,
    imagenAlt: imagen.name,
    verificadaEl: oferta.verified_at,
    vigenciaDias: oferta.ttl_days,
    permanente: false,
    disponibleEs: oferta.eligible_spain,
    eu: null,
    fueraLadrillo: false,
    puntuacion: null,
    rentabilidad: { mostrada: oferta.adjusted_yield, literal: oferta.advertised_yield },
    precio: { mostrado: oferta.ask, unidad: null },
    metricas: [
      { etiqueta: 'Última operación', valor: oferta.last_trade },
      { etiqueta: 'Profundidad', valor: oferta.depth },
      { etiqueta: 'Pago', valor: oferta.payout },
    ],
    avisos: [],
  };
}

function convertirExclusion(oferta) {
  return {
    nombre: oferta.name,
    alcance: oferta.scope,
    motivo: oferta.reason,
    urlFuente: oferta.source_url,
  };
}

function imagenPorIndice(artefacto, oferta) {
  const imagen = artefacto.imageFiles.find((entrada) => entrada.index === oferta.image_index);
  asegurar(imagen, `Falta image_index ${oferta.image_index} para ${oferta.slug}`);
  asegurar(imagen.file === oferta.image_source_file,
    `La imagen de ${oferta.slug} no coincide: ${imagen.file} / ${oferta.image_source_file}`);
  return imagen;
}

function json(datos) {
  return `${JSON.stringify(datos, null, 2)}\n`;
}

function codigoMapa(ofertas) {
  const lineas = ofertas.map((oferta) =>
    `  ${JSON.stringify(oferta.slug)}: require(${JSON.stringify(`../assets/ofertas/${oferta.slug}.webp`)}),`
  );
  return `/* Generado por rwadar-app/generar-escaparate-local.mjs. No editar a mano. */
export const IMAGENES_OFERTAS = Object.freeze({
${lineas.join('\n')}
});

export function imagenOferta(slug) {
  return IMAGENES_OFERTAS[slug] || null;
}

export default IMAGENES_OFERTAS;
`;
}

async function generarImagen({ oferta, imagen, directorioImagenes, urlArtefacto }) {
  asegurar(path.basename(imagen.file) === imagen.file, `Nombre de imagen inseguro: ${imagen.file}`);
  const origen = path.join(directorioImagenes, imagen.file);
  asegurar(await existe(origen), `No existe ${origen}`);

  const estadisticaOriginal = await fs.stat(origen);
  asegurar(estadisticaOriginal.size === imagen.bytes,
    `Los bytes de ${imagen.file} difieren del artefacto (${estadisticaOriginal.size} / ${imagen.bytes})`);
  const metadatosOriginales = await sharp(origen, { limitInputPixels: 50_000_000 }).metadata();
  asegurar(metadatosOriginales.width === imagen.width && metadatosOriginales.height === imagen.height,
    `Las dimensiones de ${imagen.file} difieren del artefacto`);

  const maestro = path.join(MAESTROS, imagen.file);
  await copiarSiDistinto(origen, maestro);

  const webp = path.join(ACTIVOS, `${oferta.slug}.webp`);
  await sharp(origen, { density: 144, limitInputPixels: 50_000_000 })
    .resize({
      width: 640,
      height: 440,
      fit: 'contain',
      position: 'centre',
      background: { r: 11, g: 10, b: 10, alpha: 1 },
      kernel: 'lanczos3',
    })
    .webp({ quality: 84, effort: 6, smartSubsample: true })
    .toFile(webp);
  const metadatosWebp = await sharp(webp).metadata();
  asegurar(metadatosWebp.width === 640 && metadatosWebp.height === 440,
    `La derivada de ${oferta.slug} no mide 640x440`);

  return {
    slug: oferta.slug,
    titulo: oferta.title,
    urlArtefacto,
    procedencia: PROCEDENCIA,
    uso: USO,
    archivoOriginal: `rwadar-movil/fixtures/ofertas-originales/${imagen.file}`,
    archivoWebp: `rwadar-movil/assets/ofertas/${oferta.slug}.webp`,
    original: {
      mime: imagen.mime,
      ...await describirArchivo(maestro),
      ancho: imagen.width,
      alto: imagen.height,
    },
    derivada: {
      mime: 'image/webp',
      ...await describirArchivo(webp),
      ancho: metadatosWebp.width,
      alto: metadatosWebp.height,
    },
  };
}

async function principal() {
  const entrada = path.resolve(argumentoEntrada(process.argv.slice(2)));
  const archivoCatalogo = path.join(entrada, 'catalogo-normalizado.json');
  const archivoArtefacto = path.join(entrada, 'artifact.json');
  asegurar(await existe(archivoCatalogo), `Falta ${archivoCatalogo}`);
  asegurar(await existe(archivoArtefacto), `Falta ${archivoArtefacto}`);
  const directorioImagenes = await existe(path.join(entrada, 'images'))
    ? path.join(entrada, 'images')
    : entrada;

  const [catalogo, artefacto, codigoRadar, actualizaciones, verificacionRadar, revalidacion] = await Promise.all([
    leerJson(archivoCatalogo),
    leerJson(archivoArtefacto),
    fs.readFile(ARCHIVO_RADAR, 'utf8'),
    leerJson(ARCHIVO_ACTUALIZACIONES),
    leerJson(ARCHIVO_VERIFICACION_RADAR),
    leerJson(ARCHIVO_REVALIDACION),
  ]);
  asegurar(catalogo.offers.length === 28, 'El catalogo debe contener 28 ofertas');
  asegurar(catalogo.secondary_market.length === 24, 'El catalogo debe contener 24 ofertas secundarias');
  asegurar(catalogo.excluded_offers.length === 15, 'El catalogo debe contener 15 exclusiones');
  asegurar(artefacto.imageFiles.length === 52, 'El artefacto debe contener 52 imagenes');
  asegurar(catalogo.source.url === artefacto.sourceUrl, 'Las URL de fuente no coinciden');

  const datosP = leerArrayDatos(codigoRadar, 'P');
  const datosFuera = leerArrayDatos(codigoRadar, 'FUERA');
  asegurar(datosP.length === 26, 'La fuente web debe contener 26 plataformas');
  asegurar(datosFuera.length === 4, 'La fuente web debe contener 4 descartes');

  await fs.mkdir(MAESTROS, { recursive: true });
  await fs.mkdir(ACTIVOS, { recursive: true });
  await copiarSiDistinto(archivoCatalogo, path.join(MAESTROS, 'catalogo-normalizado.json'));
  await copiarSiDistinto(archivoArtefacto, path.join(MAESTROS, 'artifact.json'));

  const todas = [...catalogo.offers, ...catalogo.secondary_market];
  const slugs = new Set(todas.map(({ slug }) => slug));
  asegurar(slugs.size === 52, 'Los 52 slugs de imagen deben ser unicos');

  const manifiestoImagenes = [];
  const manifiestoAnterior = SOLO_DATOS ? await leerJson(ARCHIVO_MANIFIESTO) : null;
  for (const oferta of todas) {
    const imagen = imagenPorIndice(artefacto, oferta);
    if (SOLO_DATOS) {
      const anterior = manifiestoAnterior.imagenes.find(i => i.slug === oferta.slug);
      asegurar(anterior, `Falta imagen ya generada para ${oferta.slug}`);
      for (const [archivo, metadatos] of [
        [anterior.archivoOriginal, anterior.original], [anterior.archivoWebp, anterior.derivada],
      ]) {
        const ruta = path.resolve(RAIZ, archivo);
        asegurar(ruta.startsWith(MOVIL + path.sep), 'Imagen fuera de la app');
        const observado = await describirArchivo(ruta);
        asegurar(observado.hashSha256 === metadatos.hashSha256 && observado.bytes === metadatos.bytes,
          `Imagen cambiada: ${archivo}`);
      }
      manifiestoImagenes.push(anterior);
      continue;
    }
    manifiestoImagenes.push(await generarImagen({
      oferta,
      imagen,
      directorioImagenes,
      urlArtefacto: catalogo.source.url,
    }));
  }

  const porIndice = (oferta) => imagenPorIndice(artefacto, oferta);
  const ofertasBase = catalogo.offers.map((oferta) => convertirOferta(oferta, porIndice(oferta)));
  const ofertas = aplicarRevalidacion(aplicarActualizaciones(ofertasBase, actualizaciones), revalidacion);
  const secundario = catalogo.secondary_market.map((oferta) =>
    convertirSecundaria(oferta, porIndice(oferta))
  );
  const fixture = {
    versionEsquema: 1,
    fuente: {
      url: catalogo.source.url,
      titulo: catalogo.source.title,
      barridoEl: catalogo.source.sweep_date,
      capturadoEl: catalogo.source.captured_at,
      aviso: AVISO_DERECHOS,
      notaOrigen: catalogo.source.notice,
      procedencia: PROCEDENCIA,
      procedenciaVerificada: false,
      uso: USO,
      actualizacionLocal: {
        verificadoEl: revalidacion.consultadaEl,
        archivo: 'rwadar-app/data/verificaciones/2026-09-27/revalidacion-ofertas.json',
        publicable: false,
        derechosImagenVerificados: false,
        nota: revalidacion.alcance,
      },
      actualizacionRadarLocal: {
        verificadoEl: verificacionRadar.verificadoEl,
        archivo: 'rwadar-app/data/verificaciones/2026-09-21/radar-canonico-26.json',
        publicable: false,
        plataformas: verificacionRadar.plataformas.length,
        fuentesPrimarias: verificacionRadar.fuentes.length,
        nota: verificacionRadar.politicaFechaCanonica,
      },
    },
    ttlPorPlataforma: convertirTtl(catalogo.freshness_ttl_days),
    plataformas: convertirPlataformas(datosP, verificacionRadar),
    descartes: convertirDescartes(datosFuera),
    proveedoresSoloEscaparate: PROVEEDORES_SOLO_ESCAPARATE,
    ofertas,
    secundario,
    exclusionesOfertas: catalogo.excluded_offers.map(convertirExclusion),
  };

  const manifiesto = {
    versionEsquema: 1,
    urlArtefacto: catalogo.source.url,
    generadoDesde: catalogo.source.captured_at,
    procedencia: PROCEDENCIA,
    procedenciaVerificada: false,
    uso: USO,
    aviso: AVISO_DERECHOS,
    archivosFuente: [
      {
        archivo: 'rwadar-movil/fixtures/ofertas-originales/catalogo-normalizado.json',
        ...await describirArchivo(path.join(MAESTROS, 'catalogo-normalizado.json')),
      },
      {
        archivo: 'rwadar-movil/fixtures/ofertas-originales/artifact.json',
        ...await describirArchivo(path.join(MAESTROS, 'artifact.json')),
      },
      {
        archivo: 'rwadar-app/data/verificaciones/2026-09-21/actualizaciones-escaparate-local.json',
        ...await describirArchivo(ARCHIVO_ACTUALIZACIONES),
      },
      {
        archivo: 'rwadar-app/data/verificaciones/2026-09-21/radar-canonico-26.json',
        ...await describirArchivo(ARCHIVO_VERIFICACION_RADAR),
      },
      {
        archivo: 'rwadar-app/data/verificaciones/2026-09-27/revalidacion-ofertas.json',
        ...await describirArchivo(ARCHIVO_REVALIDACION),
      },
    ],
    imagenes: manifiestoImagenes,
  };

  await Promise.all([
    fs.writeFile(ARCHIVO_FIXTURE, json(fixture), 'utf8'),
    fs.writeFile(ARCHIVO_MANIFIESTO, json(manifiesto), 'utf8'),
    fs.writeFile(ARCHIVO_MAPA, codigoMapa(todas), 'utf8'),
  ]);

  console.log(`Escaparate local: ${ofertas.length} ofertas, ${secundario.length} secundarias`);
  console.log(`Imagenes: ${manifiestoImagenes.length} originales + WebP 640x440`);
  console.log(`Fixture: ${path.relative(RAIZ, ARCHIVO_FIXTURE)}`);
}

await principal();

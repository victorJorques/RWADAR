import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const { aplicarRevalidacion } = createRequire(import.meta.url)('./revalidar-escaparate-local.js');

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..');
const RUTA_FIXTURE = path.join(RAIZ, 'rwadar-movil', 'fixtures', 'escaparate-local.json');
const RUTA_MANIFIESTO = path.join(RAIZ, 'rwadar-movil', 'fixtures', 'fuentes-imagenes.json');
const RUTA_MAPA = path.join(RAIZ, 'rwadar-movil', 'fixtures', 'imagenes-ofertas.js');
const RUTA_MAPA_EDITORIAL = path.join(RAIZ, 'rwadar-movil', 'fixtures', 'imagenes-editoriales.js');
const RUTA_MANIFIESTO_EDITORIAL = path.join(
  RAIZ, 'rwadar-movil', 'assets', 'ofertas-editoriales', 'manifest.json');
const RUTA_WEB_JS = path.join(RAIZ, 'rwadar-site', 'assets', 'rwadar-20260820.js');
const fixture = JSON.parse(fs.readFileSync(RUTA_FIXTURE, 'utf8'));
const manifiesto = JSON.parse(fs.readFileSync(RUTA_MANIFIESTO, 'utf8'));
const mapa = fs.readFileSync(RUTA_MAPA, 'utf8');
const mapaEditorial = fs.readFileSync(RUTA_MAPA_EDITORIAL, 'utf8');
const manifiestoEditorial = JSON.parse(fs.readFileSync(RUTA_MANIFIESTO_EDITORIAL, 'utf8'));
const webJs = fs.readFileSync(RUTA_WEB_JS, 'utf8');

let correctas = 0;
function paso(texto, prueba) {
  assert.ok(prueba, texto);
  correctas += 1;
  console.log(`  OK    ${texto}`);
}

function sha256(ruta) {
  return createHash('sha256').update(fs.readFileSync(ruta)).digest('hex');
}

function fechaValida(valor) {
  return typeof valor === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(valor)
    && !Number.isNaN(Date.parse(`${valor}T00:00:00Z`));
}

function urlHttps(valor) {
  try {
    return new URL(valor).protocol === 'https:';
  } catch {
    return false;
  }
}

function urlsDelObjeto(valor, clave = '') {
  if (Array.isArray(valor)) return valor.flatMap((entrada) => urlsDelObjeto(entrada, clave));
  if (valor && typeof valor === 'object') {
    return Object.entries(valor).flatMap(([nombre, contenido]) => urlsDelObjeto(contenido, nombre));
  }
  return /^(url|web|urlFuente|urlMercado|urlArtefacto)$/.test(clave) ? [valor] : [];
}

function dimensionesWebp(ruta) {
  const bytes = fs.readFileSync(ruta);
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  const tipo = bytes.toString('ascii', 12, 16);
  const inicio = 20;
  if (tipo === 'VP8X') {
    return {
      ancho: 1 + bytes.readUIntLE(inicio + 4, 3),
      alto: 1 + bytes.readUIntLE(inicio + 7, 3),
    };
  }
  if (tipo === 'VP8 ') {
    assert.equal(bytes.toString('hex', inicio + 3, inicio + 6), '9d012a');
    return {
      ancho: bytes.readUInt16LE(inicio + 6) & 0x3fff,
      alto: bytes.readUInt16LE(inicio + 8) & 0x3fff,
    };
  }
  if (tipo === 'VP8L') {
    assert.equal(bytes[inicio], 0x2f);
    const bits = bytes.readUInt32LE(inicio + 1);
    return { ancho: (bits & 0x3fff) + 1, alto: ((bits >>> 14) & 0x3fff) + 1 };
  }
  throw new Error(`WebP no reconocido: ${tipo}`);
}

console.log('=== ESCAPARATE LOCAL COMPARTIDO ===');
paso('el esquema y las colecciones raiz usan nombres espanoles estables',
  fixture.versionEsquema === 1
  && ['fuente', 'ttlPorPlataforma', 'plataformas', 'descartes',
    'proveedoresSoloEscaparate', 'ofertas', 'secundario', 'exclusionesOfertas']
    .every((campo) => Object.hasOwn(fixture, campo)));
paso('conserva los conteos 26/4 y 28/24/15',
  fixture.plataformas.length === 26
  && fixture.descartes.length === 4
  && fixture.ofertas.length === 28
  && fixture.secundario.length === 24
  && fixture.exclusionesOfertas.length === 15);
paso('los cuatro proveedores nuevos quedan solo en el escaparate',
  fixture.proveedoresSoloEscaparate.length === 4
  && fixture.proveedoresSoloEscaparate.every((p) => p.soloEscaparate === true)
  && fixture.proveedoresSoloEscaparate.every((p) =>
    !fixture.plataformas.some((radar) => radar.slug === p.slug)));

const requeridos = ['slug', 'tipo', 'titulo', 'plataformaSlug', 'plataformaNombre',
  'categoria', 'pais', 'resumen', 'url', 'cta', 'imagen', 'imagenAlt', 'verificadaEl',
  'vigenciaDias', 'permanente', 'disponibleEs', 'eu', 'fueraLadrillo', 'puntuacion',
  'rentabilidad', 'precio', 'metricas', 'avisos'];
const todas = [...fixture.ofertas, ...fixture.secundario];
const slugs = todas.map(({ slug }) => slug);
paso('las 52 ofertas cumplen el contrato comun y tienen slug unico',
  todas.every((oferta) => requeridos.every((campo) => Object.hasOwn(oferta, campo)))
  && todas.every((oferta) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(oferta.slug))
  && new Set(slugs).size === 52);
paso('cada oferta referencia una plataforma conocida sin ampliar el radar',
  todas.every((oferta) => [
    ...fixture.plataformas.map((p) => p.slug),
    ...fixture.proveedoresSoloEscaparate.map((p) => p.slug),
  ].includes(oferta.plataformaSlug)));
paso('todas las URL de datos y manifiesto usan HTTPS',
  urlsDelObjeto(fixture).every(urlHttps) && urlsDelObjeto(manifiesto).every(urlHttps));
paso('las fechas de revision y captura son validas',
  fechaValida(fixture.fuente.barridoEl)
  && !Number.isNaN(Date.parse(fixture.fuente.capturadoEl))
  && fixture.plataformas.every((p) => fechaValida(p.verificada_el))
  && fixture.descartes.every((p) => fechaValida(p.verificada_el))
  && todas.every((oferta) => fechaValida(oferta.verificadaEl)));
paso('cada TTL es entero positivo y la actualización puede ser más estricta que el snapshot',
  Object.values(fixture.ttlPorPlataforma).every((dias) => Number.isInteger(dias) && dias > 0)
  && fixture.ofertas.every((oferta) => Number.isInteger(oferta.vigenciaDias)
    && oferta.vigenciaDias > 0
    && oferta.vigenciaDias <= fixture.ttlPorPlataforma[oferta.plataformaSlug])
  && fixture.secundario.every((oferta) => Number.isInteger(oferta.vigenciaDias)
    && oferta.vigenciaDias > 0
    && oferta.vigenciaDias <= fixture.ttlPorPlataforma[oferta.plataformaSlug]));
paso('las dos erratas del snapshot no llegan al derivado actualizado', (() => {
  const texto = JSON.stringify(fixture);
  const maestro = fs.readFileSync(path.join(
    RAIZ, 'rwadar-movil', 'fixtures', 'ofertas-originales', 'catalogo-normalizado.json'
  ), 'utf8');
  return !texto.includes('+ías')
    && !texto.includes('lleva dos ventanas idéntico')
    && maestro.includes('lleva +ías sin que nadie cruce')
    && maestro.includes('lleva dos ventanas idéntico');
})());

const estadosRevision = fixture.ofertas.reduce((conteo, oferta) => {
  conteo[oferta.estadoRevision] = (conteo[oferta.estadoRevision] || 0) + 1;
  return conteo;
}, {});
paso('el corte del 27 de septiembre clasifica las 28 ofertas sin fingir apertura',
  fixture.fuente.actualizacionLocal?.verificadoEl === '2026-09-27'
  && fixture.fuente.actualizacionLocal?.publicable === false
  && fixture.fuente.actualizacionLocal?.derechosImagenVerificados === false
  && estadosRevision.actual === 7
  && estadosRevision.no_verificable === 21
  && !estadosRevision.fuentes_en_conflicto
  && fixture.ofertas.every(o => o.disponibleEs === null && o.eu === null && o.puntuacion === null));

paso('las ofertas bloqueadas ya no muestran precios ni rentabilidades antiguas',
  fixture.ofertas.filter((oferta) => oferta.estadoRevision !== 'actual')
    .every((oferta) => oferta.precio === null && oferta.rentabilidad === null)
  && fixture.ofertas.find((oferta) => oferta.slug === 'mf-one').rentabilidad === null
  && fixture.ofertas.find((oferta) => oferta.slug === 'aktionariat').precio.mostrado === '6,25 CHF'
  && fixture.ofertas.find((oferta) => oferta.slug === 'casa-de-outeiro').precio === null);

const revalidacion = JSON.parse(fs.readFileSync(path.join(AQUI,
  'data/verificaciones/2026-09-27/revalidacion-ofertas.json'), 'utf8'));
const anteriores = JSON.parse(fs.readFileSync(path.join(AQUI,
  'data/verificaciones/2026-09-21/actualizaciones-escaparate-local.json'), 'utf8'));
const origen = fixture.ofertas.map(o => ({ ...o, ...anteriores.ofertas.find(a => a.slug === o.slug) }));
const antes = JSON.stringify({ origen, revalidacion });
const derivado = aplicarRevalidacion(origen, revalidacion);
paso('el adaptador reproduce las 28 fichas sin mutar la evidencia',
  JSON.stringify(derivado) === JSON.stringify(fixture.ofertas) &&
  JSON.stringify({ origen, revalidacion }) === antes);
paso('las cifras históricas y las ofertas sin verificar nunca se convierten en precio vigente',
  revalidacion.ofertas.filter(o => o.precioHistorico).every(o =>
    derivado.find(d => d.slug === o.slug).precio === null) &&
  derivado.every(o => o.vigenciaDias === 1 && o.permanente === false &&
    o.avisos.some(a => /no acredita oferta abierta/.test(a.texto))));
paso('el nuevo corte no cambia las fechas del radar ni del mercado secundario',
  fixture.plataformas.every(p => p.verificacionLocal.verificadoEl === '2026-09-21') &&
  fixture.secundario.every(o => o.verificadaEl === '2026-08-30'));
for (const [nombre, cambiar] of [
  ['fuente ausente', r => { r.ofertas[0].fuentes = ['inexistente']; }],
  ['consulta de fuente re-fechada', r => { r.fuentes[0].consultadaEl = '2026-09-28'; }],
  ['identidad distinta', r => { r.ofertas[0].titulo = 'Otra oferta'; }],
  ['historial distinto', r => { r.ofertas[0].fechaRevisionAnterior = '2026-09-20'; }],
  ['admisión no acreditada', r => { r.ofertas[0].disponibleEs = true; }],
  ['fecha imposible', r => { r.consultadaEl = '2026-02-30'; }],
  ['slug duplicado', r => { r.ofertas[0] = r.ofertas[1]; }],
  ['fuente HTTP', r => { r.fuentes[0].url = 'http://example.com'; }],
  ['cifras sin alcance', r => { r.ofertas[0].precio = { mostrado: '1 EUR' }; }],
  ['declaración de publicación', r => { r.publicable = true; }],
]) {
  const copia = structuredClone(revalidacion);
  cambiar(copia);
  assert.throws(() => aplicarRevalidacion(origen, copia));
  paso(`el adaptador rechaza ${nombre}`, true);
}

paso('la web explica la causa editorial y no disfraza los bloqueos como simple caducidad',
  webJs.includes("estadoRevision==='no_verificable'")
  && webJs.includes("texto:'apertura no verificable'")
  && webJs.includes("estadoRevision==='fuentes_en_conflicto'")
  && webJs.includes("texto:'fuentes en conflicto'")
  && webJs.includes('fuente.actualizacionLocal.verificadoEl')
  && !webJs.includes("tit.textContent='Ofertas observadas · 27 agosto 2026'"));

paso('el manifiesto declara procedencia no verificada y uso no publicable',
  manifiesto.procedenciaVerificada === false
  && /no verificada/i.test(manifiesto.procedencia)
  && /solo interno/i.test(manifiesto.uso)
  && /no publicable/i.test(manifiesto.uso)
  && manifiesto.urlArtefacto === fixture.fuente.url);
paso('los dos maestros y los tres cortes documentales conservan bytes y SHA-256',
  manifiesto.archivosFuente.length === 5
  && manifiesto.archivosFuente.every((archivo) => {
    const ruta = path.join(RAIZ, archivo.archivo);
    return fs.statSync(ruta).size === archivo.bytes && sha256(ruta) === archivo.hashSha256;
  }));
paso('hay 52 originales y 52 WebP trazables por hash',
  manifiesto.imagenes.length === 52
  && manifiesto.imagenes.every((imagen) => {
    const original = path.join(RAIZ, imagen.archivoOriginal);
    const webp = path.join(RAIZ, imagen.archivoWebp);
    return fs.statSync(original).size === imagen.original.bytes
      && sha256(original) === imagen.original.hashSha256
      && fs.statSync(webp).size === imagen.derivada.bytes
      && sha256(webp) === imagen.derivada.hashSha256;
  }));
paso('todas las derivadas son WebP de 640x440',
  manifiesto.imagenes.every((imagen) => {
    const dimensiones = dimensionesWebp(path.join(RAIZ, imagen.archivoWebp));
    return imagen.derivada.mime === 'image/webp'
      && imagen.derivada.ancho === 640 && imagen.derivada.alto === 440
      && dimensiones.ancho === 640 && dimensiones.alto === 440;
  }));
paso('el fixture y el mapa estatico cubren exactamente las 52 imagenes',
  todas.every((oferta) => oferta.imagen === `ofertas/${oferta.slug}.webp`)
  && todas.every((oferta) =>
    mapa.includes(`require(${JSON.stringify(`../assets/ofertas/${oferta.slug}.webp`)})`))
  && (mapa.match(/\brequire\(/g) || []).length === 52
  && /export function imagenOferta\(slug\)/.test(mapa)
  && /export const IMAGENES_OFERTAS/.test(mapa));

const directorioEditorial = path.dirname(RUTA_MANIFIESTO_EDITORIAL);
const categoriasOfertas = new Set(todas.map((oferta) => oferta.categoria));
const categoriasEditoriales = new Set(manifiestoEditorial.archivos.map((archivo) => archivo.categoria));
paso('el manifiesto editorial v1 cubre exactamente las cuatro categorias del escaparate',
  manifiestoEditorial.versionEsquema === 1
  && manifiestoEditorial.etiquetaVisibleObligatoria === 'Ilustración editorial'
  && manifiestoEditorial.archivos.length === 4
  && categoriasEditoriales.size === 4
  && categoriasOfertas.size === 4
  && [...categoriasOfertas].every((categoria) => categoriasEditoriales.has(categoria)));
paso('los cuatro fallback editoriales conservan bytes, SHA-256 y dimensiones 640x440',
  manifiestoEditorial.archivos.every((archivo) => {
    const ruta = path.join(directorioEditorial, archivo.archivo);
    const dimensiones = dimensionesWebp(ruta);
    return fs.statSync(ruta).size === archivo.bytes
      && sha256(ruta) === archivo.hashSha256
      && dimensiones.ancho === archivo.ancho && dimensiones.alto === archivo.alto
      && archivo.ancho === 640 && archivo.alto === 440
      && archivo.alt.startsWith('Ilustración editorial ');
  }));
paso('el directorio editorial y el mapa Metro usan una lista cerrada de cuatro activos', (() => {
  const nombres = manifiestoEditorial.archivos.map((archivo) => archivo.archivo);
  const encontrados = fs.readdirSync(directorioEditorial).sort();
  const esperados = ['manifest.json', ...nombres].sort();
  return JSON.stringify(encontrados) === JSON.stringify(esperados)
    && nombres.every((nombre) => mapaEditorial.includes(
      `require('../assets/ofertas-editoriales/${nombre}')`))
    && (mapaEditorial.match(/\brequire\('\.\.\/assets\/ofertas-editoriales\/[^']+\.webp'\)/g) || []).length === 4;
})());

console.log(`\n${correctas} correctas, 0 fallidas`);

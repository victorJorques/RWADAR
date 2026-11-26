/* Fallback original de RWAdar para no mostrar fotografías ni marcas del
   artefacto mientras sus derechos sigan sin acreditarse. Los require deben
   permanecer literales para que Metro empaquete solo esta lista cerrada. */
const MANIFIESTO_EDITORIAL = require('../assets/ofertas-editoriales/manifest.json');

const FUENTES_POR_ARCHIVO = Object.freeze({
  'inmobiliario-rwadar.webp': require('../assets/ofertas-editoriales/inmobiliario-rwadar.webp'),
  'tesoro-fondos-rwadar.webp': require('../assets/ofertas-editoriales/tesoro-fondos-rwadar.webp'),
  'materias-primas-rwadar.webp': require('../assets/ofertas-editoriales/materias-primas-rwadar.webp'),
  'capital-privado-rwadar.webp': require('../assets/ofertas-editoriales/capital-privado-rwadar.webp'),
});

/* Ilustración propia de cada ficha (contrato v2). Bloque generado por
   rwadar-editorial-source/ofertas/generar.mjs: no editar a mano. */
// fichas-editoriales:inicio
const FUENTES_POR_FICHA = Object.freeze({
  'oferta-aktionariat.webp': require('../assets/ofertas-editoriales/oferta-aktionariat.webp'),
  'oferta-alterna-bono-digital-mitsui.webp': require('../assets/ofertas-editoriales/oferta-alterna-bono-digital-mitsui.webp'),
  'oferta-amundi-core-stoxx-europe-600-tokenizada.webp': require('../assets/ofertas-editoriales/oferta-amundi-core-stoxx-europe-600-tokenizada.webp'),
  'oferta-apartamento-vacacional-hinterstoder-50.webp': require('../assets/ofertas-editoriales/oferta-apartamento-vacacional-hinterstoder-50.webp'),
  'oferta-blackrock-hkd-digital-liquidity.webp': require('../assets/ofertas-editoriales/oferta-blackrock-hkd-digital-liquidity.webp'),
  'oferta-boss-info.webp': require('../assets/ofertas-editoriales/oferta-boss-info.webp'),
  'oferta-drautalresidenz-paternion.webp': require('../assets/ofertas-editoriales/oferta-drautalresidenz-paternion.webp'),
  'oferta-finexity-bono-2026-2030-serie-b.webp': require('../assets/ofertas-editoriales/oferta-finexity-bono-2026-2030-serie-b.webp'),
  'oferta-fotovoltaica-cohotel.webp': require('../assets/ofertas-editoriales/oferta-fotovoltaica-cohotel.webp'),
  'oferta-fotovoltaica-greenpoint.webp': require('../assets/ofertas-editoriales/oferta-fotovoltaica-greenpoint.webp'),
  'oferta-franklin-onchain-euro-liquidity.webp': require('../assets/ofertas-editoriales/oferta-franklin-onchain-euro-liquidity.webp'),
  'oferta-groma-real-estate-trust.webp': require('../assets/ofertas-editoriales/oferta-groma-real-estate-trust.webp'),
  'oferta-kraken-xstocks.webp': require('../assets/ofertas-editoriales/oferta-kraken-xstocks.webp'),
  'oferta-liqi-creditos-empresas.webp': require('../assets/ofertas-editoriales/oferta-liqi-creditos-empresas.webp'),
  'oferta-local-de-estanco-klagenfurt.webp': require('../assets/ofertas-editoriales/oferta-local-de-estanco-klagenfurt.webp'),
  'oferta-mtbill.webp': require('../assets/ofertas-editoriales/oferta-mtbill.webp'),
  'oferta-prosegur-digital-gold.webp': require('../assets/ofertas-editoriales/oferta-prosegur-digital-gold.webp'),
  'oferta-randhartingergasse-9-viena.webp': require('../assets/ofertas-editoriales/oferta-randhartingergasse-9-viena.webp'),
  'oferta-robinhood-classic-stock-tokens.webp': require('../assets/ofertas-editoriales/oferta-robinhood-classic-stock-tokens.webp'),
  'oferta-securitize-hinc.webp': require('../assets/ofertas-editoriales/oferta-securitize-hinc.webp'),
  'oferta-spiko-letras-del-tesoro-dolar.webp': require('../assets/ofertas-editoriales/oferta-spiko-letras-del-tesoro-dolar.webp'),
  'oferta-spiko-letras-del-tesoro-euro.webp': require('../assets/ofertas-editoriales/oferta-spiko-letras-del-tesoro-euro.webp'),
  'oferta-spiko-smart-cash-euro.webp': require('../assets/ofertas-editoriales/oferta-spiko-smart-cash-euro.webp'),
  'oferta-switzerlend.webp': require('../assets/ofertas-editoriales/oferta-switzerlend.webp'),
  'oferta-tohkn-iber1.webp': require('../assets/ofertas-editoriales/oferta-tohkn-iber1.webp'),
  'oferta-tohkn-mmlti1.webp': require('../assets/ofertas-editoriales/oferta-tohkn-mmlti1.webp'),
  'oferta-tohkn-rncrrev.webp': require('../assets/ofertas-editoriales/oferta-tohkn-rncrrev.webp'),
  'oferta-vivienda-pluddemanngasse-101-graz.webp': require('../assets/ofertas-editoriales/oferta-vivienda-pluddemanngasse-101-graz.webp'),
  'oferta-vivienda-pottendorfer-stra-e-62-wr-neustadt.webp': require('../assets/ofertas-editoriales/oferta-vivienda-pottendorfer-stra-e-62-wr-neustadt.webp'),
  'oferta-vivienda-schwarzer-weg-18-graz.webp': require('../assets/ofertas-editoriales/oferta-vivienda-schwarzer-weg-18-graz.webp'),
  'oferta-vivienda-sonnleithnergasse-2-viena.webp': require('../assets/ofertas-editoriales/oferta-vivienda-sonnleithnergasse-2-viena.webp'),
  'oferta-vivienda-stallhofstra-e-28-gratwein.webp': require('../assets/ofertas-editoriales/oferta-vivienda-stallhofstra-e-28-gratwein.webp'),
});
// fichas-editoriales:fin

const ETIQUETA_EDITORIAL = 'Ilustración editorial';
// El pie que va visible bajo la imagen (la etiqueta solo abre el texto alternativo).
const PIE_EDITORIAL = 'Imágenes ilustrativas, no fotos del activo';
const CATEGORIAS_EDITORIALES = Object.freeze([
  'Inmobiliario',
  'Tesoro y fondos',
  'Materias primas',
  'Acciones y capital privado',
]);

if (MANIFIESTO_EDITORIAL?.versionEsquema !== 2 ||
    MANIFIESTO_EDITORIAL?.etiquetaVisibleObligatoria !== ETIQUETA_EDITORIAL ||
    MANIFIESTO_EDITORIAL?.pieVisibleObligatorio !== PIE_EDITORIAL ||
    !Array.isArray(MANIFIESTO_EDITORIAL?.archivos) ||
    MANIFIESTO_EDITORIAL.archivos.length !== 4 ||
    !Array.isArray(MANIFIESTO_EDITORIAL?.fichas)) {
  throw new Error('El manifiesto de ilustraciones editoriales no cumple el contrato v2');
}

const categoriasVistas = new Set();
const archivosVistos = new Set();
const paresEditoriales = MANIFIESTO_EDITORIAL.archivos.map((entrada) => {
    const fuente = FUENTES_POR_ARCHIVO[entrada.archivo];
    if (!fuente || !CATEGORIAS_EDITORIALES.includes(entrada.categoria) ||
        categoriasVistas.has(entrada.categoria) || archivosVistos.has(entrada.archivo) ||
        typeof entrada.alt !== 'string' || !entrada.alt.startsWith(`${ETIQUETA_EDITORIAL} `) ||
        entrada.ancho !== 640 || entrada.alto !== 440 ||
        !/^[a-f0-9]{64}$/.test(entrada.hashSha256 || '')) {
      throw new Error(`Ilustración editorial no válida: ${entrada.archivo || 'sin archivo'}`);
    }
    categoriasVistas.add(entrada.categoria);
    archivosVistos.add(entrada.archivo);
    return [entrada.categoria, Object.freeze({
      fuente,
      archivo: entrada.archivo,
      alt: entrada.alt,
      etiqueta: MANIFIESTO_EDITORIAL.etiquetaVisibleObligatoria,
      hashSha256: entrada.hashSha256,
    })];
  });
if (CATEGORIAS_EDITORIALES.some((categoria) => !categoriasVistas.has(categoria)) ||
    Object.keys(FUENTES_POR_ARCHIVO).some((archivo) => !archivosVistos.has(archivo))) {
  throw new Error('El manifiesto editorial no cubre exactamente sus cuatro activos');
}
const EDITORIALES_POR_CATEGORIA = Object.freeze(Object.fromEntries(paresEditoriales));

const EDITORIALES_POR_FICHA = new Map(MANIFIESTO_EDITORIAL.fichas.map((entrada) => {
  const fuente = Object.prototype.hasOwnProperty.call(FUENTES_POR_FICHA, entrada?.archivo || '') ? FUENTES_POR_FICHA[entrada.archivo] : null;
  if (!fuente || typeof entrada.slug !== 'string' || entrada.archivo !== `oferta-${entrada.slug}.webp` ||
      typeof entrada.categoria !== 'string' ||
      typeof entrada.alt !== 'string' || !entrada.alt.startsWith(`${ETIQUETA_EDITORIAL} `) ||
      entrada.ancho !== 960 || entrada.alto !== 660 ||
      !/^[a-f0-9]{64}$/.test(entrada.hashSha256 || '')) {
    throw new Error(`Ilustración editorial no válida: ${entrada?.archivo || 'sin archivo'}`);
  }
  return [entrada.slug, Object.freeze({
    fuente,
    archivo: entrada.archivo,
    categoria: entrada.categoria,
    alt: entrada.alt,
    etiqueta: MANIFIESTO_EDITORIAL.etiquetaVisibleObligatoria,
    hashSha256: entrada.hashSha256,
    lugar: typeof entrada.lugar === 'string' ? entrada.lugar : '',
  })];
}));
if (EDITORIALES_POR_FICHA.size !== MANIFIESTO_EDITORIAL.fichas.length ||
    Object.keys(FUENTES_POR_FICHA).length !== EDITORIALES_POR_FICHA.size) {
  throw new Error('El manifiesto editorial y las ilustraciones por ficha no coinciden');
}

export { ETIQUETA_EDITORIAL, MANIFIESTO_EDITORIAL, PIE_EDITORIAL };

export function imagenEditorial(categoria) {
  // Reutilización del activo propio; no añade una foto ni otro origen al manifiesto.
  if (String(categoria || '').trim() === 'Crédito privado') {
    return { ...EDITORIALES_POR_CATEGORIA['Acciones y capital privado'],
      alt: 'Ilustración editorial financiera; no representa un activo concreto' };
  }
  return EDITORIALES_POR_CATEGORIA[String(categoria || '').trim()] || null;
}

/* La de la ficha si existe y sigue en la misma categoría; si no, la de su
   categoría; si tampoco, null (la tarjeta pinta el recuadro con iniciales). */
export function imagenEditorialOferta(oferta) {
  const propia = EDITORIALES_POR_FICHA.get(String(oferta?.slug || ''));
  if (propia && propia.categoria === String(oferta?.categoria || '').trim()) return propia;
  return imagenEditorial(oferta?.categoria);
}

export default EDITORIALES_POR_CATEGORIA;

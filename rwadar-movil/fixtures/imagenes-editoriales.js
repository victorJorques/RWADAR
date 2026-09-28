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

const ETIQUETA_EDITORIAL = 'Ilustración editorial';
const CATEGORIAS_EDITORIALES = Object.freeze([
  'Inmobiliario',
  'Tesoro y fondos',
  'Materias primas',
  'Acciones y capital privado',
]);

if (MANIFIESTO_EDITORIAL?.versionEsquema !== 1 ||
    MANIFIESTO_EDITORIAL?.etiquetaVisibleObligatoria !== ETIQUETA_EDITORIAL ||
    !Array.isArray(MANIFIESTO_EDITORIAL?.archivos) ||
    MANIFIESTO_EDITORIAL.archivos.length !== 4) {
  throw new Error('El manifiesto de ilustraciones editoriales no cumple el contrato v1');
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

export { ETIQUETA_EDITORIAL, MANIFIESTO_EDITORIAL };

export function imagenEditorial(categoria) {
  return EDITORIALES_POR_CATEGORIA[String(categoria || '').trim()] || null;
}

export default EDITORIALES_POR_CATEGORIA;

/* RWAdar · rótulos legibles de las referencias de la documentación («Datos con su fecha»)
   ---------------------------------------------------------------------------------------
   Los expedientes de investigación guardan cada dato con un nombre de campo interno
   («accesoEspana», «minimo», «derecho»…). Ese nombre no es para el lector: en la ficha la
   referencia tiene que decir «Acceso desde España · consulta 01/11/2026», no
   «accesoEspana · consulta 01/11/2026». El lote del 02/11 (preparar-lote.mjs) los subió
   tal cual y las entregas siguientes los arrastraron; la entrega 2026-11-04 los corrigió.

   Diccionario completo: todos los campos que aparecen en los expedientes de
   rwadar-app/data/verificaciones hasta el 04/11/2026. Un campo nuevo sin rótulo hace
   fallar al generador (rotuloCampo) en vez de llegar crudo a la web. */
'use strict';

const ROTULOS_CAMPO = Object.freeze({
  acceso: 'Acceso',
  accesoEspana: 'Acceso desde España',
  accesoEspana_particulares: 'Acceso desde España (particulares)',
  accionistas: 'Accionistas',
  actividad: 'Operaciones recientes',
  afiliacion: 'Vinculación con otras entidades',
  canalCompra: 'Cómo se compra',
  catalogo: 'Catálogo del proveedor',
  circulante: 'En circulación',
  comercializadora: 'Entidad que comercializa',
  comisiones: 'Comisiones',
  conflicto_rentabilidad: 'Rentabilidad: fuentes en conflicto',
  costesKid: 'Costes (KID)',
  custodia: 'Custodia',
  derecho: 'Qué se adquiere',
  descubrimiento: 'Cómo se localizó',
  desistimiento: 'Derecho de desistimiento',
  distribucion: 'Distribución',
  dividendos: 'Dividendos',
  divisa: 'Moneda y tipo de cambio',
  documento: 'Documento',
  documentos: 'Documentos',
  documentosIdioma: 'Idioma de los documentos',
  elegibilidad: 'Quién puede invertir',
  emisor: 'Emisor',
  entidad: 'Entidad que comercializa',
  estado: 'Estado de la oferta',
  fiscalidad: 'Fiscalidad',
  folleto: 'Folleto',
  garantia: 'Garantía',
  gestion: 'Gestión',
  horario: 'Horario',
  jurisdiccionesRegistradas: 'Países donde está registrado',
  kyc: 'Verificación de identidad',
  ley: 'Ley aplicable',
  licencia: 'Licencia',
  mercadoSecundario: 'Mercado secundario',
  mica: 'Reglamento MiCA',
  minimo: 'Mínimo de inversión',
  minimoEmisionOriginal: 'Mínimo en la emisión original',
  moneda: 'Moneda',
  novedad: 'Novedad',
  objetivo: 'Objetivo',
  pasaporteEspana: 'Pasaporte para España',
  patrimonio: 'Patrimonio y partícipes',
  plazo: 'Plazo',
  precio: 'Precio',
  preventa: 'Preventa',
  publicoObjetivo: 'Público objetivo',
  recaudado: 'Recaudado',
  regimen: 'Régimen legal',
  registro: 'Registro',
  registroEspana: 'Registro en España',
  regulacion: 'Regulación',
  rentabilidad: 'Rentabilidad',
  riesgos: 'Riesgos',
  riesgos_contraparte: 'Riesgo de contraparte',
  riesgos_publicidad: 'Riesgos en la publicidad',
  salida: 'Salida',
  salida_instantanea: 'Reembolso inmediato',
  salida_limite: 'Límite de salida',
  seguro: 'Seguro',
  supervision: 'Supervisión',
  tamano: 'Tamaño',
  tipoCliente: 'Tipo de cliente',
  tipoProducto: 'Tipo de producto',
  token: 'Token',
  umbral: 'Umbral mínimo de financiación',
});

// Un nombre interno: una palabra en minúscula, en camelCase o con guiones bajos, sin espacios
// ni tildes. «Salida» o «Mínimo de inversión» no lo son.
const pareceCampo = texto => /^[a-z][a-z0-9]*(?:[A-Z][a-z0-9]*|_[a-z0-9]+)*$/.test(texto);

function rotuloCampo(campo) {
  const rotulo = ROTULOS_CAMPO[campo];
  if (rotulo) return rotulo;
  if (pareceCampo(campo)) throw new Error(`el campo «${campo}» no tiene rótulo en rwadar-app/rotulos-referencias.js`);
  return campo;
}

// «accesoEspana · consulta 01/11/2026» → «Acceso desde España · consulta 01/11/2026». Lo que
// va tras el primer « · » (la fecha) no cambia. Una etiqueta ya legible se devuelve igual.
function etiquetaLegible(etiqueta) {
  const i = etiqueta.indexOf(' · ');
  const cabeza = i < 0 ? etiqueta : etiqueta.slice(0, i);
  return rotuloCampo(cabeza) + (i < 0 ? '' : etiqueta.slice(i));
}

const etiquetaCruda = etiqueta => {
  const i = etiqueta.indexOf(' · ');
  return pareceCampo(i < 0 ? etiqueta : etiqueta.slice(0, i));
};

module.exports = { ROTULOS_CAMPO, rotuloCampo, etiquetaLegible, etiquetaCruda };

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..');
const RUTA_REGISTRO = path.join(
  AQUI, 'data', 'verificaciones', '2026-09-21', 'radar-canonico-26.json');
const RUTA_FIXTURE = path.join(RAIZ, 'rwadar-movil', 'fixtures', 'escaparate-local.json');
const RUTA_MANIFIESTO = path.join(RAIZ, 'rwadar-movil', 'fixtures', 'fuentes-imagenes.json');

const registro = JSON.parse(fs.readFileSync(RUTA_REGISTRO, 'utf8'));
const fixture = JSON.parse(fs.readFileSync(RUTA_FIXTURE, 'utf8'));
const manifiesto = JSON.parse(fs.readFileSync(RUTA_MANIFIESTO, 'utf8'));

let correctas = 0;
function paso(texto, prueba) {
  assert.ok(prueba, texto);
  correctas += 1;
  console.log(`  OK    ${texto}`);
}

function conteo(registros, selector) {
  return registros.reduce((resultado, entrada) => {
    const clave = selector(entrada);
    resultado[clave] = (resultado[clave] || 0) + 1;
    return resultado;
  }, {});
}

function sha256(ruta) {
  return createHash('sha256').update(fs.readFileSync(ruta)).digest('hex');
}

function fuenteHttps(fuente) {
  try {
    return new URL(fuente.url).protocol === 'https:';
  } catch {
    return false;
  }
}

function idsReferenciados(plataforma) {
  return [
    ...plataforma.estadoOperativo.fuentes,
    ...plataforma.licenciaRegistro.fuentes,
    ...plataforma.acceso.fuentes,
    ...plataforma.alertasCriticas.flatMap((alerta) => alerta.fuentes),
  ];
}

console.log('=== RADAR CANÓNICO LOCAL · 26 PLATAFORMAS ===');

paso('el registro es local, no publicable y está fechado el 21-09-2026',
  registro.version === 1
  && registro.verificadoEl === '2026-09-21'
  && registro.publicable === false
  && /no sustituye/i.test(registro.alcance)
  && /no las rejuvenece/i.test(registro.politicaFechaCanonica));

const slugsRegistro = registro.plataformas.map(({ slug }) => slug);
const slugsFixture = fixture.plataformas.map(({ slug }) => slug);
paso('clasifica exactamente las mismas 26 plataformas canónicas, sin duplicados',
  registro.plataformas.length === 26
  && new Set(slugsRegistro).size === 26
  && slugsRegistro.every((slug) => slugsFixture.includes(slug))
  && slugsFixture.every((slug) => slugsRegistro.includes(slug)));

const idsFuentes = registro.fuentes.map(({ id }) => id);
paso('las 69 fuentes son primarias, HTTPS, únicas y fechadas',
  registro.fuentes.length === 69
  && new Set(idsFuentes).size === 69
  && registro.fuentes.every((fuente) => fuente.primaria === true
    && fuente.consultadaEl === registro.verificadoEl
    && fuenteHttps(fuente)
    && ['empresa', 'regulador', 'documento_legal', 'folleto_regulatorio'].includes(fuente.tipo)));

const referencias = registro.plataformas.flatMap(idsReferenciados);
paso('toda referencia de plataforma resuelve y toda fuente tiene uso trazable',
  referencias.every((id) => idsFuentes.includes(id))
  && idsFuentes.every((id) => referencias.includes(id)));

paso('las fechas canónicas antiguas se conservan y la fecha nueva queda en una capa separada',
  fixture.plataformas.every((plataforma) => {
    const verificada = registro.plataformas.find(({ slug }) => slug === plataforma.slug);
    return plataforma.verificada_el === verificada.fechaCanonicaConservada
      && plataforma.verificada_el !== registro.verificadoEl
      && plataforma.verificacionLocal.verificadoEl === registro.verificadoEl
      && plataforma.verificacionLocal.conservaFechaCanonica === true;
  }));

const operacion = conteo(registro.plataformas, (p) => p.estadoOperativo.estado);
paso('el barrido distingue 25 presencias observadas y 1 estado no verificable',
  operacion.observada === 25 && operacion.no_verificable === 1);

const licencias = conteo(registro.plataformas, (p) => p.licenciaRegistro.estado);
paso('licencia y registro se expresan por nivel de evidencia, no como un sí genérico',
  licencias.confirmada_regulador === 13
  && licencias.confirmada_documento_producto === 3
  && licencias.no_aplica_plataforma === 4
  && licencias.no_verificable === 4
  && licencias.sin_registro_declarado === 2);

const accesos = conteo(registro.plataformas, (p) => p.acceso.estado);
paso('el acceso conserva incertidumbre y condiciones explícitas',
  accesos.confirmado_condicionado === 18
  && accesos.no_aplica_plataforma === 3
  && accesos.no_verificable === 5);

paso('cada fila incluye al menos una alerta crítica respaldada',
  registro.plataformas.every((plataforma) => plataforma.alertasCriticas.length > 0
    && plataforma.alertasCriticas.every((alerta) => alerta.fuentes.length > 0)));

const porSlug = Object.fromEntries(registro.plataformas.map((p) => [p.slug, p]));
paso('las contradicciones y separaciones de entidad más sensibles quedan bloqueadas',
  porSlug.swarm.alertasCriticas.some((a) => a.codigo === 'no_minorista')
  && porSlug.figure.alertasCriticas.some((a) => a.codigo === 'marca_multi_entidad')
  && porSlug.fireblocks.alertasCriticas.some((a) => a.codigo === 'licencia_entidad_especifica')
  && porSlug.reental.alertasCriticas.some((a) => a.codigo === 'emision_no_licencia_plataforma')
  && porSlug.inx.alertasCriticas.some((a) => a.codigo === 'no_nasdaq')
  && porSlug.midas.alertasCriticas.some((a) => a.codigo === 'folleto_vigente_no_confirmado'));

paso('proveedores tecnológicos y protocolos no heredan licencias de clientes o vehículos',
  ['blocksquare', 'centrifuge', 'tokeny'].every((slug) =>
    porSlug[slug].licenciaRegistro.estado === 'no_aplica_plataforma')
  && porSlug.lofty.licenciaRegistro.estado === 'sin_registro_declarado'
  && porSlug['maple-finance'].licenciaRegistro.estado === 'sin_registro_declarado');

paso('el registro no introduce ni atribuye imágenes',
  !Object.keys(registro).includes('imagenes')
  && registro.fuentes.every((fuente) => !/\.(?:avif|gif|jpe?g|png|svg|webp)(?:$|[?#])/i.test(fuente.url)));

paso('el fixture expone metadatos locales y 26 verificaciones autocontenidas',
  fixture.fuente.actualizacionRadarLocal?.verificadoEl === '2026-09-21'
  && fixture.fuente.actualizacionRadarLocal?.publicable === false
  && fixture.fuente.actualizacionRadarLocal?.plataformas === 26
  && fixture.fuente.actualizacionRadarLocal?.fuentesPrimarias === 69
  && fixture.plataformas.every((plataforma) =>
    plataforma.verificacionLocal.estadoOperativo.fuentes.every((fuente) => fuente.primaria === true)
    && plataforma.verificacionLocal.licenciaRegistro.fuentes.every((fuente) => fuente.primaria === true)
    && plataforma.verificacionLocal.acceso.fuentes.every((fuente) => fuente.primaria === true)));

const entradaManifiesto = manifiesto.archivosFuente.find(({ archivo }) =>
  archivo === 'rwadar-app/data/verificaciones/2026-09-21/radar-canonico-26.json');
paso('el manifiesto fija bytes y SHA-256 del registro de verificación',
  Boolean(entradaManifiesto)
  && entradaManifiesto.bytes === fs.statSync(RUTA_REGISTRO).size
  && entradaManifiesto.hashSha256 === sha256(RUTA_REGISTRO));

console.log(`\n${correctas} correctas, 0 fallidas`);

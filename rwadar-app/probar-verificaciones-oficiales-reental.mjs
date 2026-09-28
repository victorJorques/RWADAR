import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ARCHIVO = path.join(
  AQUI,
  'data',
  'verificaciones',
  '2026-09-21',
  'reental-prosegur-alius.json',
);
const bruto = fs.readFileSync(ARCHIVO, 'utf8');
const registro = JSON.parse(bruto);

let correctas = 0;
function paso(texto, prueba) {
  assert.ok(prueba, texto);
  correctas += 1;
  console.log(`  OK    ${texto}`);
}

const ofertas = new Map(registro.ofertas.map((oferta) => [oferta.slug, oferta]));
const fuentes = new Map(registro.fuentes.map((fuente) => [fuente.id, fuente]));
const estadosPermitidos = new Set(['observado', 'calculado', 'no_verificable']);
const dominiosOficiales = new Set([
  'aliuscap.com',
  'app.prosegurdigitalgold.com',
  'app.reental.co',
  'boe.es',
  'casadeouteiro.com',
  'es.prosegurdigitalgold.com',
  'www.boe.es',
  'www.cnmv.es',
  'www.reental.co',
]);

function objetosConEstado(valor, acumulado = []) {
  if (!valor || typeof valor !== 'object') return acumulado;
  if (!Array.isArray(valor) && Object.hasOwn(valor, 'estado')) acumulado.push(valor);
  for (const hijo of Object.values(valor)) objetosConEstado(hijo, acumulado);
  return acumulado;
}

function referenciasFuente(valor, claves = []) {
  if (!valor || typeof valor !== 'object') return claves;
  if (!Array.isArray(valor)) {
    if (typeof valor.fuente === 'string') claves.push(valor.fuente);
    if (typeof valor.fuenteLegal === 'string') claves.push(valor.fuenteLegal);
    if (Array.isArray(valor.fuentes)) {
      claves.push(...valor.fuentes.filter((fuente) => typeof fuente === 'string'));
    }
  }
  for (const hijo of Object.values(valor)) referenciasFuente(hijo, claves);
  return claves;
}

console.log('=== VERIFICACIONES OFICIALES · REENTAL / PROSEGUR / ALIUS ===');

paso('el registro es JSON local, fechado y explícitamente no publicable',
  registro.version === 1
  && registro.verificadoEl === '2026-09-21'
  && registro.publicable === false
  && /Solo local/.test(registro.uso)
  && /no debe importarse automáticamente/.test(registro.uso));

paso('contiene exactamente las cuatro ofertas auditadas',
  ofertas.size === 4
  && ['caribe-1', 'caribe-2', 'prosegur-digital-gold', 'casa-de-outeiro']
    .every((slug) => ofertas.has(slug)));

paso('todos los hechos tipados distinguen observado, calculado o no verificable',
  objetosConEstado(registro).length >= 20
  && objetosConEstado(registro).every((dato) => estadosPermitidos.has(dato.estado)));

paso('todas las fuentes son HTTPS, primarias, oficiales y consultadas en la fecha del registro',
  fuentes.size === registro.fuentes.length
  && registro.fuentes.every((fuente) => {
    const url = new URL(fuente.url);
    return url.protocol === 'https:'
      && dominiosOficiales.has(url.hostname)
      && fuente.primaria === true
      && fuente.consultadaEl === registro.verificadoEl;
  }));

paso('cada referencia interna de fuente resuelve a una evidencia declarada',
  referenciasFuente(registro).every((id) => fuentes.has(id)));

for (const slug of ['caribe-1', 'caribe-2']) {
  const oferta = ofertas.get(slug);
  paso(`${oferta.titulo} no queda falsamente marcada como abierta`,
    oferta.disponibilidad.estado === 'no_verificable'
    && oferta.disponibilidad.abiertaVerificada === false
    && oferta.disponibilidad.ttl === 'P0D'
    && oferta.inversionMinima.estado === 'no_verificable'
    && oferta.inversionMinima.valor === null
    && oferta.elegibilidadEspana.estado === 'no_verificable');
}

const prosegur = ofertas.get('prosegur-digital-gold');
paso('Prosegur conserva la observación, pero su precio dinámico caduca inmediatamente',
  prosegur.disponibilidad.estado === 'observado'
  && prosegur.disponibilidad.valor === 'emitida_y_comprable'
  && prosegur.precio.estado === 'observado'
  && prosegur.precio.valor === 126.65
  && prosegur.precio.dinamico === true
  && prosegur.precio.ttl === 'PT0M');

paso('Prosegur registra mínimo, spreads y ausencia de rentabilidad garantizada',
  prosegur.inversionMinima.valor === 1
  && prosegur.comisiones.compraSobreLbmaPorcentaje === 4
  && prosegur.comisiones.recompraBajoLbmaPorcentaje === 6
  && prosegur.rentabilidad.valor === null
  && /No existe rentabilidad fija ni garantizada/.test(prosegur.rentabilidad.detalle));

const outeiro = ofertas.get('casa-de-outeiro');
const porcentaje = Number(((outeiro.captacion.recaudado / outeiro.captacion.objetivo) * 100).toFixed(2));
paso('Casa de Outeiro conserva cifras observadas con vigencia diaria',
  outeiro.disponibilidad.estado === 'observado'
  && outeiro.disponibilidad.valor === 'campaña_abierta'
  && outeiro.disponibilidad.ttl === 'P1D'
  && outeiro.captacion.estado === 'observado'
  && outeiro.captacion.ttl === 'P1D'
  && outeiro.captacion.recaudado === 1082000
  && outeiro.captacion.objetivo === 3220000
  && outeiro.captacion.tokensVendidos === 43280);

paso('el porcentaje de Casa de Outeiro está marcado como cálculo reproducible',
  outeiro.porcentajeCaptado.estado === 'calculado'
  && outeiro.porcentajeCaptado.valor === porcentaje
  && outeiro.porcentajeCaptado.formula === 'recaudado / objetivo * 100'
  && outeiro.plazo.fechaCierreEstado === 'no_verificable'
  && outeiro.plazo.fechaCierre === null);

paso('ninguna oferta atribuye a RWAdar derechos de imagen inexistentes',
  registro.ofertas.every((oferta) => oferta.derechosImagen.estado === 'no_verificable'
    && oferta.derechosImagen.publicacionAutorizada === false
    && fuentes.has(oferta.derechosImagen.fuenteLegal)));

paso('el registro no contiene secretos ni instrucciones de escritura remota',
  !/(?:service_role|anon_key|authorization\s*:|bearer\s+|supabase\.co\/rest)/i.test(bruto)
  && !/(?:insert\s+into|update\s+public\.|delete\s+from|wrangler|netlify|eas\s+submit)/i.test(bruto));

console.log(`\n${correctas} correctas, 0 fallidas`);

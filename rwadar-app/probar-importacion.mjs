import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  esUrlHttpsPublica,
  validarArchivo,
  validarContenido,
} from './validar-importacion.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..');
const LOTE = path.join(AQUI, 'data', 'importaciones', 'escaparate-2026-08-27', 'lote.json');
const ESQUEMA = path.join(AQUI, 'esquemas', 'oferta-importacion.schema.json');

let correctas = 0;
function paso(texto, prueba) {
  assert.ok(prueba, texto);
  correctas += 1;
  console.log(`  OK    ${texto}`);
}

function baseValida() {
  const lote = {
    $schema: '../../../esquemas/oferta-importacion.schema.json',
    versionEsquema: 1,
    idLote: 'prueba-segura-2026-09-21',
    estado: 'aprobado',
    publicable: true,
    uso: 'Prueba local sintética con evidencia y derechos completos.',
    fuente: {
      tipo: 'exportacion-oficial',
      url: 'https://reental.co/catalogo',
      titulo: 'Catálogo oficial de prueba',
      barridoEl: '2026-09-21',
      capturadoEl: '2026-09-21T09:00:00Z',
      verificacionIndependiente: true,
    },
    catalogo: {
      ruta: 'catalogo.json', sha256: 'a'.repeat(64), bytes: 1,
      formato: 'rwadar-escaparate-v1',
    },
    imagenes: {
      manifiestoRuta: 'imagenes.json', sha256: 'b'.repeat(64), bytes: 1,
      duplicadasEnLote: false, derechosVerificados: true,
    },
    proveedores: {
      ruta: 'proveedores.sql', sha256: 'c'.repeat(64), bytes: 1,
      formato: 'rwadar-seed-sql',
    },
    politica: {
      maxAntiguedadBarridoDias: 7,
      exigirFuentePrimaria: true,
      exigirDerechosImagen: true,
      permitirFechaImportacionComoVerificacion: false,
    },
    evidencias: [{
      slug: 'activo-prueba',
      fuentes: [{
        tipo: 'oferta',
        url: 'https://reental.co/properties/activo-prueba',
        titulo: 'Ficha oficial del activo',
        consultadaEl: '2026-09-21',
        primaria: true,
      }],
    }],
    derechosImagenes: [{
      slug: 'activo-prueba',
      fuenteUrl: 'https://reental.co/media/activo-prueba',
      titular: 'Emisor de prueba',
      licencia: 'Permiso escrito para RWAdar',
      publicacionAutorizada: true,
      verificadaEl: '2026-09-21',
    }],
  };
  const catalogo = {
    schema_version: 1,
    source: {
      url: lote.fuente.url,
      title: lote.fuente.titulo,
      sweep_date: lote.fuente.barridoEl,
      captured_at: lote.fuente.capturadoEl,
      notice: 'Exportación oficial de prueba.',
    },
    freshness_ttl_days: { reental: 7 },
    offers: [{
      slug: 'activo-prueba',
      title: 'Activo de prueba',
      platform_slug: 'reental',
      url: 'https://reental.co/properties/activo-prueba',
      verified_at: '2026-09-21',
      ttl_days: 7,
      image_index: 1,
      image_source_file: 'activo-prueba.jpg',
    }],
    secondary_market: [],
    excluded_offers: [],
  };
  const manifiestoImagenes = {
    procedenciaVerificada: true,
    uso: 'Publicación autorizada',
    imagenes: [{ slug: 'activo-prueba', archivoOriginal: 'referencia/activo-prueba.jpg' }],
  };
  return { lote, catalogo, manifiestoImagenes, proveedoresCanonicos: new Set(['reental']) };
}

function codigos(documentos) {
  return new Set(validarContenido({
    ...documentos,
    hoy: new Date('2026-09-21T12:00:00Z'),
  }).map((entrada) => entrada.codigo));
}

console.log('=== INTAKE FAIL-CLOSED ===');

const esquema = JSON.parse(fs.readFileSync(ESQUEMA, 'utf8'));
paso('el contrato JSON es cerrado y versionado',
  esquema.$id === 'urn:rwadar:esquema:oferta-importacion:1'
  && esquema.additionalProperties === false
  && esquema.required.includes('evidencias')
  && esquema.required.includes('derechosImagenes'));

paso('una entrada sintética completa supera la compuerta', codigos(baseValida()).size === 0);

const rancia = baseValida();
rancia.catalogo.offers[0].verified_at = '2026-09-01';
rancia.catalogo.offers[0].ttl_days = 1;
paso('rechaza una oferta rancia', codigos(rancia).has('OFERTA_RANCIA'));

const sinFuente = baseValida();
sinFuente.lote.evidencias = [];
paso('rechaza una oferta sin fuente primaria explícita', codigos(sinFuente).has('FUENTE_PRIMARIA_AUSENTE'));

const sinDerechos = baseValida();
sinDerechos.lote.derechosImagenes = [];
paso('rechaza una imagen sin derechos comprobados', codigos(sinDerechos).has('DERECHOS_IMAGEN_AUSENTES'));

const proveedorDesconocido = baseValida();
proveedorDesconocido.catalogo.offers[0].platform_slug = 'proveedor-inventado';
paso('rechaza un proveedor ajeno al radar canónico', codigos(proveedorDesconocido).has('PROVEEDOR_DESCONOCIDO'));

const urlPrivada = baseValida();
urlPrivada.catalogo.offers[0].url = 'https://127.0.0.1/oferta';
paso('rechaza URL privada, local o insegura',
  codigos(urlPrivada).has('URL_INSEGURA')
  && !esUrlHttpsPublica('http://reental.co/oferta')
  && !esUrlHttpsPublica('https://10.0.0.1/oferta')
  && !esUrlHttpsPublica('https://localhost/oferta'));

const duplicada = baseValida();
duplicada.catalogo.secondary_market.push({ ...duplicada.catalogo.offers[0] });
paso('rechaza slugs duplicados entre principal y secundario', codigos(duplicada).has('DUPLICADO_SLUG'));

const fechaArtificial = baseValida();
fechaArtificial.lote.fuente.barridoEl = '2026-09-20';
fechaArtificial.catalogo.source.sweep_date = '2026-09-20';
paso('rechaza una verificación posterior al barrido', codigos(fechaArtificial).has('FECHA_ARTIFICIAL'));

const campoInventado = baseValida();
campoInventado.lote.privilegio = 'colar';
paso('rechaza propiedades no declaradas en el contrato', codigos(campoInventado).has('ESQUEMA_CAMPO_DESCONOCIDO'));

const staging = await validarArchivo({
  loteRuta: LOTE,
  hoy: new Date('2026-09-21T12:00:00Z'),
});
const bloqueos = new Set(staging.errores.map((entrada) => entrada.codigo));
paso('el snapshot real queda explícitamente bloqueado y no publicable',
  staging.ok === false
  && bloqueos.has('LOTE_NO_PUBLICABLE')
  && bloqueos.has('BARRIDO_RANCIO')
  && bloqueos.has('FUENTE_PRIMARIA_AUSENTE')
  && bloqueos.has('DERECHOS_IMAGEN_AUSENTES')
  && bloqueos.has('PROVEEDOR_DESCONOCIDO'));

const carpetaStaging = path.dirname(LOTE);
const extensionesImagen = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
paso('el staging referencia las imágenes y no duplica ningún binario',
  fs.readdirSync(carpetaStaging).every((nombre) => !extensionesImagen.has(path.extname(nombre).toLowerCase()))
  && JSON.parse(fs.readFileSync(path.join(carpetaStaging, 'manifiesto.json'), 'utf8')).imagenesCopiadas === 0);

const cli = spawnSync(process.execPath, [
  path.join(AQUI, 'validar-importacion.mjs'), '--hoy', '2026-09-21',
], { cwd: RAIZ, encoding: 'utf8' });
paso('la CLI usa dry-run por defecto y devuelve fallo ante el staging bloqueado',
  cli.status === 1
  && /DRY-RUN LOCAL/.test(cli.stdout)
  && /NO PUBLICABLE/.test(cli.stdout)
  && /sin red, sin SQL y sin modificar el catálogo/i.test(cli.stdout));

const aplicar = spawnSync(process.execPath, [
  path.join(AQUI, 'validar-importacion.mjs'), '--apply',
], { cwd: RAIZ, encoding: 'utf8' });
paso('la herramienta no contiene una ruta de aplicación remota',
  aplicar.status === 2 && /solo admite dry-run local/i.test(aplicar.stderr));

console.log(`\n${correctas} correctas, 0 fallidas`);

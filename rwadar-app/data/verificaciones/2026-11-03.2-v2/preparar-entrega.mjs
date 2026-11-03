// Segunda entrega documental del 03/11/2026 (revisión «2026-11-03.2») sobre la
// publicada del mismo día (a4792f79). Preparación LOCAL: sin red ni servicios remotos.
//
//   node rwadar-app/data/verificaciones/2026-11-03.2-v2/preparar-entrega.mjs
//
// Dos cambios, por decisión de Víctor del 03/11:
// 1. Cifras visibles 7 días en vez de 1 (vigenciaDias 7 en las 23 ofertas,
//    contando desde su comprobación del 02/11: hasta el 09/11, igual que el lote).
// 2. Tres referencias en castellano en las cinco principales que muestran
//    mínimo, acceso desde España y salida en la tarjeta, redactadas a partir de
//    los datos comprobados el 01/11 y revisados de forma independiente el 02/11.
// Radar, manifiesto, cifras, avisos y fechas de comprobación no cambian.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../../../..');
const require = createRequire(import.meta.url);
const { cargarFuentesLocales, construirSqlImportacion } = require('../../../catalogo-publico.js');
const FECHA = '2026-11-03', REVISION = '2026-11-03.2', DESDE = '2026-11-03';
const PREVIA = 'a4792f79-0f4d-361b-a14d-3eeb95bf7499'; // publicada; leída como visitante el 03/11
const CONSULTA = '2026-11-02'; // revisión independiente de estos datos
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const escribir = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); };
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base = path.resolve(DIR, `../${DESDE}-v2`);

const previa = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: DESDE, versionEsquema: 2 }));
assert.equal(previa.revisionId, PREVIA, 'la base local no es la revisión publicada');
for (const nombre of ['radar-canonico-26.json', 'manifiesto-catalogo.json']) {
  fs.copyFileSync(path.join(base, nombre), path.join(DIR, nombre));
}
const escaparate = leer(path.join(base, 'escaparate-publicacion.json'));
for (const o of escaparate.ofertas) o.vigenciaDias = 7;
escribir(path.join(DIR, 'escaparate-publicacion.json'), escaparate);

const ALCANCE = 'Redacción en castellano del dato comprobado en la fuente el 01/11/2026 y revisado de forma independiente el 02/11/2026.';
const R = (etiqueta, valor, fuente, fechaDato, nota) => ({ etiqueta, valor, fechaDato, fechaConsulta: CONSULTA, fuente,
  alcance: `${ALCANCE} ${nota}`.trim() });
const SPIKO_FOLLETO = 'https://cdn.spiko.finance/legal_docs/EN/Prospectus_Spiko_SICAV_EN.pdf';
const SPIKO_DISPONIBILIDAD = 'https://docs.spiko.io/documentation/product_overview/fund_availability';
const ESPANA_KYC = 'Disponible para residentes en España tras el alta y la verificación (KYC) del proveedor.';
const NUEVAS = {
  'spiko-letras-del-tesoro-euro': [
    R('Mínimo de inversión (clase EUTBL)', 'Desde 1 €', SPIKO_FOLLETO, '2026-09-01', 'Suscripción inicial mínima de 1 EUR de la clase EUTBL (folleto de la SICAV); otras clases pueden tener otro mínimo.'),
    R('Acceso desde España', ESPANA_KYC, SPIKO_DISPONIBILIDAD, '2026-10-23', 'Tabla de disponibilidad del proveedor: España marcada; no se admiten personas estadounidenses.'),
    R('Reembolso', 'Diario en días hábiles, con corte a las 11:30 (hora de París); puede limitarse si se pide más del 10 % del fondo',
      'https://cdn.spiko.finance/legal_docs/ES/KID_EUTBL_ES.pdf', '2026-09-01', 'KID en español y folleto.'),
  ],
  'spiko-letras-del-tesoro-dolar': [
    R('Mínimo de inversión', '1 USD', SPIKO_FOLLETO, '2026-09-01', 'Clase USD; se puede depositar en euros con conversión.'),
    R('Acceso desde España', ESPANA_KYC, SPIKO_DISPONIBILIDAD, '2026-10-23', 'Tabla de disponibilidad del proveedor: columna T-Bills Dollar marcada para España.'),
    R('Reembolso', 'Diario en días hábiles de Francia y EE. UU., con corte a las 11:30 (hora de París)', SPIKO_FOLLETO, '2026-09-01',
      'Folleto de la SICAV y KID de la clase USD.'),
  ],
  'robinhood-classic-stock-tokens': [
    R('Mínimo de inversión', 'Desde 1 €', 'https://robinhood.com/eu/en/invest', '2026-11-01', 'Web del proveedor; el KID no fija mínimo.'),
    R('Acceso desde España', 'Disponible para residentes en España: Robinhood Europe está inscrita en la CNMV para operar en España (libre prestación, n.º 5299).',
      'https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5299', '2025-04-21', 'Registro de la CNMV y comunicado del proveedor del 22/06/2026.'),
    R('Salida', 'Cierras la posición con Robinhood Europe (24/5 según su web; el horario ampliado no siempre está disponible); el cierre puede suspenderse',
      'https://cdn.robinhood.com/assets/robinhood/legal/stock_tokens_kid_eu.pdf', '2026-07-01', 'KID de los Classic Stock Tokens.'),
  ],
  'prosegur-digital-gold': [
    R('Mínimo de inversión', '1 gramo de oro', 'https://www.prosegurcrypto.com/digital-gold', '2026-11-01', 'Web del producto.'),
    R('Acceso desde España', 'Disponible para clientes residentes en España; las operaciones se liquidan en euros.',
      'https://app.prosegurdigitalgold.com/#/terms-service', '2026-07-08', 'Condiciones del servicio del 08/07/2026.'),
    R('Reembolso', 'Solo recompra por Prosegur; normalmente de 1 a 7 días hábiles, y puede suspenderse',
      'https://app.prosegurdigitalgold.com/#/terms-service', '2026-07-08', 'Condiciones del servicio del 08/07/2026, §§6.4 y 6.7.'),
  ],
  aktionariat: [
    R('Mínimo de inversión', '500 CHF por transferencia bancaria', 'https://shares.aktionariat.com/api/brokerbotsettings?ticker=DAKS', null,
      'Configuración pública de compra del emisor.'),
    R('Acceso desde España', 'Disponible para residentes en Suiza y el Espacio Económico Europeo, con un tope total de 100.000 € para el EEE.',
      'https://www.aktionariat.com/disclaimer', null, 'Aviso legal del emisor; no se publica cuánto queda del tope.'),
    R('Salida', 'Venta solo a otros accionistas; el emisor no recompra', 'https://shares.aktionariat.com/trade', '2026-11-01',
      'Libro de órdenes público del emisor.'),
  ],
};
const documentos = leer(path.join(base, 'documentacion-ofertas.json'));
for (const [slug, refs] of Object.entries(NUEVAS)) {
  const doc = documentos[slug];
  assert.ok(doc, slug);
  for (const r of refs) {
    assert.ok(/^https:\/\//.test(r.fuente), `${slug}: fuente HTTPS`);
    doc.referencias.push(r);
    if (!doc.fuentes.includes(r.fuente)) doc.fuentes.push(r.fuente);
  }
  doc.revisadaEl = FECHA;
}
const CSP = /<style\b|\sstyle\s*=|\son[a-z]+\s*=|<script/i;
assert.ok(!CSP.test(JSON.stringify(documentos)) && !CSP.test(JSON.stringify(escaparate)), 'texto que la compuerta CSP rechazaría');
escribir(path.join(DIR, 'documentacion-ofertas.json'), documentos);
escribir(path.join(DIR, `contraste-${REVISION}.json`), { tipo: 'entrega_documental', fecha: FECHA, etiqueta: REVISION, revisionAnterior: PREVIA,
  decision: 'Víctor, 03/11/2026: cifras visibles 7 días; tarjetas con mínimo, acceso desde España y salida en castellano.',
  vigenciaDias: { antes: 1, despues: 7, desde: '2026-11-02', hasta: '2026-11-09' },
  referenciasNuevas: Object.fromEntries(Object.entries(NUEVAS).map(([s, r]) => [s, r.length])),
  copiasLiterales: ['radar-canonico-26.json', 'manifiesto-catalogo.json'] });

const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: REVISION, versionEsquema: 2 }));
const destino = path.join(ROOT, `rwadar-app/data/importaciones/catalogo-${REVISION}-v2`);
escribir(path.join(destino, 'catalogo.sql'), nueva.sql);
const guarda = `do $guarda$
declare actual uuid; retirada boolean;
begin
  select revision_id into actual from rwadar_catalogo.publicacion_v2 where unica for update;
  if actual is null or actual not in ('${PREVIA}'::uuid, '${nueva.revisionId}'::uuid) then
    raise exception 'Publicación distinta de la revisión anterior prevista: %. No aplicar este lote.', actual;
  end if;
  select retirado into retirada from public.catalogo_publicacion where unica for update;
  if retirada is distinct from false then
    raise exception 'Catálogo retirado o control ausente: este lote no autoriza reactivarlo.';
  end if;
  if current_date < date '${FECHA}' then raise exception 'Entrega documental futura'; end if;
  if exists (select 1 from rwadar_catalogo.revisiones where id = '${nueva.revisionId}'::uuid
    and (contenido_sha256 <> '${nueva.hash}' or estado = 'retirada')) then
    raise exception 'La revisión destino existe con otra identidad o está retirada';
  end if;
end $guarda$;
`;
const aprobar = `do $aprobar$
declare v uuid := '${nueva.revisionId}';
begin
  if (select count(*) from rwadar_catalogo.plataformas where revision_id = v) <> 26
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v) <> 23
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'principales') <> 6
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'secundario') <> 14
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'en_camino') <> 3 then
    raise exception 'Catálogo incompleto: se conserva el lote anterior';
  end if;
  update rwadar_catalogo.revisiones set estado = 'aprobada', aprobada_el = now(),
    aprobada_referencia = 'Segunda entrega documental del 03/11/2026: cifras visibles 7 días y referencias en castellano de mínimo, acceso desde España y salida; datos y fechas de comprobación sin cambios. Decisión y autorización de Víctor (03/11).'
    where id = v and estado = 'borrador';
  if not exists (select 1 from rwadar_catalogo.revision_publicable_v2 where id = v) then
    raise exception 'Entrega no publicable: se deshace la transacción completa';
  end if;
end $aprobar$;
`;
escribir(path.join(destino, 'aplicar-y-aprobar.sql'),
  '-- Segunda entrega documental del 03/11/2026 (2026-11-03.2) sobre la revisión del mismo día. Autorizada por Víctor.\n' +
  '-- Cifras visibles 7 días y referencias en castellano; no renueva radar ni cifras.\n' +
  nueva.sql.replace('-- El lote entra como BORRADOR. Este fichero nunca lo aprueba ni lo publica.',
    '-- Este aplicador importa y aprueba al final, únicamente si pasan todas las guardas.')
    .replace('begin;', 'begin isolation level serializable;\n' + guarda)
    .replace(/commit;\n$/, aprobar + 'commit;\n'));
escribir(path.join(destino, 'revision.json'), { versionEsquema: 2, revisionId: nueva.revisionId, hash: nueva.hash,
  revisionAnterior: PREVIA, revisionAnteriorComprobadaEnRemoto: true, fechaEntregaDocumental: FECHA, etiqueta: REVISION, fechaRadar: '2026-11-02',
  plataformas: 26, ofertas: 23, colecciones: { principales: 6, secundario: 14, en_camino: 3 },
  vigenciaDias: 7, referenciasNuevas: 15, nuevasAltas: 0, estado: 'borrador', aplicadoEnRemoto: false, publicacionWeb: false });
console.log(JSON.stringify({ revisionId: nueva.revisionId, previa: PREVIA, sha256: sha(path.join(destino, 'aplicar-y-aprobar.sql')) }));

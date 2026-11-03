// Cuarta entrega del 03/11/2026 (revisión «2026-11-03.4»): alta de Kraken xStocks
// por decisión editorial de Víctor del 03/11 («si es una gran oportunidad, mira a
// ver cómo lo puedes incluir… apáñate»). Preparación LOCAL: sin red ni servicios remotos.
//
//   node rwadar-app/data/verificaciones/2026-11-03.4-v2/preparar-entrega.mjs
//
// Parte de la publicada (fab6d2e4, entrega 2026-11-03.3) y solo añade una ficha.
// La revisión independiente del 03/11 (2026-11-03.3-v2/revision-independiente/
// kraken-xstocks.md y su addenda) comprobó que Kraken la vende a clientes de la UE.
// Las condiciones finales del emisor solo citan Liechtenstein y Suiza como países
// de oferta. Víctor decidió publicarla diciéndolo con claridad: la tarjeta lo avisa
// en primer lugar y aplica los demás cambios obligatorios de aquella revisión. No
// se cita el KID (el canal donde se leyó no está enlazado por una página oficial).
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
const FECHA = '2026-11-03', REVISION = '2026-11-03.4', DESDE = '2026-11-03.3';
const FES = '03/11/2026';
const PREVIA = 'fab6d2e4-0f37-2e3f-4aa8-f027d73f88f6'; // publicada; leída como visitante el 03/11
const SLUG = 'kraken-xstocks';
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const escribir = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); };
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base = path.resolve(DIR, `../${DESDE}-v2`);

const previa = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: DESDE, versionEsquema: 2 }));
assert.equal(previa.revisionId, PREVIA, 'la base local no es la revisión publicada');
fs.copyFileSync(path.join(base, 'radar-canonico-26.json'), path.join(DIR, 'radar-canonico-26.json'));
const escaparate = leer(path.join(base, 'escaparate-publicacion.json'));
const documentos = leer(path.join(base, 'documentacion-ofertas.json'));
assert.ok(!escaparate.ofertas.some(o => o.slug === SLUG), 'el alta ya existe');

// ---------------------------------------------------------------- fuentes oficiales
const F = {
  oferta: 'https://eu.kraken.com/xstocks',
  riesgos: 'https://eu.kraken.com/legal/risk-disclosure',
  comisiones: 'https://www.kraken.com/features/fee-schedule',
  faq: 'https://support.kraken.com/articles/xstocks-faq',
  disponibilidad: 'https://support.kraken.com/articles/xstocks-availability',
  esma: 'https://registers.esma.europa.eu/solr/esma_registers_priii_documents/select?q=party_name:*984500001AB7C6C7F577*%20AND%20-document_type:FTWS&wt=json&rows=50&sort=approval_filing_date%20desc',
  cysec: 'https://www.cysec.gov.cy/en-GB/entities/investment-firms/cypriot/45914/',
  cnmv: 'https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=4474',
  pasaporte: 'https://www.cnmv.es/portal/Consultas/Folletos/Pasaportes?denominacion=&lei=984500001AB7C6C7F577',
  folleto: 'https://www.mfsa.mt/wp-content/uploads/2026/05/Backed-Assets-JE-Limited-Base-Prospectus-Document-dated-08-May-2026.pdf',
  suplemento: 'https://www.mfsa.mt/wp-content/uploads/2026/10/Backed-Assets-JE-Limited-Second-Supplement-Document-dated-29-September-2026.pdf',
  // Condiciones finales en el contenedor de archivos de la web oficial del emisor
  // (el mismo que carga xstocks.fi): kraken-xstocks-addenda.md.
  condiciones: 'https://cdn.prod.website-files.com/655f3efc4be468487052e35a/69c684c9cf6e1070cfdd8851_Backed%20Assets_Final%20Terms%20Nr%20159%20(LITEx)_20260326.pdf',
};
const aviso = texto => ({ texto, tono: 'warn', esAntiguedad: false, verificadaEl: FECHA });
const GEN = escaparate.ofertas[0].avisos[0].texto;
assert.match(GEN, /^Referencia editorial gratuita/);

const oferta = {
  slug: SLUG, tipo: 'valor',
  titulo: 'xStocks: certificados tokenizados que siguen el precio de acciones de EE. UU.',
  plataformaSlug: 'kraken', plataformaNombre: 'Kraken (Payward Europe Digital Solutions)',
  categoria: 'Acciones y capital privado', pais: 'CY',
  resumen: 'Certificados de deuda de Backed Assets (JE), sociedad de Jersey del grupo de Kraken, que siguen el precio de más de ' +
    '130 acciones y ETF de EE. UU. No son las acciones: dependen de la solvencia del emisor. Los vende Kraken UE desde Chipre.',
  url: F.oferta, cta: 'Ver fuente',
  imagenAlt: 'xStocks: certificados tokenizados que siguen el precio de acciones de EE. UU.',
  verificadaEl: FECHA, vigenciaDias: 7, permanente: false, disponibleEs: true, eu: null, fueraLadrillo: true,
  puntuacion: null, rentabilidad: null, precio: null, estadoRevision: 'actual', coleccion: 'principales',
  moneda: 'USD', patrocinada: false,
  metricas: [
    { etiqueta: 'Mínimo', valor: 'Desde 1 €' },
    { etiqueta: 'Qué compras', valor: 'Certificado de deuda de Backed Assets (JE), no la acción' },
    { etiqueta: 'Vendedor y supervisor', valor: 'Payward Europe Digital Solutions (CY) · CySEC 342/17 · CNMV n.º 4474' },
    { etiqueta: 'Folleto', valor: 'Aprobado por la FMA de Liechtenstein y notificado a la CNMV (11/05/2026); no cubre su venta en España' },
    { etiqueta: 'Condiciones finales', valor: 'Solo ofrecen el producto en Liechtenstein y Suiza (en Suiza, solo a profesionales); España no figura como país de oferta' },
    { etiqueta: 'Compra con euros', valor: '1 % por compra instantánea, o hasta 2 USD en compras pequeñas según la versión inglesa de la tabla, más un diferencial que Kraken no publica' },
    { etiqueta: 'Salida', valor: 'Venta a Kraken en USD (24/5) o retirada a wallet' },
  ],
  avisos: [
    aviso(GEN),
    aviso('Kraken UE lo vende a particulares en España, pero las condiciones finales del emisor solo ofrecen el producto en Liechtenstein y Suiza: el folleto no cubre su venta en España.'),
    aviso('RWAdar no ha encontrado ningún documento oficial que explique en qué se basa la venta en España.'),
    aviso('No compras la acción: es un certificado de deuda de Backed Assets (JE), sin voto ni dividendos en efectivo.'),
    aviso('Riesgo de contraparte: si el emisor o Kraken fallan, puedes perder parte o todo. El emisor no es rentable y depende de su grupo.'),
    aviso('Emisor y vendedor son del mismo grupo (Payward/Kraken), aunque la web de Kraken diga que no está afiliado.'),
    aviso('Producto complejo: puedes perder toda la inversión.'),
    aviso('El folleto advierte que solo es adecuado para quien pueda soportar cualquier pérdida y tenga conocimientos financieros.'),
    aviso('Precio y venta en USD: si el dólar baja frente al euro, pierdes aunque la acción no se mueva.'),
    aviso('Los dividendos no se cobran: se suman al saldo, netos de una retención del 30 % en EE. UU.'),
  ],
  fuentesActuales: [F.oferta, F.riesgos, F.cnmv, F.cysec, F.pasaporte, F.esma, F.condiciones],
};
const R = (etiqueta, valor, fuente, fechaDato, alcance) => ({ etiqueta, valor, fechaDato, fechaConsulta: FECHA, fuente, alcance });
const documentacion = {
  revisadaEl: FECHA,
  descripcion: `${oferta.resumen} Qué se adquiere: un certificado de deuda (producto estructurado) emitido por Backed Assets (JE) ` +
    'Limited que sigue el precio de una acción o ETF cotizado en EE. UU.; sin propiedad, voto ni dividendos en efectivo. ' +
    'Cómo se compra: en Kraken UE, como cliente de Payward Europe Digital Solutions (CY) que supera su evaluación, desde 1 € y ' +
    'pagando con dinero fiduciario. Las condiciones finales del emisor solo ofrecen el producto en Liechtenstein y Suiza (en ' +
    'Suiza, solo a profesionales), así que el folleto no cubre su venta en España; RWAdar no ha encontrado ningún documento ' +
    'oficial que explique en qué se basa la venta de Kraken a particulares en la UE.',
  fuentes: Object.values(F),
  caracteristicas: [
    { etiqueta: 'Proveedor', valor: 'Kraken UE' },
    { etiqueta: 'Entidad que comercializa', valor: 'Payward Europe Digital Solutions (CY) Limited (CySEC 342/17; CNMV, libre prestación, n.º 4474), actúa por cuenta propia' },
    { etiqueta: 'Emisor', valor: 'Backed Assets (JE) Limited, Jersey, del grupo Payward (Kraken); no está regulado por una autoridad de la UE' },
    { etiqueta: 'Qué se adquiere', valor: 'Certificado de deuda tokenizado que sigue el precio de una acción o ETF de EE. UU.; no la acción' },
    { etiqueta: 'Folleto', valor: 'Folleto base aprobado por la FMA de Liechtenstein el 08/05/2026 y notificado a la CNMV el 11/05/2026, con suplementos de agosto y septiembre de 2026; no cubre su venta en España, porque las condiciones finales no la prevén' },
    { etiqueta: 'Países de oferta', valor: 'Liechtenstein y Suiza (condiciones finales); España solo figura entre los países a los que se notificó el folleto' },
    { etiqueta: 'Moneda', valor: 'Precio y venta en USD; compra con euros' },
  ],
  referencias: [
    R('Mínimo de inversión', 'Desde 1 €', F.oferta, null, `Página de xStocks de Kraken UE consultada el ${FES}.`),
    R('Acceso desde España', 'Según Kraken UE, disponible para sus clientes ubicados en la UE que superen su evaluación o sean inversores profesionales',
      F.oferta, null, `Página de xStocks de Kraken UE consultada el ${FES}. Kraken no nombra España: habla de clientes ubicados en la UE. Las condiciones finales del emisor no citan España como país de oferta.`),
    R('Salida', 'Vendes a Kraken en USD, con diferencial, 24/5, o retiras el token a tu wallet; sin plazo fijo', F.oferta, null,
      `Página de xStocks de Kraken UE consultada el ${FES}.`),
    R('Países de oferta (condiciones finales)', 'Liechtenstein y Suiza (en Suiza, solo a inversores profesionales); el derecho a ofrecer en otros países queda reservado', F.condiciones, '2026-03-26',
      'Condiciones finales del producto n.º 159 (LITEx, 26/03/2026, emitidas con el folleto de 2025) alojadas en la web oficial del emisor; las de 2026 que se leyeron dicen lo mismo.'),
    R('Registro del vendedor', 'Payward Europe Digital Solutions (CY) Limited · ESI del EEE en libre prestación · n.º 4474', F.cnmv, null,
      `Registro de la CNMV consultado el ${FES}.`),
    R('Licencia del vendedor', 'CySEC, licencia 342/17', F.cysec, null, `Registro de la CySEC consultado el ${FES}.`),
    R('Comisión con euros', '1 % por compra instantánea, o hasta 2 USD en compras pequeñas según la versión inglesa de la tabla, más un diferencial que Kraken no publica', F.comisiones, null,
      `Tabla de comisiones de Kraken consultada el ${FES}. La versión inglesa añade que las compras instantáneas pequeñas pagan hasta 2 USD en lugar del 1 %; la española no lo dice.`),
    R('Dividendos', 'No se cobran: se suman al saldo, netos de una retención del 30 % en EE. UU.', F.faq, '2026-10-30',
      'Preguntas frecuentes de Kraken sobre xStocks, actualizadas el 30/10/2026.'),
    R('Situación del emisor', 'No es rentable, depende de la financiación de su grupo y avala un préstamo de su matriz', F.suplemento, '2026-09-29',
      'Folleto base (p. 30: el emisor no es rentable) y segundo suplemento (29/09/2026, pp. 4 y 6: pérdidas, dependencia del grupo y aval).'),
  ],
};
for (const r of documentacion.referencias) assert.ok(documentacion.fuentes.includes(r.fuente), r.etiqueta);
const CSP = /<style\b|\sstyle\s*=|\son[a-z]+\s*=|<script/i;
assert.ok(!CSP.test(JSON.stringify(oferta)) && !CSP.test(JSON.stringify(documentacion)), 'texto que la compuerta CSP rechazaría');

// Las principales van primero; el alta, al final de ellas.
const ultimaPrincipal = escaparate.ofertas.map(o => o.coleccion).lastIndexOf('principales');
escaparate.ofertas.splice(ultimaPrincipal + 1, 0, oferta);
documentos[SLUG] = documentacion;
escaparate.fuente.notaOrigen = escaparate.fuente.notaOrigen.replace('; sin altas ni retiradas.', '; sin retiradas.')
  .replace('(Kraken xStocks y Spiko Smart Cash Euro, rechazadas)', '(Spiko Smart Cash Euro, rechazada; Kraken xStocks, rechazada y después incluida por decisión editorial)');
assert.ok(!/sin altas/.test(escaparate.fuente.notaOrigen), 'nota de origen coherente');
escaparate.fuente.notaOrigen += ` Alta de Kraken xStocks por decisión editorial de Víctor (${FES}), con aviso de que las condiciones finales no ofrecen el producto en España.`;
escaparate.fuente.actualizacionLocal = { ...escaparate.fuente.actualizacionLocal,
  archivo: `rwadar-app/data/verificaciones/${REVISION}-v2/contraste-${REVISION}.json`,
  nota: `Lote del ${FES} (entrega ${REVISION}): 24 fichas (7 principales, 14 de reventa y 3 en camino).` };
escaparate.fuente.actualizacionRadarLocal = { ...escaparate.fuente.actualizacionRadarLocal,
  archivo: `rwadar-app/data/verificaciones/${REVISION}-v2/radar-canonico-26.json` };
const colecciones = { principales: 0, secundario: 0, en_camino: 0 };
for (const o of escaparate.ofertas) colecciones[o.coleccion]++;
const manifiesto = { version_esquema: 2, plataformas_esperadas: escaparate.plataformas.length,
  ofertas_esperadas: escaparate.ofertas.length, colecciones_esperadas: colecciones };
escribir(path.join(DIR, 'escaparate-publicacion.json'), escaparate);
escribir(path.join(DIR, 'documentacion-ofertas.json'), documentos);
escribir(path.join(DIR, 'manifiesto-catalogo.json'), manifiesto);
escribir(path.join(DIR, `contraste-${REVISION}.json`), { tipo: 'alta_por_decision_editorial', fecha: FECHA, etiqueta: REVISION,
  revisionAnterior: PREVIA, alta: SLUG,
  decision: `Víctor, ${FES}: «Si es una gran oportunidad mira a ver cómo lo puedes incluir ya que es online como todas las demás… apáñate».`,
  revisionPrevia: '2026-11-03.3-v2/revision-independiente/kraken-xstocks.md (rechazado por los países de oferta) y kraken-xstocks-addenda.md',
  cambiosObligatoriosAplicados: ['título', 'resumen', 'métricas sin las del KID', 'avisos (contraparte, grupo, idoneidad, cambio, retención)',
    'fuentes sin l-p-a.com', 'aviso principal: las condiciones finales no ofrecen el producto en España'],
  copiasLiterales: ['radar-canonico-26.json'], colecciones });

// ---------------------------------------------------------------- SQL
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
  if current_date < date '${FECHA}' then raise exception 'Revisión futura'; end if;
  if exists (select 1 from rwadar_catalogo.revisiones where id = '${nueva.revisionId}'::uuid
    and (contenido_sha256 <> '${nueva.hash}' or estado = 'retirada')) then
    raise exception 'La revisión destino existe con otra identidad o está retirada';
  end if;
end $guarda$;
`;
const aprobar = `do $aprobar$
declare v uuid := '${nueva.revisionId}';
begin
  if (select count(*) from rwadar_catalogo.plataformas where revision_id = v) <> ${escaparate.plataformas.length}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v) <> ${escaparate.ofertas.length}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'principales') <> ${colecciones.principales}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'secundario') <> ${colecciones.secundario}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'en_camino') <> ${colecciones.en_camino} then
    raise exception 'Catálogo incompleto: se conserva el lote anterior';
  end if;
  update rwadar_catalogo.revisiones set estado = 'aprobada', aprobada_el = now(),
    aprobada_referencia = 'Entrega ${REVISION}: alta de Kraken xStocks por decisión editorial de Víctor (${FES}), con aviso de que las condiciones finales del emisor no ofrecen el producto en España; resto igual a la entrega ${DESDE}.'
    where id = v and estado = 'borrador';
  if not exists (select 1 from rwadar_catalogo.revision_publicable_v2 where id = v) then
    raise exception 'Entrega no publicable: se deshace la transacción completa';
  end if;
end $aprobar$;
`;
escribir(path.join(destino, 'aplicar-y-aprobar.sql'),
  `-- Entrega ${REVISION} del ${FES}: alta de Kraken xStocks sobre la revisión publicada del mismo día. Decisión de Víctor.\n` +
  nueva.sql.replace('-- El lote entra como BORRADOR. Este fichero nunca lo aprueba ni lo publica.',
    '-- Este aplicador importa y aprueba al final, únicamente si pasan todas las guardas.')
    .replace('begin;', 'begin isolation level serializable;\n' + guarda)
    .replace(/commit;\n$/, aprobar + 'commit;\n'));
escribir(path.join(destino, 'revision.json'), { versionEsquema: 2, revisionId: nueva.revisionId, hash: nueva.hash,
  revisionAnterior: PREVIA, revisionAnteriorComprobadaEnRemoto: true, etiqueta: REVISION, fechaRadar: FECHA,
  plataformas: escaparate.plataformas.length, ofertas: escaparate.ofertas.length, colecciones, vigenciaDias: 7,
  nuevasAltas: 1, retiradas: 0, estado: 'borrador', aplicadoEnRemoto: false, publicacionWeb: false });
console.log(JSON.stringify({ revisionId: nueva.revisionId, previa: PREVIA, sha256: sha(path.join(destino, 'aplicar-y-aprobar.sql')),
  ofertas: escaparate.ofertas.length, colecciones }));

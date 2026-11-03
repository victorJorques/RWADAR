// Quinta entrega del 03/11/2026 (revisión «2026-11-03.5»): alta de Spiko Smart Cash
// Euro por decisión editorial de Víctor del 03/11 («si es tan buena oferta y tú lo
// ves bien y tú lo subirías, adelante»). Preparación LOCAL: sin red ni servicios remotos.
//
//   node rwadar-app/data/verificaciones/2026-11-03.5-v2/preparar-entrega.mjs
//
// Parte de la publicada (f26bba19, entrega 2026-11-03.4) y solo añade una ficha.
// La revisión independiente del 03/11 (2026-11-03.3-v2/revision-independiente/
// revision-candidata-y-cambios.md, apartado A) la rechazó: ningún supervisor
// publica que este compartimento esté notificado para venderse en España (la CNMV
// no publica compartimentos de fondos extranjeros) y la web contradice al KID.
// Víctor decide publicarla diciéndolo con claridad y con los cambios que aquella
// revisión fijó para el caso de desbloquearla (A.6).
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
const FECHA = '2026-11-03', REVISION = '2026-11-03.5', DESDE = '2026-11-03.4';
const FES = '03/11/2026';
const PREVIA = 'f26bba19-39fc-aa64-a086-aba333376f0a'; // publicada; leída como visitante el 03/11
const SLUG = 'spiko-smart-cash-euro';
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
  oferta: 'https://www.spiko.io/es/spiko-euro',
  rendimiento: 'https://public-api.spiko.io/v0/share-classes/eurSAFO/yield',
  kid: 'https://cdn.spiko.finance/legal_docs/ES/KID_eurSAFO_ES.pdf',
  folleto: 'https://geco.amf-france.org/back-office/document/download/438274',
  amf: 'https://cdn.spiko.finance/legal_docs/EN/SAFO_Letter_EN.pdf',
  disponibilidad: 'https://docs.spiko.io/documentation/product_overview/fund_availability',
  particulares: 'https://www.spiko.io/es/usos-principales/particulares',
  sicav: 'https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0401205J&lang=es',
  intermediario: 'https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp?tipo=CLP&numero=5325&vista=17&lang=es',
};
const aviso = texto => ({ texto, tono: 'warn', esAntiguedad: false, verificadaEl: FECHA });
const GEN = escaparate.ofertas[0].avisos[0].texto;
assert.match(GEN, /^Referencia editorial gratuita/);
const PCT = '2,84 %', DATO = '2026-11-02';

const oferta = {
  slug: SLUG, tipo: 'rendimiento',
  titulo: 'Spiko Euro (Smart Cash): fondo en euros ligado al €STR',
  plataformaSlug: 'spiko', plataformaNombre: 'Spiko',
  categoria: 'Tesoro y fondos', pais: 'FR',
  resumen: 'Fondo de inversión UCITS en euros de Spiko que busca el €STR (el tipo a un día del euro) más un margen mediante ' +
    'permutas (swaps) con bancos; no es un fondo monetario ni un depósito. Su valor cambia cada día y el capital no está garantizado.',
  url: F.oferta, cta: 'Ver fuente',
  imagenAlt: 'Spiko Euro (Smart Cash): fondo en euros ligado al €STR',
  verificadaEl: FECHA, vigenciaDias: 7, permanente: false, disponibleEs: true, eu: null, fueraLadrillo: true,
  puntuacion: null, precio: null, estadoRevision: 'actual', coleccion: 'principales', moneda: 'EUR', patrocinada: false,
  rentabilidad: { mostrada: PCT, literal: 'Cifra que publica Spiko, ya descontadas sus comisiones: lo que creció el fondo en su último ' +
    `día de cálculo, pasado a un año (valor liquidativo del 02/11/2026; consultado el ${FES}). Variable: sigue al €STR; no es un tipo fijo ni está garantizado.` },
  metricas: [
    { etiqueta: 'Mínimo', valor: '1 EUR' },
    { etiqueta: 'Qué es', valor: 'Fondo de inversión europeo (UCITS) que invierte en acciones, bonos y otros títulos y cambia lo que rinden con bancos por el €STR más un margen; no es un fondo monetario' },
    { etiqueta: 'Supervisor', valor: 'AMF (Francia): n.º SCV20260075, aún sin ficha pública en su base GECO · Spiko SICAV inscrita en la CNMV (n.º 2380); la CNMV no muestra qué fondos de la SICAV están dados de alta en España' },
    { etiqueta: 'Gestora', valor: 'Twenty First Capital (gestión de las inversiones delegada en Amundi)' },
    { etiqueta: 'Comisiones', valor: '0,25 % anual de gestión y hasta 0,10 % de gastos de funcionamiento; 0 % de entrada y de salida' },
    { etiqueta: 'Reembolso', valor: 'Diario; puede limitarse si un día las salidas netas llegan al 25 % del fondo. Orden antes de las 15:00 (hora de París) y pago al día hábil siguiente' },
    { etiqueta: 'Riesgo KID', valor: '1 de 7, sin contar el riesgo de contraparte (el KID lo deja fuera); plazo recomendado: 3 meses' },
    { etiqueta: 'Rentabilidad publicada · neta y variable · 02/11/2026', valor: PCT },
  ],
  avisos: [
    aviso(GEN),
    aviso('Spiko dice que se puede contratar desde España, pero no hemos podido confirmar en ningún registro público de la CNMV ni de la AMF (Francia) que este fondo esté dado de alta para venderse aquí: la CNMV solo muestra la sociedad Spiko SICAV, no sus fondos uno a uno.'),
    aviso('No es una cuenta ni un depósito. La web de Spiko dice «Interés a tipo fijo» y «Garantizado por contrapartes», pero el KID dice que no hay rentabilidad mínima garantizada y que puedes perder parte o toda la inversión: el rendimiento depende del €STR, que cambia cada día.'),
    aviso('No es un fondo monetario: invierte en acciones, bonos y otros títulos y cede lo que rinden a uno o varios bancos, que a cambio le pagan el €STR más un margen. Si un banco falla, el fondo podría quedar expuesto a esos títulos, que pueden bajar, y las garantías podrían no cubrir la pérdida. El riesgo 1 de 7 del KID no tiene en cuenta este riesgo.'),
    aviso('Si un mismo día los inversores piden sacar, entre todos y descontado lo que entra, el 25 % del fondo o más, la gestora puede pagar solo una parte y pasar el resto al siguiente día hábil (como mucho 20 días en 3 meses), aunque la página de Spiko para particulares diga «No existen límites de retirada».'),
    aviso('La web de Spiko presenta a Amundi Asset Management como «Sociedad gestora», pero la gestora es Twenty First Capital, según el KID y el certificado de la AMF; el folleto dice que delega en Amundi la gestión de las inversiones. Las reclamaciones se dirigen a Twenty First Capital.'),
    aviso('El enlace de la web de Spiko para «Verificar la autorización» lleva a la base pública de la AMF (GECO), pero allí este fondo todavía no tiene ficha publicada. Su autorización consta en el folleto que publica la AMF y en un certificado de la AMF que aloja Spiko.'),
  ],
  fuentesActuales: [F.oferta, F.rendimiento, F.kid, F.folleto, F.amf, F.disponibilidad, F.particulares, F.sicav],
};
const R = (etiqueta, valor, fuente, fechaDato, alcance) => ({ etiqueta, valor, fechaDato, fechaConsulta: FECHA, fuente, alcance });
const documentacion = {
  revisadaEl: FECHA,
  descripcion: `${oferta.resumen} Qué se adquiere: acciones de la clase EUR (FR0014015LD3) del compartimento Spiko Amundi ` +
    'Overnight Swap Fund, de Spiko SICAV (Francia), autorizado por la AMF con el n.º SCV20260075 (así figura en un certificado ' +
    'de la AMF del 23/02/2026). El fondo invierte en acciones, bonos y otros títulos y cede lo que rinden a uno o varios bancos, ' +
    'que a cambio le pagan el €STR más un margen; el rendimiento es variable y, si un banco falla, el fondo puede quedar expuesto ' +
    'a esos títulos. Spiko marca España como disponible, pero ni la CNMV ni la AMF publican que este fondo esté dado de alta para venderse en España.',
  fuentes: Object.values(F),
  caracteristicas: [
    { etiqueta: 'Proveedor', valor: 'Spiko' },
    { etiqueta: 'Entidad que comercializa', valor: 'Spiko Finance (ESI del EEE en libre prestación, CNMV n.º 5325, para recibir y transmitir órdenes sobre IIC); en la CNMV, la comercializadora inscrita de la SICAV es Aldana Capital A.V.' },
    { etiqueta: 'Fondo', valor: 'Spiko Amundi Overnight Swap Fund, compartimento de Spiko SICAV (Francia); clase EUR, ISIN FR0014015LD3' },
    { etiqueta: 'Gestora', valor: 'Twenty First Capital (productor según el KID); gestión financiera delegada en Amundi Asset Management' },
    { etiqueta: 'Qué se adquiere', valor: 'Acciones de un fondo UCITS que invierte en acciones, bonos y otros títulos y cambia lo que rinden con bancos por el €STR más un margen' },
    { etiqueta: 'Moneda', valor: 'EUR' },
  ],
  referencias: [
    R('Mínimo de inversión', 'Desde 1 €', F.folleto, '2026-09-01', 'Tabla de clases del folleto de la SICAV en la base GECO de la AMF (en vigor desde el 01/09/2026).'),
    R('Acceso desde España', 'Disponible para particulares residentes en España según Spiko, tras el alta y la verificación de identidad (KYC)',
      F.disponibilidad, '2026-10-23', 'Tabla de disponibilidad de Spiko (23/10/2026). La CNMV no publica los compartimentos de los fondos extranjeros: no consta en ningún supervisor.'),
    R('Reembolso', 'Diario; puede limitarse si un día las salidas netas de todos los inversores llegan al 25 % del fondo. Orden antes de las 15:00 (hora de París) y pago al día hábil siguiente',
      F.folleto, '2026-09-01', 'Folleto de la SICAV (§3.2.4) en la base GECO de la AMF.'),
    R('Rendimiento neto publicado', PCT, F.rendimiento, DATO,
      'API pública de Spiko (devengo diario del valor liquidativo del 02/11/2026, anualizado y neto de comisiones). Variable: sigue al €STR.'),
    R('Comisión de gestión', '0,25 % anual; gastos de funcionamiento de hasta el 0,10 %; sin comisión de entrada ni de salida', F.folleto, '2026-09-01',
      'Folleto de la SICAV en la base GECO de la AMF.'),
    R('Riesgo (KID)', '1 de 7, sin contar el riesgo de contraparte; capital no garantizado y sin rentabilidad mínima; en los escenarios del KID, 10.000 € quedan entre 9.980 € y 10.100 € a 3 meses (moderado: 9.990 €); plazo recomendado de 3 meses', F.kid, '2026-09-01', 'KID en español del 01/09/2026.'),
    R('Ajuste del valor liquidativo', 'Si un día entran o salen muchas órdenes, la gestora puede ajustar el valor liquidativo hasta un 0,50 % (swing pricing)', F.folleto, '2026-09-01', 'Folleto de la SICAV (§3.2.4) en la base GECO de la AMF.'),
    R('Aprobación del compartimento', 'AMF, SCV20260075 (certificado del 23/02/2026)', F.amf, '2026-02-23', 'Certificado de la AMF que aloja Spiko.'),
    R('Registro de la SICAV en España', 'Spiko SICAV · CNMV n.º 2380 (30/01/2026)', F.sicav, '2026-01-30', `Registro de la CNMV consultado el ${FES}; no lista compartimentos.`),
    R('Web frente al KID', 'La web dice «Interés a tipo fijo», «Garantizado por contrapartes» y «rendimiento diario garantizado»; el KID dice «No existe rentabilidad mínima garantizada. Podría perder la totalidad o parte de su inversión»', F.oferta, null,
      `Web en español de Spiko Euro consultada el ${FES} y KID del 01/09/2026.`),
  ],
};
for (const r of documentacion.referencias) assert.ok(documentacion.fuentes.includes(r.fuente), r.etiqueta);
const CSP = /<style\b|\sstyle\s*=|\son[a-z]+\s*=|<script/i;
assert.ok(!CSP.test(JSON.stringify(oferta)) && !CSP.test(JSON.stringify(documentacion)), 'texto que la compuerta CSP rechazaría');

// Las principales van primero; el alta, junto a las otras de Spiko.
const ultimaSpiko = escaparate.ofertas.map(o => o.plataformaSlug === 'spiko' && o.coleccion === 'principales').lastIndexOf(true);
assert.ok(ultimaSpiko >= 0);
escaparate.ofertas.splice(ultimaSpiko + 1, 0, oferta);
documentos[SLUG] = documentacion;
escaparate.fuente.notaOrigen = escaparate.fuente.notaOrigen.replace('Spiko Smart Cash Euro, rechazada; ', 'Spiko Smart Cash Euro, rechazada y después incluida por decisión editorial; ') +
  ` Alta de Spiko Smart Cash Euro por decisión editorial de Víctor (${FES}), con aviso de que no consta en ningún supervisor su notificación a España.`;
escaparate.fuente.actualizacionLocal = { ...escaparate.fuente.actualizacionLocal,
  archivo: `rwadar-app/data/verificaciones/${REVISION}-v2/contraste-${REVISION}.json`,
  nota: `Lote del ${FES} (entrega ${REVISION}): 25 fichas (8 principales, 14 de reventa y 3 en camino).` };
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
  decision: `Víctor, ${FES}: «Si es tan buena oferta y tú lo ves bien y tú lo subirías, adelante».`,
  revisionPrevia: '2026-11-03.3-v2/revision-independiente/revision-candidata-y-cambios.md (apartado A: rechazado por no constar su notificación a España)',
  cambiosAplicados: ['métrica fechada «Rentabilidad publicada · neta y variable · 02/11/2026»; 8 datos', 'literal: variable, sigue al €STR, ni fijo ni garantizado',
    'no es una cuenta ni un depósito; puedes perder parte o toda la inversión', 'sin ficha pública en GECO (métrica y aviso)', 'citas literales de la web',
    'fila Salida: la limitación primero', 'revisión de tres enfoques: REVISION-ALTA.md (13 cambios obligatorios)',
    'Supervisor: la CNMV no publica los compartimentos', 'Gestora: Twenty First Capital, delegación en Amundi', 'Reembolso: puede limitarse (25 %)',
    'aviso: la web contradice al KID', 'aviso principal: no consta en ningún supervisor su notificación a España'],
  cifra: { rentabilidad: PCT, fechaDato: DATO }, copiasLiterales: ['radar-canonico-26.json'], colecciones });

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
    aprobada_referencia = 'Entrega ${REVISION}: alta de Spiko Smart Cash Euro por decisión editorial de Víctor (${FES}), con aviso de que no consta en ningún supervisor su notificación a España; resto igual a la entrega ${DESDE}.'
    where id = v and estado = 'borrador';
  if not exists (select 1 from rwadar_catalogo.revision_publicable_v2 where id = v) then
    raise exception 'Entrega no publicable: se deshace la transacción completa';
  end if;
end $aprobar$;
`;
escribir(path.join(destino, 'aplicar-y-aprobar.sql'),
  `-- Entrega ${REVISION} del ${FES}: alta de Spiko Smart Cash Euro sobre la revisión publicada del mismo día. Decisión de Víctor.\n` +
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

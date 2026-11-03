// Tercera entrega del 03/11/2026 (revisión «2026-11-03.3»): investigación del
// mismo día iniciada por Víctor («hazme otra investigación… lo más actualizado
// posible a día de hoy»). Preparación LOCAL: sin red ni servicios remotos.
//
//   node rwadar-app/data/verificaciones/2026-11-03.3-v2/preparar-entrega.mjs
//
// Parte de la publicada (62dca2f9, entrega 2026-11-03.2) y aplica:
// 1. Radar: las 69 fuentes vueltas a leer hoy (radar-contraste-2026-11-03.json, 69/69).
// 2. Las 23 fichas revisadas hoy con sus fuentes primarias (expedientes/), con los
//    cambios que la revisión independiente confirmó (revision-independiente/).
// 3. Las tarjetas de reventa y próximas reciben mínimo, acceso desde España y
//    salida en castellano, con la etiqueta fija de las normas del 03/11.
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
const FECHA = '2026-11-03', REVISION = '2026-11-03.3', DESDE = '2026-11-03.2';
const FES = '03/11/2026';
const PREVIA = '62dca2f9-8a9b-0dae-bef9-82fbda910280'; // publicada; leída como visitante el 03/11
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const escribir = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); };
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base = path.resolve(DIR, `../${DESDE}-v2`);

// ---------------------------------------------------------------- partida
const previa = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: DESDE, versionEsquema: 2 }));
assert.equal(previa.revisionId, PREVIA, 'la base local no es la revisión publicada');
const contrasteRuta = path.join(DIR, `radar-contraste-${FECHA}.json`);
const contraste = leer(contrasteRuta);
const radar = leer(path.join(base, 'radar-canonico-26.json'));
assert.ok(contraste.fecha === FECHA && contraste.correctas === radar.fuentes.length && !contraste.bloqueos.length,
  'el radar no está comprobado hoy al completo: no se monta el lote');

// ---------------------------------------------------------------- radar
radar.verificadoEl = FECHA;
radar.alcance = `Revisión editorial de fuentes primarias del ${FES}: las ${radar.fuentes.length} fuentes del radar se volvieron a ` +
  'consultar sin sesión y siguen diciendo lo que respaldan. No acredita onboarding, oferta abierta ni rentabilidad.';
radar.fuentes = radar.fuentes.map(f => ({ ...f, primaria: true, consultadaEl: FECHA }));
const fuentePorId = new Map(radar.fuentes.map(f => [f.id, f]));
const conFuentes = campo => ({ ...campo, fuentes: campo.fuentes.map(id => {
  assert.ok(fuentePorId.has(id), `fuente inexistente: ${id}`);
  return fuentePorId.get(id);
}) });

// ---------------------------------------------------------------- ofertas
const escPrevio = leer(path.join(base, 'escaparate-publicacion.json'));
const documentos = leer(path.join(base, 'documentacion-ofertas.json'));
const ofertas = structuredClone(escPrevio.ofertas);
const porSlug = new Map(ofertas.map(o => [o.slug, o]));
const oferta = slug => { const o = porSlug.get(slug); assert.ok(o, slug); return o; };
const avisoCambia = (slug, viejo, nuevo) => {
  const o = oferta(slug);
  const i = o.avisos.findIndex(a => a.texto.startsWith(viejo));
  assert.ok(i >= 0, `${slug}: aviso «${viejo}» no encontrado`);
  o.avisos[i] = { ...o.avisos[i], texto: nuevo };
};
const avisoNuevo = (slug, texto, antesDe = null) => {
  const o = oferta(slug);
  const i = antesDe ? o.avisos.findIndex(a => a.texto.startsWith(antesDe)) : -1;
  const aviso = { texto, tono: 'warn', esAntiguedad: false, verificadaEl: FECHA };
  if (i >= 0) o.avisos.splice(i, 0, aviso); else o.avisos.push(aviso);
};
const metrica = (slug, etiquetaVieja, nueva) => {
  const o = oferta(slug);
  const i = o.metricas.findIndex(m => m.etiqueta.startsWith(etiquetaVieja));
  assert.ok(i >= 0, `${slug}: métrica «${etiquetaVieja}» no encontrada`);
  o.metricas[i] = nueva;
};

// Todas las fichas se revisaron hoy con sus fuentes primarias (expedientes del 03/11).
for (const o of ofertas) {
  const exp = leer(path.join(DIR, 'expedientes', `${o.slug}.json`));
  assert.ok(['mantener', 'actualizar'].includes(exp.decision), `${o.slug}: decisión ${exp.decision}`);
  o.verificadaEl = FECHA;
  o.vigenciaDias = 7;
  o.avisos = o.avisos.map(a => ({ ...a, verificadaEl: FECHA }));
}

// Spiko: rendimiento neto de 31 días publicado por Spiko el 02/11 (API pública).
const SPIKO = {
  'spiko-letras-del-tesoro-euro': { clase: 'EUTBL', pct: '2,34 %', usd: false },
  'spiko-letras-del-tesoro-dolar': { clase: 'USTBL', pct: '3,95 %', usd: true },
};
for (const [slug, { clase, pct, usd }] of Object.entries(SPIKO)) {
  const o = oferta(slug);
  o.rentabilidad = { mostrada: pct, literal: `Rendimiento neto anualizado${usd ? ' en dólares' : ''} de los últimos 31 días ` +
    `publicado por Spiko el 02/11/2026; consultado el ${FES}.${usd ? ' No incluye la variación del euro frente al dólar.' : ''} Variable y no garantizado.` };
  metrica(slug, 'Rentabilidad publicada', { etiqueta: `Rentabilidad publicada · 31 días · 02/11/2026${usd ? ' · en USD' : ''}`, valor: pct });
  const doc = documentos[slug];
  doc.referencias = doc.referencias.filter(r => !/rentabilidad|rendimiento/i.test(r.etiqueta));
  doc.referencias.push({ etiqueta: 'Rentabilidad publicada · 31 días', valor: pct, fechaDato: '2026-11-02', fechaConsulta: FECHA,
    fuente: `https://public-api.spiko.io/v0/share-classes/${clase}/yield`,
    alcance: `Rendimiento neto anualizado de 31 días que publica Spiko (dato del 02/11/2026, consultado el ${FES}). Variable y no garantizado.` });
}

// Aktionariat y sus portales: registro de FINMA consultado hoy.
const SIN_FINMA = `Sin supervisión prudencial: no figura en el registro de FINMA (${FES})`;
metrica('aktionariat', 'Precio del emisor', { etiqueta: `Precio del emisor · ${FES}`, valor: '7,25 CHF por acción (fijo)' });
metrica('aktionariat', 'Supervisor', { etiqueta: 'Supervisor', valor: SIN_FINMA });
avisoCambia('aktionariat', 'Entre accionistas hay vendedores por debajo',
  `Entre accionistas hay vendedores por debajo del precio del emisor (6,20 ZCHF frente a 7,25 CHF el ${FES}).`);
metrica('boss-info', 'Supervisor', { etiqueta: 'Supervisor', valor: SIN_FINMA });
avisoCambia('boss-info', 'Acceso desde España no confirmado',
  'Acceso desde España no confirmado: el emisor solo publica una lista de países vetados (EE. UU., China y otros), sin España, pero no dice que la oferta se dirija al EEE.');
metrica('switzerlend', 'Supervisor', { etiqueta: 'Supervisor', valor: `${SIN_FINMA}; afiliada a PolyReg solo a efectos de blanqueo` });
avisoNuevo('switzerlend', `Su web dice que el emisor recompra acciones si tiene liquidez, pero el ${FES} el contrato de compra tenía la recompra desactivada y casi sin fondos.`,
  'El precio del emisor y las ofertas');
avisoCambia('mf-one', 'El 01/11/2026 (domingo) la suscripción figuraba pausada',
  `El ${FES} solo funcionaba la suscripción instantánea en Ethereum, para direcciones en lista blanca; la suscripción por solicitud estaba pausada.`);

// Brickwise: avisos que cambian hoy (API pública).
avisoCambia('vivienda-stallhofstra-e-28-gratwein', 'La base de alquiler de la API cita un contrato ya vencido',
  'La API da dos fechas de fin del alquiler (02/02/2022 y 31/03/2027); la rentabilidad no se muestra.');
avisoCambia('randhartingergasse-9-viena', 'La base de alquiler de la API cita un contrato ya vencido',
  'Según la API, el inquilino se fue el 28/02/2026 y se busca otro; la rentabilidad no se muestra.');
metrica('terreno-con-arrendamiento-billa', 'Suscrito / umbral',
  { etiqueta: 'Suscrito / umbral', valor: `82 de 5.000 participaciones necesarias (API ${FES})` });
avisoCambia('terreno-con-arrendamiento-billa', 'La emisión solo se ejecuta si alcanza 500.000 €',
  `La emisión solo se ejecuta si alcanza 500.000 €; el ${FES} la API mostraba 82 participaciones suscritas (1,64 %). Si no se alcanza, se devuelve el dinero sin intereses.`);
avisoNuevo('terreno-con-arrendamiento-billa', 'Tienes 14 días para desistir de la suscripción, según su documento de desistimiento.');

// Casa de Outeiro: la campaña en Alius tenía fin el 31/10 y no muestra ampliación.
metrica('casa-de-outeiro', 'Recaudado', { etiqueta: `Recaudado · ${FES}`, valor: '1.121.000 € de un mínimo de 2.000.000 €' });
avisoCambia('casa-de-outeiro', 'La ficha de datos del 30/10/2026 amplía el plazo',
  `La campaña en Alius tenía fin el 31/10/2026 y el ${FES} no mostraba días restantes ni ampliación, aunque la ficha de datos del 30/10 cita el 31/03/2027. Confirma en Alius si sigue abierta antes de invertir.`);

// ---------------------------------------------------------------- tres datos de la tarjeta
// Etiquetas fijas (normas del 03/11): «Mínimo de inversión», «Acceso desde España», «Salida» o «Reembolso».
const R = (etiqueta, valor, fuente, fechaDato, nota) => ({ etiqueta, valor, fechaDato, fechaConsulta: FECHA, fuente,
  alcance: `Redacción en castellano del dato comprobado en la fuente el ${FES}. ${nota}`.trim() });
const BW_APP = 'https://app.brickwise.at/desktopWeb/marketplace';
const BW_CUENTA = 'https://www.brickwise.at/support/kann-ich-einen-account-von-jedem-land-aus-eroffnen';
const BW_ACCESO = R('Acceso desde España', 'Sin confirmar: Brickwise abre cuenta a residentes del EEE (España incluida), pero no confirma que esta emisión se distribuya en España',
  BW_CUENTA, null, 'Página de ayuda de Brickwise; documentos de la emisión solo en alemán.');
const REVENTA_BW = {
  'vivienda-pluddemanngasse-101-graz': ['80', 'https://cdn.brickwise.at/55386e50-130d-42bd-a39e-f3d7d4972196.pdf'],
  'vivienda-sonnleithnergasse-2-viena': ['75', 'https://cdn.brickwise.at/bd253831-9074-4268-860c-1c6c85b1b606.pdf'],
  'local-de-estanco-klagenfurt': ['95', 'https://cdn.brickwise.at/5602c0af-8376-4e87-a53d-d6277428d333.pdf'],
  'vivienda-stallhofstra-e-28-gratwein': ['69,90', 'https://cdn.brickwise.at/bb85e799-705d-49a3-ab69-5104a8d90ea6.pdf'],
  'vivienda-schwarzer-weg-18-graz': ['69,90', 'https://cdn.brickwise.at/1997cf37-2b9f-4c8b-a3f8-982628c71d1a.pdf'],
  'drautalresidenz-paternion': ['70', 'https://cdn.brickwise.at/585459c7-9fac-4607-a2cc-63d4954334df.pdf'],
  'randhartingergasse-9-viena': ['78', 'https://cdn.brickwise.at/5cfbdc1f-e33a-4df8-986c-b3491446f8b7.pdf'],
  'apartamento-vacacional-hinterstoder-50': ['72', 'https://cdn.brickwise.at/8a16682d-6e93-4e0d-9771-894eb18abdf9.pdf'],
  'vivienda-pottendorfer-stra-e-62-wr-neustadt': ['78', 'https://cdn.brickwise.at/bf300673-e32d-4f8d-9328-9fc5dbda049c.pdf',
    'Primera cancelación posible a los 15 años de la emisión; antes, solo vendiendo en la app si hay comprador (1,5 % de comisión)'],
  'fotovoltaica-greenpoint': ['100', 'https://cdn.brickwise.at/f6c7c7ff-f2f1-4272-86dd-39e02432868c.pdf',
    'Devolución del nominal el 31/12/2038, subordinada; antes, solo vendiendo en la app si hay comprador (1,5 % de comisión)'],
  'fotovoltaica-cohotel': ['110', 'https://cdn.brickwise.at/da8e1df3-d334-4075-9311-299f93c8563e.pdf',
    'Devolución del nominal el 31/12/2038, subordinada; antes, solo vendiendo en la app si hay comprador (1,5 % de comisión)'],
};
const NUEVAS = {};
for (const [slug, [precio, documento, salida]] of Object.entries(REVENTA_BW)) {
  NUEVAS[slug] = [
    R('Mínimo de inversión', `Desde ${precio} € en reventa (${FES.slice(0, 5)})`, BW_APP, FECHA,
      'Venta más barata del tablón de la app ese día, más un 1,5 % de comisión; el precio lo fija cada vendedor y cambia a diario. No es el precio de emisión.'),
    BW_ACCESO,
    R('Salida', salida || 'Sin reembolso: vendes en el tablón de la app si hay comprador (1,5 % de comisión)', documento, null,
      'Documento de la emisión (en alemán).'),
  ];
}
NUEVAS['terreno-con-arrendamiento-billa'] = [
  R('Mínimo de inversión', '1.000 € (10 participaciones de 100 €)', 'https://staging.cdn.brickwise.at/50f3df2f-9e58-4809-8e8c-51da1abc3856.pdf', FECHA,
    'Documento de la emisión; después, en tramos de 100 €.'),
  BW_ACCESO,
  R('Salida', 'Si no llega a 500.000 €, te devuelven el dinero; si se emite, cancelable a los 5 años o reventa en la app',
    'https://staging.cdn.brickwise.at/081398c1-7f37-4b88-875a-215bcf23371d.pdf', null, 'Documento de la emisión (en alemán).'),
];
const ALIUS_DOC = 'https://saas-pfp-base-api.token-city.com/v3/dashboard/issuance/71/document/263';
NUEVAS['casa-de-outeiro'] = [
  R('Mínimo de inversión', '2.000 € (80 acciones de 25 €)', ALIUS_DOC, '2026-10-30', 'Ficha de datos de la emisión del 30/10/2026.'),
  R('Salida', 'Si no se llega a 2 M€, te devuelven el dinero; si sale, solo podrás vender un 2,5 % de tus acciones al año de 2027 a 2030',
    ALIUS_DOC, '2026-10-30', 'Ficha de datos de la emisión del 30/10/2026.'),
];
NUEVAS['boss-info'] = [
  R('Mínimo de inversión', '100 CHF por transferencia bancaria', 'https://shares.bossinfo.com/api/brokerbotsettings?ticker=BOSS', FECHA,
    'Configuración pública de compra del emisor; en cripto, desde 1 acción.'),
  R('Salida', 'El emisor no recompra ahora; vendes a otros accionistas en ZCHF si hay comprador', 'https://shares.bossinfo.com/trade', FECHA,
    'Libro de órdenes público del emisor.'),
];
NUEVAS.switzerlend = [
  R('Mínimo de inversión', `1 acción (68,01 CHF el ${FES.slice(0, 5)})`, 'https://shares.lend.ch/api/brokerbotsettings?ticker=LENDS', FECHA,
    'Configuración pública de compra del emisor: sin mínimo por transferencia.'),
  R('Salida', 'El emisor no recompra hoy (su web dice lo contrario); vendes a otros accionistas en ZCHF si hay comprador',
    'https://shares.lend.ch/trade', FECHA, 'Libro de órdenes público y contrato de compra del emisor.'),
];
NUEVAS['mf-one'] = [
  R('Acceso desde España', 'No disponible para el particular común: oferta exenta solo para direcciones en lista blanca',
    'https://docs.midas.app/llms-full.txt', null, 'Documentación pública de Midas.'),
  R('Salida', 'Reembolso al emisor solo para direcciones en lista blanca', 'https://docs.midas.app/llms-full.txt', null,
    'Documentación pública de Midas.'),
];
// Principales: los tres datos en castellano del 03/11 (entrega 2026-11-03.2), comprobados de nuevo hoy.
const CANONICA = /^(?:M[ií]nimo de inversi[oó]n|Acceso desde Espa[ñn]a|Salida|Reembolso)(?: \([^)]{1,60}\))?$/;
for (const slug of ['spiko-letras-del-tesoro-euro', 'spiko-letras-del-tesoro-dolar', 'robinhood-classic-stock-tokens', 'prosegur-digital-gold', 'aktionariat']) {
  const doc = documentos[slug];
  const previas = doc.referencias.filter(r => CANONICA.test(r.etiqueta));
  assert.equal(previas.length, 3, `${slug}: tres datos de tarjeta de la entrega anterior`);
  doc.referencias = doc.referencias.filter(r => !CANONICA.test(r.etiqueta));
  NUEVAS[slug] = previas.map(r => ({ ...r, fechaConsulta: FECHA,
    alcance: `Comprobado de nuevo en la fuente el ${FES} (mismo documento que en la revisión del 01/11). ${r.alcance.replace(/^Redacción en castellano[^.]*\.\s*/, '')}`.trim() }));
}
for (const [slug, refs] of Object.entries(NUEVAS)) {
  const doc = documentos[slug];
  assert.ok(doc, slug);
  doc.referencias = doc.referencias.filter(r => !CANONICA.test(r.etiqueta)).concat(refs);
  for (const r of refs) {
    assert.ok(/^https:\/\/[^\s]+$/.test(r.fuente), `${slug}: fuente HTTPS`);
    assert.ok(CANONICA.test(r.etiqueta), `${slug}: etiqueta fija`);
    assert.ok(r.valor.length <= 160, `${slug}: texto de tarjeta corto`);
    if (!doc.fuentes.includes(r.fuente)) doc.fuentes.push(r.fuente);
  }
}
for (const slug of Object.keys(documentos)) documentos[slug].revisadaEl = FECHA;

// ---------------------------------------------------------------- escaparate
const escaparate = {
  versionEsquema: 2,
  fuente: {
    notaOrigen: `Revisión del ${FES} (investigación del mismo día iniciada por Víctor): las 23 fichas y 12 candidatas investigadas ` +
      'con expediente por oferta y revisión independiente (Kraken xStocks y Spiko Smart Cash Euro, rechazadas); sin altas ni retiradas. Las cifras se publican solo donde se leyeron en la fuente oficial.',
    actualizacionLocal: { verificadoEl: FECHA,
      archivo: `rwadar-app/data/verificaciones/${REVISION}-v2/contraste-${REVISION}.json`, publicable: false,
      derechosImagenVerificados: false,
      nota: `Lote del ${FES} (entrega ${REVISION}): 23 fichas comprobadas (6 principales, 14 de reventa y 3 en camino).` },
    actualizacionRadarLocal: { verificadoEl: FECHA,
      archivo: `rwadar-app/data/verificaciones/${REVISION}-v2/radar-canonico-26.json`, publicable: false,
      plataformas: radar.plataformas.length, fuentesPrimarias: radar.fuentes.length },
  },
  plataformas: radar.plataformas.map(p => ({ slug: p.slug, verificacionLocal: {
    verificadoEl: FECHA, conservaFechaCanonica: true,
    estadoOperativo: conFuentes(p.estadoOperativo), licenciaRegistro: conFuentes(p.licenciaRegistro),
    acceso: conFuentes(p.acceso), alertasCriticas: p.alertasCriticas.map(conFuentes),
  } })),
  ofertas,
};
const colecciones = { principales: 0, secundario: 0, en_camino: 0 };
for (const o of ofertas) colecciones[o.coleccion]++;
const manifiesto = { version_esquema: 2, plataformas_esperadas: radar.plataformas.length,
  ofertas_esperadas: ofertas.length, colecciones_esperadas: colecciones };
const CSP = /<style\b|\sstyle\s*=|\son[a-z]+\s*=|<script/i;
assert.ok(!CSP.test(JSON.stringify(documentos)) && !CSP.test(JSON.stringify(escaparate)), 'texto que la compuerta CSP rechazaría');

escribir(path.join(DIR, 'radar-canonico-26.json'), radar);
escribir(path.join(DIR, 'escaparate-publicacion.json'), escaparate);
escribir(path.join(DIR, 'documentacion-ofertas.json'), documentos);
escribir(path.join(DIR, 'manifiesto-catalogo.json'), manifiesto);
escribir(path.join(DIR, `contraste-${REVISION}.json`), { tipo: 'revision_integral', fecha: FECHA, etiqueta: REVISION, revisionAnterior: PREVIA,
  decision: `Víctor, ${FES}: nueva investigación para publicar lo más actualizado posible; normas de tarjeta del ${FES}.`,
  radar: { fuentes: contraste.fuentes, correctas: contraste.correctas, archivo: path.basename(contrasteRuta), sha256: sha(contrasteRuta) },
  cifras: Object.fromEntries(Object.entries(SPIKO).map(([s, v]) => [s, { rentabilidad: v.pct, fechaDato: '2026-11-02' }])),
  referenciasTarjeta: Object.fromEntries(Object.entries(NUEVAS).map(([s, r]) => [s, r.length])),
  altas: [], retiradas: [], colecciones });

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
  if (select count(*) from rwadar_catalogo.plataformas where revision_id = v) <> ${radar.plataformas.length}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v) <> ${ofertas.length}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'principales') <> ${colecciones.principales}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'secundario') <> ${colecciones.secundario}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'en_camino') <> ${colecciones.en_camino} then
    raise exception 'Catálogo incompleto: se conserva el lote anterior';
  end if;
  update rwadar_catalogo.revisiones set estado = 'aprobada', aprobada_el = now(),
    aprobada_referencia = 'Revisión del ${FES} (entrega ${REVISION}): radar y 23 fichas comprobados hoy con fuentes primarias, revisión independiente y tres datos de tarjeta en castellano. Investigación pedida por Víctor el ${FES}; ciclo autorizado por su orden.'
    where id = v and estado = 'borrador';
  if not exists (select 1 from rwadar_catalogo.revision_publicable_v2 where id = v) then
    raise exception 'Entrega no publicable: se deshace la transacción completa';
  end if;
end $aprobar$;
`;
escribir(path.join(destino, 'aplicar-y-aprobar.sql'),
  `-- Revisión del catálogo del ${FES} (entrega ${REVISION}) sobre la publicada del mismo día. Ciclo pedido y autorizado por Víctor.\n` +
  '-- Radar y 23 fichas comprobados hoy; tres datos de tarjeta en castellano.\n' +
  nueva.sql.replace('-- El lote entra como BORRADOR. Este fichero nunca lo aprueba ni lo publica.',
    '-- Este aplicador importa y aprueba al final, únicamente si pasan todas las guardas.')
    .replace('begin;', 'begin isolation level serializable;\n' + guarda)
    .replace(/commit;\n$/, aprobar + 'commit;\n'));
escribir(path.join(destino, 'revision.json'), { versionEsquema: 2, revisionId: nueva.revisionId, hash: nueva.hash,
  revisionAnterior: PREVIA, revisionAnteriorComprobadaEnRemoto: true, etiqueta: REVISION, fechaRadar: FECHA,
  plataformas: radar.plataformas.length, ofertas: ofertas.length, colecciones, vigenciaDias: 7,
  nuevasAltas: 0, retiradas: 0, estado: 'borrador', aplicadoEnRemoto: false, publicacionWeb: false });
console.log(JSON.stringify({ revisionId: nueva.revisionId, previa: PREVIA, sha256: sha(path.join(destino, 'aplicar-y-aprobar.sql')),
  ofertas: ofertas.length, colecciones }));

// Lote del catálogo del 02/11/2026: 23 ofertas comprobadas (camino B de la
// investigación del 01/11, elegido por Víctor). Preparación LOCAL y
// reproducible: no consulta la red ni escribe servicios remotos.
//
//   node rwadar-app/data/verificaciones/2026-11-02-v2/preparar-lote.mjs
//
// Parte del lote publicado del 23/10 (leído como visitante el 01/11) y de:
// - radar-contraste-2026-11-02.json: las 69 fuentes del radar comprobadas hoy;
// - ../2026-11-01-v2/propuesta-tarjetas.json y sus expedientes, con los
//   cambios obligatorios de la revisión independiente ya aplicados;
// - lecturas/: cifras dinámicas vueltas a leer hoy (Spiko).
// Retira 28 fichas, añade 2 altas y reclasifica las demás. En «reventa» y
// «en camino» no hay rentabilidad, precio ni disponibilidad (regla del
// contrato) y se quitan los precios de mercado que cambian a diario.
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
const FECHA = '2026-11-02', DESDE = '2026-10-23';
const PREVIA = 'c406fa37-a1d3-281c-117a-95819762cfcf'; // leída en las vistas públicas el 01/11 13:10 UTC
const INVESTIGACION = path.resolve(DIR, '../2026-11-01-v2');
const AVISO_GENERAL = 'Referencia editorial gratuita. El proveedor comprueba admisión, condiciones y riesgos; ' +
  'RWAdar no recibe dinero de inversiones.';

const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const escribir = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); };
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base = path.resolve(DIR, `../${DESDE}-v2`);

// ---------------------------------------------------------------- partida
const previa = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: DESDE, versionEsquema: 2 }));
assert.equal(previa.revisionId, PREVIA, 'la base local no es la revisión publicada leída el 01/11');
const lectura = leer(path.join(INVESTIGACION, 'lectura-publica', 'ofertas-v2.json'));
assert.ok(lectura.length === 49 && lectura.every(o => o.revision_id === PREVIA), 'lectura pública distinta');

const radar = leer(path.join(base, 'radar-canonico-26.json'));
const escAnterior = leer(path.join(base, 'escaparate-publicacion.json'));
const docAnterior = leer(path.join(base, 'documentacion-ofertas.json'));
const anteriorPorSlug = new Map(escAnterior.ofertas.map(o => [o.slug, o]));
const propuestaRuta = path.join(INVESTIGACION, 'propuesta-tarjetas.json');
const propuesta = leer(propuestaRuta);
assert.equal(propuesta.ofertas.length, 23);
assert.equal(propuesta.retiradasPropuestas.length, 28);
const contrasteRuta = path.join(DIR, `radar-contraste-${FECHA}.json`);
const contraste = leer(contrasteRuta);
assert.ok(contraste.fecha === FECHA && contraste.correctas === radar.fuentes.length && !contraste.bloqueos.length,
  'el radar no está comprobado hoy al completo: no se monta el lote');

// ---------------------------------------------------------------- radar
radar.verificadoEl = FECHA;
radar.alcance = 'Revisión editorial de fuentes primarias del 02/11/2026: las 69 fuentes del radar se volvieron a ' +
  'consultar con navegador sin sesión y siguen diciendo lo que respaldan. No acredita onboarding, oferta abierta ni rentabilidad.';
radar.fuentes = radar.fuentes.map(f => ({ ...f, primaria: true, consultadaEl: FECHA }));
const fuentePorId = new Map(radar.fuentes.map(f => [f.id, f]));
const conFuentes = campo => ({ ...campo, fuentes: campo.fuentes.map(id => {
  assert.ok(fuentePorId.has(id), `fuente inexistente: ${id}`);
  return fuentePorId.get(id);
}) });

// ---------------------------------------------------------------- cifras de hoy
const yieldHoy = clase => {
  const y = leer(path.join(DIR, 'lecturas', `spiko-${clase}-yield.json`));
  const pct = (Number(y.monthlyYield) * 100).toFixed(2).replace('.', ',') + ' %';
  const dato = y.updatedAt.slice(0, 10);
  return { pct, dato, fechaEs: dato.split('-').reverse().join('/') };
};
const EUTBL = yieldHoy('EUTBL'), USTBL = yieldHoy('USTBL');

// ---------------------------------------------------------------- ofertas
const esHttps = u => typeof u === 'string' && /^https:\/\/[^\s]+$/.test(u);
const DINAMICAS = /^(Precio de referencia|Venta más barata|Mejor compra|Rentabilidad publicada|Precio del emisor|Última operación|Última compra|Venta$|Recaudado|Valor por token)/;
const aviso = texto => ({ texto, tono: 'warn', esAntiguedad: false, verificadaEl: FECHA });

function metricasPara(slug, coleccion, tarjeta) {
  let metricas = tarjeta.metricas.map(m => ({ etiqueta: m.etiqueta, valor: m.valor }));
  if (slug === 'spiko-letras-del-tesoro-euro' || slug === 'spiko-letras-del-tesoro-dolar') {
    const y = slug.endsWith('euro') ? EUTBL : USTBL;
    metricas = metricas.filter(m => !m.etiqueta.startsWith('Rentabilidad publicada'));
    metricas.push({ etiqueta: `Rentabilidad publicada · 31 días · ${y.fechaEs}${slug.endsWith('dolar') ? ' · en USD' : ''}`, valor: y.pct });
  }
  if (coleccion !== 'principales') {
    // Colección documental: sin cifras de mercado del día.
    metricas = metricas.filter(m => !DINAMICAS.test(m.etiqueta));
    if (slug === 'casa-de-outeiro' || slug === 'terreno-con-arrendamiento-billa') {
      // Estado de la campaña, comprobado por la revisión independiente el 02/11.
      const original = tarjeta.metricas.find(m => /^(Recaudado|Suscrito)/.test(m.etiqueta));
      metricas = metricas.filter(m => !/^(Recaudado|Suscrito)/.test(m.etiqueta));
      if (original) metricas.push({ etiqueta: original.etiqueta.replace(/01\/11\/2026/, '02/11/2026')
        .replace('API 01/11/2026', 'API 02/11/2026'), valor: original.valor.replace('API 01/11/2026', 'API 02/11/2026') });
    }
  }
  if (slug === 'aktionariat') {
    metricas = metricas.map(m => m.etiqueta.startsWith('Precio del emisor')
      ? { etiqueta: 'Precio del emisor · 02/11/2026', valor: m.valor } : m)
      .map(m => m.etiqueta === 'Venta' ? { etiqueta: 'Venta', valor: 'Solo a otros accionistas; el emisor no recompra' } : m);
  }
  assert.ok(metricas.length, `${slug}: sin métricas`);
  return metricas;
}

function avisosPara(slug, coleccion, tarjeta, exp) {
  let textos = [...tarjeta.avisos];
  if (!textos.includes(AVISO_GENERAL)) textos.unshift(AVISO_GENERAL);
  textos = [AVISO_GENERAL, ...textos.filter(t => t !== AVISO_GENERAL)];
  // Correcciones de la revisión independiente del SQL (02/11/2026).
  const CAMBIO = {
    'El 5,07 % es una previsión del emisor sobre el nominal; todavía no se ha pagado ningún reparto.':
      'El reparto que prevé el emisor no está garantizado y todavía no se ha pagado ninguno.',
    'El precio del emisor (8,50) está por encima de la mejor venta entre accionistas (8,40).':
      'El precio del emisor está por encima de la mejor oferta de venta entre accionistas.',
    'El 01/11/2026 la suscripción estaba pausada en el contrato de Ethereum.':
      'El 01/11/2026 (domingo) la suscripción figuraba pausada en el contrato de Ethereum; el 02/11 volvía a estar activa.',
  };
  textos = textos.map(t => CAMBIO[t] || t);
  if (textos.some(t => t.startsWith('Acceso desde España no confirmado'))) {
    textos = textos.filter(t => t !== 'El portal no indica qué países pueden comprar: no consta acceso desde España.');
  }
  textos = [...new Set(textos)];
  if (coleccion === 'secundario' && exp.plataformaSlug === 'brickwise') {
    textos.push('Los precios y el libro de órdenes cambian a diario: compruébalos en la app del proveedor antes de operar.');
  }
  if (slug === 'boss-info' || slug === 'switzerlend') {
    textos.push('El precio del emisor y las ofertas entre accionistas cambian: compruébalos en el portal antes de operar.');
  }
  return textos.map(aviso);
}

const fuentesPara = (tarjeta, previa) => [...new Set([...(tarjeta.fuentesActuales || []), tarjeta.url]
  .filter(esHttps))].slice(0, 12);

function documentacionPara(slug, tarjeta, exp, docPrevia) {
  const caracteristicas = [
    ['Proveedor', exp.proveedor], ['Entidad que comercializa', exp.entidadComercializadora],
    ['Emisor', exp.emisor], ['Qué se adquiere', exp.derechoAdquirido], ['Moneda', exp.moneda],
    ['Identificador', exp.identificador],
  ].filter(([, v]) => typeof v === 'string' && v.trim().length)
    .map(([etiqueta, valor]) => ({ etiqueta, valor: valor.trim().slice(0, 3000) }));
  const referencias = [...(docPrevia?.referencias || [])];
  for (const c of exp.claims || []) {
    if (!['respaldado', 'respaldado_con_alcance'].includes(c.estado) || !esHttps(c.fuentePrimaria)) continue;
    const consulta = String(c.consultadoUtc || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(consulta) || consulta > FECHA || consulta < '2026-11-01') continue;
    const valor = String(c.literal || c.dato || '').trim();
    const alcance = [c.alcanceYLimites, c.localizador ? `Localizador: ${c.localizador}.` : ''].filter(Boolean).join(' ').trim();
    if (!valor || alcance.length < 12) continue;
    const fechaDato = /^\d{4}-\d{2}-\d{2}$/.test(c.fechaDato || '') && c.fechaDato <= consulta ? c.fechaDato : null;
    referencias.push({ etiqueta: `${c.campo} · consulta ${consulta.split('-').reverse().join('/')}`.slice(0, 180),
      valor: valor.slice(0, 3000), fechaDato, fechaConsulta: consulta, fuente: c.fuentePrimaria,
      alcance: alcance.slice(0, 3000) });
  }
  const fuentes = [...new Set([...(docPrevia?.fuentes || []), ...fuentesPara(tarjeta), ...referencias.map(r => r.fuente)]
    .filter(esHttps))];
  const derecho = exp.derechoAdquirido ? ` Qué se adquiere: ${exp.derechoAdquirido}` : '';
  return { revisadaEl: FECHA, descripcion: `${tarjeta.resumen}${derecho}`.slice(0, 6000),
    fuentes, caracteristicas: caracteristicas.length ? caracteristicas : [{ etiqueta: 'Proveedor', valor: exp.proveedor }],
    referencias };
}

const ofertas = [];
const documentacion = {};
for (const item of propuesta.ofertas) {
  const { slug, tarjeta } = item;
  const coleccion = item.coleccionEscenarioB;
  const exp = leer(path.join(INVESTIGACION, 'expedientes', `${slug}.json`));
  const anterior = anteriorPorSlug.get(slug);
  assert.equal(Boolean(anterior), !item.alta, `${slug}: alta/publicada incoherente`);
  const principal = coleccion === 'principales';
  let rentabilidad = principal && tarjeta.rentabilidad ? { ...tarjeta.rentabilidad } : null;
  if (slug === 'spiko-letras-del-tesoro-euro') rentabilidad = { mostrada: EUTBL.pct,
    literal: `Rendimiento neto anualizado de los últimos 31 días publicado por Spiko el ${EUTBL.fechaEs}; consultado el 02/11/2026. Variable y no garantizado.` };
  if (slug === 'spiko-letras-del-tesoro-dolar') rentabilidad = { mostrada: USTBL.pct,
    literal: `Rendimiento neto anualizado en dólares de los últimos 31 días publicado por Spiko el ${USTBL.fechaEs}; consultado el 02/11/2026. No incluye la variación del euro frente al dólar. Variable y no garantizado.` };
  const estadoRevision = !principal ? 'no_verificable' : slug === 'mtbill' ? 'fuentes_en_conflicto' : 'actual';
  if (estadoRevision !== 'actual') rentabilidad = null;
  const oferta = {
    slug, tipo: tarjeta.tipo || anterior?.tipo || 'valor', titulo: tarjeta.titulo,
    plataformaSlug: exp.plataformaSlug || anterior?.plataformaSlug,
    plataformaNombre: anterior?.plataformaNombre || exp.proveedor,
    categoria: tarjeta.categoria, pais: tarjeta.pais ?? anterior?.pais ?? null,
    resumen: tarjeta.resumen, url: tarjeta.url, cta: 'Ver fuente', imagenAlt: tarjeta.titulo,
    verificadaEl: FECHA, vigenciaDias: anterior?.vigenciaDias ?? 1, permanente: false,
    disponibleEs: principal && item.disponibleEs === 'confirmado' ? true : null,
    eu: anterior?.eu ?? null, fueraLadrillo: tarjeta.categoria !== 'Inmobiliario', puntuacion: null,
    rentabilidad, precio: null, metricas: metricasPara(slug, coleccion, tarjeta),
    avisos: avisosPara(slug, coleccion, tarjeta, exp), estadoRevision,
    fuentesActuales: fuentesPara(tarjeta), coleccion,
    moneda: exp.moneda && /^[A-Z]{3}$/.test(exp.moneda) ? exp.moneda : anterior?.moneda ?? null,
    patrocinada: false,
  };
  if (slug === 'robinhood-classic-stock-tokens') Object.assign(oferta, { plataformaSlug: 'robinhood',
    plataformaNombre: 'Robinhood Europe', moneda: 'EUR' });
  assert.ok(oferta.plataformaSlug && oferta.fuentesActuales.length, `${slug}: plataforma o fuentes`);
  ofertas.push(oferta);
  documentacion[slug] = documentacionPara(slug, tarjeta, exp, docAnterior[slug]);
}
// Orden: principales, reventa y en camino, conservando el orden de la propuesta.
const ORDEN = { principales: 0, secundario: 1, en_camino: 2 };
ofertas.sort((a, b) => ORDEN[a.coleccion] - ORDEN[b.coleccion]);
const colecciones = { principales: 0, secundario: 0, en_camino: 0 };
for (const o of ofertas) colecciones[o.coleccion]++;
const retiradas = propuesta.retiradasPropuestas.map(r => r.slug);
assert.ok(retiradas.every(s => anteriorPorSlug.has(s) && !ofertas.some(o => o.slug === s)));
assert.equal(ofertas.length + retiradas.length - 2, 49, 'cuenta: 49 − 28 + 2 = 23');

// ---------------------------------------------------------------- escaparate
const escaparate = {
  versionEsquema: 2,
  fuente: {
    notaOrigen: 'Revisión del 02/11/2026 (investigación iniciada por Víctor el 01/11): 49 fichas y 56 candidatas ' +
      'investigadas con expediente por oferta y revisión independiente; 28 fichas retiradas y 2 altas. Las cifras ' +
      'se publican solo donde se leyeron en la fuente oficial.',
    actualizacionLocal: { verificadoEl: FECHA,
      archivo: `rwadar-app/data/verificaciones/${FECHA}-v2/contraste-${FECHA}.json`, publicable: false,
      derechosImagenVerificados: false,
      nota: 'Lote del 02/11/2026: 23 fichas comprobadas (6 principales, 14 de reventa y 3 en camino).' },
    actualizacionRadarLocal: { verificadoEl: FECHA,
      archivo: `rwadar-app/data/verificaciones/${FECHA}-v2/radar-canonico-26.json`, publicable: false,
      plataformas: radar.plataformas.length, fuentesPrimarias: radar.fuentes.length },
  },
  plataformas: radar.plataformas.map(p => ({ slug: p.slug, verificacionLocal: {
    verificadoEl: FECHA, conservaFechaCanonica: true,
    estadoOperativo: conFuentes(p.estadoOperativo), licenciaRegistro: conFuentes(p.licenciaRegistro),
    acceso: conFuentes(p.acceso), alertasCriticas: p.alertasCriticas.map(conFuentes),
  } })),
  ofertas,
};
const manifiesto = { version_esquema: 2, plataformas_esperadas: radar.plataformas.length,
  ofertas_esperadas: ofertas.length, colecciones_esperadas: colecciones };

escribir(path.join(DIR, 'radar-canonico-26.json'), radar);
escribir(path.join(DIR, 'escaparate-publicacion.json'), escaparate);
escribir(path.join(DIR, 'documentacion-ofertas.json'), documentacion);
escribir(path.join(DIR, 'manifiesto-catalogo.json'), manifiesto);
escribir(path.join(DIR, `contraste-${FECHA}.json`), { fecha: FECHA, revisionAnterior: PREVIA,
  radar: { fuentes: contraste.fuentes, correctas: contraste.correctas, archivo: path.basename(contrasteRuta),
    sha256: sha(contrasteRuta) },
  propuesta: { archivo: path.relative(ROOT, propuestaRuta), sha256: sha(propuestaRuta) },
  cifrasDeHoy: { EUTBL, USTBL },
  altas: propuesta.ofertas.filter(o => o.alta).map(o => o.slug), retiradas,
  colecciones });
escribir(path.join(DIR, `cambios-${FECHA}.json`), { desde: DESDE, tipo: 'revision_integral_con_retiradas',
  alcance: radar.alcance, referenciaAprobacion: 'Revisión del 02/11/2026: 23 fichas, 2 altas, 28 retiradas. ' +
    'Autorizada por Víctor el 02/11/2026 (camino B). Expedientes y revisión independiente en verificaciones/2026-11-01-v2.',
  retiradas, altas: propuesta.ofertas.filter(o => o.alta).map(o => o.slug) });

// ---------------------------------------------------------------- SQL
const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: FECHA, versionEsquema: 2 }));
const destino = path.join(ROOT, `rwadar-app/data/importaciones/catalogo-${FECHA}-v2`);
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
  if current_date < date '${FECHA}' then raise exception 'Revisión fechada en el futuro'; end if;
  if exists (select 1 from rwadar_catalogo.revisiones where id = '${nueva.revisionId}'::uuid
    and (contenido_sha256 <> '${nueva.hash}' or estado = 'retirada')) then
    raise exception 'La revisión destino existe con otra identidad o está retirada';
  end if;
end $guarda$;
`;
const aprobar = `do $aprobar$
declare v uuid := '${nueva.revisionId}';
begin
  if (select count(*) from rwadar_catalogo.plataformas where revision_id = v) <> ${manifiesto.plataformas_esperadas}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v) <> ${manifiesto.ofertas_esperadas}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'principales') <> ${colecciones.principales}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'secundario') <> ${colecciones.secundario}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'en_camino') <> ${colecciones.en_camino} then
    raise exception 'Catálogo incompleto: se conserva el lote anterior';
  end if;
  update rwadar_catalogo.revisiones set estado = 'aprobada', aprobada_el = now(),
    aprobada_referencia = 'Revisión del 02/11/2026: 23 fichas comprobadas, 2 altas y 28 retiradas; autorizada por Víctor el 02/11/2026.'
    where id = v and estado = 'borrador';
  if not exists (select 1 from rwadar_catalogo.revision_publicable_v2 where id = v) then
    raise exception 'Revisión no publicable: se deshace la transacción completa';
  end if;
  raise notice 'RWAdar: revisión % aprobada (${manifiesto.plataformas_esperadas} plataformas, ${manifiesto.ofertas_esperadas} fichas).', v;
end $aprobar$;
`;
assert.ok(nueva.sql.includes('begin;') && nueva.sql.endsWith('commit;\n'));
escribir(path.join(destino, 'aplicar-y-aprobar.sql'),
  '-- Revisión del catálogo del 02/11/2026: importa y aprueba en una sola transacción.\n' +
  '-- Autorizada por Víctor el 02/11/2026. Se aplica con el flujo «Aplicar catálogo» desde main.\n' +
  nueva.sql.replace('-- El lote entra como BORRADOR. Este fichero nunca lo aprueba ni lo publica.',
    '-- Este aplicador importa y aprueba al final, únicamente si pasan todas las guardas.')
    .replace('begin;', 'begin isolation level serializable;\n' + guarda)
    .replace(/commit;\n$/, aprobar + 'commit;\n'));
escribir(path.join(destino, 'revision.json'), { versionEsquema: 2, revisionId: nueva.revisionId, hash: nueva.hash,
  revisionAnterior: PREVIA, revisionAnteriorComprobadaEnRemoto: true, fechaRadar: FECHA,
  plataformas: manifiesto.plataformas_esperadas, ofertas: manifiesto.ofertas_esperadas, colecciones,
  altas: 2, retiradas: 28, estado: 'borrador', revisionIndependienteSQL: false, aplicadoEnRemoto: false,
  publicacionWeb: false });
console.log(JSON.stringify({ revisionId: nueva.revisionId, hash: nueva.hash, plataformas: manifiesto.plataformas_esperadas,
  ofertas: manifiesto.ofertas_esperadas, colecciones, EUTBL: EUTBL.pct, USTBL: USTBL.pct }));

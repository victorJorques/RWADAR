// Entrega del catálogo «2026-11-05.2». Víctor, 05/11/2026: «Arregla todo, no dejes nada para
// mañana»; y, preguntado por BILLA y Casa de Outeiro hacia las 17:10 UTC, «Retirar las dos hoy».
// Preparación LOCAL: sin red ni servicios remotos. Reproducible byte a byte.
//
//   node rwadar-app/data/verificaciones/2026-11-05.2-v2/preparar-entrega.mjs
//
// Parte exactamente de la revisión publicada cede1f27 (entrega 2026-11-05), leída hoy como
// visitante (lectura-publica/), y cambia tres cosas, nada más:
// 1. public.plataformas: la columna «web» de Pax Gold pasa de https://paxos.com/paxgold a
//    https://www.paxg.com/ (cambios-plataformas.json). Es la que usan la vista
//    catalogo_plataformas_publicas_v2, el botón «Ir a la web de Pax Gold», el JSON-LD de
//    /plataformas/pax-gold y rwadar.csv. El radar ya citaba paxg.com desde la 2026-11-05.
// 2. Radar: el texto de acceso de Spiko dice lo que muestra la CNMV (cambios-radar.json), con dos
//    fuentes nuevas: la ficha de SPIKO SICAV (spiko-cnmv-iic) y la de Spiko Finance en libre
//    prestación (spiko-cnmv-lps). Sus comprobaciones están en data/comprobaciones-fuentes.json.
// 3. Salen del catálogo BILLA (terreno-con-arrendamiento-billa, Brickwise) y Casa de Outeiro
//    (casa-de-outeiro, Alius), por decisión expresa de Víctor (comprobacion-retiradas.json).
//    Quedan 22 ofertas: 8 principales, 13 de reventa y 1 en camino (Hausera).
// Todo lo demás (las otras 22 ofertas, cifras, vigencia hasta el 12/11, demás plataformas y
// fuentes) es igual que en la cede1f27. El SQL lo hace todo en una transacción con guardas.
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
const { leerBloquesCatalogo } = require(path.join(ROOT, 'rwadar-fichas.js'));
const ETIQUETA = '2026-11-05.2', FECHA = '2026-11-05', DESDE = '2026-11-05', HOY = '2026-11-05';
const FES = '05/11/2026';
const ULTIMO = '2026-11-12'; // último día vigente: las fichas siguen verificadas el 05/11, con 7 días
const PREVIA = 'cede1f27-b5eb-36d3-e223-eb4155df2572';
const HASH_PREVIA = 'cede1f27b5eb36d3e223eb4155df257228fc98e517776cefa0693a0657088823';
const RETIRADAS = ['terreno-con-arrendamiento-billa', 'casa-de-outeiro'];
const PAX = 'pax-gold', WEB_VIEJA = 'https://paxos.com/paxgold', WEB_NUEVA = 'https://www.paxg.com/';
const FUENTES_NUEVAS = ['spiko-cnmv-iic', 'spiko-cnmv-lps'];
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const escribir = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); };
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const q = v => v === null ? 'null' : `'${String(v).replace(/'/g, "''")}'`;
const base = path.resolve(DIR, `../${DESDE}-v2`);

// ---------------------------------------------------------------- partida: la publicada
const previa = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: DESDE, versionEsquema: 2 }));
assert.equal(previa.revisionId, PREVIA, `la ${DESDE} local no es la revisión publicada`);
assert.equal(previa.hash, HASH_PREVIA, `identidad (huella) de la ${DESDE}`);
const revisionDesde = leer(path.join(ROOT, `rwadar-app/data/importaciones/catalogo-${DESDE}-v2/revision.json`));
assert.deepEqual([revisionDesde.revisionId, revisionDesde.hash, revisionDesde.venceTrasEl], [PREVIA, HASH_PREVIA, ULTIMO]);
const snapshot = leerBloquesCatalogo(fs.readFileSync(path.join(ROOT, 'rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8'));
assert.ok([...snapshot.plataformas, ...snapshot.ofertas].every(x => x.revisionId === PREVIA), 'snapshot de la última sincronización');
const radarBase = leer(path.join(base, 'radar-canonico-26.json'));
const escaparateBase = leer(path.join(base, 'escaparate-publicacion.json'));
const docBase = leer(path.join(base, 'documentacion-ofertas.json'));
const manifiestoBase = leer(path.join(base, 'manifiesto-catalogo.json'));

// Lo leído hoy como visitante (lectura-publica/, 17:06:58–17:07:19 UTC) es exactamente la base local.
const lp = path.join(DIR, 'lectura-publica');
const pubO = leer(path.join(lp, 'ofertas-v2.json')), pubP = leer(path.join(lp, 'plataformas-v2.json'));
const pubT = leer(path.join(lp, 'plataformas-todas.json')), pubD = leer(path.join(lp, 'descartadas.json'));
const [pubPax] = leer(path.join(lp, 'pax-gold-plataforma.json'));
assert.ok([...pubO, ...pubP].every(x => x.revision_id === PREVIA), 'la publicada leída hoy es la cede1f27');
assert.equal(pubO.length, escaparateBase.ofertas.length); assert.equal(pubP.length, escaparateBase.plataformas.length);
for (const o of pubO) {
  assert.deepEqual(o.documentacion, docBase[o.slug], `${o.slug}: documentación publicada = base local`);
  assert.deepEqual(o.fuentes_actuales, escaparateBase.ofertas.find(x => x.slug === o.slug).fuentesActuales, `${o.slug}: fuentes`);
  assert.equal(o.coleccion, escaparateBase.ofertas.find(x => x.slug === o.slug).coleccion, `${o.slug}: colección`);
}
// La vista devuelve las fuentes de cada campo en su orden y sin «publicadaEl» (la base no la guarda).
const ordenar = v => JSON.parse(JSON.stringify(v), (k, x) => k === 'publicadaEl' ? undefined
  : k === 'fuentes' && Array.isArray(x) ? [...x].sort((a, b) => (a.id < b.id ? -1 : 1)) : x);
for (const p of pubP) assert.deepEqual(ordenar(p.verificacion_local),
  ordenar(escaparateBase.plataformas.find(x => x.slug === p.slug).verificacionLocal), `${p.slug}: verificación publicada = base local`);
assert.deepEqual(pubT.filter(p => p.estado === 'en_radar').map(p => p.slug).sort(), escaparateBase.plataformas.map(p => p.slug).sort(),
  'public.plataformas en el radar = las 25 del lote');
assert.equal(pubT.filter(p => p.estado === 'descartada').length, 5); assert.equal(pubD.length, 5);

// ---------------------------------------------------------------- 1 · public.plataformas (Pax Gold)
const plat = leer(path.join(DIR, 'cambios-plataformas.json'));
assert.equal(plat.etiqueta, ETIQUETA);
assert.deepEqual([plat.revisionPublicadaExigida, plat.hashRevisionPublicadaExigida], [PREVIA, HASH_PREVIA]);
assert.deepEqual(Object.keys(plat.plataformas), [PAX]);
const pax = plat.plataformas[PAX];
for (const [col, valor] of Object.entries(pax.antes)) assert.deepEqual(pubPax[col], valor, `Pax Gold.${col}: «antes» = lo leído hoy`);
assert.equal(pubPax.id, pax.id); assert.deepEqual(pubPax.fuentes, [], 'Pax Gold no tiene fuentes propias en public.fuentes');
assert.equal(pubP.find(p => p.slug === PAX).web, WEB_VIEJA, 'la vista pública enseña la web vieja');
assert.deepEqual(Object.keys(pax.despues), Object.keys(pax.antes));
assert.deepEqual(Object.keys(pax.antes).filter(c => JSON.stringify(pax.antes[c]) !== JSON.stringify(pax.despues[c])), ['web'], 'solo cambia la web');
assert.deepEqual([pax.antes.web, pax.despues.web, pax.antes.estado], [WEB_VIEJA, WEB_NUEVA, 'en_radar']);
assert.equal(pax.comprobadoHoy.url, WEB_NUEVA); assert.match(pax.comprobadoHoy.horaUtc, /^2026-11-05T/);
const COMPROBACIONES = leer(path.join(ROOT, 'rwadar-app/data/comprobaciones-fuentes.json')).fuentes;
const copia = n => fs.readFileSync(path.join(DIR, n), 'utf8');
const cumple = (id, texto) => COMPROBACIONES[id].every(p => new RegExp(p, 'i').test(texto.replace(/\s+/g, ' ')));
assert.ok(cumple('paxg-web', copia(pax.comprobadoHoy.copia)), 'paxg.com sigue diciendo lo que respalda (copia de hoy)');
// El radar de la 2026-11-05 ya cita la web nueva: la columna de public.plataformas se pone igual.
assert.equal(radarBase.fuentes.find(f => f.id === 'paxg-web').url, WEB_NUEVA);

// ---------------------------------------------------------------- 2 · radar (Spiko)
const cr = leer(path.join(DIR, 'cambios-radar.json'));
assert.deepEqual([cr.fecha, cr.etiqueta], [FECHA, ETIQUETA]);
assert.deepEqual(Object.keys(cr.fuentesNuevas), FUENTES_NUEVAS);
assert.deepEqual(Object.keys(cr.plataformas), ['spiko']); assert.deepEqual(Object.keys(cr.plataformas.spiko), ['acceso']);
const radar = structuredClone(radarBase);
for (const [id, f] of Object.entries(cr.fuentesNuevas)) {
  assert.ok(!radar.fuentes.some(x => x.id === id || x.url === f.url), `${id}: ya estaba en el radar`);
  assert.deepEqual(COMPROBACIONES[id], f.comprobaciones, `${id}: comprobaciones-fuentes.json`);
  const lectura = f.lecturas.find(l => l.url === f.url);
  assert.ok(lectura && lectura.http === 200 && lectura.horaUtc.startsWith(FECHA), `${id}: abierta hoy`);
  assert.ok(cumple(id, copia(lectura.copia)), `${id}: la ficha de hoy dice lo que respalda`);
  for (const l of f.lecturas) for (const literal of l.literales) assert.ok(copia(l.copia).includes(literal), `${id}: literal en la copia`);
  assert.match(f.url, /^https:\/\/www\.cnmv\.es\/portal\/consultas\//);
  radar.fuentes.push({ id, tipo: f.tipo, titulo: f.titulo, url: f.url, primaria: true, consultadaEl: FECHA });
}
const acc = cr.plataformas.spiko.acceso;
const spiko = radar.plataformas.find(p => p.slug === 'spiko');
assert.equal(spiko.acceso.detalle, acc.antes, 'Spiko: texto de acceso «antes»');
assert.deepEqual(spiko.acceso.fuentes, acc.fuentesAntes);
assert.deepEqual(acc.fuentes, [...acc.fuentesAntes, ...FUENTES_NUEVAS]);
assert.match(acc.antes, /No hemos comprobado en la CNMV que el fondo se comercialice en España/);
// Lo que pide la revisión independiente de la 2026-11-05 (spiko.md, corrección 2) y Víctor.
const nuevo = acc.detalle;
assert.equal(nuevo, nuevo.trim().replace(/\s+/g, ' '));
assert.doesNotMatch(nuevo, /comercializa(?:n)? en España|se comercializa|No hemos comprobado en la CNMV/i, 'no afirma que el fondo se comercializa en España');
for (const t of ['CNMV', 'SPIKO SICAV', 'n.º 2380', 'Aldana Capital', 'Spiko Finance', 'libre prestación (n.º 5325)',
  'no muestra qué compartimentos de la SICAV están dados de alta en España']) assert.ok(nuevo.includes(t), `Spiko: falta «${t}»`);
const [amf, regafi] = acc.antes.split(/(?<=\.) /);
assert.ok(nuevo.startsWith(`${amf} ${regafi} `), 'se conserva lo que dice de la AMF y del REGAFI');
assert.match(nuevo, /No llegamos a darnos de alta\.$/);
spiko.acceso = { ...spiko.acceso, detalle: nuevo, fuentes: acc.fuentes };
radar.alcance = `Revisión editorial de fuentes primarias del ${FES}: las ${radarBase.fuentes.length} fuentes del radar se volvieron a ` +
  'consultar sin sesión y siguen diciendo lo que respaldan; Pax Gold cita su web oficial (paxg.com). Entrega ' +
  `${ETIQUETA}: el acceso de Spiko cita dos fichas de la CNMV, consultadas esa tarde. No acredita onboarding, oferta abierta ni rentabilidad.`;
assert.ok(radar.alcance.length >= 20 && radar.alcance.length <= 500, 'origen de la revisión: entre 20 y 500 caracteres');
assert.equal(radar.verificadoEl, FECHA, 'el radar sigue fechado el 05/11');
{ // Nada más cambia en el radar.
  const r = structuredClone(radar);
  r.alcance = radarBase.alcance; r.fuentes = r.fuentes.filter(f => !FUENTES_NUEVAS.includes(f.id));
  r.plataformas.find(p => p.slug === 'spiko').acceso = radarBase.plataformas.find(p => p.slug === 'spiko').acceso;
  assert.deepEqual(r, radarBase, 'radar: solo el acceso de Spiko, dos fuentes nuevas y el alcance');
}
const fuentePorId = new Map(radar.fuentes.map(f => [f.id, f]));
const conFuentes = campo => ({ ...campo, fuentes: campo.fuentes.map(id => { assert.ok(fuentePorId.has(id), id); return fuentePorId.get(id); }) });

// ---------------------------------------------------------------- 3 · retiradas
const ret = leer(path.join(DIR, 'comprobacion-retiradas.json'));
assert.equal(ret.etiqueta, ETIQUETA);
assert.equal(ret.decision.respuesta, 'Retirar las dos hoy');
assert.deepEqual(ret.retirar.map(r => r.slug), RETIRADAS);
for (const r of ret.retirar) {
  const o = escaparateBase.ofertas.find(x => x.slug === r.slug);
  assert.ok(o, `${r.slug}: no está publicada`);
  assert.equal(o.coleccion, 'en_camino'); assert.equal(r.coleccion, 'en_camino'); assert.equal(o.titulo, r.titulo);
  assert.ok(r.motivo.length > 80 && r.textoRetirada.startsWith(`Retirada el ${FES}:`));
  assert.ok(r.fuentes.length >= 2 && r.fuentes.every(f => /^https:\/\//.test(f.url) && f.literal && f.horaUtc.startsWith(FECHA)), `${r.slug}: fuentes de hoy`);
  // Las fuentes salen del expediente de hoy de la 2026-11-05.
  const exp = JSON.stringify(leer(path.join(base, 'expedientes', `${r.slug}.json`)));
  assert.ok(r.fuentes.some(f => exp.includes(f.url)), `${r.slug}: fuentes del expediente de hoy`);
}
assert.deepEqual(ret.seQuedan, escaparateBase.ofertas.map(o => o.slug).filter(s => !RETIRADAS.includes(s)));
const escaparate = structuredClone(escaparateBase);
const documentos = structuredClone(docBase);
escaparate.ofertas = escaparate.ofertas.filter(o => !RETIRADAS.includes(o.slug));
for (const slug of RETIRADAS) delete documentos[slug];
const colecciones = { principales: 0, secundario: 0, en_camino: 0 };
for (const o of escaparate.ofertas) colecciones[o.coleccion]++;
assert.deepEqual(colecciones, { principales: 8, secundario: 13, en_camino: 1 });
assert.deepEqual(colecciones, ret.coleccionesDespues);
assert.deepEqual(escaparate.ofertas.filter(o => o.coleccion === 'en_camino').map(o => o.slug), ['hausera-proximas-ofertas']);

// ---------------------------------------------------------------- escaparate y manifiesto
escaparate.plataformas = escaparate.plataformas.map(p => p.slug !== 'spiko' ? p
  : { ...p, verificacionLocal: { ...p.verificacionLocal, acceso: conFuentes(spiko.acceso) } });
escaparate.fuente.notaOrigen += ` Entrega ${ETIQUETA} (${FES}, pedida por Víctor): salen BILLA (Brickwise) y Casa de Outeiro (Alius), ` +
  'con el plazo de su campaña vencido sin prórroga publicada; el acceso de Spiko dice lo que muestra la CNMV; las otras 22 fichas, iguales.';
escaparate.fuente.actualizacionLocal = { ...escaparate.fuente.actualizacionLocal,
  archivo: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/contraste-${ETIQUETA}.json`,
  nota: `Lote del ${FES} (entrega ${ETIQUETA}: salen BILLA y Casa de Outeiro): ${escaparate.ofertas.length} fichas (${colecciones.principales} principales, ` +
    `${colecciones.secundario} de reventa y ${colecciones.en_camino} en camino) y ${radar.plataformas.length} plataformas.` };
escaparate.fuente.actualizacionRadarLocal = { ...escaparate.fuente.actualizacionRadarLocal,
  archivo: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/radar-canonico-26.json`, fuentesPrimarias: radar.fuentes.length };
const manifiesto = { ...manifiestoBase, ofertas_esperadas: escaparate.ofertas.length, colecciones_esperadas: colecciones };
assert.deepEqual(manifiesto, { version_esquema: 2, plataformas_esperadas: 25, ofertas_esperadas: 22,
  colecciones_esperadas: { principales: 8, secundario: 13, en_camino: 1 } });
{ // Nada más cambia: las 22 ofertas y su documentación, idénticas; las otras 24 plataformas, idénticas.
  assert.deepEqual(escaparate.ofertas, escaparateBase.ofertas.filter(o => !RETIRADAS.includes(o.slug)));
  assert.deepEqual(Object.keys(documentos), Object.keys(docBase).filter(s => !RETIRADAS.includes(s)));
  for (const s of Object.keys(documentos)) assert.deepEqual(documentos[s], docBase[s], `${s}: documentación`);
  const e = structuredClone(escaparate);
  e.fuente = escaparateBase.fuente; e.ofertas = escaparateBase.ofertas;
  e.plataformas.find(p => p.slug === 'spiko').verificacionLocal.acceso = escaparateBase.plataformas.find(p => p.slug === 'spiko').verificacionLocal.acceso;
  assert.deepEqual(e, escaparateBase, 'escaparate: solo el acceso de Spiko, las dos retiradas y las notas');
}
escribir(path.join(DIR, 'radar-canonico-26.json'), radar);
escribir(path.join(DIR, 'escaparate-publicacion.json'), escaparate);
escribir(path.join(DIR, 'documentacion-ofertas.json'), documentos);
escribir(path.join(DIR, 'manifiesto-catalogo.json'), manifiesto);

// ---------------------------------------------------------------- SQL
const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: ETIQUETA, versionEsquema: 2 }));
assert.notEqual(nueva.revisionId, PREVIA, 'la revisión nueva tiene otra identidad');
assert.equal(nueva.fecha, FECHA);
const destino = path.join(ROOT, `rwadar-app/data/importaciones/catalogo-${ETIQUETA}-v2`);
escribir(path.join(destino, 'catalogo.sql'), nueva.sql);
const guarda = `do $guarda$
declare actual uuid; retirada boolean;
begin
  select revision_id into actual from rwadar_catalogo.publicacion_v2 where unica for update;
  if actual is null or actual not in ('${PREVIA}'::uuid, '${nueva.revisionId}'::uuid) then
    raise exception 'Publicación distinta de la revisión anterior prevista: %. No aplicar este lote.', actual;
  end if;
  if actual = '${PREVIA}'::uuid and not exists (select 1 from rwadar_catalogo.revisiones where id = '${PREVIA}'::uuid
    and contenido_sha256 = '${HASH_PREVIA}' and estado = 'aprobada') then
    raise exception 'La revisión publicada no tiene la identidad prevista o no está aprobada. No aplicar este lote.';
  end if;
  select retirado into retirada from public.catalogo_publicacion where unica for update;
  if retirada is distinct from false then
    raise exception 'Catálogo retirado o control ausente: este lote no autoriza reactivarlo.';
  end if;
  if current_date < date '${HOY}' then raise exception 'Revisión futura'; end if;
  if current_date > date '${ULTIMO}' then
    raise exception 'Lote caducado: sus fichas valían hasta el ${ULTIMO.split('-').reverse().join('/')}. No aplicar este lote.';
  end if;
  if exists (select 1 from rwadar_catalogo.revisiones where id = '${nueva.revisionId}'::uuid
    and (contenido_sha256 <> '${nueva.hash}' or estado = 'retirada')) then
    raise exception 'La revisión destino existe con otra identidad o está retirada';
  end if;
end $guarda$;
`;
// Pax Gold, columna a columna como se leyó hoy, con la web vieja o ya la nueva; sin fuentes propias.
const COLS = Object.keys(pax.antes);
const filaPax = web => COLS.map(c => c === 'web' ? `p.web = ${q(web)}`
  : pax.antes[c] === null ? `p.${c} is null` : c === 'verificada_el' ? `p.${c} = ${q(pax.antes[c])}::date`
  : `p.${c}::text = ${q(pax.antes[c])}`).join('\n        and ');
const sinFuentes = 'not exists (select 1 from public.fuentes f where f.plataforma_id = p.id)';
const PAX_COMO = web => `exists (select 1 from public.plataformas p where ${filaPax(web)}
        and ${sinFuentes})`;
const cuenta = (estado, n) => `(select count(*) from public.plataformas where estado = ${q(estado)}) = ${n}`;
const CUENTAS = `${cuenta('en_radar', plat.radar.enRadar)} and ${cuenta('descartada', plat.radar.descartadas)}`;
const bloquePlataformas = `-- public.plataformas: la web de Pax Gold pasa de ${WEB_VIEJA} (redirige a una página comercial de
-- Paxos) a ${WEB_NUEVA}, la web oficial de PAXG, que el radar ya cita desde la entrega ${DESDE}. Solo
-- esa columna; el estado no cambia, así que no hay cambios de estado ni avisos. El disparador de
-- siempre pone actualizada_el = now(). Solo si Pax Gold está como se leyó hoy (con la web vieja o ya
-- con la nueva); si no, no se aplica nada.
do $plataformas_guarda$
begin
  perform 1 from public.plataformas where slug = ${q(PAX)} for update;
  if not (${PAX_COMO(WEB_VIEJA)}
      or ${PAX_COMO(WEB_NUEVA)}) then
    raise exception 'Pax Gold no está como se leyó hoy (web vieja o ya la nueva, mismos datos y sin fuentes propias): no aplicar.';
  end if;
  if not (${CUENTAS}) then
    raise exception 'Tiene que haber ${plat.radar.enRadar} plataformas en el radar y ${plat.radar.descartadas} descartadas: no aplicar.';
  end if;
end $plataformas_guarda$;
update public.plataformas set web = ${q(WEB_NUEVA)} where slug = ${q(PAX)} and web = ${q(WEB_VIEJA)};
do $plataformas_comprobar$
begin
  if not ${PAX_COMO(WEB_NUEVA)} then
    raise exception 'Pax Gold no quedó con su web nueva (${WEB_NUEVA}) y el resto igual.';
  end if;
  if not (${CUENTAS}) then
    raise exception 'Cambiaron las cuentas del radar o de las descartadas.';
  end if;
end $plataformas_comprobar$;
`;
const aprobar = `do $aprobar$
declare v uuid := '${nueva.revisionId}';
begin
  if (select count(*) from rwadar_catalogo.plataformas where revision_id = v) <> ${escaparate.plataformas.length}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v) <> ${escaparate.ofertas.length}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'principales') <> ${colecciones.principales}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'secundario') <> ${colecciones.secundario}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'en_camino') <> ${colecciones.en_camino}
    or exists (select 1 from rwadar_catalogo.ofertas where revision_id = v and slug in (${RETIRADAS.map(q).join(', ')}))
    or (select count(*) from rwadar_catalogo.fuentes where revision_id = v and id in (${FUENTES_NUEVAS.map(q).join(', ')})) <> ${FUENTES_NUEVAS.length} then
    raise exception 'Catálogo incompleto: se conserva el lote anterior';
  end if;
  update rwadar_catalogo.revisiones set estado = 'aprobada', aprobada_el = now(),
    aprobada_referencia = 'Entrega ${ETIQUETA}: salen BILLA (Brickwise) y Casa de Outeiro (Alius), por decisión de Víctor del ${FES} («Retirar las dos hoy»); acceso de Spiko con lo que muestra la CNMV; web de Pax Gold en paxg.com. ${escaparate.plataformas.length} plataformas y ${escaparate.ofertas.length} ofertas (${colecciones.principales}/${colecciones.secundario}/${colecciones.en_camino}); el resto, igual a la ${DESDE}.'
    where id = v and estado = 'borrador';
  if not exists (select 1 from rwadar_catalogo.revision_publicable_v2 where id = v) then
    raise exception 'Entrega no publicable: se deshace la transacción completa';
  end if;
  if (select revision_id from rwadar_catalogo.publicacion_v2 where unica) is distinct from v then
    raise exception 'La revisión nueva no quedó publicada: se deshace la transacción completa';
  end if;
end $aprobar$;
`;
const archivo = path.join(destino, 'aplicar-y-aprobar.sql');
escribir(archivo,
  `-- Entrega ${ETIQUETA} (preparada el ${FES}) sobre la revisión publicada ${DESDE} (${PREVIA}). Pedida y autorizada por Víctor.\n` +
  `-- Salen BILLA y Casa de Outeiro; acceso de Spiko con la CNMV; web de Pax Gold. ${escaparate.plataformas.length} plataformas y ${escaparate.ofertas.length} ofertas (${colecciones.principales}/${colecciones.secundario}/${colecciones.en_camino}).\n` +
  `-- Generado por rwadar-app/data/verificaciones/${ETIQUETA}-v2/preparar-entrega.mjs; revisar antes de aplicar.\n` +
  nueva.sql.replace('-- El lote entra como BORRADOR. Este fichero nunca lo aprueba ni lo publica.',
    '-- Este aplicador importa y aprueba al final, únicamente si pasan todas las guardas.')
    .replace('begin;', () => 'begin isolation level serializable;\n' + guarda)
    .replace(/commit;\n$/, () => bloquePlataformas + aprobar + 'commit;\n'));
{
  const sql = fs.readFileSync(archivo, 'utf8');
  const publicas = [...sql.matchAll(/^\s*(insert\s+into|update|delete\s+from)\s+public\.(\w+)/gim)].map(m => `${m[1].toLowerCase()} ${m[2]}`);
  assert.deepEqual(publicas, ['update plataformas'], 'en public.* solo se escribe la web de Pax Gold');
  assert.doesNotMatch(sql, /^\s*(?:truncate|alter|drop|grant|revoke|create)\b/im, 'sin DDL ni permisos');
}
escribir(path.join(destino, 'revision.json'), { versionEsquema: 2, revisionId: nueva.revisionId, hash: nueva.hash,
  revisionAnterior: PREVIA, hashRevisionAnterior: HASH_PREVIA, revisionAnteriorComprobadaEnRemoto: true,
  lecturaPublica: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/lectura-publica/`, etiqueta: ETIQUETA, fechaRadar: FECHA,
  revisionDocumental: HOY, plataformas: escaparate.plataformas.length, ofertas: escaparate.ofertas.length, colecciones,
  vigenciaDias: 7, venceTrasEl: ULTIMO, nuevasAltas: 0, retiradas: RETIRADAS.length, ofertasRetiradas: RETIRADAS,
  fuentesNuevasRadar: FUENTES_NUEVAS, tablasPublicas: ['public.plataformas'],
  cambiosPublicos: [{ tabla: 'public.plataformas', slug: PAX, columna: 'web', antes: WEB_VIEJA, despues: WEB_NUEVA }],
  efectosDeDisparadores: ['public.plataformas.actualizada_el de Pax Gold'],
  estado: 'borrador', aplicadoEnRemoto: false, publicacionWeb: false });

// ---------------------------------------------------------------- contraste (lo que cambia)
escribir(path.join(DIR, `contraste-${ETIQUETA}.json`), { tipo: 'retiradas_y_correcciones', fecha: FECHA, etiqueta: ETIQUETA,
  revisionAnterior: PREVIA, revisionNueva: nueva.revisionId,
  decision: `Víctor, ${FES}: «Arregla todo, no dejes nada para mañana» y, sobre BILLA y Casa de Outeiro, «Retirar las dos hoy».`,
  archivos: Object.fromEntries(['cambios-plataformas.json', 'cambios-radar.json', 'comprobacion-retiradas.json']
    .map(n => [n, sha(path.join(DIR, n))])),
  cuentas: { plataformas: radar.plataformas.length, fuentesRadarAntes: radarBase.fuentes.length, fuentesRadarDespues: radar.fuentes.length,
    ofertasAntes: escaparateBase.ofertas.length, ofertasDespues: escaparate.ofertas.length, descartadas: plat.radar.descartadas },
  cambios: [
    { donde: 'public.plataformas', slug: PAX, columna: 'web', antes: WEB_VIEJA, despues: WEB_NUEVA },
    { donde: 'radar', slug: 'spiko', campo: 'acceso.detalle', antes: acc.antes, despues: acc.detalle },
    { donde: 'radar', slug: 'spiko', campo: 'acceso.fuentes', antes: acc.fuentesAntes, despues: acc.fuentes },
    ...FUENTES_NUEVAS.map(id => ({ donde: 'radar', fuenteNueva: id, url: cr.fuentesNuevas[id].url, titulo: cr.fuentesNuevas[id].titulo })),
    ...ret.retirar.map(r => ({ donde: 'catálogo', retirada: r.slug, titulo: r.titulo, coleccion: r.coleccion, texto: r.textoRetirada })),
  ],
  sinCambios: ['las otras 22 ofertas: documentación, cifras, avisos, colecciones y vigencia (verificadas el 05/11, 7 días: hasta el 12/11)',
    'las otras 24 plataformas del radar, y de Spiko todo menos su texto de acceso', 'las 67 fuentes del radar que ya estaban',
    'las 5 descartadas', 'de public.plataformas, todo menos la web de Pax Gold; public.fuentes'],
  altas: [], retiradas: RETIRADAS, colecciones });
console.log(JSON.stringify({ etiqueta: ETIQUETA, revisionId: nueva.revisionId, hash: nueva.hash, previa: PREVIA, sha256: sha(archivo),
  plataformas: escaparate.plataformas.length, fuentesRadar: radar.fuentes.length, ofertas: escaparate.ofertas.length, colecciones }));

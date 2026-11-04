// Entrega del catálogo «2026-11-04»: arreglos de datos sobre la revisión publicada f2732257
// (entrega 2026-11-03.7, con los textos de la .8 ya aplicados). Preparación LOCAL: sin red ni
// servicios remotos; las páginas se comprobaron antes con curl y Chrome sin interfaz
// (fuentes-para-personas.json, cambios-plataformas.json).
//
// 1. «Datos con su fecha»: las referencias con el nombre interno del campo («accesoEspana ·
//    consulta 01/11/2026») pasan a su rótulo («Acceso desde España · consulta 01/11/2026»)
//    con el diccionario de rwadar-app/rotulos-referencias.js. Valor, fuente y fechas, iguales.
// 2. Fuentes que son direcciones de una API (405 o JSON para una persona): se cambian por la
//    página para personas que muestra lo mismo. El valor y la fecha de consulta no cambian; el
//    alcance de la referencia dice dónde se leyó. Esas fichas quedan revisadas el 04/11.
// 3. ARTEX: «Blockchains» decía «Mercado regulado (MTF)»; ARTEX no usa blockchain
//    (public.plataformas.cadenas).
// 4. Toucan: fuente del American Carbon Registry y motivo fechado (public.plataformas y
//    public.fuentes).
//
// Etiqueta 2026-11-04: es una entrega documental posterior al radar (el cargador lo admite si
// la última revisión documental es de ese día). El radar, las cifras y la vigencia siguen siendo
// del 03/11: no se alarga ningún plazo.
//
//   node rwadar-app/data/verificaciones/2026-11-04-v2/preparar-entrega.mjs
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
const { etiquetaLegible, etiquetaCruda } = require('../../../rotulos-referencias.js');
const { leerBloquesCatalogo } = require(path.join(ROOT, 'rwadar-fichas.js'));
const ETIQUETA = '2026-11-04', FECHA_RADAR = '2026-11-03', DESDE = '2026-11-03.7', HOY = '2026-11-04';
const FES = '04/11/2026';
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const escribir = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); };
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const q = v => `'${String(v).replace(/'/g, "''")}'`;
const fES = iso => iso.split('-').reverse().join('/');

const plat = leer(path.join(DIR, 'cambios-plataformas.json'));
const personas = leer(path.join(DIR, 'fuentes-para-personas.json'));
assert.equal(plat.etiqueta, ETIQUETA); assert.equal(personas.etiqueta, ETIQUETA);
const PREVIA = plat.revisionPublicadaExigida, HASH_PREVIA = plat.hashRevisionPublicadaExigida;

// ---------------------------------------------------------------- partida: la publicada
const base = path.resolve(DIR, `../${DESDE}-v2`);
const previa = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: DESDE, versionEsquema: 2 }));
assert.equal(previa.revisionId, PREVIA, `la ${DESDE} local no es la revisión publicada`);
assert.equal(previa.hash, HASH_PREVIA, `identidad de la ${DESDE}`);
const snapshot = leerBloquesCatalogo(fs.readFileSync(path.join(ROOT, 'rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8'));
assert.ok([...snapshot.plataformas, ...snapshot.ofertas].every(x => x.revisionId === PREVIA), 'snapshot de la última sincronización');
// Lo leído hoy como visitante (lectura-publica/) es exactamente la base local.
const lp = path.join(DIR, 'lectura-publica');
const pubO = leer(path.join(lp, 'ofertas-v2.json')), pubP = leer(path.join(lp, 'plataformas-v2.json'));
const pubD = leer(path.join(lp, 'descartadas.json'));
assert.ok([...pubO, ...pubP].every(x => x.revision_id === PREVIA), 'la publicada leída hoy es la f2732257');
const radarBase = leer(path.join(base, 'radar-canonico-26.json'));
const escaparateBase = leer(path.join(base, 'escaparate-publicacion.json'));
const docBase = leer(path.join(base, 'documentacion-ofertas.json'));
assert.equal(pubO.length, escaparateBase.ofertas.length); assert.equal(pubP.length, escaparateBase.plataformas.length);
for (const o of pubO) {
  assert.deepEqual(o.documentacion, docBase[o.slug], `${o.slug}: documentación publicada = base local`);
  assert.deepEqual(o.fuentes_actuales, escaparateBase.ofertas.find(x => x.slug === o.slug).fuentesActuales, `${o.slug}: fuentes`);
}
// La vista devuelve las fuentes de cada campo en su propio orden y sin «publicadaEl», que la base
// no guarda: se comparan ordenadas y sin esa fecha.
const ordenar = v => JSON.parse(JSON.stringify(v), (k, x) => k === 'publicadaEl' ? undefined
  : k === 'fuentes' && Array.isArray(x) ? [...x].sort((a, b) => (a.id < b.id ? -1 : 1)) : x);
for (const p of pubP) assert.deepEqual(ordenar(p.verificacion_local),
  ordenar(escaparateBase.plataformas.find(x => x.slug === p.slug).verificacionLocal), `${p.slug}: verificación publicada = base local`);

const radar = structuredClone(radarBase);
const escaparate = structuredClone(escaparateBase);
const documentacion = structuredClone(docBase);

// ---------------------------------------------------------------- 1 · rótulos
const rotulos = [];
for (const [slug, doc] of Object.entries(documentacion)) for (const r of doc.referencias) {
  const nueva = etiquetaLegible(r.etiqueta);
  if (nueva !== r.etiqueta) { rotulos.push({ oferta: slug, antes: r.etiqueta, despues: nueva }); r.etiqueta = nueva; }
}
for (const doc of Object.values(documentacion)) for (const r of doc.referencias) assert.ok(!etiquetaCruda(r.etiqueta), r.etiqueta);

// ---------------------------------------------------------------- 2 · fuentes para personas
const porOferta = new Map();
for (const s of personas.sustituciones) for (const slug of s.ofertas) for (const api of s.apis) {
  const m = porOferta.get(slug) || porOferta.set(slug, new Map()).get(slug);
  assert.ok(!m.has(api), `${slug}: ${api} repetida`);
  assert.match(s.persona, /^https:\/\//); assert.ok(s.comprobado && s.queMuestra, `${slug}: sin comprobación`);
  m.set(api, s.persona);
}
const unico = l => [...new Set(l)];
const fuentes = [];
const usadas = new Set();
for (const o of escaparate.ofertas) {
  const m = porOferta.get(o.slug);
  if (!m) continue;
  const doc = documentacion[o.slug];
  const cambia = u => { if (m.has(u)) { usadas.add(`${o.slug} ${u}`); return m.get(u); } return u; };
  const antesDoc = [...doc.fuentes], antesAct = [...o.fuentesActuales];
  doc.fuentes = unico(doc.fuentes.map(cambia));
  o.fuentesActuales = unico(o.fuentesActuales.map(cambia));
  for (const r of doc.referencias) {
    if (!m.has(r.fuente)) continue;
    const api = r.fuente;
    r.fuente = cambia(api);
    r.alcance = `${r.alcance} Leído el ${fES(r.fechaConsulta)} en los datos que usa la propia web; la página enlazada es donde una persona ve ese dato, con el valor del día en que la abra (comprobada el ${FES}).`;
    assert.ok(r.alcance.length <= 3000, `${o.slug}: alcance demasiado largo`);
    fuentes.push({ oferta: o.slug, etiqueta: r.etiqueta, antes: api, despues: r.fuente });
  }
  doc.revisadaEl = HOY;
  fuentes.push({ oferta: o.slug, fuentesDocumentacion: { antes: antesDoc, despues: doc.fuentes },
    fuentesActuales: { antes: antesAct, despues: o.fuentesActuales } });
}
// Cada sustitución se usa en su ficha (las de Brickwise traen las tres API posibles; cada ficha usa las suyas).
for (const s of personas.sustituciones) for (const slug of s.ofertas)
  assert.ok(s.apis.some(api => usadas.has(`${slug} ${api}`)), `${slug}: ${s.persona} no sustituye nada`);
const radarCambios = [];
for (const s of personas.radar) for (const [i, id] of s.ids.entries()) {
  const f = radar.fuentes.find(x => x.id === id);
  assert.equal(f.url, s.apis[i], `${id}: dirección de antes`);
  radarCambios.push({ id, antes: f.url, despues: s.persona });
  f.url = s.persona;
}
// Ninguna fuente de API o JSON queda, salvo las anotadas en «seQuedan».
const API = /\/api\/|public-api\.|[?&]wt=json|\.json(?:$|\?)/;
const quedan = new Set(personas.seQuedan.map(s => s.url));
const todas = [...radar.fuentes.map(f => f.url), ...escaparate.ofertas.flatMap(o => [o.url, ...o.fuentesActuales]),
  ...Object.values(documentacion).flatMap(d => [...d.fuentes, ...d.referencias.map(r => r.fuente)])];
assert.deepEqual(unico(todas.filter(u => API.test(u) && !quedan.has(u))), [], 'fuentes de API sin sustituir');

// Nada más cambia: devolviendo rótulos y fuentes, todo es la base exacta.
{
  const d = structuredClone(documentacion), e = structuredClone(escaparate), r = structuredClone(radar);
  for (const [slug, doc] of Object.entries(d)) {
    const b = docBase[slug];
    if (porOferta.has(slug)) { doc.revisadaEl = b.revisadaEl; doc.fuentes = b.fuentes; }
    doc.referencias.forEach((x, i) => { x.etiqueta = b.referencias[i].etiqueta; x.fuente = b.referencias[i].fuente; x.alcance = b.referencias[i].alcance; });
  }
  for (const o of e.ofertas) o.fuentesActuales = escaparateBase.ofertas.find(x => x.slug === o.slug).fuentesActuales;
  for (const c of radarCambios) r.fuentes.find(f => f.id === c.id).url = c.antes;
  assert.deepEqual(d, docBase, 'documentación: solo rótulos, fuentes de API y fecha de revisión');
  assert.deepEqual(e, escaparateBase, 'escaparate: solo fuentes actuales');
  assert.deepEqual(r, radarBase, 'radar: solo las dos direcciones del REGAFI');
  for (const [slug, doc] of Object.entries(documentacion)) doc.referencias.forEach((x, i) => {
    const b = docBase[slug].referencias[i];
    assert.deepEqual([x.valor, x.fechaDato, x.fechaConsulta], [b.valor, b.fechaDato, b.fechaConsulta], `${slug}: valor y fechas`);
    if (x.fuente === b.fuente) assert.equal(x.alcance, b.alcance);
  });
}

escaparate.fuente.notaOrigen += ` Arreglos de datos (${FES}, entrega ${ETIQUETA}): «Datos con su fecha» con rótulos en castellano en vez de nombres internos de campo, y las fuentes que eran direcciones de una API cambiadas por la página que muestra el mismo dato a una persona; valores y fechas, iguales.`;
escaparate.fuente.actualizacionLocal = { ...escaparate.fuente.actualizacionLocal,
  archivo: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/contraste-${ETIQUETA}.json`,
  nota: `Lote del 03/11/2026 (entrega ${ETIQUETA}, arreglos de datos del ${FES}): 24 fichas (8 principales, 13 de reventa y 3 en camino).` };
escaparate.fuente.actualizacionRadarLocal = { ...escaparate.fuente.actualizacionRadarLocal,
  archivo: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/radar-canonico-26.json` };
const colecciones = { principales: 0, secundario: 0, en_camino: 0 };
for (const o of escaparate.ofertas) colecciones[o.coleccion]++;
assert.equal(radar.verificadoEl, FECHA_RADAR, 'el radar sigue siendo del 03/11');
escribir(path.join(DIR, 'radar-canonico-26.json'), radar);
escribir(path.join(DIR, 'escaparate-publicacion.json'), escaparate);
escribir(path.join(DIR, 'documentacion-ofertas.json'), documentacion);
fs.copyFileSync(path.join(base, 'manifiesto-catalogo.json'), path.join(DIR, 'manifiesto-catalogo.json'));

// ---------------------------------------------------------------- 3 y 4 · public.plataformas y public.fuentes
const artex = plat.plataformas['artex-global-markets'], toucan = plat.plataformas['toucan-protocol'];
const filas = [['artex-global-markets', artex.estado, 'cadenas', artex.cadenas],
  ['toucan-protocol', toucan.estado, 'motivo_descarte', toucan.motivo_descarte]];
assert.equal(pubP.find(p => p.slug === 'artex-global-markets').cadenas, artex.cadenas.antes, 'ARTEX: cadenas publicadas');
const pubT = pubD.find(d => d.slug === 'toucan-protocol');
assert.equal(pubT.motivo_descarte, toucan.motivo_descarte.antes, 'Toucan: motivo publicado');
const parUT = l => l.map(f => `${f.url}\n${f.titulo}`).sort();
assert.deepEqual(parUT(pubT.fuentes), parUT(toucan.fuentesQueSeConservan), 'Toucan: fuentes publicadas');
assert.equal(pubD.length, plat.descartadas);
for (const [slug, , col, c] of filas) {
  assert.notEqual(c.antes, c.despues, `${slug}.${col}: sin cambio`);
  assert.equal(c.despues, c.despues.trim().replace(/\s+/g, ' '));
}
assert.ok(artex.cadenas.despues.length <= 160);
assert.ok(toucan.motivo_descarte.despues.length >= 40);
const nuevasT = toucan.fuentesNuevas;
const fuentesToucan = [...toucan.fuentesQueSeConservan, ...nuevasT];
const valores = l => l.map(f => `(${q(f.url)}, ${q(f.titulo)})`).join(', ');
const fuentesIguales = (slug, lista) => `(select count(*) from public.fuentes f join public.plataformas p on p.id = f.plataforma_id where p.slug = ${q(slug)}) = ${lista.length}
      and not exists (select f.url, f.titulo from public.fuentes f join public.plataformas p on p.id = f.plataforma_id where p.slug = ${q(slug)}
        except select * from (values ${valores(lista)}) as v(url, titulo))`;
const nuevasConFechas = nuevasT.map(f => `exists (select 1 from public.fuentes f join public.plataformas p on p.id = f.plataforma_id
        where p.slug = 'toucan-protocol' and f.url = ${q(f.url)} and f.titulo = ${q(f.titulo)}
          and f.publicada_el = ${q(f.publicada_el)}::date and f.consultada_el = ${q(f.consultada_el)}::date)`).join('\n      and ');
const toucanAntes = fuentesIguales('toucan-protocol', toucan.fuentesQueSeConservan);
const toucanDespues = `${fuentesIguales('toucan-protocol', fuentesToucan)}\n      and ${nuevasConFechas}`;
const nuevasSoloEnToucan = `not exists (select 1 from public.fuentes f join public.plataformas p on p.id = f.plataforma_id
        where p.slug <> 'toucan-protocol' and f.url in (${nuevasT.map(f => q(f.url)).join(', ')}))`;
const texto = (slug, col, v) => `(select ${col} from public.plataformas where slug = ${q(slug)}) = ${q(v)}`;
const todos = (clave, extra) => [...filas.map(([slug, , col, c]) => texto(slug, col, c[clave])), extra].join('\n      and ');
const bloquePlataformas = `-- public.plataformas y public.fuentes: «Blockchains» de ARTEX y motivo de Toucan con la fuente
-- del American Carbon Registry. No cambia ningún estado: no registra cambios de estado ni avisos;
-- el disparador de siempre pone actualizada_el = now() en las filas que cambian.
do $plataformas_guarda$
declare antes boolean; despues boolean;
begin
  perform 1 from public.plataformas where slug in ('artex-global-markets', 'toucan-protocol') for update;
${filas.map(([slug, estado, col, c]) => `  if (select count(*) from public.plataformas where slug = ${q(slug)} and estado = ${q(estado)}
      and ${col} in (${q(c.antes)}, ${q(c.despues)})) <> 1 then
    raise exception 'Texto de % (%) distinto del previsto: no aplicar.', ${q(slug)}, ${q(col)};
  end if;`).join('\n')}
  if not ((${toucanAntes})
      or (${toucanDespues})) then
    raise exception 'Fuentes de Toucan (dirección, título o fechas de la nueva) distintas de las previstas: no aplicar.';
  end if;
  if not (${nuevasSoloEnToucan}) then
    raise exception 'La fuente nueva ya está en otra plataforma: no aplicar.';
  end if;
  if (select count(*) from public.plataformas where estado = 'descartada') <> ${plat.descartadas} then
    raise exception 'Tiene que haber exactamente ${plat.descartadas} descartadas: no aplicar.';
  end if;
  -- Todo como antes o todo ya como quedaría; nada a medias.
  antes := ${todos('antes', `(${toucanAntes})`)};
  despues := ${todos('despues', `(${toucanDespues})`)};
  if not (coalesce(antes, false) or coalesce(despues, false)) then
    raise exception 'Textos y fuentes a medias entre lo anterior y lo nuevo: no aplicar.';
  end if;
end $plataformas_guarda$;
${filas.map(([slug, , col, c]) => `update public.plataformas set ${col} = ${q(c.despues)} where slug = ${q(slug)} and ${col} = ${q(c.antes)};`).join('\n')}
${nuevasT.map(f => `insert into public.fuentes (plataforma_id,url,titulo,publicada_el,consultada_el) select id,${q(f.url)},${q(f.titulo)},${q(f.publicada_el)}::date,${q(f.consultada_el)}::date from public.plataformas where slug = 'toucan-protocol' on conflict (plataforma_id,url) do nothing;`).join('\n')}
do $plataformas_comprobar$
begin
${filas.map(([slug, , col, c]) => `  if (select ${col} from public.plataformas where slug = ${q(slug)}) is distinct from ${q(c.despues)} then
    raise exception 'No quedó el texto nuevo de % (%).', ${q(slug)}, ${q(col)};
  end if;`).join('\n')}
  if not (${toucanDespues}) then
    raise exception 'Toucan no quedó con sus ${fuentesToucan.length} fuentes previstas.';
  end if;
  if (select count(*) from public.plataformas where estado = 'descartada') <> ${plat.descartadas} then
    raise exception 'Tiene que haber exactamente ${plat.descartadas} descartadas.';
  end if;
end $plataformas_comprobar$;
`;

// ---------------------------------------------------------------- SQL
const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: ETIQUETA, versionEsquema: 2 }));
assert.notEqual(nueva.revisionId, PREVIA, 'la revisión nueva tiene otra identidad');
assert.equal(nueva.fecha, FECHA_RADAR, 'la revisión sigue fechada el 03/11');
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
    aprobada_referencia = 'Entrega ${ETIQUETA}: rótulos legibles en «Datos con su fecha» y fuentes para personas en vez de direcciones de API (encargo del ${FES}); valores, cifras y fechas iguales a la ${DESDE}.'
    where id = v and estado = 'borrador';
  if not exists (select 1 from rwadar_catalogo.revision_publicable_v2 where id = v) then
    raise exception 'Entrega no publicable: se deshace la transacción completa';
  end if;
end $aprobar$;
`;
const archivo = path.join(destino, 'aplicar-y-aprobar.sql');
escribir(archivo,
  `-- Entrega ${ETIQUETA} (preparada el ${FES}): arreglos de datos sobre la revisión publicada ${DESDE} (${PREVIA}).\n` +
  `-- Rótulos de «Datos con su fecha», fuentes para personas, «Blockchains» de ARTEX y fuente del ACR para Toucan.\n` +
  `-- Generado por rwadar-app/data/verificaciones/${ETIQUETA}-v2/preparar-entrega.mjs; revisar antes de aplicar.\n` +
  nueva.sql.replace('-- El lote entra como BORRADOR. Este fichero nunca lo aprueba ni lo publica.',
    '-- Este aplicador importa y aprueba al final, únicamente si pasan todas las guardas.')
    .replace('begin;', () => 'begin isolation level serializable;\n' + guarda)
    .replace(/commit;\n$/, () => bloquePlataformas + aprobar + 'commit;\n'));
escribir(path.join(destino, 'revision.json'), { versionEsquema: 2, revisionId: nueva.revisionId, hash: nueva.hash,
  revisionAnterior: PREVIA, hashRevisionAnterior: HASH_PREVIA, revisionAnteriorComprobadaEnRemoto: true,
  lecturaPublica: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/lectura-publica/`, etiqueta: ETIQUETA, fechaRadar: FECHA_RADAR,
  revisionDocumental: HOY, plataformas: escaparate.plataformas.length, ofertas: escaparate.ofertas.length, colecciones,
  vigenciaDias: 7, nuevasAltas: 0, retiradas: 0, tablasPublicas: ['public.plataformas', 'public.fuentes'],
  estado: 'borrador', aplicadoEnRemoto: false, publicacionWeb: false });
escribir(path.join(DIR, `contraste-${ETIQUETA}.json`), { tipo: 'arreglos_datos', fecha: FECHA_RADAR, preparadaEl: HOY,
  etiqueta: ETIQUETA, revisionAnterior: PREVIA, revisionNueva: nueva.revisionId,
  archivos: Object.fromEntries(['cambios-plataformas.json', 'fuentes-para-personas.json'].map(f => [f, sha(path.join(DIR, f))])),
  cuentas: { rotulos: rotulos.length, ofertasConRotulos: unico(rotulos.map(r => r.oferta)).length,
    referenciasConFuenteNueva: fuentes.filter(f => f.etiqueta).length, ofertasConFuenteNueva: porOferta.size,
    fuentesRadar: radarCambios.length },
  sinCambios: ['valores, fechas del dato y de consulta de cada referencia', 'cifras, avisos, colecciones 8/13/3 y vigencia (7 días desde el 03/11)',
    'estados, detalles y avisos de las 26 plataformas', 'manifiesto'],
  rotulos, fuentes, radar: radarCambios,
  plataformas: filas.map(([slug, , col, c]) => ({ slug, columna: col, antes: c.antes, despues: c.despues })),
  fuentesNuevasPublicas: nuevasT.map(f => ({ plataforma: 'toucan-protocol', url: f.url, titulo: f.titulo })),
  seQuedan: personas.seQuedan, colecciones });
console.log(JSON.stringify({ etiqueta: ETIQUETA, revisionId: nueva.revisionId, previa: PREVIA, sha256: sha(archivo),
  rotulos: rotulos.length, referenciasConFuenteNueva: fuentes.filter(f => f.etiqueta).length, ofertasConFuenteNueva: porOferta.size,
  fuentesRadar: radarCambios.length, colecciones }));

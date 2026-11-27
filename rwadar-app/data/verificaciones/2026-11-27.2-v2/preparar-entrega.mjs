// Entrega del catálogo «2026-11-27.2»: (1) las 32 ofertas publicadas, re-fechadas al 27/11 con lo leído hoy como visitante
// (refechar.py → base-refechada-*.json: solo fechas de consulta y las cifras del libro de órdenes de Brickwise del vigía;
// Liqi, el bono de Mitsui y mTBILL conservan el 26/11 porque su página no se pudo leer hoy); (2) las altas del suplemento de
// ofertas del 27/11 (altas.py → altas.json): 6 ofertas (5 principales, que van las primeras, y 1 en camino) y 3
// plataformas. Preparación LOCAL: sin red ni servicios remotos. Reproducible. Adaptado de la 2026-11-27 (radar) y de la
// 2026-11-26.3 (altas de ofertas).
//
//   node rwadar-app/data/verificaciones/2026-11-27.2-v2/preparar-entrega.mjs
//
// El SQL lo hace todo en una transacción con guardas: en public.* solo inserta las 3 plataformas nuevas.
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
const ETIQUETA = '2026-11-27.2', FECHA = '2026-11-27', DESDE = '2026-11-27', HOY = '2026-11-27', FES = '27/11/2026';
const ULTIMO = '2026-12-03';
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const escribir = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); };
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const q = v => v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`;
const base = path.resolve(DIR, `../${DESDE}-v2`);
const plano = t => t.replace(/\s+/g, ' ');

// ---------------------------------------------------------------- partida: la 2026-11-27
const revisionDesde = leer(path.join(ROOT, `rwadar-app/data/importaciones/catalogo-${DESDE}-v2/revision.json`));
const PREVIA = revisionDesde.revisionId, HASH_PREVIA = revisionDesde.hash;
const previa = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: DESDE, versionEsquema: 2 }));
assert.deepEqual([previa.revisionId, previa.hash], [PREVIA, HASH_PREVIA], `la ${DESDE} local no es la de su revision.json`);
const radarBase = leer(path.join(base, 'radar-canonico-26.json'));
const escaparateBase = leer(path.join(base, 'escaparate-publicacion.json'));
const docBase = leer(path.join(base, 'documentacion-ofertas.json'));
const manifiestoBase = leer(path.join(base, 'manifiesto-catalogo.json'));
assert.deepEqual([escaparateBase.plataformas.length, escaparateBase.ofertas.length], [65, 32]);

// Lo leído como visitante antes de preparar, con la 2026-11-27 publicada (precondición).
const lp = path.join(DIR, 'lectura-publica');
let lectura = null;
if (fs.existsSync(lp)) {
  const pubO = leer(path.join(lp, 'ofertas-v2.json')), pubP = leer(path.join(lp, 'plataformas-v2.json'));
  assert.ok([...pubO, ...pubP].every(x => x.revision_id === PREVIA), `la publicada leída es la ${PREVIA.slice(0, 8)}`);
  assert.equal(pubO.length, 32); assert.equal(pubP.length, 65);
  for (const o of pubO) assert.deepEqual(o.documentacion, docBase[o.slug], `${o.slug}: documentación publicada = base local`);
  lectura = fs.readFileSync(path.join(lp, 'hora-lectura.txt'), 'utf8').split('\n')[0];
}

// ---------------------------------------------------------------- altas (altas.json) y sus pruebas de hoy
const A = leer(path.join(DIR, 'altas.json'));
assert.equal(A.fecha, FECHA);
const L = leer(path.join(DIR, 'fuentes/lecturas-2026-11-27.json'));
for (const [id, l] of Object.entries(L)) {
  assert.ok(l.horaUtc.startsWith(FECHA) && l.http === 200, `${id}: lectura de hoy con HTTP 200`);
  assert.equal(sha(path.join(DIR, l.archivo)), l.sha256, `${id}: copia con su SHA-256`);
}
const urlLeida = new Map(Object.values(L).map(l => [l.url, l]));
const COMPROBACIONES = leer(path.join(ROOT, 'rwadar-app/data/comprobaciones-fuentes.json')).fuentes;
const existentes = new Set(radarBase.plataformas.map(p => p.slug));
const slugsP = A.plataformas.map(p => p.slug);
assert.ok(slugsP.every(s => !existentes.has(s)), 'plataforma que ya estaba en el radar');
// El radar publicado (2026-11-27) se comprobó entero hoy: sus fuentes ya llevan la fecha de hoy. Solo se añaden las nuevas.
assert.equal(radarBase.verificadoEl, FECHA);
assert.ok(radarBase.fuentes.every(f => f.consultadaEl === FECHA), 'el radar publicado ya está comprobado hoy');
const radar = structuredClone(radarBase);
const contrasteNuevas = [];
for (const p of A.plataformas) {
  for (const f of p.fuentes) {
    assert.ok(!radar.fuentes.some(x => x.id === f.id || x.url === f.url), `${f.id}: ya estaba en el radar`);
    const l = urlLeida.get(f.url); assert.ok(l, `${f.id}: sin lectura de hoy`);
    assert.deepEqual(COMPROBACIONES[f.id], p.comprobaciones[f.id], `${f.id}: comprobaciones-fuentes.json`);
    const texto = plano(fs.readFileSync(path.join(DIR, l.archivo), 'utf8'));
    for (const pat of COMPROBACIONES[f.id]) assert.match(texto, new RegExp(pat, 'i'), `${f.id}: la copia de hoy no dice /${pat}/`);
    contrasteNuevas.push({ id: f.id, url: f.url, horaUtc: l.horaUtc, copia: l.archivo, sha256: l.sha256, comprobaciones: COMPROBACIONES[f.id], ok: true });
    radar.fuentes.push(f);
  }
  const usadas = new Set([...['estadoOperativo', 'licenciaRegistro', 'acceso'].flatMap(c => p.radar[c].fuentes), ...p.radar.alertasCriticas.flatMap(a => a.fuentes)]);
  assert.ok([...usadas].every(id => p.fuentes.some(f => f.id === id)), `${p.slug}: fuente sin declarar`);
  radar.plataformas.push({ slug: p.slug, nombre: p.nombre, fechaCanonicaConservada: FECHA, ...p.radar });
}
radar.plataformas.sort((a, b) => (a.slug < b.slug ? -1 : 1));
const ANTES = radarBase.alcance.match(/^Revisión editorial de fuentes primarias del 27\/11\/2026: las (\d+) fuentes del radar .*; la entrega 2026-11-27 añade (\d+) plataformas del informe global de ese día, con sus (\d+) fuentes leídas el mismo día\./);
assert.ok(ANTES, 'alcance del radar de la 2026-11-27 con la forma esperada');
radar.alcance = `Revisión editorial de fuentes primarias del ${FES}: las ${ANTES[1]} fuentes del radar se volvieron a consultar sin sesión y siguen diciendo lo que respaldan (tres por lectura a mano); las entregas 2026-11-27 y ${ETIQUETA} añaden ${ANTES[2]} y ${A.plataformas.length} plataformas de los informes globales de ese día, con sus ${+ANTES[3] + contrasteNuevas.length} fuentes leídas el mismo día. No acredita onboarding, oferta abierta ni rentabilidad.`;
assert.ok(radar.alcance.length <= 500, `alcance del radar: ${radar.alcance.length} caracteres`);
const fuentePorId = new Map(radar.fuentes.map(f => [f.id, f]));
const conFuentes = campo => ({ ...campo, fuentes: campo.fuentes.map(id => fuentePorId.get(id)) });

// Ofertas nuevas: cada fuente leída hoy; tarjeta en castellano y corta; avisos con el editorial común primero.
const CANONICA = /^(?:M[ií]nimo de inversi[oó]n|Acceso desde Espa[ñn]a|Salida|Reembolso)$/;
const plataformasRadar = new Set(radar.plataformas.map(p => p.slug));
const slugsO = A.ofertas.map(x => x.oferta.slug);
assert.ok(slugsO.length === 8 && slugsO.every(s => !escaparateBase.ofertas.some(o => o.slug === s)), 'ocho ofertas nuevas, ninguna ya publicada');
for (const { oferta: o, documentacion: d } of A.ofertas) {
  assert.ok(plataformasRadar.has(o.plataformaSlug), `${o.slug}: plataforma fuera del radar`);
  assert.equal(o.avisos[0].texto, escaparateBase.ofertas[0].avisos[0].texto, `${o.slug}: el primer aviso es el editorial común`);
  for (const u of [o.url, ...o.fuentesActuales, ...d.fuentes]) assert.ok(urlLeida.has(u), `${o.slug}: ${u} no se leyó hoy`);
  const t = d.referencias.filter(r => CANONICA.test(r.etiqueta)).map(r => r.etiqueta);
  assert.equal(t.filter(e => /^M[ií]nimo/.test(e)).length, 1, `${o.slug}: mínimo`);
  assert.equal(t.filter(e => /^Acceso/.test(e)).length, 1, `${o.slug}: acceso`);
  assert.equal(t.filter(e => /^(Salida|Reembolso)$/.test(e)).length, 1, `${o.slug}: salida o reembolso`);
  assert.ok(o.coleccion === 'principales' || o.rentabilidad === null, `${o.slug}: en camino sin rentabilidad`);
}
const CSP = /<style\b|\sstyle\s*=|\son[a-z]+\s*=|<script/i;
assert.ok(!CSP.test(JSON.stringify(A)), 'texto que la compuerta CSP rechazaría');

// ---------------------------------------------------------------- escaparate y manifiesto
// Base re-fechada (refechar.py): mismas ofertas que la publicada; solo cambian fechas de consulta y Brickwise (abajo se comprueba).
const REF_ESC = leer(path.join(DIR, 'base-refechada-escaparate.json')), REF_DOC = leer(path.join(DIR, 'base-refechada-documentacion.json'));
const escaparate = structuredClone(escaparateBase);
const documentos = structuredClone(REF_DOC);
// Las nuevas, las primeras de su colección (portada de Inicio y de Ofertas).
const nuevasPrincipales = A.ofertas.filter(x => x.oferta.coleccion === 'principales').map(x => x.oferta);
const nuevasCamino = A.ofertas.filter(x => x.oferta.coleccion === 'en_camino').map(x => x.oferta);
escaparate.ofertas = [...nuevasPrincipales, ...REF_ESC.ofertas, ...nuevasCamino];
for (const x of A.ofertas) documentos[x.oferta.slug] = x.documentacion;
escaparate.plataformas = radar.plataformas.map(p => {
  return { slug: p.slug, verificacionLocal: { verificadoEl: FECHA, conservaFechaCanonica: true,
    estadoOperativo: conFuentes(p.estadoOperativo), licenciaRegistro: conFuentes(p.licenciaRegistro), acceso: conFuentes(p.acceso),
    alertasCriticas: p.alertasCriticas.map(conFuentes) } };
});
const colecciones = { principales: 0, secundario: 0, en_camino: 0 };
for (const o of escaparate.ofertas) colecciones[o.coleccion]++;
assert.deepEqual(colecciones, { principales: 24, secundario: 13, en_camino: 3 });
escaparate.fuente.notaOrigen += ` Entrega ${ETIQUETA} (${FES}): fichas re-comprobadas ese día con su fuente (las que no se pudieron leer conservan su fecha) y altas del suplemento de ofertas: ` +
  `${A.ofertas.length} ofertas (${nuevasPrincipales.length} principales y ${nuevasCamino.length} en camino) y ${A.plataformas.length} plataformas.`;
escaparate.fuente.actualizacionLocal = { ...escaparate.fuente.actualizacionLocal, verificadoEl: FECHA,
  archivo: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/contraste-${ETIQUETA}.json`,
  nota: `Lote del ${FES} (entrega ${ETIQUETA}): ${escaparate.ofertas.length} fichas (${colecciones.principales} principales, ` +
    `${colecciones.secundario} de reventa y ${colecciones.en_camino} en camino) y ${radar.plataformas.length} plataformas.` };
escaparate.fuente.actualizacionRadarLocal = { ...escaparate.fuente.actualizacionRadarLocal,
  archivo: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/radar-canonico-26.json`, plataformas: radar.plataformas.length, fuentesPrimarias: radar.fuentes.length, verificadoEl: FECHA };
const manifiesto = { version_esquema: 2, plataformas_esperadas: radar.plataformas.length, ofertas_esperadas: escaparate.ofertas.length, colecciones_esperadas: colecciones };
{ // Nada más cambia: las 32 ofertas de antes, iguales salvo las fechas de consulta y el libro de órdenes de Brickwise;
  // las 65 plataformas de antes, idénticas.
  const LIBRO = /^(Venta más barata|Orden de venta de menor importe|Participaciones en venta|Mejor oferta de compra|Mínimo de inversión)( · |$)/;
  const norm = (x, slug) => {
    const y = JSON.parse(JSON.stringify(x).replaceAll('27/11/2026', '26/11/2026').replaceAll('2026-11-27', '2026-11-26')
      .replaceAll('(27/11)', '(26/11)').replaceAll('a 27/11)', 'a 26/11)').replaceAll('CHF el 27/11,', 'CHF el 26/11,').replaceAll('(10:19 UTC)', '(18:17 UTC)'));
    if (y.referencias && escaparateBase.ofertas.find(o => o.slug === slug)?.plataformaSlug === 'brickwise')
      for (const r of y.referencias) if (LIBRO.test(r.etiqueta)) r.valor = '(libro de órdenes)';
    return y;
  };
  assert.deepEqual(REF_ESC.ofertas.map(o => o.slug), escaparateBase.ofertas.map(o => o.slug), 'mismas ofertas y mismo orden');
  for (const o of escaparateBase.ofertas) assert.deepEqual(norm(REF_ESC.ofertas.find(x => x.slug === o.slug), o.slug), norm(o, o.slug), `${o.slug}: igual salvo fechas`);
  for (const s of Object.keys(docBase)) assert.deepEqual(norm(REF_DOC[s], s), norm(docBase[s], s), `${s}: documentación igual salvo fechas y libro de Brickwise`);
  assert.deepEqual(Object.keys(REF_DOC).sort(), Object.keys(docBase).sort());
  // Plataformas y fuentes de antes: iguales salvo la fecha de verificación y la de consulta de cada fuente (hoy).
  const sinFechas = x => JSON.parse(JSON.stringify(x), (k, v) => (k === 'verificadoEl' || k === 'consultadaEl' ? undefined : v));
  for (const p of escaparateBase.plataformas) {
    const n = escaparate.plataformas.find(x => x.slug === p.slug);
    assert.deepEqual(sinFechas(n), sinFechas(p), `${p.slug}: igual salvo las fechas`);
    assert.equal(n.verificacionLocal.verificadoEl, FECHA);
  }
  for (const p of radarBase.plataformas) assert.deepEqual(radar.plataformas.find(x => x.slug === p.slug), p, `${p.slug}: radar igual`);
  assert.deepEqual(radar.fuentes.slice(0, radarBase.fuentes.length), radarBase.fuentes, 'fuentes de antes, iguales y en su orden');
  assert.ok(radar.fuentes.every(f => f.consultadaEl === FECHA), 'todas las fuentes, consultadas hoy');
}
escribir(path.join(DIR, 'radar-canonico-26.json'), radar);
escribir(path.join(DIR, 'escaparate-publicacion.json'), escaparate);
escribir(path.join(DIR, 'documentacion-ofertas.json'), documentos);
escribir(path.join(DIR, 'manifiesto-catalogo.json'), manifiesto);
escribir(path.join(DIR, `radar-contraste-altas-${ETIQUETA}.json`), { fecha: FECHA, fuentesNuevas: contrasteNuevas.length, correctas: contrasteNuevas.length, contraste: contrasteNuevas,
  nota: `Las ${radarBase.fuentes.length} fuentes de antes se comprobaron hoy en la entrega 2026-11-27 (su radar-contraste-2026-11-27.json).` });

// ---------------------------------------------------------------- SQL
const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: ETIQUETA, versionEsquema: 2 }));
assert.notEqual(nueva.revisionId, PREVIA);
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
// public.regiones y public.plataformas: solo filas nuevas, con «on conflict do nothing»; si la fila ya existe, tiene que
// ser exactamente la de este lote (repetir el lote no cambia nada) y el resto del radar, como estaba.
const RS = A.regiones;
assert.deepEqual(RS, [], 'esta entrega no trae regiones nuevas');
assert.ok(A.plataformas.every(p => p.publica.region_slug && p.publica.cadenas), 'región y cadenas en cada plataforma');
const COLS = ['slug', 'nombre', 'estado', 'categoria_slug', 'region_slug', 'actor', 'acceso', 'ticket', 'cadenas', 'web', 'aval', 'nota'];
const fila = p => ({ slug: p.slug, nombre: p.nombre, estado: 'en_radar', ...p.publica });
const comoEsperada = p => COLS.map(c => fila(p)[c] === null ? `p.${c} is null` : `p.${c}::text = ${q(fila(p)[c])}`).join(' and ');
const insertP = p => `insert into public.plataformas (${COLS.join(',')},verificada_el) values (${COLS.map(c => c === 'estado' ? `'en_radar'::rwa_estado`
  : c === 'actor' ? `${q(fila(p)[c])}::rwa_actor` : c === 'acceso' ? `${q(fila(p)[c])}::rwa_acceso` : c === 'ticket' ? `${q(fila(p)[c])}::rwa_ticket` : q(fila(p)[c])).join(',')},'${FECHA}'::date) on conflict (slug) do nothing;`;
const bloquePublico = `-- public.plataformas: las ${A.plataformas.length} plataformas nuevas del radar
-- (${slugsP.join(', ')}). Solo filas nuevas; ninguna fila existente cambia. Insertar una plataforma no crea cambios de
-- estado ni avisos (los disparadores son de update de estado).
do $publico_guarda$
begin
  if (select count(*) from public.plataformas where estado = 'en_radar') <> 65 and
     (select count(*) from public.plataformas where estado = 'en_radar') <> ${65 + A.plataformas.length} then
    raise exception 'El radar no tiene 65 plataformas (ni las ${65 + A.plataformas.length} de este lote): no aplicar.';
  end if;
  if (select count(*) from public.plataformas where estado = 'descartada') <> 5 then
    raise exception 'Tiene que haber 5 plataformas descartadas: no aplicar.';
  end if;
${A.plataformas.map(p => `  if exists (select 1 from public.plataformas p where p.slug = ${q(p.slug)} and not (${comoEsperada(p)})) then
    raise exception 'La plataforma ${p.slug} ya existe con otros datos: no aplicar.';
  end if;`).join('\n')}
${RS.map(R => `  if exists (select 1 from public.regiones where slug = ${q(R.slug)} and nombre <> ${q(R.nombre)}) then
    raise exception 'La región ${R.slug} ya existe con otro nombre: no aplicar.';
  end if;`).join('\n')}
end $publico_guarda$;
${RS.map(R => `insert into public.regiones (slug,nombre) values (${q(R.slug)},${q(R.nombre)}) on conflict (slug) do nothing;`).join('\n')}
${A.plataformas.map(insertP).join('\n')}
do $publico_comprobar$
begin
${A.plataformas.map(p => `  if not exists (select 1 from public.plataformas p where p.slug = ${q(p.slug)} and ${comoEsperada(p)}) then
    raise exception 'La plataforma ${p.slug} no quedó como se esperaba.';
  end if;`).join('\n')}
  if (select count(*) from public.plataformas where estado = 'en_radar') <> ${65 + A.plataformas.length}
    or (select count(*) from public.plataformas where estado = 'descartada') <> 5 then
    raise exception 'Cuentas del radar inesperadas tras las altas.';
  end if;
end $publico_comprobar$;
`;
const aprobar = `do $aprobar$
declare v uuid := '${nueva.revisionId}';
begin
  if (select count(*) from rwadar_catalogo.plataformas where revision_id = v) <> ${escaparate.plataformas.length}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v) <> ${escaparate.ofertas.length}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'principales') <> ${colecciones.principales}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'secundario') <> ${colecciones.secundario}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'en_camino') <> ${colecciones.en_camino}
    or (select count(*) from rwadar_catalogo.plataformas c join public.plataformas p on p.id = c.plataforma_id
      where c.revision_id = v and p.slug in (${slugsP.map(q).join(', ')})) <> ${slugsP.length}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and slug in (${slugsO.map(q).join(', ')})) <> ${slugsO.length} then
    raise exception 'Catálogo incompleto: se conserva el lote anterior';
  end if;
  update rwadar_catalogo.revisiones set estado = 'aprobada', aprobada_el = now(),
    aprobada_referencia = 'Entrega ${ETIQUETA}: fichas re-comprobadas el ${FES} y altas del suplemento de ofertas de ese día (${A.ofertas.length} ofertas y ${A.plataformas.length} plataformas), comprobadas en su fuente. ${escaparate.plataformas.length} plataformas y ${escaparate.ofertas.length} ofertas (${colecciones.principales}/${colecciones.secundario}/${colecciones.en_camino}); el resto, igual a la ${DESDE}. Puesta al día pedida por el responsable del proyecto el ${FES}.'
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
  `-- Entrega ${ETIQUETA} (preparada el ${FES}) sobre la revisión ${DESDE} (${PREVIA}). Ciclo pedido y autorizado por el responsable del proyecto.\n` +
  `-- Altas: ${A.ofertas.length} ofertas y ${A.plataformas.length} plataformas; fichas de antes re-comprobadas hoy. ${escaparate.plataformas.length} plataformas y ${escaparate.ofertas.length} ofertas (${colecciones.principales}/${colecciones.secundario}/${colecciones.en_camino}).\n` +
  `-- Generado por rwadar-app/data/verificaciones/${ETIQUETA}-v2/preparar-entrega.mjs; revisar antes de aplicar.\n` +
  nueva.sql.replace('-- El lote entra como BORRADOR. Este fichero nunca lo aprueba ni lo publica.',
    '-- Este aplicador importa y aprueba al final, únicamente si pasan todas las guardas.')
    .replace('begin;', () => 'begin isolation level serializable;\n' + guarda + bloquePublico)
    .replace(/commit;\n$/, () => aprobar + 'commit;\n'));
{
  const sql = fs.readFileSync(archivo, 'utf8');
  const publicas = [...sql.matchAll(/^\s*(insert\s+into|update|delete\s+from)\s+public\.(\w+)/gim)].map(m => `${m[1].toLowerCase()} ${m[2]}`);
  assert.deepEqual([...new Set(publicas)].sort(), ['insert into plataformas'], 'en public.* solo se insertan las plataformas nuevas');
  assert.equal(publicas.filter(x => x === 'insert into plataformas').length, A.plataformas.length);
  assert.equal(publicas.filter(x => x === 'insert into regiones').length, RS.length);
  assert.doesNotMatch(sql, /^\s*(?:truncate|alter|drop|grant|revoke|create)\b/im, 'sin DDL ni permisos');
  assert.doesNotMatch(sql.split('\n').slice(0, 3).join('\n'), /V[ií]ctor/, 'cabecera sin nombres de personas');
}
escribir(path.join(destino, 'revision.json'), { versionEsquema: 2, revisionId: nueva.revisionId, hash: nueva.hash,
  revisionAnterior: PREVIA, hashRevisionAnterior: HASH_PREVIA, revisionAnteriorComprobadaEnRemoto: true,
  lecturaPublica: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/lectura-publica/`, etiqueta: ETIQUETA, fechaRadar: FECHA,
  revisionDocumental: HOY, plataformas: escaparate.plataformas.length, ofertas: escaparate.ofertas.length, colecciones,
  vigenciaDias: 7, venceTrasEl: ULTIMO, nuevasAltas: A.ofertas.length, ofertasAltas: slugsO, plataformasAltas: slugsP, retiradas: 0,
  tablasPublicas: ['public.plataformas'], estado: 'borrador', aplicadoEnRemoto: false, publicacionWeb: false });
escribir(path.join(DIR, `contraste-${ETIQUETA}.json`), { tipo: 'altas', fecha: FECHA, etiqueta: ETIQUETA,
  revisionAnterior: PREVIA, revisionNueva: nueva.revisionId,
  decision: 'Órdenes de la dirección del 27/11/2026: «el resto pon que está verificado hasta el día de hoy» y añadir las ofertas del suplemento de ese día. Las fichas se re-fechan solo con lo leído hoy; entran las ofertas con fuente primaria y condiciones comprobadas.',
  archivos: Object.fromEntries(['altas.json', 'fuentes/lecturas-2026-11-27.json', 'fuentes/releidas-2026-11-27.txt', 'refechado.json', 'base-refechada-escaparate.json', 'base-refechada-documentacion.json', 'vigia.json'].map(n => [n, sha(path.join(DIR, n))])),
  altas: { regiones: RS, plataformas: slugsP, ofertas: slugsO }, colecciones, lecturaPublica: lectura });
console.log(JSON.stringify({ etiqueta: ETIQUETA, revisionId: nueva.revisionId, hash: nueva.hash, previa: PREVIA, sha256: sha(archivo),
  plataformas: escaparate.plataformas.length, fuentesRadar: radar.fuentes.length, ofertas: escaparate.ofertas.length, colecciones,
  lecturaPublica: lectura ? 'comprobada' : 'pendiente' }));

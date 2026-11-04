// Séptima entrega del 03/11/2026 (revisión «2026-11-03.7»), preparada el 04/11: textos
// para el lector. Víctor pidió el 04/11 «hasta que no esté todo no has acabado», y faltaban
// los textos del catálogo de la lista de frases: los 26 avisos de plataforma (anexo A), 22
// notas de estado (anexo B) y tres detalles con «onboarding» o «ya se leen». Solo cambian
// esos textos (textos-lector.json). Cifras, fechas, fuentes, colecciones y ofertas, igual
// que en la 2026-11-03.6. Preparación LOCAL: sin red ni servicios remotos.
//
// La etiqueta es 2026-11-03.7 y no 2026-11-04 porque los datos siguen siendo del 03/11: el
// cargador exige que la carpeta coincida con esa fecha, y fechar el lote el 04/11 alargaría
// un día su vigencia sin haber vuelto a leer las fuentes.
//
// Los textos de Reental, Toucan y RealT no están en la revisión, sino en public.plataformas
// y public.fuentes, que el lote diario solo lee (CICLO-DIARIO-CATALOGO.md §5). Van aparte,
// en textos-plataformas.sql. Con --con-textos-plataformas se meten también en
// aplicar-y-aprobar.sql, dentro de la misma transacción y antes de aprobar.
//
//   node rwadar-app/data/verificaciones/2026-11-03.7-v2/preparar-entrega.mjs [--con-textos-plataformas]
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
const FECHA = '2026-11-03', REVISION = '2026-11-03.7', DESDE = '2026-11-03.6';
const FES = '04/11/2026';
const PREVIA = '344a86aa-2c53-d2f0-fed4-5fdaadda33ad'; // publicada (snapshot de la última sincronización)
const CON_TEXTOS = process.argv.includes('--con-textos-plataformas');
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const escribir = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); };
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base = path.resolve(DIR, `../${DESDE}-v2`);

const previa = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: DESDE, versionEsquema: 2 }));
assert.equal(previa.revisionId, PREVIA, 'la base local no es la revisión publicada');
const textos = leer(path.join(DIR, 'textos-lector.json'));
assert.equal(textos.etiqueta, REVISION);
assert.equal(textos.desde, DESDE);

const radarBase = leer(path.join(base, 'radar-canonico-26.json'));
const escaparateBase = leer(path.join(base, 'escaparate-publicacion.json'));
const radar = structuredClone(radarBase);
const escaparate = structuredClone(escaparateBase);
const fuentePorId = new Map(radar.fuentes.map(f => [f.id, f]));
const CAMPOS = ['estadoOperativo', 'licenciaRegistro', 'acceso'];
const cambios = [];
const comprobarTexto = (t, donde) => {
  assert.equal(typeof t, 'string', donde);
  assert.equal(t, t.trim(), `${donde}: espacios sobrantes`);
  assert.ok(t.length >= 24 && t.length <= 3000, `${donde}: longitud fuera de 24-3000`);
  assert.doesNotMatch(t, /\b(No presentar|No atribuir|No traducir|No convertir|No llamar|No describir|No usar|No omitir|No extender|No confundir|Mantener la fila|Nombrar la filial|Distinguir|Verificar cada|Exigir)\b/, `${donde}: sigue siendo una instrucción para redactores`);
};
for (const [slug, cambio] of Object.entries(textos.revision)) {
  const rp = radar.plataformas.find(p => p.slug === slug);
  const ep = escaparate.plataformas.find(p => p.slug === slug)?.verificacionLocal;
  assert.ok(rp && ep, `${slug}: no está en el lote`);
  for (const campo of CAMPOS) {
    const c = cambio[campo];
    if (!c) continue;
    assert.equal(rp[campo].detalle, c.antes, `${slug}/${campo}: el texto anterior no coincide (radar)`);
    assert.equal(ep[campo].detalle, c.antes, `${slug}/${campo}: el texto anterior no coincide (escaparate)`);
    assert.notEqual(c.despues, c.antes, `${slug}/${campo}: sin cambio`);
    comprobarTexto(c.despues, `${slug}/${campo}`);
    rp[campo].detalle = c.despues;
    ep[campo].detalle = c.despues;
    cambios.push({ plataforma: slug, campo, antes: c.antes, despues: c.despues, ...(c.nota ? { nota: c.nota } : {}),
      fuentes: rp[campo].fuentes.map(id => ({ id, url: fuentePorId.get(id).url, titulo: fuentePorId.get(id).titulo })) });
  }
  for (const [codigo, c] of Object.entries(cambio.alertas || {})) {
    const ra = rp.alertasCriticas.filter(a => a.codigo === codigo);
    const ea = ep.alertasCriticas.filter(a => a.codigo === codigo);
    assert.ok(ra.length === 1 && ea.length === 1, `${slug}/${codigo}: aviso no encontrado`);
    assert.equal(ra[0].detalle, c.antes, `${slug}/${codigo}: el texto anterior no coincide (radar)`);
    assert.equal(ea[0].detalle, c.antes, `${slug}/${codigo}: el texto anterior no coincide (escaparate)`);
    assert.notEqual(c.despues, c.antes, `${slug}/${codigo}: sin cambio`);
    comprobarTexto(c.despues, `${slug}/${codigo}`);
    ra[0].detalle = c.despues;
    ea[0].detalle = c.despues;
    cambios.push({ plataforma: slug, campo: `alerta:${codigo}`, antes: c.antes, despues: c.despues, ...(c.nota ? { nota: c.nota } : {}),
      fuentes: ra[0].fuentes.map(id => ({ id, url: fuentePorId.get(id).url, titulo: fuentePorId.get(id).titulo })) });
  }
}
const cuenta = prefijo => cambios.filter(c => c.campo.startsWith(prefijo)).length;
assert.equal(cuenta('alerta:'), 26, 'los 26 avisos de plataforma');
assert.equal(radar.plataformas.flatMap(p => p.alertasCriticas).length, 26, 'el lote tiene 26 avisos');
assert.equal(cuenta('estadoOperativo'), 22, 'las 22 notas de estado del anexo B');
assert.equal(cuenta('acceso') + cuenta('licenciaRegistro'), 3, 'los tres detalles con «onboarding» o «ya se leen»');
for (const p of radar.plataformas) for (const a of p.alertasCriticas) comprobarTexto(a.detalle, `${p.slug}/${a.codigo}`);

// Nada más cambia: devolviendo los textos anteriores, radar y plataformas son la base exacta.
const revertir = (r, e) => {
  for (const c of cambios) {
    const rp = r.plataformas.find(p => p.slug === c.plataforma);
    const ep = e.plataformas.find(p => p.slug === c.plataforma).verificacionLocal;
    if (c.campo.startsWith('alerta:')) {
      const codigo = c.campo.slice(7);
      rp.alertasCriticas.find(a => a.codigo === codigo).detalle = c.antes;
      ep.alertasCriticas.find(a => a.codigo === codigo).detalle = c.antes;
    } else { rp[c.campo].detalle = c.antes; ep[c.campo].detalle = c.antes; }
  }
};
{
  const r = structuredClone(radar), e = structuredClone(escaparate);
  revertir(r, e);
  assert.deepEqual(r, radarBase, 'el radar solo cambia en sus textos');
  assert.deepEqual(e.plataformas, escaparateBase.plataformas, 'las plataformas solo cambian en sus textos');
  assert.deepEqual(e.ofertas, escaparateBase.ofertas, 'las 24 ofertas, idénticas');
}

escaparate.fuente.notaOrigen += ` Textos para el lector (${FES}, entrega ${REVISION}): los 26 avisos y 22 notas de estado de plataforma, y tres detalles de acceso o licencia, reescritos sin cambiar hechos, cifras, fechas ni fuentes.`;
escaparate.fuente.actualizacionLocal = { ...escaparate.fuente.actualizacionLocal,
  archivo: `rwadar-app/data/verificaciones/${REVISION}-v2/contraste-${REVISION}.json`,
  nota: `Lote del 03/11/2026 (entrega ${REVISION}, textos para el lector del ${FES}): 24 fichas (8 principales, 13 de reventa y 3 en camino).` };
escaparate.fuente.actualizacionRadarLocal = { ...escaparate.fuente.actualizacionRadarLocal,
  archivo: `rwadar-app/data/verificaciones/${REVISION}-v2/radar-canonico-26.json` };
const colecciones = { principales: 0, secundario: 0, en_camino: 0 };
for (const o of escaparate.ofertas) colecciones[o.coleccion]++;
escribir(path.join(DIR, 'radar-canonico-26.json'), radar);
escribir(path.join(DIR, 'escaparate-publicacion.json'), escaparate);
fs.copyFileSync(path.join(base, 'documentacion-ofertas.json'), path.join(DIR, 'documentacion-ofertas.json'));
fs.copyFileSync(path.join(base, 'manifiesto-catalogo.json'), path.join(DIR, 'manifiesto-catalogo.json'));

// ---------------------------------------------------------------- textos de public.plataformas
const pp = textos.plataformasPublicas;
const q = v => `'${String(v).replace(/'/g, "''")}'`;
const realt = pp.realt;
const FUENTES_REALT = ['https://detroitmi.gov/news/city-scores-major-win-tenants-living-troubled-real-token-properties-are-subject-sweeping-lawsuit',
  'https://www.bridgedetroit.com/detroit-sues-blockchain-real-estate-firm/', 'https://www.bridgedetroit.com/real-token-detroit-rent-repairs/'];
assert.deepEqual(realt.fuentesQueSeConservan.map(f => f.url).sort(), [...FUENTES_REALT].sort());
const nuevasRealt = realt.fuentesNuevas.map(f => f.url);
const filas = [
  ['reental', 'en_radar', 'nota', pp.reental.nota],
  ['toucan-protocol', 'descartada', 'motivo_descarte', pp['toucan-protocol'].motivo_descarte],
  ['realt', 'descartada', 'etiqueta_descarte', realt.etiqueta_descarte],
  ['realt', 'descartada', 'motivo_descarte', realt.motivo_descarte],
];
for (const [slug, , columna, c] of filas) {
  assert.notEqual(c.antes, c.despues, `${slug}/${columna}: sin cambio`);
  if (columna === 'motivo_descarte') assert.ok(c.despues.length >= 40, `${slug}: motivo demasiado breve`);
}
const bloqueTextos = `-- Textos para el lector en public.plataformas y public.fuentes (entrega ${REVISION}, ${FES}).
-- Reental (fila 18), Toucan (fila 75) y RealT. Solo cambian esos textos y se añade una fuente
-- a RealT. No toca el estado de ninguna plataforma, así que no registra cambios de estado
-- ni avisos; el disparador de siempre pone actualizada_el = now() en las tres filas.
do $textos_guarda$
begin
${filas.map(([slug, estado, columna, c]) => `  if (select count(*) from public.plataformas where slug = ${q(slug)} and estado = ${q(estado)}
      and ${columna} in (${q(c.antes)}, ${q(c.despues)})) <> 1 then
    raise exception 'Texto de % (%) distinto del previsto: no aplicar.', ${q(slug)}, ${q(columna)};
  end if;`).join('\n')}
  if (select count(*) from public.fuentes f join public.plataformas p on p.id = f.plataforma_id
      where p.slug = 'realt' and f.url in (${FUENTES_REALT.map(q).join(', ')})) <> ${FUENTES_REALT.length}
    or exists (select 1 from public.fuentes f join public.plataformas p on p.id = f.plataforma_id
      where p.slug = 'realt' and f.url not in (${[...FUENTES_REALT, ...nuevasRealt].map(q).join(', ')})) then
    raise exception 'Fuentes de RealT distintas de las previstas: no aplicar.';
  end if;
end $textos_guarda$;
${filas.map(([slug, , columna, c]) => `update public.plataformas set ${columna} = ${q(c.despues)} where slug = ${q(slug)} and ${columna} = ${q(c.antes)};`).join('\n')}
${realt.fuentesNuevas.map(f => `insert into public.fuentes (plataforma_id,url,titulo,publicada_el,consultada_el) select id,${q(f.url)},${q(f.titulo)},${q(f.publicada_el)}::date,${q(f.consultada_el)}::date from public.plataformas where slug = 'realt' on conflict (plataforma_id,url) do nothing;`).join('\n')}
do $textos_comprobar$
begin
${filas.map(([slug, , columna, c]) => `  if (select ${columna} from public.plataformas where slug = ${q(slug)}) is distinct from ${q(c.despues)} then
    raise exception 'No quedó el texto nuevo de % (%).', ${q(slug)}, ${q(columna)};
  end if;`).join('\n')}
  if (select count(*) from public.fuentes f join public.plataformas p on p.id = f.plataforma_id where p.slug = 'realt')
      <> ${FUENTES_REALT.length + nuevasRealt.length} then
    raise exception 'RealT no tiene sus ${FUENTES_REALT.length + nuevasRealt.length} fuentes.';
  end if;
  if (select count(*) from public.plataformas where estado = 'descartada') <> 4 then
    raise exception 'Tiene que haber exactamente 4 descartadas.';
  end if;
end $textos_comprobar$;
`;

// ---------------------------------------------------------------- SQL
const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: REVISION, versionEsquema: 2 }));
assert.notEqual(nueva.revisionId, PREVIA, 'la revisión nueva tiene otra identidad');
const destino = path.join(ROOT, `rwadar-app/data/importaciones/catalogo-${REVISION}-v2`);
escribir(path.join(destino, 'catalogo.sql'), nueva.sql);
escribir(path.join(destino, 'textos-plataformas.sql'),
  `-- Aparte del lote ${REVISION}: textos de public.plataformas y public.fuentes, que el lote diario\n` +
  `-- solo lee (CICLO-DIARIO-CATALOGO.md §5). Se aplica solo si se aprueba tocar esas tablas.\n` +
  `-- Idempotente: con los textos ya cambiados no hace nada.\nbegin isolation level serializable;\n` + bloqueTextos + 'commit;\n');
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
    aprobada_referencia = 'Entrega ${REVISION}: textos para el lector (26 avisos y 22 notas de estado de plataforma, y tres detalles de acceso o licencia) pedidos por Víctor el ${FES}, sin cambiar hechos, cifras, fechas ni fuentes; resto igual a la entrega ${DESDE}.'
    where id = v and estado = 'borrador';
  if not exists (select 1 from rwadar_catalogo.revision_publicable_v2 where id = v) then
    raise exception 'Entrega no publicable: se deshace la transacción completa';
  end if;
end $aprobar$;
`;
escribir(path.join(destino, 'aplicar-y-aprobar.sql'),
  `-- Entrega ${REVISION} (preparada el ${FES}): textos para el lector sobre la revisión publicada ${DESDE}. Pedida por Víctor.\n` +
  (CON_TEXTOS ? '-- Incluye los textos de public.plataformas y public.fuentes (--con-textos-plataformas).\n'
    : '-- No incluye los textos de public.plataformas (están aparte, en textos-plataformas.sql).\n') +
  nueva.sql.replace('-- El lote entra como BORRADOR. Este fichero nunca lo aprueba ni lo publica.',
    '-- Este aplicador importa y aprueba al final, únicamente si pasan todas las guardas.')
    .replace('begin;', () => 'begin isolation level serializable;\n' + guarda)
    .replace(/commit;\n$/, () => (CON_TEXTOS ? bloqueTextos : '') + aprobar + 'commit;\n'));
escribir(path.join(destino, 'revision.json'), { versionEsquema: 2, revisionId: nueva.revisionId, hash: nueva.hash,
  revisionAnterior: PREVIA, revisionAnteriorComprobadaEnRemoto: false, etiqueta: REVISION, fechaRadar: FECHA,
  plataformas: escaparate.plataformas.length, ofertas: escaparate.ofertas.length, colecciones, vigenciaDias: 7,
  nuevasAltas: 0, retiradas: 0, textosPlataformasEnAplicador: CON_TEXTOS,
  estado: 'borrador', aplicadoEnRemoto: false, publicacionWeb: false });
escribir(path.join(DIR, `contraste-${REVISION}.json`), { tipo: 'textos_lector', fecha: FECHA, preparadaEl: '2026-11-04',
  etiqueta: REVISION, revisionAnterior: PREVIA, revisionNueva: nueva.revisionId, decision: textos.decision,
  textos: { archivo: 'textos-lector.json', sha256: sha(path.join(DIR, 'textos-lector.json')) },
  cuentas: { avisos: cuenta('alerta:'), notasEstado: cuenta('estadoOperativo'), accesoOLicencia: cuenta('acceso') + cuenta('licenciaRegistro') },
  sinCambios: ['24 ofertas y su documentación', '69 fuentes del radar y sus fechas', 'estados de cada campo', 'colecciones 8/13/3', 'manifiesto'],
  cambios, textosPlataformas: { archivo: `rwadar-app/data/importaciones/catalogo-${REVISION}-v2/textos-plataformas.sql`,
    enAplicador: CON_TEXTOS, filas: filas.map(([slug, , columna, c]) => ({ slug, columna, antes: c.antes, despues: c.despues })),
    fuentesNuevas: realt.fuentesNuevas }, noSePuede: textos.noSePuede, colecciones });
console.log(JSON.stringify({ revisionId: nueva.revisionId, previa: PREVIA, conTextosPlataformas: CON_TEXTOS,
  sha256: sha(path.join(destino, 'aplicar-y-aprobar.sql')), sha256Textos: sha(path.join(destino, 'textos-plataformas.sql')),
  cambios: cambios.length, ofertas: escaparate.ofertas.length, colecciones }));

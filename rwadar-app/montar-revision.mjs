// Monta una revisión nueva del catálogo V2 a partir de la anterior y de un
// archivo de cambios con lo comprobado ese día. No consulta la red ni Supabase.
//
// Uso: node rwadar-app/montar-revision.mjs AAAA-MM-DD
//
// Lee  data/verificaciones/<fecha>-v2/cambios-<fecha>.json
// y escribe en esa carpeta el radar, el escaparate, la documentación y el
// manifiesto; en data/importaciones/catalogo-<fecha>-v2/, catalogo.sql (el
// borrador de siempre), aplicar-y-aprobar.sql (importa y aprueba en una sola
// transacción) y revision.json.
//
// Archivo de cambios (todo opcional salvo «desde», «alcance» y las notas):
// {
//   "desde": "2026-10-06",                 revisión de partida
//   "alcance": "…",                        texto del radar y origen del lote
//   "notaOrigen": "…", "notaActualizacion": "…",
//   "referenciaAprobacion": "…",           queda en la base al aprobar
//   "retirarFuentes": ["https://…"],       fuera de fichas, documentación y referencias
//   "fuentes": { "<id>": { "url": "…" } }, cambios en fuentes del radar
//   "fuentesNuevas": [{ "id", "tipo", "titulo", "url" }],
//   "fuentesRetiradas": ["<id>"],
//   "plataformas": { "<slug>": { "acceso": { "estado", "detalle", "fuentes": ["<id>"] } } },
//   "ofertas": { "<slug>": {
//     "noRevisada": true,                  conserva fechas y cifras anteriores
//     "cifras": "comprobadas",             obligatorio si la ficha muestra cifras
//     "cambios": { "rentabilidad": …, "metricas": […], "avisos": […] },
//     "referencias": [{ "etiqueta", "valor", "fechaDato", "fechaConsulta", "fuente", "alcance" }],
//     "documentacion": { "descripcion": "…", "caracteristicas": […], "fuentes": […] } } }
// }
// Todas las fuentes del radar quedan consultadas en la fecha nueva: la que no
// se haya podido consultar se cambia por otra equivalente o se retira.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { cargarFuentesLocales, construirSqlImportacion, esRevisionLocal, ordenRevisionLocal } = require('./catalogo-publico.js');

// La etiqueta es la fecha o, si ese día ya hay una entrega, la fecha y su número
// («2026-11-03.2»). Los datos se fechan siempre con la fecha.
const etiqueta = process.argv[2];
assert.ok(esRevisionLocal(etiqueta), 'Uso: node rwadar-app/montar-revision.mjs AAAA-MM-DD[.N]');
const fecha = etiqueta.slice(0, 10);
const APP = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(APP, '..');
const verificaciones = path.join(APP, 'data', 'verificaciones');
const carpeta = path.join(verificaciones, `${etiqueta}-v2`);
const cambios = JSON.parse(fs.readFileSync(path.join(carpeta, `cambios-${etiqueta}.json`), 'utf8'));
const { desde } = cambios;
assert.ok(esRevisionLocal(desde) && ordenRevisionLocal(desde, etiqueta) < 0, 'la revisión de partida debe ser anterior');
for (const campo of ['alcance', 'notaOrigen', 'notaActualizacion', 'referenciaAprobacion']) {
  assert.ok(typeof cambios[campo] === 'string' && cambios[campo].length >= 20, `falta «${campo}» en los cambios`);
}

const leer = archivo => JSON.parse(fs.readFileSync(path.join(verificaciones, `${desde}-v2`, archivo), 'utf8'));
const radar = leer('radar-canonico-26.json');
const escaparate = leer('escaparate-publicacion.json');
const documentacion = leer('documentacion-ofertas.json');
const manifiesto = leer('manifiesto-catalogo.json');
const anterior = construirSqlImportacion(cargarFuentesLocales(RAIZ, { revision: desde, versionEsquema: 2 }));

// Radar: todas las fuentes, consultadas de nuevo en la fecha del lote.
radar.verificadoEl = fecha;
radar.alcance = cambios.alcance;
const retiradas = new Set(cambios.fuentesRetiradas || []);
const desconocidas = Object.keys(cambios.fuentes || {}).filter(id => !radar.fuentes.some(f => f.id === id));
assert.deepEqual(desconocidas, [], 'cambios en fuentes que no existen');
radar.fuentes = radar.fuentes.filter(f => !retiradas.has(f.id))
  .map(f => ({ ...f, ...(cambios.fuentes?.[f.id] || {}), primaria: true, consultadaEl: fecha }))
  .concat((cambios.fuentesNuevas || []).map(f => ({ ...f, primaria: true, consultadaEl: fecha })));
for (const [slug, campos] of Object.entries(cambios.plataformas || {})) {
  const plataforma = radar.plataformas.find(p => p.slug === slug);
  assert.ok(plataforma, `plataforma desconocida: ${slug}`);
  Object.assign(plataforma, campos);
}

// El escaparate repite cada plataforma del radar con sus fuentes completas.
const porId = new Map(radar.fuentes.map(f => [f.id, f]));
const conFuentes = campo => ({ ...campo, fuentes: campo.fuentes.map(id => {
  assert.ok(porId.has(id), `fuente inexistente o retirada: ${id}`);
  return porId.get(id);
}) });
escaparate.plataformas = radar.plataformas.map(p => ({ slug: p.slug, verificacionLocal: {
  verificadoEl: fecha, conservaFechaCanonica: true,
  estadoOperativo: conFuentes(p.estadoOperativo), licenciaRegistro: conFuentes(p.licenciaRegistro),
  acceso: conFuentes(p.acceso), alertasCriticas: p.alertasCriticas.map(conFuentes),
} }));
escaparate.fuente = {
  notaOrigen: cambios.notaOrigen,
  actualizacionLocal: { verificadoEl: fecha,
    archivo: `rwadar-app/data/verificaciones/${etiqueta}-v2/contraste-${etiqueta}.json`,
    publicable: false, derechosImagenVerificados: false, nota: cambios.notaActualizacion },
  actualizacionRadarLocal: { verificadoEl: fecha,
    archivo: `rwadar-app/data/verificaciones/${etiqueta}-v2/radar-canonico-26.json`,
    publicable: false, plataformas: radar.plataformas.length, fuentesPrimarias: radar.fuentes.length },
};

// Fichas: se dan por revisadas salvo «noRevisada»; las cifras solo cambian
// donde el archivo de cambios lo dice.
const fuera = new Set(cambios.retirarFuentes || []);
const sinOferta = Object.keys(cambios.ofertas || {}).filter(slug => !documentacion[slug]);
assert.deepEqual(sinOferta, [], 'cambios en fichas que no existen');
for (const oferta of escaparate.ofertas) {
  const cambio = cambios.ofertas?.[oferta.slug] || {};
  const doc = documentacion[oferta.slug];
  if (!cambio.noRevisada) {
    oferta.verificadaEl = fecha;
    oferta.avisos = oferta.avisos.map(a => ({ ...a, verificadaEl: fecha }));
    doc.revisadaEl = fecha;
  }
  Object.assign(oferta, cambio.cambios || {});
  // Una cifra no se renueva por omisión: hay que decir que se volvió a leer.
  if (!cambio.noRevisada && (oferta.rentabilidad != null || oferta.precio != null)) {
    assert.equal(cambio.cifras, 'comprobadas', `${oferta.slug}: tiene cifras; pon "cifras": "comprobadas" ` +
      'si se leyeron en la fuente oficial ese día, o «noRevisada» si no');
  }
  oferta.avisos =oferta.avisos.map(({ texto, tono, esAntiguedad = false, verificadaEl = fecha, ...resto }) =>
    ({ texto, tono, esAntiguedad, verificadaEl, ...resto }));
  oferta.fuentesActuales = oferta.fuentesActuales.filter(u => !fuera.has(u));
  Object.assign(doc, cambio.documentacion || {});
  doc.fuentes = doc.fuentes.filter(u => !fuera.has(u));
  doc.referencias = doc.referencias.filter(r => !fuera.has(r.fuente)).concat(cambio.referencias || []);
  for (const r of doc.referencias) if (!doc.fuentes.includes(r.fuente)) doc.fuentes.push(r.fuente);
}

const escribir = (destino, valor) => {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, typeof valor === 'string' ? valor : JSON.stringify(valor, null, 2) + '\n');
};
escribir(path.join(carpeta, 'radar-canonico-26.json'), radar);
escribir(path.join(carpeta, 'escaparate-publicacion.json'), escaparate);
escribir(path.join(carpeta, 'documentacion-ofertas.json'), documentacion);
escribir(path.join(carpeta, 'manifiesto-catalogo.json'), manifiesto);

// Mismas comprobaciones que la importación: si algo no cuadra, se para aquí.
const nueva = construirSqlImportacion(cargarFuentesLocales(RAIZ, { revision: etiqueta, versionEsquema: 2 }));
const [a, m, d] = fecha.split('-');
const fechaEs = `${d}/${m}/${a}`;
const aprobacion = `
-- Aprobación en la misma transacción: si algo no cuadra, se deshace todo
-- y lo publicado sigue igual.
do $$
declare v uuid := '${nueva.revisionId}';
begin
  if current_date < date '${fecha}' then
    raise exception 'En Supabase (hora UTC) todavía no es ${fecha}: espera a las 02:00 de España y vuelve a ejecutarlo.';
  end if;
  if (select count(*) from rwadar_catalogo.plataformas where revision_id = v) <> ${manifiesto.plataformas_esperadas} then
    raise exception 'El lote no tiene las ${manifiesto.plataformas_esperadas} plataformas.';
  end if;
  if (select count(*) from rwadar_catalogo.ofertas where revision_id = v) <> ${manifiesto.ofertas_esperadas} then
    raise exception 'El lote no tiene las ${manifiesto.ofertas_esperadas} fichas.';
  end if;
  update rwadar_catalogo.revisiones
     set estado = 'aprobada', aprobada_el = now(),
         aprobada_referencia = '${cambios.referenciaAprobacion.replace(/'/g, "''")}'
   where id = v and estado = 'borrador';
  if not exists (select 1 from rwadar_catalogo.revision_publicable_v2 where id = v) then
    raise exception 'La revisión no queda publicable: se deshace todo.';
  end if;
  raise notice 'RWAdar: revisión % aprobada y publicada (${manifiesto.plataformas_esperadas} plataformas, ${manifiesto.ofertas_esperadas} fichas).', v;
end $$;
`;
assert.ok(nueva.sql.endsWith('commit;\n'));
const importaciones = path.join(APP, 'data', 'importaciones', `catalogo-${etiqueta}-v2`);
escribir(path.join(importaciones, 'catalogo.sql'), nueva.sql);
escribir(path.join(importaciones, 'aplicar-y-aprobar.sql'),
  `-- Revisión del catálogo del ${fechaEs}: importar y aprobar en un solo paso.\n` +
  '-- Pegar entero en Supabase > SQL Editor > Run, después de las 02:00 de España.\n' +
  nueva.sql.slice(0, -'commit;\n'.length).replace('-- El lote entra como BORRADOR. Este fichero nunca lo aprueba ni lo publica.',
    '-- El lote entra como borrador y este mismo archivo lo aprueba al final.') +
  aprobacion.slice(1) + 'commit;\n');
escribir(path.join(importaciones, 'revision.json'), {
  versionEsquema: 2, revisionId: nueva.revisionId, hash: nueva.hash,
  revisionAnterior: anterior.revisionId, fechaRadar: fecha, etiqueta,
  plataformas: radar.plataformas.length, ofertas: escaparate.ofertas.length, estado: 'borrador',
});
console.log(`Lote ${nueva.revisionId} (${fechaEs}): ${radar.plataformas.length} plataformas, ` +
  `${radar.fuentes.length} fuentes, ${escaparate.ofertas.length} fichas; sustituye a ${anterior.revisionId}.`);

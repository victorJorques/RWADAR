// Corrección documental del 03/11/2026 sobre la revisión del 02/11 (f2be1f5e),
// ya aplicada en Supabase. Preparación LOCAL: sin red ni servicios remotos.
//
//   node rwadar-app/data/verificaciones/2026-11-03-v2/preparar-correccion.mjs
//
// Motivo: un localizador técnico de una referencia de Aktionariat
// («sellingEnabled=false; onlyBuySide=true») coincide con el patrón «on…=» que
// la compuerta CSP del publicador trata como manejador inline. Se redacta en
// llano. Radar, ofertas, cifras, avisos, fechas y vigencias del 02/11 se copian
// literalmente: esta entrega no rejuvenece nada.
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
const FECHA = '2026-11-03', DESDE = '2026-11-02';
const PREVIA = 'f2be1f5e-2bfa-daa1-095b-c0b96e9206aa'; // publicada y leída como visitante el 03/11 08:12 UTC
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const escribir = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); };
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base = path.resolve(DIR, `../${DESDE}-v2`);

const previa = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: DESDE, versionEsquema: 2 }));
assert.equal(previa.revisionId, PREVIA, 'la base local no es la revisión publicada');
const lectura = leer(path.join(base, 'lectura-publica', 'ofertas-v2.json'));
assert.ok(lectura.length === 23 && lectura.every(o => o.revision_id === PREVIA), 'lectura pública distinta');

for (const nombre of ['radar-canonico-26.json', 'escaparate-publicacion.json', 'manifiesto-catalogo.json']) {
  fs.copyFileSync(path.join(base, nombre), path.join(DIR, nombre));
}
const documentos = leer(path.join(base, 'documentacion-ofertas.json'));
const ANTES = 'sellingEnabled=false; onlyBuySide=true.';
const DESPUES = 'venta desactivada (sellingEnabled: no) y solo lado comprador (onlyBuySide: sí).';
let cambios = 0;
for (const r of documentos.aktionariat.referencias) {
  if (r.alcance.includes(ANTES)) { r.alcance = r.alcance.replace(ANTES, DESPUES); cambios++; }
}
assert.equal(cambios, 1, 'se esperaba exactamente un localizador que corregir');
documentos.aktionariat.revisadaEl = FECHA; // entrega documental; la oferta conserva su verificación del 02/11
const CSP = /<style\b|\sstyle\s*=|\son[a-z]+\s*=|<script/i;
assert.ok(!CSP.test(JSON.stringify(documentos)) && !CSP.test(fs.readFileSync(path.join(DIR, 'escaparate-publicacion.json'), 'utf8')),
  'queda texto que la compuerta CSP rechazaría');
escribir(path.join(DIR, 'documentacion-ofertas.json'), documentos);
escribir(path.join(DIR, `contraste-${FECHA}.json`), { tipo: 'correccion_documental', fecha: FECHA, revisionAnterior: PREVIA,
  motivo: 'Un localizador técnico de una referencia de Aktionariat coincidía con el patrón «on…=» de la compuerta CSP del publicador.',
  oferta: 'aktionariat', antes: ANTES, despues: DESPUES,
  copiasLiterales: ['radar-canonico-26.json', 'escaparate-publicacion.json', 'manifiesto-catalogo.json'] });

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
    aprobada_referencia = 'Corrección documental 03/11/2026 de la revisión del 02/11: redacción de un localizador de Aktionariat; datos, cifras y vigencias sin cambios. Autorizada por Víctor.'
    where id = v and estado = 'borrador';
  if not exists (select 1 from rwadar_catalogo.revision_publicable_v2 where id = v) then
    raise exception 'Entrega no publicable: se deshace la transacción completa';
  end if;
end $aprobar$;
`;
escribir(path.join(destino, 'aplicar-y-aprobar.sql'),
  '-- Corrección documental del 03/11/2026 sobre la revisión del 02/11. Autorizada por Víctor.\n' +
  '-- Solo cambia la redacción de un localizador de Aktionariat; no renueva radar, cifras ni vigencias.\n' +
  nueva.sql.replace('-- El lote entra como BORRADOR. Este fichero nunca lo aprueba ni lo publica.',
    '-- Este aplicador importa y aprueba al final, únicamente si pasan todas las guardas.')
    .replace('begin;', 'begin isolation level serializable;\n' + guarda)
    .replace(/commit;\n$/, aprobar + 'commit;\n'));
escribir(path.join(destino, 'revision.json'), { versionEsquema: 2, revisionId: nueva.revisionId, hash: nueva.hash,
  revisionAnterior: PREVIA, revisionAnteriorComprobadaEnRemoto: true, fechaEntregaDocumental: FECHA, fechaRadar: DESDE,
  plataformas: 26, ofertas: 23, colecciones: { principales: 6, secundario: 14, en_camino: 3 },
  correcciones: 1, nuevasAltas: 0, estado: 'borrador', aplicadoEnRemoto: false, publicacionWeb: false });
console.log(JSON.stringify({ revisionId: nueva.revisionId, previa: PREVIA, sha256: sha(path.join(destino, 'aplicar-y-aprobar.sql')) }));

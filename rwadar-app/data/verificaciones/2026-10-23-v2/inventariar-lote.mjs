import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../../../..');
const IMPORT = path.join(ROOT, 'rwadar-app/data/importaciones/catalogo-2026-10-23-v2');
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const describir = p => ({ archivo: path.relative(ROOT, p).replaceAll('\\', '/'),
  bytes: fs.statSync(p).size, sha256: sha(p) });
const aplicar = fs.readFileSync(path.join(IMPORT, 'aplicar-y-aprobar.sql'), 'utf8');
const mutaciones = {};
for (const [, verbo, tabla] of aplicar.matchAll(/\b(insert into|update)\s+(rwadar_catalogo\.[a-z_]+)/gi)) {
  const clave = `${verbo.toLowerCase()} ${tabla}`;
  mutaciones[clave] = (mutaciones[clave] || 0) + 1;
}
const inventario = { generadoEl: new Date().toISOString(), alcance: 'Artefactos de la entrega local, no aplicación remota',
  revision: JSON.parse(fs.readFileSync(path.join(IMPORT, 'revision.json'), 'utf8')),
  archivos: [DIR, IMPORT].flatMap(d => fs.readdirSync(d).filter(n => n !== 'inventario-mutaciones.json')
    .map(n => path.join(d, n)).filter(p => fs.statSync(p).isFile()).map(describir)),
  insumos: ['docs/investigacion/2026-10-23/primaria/propuestas-para-revision.json',
    'docs/investigacion/2026-10-23/revision-independiente/REVISION-IOD-OUTEIRO-SPIKO.md',
    'rwadar-movil/assets/ofertas-editoriales/manifest.json',
    'rwadar-app/catalogo-publico.js', 'rwadar-movil/lib/contrato-catalogo.js']
    .map(p => describir(path.join(ROOT, p))),
  sentenciasMutantesDirectasPorTabla: mutaciones,
  efectosDeTriggersExistentes: ['rwadar_catalogo.publicacion_v2', 'public.catalogo_publicacion'],
  sinBorradosNiDDL: !/\b(delete\s+from|truncate|alter\s+(?:table|role)|drop\s|create\s+(?:table|function|policy)|grant\s|revoke\s)\b/i.test(aplicar),
  revisionIndependienteSQL: false, aplicadoRemoto: false, publicacionWeb: false };
fs.writeFileSync(path.join(DIR, 'inventario-mutaciones.json'), JSON.stringify(inventario, null, 2) + '\n');
console.log(JSON.stringify({ revisionId: inventario.revision.revisionId,
  archivos: inventario.archivos.length, mutaciones,
  aplicar: describir(path.join(IMPORT, 'aplicar-y-aprobar.sql')), catalogo: describir(path.join(IMPORT, 'catalogo.sql')) }));

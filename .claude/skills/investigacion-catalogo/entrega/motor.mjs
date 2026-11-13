#!/usr/bin/env node
// Motor de la entrega del catálogo: lo que antes eran tres guiones copiados y adaptados a mano cada día.
//
//   node .claude/skills/investigacion-catalogo/entrega/motor.mjs <orden> <etiqueta> [opciones]
//
// Órdenes (lo propio de cada día está en rwadar-app/data/verificaciones/<etiqueta>-v2/decisiones.json):
//   guiones     escribe en la carpeta del ciclo preparar-entrega.mjs, comprobar-entrega.mjs y despues-de-aplicar.mjs
//               (tres líneas que llaman a este motor) y copia ensayo-rest-simulado.cjs. Así los pasos de siempre
//               (`node <ciclo>/despues-de-aplicar.mjs`…) siguen igual.
//   preparar    datos y SQL (sin red, reproducible byte a byte). --repetir: lo hace dos veces y compara los SHA-256.
//   comprobar   ensayo en PGlite (sin red): inventario, guarda, idempotencia, cada cambio, tarjetas, casos de fallo.
//               --exportar=DIR guarda lo que leería un visitante después de aplicar. --hoy=AAAA-MM-DD ensaya otro día
//               (para repetir una entrega pasada; por omisión, hoy).
//   despues     después de aplicar y sincronizar: transparencia.json al día. Se puede repetir.
//   revisar     resumen para los revisores: qué cambia frente a la entrega anterior (fichas y SQL normalizado).
//   auditar     --antes=DIR (copia de los tres archivos del SQL antes de corregir): comprobación determinista de la
//               corrección. Rehace la entrega dos veces, compara SHA-256, inventario y diff normalizado del SQL, y dice si
//               el SQL cambió (si cambió, hace falta el auditor; si no, basta esto). --revisado=SHA256: la copia tiene que
//               ser el SQL que vieron los revisores. --secretos=RUTA (gitleaks) y --exigir-secretos: sin escáner no es
//               conforme. --escribir: deja VERIFICACION-ENTREGA.md en la carpeta del ciclo. Salida 1 si no es conforme.
// Opciones comunes: --raiz=DIR (repositorio; por omisión, este), --salida=DIR (escribe ahí en vez de en el repositorio:
// para comparar o ensayar sin tocar nada), --decisiones=RUTA.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AQUI, RAIZ_REPO, sha, leer } from './comun.mjs';

export const ORDENES = ['guiones', 'preparar', 'comprobar', 'despues', 'revisar', 'auditar'];

export function opcionesDe(argv) {
  const o = { libres: [] };
  for (const a of argv) {
    const m = a.match(/^--([a-z-]+)(?:=(.*))?$/);
    if (m) o[m[1]] = m[2] === undefined ? true : m[2];
    else o.libres.push(a);
  }
  return o;
}

// La carpeta del ciclo a partir de la etiqueta o de una ruta.
export function cicloDe(etiquetaORuta, raiz = RAIZ_REPO) {
  const v = String(etiquetaORuta || '');
  if (/^\d{4}-\d{2}-\d{2}(?:\.\d+)?$/.test(v)) return path.join(raiz, 'rwadar-app/data/verificaciones', `${v}-v2`);
  assert.ok(v, 'falta la etiqueta del ciclo (AAAA-MM-DD o AAAA-MM-DD.N)');
  return path.resolve(v);
}

const GUION = (orden, etiqueta) => {
  const que = { preparar: 'datos y SQL de la entrega (sin red, reproducible)', comprobar: 'ensayo en PGlite (sin red) [--exportar=DIR]',
    despues: 'transparencia.json al día DESPUÉS de aplicar y sincronizar' }[orden];
  return `// Entrega «${etiqueta}» · ${que}.
// Lo propio de hoy está en decisiones.json; las guardas, en el motor (.claude/skills/investigacion-catalogo/entrega/).
//   node rwadar-app/data/verificaciones/${etiqueta}-v2/${{ preparar: 'preparar-entrega', comprobar: 'comprobar-entrega', despues: 'despues-de-aplicar' }[orden]}.mjs
import { ejecutar } from '../../../../.claude/skills/investigacion-catalogo/entrega/motor.mjs';
await ejecutar('${orden}', import.meta.url, process.argv.slice(2));
`;
};

export function escribirGuiones(DIR) {
  const etiqueta = path.basename(DIR).replace(/-v2$/, '');
  const hechos = [];
  for (const [orden, nombre] of [['preparar', 'preparar-entrega.mjs'], ['comprobar', 'comprobar-entrega.mjs'], ['despues', 'despues-de-aplicar.mjs']]) {
    const destino = path.join(DIR, nombre), texto = GUION(orden, etiqueta);
    if (fs.existsSync(destino) && fs.readFileSync(destino, 'utf8') !== texto)
      throw new Error(`${nombre} ya existe y no es el guion fino del motor: no lo piso (bórralo si es de otro día)`);
    fs.writeFileSync(destino, texto); hechos.push(nombre);
  }
  fs.copyFileSync(path.join(AQUI, 'ensayo-rest-simulado.cjs'), path.join(DIR, 'ensayo-rest-simulado.cjs'));
  hechos.push('ensayo-rest-simulado.cjs');
  return hechos;
}

// Lo llaman los guiones finos de la carpeta del ciclo (import.meta.url de ese guion).
export async function ejecutar(orden, urlGuion, argv = []) {
  const DIR = path.dirname(fileURLToPath(urlGuion));
  return principal([orden, DIR, ...argv]);
}

export async function principal(argv) {
  const [orden, ...resto] = argv;
  const o = opcionesDe(resto);
  assert.ok(ORDENES.includes(orden), `orden desconocida «${orden}» (${ORDENES.join(', ')})`);
  const raiz = path.resolve(o.raiz || RAIZ_REPO);
  const ciclo = cicloDe(o.libres[0], raiz);
  const comunes = { raiz, ciclo, decisiones: o.decisiones && path.resolve(o.decisiones), salida: o.salida && path.resolve(o.salida) };
  if (orden === 'guiones') {
    const hechos = escribirGuiones(ciclo);
    console.log(`Escritos en ${path.relative(raiz, ciclo)}: ${hechos.join(', ')}`);
    return hechos;
  }
  if (orden === 'preparar') {
    const { preparar } = await import('./preparar.mjs');
    if (o.web) comunes.web = path.resolve(o.web);
    const r = preparar(comunes);
    const huellas = Object.fromEntries(r.salidas.map(p => [path.basename(p), sha(p)]));
    if (o.repetir) {
      const r2 = preparar(comunes);
      const otra = Object.fromEntries(r2.salidas.map(p => [path.basename(p), sha(p)]));
      assert.deepEqual(otra, huellas, 'preparar no es reproducible: la segunda vez salen otros SHA-256');
    }
    const resumen = { etiqueta: r.etiqueta, revisionId: r.revisionId, hash: r.hash, previa: r.previa, sha256: r.sha256,
      plataformas: r.plataformas, fuentesRadar: r.fuentesRadar, ofertas: r.ofertas, colecciones: r.colecciones, cambios: r.cambios,
      noAplicado: r.noAplicado, pruebas: r.pruebas.length, difiere: r.difiere.length, ...(o.repetir ? { repetido: 'mismos SHA-256 las dos veces' } : {}), huellas };
    console.log(JSON.stringify(resumen, null, o.json ? 0 : 1));
    return resumen;
  }
  if (orden === 'comprobar') {
    const { comprobar } = await import('./comprobar.mjs');
    return comprobar({ ...comunes, exportar: o.exportar && path.resolve(o.exportar), hoy: o.hoy });
  }
  if (orden === 'despues') {
    const { despues } = await import('./despues.mjs');
    return despues({ ...comunes, web: o.web && path.resolve(o.web), transparencia: o.transparencia && path.resolve(o.transparencia) });
  }
  if (orden === 'revisar') {
    const { resumenRevision } = await import('./revisar.mjs');
    return resumenRevision({ ...comunes, escribir: !o['sin-escribir'] });
  }
  if (orden === 'auditar') {
    const { auditar } = await import('./revisar.mjs');
    assert.ok(o.antes, 'auditar: falta --antes=DIR (la copia del SQL de antes de corregir)');
    const r = await auditar({ ...comunes, antes: path.resolve(o.antes), web: o.web && path.resolve(o.web), hoy: o.hoy,
      gitleaks: (o.gitleaks || o.secretos) && path.resolve(o.gitleaks || o.secretos), sinPglite: !!o['sin-pglite'],
      revisado: o.revisado, exigirSecretos: !!o['exigir-secretos'], escribir: !!o.escribir });
    // Salida 1 si no es conforme: así nadie confunde un «no» con un «sí» al leer la salida.
    if (r.veredicto === 'no_conforme') process.exitCode = 1;
    return r;
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try { await principal(process.argv.slice(2)); }
  catch (e) { console.error(`\nNO: ${e.message}`); if (process.env.RWADAR_MOTOR_TRAZA) console.error(e.stack); process.exitCode = 1; }
}
void leer;

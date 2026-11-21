// =====================================================================
// RWAdar · «Limpiar ramas» (.github/workflows/limpiar-ramas.yml)
// ---------------------------------------------------------------------
// Decide qué ramas de GitHub se pueden borrar sin perder nada. Desde las
// sesiones el borrado da 403 y cada ciclo deja 3 o 4 ramas nuevas: este
// flujo lo lanza la dirección a mano.
//
// Se borra una rama solo si:
//   - su punta ya está en la historia de main
//     (git merge-base --is-ancestor origin/<rama> origin/main), o
//   - tiene un PR unido cuyo head.sha es su punta de ahora (los «squash»).
// Nunca se borra:
//   - main ni datos-tokenizacion (lista fija, aquí abajo);
//   - una rama con un PR abierto;
//   - una rama claude/cerrojo-ciclo-* sin incluir_cerrojos=si: un cerrojo
//     recién creado es igual que main y está activo (para las noticias
//     automáticas de la mañana; ver noticias-automaticas/lib/cerrojo.mjs).
// Todo lo demás se queda, con sus commits propios (los que no están en main).
//
// Sin la palabra BORRAR, exacta, no se borra nada: solo se lista.
//
// Uso (lo llama el flujo; en local sirve para ver la lista):
//   node .github/limpiar-ramas.mjs decidir <carpeta>
//     Lee las ramas (git) y los PR (gh api) y escribe en <carpeta>
//     decisiones.json y borrar.tsv (rama<TAB>punta; vacío sin BORRAR).
//     Entorno: CONFIRMAR, INCLUIR_CERROJOS (si|no), GITHUB_REPOSITORY, GH_TOKEN.
//   node .github/limpiar-ramas.mjs resumen <carpeta>
//     Escribe en $GITHUB_STEP_SUMMARY lo borrado y lo que se queda, con su
//     motivo (lee borradas.txt y fallidas.txt, que deja el paso de borrar).
//     Falla si alguna rama no se pudo borrar.
// El borrado en sí (git push --delete, una a una) está en el flujo.
// Pruebas: node --test .github/limpiar-ramas.test.mjs
// =====================================================================
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/* Estas dos no se borran nunca, pase lo que pase. */
export const PROTEGIDAS = Object.freeze(['main', 'datos-tokenizacion']);
export const CERROJO = /^claude\/cerrojo-ciclo-/;
export const PALABRA = 'BORRAR';
// Lo que deja git en un nombre de rama normal. Un nombre raro no se toca.
const NOMBRE_VALIDO = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;
const SHA = /^[0-9a-f]{40}$/;

/* ---------- La decisión (pura: sin git ni red) ----------
   ramas:            [{ nombre, punta, propios }] (propios: commits que no están en main)
   esAncestroDeMain: nombre => true si su punta ya está en la historia de main
   prsUnidos, prsAbiertos: PR como los da la API de GitHub ({ number, head: { ref, sha } })
   incluirCerrojos:  true solo con incluir_cerrojos=si
   Devuelve, para cada rama, { rama, punta, propios, accion: 'borrar'|'conservar', motivo }. */
export function elegir({ ramas, esAncestroDeMain, prsUnidos = [], prsAbiertos = [], incluirCerrojos = false }) {
  return ramas.map(({ nombre, punta, propios }) => {
    const decision = (accion, motivo) => ({ rama: nombre, punta, propios, accion, motivo });
    if (PROTEGIDAS.includes(nombre)) return decision('conservar', 'rama fija: nunca se borra');
    if (!NOMBRE_VALIDO.test(nombre) || !SHA.test(String(punta))) return decision('conservar', 'nombre o punta que no se entiende: no se toca');
    const abierto = prsAbiertos.find(pr => pr.head?.ref === nombre);
    if (abierto) return decision('conservar', `tiene el PR #${abierto.number} abierto`);
    // Si se borra la base de un PR abierto (PR apilados), GitHub lo cierra.
    const base = prsAbiertos.find(pr => pr.base?.ref === nombre);
    if (base) return decision('conservar', `es la base del PR #${base.number} abierto`);
    if (CERROJO.test(nombre) && incluirCerrojos !== true) {
      return decision('conservar', 'cerrojo de las noticias automáticas: solo se borra con incluir_cerrojos=si');
    }
    if (esAncestroDeMain(nombre) === true) return decision('borrar', 'su punta ya está en la historia de main');
    const unido = prsUnidos.find(pr => pr.head?.ref === nombre && pr.head?.sha === punta && (pr.base?.ref ?? 'main') === 'main');
    if (unido) return decision('borrar', `el PR #${unido.number} se unió con esta misma punta`);
    const otro = prsUnidos.find(pr => pr.head?.ref === nombre);
    const commits = `${propios} commit${propios === 1 ? '' : 's'} propio${propios === 1 ? '' : 's'} que no está${propios === 1 ? '' : 'n'} en main`;
    return decision('conservar', otro ? `${commits}; el PR #${otro.number} se unió con otra punta` : commits);
  });
}

/* Lo que se borra de verdad: nada sin la palabra exacta. */
export function listaParaBorrar(decisiones, confirmar) {
  if (confirmar !== PALABRA) return [];
  return decisiones.filter(d => d.accion === 'borrar' && !PROTEGIDAS.includes(d.rama));
}

/* El resumen de la ejecución, en Markdown. */
export function resumen({ decisiones, confirmar, borradas = [], fallidas = [] }) {
  const confirmado = confirmar === PALABRA;
  const aBorrar = decisiones.filter(d => d.accion === 'borrar');
  const quedan = decisiones.filter(d => d.accion === 'conservar');
  const linea = d => `- \`${d.rama}\` · ${d.motivo}`;
  const motivoDe = rama => aBorrar.find(d => d.rama === rama)?.motivo || '';
  const partes = [];
  if (confirmado) {
    partes.push('## Limpiar ramas · borrado', '');
    partes.push(`### Borradas (${borradas.length})`, '', ...(borradas.length ? borradas.map(r => linea({ rama: r, motivo: motivoDe(r) })) : ['Ninguna.']), '');
    if (fallidas.length) {
      partes.push(`### No se pudieron borrar (${fallidas.length})`, '',
        'Su punta cambió mientras tanto o GitHub no dejó borrarlas: mira el registro del paso «Borrar las ramas elegidas».', '',
        ...fallidas.map(r => `- \`${r}\``), '');
    }
  } else {
    partes.push('## Limpiar ramas · solo lista (no se ha borrado nada)', '',
      `Para borrarlas, vuelve a lanzarlo escribiendo ${PALABRA} en «confirmar».`, '');
    partes.push(`### Se borrarían (${aBorrar.length})`, '', ...(aBorrar.length ? aBorrar.map(linea) : ['Ninguna.']), '');
  }
  partes.push(`### Se quedan (${quedan.length})`, '', ...(quedan.length ? quedan.map(linea) : ['Ninguna.']), '');
  return partes.join('\n');
}

/* ---------- Lo que llama a git y a gh ---------- */
const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();

function esAncestro(nombre, cwd) {
  const r = spawnSync('git', ['merge-base', '--is-ancestor', `refs/remotes/origin/${nombre}`, 'refs/remotes/origin/main'], { cwd, stdio: 'ignore' });
  if (r.status === 0) return true;
  if (r.status === 1) return false;
  throw new Error(`git merge-base --is-ancestor falló con la rama ${nombre} (código ${r.status})`);
}

/* PR del repositorio por la API de GitHub, como { number, head: { ref, sha }, base: { ref }, unido }. */
export function leerPRs(repo, estado) {
  const salida = execFileSync('gh', ['api', '--paginate', `repos/${repo}/pulls?state=${estado}&per_page=100`,
    '--jq', '.[] | [.number, .head.ref, .head.sha, (.merged_at // ""), .base.ref] | @tsv'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  return salida.split('\n').filter(Boolean).map(l => {
    const [numero, ref, sha, unidoEl, baseRef] = l.split('\t');
    return { number: Number(numero), head: { ref, sha }, base: { ref: baseRef }, unido: Boolean(unidoEl) };
  });
}

export function leerHechos({ cwd, repo }) {
  // Todas las ramas, al día, aunque el checkout no las haya traído.
  git(['fetch', '--prune', '--no-tags', '--quiet', 'origin', '+refs/heads/*:refs/remotes/origin/*'], cwd);
  const ramas = git(['for-each-ref', '--format=%(refname:lstrip=3)%09%(objectname)', 'refs/remotes/origin'], cwd)
    .split('\n').filter(Boolean).map(l => l.split('\t'))
    .filter(([nombre]) => nombre !== 'HEAD')
    .map(([nombre, punta]) => ({
      nombre, punta,
      propios: NOMBRE_VALIDO.test(nombre) ? Number(git(['rev-list', '--count', `refs/remotes/origin/main..refs/remotes/origin/${nombre}`], cwd)) : 0,
    }));
  if (!ramas.some(r => r.nombre === 'main')) throw new Error('no encuentro origin/main: no decido nada');
  const ancestros = new Set(ramas.filter(r => NOMBRE_VALIDO.test(r.nombre) && esAncestro(r.nombre, cwd)).map(r => r.nombre));
  return {
    ramas,
    esAncestroDeMain: nombre => ancestros.has(nombre),
    prsAbiertos: leerPRs(repo, 'open'),
    prsUnidos: leerPRs(repo, 'closed').filter(pr => pr.unido),
  };
}

function incluirCerrojosDe(valor) {
  if (valor === 'si') return true;
  if (valor === 'no' || valor === undefined || valor === '') return false;
  throw new Error(`incluir_cerrojos tiene que ser «si» o «no» (llegó «${valor}»)`);
}

const leerLista = archivo => fs.existsSync(archivo) ? fs.readFileSync(archivo, 'utf8').split('\n').map(l => l.trim()).filter(Boolean) : [];

function principal([orden, carpeta], entorno) {
  if (!['decidir', 'resumen'].includes(orden) || !carpeta) {
    console.error('Uso: node .github/limpiar-ramas.mjs decidir|resumen <carpeta>');
    return 2;
  }
  fs.mkdirSync(carpeta, { recursive: true });
  const confirmar = entorno.CONFIRMAR || '';
  if (orden === 'decidir') {
    if (!entorno.GITHUB_REPOSITORY) throw new Error('falta GITHUB_REPOSITORY (dueño/repositorio)');
    const hechos = leerHechos({ cwd: process.cwd(), repo: entorno.GITHUB_REPOSITORY });
    const decisiones = elegir({ ...hechos, incluirCerrojos: incluirCerrojosDe(entorno.INCLUIR_CERROJOS) });
    const borrar = listaParaBorrar(decisiones, confirmar);
    fs.writeFileSync(path.join(carpeta, 'decisiones.json'), JSON.stringify(decisiones, null, 2) + '\n');
    fs.writeFileSync(path.join(carpeta, 'borrar.tsv'), borrar.map(d => `${d.rama}\t${d.punta}\n`).join(''));
    for (const d of decisiones) console.log(`${d.accion === 'borrar' ? 'BORRAR   ' : 'SE QUEDA '} ${d.rama} · ${d.motivo}`);
    console.log(confirmar === PALABRA
      ? `Se van a borrar ${borrar.length} ramas.`
      : `Solo lista: se borrarían ${decisiones.filter(d => d.accion === 'borrar').length} ramas (falta ${PALABRA} en «confirmar»).`);
    return 0;
  }
  const decisiones = JSON.parse(fs.readFileSync(path.join(carpeta, 'decisiones.json'), 'utf8'));
  const fallidas = leerLista(path.join(carpeta, 'fallidas.txt'));
  const texto = resumen({ decisiones, confirmar, borradas: leerLista(path.join(carpeta, 'borradas.txt')), fallidas });
  if (entorno.GITHUB_STEP_SUMMARY) fs.appendFileSync(entorno.GITHUB_STEP_SUMMARY, texto + '\n');
  console.log(texto);
  if (fallidas.length) {
    console.error(`No se pudieron borrar ${fallidas.length} ramas: ${fallidas.join(', ')}`);
    return 1;
  }
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = principal(process.argv.slice(2), process.env);
  } catch (error) {
    console.error(`Limpiar ramas: ${error.message}`);
    process.exitCode = 1;
  }
}

// Los pasos deterministas que van después del editor: el veredicto del
// verificador (decidir y corregir), el sello automático, lo que se mira antes
// de unir y antes de publicar, la comprobación en vivo y la vuelta atrás.
// Todo son funciones sobre archivos y datos: el programa (noticias-auto.mjs)
// las llama y las pruebas también.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { RUTAS, ARCHIVOS_NOTICIAS, Freno, enlazarDependencias, sha256, leerJSON, escribirJSON, git, gitTexto, arbolLimpio, ddmmaaaa } from './comun.mjs';
import { comprobarConforme, cambiosDelSello, CAMBIOS_SELLO_PERMITIDOS, archivosCambiados, archivoPermitido, nombreEdicion, carpetaDelDia } from './validar.mjs';

const require = createRequire(import.meta.url);

/* ---------------- Decidir: ¿qué dice el verificador? ----------------
   Devuelve {siguiente: 'preparar' | 'corregir', motivo} o lanza un Freno.
   pase 1: «conforme» sin nada que corregir → preparar; «con_cambios» con
   correcciones → corregir (y después un segundo pase); cualquier otra cosa →
   freno. pase 2: solo «conforme» sobre los bytes corregidos vale. */
export const CAMPOS_CORREGIBLES = Object.freeze(['titulo', 'en.titulo', 'resumen', 'en.resumen', 'porQueImporta', 'en.porQueImporta',
  'tituloInformativo', 'en.tituloInformativo', 'imagen', 'seccion']);

export function decidir({ verificacion, bytes, ids, fecha, pase }) {
  if (!verificacion || typeof verificacion !== 'object') throw new Freno('verificador', 'el verificador no dejó su verificación (o no es JSON)');
  if (pase === 2) {
    const fallos = comprobarConforme(verificacion, { bytes, ids, pase: 2, fecha });
    if (fallos.length) throw new Freno('verificador', 'el segundo pase del verificador no da «conforme» sobre lo corregido', fallos);
    return { siguiente: 'preparar', motivo: 'segundo pase conforme' };
  }
  if (verificacion.veredicto === 'conforme') {
    const fallos = comprobarConforme(verificacion, { bytes, ids, pase: 1, fecha });
    if (fallos.length) throw new Freno('verificador', 'el verificador dice «conforme», pero su verificación no cuadra', fallos);
    return { siguiente: 'preparar', motivo: 'conforme' };
  }
  if (verificacion.veredicto === 'con_cambios') {
    const fallos = [];
    if (verificacion.version !== 1 || verificacion.pase !== 1 || verificacion.fecha !== fecha) fallos.push('versión, pase o fecha de la verificación');
    if (verificacion.edicionSha256 !== sha256(bytes)) fallos.push('edicionSha256 no es el SHA-256 de lo que entregó el editor');
    if (!Array.isArray(verificacion.correcciones) || !verificacion.correcciones.length) fallos.push('«con_cambios» sin correcciones');
    if (fallos.length) throw new Freno('verificador', 'el verificador pide cambios, pero su verificación no cuadra', fallos);
    return { siguiente: 'corregir', motivo: `${verificacion.correcciones.length} corrección(es)` };
  }
  throw new Freno('verificador', verificacion.veredicto === 'rechazado'
    ? 'el verificador ha rechazado la edición' : `veredicto desconocido del verificador («${verificacion.veredicto}»)`,
  (verificacion.noticias || []).filter(n => n?.veredicto !== 'confirmada').map(n => `${n?.id}: ${n?.veredicto}${n?.motivo ? ` (${n.motivo})` : ''}`));
}

/* ---------------- Corregir: aplica SOLO lo que pidió el verificador ----------------
   Cada corrección: {id, campo, antes, despues, motivo} (el «antes» tiene que
   coincidir letra a letra) o {id, quitar: true, motivo}. Devuelve la edición y
   los titulares corregidos y el registro (correcciones.json). */
export function corregir({ edicion, titulares, verificacion, verificacionBytes }) {
  const nueva = structuredClone(edicion), nuevosTit = structuredClone(titulares);
  const aplicadas = [];
  for (const c of verificacion.correcciones || []) {
    const i = nueva.noticias.findIndex(n => n.id === c?.id);
    if (i < 0) throw new Freno('corregir', `la corrección habla de una noticia que no está («${c?.id}»)`);
    if (c.quitar === true) {
      nueva.noticias.splice(i, 1);
      nuevosTit.noticias = nuevosTit.noticias.filter(t => t.id !== c.id);
      aplicadas.push({ id: c.id, quitar: true, motivo: String(c.motivo || '') });
      continue;
    }
    if (!CAMPOS_CORREGIBLES.includes(c.campo)) throw new Freno('corregir', `campo no corregible: «${c.campo}» (${c.id})`);
    if (typeof c.antes !== 'string' || typeof c.despues !== 'string' || !c.despues.trim()) throw new Freno('corregir', `corrección sin «antes» o «despues» (${c.id}, ${c.campo})`);
    const [a, b] = c.campo.split('.');
    const objeto = b ? nueva.noticias[i][a] : nueva.noticias[i];
    const clave = b || a;
    if (!objeto || objeto[clave] !== c.antes) throw new Freno('corregir', `el «antes» no coincide con lo que dice la noticia (${c.id}, ${c.campo})`);
    objeto[clave] = c.despues;
    const t = nuevosTit.noticias.find(x => x.id === c.id);
    if (t && (c.campo === 'titulo' || c.campo === 'en.titulo')) {
      const idioma = c.campo === 'titulo' ? 'es' : 'en';
      t.propuestas = t.propuestas || {};
      const lista = Array.isArray(t.propuestas[idioma]) ? t.propuestas[idioma] : [];
      if (!lista.includes(c.despues)) lista.push(c.despues);
      t.propuestas[idioma] = lista;
      t.elegido = { ...t.elegido, [idioma]: c.despues };
      t.heredado = null;
      t.motivo = `${String(t.motivo || '').slice(0, 200)} (titular corregido por el verificador)`.trim();
    }
    if (t && c.campo === 'imagen') t.foto = { ...t.foto, clave: c.despues, alternativas: (t.foto?.alternativas || []).filter(x => x !== c.despues) };
    aplicadas.push({ id: c.id, campo: c.campo, antes: c.antes, despues: c.despues, motivo: String(c.motivo || '') });
  }
  if (!nueva.noticias.length) throw new Freno('corregir', 'tras las correcciones no queda ninguna noticia');
  const registro = { version: 1, verificacionSha256: sha256(verificacionBytes), aplicadas };
  return { edicion: nueva, titulares: nuevosTit, registro };
}

/* ---------------- Sello automático ----------------
   Solo cambia el commit, la huella del contenido y la nota de estado.json.
   NUNCA «actualizadoEl»: esa fecha es la del último sello revisado por una
   persona, y la compuerta caduca a los 7 días sin uno (MANIFIESTO_CADUCADO).
   Antes comprueba que el contenido sellado cambia SOLO en las noticias. */
export function sellar({ raiz, fecha, base = 'origin/main', revisionCatalogo }) {
  if (!arbolLimpio(raiz)) throw new Freno('sello', 'el árbol no está limpio: falta el commit de las noticias o sobra algo');
  const { RUTAS_CONTENIDO_APROBADO, huellaContenidoAprobado } = require(path.join(raiz, 'rwadar-publicacion-segura.js'));
  const sellados = git(['-c', 'core.quotePath=false', 'diff', '--no-renames', '--name-only', base, 'HEAD', '--', ...RUTAS_CONTENIDO_APROBADO], { cwd: raiz })
    .salida.split('\n').map(l => l.trim()).filter(Boolean).sort();
  const esperados = [...ARCHIVOS_NOTICIAS].sort();
  if (JSON.stringify(sellados) !== JSON.stringify(esperados)) {
    throw new Freno('sello', `el sello automático solo puede aprobar las noticias, y el contenido sellado cambia en: ${sellados.join(', ') || 'nada'}`);
  }
  for (const rel of archivosCambiados(raiz, base)) {
    if (!archivoPermitido(rel, fecha)) throw new Freno('sello', `la rama cambia ${rel}, fuera de lo que puede tocar la mañana`);
  }
  // La base tiene que estar ya sellada: el sello automático aprueba las
  // noticias, nunca lo que otro unió a main sin sello (p. ej. un PR de código
  // unido antes que su PR de sello). Su contenido sellado tiene que ser igual
  // al del commit que aprobó su estado.json.
  const estadoBase = JSON.parse(git(['show', `${base}:${RUTAS.sello}`], { cwd: raiz }).salida);
  const aprobado = String(estadoBase?.revisionAprobada?.commit || '');
  const ancestro = /^[0-9a-f]{40}$/.test(aprobado)
    && git(['merge-base', '--is-ancestor', aprobado, base], { cwd: raiz, permitir: [0, 1, 128] }).codigo === 0;
  const igualQueAprobado = ancestro
    && git(['diff', '--quiet', '--no-renames', aprobado, base, '--', ...RUTAS_CONTENIDO_APROBADO], { cwd: raiz, permitir: [0, 1] }).codigo === 0;
  if (!igualQueAprobado) throw new Freno('sello', 'main tiene contenido sellado que nadie aprobó (su sello no lo cubre): el sello automático no lo aprueba');
  const ruta = path.join(raiz, RUTAS.sello);
  const antes = leerJSON(ruta);
  const despues = structuredClone(antes);
  despues.nota = `Noticias del sector del ${ddmmaaaa(fecha)}, escritas y verificadas por la mañana automática, sobre el catálogo ${String(revisionCatalogo || '').slice(0, 8)}`;
  despues.revisionAprobada.commit = gitTexto(['rev-parse', 'HEAD'], { cwd: raiz });
  despues.revisionAprobada.contenidoSha256 = huellaContenidoAprobado(raiz);
  const cambios = cambiosDelSello(antes, despues).filter(c => !CAMBIOS_SELLO_PERMITIDOS.includes(c));
  if (cambios.length) throw new Freno('sello', `el sello cambiaría ${cambios.join(', ')}`);
  fs.writeFileSync(ruta, JSON.stringify(despues, null, 2) + '\n');
  return { commit: despues.revisionAprobada.commit, contenidoSha256: despues.revisionAprobada.contenidoSha256, nota: despues.nota };
}

/* Tras el commit del sello (B): ¿la unión con «merge» deja main publicable?
   Se simula en un árbol aparte: main (base) + merge --no-ff B, y la compuerta
   de «Publicar web» (auditar-relanzamiento.mjs) tiene que decir que sí.
   «cabeza» se resuelve en «raiz», ANTES de crear la copia: dentro de la copia,
   HEAD es la propia base y la unión no uniría nada («Already up to date»). */
export function simularUnion({ raiz, base = 'origin/main', cabeza = 'HEAD', modo = 'merge', destino }) {
  const sha = gitTexto(['rev-parse', '--verify', `${cabeza}^{commit}`], { cwd: raiz });
  const dir = destino || fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-union-'));
  fs.rmSync(dir, { recursive: true, force: true });
  git(['worktree', 'add', '--detach', '--force', dir, base], { cwd: raiz });
  try {
    const id = ['-c', 'user.name=Ensayo', '-c', 'user.email=ensayo@example.invalid'];
    if (modo === 'squash') {
      git([...id, 'merge', '--squash', sha], { cwd: dir });
      git([...id, 'commit', '-q', '-m', 'Unión simulada (squash)'], { cwd: dir });
    } else {
      git([...id, 'merge', '--no-ff', '-q', '-m', 'Unión simulada', sha], { cwd: dir });
      // Que de verdad haya unido la rama: el segundo padre de la unión es la cabeza.
      if (git(['rev-parse', '--verify', '-q', 'HEAD^2'], { cwd: dir, permitir: [0, 1, 128] }).salida.trim() !== sha) {
        throw new Freno('sello', 'la unión simulada no unió la rama (la cabeza ya estaba en la base o no se resolvió)');
      }
    }
    enlazarDependencias(raiz, dir);
    const r = spawnSync(process.execPath, ['rwadar-app/auditar-relanzamiento.mjs'], { cwd: dir, encoding: 'utf8' });
    const bloqueos = [...String(r.stdout).matchAll(/^- \[([A-Z_]+)\]/gm)].map(m => m[1]);
    return { listo: r.status === 0, bloqueos, salida: String(r.stdout).trim().split('\n').slice(-6).join('\n') };
  } finally {
    git(['worktree', 'remove', '--force', dir], { cwd: raiz, permitir: [0, 128] });
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/* ---------------- Antes de unir ----------------
   pr: {number, title, state, base: {ref, sha}, head: {sha}, commits, merged}
   archivos: lista de rutas del PR; checks: [{name, status, conclusion, head_sha}] */
export function antesDeUnir({ fecha, pr, mainSha, cabeza, archivos, checks }) {
  const f = [];
  if (pr?.state !== 'open' || pr?.merged) f.push('el PR no está abierto');
  if (pr?.base?.ref !== 'main') f.push(`el PR no va a main (va a ${pr?.base?.ref})`);
  if (pr?.base?.sha !== mainSha) f.push(`main cambió desde que se abrió el PR (base ${String(pr?.base?.sha).slice(0, 7)}, main ${String(mainSha).slice(0, 7)})`);
  if (pr?.head?.sha !== cabeza) f.push(`la cabeza del PR no es el commit del sello (${String(pr?.head?.sha).slice(0, 7)} ≠ ${String(cabeza).slice(0, 7)})`);
  if (pr?.commits !== 2) f.push(`el PR debe llevar 2 commits (noticias y sello) y lleva ${pr?.commits}`);
  if (!Array.isArray(archivos) || !archivos.length) f.push('no tengo la lista de archivos del PR');
  else for (const rel of archivos) if (!archivoPermitido(rel, fecha, { conSello: true })) f.push(`el PR cambia ${rel}`);
  const pruebas = (checks || []).filter(c => c?.name === 'pruebas' && c?.head_sha === cabeza);
  if (!pruebas.length) f.push('falta la comprobación «pruebas» de la CI en el commit del sello');
  else if (!pruebas.every(c => c.status === 'completed' && c.conclusion === 'success')) f.push(`la CI no está en verde («pruebas»: ${pruebas.map(c => c.conclusion || c.status).join(', ')})`);
  if (f.length) throw new Freno('unir', f[0], f);
  return { ok: true };
}

/* ---------------- La ejecución de «Publicar web» es la nuestra ----------------
   publicar.yml publica el main que haya cuando arranca: si no es el commit de
   unión, se cancela (antes de llegar a «Publicar en…») y se frena. */
export function comprobarEjecucion({ ejecucion, union }) {
  const f = [];
  if (!/publicar\.yml$/.test(String(ejecucion?.path || ''))) f.push('no es una ejecución de «Publicar web»');
  if (ejecucion?.event !== 'workflow_dispatch') f.push('no la lanzó workflow_dispatch');
  if (ejecucion?.head_branch !== 'main') f.push(`no es de main (${ejecucion?.head_branch})`);
  if (ejecucion?.head_sha !== union) f.push(`publica ${String(ejecucion?.head_sha).slice(0, 7)} y no el commit de unión ${String(union).slice(0, 7)}: CANCÉLALA ya`);
  if (f.length) throw new Freno('publicar', f[0], f);
  return { ok: true };
}

/* ---------------- Comprobación en vivo ----------------
   Lo que sirve <base> tiene que ser, byte a byte, lo del repositorio. */
async function pedir(url, { fetchFn = fetch } = {}) {
  try {
    const r = await fetchFn(url, { cache: 'no-store', redirect: 'follow', signal: AbortSignal.timeout(30000), headers: { 'cache-control': 'no-cache' } });
    return { estado: r.status, tipo: r.headers.get('content-type') || '', bytes: Buffer.from(await r.arrayBuffer()) };
  } catch (e) { return { estado: 0, tipo: '', bytes: Buffer.alloc(0), error: String(e.cause?.code || e.name || e.message) }; }
}

export async function comprobarVivoUnaVez({ base, raiz, fetchFn = fetch }) {
  const b = base.replace(/\/$/, '');
  const v2 = fs.readFileSync(path.join(raiz, RUTAS.v2)), v1 = fs.readFileSync(path.join(raiz, RUTAS.v1));
  const fotos = leerJSON(path.join(raiz, RUTAS.fotos)).fotos || {};
  const fallos = [], bien = [];
  const r2 = await pedir(`${b}/datos/noticias-v2.json`, { fetchFn });
  if (r2.estado !== 200) fallos.push(`/datos/noticias-v2.json: HTTP ${r2.estado}${r2.error ? ` (${r2.error})` : ''}`);
  else if (!/application\/json/.test(r2.tipo)) fallos.push(`/datos/noticias-v2.json: tipo ${r2.tipo}`);
  else if (sha256(r2.bytes) !== sha256(v2)) fallos.push('/datos/noticias-v2.json: no es byte a byte el de main');
  else bien.push('/datos/noticias-v2.json');
  const r1 = await pedir(`${b}/datos/noticias.json`, { fetchFn });
  if (r1.estado !== 200) fallos.push(`/datos/noticias.json: HTTP ${r1.estado}`);
  else if (sha256(r1.bytes) !== sha256(v1)) fallos.push('/datos/noticias.json: no es byte a byte el de main');
  else if (/"imagen"/.test(r1.bytes.toString('utf8'))) fallos.push('/datos/noticias.json lleva «imagen» (la app instalada lo rechazaría)');
  else bien.push('/datos/noticias.json');
  let edicion = null;
  try { edicion = JSON.parse(v2.toString('utf8')); } catch { fallos.push('el noticias-v2.json del repositorio no es JSON'); }
  for (const clave of [...new Set((edicion?.noticias || []).map(n => n.imagen).filter(Boolean))]) {
    const r = await pedir(`${b}/noticias-editoriales/${clave}.webp`, { fetchFn });
    if (r.estado !== 200) fallos.push(`foto ${clave}: HTTP ${r.estado}`);
    else if (!/image\/webp/.test(r.tipo)) fallos.push(`foto ${clave}: tipo ${r.tipo}`);
    else if (sha256(r.bytes) !== fotos[clave]?.sha256) fallos.push(`foto ${clave}: SHA-256 distinto del de fotos.json`);
    else bien.push(`foto ${clave}`);
  }
  for (const [ruta, marca] of [['/', 'data-noticias="portada"'], ['/mercado/', 'data-noticias="lista"']]) {
    const r = await pedir(b + ruta, { fetchFn });
    if (r.estado !== 200) fallos.push(`${ruta}: HTTP ${r.estado}`);
    else if (!r.bytes.toString('utf8').includes(marca)) fallos.push(`${ruta}: no tiene ${marca}`);
    else bien.push(ruta);
  }
  return { fallos, bien };
}

export async function comprobarVivo({ base, raiz, intentos = 6, esperaMs = 20000, fetchFn = fetch, dormir = ms => new Promise(f => setTimeout(f, ms)) }) {
  let ultimo;
  for (let i = 1; i <= intentos; i++) {
    ultimo = await comprobarVivoUnaVez({ base, raiz, fetchFn });
    if (!ultimo.fallos.length) return { ...ultimo, intentos: i };
    if (i < intentos) await dormir(esperaMs);
  }
  throw new Freno('en vivo', `${base} no sirve lo que hay en main: ${ultimo.fallos[0]}`, ultimo.fallos);
}

/* ---------------- Volver a la edición verificada de un día ---------------- */
export function volver({ raiz, a }) {
  const carpeta = path.join(raiz, carpetaDelDia(a));
  const edicion = path.join(carpeta, nombreEdicion(a));
  if (!fs.existsSync(edicion)) throw new Error(`no hay edición automática del ${a} (${carpetaDelDia(a)})`);
  const v1mod = require(path.join(raiz, 'rwadar-app/noticias/noticias-v1.cjs'));
  const bytes = fs.readFileSync(edicion);
  fs.writeFileSync(path.join(raiz, RUTAS.v2), bytes);
  fs.writeFileSync(path.join(raiz, RUTAS.v1), v1mod.derivarV1(bytes.toString('utf8')));
  return { sha256: sha256(bytes) };
}

/* ---------------- Resumen final (lo que llega al móvil) ---------------- */
export const ESTADOS = Object.freeze(['PUBLICADO', 'SIN_HACER_NADA', 'SIN_CAMBIOS', 'FRENADO', 'UNIDO_SIN_PUBLICAR', 'PUBLICADO_CON_AVISO', 'ENSAYO']);
const corto = (t, n) => { const p = String(t || '').replace(/\s+/g, ' ').trim(); return p.length > n ? p.slice(0, n - 1) + '…' : p; };

export function primeraLinea({ fecha, estado, paso, motivo, noticias = [], hoyCuantas = 0, hora, accion }) {
  const d = `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`;
  switch (estado) {
    case 'PUBLICADO': return `Noticias ${d}: PUBLICADAS (${noticias.length}; ${hoyCuantas} de hoy) · web y app comprobadas ${hora || ''}`.trim();
    case 'SIN_HACER_NADA': return corto(`Noticias ${d}: no hice nada · ${motivo}.${accion ? ` ${accion}` : ''}`, 300);
    case 'SIN_CAMBIOS': return `Noticias ${d}: sin cambios · nada nuevo que publicar; la web sigue como estaba.`;
    case 'FRENADO': return corto(`Noticias ${d}: NO publicadas · ${paso}: ${motivo}. La web sigue como estaba.`, 300);
    case 'UNIDO_SIN_PUBLICAR': return corto(`Noticias ${d}: UNIDAS SIN PUBLICAR · ${paso}: ${motivo}`, 300);
    case 'PUBLICADO_CON_AVISO': return corto(`Noticias ${d}: PUBLICADAS CON AVISO · ${motivo}`, 300);
    case 'ENSAYO': return `Noticias ${d}: ENSAYO terminado · sin push, sin PR y sin publicar; ${noticias.length} noticias listas y unión simulada correcta.`;
    default: throw new Error(`estado desconocido: ${estado}`);
  }
}

/* ¿Hay que mandar notificación? Siempre que haga falta que alguien mire.
   No: publicado, ensayo, sin cambios, y «no hice nada» por pausa o porque ya
   estaban publicadas hoy (motivos con avisar: false). */
export function hayQueAvisar({ estado, avisarCerrojo = true }) {
  if (['PUBLICADO', 'ENSAYO', 'SIN_CAMBIOS'].includes(estado)) return false;
  if (estado === 'SIN_HACER_NADA') return avisarCerrojo;
  return true;
}

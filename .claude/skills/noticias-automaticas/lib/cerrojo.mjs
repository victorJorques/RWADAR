// El cerrojo: ¿puede trabajar hoy la mañana? Si no, no hace nada y dice
// por qué y qué tiene que hacer la dirección para que vuelva a publicar.
//
// «decidirCerrojo» es una función pura sobre los hechos; «recogerHechos» los
// junta (git, la web publicada, la construcción de main y lo que la sesión
// trajo de GitHub en <trabajo>/cerrojo/*.json).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { RUTAS, ARCHIVOS_NOTICIAS, DIR_SKILL, sha256, git, gitTexto, leerJSON, leerJSONSiHay, sumarDias, diasEntre, ddmm, ddmmaaaa, esFecha } from './comun.mjs';
import { compararArchivos, cambiosSelladosDesde } from './produccion.mjs';
import { comprobarConforme, verificacionFinal, nombreEdicion } from './validar.mjs';

const require = createRequire(import.meta.url);

// Flujos que solo se lanzan a mano: si uno corre, alguien está trabajando.
export const FLUJOS_MANUALES = Object.freeze(['aplicar-catalogo.yml', 'publicar.yml', 'ota-android.yml', 'avisar-novedad.yml', 'compilar-app.yml',
  'supabase-gestion.yml', 'avisos-base.yml', 'notificaciones-web.yml', 'correo-lettermint.yml', 'dominio-correo.yml', 'ensayo-restauracion.yml']);
export const PREFIJO_PR = 'Noticias automáticas del ';
export const RAMA_CERROJO = /^claude\/cerrojo-ciclo-(\d{4}-\d{2}-\d{2})$/;
const EN_MARCHA = new Set(['queued', 'in_progress', 'waiting', 'requested', 'pending']);

/* Un PR ajeno bloquea si toca algo de esto (además de lo sellado). */
export function rutaBloqueante(rel, rutasSelladas) {
  if (rel === RUTAS.sello) return true;
  if (['rwadar-app/data/', 'rwadar-app/db/', 'rwadar-movil/'].some(p => rel.startsWith(p))) return true;
  return rutasSelladas.some(r => rel === r || rel.startsWith(r + '/'));
}
export const fechaDelPR = titulo => {
  const m = /(\d{2})\/(\d{2})\/(\d{4})/.exec(String(titulo || ''));
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};
export const esPRPropio = pr => String(pr?.title || '').startsWith(PREFIJO_PR);

function motivo(codigo, texto, accion, avisar = true) { return { codigo, texto, accion, avisar }; }

/* Los hechos → la decisión. */
export function decidirCerrojo(h) {
  const motivos = [], avisos = [], cerrarPRs = [];
  const hoy = h.hoy, ayer = sumarDias(hoy, -1);
  const rutasSelladas = h.rutasSelladas || [];

  if (h.config?.activo === false) motivos.push(motivo('PAUSADA', 'la mañana está en pausa («activo»: false en config.json)', 'Nada: para encenderla, «activo»: true por PR.', false));

  for (const rama of h.ramasCerrojo || []) {
    const m = RAMA_CERROJO.exec(rama);
    if (!m) continue;
    if (m[1] === hoy || m[1] === ayer) motivos.push(motivo('RAMA_CERROJO', `hay un ciclo manual en marcha (rama ${rama})`, `Si ese ciclo ya acabó, borra la rama ${rama}.`));
    else avisos.push(`Rama de cerrojo vieja: ${rama}. Bórrala.`);
  }
  if (!h.github) motivos.push(motivo('SIN_GITHUB', 'no pude leer los PR ni las ejecuciones de GitHub', 'Comprueba que la sesión tiene GitHub (gh o las herramientas de GitHub).'));
  for (const pr of h.prs || []) {
    if (esPRPropio(pr)) {
      if (fechaDelPR(pr.title) === hoy) motivos.push(motivo('OTRA_MANANA', `ya hay un PR de las noticias de hoy (#${pr.number})`, `Mira el PR #${pr.number}: otra mañana de hoy lo dejó abierto.`));
      else cerrarPRs.push(pr.number);
      continue;
    }
    const tocan = (pr.files || []).filter(f => rutaBloqueante(f, rutasSelladas));
    if (tocan.length) motivos.push(motivo('PR_AJENO', `el PR #${pr.number} («${String(pr.title).slice(0, 60)}») toca ${tocan.slice(0, 3).join(', ')}${tocan.length > 3 ? '…' : ''}`, `Une o cierra el PR #${pr.number}.`));
    else avisos.push(`PR #${pr.number} abierto que no toca nada de la web (no bloquea).`);
  }
  const propios = new Set((h.prs || []).filter(esPRPropio).map(p => p.number));
  for (const e of h.ejecuciones || []) {
    if (!EN_MARCHA.has(e.status)) continue;
    const flujo = path.basename(String(e.path || ''));
    if (FLUJOS_MANUALES.includes(flujo)) motivos.push(motivo('EJECUCION', `está corriendo «${e.name}» (ejecución ${e.id})`, 'Espera a que termine; mañana se vuelve a intentar.'));
    else if (flujo === 'ci.yml' && !(e.pull_requests || []).some(p => propios.has(p.number))) {
      motivos.push(motivo('EJECUCION', `está corriendo la verificación de otro PR (${e.head_branch})`, 'Hay otro trabajo en marcha: se vuelve a intentar mañana.'));
    }
  }

  const prod = h.produccion || {}, main = h.main || {};
  if (prod.noticiasActualizadoEl === hoy) motivos.push(motivo('YA_PUBLICADAS', 'las noticias de hoy ya están publicadas', 'Nada.', false));
  else if (main.noticiasActualizadoEl === hoy) motivos.push(motivo('UNIDAS_SIN_PUBLICAR', 'main ya tiene las noticias de hoy, pero la web no', 'Publica la web («Publicar web») o mira por qué no se publicó.'));

  // ¿main es lo que ya está en producción? (salvo noticias verificadas y tokenización)
  if (!h.publicado?.sha) motivos.push(motivo('SIN_PUBLICACION', 'no encuentro la última publicación en producción («Publicar web» en verde)', 'Publica la web una vez a mano para que la mañana sepa qué hay en producción.'));
  else if (h.cambiosSellados) {
    if (!h.cambiosSellados.ancestro) motivos.push(motivo('MAIN_SIN_PUBLICAR', `lo publicado (${h.publicado.sha.slice(0, 7)}) no es antepasado de main`, 'Revisa main y publica la web a mano.'));
    else {
      const otros = h.cambiosSellados.cambios.filter(f => !ARCHIVOS_NOTICIAS.includes(f));
      if (otros.length) motivos.push(motivo('MAIN_SIN_PUBLICAR', `main tiene ${otros.length} cambio(s) sellado(s) sin publicar (${otros.slice(0, 3).join(', ')}${otros.length > 3 ? '…' : ''})`,
        'Publica tú esos cambios («Publicar web», revisión y producción) o la mañana seguirá parada.'));
    }
  }
  if (h.comparacion) {
    if (h.comparacion.distintas.length) motivos.push(motivo('WEB_DISTINTA', `la web publicada no es main en ${h.comparacion.distintas.length} archivo(s) (${h.comparacion.distintas.slice(0, 3).map(d => d.archivo).join(', ')}${h.comparacion.distintas.length > 3 ? '…' : ''})`,
      'Publica main a mano («Publicar web») o averigua qué hay en producción que no está en main.'));
  } else motivos.push(motivo('WEB_SIN_COMPARAR', 'no pude comparar main con la web publicada', 'Mira el registro de la sesión.'));
  if (main.noticiasSha256 && prod.noticiasSha256 && main.noticiasSha256 !== prod.noticiasSha256 && main.noticiasActualizadoEl !== hoy) {
    if (!(h.noticiasVerificadas || []).includes(main.noticiasSha256)) motivos.push(motivo('NOTICIAS_AJENAS', 'main tiene unas noticias sin publicar que no son de una mañana verificada',
      'Publica o retira esas noticias; la mañana no las pisa.'));
    else avisos.push('Las noticias de una mañana anterior estaban unidas sin publicar: hoy salen las de hoy.');
  }

  if (!h.lecturaPublica) motivos.push(motivo('CATALOGO_SIN_LEER', 'no pude leer el catálogo publicado como visitante', 'Se vuelve a intentar mañana.'));
  else if (JSON.stringify(h.lecturaPublica.revision) !== JSON.stringify([main.revisionCatalogo])) {
    motivos.push(motivo('CATALOGO_A_MEDIAS', `el catálogo publicado (${String(h.lecturaPublica.revision).slice(0, 8)}) no es el de main (${String(main.revisionCatalogo).slice(0, 8)})`,
      'Termina el ciclo del catálogo (sincronizar, sello y publicar).'));
  }

  const bloqueos = h.auditoria?.bloqueos || [];
  const maxDias = h.config?.selloHumanoMaxDias ?? 7;
  const edad = esFecha(main.estadoActualizadoEl) ? diasEntre(main.estadoActualizadoEl, hoy) : null;
  if (bloqueos.some(b => b.codigo === 'MANIFIESTO_CADUCADO') || (edad !== null && edad > maxDias)) {
    motivos.push(motivo('SELLO_HUMANO_CADUCADO', `el último sello revisado por una persona es del ${main.estadoActualizadoEl ? ddmmaaaa(main.estadoActualizadoEl) : '?'} (más de ${maxDias} días)`,
      'Haz un sello revisado (un ciclo del catálogo o sellar.cjs con lo que revisaste) y la mañana volverá a publicar.'));
  } else if (edad !== null && edad >= maxDias - 1) {
    avisos.push(`El sello revisado por una persona caduca el ${ddmmaaaa(sumarDias(main.estadoActualizadoEl, maxDias))}: después, la mañana se parará.`);
  }
  const otrosBloqueos = bloqueos.filter(b => b.codigo !== 'MANIFIESTO_CADUCADO');
  if (!h.auditoria) motivos.push(motivo('COMPUERTA_SIN_PASAR', 'no pude pasar la compuerta sobre main', 'Mira el registro de la sesión.'));
  else if (otrosBloqueos.length) motivos.push(motivo('COMPUERTA_MAIN', `main no pasa la compuerta de publicación (${otrosBloqueos.map(b => b.codigo).join(', ')})`,
    otrosBloqueos.some(b => b.codigo === 'CONTENIDO_NO_APROBADO') ? 'main tiene cambios sin sellar: séllalos y publícalos, o la mañana seguirá parada.' : 'Revisa la compuerta de main.'));

  const libre = motivos.length === 0;
  const diasSinNoticias = esFecha(prod.noticiasActualizadoEl) ? diasEntre(prod.noticiasActualizadoEl, hoy) : null;
  return { version: 1, hoy, libre, avisar: motivos.some(m => m.avisar), motivos, avisos, cerrarPRs, diasSinNoticias,
    mainSha: main.sha || null, publicadoSha: h.publicado?.sha || null };
}

/* La primera línea de un día sin hacer nada (lo que llega al móvil). */
export function lineaSinHacerNada(decision) {
  const m = decision.motivos[0];
  const seguidos = decision.diasSinNoticias >= 2 ? ` Van ${decision.diasSinNoticias} días sin noticias nuevas.` : '';
  return `Noticias ${ddmm(decision.hoy)}: no hice nada · ${m.texto}. ${m.accion}${seguidos}`.replace(/\s+/g, ' ').trim();
}

/* ---- Recogida de hechos ---- */
export function leerLecturaPublica(dir) {
  try {
    const texto = fs.readFileSync(path.join(dir, 'hora-lectura.txt'), 'utf8');
    const m = /^Resultado: (\{.*\})$/m.exec(texto);
    return m ? JSON.parse(m[1]) : null;
  } catch { return null; }
}
export function ultimaPublicacion(publicaciones) {
  const buenas = (publicaciones || []).filter(p => p.destino === 'produccion' && p.conclusion === 'success' && /^[0-9a-f]{40}$/.test(String(p.head_sha)));
  buenas.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return buenas[0] ? { sha: buenas[0].head_sha, creado: buenas[0].created_at, inicio: buenas[0].started_at || buenas[0].created_at } : null;
}
const revisionDe = texto => (/"revisionId":"([0-9a-f-]{36})"/.exec(String(texto)) || [])[1] || null;
const mostrar = (cwd, ref, rel) => { const r = git(['show', `${ref}:${rel}`], { cwd, permitir: [0, 128] }); return r.codigo === 0 ? r.salida : null; };

/* Las ediciones de noticias-diarias/ en «ref» con su verificación conforme (por SHA-256 de la edición). */
export function noticiasVerificadasEn(cwd, ref) {
  const lista = git(['ls-tree', '--name-only', `${ref}:${RUTAS.diarias}`], { cwd, permitir: [0, 128] });
  if (lista.codigo !== 0) return [];
  const salida = [];
  for (const dia of lista.salida.split('\n').map(x => x.trim()).filter(x => /^\d{4}-\d{2}-\d{2}$/.test(x))) {
    const base = `${RUTAS.diarias}/${dia}`;
    const edicion = git(['show', `${ref}:${base}/${nombreEdicion(dia)}`], { cwd, permitir: [0, 128] });
    if (edicion.codigo !== 0) continue;
    const bytes = Buffer.from(edicion.salida, 'utf8');
    const dos = mostrar(cwd, ref, `${base}/verificacion-2.json`);
    const texto = dos ?? mostrar(cwd, ref, `${base}/verificacion.json`);
    try {
      const ids = JSON.parse(edicion.salida).noticias.map(n => n.id);
      if (!comprobarConforme(JSON.parse(texto), { bytes, ids, pase: dos ? 2 : 1, fecha: dia }).length) salida.push(sha256(bytes));
    } catch { /* sin verificación válida: no cuenta */ }
  }
  return salida;
}

/* Una copia aparte de «ref» (git worktree) con las dependencias enlazadas.
   rwadar-app/node_modules es una carpeta de verdad con un enlace por paquete:
   un enlace con ese nombre no lo ignora Git y ensuciaría el árbol. */
export function prepararCopia({ cwd, ref, destino }) {
  fs.rmSync(destino, { recursive: true, force: true });
  git(['worktree', 'prune'], { cwd, permitir: [0, 128] });
  git(['worktree', 'add', '--detach', '--force', destino, ref], { cwd });
  const raizMods = path.join(cwd, 'node_modules');
  if (fs.existsSync(raizMods)) fs.symlinkSync(raizMods, path.join(destino, 'node_modules'), 'dir');
  const appMods = path.join(cwd, 'rwadar-app', 'node_modules');
  if (fs.existsSync(appMods)) {
    const dentro = path.join(destino, 'rwadar-app', 'node_modules');
    fs.mkdirSync(dentro, { recursive: true });
    for (const e of fs.readdirSync(appMods)) fs.symlinkSync(path.join(appMods, e), path.join(dentro, e));
  }
  return destino;
}
/* Construye la copia con el reloj dado y devuelve su rwadar-publicado/. */
export function construirCopia({ destino, reloj, tokenizacion }) {
  const env = { ...process.env, RWADAR_NOTICIAS_RELOJ: reloj || '' };
  for (const [clave, ruta] of Object.entries(tokenizacion || {})) if (ruta) env[clave] = ruta;
  const r = spawnSync(process.execPath, ['-r', path.join(DIR_SKILL, 'lib', 'reloj.cjs'), 'rwadar-publicar.js', '--local', '--sin-sincronizar'],
    { cwd: destino, env, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`no se pudo construir la copia: ${(r.stderr || r.stdout).trim().split('\n').slice(-3).join(' | ')}`);
  return path.join(destino, 'rwadar-publicado');
}
export function quitarCopia(cwd, destino) {
  git(['worktree', 'remove', '--force', destino], { cwd, permitir: [0, 128] });
  fs.rmSync(destino, { recursive: true, force: true });
  git(['worktree', 'prune'], { cwd, permitir: [0, 128] });
}
export function auditarEn(dir) {
  const r = spawnSync(process.execPath, ['rwadar-app/auditar-relanzamiento.mjs'], { cwd: dir, encoding: 'utf8' });
  const bloqueos = [...String(r.stdout).matchAll(/^- \[([A-Z_]+)\] (.*)$/gm)].map(m => ({ codigo: m[1], mensaje: m[2] }));
  if (r.status !== 0 && !bloqueos.length) bloqueos.push({ codigo: 'AUDITORIA_FALLIDA', mensaje: (r.stderr || r.stdout).trim().slice(0, 300) });
  return { publicable: r.status === 0, bloqueos };
}

export async function recogerHechos({ raiz, hoy, config, entradas, trabajo, base, pedir = fetch, publicadoDado = null, construir = true }) {
  const h = { hoy, config: { activo: config.activo, selloHumanoMaxDias: config.selloHumanoMaxDias } };
  const { RUTAS_CONTENIDO_APROBADO } = require(path.join(raiz, 'rwadar-publicacion-segura.js'));
  h.rutasSelladas = [...RUTAS_CONTENIDO_APROBADO];
  const ramasDadas = leerJSONSiHay(path.join(entradas, 'ramas.json'));
  h.ramasCerrojo = ramasDadas || git(['ls-remote', '--heads', 'origin', 'refs/heads/claude/cerrojo-ciclo-*'], { cwd: raiz }).salida
    .split('\n').map(l => l.split('\t')[1]).filter(Boolean).map(r => r.replace(/^refs\/heads\//, ''));
  const prs = leerJSONSiHay(path.join(entradas, 'prs.json'));
  const ejecuciones = leerJSONSiHay(path.join(entradas, 'ejecuciones.json'));
  const publicaciones = leerJSONSiHay(path.join(entradas, 'publicaciones.json'));
  h.github = Array.isArray(prs) && Array.isArray(ejecuciones) && Array.isArray(publicaciones);
  h.prs = prs || []; h.ejecuciones = ejecuciones || [];
  h.publicado = ultimaPublicacion(publicaciones);
  const mainSha = gitTexto(['rev-parse', 'origin/main'], { cwd: raiz });
  const v2Main = mostrar(raiz, mainSha, RUTAS.v2);
  const estadoMain = JSON.parse(mostrar(raiz, mainSha, RUTAS.sello) || '{}');
  h.main = { sha: mainSha, noticiasSha256: v2Main ? sha256(Buffer.from(v2Main, 'utf8')) : null,
    noticiasActualizadoEl: (() => { try { return JSON.parse(v2Main).actualizadoEl; } catch { return null; } })(),
    estadoActualizadoEl: estadoMain.actualizadoEl || null, revisionCatalogo: revisionDe(mostrar(raiz, mainSha, RUTAS.catalogo)) };
  // Producción: las noticias que sirve (bytes) y su fecha.
  try {
    const r = await pedir(base.replace(/\/$/, '') + '/datos/noticias-v2.json', { cache: 'no-store', signal: AbortSignal.timeout(30000) });
    const bytes = Buffer.from(await r.arrayBuffer());
    if (r.status === 200) {
      h.produccion = { noticiasSha256: sha256(bytes), noticiasActualizadoEl: JSON.parse(bytes.toString('utf8')).actualizadoEl };
      fs.mkdirSync(path.join(trabajo, 'cerrojo'), { recursive: true });
      fs.writeFileSync(path.join(trabajo, 'cerrojo', 'produccion-noticias-v2.json'), bytes);
    } else h.produccion = {};
  } catch { h.produccion = {}; }
  h.lecturaPublica = leerLecturaPublica(path.join(entradas, 'lectura-publica'));
  h.noticiasVerificadas = noticiasVerificadasEn(raiz, mainSha);
  if (h.publicado) {
    try { h.cambiosSellados = cambiosSelladosDesde({ publicado: h.publicado.sha, main: mainSha, cwd: raiz }); }
    catch { h.cambiosSellados = { ancestro: false, cambios: null }; }
  }
  // Construir main (con el reloj de la última publicación) y comparar con producción; y la compuerta sobre main.
  const copia = path.join(trabajo, 'construccion');
  try {
    let publicadoDir = publicadoDado;
    if (construir) {
      const tokenizacion = {};
      for (const [clave, archivo] of [['RWADAR_TOKENIZACION_HISTORICO', 'tokenizacion-historico.json'], ['RWADAR_TOKENIZACION_SERIE', 'tokenizacion-serie.json'],
        ['RWADAR_TOKENIZACION_SERIE_FINA', 'tokenizacion-serie-fina.json']]) {
        const r = git(['show', `origin/datos-tokenizacion:${archivo}`], { cwd: raiz, permitir: [0, 128] });
        if (r.codigo === 0) { const ruta = path.join(trabajo, 'cerrojo', archivo); fs.mkdirSync(path.dirname(ruta), { recursive: true }); fs.writeFileSync(ruta, r.salida); tokenizacion[clave] = ruta; }
      }
      prepararCopia({ cwd: raiz, ref: mainSha, destino: copia });
      h.auditoria = auditarEn(copia); // antes de construir: la construcción puede tocar archivos versionados
      publicadoDir = construirCopia({ destino: copia, reloj: h.publicado?.inicio?.replace(/\.\d+Z$/, 'Z'), tokenizacion });
    }
    if (publicadoDir) h.comparacion = await compararArchivos({ publicado: publicadoDir, base, pedir });
  } catch (e) {
    h.errorConstruccion = e.message;
  } finally {
    if (construir) quitarCopia(raiz, copia);
  }
  return h;
}

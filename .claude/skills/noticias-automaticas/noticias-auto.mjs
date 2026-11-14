#!/usr/bin/env node
// =====================================================================
// RWAdar · noticias del sector automáticas: el programa (sin agentes)
// ---------------------------------------------------------------------
// Lo usa la skill noticias-automaticas (SKILL.md) cada mañana. Cada orden
// es un paso determinista; los agentes (editor y verificador) solo escriben
// archivos que estas órdenes juzgan.
//
//   node .claude/skills/noticias-automaticas/noticias-auto.mjs <orden> [--fecha AAAA-MM-DD] [--trabajo DIR] …
//
// Códigos de salida: 0 sigue · 3 no hago nada (cerrojo, pausa o sin cambios)
// · 4 FRENO (no se publica nada) · 5 hace falta corregir y un segundo pase
// del verificador (solo «decidir») · 2 uso incorrecto · otro: error = freno.
//
// Órdenes (en el orden de la mañana): config, iniciar, cerrojo, barrido,
// encargo, comprobar-fuentes, validar, decidir, corregir, preparar, pruebas,
// sellar, comprobar-sello, antes-de-unir, comprobar-ejecucion,
// comprobar-vivo, resumen. Y además: volver (vuelta atrás, con orden de la
// dirección). Detalle de cada una: SKILL.md.
//
// La carpeta de trabajo (--trabajo, por defecto ${TMPDIR}/rwadar-noticias-<fecha>)
// está FUERA del repositorio: copias en bruto, entradas del cerrojo y lo que
// escriben los agentes. A Git solo llega lo que copia «preparar».
// =====================================================================
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { RAIZ_REPO, DIR_SKILL, RUTAS, SALIDA, Freno, Nada, sha256, leerJSON, leerJSONSiHay, escribirJSON, fechaEspana, horaEspana, esFecha,
  sumarDias, carpetaTrabajo, cargarConfig, leerArgumentos, gitTexto, listarArchivos } from './lib/comun.mjs';
import { validarEdicion, nombreEdicion, carpetaDelDia, ARCHIVOS_CARPETA } from './lib/validar.mjs';
import { recogerHechos, decidirCerrojo, lineaSinHacerNada, leerLecturaPublica } from './lib/cerrojo.mjs';
import { barrer, comprobarFuentes } from './lib/barrido.mjs';
import { decidir, corregir, sellar, simularUnion, antesDeUnir, comprobarEjecucion, comprobarVivo, volver, primeraLinea, hayQueAvisar } from './lib/flujo.mjs';

const require = createRequire(import.meta.url);
export const CORREGIR = 5;

/* ---- Rutas dentro de la carpeta de trabajo ---- */
export const T = Object.freeze({
  cerrojo: t => path.join(t, 'cerrojo'),
  decisionCerrojo: t => path.join(t, 'cerrojo.json'),
  hechos: t => path.join(t, 'cerrojo', 'hechos.json'),
  produccion: t => path.join(t, 'cerrojo', 'produccion-noticias-v2.json'),
  barrido: t => path.join(t, 'barrido'),
  editor: t => path.join(t, 'editor'),
  fuentes: t => path.join(t, 'fuentes'),
  verificador: (t, pase = 1) => path.join(t, pase === 2 ? 'verificador-2' : 'verificador'),
  corregido: t => path.join(t, 'corregido'),
  diario: t => path.join(t, 'diario.jsonl'),
});
const nombreVerificacion = pase => (pase === 2 ? 'verificacion-2.json' : 'verificacion.json');
const nombreInforme = pase => (pase === 2 ? 'VERIFICACION-2.md' : 'VERIFICACION.md');

function contexto(args) {
  const raiz = path.resolve(args.raiz || RAIZ_REPO);
  const fecha = args.fecha || fechaEspana();
  if (!esFecha(fecha)) throw new Error(`--fecha no es AAAA-MM-DD: ${fecha}`);
  const trabajo = carpetaTrabajo(fecha, args.trabajo);
  const config = cargarConfig(args.config ? path.resolve(args.config) : path.join(DIR_SKILL, 'config.json'));
  return { raiz, fecha, trabajo, config, base: args.base || 'origin/main' };
}
const requerido = (args, clave) => { if (args[clave] === undefined || args[clave] === true) throw new Error(`falta --${clave}`); return args[clave]; };

/* ¿Qué edición vale ahora? La corregida si hubo correcciones (y entonces el pase 2). */
function edicionActual(t, fecha) {
  const corr = path.join(T.corregido(t), nombreEdicion(fecha));
  if (fs.existsSync(corr)) return { dir: T.corregido(t), ruta: corr, pase: 2 };
  return { dir: T.editor(t), ruta: path.join(T.editor(t), nombreEdicion(fecha)), pase: 1 };
}

/* ======================= Órdenes ======================= */
const ORDENES = {
  /* La pausa: «activo»: false → 3. */
  config(args) {
    const { config } = contexto(args);
    if (!config.activo) throw new Nada('la mañana está en pausa («activo»: false en config.json)');
    return { mensaje: `config.json bien: activo, titulares de ${config.titulares.maxCaracteres} como mucho, ${config.titulares.propuestasMin} propuestas`, datos: config };
  },

  /* Prepara la carpeta de trabajo y la de notas del editor (nombre aleatorio,
     fuera de la de trabajo: el encargo del verificador no la nombra). */
  iniciar(args) {
    const { fecha, trabajo } = contexto(args);
    for (const d of [T.cerrojo(trabajo), T.barrido(trabajo), T.editor(trabajo), T.fuentes(trabajo), T.verificador(trabajo, 1), T.verificador(trabajo, 2)]) fs.mkdirSync(d, { recursive: true });
    const notas = args.notas ? path.resolve(args.notas) : fs.mkdtempSync(path.join(os.tmpdir(), `rwadar-${crypto.randomBytes(6).toString('hex')}-`));
    fs.mkdirSync(notas, { recursive: true });
    return { mensaje: `Carpeta de trabajo: ${trabajo}\nNotas del editor (apúntala; no se la digas al verificador): ${notas}`, datos: { fecha, trabajo, notas } };
  },

  /* El cerrojo: ¿se puede trabajar hoy? (salida 3 si no). */
  async cerrojo(args) {
    const { raiz, fecha, trabajo, config } = contexto(args);
    const base = args.base || config.produccion;
    fs.mkdirSync(T.cerrojo(trabajo), { recursive: true });
    let hechos;
    if (args.rapido) {
      // Repaso antes del push: lo que puede cambiar en minutos (PR, ejecuciones,
      // ramas de cerrojo, producción y main). Lo demás, del primer pase.
      const antes = leerJSON(T.hechos(trabajo));
      const mainAhora = gitTexto(['rev-parse', 'origin/main'], { cwd: raiz });
      if (mainAhora !== antes.main.sha) throw new Nada(`main cambió durante la mañana (${antes.main.sha.slice(0, 7)} → ${mainAhora.slice(0, 7)}): otro trabajo en marcha`);
      const nuevos = await recogerHechos({ raiz, hoy: fecha, config, entradas: T.cerrojo(trabajo), trabajo, base, construir: false });
      hechos = { ...nuevos, comparacion: antes.comparacion, auditoria: antes.auditoria, lecturaPublica: antes.lecturaPublica, cambiosSellados: antes.cambiosSellados };
    } else {
      hechos = await recogerHechos({ raiz, hoy: fecha, config, entradas: T.cerrojo(trabajo), trabajo, base });
    }
    escribirJSON(T.hechos(trabajo), hechos);
    const decision = decidirCerrojo(hechos);
    escribirJSON(T.decisionCerrojo(trabajo), decision);
    const extra = [...decision.avisos.map(a => `Aviso: ${a}`), ...decision.cerrarPRs.map(n => `Cierra con un comentario el PR #${n} (mañana anterior sin terminar).`)];
    if (hechos.errorConstruccion) extra.push(`No se pudo construir main: ${hechos.errorConstruccion}`);
    if (!decision.libre) {
      throw new Nada(lineaSinHacerNada(decision), [...decision.motivos.map(m => `${m.codigo}: ${m.texto} → ${m.accion}`), ...extra]);
    }
    return { mensaje: `Cerrojo libre${args.rapido ? ' (repaso)' : ''}: main ${decision.mainSha.slice(0, 7)} es lo publicado.${extra.length ? '\n' + extra.join('\n') : ''}`, datos: decision };
  },

  /* El barrido de la lista cerrada de fuentes y de las fuentes publicadas. */
  async barrido(args) {
    const { raiz, fecha, trabajo } = contexto(args);
    const lista = leerJSON(args.fuentes ? path.resolve(args.fuentes) : path.join(DIR_SKILL, 'fuentes-barrido.json')).fuentes;
    const referencia = leerJSONSiHay(args.referencia ? path.resolve(args.referencia) : T.produccion(trabajo));
    if (!referencia) throw new Freno('barrido', 'falta la edición publicada (la deja el cerrojo en cerrojo/produccion-noticias-v2.json)');
    // Huellas de la última carpeta automática (para «cambia» e «igualQuePublicada»).
    const huellas = new Map();
    const anterior = ultimaCarpeta(raiz, fecha);
    if (anterior) {
      const b = leerJSONSiHay(path.join(anterior.ruta, 'barrido.json'));
      for (const f of b?.fuentes || []) if (f.sha256) huellas.set(f.id, f.sha256);
      const inv = leerJSONSiHay(path.join(anterior.ruta, 'inventario-fuentes.json'));
      for (const f of inv?.fuentes || []) if (f.sha256) huellas.set(f.url, f.sha256);
    }
    const opciones = args.rapido ? { separacionMs: 0, esperaBaseMs: 10, plazoMs: 5000 } : {};
    const salida = await barrer({ fecha, ayer: sumarDias(fecha, -1), fuentes: lista, referencia, huellasAnteriores: huellas, crudo: path.join(T.barrido(trabajo), 'crudo'), opciones });
    escribirJSON(path.join(T.barrido(trabajo), 'barrido.json'), salida);
    const nuevos = salida.fuentes.reduce((s, f) => s + f.nuevos.length, 0);
    if (salida.criticasCaidas.length) {
      throw new Freno('barrido', `fuente caída: ${salida.criticasCaidas.join(', ')} no se pudo leer`, salida.caidas.map(c => `${c.id}: ${c.motivo}`));
    }
    return { mensaje: `Barrido: ${salida.fuentes.length} fuentes, ${nuevos} elementos nuevos del sector desde el ${salida.desde}; caídas no críticas: ${salida.caidas.map(c => c.id).join(', ') || 'ninguna'}. Fuentes de las noticias publicadas: ${salida.deNoticias.filter(d => d.http === 200).length}/${salida.deNoticias.length} responden.`, datos: { nuevos, caidas: salida.caidas } };
  },

  /* El encargo literal de cada agente (plantillas de EDITOR.md y VERIFICADOR.md):
     solo se sustituyen rutas. El del verificador nunca nombra las notas. */
  encargo(args) {
    const { raiz, fecha, trabajo } = contexto(args);
    const rol = requerido(args, 'rol');
    const texto = encargo({ rol, raiz, fecha, trabajo, notas: args.notas });
    return { mensaje: texto, datos: { rol } };
  },

  /* El programa abre cada fuente de la edición candidata (V-12 se juzga con esto). */
  async 'comprobar-fuentes'(args) {
    const { fecha, trabajo } = contexto(args);
    const ed = args.edicion ? { ruta: path.resolve(args.edicion) } : edicionActual(trabajo, fecha);
    const edicion = leerJSON(ed.ruta);
    const opciones = args.rapido ? { separacionMs: 0, esperaBaseMs: 10, plazoMs: 5000 } : {};
    const inv = await comprobarFuentes({ fecha, edicion, crudo: path.join(T.fuentes(trabajo), 'crudo'), opciones });
    escribirJSON(path.join(T.fuentes(trabajo), 'inventario-fuentes.json'), inv);
    const mal = inv.fuentes.filter(f => f.http !== 200);
    return { mensaje: `Fuentes de la edición: ${inv.fuentes.length - mal.length}/${inv.fuentes.length} responden${mal.length ? ` (no: ${mal.map(f => `${f.url} → ${f.error || f.http}`).join('; ')})` : ''}.`, datos: inv };
  },

  /* Las reglas V-1 … V-16. */
  validar(args) {
    const { raiz, fecha, trabajo, config, base } = contexto(args);
    if (args.publicada) return validarPublicada({ raiz, config });
    const fase = requerido(args, 'fase');
    const referencia = leerJSONSiHay(args.referencia ? path.resolve(args.referencia) : T.produccion(trabajo));
    let r;
    if (fase === 'editor' || fase === 'corregido') {
      const dir = fase === 'editor' ? T.editor(trabajo) : T.corregido(trabajo);
      r = validarEdicion({ fase: 'editor', fecha, raiz, config, edicionRuta: path.join(dir, nombreEdicion(fecha)), titularesRuta: path.join(dir, 'titulares.json'),
        inventario: leerJSONSiHay(path.join(T.fuentes(trabajo), 'inventario-fuentes.json')), referencia });
      escribirJSON(path.join(trabajo, `validacion-${fase}.json`), r);
    } else if (fase === 'final') {
      const carpeta = path.join(raiz, carpetaDelDia(fecha));
      r = validarEdicion({ fase: 'final', fecha, raiz, config, carpeta, base, conSello: Boolean(args['con-sello']), edicionRuta: path.join(carpeta, nombreEdicion(fecha)),
        titularesRuta: path.join(carpeta, 'titulares.json'), inventario: leerJSONSiHay(path.join(carpeta, 'inventario-fuentes.json')), referencia });
    } else throw new Error('--fase es editor, corregido o final (o --publicada)');
    if (r.errores.length) throw new Freno('validador', `${r.errores.length} regla(s) no se cumplen: ${r.errores[0]}`, r.errores);
    return { mensaje: `Validación (${fase}): ${r.reglas.length} reglas bien.${r.soloCambianFechas ? ' Solo cambian las fechas frente a lo publicado.' : ''}`, datos: r };
  },

  /* El veredicto del verificador: 0 preparar · 5 corregir · 4 freno. */
  decidir(args) {
    const { fecha, trabajo } = contexto(args);
    const pase = Number(args.pase || 1);
    const ed = pase === 2 ? path.join(T.corregido(trabajo), nombreEdicion(fecha)) : path.join(T.editor(trabajo), nombreEdicion(fecha));
    if (!fs.existsSync(ed)) throw new Freno('verificador', `falta la edición que se verificó (${path.basename(path.dirname(ed))}/)`);
    const bytes = fs.readFileSync(ed);
    const rutaVer = path.join(T.verificador(trabajo, pase), nombreVerificacion(pase));
    let verificacion = null;
    try { verificacion = leerJSON(rutaVer); } catch { verificacion = null; }
    if (!fs.existsSync(path.join(T.verificador(trabajo, pase), nombreInforme(pase)))) throw new Freno('verificador', `falta ${nombreInforme(pase)} del verificador`);
    const ids = JSON.parse(bytes.toString('utf8')).noticias.map(n => n.id);
    const d = decidir({ verificacion, bytes, ids, fecha, pase });
    if (d.siguiente === 'corregir') return { codigo: CORREGIR, mensaje: `El verificador pide cambios (${d.motivo}): corregir, validar y segundo pase.`, datos: d };
    return { mensaje: `Verificación ${pase === 2 ? '(segundo pase) ' : ''}conforme: se puede preparar.`, datos: d };
  },

  /* Aplica las correcciones del verificador, y nada más. */
  corregir(args) {
    const { fecha, trabajo } = contexto(args);
    const rutaVer = path.join(T.verificador(trabajo, 1), 'verificacion.json');
    const verificacionBytes = fs.readFileSync(rutaVer);
    const r = corregir({ edicion: leerJSON(path.join(T.editor(trabajo), nombreEdicion(fecha))), titulares: leerJSON(path.join(T.editor(trabajo), 'titulares.json')),
      verificacion: JSON.parse(verificacionBytes.toString('utf8')), verificacionBytes });
    fs.mkdirSync(T.corregido(trabajo), { recursive: true });
    escribirJSON(path.join(T.corregido(trabajo), nombreEdicion(fecha)), r.edicion);
    escribirJSON(path.join(T.corregido(trabajo), 'titulares.json'), r.titulares);
    escribirJSON(path.join(T.corregido(trabajo), 'correcciones.json'), r.registro);
    return { mensaje: `Correcciones aplicadas: ${r.registro.aplicadas.length}. Ahora: validar --fase corregido y segundo pase del verificador.`, datos: r.registro };
  },

  /* La carpeta del día en el repositorio y las dos copias publicadas. */
  preparar(args) {
    const { raiz, fecha, trabajo, config } = contexto(args);
    const notas = path.resolve(requerido(args, 'notas'));
    const ed = edicionActual(trabajo, fecha);
    const bytes = fs.readFileSync(ed.ruta);
    const ids = JSON.parse(bytes.toString('utf8')).noticias.map(n => n.id);
    // El veredicto otra vez, aquí mismo: sin «conforme» sobre estos bytes no se prepara nada.
    decidir({ verificacion: leerJSONSiHay(path.join(T.verificador(trabajo, ed.pase), nombreVerificacion(ed.pase))), bytes, ids, fecha, pase: ed.pase });
    const referencia = leerJSONSiHay(T.produccion(trabajo));
    const edicion = JSON.parse(bytes.toString('utf8'));
    const { soloCambianFechas } = validarEdicion({ fase: 'editor', fecha, raiz, config, edicionRuta: ed.ruta, titularesRuta: path.join(ed.dir, 'titulares.json'),
      inventario: leerJSONSiHay(path.join(T.fuentes(trabajo), 'inventario-fuentes.json')), referencia });
    if (soloCambianFechas && !config.publicarSiSoloCambianFechas) throw new Nada('SIN_CAMBIOS: solo cambian las fechas y config.json dice no publicar esos días');
    const carpeta = path.join(raiz, carpetaDelDia(fecha));
    if (fs.existsSync(carpeta)) throw new Freno('preparar', `ya existe ${carpetaDelDia(fecha)} (¿otra mañana de hoy?)`);
    fs.mkdirSync(carpeta, { recursive: true });
    const copiar = (origen, nombre) => fs.copyFileSync(origen, path.join(carpeta, nombre));
    fs.writeFileSync(path.join(carpeta, nombreEdicion(fecha)), bytes);
    copiar(path.join(ed.dir, 'titulares.json'), 'titulares.json');
    copiar(path.join(T.barrido(trabajo), 'barrido.json'), 'barrido.json');
    copiar(path.join(T.fuentes(trabajo), 'inventario-fuentes.json'), 'inventario-fuentes.json');
    copiar(path.join(T.verificador(trabajo, 1), 'verificacion.json'), 'verificacion.json');
    copiar(path.join(T.verificador(trabajo, 1), 'VERIFICACION.md'), 'VERIFICACION.md');
    if (ed.pase === 2) {
      copiar(path.join(T.verificador(trabajo, 2), 'verificacion-2.json'), 'verificacion-2.json');
      copiar(path.join(T.verificador(trabajo, 2), 'VERIFICACION-2.md'), 'VERIFICACION-2.md');
      copiar(path.join(T.corregido(trabajo), 'correcciones.json'), 'correcciones.json');
    }
    // Las notas del editor, solo ahora (el verificador ya terminó).
    if (!fs.existsSync(path.join(notas, 'EDICION.md'))) throw new Freno('preparar', 'falta EDICION.md en las notas del editor');
    copiar(path.join(notas, 'EDICION.md'), 'EDICION.md');
    if (fs.existsSync(path.join(notas, 'inventario-consultas.txt'))) copiar(path.join(notas, 'inventario-consultas.txt'), 'inventario-consultas.txt');
    fs.writeFileSync(path.join(raiz, RUTAS.v2), bytes);
    const v1 = cargarV1(raiz).derivarV1(bytes.toString('utf8'));
    fs.writeFileSync(path.join(raiz, RUTAS.v1), v1);
    const r = validarEdicion({ fase: 'final', fecha, raiz, config, carpeta, base: args.base || 'origin/main', edicionRuta: path.join(carpeta, nombreEdicion(fecha)),
      titularesRuta: path.join(carpeta, 'titulares.json'), inventario: leerJSON(path.join(carpeta, 'inventario-fuentes.json')), referencia });
    if (r.errores.length) throw new Freno('preparar', `la carpeta del día no pasa: ${r.errores[0]}`, r.errores);
    escribirJSON(path.join(carpeta, 'validacion.json'), { version: 1, fase: 'final', fecha, edicionSha256: r.edicionSha256, reglas: r.reglas.map(x => ({ id: x.id, ok: x.ok })) });
    const hoy = edicion.noticias.filter(n => n.seccion === 'hoy').length;
    return { mensaje: `Preparado: ${carpetaDelDia(fecha)}/ y las dos copias de rwadar-site/datos/ (${edicion.noticias.length} noticias, ${hoy} de hoy). Haz el commit de las noticias.`, datos: { noticias: ids, hoy, edicionSha256: r.edicionSha256 } };
  },

  /* Las pruebas locales de la edición, como la CI, y gitleaks sobre la carpeta. */
  pruebas(args) {
    const { raiz, fecha } = contexto(args);
    const gitleaks = path.resolve(requerido(args, 'gitleaks'));
    const ordenes = [
      ['node', ['rwadar-noticias-editoriales.js', '--comprobar']],
      ['node', ['rwadar-app/noticias/noticias-v1.cjs', '--comprobar']],
      ['npm', ['run', 'test:web']],
      ['node', ['--test', 'rwadar-acceso/noticias-sector.test.mjs']],
      ['node', ['--test', 'rwadar-movil/tests/noticias-sector.test.cjs']],
      ['node', [path.join(DIR_SKILL, 'noticias-auto.mjs'), 'validar', '--publicada', '--raiz', raiz]],
      [gitleaks, ['dir', carpetaDelDia(fecha), '--config', 'rwadar-app/gitleaks.toml', '--redact=100', '--no-banner', '--no-color']],
      [gitleaks, ['dir', 'rwadar-site/datos', '--config', 'rwadar-app/gitleaks.toml', '--redact=100', '--no-banner', '--no-color']],
    ];
    const tiempos = [];
    for (const [cmd, a] of ordenes) {
      const inicio = Date.now();
      const r = spawnSync(cmd, a, { cwd: raiz, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      tiempos.push(`${((Date.now() - inicio) / 1000).toFixed(1)} s  ${path.basename(cmd)} ${a.join(' ')}`);
      if (r.status !== 0) throw new Freno('pruebas', `falla «${path.basename(cmd)} ${a.join(' ')}»`, String(r.stdout + r.stderr).trim().split('\n').slice(-12));
    }
    return { mensaje: `Pruebas locales bien:\n${tiempos.join('\n')}` };
  },

  /* El sello automático (sin tocar «actualizadoEl»). */
  sellar(args) {
    const { raiz, fecha, trabajo, base } = contexto(args);
    const revision = args.revision || leerJSONSiHay(T.hechos(trabajo))?.main?.revisionCatalogo;
    if (!revision) throw new Freno('sello', 'no sé la revisión del catálogo de main (falta el cerrojo de hoy)');
    const r = sellar({ raiz, fecha, base, revisionCatalogo: revision });
    return { mensaje: `Sello escrito (commit ${r.commit.slice(0, 7)}, ${r.contenidoSha256.slice(0, 19)}…). Haz el commit del sello (solo estado.json).`, datos: r };
  },

  /* Tras el commit del sello: la rama solo cambia lo permitido y la unión con «merge» deja main publicable. */
  'comprobar-sello'(args) {
    const { raiz, fecha, trabajo, config, base } = contexto(args);
    const carpeta = path.join(raiz, carpetaDelDia(fecha));
    const r = validarEdicion({ fase: 'final', fecha, raiz, config, carpeta, base, conSello: true, edicionRuta: path.join(carpeta, nombreEdicion(fecha)),
      titularesRuta: path.join(carpeta, 'titulares.json'), inventario: leerJSON(path.join(carpeta, 'inventario-fuentes.json')), referencia: leerJSONSiHay(T.produccion(trabajo)) });
    if (r.errores.length) throw new Freno('sello', r.errores[0], r.errores);
    const u = simularUnion({ raiz, base, modo: 'merge' });
    if (!u.listo) throw new Freno('sello', `la unión simulada no deja main publicable (${u.bloqueos.join(', ') || 'compuerta'})`, u.salida.split('\n'));
    return { mensaje: 'Sello bien: la rama solo cambia las noticias, su carpeta y el sello, y main + unión («merge») pasa la compuerta: LISTO.' };
  },

  /* Antes de unir el PR. */
  'antes-de-unir'(args) {
    const { fecha } = contexto(args);
    antesDeUnir({ fecha, pr: leerJSON(requerido(args, 'pr')), mainSha: requerido(args, 'main'), cabeza: requerido(args, 'cabeza'),
      archivos: leerJSON(requerido(args, 'archivos')), checks: leerJSON(requerido(args, 'checks')) });
    return { mensaje: 'Se puede unir: base = main, cabeza = sello, solo archivos permitidos y la CI en verde. Une con merge_method «merge» y expectedHeadSha.' };
  },

  'comprobar-ejecucion'(args) {
    comprobarEjecucion({ ejecucion: leerJSON(requerido(args, 'ejecucion')), union: requerido(args, 'union') });
    return { mensaje: 'La ejecución de «Publicar web» es la del commit de unión.' };
  },

  async 'comprobar-vivo'(args) {
    const { raiz } = contexto(args);
    const base = requerido(args, 'base');
    const r = await comprobarVivo({ base, raiz, intentos: Number(args.intentos || 6), esperaMs: Number(args.espera ?? 20) * 1000 });
    return { mensaje: `${base} sirve lo de main (${r.bien.length} comprobaciones, intento ${r.intentos}).`, datos: r };
  },

  /* El mensaje final y si hay que avisar. */
  resumen(args) {
    const { raiz, fecha, trabajo } = contexto(args);
    const estado = requerido(args, 'estado');
    const decision = leerJSONSiHay(T.decisionCerrojo(trabajo));
    const ed = fs.existsSync(path.join(raiz, carpetaDelDia(fecha), nombreEdicion(fecha))) ? leerJSON(path.join(raiz, carpetaDelDia(fecha), nombreEdicion(fecha)))
      : leerJSONSiHay(edicionActual(trabajo, fecha).ruta);
    const tit = leerJSONSiHay(path.join(raiz, carpetaDelDia(fecha), 'titulares.json')) || leerJSONSiHay(path.join(edicionActual(trabajo, fecha).dir, 'titulares.json'));
    const noticias = ed?.noticias || [];
    let motivo = args.motivo, accion = args.accion, avisarCerrojo = true;
    if (estado === 'SIN_HACER_NADA' && decision && !decision.libre) {
      motivo = motivo || decision.motivos[0].texto; accion = accion || decision.motivos[0].accion; avisarCerrojo = decision.avisar;
    }
    const linea = primeraLinea({ fecha, estado, paso: args.paso, motivo, accion, noticias, hoyCuantas: noticias.filter(n => n.seccion === 'hoy').length, hora: horaEspana() });
    const cuerpo = [];
    if (noticias.length && ['PUBLICADO', 'ENSAYO', 'UNIDO_SIN_PUBLICAR', 'PUBLICADO_CON_AVISO', 'FRENADO'].includes(estado)) {
      cuerpo.push('', estado === 'FRENADO' ? 'Lo que se había preparado (no se ha publicado):' : 'Las noticias:');
      for (const n of noticias) cuerpo.push(`- ${n.seccion === 'hoy' ? 'Hoy' : 'Importante'} · ${n.titulo} (foto: ${n.imagen})`);
    }
    const faltan = (tit?.noticias || []).filter(t => t.foto?.encaje === 'generica').map(t => `- ${t.id}: ${t.foto.faltaria}`);
    if (faltan.length) cuerpo.push('', 'Fotos que faltan en la biblioteca (se usó la genérica):', ...faltan);
    const diario = fs.existsSync(T.diario(trabajo)) ? fs.readFileSync(T.diario(trabajo), 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
    const frenos = diario.filter(d => d.codigo === SALIDA.FRENO);
    if (frenos.length) cuerpo.push('', 'Qué frenó:', ...frenos.slice(-1).flatMap(d => [`- ${d.orden}: ${d.motivo}`, ...(d.detalle || []).slice(0, 8).map(x => `  · ${x}`)]));
    if (decision?.avisos?.length) cuerpo.push('', 'Avisos:', ...decision.avisos.map(a => `- ${a}`));
    if (args.minutos) cuerpo.push('', `Minutos de GitHub Actions gastados hoy: ${args.minutos}.`);
    const avisar = hayQueAvisar({ estado, avisarCerrojo });
    const texto = [linea, ...cuerpo, '', avisar ? 'AVISAR: sí (manda la notificación con la primera línea).' : 'AVISAR: no.'].join('\n');
    fs.mkdirSync(trabajo, { recursive: true });
    fs.writeFileSync(path.join(trabajo, 'resumen.txt'), texto + '\n');
    escribirJSON(path.join(trabajo, 'resumen.json'), { fecha, estado, primeraLinea: linea, avisar });
    return { mensaje: texto, datos: { primeraLinea: linea, avisar }, sinDiario: true };
  },

  /* Vuelta atrás (solo con orden de la dirección): pone en rwadar-site/datos/ la edición verificada de un día. */
  volver(args) {
    const { raiz } = contexto(args);
    const a = requerido(args, 'a');
    if (!esFecha(a)) throw new Error('--a debe ser AAAA-MM-DD');
    const r = volver({ raiz, a });
    return { mensaje: `rwadar-site/datos/ tiene ahora la edición del ${a} (${r.sha256.slice(0, 12)}…). Siguen PR, sello y «Publicar web», como siempre.` };
  },
};

/* noticias-v1.cjs es CommonJS: se carga con require. */
const cargarV1 = raiz => require(path.join(raiz, 'rwadar-app/noticias/noticias-v1.cjs'));

/* La última carpeta automática anterior a «fecha». */
export function ultimaCarpeta(raiz, fecha) {
  const dir = path.join(raiz, RUTAS.diarias);
  if (!fs.existsSync(dir)) return null;
  const dias = fs.readdirSync(dir).filter(d => esFecha(d) && d < fecha).sort();
  return dias.length ? { fecha: dias.at(-1), ruta: path.join(dir, dias.at(-1)) } : null;
}

/* validar --publicada (en npm test y en la CI): la carpeta cuya edición es la
   publicada en rwadar-site/datos/noticias-v2.json se vuelve a validar entera.
   Si la edición publicada no es automática (la hizo un ciclo manual), avisa y no falla. */
function validarPublicada({ raiz, config }) {
  const publicada = fs.readFileSync(path.join(raiz, RUTAS.v2));
  const dir = path.join(raiz, RUTAS.diarias);
  const dias = fs.existsSync(dir) ? fs.readdirSync(dir).filter(esFecha).sort() : [];
  const dia = dias.find(d => {
    const r = path.join(dir, d, nombreEdicion(d));
    return fs.existsSync(r) && fs.readFileSync(r).equals(publicada);
  });
  if (!dia) return { mensaje: `La edición publicada no es de una mañana automática (${dias.length} carpetas en ${RUTAS.diarias}/): nada que validar.` };
  const carpeta = path.join(dir, dia);
  const anterior = ultimaCarpeta(raiz, dia);
  const r = validarEdicion({ fase: 'publicada', fecha: dia, raiz, config, carpeta, edicionRuta: path.join(carpeta, nombreEdicion(dia)), titularesRuta: path.join(carpeta, 'titulares.json'),
    inventario: leerJSONSiHay(path.join(carpeta, 'inventario-fuentes.json')), referencia: anterior ? leerJSONSiHay(path.join(anterior.ruta, nombreEdicion(anterior.fecha))) : null });
  if (r.errores.length) throw new Freno('validador', `la edición publicada (${dia}) no pasa: ${r.errores[0]}`, r.errores);
  return { mensaje: `La edición publicada es la de la mañana del ${dia}: ${r.reglas.length} reglas bien.` };
}

/* ---- Encargos literales ---- */
const MARCA = /<!-- ENCARGO -->\n([\s\S]*?)\n<!-- \/ENCARGO -->/;
export function encargo({ rol, raiz, fecha, trabajo, notas }) {
  const archivo = rol === 'editor' ? 'EDITOR.md' : rol === 'verificador' || rol === 'verificador-2' ? 'VERIFICADOR.md' : null;
  if (!archivo) throw new Error('--rol es editor, verificador o verificador-2');
  const m = MARCA.exec(fs.readFileSync(path.join(DIR_SKILL, archivo), 'utf8'));
  if (!m) throw new Error(`${archivo} no tiene su bloque ENCARGO`);
  if (rol === 'editor' && !notas) throw new Error('el encargo del editor necesita --notas');
  const pase = rol === 'verificador-2' ? 2 : 1;
  const sustituir = {
    '{REPO}': raiz, '{FECHA}': fecha, '{TRABAJO}': trabajo, '{PASE}': String(pase),
    '{SALIDA_VERIFICADOR}': T.verificador(trabajo, pase), '{VERIFICACION}': nombreVerificacion(pase), '{INFORME}': nombreInforme(pase),
    '{EDICION}': pase === 2 ? path.join(T.corregido(trabajo), nombreEdicion(fecha)) : path.join(T.editor(trabajo), nombreEdicion(fecha)),
    '{TITULARES}': pase === 2 ? path.join(T.corregido(trabajo), 'titulares.json') : path.join(T.editor(trabajo), 'titulares.json'),
    '{CORRECCIONES}': pase === 2 ? path.join(T.corregido(trabajo), 'correcciones.json') + ' y ' + path.join(T.verificador(trabajo, 1), 'verificacion.json') : '(no hay: es el primer pase)',
  };
  if (rol === 'editor') sustituir['{NOTAS}'] = notas;
  let texto = m[1];
  for (const [k, v] of Object.entries(sustituir)) texto = texto.replaceAll(k, v);
  const sin = texto.match(/\{[A-Z_]+\}/g);
  if (sin) throw new Error(`el encargo de ${rol} tiene huecos sin rellenar: ${[...new Set(sin)].join(', ')}`);
  if (rol !== 'editor' && notas && texto.includes(notas)) throw new Error('el encargo del verificador no puede nombrar las notas del editor');
  return texto;
}

/* ======================= Principal ======================= */
export async function ejecutar(lista, { escribir = t => process.stdout.write(t), escribirError = t => process.stderr.write(t) } = {}) {
  const [orden, ...resto] = lista;
  const args = leerArgumentos(resto);
  if (!orden || !Object.hasOwn(ORDENES, orden)) {
    escribirError(`Uso: noticias-auto.mjs <${Object.keys(ORDENES).join(' | ')}> [--fecha AAAA-MM-DD] [--trabajo DIR] …\n`);
    return SALIDA.USO;
  }
  let trabajo = null;
  try { trabajo = carpetaTrabajo(args.fecha || fechaEspana(), args.trabajo); } catch { trabajo = null; }
  const anotar = entrada => {
    if (!trabajo || !fs.existsSync(trabajo)) return;
    fs.appendFileSync(T.diario(trabajo), JSON.stringify({ hora: new Date().toISOString(), orden, ...entrada }) + '\n');
  };
  try {
    const r = await ORDENES[orden](args);
    const codigo = r.codigo ?? SALIDA.SIGUE;
    escribir(r.mensaje + '\n');
    if (!r.sinDiario) anotar({ codigo, motivo: r.mensaje.split('\n')[0] });
    return codigo;
  } catch (e) {
    if (e instanceof Nada) {
      escribir(`NO HAGO NADA · ${e.motivo}\n${(e.detalle || []).map(d => `  · ${d}`).join('\n')}\n`);
      anotar({ codigo: SALIDA.NADA, motivo: e.motivo, detalle: e.detalle });
      return SALIDA.NADA;
    }
    if (e instanceof Freno) {
      escribir(`FRENO · ${e.paso}: ${e.motivo}\n${(e.detalle || []).map(d => `  · ${d}`).join('\n')}\n`);
      anotar({ codigo: SALIDA.FRENO, paso: e.paso, motivo: e.motivo, detalle: e.detalle });
      return SALIDA.FRENO;
    }
    escribirError(`ERROR (cuenta como freno) en «${orden}»: ${e.message}\n`);
    anotar({ codigo: 1, motivo: e.message });
    return 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await ejecutar(process.argv.slice(2));
}

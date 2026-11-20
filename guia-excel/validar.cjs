#!/usr/bin/env node
/* Validador determinista del contenido de la guía.
   Uso: node validar.cjs contenido/n1m1.json [más archivos...] [--arreglar]
   - Comprueba la estructura de cada módulo.
   - Ejecuta cada ejercicio de fórmula con el motor real (HyperFormula esES + motor.js):
     la solución debe pasar, las alternativas deben pasar, los errores típicos y la fórmula inicial deben fallar.
   - Calcula la respuesta de los «predice» (con --arreglar la escribe en el archivo).
   - Avisa de funciones mal escritas o en inglés dentro de los textos y de comas como separador.
   Sale con código 1 si hay ERRORES (los AVISOS no bloquean). */
'use strict';
const fs = require('fs');
const path = require('path');
const BASE = __dirname;
const HFmod = require(path.join(BASE, 'node_modules/hyperformula'));
const HF = HFmod.HyperFormula;
Object.assign(HF, { FunctionPlugin: HFmod.FunctionPlugin, FunctionArgumentType: HFmod.FunctionArgumentType, SimpleRangeValue: HFmod.SimpleRangeValue, CellError: HFmod.CellError, ErrorType: HFmod.ErrorType, ArraySize: HFmod.ArraySize });
const esES = require(path.join(BASE, 'node_modules/hyperformula/commonjs/i18n/languages/esES.js'));
const M = require(path.join(BASE, 'app/motor.js'));
M.preparar(HF, esES.default || esES);

const args = process.argv.slice(2);
const arreglar = args.includes('--arreglar');
const archivos = args.filter((a) => !a.startsWith('--'));

/* Lista de funciones válidas del Excel español (de la investigación verificada + las del motor) */
let FUNCIONES_ES = new Set();
let FUNCIONES_EN = new Map();
try {
  const ref = JSON.parse(fs.readFileSync(path.join(BASE, 'research/es-referencia.json'), 'utf8'));
  for (const f of ref.funciones || []) { if (f.es) FUNCIONES_ES.add(f.es.toUpperCase()); if (f.en && f.es) FUNCIONES_EN.set(f.en.toUpperCase(), f.es); }
} catch (e) { /* sin referencia: solo motor */ }
const motorNombres = HF.getRegisteredFunctionNames('esXL');
for (const n of motorNombres) FUNCIONES_ES.add(n.toUpperCase());
const SOPORTADAS = new Set(motorNombres.map((n) => n.toUpperCase()).concat(['LET', 'CAMBIAR', 'PROMEDIO.SI.CONJUNTO']));
/* Funciones del motor que NO son de Excel (Google Sheets / HyperFormula): no deben enseñarse */
const NO_EXCEL = new Set(['ARRAYFORMULA', 'ARRAY_CONSTRAIN', 'SPLIT', 'COUNTUNIQUE', 'INTERVAL', 'MAXPOOL', 'MEDIANPOOL', 'VERSION', 'HF.ADD', 'HF.CONCAT', 'HF.DIVIDE', 'HF.EQ', 'HF.GT', 'HF.GTE', 'HF.LT', 'HF.LTE', 'HF.MINUS', 'HF.MULTIPLY', 'HF.NE', 'HF.POW', 'HF.UMINUS', 'HF.UNARY_PERCENT', 'HF.UPLUS', 'SHEET', 'SHEETS']);

let RIBBON = null;
try { RIBBON = JSON.parse(fs.readFileSync(path.join(BASE, 'app/cinta.json'), 'utf8')); } catch (e) { /* aún no existe */ }

function rutaEnCinta(ruta) {
  if (!RIBBON) return true;
  const tab = RIBBON.find((t) => t.pestana === ruta[0]); if (!tab) return false;
  if (ruta.length < 2) return true;
  const g = tab.grupos.find((x) => x.grupo === ruta[1]); if (!g) return false;
  if (ruta.length < 3) return true;
  return g.comandos.includes(ruta[2]);
}

const informe = { archivos: [], errores: 0, avisos: 0 };
const ZONAS = ['titulo', 'guardar', 'buscar', 'archivo', 'pestanas_cinta', 'cinta', 'cuadro_nombres', 'insertar_funcion', 'barra_formulas', 'seleccionar_todo', 'encabezado_columna', 'encabezado_fila', 'celda_activa', 'controlador_relleno', 'pestanas_hoja', 'nueva_hoja', 'barra_estado', 'zoom'];

function revisarTexto(texto, donde, avisos) {
  if (!texto || typeof texto !== 'string') return;
  // funciones en mayúsculas seguidas de "(" (en código o texto)
  const re = /(?<![A-Za-zÀ-ÿ0-9_.])([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ0-9]*(?:\.[A-ZÁÉÍÓÚÑ0-9]+)*)\(/g;
  let m;
  while ((m = re.exec(texto))) {
    const n = m[1];
    if (n.length < 2) continue;
    if (!FUNCIONES_ES.has(n)) {
      const en = FUNCIONES_EN.get(n);
      avisos.push(`${donde}: «${n}(» no es una función del Excel español${en ? ` (en español es ${en})` : ''}. Si es a propósito (comparar con el inglés), ignóralo.`);
    } else if (NO_EXCEL.has(n)) avisos.push(`${donde}: «${n}» no existe en Excel.`);
  }
  // comas como separador en fórmulas de ejemplo: =FUNCION(A1,B1)
  const reF = /=[A-ZÁÉÍÓÚÑ.]+\([^)]*[A-Z]+\d+\s*,\s*[A-Z]+\d+/g;
  if (reF.test(texto)) avisos.push(`${donde}: parece haber una fórmula con coma como separador de argumentos; en es-ES es «;».`);
}

function recorrerTextos(obj, donde, avisos) {
  if (!obj || typeof obj !== 'object') return;
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'solucion' || k === 'formula' || k === 'inicial' || k === 'alternativas' || k === 'errores_tipicos' || k === 'hoja' || k === 'celdas') continue;
    if (typeof v === 'string') revisarTexto(v, `${donde}.${k}`, avisos);
    else if (typeof v === 'object') recorrerTextos(v, `${donde}.${k}`, avisos);
  }
}

function validarHoja(h, donde, errores) {
  if (!h || typeof h !== 'object' || !h.celdas) { errores.push(`${donde}: falta "hoja.celdas".`); return false; }
  for (const ref of Object.keys(h.celdas)) { try { M.dir(ref); } catch (e) { errores.push(`${donde}: referencia de celda no válida «${ref}».`); } }
  for (const r of Object.keys(h.formatos || {})) { try { M.celdasDeRango(r); } catch (e) { errores.push(`${donde}: rango de formato no válido «${r}».`); } }
  return true;
}

function funcionesDe(formula) { return M.nombreFuncionesUsadas(formula); }

function validarEjercicio(ej, donde, errores, avisos, cambios) {
  const modo = ej.modo;
  if (!ej.id) errores.push(`${donde}: falta id.`);
  switch (modo) {
    case 'formula': {
      if (!validarHoja(ej.hoja, donde, errores)) return;
      if (!ej.objetivo) { errores.push(`${donde}: falta "objetivo".`); return; }
      if (!ej.solucion || !String(ej.solucion).startsWith('=')) { errores.push(`${donde}: falta "solucion" (empieza por =).`); return; }
      if (!ej.enunciado) errores.push(`${donde}: falta "enunciado".`);
      if (!Array.isArray(ej.pistas) || ej.pistas.length < 2) avisos.push(`${donde}: conviene dar 2-3 pistas graduadas.`);
      if (!ej.explicacion) avisos.push(`${donde}: falta "explicacion" (se muestra al acertar).`);
      if (ej.hoja.celdas[ej.objetivo] !== undefined) errores.push(`${donde}: la celda objetivo ${ej.objetivo} ya tiene contenido en la hoja.`);
      const usadas = funcionesDe(ej.solucion);
      for (const n of usadas) {
        if (!SOPORTADAS.has(n)) errores.push(`${donde}: la solución usa ${n}, que el motor no calcula. Cambia a modo "test", "predice" o "excel".`);
        if (NO_EXCEL.has(n)) errores.push(`${donde}: ${n} no existe en Excel.`);
      }
      for (const n of ej.debe_usar || []) if (!usadas.includes(n.toUpperCase())) errores.push(`${donde}: "debe_usar" incluye ${n} pero la solución no la usa.`);
      let r;
      try { r = M.comprobar(HF, ej, ej.solucion); } catch (e) { errores.push(`${donde}: el motor falla con la solución: ${e.message}`); return; }
      if (!r.ok) { errores.push(`${donde}: la propia solución NO pasa: ${r.mensajes.join(' ')}`); return; }
      const v0 = Object.values(r.valores)[0];
      if (typeof v0 === 'string' && v0.startsWith('#') && !ej.resultado_error) avisos.push(`${donde}: la solución da un error (${v0}). Si es a propósito, pon "resultado_error": true.`);
      if (!(ej.variantes && ej.variantes.length)) avisos.push(`${donde}: sin "variantes" no se detecta un resultado escrito a mano dentro de la fórmula.`);
      for (const alt of ej.alternativas || []) { const ra = M.comprobar(HF, ej, alt); if (!ra.ok) errores.push(`${donde}: la alternativa ${alt} no pasa: ${ra.mensajes.join(' ')}`); }
      for (const et of ej.errores_tipicos || []) {
        const f = typeof et === 'string' ? et : et.formula;
        const re = M.comprobar(HF, ej, f);
        if (re.ok) errores.push(`${donde}: el error típico ${f} PASA la corrección (debería fallar). Añade variantes o "debe_usar".`);
      }
      if (ej.inicial) { const ri = M.comprobar(HF, ej, ej.inicial); if (ri.ok) errores.push(`${donde}: la fórmula inicial ya pasa; no hay nada que arreglar.`); }
      revisarTexto(ej.solucion.replace(/;/g, ';'), `${donde}.solucion`, avisos);
      break;
    }
    case 'predice': {
      if (!validarHoja(ej.hoja, donde, errores)) return;
      if (!ej.formula || !ej.celda) { errores.push(`${donde}: "predice" necesita "formula" y "celda".`); return; }
      for (const n of funcionesDe(ej.formula)) if (!SOPORTADAS.has(n)) errores.push(`${donde}: la fórmula usa ${n}, que el motor no calcula.`);
      const r = M.evaluar(HF, ej.hoja, ej.celda, ej.formula);
      const mostrado = M.mostrar(r.valor, ej.formato_resultado || null);
      if (ej.respuesta === undefined || ej.respuesta === null || arreglar) {
        if (ej.respuesta !== mostrado) { cambios.push(`${donde}: respuesta → ${mostrado}`); ej.respuesta = mostrado; }
      } else if (String(ej.respuesta) !== mostrado) errores.push(`${donde}: la respuesta escrita (${ej.respuesta}) no coincide con lo que calcula Excel (${mostrado}).`);
      break;
    }
    case 'test': {
      if (!ej.pregunta) errores.push(`${donde}: falta "pregunta".`);
      const ops = ej.opciones || [];
      if (ops.length < 2) errores.push(`${donde}: un test necesita al menos 2 opciones.`);
      const ok = ops.filter((o) => o.correcta).length;
      if (!ej.multiple && ok !== 1) errores.push(`${donde}: debe haber exactamente 1 opción correcta (hay ${ok}).`);
      if (ej.multiple && ok < 1) errores.push(`${donde}: ninguna opción correcta.`);
      ops.forEach((o, i) => { if (!o.porque) avisos.push(`${donde}.opciones[${i}]: falta "porque" (retroalimentación de esa opción).`); });
      break;
    }
    case 'ordenar': {
      if (!Array.isArray(ej.pasos) || ej.pasos.length < 3) errores.push(`${donde}: "ordenar" necesita al menos 3 pasos.`);
      break;
    }
    case 'cinta': {
      if (!Array.isArray(ej.ruta) || ej.ruta.length < 2) errores.push(`${donde}: "cinta" necesita "ruta" [pestaña, grupo, comando].`);
      else if (!rutaEnCinta(ej.ruta)) errores.push(`${donde}: la ruta ${ej.ruta.join(' › ')} no existe en el modelo de la cinta (app/cinta.json).`);
      break;
    }
    case 'respuesta_corta': {
      if (!ej.pregunta || !Array.isArray(ej.aceptadas) || !ej.aceptadas.length) errores.push(`${donde}: "respuesta_corta" necesita "pregunta" y "aceptadas".`);
      break;
    }
    case 'abierta': {
      if (!ej.pregunta || !ej.modelo) errores.push(`${donde}: "abierta" necesita "pregunta" y "modelo" (respuesta modelo).`);
      if (!Array.isArray(ej.criterios) || ej.criterios.length < 2) avisos.push(`${donde}: conviene dar criterios de evaluación.`);
      break;
    }
    case 'senala': {
      if (!ej.pregunta || !ZONAS.includes(ej.zona)) errores.push(`${donde}: "senala" necesita "pregunta" y una "zona" de: ${ZONAS.join(', ')}.`);
      break;
    }
    case 'excel': {
      if (!ej.enunciado || !ej.archivo) errores.push(`${donde}: "excel" necesita "enunciado" y "archivo".`);
      if (ej.archivo && !fs.existsSync(path.join(BASE, 'libros', ej.archivo))) errores.push(`${donde}: no existe libros/${ej.archivo}.`);
      for (const [i, c] of (ej.controles || []).entries()) if (c.respuesta === undefined) errores.push(`${donde}.controles[${i}]: falta "respuesta".`);
      break;
    }
    default: errores.push(`${donde}: modo de ejercicio desconocido «${modo}».`);
  }
}

function existeLibro(a) { return a && fs.existsSync(path.join(BASE, 'libros', a)); }
function validarOtro(base, x, errores, avisos, cambios) {
  if (base === 'prueba_nivel.json') {
    const qs = x.preguntas || [];
    if (qs.length < 12) avisos.push('prueba_nivel: conviene tener al menos 2-3 preguntas por nivel.');
    qs.forEach((q, i) => {
      if (!q.nivel) errores.push(`prueba_nivel.preguntas[${i}]: falta "nivel".`);
      if (!['test', 'predice', 'respuesta_corta', 'formula', 'cinta', 'ordenar', 'senala'].includes(q.modo)) errores.push(`prueba_nivel.preguntas[${i}]: modo ${q.modo} no se corrige solo.`);
      validarEjercicio(q, `prueba_nivel.preguntas[${i}]`, errores, avisos, cambios);
    });
  } else if (/^[nx]\d+-examen\.json$/.test(base)) {
    const qs = x.preguntas || [];
    if (!x.nivel) errores.push(`${base}: falta "nivel".`);
    if (qs.length < 10) avisos.push(`${base}: un examen de nivel debería tener 10-15 preguntas.`);
    qs.forEach((q, i) => {
      if (!['test', 'predice', 'respuesta_corta', 'formula', 'cinta', 'ordenar', 'senala'].includes(q.modo)) errores.push(`${base}.preguntas[${i}]: modo ${q.modo} no se corrige solo.`);
      validarEjercicio(q, `${base}.preguntas[${i}]`, errores, avisos, cambios);
    });
  } else if (base === 'examen.json') {
    for (const k of ['titulo', 'intro', 'partes']) if (!x[k]) errores.push(`examen: falta "${k}".`);
    for (const a of x.archivos || []) if (!existeLibro(a.archivo)) errores.push(`examen: no existe libros/${a.archivo}.`);
    if (x.archivo_solucion && !existeLibro(x.archivo_solucion)) errores.push(`examen: no existe libros/${x.archivo_solucion}.`);
    (x.partes || []).forEach((p, i) => (p.ejercicios || []).forEach((e, j) => validarEjercicio(e, `examen.partes[${i}].ejercicios[${j}]`, errores, avisos, cambios)));
  } else if (base === 'checklist.json') {
    if (!Array.isArray(x)) errores.push('checklist: debe ser una lista de {grupo, puntos}.');
    else x.forEach((g, i) => { if (!g.grupo || !Array.isArray(g.puntos) || !g.puntos.length) errores.push(`checklist[${i}]: falta grupo o puntos.`); });
  } else if (base === 'demo.json') {
    validarEjercicio(x, 'demo', errores, avisos, cambios);
  } else if (base === 'hoja_libre.json') {
    validarHoja(x, 'hoja_libre', errores);
  } else { // proyecto
    const d = x.id || base;
    for (const k of ['id', 'titulo', 'departamento', 'resumen', 'correo', 'archivos', 'pasos', 'controles', 'entregables', 'rubrica', 'solucion_md']) if (!x[k] || (Array.isArray(x[k]) && !x[k].length)) errores.push(`${d}: falta "${k}".`);
    if (x.correo) for (const k of ['de', 'asunto', 'cuerpo']) if (!x.correo[k]) errores.push(`${d}.correo: falta "${k}".`);
    for (const a of x.archivos || []) if (!existeLibro(a.archivo)) errores.push(`${d}: no existe libros/${a.archivo}.`);
    if (x.archivo_solucion && !existeLibro(x.archivo_solucion)) errores.push(`${d}: no existe libros/${x.archivo_solucion}.`);
    (x.controles || []).forEach((c, i) => { if (typeof c.respuesta !== 'number' && typeof c.respuesta !== 'string') errores.push(`${d}.controles[${i}]: falta "respuesta".`); });
    (x.rubrica || []).forEach((r, i) => { if (!r.criterio || !Array.isArray(r.niveles) || r.niveles.length !== 4) errores.push(`${d}.rubrica[${i}]: necesita "criterio" y 4 "niveles".`); });
    if (!x.preguntas_previas) avisos.push(`${d}: sin "preguntas_previas" no se practica aclarar el encargo.`);
    if (!x.correo_entrega) avisos.push(`${d}: sin "correo_entrega" no se practica comunicar el resultado.`);
  }
}

const idsVistos = new Map();
for (const archivo of archivos) {
  const errores = [], avisos = [], cambios = [];
  let mod;
  try { mod = JSON.parse(fs.readFileSync(archivo, 'utf8')); } catch (e) { errores.push(`JSON no válido: ${e.message}`); informe.archivos.push({ archivo, errores, avisos }); informe.errores += errores.length; continue; }
  const d = mod.id || path.basename(archivo);
  const base = path.basename(archivo);
  if (/^[nx]\d+-examen\.json$/.test(base) ||
      base === 'prueba_nivel.json' || base === 'examen.json' || base === 'checklist.json' || /^p\d+\.json$/.test(base) || base === 'demo.json' || base === 'hoja_libre.json') {
    validarOtro(base, mod, errores, avisos, cambios);
    recorrerTextos(mod, base, avisos);
    if (arreglar && cambios.length) fs.writeFileSync(archivo, JSON.stringify(mod, null, 2) + '\n');
    informe.archivos.push({ archivo: base, errores, avisos, cambios }); informe.errores += errores.length; informe.avisos += avisos.length;
    continue;
  }
  for (const k of ['id', 'nivel', 'titulo', 'lecciones']) if (!mod[k]) errores.push(`${d}: falta "${k}".`);
  const comprobarId = (id, donde) => { if (!id) return; if (idsVistos.has(id)) errores.push(`${donde}: id repetido «${id}» (ya en ${idsVistos.get(id)}).`); else idsVistos.set(id, archivo); };
  comprobarId(mod.id, d);
  (mod.repaso_inicial || []).forEach((e, i) => { comprobarId(e.id, `${d}.repaso_inicial[${i}]`); validarEjercicio(e, `${d}.repaso_inicial[${i}]`, errores, avisos, cambios); });
  for (const [li, lec] of (mod.lecciones || []).entries()) {
    const dl = lec.id || `${d}.lecciones[${li}]`;
    comprobarId(lec.id, dl);
    if (!lec.titulo) errores.push(`${dl}: falta título.`);
    if (!lec.mision || !lec.mision.de || !lec.mision.texto || !lec.mision.logro) avisos.push(`${dl}: falta "mision" {de, puesto, texto, logro}: cada lección resuelve un encargo real de un compañero.`);
    if (!Array.isArray(lec.bloques) || !lec.bloques.length) { errores.push(`${dl}: sin bloques.`); continue; }
    const activos = lec.bloques.filter((b) => b.tipo === 'ejercicio').length;
    if (activos < 4) avisos.push(`${dl}: solo ${activos} ejercicio(s) en los bloques; objetivo: 5-7 (más los de «recuerda»).`);
    let seguidos = 0;
    for (const b of lec.bloques) {
      if (b.tipo === 'ejercicio') { seguidos = 0; continue; }
      if (['texto', 'pasos', 'tabla', 'cinta', 'pantalla', 'comparar', 'mensaje'].includes(b.tipo)) seguidos++;
      if (seguidos === 3) avisos.push(`${dl}: 3 pantallas de explicación seguidas sin ejercicio; intercala práctica.`);
      if (b.tipo === 'texto') { const pal = (b.md || '').split(/\s+/).filter(Boolean).length; if (pal > 110) avisos.push(`${dl}: un bloque de texto tiene ${pal} palabras; máximo ~90 por pantalla.`); }
    }
    if (!Array.isArray(lec.recuerda) || lec.recuerda.length < 2) avisos.push(`${dl}: "recuerda" debería tener 2-3 preguntas de recuperación.`);
    for (const [bi, b] of lec.bloques.entries()) {
      const db = `${dl}.bloques[${bi}]`;
      if (b.tipo === 'ejercicio') { comprobarId(b.id, db); validarEjercicio(b, db, errores, avisos, cambios); }
      else if (b.tipo === 'hoja') { validarHoja(b.hoja, db, errores); for (const [ref, v] of Object.entries(b.hoja?.celdas || {})) if (typeof v === 'string' && v.startsWith('=')) { for (const n of funcionesDe(v)) if (!SOPORTADAS.has(n)) errores.push(`${db}: la hoja de ejemplo usa ${n} en ${ref}, que el motor no calcula; usa un bloque "tabla" para mostrarla.`); } }
      else if (b.tipo === 'pasos') { if (!Array.isArray(b.pasos) || !b.pasos.length) errores.push(`${db}: "pasos" vacío.`); for (const [pi, p] of (b.pasos || []).entries()) if (p.hoja) validarHoja(p.hoja, `${db}.pasos[${pi}]`, errores); }
      else if (b.tipo === 'cinta') { if (b.ruta && !rutaEnCinta(b.ruta)) errores.push(`${db}: la ruta ${b.ruta.join(' › ')} no existe en el modelo de la cinta.`); }
      else if (b.tipo === 'pantalla') { if (b.resaltar && !ZONAS.includes(b.resaltar)) errores.push(`${db}: zona desconocida «${b.resaltar}».`); }
      else if (b.tipo === 'mensaje') { if (!b.de || !b.md) errores.push(`${db}: "mensaje" necesita "de" y "md".`); }
      else if (!['texto', 'aviso', 'tabla', 'atajos', 'comparar'].includes(b.tipo)) errores.push(`${db}: tipo de bloque desconocido «${b.tipo}».`);
    }
    for (const [ri, e] of (lec.recuerda || []).entries()) { comprobarId(e.id, `${dl}.recuerda[${ri}]`); validarEjercicio(e, `${dl}.recuerda[${ri}]`, errores, avisos, cambios); }
    for (const [ti, t] of (lec.tarjetas || []).entries()) if (!t.frente || !t.dorso) errores.push(`${dl}.tarjetas[${ti}]: falta frente o dorso.`);
  }
  if (mod.practica_excel) validarEjercicio({ id: mod.id + '-excel', modo: 'excel', ...mod.practica_excel }, `${d}.practica_excel`, errores, avisos, cambios);
  recorrerTextos(mod, d, avisos);
  if (arreglar && cambios.length) fs.writeFileSync(archivo, JSON.stringify(mod, null, 2) + '\n');
  const ejercicios = JSON.stringify(mod).match(/"modo":/g)?.length || 0;
  informe.archivos.push({ archivo: path.basename(archivo), lecciones: (mod.lecciones || []).length, ejercicios, errores, avisos, cambios });
  informe.errores += errores.length; informe.avisos += avisos.length;
}

for (const a of informe.archivos) {
  console.log(`\n=== ${a.archivo}: ${a.lecciones ?? '?'} lecciones, ${a.ejercicios ?? '?'} ejercicios · ${a.errores.length} errores · ${a.avisos.length} avisos${a.cambios?.length ? ` · ${a.cambios.length} respuestas calculadas` : ''}`);
  for (const e of a.errores) console.log('  ERROR  ' + e);
  for (const w of a.avisos) console.log('  aviso  ' + w);
}
console.log(`\nTOTAL: ${informe.errores} errores, ${informe.avisos} avisos.`);
process.exit(informe.errores ? 1 : 0);

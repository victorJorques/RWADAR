#!/usr/bin/env node
/* Monta la página publicable: dist/hoja-a-hoja.html + dist/libros/*.xlsx */
'use strict';
const fs = require('fs');
const path = require('path');
const B = __dirname;
const leer = (p, def) => { try { return JSON.parse(fs.readFileSync(path.join(B, p), 'utf8')); } catch (e) { if (def !== undefined) return def; throw new Error('No puedo leer ' + p + ': ' + e.message); } };

const CONT = process.env.CONTENIDO || 'contenido';
const blueprint = leer(process.env.BLUEPRINT || 'research/blueprint.json');
const modulos = {};
const NIVELES_OK = process.env.NIVELES ? new Set(process.env.NIVELES.split(',')) : null; // solo niveles ya revisados
for (const f of fs.readdirSync(path.join(B, CONT)).filter((f) => /^[nx]\d+m\d+\.json$/.test(f))) { const m = leer(CONT + '/' + f); if (!NIVELES_OK || NIVELES_OK.has(m.nivel)) modulos[m.id] = m; }
const examenes_nivel = {};
for (const f of fs.readdirSync(path.join(B, CONT)).filter((f) => /^[nx]\d+-examen\.json$/.test(f))) { const e = leer(CONT + '/' + f); if (!NIVELES_OK || NIVELES_OK.has(e.nivel)) examenes_nivel[e.nivel] = e; }
const proyectos = fs.existsSync(path.join(B, 'proyectos')) ? fs.readdirSync(path.join(B, 'proyectos')).filter((f) => /^p\d+\.json$/.test(f)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1))).map((f) => leer('proyectos/' + f)).filter((x) => !process.env.PROYECTOS || process.env.PROYECTOS.split(',').includes(x.id)) : [];
const ref = leer('research/es-referencia.json', {});
const cinta = leer('app/cinta.json', ref.cinta || []);
const indiceLibros = leer('libros/indice.json', {});
const EXT_LIBRO = /\.(xlsx|csv|zip|txt)$/i;
const ficherosLibros = fs.existsSync(path.join(B, 'libros')) ? fs.readdirSync(path.join(B, 'libros')).filter((f) => EXT_LIBRO.test(f) && fs.statSync(path.join(B, 'libros', f)).isFile()) : [];
for (const f of fs.existsSync(path.join(B, 'libros')) ? fs.readdirSync(path.join(B, 'libros')).filter((f) => f.endsWith('.meta.json')) : []) {
  const base = f.replace(/\.meta\.json$/, '');
  const real = ficherosLibros.find((x) => x.replace(EXT_LIBRO, '') === base) || base + '.xlsx';
  indiceLibros[real] = leer('libros/' + f, {});
}
const libros = {};
for (const f of ficherosLibros) {
  const kb = Math.round(fs.statSync(path.join(B, 'libros', f)).size / 1024);
  libros[f] = { ...(indiceLibros[f] || {}), tamano: kb > 1024 ? (kb / 1024).toFixed(1).replace('.', ',') + ' MB' : kb + ' KB' };
}

const curso = {
  titulo: blueprint.titulo, promesa: blueprint.promesa,
  niveles: blueprint.niveles.map((n) => ({ id: n.id, nombre: n.nombre, lema: n.lema, horas: n.horas, puede_hacer_sola: n.puede_hacer_sola, modulos: n.modulos.filter((m) => modulos[m.id]).map((m) => ({ id: m.id, titulo: m.titulo })), previstos: n.modulos.map((m) => m.titulo), incompleto: n.modulos.some((m) => !modulos[m.id]) })),
};
const faltan = blueprint.niveles.flatMap((n) => n.modulos.map((m) => m.id)).filter((id) => !modulos[id]);
if (faltan.length) console.warn('AVISO: módulos del temario sin contenido: ' + faltan.join(', '));

const limpiaError = (e) => e.replace(/\s*\(.*\)\s*$/, '');
const referencia = {
  // Solo se enseña lo verificado; COPILOT() está retirada; TRIMRANGE no tiene nombre español confirmado.
  funciones: (ref.funciones || []).filter((f) => f.verificado !== false && f.en !== 'COPILOT' && !/^\(/.test(f.es)).map((f) => ({ es: f.es, en: f.en, categoria: f.categoria, sintaxis_es: f.sintaxis_es, disponible: f.disponible, descripcion: f.descripcion || '' })),
  errores: (ref.errores || []).filter((e) => e.verificado !== false).map((e) => ({ es: limpiaError(e.es), en: e.en, significa: e.significa + (e.arreglo ? ' Arreglo: ' + e.arreglo : '') })),
  atajos_windows: (ref.atajos_windows || []).filter((a) => a.verificado !== false).map((a) => ({ accion: a.accion, es_ES: a.es_ES, nota: (a.nota || '').slice(0, 160) })),
  atajos_mac: (ref.atajos_mac || []).map((a) => ({ accion: a.accion, es_ES: a.mac, nota: (a.nota || '').slice(0, 160) })),
  terminos: (ref.terminos || []).map((t) => ({ es: t.es, en: t.en, definicion: t.nota || '' })),
  dialogos: (ref.dialogos || []).map((d) => ({ es: d.es, acceso: d.acceso })),
};
const DATOS = {
  fecha: '14/11/2026', curso, modulos, examenes_nivel, proyectos, libros, cinta, referencia,
  prueba_nivel: leer(CONT + '/prueba_nivel.json', null), examen: leer(CONT + '/examen.json', null), checklist: leer(CONT + '/checklist.json', []),
  demo: leer(CONT + '/demo.json', null), hoja_libre: leer(CONT + '/hoja_libre.json', null),
};
// solo los archivos que el contenido publicado usa
const usados = new Set((JSON.stringify({ modulos, proyectos, examen: DATOS.examen }).match(/[\w.-]+\.(xlsx|csv|zip|txt)/g) || []));
for (const f of Object.keys(libros)) if (!usados.has(f)) delete libros[f];
const json = JSON.stringify(DATOS).replace(/</g, '\\u003c').replace(/\ufffd/g, '\\ufffd'); // el «Almac�n» de P8 es a propósito: se escapa para no dejar el carácter crudo
const css = fs.readFileSync(path.join(B, 'app/estilos.css'), 'utf8');
const motor = fs.readFileSync(path.join(B, 'app/motor.js'), 'utf8');
const app = fs.readFileSync(path.join(B, 'app/app.js'), 'utf8');
const html = `<title>Hoja a hoja</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Guía interactiva de Excel en español: del nivel 0 a llevar proyectos sola en una empresa.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,500..800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap">
<style>
${css}
</style>
<main id="vista" tabindex="-1"><p class="cargando">Cargando la guía…</p></main>
<script>window.DATOS = ${json};</script>
<script>
${motor}
</script>
<script>
${app}
</script>
`;
fs.rmSync(path.join(B, 'dist/libros'), { recursive: true, force: true });
fs.mkdirSync(path.join(B, 'dist/libros'), { recursive: true });

fs.writeFileSync(path.join(B, process.env.SALIDA || 'dist/hoja-a-hoja.html'), html);
// El visor no sirve .xlsx ni .zip: se publican en base64 como texto y la página los reconstruye al descargar.
for (const f of Object.keys(libros)) fs.writeFileSync(path.join(B, 'dist/libros', f + '.b64.txt'), fs.readFileSync(path.join(B, 'libros', f)).toString('base64'));
const lecciones = Object.values(modulos).reduce((a, m) => a + m.lecciones.length, 0);
console.log(`dist/hoja-a-hoja.html: ${(html.length / 1024).toFixed(0)} KB · ${curso.niveles.length} niveles · ${Object.keys(modulos).length} módulos · ${lecciones} lecciones · ${proyectos.length} proyectos · ${Object.keys(libros).length} libros`);

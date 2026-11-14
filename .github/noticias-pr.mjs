#!/usr/bin/env node
// =====================================================================
// RWAdar · el PR de las noticias automáticas solo lleva noticias
// ---------------------------------------------------------------------
// Lo usa el paso «El PR de las noticias automáticas solo lleva noticias»
// del trabajo «secretos» de .github/workflows/ci.yml (sin instalar nada:
// solo módulos de Node). Si el título del PR empieza por «Noticias
// automáticas» (con o sin tilde, en mayúsculas o minúsculas), el PR solo
// puede cambiar lo que puede tocar una mañana: las dos copias de las
// noticias, la carpeta del día de su título y el sello. La regla es la
// misma de la skill (archivoPermitido de lib/validar.mjs, con el sello).
// Así la lista no la hace cumplir solo la sesión que lee webs de terceros.
//
//   TITULO="…" node .github/noticias-pr.mjs            compara HEAD^1 con HEAD
//                                                       (en un PR, la unión con
//                                                       la base y su padre)
//   TITULO="…" node .github/noticias-pr.mjs BASE CABEZA
//
// Salida 0: no es ese PR, o solo cambia lo permitido. Salida 1: cambia
// otra cosa, el título no trae la fecha o no se pudo ver qué cambia.
// Límite: corre con el código del propio PR. No para a quien reescriba la
// CI a la vez (eso lo pararía una regla de la rama en GitHub, que es un
// ajuste del repositorio); sí a una mañana que se salte un paso o a la que
// una fuente le cuele código.
// Pruebas: node --test .github/noticias-pr.test.mjs
// =====================================================================
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { archivoPermitido } from '../.claude/skills/noticias-automaticas/lib/validar.mjs';

const sinTildes = texto => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '');

export const esPrDeNoticias = titulo => /^\s*noticias\s+automaticas\b/i.test(sinTildes(titulo));

/* «Noticias automáticas del 14/11/2026» → «2026-11-14» (o null si no trae una fecha real). */
export function fechaDelTitulo(titulo) {
  const m = /\b(\d{2})\/(\d{2})\/(\d{4})\b/.exec(String(titulo || ''));
  if (!m) return null;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso ? null : iso;
}

/* {aplica, fecha, fallos}: aplica = false si no es el PR de las noticias. */
export function comprobarPr({ titulo, archivos }) {
  if (!esPrDeNoticias(titulo)) return { aplica: false, fecha: null, fallos: [] };
  const fecha = fechaDelTitulo(titulo);
  if (!fecha) return { aplica: true, fecha: null, fallos: ['el título no trae la fecha del día (DD/MM/AAAA)'] };
  const fallos = (archivos || []).filter(rel => !archivoPermitido(rel, fecha, { conSello: true }))
    .map(rel => `cambia ${rel}, que una mañana no puede tocar`);
  return { aplica: true, fecha, fallos };
}

function archivosDelPr(base, cabeza) {
  const r = spawnSync('git', ['-c', 'core.quotePath=false', 'diff', '--no-renames', '--name-only', base, cabeza], { encoding: 'utf8' });
  if (r.status !== 0) return null;
  return r.stdout.split('\n').map(l => l.trim()).filter(Boolean);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const titulo = process.env.TITULO || '';
  const [base = 'HEAD^1', cabeza = 'HEAD'] = process.argv.slice(2);
  if (!esPrDeNoticias(titulo)) {
    console.log('No es el PR de las noticias automáticas: nada que mirar.');
    process.exit(0);
  }
  const archivos = archivosDelPr(base, cabeza);
  if (!archivos) {
    console.log('No se pudo ver qué cambia el PR de las noticias automáticas: no se deja pasar.');
    process.exit(1);
  }
  const { fecha, fallos } = comprobarPr({ titulo, archivos });
  if (fallos.length) {
    console.log(`El PR de las noticias automáticas${fecha ? ` del ${fecha}` : ''} lleva algo más que noticias:`);
    for (const f of fallos) console.log(`- ${f}`);
    console.log('Ciérralo sin unir: la mañana solo puede cambiar las dos copias de las noticias, la carpeta del día y el sello.');
    process.exit(1);
  }
  console.log(`PR de las noticias automáticas del ${fecha}: ${archivos.length} archivo(s), todos permitidos.`);
}

#!/usr/bin/env node
/* =====================================================================
   RWAdar · ¿el directo mide lo mismo que el flujo diario? (fase 2)
   ---------------------------------------------------------------------
   Para la semana de vigilancia del directo (migración 35), sin gastar
   minutos de GitHub. Solo lee archivos:

     node rwadar-app/tokenizacion/comparar-directo.mjs directo.json fina.json

   directo.json: lo que sirve https://rwadar.pages.dev/api/tokenizacion/directo
   ({ version, fina, sinLectura }); fina.json: tokenizacion-serie-fina.json
   del flujo diario (rama datos-tokenizacion) de un momento que el directo
   cubra. Compara EL MISMO INSTANTE (revisión del 14/11/2026): en el directo,
   el cubo H de la horaria vale «al final de la hora H» (su última lectura,
   hacia el minuto 56) y en la fina del flujo, el punto de market_chart en
   punto; por eso cada punto de la fina (de 5 minutos y horario) se compara
   con el cubo de 5 minutos del directo que contiene su hora, no con el
   horario. Dice cuántos cubos casan, la diferencia (mediana, p95 y máximo),
   cuántos quedan dentro del 0,1 % (la compuerta de la fase 2: el 95 % o
   más) y si «fuera» y «largos» coinciden. Sale con 0 si pasa la compuerta y
   con 1 si no.
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const modelo = require('../../rwadar-movil/lib/tokenizacion.js');
const UMBRAL = 0.001, CUOTA = 0.95;

export function compararDirecto(servido, finaFlujo) {
  const d = modelo.validarDirecto(servido).fina, f = modelo.validarSerieFina(finaFlujo);
  const cinco = d.series['5m'];
  if (!cinco) throw new Error('el directo no trae la serie de 5 minutos');
  const porCubo = new Map(cinco.puntos.map(([t, v]) => [modelo.msMinuto(t), v + cinco.valorFuera]));
  const difs = [];
  for (const clave of ['5m', '1h']) {
    const x = f.series[clave];
    if (!x) continue;
    for (const [t, v] of x.puntos) {
      const ms = modelo.msMinuto(t), cubo = Math.floor(ms / 300000) * 300000;
      const directo = porCubo.get(cubo);
      if (directo === undefined) continue;
      difs.push({ clave, t, dif: directo / (v + x.valorFuera) - 1 });
    }
  }
  const abs = difs.map(x => Math.abs(x.dif)).sort((a, b) => a - b);
  const q = p => (abs.length ? abs[Math.min(abs.length - 1, Math.floor(p * abs.length))] : null);
  const dentro = abs.filter(x => x <= UMBRAL).length;
  const iguales = (a, b) => a.length === b.length && a.every(t => b.includes(t));
  const flujo5 = f.series['5m'];
  return {
    comparables: abs.length, dentro, cuota: abs.length ? dentro / abs.length : 0,
    mediana: q(0.5), p95: q(0.95), maximo: abs.length ? abs[abs.length - 1] : null,
    mismosFuera: flujo5 ? iguales(cinco.fuera, flujo5.fuera) : null, mismosLargos: flujo5 ? iguales(cinco.largos, flujo5.largos) : null,
    pasa: abs.length > 0 && dentro / abs.length >= CUOTA,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [a, b] = process.argv.slice(2);
  if (!a || !b) { console.error('Uso: node rwadar-app/tokenizacion/comparar-directo.mjs directo.json fina.json'); process.exit(2); }
  const r = compararDirecto(JSON.parse(fs.readFileSync(a, 'utf8')), JSON.parse(fs.readFileSync(b, 'utf8')));
  const pct = x => (x === null ? '—' : (x * 100).toFixed(3) + ' %');
  console.log(`Cubos comparables: ${r.comparables}; dentro del 0,1 %: ${r.dentro} (${(r.cuota * 100).toFixed(1)} %).`);
  console.log(`Diferencia: mediana ${pct(r.mediana)}, p95 ${pct(r.p95)}, máximo ${pct(r.maximo)}.`);
  console.log(`«fuera» ${r.mismosFuera ? 'coinciden' : 'NO coinciden'}; «largos» ${r.mismosLargos ? 'coinciden' : 'NO coinciden'}.`);
  console.log(r.pasa ? 'Pasa la compuerta de la fase 2.' : 'NO pasa la compuerta de la fase 2.');
  process.exit(r.pasa ? 0 : 1);
}

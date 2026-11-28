// Comprueba, con las mismas reglas que actualizar-catalogo.mjs, que cada una de
// las fuentes del radar capturadas hoy sigue diciendo lo que respalda
// (data/comprobaciones-fuentes.json). Solo lee archivos locales.
//
// Uso: node rwadar-app/data/verificaciones/2026-11-28-v2/comprobar-radar.mjs capturas.json
// Escribe radar-contraste-2026-11-28.json en esta carpeta. Código 0 si todas
// cumplen; 2 si alguna falla (no se monta el lote hasta revisarla a mano).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(DIR, '../../..');
const FECHA = '2026-11-28';
const capturas = process.argv[2];
if (!capturas) throw new Error('Uso: comprobar-radar.mjs capturas.json');
const CAP = JSON.parse(fs.readFileSync(capturas, 'utf8'));
const COMPROBACIONES = JSON.parse(fs.readFileSync(path.join(APP, 'data', 'comprobaciones-fuentes.json'), 'utf8')).fuentes;
const radar = JSON.parse(fs.readFileSync(path.join(APP, 'data', 'verificaciones', '2026-11-27.3-v2', 'radar-canonico-26.json'), 'utf8'));
// Cambios de fuente comprobados a mano hoy (cambios-radar.json): se contrasta la página nueva.
const CAMBIOS = JSON.parse(fs.readFileSync(path.join(DIR, 'cambios-radar.json'), 'utf8'));
for (const f of radar.fuentes) {
  const c = CAMBIOS.fuentes[f.id];
  if (!c) continue;
  if (f.url !== c.antes.url) throw new Error(`${f.id}: la fuente de partida no es ${c.antes.url}`);
  f.url = c.url;
}

// 28/11: fuentes sustituidas hoy (cambios-radar.json, «sustituciones»): la web de origen bloquea el acceso desde aquí y se
// usa otra fuente primaria que sí se lee; se contrasta su copia de hoy con sus propias comprobaciones.
const SUST = new Map();
for (const [id, s] of Object.entries(CAMBIOS.sustituciones || {})) {
  const i = radar.fuentes.findIndex(f => f.id === id);
  if (i < 0) throw new Error(`${id}: sustitución de una fuente que no está en el radar`);
  radar.fuentes[i] = { ...radar.fuentes[i], ...s.nueva };
  SUST.set(s.nueva.id, s);
}
for (const id of Object.keys(CAMBIOS.retiradas || {})) {
  const i = radar.fuentes.findIndex(f => f.id === id);
  if (i < 0) throw new Error(`${id}: retirada de una fuente que no está en el radar`);
  radar.fuentes.splice(i, 1);
}
const BLOQUEO = /^(Un momento|Just a moment|Attention Required|Access denied)/i;
const captura = url => CAP[url] || CAP[url.replace(/\/$/, '')] || CAP[url + '/'];
const legible = r => !!r && (r.texto || '').length > 100 && !BLOQUEO.test(r.titulo || '') &&
  !(typeof r.estado === 'number' && r.estado >= 400);
const plano = url => { const r = captura(url); return legible(r) ? `${r.titulo || ''} ${r.texto}`.replace(/[\s  ]+/g, ' ') : ''; };

const contraste = [];
const bloqueos = [];
for (const f of radar.fuentes) {
  const sust = SUST.get(f.id);
  const r = sust ? { estado: sust.lectura.http, metodo: 'navegador (copia de hoy)', capturadoEl: sust.lectura.horaUtc } : captura(f.url);
  const texto = sust ? fs.readFileSync(path.join(DIR, sust.lectura.archivo), 'utf8').replace(/[\s  ]+/g, ' ') : plano(f.url);
  const patrones = sust ? sust.comprobaciones : COMPROBACIONES[f.id];
  const entrada = { id: f.id, url: f.url, estado: r?.estado ?? r?.error ?? 'sin captura',
    metodo: r?.metodo || 'navegador', capturadoEl: r?.capturadoEl || r?.hora || null };
  const manual = (CAMBIOS.verificacionesManuales || {})[f.id];
  // 10/11: la página de REGAFI carga, pero solo con el menú (sin los datos de la entidad); también
  // vale entonces la lectura manual del mismo registro, siempre que la página no diga lo que respalda.
  const sinDatos = !texto || (patrones || []).some(p => !new RegExp(p, 'i').test(texto));
  if (manual && sinDatos) {
    // La página no carga hoy (o carga sin datos): vale la lectura manual del mismo registro, con su método y sus literales.
    Object.assign(entrada, { ok: true, metodo: manual.metodo, urlLeida: manual.url, literales: manual.literales, manual: manual.motivo });
  } else if (!patrones) { bloqueos.push(`${f.id}: sin comprobaciones`); entrada.ok = false; }
  else if (!texto) { bloqueos.push(`${f.id}: no se pudo leer ${f.url} (${entrada.estado})`); entrada.ok = false; }
  else {
    entrada.literales = [];
    entrada.faltan = [];
    for (const p of patrones) {
      const m = texto.match(new RegExp(p, 'i'));
      if (m) entrada.literales.push(texto.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40));
      else entrada.faltan.push(p);
    }
    entrada.ok = !entrada.faltan.length;
    if (!entrada.ok) bloqueos.push(`${f.id}: ${f.url} ya no dice «${entrada.faltan.join('», «')}»`);
  }
  contraste.push(entrada);
}
const salida = { fecha: FECHA, fuentes: radar.fuentes.length, correctas: contraste.filter(c => c.ok).length,
  bloqueos, contraste };
fs.writeFileSync(path.join(DIR, `radar-contraste-${FECHA}.json`), JSON.stringify(salida, null, 2) + '\n');
console.log(`Radar ${FECHA}: ${salida.correctas}/${salida.fuentes} fuentes dicen lo que respaldan.`);
for (const b of bloqueos) console.log(`  · ${b}`);
process.exit(bloqueos.length ? 2 : 0);

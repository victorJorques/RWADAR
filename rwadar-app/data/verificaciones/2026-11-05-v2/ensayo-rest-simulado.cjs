// SOLO PARA ENSAYAR EN UNA COPIA APARTE DEL REPOSITORIO (git clone a una carpeta temporal), nunca en
// la carpeta de trabajo: hace que sincronizar.js y volcar-seed.js lean, en vez de Supabase, lo que
// exportó comprobar-entrega.mjs --exportar=DIR desde PGlite (el estado tras aplicar la entrega).
//   RWADAR_REST_SIMULADO=DIR node -r <esta ruta> rwadar-app/sincronizar.js
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const DIR = process.env.RWADAR_REST_SIMULADO;
if (!DIR) throw new Error('Falta RWADAR_REST_SIMULADO');
const leer = n => JSON.parse(fs.readFileSync(path.join(DIR, n), 'utf8'));
const original = globalThis.fetch;
globalThis.fetch = async (url, opciones = {}) => {
  const u = new URL(String(url));
  if (u.hostname !== 'exgpmjpaaebyoolpwced.supabase.co') return original(url, opciones);
  if ((opciones.method || 'GET') !== 'GET') throw new Error('El ensayo solo lee');
  const ruta = u.pathname.replace('/rest/v1/', ''), q = u.search;
  let datos;
  if (ruta === 'catalogo_plataformas_publicas_v2') datos = leer('catalogo_plataformas_publicas_v2.json');
  else if (ruta === 'catalogo_ofertas_publicas_v2') datos = leer('catalogo_ofertas_publicas_v2.json');
  else if (ruta === 'catalogo_publicacion') datos = leer('catalogo_publicacion.json');
  else if (ruta === 'categorias') datos = leer('categorias.json');
  else if (ruta === 'regiones') datos = leer('regiones.json');
  else if (ruta === 'radar_publico') datos = leer('radar_publico.json');
  else if (ruta === 'plataformas' && /estado=eq\.descartada/.test(q) && /verificada_el/.test(decodeURIComponent(q))) datos = leer('descartadas-volcar.json');
  else if (ruta === 'plataformas' && /estado=eq\.descartada/.test(q)) datos = leer('descartadas-sincronizar.json');
  else throw new Error('Ruta sin simular: ' + ruta + q);
  process.stderr.write(`[REST simulado] ${ruta}${q.slice(0, 80)} -> ${Array.isArray(datos) ? datos.length : 1} filas\n`);
  return new Response(JSON.stringify(datos), { status: 200, headers: { 'content-type': 'application/json' } });
};

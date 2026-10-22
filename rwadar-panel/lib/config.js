/* =====================================================================
   RWAdar · panel de control · configuración del panel del ordenador
   ---------------------------------------------------------------------
   Lo público (dirección de la web, proyecto de Cloudflare, clave
   publicable de Supabase) se lee de rwadar-publicacion-segura.js para
   que el panel y el publicador no puedan apuntar a sitios distintos.

   Lo secreto vive SOLO en rwadar-panel/.env.local, que Git ignora:
     CLOUDFLARE_API_TOKEN   apagar/encender la web y leer las visitas
     SUPABASE_SECRET_KEY    gestionar cuentas y retirar el catálogo
   Ninguna de las dos llega nunca al navegador.
   ===================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const { construirConfig } = require('./config-base');

const DIR_PANEL = path.resolve(__dirname, '..');
const RAIZ = path.resolve(DIR_PANEL, '..');
const ARCHIVO_ENV = path.join(DIR_PANEL, '.env.local');
const PUERTO_POR_DEFECTO = 4180;

function leerEnv(archivo) {
  let texto;
  try { texto = fs.readFileSync(archivo, 'utf8'); } catch { return {}; }
  const valores = {};
  for (const linea of texto.replace(/^﻿/, '').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    valores[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return valores;
}

function constanteDeFuente(archivo, nombre) {
  const texto = fs.readFileSync(path.join(RAIZ, archivo), 'utf8');
  const m = texto.match(new RegExp(`const ${nombre} = '([^']+)'`));
  if (!m) throw new Error(`No encuentro ${nombre} en ${archivo}`);
  return m[1];
}

/* Lo mismo que se incrusta en el panel de la nube al construirlo. */
function leerPublicos() {
  const seguro = 'rwadar-publicacion-segura.js';
  return {
    web: constanteDeFuente(seguro, 'ORIGEN_PUBLICO'),
    supabaseAuth: constanteDeFuente(seguro, 'SUPABASE_AUTH'),
    clavePublica: constanteDeFuente(seguro, 'CLAVE_PUBLICA'),
    proyecto: constanteDeFuente(seguro, 'PROYECTO_CLOUDFLARE'),
    versionWrangler: constanteDeFuente('rwadar-publicar.js', 'WRANGLER_VERSION'),
  };
}

function cargarConfig(env = process.env, archivoEnv = ARCHIVO_ENV) {
  const local = leerEnv(archivoEnv);
  const v = clave => String(env[clave] ?? local[clave] ?? '').trim();
  return construirConfig(leerPublicos(), v, {
    puerto: Number(v('RWADAR_PANEL_PUERTO')) || PUERTO_POR_DEFECTO,
    /* Solo pruebas y demostración: sustituyen a wrangler y a gh. */
    wranglerFalso: v('RWADAR_PANEL_WRANGLER_JS'),
    githubPorCli: !v('RWADAR_PANEL_GITHUB_API') && !v('GITHUB_TOKEN'),
    dirDatos: v('RWADAR_PANEL_DATOS') || path.join(DIR_PANEL, 'datos'),
    dirMantenimiento: path.join(DIR_PANEL, 'mantenimiento'),
    raiz: RAIZ,
  });
}

module.exports = { cargarConfig, leerEnv, leerPublicos, DIR_PANEL, RAIZ, ARCHIVO_ENV };

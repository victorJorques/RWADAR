#!/usr/bin/env node
/* =====================================================================
   RWAdar · subir el panel de control a Cloudflare (para los socios)
   ---------------------------------------------------------------------
       npm.cmd run panel:nube                        sube o actualiza el panel
       npm.cmd run panel:nube -- --ensayo            lo prepara y empaqueta sin subir nada
       npm.cmd run panel:nube -- --enlace-nuevo=Eric anula el enlace de Eric y le hace otro
       npm.cmd run panel:nube -- --enlaces-nuevos    anula todos los enlaces y hace otros

   Lee las claves de rwadar-panel/.env.local y:
     1. prepara nube/generado/ (página, tipografías y datos públicos),
     2. crea, si no existe, el almacén KV «rwadar-panel-almacen»,
     3. hace (o conserva) un enlace personal por cada nombre de
        PANEL_SOCIOS; en Cloudflare solo se guarda su huella,
     4. sube el Worker «rwadar-panel» con la sesión de wrangler de Víctor
        y un cron que cada hora apunta el uso de la app y las descargas,
     5. guarda las claves como secretos del Worker (el temporal se borra),
     6. apunta la dirección y los enlaces en datos/nube.json (Git lo
        ignora) para que el panel del ordenador los mande por WhatsApp.

   Sin PANEL_SOCIOS el panel sube CERRADO y no deja entrar a nadie.
   Con TEAM_DOMAIN y POLICY_AUD, en vez de enlaces se entra con
   Cloudflare Access (correo + código) y PANEL_SOCIOS lleva correos.
   ===================================================================== */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { leerEnv, leerPublicos, ARCHIVO_ENV, DIR_PANEL } = require('../lib/config.js');
const { comandoWrangler } = require('../lib/wrangler.js');
const { CUENTA_CLOUDFLARE } = require('../lib/constantes.js');

const NOMBRE_WORKER = 'rwadar-panel';
const TITULO_KV = 'rwadar-panel-almacen';
/* La que admite wrangler 4.125.0 (la versión de rwadar-publicar.js): como mucho 2026-08-27. */
const FECHA_COMPATIBILIDAD = '2026-08-20';
const CRON_HORARIO = '5 * * * *';
const DIR_NUBE = path.join(DIR_PANEL, 'nube');
const DIR_GENERADO = path.join(DIR_NUBE, 'generado');
const ARCHIVO_NUBE = path.join(DIR_PANEL, 'datos', 'nube.json');
const DIR_FUENTES = path.join(DIR_PANEL, '..', 'rwadar-site', 'assets', 'fuentes');
const FUENTES = /^(geist-normal|geist-mono-normal)-[0-9a-f]{12}\.woff2$/;
const ENSAYO = process.argv.includes('--ensayo');
const KV_ENSAYO = '0'.repeat(32);

const claves = leerEnv(ARCHIVO_ENV);
const publicos = leerPublicos();
const decir = texto => process.stdout.write(`${texto}\n`);

function wrangler(args) {
  const [cmd, argv] = comandoWrangler({ versionWrangler: publicos.versionWrangler, wranglerFalso: '' }, args);
  /* Se sube con la sesión de wrangler de Víctor, no con el token del
     panel (ese solo puede tocar Pages y leer visitas). */
  const env = { ...process.env, CLOUDFLARE_ACCOUNT_ID: claves.CLOUDFLARE_ACCOUNT_ID || CUENTA_CLOUDFLARE };
  delete env.CLOUDFLARE_API_TOKEN;
  return new Promise((resolver, rechazar) => {
    execFile(cmd, argv, { cwd: DIR_GENERADO, env, timeout: 10 * 60 * 1000, maxBuffer: 16 * 1024 * 1024, windowsHide: true }, (error, salida, errores) => {
      if (error) return rechazar(new Error(`wrangler ${args.slice(0, 3).join(' ')} falló:\n${String(errores || salida).trim().split(/\r?\n/).slice(-12).join('\n')}`));
      resolver(String(salida));
    });
  });
}

function prepararArchivos() {
  fs.rmSync(path.join(DIR_GENERADO, 'publico'), { recursive: true, force: true });
  fs.mkdirSync(path.join(DIR_GENERADO, 'publico', 'fuentes'), { recursive: true });
  fs.cpSync(path.join(DIR_PANEL, 'publico'), path.join(DIR_GENERADO, 'publico'), { recursive: true });
  for (const archivo of fs.readdirSync(DIR_FUENTES).filter(f => FUENTES.test(f))) {
    fs.copyFileSync(path.join(DIR_FUENTES, archivo), path.join(DIR_GENERADO, 'publico', 'fuentes', archivo));
  }
  fs.writeFileSync(path.join(DIR_GENERADO, 'publicos.json'), JSON.stringify(publicos, null, 2));
}

async function idAlmacen() {
  if (ENSAYO) return KV_ENSAYO;
  const buscar = async () => JSON.parse(await wrangler(['kv', 'namespace', 'list'])).find(n => n.title === TITULO_KV)?.id;
  let id = await buscar();
  if (!id) {
    decir(`Creando el almacén ${TITULO_KV}…`);
    await wrangler(['kv', 'namespace', 'create', TITULO_KV]);
    id = await buscar();
  }
  if (!/^[0-9a-f]{32}$/.test(String(id))) throw new Error('No consigo el identificador del almacén KV');
  return id;
}

const nuevaLlave = () => crypto.randomBytes(32).toString('base64url');
const huella = llave => crypto.createHash('sha256').update(llave).digest('hex');

/* Conserva las llaves que ya existen (así nadie tiene que volver a
   entrar) salvo las que se pidan nuevas, y quita las de quien ya no esté. */
function prepararEnlaces(nombres, anteriores = {}, { todosNuevos = false, nuevoPara = null } = {}) {
  const enlaces = {};
  for (const nombre of nombres) {
    const renovar = todosNuevos || (nuevoPara && nuevoPara.toLowerCase() === nombre.toLowerCase());
    enlaces[nombre] = !renovar && anteriores[nombre] ? anteriores[nombre] : nuevaLlave();
  }
  return enlaces;
}

function escribirConfiguracion(kv) {
  const vars = {};
  if (claves.TEAM_DOMAIN) vars.TEAM_DOMAIN = claves.TEAM_DOMAIN.trim().replace(/\/$/, '');
  if (claves.POLICY_AUD) vars.POLICY_AUD = claves.POLICY_AUD.trim();
  const configuracion = {
    name: NOMBRE_WORKER,
    main: '../worker.mjs',
    compatibility_date: FECHA_COMPATIBILIDAD,
    account_id: claves.CLOUDFLARE_ACCOUNT_ID || CUENTA_CLOUDFLARE,
    workers_dev: true,
    preview_urls: false,
    assets: { directory: './publico', binding: 'ASSETS', run_worker_first: true },
    kv_namespaces: [{ binding: 'ALMACEN', id: kv }],
    triggers: { crons: [CRON_HORARIO] },
    vars,
    observability: { enabled: true },
  };
  const archivo = path.join(DIR_GENERADO, 'wrangler.json');
  fs.writeFileSync(archivo, JSON.stringify(configuracion, null, 2));
  return archivo;
}

async function subirSecretos(configuracion, enlaces, secreto) {
  const secretos = {
    CLOUDFLARE_API_TOKEN: claves.CLOUDFLARE_API_TOKEN,
    SUPABASE_SECRET_KEY: claves.SUPABASE_SECRET_KEY,
    SUPABASE_ACCESS_TOKEN: claves.SUPABASE_ACCESS_TOKEN,
    GITHUB_TOKEN: claves.GITHUB_TOKEN,
    PANEL_SOCIOS: claves.PANEL_SOCIOS,
    /* Solo las huellas: el Worker no guarda las llaves de los enlaces. */
    PANEL_ENLACES: JSON.stringify(Object.fromEntries(Object.entries(enlaces).map(([n, llave]) => [n, huella(llave)]))),
    PANEL_SECRETO: secreto,
  };
  for (const k of Object.keys(secretos)) if (!secretos[k]) delete secretos[k];
  const temporal = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-panel-')), 'secretos.json');
  try {
    fs.writeFileSync(temporal, JSON.stringify(secretos), { mode: 0o600 });
    await wrangler(['secret', 'bulk', temporal, '--config', configuracion]);
  } finally {
    fs.rmSync(path.dirname(temporal), { recursive: true, force: true });
  }
  return Object.keys(secretos).filter(k => !['PANEL_SECRETO', 'PANEL_ENLACES'].includes(k));
}

async function principal() {
  const nombres = [...new Set(String(claves.PANEL_SOCIOS || '').split(',').map(s => s.trim()).filter(Boolean))];
  const conAccess = Boolean(claves.TEAM_DOMAIN && claves.POLICY_AUD);
  const faltan = [
    !claves.CLOUDFLARE_API_TOKEN && 'CLOUDFLARE_API_TOKEN (visitas y encender/apagar)',
    !claves.SUPABASE_SECRET_KEY && 'SUPABASE_SECRET_KEY (cuentas y catálogo)',
    !claves.SUPABASE_ACCESS_TOKEN && 'SUPABASE_ACCESS_TOKEN (uso de la app; opcional)',
    !nombres.length && 'PANEL_SOCIOS (los nombres de quien puede entrar, separados por comas)',
  ].filter(Boolean);

  prepararArchivos();
  const configuracion = escribirConfiguracion(await idAlmacen());
  if (ENSAYO) {
    await wrangler(['deploy', '--config', configuracion, '--dry-run', '--outdir', path.join(DIR_GENERADO, 'ensayo')]);
    decir(`Ensayo correcto: el panel se empaqueta sin errores (${path.join(DIR_GENERADO, 'ensayo')}). No se ha subido nada.`);
    if (faltan.length) decir(`Para subirlo de verdad faltan en .env.local:\n  - ${faltan.join('\n  - ')}`);
    return;
  }

  let anterior = {};
  try { anterior = JSON.parse(fs.readFileSync(ARCHIVO_NUBE, 'utf8')); } catch { anterior = {}; }
  const nuevoPara = process.argv.find(a => a.startsWith('--enlace-nuevo='))?.split('=')[1] || null;
  const enlaces = conAccess ? {} : prepararEnlaces(nombres, anterior.enlaces, { todosNuevos: process.argv.includes('--enlaces-nuevos'), nuevoPara });
  /* El secreto de las sesiones se conserva entre subidas: si cambiara,
     todos tendrían que volver a abrir su enlace. */
  const secreto = anterior.secreto || crypto.randomBytes(32).toString('hex');

  decir('Subiendo el panel a Cloudflare…');
  const salida = await wrangler(['deploy', '--config', configuracion]);
  const url = salida.match(/https:\/\/rwadar-panel\.[a-z0-9-]+\.workers\.dev/)?.[0] || anterior.url || null;
  const subidos = await subirSecretos(configuracion, enlaces, secreto);
  fs.mkdirSync(path.dirname(ARCHIVO_NUBE), { recursive: true });
  fs.writeFileSync(ARCHIVO_NUBE, JSON.stringify({ url, publicadoEl: new Date().toISOString(), secreto, enlaces }, null, 2), { mode: 0o600 });

  decir(`\nPanel subido${url ? `: ${url}` : ''}`);
  decir(`Claves guardadas en Cloudflare: ${subidos.join(', ') || 'ninguna'}.`);
  if (!nombres.length) {
    decir('\nTodavía está CERRADO: escribe en rwadar-panel/.env.local PANEL_SOCIOS=Víctor,Eric,Samuel y vuelve a ejecutar esto.');
  } else if (conAccess) {
    decir(`\nSe entra con Cloudflare Access (correo + código). Correos permitidos: ${nombres.length}.`);
  } else {
    decir(`\nEnlaces personales listos para: ${Object.keys(enlaces).join(', ')}.`);
    decir('Ábrelos en el panel de tu ordenador › Ajustes › «Enviar por WhatsApp».');
  }
  if (faltan.length) decir(`\nFalta en rwadar-panel/.env.local:\n  - ${faltan.join('\n  - ')}`);
}

/* Se puede importar (lo hace demo/nube-local.mjs) sin que se suba nada. */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal().catch(e => { process.stderr.write(`\nNo se pudo subir el panel.\n${e.message}\n`); process.exit(1); });
}

export { prepararArchivos, prepararEnlaces, huella, DIR_GENERADO, FECHA_COMPATIBILIDAD, CRON_HORARIO };

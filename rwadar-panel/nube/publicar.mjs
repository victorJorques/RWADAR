#!/usr/bin/env node
/* =====================================================================
   RWAdar · subir el panel de control a Cloudflare (para los socios)
   ---------------------------------------------------------------------
       npm.cmd run panel:nube               sube o actualiza el panel
       npm.cmd run panel:nube -- --ensayo   lo prepara y empaqueta sin subir nada

   Lee las claves de rwadar-panel/.env.local y:
     1. prepara nube/generado/ (página, tipografías y datos públicos),
     2. crea, si no existe, el almacén KV «rwadar-panel-almacen»,
     3. sube el Worker «rwadar-panel» con la sesión de wrangler de Víctor,
     4. guarda las claves como secretos del Worker (nunca en un archivo
        que se suba: el temporal se borra al terminar),
     5. apunta la dirección en datos/nube.json para el botón de WhatsApp.

   Sin TEAM_DOMAIN, POLICY_AUD y PANEL_SOCIOS el panel sube CERRADO:
   enseña «todavía no está configurado» y no deja entrar a nadie.
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
const DIR_NUBE = path.join(DIR_PANEL, 'nube');
const DIR_GENERADO = path.join(DIR_NUBE, 'generado');
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
    vars,
    observability: { enabled: true },
  };
  const archivo = path.join(DIR_GENERADO, 'wrangler.json');
  fs.writeFileSync(archivo, JSON.stringify(configuracion, null, 2));
  return archivo;
}

async function subirSecretos(configuracion) {
  const secretos = {
    CLOUDFLARE_API_TOKEN: claves.CLOUDFLARE_API_TOKEN,
    SUPABASE_SECRET_KEY: claves.SUPABASE_SECRET_KEY,
    GITHUB_TOKEN: claves.GITHUB_TOKEN,
    PANEL_SOCIOS: claves.PANEL_SOCIOS,
    /* Nueva en cada subida: las páginas abiertas tendrán que recargarse. */
    PANEL_SECRETO: crypto.randomBytes(32).toString('hex'),
  };
  for (const k of Object.keys(secretos)) if (!secretos[k]) delete secretos[k];
  const temporal = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-panel-')), 'secretos.json');
  try {
    fs.writeFileSync(temporal, JSON.stringify(secretos), { mode: 0o600 });
    await wrangler(['secret', 'bulk', temporal, '--config', configuracion]);
  } finally {
    fs.rmSync(path.dirname(temporal), { recursive: true, force: true });
  }
  return Object.keys(secretos).filter(k => k !== 'PANEL_SECRETO');
}

async function principal() {
  const socios = String(claves.PANEL_SOCIOS || '').split(/[,;\s]+/).filter(s => s.includes('@'));
  const faltan = [
    !claves.CLOUDFLARE_API_TOKEN && 'CLOUDFLARE_API_TOKEN (visitas y encender/apagar)',
    !claves.SUPABASE_SECRET_KEY && 'SUPABASE_SECRET_KEY (cuentas y catálogo)',
    !socios.length && 'PANEL_SOCIOS (correos que pueden entrar)',
    !claves.TEAM_DOMAIN && 'TEAM_DOMAIN (de Cloudflare Access)',
    !claves.POLICY_AUD && 'POLICY_AUD (de Cloudflare Access)',
  ].filter(Boolean);

  prepararArchivos();
  const configuracion = escribirConfiguracion(await idAlmacen());
  if (ENSAYO) {
    await wrangler(['deploy', '--config', configuracion, '--dry-run', '--outdir', path.join(DIR_GENERADO, 'ensayo')]);
    decir(`Ensayo correcto: el panel se empaqueta sin errores (${path.join(DIR_GENERADO, 'ensayo')}). No se ha subido nada.`);
    if (faltan.length) decir(`Para subirlo de verdad faltan en .env.local:\n  - ${faltan.join('\n  - ')}`);
    return;
  }

  decir('Subiendo el panel a Cloudflare…');
  const salida = await wrangler(['deploy', '--config', configuracion]);
  const url = salida.match(/https:\/\/rwadar-panel\.[a-z0-9-]+\.workers\.dev/)?.[0] || null;
  const subidos = await subirSecretos(configuracion);
  fs.mkdirSync(path.join(DIR_PANEL, 'datos'), { recursive: true });
  fs.writeFileSync(path.join(DIR_PANEL, 'datos', 'nube.json'), JSON.stringify({ url, publicadoEl: new Date().toISOString() }, null, 2));

  decir(`\nPanel subido${url ? `: ${url}` : ''}`);
  decir(`Claves guardadas en Cloudflare: ${subidos.join(', ') || 'ninguna'}. Socios: ${socios.length}.`);
  if (faltan.length) {
    decir(`\nTodavía está CERRADO. Falta en rwadar-panel/.env.local:\n  - ${faltan.join('\n  - ')}`);
    if (!claves.TEAM_DOMAIN || !claves.POLICY_AUD) {
      decir('\nPara activar la puerta de entrada (una sola vez):');
      decir('  1. dash.cloudflare.com › Workers & Pages › rwadar-panel › Settings › Domains & Routes.');
      decir('  2. En «workers.dev» pulsa «Enable Cloudflare Access».');
      decir('  3. Copia los dos datos de la ventana a .env.local: TEAM_DOMAIN=… y POLICY_AUD=…');
      decir('  4. «Manage Cloudflare Access»: añade los correos de tus socios a la política.');
      decir('  5. Vuelve a ejecutar: npm.cmd run panel:nube');
    }
  } else {
    decir('\nListo. Manda el enlace a tus socios: entrarán con su correo y un código.');
  }
}

/* Se puede importar (lo hace demo/nube-local.mjs) sin que se suba nada. */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal().catch(e => { process.stderr.write(`\nNo se pudo subir el panel.\n${e.message}\n`); process.exit(1); });
}

export { prepararArchivos, DIR_GENERADO, FECHA_COMPATIBILIDAD };

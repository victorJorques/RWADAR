#!/usr/bin/env node
/* =====================================================================
   RWAdar · el panel de la nube, ejecutado en este ordenador
   ---------------------------------------------------------------------
       npm.cmd run panel:nube:demo

   Arranca el simulador de servicios y el Worker con `wrangler dev`, el
   mismo motor que usa Cloudflare, con enlaces personales de mentira.
   No sube nada ni toca nada real. Para entrar como un socio simulado:
     http://127.0.0.1:8789/?como=eric      (o victor, o samuel)
     http://127.0.0.1:8789/?como=intruso   un enlace que no vale
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { prepararArchivos, prepararEnlaces, huella, DIR_GENERADO, FECHA_COMPATIBILIDAD } from '../nube/publicar.mjs';

const require = createRequire(import.meta.url);
const { crearSimulador, entornoPanel } = require('./simulador.js');
const { comandoWrangler } = require('../lib/wrangler.js');
const { leerPublicos } = require('../lib/config.js');

const PUERTO = 8788;
const PUERTO_ENTRADA = 8789;
const DIR_DEMO = path.join(DIR_GENERADO, 'demo');
const enlaces = prepararEnlaces(['Víctor', 'Eric', 'Samuel']);
const porClave = { victor: enlaces['Víctor'], eric: enlaces.Eric, samuel: enlaces.Samuel, intruso: crypto.randomBytes(32).toString('base64url') };

const { servidor: simulador } = crearSimulador();
await new Promise(r => simulador.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${simulador.address().port}`;

/* Hace de «mensaje de WhatsApp»: manda al enlace personal elegido, con
   el mismo nombre de host con el que se abrió (las cookies lo exigen). */
http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PUERTO_ENTRADA}`);
  const host = String(req.headers.host || '').startsWith('localhost') ? 'localhost' : '127.0.0.1';
  const llave = porClave[url.searchParams.get('como')] || porClave.victor;
  res.writeHead(302, { Location: `http://${host}:${PUERTO}/entrar#${llave}` });
  res.end();
}).listen(PUERTO_ENTRADA, '127.0.0.1');

prepararArchivos();
fs.mkdirSync(DIR_DEMO, { recursive: true });
fs.writeFileSync(path.join(DIR_DEMO, 'wrangler.json'), JSON.stringify({
  name: 'rwadar-panel-demo', main: '../../worker.mjs', compatibility_date: FECHA_COMPATIBILIDAD,
  assets: { directory: '../publico', binding: 'ASSETS', run_worker_first: true },
  kv_namespaces: [{ binding: 'ALMACEN', id: '0'.repeat(32) }],
}, null, 2));
const vars = {
  ...entornoPanel(base),
  PANEL_ENLACES: JSON.stringify(Object.fromEntries(Object.entries(enlaces).map(([n, llave]) => [n, huella(llave)]))),
  PANEL_SECRETO: 'secreto-solo-para-la-demo-local',
};
/* Comillas simples: .dev.vars las lee tal cual (con dobles, el JSON de
   PANEL_ENLACES llegaría con barras invertidas y no se podría leer). */
fs.writeFileSync(path.join(DIR_DEMO, '.dev.vars'), Object.entries(vars).map(([k, v]) => `${k}='${v}'`).join('\n'));

const [cmd, argv] = comandoWrangler({ versionWrangler: leerPublicos().versionWrangler, wranglerFalso: '' },
  ['dev', '--config', path.join(DIR_DEMO, 'wrangler.json'), '--port', String(PUERTO), '--ip', '127.0.0.1', '--local']);
const hijo = spawn(cmd, argv, { cwd: DIR_DEMO, stdio: 'inherit', windowsHide: true });
process.stdout.write(`\nPanel de la nube (DEMOSTRACIÓN local, enlaces de mentira)\n  Como Víctor:  http://127.0.0.1:${PUERTO_ENTRADA}/?como=victor\n  Como Eric:    http://127.0.0.1:${PUERTO_ENTRADA}/?como=eric\n  Enlace falso: http://127.0.0.1:${PUERTO_ENTRADA}/?como=intruso\n\n`);
const salir = () => { hijo.kill(); process.exit(0); };
process.on('SIGINT', salir);
process.on('SIGTERM', salir);
hijo.on('exit', codigo => process.exit(codigo ?? 0));

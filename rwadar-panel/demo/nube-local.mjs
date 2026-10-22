#!/usr/bin/env node
/* =====================================================================
   RWAdar · el panel de la nube, ejecutado en este ordenador
   ---------------------------------------------------------------------
       npm.cmd run panel:nube:demo

   Arranca el simulador de servicios (con un «Cloudflare Access» de
   mentira) y el Worker con `wrangler dev`, el mismo motor que usa
   Cloudflare. No sube nada ni toca nada real. Abre
   http://127.0.0.1:8788/__demo/entrar?como=victor (o eric) para entrar
   como uno de los socios simulados.
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { webcrypto } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { prepararArchivos, DIR_GENERADO, FECHA_COMPATIBILIDAD } from '../nube/publicar.mjs';

const require = createRequire(import.meta.url);
const { crearSimulador, entornoPanel } = require('./simulador.js');
const { comandoWrangler } = require('../lib/wrangler.js');
const { leerPublicos } = require('../lib/config.js');

const PUERTO = 8788;
const PUERTO_ENTRADA = 8789;
const AUD = 'aud-demo';
const SOCIOS = { victor: 'victor@example.com', eric: 'eric@example.com', samuel: 'samuel@example.com' };
const DIR_DEMO = path.join(DIR_GENERADO, 'demo');
const { subtle } = webcrypto;
const b64url = d => Buffer.from(d).toString('base64url');

const par = await subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const jwk = { ...(await subtle.exportKey('jwk', par.publicKey)), kid: 'demo', alg: 'RS256' };
const { servidor: simulador } = crearSimulador({ jwks: [jwk] });
await new Promise(r => simulador.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${simulador.address().port}`;
const emisor = `${base}/access`;

async function pase(email) {
  const ahora = Math.floor(Date.now() / 1000);
  const cabeza = b64url(JSON.stringify({ alg: 'RS256', kid: 'demo', typ: 'JWT' }));
  const cuerpo = b64url(JSON.stringify({ iss: emisor, aud: [AUD], email, iat: ahora, exp: ahora + 8 * 3600 }));
  const firma = await subtle.sign('RSASSA-PKCS1-v1_5', par.privateKey, Buffer.from(`${cabeza}.${cuerpo}`));
  return `${cabeza}.${cuerpo}.${b64url(new Uint8Array(firma))}`;
}

/* Hace de pantalla de «Cloudflare Access»: deja la cookie del pase y
   manda al panel. Vive en otro puerto para no mezclarse con el Worker. */
http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PUERTO_ENTRADA}`);
  const email = SOCIOS[url.searchParams.get('como')] || url.searchParams.get('correo') || SOCIOS.victor;
  /* Las cookies no distinguen puertos: con el mismo nombre de host, el
     pase que se deja aquí llega también al Worker. */
  const host = String(req.headers.host || '127.0.0.1').split(':')[0] === 'localhost' ? 'localhost' : '127.0.0.1';
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><meta charset="utf-8"><script>document.cookie=${JSON.stringify(`CF_Authorization=${await pase(email)}; path=/`)};location.href='http://${host}:${PUERTO}/';</script>`);
}).listen(PUERTO_ENTRADA, '127.0.0.1');

prepararArchivos();
fs.mkdirSync(DIR_DEMO, { recursive: true });
fs.writeFileSync(path.join(DIR_DEMO, 'wrangler.json'), JSON.stringify({
  name: 'rwadar-panel-demo', main: '../../worker.mjs', compatibility_date: FECHA_COMPATIBILIDAD,
  assets: { directory: '../publico', binding: 'ASSETS', run_worker_first: true },
  kv_namespaces: [{ binding: 'ALMACEN', id: '0'.repeat(32) }],
}, null, 2));
const vars = { ...entornoPanel(base), TEAM_DOMAIN: emisor, POLICY_AUD: AUD, PANEL_PRUEBAS: '1', PANEL_SOCIOS: Object.values(SOCIOS).join(','), PANEL_SECRETO: 'secreto-solo-para-la-demo-local' };
fs.writeFileSync(path.join(DIR_DEMO, '.dev.vars'), Object.entries(vars).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join('\n'));

const [cmd, argv] = comandoWrangler({ versionWrangler: leerPublicos().versionWrangler, wranglerFalso: '' },
  ['dev', '--config', path.join(DIR_DEMO, 'wrangler.json'), '--port', String(PUERTO), '--ip', '127.0.0.1', '--local']);
const hijo = spawn(cmd, argv, { cwd: DIR_DEMO, stdio: 'inherit', windowsHide: true });
process.stdout.write(`\nPanel de la nube (DEMOSTRACIÓN local)\n  Entrar como Víctor: http://127.0.0.1:${PUERTO_ENTRADA}/?como=victor\n  Entrar como Eric:   http://127.0.0.1:${PUERTO_ENTRADA}/?como=eric\n  Alguien de fuera:   http://127.0.0.1:${PUERTO_ENTRADA}/?correo=intruso@example.com\n\n`);
const salir = () => { hijo.kill(); process.exit(0); };
process.on('SIGINT', salir);
process.on('SIGTERM', salir);
hijo.on('exit', codigo => process.exit(codigo ?? 0));

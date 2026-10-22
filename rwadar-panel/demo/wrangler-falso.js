/* RWAdar · panel · sustituto de wrangler para pruebas y demostración.
   Recibe los mismos argumentos que `wrangler pages deploy` y, en vez de
   subir nada a Cloudflare, avisa al simulador de que hay un despliegue
   nuevo. Comprueba que el panel le pasa lo que pasaría a wrangler. */
'use strict';
const fs = require('fs');

const args = process.argv.slice(2);
const valor = nombre => args[args.indexOf(nombre) + 1];
const fallar = mensaje => { process.stderr.write(`✘ [ERROR] ${mensaje}\n`); process.exit(1); };

if (args[0] !== 'pages' || args[1] !== 'deploy') fallar('Uso: pages deploy <dir> …');
for (const archivo of ['_worker.js', 'index.html']) {
  if (!fs.existsSync(`${args[2]}/${archivo}`)) fallar(`No encuentro ${archivo} en ${args[2]}`);
}
if (valor('--project-name') !== 'rwadar' || valor('--branch') !== 'main') fallar('Proyecto o rama inesperados');
if (!process.env.CLOUDFLARE_API_TOKEN) fallar('Falta CLOUDFLARE_API_TOKEN');

setTimeout(async () => {
  const res = await fetch(`${process.env.RWADAR_PANEL_CLOUDFLARE_API}/__wrangler`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` },
    body: JSON.stringify({ mensaje: valor('--commit-message') }),
  });
  if (!res.ok) fallar(`El simulador respondió ${res.status}`);
  process.stdout.write('✨ Deployment complete! (simulado)\n');
}, Number(process.env.RWADAR_WRANGLER_ESPERA_MS || 1200));

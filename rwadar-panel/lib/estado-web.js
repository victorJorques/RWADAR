/* RWAdar · panel · ¿está encendida la web?
   Solo mira: el panel no apaga ni enciende la web (Víctor se lo pide a
   Claude o a Codex cuando haga falta). Solo usa fetch: vale también en
   la nube. */
'use strict';
const { pedir } = require('./pedir');

async function estadoWeb(config) {
  const r = await pedir(`${config.web}/`, { redirect: 'manual' });
  return { encendida: r.ok, estadoHttp: r.estado, ms: r.ms };
}

module.exports = { estadoWeb };

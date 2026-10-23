/* RWAdar · panel · cómo se lanza wrangler (solo en el ordenador, donde
   tiene la sesión de Víctor). Lo usan nube/publicar.mjs y la demo de la
   nube. Misma versión y misma forma que rwadar-publicar.js. */
'use strict';

function comandoWrangler(config, args) {
  const paquete = `wrangler@${config.versionWrangler}`;
  /* Igual que rwadar-publicar.js: Node 24 no lanza .cmd sin shell. */
  if (process.platform === 'win32') return [process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npx.cmd', '--yes', paquete, ...args]];
  return ['npx', ['--yes', paquete, ...args]];
}

module.exports = { comandoWrangler };

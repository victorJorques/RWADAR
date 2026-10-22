/* RWAdar · panel · subir la página de mantenimiento con wrangler (solo en
   el ordenador, donde wrangler tiene la sesión de Víctor). Se usa la
   misma versión que rwadar-publicar.js y la misma forma de lanzarlo. */
'use strict';
const { execFile } = require('child_process');
const { ErrorPanel } = require('./pedir');
const { MARCA } = require('./constantes');

const ESPERA_WRANGLER_MS = 5 * 60 * 1000;

function comandoWrangler(config, args) {
  if (config.wranglerFalso) return [process.execPath, [config.wranglerFalso, ...args]];
  const paquete = `wrangler@${config.versionWrangler}`;
  /* Igual que rwadar-publicar.js: Node 24 no lanza .cmd sin shell. */
  if (process.platform === 'win32') return [process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npx.cmd', '--yes', paquete, ...args]];
  return ['npx', ['--yes', paquete, ...args]];
}

function lanzarWrangler(config, args, { cwd = config.dirMantenimiento, envExtra = {} } = {}) {
  const [cmd, argv] = comandoWrangler(config, args);
  const env = { ...process.env, CLOUDFLARE_ACCOUNT_ID: config.cloudflareCuenta, ...envExtra };
  if (config.cloudflareToken && !envExtra.SIN_TOKEN) env.CLOUDFLARE_API_TOKEN = config.cloudflareToken;
  return new Promise((resolver, rechazar) => {
    execFile(cmd, argv, { cwd, env, timeout: ESPERA_WRANGLER_MS, maxBuffer: 8 * 1024 * 1024, windowsHide: true },
      (error, salida, errores) => {
        const cola = `${salida}\n${errores}`.trim().split(/\r?\n/).slice(-8).join('\n');
        if (error) return rechazar(new ErrorPanel('Cloudflare (wrangler) no aceptó la operación', { estado: 502, detalle: cola }));
        resolver(String(salida));
      });
  });
}

function crearSubidaMantenimiento(config) {
  return () => lanzarWrangler(config, ['pages', 'deploy', config.dirMantenimiento,
    '--project-name', config.proyecto, '--branch', 'main', '--commit-message', MARCA, '--commit-dirty=true']);
}

module.exports = { comandoWrangler, lanzarWrangler, crearSubidaMantenimiento };

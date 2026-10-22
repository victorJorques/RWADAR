/* RWAdar · panel · lectura de GitHub con el programa `gh` (solo en el
   ordenador): usa la sesión que Víctor ya tiene iniciada, así el panel
   nunca ve esa clave. */
'use strict';
const { execFile } = require('child_process');
const fs = require('fs');
const { ErrorPanel } = require('./pedir');

const GH_WINDOWS = 'C:\\Program Files\\GitHub CLI\\gh.exe';

function ejecutableGh() {
  return process.platform === 'win32' && fs.existsSync(GH_WINDOWS) ? GH_WINDOWS : 'gh';
}

function leerConGh(ruta) {
  return new Promise((resolver, rechazar) => {
    execFile(ejecutableGh(), ['api', ruta.replace(/^\//, '')], { timeout: 20000, maxBuffer: 8 * 1024 * 1024, windowsHide: true },
      (error, salida, errores) => {
        if (error) {
          const motivo = error.code === 'ENOENT' ? 'no encuentro el programa gh' : String(errores || error.message).trim().slice(0, 200);
          return rechazar(new ErrorPanel(`GitHub (gh): ${motivo}`, { estado: 502, codigo: 'gh' }));
        }
        try { resolver(JSON.parse(salida)); } catch { rechazar(new ErrorPanel('GitHub (gh) devolvió algo que no es JSON', { estado: 502 })); }
      });
  });
}

module.exports = { leerConGh };

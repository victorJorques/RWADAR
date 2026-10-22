/* RWAdar · panel · comprobación «a fondo» (solo en el ordenador).
   Lanza .github/comprobar-publicado.mjs, el mismo control que pasa la web
   después de cada publicación (página a página contra el repositorio).
   Si el repositorio local va por delante de lo publicado, saldrán
   diferencias que no son errores de la web. */
'use strict';
const path = require('path');
const { execFile } = require('child_process');

function crearAFondo(config) {
  return function aFondo() {
    if (!/^https:\/\/[a-z0-9.-]+\.pages\.dev$/.test(config.web)) {
      return Promise.resolve({ disponible: false, correctas: 0, fallos: [], motivo: 'Solo se puede lanzar contra la web real (*.pages.dev).' });
    }
    const script = path.join(config.raiz, '.github', 'comprobar-publicado.mjs');
    return new Promise(resolver => {
      execFile(process.execPath, [script, config.web], { cwd: config.raiz, timeout: 180000, maxBuffer: 8 * 1024 * 1024, windowsHide: true },
        (error, salida) => {
          const lineas = String(salida || '').split(/\r?\n/);
          const correctas = lineas.filter(l => /^\s+OK\s/.test(l)).length;
          const fallos = lineas.filter(l => /^\s+FALLA\s/.test(l)).map(l => l.replace(/^\s+FALLA\s+/, ''));
          resolver({ disponible: true, correctas, fallos, motivo: error && !fallos.length ? String(error.message).slice(0, 200) : null });
        });
    });
  };
}

module.exports = { crearAFondo };

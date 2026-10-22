/* RWAdar · panel · almacén en archivos (panel del ordenador).
   Guarda pequeños estados (qué despliegue había antes de apagar) y el
   registro de acciones, una línea JSON por acción, en datos/ (Git lo
   ignora: lleva correos). En la nube lo mismo vive en KV
   (nube/almacen-kv.js), con la misma forma. */
'use strict';
const fs = require('fs');
const path = require('path');

const MAX_LEIDAS = 300;
const NOMBRE = /^[a-z0-9-]+$/;

function crearAlmacenArchivos(dirDatos) {
  const archivoRegistro = path.join(dirDatos, 'registro.jsonl');
  const ruta = clave => {
    if (!NOMBRE.test(clave)) throw new Error(`Clave de almacén no válida: ${clave}`);
    return path.join(dirDatos, `${clave}.json`);
  };

  return {
    archivoRegistro,
    async leer(clave) {
      try { return JSON.parse(fs.readFileSync(ruta(clave), 'utf8')); } catch { return null; }
    },
    async guardar(clave, valor) {
      fs.mkdirSync(dirDatos, { recursive: true });
      fs.writeFileSync(ruta(clave), JSON.stringify(valor, null, 2));
    },
    async borrar(clave) {
      fs.rmSync(ruta(clave), { force: true });
    },
    async anotar({ accion, objetivo = null, resultado, detalle = null, quien = null }) {
      fs.mkdirSync(dirDatos, { recursive: true });
      const entrada = { fecha: new Date().toISOString(), accion, objetivo, resultado, detalle, quien };
      fs.appendFileSync(archivoRegistro, JSON.stringify(entrada) + '\n', 'utf8');
      return entrada;
    },
    async registro(limite = MAX_LEIDAS) {
      let texto;
      try { texto = fs.readFileSync(archivoRegistro, 'utf8'); } catch { return []; }
      const entradas = [];
      for (const linea of texto.split('\n')) {
        if (!linea.trim()) continue;
        try { entradas.push(JSON.parse(linea)); } catch { /* línea a medias: se ignora */ }
      }
      return entradas.reverse().slice(0, limite);
    },
  };
}

module.exports = { crearAlmacenArchivos };

'use strict';
/* =====================================================================
   RWAdar · «Novedades de RWAdar»: del archivo de la web a la copia de la app
   ---------------------------------------------------------------------
   La fuente es rwadar-site/datos/novedades-producto.json (la web la sirve en
   /datos/novedades-producto.json y la app la descarga de ahí). La app lleva
   una copia idéntica para verla sin red y antes de la primera descarga:
     rwadar-movil/lib/novedades-producto.js   (el mismo JSON, como objeto)
     rwadar-movil/fixtures/novedades-producto.ejemplo.json (el mismo texto)

     node rwadar-novedades-producto.js              valida y escribe las dos copias
     node rwadar-novedades-producto.js --comprobar  falla si no coinciden

   Valida con el modelo de la web (assets/novedades-producto-modelo-20261112.js),
   que tiene las mismas reglas que lib/novedades-rwadar.js de la app. Sin red,
   sin catálogo y sin build. Va en la raíz (y no en rwadar-movil/scripts) para
   no tocar lo que vigila el guardián de la OTA. probar-web y
   rwadar-movil/tests/novedades-producto.test.cjs exigen que coincidan.
   ===================================================================== */
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = __dirname;
const FUENTE = path.join(RAIZ, 'rwadar-site', 'datos', 'novedades-producto.json');
const COPIA_JS = path.join(RAIZ, 'rwadar-movil', 'lib', 'novedades-producto.js');
const COPIA_EJEMPLO = path.join(RAIZ, 'rwadar-movil', 'fixtures', 'novedades-producto.ejemplo.json');

const CABECERA = `'use strict';
/* ---------------------------------------------------------------------
   Copia de respaldo de las «Novedades de RWAdar» (12/11/2026)
   ---------------------------------------------------------------------
   La fuente es rwadar-site/datos/novedades-producto.json (la web la sirve en
   https://rwadar.pages.dev/datos/novedades-producto.json). La app la lee de
   ahí; esta copia se usa sin red y antes de la primera descarga, y gana la
   versión más nueva de las dos (lib/novedades-rwadar.js).

   No se edita a mano: la escribe \`node rwadar-novedades-producto.js\` (en la
   raíz del repositorio), que copia también fixtures/novedades-producto.ejemplo.json.
   tests/novedades-producto.test.cjs y probar-web comprueban que los tres
   coinciden y que la app acepta el de la web.
   --------------------------------------------------------------------- */
`;

function copias() {
  const texto = fs.readFileSync(FUENTE, 'utf8');
  require('./rwadar-site/assets/novedades-producto-modelo-20261112.js').validarTexto(texto);
  const objeto = JSON.stringify(JSON.parse(texto), null, 2);
  return {
    [COPIA_JS]: `${CABECERA}const NOVEDADES_PRODUCTO = ${objeto};\n\nmodule.exports = { NOVEDADES_PRODUCTO };\n`,
    [COPIA_EJEMPLO]: texto,
  };
}

function diferencias() {
  return Object.entries(copias())
    .filter(([ruta, contenido]) => !fs.existsSync(ruta) || fs.readFileSync(ruta, 'utf8') !== contenido)
    .map(([ruta]) => path.relative(RAIZ, ruta));
}

module.exports = { copias, diferencias, FUENTE, COPIA_JS, COPIA_EJEMPLO };

if (require.main === module) {
  try {
    if (process.argv.includes('--comprobar')) {
      const malas = diferencias();
      if (malas.length) {
        console.error(`La copia de la app no es la de la web (${malas.join(', ')}): ejecuta node rwadar-novedades-producto.js`);
        process.exitCode = 1;
      } else console.log('Novedades de RWAdar: la web y la copia de la app coinciden.');
    } else {
      for (const [ruta, contenido] of Object.entries(copias())) fs.writeFileSync(ruta, contenido);
      console.log('Novedades de RWAdar: copia de la app al día (lib/novedades-producto.js y el ejemplo).');
    }
  } catch (error) {
    console.error(`Novedades de RWAdar: ${error.message}`);
    process.exitCode = 1;
  }
}

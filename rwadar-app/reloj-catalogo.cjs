'use strict';
/* Reloj de las pruebas de la web (node -r ./rwadar-app/reloj-catalogo.cjs …).

   La web lleva incrustada una copia del catálogo que caduca a los siete días.
   Pasado ese plazo, rwadar-publicar.js --local ya no puede derivar la fecha
   del pie y test:web fallaba en todas las ramas aunque el código estuviera
   bien. Si la copia incrustada ha caducado, las pruebas corren con el reloj
   en el día siguiente a su lote y lo dicen; si está vigente, no se toca nada.
   La frescura de lo publicado la vigilan la compuerta de publicación y
   .github/comprobar-publicado.mjs, no estas pruebas. */
const fs = require('fs');
const path = require('path');

const JS = path.join(__dirname, '..', 'rwadar-site', 'assets', 'catalogo-publico-20261022.js');
const fuente = fs.readFileSync(JS, 'utf8');
const lote = fuente.match(/"verificado_lote_el":"(\d{4}-\d{2}-\d{2})"/);
const vigencia = Number((fuente.match(/"vigencia_lote_dias":(\d+)/) || [])[1] || 7);
if (lote) {
  const DIA = 86400000;
  const desde = Date.parse(`${lote[1]}T00:00:00Z`);
  const ahora = Date.now();
  if (ahora >= desde + vigencia * DIA) {
    const destino = desde + DIA + 10 * 3600000;
    const delta = destino - ahora;
    const Real = Date;
    class Reloj extends Real {
      constructor(...a) { if (a.length) super(...a); else super(Real.now() + delta); }
      static now() { return Real.now() + delta; }
    }
    globalThis.Date = Reloj;
    if (!process.env.RWADAR_RELOJ_AVISADO) {
      process.env.RWADAR_RELOJ_AVISADO = '1';
      console.warn(`AVISO: el catálogo incrustado (lote del ${lote[1]}) ha caducado; ` +
        `las pruebas de la web corren con el reloj en ${new Real(destino).toISOString()}.`);
    }
  }
}

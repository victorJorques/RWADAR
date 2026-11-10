'use strict';
/* =====================================================================
   RWAdar · /datos/noticias.json para las apps y webs ya instaladas
   ---------------------------------------------------------------------
   Desde el rediseño de Inicio (10/11/2026) cada noticia lleva «imagen», la
   clave de su foto editorial. La app que ya tienen los usuarios (la OTA del
   10/11 sobre 26664c9) y la web de esa versión, si sigue en la caché del
   navegador, leen /datos/noticias.json con un motor que rechaza cualquier
   campo desconocido: con «imagen», su sección de noticias daría error hasta
   que cada usuario reciba la OTA nueva.

   Por eso se publican dos archivos:
   - /datos/noticias-v2.json: la copia exacta del JSON verificado del ciclo
     (rwadar-site/datos/noticias-v2.json), con «imagen». Lo leen la web nueva
     y la app nueva.
   - /datos/noticias.json: el mismo archivo sin «imagen», con la forma de
     antes (rwadar-site/datos/noticias.json). Lo sigue leyendo la app
     instalada. Este script lo deriva del v2 y lo valida con una copia
     congelada del motor de esa app (motor-app-26664c9.cjs, el
     rwadar-movil/lib/noticias-sector.js de 26664c9, con su sha256 fijado).

     node rwadar-app/noticias/noticias-v1.cjs              (escribe el v1)
     node rwadar-app/noticias/noticias-v1.cjs --comprobar  (solo mira)

   Cuando ninguna app instalada lea ya /datos/noticias.json (una versión de
   la app que solo lea el v2 en la tienda y la OTA nueva aplicada), se puede
   retirar; hasta entonces, rwadar-publicar.js se para si no está al día.
   ===================================================================== */
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '../..');
const ORIGEN_V2 = path.join(RAIZ, 'rwadar-site/datos/noticias-v2.json');
const DESTINO_V1 = path.join(RAIZ, 'rwadar-site/datos/noticias.json');
const MOTOR_INSTALADO = path.join(__dirname, 'motor-app-26664c9.cjs');
// sha256 de `git show 26664c9:rwadar-movil/lib/noticias-sector.js`.
const SHA_MOTOR_INSTALADO = '84e6e3a60b2416685f5823e0c432f2c617e2ecb454aee504b0586eec5a3fb6cc';

/* El motor de la app instalada, comprobado byte a byte antes de usarlo. */
function motorInstalado() {
  const bytes = fs.readFileSync(MOTOR_INSTALADO);
  const sha = crypto.createHash('sha256').update(bytes).digest('hex');
  if (sha !== SHA_MOTOR_INSTALADO) throw new Error('motor-app-26664c9.cjs no es el de la app instalada (sha256 distinto)');
  return require(MOTOR_INSTALADO);
}

/* El v1: el v2 tal cual, sin «imagen» en ninguna noticia. */
function derivarV1(textoV2) {
  const datos = JSON.parse(textoV2);
  if (!datos || !Array.isArray(datos.noticias)) throw new Error('noticias-v2.json: formato desconocido');
  const v1 = { ...datos, noticias: datos.noticias.map(n => {
    if (!n || typeof n !== 'object') return n;
    const { imagen, ...resto } = n; // eslint-disable-line no-unused-vars
    return resto;
  }) };
  return JSON.stringify(v1, null, 2) + '\n';
}

/* Lo que la app instalada aceptaría: lanza un error si no. */
function validarComoAppInstalada(textoV1) {
  return motorInstalado().validarNoticias(JSON.parse(textoV1));
}

/* Problemas del v1 frente al v2 y frente a la app instalada (vacío si está bien). */
function comprobar({ origen = ORIGEN_V2, destino = DESTINO_V1 } = {}) {
  const problemas = [];
  const esperado = derivarV1(fs.readFileSync(origen, 'utf8'));
  if (!fs.existsSync(destino) || fs.readFileSync(destino, 'utf8') !== esperado) {
    problemas.push('rwadar-site/datos/noticias.json no es noticias-v2.json sin «imagen» (ejecuta node rwadar-app/noticias/noticias-v1.cjs)');
  }
  try { validarComoAppInstalada(esperado); }
  catch (e) { problemas.push(`la app instalada no aceptaría el v1: ${e.message}`); }
  return problemas;
}

module.exports = { ORIGEN_V2, DESTINO_V1, SHA_MOTOR_INSTALADO, motorInstalado, derivarV1, validarComoAppInstalada, comprobar };

if (require.main === module) {
  if (process.argv.includes('--comprobar')) {
    const problemas = comprobar();
    if (problemas.length) { for (const p of problemas) console.error('NOTICIAS V1: ' + p); process.exitCode = 1; }
    else console.log('Noticias v1: al día con noticias-v2.json y aceptadas por el motor de la app instalada.');
  } else {
    const texto = derivarV1(fs.readFileSync(ORIGEN_V2, 'utf8'));
    validarComoAppInstalada(texto);
    fs.writeFileSync(DESTINO_V1, texto);
    console.log('Escrito rwadar-site/datos/noticias.json (sin «imagen»), aceptado por el motor de la app instalada.');
  }
}

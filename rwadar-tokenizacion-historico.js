'use strict';
/* =====================================================================
   RWAdar · histórico de «La tokenización en el mundo» para la web
   ---------------------------------------------------------------------
   El flujo «Foto diaria de la tokenización» guarda una foto al día en la
   rama datos-tokenizacion. rwadar-publicar.js publica ese histórico en
   /datos/tokenizacion-historico.json, de dónde lo lee el servidor web.

   De dónde sale, por orden:
   1. RWADAR_TOKENIZACION_HISTORICO: la ruta del archivo que publicar.yml
      deja fuera del repositorio (el árbol sigue limpio para las compuertas);
   2. si no está esa variable (publicación desde un ordenador), la rama
      origin/datos-tokenizacion que haya traído el último «git fetch»;
   3. si no hay nada válido, la semilla de main
      (rwadar-site/datos/tokenizacion-historico.json).
   Se valida entero (rwadar-movil/lib/tokenizacion.js) y se le suman las
   fotos de la semilla. La web nunca deja de construirse por este dato, pero
   si un destino remoto solo lleva la semilla se avisa bien alto: la web
   perdería los periodos de 7 días, 30 días, 1 año y el histórico.
   ===================================================================== */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const modelo = require('./rwadar-movil/lib/tokenizacion');

const MAX_BYTES = 2 * 1024 * 1024;
const REF = 'origin/datos-tokenizacion';

function leerRamaGit(cwd) {
  return execFileSync('git', ['show', `${REF}:tokenizacion-historico.json`], {
    cwd, encoding: 'utf8', maxBuffer: MAX_BYTES, stdio: ['ignore', 'pipe', 'ignore'] });
}

function fusionar(texto, semilla) {
  if (typeof texto !== 'string' || Buffer.byteLength(texto, 'utf8') > MAX_BYTES) throw new Error('ocupa más de 2 MB');
  let historico = modelo.validarHistorico(JSON.parse(texto));
  if (!historico.fotos.length) throw new Error('no tiene ninguna foto');
  for (const foto of semilla.fotos) historico = modelo.anadirFoto(historico, foto).historico;
  return historico;
}

/* { historico, origen, soloSemilla } */
function historicoTokenizacion({
  dirSitio,
  entorno = process.env,
  cwd = __dirname,
  leerRama = leerRamaGit,
  avisar = mensaje => console.warn(mensaje),
} = {}) {
  const semilla = modelo.validarHistorico(JSON.parse(
    fs.readFileSync(path.join(dirSitio, 'datos', 'tokenizacion-historico.json'), 'utf8')));
  const conSemilla = { historico: semilla, origen: 'la semilla de main', soloSemilla: true };
  const ruta = entorno.RWADAR_TOKENIZACION_HISTORICO;
  if (ruta) {
    try {
      const estado = fs.lstatSync(ruta);
      if (!estado.isFile() || estado.size > MAX_BYTES) throw new Error('no es un archivo normal de 2 MB como mucho');
      return { historico: fusionar(fs.readFileSync(ruta, 'utf8'), semilla), origen: 'la rama datos-tokenizacion', soloSemilla: false };
    } catch (e) {
      avisar(`AVISO: el histórico de la tokenización de ${ruta} no vale (${e.message}); se publica la semilla de main.`);
      return conSemilla;
    }
  }
  let texto;
  try { texto = leerRama(cwd); } catch { return conSemilla; }
  try {
    return { historico: fusionar(texto, semilla), origen: REF, soloSemilla: false };
  } catch (e) {
    avisar(`AVISO: el histórico de la tokenización de ${REF} no vale (${e.message}); se publica la semilla de main.`);
    return conSemilla;
  }
}

module.exports = { historicoTokenizacion, REF };

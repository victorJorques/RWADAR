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

/* ---- La serie de un año del gráfico «estilo bolsa» (11/11/2026) ----
   La rehace cada día el flujo «Foto diaria de la tokenización»
   (rwadar-app/tokenizacion/serie-diaria.mjs) en la misma rama. De dónde sale:
   RWADAR_TOKENIZACION_SERIE (publicar.yml), si no origin/datos-tokenizacion
   y, si no, la semilla de main (rwadar-site/datos/tokenizacion-serie.json).
   Entre la de la rama y la semilla gana la más reciente («generado»). Nunca
   bloquea la web: lo que no valga se avisa y queda la semilla.
   { serie, origen, soloSemilla } */
function leerSerieRamaGit(cwd) {
  return execFileSync('git', ['show', `${REF}:tokenizacion-serie.json`], {
    cwd, encoding: 'utf8', maxBuffer: MAX_BYTES, stdio: ['ignore', 'pipe', 'ignore'] });
}
function serieTokenizacion({
  dirSitio,
  entorno = process.env,
  cwd = __dirname,
  leerRama = leerSerieRamaGit,
  avisar = mensaje => console.warn(mensaje),
} = {}) {
  const semilla = modelo.validarSerie(JSON.parse(
    fs.readFileSync(path.join(dirSitio, 'datos', 'tokenizacion-serie.json'), 'utf8')));
  const conSemilla = { serie: semilla, origen: 'la semilla de main', soloSemilla: true };
  const elegir = (texto, origen) => {
    if (typeof texto !== 'string' || Buffer.byteLength(texto, 'utf8') > MAX_BYTES) throw new Error('ocupa más de 2 MB');
    const serie = modelo.validarSerie(JSON.parse(texto));
    if (serie.puntos.length < 2) throw new Error('tiene menos de dos días');
    return serie.generado >= semilla.generado ? { serie, origen, soloSemilla: false } : conSemilla;
  };
  const ruta = entorno.RWADAR_TOKENIZACION_SERIE;
  if (ruta) {
    try {
      const estado = fs.lstatSync(ruta);
      if (!estado.isFile() || estado.size > MAX_BYTES) throw new Error('no es un archivo normal de 2 MB como mucho');
      return elegir(fs.readFileSync(ruta, 'utf8'), 'la rama datos-tokenizacion');
    } catch (e) {
      avisar(`AVISO: la serie de la tokenización de ${ruta} no vale (${e.message}); se publica la semilla de main.`);
      return conSemilla;
    }
  }
  let texto;
  try { texto = leerRama(cwd); } catch { return conSemilla; }
  try { return elegir(texto, REF); } catch (e) {
    avisar(`AVISO: la serie de la tokenización de ${REF} no vale (${e.message}); se publica la semilla de main.`);
    return conSemilla;
  }
}

module.exports = { historicoTokenizacion, serieTokenizacion, REF };

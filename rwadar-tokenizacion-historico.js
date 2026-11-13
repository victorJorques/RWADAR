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

/* ---- Las series finas del gráfico (13/11/2026) ----
   Un punto cada 5 minutos de las últimas 24 horas y uno cada hora de los
   últimos 30 días, de los mismos tokens que la diaria. Las rehace el mismo
   flujo en la misma rama (tokenizacion-serie-fina.json) y se publican en
   /datos/tokenizacion-serie-fina.json, un archivo aparte: la app instalada
   sigue leyendo la diaria, que no cambia de forma. De dónde sale:
   RWADAR_TOKENIZACION_SERIE_FINA (publicar.yml), si no origin/datos-tokenizacion
   y, si no, la semilla de main (rwadar-site/datos/tokenizacion-serie-fina.json,
   «sin serie fina»). Solo se publica si casa con la diaria que se publica
   (la misma ejecución, los mismos tokens y el mismo último punto:
   seriesEnlazadas); si no, «sin serie fina» para esa diaria (serieFinaVacia)
   y el gráfico usa la diaria, como hasta ahora. Nunca bloquea la web.
   { fina, origen, enlazadas: ['5m', '1h'] o menos } */
function leerSerieFinaRamaGit(cwd) {
  return execFileSync('git', ['show', `${REF}:tokenizacion-serie-fina.json`], {
    cwd, encoding: 'utf8', maxBuffer: MAX_BYTES, stdio: ['ignore', 'pipe', 'ignore'] });
}
function serieFinaTokenizacion({
  dirSitio,
  diaria,
  entorno = process.env,
  cwd = __dirname,
  leerRama = leerSerieFinaRamaGit,
  avisar = mensaje => console.warn(mensaje),
} = {}) {
  const publicada = modelo.validarSerie(diaria);
  // La semilla se valida siempre: si está rota, que falle la publicación (es de main).
  modelo.validarSerieFina(JSON.parse(fs.readFileSync(path.join(dirSitio, 'datos', 'tokenizacion-serie-fina.json'), 'utf8')));
  const vacia = origen => ({ fina: modelo.serieFinaVacia(publicada), origen, enlazadas: [] });
  const elegir = (texto, origen) => {
    if (typeof texto !== 'string' || Buffer.byteLength(texto, 'utf8') > MAX_BYTES) throw new Error('ocupa más de 2 MB');
    const fina = modelo.validarSerieFina(JSON.parse(texto));
    const enlazadas = Object.keys(modelo.seriesEnlazadas(publicada, fina));
    if (!enlazadas.length) {
      avisar(`AVISO: la serie fina de ${origen} no casa con la diaria que se publica (generada el ${fina.generado}; la diaria, el ${publicada.generado}): se publica sin serie fina y el gráfico usa la diaria.`);
      return vacia('ninguna (no casa con la diaria)');
    }
    // Solo las que casan; la otra, null.
    const series = { '5m': enlazadas.includes('5m') ? fina.series['5m'] : null, '1h': enlazadas.includes('1h') ? fina.series['1h'] : null };
    return { fina: modelo.validarSerieFina({ ...fina, series }), origen, enlazadas };
  };
  const ruta = entorno.RWADAR_TOKENIZACION_SERIE_FINA;
  if (ruta) {
    try {
      const estado = fs.lstatSync(ruta);
      if (!estado.isFile() || estado.size > MAX_BYTES) throw new Error('no es un archivo normal de 2 MB como mucho');
      return elegir(fs.readFileSync(ruta, 'utf8'), 'la rama datos-tokenizacion');
    } catch (e) {
      avisar(`AVISO: la serie fina de la tokenización de ${ruta} no vale (${e.message}); se publica sin serie fina.`);
      return vacia('ninguna');
    }
  }
  let texto;
  try { texto = leerRama(cwd); } catch { return vacia('ninguna (la semilla de main)'); }
  try { return elegir(texto, REF); } catch (e) {
    avisar(`AVISO: la serie fina de la tokenización de ${REF} no vale (${e.message}); se publica sin serie fina.`);
    return vacia('ninguna');
  }
}

module.exports = { historicoTokenizacion, serieTokenizacion, serieFinaTokenizacion, REF };

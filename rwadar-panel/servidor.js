#!/usr/bin/env node
/* =====================================================================
   RWAdar · panel de control (en el ordenador)
   ---------------------------------------------------------------------
       npm run panel            (o doble clic en rwadar-panel/abrir-panel.cmd)
       npm run panel:demo       con datos simulados, sin tocar nada real

   Abre http://127.0.0.1:4180. Solo escucha en este PC: nadie de fuera
   puede entrar. Cada arranque crea una contraseña de sesión que va
   dentro de la página; sin ella la API no responde, así que otra web
   abierta en el navegador tampoco puede pulsar los botones por ti.

   La versión para compartir con los socios vive en nube/ y usa la misma
   API (lib/api.js) detrás de Cloudflare Access.
   ===================================================================== */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { cargarConfig, ARCHIVO_ENV } = require('./lib/config');
const { ErrorPanel } = require('./lib/pedir');
const { crearApi } = require('./lib/api');
const { crearAlmacenArchivos } = require('./lib/almacen-archivos');
const { crearSubidaMantenimiento } = require('./lib/wrangler');
const { leerConGh } = require('./lib/gh-cli');
const { crearAFondo } = require('./lib/a-fondo');

const DIR_PUBLICO = path.join(__dirname, 'publico');
const DIR_FUENTES = path.join(__dirname, '..', 'rwadar-site', 'assets', 'fuentes');
const MAX_CUERPO = 16 * 1024;
const QUIEN_LOCAL = 'ordenador de Víctor';
const TIPOS = Object.freeze({ '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' });
const ESTATICOS = new Set(['/panel.css', '/panel.js', '/util.js', '/vistas.js', '/vistas-datos.js', '/graficos.js', '/icono.svg']);
const FUENTES = /^\/fuentes\/(geist-normal-[0-9a-f]{12}|geist-mono-normal-[0-9a-f]{12})\.woff2$/;
const SEGURIDAD = Object.freeze({
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store',
});

/* Abre .env.local en el Bloc de notas; si no existe, lo crea a partir de
   la plantilla .env.example, que lleva las instrucciones dentro. */
function abrirArchivoClaves() {
  if (!fs.existsSync(ARCHIVO_ENV)) fs.copyFileSync(path.join(__dirname, '.env.example'), ARCHIVO_ENV);
  const [cmd, args] = process.platform === 'win32' ? ['notepad.exe', [ARCHIVO_ENV]]
    : process.platform === 'darwin' ? ['open', ['-t', ARCHIVO_ENV]] : ['xdg-open', [ARCHIVO_ENV]];
  execFile(cmd, args, () => {});
  return { abierto: true, archivo: ARCHIVO_ENV };
}

function extrasLocales(config) {
  if (config.modoDemo) return { subirMantenimiento: crearSubidaMantenimiento(config), archivoEnv: ARCHIVO_ENV };
  return {
    subirMantenimiento: crearSubidaMantenimiento(config),
    leerGithub: config.githubPorCli ? leerConGh : undefined,
    aFondo: crearAFondo(config),
    abrirClaves: abrirArchivoClaves,
    archivoEnv: ARCHIVO_ENV,
  };
}

function crearPanel(config = cargarConfig()) {
  const token = crypto.randomBytes(24).toString('hex');
  const almacen = crearAlmacenArchivos(config.dirDatos);
  const extras = { ...extrasLocales(config), urlNube: async () => (await almacen.leer('nube'))?.url || null };
  const api = crearApi({ config, almacen, extras });
  const anfitriones = new Set([`127.0.0.1:${config.puerto}`, `localhost:${config.puerto}`]);

  function responder(res, estado, cuerpo, tipo = 'application/json; charset=utf-8') {
    res.writeHead(estado, { ...SEGURIDAD, 'Content-Type': tipo });
    res.end(tipo.startsWith('application/json') ? JSON.stringify(cuerpo) : cuerpo);
  }

  function tokenValido(req) {
    const dado = Buffer.from(String(req.headers['x-panel-token'] || ''));
    const bueno = Buffer.from(token);
    return dado.length === bueno.length && crypto.timingSafeEqual(dado, bueno);
  }

  function leerCuerpo(req) {
    return new Promise((resolver, rechazar) => {
      let tam = 0;
      const trozos = [];
      req.on('data', t => {
        tam += t.length;
        if (tam > MAX_CUERPO) { rechazar(new ErrorPanel('Petición demasiado grande', { estado: 413 })); req.destroy(); return; }
        trozos.push(t);
      });
      req.on('end', () => {
        try { resolver(trozos.length ? JSON.parse(Buffer.concat(trozos).toString('utf8')) : {}); } catch { rechazar(new ErrorPanel('JSON no válido', { estado: 400 })); }
      });
      req.on('error', rechazar);
    });
  }

  function estatico(res, ruta) {
    if (ruta === '/' || ruta === '/index.html') {
      const html = fs.readFileSync(path.join(DIR_PUBLICO, 'index.html'), 'utf8').replace('__TOKEN__', token);
      return responder(res, 200, html, 'text/html; charset=utf-8');
    }
    if (ESTATICOS.has(ruta)) return responder(res, 200, fs.readFileSync(path.join(DIR_PUBLICO, ruta.slice(1))), TIPOS[path.extname(ruta)]);
    const fuente = ruta.match(FUENTES);
    if (fuente && fs.existsSync(path.join(DIR_FUENTES, `${fuente[1]}.woff2`))) {
      res.writeHead(200, { ...SEGURIDAD, 'Content-Type': 'font/woff2', 'Cache-Control': 'max-age=86400' });
      return res.end(fs.readFileSync(path.join(DIR_FUENTES, `${fuente[1]}.woff2`)));
    }
    return responder(res, 404, { ok: false, error: 'No existe' });
  }

  const servidor = http.createServer(async (req, res) => {
    try {
      /* Un nombre de host ajeno es un ataque de «DNS rebinding»: fuera. */
      if (!anfitriones.has(String(req.headers.host || ''))) return responder(res, 421, { ok: false, error: 'Host no permitido' });
      const url = new URL(req.url, `http://127.0.0.1:${config.puerto}`);
      if (!url.pathname.startsWith('/api/')) {
        if (req.method !== 'GET' && req.method !== 'HEAD') return responder(res, 405, { ok: false, error: 'Método no permitido' });
        return estatico(res, url.pathname);
      }
      if (!tokenValido(req)) return responder(res, 403, { ok: false, error: 'Sesión del panel no válida: recarga la página' });
      let cuerpo = {};
      if (req.method === 'POST') {
        const origen = req.headers.origin;
        if (origen && !anfitriones.has(origen.replace(/^http:\/\//, ''))) return responder(res, 400, { ok: false, error: 'Origen no permitido' });
        if (!String(req.headers['content-type'] || '').startsWith('application/json')) return responder(res, 400, { ok: false, error: 'Se esperaba JSON' });
        cuerpo = await leerCuerpo(req);
      }
      const r = await api.manejar({ metodo: req.method, url, cuerpo, quien: QUIEN_LOCAL });
      return responder(res, r.estado, r.cuerpo);
    } catch (e) {
      return responder(res, e instanceof ErrorPanel ? e.estado : 500, { ok: false, error: e.message || 'Error inesperado' });
    }
  });

  return { servidor, token, config };
}

function abrirNavegador(url) {
  const [cmd, args] = process.platform === 'win32' ? ['cmd.exe', ['/d', '/c', 'start', '', url]]
    : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
  execFile(cmd, args, { windowsHide: true }, () => {});
}

if (require.main === module) {
  const { servidor, config } = crearPanel();
  servidor.on('error', e => {
    process.stderr.write(e.code === 'EADDRINUSE'
      ? `El puerto ${config.puerto} ya está ocupado: ¿el panel ya está abierto? Prueba http://127.0.0.1:${config.puerto}\n`
      : `No pude arrancar el panel: ${e.message}\n`);
    process.exit(1);
  });
  servidor.listen(config.puerto, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${config.puerto}`;
    process.stdout.write(`\nPanel de control de RWAdar${config.modoDemo ? ' (DATOS SIMULADOS)' : ''}\n  ${url}\n  Cierra esta ventana para apagar el panel.\n\n`);
    if (process.argv.includes('--abrir')) abrirNavegador(url);
  });
}

module.exports = { crearPanel };

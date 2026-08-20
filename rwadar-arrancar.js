/* =====================================================================
   RWAdar · arrancar
   ---------------------------------------------------------------------
       node rwadar-arrancar.js

   Un solo comando para estar operativo. Dice en qué estado está todo
   —lo local, lo publicado y la base de datos— y levanta el servidor.

   Existe para no gastar media sesión averiguando cosas que se pueden
   comprobar en cuatro segundos: si el JavaScript compila, si lo que hay
   en línea es lo mismo que hay en local, y si alguna descartada se ha
   quedado sin fuente (que es lo único que impide publicar).
   ===================================================================== */
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const DIR   = __dirname;
const SITIO = path.join(DIR, 'rwadar-site');
const PUBLICADO = path.join(DIR, 'rwadar-publicado');
const HTML  = path.join(SITIO, 'index.html');
const API   = 'https://exgpmjpaaebyoolpwced.supabase.co/rest/v1';
const CLAVE = 'sb_publishable_LIyeUqwsQGCqSwH6dtsaqQ_HUQ-RX8F';
const VIVO  = 'https://rwadar.netlify.app/';

const verde = t => `\x1b[32m${t}\x1b[0m`;
const rojo  = t => `\x1b[31m${t}\x1b[0m`;
const gris  = t => `\x1b[90m${t}\x1b[0m`;
const ok    = t => console.log('  ' + verde('ok') + '    ' + t);
const mal   = t => console.log('  ' + rojo('FALLA') + ' ' + t);

(async () => {
  console.log('\nRWAdar\n' + gris('─'.repeat(58)));

  /* ---- 1 · lo local ---- */
  const html = fs.readFileSync(HTML, 'utf8');
  const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(0);

  let recursoJS = '';
  try {
    const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi)];
    if (!scripts.length) throw new Error('index.html no declara el script propio externo');
    recursoJS = scripts.at(-1)[1];
    if (!recursoJS.startsWith('/assets/') || !recursoJS.endsWith('.js'))
      throw new Error('el script de aplicación debe ser un .js versionado de /assets/');
    const archivoJS = path.resolve(SITIO, '.' + recursoJS);
    if (!archivoJS.startsWith(path.resolve(SITIO) + path.sep) || !fs.existsSync(archivoJS))
      throw new Error('no se encuentra ' + recursoJS);
    const js = fs.readFileSync(archivoJS, 'utf8');
    new Function(js);
    const jsKb = (Buffer.byteLength(js, 'utf8') / 1024).toFixed(0);
    ok(`el JavaScript compila  ${gris(`(${recursoJS}, ${jsKb} kB; HTML ${kb} kB)`)}`);
  } catch (e) {
    mal('ERROR DEL JAVASCRIPT PUBLICABLE: ' + e.message);
    console.log('\n  No publiques hasta arreglarlo.\n');
  }

  const fichas = (html.match(/class="abrir"/g) || []).length;
  const fuera  = (html.match(/class="fila"/g)  || []).length;
  (fichas >= 1 && fuera >= 1 ? ok : mal)(
    `pre-renderizado: ${fichas} fichas y ${fuera} descartadas en el HTML`);

  const DEBIDOS = [
    'index.html','privacidad.html','og.png','rwadar.csv','sitemap.xml','robots.txt',
    '404.html','_headers','_redirects','.well-known','assets',
    'manifest.webmanifest','sw.js','icono-192.png','icono-512.png','icono-maskable-512.png',
    'google6b2e3e5f58b7e557.html','c9417d2d5003bb9a41fee63c7f5ec00f.txt',
  ];
  const hay = fs.readdirSync(SITIO);
  const sobran = hay.filter(f => !DEBIDOS.includes(f));
  const faltan = DEBIDOS.filter(f => !hay.includes(f));
  (sobran.length || faltan.length ? mal : ok)(
    sobran.length ? `en rwadar-site/ hay archivos que NO deberían publicarse: ${sobran.join(', ')}`
      : faltan.length ? `faltan archivos en rwadar-site/: ${faltan.join(', ')}`
      : `la carpeta publicable tiene sus ${DEBIDOS.length} archivos, ni uno más`);

  const seguridad = path.join(SITIO, '.well-known', 'security.txt');
  (fs.existsSync(seguridad) ? ok : mal)(
    fs.existsSync(seguridad)
      ? 'security.txt está incluido en la carpeta publicable'
      : 'falta .well-known/security.txt');

  const privacidad = fs.readFileSync(path.join(SITIO, 'privacidad.html'), 'utf8');
  if (/data-deploy-blocker=["']legal["']/.test(privacidad)) {
    mal('la publicación productiva está bloqueada por decisiones legales pendientes');
  }

  /* El CLI de Netlify deja un .netlify en el directorio desde el que se
     ejecuta, y ahí dentro apunta a una carpeta a publicar. Llegó a apuntar
     a Downloads entera —extractos del banco incluidos—, así que si vuelve
     a aparecer conviene verlo antes que después. Publicar siempre con
     rwadar-publicar.js, que pasa --dir y --site explícitos, lo evita. */
  const toml = path.join(DIR, '.netlify', 'netlify.toml');
  if (fs.existsSync(toml)) {
    const destino = (fs.readFileSync(toml, 'utf8').match(/publish\s*=\s*"([^"]*)"/) || [])[1] || '';
    const apuntaBien = destino.replace(/\\\\/g, '\\').toLowerCase().endsWith('rwadar-publicado');
    (apuntaBien ? ok : mal)(apuntaBien
      ? '.netlify apunta a rwadar-publicado'
      : `.netlify quiere publicar "${destino}", que NO es rwadar-publicado: bórralo`);
  }

  /* ---- 2 · la base de datos ---- */
  const pide = async ruta => {
    const r = await fetch(API + ruta, { headers: { apikey: CLAVE } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  };
  try {
    const [radar, desc, emisiones] = await Promise.all([
      pide('/radar_publico?select=nombre,verificada_el'),
      pide('/plataformas?estado=eq.descartada&select=nombre,fuentes(url)'),
      pide('/emisiones_publicas?select=slug,estado'),
    ]);
    const sinFuente = desc.filter(d => !(d.fuentes || []).length);
    ok(`Supabase responde: ${radar.length} en el radar, ${desc.length} descartadas, ${emisiones.length} emisiones`);
    if (sinFuente.length) {
      mal(`${sinFuente.length} DESCARTADA(S) SIN FUENTE: ${sinFuente.map(d => d.nombre).join(', ')}`);
      console.log('        ' + rojo('No publicar. Es riesgo legal, no una preferencia.'));
    } else {
      ok('ninguna descartada sin fuente ' + gris('(el invariante se cumple)'));
    }
    const fechas = radar.map(p => p.verificada_el).filter(Boolean).sort();
    if (fechas.length) console.log(gris(`        última verificación en la base: ${fechas[fechas.length - 1]}`));
  } catch (e) {
    mal('no se pudo consultar Supabase: ' + e.message + gris('  (¿sin red?)'));
  }

  /* ---- 3 · lo publicado ---- */
  try {
    const r = await fetch(VIVO, { cache: 'no-store' });
    const vivo = await r.text();
    const indexGenerado = path.join(PUBLICADO, 'index.html');
    if (!fs.existsSync(indexGenerado))
      throw new Error('falta rwadar-publicado; ejecuta primero el publicador en modo local');
    const htmlPublicable = fs.readFileSync(indexGenerado, 'utf8');
    const scriptsPublicados = [...htmlPublicable.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi)];
    if (!scriptsPublicados.length) throw new Error('el index generado no declara su JavaScript');
    const recursoJSPublicado = scriptsPublicados.at(-1)[1];
    if (!/^\/assets\/[a-z0-9._-]+\.[a-f0-9]{12}\.js$/i.test(recursoJSPublicado)) {
      throw new Error('el JavaScript generado no tiene una huella de contenido válida');
    }
    /* RUM está desactivado y una inyección inesperada es un cambio de código,
       no una cola tolerable. La comparación es contra el árbol adelgazado que
       se despliega, no contra la fuente comentada. */
    const tieneRum = /netlify-rum-container|data-netlify-rum/i.test(vivo);
    (tieneRum ? mal : ok)('Netlify RUM no está inyectado');
    const igual = !tieneRum && vivo === htmlPublicable;
    (igual ? ok : mal)(igual
      ? 'lo publicado coincide con lo local'
      : 'lo publicado NO coincide con lo local');
    if (!igual) console.log(gris('        hay cambios sin publicar: node rwadar-publicar.js --produccion'));

    if (recursoJSPublicado) {
      const archivoJS = path.resolve(PUBLICADO, '.' + recursoJSPublicado);
      const remotoJS = await fetch(new URL(recursoJSPublicado, VIVO), { cache: 'no-store' });
      const jsVivo = await remotoJS.text();
      const jsLocal = fs.readFileSync(archivoJS, 'utf8');
      (remotoJS.ok && jsVivo === jsLocal ? ok : mal)(
        remotoJS.ok && jsVivo === jsLocal
          ? 'el recurso JavaScript publicado coincide con el local'
          : `el recurso JavaScript publicado NO coincide (HTTP ${remotoJS.status})`);
    }
    (vivo.includes('google-site-verification') ? ok : mal)('la verificación de Google sigue en línea');
  } catch (e) {
    mal('no se pudo leer el sitio publicado: ' + e.message);
  }

  /* ---- 4 · a trabajar ---- */
  console.log(gris('─'.repeat(58)));
  console.log('  Dónde está cada cosa  ' + gris('→ RWADAR-MAPA.md'));
  console.log('  Por qué está así      ' + gris('→ RWADAR-ESTADO.md (tiene índice)'));
  console.log('  Publicar              ' + gris('→ node rwadar-publicar.js --produccion'));
  console.log(gris('─'.repeat(58)) + '\n');

  execFile('node', [path.join(DIR, 'rwadar-servir.js')], { stdio: 'inherit' });
  console.log('  La web    → http://localhost:4173');
  console.log('  Sonidos   → http://localhost:4173/banco\n');
  console.log(gris('  (Ctrl+C para parar)'));
})();

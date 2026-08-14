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

  try {
    const js = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
    new Function(js);
    ok(`el JavaScript compila  ${gris(`(index.html, ${kb} kB)`)}`);
  } catch (e) {
    mal('ERROR DE SINTAXIS en index.html: ' + e.message);
    console.log('\n  No publiques hasta arreglarlo.\n');
  }

  const fichas = (html.match(/class="abrir"/g) || []).length - 1;
  const fuera  = (html.match(/class="fila"/g)  || []).length - 1;
  (fichas >= 1 && fuera >= 1 ? ok : mal)(
    `pre-renderizado: ${fichas} fichas y ${fuera} descartadas en el HTML`);

  const DEBIDOS = [
    'index.html','privacidad.html','og.png','rwadar.csv','sitemap.xml','robots.txt',
    '404.html','_headers',
    'google6b2e3e5f58b7e557.html','c9417d2d5003bb9a41fee63c7f5ec00f.txt',
  ];
  const hay = fs.readdirSync(SITIO);
  const sobran = hay.filter(f => !DEBIDOS.includes(f));
  const faltan = DEBIDOS.filter(f => !hay.includes(f));
  (sobran.length || faltan.length ? mal : ok)(
    sobran.length ? `en rwadar-site/ hay archivos que NO deberían publicarse: ${sobran.join(', ')}`
      : faltan.length ? `faltan archivos en rwadar-site/: ${faltan.join(', ')}`
      : `la carpeta publicable tiene sus ${DEBIDOS.length} archivos, ni uno más`);

  /* El CLI de Netlify deja un .netlify en el directorio desde el que se
     ejecuta, y ahí dentro apunta a una carpeta a publicar. Llegó a apuntar
     a Downloads entera —extractos del banco incluidos—, así que si vuelve
     a aparecer conviene verlo antes que después. Publicar siempre con
     rwadar-publicar.js, que pasa --dir y --site explícitos, lo evita. */
  const toml = path.join(DIR, '.netlify', 'netlify.toml');
  if (fs.existsSync(toml)) {
    const destino = (fs.readFileSync(toml, 'utf8').match(/publish\s*=\s*"([^"]*)"/) || [])[1] || '';
    const apuntaBien = destino.replace(/\\\\/g, '\\').toLowerCase().endsWith('rwadar-site');
    (apuntaBien ? ok : mal)(apuntaBien
      ? '.netlify apunta a rwadar-site'
      : `.netlify quiere publicar "${destino}", que NO es rwadar-site: bórralo`);
  }

  /* ---- 2 · la base de datos ---- */
  const pide = async ruta => {
    const r = await fetch(API + ruta, { headers: { apikey: CLAVE } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  };
  try {
    const [radar, desc] = await Promise.all([
      pide('/radar_publico?select=nombre,verificada_el'),
      pide('/plataformas?estado=eq.descartada&select=nombre,fuentes(url)'),
    ]);
    const sinFuente = desc.filter(d => !(d.fuentes || []).length);
    ok(`Supabase responde: ${radar.length} en el radar, ${desc.length} descartadas`);
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
    /* No se pueden comparar tamaños a pelo: Netlify inyecta al servir su
       script de analítica (`netlify-rum-container`) después de nuestro
       `</script>`, así que lo publicado siempre pesa ~500 caracteres más
       aunque sea idéntico. Se compara el prefijo hasta el final de nuestro
       código, que es lo único que controlamos.

       Ojo si esto empieza a fallar sin motivo: Netlify también reescribe
       el HTML por dentro. Con las URL limpias activadas convierte
       href="/pagina.html" en href='/pagina' —comillas simples incluidas—
       y entonces el prefijo deja de coincidir aunque el contenido sea el
       mismo. La solución es enlazar ya sin `.html`, no relajar la
       comprobación. Pasó al publicar la política de privacidad. */
    const nuestro = html.slice(0, html.lastIndexOf('</script>') + 9);
    const igual = vivo.startsWith(nuestro);
    (igual ? ok : mal)(igual
      ? 'lo publicado coincide con lo local'
      : 'lo publicado NO coincide con lo local');
    if (!igual) console.log(gris('        hay cambios sin publicar: node rwadar-publicar.js'));
    (vivo.includes('google-site-verification') ? ok : mal)('la verificación de Google sigue en línea');
  } catch (e) {
    mal('no se pudo leer el sitio publicado: ' + e.message);
  }

  /* ---- 4 · a trabajar ---- */
  console.log(gris('─'.repeat(58)));
  console.log('  Dónde está cada cosa  ' + gris('→ RWADAR-MAPA.md'));
  console.log('  Por qué está así      ' + gris('→ RWADAR-ESTADO.md (tiene índice)'));
  console.log('  Publicar              ' + gris('→ node rwadar-publicar.js'));
  console.log(gris('─'.repeat(58)) + '\n');

  execFile('node', [path.join(DIR, 'rwadar-servir.js')], { stdio: 'inherit' });
  console.log('  La web    → http://localhost:4173');
  console.log('  Sonidos   → http://localhost:4173/banco\n');
  console.log(gris('  (Ctrl+C para parar)'));
})();

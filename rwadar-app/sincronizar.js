/* =====================================================================
   RWAdar · sincroniza la web con la base de datos
   ---------------------------------------------------------------------
   Lee el contenido desde Supabase y reescribe los arrays P, FUERA y EMI
   dentro del JavaScript externo versionado de la web.

   Por qué así y no leyendo desde el navegador: si la página pidiera los
   datos al cargar, el robot de Google volvería a encontrarla vacía y
   perderíamos el pre-renderizado. Generando en tiempo de publicación,
   la base de datos manda y el HTML sigue pre-renderizado. Mantener los
   datos en un recurso externo permite una CSP sin JavaScript inline.
   ===================================================================== */
const fs = require('fs');
const path = require('path');

const URL_BASE = 'https://exgpmjpaaebyoolpwced.supabase.co/rest/v1';
const CLAVE = 'sb_publishable_IjVAwxotgiimcVqI3Nnn3Q_dk7UOB5n';
const SITIO = path.join(__dirname, '..', 'rwadar-site');
const JS = path.join(SITIO, 'assets', 'rwadar-20260820.js');
const CSV = path.join(SITIO, 'rwadar.csv');

async function pedir(ruta) {
  const r = await fetch(`${URL_BASE}/${ruta}`, { headers: { apikey: CLAVE } });
  if (!r.ok) throw new Error(`${ruta} -> HTTP ${r.status}: ${await r.text()}`);
  return r.json();
}

/* Literal seguro para JavaScript externo. Aunque `</script>` no cierra un
   recurso externo, neutralizar los signos y separadores evita que el mismo
   dato se convierta en inyección si en el futuro se mueve de contexto. */
const j = (s) => JSON.stringify(s == null ? '' : String(s))
  .replace(/</g, '\\u003c')
  .replace(/>/g, '\\u003e')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');

const esHttps = (valor) => {
  try { return new URL(String(valor)).protocol === 'https:'; }
  catch { return false; }
};

function escribirAtomico(archivo, contenido) {
  const temporal = `${archivo}.tmp-${process.pid}`;
  fs.writeFileSync(temporal, contenido, 'utf8');
  try { fs.renameSync(temporal, archivo); }
  finally { if (fs.existsSync(temporal)) fs.rmSync(temporal, { force: true }); }
}

/* Excel y otras hojas interpretan como fórmula las celdas que empiezan por
   =, +, - o @, incluso tras espacios/tabuladores. El apóstrofo fuerza texto
   antes de aplicar el escapado CSV normal. */
function celdaCSV(valor) {
  let texto = String(valor == null ? '' : valor);
  if (/^[\t\r\n ]*[=+\-@]/.test(texto)) texto = "'" + texto;
  return `"${texto.replace(/"/g, '""')}"`;
}

async function main() {
  const [radar, fuera, emisiones] = await Promise.all([
    pedir('radar_publico?select=*'),
    pedir('plataformas?estado=eq.descartada&select=nombre,etiqueta_descarte,motivo_descarte,' +
      'fuentes(url,titulo)&order=nombre'),
    pedir('emisiones_publicas?select=*&estado=in.(abierta,programada,en_estudio)'),
  ]);

  if (!radar.length || !fuera.length) throw new Error('la base devolvió listas vacías');

  /* Una lista vacía de emisiones es un dato legítimo. Un error de red, de
     permisos o una vista ausente no lo es: Promise.all ya habrá detenido la
     publicación en vez de transformar el fallo en un escaparate vacío. */
  for (const e of emisiones) {
    if (!e || !String(e.titulo || '').trim() || !String(e.plataforma || '').trim() ||
        !String(e.categoria || '').trim() || !esHttps(e.url) || !esHttps(e.plataforma_web) ||
        !['abierta','programada','en_estudio'].includes(e.estado) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(String(e.verificada_el || '')) ||
        ['ticket_minimo','objetivo','captado','porcentaje'].some(k =>
          e[k] != null && (!Number.isFinite(Number(e[k])) || Number(e[k]) < 0)) ||
        ['rentabilidad','plazo_meses'].some(k =>
          e[k] != null && !Number.isFinite(Number(e[k])))) {
      throw new Error(`emisión pública inválida: ${e && (e.slug || e.titulo) || 'sin identificador'}`);
    }
  }

  const P = radar.map(p =>
    ` {n:${j(p.nombre)},cat:${j(p.categoria)},tipo:${j(p.actor)},reg:${j(p.region)},` +
    `cadenas:${j(p.cadenas)},ticket:${j(p.ticket)},acceso:${j(p.acceso)},web:${j(p.web)},` +
    `aval:${j(p.aval)},nota:${j(p.nota)},ver:${j(p.verificada_el)}},`
  ).join('\n');

  const F = fuera.map(f => {
    const fuentes = (f.fuentes || [])
      .map(s => `{url:${j(s.url)},titulo:${j(s.titulo)}}`)
      .join(',');
    return ` {n:${j(f.nombre)},badge:${j(f.etiqueta_descarte)},why:${j(f.motivo_descarte)},` +
           `fuentes:[${fuentes}]},`;
  }).join('\n');

  let script = fs.readFileSync(JS, 'utf8');

  const sustituir = (nombre, cuerpo) => {
    const ini = script.indexOf(`const ${nombre}=[`);
    if (ini < 0) throw new Error(`no encuentro el array ${nombre}`);
    const fin = script.indexOf('\n];', ini);
    if (fin < 0) throw new Error(`no encuentro el cierre de ${nombre}`);
    script = script.slice(0, ini) + `const ${nombre}=[\n${cuerpo}` + script.slice(fin);
  };

  /* Las claves van cortas porque este array viaja en el HTML de todos los
     visitantes. `pat` es si está patrocinada: viaja SIEMPRE, aunque hoy
     no cobremos, porque la web la etiqueta y eso no puede depender de que
     alguien se acuerde de añadirlo el día que se cobre. */
  const E = emisiones.map(e =>
    ` {s:${j(e.slug)},t:${j(e.titulo)},res:${j(e.resumen)},pl:${j(e.plataforma)},` +
    `plw:${j(e.plataforma_web)},cat:${j(e.categoria)},col:${j(e.color)},ub:${j(e.ubicacion)},` +
    `mon:${j(e.moneda)},min:${Number(e.ticket_minimo) || 0},obj:${Number(e.objetivo) || 0},` +
    `cap:${Number(e.captado) || 0},pct:${Number(e.porcentaje) || 0},` +
    `rent:${e.rentabilidad == null ? 'null' : Number(e.rentabilidad)},` +
    `plazo:${e.plazo_meses == null ? 'null' : Number(e.plazo_meses)},` +
    `tipo:${j(e.tipo_rendimiento)},cierra:${j(e.cierra_el)},abre:${j(e.abre_en)},` +
    `est:${j(e.estado)},cont:${e.continua ? 'true' : 'false'},` +
    /* `esNo` y `vinc` viajan como null cuando no se han comprobado: la
       tarjeta solo avisa si vale exactamente false, nunca por un hueco.
       Decir "no disponible en España" de algo que no hemos mirado sería
       el mismo pecado que inventar una rentabilidad. */
    `esNo:${e.disponible_es == null ? 'null' : (e.disponible_es ? 'true' : 'false')},` +
    `vinc:${e.vinculante == null ? 'null' : (e.vinculante ? 'true' : 'false')},` +
    `rest:${j(e.acceso_restringido)},rentNo:${e.rentabilidad_no_publicada ? 'true' : 'false'},` +
    `url:${j(e.url)},ver:${j(e.verificada_el)},pat:${e.patrocinada ? 'true' : 'false'}},`
  ).join('\n');

  sustituir('P', P);
  sustituir('FUERA', F);
  sustituir('EMI', E);

  /* No sustituimos el archivo hasta haber generado y validado los tres
     bloques completos. Si el proceso cae antes, la fuente anterior queda. */
  new Function(script);
  escribirAtomico(JS, script);

  /* El mismo CSV que descarga el botón de la página, pero como archivo de
     verdad en una dirección estable. El botón exporta lo que el visitante
     tenga filtrado, que es mejor para él pero no existe para nadie más:
     un rastreador no puede pulsar un botón, y el `distribution` de los
     datos estructurados necesita una URL que se pueda abrir. Se genera
     aquí porque es donde ya están los datos en la mano. */
  const cabecera = ['Estado','Nombre','Categoria','Tipo','Region','Cadenas',
                    'Entrada','Acceso','Web','Descripcion','Por que','Fuentes'];
  const filas = [
    ...radar.map(p => ['En el radar', p.nombre, p.categoria, p.actor, p.region,
      p.cadenas, p.ticket, p.acceso, p.web, p.nota, p.aval, '']),
    ...fuera.map(f => ['Descartada', f.nombre, '', '', '', '', '', '', '', '',
      `${f.etiqueta_descarte}: ${f.motivo_descarte}`,
      (f.fuentes || []).map(s => s.url).join(' | ')]),
  ];
  /* El ﻿ de delante es la marca de orden de bytes. Sin ella, Excel en
     español abre el archivo como Windows-1252 y "Asia-Pacífico" se lee
     "Asia-PacÃ­fico". Los analizadores serios la descartan sin rechistar,
     así que sale gratis. El botón de la página hace lo mismo. */
  escribirAtomico(CSV,
    '﻿' + [cabecera.join(','), ...filas.map(r => r.map(celdaCSV).join(','))].join('\n') + '\n');

  console.log(`Sincronizado desde Supabase: ${radar.length} en el radar, ${fuera.length} descartadas y ${emisiones.length} emisiones.`);
  console.log(`rwadar.csv regenerado: ${filas.length} filas.`);
}

module.exports = { celdaCSV };
if (require.main === module) {
  main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
}

/* =====================================================================
   RWAdar · sincroniza la web con la base de datos
   ---------------------------------------------------------------------
   Lee el contenido desde Supabase y reescribe los arrays P, FUERA y EMI
   en las DOS versiones de la web que hay en el disco.

   Por qué así y no leyendo desde el navegador: si la página pidiera los
   datos al cargar, el robot de Google volvería a encontrarla vacía y
   perderíamos el pre-renderizado. Generando en tiempo de publicación,
   la base de datos manda y el HTML sigue siendo completo desde el
   primer byte.

   Por qué las dos: hasta el 28 de agosto de 2026 esto solo tocaba
   `rwadar-site/`, así que la versión que hizo Codex —la más avanzada en
   móvil— tenía los datos congelados en el día que se construyó. Una
   plataforma descartada en la base no llegaba a ella. Ahora las dos beben
   de la misma fuente. Ver `RWADAR-APAGADO.md`.
   ===================================================================== */
const fs = require('fs');
const path = require('path');

const URL_BASE = 'https://exgpmjpaaebyoolpwced.supabase.co/rest/v1';
const CLAVE = 'sb_publishable_IjVAwxotgiimcVqI3Nnn3Q_dk7UOB5n';
const SITIO = path.join(__dirname, '..', 'rwadar-site');
const HTML = path.join(SITIO, 'index.html');
const CSV = path.join(SITIO, 'rwadar.csv');

/* La versión de Codex lleva su JavaScript aparte y con el hash en el
   nombre, así que se busca en vez de escribirse a mano: si se reconstruye,
   el hash cambia y esto sigue encontrándolo. Si la carpeta no está, no
   pasa nada: se sincroniza solo lo que haya. */
function jsDeCodex() {
  const dir = path.join(__dirname, '..', 'rwadar-version-codex', 'assets');
  if (!fs.existsSync(dir)) return null;
  const js = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
  return js.length === 1 ? path.join(dir, js[0]) : null;
}

async function pedir(ruta) {
  const r = await fetch(`${URL_BASE}/${ruta}`, { headers: { apikey: CLAVE } });
  if (!r.ok) throw new Error(`${ruta} -> HTTP ${r.status}: ${await r.text()}`);
  return r.json();
}

/* Escapa para incrustar en una cadena JS de comillas dobles */
const j = (s) => JSON.stringify(s == null ? '' : String(s));

(async () => {
  const radar = await pedir('radar_publico?select=*');
  const fuera = await pedir(
    'plataformas?estado=eq.descartada&select=nombre,etiqueta_descarte,motivo_descarte,' +
    'fuentes(url,titulo)&order=nombre'
  );

  if (!radar.length || !fuera.length) throw new Error('la base devolvió listas vacías');

  /* Las emisiones abiertas. Se piden aparte y con red debajo: mientras la
     migración 18 no esté aplicada en producción, la vista no existe y la
     base responde con un error. Eso NO puede tumbar la publicación de la
     web entera, así que aquí se traduce a "no hay emisiones todavía" y la
     página enseña su estado vacío, que ya está escrito. */
  let emisiones = [];
  try {
    emisiones = await pedir('emisiones_publicas?select=*&estado=eq.abierta');
  } catch (e) {
    console.log('Sin emisiones: la vista emisiones_publicas todavía no existe en la base.');
    console.log('(se aplica con db/18_emisiones.sql; la web sale con su estado vacío)');
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

  /* Se sustituye sobre un texto cualquiera, no sobre una variable global,
     porque ahora hay dos ficheros que actualizar y el procedimiento es
     idéntico en los dos. */
  const sustituir = (texto, nombre, cuerpo, donde) => {
    const ini = texto.indexOf(`const ${nombre}=[`);
    if (ini < 0) throw new Error(`no encuentro el array ${nombre} en ${donde}`);
    const fin = texto.indexOf('\n];', ini);
    if (fin < 0) throw new Error(`no encuentro el cierre de ${nombre} en ${donde}`);
    return texto.slice(0, ini) + `const ${nombre}=[\n${cuerpo}` + texto.slice(fin);
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

  const destinos = [{ ruta: HTML, nombre: 'rwadar-site/index.html' }];
  const codex = jsDeCodex();
  if (codex) destinos.push({ ruta: codex, nombre: 'rwadar-version-codex/' + path.basename(codex) });

  for (const d of destinos) {
    let texto = fs.readFileSync(d.ruta, 'utf8');
    texto = sustituir(texto, 'P', P, d.nombre);
    texto = sustituir(texto, 'FUERA', F, d.nombre);
    texto = sustituir(texto, 'EMI', E, d.nombre);
    fs.writeFileSync(d.ruta, texto, 'utf8');
    console.log(`  sincronizado: ${d.nombre}`);
  }
  if (!codex) console.log('  (no hay rwadar-version-codex/: solo se sincroniza rwadar-site)');

  /* El mismo CSV que descarga el botón de la página, pero como archivo de
     verdad en una dirección estable. El botón exporta lo que el visitante
     tenga filtrado, que es mejor para él pero no existe para nadie más:
     un rastreador no puede pulsar un botón, y el `distribution` de los
     datos estructurados necesita una URL que se pueda abrir. Se genera
     aquí porque es donde ya están los datos en la mano. */
  const col = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
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
  fs.writeFileSync(CSV,
    '﻿' + [cabecera.join(','), ...filas.map(r => r.map(col).join(','))].join('\n') + '\n', 'utf8');

  console.log(`Sincronizado desde Supabase: ${radar.length} en el radar, ${fuera.length} descartadas.`);
  console.log(`rwadar.csv regenerado: ${filas.length} filas.`);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });

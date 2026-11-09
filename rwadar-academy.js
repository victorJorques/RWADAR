/* =====================================================================
   RWAdar · Academy: de las lecciones en Markdown a la web y a la app
   ---------------------------------------------------------------------
   La fuente de verdad son los archivos de rwadar-academy/lecciones/, tal
   como los entrega el equipo editorial. Este script los lee, comprueba que
   tienen todo lo que la especificación exige y escribe:

     rwadar-site/academy/index.html          índice de la Academy
     rwadar-site/academy/<slug>.html         una página por lección publicada
     rwadar-site/index.html                  el bloque de lecciones de la portada
     rwadar-site/sitemap.xml                 las URL de la Academy
     rwadar-movil/lib/academy-contenido.js   las mismas lecciones para la app

   Uso:  node rwadar-academy.js              genera
         node rwadar-academy.js --comprobar  solo comprueba que todo está al día

   No toca la red ni Supabase. Si una lección tiene un fallo de formato, se
   para y dice cuál: es preferible a publicar una página rota.
   ===================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const DIR_FUENTE = path.join(RAIZ, 'rwadar-academy');
const DIR_LECCIONES = path.join(DIR_FUENTE, 'lecciones');
const DIR_WEB = path.join(RAIZ, 'rwadar-site', 'academy');
const INDEX_WEB = path.join(RAIZ, 'rwadar-site', 'index.html');
const SITEMAP = path.join(RAIZ, 'rwadar-site', 'sitemap.xml');
const DATOS_APP = path.join(RAIZ, 'rwadar-movil', 'lib', 'academy-contenido.js');

const ORIGEN = 'https://rwadar.pages.dev';
const CSS = '/assets/academy-20261002.css';
const JS = '/assets/academy-20261002.js';
/* Candado del índice y del bloque de la portada (petición de Víctor del
   08/11/2026): sin sesión, las lecciones salen difuminadas y con un candado;
   al entrar, se abren. Hoja y script propios, compartidos por las dos páginas. */
const CANDADO_CSS = '/assets/academy-candado-20261108.css';
const CANDADO_JS = '/assets/academy-candado-20261108.js';
const ANALITICA = '/assets/analitica-20260927.js';
const PALABRAS_POR_MINUTO = 200;
const ESTADOS = new Set(['borrador', 'en_revision', 'publicado', 'retirado']);
const ACCESOS = ['cuenta', 'publico'];
/* Con "acceso": "cuenta" las lecciones no se indexan: el worker añade además
   X-Robots-Tag: noindex. El índice /academy/ sigue indexable. */
const ROBOTS_INDEXABLE = 'index,follow,max-snippet:-1,max-image-preview:large';
const ROBOTS_CON_CUENTA = 'noindex, nofollow';
/* Adónde lleva «Crea tu cuenta gratis»: /acceso abre «Crear cuenta gratis» y
   vuelve a la Academy al confirmar (contrato del 05/11/2026). */
const ALTA_ACADEMY = '/acceso?volver=/academy/';
/* «Ya tengo cuenta: entrar» del candado: el mismo sitio, abierto en «Entrar»
   (acceso.js lee vista=entrar). Tras entrar, vuelve a /academy/. */
const ENTRAR_ACADEMY = '/acceso?volver=/academy/&vista=entrar';
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre'];
const ICONO = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 104 104'><rect width='104' height='104' rx='24' fill='%230B0A0A'/><g fill='none' stroke='%2325E39A' stroke-width='2.6' opacity='.55'><circle cx='52' cy='52' r='40'/><circle cx='52' cy='52' r='28'/></g><path d='M52 52 L64.74 20.48 A34 34 0 0 1 83.52 39.26 Z' fill='%2325E39A' opacity='.45'/><path d='M65 52L58.5 63.26L45.5 63.26L39 52L45.5 40.74L58.5 40.74Z' fill='%2325E39A'/><path d='M65 52L58.5 63.26L45.5 63.26L39 52Z' fill='%230F7A57'/></svg>";

/* Partes del aviso común que algunas lecciones traen en una versión más
   corta. Se retiran de la lección porque el aviso común (más completo) ya
   las cubre. Si aparece una variante nueva, el generador se para. */
const VARIANTES_AVISO_COMUN = [
  'RWAdar no presta servicios de asesoramiento financiero regulado ni emite recomendaciones personalizadas.',
  'La normativa aplicable varía según la jurisdicción y evoluciona con el tiempo. Antes de tomar cualquier decisión, consulta con un profesional habilitado e independiente.',
];

class ErrorAcademy extends Error {}
const falla = (donde, mensaje) => { throw new ErrorAcademy(`${donde}: ${mensaje}`); };

/* ------------------------------------------------------------------ */
/* Utilidades                                                           */
/* ------------------------------------------------------------------ */
const esc = valor => String(valor)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const slugTexto = texto => String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function fechaValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor))) return false;
  const ms = Date.parse(`${valor}T00:00:00Z`);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === valor;
}

function fechaLarga(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

const dosCifras = n => String(n).padStart(2, '0');

/* ------------------------------------------------------------------ */
/* Markdown: el subconjunto que usan las lecciones                      */
/* ------------------------------------------------------------------ */

/* Frontmatter YAML plano: clave: valor, una por línea. */
function leerFrontmatter(texto, donde) {
  const m = texto.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) falla(donde, 'falta el frontmatter entre dos líneas ---');
  const datos = {};
  for (const linea of m[1].split('\n')) {
    if (!linea.trim()) continue;
    const par = linea.match(/^([a-z_]+):\s*(.*)$/);
    if (!par) falla(donde, `línea de frontmatter no válida: «${linea}»`);
    let valor = par[2].trim();
    if (/^".*"$/.test(valor)) valor = valor.slice(1, -1);
    else if (valor === 'true') valor = true;
    else if (valor === 'false') valor = false;
    else if (/^\d+$/.test(valor)) valor = Number(valor);
    datos[par[1]] = valor;
  }
  return { datos, cuerpo: texto.slice(m[0].length) };
}

/* Texto en línea → tramos planos: { v, b, i } texto, { br } salto de
   línea y { a, v } botón de acción (**[Etiqueta →]** en el original). */
function parsearInline(texto, donde, acciones) {
  const tramos = [];
  const empuja = tramo => {
    const ultimo = tramos[tramos.length - 1];
    if (tramo.v !== undefined && !tramo.a && ultimo && ultimo.v !== undefined && !ultimo.a &&
        !!ultimo.b === !!tramo.b && !!ultimo.i === !!tramo.i) {
      ultimo.v += tramo.v;
      return;
    }
    tramos.push(tramo);
  };
  const partes = String(texto).split(/(\*\*\[[^\]\n]+\]\*\*)/);
  for (const parte of partes) {
    if (!parte) continue;
    const accion = parte.match(/^\*\*\[([^\]\n]+)\]\*\*$/);
    if (accion) {
      const etiqueta = accion[1].replace(/\s*→\s*$/, '').trim();
      const destino = acciones && acciones[etiqueta];
      if (!destino) falla(donde, `botón sin destino conocido: «${etiqueta}». Añádelo a "acciones" en academy.json`);
      tramos.push({ a: destino, v: etiqueta });
      continue;
    }
    let b = false, i = false, buffer = '';
    const vacia = () => {
      if (!buffer) return;
      const tramo = { v: buffer };
      if (b) tramo.b = 1;
      if (i) tramo.i = 1;
      empuja(tramo);
      buffer = '';
    };
    for (let k = 0; k < parte.length; k++) {
      if (parte.startsWith('**', k)) { vacia(); b = !b; k++; continue; }
      const c = parte[k];
      if (c === '*') { vacia(); i = !i; continue; }
      if (c === '\n') { vacia(); tramos.push({ br: 1 }); continue; }
      buffer += c;
    }
    vacia();
    if (b || i) falla(donde, `negrita o cursiva sin cerrar en «${parte.slice(0, 70)}…»`);
  }
  return tramos;
}

const textoPlano = tramos => tramos.map(t => t.br ? ' ' : t.v || '').join('').replace(/\s+/g, ' ').trim();

const ES_BLOQUE = /^(?:---\s*$|#{2,4}\s|>|\||- |\d+\.\s|<details>)/;

function parsearBloques(texto, donde, acciones) {
  const lineas = texto.split('\n');
  const bloques = [];
  let i = 0;
  while (i < lineas.length) {
    const linea = lineas[i];
    if (!linea.trim()) { i++; continue; }
    if (/^---\s*$/.test(linea)) { bloques.push({ t: 'hr' }); i++; continue; }
    const titulo = linea.match(/^(#{2,4})\s+(.+)$/);
    if (titulo) {
      bloques.push({ t: `h${titulo[1].length}`, texto: parsearInline(titulo[2].trim(), donde, acciones) });
      i++; continue;
    }
    if (linea.startsWith('>')) {
      const interior = [];
      while (i < lineas.length && lineas[i].startsWith('>')) interior.push(lineas[i++].replace(/^> ?/, ''));
      bloques.push({ t: 'cita', bloques: parsearBloques(interior.join('\n'), donde, acciones) });
      continue;
    }
    if (linea.startsWith('|')) {
      const filas = [];
      while (i < lineas.length && lineas[i].startsWith('|')) filas.push(lineas[i++]);
      bloques.push(parsearTabla(filas, donde, acciones));
      continue;
    }
    if (/^- /.test(linea) || /^\d+\.\s/.test(linea)) {
      const ordenada = /^\d+\.\s/.test(linea);
      const patron = ordenada ? /^\d+\.\s+/ : /^- +/;
      const items = [];
      const inicio = ordenada ? Number(linea.match(/^(\d+)/)[1]) : 1;
      while (i < lineas.length && patron.test(lineas[i])) {
        items.push(parsearInline(lineas[i++].replace(patron, ''), donde, acciones));
        if (i < lineas.length && lineas[i].trim() && !patron.test(lineas[i]) && !ES_BLOQUE.test(lineas[i])) {
          falla(donde, `elemento de lista partido en varias líneas: «${lineas[i].slice(0, 60)}»`);
        }
      }
      const bloque = { t: ordenada ? 'ol' : 'ul', items };
      if (ordenada && inicio !== 1) bloque.inicio = inicio;
      bloques.push(bloque);
      continue;
    }
    if (/^<details>/.test(linea)) {
      const interior = [];
      i++;
      while (i < lineas.length && !/^<\/details>/.test(lineas[i])) interior.push(lineas[i++]);
      if (i >= lineas.length) falla(donde, '<details> sin cerrar');
      i++;
      const resumen = interior.length && interior[0].match(/^<summary>(.*)<\/summary>$/);
      if (!resumen) falla(donde, '<details> sin <summary> en su primera línea');
      bloques.push({ t: 'details', resumen: resumen[1],
        bloques: parsearBloques(interior.slice(1).join('\n'), donde, acciones) });
      continue;
    }
    if (/^\s*</.test(linea)) falla(donde, `HTML no admitido en la lección: «${linea.slice(0, 60)}»`);
    const parrafo = [];
    while (i < lineas.length && lineas[i].trim() && !ES_BLOQUE.test(lineas[i])) parrafo.push(lineas[i++]);
    bloques.push({ t: 'p', texto: parsearInline(parrafo.join('\n'), donde, acciones) });
  }
  return bloques;
}

function parsearTabla(filas, donde, acciones) {
  const celdas = fila => fila.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
  if (filas.length < 3) falla(donde, 'tabla sin filas de datos');
  const cabecera = celdas(filas[0]);
  const separador = celdas(filas[1]);
  if (separador.length !== cabecera.length || !separador.every(c => /^:?-{3,}:?$/.test(c))) {
    falla(donde, `la segunda fila de la tabla «${filas[0].slice(0, 50)}» no es un separador válido`);
  }
  const datos = filas.slice(2).map(celdas);
  for (const fila of datos) {
    if (fila.length !== cabecera.length) {
      falla(donde, `una fila de la tabla «${filas[0].slice(0, 50)}» tiene ${fila.length} celdas y la cabecera ${cabecera.length}`);
    }
  }
  return {
    t: 'tabla',
    cabecera: cabecera.map(c => parsearInline(c, donde, acciones)),
    filas: datos.map(fila => fila.map(c => parsearInline(c, donde, acciones))),
  };
}

/* Una cita que empieza con una línea en negrita es un recuadro: «La idea
   central», «Atención…», «Aviso…». La especificación pide distinguir los
   de idea de los de advertencia. */
function convertirCitas(bloques) {
  return bloques.map(bloque => {
    if (bloque.t !== 'cita') return bloque;
    const interior = convertirCitas(bloque.bloques);
    const primero = interior[0];
    if (!primero || primero.t !== 'p') return { ...bloque, bloques: interior };
    const corte = primero.texto.findIndex(t => t.br);
    const primeraLinea = corte === -1 ? primero.texto : primero.texto.slice(0, corte);
    if (!primeraLinea.length || !primeraLinea.every(t => t.b && !t.a)) return { ...bloque, bloques: interior };
    const titulo = textoPlano(primeraLinea);
    const resto = corte === -1 ? [] : primero.texto.slice(corte + 1);
    const cuerpo = resto.length ? [{ t: 'p', texto: resto }, ...interior.slice(1)] : interior.slice(1);
    const tipo = /^(atenci[oó]n|aviso|señal de alarma)/i.test(titulo) ? 'aviso' : 'idea';
    return { t: 'recuadro', tipo, titulo, bloques: cuerpo };
  });
}

const sinSeparadores = bloques => bloques.filter(b => b.t !== 'hr');

/* ------------------------------------------------------------------ */
/* Una lección completa                                                 */
/* ------------------------------------------------------------------ */
function cargarLeccion(archivo, contexto) {
  const nombre = path.basename(archivo);
  const donde = `lecciones/${nombre}`;
  const texto = fs.readFileSync(archivo, 'utf8').replace(/\r\n/g, '\n');
  const { datos: fm, cuerpo } = leerFrontmatter(texto, donde);

  for (const campo of ['slug', 'titulo', 'nivel', 'modulo', 'categoria', 'tiempo_lectura',
    'fecha_publicacion', 'ultima_revision_legal', 'jurisdiccion_referencia', 'quiz', 'cta', 'aviso_reforzado']) {
    if (fm[campo] === undefined || fm[campo] === '') falla(donde, `falta el campo «${campo}» en el frontmatter`);
  }
  const archivoEsperado = `${dosCifras(fm.modulo)}-${fm.slug}.md`;
  if (nombre !== archivoEsperado) falla(donde, `el archivo debería llamarse ${archivoEsperado}`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fm.slug)) falla(donde, 'el slug solo admite minúsculas, cifras y guiones');
  if (!Number.isInteger(fm.modulo) || fm.modulo < 1 || fm.modulo > 99) falla(donde, 'modulo no válido');
  const nivel = contexto.niveles.find(n => n.nombre.toLowerCase() === String(fm.nivel).toLowerCase());
  if (!nivel) falla(donde, `nivel desconocido: «${fm.nivel}»`);
  for (const campo of ['fecha_publicacion', 'ultima_revision_legal']) {
    if (!fechaValida(fm[campo])) falla(donde, `${campo} no es una fecha AAAA-MM-DD válida`);
  }
  if (fm.ultima_revision_legal < fm.fecha_publicacion) {
    falla(donde, 'la revisión legal no puede ser anterior a la publicación');
  }
  if (!contexto.destinos[fm.cta]) falla(donde, `el CTA «${fm.cta}» no está en "destinos" de academy.json`);
  if (fm.quiz !== true) falla(donde, 'todas las lecciones llevan quiz (quiz: true)');
  const config = contexto.config.get(fm.slug);
  if (!config) falla(donde, `falta la lección «${fm.slug}» en academy.json`);
  if (!ESTADOS.has(config.estado)) falla(donde, `estado no válido en academy.json: «${config.estado}»`);

  /* Tiempo de lectura: la entrega corrigió los minutos, que estaban a la
     mitad. Esta comprobación impide que vuelva a colarse el error. */
  const palabras = cuerpo.replace(/<[^>]+>/g, ' ').replace(/[#>*|`-]/g, ' ').split(/\s+/).filter(Boolean).length;
  const minutosCalculados = palabras / PALABRAS_POR_MINUTO;
  if (Math.abs(minutosCalculados - fm.tiempo_lectura) > 2) {
    falla(donde, `declara ${fm.tiempo_lectura} min y tiene ${palabras} palabras (≈${Math.round(minutosCalculados)} min a ${PALABRAS_POR_MINUTO} palabras/min)`);
  }

  const bloques = convertirCitas(parsearBloques(cuerpo, donde, contexto.acciones));
  const secciones = [];
  for (const bloque of bloques) {
    if (bloque.t === 'h2') secciones.push({ titulo: textoPlano(bloque.texto), bloques: [] });
    else if (!secciones.length) {
      if (bloque.t !== 'hr') falla(donde, 'hay contenido antes del primer título ##');
    } else secciones[secciones.length - 1].bloques.push(bloque);
  }
  const esperadas = [fm.titulo, 'Glosario', 'Comprueba lo que has aprendido', 'Da el siguiente paso', 'Aviso importante'];
  if (secciones.length !== esperadas.length ||
      !secciones.every((s, k) => k === 3 ? s.titulo.startsWith(esperadas[k]) : s.titulo === esperadas[k])) {
    falla(donde, `los títulos ## deben ser, en orden: ${esperadas.join(' · ')}. Hay: ${secciones.map(s => s.titulo).join(' · ')}`);
  }
  const [principal, glosarioSec, quizSec, pasoSec, legalSec] = secciones;

  /* Cabecera de la lección: metadatos, TL;DR y cuerpo. */
  const indiceTldr = principal.bloques.findIndex(b => b.t === 'h3' && /^En 30 segundos/.test(textoPlano(b.texto)));
  if (indiceTldr === -1) falla(donde, 'falta «### En 30 segundos (TL;DR)»');
  const tras = sinSeparadores(principal.bloques.slice(indiceTldr + 1));
  const listaTldr = tras[0];
  if (!listaTldr || listaTldr.t !== 'ol' || listaTldr.items.length !== 3) {
    falla(donde, 'el TL;DR debe ser una lista numerada de tres puntos');
  }
  const previos = sinSeparadores(principal.bloques.slice(0, indiceTldr));
  const meta = previos.find(b => b.t === 'p' && /^Nivel:/.test(textoPlano(b.texto)));
  if (!meta) falla(donde, 'falta la línea de metadatos (**Nivel:** …)');
  const metaTexto = textoPlano(meta.texto);
  if (!metaTexto.includes(`Lectura: ${fm.tiempo_lectura} min`)) {
    falla(donde, `la cabecera dice otro tiempo de lectura que el frontmatter (${fm.tiempo_lectura} min)`);
  }
  if (!metaTexto.includes(`Última revisión legal: ${fechaLarga(fm.ultima_revision_legal)}`)) {
    falla(donde, `la cabecera dice otra fecha de revisión legal que el frontmatter (${fechaLarga(fm.ultima_revision_legal)})`);
  }
  const preambulo = previos.filter(b => b !== meta);
  const cuerpoLeccion = tras.slice(1);
  if (!cuerpoLeccion.some(b => b.t === 'h3')) falla(donde, 'el cuerpo no tiene secciones ###');

  /* Glosario: «**Término**» y la definición en la línea siguiente. */
  const glosario = sinSeparadores(glosarioSec.bloques).map(b => {
    const corte = b.t === 'p' ? b.texto.findIndex(t => t.br) : -1;
    if (corte <= 0 || !b.texto.slice(0, corte).every(t => t.b)) {
      falla(donde, 'cada entrada del glosario es «**Término**» y la definición en la línea siguiente');
    }
    return { termino: textoPlano(b.texto.slice(0, corte)), definicion: b.texto.slice(corte + 1) };
  });
  if (glosario.length < 1) falla(donde, 'el glosario está vacío');

  /* Quiz: enunciado en negrita, opciones «- A) …» y <details> con la
     respuesta correcta y su explicación. */
  const quizBloques = sinSeparadores(quizSec.bloques);
  if (quizBloques.length % 3 !== 0) falla(donde, 'cada pregunta del quiz es enunciado + opciones + <details>');
  const quiz = [];
  for (let k = 0; k < quizBloques.length; k += 3) {
    const [enunciado, opciones, detalle] = quizBloques.slice(k, k + 3);
    const n = quiz.length + 1;
    const plano = enunciado.t === 'p' ? textoPlano(enunciado.texto) : '';
    if (!plano.startsWith(`${n}. `) || !enunciado.texto.every(t => t.b)) {
      falla(donde, `la pregunta ${n} debe empezar por «**${n}. …**»`);
    }
    if (!opciones || opciones.t !== 'ul' || opciones.items.length < 3 || opciones.items.length > 4) {
      falla(donde, `la pregunta ${n} necesita de 3 a 4 opciones`);
    }
    const letras = 'ABCD';
    const textosOpciones = opciones.items.map((item, o) => {
      const primero = item[0];
      const prefijo = `${letras[o]}) `;
      if (!primero || primero.v === undefined || primero.b || !primero.v.startsWith(prefijo)) {
        falla(donde, `la opción ${o + 1} de la pregunta ${n} debe empezar por «${prefijo}»`);
      }
      const resto = primero.v.slice(prefijo.length);
      return resto ? [{ ...primero, v: resto }, ...item.slice(1)] : item.slice(1);
    });
    if (!detalle || detalle.t !== 'details' || detalle.resumen !== 'Ver respuesta') {
      falla(donde, `la pregunta ${n} necesita su <details> con «Ver respuesta»`);
    }
    const primeroDetalle = detalle.bloques[0];
    const correcta = primeroDetalle && primeroDetalle.t === 'p' &&
      textoPlano(primeroDetalle.texto).match(/^Respuesta correcta: ([A-D])\./);
    if (!correcta) falla(donde, `la pregunta ${n} no indica «**Respuesta correcta: X.**»`);
    const indice = letras.indexOf(correcta[1]);
    if (indice >= textosOpciones.length) falla(donde, `la respuesta de la pregunta ${n} no está entre sus opciones`);
    const corte = primeroDetalle.texto.findIndex(t => t.br);
    const explicacion = [
      ...(corte === -1 ? [] : [{ t: 'p', texto: primeroDetalle.texto.slice(corte + 1) }]),
      ...detalle.bloques.slice(1),
    ];
    if (!explicacion.length) falla(donde, `la pregunta ${n} no tiene explicación (es obligatoria)`);
    const texto = enunciado.texto.map(t => ({ ...t })).filter(t => t.v !== undefined);
    texto[0].v = texto[0].v.replace(/^\d+\.\s+/, '');
    texto.forEach(t => { delete t.b; });
    quiz.push({ enunciado: texto, opciones: textosOpciones, correcta: indice, explicacion });
  }
  if (quiz.length < 1) falla(donde, 'el quiz no tiene preguntas');

  /* Siguiente paso: un recuadro con su propio título ###. */
  let bloquesPaso = sinSeparadores(pasoSec.bloques);
  if (bloquesPaso.length === 1 && bloquesPaso[0].t === 'cita') bloquesPaso = bloquesPaso[0].bloques;
  if (!bloquesPaso.length || bloquesPaso[0].t !== 'h3') falla(donde, '«Da el siguiente paso» empieza con un título ###');
  const siguientePaso = { titulo: textoPlano(bloquesPaso[0].texto), bloques: bloquesPaso.slice(1) };
  if (!siguientePaso.bloques.some(b => b.t === 'p' && b.texto.some(t => t.a))) {
    falla(donde, '«Da el siguiente paso» no tiene ningún botón');
  }

  /* Aviso legal: lo común se pinta desde aviso-legal.md; aquí solo queda lo
     propio de la lección. La línea final de revisión se compara con el
     frontmatter y se genera aparte. */
  const notaLegal = [];
  let lineaRevision = null;
  for (const bloque of sinSeparadores(legalSec.bloques)) {
    if (bloque.t !== 'p') falla(donde, 'el aviso legal solo admite párrafos');
    const plano = textoPlano(bloque.texto);
    if (/^Contenido revisado el /.test(plano)) { lineaRevision = plano; continue; }
    let resto = bloque.texto;
    let propio = true;
    for (const comun of [...contexto.avisoComun.map(textoPlano), ...VARIANTES_AVISO_COMUN]) {
      if (plano === comun) { propio = false; break; }
      if (plano.startsWith(comun + ' ')) {
        /* Párrafo común con una frase propia pegada al final. */
        resto = parsearInline(plano.slice(comun.length + 1), donde, contexto.acciones);
        break;
      }
    }
    if (!propio) continue;
    if (/^(RWAdar es un directorio|RWAdar no presta|La normativa aplicable)/.test(textoPlano(resto))) {
      falla(donde, `variante nueva del aviso común: «${textoPlano(resto).slice(0, 80)}…». Unifícala con aviso-legal.md`);
    }
    notaLegal.push({ t: 'p', texto: resto });
  }
  const revisionEsperada = `Contenido revisado el ${fechaLarga(fm.ultima_revision_legal)}. Jurisdicción de referencia: ${fm.jurisdiccion_referencia}.`;
  if (lineaRevision !== revisionEsperada) {
    falla(donde, `la línea de revisión debería ser «${revisionEsperada}»`);
  }
  if (fm.aviso_reforzado && !notaLegal.length) falla(donde, 'aviso_reforzado: true pero la lección no trae texto reforzado');

  const resumenCompleto = textoPlano(listaTldr.items[0]);
  const resumen = resumenCompleto.length <= 300 ? resumenCompleto
    : resumenCompleto.slice(0, 297).replace(/\s+\S*$/, '') + '…';

  return {
    slug: fm.slug,
    modulo: fm.modulo,
    titulo: fm.titulo,
    nivel: nivel.id,
    categoria: fm.categoria,
    minutos: fm.tiempo_lectura,
    palabras,
    fechaPublicacion: fm.fecha_publicacion,
    revisionLegal: fm.ultima_revision_legal,
    jurisdiccion: fm.jurisdiccion_referencia,
    avisoReforzado: fm.aviso_reforzado === true,
    cta: fm.cta,
    estado: config.estado,
    motivo: config.motivo || '',
    resumen,
    tldr: listaTldr.items,
    preambulo,
    cuerpo: cuerpoLeccion,
    glosario,
    quiz,
    siguientePaso,
    notaLegal,
    enlacesDeclarados: { anterior: fm.leccion_anterior || '', siguiente: fm.leccion_siguiente || '' },
  };
}

function cargarAvisoComun(acciones) {
  const donde = 'aviso-legal.md';
  const texto = fs.readFileSync(path.join(DIR_FUENTE, 'aviso-legal.md'), 'utf8').replace(/\r\n/g, '\n');
  const m = texto.match(/<!-- aviso:ini -->\n([\s\S]*?)\n<!-- aviso:fin -->/);
  if (!m) falla(donde, 'faltan las marcas <!-- aviso:ini --> y <!-- aviso:fin -->');
  const parrafos = parsearBloques(m[1], donde, acciones);
  if (!parrafos.length || !parrafos.every(b => b.t === 'p')) falla(donde, 'el aviso común solo admite párrafos');
  return parrafos.map(b => b.texto);
}

function cargarAcademy() {
  const config = JSON.parse(fs.readFileSync(path.join(DIR_FUENTE, 'academy.json'), 'utf8'));
  const donde = 'academy.json';
  /* Quién abre las lecciones en la web: "cuenta" o "publico". El worker lo
     aplica (rwadar-acceso/compilar.cjs) y aquí cambian noindex, sitemap y textos. */
  if (!ACCESOS.includes(config.acceso)) falla(donde, '"acceso" debe ser "cuenta" o "publico"');
  if (!Array.isArray(config.niveles) || !config.niveles.length) falla(donde, 'faltan los niveles');
  const ids = new Set(config.niveles.map(n => n.id));
  if (ids.size !== config.niveles.length) falla(donde, 'hay niveles repetidos');
  for (const [clave, destino] of Object.entries(config.destinos || {})) {
    if (!['disponible', 'parcial', 'proximamente'].includes(destino.estado)) falla(donde, `destino ${clave} con estado no válido`);
    if (!destino.etiqueta) falla(donde, `destino ${clave} sin etiqueta`);
    if (destino.estado !== 'proximamente') {
      if (!/^\/(?:#[a-z]+)?$/.test(destino.web || '')) falla(donde, `destino ${clave}: "web" debe ser una ruta propia como /#tool`);
      if (!['radar', 'web'].includes(destino.app)) falla(donde, `destino ${clave}: "app" debe ser radar o web`);
    }
    if (destino.estado === 'parcial' && !destino.nota) falla(donde, `destino ${clave}: un destino parcial necesita su nota`);
  }
  const porSlug = new Map();
  for (const entrada of config.lecciones || []) {
    if (porSlug.has(entrada.slug)) falla(donde, `lección repetida: ${entrada.slug}`);
    porSlug.set(entrada.slug, entrada);
  }
  for (const [etiqueta, clave] of Object.entries(config.acciones || {})) {
    const leccion = String(clave).match(/^leccion:(.+)$/);
    if (leccion ? !porSlug.has(leccion[1]) : !config.destinos[clave]) {
      falla(donde, `la acción «${etiqueta}» apunta a un destino inexistente: ${clave}`);
    }
  }

  const contexto = {
    niveles: config.niveles,
    destinos: config.destinos,
    acciones: config.acciones,
    config: porSlug,
  };
  contexto.avisoComun = cargarAvisoComun(config.acciones);

  const archivos = fs.readdirSync(DIR_LECCIONES).filter(n => n.endsWith('.md')).sort();
  const lecciones = archivos.map(n => cargarLeccion(path.join(DIR_LECCIONES, n), contexto))
    .sort((a, b) => a.modulo - b.modulo);
  lecciones.forEach((l, k) => {
    if (l.modulo !== k + 1) falla(`lecciones/${dosCifras(l.modulo)}-${l.slug}.md`, `los módulos deben ir seguidos desde 1 (se esperaba ${k + 1})`);
  });
  for (const slug of porSlug.keys()) {
    if (!lecciones.some(l => l.slug === slug)) falla(donde, `«${slug}» no tiene archivo en lecciones/`);
  }
  const ordenNiveles = config.niveles.map(n => n.id);
  for (let k = 1; k < lecciones.length; k++) {
    if (ordenNiveles.indexOf(lecciones[k].nivel) < ordenNiveles.indexOf(lecciones[k - 1].nivel)) {
      falla(donde, `la lección ${lecciones[k].modulo} va antes de nivel que la ${lecciones[k - 1].modulo}`);
    }
  }

  /* Anterior y siguiente salen del orden de los módulos, no del
     frontmatter: la entrega trae dos enlaces mal (lecciones 1 y 8). */
  const avisos = [];
  lecciones.forEach((l, k) => {
    l.anterior = k > 0 ? lecciones[k - 1].slug : '';
    l.siguiente = k < lecciones.length - 1 ? lecciones[k + 1].slug : '';
    for (const lado of ['anterior', 'siguiente']) {
      const declarado = l.enlacesDeclarados[lado];
      if (declarado !== l[lado]) {
        avisos.push(`Lección ${l.modulo}: el frontmatter dice leccion_${lado} «${declarado || '(vacío)'}»; se usa «${l[lado] || '(ninguna)'}» por orden de módulos.`);
      }
    }
    delete l.enlacesDeclarados;
  });
  return { config, acceso: config.acceso, niveles: config.niveles, destinos: config.destinos, avisoComun: contexto.avisoComun, lecciones, avisos };
}

/* ------------------------------------------------------------------ */
/* HTML                                                                  */
/* ------------------------------------------------------------------ */
const publicadas = academy => academy.lecciones.filter(l => l.estado === 'publicado');
const urlLeccion = slug => `/academy/${slug}`;
const nivelDe = (academy, id) => academy.niveles.find(n => n.id === id);
const numeroNivel = (academy, id) => academy.niveles.findIndex(n => n.id === id) + 1;

function htmlTramos(tramos, ctx, enLinea = true) {
  return tramos.map(t => {
    if (t.br) return '<br>';
    if (t.a) return htmlAccion(t, ctx, enLinea);
    let html = esc(t.v);
    if (t.i) html = `<em>${html}</em>`;
    if (t.b) html = `<strong>${html}</strong>`;
    return html;
  }).join('');
}

/* Un botón puede llevar a un destino del producto (academy.json) o a otra
   lección («leccion:slug»), que solo enlaza si ya está publicada. */
function destinoDe(clave, ctx) {
  const leccion = String(clave).match(/^leccion:(.+)$/);
  if (!leccion) return ctx.destinos[clave];
  const l = ctx.lecciones.find(x => x.slug === leccion[1]);
  return l.estado === 'publicado'
    ? { estado: 'disponible', etiqueta: `Lección ${l.modulo}`, web: urlLeccion(l.slug) }
    : { estado: 'proximamente', etiqueta: `Lección ${l.modulo}` };
}

/* En una fila propia, el botón es grande; dentro de una frase, es un enlace
   destacado para no romper la línea. */
function htmlAccion(tramo, ctx, enLinea = false) {
  const destino = destinoDe(tramo.a, ctx);
  if (destino.estado === 'proximamente') {
    return enLinea
      ? `<span class="ac-enlinea-pronto">${esc(destino.etiqueta)} <small>Próximamente</small></span>`
      : `<span class="ac-accion ac-accion-pronto">${esc(destino.etiqueta)} <small>Próximamente</small></span>`;
  }
  const texto = destino.estado === 'parcial' ? destino.etiqueta : tramo.v;
  return `<a class="${enLinea ? 'ac-enlinea' : 'ac-accion'}" href="${esc(destino.web)}">${esc(texto)} <span aria-hidden="true">→</span></a>`;
}

const soloAcciones = tramos => tramos.some(t => t.a) &&
  tramos.every(t => t.a || t.br || (t.v !== undefined && /^[\s·—–-]*$/.test(t.v)));

function htmlParrafo(bloque, ctx) {
  const notas = [...new Set(bloque.texto.filter(t => t.a && destinoDe(t.a, ctx).estado === 'parcial')
    .map(t => destinoDe(t.a, ctx).nota))];
  const parrafo = soloAcciones(bloque.texto)
    ? `<p class="ac-acciones">${bloque.texto.filter(t => t.a).map(t => htmlAccion(t, ctx)).join('')}</p>`
    : `<p>${htmlTramos(bloque.texto, ctx)}</p>`;
  return parrafo + notas.map(n => `<p class="ac-accion-nota">${esc(n)}</p>`).join('');
}

function htmlBloques(bloques, ctx) {
  return bloques.map(b => {
    switch (b.t) {
      case 'p': return htmlParrafo(b, ctx);
      case 'h3': return `<h2 id="${b.id}">${htmlTramos(b.texto, ctx)}</h2>`;
      case 'h4': return `<h3>${htmlTramos(b.texto, ctx)}</h3>`;
      case 'ul': return `<ul>${b.items.map(it => `<li>${htmlTramos(it, ctx)}</li>`).join('')}</ul>`;
      case 'ol': return `<ol${b.inicio ? ` start="${b.inicio}"` : ''}>${b.items.map(it => `<li>${htmlTramos(it, ctx)}</li>`).join('')}</ol>`;
      case 'tabla':
        return `<div class="ac-tabla ac-tabla-c${b.cabecera.length}" role="region" tabindex="0" aria-label="Tabla: ${esc(b.cabecera.map(textoPlano).join(', '))}"><table>`
          + `<thead><tr>${b.cabecera.map(c => `<th scope="col">${htmlTramos(c, ctx)}</th>`).join('')}</tr></thead>`
          + `<tbody>${b.filas.map(f => `<tr>${f.map((c, k) => k === 0
            ? `<th scope="row">${htmlTramos(c, ctx)}</th>` : `<td>${htmlTramos(c, ctx)}</td>`).join('')}</tr>`).join('')}</tbody>`
          + '</table></div>';
      case 'recuadro':
        return `<aside class="ac-recuadro ac-recuadro-${b.tipo}" aria-label="${esc(b.titulo)}">`
          + `<p class="ac-recuadro-titulo">${b.tipo === 'aviso' ? '<span aria-hidden="true">!</span>' : '<span aria-hidden="true">◆</span>'}${esc(b.titulo)}</p>`
          + htmlBloques(b.bloques, ctx) + '</aside>';
      case 'cita': return `<blockquote>${htmlBloques(b.bloques, ctx)}</blockquote>`;
      case 'hr': return '';
      default: throw new Error(`bloque desconocido ${b.t}`);
    }
  }).join('\n');
}

/* Las secciones del cuerpo llevan un id estable para el índice lateral. */
function asignarIds(bloques) {
  const usados = new Set(['contenido', 'en-30-segundos', 'glosario', 'comprueba', 'siguiente-paso', 'aviso-legal']);
  const indice = [];
  for (const b of bloques) {
    if (b.t !== 'h3') continue;
    let id = slugTexto(textoPlano(b.texto)) || 'seccion';
    let n = 2;
    while (usados.has(id)) id = `${slugTexto(textoPlano(b.texto))}-${n++}`;
    usados.add(id);
    b.id = id;
    indice.push({ id, texto: textoPlano(b.texto) });
  }
  return indice;
}

// Los buscadores cortan el título de la pestaña hacia los 60 caracteres: si el
// de la lección no cabe con el sufijo, se queda la parte antes de los dos
// puntos. La cabecera de la página y las tarjetas al compartir llevan el
// título completo.
const TITULO_PESTANA_MAX = 65;
function tituloPestana(titulo) {
  const sufijo = ' · RWAdar Academy';
  const corto = titulo.split(':')[0].trim();
  for (const t of [titulo + sufijo, titulo, corto + sufijo, corto]) {
    if (t.length <= TITULO_PESTANA_MAX) return t;
  }
  return titulo;
}

function cabeceraHtml({ titulo, tituloOg = titulo, descripcion, canonica, tipoOg, jsonLd, extraMeta = '', robots = ROBOTS_INDEXABLE, candado = false }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${esc(canonica)}">
<meta name="theme-color" content="#0B0A0A">
<meta name="color-scheme" content="dark">
<meta property="og:site_name" content="RWAdar">
<meta property="og:locale" content="es_ES">
<meta property="og:type" content="${tipoOg}">
<meta property="og:url" content="${esc(canonica)}">
<meta property="og:title" content="${esc(tituloOg)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:image" content="${ORIGEN}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
${extraMeta}<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${ICONO}">
<script src="/assets/idioma-previo-20261104.js"></script>
${candado ? `<script src="${CANDADO_JS}"></script>\n` : ''}<link rel="stylesheet" href="${CSS}">
${candado ? `<link rel="stylesheet" href="${CANDADO_CSS}">\n` : ''}<link rel="stylesheet" href="/assets/idioma-20261022.css">
<script type="application/ld+json">
${JSON.stringify(jsonLd)}
</script>
<script src="${ANALITICA}" defer></script>
<script src="/assets/idioma-en-20261022.js" defer></script>
<script src="/assets/idioma-20261022.js" defer></script>
<script src="/assets/idioma-web-20261022.js" defer></script>
<script src="${JS}" defer></script>
</head>`;
}

/* Candado de las lecciones (petición de Víctor del 08/11/2026). Mismo HTML en
   el índice /academy/ y en el bloque de la portada; lo abre
   assets/academy-candado-20261108.js al confirmar la sesión. Nace BLOQUEADO:
   sin script, o si la comprobación falla, las tarjetas siguen difuminadas, sin
   poder pulsarse ni enfocarse (inert) y fuera del lector de pantalla
   (aria-hidden); el lector oye solo el recuadro. Con "publico" no hay candado. */
const CANDADO_SVG = '<svg class="candado-icono" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
  + '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><path d="M12 14.6v2.4"/></svg>';
function htmlCandado(academy, { id, nivel, contenido }) {
  if (academy.acceso !== 'cuenta') return contenido;
  return `<div class="candado" data-academy-candado data-estado="bloqueado">
      <div class="candado-capa" data-academy-candado-capa>
        <section class="candado-caja" aria-labelledby="${id}Tit">
          ${CANDADO_SVG}
          <h${nivel} class="candado-tit" id="${id}Tit">Las lecciones se abren con tu cuenta gratuita</h${nivel}>
          <p class="candado-espera">Comprobando tu sesión…</p>
          <p class="candado-txt">Es gratis: solo necesitas un correo y una contraseña.</p>
          <p class="candado-acciones"><a class="candado-boton candado-boton-p" href="${esc(ALTA_ACADEMY)}">Crear cuenta gratis</a><a class="candado-boton candado-boton-s" href="${esc(ENTRAR_ACADEMY)}">Ya tengo cuenta: entrar</a></p>
          <p class="candado-error" data-academy-candado-error role="status"></p>
        </section>
      </div>
      <div class="candado-contenido" data-academy-candado-contenido inert aria-hidden="true">
      ${contenido}
      </div>
    </div>`;
}

const MARCA_SVG = `<svg class="ac-marca-icono" width="32" height="32" viewBox="0 0 104 104" aria-hidden="true">
        <g fill="none" stroke="currentColor" stroke-width="1.6" opacity=".45"><circle cx="52" cy="52" r="46"/><circle cx="52" cy="52" r="35"/><circle cx="52" cy="52" r="24"/></g>
        <path d="M52 52 L64.74 20.48 A34 34 0 0 1 83.52 39.26 Z" fill="#25E39A" opacity=".38"/>
        <path d="M65 52L58.5 63.26L45.5 63.26L39 52L45.5 40.74L58.5 40.74Z" fill="#25E39A"/>
        <path d="M65 52L58.5 63.26L45.5 63.26L39 52Z" fill="#0F7A57"/>
      </svg>`;

function barraSuperior(activa) {
  return `<a class="ac-saltar" href="#contenido">Saltar al contenido</a>
<header class="ac-cab">
  <div class="ac-envoltura ac-cab-in">
    <a class="ac-marca" href="/" aria-label="RWAdar, volver al radar">
      ${MARCA_SVG}
      <span class="ac-wm">RWA<span>dar</span></span><span class="ac-wm-sub">Academy</span>
    </a>
    <nav class="ac-cab-nav" aria-label="Secciones">
      <a href="/academy/"${activa === 'academy' ? ' aria-current="page"' : ''}>Lecciones</a>
      <a href="/#tool">Radar</a>
      <a href="/#metodo">Método</a>
    </nav>
  </div>
</header><div data-selector-idioma></div>`;
}

function pieHtml() {
  return `<footer class="ac-pie">
  <div class="ac-envoltura">
    <p><b>RWAdar Academy</b> forma parte de RWAdar, un catálogo independiente de ofertas y plataformas tokenizadas. No es asesoramiento financiero.</p>
    <p><a href="/">Radar</a> · <a href="/academy/">Academy</a> · <a href="/privacidad">Privacidad</a> · <a href="/transparencia-comercial">Transparencia comercial</a> · <a href="mailto:RWAdar@protonmail.com">RWAdar@protonmail.com</a></p>
  </div>
</footer>`;
}

function htmlAvisoLegal(academy, leccion, ctx) {
  const propio = leccion && leccion.notaLegal.length
    ? `<div class="ac-legal-propio${leccion.avisoReforzado ? ' ac-legal-reforzado' : ''}">`
      + `<p class="ac-legal-etiqueta">${leccion.avisoReforzado ? 'Aviso reforzado para esta lección' : 'Sobre esta lección'}</p>`
      + htmlBloques(leccion.notaLegal, ctx) + '</div>'
    : '';
  return `<section class="ac-legal" id="aviso-legal" aria-labelledby="avisoLegalTit">
  <h2 id="avisoLegalTit">Aviso importante</h2>
  ${academy.avisoComun.map(tramos => `<p>${htmlTramos(tramos, ctx)}</p>`).join('\n  ')}
  ${propio}
</section>`;
}

function paginaLeccion(academy, l) {
  const ctx = { destinos: academy.destinos, lecciones: academy.lecciones };
  const nivel = nivelDe(academy, l.nivel);
  const nNivel = numeroNivel(academy, l.nivel);
  const total = publicadas(academy).length; // solo las publicadas: con 7 de 9, «Lección 1 de 7», no «de 9»
  const canonica = `${ORIGEN}${urlLeccion(l.slug)}`;
  const cuerpo = l.cuerpo.map(b => ({ ...b }));
  const indice = asignarIds(cuerpo);
  const porSlug = slug => academy.lecciones.find(x => x.slug === slug);
  const anterior = l.anterior && porSlug(l.anterior);
  const siguiente = l.siguiente && porSlug(l.siguiente);
  const enlaceVecina = (vecina, lado) => {
    if (!vecina) return '<span></span>';
    const etiqueta = `${lado === 'anterior' ? '← Anterior' : 'Siguiente →'} · Lección ${vecina.modulo}`;
    if (vecina.estado !== 'publicado') {
      return `<div class="ac-vecina ac-vecina-${lado} ac-vecina-pronto"><span>${etiqueta} · Próximamente</span><b>${esc(vecina.titulo)}</b></div>`;
    }
    return `<a class="ac-vecina ac-vecina-${lado}" href="${urlLeccion(vecina.slug)}"${lado === 'siguiente' ? ' rel="next"' : ' rel="prev"'}><span>${etiqueta}</span><b>${esc(vecina.titulo)}</b></a>`;
  };
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${canonica}#leccion`,
        headline: l.titulo,
        description: l.resumen,
        inLanguage: 'es-ES',
        datePublished: l.fechaPublicacion,
        dateModified: l.revisionLegal,
        wordCount: l.palabras,
        timeRequired: `PT${l.minutos}M`,
        educationalLevel: nivel.nombre,
        articleSection: l.categoria,
        isAccessibleForFree: true,
        mainEntityOfPage: canonica,
        image: `${ORIGEN}/og.png`,
        author: { '@type': 'Organization', name: 'RWAdar', url: `${ORIGEN}/` },
        publisher: { '@type': 'Organization', name: 'RWAdar', url: `${ORIGEN}/`, logo: { '@type': 'ImageObject', url: `${ORIGEN}/icono-512.png` } },
        isPartOf: { '@type': 'CollectionPage', name: 'RWAdar Academy', url: `${ORIGEN}/academy/` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'RWAdar Academy', item: `${ORIGEN}/academy/` },
          { '@type': 'ListItem', position: 2, name: nivel.nombre, item: `${ORIGEN}/academy/#${nivel.id}` },
          { '@type': 'ListItem', position: 3, name: `Lección ${l.modulo}`, item: canonica },
        ],
      },
    ],
  };
  const pregunta = (p, k) => {
    const nombre = `p${k + 1}`;
    return `<div class="ac-pregunta" data-academy-pregunta data-correcta="${p.correcta}">
  <fieldset>
    <legend><span class="ac-pregunta-num">Pregunta ${k + 1} de ${l.quiz.length}</span>${htmlTramos(p.enunciado, ctx)}</legend>
    ${p.opciones.map((o, i) => `<label class="ac-opcion"><input type="radio" name="${nombre}" value="${i}"><span class="ac-letra" aria-hidden="true">${'ABCD'[i]}</span><span class="ac-opcion-texto"><span class="ac-solo-lector">${'ABCD'[i]}) </span>${htmlTramos(o, ctx)}</span></label>`).join('\n    ')}
  </fieldset>
  <p class="ac-veredicto" data-academy-veredicto aria-live="polite" hidden></p>
  <details class="ac-explicacion" data-academy-explicacion>
    <summary>Ver respuesta</summary>
    <p><strong>Respuesta correcta: ${'ABCD'[p.correcta]}.</strong></p>
    ${htmlBloques(p.explicacion, ctx)}
  </details>
</div>`;
  };

  return `${cabeceraHtml({
    titulo: tituloPestana(l.titulo),
    tituloOg: l.titulo,
    descripcion: l.resumen,
    canonica,
    tipoOg: 'article',
    jsonLd,
    extraMeta: `<meta property="article:published_time" content="${l.fechaPublicacion}">\n<meta property="article:modified_time" content="${l.revisionLegal}">\n<meta property="article:section" content="${esc(l.categoria)}">\n`,
    robots: academy.acceso === 'cuenta' ? ROBOTS_CON_CUENTA : ROBOTS_INDEXABLE,
  })}
<body class="ac-cuerpo-pagina">
${barraSuperior('leccion')}

<main id="contenido" class="ac-envoltura ac-leccion" data-academy-leccion="${l.slug}" data-academy-total="${publicadas(academy).length}">
  <nav class="ac-migas" aria-label="Estás en">
    <ol>
      <li><a href="/academy/">Academy</a></li>
      <li><a href="/academy/#${nivel.id}">${esc(nivel.nombre)}</a></li>
      <li aria-current="page">Lección ${l.modulo}</li>
    </ol>
  </nav>

  <header class="ac-leccion-cab">
    <p class="ac-sobrelinea">Lección ${l.modulo} de ${total} · Nivel ${nNivel} · ${esc(nivel.lema)}</p>
    <h1>${esc(l.titulo)}</h1>
    <ul class="ac-meta" aria-label="Datos de la lección">
      <li><span>Nivel</span>${esc(nivel.nombre)}</li>
      <li><span>Lectura</span>${l.minutos} min</li>
      <li><span>Categoría</span>${esc(l.categoria)}</li>
      <li><span>Última revisión legal</span><time datetime="${l.revisionLegal}">${fechaLarga(l.revisionLegal)}</time></li>
      <li><span>Jurisdicción</span>${esc(l.jurisdiccion)}</li>
    </ul>
    <p class="ac-leida-aviso" data-academy-leida-aviso hidden>✓ Marcaste esta lección como leída en este navegador.</p>
  </header>

  ${htmlBloques(l.preambulo, ctx)}

  <section class="ac-tldr" id="en-30-segundos" aria-labelledby="tldrTit">
    <h2 id="tldrTit">En 30 segundos</h2>
    <ol>
      ${l.tldr.map(item => `<li><span>${htmlTramos(item, ctx)}</span></li>`).join('\n      ')}
    </ol>
    <p class="ac-tldr-pie">¿Con esto te basta? Ve directo al <a href="#comprueba">test de ${l.quiz.length} preguntas</a> o al <a href="#siguiente-paso">siguiente paso</a>.</p>
  </section>

  <div class="ac-rejilla">
    <nav class="ac-indice" aria-label="Secciones de la lección">
      <details class="ac-indice-plegable" data-academy-indice open>
        <summary>En esta lección</summary>
        <ol>
          ${indice.map(s => `<li><a href="#${s.id}">${esc(s.texto)}</a></li>`).join('\n          ')}
          <li><a href="#glosario">Glosario</a></li>
          <li><a href="#comprueba">Comprueba lo que has aprendido</a></li>
          <li><a href="#siguiente-paso">Da el siguiente paso</a></li>
        </ol>
      </details>
    </nav>

    <div class="ac-texto">
      <article class="ac-articulo" aria-labelledby="tldrTit">
${htmlBloques(cuerpo, ctx)}
      </article>

      <section class="ac-glosario" id="glosario" aria-labelledby="glosarioTit">
        <h2 id="glosarioTit">Glosario</h2>
        <dl>
          ${l.glosario.map(g => `<div><dt>${esc(g.termino)}</dt><dd>${htmlTramos(g.definicion, ctx)}</dd></div>`).join('\n          ')}
        </dl>
      </section>

      <section class="ac-quiz" id="comprueba" aria-labelledby="quizTit" data-academy-quiz>
        <h2 id="quizTit">Comprueba lo que has aprendido</h2>
        <p class="ac-quiz-intro">${l.quiz.length} preguntas. No hay nota ni se envía nada: al responder verás si has acertado y por qué.</p>
        ${l.quiz.map(pregunta).join('\n        ')}
        <div class="ac-quiz-resumen" data-academy-resumen aria-live="polite" hidden>
          <p data-academy-aciertos></p>
          <a class="ac-accion" href="#siguiente-paso">Da el siguiente paso <span aria-hidden="true">↓</span></a>
        </div>
      </section>

      <section class="ac-siguiente" id="siguiente-paso" aria-labelledby="pasoTit">
        <p class="ac-sobrelinea">Da el siguiente paso</p>
        <h2 id="pasoTit">${esc(l.siguientePaso.titulo)}</h2>
        ${htmlBloques(l.siguientePaso.bloques, ctx)}
      </section>

      <div class="ac-marcar" data-academy-marcar-caja hidden>
        <button type="button" class="ac-boton-leida" data-academy-marcar aria-pressed="false">Marcar como leída</button>
        <p>Progreso de tu cuenta guardado solo en este navegador, sin sincronización entre dispositivos.</p>
      </div>

      <nav class="ac-paginacion" aria-label="Otras lecciones">
        ${enlaceVecina(anterior, 'anterior')}
        ${enlaceVecina(siguiente, 'siguiente')}
      </nav>

      ${htmlAvisoLegal(academy, l, ctx)}
      <p class="ac-revision">Contenido revisado el <time datetime="${l.revisionLegal}">${fechaLarga(l.revisionLegal)}</time>. Jurisdicción de referencia: ${esc(l.jurisdiccion)}.</p>
    </div>
  </div>
</main>

${pieHtml()}
</body>
</html>
`;
}

function paginaIndice(academy) {
  const ctx = { destinos: academy.destinos, lecciones: academy.lecciones };
  const visibles = publicadas(academy);
  const conCuenta = academy.acceso === 'cuenta';
  const canonica = `${ORIGEN}/academy/`;
  /* Con cuenta, las lecciones llevan noindex y salen del sitemap: el índice
     no las anuncia como partes indexables. */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${canonica}#academy`,
    name: 'RWAdar Academy',
    description: conCuenta
      ? 'Lecciones sobre tokenización de activos reales, gratis con tu cuenta, en tres niveles, con test de autoevaluación y fecha de revisión legal.'
      : 'Lecciones gratuitas sobre tokenización de activos reales, en tres niveles, con test de autoevaluación y fecha de revisión legal.',
    url: canonica,
    inLanguage: 'es-ES',
    isPartOf: { '@type': 'WebSite', name: 'RWAdar', url: `${ORIGEN}/` },
    ...(conCuenta ? {} : { hasPart: visibles.map(l => ({
      '@type': 'Article', headline: l.titulo, url: `${ORIGEN}${urlLeccion(l.slug)}`,
      datePublished: l.fechaPublicacion, dateModified: l.revisionLegal,
    })) }),
  };
  const tarjeta = l => {
    const datos = `<span class="ac-tarjeta-num" aria-hidden="true">${dosCifras(l.modulo)}</span>
          <span class="ac-tarjeta-meta">Lección ${l.modulo} · ${esc(l.categoria)} · ${l.minutos} min</span>
          <span class="ac-tarjeta-tit">${esc(l.titulo)}</span>
          <span class="ac-tarjeta-resumen">${esc(l.resumen)}</span>`;
    if (l.estado !== 'publicado') {
      return `<li><div class="ac-tarjeta ac-tarjeta-pronto">
          ${datos}
          <span class="ac-tarjeta-estado">Próximamente</span>
        </div></li>`;
    }
    return `<li><a class="ac-tarjeta" href="${urlLeccion(l.slug)}" data-academy-tarjeta="${l.slug}">
          ${datos}
          <span class="ac-tarjeta-estado" data-academy-leida hidden>✓ Leída</span>
        </a></li>`;
  };
  const niveles = academy.niveles.map((n, k) => {
    const lecciones = academy.lecciones.filter(l => l.nivel === n.id);
    const minutos = lecciones.filter(l => l.estado === 'publicado').reduce((s, l) => s + l.minutos, 0);
    const disponibles = lecciones.filter(l => l.estado === 'publicado').length;
    return `<section class="ac-nivel" id="${n.id}" aria-labelledby="nivel-${n.id}-tit">
      <header class="ac-nivel-cab">
        <p class="ac-sobrelinea">Nivel ${k + 1} · ${esc(n.lema)}</p>
        <h2 id="nivel-${n.id}-tit">${esc(n.nombre)}</h2>
        <p class="ac-nivel-pregunta">${esc(n.pregunta)}</p>
        <p class="ac-nivel-datos">${disponibles ? `${disponibles} de ${lecciones.length} ${lecciones.length === 1 ? 'lección disponible' : 'lecciones disponibles'} · ${minutos} min de lectura` : 'Próximamente'}</p>
      </header>
      <ol class="ac-tarjetas">
        ${lecciones.map(tarjeta).join('\n        ')}
      </ol>
    </section>`;
  }).join('\n\n    ');

  /* Con cuenta no se dice «9 lecciones gratuitas»: puede haber lecciones
     «Próximamente» (hasta el 06/11/2026 eran 7 publicadas de 9) y se abren
     con una cuenta gratis. Con cuenta, en lugar de la invitación a crearla
     (que ya da el recuadro del candado, justo debajo), una sobrelínea que el
     script del candado cambia por «Lecciones desbloqueadas» al abrir. */
  const entradilla = conCuenta
    ? `<p class="ac-entradilla">Empieza viéndolo. Después, aprende qué compras, quién responde y qué condiciones tiene la salida. Lecciones en ${academy.niveles.length} niveles, con un resumen de 30 segundos y un test corto.</p>
    <p class="ac-sobrelinea" data-academy-sin-cuenta>Gratis con tu cuenta</p>
    <p class="ac-sobrelinea" data-academy-con-cuenta hidden>Lecciones desbloqueadas</p>`
    : `<p class="ac-entradilla">Empieza viéndolo. Después, aprende qué compras, quién responde y qué condiciones tiene la salida. ${academy.lecciones.length} lecciones gratuitas en ${academy.niveles.length} niveles, con un resumen de 30 segundos y un test corto.</p>`;
  /* El tutorial 3D es público: nítido y fuera del candado. Con cuenta va
     después del bloque de lecciones (revisión del 08/11/2026), para que la
     primera pantalla enseñe ya el candado sobre las lecciones difuminadas. */
  const tutorial = `<section class="ac-extra ac-tutorial" aria-labelledby="extraTit">
      <span class="ac-extra-icono" aria-hidden="true">3D</span>
      <div>
        <p class="ac-sobrelinea">Academy · Tutorial guiado</p>
        <h2 id="extraTit">Mira cómo se tokeniza un edificio</h2>
        <p>El edificio sigue entero. Sus derechos se representan en participaciones que pueden cambiar de titular.</p>
        <p class="ac-tutorial-pasos">Activo → Participaciones → Titulares → Transmisión</p>
        <a class="ac-accion" href="/#explain">Empezar tutorial 3D <span aria-hidden="true">→</span></a>
        <p class="ac-tutorial-alternativa">Cuatro pasos, también en texto. A tu ritmo.</p>
      </div>
    </section>`;
  /* Con cuenta, los saltos «Nivel 1/2/3» van dentro de lo bloqueado (revisión
     del 08/11/2026): difuminados e inertes con el candado cerrado, para que el
     teclado y el lector no salten a un destino oculto saltándose el recuadro. */
  const saltos = `<ol class="ac-saltos" aria-label="Niveles">
      ${academy.niveles.map((n, k) => `<li><a href="#${n.id}"><span>Nivel ${k + 1}</span>${esc(n.nombre)} · ${esc(n.lema)}</a></li>`).join('\n      ')}
    </ol>`;

  return `${cabeceraHtml({
    titulo: 'RWAdar Academy · Aprende a tokenizar sin promesas',
    descripcion: conCuenta
      ? 'Lecciones sobre tokenización de activos reales, gratis con tu cuenta: qué es, quién interviene, marco legal, costes, liquidez y cómo comparar proveedores.'
      : 'Lecciones gratuitas sobre tokenización de activos reales: qué es, quién interviene, marco legal, costes, liquidez y cómo comparar proveedores.',
    canonica,
    tipoOg: 'website',
    jsonLd,
    candado: conCuenta,
  })}
<body class="ac-cuerpo-pagina">
${barraSuperior('academy')}

<main id="contenido" class="ac-envoltura ac-portada" data-academy-indice-pagina data-academy-total="${visibles.length}">
  <header class="ac-portada-cab">
    <p class="ac-sobrelinea">RWAdar Academy</p>
    <h1>Entiende la tokenización <em>antes</em> de decidir</h1>
    ${entradilla}
    ${conCuenta ? '' : `${tutorial}
    `}<div class="ac-progreso" data-academy-progreso hidden>
      <progress max="${visibles.length}" value="0" aria-labelledby="progresoTxt"></progress>
      <p id="progresoTxt"><b data-academy-progreso-n>0</b> de ${visibles.length} lecciones leídas en este navegador</p>
    </div>${conCuenta ? '' : `
    ${saltos}`}
  </header>

    ${htmlCandado(academy, { id: 'candadoAcademy', nivel: 2, contenido: conCuenta ? `${saltos}

    ${niveles}` : niveles })}${conCuenta ? `

    ${tutorial}` : ''}

  <p class="ac-nota">Accedes con tu cuenta. Tu progreso (lecciones leídas y tests hechos) se guarda solo en este navegador, separado por cuenta; no se sincroniza entre dispositivos. Borrar los datos del navegador también lo borra.</p>

  ${htmlAvisoLegal(academy, null, ctx)}
</main>

${pieHtml()}
</body>
</html>
`;
}

/* El bloque de lecciones de la portada vive entre dos marcas fijas. */
function bloquePortada(academy) {
  const visibles = publicadas(academy);
  const niveles = academy.niveles.map((n, k) => {
    const items = academy.lecciones.filter(l => l.nivel === n.id).map(l => l.estado === 'publicado'
      ? `<li><a href="${urlLeccion(l.slug)}"><span class="academia-num">${dosCifras(l.modulo)}</span><b>${esc(l.titulo)}</b><small>${esc(l.categoria)} · ${l.minutos} min</small></a></li>`
      : `<li class="academia-pronto"><span class="academia-num">${dosCifras(l.modulo)}</span><b>${esc(l.titulo)}</b><small>Próximamente</small></li>`);
    return `<section class="academia-nivel" aria-labelledby="academiaNivel${k + 1}">
      <p class="academia-nivel-etiq">Nivel ${k + 1} · ${esc(n.lema)}</p>
      <h4 id="academiaNivel${k + 1}">${esc(n.nombre)}</h4>
      <p class="academia-nivel-preg">${esc(n.pregunta)}</p>
      <ol class="academia-lista">
        ${items.join('\n        ')}
      </ol>
    </section>`;
  }).join('\n    ');
  /* Con cuenta, el número que se da es el cierto (publicadas de total) y se
     dice cómo se abren: con una cuenta gratis. */
  /* Con sesión, el script del candado oculta la invitación a crear cuenta
     (data-academy-sin-cuenta) y enseña su versión con cuenta, como el índice. */
  const cabecera = academy.acceso === 'cuenta'
    ? `<p class="etiq" data-academy-sin-cuenta>Gratis con tu cuenta</p>
      <p class="etiq" data-academy-con-cuenta hidden>Lecciones desbloqueadas</p>
      <h3 id="academiaLeccionesTit">${visibles.length} de ${academy.lecciones.length} lecciones disponibles</h3>
      <p data-academy-sin-cuenta>Cada nivel responde a una pregunta. Crea tu cuenta gratis para abrir las lecciones: un resumen de 30 segundos, un test corto y la fecha de la última revisión legal.</p>
      <p data-academy-con-cuenta hidden>Cada nivel responde a una pregunta. Ya puedes abrir todas las lecciones: un resumen de 30 segundos, un test corto y la fecha de la última revisión legal.</p>`
    : `<p class="etiq">${visibles.length} de ${academy.lecciones.length} lecciones disponibles</p>
      <h3 id="academiaLeccionesTit">${academy.lecciones.length} lecciones en ${academy.niveles.length} niveles</h3>
      <p>Cada nivel responde a una pregunta. Accede gratis con tu cuenta: un resumen de 30 segundos, un test corto y la fecha de la última revisión legal.</p>`;
  /* data-academy-acceso: deja a la vista en la portada el modo de
     academy.json. El tutorial 3D es público en la web (decisión de Víctor del
     06/11/2026): ningún script lo usa para cerrarlo. */
  return `  <!--academy:ini-->
  <div class="academia-lecciones" aria-labelledby="academiaLeccionesTit" data-academy-acceso="${academy.acceso === 'cuenta' ? 'cuenta' : 'publico'}">
    <div class="academia-lecciones-cab">
      ${cabecera}
    </div>
    ${htmlCandado(academy, { id: 'candadoPortada', nivel: 4, contenido: `<div class="academia-niveles">
    ${niveles}
    </div>` })}
    <a class="academia-ver-todo" href="/academy/">Ver todas las lecciones <span aria-hidden="true">→</span></a>
    <p class="academia-nota">Las lecciones son de texto. De momento no hay vídeos.</p>
  </div>
  <!--academy:fin-->`;
}

/* El enlace discreto de Inicio a la Academy (decisión de Víctor del 04/11/2026),
   con el número real de lecciones publicadas. Solo se ve en pantallas de
   menos de 768 px, donde cambia a la pestaña Academy; sin JavaScript abre /academy/.
   En escritorio no aparece: Academy está en el menú de arriba y en su propia
   sección de la portada. */
function bloqueInicio(academy) {
  const n = publicadas(academy).length;
  return `      <!--academy-inicio:ini-->
      <a class="b3 rel-academia rel-revela" href="/academy/" data-movil-cambiar="academy"><span><span>¿Empiezas de cero?</span> <span>${n} ${n === 1 ? 'lección gratis' : 'lecciones gratis'} en Academy</span></span><span class="rel-flecha" aria-hidden="true"></span></a>
      <!--academy-inicio:fin-->`;
}

function bloqueSitemap(academy) {
  const visibles = publicadas(academy);
  const ultima = visibles.map(l => l.revisionLegal).sort().at(-1);
  // Con cuenta, las lecciones (noindex) no van al sitemap: solo el índice.
  const urls = [
    `  <url>\n    <loc>${ORIGEN}/academy/</loc>\n    <lastmod>${ultima}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
    ...(academy.acceso === 'cuenta' ? [] : visibles.map(l => `  <url>\n    <loc>${ORIGEN}${urlLeccion(l.slug)}</loc>\n    <lastmod>${l.revisionLegal}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>0.6</priority>\n  </url>`)),
  ];
  return `  <!-- academy:ini · generado por rwadar-academy.js -->\n${urls.join('\n')}\n  <!-- academy:fin -->`;
}

/* ------------------------------------------------------------------ */
/* App                                                                   */
/* ------------------------------------------------------------------ */
function moduloApp(academy) {
  const destinos = Object.fromEntries(Object.entries(academy.destinos).map(([clave, d]) => {
    const salida = { estado: d.estado, etiqueta: d.etiqueta };
    if (d.estado !== 'proximamente') {
      salida.app = d.app;
      if (d.app === 'web') salida.url = `${ORIGEN}${d.web}`;
    }
    const nota = d.app === 'web' ? d.notaApp : d.nota;
    if (nota) salida.nota = nota;
    return [clave, salida];
  }));
  const lecciones = academy.lecciones.map(l => {
    const base = {
      slug: l.slug, modulo: l.modulo, titulo: l.titulo, nivel: l.nivel, categoria: l.categoria,
      minutos: l.minutos, resumen: l.resumen, publicado: l.estado === 'publicado',
      revisionLegal: l.revisionLegal, revisionLegalTexto: fechaLarga(l.revisionLegal),
      jurisdiccion: l.jurisdiccion, avisoReforzado: l.avisoReforzado, cta: l.cta,
      url: `${ORIGEN}${urlLeccion(l.slug)}`,
    };
    if (l.estado !== 'publicado') return base;
    return {
      ...base,
      tldr: l.tldr, preambulo: l.preambulo, cuerpo: l.cuerpo, glosario: l.glosario,
      quiz: l.quiz, siguientePaso: l.siguientePaso, notaLegal: l.notaLegal,
    };
  });
  const linea = valor => JSON.stringify(valor);
  return `/* GENERADO por rwadar-academy.js a partir de rwadar-academy/. No se edita
   a mano: cambia la lección en Markdown y ejecuta node rwadar-academy.js.
   Solo incluye el texto completo de las lecciones publicadas. */
export const NIVELES = ${linea(academy.niveles)};

export const DESTINOS = ${linea(destinos)};

export const AVISO_COMUN = ${linea(academy.avisoComun)};

export const LECCIONES = [
${lecciones.map(l => `  ${linea(l)},`).join('\n')}
];
`;
}

/* ------------------------------------------------------------------ */
/* Salidas                                                               */
/* ------------------------------------------------------------------ */
function reemplazarEntreMarcas(texto, ini, fin, nuevo, donde) {
  const a = texto.indexOf(ini);
  const b = texto.indexOf(fin);
  if (a === -1 || b === -1 || b < a || texto.indexOf(ini, a + 1) !== -1) {
    throw new ErrorAcademy(`${donde}: faltan las marcas ${ini} … ${fin} (o están repetidas)`);
  }
  const lineaIni = texto.lastIndexOf('\n', a) + 1;
  return texto.slice(0, lineaIni) + nuevo + texto.slice(b + fin.length);
}

function construirSalidas(academy = cargarAcademy()) {
  const salidas = new Map();
  salidas.set(path.join(DIR_WEB, 'index.html'), paginaIndice(academy));
  for (const l of publicadas(academy)) salidas.set(path.join(DIR_WEB, `${l.slug}.html`), paginaLeccion(academy, l));
  const index = fs.readFileSync(INDEX_WEB, 'utf8');
  const conLecciones = reemplazarEntreMarcas(index, '<!--academy:ini-->', '<!--academy:fin-->',
    bloquePortada(academy), 'rwadar-site/index.html');
  salidas.set(INDEX_WEB, reemplazarEntreMarcas(conLecciones, '<!--academy-inicio:ini-->', '<!--academy-inicio:fin-->',
    bloqueInicio(academy), 'rwadar-site/index.html'));
  const sitemap = fs.readFileSync(SITEMAP, 'utf8');
  salidas.set(SITEMAP, reemplazarEntreMarcas(sitemap, '<!-- academy:ini', '<!-- academy:fin -->',
    bloqueSitemap(academy), 'rwadar-site/sitemap.xml'));
  salidas.set(DATOS_APP, moduloApp(academy));
  return salidas;
}

/* Rutas publicables de la Academy, relativas a rwadar-site. */
function paginasAcademy(academy = cargarAcademy()) {
  return ['academy/index.html', ...publicadas(academy).map(l => `academy/${l.slug}.html`)].sort();
}

function comprobar(academy = cargarAcademy()) {
  const diferencias = [];
  for (const [archivo, contenido] of construirSalidas(academy)) {
    const actual = fs.existsSync(archivo) ? fs.readFileSync(archivo, 'utf8') : null;
    if (actual !== contenido) diferencias.push(path.relative(RAIZ, archivo));
  }
  const esperadas = new Set(paginasAcademy(academy).map(p => p.slice('academy/'.length)));
  if (fs.existsSync(DIR_WEB)) {
    for (const nombre of fs.readdirSync(DIR_WEB)) {
      if (!esperadas.has(nombre)) diferencias.push(`rwadar-site/academy/${nombre} (sobra: no es una lección publicada)`);
    }
  }
  return diferencias;
}

function generar(academy = cargarAcademy()) {
  fs.mkdirSync(DIR_WEB, { recursive: true });
  const escritos = [];
  for (const [archivo, contenido] of construirSalidas(academy)) {
    const actual = fs.existsSync(archivo) ? fs.readFileSync(archivo, 'utf8') : null;
    if (actual !== contenido) { fs.writeFileSync(archivo, contenido, 'utf8'); escritos.push(path.relative(RAIZ, archivo)); }
  }
  const esperadas = new Set(paginasAcademy(academy).map(p => p.slice('academy/'.length)));
  for (const nombre of fs.readdirSync(DIR_WEB)) {
    if (!esperadas.has(nombre)) { fs.rmSync(path.join(DIR_WEB, nombre)); escritos.push(`rwadar-site/academy/${nombre} (borrada)`); }
  }
  return escritos;
}

function avisosRevision(academy, hoy = new Date()) {
  const seisMeses = new Date(hoy);
  seisMeses.setMonth(seisMeses.getMonth() - 6);
  const limite = seisMeses.toISOString().slice(0, 10);
  return publicadas(academy).filter(l => l.revisionLegal < limite)
    .map(l => `Lección ${l.modulo}: su última revisión legal (${l.revisionLegal}) tiene más de 6 meses. Pide que la revisen.`);
}

/* Contenido de las lecciones en un árbol ya construido (el temporal del
   publicador o rwadar-publicado/), antes de subirlo. Con "acceso": "cuenta" la
   web publicada responde 303 a quien no tiene sesión, así que lo que lleva cada
   lección se comprueba aquí y no en producción. Devuelve los fallos (vacío si
   todo cuadra). */
function comprobarLeccionesPublicadas(directorio, academy = cargarAcademy()) {
  const fallos = [];
  const leer = relativa => {
    try { return fs.readFileSync(path.join(directorio, ...relativa.split('/')), 'utf8'); } catch { return null; }
  };
  const robots = academy.acceso === 'cuenta' ? ROBOTS_CON_CUENTA : ROBOTS_INDEXABLE;
  const conHuella = ruta => {
    const punto = ruta.lastIndexOf('.');
    return new RegExp(ruta.slice(0, punto).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.[0-9a-f]{12}\\.' + ruta.slice(punto + 1));
  };
  const indice = leer('academy/index.html');
  if (!indice || !indice.includes('data-academy-indice-pagina')) fallos.push('academy/index.html no es el índice de la Academy');
  /* Con cuenta, el índice sale BLOQUEADO por defecto (candado del 08/11/2026):
     las tarjetas, inert y aria-hidden; la hoja y el script del candado, con huella. */
  else if (academy.acceso === 'cuenta' && (!indice.includes('<div class="candado" data-academy-candado data-estado="bloqueado">') ||
      !indice.includes('<div class="candado-contenido" data-academy-candado-contenido inert aria-hidden="true">') ||
      !conHuella(CANDADO_CSS).test(indice) || !conHuella(CANDADO_JS).test(indice))) {
    fallos.push('academy/index.html no sale bloqueado por defecto (falta el candado, su hoja o su script con huella)');
  }
  for (const l of publicadas(academy)) {
    const nombre = `academy/${l.slug}.html`;
    const pagina = leer(nombre);
    if (pagina === null) { fallos.push(`${nombre} no está`); continue; }
    for (const [texto, que] of [
      [`data-academy-leccion="${l.slug}"`, 'su marca de lección'],
      [`<h1>${esc(l.titulo)}</h1>`, 'su título'],
      [`<link rel="canonical" href="${ORIGEN}${urlLeccion(l.slug)}">`, 'su URL canónica'],
      [`<meta name="robots" content="${robots}">`, `robots «${robots}»`],
      [`Contenido revisado el <time datetime="${l.revisionLegal}">${fechaLarga(l.revisionLegal)}</time>`, 'su fecha de revisión legal'],
    ]) if (!pagina.includes(texto)) fallos.push(`${nombre}: falta ${que}`);
    if ((pagina.match(/<meta name="robots"/g) || []).length !== 1) fallos.push(`${nombre}: lleva más de una etiqueta robots`);
    // Hoja y script con huella: sin ella, el navegador pediría archivos que no se publican.
    if (!conHuella(CSS).test(pagina) || !conHuella(JS).test(pagina)) fallos.push(`${nombre}: hoja o script de la Academy sin huella`);
  }
  for (const l of academy.lecciones.filter(x => x.estado !== 'publicado')) {
    if (leer(`academy/${l.slug}.html`) !== null) fallos.push(`academy/${l.slug}.html no está publicada y no debe estar en el árbol`);
  }
  return fallos;
}

module.exports = {
  ORIGEN, CSS, JS, CANDADO_CSS, CANDADO_JS, ACCESOS, ALTA_ACADEMY, ENTRAR_ACADEMY, ROBOTS_CON_CUENTA, cargarAcademy, construirSalidas, paginasAcademy, comprobar, generar,
  comprobarLeccionesPublicadas, parsearInline, parsearBloques, textoPlano, avisosRevision, ErrorAcademy, tituloPestana,
};

if (require.main === module) {
  try {
    const academy = cargarAcademy();
    for (const aviso of [...academy.avisos, ...avisosRevision(academy)]) console.log('Aviso:', aviso);
    const visibles = publicadas(academy);
    if (process.argv.includes('--comprobar')) {
      const diferencias = comprobar(academy);
      if (diferencias.length) {
        console.error('La Academy no está al día con sus lecciones. Ejecuta: node rwadar-academy.js');
        for (const d of diferencias) console.error(`  - ${d}`);
        process.exit(1);
      }
      console.log(`Academy al día: ${visibles.length} de ${academy.lecciones.length} lecciones publicadas.`);
    } else {
      const escritos = generar(academy);
      console.log(`Academy: ${visibles.length} de ${academy.lecciones.length} lecciones publicadas.`);
      console.log(escritos.length ? escritos.map(e => `  escrito: ${e}`).join('\n') : '  Nada que cambiar.');
    }
  } catch (e) {
    if (e instanceof ErrorAcademy) {
      console.error(`ERROR EN LA ACADEMY · ${e.message}`);
      process.exit(1);
    }
    throw e;
  }
}

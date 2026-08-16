/* =====================================================================
   RWAdar · el adelgazador
   ---------------------------------------------------------------------
   Quita del HTML **publicado** lo que solo sirve para leer el código:
   los comentarios del CSS y del JavaScript, y los espacios de sobra al
   principio de cada línea. Nada más. Ni renombra, ni reordena, ni junta
   líneas, ni toca una sola cadena de texto.

   POR QUÉ EXISTE. Este archivo está comentado a conciencia, y eso vale
   dinero: 12,9 kB de comentarios en el CSS y 43,5 kB en el JavaScript.
   Comprimido, el ahorro son 20 kB de los 95 que viaja la página, un 21%.
   Pero borrarlos del repositorio seria tirar justo lo que hace que este
   archivo se pueda mantener. Asi que se separan las dos cosas:

     rwadar-site/index.html   la FUENTE. Con todos sus comentarios.
                              Es lo que se lee, se edita y se versiona.
     rwadar-publicado/        lo que SE SUBE. Generado, desechable,
                              fuera del control de versiones.

   Nadie pierde nada: quien mantiene la web sigue teniendo cada porqué
   escrito al lado del código, y quien la visita se descarga menos.

   POR QUÉ UN RECORRIDO CARÁCTER A CARÁCTER Y NO UNA EXPRESIÓN REGULAR.
   Porque `'https://ejemplo'` lleva `//` dentro de una cadena y
   `/[/*]/` lleva `/*` dentro de una expresión regular. Un regex
   ingenuo se los come y deja la página en blanco, que es exactamente
   el fallo que no se puede permitir aquí: el pre-renderizado no siempre
   lo caza. Así que se recorre el texto sabiendo en todo momento si se
   está dentro de una cadena, de una plantilla, de una expresión regular
   o de un comentario.

   LO QUE NO SE TOCA, PASE LO QUE PASE:
   - Los comentarios HTML. `<!--pre:ini-->` y `<!--pre:fin-->` son las
     marcas que usa el publicador para inyectar las fichas.
   - El interior de cualquier cadena, plantilla o expresión regular.
   - Los saltos de línea. Se conservan todos: así, si algún día un error
     apunta a la línea 2.400, sigue siendo la 2.400 de la fuente.
   ===================================================================== */
'use strict';

/* Recorre JavaScript sabiendo dónde está. Devuelve el mismo texto sin
   comentarios y con los saltos de línea intactos. */
function sinComentariosJS(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  /* `anterior` es el último carácter con significado que hemos visto.
     Sirve para lo único ambiguo de JavaScript: saber si una barra abre
     una expresión regular o es una división. Detrás de un valor
     -identificador, número, `)` o `]`- es división; detrás de cualquier
     otra cosa, expresión regular. */
  let anterior = '';
  const esValor = (c) => /[\w$)\]]/.test(c);

  while (i < n) {
    const c = src[i], d = src[i + 1];

    if (c === '/' && d === '*') {                    // comentario de bloque
      const fin = src.indexOf('*/', i + 2);
      const trozo = src.slice(i, fin < 0 ? n : fin + 2);
      out += trozo.replace(/[^\n]/g, '');            // se queda con los saltos
      i = fin < 0 ? n : fin + 2;
      continue;
    }
    if (c === '/' && d === '/') {                    // comentario de línea
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {       // cadena o plantilla
      const cierre = c;
      out += c; i++;
      while (i < n) {
        const x = src[i];
        if (x === '\\') { out += x + (src[i + 1] || ''); i += 2; continue; }
        out += x; i++;
        if (x === cierre) break;
      }
      anterior = cierre;
      continue;
    }
    if (c === '/' && !esValor(anterior)) {           // expresión regular
      out += c; i++;
      let enClase = false;
      while (i < n) {
        const x = src[i];
        if (x === '\\') { out += x + (src[i + 1] || ''); i += 2; continue; }
        if (x === '[') enClase = true;
        else if (x === ']') enClase = false;
        else if (x === '/' && !enClase) { out += x; i++; break; }
        else if (x === '\n') break;                  /* no era un regex */
        out += x; i++;
      }
      anterior = '/';
      continue;
    }
    out += c;
    if (!/\s/.test(c)) anterior = c;
    i++;
  }
  return out;
}

/* El CSS es más sencillo: no tiene expresiones regulares. Solo hay que
   respetar las cadenas, porque una `url("...")` puede llevar cualquier
   cosa dentro. (El base64 de las tipografías no puede contener `/*`: el
   alfabeto base64 no incluye el asterisco.) */
function sinComentariosCSS(src) {
  let out = '', i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '*') {
      const fin = src.indexOf('*/', i + 2);
      out += src.slice(i, fin < 0 ? n : fin + 2).replace(/[^\n]/g, '');
      i = fin < 0 ? n : fin + 2;
      continue;
    }
    if (c === '"' || c === "'") {
      const cierre = c;
      out += c; i++;
      while (i < n) {
        const x = src[i];
        if (x === '\\') { out += x + (src[i + 1] || ''); i += 2; continue; }
        out += x; i++;
        if (x === cierre) break;
      }
      continue;
    }
    out += c; i++;
  }
  return out;
}

/* Vacía las líneas que se quedaron con solo sangría al irse su
   comentario, y quita los espacios al final de cada línea.

   NO junta líneas ni borra las vacías, a propósito: así la línea 2.400
   de lo publicado sigue siendo la 2.400 de la fuente, y un error que
   llegue de un navegador de verdad se puede localizar en el archivo que
   de verdad se lee. Juntarlas ahorraba 4 kB de los 305 y costaba eso. */
function apretar(txt) {
  return txt.split('\n').map((l) => l.replace(/\s+$/, '')).join('\n');
}

/* Adelgaza el HTML entero. Localiza el <style> y el ÚLTIMO <script> sin
   atributos, que es el invariante de publicación de este proyecto. */
function adelgazar(html) {
  const iEstilo = html.indexOf('<style>');
  const fEstilo = html.indexOf('</style>');
  const iGuion = html.lastIndexOf('<script>');
  const fGuion = html.lastIndexOf('</script>');
  if (iEstilo < 0 || fEstilo < 0 || iGuion < 0 || fGuion < 0) {
    throw new Error('no encuentro el <style> o el <script>: no adelgazo nada');
  }

  const css = html.slice(iEstilo + 7, fEstilo);
  const js = html.slice(iGuion + 8, fGuion);

  const cssNuevo = apretar(sinComentariosCSS(css));
  const jsNuevo = apretar(sinComentariosJS(js));

  return html.slice(0, iEstilo + 7) + cssNuevo + html.slice(fEstilo, iGuion + 8) +
         jsNuevo + html.slice(fGuion);
}

module.exports = { adelgazar, sinComentariosJS, sinComentariosCSS };

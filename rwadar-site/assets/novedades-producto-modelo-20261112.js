'use strict';
/* =====================================================================
   RWAdar · «Novedades de RWAdar» (12/11/2026): el modelo de la web
   ---------------------------------------------------------------------
   Encargo: «que salga al abrir la app y como las novedades, tipo
   un texto informativo muy fácil de leer con las novedades y si clickan que
   salga en detalle».

   Una sola fuente para la web y la app: /datos/novedades-producto.json
   (rwadar-site/datos/novedades-producto.json). La app lo lee de
   https://rwadar.pages.dev/datos/novedades-producto.json y lleva una copia
   como respaldo. Forma (todo texto llano, sin marcado):

     {
       "version": "AAAA-MM-DD" (o "AAAA-MM-DD.N" si hay otra el mismo día),
       "titulo":  "Novedades de RWAdar",
       "en":      { "titulo": "…" },
       "resumen": [ 1 a 6 puntos (hoy 4), cada uno de UNA línea:
         { "id", "icono", "titulo", "texto", "en": { "titulo", "texto" } } ],
       "detalle": [ 1 a 10 secciones:
         { "id", "titulo", "parrafos": [1 a 8], "pasos": [0 a 8],
           "en": { "titulo", "parrafos", "pasos" } } ]
     }

   El inglés va en un campo «en» junto a cada texto, como en
   /datos/noticias-v2.json: mismo archivo, mismas listas y del mismo largo
   (el párrafo 2 en inglés es el párrafo 2 en castellano). Los «id» son
   únicos en cada lista; los del resumen pueden repetirse en el detalle (el
   punto y su sección: /novedades-rwadar/#<id>). «icono» es una clave de la
   lista cerrada ICONOS (abajo, con su dibujo de 24 × 24); una clave que este
   modelo no conozca se pinta con un icono genérico, para que un archivo
   nuevo no rompa una versión anterior.

   «Ya visto»: la ventana de Inicio se enseña una vez por «version». En la
   web se guarda la última vista en el almacenamiento local (CLAVE_VISTA,
   solo la cadena de la versión, sin nada de la persona); si el navegador no
   deja leerlo o escribirlo (se prueba antes con puedeGuardar), la ventana no
   sale (no se puede prometer «una vez»): las novedades siguen en Perfil y en
   /novedades-rwadar/. Cuándo sale lo deciden motivoSinVentana y
   estadoVentana, aquí y sin navegador, para poder probarlo en probar-web.

   Lo usan assets/novedades-producto-20261112.js (la ventana de Inicio y la
   página /novedades-rwadar/), rwadar-publicar.js (no publica un archivo que
   no pase validar) y probar-web.mjs.
   ===================================================================== */
(function (raiz, fabrica) {
  const api = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.RWAdarNovedadesProducto = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  const RUTA = '/datos/novedades-producto.json';
  const URL_PUBLICA = 'https://rwadar.pages.dev/datos/novedades-producto.json';
  const PAGINA = '/novedades-rwadar/';
  const CLAVE_VISTA = 'rwadar.novedades.vista';
  const MAX_BYTES = 32 * 1024;
  const LIMITES = Object.freeze({
    titulo: 80, puntoTitulo: 60, puntoTexto: 120, seccionTitulo: 100, parrafo: 420, paso: 220,
    resumen: [1, 6], detalle: [1, 10], parrafos: [1, 8], pasos: [0, 8],
  });

  /* Dibujos de 24 × 24 con trazo (stroke currentColor, 1,75, sin relleno),
     como los demás iconos de la web. La app puede usar los mismos trazos con
     react-native-svg. */
  const ICONOS = Object.freeze({
    // Un móvil con un mensaje: los avisos que llegan al móvil.
    notificacion: Object.freeze(['M8 2.8h8a1.6 1.6 0 0 1 1.6 1.6v15.2a1.6 1.6 0 0 1-1.6 1.6H8a1.6 1.6 0 0 1-1.6-1.6V4.4A1.6 1.6 0 0 1 8 2.8z',
      'M11 18.3h2', 'M9.4 8h5.2', 'M9.4 11h3.6']),
    // La campana con su globo: el número de avisos sin leer.
    contador: Object.freeze(['M5.2 10.6a5 5 0 0 1 9.9-1', 'M15.1 13.4c.3 2.6 1.9 2.8 1.9 3.6H3.3c0-.9 1.9-1.1 1.9-6.4',
      'M8.1 20.4h3.9', 'M16 6.6a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0-5.2 0']),
    // El candado: la sesión que se mantiene.
    sesion: Object.freeze(['M7.5 11V8a4.5 4.5 0 0 1 9 0v3', 'M6.5 11h11a1.5 1.5 0 0 1 1.5 1.5v6.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19v-6.5A1.5 1.5 0 0 1 6.5 11z',
      'M12 14.6v2.2']),
    // El sobre: el correo de contacto.
    correo: Object.freeze(['M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', 'm3 7 9 6 9-6']),
    // La calculadora: «Calcula tus números».
    calculadora: Object.freeze(['M6.5 2.8h11a1.6 1.6 0 0 1 1.6 1.6v15.2a1.6 1.6 0 0 1-1.6 1.6h-11a1.6 1.6 0 0 1-1.6-1.6V4.4a1.6 1.6 0 0 1 1.6-1.6z',
      'M8.4 6.4h7.2v3.2H8.4z', 'M8.6 13.4h.01', 'M12 13.4h.01', 'M15.4 13.4h.01', 'M8.6 17h.01', 'M12 17h.01', 'M15.4 17h.01']),
    // Los ejes y una línea que sube: el mercado en directo (14/11/2026).
    grafico: Object.freeze(['M4 4v16h16', 'm7.5 14.5 3.5-4 3 2.5 5.5-6.5']),
    // Un periódico con su foto: las noticias con foto (14/11/2026).
    noticias: Object.freeze(['M4.5 4h15a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-13A1.5 1.5 0 0 1 4.5 4z',
      'M6.5 7.5h5V12h-5z', 'M14.5 8h3', 'M14.5 11.5h3', 'M6.5 15.5h11']),
  });
  // Para una clave que este modelo no conoce: una chispa.
  const ICONO_GENERICO = Object.freeze(['M12 3.5v4', 'M12 16.5v4', 'M3.5 12h4', 'M16.5 12h4', 'M6.3 6.3l2.6 2.6', 'M15.1 15.1l2.6 2.6',
    'M6.3 17.7l2.6-2.6', 'M15.1 8.9l2.6-2.6']);

  const SIN_CONTROL = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/;
  const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const CLAVE_ICONO = /^[a-z]{1,24}$/;
  const VERSION = /^(\d{4})-(\d{2})-(\d{2})(?:\.(\d{1,2}))?$/;
  const MESES = {
    es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  };

  const esObjeto = v => v !== null && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
  function soloClaves(obj, permitidas, donde) {
    const sobran = Object.keys(obj).filter(k => !permitidas.includes(k));
    if (sobran.length) throw new Error(`${donde}: campo desconocido «${sobran[0]}»`);
  }
  function texto(v, maximo, donde) {
    if (typeof v !== 'string') throw new Error(`${donde}: falta el texto`);
    const t = v.trim();
    if (!t) throw new Error(`${donde}: texto vacío`);
    if (t !== v) throw new Error(`${donde}: espacios sobrantes al principio o al final`);
    if (SIN_CONTROL.test(t)) throw new Error(`${donde}: caracteres de control`);
    if (/[<>]/.test(t)) throw new Error(`${donde}: sin marcado (< o >)`);
    if (t.length > maximo) throw new Error(`${donde}: más de ${maximo} caracteres (${t.length})`);
    return t;
  }
  function lista(v, [minimo, maximo], donde) {
    if (!Array.isArray(v)) throw new Error(`${donde}: tiene que ser una lista`);
    if (v.length < minimo || v.length > maximo) throw new Error(`${donde}: entre ${minimo} y ${maximo} elementos (${v.length})`);
    return v;
  }
  function textos(v, rango, maximo, donde) {
    return Object.freeze(lista(v, rango, donde).map((t, i) => texto(t, maximo, `${donde}[${i}]`)));
  }
  function fechaDeVersion(version) {
    const m = VERSION.exec(version);
    if (!m) return null;
    const [a, mes, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const f = new Date(Date.UTC(a, mes - 1, d));
    if (f.getUTCFullYear() !== a || f.getUTCMonth() !== mes - 1 || f.getUTCDate() !== d || a < 2026) return null;
    return { anio: a, mes, dia: d, orden: m[4] === undefined ? 0 : Number(m[4]) };
  }
  function idsUnicos(elementos, donde) {
    const vistos = new Set();
    for (const e of elementos) {
      if (vistos.has(e.id)) throw new Error(`${donde}: id repetido «${e.id}»`);
      vistos.add(e.id);
    }
  }

  /* Devuelve una copia congelada y validada, o lanza un Error que dice qué
     falla (el publicador lo enseña; la web, si falla, no enseña nada). */
  function validar(datos) {
    if (!esObjeto(datos)) throw new Error('el archivo no es un objeto JSON');
    soloClaves(datos, ['version', 'titulo', 'en', 'resumen', 'detalle'], 'raíz');
    if (typeof datos.version !== 'string' || !fechaDeVersion(datos.version)) throw new Error('version: tiene que ser AAAA-MM-DD (o AAAA-MM-DD.N) y una fecha válida');
    const titulo = texto(datos.titulo, LIMITES.titulo, 'titulo');
    if (!esObjeto(datos.en)) throw new Error('en: falta el inglés del título');
    soloClaves(datos.en, ['titulo'], 'en');
    const tituloEn = texto(datos.en.titulo, LIMITES.titulo, 'en.titulo');

    const resumen = lista(datos.resumen, LIMITES.resumen, 'resumen').map((p, i) => {
      const donde = `resumen[${i}]`;
      if (!esObjeto(p)) throw new Error(`${donde}: tiene que ser un objeto`);
      soloClaves(p, ['id', 'icono', 'titulo', 'texto', 'en'], donde);
      if (typeof p.id !== 'string' || !ID.test(p.id) || p.id.length > 40) throw new Error(`${donde}.id: minúsculas, números y guiones (hasta 40)`);
      if (typeof p.icono !== 'string' || !CLAVE_ICONO.test(p.icono)) throw new Error(`${donde}.icono: una clave en minúsculas`);
      if (!esObjeto(p.en)) throw new Error(`${donde}.en: falta el inglés`);
      soloClaves(p.en, ['titulo', 'texto'], `${donde}.en`);
      return Object.freeze({
        id: p.id, icono: p.icono,
        titulo: texto(p.titulo, LIMITES.puntoTitulo, `${donde}.titulo`),
        texto: texto(p.texto, LIMITES.puntoTexto, `${donde}.texto`),
        en: Object.freeze({
          titulo: texto(p.en.titulo, LIMITES.puntoTitulo, `${donde}.en.titulo`),
          texto: texto(p.en.texto, LIMITES.puntoTexto, `${donde}.en.texto`),
        }),
      });
    });
    idsUnicos(resumen, 'resumen');

    const detalle = lista(datos.detalle, LIMITES.detalle, 'detalle').map((s, i) => {
      const donde = `detalle[${i}]`;
      if (!esObjeto(s)) throw new Error(`${donde}: tiene que ser un objeto`);
      soloClaves(s, ['id', 'titulo', 'parrafos', 'pasos', 'en'], donde);
      if (typeof s.id !== 'string' || !ID.test(s.id) || s.id.length > 40) throw new Error(`${donde}.id: minúsculas, números y guiones (hasta 40)`);
      if (!esObjeto(s.en)) throw new Error(`${donde}.en: falta el inglés`);
      soloClaves(s.en, ['titulo', 'parrafos', 'pasos'], `${donde}.en`);
      const seccion = {
        id: s.id,
        titulo: texto(s.titulo, LIMITES.seccionTitulo, `${donde}.titulo`),
        parrafos: textos(s.parrafos, LIMITES.parrafos, LIMITES.parrafo, `${donde}.parrafos`),
        pasos: textos(s.pasos, LIMITES.pasos, LIMITES.paso, `${donde}.pasos`),
        en: Object.freeze({
          titulo: texto(s.en.titulo, LIMITES.seccionTitulo, `${donde}.en.titulo`),
          parrafos: textos(s.en.parrafos, LIMITES.parrafos, LIMITES.parrafo, `${donde}.en.parrafos`),
          pasos: textos(s.en.pasos, LIMITES.pasos, LIMITES.paso, `${donde}.en.pasos`),
        }),
      };
      if (seccion.en.parrafos.length !== seccion.parrafos.length) throw new Error(`${donde}.en.parrafos: tantos como en castellano`);
      if (seccion.en.pasos.length !== seccion.pasos.length) throw new Error(`${donde}.en.pasos: tantos como en castellano`);
      return Object.freeze(seccion);
    });
    idsUnicos(detalle, 'detalle');

    return Object.freeze({ version: datos.version, titulo, en: Object.freeze({ titulo: tituloEn }),
      resumen: Object.freeze(resumen), detalle: Object.freeze(detalle) });
  }
  /* El archivo tal cual llega (texto): primero el tamaño, después la forma. */
  function validarTexto(contenido) {
    if (typeof contenido !== 'string') throw new Error('el archivo no es texto');
    const bytes = typeof TextEncoder === 'function' ? new TextEncoder().encode(contenido).length : contenido.length * 3;
    if (bytes > MAX_BYTES) throw new Error(`ocupa más de ${MAX_BYTES / 1024} kB (${bytes} bytes)`);
    let datos;
    try { datos = JSON.parse(contenido); } catch { throw new Error('no es JSON válido'); }
    return validar(datos);
  }

  /* Los textos en un idioma: «en» o castellano. */
  function enIdioma(datos, idioma) {
    const en = idioma === 'en';
    return Object.freeze({
      version: datos.version,
      titulo: en ? datos.en.titulo : datos.titulo,
      resumen: datos.resumen.map(p => Object.freeze({ id: p.id, icono: p.icono, titulo: en ? p.en.titulo : p.titulo, texto: en ? p.en.texto : p.texto })),
      detalle: datos.detalle.map(s => Object.freeze({ id: s.id, titulo: en ? s.en.titulo : s.titulo,
        parrafos: en ? s.en.parrafos : s.parrafos, pasos: en ? s.en.pasos : s.pasos })),
    });
  }
  const trazosIcono = clave => (Object.hasOwn(ICONOS, clave) ? ICONOS[clave] : ICONO_GENERICO);
  /* «12 de noviembre de 2026» / «12 November 2026» (la fecha de la versión). */
  function fechaLarga(version, idioma) {
    const f = fechaDeVersion(version);
    if (!f) return '';
    return idioma === 'en' ? `${f.dia} ${MESES.en[f.mes - 1]} ${f.anio}` : `${f.dia} de ${MESES.es[f.mes - 1]} de ${f.anio}`;
  }
  const fechaISO = version => (VERSION.exec(version) || [''])[0].slice(0, 10);

  /* ¿Va esta versión después de la ya vista? Por fecha y, el mismo día, por
     el número de después del punto. Sin versión vista, sí. */
  function posterior(version, vista) {
    const a = fechaDeVersion(version);
    if (!a) return false;
    const b = typeof vista === 'string' ? fechaDeVersion(vista) : null;
    if (!b) return true;
    for (const k of ['anio', 'mes', 'dia', 'orden']) if (a[k] !== b[k]) return a[k] > b[k];
    return false;
  }
  /* El almacenamiento, siempre con try/catch: puede no existir o negarse
     (modo privado, datos del sitio bloqueados). */
  function leerVista(almacen) {
    try {
      if (!almacen || typeof almacen.getItem !== 'function') return { ok: false, valor: null };
      const valor = almacen.getItem(CLAVE_VISTA);
      return { ok: true, valor: typeof valor === 'string' && fechaDeVersion(valor) ? valor : null };
    } catch { return { ok: false, valor: null }; }
  }
  function marcarVista(almacen, version) {
    try {
      if (!almacen || typeof almacen.setItem !== 'function' || !fechaDeVersion(version)) return false;
      const { valor } = leerVista(almacen);
      if (valor && !posterior(version, valor)) return true;
      almacen.setItem(CLAVE_VISTA, version);
      return almacen.getItem(CLAVE_VISTA) === version;
    } catch { return false; }
  }
  /* ¿Hay que enseñar la ventana? Solo si se puede leer lo visto y esta versión es nueva. */
  function pendiente(almacen, version) {
    const vista = leerVista(almacen);
    return vista.ok && posterior(version, vista.valor);
  }
  /* ¿Deja guardar? Hay navegadores que dejan leer pero no escribir (el
     almacenamiento lleno, un Safari privado antiguo): ahí la ventana saldría
     en cada carga. Se escribe y se borra al momento una clave de prueba (con
     «1», nada de la persona). Nunca lanza. */
  const CLAVE_PRUEBA = CLAVE_VISTA + '.prueba';
  function puedeGuardar(almacen) {
    try {
      if (!almacen || typeof almacen.setItem !== 'function' || typeof almacen.removeItem !== 'function') return false;
      almacen.setItem(CLAVE_PRUEBA, '1');
      const ok = almacen.getItem(CLAVE_PRUEBA) === '1';
      almacen.removeItem(CLAVE_PRUEBA);
      return ok;
    } catch { return false; }
  }

  /* ---- Cuándo sale la ventana de Inicio (funciones puras: probar-web las
     prueba con un documento falso, sin navegador) ---- */
  /* La dirección pide otra cosa concreta: una notificación (?avisos=1, abre
     la campana), un enlace de la Academy (#explain), el camino a Perfil ›
     Avisos (#perfil-avisos) o la vuelta de un correo de la cuenta. */
  function pideOtraCosa(busqueda, ancla) {
    try {
      const b = new URLSearchParams(typeof busqueda === 'string' ? busqueda : ''), a = typeof ancla === 'string' ? ancla : '';
      return b.get('avisos') === '1' || a === '#explain' || a === '#perfil-avisos' ||
        /(?:^|[#&])(?:access_token|error|error_code|error_description)=/.test(a);
    } catch { return true; }
  }
  /* Otro diálogo abierto: un <dialog> (ficha, campana, iPhone, noticias…), un
     panel modal sin «inert» (la cuenta, la ficha de una plataforma, la
     comparativa, la cuenta de escritorio) o la ficha local. Sin documento
     que mirar, se espera. */
  function hayOtroDialogo(doc) {
    try {
      if (!doc || typeof doc.querySelector !== 'function') return true;
      if (doc.querySelector('dialog[open]')) return true;
      if (doc.querySelector('[aria-modal="true"]:not([inert]):not([hidden])')) return true;
      return !!(doc.body && doc.body.classList && doc.body.classList.contains('detalle-local-abierto'));
    } catch { return true; }
  }
  /* Antes de cargar el archivo: '' si la ventana puede salir en esta visita;
     si no, el motivo. No sale si la dirección pide otra cosa, dentro de la
     app de Android (enseña la suya), en un navegador automatizado o si el
     navegador no deja leer o guardar lo visto (no se puede prometer «una vez»). */
  function motivoSinVentana({ busqueda = '', ancla = '', enApp = false, automatizado = false, almacen = null } = {}) {
    if (pideOtraCosa(busqueda, ancla)) return 'direccion';
    if (enApp) return 'app';
    if (automatizado) return 'automatizado';
    if (!leerVista(almacen).ok) return 'sin-lectura';
    if (!puedeGuardar(almacen)) return 'sin-guardar';
    return '';
  }
  /* Con el archivo cargado, en cada vistazo: 'vista' (ya se vio: no sale),
     'esperar' (pestaña oculta u otro diálogo abierto: se vuelve a mirar) o
     'ensenar'. */
  function estadoVentana({ almacen, version, doc, oculta = false } = {}) {
    if (!pendiente(almacen, version)) return 'vista';
    if (oculta || hayOtroDialogo(doc)) return 'esperar';
    return 'ensenar';
  }

  return Object.freeze({
    RUTA, URL_PUBLICA, PAGINA, CLAVE_VISTA, MAX_BYTES, LIMITES, ICONOS, ICONO_GENERICO,
    validar, validarTexto, enIdioma, trazosIcono, fechaLarga, fechaISO, posterior, leerVista, marcarVista, pendiente,
    puedeGuardar, pideOtraCosa, hayOtroDialogo, motivoSinVentana, estadoVentana,
  });
});

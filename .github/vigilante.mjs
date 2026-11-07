/* =====================================================================
   RWAdar · vigilante diario (solo lectura)
   ---------------------------------------------------------------------
   Uso:  node .github/vigilante.mjs             web, descargas y base
         node .github/vigilante.mjs --solo-web  sin la base (para probar en local)

   Lo lanza cada día el flujo «Vigilante diario» (.github/workflows/vigilante.yml).
   Si algo falla, sale con código 1: GitHub pone el flujo en rojo y manda un
   correo a Víctor. Cada fallo dice, en llano, qué hacer.

   Comprueba:
   1. La portada https://rwadar.pages.dev da 200.
   2. Una lección de la Academy pedida como navegador y sin cookie da 303 a
      /acceso?volver=/academy/<lección> (las lecciones van con cuenta).
   3. /privacidad da 200.
   4. El version-android.json de la última release de RWAdar-downloads tiene la
      forma que acepta la app (rwadar-movil/lib/actualizaciones-app.js).
   5. El catálogo publicado no caduca en menos de 48 h. La fecha y el plazo son
      los mismos que usa la web: verificado_lote_el y vigencia_lote_dias de la
      vista pública catalogo_plataformas_publicas_v2, leída por la pasarela
      pública de la web (/api/acceso/catalogo/…), sin clave ni cuenta. La web
      lo da por caducado cuando la edad del lote en días (UTC) supera el plazo,
      o sea, desde las 00:00 UTC del día fecha + plazo + 1.
   6. security.txt no caduca en menos de 30 días.
   7. Ningún trabajo de pg_cron que terminó en «failed» en las últimas 48 h
      sigue fallando: si su última ejecución ya fue bien, se enseña como «ya
      corregido» y no pone el flujo en rojo (cron.job_run_details, con psql,
      TLS obligatorio y el secreto SUPABASE_DB_URL).

   Solo lee: pide páginas públicas como un visitante sin cuenta, sin cookies, y
   la consulta a la base va en una transacción READ ONLY que se deshace al
   final. No enseña datos de usuarios: de cada trabajo fallido, solo su nombre,
   las horas y el mensaje de error recortado, con correos, identificadores,
   tokens y valores tapados.

   Pruebas sin red: node --test .github/vigilante.test.mjs
   ===================================================================== */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const WEB = 'https://rwadar.pages.dev';
export const VERSION_ANDROID = 'https://github.com/victorJorques/RWAdar-downloads/releases/latest/download/version-android.json';
export const PREFIJO_APK = 'https://github.com/victorJorques/RWAdar-downloads/releases/download/';
export const CATALOGO = `${WEB}/api/acceso/catalogo/catalogo_plataformas_publicas_v2` +
  '?select=verificado_lote_el,vigencia_lote_dias,plataformas_esperadas';
export const HORAS_MINIMAS_CATALOGO = 48;
export const DIAS_MINIMOS_SECURITY_TXT = 30;
const HORA = 3600 * 1000;
const DIA = 24 * HORA;
const MAX_VERSION_BYTES = 4096; // el mismo tope que pone la app

/* Solo lectura y en UTC. Agrupa por trabajo para que uno que corre cada 5
   minutos no llene el correo; el mensaje se recorta ya en la base. jsonb y no
   json: json_agg mete saltos de línea entre elementos y jsonb sale en una.
   La ventana es de 48 h para no perder un fallo si GitHub retrasa una
   ejecución; como el vigilante corre cada día, un mismo fallo sale en dos.
   Por eso trae también cómo terminó la ÚLTIMA ejecución de cada trabajo
   (succeeded o failed; las que siguen en marcha no cuentan): si ya fue bien,
   el fallo está corregido y no pone el flujo en rojo. */
export const CONSULTA_CRON = `begin transaction read only;
set local statement_timeout = '20s';
set local timezone = 'UTC';
select coalesce(jsonb_agg(f order by f.ultimo desc), '[]'::jsonb)
from (
  select coalesce(j.jobname, 'trabajo ' || d.jobid) as trabajo,
         count(*)::int as fallos,
         min(d.start_time) as primero,
         max(d.start_time) as ultimo,
         (array_agg(left(coalesce(d.return_message, ''), 400) order by d.start_time desc))[1] as mensaje,
         (select u.status from cron.job_run_details u
           where u.jobid = d.jobid and u.status in ('succeeded', 'failed') and u.start_time is not null
           order by u.start_time desc limit 1) as ultimo_estado
  from cron.job_run_details d
  left join cron.job j on j.jobid = d.jobid
  where d.status = 'failed'
    and d.start_time > now() - interval '48 hours'
  group by d.jobid, j.jobname
) f;
rollback;
`;

const DOS = n => String(n).padStart(2, '0');
export const fechaES = ms => {
  const d = new Date(ms);
  return `${DOS(d.getUTCDate())}/${DOS(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
};
export const fechaHoraES = ms => {
  const d = new Date(ms);
  return `${fechaES(ms)} a las ${DOS(d.getUTCHours())}:${DOS(d.getUTCMinutes())} UTC`;
};

/* Tapa lo que pudiera ser de un usuario o un secreto en un mensaje de error
   y lo recorta. Primero el «Key (col)=(valor)» de Postgres, después lo demás. */
export function taparDatos(texto, maximo = 160) {
  let t = String(texto ?? '').replace(/\s+/g, ' ').trim()
    .replace(/postgres(?:ql)?:\/\/\S+/gi, '«conexión»')
    .replace(/\(([^()]*)\)=\(([^()]*)\)/g, '($1)=(«valor»)')
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '«correo»')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '«id»')
    .replace(/\beyJ[A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+){1,2}/g, '«token»')
    .replace(/\bsb_(?:publishable|secret)_[A-Za-z0-9_-]+/g, '«clave»')
    // Ristras largas con letras y cifras (claves, tokens); no nombres como rwadar_novedades_limpiar.
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, m => /\d/.test(m) && /[A-Za-z]/.test(m) ? '«clave»' : m)
    .replace(/\b\d{9,}\b/g, '«número»');
  if (t.length > maximo) t = t.slice(0, maximo - 1) + '…';
  return t;
}

const correcto = (nombre, detalle = '') => ({ nombre, ok: true, detalle });
const fallido = (nombre, detalle, queHacer) => ({ nombre, ok: false, detalle, queHacer });
const omitido = (nombre, detalle) => ({ nombre, ok: true, omitida: true, detalle });

/* Reintenta los cortes de red y los 5xx/429 (un fallo pasajero no debe mandar
   un correo), pero no un 404 ni un 303 inesperado. */
export function crearPedir({ fetchImpl = globalThis.fetch, esperar = ms => new Promise(r => setTimeout(r, ms)),
  intentos = 3, pausaMs = 10000, plazoMs = 20000 } = {}) {
  return async function pedir(url, { redirect = 'manual', headers = {}, maxBytes = 2 * 1024 * 1024 } = {}) {
    let ultimoError;
    for (let intento = 1; intento <= intentos; intento++) {
      try {
        const respuesta = await fetchImpl(url, {
          method: 'GET', redirect, credentials: 'omit',
          headers: { 'User-Agent': 'rwadar-vigilante/1 (GitHub Actions; solo lectura)', ...headers },
          signal: AbortSignal.timeout(plazoMs),
        });
        const texto = (await respuesta.text()).slice(0, maxBytes + 1);
        const resultado = { estado: respuesta.status, cabeceras: respuesta.headers, texto };
        if ((respuesta.status >= 500 || respuesta.status === 429) && intento < intentos) {
          ultimoError = new Error(`HTTP ${respuesta.status}`);
        } else return resultado;
      } catch (error) {
        ultimoError = error;
      }
      if (intento < intentos) await esperar(pausaMs * intento);
    }
    const causa = ultimoError?.cause?.code || ultimoError?.name || 'error';
    throw new Error(`no responde tras ${intentos} intentos (${taparDatos(`${causa}: ${ultimoError?.message || ''}`, 120)})`);
  };
}

const QUE_HACER_WEB = 'Abre la página en el navegador. Si tampoco carga, mira si Cloudflare tiene una incidencia ' +
  '(https://www.cloudflarestatus.com) o si falló el último despliegue (Cloudflare › Workers y Pages › rwadar › ' +
  'Despliegues). Si el problema es el último despliegue, vuelve a publicar desde main con el flujo «Publicar web» ' +
  '(primero preview, luego producción) o pide a Claude o a Codex que lo mire.';

async function comprobarPortada(pedir) {
  const nombre = `La portada ${WEB} responde 200`;
  try {
    const r = await pedir(`${WEB}/`);
    return r.estado === 200 ? correcto(nombre) : fallido(nombre, `da ${r.estado}`, QUE_HACER_WEB);
  } catch (e) { return fallido(nombre, e.message, QUE_HACER_WEB); }
}

async function comprobarPrivacidad(pedir) {
  const nombre = 'La página de privacidad (/privacidad) responde 200';
  const queHacer = 'Sin esa página la web no informa de cómo trata los datos (RGPD). ' + QUE_HACER_WEB;
  try {
    const r = await pedir(`${WEB}/privacidad`);
    return r.estado === 200 ? correcto(nombre) : fallido(nombre, `da ${r.estado}`, queHacer);
  } catch (e) { return fallido(nombre, e.message, queHacer); }
}

/* La lección sale de rwadar-academy/academy.json: la primera publicada. Con
   "acceso": "cuenta" debe mandar a entrar; si algún día vuelve a ser pública,
   debe dar 200. */
async function comprobarAcademy(pedir, academy) {
  const leccion = academy?.lecciones?.find(l => l && l.estado === 'publicado' && /^[a-z0-9-]+$/.test(l.slug || ''));
  if (!leccion) {
    return fallido('Una lección de la Academy sin cuenta manda a entrar',
      'no se pudo leer ninguna lección publicada de rwadar-academy/academy.json',
      'Comprueba que rwadar-academy/academy.json existe en main y tiene lecciones con "estado": "publicado". ' +
      'Si se movió, ajusta .github/vigilante.mjs o pide a Claude o a Codex que lo haga.');
  }
  const ruta = `/academy/${leccion.slug}`;
  const conCuenta = academy.acceso === 'cuenta';
  const destino = `/acceso?volver=${ruta}`;
  const nombre = conCuenta ? `Una lección de la Academy sin cuenta manda a entrar (303 a ${destino})`
    : `Una lección de la Academy responde 200 (academy.json dice que son públicas)`;
  const queHacer = conCuenta
    ? 'La puerta de la Academy no funciona: o la web se publicó sin el worker (_worker.js), o con uno viejo. ' +
      'Vuelve a publicar desde main con «Publicar web» (preview y luego producción) y, si sigue igual, pide a Claude ' +
      'o a Codex que lo revise. Mientras tanto, las lecciones pueden verse sin registrarse o no verse.'
    : QUE_HACER_WEB;
  try {
    const r = await pedir(`${WEB}${ruta}`, { headers: { Accept: 'text/html' } });
    const location = r.cabeceras?.get?.('location') || '';
    if (!conCuenta) return r.estado === 200 ? correcto(nombre) : fallido(nombre, `da ${r.estado}`, queHacer);
    if (r.estado === 303 && location === destino) return correcto(nombre);
    if (r.estado === 200) return fallido(nombre, 'da 200: la lección se ve sin cuenta', queHacer);
    return fallido(nombre, `da ${r.estado}${location ? ` hacia ${taparDatos(location, 120)}` : ''}`, queHacer);
  } catch (e) { return fallido(nombre, e.message, queHacer); }
}

/* La misma regla que validarVersionPublicada de la app: si no cuadra, la app
   ignora el archivo sin avisar a nadie. La prueba local lo compara con la app. */
export function revisarVersionAndroid(datos) {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return 'no es un objeto JSON';
  const faltan = ['plataforma', 'version', 'versionCode', 'apk'].filter(c => !(c in datos));
  if (faltan.length) return `le falta ${faltan.join(', ')}`;
  const { plataforma, version, versionCode, apk } = datos;
  if (plataforma !== 'android') return `"plataforma" es ${JSON.stringify(plataforma)}, no "android"`;
  if (typeof version !== 'string' || !/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(version)) {
    return `"version" no tiene la forma 1.4.2: ${taparDatos(JSON.stringify(version), 40)}`;
  }
  if (!Number.isInteger(versionCode) || versionCode < 1 || versionCode > 9999999) {
    return `"versionCode" no es un número entero válido: ${taparDatos(JSON.stringify(versionCode), 40)}`;
  }
  if (typeof apk !== 'string' || !apk.startsWith(PREFIJO_APK)) return `"apk" no empieza por ${PREFIJO_APK}`;
  if (apk !== `${PREFIJO_APK}v${version}/RWAdar.apk`) {
    return `"apk" no es ${PREFIJO_APK}v${version}/RWAdar.apk, el único enlace que acepta la app`;
  }
  return null;
}

async function comprobarVersionAndroid(pedir) {
  const nombre = 'El aviso de versión de la app (version-android.json de la última release) tiene la forma que espera la app';
  const queHacer = 'Sin este archivo bien escrito, la app Android no avisa de versiones nuevas (las mejoras por OTA ' +
    'siguen llegando). Entra en https://github.com/victorJorques/RWAdar-downloads/releases/latest, edita esa release y ' +
    'sube un version-android.json como este, con la versión y el código de esa release: ' +
    '{"plataforma":"android","version":"1.4.2","versionCode":24,"apk":"' + PREFIJO_APK + 'v1.4.2/RWAdar.apk"}. ' +
    'Está explicado en rwadar-movil/LEEME.md.';
  try {
    const r = await pedir(VERSION_ANDROID, { redirect: 'follow', maxBytes: MAX_VERSION_BYTES });
    if (r.estado !== 200) return fallido(nombre, `no se pudo descargar: da ${r.estado}`, queHacer);
    if (r.texto.length > MAX_VERSION_BYTES) return fallido(nombre, `ocupa más de ${MAX_VERSION_BYTES} bytes y la app lo rechaza`, queHacer);
    let datos;
    try { datos = JSON.parse(r.texto); } catch { return fallido(nombre, 'no es JSON válido', queHacer); }
    const problema = revisarVersionAndroid(datos);
    return problema ? fallido(nombre, problema, queHacer)
      : correcto(nombre, `versión ${datos.version} (código ${datos.versionCode})`);
  } catch (e) { return fallido(nombre, e.message, queHacer); }
}

/* Lo mismo que la web: todas las filas con la misma fecha y plazo, tantas como
   dice el lote, plazo de 1 a 7 días y fecha que no esté en el futuro. */
export function vigenciaCatalogo(filas, ahora) {
  if (!Array.isArray(filas) || !filas.length) return { error: 'la vista pública no devuelve ninguna fila' };
  const { verificado_lote_el: fecha, vigencia_lote_dias: plazo, plataformas_esperadas: esperadas } = filas[0] || {};
  if (Number.isInteger(esperadas) && filas.length !== esperadas) {
    return { error: `el lote está incompleto: ${filas.length} plataformas de ${esperadas}` };
  }
  if (!filas.every(f => f && f.verificado_lote_el === fecha && f.vigencia_lote_dias === plazo)) {
    return { error: 'las filas traen fechas o plazos distintos (lote mezclado)' };
  }
  const base = /^\d{4}-\d{2}-\d{2}$/.test(String(fecha)) ? Date.parse(`${fecha}T00:00:00Z`) : NaN;
  if (!Number.isFinite(base) || new Date(base).toISOString().slice(0, 10) !== fecha) {
    return { error: `la fecha de revisión no es válida: ${taparDatos(JSON.stringify(fecha), 40)}` };
  }
  if (!Number.isInteger(plazo) || plazo < 1 || plazo > 7) {
    return { error: `el plazo de vigencia no es válido: ${taparDatos(JSON.stringify(plazo), 40)}` };
  }
  if (base > ahora) return { error: `la fecha de revisión (${fechaES(base)}) está en el futuro` };
  const caducaEl = base + (plazo + 1) * DIA;
  const restante = caducaEl - ahora;
  return { fecha: base, plazo, caducaEl, caducado: restante <= 0,
    horas: Math.floor(Math.abs(restante) / HORA) };
}

async function comprobarCatalogo(pedir, ahora) {
  const nombre = `El catálogo publicado sigue vigente al menos ${HORAS_MINIMAS_CATALOGO} h más`;
  const renovar = 'Pide a Claude o a Codex «haz la investigación» para renovar el catálogo';
  const queHacerLectura = 'La web no puede leer el catálogo de Supabase por su pasarela (/api/acceso/catalogo/…). ' +
    'Abre la portada: si el catálogo dice que no se ha podido comprobar, mira si el proyecto de Supabase está en pausa ' +
    'o con una incidencia (https://supabase.com/dashboard y https://status.supabase.com) y avisa a Claude o a Codex.';
  let filas;
  try {
    const r = await pedir(CATALOGO, { headers: { Accept: 'application/json' } });
    if (r.estado !== 200) return fallido(nombre, `la pasarela del catálogo da ${r.estado}`, queHacerLectura);
    try { filas = JSON.parse(r.texto); } catch { return fallido(nombre, 'la pasarela del catálogo no devuelve JSON', queHacerLectura); }
  } catch (e) { return fallido(nombre, `la pasarela del catálogo ${e.message}`, queHacerLectura); }
  const v = vigenciaCatalogo(filas, ahora);
  if (v.error) {
    return fallido(nombre, v.error, 'La web enseña la última copia completa con el aviso de revisión pendiente. ' +
      `${renovar}, o que mire por qué la vista pública no da un lote completo.`);
  }
  const resumen = `revisión del ${fechaES(v.fecha)}, plazo ${v.plazo} días: caduca el ${fechaHoraES(v.caducaEl)}`;
  if (v.caducado) {
    return fallido(nombre, `ya caducó: ${resumen.replace('caduca el', 'caducó el')} (hace ${v.horas} h)`,
      'La web ya enseña el catálogo con el aviso «pendiente de renovar» y sin cifras. ' + `${renovar} cuanto antes.`);
  }
  if (v.horas < HORAS_MINIMAS_CATALOGO) {
    return fallido(nombre, `${resumen}: quedan ${v.horas} h`,
      `${renovar} hoy o mañana. Si caduca, la web lo sigue enseñando, pero con el aviso «pendiente de renovar» y sin cifras.`);
  }
  return correcto(nombre, `${resumen} (quedan ${v.horas} h)`);
}

async function comprobarSecurityTxt(pedir, ahora) {
  const nombre = `security.txt sigue vigente al menos ${DIAS_MINIMOS_SECURITY_TXT} días más`;
  const queHacer = 'Cambia la línea «Expires:» de rwadar-site/.well-known/security.txt a una fecha de dentro de unos ' +
    '11 meses (la norma RFC 9116 pide menos de un año), pasa las pruebas y publica la web con «Publicar web». Con el ' +
    'archivo caducado, quien encuentre un fallo de seguridad no sabe si el contacto sigue valiendo.';
  try {
    const r = await pedir(`${WEB}/.well-known/security.txt`);
    if (r.estado !== 200) return fallido(nombre, `da ${r.estado}`, queHacer);
    const valor = r.texto.match(/^Expires:[ \t]*(\S+)[ \t]*$/mi)?.[1];
    const caduca = valor && /^\d{4}-\d{2}-\d{2}T/.test(valor) ? Date.parse(valor) : NaN;
    if (!Number.isFinite(caduca)) return fallido(nombre, 'no tiene una línea «Expires:» con fecha válida', queHacer);
    const dias = Math.floor((caduca - ahora) / DIA);
    if (caduca <= ahora) return fallido(nombre, `ya caducó el ${fechaES(caduca)}`, queHacer);
    if (dias < DIAS_MINIMOS_SECURITY_TXT) return fallido(nombre, `caduca el ${fechaES(caduca)}: quedan ${dias} días`, queHacer);
    return correcto(nombre, `caduca el ${fechaES(caduca)} (quedan ${dias} días)`);
  } catch (e) { return fallido(nombre, e.message, queHacer); }
}

/* psql de verdad. La dirección va como argumento, como en los demás flujos,
   pero nunca se escribe: de psql solo se enseña su error, saneado. TLS
   obligatorio (PGSSLMODE=require, como en el env de los flujos): con el
   «prefer» de libpq, alguien en medio que rechace TLS haría seguir sin cifrar.
   Solo se puede rebajar a mano con PGSSLMODE (p. ej. contra un Postgres local). */
export function entornoPsql(entorno = process.env) {
  return { ...entorno, PGCONNECT_TIMEOUT: '15', PGAPPNAME: 'rwadar-vigilante', PGSSLMODE: entorno.PGSSLMODE || 'require' };
}
export function psqlReal(dbUrl, sql) {
  const r = spawnSync('psql', ['-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-f', '-', dbUrl], {
    input: sql, encoding: 'utf8', timeout: 90000, maxBuffer: 1024 * 1024,
    env: entornoPsql(),
  });
  return { codigo: r.status, salida: r.stdout || '', error: r.stderr || '', fallo: r.error?.code || null };
}

async function comprobarCron({ dbUrl, ejecutarPsql = psqlReal, ahora }) {
  const nombre = 'Ningún trabajo programado de la base (pg_cron) sigue fallando (fallos de las últimas 48 h)';
  if (!dbUrl) {
    return fallido(nombre, 'falta el secreto SUPABASE_DB_URL',
      'Añádelo en GitHub › Settings › Secrets and variables › Actions: es el mismo que usa «Copia de seguridad» ' +
      '(la dirección del «Session pooler» de Supabase con su contraseña).');
  }
  const r = await ejecutarPsql(dbUrl, CONSULTA_CRON);
  if (r.fallo === 'ENOENT') {
    return fallido(nombre, 'no está psql: falló su instalación',
      'Suele ser un fallo pasajero del repositorio de paquetes de PostgreSQL. Relanza el flujo con «Re-run jobs»; si se repite, avisa a Claude o a Codex.');
  }
  if (r.codigo !== 0) {
    const error = taparDatos(r.error || r.fallo || `código ${r.codigo}`, 200);
    return fallido(nombre, `la consulta no se pudo hacer: ${error}`,
      'Si dice «password authentication failed», la contraseña de la base cambió: actualiza el secreto SUPABASE_DB_URL. ' +
      'Si dice que no existe cron.job_run_details, pg_cron no está activo en Supabase (Integrations › Cron). ' +
      'Si es un corte de red o un tiempo agotado, relanza el flujo con «Re-run jobs». Si se repite, avisa a Claude o a Codex.');
  }
  // Desde la primera línea que empieza por «[» hasta el final (por si psql parte la lista).
  const salida = r.salida.split('\n');
  const inicio = salida.findIndex(l => l.trim().startsWith('['));
  let fallos;
  try { fallos = inicio < 0 ? null : JSON.parse(salida.slice(inicio).join('\n')); } catch { fallos = null; }
  if (!Array.isArray(fallos)) {
    return fallido(nombre, 'psql devolvió algo que no es la lista esperada', 'Pide a Claude o a Codex que revise .github/vigilante.mjs.');
  }
  if (!fallos.length) return correcto(nombre, `ningún fallo desde el ${fechaHoraES(ahora - 2 * DIA)}`);
  const linea = f => {
    const ultimo = Date.parse(f.ultimo), primero = Date.parse(f.primero);
    const veces = Number(f.fallos) === 1 ? '1 fallo' : `${Number(f.fallos)} fallos`;
    const desde = Number(f.fallos) > 1 && Number.isFinite(primero) ? ` (el primero, el ${fechaHoraES(primero)})` : '';
    return `${taparDatos(f.trabajo, 60)}: ${veces}, el último el ${Number.isFinite(ultimo) ? fechaHoraES(ultimo) : '?'}` +
      `${desde}: «${taparDatos(f.mensaje) || 'sin mensaje'}»`;
  };
  // Corregido: su última ejecución terminada fue bien. Si no se sabe, cuenta como que sigue fallando.
  const corregidos = fallos.filter(f => f.ultimo_estado === 'succeeded');
  const siguen = fallos.filter(f => f.ultimo_estado !== 'succeeded');
  const yaCorregidos = corregidos.length
    ? `ya corregidos (su última ejecución fue bien): ${corregidos.map(linea).join(' | ')}` : '';
  if (!siguen.length) return correcto(nombre, `ninguno sigue fallando; ${yaCorregidos}`);
  return fallido(nombre, siguen.map(linea).join(' | ') + (yaCorregidos ? `. Aparte, ${yaCorregidos}` : ''),
    'Abre Supabase › Integrations › Cron, entra en ese trabajo y mira su pestaña «History» para ver el error entero. ' +
    'Pide a Claude o a Codex que lo arregle pegándole este mensaje (no hace falta nada más). Mientras falle, lo que hace ' +
    'ese trabajo (por ejemplo, enviar o limpiar avisos) no se hace.');
}

export function leerAcademy(ruta = fileURLToPath(new URL('../rwadar-academy/academy.json', import.meta.url))) {
  try { return JSON.parse(fs.readFileSync(ruta, 'utf8')); } catch { return null; }
}

export async function vigilar({ fetchImpl = globalThis.fetch, esperar, ahora = Date.now(), academy = leerAcademy(),
  dbUrl = process.env.SUPABASE_DB_URL, ejecutarPsql = psqlReal, conBase = true } = {}) {
  const pedir = crearPedir({ fetchImpl, ...(esperar ? { esperar } : {}) });
  // A la vez: con la web caída del todo, los reintentos tardan ~1 min y no 7.
  const resultados = await Promise.all([
    comprobarPortada(pedir),
    comprobarAcademy(pedir, academy),
    comprobarPrivacidad(pedir),
    comprobarVersionAndroid(pedir),
    comprobarCatalogo(pedir, ahora),
    comprobarSecurityTxt(pedir, ahora),
  ]);
  resultados.push(conBase ? await comprobarCron({ dbUrl, ejecutarPsql, ahora })
    : omitido('Trabajos programados de la base (pg_cron)', 'sin comprobar: se pidió --solo-web'));
  return resultados;
}

export function informe(resultados, ahora) {
  const lineas = [`Vigilante de RWAdar · ${fechaHoraES(ahora)} · solo lectura`];
  for (const r of resultados) {
    if (r.omitida) lineas.push(`  OMITIDA ${r.nombre}: ${r.detalle}`);
    else if (r.ok) lineas.push(`  OK    ${r.nombre}${r.detalle ? `: ${r.detalle}` : ''}`);
    else lineas.push(`  FALLA ${r.nombre}: ${r.detalle}`, `        Qué hacer: ${r.queHacer}`);
  }
  const fallos = resultados.filter(r => !r.ok).length;
  const correctas = resultados.filter(r => r.ok && !r.omitida).length;
  lineas.push('', `${correctas} correctas, ${fallos} fallidas`);
  return lineas.join('\n');
}

/* Anotaciones de GitHub: salen arriba en la página del flujo. */
const escaparDato = s => String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
const escaparPropiedad = s => escaparDato(s).replace(/:/g, '%3A').replace(/,/g, '%2C');
export function anotaciones(resultados) {
  return resultados.filter(r => !r.ok).map(r =>
    `::error title=${escaparPropiedad(`Vigilante: ${r.nombre}`)}::${escaparDato(`${r.detalle}. Qué hacer: ${r.queHacer}`)}`);
}

export function resumenMarkdown(resultados, ahora) {
  const celda = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const filas = resultados.map(r => `| ${r.omitida ? 'Omitida' : r.ok ? 'OK' : '**FALLA**'} | ${celda(r.nombre)} | ` +
    `${celda(r.ok ? r.detalle : `${r.detalle}. Qué hacer: ${r.queHacer}`)} |`);
  return [`### Vigilante de RWAdar · ${fechaHoraES(ahora)}`, '', '| Estado | Comprobación | Detalle |', '| --- | --- | --- |',
    ...filas, ''].join('\n');
}

export async function main(argv = process.argv.slice(2), entorno = process.env, opciones = {}) {
  const desconocidas = argv.filter(a => a !== '--solo-web');
  if (desconocidas.length) {
    console.error('Uso: node .github/vigilante.mjs [--solo-web]');
    return 2;
  }
  const ahora = opciones.ahora ?? Date.now();
  const resultados = await vigilar({ ...opciones, ahora, dbUrl: entorno.SUPABASE_DB_URL, conBase: !argv.includes('--solo-web') });
  console.log(informe(resultados, ahora));
  if (entorno.GITHUB_ACTIONS === 'true') {
    for (const linea of anotaciones(resultados)) console.log(linea);
    if (entorno.GITHUB_STEP_SUMMARY) {
      try { fs.appendFileSync(entorno.GITHUB_STEP_SUMMARY, resumenMarkdown(resultados, ahora)); } catch { /* sin resumen */ }
    }
  }
  return resultados.some(r => !r.ok) ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main();
}

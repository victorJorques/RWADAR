/* =====================================================================
   RWAdar · piezas comunes de los flujos que usan las claves de Víctor
   ---------------------------------------------------------------------
   Lo usan rwadar-app/dominio-correo.mjs (flujo «Dominio de correo»,
   .github/workflows/dominio-correo.yml) y rwadar-app/supabase-gestion.mjs
   (flujo «Supabase (gestión)», .github/workflows/supabase-gestion.yml).

   Las tres claves (secretos de repositorio de GitHub que crea y pega Víctor;
   cómo, en docs/tareas/PLAN-CEO-2026-11-06.md, «Claves que da Víctor»):
   - SUPABASE_ACCESS_TOKEN: token personal de Supabase (Management API);
   - CLOUDFLARE_DNS_TOKEN: token de la API de Cloudflare, Zone:Read y
     DNS:Edit solo sobre rwadar.app;
   - LETTERMINT_TEAM_TOKEN: token de equipo de la Team API de Lettermint (el
     mismo nombre que ya usa «Correo Lettermint» para sincronizar-bajas).

   Reglas para no dejar ver ninguna clave:
   - las claves y los tokens que se crean solo viven en memoria: van a la API
     con fetch (nunca en la línea de órdenes, nunca en un archivo) y, al
     Vault, a psql como variable (-v), igual que «guardar-correo» de
     «Avisos a registrados (base)»;
   - un token nuevo se enmascara con ::add-mask:: en cuanto llega, antes de
     hacer nada más con él, y nunca se escribe en GITHUB_OUTPUT ni en
     GITHUB_ENV;
   - todo lo que se escribe pasa por `limpio()`, que tapa cualquier clave
     conocida aunque llegara por error dentro de un mensaje de la API;
   - de las respuestas solo se enseñan campos elegidos uno a uno, nunca la
     respuesta entera.

   Pruebas sin red: node --test .github/claves.test.mjs
   ===================================================================== */
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';

export const LETTERMINT = 'https://api.lettermint.co/v1';
export const CLOUDFLARE = 'https://api.cloudflare.com/client/v4';
export const SUPABASE_API = 'https://api.supabase.com/v1';
// La referencia del proyecto: la misma que lleva la web (rwadar-site/assets/rwadar-20260820.js).
export const PROYECTO_SUPABASE = 'exgpmjpaaebyoolpwced';
export const DOMINIO = 'rwadar.app';
export const PROYECTO_LETTERMINT = 'RWAdar';
export const TOKEN_BASE = 'RWAdar base (API)';
export const TOKEN_SMTP = 'RWAdar Auth (SMTP)';
export const CLAVES_DE_VICTOR = 'docs/tareas/PLAN-CEO-2026-11-06.md, «Claves que da Víctor»';

/* Una parada en llano: el flujo sale en rojo con este mensaje. */
export class Parada extends Error {}
export function falla(mensaje) { throw new Parada(mensaje); }

/* Una dirección sencilla, sin nombre ni <>: la misma regla que «guardar-correo»
   (avisos-base.yml) y correo-lettermint.sh. */
const CORREO_SIMPLE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
export const correoValido = (c) => typeof c === 'string' && c.length <= 254 && CORREO_SIMPLE.test(c);
/* Un remitente de los nuestros: del dominio de correo (o de un subdominio suyo). */
export const remitenteDelDominio = (c) => correoValido(c)
  && (c.toLowerCase().endsWith(`@${DOMINIO}`) || c.toLowerCase().endsWith(`.${DOMINIO}`));
/* Forma de token: 20 a 1024 caracteres visibles, sin espacios ni saltos de línea. */
export const tokenValido = (t) => typeof t === 'string' && /^[!-~]{20,1024}$/.test(t);

export const huella = (texto) => crypto.createHash('sha256').update(texto, 'utf8').digest('hex');
export const acortar = (valor, n = 40) => {
  const v = String(valor ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ');
  return v.length > n ? `${v.slice(0, n)}… (${v.length} caracteres)` : v;
};

/* ---------------------------------------------------------------- salida */
export function crearSalida(entorno = process.env, { stdout = process.stdout } = {}) {
  const secretos = new Set();
  const limpio = (texto) => {
    let t = String(texto ?? '');
    for (const s of secretos) if (s && t.includes(s)) t = t.split(s).join('[oculto]');
    return t;
  };
  const escribir = (texto) => stdout.write(`${limpio(texto)}\n`);
  return {
    limpio,
    /* Lo que nunca debe verse: se tapa en todo lo que se escriba después. */
    ocultar(valor) { if (typeof valor === 'string' && valor.length >= 6) secretos.add(valor); },
    /* Un token recién creado: se enmascara en GitHub en cuanto llega. Antes
       solo se comprueba que es una línea de caracteres visibles, para que el
       propio aviso no se pueda partir y deje ver un trozo; si no lo es, no se
       escribe nada y quien llama lo borra. */
    enmascarar(token) {
      if (!tokenValido(token)) return false;
      stdout.write(`::add-mask::${token}\n`);
      secretos.add(token);
      return true;
    },
    linea: escribir,
    aviso(texto) { stdout.write(`::warning::${escaparAnotacion(limpio(texto))}\n`); },
    error(texto) { stdout.write(`::error::${escaparAnotacion(limpio(texto))}\n`); },
    resumen(...lineas) {
      if (!entorno.GITHUB_STEP_SUMMARY) return;
      fs.appendFileSync(entorno.GITHUB_STEP_SUMMARY, lineas.map((l) => `${limpio(l)}\n`).join(''));
    },
  };
}
const escaparAnotacion = (t) => String(t).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');

/* Lee un secreto de GitHub del entorno. Si falta o no tiene forma de token,
   para con el nombre exacto y dónde se crea. */
export function leerSecreto(entorno, salida, nombre, queEs) {
  const valor = entorno[nombre] || '';
  if (!valor) {
    falla(`Falta el secreto de GitHub ${nombre} (${queEs}). Víctor lo crea y lo pega en GitHub › el repositorio › ` +
      `Settings › Secrets and variables › Actions › New repository secret. Cómo crearlo, con los permisos justos: ${CLAVES_DE_VICTOR}.`);
  }
  salida.ocultar(valor);
  if (!tokenValido(valor)) {
    falla(`El secreto ${nombre} no tiene forma de token (20 a 1024 caracteres visibles, sin espacios ni saltos de línea). ` +
      '¿Se pegó con un espacio o un salto de línea al final? Vuelve a pegarlo en GitHub › el repositorio › Settings › ' +
      `Secrets and variables › Actions (${CLAVES_DE_VICTOR}).`);
  }
  return valor;
}

/* ---------------------------------------------------------------- HTTP */
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
/* Texto corto y visible de un error de la API (Lettermint, Cloudflare o
   Supabase), nunca la respuesta entera. */
export function detalleError(datos) {
  if (!datos || typeof datos !== 'object') return '';
  let t = '';
  if (datos.error && typeof datos.error === 'object') t = [datos.error.code, datos.error.message].filter(Boolean).join(': ');
  else if (Array.isArray(datos.errors) && datos.errors.some((e) => e && typeof e.message === 'string')) {
    // Cloudflare: errors: [{code, message}].
    t = datos.errors.filter((e) => e && typeof e.message === 'string').slice(0, 3)
      .map((e) => [e.code, e.message].filter((x) => x !== undefined && x !== '').join(': ')).join(' · ');
  } else if (typeof datos.message === 'string') t = datos.message;
  else if (typeof datos.msg === 'string') t = datos.msg;
  return String(t).replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 240);
}

/* Un cliente para una API con su clave en la cabecera. Solo reintenta las
   lecturas (GET) que fallan por red, 429 o 5xx; una escritura nunca se
   repite sola (crear un token dos veces dejaría uno sin dueño). */
export function crearCliente({ servicio, base, cabeceras, salida }) {
  async function pedir(metodo, ruta, { cuerpo, consulta = '', intentos = metodo === 'GET' ? 3 : 1 } = {}) {
    const url = `${base}${ruta}${consulta ? `?${consulta}` : ''}`;
    for (let intento = 1; ; intento++) {
      let estado = 0, datos = null, causa = '';
      try {
        const r = await fetch(url, {
          method: metodo, redirect: 'error', signal: AbortSignal.timeout(30000),
          headers: { Accept: 'application/json', ...(cuerpo === undefined ? {} : { 'Content-Type': 'application/json' }), ...cabeceras },
          body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
        });
        estado = r.status;
        const texto = await r.text();
        try { datos = texto ? JSON.parse(texto) : null; } catch { datos = null; }
      } catch (e) {
        causa = String(e?.cause?.code || e?.name || 'error').replace(/[^A-Za-z0-9_]/g, '').slice(0, 30);
      }
      if (intento < intentos && (estado === 0 || estado === 429 || estado >= 500)) { await esperar(intento * 1500); continue; }
      return { estado, datos, causa };
    }
  }
  /* Para si la respuesta no es la esperada, explicando en llano qué pasa. */
  function exigir(r, esperado, que) {
    const ok = Array.isArray(esperado) ? esperado.includes(r.estado) : r.estado === esperado;
    if (ok) return r.datos;
    falla(`${servicio}: ${que} no salió bien. ${explicarHttp(servicio, r)}`);
  }
  return { pedir, exigir, servicio, salida };
}

export function explicarHttp(servicio, { estado, datos, causa }) {
  const detalle = detalleError(datos);
  const dice = detalle ? ` ${servicio} dice: «${detalle}».` : '';
  if (estado === 0) return `Sin respuesta de ${servicio} (${causa || 'red'}: red o tiempo agotado). Relanza el flujo; si se repite, mira la página de estado de ${servicio}.`;
  if (estado === 401) return `${servicio} rechaza la clave (HTTP 401): falta, caducó, se revocó o no es la que toca. Créala de nuevo (${CLAVES_DE_VICTOR}).${dice}`;
  if (estado === 403) return `A la clave le falta un permiso (HTTP 403).${dice} Mira los permisos justos en ${CLAVES_DE_VICTOR}.`;
  if (estado === 404) return `${servicio} no lo encuentra (HTTP 404).${dice}`;
  if (estado === 429) return `Demasiadas peticiones a ${servicio} (HTTP 429): vuelve a lanzarlo en unos minutos.${dice}`;
  return `Respuesta inesperada de ${servicio} (HTTP ${estado}).${dice}`;
}

/* La Team API de Lettermint devuelve unas veces el objeto suelto y otras
   dentro de {data: …} (DomainData en GET /domains/{id}, RouteMutationResponse
   en PUT /routes/{id}). Se aceptan las dos formas (verificar con la primera
   respuesta real). */
export const objeto = (datos) => (datos && typeof datos === 'object' && !Array.isArray(datos)
  && datos.id === undefined && datos.data && typeof datos.data === 'object' && !Array.isArray(datos.data)) ? datos.data : datos;

/* ---------------------------------------------------------------- Lettermint */
export function clienteLettermint(entorno, salida) {
  const token = leerSecreto(entorno, salida, 'LETTERMINT_TEAM_TOKEN',
    'token DE EQUIPO de la Team API de Lettermint, no el de proyecto');
  return crearCliente({ servicio: 'Lettermint', base: LETTERMINT, cabeceras: { Authorization: `Bearer ${token}` }, salida });
}

/* Una lista paginada de la Team API (data + next_cursor). */
export async function listarLettermint(lm, ruta, consulta = '') {
  const filas = [];
  let cursor = '';
  for (let pagina = 1; pagina <= 50; pagina++) {
    const q = [consulta, 'page%5Bsize%5D=100', cursor ? `page%5Bcursor%5D=${encodeURIComponent(cursor)}` : ''].filter(Boolean).join('&');
    const datos = lm.exigir(await lm.pedir('GET', ruta, { consulta: q }), 200, `leer ${ruta}`);
    if (!datos || !Array.isArray(datos.data)) falla(`Lettermint devolvió ${ruta} con una forma inesperada (sin lista «data»).`);
    filas.push(...datos.data.filter((x) => x && typeof x === 'object'));
    cursor = typeof datos.next_cursor === 'string' ? datos.next_cursor : '';
    if (!cursor) return filas;
  }
  falla(`Lettermint devuelve más de 50 páginas en ${ruta}: revísalo a mano.`);
}

/* El proyecto «RWAdar»: tiene que haber uno y solo uno con ese nombre exacto. */
export async function buscarProyecto(lm) {
  const todos = await listarLettermint(lm, '/projects', `filter%5Bsearch%5D=${encodeURIComponent(PROYECTO_LETTERMINT)}`);
  const iguales = todos.filter((p) => p.name === PROYECTO_LETTERMINT && typeof p.id === 'string');
  if (iguales.length === 0) {
    const parecido = todos.find((p) => String(p.name || '').toLowerCase() === PROYECTO_LETTERMINT.toLowerCase());
    falla(`No encuentro en Lettermint el proyecto «${PROYECTO_LETTERMINT}».` +
      (parecido ? ` Hay uno llamado «${acortar(parecido.name, 60)}»: renómbralo a «${PROYECTO_LETTERMINT}» en su panel.`
        : ' Lo crea Víctor en su panel (ronda 1 del plan): Lettermint › Projects › New project, con ese nombre exacto.'));
  }
  if (iguales.length > 1) falla(`Hay ${iguales.length} proyectos llamados «${PROYECTO_LETTERMINT}» en Lettermint: deja uno solo antes de seguir.`);
  return iguales[0];
}

/* El dominio de correo en Lettermint (DomainListData), o null si no está. */
export async function buscarDominio(lm) {
  const todos = await listarLettermint(lm, '/domains', `filter%5Bdomain%5D=${encodeURIComponent(DOMINIO)}`);
  const iguales = todos.filter((d) => String(d.domain || '').trim().toLowerCase().replace(/\.$/, '') === DOMINIO && typeof d.id === 'string');
  if (iguales.length > 1) falla(`Lettermint tiene ${iguales.length} dominios ${DOMINIO}: deja uno solo.`);
  return iguales[0] || null;
}

export async function tokensDelProyecto(lm, proyecto, nombre) {
  const todos = await listarLettermint(lm, `/projects/${encodeURIComponent(proyecto.id)}/api-tokens`);
  return nombre ? todos.filter((t) => t.name === nombre && typeof t.id === 'string') : todos;
}

/* Crea un token de proyecto. Lo enmascara en cuanto llega y lo devuelve solo
   en memoria. Si llega con una forma rara, no se escribe y se borra. */
export async function crearTokenProyecto(lm, proyecto, nombre, salida) {
  const ruta = `/projects/${encodeURIComponent(proyecto.id)}/api-tokens`;
  const r = await lm.pedir('POST', ruta, { cuerpo: { name: nombre } });
  const datos = lm.exigir(r, [200, 201], `crear el token «${nombre}»`);
  const nuevo = datos && typeof datos === 'object' ? (datos.data || {}) : {};
  const token = nuevo.token;
  if (!salida.enmascarar(token)) {
    if (typeof nuevo.id === 'string') await borrarTokenProyecto(lm, proyecto, nuevo.id);
    falla(`Lettermint devolvió el token «${nombre}» con una forma inesperada: no se ha usado ni guardado y se ha intentado borrar. Revisa en su panel (Projects › ${PROYECTO_LETTERMINT} › API tokens) que no quede ninguno con ese nombre y la fecha de hoy.`);
  }
  if (typeof nuevo.id !== 'string') {
    falla(`Lettermint creó el token «${nombre}» sin decir su id: no se usa. Bórralo en su panel (Projects › ${PROYECTO_LETTERMINT} › API tokens, el de hoy) y relanza.`);
  }
  return { id: nuevo.id, token, smtp: datos.smtp && typeof datos.smtp === 'object' ? datos.smtp : null };
}

export async function borrarTokenProyecto(lm, proyecto, id) {
  const r = await lm.pedir('DELETE', `/projects/${encodeURIComponent(proyecto.id)}/api-tokens/${encodeURIComponent(id)}`);
  return r.estado === 200 || r.estado === 204 || r.estado === 404;
}

export const fechaCorta = (iso) => (typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : 'sin fecha');

/* ---------------------------------------------------------------- psql */
/* psql de verdad, con TLS obligatorio (PGSSLMODE=require, como en el env de
   los flujos: con el «prefer» de libpq, alguien en medio que rechace TLS haría
   seguir sin cifrar) y un entorno mínimo: psql no hereda ninguna clave de
   las APIs. La dirección de la base va como argumento, como en los demás
   flujos; nunca se escribe. */
export function ejecutarPsql(entorno, dbUrl, argumentos, { entrada = '' } = {}) {
  const r = spawnSync('psql', [dbUrl, '-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', ...argumentos], {
    input: entrada, encoding: 'utf8', timeout: 120000, maxBuffer: 1024 * 1024,
    env: {
      PATH: entorno.PATH || '/usr/bin:/bin', HOME: entorno.HOME || '/tmp', LANG: 'C.UTF-8',
      PGSSLMODE: entorno.PGSSLMODE || 'require', PGCONNECT_TIMEOUT: '15', PGAPPNAME: 'rwadar-claves',
    },
  });
  return { codigo: r.status, salida: r.stdout || '', error: r.stderr || '', fallo: r.error?.code || null };
}

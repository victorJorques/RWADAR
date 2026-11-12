/* =====================================================================
   RWAdar · avisos a registrados (migraciones 30 y 31)
   ---------------------------------------------------------------------
   Contrato: docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md.

   Postgres real en WebAssembly (PGlite) sobre la cadena de producción: el
   seed anterior a ARTEX, 01-22, 24, 25, las migraciones del catálogo, los
   lotes reales del 22/10 al 2026-11-04.2, 26, el refuerzo de sesión, 28,
   28_REVERTIR, 29, la 30 y la 31 (el correo sale por Lettermint). Encima,
   los lotes reales 2026-11-05 y 2026-11-05.2 y lotes inventados con ofertas
   nuevas.

   Auth (con el rol supabase_auth_admin), pg_net, Vault y pg_cron son dobles
   locales: no hay red, ni correo, ni push, ni Supabase. Las peticiones a
   Lettermint y a Expo se leen de la cola del doble de pg_net y sus
   respuestas se simulan escribiéndolas en net._http_response. Los pasos del
   flujo «Avisos a registrados (base)» (ensayo-30, ensayo-31, guardar-correo)
   se ejecutan de verdad con bash y un doble de psql, y el SQL que montan se
   pasa a PGlite.

       node probar-avisos-registrados.mjs
   ===================================================================== */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { alta, baseCatalogoHistorico, filas, informe, sesion } from './pruebas-soporte.mjs';

/* Vista previa opcional de los correos que construye la 30 (no cambia la
   prueba): RWADAR_VOLCAR_CORREOS=<carpeta> node rwadar-app/probar-avisos-registrados.mjs
   escribe ahí el HTML de cada tipo para abrirlo en un navegador. */
const volcarCorreo = (nombre, peticion) => {
  const carpeta = process.env.RWADAR_VOLCAR_CORREOS;
  if (!carpeta || !peticion?.body?.html) return;
  fs.mkdirSync(carpeta, { recursive: true });
  fs.writeFileSync(path.join(carpeta, nombre + '.html'), peticion.body.html);
  fs.writeFileSync(path.join(carpeta, nombre + '.asunto.txt'), String(peticion.body.subject || ''));
};

const raiz = path.dirname(fileURLToPath(import.meta.url));
process.chdir(raiz);
const require = createRequire(import.meta.url);
const { cargarFuentesLocales, construirSqlImportacion } = require('./catalogo-publico');
const leer = (ruta) => fs.readFileSync(path.join(raiz, ruta), 'utf8');

const ok = [], fail = [];
const paso = (texto, condicion) => (condicion ? ok : fail).push(texto);
const error = async (fn) => { try { await fn(); return null; } catch (e) { return e; } };
const una = async (db, sql, p = []) => (await filas(db, sql, p))[0];
const numero = async (db, sql, p = []) => Number(Object.values(await una(db, sql, p))[0]);

// ---------------------------------------------------------------- textos del contrato
// Versión v2, de la revisión legal del 06/11/2026: sustituye a la v1, con la
// que nunca se recogió ningún permiso (la casilla no llegó a enseñarse).
const VERSION = 'novedades-v2-2026-11-06';
const VERSION_V1 = 'novedades-v1-2026-11-05';
const TEXTO_ES = 'Quiero recibir avisos de RWAdar por correo y, si los activo en mi móvil, como notificaciones: fichas nuevas en el radar y novedades de la web y la app. Es opcional: la Academy se desbloquea igual. Puedes darte de baja en Perfil o con el enlace de cada correo; las notificaciones también se quitan en los ajustes del móvil. Más información en Privacidad.';
const TEXTO_EN = "I want to receive RWAdar notices by email and, if I enable them on my phone, as notifications: new listings on the radar and news about the website and the app. It's optional: the Academy unlocks anyway. You can unsubscribe in Profile or with the link in every email; notifications can also be turned off in your phone settings. More information in Privacy.";
const AVISO_FIJO = 'Información, no recomendación: aparecer en el radar no es un respaldo y puedes perder lo invertido. RWAdar no intermedia y nadie paga por aparecer en este aviso. Consulta en el radar qué ha entrado y con qué fuentes.';
const FRASE_PLANTILLA = 'Marcaste también la casilla de avisos de novedades: al confirmar tu correo quedarán activados. Si solo querías la cuenta, confírmala igualmente y desactívalos en Perfil.';
// El pie de la 30 (sin dirección) solo sirve para comparar sus correos con los
// de la 31. Desde la 31, los avisos y las plantillas de Auth (que salen por el
// SMTP de Lettermint desde el paso 5.8) llevan la dirección postal: la pide la
// política de uso de Lettermint en cada correo.
const RESPONSABLE = 'Responsable: Víctor Manuel Jorques Granero, España';
const RESPONSABLE_CORREO = 'Responsable: Víctor Manuel Jorques Granero, Plaza Generalitat, s/n, 46600 Alzira (Valencia), España';
// Desde la 34, el pie de los correos dice «el titular de RWAdar» (sin su
// nombre) y enlaza el aviso legal; activar el correo exige la 34.
const RESPONSABLE_34 = 'Responsable: el titular de RWAdar, Plaza Generalitat, s/n, 46600 Alzira (Valencia), España';
const PARRAFO_APUNTADO = 'Además, te has apuntado a los avisos de novedades: te avisaremos de las fichas nuevas que entren en el radar y de las novedades de la web y la app. Puedes darte de baja cuando quieras con el enlace del final o en tu Perfil.';
const CIERRE_HTML = 'Si no creaste esta cuenta, <a href="mailto:rwadares@gmail.com" style="color:#0F7A57">escríbenos</a> y la borramos.';
const CIERRE_TXT = 'Si no creaste esta cuenta, escríbenos a rwadares@gmail.com y la borramos.';
const PIE_HTML = `Te escribe RWAdar, un radar independiente de plataformas de tokenización. ${RESPONSABLE_34} (<a href="https://rwadar.pages.dev/privacidad#aviso-legal" style="color:#555">aviso legal</a> · <a href="https://rwadar.pages.dev/privacidad" style="color:#555">privacidad</a>).`;
const PIE_TXT = `Te escribe RWAdar, un radar independiente de plataformas de tokenización. ${RESPONSABLE_34}.`;
const PUSH_BIENVENIDA = 'Notificaciones activadas en este móvil. Las de novedades solo llegan si las tienes activadas en Perfil.';
const MAILTO_BAJA = 'mailto:rwadares@gmail.com?subject=Baja%20de%20los%20avisos%20de%20RWAdar';

const SQL30 = leer('db/30_avisos_registrados.sql');
const MIGRACION30 = leer('supabase/migrations/20261105200000_avisos_registrados.sql');
const VERIFICAR30 = leer('db/30_avisos_registrados_verificar.sql');
const ACTIVAR_CORREO = leer('db/30_avisos_registrados_activar_correo.sql');
const ACTIVAR_PUSH = leer('db/30_avisos_registrados_activar_push.sql');
const ACTIVAR_CASILLA = leer('db/30_avisos_registrados_activar_casilla.sql');
const APAGAR = leer('db/30_avisos_registrados_apagar.sql');
const APAGAR_CASILLA = leer('db/30_avisos_registrados_apagar_casilla.sql');
const ANUNCIAR = leer('db/anunciar.sql');
const SQL31 = leer('db/31_correo_lettermint.sql');
const MIGRACION31 = leer('supabase/migrations/20261106120000_correo_lettermint.sql');
const VERIFICAR31 = leer('db/31_correo_lettermint_verificar.sql');
const GUARDAR31 = leer('db/31_correo_lettermint_guardar.sql');
const SQL34 = leer('db/34_pie_sin_nombre.sql');
const BASE = leer('../.github/workflows/avisos-base.yml');
const FALLO_CERRADO = leer('db/fallo_cerrado.sql');
const FLUJO = leer('../.github/workflows/avisar-novedad.yml');
const PLANTILLA = leer('plantillas-auth/confirmar-alta.html');
const PLANTILLA_RECUPERAR = leer('plantillas-auth/recuperar-acceso.html');

// psql no sustituye variables en los comentarios ni dentro de un bloque $etiqueta$.
const sinComentarios = (sql) => sql.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');

// Si algo revienta a mitad, el informe dice dónde en vez de cortar sin más.
let db;
try {
/* =====================================================================
   1 · Revisión estática: copia versionada, textos, plantilla, flujo
   ===================================================================== */
paso('la migración versionada 20261105200000 es una copia idéntica de db/30', MIGRACION30 === SQL30);
paso('la migración versionada 20261106120000 es una copia idéntica de db/31', MIGRACION31 === SQL31);
{
  // Forma que exige el ensayo del flujo: la 31, una sola transacción; su
  // verificador, solo lectura y deshecho al final.
  const lineas = (t) => t.replace(/\n$/, '').split('\n');
  const primera = (t) => sinComentarios(t).split('\n').find((l) => l.trim() !== '');
  paso('la 31 empieza en «begin;» y termina en su único «commit;»; su verificador empieza en «begin transaction read only;» y termina en «rollback;»',
    primera(SQL31) === 'begin;' && (SQL31.match(/^commit;$/gm) || []).length === 1 && lineas(SQL31).at(-1) === 'commit;'
    && primera(VERIFICAR31) === 'begin transaction read only;' && lineas(VERIFICAR31).at(-1) === 'rollback;'
    && (VERIFICAR31.match(/^begin transaction read only;$/gm) || []).length === 1
    && !/^commit;$/m.test(VERIFICAR31) && !/^begin transaction read only;$/m.test(SQL31));
  const codigo = sinComentarios(SQL31);
  const funciones = [...codigo.matchAll(/create or replace function (rwadar_novedades\.[a-z_]+)\(/g)].map((m) => m[1]);
  const firmas = ['correo_mensaje(text, text, text, text, boolean, uuid)', 'leer_correos()', 'enviar_correos(integer)'];
  paso('la 31 solo sustituye correo_mensaje, leer_correos y enviar_correos (create or replace, sin drop ni grant) y repite sus revoke de la 30; no enciende nada, ni toca relojes ni Vault',
    isDeepStrictEqual(funciones, ['rwadar_novedades.correo_mensaje', 'rwadar_novedades.leer_correos', 'rwadar_novedades.enviar_correos'])
    && !/\bdrop\s|\bgrant\s|alter\s+(function|table)|cron\.(un)?schedule|update\s+rwadar_novedades\.configuracion|vault\.(create|update)_secret|insert\s+into\s+vault/i.test(codigo)
    && firmas.every((f) => new RegExp(`revoke all on function rwadar_novedades\\.${f.replace(/[()]/g, '\\$&')}\\s+from public, anon, authenticated, service_role;`).test(codigo))
    && /language plpgsql stable security definer set search_path = ''\nas \$funcion\$;?/.test(codigo.slice(codigo.indexOf('function rwadar_novedades.correo_mensaje')))
    && (codigo.match(/security definer set search_path = ''/g) || []).length === 3);
  const cuerpos = [...SQL31.matchAll(/create or replace function rwadar_novedades\.[a-z_]+\([\s\S]*?\n\$funcion\$;/g)].map((m) => m[0]);
  paso('las tres funciones de la 31 no mencionan Brevo y el envío llama a https://api.lettermint.co/v1/send',
    cuerpos.length === 3 && cuerpos.every((c) => !/brevo/i.test(c))
    && cuerpos[2].includes("url := 'https://api.lettermint.co/v1/send'") && !cuerpos[2].includes('api.brevo.com'));
}
paso('la 30 y su verificador guardan la versión v2 y los textos ES/EN exactos del contrato, y ya no la v1',
  [SQL30, VERIFICAR30].every((s) => s.includes(`'${VERSION}'`) && s.includes(`'${TEXTO_ES}'`)
    && s.includes(`'${TEXTO_EN.replace(/'/g, "''")}'`))
  && !sinComentarios(SQL30).includes(VERSION_V1) && !VERIFICAR30.includes(VERSION_V1));
{
  // El contrato es la fuente de verdad: si está en esta copia, sus citas deben
  // coincidir. Cada cita (líneas seguidas que empiezan por «>») se une en una.
  const ruta = path.join(raiz, '..', 'docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md');
  if (fs.existsSync(ruta)) {
    const md = fs.readFileSync(ruta, 'utf8');
    const citas = [];
    let cita = null;
    for (const l of md.split('\n')) {
      const m = l.match(/^\s*>\s?(.*)$/);
      if (m) (cita ??= []).push(m[1].trim());
      else if (cita) { citas.push(cita.join(' ')); cita = null; }
    }
    if (cita) citas.push(cita.join(' '));
    paso('los textos de la prueba (casilla v2 ES/EN y aviso fijo de ofertas) son literalmente citas del contrato',
      citas.includes(TEXTO_ES) && citas.includes(TEXTO_EN) && citas.includes(AVISO_FIJO)
      && md.includes(`\`${VERSION}\``));
  } else {
    console.log('  (el contrato no está en esta copia: se comparan los textos copiados aquí de su versión v2)');
  }
}
{
  // La web y la app los cambian otros con el mismo texto. Mientras declaren la
  // v1, solo se avisa; en cuanto declaren la v2, sus textos deben ser estos.
  // Se quitan etiquetas HTML («Privacidad» puede ser un enlace) y los \' de JS.
  const plano = (t) => t.replace(/<[^>]+>/g, '').replace(/\\'/g, "'");
  const lados = [
    ['la app', ['../rwadar-movil/lib/avisos-cuenta.js', '../rwadar-movil/lib/idioma-en.js'], /VERSION_AVISOS = '([^']+)'/],
    ['la web', ['../rwadar-site/assets/rwadar-20260820.js', '../rwadar-site/assets/idioma-en-20261022.js',
      '../rwadar-site/acceso.html', '../rwadar-site/index.html'], /VERSION_AVISOS_NOVEDADES\s*=\s*'([^']+)'/],
  ];
  for (const [lado, archivos, patron] of lados) {
    const rutas = archivos.map((a) => path.join(raiz, a));
    if (!rutas.every((r) => fs.existsSync(r))) { console.log(`  (${lado} no está en esta copia)`); continue; }
    const texto = rutas.map((r) => fs.readFileSync(r, 'utf8')).join('\n');
    const version = texto.match(patron)?.[1];
    if (version === VERSION_V1) {
      console.log(`  (${lado} aún declara ${VERSION_V1}: la cambian otros; esta comprobación pasa a exigir los textos al declarar ${VERSION})`);
      continue;
    }
    paso(`${lado} declara ${VERSION} y enseña literalmente los textos ES y EN de la base`,
      version === VERSION && plano(texto).includes(TEXTO_ES) && plano(texto).includes(TEXTO_EN));
  }
}

// Plantilla de Auth: Go template de Supabase, sin imágenes ni seguimiento.
{
  const acciones = [...PLANTILLA.matchAll(/\{\{\s*([^}]*?)\s*\}\}/g)].map((m) => m[1]);
  const bloque = PLANTILLA.match(/\{\{ if \.Data\.avisos_novedades \}\}([\s\S]*?)\{\{ end \}\}/);
  const enlaces = [...PLANTILLA.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
  paso('la plantilla «Confirm signup» confirma con {{ .ConfirmationURL }} y anuncia la Academy gratis',
    acciones.filter((a) => a === '.ConfirmationURL').length === 1
    && PLANTILLA.includes('Confirma tu correo y desbloquea gratis la Academy'));
  paso('solo el bloque {{ if .Data.avisos_novedades }} habla de los avisos, con la frase del contrato',
    isDeepStrictEqual(acciones, ['.ConfirmationURL', 'if .Data.avisos_novedades', 'end'])
    && bloque?.[1].includes(FRASE_PLANTILLA)
    && PLANTILLA.replace(bloque?.[0] ?? '', '').search(/avisos de novedades/) === -1);
  const plantillas = fs.readdirSync(path.join(raiz, 'plantillas-auth')).filter((f) => f.endsWith('.html')).sort();
  // Sin el nombre del titular (Víctor, 12/11/2026): la dirección postal (la pide Lettermint) y el
  // enlace al aviso legal, donde está identificado (LSSI, art. 10).
  const pie = 'RWAdar · Plaza Generalitat, s/n, 46600 Alzira (Valencia), España · <a href="https://rwadar.pages.dev/privacidad#aviso-legal" style="color:#555">Aviso legal</a> · '
    + '<a href="https://rwadar.pages.dev/privacidad" style="color:#555">Privacidad</a> · <a href="mailto:rwadares@gmail.com" style="color:#555">rwadares@gmail.com</a></p>';
  paso('el pie de las plantillas de Auth (confirmación y recuperación) lleva la dirección postal «Plaza Generalitat, s/n, 46600 Alzira (Valencia), España» y el aviso legal enlazado, sin el nombre del titular (tampoco en su LEEME)',
    isDeepStrictEqual(plantillas, ['confirmar-alta.html', 'recuperar-acceso.html'])
    && plantillas.every((f) => leer(`plantillas-auth/${f}`).includes(pie) && !/Jorques|Víctor Manuel/i.test(leer(`plantillas-auth/${f}`)))
    && !/Jorques|Víctor Manuel/i.test(fs.readFileSync(path.join(raiz, '..', 'rwadar-app/plantillas-auth/LEEME.md'), 'utf8')));
  const accionesRecuperar = [...PLANTILLA_RECUPERAR.matchAll(/\{\{\s*([^}]*?)\s*\}\}/g)].map((m) => m[1]);
  paso('la plantilla «Reset password» solo usa {{ .ConfirmationURL }}, una vez, con el texto de REABRIR-CUENTAS',
    isDeepStrictEqual(accionesRecuperar, ['.ConfirmationURL'])
    && ['Recupera tu acceso a RWAdar', 'Has pedido poner una contraseña nueva.', 'Elegir una contraseña nueva',
      'Si no lo has pedido tú, ignora este mensaje: tu contraseña no cambia.'].every((t) => PLANTILLA_RECUPERAR.includes(t)));
  paso('las plantillas no llevan imágenes, scripts, http:// ni enlaces de seguimiento',
    [PLANTILLA, PLANTILLA_RECUPERAR].every((p) => !/<img|<script|http:\/\/|utm_|track|pixel/i.test(p)
      && [...p.matchAll(/href="([^"]*)"/g)].map((m) => m[1]).every((h) => h === '{{ .ConfirmationURL }}'
        || h.startsWith('https://rwadar.pages.dev/') || h === 'mailto:rwadares@gmail.com'))
    && enlaces.includes('{{ .ConfirmationURL }}'));
}

// Flujo «Avisar novedad»: manual, sin permisos de más, entradas por env:.
const ENLACE_VALIDO = /^https:\/\/rwadar\.pages\.dev(\/[A-Za-z0-9._~%-]+)*\/?([?#][A-Za-z0-9._~%=&-]*)?$/;
// Un paso de un flujo de GitHub (« - name: …» a 6 espacios) y su script (run: |).
// Acaba en el paso siguiente o donde empieza otro trabajo (menos sangría).
const pasoDe = (yaml, nombre) => {
  const lineas = yaml.split('\n');
  const inicio = lineas.findIndex((l) => l.trim() === `- name: ${nombre}`);
  if (inicio < 0) return null;
  const fin = lineas.findIndex((l, i) => i > inicio && (/^ {6}(- |# )/.test(l) || /^ {0,5}\S/.test(l)));
  return lineas.slice(inicio, fin < 0 ? undefined : fin).join('\n');
};
const pasoFlujo = (nombre) => pasoDe(FLUJO, nombre);
const scriptDe = (bloque) => {
  const lineas = bloque.split('\n');
  const i = lineas.findIndex((l) => /^ {8}run: \|$/.test(l));
  return lineas.slice(i + 1).map((l) => l.replace(/^ {10}/, '')).join('\n');
};

// Pasos del flujo «Avisos a registrados (base)» ejecutados de verdad: bash,
// desde la raíz del repositorio, con GITHUB_ENV en un archivo y un doble de
// psql que guarda sus argumentos y una copia del archivo -f de cada llamada
// (nunca se conecta a nada). El SQL que montan se pasa después a PGlite.
const hayBash = spawnSync('bash', ['--version'], { encoding: 'utf8' }).status === 0;
const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-avisos-'));
const PSQL_DOBLE = `#!/usr/bin/env bash
set -euo pipefail
d="$PSQL_DOBLE_DIR"
n=$(cat "$d/contador" 2>/dev/null || echo 0); echo $((n + 1)) > "$d/contador"
printf '%s\\0' "$@" > "$d/llamada-$n.argv"
while [ $# -gt 0 ]; do if [ "$1" = -f ]; then cp "$2" "$d/llamada-$n.sql"; fi; shift; done
`;
const correPaso = (nombre, entorno) => {
  const dir = fs.mkdtempSync(path.join(temporal, 'paso-'));
  fs.writeFileSync(path.join(dir, 'psql'), PSQL_DOBLE, { mode: 0o755 });
  const githubEnv = path.join(dir, 'github-env');
  fs.writeFileSync(githubEnv, '');
  const bloque = pasoDe(BASE, nombre);
  if (!bloque) throw new Error(`el flujo no tiene el paso «${nombre}»`);
  const r = spawnSync('bash', ['-c', scriptDe(bloque)], { cwd: path.join(raiz, '..'), encoding: 'utf8',
    env: { PATH: `${dir}:${process.env.PATH}`, PSQL_DOBLE_DIR: dir, GITHUB_ENV: githubEnv, ...entorno } });
  const llamadas = fs.readdirSync(dir).filter((f) => f.endsWith('.argv'))
    .sort((a, b) => parseInt(a.slice(8), 10) - parseInt(b.slice(8), 10)).map((f) => {
      const sql = path.join(dir, f.replace(/\.argv$/, '.sql'));
      return { argv: fs.readFileSync(path.join(dir, f), 'utf8').split('\0').slice(0, -1),
        sql: fs.existsSync(sql) ? fs.readFileSync(sql, 'utf8') : null };
    });
  const salida = Object.fromEntries(fs.readFileSync(githubEnv, 'utf8').split('\n').filter(Boolean)
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
  return { estado: r.status, texto: `${r.stdout}${r.stderr}`, llamadas, salida };
};
// Las variables -v nombre=valor de una llamada a psql (no las de ON_ERROR_STOP).
const variablesPsql = (argv) => Object.fromEntries(argv.flatMap((a, i) =>
  (argv[i - 1] === '-v' && /^[a-z_]+=/.test(a) ? [[a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)]] : [])));
// Lo que hace psql con un archivo: sin metacomandos (\set…) y con cada
// :'variable' fuera de los bloques $…$ cambiada por su literal escapado.
const conVariablesPsql = (sql, variables) => sinComentarios(sql).split('\n').filter((l) => !l.startsWith('\\')).join('\n')
  .split(/(\$[a-z_]*\$[\s\S]*?\$[a-z_]*\$)/)
  .map((trozo, i) => (i % 2 ? trozo : trozo.replace(/:'([a-z_]+)'/g, (_, nombre) => {
    if (!(nombre in variables)) throw new Error(`falta la variable ${nombre}`);
    return `'${String(variables[nombre]).replace(/'/g, "''")}'`;
  }))).join('');
const V30_RUTA = 'rwadar-app/db/30_avisos_registrados_verificar.sql';
const V31_RUTA = 'rwadar-app/db/31_correo_lettermint_verificar.sql';
const V34_RUTA = 'rwadar-app/db/34_pie_sin_nombre_verificar.sql';
// Token inventado para los dobles (no es de Lettermint ni de nadie).
const TOKEN_LM = ['lm', 'ficticio', 'solo', 'para', 'esta', 'prueba', 'local'].join('-');
{
  const runs = [...FLUJO.matchAll(/^( +)run: \|\n((?:\1 {2}.*\n|\s*\n)*)/gm)].map((m) => m[2]);
  const trabajos = FLUJO.slice(FLUJO.indexOf('\njobs:\n') + 7).match(/^ {2}[a-z][a-z0-9-]*:$/gm) || [];
  const psql = pasoFlujo('Avisar');
  const variablesSql = [...new Set([...sinComentarios(ANUNCIAR).matchAll(/:'([a-z_]+)'/g)].map((m) => m[1]))];
  paso('el flujo solo se lanza a mano y escribiendo ENVIAR',
    /^on:\n {2}workflow_dispatch:\n/m.test(FLUJO) && !/^ {2}(push|pull_request|schedule|workflow_run):/m.test(FLUJO)
    && /\[\[ "\$CONFIRMACION" == "ENVIAR" \]\]/.test(FLUJO));
  paso('accion (anunciar / publicar-retenido) y tipo (actualizacion / novedad) son listas cerradas',
    /accion:\n(?: {8}.*\n)*? {8}type: choice\n {8}options:\n {10}- anunciar\n {10}- publicar-retenido\n/.test(FLUJO)
    && /tipo:\n(?: {8}.*\n)*? {8}type: choice\n {8}options:\n {10}- novedad\n {10}- actualizacion\n/.test(FLUJO));
  // Desde la migración 33 las notificaciones web las manda Supabase: el flujo
  // ya no lanza «Notificaciones web» (GitHub no ve las suscripciones).
  paso('un solo trabajo (el anuncio; ya no lanza «Notificaciones web»), permissions: {} y solo contents: read',
    isDeepStrictEqual(trabajos, ['  avisar:']) && /^permissions: \{\}$/m.test(FLUJO)
    && (FLUJO.match(/permissions:/g) || []).length === 2
    && (FLUJO.match(/^ {4}permissions:\n {6}contents: read\n/gm) || []).length === 1
    && !/notificaciones-web|^\s+uses: \.\//m.test(FLUJO.replace(/^\s*#.*$/gm, ''))
    && !/write/.test(FLUJO.replace(/^\s*#.*$/gm, '')));
  paso('sin npm ni node; instala solo psql como «Aplicar catálogo»',
    !runs.some((r) => /\b(npm|npx|node)\b/.test(r)) && !/setup-node/.test(FLUJO)
    && /apt-get install -y -qq postgresql-client-17/.test(FLUJO));
  paso('nunca ${{ inputs.* }} ni ${{ secrets.* }} dentro de run:; las entradas llegan por env:',
    runs.length >= 3 && runs.every((r) => !r.includes('${{')) && (FLUJO.match(/\$\{\{ inputs\.[a-z]+ \}\}/g) || []).length >= 10);
  paso('SUPABASE_DB_URL solo en el paso de psql, sin más secretos',
    (FLUJO.match(/secrets\.SUPABASE_DB_URL/g) || []).length === 1 && psql?.includes('secrets.SUPABASE_DB_URL')
    && (FLUJO.match(/secrets\./g) || []).length === 1 && !/secrets: inherit/.test(FLUJO));
  paso('psql -X -v ON_ERROR_STOP=1 -f rwadar-app/db/anunciar.sql con una -v por cada variable que usa el SQL',
    /psql "\$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 \\/.test(psql || '')
    && /-f rwadar-app\/db\/anunciar\.sql\s*$/.test(psql || '')
    && variablesSql.length === 6
    && variablesSql.every((v) => (psql || '').includes(`-v ${v}="$${v.toUpperCase()}"`)));

  // Las comprobaciones en bash, ejecutadas de verdad con las mismas entradas que daría GitHub.
  const validar = scriptDe(pasoFlujo('Comprobar las entradas') || '');
  const bash = spawnSync('bash', ['--version'], { encoding: 'utf8' });
  if (bash.status === 0) {
    const corre = (entradas) => spawnSync('bash', ['-c', validar], {
      encoding: 'utf8',
      env: { PATH: process.env.PATH, ACCION: 'anunciar', TIPO: 'novedad', TITULO: 'La app ya avisa de las novedades',
        TEXTO: 'Ahora puedes activar los avisos en Perfil.', ENLACE: 'https://rwadar.pages.dev/academy/', ID: '',
        CONFIRMACION: 'ENVIAR', ...entradas },
    }).status;
    const buenos = [{}, { TIPO: 'actualizacion', ENLACE: 'https://rwadar.pages.dev/' },
      { ACCION: 'publicar-retenido', ID: '42', TITULO: '', TEXTO: '' }, { TITULO: 'Ñandú y acentos: áéíóú' },
      { TITULO: 'á'.repeat(90) }]; // 90 caracteres (180 bytes): cuenta caracteres, como la base
    const malos = [{ CONFIRMACION: 'enviar' }, { CONFIRMACION: '' }, { ACCION: 'borrar' }, { TIPO: 'ofertas' },
      { TITULO: 'Hi' }, { TITULO: 'x'.repeat(91) }, { TEXTO: 'x'.repeat(401) },
      { TITULO: 'Una gran oportunidad' }, { TEXTO: 'Rentabilidad alta' }, { TEXTO: 'Retorno GARANTIZADO' },
      { TEXTO: 'Sube un 5 %' }, { TITULO: 'Dos\nlíneas' }, { ENLACE: 'http://rwadar.pages.dev/' },
      { ENLACE: 'https://rwadar.pages.dev.evil.example/' }, { ENLACE: 'https://rwadar.pages.dev@evil.example/' },
      { ENLACE: 'https://evil.example/?https://rwadar.pages.dev/' }, { ENLACE: `https://rwadar.pages.dev/${'a'.repeat(200)}` },
      { ENLACE: 'https://rwadar.pages.dev/"><script>' }, { ACCION: 'publicar-retenido', ID: '0' },
      { ACCION: 'publicar-retenido', ID: '1; drop table x' }, { ACCION: 'publicar-retenido', ID: '' }];
    paso(`la validación en bash del flujo acepta ${buenos.length} entradas buenas`, buenos.every((e) => corre(e) === 0));
    paso(`y rechaza ${malos.length} malas (ENVIAR, listas, longitudes, palabras, %, saltos, enlaces e id)`,
      malos.every((e) => corre(e) !== 0));
    paso('el enlace del flujo y el de la base usan la misma expresión',
      validar.includes(ENLACE_VALIDO.source.replace(/\\\//g, '/')) && SQL30.includes(ENLACE_VALIDO.source.replace(/\\\//g, '/')));
  } else {
    console.log('  (sin bash en este equipo: la validación del flujo se comprueba en CI)');
  }
}

// Flujo «Avisos a registrados (base)»: acciones de la 31 y guardar-correo.
{
  const runs = [...BASE.matchAll(/^( +)run: \|\n((?:\1 {2}.*\n|\s*\n)*)/gm)].map((m) => m[2]);
  const opciones = BASE.match(/ {6}accion:\n(?: {8}.*\n)*? {8}options:\n((?: {10}- .*\n)+)/)?.[1]
    .trim().split('\n').map((l) => l.trim().slice(2));
  paso('el flujo «Avisos a registrados (base)» añade ensayo-31, verificar-31, aplicar-31 y guardar-correo y conserva las de la 30 (las de la 32 las mira probar-notificaciones.mjs; las de la 33, probar-webpush-supabase.mjs, y las de la 34, probar-pie-sin-nombre.mjs)',
    isDeepStrictEqual(opciones, ['ensayo-30', 'verificar-30', 'diagnostico-30', 'aplicar-30', 'ensayo-31', 'verificar-31',
      'aplicar-31', 'guardar-correo', 'ensayo-32', 'verificar-32', 'aplicar-32', 'crear-vapid', 'rotar-vapid',
      'ensayo-33', 'verificar-33', 'aplicar-33', 'prueba-webpush', 'ensayo-34', 'verificar-34', 'aplicar-34',
      'activar-casilla', 'activar-correo', 'activar-push', 'apagar', 'apagar-casilla', 'hacer-admin'])
    && /^ {6}remitente:\n {8}description: .*\n {8}required: false\n {8}type: string$/m.test(BASE));
  const guardar = pasoDe(BASE, 'Guardar en Vault el token de Lettermint y el remitente') || '';
  paso('nunca ${{ … }} dentro de run:; el secreto LETTERMINT_API_TOKEN solo llega, por env:, al paso que guarda; ni set -x ni echo del token',
    runs.length >= 5 && runs.every((r) => !r.includes('${{'))
    && (BASE.match(/secrets\.LETTERMINT_API_TOKEN/g) || []).length === 1
    && guardar.includes('LETTERMINT_API_TOKEN: ${{ secrets.LETTERMINT_API_TOKEN }}')
    && !/set -[a-z]*x|set -o xtrace/.test(BASE) && !/(echo|printf)[^\n]*\$\{?LETTERMINT_API_TOKEN/.test(BASE));
  paso('el paso que guarda pasa token y remitente a psql como variables (-v) desde el entorno, y el SQL usa vault.create_secret / vault.update_secret',
    /psql "\$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 \\\n {12}-v token="\$LETTERMINT_API_TOKEN" -v remitente="\$REMITENTE" \\\n {12}-f "\$SQL"\n/.test(guardar)
    && /if: inputs\.accion == 'guardar-correo'/.test(guardar)
    && /vault\.create_secret\(new_secret := v_valor, new_name := v_nombre/.test(GUARDAR31)
    && /vault\.update_secret\(secret_id := v_id, new_secret := v_valor\)/.test(GUARDAR31)
    && isDeepStrictEqual([...new Set([...sinComentarios(GUARDAR31).matchAll(/:'([a-z_]+)'/g)].map((m) => m[1]))], ['token', 'remitente'])
    && /^\\set VERBOSITY terse$/m.test(GUARDAR31) && !/raise[^;]*(e\.token|v_token|v_valor)/.test(GUARDAR31));
  {
    // Supabase registra con su texto las DDL del rol postgres (log_statement =
    // 'ddl'): las variables de psql solo pueden ir en un SELECT, nunca en un
    // CREATE … AS, un INSERT o cualquier otra sentencia que se registre.
    const sentencias = sinComentarios(GUARDAR31).split('\n').filter((l) => !l.startsWith('\\')).join('\n')
      .split(/(\$[a-z_]*\$[\s\S]*?\$[a-z_]*\$)/).filter((_, i) => i % 2 === 0).join(' ')
      .split(';').map((t) => t.trim()).filter(Boolean);
    const conVariables = sentencias.filter((t) => /:'(token|remitente)'/.test(t));
    paso('guardar-correo pasa el token y el remitente en un solo SELECT (set_config local a la transacción), no en una DDL que Supabase registra con el valor',
      conVariables.length === 1 && /^select set_config\('rwadar\.guardar_token', :'token', true\)/.test(conVariables[0])
      && conVariables[0].includes("set_config('rwadar.guardar_remitente', :'remitente', true)")
      && !/\b(create|alter|insert|update|delete|copy|do|grant|comment)\b/i.test(conVariables[0])
      && !/create\s+(temporary|temp)\s+table/i.test(GUARDAR31)
      && GUARDAR31.includes("current_setting('rwadar.guardar_token', true)"));
  }
  paso('el flujo comprueba que las dos copias de la 30 y las dos de la 31 son idénticas',
    BASE.includes('cmp -s "$D/30_avisos_registrados.sql" rwadar-app/supabase/migrations/20261105200000_avisos_registrados.sql')
    && BASE.includes('cmp -s "$D/31_correo_lettermint.sql" rwadar-app/supabase/migrations/20261106120000_correo_lettermint.sql'));

  if (hayBash) {
    const comprueba = (entradas) => correPaso('Comprobar la acción', { ACCION: 'ensayo-31', CONFIRMAR: '', REMITENTE: '', ...entradas });
    const ambos = `${V30_RUTA} ${V31_RUTA}`;
    const esperados = [
      [{ ACCION: 'ensayo-30' }, { SQL: 'rwadar-app/db/30_avisos_registrados.sql', CAMBIA: 'no', ENSAYO: 'si', VERIFICADORES: V30_RUTA }],
      [{ ACCION: 'verificar-30' }, { SQL: V30_RUTA, CAMBIA: 'no', ENSAYO: 'no', VERIFICADORES: V30_RUTA }],
      [{ ACCION: 'aplicar-30', CONFIRMAR: 'AVISOS' }, { SQL: 'rwadar-app/db/30_avisos_registrados.sql', CAMBIA: 'si', ENSAYO: 'no', VERIFICADORES: V30_RUTA }],
      [{ ACCION: 'ensayo-31' }, { SQL: 'rwadar-app/db/31_correo_lettermint.sql', CAMBIA: 'no', ENSAYO: 'si', VERIFICADORES: ambos }],
      [{ ACCION: 'verificar-31' }, { SQL: V31_RUTA, CAMBIA: 'no', ENSAYO: 'no', VERIFICADORES: ambos }],
      [{ ACCION: 'aplicar-31', CONFIRMAR: 'AVISOS' }, { SQL: 'rwadar-app/db/31_correo_lettermint.sql', CAMBIA: 'si', ENSAYO: 'no', VERIFICADORES: ambos }],
      [{ ACCION: 'guardar-correo', CONFIRMAR: 'AVISOS', REMITENTE: 'avisos@rwadar.example' },
        { SQL: 'rwadar-app/db/31_correo_lettermint_guardar.sql', CAMBIA: 'si', ENSAYO: 'no', VERIFICADORES: V30_RUTA }],
      [{ ACCION: 'activar-correo', CONFIRMAR: 'AVISOS' }, { SQL: 'rwadar-app/db/30_avisos_registrados_activar_correo.sql', CAMBIA: 'si', ENSAYO: 'no', VERIFICADORES: `${ambos} ${V34_RUTA}` }],
    ];
    const vistos = esperados.map(([entradas]) => comprueba(entradas));
    paso(`«Comprobar la acción» elige SQL, copia, ensayo y verificadores de ${esperados.length} acciones (las de la 31 pasan los verificadores 30 y 31; activar-correo, además el 34)`,
      vistos.every((v, i) => v.estado === 0 && isDeepStrictEqual(v.salida, esperados[i][1])));
    const malos = [{ ACCION: 'aplicar-31' }, { ACCION: 'aplicar-31', CONFIRMAR: 'avisos' },
      { ACCION: 'guardar-correo', REMITENTE: 'avisos@rwadar.example' }, { ACCION: 'guardar-correo', CONFIRMAR: 'AVISOS' },
      { ACCION: 'guardar-correo', CONFIRMAR: 'AVISOS', REMITENTE: 'RWAdar <avisos@rwadar.example>' },
      { ACCION: 'guardar-correo', CONFIRMAR: 'AVISOS', REMITENTE: 'avisos@localhost' },
      { ACCION: 'guardar-correo', CONFIRMAR: 'AVISOS', REMITENTE: 'av isos@rwadar.example' },
      { ACCION: 'guardar-correo', CONFIRMAR: 'AVISOS', REMITENTE: 'avisos@rwadar.example\nBcc: otro@ejemplo.test' },
      { ACCION: 'guardar-correo', CONFIRMAR: 'AVISOS', REMITENTE: `${'a'.repeat(250)}@rwadar.example` },
      { ACCION: 'borrar-vault', CONFIRMAR: 'AVISOS' }];
    paso(`y rechaza ${malos.length} entradas malas (sin AVISOS, remitente vacío, con nombre, sin dominio, con espacios o saltos, demasiado largo, acción desconocida) sin dejar nada en GITHUB_ENV`,
      malos.every((e) => { const v = comprueba(e); return v.estado !== 0 && Object.keys(v.salida).length === 0; }));
    // El paso «Verificar», ejecutado de verdad: un psql por verificador, en orden.
    const llamadaVerificador = (v) => ['postgresql://doble-local/sin-red', '-v', 'ON_ERROR_STOP=1', '-X', '-f', v];
    const verificaciones = [
      [{ ACCION: 'aplicar-31', CONFIRMAR: 'AVISOS' }, [V30_RUTA, V31_RUTA]],
      [{ ACCION: 'verificar-31' }, [V30_RUTA, V31_RUTA]],
      [{ ACCION: 'activar-correo', CONFIRMAR: 'AVISOS' }, [V30_RUTA, V31_RUTA, V34_RUTA]],
      [{ ACCION: 'aplicar-30', CONFIRMAR: 'AVISOS' }, [V30_RUTA]],
      [{ ACCION: 'guardar-correo', CONFIRMAR: 'AVISOS', REMITENTE: 'avisos@rwadar.example' }, [V30_RUTA]],
    ].map(([entradas, esperados]) => {
      const v = correPaso('Verificar', { ...comprueba(entradas).salida, SUPABASE_DB_URL: 'postgresql://doble-local/sin-red' });
      return v.estado === 0 && isDeepStrictEqual(v.llamadas.map((l) => l.argv), esperados.map(llamadaVerificador))
        && esperados.every((ruta, i) => v.llamadas[i].sql === fs.readFileSync(path.join(raiz, '..', ruta), 'utf8'));
    });
    paso('el paso «Verificar» del flujo, ejecutado de verdad, pasa los verificadores 30 y 31 (en ese orden) tras aplicar-31 y verificar-31, el 30, el 31 y el 34 tras activar-correo, y solo el 30 tras aplicar-30 y guardar-correo',
      verificaciones.every(Boolean));
  }
}

// Los relojes nuevos no los tocan los LIKE de 22, 23, correo_fallo_cerrado,
// push_fallo_cerrado ni fresh-install.
const FILTROS_ANTIGUOS = ['avisos_ciclo', 'avisos_soltar', 'avisos_confirmar', 'push_ciclo', 'push_soltar',
  'push_confirmar', 'retencion_dispositivos_ciclo'];
const CIERRES_ANTIGUOS = ['22_cierre_regresiones.sql', '22_cierre_regresiones_verificar.sql', '23_activar_correo.sql',
  '23_activar_correo_verificar.sql', 'correo_fallo_cerrado.sql', 'push_fallo_cerrado.sql', 'fresh_install_verificar.sql'];
const LIMPIEZA = ['rwadar-novedades-limpieza', '41 4 * * *', ' select rwadar_novedades.limpiar() '];
{
  const orden = (sql) => sql.match(/select cron\.schedule\('rwadar-novedades', '\*\/5 \* \* \* \*', \$\$(.*?)\$\$\);/)?.[1];
  const ordenes = [orden(ACTIVAR_CORREO), orden(ACTIVAR_PUSH)];
  const ordenLimpieza = SQL30.match(/select cron\.schedule\('rwadar-novedades-limpieza', '41 4 \* \* \*', \$\$(.*?)\$\$\);/)?.[1];
  paso('los dos scripts de activación crean el mismo reloj, que solo llama a rwadar_novedades.procesar()',
    ordenes.every((o) => o === ' select rwadar_novedades.procesar() '));
  paso('la 30 crea el reloj diario de limpieza rwadar-novedades-limpieza a las 41 4 * * *, que solo llama a rwadar_novedades.limpiar()',
    ordenLimpieza === LIMPIEZA[2] && (SQL30.match(/cron\.schedule\(/g) || []).length === 1);
  // Cada LIKE de los cierres y verificadores antiguos, leído de sus archivos y
  // traducido a expresión regular (% = cualquier cosa, _ = un carácter).
  const likes = [], nombres = new Set();
  for (const archivo of CIERRES_ANTIGUOS) {
    const sql = leer(`db/${archivo}`);
    for (const [, patron] of sql.matchAll(/like\s+'([^']*)'/gi)) likes.push(patron);
    for (const [, nombre] of sql.matchAll(/'(rwadar-[a-z-]+)'/g)) nombres.add(nombre);
  }
  const casa = (texto, patron) => new RegExp(`^${patron.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/%/g, '[\\s\\S]*').replace(/_/g, '[\\s\\S]')}$`).test(texto.toLowerCase());
  paso(`las órdenes de los dos relojes de la 30 no casan con ninguno de los ${likes.length} LIKE de 22, 23, correo_fallo_cerrado, push_fallo_cerrado y fresh_install_verificar`,
    likes.length >= 20 && FILTROS_ANTIGUOS.every((f) => likes.includes(`%${f}%`))
    && casa(' select public.push_ciclo(50) ', '%push_ciclo%') && casa('xretencionydispositivosyciclo', '%retencion_dispositivos_ciclo%')
    && [...ordenes, ordenLimpieza].every((o) => o && !likes.some((l) => casa(o, l))));
  paso(`y sus nombres no están entre los que esos archivos quitan o cuentan (${[...nombres].sort().join(', ')})`,
    nombres.size >= 3 && !nombres.has('rwadar-novedades') && !nombres.has(LIMPIEZA[0]));
  paso('fallo_cerrado.sql apaga los interruptores y la casilla de la 30 (con su fecha) y quita cualquier reloj que llame a rwadar_novedades, también el de limpieza',
    /update rwadar_novedades\.configuracion\s+set correo_habilitado = false, push_habilitado = false, ofertas_automaticas = false/.test(FALLO_CERRADO)
    && /update rwadar_novedades\.configuracion set casilla_activa = false where unica/.test(FALLO_CERRADO)
    && /update rwadar_novedades\.configuracion set casilla_activada_el = null where unica/.test(FALLO_CERRADO)
    && FALLO_CERRADO.includes("like '%rwadar_novedades.%'") && FALLO_CERRADO.includes(`'${LIMPIEZA[0]}'`));
  paso('apagar.sql no toca la casilla del alta y deja el reloj de limpieza; apagar_casilla.sql solo toca la casilla',
    !/casilla_activ/.test(sinComentarios(APAGAR)) && APAGAR.includes("= 'select rwadar_novedades.limpiar()'")
    && /set casilla_activa = false/.test(APAGAR_CASILLA) && /set casilla_activada_el = null/.test(APAGAR_CASILLA)
    && !/correo_habilitado|push_habilitado|ofertas_automaticas|cron\./.test(sinComentarios(APAGAR_CASILLA)));
}

/* =====================================================================
   2 · La cadena de producción
   ===================================================================== */
const LOTES_PREVIOS = ['2026-10-22', '2026-10-23', '2026-11-02', '2026-11-03', '2026-11-03.2', '2026-11-03.3',
  '2026-11-03.4', '2026-11-03.5', '2026-11-03.6', '2026-11-03.7', '2026-11-04', '2026-11-04.2'];
// Reloj del ensayo: la guarda de caducidad de un lote real («current_date >
// fecha tope») se evalúa en el día del lote, para que esta prueba siga
// valiendo después del 12/11. Es la única sustitución; el resto, literal.
const sustituciones = new Map();
const loteReal = (etiqueta) => {
  const sql = leer(`data/importaciones/catalogo-${etiqueta}-v2/aplicar-y-aprobar.sql`);
  const tope = /current_date > date '(\d{4}-\d{2}-\d{2})'/g;
  sustituciones.set(etiqueta, (sql.match(tope) || []).length);
  return sql.replace(tope, `date '${etiqueta.slice(0, 10)}' > date '$1'`);
};
const AUTH_DOBLES = `
  alter table auth.users add column is_anonymous boolean default false;
  -- Como en Supabase: cuándo salió el correo de confirmación (GoTrue lo fija al enviarlo).
  alter table auth.users add column confirmation_sent_at timestamptz;
  alter table auth.users alter column raw_user_meta_data drop not null;
  create or replace function auth.uid() returns uuid language sql stable security definer
    set search_path='' as $$ select uid from public._sesion limit 1 $$;
  create table auth.sessions(id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
    not_after timestamptz);
  create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  revoke all on auth.users, auth.sessions from public, anon, authenticated;
  -- El rol con el que GoTrue escribe en auth.users. Ningún permiso sobre rwadar_novedades.
  create role supabase_auth_admin noinherit;
  grant usage on schema auth to supabase_auth_admin;
  grant select, insert, update, delete on auth.users, auth.sessions to supabase_auth_admin;`;

async function baseProduccion({ antesDelRefuerzo } = {}) {
  const db = await baseCatalogoHistorico();
  await db.exec('alter default privileges grant all on tables to anon, authenticated');
  for (const ruta of ['db/24_catalogo_publico_verificado.sql', 'db/25_servicios_editoriales_solo_lectura.sql',
    'supabase/migrations/20260930084133_ofertas_documentacion_publica.sql',
    'supabase/migrations/20260930090621_catalogo_v2_colecciones.sql',
    'supabase/migrations/20261001150000_catalogo_siempre_disponible.sql']) await db.exec(leer(ruta));
  for (const etiqueta of LOTES_PREVIOS) await db.exec(loteReal(etiqueta));
  await db.exec(leer('db/26_reabrir_cuentas.sql'));
  await db.exec(AUTH_DOBLES);
  if (antesDelRefuerzo) await antesDelRefuerzo(db);
  await db.exec(leer('supabase/migrations/20261011074218_cuentas_sesion_confirmada.sql'));
  await db.exec(leer('db/28_catalogo_cuenta_obligatoria.sql'));
  await db.exec(leer('db/28_catalogo_cuenta_obligatoria_REVERTIR.sql'));
  await db.exec(leer('db/29_cartera_cuenta.sql'));
  return db;
}

// Lo que deja un lote del catálogo, sin fechas de reloj (aprobada_el, actualizada_el).
async function fotoCatalogo(db) {
  await sesion(db);
  const q = async (sql) => JSON.stringify(await filas(db, sql));
  const foto = {
    publicacion: await q('select revision_id from rwadar_catalogo.publicacion_v2'),
    retirado: await q('select retirado, motivo from public.catalogo_publicacion'),
    revisiones: await q('select id, estado, contenido_sha256 from rwadar_catalogo.revisiones order by id'),
    cuentas: await q(`select (select count(*)::int from rwadar_catalogo.plataformas) p,
      (select count(*)::int from rwadar_catalogo.ofertas) o, (select count(*)::int from rwadar_catalogo.fuentes) f,
      (select count(*)::int from rwadar_catalogo.alertas) a`),
    plataformas: await q('select slug, nombre, estado, web from public.plataformas order by slug'),
    cambios: await q(`select p.slug, c.estado_anterior, c.estado_nuevo, c.titular
      from public.cambios_estado c join public.plataformas p on p.id = c.plataforma_id order by c.id`),
  };
  await sesion(db, null, 'anon');
  foto.ofertasPublicas = await q('select slug, coleccion, titulo from public.catalogo_ofertas_publicas_v2 order by slug');
  foto.plataformasPublicas = await q('select slug from public.catalogo_plataformas_publicas_v2 order by slug');
  await sesion(db);
  return foto;
}

// Base de contraste: la misma cadena SIN la 30, con los dos lotes reales del 05/11.
const sin30 = await baseProduccion();
for (const etiqueta of ['2026-11-05', '2026-11-05.2']) await sin30.exec(loteReal(etiqueta));
const fotoSin30 = await fotoCatalogo(sin30);
await sin30.close();

db = await baseProduccion({
  antesDelRefuerzo: async (base) => {
    const e = await error(() => base.exec(SQL30));
    await base.exec('rollback');
    paso('sin el refuerzo de sesión confirmada la 30 se rechaza y no deja nada',
      e?.code === '55000' && /refuerzo de sesión/.test(e.message)
      && (await una(base, "select to_regnamespace('rwadar_novedades') n")).n === null);
  },
});
paso('lotes reales del catálogo: solo los del 05/11 llevan guarda de caducidad y se fija en su día',
  [...sustituciones].every(([etiqueta, n]) => n === (etiqueta.startsWith('2026-11-05') ? 1 : 0)));

// Cuentas que ya existían antes de la 30.
const previa = await alta(db, 'previa@ejemplo.test', { avisos_novedades: true, avisos_version: VERSION });
const previaPendiente = await alta(db, 'previa-pendiente@ejemplo.test');
const previaAnonima = await alta(db, 'previa-anonima@ejemplo.test');
await db.query('update auth.users set email_confirmed_at = null where id = $1', [previaPendiente.id]);
await db.query('update auth.users set is_anonymous = true where id = $1', [previaAnonima.id]);

// El «ensayo-30» de .github/workflows/avisos-base.yml, montado igual que allí:
// la 30 sin su última línea (commit;), el verificador sin su begin ni su
// última línea (rollback;) y un rollback. Debe pasar y no dejar nada.
{
  const lineas = (t) => t.replace(/\n$/, '').split('\n');
  const sinUltima = (t) => lineas(t).slice(0, -1).join('\n') + '\n';
  const forma = (SQL30.match(/^commit;$/gm) || []).length === 1 && lineas(SQL30).at(-1) === 'commit;'
    && (VERIFICAR30.match(/^begin transaction read only;$/gm) || []).length === 1 && lineas(VERIFICAR30).at(-1) === 'rollback;';
  const ensayo = sinUltima(SQL30)
    + sinUltima(lineas(VERIFICAR30).filter((l) => l !== 'begin transaction read only;').join('\n') + '\n')
    + 'rollback;\n';
  await sesion(db);
  const avisos = [];
  const e = await error(() => db.exec(ensayo, { onNotice: (n) => avisos.push(n.message) }));
  if (e) await db.exec('rollback');
  paso(`el ensayo-30 del flujo «Avisos a registrados (base)» pasa sobre la cadena de producción y no deja nada (${e?.message || 'OK'})`,
    forma && !e && avisos.some((a) => a.startsWith('RWAdar 30 OK'))
    && (await una(db, "select to_regnamespace('rwadar_novedades') n")).n === null
    && (await una(db, "select count(*)::int n from pg_trigger where tgrelid = 'auth.users'::regclass and tgname like 'rwadar_novedades%'")).n === 0
    && (await una(db, "select count(*)::int n from cron.job where jobname like 'rwadar-novedades%'")).n === 0);
}

// Privilegios por defecto hostiles mientras se aplica la 30: cualquier objeto
// nuevo nacería abierto a los clientes. La 30 debe cerrarlo todo ella sola.
const HOSTIL = `alter default privileges grant execute on functions to anon, authenticated, service_role;
  alter default privileges grant all on sequences to anon, authenticated;
  alter default privileges grant all on tables to anon, authenticated, service_role`;
await db.exec(HOSTIL);
await db.exec(SQL30);
await db.exec(SQL30);
paso('la 30 se aplica literalmente dos veces sobre la cadena de producción', true);

// La 31 encima de la 30, como en producción (la 30 se aplicó el 06/11/2026).
// Antes: los correos que construye la 30, para comparar, y los ensayos del
// flujo tal cual (bash, doble de psql y el SQL que montan, en PGlite).
const MUESTRAS = [
  ['bienvenida', null, null, null, false, null],
  ['bienvenida', null, null, null, true, '11111111-2222-4333-8444-555555555555'],
  ['anuncio', 'Avisos & <mejoras>', 'Texto "con" comillas y \'apóstrofos\'.', 'https://rwadar.pages.dev/academy/', true,
    '11111111-2222-4333-8444-555555555555'],
];
const correosMuestra = async () => {
  await sesion(db);
  const lista = [];
  for (const m of MUESTRAS) lista.push((await una(db, 'select rwadar_novedades.correo_mensaje($1, $2, $3, $4, $5, $6) m', m)).m);
  return lista;
};
const correos30 = await correosMuestra();
const definicion = async (firma) => { await sesion(db); return (await una(db, 'select pg_get_functiondef($1::regprocedure) d', [firma])).d; };
const FIRMAS_31 = ['rwadar_novedades.correo_mensaje(text,text,text,text,boolean,uuid)', 'rwadar_novedades.leer_correos()',
  'rwadar_novedades.enviar_correos(integer)'];
const verificar31 = async () => {
  await sesion(db);
  const avisos = [];
  const e = await error(() => db.exec(VERIFICAR31, { onNotice: (n) => avisos.push(n.message) }));
  if (e) { await db.exec('rollback'); return { ok: false, error: e.message }; }
  const aviso = avisos.find((a) => a.startsWith('RWAdar 31 OK'));
  return { ok: !!aviso, aviso };
};
if (hayBash) {
  for (const [accion, archivo, oks] of [['ensayo-30', '30_avisos_registrados.sql', ['RWAdar 30 OK']],
    ['ensayo-31', '31_correo_lettermint.sql', ['RWAdar 30 OK', 'RWAdar 31 OK']]]) {
    const comprobar = correPaso('Comprobar la acción', { ACCION: accion, CONFIRMAR: '', REMITENTE: '' });
    const ensayo = correPaso('Ensayo sin cambiar nada (se deshace al final)',
      { ...comprobar.salida, SUPABASE_DB_URL: 'postgresql://doble-local/sin-red' });
    const [llamada] = ensayo.llamadas;
    await sesion(db);
    const avisos = [];
    const e = await error(() => db.exec(llamada?.sql || 'select 1 / 0', { onNotice: (n) => avisos.push(n.message) }));
    if (e) await db.exec('rollback');
    const envio = await definicion('rwadar_novedades.enviar_correos(integer)');
    paso(`el paso «Ensayo» del flujo, ejecutado de verdad para ${accion}, monta ${archivo} + sus verificadores + rollback, pasa en PGlite y no deja nada (${e?.message || 'OK'})`,
      comprobar.estado === 0 && ensayo.estado === 0 && ensayo.llamadas.length === 1
      && isDeepStrictEqual(llamada.argv.slice(0, 5), ['postgresql://doble-local/sin-red', '-v', 'ON_ERROR_STOP=1', '-X', '-f'])
      && ensayo.texto.includes(`ENSAYO CORRECTO: ${archivo} y sus verificadores pasan`)
      && llamada.sql.trimEnd().endsWith('rollback;') && !/^commit;$/m.test(llamada.sql)
      && !e && oks.every((ok) => avisos.some((a) => a.startsWith(ok)))
      && envio.includes('api.brevo.com') && !envio.includes('api.lettermint.co'));
  }
}
await db.exec(SQL31);
await sesion(db);
await db.exec('grant execute on function rwadar_novedades.leer_correos() to anon, service_role');
await db.exec(SQL31);
await db.exec(HOSTIL.replace(/ grant /g, ' revoke ').replace(/ to /g, ' from '));
await db.exec('alter default privileges grant all on tables to anon, authenticated'); // la base de antes
{
  const [tres] = await filas(db, `select count(*)::int n,
      bool_and(p.prosecdef and p.proconfig && array['search_path=""', 'search_path=']) definer,
      bool_and(p.proowner = (select q.proowner from pg_proc q where q.oid = 'rwadar_novedades.procesar()'::regprocedure)) dueno,
      bool_or(has_function_privilege('public', p.oid, 'EXECUTE') or has_function_privilege('anon', p.oid, 'EXECUTE')
        or has_function_privilege('authenticated', p.oid, 'EXECUTE') or has_function_privilege('service_role', p.oid, 'EXECUTE')) abierta,
      bool_and(pg_get_functiondef(p.oid) not ilike '%brevo%') sin_brevo
    from pg_proc p where p.oid in (to_regprocedure($1), to_regprocedure($2), to_regprocedure($3))`, FIRMAS_31);
  paso('la 31 se aplica dos veces con privilegios por defecto hostiles; sus tres funciones siguen definer, con search_path vacío y el dueño de la 30, sin Brevo, y una abierta a mano entre medias vuelve a quedar cerrada',
    tres.n === 3 && tres.definer && tres.dueno && !tres.abierta && tres.sin_brevo);
  const correos31 = await correosMuestra();
  paso('con la 31, correo_mensaje construye exactamente los mismos correos que con la 30 salvo la dirección postal del responsable en el pie',
    correos31.length === 3 && correos31.every((c, i) => c.html.includes(`${RESPONSABLE_CORREO} (<a href=`)
      && c.texto.includes(`${RESPONSABLE_CORREO}.\nAviso legal:`)
      && isDeepStrictEqual(JSON.parse(JSON.stringify(c).replaceAll(RESPONSABLE_CORREO, RESPONSABLE)), correos30[i])));
  const v31 = await verificar31();
  paso(`el verificador 31 pasa con todo apagado («${v31.aviso || v31.error}»)`, v31.ok && /correo apagado$/.test(v31.aviso));
}

/* =====================================================================
   3 · Estado de instalación: apagado, relleno, permisos
   ===================================================================== */
const AVISO_CASILLA = /^RWAdar 30: casilla del alta inactiva: si la web o la app enseñan la casilla, ejecuta 30_avisos_registrados_activar_casilla\.sql/;
const verificar = async () => {
  await sesion(db);
  const avisos = [];
  const e = await error(() => db.exec(VERIFICAR30, { onNotice: (n) => avisos.push(n.message) }));
  if (e) { await db.exec('rollback'); return { ok: false, error: e.message }; }
  return { ok: avisos.some((a) => a.startsWith('RWAdar 30 OK')), aviso: avisos.find((a) => a.startsWith('RWAdar 30 OK')),
    avisoCasilla: avisos.find((a) => AVISO_CASILLA.test(a)) };
};
// Todos los relojes de la 30; `relojes()` son los de envío (todos menos el
// de limpieza canónico) y `conLimpieza()` exige ese, uno y tal cual.
const todosRelojes = async () => (await sesion(db), filas(db, `select jobname, schedule, command from cron.job
  where jobname like 'rwadar-novedades%' or lower(coalesce(command, '')) like '%rwadar_novedades.%' order by jobname, jobid`));
const esLimpieza = (r) => r.jobname === LIMPIEZA[0] && r.command.trim().toLowerCase() === LIMPIEZA[2].trim();
const relojes = async () => (await todosRelojes()).filter((r) => !esLimpieza(r));
const conLimpieza = async () => isDeepStrictEqual((await todosRelojes()).filter(esLimpieza)
  .map((r) => [r.jobname, r.schedule, r.command]), [LIMPIEZA]);
const config = async () => { await sesion(db); return una(db, 'select * from rwadar_novedades.configuracion'); };
const pref = async (u) => { await sesion(db); return una(db, 'select * from rwadar_novedades.preferencias where usuario_id = $1', [u.id]); };

{
  const c = await config();
  const v = await verificar();
  paso('todo nace apagado: casilla del alta, correo, push y ofertas automáticas, sin fechas de activación ni reloj de envío',
    !c.casilla_activa && c.casilla_activada_el === null && !c.correo_habilitado && !c.push_habilitado && !c.ofertas_automaticas
    && c.correo_activado_el === null && c.push_activado_el === null && (await relojes()).length === 0);
  paso('aplicada dos veces, la 30 deja UN reloj diario de limpieza rwadar-novedades-limpieza (41 4 * * *) que solo llama a limpiar()',
    await conLimpieza() && (await todosRelojes()).length === 1);
  paso('configuracion guarda la versión y los textos de la casilla EXACTAMENTE como el contrato',
    c.version_consentimiento === VERSION && c.texto_consentimiento_es === TEXTO_ES && c.texto_consentimiento_en === TEXTO_EN);
  paso(`el verificador 30 pasa con todo apagado («${v.aviso || v.error}»)`,
    v.ok && /casilla del alta inactiva, correo apagado, push apagado/.test(v.aviso) && /reloj diario de limpieza/.test(v.aviso));
  paso(`y avisa de la casilla inactiva («${v.avisoCasilla}»)`, AVISO_CASILLA.test(v.avisoCasilla || ''));
  paso('las cuentas confirmadas que ya existían reciben preferencias con novedades = false, aunque sus metadatos digan true',
    (await pref(previa))?.novedades === false && (await pref(previa)).aceptado_el === null);
  paso('ni las cuentas sin confirmar ni las anónimas reciben preferencias',
    !(await pref(previaPendiente)) && !(await pref(previaAnonima)));
}
{
  const funciones = await filas(db, `select p.oid::regprocedure::text firma, p.prosecdef, p.proconfig,
      has_function_privilege('public', p.oid, 'EXECUTE') pub, has_function_privilege('anon', p.oid, 'EXECUTE') anon,
      has_function_privilege('authenticated', p.oid, 'EXECUTE') aut, has_function_privilege('service_role', p.oid, 'EXECUTE') srv
    from pg_proc p where p.pronamespace = 'rwadar_novedades'::regnamespace`);
  const vacio = (f) => f.prosecdef && f.proconfig?.some((v) => /^search_path=(""|)$/.test(v));
  paso(`ninguna de las ${funciones.length} funciones de rwadar_novedades es ejecutable por public, anon, authenticated ni service_role`,
    funciones.length >= 15 && funciones.every((f) => !f.pub && !f.anon && !f.aut && !f.srv));
  paso('todas son security definer con search_path vacío', funciones.every(vacio));
  const [esquema] = await filas(db, `select has_schema_privilege('anon','rwadar_novedades','USAGE') a,
    has_schema_privilege('authenticated','rwadar_novedades','USAGE') b, has_schema_privilege('public','rwadar_novedades','USAGE') c`);
  const tablas = await filas(db, `select c.relname, c.relrowsecurity rls,
      has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE') anon,
      has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE') aut,
      has_table_privilege('public', c.oid, 'SELECT,INSERT,UPDATE,DELETE') pub
    from pg_class c where c.relnamespace = 'rwadar_novedades'::regnamespace and c.relkind = 'r'`);
  paso('el esquema privado no tiene usage para clientes; sus 7 tablas (historial_permiso incluida), RLS y ningún permiso',
    !esquema.a && !esquema.b && !esquema.c && tablas.length === 7 && tablas.some((t) => t.relname === 'historial_permiso')
    && tablas.every((t) => t.rls && !t.anon && !t.aut && !t.pub));
  const baja = funciones.find((f) => f.firma === 'rwadar_novedades.baja_por_correo(text)');
  paso('rwadar_novedades.baja_por_correo(text) existe y solo la ejecuta el propietario (ni public, ni anon, ni authenticated, ni service_role)',
    baja && vacio(baja) && !baja.pub && !baja.anon && !baja.aut && !baja.srv);
  const [historial] = await filas(db, `select
      (select count(*)::int from pg_constraint where conrelid = 'rwadar_novedades.historial_permiso'::regclass and contype = 'f') fk,
      (select count(*)::int from pg_trigger where tgrelid = 'auth.users'::regclass and tgname = 'rwadar_novedades_borrado'
         and (tgtype & 2) = 2 and (tgtype & 8) = 8 and tgfoid = 'rwadar_novedades.al_borrar_cuenta()'::regprocedure) borrado`);
  paso('historial_permiso no tiene clave ajena a auth.users y hay un disparador BEFORE DELETE en auth.users que lo marca',
    historial.fk === 0 && historial.borrado === 1);
  const rpc = await filas(db, `select f.firma, p.prosecdef, p.proconfig,
      has_function_privilege('public', p.oid, 'EXECUTE') pub, has_function_privilege('anon', p.oid, 'EXECUTE') anon,
      has_function_privilege('authenticated', p.oid, 'EXECUTE') aut, has_function_privilege('service_role', p.oid, 'EXECUTE') srv
    from (values ('public.estado_mis_avisos()'), ('public.configurar_avisos_novedades(boolean,text,text,text)'),
      ('public.registrar_aviso_push(text,text)'), ('public.quitar_aviso_push(text)'),
      ('public.mi_aviso_push_registrado(text)'),
      ('public.mis_avisos_recientes(integer)'), ('public.baja_avisos(uuid)')) f(firma)
    join pg_proc p on p.oid = to_regprocedure(f.firma)`);
  paso('API pública: las 7 RPC existen, definer con search_path vacío; authenticated sí, public y service_role no',
    rpc.length === 7 && rpc.every((f) => vacio(f) && f.aut && !f.pub && !f.srv));
  paso('anon solo puede ejecutar baja_avisos', rpc.filter((f) => f.anon).map((f) => f.firma).join() === 'public.baja_avisos(uuid)');
  paso('configurar_avisos_novedades solo existe con su firma nueva de cuatro argumentos (p_idioma opcional): la de tres ya no',
    (await una(db, "select to_regprocedure('public.configurar_avisos_novedades(boolean,text,text)') v")).v === null);
  const disparadores = await filas(db, `select tgname from pg_trigger
    where tgrelid = 'rwadar_catalogo.revisiones'::regclass and not tgisinternal order by tgname collate "C"`);
  paso('avisar_ofertas_nuevas se dispara antes que fijar_publicacion_v2 (orden alfabético de los AFTER)',
    disparadores.map((t) => t.tgname).join() === 'avisar_ofertas_nuevas,fijar_publicacion_v2,sincronizar_publicacion_catalogo');
  const [vault] = await filas(db, `select has_table_privilege('anon','vault.decrypted_secrets','SELECT') a,
    has_table_privilege('authenticated','vault.decrypted_secrets','SELECT') b,
    has_table_privilege('authenticated','net._http_response','SELECT') c, has_table_privilege('anon','net.http_request_queue','SELECT') d`);
  paso('se repiten los cierres de 23: ni Vault ni las colas de pg_net para los clientes', !vault.a && !vault.b && !vault.c && !vault.d);
}
{
  // Producción (06/11/2026): Supabase concede las colas de pg_net a PUBLIC desde
  // supabase_admin y postgres no puede retirarlo. El verificador lo avisa sin
  // pararse; los secretos de Vault, en cambio, siguen parándolo todo.
  await sesion(db);
  await db.exec('grant select on table net.http_request_queue to public');
  const conColas = await verificar();
  await db.exec('revoke all on table net.http_request_queue from public');
  await db.exec('grant select on table vault.decrypted_secrets to authenticated');
  const conVault = await verificar();
  await db.exec('revoke all on table vault.decrypted_secrets from authenticated');
  paso('verificador 30: colas de pg_net abiertas por Supabase = aviso (no para); Vault legible por un cliente = error',
    conColas.ok && !conVault.ok && /secretos de Vault/.test(conVault.error) && (await verificar()).ok);
}
{
  // El verificador cubre lo nuevo: la RPC del móvil y las columnas de la casilla y las marcas.
  await sesion(db);
  await db.exec('grant execute on function public.mi_aviso_push_registrado(text) to anon');
  const v1 = await verificar();
  await db.exec('revoke execute on function public.mi_aviso_push_registrado(text) from anon');
  await db.exec('alter table rwadar_novedades.preferencias rename column bienvenida_push_el to bienvenida_push_otra');
  const v2 = await verificar();
  await db.exec('alter table rwadar_novedades.preferencias rename column bienvenida_push_otra to bienvenida_push_el');
  await db.exec('alter table rwadar_novedades.configuracion rename column casilla_activada_el to casilla_otra');
  const v3 = await verificar();
  await db.exec('alter table rwadar_novedades.configuracion rename column casilla_otra to casilla_activada_el');
  paso('el verificador 30 detecta mi_aviso_push_registrado abierta a anon y la falta de la casilla, de su fecha o de las marcas de bienvenida',
    !v1.ok && /mi_aviso_push_registrado/.test(v1.error) && !v2.ok && /casilla_activada_el o las marcas/.test(v2.error)
    && !v3.ok && /casilla_activada_el o las marcas/.test(v3.error) && (await verificar()).ok);

  // Lo nuevo de la revisión legal: baja_por_correo abierta, disparadores del
  // historial quitados, una clave ajena que lo borraría con la cuenta, la firma
  // antigua de configurar, limpiar() que borra anuncios y el filtro antiguo.
  await sesion(db);
  const prueba = async (romper, arreglar) => { await sesion(db); await db.exec(romper); const v = await verificar(); await sesion(db); await db.exec(arreglar); return v; };
  const vBaja = await prueba('grant execute on function rwadar_novedades.baja_por_correo(text) to service_role',
    'revoke execute on function rwadar_novedades.baja_por_correo(text) from service_role');
  const vBorrado = await prueba('alter table auth.users disable trigger rwadar_novedades_borrado',
    'alter table auth.users enable trigger rwadar_novedades_borrado');
  const vSolo = await prueba('drop trigger historial_solo_anadir on rwadar_novedades.historial_permiso',
    'create trigger historial_solo_anadir before update or delete on rwadar_novedades.historial_permiso for each row execute function rwadar_novedades.historial_solo_anadir()');
  const vFk = await prueba('alter table rwadar_novedades.historial_permiso add constraint borra_con_la_cuenta foreign key (usuario_id) references auth.users(id) on delete cascade not valid',
    'alter table rwadar_novedades.historial_permiso drop constraint borra_con_la_cuenta');
  const vFirma = await prueba(`create function public.configurar_avisos_novedades(p_activar boolean, p_version text, p_canal text)
      returns jsonb language sql security definer set search_path = '' as $f$ select '{}'::jsonb $f$`,
    'drop function public.configurar_avisos_novedades(boolean, text, text)');
  const limpiarOriginal = SQL30.match(/create or replace function rwadar_novedades\.limpiar\(\)[\s\S]*?\n\$funcion\$;/)[0];
  const vLimpiar = await prueba(limpiarOriginal.replace('return v_total;', 'delete from rwadar_novedades.anuncios where false;\n  return v_total;'), limpiarOriginal);
  const vPalabras = await prueba(`alter table rwadar_novedades.anuncios drop constraint anuncio_sin_palabras_vetadas;
      alter table rwadar_novedades.anuncios add constraint anuncio_sin_palabras_vetadas check ((titulo || ' ' || texto) !~* '(oportunidad|rentabilidad|garantiz|%)')`,
    SQL30.match(/alter table rwadar_novedades\.anuncios drop constraint if exists anuncio_sin_palabras_vetadas;[\s\S]*?\$palabras_vetadas\$;/)[0]);
  paso('el verificador 30 detecta baja_por_correo abierta, el disparador de borrado desactivado, sin historial_solo_anadir, una clave ajena en el historial, la firma antigua de configurar, un limpiar() que borra anuncios y el filtro de palabras antiguo',
    !vBaja.ok && /baja_por_correo/.test(vBaja.error) && !vBorrado.ok && /rwadar_novedades_borrado/.test(vBorrado.error)
    && !vSolo.ok && /historial_solo_anadir/.test(vSolo.error) && !vFk.ok && /clave ajena/.test(vFk.error)
    && !vFirma.ok && /firma antigua/.test(vFirma.error) && !vLimpiar.ok && /nunca los anuncios/.test(vLimpiar.error)
    && !vPalabras.ok && /filtro de palabras/.test(vPalabras.error) && (await verificar()).ok);

  // Un disparador de confirmación sin la comprobación de la fecha de envío.
  const original = SQL30.match(/create or replace function rwadar_novedades\.al_confirmar_cuenta\(\)[\s\S]*?\n\$funcion\$;/)[0];
  await db.exec(`create or replace function rwadar_novedades.al_confirmar_cuenta() returns trigger
    language plpgsql security definer set search_path = '' as $f$ begin
      perform 1 from rwadar_novedades.configuracion c where c.casilla_activa; return null; end $f$`);
  const v4 = await verificar();
  await db.exec(original);
  paso('el verificador 30 detecta un disparador de confirmación que no mira confirmation_sent_at ni casilla_activada_el',
    !v4.ok && /confirmation_sent_at/.test(v4.error) && (await verificar()).ok);

  // El verificador 31: cada cosa que desharía el cambio a Lettermint, rota y
  // arreglada con el texto literal de la 30 o de la 31.
  const funcionDe = (sql, nombre) => sql.match(new RegExp(`create or replace function rwadar_novedades\\.${nombre}\\([\\s\\S]*?\\n\\$funcion\\$;`))[0];
  const envio31 = funcionDe(SQL31, 'enviar_correos');
  const rompe31 = async (romper, arreglar) => {
    await sesion(db); await db.exec(romper); const v = await verificar31(); await sesion(db); await db.exec(arreglar); return v;
  };
  const dueno = (await una(db, "select p.proowner::regrole::text d from pg_proc p where p.oid = 'rwadar_novedades.procesar()'::regprocedure")).d;
  const rotos = {
    'enviar_correos de la 30 (Brevo)': [await rompe31(funcionDe(SQL30, 'enviar_correos'), envio31), /api\.brevo\.com/],
    'leer_correos de la 30': [await rompe31(funcionDe(SQL30, 'leer_correos'), funcionDe(SQL31, 'leer_correos')), /mencionan Brevo/],
    'correo_mensaje de la 30 (sin dirección)': [await rompe31(funcionDe(SQL30, 'correo_mensaje'), funcionDe(SQL31, 'correo_mensaje')), /dirección postal/],
    'track_opens true': [await rompe31(envio31.replace("'track_opens', false", "'track_opens', true"), envio31), /track_opens/],
    'track_clicks true': [await rompe31(envio31.replace("'track_clicks', false", "'track_clicks', true"), envio31), /track_clicks/],
    'route también en la bienvenida': [await rompe31(envio31.replace("if r.tipo = 'anuncio' then", 'if true then'), envio31), /broadcast/],
    'sin Idempotency-Key': [await rompe31(envio31.replace("'Idempotency-Key', v_idempotencia::text,", ''), envio31), /Idempotency-Key/],
    // La clave sacada de la cabecera HTTP y puesta en las cabeceras del correo:
    // Lettermint no deduplicaría y un reintento tras un timeout enviaría otro.
    'Idempotency-Key en las cabeceras del correo': [await rompe31(envio31.replace("'Idempotency-Key', v_idempotencia::text,", '')
      .replace('    if v_suscrito then', "    v_cuerpo := v_cuerpo || jsonb_build_object('headers', jsonb_build_object('Idempotency-Key', v_idempotencia::text));\n    if v_suscrito then"), envio31), /Idempotency-Key/],
    'cuerpo sin settings': [await rompe31(envio31.replace('body := v_cuerpo,', "body := v_cuerpo - 'settings',"), envio31), /body := v_cuerpo/],
    'clave nueva al reintentar sin respuesta': [await rompe31(envio31.replace("error = 'Respuesta del proveedor agotada'",
      "idempotencia = null, error = 'Respuesta del proveedor agotada'"), envio31), /la misma en cada reintento/],
    'List-Unsubscribe-Post': [await rompe31(envio31.replace("'List-Unsubscribe',", "'List-Unsubscribe-Post', 'List-Unsubscribe=One-Click', 'List-Unsubscribe',"), envio31), /List-Unsubscribe-Post/],
    'con metadata': [await rompe31(envio31.replace("'reply_to',", "'metadata', jsonb_build_object('u', r.id), 'reply_to',"), envio31), /metadata/],
    '409 reenviado': [await rompe31(funcionDe(SQL31, 'leer_correos').replace('elsif r.status_code = 409 then', 'elsif false then'), funcionDe(SQL31, 'leer_correos')), /409 incierto/],
    'ejecutable por service_role': [await rompe31('grant execute on function rwadar_novedades.enviar_correos(integer) to service_role',
      'revoke execute on function rwadar_novedades.enviar_correos(integer) from service_role'), /ejecutable por service_role/],
    'security invoker': [await rompe31('alter function rwadar_novedades.leer_correos() security invoker',
      'alter function rwadar_novedades.leer_correos() security definer'), /security definer/],
    'search_path quitado': [await rompe31('alter function rwadar_novedades.leer_correos() reset search_path',
      "alter function rwadar_novedades.leer_correos() set search_path = ''"), /search_path vacío/],
    'otro dueño': [await rompe31('alter function rwadar_novedades.correo_mensaje(text,text,text,text,boolean,uuid) owner to service_role',
      `alter function rwadar_novedades.correo_mensaje(text,text,text,text,boolean,uuid) owner to ${dueno}`), /dueño/],
  };
  const fallan = Object.entries(rotos).filter(([, [v, motivo]]) => v.ok || !motivo.test(v.error || '')).map(([n, [v]]) => `${n}: ${v.error || 'pasa'}`);
  paso(`el verificador 31 detecta ${Object.keys(rotos).length} roturas (Brevo de vuelta, pie sin dirección, seguimiento, ruta, clave idempotente quitada, movida al correo o nueva al reintentar, cuerpo sin settings, List-Unsubscribe-Post, metadata, 409, permisos, definer, search_path y dueño)${fallan.length ? ` · no detecta: ${fallan.join(' | ')}` : ''}`,
    fallan.length === 0 && (await verificar31()).ok && (await verificar()).ok);

  // La casilla no se enciende sin fecha: solo con activar_casilla.
  const ec = await error(() => db.exec('update rwadar_novedades.configuracion set casilla_activa = true'));
  paso('encender la casilla a mano sin casilla_activada_el lo impide la base (23514)',
    ec?.code === '23514' && !(await config()).casilla_activa);

  // Reloj de limpieza alterado, quitado o con un alias que llama a limpiar().
  await sesion(db);
  await db.exec(`update cron.job set schedule = '* * * * *' where jobname = '${LIMPIEZA[0]}'`);
  const va = await verificar();
  await db.exec(`update cron.job set schedule = '${LIMPIEZA[1]}' where jobname = '${LIMPIEZA[0]}';
    select cron.unschedule('${LIMPIEZA[0]}')`);
  const vb = await verificar();
  await db.exec(`select cron.schedule('${LIMPIEZA[0]}', '${LIMPIEZA[1]}', $$${LIMPIEZA[2]}$$);
    select cron.schedule('alias-limpieza', '* * * * *', $$ select rwadar_novedades.limpiar() $$)`);
  const vc = await verificar();
  await db.exec("select cron.unschedule('alias-limpieza')");
  paso('el verificador 30 exige el reloj diario de limpieza tal cual (ni alterado, ni ausente) y ningún otro reloj de rwadar_novedades con todo apagado',
    !va.ok && /reloj diario de limpieza/.test(va.error) && !vb.ok && /reloj diario de limpieza/.test(vb.error)
    && !vc.ok && /ningún reloj de envío/.test(vc.error) && (await verificar()).ok && await conLimpieza());
}
{
  // Retención con todo apagado y sin haber activado nunca nada: la orden del
  // reloj diario, ejecutada como la ejecuta pg_cron, borra lo caducado.
  await sesion(db);
  const TOKEN_VIEJO = 'ExponentPushToken[retencion-vieja-0001]', TOKEN_RECIENTE = 'ExponentPushToken[retencion-nueva-0001]';
  await db.query(`insert into rwadar_novedades.correos (usuario_id, tipo, estado, creado_el, terminado_el)
    values ($1, 'bienvenida', 'descartado', now() - interval '100 days', now() - interval '91 days')`, [previa.id]);
  await db.query(`insert into rwadar_novedades.pushes (usuario_id, tipo, estado, creado_el, terminado_el)
    values ($1, 'bienvenida', 'fallido', now() - interval '100 days', now() - interval '91 days')`, [previa.id]);
  await db.query(`insert into rwadar_novedades.dispositivos (token, usuario_id, plataforma, actualizado_el)
    values ($1, $3, 'android', now() - interval '181 days'), ($2, $3, 'android', now())`, [TOKEN_VIEJO, TOKEN_RECIENTE, previa.id]);
  const [reloj] = (await todosRelojes()).filter(esLimpieza);
  const peticionesAntes = await numero(db, 'select count(*) from net.http_request_queue');
  const fila = await una(db, reloj.command);
  const quedan = await una(db, `select (select count(*)::int from rwadar_novedades.correos) c,
    (select count(*)::int from rwadar_novedades.pushes) p,
    (select count(*)::int from rwadar_novedades.dispositivos where usuario_id = $1) d`, [previa.id]);
  paso(`retención con todo apagado y sin activar nada: el reloj diario borra colas de 90 días y móviles de 180 (${fila?.limpiar} filas), no el móvil reciente`,
    fila?.limpiar === 3 && quedan.c === 0 && quedan.p === 0 && quedan.d === 1);
  const definicion = (await una(db, "select lower(pg_get_functiondef('rwadar_novedades.limpiar()'::regprocedure)) d")).d;
  paso('limpiar() no hace red: ni pg_net ni Vault en su definición y ninguna petición nueva en la cola de pg_net',
    !/net\.|http|vault/.test(definicion) && await numero(db, 'select count(*) from net.http_request_queue') === peticionesAntes);
  await db.query('delete from rwadar_novedades.dispositivos where token = $1', [TOKEN_RECIENTE]);
}

/* =====================================================================
   4 · Alta y confirmación con el rol de Auth
   ===================================================================== */
const comoAuth = async (fn) => {
  await sesion(db);
  await db.exec('set role supabase_auth_admin');
  try { return await fn(); } finally { await db.exec('reset role'); }
};
// Como GoTrue: un alta sin confirmar recibe su correo de confirmación ya
// (confirmation_sent_at); una cuenta que nace confirmada no recibe ninguno.
const altaAuth = (email, meta, confirmada = false) => comoAuth(async () => (await filas(db,
  `insert into auth.users(email, raw_user_meta_data, email_confirmed_at, confirmation_sent_at)
   values ($1, $2::jsonb, ${confirmada ? 'now(), null' : 'null, now()'}) returning id, email`,
  [email, meta === null ? null : JSON.stringify(meta ?? {})]))[0]);
const confirmarAuth = (u, avisos = []) => comoAuth(() => db.query(
  'update auth.users set email_confirmed_at = now() where id = $1', [u.id], { onNotice: (n) => avisos.push(n) }));
const META_SI = (canal = 'web', extra = {}) => ({ avisos_novedades: true, avisos_version: VERSION, avisos_canal: canal, nombre: 'x', ...extra });
// Historial del permiso de una cuenta, en orden (como propietario).
const historial = async (u) => { await sesion(db); return filas(db, `select accion, version, idioma, origen, canal, correo,
  creado_el, cuenta_borrada_el from rwadar_novedades.historial_permiso where usuario_id = $1 order by id`, [u.id]); };

{
  const [permisos] = await filas(db, `select has_schema_privilege('supabase_auth_admin','rwadar_novedades','USAGE') u,
    has_table_privilege('supabase_auth_admin','rwadar_novedades.preferencias','INSERT') i`);
  paso('supabase_auth_admin no tiene ningún privilegio sobre rwadar_novedades', !permisos.u && !permisos.i);
}
// Hueco del permiso: con la casilla sin activar (plantilla de Auth aún sin
// poner), unos metadatos válidos escritos a mano en el alta no apuntan a nadie.
const enviadoEl = async (u) => { await sesion(db); return (await una(db, 'select confirmation_sent_at f from auth.users where id = $1', [u.id])).f; };
{
  const sinCasilla = await altaAuth('sin-casilla@ejemplo.test', META_SI('web'));
  await confirmarAuth(sinCasilla);
  const p = await pref(sinCasilla);
  paso('con casilla_activa = false, confirmar con metadatos válidos crea preferencias pero NO da permiso',
    p?.novedades === false && p.origen === null && p.aceptado_el === null && p.version === null);
  // Altas hechas ANTES de activar la casilla: su correo de confirmación es el
  // antiguo, sin el párrafo de los avisos. Se confirman después.
  const antesDeActivar = await altaAuth('alta-antes@ejemplo.test', META_SI('web'));
  const reenviada = await altaAuth('reenviada@ejemplo.test', META_SI('app'));
  await sesion(db);
  await db.exec(ACTIVAR_CASILLA);
  const c = await config();
  const v = await verificar();
  paso(`30_avisos_registrados_activar_casilla.sql solo activa la casilla, con su fecha: ni correo, ni push, ni reloj de envío («${v.aviso || v.error}»)`,
    c.casilla_activa === true && c.casilla_activada_el instanceof Date && !c.correo_habilitado && !c.push_habilitado
    && !c.ofertas_automaticas && (await relojes()).length === 0 && await conLimpieza()
    && v.ok && /casilla del alta activa, correo apagado, push apagado/.test(v.aviso) && !v.avisoCasilla);
  await db.exec(ACTIVAR_CASILLA);
  paso('repetir activar_casilla con la casilla ya activa conserva casilla_activada_el',
    (await config()).casilla_activada_el.getTime() === c.casilla_activada_el.getTime());
  paso('activarla después no apunta a quien se confirmó antes (sus preferencias ya existen)',
    (await pref(sinCasilla)).novedades === false);
  const enviadoAntes = await enviadoEl(antesDeActivar);
  await confirmarAuth(antesDeActivar);
  const pa = await pref(antesDeActivar);
  paso('un alta hecha ANTES de activar la casilla y confirmada DESPUÉS no guarda el permiso (su correo de confirmación era el antiguo)',
    enviadoAntes instanceof Date && enviadoAntes < c.casilla_activada_el
    && pa?.novedades === false && pa.origen === null && pa.aceptado_el === null);
  // Si Auth le reenvía la confirmación ya con la plantilla nueva, sí cuenta.
  await comoAuth(() => db.query('update auth.users set confirmation_sent_at = now() where id = $1', [reenviada.id]));
  await confirmarAuth(reenviada);
  paso('si la confirmación se reenvía después de activar (correo nuevo, con el aviso), confirmarla sí guarda el permiso',
    (await enviadoEl(reenviada)) >= c.casilla_activada_el && (await pref(reenviada))?.novedades === true
    && (await pref(reenviada)).canal === 'app');
  // Sin fecha de envío: vacía, o Auth sin esa columna.
  const sinEnvio = await altaAuth('sin-envio@ejemplo.test', META_SI('web'));
  await comoAuth(() => db.query('update auth.users set confirmation_sent_at = null where id = $1', [sinEnvio.id]));
  const avisosSinEnvio = [];
  const e1 = await error(() => confirmarAuth(sinEnvio, avisosSinEnvio));
  await sesion(db);
  await db.exec('alter table auth.users rename column confirmation_sent_at to confirmation_enviada_otra');
  const sinColumna = await comoAuth(async () => (await filas(db, `insert into auth.users(email, raw_user_meta_data, email_confirmed_at)
    values ('sin-columna@ejemplo.test', $1::jsonb, null) returning id, email`, [JSON.stringify(META_SI('web'))]))[0]);
  const avisosSinColumna = [];
  const e2 = await error(() => confirmarAuth(sinColumna, avisosSinColumna));
  await sesion(db);
  await db.exec('alter table auth.users rename column confirmation_enviada_otra to confirmation_sent_at');
  paso('sin fecha de envío (vacía o sin la columna confirmation_sent_at en Auth), confirmar pasa sin avisos, crea preferencias y NO da permiso',
    !e1 && !e2 && avisosSinEnvio.length === 0 && avisosSinColumna.length === 0
    && (await pref(sinEnvio))?.novedades === false && (await pref(sinColumna))?.novedades === false);
}
const ana = await altaAuth('ana@ejemplo.test', META_SI('web'));
paso('el alta sin confirmar todavía no crea preferencias', !(await pref(ana)));
await confirmarAuth(ana);
{
  const p = await pref(ana);
  paso('con la casilla activa, un alta y su confirmación DESPUÉS de activarla (SET ROLE supabase_auth_admin) guardan el permiso (alta, web, versión y fecha)',
    (await enviadoEl(ana)) >= (await config()).casilla_activada_el
    && p?.novedades === true && p.origen === 'alta' && p.canal === 'web' && p.version === VERSION && p.aceptado_el instanceof Date
    && p.alta_el instanceof Date && /^[0-9a-f-]{36}$/.test(p.baja_token));
  const h = await historial(ana);
  paso('…y el permiso deja su fila en el historial: alta/alta, versión v2, canal web, el correo de ese momento y sin idioma si los metadatos no lo traen',
    h.length === 1 && h[0].accion === 'alta' && h[0].origen === 'alta' && h[0].version === VERSION && h[0].canal === 'web'
    && h[0].correo === ana.email && h[0].idioma === null && h[0].creado_el instanceof Date && h[0].cuenta_borrada_el === null);
}
{
  // Idioma del texto que vio: solo 'es' o 'en' como texto JSON; cualquier otra cosa, vacío.
  const idiomas = [['en', 'en'], ['es', 'es'], ['EN', null], ['fr', null], [true, null], [['en'], null]];
  const vistos = [];
  for (const [i, [valor]] of idiomas.entries()) {
    const u = await altaAuth(`idioma-${i}@ejemplo.test`, META_SI('app', { avisos_idioma: valor }));
    await confirmarAuth(u);
    const [fila] = await historial(u);
    vistos.push(fila?.idioma ?? null);
    if ((await pref(u))?.novedades !== true) vistos.push('sin permiso');
  }
  paso(`el idioma del historial sale de avisos_idioma solo si es 'es' o 'en' (${JSON.stringify(vistos)}); un idioma raro no anula el permiso`,
    isDeepStrictEqual(vistos, idiomas.map(([, esperado]) => esperado)));
}
{
  // Un alta con el texto v1 (sustituido) ya no cuenta.
  const conV1 = await altaAuth('con-v1@ejemplo.test', { avisos_novedades: true, avisos_version: VERSION_V1, avisos_canal: 'web' });
  await confirmarAuth(conV1);
  paso('unos metadatos con la versión v1 (sustituida) no dan permiso ni dejan fila en el historial',
    (await pref(conV1))?.novedades === false && (await historial(conV1)).length === 0);
}
const nace = await altaAuth('nace@ejemplo.test', META_SI('app'), true);
paso('una cuenta que nace confirmada (INSERT) recibe preferencias pero NO el permiso, ni fila en el historial',
  (await pref(nace))?.novedades === false && (await pref(nace)).origen === null && (await historial(nace)).length === 0);
{
  const grande = { relleno: 'x'.repeat(300000), anidado: Array.from({ length: 2000 }, (_, i) => ({ i, v: [i, `${i}`] })),
    avisos_novedades: 'true', avisos_version: VERSION };
  const raros = [
    ['texto "true"', { avisos_novedades: 'true', avisos_version: VERSION }],
    ['número 1', { avisos_novedades: 1, avisos_version: VERSION }],
    ['array [true]', { avisos_novedades: [true], avisos_version: VERSION }],
    ['objeto {valor:true}', { avisos_novedades: { valor: true }, avisos_version: VERSION }],
    ['false', { avisos_novedades: false, avisos_version: VERSION }],
    ['versión antigua', { avisos_novedades: true, avisos_version: 'novedades-v0' }],
    ['versión numérica', { avisos_novedades: true, avisos_version: 20261105 }],
    ['sin versión', { avisos_novedades: true }],
    ['metadatos enormes (300 KB)', grande],
    ['metadatos que son un array', [{ avisos_novedades: true, avisos_version: VERSION }]],
    ['metadatos que son un texto', 'avisos_novedades'],
    ['metadatos nulos', null],
  ];
  let todas = true, ningunPermiso = true;
  for (const [i, [, meta]] of raros.entries()) {
    const u = await altaAuth(`raro-${i}@ejemplo.test`, meta);
    const e = await error(() => confirmarAuth(u));
    const c = await una(db, 'select email_confirmed_at from auth.users where id = $1', [u.id]);
    todas &&= !e && c.email_confirmed_at instanceof Date;
    ningunPermiso &&= (await pref(u))?.novedades === false;
  }
  paso(`metadatos raros (${raros.map((r) => r[0]).join(', ')}): el alta y la confirmación pasan siempre`, todas);
  paso('y ninguno cuenta como permiso: solo el booleano JSON true con la versión vigente', ningunPermiso);
  await sesion(db);
  paso('una confirmación sin permiso no deja ninguna fila en el historial',
    await numero(db, "select count(*) from rwadar_novedades.historial_permiso h join auth.users u on u.id = h.usuario_id where u.email like 'raro-%'") === 0);
}
const canalRaro = await altaAuth('canal-raro@ejemplo.test', META_SI('sms'));
await confirmarAuth(canalRaro);
paso('un canal desconocido no anula un permiso válido, pero no se guarda', (await pref(canalRaro))?.novedades === true
  && (await pref(canalRaro)).canal === null);
const anonima = await altaAuth('anonima@ejemplo.test', META_SI());
await comoAuth(() => db.query('update auth.users set is_anonymous = true where id = $1', [anonima.id]));
await confirmarAuth(anonima);
paso('una cuenta anónima confirmada no recibe preferencias', !(await pref(anonima)));

// Averías forzadas: el disparador nunca impide la confirmación ni filtra el correo.
{
  const avisos1 = [];
  await db.exec('alter table rwadar_novedades.preferencias rename to preferencias_rota');
  const averia1 = await altaAuth('averia-1@ejemplo.test', META_SI());
  const e1 = await error(() => confirmarAuth(averia1, avisos1));
  const e1b = await error(() => altaAuth('averia-1b@ejemplo.test', META_SI(), true));
  await sesion(db);
  await db.exec('alter table rwadar_novedades.preferencias_rota rename to preferencias');
  paso('con la tabla de preferencias renombrada, la confirmación y el alta confirmada pasan igual', !e1 && !e1b
    && (await una(db, 'select email_confirmed_at from auth.users where id = $1', [averia1.id])).email_confirmed_at instanceof Date);
  paso('…y queda solo un warning con el sqlstate', avisos1.some((n) => n.severity === 'WARNING' && /sqlstate 42P01/.test(n.message)));

  const avisos2 = [];
  await db.exec(`create function public._rompe_preferencias() returns trigger language plpgsql as $$
    begin raise exception 'avería con %', (select email from auth.users where id = new.usuario_id); end $$;
    create trigger rompe before insert on rwadar_novedades.preferencias for each row execute function public._rompe_preferencias();`);
  const averia2 = await altaAuth('averia-2@ejemplo.test', META_SI());
  const e2 = await error(() => confirmarAuth(averia2, avisos2));
  await sesion(db);
  await db.exec('drop trigger rompe on rwadar_novedades.preferencias; drop function public._rompe_preferencias();');
  paso('con un disparador que lanza un error con el correo dentro, la confirmación pasa', !e2 && !(await pref(averia2)));
  paso('…y el warning lleva el sqlstate, nunca el mensaje ni el correo',
    avisos2.some((n) => /sqlstate P0001/.test(n.message)) && avisos2.every((n) => !n.message.includes('averia-2@')));

  // Sin el historial (tabla renombrada, o un error con el correo dentro), la
  // confirmación pasa igual, pero sin la prueba no se guarda el permiso.
  const avisos3 = [];
  await sesion(db);
  await db.exec('alter table rwadar_novedades.historial_permiso rename to historial_permiso_roto');
  const averia3 = await altaAuth('averia-3@ejemplo.test', META_SI());
  const e3 = await error(() => confirmarAuth(averia3, avisos3));
  await sesion(db);
  await db.exec(`alter table rwadar_novedades.historial_permiso_roto rename to historial_permiso;
    create function public._rompe_historial() returns trigger language plpgsql as $$
    begin raise exception 'avería con %', new.correo; end $$;
    create trigger rompe before insert on rwadar_novedades.historial_permiso for each row execute function public._rompe_historial();`);
  const avisos4 = [];
  const averia4 = await altaAuth('averia-4@ejemplo.test', META_SI());
  const e4 = await error(() => confirmarAuth(averia4, avisos4));
  await sesion(db);
  await db.exec('drop trigger rompe on rwadar_novedades.historial_permiso; drop function public._rompe_historial();');
  paso('con el historial averiado (renombrado, o un error con el correo dentro), la confirmación pasa, sin permiso ni preferencias, y el warning solo lleva el sqlstate',
    !e3 && !e4 && !(await pref(averia3)) && !(await pref(averia4))
    && (await una(db, 'select email_confirmed_at from auth.users where id = $1', [averia3.id])).email_confirmed_at instanceof Date
    && avisos3.some((n) => /sqlstate 42P01/.test(n.message)) && avisos4.some((n) => /sqlstate P0001/.test(n.message))
    && [...avisos3, ...avisos4].every((n) => !/averia-[34]@/.test(n.message)));

  const v = await verificar();
  paso('el verificador 30 detecta las cuentas confirmadas que se quedaron sin preferencias',
    !v.ok && /cuentas confirmadas sin preferencias/.test(v.error));
  await sesion(db);
  const rellenadas = await numero(db, 'select rwadar_novedades.rellenar()');
  paso(`el relleno las completa con novedades = false (${rellenadas}) y el verificador vuelve a pasar`,
    rellenadas === 5 && (await pref(averia1))?.novedades === false && (await pref(averia2))?.novedades === false
    && (await pref(averia4))?.novedades === false && (await historial(averia4)).length === 0
    && (await verificar()).ok);
}

// El permiso solo se lee en la confirmación; una baja no se deshace.
{
  const bajado = await altaAuth('bajado@ejemplo.test', META_SI());
  await confirmarAuth(bajado);
  const token = (await pref(bajado)).baja_token;
  await sesion(db, null, 'anon');
  const baja = (await una(db, 'select public.baja_avisos($1) b', [token])).b;
  await comoAuth(() => db.query('update auth.users set email_confirmed_at = null where id = $1', [bajado.id]));
  await confirmarAuth(bajado);
  await comoAuth(() => db.query(`update auth.users set raw_user_meta_data = $2::jsonb,
    email_confirmed_at = email_confirmed_at where id = $1`, [bajado.id, JSON.stringify(META_SI())]));
  const p = await pref(bajado);
  paso('tras darse de baja, reconfirmar el correo o reescribir los metadatos no vuelve a apuntar a nadie',
    baja === true && p.novedades === false && p.baja_el instanceof Date);
  const luisAntes = await altaAuth('luis@ejemplo.test', {});
  await confirmarAuth(luisAntes);
  await comoAuth(() => db.query('update auth.users set raw_user_meta_data = $2::jsonb where id = $1',
    [luisAntes.id, JSON.stringify(META_SI())]));
  await comoAuth(() => db.query('update auth.users set email_confirmed_at = now() where id = $1', [luisAntes.id]));
  paso('unos metadatos con permiso añadidos después de confirmar no apuntan a nadie', (await pref(luisAntes)).novedades === false);
}
const luis = (await una(db, "select id, email from auth.users where email = 'luis@ejemplo.test'"));

/* =====================================================================
   5 · API pública con sesiones (dobles de JWT y auth.sessions)
   ===================================================================== */
const sesiones = new Map();
const como = async (u, extras = {}) => {
  await sesion(db);
  if (!sesiones.has(u.id)) {
    const [s] = await filas(db, 'insert into auth.sessions(id, user_id) values (gen_random_uuid(), $1) returning id', [u.id]);
    sesiones.set(u.id, s.id);
  }
  const ahora = Number((await una(db, 'select floor(extract(epoch from now()))::bigint t')).t);
  const claims = { sub: u.id, role: 'authenticated', session_id: sesiones.get(u.id), exp: ahora + 3600,
    is_anonymous: false, amr: [{ method: 'password', timestamp: ahora }], ...extras };
  await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify(claims)]);
  await sesion(db, u.id, 'authenticated');
};
const rpc = async (sql, p = []) => (await una(db, sql, p));
const codigo = async (fn) => (await error(fn))?.code ?? null;
const eva = await altaAuth('eva@ejemplo.test', {});
await confirmarAuth(eva);
const token = (n) => `ExponentPushToken[${`prueba${n}`.padEnd(22, 'x')}]`;

{
  await sesion(db, null, 'anon');
  const anon = await Promise.all([
    codigo(() => db.query('select public.estado_mis_avisos()')),
    codigo(() => db.query("select public.configurar_avisos_novedades(true, $1, 'web')", [VERSION])),
    codigo(() => db.query("select public.registrar_aviso_push($1, 'android')", [token(1)])),
    codigo(() => db.query('select public.quitar_aviso_push($1)', [token(1)])),
    codigo(() => db.query('select public.mi_aviso_push_registrado($1)', [token(1)])),
    codigo(() => db.query('select * from public.mis_avisos_recientes(5)')),
  ]);
  paso('anon no puede ejecutar ninguna RPC de avisos salvo la baja', anon.length === 6 && anon.every((c) => c === '42501'));
  await como(ana, { session_id: '99999999-0000-4000-8000-000000000001' });
  const sinSesion = await Promise.all([
    codigo(() => db.query('select public.estado_mis_avisos()')),
    codigo(() => db.query("select public.configurar_avisos_novedades(false, null, null)")),
    codigo(() => db.query("select public.registrar_aviso_push($1, 'android')", [token(1)])),
    codigo(() => db.query('select public.quitar_aviso_push($1)', [token(1)])),
    codigo(() => db.query('select public.mi_aviso_push_registrado($1)', [token(1)])),
    codigo(() => db.query('select * from public.mis_avisos_recientes(5)')),
  ]);
  await como(ana, { exp: 1 });
  const caducado = await codigo(() => db.query('select public.estado_mis_avisos()'));
  const caducadoMovil = await codigo(() => db.query('select public.mi_aviso_push_registrado($1)', [token(1)]));
  paso('con un JWT de sesión revocada o caducada, las seis RPC con cuenta se niegan (42501)',
    sinSesion.length === 6 && sinSesion.every((c) => c === '42501') && caducado === '42501' && caducadoMovil === '42501');
  await como(ana);
  paso('authenticated no entra en el esquema privado ni en sus funciones',
    await codigo(() => db.query('select * from rwadar_novedades.preferencias')) === '42501'
    && await codigo(() => db.query("select rwadar_novedades.anunciar('novedad','novedad:x','Hola hola','Texto','https://rwadar.pages.dev/')")) === '42501'
    && await codigo(() => db.query('select rwadar_novedades.procesar()')) === '42501');
}
{
  await como(ana);
  const e = (await rpc('select public.estado_mis_avisos() e')).e;
  paso('estado_mis_avisos devuelve exactamente {novedades, version, aceptado_el, version_vigente, texto_es, texto_en, dispositivos, correo_activo, push_activo}',
    isDeepStrictEqual(Object.keys(e).sort(), ['aceptado_el', 'correo_activo', 'dispositivos', 'novedades', 'push_activo',
      'texto_en', 'texto_es', 'version', 'version_vigente'].sort())
    && e.novedades === true && e.version === VERSION && e.version_vigente === VERSION && e.texto_es === TEXTO_ES
    && e.texto_en === TEXTO_EN && e.dispositivos === 0 && e.correo_activo === false && e.push_activo === false);
  await sesion(db);
  await db.query('delete from rwadar_novedades.preferencias where usuario_id = $1', [eva.id]);
  await como(eva);
  const d = (await rpc('select public.estado_mis_avisos() e')).e;
  paso('sin fila de preferencias, estado_mis_avisos da los valores por defecto', d.novedades === false && d.version === null
    && d.aceptado_el === null && d.dispositivos === 0);
  const malos = await Promise.all([
    codigo(() => db.query("select public.configurar_avisos_novedades(true, 'novedades-v0', 'web')")),
    codigo(() => db.query("select public.configurar_avisos_novedades(true, $1, 'web')", [VERSION_V1])),
    codigo(() => db.query('select public.configurar_avisos_novedades(true, $1, null)', [VERSION])),
    codigo(() => db.query("select public.configurar_avisos_novedades(true, $1, 'sms')", [VERSION])),
    codigo(() => db.query("select public.configurar_avisos_novedades(null, $1, 'web')", [VERSION])),
    codigo(() => db.query("select public.configurar_avisos_novedades(true, $1, 'web', 'fr')", [VERSION])),
    codigo(() => db.query("select public.configurar_avisos_novedades(true, $1, 'web', 'ES')", [VERSION])),
  ]);
  paso('para activar hacen falta la versión vigente (la v1 ya no), un canal web/app y, si se da, un idioma es/en (22023/22004)',
    isDeepStrictEqual(malos, ['22023', '22023', '22023', '22023', '22004', '22023', '22023'])
    && (await historial(eva)).length === 0);
  await como(eva);
  const activado = (await rpc("select public.configurar_avisos_novedades(true, $1, 'app') e", [VERSION])).e;
  const p = await pref(eva);
  paso('activar en Perfil con tres argumentos (las llamadas de hoy) crea la fila y guarda permiso, versión, fecha, origen «perfil» y canal «app»',
    activado.novedades === true && p.novedades && p.origen === 'perfil' && p.canal === 'app' && p.aceptado_el instanceof Date);
  const h = await historial(eva);
  paso('…y deja en el historial alta/perfil, versión v2, canal app, el correo y sin idioma',
    h.length === 1 && h[0].accion === 'alta' && h[0].origen === 'perfil' && h[0].version === VERSION && h[0].canal === 'app'
    && h[0].idioma === null && h[0].correo === eva.email);
  await como(nace);
  await rpc("select public.configurar_avisos_novedades(true, $1, 'web') e", [VERSION]);
  const apagado = (await rpc('select public.configurar_avisos_novedades(false, null, null) e')).e;
  paso('desactivar quita el permiso y anota la baja', apagado.novedades === false && (await pref(nace)).baja_el instanceof Date);
  paso('en el historial de esa cuenta: alta/perfil y baja/perfil (con la versión retirada)',
    isDeepStrictEqual((await historial(nace)).map((f) => [f.accion, f.origen, f.version]),
      [['alta', 'perfil', VERSION], ['baja', 'perfil', VERSION]]));
}

/* ---------------------------------------------------------------------
   5b · Historial del permiso (solo de añadir) y baja por correo
   --------------------------------------------------------------------- */
{
  // alta (casilla del alta, en inglés) → baja (enlace) → alta (Perfil, en español): 3 filas.
  const hilo = await altaAuth('Historia.Permiso@Ejemplo.test', META_SI('web', { avisos_idioma: 'en' }));
  await confirmarAuth(hilo);
  const tokenHilo = (await pref(hilo)).baja_token;
  await sesion(db, null, 'anon');
  const bajaEnlace = (await rpc('select public.baja_avisos($1) b', [tokenHilo])).b;
  await como(hilo);
  const reactivado = (await rpc("select public.configurar_avisos_novedades(true, $1, 'app', 'es') e", [VERSION])).e;
  const tres = await historial(hilo);
  paso('alta → baja → alta deja 3 filas: alta/alta (web, en), baja/enlace (con la versión retirada) y alta/perfil (app, es), con el correo',
    bajaEnlace === true && reactivado.novedades === true
    && isDeepStrictEqual(tres.map((f) => [f.accion, f.origen, f.version, f.canal, f.idioma]),
      [['alta', 'alta', VERSION, 'web', 'en'], ['baja', 'enlace', VERSION, null, null], ['alta', 'perfil', VERSION, 'app', 'es']])
    && tres.every((f) => f.correo === hilo.email && f.cuenta_borrada_el === null)
    && tres[0].creado_el <= tres[1].creado_el && tres[1].creado_el <= tres[2].creado_el);
  // Solo un cambio de estado deja fila en Perfil.
  await como(hilo);
  const aceptado = (await pref(hilo)).aceptado_el.getTime();
  await como(hilo);
  await rpc("select public.configurar_avisos_novedades(true, $1, 'web', 'en') e", [VERSION]);
  const trasRepetir = await historial(hilo);
  const aceptadoTras = (await pref(hilo)).aceptado_el.getTime();
  await como(hilo);
  await rpc("select public.configurar_avisos_novedades(false, null, 'app', 'es') e");
  await rpc('select public.configurar_avisos_novedades(false, null, null) e');
  const trasBajas = await historial(hilo);
  paso('en Perfil, activar ya activado no cambia nada (ni fila nueva ni fecha del permiso); desactivar dos veces deja una sola baja/perfil',
    trasRepetir.length === 3 && aceptadoTras === aceptado
    && trasBajas.length === 4 && isDeepStrictEqual([trasBajas[3].accion, trasBajas[3].origen, trasBajas[3].version,
      trasBajas[3].canal, trasBajas[3].idioma], ['baja', 'perfil', VERSION, 'app', 'es']));

  // Baja por correo: solo el propietario; sin distinguir mayúsculas.
  await como(hilo);
  await rpc("select public.configurar_avisos_novedades(true, $1, 'web') e", [VERSION]);
  const cerradas = [];
  for (const rol of ['anon', 'authenticated', 'service_role']) {
    await sesion(db, null, rol);
    cerradas.push(await codigo(() => db.query("select rwadar_novedades.baja_por_correo('historia.permiso@ejemplo.test')")));
  }
  paso('anon, authenticated y service_role no pueden ejecutar baja_por_correo (42501)', cerradas.every((c) => c === '42501'));
  await sesion(db);
  const encontrada = (await una(db, "select rwadar_novedades.baja_por_correo('  HISTORIA.permiso@EJEMPLO.TEST ') b")).b;
  const ph = await pref(hilo);
  const todas = await historial(hilo);
  const hc = todas.at(-1);
  paso('baja_por_correo (propietario) encuentra la cuenta sin distinguir mayúsculas: novedades = false, baja_el y fila baja/correo con la versión retirada',
    encontrada === true && ph.novedades === false && ph.baja_el instanceof Date
    && hc.accion === 'baja' && hc.origen === 'correo' && hc.version === VERSION && hc.correo === hilo.email
    && todas.length === 6);
  await sesion(db);
  const ninguna = [];
  for (const c of ['nadie@ejemplo.test', '', '   ', null]) ninguna.push((await una(db, 'select rwadar_novedades.baja_por_correo($1) b', [c])).b);
  paso('baja_por_correo con un correo que no es de ninguna cuenta, vacío o nulo devuelve false y no deja nada',
    ninguna.every((b) => b === false)
    && await numero(db, "select count(*) from rwadar_novedades.historial_permiso where origen = 'correo'") === 1);
  // Una cuenta aún sin confirmar que pide la baja por correo: queda dada de
  // baja y confirmar después (con la casilla marcada) no la apunta.
  const sinConfirmar = await altaAuth('pide-baja@ejemplo.test', META_SI('web'));
  await sesion(db);
  const deSinConfirmar = (await una(db, "select rwadar_novedades.baja_por_correo('pide-baja@ejemplo.test') b")).b;
  await confirmarAuth(sinConfirmar);
  paso('una cuenta sin confirmar que pide la baja por correo queda dada de baja: confirmar después con la casilla marcada no la apunta',
    deSinConfirmar === true && (await pref(sinConfirmar))?.novedades === false && (await pref(sinConfirmar)).baja_el instanceof Date
    && isDeepStrictEqual((await historial(sinConfirmar)).map((f) => [f.accion, f.origen, f.version]), [['baja', 'correo', null]]));

  // Solo de añadir: ni cambiar una fila, ni borrarla (cuenta viva), ni quitar la marca.
  await sesion(db);
  const cambios = [];
  for (const [sql, params] of [
    ['update rwadar_novedades.historial_permiso set correo = $2 where usuario_id = $1', [hilo.id, 'otro@ejemplo.test']],
    ["update rwadar_novedades.historial_permiso set accion = 'alta', version = $2 where usuario_id = $1 and accion = 'baja'", [hilo.id, VERSION]],
    ['delete from rwadar_novedades.historial_permiso where usuario_id = $1', [hilo.id]],
    ["update rwadar_novedades.historial_permiso set cuenta_borrada_el = now() - interval '4 years', correo = null where usuario_id = $1", [hilo.id]],
  ]) cambios.push(await codigo(() => db.query(sql, params)));
  paso('el historial es solo de añadir: cambiar una fila, borrarla o marcarla y cambiarla a la vez lo impide la base (42501)',
    cambios.every((c) => c === '42501') && (await historial(hilo)).length === 6);
  await sesion(db);
  const insertar = (accion, origen, extra = {}) => codigo(() => db.query(`insert into rwadar_novedades.historial_permiso
    (usuario_id, accion, origen, version, idioma, canal) values ($1, $2, $3, $4, $5, $6)`,
  [hilo.id, accion, origen, extra.version ?? null, extra.idioma ?? null, extra.canal ?? null]));
  const malas = [await insertar('alta', 'perfil'), await insertar('cambio', 'perfil'), await insertar('baja', 'sms'),
    await insertar('baja', 'perfil', { idioma: 'fr' }), await insertar('baja', 'perfil', { canal: 'sms' })];
  paso('un alta sin versión, o una acción, origen, idioma o canal fuera de lista, lo impide la base (23514)',
    malas.every((c) => c === '23514') && (await historial(hilo)).length === 6);
}
{
  await como(luis);
  const malos = [];
  for (const t of ['ExponentPushToken[corto]', 'token', `${token(1)}x`, 'ExponentPushToken[abc def ghi jkl mno p]',
    `ExponentPushToken[${'a'.repeat(65)}]`, "ExponentPushToken[aaaaaaaaaaaaaaaa]'; drop table x;--", null]) {
    malos.push(await codigo(() => db.query("select public.registrar_aviso_push($1, 'android')", [t])));
  }
  malos.push(await codigo(() => db.query("select public.registrar_aviso_push($1, 'windows')", [token(1)])));
  paso('registrar_aviso_push rechaza tokens y plataformas fuera de formato (22023)', malos.every((c) => c === '22023'));
  // La función se queda con los 5 móviles actualizados más recientemente. PGlite mide el reloj al
  // milisegundo y dos registros seguidos pueden empatar (la CI falló así el 10/11/2026): cada móvil
  // recibe aquí una fecha distinta y creciente (de la última hora) justo después de registrarse,
  // para que la prueba compruebe la regla y no el reloj.
  for (let i = 1; i <= 7; i++) {
    await como(luis);
    await rpc("select public.registrar_aviso_push($1, 'android') r", [token(i)]);
    await sesion(db);
    await db.query(`update rwadar_novedades.dispositivos
      set creado_el = now() - interval '1 hour' + make_interval(mins => $2),
          actualizado_el = now() - interval '1 hour' + make_interval(mins => $2)
      where token = $1`, [token(i), i]);
  }
  await sesion(db);
  const deLuis = (await filas(db, 'select token from rwadar_novedades.dispositivos where usuario_id = $1', [luis.id]))
    .map((f) => f.token).sort();
  paso('como mucho 5 móviles por cuenta: los dos más antiguos dejan su sitio',
    isDeepStrictEqual(deLuis, [3, 4, 5, 6, 7].map(token).sort()));
  paso('con el push apagado, registrar un móvil no encola ninguna bienvenida',
    await numero(db, 'select count(*) from rwadar_novedades.pushes') === 0);
  // La app pregunta con su token si ESE móvil sigue registrado en su cuenta.
  const registrado = async (t) => (await rpc('select public.mi_aviso_push_registrado($1) r', [t])).r;
  await como(luis);
  const luisAntes = [await registrado(token(7)), await registrado(token(1)), await registrado(null), await registrado('token')];
  await como(ana);
  const anaAntes = await registrado(token(7));
  // Un token que pasa a otra cuenta: lo pendiente de la anterior se borra.
  await sesion(db);
  await db.query(`insert into rwadar_novedades.pushes(token, usuario_id, tipo) values ($1, $2, 'bienvenida')`, [token(7), luis.id]);
  await como(ana);
  await rpc("select public.registrar_aviso_push($1, 'ios') r", [token(7)]);
  await sesion(db);
  paso('el último que registra un token se lo queda y se borran los push pendientes de ese token',
    (await una(db, 'select usuario_id, plataforma from rwadar_novedades.dispositivos where token = $1', [token(7)])).usuario_id === ana.id
    && await numero(db, 'select count(*) from rwadar_novedades.pushes where token = $1', [token(7)]) === 0);
  await como(luis);
  const luisTras = await registrado(token(7));
  await como(ana);
  const anaTras = await registrado(token(7));
  paso('mi_aviso_push_registrado: true solo para un móvil propio; false para el desplazado por el límite, el de otra cuenta, null o basura',
    isDeepStrictEqual(luisAntes, [true, false, false, false]) && anaAntes === false && luisTras === false && anaTras === true);
  await como(luis);
  const ajeno = (await rpc('select public.quitar_aviso_push($1) r', [token(7)])).r;
  await como(ana);
  const propio = (await rpc('select public.quitar_aviso_push($1) r', [token(7)])).r;
  const anaQuitado = await registrado(token(7));
  await sesion(db);
  paso('quitar_aviso_push solo quita un token propio y después mi_aviso_push_registrado da false', ajeno === false && propio === true
    && anaQuitado === false
    && await numero(db, 'select count(*) from rwadar_novedades.dispositivos where token = $1', [token(7)]) === 0);
}
{
  await sesion(db);
  await db.exec(`insert into rwadar_novedades.anuncios (tipo, clave, estado, titulo, texto, enlace, creado_el, publicado_el) values
    ('novedad', 'novedad:viejo', 'publicado', 'Un aviso de hace 100 días', 'Ya no se lista.', 'https://rwadar.pages.dev/',
     now() - interval '100 days', now() - interval '100 days'),
    ('ofertas', 'ofertas:prueba-retenido', 'retenido', '2 fichas nuevas en el radar de RWAdar', '${AVISO_FIJO}',
     'https://rwadar.pages.dev/#emisiones', now(), null)`);
  await db.query(`select rwadar_novedades.anunciar('novedad', 'novedad:antes-de-activar', 'La app estrena avisos',
    'Ya puedes ver tus avisos en Inicio.', 'https://rwadar.pages.dev/')`);
  await como(eva);
  const limites = await Promise.all([0, 51, null, -1].map((l) => codigo(() => db.query('select * from public.mis_avisos_recientes($1)', [l]))));
  paso('mis_avisos_recientes exige p_limite entre 1 y 50', limites.every((c) => c === '22023'));
  const lista = (await filas(db, 'select * from public.mis_avisos_recientes()')).map((f) => f.mis_avisos_recientes);
  const uno = await filas(db, 'select * from public.mis_avisos_recientes(1)');
  paso('lista los anuncios publicados de los últimos 90 días y la bienvenida (id «bienvenida»), nunca los retenidos',
    lista.length === 2 && lista.some((a) => a.id === 'bienvenida' && a.tipo === 'bienvenida' && a.enlace === 'https://rwadar.pages.dev/academy/')
    && lista.some((a) => a.titulo === 'La app estrena avisos') && !lista.some((a) => a.tipo === 'ofertas' || /100 días/.test(a.titulo))
    && uno.length === 1);
  paso('cada aviso trae solo {id, tipo, titulo, texto, enlace, creado_el}, con id de texto',
    lista.every((a) => isDeepStrictEqual(Object.keys(a).sort(), ['creado_el', 'enlace', 'id', 'texto', 'tipo', 'titulo'])
      && typeof a.id === 'string'));
  await sesion(db, null, 'anon');
  const nula = (await rpc('select public.baja_avisos(null) b')).b;
  const falsa = (await rpc('select public.baja_avisos(gen_random_uuid()) b')).b;
  paso('baja_avisos (anon) con un token inexistente o nulo no cambia nada y devuelve false', nula === false && falsa === false);
}

/* =====================================================================
   6 · Anuncios a mano: anunciar, publicar_anuncio y anunciar.sql
   ===================================================================== */
{
  for (const rol of ['anon', 'authenticated', 'service_role']) {
    await sesion(db, null, rol);
    const c = await codigo(() => db.query("select rwadar_novedades.anunciar('novedad','novedad:x','Hola hola','Texto','https://rwadar.pages.dev/')"));
    const d = await codigo(() => db.query('select rwadar_novedades.publicar_anuncio(1)'));
    paso(`${rol} no puede anunciar ni publicar anuncios`, c === '42501' && d === '42501');
  }
  await sesion(db);
  const anunciar = (tipo, clave, titulo, texto, enlace = 'https://rwadar.pages.dev/') =>
    codigo(() => db.query('select rwadar_novedades.anunciar($1,$2,$3,$4,$5)', [tipo, clave, titulo, texto, enlace]));
  paso('anunciar no acepta el tipo «ofertas»: esas solo las crea el catálogo con su plantilla',
    await anunciar('ofertas', 'ofertas:a-mano', '3 fichas nuevas', 'Texto') === '22023');
  paso('anunciar no repite claves', await anunciar('novedad', 'novedad:antes-de-activar', 'Otro título', 'Otro texto') === '23505');
  const vetados = [['Una gran oportunidad', 'Texto'], ['Novedad', 'Mejor RENTABILIDAD'], ['Novedad', 'Retorno garantizado'],
    ['Novedad', 'Sube un 5 %'], ['Oportunidades nuevas', 'x y z'],
    // Ampliación de la revisión legal (06/11/2026), sin distinguir mayúsculas.
    ['Novedad', 'Buen RENDIMIENTO'], ['Novedad', 'Hasta 7 APY'], ['Novedad', 'Un apr fijo'], ['Novedad', 'Inversión sin  riesgo'],
    ['Acceso EXCLUSIVO', 'Texto'], ['Novedad', 'Últimas plazas'], ['Novedad', 'ULTIMAS PLAZAS'], ['No te lo pierdas', 'Texto'],
    ['Novedad', 'Gana dinero'], ['Novedad', 'Ganancias para todos'], ['Novedad', 'Un regalo'], ['Novedad', 'Bono de entrada'],
    ['Novedad', 'Descuentos'], ['Novedad', 'Plataforma autorizada'], ['NOVEDAD', 'AUTORIZADOS']];
  const codigosVetados = [];
  for (const [i, [t, x]] of vetados.entries()) codigosVetados.push(await anunciar('novedad', `novedad:vetada-${i}`, t, x));
  paso(`filtro de palabras (${vetados.length} vetados): sin «oportunidad», «rentabilidad», «garantiz…», %, «rendimiento», APY, APR, «sin riesgo», «exclusiv…», «últimas plazas», «no te lo pierdas», «gana…», «regalo», «bono», «descuento» ni «autorizad…» (23514)`,
    codigosVetados.every((c) => c === '23514'));
  // Límites de palabra: las raíces no atrapan palabras inocentes.
  const inocentes = [['Nueva lección: bonos tokenizados', 'Aprende cómo se organiza la Academy: su organización y los abonos.'],
    ['Aprende con la Academy', 'Las veganas y los paganos no son palabras vetadas; APRENDER tampoco.']];
  const codigosInocentes = [];
  for (const [i, [t, x]] of inocentes.entries()) codigosInocentes.push(await anunciar('novedad', `novedad:inocente-${i}`, t, x));
  paso('con límites de palabra: «bonos», «abonos», «aprende», «organización» y «veganas» pasan el filtro',
    codigosInocentes.every((c) => c === null));
  await db.exec("delete from rwadar_novedades.anuncios where clave like 'novedad:inocente-%'");
  const enlaces = ['http://rwadar.pages.dev/', 'https://rwadar.pages.dev.evil.example/', 'https://rwadar.pages.dev@evil.example/',
    'https://evil.example/', 'https://rwadar.pages.dev/a b', 'https://rwadar.pages.dev/"><b>', `https://rwadar.pages.dev/${'a'.repeat(190)}`,
    'javascript:alert(1)', 'https://RWADAR.pages.dev/'];
  const codigosEnlaces = [];
  for (const [i, e] of enlaces.entries()) codigosEnlaces.push(await anunciar('novedad', `novedad:enlace-${i}`, 'Novedad', 'Texto', e));
  paso(`enlaces solo de https://rwadar.pages.dev y de 200 caracteres como mucho (${enlaces.length} rechazados)`,
    codigosEnlaces.every((c) => c === '23514'));
  const formas = [['No', 'Texto'], ['x'.repeat(91), 'Texto'], ['Novedad', 'x'.repeat(401)], ['Con\nsalto', 'Texto'],
    ['Novedad', 'Con\tcontrol'], ['Novedad', 'ab']];
  const codigosFormas = [];
  for (const [i, [t, x]] of formas.entries()) codigosFormas.push(await anunciar('actualizacion', `actualizacion:forma-${i}`, t, x));
  paso('título 3-90 y texto 3-400 caracteres, sin caracteres de control', codigosFormas.every((c) => c === '23514'));
  const retenido = (await una(db, "select id from rwadar_novedades.anuncios where clave = 'ofertas:prueba-retenido'")).id;
  const p1 = (await una(db, 'select rwadar_novedades.publicar_anuncio($1) r', [retenido])).r;
  const p2 = (await una(db, 'select rwadar_novedades.publicar_anuncio($1) r', [retenido])).r;
  const p3 = await codigo(() => db.query('select rwadar_novedades.publicar_anuncio(999999)'));
  paso('publicar_anuncio pasa un retenido a publicado una vez; después false; si no existe, P0002',
    p1 === true && p2 === false && p3 === 'P0002'
    && (await una(db, 'select estado, publicado_el from rwadar_novedades.anuncios where id = $1', [retenido])).publicado_el instanceof Date);
}

// anunciar.sql con las variables de psql sustituidas como hace psql con :'variable'.
// Como psql: las metaórdenes (\set) no son SQL, y :'variable' se sustituye por
// un literal escapado salvo en comentarios y dentro de un bloque $etiqueta$.
const psqlAnunciar = (variables) => conVariablesPsql(ANUNCIAR, variables);
const correAnunciar = async (variables) => {
  await sesion(db);
  const avisos = [];
  const e = await error(() => db.exec(psqlAnunciar({ accion: 'anunciar', tipo: 'novedad', titulo: '', texto: '',
    enlace: 'https://rwadar.pages.dev/', id: '', ...variables }), { onNotice: (n) => avisos.push(n.message) }));
  if (e) await db.exec('rollback');
  return { e, avisos };
};
{
  const titulo = "Novedad: la app 'avisa'); drop table rwadar_novedades.anuncios; --";
  const r1 = await correAnunciar({ titulo, texto: 'Texto con $$ y :\'otra\' variable', enlace: 'https://rwadar.pages.dev/cambios' });
  const guardado = await una(db, 'select tipo, estado, titulo, texto from rwadar_novedades.anuncios where titulo = $1', [titulo]);
  paso('anunciar.sql (accion anunciar) crea el anuncio publicado y guarda las entradas como literales',
    !r1.e && guardado?.estado === 'publicado' && guardado.texto === "Texto con $$ y :'otra' variable"
    && r1.avisos.some((a) => /publicado/.test(a)));
  const r2 = await correAnunciar({ titulo, texto: 'Texto con $$ y :\'otra\' variable', enlace: 'https://rwadar.pages.dev/cambios' });
  paso('lanzar el flujo dos veces con el mismo aviso el mismo día no lo repite', r2.e?.code === '23505'
    && await numero(db, 'select count(*) from rwadar_novedades.anuncios where titulo = $1', [titulo]) === 1);
  const r3 = await correAnunciar({ accion: 'borrar' });
  const r4 = await correAnunciar({ accion: 'publicar-retenido', id: '1; delete from x' });
  const r5 = await correAnunciar({ titulo: 'Una oportunidad', texto: 'Texto' });
  paso('anunciar.sql rechaza una acción desconocida, un id no numérico o un texto vetado y no deja nada',
    r3.e?.code === '22023' && r4.e?.code === '22023' && r5.e?.code === '23514'
    && await numero(db, "select count(*) from rwadar_novedades.anuncios where titulo = 'Una oportunidad'") === 0);
}

/* =====================================================================
   7 · Catálogo: los lotes reales, uno inventado y el anuncio del día
   ===================================================================== */
const anunciosOfertas = async () => { await sesion(db); return filas(db, "select * from rwadar_novedades.anuncios where tipo = 'ofertas' and clave like 'ofertas:2%' order by id"); };
const colas = async () => numero(db, 'select (select count(*) from rwadar_novedades.correos) + (select count(*) from rwadar_novedades.pushes)');
{
  for (const etiqueta of ['2026-11-05', '2026-11-05.2']) {
    await sesion(db);
    await db.exec(loteReal(etiqueta));
    paso(`el lote real ${etiqueta}, sin ofertas nuevas, no crea ningún anuncio`, (await anunciosOfertas()).length === 0);
  }
  const fotoCon30 = await fotoCatalogo(db);
  paso('con la 30 instalada, el aplicador real deja exactamente lo mismo que sin ella (puntero, revisiones, vistas y web de Pax Gold)',
    isDeepStrictEqual(fotoCon30, fotoSin30) && JSON.parse(fotoCon30.publicacion)[0].revision_id === '88d5a757-3481-f70e-dc7c-6272704a00b3');
}
const fuentesBase = cargarFuentesLocales('..', { revision: '2026-11-05.2', versionEsquema: 2 });
const loteInventado = (slugs) => {
  const fuentes = structuredClone(fuentesBase);
  const modelo = fuentes.escaparate.ofertas.find((o) => o.coleccion === 'principales');
  for (const slug of slugs) {
    fuentes.escaparate.ofertas.push({ ...structuredClone(modelo), slug });
    fuentes.manifiesto.ofertasEsperadas += 1;
    fuentes.manifiesto.coleccionesEsperadas.principales += 1;
  }
  return construirSqlImportacion(fuentes);
};
const aprobar = async (lote, avisos = []) => {
  await sesion(db);
  await db.exec(lote.sql);
  await db.query(`update rwadar_catalogo.revisiones set estado = 'aprobada', aprobada_el = now(),
    aprobada_referencia = 'Lote inventado solo para la prueba local de avisos' where id = $1`, [lote.revisionId],
  { onNotice: (n) => avisos.push(n) });
  return (await una(db, 'select revision_id from rwadar_catalogo.publicacion_v2')).revision_id;
};
const HOY = (await una(db, "select to_char(current_date, 'YYYY-MM-DD') d")).d;
{
  // Una aprobación con fecha antigua no pasa a ser la publicada: no se anuncia.
  const vieja = loteInventado(['oferta-inventada-vieja']);
  await sesion(db);
  await db.exec(vieja.sql);
  await db.query(`update rwadar_catalogo.revisiones set estado = 'aprobada', aprobada_el = now() - interval '1 day',
    aprobada_referencia = 'Lote inventado con aprobación antigua, solo local' where id = $1`, [vieja.revisionId]);
  paso('una aprobación que no pasa a ser la revisión publicada no crea anuncio',
    (await una(db, 'select revision_id from rwadar_catalogo.publicacion_v2')).revision_id === '88d5a757-3481-f70e-dc7c-6272704a00b3'
    && (await anunciosOfertas()).length === 0);
}
{
  const puntero = await aprobar(loteInventado(['oferta-inventada-uno']));
  const [anuncio] = await anunciosOfertas();
  paso('un lote inventado con una oferta nueva crea 1 anuncio de ofertas, retenido, con la clave del día',
    (await anunciosOfertas()).length === 1 && anuncio.estado === 'retenido' && anuncio.clave === `ofertas:${HOY}`
    && anuncio.publicado_el === null && puntero === anuncio.revision_id);
  paso('plantilla cerrada: «1 ficha nueva en el radar de RWAdar», enlace a #emisiones y el aviso fijo nuevo, con el riesgo delante, sin nombres de productos',
    anuncio.titulo === '1 ficha nueva en el radar de RWAdar' && anuncio.enlace === 'https://rwadar.pages.dev/#emisiones'
    && anuncio.texto === AVISO_FIJO && anuncio.texto.startsWith('Información, no recomendación: aparecer en el radar no es un respaldo y puedes perder lo invertido.')
    && !/inventada|Spiko|Brickwise/i.test(anuncio.titulo + anuncio.texto));
  paso('el disparador vio el puntero viejo y no repartió nada: colas vacías', await colas() === 0);
  await como(ana);
  const lista = (await filas(db, 'select * from public.mis_avisos_recientes(50)')).map((f) => f.mis_avisos_recientes);
  paso('un anuncio retenido no se ve en la app', !lista.some((a) => a.id === String(anuncio.id)));
  await aprobar(loteInventado(['oferta-inventada-uno', 'oferta-inventada-dos', 'oferta-inventada-tres']));
  paso('como mucho un anuncio de ofertas al día: otra entrega con altas el mismo día no crea otro',
    (await anunciosOfertas()).length === 1 && (await anunciosOfertas())[0].titulo === '1 ficha nueva en el radar de RWAdar');
  const avisos = [];
  await sesion(db);
  await db.exec(`update rwadar_novedades.anuncios set clave = 'ofertas:1999-01-01' where clave = 'ofertas:${HOY}';
    create function public._rompe_anuncios() returns trigger language plpgsql as $$ begin raise exception 'roto'; end $$;
    create trigger rompe before insert on rwadar_novedades.anuncios for each row execute function public._rompe_anuncios();`);
  const lote = loteInventado(['oferta-inventada-cuatro']);
  const e = await error(() => aprobar(lote, avisos));
  await sesion(db);
  await db.exec('drop trigger rompe on rwadar_novedades.anuncios; drop function public._rompe_anuncios();');
  paso('con la tabla de anuncios averiada, la aprobación del catálogo pasa igual y publica la revisión',
    !e && (await una(db, 'select revision_id from rwadar_catalogo.publicacion_v2')).revision_id === lote.revisionId
    && (await anunciosOfertas()).length === 0 && avisos.some((n) => /anuncio de ofertas no creado \(sqlstate P0001\)/.test(n.message)));
  await db.exec("update rwadar_novedades.anuncios set clave = 'ofertas:prueba-uno' where clave = 'ofertas:1999-01-01'");
}

/* =====================================================================
   8 · Activación
   ===================================================================== */
// Dobles de vault.secrets, vault.create_secret y vault.update_secret (las
// firmas de Supabase Vault) sobre el doble de vault.decrypted_secrets.
const VAULT_GUARDAR_DOBLES = `
  alter table vault.decrypted_secrets add column id uuid not null default gen_random_uuid(), add column description text;
  create view vault.secrets as select id, name, description, decrypted_secret as secret from vault.decrypted_secrets;
  create function vault.create_secret(new_secret text, new_name text default null, new_description text default '',
      new_key_id uuid default null) returns uuid language sql as $$
    insert into vault.decrypted_secrets(name, decrypted_secret, description) values (new_name, new_secret, new_description) returning id $$;
  create function vault.update_secret(secret_id uuid, new_secret text default null, new_name text default null,
      new_description text default null, new_key_id uuid default null) returns void language sql as $$
    update vault.decrypted_secrets set decrypted_secret = coalesce(new_secret, decrypted_secret), name = coalesce(new_name, name),
      description = coalesce(new_description, description) where id = secret_id $$;`;
const VAULT_LETTERMINT = `insert into vault.decrypted_secrets(name, decrypted_secret) values ('LETTERMINT_API_TOKEN', '${TOKEN_LM}'),
  ('RWADAR_REMITENTE', 'avisos@rwadar.example') on conflict (name) do update set decrypted_secret = excluded.decrypted_secret`;
const secretos = async () => { await sesion(db); return filas(db, `select name, decrypted_secret v from vault.decrypted_secrets
  where name in ('LETTERMINT_API_TOKEN', 'RWADAR_REMITENTE', 'BREVO_API_KEY') order by name`); };
{
  await sesion(db);
  await db.exec(VAULT_GUARDAR_DOBLES);
  const activar = async () => { await sesion(db); const e = await error(() => db.exec(ACTIVAR_CORREO)); if (e) await db.exec('rollback'); return e; };
  // Como hoy en producción: la 31 puesta y la 34 sin aplicar (el pie lleva el
  // nombre del titular). Encender el correo se niega antes de mirar Vault.
  const eSin34 = await activar();
  paso(`con la 31 y sin la 34 (el pie con el nombre del titular), activar el correo se niega y no deja nada encendido ni reloj («${eSin34?.message}»)`,
    eSin34?.code === '55000' && /falta aplicar 34_pie_sin_nombre\.sql/.test(eSin34.message)
    && !(await config()).correo_habilitado && (await relojes()).length === 0);
  await sesion(db);
  await db.exec(SQL34);
  const e = await activar();
  const c = await config();
  paso(`sin LETTERMINT_API_TOKEN ni RWADAR_REMITENTE en Vault, activar el correo falla y no deja nada encendido ni reloj («${e?.message}»)`,
    e?.code === '55000' && /falta LETTERMINT_API_TOKEN en Vault/.test(e.message) && !c.correo_habilitado && (await relojes()).length === 0);
  await db.exec(`insert into vault.decrypted_secrets(name, decrypted_secret) values
    ('BREVO_API_KEY', 'xkeysib-clave-local-larga-no-real-123456789'), ('RWADAR_REMITENTE', 'avisos@rwadar.example')`);
  const eBrevo = await activar();
  paso('con solo la credencial antigua de Brevo (BREVO_API_KEY) tampoco se enciende: pide LETTERMINT_API_TOKEN',
    eBrevo?.code === '55000' && /LETTERMINT_API_TOKEN/.test(eBrevo.message) && !(await config()).correo_habilitado);
  await db.exec("delete from vault.decrypted_secrets where name in ('BREVO_API_KEY', 'RWADAR_REMITENTE')");

  // guardar-correo: el paso del flujo (bash y doble de psql) y su SQL en PGlite.
  const guardar = async (variables) => {
    await sesion(db);
    const avisos = [];
    const e = await error(() => db.exec(conVariablesPsql(GUARDAR31, variables), { onNotice: (n) => avisos.push(n.message) }));
    if (e) await db.exec('rollback');
    return { e, avisos };
  };
  const PASO_GUARDAR = 'Guardar en Vault el token de Lettermint y el remitente';
  const entornoGuardar = (extra) => ({ SQL: 'rwadar-app/db/31_correo_lettermint_guardar.sql', SUPABASE_DB_URL: 'postgresql://doble-local/sin-red',
    LETTERMINT_API_TOKEN: `${TOKEN_LM}-anterior`, REMITENTE: 'avisos-viejo@rwadar.example', ...extra });
  let primera = { variables: { token: `${TOKEN_LM}-anterior`, remitente: 'avisos-viejo@rwadar.example' } };
  if (hayBash) {
    const paso1 = correPaso(PASO_GUARDAR, entornoGuardar({}));
    const sinToken = correPaso(PASO_GUARDAR, entornoGuardar({ LETTERMINT_API_TOKEN: '' }));
    const conEspacio = correPaso(PASO_GUARDAR, entornoGuardar({ LETTERMINT_API_TOKEN: 'lm token con espacios y largo de sobra' }));
    const corto = correPaso(PASO_GUARDAR, entornoGuardar({ LETTERMINT_API_TOKEN: 'lm-corto' }));
    const [llamada] = paso1.llamadas;
    primera = { variables: variablesPsql(llamada?.argv || []) };
    paso('el paso «Guardar» del flujo llama a psql una vez con -v token y -v remitente leídos del entorno y el SQL de guardar, sin imprimir el token',
      paso1.estado === 0 && paso1.llamadas.length === 1
      && isDeepStrictEqual(llamada.argv, ['postgresql://doble-local/sin-red', '-X', '-v', 'ON_ERROR_STOP=1',
        '-v', `token=${TOKEN_LM}-anterior`, '-v', 'remitente=avisos-viejo@rwadar.example', '-f', 'rwadar-app/db/31_correo_lettermint_guardar.sql'])
      && !paso1.texto.includes(TOKEN_LM));
    paso('sin el secreto de GitHub, con espacios o demasiado corto, el paso se para antes de psql y sin imprimirlo',
      [sinToken, conEspacio, corto].every((r) => r.estado !== 0 && r.llamadas.length === 0)
      && !conEspacio.texto.includes('lm token con espacios') && !corto.texto.includes('lm-corto')
      && /Falta el secreto de GitHub LETTERMINT_API_TOKEN/.test(sinToken.texto));
  }
  const g1 = await guardar(primera.variables);
  const tras1 = await secretos();
  const g2 = await guardar({ token: TOKEN_LM, remitente: 'avisos@rwadar.example' });
  const tras2 = await secretos();
  paso('31_correo_lettermint_guardar.sql crea LETTERMINT_API_TOKEN y RWADAR_REMITENTE con vault.create_secret y, repetido, los cambia con vault.update_secret (uno de cada, sin imprimir el token)',
    !g1.e && !g2.e && isDeepStrictEqual(tras1, [{ name: 'LETTERMINT_API_TOKEN', v: `${TOKEN_LM}-anterior` }, { name: 'RWADAR_REMITENTE', v: 'avisos-viejo@rwadar.example' }])
    && isDeepStrictEqual(tras2, [{ name: 'LETTERMINT_API_TOKEN', v: TOKEN_LM }, { name: 'RWADAR_REMITENTE', v: 'avisos@rwadar.example' }])
    && g2.avisos.some((a) => /guardados en Vault con forma válida/.test(a))
    && [...g1.avisos, ...g2.avisos].every((a) => !a.includes(TOKEN_LM))
    && !(await config()).correo_habilitado);
  const malos = [{ token: 'corto', remitente: 'avisos@rwadar.example' }, { token: `${TOKEN_LM} con espacio`, remitente: 'avisos@rwadar.example' },
    { token: '', remitente: 'avisos@rwadar.example' }, { token: `${TOKEN_LM}-nuevo`, remitente: 'RWAdar <avisos@rwadar.example>' },
    { token: `${TOKEN_LM}-nuevo`, remitente: 'sin-arroba' }, { token: `${TOKEN_LM}-nuevo`, remitente: '' }];
  const resultados = [];
  for (const m of malos) resultados.push(await guardar(m));
  paso(`y con un token o un remitente sin forma válida (${malos.length} casos) se niega (22023) sin cambiar nada y sin repetir el valor en el error`,
    resultados.every((r) => r.e?.code === '22023' && !r.e.message.includes(TOKEN_LM) && !r.e.message.includes('corto'))
    && isDeepStrictEqual(await secretos(), tras2));

  await db.exec(`update vault.decrypted_secrets set decrypted_secret = 'lm token con espacios y de largo suficiente' where name = 'LETTERMINT_API_TOKEN'`);
  const eForma = await activar();
  await db.exec(VAULT_LETTERMINT);
  paso('un LETTERMINT_API_TOKEN con espacios en Vault tampoco enciende el correo (solo se mira su forma)',
    eForma?.code === '55000' && /no tiene forma de token/.test(eForma.message) && !eForma.message.includes('espacios y de largo')
    && !(await config()).correo_habilitado);
  await db.exec(ACTIVAR_CORREO);
  const c2 = await config();
  const v = await verificar();
  const v31 = await verificar31();
  paso('activar el correo lo enciende con fecha y crea un solo reloj rwadar-novedades cada 5 minutos',
    c2.correo_habilitado && c2.correo_activado_el instanceof Date && !c2.push_habilitado
    && isDeepStrictEqual((await relojes()).map((r) => [r.jobname, r.schedule, r.command]),
      [['rwadar-novedades', '*/5 * * * *', ' select rwadar_novedades.procesar() ']]));
  paso(`los verificadores 30 y 31 pasan con el correo encendido («${v.aviso || v.error}» · «${v31.aviso || v31.error}»)`,
    v.ok && /correo encendido, push apagado/.test(v.aviso) && v31.ok && /correo encendido$/.test(v31.aviso));
  // Con el correo encendido: sin la credencial de Lettermint, o con un envío
  // que no llama a ningún proveedor conocido, los verificadores se paran.
  await db.exec("update vault.decrypted_secrets set name = 'LETTERMINT_API_TOKEN_OTRO' where name = 'LETTERMINT_API_TOKEN'");
  const vSin = await verificar();
  const v31Sin = await verificar31();
  await db.exec("update vault.decrypted_secrets set name = 'LETTERMINT_API_TOKEN' where name = 'LETTERMINT_API_TOKEN_OTRO'");
  const envio31 = SQL31.match(/create or replace function rwadar_novedades\.enviar_correos\([\s\S]*?\n\$funcion\$;/)[0];
  await db.exec(envio31.replace("url := 'https://api.lettermint.co/v1/send'", "url := 'https://correo.otro.example/send'"));
  const vOtro = await verificar();
  await sesion(db);
  await db.exec(envio31);
  paso('con el correo encendido, el verificador 30 (neutral respecto al proveedor) pide la credencial de Lettermint y se para si el envío no llama a un proveedor conocido; el 31 también pide el token',
    !vSin.ok && /sin LETTERMINT_API_TOKEN y RWADAR_REMITENTE/.test(vSin.error) && !v31Sin.ok && /LETTERMINT_API_TOKEN/.test(v31Sin.error)
    && !vOtro.ok && /proveedor conocido/.test(vOtro.error) && (await verificar()).ok && (await verificar31()).ok);
  await db.exec("insert into vault.decrypted_secrets(name, decrypted_secret) values ('EXPO_ACCESS_TOKEN', 'no válido!')");
  const ep = await error(() => db.exec(ACTIVAR_PUSH));
  await db.exec('rollback');
  await db.exec("delete from vault.decrypted_secrets where name = 'EXPO_ACCESS_TOKEN'");
  paso('un EXPO_ACCESS_TOKEN con formato no válido impide activar el push', ep?.code === '55000' && !(await config()).push_habilitado);
  await db.exec(ACTIVAR_PUSH);
  const fechaCorreo = (await config()).correo_activado_el.getTime();
  await db.exec(ACTIVAR_CORREO);
  const c3 = await config();
  paso('activar el push y repetir la activación del correo dejan un solo reloj de envío y conservan la fecha de activación',
    c3.push_habilitado && c3.push_activado_el instanceof Date && c3.correo_activado_el.getTime() === fechaCorreo
    && (await relojes()).length === 1);
  paso('las activaciones no tocan el reloj diario de limpieza: sigue uno y tal cual', await conLimpieza());
  const v2 = await verificar();
  paso('el verificador 30 pasa con correo y push encendidos', v2.ok && /correo encendido, push encendido/.test(v2.aviso));
}

/* =====================================================================
   9 · procesar(): reparto, peticiones a Lettermint y Expo, respuestas y recibos
   ===================================================================== */
const LETTERMINT = 'https://api.lettermint.co/v1/send';
const EXPO = 'https://exp.host/--/api/v2/push/send';
const RECIBOS = 'https://exp.host/--/api/v2/push/getReceipts';
const ultimaPeticion = async () => { await sesion(db); return numero(db, 'select coalesce(max(id), 0)::int from net.http_request_queue'); };
const peticiones = async (desde, url) => { await sesion(db); return filas(db, 'select id, url, headers, body from net._peticiones where id > $1 and url = $2 order by id', [desde, url]); };
const responder = (id, estado, contenido, errorMsg = null) => db.query(
  'insert into net._http_response(id, status_code, content, error_msg) values ($1, $2, $3, $4)',
  [id, estado, contenido == null ? null : (typeof contenido === 'string' ? contenido : JSON.stringify(contenido)), errorMsg]);
const procesar = async () => {
  await sesion(db);
  const avisos = [];
  const r = (await db.query('select rwadar_novedades.procesar() r', [], { onNotice: (n) => avisos.push(n.message) })).rows[0].r;
  return { r, avisos };
};
const paraCorreo = (lista, u) => lista.filter((p) => p.body.to?.[0] === u.email);
const correoDe = async (u, tipo) => { await sesion(db); return una(db, 'select * from rwadar_novedades.correos where usuario_id = $1 and tipo = $2 order by id desc limit 1', [u.id, tipo]); };

const TOKEN_ANA = token(20), TOKEN_ANA_2 = token(21);
// Credencial inventada para el doble de Vault (no es de Expo ni de nadie).
const EXPO_FICTICIO = ['ficticio', 'solo', 'para', 'esta', 'prueba', 'local'].join('-');
let n1;
{
  // Móviles y altas con todo encendido.
  await como(ana);
  await rpc("select public.registrar_aviso_push($1, 'android') r", [TOKEN_ANA]);
  await rpc("select public.registrar_aviso_push($1, 'android') r", [TOKEN_ANA_2]);
  await como(luis);
  await rpc("select public.registrar_aviso_push($1, 'android') r", [token(6)]);
  await rpc("select public.registrar_aviso_push($1, 'android') r", [token(5)]);
  await sesion(db);
  paso('con el push encendido, el primer móvil registrado encola una bienvenida por push, una sola vez por cuenta',
    await numero(db, "select count(*) from rwadar_novedades.pushes where tipo = 'bienvenida' and usuario_id = $1", [ana.id]) === 1
    && await numero(db, "select count(*) from rwadar_novedades.pushes where tipo = 'bienvenida' and usuario_id = $1", [luis.id]) === 1);
  const nueva = await altaAuth('nueva@ejemplo.test', META_SI('app'));
  await confirmarAuth(nueva);
  const nueva2 = await altaAuth('nueva-2@ejemplo.test', {});
  await confirmarAuth(nueva2);
  await confirmarAuth(nueva2);
  paso('con el correo encendido, confirmar encola una sola bienvenida por correo',
    await numero(db, "select count(*) from rwadar_novedades.correos where tipo = 'bienvenida' and usuario_id = any($1::uuid[])",
      [[nueva.id, nueva2.id]]) === 2);

  // Un anuncio publicado después de activar.
  await sesion(db);
  n1 = (await una(db, `select rwadar_novedades.anunciar('novedad', 'novedad:prueba-n1', 'Avisos & <mejoras> en la app',
    'Ya puedes elegir "qué" avisos recibir en Perfil.', 'https://rwadar.pages.dev/academy/') id`)).id;
  const antes = await ultimaPeticion();
  const { r } = await procesar();
  const suscritas = (await filas(db, `select p.usuario_id from rwadar_novedades.preferencias p join auth.users u on u.id = p.usuario_id
    where p.novedades and p.version = $1 and u.email_confirmed_at is not null and u.is_anonymous is not true`, [VERSION])).map((f) => f.usuario_id).sort();
  const destinatarios = (await filas(db, 'select usuario_id from rwadar_novedades.correos where anuncio_id = $1', [n1])).map((f) => f.usuario_id).sort();
  paso(`procesar() reparte el anuncio nuevo a las ${suscritas.length} cuentas confirmadas con permiso vigente (ana, eva, nueva…), no a luis`,
    isDeepStrictEqual(destinatarios, suscritas) && suscritas.includes(ana.id) && suscritas.includes(eva.id)
    && suscritas.includes(nueva.id) && !suscritas.includes(luis.id) && r.estado === 'encendido');
  paso('solo reparte anuncios publicados después de la activación (ni el de antes, ni el retenido que se publicó antes de activar)',
    await numero(db, `select count(*) from rwadar_novedades.correos c join rwadar_novedades.anuncios a on a.id = c.anuncio_id
      where coalesce(a.publicado_el, a.creado_el) < (select correo_activado_el from rwadar_novedades.configuracion)`) === 0
    && await numero(db, 'select count(*) from rwadar_novedades.pushes where anuncio_id is not null and anuncio_id <> $1', [n1]) === 0);
  paso('el push del anuncio va a los móviles de las cuentas con permiso (los 2 de ana), no a los de luis',
    isDeepStrictEqual((await filas(db, 'select token from rwadar_novedades.pushes where anuncio_id = $1 order by token', [n1])).map((f) => f.token),
      [TOKEN_ANA, TOKEN_ANA_2].sort()));

  const correos = await peticiones(antes, LETTERMINT);
  const [aAna] = paraCorreo(correos, ana);
  const html = aAna?.body.html || '';
  paso('Lettermint: una petición por correo a https://api.lettermint.co/v1/send con el token de Vault en x-lettermint-token, from «RWAdar <remitente>», to y reply_to (rwadares@gmail.com) en listas',
    correos.length === suscritas.length + 2 && aAna?.headers['x-lettermint-token'] === TOKEN_LM
    && aAna.headers['content-type'] === 'application/json' && !('api-key' in aAna.headers)
    && correos.every((c) => c.body.from === 'RWAdar <avisos@rwadar.example>' && isDeepStrictEqual(c.body.reply_to, ['rwadares@gmail.com'])
      && Array.isArray(c.body.to) && c.body.to.length === 1 && c.headers['x-lettermint-token'] === TOKEN_LM)
    && isDeepStrictEqual(aAna.body.to, [ana.email]));
  paso('todas piden no seguir aperturas ni clics (settings: track_opens y track_clicks false) y no llevan tag, metadata ni campos de Brevo',
    correos.every((c) => isDeepStrictEqual(c.body.settings, { track_opens: false, track_clicks: false })
      && !['tag', 'metadata', 'sender', 'replyTo', 'htmlContent', 'textContent'].some((k) => k in c.body)));
  paso('la clave idempotente de cada fila va en la cabecera HTTP Idempotency-Key (un uuid por correo, el de su fila) y ya no dentro del correo',
    correos.every((c) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(c.headers['Idempotency-Key'])
      && !('Idempotency-Key' in (c.body.headers || {})))
    && new Set(correos.map((c) => c.headers['Idempotency-Key'])).size === correos.length
    && (await una(db, 'select idempotencia::text k from rwadar_novedades.correos where peticion_id = $1', [aAna.id])).k === aAna.headers['Idempotency-Key']);
  const bienvenidas = correos.filter((c) => c.body.subject === 'Te damos la bienvenida a RWAdar');
  paso('ruta: los anuncios van por «broadcast»; las bienvenidas, sin route (la transaccional del proyecto)',
    bienvenidas.length === 2 && bienvenidas.every((c) => !('route' in c.body))
    && correos.filter((c) => !bienvenidas.includes(c)).every((c) => c.body.route === 'broadcast'));
  const bajaAna = `https://rwadar.pages.dev/baja?t=${(await pref(ana)).baja_token}`;
  paso('List-Unsubscribe con la baja por enlace y por mailto (sin List-Unsubscribe-Post)',
    aAna.body.headers['List-Unsubscribe'] === `<${bajaAna}>, <${MAILTO_BAJA}>`
    && isDeepStrictEqual(Object.keys(aAna.body.headers), ['List-Unsubscribe'])
    && !JSON.stringify(correos).includes('List-Unsubscribe-Post'));
  paso('el título y el texto van escapados en el HTML; el asunto, tal cual',
    html.includes('Avisos &amp; &lt;mejoras&gt; en la app') && html.includes('elegir &quot;qué&quot; avisos')
    && !html.includes('<mejoras>') && aAna.body.subject === 'Avisos & <mejoras> en la app');
  paso('pie de todos los correos (con la 34): quién envía, «el titular de RWAdar» sin su nombre y la dirección postal (Plaza Generalitat, s/n, 46600 Alzira), aviso legal y privacidad, en HTML y en texto',
    correos.every((c) => c.body.html.includes(PIE_HTML) && c.body.text.includes(`\n--\n${PIE_TXT}\nAviso legal: https://rwadar.pages.dev/privacidad#aviso-legal\nPrivacidad: https://rwadar.pages.dev/privacidad\n`)));
  paso('pie: quién envía (aviso legal y privacidad), por qué lo recibe y la baja por enlace y mailto',
    html.includes('Te escribe RWAdar') && html.includes('href="https://rwadar.pages.dev/privacidad#aviso-legal"')
    && html.includes('href="https://rwadar.pages.dev/privacidad"') && html.includes('te apuntaste a los avisos de novedades')
    && html.includes(`href="${bajaAna}"`) && html.includes(`href="${MAILTO_BAJA}"`)
    && aAna.body.text.includes(bajaAna) && aAna.body.text.includes('rwadares@gmail.com'));
  paso('sin píxel ni enlaces de seguimiento: ninguna imagen y todos los enlaces directos a rwadar.pages.dev o mailto',
    correos.every((c) => !/<img|utm_|track/i.test(c.body.html)
      && [...c.body.html.matchAll(/href="([^"]*)"/g)].every(([, h]) => h.startsWith('https://rwadar.pages.dev/') || h.startsWith('mailto:rwadares@gmail.com'))));
  const [bienvenidaSi] = paraCorreo(correos, nueva);
  const [bienvenidaNo] = paraCorreo(correos, nueva2);
  volcarCorreo('bienvenida-con-avisos', bienvenidaSi);
  volcarCorreo('bienvenida-sin-avisos', bienvenidaNo);
  volcarCorreo('anuncio-novedad', aAna);
  paso('bienvenida: Academy gratis con enlace a /academy/, sin ofertas ni número de lecciones, y «Si no creaste esta cuenta, escríbenos y la borramos»',
    [bienvenidaSi, bienvenidaNo].every((b) => b && b.body.subject === 'Te damos la bienvenida a RWAdar'
      && b.body.html.includes('href="https://rwadar.pages.dev/academy/"') && b.body.html.includes('Academy')
      && !/\d+\s*lecciones|oportunidad|rentabilidad|\/ofertas\/|#emisiones/i.test(b.body.html)
      && b.body.text.includes(`\n\n${CIERRE_TXT}\n\n--\n`) && b.body.html.includes(CIERRE_HTML)
      && !/bórrala/.test(b.body.html + b.body.text)));
  paso('bienvenida a quien NO se apuntó: sin cabeceras de correo (ni List-Unsubscribe), sin baja y sin invitar a apuntarse',
    !('headers' in bienvenidaNo.body) && !bienvenidaNo.body.html.includes('baja?t=') && !bienvenidaNo.body.text.includes('baja?t=')
    && !/apunta|avisos de novedades/i.test(bienvenidaNo.body.html));
  paso('bienvenida a quien se apuntó: confirma la suscripción con el párrafo nuevo (fichas, no ofertas), con List-Unsubscribe y enlace de baja',
    'List-Unsubscribe' in (bienvenidaSi.body.headers || {}) && bienvenidaSi.body.html.includes(`${PARRAFO_APUNTADO}</p>`)
    && bienvenidaSi.body.text.includes(`\n\n${PARRAFO_APUNTADO}\n\n`) && !/ofertas nuevas/.test(bienvenidaSi.body.html)
    && bienvenidaSi.body.html.includes(`baja?t=${(await pref(nueva)).baja_token}`));

  const pushes = await peticiones(antes, EXPO);
  const deAna = pushes.filter((p) => p.body.to === TOKEN_ANA);
  const anuncioAna = deAna.find((p) => p.body.data.tipo === 'novedad');
  paso('Expo: canales de Android separados (bienvenida por «cuenta», anuncios por «novedades»), data exactamente {tipo, destino} y sin Authorization si no hay EXPO_ACCESS_TOKEN',
    pushes.length === 4 && pushes.every((p) => p.body.channelId === (p.body.data.tipo === 'bienvenida' ? 'cuenta' : 'novedades')
      && Object.keys(p.body.data).sort().join() === 'destino,tipo'
      && ['inicio', 'buscar', 'academy'].includes(p.body.data.destino) && !('authorization' in p.headers))
    && isDeepStrictEqual(anuncioAna?.body.data, { tipo: 'novedad', destino: 'academy' })
    && anuncioAna.body.title === 'Avisos & <mejoras> en la app');
  paso('ningún push lleva datos personales (ni correo ni id de cuenta)',
    pushes.every((p) => ![ana, luis, eva].some((u) => JSON.stringify(p.body).includes(u.email) || JSON.stringify(p.body).includes(u.id))));
  paso('la bienvenida por push va a la Academy con el texto nuevo: data {tipo: bienvenida, destino: academy}, canal «cuenta»',
    pushes.filter((p) => p.body.data.tipo === 'bienvenida').length === 2
    && pushes.filter((p) => p.body.data.tipo === 'bienvenida').every((p) => p.body.data.destino === 'academy'
      && p.body.title === 'RWAdar' && p.body.body === PUSH_BIENVENIDA && p.body.channelId === 'cuenta'));
  paso('una segunda vuelta no reparte ni envía nada de nuevo', await (async () => {
    const desde = await ultimaPeticion();
    await procesar();
    return (await ultimaPeticion()) === desde;
  })());

  // Respuestas de Lettermint (202 con message_id, como documenta, o errores).
  await sesion(db);
  const reenviada = await una(db, "select id, email from auth.users where email = 'reenviada@ejemplo.test'");
  const sinId = await una(db, "select id, email from auth.users where email = 'idioma-1@ejemplo.test'");
  const id = (u) => paraCorreo(correos, u)[0].id;
  await responder(id(ana), 202, { message_id: 'lm-mensaje-1', status: 'pending' });
  await responder(id(eva), 500, { message: 'Server Error' });
  await responder(id(nueva2), 401, { message: 'Unauthenticated.' });
  await responder(id(reenviada), 422, { message: 'The given data was invalid.' });
  await responder(id(canalRaro), 429, { message: 'Too Many Attempts.' });
  await responder(id(sinId), 202, { status: 'pending' });
  // Push: ticket como objeto, como array de uno y DeviceNotRegistered al enviar.
  const pushDe = (t, tipo) => pushes.find((p) => p.body.to === t && p.body.data.tipo === tipo).id;
  await responder(pushDe(TOKEN_ANA, 'novedad'), 200, { data: { status: 'ok', id: 'ticket-ana-1' } });
  await responder(pushDe(TOKEN_ANA_2, 'novedad'), 200, { data: [{ status: 'ok', id: 'ticket-ana-2' }] });
  await responder(pushDe(TOKEN_ANA, 'bienvenida'), 200, { data: { status: 'ok', id: 'ticket-ana-3' } });
  await responder(pushes.find((p) => p.body.data.tipo === 'bienvenida' && p.body.to !== TOKEN_ANA).id, 200,
    { data: { status: 'error', message: 'no', details: { error: 'DeviceNotRegistered' } } });
  const desde = await ultimaPeticion();
  await procesar();
  const reenvios = await peticiones(desde, LETTERMINT);
  const [aceptadoAna, fallido401, fallido422] = [await correoDe(ana, 'anuncio'), await correoDe(nueva2, 'bienvenida'), await correoDe(reenviada, 'anuncio')];
  paso('Lettermint 202 con message_id → aceptado con su id; 401 y 422 → fallido «Lettermint rechazó la petición (HTTP n)», sin reintentar',
    aceptadoAna.estado === 'aceptado' && aceptadoAna.proveedor_mensaje_id === 'lm-mensaje-1' && aceptadoAna.error === null
    && fallido401.estado === 'fallido' && fallido401.error === 'Lettermint rechazó la petición (HTTP 401)'
    && fallido422.estado === 'fallido' && fallido422.error === 'Lettermint rechazó la petición (HTTP 422)'
    && paraCorreo(reenvios, nueva2).length === 0 && paraCorreo(reenvios, reenviada).length === 0);
  const primero = (u) => paraCorreo(correos, u)[0];
  paso('un 500, un 429 y un 202 sin message_id vuelven a la cola y se reenvían con la MISMA Idempotency-Key y el mismo cuerpo',
    reenvios.length === 3 && [eva, canalRaro, sinId].every((u) => {
      const [r] = paraCorreo(reenvios, u);
      return r && r.headers['Idempotency-Key'] === primero(u).headers['Idempotency-Key'] && isDeepStrictEqual(r.body, primero(u).body);
    }));
  // Tras un 5xx, Lettermint contesta 409 a esa clave durante 24 horas.
  await responder(paraCorreo(reenvios, eva)[0].id, 409, { message: 'Idempotency key already used.' });
  await responder(paraCorreo(reenvios, canalRaro)[0].id, 202, { message_id: 'lm-mensaje-2', status: 'pending' });
  await responder(paraCorreo(reenvios, sinId)[0].id, 202, { message_id: 'lm-mensaje-3', status: 'pending' });
  await sesion(db);
  paso('Expo: el ticket aceptado espera su recibo; DeviceNotRegistered al enviar borra ese móvil',
    await numero(db, "select count(*) from rwadar_novedades.pushes where estado = 'ticket'") === 3
    && await numero(db, 'select count(*) from rwadar_novedades.dispositivos where token = $1', [token(6)]) === 0
    && await numero(db, 'select count(*) from rwadar_novedades.dispositivos where usuario_id = $1', [luis.id]) === 3);
  // Sin respuesta durante 25 minutos: entrega incierta, nunca un segundo envío.
  await db.query(`update rwadar_novedades.correos set peticion_el = now() - interval '26 minutes',
    idempotencia_el = now() - interval '26 minutes' where usuario_id = $1 and tipo = 'bienvenida'`, [nueva.id]);
  // Recibos: a los 15 minutos del ticket.
  await db.exec("update rwadar_novedades.pushes set ticket_el = now() - interval '16 minutes' where estado = 'ticket'");
  const desde2 = await ultimaPeticion();
  await procesar();
  paso('sin respuesta de Lettermint en 25 minutos, «incierto» y sin reenviar',
    (await correoDe(nueva, 'bienvenida')).estado === 'incierto' && (await peticiones(desde2, LETTERMINT)).length === 0);
  const [incierto409, aceptado429, aceptadoSinId] = [await correoDe(eva, 'anuncio'), await correoDe(canalRaro, 'anuncio'), await correoDe(sinId, 'anuncio')];
  paso('Lettermint 409 → «incierto» con el aviso de no reenviar y sin otro envío; los reintentos aceptados guardan su message_id',
    incierto409.estado === 'incierto' && incierto409.terminado_el instanceof Date
    && incierto409.error === 'Lettermint: clave idempotente ya usada o en curso; revisar en el panel, no reenviar automáticamente'
    && aceptado429.estado === 'aceptado' && aceptado429.proveedor_mensaje_id === 'lm-mensaje-2'
    && aceptadoSinId.estado === 'aceptado' && aceptadoSinId.proveedor_mensaje_id === 'lm-mensaje-3' && aceptadoSinId.intentos === 2
    && paraCorreo(await peticiones(desde2, LETTERMINT), eva).length === 0);
  const recibos = await peticiones(desde2, RECIBOS);
  paso('a los 15 minutos se consulta el recibo de cada ticket, uno por petición',
    recibos.length === 3 && recibos.every((p) => p.body.ids.length === 1));
  const recibo = (t) => recibos.find((p) => p.body.ids[0] === t).id;
  await responder(recibo('ticket-ana-1'), 200, { data: { 'ticket-ana-1': { status: 'ok' } } });
  await responder(recibo('ticket-ana-2'), 200, { data: { 'ticket-ana-2': { status: 'error', details: { error: 'DeviceNotRegistered' } } } });
  await responder(recibo('ticket-ana-3'), 200, { data: {} });
  await procesar();
  await sesion(db);
  paso('recibo ok → aceptado y sin token; DeviceNotRegistered en el recibo → fallido y el móvil se borra; sin recibo, se vuelve a consultar',
    (await una(db, "select estado, token from rwadar_novedades.pushes where ticket_id = 'ticket-ana-1'")).estado === 'aceptado'
    && (await una(db, "select token from rwadar_novedades.pushes where ticket_id = 'ticket-ana-1'")).token === null
    && (await una(db, "select estado from rwadar_novedades.pushes where ticket_id = 'ticket-ana-2'")).estado === 'fallido'
    && await numero(db, 'select count(*) from rwadar_novedades.dispositivos where token = $1', [TOKEN_ANA_2]) === 0
    && (await una(db, "select estado from rwadar_novedades.pushes where ticket_id = 'ticket-ana-3'")).estado === 'ticket');
  paso('ningún push terminado conserva el token',
    await numero(db, "select count(*) from rwadar_novedades.pushes where token is not null and estado in ('aceptado','descartado','fallido')") === 0);
}

// Reintentos de Lettermint (D3) que no cubre lo de arriba: un 408 y una
// petición sin respuesta de pg_net (corta a los 10 s y escribe «Timeout was
// reached») vuelven a la cola; una petición sin fila en net._http_response a
// los 10 minutos, también. Siempre con la MISMA Idempotency-Key y el mismo
// cuerpo: con otra clave, Lettermint enviaría un segundo correo. Y el tope de
// 5 intentos: el cuarto se reintenta; el quinto termina en «fallido».
{
  const usuarios = [];
  for (const nombre of ['reintento-408', 'reintento-sin-respuesta', 'reintento-10-minutos', 'reintento-cuarto', 'reintento-quinto']) {
    const u = await altaAuth(`${nombre}@ejemplo.test`, {});
    await confirmarAuth(u);
    usuarios.push(u);
  }
  const [u408, uSin, u10, uCuarto, uQuinto] = usuarios;
  const ids = usuarios.map((u) => u.id);
  const estados = async () => { await sesion(db); return filas(db, `select u.email, c.estado, c.intentos, c.error, c.terminado_el
    from rwadar_novedades.correos c join auth.users u on u.id = c.usuario_id
    where c.usuario_id = any($1::uuid[]) and c.tipo = 'bienvenida'`, [ids]); };
  const desde = await ultimaPeticion();
  await procesar();
  const primeras = await peticiones(desde, LETTERMINT);
  const primeraDe = (u) => paraCorreo(primeras, u)[0];
  await sesion(db);
  await responder(primeraDe(u408).id, 408, { message: 'Request Timeout' });
  await responder(primeraDe(uSin).id, null, null, 'Timeout was reached');
  await responder(primeraDe(uCuarto).id, 429, { message: 'Too Many Attempts.' });
  await responder(primeraDe(uQuinto).id, 500, { message: 'Server Error' });
  await db.query(`update rwadar_novedades.correos set peticion_el = now() - interval '11 minutes',
    idempotencia_el = now() - interval '11 minutes' where usuario_id = $1 and tipo = 'bienvenida'`, [u10.id]);
  await db.query("update rwadar_novedades.correos set intentos = 4 where usuario_id = $1 and tipo = 'bienvenida'", [uCuarto.id]);
  await db.query("update rwadar_novedades.correos set intentos = 5 where usuario_id = $1 and tipo = 'bienvenida'", [uQuinto.id]);
  // Primero solo la lectura de respuestas, para ver el estado intermedio.
  await db.query('select rwadar_novedades.leer_correos()');
  const leidos = await estados();
  const leido = (u) => leidos.find((f) => f.email === u.email) || {};
  paso('Lettermint 408, sin respuesta de pg_net («Timeout was reached») y 429 por debajo del tope vuelven a «pendiente» con su error; un 500 en el quinto intento queda «fallido»',
    usuarios.every((u) => paraCorreo(primeras, u).length === 1)
    && leido(u408).estado === 'pendiente' && leido(u408).error === 'Lettermint HTTP 408'
    && leido(uSin).estado === 'pendiente' && leido(uSin).error === 'Timeout was reached'
    && leido(uCuarto).estado === 'pendiente' && leido(uCuarto).intentos === 4
    && leido(uQuinto).estado === 'fallido' && leido(uQuinto).terminado_el instanceof Date
    && leido(uQuinto).error === 'Lettermint HTTP 500' && leido(u10).estado === 'enviando');
  const desde2 = await ultimaPeticion();
  await procesar();
  const segundas = await peticiones(desde2, LETTERMINT);
  const tras = await estados();
  const fila = (u) => tras.find((f) => f.email === u.email) || {};
  const misma = (u) => {
    const lista = paraCorreo(segundas, u);
    return lista.length === 1 && lista[0].headers['Idempotency-Key'] === primeraDe(u).headers['Idempotency-Key']
      && isDeepStrictEqual(lista[0].body, primeraDe(u).body) && fila(u).estado === 'enviando';
  };
  paso('se reenvían con la MISMA Idempotency-Key y el mismo cuerpo tras un 408, tras quedarse sin respuesta, a los 10 minutos sin fila en net._http_response y en el cuarto intento',
    [u408, uSin, u10, uCuarto].every(misma)
    && fila(u408).intentos === 2 && fila(uSin).intentos === 2 && fila(u10).intentos === 2 && fila(uCuarto).intentos === 5);
  paso('tope de 5 intentos: el que falló en el quinto sigue «fallido» y no sale un sexto envío',
    paraCorreo(segundas, uQuinto).length === 0 && fila(uQuinto).estado === 'fallido' && fila(uQuinto).intentos === 5);
  // Fuera de la cola, para no cambiar las cuentas de la limpieza de abajo.
  await sesion(db);
  await db.query('delete from rwadar_novedades.correos where usuario_id = any($1::uuid[])', [ids]);
}

// Segunda comprobación justo antes de enviar.
{
  await sesion(db);
  await db.exec(`update vault.decrypted_secrets set decrypted_secret = 'corta' where name = 'LETTERMINT_API_TOKEN';
    insert into vault.decrypted_secrets(name, decrypted_secret) values ('EXPO_ACCESS_TOKEN', 'no válido!')`);
  await db.query(`select rwadar_novedades.anunciar('actualizacion', 'actualizacion:prueba-n3', 'Nueva versión de la app',
    'Llega la versión con avisos en el móvil.', 'https://rwadar.pages.dev/')`);
  const desde = await ultimaPeticion();
  const { r, avisos } = await procesar();
  paso('si Vault falla, procesar() sigue: reparte, deja el envío para otra vuelta y solo avisa con el sqlstate',
    r.fallo_envio_correo === '55000' && r.fallo_envio_push === '55000' && r.repartidos > 0
    && (await ultimaPeticion()) === desde && avisos.some((a) => /envío de correo omitido \(sqlstate 55000\)/.test(a)));
  // Llamada directa: el mensaje exacto del bloqueo, con el token corto y sin él.
  await sesion(db);
  const eCorta = await error(() => db.query('select rwadar_novedades.enviar_correos()'));
  await db.exec("update vault.decrypted_secrets set name = 'LETTERMINT_API_TOKEN_QUITADO' where name = 'LETTERMINT_API_TOKEN'");
  const eSin = await error(() => db.query('select rwadar_novedades.enviar_correos()'));
  await db.exec("delete from vault.decrypted_secrets where name = 'LETTERMINT_API_TOKEN_QUITADO'");
  paso('con LETTERMINT_API_TOKEN corto o sin él, enviar_correos() se bloquea con «correo bloqueado: credenciales de Lettermint ausentes o no válidas en Vault» y no pide nada',
    [eCorta, eSin].every((e) => e?.code === '55000' && e.message === 'correo bloqueado: credenciales de Lettermint ausentes o no válidas en Vault')
    && (await ultimaPeticion()) === desde);
  // Mientras tanto: eva se da de baja con el enlace (sin sesión), el móvil de
  // ana desaparece (como en la limpieza de 180 días) y canal-raro deja de estar
  // confirmada.
  const tokenEva = (await pref(eva)).baja_token;
  await sesion(db, null, 'anon');
  const bajaEva = (await rpc('select public.baja_avisos($1) b', [tokenEva])).b;
  await sesion(db);
  await db.query('delete from rwadar_novedades.dispositivos where token = $1', [TOKEN_ANA]);
  await comoAuth(() => db.query('update auth.users set email_confirmed_at = null where id = $1', [canalRaro.id]));
  await sesion(db);
  await db.exec(`${VAULT_LETTERMINT}; delete from vault.decrypted_secrets where name = 'EXPO_ACCESS_TOKEN'`);
  const desde2 = await ultimaPeticion();
  await procesar();
  const enviados = (await peticiones(desde2, LETTERMINT)).map((p) => p.body.to[0]);
  paso('la baja posterior al reparto corta el correo: se descarta sin enviar',
    bajaEva === true && !enviados.includes(eva.email) && (await correoDe(eva, 'anuncio')).estado === 'descartado'
    && enviados.includes(ana.email));
  paso('una cuenta que deja de estar confirmada tampoco recibe nada',
    !enviados.includes(canalRaro.email) && (await correoDe(canalRaro, 'anuncio')).estado === 'descartado');
  await sesion(db);
  const pushN3 = await una(db, `select p.estado, p.token from rwadar_novedades.pushes p
    join rwadar_novedades.anuncios a on a.id = p.anuncio_id where a.clave = 'actualizacion:prueba-n3'`);
  paso('un móvil que desaparece después del reparto no recibe el push: se descarta y se borra su token',
    (await peticiones(desde2, EXPO)).length === 0 && pushN3?.estado === 'descartado' && pushN3.token === null);
  // La n3 de ana, con el token restaurado: Lettermint la acepta.
  const [n3Ana] = paraCorreo(await peticiones(desde2, LETTERMINT), ana);
  await sesion(db);
  await responder(n3Ana.id, 202, { message_id: 'lm-mensaje-n3', status: 'pending' });
  const desde3 = await ultimaPeticion();
  await procesar();
  await sesion(db);
  const correoN3 = await una(db, `select c.estado, c.proveedor_mensaje_id from rwadar_novedades.correos c
    join rwadar_novedades.anuncios a on a.id = c.anuncio_id where a.clave = 'actualizacion:prueba-n3' and c.usuario_id = $1`, [ana.id]);
  paso('restaurado el token, el anuncio pendiente sale con él y el 202 de Lettermint lo deja aceptado, sin reenviar',
    n3Ana?.headers['x-lettermint-token'] === TOKEN_LM && correoN3?.estado === 'aceptado'
    && correoN3.proveedor_mensaje_id === 'lm-mensaje-n3' && paraCorreo(await peticiones(desde3, LETTERMINT), ana).length === 0);
  await sesion(db, null, 'anon');
  const otra = (await rpc('select public.baja_avisos($1) b', [tokenEva])).b;
  await sesion(db);
  paso('baja_avisos con un token válido devuelve true, también repetida', otra === true && (await pref(eva)).novedades === false);
  // quitar_aviso_push (al cerrar sesión) se lleva también lo pendiente para ese móvil.
  await db.query(`insert into rwadar_novedades.pushes(token, usuario_id, tipo, anuncio_id)
    select $1, $2, 'anuncio', id from rwadar_novedades.anuncios where clave = 'novedad:prueba-n1'`, [token(30), ana.id]);
  await como(ana);
  await rpc("select public.registrar_aviso_push($1, 'android') r", [token(30)]);
  const quitado = (await rpc('select public.quitar_aviso_push($1) r', [token(30)])).r;
  await sesion(db);
  paso('quitar_aviso_push quita el móvil y lo pendiente para él',
    quitado === true && await numero(db, 'select count(*) from rwadar_novedades.pushes where token = $1', [token(30)]) === 0);
}

// Aviso automático de ofertas, Authorization de Expo y un retenido publicado con el flujo.
{
  await como(ana);
  await rpc("select public.registrar_aviso_push($1, 'android') r", [TOKEN_ANA]);
  await sesion(db);
  await db.exec('update rwadar_novedades.configuracion set ofertas_automaticas = true');
  await db.query("insert into vault.decrypted_secrets(name, decrypted_secret) values ('EXPO_ACCESS_TOKEN', $1)", [EXPO_FICTICIO]);
  await aprobar(loteInventado(['oferta-inventada-cinco']));
  const [automatico] = await anunciosOfertas();
  const desde = await ultimaPeticion();
  await procesar();
  const push = (await peticiones(desde, EXPO)).find((p) => p.body.to === TOKEN_ANA);
  const correo = (await peticiones(desde, LETTERMINT)).find((p) => p.body.to[0] === ana.email);
  volcarCorreo('anuncio-ofertas', correo);
  paso('con ofertas_automaticas, el anuncio de ofertas nace publicado y procesar() lo reparte',
    automatico?.estado === 'publicado' && automatico.publicado_el instanceof Date
    && correo?.body.subject === '1 ficha nueva en el radar de RWAdar' && correo.body.html.includes(AVISO_FIJO)
    && correo.body.route === 'broadcast');
  paso('el push de ofertas va a Buscar y, con EXPO_ACCESS_TOKEN en Vault, lleva Authorization',
    isDeepStrictEqual(push?.body.data, { tipo: 'ofertas', destino: 'buscar' })
    && push.headers.authorization === `Bearer ${EXPO_FICTICIO}`);
  await db.exec(`update rwadar_novedades.configuracion set ofertas_automaticas = false;
    update rwadar_novedades.anuncios set clave = 'ofertas:prueba-dos' where clave = 'ofertas:${HOY}'`);
  await aprobar(loteInventado(['oferta-inventada-seis']));
  const [retenido] = await anunciosOfertas();
  await procesar();
  await sesion(db);
  paso('un anuncio retenido creado con todo encendido tampoco se reparte',
    retenido.estado === 'retenido' && await numero(db, 'select (select count(*) from rwadar_novedades.correos where anuncio_id = $1) + (select count(*) from rwadar_novedades.pushes where anuncio_id = $1)', [retenido.id]) === 0);
  const flujo = await correAnunciar({ accion: 'publicar-retenido', id: String(retenido.id) });
  await procesar();
  await sesion(db);
  paso('publicado con anunciar.sql (accion publicar-retenido), se reparte en la siguiente vuelta',
    !flujo.e && await numero(db, 'select count(*) from rwadar_novedades.correos where anuncio_id = $1', [retenido.id]) >= 1);
}

// Un retenido creado ANTES de activar y publicado DESPUÉS también se reparte:
// cuenta la fecha de publicación, no la de creación.
{
  const c = await config();
  const antes = new Date(Math.min(c.correo_activado_el.getTime(), c.push_activado_el.getTime()) - 3600 * 1000);
  const { id } = await una(db, `insert into rwadar_novedades.anuncios (tipo, clave, estado, titulo, texto, enlace, creado_el)
    values ('novedad', 'novedad:retenido-antes-de-activar', 'retenido', 'Retenido desde antes de activar',
      'Se publica después de encender los avisos.', 'https://rwadar.pages.dev/', $1) returning id`, [antes]);
  const repartos = async () => {
    await sesion(db);
    return una(db, `select (select count(*)::int from rwadar_novedades.correos where anuncio_id = $1) c,
      (select count(*)::int from rwadar_novedades.pushes where anuncio_id = $1) p`, [id]);
  };
  await procesar();
  const mientrasRetenido = await repartos();
  await db.query('select rwadar_novedades.publicar_anuncio($1)', [id]);
  await procesar();
  const trasPublicar = await repartos();
  paso(`un retenido creado antes de activar y publicado después se reparte por correo y push (${trasPublicar.c}/${trasPublicar.p})`,
    mientrasRetenido.c === 0 && mientrasRetenido.p === 0 && trasPublicar.c >= 1 && trasPublicar.p >= 1);
}

// Limpieza: colas terminadas (bienvenidas incluidas) a los 90 días y móviles a
// los 180; las bienvenidas no se repiten porque su marca está en preferencias.
{
  await sesion(db);
  await db.exec(`update rwadar_novedades.correos set terminado_el = now() - interval '91 days', creado_el = now() - interval '91 days'
      where estado in ('aceptado','descartado','fallido','incierto');
    update rwadar_novedades.pushes set terminado_el = now() - interval '91 days', creado_el = now() - interval '91 days'
      where estado in ('aceptado','descartado','fallido');
    update rwadar_novedades.dispositivos set actualizado_el = now() - interval '181 days' where usuario_id = '${luis.id}';
    update rwadar_novedades.anuncios set creado_el = now() - interval '4 years', publicado_el = now() - interval '4 years'
      where clave = 'novedad:viejo'`);
  const anunciosAntes = await numero(db, 'select count(*) from rwadar_novedades.anuncios');
  const terminadas = `select (select count(*) from rwadar_novedades.correos where estado in ('aceptado','descartado','fallido','incierto'))
    + (select count(*) from rwadar_novedades.pushes where estado in ('aceptado','descartado','fallido'))`;
  const bienvenidasTerminadas = await numero(db, `select
    (select count(*) from rwadar_novedades.correos where tipo = 'bienvenida' and estado in ('aceptado','descartado','fallido','incierto'))
    + (select count(*) from rwadar_novedades.pushes where tipo = 'bienvenida' and estado in ('aceptado','descartado','fallido'))`);
  const { r } = await procesar();
  paso(`limpieza: colas terminadas a los 90 días, también ${bienvenidasTerminadas} bienvenidas, y móviles sin actualizar a los 180 (${r.limpiados} filas)`,
    bienvenidasTerminadas === 3 && await numero(db, terminadas) === 0
    && await numero(db, 'select count(*) from rwadar_novedades.dispositivos where usuario_id = $1', [luis.id]) === 0);
  paso(`la tabla de anuncios no se limpia nunca (copia de cada aviso para posibles requerimientos): siguen los ${anunciosAntes}, también uno de hace 4 años`,
    anunciosAntes > 0 && await numero(db, 'select count(*) from rwadar_novedades.anuncios') === anunciosAntes
    && await numero(db, "select count(*) from rwadar_novedades.anuncios where clave = 'novedad:viejo'") === 1
    && !/delete\s+from\s+rwadar_novedades\.anuncios/i.test(sinComentarios(SQL30)));
  // nueva-2 vuelve a confirmar el correo y luis registra otro móvil: sus
  // bienvenidas ya se encolaron y la cola se limpió; las marcas lo impiden.
  const nueva2 = await una(db, "select id, email from auth.users where email = 'nueva-2@ejemplo.test'");
  await comoAuth(() => db.query('update auth.users set email_confirmed_at = null where id = $1', [nueva2.id]));
  await confirmarAuth(nueva2);
  await como(luis);
  await rpc("select public.registrar_aviso_push($1, 'android') r", [token(40)]);
  const nuevaCuenta = await altaAuth('tras-limpieza@ejemplo.test', {});
  await confirmarAuth(nuevaCuenta);
  await sesion(db);
  const bienvenidasDe = async (u, tabla) => numero(db, `select count(*) from rwadar_novedades.${tabla} where usuario_id = $1 and tipo = 'bienvenida'`, [u.id]);
  paso('tras la limpieza, ni reconfirmar el correo ni registrar otro móvil repiten la bienvenida (marcas en preferencias)',
    await bienvenidasDe(nueva2, 'correos') === 0 && await bienvenidasDe(luis, 'pushes') === 0
    && (await pref(nueva2)).bienvenida_correo_el instanceof Date && (await pref(luis)).bienvenida_push_el instanceof Date);
  paso('una cuenta nueva sí recibe su bienvenida, una vez, con su marca',
    await bienvenidasDe(nuevaCuenta, 'correos') === 1 && (await pref(nuevaCuenta)).bienvenida_correo_el instanceof Date);
}

/* =====================================================================
   10 · borrar_mi_cuenta (versión del refuerzo) con filas en todas las tablas
   ===================================================================== */
{
  await sesion(db);
  await db.query(`select rwadar_novedades.anunciar('novedad', 'novedad:antes-de-borrar', 'Antes de borrar', 'Un aviso más.',
    'https://rwadar.pages.dev/')`);
  await procesar();
  const filasDe = async (u) => {
    await sesion(db);
    return una(db, `select (select count(*)::int from rwadar_novedades.preferencias where usuario_id = $1) p,
      (select count(*)::int from rwadar_novedades.dispositivos where usuario_id = $1) d,
      (select count(*)::int from rwadar_novedades.correos where usuario_id = $1) c,
      (select count(*)::int from rwadar_novedades.pushes where usuario_id = $1) s`, [u.id]);
  };
  const antes = await filasDe(ana);
  const anuncios = await numero(db, 'select count(*) from rwadar_novedades.anuncios');
  const definicion = (await una(db, "select pg_get_functiondef('public.borrar_mi_cuenta()'::regprocedure) d")).d;
  paso('borrar_mi_cuenta es la versión del refuerzo (sesión confirmada y contraseña recién comprobada)',
    definicion.includes('rwadar_cuentas_privadas.sesion_confirmada()') && definicion.includes('Confirma de nuevo tu contraseña'));
  await como(ana);
  await db.query('select public.borrar_mi_cuenta()');
  const despues = await filasDe(ana);
  paso(`borrar_mi_cuenta con filas en las cuatro tablas de la cuenta (${Object.values(antes).join('/')}) lo borra todo en cascada`,
    Object.values(antes).every((n) => n > 0) && Object.values(despues).every((n) => n === 0)
    && await numero(db, 'select count(*) from auth.users where id = $1', [ana.id]) === 0);
  paso('los anuncios y las filas de otras cuentas se conservan',
    await numero(db, 'select count(*) from rwadar_novedades.anuncios') === anuncios && (await filasDe(nace)).p === 1);

  // El historial del permiso sobrevive al borrado, bloqueado (LOPDGDD art. 32).
  const hAna = await historial(ana);
  paso(`borrar la cuenta conserva su historial del permiso (${hAna.length} fila/s), con el correo y cuenta_borrada_el`,
    hAna.length >= 1 && hAna.every((f) => f.cuenta_borrada_el instanceof Date && f.correo === ana.email)
    && hAna[0].accion === 'alta' && hAna[0].version === VERSION);
  await sesion(db);
  await numero(db, 'select rwadar_novedades.limpiar()');
  const vTras = await verificar();
  paso('limpiar() no borra ese historial recién bloqueado y el verificador 30 sigue pasando',
    (await historial(ana)).length === hAna.length && vTras.ok);

  // Con el historial averiado, el borrado pasa igual (y el warning no lleva el correo).
  const hEva = (await historial(eva)).length;
  await sesion(db);
  await db.exec(`create function public._rompe_historial() returns trigger language plpgsql as $$
      begin raise exception 'avería con %', old.correo; end $$;
    create trigger rompe before update on rwadar_novedades.historial_permiso for each row execute function public._rompe_historial();`);
  await como(eva);
  const avisosBorrado = [];
  const eBorrado = await error(() => db.query('select public.borrar_mi_cuenta()', [], { onNotice: (n) => avisosBorrado.push(n.message) }));
  await sesion(db);
  await db.exec('drop trigger rompe on rwadar_novedades.historial_permiso; drop function public._rompe_historial();');
  const sinMarca = await historial(eva);
  paso(`con el disparador de borrado averiado (un error con el correo dentro), borrar_mi_cuenta borra la cuenta igual; solo un warning con el sqlstate (${hEva} fila/s sin marcar)`,
    !eBorrado && await numero(db, 'select count(*) from auth.users where id = $1', [eva.id]) === 0
    && hEva >= 2 && sinMarca.length === hEva && sinMarca.every((f) => f.cuenta_borrada_el === null)
    && avisosBorrado.some((a) => /historial sin marcar al borrar la cuenta \(sqlstate P0001\)/.test(a))
    && avisosBorrado.every((a) => !a.includes(eva.email)));
  await numero(db, 'select rwadar_novedades.limpiar()');
  paso('limpiar() marca después las filas que se quedaron sin cuenta (el plazo cuenta desde ese día)',
    (await historial(eva)).every((f) => f.cuenta_borrada_el instanceof Date) && (await historial(eva)).length === hEva);

  // A los 3 años de borrar la cuenta, fuera; antes no, y nunca de una cuenta viva.
  await sesion(db);
  const vivo = await una(db, "select id from auth.users where email = 'Historia.Permiso@Ejemplo.test'");
  const hVivo = await numero(db, 'select count(*) from rwadar_novedades.historial_permiso where usuario_id = $1', [vivo.id]);
  await db.exec('alter table rwadar_novedades.historial_permiso disable trigger historial_solo_anadir');
  await db.query(`update rwadar_novedades.historial_permiso set cuenta_borrada_el = now() - interval '3 years' - interval '1 day'
    where usuario_id = $1`, [ana.id]);
  await db.query(`update rwadar_novedades.historial_permiso set cuenta_borrada_el = now() - interval '3 years' + interval '1 day'
    where usuario_id = $1`, [eva.id]);
  await db.query(`update rwadar_novedades.historial_permiso set creado_el = now() - interval '5 years' where usuario_id = $1`, [vivo.id]);
  // Una marca puesta por error a una cuenta viva: limpiar() tampoco la borra.
  await db.query(`insert into rwadar_novedades.historial_permiso (usuario_id, accion, origen, cuenta_borrada_el)
    values ($1, 'baja', 'correo', now() - interval '4 years')`, [nace.id]);
  await db.exec('alter table rwadar_novedades.historial_permiso enable trigger historial_solo_anadir');
  const borradas = await numero(db, 'select rwadar_novedades.limpiar()');
  paso(`limpiar() borra el historial de las cuentas borradas hace más de 3 años (${hAna.length} fila/s de ana), no el de hace menos (eva) ni el de cuentas vivas, aunque sea de hace 5 años o lleve una marca`,
    borradas >= hAna.length && (await historial(ana)).length === 0 && (await historial(eva)).length === hEva
    && await numero(db, 'select count(*) from rwadar_novedades.historial_permiso where usuario_id = $1', [vivo.id]) === hVivo
    && await numero(db, 'select count(*) from rwadar_novedades.historial_permiso where usuario_id = $1 and cuenta_borrada_el is not null', [nace.id]) === 1);
  const eLimpia = await codigo(() => db.query('delete from rwadar_novedades.historial_permiso where usuario_id = $1', [eva.id]));
  paso('y el disparador solo_anadir no deja borrar a mano el historial de una cuenta borrada hace menos de 3 años (42501)',
    eLimpia === '42501' && (await historial(eva)).length === hEva);
  await db.exec('alter table rwadar_novedades.historial_permiso disable trigger historial_solo_anadir');
  await db.query('delete from rwadar_novedades.historial_permiso where usuario_id = $1 and cuenta_borrada_el is not null', [nace.id]);
  await db.exec('alter table rwadar_novedades.historial_permiso enable trigger historial_solo_anadir');

  // Borrar desde el panel o la API de administración (GoTrue, con su rol): igual.
  const porAuth = await una(db, "select id, email from auth.users where email = 'idioma-0@ejemplo.test'");
  const hPorAuth = (await historial(porAuth)).length;
  const ePorAuth = await error(() => comoAuth(() => db.query('delete from auth.users where id = $1', [porAuth.id])));
  const tras = await historial(porAuth);
  paso('borrar la cuenta con el rol de Auth (supabase_auth_admin, sin permisos sobre rwadar_novedades) también deja su historial bloqueado',
    !ePorAuth && hPorAuth === 1 && tras.length === 1 && tras[0].cuenta_borrada_el instanceof Date && tras[0].correo === porAuth.email
    && await numero(db, 'select count(*) from auth.users where id = $1', [porAuth.id]) === 0);
}

/* =====================================================================
   11 · Convivencia con 22, 23, fresh-install, correo_ y push_fallo_cerrado
   ===================================================================== */
{
  // Los dos relojes de la 30: el de envío y el diario de limpieza, tal cual.
  const AMBOS = ['rwadar-novedades', LIMPIEZA[0]].join();
  const reloj = async () => ((await conLimpieza()) ? (await todosRelojes()).map((r) => r.jobname).sort().join() : 'sin limpieza');
  const corre = async (nombre) => { await sesion(db); const e = await error(() => db.exec(leer(`db/${nombre}`))); if (e) await db.exec('rollback'); return e; };
  // El sistema antiguo de la 23 (inactivo; la 31 no lo toca) sigue pidiendo su
  // credencial de Brevo: una inventada, solo para comprobar la convivencia.
  await sesion(db);
  await db.exec(`insert into vault.decrypted_secrets(name, decrypted_secret) values ('BREVO_API_KEY', 'xkeysib-clave-local-larga-no-real-123456789')
    on conflict (name) do update set decrypted_secret = excluded.decrypted_secret`);
  const e23 = await corre('23_activar_correo.sql');
  const v23 = await corre('23_activar_correo_verificar.sql');
  paso(`con los avisos encendidos se aplica la 23 y su verificador pasa (${[e23, v23].map((e) => e?.message || 'OK').join(' / ')}); siguen los relojes rwadar-novedades y rwadar-novedades-limpieza`,
    !e23 && !v23 && await reloj() === AMBOS);
  const e22 = await corre('22_cierre_regresiones.sql');
  const v22 = await corre('22_cierre_regresiones_verificar.sql');
  const fresh = await corre('fresh_install_verificar.sql');
  paso(`reaplicar la 22 y pasar sus verificadores y fresh-install con el reloj de limpieza puesto (${[e22, v22, fresh].map((e) => e?.message || 'OK').join(' / ')}): los dos relojes siguen`,
    !e22 && !v22 && !fresh && await reloj() === AMBOS);
  const cf = await corre('correo_fallo_cerrado.sql');
  paso('correo_fallo_cerrado.sql apaga el correo antiguo sin tocar los relojes de la 30', !cf && await reloj() === AMBOS);
  const pf = await corre('push_fallo_cerrado.sql');
  paso('push_fallo_cerrado.sql apaga el push antiguo sin tocar los relojes de la 30', !pf && await reloj() === AMBOS);
  // Tras los dos cierres antiguos, la 22 se vuelve a aplicar y sus
  // verificadores pasan con los dos relojes de la 30 puestos.
  const e22b = await corre('22_cierre_regresiones.sql');
  const v22b = await corre('22_cierre_regresiones_verificar.sql');
  const freshB = await corre('fresh_install_verificar.sql');
  paso(`después de esos cierres, reaplicar la 22 y pasar sus verificadores y fresh-install (${[e22b, v22b, freshB].map((e) => e?.message || 'OK').join(' / ')}): los dos relojes siguen`,
    !e22b && !v22b && !freshB && await reloj() === AMBOS);
  const v = await verificar();
  const v31 = await verificar31();
  const { r } = await procesar();
  paso('después de todo, los verificadores 30 y 31 pasan y procesar() sigue funcionando', v.ok && /correo encendido, push encendido/.test(v.aviso)
    && v31.ok && r.estado === 'encendido' && !Object.keys(r).some((k) => k.startsWith('fallo_')));
}

/* =====================================================================
   12 · Apagar el envío, retirar la casilla, reaplicar la 30,
        fallo_cerrado y restaurar una copia anterior a la 30
   ===================================================================== */
{
  await sesion(db);
  const antes = await config();
  await db.exec(APAGAR);
  const c = await config();
  const v = await verificar();
  // Filas viejas: con todo apagado, procesar() no envía, pero limpia igual.
  await sesion(db);
  await db.query(`insert into rwadar_novedades.correos (usuario_id, tipo, anuncio_id, estado, creado_el, terminado_el)
    select $1, 'anuncio', id, 'descartado', now() - interval '100 days', now() - interval '91 days'
      from rwadar_novedades.anuncios where clave = 'novedad:prueba-n1'`, [nace.id]);
  await db.query(`insert into rwadar_novedades.dispositivos (token, usuario_id, plataforma, actualizado_el)
    values ($1, $2, 'android', now() - interval '181 days')`, [token(50), nace.id]);
  const desde = await ultimaPeticion();
  const { r } = await procesar();
  paso('apagar.sql apaga el envío (correo, push, ofertas automáticas y el reloj de envío) y deja el reloj diario de limpieza; el verificador pasa y procesar() no envía nada',
    antes.correo_habilitado && antes.push_habilitado
    && !c.correo_habilitado && !c.push_habilitado && !c.ofertas_automaticas && (await relojes()).length === 0 && await conLimpieza()
    && v.ok && /correo apagado, push apagado/.test(v.aviso) && r.estado === 'apagado' && (await ultimaPeticion()) === desde);
  paso('apagar.sql NO toca la casilla del alta: sigue activa, con la misma fecha, y el verificador no avisa',
    antes.casilla_activa === true && c.casilla_activa === true
    && c.casilla_activada_el.getTime() === antes.casilla_activada_el.getTime()
    && /casilla del alta activa/.test(v.aviso) && !v.avisoCasilla);
  await sesion(db);
  paso(`con todo apagado, procesar() limpia igual: colas terminadas de 90 días y móviles de 180 (${r.limpiados} filas)`,
    r.limpiados >= 2 && await numero(db, 'select count(*) from rwadar_novedades.correos where usuario_id = $1', [nace.id]) === 0
    && await numero(db, 'select count(*) from rwadar_novedades.dispositivos where token = $1', [token(50)]) === 0);
  const trasApagar = await altaAuth('tras-apagar@ejemplo.test', META_SI('web'));
  await confirmarAuth(trasApagar);
  paso('con el envío apagado y la casilla visible, marcarla y confirmar sigue guardando el permiso (nada se pierde en silencio)',
    (await pref(trasApagar))?.novedades === true && (await pref(trasApagar)).origen === 'alta');

  // Retirar la casilla (al quitar la plantilla de Auth): solo la casilla.
  await sesion(db);
  await db.exec(ACTIVAR_CORREO);
  await db.exec(APAGAR_CASILLA);
  const c1 = await config();
  const v1 = await verificar();
  const trasRetirar = await altaAuth('tras-retirar@ejemplo.test', META_SI('web'));
  await confirmarAuth(trasRetirar);
  paso('30_avisos_registrados_apagar_casilla.sql apaga solo la casilla y su fecha: el correo, su reloj y el de limpieza siguen',
    !c1.casilla_activa && c1.casilla_activada_el === null && c1.correo_habilitado && c1.correo_activado_el instanceof Date
    && (await relojes()).length === 1 && await conLimpieza());
  paso(`con la casilla apagada, el verificador pasa y avisa («${v1.avisoCasilla}»)`,
    v1.ok && /casilla del alta inactiva, correo encendido/.test(v1.aviso) && AVISO_CASILLA.test(v1.avisoCasilla || ''));
  paso('después, confirmar con la casilla marcada ya no guarda el permiso; los ya guardados siguen valiendo',
    (await pref(trasRetirar))?.novedades === false && (await pref(trasApagar)).novedades === true);

  // Un anuncio guardado con el filtro antiguo (p. ej., «rendimiento») no
  // impide reaplicar la 30: se conserva tal cual (copia de lo enviado), el
  // filtro nuevo queda sin validar y avisa, y ese anuncio ya no se publica.
  await sesion(db);
  await db.exec(`alter table rwadar_novedades.anuncios drop constraint anuncio_sin_palabras_vetadas;
    alter table rwadar_novedades.anuncios add constraint anuncio_sin_palabras_vetadas check ((titulo || ' ' || texto) !~* '(oportunidad|rentabilidad|garantiz|%)');
    insert into rwadar_novedades.anuncios (tipo, clave, estado, titulo, texto, enlace)
    values ('actualizacion', 'actualizacion:filtro-antiguo', 'retenido', 'Mejoras de rendimiento', 'La app va más rápida.', 'https://rwadar.pages.dev/')`);
  const avisosReaplicar = [];
  const eReaplicar = await error(() => db.exec(SQL30, { onNotice: (n) => avisosReaplicar.push(n.message) }));
  if (eReaplicar) await db.exec('rollback');
  await sesion(db);
  const antiguo = await una(db, "select id, titulo from rwadar_novedades.anuncios where clave = 'actualizacion:filtro-antiguo'");
  const filtro = await una(db, `select convalidated v, pg_get_constraintdef(oid) d from pg_constraint
    where conrelid = 'rwadar_novedades.anuncios'::regclass and conname = 'anuncio_sin_palabras_vetadas'`);
  const ePublicar = await codigo(() => db.query('select rwadar_novedades.publicar_anuncio($1)', [antiguo?.id]));
  const vAntiguo = await verificar();
  paso(`reaplicar la 30 con un anuncio antiguo que el filtro nuevo veta: pasa, lo conserva, avisa, y ese anuncio ya no se publica (${ePublicar})`,
    !eReaplicar && antiguo?.titulo === 'Mejoras de rendimiento' && filtro.v === false && /autorizad/.test(filtro.d)
    && avisosReaplicar.some((a) => /anuncios guardados con palabras ahora vetadas/.test(a))
    && ePublicar === '23514' && vAntiguo.ok);
  await db.query('delete from rwadar_novedades.anuncios where id = $1', [antiguo.id]);
  await db.exec(SQL30);
  paso('sin ese anuncio, reaplicar la 30 valida el filtro nuevo',
    (await una(db, `select convalidated v from pg_constraint
      where conrelid = 'rwadar_novedades.anuncios'::regclass and conname = 'anuncio_sin_palabras_vetadas'`)).v === true);

  // Reaplicar la 30 sí apaga la casilla: hay que repetir activar_casilla.
  await sesion(db);
  await db.exec(ACTIVAR_CASILLA);
  await db.exec("update rwadar_novedades.configuracion set ofertas_automaticas = true");
  const preferencias = await numero(db, 'select count(*) from rwadar_novedades.preferencias');
  await db.exec(SQL30);
  const c2 = await config();
  const v2 = await verificar();
  paso('reaplicar la 30 vuelve al estado seguro (todo apagado, casilla y su fecha incluidas, sin reloj de envío, con un reloj de limpieza) sin borrar preferencias',
    !c2.correo_habilitado && !c2.ofertas_automaticas && !c2.casilla_activa && c2.casilla_activada_el === null
    && (await relojes()).length === 0 && await conLimpieza()
    && await numero(db, 'select count(*) from rwadar_novedades.preferencias') === preferencias);
  paso('tras reaplicar la 30, el verificador pasa y pide ejecutar activar_casilla si la web o la app enseñan la casilla',
    v2.ok && AVISO_CASILLA.test(v2.avisoCasilla || ''));

  // Reaplicar la 30 devuelve el correo a Brevo: el verificador 31 lo ve y
  // activar el correo se niega hasta volver a aplicar la 31.
  const v31Tras30 = await verificar31();
  await sesion(db);
  const eSin31 = await error(() => db.exec(ACTIVAR_CORREO));
  if (eSin31) await db.exec('rollback');
  paso(`reaplicar la 30 devuelve las funciones del correo a Brevo: el verificador 31 lo detecta y activar el correo se niega sin la 31 («${eSin31?.message}»)`,
    !v31Tras30.ok && /api\.brevo\.com/.test(v31Tras30.error) && eSin31?.code === '55000'
    && /falta aplicar 31_correo_lettermint\.sql/.test(eSin31.message) && !(await config()).correo_habilitado && (await relojes()).length === 0);
  // Cambiar de proveedor: con el correo encendido con Brevo la 31 se niega;
  // apagado, lo que quedó pedido con el código anterior pasa a «incierto».
  await sesion(db);
  await db.exec("update rwadar_novedades.configuracion set correo_habilitado = true, correo_activado_el = now()");
  const eEncendido = await error(() => db.exec(SQL31));
  if (eEncendido) await db.exec('rollback');
  const conBrevo = (await definicion('rwadar_novedades.enviar_correos(integer)')).includes('api.brevo.com');
  await db.exec("update rwadar_novedades.configuracion set correo_habilitado = false, correo_activado_el = null");
  const { id: anuncioN1 } = await una(db, "select id from rwadar_novedades.anuncios where clave = 'novedad:prueba-n1'");
  // Lo que quedó a medias al reaplicar la 31: la primera vez, con Brevo; o
  // tras fallo_cerrado.sql y reaplicar la 30 con correos de Lettermint en
  // curso. Lo que el proveedor ya aceptó queda «aceptado» con su id; lo demás,
  // «incierto» con un motivo que no da por hecho de qué proveedor vino.
  const anunciosNace = (await filas(db, 'select id from rwadar_novedades.anuncios order by id limit 5')).map((f) => f.id);
  const pedir = async (anuncio, estado, peticion) => (await una(db, `insert into rwadar_novedades.correos (usuario_id, tipo, anuncio_id,
      estado, intentos, idempotencia, idempotencia_el, peticion_id, peticion_el)
    values ($1, 'anuncio', $2, $3, 1, gen_random_uuid(), now(), $4::bigint, case when $4::bigint is null then null else now() end)
    returning id`, [nace.id, anuncio, estado, peticion])).id;
  const pedidos = {
    brevo: await pedir(anunciosNace[0], 'enviando', 999999),
    lettermint: await pedir(anunciosNace[1], 'enviando', 999991),
    sinRespuesta: await pedir(anunciosNace[2], 'enviando', 999992),
    error500: await pedir(anunciosNace[3], 'enviando', 999993),
    pendiente: await pedir(anunciosNace[4], 'pendiente', null),
  };
  await responder(999999, 201, { messageId: '<pedido-con-brevo@ejemplo.test>' });
  await responder(999991, 202, { message_id: 'lm-antes-de-reaplicar', status: 'pending' });
  await responder(999993, 500, { message: 'Server Error' });
  await db.exec(SQL31);
  const tras31 = {};
  for (const [clave, id] of Object.entries(pedidos)) {
    tras31[clave] = await una(db, 'select estado, error, peticion_id, proveedor_mensaje_id from rwadar_novedades.correos where id = $1', [id]);
  }
  const v31De = await verificar31();
  const INCIERTO_31 = 'Entrega incierta: petición previa a la (re)aplicación de la 31; revisar en el panel del proveedor, no reenviar automáticamente';
  paso('con el correo encendido con Brevo la 31 se niega (apagar antes); apagado, se aplica: lo ya aceptado (201 de Brevo, 202 de Lettermint) queda «aceptado» con su id, lo demás «incierto» con un motivo neutro, nada se reenvía y el verificador 31 vuelve a pasar',
    eEncendido?.code === '55000' && /encendido con Brevo/.test(eEncendido.message) && conBrevo && anunciosNace.length === 5
    && tras31.brevo.estado === 'aceptado' && tras31.brevo.proveedor_mensaje_id === '<pedido-con-brevo@ejemplo.test>'
    && tras31.lettermint.estado === 'aceptado' && tras31.lettermint.proveedor_mensaje_id === 'lm-antes-de-reaplicar'
    && [tras31.brevo, tras31.lettermint].every((f) => f.error === null && f.peticion_id === null)
    && [tras31.sinRespuesta, tras31.error500, tras31.pendiente].every((f) => f.estado === 'incierto' && f.error === INCIERTO_31
      && f.peticion_id === null && f.proveedor_mensaje_id === null)
    && v31De.ok);
  await db.query('delete from rwadar_novedades.correos where id = any($1::bigint[])', [Object.values(pedidos)]);
  const { id: enCurso } = await una(db, `insert into rwadar_novedades.correos (usuario_id, tipo, anuncio_id, estado, intentos, idempotencia,
      idempotencia_el, peticion_id, peticion_el) values ($1, 'anuncio', $2, 'enviando', 1, gen_random_uuid(), now(), 999998, now()) returning id`,
    [nace.id, anuncioN1]);
  await db.exec(SQL31);
  const sigue = await una(db, 'select estado, peticion_id from rwadar_novedades.correos where id = $1', [enCurso]);
  await db.query('delete from rwadar_novedades.correos where id = $1', [enCurso]);
  paso('reaplicar la 31 sobre sí misma no toca las colas: un correo en curso con Lettermint sigue «enviando» con su petición',
    sigue.estado === 'enviando' && Number(sigue.peticion_id) === 999998 && (await verificar31()).ok);
  // Reaplicar la 31 devuelve el nombre al pie: encender se niega hasta la 34.
  await sesion(db);
  const eTras31 = await error(() => db.exec(ACTIVAR_CORREO));
  if (eTras31) await db.exec('rollback');
  paso(`tras reaplicar la 31, activar el correo se niega hasta volver a aplicar la 34 («${eTras31?.message}»)`,
    eTras31?.code === '55000' && /falta aplicar 34_pie_sin_nombre\.sql \(o se reaplicó la 31 después/.test(eTras31.message)
    && !(await config()).correo_habilitado);
  await sesion(db);
  await db.exec(SQL34);
  await db.exec(ACTIVAR_PUSH);
  await db.exec(ACTIVAR_CORREO);
  await db.exec(ACTIVAR_CASILLA);
  await db.exec("update rwadar_novedades.configuracion set ofertas_automaticas = true; select cron.schedule('alias-renombrado', '* * * * *', $$ select rwadar_novedades.repartir() $$)");
  const avisosFallo = [];
  await db.exec(FALLO_CERRADO, { onNotice: (n) => avisosFallo.push(n.message) });
  const c3 = await config();
  await como(nace);
  const tras = await codigo(() => db.query('select public.estado_mis_avisos()'));
  await sesion(db, null, 'anon');
  const bajaTras = await codigo(() => db.query('select public.baja_avisos(gen_random_uuid())'));
  paso('fallo_cerrado.sql apaga los tres interruptores y la casilla con su fecha, quita todos los relojes de la 30 (también el de limpieza) y cierra las RPC',
    !c3.correo_habilitado && !c3.push_habilitado && !c3.ofertas_automaticas && !c3.casilla_activa && c3.casilla_activada_el === null
    && (await todosRelojes()).length === 0 && tras === '42501' && bajaTras === '42501');
  paso('y recuerda reaplicar la 30 y, si se enseña la casilla, activar_casilla',
    avisosFallo.some((a) => /reaplica 30_avisos_registrados\.sql y, si la web o la app enseñan la casilla, 30_avisos_registrados_activar_casilla\.sql/.test(a)));

  // Restaurar una copia anterior a la 30 (docs/COPIAS-DE-SEGURIDAD.md): se
  // borra la fila de configuración para cargar y la tabla queda vacía; al
  // reaplicar la 30, su insert ... on conflict recrea la fila apagada.
  await sesion(db);
  await db.exec('delete from rwadar_novedades.configuracion');
  const vacia = await numero(db, 'select count(*) from rwadar_novedades.configuracion');
  await db.exec(SQL30);
  const c4 = await config();
  const v4 = await verificar();
  paso('restauración: con la tabla de configuración vacía, reaplicar la 30 recrea la fila con todo apagado y el reloj de limpieza, y el verificador pasa',
    vacia === 0 && SQL30.includes('on conflict (unica) do update') && c4?.version_consentimiento === VERSION
    && !c4.correo_habilitado && !c4.push_habilitado && !c4.ofertas_automaticas && !c4.casilla_activa
    && (await relojes()).length === 0 && await conLimpieza() && v4.ok && AVISO_CASILLA.test(v4.avisoCasilla || ''));
}

/* =====================================================================
   10 · Correo Lettermint: prueba real y bajas guardadas allí
   ---------------------------------------------------------------------
   Flujo «Correo Lettermint (prueba y bajas)» (.github/workflows/
   correo-lettermint.yml) y sus pasos (rwadar-app/correo-lettermint.sh),
   ejecutados de verdad con bash, jq y dobles de curl y psql que nunca se
   conectan a nada. El SQL que usan (db/31_correo_lettermint_remitente.sql
   y db/31_correo_lettermint_baja.sql) se ejecuta en PGlite con una
   respuesta de ejemplo de la API de Lettermint (GET /v1/suppressions, con
   la forma de su referencia oficial: SuppressedRecipientData y cursor).
   ===================================================================== */
{
  const FLUJO_LM = leer('../.github/workflows/correo-lettermint.yml');
  const SCRIPT_LM = leer('correo-lettermint.sh');
  const SQL_BAJA = leer('db/31_correo_lettermint_baja.sql');
  const SQL_REMITENTE = leer('db/31_correo_lettermint_remitente.sql');
  const RUTA_BAJA = 'rwadar-app/db/31_correo_lettermint_baja.sql';
  const RUTA_REMITENTE = 'rwadar-app/db/31_correo_lettermint_remitente.sql';
  const DB_DOBLE = 'postgresql://doble-local/sin-red';
  // Token de equipo inventado para los dobles (no es de Lettermint ni de nadie).
  const TOKEN_EQUIPO = ['lm', 'equipo', 'ficticio', 'solo', 'para', 'esta', 'prueba'].join('-');
  const hayJq = hayBash && spawnSync('jq', ['--version'], { encoding: 'utf8' }).status === 0;
  const pasoLM = (nombre) => pasoDe(FLUJO_LM, nombre) || '';
  // Sentencias de un archivo de psql, sin comentarios, metacomandos ni bloques $…$.
  const sentenciasPsql = (sql) => sinComentarios(sql).split('\n').filter((l) => !l.startsWith('\\')).join('\n')
    .split(/(\$[a-z_]*\$[\s\S]*?\$[a-z_]*\$)/).filter((_, i) => i % 2 === 0).join(' ')
    .split(';').map((t) => t.trim()).filter(Boolean);
  // Lo que devolvería psql -At con ese archivo y esas variables: el primer
  // valor de la última consulta con columnas. Un error se deshace.
  const ejecutaPsql = async (sql, variables = {}) => {
    await sesion(db);
    try {
      const resultados = await db.exec(conVariablesPsql(sql, variables));
      const ultima = resultados.filter((r) => r.fields?.length).at(-1);
      return ultima?.rows?.length ? Object.values(ultima.rows[0])[0] : undefined;
    } catch (e) {
      await db.exec('rollback');
      throw e;
    }
  };

  // ---------------------------------------------------------- el flujo, leído
  const opcionesLM = FLUJO_LM.match(/ {6}accion:\n(?: {8}.*\n)*? {8}options:\n((?: {10}- .*\n)+)/)?.[1]
    .trim().split('\n').map((l) => l.trim().slice(2));
  const trabajosLM = FLUJO_LM.slice(FLUJO_LM.indexOf('\njobs:\n') + 7).match(/^ {2}[a-z][a-z0-9-]*:$/gm) || [];
  paso('«Correo Lettermint»: solo prueba-correo y sincronizar-bajas, un solo trabajo, y el horario APAGADO salvo con la variable RWADAR_BAJAS_LETTERMINT_DIARIO = si',
    isDeepStrictEqual(opcionesLM, ['prueba-correo', 'sincronizar-bajas']) && trabajosLM.length === 1
    && /^on:\n {2}workflow_dispatch:\n/m.test(FLUJO_LM) && /^ {2}schedule:\n {4}- cron: '23 4 \* \* \*'/m.test(FLUJO_LM)
    && !/^ {2}(push|pull_request|pull_request_target|workflow_run|repository_dispatch|workflow_call):/m.test(FLUJO_LM)
    && /^ {4}if: github\.event_name != 'schedule' \|\| vars\.RWADAR_BAJAS_LETTERMINT_DIARIO == 'si'$/m.test(FLUJO_LM)
    && /^ {6}destinatario:\n {8}description: .*\n {8}required: false\n {8}type: string$/m.test(FLUJO_LM)
    && /^ {6}remitente:\n {8}description: .*\n {8}required: false\n {8}type: string$/m.test(FLUJO_LM));
  const checkoutLM = FLUJO_LM.match(/uses: actions\/checkout@[0-9a-f]{40} # v[0-9.]+/)?.[0];
  paso('permisos solo de lectura, cola propia (no la de «Aplicar catálogo»: el horario nunca cancela un catálogo en espera), solo desde main y el mismo checkout fijado que «Avisos a registrados (base)»',
    /^permissions:\n {2}contents: read$/m.test(FLUJO_LM) && (FLUJO_LM.match(/permissions:/g) || []).length === 1
    && !/write/.test(FLUJO_LM.replace(/^\s*#.*$/gm, ''))
    && /^concurrency:\n {2}group: rwadar-correo-lettermint\n {2}cancel-in-progress: false$/m.test(FLUJO_LM)
    && !FLUJO_LM.includes('rwadar-aplicar-catalogo')
    && /if: github\.ref != 'refs\/heads\/main'/.test(pasoLM('Solo desde main'))
    && !!checkoutLM && BASE.includes(checkoutLM) && /persist-credentials: false/.test(pasoLM('Descargar el código')));
  const pasosConSecreto = (secreto) => FLUJO_LM.split('\n      - name: ').slice(1)
    .filter((p) => p.includes(`\${{ secrets.${secreto} }}`)).map((p) => p.split('\n')[0]);
  paso('cada secreto llega por env: solo al paso que lo usa: LETTERMINT_API_TOKEN al envío, LETTERMINT_TEAM_TOKEN a la lista de bajas y SUPABASE_DB_URL a leer el remitente y a aplicar las bajas',
    isDeepStrictEqual(pasosConSecreto('LETTERMINT_API_TOKEN'), ['Enviar los dos correos de prueba'])
    && isDeepStrictEqual(pasosConSecreto('LETTERMINT_TEAM_TOKEN'), ['Pedir a Lettermint sus bajas (solo lee)'])
    && isDeepStrictEqual(pasosConSecreto('SUPABASE_DB_URL'), ['Leer el remitente de Vault (solo lee)', 'Aplicar las bajas en RWAdar'])
    && (FLUJO_LM.match(/\$\{\{ secrets\./g) || []).length === 4
    && pasoLM('Enviar los dos correos de prueba').includes('LETTERMINT_API_TOKEN: ${{ secrets.LETTERMINT_API_TOKEN }}'));
  const ORDENES_LM = [['Comprobar la acción', 'comprobar'], ['Comprobar que la API REST de Supabase no expone net ni vault', 'rest-cerrada'],
    ['Pedir a Lettermint sus bajas (solo lee)', 'listar-bajas'], ['Leer el remitente de Vault (solo lee)', 'remitente'],
    ['Enviar los dos correos de prueba', 'enviar-prueba'], ['Aplicar las bajas en RWAdar', 'aplicar-bajas'],
    ['Borrar la lista temporal de bajas', 'limpiar']];
  const CONDICIONES_LM = [
    ['Comprobar que la API REST de Supabase no expone net ni vault', "env.ACCION == 'prueba-correo'"],
    ['Pedir a Lettermint sus bajas (solo lee)', "env.ACCION == 'sincronizar-bajas'"],
    ['Instalar psql 17 (misma versión que Supabase)',
      "(env.ACCION == 'prueba-correo' && env.REMITENTE == '') || (env.ACCION == 'sincronizar-bajas' && env.BAJAS_LETTERMINT != '0')"],
    ['Leer el remitente de Vault (solo lee)', "env.ACCION == 'prueba-correo' && env.REMITENTE == ''"],
    ['Enviar los dos correos de prueba', "env.ACCION == 'prueba-correo'"],
    ['Aplicar las bajas en RWAdar', "env.ACCION == 'sincronizar-bajas' && env.BAJAS_LETTERMINT != '0'"],
    ['Borrar la lista temporal de bajas', "always() && env.BAJAS_ARCHIVO != ''"]];
  paso('cada paso llama a rwadar-app/correo-lettermint.sh con su orden y su condición: psql solo se instala si hace falta (remitente de Vault o alguna baja que aplicar) y la lista temporal se borra siempre',
    ORDENES_LM.every(([n, o]) => pasoLM(n).split('\n').includes(`        run: bash rwadar-app/correo-lettermint.sh ${o}`))
    && CONDICIONES_LM.every(([n, c]) => pasoLM(n).split('\n').includes(`        if: ${c}`))
    && pasoLM('Comprobar la acción').includes("ACCION: ${{ github.event_name == 'schedule' && 'sincronizar-bajas' || inputs.accion }}")
    && pasoLM('Comprobar la acción').includes('EVENTO: ${{ github.event_name }}')
    && /apt-get install -y -qq postgresql-client-17/.test(pasoLM('Instalar psql 17 (misma versión que Supabase)')));
  const runsLM = [...FLUJO_LM.matchAll(/^ {8}run: (.*)$/gm)].map((m) => m[1])
    .concat([...FLUJO_LM.matchAll(/^( +)run: \|\n((?:\1 {2}.*\n|\s*\n)*)/gm)].map((m) => m[2]));
  paso('nunca ${{ … }} dentro de run:, ni set -x; los dos tokens van a curl por la entrada estándar (-H @-) y ningún echo/printf enseña un token, la base o un correo de la lista',
    runsLM.length >= 9 && runsLM.every((r) => !r.includes('${{'))
    && !/set -[a-z]*x|set -o xtrace/.test(FLUJO_LM + SCRIPT_LM)
    && !/(echo|printf)[^\n]*\$\{?(token|LETTERMINT_[A-Z_]*TOKEN|SUPABASE_DB_URL|correo|fecha|r)\b/.test(SCRIPT_LM)
    && SCRIPT_LM.includes('<<< "x-lettermint-token: $token"') && SCRIPT_LM.includes('<<< "Authorization: Bearer $token")')
    && (SCRIPT_LM.match(/ -H @- /g) || []).length === 2 && !/-H "?(x-lettermint-token|Authorization)/.test(SCRIPT_LM));
  const conVariablesLM = sentenciasPsql(SQL_BAJA).filter((t) => /:'[a-z_]+'/.test(t));
  paso('aplicar-bajas pasa cada correo y su fecha a psql como variables (-v), con la entrada estándar cerrada; el SQL solo los usa como literales en un único SELECT (nunca en una DDL, que Supabase registra con su texto)',
    SCRIPT_LM.includes('-v correo="$correo" -v suprimido_el="$fecha" \\\n      -f "$D/31_correo_lettermint_baja.sql" < /dev/null)"')
    && isDeepStrictEqual([...new Set([...sinComentarios(SQL_BAJA).matchAll(/:'([a-z_]+)'/g)].map((m) => m[1]))], ['correo', 'suprimido_el'])
    && conVariablesLM.length === 1 && /^with entrada as \(/.test(conVariablesLM[0])
    && !/\b(create|alter|insert|update|delete|copy|do|grant|comment|drop)\b/i.test(conVariablesLM[0])
    && /rwadar_novedades\.baja_por_correo\(correo\)/.test(conVariablesLM[0])
    && /^\\set ON_ERROR_STOP on$/m.test(SQL_BAJA) && /^\\set VERBOSITY terse$/m.test(SQL_BAJA));
  const remitenteSql = sinComentarios(SQL_REMITENTE);
  paso('el remitente se lee de Vault en una transacción de solo lectura que se deshace: sin variables, sin el token y sin escribir nada',
    /^begin transaction read only;$/m.test(remitenteSql) && remitenteSql.trimEnd().endsWith('rollback;')
    && !/\b(insert|update|delete|create|alter|drop|grant|commit|set_config)\b/i.test(remitenteSql)
    && !/:'/.test(remitenteSql) && !remitenteSql.includes('LETTERMINT_API_TOKEN')
    && /where s\.name = 'RWADAR_REMITENTE'/.test(remitenteSql)
    && SCRIPT_LM.includes('-f "$D/31_correo_lettermint_remitente.sql" < /dev/null)"'));

  // ---------------------------------------------------------- el SQL, en PGlite
  // Remitente, sobre el doble de Vault.
  await sesion(db);
  const remitentesAntes = await filas(db, "select decrypted_secret v from vault.decrypted_secrets where name = 'RWADAR_REMITENTE'");
  await db.exec("delete from vault.decrypted_secrets where name = 'RWADAR_REMITENTE'");
  const remitenteNinguno = await ejecutaPsql(SQL_REMITENTE);
  await db.exec("insert into vault.decrypted_secrets(name, decrypted_secret) values ('RWADAR_REMITENTE', '  avisos@rwadar.example ')");
  const remitenteVault = await ejecutaPsql(SQL_REMITENTE);
  paso('31_correo_lettermint_remitente.sql, en PGlite: devuelve RWADAR_REMITENTE sin espacios, o nada si no está en Vault',
    remitenteNinguno === null && remitenteVault === 'avisos@rwadar.example');

  // Respuesta de ejemplo de GET /v1/suppressions?filter[reason]=unsubscribe&filter[scope]=route
  // (dos páginas). Solo cuentan las bajas de una ruta de difusión: ámbito
  // «route» y categoría «broadcast». La de la ruta de servicio (categoría
  // «all») y la de un dominio entero no se tocan.
  const supresion = (id, value, created_at, extra = {}) => ({ id, type: 'email', value, reason: 'unsubscribe', scope: 'route',
    applies_to: 'broadcast', project_id: 'proyecto-rwadar', route_id: 'ruta-difusion',
    source_message: { id: `mensaje-${id}`, available: true, subject: 'Novedad en RWAdar', created_at }, created_at, ...extra });
  const paginador = (data, next_cursor) => ({ data, path: 'https://api.lettermint.co/v1/suppressions', per_page: 100, next_cursor,
    next_page_url: next_cursor ? `https://api.lettermint.co/v1/suppressions?page%5Bcursor%5D=${encodeURIComponent(next_cursor)}` : null,
    prev_cursor: null, prev_page_url: null });
  const CURSOR_LM = 'eyJpZCI6IjlmMWItNSJ9+/=';
  const PAGINAS_LM = [
    paginador([
      supresion('s1', 'Apuntada@Bajas.Test', '2026-11-07T08:00:00.000000Z'),
      supresion('s2', 'ya.de.baja@bajas.test', '2026-11-05T12:00:00.000000Z'),
      supresion('s3', 'reapuntada@bajas.test', '2026-11-03T10:00:00.000000Z'),
      supresion('s4', 'servicio@bajas.test', '2026-11-06T10:00:00.000000Z', { applies_to: 'all', route_id: 'ruta-servicio' }),
      supresion('s5', 'bajas.test', '2026-11-06T11:00:00.000000Z', { type: 'domain' }),
    ], CURSOR_LM),
    paginador([
      supresion('s6', 'nadie@bajas.test', '2026-11-06T09:00:00.000000Z'),
      supresion('s7', 'sin.confirmar@bajas.test', '2026-11-06T09:30:00Z'),
      supresion('s8', 'apuntada@bajas.test', '2026-11-07T08:00:00.000000Z'),
    ], null),
  ];
  // Lo que debe quedar de la lista: en minúsculas, sin repetidas y en orden.
  const bajasEsperadas = [...new Set(PAGINAS_LM.flatMap((p) => p.data)
    .filter((s) => s.type === 'email' && s.reason === 'unsubscribe' && s.scope === 'route' && s.applies_to === 'broadcast')
    .map((s) => `${s.value.toLowerCase()}\t${s.created_at}`))].sort();
  // Cuentas de RWAdar de esas direcciones, cada una en un estado.
  const cuentaLM = async (email, prefs) => {
    const u = await altaAuth(email, {}, true);
    await sesion(db);
    await db.query(`insert into rwadar_novedades.preferencias (usuario_id, novedades, aceptado_el, version, origen, canal, baja_el)
        values ($1, $2, $3, $4, $5, 'web', $6)
        on conflict (usuario_id) do update set novedades = excluded.novedades, aceptado_el = excluded.aceptado_el,
          version = excluded.version, origen = excluded.origen, canal = excluded.canal, baja_el = excluded.baja_el`,
    [u.id, prefs.novedades, prefs.aceptado_el ?? null, prefs.novedades ? VERSION : null, prefs.novedades ? 'perfil' : null, prefs.baja_el ?? null]);
    return u;
  };
  const lmApuntada = await cuentaLM('Apuntada@Bajas.test', { novedades: true, aceptado_el: '2026-11-01T10:00:00Z' });
  const lmYaDeBaja = await cuentaLM('ya.de.baja@bajas.test', { novedades: false, baja_el: '2026-11-05T10:00:00Z' });
  const lmReapuntada = await cuentaLM('reapuntada@bajas.test', { novedades: true, aceptado_el: '2026-11-04T10:00:00Z' });
  const lmSinConfirmar = await altaAuth('sin.confirmar@bajas.test', {});
  const historialLM = async () => (await sesion(db), numero(db, "select count(*) from rwadar_novedades.historial_permiso where correo ilike '%@bajas.test'"));
  const historialAntes = await historialLM();
  const sinPreferencias = (await pref(lmSinConfirmar)) === undefined;
  const aplicarEnPglite = async () => {
    const r = [];
    for (const linea of bajasEsperadas) {
      const [correo, suprimido_el] = linea.split('\t');
      r.push(await ejecutaPsql(SQL_BAJA, { correo, suprimido_el }));
    }
    return r;
  };
  const resultadosLM = await aplicarEnPglite();
  const [pApuntada, pYaDeBaja, pReapuntada, pSinConfirmar] = [await pref(lmApuntada), await pref(lmYaDeBaja),
    await pref(lmReapuntada), await pref(lmSinConfirmar)];
  const hApuntada = await historial(lmApuntada);
  paso('31_correo_lettermint_baja.sql, en PGlite, con la respuesta de ejemplo: aplica la baja a quien seguía apuntado con un permiso anterior (sin distinguir mayúsculas) y a quien aún no tenía preferencias; no toca a quien ya estaba de baja ni a quien se volvió a apuntar después; «sin_cuenta» si no hay cuenta',
    bajasEsperadas.length === 5 && sinPreferencias
    && isDeepStrictEqual(resultadosLM, ['aplicada', 'sin_cuenta', 'reapuntada', 'aplicada', 'ya_de_baja'])
    && pApuntada.novedades === false && pApuntada.baja_el instanceof Date
    && isDeepStrictEqual([hApuntada.at(-1)?.accion, hApuntada.at(-1)?.origen, hApuntada.at(-1)?.version], ['baja', 'correo', VERSION])
    && pSinConfirmar?.novedades === false && pSinConfirmar.baja_el instanceof Date
    && isDeepStrictEqual((await historial(lmSinConfirmar)).map((f) => [f.accion, f.origen, f.version]), [['baja', 'correo', null]])
    && pReapuntada.novedades === true && pReapuntada.aceptado_el.toISOString() === '2026-11-04T10:00:00.000Z' && pReapuntada.baja_el === null
    && pYaDeBaja.novedades === false && pYaDeBaja.baja_el.toISOString() === '2026-11-05T10:00:00.000Z'
    && (await historial(lmYaDeBaja)).length === 0 && await historialLM() === historialAntes + 2);
  const bajaElAntes = pApuntada.baja_el.toISOString();
  const resultadosOtraVez = await aplicarEnPglite();
  paso('repetir la sincronización no cambia nada: las ya aplicadas salen «ya_de_baja», sin filas nuevas en el historial ni otra fecha de baja',
    isDeepStrictEqual(resultadosOtraVez, ['ya_de_baja', 'sin_cuenta', 'reapuntada', 'ya_de_baja', 'ya_de_baja'])
    && await historialLM() === historialAntes + 2 && (await pref(lmApuntada)).baja_el.toISOString() === bajaElAntes);
  const usuariosAntes = await numero(db, 'select count(*) from auth.users');
  const inyeccion = await ejecutaPsql(SQL_BAJA, { correo: "x'); delete from auth.users; --@bajas.test", suprimido_el: '2026-11-07T08:00:00Z' });
  const fechaMala = await error(() => ejecutaPsql(SQL_BAJA, { correo: 'apuntada@bajas.test', suprimido_el: 'ayer' }));
  paso('el correo va como literal (una comilla no rompe nada: «sin_cuenta») y una fecha sin forma hace fallar la consulta sin tocar nada',
    inyeccion === 'sin_cuenta' && await numero(db, 'select count(*) from auth.users') === usuariosAntes
    && fechaMala?.code === '22007' && await historialLM() === historialAntes + 2);

  // ---------------------------------------------------------- los pasos, ejecutados
  if (hayJq) {
    // Dobles: guardan los argumentos, la entrada estándar y el cuerpo de cada
    // llamada, y contestan lo preparado para esa llamada. El de psql lee la
    // entrada estándar, como haría uno de verdad que la esperase: si el paso
    // no la cerrara (< /dev/null), se comería la lista de bajas.
    const CURL_DOBLE = `#!/usr/bin/env bash
set -euo pipefail
d="$LM_DOBLE_DIR"
n=$(cat "$d/curl-contador" 2>/dev/null || echo 0); echo $((n + 1)) > "$d/curl-contador"
printf '%s\\0' "$@" > "$d/curl-$n.argv"
salida=/dev/null; formato=""; leer=no
while [ $# -gt 0 ]; do
  case "$1" in
    -o) salida="$2"; shift ;;
    -w) formato="$2"; shift ;;
    --data-binary) cp "\${2#@}" "$d/curl-$n.data"; shift ;;
    -H) if [ "$2" = @- ]; then leer=si; fi; shift ;;
  esac
  shift
done
if [ "$leer" = si ]; then cat > "$d/curl-$n.stdin"; else cat > /dev/null; fi
codigo=$(cat "$d/respuesta-$n.code" 2>/dev/null || echo 000)
if [ -f "$d/respuesta-$n.body" ]; then cp "$d/respuesta-$n.body" "$salida"; else : > "$salida"; fi
if [ "$formato" = '%{http_code}' ]; then printf '%s' "$codigo"; fi
if [ "$codigo" = 000 ]; then exit 7; fi
`;
    const PSQL_DOBLE_LM = `#!/usr/bin/env bash
set -euo pipefail
d="$LM_DOBLE_DIR"
n=$(cat "$d/psql-contador" 2>/dev/null || echo 0); echo $((n + 1)) > "$d/psql-contador"
printf '%s\\0' "$@" > "$d/psql-$n.argv"
while [ $# -gt 0 ]; do if [ "$1" = -f ]; then cp "$2" "$d/psql-$n.sql"; fi; shift; done
cat > /dev/null
if [ -f "$d/psql-falla-$n" ]; then exit 2; fi
cat "$d/psql-respuesta-$n" 2>/dev/null || true
`;
    const correLM = (orden, entorno = {}, { curl = [], psql = [], psqlFalla = [] } = {}) => {
      const dir = fs.mkdtempSync(path.join(temporal, 'lm-'));
      fs.writeFileSync(path.join(dir, 'curl'), CURL_DOBLE, { mode: 0o755 });
      fs.writeFileSync(path.join(dir, 'psql'), PSQL_DOBLE_LM, { mode: 0o755 });
      curl.forEach(([codigo, cuerpo], i) => {
        fs.writeFileSync(path.join(dir, `respuesta-${i}.code`), String(codigo));
        fs.writeFileSync(path.join(dir, `respuesta-${i}.body`), typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo));
      });
      psql.forEach((texto, i) => fs.writeFileSync(path.join(dir, `psql-respuesta-${i}`), texto));
      psqlFalla.forEach((i) => fs.writeFileSync(path.join(dir, `psql-falla-${i}`), ''));
      const githubEnv = path.join(dir, 'github-env');
      const resumen = path.join(dir, 'resumen.md');
      fs.writeFileSync(githubEnv, '');
      const r = spawnSync('bash', ['rwadar-app/correo-lettermint.sh', orden], { cwd: path.join(raiz, '..'), encoding: 'utf8',
        env: { PATH: `${dir}:${process.env.PATH}`, LM_DOBLE_DIR: dir, GITHUB_ENV: githubEnv, GITHUB_STEP_SUMMARY: resumen,
          RUNNER_TEMP: dir, ...entorno } });
      const leerSi = (f) => (fs.existsSync(path.join(dir, f)) ? fs.readFileSync(path.join(dir, f), 'utf8') : null);
      const llamadas = (prefijo) => fs.readdirSync(dir).filter((f) => f.startsWith(`${prefijo}-`) && f.endsWith('.argv'))
        .map((f) => Number(f.slice(prefijo.length + 1, -5))).sort((a, b) => a - b)
        .map((n) => ({ argv: leerSi(`${prefijo}-${n}.argv`).split('\0').slice(0, -1), stdin: leerSi(`${prefijo}-${n}.stdin`),
          data: leerSi(`${prefijo}-${n}.data`), sql: leerSi(`${prefijo}-${n}.sql`) }));
      const salida = Object.fromEntries(fs.readFileSync(githubEnv, 'utf8').split('\n').filter(Boolean)
        .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
      return { estado: r.status, texto: `${r.stdout}${r.stderr}`, curl: llamadas('curl'), psql: llamadas('psql'), salida, dir,
        resumen: leerSi('resumen.md') || '' };
    };

    // Comprobar la acción.
    const comprobarLM = (e) => correLM('comprobar', { ACCION: '', CONFIRMAR: '', DESTINATARIO: '', REMITENTE: '', EVENTO: 'workflow_dispatch', ...e });
    const buenosLM = [
      [{ ACCION: 'prueba-correo', CONFIRMAR: 'AVISOS', DESTINATARIO: 'victor@ejemplo.test' },
        { ACCION: 'prueba-correo', DESTINATARIO: 'victor@ejemplo.test', REMITENTE: '' }],
      [{ ACCION: 'prueba-correo', CONFIRMAR: 'AVISOS', DESTINATARIO: 'victor@ejemplo.test', REMITENTE: 'avisos@rwadar.example' },
        { ACCION: 'prueba-correo', DESTINATARIO: 'victor@ejemplo.test', REMITENTE: 'avisos@rwadar.example' }],
      [{ ACCION: 'sincronizar-bajas', CONFIRMAR: 'AVISOS' }, { ACCION: 'sincronizar-bajas' }],
      [{ ACCION: 'sincronizar-bajas', EVENTO: 'schedule' }, { ACCION: 'sincronizar-bajas' }],
    ];
    const malosLM = [{ ACCION: 'prueba-correo', DESTINATARIO: 'victor@ejemplo.test' },
      { ACCION: 'prueba-correo', CONFIRMAR: 'avisos', DESTINATARIO: 'victor@ejemplo.test' },
      { ACCION: 'prueba-correo', CONFIRMAR: 'AVISOS' },
      { ACCION: 'prueba-correo', CONFIRMAR: 'AVISOS', DESTINATARIO: 'Víctor <victor@ejemplo.test>' },
      { ACCION: 'prueba-correo', CONFIRMAR: 'AVISOS', DESTINATARIO: 'victor@localhost' },
      { ACCION: 'prueba-correo', CONFIRMAR: 'AVISOS', DESTINATARIO: 'victor@ejemplo.test\nBcc: otro@ejemplo.test' },
      { ACCION: 'prueba-correo', CONFIRMAR: 'AVISOS', DESTINATARIO: 'victor@ejemplo.test', REMITENTE: 'avisos@rwadar.example\nX: y' },
      { ACCION: 'prueba-correo', CONFIRMAR: 'AVISOS', DESTINATARIO: `${'a'.repeat(250)}@ejemplo.test` },
      { ACCION: 'sincronizar-bajas' }, { ACCION: 'sincronizar-bajas', CONFIRMAR: 'avisos' },
      { ACCION: 'prueba-correo', EVENTO: 'schedule', DESTINATARIO: 'victor@ejemplo.test' }, { ACCION: '', EVENTO: 'schedule' },
      { ACCION: 'borrar-bajas', CONFIRMAR: 'AVISOS' }];
    paso(`«Comprobar la acción» acepta ${buenosLM.length} entradas buenas (el horario sin AVISOS, solo para sincronizar-bajas) y deja en GITHUB_ENV solo lo necesario`,
      buenosLM.every(([e, esperado]) => { const v = comprobarLM(e); return v.estado === 0 && isDeepStrictEqual(v.salida, esperado); }));
    paso(`y rechaza ${malosLM.length} malas (sin AVISOS, destinatario vacío, con nombre, sin dominio, con saltos de línea o demasiado largo, prueba-correo por horario, acción desconocida) sin dejar nada en GITHUB_ENV`,
      malosLM.every((e) => { const v = comprobarLM(e); return v.estado !== 0 && Object.keys(v.salida).length === 0; }));

    // API REST cerrada para net y vault.
    const PGRST106 = (s) => ({ code: 'PGRST106', details: null, hint: null, message: `Invalid schema: ${s}` });
    const cabecerasH = (l) => l.argv.filter((_, i) => l.argv[i - 1] === '-H');
    // La dirección pública de la web, leída de donde la lee el paso (aquí no
    // se escribe: probar-app-movil-estatico.mjs lo prohíbe en los probar-*).
    const URL_WEB = leer('../rwadar-acceso/compilar.cjs').match(/^ *SUPABASE_URL: '([^']*)',$/m)?.[1] || 'sin-direccion';
    const rest = correLM('rest-cerrada', {}, { curl: [[406, PGRST106('net')], [406, PGRST106('vault')]] });
    /* Se pide una tabla de cada esquema (contrato, AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md):
       desde el 08/04/2026 Supabase cierra la raíz /rest/v1/ a las claves no secretas
       antes de PostgREST, y allí nunca volvería PGRST106 (supabase.com/changelog/42949). */
    const TABLAS_REST = { net: 'http_request_queue', vault: 'decrypted_secrets' };
    paso('rest-cerrada pide net.http_request_queue y vault.decrypted_secrets (nunca la raíz /rest/v1/) con su Accept-Profile y la clave publicable de la web (solo https), acepta PGRST106 y no enseña la clave',
      rest.estado === 0 && rest.curl.length === 2 && /^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(URL_WEB)
      && rest.curl.every((l, i) => l.argv.at(-1) === `${URL_WEB}/rest/v1/${TABLAS_REST[['net', 'vault'][i]]}`
        && cabecerasH(l).includes(`Accept-Profile: ${['net', 'vault'][i]}`)
        && cabecerasH(l).some((h) => /^apikey: sb_publishable_[A-Za-z0-9_-]+$/.test(h)) && l.argv.includes('=https'))
      && /net \(http_request_queue\): no se expone \(HTTP 406, PGRST106\)/.test(rest.texto)
      && /vault \(decrypted_secrets\): no se expone \(HTTP 406, PGRST106\)/.test(rest.texto)
      && !`${rest.texto}${rest.resumen}`.includes('sb_publishable_'));
    const expuesto = correLM('rest-cerrada', {}, { curl: [[406, PGRST106('net')], [200, []]] });
    const sinTabla = correLM('rest-cerrada', {}, { curl: [[404, { code: 'PGRST205', message: 'Could not find the table' }]] });
    const claveMala = correLM('rest-cerrada', {}, { curl: [[401, { message: 'Invalid API key' }]] });
    // Lo que contesta hoy la raíz /rest/v1/ a una clave publicable: sin código de PostgREST.
    const pasarela = correLM('rest-cerrada', {}, { curl: [[403, { message: 'Access to schema is forbidden',
      hint: 'Accessing the schema via the Data API is only allowed using a secret API key.' }]] });
    const jwtMalo = correLM('rest-cerrada', {}, { curl: [[401, { code: 'PGRST301', message: 'JWSError' }]] });
    const sinRedRest = correLM('rest-cerrada');
    paso('y para con «no se manda nada» si vault responde 200 o net responde como esquema expuesto (PGRST205), si la clave no vale (401), si la pasarela corta antes (403 sin código) o si no hay red',
      [expuesto, sinTabla, claveMala, pasarela, jwtMalo, sinRedRest].every((r) => r.estado !== 0 && /No se manda nada/.test(r.texto))
      && /NO rechaza el esquema «vault» \(HTTP 200/.test(expuesto.texto) && /NO rechaza el esquema «net» \(HTTP 404, código «PGRST205»/.test(sinTabla.texto)
      && /no se sabe si el esquema «net» está expuesto o no/.test(claveMala.texto) && /HTTP 401, código «ninguno»: «Invalid API key»/.test(claveMala.texto)
      && /HTTP 403, código «ninguno»: «Access to schema is forbidden»/.test(pasarela.texto) && /no se sabe si el esquema/.test(pasarela.texto)
      && /HTTP 401, código «PGRST301»/.test(jwtMalo.texto) && /no se sabe si el esquema/.test(jwtMalo.texto)
      && [claveMala, pasarela, jwtMalo].every((r) => !/NO rechaza/.test(r.texto))
      && /net\.http_request_queue \(HTTP 000/.test(sinRedRest.texto));

    // Remitente de Vault: el doble de psql contesta lo que devolvió PGlite.
    const remPsql = correLM('remitente', { SUPABASE_DB_URL: DB_DOBLE }, { psql: [`${remitenteVault}\n`] });
    const remVacio = correLM('remitente', { SUPABASE_DB_URL: DB_DOBLE }, { psql: ['\n'] });
    paso('el paso «Leer el remitente» llama a psql -X -q -At con ese SQL y deja en GITHUB_ENV lo que devuelve PGlite; sin remitente válido en Vault, para y dice qué hacer',
      remPsql.estado === 0 && isDeepStrictEqual(remPsql.salida, { REMITENTE: 'avisos@rwadar.example' }) && remPsql.psql.length === 1
      && isDeepStrictEqual(remPsql.psql[0].argv, [DB_DOBLE, '-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1', '-f', RUTA_REMITENTE])
      && remPsql.psql[0].sql === SQL_REMITENTE
      && remVacio.estado !== 0 && /guardar-correo/.test(remVacio.texto) && Object.keys(remVacio.salida).length === 0);

    // Los dos correos de prueba.
    const ENTORNO_ENVIO = { LETTERMINT_API_TOKEN: TOKEN_LM, DESTINATARIO: 'victor@ejemplo.test', REMITENTE: 'avisos@rwadar.example' };
    const envio = correLM('enviar-prueba', ENTORNO_ENVIO, { curl: [[202, { message_id: 'msg-servicio-0001', status: 'pending' }],
      [202, { message_id: 'msg-difusion-0002', status: 'pending' }]] });
    const cuerpos = envio.curl.map((l) => JSON.parse(l.data || 'null'));
    const cabecerasStdin = envio.curl.map((l) => (l.stdin || '').split('\n').filter(Boolean));
    const claves = cabecerasStdin.map((c) => c.find((h) => h.startsWith('Idempotency-Key: '))?.slice(17));
    paso('enviar-prueba hace dos POST a https://api.lettermint.co/v1/send con el token y una clave idempotente distinta en cada uno por la entrada estándar (nunca en la línea de órdenes) y enseña HTTP 202 y el message_id de cada uno',
      envio.estado === 0 && envio.curl.length === 2
      && envio.curl.every((l) => l.argv.at(-1) === 'https://api.lettermint.co/v1/send' && l.argv.includes('POST')
        && l.argv.includes('@-') && !l.argv.join(' ').includes(TOKEN_LM))
      && cabecerasStdin.every((c) => c.length === 2 && c[0] === `x-lettermint-token: ${TOKEN_LM}`)
      && claves.every((k) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(k || '')) && claves[0] !== claves[1]
      && /ruta de servicio \(la de por defecto\): HTTP 202 · message_id msg-servicio-0001 · estado pending/.test(envio.texto)
      && /ruta de difusión \(broadcast\): HTTP 202 · message_id msg-difusion-0002 · estado pending/.test(envio.texto)
      && !`${envio.texto}${envio.resumen}`.includes(TOKEN_LM) && envio.resumen.includes('| broadcast | 202 | msg-difusion-0002 | pending |'));
    paso('los dos correos: «RWAdar <remitente>», al destinatario, reply_to rwadares@gmail.com, sin seguimiento (track_opens y track_clicks en false), List-Unsubscribe con el mailto de baja, enlace sin imágenes y en el pie el titular sin su nombre, la dirección postal y el aviso legal; route "broadcast" solo en el segundo',
      cuerpos.every((c) => c && c.from === 'RWAdar <avisos@rwadar.example>' && isDeepStrictEqual(c.to, ['victor@ejemplo.test'])
        && isDeepStrictEqual(c.reply_to, ['rwadares@gmail.com']) && isDeepStrictEqual(c.settings, { track_opens: false, track_clicks: false })
        && isDeepStrictEqual(c.headers, { 'List-Unsubscribe': `<${MAILTO_BAJA}>` }) && !('tag' in c) && !('metadata' in c)
        && !/<img|<script|utm_|pixel/i.test(c.html) && c.html.includes('href="https://rwadar.pages.dev/"')
        && c.text.includes('https://rwadar.pages.dev/') && c.text.includes('tokenización')
        && [c.text, c.html].every((t) => t.includes('Responsable: el titular de RWAdar, Plaza Generalitat, s/n, 46600 Alzira (Valencia), España')
          && t.includes('https://rwadar.pages.dev/privacidad#aviso-legal') && !/Jorques|Víctor Manuel/i.test(t)))
      && !('route' in (cuerpos[0] || {})) && cuerpos[1]?.route === 'broadcast'
      && /ruta de servicio/.test(cuerpos[0]?.subject) && /ruta de difusión/.test(cuerpos[1]?.subject));
    const sinToken = correLM('enviar-prueba', { ...ENTORNO_ENVIO, LETTERMINT_API_TOKEN: '' });
    const tokenRaro = correLM('enviar-prueba', { ...ENTORNO_ENVIO, LETTERMINT_API_TOKEN: 'corto' });
    const rutaMala = correLM('enviar-prueba', ENTORNO_ENVIO, { curl: [[202, { message_id: 'msg-servicio-0003', status: 'pending' }],
      [422, { message: `The selected route is invalid. ${TOKEN_LM}` }]] });
    paso('sin el secreto (o con uno sin forma de token) para claro sin llamar a Lettermint; si la ruta de difusión no existe (422), enseña los dos resultados, sugiere mirar su slug, tapa el token y falla',
      sinToken.estado !== 0 && /Falta el secreto de GitHub LETTERMINT_API_TOKEN/.test(sinToken.texto) && sinToken.curl.length === 0
      && tokenRaro.estado !== 0 && /no tiene forma de token/.test(tokenRaro.texto) && tokenRaro.curl.length === 0
      && rutaMala.estado !== 0 && rutaMala.curl.length === 2 && /HTTP 202 · message_id msg-servicio-0003/.test(rutaMala.texto)
      && /ruta de difusión \(broadcast\): HTTP 422/.test(rutaMala.texto) && /slug/.test(rutaMala.texto)
      && /1 de 2 correos no fueron aceptados/.test(rutaMala.texto) && !rutaMala.texto.includes(TOKEN_LM) && rutaMala.texto.includes('[token]'));

    // Bajas: lista de Lettermint.
    const URL_BAJAS = 'https://api.lettermint.co/v1/suppressions?filter%5Breason%5D=unsubscribe&filter%5Bscope%5D=route&page%5Bsize%5D=100';
    const listarLM = (curl, extra = {}) => correLM('listar-bajas', { LETTERMINT_TEAM_TOKEN: TOKEN_EQUIPO, ...extra }, { curl });
    const CORREOS_LM = ['apuntada@', 'ya.de.baja@', 'reapuntada@', 'nadie@', 'sin.confirmar@', 'servicio@', 'bajas.test'];
    const sinCorreos = (r) => CORREOS_LM.every((c) => !`${r.texto}${r.resumen}`.toLowerCase().includes(c));
    const leerLista = (r) => (r.salida.BAJAS_ARCHIVO && fs.existsSync(r.salida.BAJAS_ARCHIVO) ? fs.readFileSync(r.salida.BAJAS_ARCHIVO, 'utf8') : '');
    const lista = listarLM([[200, PAGINAS_LM[0]], [200, PAGINAS_LM[1]]]);
    const tsv = leerLista(lista);
    paso('listar-bajas pide GET /v1/suppressions con los filtros de «unsubscribe» y ámbito de ruta, 100 por página, el token de equipo por la entrada estándar y el cursor de la página siguiente codificado',
      lista.estado === 0 && lista.curl.length === 2 && lista.curl[0].argv.at(-1) === URL_BAJAS
      && lista.curl[1].argv.at(-1) === `${URL_BAJAS}&page%5Bcursor%5D=${encodeURIComponent(CURSOR_LM)}`
      && lista.curl.every((l) => isDeepStrictEqual((l.stdin || '').split('\n').filter(Boolean), [`Authorization: Bearer ${TOKEN_EQUIPO}`])
        && !l.argv.join(' ').includes(TOKEN_EQUIPO) && l.argv.includes('--globoff') && l.argv.includes('=https')));
    paso('se queda solo con las bajas de rutas de difusión (ni la de la ruta de servicio ni la de un dominio), en minúsculas y sin repetidas, en un archivo temporal, y solo enseña recuentos: ningún correo en el registro',
      tsv === bajasEsperadas.map((l) => `${l}\n`).join('')
      && isDeepStrictEqual({ ...lista.salida, BAJAS_ARCHIVO: '-' }, { BAJAS_ARCHIVO: '-', BAJAS_LETTERMINT: '5', BAJAS_RARAS: '0' })
      && path.dirname(lista.salida.BAJAS_ARCHIVO) === lista.dir
      && /Lettermint: 5 bajas \(«unsubscribe»\) en rutas de difusión \(2 página\(s\)\); 2 supresiones de otro tipo no se tocan\./.test(lista.texto)
      && sinCorreos(lista));
    const vacia = listarLM([[200, paginador([], null)]]);
    paso('sin ninguna baja en Lettermint, BAJAS_LETTERMINT = 0: el flujo ni instala psql ni toca la base',
      vacia.estado === 0 && vacia.salida.BAJAS_LETTERMINT === '0' && vacia.salida.BAJAS_RARAS === '0' && leerLista(vacia) === '');
    const sinEquipo = listarLM([], { LETTERMINT_TEAM_TOKEN: '' });
    const r401 = listarLM([[401, { message: 'Unauthenticated.' }]]);
    const r403 = listarLM([[403, { message: 'This action is unauthorized.' }]]);
    const rForma = listarLM([[200, { mensaje: 'otra cosa' }]]);
    paso('sin token de equipo para claro (el de proyecto no sirve) sin llamar a Lettermint; un 401, un 403 o una respuesta con otra forma paran sin dejar lista ni nada en GITHUB_ENV',
      sinEquipo.estado !== 0 && /LETTERMINT_TEAM_TOKEN/.test(sinEquipo.texto) && /DE EQUIPO/.test(sinEquipo.texto) && sinEquipo.curl.length === 0
      && r401.estado !== 0 && /HTTP 401/.test(r401.texto)
      && r403.estado !== 0 && /permiso para leer las supresiones \(HTTP 403\)/.test(r403.texto)
      && rForma.estado !== 0 && /forma inesperada/.test(rForma.texto)
      && [sinEquipo, r401, r403, rForma].every((r) => Object.keys(r.salida).length === 0
        && !fs.readdirSync(r.dir).some((f) => f.startsWith('rwadar-bajas.') || f.startsWith('rwadar-lista.'))));
    const RARAS = [supresion('r1', 'Nombre <otra@bajas.test>', '2026-11-07T08:00:00Z'), supresion('r2', 'fecha.rara@bajas.test', 'ayer')];
    const soloRaras = listarLM([[200, paginador(RARAS, null)]]);
    const mezcla = listarLM([[200, paginador([...RARAS, PAGINAS_LM[1].data[0]], null)]]);
    paso('una baja sin forma de correo o de fecha no se aplica sola: si no hay ninguna buena, para y pide revisarla a mano; si hay alguna buena, deja que se apliquen',
      soloRaras.estado !== 0 && /2 bajas de Lettermint no tienen forma/.test(soloRaras.texto)
      && soloRaras.salida.BAJAS_RARAS === '2' && soloRaras.salida.BAJAS_LETTERMINT === '0'
      && mezcla.estado === 0 && mezcla.salida.BAJAS_RARAS === '2' && mezcla.salida.BAJAS_LETTERMINT === '1'
      && sinCorreos(soloRaras) && sinCorreos(mezcla));

    // Bajas: aplicarlas. El doble de psql contesta, en el mismo orden, lo que
    // devolvió el SQL en PGlite con las mismas variables (resultadosLM).
    const aplicar = correLM('aplicar-bajas', { SUPABASE_DB_URL: DB_DOBLE, BAJAS_ARCHIVO: lista.salida.BAJAS_ARCHIVO, BAJAS_RARAS: '0' },
      { psql: resultadosLM.map((r) => `${r}\n`) });
    paso('aplicar-bajas: un psql por baja (-X -q -At, -v correo y -v suprimido_el, el SQL de la 31) en el orden de la lista, con la entrada estándar cerrada (si no, el psql se comería la lista); cuenta lo que devolvió la base en PGlite, no enseña ningún correo y borra la lista',
      aplicar.estado === 0 && aplicar.psql.length === 5
      && aplicar.psql.every((l, i) => isDeepStrictEqual(l.argv, [DB_DOBLE, '-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1',
        '-v', `correo=${bajasEsperadas[i].split('\t')[0]}`, '-v', `suprimido_el=${bajasEsperadas[i].split('\t')[1]}`, '-f', RUTA_BAJA])
        && l.sql === SQL_BAJA)
      && /\(de 5\): 2 aplicadas ahora · 1 ya estaban de baja · 1 apuntadas otra vez después \(no se tocan\) · 1 sin cuenta en RWAdar\./.test(aplicar.texto)
      && /1 se apuntaron de nuevo en RWAdar después/.test(aplicar.texto)
      && sinCorreos(aplicar) && !fs.existsSync(lista.salida.BAJAS_ARCHIVO));
    const lista2 = listarLM([[200, PAGINAS_LM[0]], [200, PAGINAS_LM[1]]]);
    const fallo = correLM('aplicar-bajas', { SUPABASE_DB_URL: DB_DOBLE, BAJAS_ARCHIVO: lista2.salida.BAJAS_ARCHIVO, BAJAS_RARAS: '0' },
      { psql: ['aplicada\n'], psqlFalla: [1] });
    const conRaras = correLM('aplicar-bajas', { SUPABASE_DB_URL: DB_DOBLE, BAJAS_ARCHIVO: mezcla.salida.BAJAS_ARCHIVO, BAJAS_RARAS: '2' },
      { psql: ['sin_cuenta\n'] });
    const lista3 = listarLM([[200, PAGINAS_LM[1]]]);
    const respuestaRara = correLM('aplicar-bajas', { SUPABASE_DB_URL: DB_DOBLE, BAJAS_ARCHIVO: lista3.salida.BAJAS_ARCHIVO, BAJAS_RARAS: '0' },
      { psql: ['borrada\n'] });
    paso('si psql falla a mitad, para en esa baja (las anteriores quedan) y dice que repetir es seguro; con bajas raras, aplica las buenas y después falla pidiendo revisarlas; una respuesta desconocida de la base para',
      fallo.estado !== 0 && fallo.psql.length === 2 && /Falló psql en la baja 2 de 5/.test(fallo.texto) && /repite la acción/.test(fallo.texto)
      && conRaras.estado !== 0 && conRaras.psql.length === 1
      && /\(de 1\): 0 aplicadas ahora · 0 ya estaban de baja · 0 apuntadas otra vez después \(no se tocan\) · 1 sin cuenta/.test(conRaras.texto)
      && /2 bajas de Lettermint no tienen forma/.test(conRaras.texto)
      && respuestaRara.estado !== 0 && /Respuesta inesperada de la base en la baja 1 de 3/.test(respuestaRara.texto)
      && [fallo, conRaras, respuestaRara].every(sinCorreos));
    const ajeno = path.join(temporal, 'no-es-una-lista');
    fs.writeFileSync(ajeno, 'x');
    const limpio = correLM('limpiar', { BAJAS_ARCHIVO: lista2.salida.BAJAS_ARCHIVO, RUNNER_TEMP: lista2.dir });
    const noAjeno = correLM('limpiar', { BAJAS_ARCHIVO: ajeno });
    paso('el último paso borra la lista temporal de bajas (también si un paso anterior falló) y nada que no sea suya',
      fs.existsSync(path.join(lista2.dir, path.basename(lista2.salida.BAJAS_ARCHIVO))) === false
      && limpio.estado === 0 && noAjeno.estado === 0 && fs.existsSync(ajeno));
  } else {
    console.log('  (sin bash o sin jq en este equipo: los pasos de «Correo Lettermint» se comprueban en CI)');
  }

  // Vault como estaba.
  await sesion(db);
  await db.exec("delete from vault.decrypted_secrets where name = 'RWADAR_REMITENTE'");
  for (const { v } of remitentesAntes) await db.query("insert into vault.decrypted_secrets(name, decrypted_secret) values ('RWADAR_REMITENTE', $1)", [v]);
}

} catch (e) {
  fail.push(`ERROR INESPERADO tras «${ok.at(-1) || 'el inicio'}»: ${e?.message}${e?.where ? ` (${e.where})` : ''}`);
} finally {
  await db?.close();
}
try { fs.rmSync(temporal, { recursive: true, force: true }); } catch { /* sin importancia */ }
informe('RWAdar · avisos a registrados (30 y 31)', ok, fail);

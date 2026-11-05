/* =====================================================================
   RWAdar · avisos a registrados (migración 30)
   ---------------------------------------------------------------------
   Contrato: docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md.

   Postgres real en WebAssembly (PGlite) sobre la cadena de producción: el
   seed anterior a ARTEX, 01-22, 24, 25, las migraciones del catálogo, los
   lotes reales del 22/10 al 2026-11-04.2, 26, el refuerzo de sesión, 28,
   28_REVERTIR, 29 y la 30. Encima, los lotes reales 2026-11-05 y
   2026-11-05.2 y lotes inventados con ofertas nuevas.

   Auth (con el rol supabase_auth_admin), pg_net, Vault y pg_cron son dobles
   locales: no hay red, ni correo, ni push, ni Supabase. Las peticiones a
   Brevo y a Expo se leen de la cola del doble de pg_net y sus respuestas se
   simulan escribiéndolas en net._http_response.

       node probar-avisos-registrados.mjs
   ===================================================================== */
import fs from 'node:fs';
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
  if (!carpeta || !peticion?.body?.htmlContent) return;
  fs.mkdirSync(carpeta, { recursive: true });
  fs.writeFileSync(path.join(carpeta, nombre + '.html'), peticion.body.htmlContent);
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
const VERSION = 'novedades-v1-2026-11-05';
const TEXTO_ES = 'Quiero recibir avisos de RWAdar por correo y, si los activo en mi móvil, como notificaciones: ofertas nuevas en el radar y novedades de la web y la app. Es opcional: la Academy se desbloquea igual. Puedes darte de baja en cada aviso o en Perfil. Más información en Privacidad.';
const TEXTO_EN = "I want to receive RWAdar notices by email and, if I turn them on in my phone, as notifications: new offers on the radar and news about the website and the app. It's optional: the Academy unlocks anyway. You can unsubscribe in every notice or in Profile. More information in Privacy.";
const AVISO_FIJO = 'RWAdar no intermedia ni recomienda. Aparecer en el radar no es un respaldo y se puede perder lo invertido. Nadie paga por aparecer en este aviso.';
const FRASE_PLANTILLA = 'Al confirmar activas también los avisos de novedades. Si no lo pediste, no confirmes o date de baja en el primer correo.';
const MAILTO_BAJA = 'mailto:RWAdar@protonmail.com?subject=Baja%20de%20los%20avisos%20de%20RWAdar';

const SQL30 = leer('db/30_avisos_registrados.sql');
const MIGRACION30 = leer('supabase/migrations/20261105200000_avisos_registrados.sql');
const VERIFICAR30 = leer('db/30_avisos_registrados_verificar.sql');
const ACTIVAR_CORREO = leer('db/30_avisos_registrados_activar_correo.sql');
const ACTIVAR_PUSH = leer('db/30_avisos_registrados_activar_push.sql');
const ACTIVAR_CASILLA = leer('db/30_avisos_registrados_activar_casilla.sql');
const APAGAR = leer('db/30_avisos_registrados_apagar.sql');
const ANUNCIAR = leer('db/anunciar.sql');
const FALLO_CERRADO = leer('db/fallo_cerrado.sql');
const FLUJO = leer('../.github/workflows/avisar-novedad.yml');
const PLANTILLA = leer('plantillas-auth/confirmar-alta.html');

// psql no sustituye variables en los comentarios ni dentro de un bloque $etiqueta$.
const sinComentarios = (sql) => sql.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');

// Si algo revienta a mitad, el informe dice dónde en vez de cortar sin más.
let db;
try {
/* =====================================================================
   1 · Revisión estática: copia versionada, textos, plantilla, flujo
   ===================================================================== */
paso('la migración versionada 20261105200000 es una copia idéntica de db/30', MIGRACION30 === SQL30);
paso('la 30 y su verificador guardan la versión y los textos ES/EN exactos del contrato',
  [SQL30, VERIFICAR30].every((s) => s.includes(`'${VERSION}'`) && s.includes(`'${TEXTO_ES}'`)
    && s.includes(`'${TEXTO_EN.replace(/'/g, "''")}'`)));
{
  // El contrato es la fuente de verdad: si está en esta copia, sus citas deben coincidir.
  const ruta = path.join(raiz, '..', 'docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md');
  if (fs.existsSync(ruta)) {
    const md = fs.readFileSync(ruta, 'utf8');
    const cita = (marca) => {
      const lineas = md.slice(md.indexOf(marca)).split('\n').slice(1);
      const texto = [];
      for (const l of lineas) { const m = l.match(/^\s*>\s?(.*)$/); if (!m) break; texto.push(m[1].trim()); }
      return texto.join(' ');
    };
    paso('los textos de la prueba son literalmente las citas del contrato',
      cita('- Texto en español:') === TEXTO_ES && cita('- Texto en inglés:') === TEXTO_EN
      && md.includes(`\`${VERSION}\``));
  } else {
    console.log('  (el contrato no está en esta copia: se comparan los textos copiados aquí de su versión 2)');
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
  paso('la plantilla no lleva imágenes, scripts, http:// ni enlaces de seguimiento',
    !/<img|<script|http:\/\/|utm_|track|pixel/i.test(PLANTILLA)
    && enlaces.every((h) => h === '{{ .ConfirmationURL }}' || h.startsWith('https://rwadar.pages.dev/')
      || h === 'mailto:RWAdar@protonmail.com'));
}

// Flujo «Avisar novedad»: manual, sin permisos de más, entradas por env:.
const ENLACE_VALIDO = /^https:\/\/rwadar\.pages\.dev(\/[A-Za-z0-9._~%-]+)*\/?([?#][A-Za-z0-9._~%=&-]*)?$/;
const pasoFlujo = (nombre) => {
  const lineas = FLUJO.split('\n');
  const inicio = lineas.findIndex((l) => l.trim() === `- name: ${nombre}`);
  if (inicio < 0) return null;
  const fin = lineas.findIndex((l, i) => i > inicio && /^ {6}- /.test(l));
  return lineas.slice(inicio, fin < 0 ? undefined : fin).join('\n');
};
const scriptDe = (bloque) => {
  const lineas = bloque.split('\n');
  const i = lineas.findIndex((l) => /^ {8}run: \|$/.test(l));
  return lineas.slice(i + 1).map((l) => l.replace(/^ {10}/, '')).join('\n');
};
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
  paso('un solo trabajo, permissions: {} y solo contents: read para descargar el repositorio privado',
    trabajos.length === 1 && /^permissions: \{\}$/m.test(FLUJO)
    && (FLUJO.match(/permissions:/g) || []).length === 2 && /^ {4}permissions:\n {6}contents: read\n/m.test(FLUJO)
    && !/write/.test(FLUJO.replace(/^#.*$/gm, '')));
  paso('sin npm ni node; instala solo psql como «Aplicar catálogo»',
    !runs.some((r) => /\b(npm|npx|node)\b/.test(r)) && !/setup-node/.test(FLUJO)
    && /apt-get install -y -qq postgresql-client-17/.test(FLUJO));
  paso('nunca ${{ inputs.* }} ni ${{ secrets.* }} dentro de run:; las entradas llegan por env:',
    runs.length >= 3 && runs.every((r) => !r.includes('${{')) && (FLUJO.match(/\$\{\{ inputs\.[a-z]+ \}\}/g) || []).length >= 10);
  paso('SUPABASE_DB_URL solo en el paso de psql',
    (FLUJO.match(/secrets\.SUPABASE_DB_URL/g) || []).length === 1 && psql?.includes('secrets.SUPABASE_DB_URL'));
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

// El reloj nuevo no lo tocan los LIKE de 22, 23, correo_fallo_cerrado ni fresh-install.
const FILTROS_ANTIGUOS = ['avisos_ciclo', 'avisos_soltar', 'avisos_confirmar', 'push_ciclo', 'push_soltar',
  'push_confirmar', 'retencion_dispositivos_ciclo'];
{
  const orden = (sql) => sql.match(/select cron\.schedule\('rwadar-novedades', '\*\/5 \* \* \* \*', \$\$(.*?)\$\$\);/)?.[1];
  const ordenes = [orden(ACTIVAR_CORREO), orden(ACTIVAR_PUSH)];
  paso('los dos scripts de activación crean el mismo reloj, que solo llama a rwadar_novedades.procesar()',
    ordenes.every((o) => o === ' select rwadar_novedades.procesar() '));
  paso('esa orden no contiene ninguno de los patrones LIKE de los cierres antiguos',
    ordenes.every((o) => o && !FILTROS_ANTIGUOS.some((f) => o.toLowerCase().includes(f))));
  paso('fallo_cerrado.sql apaga los interruptores y la casilla de la 30 y quita cualquier reloj que llame a rwadar_novedades',
    /update rwadar_novedades\.configuracion\s+set correo_habilitado = false, push_habilitado = false, ofertas_automaticas = false/.test(FALLO_CERRADO)
    && /update rwadar_novedades\.configuracion set casilla_activa = false where unica/.test(FALLO_CERRADO)
    && FALLO_CERRADO.includes("like '%rwadar_novedades.%'"));
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

// Privilegios por defecto hostiles mientras se aplica la 30: cualquier objeto
// nuevo nacería abierto a los clientes. La 30 debe cerrarlo todo ella sola.
const HOSTIL = `alter default privileges grant execute on functions to anon, authenticated, service_role;
  alter default privileges grant all on sequences to anon, authenticated;
  alter default privileges grant all on tables to anon, authenticated, service_role`;
await db.exec(HOSTIL);
await db.exec(SQL30);
await db.exec(SQL30);
await db.exec(HOSTIL.replace(/ grant /g, ' revoke ').replace(/ to /g, ' from '));
await db.exec('alter default privileges grant all on tables to anon, authenticated'); // la base de antes
paso('la 30 se aplica literalmente dos veces sobre la cadena de producción', true);

/* =====================================================================
   3 · Estado de instalación: apagado, relleno, permisos
   ===================================================================== */
const verificar = async () => {
  await sesion(db);
  const avisos = [];
  const e = await error(() => db.exec(VERIFICAR30, { onNotice: (n) => avisos.push(n.message) }));
  if (e) { await db.exec('rollback'); return { ok: false, error: e.message }; }
  return { ok: avisos.some((a) => a.startsWith('RWAdar 30 OK')), aviso: avisos.find((a) => a.startsWith('RWAdar 30 OK')) };
};
const relojes = async () => (await sesion(db), filas(db, `select jobname, schedule, command from cron.job
  where jobname = 'rwadar-novedades' or lower(coalesce(command, '')) like '%rwadar_novedades.%'`));
const config = async () => { await sesion(db); return una(db, 'select * from rwadar_novedades.configuracion'); };
const pref = async (u) => { await sesion(db); return una(db, 'select * from rwadar_novedades.preferencias where usuario_id = $1', [u.id]); };

{
  const c = await config();
  const v = await verificar();
  paso('todo nace apagado: casilla del alta, correo, push y ofertas automáticas, sin fechas de activación ni reloj',
    !c.casilla_activa && !c.correo_habilitado && !c.push_habilitado && !c.ofertas_automaticas && c.correo_activado_el === null
    && c.push_activado_el === null && (await relojes()).length === 0);
  paso('configuracion guarda la versión y los textos de la casilla EXACTAMENTE como el contrato',
    c.version_consentimiento === VERSION && c.texto_consentimiento_es === TEXTO_ES && c.texto_consentimiento_en === TEXTO_EN);
  paso(`el verificador 30 pasa con todo apagado («${v.aviso || v.error}»)`,
    v.ok && /casilla del alta inactiva, correo apagado, push apagado/.test(v.aviso));
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
  paso('el esquema privado no tiene usage para clientes; sus 6 tablas, RLS y ningún permiso',
    !esquema.a && !esquema.b && !esquema.c && tablas.length === 6 && tablas.every((t) => t.rls && !t.anon && !t.aut && !t.pub));
  const rpc = await filas(db, `select f.firma, p.prosecdef, p.proconfig,
      has_function_privilege('public', p.oid, 'EXECUTE') pub, has_function_privilege('anon', p.oid, 'EXECUTE') anon,
      has_function_privilege('authenticated', p.oid, 'EXECUTE') aut, has_function_privilege('service_role', p.oid, 'EXECUTE') srv
    from (values ('public.estado_mis_avisos()'), ('public.configurar_avisos_novedades(boolean,text,text)'),
      ('public.registrar_aviso_push(text,text)'), ('public.quitar_aviso_push(text)'),
      ('public.mi_aviso_push_registrado(text)'),
      ('public.mis_avisos_recientes(integer)'), ('public.baja_avisos(uuid)')) f(firma)
    join pg_proc p on p.oid = to_regprocedure(f.firma)`);
  paso('API pública: las 7 RPC existen, definer con search_path vacío; authenticated sí, public y service_role no',
    rpc.length === 7 && rpc.every((f) => vacio(f) && f.aut && !f.pub && !f.srv));
  paso('anon solo puede ejecutar baja_avisos', rpc.filter((f) => f.anon).map((f) => f.firma).join() === 'public.baja_avisos(uuid)');
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
  // El verificador cubre lo nuevo: la RPC del móvil y las columnas de la casilla y las marcas.
  await sesion(db);
  await db.exec('grant execute on function public.mi_aviso_push_registrado(text) to anon');
  const v1 = await verificar();
  await db.exec('revoke execute on function public.mi_aviso_push_registrado(text) from anon');
  await db.exec('alter table rwadar_novedades.preferencias rename column bienvenida_push_el to bienvenida_push_otra');
  const v2 = await verificar();
  await db.exec('alter table rwadar_novedades.preferencias rename column bienvenida_push_otra to bienvenida_push_el');
  paso('el verificador 30 detecta mi_aviso_push_registrado abierta a anon y la falta de la casilla o de las marcas de bienvenida',
    !v1.ok && /mi_aviso_push_registrado/.test(v1.error) && !v2.ok && /casilla_activa o las marcas/.test(v2.error)
    && (await verificar()).ok);
}

/* =====================================================================
   4 · Alta y confirmación con el rol de Auth
   ===================================================================== */
const comoAuth = async (fn) => {
  await sesion(db);
  await db.exec('set role supabase_auth_admin');
  try { return await fn(); } finally { await db.exec('reset role'); }
};
const altaAuth = (email, meta, confirmada = false) => comoAuth(async () => (await filas(db,
  `insert into auth.users(email, raw_user_meta_data, email_confirmed_at)
   values ($1, $2::jsonb, ${confirmada ? 'now()' : 'null'}) returning id, email`,
  [email, meta === null ? null : JSON.stringify(meta ?? {})]))[0]);
const confirmarAuth = (u, avisos = []) => comoAuth(() => db.query(
  'update auth.users set email_confirmed_at = now() where id = $1', [u.id], { onNotice: (n) => avisos.push(n) }));
const META_SI = (canal = 'web') => ({ avisos_novedades: true, avisos_version: VERSION, avisos_canal: canal, nombre: 'x' });

{
  const [permisos] = await filas(db, `select has_schema_privilege('supabase_auth_admin','rwadar_novedades','USAGE') u,
    has_table_privilege('supabase_auth_admin','rwadar_novedades.preferencias','INSERT') i`);
  paso('supabase_auth_admin no tiene ningún privilegio sobre rwadar_novedades', !permisos.u && !permisos.i);
}
// Hueco del permiso: con la casilla sin activar (plantilla de Auth aún sin
// poner), unos metadatos válidos escritos a mano en el alta no apuntan a nadie.
{
  const sinCasilla = await altaAuth('sin-casilla@ejemplo.test', META_SI('web'));
  await confirmarAuth(sinCasilla);
  const p = await pref(sinCasilla);
  paso('con casilla_activa = false, confirmar con metadatos válidos crea preferencias pero NO da permiso',
    p?.novedades === false && p.origen === null && p.aceptado_el === null && p.version === null);
  await sesion(db);
  await db.exec(ACTIVAR_CASILLA);
  const c = await config();
  const v = await verificar();
  paso(`30_avisos_registrados_activar_casilla.sql solo activa la casilla: ni correo, ni push, ni reloj («${v.aviso || v.error}»)`,
    c.casilla_activa === true && !c.correo_habilitado && !c.push_habilitado && !c.ofertas_automaticas
    && (await relojes()).length === 0 && v.ok && /casilla del alta activa, correo apagado, push apagado/.test(v.aviso));
  paso('activarla después no apunta a quien se confirmó antes (sus preferencias ya existen)',
    (await pref(sinCasilla)).novedades === false);
}
const ana = await altaAuth('ana@ejemplo.test', META_SI('web'));
paso('el alta sin confirmar todavía no crea preferencias', !(await pref(ana)));
await confirmarAuth(ana);
{
  const p = await pref(ana);
  paso('con la casilla activa y SET ROLE supabase_auth_admin, confirmar crea las preferencias y guarda el permiso (alta, web, versión y fecha)',
    p?.novedades === true && p.origen === 'alta' && p.canal === 'web' && p.version === VERSION && p.aceptado_el instanceof Date
    && p.alta_el instanceof Date && /^[0-9a-f-]{36}$/.test(p.baja_token));
}
const nace = await altaAuth('nace@ejemplo.test', META_SI('app'), true);
paso('una cuenta que nace confirmada (INSERT) recibe preferencias pero NO el permiso',
  (await pref(nace))?.novedades === false && (await pref(nace)).origen === null);
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

  const v = await verificar();
  paso('el verificador 30 detecta las cuentas confirmadas que se quedaron sin preferencias',
    !v.ok && /cuentas confirmadas sin preferencias/.test(v.error));
  await sesion(db);
  const rellenadas = await numero(db, 'select rwadar_novedades.rellenar()');
  paso(`el relleno las completa con novedades = false (${rellenadas}) y el verificador vuelve a pasar`,
    rellenadas === 3 && (await pref(averia1))?.novedades === false && (await pref(averia2))?.novedades === false
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
    codigo(() => db.query('select public.configurar_avisos_novedades(true, $1, null)', [VERSION])),
    codigo(() => db.query("select public.configurar_avisos_novedades(true, $1, 'sms')", [VERSION])),
    codigo(() => db.query("select public.configurar_avisos_novedades(null, $1, 'web')", [VERSION])),
  ]);
  paso('para activar hacen falta la versión vigente y un canal web/app (22023/22004)',
    isDeepStrictEqual(malos, ['22023', '22023', '22023', '22004']));
  const activado = (await rpc("select public.configurar_avisos_novedades(true, $1, 'app') e", [VERSION])).e;
  const p = await pref(eva);
  paso('activar en Perfil crea la fila y guarda permiso, versión, fecha, origen «perfil» y canal «app»',
    activado.novedades === true && p.novedades && p.origen === 'perfil' && p.canal === 'app' && p.aceptado_el instanceof Date);
  await como(nace);
  await rpc("select public.configurar_avisos_novedades(true, $1, 'web') e", [VERSION]);
  const apagado = (await rpc('select public.configurar_avisos_novedades(false, null, null) e')).e;
  paso('desactivar quita el permiso y anota la baja', apagado.novedades === false && (await pref(nace)).baja_el instanceof Date);
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
  for (let i = 1; i <= 7; i++) await rpc("select public.registrar_aviso_push($1, 'android') r", [token(i)]);
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
    ['Novedad', 'Sube un 5 %'], ['Oportunidades nuevas', 'x y z']];
  const codigosVetados = [];
  for (const [i, [t, x]] of vetados.entries()) codigosVetados.push(await anunciar('novedad', `novedad:vetada-${i}`, t, x));
  paso('filtro de palabras: sin «oportunidad», «rentabilidad», «garantiz…» ni % (23514)', codigosVetados.every((c) => c === '23514'));
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
const psqlAnunciar = (variables) => sinComentarios(ANUNCIAR).split('\n').filter((l) => !l.startsWith('\\')).join('\n')
  .split(/(\$[a-z_]*\$[\s\S]*?\$[a-z_]*\$)/)
  .map((trozo, i) => (i % 2 ? trozo : trozo.replace(/:'([a-z_]+)'/g, (_, nombre) => {
    if (!(nombre in variables)) throw new Error(`falta la variable ${nombre}`);
    return `'${String(variables[nombre]).replace(/'/g, "''")}'`;
  }))).join('');
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
  paso('plantilla cerrada: «1 ficha nueva en el radar de RWAdar», enlace a #emisiones y el aviso fijo, sin nombres de productos',
    anuncio.titulo === '1 ficha nueva en el radar de RWAdar' && anuncio.enlace === 'https://rwadar.pages.dev/#emisiones'
    && anuncio.texto.endsWith(AVISO_FIJO) && !/inventada|Spiko|Brickwise/i.test(anuncio.titulo + anuncio.texto));
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
const VAULT_BREVO = "insert into vault.decrypted_secrets(name, decrypted_secret) values ('BREVO_API_KEY', 'xkeysib-clave-local-larga-no-real-123456789'), ('RWADAR_REMITENTE', 'avisos@rwadar.example') on conflict (name) do update set decrypted_secret = excluded.decrypted_secret";
{
  await sesion(db);
  const e = await error(() => db.exec(ACTIVAR_CORREO));
  await db.exec('rollback');
  const c = await config();
  paso('sin BREVO_API_KEY y RWADAR_REMITENTE en Vault, activar el correo falla y no deja nada encendido ni reloj',
    e?.code === '55000' && /Vault/.test(e.message) && !c.correo_habilitado && (await relojes()).length === 0);
  await db.exec(VAULT_BREVO);
  await db.exec(ACTIVAR_CORREO);
  const c2 = await config();
  const v = await verificar();
  paso('activar el correo lo enciende con fecha y crea un solo reloj rwadar-novedades cada 5 minutos',
    c2.correo_habilitado && c2.correo_activado_el instanceof Date && !c2.push_habilitado
    && isDeepStrictEqual((await relojes()).map((r) => [r.jobname, r.schedule, r.command]),
      [['rwadar-novedades', '*/5 * * * *', ' select rwadar_novedades.procesar() ']]));
  paso(`el verificador 30 pasa con el correo encendido («${v.aviso || v.error}»)`, v.ok && /correo encendido, push apagado/.test(v.aviso));
  await db.exec("insert into vault.decrypted_secrets(name, decrypted_secret) values ('EXPO_ACCESS_TOKEN', 'no válido!')");
  const ep = await error(() => db.exec(ACTIVAR_PUSH));
  await db.exec('rollback');
  await db.exec("delete from vault.decrypted_secrets where name = 'EXPO_ACCESS_TOKEN'");
  paso('un EXPO_ACCESS_TOKEN con formato no válido impide activar el push', ep?.code === '55000' && !(await config()).push_habilitado);
  await db.exec(ACTIVAR_PUSH);
  const fechaCorreo = (await config()).correo_activado_el.getTime();
  await db.exec(ACTIVAR_CORREO);
  const c3 = await config();
  paso('activar el push y repetir la activación del correo dejan un solo reloj y conservan la fecha de activación',
    c3.push_habilitado && c3.push_activado_el instanceof Date && c3.correo_activado_el.getTime() === fechaCorreo
    && (await relojes()).length === 1);
  const v2 = await verificar();
  paso('el verificador 30 pasa con correo y push encendidos', v2.ok && /correo encendido, push encendido/.test(v2.aviso));
}

/* =====================================================================
   9 · procesar(): reparto, peticiones a Brevo y Expo, respuestas y recibos
   ===================================================================== */
const BREVO = 'https://api.brevo.com/v3/smtp/email';
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
const paraCorreo = (lista, u) => lista.filter((p) => p.body.to?.[0]?.email === u.email);
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

  const correos = await peticiones(antes, BREVO);
  const [aAna] = paraCorreo(correos, ana);
  const html = aAna?.body.htmlContent || '';
  paso('Brevo: una petición por correo, con api-key de Vault, remitente RWAdar y contactPixelTrackingConsent: false',
    correos.length === suscritas.length + 2 && aAna?.headers['api-key'] === 'xkeysib-clave-local-larga-no-real-123456789'
    && isDeepStrictEqual(aAna.body.sender, { name: 'RWAdar', email: 'avisos@rwadar.example' })
    && isDeepStrictEqual(aAna.body.to, [{ email: ana.email, contactPixelTrackingConsent: false }]));
  const bajaAna = `https://rwadar.pages.dev/baja?t=${(await pref(ana)).baja_token}`;
  paso('Idempotency-Key propia y List-Unsubscribe con la baja por enlace y por mailto (sin List-Unsubscribe-Post)',
    /^[0-9a-f-]{36}$/.test(aAna.body.headers['Idempotency-Key'])
    && aAna.body.headers['List-Unsubscribe'] === `<${bajaAna}>, <${MAILTO_BAJA}>`
    && !JSON.stringify(aAna.body).includes('List-Unsubscribe-Post'));
  paso('el título y el texto van escapados en el HTML; el asunto, tal cual',
    html.includes('Avisos &amp; &lt;mejoras&gt; en la app') && html.includes('elegir &quot;qué&quot; avisos')
    && !html.includes('<mejoras>') && aAna.body.subject === 'Avisos & <mejoras> en la app');
  paso('pie: quién envía (aviso legal y privacidad), por qué lo recibe y la baja por enlace y mailto',
    html.includes('Te escribe RWAdar') && html.includes('href="https://rwadar.pages.dev/privacidad#aviso-legal"')
    && html.includes('href="https://rwadar.pages.dev/privacidad"') && html.includes('te apuntaste a los avisos de novedades')
    && html.includes(`href="${bajaAna}"`) && html.includes(`href="${MAILTO_BAJA}"`)
    && aAna.body.textContent.includes(bajaAna) && aAna.body.textContent.includes('RWAdar@protonmail.com'));
  paso('sin píxel ni enlaces de seguimiento: ninguna imagen y todos los enlaces directos a rwadar.pages.dev o mailto',
    correos.every((c) => !/<img|utm_|track/i.test(c.body.htmlContent)
      && [...c.body.htmlContent.matchAll(/href="([^"]*)"/g)].every(([, h]) => h.startsWith('https://rwadar.pages.dev/') || h.startsWith('mailto:RWAdar@protonmail.com'))));
  const [bienvenidaSi] = paraCorreo(correos, nueva);
  const [bienvenidaNo] = paraCorreo(correos, nueva2);
  volcarCorreo('bienvenida-con-avisos', bienvenidaSi);
  volcarCorreo('bienvenida-sin-avisos', bienvenidaNo);
  volcarCorreo('anuncio-novedad', aAna);
  paso('bienvenida: Academy gratis con enlace a /academy/, sin ofertas ni número de lecciones, y «Si no creaste esta cuenta, escríbenos o bórrala»',
    [bienvenidaSi, bienvenidaNo].every((b) => b && b.body.subject === 'Te damos la bienvenida a RWAdar'
      && b.body.htmlContent.includes('href="https://rwadar.pages.dev/academy/"') && b.body.htmlContent.includes('Academy')
      && !/\d+\s*lecciones|oportunidad|rentabilidad|\/ofertas\/|#emisiones/i.test(b.body.htmlContent)
      && b.body.textContent.includes('Si no creaste esta cuenta, escríbenos o bórrala')
      && /Si no creaste esta cuenta, <a href="mailto:RWAdar@protonmail.com"[^>]*>escríbenos<\/a> o bórrala\./.test(b.body.htmlContent)));
  paso('bienvenida a quien NO se apuntó: sin List-Unsubscribe, sin baja y sin invitar a apuntarse',
    !('List-Unsubscribe' in bienvenidaNo.body.headers) && !bienvenidaNo.body.htmlContent.includes('baja?t=')
    && !/apunta|avisos de novedades/i.test(bienvenidaNo.body.htmlContent));
  paso('bienvenida a quien se apuntó: confirma la suscripción, con List-Unsubscribe y enlace de baja',
    'List-Unsubscribe' in bienvenidaSi.body.headers && bienvenidaSi.body.htmlContent.includes('te has apuntado a los avisos de novedades')
    && bienvenidaSi.body.htmlContent.includes(`baja?t=${(await pref(nueva)).baja_token}`));

  const pushes = await peticiones(antes, EXPO);
  const deAna = pushes.filter((p) => p.body.to === TOKEN_ANA);
  const anuncioAna = deAna.find((p) => p.body.data.tipo === 'novedad');
  paso('Expo: canal «novedades», data exactamente {tipo, destino} y sin Authorization si no hay EXPO_ACCESS_TOKEN',
    pushes.length === 4 && pushes.every((p) => p.body.channelId === 'novedades' && Object.keys(p.body.data).sort().join() === 'destino,tipo'
      && ['inicio', 'buscar', 'academy'].includes(p.body.data.destino) && !('authorization' in p.headers))
    && isDeepStrictEqual(anuncioAna?.body.data, { tipo: 'novedad', destino: 'academy' })
    && anuncioAna.body.title === 'Avisos & <mejoras> en la app');
  paso('ningún push lleva datos personales (ni correo ni id de cuenta)',
    pushes.every((p) => ![ana, luis, eva].some((u) => JSON.stringify(p.body).includes(u.email) || JSON.stringify(p.body).includes(u.id))));
  paso('la bienvenida por push va a la Academy: data {tipo: bienvenida, destino: academy}',
    pushes.filter((p) => p.body.data.tipo === 'bienvenida').length === 2
    && pushes.filter((p) => p.body.data.tipo === 'bienvenida').every((p) => p.body.data.destino === 'academy'));
  paso('una segunda vuelta no reparte ni envía nada de nuevo', await (async () => {
    const desde = await ultimaPeticion();
    await procesar();
    return (await ultimaPeticion()) === desde;
  })());

  // Respuestas de Brevo.
  await sesion(db);
  const id = (u) => paraCorreo(correos, u)[0].id;
  await responder(id(ana), 201, { messageId: '<m1@brevo.example>' });
  await responder(id(eva), 500, { code: 'internal_error' });
  await responder(id(nueva2), 401, { code: 'unauthorized' });
  await responder(id(canalRaro), 400, { code: 'duplicate_parameter' });
  // Push: ticket como objeto, como array de uno y DeviceNotRegistered al enviar.
  const pushDe = (t, tipo) => pushes.find((p) => p.body.to === t && p.body.data.tipo === tipo).id;
  await responder(pushDe(TOKEN_ANA, 'novedad'), 200, { data: { status: 'ok', id: 'ticket-ana-1' } });
  await responder(pushDe(TOKEN_ANA_2, 'novedad'), 200, { data: [{ status: 'ok', id: 'ticket-ana-2' }] });
  await responder(pushDe(TOKEN_ANA, 'bienvenida'), 200, { data: { status: 'ok', id: 'ticket-ana-3' } });
  await responder(pushes.find((p) => p.body.data.tipo === 'bienvenida' && p.body.to !== TOKEN_ANA).id, 200,
    { data: { status: 'error', message: 'no', details: { error: 'DeviceNotRegistered' } } });
  const desde = await ultimaPeticion();
  await procesar();
  const reenvios = await peticiones(desde, BREVO);
  paso('Brevo 201 con messageId → aceptado; 400 duplicate_parameter → aceptado; 401 → fallido sin reintentar',
    (await correoDe(ana, 'anuncio')).estado === 'aceptado' && (await correoDe(ana, 'anuncio')).proveedor_mensaje_id === '<m1@brevo.example>'
    && (await correoDe(canalRaro, 'anuncio')).estado === 'aceptado' && (await correoDe(nueva2, 'bienvenida')).estado === 'fallido');
  paso('un 500 vuelve a la cola y se reenvía con la MISMA Idempotency-Key',
    reenvios.length === 1 && reenvios[0].body.to[0].email === eva.email
    && reenvios[0].body.headers['Idempotency-Key'] === paraCorreo(correos, eva)[0].body.headers['Idempotency-Key']);
  await responder(reenvios[0].id, 201, { messageId: '<m2@brevo.example>' });
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
  paso('sin respuesta de Brevo en 25 minutos, «incierto» y sin reenviar',
    (await correoDe(nueva, 'bienvenida')).estado === 'incierto' && (await peticiones(desde2, BREVO)).length === 0);
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

// Segunda comprobación justo antes de enviar.
{
  await sesion(db);
  await db.exec(`update vault.decrypted_secrets set decrypted_secret = 'corta' where name = 'BREVO_API_KEY';
    insert into vault.decrypted_secrets(name, decrypted_secret) values ('EXPO_ACCESS_TOKEN', 'no válido!')`);
  await db.query(`select rwadar_novedades.anunciar('actualizacion', 'actualizacion:prueba-n3', 'Nueva versión de la app',
    'Llega la versión con avisos en el móvil.', 'https://rwadar.pages.dev/')`);
  const desde = await ultimaPeticion();
  const { r, avisos } = await procesar();
  paso('si Vault falla, procesar() sigue: reparte, deja el envío para otra vuelta y solo avisa con el sqlstate',
    r.fallo_envio_correo === '55000' && r.fallo_envio_push === '55000' && r.repartidos > 0
    && (await ultimaPeticion()) === desde && avisos.some((a) => /envío de correo omitido \(sqlstate 55000\)/.test(a)));
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
  await db.exec(`${VAULT_BREVO}; delete from vault.decrypted_secrets where name = 'EXPO_ACCESS_TOKEN'`);
  const desde2 = await ultimaPeticion();
  await procesar();
  const enviados = (await peticiones(desde2, BREVO)).map((p) => p.body.to[0].email);
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
  // Brevo también puede responder al reintento con la misma clave con «duplicate_request».
  const [n3Ana] = paraCorreo(await peticiones(desde2, BREVO), ana);
  await sesion(db);
  await responder(n3Ana.id, 400, { code: 'duplicate_request', message: 'Duplicate request' });
  const desde3 = await ultimaPeticion();
  await procesar();
  await sesion(db);
  const correoN3 = await una(db, `select c.estado from rwadar_novedades.correos c join rwadar_novedades.anuncios a on a.id = c.anuncio_id
    where a.clave = 'actualizacion:prueba-n3' and c.usuario_id = $1`, [ana.id]);
  paso('Brevo 400 duplicate_request → aceptado (ya lo tenía), sin reenviar',
    correoN3?.estado === 'aceptado' && paraCorreo(await peticiones(desde3, BREVO), ana).length === 0);
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
  const correo = (await peticiones(desde, BREVO)).find((p) => p.body.to[0].email === ana.email);
  volcarCorreo('anuncio-ofertas', correo);
  paso('con ofertas_automaticas, el anuncio de ofertas nace publicado y procesar() lo reparte',
    automatico?.estado === 'publicado' && automatico.publicado_el instanceof Date
    && correo?.body.subject === '1 ficha nueva en el radar de RWAdar' && correo.body.htmlContent.includes(AVISO_FIJO));
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
    update rwadar_novedades.dispositivos set actualizado_el = now() - interval '181 days' where usuario_id = '${luis.id}'`);
  const terminadas = `select (select count(*) from rwadar_novedades.correos where estado in ('aceptado','descartado','fallido','incierto'))
    + (select count(*) from rwadar_novedades.pushes where estado in ('aceptado','descartado','fallido'))`;
  const bienvenidasTerminadas = await numero(db, `select
    (select count(*) from rwadar_novedades.correos where tipo = 'bienvenida' and estado in ('aceptado','descartado','fallido','incierto'))
    + (select count(*) from rwadar_novedades.pushes where tipo = 'bienvenida' and estado in ('aceptado','descartado','fallido'))`);
  const { r } = await procesar();
  paso(`limpieza: colas terminadas a los 90 días, también ${bienvenidasTerminadas} bienvenidas, y móviles sin actualizar a los 180 (${r.limpiados} filas)`,
    bienvenidasTerminadas === 3 && await numero(db, terminadas) === 0
    && await numero(db, 'select count(*) from rwadar_novedades.dispositivos where usuario_id = $1', [luis.id]) === 0);
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
}

/* =====================================================================
   11 · Convivencia con 22, 23, fresh-install y correo_fallo_cerrado
   ===================================================================== */
{
  const reloj = async () => (await relojes()).map((r) => r.jobname).join();
  const corre = async (nombre) => { await sesion(db); const e = await error(() => db.exec(leer(`db/${nombre}`))); if (e) await db.exec('rollback'); return e; };
  const e23 = await corre('23_activar_correo.sql');
  const v23 = await corre('23_activar_correo_verificar.sql');
  paso('con los avisos encendidos se aplica la 23 y su verificador pasa; el reloj rwadar-novedades sigue',
    !e23 && !v23 && await reloj() === 'rwadar-novedades');
  const e22 = await corre('22_cierre_regresiones.sql');
  const v22 = await corre('22_cierre_regresiones_verificar.sql');
  const fresh = await corre('fresh_install_verificar.sql');
  paso(`reaplicar la 22 y pasar sus verificadores y fresh-install (${[e22, v22, fresh].map((e) => e?.message || 'OK').join(' / ')}): el reloj sigue`,
    !e22 && !v22 && !fresh && await reloj() === 'rwadar-novedades');
  const cf = await corre('correo_fallo_cerrado.sql');
  paso('correo_fallo_cerrado.sql apaga el correo antiguo sin tocar el reloj de la 30', !cf && await reloj() === 'rwadar-novedades');
  const v = await verificar();
  const { r } = await procesar();
  paso('después de todo, el verificador 30 pasa y procesar() sigue funcionando', v.ok && /correo encendido, push encendido/.test(v.aviso)
    && r.estado === 'encendido' && !Object.keys(r).some((k) => k.startsWith('fallo_')));
}

/* =====================================================================
   12 · Apagar, reaplicar la 30 y fallo_cerrado
   ===================================================================== */
{
  await sesion(db);
  const casillaAntes = (await config()).casilla_activa;
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
  paso('apagar deja los tres interruptores y la casilla apagados y sin reloj; el verificador pasa y procesar() no envía nada',
    casillaAntes === true && !c.casilla_activa
    && !c.correo_habilitado && !c.push_habilitado && !c.ofertas_automaticas && (await relojes()).length === 0
    && v.ok && /casilla del alta inactiva, correo apagado, push apagado/.test(v.aviso)
    && r.estado === 'apagado' && (await ultimaPeticion()) === desde);
  await sesion(db);
  paso(`con todo apagado, procesar() limpia igual: colas terminadas de 90 días y móviles de 180 (${r.limpiados} filas)`,
    r.limpiados >= 2 && await numero(db, 'select count(*) from rwadar_novedades.correos where usuario_id = $1', [nace.id]) === 0
    && await numero(db, 'select count(*) from rwadar_novedades.dispositivos where token = $1', [token(50)]) === 0);
  await db.exec(ACTIVAR_CORREO);
  await db.exec(ACTIVAR_CASILLA);
  await db.exec("update rwadar_novedades.configuracion set ofertas_automaticas = true");
  const preferencias = await numero(db, 'select count(*) from rwadar_novedades.preferencias');
  await db.exec(SQL30);
  const c2 = await config();
  paso('reaplicar la 30 vuelve al estado seguro (todo apagado, casilla incluida, sin reloj) sin borrar preferencias y el verificador pasa',
    !c2.correo_habilitado && !c2.ofertas_automaticas && !c2.casilla_activa && (await relojes()).length === 0
    && await numero(db, 'select count(*) from rwadar_novedades.preferencias') === preferencias && (await verificar()).ok);
  await db.exec(ACTIVAR_PUSH);
  await db.exec(ACTIVAR_CORREO);
  await db.exec(ACTIVAR_CASILLA);
  await db.exec("update rwadar_novedades.configuracion set ofertas_automaticas = true; select cron.schedule('alias-renombrado', '* * * * *', $$ select rwadar_novedades.repartir() $$)");
  await db.exec(FALLO_CERRADO);
  const c3 = await config();
  await como(nace);
  const tras = await codigo(() => db.query('select public.estado_mis_avisos()'));
  await sesion(db, null, 'anon');
  const bajaTras = await codigo(() => db.query('select public.baja_avisos(gen_random_uuid())'));
  paso('fallo_cerrado.sql apaga los tres interruptores y la casilla, quita cualquier reloj que llame a rwadar_novedades y cierra las RPC',
    !c3.correo_habilitado && !c3.push_habilitado && !c3.ofertas_automaticas && !c3.casilla_activa && (await relojes()).length === 0
    && tras === '42501' && bajaTras === '42501');
}

} catch (e) {
  fail.push(`ERROR INESPERADO tras «${ok.at(-1) || 'el inicio'}»: ${e?.message}${e?.where ? ` (${e.where})` : ''}`);
} finally {
  await db?.close();
}
informe('RWAdar · avisos a registrados (30)', ok, fail);

/* =====================================================================
   RWAdar · gestión de Supabase con la Management API (Auth y versión)
   ---------------------------------------------------------------------
   Lo usa el flujo «Supabase (gestión)» (.github/workflows/supabase-gestion.yml):

     node rwadar-app/supabase-gestion.mjs comprobar   valida la rama y las entradas
     node rwadar-app/supabase-gestion.mjs ejecutar    hace la acción de ACCION

   Entradas (en el entorno): ACCION, CONFIRMAR, CUENTA_VERIFICADA, REMITENTE,
   CORREO_PRUEBA y ROTAR. Acciones:

   · estado (solo lee): estado del proyecto y versión de Postgres; si se puede
     actualizar Postgres (GET …/upgrade/eligibility, resumido); de la
     configuración de Auth, SOLO smtp_host, smtp_port, smtp_user,
     smtp_admin_email, smtp_sender_name, rate_limit_email_sent y los asuntos de
     confirmación y de recuperación; y si las plantillas de confirmación y de
     recuperación son iguales a las del repositorio (SHA-256: «igual» o
     «distinta»). Nunca enseña smtp_pass ni ninguna otra clave. Aquí no se
     actualiza Postgres: solo se dice si se puede.
   · plantillas: pone en Supabase Auth los dos asuntos y las dos plantillas de
     rwadar-app/plantillas-auth/ (los asuntos salen de su LEEME.md). Antes
     guarda las que había, como artefacto del flujo (vuelta atrás). Si ya
     están, no cambia nada.
   · smtp-lettermint: pasa el SMTP de Supabase Auth a Lettermint. Solo con
     CUENTA_VERIFICADA = SI (Lettermint ha aprobado la verificación de la
     cuenta; antes, los correos de la gente no saldrían: ronda 2 del plan), y
     solo si además: la API de Lettermint dice que el equipo está verificado,
     el dominio rwadar.app está verificado, el proyecto envía de verdad (no en
     Sandbox), las plantillas de Supabase ya son las del repositorio (con la
     dirección postal en el pie) y la privacidad publicada ya dice que estos
     correos salen por Lettermint (contrato, punto 5.8.2). Crea el token de
     proyecto «RWAdar Auth (SMTP)» (enmascarado, nunca se enseña), enseña el
     SMTP de ahora (vuelta atrás) y cambia host, puerto, usuario, contraseña
     (el token), remitente y nombre («RWAdar»). Si hay CORREO_PRUEBA, pide a
     Supabase un correo real de recuperación a esa dirección y solo cuenta el
     código HTTP. Si ya hay un token con ese nombre, no crea otro sin ROTAR =
     SI; al rotar, borra el viejo solo después de que Supabase acepte el nuevo.

   Claves (secretos de GitHub): SUPABASE_ACCESS_TOKEN y, en smtp-lettermint,
   LETTERMINT_TEAM_TOKEN. Ninguna se escribe nunca: ver rwadar-app/claves-comun.mjs.

   Pruebas sin red: node --test .github/claves.test.mjs
   ===================================================================== */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  SUPABASE_API, PROYECTO_SUPABASE, DOMINIO, PROYECTO_LETTERMINT, TOKEN_SMTP, Parada, falla, acortar, huella, crearSalida,
  crearCliente, leerSecreto, explicarHttp, objeto, clienteLettermint, buscarProyecto, buscarDominio, tokensDelProyecto,
  crearTokenProyecto, borrarTokenProyecto, fechaCorta, correoValido, remitenteDelDominio,
} from './claves-comun.mjs';

export const ACCIONES = ['estado', 'plantillas', 'smtp-lettermint'];
export const PALABRA = 'SUPABASE';
const RAIZ = fileURLToPath(new URL('..', import.meta.url));
export const LEEME = 'rwadar-app/plantillas-auth/LEEME.md';
export const PLANTILLAS = { confirmacion: 'rwadar-app/plantillas-auth/confirmar-alta.html', recuperacion: 'rwadar-app/plantillas-auth/recuperar-acceso.html' };
const FUENTE_WEB = 'rwadar-acceso/compilar.cjs';
/* SMTP de Lettermint, según su guía https://lettermint.co/docs/guides/send-email-with-smtp
   (consultada el 08/11/2026): host smtp.lettermint.co, usuario lettermint,
   contraseña un token de proyecto, puerto 587 con STARTTLS (o 465 con TLS
   directo). Su Team API lo repite al crear el token (campo «smtp»: host,
   ports, username) y se comprueba: si no coincide, no se cambia nada. */
export const SMTP = Object.freeze({ host: 'smtp.lettermint.co', puerto: '587', usuario: 'lettermint', nombre: 'RWAdar' });
const PIE_POSTAL = 'Plaza Generalitat, s/n, 46600 Alzira';
const PRIVACIDAD = 'https://rwadar.pages.dev/privacidad';
const RUTA = `/projects/${PROYECTO_SUPABASE}`;
// Los únicos campos de config/auth que se enseñan. Nunca smtp_pass ni otras claves.
export const CAMPOS_SMTP = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_admin_email', 'smtp_sender_name'];
export const CAMPOS_ESTADO = [...CAMPOS_SMTP, 'rate_limit_email_sent', 'mailer_subjects_confirmation', 'mailer_subjects_recovery'];
// Otras plantillas de Auth: solo se mira si llevan la dirección postal en el pie.
const OTRAS_PLANTILLAS = {
  mailer_templates_magic_link_content: 'enlace mágico', mailer_templates_email_change_content: 'cambio de correo',
  mailer_templates_invite_content: 'invitación', mailer_templates_reauthentication_content: 'reautenticación',
};

/* ---------------------------------------------------------------- entradas */
export function comprobarEntradas(entorno, salida) {
  if (entorno.GITHUB_REF !== 'refs/heads/main') {
    falla(`Este flujo solo se lanza desde main (se pidió desde ${acortar(entorno.GITHUB_REF || 'ninguna rama', 80)}).`);
  }
  const accion = entorno.ACCION || '';
  if (!ACCIONES.includes(accion)) falla(`Acción no válida: «${acortar(accion, 40)}». Elige una de estas: ${ACCIONES.join(', ')}.`);
  if (accion !== 'estado' && entorno.CONFIRMAR !== PALABRA) {
    falla(`${accion} cambia la configuración de Supabase Auth en línea: escribe ${PALABRA} en «confirmar» (y lánzalo solo con orden de Víctor).`);
  }
  const rotar = entorno.ROTAR || '';
  if (rotar && rotar !== 'SI') falla('«rotar» solo admite SI, en mayúsculas, o dejarlo vacío.');
  const remitente = entorno.REMITENTE || '';
  const correoPrueba = entorno.CORREO_PRUEBA || '';
  const verificada = entorno.CUENTA_VERIFICADA || '';
  if (accion === 'smtp-lettermint') {
    if (verificada !== 'SI') {
      falla('smtp-lettermint solo se hace cuando Lettermint haya APROBADO la verificación de la cuenta (su formulario de cumplimiento). ' +
        'Antes, los correos de confirmación y de recuperación de la gente no saldrían (ronda 2 del plan). Cuando llegue la aprobación, escribe SI en «cuenta_verificada».');
    }
    if (!remitenteDelDominio(remitente)) {
      falla(`smtp-lettermint necesita en «remitente» la dirección desde la que salen los correos de la cuenta, del dominio ${DOMINIO} (por ejemplo, avisos@${DOMINIO}), sin nombre ni <>.`);
    }
    if (correoPrueba && !correoValido(correoPrueba)) falla('«correo_prueba» debe ser una dirección de correo válida, sin nombre ni <> (o vacío para no mandar la prueba).');
  } else if (verificada || remitente || correoPrueba || rotar) {
    salida.linea('(«cuenta_verificada», «remitente», «correo_prueba» y «rotar» solo valen para smtp-lettermint: aquí no se usan.)');
  }
  return { accion, rotar: rotar === 'SI', remitente, correoPrueba };
}

/* ---------------------------------------------------------------- repositorio */
const normal = (t) => String(t ?? '').replace(/\r\n/g, '\n').trimEnd();
/* Iguales si coincide la huella SHA-256 (sin contar saltos de línea \r ni espacios al final). */
export const mismaPlantilla = (a, b) => typeof a === 'string' && huella(normal(a)) === huella(normal(b));

export function leerPlantillas(raiz = RAIZ) {
  const leeme = fs.readFileSync(path.join(raiz, LEEME), 'utf8');
  const asunto = (archivo) => {
    const filas = [...leeme.matchAll(/^\| `([^`]+)` \| [^|\n]+ \| `([^`\n]+)` \|$/gm)].filter((m) => m[1] === archivo);
    if (filas.length !== 1) falla(`No encuentro en ${LEEME} el asunto de ${archivo} (la tabla «Archivo | Plantilla del panel | Asunto»).`);
    const a = filas[0][2];
    if (a.length < 3 || a.length > 200 || /[\u0000-\u001f\u007f{}]/.test(a)) falla(`El asunto de ${archivo} en ${LEEME} tiene una forma rara.`);
    return a;
  };
  const leer = (rel) => {
    const t = fs.readFileSync(path.join(raiz, rel), 'utf8');
    if (t.length > 100000 || !t.includes('{{ .ConfirmationURL }}') || !t.includes(PIE_POSTAL)) {
      falla(`${rel} no parece la plantilla buena: le falta {{ .ConfirmationURL }} o la dirección postal del pie.`);
    }
    return t;
  };
  return {
    asuntoConfirmacion: asunto(path.basename(PLANTILLAS.confirmacion)), asuntoRecuperacion: asunto(path.basename(PLANTILLAS.recuperacion)),
    confirmacion: leer(PLANTILLAS.confirmacion), recuperacion: leer(PLANTILLAS.recuperacion),
  };
}

/* La dirección y la clave publicable que ya lleva la web (las mismas que usa
   correo-lettermint.sh). La clave es pública, pero no se escribe. */
export function claveWeb(raiz = RAIZ) {
  const f = fs.readFileSync(path.join(raiz, FUENTE_WEB), 'utf8');
  const url = [...f.matchAll(/^ *SUPABASE_URL: '([^']*)',$/gm)].map((m) => m[1]);
  const clave = [...f.matchAll(/^ *SUPABASE_PUBLISHABLE_KEY: '([^']*)',$/gm)].map((m) => m[1]);
  if (url.length !== 1 || url[0] !== `https://${PROYECTO_SUPABASE}.supabase.co`) {
    falla(`La dirección de Supabase de ${FUENTE_WEB} no es la del proyecto ${PROYECTO_SUPABASE}: no se manda la prueba.`);
  }
  if (clave.length !== 1 || !/^sb_publishable_[A-Za-z0-9_-]{10,200}$/.test(clave[0])) {
    falla(`No encuentro una sola clave publicable de Supabase con forma válida en ${FUENTE_WEB}: no se manda la prueba.`);
  }
  return { url: url[0], clave: clave[0] };
}

/* ---------------------------------------------------------------- Supabase */
function clienteSupabase(entorno, salida) {
  const token = leerSecreto(entorno, salida, 'SUPABASE_ACCESS_TOKEN', 'token personal de Supabase para la Management API');
  return crearCliente({ servicio: 'Supabase', base: SUPABASE_API, cabeceras: { Authorization: `Bearer ${token}` }, salida });
}
async function leerAuth(sb, salida) {
  const a = sb.exigir(await sb.pedir('GET', `${RUTA}/config/auth`), 200, 'leer la configuración de Auth');
  if (!a || typeof a !== 'object' || Array.isArray(a)) falla('Supabase devolvió la configuración de Auth con una forma inesperada.');
  // Lo que pueda ser una clave se tapa por si acaso, aunque nunca se escribe.
  for (const [k, v] of Object.entries(a)) if (/pass|secret|key|token/i.test(k) && typeof v === 'string') salida.ocultar(v);
  return a;
}
const mostrar = (v) => (v === null || v === undefined || v === '' ? '(vacío)' : acortar(String(v), 80));
function mostrarCampos(auth, campos, salida, sangria = '  ') {
  for (const c of campos) salida.linea(`${sangria}${c}: ${mostrar(auth[c])}`);
}
function compararPlantillas(auth, pl) {
  return {
    confirmacion: mismaPlantilla(auth.mailer_templates_confirmation_content, pl.confirmacion),
    recuperacion: mismaPlantilla(auth.mailer_templates_recovery_content, pl.recuperacion),
    asuntoConfirmacion: auth.mailer_subjects_confirmation === pl.asuntoConfirmacion,
    asuntoRecuperacion: auth.mailer_subjects_recovery === pl.asuntoRecuperacion,
  };
}
const otrasSinPie = (auth) => Object.entries(OTRAS_PLANTILLAS)
  .filter(([campo]) => typeof auth[campo] === 'string' && auth[campo].trim() && !auth[campo].includes(PIE_POSTAL)).map(([, n]) => n);

/* ---------------------------------------------------------------- acciones */
async function estado({ entorno, salida }) {
  const sb = clienteSupabase(entorno, salida);
  const pl = leerPlantillas();
  const p = sb.exigir(await sb.pedir('GET', RUTA), 200, `leer el proyecto ${PROYECTO_SUPABASE}`) || {};
  const db = p.database && typeof p.database === 'object' ? p.database : {};
  salida.linea(`Proyecto ${PROYECTO_SUPABASE}: ${mostrar(p.status)}.`);
  salida.linea(`Postgres: ${mostrar(db.version)} (motor ${mostrar(db.postgres_engine)}, canal ${mostrar(db.release_channel)}).`);

  const e = await sb.pedir('GET', `${RUTA}/upgrade/eligibility`);
  if (e.estado === 200 && e.datos && typeof e.datos === 'object') {
    const d = e.datos;
    const lista = (v) => (Array.isArray(v) ? v : []);
    const nombres = (v) => lista(v).slice(0, 8).map((x) => acortar(typeof x === 'string' ? x : (x && x.type) || '?', 50)).join(', ');
    salida.linea(`¿Se puede actualizar Postgres?: ${d.eligible === true ? 'sí' : 'no'}.`);
    salida.linea(`  Versión de la plataforma: ${mostrar(d.current_app_version)}; la última: ${mostrar(d.latest_app_version)}.`);
    const destinos = lista(d.target_upgrade_versions).map((t) => `${acortar(t && t.postgres_version, 20)} (${acortar(t && t.release_channel, 15)})`);
    salida.linea(`  Versiones a las que se puede pasar: ${destinos.length ? destinos.join(', ') : 'ninguna'}${Number.isInteger(d.duration_estimate_hours) ? `; tardaría unas ${d.duration_estimate_hours} h` : ''}.`);
    for (const [campo, texto] of [['unsupported_extensions', 'extensiones no admitidas'], ['objects_to_be_dropped', 'objetos que se borrarían'],
      ['user_defined_objects_in_internal_schemas', 'objetos propios en esquemas internos'], ['legacy_auth_custom_roles', 'roles antiguos de Auth'],
      ['validation_errors', 'errores de validación'], ['warnings', 'avisos']]) {
      if (lista(d[campo]).length) salida.linea(`  ${texto} (${lista(d[campo]).length}): ${nombres(d[campo])}`);
    }
    salida.resumen(`**Postgres:** ${mostrar(db.version)} · se puede actualizar: ${d.eligible === true ? 'sí' : 'no'}.`);
  } else {
    salida.linea(`¿Se puede actualizar Postgres?: no se pudo consultar (${explicarHttp('Supabase', e)}). Esa consulta de Supabase está en beta.`);
  }

  const a = await leerAuth(sb, salida);
  salida.linea('Auth (solo los campos que no son secretos):');
  mostrarCampos(a, CAMPOS_ESTADO, salida);
  const c = compararPlantillas(a, pl);
  salida.linea(`Plantilla de confirmación: ${c.confirmacion ? 'igual' : 'distinta'} que ${PLANTILLAS.confirmacion} · asunto ${c.asuntoConfirmacion ? 'igual' : 'distinto'}.`);
  salida.linea(`Plantilla de recuperación: ${c.recuperacion ? 'igual' : 'distinta'} que ${PLANTILLAS.recuperacion} · asunto ${c.asuntoRecuperacion ? 'igual' : 'distinto'}.`);
  const sinPie = otrasSinPie(a);
  if (sinPie.length) salida.linea(`Otras plantillas de Auth sin la dirección postal en el pie: ${sinPie.join(', ')} (si RWAdar las usa, ponles el pie antes de pasar el SMTP a Lettermint).`);
  salida.resumen(`**Auth:** SMTP ${mostrar(a.smtp_host)} · plantillas: confirmación ${c.confirmacion ? 'igual' : 'distinta'}, recuperación ${c.recuperacion ? 'igual' : 'distinta'}.`);
}

async function plantillas({ entorno, salida }) {
  const pl = leerPlantillas();
  const sb = clienteSupabase(entorno, salida);
  const a = await leerAuth(sb, salida);
  const c = compararPlantillas(a, pl);
  if (Object.values(c).every(Boolean)) {
    salida.linea('Ya están: los dos asuntos y las dos plantillas de Supabase son iguales a los del repositorio. No se cambia nada.');
    salida.resumen('**Plantillas:** ya estaban (no se ha cambiado nada).');
    return;
  }
  // Vuelta atrás: lo que había, como artefacto del flujo (no es secreto).
  const dir = fs.mkdtempSync(path.join(entorno.RUNNER_TEMP || os.tmpdir(), 'plantillas-anteriores-'));
  fs.writeFileSync(path.join(dir, 'confirmar-alta.anterior.html'), String(a.mailer_templates_confirmation_content ?? ''));
  fs.writeFileSync(path.join(dir, 'recuperar-acceso.anterior.html'), String(a.mailer_templates_recovery_content ?? ''));
  fs.writeFileSync(path.join(dir, 'asuntos.anteriores.txt'),
    `Confirm signup: ${a.mailer_subjects_confirmation ?? ''}\nReset password: ${a.mailer_subjects_recovery ?? ''}\n`);
  if (entorno.GITHUB_ENV) fs.appendFileSync(entorno.GITHUB_ENV, `PLANTILLAS_ANTERIORES=${dir}\n`);
  salida.linea(`Vuelta atrás: las de ahora se guardan como artefacto del flujo («plantillas-anteriores»). Asuntos de ahora: «${mostrar(a.mailer_subjects_confirmation)}» y «${mostrar(a.mailer_subjects_recovery)}».`);

  sb.exigir(await sb.pedir('PATCH', `${RUTA}/config/auth`, {
    cuerpo: {
      mailer_subjects_confirmation: pl.asuntoConfirmacion, mailer_subjects_recovery: pl.asuntoRecuperacion,
      mailer_templates_confirmation_content: pl.confirmacion, mailer_templates_recovery_content: pl.recuperacion,
    },
  }), 200, 'poner las plantillas');
  const despues = compararPlantillas(await leerAuth(sb, salida), pl);
  if (!Object.values(despues).every(Boolean)) {
    falla('Supabase aceptó el cambio, pero al leerlo de vuelta alguna plantilla o asunto no coincide con el repositorio. Lanza «estado» y revísalo en Authentication › Emails › Templates.');
  }
  salida.linea(`Puestas: «${pl.asuntoConfirmacion}» (Confirm signup) y «${pl.asuntoRecuperacion}» (Reset password), con las plantillas del repositorio.`);
  salida.resumen('**Plantillas:** puestas y comprobadas (iguales al repositorio).');
}

async function privacidadPublicada() {
  let texto = '', estadoHttp = 0;
  try {
    const r = await fetch(PRIVACIDAD, { headers: { Accept: 'text/html' }, signal: AbortSignal.timeout(30000) });
    estadoHttp = r.status;
    texto = await r.text();
  } catch { estadoHttp = 0; }
  if (estadoHttp !== 200) falla(`No se pudo leer la privacidad publicada (${PRIVACIDAD}, HTTP ${estadoHttp}). No se cambia nada.`);
  const plano = texto.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  if (!plano.includes('autenticación de Supabase a través de Lettermint') || plano.includes('a través de una cuenta de Gmail de RWAdar')) {
    falla(`La privacidad publicada (${PRIVACIDAD}, §6) todavía no dice que los correos de la cuenta salen por Lettermint. Hay que publicarla al día ANTES de cambiar el SMTP (contrato, punto 5.8.2): si no, cada alta y cada recuperación pasarían por un encargado que la privacidad no nombra. No se ha cambiado nada.`);
  }
}

async function smtpLettermint({ entorno, entradas, salida }) {
  // Todo lo que puede faltar, antes de crear nada.
  const sb = clienteSupabase(entorno, salida);
  const lm = clienteLettermint(entorno, salida);
  const pl = leerPlantillas();
  const web = entradas.correoPrueba ? claveWeb() : null;

  salida.linea('1/7 · Supabase: plantillas con la dirección postal');
  const a = await leerAuth(sb, salida);
  const c = compararPlantillas(a, pl);
  if (!c.confirmacion || !c.recuperacion) {
    falla('Las plantillas de Supabase todavía no son las del repositorio (con la dirección postal en el pie, que Lettermint pide en cada correo). Lanza antes la acción «plantillas». No se ha cambiado nada.');
  }
  salida.linea('  Iguales a las del repositorio.');
  const sinPie = otrasSinPie(a);
  if (sinPie.length) salida.aviso(`Otras plantillas de Auth sin la dirección postal: ${sinPie.join(', ')}. Si RWAdar las usa, ponles el pie (plantillas-auth/LEEME.md).`);

  salida.linea('2/7 · La privacidad publicada ya nombra a Lettermint para estos correos');
  await privacidadPublicada();
  salida.linea('  Sí.');

  salida.linea('3/7 · Lettermint: cuenta verificada, dominio verificado y envío real');
  const equipo = objeto(lm.exigir(await lm.pedir('GET', '/team'), 200, 'leer el equipo (para ver si la cuenta está verificada)')) || {};
  if (!equipo.verified_at) {
    falla('Has escrito SI en «cuenta_verificada», pero la API de Lettermint dice que el equipo aún no está verificado (verified_at vacío). No se cambia nada. Si Lettermint ya te ha confirmado la aprobación y esto sigue saliendo, pide a Claude o a Codex que lo revise.');
  }
  const proyecto = await buscarProyecto(lm);
  const detalle = objeto(lm.exigir(await lm.pedir('GET', `/projects/${encodeURIComponent(proyecto.id)}`), 200, 'leer el proyecto')) || {};
  if (detalle.delivery_mode === 'sandbox') falla(`El proyecto «${PROYECTO_LETTERMINT}» está en modo Sandbox: Lettermint simularía los correos y no los entregaría. Pásalo a «live» en su panel. No se ha cambiado nada.`);
  const dominio = await buscarDominio(lm);
  if (!dominio || dominio.status !== 'verified') {
    falla(`El dominio ${DOMINIO} ${dominio ? 'aún no está verificado' : 'no está'} en Lettermint: lanza «verificar-dominio» (o «preparar-dominio») en el flujo «Dominio de correo». No se ha cambiado nada.`);
  }
  salida.linea(`  Cuenta verificada (${fechaCorta(equipo.verified_at)}), ${DOMINIO} verificado y envío real.`);

  salida.linea('4/7 · Supabase: el SMTP de ahora (para volver atrás)');
  mostrarCampos(a, CAMPOS_SMTP, salida);
  salida.resumen('**SMTP antes del cambio (vuelta atrás):**', ...CAMPOS_SMTP.map((k) => `- ${k}: ${mostrar(a[k])}`),
    '- smtp_pass: la contraseña de antes (la de aplicación de Gmail) no se guarda aquí.');
  const viejos = await tokensDelProyecto(lm, proyecto, TOKEN_SMTP);
  const yaLettermint = a.smtp_host === SMTP.host && a.smtp_user === SMTP.usuario;
  if (!entradas.rotar && (viejos.length || yaLettermint)) {
    if (viejos.length && yaLettermint) {
      salida.linea(`Ya está hecho: Supabase usa el SMTP de Lettermint y hay un token «${TOKEN_SMTP}». No se crea otro. Para cambiarlo, relanza con «rotar» = SI.`);
      if (a.smtp_admin_email !== entradas.remitente) salida.linea(`  (Ojo: el remitente de ahora es ${mostrar(a.smtp_admin_email)}, no ${entradas.remitente}. Para cambiarlo, relanza con «rotar» = SI.)`);
      salida.resumen('**SMTP:** ya era Lettermint (no se ha cambiado nada).');
      return pruebaRecuperacion(web, entradas, salida);
    }
    if (viejos.length) falla(`Ya hay un token «${TOKEN_SMTP}» en Lettermint, pero Supabase no usa el SMTP de Lettermint. No se crea otro sin permiso: relanza con «rotar» = SI (se crea uno nuevo, se pone en Supabase y después se borra el viejo).`);
    falla(`Supabase ya usa el SMTP de Lettermint, pero no hay ningún token «${TOKEN_SMTP}» (quizá se pegó a mano otro). No se sustituye sin permiso: relanza con «rotar» = SI; el que hay ahora, bórralo tú en Lettermint después (este flujo no sabe cuál es).`);
  }

  salida.linea('5/7 · Lettermint: SMTP del proyecto activado');
  if (detalle.smtp_enabled !== true) {
    const p = objeto(lm.exigir(await lm.pedir('PUT', `/projects/${encodeURIComponent(proyecto.id)}`, { cuerpo: { smtp_enabled: true } }), 200, 'activar el SMTP del proyecto'));
    if (!p || p.smtp_enabled !== true) falla(`Lettermint no ha activado el SMTP del proyecto «${PROYECTO_LETTERMINT}». Actívalo en su panel (Projects › ${PROYECTO_LETTERMINT} › Enable SMTP) y relanza. No se ha cambiado nada en Supabase.`);
    salida.linea('  Activado ahora.');
  } else salida.linea('  Ya estaba activado.');

  salida.linea(`6/7 · Lettermint: crear «${TOKEN_SMTP}» (se enmascara al llegar y nunca se enseña)`);
  const nuevo = await crearTokenProyecto(lm, proyecto, TOKEN_SMTP, salida);
  if (nuevo.smtp) {
    const s = nuevo.smtp;
    if (s.host !== SMTP.host || s.username !== SMTP.usuario || (Array.isArray(s.ports) && !s.ports.includes(Number(SMTP.puerto)))) {
      const borrado = await borrarTokenProyecto(lm, proyecto, nuevo.id);
      falla(`Lettermint dice que su SMTP es ${acortar(s.host, 60)}, usuario ${acortar(s.username, 40)}, puertos ${acortar(JSON.stringify(s.ports), 40)}, y no lo que dice su guía (${SMTP.host}, ${SMTP.usuario}, ${SMTP.puerto}). No se cambia nada en Supabase${borrado ? ' y se ha borrado el token nuevo' : '; el token nuevo NO se pudo borrar: bórralo en su panel'}. Pide a Claude o a Codex que lo revise.`);
    }
  }
  salida.linea('  Creado.');

  salida.linea('7/7 · Supabase: cambiar el SMTP de Auth a Lettermint');
  const r = await sb.pedir('PATCH', `${RUTA}/config/auth`, {
    cuerpo: {
      smtp_host: SMTP.host, smtp_port: SMTP.puerto, smtp_user: SMTP.usuario, smtp_pass: nuevo.token,
      smtp_admin_email: entradas.remitente, smtp_sender_name: SMTP.nombre,
    },
  });
  if (r.estado !== 200) {
    if (r.estado >= 400 && r.estado < 500 && r.estado !== 408 && r.estado !== 429) {
      const borrado = await borrarTokenProyecto(lm, proyecto, nuevo.id);
      falla(`Supabase rechazó el cambio: el SMTP sigue como estaba. ${explicarHttp('Supabase', r)} ` +
        (borrado ? 'Se ha borrado el token nuevo: no queda ninguno sin usar.' : `El token nuevo NO se pudo borrar: bórralo en Lettermint › Projects › ${PROYECTO_LETTERMINT} › API tokens (el «${TOKEN_SMTP}» de hoy).`));
    }
    falla(`No se sabe si Supabase aplicó el cambio (${explicarHttp('Supabase', r)}). No se borra ningún token, para no dejar Auth sin contraseña. Lanza «estado» para ver el SMTP: si no es el de Lettermint, relanza smtp-lettermint con «rotar» = SI.`);
  }
  const despues = await leerAuth(sb, salida);
  const esperado = { smtp_host: SMTP.host, smtp_port: SMTP.puerto, smtp_user: SMTP.usuario, smtp_admin_email: entradas.remitente, smtp_sender_name: SMTP.nombre };
  const distintos = Object.keys(esperado).filter((k) => String(despues[k] ?? '') !== esperado[k]);
  salida.linea('  SMTP de ahora:');
  mostrarCampos(despues, CAMPOS_SMTP, salida, '    ');
  if (distintos.length) falla(`Supabase aceptó el cambio, pero al leerlo de vuelta no coincide: ${distintos.join(', ')}. Revísalo en Authentication › Emails › SMTP Settings.`);
  const quedan = [];
  for (const t of viejos) {
    if (await borrarTokenProyecto(lm, proyecto, t.id)) salida.linea(`  Borrado el token anterior (creado ${fechaCorta(t.created_at)}).`);
    else quedan.push(fechaCorta(t.created_at));
  }
  salida.resumen(`**SMTP:** ahora Lettermint (${SMTP.host}:${SMTP.puerto}, remitente ${entradas.remitente}).`);
  if (quedan.length) falla(`El SMTP ya usa el token nuevo, pero no se pudo borrar ${quedan.length === 1 ? 'el anterior' : `${quedan.length} anteriores`} (creado ${quedan.join(', ')}). Bórralo en Lettermint › Projects › ${PROYECTO_LETTERMINT} › API tokens.`);
  return pruebaRecuperacion(web, entradas, salida);
}

/* Un correo real de recuperación, pedido como lo pide la web (clave publicable).
   Solo se cuenta el código HTTP: Supabase da 200 aunque la dirección no tenga cuenta. */
async function pruebaRecuperacion(web, entradas, salida) {
  if (!entradas.correoPrueba) {
    salida.linea('Sin «correo_prueba»: no se manda ningún correo. Para probarlo, relanza con tu dirección o usa «¿Has olvidado tu contraseña?» en la web.');
    return;
  }
  let codigo = 0;
  try {
    const r = await fetch(`${web.url}/auth/v1/recover`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30000),
      headers: { apikey: web.clave, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: entradas.correoPrueba }),
    });
    codigo = r.status;
    await r.arrayBuffer();
  } catch { codigo = 0; }
  salida.linea(`Correo de recuperación de prueba a ${entradas.correoPrueba}: HTTP ${codigo}.`);
  salida.resumen(`**Prueba de recuperación** a ${entradas.correoPrueba}: HTTP ${codigo}.`);
  if (codigo === 200) {
    salida.linea('Supabase lo ha aceptado. En el buzón, abre el original: sin píxel, el enlace sin reescribir y la dirección postal en el pie (contrato, punto 5.8.5).');
    return;
  }
  falla(codigo === 429
    ? 'Supabase no deja mandar más correos ahora (HTTP 429: hay un límite por dirección y por hora). Espera unos minutos y pruébalo con «¿Has olvidado tu contraseña?».'
    : `Supabase no pudo mandar el correo de prueba (HTTP ${codigo}). Si el SMTP se acaba de cambiar, puede estar mal: mira «estado» y, si hace falta, vuelve a poner en Supabase › Authentication › Emails › SMTP Settings los datos de antes (están arriba, en «el SMTP de ahora»).`);
}

const HACER = { estado, plantillas, 'smtp-lettermint': smtpLettermint };

export async function main({ argv = process.argv.slice(2), entorno = process.env } = {}) {
  const salida = crearSalida(entorno);
  try {
    const orden = argv[0];
    if (orden !== 'comprobar' && orden !== 'ejecutar') falla('Uso: node rwadar-app/supabase-gestion.mjs comprobar|ejecutar (con ACCION y las demás entradas en el entorno).');
    const entradas = comprobarEntradas(entorno, salida);
    if (orden === 'comprobar') { salida.linea(`Acción: ${entradas.accion}. Entradas correctas.`); return 0; }
    await HACER[entradas.accion]({ entorno, entradas, salida });
    return 0;
  } catch (e) {
    if (e instanceof Parada) {
      salida.linea(`PARADO: ${e.message}`);
      salida.error(e.message);
      salida.resumen('', `**Parado:** ${e.message}`);
      return 1;
    }
    salida.error(`Error inesperado: ${e?.message || e}. Pide a Claude o a Codex que lo revise.`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  process.exitCode = await main();
}

import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
  auditarArchivos,
  CONTROLES_OBLIGATORIOS,
  evaluarEstadoRelanzamiento,
} from './auditar-relanzamiento.mjs';

const require = createRequire(import.meta.url);
const {
  RUTAS_CONTENIDO_APROBADO,
  listarContenidoAprobado,
  comprobarArbolGitLimpio,
  comprobarRevisionGitPublicable,
  huellaContenidoAprobado,
  huellaAlcancePublicacion,
  evaluarPreparacionRelanzamiento,
} = require('../rwadar-publicacion-segura.js');
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AHORA = new Date('2026-09-21T12:00:00.000Z');
const COMMIT_APROBADO = 'a'.repeat(40);
const HEAD = 'b'.repeat(40);

let correctas = 0;
function paso(texto, prueba) {
  assert.ok(prueba, texto);
  correctas += 1;
  console.log(`  OK    ${texto}`);
}

function estadoAprobado() {
  const estado = {
    version: 3,
    perfilPublicacion: 'comercial',
    actividadComercial: { comisiones: false, publicidad: false, atribucion: false, cobros: false },
    actualizadoEl: '2026-09-21',
    publicacionSolicitada: true,
    modeloComercial: 'tarifa-fija-b2b',
    comisionVariableSobreInversion: false,
    nota: 'Corte sintético completo para probar localmente la compuerta de publicación.',
    revisionAprobada: {
      commit: COMMIT_APROBADO,
      contenidoSha256: `sha256:${'c'.repeat(64)}`,
    },
    controles: Object.fromEntries(CONTROLES_OBLIGATORIOS.map((id) => [id, {
      estado: 'aprobado',
      evidencias: [{
        tipo: 'prueba',
        referencia: `docs/evidencias/${id}.md`,
        verificadoEl: '2026-09-21',
        resumen: `Comprobación reproducible y revisada para el control ${id}.`,
      }],
      detalle: 'Comprobado de forma reproducible para esta prueba aislada de la compuerta.',
    }])),
  };
  estado.revisionAprobada.alcanceSha256 = huellaAlcancePublicacion(estado);
  return estado;
}

const publicadorAbierto = 'const MODO_PRIVADO = false;';
const privacidadDocumentada = '<main data-deploy-legal-status="acuerdo-documentado"></main>';
const transparenciaInactiva = '<main data-commercial-status="inactive" data-investor-commission="0"><p data-advertising-status="under-review"></p></main>';
const empresasInactivas = '<main data-partner-status="interest-only" data-commercial-status="legal-approval-pending" data-investor-commission="0"></main>';
const evaluar = manifiesto => evaluarEstadoRelanzamiento({
  manifiesto,
  publicador: publicadorAbierto,
  privacidad: privacidadDocumentada,
  transparencia: transparenciaInactiva,
  empresas: empresasInactivas,
  ahora: AHORA,
});

console.log('=== AUDITORIA DE RELANZAMIENTO ===');

paso('un corte sintético completo y reciente supera la validación documental',
  evaluar(estadoAprobado()).publicable === true);

const editorial = estadoAprobado();
editorial.perfilPublicacion = 'editorial-gratuito';
editorial.modeloComercial = 'publicidad-en-app-pendiente';
for (const id of ['primer_acuerdo_patrocinio', 'facturacion_y_cobro']) {
  editorial.controles[id].estado = 'pendiente';
  editorial.controles[id].evidencias = [];
}
paso('cambiar solo la etiqueta de perfil invalida la revisión anterior',
  evaluar(editorial).bloqueos.some(({ codigo }) => codigo === 'ALCANCE_NO_APROBADO'));
editorial.revisionAprobada.alcanceSha256 = huellaAlcancePublicacion(editorial);
paso('editorial gratuito revisado no exige contrato publicitario ni cuenta de cobro', evaluar(editorial).publicable);
const betaEnCurso = structuredClone(editorial);
betaEnCurso.controles.beta_segura_extremo_a_extremo.estado = 'en_progreso';
paso('preview editorial permite completar QA cuando todos los demás controles están aprobados',
  evaluarPreparacionRelanzamiento(betaEnCurso,{ahora:AHORA,destino:'preview'}).length === 0);
paso('producción continúa bloqueada mientras la beta no está aprobada',
  evaluarPreparacionRelanzamiento(betaEnCurso,{ahora:AHORA}).some(x=>x.codigo==='CONTROL_NO_APROBADO'));
betaEnCurso.controles.beta_segura_extremo_a_extremo.evidencias=[];
paso('preview no acepta beta en curso sin pruebas previas',
  evaluarPreparacionRelanzamiento(betaEnCurso,{ahora:AHORA,destino:'preview'}).some(x=>x.codigo==='CONTROL_NO_APROBADO'));
const sinLegal=structuredClone(editorial);
sinLegal.controles.revision_legal.estado='en_progreso';
paso('preview no omite la revisión legal ni los otros controles',
  evaluarPreparacionRelanzamiento(sinLegal,{ahora:AHORA,destino:'preview'}).some(x=>x.codigo==='CONTROL_NO_APROBADO'));
paso('un destino desconocido no abre una vía de publicación',
  evaluarPreparacionRelanzamiento(editorial,{ahora:AHORA,destino:'otro'}).some(x=>x.codigo==='DESTINO_INVALIDO'));
for (const capacidad of ['comisiones', 'publicidad', 'atribucion', 'cobros']) {
  const activo = structuredClone(editorial);
  activo.actividadComercial[capacidad] = true;
  activo.revisionAprobada.alcanceSha256 = huellaAlcancePublicacion(activo);
  paso(`el perfil editorial no puede activar ${capacidad}`, evaluar(activo).bloqueos.some(
    ({ codigo }) => codigo === 'EDITORIAL_CON_MONETIZACION'));
}
const sinRevisionEditorial = structuredClone(editorial);
sinRevisionEditorial.controles.alcance_editorial_sin_monetizacion.estado = 'pendiente';
paso('editorial exige revisión específica además de los controles comunes', !evaluar(sinRevisionEditorial).publicable);
for (const contenido of ['', transparenciaInactiva.replace('inactive', 'active'),
  transparenciaInactiva + '<div data-advertising-status="under-review"></div>']) {
  paso('editorial rechaza contenido ausente, activo o contradictorio', !evaluarEstadoRelanzamiento({
    manifiesto: editorial, publicador: publicadorAbierto, privacidad: privacidadDocumentada,
    transparencia: contenido, empresas: empresasInactivas, ahora: AHORA,
  }).publicable);
}
const publicidadPendiente = estadoAprobado();
publicidadPendiente.modeloComercial = 'publicidad-en-app-pendiente';
publicidadPendiente.revisionAprobada.alcanceSha256 = huellaAlcancePublicacion(publicidadPendiente);
paso('aprobar controles genéricos no activa publicidad de red', !evaluar(publicidadPendiente).publicable);

paso('la identidad de persona fisica pendiente no publica aunque el manifiesto se marque aprobado',
  evaluarEstadoRelanzamiento({
    manifiesto: estadoAprobado(),
    publicador: publicadorAbierto,
    privacidad: '<main data-deploy-legal-status="identidad-pendiente-de-verificar"></main>',
    ahora: AHORA,
  }).publicable === false);

const sinEvidencia = estadoAprobado();
sinEvidencia.controles.derechos_de_imagen.evidencias = [];
paso('un aprobado sin evidencia falla cerrado',
  evaluar(sinEvidencia).bloqueos.some(({ codigo }) => codigo === 'EVIDENCIA_AUSENTE'));

const evidenciaCadena = estadoAprobado();
evidenciaCadena.controles.derechos_de_imagen.evidencias = ['ok'];
paso('una cadena suelta como evidencia no sustituye el registro estructurado',
  evaluar(evidenciaCadena).bloqueos.some(({ codigo }) => codigo === 'EVIDENCIA_INVALIDA'));

const evidenciaTrivial = estadoAprobado();
evidenciaTrivial.controles.derechos_de_imagen.evidencias = [{
  tipo: 'documento', referencia: 'ok', verificadoEl: '2026-09-21', resumen: 'ok',
}];
paso('una evidencia estructurada pero trivial también falla cerrado',
  evaluar(evidenciaTrivial).bloqueos.some(({ codigo }) => codigo === 'EVIDENCIA_TRIVIAL'));

const fechaImposible = estadoAprobado();
fechaImposible.actualizadoEl = '2026-02-30';
paso('actualizadoEl exige una fecha de calendario ISO real',
  evaluar(fechaImposible).bloqueos.some(({ codigo }) => codigo === 'FECHA_MANIFIESTO_INVALIDA'));

const caducado = estadoAprobado();
caducado.actualizadoEl = '2026-09-13';
paso('el manifiesto caduca después de siete días sin revisión explícita',
  evaluar(caducado).bloqueos.some(({ codigo }) => codigo === 'MANIFIESTO_CADUCADO'));

const revisionIncompleta = estadoAprobado();
revisionIncompleta.revisionAprobada = { commit: 'abc', contenidoSha256: 'ok' };
paso('la aprobación exige commit completo y sha256 completo',
  evaluar(revisionIncompleta).bloqueos.some(({ codigo }) => codigo === 'REVISION_NO_APROBADA'));

const modeloVariable = estadoAprobado();
modeloVariable.comisionVariableSobreInversion = true;
paso('rechaza una comisión variable sobre lo invertido',
  evaluar(modeloVariable).bloqueos.some(({ codigo }) => codigo === 'MODELO_COMERCIAL_NO_APROBADO'));

const conversionPendiente = estadoAprobado();
conversionPendiente.modeloComercial = 'comision-por-conversion-pendiente';
paso('aprobar controles manuales no habilita un motor de comisión aún no validado',
  evaluar(conversionPendiente).bloqueos.some(({ codigo }) => codigo === 'MODELO_COMERCIAL_NO_APROBADO'));

paso('el modo privado impide declarar el corte listo', evaluarEstadoRelanzamiento({
  manifiesto: estadoAprobado(),
  publicador: 'const MODO_PRIVADO = true;',
  privacidad: privacidadDocumentada,
  ahora: AHORA,
}).bloqueos.some(({ codigo }) => codigo === 'MODO_PRIVADO_ACTIVO'));

paso('el acuerdo legal pendiente impide declarar el corte listo', evaluarEstadoRelanzamiento({
  manifiesto: estadoAprobado(),
  publicador: publicadorAbierto,
  privacidad: '<main data-deploy-legal-status="acuerdo-pendiente-de-documentar"></main>',
  ahora: AHORA,
}).bloqueos.some(({ codigo }) => codigo === 'ESTADO_LEGAL_PENDIENTE'));

for (const [caso, privacidad] of [
  ['marcador fuera del main', '<div data-deploy-legal-status="acuerdo-documentado"></div><main></main>'],
  ['dos elementos main', '<main data-deploy-legal-status="acuerdo-documentado"></main><main></main>'],
  ['blocker aún presente', '<main data-deploy-blocker="legal" data-deploy-legal-status="acuerdo-documentado"></main>'],
  ['marcadores duplicados', '<main data-deploy-legal-status="acuerdo-documentado" data-deploy-legal-status="acuerdo-documentado"></main>'],
]) {
  paso(`la auditoría y el publicador rechazan ${caso}`, !evaluarEstadoRelanzamiento({
    manifiesto: estadoAprobado(), publicador: publicadorAbierto, privacidad, ahora: AHORA,
  }).publicable);
}

for (const [caso, publicador] of [
  ['archivo vacío', ''],
  ['bandera ausente', 'console.log("sin decisión de publicación");'],
  ['bandera no literal', 'const MODO_PRIVADO = Boolean(0);'],
  ['declaración comentada', '// const MODO_PRIVADO = false;'],
  ['comentario multilínea', '/*\nconst MODO_PRIVADO = false;\n*/'],
  ['texto de ejemplo', 'const ejemplo = `\nconst MODO_PRIVADO = false;\n`;'],
  ['declaración anidada', 'function ejemplo(){const MODO_PRIVADO = false;}'],
  ['bandera mutable', 'let MODO_PRIVADO = false;'],
  ['valor numérico', 'const MODO_PRIVADO = 0;'],
  ['sintaxis inválida', 'const MODO_PRIVADO = false; const = ;'],
  ['declaraciones duplicadas', 'const MODO_PRIVADO = false; const MODO_PRIVADO = false;'],
]) {
  paso(`la auditoría no supone autorización a partir de ${caso}`, !evaluarEstadoRelanzamiento({
    manifiesto: estadoAprobado(), publicador, privacidad: privacidadDocumentada, ahora: AHORA,
  }).publicable);
}

const efectoAuditoria = '__rwadar_prueba_auditor_no_ejecuta__';
delete globalThis[efectoAuditoria];
evaluarEstadoRelanzamiento({
  manifiesto: estadoAprobado(),
  publicador: `globalThis.${efectoAuditoria}=true; const MODO_PRIVADO = false;`,
  privacidad: privacidadDocumentada, ahora: AHORA,
});
paso('inspeccionar la bandera no ejecuta el código del publicador',
  !Object.hasOwn(globalThis, efectoAuditoria));

function salidaGit(status = 0, stdout = '', stderr = '') {
  return { status, stdout, stderr };
}

function gitLimpio(argumentos) {
  const orden = argumentos.join(' ');
  if (orden === 'rev-parse --show-toplevel') return salidaGit(0, `${RAIZ}\n`);
  if (orden === 'rev-parse --verify HEAD') return salidaGit(0, `${HEAD}\n`);
  if (orden === `rev-parse --verify ${COMMIT_APROBADO}^{commit}`) {
    return salidaGit(0, `${COMMIT_APROBADO}\n`);
  }
  if (argumentos[0] === 'status') return salidaGit();
  if (argumentos[0] === 'merge-base') return salidaGit();
  if (argumentos[0] === 'diff') return salidaGit();
  return salidaGit(2, '', `orden Git inesperada: ${orden}`);
}

const estadoGit = estadoAprobado();
paso('la huella aprobada incluye el helper y los cuatro activos editoriales compartidos',
  RUTAS_CONTENIDO_APROBADO.includes('rwadar-ofertas-editoriales.js')
  && RUTAS_CONTENIDO_APROBADO.includes('rwadar-movil/assets/ofertas-editoriales'));
const dependenciasCatalogo = ['rwadar-app/catalogo-publico.js', 'rwadar-movil/lib/contrato-catalogo.js'];
paso('la revisión incluye el validador del sincronizador y su contrato compartido real',
  dependenciasCatalogo.every(ruta => RUTAS_CONTENIDO_APROBADO.includes(ruta) &&
    listarContenidoAprobado(RAIZ).includes(ruta)));
estadoGit.revisionAprobada.contenidoSha256 = huellaContenidoAprobado(RAIZ);
paso('una revisión limpia acepta un commit ancestro y la huella exacta del contenido',
  comprobarRevisionGitPublicable({ raiz: RAIZ, manifiesto: estadoGit, ejecutarGit: gitLimpio }).head === HEAD);

function gitSucio(argumentos) {
  if (argumentos[0] === 'status') {
    return salidaGit(0, ' M rwadar-site/index.html\n?? rwadar-site/accidental.txt\n');
  }
  return gitLimpio(argumentos);
}
let errorSucio;
try { comprobarArbolGitLimpio({ raiz: RAIZ, ejecutarGit: gitSucio }); }
catch (error) { errorSucio = error; }
paso('cualquier cambio versionado o no versionado bloquea el árbol Git remoto',
  errorSucio?.codigo === 'ARBOL_GIT_SUCIO');

function gitContenidoCambiado(argumentos) {
  if (argumentos[0] === 'diff') return salidaGit(1);
  return gitLimpio(argumentos);
}
let errorCommit;
try {
  comprobarRevisionGitPublicable({
    raiz: RAIZ,
    manifiesto: estadoGit,
    ejecutarGit: gitContenidoCambiado,
  });
} catch (error) { errorCommit = error; }
paso('un cambio protegido posterior al commit aprobado invalida la aprobación',
  errorCommit?.codigo === 'CONTENIDO_NO_APROBADO');

const huellaIncorrecta = structuredClone(estadoGit);
huellaIncorrecta.revisionAprobada.contenidoSha256 = `sha256:${'d'.repeat(64)}`;
let errorHuella;
try {
  comprobarRevisionGitPublicable({
    raiz: RAIZ,
    manifiesto: huellaIncorrecta,
    ejecutarGit: gitLimpio,
  });
} catch (error) { errorHuella = error; }
paso('un árbol limpio no basta si la huella difiere de la aprobada',
  errorHuella?.codigo === 'HUELLA_NO_APROBADA');

const real = auditarArchivos({ ahora: AHORA });
const codigosReales = new Set(real.bloqueos.map(({ codigo }) => codigo));
paso('el auditor real calcula la misma huella que la compuerta del publicador',
  real.contenidoActualSha256 === huellaContenidoAprobado(RAIZ));

console.log(`\n${correctas} correctas, 0 fallidas`);

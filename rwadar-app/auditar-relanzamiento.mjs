import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { parse } from 'acorn';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ_POR_DEFECTO = path.resolve(AQUI, '..');
const require = createRequire(import.meta.url);
const {
  CONTROLES_RELANZAMIENTO,
  comprobarArbolGitLimpio,
  comprobarEstadoLegalPublicacion,
  comprobarContenidoPerfilPublicacion,
  comprobarRevisionGitPublicable,
  evaluarPreparacionRelanzamiento,
  huellaContenidoAprobado,
  huellaAlcancePublicacion,
} = require('../rwadar-publicacion-segura.js');
export const CONTROLES_OBLIGATORIOS = CONTROLES_RELANZAMIENTO;

function bloqueo(codigo, mensaje) {
  return { codigo, mensaje };
}

export function evaluarEstadoRelanzamiento({ manifiesto, publicador, privacidad, transparencia, empresas, ahora }) {
  const bloqueos = evaluarPreparacionRelanzamiento(manifiesto, { ahora });
  try { comprobarContenidoPerfilPublicacion({ manifiesto, transparencia, empresas }); }
  catch (error) { bloqueos.push(bloqueo('CONTENIDO_PERFIL_INCOHERENTE', error.message)); }

  // Analizar, nunca ejecutar el publicador: comentarios, cadenas o declaraciones
  // en funciones no acreditan la decisión global. Lo desconocido queda cerrado.
  let modoPrivado = null;
  try {
    const programa = parse(String(publicador || ''), { ecmaVersion: 2024, sourceType: 'script' });
    const declaraciones = programa.body
      .filter(nodo => nodo.type === 'VariableDeclaration')
      .flatMap(nodo => nodo.declarations.map(declaracion => ({ kind: nodo.kind, declaracion })))
      .filter(({ declaracion }) => declaracion.id.type === 'Identifier' && declaracion.id.name === 'MODO_PRIVADO');
    if (declaraciones.length === 1) {
      const { kind, declaracion } = declaraciones[0];
      if (kind === 'const' && declaracion.init?.type === 'Literal' &&
          typeof declaracion.init.value === 'boolean') modoPrivado = declaracion.init.value;
    }
  } catch { /* Sintaxis desconocida o inválida: no inferir permiso. */ }
  if (modoPrivado === null) {
    bloqueos.push(bloqueo('MODO_PRIVADO_NO_VERIFICABLE',
      'Falta una única declaración global const MODO_PRIVADO con valor booleano literal en código válido.'));
  } else if (modoPrivado) {
    bloqueos.push(bloqueo('MODO_PRIVADO_ACTIVO', 'El publicador remoto permanece bloqueado de forma intencional.'));
  }

  try {
    comprobarEstadoLegalPublicacion(privacidad, { exigirDocumentado: true });
  } catch (error) {
    bloqueos.push(bloqueo('ESTADO_LEGAL_PENDIENTE',
      `La política no supera el mismo control legal que el publicador: ${error.message}`));
  }

  return { publicable: bloqueos.length === 0, bloqueos };
}

export function auditarArchivos({ raiz = RAIZ_POR_DEFECTO, ahora } = {}) {
  const rutaEstado = path.join(raiz, 'rwadar-app', 'data', 'relanzamiento', 'estado.json');
  const rutaPublicador = path.join(raiz, 'rwadar-publicar.js');
  const rutaPrivacidad = path.join(raiz, 'rwadar-site', 'privacidad.html');
  let manifiesto;
  try {
    manifiesto = JSON.parse(fs.readFileSync(rutaEstado, 'utf8'));
  } catch (error) {
    return {
      publicable: false,
      bloqueos: [bloqueo('MANIFIESTO_ILEGIBLE', `No se pudo leer el estado de relanzamiento: ${error.message}`)],
      rutas: { estado: rutaEstado, publicador: rutaPublicador, privacidad: rutaPrivacidad },
    };
  }

  let publicador = '';
  let privacidad = '';
  try { publicador = fs.readFileSync(rutaPublicador, 'utf8'); }
  catch (error) { return { publicable: false, bloqueos: [bloqueo('PUBLICADOR_ILEGIBLE', error.message)] }; }
  try { privacidad = fs.readFileSync(rutaPrivacidad, 'utf8'); }
  catch (error) { return { publicable: false, bloqueos: [bloqueo('PRIVACIDAD_ILEGIBLE', error.message)] }; }

  let transparencia = '';
  let empresas = '';
  try {
    transparencia = fs.readFileSync(path.join(raiz, 'rwadar-site', 'transparencia-comercial.html'), 'utf8');
    empresas = fs.readFileSync(path.join(raiz, 'rwadar-site', 'para-empresas.html'), 'utf8');
  } catch { /* El control editorial rechaza páginas ausentes. */ }
  const resultado = evaluarEstadoRelanzamiento({ manifiesto, publicador, privacidad, transparencia, empresas, ahora });
  let contenidoActualSha256 = null;
  try { contenidoActualSha256 = huellaContenidoAprobado(raiz); }
  catch (error) {
    resultado.bloqueos.push(bloqueo(
      'HUELLA_NO_VERIFICABLE',
      `No se pudo calcular la huella del contenido publicable: ${error.message}`,
    ));
  }

  let git = null;
  try { git = comprobarArbolGitLimpio({ raiz }); }
  catch (error) {
    resultado.bloqueos.push(bloqueo(
      error.codigo || 'GIT_NO_VERIFICABLE',
      `La revisión Git no está lista: ${error.message}`,
    ));
  }

  if (git && !resultado.bloqueos.some(({ codigo }) => codigo === 'REVISION_NO_APROBADA')) {
    try { comprobarRevisionGitPublicable({ raiz, manifiesto }); }
    catch (error) {
      resultado.bloqueos.push(bloqueo(
        error.codigo || 'REVISION_GIT_INVALIDA',
        `La revisión aprobada no coincide con Git: ${error.message}`,
      ));
    }
  }

  return {
    ...resultado,
    publicable: resultado.bloqueos.length === 0,
    actualizadoEl: manifiesto.actualizadoEl,
    perfilPublicacion: manifiesto.perfilPublicacion,
    alcanceActualSha256: huellaAlcancePublicacion(manifiesto),
    contenidoActualSha256,
    head: git && git.head,
    rutas: { estado: rutaEstado, publicador: rutaPublicador, privacidad: rutaPrivacidad },
  };
}

function imprimir(resultado) {
  console.log('=== RWADAR · AUDITORIA LOCAL DE RELANZAMIENTO ===');
  console.log(`Resultado: ${resultado.publicable ? 'LISTO PARA CORTE FINAL' : 'NO PUBLICABLE'}`);
  console.log('Modo: solo lectura, sin red, sin SQL y sin despliegue.');
  if (resultado.actualizadoEl) console.log(`Manifiesto actualizado: ${resultado.actualizadoEl}`);
  if (resultado.perfilPublicacion) console.log(`Perfil: ${resultado.perfilPublicacion}`);
  if (resultado.alcanceActualSha256) console.log(`Huella del alcance: ${resultado.alcanceActualSha256}`);
  if (resultado.head) console.log(`HEAD limpio: ${resultado.head}`);
  if (resultado.contenidoActualSha256) {
    console.log(`Huella actual del contenido: ${resultado.contenidoActualSha256}`);
  }
  if (resultado.bloqueos.length) {
    console.log(`Bloqueos: ${resultado.bloqueos.length}`);
    for (const entrada of resultado.bloqueos) console.log(`- [${entrada.codigo}] ${entrada.mensaje}`);
  }
}

const ejecutadoDirectamente = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (ejecutadoDirectamente) {
  const resultado = auditarArchivos();
  imprimir(resultado);
  process.exitCode = resultado.publicable ? 0 : 1;
}

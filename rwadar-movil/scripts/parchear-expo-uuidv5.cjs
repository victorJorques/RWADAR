#!/usr/bin/env node
/* =====================================================================
   Parche de seguridad para expo-modules-core (iOS) · uuidv5
   ---------------------------------------------------------------------
   QUÉ PASA

   `ios/Uuidv5/Uuidv5.swift` calcula un SHA-1 (20 bytes) y copia los 20
   bytes, uno a uno, dentro de un UUID que solo tiene 16. Los 4 últimos
   caen fuera de su sitio en la memoria (escritura fuera de límites).
   Comprobado en expo-modules-core 57.0.19, 57.0.20 y 58.0.10: Expo no lo
   ha corregido todavía.

   RWAdar no llama a uuidv5 (usa Crypto.randomUUID), así que el riesgo
   práctico es bajo, pero la función va dentro de la app y cualquier
   dependencia podría llamarla. Antes de publicar en la App Store, se
   corrige.

   CÓMO SE CORRIGE

   Se copian solo los 16 primeros bytes del SHA-1, que es lo que dice el
   estándar de UUID v5 (RFC 9562, sección 5.5). El resultado de la función
   no cambia: los 4 bytes que sobraban nunca formaban parte del UUID.

   Se ejecuta solo en cada `npm install` / `npm ci` (postinstall), también
   en los servidores de EAS. Si un día Expo cambia ese archivo, el script
   NO intenta adivinar: se para y avisa para que alguien lo revise.
   ===================================================================== */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const VULNERABLE = 'digest.enumerated().forEach { (bound + $0.offset).pointee = $0.element }';
const CORREGIDO = 'digest.prefix(16).enumerated().forEach { (bound + $0.offset).pointee = $0.element }';
const MARCA = '// RWAdar: solo 16 bytes del SHA-1 (parche de escritura fuera de límites)';

function parchearContenido(texto) {
  if (texto.includes(MARCA) && texto.includes(CORREGIDO) && !texto.includes(VULNERABLE)) {
    return { estado: 'ya-parcheado', texto };
  }
  const apariciones = texto.split(VULNERABLE).length - 1;
  if (apariciones === 1) {
    const sangria = (texto.match(/^([ \t]*)digest\.enumerated\(\)\.forEach/m) || [, ''])[1];
    return {
      estado: 'parcheado',
      texto: texto.replace(VULNERABLE, `${MARCA}\n${sangria}${CORREGIDO}`),
    };
  }
  throw new Error(
    'expo-modules-core cambió ios/Uuidv5/Uuidv5.swift y el parche ya no encaja. ' +
    'Revisa a mano si el fallo de los 20 bytes sigue ahí. Si Expo ya lo ha ' +
    'corregido, borra este script y la línea "postinstall" de rwadar-movil/package.json.');
}

function localizarArchivo(desde = path.resolve(__dirname, '..')) {
  let paquete;
  try {
    paquete = require.resolve('expo-modules-core/package.json', { paths: [desde] });
  } catch {
    return null;
  }
  return path.join(path.dirname(paquete), 'ios', 'Uuidv5', 'Uuidv5.swift');
}

function parchear(archivo = localizarArchivo()) {
  if (!archivo || !fs.existsSync(archivo)) {
    return { estado: 'sin-expo', archivo };
  }
  const original = fs.readFileSync(archivo, 'utf8');
  const resultado = parchearContenido(original);
  if (resultado.estado === 'parcheado') fs.writeFileSync(archivo, resultado.texto);
  return { estado: resultado.estado, archivo };
}

if (require.main === module) {
  try {
    const { estado, archivo } = parchear();
    const mensajes = {
      'sin-expo': 'expo-modules-core no está instalado; no hay nada que parchear.',
      'ya-parcheado': 'expo-modules-core uuidv5 ya estaba parcheado.',
      parcheado: `expo-modules-core uuidv5 parcheado (${path.relative(process.cwd(), archivo)}).`,
    };
    console.log(`[rwadar] ${mensajes[estado]}`);
  } catch (error) {
    console.error(`[rwadar] ${error.message}`);
    process.exit(1);
  }
}

module.exports = { parchear, parchearContenido, localizarArchivo, VULNERABLE, CORREGIDO, MARCA };

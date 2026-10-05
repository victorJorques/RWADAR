'use strict';

// Local, version-bound fix. Register only after review; never runs on Android.
// RWAdar (5/10/2026): NO registrado en app.json. scripts/parchear-expo-uuidv5.cjs
// ya corrige el mismo archivo en cada npm install (también en EAS) y deja una
// huella distinta de PATCHED_SHA256, así que con los dos activos este plugin
// se negaría a seguir y rompería la compilación de iOS. Elegir uno solo antes
// de la primera build de iPhone.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { withDangerousMod, createRunOncePlugin } = require('expo/config-plugins');

const CORE_VERSION = '57.0.19';
const ORIGINAL_SHA256 = 'ecde271563786e5a5fe96a810cf471b8b1c683ee77f800734b29d26a9ce3da73';
const PATCHED_SHA256 = '636e26f83a13e22fc6ea80856774b92b760ebe1a5a19a05aaafe7ce67cd76e47';
const SOURCE_PARTS = ['node_modules', 'expo-modules-core', 'ios', 'Uuidv5', 'Uuidv5.swift'];
const ORIGINAL_BLOCK = `  // Create a tuple for the final UUID
  var uuidTuple = namespace.uuid

  withUnsafeMutablePointer(to: &uuidTuple) { pointer in
    let bound = pointer.withMemoryRebound(to: UInt8.self, capacity: 16) { $0 }
    digest.enumerated().forEach { (bound + $0.offset).pointee = $0.element }
  }`;
const PATCHED_BLOCK = `  // SHA1 has 20 bytes; a UUID uses only its first 16 bytes.
  let uuidTuple: uuid_t = (
    digest[0], digest[1], digest[2], digest[3],
    digest[4], digest[5], digest[6], digest[7],
    digest[8], digest[9], digest[10], digest[11],
    digest[12], digest[13], digest[14], digest[15]
  )`;

const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const refuse = reason => { throw new Error(`RWAdar UUID iOS: ${reason}; no aplicar un parche aproximado.`); };

function transformSwift(source, version) {
  if (version !== CORE_VERSION) refuse('versión ExpoModulesCore no revisada');
  if (!Buffer.isBuffer(source)) refuse('se requieren bytes del archivo original');
  const originalHash = sha256(source);
  if (originalHash === PATCHED_SHA256) return { bytes: Buffer.from(source), changed: false };
  if (originalHash !== ORIGINAL_SHA256) refuse('huella Swift no revisada');
  const contents = source.toString('utf8');
  if (contents.split(ORIGINAL_BLOCK).length !== 2) refuse('bloque Swift no único');
  const bytes = Buffer.from(contents.replace(ORIGINAL_BLOCK, PATCHED_BLOCK), 'utf8');
  if (sha256(bytes) !== PATCHED_SHA256) refuse('resultado Swift inesperado');
  return { bytes, changed: true };
}

function checkedPath(root, parts, file = false) {
  let current = root;
  for (let index = -1; index < parts.length; index += 1) {
    if (index >= 0) current = path.join(current, parts[index]);
    const stat = fs.lstatSync(current);
    const finalFile = file && index === parts.length - 1;
    if (stat.isSymbolicLink() || (finalFile ? !stat.isFile() || stat.nlink !== 1 : !stat.isDirectory())) {
      refuse('ruta no regular o compartida');
    }
    if (path.relative(current, fs.realpathSync(current)) !== '') refuse('ruta redirigida');
  }
  return current;
}

function inspectAndPatch(projectRoot, { introspect = false } = {}) {
  if (typeof projectRoot !== 'string' || !path.isAbsolute(projectRoot)) refuse('raíz de proyecto inválida');
  const root = path.resolve(projectRoot);
  let temporary;
  let temporaryCreated = false;
  try {
    const appPackage = checkedPath(root, ['package.json'], true);
    if (fs.statSync(appPackage).size > 1024 * 1024) refuse('metadatos de proyecto inesperados');
    JSON.parse(fs.readFileSync(appPackage, 'utf8'));
    const packagePath = checkedPath(root, ['node_modules', 'expo-modules-core', 'package.json'], true);
    if (fs.statSync(packagePath).size > 1024 * 1024) refuse('metadatos ExpoModulesCore inesperados');
    if (path.relative(packagePath, require.resolve('expo-modules-core/package.json', { paths: [root] })) !== '') {
      refuse('resolución ExpoModulesCore distinta');
    }
    const metadata = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (metadata.name !== 'expo-modules-core') refuse('identidad del paquete distinta');
    const sourcePath = checkedPath(root, SOURCE_PARTS, true);
    if (fs.statSync(sourcePath).size > 4096) refuse('tamaño Swift inesperado');
    const source = fs.readFileSync(sourcePath);
    const result = transformSwift(source, metadata.version);
    if (introspect || !result.changed) {
      return { status: result.changed ? 'would-patch' : 'already-patched', wrote: false };
    }

    // Atomic replacement, with a fresh source guard before committing the file.
    temporary = sourcePath + '.rwadar-' + crypto.randomBytes(8).toString('hex') + '.tmp';
    const descriptor = fs.openSync(temporary, 'wx', fs.statSync(sourcePath).mode & 0o777);
    temporaryCreated = true;
    try {
      fs.writeFileSync(descriptor, result.bytes);
      fs.fsyncSync(descriptor);
    } finally {
      fs.closeSync(descriptor);
    }
    checkedPath(root, SOURCE_PARTS, true);
    if (!fs.readFileSync(sourcePath).equals(source)) refuse('fuente cambiada durante la revisión');
    fs.renameSync(temporary, sourcePath);
    temporaryCreated = false;
    if (sha256(fs.readFileSync(sourcePath)) !== PATCHED_SHA256) refuse('verificación posterior fallida');
    return { status: 'patched', wrote: true };
  } catch (error) {
    if (error.message.startsWith('RWAdar UUID iOS:')) throw error;
    refuse('archivo, permisos o metadatos no verificables');
  } finally {
    if (temporaryCreated) fs.unlinkSync(temporary);
  }
}

function withIosUuidSeguro(config) {
  return withDangerousMod(config, ['ios', async modConfig => {
    if (modConfig.modRequest.platform !== 'ios') refuse('mod de plataforma distinta');
    inspectAndPatch(modConfig.modRequest.projectRoot, { introspect: modConfig.modRequest.introspect === true });
    return modConfig;
  }]);
}

module.exports = createRunOncePlugin(withIosUuidSeguro, 'rwadar-ios-uuid-seguro', '1.0.0');
module.exports.review = Object.freeze({ CORE_VERSION, ORIGINAL_SHA256, PATCHED_SHA256, transformSwift, inspectAndPatch });

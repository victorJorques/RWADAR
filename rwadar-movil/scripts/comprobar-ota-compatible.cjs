'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// Solo lectura local. --base debe ser el gitCommitHash completo del APK real,
// conservado al compilarlo; no se deduce de HEAD ni se consulta ningún servidor.
function comprobarCompatibilidad({ raiz, base }) {
  if (!/^[a-f0-9]{40}$/.test(base || '')) throw new Error('Indica el commit completo de 40 caracteres del APK con --base.');
  function git(args) {
    const resultado = spawnSync('git', args, { cwd: raiz, encoding: 'utf8', windowsHide: true, maxBuffer: 4 * 1024 * 1024 });
    if (resultado.status !== 0) throw new Error('No se pudo comprobar Git local; no se autoriza la OTA.');
    return resultado.stdout;
  }
  if (git(['rev-parse', '--verify', `${base}^{commit}`]).trim() !== base) throw new Error('El commit del APK no está disponible localmente.');
  const movil = path.join(raiz, 'rwadar-movil');
  const app = JSON.parse(fs.readFileSync(path.join(movil, 'app.json'), 'utf8')).expo;
  const eas = JSON.parse(fs.readFileSync(path.join(movil, 'eas.json'), 'utf8'));
  const anterior = JSON.parse(git(['show', `${base}:rwadar-movil/app.json`])).expo;
  if (app.runtimeVersion?.policy !== 'nativeVersion' || app.android?.runtimeVersion ||
    !Number.isInteger(app.android?.versionCode) || app.android.versionCode < 1 ||
    eas.cli?.appVersionSource !== 'local' || app.updates?.enabled !== true ||
    app.updates.url !== `https://u.expo.dev/${app.extra?.eas?.projectId}` ||
    eas.build?.editorial?.channel !== 'production' || eas.build.editorial.environment !== 'production' ||
    eas.build.editorial.autoIncrement !== false) {
    throw new Error('La configuración no coincide con el circuito Android de OTA revisado.');
  }
  const rutas = new Set([
    '.easignore', '.gitattributes', 'package.json', 'package-lock.json', '.npmrc',
    ...['package.json', 'package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'pnpm-lock.yaml', '.npmrc',
      'app.json', 'app.config.js', 'app.config.ts', 'app.config.mjs', 'app.config.cjs', 'eas.json',
      'react-native.config.js', 'plugins', 'scripts', 'android', 'ios', 'fingerprint.config.js', '.fingerprintignore',
    ].map(ruta => `rwadar-movil/${ruta}`),
  ]);
  // También protege los iconos, fuentes u otros archivos nativos que app.json
  // referencia por ruta, aunque su nombre no cambie al modificar el archivo.
  function referencias(valor) {
    if (typeof valor === 'string' && /^\.\.?\//.test(valor)) {
      const ruta = path.posix.normalize(`rwadar-movil/${valor}`);
      if (ruta.startsWith('../')) throw new Error('Hay una referencia de configuración fuera del repositorio.');
      rutas.add(ruta);
    } else if (Array.isArray(valor)) valor.forEach(referencias);
    else if (valor && typeof valor === 'object') Object.values(valor).forEach(referencias);
  }
  referencias(app); referencias(anterior);
  const cambiadas = git(['diff', '--name-only', '-z', '--no-renames', base, '--', ...rutas]).split('\0').filter(Boolean);
  const nuevas = git(['ls-files', '--others', '--exclude-standard', '-z', '--', ...rutas]).split('\0').filter(Boolean);
  const bloqueo = [...new Set([...cambiadas, ...nuevas])].sort();
  if (bloqueo.length) throw new Error(`Requiere revisión nativa y otro APK: ${bloqueo.join(', ')}`);
  return { ok: true, base, runtime: `${app.android.version || app.version}(${app.android.versionCode})`,
    channel: 'production', scope: 'compatibilidad-local', publicacionAutorizada: false };
}

if (require.main === module) {
  try {
    if (process.argv.length !== 4 || process.argv[2] !== '--base') throw new Error('Uso: node scripts/comprobar-ota-compatible.cjs --base COMMIT_COMPLETO_DEL_APK');
    console.log(JSON.stringify(comprobarCompatibilidad({ raiz: path.resolve(__dirname, '../..'), base: process.argv[3] })));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { comprobarCompatibilidad };

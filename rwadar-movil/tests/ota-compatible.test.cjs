const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { comprobarCompatibilidad } = require('../scripts/comprobar-ota-compatible.cjs');

test('guard real de Git permite JS y rechaza dependencias, configuración, iconos y plugins nuevos', () => {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-ota-guard-'));
  const git = args => {
    const r = spawnSync('git', args, { cwd: raiz, encoding: 'utf8', windowsHide: true });
    assert.equal(r.status, 0, r.stderr); return r.stdout.trim();
  };
  const escribir = (ruta, texto) => { const destino = path.join(raiz, ruta); fs.mkdirSync(path.dirname(destino), { recursive: true }); fs.writeFileSync(destino, texto); };
  const app = { expo: { version: '1.4.1', android: { versionCode: 23 }, runtimeVersion: { policy: 'nativeVersion' },
    icon: './assets/icon.png', extra: { eas: { projectId: 'proyecto' } }, updates: { enabled: true, url: 'https://u.expo.dev/proyecto' } } };
  escribir('rwadar-movil/app.json', JSON.stringify(app));
  escribir('rwadar-movil/eas.json', JSON.stringify({ cli: { appVersionSource: 'local' }, build: { editorial: { channel: 'production', environment: 'production', autoIncrement: false } } }));
  escribir('rwadar-movil/package-lock.json', '{}');
  escribir('rwadar-movil/assets/icon.png', 'icono-original');
  escribir('rwadar-movil/App.js', 'const original = true;');
  git(['init', '--quiet']); git(['add', '.']);
  git(['-c', 'user.name=Prueba local', '-c', 'user.email=local@example.test', 'commit', '--quiet', '-m', 'APK fixture']);
  const base = git(['rev-parse', 'HEAD']);
  const revisar = () => comprobarCompatibilidad({ raiz, base });
  assert.equal(revisar().runtime, '1.4.1(23)');
  escribir('rwadar-movil/App.js', 'const corregido = true;');
  assert.equal(revisar().ok, true, 'un cambio JS es compatible con el runtime');
  for (const [ruta, contenido] of [['rwadar-movil/package-lock.json', '{"cambio":true}'], ['rwadar-movil/assets/icon.png', 'icono-nuevo']]) {
    const original = fs.readFileSync(path.join(raiz, ruta));
    escribir(ruta, contenido);
    assert.throws(revisar, /Requiere revisión nativa y otro APK/);
    fs.writeFileSync(path.join(raiz, ruta), original);
  }
  escribir('rwadar-movil/plugins/nuevo.js', 'module.exports = {};');
  assert.throws(revisar, /plugins\/nuevo.js/);
  git(['add', 'rwadar-movil/plugins/nuevo.js']);
  assert.throws(revisar, /plugins\/nuevo.js/, 'también rechaza el cambio preparado para commit');
  assert.throws(() => comprobarCompatibilidad({ raiz, base: 'HEAD' }), /40 caracteres/);
  assert.throws(() => comprobarCompatibilidad({ raiz, base: 'f'.repeat(40) }), /Git local/);
  console.log(JSON.stringify({ fixture: raiz, runtime: '1.4.1(23)', assertions: 8, remoteCalls: 0 }));
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const plugin = require('../lib/config-ios-uuid-seguro');
const { transformSwift, inspectAndPatch } = plugin.review;

// Exact ExpoModulesCore 57.0.19 MIT source fixture. Tests never patch installed dependencies.
const ORIGINAL = Buffer.from(`import Foundation
import CommonCrypto
import CryptoKit

func uuidv5(name: String, namespace: UUID) -> UUID {
  var spaceUID = namespace.uuid
  var data = withUnsafePointer(to: &spaceUID) { [count = MemoryLayout.size(ofValue: spaceUID)] in
    Data(bytes: $0, count: count)
  }

  data.append(contentsOf: name.utf8)

  // Compute SHA1 digest
  var digest = [UInt8](repeating: 0, count: Int(CC_SHA1_DIGEST_LENGTH))
  data.withUnsafeBytes { (ptr: UnsafeRawBufferPointer) in CC_SHA1(ptr.baseAddress, CC_LONG(data.count), &digest) }

  // Set version bits:
  digest[6] = digest[6] & 0x0F | UInt8(5) << 4
  // Set variant bits:
  digest[8] = digest[8] & 0x3F | 0x80

  // Create a tuple for the final UUID
  var uuidTuple = namespace.uuid

  withUnsafeMutablePointer(to: &uuidTuple) { pointer in
    let bound = pointer.withMemoryRebound(to: UInt8.self, capacity: 16) { $0 }
    digest.enumerated().forEach { (bound + $0.offset).pointee = $0.element }
  }

  // Convert digest to UUID and return
  return UUID(uuid: uuidTuple)
}
`);

const fixtureRoot = path.resolve(__dirname, '../../rwadar-ios112-20260930/correccion-uuid/fixtures');
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function fixture(t, { version = '57.0.19', source = ORIGINAL, name = 'expo-modules-core' } = {}) {
  fs.mkdirSync(fixtureRoot, { recursive: true });
  const root = fs.mkdtempSync(path.join(fixtureRoot, 'uuid-'));
  t.after(() => {
    const relative = path.relative(fixtureRoot, root);
    assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
    fs.rmSync(root, { recursive: true, force: true });
  });
  const packageRoot = path.join(root, 'node_modules', 'expo-modules-core');
  const sourcePath = path.join(packageRoot, 'ios', 'Uuidv5', 'Uuidv5.swift');
  fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'uuid-test-fixture', private: true }));
  fs.writeFileSync(path.join(packageRoot, 'package.json'), JSON.stringify({ name, version }));
  fs.writeFileSync(sourcePath, source);
  return { root, packageRoot, sourcePath };
}

test('la transformación conserva SHA1 y sus bits, y construye exactamente 16 bytes sin puntero de destino', () => {
  const { bytes, changed } = transformSwift(ORIGINAL, '57.0.19');
  assert.equal(changed, true);
  const source = bytes.toString('utf8');
  const beforeTuple = ORIGINAL.toString('utf8').split('  // Create a tuple for the final UUID')[0];
  assert.equal(source.slice(0, beforeTuple.length), beforeTuple);
  assert.ok(source.endsWith('  // Convert digest to UUID and return\n  return UUID(uuid: uuidTuple)\n}\n'));
  const tuple = source.match(/let uuidTuple: uuid_t = \(([\s\S]*?)\n  \)/)[1];
  const indices = [...tuple.matchAll(/digest\[(\d+)\]/g)].map(match => Number(match[1]));
  assert.deepEqual(indices, Array.from({ length: 16 }, (_, index) => index));
  assert.doesNotMatch(source, /withUnsafeMutablePointer|withMemoryRebound|\.pointee|digest\.enumerated/);
  assert.equal(sha256(bytes), '636e26f83a13e22fc6ea80856774b92b760ebe1a5a19a05aaafe7ce67cd76e47');
});

test('selección de la tupla coincide con el vector UUIDv5 del RFC9562 A.4, sin ejecutar Swift', () => {
  const source = transformSwift(ORIGINAL, '57.0.19').bytes.toString('utf8');
  const tuple = source.match(/let uuidTuple: uuid_t = \(([\s\S]*?)\n  \)/)[1];
  const indices = [...tuple.matchAll(/digest\[(\d+)\]/g)].map(match => Number(match[1]));
  const namespace = Buffer.from('6ba7b8109dad11d180b400c04fd430c8', 'hex');
  const digest = crypto.createHash('sha1').update(namespace).update('www.example.com', 'utf8').digest();
  assert.equal(digest.toString('hex'), '2ed6657de927468b55e12665a8aea6a22dee3e35');
  digest[6] = (digest[6] & 0x0f) | 0x50;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  const uuid = Buffer.from(indices.map(index => digest[index])).toString('hex');
  assert.equal(uuid, '2ed6657de927568b95e12665a8aea6a2');
  assert.equal(uuid.length, 32);
});

test('una fuente ya corregida es idempotente y no se acepta otra versión', () => {
  const first = transformSwift(ORIGINAL, '57.0.19');
  const second = transformSwift(first.bytes, '57.0.19');
  assert.equal(second.changed, false);
  assert.deepEqual(second.bytes, first.bytes);
  assert.notEqual(second.bytes, first.bytes);
  assert.throws(() => transformSwift(first.bytes, '57.0.20'), /versión/);
});

test('rechaza fuente alterada, truncada, CRLF o parcialmente corregida', () => {
  const alternatives = [
    Buffer.concat([ORIGINAL, Buffer.from('// otro cambio\n')]),
    ORIGINAL.subarray(0, ORIGINAL.length - 1),
    Buffer.from(ORIGINAL.toString('utf8').replaceAll('\n', '\r\n')),
    Buffer.from(ORIGINAL.toString('utf8').replace('digest.enumerated()', 'digest.prefix(16).enumerated()')),
  ];
  for (const source of alternatives) assert.throws(() => transformSwift(source, '57.0.19'), /huella Swift/);
  assert.throws(() => transformSwift(ORIGINAL.toString('utf8'), '57.0.19'), /bytes/);
});

test('parche de fixture es atómico, idempotente y deja los otros archivos intactos', t => {
  const { root, sourcePath, packageRoot } = fixture(t);
  const packagePath = path.join(packageRoot, 'package.json');
  const sentinel = path.join(packageRoot, 'otra-fuente.swift');
  fs.writeFileSync(sentinel, 'No modificar\n');
  const packageBefore = fs.readFileSync(packagePath);
  assert.deepEqual(inspectAndPatch(root), { status: 'patched', wrote: true });
  const firstStat = fs.statSync(sourcePath);
  const corrected = fs.readFileSync(sourcePath);
  assert.deepEqual(inspectAndPatch(root), { status: 'already-patched', wrote: false });
  assert.equal(fs.statSync(sourcePath).mtimeMs, firstStat.mtimeMs);
  assert.deepEqual(corrected, transformSwift(ORIGINAL, '57.0.19').bytes);
  assert.deepEqual(fs.readFileSync(packagePath), packageBefore);
  assert.equal(fs.readFileSync(sentinel, 'utf8'), 'No modificar\n');
  assert.deepEqual(fs.readdirSync(path.dirname(sourcePath)), ['Uuidv5.swift']);
});

test('introspección revisa pero no escribe una fuente válida', t => {
  const { root, sourcePath } = fixture(t);
  const before = fs.statSync(sourcePath).mtimeMs;
  assert.deepEqual(inspectAndPatch(root, { introspect: true }), { status: 'would-patch', wrote: false });
  assert.deepEqual(fs.readFileSync(sourcePath), ORIGINAL);
  assert.equal(fs.statSync(sourcePath).mtimeMs, before);
});

test('revisión de filesystem rechaza versión, identidad o fuente desconocidas sin escribir', t => {
  for (const options of [
    { version: '57.0.20' },
    { name: 'otro-paquete' },
    { source: Buffer.from('func uuidv5() {}\n') },
  ]) {
    const { root, sourcePath } = fixture(t, options);
    const before = fs.readFileSync(sourcePath);
    assert.throws(() => inspectAndPatch(root), /RWAdar UUID iOS:/);
    assert.deepEqual(fs.readFileSync(sourcePath), before);
  }
});

test('fuente ausente y raíz relativa fallan; una copia por defecto no oculta el error', t => {
  const { root, sourcePath } = fixture(t);
  fs.unlinkSync(sourcePath);
  assert.throws(() => inspectAndPatch(root), /no verificables/);
  assert.equal(fs.existsSync(sourcePath), false);
  assert.throws(() => inspectAndPatch('.'), /raíz/);
});

test('rechaza un paquete redirigido por junction/symlink y no escribe el destino', t => {
  const local = fixture(t);
  const outside = fixture(t);
  fs.rmSync(local.packageRoot, { recursive: true });
  fs.symlinkSync(outside.packageRoot, local.packageRoot, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => inspectAndPatch(local.root), /ruta no regular/);
  assert.deepEqual(fs.readFileSync(outside.sourcePath), ORIGINAL);
});

test('rechaza fuente compartida por hardlink para evitar alterar otro consumidor', t => {
  const { root, sourcePath } = fixture(t);
  const secondPath = path.join(root, 'compartida.swift');
  fs.linkSync(sourcePath, secondPath);
  assert.throws(() => inspectAndPatch(root), /ruta no regular o compartida/);
  assert.deepEqual(fs.readFileSync(secondPath), ORIGINAL);
});

test('plugin se registra una vez solo en iOS y aplica la transformación a una fixture', async t => {
  const { root, sourcePath } = fixture(t);
  const config = plugin({ name: 'Fixture', slug: 'fixture' });
  assert.deepEqual(Object.keys(config.mods), ['ios']);
  const mod = config.mods.ios.dangerous;
  assert.equal(plugin(config).mods.ios.dangerous, mod);
  const evaluated = await mod({ ...config, modRequest: { projectRoot: root, platform: 'ios', introspect: false } });
  assert.equal(evaluated.name, 'Fixture');
  assert.equal(sha256(fs.readFileSync(sourcePath)), '636e26f83a13e22fc6ea80856774b92b760ebe1a5a19a05aaafe7ce67cd76e47');
});

test('mod registrado respeta introspección y rechaza invocación Android', async t => {
  const { root, sourcePath } = fixture(t);
  const config = plugin({ name: 'Fixture', slug: 'fixture' });
  await config.mods.ios.dangerous({ ...config, modRequest: { projectRoot: root, platform: 'ios', introspect: true } });
  assert.deepEqual(fs.readFileSync(sourcePath), ORIGINAL);
  await assert.rejects(config.mods.ios.dangerous({ ...config, modRequest: { projectRoot: root, platform: 'android' } }), /plataforma/);
  assert.deepEqual(fs.readFileSync(sourcePath), ORIGINAL);
});

test('se compone con otro mod iOS sin suprimirlo y conserva la configuración recibida', async t => {
  const { withDangerousMod } = require('expo/config-plugins');
  const { root } = fixture(t);
  let previousModCalled = false;
  const base = withDangerousMod({ name: 'Fixture', slug: 'fixture', version: '1.1.2' }, ['ios', async config => {
    previousModCalled = true;
    return { ...config, extra: { previousMod: true } };
  }]);
  const config = plugin(base);
  const result = await config.mods.ios.dangerous({ ...config, modRequest: { projectRoot: root, platform: 'ios' } });
  assert.equal(previousModCalled, true);
  assert.equal(result.version, '1.1.2');
  assert.deepEqual(result.extra, { previousMod: true });
});

test('JSON de paquete corrupto o fuente corregida alterada fallan sin escribir', t => {
  const local = fixture(t);
  fs.writeFileSync(path.join(local.packageRoot, 'package.json'), '{incompleto');
  assert.throws(() => inspectAndPatch(local.root), /no verificables/);
  assert.deepEqual(fs.readFileSync(local.sourcePath), ORIGINAL);
  const changed = fixture(t, { source: Buffer.concat([transformSwift(ORIGINAL, '57.0.19').bytes, Buffer.from('// cambio\n')]) });
  const before = fs.readFileSync(changed.sourcePath);
  assert.throws(() => inspectAndPatch(changed.root), /huella Swift/);
  assert.deepEqual(fs.readFileSync(changed.sourcePath), before);
});

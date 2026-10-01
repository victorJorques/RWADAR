const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  parchear, parchearContenido, VULNERABLE, CORREGIDO, MARCA,
} = require('../scripts/parchear-expo-uuidv5.cjs');

// Fragmento literal de expo-modules-core 57.0.19, ios/Uuidv5/Uuidv5.swift.
const ORIGINAL = `  var uuidTuple = namespace.uuid

  withUnsafeMutablePointer(to: &uuidTuple) { pointer in
    let bound = pointer.withMemoryRebound(to: UInt8.self, capacity: 16) { $0 }
    digest.enumerated().forEach { (bound + $0.offset).pointee = $0.element }
  }
`;

test('el parche copia solo 16 bytes del SHA-1 y conserva la sangría', () => {
  const { estado, texto } = parchearContenido(ORIGINAL);
  assert.equal(estado, 'parcheado');
  assert.ok(!texto.includes(VULNERABLE));
  assert.ok(texto.includes(`    ${MARCA}\n    ${CORREGIDO}`));
});

test('aplicarlo dos veces no cambia nada', () => {
  const una = parchearContenido(ORIGINAL).texto;
  const dos = parchearContenido(una);
  assert.equal(dos.estado, 'ya-parcheado');
  assert.equal(dos.texto, una);
});

test('si Expo cambia el archivo, se para en vez de adivinar', () => {
  assert.throws(() => parchearContenido('func uuidv5() { /* otra implementación */ }'),
    /cambió ios\/Uuidv5\/Uuidv5.swift/);
  assert.throws(() => parchearContenido(ORIGINAL + ORIGINAL), /cambió/);
});

test('escribe el archivo en disco y es idempotente', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-uuid-'));
  const archivo = path.join(dir, 'Uuidv5.swift');
  fs.writeFileSync(archivo, ORIGINAL);
  assert.equal(parchear(archivo).estado, 'parcheado');
  assert.equal(parchear(archivo).estado, 'ya-parcheado');
  assert.ok(fs.readFileSync(archivo, 'utf8').includes(CORREGIDO));
  assert.equal(parchear(path.join(dir, 'no-existe.swift')).estado, 'sin-expo');
});

test('la instalación lo ejecuta y EAS sube el script', () => {
  const paquete = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  assert.equal(paquete.scripts.postinstall, 'node scripts/parchear-expo-uuidv5.cjs');
});

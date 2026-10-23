/* =====================================================================
   RWAdar · versión mínima segura de Node.js
   ---------------------------------------------------------------------
   El 21/10/2026 Node.js corrigió diez fallos: uno en la descompresión
   Brotli que permite ejecutar código a distancia y varios que saltan la
   comprobación del nombre en los certificados TLS. Las mismas versiones
   dejan de confiar en los certificados intermedios comprometidos de
   eMudhra. Aviso oficial:
   https://nodejs.org/en/blog/vulnerability/october-2026-security-releases

   Los flujos de GitHub que publican, compilan o prueban lo ejecutan antes
   de usar la red: con un Node anterior se paran. El ciclo diario del PC lo
   ejecuta al empezar y, si falla, avisa a Víctor sin detenerse. (No se llama
   desde rwadar-publicar.js porque cambiarlo invalidaría la huella aprobada
   de la publicación.)

   Uso:  node rwadar-node-seguro.js              comprueba el Node que lo ejecuta
         node rwadar-node-seguro.js --comprobar  prueba la tabla de versiones
   ===================================================================== */
const assert = require('assert/strict');

/* Primera versión corregida de cada rama con soporte. Las ramas que no
   aparecen y son anteriores a la última (20, 23, 25…) ya no reciben
   parches; las posteriores (27 en adelante) salen después del arreglo. */
const MINIMAS = Object.freeze({ 22: '22.23.4', 24: '24.22.1', 26: '26.12.1' });
const ULTIMA_RAMA = Math.max(...Object.keys(MINIMAS).map(Number));

function partes(version) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(String(version || ''));
  if (!m) throw new Error(`versión de Node no reconocida: ${version}`);
  return m.slice(1, 4).map(Number);
}

function evaluarNode(version = process.version) {
  const actual = partes(version);
  const rama = actual[0];
  if (rama > ULTIMA_RAMA) return { segura: true, version, minima: null };
  const minima = MINIMAS[rama];
  if (!minima) {
    return { segura: false, version, minima: null,
      motivo: `la rama ${rama} de Node ya no recibe parches de seguridad` };
  }
  const requerida = partes(minima);
  const diferencia = actual.map((n, i) => n - requerida[i]).find(d => d !== 0) || 0;
  return diferencia >= 0
    ? { segura: true, version, minima }
    : { segura: false, version, minima, motivo: `la rama ${rama} necesita ${minima} o posterior` };
}

/* Corta el proceso antes de tocar la red. `herramienta` solo da contexto
   al mensaje. */
function exigirNodeSeguro(herramienta, version = process.version) {
  const r = evaluarNode(version);
  if (r.segura) return r;
  const rama = partes(version)[0];
  console.error(`NODE.JS SIN EL PARCHE DE SEGURIDAD DEL 21/10/2026: se detiene ${herramienta}.`);
  console.error(`Tienes Node ${version}; ${r.motivo}.`);
  console.error(r.minima
    ? `Instala la última de tu rama desde https://nodejs.org/dist/latest-v${rama}.x/ (en Windows, el archivo .msi),`
    : `Instala ${Object.values(MINIMAS).join(', ')} o posterior desde https://nodejs.org/,`);
  console.error('cierra y abre la terminal, comprueba con «node --version» y vuelve a intentarlo.');
  process.exit(2);
}

function comprobar() {
  const casos = {
    'v22.22.0': false, 'v22.23.3': false, 'v22.23.4': true, 'v22.24.0': true,
    'v24.21.9': false, 'v24.22.0': false, 'v24.22.1': true, 'v24.23.0': true,
    'v26.12.0': false, 'v26.12.1': true, 'v26.13.0': true, 'v27.0.0': true,
    'v20.19.5': false, 'v21.7.3': false, 'v23.11.1': false, 'v25.9.0': false,
  };
  for (const [version, esperado] of Object.entries(casos)) {
    assert.equal(evaluarNode(version).segura, esperado, `${version} debería ser ${esperado ? 'segura' : 'insegura'}`);
  }
  assert.throws(() => evaluarNode('desconocida'), /no reconocida/);
  return Object.keys(casos).length;
}

module.exports = { MINIMAS, evaluarNode, exigirNodeSeguro };

if (require.main === module) {
  if (process.argv.includes('--comprobar')) {
    console.log(`Node seguro: ${comprobar()} versiones de la tabla correctas.`);
  } else {
    const r = exigirNodeSeguro('el trabajo que usa la red');
    console.log(`Node ${r.version} lleva el parche de seguridad del 21/10/2026.`);
  }
}

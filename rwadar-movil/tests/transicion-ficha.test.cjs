const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');

function escenario(preferencia = Promise.resolve(false)) {
  const referencias = [], efectos = [], animaciones = [];
  let indiceRef = 0, indiceEfecto = 0, reducir = true, cambio, ultima, cierres = 0;
  const React = {
    useState: () => [reducir, valor => { reducir = valor; }],
    useRef: inicial => referencias[indiceRef++] ||= { current: inicial },
    useCallback: fn => fn,
    useEffect(fn, deps) {
      const indice = indiceEfecto++, anterior = efectos[indice];
      if (!anterior || deps.some((valor, i) => valor !== anterior.deps[i])) {
        anterior?.limpiar?.();
        efectos[indice] = { deps, ejecutar: fn };
      }
    },
  };
  class Valor {
    constructor(valor) { this.valor = valor; }
    setValue(valor) { this.valor = valor; }
    interpolate(config) { return config; }
    stopAnimation() {
      const pendiente = this.pendiente;
      this.pendiente = null;
      pendiente?.({ finished: false });
    }
  }
  const Native = {
    AccessibilityInfo: {
      addEventListener(nombre, fn) { assert.equal(nombre, 'reduceMotionChanged'); cambio = fn; return { remove() { cambio = null; } }; },
      isReduceMotionEnabled: () => preferencia,
    },
    Easing: { quad: 'quad', in: valor => `in:${valor}`, out: valor => `out:${valor}` },
    Animated: { Value: Valor, timing(valor, config) {
      const animacion = { config, valor };
      animaciones.push(animacion);
      return { start(fn) { animacion.fin = fn; valor.pendiente = fn; } };
    } },
  };
  const archivo = path.join(__dirname, '../componentes/useTransicionFicha.js');
  const codigo = babel.transformSync(fs.readFileSync(archivo, 'utf8'), {
    filename: archivo, babelrc: false, configFile: false,
    plugins: [require('@babel/plugin-transform-modules-commonjs')],
  }).code;
  const modulo = { exports: {} };
  new Function('module', 'exports', 'require', codigo)(modulo, modulo.exports,
    nombre => nombre === 'react' ? React : Native);
  function render(visible = true) {
    indiceRef = 0; indiceEfecto = 0;
    ultima = modulo.exports.default(visible, () => cierres++);
    for (const efecto of efectos) if (efecto.ejecutar) {
      const ejecutar = efecto.ejecutar; efecto.ejecutar = null;
      efecto.limpiar = ejecutar();
    }
    return ultima;
  }
  return { render, animaciones, get cierres() { return cierres; },
    cambio: valor => cambio(valor),
    desmontar() { efectos.forEach(efecto => efecto.limpiar?.()); },
  };
}

test('la ficha se abre con transición nativa breve y cierra una sola vez al terminar', async () => {
  const s = escenario(); s.render(); await Promise.resolve();
  const ui = s.render();
  assert.equal(s.animaciones[0].config.duration, 180);
  assert.equal(s.animaciones[0].config.useNativeDriver, true);
  ui.cerrar(); ui.cerrar();
  assert.equal(s.cierres, 0, 'no desmontar a mitad del cierre');
  assert.equal(s.animaciones.length, 2, 'el segundo toque no inicia otro cierre');
  assert.equal(s.animaciones[1].config.duration, 140);
  s.animaciones[1].fin({ finished: true });
  assert.equal(s.cierres, 1);
});

test('reducir movimiento elimina la animación y mantiene el cierre inmediato', async () => {
  const s = escenario(Promise.resolve(true)); s.render(); await Promise.resolve();
  const ui = s.render(); ui.cerrar(); ui.cerrar();
  assert.equal(s.animaciones.length, 0);
  assert.equal(s.cierres, 1);
});

test('cerrar y volver a abrir otra ficha restablece la transición sin bloquear Atrás', async () => {
  const s = escenario(); s.render(); await Promise.resolve();
  s.render().cerrar(); s.animaciones.at(-1).fin({ finished: true });
  assert.equal(s.cierres, 1);
  s.render(false); s.render(true).cerrar();
  s.animaciones.at(-1).fin({ finished: true });
  assert.equal(s.cierres, 2);
});

test('desmontar o interrumpir la transición no ejecuta un cierre tardío', async () => {
  const s = escenario(); s.render(); await Promise.resolve();
  s.render().cerrar();
  const final = s.animaciones.at(-1).fin;
  final({ finished: false }); assert.equal(s.cierres, 0);
  s.desmontar(); final({ finished: true });
  assert.equal(s.cierres, 0);
});

test('activar reducir movimiento durante el cierre lo completa sin dejar la ficha bloqueada', async () => {
  const s = escenario(); s.render(); await Promise.resolve();
  s.render().cerrar(); s.cambio(true); s.render();
  assert.equal(s.cierres, 1);
});

test('un cambio actual de accesibilidad prevalece sobre una consulta inicial tardía', async () => {
  let resolver;
  const s = escenario(new Promise(resolve => { resolver = resolve; }));
  s.render(); s.cambio(true); resolver(false); await Promise.resolve();
  s.render().cerrar();
  assert.equal(s.animaciones.length, 0);
  assert.equal(s.cierres, 1);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const leer = (...partes) => fs.readFileSync(path.join(RAIZ, ...partes), 'utf8');

test('la navegación inferior ofrece cuatro destinos propios y respeta el safe area', () => {
  const codigo = leer('componentes', 'Navegacion.js');

  for (const destino of [
    "['radar', 'Radar', 'radar']",
    "['sigo', 'Siguiendo', 'siguiendo']",
    "['avisos', 'Avisos', 'avisos']",
    "['mas', 'Más', 'mas']",
  ]) assert.ok(codigo.includes(destino), `falta el destino ${destino}`);

  assert.match(codigo, /useSafeAreaInsets\(\)/);
  assert.match(codigo, /paddingBottom: Math\.max\(insets\.bottom, 7\)/);
  assert.match(codigo, /accessibilityRole="tablist"/);
  assert.match(codigo, /accessibilityRole="tab"/);
  assert.match(codigo, /accessibilityState=\{\{ selected: seleccionada \}\}/);
});

test('el rediseño conserva radar, 3D, detalle, descartes, avisos y privacidad', () => {
  const codigo = leer('App.js');

  for (const pantalla of ['radar', 'sigo', 'avisos', 'mas']) {
    assert.ok(codigo.includes(`pestana === '${pantalla}'`), `falta la pantalla ${pantalla}`);
  }

  for (const pieza of [
    '<Radar', '<Detalle', '<Descartadas', '<PanelAvisos', '<Explicador', '<Privacidad',
    'alternarSeguimiento', 'sincronizarSeguimientoPendiente', 'borrarDatosDispositivo',
  ]) assert.ok(codigo.includes(pieza), `el rediseño perdió ${pieza}`);

  assert.match(codigo, /Explicado con una animación 3D/);
  assert.match(codigo, /accessibilityLabel="Buscar plataforma o palabra clave"/);
  assert.match(codigo, /accessibilityLabel=\{sigue \? `Dejar de seguir/);
  assert.match(codigo, /accessibilityLiveRegion="polite"/);
});

test('las dianas y acciones principales comparten mínimos táctiles suficientes', () => {
  const tema = leer('lib', 'tema.js');
  const app = leer('App.js');

  const tactil = Number(tema.match(/tactil:\s*(\d+)/)?.[1]);
  const boton = Number(tema.match(/boton:\s*(\d+)/)?.[1]);
  const nav = Number(tema.match(/nav:\s*(\d+)/)?.[1]);

  assert.ok(tactil >= 44, `mínimo táctil insuficiente: ${tactil}`);
  assert.ok(boton >= 48, `botón principal insuficiente: ${boton}`);
  assert.ok(nav >= 60, `barra inferior insuficiente: ${nav}`);
  assert.match(app, /minHeight: UI\.tactil/);
  assert.match(app, /minHeight: UI\.boton/);
});

test('la nueva interfaz no introduce identidad ni funciones ficticias de la referencia', () => {
  const codigo = `${leer('App.js')}\n${leer('componentes', 'Navegacion.js')}`;

  for (const ajeno of ['Booking.com', 'Genius', 'Reservas', 'Métodos de pago', 'Mi cuenta']) {
    assert.equal(codigo.includes(ajeno), false, `se introdujo texto ajeno: ${ajeno}`);
  }
  assert.match(codigo, /Catálogo conectado y disponible sin crear una cuenta/);
});

// Pruebas de las alertas de precio (sin red; el estado va a una carpeta temporal).
import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'btc-alertas-'));
process.env.BTC_TRADER_ESTADO = path.join(tmp, 'estado');

const { dirEstado } = await import('../lib/comun.mjs');
const A = await import('../lib/alertas.mjs');

after(() => fs.rmSync(tmp, { recursive: true, force: true }));
beforeEach(() => {
  for (const n of ['alertas.json', 'alertas.roto.json']) fs.rmSync(path.join(dirEstado(), n), { force: true });
});

const AHORA = Date.UTC(2026, 10, 14, 10, 22, 30); // 11:22:30 en Madrid
const a = (hh, mm, ss = 0) => Date.UTC(2026, 10, 14, hh, mm, ss);
const vela = (hh, mm, o, h, l, c) => ({ t: a(hh, mm), o, h, l, c, v: 1 });
const RUTA = () => path.join(dirEstado(), 'alertas.json');

test('anadirAlerta guarda en disco con ids por día de Madrid', () => {
  const sobre = A.anadirAlerta({ tipo: 'sobre', nivel: 62000, nota: '  vuelta a 62k  ', ahora: AHORA, precio: 61000 });
  assert.deepEqual(sobre, { id: 'A-20261114-1', tipo: 'sobre', nivel: 62000, nota: 'vuelta a 62k', creada: AHORA, comprobada_hasta: AHORA, saltada: null });
  const bajo = A.anadirAlerta({ tipo: 'bajo', nivel: 60000, ahora: AHORA + 1000 });
  assert.equal(bajo.id, 'A-20261114-2');
  assert.equal(bajo.nota, '');
  // A las 23:30 UTC ya es el 15 en Madrid.
  assert.equal(A.anadirAlerta({ tipo: 'bajo', nivel: 55000, ahora: a(23, 30) }).id, 'A-20261115-1');
  assert.deepEqual(JSON.parse(fs.readFileSync(RUTA(), 'utf8')).alertas.map(x => x.id), ['A-20261114-1', 'A-20261114-2', 'A-20261115-1']);
  assert.deepEqual(A.listarAlertas().map(x => x.id), ['A-20261114-1', 'A-20261114-2', 'A-20261115-1']);
  assert.deepEqual(fs.readdirSync(dirEstado()).filter(n => n.endsWith('.tmp')), []);
});

test('anadirAlerta: errores claros y no crea alertas que saltarían enseguida', () => {
  assert.throws(() => A.anadirAlerta({ tipo: 'encima', nivel: 62000 }), /el tipo debe ser 'sobre' .* o 'bajo' .*; llegó «encima»/);
  assert.throws(() => A.anadirAlerta({ nivel: 62000 }), /llegó nada/);
  for (const nivel of [NaN, -1, 0, '62000', null]) {
    assert.throws(() => A.anadirAlerta({ tipo: 'sobre', nivel }), /el nivel debe ser un precio positivo/);
  }
  assert.throws(() => A.anadirAlerta({ tipo: 'sobre', nivel: 60000, precio: 61000 }),
    /^Error: anadirAlerta: BTC ya está en 61\.000,00 €, por encima de 60\.000,00 €: una alerta «sobre» saltaría enseguida\. ¿Querías «bajo»\?$/);
  assert.throws(() => A.anadirAlerta({ tipo: 'bajo', nivel: 62000, precio: { precio: 61000 } }), /por debajo de 62\.000,00 €.*¿Querías «sobre»\?/);
  assert.equal(fs.existsSync(RUTA()), false, 'nada se ha guardado');
});

test('listar y borrar', () => {
  A.anadirAlerta({ tipo: 'sobre', nivel: 62000, ahora: AHORA });
  A.anadirAlerta({ tipo: 'bajo', nivel: 60000, ahora: AHORA });
  assert.deepEqual(A.borrarAlerta('A-20261114-1').nivel, 62000);
  assert.deepEqual(A.listarAlertas().map(x => x.id), ['A-20261114-2']);
  assert.throws(() => A.borrarAlerta('A-x'), /borrarAlerta: no hay ninguna alerta con id «A-x»\. Hay: A-20261114-2\./);
  A.borrarAlerta('A-20261114-2');
  assert.throws(() => A.borrarAlerta('A-20261114-2'), /No hay alertas\./);
  assert.deepEqual(A.listarAlertas(), []);
});

test('comprobarAlertas: salta con el máximo de las velas posteriores a su creación, y una sola vez', () => {
  A.anadirAlerta({ tipo: 'sobre', nivel: 62000, nota: 'mirar salida', ahora: AHORA });
  A.anadirAlerta({ tipo: 'bajo', nivel: 60000, ahora: AHORA });
  const velas = [
    vela(10, 20, 61000, 62500, 59000, 61000), // se creó a las 10:22:30 dentro de esta vela: no cuenta
    vela(10, 25, 61000, 61900, 60500, 61800),
    vela(10, 30, 61800, 62000, 61700, 61900), // toca 62.000 justo
  ];
  const r = A.comprobarAlertas({ velas, ahora: a(10, 40), intervalo: '5m' });
  assert.equal(r.saltadas.length, 1);
  const s = r.saltadas[0];
  assert.equal(s.id, 'A-20261114-1');
  assert.equal(s.saltada, a(10, 30));
  assert.equal(s.extremo, 62000);
  assert.equal(s.mensaje, 'Alerta A-20261114-1: BTC ha subido a 62.000,00 €. En la vela de las 14/11/2026 11:30 el máximo llegó a 62.000,00 €. Nota: mirar salida');
  assert.equal(r.texto, s.mensaje);
  assert.deepEqual(r.pendientes.map(x => x.id), ['A-20261114-2']);
  assert.equal(r.pendientes[0].comprobada_hasta, a(10, 35));
  // Guardado en disco: la de «sobre» queda como saltada y no vuelve a salir.
  assert.deepEqual(A.listarAlertas().map(x => x.id), ['A-20261114-2']);
  assert.equal(A.listarAlertas({ todas: true }).length, 2);
  const otra = A.comprobarAlertas({ velas: [...velas, vela(10, 40, 61900, 63000, 61800, 62800)], ahora: a(10, 50), intervalo: '5m' });
  assert.deepEqual(otra.saltadas, []);
  assert.equal(otra.texto, 'Ninguna alerta ha saltado (1 pendiente).');
});

test('comprobarAlertas: el precio de ahora también cuenta', () => {
  A.anadirAlerta({ tipo: 'bajo', nivel: 60000, ahora: AHORA });
  const r = A.comprobarAlertas({ velas: [vela(10, 25, 60100, 60200, 60000.01, 60050)], precio: 59999, ahora: a(10, 31), intervalo: '5m' });
  assert.equal(r.saltadas.length, 1);
  assert.equal(r.saltadas[0].saltada, a(10, 31));
  assert.equal(r.saltadas[0].extremo, 59999);
  assert.equal(r.saltadas[0].mensaje, 'Alerta A-20261114-1: BTC ha bajado a 60.000,00 €. El precio de ahora es 59.999,00 € (14/11/2026 11:31).');
  assert.equal(r.texto, r.saltadas[0].mensaje);
  assert.equal(A.comprobarAlertas({ precio: 50000, ahora: a(10, 32) }).texto, 'No hay alertas pendientes.');
});

test('comprobarAlertas: una vela a medias se vuelve a mirar entera; lo ya mirado no cuenta', () => {
  A.anadirAlerta({ tipo: 'bajo', nivel: 60000, ahora: AHORA });
  // 10:33: la de 10:25 cerró sin tocar; la de 10:30 va a medias sin tocar.
  const primera = A.comprobarAlertas({ velas: [vela(10, 25, 60500, 60600, 60200, 60300), vela(10, 30, 60300, 60400, 60100, 60150)], ahora: a(10, 33), intervalo: '5m' });
  assert.deepEqual(primera.saltadas, []);
  assert.equal(primera.pendientes[0].comprobada_hasta, a(10, 30));
  // 10:36: la de 10:25 llega «distinta» (ya mirada: no cuenta) y la de 10:30, entera, bajó a 59.900.
  const segunda = A.comprobarAlertas({ velas: [vela(10, 25, 60500, 60600, 55000, 60300), vela(10, 30, 60300, 60400, 59900, 60000)], ahora: a(10, 36), intervalo: '5m' });
  assert.equal(segunda.saltadas.length, 1);
  assert.equal(segunda.saltadas[0].saltada, a(10, 30));
  assert.equal(segunda.saltadas[0].extremo, 59900);
});

test('comprobarAlertas con la lista en memoria no toca el disco', () => {
  const alertas = [{ id: 'A-1', tipo: 'sobre', nivel: 62000, creada: AHORA }];
  const r = A.comprobarAlertas({ alertas, velas: [vela(10, 25, 61000, 62100, 60900, 62050)], ahora: a(10, 40), intervalo: '5m' });
  assert.equal(r.saltadas.length, 1);
  assert.equal(r.alertas[0].saltada, a(10, 25));
  assert.equal(alertas[0].saltada, undefined, 'la lista de entrada no cambia');
  assert.equal(fs.existsSync(RUTA()), false);
  // También vale { alertas: [...] }.
  assert.equal(A.comprobarAlertas({ alertas: { alertas }, precio: 63000, ahora: a(10, 40) }).saltadas.length, 1);
});

test('entradas raras no rompen; un archivo roto no se pierde en silencio', () => {
  A.anadirAlerta({ tipo: 'sobre', nivel: 62000, ahora: AHORA });
  for (const velas of [null, undefined, [], [null, { t: NaN }, 7], [vela(10, 25, 1, 1, 2, 1)]]) {
    const r = A.comprobarAlertas({ velas, ahora: a(10, 40) });
    assert.deepEqual(r.saltadas, [], JSON.stringify(velas));
  }
  // Una sola vela sin intervalo: se mira (salta si toca) aunque no se sepa si ha cerrado.
  assert.equal(A.comprobarAlertas({ velas: [vela(10, 25, 61000, 62100, 60900, 62050)], ahora: a(10, 40) }).saltadas.length, 1);
  assert.throws(() => A.comprobarAlertas({ alertas: 'muchas' }), /Las alertas deben ser una lista/);
  assert.throws(() => A.comprobarAlertas({ alertas: [{ id: 'A-1', tipo: 'sobre', nivel: -5, creada: AHORA }] }), /la alerta «A-1» no trae un nivel válido \(llegó -5\)/);
  assert.throws(() => A.comprobarAlertas({ alertas: [], velas: [], intervalo: '7m' }), /Intervalo desconocido: «7m»/);
  fs.writeFileSync(RUTA(), '{"alertas": [');
  assert.throws(() => A.listarAlertas(), /están rotas y no se pueden leer; hay una copia en alertas\.roto\.json/);
  assert.equal(fs.readFileSync(path.join(dirEstado(), 'alertas.roto.json'), 'utf8'), '{"alertas": [');
  assert.throws(() => A.anadirAlerta({ tipo: 'sobre', nivel: 70000 }), /están rotas/);
});

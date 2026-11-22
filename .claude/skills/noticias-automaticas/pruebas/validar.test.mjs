// Reglas deterministas V-1 … V-13 (fase editor): un caso bueno y, por cada
// regla, uno malo que la hace saltar. V-14 … V-16: en sello.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { validarEdicion } from '../lib/validar.mjs';
import { RAIZ, GUIA, FECHA, BASE, CONFIG, copia, tmp, escribir, edicionBuena, noticiaDeHoy, titularesDe, inventarioDe } from './ayuda.mjs';

function validar({ edicion = edicionBuena(), titulares = null, inventario = null, referencia = BASE, config = CONFIG, fecha = FECHA, ajustar = null } = {}) {
  const dir = tmp('validar');
  const tit = titulares || titularesDe(edicion, fecha);
  if (ajustar) ajustar({ edicion, titulares: tit });
  escribir(path.join(dir, `noticias-${fecha}.json`), edicion);
  escribir(path.join(dir, 'titulares.json'), tit);
  return validarEdicion({ fase: 'editor', fecha, raiz: RAIZ, config, edicionRuta: path.join(dir, `noticias-${fecha}.json`), titularesRuta: path.join(dir, 'titulares.json'),
    inventario: inventario === null ? inventarioDe(edicion, fecha) : inventario, referencia, rutaGuia: GUIA });
}
const fallan = r => [...new Set(r.reglas.filter(x => !x.ok).map(x => x.id))];

test('la edición buena del 14/11 (la del 13/11 consultada otra vez) pasa las 13 reglas', () => {
  const r = validar();
  assert.deepEqual(r.errores, []);
  assert.equal(r.reglas.length, 13);
  assert.equal(r.soloCambianFechas, true);
});

test('con una de «Hoy» nueva, su foto propia y sus tres propuestas, también pasa', () => {
  const e = edicionBuena(); e.noticias.unshift(noticiaDeHoy());
  const r = validar({ edicion: e });
  assert.deepEqual(r.errores, []);
  assert.equal(r.soloCambianFechas, false);
});

/* «Lo más importante» hasta 8 (22/11/2026, orden de la dirección): la edición de 5
   importantes más 3 nuevas (sin «Hoy») pasa; con una novena, el total (8 como mucho) para. */
function conImportantes(cuantas) {
  const e = edicionBuena(), libres = ['pago-online', 'oro-pepitas', 'fondos-liquidez', 'banco-sala', 'servidores-seguridad'];
  for (let i = 0; i < cuantas; i++) {
    e.noticias.push(noticiaDeHoy(FECHA, { id: `esma-ejemplo-importante-${i + 1}`, seccion: 'importante', fecha: '2026-11-08', imagen: libres[i],
      fuente: { nombre: 'ESMA, consulta de ejemplo', url: `https://www.esma.europa.eu/ejemplo-${i + 1}`, tipo: 'regulador' } }));
  }
  // El orden del motor: a igual sección, de la más nueva a la más antigua.
  e.noticias.sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));
  return e;
}
test('«Lo más importante» admite hasta 8 (config.json, edicion.importanteMax) y el total sigue en 8 como mucho', () => {
  assert.equal(CONFIG.edicion.importanteMax, 8);
  assert.equal(CONFIG.edicion.totalMax, 8);
  const ocho = conImportantes(3);
  assert.equal(ocho.noticias.filter(n => n.seccion === 'importante').length, 8);
  assert.deepEqual(validar({ edicion: ocho }).errores, []);
  const nueve = conImportantes(4);
  const r = validar({ edicion: nueve });
  assert.ok(fallan(r).includes('V-4'), r.errores.join(' | '));
  assert.match(r.errores.join(' '), /9 de «Lo más importante» \(máximo 8\)/);
});

/* Fotos reales (22/11/2026): la app instalada antes de la OTA con los créditos
   las daría por IA y sin el autor que pide su licencia. Con «fotos.realesEnApp»
   en false (como está hasta esa OTA), V-2 para una edición que use una; con
   true, pasa. Sobre una raíz temporal con una foto real en la biblioteca. */
test('V-2: una foto real solo con fotos.realesEnApp en true (después de la OTA con los créditos)', () => {
  assert.equal(CONFIG.fotos.realesEnApp, false, 'hasta enviar la OTA con los créditos, apagado');
  const raiz = tmp('reales');
  try {
    for (const x of ['rwadar-movil', 'rwadar-app', 'rwadar-noticias-editoriales.js']) fs.symlinkSync(path.join(RAIZ, x), path.join(raiz, x));
    const dir = path.join(raiz, 'rwadar-editorial-source/noticias');
    fs.cpSync(path.join(RAIZ, 'rwadar-editorial-source/noticias'), dir, { recursive: true });
    const spec = JSON.parse(fs.readFileSync(path.join(dir, 'fotos.json'), 'utf8'));
    const ia = spec.fotos['red-europea'];
    for (const w of ['', '480', '960']) fs.copyFileSync(path.join(dir, 'fotos', w, 'red-europea.webp'), path.join(dir, 'fotos', w, 'sede-prueba.webp'));
    spec.fotos['sede-prueba'] = { origen: 'foto', descripcion: 'La fachada de piedra de una sede oficial en una calle de Madrid',
      fuente: { sitio: 'Wikimedia Commons', archivo: 'File:Sede de prueba.jpg', pagina: 'https://commons.wikimedia.org/wiki/File:Sede_de_prueba.jpg',
        original: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Sede_de_prueba.jpg', sha256Original: 'a'.repeat(64) },
      licencia: { nombre: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/', atribucionObligatoria: true },
      autor: 'Ana Ejemplo', sinPersonas: true, encuadre: '50% 50%', bytes: ia.bytes, sha256: ia.sha256, temas: ia.temas, variantes: ia.variantes };
    fs.writeFileSync(path.join(dir, 'fotos.json'), JSON.stringify(spec, null, 1) + '\n');
    const edicion = edicionBuena();
    const titulares = titularesDe(edicion);
    edicion.noticias[0].imagen = 'sede-prueba';
    titulares.noticias[0].foto.clave = 'sede-prueba';
    const trabajo = tmp('reales-edicion');
    escribir(path.join(trabajo, `noticias-${FECHA}.json`), edicion);
    escribir(path.join(trabajo, 'titulares.json'), titulares);
    const con = realesEnApp => validarEdicion({ fase: 'editor', fecha: FECHA, raiz, config: { ...CONFIG, fotos: { ...CONFIG.fotos, realesEnApp } },
      edicionRuta: path.join(trabajo, `noticias-${FECHA}.json`), titularesRuta: path.join(trabajo, 'titulares.json'),
      inventario: inventarioDe(edicion, FECHA), referencia: BASE, rutaGuia: GUIA });
    const apagado = con(false);
    assert.deepEqual(fallan(apagado), ['V-2'], apagado.errores.join(' | '));
    assert.match(apagado.errores.join(' '), /fotos reales \(sede-prueba\).*fotos\.realesEnApp/);
    const encendido = con(true);
    assert.deepEqual(encendido.errores, []);
  } finally { fs.rmSync(raiz, { recursive: true, force: true }); }
});

const CASOS = [
  ['V-1', 'actualizadoEl de otro día', ({ edicion }) => { edicion.actualizadoEl = '2026-11-13'; }],
  ['V-1', 'orden distinto del del motor', ({ edicion }) => { edicion.noticias.reverse(); }],
  ['V-2', 'una noticia sin foto', ({ edicion }) => { delete edicion.noticias[0].imagen; }],
  ['V-2', 'una foto que no está en la biblioteca', ({ edicion, titulares }) => { edicion.noticias[0].imagen = 'no-existe'; titulares.noticias[0].foto.clave = 'no-existe'; }],
  ['V-3', 'la misma foto en dos noticias', ({ edicion, titulares }) => { edicion.noticias[1].imagen = edicion.noticias[0].imagen; titulares.noticias[1].foto.clave = edicion.noticias[0].imagen; }],
  ['V-4', '«Hoy» de hace tres días', ({ edicion, titulares }) => { const n = noticiaDeHoy(FECHA, { fecha: '2026-11-11' }); edicion.noticias.unshift(n); titulares.noticias.unshift(titularesDe({ noticias: [n] }).noticias[0]); }],
  ['V-4', '«importante» de hace 31 días', ({ edicion }) => { edicion.noticias.at(-1).fecha = '2026-10-14'; }],
  ['V-4', 'solo dos noticias', ({ edicion, titulares }) => { edicion.noticias.splice(2); titulares.noticias.splice(2); }],
  ['V-6', 'una que ya estaba cambia su fuente', ({ edicion }) => { edicion.noticias[0].fuente.url = 'https://www.cnmv.es/otra'; }],
  ['V-7', 'titular de 61 caracteres', ({ edicion, titulares }) => { const t = 'x'.repeat(61); edicion.noticias[0].titulo = t; titulares.noticias[0].elegido.es = t; titulares.noticias[0].propuestas.es[0] = t; }],
  ['V-8', 'el elegido no está entre las propuestas', ({ titulares }) => { titulares.noticias[0].propuestas.es[0] = 'Otra cosa distinta'; }],
  ['V-8', 'solo dos propuestas y sin «heredado»', ({ titulares }) => { titulares.noticias[0].propuestas.en.pop(); }],
  ['V-8', 'la guía no es la de hoy', ({ titulares }) => { titulares.guia.sha256 = '0'.repeat(64); }],
  ['V-8', 'falta una noticia en titulares.json', ({ titulares }) => { titulares.noticias.pop(); }],
  ['V-8', '«heredado» de un día que no tiene ese titular', ({ titulares }) => { titulares.noticias[0].heredado = '2026-11-13'; }],
  ['V-9', 'genérica sin decir qué foto faltaría', ({ edicion, titulares }) => { titulares.noticias[0].foto.encaje = 'generica'; titulares.noticias[0].foto.faltaria = null; edicion.noticias[0].imagen; }],
  ['V-9', 'foto.clave distinta de la imagen', ({ titulares }) => { titulares.noticias[0].foto.clave = 'red-europea'; }],
  ['V-10', 'una llamada a comprar', ({ edicion }) => { edicion.noticias[0].porQueImporta = 'Compra ya antes de que suba.'; }],
  ['V-10', '«sin riesgo» en una propuesta', ({ titulares }) => { titulares.noticias[0].propuestas.es[1] = 'Rentabilidad sin riesgo'; }],
  ['V-11', 'un tratamiento con nombre', ({ edicion }) => { edicion.noticias[0].resumen = 'Lo anunció el Sr. Ejemplo en Madrid.'; }],
  ['V-11', 'un correo', ({ edicion }) => { edicion.noticias[0].resumen = 'Escribe a alguien@ejemplo.com para más detalles.'; }],
  ['V-11', 'un nombramiento del BOE en una propuesta', ({ titulares }) => { titulares.noticias[0].propuestas.es[2] = 'Se nombra a don Nombre Apellido'; }],
  ['V-12', 'fuente en http', ({ edicion }) => { edicion.noticias[0].fuente.url = 'http://www.cnmv.es/x'; }],
  ['V-13', 'una clave que la edición publicada no tiene', ({ edicion }) => { edicion.noticias[0].en.tituloInformativo = undefined; edicion.noticias[1].nuevaClave = 'x'; }],
];
for (const [regla, nombre, ajustar] of CASOS) {
  test(`${regla} salta: ${nombre}`, () => {
    const r = validar({ ajustar });
    assert.ok(fallan(r).includes(regla), `esperaba ${regla} y fallan ${fallan(r).join(', ') || 'ninguna'}: ${r.errores.join(' | ')}`);
  });
}

test('V-5: una fuente que responde exige consultadaEl de hoy; una caída exige la noticia letra a letra como la publicada', () => {
  const e = edicionBuena(); e.noticias[0].consultadaEl = '2026-11-13';
  assert.ok(fallan(validar({ edicion: e })).includes('V-5'));
  // Fuente caída: se queda como estaba (consultadaEl del 13) → bien.
  const caida = url => url !== BASE.noticias[0].fuente.url;
  const e2 = edicionBuena(); e2.noticias[0] = copia(BASE.noticias[0]);
  assert.deepEqual(validar({ edicion: e2, inventario: inventarioDe(e2, FECHA, caida) }).errores, []);
  // Fuente caída y re-fechada (consultada hoy): no.
  assert.ok(fallan(validar({ edicion: edicionBuena(), inventario: inventarioDe(edicionBuena(), FECHA, caida) })).includes('V-5'));
  // Fuente caída y con una letra cambiada: no.
  const e3 = edicionBuena(); e3.noticias[0] = copia(BASE.noticias[0]); e3.noticias[0].resumen += ' ';
  assert.ok(fallan(validar({ edicion: e3, inventario: inventarioDe(e3, FECHA, caida) })).includes('V-5'));
});

test('V-12: sin el inventario del programa, o con una fuente que no abrió, no pasa', () => {
  const sinInventario = validar({ inventario: false });
  assert.ok(sinInventario.errores.some(e => /V-12 falta el inventario de fuentes del programa/.test(e)), sinInventario.errores.join(' | '));
  const e = edicionBuena(), inv = inventarioDe(e); inv.fuentes.pop();
  assert.ok(fallan(validar({ edicion: e, inventario: inv })).includes('V-12'));
  const inv2 = inventarioDe(e); inv2.fuentes[0].horaUtc = '2026-11-12T08:00:00Z';
  assert.ok(fallan(validar({ edicion: e, inventario: inv2 })).includes('V-12'));
});

test('V-9: la genérica de su categoría con lo que faltaría anotado sí vale', () => {
  const r = validar({ ajustar: ({ titulares, edicion }) => {
    const i = edicion.noticias.findIndex(n => n.categoria === 'riesgo');
    titulares.noticias[i].foto = { clave: edicion.noticias[i].imagen, encaje: 'generica', alternativas: [], faltaria: 'Un buscador de entidades en una pantalla, sin marcas.' };
  } });
  assert.deepEqual(r.errores, []);
});

test('V-7 y V-8 usan el máximo y el mínimo de config.json', () => {
  const config = copia(CONFIG); config.titulares.maxCaracteres = 50;
  assert.ok(fallan(validar({ config })).includes('V-7'));
  config.titulares.maxCaracteres = 60; config.titulares.propuestasMin = 4;
  assert.ok(fallan(validar({ config })).includes('V-8'));
});

test('las fotos genéricas de config.json existen en la biblioteca y, si fotos.json declara las suyas, coinciden (enganche con la guía)', () => {
  const fotos = JSON.parse(fs.readFileSync(path.join(RAIZ, 'rwadar-editorial-source/noticias/fotos.json'), 'utf8'));
  for (const [categoria, clave] of Object.entries(CONFIG.fotos.genericas)) assert.ok(Object.hasOwn(fotos.fotos, clave), `${categoria}: «${clave}» no está en fotos.json`);
  if (fotos.genericas) assert.deepEqual(CONFIG.fotos.genericas, fotos.genericas, 'config.json y fotos.json no dicen las mismas genéricas');
  for (const [clave, f] of Object.entries(fotos.fotos)) {
    if (f.generica === true && Array.isArray(f.categorias)) for (const c of f.categorias) assert.equal(CONFIG.fotos.genericas[c], clave, `fotos.json marca «${clave}» como genérica de ${c}`);
  }
});

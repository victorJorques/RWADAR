#!/usr/bin/env node
/* demo.js · una liga de mentira, con la forma exacta de la de verdad.
   Sirve para ver la app funcionando antes de tener la captura real y
   para que las pruebas tengan contra qué correr. Todo lo que genera
   va marcado con demo:true y la app lo grita en pantalla. */

const fs = require('fs');
const path = require('path');
const carpeta = path.join(__dirname, '..');

/* Aleatorio con semilla: la demo sale igual todas las veces. */
let semilla = 20260825;
function az() { semilla = (semilla * 1664525 + 1013904223) % 4294967296; return semilla / 4294967296; }
function entre(a, b) { return a + az() * (b - a); }
function elige(lista) { return lista[Math.floor(az() * lista.length)]; }

const CANTERA = `
Courtois|RMA|POR|22 Ter Stegen|BAR|POR|18 Oblak|ATM|POR|20 Unai Simón|ATH|POR|17
Remiro|RSO|POR|13 Rulli|VIL|POR|11 Vlachodimos|SEV|POR|8 Dituro|VAL|POR|6
Batalla|RAY|POR|7 Iñaki Peña|CEL|POR|6
Carvajal|RMA|DEF|19 Militao|RMA|DEF|21 Rüdiger|RMA|DEF|18 Mendy|RMA|DEF|14
Cubarsí|BAR|DEF|24 Balde|BAR|DEF|20 Koundé|BAR|DEF|22 Araújo|BAR|DEF|21
Giménez|ATM|DEF|17 Le Normand|ATM|DEF|16 Molina|ATM|DEF|15 Galán|ATM|DEF|11
Vivian|ATH|DEF|16 Yuri|ATH|DEF|12 Foyth|VIL|DEF|14 Pedraza|VIL|DEF|10
Bartra|BET|DEF|11 Perraud|BET|DEF|9 Badé|SEV|DEF|13 Carmona|SEV|DEF|11
Foulquier|VAL|DEF|8 Mosquera|VAL|DEF|10 Aramburu|RSO|DEF|11 Zubeldia|RSO|DEF|10
Blind|GIR|DEF|8 Gutiérrez|GIR|DEF|12 Mingueza|CEL|DEF|13 Starfelt|CEL|DEF|9
Catena|OSA|DEF|10 Areso|OSA|DEF|9 Lejeune|RAY|DEF|10 Balliu|RAY|DEF|8
Valjent|MLL|DEF|10 Maffeo|MLL|DEF|11 Duarte|GET|DEF|8 Iglesias|GET|DEF|7
Bellingham|RMA|MED|38 Valverde|RMA|MED|30 Camavinga|RMA|MED|24 Tchouaméni|RMA|MED|22
Pedri|BAR|MED|33 Gavi|BAR|MED|24 De Jong|BAR|MED|25 Olmo|BAR|MED|29
De Paul|ATM|MED|21 Barrios|ATM|MED|18 Koke|ATM|MED|14 Llorente|ATM|MED|20
Sancet|ATH|MED|21 Ruiz de Galarreta|ATH|MED|12 Parejo|VIL|MED|17 Comesaña|VIL|MED|15
Isco|BET|MED|24 Fornals|BET|MED|16 Lo Celso|BET|MED|17 Sow|SEV|MED|12
Pedrosa|SEV|MED|13 Guerra|VAL|MED|15 Pepelu|VAL|MED|14 Zubimendi|RSO|MED|26
Brais Méndez|RSO|MED|18 Take Kubo|RSO|MED|25 Herrera|GIR|MED|13 Iván Martín|GIR|MED|14
Beltrán|CEL|MED|15 Moriba|CEL|MED|12 Moncayola|OSA|MED|13 Torró|OSA|MED|10
Trejo|RAY|MED|12 Óscar Valentín|RAY|MED|10 Darder|MLL|MED|13 Samu Costa|MLL|MED|12
Arambarri|GET|MED|12 Milla|GET|MED|11 Blanco|ALA|MED|10 Guridi|ALA|MED|11
Mbappé|RMA|DEL|45 Vinícius|RMA|DEL|42 Rodrygo|RMA|DEL|31 Endrick|RMA|DEL|18
Lewandowski|BAR|DEL|34 Yamal|BAR|DEL|40 Raphinha|BAR|DEL|36 Ferran|BAR|DEL|20
Griezmann|ATM|DEL|30 Julián Álvarez|ATM|DEL|35 Sørloth|ATM|DEL|24 Correa|ATM|DEL|14
Nico Williams|ATH|DEL|33 Iñaki Williams|ATH|DEL|21 Guruzeta|ATH|DEL|15
Sørensen|VIL|DEL|18 Pépé|VIL|DEL|16 Antony|BET|DEL|22 Vitor Roque|BET|DEL|17
Lukebakio|SEV|DEL|18 Isaac|SEV|DEL|13 Rafa Mir|VAL|DEL|12 Duro|VAL|DEL|14
Oyarzabal|RSO|DEL|28 Becker|RSO|DEL|15 Stuani|GIR|DEL|13 Tsygankov|GIR|DEL|18
Iago Aspas|CEL|DEL|17 Borja Iglesias|CEL|DEL|14 Budimir|OSA|DEL|18 Raúl García|OSA|DEL|9
De Frutos|RAY|DEL|16 Camello|RAY|DEL|14 Muriqi|MLL|DEL|17 Larin|MLL|DEL|11
Mayoral|GET|DEL|15 Uche|GET|DEL|13 Kike García|ALA|DEL|12 Boyé|ALA|DEL|13
`.trim().split(/\s+(?=[A-ZÁÉÍÓÚÑ])/).map(function (linea) {
  const [nombre, equipo, posicion, valorM] = linea.split('|');
  return { nombre, equipo, posicion, valorBase: Math.round(parseFloat(valorM) * 1000000) };
}).filter(function (j) { return j.nombre && j.equipo && j.valorBase; });

const NOMBRES = [
  'Víctor', 'Dani', 'Álex', 'Javi', 'Marcos', 'Rubén', 'Sergio', 'Nacho'
];
const EQUIPOS = [
  'Los Jorques FC', 'Atlético Sofá', 'Real Cachondeo', 'Deportivo Resaca',
  'Unión Chiringuito', 'CF Sin Piedad', 'Racing de Tuiter', 'Sporting Mileurista'
];

function generar() {
  const pool = CANTERA.slice();
  // Barajar con la misma semilla.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(az() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const porPosicion = { POR: [], DEF: [], MED: [], DEL: [] };
  pool.forEach(function (j) { if (porPosicion[j.posicion]) porPosicion[j.posicion].push(j); });

  const managers = [];
  const plantillasIniciales = {};
  const receta = { POR: 1, DEF: 4, MED: 4, DEL: 3 }; // 12 por manager

  for (let i = 0; i < 8; i++) {
    const id = 'm' + (i + 1);
    const jugadores = [];
    Object.keys(receta).forEach(function (pos) {
      for (let k = 0; k < receta[pos]; k++) {
        const j = porPosicion[pos].shift();
        if (!j) return;
        const valor = Math.round(j.valorBase * entre(0.92, 1.12) / 10000) * 10000;
        jugadores.push({
          id: 'j-' + j.nombre.toLowerCase().replace(/[^a-z]/g, ''),
          nombre: j.nombre, equipo: j.equipo, posicion: j.posicion,
          valor: valor,
          clausula: Math.round(valor * entre(1.8, 2.6) / 10000) * 10000,
          puntos: Math.round(entre(-2, 18))
        });
      }
    });
    /* Los valores reales de LaLiga no caben en un presupuesto de 50 M:
       se escalan para que la plantilla de salida cueste entre 41 y 48. */
    var bruto = jugadores.reduce(function (t, j) { return t + j.valor; }, 0);
    var escala = entre(41000000, 48000000) / bruto;
    jugadores.forEach(function (j) {
      j.valor = Math.round(j.valor * escala / 10000) * 10000;
      j.clausula = Math.round(j.clausula * escala / 10000) * 10000;
    });
    plantillasIniciales[id] = jugadores.map(function (j) { return { id: j.id, nombre: j.nombre, valor: j.valor }; });
    managers.push({
      id: id,
      nombre: NOMBRES[i],
      equipoNombre: EQUIPOS[i],
      puntos: Math.round(entre(4, 22)),
      posicion: i + 1,
      jugadores: jugadores
    });
  }

  /* Unos cuantos movimientos de la J2 para que el libro mayor tenga
     algo que contar: ventas al mercado, un fichaje y una cláusula. */
  const movimientos = [];
  const hoy = new Date('2026-08-25T09:00:00Z');
  function fecha(horasAtras) { return new Date(hoy.getTime() - horasAtras * 3600000).toISOString(); }

  // m3 vende su delantero más caro al mercado.
  const vende = managers[2];
  const vendido = vende.jugadores.slice().sort(function (a, b) { return b.valor - a.valor; })[0];
  vende.jugadores = vende.jugadores.filter(function (j) { return j.id !== vendido.id; });
  movimientos.push({
    fecha: fecha(40), tipo: 'venta', importe: Math.round(vendido.valor * 1.04),
    jugador: vendido.nombre, jugadorId: vendido.id, cobra: vende.id, paga: null
  });

  // m5 le paga la cláusula a m7.
  const compra = managers[4], victima = managers[6];
  const robado = victima.jugadores.slice().sort(function (a, b) { return b.valor - a.valor; })[1];
  victima.jugadores = victima.jugadores.filter(function (j) { return j.id !== robado.id; });
  compra.jugadores.push(robado);
  movimientos.push({
    fecha: fecha(20), tipo: 'clausula', importe: robado.clausula,
    jugador: robado.nombre, jugadorId: robado.id, paga: compra.id, cobra: victima.id
  });

  // m1 (yo) compra un libre en el mercado.
  const libre = porPosicion.MED.shift() || porPosicion.DEL.shift();
  if (libre) {
    const valor = Math.round(libre.valorBase * 0.23 / 10000) * 10000;
    const ficha = {
      id: 'j-' + libre.nombre.toLowerCase().replace(/[^a-z]/g, ''),
      nombre: libre.nombre, equipo: libre.equipo, posicion: libre.posicion,
      valor: valor, clausula: Math.round(valor * 2.2 / 10000) * 10000, puntos: 5
    };
    managers[0].jugadores.push(ficha);
    movimientos.push({
      fecha: fecha(8), tipo: 'compra', importe: Math.round(valor * 1.15),
      jugador: ficha.nombre, jugadorId: ficha.id, paga: managers[0].id, cobra: null
    });
  }

  const mercado = [porPosicion.DEL.shift(), porPosicion.MED.shift(), porPosicion.DEF.shift(), porPosicion.POR.shift()]
    .filter(Boolean).map(function (j) {
      return {
        id: 'j-' + j.nombre.toLowerCase().replace(/[^a-z]/g, ''),
        nombre: j.nombre, equipo: j.equipo, posicion: j.posicion,
        valor: Math.round(j.valorBase * entre(0.20, 0.26) / 10000) * 10000
      };
    });

  return {
    demo: true,
    fuente: 'demo',
    capturado: hoy.toISOString(),
    yo: 'm1',
    liga: { nombre: 'Liga de demostración', jornada: 2, id: 'demo' },
    reglas: JSON.parse(fs.readFileSync(path.join(carpeta, 'reglas.json'), 'utf8')),
    managers: managers,
    plantillasIniciales: plantillasIniciales,
    movimientos: movimientos,
    mercado: mercado
  };
}

if (require.main === module) {
  const datos = generar();
  const escribir = require('./escribir-datos.js');
  escribir(datos, carpeta);
  console.log('Liga de demostración generada: ' + datos.managers.length + ' managers, ' +
    datos.managers.reduce(function (t, m) { return t + m.jugadores.length; }, 0) + ' jugadores, ' +
    datos.movimientos.length + ' movimientos.');
}

module.exports = generar;

#!/usr/bin/env node
// =====================================================================
// RWAdar · la batería de «npm test», repartida en partes para ci.yml
// ---------------------------------------------------------------------
// Desde el 13/11/2026 ci.yml ya no corre «npm test» de una vez (unos
// 3 min 20 s en GitHub): reparte la batería en trabajos que van a la vez.
//
// Las partes salen siempre de los package.json (el de la raíz y el de
// rwadar-app). Una prueba nueva en «npm test» entra sola en alguna parte;
// ninguna se queda fuera ni corre dos veces (.github/flujos.test.mjs).
//
//   node .github/partes-ci.mjs --listar   el reparto, en JSON
//   node .github/partes-ci.mjs bateria-2  ejecuta esa parte (para en el
//                                         primer fallo, como «&&»)
//
// Partes:
//   bateria-1 … bateria-6  las pruebas de rwadar-app (npm run test:db), una
//       a una, y el bloque web (test:web, test:qr, test:tools y test:acceso,
//       juntos y en su orden: las de acceso y probar-orden leen el
//       rwadar-publicado/ que genera test:web). Se reparten por lo que tarda
//       cada una (PESOS) para que las seis acaben a la vez. Son seis (desde el 14/11/2026, con el directo y las noticias automáticas) para
//       que cada parte quede bien por debajo del minuto (GitHub cobra cada
//       trabajo por minutos enteros).
//   movil   npm run test:mobile (lleva sus propias dependencias).
//   sello   las pruebas de la batería que leen el sello
//       (rwadar-app/data/relanzamiento/estado.json). Solo para los PR que no
//       cambian nada más: ver .github/cambios-ci.sh y el trabajo «sello».
// Pruebas: node --test .github/flujos.test.mjs
// =====================================================================
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));

export const PARTES_BATERIA = ['bateria-1', 'bateria-2', 'bateria-3', 'bateria-4', 'bateria-5', 'bateria-6'];

// Segundos que tarda cada orden en GitHub (estimados el 13/11/2026: lo medido
// en local sin Chromium, como en CI, por 1,1; el bloque web, medido en CI).
// Solo sirven para repartir: si una prueba cambia de duración, nada falla.
// Una orden que no está aquí cuenta como PESO_DESCONOCIDO.
export const PESOS = Object.freeze({
  'node probar-db.mjs': 2.5,
  'node probar-cuentas.mjs': 2.5,
  'node probar-reabrir-cuentas.mjs': 14,
  'node probar-cuentas-sesion-confirmada.mjs': 3,
  'node probar-comunidad.mjs': 14,
  'node probar-opiniones.mjs': 2.5,
  'node probar-moderacion.mjs': 2.5,
  'node probar-seguridad.mjs': 2.5,
  'node probar-acl.mjs': 2.5,
  'node probar-push.mjs': 2.5,
  'node probar-correo.mjs': 5,
  'node probar-emisiones.mjs': 2,
  'node probar-cierre-22.mjs': 2.5,
  'node probar-instaladores.mjs': 0.1,
  'node probar-smoke-remoto-estatico.mjs': 0.1,
  'node probar-app-movil-estatico.mjs': 0.1,
  'node probar-escaparate-local.mjs': 0.1,
  'node probar-radar-canonico-local.mjs': 0.1,
  'node probar-verificacion-local-ui.mjs': 0.1,
  'node probar-verificaciones-oficiales-reental.mjs': 0.1,
  'node probar-importacion.mjs': 0.2,
  'node probar-catalogo-publico.mjs': 3,
  'node probar-documentacion-ofertas.mjs': 3,
  'node probar-catalogo-v2.mjs': 4,
  'node probar-catalogo-siempre-disponible.mjs': 3.5,
  'node probar-transparencia-comercial.mjs': 0.1,
  'node probar-para-empresas.mjs': 0.1,
  'node probar-cobro-seguro.mjs': 0.1,
  'node probar-auditoria-relanzamiento.mjs': 0.4,
  'node probar-verificacion.mjs': 6.5,
  'node probar-cartera-cuenta.mjs': 3,
  'node probar-avisos-registrados.mjs': 12,
  'node probar-notificaciones.mjs': 6,
  'node probar-webpush-supabase.mjs': 5.5,
  'node probar-pie-sin-nombre.mjs': 3.5,
  // Notificaciones sin cuenta (migración 36, 14/11/2026).
  'node probar-avisos-sin-cuenta.mjs': 6,
  'node probar-admin-huella.mjs': 14,
  // Gráfico en directo (migración 35, 14/11/2026): cada uno, menos de 25 s.
  'node probar-mercado-directo-regla.mjs': 7,
  'node probar-mercado-directo-base.mjs': 8,
  'node probar-mercado-directo-flujo.mjs': 6,
  // La secuencia de tokens (migración 37, 20/11/2026).
  'node probar-mercado-directo-secuencia.mjs': 9,
  'node --test probar-mapa-buscar.test.cjs': 0.2,
  'node --test ../.claude/skills/investigacion-catalogo/entrega/motor.test.mjs ../.claude/skills/investigacion-catalogo/entrega/flujo.test.mjs': 5.5,
  // Noticias automáticas (14/11/2026): sus pruebas (la de sello.test.mjs hace
  // commits en una copia aparte con git worktree) y la edición publicada. No
  // van en SELLO: hacen su «main» de prueba con un estado.json fijo
  // (pruebas/fijos/estado.json), así que un PR de solo sello no las cambia.
  'node --test ../.claude/skills/noticias-automaticas/pruebas/*.test.mjs': 15,
  'node ../.claude/skills/noticias-automaticas/noticias-auto.mjs validar --publicada': 0.5,
  'node --test ../.github/*.test.mjs': 14,
  'test:web': 10,
  'test:qr': 0.1,
  'test:tools': 1,
  'test:acceso': 19,
  'test:mobile': 35,
});
export const PESO_DESCONOCIDO = 5;

// Lo que la batería comprueba del sello (estado.json), orden a orden. Todas
// son órdenes de «npm test» de rwadar-app; la de flujos.test.mjs va dentro de
// «node --test ../.github/*.test.mjs». Lo que comprueba probar-web.mjs del
// sello (versión 3 y que estén los controles) lo comprueba también la
// compuerta (rwadar-app/auditar-relanzamiento.mjs), que el trabajo «sello»
// corre después.
export const SELLO = Object.freeze([
  'node probar-transparencia-comercial.mjs',
  'node probar-cobro-seguro.mjs',
  'node probar-auditoria-relanzamiento.mjs',
  'node --test ../.github/flujos.test.mjs',
]);
const PRUEBAS_GITHUB = 'node --test ../.github/*.test.mjs';

function guiones(raiz, relativa) {
  const paquete = JSON.parse(fs.readFileSync(path.join(raiz, relativa), 'utf8'));
  return paquete.scripts || {};
}
function trozos(texto, donde) {
  const lista = String(texto || '').split(' && ');
  if (!texto || lista.some(t => !t.trim() || t !== t.trim())) throw new Error(`${donde}: no es una lista de órdenes unidas con « && »`);
  return lista;
}

// La batería entera, en el orden de «npm test»: cada orden de rwadar-app por
// separado y los demás guiones de la raíz enteros.
export function bateria(raiz = RAIZ) {
  const raizG = guiones(raiz, 'package.json'), appG = guiones(raiz, 'rwadar-app/package.json');
  const app = [], web = [], movil = [];
  for (const paso of trozos(raizG.test, 'package.json › test')) {
    const m = /^npm run (test:[a-z-]+)$/.exec(paso);
    if (!m || typeof raizG[m[1]] !== 'string') throw new Error(`package.json › test: «${paso}» no es «npm run test:…» de un guion que exista`);
    if (m[1] === 'test:db') {
      if (raizG['test:db'] !== 'npm --prefix rwadar-app test') throw new Error('package.json › test:db ya no es «npm --prefix rwadar-app test»: actualiza .github/partes-ci.mjs');
      for (const orden of trozos(appG.test, 'rwadar-app/package.json › test')) {
        // Solo «node …» sencillas: cada una se lanza aparte con sh -c.
        if (!/^node [^&|;<>`$()]+$/.test(orden)) throw new Error(`rwadar-app/package.json › test: «${orden}» no es una orden «node …» sencilla`);
        app.push(orden);
      }
    } else if (m[1] === 'test:mobile') movil.push(m[1]);
    else web.push(m[1]);
  }
  if (!app.length || !web.length || !movil.length) throw new Error('npm test ya no tiene base de datos, web y móvil: actualiza .github/partes-ci.mjs');
  return { app, web, movil };
}

const peso = clave => (Object.hasOwn(PESOS, clave) ? PESOS[clave] : PESO_DESCONOCIDO);

// Reparto: de la más larga a la más corta, cada una a la parte que menos
// lleva (empates: el orden de «npm test» y la parte de número más bajo).
// Dentro de cada parte, todo va en el orden de «npm test».
export function repartir({ app, web, movil }) {
  const piezas = [
    ...app.map((orden, i) => ({ i, peso: peso(orden), pasos: [{ dir: 'rwadar-app', orden }] })),
    { i: app.length, peso: web.reduce((s, g) => s + peso(g), 0), pasos: web.map(g => ({ dir: '.', orden: `npm run ${g}` })) },
  ];
  const carga = PARTES_BATERIA.map(() => 0), dentro = PARTES_BATERIA.map(() => []);
  for (const p of [...piezas].sort((a, b) => b.peso - a.peso || a.i - b.i)) {
    const k = carga.indexOf(Math.min(...carga));
    carga[k] += p.peso; dentro[k].push(p);
  }
  const plan = {};
  PARTES_BATERIA.forEach((nombre, k) => {
    plan[nombre] = dentro[k].sort((a, b) => a.i - b.i).flatMap(p => p.pasos);
  });
  plan.movil = movil.map(g => ({ dir: '.', orden: `npm run ${g}` }));
  for (const orden of SELLO) {
    const esta = orden === 'node --test ../.github/flujos.test.mjs' ? app.includes(PRUEBAS_GITHUB) : app.includes(orden);
    if (!esta) throw new Error(`«${orden}» ya no está en npm test de rwadar-app: actualiza SELLO en .github/partes-ci.mjs`);
  }
  plan.sello = SELLO.map(orden => ({ dir: 'rwadar-app', orden }));
  return plan;
}

export function plan(raiz = RAIZ) { return repartir(bateria(raiz)); }

// Ejecuta una parte. Cada orden de rwadar-app con sh -c dentro de rwadar-app
// y con sus node_modules/.bin en el PATH, como lo haría npm. Devuelve el código.
export function ejecutar(parte, { raiz = RAIZ, escribir = t => process.stdout.write(t) } = {}) {
  const todas = plan(raiz);
  if (!Object.hasOwn(todas, parte)) throw new Error(`No hay ninguna parte «${parte}» (hay: ${Object.keys(todas).join(', ')})`);
  const bin = [path.join(raiz, 'rwadar-app', 'node_modules', '.bin'), path.join(raiz, 'node_modules', '.bin')];
  const tiempos = [];
  for (const { dir, orden } of todas[parte]) {
    const cwd = path.join(raiz, dir);
    const env = dir === 'rwadar-app' ? { ...process.env, PATH: [...bin, process.env.PATH].join(path.delimiter) } : process.env;
    escribir(`\n▶ ${orden}${dir === '.' ? '' : `   (en ${dir}/)`}\n`);
    const inicio = Date.now();
    const r = spawnSync('sh', ['-c', orden], { cwd, env, stdio: 'inherit' });
    const segundos = (Date.now() - inicio) / 1000;
    tiempos.push([orden, segundos]);
    if (r.status !== 0) {
      const motivo = r.error ? r.error.message : r.signal ? `señal ${r.signal}` : `código ${r.status}`;
      escribir(`\n✗ Falla «${orden}» (${motivo}) tras ${segundos.toFixed(1)} s.\n`);
      return r.status || 1;
    }
  }
  escribir(`\n✓ Parte ${parte}: ${tiempos.length} órdenes bien. Tiempos (para ajustar PESOS):\n`);
  for (const [orden, s] of tiempos) escribir(`  ${s.toFixed(1).padStart(6)} s  ${orden}\n`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const raizArg = args.find(a => a.startsWith('--raiz='));
  const raiz = raizArg ? path.resolve(raizArg.slice(7)) : RAIZ;
  const resto = args.filter(a => a !== raizArg);
  try {
    if (resto.length === 1 && resto[0] === '--listar') {
      const todas = plan(raiz);
      const resumen = Object.fromEntries(Object.entries(todas).map(([nombre, pasos]) => [nombre, {
        segundos: Math.round(pasos.reduce((s, p) => s + peso(p.dir === '.' ? p.orden.replace(/^npm run /, '') : p.orden), 0) * 10) / 10,
        pasos: pasos.map(p => (p.dir === '.' ? p.orden : `${p.dir}: ${p.orden}`)),
      }]));
      process.stdout.write(JSON.stringify(resumen, null, 2) + '\n');
    } else if (resto.length === 1 && !resto[0].startsWith('-')) {
      process.exitCode = ejecutar(resto[0], { raiz });
    } else {
      process.stderr.write('Uso: node .github/partes-ci.mjs --listar | <parte> [--raiz=CARPETA]\n');
      process.exitCode = 2;
    }
  } catch (e) {
    process.stderr.write(`partes-ci: ${e.message}\n`);
    process.exitCode = 2;
  }
}

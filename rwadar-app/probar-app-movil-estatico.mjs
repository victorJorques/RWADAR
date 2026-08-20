import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const archivo = 'probar-app-movil.mjs';
const codigo = fs.readFileSync(archivo, 'utf8');
let correctas = 0;
const paso = (texto, prueba) => {
  assert.ok(prueba, texto);
  correctas += 1;
  console.log(`  OK    ${texto}`);
};

console.log('=== CONTRATO ESTÁTICO DEL SMOKE MÓVIL ===');
paso('el smoke móvil conserva sintaxis válida',
  spawnSync(process.execPath, ['--check', archivo], { encoding: 'utf8' }).status === 0);
paso('no contiene proyecto ni clave pública predeterminados',
  !/https:\/\/[a-z0-9]{20}\.supabase\.co|sb_publishable_[a-z0-9_-]+/i.test(codigo));
paso('destino y clave móvil se exigen por entorno explícito',
  /RWADAR_MOVIL_SMOKE_URL/.test(codigo)
  && /RWADAR_MOVIL_SMOKE_ANON_KEY/.test(codigo));

const guardaLectura = codigo.indexOf('if (!MUTANTE)');
const primeraEscritura = codigo.indexOf("method: 'POST'");
paso('el modo predeterminado sale antes de cualquier escritura',
  guardaLectura >= 0 && primeraEscritura > guardaLectura);
paso('las mutaciones exigen flag y frase ligada al proyecto',
  /RWADAR_MOVIL_SMOKE_MUTANTE/.test(codigo)
  && /RWADAR_MOVIL_SMOKE_CONFIRMACION/.test(codigo)
  && /PROBAR-MOVIL-MUTACIONES-\$\{referencia\}/.test(codigo));
paso('la limpieza finally comprueba ausencia de dispositivo y seguimiento',
  /finally \{/.test(codigo)
  && /method: 'DELETE'/.test(codigo)
  && /quedaDispositivo/.test(codigo)
  && /quedaSeguimiento/.test(codigo)
  && /limpiezaConfirmada/.test(codigo)
  && /ALERTA: limpieza móvil NO confirmada/.test(codigo));
paso('el smoke no inventa ni envía un token Expo',
  !/ExponentPushToken\[|ExpoPushToken\[/.test(codigo)
  && !/token_push\s*:\s*['"`]/.test(codigo));

const scripts = fs.readdirSync('.').filter((n) => /^probar-.*\.mjs$/.test(n));
const conDestinoDuro = scripts.filter((nombre) => {
  const contenido = fs.readFileSync(nombre, 'utf8');
  return /https:\/\/[a-z0-9]{20}\.supabase\.co/i.test(contenido)
    || /sb_publishable_[a-z0-9_-]{8,}/i.test(contenido);
});
paso('ningún script probar-* conserva endpoint o clave productivos',
  conDestinoDuro.length === 0);

const ref = 'bbbbbbbbbbbbbbbbbbbb';
const simulado = spawnSync(process.execPath,
  ['--import', './pruebas-smoke-fetch-mock.mjs', archivo], {
    encoding: 'utf8',
    env: {
      ...process.env,
      RWADAR_SMOKE_MOCK_ESCENARIO: 'movil_cleanup',
      RWADAR_MOVIL_SMOKE_URL: `https://${ref}.supabase.co`,
      RWADAR_MOVIL_SMOKE_ANON_KEY: 'clave-publica-local-no-real',
      RWADAR_MOVIL_SMOKE_MUTANTE: 'SI',
      RWADAR_MOVIL_SMOKE_CONFIRMACION: `PROBAR-MOVIL-MUTACIONES-${ref}`,
    },
  });
paso('un fallo inyectado tras crear dispositivo ejecuta y verifica cleanup',
  simulado.status === 1
  && simulado.stdout.includes('MOCK_DISPOSITIVO_CREADO')
  && simulado.stdout.includes('MOCK_DISPOSITIVO_BORRADO')
  && simulado.stdout.includes('Limpieza móvil confirmada')
  && !simulado.stdout.includes('limpieza móvil NO confirmada'));

paso('el smoke móvil remoto no forma parte de npm test',
  !fs.readFileSync('package.json', 'utf8').match(/"test"[^\n]*probar-app-movil\.mjs/));

console.log(`\n${correctas} correctas, 0 fallidas`);

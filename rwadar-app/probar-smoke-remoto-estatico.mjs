import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const archivo = 'probar-produccion.mjs';
const codigo = fs.readFileSync(archivo, 'utf8');
let correctas = 0;
const paso = (texto, prueba) => {
  assert.ok(prueba, texto);
  correctas += 1;
  console.log(`  OK    ${texto}`);
};

console.log('=== CONTRATO ESTÁTICO DEL SMOKE REMOTO ===');
paso('el script remoto conserva sintaxis válida',
  spawnSync(process.execPath, ['--check', archivo], { encoding: 'utf8' }).status === 0);
paso('no contiene proyecto ni clave pública predeterminados',
  !/exgpmjpaaebyoolpwced|sb_publishable_/i.test(codigo));
paso('destino y clave se exigen mediante entorno explícito',
  /RWADAR_SMOKE_URL/.test(codigo) && /RWADAR_SMOKE_ANON_KEY/.test(codigo)
  && /\.supabase\.co/.test(codigo));

const guardaLectura = codigo.indexOf('if (!MUTANTE)');
const altaRemota = codigo.indexOf("'/auth/v1/signup'");
paso('el modo predeterminado sale antes de crear una cuenta',
  guardaLectura >= 0 && altaRemota > guardaLectura);
paso('las mutaciones requieren flag y confirmación ligada al proyecto',
  /RWADAR_SMOKE_MUTANTE/.test(codigo)
  && /RWADAR_SMOKE_CONFIRMACION/.test(codigo)
  && /PROBAR-MUTACIONES-\$\{referencia\}/.test(codigo));
paso('toda alta mutante queda protegida por cleanup finally verificable',
  /try \{[\s\S]*\/auth\/v1\/signup[\s\S]*finally \{/m.test(codigo)
  && /borrar_mi_cuenta/.test(codigo)
  && /credencialesRevocadas/.test(codigo)
  && /limpiezaConfirmada/.test(codigo)
  && /ALERTA: limpieza NO confirmada/.test(codigo)
  && !/Cuenta de prueba usada y borrada/.test(codigo));

paso('guardar_opinion usa exclusivamente la firma RPC nueva',
  /\/rpc\/guardar_opinion/.test(codigo)
  && /p_plataforma/.test(codigo) && /p_nota/.test(codigo)
  && /p_texto/.test(codigo)
  && !/guardar_opinion\(\) no existe: se prueba el INSERT/i.test(codigo)
  && !/if \(!opinar\.ok[^}]+opiniones/s.test(codigo));
paso('comprueba rechazo de INSERT, UPDATE y DELETE directos',
  /method: 'POST'[\s\S]*INSERT directo en opiniones está prohibido/.test(codigo)
  && /method: 'PATCH'/.test(codigo) && /method: 'DELETE'/.test(codigo)
  && /code === '42501'/.test(codigo));
paso('la firma vieja debe no existir y la nueva debe rechazar no-admin',
  /p_usuario/.test(codigo) && /p_plataforma/.test(codigo)
  && /noExiste\(firmaVieja\)/.test(codigo)
  && /!noExiste\(firmaNueva\)/.test(codigo)
  && /p_opinion_id/.test(codigo));
paso('el smoke remoto no forma parte del comando de pruebas local',
  !fs.readFileSync('package.json', 'utf8').match(/"test"[^\n]*probar-produccion/));

const ref = 'aaaaaaaaaaaaaaaaaaaa';
const simulado = spawnSync(process.execPath,
  ['--import', './pruebas-smoke-fetch-mock.mjs', archivo], {
    encoding: 'utf8',
    env: {
      ...process.env,
      RWADAR_SMOKE_MOCK_ESCENARIO: 'produccion_cleanup',
      RWADAR_SMOKE_URL: `https://${ref}.supabase.co`,
      RWADAR_SMOKE_ANON_KEY: 'clave-publica-local-no-real',
      RWADAR_SMOKE_MUTANTE: 'SI',
      RWADAR_SMOKE_CONFIRMACION: `PROBAR-MUTACIONES-${ref}`,
    },
  });
paso('un fallo inyectado tras signup ejecuta y verifica la limpieza',
  simulado.status === 1
  && simulado.stdout.includes('MOCK_CUENTA_BORRADA')
  && simulado.stdout.includes('Cuenta de prueba borrada y revocación verificada')
  && !simulado.stdout.includes('limpieza NO confirmada'));

console.log(`\n${correctas} correctas, 0 fallidas`);

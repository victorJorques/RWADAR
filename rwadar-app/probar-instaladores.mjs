import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const nombres = fs.readdirSync(DIR).filter((n) => n.endsWith('.cmd')).sort();
const esperado = [
  'activar-push.cmd',
  'aplicar-envio-avisos.cmd',
  'aplicar-sql.cmd',
  'instalar-base-de-datos.cmd',
];
let correctas = 0;
const paso = (texto, prueba) => {
  assert.ok(prueba, texto);
  correctas += 1;
  console.log(`  OK    ${texto}`);
};
const leer = (nombre) => fs.readFileSync(path.join(DIR, nombre), 'utf8');
const instalador = leer('instalar-base-de-datos.cmd');
const actualizador = leer('aplicar-sql.cmd');
const envio = leer('aplicar-envio-avisos.cmd');
const activadorPush = leer('activar-push.cmd');

console.log('=== PRUEBAS DE INSTALADORES SEGUROS ===');
paso('se auditan todos los scripts batch del backend',
  JSON.stringify(nombres) === JSON.stringify(esperado));

for (const nombre of nombres) {
  const contenido = leer(nombre);
  paso(`${nombre} no acepta credenciales por argumento o prompt`,
    !/set\s+"?(?:token|supabase_access_token)=[^\r\n]*%~[1-9]/i.test(contenido)
    && !/set\s+\/p\s+"?[^\r\n=]*token/i.test(contenido)
    && !/\bsbp_[a-z0-9_-]+/i.test(contenido));
  paso(`${nombre} no contiene el proyecto de producción como destino`,
    !contenido.includes('exgpmjpaaebyoolpwced'));
  paso(`${nombre} exige referencia explícita, confirmación y credencial externa`,
    /set "REF=%~1"/.test(contenido)
    && /if not defined REF goto :uso/.test(contenido)
    && /SUPABASE_ACCESS_TOKEN/.test(contenido)
    && /set \/p "CONFIRMACION=/.test(contenido)
    && /--project-ref "%REF%"/.test(contenido));
  paso(`${nombre} fija el CLI con SemVer exacto y nunca usa latest`,
    /call :validar_cli/.test(contenido)
    && /RWADAR_SUPABASE_CLI_VERSION/.test(contenido)
    && /\[version\]'2\.79\.0'/.test(contenido)
    && /db query --help[\s\S]*link --project-ref/i.test(contenido)
    && /supabase@%RWADAR_SUPABASE_CLI_VERSION%/.test(contenido)
    && !/supabase@latest/i.test(contenido));
  const cierreEsperado = nombre === 'activar-push.cmd'
    ? /db\\push_fallo_cerrado\.sql/i : /db\\fallo_cerrado\.sql/i;
  paso(`${nombre} precomprueba y ejecuta su cierre si falla tras enlazar`,
    cierreEsperado.test(contenido)
    && /set "ENLAZADO=1"/.test(contenido)
    && /:error[\s\S]*if defined ENLAZADO/i.test(contenido));
}

const listaFresh = instalador.match(/set "MIGRACIONES=([^"\r\n]+)"/)?.[1] ?? '';
const ficherosFresh = listaFresh.trim().split(/\s+/);
paso('fresh-install usa 19 ficheros explícitos y llega hasta 22',
  ficherosFresh.length === 19
  && ficherosFresh[0] === 'db\\01_schema.sql'
  && ficherosFresh.at(-1) === 'db\\22_cierre_regresiones.sql');
paso('fresh-install excluye 13, 16 y los retratos no replayables',
  !/(?:13_envio|16_reparacion|14-15_recuperado|RECUPERAR)/i.test(listaFresh));
paso('fresh-install comprueba 26/4 y los tres cierres de seguridad',
  /fresh_install_verificar\.sql/i.test(instalador)
  && /14_seguridad_integral_verificar\.sql/i.test(instalador)
  && /15_acl_funciones_verificar\.sql/i.test(instalador)
  && /22_cierre_regresiones_verificar\.sql/i.test(instalador));
paso('fresh-install declara push apagado y retención diaria activa',
  /PUSH sigue APAGADO y sin cron/i.test(instalador)
  && /retencion diaria queda activa/i.test(instalador));

paso('el actualizador exige un único fichero y no usa globs',
  /set "UNO=%~2"/.test(actualizador)
  && /if not defined UNO goto :uso/.test(actualizador)
  && !/db\\0\[6-9\]/.test(actualizador)
  && !/db\\1\?_\*\.sql/.test(actualizador));
paso('el actualizador solo permite 22 y bloquea históricos/correo/recuperado',
  /if \/i "%UNO%"=="db\\22_cierre_regresiones\.sql" set "PERMITIDO=1"/i
    .test(actualizador)
  && !/do if \/i "%UNO%"/i.test(actualizador)
  && /13 usa aplicar-envio-avisos\.cmd/i.test(actualizador)
  && /16 y 14-15_recuperado\.sql NO se pueden ejecutar/i.test(actualizador));
paso('aplicar 22 ejecuta seguridad y la paridad 26/4 inmediatamente',
  /22_cierre_regresiones\.sql[\s\S]*14_seguridad_integral_verificar\.sql[\s\S]*15_acl_funciones_verificar\.sql[\s\S]*22_cierre_regresiones_verificar\.sql[\s\S]*fresh_install_verificar\.sql/i.test(actualizador));

paso('correo 13 requiere frase reforzada y reafirma 15/22',
  /ACTIVAR-ENVIO-%REF%/.test(envio)
  && /db\\13_envio_avisos\.sql/.test(envio)
  && /db\\15_acl_funciones_verificar\.sql/.test(envio)
  && /db\\22_cierre_regresiones_verificar\.sql/.test(envio));

paso('push exige opt-in E2E, token de entorno y frase reforzada',
  /RWADAR_PUSH_E2E_APROBADO%"=="SI/i.test(activadorPush)
  && /if not defined SUPABASE_ACCESS_TOKEN goto :credencial_ausente/i
    .test(activadorPush)
  && /ACTIVAR-PUSH-E2E-%REF%/.test(activadorPush));
paso('push verifica primero 22 apagado y después su única activación',
  /22_cierre_regresiones_verificar\.sql[\s\S]*activar_push\.sql[\s\S]*activar_push_verificar\.sql/i
    .test(activadorPush)
  && /push_fallo_cerrado\.sql/i.test(activadorPush));

const sql17 = leer(path.join('db', '17_avisos_push.sql'));
const sql22 = leer(path.join('db', '22_cierre_regresiones.sql'));
const sqlActivar = leer(path.join('db', 'activar_push.sql'));
paso('17 y 22 solo desprograman push; el opt-in es quien lo agenda',
  !/cron\.schedule\(\s*'rwadar-push'/i.test(sql17)
  && !/cron\.schedule\(\s*'rwadar-push'/i.test(sql22)
  && /cron\.schedule\(\s*'rwadar-push'/i.test(sqlActivar));

if (process.platform === 'win32') {
  for (const nombre of nombres) {
    const script = path.join(DIR, nombre);
    const sinDestino = spawnSync(process.env.ComSpec,
      ['/d', '/q', '/c', 'call', script],
      { cwd: DIR, encoding: 'utf8', input: '', windowsHide: true });
    paso(`${nombre} falla cerrado sin destino`, sinDestino.status === 1);

    const argsConfirmacion = nombre === 'aplicar-sql.cmd'
      ? [script, 'aaaaaaaaaaaaaaaaaaaa', 'db\\22_cierre_regresiones.sql']
      : [script, 'aaaaaaaaaaaaaaaaaaaa'];
    const entornoConfirmacion = { ...process.env,
      RWADAR_SUPABASE_CLI_VERSION: '2.79.0' };
    if (nombre === 'activar-push.cmd') {
      entornoConfirmacion.SUPABASE_ACCESS_TOKEN = 'token-de-prueba-no-usado';
      entornoConfirmacion.RWADAR_PUSH_E2E_APROBADO = 'SI';
    }
    const sinConfirmar = spawnSync(process.env.ComSpec,
      ['/d', '/q', '/c', 'call', ...argsConfirmacion],
      { cwd: DIR, encoding: 'utf8', input: '', windowsHide: true,
        env: entornoConfirmacion });
    paso(`${nombre} falla cerrado sin confirmación escrita`, sinConfirmar.status === 2);

    const entornoSinVersion = { ...process.env };
    delete entornoSinVersion.RWADAR_SUPABASE_CLI_VERSION;
    const sinVersion = spawnSync(process.env.ComSpec,
      ['/d', '/q', '/c', 'call', ...argsConfirmacion],
      { cwd: DIR, encoding: 'utf8', input: '', windowsHide: true,
        env: entornoSinVersion });
    paso(`${nombre} falla cerrado si no se fija la versión CLI`, sinVersion.status === 1);

    const versionesInvalidas = [
      'latest', '^2.79.0', '2.79', '02.79.0', '2.79.0-beta',
      '2.79.0 ', '2.79.0\n', '2.78.99',
    ];
    const rechazaVersiones = versionesInvalidas.every((version) => {
      const r = spawnSync(process.env.ComSpec,
        ['/d', '/q', '/c', 'call', ...argsConfirmacion],
        { cwd: DIR, encoding: 'utf8', input: '', windowsHide: true,
          env: { ...process.env, RWADAR_SUPABASE_CLI_VERSION: version } });
      return r.status === 1;
    });
    paso(`${nombre} rechaza versiones anteriores, latest, rangos y SemVer ambiguo`,
      rechazaVersiones);
  }

  const basePush = [path.join(DIR, 'activar-push.cmd'), 'aaaaaaaaaaaaaaaaaaaa'];
  const sinE2E = spawnSync(process.env.ComSpec,
    ['/d', '/q', '/c', 'call', ...basePush],
    { cwd: DIR, encoding: 'utf8', input: '', windowsHide: true,
      env: { ...process.env, RWADAR_SUPABASE_CLI_VERSION: '2.79.0',
        SUPABASE_ACCESS_TOKEN: 'token-de-prueba-no-usado',
        RWADAR_PUSH_E2E_APROBADO: 'NO' } });
  paso('activar-push.cmd falla cerrado sin aprobación E2E', sinE2E.status === 1);

  const entornoSinToken = { ...process.env,
    RWADAR_SUPABASE_CLI_VERSION: '2.79.0', RWADAR_PUSH_E2E_APROBADO: 'SI' };
  delete entornoSinToken.SUPABASE_ACCESS_TOKEN;
  const sinToken = spawnSync(process.env.ComSpec,
    ['/d', '/q', '/c', 'call', ...basePush],
    { cwd: DIR, encoding: 'utf8', input: '', windowsHide: true,
      env: entornoSinToken });
  paso('activar-push.cmd falla cerrado sin credencial explícita', sinToken.status === 1);
}

console.log(`\n${correctas} correctas, 0 fallidas`);

// Pruebas sin red del informe «Números de RWAdar» (.github/numeros.mjs).
// node --test .github/numeros.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONSULTA, RELEASES, CLOUDFLARE_GRAPHQL, PANEL, leerCuentas, main } from './numeros.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AHORA = Date.parse('2026-11-09T10:00:00Z');
const URL_DB = 'postgresql://postgres.abc:ContrasenaSecreta123@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });
const CUENTAS = { cuentas: 12, confirmadas: 9, nuevas_7: 2, nuevas_30: 5, entraron_7: 3, entraron_30: 7, salta_rls: true, avisos_correo: 1, con_cartera: 2 };

function fetchFalso({ releases, graphql } = {}) {
  return async (url) => {
    if (url === RELEASES) return releases ? releases() : json([
      { tag_name: 'v1.4.2', published_at: '2026-11-06T10:00:00Z', assets: [{ name: 'RWAdar.apk', download_count: 4 }, { name: 'version-android.json', download_count: 99 }] },
      { tag_name: 'v1.4.1', published_at: '2026-10-29T10:00:00Z', assets: [{ name: 'RWAdar.apk', download_count: 7 }] },
    ]);
    if (url === CLOUDFLARE_GRAPHQL) return graphql ? graphql() : json({ data: { viewer: { accounts: [{
      dias: [{ count: 10, sum: { visits: 6 }, dimensions: { date: '2026-10-20' } }, { count: 5, sum: { visits: 3 }, dimensions: { date: '2026-11-08' } }],
      paises: [{ sum: { visits: 8 }, dimensions: { countryName: 'Spain' } }],
      paginas: [{ count: 9, dimensions: { requestPath: '/' } }],
    }] } } });
    return new Response('no', { status: 404 });
  };
}

async function correr({ entorno = { SUPABASE_DB_URL: URL_DB }, psql = () => ({ codigo: 0, salida: JSON.stringify(CUENTAS) + '\n', error: '' }), ...f } = {}) {
  let texto = '';
  const codigo = await main([], entorno, { ahora: AHORA, ejecutarPsql: psql, fetchImpl: fetchFalso(f), escribir: t => { texto += t; } });
  return { codigo, texto };
}

test('con todo bien: cuentas, descargas del APK y, sin clave de analítica, el enlace del panel', async () => {
  const { codigo, texto } = await correr();
  assert.equal(codigo, 0);
  assert.match(texto, /Cuentas creadas en total \| 12 \|/);
  assert.match(texto, /Entraron con su cuenta en los últimos 7 días \| 3 \|/);
  assert.match(texto, /Han pedido los avisos por correo \| 1 \|/);
  assert.match(texto, /Descargas del APK, todas las versiones: \*\*11\*\*/);
  assert.doesNotMatch(texto, /99/, 'solo cuenta el APK, no otros archivos');
  assert.ok(texto.includes(PANEL));
  assert.match(texto, /falta la clave de solo lectura de analítica/);
});

test('con la clave de analítica: visitas de 7 y 30 días, países y páginas', async () => {
  const { texto } = await correr({ entorno: { SUPABASE_DB_URL: URL_DB, CLOUDFLARE_ANALITICA_TOKEN: 'x' } });
  assert.match(texto, /Últimos 7 días \| 3 \| 5 \|/);
  assert.match(texto, /Últimos 30 días \| 9 \| 15 \|/);
  assert.match(texto, /Spain \(8\)/);
  assert.match(texto, /Una visita no es una persona/);
});

test('Cloudflare sin permiso: lo dice y da el panel, sin fallar el informe', async () => {
  const { codigo, texto } = await correr({ entorno: { SUPABASE_DB_URL: URL_DB, CLOUDFLARE_ANALITICA_TOKEN: 'x' },
    graphql: () => json({ errors: [{ message: 'not authorized' }] }, 200) });
  assert.equal(codigo, 0);
  assert.match(texto, /Account Analytics: Read/);
  assert.ok(texto.includes(PANEL));
});

test('base caída o sin secreto: falla claro y sin enseñar la dirección ni la contraseña', async () => {
  const caida = await correr({ psql: () => ({ codigo: 2, salida: '', error: `psql: error: connection to "${URL_DB}" failed` }) });
  assert.equal(caida.codigo, 1);
  assert.match(caida.texto, /la base no respondió/);
  assert.doesNotMatch(caida.texto, /ContrasenaSecreta123|pooler\.supabase/);
  const sin = await correr({ entorno: {} });
  assert.match(sin.texto, /falta el secreto SUPABASE_DB_URL/);
});

test('cartera sin poder saltar la protección: no da un 0 falso', () => {
  const r = leerCuentas(JSON.stringify({ ...CUENTAS, salta_rls: false, con_cartera: null }));
  assert.equal(r.con_cartera, null);
  assert.throws(() => leerCuentas('nada'), /no devolvió los recuentos/);
});

test('la consulta solo lee y solo cuenta: nada de correos ni identificadores', () => {
  assert.match(CONSULTA, /^begin transaction read only;/);
  assert.match(CONSULTA, /rollback;$/);
  assert.doesNotMatch(CONSULTA, /\b(insert|update|delete|alter|drop|create|grant|truncate)\b/i);
  assert.doesNotMatch(CONSULTA, /select\s+(email|id|u\.email)\b|\bemail\s*,|raw_user_meta_data/i);
  for (const m of CONSULTA.matchAll(/\(select ([^()]*?) from (auth\.users|rwadar_[a-z_]+\.[a-z_]+)/g)) {
    assert.match(m[1], /^count\(\*\)$/, `solo recuentos: ${m[0]}`);
  }
});

test('el flujo: lunes fuera de las horas punta, solo lectura, incidencias solo en el trabajo y SHA fijados', () => {
  const flujo = fs.readFileSync(path.join(raiz, '.github/workflows/numeros.yml'), 'utf8');
  const cron = flujo.match(/^\s*- cron: '(\d+) (\d+) \* \* 1'/m);
  assert.ok(cron, 'corre los lunes');
  assert.notEqual(Number(cron[1]) % 30, 0, 'no en punto ni a y media');
  for (const desfase of [7, 8]) {
    const h = (Number(cron[2]) - desfase + 24) % 24;
    assert.ok(h < 6 || h >= 9, `a las ${h} h del Pacífico`);
  }
  assert.match(flujo, /^permissions:\n {2}contents: read\n/m);
  assert.match(flujo, /^ {4}permissions:\n {6}contents: read\n {6}issues: write\n/m);
  assert.match(flujo, /github\.ref != 'refs\/heads\/main'/);
  assert.doesNotMatch(flujo, /CLOUDFLARE_API_TOKEN/, 'no usa el token de publicar');
  const contar = flujo.slice(flujo.indexOf('- name: Contar'), flujo.indexOf('- name: Publicar'));
  assert.doesNotMatch(contar, /GH_TOKEN|github\.token/);
  for (const usa of flujo.match(/uses: \S+/g)) assert.match(usa, /@[0-9a-f]{40}$/, `${usa} va fijada por commit`);
  assert.equal((flujo.match(/@victorJorques/g) || []).length, 1, 'menciona a Víctor solo al crear la incidencia');
});

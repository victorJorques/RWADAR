/* =====================================================================
   RWAdar · textos del radar corregidos (migración 38, 20/11/2026)
   ---------------------------------------------------------------------
   Orden de la dirección del 20/11/2026: «Todo lo falso fuera… que no
   vuelvan a haber textos ni datos falsos». La 38 cambia aval, nota,
   acceso, cadenas y región (y el motivo de dos descartadas) de la tabla
   base public.plataformas, con los textos de
   data/verificaciones/2026-11-20-v2/textos-radar.json.

   Postgres real en WebAssembly (PGlite) con la cadena de migraciones de
   las pruebas y, en lugar de 02_seed.sql, la semilla de antes de la 38
   (la vigente con los textos viejos, que son los que sirve producción):
     - los «antes» son lo que leía un visitante el 20/11 a las 16:52 UTC;
     - la 38 aplica, deja los textos nuevos y no toca nada más;
     - repetirla no cambia nada (ni actualizada_el);
     - si un «antes» no cuadra, falla y no queda nada;
     - el verificador pasa después y falla antes;
     - sobre la semilla nueva (instalación limpia), la 38 no cambia nada.

       node probar-textos-radar.mjs
   ===================================================================== */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MIGRACIONES, baseConMigraciones, filas, informe } from './pruebas-soporte.mjs';

const raiz = path.dirname(fileURLToPath(import.meta.url));
process.chdir(raiz);
const leer = (ruta) => fs.readFileSync(path.join(raiz, ruta), 'utf8');

const ok = [], fail = [];
const paso = (texto, condicion) => (condicion ? ok : fail).push(texto);
const error = async (fn) => { try { await fn(); return null; } catch (e) { return e; } };

const SQL38 = leer('db/38_textos_radar.sql');
const VERIFICAR38 = leer('db/38_textos_radar_verificar.sql');
const SEED = leer('db/02_seed.sql');
const SEED26 = leer('db/pruebas/02_seed_radar_26.sql');
const J = JSON.parse(leer('data/verificaciones/2026-11-20-v2/textos-radar.json'));
const PROD = JSON.parse(leer('data/verificaciones/2026-11-20-v2/lectura-publica/plataformas-v2.json'));
const COLUMNAS = ['aval', 'nota', 'acceso', 'ticket', 'cadenas', 'region_slug', 'etiqueta_descarte', 'motivo_descarte'];
const CAMBIOS = Object.entries(J.plataformas).flatMap(([slug, c]) =>
  Object.keys(c).filter((col) => COLUMNAS.includes(col)).map((col) => ({ slug, col, ...c[col] })));
const N = Object.keys(J.plataformas).length;
const sem = (s) => s.replace(/'/g, "''");
const regiones = Object.fromEntries([...SEED.matchAll(/^insert into regiones \(slug,nombre\) values \('([^']+)','([^']+)'\);$/gm)].map((m) => [m[1], m[2]]));
const enSemilla = (col, valor) => (col === 'region_slug'
  ? `(select slug from regiones where nombre='${sem(regiones[valor])}')` : `'${sem(valor)}'`);

/* ---------- La semilla de antes: la vigente con los textos viejos ---------- */
const filaDe = (texto, slug) => texto.match(new RegExp(`^insert into plataformas \\([^)]*\\) values \\('${slug}',.*$`, 'm'))?.[0];
let semillaVieja = SEED;
for (const slug of Object.keys(J.plataformas)) {
  let fila = filaDe(semillaVieja, slug);
  for (const c of CAMBIOS.filter((x) => x.slug === slug)) fila = fila.replace(enSemilla(c.col, c.ahora), () => enSemilla(c.col, c.antes));
  semillaVieja = semillaVieja.replace(filaDe(semillaVieja, slug), () => fila);
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-38-'));
fs.writeFileSync(path.join(tmp, '02_seed_antes_38.sql'), semillaVieja);
const SEED_VIEJO = path.relative(path.join(raiz, 'db'), path.join(tmp, '02_seed_antes_38.sql'));
const baseVieja = () => baseConMigraciones(MIGRACIONES.map((m) => (m === '02_seed.sql' ? SEED_VIEJO : m)));
const baseNueva = () => baseConMigraciones(MIGRACIONES);

/* ---------- Los datos: «antes» = producción; semillas con lo nuevo ---------- */
{
  const prod = Object.fromEntries(PROD.map((p) => [p.slug, p]));
  const malProd = CAMBIOS.filter((c) => prod[c.slug]).filter((c) => {
    const actual = c.col === 'region_slug' ? Object.keys(regiones).find((k) => regiones[k] === prod[c.slug].region) : prod[c.slug][c.col];
    return actual !== c.antes;
  });
  paso('cada «antes» de una plataforma del radar es lo que servía producción el 20/11 a las 16:52 UTC', malProd.length === 0);
  const nuevasEn = (texto) => CAMBIOS.every((c) => filaDe(texto, c.slug)?.includes(enSemilla(c.col, c.ahora))
    && (c.antes === c.ahora || !filaDe(texto, c.slug).includes(enSemilla(c.col, c.antes))));
  paso('02_seed.sql lleva los textos nuevos y ninguno de los viejos', nuevasEn(SEED));
  paso('pruebas/02_seed_radar_26.sql (copia fija del 04/11 para los lotes antiguos) no se toca', CAMBIOS.every((c) => !filaDe(SEED26, c.slug)?.includes(enSemilla(c.col, c.ahora))));
  paso(`textos-radar.json: ${N} plataformas, cada cambio con fuente y con un valor nuevo distinto`,
    N === 23 && Object.values(J.plataformas).every((p) => Array.isArray(p.fuentes) && p.fuentes.length > 0)
    && CAMBIOS.every((c) => typeof c.ahora === 'string' && c.ahora.trim() && c.ahora !== c.antes));
  const PROHIBIDO = /\boportunidad|rentabilidad|garantiz|\bl[ií]der\b|\bel mayor\b|\bla mayor\b|de referencia|primer nivel|m[aá]s institucional|m[aá]s conservadora/i;
  paso('ningún texto nuevo trae superlativos ni promesas', CAMBIOS.every((c) => !PROHIBIDO.test(c.ahora)));
  const valoresAcceso = new Set(['Minorista', 'Acreditado', 'Institucional', 'Empresas']);
  paso('acceso: solo valores que ya usa la tabla', CAMBIOS.filter((c) => c.col === 'acceso').every((c) => valoresAcceso.has(c.ahora)));
  paso('región: solo regiones que ya existen', CAMBIOS.filter((c) => c.col === 'region_slug').every((c) => regiones[c.ahora]));
}

/* ---------- La forma de los SQL (el ensayo del flujo depende de ella) ---------- */
{
  const lineas = SQL38.trimEnd().split('\n');
  paso('38: una sola transacción (un begin; y termina en un único commit;)',
    (SQL38.match(/^begin;$/gm) || []).length === 1 && (SQL38.match(/^commit;$/gm) || []).length === 1 && lineas.at(-1) === 'commit;');
  paso(`38: un UPDATE por plataforma (${N}) y nada más que cambie datos`,
    (SQL38.match(/^update public\.plataformas set$/gm) || []).length === N
    && !/\b(insert into|delete from|drop |alter |truncate|create )/i.test(SQL38.replace(/^--.*$/gm, '')));
  paso('38: los UPDATE solo tocan las columnas de textos', [...SQL38.matchAll(/^ {7}([a-z_]+) = /gm)].every((m) => COLUMNAS.includes(m[1])));
  const v = VERIFICAR38.trimEnd().split('\n');
  paso('verificador: begin transaction read only; … rollback;',
    (VERIFICAR38.match(/^begin transaction read only;$/gm) || []).length === 1 && v.at(-1) === 'rollback;'
    && !/\b(update|insert into|delete from)\b/i.test(VERIFICAR38.replace(/^--.*$/gm, '').replace(/'[^']*'/g, "''")));
}

const foto = async (db) => filas(db, `select slug, estado, categoria_slug, region_slug, actor, acceso::text, ticket::text, cadenas, web,
  aval, nota, etiqueta_descarte, motivo_descarte, verificada_el::text, actualizada_el::text from public.plataformas order by slug`);
const valor = (f, slug, col) => f.find((x) => x.slug === slug)?.[col];
const todas = (f, cual) => CAMBIOS.every((c) => valor(f, c.slug, c.col) === c[cual]);
const sinColumnas = (f) => f.map((x) => {
  const y = { ...x }; delete y.actualizada_el;
  for (const c of CAMBIOS.filter((k) => k.slug === x.slug)) delete y[c.col];
  return y;
});

/* ---------- Sobre la semilla de antes ---------- */
{
  const db = await baseVieja();
  const antes = await foto(db);
  const fuentesAntes = (await filas(db, 'select count(*)::int n from public.fuentes'))[0].n;
  paso('la base de prueba arranca con los textos viejos', todas(antes, 'antes'));

  const avisosV = [];
  const eV = await error(() => db.exec(VERIFICAR38, { onNotice: (n) => avisosV.push(n.message) }));
  paso('antes de la 38, el verificador falla', /RWAdar 38: textos sin corregir/.test(eV?.message || ''));
  await db.exec('rollback');

  const avisos = [];
  const e = await error(() => db.exec(SQL38, { onNotice: (n) => avisos.push(n.message) }));
  paso('la 38 se aplica', !e);
  paso(`… y lo dice: «RWAdar 38 aplicada: ${N} plataformas…»`, avisos.some((m) => m === `RWAdar 38 aplicada: ${N} plataformas con sus textos nuevos`));
  const despues = await foto(db);
  paso('después, cada columna tiene su texto nuevo', todas(despues, 'ahora'));
  paso('no cambia nada más: ni otras columnas, ni otras plataformas, ni verificada_el', JSON.stringify(sinColumnas(antes)) === JSON.stringify(sinColumnas(despues)));
  paso('las plataformas sin cambios conservan actualizada_el', antes.filter((x) => !J.plataformas[x.slug])
    .every((x) => valor(despues, x.slug, 'actualizada_el') === x.actualizada_el));
  paso('ni las fuentes', (await filas(db, 'select count(*)::int n from public.fuentes'))[0].n === fuentesAntes);
  const vista = await filas(db, `select slug, aval, nota, region from public.catalogo_plataformas_publicas where slug in ('swarm','spiko')`).catch(() => null);
  paso('si la vista pública da la fila de swarm, ya trae su texto nuevo', !vista || vista.length === 0
    || (vista.find((x) => x.slug === 'swarm')?.aval === J.plataformas.swarm.aval.ahora));

  const avisosOk = [];
  const eOk = await error(() => db.exec(VERIFICAR38, { onNotice: (n) => avisosOk.push(n.message) }));
  paso(`el verificador pasa: «RWAdar 38 OK: ${N} plataformas»`, !eOk && avisosOk.includes(`RWAdar 38 OK: ${N} plataformas`));

  const otraVez = [];
  const e2 = await error(() => db.exec(SQL38, { onNotice: (n) => otraVez.push(n.message) }));
  const tras = await foto(db);
  paso('repetir la 38 no falla y no cambia nada (ni actualizada_el)', !e2 && JSON.stringify(tras) === JSON.stringify(despues));
  await db.close();
}

/* ---------- Un «antes» que no cuadra: falla y no queda nada ---------- */
{
  const db = await baseVieja();
  await db.exec(`update public.plataformas set nota = 'Otro texto que nadie revisó.' where slug = 'tzero'`);
  const antes = await foto(db);
  const e = await error(() => db.exec(SQL38));
  paso('si una columna no tiene ni el texto de antes ni el nuevo, la 38 falla con su nombre',
    /RWAdar 38: tzero no tiene el texto de antes ni el nuevo/.test(e?.message || ''));
  await db.exec('rollback');
  const despues = await foto(db);
  paso('… y no queda nada: las plataformas de antes de tzero siguen con su texto viejo', JSON.stringify(antes) === JSON.stringify(despues));
  await db.close();
}
{
  const db = await baseVieja();
  await db.exec(`delete from public.fuentes where plataforma_id = (select id from public.plataformas where slug = 'domoblock');
    delete from public.plataformas where slug = 'domoblock'`);
  const e = await error(() => db.exec(SQL38));
  paso('si falta una plataforma, la 38 falla', /RWAdar 38: no está la plataforma domoblock/.test(e?.message || ''));
  await db.exec('rollback');
  const f = await foto(db);
  paso('… ni en swarm, la primera', valor(f, 'swarm', 'aval') === J.plataformas.swarm.aval.antes);
  await db.close();
}

/* ---------- Instalación limpia (02_seed.sql ya trae lo nuevo) ---------- */
{
  const db = await baseNueva();
  const antes = await foto(db);
  paso('la semilla vigente ya trae los textos nuevos', todas(antes, 'ahora'));
  const e = await error(() => db.exec(SQL38));
  paso('sobre ella, la 38 pasa sin cambiar nada', !e && JSON.stringify(await foto(db)) === JSON.stringify(antes));
  const avisos = [];
  const eV = await error(() => db.exec(VERIFICAR38, { onNotice: (n) => avisos.push(n.message) }));
  paso('y el verificador pasa', !eV && avisos.includes(`RWAdar 38 OK: ${N} plataformas`));
  await db.close();
}

fs.rmSync(tmp, { recursive: true, force: true });
informe('Textos del radar (migración 38)', ok, fail);

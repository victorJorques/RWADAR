/* =====================================================================
   RWAdar · pruebas de las emisiones abiertas
   ---------------------------------------------------------------------
   Aquí no se comprueba que «funcione», sino que las cuatro reglas del
   diseño frenen de verdad. Son reglas sobre dinero ajeno, así que lo que
   importa es lo que la base RECHAZA:

     1. ninguna emisión sin enlace https a su origen
     2. ninguna sin fecha de comprobación, y las rancias salen a la luz
     3. no se promociona a quien no pasa el filtro, y si una plataforma
        cae del radar sus emisiones se cierran solas
     4. lo pagado se marca como pagado, y el resultado no se puede
        inventar antes de que la emisión termine

       node probar-emisiones.mjs
   ===================================================================== */
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';

const db = await new PGlite();
const n = async (s, p = []) => (await db.query(s, p)).rows;
const ok = [], fail = [];
const paso = (t, c) => (c ? ok : fail).push(t);
const rechaza = async (s, p, etiqueta) => {
  try { await db.query(s, p); fail.push('NO rechaza: ' + etiqueta); }
  catch { ok.push('rechaza ' + etiqueta); }
};

await db.exec(`create schema auth;
  create table auth.users(id uuid primary key default gen_random_uuid(), email text unique);
  create role anon; create role authenticated; create role service_role;
  create table _s(uid uuid);
  create function auth.uid() returns uuid language sql stable security definer as $$ select uid from _s limit 1 $$;`);

for (const f of ['01_schema.sql', '02_seed.sql', '03_app.sql', '04_rls.sql', '18_emisiones.sql'])
  await db.exec(fs.readFileSync('db/' + f, 'utf8'));
console.log('El esquema entero, con las emisiones, se aplica sin error.\n');

const [enRadar] = await n(
  `select id, slug from plataformas where estado='en_radar' limit 1`);
const [otra] = await n(
  `select id, slug from plataformas where estado='en_radar' and id <> $1 limit 1`, [enRadar.id]);
const [gato] = await n(`select slug from categorias limit 1`);

const alta = (extra = {}) => {
  const base = {
    plataforma_id: enRadar.id, slug: 'e-' + Math.random().toString(36).slice(2, 9),
    titulo: 'Edificio residencial en Málaga capital',
    categoria_slug: gato.slug, ticket_minimo: 100,
    url: 'https://ejemplo.com/emision/1',
    cierra_el: '2099-01-01',
  };
  const f = { ...base, ...extra };
  const cols = Object.keys(f), vals = Object.values(f);
  return [`insert into emisiones (${cols.join(',')}) values (${cols.map((_, i) => '$' + (i + 1)).join(',')}) returning slug`, vals];
};

/* --- lo que SÍ entra ------------------------------------------------ */
const [buena] = await n(...alta({ rentabilidad: 6.2, objetivo: 300000, captado: 120000, plazo_meses: 24 }));
paso('acepta una emisión completa y bien formada', !!buena.slug);

paso('acepta una emisión sin objetivo ni rentabilidad (hueco > cifra inventada)',
  !!(await n(...alta()))[0].slug);

/* --- regla 1 · ninguna emisión sin enlace comprobable --------------- */
await rechaza(...alta({ url: 'http://ejemplo.com/x' }), 'un enlace sin cifrar');
await rechaza(...alta({ url: 'ejemplo.com/x' }), 'un enlace que no es una URL');
paso('la url es obligatoria por esquema',
  (await n(`select is_nullable from information_schema.columns
            where table_name='emisiones' and column_name='url'`))[0].is_nullable === 'NO');

/* --- regla 2 · fecha de comprobación, y las rancias a la vista ------ */
paso('verificada_el es obligatoria y se pone sola',
  (await n(`select verificada_el is not null v from emisiones limit 1`))[0].v === true);

await n(`update emisiones set verificada_el = current_date - 30 where slug=$1`, [buena.slug]);
const rancias = await n(`select slug, motivo from emisiones_rancias`);
paso('una emisión sin comprobar en 30 días sale como rancia',
  rancias.some(r => r.slug === buena.slug && r.motivo.includes('sin comprobar')));

const [caduca] = await n(...alta({ cierra_el: '2000-01-01' }));
paso('una emisión abierta cuya fecha de cierre ya pasó sale como rancia',
  (await n(`select motivo from emisiones_rancias where slug=$1`, [caduca.slug]))[0]
    ?.motivo.includes('ya pasó'));

/* --- regla 3 · no se promociona a quien no pasa el filtro ----------- */
const [desc] = await n(`select id from plataformas where estado='descartada' limit 1`);
await rechaza(...alta({ plataforma_id: desc.id }), 'una emisión de una plataforma descartada');

const [viva] = await n(...alta({ plataforma_id: otra.id }));
await n(`update plataformas set estado='descartada',
           etiqueta_descarte='Prueba',
           motivo_descarte=$2
         where id=$1`,
  [otra.id, 'Motivo de prueba con la longitud suficiente para pasar la comprobacion del esquema.']);
const [arrastrada] = await n(`select estado, resultado_nota from emisiones where slug=$1`, [viva.slug]);
paso('si una plataforma cae del radar, sus emisiones abiertas se cancelan solas',
  arrastrada.estado === 'cancelada');
paso('y queda escrito por qué se cancelaron',
  (arrastrada.resultado_nota || '').includes('salió del radar'));

/* --- regla 4 · el resultado no se inventa antes de tiempo ----------- */
await rechaza(`update emisiones set rentabilidad_real=5 where slug=$1`, [buena.slug],
  'un resultado en una emisión todavía abierta');
await n(`update emisiones set estado='completada', rentabilidad_real=5.1 where slug=$1`, [buena.slug]);
paso('acepta el resultado cuando la emisión ya ha terminado',
  (await n(`select rentabilidad_real r from emisiones where slug=$1`, [buena.slug]))[0].r == 5.1);

/* --- coherencia de los números y del calendario --------------------- */
await rechaza(...alta({ ticket_minimo: 0 }), 'un ticket mínimo de cero');
await rechaza(...alta({ ticket_minimo: -50 }), 'un ticket mínimo negativo');
await rechaza(...alta({ rentabilidad: 150 }), 'una rentabilidad del 150%');
await rechaza(...alta({ abre_el: '2030-01-01', cierra_el: '2029-01-01' }), 'cerrar antes de abrir');
await rechaza(...alta({ cierra_el: null }), 'una emisión abierta sin fecha de cierre');
await rechaza(...alta({ titulo: 'Corto' }), 'un título de menos de 8 caracteres');
await rechaza(...alta({ moneda: 'euros' }), 'una moneda que no es de tres letras');

/* --- lo que lee la web ---------------------------------------------- */
const publicas = await n(`select * from emisiones_publicas`);
paso('la vista pública trae plataforma, categoría y color ya unidos',
  publicas.length > 0 && publicas[0].plataforma && publicas[0].color);
paso('la vista calcula el porcentaje captado',
  publicas.some(e => e.porcentaje !== null));
paso('la vista calcula los días que quedan para cerrar',
  publicas.some(e => e.dias_para_cerrar !== null));
paso('las abiertas van primero y ordenadas por lo que cierra antes',
  publicas[0].estado === 'abierta');
paso('lo patrocinado viaja marcado hasta la web',
  publicas.every(e => typeof e.patrocinada === 'boolean'));

/* --- seguridad: se lee desde el navegador, no se escribe ------------ */
await db.exec(`set role anon`);
paso('anon puede leer las emisiones',
  (await n(`select count(*)::int c from emisiones`))[0].c > 0);
await rechaza(...alta({ slug: 'colada-por-anon' }), 'que anon escriba una emisión');
await db.exec(`reset role`);

/* --- el registro editorial sigue intacto ---------------------------- */
paso('las emisiones no tocan el radar público',
  (await n('select count(*)::int c from radar_publico'))[0].c > 0);

console.log('=== PRUEBAS DE EMISIONES ===');
ok.forEach(t => console.log('  OK   ', t));
fail.forEach(t => console.log('  FALLO', t));
console.log(`\n${ok.length} correctas, ${fail.length} fallidas`);
process.exit(fail.length ? 1 : 0);

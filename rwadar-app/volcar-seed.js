/* =====================================================================
   RWAdar · regenera db/02_seed.sql desde la base de datos en producción
   ---------------------------------------------------------------------
   Evita que el fichero de instalación y la base real se separen: si
   alguien recreara el proyecto desde cero con un seed viejo, volverían
   datos que se retiraron a propósito.

   Solo lee, así que usa la clave publicable: no hace falta token.
   ===================================================================== */
const fs = require('fs');
const path = require('path');

const BASE = 'https://exgpmjpaaebyoolpwced.supabase.co/rest/v1';
const CLAVE = 'sb_publishable_LIyeUqwsQGCqSwH6dtsaqQ_HUQ-RX8F';

const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);

async function pedir(ruta) {
  const r = await fetch(`${BASE}/${ruta}`, { headers: { apikey: CLAVE } });
  if (!r.ok) throw new Error(`${ruta} -> HTTP ${r.status}`);
  return r.json();
}

(async () => {
  const [cats, regs, radar, fuera] = await Promise.all([
    pedir('categorias?select=*&order=orden'),
    pedir('regiones?select=*&order=slug'),
    pedir('radar_publico?select=*'),
    pedir('plataformas?estado=eq.descartada&select=slug,nombre,etiqueta_descarte,motivo_descarte,verificada_el,fuentes(url,titulo,consultada_el)&order=slug'),
  ]);

  const L = ['-- Generado por volcar-seed.js desde la base en producción · no editar a mano', 'begin;'];

  cats.forEach((c) => L.push(
    `insert into categorias (slug,nombre,color,orden) values (${q(c.slug)},${q(c.nombre)},${q(c.color)},${c.orden});`));
  regs.forEach((r) => L.push(
    `insert into regiones (slug,nombre) values (${q(r.slug)},${q(r.nombre)});`));

  radar.forEach((p) => L.push(
    'insert into plataformas (slug,nombre,estado,categoria_slug,region_slug,actor,acceso,ticket,cadenas,web,aval,nota,verificada_el) values (' +
    [q(p.slug), q(p.nombre), "'en_radar'",
     `(select slug from categorias where nombre=${q(p.categoria)})`,
     `(select slug from regiones where nombre=${q(p.region)})`,
     q(p.actor), q(p.acceso), q(p.ticket), q(p.cadenas), q(p.web), q(p.aval), q(p.nota),
     q(p.verificada_el)].join(',') + ');'));

  fuera.forEach((f) => {
    L.push('insert into plataformas (slug,nombre,estado,etiqueta_descarte,motivo_descarte,verificada_el) values (' +
      [q(f.slug), q(f.nombre), "'descartada'", q(f.etiqueta_descarte), q(f.motivo_descarte), q(f.verificada_el)].join(',') + ');');
    (f.fuentes || []).forEach((s) => L.push(
      'insert into fuentes (plataforma_id,url,titulo,consultada_el) values (' +
      `(select id from plataformas where slug=${q(f.slug)}),${q(s.url)},${q(s.titulo)},${q(s.consultada_el)});`));
  });

  L.push('commit;');
  const salida = path.join(__dirname, 'db', '02_seed.sql');
  fs.writeFileSync(salida, L.join('\n') + '\n', 'utf8');
  const nFuentes = fuera.reduce((n, f) => n + (f.fuentes || []).length, 0);
  console.log(`02_seed.sql regenerado: ${radar.length} en el radar, ${fuera.length} descartadas, ${nFuentes} fuentes.`);
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });

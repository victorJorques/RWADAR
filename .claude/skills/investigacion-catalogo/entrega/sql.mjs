// Motor de la entrega · el SQL: guarda, aprobación, inventario de sentencias y diff normalizado.
import assert from 'node:assert/strict';

// Guarda al principio de la transacción: la publicada exacta y su huella, el catálogo no retirado, la fecha de
// hoy al último día vigente y el destino sin otra identidad. Si algo no cuadra, falla y no deja nada.
export function guarda({ PREVIA, HASH_PREVIA, NUEVA, HASH_NUEVA, FECHA, ULTIMO }) {
  return `do $guarda$
declare actual uuid; retirada boolean;
begin
  select revision_id into actual from rwadar_catalogo.publicacion_v2 where unica for update;
  if actual is null or actual not in ('${PREVIA}'::uuid, '${NUEVA}'::uuid) then
    raise exception 'Publicación distinta de la revisión anterior prevista: %. No aplicar este lote.', actual;
  end if;
  if actual = '${PREVIA}'::uuid and not exists (select 1 from rwadar_catalogo.revisiones where id = '${PREVIA}'::uuid
    and contenido_sha256 = '${HASH_PREVIA}' and estado = 'aprobada') then
    raise exception 'La revisión publicada no tiene la identidad prevista o no está aprobada. No aplicar este lote.';
  end if;
  select retirado into retirada from public.catalogo_publicacion where unica for update;
  if retirada is distinct from false then
    raise exception 'Catálogo retirado o control ausente: este lote no autoriza reactivarlo.';
  end if;
  if current_date < date '${FECHA}' then raise exception 'Revisión futura'; end if;
  if current_date > date '${ULTIMO}' then
    raise exception 'Lote caducado: sus fichas valían hasta el ${ULTIMO.split('-').reverse().join('/')}. No aplicar este lote.';
  end if;
  if exists (select 1 from rwadar_catalogo.revisiones where id = '${NUEVA}'::uuid
    and (contenido_sha256 <> '${HASH_NUEVA}' or estado = 'retirada')) then
    raise exception 'La revisión destino existe con otra identidad o está retirada';
  end if;
end $guarda$;
`;
}

// Aprobación al final: cantidades exactas por colección, la revisión publicable y publicada; si no, se deshace todo.
export function aprobacion({ NUEVA, plataformas, ofertas, colecciones, referencia }) {
  assert.doesNotMatch(referencia, /'/, 'la referencia de aprobación no lleva comillas simples');
  return `do $aprobar$
declare v uuid := '${NUEVA}';
begin
  if (select count(*) from rwadar_catalogo.plataformas where revision_id = v) <> ${plataformas}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v) <> ${ofertas}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'principales') <> ${colecciones.principales}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'secundario') <> ${colecciones.secundario}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'en_camino') <> ${colecciones.en_camino} then
    raise exception 'Catálogo incompleto: se conserva el lote anterior';
  end if;
  update rwadar_catalogo.revisiones set estado = 'aprobada', aprobada_el = now(),
    aprobada_referencia = '${referencia}'
    where id = v and estado = 'borrador';
  if not exists (select 1 from rwadar_catalogo.revision_publicable_v2 where id = v) then
    raise exception 'Entrega no publicable: se deshace la transacción completa';
  end if;
  if (select revision_id from rwadar_catalogo.publicacion_v2 where unica) is distinct from v then
    raise exception 'La revisión nueva no quedó publicada: se deshace la transacción completa';
  end if;
end $aprobar$;
`;
}

// aplicar-y-aprobar.sql = cabecera + catalogo.sql con la transacción serializable, la guarda al principio y la
// aprobación al final.
export function aplicarYAprobar({ cabecera, sqlCatalogo, g, a }) {
  const sql = cabecera + sqlCatalogo.replace('-- El lote entra como BORRADOR. Este fichero nunca lo aprueba ni lo publica.',
    '-- Este aplicador importa y aprueba al final, únicamente si pasan todas las guardas.')
    .replace('begin;', () => 'begin isolation level serializable;\n' + g)
    .replace(/commit;\n$/, () => a + 'commit;\n');
  assert.ok(sql.includes(g) && sql.endsWith(a + 'commit;\n'), 'guarda al principio y aprobación al final');
  assert.ok(sql.includes('-- Este aplicador importa y aprueba al final, únicamente si pasan todas las guardas.'), 'cabecera del aplicador');
  assert.equal(sql.match(/^begin isolation level serializable;$/gm).length, 1);
  assert.doesNotMatch(sql, /^\s*(?:insert\s+into|update|delete\s+from)\s+public\./im, 'el SQL no escribe en public.*');
  assert.doesNotMatch(sql, /^\s*(?:truncate|alter|drop|grant|revoke|create)\b/im, 'sin DDL ni permisos');
  return sql;
}

// Inventario de un aplicar-y-aprobar.sql: sentencias contadas y clasificadas (no palabras buscadas).
export const PROHIBIDO = /\b(delete\s+from|truncate|alter\s+(?:table|role|type|policy|function|default)|drop\s|create\s+(?:or\s+replace\s+)?(?:table|function|policy|type|view|trigger|role|schema|extension|index)|grant\s|revoke\s|security\s+definer|set\s+role|auth\.)\b/i;
// esperado (opcional): { nueva, previa, hashPrevia, fecha, ultimo, colecciones } para comprobar también la guarda y la
// aprobación de esta entrega.
export function inventario(SQL, esperado = null) {
  assert.doesNotMatch(SQL, PROHIBIDO, 'sentencia prohibida (borrados, DDL, permisos, Auth)');
  const bloques = [...SQL.matchAll(/^do \$(\w+)\$\n([\s\S]*?)^end \$\1\$;$/gm)];
  assert.deepEqual(bloques.map(b => b[1]), ['guarda', 'aprobar'], 'dos bloques: guarda y aprobación');
  assert.doesNotMatch(bloques[0][2], /\b(?:update\s+(?!.*\bfor\s+update)|insert\s+into|delete\s+from|execute\b)/i, 'la guarda solo lee');
  assert.equal([...bloques[1][2].matchAll(/\bupdate\s+([\w.]+)/gi)].map(m => m[1]).join(), 'rwadar_catalogo.revisiones', 'la aprobación solo cambia el estado de la revisión');
  assert.doesNotMatch(bloques[1][2], /\b(?:insert\s+into|delete\s+from|execute\b)/i);
  const sinBloques = SQL.replace(/^do \$(\w+)\$\n[\s\S]*?^end \$\1\$;$/gm, '');
  const sentencias = sinBloques.split('\n').filter(l => l.trim() && !l.startsWith('--'));
  assert.deepEqual(sentencias.filter(l => !/^insert into rwadar_catalogo\.\w+ \(/.test(l)), ['begin isolation level serializable;', 'commit;'],
    'fuera de la guarda y la aprobación solo hay inserts en rwadar_catalogo');
  const escrituras = sentencias.map(l => l.match(/^insert into ([\w.]+)/)?.[1]).filter(Boolean);
  const cuenta = Object.fromEntries([...new Set(escrituras)].sort().map(e => [e, escrituras.filter(x => x === e).length]));
  assert.ok(sentencias.filter(l => l.startsWith('insert')).every(l => l.endsWith(' on conflict (id) do nothing;') ||
    l.endsWith(' on conflict (revision_id,id) do nothing;') || l.endsWith(' on conflict (revision_id,plataforma_id) do nothing;') ||
    l.endsWith(' on conflict (revision_id,slug) do nothing;') || l.endsWith(' on conflict do nothing;')), 'todos los inserts son idempotentes');
  assert.match(SQL, /^begin isolation level serializable;$/m);
  assert.equal(SQL.match(/^begin(?: isolation level serializable)?;$/gm).length, 1); assert.equal(SQL.match(/^commit;$/gm).length, 1);
  assert.ok(SQL.endsWith('end $aprobar$;\ncommit;\n'));
  assert.doesNotMatch(SQL, /^\s*(?:insert\s+into|update|delete\s+from)\s+public\./im, 'nada escribe en public.*');
  if (esperado) {
    const { nueva, previa, hashPrevia, fecha, ultimo, colecciones } = esperado, g = bloques[0][2], a = bloques[1][2];
    assert.ok(sentencias.filter(l => l.startsWith('insert')).every(l => l.includes(`'${nueva}'::uuid`)), 'todos los inserts son de la revisión nueva');
    assert.ok(g.includes(`contenido_sha256 = '${hashPrevia}' and estado = 'aprobada'`), 'la guarda exige la huella de la publicada');
    assert.ok(g.includes(`actual not in ('${previa}'::uuid, '${nueva}'::uuid)`), 'la guarda exige la publicada exacta');
    assert.ok(g.includes('select retirado into retirada from public.catalogo_publicacion where unica for update'), 'la guarda mira si el catálogo está retirado');
    assert.ok(g.includes(`if current_date < date '${fecha}' then raise exception 'Revisión futura'`), 'la guarda no deja aplicarla antes de su fecha');
    assert.equal(g.split(`  if current_date > date '${ultimo}' then\n    raise exception 'Lote caducado`).length, 2, `la guarda tiene la fecha tope del ${ultimo}`);
    assert.ok(g.includes(`where id = '${nueva}'::uuid\n    and (contenido_sha256 <> `), 'la guarda mira el destino');
    for (const c of ['principales', 'secundario', 'en_camino'])
      assert.ok(a.includes(`coleccion = '${c}') <> ${colecciones[c]}`), `la aprobación exige ${colecciones[c]} en ${c}`);
    assert.ok(a.includes(`declare v uuid := '${nueva}';`), 'la aprobación es la de la revisión nueva');
  }
  return { cuenta, sentencias, bloques, total: sentencias.length + bloques.length, inserts: escrituras.length };
}

// Filas por tabla de un aplicar-y-aprobar.sql (fuera de los bloques de guarda y aprobación).
export function cuentaPorTabla(SQL) {
  const t = SQL.replace(/^do \$(\w+)\$\n[\s\S]*?^end \$\1\$;$/gm, '').split('\n').map(l => l.match(/^insert into ([\w.]+)/)?.[1]).filter(Boolean);
  return Object.fromEntries([...new Set(t)].sort().map(e => [e, t.filter(x => x === e).length]));
}

// SQL normalizado para comparar dos versiones de la misma entrega: sin identificadores de revisión, huellas, fechas de
// generación ni marcas de tiempo, una sentencia por línea. Los «insert» se comparan por tabla y clave.
export function normalizar(SQL, { revisiones = [], huellas = [] } = {}) {
  let t = SQL;
  for (const r of revisiones.filter(Boolean)) t = t.split(r).join('<REVISION>');
  for (const h of huellas.filter(Boolean)) t = t.split(h).join('<HUELLA>');
  t = t.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/g, '<UUID>')
    .replace(/\b[0-9a-f]{64}\b/g, '<SHA256>')
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g, '<HORA>');
  return t.split('\n').filter(l => l.trim() && !/^--/.test(l.trim()));
}

// Diff normalizado entre dos aplicar-y-aprobar.sql: mismo inventario de sentencias (tablas y número de filas) y la
// lista de líneas que cambian, emparejadas por la clave de cada insert (tabla + primeros valores).
export function diffNormalizado(antes, despues, opciones = {}) {
  const ia = inventario(antes), id = inventario(despues);
  const a = normalizar(antes, opciones), d = normalizar(despues, opciones);
  const clave = l => { const m = l.match(/^insert into ([\w.]+) \(([^)]*)\) values \((.{0,200})/); return m ? `${m[1]}|${m[3].split(',').slice(0, 3).join(',')}` : l.slice(0, 120); };
  const porClave = l => { const m = new Map(); for (const x of l) { const k = clave(x); m.set(k, [...(m.get(k) || []), x]); } return m; };
  const ma = porClave(a), md = porClave(d), cambios = [];
  for (const k of new Set([...ma.keys(), ...md.keys()])) {
    const x = (ma.get(k) || []).join('\n'), y = (md.get(k) || []).join('\n');
    if (x !== y) cambios.push({ clave: k, antes: x || null, despues: y || null });
  }
  return {
    mismoInventario: JSON.stringify(ia.cuenta) === JSON.stringify(id.cuenta) && ia.total === id.total,
    inventarioAntes: ia.cuenta, inventarioDespues: id.cuenta, sentenciasAntes: ia.total, sentenciasDespues: id.total,
    iguales: cambios.length === 0, cambios,
  };
}

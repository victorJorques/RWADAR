// Motor de la entrega · REVISAR y AUDITAR.
//
// resumenRevision: lo que cambia frente a la entrega anterior, para que los tres revisores independientes empiecen por
// el diff y no por 400 kB de SQL. Escribe <ciclo>/DIFF-ENTREGA.md (y lo devuelve): cambios por ficha (antes → ahora),
// tarjetas que cambian, el inventario de sentencias de las dos entregas y las sentencias del SQL que cambian algo más que
// la revisión, la huella y la fecha del día (con las palabras que cambian). Revisar el diff no sustituye a las pruebas
// de cada revisor: les dice por dónde empezar.
//
// auditar: la comprobación determinista de una corrección (sustituye al auditor final cuando la corrección no cambia el
// SQL). Con la copia de los tres archivos del SQL de antes de corregir:
//   1. rehace la entrega desde decisiones.json en una carpeta aparte, dos veces: mismos SHA-256 las dos veces e iguales
//      byte a byte a los archivos de la carpeta (lo que hay es exactamente lo que dice decisiones.json);
//   2. inventario de las dos versiones del SQL (mismas sentencias por tabla, misma guarda y aprobación);
//   3. diff normalizado (solo se igualan la revisión y la huella propias de cada archivo): si no cambia nada, el SQL no
//      cambió; si cambia, lista cada sentencia y sus palabras, y hace falta el auditor;
//   4. el ensayo en PGlite (comprobar) sobre lo que hay;
//   5. el escáner de secretos sobre lo que irá a Git de la carpeta del ciclo y del SQL, si está a mano.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { RAIZ_REPO, leer, sha, cargarDecisiones, contexto, fechaLarga, fechaCorta, escRx } from './comun.mjs';
import { inventario, cuentaPorTabla } from './sql.mjs';

const SALIDAS = ETQ => [
  `rwadar-app/data/verificaciones/${ETQ}-v2/radar-canonico-26.json`, `rwadar-app/data/verificaciones/${ETQ}-v2/escaparate-publicacion.json`,
  `rwadar-app/data/verificaciones/${ETQ}-v2/documentacion-ofertas.json`, `rwadar-app/data/verificaciones/${ETQ}-v2/manifiesto-catalogo.json`,
  `rwadar-app/data/verificaciones/${ETQ}-v2/contraste-${ETQ}.json`, `rwadar-app/data/importaciones/catalogo-${ETQ}-v2/catalogo.sql`,
  `rwadar-app/data/importaciones/catalogo-${ETQ}-v2/aplicar-y-aprobar.sql`, `rwadar-app/data/importaciones/catalogo-${ETQ}-v2/revision.json`,
];

// ------------------------------------------------------------------ diff de palabras
const trozos = t => t.match(/[\p{L}\p{N}_]+|\s+|[^\p{L}\p{N}_\s]/gu) || [];
// Diff de Myers (O((N+M)·D)): rápido cuando cambian pocas cosas, que es lo normal entre dos entregas seguidas.
// Devuelve las operaciones [['=', t] | ['-', t] | ['+', t]], o null si hay más de «tope» diferencias.
function myers(a, b, tope = 3000) {
  const n = a.length, m = b.length, max = n + m, off = max + 1;
  const v = new Int32Array(2 * max + 3), trace = [];
  for (let d = 0; d <= Math.min(max, tope); d++) {
    trace.push(v.slice(off - d - 1, off + d + 2)); // k de -d-1 a d+1, en la posición k + d + 1
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && v[off + k - 1] < v[off + k + 1]) ? v[off + k + 1] : v[off + k - 1] + 1, y = x - k;
      while (x < n && y < m && a[x] === b[y]) { x++; y++; }
      v[off + k] = x;
      if (x >= n && y >= m) {
        const ops = [];
        let cx = n, cy = m;
        for (let e = d; e > 0; e--) {
          const V = trace[e], get = kk => V[kk + e + 1], kk = cx - cy;
          const prevK = kk === -e || (kk !== e && get(kk - 1) < get(kk + 1)) ? kk + 1 : kk - 1;
          const px = get(prevK), py = px - prevK;
          while (cx > px && cy > py) { ops.push(['=', a[cx - 1]]); cx--; cy--; }
          if (cx === px) ops.push(['+', b[cy - 1]]); else ops.push(['-', a[cx - 1]]);
          cx = px; cy = py;
        }
        while (cx > 0 && cy > 0) { ops.push(['=', a[cx - 1]]); cx--; cy--; }
        return ops.reverse();
      }
    }
  }
  return null;
}
// Las palabras que cambian entre dos textos, cada trozo con unas palabras de contexto delante.
export function diffPalabras(a, b, contexto = 6) {
  const A = trozos(a), B = trozos(b);
  const ops = myers(A, B);
  if (!ops) return [{ antes: a, despues: b, contexto: '' }];
  const cambios = [], hechos = [];
  let actual = null;
  for (let i = 0; i < ops.length; i++) {
    const [op, t] = ops[i];
    // Un espacio igual entre dos cambios no los separa (se lee mejor «Hoy» → «El 12/11/2026 aún»).
    if (op === '=' && actual && /^\s+$/.test(t) && ops[i + 1] && ops[i + 1][0] !== '=') { actual.antes += t; actual.despues += t; hechos.push(t); continue; }
    if (op === '=') { if (actual) { cambios.push(actual); actual = null; } hechos.push(t); continue; }
    actual ||= { antes: '', despues: '', contexto: hechos.slice(-contexto).join('') };
    if (op === '-') actual.antes += t; else actual.despues += t;
    if (op === '-') hechos.push(t);
  }
  if (actual) cambios.push(actual);
  return cambios;
}

// ------------------------------------------------------------------ SQL normalizado
// Una sentencia por línea (las de fuera de los bloques do) más los dos bloques; clave estable para emparejar.
function sentenciasDe(SQL) {
  const lista = [];
  for (const m of SQL.matchAll(/^do \$(\w+)\$\n([\s\S]*?)^end \$\1\$;$/gm)) lista.push({ clave: `bloque ${m[1]}`, texto: m[0] });
  const fuera = SQL.replace(/^do \$(\w+)\$\n[\s\S]*?^end \$\1\$;$/gm, '').split('\n').filter(l => l.trim() && !l.startsWith('--'));
  const vistas = new Map();
  for (const l of fuera) {
    const m = l.match(/^insert into ([\w.]+) \(([^)]*)\) values \((.*)$/);
    let clave = l.slice(0, 80);
    if (m) {
      const cols = m[2].split(',').map(c => c.trim());
      // Clave: tabla + slug o url o id (lo primero que haya entre las columnas que identifican la fila).
      const id = ['slug', 'url', 'id', 'plataforma_id', 'fuente_id'].map(c => cols.indexOf(c)).filter(i => i >= 0);
      const valores = m[3].match(/'(?:[^']|'')*'(?:::\w+)?|[^,]+/g) || [];
      clave = `${m[1]} ${id.map(i => valores[i]).join(' ')}`;
    }
    const n = (vistas.get(clave) || 0) + 1; vistas.set(clave, n);
    lista.push({ clave: n > 1 ? `${clave} #${n}` : clave, texto: l });
  }
  return lista;
}
const sustituye = (t, pares) => pares.filter(([a]) => a).reduce((x, [a, b]) => x.split(a).join(b), t);
const formasFecha = f => [f, fechaLarga(f), fechaCorta(f)];

// Diff normalizado entre dos SQL. «iguala» son pares [texto, marcador] propios de cada lado.
export function diffSql(sqlA, sqlB, igualaA = [], igualaB = []) {
  const a = sentenciasDe(sustituye(sqlA, igualaA)), b = sentenciasDe(sustituye(sqlB, igualaB));
  const ma = new Map(a.map(x => [x.clave, x.texto])), mb = new Map(b.map(x => [x.clave, x.texto]));
  const cambian = [];
  for (const k of new Set([...ma.keys(), ...mb.keys()])) {
    const x = ma.get(k), y = mb.get(k);
    if (x === y) continue;
    cambian.push({ sentencia: k, ...(x === undefined ? { nueva: true } : y === undefined ? { quitada: true } : {}),
      palabras: x !== undefined && y !== undefined ? diffPalabras(x, y) : [] });
  }
  return { sentenciasA: a.length, sentenciasB: b.length, cambian };
}

// ------------------------------------------------------------------ resumen para los revisores
export function resumenRevision(opciones = {}) {
  const raiz = path.resolve(opciones.raiz || RAIZ_REPO);
  const D = cargarDecisiones(opciones.decisiones || path.join(opciones.ciclo, 'decisiones.json'));
  const C = contexto(D, { raiz, ciclo: opciones.ciclo });
  const { DIR, ETIQUETA, FECHA, DESDE, DESDE_FECHA, PREVIA, HASH_PREVIA } = C;
  const salida = path.resolve(opciones.salida || raiz);
  const DIR_SALIDA = path.join(salida, path.relative(raiz, DIR));
  const lote = n => path.join(n === ETIQUETA ? salida : raiz, `rwadar-app/data/importaciones/catalogo-${n}-v2`);
  const sqlHoy = fs.readFileSync(path.join(lote(ETIQUETA), 'aplicar-y-aprobar.sql'), 'utf8');
  const sqlAyer = fs.readFileSync(path.join(lote(DESDE), 'aplicar-y-aprobar.sql'), 'utf8');
  const rev = leer(path.join(lote(ETIQUETA), 'revision.json')), revAyer = leer(path.join(lote(DESDE), 'revision.json'));
  const contraste = leer(path.join(DIR_SALIDA, `contraste-${ETIQUETA}.json`));
  const contrasteAyer = fs.existsSync(path.join(raiz, `rwadar-app/data/verificaciones/${DESDE}-v2/contraste-${DESDE}.json`))
    ? leer(path.join(raiz, `rwadar-app/data/verificaciones/${DESDE}-v2/contraste-${DESDE}.json`)) : null;
  // Se igualan la revisión, la huella y las fechas del día de cada entrega (la de ayer con su fecha; la de hoy con la
  // suya): lo que queda es lo que cambia de verdad.
  const iguala = (r, f, extra = []) => [[r.revisionId, '<REVISION>'], [r.hash, '<HUELLA>'], [r.revisionAnterior, '<ANTERIOR>'], [r.hashRevisionAnterior, '<HUELLA_ANTERIOR>'],
    ...extra, ...formasFecha(f).map(x => [x, '<FECHA>'])];
  const ULT_AYER = revAyer.venceTrasEl, ULT = rev.venceTrasEl;
  const etq = (e, f) => e === f ? [] : [[e, '<ETIQUETA>']];
  const d = diffSql(sqlAyer, sqlHoy,
    iguala(revAyer, DESDE_FECHA, [...etq(DESDE, DESDE_FECHA), ...formasFecha(ULT_AYER).map(x => [x, '<ULTIMO>'])]),
    iguala(rev, FECHA, [...etq(ETIQUETA, FECHA), ...formasFecha(ULT).map(x => [x, '<ULTIMO>'])]));
  const invHoy = cuentaPorTabla(sqlHoy), invAyer = cuentaPorTabla(sqlAyer);
  const tarjetas = Object.entries(contraste.tarjetas || {}).filter(([s, t]) => JSON.stringify(t) !== JSON.stringify(contrasteAyer?.tarjetas?.[s]))
    .map(([s, t]) => ({ slug: s, antes: contrasteAyer?.tarjetas?.[s] || null, ahora: t }));
  const porFicha = {};
  for (const c of contraste.cambios) (porFicha[c.slug] ||= []).push(c);
  const corta = (t, n = 400) => t && t.length > n ? t.slice(0, n) + '…' : t;
  const md = [
    `# Qué cambia en la entrega ${ETIQUETA} (frente a la ${DESDE})`, '',
    `Generado por el motor (\`motor.mjs revisar ${ETIQUETA}\`) a partir de decisiones.json, el contraste y los dos SQL. Es el punto de partida de la revisión: cada revisor sigue haciendo sus propias pruebas.`, '',
    `- SQL de hoy: \`aplicar-y-aprobar.sql\` SHA-256 \`${sha(path.join(lote(ETIQUETA), 'aplicar-y-aprobar.sql'))}\`, revisión \`${rev.revisionId}\`.`,
    `- Parte de la publicada \`${PREVIA}\` (huella \`${HASH_PREVIA.slice(0, 16)}…\`); último día vigente ${fechaLarga(ULT)}.`,
    `- Inventario: ${JSON.stringify(invHoy) === JSON.stringify(invAyer) ? 'las mismas filas por tabla que ayer' : 'CAMBIA frente a ayer'} (${Object.entries(invHoy).map(([k, v]) => `${v} en ${k.split('.')[1]}`).join(', ')}).`,
    `- Sentencias del SQL que cambian algo más que la revisión, la huella y la fecha del día: **${d.cambian.length}** de ${d.sentenciasB}.`, '',
    `## Cambios por ficha (${contraste.cambios.length} en ${Object.keys(porFicha).length} fichas)`, '',
    ...Object.entries(porFicha).flatMap(([s, l]) => [`### ${s}`, '', ...l.map(c => `- ${c.campo}: ${c.antes == null ? '(nuevo)' : `«${corta(c.antes)}»`} → ${c.despues == null ? '(se quita)' : `«${corta(c.despues)}»`}`), '']),
    `## Tarjetas que cambian (${tarjetas.length})`, '',
    ...tarjetas.map(t => `- ${t.slug}: ${Object.keys(t.ahora).filter(k => t.ahora[k] !== t.antes?.[k]).map(k => `${k}: «${t.antes?.[k] ?? '—'}» → «${t.ahora[k]}»`).join('; ')}`), '',
    '## Sentencias del SQL que cambian (normalizado)', '',
    ...d.cambian.flatMap(c => [`### ${c.sentencia}${c.nueva ? ' (nueva)' : c.quitada ? ' (quitada)' : ''}`, '',
      ...c.palabras.slice(0, 40).map(p => `- …${corta(p.contexto, 80)} «${corta(p.antes, 300)}» → «${corta(p.despues, 300)}»`),
      ...(c.palabras.length > 40 ? [`- (y ${c.palabras.length - 40} cambios más en esta sentencia)`] : []), '']),
    `## Lo que no se aplicó tal cual (${D.noAplicado.length})`, '',
    ...D.noAplicado.map(n => `- ${n.slug}: ${n.que}`), '',
  ].join('\n');
  if (opciones.escribir !== false) { fs.mkdirSync(DIR_SALIDA, { recursive: true }); fs.writeFileSync(path.join(DIR_SALIDA, 'DIFF-ENTREGA.md'), md); }
  if (!opciones.silencio) console.log(`DIFF-ENTREGA.md: ${contraste.cambios.length} cambios en ${Object.keys(porFicha).length} fichas; ${tarjetas.length} tarjetas; ${d.cambian.length} sentencias del SQL con algo más que fechas e identificadores`);
  return { md, sql: d, tarjetas, cambios: contraste.cambios.length, inventario: invHoy, mismoInventario: JSON.stringify(invHoy) === JSON.stringify(invAyer) };
}

// ------------------------------------------------------------------ auditar una corrección
export async function auditar(opciones = {}) {
  const raiz = path.resolve(opciones.raiz || RAIZ_REPO);
  const D = cargarDecisiones(opciones.decisiones || path.join(opciones.ciclo, 'decisiones.json'));
  const C = contexto(D, { raiz, ciclo: opciones.ciclo });
  const { ETIQUETA, FECHA, DIR } = C;
  const log = opciones.silencio ? () => {} : console.log;
  const lote = path.join(raiz, `rwadar-app/data/importaciones/catalogo-${ETIQUETA}-v2`);
  const antes = path.resolve(opciones.antes);
  for (const n of ['aplicar-y-aprobar.sql', 'catalogo.sql', 'revision.json']) assert.ok(fs.existsSync(path.join(antes, n)), `auditar: falta ${n} en ${antes}`);
  const r = { etiqueta: ETIQUETA, hallazgos: [] };
  const hallazgo = t => { r.hallazgos.push(t); log('  NO   ', t); };

  // 1 · lo de la carpeta es exactamente lo que dice decisiones.json, y es reproducible.
  const { preparar } = await import('./preparar.mjs');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `rwadar-auditar-${ETIQUETA}-`));
  try {
    const huellas = [];
    for (const vez of [1, 2]) {
      const sal = path.join(tmp, `vez${vez}`);
      preparar({ raiz, ciclo: DIR, decisiones: opciones.decisiones, salida: sal, web: opciones.web, comprobaciones: opciones.comprobaciones });
      huellas.push(Object.fromEntries(SALIDAS(ETIQUETA).map(f => [f, sha(path.join(sal, f))])));
    }
    r.reproducible = JSON.stringify(huellas[0]) === JSON.stringify(huellas[1]);
    if (!r.reproducible) hallazgo('preparar no es reproducible: la segunda vez salen otros SHA-256');
    const distintos = SALIDAS(ETIQUETA).filter(f => !fs.existsSync(path.join(raiz, f)) || sha(path.join(raiz, f)) !== huellas[0][f]);
    r.carpetaIgualADecisiones = !distintos.length;
    if (distintos.length) hallazgo(`lo que hay en la carpeta no es lo que sale de decisiones.json: ${distintos.join(', ')}`);
    r.huellas = huellas[0];
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }

  // 2 y 3 · inventario y diff normalizado frente a la copia de antes de corregir.
  const sqlAntes = fs.readFileSync(path.join(antes, 'aplicar-y-aprobar.sql'), 'utf8'), sqlAhora = fs.readFileSync(path.join(lote, 'aplicar-y-aprobar.sql'), 'utf8');
  const revAntes = leer(path.join(antes, 'revision.json')), revAhora = leer(path.join(lote, 'revision.json'));
  const esperado = rv => ({ nueva: rv.revisionId, previa: C.PREVIA, hashPrevia: C.HASH_PREVIA, fecha: FECHA, ultimo: C.ULTIMO, colecciones: C.COLECCIONES });
  let invA, invB;
  try { invA = inventario(sqlAntes, esperado(revAntes)); invB = inventario(sqlAhora, esperado(revAhora)); }
  catch (e) { hallazgo(`inventario: ${e.message}`); }
  r.mismoInventario = !!(invA && invB && JSON.stringify(invA.cuenta) === JSON.stringify(invB.cuenta) && invA.total === invB.total);
  if (invA && invB && !r.mismoInventario) hallazgo(`el inventario cambia: ${JSON.stringify(invA.cuenta)} (${invA.total}) → ${JSON.stringify(invB.cuenta)} (${invB.total})`);
  r.inventario = invB ? { sentencias: invB.total, porTabla: invB.cuenta } : null;
  const d = diffSql(sqlAntes, sqlAhora, [[revAntes.revisionId, '<REVISION>'], [revAntes.hash, '<HUELLA>']], [[revAhora.revisionId, '<REVISION>'], [revAhora.hash, '<HUELLA>']]);
  r.sqlCambia = d.cambian.length > 0;
  r.sha256 = { antes: sha(path.join(antes, 'aplicar-y-aprobar.sql')), ahora: sha(path.join(lote, 'aplicar-y-aprobar.sql')) };
  r.diferencias = d.cambian.map(c => ({ sentencia: c.sentencia, ...(c.nueva ? { nueva: true } : {}), ...(c.quitada ? { quitada: true } : {}),
    palabras: c.palabras.map(p => ({ antes: p.antes.slice(0, 600), despues: p.despues.slice(0, 600) })) }));
  {
    const cat = diffSql(fs.readFileSync(path.join(antes, 'catalogo.sql'), 'utf8'), fs.readFileSync(path.join(lote, 'catalogo.sql'), 'utf8'),
      [[revAntes.revisionId, '<REVISION>'], [revAntes.hash, '<HUELLA>']], [[revAhora.revisionId, '<REVISION>'], [revAhora.hash, '<HUELLA>']]);
    const claves = x => JSON.stringify(x.cambian.map(c => c.sentencia).filter(k => !k.startsWith('bloque')));
    if (claves(cat) !== claves(d)) hallazgo('catalogo.sql y aplicar-y-aprobar.sql no cambian en las mismas sentencias');
    const sinIds = x => JSON.stringify({ ...x, revisionId: 0, hash: 0 });
    if (sinIds(revAntes) !== sinIds(revAhora)) hallazgo('revision.json cambia algo más que la revisión y la huella');
  }

  // 4 · el ensayo en PGlite sobre lo que hay.
  if (!opciones.sinPglite) {
    try {
      const { comprobar } = await import('./comprobar.mjs');
      const c = await comprobar({ raiz, ciclo: DIR, decisiones: opciones.decisiones, hoy: opciones.hoy, silencio: true, escribirInforme: false });
      r.comprobar = { resultado: c.resultado, pruebas: c.pruebas, casosDeFallo: c.casosDeFallo, sha256: c.sha256 };
    } catch (e) { hallazgo(`comprobar: ${e.message.split('\n')[0]}`); r.comprobar = { resultado: 'falla' }; }
  }

  // 5 · escáner de secretos (gitleaks 8.30.1) sobre lo que irá a Git, si está a mano.
  const gitleaks = opciones.gitleaks || process.env.RWADAR_GITLEAKS;
  if (gitleaks && fs.existsSync(gitleaks)) {
    const copia = fs.mkdtempSync(path.join(os.tmpdir(), `rwadar-secretos-${ETIQUETA}-`));
    try {
      const ls = spawnSync('git', ['-C', raiz, 'ls-files', '--others', '--cached', '--exclude-standard', '--',
        path.relative(raiz, DIR), path.relative(raiz, lote)], { encoding: 'utf8' });
      assert.equal(ls.status, 0, 'git ls-files');
      for (const f of ls.stdout.split('\n').filter(Boolean)) {
        if (!fs.existsSync(path.join(raiz, f))) continue;
        fs.mkdirSync(path.dirname(path.join(copia, f)), { recursive: true });
        fs.copyFileSync(path.join(raiz, f), path.join(copia, f));
      }
      const g = spawnSync(gitleaks, ['dir', copia, '--config', path.join(raiz, 'rwadar-app/gitleaks.toml'), '--redact=100', '--no-banner', '--no-color'], { encoding: 'utf8' });
      r.secretos = { ejecutado: true, salida: g.status === 0 ? 'sin hallazgos' : (g.stdout + g.stderr).slice(-2000) };
      if (g.status !== 0) hallazgo('el escáner de secretos encuentra algo en lo que irá a Git');
    } finally { fs.rmSync(copia, { recursive: true, force: true }); }
  } else r.secretos = { ejecutado: false, motivo: 'sin gitleaks a mano (--gitleaks=RUTA o RWADAR_GITLEAKS)' };

  // Veredicto: conforme sin auditor solo si todo lo anterior está bien y el SQL no cambió. Si cambió, hace falta el
  // auditor (agente) para ver que cada diferencia es una corrección pedida.
  r.conforme = !r.hallazgos.length;
  r.necesitaAuditor = r.sqlCambia;
  r.veredicto = !r.conforme ? 'no_conforme' : r.sqlCambia ? 'sql_cambiado_falta_auditor' : 'conforme_sin_cambios_en_el_sql';
  log(JSON.stringify(r, null, 1));
  return r;
}
void crypto; void escRx;

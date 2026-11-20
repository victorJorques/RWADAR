// Pruebas del motor de la entrega (rápidas, sin red ni PGlite; unos segundos). Las corre «npm test» (rwadar-app).
//   node --test .claude/skills/investigacion-catalogo/entrega/motor.test.mjs
// La prueba principal: el motor rehace la entrega real del 12/11 desde su decisiones.json y sale idéntica byte a byte.
// Lo que se mueve después de cada ciclo (el catálogo sincronizado de la web, transparencia.json y las comprobaciones de
// las fuentes) se fija con lo de ese día: la lectura pública del 12/11 y las copias de pruebas/.
// El ensayo en PGlite (unos 35 s) está aparte: pglite.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '../../../..');
const CICLO = path.join(RAIZ, 'rwadar-app/data/verificaciones/2026-11-12-v2');
const { preparar } = await import('./preparar.mjs');
const { despues } = await import('./despues.mjs');
const { auditar, diffSql, diffPalabras, resumenRevision } = await import('./revisar.mjs');
const { inventario } = await import('./sql.mjs');
const { escribirGuiones, principal } = await import('./motor.mjs');
const { comprobarCalculo, consultasDeHoy, inicioCiclo, resolverPrueba } = await import('./comun.mjs');

const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const tmp = nombre => fs.mkdtempSync(path.join(os.tmpdir(), `rwadar-motor-${nombre}-`));
const DECISIONES = leer(path.join(CICLO, 'decisiones.json'));
const COMPROBACIONES = leer(path.join(AQUI, 'pruebas/comprobaciones-fuentes-2026-11-12.json'));
// El catálogo sincronizado de la web el 12/11 antes de aplicar: la publicada 24b5f7de, tal como la leyó un visitante.
const lp = n => leer(path.join(CICLO, 'lectura-publica', n));
const WEB_ANTES = { plataformas: lp('plataformas-v2.json').map(p => ({ slug: p.slug, revisionId: p.revision_id })),
  ofertas: lp('ofertas-v2.json').map(o => ({ slug: o.slug, revisionId: o.revision_id, verificadaEl: o.verificada_el })) };
const SALIDAS = [
  'rwadar-app/data/verificaciones/2026-11-12-v2/radar-canonico-26.json', 'rwadar-app/data/verificaciones/2026-11-12-v2/escaparate-publicacion.json',
  'rwadar-app/data/verificaciones/2026-11-12-v2/documentacion-ofertas.json', 'rwadar-app/data/verificaciones/2026-11-12-v2/manifiesto-catalogo.json',
  'rwadar-app/data/verificaciones/2026-11-12-v2/contraste-2026-11-12.json', 'rwadar-app/data/importaciones/catalogo-2026-11-12-v2/catalogo.sql',
  'rwadar-app/data/importaciones/catalogo-2026-11-12-v2/aplicar-y-aprobar.sql', 'rwadar-app/data/importaciones/catalogo-2026-11-12-v2/revision.json',
];
const prepara = (extra = {}) => preparar({ raiz: RAIZ, ciclo: CICLO, web: WEB_ANTES, comprobaciones: COMPROBACIONES, ...extra });
// Prepara con un decisiones.json cambiado (se escribe en una carpeta temporal) y devuelve el error, o null.
function conDecisiones(cambia, extra = {}) {
  const d = structuredClone(DECISIONES); cambia(d);
  const dir = tmp('decisiones'), ruta = path.join(dir, 'decisiones.json');
  fs.writeFileSync(ruta, JSON.stringify(d, null, 2));
  try { prepara({ decisiones: ruta, salida: path.join(dir, 'salida'), ...extra }); return null; }
  catch (e) { return e; }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
const cambio = (d, slug, tipo, n = 0) => d.ofertas[slug].cambios.filter(c => c.tipo === tipo)[n];

// ------------------------------------------------------------------ la entrega del 12/11, rehecha
let SALIDA;
test('preparar rehace la entrega real del 12/11 desde decisiones.json, idéntica byte a byte (y dos veces igual)', () => {
  SALIDA = tmp('1211');
  const r = prepara({ salida: SALIDA });
  assert.equal(r.sha256, 'd4d73024c079d447d34e01168d31401eb5f62c57a16c2ae2194dd031c2714e4d', 'el SHA-256 del SQL que aprobó la verificación del 12/11');
  assert.deepEqual([r.revisionId, r.previa, r.cambios, r.noAplicado], ['a58dd22d-98a3-f94e-ba66-46898162215a', '24b5f7de-2834-3e15-6ae4-62a6d9565161', 83, 10]);
  for (const f of SALIDAS) assert.ok(fs.readFileSync(path.join(SALIDA, f)).equals(fs.readFileSync(path.join(RAIZ, f))), `${f}: distinto del de la entrega real`);
  const otra = tmp('1211b');
  try {
    prepara({ salida: otra });
    for (const f of SALIDAS) assert.equal(sha(path.join(otra, f)), sha(path.join(SALIDA, f)), `${f}: no es reproducible`);
  } finally { fs.rmSync(otra, { recursive: true, force: true }); }
});

test('despues rehace el transparencia.json del 12/11 byte a byte, y repetirlo no cambia nada', async () => {
  const dir = tmp('despues');
  try {
    // El catálogo sincronizado después de aplicar: la revisión nueva con los datos que acaba de preparar el motor.
    const esc = leer(path.join(SALIDA, SALIDAS[1])), doc = leer(path.join(SALIDA, SALIDAS[2])), rev = leer(path.join(SALIDA, SALIDAS[7]));
    const web = { plataformas: esc.plataformas.map(p => ({ slug: p.slug, revisionId: rev.revisionId })),
      ofertas: esc.ofertas.map(o => ({ ...o, revisionId: rev.revisionId, documentacion: doc[o.slug] })) };
    const opciones = { raiz: RAIZ, ciclo: CICLO, salida: SALIDA, web, transparencia: path.join(AQUI, 'pruebas/transparencia-2026-11-11.json'), silencio: true };
    const r = await despues(opciones);
    assert.equal(sha(r.destino), 'ae3ed55e56c8a29c444c839e205529c4f5c6bc721d1c47925ed027493aa59f62', 'transparencia.json del commit del 12/11 (ae6efc6)');
    assert.equal(r.cortos.length, 13);
    const otra = await despues(opciones);
    assert.deepEqual(otra.cambios, [], 'repetido, no cambia nada');
    // Se niega si el catálogo sincronizado no es la revisión nueva.
    const vieja = { ...web, ofertas: web.ofertas.map((o, i) => i ? o : { ...o, revisionId: '24b5f7de-2834-3e15-6ae4-62a6d9565161' }) };
    await assert.rejects(despues({ ...opciones, web: vieja }), /el catálogo sincronizado no es la revisión/);
    // Un mínimo corto que no es el de partida esperado: para.
    const d = structuredClone(DECISIONES); d.transparencia.minimosCortos.switzerlend.antes = '1 acción (99 CHF, 11/11)';
    fs.writeFileSync(path.join(dir, 'd.json'), JSON.stringify(d));
    fs.rmSync(r.destino);
    await assert.rejects(despues({ ...opciones, decisiones: path.join(dir, 'd.json') }), /switzerlend: mínimo corto de partida/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('revisar: el diff para los revisores enseña lo que cambia de verdad frente a la entrega anterior', () => {
  const r = resumenRevision({ raiz: RAIZ, ciclo: CICLO, salida: SALIDA, silencio: true });
  assert.equal(r.cambios, 83); assert.equal(r.tarjetas.length, 14); assert.ok(r.mismoInventario);
  assert.ok(r.sql.cambian.length > 0 && r.sql.cambian.length < 30, 'solo las sentencias con algo más que fechas e identificadores');
  assert.ok(r.sql.cambian.some(c => c.sentencia.includes("'mtbill'") && c.palabras.some(p => p.despues.includes('3,45 % anual'))));
  assert.ok(!r.sql.cambian.some(c => c.sentencia.includes("'kraken-xstocks'")), 'Kraken solo cambia de fecha: no sale');
  assert.match(r.md, /^# Qué cambia en la entrega 2026-11-12 \(frente a la 2026-11-11\)/);
});

// ------------------------------------------------------------------ las guardas (cada mutación tiene que fallar)
test('guardas de preparar: cada cambio indebido en decisiones.json para la entrega', () => {
  const casos = [
    ['«antes» que no es lo publicado', d => { cambio(d, 'aktionariat', 'aviso').antes += ' '; }, /aviso «.*»: no encontrado/],
    ['propuesta del expediente sin declarar (difiere)', d => { delete d.ofertas.mtbill.difiere.metricas; }, /difiere del expediente de hoy sin decirlo/],
    ['«difiere» que sobra', d => { d.ofertas['robinhood-classic-stock-tokens'].difiere.resumen = 'motivo de prueba de más'; }, /«difiere» declarado, pero coincide/],
    ['copia con otro SHA-256', d => { d.pruebas.spikoSmartCash[0].copia.sha256 = '0'.repeat(64); }, /no tiene el SHA-256 anotado/],
    ['afirmación del expediente que no existe', d => { cambio(d, 'aktionariat', 'metrica').prueba = { claim: 'precio', url: 'https://ejemplo.invalid/' }; }, /afirmación «precio».*0 encontradas/],
    ['prueba por dirección que hoy no se consultó', d => { cambio(d, 'aktionariat', 'metrica').prueba = { url: 'https://ejemplo.invalid/x', hora: '2026-11-12T01:00:00Z', literal: 'algo' }; }, /no está entre las consultas de hoy/],
    ['hora de hoy, pero de antes de empezar el ciclo (copiada de otro día)', d => { cambio(d, 'aktionariat', 'metrica').prueba = { url: 'https://shares.aktionariat.com/invest', hora: '2026-11-12T00:10:00Z', literal: 'algo' }; }, /de antes de empezar el ciclo/],
    ['hora de la prueba de otro día', d => { cambio(d, 'aktionariat', 'metrica').prueba = { url: 'https://shares.aktionariat.com/invest', hora: '2026-11-11T01:00:00Z', literal: 'algo' }; }, /no es de hoy/],
    ['documento que no dice la frase', d => { cambio(d, 'mtbill', 'avisoNuevo').prueba = { documento: 'DECISIONES-COORDINADOR.md', contiene: 'una frase que no está' }; }, /no dice «una frase que no está»/],
    ['cálculo de la rentabilidad que no cuadra', d => { cambio(d, 'mtbill', 'metricaNueva').calculos[0].resultado = '3,46'; }, /rentabilidad anual simple 3,45 y no 3,46/],
    ['comisión mal redondeada (96,42)', d => { const c = cambio(d, 'local-de-estanco-klagenfurt', 'referenciaNueva'); c.calculos[0].resultado = '96,42'; }, /da 96,43 y no 96,42/],
    ['otra huella de la publicada', d => { d.previa.hash = 'f'.repeat(64); }, /identidad \(huella\)/],
    ['otra revisión publicada', d => { d.previa.revisionId = '00000000-0000-0000-0000-000000000000'; }, /no es la revisión publicada/],
    ['hora de la lectura pública que no es', d => { d.lecturaPublica.hora = '2026-11-12T01:00:00Z – 2026-11-12T01:00:04Z'; }, /hora de la lectura pública/],
    ['fecha de ayer en un aviso nuevo', d => { cambio(d, 'mtbill', 'avisoNuevo').despues = 'La rentabilidad es pasada (del 06/10 al 11/11) y no garantiza la futura.'; }, /fecha vieja/],
    ['cifra prohibida (3,53 %) en un texto nuevo', d => { cambio(d, 'mtbill', 'avisoNuevo').despues = 'La rentabilidad fue del 3,53 % en cuatro semanas y no garantiza la futura.'; }, /3,53/],
    ['dato de tarjeta de más de 120 caracteres', d => { const c = cambio(d, 'switzerlend', 'tarjeta'); c.despues = `1 acción (68,01 CHF el 12/11) ${'y más texto '.repeat(10)}`; d.ofertas.switzerlend.difiere = { 'tarjeta.minimo': 'mutación de la prueba' }; }, /pasa de 120/],
    ['«por participación» en el mínimo', d => { const c = cambio(d, 'fotovoltaica-cohotel', 'tarjeta'); c.despues = 'Desde 102 € por participación en reventa (12/11)'; d.ofertas['fotovoltaica-cohotel'].difiere = { 'tarjeta.minimo': 'mutación de la prueba' }; }, /por participación/],
    ['fuente técnica nueva sin admitir', d => { cambio(d, 'boss-info', 'referencia').despues.fuente = 'https://shares.bossinfo.com/api/nueva.json'; }, /fuente técnica nueva/],
    ['una oferta que no está publicada (alta)', d => { d.ofertas['oferta-nueva'] = { cambios: [] }; }, /no están publicadas/],
    ['candidata admitida', d => { d.candidatas = d.candidatas.slice(1); }, /candidatas de decisiones.json = los expedientes/],
    ['clave desconocida', d => { d.altas = []; }, /clave desconocida «altas»/],
    ['tipo de cambio desconocido', d => { cambio(d, 'aktionariat', 'metrica').tipo = 'borrar'; }, /tipo «borrar» desconocido/],
    ['un nombre en vez de «responsable del proyecto»', d => { d.pedido = 'puesta al día pedida por alguien'; }, /responsable del proyecto/],
    ['un nombre además de «responsable del proyecto»', d => { d.pedido = 'puesta al día pedida por el responsable del proyecto, Juan Pérez'; }, /responsable del proyecto/],
    ['último día que no es la fecha más la vigencia', d => { d.ultimoDia = '2026-11-20'; }, /ultimoDia/],
    ['oferta «sin cambios» con cambios', d => { d.sinCambios.push('aktionariat'); }, /sinCambios/],
  ];
  for (const [nombre, cambia, rx] of casos) {
    const e = conDecisiones(cambia);
    assert.ok(e, `${nombre}: tenía que fallar`);
    assert.match(e.message, rx, `${nombre}: falló por otra cosa: ${e.message.split('\n')[0]}`);
  }
  // Y el catálogo de la web en otra revisión: no se monta.
  const web = { ...WEB_ANTES, ofertas: WEB_ANTES.ofertas.map((o, i) => i ? o : { ...o, revisionId: 'a58dd22d-98a3-f94e-ba66-46898162215a' }) };
  const dir = tmp('web');
  try { assert.throws(() => prepara({ salida: dir, web }), /el catálogo sincronizado de la web no es/); }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('radar: cambios-radar.json cambia el texto de un aviso de plataforma por su código, solo con el «antes» publicado', () => {
  const cr = leer(path.join(CICLO, 'cambios-radar.json'));
  const radar = leer(path.join(CICLO, 'radar-canonico-26.json'));
  const p = radar.plataformas.find(x => x.alertasCriticas.length), a = p.alertasCriticas[0];
  const con = alertas => { const dir = tmp('alertas');
    try { prepara({ salida: dir, cambiosRadar: { ...cr, plataformas: { [p.slug]: { alertas } } } });
      return leer(path.join(dir, path.relative(RAIZ, CICLO), 'radar-canonico-26.json')); }
    finally { fs.rmSync(dir, { recursive: true, force: true }); } };
  const r = con({ [a.codigo]: { antes: a.detalle, detalle: 'Texto nuevo del aviso, de prueba.', motivo: 'prueba' } });
  const q = r.plataformas.find(x => x.slug === p.slug);
  assert.equal(q.alertasCriticas[0].detalle, 'Texto nuevo del aviso, de prueba.');
  assert.deepEqual(q.alertasCriticas[0].fuentes, a.fuentes, 'las fuentes del aviso no cambian');
  assert.deepEqual({ ...q, alertasCriticas: p.alertasCriticas }, { ...p }, 'nada más cambia en la plataforma');
  assert.throws(() => con({ [a.codigo]: { antes: a.detalle + ' ', detalle: 'x', motivo: 'm' } }), /«antes» = lo publicado/);
  assert.throws(() => con({ codigo_que_no_existe: { antes: a.detalle, detalle: 'x', motivo: 'm' } }), /aviso desconocido/);
  assert.throws(() => con({ [a.codigo]: { antes: a.detalle, detalle: 'x', motivo: 'm', fuentes: ['otra'] } }), /solo antes, detalle y motivo/);
});

test('cálculos: el motor rehace las cifras de RWAdar', () => {
  assert.equal(comprobarCalculo({ tipo: 'comision', precio: '95', porcentaje: '1,5', resultado: '96,43' }, 't'), '96,43');
  assert.equal(comprobarCalculo({ tipo: 'comision', precio: '68,80', porcentaje: '1,5', resultado: '69,83' }, 't'), '69,83');
  assert.throws(() => comprobarCalculo({ tipo: 'comision', precio: '99', porcentaje: '1,5', resultado: '100,48' }, 't'), /100,49/);
  assert.equal(comprobarCalculo({ tipo: 'anualSimple', desde: { valor: 107410723, ts: 1791296171 }, hasta: { valor: 107768132, ts: 1794336023 }, resultado: '3,45', dias: '35.18' }, 't'), '3,45');
  assert.throws(() => comprobarCalculo({ tipo: 'otro' }, 't'), /desconocido/);
});

// ------------------------------------------------------------------ SQL: inventario y diff normalizado
test('inventario del SQL: solo inserts en rwadar_catalogo con la guarda y la aprobación; lo demás falla', () => {
  const SQL = fs.readFileSync(path.join(RAIZ, SALIDAS[6]), 'utf8');
  const esperado = { nueva: 'a58dd22d-98a3-f94e-ba66-46898162215a', previa: '24b5f7de-2834-3e15-6ae4-62a6d9565161',
    hashPrevia: '24b5f7de28343e156ae462a6d9565161d49d251cb45b9422b208c0fb0bceec22', fecha: '2026-11-12', ultimo: '2026-11-19', colecciones: { principales: 8, secundario: 13, en_camino: 1 } };
  const i = inventario(SQL, esperado);
  assert.equal(i.total, 288); assert.equal(i.inserts, 284);
  const linea = SQL.split('\n').findIndex(l => l.startsWith('insert into rwadar_catalogo.ofertas'));
  const con = extra => { const l = SQL.split('\n'); l.splice(linea, 0, extra); return l.join('\n'); };
  for (const [nombre, sql, rx] of [
    ['un borrado', con('delete from rwadar_catalogo.ofertas;'), /prohibida/],
    ['escribir en public', con("update public.plataformas set nombre = 'x';"), /solo hay inserts|public/],
    ['un permiso', con('grant all on rwadar_catalogo.ofertas to anon;'), /prohibida/],
    ['sin guarda', SQL.replace(/^do \$guarda\$[\s\S]*?^end \$guarda\$;\n/m, ''), /guarda y aprobación/],
    ['sin la fecha tope', SQL.replace("current_date > date '2026-11-19'", "current_date > date '2026-12-31'"), /fecha tope/],
  ]) assert.throws(() => inventario(sql, esperado), rx, nombre);
  assert.throws(() => inventario(SQL, { ...esperado, previa: '00000000-0000-0000-0000-000000000000' }), /publicada exacta/);
});

test('diff normalizado del SQL y diff de palabras', () => {
  const SQL = fs.readFileSync(path.join(RAIZ, SALIDAS[6]), 'utf8');
  assert.deepEqual(diffSql(SQL, SQL).cambian, []);
  const otro = SQL.replace('El 12/11/2026 aún no se podía invertir', 'Hoy no se puede invertir');
  const d = diffSql(SQL, otro);
  assert.equal(d.cambian.length, 1);
  assert.match(d.cambian[0].sentencia, /^rwadar_catalogo\.ofertas 'hausera-proximas-ofertas'/);
  assert.deepEqual(d.cambian[0].palabras.map(p => [p.antes, p.despues]), [['El 12/11/2026 aún ', 'Hoy '], ['podía', 'puede']]);
  assert.deepEqual(diffPalabras('x 1 y 2 z', 'x 1 y 9 z').map(p => [p.antes, p.despues]), [['2', '9']]);
});

test('auditar: si la corrección no cambia el SQL basta la comprobación determinista; si lo cambia, pide el auditor', async () => {
  const antes = tmp('antes');
  try {
    for (const n of ['aplicar-y-aprobar.sql', 'catalogo.sql', 'revision.json'])
      fs.copyFileSync(path.join(RAIZ, 'rwadar-app/data/importaciones/catalogo-2026-11-12-v2', n), path.join(antes, n));
    const comunes = { raiz: RAIZ, ciclo: CICLO, antes, web: WEB_ANTES, comprobaciones: COMPROBACIONES, sinPglite: true, silencio: true };
    const r = await auditar(comunes);
    assert.deepEqual([r.veredicto, r.sqlCambia, r.reproducible, r.carpetaIgualADecisiones, r.mismoInventario, r.hallazgos],
      ['conforme_sin_cambios_en_el_sql', false, true, true, true, []]);
    // La copia de antes tiene que ser exactamente el SQL que vieron los revisores (el SHA-256 del montador).
    const SHA_1211 = 'd4d73024c079d447d34e01168d31401eb5f62c57a16c2ae2194dd031c2714e4d';
    const rv = await auditar({ ...comunes, revisado: SHA_1211 });
    assert.deepEqual([rv.veredicto, rv.copiaEsLaRevisada], ['conforme_sin_cambios_en_el_sql', true]);
    const rx = await auditar({ ...comunes, revisado: 'ab'.repeat(32) });
    assert.deepEqual([rx.veredicto, rx.copiaEsLaRevisada], ['no_conforme', false]);
    assert.ok(rx.hallazgos.some(h => /no es el SQL revisado/.test(h)), rx.hallazgos.join(' | '));
    // Cuando sustituye al auditor, sin escáner de secretos no es conforme.
    const sinGitleaks = process.env.RWADAR_GITLEAKS; delete process.env.RWADAR_GITLEAKS;
    try {
      const rs = await auditar({ ...comunes, exigirSecretos: true });
      assert.equal(rs.veredicto, 'no_conforme');
      assert.ok(rs.hallazgos.some(h => /escáner de secretos/.test(h)), rs.hallazgos.join(' | '));
      const rn = await auditar({ ...comunes, exigirSecretos: true, gitleaks: path.join(antes, 'no-existe') });
      assert.equal(rn.veredicto, 'no_conforme');
    } finally { if (sinGitleaks !== undefined) process.env.RWADAR_GITLEAKS = sinGitleaks; }
    // El SQL de antes de corregir decía «Hoy no se puede invertir» (como el 12/11): cambia una sentencia, falta el auditor.
    for (const n of ['aplicar-y-aprobar.sql', 'catalogo.sql']) {
      const p = path.join(antes, n);
      fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace('El 12/11/2026 aún no se podía invertir', 'Hoy no se puede invertir'));
    }
    const r2 = await auditar(comunes);
    assert.equal(r2.veredicto, 'sql_cambiado_falta_auditor');
    assert.equal(r2.diferencias.length, 1);
    assert.deepEqual(r2.diferencias[0].palabras, [{ antes: 'Hoy ', despues: 'El 12/11/2026 aún ' }, { antes: 'puede', despues: 'podía' }]);
    // Una sentencia de más en la copia de antes: el inventario cambia y no es conforme.
    const p = path.join(antes, 'aplicar-y-aprobar.sql');
    fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/^(insert into rwadar_catalogo\.alertas .*)$/m, '$1\n$1'));
    const r3 = await auditar(comunes);
    assert.equal(r3.veredicto, 'no_conforme');
    assert.ok(r3.hallazgos.some(h => /inventario/.test(h)), r3.hallazgos.join(' | '));
  } finally { fs.rmSync(antes, { recursive: true, force: true }); }
});


test("auditar: cada guarda que sustituye al auditor da no_conforme", async () => {
  const antes = tmp("antes-guardas");
  const copia = () => { for (const n of ["aplicar-y-aprobar.sql", "catalogo.sql", "revision.json"])
    fs.copyFileSync(path.join(RAIZ, "rwadar-app/data/importaciones/catalogo-2026-11-12-v2", n), path.join(antes, n)); };
  const comunes = { raiz: RAIZ, ciclo: CICLO, antes, web: WEB_ANTES, comprobaciones: COMPROBACIONES, sinPglite: true, silencio: true };
  const con = (r, rx) => { assert.equal(r.veredicto, "no_conforme", r.hallazgos.join(" | ")); assert.ok(r.hallazgos.some(h => rx.test(h)), r.hallazgos.join(" | ")); };
  try {
    copia();
    // 1. Lo de la carpeta no sale de decisiones.json (una corrección hecha a mano, fuera de decisiones.json).
    const d = structuredClone(DECISIONES); d.orden = "Otra frase de la orden";
    const ruta = path.join(antes, "d.json"); fs.writeFileSync(ruta, JSON.stringify(d));
    con(await auditar({ ...comunes, decisiones: ruta }), /no es lo que sale de decisiones\.json/);
    // 2. catalogo.sql y aplicar-y-aprobar.sql no cambian en las mismas sentencias.
    const cat = path.join(antes, "catalogo.sql");
    fs.writeFileSync(cat, fs.readFileSync(cat, "utf8").replace("El 12/11/2026 aún no se podía invertir", "Hoy no se puede invertir"));
    con(await auditar(comunes), /no cambian en las mismas sentencias/); copia();
    // 3. revision.json cambia algo más que la revisión y la huella.
    const rv = path.join(antes, "revision.json"); fs.writeFileSync(rv, JSON.stringify({ ...leer(rv), ofertas: 23 }));
    con(await auditar(comunes), /revision\.json cambia algo más/); copia();
    // 4. El ensayo en PGlite que falla (un día fuera de la vigencia) no es conforme.
    con(await auditar({ ...comunes, sinPglite: false, hoy: "2026-12-31" }), /^comprobar: /);
    // 5. El escáner de secretos que encuentra algo (gitleaks simulado que sale con 1).
    const falso = path.join(antes, "gitleaks-falso"); fs.writeFileSync(falso, "#!/bin/sh\nexit 1\n", { mode: 0o755 });
    con(await auditar({ ...comunes, gitleaks: falso, exigirSecretos: true }), /encuentra algo/);
  } finally { fs.rmSync(antes, { recursive: true, force: true }); }
});

test('consultas de hoy: una hora con la fecha de hoy pero de antes de empezar el ciclo no cuenta (hora copiada de otro día)', () => {
  const inicio = inicioCiclo(DECISIONES);
  assert.equal(new Date(inicio).toISOString(), '2026-11-12T00:30:28.000Z', 'el ciclo del 12/11 empezó con la lectura pública');
  const e = { claims: [
    { campo: 'a', fuentePrimaria: 'https://copiada.example/x', consultadoUtc: '2026-11-12T00:10:00Z' },
    { campo: 'b', fuentePrimaria: 'https://de-hoy.example/y', consultadoUtc: '2026-11-12T09:00:00Z' },
  ], registros: [{ url: 'https://registro.example/z', consultadoUtc: '2026-11-12T00:29:59Z' }] };
  assert.deepEqual([...consultasDeHoy(e, '2026-11-12', inicio).keys()], ['de-hoy.example/y?']);
  assert.equal(consultasDeHoy(e, '2026-11-12').size, 3, 'sin inicio, como antes: cuenta la fecha');
  // Una afirmación del expediente con esa hora tampoco vale como prueba de un cambio (13/11: 79 de las tres suizas).
  const ctx = h => ({ D: DECISIONES, DIR: CICLO, FECHA: '2026-11-12', donde: 'prueba',
    expediente: { claims: [{ campo: 'precio', fuentePrimaria: 'https://de-hoy.example/y', literal: 'precio 7,20', consultadoUtc: h }] } });
  assert.throws(() => resolverPrueba({ claim: 'precio' }, ctx('2026-11-12T00:10:00Z')), /de antes de empezar el ciclo/);
  assert.equal(resolverPrueba({ claim: 'precio' }, ctx('2026-11-12T09:00:00Z'))[0].hora, '2026-11-12T09:00:00Z');
  // despues.mjs (transparencia.json) usa la misma regla.
  assert.match(fs.readFileSync(path.join(AQUI, 'despues.mjs'), 'utf8'), /consultasDeHoy\(e, FECHA, inicioCiclo\(D\)\)/);
});

// ------------------------------------------------------------------ los guiones finos de la carpeta del ciclo
test('guiones: los tres guiones finos llaman al motor y no pisan uno que no lo es', async () => {
  const dir = path.join(tmp('guiones'), '2026-11-12-v2');
  fs.mkdirSync(dir);
  try {
    assert.deepEqual(escribirGuiones(dir), ['preparar-entrega.mjs', 'comprobar-entrega.mjs', 'despues-de-aplicar.mjs', 'ensayo-rest-simulado.cjs']);
    for (const n of ['preparar-entrega.mjs', 'comprobar-entrega.mjs', 'despues-de-aplicar.mjs']) {
      const t = fs.readFileSync(path.join(dir, n), 'utf8');
      assert.match(t, /import \{ ejecutar \} from '\.\.\/\.\.\/\.\.\/\.\.\/\.claude\/skills\/investigacion-catalogo\/entrega\/motor\.mjs';/);
      assert.ok(t.split('\n').length < 8, `${n}: guion fino`);
    }
    assert.deepEqual(escribirGuiones(dir).length, 4, 'repetible');
    fs.writeFileSync(path.join(dir, 'preparar-entrega.mjs'), '// guion de otro día\n');
    assert.throws(() => escribirGuiones(dir), /no es el guion fino/);
    // En la carpeta real del ciclo, los guiones apuntan al motor con la ruta buena.
    const destino = path.resolve(CICLO, '../../../../.claude/skills/investigacion-catalogo/entrega/motor.mjs');
    assert.equal(destino, path.join(AQUI, 'motor.mjs'));
  } finally { fs.rmSync(path.dirname(dir), { recursive: true, force: true }); }
  await assert.rejects(principal(['borrar', '2026-11-12']), /orden desconocida/);
});

test.after(() => { if (SALIDA) fs.rmSync(SALIDA, { recursive: true, force: true }); });

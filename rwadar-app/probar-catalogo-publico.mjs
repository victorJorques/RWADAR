import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { parse } from 'acorn';
import { createRequire } from 'node:module';
import { baseCompleta, filas, sesion, informe } from './pruebas-soporte.mjs';

const require = createRequire(import.meta.url);
const {
  cargarFuentesLocales,
  construirSqlImportacion,
  validarFuentesLocales,
  validarLotePublico,
} = require('./catalogo-publico.js');
const { sincronizar } = require('./sincronizar.js');
const { adaptarCatalogo } = require('../rwadar-movil/lib/catalogo-remoto');

const ok = [], fail = [];
const paso = (nombre, condicion) => (condicion ? ok : fail).push(nombre);
const rechaza = async (promesa, nombre) => {
  try { await promesa; fail.push(`NO rechaza: ${nombre}`); }
  catch { ok.push(`rechaza ${nombre}`); }
};

// Ejecutar el lector real de ofertas, no una copia que pueda divergir del cliente.
// Extraemos declaraciones concretas por AST; no arrancamos la web ni su red.
const web = fs.readFileSync('../rwadar-site/assets/rwadar-20260820.js', 'utf8');
const astWeb = parse(web, { ecmaVersion: 2024, sourceType: 'script' });
const dependencias = ['CATMETA', 'urlHttps', 'textoDato', 'numeroRemoto',
  'booleanoOpcional', 'cifraCatalogoRemota', 'ofertaCatalogoRemota', 'fechaLocalValida',
  'fechaOfertaPublicaValida', 'validarRevisionCatalogo', 'validarLoteCatalogoRemoto',
  'textoLocal', 'imagenOfertaLocal', 'ofertaLocalValida', 'EDITORIAL_OFERTA_POR_CATEGORIA',
  'ESTADOS_VERIFICACION_LOCAL', 'fuenteVerificacionLocal', 'campoVerificacionLocal',
  'validarVerificacionLocal', 'comprobarCatalogoEmbebido'];
const lector = dependencias.map(nombre => {
  const nodo = astWeb.body.find(n => n.type === 'FunctionDeclaration' && n.id.name === nombre ||
    n.type === 'VariableDeclaration' && n.declarations.some(d => d.id.name === nombre));
  assert.ok(nodo, `declaración cliente ${nombre}`);
  if (nodo.type === 'FunctionDeclaration') return web.slice(nodo.start, nodo.end);
  const declaracion = nodo.declarations.find(d => d.id.name === nombre);
  return `${nodo.kind} ${web.slice(declaracion.start, declaracion.end)};`;
}).join('\n');
const normalizarCliente = vm.runInNewContext(`${lector}\nofertaCatalogoRemota;`, { URL });
const validarCliente = vm.runInNewContext(`${lector}\nvalidarLoteCatalogoRemoto;`, { URL });
const filaApi = fila => {
  const copia = JSON.parse(JSON.stringify(fila));
  copia.verificada_el = copia.verificada_el.slice(0, 10);
  return copia;
};
const comprobarCliente = lista => lista.map(fila => {
  const api = filaApi(fila);
  return normalizarCliente(api, api.verificada_el);
});

const fuentes = cargarFuentesLocales('..');
const validacion = validarFuentesLocales(fuentes);
paso('la fuente local reúne 26 plataformas y 28 ofertas',
  validacion.fecha === '2026-09-21' && validacion.fechaOfertas === '2026-09-27' && fuentes.escaparate.plataformas.length === 26 &&
  fuentes.escaparate.ofertas.length === 28);

const generado = construirSqlImportacion(fuentes);
paso('el importador emite una revisión reproducible y siempre borrador',
  /^[a-f0-9]{64}$/.test(generado.hash) &&
  /Estado de importación: BORRADOR|entra como BORRADOR/i.test(generado.sql) &&
  !/estado\s*=\s*'aprobada'|values\s*\([^)]*'aprobada'/i.test(generado.sql));
const fechaImposible = structuredClone(fuentes);
fechaImposible.radar.verificadoEl = '2026-02-30';
await rechaza(Promise.resolve().then(() => validarFuentesLocales(fechaImposible)),
  'una fecha de calendario imposible');

const db = await baseCompleta();
// Reproducir los privilegios automáticos de un proyecto Supabase antiguo.
// RLS no protege TRUNCATE: cada objeto del catálogo debe revocar esos defaults.
await db.exec('alter default privileges grant all on tables to anon, authenticated');
await db.exec(fs.readFileSync('db/24_catalogo_publico_verificado.sql', 'utf8'));
const privilegiosCatalogo = await filas(db, `select grantee,table_name,privilege_type
  from information_schema.role_table_grants
  where grantee in ('anon','authenticated') and
    (table_schema='rwadar_catalogo' or table_name in
     ('catalogo_plataformas_publicas','catalogo_ofertas_publicas'))`);
paso('los defaults heredados no conceden escritura, TRUNCATE ni mantenimiento del catálogo',
  privilegiosCatalogo.length === 20 && privilegiosCatalogo.every(p => p.privilege_type === 'SELECT'));
await db.exec(generado.sql);

paso('un borrador nunca aparece en las vistas públicas',
  (await filas(db, 'select count(*)::int c from public.catalogo_plataformas_publicas'))[0].c === 0 &&
  (await filas(db, 'select count(*)::int c from public.catalogo_ofertas_publicas'))[0].c === 0);

// La prueba no depende del día de calendario en que se ejecute. Solo mueve la
// copia embebida; el fichero fuente conserva intacta su fecha 2026-09-21.
await db.query('update rwadar_catalogo.revisiones set verificado_el=current_date where id=$1',
  [generado.revisionId]);
await db.query('update rwadar_catalogo.fuentes set consultada_el=current_date where revision_id=$1',
  [generado.revisionId]);
await db.query('update rwadar_catalogo.ofertas set verificada_el=current_date where revision_id=$1',
  [generado.revisionId]);
await db.query(`update rwadar_catalogo.revisiones
                   set estado='aprobada', aprobada_el=now(),
                       aprobada_referencia='aprobación doble control de prueba'
                 where id=$1`, [generado.revisionId]);

const plataformas = await filas(db, 'select * from public.catalogo_plataformas_publicas');
const ofertas = await filas(db, 'select * from public.catalogo_ofertas_publicas');
paso('la vista publica exactamente el lote completo 26/28',
  plataformas.length === 26 && ofertas.length === 28);
try {
  const movil = adaptarCatalogo({ version: 1,
    plataformas: plataformas.map(filaApi), ofertas: ofertas.map(filaApi) }, new Date());
  paso('las vistas SQL reales alimentan también las 26 plataformas y 28 ofertas móviles',
    movil.plataformas.length === 26 && movil.ofertas.length === 28 &&
    movil.plataformas.every(p => p.verificacionLocal.alertasCriticas.length > 0) &&
    movil.ofertas.every(o => o.revisionId === movil.revisionId));
} catch (error) { fail.push(`contrato SQL -> móvil: ${error.message}`); }
try {
  paso('las 28 filas SQL, incluidas las bloqueadas, pasan por el lector web real',
    comprobarCliente(ofertas).length === 28);
} catch (error) { fail.push(`contrato SQL -> web: ${error.message}`); }
paso('cada plataforma lleva estado, licencia, acceso, alertas y fuentes',
  plataformas.every(p => p.verificacion_local?.estadoOperativo?.fuentes?.length > 0 &&
    p.verificacion_local?.licenciaRegistro?.fuentes?.length > 0 &&
    p.verificacion_local?.acceso?.fuentes?.length > 0 &&
    p.verificacion_local?.alertasCriticas?.every(a => a.fuentes?.length > 0)));
paso('las 21 ofertas bloqueadas no exponen precio ni rentabilidad',
  ofertas.filter(o => o.estado_revision !== 'actual').length === 21 &&
  ofertas.filter(o => o.estado_revision !== 'actual')
    .every(o => o.precio === null && o.rentabilidad === null));

// Un lote de siete días puede contener ofertas con vigencia de solo un día.
// Se prueba la salida SQL real, no solo la ocultación posterior del cliente.
const objetivoVigencia = ofertas.find(o => o.estado_revision === 'actual').slug;
await db.exec('begin');
await db.query(`update rwadar_catalogo.ofertas set vigencia_dias=1,
  resumen='MARCADOR-CIFRA: condiciones sintéticas que deben desaparecer al vencer.',
  metricas='["MARCADOR-CIFRA: 999 EUR"]', precio='{"marcador":"MARCADOR-CIFRA"}',
  rentabilidad='{"marcador":"MARCADOR-CIFRA"}', disponible_es=true, puntuacion=25
  where revision_id=$1 and slug=$2`, [generado.revisionId, objetivoVigencia]);
const desplazarRevision = async dias => {
  await db.query('update rwadar_catalogo.revisiones set verificado_el=current_date-$2::int where id=$1',
    [generado.revisionId, dias]);
  await db.query('update rwadar_catalogo.fuentes set consultada_el=current_date-$2::int where revision_id=$1',
    [generado.revisionId, dias]);
  await db.query('update rwadar_catalogo.ofertas set verificada_el=current_date-$2::int where revision_id=$1',
    [generado.revisionId, dias]);
};
await desplazarRevision(1);
let finDeVigencia = (await db.query('select * from public.catalogo_ofertas_publicas where slug=$1',
  [objetivoVigencia])).rows[0];
paso('la oferta conserva sus cifras durante el último día de vigencia',
  JSON.stringify(finDeVigencia).includes('MARCADOR-CIFRA') &&
  finDeVigencia.disponible_es === true && Number(finDeVigencia.puntuacion) === 25);
await desplazarRevision(2);
for (const rol of ['anon', 'authenticated']) {
  await sesion(db, null, rol);
  const lotePlataformas = await filas(db, 'select * from public.catalogo_plataformas_publicas');
  const loteOfertas = await filas(db, 'select * from public.catalogo_ofertas_publicas');
  const vencida = loteOfertas.find(o => o.slug === objetivoVigencia);
  paso(`${rol}: el vencimiento individual no destruye el lote completo`,
    lotePlataformas.length === 26 && loteOfertas.length === 28);
  paso(`${rol}: SQL retira cifras, resumen comercial, métricas, elegibilidad y puntuación vencidas`,
    !!vencida && vencida.precio === null && vencida.rentabilidad === null &&
    vencida.disponible_es === null && vencida.puntuacion === null &&
    !JSON.stringify(vencida).includes('MARCADOR-CIFRA') &&
    vencida.fuentes_actuales.length > 0 && vencida.avisos.length > 0);
  validarLotePublico(lotePlataformas, loteOfertas);
  const movilVencido = adaptarCatalogo({ version: 1,
    plataformas: lotePlataformas.map(filaApi), ofertas: loteOfertas.map(filaApi) }, new Date());
  const ofertaMovilVencida = movilVencido.ofertas.find(o => o.slug === objetivoVigencia);
  paso(`${rol}: el lector móvil acepta SQL saneado sin recuperar cifras caducadas`,
    movilVencido.ofertas.length === 28 && ofertaMovilVencida.precio === null &&
    !JSON.stringify(ofertaMovilVencida).includes('MARCADOR-CIFRA'));
  paso(`${rol}: el consumidor acepta el lote saneado sin inventar fecha nueva`,
    String(vencida.verificada_el) === String(loteOfertas[0].verificada_el));
  try {
    paso(`${rol}: las cifras vencidas conservan el formato aceptado por la web`,
      comprobarCliente(loteOfertas).length === 28);
  } catch (error) { fail.push(`${rol}: contrato vencido SQL -> web: ${error.message}`); }
}
await sesion(db);
const originalVencida = (await db.query(`select * from rwadar_catalogo.ofertas
  where revision_id=$1 and slug=$2`, [generado.revisionId, objetivoVigencia])).rows[0];
paso('la proyección pública no borra ni refecha la evidencia original',
  JSON.stringify(originalVencida).includes('MARCADOR-CIFRA') &&
  originalVencida.disponible_es === true && originalVencida.vigencia_dias === 1);
for (const dias of [-1, 8]) {
  await desplazarRevision(dias);
  paso(`una revisión ${dias < 0 ? 'futura' : 'caducada'} no entrega ninguna de las dos vistas`,
    (await filas(db, 'select count(*)::int c from public.catalogo_plataformas_publicas'))[0].c === 0 &&
    (await filas(db, 'select count(*)::int c from public.catalogo_ofertas_publicas'))[0].c === 0);
}
await db.exec('rollback');

const fechaPrueba = plataformas[0].verificacion_local.verificadoEl;
validarLotePublico(plataformas, ofertas, { hoy: new Date(`${fechaPrueba}T12:00:00Z`) });
paso('el consumidor acepta el lote íntegro y vigente', true);
await rechaza(Promise.resolve().then(() => validarLotePublico(plataformas.slice(1), ofertas,
  { hoy: new Date(`${fechaPrueba}T12:00:00Z`) })), 'un lote de solo 25 plataformas');
await rechaza(Promise.resolve().then(() => validarLotePublico(plataformas, ofertas.slice(1),
  { hoy: new Date(`${fechaPrueba}T12:00:00Z`) })), 'un lote de solo 27 ofertas');
const ochoDias = new Date(Date.parse(`${fechaPrueba}T12:00:00Z`) + 8 * 86400000);
await rechaza(Promise.resolve().then(() => validarLotePublico(plataformas, ofertas,
  { hoy: ochoDias })), 'una revisión caducada');

const serializaApi = valor => JSON.parse(JSON.stringify(valor));
const apiPlataformas = serializaApi(plataformas).map(p => ({
  ...p, verificada_el:String(p.verificada_el).slice(0, 10),
}));
const apiOfertas = serializaApi(ofertas).map(o => ({
  ...o, verificada_el:String(o.verificada_el).slice(0, 10),
}));
paso('SQL expone una única identidad de revisión para las dos vistas',
  [...apiPlataformas, ...apiOfertas].every(x => x.revision_id === generado.revisionId));
paso('el lector web valida la identidad de revisión y la fecha del radar',
  validarCliente(apiPlataformas, apiOfertas) === fechaPrueba);

// Las ofertas pueden revisarse después que el radar: no se re-fechan sus fuentes.
await db.exec('begin');
await db.query('update rwadar_catalogo.revisiones set verificado_el=current_date-6 where id=$1', [generado.revisionId]);
await db.query('update rwadar_catalogo.fuentes set consultada_el=current_date-6 where revision_id=$1', [generado.revisionId]);
const fechasSeparadasP = serializaApi(await filas(db, 'select * from public.catalogo_plataformas_publicas'));
const fechasSeparadasO = (await filas(db, 'select * from public.catalogo_ofertas_publicas')).map(filaApi);
const radarAnterior = fechasSeparadasP[0].verificacion_local.verificadoEl;
paso('SQL mantiene 26 plataformas con fuentes anteriores y 28 ofertas recién consultadas',
  fechasSeparadasP.length === 26 && fechasSeparadasO.length === 28 && radarAnterior < fechaPrueba &&
  fechasSeparadasP.every(p => p.verificacion_local.estadoOperativo.fuentes.every(f => f.consultadaEl === radarAnterior)) &&
  fechasSeparadasO.every(o => o.verificada_el === fechaPrueba));
paso('backend y web aceptan fechas individuales sin rejuvenecer el radar',
  validarLotePublico(fechasSeparadasP, fechasSeparadasO).fecha === radarAnterior &&
  validarCliente(fechasSeparadasP, fechasSeparadasO) === radarAnterior &&
  fechasSeparadasO.every(o => normalizarCliente(o, radarAnterior).verificadaEl === fechaPrueba));
await db.query('update rwadar_catalogo.ofertas set verificada_el=current_date+1 where revision_id=$1 and slug=$2',
  [generado.revisionId, apiOfertas[0].slug]);
paso('una sola oferta futura bloquea las dos vistas SQL',
  (await filas(db, 'select count(*)::int c from public.catalogo_plataformas_publicas'))[0].c === 0 &&
  (await filas(db, 'select count(*)::int c from public.catalogo_ofertas_publicas'))[0].c === 0);
await db.exec('rollback');
const futuro = new Date(Date.parse(fechaPrueba + 'T12:00:00Z') + 86400000).toISOString().slice(0, 10);
const probarCache = cambio => {
  const contexto = {
    URL, CATALOGO_EMBEBIDO_BLOQUEADO: false,
    P: structuredClone(fechasSeparadasP).map(p => ({ slug: p.slug, revisionId: p.revision_id,
      verificacionLocal: p.verificacion_local })),
    EMI: fechasSeparadasO.map(o => normalizarCliente(o, radarAnterior)),
  };
  if (cambio) cambio(contexto);
  const resultado = vm.runInNewContext(`${lector}\ncomprobarCatalogoEmbebido();`, contexto);
  return { resultado, contexto };
};
paso('la caché embebida real acepta revisiones de oferta distintas sin renovar el radar', probarCache().resultado === true);
for (const [nombre, cambio] of [
  ['identidad mezclada', c => { c.EMI[0].revisionId = '00000000-0000-0000-0000-000000000000'; }],
  ['identidad ausente', c => { delete c.P[0].revisionId; }],
  ['oferta futura', c => { c.EMI[0].verificadaEl = futuro; }],
  ['fuente del radar re-fechada', c => { c.P[0].verificacionLocal.estadoOperativo.fuentes[0].consultadaEl = fechaPrueba; }],
]) {
  const { resultado, contexto } = probarCache(cambio);
  paso(`la caché real se vacía ante ${nombre}`,
    resultado === false && contexto.P.length === 0 && contexto.EMI.length === 0 && contexto.CATALOGO_EMBEBIDO_BLOQUEADO);
}
for (const [nombre, cambio] of [
  ['otra revisión', { revision_id: '00000000-0000-0000-0000-000000000000' }],
  ['revisión ausente', { revision_id: null }],
  ['fecha futura', { verificada_el: futuro }],
  ['fecha imposible', { verificada_el: '2026-02-30' }],
  ['fecha con sufijo', { verificada_el: fechaPrueba + 'texto' }],
]) {
  const lote = structuredClone(apiOfertas);
  Object.assign(lote[0], cambio);
  assert.throws(() => validarLotePublico(apiPlataformas, lote));
  assert.throws(() => validarCliente(apiPlataformas, lote));
  paso(`backend y web rechazan ${nombre} sin mezclar lotes`, true);
}
for (const valor of [true, null, undefined, 'false', 0]) {
  assert.throws(() => normalizarCliente({ ...apiOfertas[0], patrocinada: valor }, fechaPrueba),
    /patrocinio no habilitado/);
  paso(`la web rechaza un patrocinio no explícitamente desactivado (${String(valor)})`, true);
}
const apiDescartes = Array.from({ length:4 }, (_, i) => ({
  nombre:`Descarte ${i + 1}`, etiqueta_descarte:'Documentado',
  motivo_descarte:'Motivo documental suficientemente largo para la prueba fail-closed.',
  fuentes:[{ url:`https://example.com/fuente-${i + 1}`, titulo:`Fuente ${i + 1}` }],
}));
const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-catalogo-'));
const jsTemporal = path.join(temporal, 'sitio.js');
const csvTemporal = path.join(temporal, 'rwadar.csv');
fs.writeFileSync(jsTemporal, 'const P=[\n\n];\nconst FUERA=[\n\n];\nconst EMI=[\n\n];\n', 'utf8');
const rutasConsultadas = [];
const fetchCompleto = async url => {
  rutasConsultadas.push(url);
  const datos = url.includes('catalogo_plataformas_publicas') ? apiPlataformas :
    url.includes('catalogo_ofertas_publicas') ? apiOfertas : apiDescartes;
  return { ok:true, async json(){ return datos; } };
};
await sincronizar({ fetchFn:fetchCompleto, jsPath:jsTemporal, csvPath:csvTemporal,
  hoy:new Date(`${fechaPrueba}T12:00:00Z`) });
const sincronizado = fs.readFileSync(jsTemporal, 'utf8');
new Function(sincronizado);
paso('el sincronizador serializa 26/28 con la verificación completa y JavaScript válido',
  /verificacionLocal/.test(sincronizado) && /"catalogo":true/.test(sincronizado) &&
  rutasConsultadas.some(u => u.includes('catalogo_plataformas_publicas')) &&
  rutasConsultadas.some(u => u.includes('catalogo_ofertas_publicas')) &&
  !rutasConsultadas.some(u => /radar_publico|emisiones_publicas/.test(u)));
const antesDeVacio = fs.readFileSync(jsTemporal, 'utf8');
const csvAntesDeRechazo = fs.readFileSync(csvTemporal, 'utf8');
for (const caso of [
  { nombre:'URL HTTP de oferta', cambio:{ url:'http://example.test/oferta' }, error:/URL no HTTPS/ },
  { nombre:'patrocinio activo', cambio:{ patrocinada:true }, error:/patrocinio no habilitado/ },
  { nombre:'patrocinio indeterminado', cambio:{ patrocinada:null }, error:/patrocinio no habilitado/ },
  { nombre:'URL ejecutable de oferta', cambio:{ url:'javascript:alert(1)' }, error:/URL no HTTPS/ },
  { nombre:'fecha de oferta ausente', cambio:{ verificada_el:null }, error:/fecha/ },
  { nombre:'identidad de revisión distinta', cambio:{ revision_id:'00000000-0000-0000-0000-000000000000' }, error:/revisiones/ },
  { nombre:'fecha de calendario imposible', fechaLote:'2026-02-30', error:/fecha del lote no es válida/ },
]) {
  const plataformasInvalidas = structuredClone(apiPlataformas);
  const ofertasInvalidas = structuredClone(apiOfertas);
  if (caso.fechaLote) {
    plataformasInvalidas.forEach(p => { p.verificacion_local.verificadoEl = caso.fechaLote; });
    ofertasInvalidas.forEach(o => { o.verificada_el = caso.fechaLote; });
  } else Object.assign(ofertasInvalidas[0], caso.cambio);
  let error = null;
  try {
    await sincronizar({
      fetchFn:async url => ({ ok:true, async json(){
        return url.includes('catalogo_plataformas_publicas') ? plataformasInvalidas :
          url.includes('catalogo_ofertas_publicas') ? ofertasInvalidas : apiDescartes;
      }}),
      jsPath:jsTemporal, csvPath:csvTemporal, hoy:new Date(`${fechaPrueba}T12:00:00Z`),
    });
  } catch (fallo) { error = fallo; }
  paso(`el sincronizador rechaza ${caso.nombre} antes de escribir`,
    caso.error.test(error?.message || '') &&
    fs.readFileSync(jsTemporal, 'utf8') === antesDeVacio &&
    fs.readFileSync(csvTemporal, 'utf8') === csvAntesDeRechazo);
}
await rechaza(sincronizar({
  fetchFn:async url => ({ ok:true, async json(){
    return url.includes('plataformas?estado=eq.descartada') ? apiDescartes : [];
  }}),
  jsPath:jsTemporal, csvPath:csvTemporal, hoy:new Date(`${fechaPrueba}T12:00:00Z`),
}), 'una respuesta remota vacía');
paso('una respuesta vacía no reemplaza el pre-render válido',
  fs.readFileSync(jsTemporal, 'utf8') === antesDeVacio);
fs.rmSync(temporal, { recursive:true, force:true });

new Function(web);
paso('el cliente compila y cierra el catálogo embebido caduco antes de renderizar',
  /function comprobarCatalogoEmbebido\(\)/.test(web) &&
  /edad<0\|\|edad>7/.test(web) && /P\.length=0;EMI\.length=0/.test(web) &&
  /catch\{comprobarCatalogoEmbebido\(\);pintarFiltrosEmision\(\);pintarEmisiones\(\);render\(\)\}/.test(web) &&
  !/\/radar_publico\?select=\*|\/emisiones_publicas\?select=\*/.test(web));

await db.exec('begin');
await db.query(`delete from rwadar_catalogo.plataforma_fuentes
  where revision_id=$1 and plataforma_id=(select plataforma_id from rwadar_catalogo.plataformas where revision_id=$1 limit 1)
    and campo='acceso'`, [generado.revisionId]);
paso('si falta una evidencia se vacían a la vez las dos vistas',
  (await filas(db, 'select count(*)::int c from public.catalogo_plataformas_publicas'))[0].c === 0 &&
  (await filas(db, 'select count(*)::int c from public.catalogo_ofertas_publicas'))[0].c === 0);
await db.exec('rollback');

await db.exec('begin');
await db.query('delete from rwadar_catalogo.ofertas where revision_id=$1 and slug=(select slug from rwadar_catalogo.ofertas where revision_id=$1 limit 1)',
  [generado.revisionId]);
paso('si falta una oferta no se publica un lote parcial',
  (await filas(db, 'select count(*)::int c from public.catalogo_plataformas_publicas'))[0].c === 0 &&
  (await filas(db, 'select count(*)::int c from public.catalogo_ofertas_publicas'))[0].c === 0);
await db.exec('rollback');

await sesion(db, null, 'anon');
paso('anon solo puede leer las vistas públicas completas',
  (await filas(db, 'select count(*)::int c from public.catalogo_plataformas_publicas'))[0].c === 26 &&
  (await filas(db, 'select count(*)::int c from public.catalogo_ofertas_publicas'))[0].c === 28);
await rechaza(db.query(`insert into rwadar_catalogo.revisiones
  (id,verificado_el,contenido_sha256,origen) values
  (gen_random_uuid(),current_date,repeat('a',64),'Intento anónimo que debe quedar bloqueado siempre')`),
  'escritura anónima del catálogo');
await sesion(db);

const vistas = await filas(db, `select c.relname, c.reloptions
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relname in
   ('catalogo_plataformas_publicas','catalogo_ofertas_publicas') order by c.relname`);
paso('ambas vistas públicas son security_invoker',
  vistas.length === 2 && vistas.every(v => (v.reloptions || []).includes('security_invoker=true')));

await db.exec(fs.readFileSync('db/25_servicios_editoriales_solo_lectura.sql', 'utf8'));
for (const rol of ['anon', 'authenticated']) {
  const mutaciones = await filas(db, `select c.relname from pg_class c
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname in ('public','rwadar_catalogo') and c.relkind in ('r','v')
      and (has_table_privilege($1,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
        or has_any_column_privilege($1,c.oid,'INSERT,UPDATE,REFERENCES'))`, [rol]);
  paso(`${rol}: no quedan permisos de mutación de tabla o columna`, mutaciones.length === 0);
  const rpc = await filas(db, `select p.proname from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
      and p.proname in ('borrar_mi_cuenta','borrar_mi_opinion','guardar_opinion','denunciar_opinion','moderar')
      and has_function_privilege($1,p.oid,'EXECUTE')`, [rol]);
  paso(`${rol}: las antiguas RPC de usuario están cerradas`, rpc.length === 0);
  await sesion(db, null, rol);
  paso(`${rol}: el cierre mantiene el catálogo y los descartes documentados`,
    (await filas(db, 'select count(*)::int c from public.catalogo_plataformas_publicas'))[0].c === 26 &&
    (await filas(db, 'select count(*)::int c from public.catalogo_ofertas_publicas'))[0].c === 28 &&
    (await filas(db, "select count(*)::int c from public.plataformas where estado='descartada'"))[0].c === 4);
  await sesion(db);
}

const corte28 = cargarFuentesLocales('..', { revision:'2026-09-28' });
const nuevo = construirSqlImportacion(corte28);
paso('la revisión nueva conserva las ofertas anteriores y no reescribe la evidencia histórica',
  nuevo.revisionId !== generado.revisionId && corte28.radar.fuentes.length === 70 &&
  corte28.escaparate.ofertas.every(o => o.verificadaEl === '2026-09-27') &&
  cargarFuentesLocales('..').radar.verificadoEl === '2026-09-21');
await rechaza(Promise.resolve().then(() => cargarFuentesLocales('..', { revision:'../2026-09-28' })),
  'rutas arbitrarias como revisión documental');
await db.exec(nuevo.sql);
paso('la importación del nuevo corte sigue siendo un borrador completo',
  (await filas(db, 'select estado from rwadar_catalogo.revisiones where id=$1', [nuevo.revisionId]))[0].estado === 'borrador' &&
  (await filas(db, 'select count(*)::int c from rwadar_catalogo.ofertas where revision_id=$1', [nuevo.revisionId]))[0].c === 28);
await sesion(db, null, 'anon');
paso('el nuevo borrador no desplaza al catálogo aprobado',
  (await filas(db, 'select count(*)::int c from public.catalogo_plataformas_publicas where revision_id=$1', [nuevo.revisionId]))[0].c === 0);
await sesion(db);
// Adaptar fechas solo dentro de la base aislada para que la regresión no caduque.
await db.query('update rwadar_catalogo.revisiones set verificado_el=current_date where id=$1', [nuevo.revisionId]);
await db.query('update rwadar_catalogo.fuentes set consultada_el=current_date where revision_id=$1', [nuevo.revisionId]);
await db.query('update rwadar_catalogo.ofertas set verificada_el=current_date-1 where revision_id=$1', [nuevo.revisionId]);
await db.query("update rwadar_catalogo.revisiones set estado='retirada',aprobada_el=null,aprobada_referencia=null where id=$1", [generado.revisionId]);
await db.query("update rwadar_catalogo.revisiones set estado='aprobada',aprobada_el=now(),aprobada_referencia='Aprobación aislada del corte documental nuevo' where id=$1", [nuevo.revisionId]);
const p28 = await filas(db, 'select * from public.catalogo_plataformas_publicas');
const o28 = await filas(db, 'select * from public.catalogo_ofertas_publicas');
const adaptado28 = adaptarCatalogo({version:1,plataformas:p28.map(filaApi),ofertas:o28.map(filaApi)},new Date());
paso('el nuevo corte llega íntegro al lector móvil después de aprobarse',
  adaptado28.plataformas.length === 26 && adaptado28.ofertas.length === 28 && adaptado28.revisionId === nuevo.revisionId);
paso('la revisión mantiene un registro contrastado separado del acceso desconocido',
  p28.find(p => p.slug === 'archax').verificacion_local.licenciaRegistro.estado === 'confirmada_regulador' &&
  p28.find(p => p.slug === 'archax').verificacion_local.acceso.estado === 'no_verificable');

await db.close();
informe('CATÁLOGO PÚBLICO FAIL-CLOSED', ok, fail);

// Prueba sin red del vigía de fuentes (.claude/skills/investigacion-catalogo/vigia.mjs).
// Lo publicado es la entrega real del 12/11 (rwadar-app/data/verificaciones/2026-11-12-v2/) y las
// respuestas son las grabadas el 13/11 (Spiko, Brickwise y los portales suizos, saneadas: sin carteras,
// identificadores ni correos) más la cadena y la CNMV con sus valores de ese día. El vigía tiene que
// encontrar lo mismo que encontraron a mano los investigadores ese día.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import {
  vigilar, conGrabacion, redEnVivo, leerBase, libroBrickwise, con15, sha256, esDocumento,
  RPC, BW_V1, BW_V2, SUIZA, ORACULO_MTBILL, ZCHF, SEL, ESTADOS,
} from '../.claude/skills/investigacion-catalogo/vigia.mjs';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const VIGIA = path.join(RAIZ, '.claude/skills/investigacion-catalogo/vigia.mjs');
const RESP = path.join(RAIZ, '.claude/skills/investigacion-catalogo/pruebas-vigia/respuestas');
const BASE = path.join(RAIZ, 'rwadar-app/data/verificaciones/2026-11-12-v2');
const { CAMBIA, IGUAL, ILEGIBLE } = ESTADOS;
const AHORA = Date.parse('2026-11-13T08:31:00Z');
const ejecutar = promisify(execFile);

const leer = (f) => fs.readFileSync(path.join(RESP, f));
const seg = (iso) => BigInt(Date.parse(iso) / 1000);
const palabras = (...ws) => '0x' + ws.map((w) => BigInt(w).toString(16).padStart(64, '0')).join('');
const ronda = (id, valor, iso) => palabras(id, valor, seg(iso), seg(iso), id);
const roundData = (id) => SEL.getRoundData + BigInt(id).toString(16).padStart(64, '0');
const balance = (cuenta) => SEL.balanceOf + cuenta.slice(2).padStart(64, '0');

// Cadena del 13/11 (bloque 26.404.862): oráculo de mTBILL (ronda 492 del 10/11 y 468 del 06/10) y Brokerbots suizos.
function cadena13(cambios = {}) {
  const t = {
    [`${ORACULO_MTBILL}|${SEL.latestRoundData}`]: ronda(492, 107768132, '2026-11-10T18:40:23Z'),
    [`${ORACULO_MTBILL}|${roundData(468)}`]: ronda(468, 107410723, '2026-10-06T14:16:11Z'),
    [`${SUIZA.aktionariat.bot}|${SEL.getPrice}`]: palabras(7250000000000000000n),
    [`${SUIZA['boss-info'].bot}|${SEL.getPrice}`]: palabras(8501970000000000000n),
    [`${SUIZA.switzerlend.bot}|${SEL.getPrice}`]: palabras(68010500000000000000n),
    [`${SUIZA.aktionariat.bot}|${SEL.settings}`]: palabras(1),
    [`${SUIZA['boss-info'].bot}|${SEL.settings}`]: palabras(1),
    [`${SUIZA.switzerlend.bot}|${SEL.settings}`]: palabras(5),
    [`${ZCHF}|${balance(SUIZA.aktionariat.bot)}`]: palabras(928000000000000000000n),
    [`${ZCHF}|${balance(SUIZA['boss-info'].bot)}`]: palabras(2491464965000000000000n),
    [`${ZCHF}|${balance(SUIZA.switzerlend.bot)}`]: palabras(31765699218750000n),
    ...cambios,
  };
  return (c) => c.method === 'eth_getBlockByNumber'
    ? { number: '0x192e7fe', timestamp: '0x' + seg('2026-11-13T08:31:11Z').toString(16) }
    : t[`${c.params[0].to.toLowerCase()}|${c.params[0].data}`] ?? null;
}

const CNMV_SIN = '<div class="msgAviso"><p> No hay datos disponibles. </p></div>';
const cnmvCon = (n) => `<table class="tabla-scroll" id="ctl00_ContentPrincipal_wucListado_gridAdvertencias"><tbody>${'<tr><td data-th="Fecha">04/09/2023</td></tr>'.repeat(n)}</tbody></table>`;

// Red grabada: responde a cada petición del vigía con lo que dieron las fuentes el 13/11.
function redFalsa({ rpc = cadena13(), cnmv = {}, extra = {}, documento = (u) => `documento ${u}` } = {}) {
  const peticiones = [];
  const ok = (cuerpo) => ({ http: 200, buf: Buffer.from(cuerpo), horaUtc: '2026-11-13T08:31:15Z' });
  const red = async (p) => {
    peticiones.push(p);
    const u = p.url;
    if (extra[u]) return extra[u](p);
    let m;
    if ((m = u.match(/^https:\/\/public-api\.spiko\.io\/v0\/share-classes\/(\w+)\/yield$/))) return ok(leer(`spiko-${m[1]}-yield.json`));
    if ((m = u.match(/^https:\/\/public-api\.spiko\.io\/v0\/net-asset-values\/(\w+)\/latest$/))) return ok(leer(`spiko-${m[1]}-nav-latest.json`));
    if (u === BW_V1) return ok(leer('brickwise-v1-assets.json'));
    if (u === BW_V2) return ok(leer('brickwise-v2-assets.json'));
    for (const [slug, c] of Object.entries(SUIZA)) {
      if (u === `${c.portal}/api/secondarymarkets/getOrderBook`) { assert.deepEqual(JSON.parse(p.cuerpo), { company: c.empresa }); return ok(leer(`${slug}-getOrderBook.json`)); }
      if (u === `${c.portal}/api/brokerbotsettings?ticker=${c.ticker}`) return ok(leer(`${slug}-brokerbotsettings.json`));
      if (u === `${c.portal}/api/secondarymarkets/getTrades`) return ok(leer(`${slug}-getTrades.json`));
    }
    if (u === RPC) {
      assert.equal(p.metodo, 'POST');
      return ok(JSON.stringify(JSON.parse(p.cuerpo).map((c) => {
        assert.ok(['eth_call', 'eth_getBlockByNumber'].includes(c.method), `solo lectura: ${c.method}`);
        const r = rpc(c);
        return r == null ? { jsonrpc: '2.0', id: c.id, error: { code: -32000, message: 'execution reverted' } } : { jsonrpc: '2.0', id: c.id, result: r };
      })));
    }
    if (u.startsWith('https://www.cnmv.es/portal/ResultadoBusqueda?tipo=1&nombre=')) {
      assert.equal(p.cabeceras['accept-language'], 'es');
      const nombre = decodeURIComponent(u.split('nombre=')[1].replace(/\+/g, ' '));
      if (nombre in cnmv) return ok(cnmv[nombre]);
      return ok(nombre === 'Trading' ? cnmvCon(20) : nombre === 'Gemini' ? cnmvCon(2) : CNMV_SIN);
    }
    if (esDocumento(u)) return ok(documento(u));
    return { http: 404, buf: Buffer.alloc(0), horaUtc: '2026-11-13T08:31:15Z' };
  };
  red.peticiones = peticiones;
  return red;
}

const ficha = (v, slug) => v.fichas[slug];
const cifra = (v, slug, re) => {
  const c = ficha(v, slug).cifras.find((x) => re.test(x.campo));
  assert.ok(c, `${slug}: falta la cifra ${re}`);
  return c;
};
const SIN_DOCS = ['spiko', 'midas', 'brickwise', 'suiza', 'cnmv'];

test('13/11 con lo publicado el 12/11: detecta lo mismo que los investigadores (Spiko 2,40 %/3,98 %, Pottendorfer 73 €…)', async () => {
  const red = redFalsa();
  const v = await vigilar({ base: BASE, red, ahora: () => AHORA, solo: SIN_DOCS });

  // Spiko: dos rentabilidades nuevas; Spiko Euro igual, con valor liquidativo nuevo.
  const eur = cifra(v, 'spiko-letras-del-tesoro-euro', /^Rentabilidad/);
  assert.deepEqual([eur.publicada, eur.hoy, eur.estado], ['2,41 %', '2,40 %', CAMBIA]);
  assert.equal(eur.fuente, 'https://public-api.spiko.io/v0/share-classes/EUTBL/yield');
  assert.equal(eur.sha256, sha256(leer('spiko-EUTBL-yield.json')));
  assert.equal(eur.horaUtc, '2026-11-13T08:31:15Z');
  const usd = cifra(v, 'spiko-letras-del-tesoro-dolar', /^Rentabilidad/);
  assert.deepEqual([usd.publicada, usd.hoy, usd.estado], ['4,02 %', '3,98 %', CAMBIA]);
  const safo = cifra(v, 'spiko-smart-cash-euro', /^Rentabilidad/);
  assert.deepEqual([safo.publicada, safo.hoy, safo.estado], ['2,84 %', '2,84 %', IGUAL]);
  const vl = cifra(v, 'spiko-smart-cash-euro', /^Fecha del valor liquidativo/);
  assert.deepEqual([vl.publicada, vl.hoy, vl.estado], ['11/11/2026', '12/11/2026 (1.017107 EUR)', CAMBIA]);
  assert.equal(cifra(v, 'spiko-letras-del-tesoro-dolar', /^Fecha del valor/).publicada, '10/11/2026');

  // mTBILL: sin ronda nueva desde el 10/11, el valor y la rentabilidad de 5 semanas no cambian.
  const val = cifra(v, 'mtbill', /^Valor por token/);
  assert.deepEqual([val.publicada, val.hoy, val.estado], ['1,0777 USD (10/11/2026)', '1,0777 USD (10/11/2026)', IGUAL]);
  const rent = cifra(v, 'mtbill', /^Rentabilidad pasada/);
  assert.deepEqual([rent.publicada, rent.hoy, rent.estado], ['3,45 % anual hasta el 10/11/2026', '3,45 % anual hasta el 10/11/2026', IGUAL]);
  assert.match(rent.nota, /ronda 468 .* → ronda 492, 35,18 días exactos/);

  // Brickwise: cambia el mínimo de Pottendorfer (80 → 73 €), la mejor compra de Randhartingergasse
  // y las participaciones en venta de Cohotel, GreenPoint y Schwarzer Weg; lo demás sigue igual.
  const pot = 'vivienda-pottendorfer-stra-e-62-wr-neustadt';
  const min = cifra(v, pot, /^Mínimo de la tarjeta/);
  assert.deepEqual([min.publicada, min.hoy, min.estado, min.fuente], ['80,00 €', '73,00 €', CAMBIA, BW_V1]);
  assert.deepEqual([cifra(v, pot, /^Venta más barata/).hoy, cifra(v, pot, /^Venta más barata/).estado],
    ['73,00 € por participación (1 a ese precio, orden del 12/11/2026)', CAMBIA]);
  assert.equal(cifra(v, pot, /^Orden de venta de menor importe/).hoy, '1 participación a 73,00 € (74,10 € con el 1,5 %)');
  assert.deepEqual([cifra(v, pot, /^Participaciones/).hoy, cifra(v, pot, /^Participaciones/).estado], ['107', IGUAL]);
  const compra = cifra(v, 'randhartingergasse-9-viena', /^Mejor oferta de compra/);
  assert.deepEqual([compra.publicada, compra.hoy, compra.estado],
    ['56,00 € (1 participación, orden del 10/11/2026)', '64,00 € (1 participación, orden del 12/11/2026)', CAMBIA]);
  for (const [slug, antes, hoy] of [['fotovoltaica-cohotel', '65 (11/11/2026)', '59'], ['fotovoltaica-greenpoint', '351 (11/11/2026)', '347'],
    ['vivienda-schwarzer-weg-18-graz', '300 (10/11/2026)', '299']]) {
    const p = cifra(v, slug, /^Participaciones/);
    assert.deepEqual([p.publicada, p.hoy, p.estado, p.fuente], [antes, hoy, CAMBIA, BW_V2], slug);
  }
  // «en 3 órdenes» (Klagenfurt) y «en 2 órdenes» (Randhartingergasse) se comparan por cifras, no por redacción.
  assert.equal(cifra(v, 'local-de-estanco-klagenfurt', /^Venta más barata/).estado, IGUAL);
  assert.equal(cifra(v, 'randhartingergasse-9-viena', /^Venta más barata/).estado, IGUAL);
  const cambiosBw = Object.entries(v.fichas).filter(([, f]) => f.plataforma === 'brickwise').flatMap(([s, f]) => f.cifras.filter((c) => c.estado !== IGUAL).map((c) => `${s} · ${c.campo}`));
  assert.deepEqual(cambiosBw.sort(), [
    'fotovoltaica-cohotel · Participaciones en venta', 'fotovoltaica-greenpoint · Participaciones en venta',
    'randhartingergasse-9-viena · Mejor oferta de compra', `${pot} · Mínimo de la tarjeta (venta más barata)`,
    `${pot} · Orden de venta de menor importe`, `${pot} · Venta más barata`, 'vivienda-schwarzer-weg-18-graz · Participaciones en venta']);
  assert.equal(Object.values(v.fichas).filter((f) => f.plataforma === 'brickwise').reduce((n, f) => n + f.cifras.length, 0), 11 * 5);

  // Suizas: nada cambia (precio del emisor en cadena, recompra apagada, mínimos, ventas más baratas y última operación).
  for (const slug of ['aktionariat', 'boss-info', 'switzerlend']) {
    assert.ok(ficha(v, slug).cifras.length >= 4, slug);
    for (const c of ficha(v, slug).cifras) assert.equal(c.estado, IGUAL, `${slug} · ${c.campo}: ${c.publicada} → ${c.hoy}`);
  }
  assert.equal(cifra(v, 'boss-info', /^Última operación/).hoy, '8,40 ZCHF (1 acción, 05/11/2026)');
  assert.equal(cifra(v, 'switzerlend', /^Fondos del emisor/).hoy, '0,03 ZCHF');
  assert.equal(cifra(v, 'aktionariat', /^Venta más barata/).hoy, '6,20 ZCHF × 356 acciones');

  // CNMV: las búsquedas del ciclo publicado siguen igual (Gemini es un control con resultados).
  assert.equal(v.resumen.controlCnmv.ok, true);
  const adv = Object.values(v.fichas).flatMap((f) => f.advertenciasCnmv);
  assert.ok(adv.length >= 40);
  assert.ok(adv.every((a) => a.estado === IGUAL));
  assert.ok(adv.some((a) => a.nombre === 'Gemini' && a.publicada === 'con resultados' && /^con resultados \(2 filas/.test(a.hoy)));
  // Cada búsqueda se hace una sola vez aunque la compartan varias fichas (Brickwise y Effecta, 11 fichas).
  const cnmvUrls = red.peticiones.filter((p) => p.url.startsWith('https://www.cnmv.es/')).map((p) => p.url);
  assert.equal(cnmvUrls.length, new Set(cnmvUrls).size);

  // Totales: 12 cambios, como los que encontraron a mano los investigadores el 13/11; nada sin leer.
  assert.deepEqual(v.resumen.cifras, { [CAMBIA]: 12, [IGUAL]: 65 });
  // Las fichas sin fuentes que el vigía sepa leer quedan para abrir a mano.
  assert.equal(ficha(v, 'hausera-proximas-ofertas').cifras.length, 0);
  assert.match(ficha(v, 'hausera-proximas-ofertas').noCubre, /se abren a mano/);
  // Peticiones: solo lectura (GET, eth_call por POST y el libro de órdenes suizo por POST).
  for (const p of red.peticiones) assert.ok(p.metodo === 'GET' || p.url === RPC || /\/api\/secondarymarkets\/get(OrderBook|Trades)$/.test(p.url), `${p.metodo} ${p.url}`);
});

test('lo que no se puede leer queda «no se pudo leer», y los cambios de cadena, libro y CNMV se detectan', async () => {
  // Plüddemanngasse: la venta más barata sigue a 75 €, pero ahora hay 3 participaciones a ese precio (antes 2).
  const v1 = JSON.parse(leer('brickwise-v1-assets.json'));
  const orden = v1.find((a) => a.ISIN === 'AT0000A2RAH5').offers.find((o) => o.status === 'open' && o.type === 'sell' && o.price === 75);
  assert.equal(orden.amount, 2);
  orden.amount = 3;
  const red = redFalsa({
    rpc: cadena13({
      [`${ORACULO_MTBILL}|${SEL.latestRoundData}`]: ronda(493, 107800000, '2026-11-13T18:40:00Z'),
      [`${ORACULO_MTBILL}|${roundData(471)}`]: ronda(471, 107430000, '2026-10-09T14:16:00Z'),
      [`${SUIZA['boss-info'].bot}|${SEL.settings}`]: palabras(3),
    }),
    cnmv: { Effecta: cnmvCon(1) },
    extra: {
      'https://public-api.spiko.io/v0/share-classes/USTBL/yield': () => ({ http: 403, buf: Buffer.from('denegado'), horaUtc: '2026-11-13T08:31:15Z', cf: 'challenge' }),
      [BW_V1]: () => ({ http: 200, buf: Buffer.from(JSON.stringify(v1)), horaUtc: '2026-11-13T08:31:15Z' }),
      [BW_V2]: () => ({ http: 0, buf: Buffer.alloc(0), horaUtc: '2026-11-13T08:31:15Z', error: 'ECONNRESET' }),
    },
  });
  const v = await vigilar({ base: BASE, red, ahora: () => AHORA, solo: SIN_DOCS });
  const plu = 'vivienda-pluddemanngasse-101-graz';
  assert.equal(cifra(v, plu, /^Mínimo/).estado, IGUAL, 'mismo precio');
  assert.deepEqual([cifra(v, plu, /^Venta más barata/).hoy, cifra(v, plu, /^Venta más barata/).estado],
    ['75,00 € por participación (3 a ese precio, orden del 04/11/2026)', CAMBIA], 'otra cantidad a ese precio');
  const usd = cifra(v, 'spiko-letras-del-tesoro-dolar', /^Rentabilidad/);
  assert.deepEqual([usd.hoy, usd.estado], [null, ILEGIBLE]);
  assert.match(usd.motivo, /HTTP 403 con desafío anti-bots \(no se elude\)/);
  // Ronda nueva del oráculo: cambia el valor y la rentabilidad (orientativa, con la ronda más cercana a 35 días antes).
  const val = cifra(v, 'mtbill', /^Valor por token/);
  assert.deepEqual([val.hoy, val.estado], ['1,0780 USD (13/11/2026)', CAMBIA]);
  const rent = cifra(v, 'mtbill', /^Rentabilidad pasada/);
  assert.equal(rent.estado, CAMBIA);
  assert.match(rent.hoy, /^\d+,\d{2} % anual hasta el 13\/11\/2026$/);
  assert.match(rent.nota, /^Orientativa: ronda 471 .* → ronda 493/);
  assert.match(rent.nota, /aplica la regla publicada/);
  // Recompra de Boss Info encendida en cadena.
  const rec = cifra(v, 'boss-info', /^Recompra/);
  assert.deepEqual([rec.publicada, rec.hoy, rec.estado], ['desactivada', 'activa', CAMBIA]);
  // Brickwise: sin la v2, las participaciones en venta no se pudieron leer (la v1 sí).
  for (const [s, f] of Object.entries(v.fichas)) if (f.plataforma === 'brickwise') {
    assert.equal(cifra(v, s, /^Participaciones/).estado, ILEGIBLE, s);
    assert.match(cifra(v, s, /^Participaciones/).motivo, /ECONNRESET/);
    assert.notEqual(cifra(v, s, /^Venta más barata/).estado, ILEGIBLE, s);
  }
  // CNMV: una advertencia nueva sobre Effecta aparece en las 11 fichas de Brickwise.
  const eff = Object.values(v.fichas).flatMap((f) => f.advertenciasCnmv).filter((a) => a.nombre === 'Effecta');
  assert.equal(eff.length, 11);
  assert.ok(eff.every((a) => a.estado === CAMBIA && a.hoy.startsWith('con resultados')));

  // Si el control de la CNMV no da resultados, ninguna búsqueda se da por buena.
  const sinControl = await vigilar({ base: BASE, red: redFalsa({ cnmv: { Trading: CNMV_SIN } }), ahora: () => AHORA, solo: ['cnmv'] });
  const todas = Object.values(sinControl.fichas).flatMap((f) => f.advertenciasCnmv);
  assert.ok(todas.length && todas.every((a) => a.estado === ILEGIBLE && /control/.test(a.motivo)));
  // Una página de la CNMV sin «No hay datos» ni tabla de resultados no se interpreta.
  const rara = await vigilar({ base: BASE, red: redFalsa({ cnmv: { Spiko: '<p>Mantenimiento</p>' } }), ahora: () => AHORA, solo: ['cnmv'] });
  assert.ok(Object.values(rara.fichas).flatMap((f) => f.advertenciasCnmv).filter((a) => a.nombre === 'Spiko').every((a) => a.estado === ILEGIBLE));
});

test('documentos: misma huella, versión nueva, sin huella publicada y bloqueado', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vigia-base-'));
  const D = (n) => `https://emisor.test/docs/${n}.pdf`;
  const ofertas = [{ slug: 'ficha-a', plataformaSlug: 'x', coleccion: 'principales', metricas: [], avisos: [] },
    { slug: 'ficha-b', plataformaSlug: 'x', coleccion: 'principales', metricas: [], avisos: [] }];
  fs.writeFileSync(path.join(tmp, 'escaparate-publicacion.json'), JSON.stringify({ versionEsquema: 2, fuente: {}, plataformas: [], ofertas }));
  fs.writeFileSync(path.join(tmp, 'documentacion-ofertas.json'), JSON.stringify({
    'ficha-a': { fuentes: [D('a'), D('b'), D('c'), D('d'), D('e'), 'https://emisor.test/pagina'], referencias: [], caracteristicas: [] },
    'ficha-b': { fuentes: [D('a'), 'https://geco.amf-france.org/back-office/document/download/1'], referencias: [], caracteristicas: [] },
  }));
  const cuerpo = (u) => `contenido de ${u}`;
  fs.mkdirSync(path.join(tmp, 'expedientes'));
  fs.writeFileSync(path.join(tmp, 'expedientes', 'ficha-a.json'), JSON.stringify({ slug: 'ficha-a', documentos: [
    { url: D('a'), sha256: sha256(cuerpo(D('a'))) }, { url: D('b'), sha256: sha256('versión del 12/11') }] }));
  fs.mkdirSync(path.join(tmp, 'grupos', 'g'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'grupos', 'g', 'inventario-consultas.json'), JSON.stringify({ consultas: [
    { url: D('c'), archivo: 'fuentes/crudo/c.pdf', http: 200, sha256: sha256(cuerpo(D('c'))), consultadoUtc: '2026-11-12T00:30:00Z' },
    // El texto extraído del mismo PDF no es la huella del documento.
    { url: D('c'), archivo: 'fuentes/c.txt', http: 200, sha256: sha256('texto'), consultadoUtc: '2026-11-12T00:31:00Z' },
    { url: 'https://geco.amf-france.org/back-office/document/download/1', http: 200, sha256: sha256('gecodoc'), consultadoUtc: '2026-11-12T00:31:00Z' },
  ] }));
  const red = redFalsa({
    documento: (u) => (u.includes('download/1') ? 'gecodoc' : cuerpo(u)),
    extra: { [D('e')]: () => ({ http: 403, buf: Buffer.from('AccessDenied'), horaUtc: '2026-11-13T08:31:15Z' }) },
  });
  const v = await vigilar({ base: tmp, red, ahora: () => AHORA, solo: ['documentos'] });
  const docs = Object.fromEntries(v.fichas['ficha-a'].documentos.map((d) => [d.url.split('/').pop(), d]));
  assert.deepEqual(Object.keys(docs).sort(), ['a.pdf', 'b.pdf', 'c.pdf', 'd.pdf', 'e.pdf'], 'las páginas HTML no se comparan por huella');
  assert.deepEqual([docs['a.pdf'].estado, docs['a.pdf'].sha256, docs['a.pdf'].origenHuella], [IGUAL, sha256(cuerpo(D('a'))), 'expediente']);
  assert.equal(docs['b.pdf'].estado, CAMBIA);
  assert.equal(docs['c.pdf'].estado, IGUAL, 'huella del inventario, no la del .txt');
  assert.deepEqual([docs['d.pdf'].estado, docs['d.pdf'].sha256Publicada], [CAMBIA, null]);
  assert.match(docs['d.pdf'].motivo, /sin huella publicada/);
  assert.deepEqual([docs['e.pdf'].estado, docs['e.pdf'].motivo], [ILEGIBLE, 'HTTP 403']);
  assert.equal(v.fichas['ficha-b'].documentos.find((d) => d.url.endsWith('download/1')).estado, IGUAL);
  // Un documento citado por dos fichas se descarga una vez.
  assert.equal(red.peticiones.filter((p) => p.url === D('a')).length, 1);
  assert.deepEqual(v.resumen.documentos, { [IGUAL]: 3, [CAMBIA]: 2, [ILEGIBLE]: 1 });
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('sin cifra publicada con la que comparar, «cambia» (se lee a mano), nunca «no cambia»', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vigia-sinpub-'));
  fs.copyFileSync(path.join(BASE, 'escaparate-publicacion.json'), path.join(tmp, 'escaparate-publicacion.json'));
  const docs = JSON.parse(fs.readFileSync(path.join(BASE, 'documentacion-ofertas.json'), 'utf8'));
  const pot = 'vivienda-pottendorfer-stra-e-62-wr-neustadt';
  docs[pot].referencias = docs[pot].referencias.filter((r) => !/^Mejor oferta de compra · /.test(r.etiqueta));
  fs.writeFileSync(path.join(tmp, 'documentacion-ofertas.json'), JSON.stringify(docs));
  const v = await vigilar({ base: tmp, red: redFalsa(), ahora: () => AHORA, solo: ['brickwise'] });
  const c = cifra(v, pot, /^Mejor oferta de compra/);
  assert.deepEqual([c.publicada, c.hoy, c.estado], [null, '19,00 € (3 participaciones, orden del 06/11/2025)', CAMBIA]);
  assert.match(c.motivo, /sin cifra publicada/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('vigia.json no lleva carteras ni identificadores de órdenes', async () => {
  const cartera = '0x' + 'ab'.repeat(20);
  const v1 = JSON.parse(leer('brickwise-v1-assets.json')).map((a) => ({ ...a, tokenId: 'TOKENSECRETO', offers: a.offers.map((o, i) => ({ ...o, offerId: `orden-${i}-secreta`, firstParty: cartera, interestedParty: cartera })) }));
  const red = redFalsa({ extra: { [BW_V1]: () => ({ http: 200, buf: Buffer.from(JSON.stringify(v1)), horaUtc: '2026-11-13T08:31:15Z' }) } });
  const v = await vigilar({ base: BASE, red, ahora: () => AHORA, solo: ['brickwise'] });
  const texto = JSON.stringify(v);
  for (const secreto of [cartera, 'TOKENSECRETO', 'secreta']) assert.ok(!texto.includes(secreto), secreto);
  assert.equal(cifra(v, 'vivienda-pottendorfer-stra-e-62-wr-neustadt', /^Mínimo/).hoy, '73,00 €');
});

test('libro de Brickwise y redondeo del 1,5 % (como preparar-entrega)', () => {
  assert.deepEqual([con15(95), con15(99), con15(115), con15(68.8), con15(73)], ['96,43', '100,49', '116,73', '69,83', '74,10']);
  const l = libroBrickwise({ offers: [
    { status: 'open', type: 'sell', amount: 5, price: 102, createdAt: '2026-09-05T10:00:00Z' },
    { status: 'open', type: 'sell', amount: 1, price: 102, createdAt: '2026-11-11T10:00:00Z' },
    { status: 'open', type: 'sell', amount: 2, price: 102, createdAt: '2026-09-28T10:00:00Z' },
    { status: 'closed', type: 'sell', amount: 1, price: 50, createdAt: '2026-11-12T10:00:00Z' },
    { status: 'open', type: 'buy', amount: 3, price: 20, createdAt: '2025-05-19T10:00:00Z' },
    { status: 'open', type: 'buy', amount: 1, price: 20, createdAt: '2025-06-01T10:00:00Z' },
  ] });
  assert.deepEqual(l.venta, { precio: 102, cantidad: 8, ordenes: 3, fecha: null, cantidades: [5, 2, 1], fechas: ['05/09/2026', '28/09/2026', '11/11/2026'] });
  assert.deepEqual(l.menor, { cantidad: 1, precio: 102, importe: 103.53 });
  assert.deepEqual(l.compra, { precio: 20, cantidad: 4, ordenes: 2, fecha: '19/05/2025' });
  assert.equal(l.participacionesEnVentaV1, 8);
  // Lo publicado del 12/11 se lee entero (ninguna cifra queda sin publicada con la que comparar).
  const pub = leerBase(BASE);
  assert.equal(pub.ofertas.size, 22);
  assert.ok(pub.huellas.size >= 50);
});

test('línea de órdenes: graba una pasada y la reproduce sin red con el mismo resultado', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vigia-cli-'));
  const grab = path.join(tmp, 'grabadas'), ciclo = path.join(tmp, 'ciclo');
  const red = conGrabacion(redFalsa({ documento: (u) => `doc ${u}` }), grab);
  const esperado = await vigilar({ base: BASE, red, ahora: () => AHORA });
  red.guardarIndice();
  assert.ok(fs.existsSync(path.join(grab, 'indice.json')) && fs.existsSync(path.join(grab, 'SHA256SUMS.txt')));
  const { stdout } = await ejecutar(process.execPath, [VIGIA, '--ciclo', ciclo, '--base', BASE, '--grabadas', grab, '--ahora', new Date(AHORA).toISOString()],
    { cwd: process.cwd(), env: { ...process.env, HTTPS_PROXY: '', https_proxy: '' } });
  assert.match(stdout, /\[cambia\] vivienda-pottendorfer-stra-e-62-wr-neustadt · Mínimo de la tarjeta \(venta más barata\): 80,00 € → 73,00 €/);
  assert.match(stdout, /\[cambia\] spiko-letras-del-tesoro-euro · Rentabilidad de la tarjeta \(monthlyYield de EUTBL\): 2,41 % → 2,40 %/);
  const v = JSON.parse(fs.readFileSync(path.join(ciclo, 'vigia.json'), 'utf8'));
  const quitar = ({ ciclo: _c, reproducidaDe: _r, ...x }) => x;
  assert.deepEqual(quitar(v), quitar(JSON.parse(JSON.stringify(esperado))));
  assert.ok(!fs.existsSync(path.join(ciclo, 'vigia-crudo')), 'al reproducir no se guarda crudo nuevo');
  // Una grabación alterada no se reproduce en silencio.
  const indice = JSON.parse(fs.readFileSync(path.join(grab, 'indice.json'), 'utf8'));
  fs.writeFileSync(path.join(grab, `${indice.find((e) => e.url === BW_V1).sha256}.bin`), '[]');
  await assert.rejects(ejecutar(process.execPath, [VIGIA, '--ciclo', ciclo, '--base', BASE, '--grabadas', grab], { env: { ...process.env, HTTPS_PROXY: '', https_proxy: '' } }), /grabación alterada/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('red real: un 403 no se reintenta, un corte sí (una vez) y un servidor recibe de una en una', async () => {
  let activos = 0, maxActivos = 0;
  const visitas = {};
  const srv = http.createServer((req, res) => {
    visitas[req.url] = (visitas[req.url] || 0) + 1;
    activos++; maxActivos = Math.max(maxActivos, activos);
    const fin = (code, body) => setTimeout(() => { activos--; res.writeHead(code); res.end(body); }, 30);
    if (req.url === '/403') return fin(403, 'no');
    if (req.url === '/503') return fin(503, 'no');
    if (req.url === '/corte' && visitas[req.url] === 1) { activos--; return req.socket.destroy(); }
    assert.equal(req.headers.cookie, undefined);
    fin(200, `ok ${req.url}`);
  });
  await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
  const u = (p) => `http://127.0.0.1:${srv.address().port}${p}`;
  const red = redEnVivo();
  const [a, b, c, d, e] = await Promise.all(['/403', '/503', '/corte', '/x', '/y'].map((p) => red({ metodo: 'GET', url: u(p), cuerpo: null, cabeceras: {} })));
  srv.close();
  assert.deepEqual([a.http, visitas['/403']], [403, 1]);
  assert.deepEqual([b.http, visitas['/503']], [503, 1]);
  assert.deepEqual([c.http, visitas['/corte'], c.buf.toString()], [200, 2, 'ok /corte']);
  assert.deepEqual([d.http, e.http], [200, 200]);
  assert.equal(maxActivos, 1, 'mismo servidor: de una en una');
});

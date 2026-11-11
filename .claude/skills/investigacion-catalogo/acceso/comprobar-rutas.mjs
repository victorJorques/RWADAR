#!/usr/bin/env node
// comprobar-rutas.mjs · RWAdar
// Prueba en menos de un minuto las rutas legítimas CONFIRMADAS por el verificador
// (ciclo del 11/11/2026) y dice cuáles siguen vivas.
//
// Uso:
//   node comprobar-rutas.mjs            # comprueba y guarda un resumen JSON en crudo/comprobar-rutas/
//   node comprobar-rutas.mjs --guardar  # además guarda cada respuesta en bruto
//   node comprobar-rutas.mjs --solo midas
//      (grupos: midas, spiko, spiko-letras, brickwise, crowdedhero, cryptocom)
//
// Reglas que este script respeta (no las cambies):
//   - Solo GET a páginas y API públicas, y POST JSON-RPC de solo lectura (eth_call) a nodos públicos.
//   - Agente de usuario por defecto de Node (y de curl en las dos rutas de BaFin, ver pedirCurlDirecto).
//     Sin cabeceras de navegador, sin cookies, sin token.
//   - Sin proxy de país ni VPN. Usa el proxy de salida del entorno si existe (HTTPS_PROXY).
//   - Si una web responde con un desafío anti-bots o 403, se anota y se pasa a la siguiente. No se reintenta.
//   - Nunca llama a api-prod.midas.app ni a ninguna API interna que pida sesión.
//   - Nunca usa la Wayback Machine (y nunca para documentos reservados a inversores verificados).
//   - Solo rutas que el verificador reprodujo. Las rechazadas no están aquí.
//   - Un mismo servidor recibe las peticiones de una en una (no se le satura).
//   - La API de Brickwise trae direcciones de cartera de particulares y la ficha de CrowdedHero
//     trae nombres de personas: aquí solo se imprimen cifras agregadas. El bruto (--guardar) no se publica.
// Sin dependencias. Node >= 22.21.

import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile, spawnSync } from "node:child_process";

// Node solo usa HTTPS_PROXY con fetch si NODE_USE_ENV_PROXY=1: se relanza a sí mismo una vez.
if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  const r = spawnSync(process.execPath, process.argv.slice(1), {
    stdio: "inherit",
    env: { ...process.env, NODE_USE_ENV_PROXY: "1", NODE_NO_WARNINGS: "1" },
  });
  process.exit(r.status ?? 1);
}

const AQUI = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const GUARDAR = args.includes("--guardar");
const SOLO = args.includes("--solo") ? args[args.indexOf("--solo") + 1] : null;
const TIEMPO_MAX_MS = 25_000;

const RPC = "https://ethereum-rpc.publicnode.com";
const ORACULO_MTBILL = "0x056339C044055819E8Db84E71f5f2E1F536b2E5b";
const CONTRATO_MTBILL = "0xdd629e5241cbc5919847783e6c96b2de4754e438";
const BOVEDA_INMEDIATA = "0x569D7dccBF6923350521ecBC28A555A500c4f0Ec";
const SUPERSTATE_REDEMPTION = "0x4c21b7577c8fe8b0b0669165ee7c8f67fa1454cf";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
// Token eurUSTBL de Spiko (clase EUR del fondo de letras en dólares, FR001400SBD3). Direcciones de la API pública de Spiko.
const EURUSTBL = [
  { red: "Ethereum", rpc: "https://ethereum-rpc.publicnode.com", contrato: "0x0183ace58bc8b8f1f84cc8b9ed1210e1c87df7e0" },
  { red: "Polygon", rpc: "https://polygon-bor-rpc.publicnode.com", contrato: "0x75cb1bd539ee2cb22031603a7b437f1f7077b05e" },
  { red: "Base", rpc: "https://base-rpc.publicnode.com", contrato: "0xa260d72df8ff2696f3a8d0be46b7bc4d743be764" },
  { red: "Arbitrum", rpc: "https://arbitrum-one-rpc.publicnode.com", contrato: "0xa8de1f55aa0e381cb456e1dcc9ff781ea0079068" },
];
const SEL = { // selectores de 4 bytes (keccak256 de la firma)
  latestRoundData: "0xfeaf968c", description: "0x7284e416", totalSupply: "0x18160ddd",
  paused: "0x5c975abb", instantDailyLimit: "0x3972183c", instantFee: "0xc47d51be",
  minAmount: "0x9b2cb5d8", balanceOf: "0x70a08231", decimals: "0x313ce567",
};
// La web de la CNMV (ASP.NET) da error 500 con «accept-language: *», que es lo que manda fetch por defecto.
// Se indica un idioma real; no es imitar un navegador, es negociar el idioma.
const CNMV = { "accept-language": "es" };
const GITBOOK = "https://3475141875-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FMndxFHqGeA4nzBBeKDTV%2Fuploads%2F";
const SPIKO_API = "https://public-api.spiko.io/v0/share-classes/";
const GECO = "https://geco.amf-france.org/back-office/";
const LV = "https://data.gov.lv/dati/api/3/action/datastore_search?resource_id=";
const LV_REGISTRO = "25e80bf3-f107-4ab4-89ef-251b5b9374e9", LV_ESTADOS = "27fcc5ec-c63b-4bfd-bb08-01f073a52d04";
const LV_BALANCE = "50ef4f26-f410-4007-b296-22043ca3dc43", LV_PYG = "d5fd17ef-d32e-40cb-8399-82b780095af0";
const LV_FILTRO_2025 = encodeURIComponent(JSON.stringify({ statement_id: [2340045, 2269545] })); // cuentas 2025: BALVORA Group y CrowdedHero Latvia
const LV_EMPRESA = { 2340045: "BALVORA Group", 2269545: "CrowdedHero Latvia" };
// Las 11 fichas de reventa de Brickwise publicadas en el catálogo (ISIN → nombre corto).
const BRICKWISE_FICHAS = {
  AT0000A2RAH5: "Plüddemanngasse", AT0000A2T4D7: "Sonnleithnergasse", AT0000A2U5V3: "Klagenfurt",
  AT0000A2WCD0: "Stallhofstraße", AT0000A2WCE8: "Schwarzer Weg", AT0000A2YPQ0: "Drautal",
  AT0000A2ZT84: "Randhartingergasse", AT0000A31KP7: "Hinterstoder", AT0000A324B4: "Pottendorfer",
  AT0000A38J32: "GreenPoint", AT0000A38J40: "Cohotel",
};

// Ayudas de lectura
const eur = (n) => Number(n).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const plano = (t) => t.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/g, " ").replace(/&euro;|&#8364;/g, "€").replace(/&amp;/g, "&").replace(/\s+/g, " ");
const dia = (s) => (s || "").slice(0, 10);

function brickwise(j) {
  let ventas = 0, compras = 0, viejas = 0; const tipos = new Set(); const hace1a = Date.now() - 365 * 864e5;
  const minimos = [];
  for (const a of j) {
    for (const o of a.offers || []) {
      if (o.status !== "open") continue;
      tipos.add(o.contactType);
      if (o.type === "sell") { ventas++; if (Date.parse(o.createdAt) < hace1a) viejas++; } else if (o.type === "buy") compras++;
    }
    const nombre = BRICKWISE_FICHAS[a.ISIN];
    if (!nombre) continue;
    const v = (a.offers || []).filter((o) => o.status === "open" && o.type === "sell");
    if (!v.length) { minimos.push(`${nombre} sin ventas`); continue; }
    const m = v.reduce((x, y) => (y.amount * y.price < x.amount * x.price ? y : x));
    minimos.push(`${nombre} ${eur(m.amount * m.price * 1.015)} € (${m.amount}×${m.price})`);
  }
  return `${ventas} ventas y ${compras} compras abiertas (el 11/11: 424 y 95); tipo ${[...tipos].join("/")}; ` +
    `${viejas} ventas con más de un año; orden de venta más barata publicada + 1,5 %: ${minimos.join(", ")}`;
}

function crowdedFicha(t) {
  const p = plano(t);
  const dias = p.match(/(\d+) Days remaining/)?.[1];
  const m = p.match(/Raised €([\d\s.,]+?) ([\d.]+)% financed €([\d\s.,]+?) Min target/);
  return m ? `captado ${m[1].trim()} € (${m[2]} %) de un mínimo de ${m[3].trim()} €; quedan ${dias ?? "?"} días` : "no se encontraron las cifras";
}

function lvCuentas(j, campos) {
  return (j.result?.records || []).map((r) => `${LV_EMPRESA[r.statement_id] || r.statement_id}: ${campos(r)}`).join("; ");
}

function lvUltimoEjercicio(j) {
  const r = (j.result?.records || []).filter((x) => x.year).sort((a, b) => b.year - a.year)[0];
  return r ? `último ejercicio presentado ${r.year} (statement ${r.id}, presentado ${dia(r.created_at)})` : "sin ejercicios";
}

// esperaSha: hash del 11/11/2026 cuando el contenido es estable (PDF, JSON fijo). Si cambia, hay versión nueva: hay que leerla.
// marcas: textos que deben aparecer para dar el dato por bueno.
const RUTAS = [
  // ---------- Midas · mTBILL ----------
  { grupo: "midas", id: "mfsa-folleto-base", url: "https://www.mfsa.mt/wp-content/uploads/2026/07/Midas-Software-GmbH-Base-Prospectus-Document-dated-17-July-2026.pdf",
    esperaSha: "a8fd63202caeccf140cd995d2a8fa27b250e5ea79366dcd875ad9fa1ee381349", dato: "Folleto base 17/07/2026 (copia del supervisor de Malta)" },
  { grupo: "midas", id: "gitbook-condiciones-finales-mtbill", url: GITBOOK + "UDquVH8yRhSxnVqxp0X4%2F20260714_mTBILL_FT_signed_final.pdf?alt=media",
    esperaSha: "b1e58001ec0f688aedc266ec63a37026e5fcf3f720f930f3aff5403036b3944a", dato: "Condiciones Finales mTBILL 17/07/2026 (España, minoristas, sin mínimo)" },
  { grupo: "midas", id: "gitbook-kid-mtbill-es", url: GITBOOK + "o0H3P2VXZM3GM2QeIOa2%2FKID_mTBILL%20es.pdf?alt=media",
    esperaSha: "6c22870917cda81ef3f28b01a6ea857e7e024163f3910c0cc2a36dc9e87da545", dato: "KID de mTBILL en español, revisión 17/07/2026" },
  { grupo: "midas", id: "esma-folletos-isin-mtbill", url: "https://registers.esma.europa.eu/solr/esma_registers_priii_documents/select?q=instrument_isins:CH1371002986&wt=json&rows=50&sort=approval_filing_date%20desc",
    marcas: ["FTWS-1420", "SPAIN"], json: (j) => `documentos=${j.response?.numFound}; último=${j.response?.docs?.[0]?.national_document_id} (${(j.response?.docs?.[0]?.approval_filing_date || "").slice(0, 10)})`,
    dato: "ESMA: Condiciones Finales pasaportadas a España (QTime cambia el hash: se mira el contenido)" },
  { grupo: "midas", id: "esma-folletos-lei-midas", url: "https://registers.esma.europa.eu/solr/esma_registers_priii_documents/select?q=party_name:*984500BB00BN6D2B7C48*&wt=json&rows=100&sort=approval_filing_date%20desc",
    marcas: ["BPWO-84"], json: (j) => `documentos=${j.response?.numFound} (el 11/11 eran 41); último=${j.response?.docs?.[0]?.national_document_id} (${(j.response?.docs?.[0]?.approval_filing_date || "").slice(0, 10)})`,
    dato: "ESMA: todos los documentos de Midas; si sube de 41 hay producto o suplemento nuevo" },
  { grupo: "midas", id: "cnmv-pasaportes-midas", url: "https://www.cnmv.es/portal/Consultas/Folletos/Pasaportes?denominacion=&lei=984500BB00BN6D2B7C48",
    cabeceras: CNMV, marcas: ["BPWO-84"], esperaSha: "6890ae90ba7ece408c0f57241e54243ed5cb00585a06a3b149f19e4db441b100", dato: "CNMV: folleto BPWO-84 notificado en España" },
  { grupo: "midas", id: "rwaxyz-mtbill", url: "https://app.rwa.xyz/assets/mTBILL", marcas: ["apy_30_day"],
    texto: (t) => { const m = t.match(/"apy_30_day":\{"val":([0-9.eE-]+)/); return m ? `APY 30 d=${(+m[1] * (+m[1] < 1 ? 100 : 1)).toFixed(2)} % (solo contraste; no usar sus comisiones)` : "sin apy_30_day"; },
    dato: "rwa.xyz: APY 7 y 30 días (contraste)" },
  { grupo: "midas", id: "defillama-serie-mtbill", url: "https://yields.llama.fi/chart/b8d0d351-ac04-40de-9768-1fb9fdc68114",
    json: (j) => { const u = j.data?.at(-1); return u ? `último ${u.timestamp?.slice(0, 10)}: apy=${u.apy} tvl=${Math.round(u.tvlUsd)}` : "sin datos"; },
    dato: "DefiLlama: serie diaria APY/TVL (contraste; el APY de un día va a saltos)" },
  { grupo: "midas", id: "defillama-precio-mtbill", url: `https://coins.llama.fi/prices/current/ethereum:${CONTRATO_MTBILL}`,
    json: (j) => { const c = Object.values(j.coins || {})[0]; return c ? `precio=${c.price} USD` : "sin precio"; }, dato: "DefiLlama: precio (debe igualar al oráculo)" },
  { grupo: "midas", id: "coingecko-mtbill", url: "https://api.coingecko.com/api/v3/coins/midas-mtbill?localization=false&tickers=false&community_data=false&developer_data=false",
    json: (j) => `precio=${j.market_data?.current_price?.usd} USD; capitalización=${j.market_data?.market_cap?.usd}`, dato: "CoinGecko: precio y capitalización (contraste)" },

  // ---------- Spiko · Smart Cash Euro ----------
  { grupo: "spiko", id: "boe-circular-2-2011", url: "https://www.boe.es/buscar/act.php?id=BOE-A-2011-10830", marcas: ["inscripción en el Registro de la Comisión Nacional del Mercado de Valores de compartimentos"],
    dato: "BOE: la CNMV dejó de inscribir compartimentos (Circular 2/2011)" },
  { grupo: "spiko", id: "cnmv-ficha-spiko-sicav", url: "https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0401205J&vista=0", cabeceras: CNMV, marcas: ["2380"],
    dato: "CNMV: SPIKO SICAV n.º 2380 (no lista compartimentos)" },
  { grupo: "spiko", id: "cnmv-otra-info-relevante", url: "https://www.cnmv.es/Portal/HR/ResultadoBusquedaHR.aspx?division=2&nif=N0401205J", cabeceras: CNMV, marcas: ["No se han encontrado datos"],
    dato: "CNMV: otra información relevante de SPIKO SICAV (usar esta URL; en minúsculas da 403)" },
  { grupo: "spiko", id: "afm-spiko-sicav", url: "https://www.afm.nl/nl-nl/sector/registers/vergunningenregisters/beleggingsinstellingen/details?id=3EB284BB-7CF7-F011-8406-000D3A4674CC",
    marcas: ["Spiko Amundi Overnight Swap Fund"], dato: "AFM (Países Bajos): subfondo SAFO inscrito el 16/03/2026" },
  { grupo: "spiko", id: "fsma-spiko-json", url: "https://www.ctr-csr.be/en/export/party/560743",
    esperaSha: "5ef1227ae67d6270832b0596a96f324a47c9aebc613d32b8d57ea8a72af4cf48", marcas: ["07795"], dato: "FSMA (Bélgica): Spiko Sicav n.º 07795 y sus productos" },
  { grupo: "spiko", id: "fsc-bulgaria-medios", url: "https://www.fsc.bg/wp-json/wp/v2/media?search=spiko&per_page=100",
    json: (j) => `${Array.isArray(j) ? j.length : "?"} documentos; último ${Array.isArray(j) && j[0] ? (j[0].date || "").slice(0, 10) : "-"} (el 11/11 eran 9, último 26/10)`,
    dato: "FSC (Bulgaria): documentos depositados por Spiko" },
  { grupo: "spiko", id: "spiko-docs-paises", url: "https://docs.spiko.io/documentation/product_overview/fund_availability/",
    esperaSha: "cc8069ac232c1e777f41b2aac0d686cde2e3819e87e558654f01587c09bd4d10", marcas: ["Last updated"],
    texto: (t) => { const m = t.match(/Last updated:?\s*(?:<[^>]+>\s*)*([A-Z][a-z]+ \d{1,2}, \d{4})/); return m ? `Last updated: ${m[1]}` : ""; },
    dato: "Spiko: tabla de países (España ✅), lo dice el emisor" },
  { grupo: "spiko", id: "esma-cbdif-spiko", url: "https://registers.esma.europa.eu/solr/esma_registers_funds_cbdif/select?q=spiko&rows=0&wt=json",
    json: (j) => `resultados=${j.response?.numFound} (0 no prueba nada: la base no tiene SPIKO SICAV)`, dato: "ESMA comercialización transfronteriza (solo control)" },
  { grupo: "spiko", id: "amundi-nota-safo", url: "https://int.media.amundi.com/article/spiko-and-amundi-introduce-safo", marcas: ["SAFO"],
    dato: "Nota de prensa de Amundi del 18/03/2026 (foto del lanzamiento)" },

  // ---------- Spiko · Letras del Tesoro EUR/USD (veredicto: verificador, 11/11 15:14-15:17 UTC) ----------
  { grupo: "spiko-letras", id: "api-eurUSTBL-totales", url: SPIKO_API + "eurUSTBL/totals",
    json: (j) => `acciones=${j.totalShares}; titulares=${j.numberOfHolders}; VL ${j.netAssetValue?.amount?.value} EUR del ${dia(j.netAssetValue?.day)}; órdenes=${j.totalOrders?.value} EUR (el 11/11: 10000 acciones y 1 titular)`,
    dato: "API pública de Spiko: totales de la clase EUR (FR001400SBD3)" },
  { grupo: "spiko-letras", id: "api-eurUSTBL-historial", url: SPIKO_API + "eurUSTBL/totals/from-day?startDay=2024-11-01",
    json: (j) => {
      let cambio = null;
      for (let i = 1; i < j.length; i++) if (j[i].totalShares !== j[i - 1].totalShares || j[i].numberOfHolders !== j[i - 1].numberOfHolders) cambio = dia(j[i].netAssetValue?.day);
      return `${j.length} días (${dia(j[0]?.netAssetValue?.day)} a ${dia(j.at(-1)?.netAssetValue?.day)}); último cambio de acciones o titulares: ${cambio} (el 11/11: 2024-11-13)`;
    }, dato: "API pública de Spiko: historial diario de la clase EUR" },
  { grupo: "spiko-letras", id: "api-eurUSTBL-ficha", url: SPIKO_API + "eurUSTBL", marcas: ["FR001400SBD3"],
    json: (j) => `minimumInitialSubscription=${j.minimumInitialSubscription} (el folleto del 01/09/2026 dice 1 EUR)`, dato: "API pública de Spiko: ficha de la clase EUR" },
  { grupo: "spiko-letras", id: "api-USTBL-totales", url: SPIKO_API + "USTBL/totals",
    json: (j) => `titulares=${j.numberOfHolders}; activos=${j.totalAssets?.value} USD; VL ${j.netAssetValue?.amount?.value} USD del ${dia(j.netAssetValue?.day)}`, dato: "API pública de Spiko: totales de la clase USD" },
  { grupo: "spiko-letras", id: "docs-api-sin-autenticacion", url: "https://docs.spiko.io/developers/public_api/getting_started", marcas: ["No authentication is needed"],
    dato: "Docs de Spiko: la API pública no pide cuenta ni autenticación" },
  { grupo: "spiko-letras", id: "docs-productos-disponibles", url: "https://docs.spiko.io/direct/recipes/available_products",
    esperaSha: "4be804a880bb36234b0a8ba816eb77ff071960a96855b80ee8e497eeb4974ac3", marcas: ["converted into Dollars"], dato: "Docs de Spiko: los euros se cambian a dólares (BFIX 11:30 París)" },
  { grupo: "spiko-letras", id: "docs-cambio-divisa", url: "https://docs.spiko.io/documentation/account_management/currency_exchange",
    esperaSha: "44ffba9a0f6452797a4a2d4d263b80c90a73bc89705135bce41ad50e8f146703", marcas: ["BFIX"], dato: "Docs de Spiko: cambio de divisa" },
  { grupo: "spiko-letras", id: "web-es-letras-dollar", url: "https://www.spiko.io/es/spiko-letras-del-tesoro-dollar",
    esperaSha: "da4d37cea7f5f93f36944bd093a7bc7d0a322e04f3b036cd755d3da5cbc09581", marcas: ["Depósito inicial mínimo"], dato: "Web ES de Spiko: «Depósito inicial mínimo $1» (clase USD)" },
  { grupo: "spiko-letras", id: "data-spiko-ustbl", url: "https://data.spiko.io/ustbl/", marcas: ["Minimum initial subscription"],
    texto: (t) => { const m = plano(t).match(/Minimum initial subscription\s*([\d.,]+ ?[A-Z]{3})/); return m ? `mínimo inicial ${m[1]} (página dinámica: se mira el texto)` : ""; },
    dato: "data.spiko.io: ficha de la clase USD" },
  { grupo: "spiko-letras", id: "geco-ultimo-vl-SBD3", url: GECO + "funds/lastVl/FR001400SBD3",
    json: (j) => `VL ${j.netAssetValue} EUR del ${j.valuationDate}; acciones=${j.shareNumber}`, dato: "AMF GECO: último VL de la clase EUR (lo envía el depositario)" },
  { grupo: "spiko-letras", id: "geco-clases-c79398", url: GECO + "funds/compartment/c79398/shares", marcas: ["FR001400SBD3", "Vivant"],
    dato: "AMF GECO: clases del compartimento (EUR non hedgée, Vivant, Tous souscripteurs)" },
  { grupo: "spiko-letras", id: "geco-lista-documentos", url: GECO + "document/byCompartAndProduct?compartCode=c79398&prdCode=p79397",
    json: (j) => { const p = j.filter((d) => d.docTypeLib === "Prospectus").sort((a, b) => (b.dateEffet || "").localeCompare(a.dateEffet || ""))[0];
      return `${j.length} documentos; último folleto: ${p?.idInterne} «${p?.docName}» con efecto ${p?.dateEffet} (el 11/11: 438274, 2026-09-01)`; },
    dato: "AMF GECO: lista de documentos de SPIKO SICAV" },
  { grupo: "spiko-letras", id: "geco-informe-semestral-429960", url: GECO + "document/download/429960",
    esperaSha: "3c55af880c642271dd51ba03db93dd17f717a2ad59356b7c296164c833adf488", dato: "AMF GECO: informe semestral al 30/06/2026 (clase EUR: 10 000 acciones)" },
  { grupo: "spiko-letras", id: "geco-folleto-438274", url: GECO + "document/download/438274",
    esperaSha: "940559b4976a6837791e72725bc4ac3bf4c5faf579592bed7d36ac9d215f74fe", dato: "AMF GECO: folleto vFR 2026.09.01" },
  { grupo: "spiko-letras", id: "folleto-en-spiko", url: "https://cdn.spiko.finance/legal_docs/EN/Prospectus_Spiko_SICAV_EN.pdf",
    esperaSha: "7457e79f285397aa019170bc03bfe41167c7adf32714f0c5ea8315fb5ccffb35", dato: "Folleto EN de Spiko (01/09/2026): clase EUR FR001400SBD3, mínimo 1 EUR" },

  // ---------- Brickwise · 11 fichas de reventa (veredicto: verificador, 11/11 15:18-15:22 UTC) ----------
  { grupo: "brickwise", id: "pagina-contratos", url: "https://www.brickwise.at/contracts", marcas: ["Nutzungsbedingungen_Brickwise.pdf"],
    dato: "Brickwise /contracts: enlaza las condiciones de uso vigentes" },
  { grupo: "brickwise", id: "condiciones-de-uso-pdf", url: "https://cdn.prod.website-files.com/62414ac6ad5d1a1acc6c486a/62414ac6ad5d1a78816c4903_Nutzungsbedingungen_Brickwise.pdf",
    esperaSha: "38067d75c7f3d09ce813fe0cd52c563acdacf0efae061b016a1570392f206c9c", dato: "Condiciones de uso (Datum 29.09.2021): 3.2.2(b) y 3.2.3" },
  { grupo: "brickwise", id: "guia-vender", url: "https://www.brickwise.at/how-it-works/verkaufen-kann-so-einfach-sein-auch-bei-immobilieninvestments",
    esperaSha: "5104128136086df573caaff286286307de78b706ab46a3366852ba88d6e36340", marcas: ["Anzahl der Anteile"], dato: "Guía oficial de venta (comunicación comercial, sin fecha)" },
  { grupo: "brickwise", id: "faq-handel-marktplatz", url: "https://www.brickwise.at/support/wie-funktioniert-der-handel-am-marktplatz",
    esperaSha: "52d2e52750799577afca08ece7cd54c2cb3bb9699c66b9e6cdfcdf4cfe941e80", marcas: ["Preis pro Anteil"], dato: "FAQ: cómo funciona el mercado" },
  { grupo: "brickwise", id: "faq-wie-kann-ich-investieren", url: "https://www.brickwise.at/support/wie-kann-ich-investieren",
    esperaSha: "2d34986c29dbc4017d42ffd9417db8273b72db174e9b8123d22aec54142543f3", dato: "FAQ: crear tu propia orden (eliges cantidad y precio)" },
  { grupo: "brickwise", id: "app-js-publico", url: "https://app.brickwise.at/js/app.85dda63a.js",
    esperaSha: "b5c9c15438379efc1ddf96df1ceb9310b7991096c72a98cdb62b788a37e0601d", marcas: ["Max. verfügbar", "Es sind nicht so viele Anteile verfügbar"],
    dato: "JavaScript público de la web (textos de interfaz; si da 404, la app cambió de versión: buscar el nuevo js/app.*.js en la página pública)" },
  { grupo: "brickwise", id: "api-v1-assets", url: "https://api.app.brickwise.at/api/v1/assets", json: brickwise,
    dato: "API pública que usa la web (sin token). Trae carteras de particulares: no publicarlas" },
  { grupo: "brickwise", id: "faq-marktwert", url: "https://www.brickwise.at/support/wie-berechnet-sich-der-marktwert",
    esperaSha: "f6046b832e7a8093b6e3dfef1c22b1a31f8053914814d4e5802f220f882adbb3", marcas: ["zuletzt gehandelten Preis"], dato: "FAQ: valor de mercado = último precio negociado" },
  { grupo: "brickwise", id: "cnmv-effecta-5003", url: "https://www.cnmv.es/Portal/Consultas/ESI/ESISExtranjerasLP.aspx?numero=5003&tipo=CLP",
    cabeceras: CNMV, marcas: ["EFFECTA", "11/11/2020"], dato: "CNMV: EFFECTA GmbH n.º 5003, libre prestación desde Alemania" },
  { grupo: "brickwise", id: "cnmv-effecta-programa", url: "https://www.cnmv.es/Portal/Consultas/ESI/ESISExtranjerasLP.aspx?tipo=CLP&numero=5003&vista=17",
    cabeceras: CNMV, marcas: ["Recepción y transmisión"], dato: "CNMV: programa de actividades de Effecta" },
  { grupo: "brickwise", id: "cnmv-effecta-agentes", url: "https://www.cnmv.es/Portal/Consultas/ESI/ESISExtranjerasLP.aspx?tipo=CLP&numero=5003&vista=8",
    cabeceras: CNMV, marcas: ["No se han encontrado datos"], dato: "CNMV: agentes de Effecta en España (ninguno)" },

  // ---------- CrowdedHero · bonos DLT (veredicto: verificador, 11/11 15:21-15:25 UTC) ----------
  { grupo: "crowdedhero", id: "borme-simpleros-2020", url: "https://www.boe.es/borme/dias/2020/09/01/pdfs/BORME-A-2020-169-08.pdf",
    esperaSha: "39fcba8e188fdf9ac99510560730d2dbb56a0d34f3ece6c9ffc1254d942e398d", dato: "BORME: constitución de SIMPLEROS S.L. (24/07/2020, capital de 3.000 €)" },
  { grupo: "crowdedhero", id: "simpleros-condiciones-generales", url: "https://simpleros.es/condiciones-generales", marcas: ["B-01787720", "47434"],
    dato: "Web del emisor: NIF y datos registrales (no están en /conditions)" },
  { grupo: "crowdedhero", id: "lv-registro-balvora", url: `${LV}${LV_REGISTRO}&q=42103079662&limit=5`,
    json: (j) => { const r = j.result?.records?.find((x) => String(x.regcode) === "42103079662"); return r ? `${r.name}; alta ${dia(r.registered)}; baja ${r.terminated ?? "ninguna"}` : "sin registro"; },
    dato: "Registro mercantil de Letonia (data.gov.lv): emisor de Amber" },
  { grupo: "crowdedhero", id: "lv-registro-crowdedhero", url: `${LV}${LV_REGISTRO}&q=50203309441&limit=5`,
    json: (j) => { const r = j.result?.records?.find((x) => String(x.regcode) === "50203309441"); return r ? `${r.name}; alta ${dia(r.registered)}; baja ${r.terminated ?? "ninguna"}` : "sin registro"; },
    dato: "Registro mercantil de Letonia (data.gov.lv): la plataforma" },
  { grupo: "crowdedhero", id: "lv-ejercicios-balvora", url: `${LV}${LV_ESTADOS}&q=42103079662&limit=50`, json: lvUltimoEjercicio,
    dato: "data.gov.lv: cuentas presentadas por BALVORA Group (si sale 2026, hay cuentas nuevas)" },
  { grupo: "crowdedhero", id: "lv-ejercicios-crowdedhero", url: `${LV}${LV_ESTADOS}&q=50203309441&limit=50`, json: lvUltimoEjercicio,
    dato: "data.gov.lv: cuentas presentadas por CrowdedHero Latvia" },
  { grupo: "crowdedhero", id: "lv-balance-2025", url: `${LV}${LV_BALANCE}&filters=${LV_FILTRO_2025}&limit=10`,
    json: (j) => lvCuentas(j, (r) => `activo ${r.total_assets} €, fondos propios ${r.equity} €, deuda ${r.current_liabilities + r.non_current_liabilities} €`),
    dato: "data.gov.lv: balances de 2025" },
  { grupo: "crowdedhero", id: "lv-pyg-2025", url: `${LV}${LV_PYG}&filters=${LV_FILTRO_2025}&limit=10`,
    json: (j) => lvCuentas(j, (r) => `ventas ${r.net_turnover} €, resultado ${r.net_income} €`), dato: "data.gov.lv: pérdidas y ganancias de 2025" },
  { grupo: "crowdedhero", id: "ficha-simpleros-p50", url: "https://www.crowdedhero.com/project/view?id=50", marcas: ["No deposit guarantee or investor compensation scheme"],
    texto: crowdedFicha, dato: "Ficha pública de Simpleros (cifras del día; la cabecera y el texto no coinciden en el mínimo)" },
  { grupo: "crowdedhero", id: "ficha-amber-p49", url: "https://www.crowdedhero.com/project/view?id=49", texto: crowdedFicha, dato: "Ficha pública de Amber Hostelis (cifras del día)" },
  { grupo: "crowdedhero", id: "legal-riesgos", url: "https://www.crowdedhero.com/legal?category=risk", marcas: ["willing to lose"], dato: "Página legal de riesgos" },
  { grupo: "crowdedhero", id: "legal-contrato-dlt", url: "https://www.crowdedhero.com/legal?category=dlt", marcas: ["Kryptowertpapiere", "NYALA Digital Asset"],
    dato: "Contrato DLT genérico (atribuye la emisión a NYALA: error de redacción, ver términos de Simpleros)" },
  { grupo: "crowdedhero", id: "bafin-busqueda-nyala", url: "https://portal.mvp.bafin.de/database/InstInfo/sucheForm.do?institutName=NYALA&sucheButtonInstitut=Suche",
    curl: true, esperaSha: "a03e220cd78c1ef78d2a75874c4bb6e2e328e9cf4910f9b6dbb5f7bf98b6220f", marcas: ["Keine Ergebnisse"], dato: "BaFin InstInfo: NYALA no figura" },
  { grupo: "crowdedhero", id: "bafin-smart-registry", url: "https://portal.mvp.bafin.de/database/InstInfo/institutDetails.do?cmd=loadInstitutAction&institutId=160639",
    curl: true, esperaSha: "851ce9e0d4d957dc3a880bcbfda487dd83634ccc20d3439171791e359799de90", marcas: ["19.08.2026"], dato: "BaFin InstInfo: Smart Registry GmbH, registrador de criptovalores desde el 19.08.2026" },
  { grupo: "crowdedhero", id: "nyala-valores-electronicos", url: "https://www.nyala.de/en/products/electronic-securities", marcas: ["Simpleros Bonds X", "DE000A4EXNM2"],
    dato: "Publicación §5 eWpG del registrador: «Simpleros Bonds X», ISIN DE000A4EXNM2" },
  { grupo: "crowdedhero", id: "terminos-bono-simpleros", url: "https://de000a4exnm2.register.nyala.de/BondProspectus_SIMPLEROS%2003.07.2026.pdf",
    esperaSha: "c0c445e493def11b76de0a59f9992afcfc41be278b0584398fd1538df42af056", dato: "Términos de emisión de Simpleros (publicación legal del registrador)" },
  { grupo: "crowdedhero", id: "esma-ecsp-crowdedhero", url: "https://registers.esma.europa.eu/solr/esma_registers_upreg/select?q=ae_lei:984500B08DG03M3EA171&wt=json",
    json: (j) => { const d = j.response?.docs?.[0]; return d ? `${d.ae_entityName}: ${d.ae_status}; acogida ${d.ae_hostMemberStates?.join("/")}; autorizada ${d.ae_authorisationNotificationDateStr}; actualizado ${d.ae_lastUpdateStr}` : "sin resultados"; },
    dato: "ESMA: registro de proveedores de financiación participativa" },
  { grupo: "crowdedhero", id: "cnmv-psfp-crowdedhero", url: "https://www.cnmv.es/portal/consultas/servicios-financiacion-participativa/Proveedor-Europeo?nreg=1&nif=PSFPUE0001",
    cabeceras: CNMV, esperaSha: "fe578b1438a90bc3b73be8193d9506f516cf4b195b1712a552e245e5cc3be4fb", marcas: ["LETONIA", "01/09/2022"], dato: "CNMV: proveedor europeo n.º 1 (usar esta URL; la de /Portal/Consultas/PSFP/ da 403)" },

  // ---------- Crypto.com · acciones tokenizadas EEE (veredicto: verificador, 11/11 15:18-15:20 UTC) ----------
  { grupo: "cryptocom", id: "condiciones-ue-fccy", url: "https://crypto.com/document/fccy-tokenised-equities-terms",
    esperaSha: "1169bff5d9a4deaf72885cf185e5134274089e0534fb43eab0ba8cdd37421c6f", dato: "Condiciones UE de Foris Capital CY («Last Update: 11 August 2026»)" },
  { grupo: "cryptocom", id: "politica-eventos-corporativos", url: "https://crypto.com/document/tokenised-equities-corporate-action-policy",
    esperaSha: "06d4eac0142ce67358a7a1fd07e751a86a00f13d3ea97aeb6eea9b18494cc974", dato: "Política de eventos corporativos (sin fecha)" },
  { grupo: "cryptocom", id: "declaracion-riesgos-fccy", url: "https://crypto.com/document/fccy-tokenised-equities-risk-statement",
    esperaSha: "8d5a498fe8787ae05d5911f5d00826b6e97db05a9d31c79aa04f13f87052fe3e", dato: "Declaración de riesgos UE (sin fecha)" },
  { grupo: "cryptocom", id: "ayuda-acerca-eee", url: "https://help.crypto.com/en/articles/15855813-about-crypto-com-tokenized-stocks-eea",
    marcas: ["available in your jurisdiction", "Key Information Document"], dato: "Centro de ayuda: artículo principal (página dinámica)" },
  { grupo: "cryptocom", id: "ayuda-dividendos-eee", url: "https://help.crypto.com/en/articles/15855830-corporate-actions-and-dividends-of-tokenized-stocks-eea",
    marcas: ["30% U.S. withholding tax"], dato: "Centro de ayuda: retención del 30 % y reinversión" },
  { grupo: "cryptocom", id: "ayuda-coleccion-eee", url: "https://help.crypto.com/en/collections/19682896-tokenized-stocks-eea",
    texto: (t) => `${new Set(t.match(/\/articles\/\d+/g) || []).size} artículos (el 11/11 eran 3)`, dato: "Centro de ayuda: colección «Tokenized Stocks (EEA)»" },
  { grupo: "cryptocom", id: "cysec-foris-46172", url: "https://www.cysec.gov.cy/en-GB/entities/investment-firms/cypriot/46172/", marcas: ["344/17", "Spain"],
    dato: "CySEC: licencia 344/17 y pasaporte a 29 países del EEE (España incluida)" },
  { grupo: "cryptocom", id: "cnmv-foris-4485", url: "https://www.cnmv.es/portal/Consultas/ESI/ESISExtranjerasLP.aspx?tipo=CLP&numero=4485",
    cabeceras: CNMV, marcas: ["FORIS CAPITAL CY LIMITED", "19/01/2018"], dato: "CNMV: Foris Capital CY n.º 4485, libre prestación desde Chipre" },
  { grupo: "cryptocom", id: "cnmv-foris-4485-servicios", url: "https://www.cnmv.es/portal/Consultas/ESI/ESISExtranjerasLP.aspx?tipo=CLP&numero=4485&vista=17",
    cabeceras: CNMV, esperaSha: "966fe17043d86f7e3ee031fe8a76e0932679f1e46503e66f581378cb7266bb70", marcas: ["Recepción y transmisión"], dato: "CNMV: servicios e instrumentos de la n.º 4485" },
  { grupo: "cryptocom", id: "fsma-foris", url: "https://www.fsma.be/en/party/foris-capital-cy",
    esperaSha: "31fa6bfcd16c3691b2cec0fb556252fdde62ede531d7271cab3c30a4a2a14ef2", marcas: ["Foris Capital CY"], dato: "FSMA (Bélgica): libre prestación desde el 07/05/2026" },
  { grupo: "cryptocom", id: "app-store-es", url: "https://itunes.apple.com/lookup?id=1262148500&country=es",
    json: (j) => { const r = j.results?.[0]; return r ? `«${r.trackName}» ${r.version} del ${r.currentVersionReleaseDate}; anuncia acciones tokenizadas: ${/tokenizadas/.test(r.description) ? "sí" : "no"}; menciona el KID: ${/KID/.test(r.description) ? "sí" : "no"}` : "sin resultados"; },
    dato: "Ficha de la App Store española (API pública de iTunes)" },

  // ---------- Controles: deben seguir bloqueadas. Una sola petición normal; NO se intenta pasar el bloqueo ----------
  { grupo: "midas", id: "control-midas-web", url: "https://midas.app/mtbill", control: true, dato: "Web de Midas (el 11/11: 403 de Cloudflare)" },
  { grupo: "midas", id: "control-midas-docs", url: "https://docs.midas.app/llms-full.txt", control: true, esperaSha: "aca8b6c750158759", dato: "Docs de Midas: intermitente (09:26 200; 10:20-15:12 403; 15:29 200 con el mismo hash)" },
];

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const ahora = () => new Date().toISOString().replace(/\.\d+Z$/, "Z");

// Cola por servidor: un mismo host recibe las peticiones de una en una.
const colas = new Map();
function enCola(url, tarea) {
  const host = new URL(url).host;
  const previa = colas.get(host) || Promise.resolve();
  const esta = previa.then(tarea, tarea);
  colas.set(host, esta.catch(() => {}));
  return esta;
}

async function pedirDirecto(url, opciones = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIEMPO_MAX_MS);
  const hora = ahora();
  try {
    const r = await fetch(url, { ...opciones, signal: ctl.signal, redirect: "follow" });
    const buf = Buffer.from(await r.arrayBuffer());
    return { hora, http: r.status, bytes: buf.length, sha: sha256(buf), buf,
      cf: r.headers.get("cf-mitigated") || "", server: r.headers.get("server") || "" };
  } catch (e) {
    return { hora, http: 0, bytes: 0, sha: "", buf: Buffer.alloc(0), error: e.cause?.code || e.name || String(e) };
  } finally { clearTimeout(t); }
}
const pedir = (url, opciones = {}) => enCola(url, () => pedirDirecto(url, opciones));

// BaFin manda una cabecera Permissions-Policy partida en varias líneas. El analizador estricto de Node la
// rechaza (HPE_INVALID_HEADER_TOKEN); curl la acepta. Para esas rutas se usa curl con su agente por defecto:
// la misma petición GET normal, sin disfraz ni cabeceras añadidas.
function pedirCurlDirecto(url) {
  const hora = ahora();
  return new Promise((resolver) => {
    execFile("curl", ["-sS", "--max-time", String(TIEMPO_MAX_MS / 1000), "-o", "-", "-w", "%{stderr}%{http_code}", url],
      { encoding: "buffer", maxBuffer: 64 << 20 }, (err, stdout, stderr) => {
        const salidaErr = String(stderr || "");
        const http = Number(salidaErr.trim().slice(-3)) || 0;
        const buf = http ? Buffer.from(stdout || []) : Buffer.alloc(0);
        resolver({ hora, http, bytes: buf.length, sha: buf.length ? sha256(buf) : "", buf, cf: "", server: "",
          ...(http ? {} : { error: salidaErr.trim() || err?.message || "curl sin respuesta" }) });
      });
  });
}
const pedirCurl = (url) => enCola(url, () => pedirCurlDirecto(url));

async function comprobarRuta(ruta) {
  const r = ruta.curl ? await pedirCurl(ruta.url) : await pedir(ruta.url, ruta.cabeceras ? { headers: ruta.cabeceras } : {});
  const texto = r.buf.toString("utf8");
  let estado, detalle = "";
  if (ruta.control) {
    estado = r.http === 200 ? "ABIERTA ahora" : "sigue bloqueada";
    detalle = r.http ? `${r.http}${r.server ? " " + r.server : ""}${r.cf ? " cf-mitigated=" + r.cf : ""}` : r.error;
    if (r.http === 200) detalle += ruta.esperaSha && r.sha.startsWith(ruta.esperaSha)
      ? "; mismo contenido que la copia de las 09:26 del 11/11: se puede leer con --guardar (petición normal, sin eludir nada)"
      : "; contenido nuevo: guardarlo con --guardar y leerlo";
  } else if (r.http !== 200) {
    estado = "CAÍDA";
    detalle = r.http ? `HTTP ${r.http}${r.cf ? " (desafío anti-bots: no se elude)" : ""}` : `sin respuesta: ${r.error}`;
  } else {
    const faltan = (ruta.marcas || []).filter((m) => !texto.includes(m));
    if (faltan.length) { estado = "CAMBIADA"; detalle = `falta: ${faltan.join(" | ")}`; }
    else if (ruta.esperaSha && r.sha !== ruta.esperaSha) { estado = "VIVA, versión nueva"; detalle = "el hash no es el del 11/11: leer el documento nuevo"; }
    else { estado = "VIVA"; detalle = ruta.esperaSha ? "mismo hash que el 11/11" : ""; }
    try {
      if (ruta.json) detalle = [detalle, ruta.json(JSON.parse(texto))].filter(Boolean).join("; ");
      if (ruta.texto) detalle = [detalle, ruta.texto(texto)].filter(Boolean).join("; ");
    } catch (e) { detalle += `; no se pudo leer: ${e.message}`; }
  }
  return { ...ruta, ...r, estado, detalle };
}

// ---------- Lectura en cadena (eth_call de solo lectura, sin wallet ni firma) ----------
const pal = (hex, i) => BigInt("0x" + (hex.slice(2).slice(i * 64, i * 64 + 64) || "0"));
const dirArg = (a) => a.toLowerCase().replace(/^0x/, "").padStart(64, "0");
const cuerpo = (lote) => ({ method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(lote) });

async function comprobarCadena() {
  const r1 = await pedir(RPC, cuerpo({ jsonrpc: "2.0", id: 1, method: "eth_getBlockByNumber", params: ["latest", false] }));
  if (r1.http !== 200) return { grupo: "midas", id: "rpc-oraculo-y-boveda", url: RPC, ...r1, estado: "CAÍDA", detalle: r1.error || `HTTP ${r1.http}` };
  const bloque = JSON.parse(r1.buf.toString()).result;
  const tag = bloque.number;
  const call = (id, to, data) => ({ jsonrpc: "2.0", id, method: "eth_call", params: [{ to, data }, tag] });
  const lote = [
    call("oraculo", ORACULO_MTBILL, SEL.latestRoundData),
    call("supply", CONTRATO_MTBILL, SEL.totalSupply),
    call("paused", BOVEDA_INMEDIATA, SEL.paused),
    call("limite", BOVEDA_INMEDIATA, SEL.instantDailyLimit),
    call("fee", BOVEDA_INMEDIATA, SEL.instantFee),
    call("minimo", BOVEDA_INMEDIATA, SEL.minAmount),
    call("usdcSuperstate", USDC, SEL.balanceOf + dirArg(SUPERSTATE_REDEMPTION)),
  ];
  const r2 = await pedir(RPC, cuerpo(lote));
  const base = { grupo: "midas", id: "rpc-oraculo-y-boveda", url: RPC, ...r2, hora: r2.hora };
  if (r2.http !== 200) return { ...base, estado: "CAÍDA", detalle: r2.error || `HTTP ${r2.http}` };
  const res = Object.fromEntries(JSON.parse(r2.buf.toString()).map((x) => [x.id, x.result]));
  if (Object.values(res).some((v) => !v || v === "0x")) return { ...base, estado: "CAMBIADA", detalle: "alguna llamada no devolvió datos" };
  const valor = Number(pal(res.oraculo, 1)) / 1e8;
  const ronda = pal(res.oraculo, 0);
  const actualizado = new Date(Number(pal(res.oraculo, 3)) * 1000).toISOString().replace(/\.\d+Z$/, "Z");
  const bloqueUtc = new Date(Number(BigInt(bloque.timestamp)) * 1000).toISOString().replace(/\.\d+Z$/, "Z");
  const detalle = [
    `bloque ${Number(BigInt(tag))} (${bloqueUtc})`,
    `oráculo ronda ${ronda}: ${valor} USD del ${actualizado}`,
    `circulante en Ethereum ${(Number(pal(res.supply, 0)) / 1e18).toFixed(0)} mTBILL`,
    `bóveda inmediata ${pal(res.paused, 0) === 0n ? "sin pausar" : "PAUSADA"}`,
    `límite diario ${Number(pal(res.limite, 0)) / 1e18} mTBILL`,
    `comisión inmediata ${pal(res.fee, 0)} pb`,
    `mínimo ${Number(pal(res.minimo, 0)) / 1e18} mTBILL`,
    `USDC en Superstate ${(Number(pal(res.usdcSuperstate, 0)) / 1e6).toFixed(0)} (capacidad inmediata de momento, no garantizada)`,
  ].join("; ");
  return { ...base, estado: "VIVA", detalle, dato: "Oráculo mTBILL/USD, circulante y bóveda de reembolso inmediato" };
}

// Spiko eurUSTBL: totalSupply() y decimals() en cuatro redes (nodos públicos de publicnode.com). Suma = acciones de la clase EUR.
async function comprobarCadenaSpiko() {
  const partes = await Promise.all(EURUSTBL.map(async (x) => {
    const lote = [
      { jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: x.contrato, data: SEL.totalSupply }, "latest"] },
      { jsonrpc: "2.0", id: 2, method: "eth_call", params: [{ to: x.contrato, data: SEL.decimals }, "latest"] },
      { jsonrpc: "2.0", id: 3, method: "eth_blockNumber", params: [] },
    ];
    const r = await pedir(x.rpc, cuerpo(lote));
    try {
      const res = Object.fromEntries(JSON.parse(r.buf.toString()).map((y) => [y.id, y.result]));
      const dec = Number(BigInt(res[2]));
      return { ...x, r, fichas: Number(BigInt(res[1])) / 10 ** dec, bloque: Number(BigInt(res[3])) };
    } catch (e) { return { ...x, r, error: r.error || `HTTP ${r.http}` }; }
  }));
  const fallo = partes.find((p) => p.error);
  const total = partes.reduce((s, p) => s + (p.fichas || 0), 0);
  const buf = Buffer.from(JSON.stringify(partes.map(({ r, ...p }) => p)));
  const base = { grupo: "spiko-letras", id: "rpc-eurUSTBL-4-redes", url: EURUSTBL.map((x) => x.rpc).join(" "), hora: partes[0].r.hora,
    http: fallo ? fallo.r.http : 200, bytes: buf.length, sha: sha256(buf), buf, dato: "totalSupply de eurUSTBL en Ethereum, Polygon, Base y Arbitrum" };
  if (fallo) return { ...base, estado: "CAÍDA", detalle: `${fallo.red}: ${fallo.error}` };
  const detalle = partes.map((p) => `${p.red} ${p.fichas} (bloque ${p.bloque})`).join("; ") + `; total ${total} (el 11/11: 5000+5000+0+0 = 10000)`;
  return { ...base, estado: "VIVA", detalle };
}

// ---------- Ejecución ----------
const inicio = Date.now();
const lista = RUTAS.filter((r) => !SOLO || r.grupo === SOLO);
const tareas = lista.map(comprobarRuta);
if (!SOLO || SOLO === "midas") tareas.unshift(comprobarCadena());
if (!SOLO || SOLO === "spiko-letras") tareas.push(comprobarCadenaSpiko());
const resultados = await Promise.all(tareas);

const marca = ahora().replace(/[:]/g, "");
const dirSalida = join(AQUI, "crudo", "comprobar-rutas", marca);
mkdirSync(dirSalida, { recursive: true });
const sumas = [];
for (const r of resultados) {
  if (GUARDAR && r.bytes) { writeFileSync(join(dirSalida, r.id + ".bin"), r.buf); sumas.push(`${r.sha}  ${r.id}.bin  ${r.hora}`); }
}
if (sumas.length) writeFileSync(join(dirSalida, "SHA256SUMS.txt"), sumas.join("\n") + "\n");
const resumen = resultados.map(({ buf, json, texto, marcas, ...r }) => r);
writeFileSync(join(dirSalida, "resumen.json"), JSON.stringify({ hora: ahora(), resultados: resumen }, null, 2));

const vivas = resultados.filter((r) => !r.control && r.estado.startsWith("VIVA")).length;
const total = resultados.filter((r) => !r.control).length;
console.log(`Comprobación de rutas · ${ahora()} · ${((Date.now() - inicio) / 1000).toFixed(1)} s · vivas ${vivas}/${total}\n`);
for (const r of resultados) {
  console.log(`[${r.estado}] ${r.grupo}/${r.id}  HTTP ${r.http}  ${r.bytes} B  sha256 ${r.sha ? r.sha.slice(0, 16) + "…" : "-"}  ${r.hora}`);
  if (r.detalle) console.log(`    ${r.detalle}`);
}
console.log(`\nResumen: ${join(dirSalida, "resumen.json")}${GUARDAR ? " (con respuestas en bruto y SHA256SUMS.txt)" : ""}`);
process.exit(vivas === total ? 0 : 1);

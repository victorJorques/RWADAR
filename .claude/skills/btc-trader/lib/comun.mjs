// Utilidades comunes de «BTC en papel»: intervalos, estado en disco,
// configuración, formatos en español y números aleatorios reproducibles.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Carpeta de la skill (…/.claude/skills/btc-trader). */
export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Duración de cada intervalo en milisegundos. */
export const INTERVALOS = Object.freeze({
  '1m': 60_000,
  '5m': 300_000,
  '15m': 900_000,
  '1h': 3_600_000,
  '4h': 14_400_000,
  '1d': 86_400_000,
});

export const AVISO = 'Herramienta educativa en papel. No es asesoramiento financiero. ' +
  'Simular no garantiza resultados: la mayoría de quienes hacen trading intradía pierden dinero.';

/** Milisegundos de un intervalo ('5m' → 300000). Error claro si no existe. */
export function msIntervalo(intervalo) {
  const ms = INTERVALOS[intervalo];
  if (!ms) {
    throw new Error(`Intervalo desconocido: «${intervalo}». Los que hay: ${Object.keys(INTERVALOS).join(', ')}.`);
  }
  return ms;
}

// ---------------------------------------------------------------- estado

/** Carpeta del estado (BTC_TRADER_ESTADO o estado/ dentro de la skill). La crea si falta. */
export function dirEstado() {
  const dir = process.env.BTC_TRADER_ESTADO
    ? path.resolve(process.env.BTC_TRADER_ESTADO)
    : path.join(RAIZ, 'estado');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// 'papel' y 'papel.json' valen igual; se admiten subcarpetas ('cache/x') pero no salir de estado/.
function rutaEstado(nombre) {
  if (typeof nombre !== 'string' || !nombre.trim()) {
    throw new Error('Falta el nombre del archivo de estado.');
  }
  const base = dirEstado();
  const archivo = nombre.endsWith('.json') ? nombre : `${nombre}.json`;
  const ruta = path.resolve(base, archivo);
  if (ruta !== base && !ruta.startsWith(base + path.sep)) {
    throw new Error(`El nombre de estado «${nombre}» se sale de la carpeta de estado.`);
  }
  return ruta;
}

/**
 * Lee estado/<nombre>.json. Si no existe devuelve `defecto`. Si está roto,
 * guarda una copia en <nombre>.roto.json (para no perder lo que hubiera) y
 * devuelve `defecto`.
 */
export function leerEstado(nombre, defecto = null) {
  const ruta = rutaEstado(nombre);
  let texto;
  try {
    texto = fs.readFileSync(ruta, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') return defecto;
    throw new Error(`No se pudo leer ${ruta}: ${e.message}`);
  }
  try {
    return JSON.parse(texto);
  } catch {
    try { fs.copyFileSync(ruta, ruta.replace(/\.json$/, '.roto.json')); } catch { /* sin copia, seguimos */ }
    return defecto;
  }
}

/** Escribe estado/<nombre>.json de forma atómica (archivo temporal + renombrar). Devuelve la ruta. */
export function escribirEstado(nombre, datos) {
  const ruta = rutaEstado(nombre);
  escribirJsonAtomico(ruta, datos);
  return ruta;
}

/** Escritura atómica: o queda el archivo viejo o el nuevo entero, nunca uno a medias. */
export function escribirJsonAtomico(ruta, datos, { compacto = false } = {}) {
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  const tmp = `${ruta}.${process.pid}.${Date.now()}.tmp`;
  const texto = compacto ? JSON.stringify(datos) : JSON.stringify(datos, null, 2) + '\n';
  fs.writeFileSync(tmp, texto);
  fs.renameSync(tmp, ruta);
}

// ---------------------------------------------------------------- config

const esObjeto = x => x !== null && typeof x === 'object' && !Array.isArray(x);

/** Fusión en profundidad: los objetos se mezclan; arrays y valores sueltos de `encima` sustituyen. */
export function fusionar(base, encima) {
  if (!esObjeto(base) || !esObjeto(encima)) return encima === undefined ? clonar(base) : clonar(encima);
  const salida = clonar(base);
  for (const [clave, valor] of Object.entries(encima)) {
    if (valor === undefined) continue;
    salida[clave] = esObjeto(valor) && esObjeto(salida[clave]) ? fusionar(salida[clave], valor) : clonar(valor);
  }
  return salida;
}

const clonar = x => (x === undefined ? undefined : structuredClone(x));

/**
 * Configuración efectiva: config.ejemplo.json fusionado con estado/config.json.
 * Si estado/config.json no existe, lo crea copiando el ejemplo (salvo
 * `{ escribir: false }`, pensado para pruebas). `cargarConfig(false)` también vale.
 */
export function cargarConfig(opciones = {}) {
  const { escribir = true } = typeof opciones === 'boolean' ? { escribir: opciones } : (opciones ?? {});
  const rutaEjemplo = path.join(RAIZ, 'config.ejemplo.json');
  let ejemplo;
  try {
    ejemplo = JSON.parse(fs.readFileSync(rutaEjemplo, 'utf8'));
  } catch (e) {
    throw new Error(`No se pudo leer la configuración de partida (${rutaEjemplo}): ${e.message}`);
  }
  const rutaPropia = path.join(dirEstado(), 'config.json');
  let propia = {};
  if (fs.existsSync(rutaPropia)) {
    // Una config rota no se ignora en silencio: puede llevar límites de riesgo a propósito.
    try {
      propia = JSON.parse(fs.readFileSync(rutaPropia, 'utf8'));
    } catch (e) {
      throw new Error(`${rutaPropia} no es JSON válido (${e.message}). Arréglalo o bórralo para volver a la copia de partida.`);
    }
    if (!esObjeto(propia)) {
      throw new Error(`${rutaPropia} debe ser un objeto JSON ({ … }).`);
    }
  } else if (escribir) {
    escribirJsonAtomico(rutaPropia, ejemplo);
  }
  return fusionar(ejemplo, propia);
}

// ---------------------------------------------------------------- formatos

// Intl pone espacios duros (U+00A0/U+202F); se cambian por espacios normales
// para que la salida coincida con el texto («61.027,86 €») y se pueda buscar.
const espacios = s => s.replace(/[  ]/g, ' ');
const SIN_DATO = '—';
const formateadores = new Map();
function formateador(clave, crear) {
  if (!formateadores.has(clave)) formateadores.set(clave, crear());
  return formateadores.get(clave);
}

/** 61027.86 → '61.027,86 €'. Siempre con punto de miles (también en 5.000,00 €). */
export function fmtDinero(n, moneda = 'EUR') {
  if (!Number.isFinite(n)) return SIN_DATO;
  const f = formateador(`dinero:${moneda}`, () => new Intl.NumberFormat('es-ES', {
    style: 'currency', currency: moneda, useGrouping: 'always',
  }));
  return espacios(f.format(n));
}

/** 0.00123456 → '0,00123456 BTC' (8 decimales: satoshis). */
export function fmtBtc(n) {
  if (!Number.isFinite(n)) return SIN_DATO;
  const f = formateador('btc', () => new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 8, maximumFractionDigits: 8, useGrouping: 'always',
  }));
  return `${espacios(f.format(n))} BTC`;
}

/** 9 → '9,00 %' (el número ya va en tanto por ciento). Con { signo: true }: '+9,00 %'. */
export function fmtPct(n, dec = 2, { signo = false } = {}) {
  if (!Number.isFinite(n)) return SIN_DATO;
  const d = Number.isInteger(dec) && dec >= 0 && dec <= 20 ? dec : 2;
  const f = formateador(`pct:${d}:${signo}`, () => new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always',
    signDisplay: signo ? 'exceptZero' : 'auto',
  }));
  return `${espacios(f.format(n))} %`;
}

function partesMadrid(ms) {
  const f = formateador('madrid', () => new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }));
  const p = {};
  for (const { type, value } of f.formatToParts(ms)) p[type] = value;
  return p;
}

const fechaValida = ms => (ms instanceof Date ? ms.getTime() : ms);

/**
 * Hora de Madrid: '14/11/2026 11:20'. Con { utc: true } añade la UTC al lado:
 * '14/11/2026 11:20 (10:20 UTC)'.
 */
export function fmtHora(ms, { utc = false } = {}) {
  const t = fechaValida(ms);
  if (!Number.isFinite(t)) return SIN_DATO;
  const p = partesMadrid(t);
  const texto = `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
  if (!utc) return texto;
  const d = new Date(t);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${texto} (${hh}:${mm} UTC)`;
}

/** Día natural en Madrid, 'AAAA-MM-DD' (respeta los cambios de hora). */
export function diaMadrid(ms) {
  const t = fechaValida(ms);
  if (!Number.isFinite(t)) throw new Error(`diaMadrid: la fecha no es válida (${ms}).`);
  const p = partesMadrid(t);
  return `${p.year}-${p.month}-${p.day}`;
}

// ---------------------------------------------------------------- números

/** Generador reproducible mulberry32: prng(19)() → número en [0, 1). */
export function prng(semilla) {
  if (typeof semilla !== 'number' || !Number.isFinite(semilla)) {
    throw new Error(`prng: la semilla debe ser un número entero (llegó ${String(semilla)}).`);
  }
  let a = Math.trunc(semilla) >>> 0;
  return function aleatorio() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Redondea hacia abajo a un múltiplo de `paso` (0.123456789, 1e-8 → 0.12345678). */
export function redondearAbajo(x, paso) {
  if (!(typeof paso === 'number' && Number.isFinite(paso) && paso > 0)) {
    throw new Error(`redondearAbajo: el paso debe ser un número positivo (llegó ${String(paso)}).`);
  }
  if (!Number.isFinite(x)) return NaN;
  // El margen relativo evita que 0.29/0.01 = 28.999… acabe en 0.28.
  const k = Math.floor(x / paso + 1e-9);
  const decimales = paso < 1 ? Math.min(20, Math.ceil(-Math.log10(paso)) + 2) : 0;
  const r = Number((k * paso).toFixed(decimales));
  return Object.is(r, -0) ? 0 : r;
}

/** Mediana de los números válidos; null si no hay ninguno. */
export function mediana(valores) {
  const v = (Array.isArray(valores) ? valores : []).filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

/** Pausa (promesa). */
export const esperar = ms => new Promise(resolver => setTimeout(resolver, Math.max(0, ms || 0)));

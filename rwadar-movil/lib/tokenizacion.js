'use strict';
/* ---------------------------------------------------------------------
   «La tokenización en el mundo» (10/11/2026)
   ---------------------------------------------------------------------
   Un solo motor para la web, la app, el servidor web (_worker.js, donde
   rwadar-acceso/compilar.cjs lo copia tal cual) y la foto diaria
   (rwadar-app/tokenizacion/foto-diaria.mjs). Sin dependencias, sin red y
   sin Intl (Hermes): recibe datos y devuelve datos.

   Datos: GET https://api.coingecko.com/api/v3/coins/categories (gratis,
   sin clave). El total es la categoría «tokenized-products» (Tokenized
   Assets) y los tipos, ocho categorías de CoinGecko que pueden solaparse.
   No se usan «real-world-assets-rwa» ni «rwa-protocol»: incluyen tokens de
   gobierno de protocolos, que no representan activos reales.

   Ninguna cifra se inventa. El cambio en 24 h es el que da CoinGecko; el de
   7 días, 30 días, 1 año y el total se calcula SOLO con fotos diarias
   guardadas por RWAdar. Si no hay una foto a ±2 días de la fecha buscada,
   ese periodo sale «aún sin datos», con la fecha desde la que se guardan.
   --------------------------------------------------------------------- */
const FUENTE = Object.freeze({ nombre: 'CoinGecko', url: 'https://www.coingecko.com/',
  api: 'https://api.coingecko.com/api/v3/coins/categories' });
const TOTAL = Object.freeze({ id: 'tokenized-products', nombre: 'Activos tokenizados' });
const TIPOS = Object.freeze([
  Object.freeze({ clave: 'credito-privado', id: 'tokenized-private-credit', nombre: 'Crédito privado' }),
  Object.freeze({ clave: 'letras-tesoro', id: 'tokenized-treasuries', nombre: 'Letras del Tesoro' }),
  Object.freeze({ clave: 'materias-primas', id: 'tokenized-commodities', nombre: 'Materias primas' }),
  Object.freeze({ clave: 'acciones', id: 'tokenized-stock', nombre: 'Acciones' }),
  Object.freeze({ clave: 'fondos-monetarios', id: 'tokenized-money-market-fund-mmfs', nombre: 'Fondos monetarios' }),
  Object.freeze({ clave: 'otros-creditos', id: 'tokenized-credit', nombre: 'Otros créditos' }),
  Object.freeze({ clave: 'etf', id: 'tokenized-exchange-traded-funds-etfs', nombre: 'ETF' }),
  Object.freeze({ clave: 'inmuebles', id: 'real-estate', nombre: 'Inmuebles' }),
]);
// El oro va dentro de «Materias primas»: se enseña como «de ello, oro».
const ORO = Object.freeze({ clave: 'oro', id: 'tokenized-gold', nombre: 'Oro' });
const PERIODOS = Object.freeze([
  Object.freeze({ clave: '24h', dias: 1, nombre: '24 h' }),
  Object.freeze({ clave: '7d', dias: 7, nombre: '7 días' }),
  Object.freeze({ clave: '30d', dias: 30, nombre: '30 días' }),
  Object.freeze({ clave: '1a', dias: 365, nombre: '1 año' }),
  // «Histórico» (y no «Total»): no se confunde con el valor total de encima.
  Object.freeze({ clave: 'total', dias: null, nombre: 'Histórico' }),
]);
const MARGEN_DIAS = 2;
const MAX_FOTOS = 5000;
const MAX_SERIE = 400;
const DIA_MS = 86400000;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
// Un valor de mercado creíble para una categoría: más de 0 $ y menos de 100 billones.
const VALOR_MAX = 1e14;

function exigir(ok, mensaje) { if (!ok) throw new Error(mensaje); }
function esObjeto(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
function msFecha(fecha) {
  if (typeof fecha !== 'string' || !FECHA.test(fecha)) return null;
  const ms = Date.parse(fecha + 'T00:00:00Z');
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === fecha ? ms : null;
}
function fechaDe(ms) { return new Date(ms).toISOString().slice(0, 10); }
function redondear(n, decimales) { const f = 10 ** decimales; return Math.round(n * f) / f; }

/* Un dato {valor, cambio24h}: valor en dólares (entero) y cambio en % o null. */
function dato(valor, cambio) {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0 || valor >= VALOR_MAX) return null;
  const c = typeof cambio === 'number' && Number.isFinite(cambio) && cambio > -100 && cambio < 10000 ? redondear(cambio, 4) : null;
  return { valor: Math.round(valor), cambio24h: c };
}
function validarDato(d, donde) {
  exigir(esObjeto(d) && Object.keys(d).sort().join() === 'cambio24h,valor', donde + ': forma no válida');
  exigir(Number.isInteger(d.valor) && d.valor > 0 && d.valor < VALOR_MAX, donde + ': valor no válido');
  exigir(d.cambio24h === null || (typeof d.cambio24h === 'number' && Number.isFinite(d.cambio24h) && d.cambio24h > -100 && d.cambio24h < 10000),
    donde + ': cambio no válido');
  return { valor: d.valor, cambio24h: d.cambio24h };
}

/* De la lista de categorías de CoinGecko a una foto. Lanza si falta el total
   o si la respuesta no tiene la forma esperada; un tipo que falte se omite. */
function extraerFoto(lista, { ahora = Date.now(), maxAntiguedadHoras = 48 } = {}) {
  exigir(Array.isArray(lista) && lista.length > 0 && lista.length <= 20000, 'CoinGecko: la respuesta no es una lista de categorías');
  const porId = new Map();
  for (const c of lista) if (esObjeto(c) && typeof c.id === 'string' && !porId.has(c.id)) porId.set(c.id, c);
  const total = porId.get(TOTAL.id);
  exigir(total, 'CoinGecko: falta la categoría ' + TOTAL.id);
  const totalDato = dato(total.market_cap, total.market_cap_change_24h);
  exigir(totalDato, 'CoinGecko: el valor total no es un número válido');
  const actualizado = typeof total.updated_at === 'string' ? Date.parse(total.updated_at) : NaN;
  exigir(Number.isFinite(actualizado), 'CoinGecko: falta la hora del dato (updated_at)');
  exigir(actualizado <= ahora + 10 * 60000, 'CoinGecko: la hora del dato está en el futuro');
  exigir(ahora - actualizado <= maxAntiguedadHoras * 3600000, 'CoinGecko: el dato tiene más de ' + maxAntiguedadHoras + ' h');
  const tipos = {};
  for (const t of TIPOS) {
    const c = porId.get(t.id);
    const d = c ? dato(c.market_cap, c.market_cap_change_24h) : null;
    if (d) tipos[t.clave] = d;
  }
  const oroC = porId.get(ORO.id);
  const oro = oroC ? dato(oroC.market_cap, oroC.market_cap_change_24h) : null;
  const iso = new Date(actualizado).toISOString();
  return validarFoto({ fecha: iso.slice(0, 10), actualizado: iso, total: totalDato, tipos, oro });
}

function validarFoto(f) {
  exigir(esObjeto(f) && Object.keys(f).sort().join() === 'actualizado,fecha,oro,tipos,total', 'foto: forma no válida');
  exigir(msFecha(f.fecha) !== null, 'foto: fecha no válida');
  exigir(typeof f.actualizado === 'string' && ISO.test(f.actualizado) && Number.isFinite(Date.parse(f.actualizado)) &&
    f.actualizado.slice(0, 10) === f.fecha, 'foto ' + f.fecha + ': hora del dato no válida');
  const total = validarDato(f.total, 'foto ' + f.fecha + ' total');
  exigir(esObjeto(f.tipos), 'foto ' + f.fecha + ': tipos no válidos');
  const claves = TIPOS.map(t => t.clave);
  const tipos = {};
  for (const [clave, d] of Object.entries(f.tipos)) {
    exigir(claves.includes(clave), 'foto ' + f.fecha + ': tipo desconocido ' + clave);
    tipos[clave] = validarDato(d, 'foto ' + f.fecha + ' ' + clave);
  }
  const oro = f.oro === null ? null : validarDato(f.oro, 'foto ' + f.fecha + ' oro');
  return { fecha: f.fecha, actualizado: f.actualizado, total, tipos, oro };
}

function historicoVacio() { return { version: 1, fuente: FUENTE.nombre, fotos: [] }; }

/* El archivo tokenizacion-historico.json, entero y ordenado por fecha. */
function validarHistorico(h) {
  exigir(esObjeto(h) && Object.keys(h).sort().join() === 'fotos,fuente,version', 'histórico: forma no válida');
  exigir(h.version === 1 && h.fuente === FUENTE.nombre, 'histórico: versión o fuente no válidas');
  exigir(Array.isArray(h.fotos) && h.fotos.length <= MAX_FOTOS, 'histórico: fotos no válidas');
  const fotos = h.fotos.map(validarFoto);
  for (let i = 1; i < fotos.length; i++) exigir(fotos[i - 1].fecha < fotos[i].fecha, 'histórico: fechas desordenadas o repetidas');
  return { version: 1, fuente: FUENTE.nombre, fotos };
}

/* Añade la foto de su día. Si ya hay una foto de ese día, no cambia nada. */
function anadirFoto(historico, foto) {
  const h = validarHistorico(historico), f = validarFoto(foto);
  if (h.fotos.some(x => x.fecha === f.fecha)) return { historico: h, anadida: false };
  exigir(h.fotos.length < MAX_FOTOS, 'histórico: demasiadas fotos');
  const fotos = [...h.fotos, f].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  return { historico: { version: 1, fuente: FUENTE.nombre, fotos }, anadida: true };
}

/* Una foto por línea: el archivo crece una línea al día y su historia en Git se lee bien. */
function serializarHistorico(historico) {
  const h = validarHistorico(historico);
  return '{"version":1,"fuente":' + JSON.stringify(h.fuente) + ',"fotos":[' +
    (h.fotos.length ? '\n' + h.fotos.map(f => JSON.stringify(f)).join(',\n') + '\n' : '') + ']}\n';
}

function cambioPct(ahora, antes) { return redondear((ahora / antes - 1) * 100, 4); }

/* La foto más cercana a «dias» antes de base, a ±2 días; solo fotos de días anteriores. */
function fotoReferencia(fotos, base, dias) {
  const msBase = msFecha(base.fecha), objetivo = msBase - dias * DIA_MS;
  let mejor = null, distancia = Infinity;
  for (const f of fotos) {
    const ms = msFecha(f.fecha);
    if (ms >= msBase) continue;
    const d = Math.abs(ms - objetivo);
    if (d <= MARGEN_DIAS * DIA_MS && d < distancia) { mejor = f; distancia = d; }
  }
  return mejor;
}

/* Lo que devuelve /api/tokenizacion. actual: la foto de CoinGecko de ahora
   (o null si no se pudo leer); fuente: 'coingecko' o 'foto-guardada'. */
function resumir({ historico, actual = null, fuente = actual ? 'coingecko' : 'foto-guardada' } = {}) {
  let fotos = [];
  try { fotos = validarHistorico(historico || historicoVacio()).fotos; } catch { fotos = []; }
  let base = null;
  try { base = actual ? validarFoto(actual) : null; } catch { base = null; }
  const ultima = fotos.length ? fotos[fotos.length - 1] : null;
  if (base) fuente = fuente === 'foto-guardada' ? 'foto-guardada' : 'coingecko';
  else { base = ultima; fuente = 'foto-guardada'; }
  // Sin dato en vivo, la foto guardada más reciente de las dos.
  if (base && fuente === 'foto-guardada' && ultima && ultima.actualizado > base.actualizado) base = ultima;
  const guardadoDesde = fotos.length ? fotos[0].fecha : null;
  const comun = { version: 1, atribucion: { nombre: FUENTE.nombre, url: FUENTE.url }, guardadoDesde, margenDias: MARGEN_DIAS };
  if (!base) {
    return { ...comun, fuente: 'sin-datos', fecha: null, actualizado: null, total: null, tipos: [], oro: null,
      periodos: PERIODOS.map(p => ({ clave: p.clave, nombre: p.nombre, cambio: null, desde: null, estado: 'sin-datos' })), serie: [] };
  }
  const periodos = PERIODOS.map(p => {
    if (p.clave === '24h') {
      return { clave: p.clave, nombre: p.nombre, cambio: base.total.cambio24h, desde: null,
        estado: base.total.cambio24h === null ? 'sin-datos' : 'ok' };
    }
    const ref = p.dias === null ? fotos.find(f => f.fecha < base.fecha) || null : fotoReferencia(fotos, base, p.dias);
    return ref ? { clave: p.clave, nombre: p.nombre, cambio: cambioPct(base.total.valor, ref.total.valor), desde: ref.fecha, estado: 'ok' }
      : { clave: p.clave, nombre: p.nombre, cambio: null, desde: null, estado: 'sin-datos' };
  });
  const tipos = TIPOS.filter(t => base.tipos[t.clave]).map(t => ({ clave: t.clave, nombre: t.nombre,
    valor: base.tipos[t.clave].valor, cambio24h: base.tipos[t.clave].cambio24h,
    cuota: redondear(base.tipos[t.clave].valor / base.total.valor * 100, 2) }))
    .sort((a, b) => b.valor - a.valor);
  const materias = base.tipos['materias-primas'];
  const oro = base.oro ? { ...base.oro, cuotaMateriasPrimas: materias ? redondear(base.oro.valor / materias.valor * 100, 2) : null } : null;
  const porFecha = new Map(fotos.map(f => [f.fecha, f.total.valor]));
  porFecha.set(base.fecha, base.total.valor);
  const serie = [...porFecha].filter(([fecha]) => fecha <= base.fecha).sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-MAX_SERIE).map(([fecha, valor]) => ({ fecha, valor }));
  return { ...comun, fuente, fecha: base.fecha, actualizado: base.actualizado, total: base.total, tipos, oro, periodos, serie };
}

/* Lo que la web y la app aceptan de /api/tokenizacion antes de pintar nada. */
function resumenValido(d) {
  const finito = v => typeof v === 'number' && Number.isFinite(v);
  const pct = v => v === null || finito(v);
  if (!esObjeto(d) || d.version !== 1 || !['coingecko', 'foto-guardada', 'sin-datos'].includes(d.fuente)) return false;
  if (!Array.isArray(d.periodos) || d.periodos.length !== PERIODOS.length || !Array.isArray(d.tipos) || !Array.isArray(d.serie)) return false;
  if (!d.periodos.every((p, i) => esObjeto(p) && p.clave === PERIODOS[i].clave && typeof p.nombre === 'string' &&
    ['ok', 'sin-datos'].includes(p.estado) && pct(p.cambio) && (p.desde === null || msFecha(p.desde) !== null))) return false;
  if (d.fuente === 'sin-datos') return true;
  return esObjeto(d.total) && finito(d.total.valor) && d.total.valor > 0 && pct(d.total.cambio24h) && msFecha(d.fecha) !== null &&
    typeof d.actualizado === 'string' && ISO.test(d.actualizado) && (d.guardadoDesde === null || msFecha(d.guardadoDesde) !== null) &&
    d.tipos.length <= TIPOS.length && d.tipos.every(t => esObjeto(t) && typeof t.clave === 'string' && typeof t.nombre === 'string' &&
      finito(t.valor) && t.valor > 0 && finito(t.cuota) && pct(t.cambio24h)) &&
    (d.oro === null || (esObjeto(d.oro) && finito(d.oro.valor))) &&
    d.serie.length <= MAX_SERIE && d.serie.every(p => esObjeto(p) && msFecha(p.fecha) !== null && finito(p.valor));
}

/* ---- Formato (es: «49.684 M$», «+1,2 %»; en: «$49,684M», «+1.2%») ---- */
function miles(entero, separador) { return String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, separador); }
function numero(n, decimales, idioma) {
  const fijo = Math.abs(n).toFixed(decimales);
  const [entero, fraccion] = fijo.split('.');
  const en = idioma === 'en';
  return miles(entero, en ? ',' : '.') + (fraccion ? (en ? '.' : ',') + fraccion : '');
}
function millones(valor, idioma = 'es') {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return '—';
  const m = valor / 1e6, decimales = m >= 100 ? 0 : 1;
  return idioma === 'en' ? '$' + numero(m, decimales, 'en') + 'M' : numero(m, decimales, 'es') + ' M$';
}
/* Para lectores de pantalla: «49.684 millones de dólares», no «M dólar». */
function millonesHablados(valor, idioma = 'es') {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return '—';
  const m = valor / 1e6, decimales = m >= 100 ? 0 : 1;
  return idioma === 'en' ? numero(m, decimales, 'en') + ' million dollars' : numero(m, decimales, 'es') + ' millones de dólares';
}
function direccion(p) {
  if (typeof p !== 'number' || !Number.isFinite(p)) return 'sin-datos';
  if (Math.abs(p) < 0.05) return 'igual';
  return p > 0 ? 'sube' : 'baja';
}
function porcentaje(p, idioma = 'es') {
  const d = direccion(p);
  if (d === 'sin-datos') return '—';
  const signo = d === 'sube' ? '+' : d === 'baja' ? '−' : '';
  const cifra = numero(d === 'igual' ? 0 : p, Math.abs(p) >= 100 ? 0 : 1, idioma);
  return signo + cifra + (idioma === 'en' ? '%' : ' %');
}
function cuota(p, idioma = 'es') {
  if (typeof p !== 'number' || !Number.isFinite(p)) return '—';
  return (p > 0 && p < 0.1 ? (idioma === 'en' ? '<0.1' : '<0,1') : numero(p, 1, idioma)) + (idioma === 'en' ? '%' : ' %');
}
/* Fechas: «10/11/2026» en castellano; en inglés, «10 Nov 2026», que no se
   confunde con el 11 de octubre al otro lado del Atlántico. */
const MESES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fechaCorta(fecha, idioma = 'es') {
  if (msFecha(fecha) === null) return '—';
  if (idioma === 'en') return Number(fecha.slice(8, 10)) + ' ' + MESES_EN[Number(fecha.slice(5, 7)) - 1] + ' ' + fecha.slice(0, 4);
  return fecha.slice(8, 10) + '/' + fecha.slice(5, 7) + '/' + fecha.slice(0, 4);
}
/* «15/11» (o «15 Nov»); con el año solo si no es el de «referencia». */
function fechaBreve(fecha, idioma = 'es', referencia = null) {
  if (msFecha(fecha) === null) return '—';
  const mismoAnio = typeof referencia === 'string' && referencia.slice(0, 4) === fecha.slice(0, 4);
  if (!mismoAnio) return fechaCorta(fecha, idioma);
  return idioma === 'en' ? Number(fecha.slice(8, 10)) + ' ' + MESES_EN[Number(fecha.slice(5, 7)) - 1]
    : fecha.slice(8, 10) + '/' + fecha.slice(5, 7);
}
function horaDato(iso, idioma = 'es') {
  if (typeof iso !== 'string' || !ISO.test(iso)) return '—';
  return fechaCorta(iso.slice(0, 10), idioma) + ', ' + iso.slice(11, 16) + ' UTC';
}

/* El primer día en que un periodo puede tener dato, si se guarda una foto
   cada día desde «guardadoDesde»: el total, al día siguiente; 7 días, 30
   días y 1 año, en cuanto haya una foto a ±2 días de la fecha buscada. Si
   esa fecha ya pasó (faltan fotos), null: se dice «aún sin datos». */
function fechaLlegada(guardadoDesde, clavePeriodo, hoy) {
  const desde = msFecha(guardadoDesde), p = PERIODOS.find(x => x.clave === clavePeriodo);
  if (desde === null || !p || p.clave === '24h') return null;
  const llega = fechaDe(desde + (p.dias === null ? 1 : Math.max(1, p.dias - MARGEN_DIAS)) * DIA_MS);
  return msFecha(hoy) !== null && llega <= hoy ? null : llega;
}

/* Los textos de la línea de evolución, ya en el idioma elegido: la nota
   visible bajo el dibujo (la escala en cifras) y su etiqueta accesible. */
function textosLinea(serie, idioma = 'es') {
  if (!Array.isArray(serie) || serie.length < 2) return null;
  const a = serie[0], b = serie[serie.length - 1];
  const v0 = millones(a.valor, idioma), v1 = millones(b.valor, idioma);
  const f0 = fechaCorta(a.fecha, idioma), f1 = fechaCorta(b.fecha, idioma);
  const cambio = porcentaje(cambioPct(b.valor, a.valor), idioma);
  return idioma === 'en'
    ? { nota: `From ${v0} (${f0}) to ${v1} (${f1}) · ${cambio}`, etiqueta: `Total value from ${f0} to ${f1}: from ${v0} to ${v1}, ${cambio}, ${serie.length} daily snapshots` }
    : { nota: `De ${v0} (${f0}) a ${v1} (${f1}) · ${cambio}`, etiqueta: `Valor total del ${f0} al ${f1}: de ${v0} a ${v1}, ${cambio}, ${serie.length} fotos diarias` };
}

/* La escala vertical de la línea de evolución. El eje no empieza en cero ni
   se estira de la foto más baja a la más alta: abarca como poco un 4 % del
   valor, así que un cambio del 0,3 % se ve casi plano y no como un desplome.
   Devuelve la «y» de cada valor en un dibujo de alto «alto» con margen «m». */
function alturasLinea(valores, alto, m) {
  const v = valores.filter(n => typeof n === 'number' && Number.isFinite(n));
  if (!v.length) return [];
  const min = Math.min(...v), max = Math.max(...v);
  const rango = Math.max(max - min, Math.abs(max) * 0.04) || 1, lo = (min + max) / 2 - rango / 2;
  return v.map(n => alto - m - ((n - lo) / rango) * (alto - 2 * m));
}

/* La tarjeta compacta de Inicio (rediseño del 10/11/2026): el total, su
   cambio en 24 h y una sola barra apilada con los 3 tipos mayores y «Otros»
   (el resto del total, que incluye los demás tipos). Las cuotas salen del
   mismo resumen que /mercado/; aquí no se calcula ninguna cifra nueva salvo
   el resto. Devuelve null sin datos. */
const COLORES_COMPACTO = Object.freeze(['#25E39A', '#32C9F5', '#F2B23C', '#6E6A64']);
function resumenCompacto(d, cuantos = 3) {
  if (!resumenValido(d) || d.fuente === 'sin-datos' || !d.total) return null;
  const mayores = d.tipos.slice().sort((a, b) => b.valor - a.valor).slice(0, cuantos);
  const sumaCuota = mayores.reduce((s, t) => s + t.cuota, 0);
  const sumaValor = mayores.reduce((s, t) => s + t.valor, 0);
  const segmentos = mayores.map((t, i) => ({ clave: t.clave, nombre: t.nombre, valor: t.valor, cuota: t.cuota, color: COLORES_COMPACTO[i] }));
  const resto = redondear(Math.max(0, 100 - sumaCuota), 2);
  if (resto > 0) segmentos.push({ clave: 'otros', nombre: 'Otros', valor: Math.max(0, d.total.valor - sumaValor), cuota: resto, color: COLORES_COMPACTO[3] });
  return { fuente: d.fuente, fecha: d.fecha, actualizado: d.actualizado, total: d.total.valor, cambio24h: d.total.cambio24h, segmentos };
}

module.exports = { FUENTE, TOTAL, TIPOS, ORO, PERIODOS, MARGEN_DIAS, historicoVacio, extraerFoto, validarFoto, validarHistorico,
  anadirFoto, serializarHistorico, resumir, resumenValido, millones, porcentaje, cuota, direccion, fechaCorta, fechaBreve, horaDato, fechaDe,
  fechaLlegada, alturasLinea, textosLinea, millonesHablados, cambioPct, resumenCompacto, COLORES_COMPACTO };

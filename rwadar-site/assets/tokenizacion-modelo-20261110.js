(function () { 'use strict'; const module={exports:{}};
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

   Ninguna cifra se inventa. El cambio en 24 h es el que da CoinGecko (solo
   si es creíble: menos de un ±25 %; el 11/11/2026 su categoría daba +124 %
   con el mercado plano); el de 7 días, 30 días, 1 año y el total se calcula
   SOLO con fotos diarias guardadas por RWAdar. Si no hay una foto a ±2 días de la fecha buscada,
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
// Un cambio en 24 h de más del ±25 % en todo un mercado es un fallo de la
// categoría de CoinGecko, no del mercado (el 11/11/2026 daba +124 % cuando la
// foto guardada y la serie se movían un 0,1 %): no se guarda ni se enseña.
const CAMBIO_24H_MAX = 25;

function exigir(ok, mensaje) { if (!ok) throw new Error(mensaje); }
function esObjeto(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
function msFecha(fecha) {
  if (typeof fecha !== 'string' || !FECHA.test(fecha)) return null;
  const ms = Date.parse(fecha + 'T00:00:00Z');
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === fecha ? ms : null;
}
function fechaDe(ms) { return new Date(ms).toISOString().slice(0, 10); }
function redondear(n, decimales) { const f = 10 ** decimales; return Math.round(n * f) / f; }

/* El cambio en 24 h si es creíble (|x| < 25 %); si no, null. */
function cambio24hCreible(c) {
  return typeof c === 'number' && Number.isFinite(c) && Math.abs(c) < CAMBIO_24H_MAX ? c : null;
}
/* Un dato {valor, cambio24h}: valor en dólares (entero) y cambio en % o null.
   Un cambio no creíble se guarda como null (la foto diaria tampoco lo guarda);
   validarDato acepta el formato histórico, pero normaliza los cambios anómalos a null. */
function dato(valor, cambio) {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0 || valor >= VALOR_MAX) return null;
  const creible = cambio24hCreible(cambio);
  return { valor: Math.round(valor), cambio24h: creible === null ? null : redondear(creible, 4) };
}
function validarDato(d, donde) {
  exigir(esObjeto(d) && Object.keys(d).sort().join() === 'cambio24h,valor', donde + ': forma no válida');
  exigir(Number.isInteger(d.valor) && d.valor > 0 && d.valor < VALOR_MAX, donde + ': valor no válido');
  exigir(d.cambio24h === null || (typeof d.cambio24h === 'number' && Number.isFinite(d.cambio24h) && d.cambio24h > -100 && d.cambio24h < 10000),
    donde + ': cambio no válido');
  return { valor: d.valor, cambio24h: cambio24hCreible(d.cambio24h) };
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
  // Una lectura retrasada nunca desplaza una observación guardada más reciente.
  if (base && ultima && ultima.actualizado > base.actualizado) { base = ultima; fuente = 'foto-guardada'; }
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
// El primero no es el verde de «sube» (#25E39A): junto a cifras verdes y rojas,
// una barra verde parecía una subida (revisión de diseño del 11/11/2026).
const COLORES_COMPACTO = Object.freeze(['#A78BFA', '#32C9F5', '#F2B23C', '#6E6A64']);
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
/* El color de un tipo en las barras de /mercado/: el mismo que su tramo de la
   barra apilada de Inicio (los 3 mayores) y el gris de «Otros» para el resto,
   para que se reconozcan de una pantalla a otra (revisión del 10/11/2026). */
function colorTipo(d, clave, cuantos = 3) {
  const r = resumenCompacto(d, cuantos);
  const i = r ? r.segmentos.findIndex((s) => s.clave === clave && s.clave !== 'otros') : -1;
  return i >= 0 ? COLORES_COMPACTO[i] : COLORES_COMPACTO[3];
}

/* =====================================================================
   La serie del mercado «estilo bolsa» (11/11/2026)
   ---------------------------------------------------------------------
   CoinGecko no da la historia de la categoría «tokenized-products», así que
   se reconstruye con datos reales: la suma diaria del valor de mercado de
   los mayores tokens de hoy con historia completa en CoinGecko (de los 40
   mayores de la categoría; el 11/11/2026 entraban 29), con un año y un día
   de «market_caps» diarias de cada uno (/coins/{id}/market_chart, gratis).
   - Para cada token y día vale el último dato conocido como mucho 3 días
     atrás. Antes de su primer dato, el token cuenta 0 (aún no existía o
     CoinGecko no lo seguía): entra en la suma el día en que empieza.
   - Si un token que ya cotizaba no tiene dato en esos 3 días, ese día se
     queda fuera de la serie: ni se inventa el valor ni se pinta un hundimiento
     que no ha ocurrido.
   - A algunos tokens CoinGecko les faltan semanas enteras (o dejó de dar su
     historia antes de hoy). Si a un token le faltan más de 3 días así, queda
     fuera de toda la serie, y la nota del gráfico dice cuántos entran
     (comprobado con los datos del 11/11/2026: sin esta regla, la serie se
     cortaba en julio; con 7 días de margen, el mes de octubre salía con 7
     días sin pintar por dos tokens de 0,1 % del total cada uno).
   La genera rwadar-app/tokenizacion/serie-diaria.mjs (flujo «Foto diaria de
   la tokenización») y la publica rwadar-publicar.js en
   /datos/tokenizacion-serie.json. La web y la app la leen de ahí.
   La cuota («cobertura») se mide sobre el total de la categoría de
   /coins/categories, el mismo de la cabecera y de los tipos (QA del
   11/11/2026: antes era la suma de la primera página de /coins/markets, que
   viene cortada a 250 tokens). La cifra grande de /mercado/, de Inicio y de
   la app es el último punto de la serie (cifraGrande): así cuadra con la
   línea, la cruz, el cambio, el máximo y el mínimo.
   ===================================================================== */
const SERIE = Object.freeze({ mayores: 40, huecoMaxDias: 3, maxDiasSinDato: 3, dias: 365, maxPuntos: 400, minIncluidos: 25,
  categoria: TOTAL.id,
  apiMercados: 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=tokenized-products&order=market_cap_desc&per_page=250' });
const ID_TOKEN = /^[a-z0-9][a-z0-9-]{0,99}$/;
// days=365, no 366: la API pública de CoinGecko (sin clave) solo da los
// últimos 365 días y a days=366 responde 401 a cada token (error 10012,
// comprobado el 11/11/2026 a las 15:04 UTC): con 366 la serie diaria se
// quedaba sin un solo token y el flujo dejaba de rehacerla. Con 365, el
// primer día es el de hace 364 y «1 A» abarca esos 365 días.
function urlHistoria(id) {
  exigir(typeof id === 'string' && ID_TOKEN.test(id), 'id de token no válido');
  return 'https://api.coingecko.com/api/v3/coins/' + id + '/market_chart?vs_currency=usd&days=' + SERIE.dias + '&interval=daily';
}
const valorCreible = v => typeof v === 'number' && Number.isFinite(v) && v > 0 && v < VALOR_MAX;

/* De /coins/markets a los «n» mayores de hoy y su cuota del total. El total
   es el de la categoría (/coins/categories, «totalCategoria»), el mismo que
   enseñan la cabecera y los tipos; si no llega o es menor que la suma de la
   lista (las dos lecturas no son del mismo instante), la suma de la lista. */
function elegirMayores(lista, n = SERIE.mayores, totalCategoria = null) {
  exigir(Array.isArray(lista) && lista.length > 0 && lista.length <= 1000, 'CoinGecko: la lista de tokens no es válida');
  const vistos = new Set(), validos = [];
  for (const t of lista) {
    if (!esObjeto(t) || typeof t.id !== 'string' || !ID_TOKEN.test(t.id) || vistos.has(t.id) || !valorCreible(t.market_cap)) continue;
    vistos.add(t.id); validos.push({ id: t.id, valor: t.market_cap });
  }
  exigir(validos.length >= Math.min(n, SERIE.minIncluidos), 'CoinGecko: la lista trae muy pocos tokens con valor');
  validos.sort((a, b) => b.valor - a.valor);
  const suma = validos.reduce((s, t) => s + t.valor, 0);
  const total = valorCreible(totalCategoria) ? Math.max(totalCategoria, suma) : suma;
  const mayores = validos.slice(0, n);
  return { mayores, total: Math.round(total), cobertura: redondear(mayores.reduce((s, t) => s + t.valor, 0) / total * 100, 1) };
}

/* De «market_caps» ([[ms, valor], …]) a { primera, dias: Map(fecha → valor) }:
   el último dato válido de cada día UTC. Lanza si la forma no es la esperada. */
function historiaToken(caps) {
  exigir(Array.isArray(caps) && caps.length <= 5000, 'CoinGecko: market_caps no es una lista');
  const dias = new Map();
  for (const p of caps) {
    exigir(Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && Number.isFinite(p[0]), 'CoinGecko: punto de market_caps no válido');
    if (!valorCreible(p[1])) continue;
    dias.set(fechaDe(p[0]), p[1]);
  }
  const fechas = [...dias.keys()].sort();
  return { primera: fechas[0] || null, dias };
}

/* Los días del año que acaba en «hasta» en que un token ya cotizaba y no
   tiene dato en los 3 días anteriores (se usan para dejarlo fuera). */
function diasSinDato(h, hasta, dias = SERIE.dias) {
  const fin = msFecha(hasta);
  if (fin === null || !h || h.primera === null) return 0;
  let n = 0;
  for (let ms = Math.max(fin - dias * DIA_MS, msFecha(h.primera)); ms <= fin; ms += DIA_MS) {
    let hay = false;
    for (let k = 0; k <= SERIE.huecoMaxDias && !hay; k++) hay = h.dias.has(fechaDe(ms - k * DIA_MS));
    if (!hay) n++;
  }
  return n;
}

/* La serie: un punto por día del año que acaba en «hasta» (incluido). */
function construirSerie(historias, hasta, dias = SERIE.dias) {
  const fin = msFecha(hasta);
  exigir(fin !== null, 'serie: fecha final no válida');
  exigir(Array.isArray(historias) && historias.length > 0, 'serie: sin historias');
  const puntos = [];
  for (let ms = fin - dias * DIA_MS; ms <= fin; ms += DIA_MS) {
    const fecha = fechaDe(ms);
    let suma = 0, n = 0, completo = true;
    for (const h of historias) {
      let v = null;
      for (let k = 0; k <= SERIE.huecoMaxDias && v === null; k++) v = h.dias.get(fechaDe(ms - k * DIA_MS)) ?? null;
      if (v !== null) { suma += v; n++; }
      else if (h.primera !== null && h.primera <= fecha) { completo = false; break; }
    }
    if (completo && n > 0) puntos.push({ fecha, valor: Math.round(suma), tokens: n });
  }
  return puntos;
}

/* Las series finas ya validadas y unidas a su diaria (unirSerieFina): de
   cada una, el «generado» de su diaria. Solo esas viajan dentro de la serie
   como «fina»; el archivo publicado de la diaria nunca la lleva. */
const FINAS = new WeakMap();
function validarSerie(s) {
  const fina = esObjeto(s) && esObjeto(s.fina) && FINAS.get(s.fina) === s.generado ? s.fina : null;
  exigir(esObjeto(s) && Object.keys(s).filter(k => !(fina && k === 'fina')).sort().join() === 'categoria,cobertura,discontinuos,fuente,generado,incluidos,pedidos,puntos,tokens,version',
    'serie: forma no válida');
  exigir(s.version === 1 && s.fuente === FUENTE.nombre && s.categoria === SERIE.categoria, 'serie: versión, fuente o categoría no válidas');
  exigir(typeof s.generado === 'string' && ISO.test(s.generado) && Number.isFinite(Date.parse(s.generado)), 'serie: hora no válida');
  exigir(Number.isInteger(s.pedidos) && s.pedidos > 0 && s.pedidos <= 250, 'serie: pedidos no válido');
  exigir(Number.isInteger(s.incluidos) && s.incluidos >= 1 && s.incluidos <= s.pedidos, 'serie: incluidos no válido');
  exigir(Number.isInteger(s.discontinuos) && s.discontinuos >= 0 && s.incluidos + s.discontinuos <= s.pedidos, 'serie: discontinuos no válido');
  exigir(typeof s.cobertura === 'number' && Number.isFinite(s.cobertura) && s.cobertura > 0 && s.cobertura <= 100, 'serie: cobertura no válida');
  exigir(Array.isArray(s.tokens) && s.tokens.length === s.incluidos && s.tokens.every(t => typeof t === 'string' && ID_TOKEN.test(t)) &&
    new Set(s.tokens).size === s.tokens.length, 'serie: tokens no válidos');
  exigir(Array.isArray(s.puntos) && s.puntos.length <= SERIE.maxPuntos, 'serie: puntos no válidos');
  const puntos = s.puntos.map(p => {
    exigir(esObjeto(p) && Object.keys(p).sort().join() === 'fecha,tokens,valor' && msFecha(p.fecha) !== null &&
      Number.isInteger(p.valor) && valorCreible(p.valor) && Number.isInteger(p.tokens) && p.tokens >= 1 && p.tokens <= s.incluidos,
      'serie: punto no válido');
    return { fecha: p.fecha, valor: p.valor, tokens: p.tokens };
  });
  for (let i = 1; i < puntos.length; i++) exigir(puntos[i - 1].fecha < puntos[i].fecha, 'serie: fechas desordenadas o repetidas');
  exigir(!puntos.length || puntos[puntos.length - 1].fecha <= s.generado.slice(0, 10), 'serie: punto posterior a su hora');
  const r = { version: 1, fuente: FUENTE.nombre, categoria: SERIE.categoria, generado: s.generado, pedidos: s.pedidos, incluidos: s.incluidos,
    discontinuos: s.discontinuos, cobertura: s.cobertura, tokens: s.tokens.slice(), puntos };
  if (fina) r.fina = fina;
  return r;
}
/* Un punto por línea: la historia del archivo en Git se lee bien. Sin la
   «fina»: el archivo de la diaria es siempre el de la versión 1. */
function serializarSerie(serie) {
  const s = validarSerie(serie);
  const { puntos, fina, ...cab } = s;
  return JSON.stringify(cab).slice(0, -1) + ',"puntos":[' + (puntos.length ? '\n' + puntos.map(p => JSON.stringify(p)).join(',\n') + '\n' : '') + ']}\n';
}
/* Lo que la web y la app aceptan de /datos/tokenizacion-serie.json. */
function serieValida(s) { try { validarSerie(s); return true; } catch { return false; } }

/* =====================================================================
   Las series finas (13/11/2026): más detalle en el tiempo
   ---------------------------------------------------------------------
   Con los mismos tokens que la diaria, el flujo guarda dos series más finas
   en /datos/tokenizacion-serie-fina.json (un archivo aparte: la app ya
   instalada y la web en caché siguen leyendo la diaria de siempre, cuya
   forma no cambia):
   - «5m»: un punto cada 5 minutos de las últimas 24 horas (pestaña 24 h);
   - «1h»: un punto cada hora de los últimos 30 días (1 S y 1 M).
   3 M, 6 M, el año y 1 A siguen con la diaria: CoinGecko gratis da cada hora
   hasta 90 días y 3 M son 91; guardar 90 días triplicaría el archivo (que
   leen Inicio y la app) para ninguna pestaña.
   Cómo se suma cada instante (cada token trae sus propias marcas de hora):
   1. El tiempo se parte en cubos de 5 minutos o de 1 hora en UTC. De cada
      token vale su último dato dentro del cubo; si no tiene, su último dato
      anterior («arrastre»): como mucho de 24 horas antes en la de 5 minutos
      (288 cubos) y de 72 horas en la horaria (72 cubos: los mismos 3 días que
      arrastra la diaria). CoinGecko no da datos de todos los tokens a todas
      horas: el 13/11/2026, el mayor (figure-heloc, más de la mitad de la
      suma) no tenía datos de 3 a 5 horas cada mañana (UTC) ni de 23 o 24
      horas cada domingo; con media hora de margen, la serie se quedaba sin la
      mitad del mercado o no salía ningún día. En la horaria, 24 horas no
      bastan: en su historia diaria faltan 72 horas en cada puente con lunes
      festivo en EE. UU. (19/01, 16/02, 25/05 y 07/09/2026), y un hueco así
      dejaba la horaria fuera 30 días seguidos (1 S y 1 M volvían a la
      diaria).
   2. Si a un token le falta más (o no se pudo leer), queda fuera de ESA
      serie entera: ni se inventa ni se pinta un hundimiento. La serie dice
      cuáles («fuera») y cuánto suman en su último dato («valorFuera»). Si
      pesan más del 1 % (FUERA_MAX_PCT), esa serie no se guarda ese día.
   3. Los que pasan más de una hora sin dato en la ventana van en «largos»:
      la nota lo dice con sus nombres.
   4. Antes de su primer dato, un token que CoinGecko empezó a seguir el
      primer día de la ventana o después cuenta 0, como en la diaria.
   Si una serie fina no se guarda, sus pestañas usan la siguiente (24 h, la
   horaria; 1 S y 1 M, la diaria; 24 h sin ninguna fina sale desactivada).
   Las tres acaban en el último dato de cada token (el de su lectura más
   reciente): sin tokens fuera, el último punto de cada fina es exactamente
   el de la diaria (la cifra grande); con tokens fuera, es la cifra grande
   menos «valorFuera», y la nota y el aviso del gráfico lo dicen. La fina se
   une a su diaria por «generado» (la misma ejecución del flujo); si no
   casan, el gráfico usa la diaria. La genera
   rwadar-app/tokenizacion/serie-diaria.mjs con --fina.
   ===================================================================== */
const MIN_MS = 60000, HORA_MS = 3600000;
const LARGO_MS = HORA_MS;
const FUERA_MAX_PCT = 1;
const RESOLUCIONES = Object.freeze({
  '5m': Object.freeze({ clave: '5m', pasoMs: 5 * MIN_MS, ventanaMs: DIA_MS, arrastre: DIA_MS / (5 * MIN_MS), maxPuntos: 300, diasApi: 1 }),
  '1h': Object.freeze({ clave: '1h', pasoMs: HORA_MS, ventanaMs: 30 * DIA_MS, arrastre: SERIE.huecoMaxDias * DIA_MS / HORA_MS, maxPuntos: 800, diasApi: 31 }),
});
// De la más fina a la menos: la primera que cubre una pestaña es la suya.
const ORDEN_FINAS = Object.freeze(['5m', '1h']);
const ISO_MINUTO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})Z$/;
function isoMinuto(ms) { return new Date(ms).toISOString().slice(0, 16) + 'Z'; }
/* «2026-11-13T09:25Z» → ms, o null si no es una hora UTC exacta y válida. */
function msMinuto(iso) {
  const m = typeof iso === 'string' ? ISO_MINUTO.exec(iso) : null;
  if (!m) return null;
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  return Number.isFinite(ms) && isoMinuto(ms) === iso ? ms : null;
}

/* La hora de España peninsular sin Intl (Hermes no lo trae entero): UTC+1
   en invierno y UTC+2 en verano, del último domingo de marzo al último de
   octubre, a la 01:00 UTC (la regla de la UE). { fecha: 'AAAA-MM-DD', hora: 'HH:MM' }. */
function ultimoDomingoUTC(anio, mes) {
  const ultimoDia = new Date(Date.UTC(anio, mes + 1, 0));
  return Date.UTC(anio, mes, ultimoDia.getUTCDate() - ultimoDia.getUTCDay(), 1);
}
function horaEspana(ms) {
  const anio = new Date(ms).getUTCFullYear();
  const verano = ms >= ultimoDomingoUTC(anio, 2) && ms < ultimoDomingoUTC(anio, 9);
  const iso = new Date(ms + (verano ? 2 : 1) * HORA_MS).toISOString();
  return { fecha: iso.slice(0, 10), hora: iso.slice(11, 16) };
}

/* Sin «interval»: con days=1 CoinGecko da un punto cada 5 minutos y de 2 a 90
   días, uno cada hora (comprobado el 13/11/2026 sin clave: 289 y 745 puntos,
   en punto, más el de ese momento). 31 días y no 30: así sobra para que los
   30 días de la pestaña 1 M salgan enteros aunque las lecturas tarden. */
function urlHistoriaFina(id, clave) {
  const r = RESOLUCIONES[clave];
  exigir(r, 'serie fina: resolución no válida');
  exigir(typeof id === 'string' && ID_TOKEN.test(id), 'id de token no válido');
  return 'https://api.coingecko.com/api/v3/coins/' + id + '/market_chart?vs_currency=usd&days=' + r.diasApi;
}
/* De «market_caps» ([[ms, valor], …]) a los datos válidos en orden de hora.
   Lanza si la forma no es la esperada. */
function observacionesToken(caps) {
  exigir(Array.isArray(caps) && caps.length <= 5000, 'CoinGecko: market_caps no es una lista');
  const obs = [];
  for (const p of caps) {
    exigir(Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && Number.isFinite(p[0]), 'CoinGecko: punto de market_caps no válido');
    if (valorCreible(p[1])) obs.push([p[0], p[1]]);
  }
  return obs.sort((a, b) => a[0] - b[0]);
}

/* Una serie fina. entradas: una por token, en el orden de la diaria:
   { id, obs: [[ms, valor], …] en orden de hora (los de la lectura fina, con
     el último dato del token al final y, delante, los de sus otras lecturas
     anteriores al primero de la fina, para poder arrastrar al empezar la
     ventana), primera: 'AAAA-MM-DD' (su primer día en la diaria) }
   o, si su lectura fina falló, { id, obs: null, valor } (su último valor:
   queda fuera y cuenta en «valorFuera»). La ventana acaba en el cubo del
   dato más reciente y empieza «ventanaMs» antes. Devuelve
   { puntos: [['AAAA-MM-DDTHH:MMZ', valor, tokens], …], fuera, valorFuera,
     largos, arrastre } o lanza si no sale (pocos puntos o los de fuera pesan
   más del 1 %). */
function construirSerieFina(entradas, clave) {
  const r = RESOLUCIONES[clave];
  exigir(r, 'serie fina: resolución no válida');
  exigir(Array.isArray(entradas) && entradas.length > 0 && entradas.length <= 250, 'serie fina: sin tokens');
  const tokens = entradas.map((e, i) => {
    exigir(esObjeto(e) && typeof e.id === 'string' && ID_TOKEN.test(e.id), 'serie fina: el token ' + (i + 1) + ' no es válido');
    if (e.obs === null) {
      exigir(valorCreible(e.valor), 'serie fina: el token ' + e.id + ' no tiene valor');
      return { id: e.id, datos: null, valor: e.valor, fuera: true };
    }
    exigir(Array.isArray(e.obs) && e.obs.length > 0, 'serie fina: el token ' + e.id + ' no tiene datos');
    // En orden de hora: el último dato de cada cubo pisa a los anteriores.
    const cubos = new Map();
    let antes = -Infinity;
    for (const p of e.obs) {
      exigir(Array.isArray(p) && Number.isFinite(p[0]) && p[0] >= antes && valorCreible(p[1]), 'serie fina: datos del token ' + e.id + ' no válidos');
      antes = p[0];
      cubos.set(Math.floor(p[0] / r.pasoMs) * r.pasoMs, p[1]);
    }
    const datos = [...cubos];
    return { id: e.id, datos, primero: datos[0][0], ultimo: datos[datos.length - 1][0], valor: datos[datos.length - 1][1],
      primera: msFecha(e.primera), fuera: false };
  });
  const conDatos = tokens.filter(t => t.datos);
  exigir(conDatos.length > 0, 'serie fina ' + clave + ': ningún token con datos');
  const hasta = Math.max(...conDatos.map(t => t.ultimo)), desde = hasta - r.ventanaMs;
  const primerDia = msFecha(fechaDe(desde)), margen = r.arrastre * r.pasoMs;
  // De cada token, cubo a cubo, la edad del dato que vale (el del cubo o el
  // anterior más cercano): si en algún cubo pasa del margen, queda fuera.
  for (const t of conDatos) {
    t.nuevo = t.primera !== null && t.primera >= primerDia;
    const inicio = t.nuevo ? Math.max(desde, t.primero) : desde;
    let j = -1, edadMax = 0;
    for (let b = desde; b <= hasta; b += r.pasoMs) {
      while (j + 1 < t.datos.length && t.datos[j + 1][0] <= b) j++;
      if (b < inicio) continue;
      edadMax = Math.max(edadMax, j < 0 ? Infinity : b - t.datos[j][0]);
    }
    t.fuera = edadMax > margen;
    t.largo = !t.fuera && edadMax > LARGO_MS;
  }
  const dentro = tokens.filter(t => !t.fuera);
  exigir(dentro.length > 0, 'serie fina ' + clave + ': todos los tokens quedan fuera');
  const puntos = [], indice = dentro.map(() => -1);
  for (let b = desde; b <= hasta; b += r.pasoMs) {
    let suma = 0, n = 0;
    dentro.forEach((t, k) => {
      while (indice[k] + 1 < t.datos.length && t.datos[indice[k] + 1][0] <= b) indice[k]++;
      if (indice[k] < 0 || (t.nuevo && b < t.primero)) return;
      suma += t.datos[indice[k]][1]; n++;
    });
    if (n > 0) puntos.push([isoMinuto(b), Math.round(suma), n]);
  }
  const fuera = tokens.filter(t => t.fuera), valorFuera = Math.round(fuera.reduce((s, t) => s + t.valor, 0));
  exigir(puntos.length >= 2, 'serie fina ' + clave + ': menos de dos puntos');
  const ultimo = puntos[puntos.length - 1][1], pct = redondear(valorFuera / (ultimo + valorFuera) * 100, 2);
  exigir(pct <= FUERA_MAX_PCT, 'serie fina ' + clave + ': los que quedan fuera (' + fuera.map(t => t.id).join(', ') + ') pesan el ' + pct + ' % (como mucho ' + FUERA_MAX_PCT + ' %)');
  return { puntos, fuera: fuera.map(t => t.id), valorFuera, largos: dentro.filter(t => t.largo).map(t => t.id), arrastre: r.arrastre };
}

/* El archivo tokenizacion-serie-fina.json, entero. Una serie puede ser null
   (ese día no se pudo hacer); las dos null es «sin serie fina» (la semilla
   de main y lo que publica la web si la de la rama no casa con la diaria).
   Cada serie: { paso (s), arrastre (cubos), fuera, valorFuera, largos,
   puntos }, con un punto por cubo, seguidos y sin huecos. */
function listaTokens(lista, tokens, donde) {
  exigir(Array.isArray(lista) && lista.every(t => typeof t === 'string' && tokens.includes(t)) && new Set(lista).size === lista.length, donde);
  return lista.slice();
}
function validarSerieFina(f) {
  exigir(esObjeto(f) && Object.keys(f).sort().join() === 'categoria,fuente,generado,series,tokens,version', 'serie fina: forma no válida');
  exigir(f.version === 1 && f.fuente === FUENTE.nombre && f.categoria === SERIE.categoria, 'serie fina: versión, fuente o categoría no válidas');
  exigir(typeof f.generado === 'string' && ISO.test(f.generado) && Number.isFinite(Date.parse(f.generado)), 'serie fina: hora no válida');
  exigir(Array.isArray(f.tokens) && f.tokens.length >= 1 && f.tokens.length <= 250 && f.tokens.every(t => typeof t === 'string' && ID_TOKEN.test(t)) &&
    new Set(f.tokens).size === f.tokens.length, 'serie fina: tokens no válidos');
  exigir(esObjeto(f.series) && Object.keys(f.series).sort().join() === '1h,5m', 'serie fina: series no válidas');
  const generadoMs = Date.parse(f.generado), series = {};
  for (const clave of ORDEN_FINAS) {
    const x = f.series[clave], r = RESOLUCIONES[clave], donde = 'serie fina ' + clave;
    if (x === null) { series[clave] = null; continue; }
    exigir(esObjeto(x) && Object.keys(x).sort().join() === 'arrastre,fuera,largos,paso,puntos,valorFuera' && x.paso === r.pasoMs / 1000 &&
      Number.isInteger(x.arrastre) && x.arrastre >= 0 && x.arrastre <= r.arrastre, donde + ': forma no válida');
    const fuera = listaTokens(x.fuera, f.tokens, donde + ': tokens fuera no válidos');
    const largos = listaTokens(x.largos, f.tokens, donde + ': tokens sin dato no válidos');
    exigir(fuera.length < f.tokens.length && !largos.some(t => fuera.includes(t)), donde + ': tokens fuera no válidos');
    exigir(Number.isInteger(x.valorFuera) && x.valorFuera >= 0 && x.valorFuera < VALOR_MAX && (x.valorFuera === 0) === (fuera.length === 0),
      donde + ': valor de los de fuera no válido');
    exigir(Array.isArray(x.puntos) && x.puntos.length >= 2 && x.puntos.length <= r.maxPuntos, donde + ': puntos no válidos');
    const dentro = f.tokens.length - fuera.length;
    let antes = null;
    const puntos = x.puntos.map(p => {
      const ms = Array.isArray(p) && p.length === 3 ? msMinuto(p[0]) : null;
      // Un punto por cubo, seguidos: cada uno, justo un paso después del anterior.
      exigir(ms !== null && ms % r.pasoMs === 0 && (antes === null || ms === antes + r.pasoMs) && Number.isInteger(p[1]) && valorCreible(p[1]) &&
        Number.isInteger(p[2]) && p[2] >= 1 && p[2] <= dentro, donde + ': punto no válido');
      antes = ms;
      return [p[0], p[1], p[2]];
    });
    const ultimo = puntos[puntos.length - 1];
    exigir(antes - msMinuto(puntos[0][0]) <= r.ventanaMs, donde + ': abarca más de lo previsto');
    exigir(ultimo[2] === dentro, donde + ': el último punto no suma todos los tokens de dentro');
    exigir(x.valorFuera / (ultimo[1] + x.valorFuera) * 100 <= FUERA_MAX_PCT + 0.005, donde + ': los de fuera pesan más del ' + FUERA_MAX_PCT + ' %');
    exigir(antes <= generadoMs && generadoMs - antes <= 2 * HORA_MS, donde + ': su último punto no es de cuando se generó');
    series[clave] = { paso: x.paso, arrastre: x.arrastre, fuera, valorFuera: x.valorFuera, largos, puntos };
  }
  return { version: 1, fuente: FUENTE.nombre, categoria: SERIE.categoria, generado: f.generado, tokens: f.tokens.slice(), series };
}
/* Un punto por línea, como la diaria. */
function serializarSerieFina(fina) {
  const f = validarSerieFina(fina);
  const serie = clave => {
    const x = f.series[clave];
    return x ? '{"paso":' + x.paso + ',"arrastre":' + x.arrastre + ',"fuera":' + JSON.stringify(x.fuera) + ',"valorFuera":' + x.valorFuera +
      ',"largos":' + JSON.stringify(x.largos) + ',"puntos":[\n' + x.puntos.map(p => JSON.stringify(p)).join(',\n') + '\n]}' : 'null';
  };
  return '{"version":1,"fuente":' + JSON.stringify(f.fuente) + ',"categoria":' + JSON.stringify(f.categoria) + ',"generado":' + JSON.stringify(f.generado) +
    ',"tokens":' + JSON.stringify(f.tokens) + ',"series":{"5m":' + serie('5m') + ',"1h":' + serie('1h') + '}}\n';
}
function serieFinaValida(f) { try { validarSerieFina(f); return true; } catch { return false; } }
/* «Sin serie fina» para una diaria: lo que publica la web si no hay una que case. */
function serieFinaVacia(diaria) {
  const s = validarSerie(diaria);
  return { version: 1, fuente: FUENTE.nombre, categoria: SERIE.categoria, generado: s.generado, tokens: s.tokens.slice(), series: { '5m': null, '1h': null } };
}
/* Las series de «fina» que valen para la diaria «diaria»: de la misma
   ejecución («generado»), con los mismos tokens y cuyo último punto, más lo
   que suman los de fuera, es el de la diaria (con un 0,1 % de margen, y del
   mismo día o del anterior). { '5m': …, '1h': … } solo con las que valen. */
function seriesEnlazadas(diaria, fina) {
  let s, f;
  try { s = validarSerie(diaria); f = validarSerieFina(fina); } catch { return {}; }
  const u = s.puntos[s.puntos.length - 1], salida = {};
  if (!u || f.generado !== s.generado || f.tokens.length !== s.tokens.length || !f.tokens.every(t => s.tokens.includes(t))) return salida;
  for (const clave of ORDEN_FINAS) {
    const x = f.series[clave];
    const ult = x ? x.puntos[x.puntos.length - 1] : null;
    const dias = ult ? (msFecha(u.fecha) - msFecha(ult[0].slice(0, 10))) / DIA_MS : NaN;
    if (ult && (dias === 0 || dias === 1) && Math.abs((ult[1] + x.valorFuera) / u.valor - 1) <= 0.001) salida[clave] = x;
  }
  return salida;
}
/* La serie diaria con sus finas dentro («fina»), lista para graficoPestana,
   cifraGrande, cambio24h y las notas. Si la fina no vale o no casa, la
   diaria sola, igual que antes. null si la diaria no vale. */
function unirSerieFina(diaria, fina) {
  let s;
  try { s = validarSerie(diaria); } catch { return null; }
  const { fina: _anterior, ...sola } = s;
  const validas = seriesEnlazadas(sola, fina), series = {};
  for (const clave of ORDEN_FINAS) {
    const x = validas[clave];
    if (!x) continue;
    series[clave] = Object.freeze({ clave, pasoMs: RESOLUCIONES[clave].pasoMs, arrastre: x.arrastre,
      fuera: Object.freeze(x.fuera.slice()), valorFuera: x.valorFuera, largos: Object.freeze(x.largos.slice()),
      puntos: Object.freeze(x.puntos.map(([t, valor, tokens]) => Object.freeze({ t, ms: msMinuto(t), fecha: t.slice(0, 10), valor, tokens }))) });
  }
  if (!Object.keys(series).length) return sola;
  const unida = Object.freeze({ generado: sola.generado, series: Object.freeze(series) });
  FINAS.set(unida, sola.generado);
  return { ...sola, fina: unida };
}
/* =====================================================================
   El gráfico en directo (14/11/2026): Supabase pide a CoinGecko cada 5
   minutos (migración 35) y el servidor de la web lo sirve en
   /api/tokenizacion/directo. Las series son las mismas que las de
   tokenizacion-serie-fina.json (la misma regla, el mismo validador), pero
   no son de la misma ejecución que la diaria publicada: se unen con
   unirDirecto y no con unirSerieFina. Contrato:
   docs/tareas/MERCADO-DIRECTO-2026-11-14.md.
   ===================================================================== */
const DIRECTO_MAX_MS = 20 * MIN_MS;
const DIRECTO_FUTURO_MS = 5 * MIN_MS;
const COSTURA_MAX = 0.05;
const MAX_SIN_LECTURA = 20;
/* Los cubos sin lectura del directo de una serie: [[desde, hasta], …],
   cada uno alineado a su paso, en orden y sin solaparse. */
function validarSinLectura(lista, r, donde) {
  exigir(Array.isArray(lista) && lista.length <= MAX_SIN_LECTURA, donde);
  let antes = -Infinity;
  return lista.map(x => {
    const a = Array.isArray(x) && x.length === 2 ? msMinuto(x[0]) : null, b = a !== null ? msMinuto(x[1]) : null;
    exigir(a !== null && b !== null && a % r.pasoMs === 0 && b % r.pasoMs === 0 && a <= b && a > antes, donde);
    antes = b;
    return [x[0], x[1]];
  });
}
/* Del documento compacto de la base (rwadar_mercado.directo) al formato de
   tokenizacion-serie-fina.json, validado con validarSerieFina tal cual, más
   los cubos sin lectura y la hora de la diaria que usa la base. Lanza si
   la forma no es exactamente la esperada. */
function directoAFina(doc) {
  exigir(esObjeto(doc) && Object.keys(doc).sort().join() === 'diaria,diariaLeida,generado,series,tokens,v' && doc.v === 1, 'directo: forma no válida');
  exigir(typeof doc.generado === 'string' && ISO.test(doc.generado) && typeof doc.diaria === 'string' && ISO.test(doc.diaria) &&
    (doc.diariaLeida === null || (typeof doc.diariaLeida === 'string' && ISO.test(doc.diariaLeida))), 'directo: horas no válidas');
  exigir(esObjeto(doc.series) && Object.keys(doc.series).sort().join() === '1h,5m', 'directo: series no válidas');
  const series = {}, sinLectura = {};
  for (const clave of ORDEN_FINAS) {
    const x = doc.series[clave], r = RESOLUCIONES[clave], donde = 'directo ' + clave;
    if (x === null) { series[clave] = null; sinLectura[clave] = []; continue; }
    exigir(esObjeto(x) && Object.keys(x).sort().join() === 'arrastre,desde,fuera,largos,n,sinLectura,valorFuera,valores', donde + ': forma no válida');
    const desde = msMinuto(x.desde);
    exigir(desde !== null && desde % r.pasoMs === 0, donde + ': inicio no válido');
    exigir(Array.isArray(x.valores) && x.valores.length >= 2 && x.valores.length <= r.maxPuntos &&
      x.valores.every(v => Number.isInteger(v) && valorCreible(v)), donde + ': valores no válidos');
    exigir(Array.isArray(x.n) && x.n.length >= 1 && x.n.length <= r.maxPuntos && x.n.every(t => Array.isArray(t) && t.length === 2 &&
      Number.isInteger(t[0]) && t[0] >= 1 && Number.isInteger(t[1]) && t[1] >= 1 && t[1] <= 250), donde + ': tramos no válidos');
    exigir(x.n.reduce((s, t) => s + t[0], 0) === x.valores.length, donde + ': los tramos no cuadran con los valores');
    const puntos = [];
    let k = 0;
    for (const [veces, tokens] of x.n) for (let j = 0; j < veces; j++, k++) puntos.push([isoMinuto(desde + k * r.pasoMs), x.valores[k], tokens]);
    series[clave] = { paso: r.pasoMs / 1000, arrastre: x.arrastre, fuera: x.fuera, valorFuera: x.valorFuera, largos: x.largos, puntos };
    sinLectura[clave] = validarSinLectura(x.sinLectura, r, donde + ': cubos sin lectura no válidos');
  }
  const fina = validarSerieFina({ version: 1, fuente: FUENTE.nombre, categoria: SERIE.categoria, generado: doc.generado, tokens: doc.tokens, series });
  return { fina, sinLectura, diaria: doc.diaria, diariaLeida: doc.diariaLeida };
}
/* Lo que sirve /api/tokenizacion/directo: { version: 1, fina, sinLectura }.
   Devuelve { fina, sinLectura } validados o lanza. Sin ninguna serie no hay
   nada que pintar: no vale (revisión del 14/11/2026; así el servidor da 503
   y lo ven la alarma diaria y comprobar-publicado, no un 200 vacío). */
function validarDirecto(r) {
  exigir(esObjeto(r) && Object.keys(r).sort().join() === 'fina,sinLectura,version' && r.version === 1, 'directo: forma no válida');
  const fina = validarSerieFina(r.fina);
  exigir(ORDEN_FINAS.some(c => fina.series[c]), 'directo: sin ninguna serie');
  exigir(esObjeto(r.sinLectura) && Object.keys(r.sinLectura).sort().join() === '1h,5m', 'directo: cubos sin lectura no válidos');
  const sinLectura = {};
  for (const clave of ORDEN_FINAS) {
    sinLectura[clave] = fina.series[clave] ? validarSinLectura(r.sinLectura[clave], RESOLUCIONES[clave], 'directo: cubos sin lectura no válidos') : [];
  }
  return { fina, sinLectura };
}
/* Cuánto tiempo ha pasado desde que llegó una respuesta (revisión del
   14/11/2026): performance.now() de algunos móviles se para mientras el
   aparato duerme, y Date.now() salta si cambia la hora. Vale el mayor de
   los dos (el de Date.now(), solo si no va hacia atrás). */
function transcurridoMs({ perf0, perf1, fecha0, fecha1 }) {
  const p = Number.isFinite(perf0) && Number.isFinite(perf1) ? Math.max(0, perf1 - perf0) : 0;
  const d = Number.isFinite(fecha0) && Number.isFinite(fecha1) && fecha1 - fecha0 >= 0 ? fecha1 - fecha0 : 0;
  return Math.max(p, d);
}
/* La edad del dato en directo con el reloj del servidor (la cabecera Date
   de su respuesta) más lo transcurrido desde que llegó; solo sin Date, con
   el reloj del aparato. Un móvil con la hora mal puesta no lo rechaza. */
function edadDirecto({ generado, fechaServidor = null, transcurrido = 0, ahora = Date.now() }) {
  const g = Date.parse(generado), s = typeof fechaServidor === 'string' ? Date.parse(fechaServidor) : fechaServidor;
  if (!Number.isFinite(g)) return NaN;
  return Number.isFinite(s) ? s - g + Math.max(0, transcurrido || 0) : ahora - g;
}
/* El punto de una serie fina del cubo que contiene «ms», o null. */
function puntoDelCubo(x, clave, ms) {
  if (!x) return null;
  const paso = RESOLUCIONES[clave].pasoMs, c = Math.floor(ms / paso) * paso;
  const primero = msMinuto(x.puntos[0][0]), i = (c - primero) / paso;
  return Number.isInteger(i) && i >= 0 && i < x.puntos.length ? x.puntos[i] : null;
}
/* La diaria publicada con el directo: { serie, motivo } (serie null y el
   motivo si no se puede usar; entonces se usa el archivo publicado).
   1. Las dos valen; si no, 'no_valido'.
   2. Mismos tokens; si no, 'no_casa' (pasa unos minutos tras publicar una
      diaria con otra lista: sin aviso).
   3. El directo no es más viejo que la diaria ('no_casa') y tiene como
      mucho 20 minutos y no más de 5 «del futuro», medidos con edadMs
      (edadDirecto); si no, 'atrasado'.
   4. «ultimo»: el último punto de la más fina más su valorFuera (la suma
      de todos los tokens con su último dato).
   5. Freno del 25 % frente al último punto de la diaria y costura: el
      punto del directo del cubo de «generado» de la diaria (de la de 5
      minutos o, si no lo tiene, de la horaria), más su valorFuera, no se
      separa más de un 5 % del último punto de la diaria (mismo instante y
      mismos tokens: medido, un 0,02-0,03 %). Si no, 'costura'.
   6. «hoy» es el día UTC de ultimo (nunca la hora del aparato). Los días
      de la diaria anteriores a hoy se quedan; si su último punto es de un
      día anterior a hoy, vale como los días que faltan: cada punto de un
      día D pasado es el valor justo antes de las 00:00 UTC de D, el del
      cubo de las 23:00 UTC del día anterior de la horaria del directo (más
      su valorFuera); si la horaria no lo tiene, ese día falta (y el último
      de la diaria se queda como estaba). El punto de hoy es ultimo.
   7. La unida lleva el «generado» del directo, la fina con origen
      'directo', ultimo y los cubos sin lectura de cada serie. */
function unirDirecto(diaria, directo, { edadMs } = {}) {
  const no = motivo => ({ serie: null, motivo });
  let s, d;
  try { s = validarSerie(diaria); d = validarDirecto(directo); } catch { return no('no_valido'); }
  const { fina: _anterior, ...sola } = s;
  const f = d.fina;
  if (f.tokens.length !== sola.tokens.length || !f.tokens.every(t => sola.tokens.includes(t))) return no('no_casa');
  if (Date.parse(f.generado) < Date.parse(sola.generado)) return no('no_casa');
  if (!Number.isFinite(edadMs) || edadMs > DIRECTO_MAX_MS || edadMs < -DIRECTO_FUTURO_MS) return no('atrasado');
  const fina = ORDEN_FINAS.find(c => f.series[c]);
  if (!fina || !sola.puntos.length) return no('no_valido');
  const xf = f.series[fina], u = xf.puntos[xf.puntos.length - 1];
  const ultimo = Object.freeze({ t: u[0], ms: msMinuto(u[0]), fecha: u[0].slice(0, 10), valor: u[1] + xf.valorFuera, tokens: f.tokens.length });
  const uDiaria = sola.puntos[sola.puntos.length - 1];
  if (!(Math.abs(ultimo.valor / uDiaria.valor - 1) < CAMBIO_24H_MAX / 100)) return no('costura');
  const gDiaria = Date.parse(sola.generado);
  const costura = ['5m', '1h'].map(c => [c, puntoDelCubo(f.series[c], c, gDiaria)]).find(([, p]) => p);
  if (!costura || Math.abs((costura[1][1] + f.series[costura[0]].valorFuera) / uDiaria.valor - 1) > COSTURA_MAX) return no('costura');
  // Los días: hoy (UTC) es el de ultimo.
  const hoy = ultimo.fecha, horaria = f.series['1h'];
  const delDia = fecha => {
    const p = puntoDelCubo(horaria, '1h', msFecha(fecha) - HORA_MS);
    return p ? { fecha, valor: p[1] + horaria.valorFuera, tokens: p[2] + horaria.fuera.length } : null;
  };
  const puntos = sola.puntos.filter(p => p.fecha < hoy).map((p, i, todos) => (i === todos.length - 1 && i === sola.puntos.length - 1 ? delDia(p.fecha) || p : p));
  const ultimaFecha = puntos.length ? puntos[puntos.length - 1].fecha : null;
  if (ultimaFecha) {
    for (let ms = msFecha(ultimaFecha) + DIA_MS; ms < msFecha(hoy); ms += DIA_MS) { const p = delDia(fechaDe(ms)); if (p) puntos.push(p); }
  }
  puntos.push({ fecha: hoy, valor: ultimo.valor, tokens: ultimo.tokens });
  const desde = fechaDe(msFecha(hoy) - SERIE.dias * DIA_MS);
  const recortados = puntos.filter(p => p.fecha >= desde).slice(-SERIE.maxPuntos);
  const series = {};
  for (const clave of ORDEN_FINAS) {
    const x = f.series[clave];
    if (!x) continue;
    series[clave] = Object.freeze({ clave, pasoMs: RESOLUCIONES[clave].pasoMs, arrastre: x.arrastre, origen: 'directo',
      fuera: Object.freeze(x.fuera.slice()), valorFuera: x.valorFuera, largos: Object.freeze(x.largos.slice()),
      sinLectura: Object.freeze(d.sinLectura[clave].map(t => Object.freeze(t.slice()))),
      puntos: Object.freeze(x.puntos.map(([t, valor, tokens]) => Object.freeze({ t, ms: msMinuto(t), fecha: t.slice(0, 10), valor, tokens }))) });
  }
  const unida = Object.freeze({ generado: f.generado, origen: 'directo', ultimo, series: Object.freeze(series) });
  FINAS.set(unida, f.generado);
  let serie;
  try { serie = validarSerie({ ...sola, generado: f.generado, puntos: recortados, fina: unida }); } catch { return no('no_valido'); }
  return { serie, motivo: null };
}
/* El motivo de una respuesta de /api/tokenizacion/directo que no es 200.
   Cualquier 404 es «apagado», sin aviso (revisión del 14/11/2026): también
   el {"error":"ruta_no_permitida"} de una web sin la ruta (la OTA antes que
   la web, o una web anterior publicada). comprobar-publicado sigue
   exigiendo directo_apagado. */
const MOTIVOS_DIRECTO = Object.freeze({ directo_apagado: 'apagado', directo_sin_datos: 'sin_datos', directo_no_valido: 'no_valido',
  directo_no_casa: 'no_casa', directo_atrasado: 'atrasado', directo_no_responde: 'no_responde' });
function motivoDirecto(estado, cuerpo) {
  const m = esObjeto(cuerpo) && typeof cuerpo.error === 'string' ? MOTIVOS_DIRECTO[cuerpo.error] : null;
  if (estado === 404) return 'apagado';
  if (estado === 503 && m && m !== 'apagado') return m;
  return 'red';
}
/* El aviso cuando el directo está encendido y no se puede usar: nunca con
   'apagado' (apagado a propósito) ni con 'no_casa' (pasa unos minutos tras
   cada publicación). «serie» es la que se pinta (el archivo publicado). */
function avisoDirecto(motivo, serie, idioma = 'es') {
  if (!motivo || motivo === 'apagado' || motivo === 'no_casa') return '';
  const en = idioma === 'en', fino = ultimoFino(serie);
  const hasta = fino ? fechaCorta(horaEspana(fino.ms).fecha, idioma) + ', ' + horaEspana(fino.ms).hora : null;
  if (en) return 'Live data can’t be used right now: the chart uses the last published copy, ' + (hasta ? `with data up to ${hasta} (Spain time).` : 'day by day.');
  return 'Ahora no se puede usar el dato en directo: el gráfico usa la última copia publicada, ' + (hasta ? `con datos hasta el ${hasta} (hora de España).` : 'día a día.');
}
/* ¿Viene la serie del directo? */
function esDirecto(serie) {
  const f = esObjeto(serie) && esObjeto(serie.fina) && FINAS.get(serie.fina) === serie.generado ? serie.fina : null;
  return !!f && f.origen === 'directo';
}

/* La serie fina «clave» de una serie unida, o null. */
function serieFinaDe(serie, clave) {
  const f = esObjeto(serie) && esObjeto(serie.fina) && FINAS.get(serie.fina) === serie.generado ? serie.fina : null;
  return f ? f.series[clave] || null : null;
}
function ultimoFino(serie) {
  for (const clave of ORDEN_FINAS) { const f = serieFinaDe(serie, clave); if (f) return f.puntos[f.puntos.length - 1]; }
  return null;
}
/* La serie de cada pestaña: la más fina que la cubre entera (su primer punto,
   como mucho dos pasos después del principio de la pestaña): 24 h, la de 5
   minutos; 1 S y 1 M, la horaria; las demás, la diaria. Si una fina falta
   ese día, la siguiente: 24 h sin la de 5 minutos, la horaria (25 puntos);
   1 S y 1 M sin la horaria, la diaria; 24 h solo con la diaria, ninguna
   (serían dos puntos, una raya). { resolucion: '5m' | '1h' | '1d', pasoMs,
   puntos, arrastre, fuera, valorFuera, largos } o null. */
function seriePestana(serie, clave) {
  const p = PESTANAS.find(x => x.clave === clave);
  let s;
  try { s = validarSerie(serie); } catch { return null; }
  if (!p) return null;
  for (const res of ORDEN_FINAS) {
    const f = serieFinaDe(s, res);
    const t = f ? tramo(f.puntos, clave) : null;
    if (t && t[0].ms <= inicioPestana(p, t[t.length - 1].ms) + 2 * f.pasoMs) {
      const r = { resolucion: res, pasoMs: f.pasoMs, puntos: t, arrastre: f.arrastre, fuera: f.fuera, valorFuera: f.valorFuera, largos: f.largos };
      // Del directo: su origen y los ratos sin lectura que caen en la pestaña.
      if (f.origen === 'directo') {
        r.origen = 'directo';
        r.sinLectura = f.sinLectura.filter(([a, b]) => msMinuto(b) >= t[0].ms && msMinuto(a) <= t[t.length - 1].ms);
      }
      return r;
    }
  }
  if (p.soloFina) return null;
  const t = tramo(s.puntos, clave);
  return t ? { resolucion: '1d', pasoMs: DIA_MS, puntos: t, arrastre: SERIE.huecoMaxDias, fuera: [], valorFuera: 0, largos: [] } : null;
}
/* ¿Tiene datos la pestaña? (las que no, salen desactivadas). */
function pestanaDisponible(serie, clave) { return !!seriePestana(serie, clave); }

/* Lo que dice la cruz de un punto. De la diaria, su fecha («08/11/2026»). De
   las finas, en hora de España: en 24 h («5m»), la hora («18:35»); en las
   horarias, el día y la hora («8 nov, 18:00»; en inglés, «8 Nov, 18:00»).
   Con «largo» (lector de pantalla, tabla): «08/11/2026, 18:00 (hora de España)». */
function textoInstante(p, idioma = 'es', resolucion = null, { largo = false } = {}) {
  if (!esObjeto(p) || typeof p.ms !== 'number') return fechaCorta(p?.fecha, idioma);
  const { fecha, hora } = horaEspana(p.ms), en = idioma === 'en';
  if (largo) return fechaCorta(fecha, idioma) + ', ' + hora + (en ? ' (Spain time)' : ' (hora de España)');
  if (resolucion === '5m') return hora;
  return Number(fecha.slice(8, 10)) + ' ' + mesCorto(fecha, idioma) + ', ' + hora;
}
/* Las marcas de abajo de una pestaña fina, en hora de España y 5 como mucho:
   hasta 36 horas, horas en punto («06:00», «12:00», cada 1, 2, 3, 4, 6, 8 o
   12 horas); si no, medianoches («8 nov», cada 1, 2, 3, 5, 7, 10 o 14 días).
   Cada una con el índice del primer punto desde esa hora. */
function marcasFinas(t, idioma = 'es') {
  const ms0 = t[0].ms, ms1 = t[t.length - 1].ms, enHoras = ms1 - ms0 <= 36 * HORA_MS;
  const horas = [];
  for (let ms = Math.ceil(ms0 / HORA_MS) * HORA_MS; ms <= ms1; ms += HORA_MS) {
    const h = horaEspana(ms);
    if (enHoras || h.hora === '00:00') horas.push({ ms, ...h });
  }
  const elegir = paso => (enHoras ? horas.filter(h => Number(h.hora.slice(0, 2)) % paso === 0) : horas.filter((_, i) => i % paso === 0));
  let elegidas = [];
  for (const paso of enHoras ? [1, 2, 3, 4, 6, 8, 12] : [1, 2, 3, 5, 7, 10, 14]) { elegidas = elegir(paso); if (elegidas.length <= 5) break; }
  const salida = [];
  let i = 0;
  for (const h of elegidas) {
    while (i < t.length && t[i].ms < h.ms) i++;
    if (i >= t.length || salida.some(m => m.indice === i)) continue;
    salida.push({ fecha: t[i].fecha, t: t[i].t, indice: i,
      texto: enHoras ? h.hora : Number(h.fecha.slice(8, 10)) + ' ' + mesCorto(h.fecha, idioma) });
  }
  return salida;
}

/* Las pestañas del gráfico. «24 h» (13/11/2026) solo existe con una serie
   fina («soloFina»; la de 5 minutos o, si ese día falta, la horaria): con la
   diaria serían dos puntos, una raya; sin ellas, la pestaña sale desactivada. La del año en curso («ytd») no se llama
   «YTD» en castellano, que nadie entiende: lleva el año de la serie («2026»,
   nombre accesible «En 2026»; etiquetaPestana). Qué serie usa cada una:
   seriePestana. */
const PESTANAS = Object.freeze([
  Object.freeze({ clave: '1d', corto: '24 h', nombre: '24 horas', largo: 'últimas 24 horas', dias: 1, soloFina: true }),
  Object.freeze({ clave: '1s', corto: '1 S', nombre: '1 semana', largo: 'última semana', dias: 7 }),
  Object.freeze({ clave: '1m', corto: '1 M', nombre: '1 mes', largo: 'último mes', dias: 30 }),
  Object.freeze({ clave: '3m', corto: '3 M', nombre: '3 meses', largo: 'últimos 3 meses', dias: 91 }),
  Object.freeze({ clave: '6m', corto: '6 M', nombre: '6 meses', largo: 'últimos 6 meses', dias: 182 }),
  Object.freeze({ clave: 'ytd', corto: 'Año', nombre: 'Año en curso', largo: 'en lo que va de año', dias: null }),
  Object.freeze({ clave: '1a', corto: '1 A', nombre: '1 año', largo: 'último año', dias: 365 }),
]);
const PESTANA_INICIAL = '1m';
const CORTO_EN = Object.freeze({ '1d': '24H', '1s': '1W', '1m': '1M', '3m': '3M', '6m': '6M', ytd: 'YTD', '1a': '1Y' });
// El nombre accesible contiene el texto que se ve (WCAG 2.5.3: quien usa la voz dice «YTD»).
const NOMBRE_EN = Object.freeze({ '1d': '24 hours', '1s': '1 week', '1m': '1 month', '3m': '3 months', '6m': '6 months', ytd: 'YTD, year to date', '1a': '1 year' });
/* El año de la pestaña «ytd»: el del último punto de la serie (si no hay
   serie, el del reloj). */
function anioSerie(serie, ahora = Date.now()) {
  const p = serie?.puntos;
  const f = Array.isArray(p) && p.length ? p[p.length - 1].fecha : null;
  return msFecha(f) !== null ? f.slice(0, 4) : fechaDe(ahora).slice(0, 4);
}
/* Lo que se ve en cada pestaña y su nombre accesible, en el idioma elegido. */
function etiquetaPestana(clave, idioma = 'es', serie = null, ahora = Date.now()) {
  const p = PESTANAS.find(x => x.clave === clave);
  if (!p) return null;
  if (idioma === 'en') return { corto: CORTO_EN[clave], nombre: NOMBRE_EN[clave] };
  if (clave === 'ytd') { const anio = anioSerie(serie, ahora); return { corto: anio, nombre: 'En ' + anio }; }
  return { corto: p.corto, nombre: p.nombre };
}

/* Los puntos de una pestaña. La del año en curso parte del primer punto del
   1 de enero o posterior: el dato de las 00:00 UTC del 1 de enero es el
   cierre del 31 de diciembre (QA del 11/11/2026). Menos de dos puntos: null.
   Sirve para la diaria y para las finas (sus puntos llevan la hora en «ms»):
   «24 h» con puntos diarios, null (seriePestana). */
function inicioPestana(p, finMs) {
  return p.dias === null ? Date.UTC(new Date(finMs).getUTCFullYear(), 0, 1) : finMs - p.dias * DIA_MS;
}
function tramo(puntos, clave) {
  const p = PESTANAS.find(x => x.clave === clave);
  if (!p || !Array.isArray(puntos) || puntos.length < 2) return null;
  if (typeof puntos[0].ms === 'number') {
    const desde = inicioPestana(p, puntos[puntos.length - 1].ms);
    const i = puntos.findIndex(x => x.ms >= desde);
    const t = i < 0 ? [] : puntos.slice(i);
    return t.length >= 2 ? t : null;
  }
  if (p.soloFina) return null;
  const ultimo = puntos[puntos.length - 1].fecha;
  const desde = p.dias === null ? ultimo.slice(0, 4) + '-01-01' : fechaDe(msFecha(ultimo) - p.dias * DIA_MS);
  const i = puntos.findIndex(x => x.fecha >= desde);
  const t = i < 0 ? [] : puntos.slice(i);
  return t.length >= 2 ? t : null;
}
/* Con puntos finos, además de la fecha (UTC), su hora («t», ISO): con ella
   textoInstante dice «8 nov, 18:00» (hora de España). */
function estadisticasTramo(t) {
  if (!Array.isArray(t) || t.length < 2) return null;
  let max = t[0], min = t[0];
  for (const p of t) { if (p.valor > max.valor) max = p; if (p.valor < min.valor) min = p; }
  const a = t[0], b = t[t.length - 1];
  const fino = typeof a.ms === 'number';
  const punto = q => (fino ? { valor: q.valor, fecha: q.fecha, t: q.t, ms: q.ms } : { valor: q.valor, fecha: q.fecha });
  const e = { desde: a.fecha, hasta: b.fecha, inicio: a.valor, fin: b.valor, cambio: cambioPct(b.valor, a.valor),
    max: punto(max), min: punto(min), puntos: t.length };
  if (fino) { e.desdeT = a.t; e.hastaT = b.t; }
  return e;
}

/* El eje de valores. El dibujo va del mínimo al máximo del tramo con un 8 %
   de aire arriba y abajo (como en las apps de bolsa: sin bandas vacías), y
   lleva 4 o 5 marcas redondas (1, 2, 2,5 o 5 × 10^n) dentro de ese margen.
   No empieza en cero: es un gráfico de evolución y las cifras del eje dicen
   la escala. Si el tramo es casi plano, abarca al menos un 1 % del valor,
   para que un 0,05 % no parezca un desplome. */
function pasoRedondo(bruto) {
  const e = 10 ** Math.floor(Math.log10(bruto)), f = bruto / e;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e;
}
function escalaValores(min, max) {
  if (!(Number.isFinite(min) && Number.isFinite(max) && max >= min && min > 0)) return null;
  const medio = (min + max) / 2, rango = Math.max(max - min, medio * 0.01);
  const lo0 = Math.min(min, medio - rango / 2), hi0 = Math.max(max, medio + rango / 2);
  const aire = (hi0 - lo0) * 0.08;
  const lo = lo0 - aire > 0 ? lo0 - aire : lo0 / 2, hi = hi0 + aire;
  // El paso redondo más fino que deja 4 o 5 marcas dentro (y, si no hay, 3 a 6).
  const base = 10 ** Math.floor(Math.log10((hi - lo) / 4));
  const pasos = [];
  for (const e of [base / 10, base, base * 10, base * 100]) for (const f of [1, 2, 2.5, 5]) pasos.push(f * e);
  let reserva = null;
  for (const paso of pasos) {
    const primera = Math.ceil(lo / paso - 1e-9) * paso;
    const n = Math.floor((hi - primera) / paso + 1e-9) + 1;
    if (n < 3 || n > 6) continue;
    const marcas = [];
    for (let k = 0; k < n; k++) marcas.push(redondear(primera + k * paso, 6));
    const escala = { lo, hi, paso, marcas };
    if (n >= 4 && n <= 5) return escala;
    if (!reserva) reserva = escala;
  }
  return reserva;
}
/* «48.000» (es) o «48,000» (en): la marca en millones de dólares. */
function marcaValor(valor, paso, idioma = 'es') {
  return numero(valor / 1e6, paso < 1e6 ? 1 : 0, idioma);
}

const MESES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function mesCorto(fecha, idioma) { const i = Number(fecha.slice(5, 7)) - 1; return idioma === 'en' ? MESES_EN[i] : MESES_ES[i]; }
/* Las fechas de abajo, de 4 a 6: días («4 nov») en tramos de hasta 100 días
   y principios de mes («dic 2025», «mar») en los largos, con el año entero
   (el apóstrofo de «dic ’25» parecía un error). Cada una con su índice en el
   tramo, para colocarla. */
function marcasFechas(t, idioma = 'es') {
  if (!Array.isArray(t) || t.length < 2) return [];
  if (typeof t[0].ms === 'number') return marcasFinas(t, idioma);
  const ms0 = msFecha(t[0].fecha), ms1 = msFecha(t[t.length - 1].fecha), dias = Math.round((ms1 - ms0) / DIA_MS);
  const indice = new Map(t.map((p, i) => [p.fecha, i]));
  const dia = f => (idioma === 'en' ? Number(f.slice(8, 10)) + ' ' + mesCorto(f, idioma) : Number(f.slice(8, 10)) + ' ' + mesCorto(f, idioma));
  if (dias <= 100) {
    const paso = Math.max(1, Math.ceil(dias / 4));
    const salida = [];
    for (let k = 0; k * paso <= dias && salida.length < 6; k++) {
      // El primer punto que exista desde esa fecha (puede faltar algún día).
      const objetivo = fechaDe(ms0 + k * paso * DIA_MS);
      const p = t.find(x => x.fecha >= objetivo);
      if (p && !salida.some(s => s.fecha === p.fecha)) salida.push({ fecha: p.fecha, indice: indice.get(p.fecha), texto: dia(p.fecha) });
    }
    return salida;
  }
  const inicios = t.filter((p, i) => i > 0 && p.fecha.slice(0, 7) !== t[i - 1].fecha.slice(0, 7));
  const salto = Math.max(1, Math.ceil(inicios.length / 5));
  const elegidos = inicios.filter((_, i) => i % salto === 0).slice(0, 6);
  return elegidos.map((p, i) => ({ fecha: p.fecha, indice: indice.get(p.fecha),
    texto: mesCorto(p.fecha, idioma) + (i === 0 || p.fecha.slice(5, 7) === '01' ? ' ' + p.fecha.slice(0, 4) : '') }));
}

/* Todo lo que pinta el gráfico de una pestaña, ya calculado y en el idioma
   elegido: la web y la app solo dibujan. null si la pestaña no tiene datos.
   Sale de la serie más fina que cubre la pestaña (seriePestana): «resolucion»
   dice cuál ('5m', '1h' o '1d') y «pasoMs», cada cuánto va un punto. */
function graficoPestana(serie, clave, idioma = 'es') {
  let s;
  try { s = validarSerie(serie); } catch { return null; }
  const elegida = seriePestana(s, clave);
  const t = elegida ? elegida.puntos : null, e = estadisticasTramo(t);
  if (!e) return null;
  const escala = escalaValores(e.min.valor, e.max.valor);
  if (!escala) return null;
  const p = PESTANAS.find(x => x.clave === clave);
  const en = idioma === 'en';
  // En castellano, la pestaña del año en curso dice el año: «▲ +75,4 % en 2026».
  const anio = s.puntos[s.puntos.length - 1].fecha.slice(0, 4);
  const largo = en ? LARGO_EN[clave] : clave === 'ytd' ? 'en ' + anio : p.largo;
  const dir = direccion(e.cambio), aviso = avisoTokens(t, dir, idioma);
  // En una fina con tokens fuera, la línea acaba por debajo de la cifra grande: se dice cuánto y por qué.
  const fuera = avisoFuera(elegida, s.incluidos, idioma), dentro = s.incluidos - elegida.fuera.length;
  // En las finas, la fecha y la hora de España («08/11/2026, 18:00 (hora de España)»).
  const cuando = q => (elegida.resolucion === '1d' ? fechaCorta(q.fecha, idioma) : textoInstante(q, idioma, elegida.resolucion, { largo: true }));
  const desdeHasta = q => (elegida.resolucion === '1d' ? `(${cuando(q)})` : `${en ? 'on' : 'el'} ${cuando(q)}`);
  return {
    clave, resolucion: elegida.resolucion, pasoMs: elegida.pasoMs, puntos: t, estadisticas: e, escala, direccion: dir,
    marcasValores: escala.marcas.map(v => ({ valor: v, texto: marcaValor(v, escala.paso, idioma) })),
    marcasFechas: marcasFechas(t, idioma),
    cambioTexto: porcentaje(e.cambio, idioma), periodoTexto: largo,
    // Lo que va junto al cambio: el periodo y a qué se refiere el % (la suma
    // de la serie, no la cifra total de hoy), y, si en el periodo entran o
    // salen tokens, el aviso de que parte del cambio se debe a eso.
    // En 24 h con una serie fina, hasta qué hora (de España): la serie se hace una vez al día y la web se
    // publica a mano, así que horas después «las últimas 24 horas» ya no eran las últimas (revisión del 13/11/2026).
    cambioFrase: clave === '1d' && elegida.resolucion !== '1d'
      ? (en ? `in the 24 hours to ${horaEspana(t[t.length - 1].ms).hora}` : `en las 24 horas hasta las ${horaEspana(t[t.length - 1].ms).hora}`)
      : en ? LARGO_EN[clave] : clave === 'ytd' ? 'en ' + anio : FRASE_ES[clave],
    alcance: dentro === s.incluidos ? (en ? `sum of the ${s.incluidos} largest` : `suma de los ${s.incluidos} mayores`)
      : (en ? `sum of ${dentro} of the ${s.incluidos} largest` : `suma de ${dentro} de los ${s.incluidos} mayores`),
    avisoTokens: aviso,
    fuera: elegida.fuera.length ? { tokens: elegida.fuera.slice(), valor: elegida.valorFuera } : null,
    avisoFuera: fuera,
    // En las finas, «de 43.547 M$ el 12/11/2026, 16:05 (hora de España) a …», sin paréntesis alrededor (se leía «(… (hora de España))»).
    etiqueta: (en
      ? `Sum of the ${s.incluidos} largest tokens, ${largo}: from ${millones(e.inicio, 'en')} ${desdeHasta(t[0])} to ${millones(e.fin, 'en')} ${desdeHasta(t[t.length - 1])}, ${porcentaje(e.cambio, 'en')}. High ${millones(e.max.valor, 'en')}, low ${millones(e.min.valor, 'en')}.`
      : `Suma de los ${s.incluidos} mayores tokens, ${largo}: de ${millones(e.inicio)} ${desdeHasta(t[0])} a ${millones(e.fin)} ${desdeHasta(t[t.length - 1])}, ${porcentaje(e.cambio)}. Máximo ${millones(e.max.valor)}, mínimo ${millones(e.min.valor)}.`) +
      (aviso ? ` ${aviso[0].toUpperCase()}${aviso.slice(1)}.` : '') + (fuera ? ` ${fuera[0].toUpperCase()}${fuera.slice(1)}.` : ''),
  };
}
/* El aviso de una pestaña fina con tokens fuera (les faltan más datos de los
   que arrastra su serie, 24 o 72 horas, o no se pudieron leer): cuántos, cuánto suman y que
   por eso su línea acaba por debajo de la cifra grande. '' si no hay. */
function avisoFuera(elegida, incluidos, idioma = 'es') {
  const n = elegida?.fuera?.length || 0;
  if (!n) return '';
  const v = elegida.valorFuera, en = idioma === 'en';
  if (en) {
    return `the line adds up ${incluidos - n} of the ${incluidos}: ${n === 1 ? '1 token is' : n + ' tokens are'} left out for lack of CoinGecko data in this period (${millones(v, 'en')}), ` +
      `so it ends ${millones(v, 'en')} below the big figure`;
  }
  return `la línea suma ${incluidos - n} de los ${incluidos}: ${n === 1 ? 'queda fuera 1 token' : `quedan fuera ${n} tokens`} sin datos de CoinGecko en este periodo (${millones(v)}), ` +
    `así que acaba ${millones(v)} por debajo de la cifra grande`;
}
const LARGO_EN = Object.freeze({ '1d': 'past 24 hours', '1s': 'past week', '1m': 'past month', '3m': 'past 3 months', '6m': 'past 6 months', ytd: 'year to date', '1a': 'past year' });
const FRASE_ES = Object.freeze({ '1d': 'en las últimas 24 horas', '1s': 'en la última semana', '1m': 'en el último mes', '3m': 'en los últimos 3 meses', '6m': 'en los últimos 6 meses',
  ytd: 'en lo que va de año', '1a': 'en el último año' });
/* Si el primer y el último día del tramo no suman los mismos tokens (un token
   empezó a cotizar dentro del periodo), el cambio no es solo de precio: se
   dice. '' si son los mismos. */
function avisoTokens(t, dir, idioma = 'es') {
  const a = t[0].tokens, b = t[t.length - 1].tokens, en = idioma === 'en';
  if (a === b) return '';
  if (b < a) return en ? `from ${a} to ${b} tokens: some stop counting in the period` : `de ${a} a ${b} tokens: algunos dejan de contar en el periodo`;
  if (dir === 'sube') return en ? `from ${a} to ${b} tokens: part of the rise is new tokens` : `de ${a} a ${b} tokens: parte de la subida son tokens nuevos`;
  if (dir === 'baja') return en ? `from ${a} to ${b} tokens: without the new ones, the fall would be bigger` : `de ${a} a ${b} tokens: sin los nuevos, la bajada sería mayor`;
  return en ? `from ${a} to ${b} tokens: part of the change is new tokens` : `de ${a} a ${b} tokens: parte del cambio son tokens nuevos`;
}
/* ¿La serie se ha quedado vieja respecto a la cifra que se pinta a su lado?
   Cierto si su último día es de más de «dias» días antes de «referencia»
   (la hora del dato de hoy, ISO o ms). Entonces la web y la app no ponen el
   cambio del periodo junto a la cifra en vivo y avisan «serie hasta el …». */
const RETRASO_MAX_DIAS = 3;
function serieAtrasada(serie, referencia, dias = RETRASO_MAX_DIAS) {
  const ultimo = serie?.puntos?.[serie.puntos.length - 1];
  const ms = typeof referencia === 'number' ? referencia : Date.parse(referencia);
  const fin = ultimo ? msFecha(ultimo.fecha) : null;
  if (!Number.isFinite(ms) || fin === null) return false;
  return Math.floor((ms - fin) / DIA_MS) > dias;
}
/* ¿La serie fina se ha quedado vieja? Cierto si su último punto es de más de
   «horas» antes de «referencia» (la hora del dato de hoy, ISO o ms). Se hace
   una vez al día (06:23 UTC) y la web se publica a mano: sin esto, «24 h»
   seguía enseñando el día de la publicación sin decirlo (revisión del
   13/11/2026). Entonces la web y la app dicen hasta cuándo llega. */
const FINA_RETRASO_MAX_HORAS = 26;
function finaAtrasada(serie, referencia, horas = FINA_RETRASO_MAX_HORAS) {
  const u = ultimoFino(serie), ms = typeof referencia === 'number' ? referencia : Date.parse(referencia);
  return !!u && Number.isFinite(ms) && ms - u.ms > horas * HORA_MS;
}
/* La cuota de la serie sobre el total de la categoría, con el mismo redondeo
   en la nota, en «Cómo se calcula» y en los datos clave: «86 %». */
function coberturaTexto(serie, idioma = 'es') {
  const c = serie?.cobertura;
  if (typeof c !== 'number' || !Number.isFinite(c)) return '—';
  return numero(c, 0, idioma) + (idioma === 'en' ? '%' : '\u00a0%');
}
/* Cuántos de los incluidos entran a mitad de una pestaña (no tienen dato su
   primer día: CoinGecko empezó a seguirlos después). 0 si la pestaña no
   existe o empieza con todos. */
function entranAMitad(serie, clave) {
  let s;
  try { s = validarSerie(serie); } catch { return 0; }
  const e = seriePestana(s, clave);
  if (!e) return 0;
  // En las finas, los que suma su último punto (sin los de fuera de esa serie).
  const fin = e.resolucion === '1d' ? s.incluidos : e.puntos[e.puntos.length - 1].tokens;
  return Math.max(0, fin - e.puntos[0].tokens);
}
/* «Cómo se calcula»: cuántos entran, su cuota del total de hoy, cuántos
   quedan fuera y por qué, los días sin pintar y, con la pestaña elegida
   («clave»), cuántos entran a mitad de ese periodo. */
function notaSerie(serie, idioma = 'es', clave = null) {
  let s;
  try { s = validarSerie(serie); } catch { return ''; }
  const cob = coberturaTexto(s, idioma);
  const mitad = clave ? entranAMitad(s, clave) : 0;
  const huecos = s.discontinuos, sinLeer = s.pedidos - s.incluidos - s.discontinuos;
  // Con una pestaña de la serie de 5 minutos o de horas, cómo se suma cada
  // punto, quién pasa ratos sin dato y quién queda fuera; los días sin
  // pintar son cosa de la diaria.
  const elegida = clave ? seriePestana(s, clave) : null;
  const fina = elegida && elegida.resolucion !== '1d' ? notaFina(elegida, s.incluidos, idioma) : '';
  // Los días que no se pintan (algún token sin dato en los 3 días anteriores).
  const p = s.puntos, sinPintar = fina || p.length < 2 ? 0 : Math.round((msFecha(p[p.length - 1].fecha) - msFecha(p[0].fecha)) / DIA_MS) + 1 - p.length;
  // Hasta 3, se nombran («Falta el 29/07/2026»); si son más, se cuentan.
  const faltan = sinPintar > 0 && sinPintar <= 3 ? diasQueFaltan(p).map(f => fechaCorta(f, idioma)) : [];
  const lista = faltan.length < 2 ? faltan.join('') : faltan.slice(0, -1).join(', ') + (idioma === 'en' ? ' and ' : ' y el ') + faltan[faltan.length - 1];
  const todos = s.incluidos === s.pedidos;
  if (idioma === 'en') {
    return (todos ? `Sum of the ${s.pedidos} largest` : `Sum of ${s.incluidos} of the ${s.pedidos} largest`) +
      ` tokens in CoinGecko's ${textoCategoria(idioma)} (${cob} of the category total). If a token started trading within the period, it enters on that day.` +
      (mitad > 0 ? ` In this period, ${mitad} of the ${s.incluidos} join midway (from the day CoinGecko starts tracking them).` : '') +
      (huecos > 0 ? ` ${huecos} ${huecos === 1 ? 'is' : 'are'} left out because ${huecos === 1 ? 'its' : 'their'} CoinGecko history is missing days.` : '') +
      (sinLeer > 0 ? ` ${sinLeer} could not be read.` : '') + fina +
      (faltan.length === 1 ? ` ${lista} is missing: there is no complete data for that day, so it is not drawn.`
        : faltan.length > 1 ? ` ${lista} are missing: there is no complete data for those days, so they are not drawn.`
        : sinPintar > 0 ? ` Days without complete data are not drawn (${sinPintar} in the series).` : '');
  }
  return (todos ? `Suma de los ${s.pedidos} mayores` : `Suma de ${s.incluidos} de los ${s.pedidos} mayores`) +
    ` tokens de la ${textoCategoria(idioma)} de CoinGecko (${cob} del total de la categoría). Si un token empezó a cotizar dentro del periodo, entra ese día.` +
    (mitad > 0 ? ` En este periodo, ${mitad} de los ${s.incluidos} entran a mitad (desde el día en que CoinGecko los sigue).` : '') +
    (huecos > 0 ? ` Quedan fuera ${huecos} a los que les faltan días en CoinGecko.` : '') +
    (sinLeer > 0 ? (sinLeer === 1 ? ' No se pudo leer 1.' : ` No se pudieron leer ${sinLeer}.`) : '') + fina +
    (faltan.length === 1 ? ` Falta el ${lista}: ese día no hay dato completo y no se pinta.`
      : faltan.length > 1 ? ` Faltan el ${lista}: esos días no hay dato completo y no se pintan.`
      : sinPintar > 0 ? ` Los días sin dato completo no se pintan (${sinPintar} en la serie).` : '');
}
/* La frase de «Cómo se calcula» de una pestaña fina: cada cuánto va un
   punto, en qué hora y qué vale de cada token (con el margen de su serie);
   qué tokens pasan más de una hora sin dato (hasta 3, con su nombre) y, si
   los hay, los que quedan fuera de esa serie y cuánto suman. */
function listaNombres(nombres, idioma) {
  return nombres.length < 2 ? nombres.join('') : nombres.slice(0, -1).join(', ') + (idioma === 'en' ? ' and ' : ' y ') + nombres[nombres.length - 1];
}
function notaFina(elegida, incluidos, idioma = 'es') {
  const en = idioma === 'en', cinco = elegida.resolucion === '5m';
  const horas = Math.round(elegida.arrastre * elegida.pasoMs / HORA_MS), nl = elegida.largos.length;
  const quienes = nl <= 3 ? ' (' + listaNombres(elegida.largos, idioma) + ')' : '';
  const fuera = avisoFuera(elegida, incluidos, idioma);
  const frase = x => (x ? ' ' + x[0].toUpperCase() + x.slice(1) + '.' : '');
  const directo = elegida.origen === 'directo' ? notaDirecto(elegida.sinLectura || [], elegida.resolucion, idioma) : '';
  if (en) {
    return ` In this tab, one point every ${cinco ? '5 minutes' : 'hour'}, in Spain (mainland) time: each token's latest figure in that ${cinco ? '5-minute slot' : 'hour'}` +
      ` (if it has none, its previous one, at most ${horas} hours old).` +
      (nl ? ` ${nl === 1 ? '1 token' : nl + ' tokens'}${quienes} ${nl === 1 ? 'goes' : 'go'} more than an hour without CoinGecko data at times: then ${nl === 1 ? 'its' : 'their'} latest figure counts.` : '') +
      frase(fuera) + directo;
  }
  return ` En esta pestaña, un punto cada ${cinco ? '5 minutos' : 'hora'}, en hora de España peninsular: el último dato de cada token en ${cinco ? 'esos 5 minutos' : 'esa hora'}` +
    ` (si no tiene, el anterior, como mucho de ${horas} horas antes).` +
    (nl ? ` ${nl === 1 ? '1 token' : nl + ' tokens'}${quienes} ${nl === 1 ? 'pasa' : 'pasan'} ratos de más de una hora sin dato en CoinGecko: ahí cuenta su último dato.` : '') +
    frase(fuera) + directo;
}
/* Con el directo: que se pide cada 5 minutos y, si en la pestaña hubo ratos
   en que el propio directo no pudo leer (Supabase parado, una racha de
   429), cuándo: ahí se repite el último dato y no es culpa de CoinGecko. */
function notaDirecto(sinLectura, resolucion, idioma = 'es') {
  const en = idioma === 'en', paso = resolucion === '1h' ? HORA_MS : 5 * MIN_MS;
  const cuando = ms => { const h = horaEspana(ms); return fechaCorta(h.fecha, idioma) + ', ' + h.hora; };
  const ratos = sinLectura.map(([a, b]) => [msMinuto(a), msMinuto(b) + paso]);
  const lista = ratos.slice(-2).map(([a, b]) => (en ? `from ${cuando(a)} to ${cuando(b)}` : `del ${cuando(a)} al ${cuando(b)}`));
  const huecos = !ratos.length ? ''
    : en ? ` Live data could not be read ${ratos.length > 2 ? `${ratos.length} times, the last ` : ''}${lista.join(' and ')} (Spain time): the latest figure is repeated there.`
      : ` El directo no pudo leer ${ratos.length > 2 ? `${ratos.length} veces, las últimas ` : ''}${lista.join(' y ')} (hora de España): ahí se repite el último dato.`;
  return (en ? ' Fetched from CoinGecko every 5 minutes.' : ' Se pide a CoinGecko cada 5 minutos.') + huecos;
}
/* Las fechas que faltan entre el primer y el último punto. */
function diasQueFaltan(puntos) {
  const salida = [];
  for (let i = 1; i < puntos.length; i++) {
    for (let ms = msFecha(puntos[i - 1].fecha) + DIA_MS; ms < msFecha(puntos[i].fecha); ms += DIA_MS) salida.push(fechaDe(ms));
  }
  return salida;
}
/* La nota corta, siempre a la vista bajo el gráfico; el resto (notaSerie) va
   en un desplegable «Cómo se calcula». Dice lo mismo que el subtítulo de la
   cifra grande, «los N mayores tokens con historia completa» (revisión del
   11/11/2026: «Suma de 29 de los 40 mayores» se leía como otra cosa que
   «Suma de los 29 mayores»); de cuántos se eligen lo cuenta «Cómo se calcula». */
function notaCorta(serie, idioma = 'es') {
  let s;
  try { s = validarSerie(serie); } catch { return ''; }
  const cob = coberturaTexto(s, idioma);
  if (idioma === 'en') return `Sum of the ${s.incluidos} largest tokens with a complete history (${cob} of the category total).`;
  return `Suma de los ${s.incluidos} mayores tokens con historia completa (${cob} del total de la categoría).`;
}
/* =====================================================================
   La cabecera de «Mercado y noticias» (QA del 11/11/2026): nada de la
   pantalla contradice al gráfico.
   ===================================================================== */
/* La cifra grande (/mercado/, tarjeta de Inicio y app): el último punto de la
   serie, el final de la línea. Es la misma que la burbuja de la cruz en el
   último día y nunca supera el máximo del periodo. Sin serie, el total de la
   categoría de CoinGecko (y quien pinta lo avisa). null si no hay nada.
   Con las series finas, el último punto de la diaria (todos sus tokens) con
   la hora («t») del último de la más fina: las tres acaban en el último dato
   de cada token, así que es el mismo valor que el final de cada línea; si en
   una fina quedan tokens fuera, su línea acaba «valorFuera» por debajo y su
   aviso lo dice (seriesEnlazadas lo comprueba). */
function cifraGrande(serie, vivo) {
  const p = serie?.puntos;
  const fino = ultimoFino(serie);
  if (fino && Array.isArray(p) && p.length) return { valor: p[p.length - 1].valor, fecha: fino.fecha, t: fino.t, fuente: 'serie' };
  if (Array.isArray(p) && p.length) { const u = p[p.length - 1]; return { valor: u.valor, fecha: u.fecha, fuente: 'serie' }; }
  const v = vivo?.total?.valor;
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? { valor: v, fecha: vivo.fecha ?? null, fuente: 'total' } : null;
}
/* «Cambio en 24 h»: con una serie fina, del primer al último punto de la
   pestaña «24 h» (de hace 24 horas, o 5 minutos menos, a ahora: los mismos
   que se pintan; la de 5 minutos o, si falta, la horaria); si no, el de la serie diaria si sus dos últimos
   puntos son de días seguidos (el de la cifra grande); si hay una serie
   sin dos días seguidos, null («—»). Solo sin serie se usa el cambio de la
   categoría de CoinGecko si es creíble (|x| < 25 %).
   Nunca el +124 % que daba CoinGecko el 11/11/2026 con el mercado plano. */
function cambio24h(serie, vivo) {
  const e = seriePestana(serie, '1d');
  if (e) {
    const a = e.puntos[0], b = e.puntos[e.puntos.length - 1];
    return { cambio: cambioPct(b.valor, a.valor), fuente: 'serie', desde: a.fecha, hasta: b.fecha, desdeT: a.t, hastaT: b.t, resolucion: e.resolucion };
  }
  const p = serie?.puntos;
  if (Array.isArray(p) && p.length >= 2) {
    const a = p[p.length - 2], b = p[p.length - 1];
    if (msFecha(b.fecha) - msFecha(a.fecha) === DIA_MS) return { cambio: cambioPct(b.valor, a.valor), fuente: 'serie', desde: a.fecha, hasta: b.fecha };
  }
  // No atribuir al subconjunto del gráfico un cambio de todo el mercado.
  if (Array.isArray(p) && p.length) return { cambio: null, fuente: null, desde: null, hasta: null };
  const c = cambio24hCreible(vivo?.total?.cambio24h);
  return { cambio: c, fuente: c === null ? null : 'coingecko', desde: null, hasta: null };
}
/* ¿Es de hoy (día UTC de «ahora») la hora ISO «iso»? */
function esHoy(iso, ahora = Date.now()) {
  return typeof iso === 'string' && ISO.test(iso) && iso.slice(0, 10) === fechaDe(ahora);
}
/* Cuándo es el total de la categoría, en hora de España como la cifra
   grande y la serie (revisión del 13/11/2026: en la misma pantalla iban
   «16:05», de España, y «14:42 UTC», y parecía 1 h 23 min más viejo cuando
   eran 23 minutos): «hoy, 15:42 hora de España» solo si es de hoy (en
   España); si no, «dato del 10/11/2026, 16:25 hora de España»; la foto
   guardada lo dice. */
function cuandoDato(vivo, idioma = 'es', ahora = Date.now()) {
  const iso = vivo?.actualizado;
  if (typeof iso !== 'string' || !ISO.test(iso)) return '';
  const en = idioma === 'en', h = horaEspana(Date.parse(iso)), zona = en ? ' Spain time' : ' hora de España';
  const fechaHora = fechaCorta(h.fecha, idioma) + ', ' + h.hora + zona;
  if (vivo.fuente === 'foto-guardada') return (en ? 'last saved snapshot, ' : 'última foto guardada, del ') + fechaHora;
  if (h.fecha === horaEspana(ahora).fecha) return (en ? 'today, ' : 'hoy, ') + h.hora + zona;
  return (en ? 'figure from ' : 'dato del ') + fechaHora;
}
/* =====================================================================
   Los rótulos con fecha (auditoría del 20/11/2026: «Total de la categoría
   hoy» enseñaba la foto guardada del 14/11 y la tarjeta de Inicio decía
   «copia de las 15:00» sin día). «Hoy» solo si el dato es del día de hoy en
   España peninsular (Europe/Madrid, como horaEspana) y no de una foto
   guardada; si no, el rótulo lleva el día (y la hora, si la hay). La misma
   decisión en la web (/mercado/ e Inicio) y en la app.
   ===================================================================== */
/* El nombre que CoinGecko da a la categoría «tokenized-products» (TOTAL.id). */
const CATEGORIA_COINGECKO = 'Tokenized Assets';
function textoCategoria(idioma = 'es') {
  return idioma === 'en' ? `"${CATEGORIA_COINGECKO}" category` : `categoría «${CATEGORIA_COINGECKO}»`;
}
/* El instante de un dato, en hora de España: «t» (ISO al minuto, la serie
   fina y la cifra grande), «actualizado» (ISO, el resumen de
   /api/tokenizacion) o solo «fecha» (la diaria, sin hora). { fecha, hora }
   (hora null si no la hay) o null. */
function momentoEspana(dato) {
  if (!esObjeto(dato)) return null;
  const ms = typeof dato.t === 'string' ? msMinuto(dato.t)
    : typeof dato.actualizado === 'string' && ISO.test(dato.actualizado) ? Date.parse(dato.actualizado) : null;
  if (ms !== null && Number.isFinite(ms)) return horaEspana(ms);
  return msFecha(dato.fecha) !== null ? { fecha: dato.fecha, hora: null } : null;
}
/* ¿Se puede decir «hoy»? Solo si el dato es de hoy en España y no viene de una foto guardada. */
function datoDeHoy(dato, ahora = Date.now()) {
  const m = momentoEspana(dato);
  return !!m && dato.fuente !== 'foto-guardada' && m.fecha === horaEspana(ahora).fecha;
}
/* El rótulo de un dato, ya en su idioma. «tipo»:
   - 'total': el total de la categoría (dato: el resumen, «vivo»): «Total de
     la categoría hoy» o «Total de la categoría (foto del 14/11, 15:00)».
   - 'valor': la cifra grande (dato: cifraGrande), con «incluidos»: «Valor
     hoy (29 mayores)» o «Valor el 14/11 (29 mayores)».
   - 'copia': la tarjeta de Inicio sin el directo (dato: cifraGrande):
     «copia de las 15:00» o «copia del 14/11, 15:00»; sin hora, «copia publicada».
   - 'tipos': el subtítulo de «Por tipo de activo» (dato: «vivo»): «Hoy.» o
     «Foto del 14/11, 15:00.», y lo que sigue.
   El día, «DD/MM» (con el año si no es el de hoy); la hora, la de España. */
function rotuloDato(tipo, dato, { idioma = 'es', ahora = Date.now(), incluidos = null } = {}) {
  const en = idioma === 'en', m = momentoEspana(dato), hoy = datoDeHoy(dato, ahora);
  const dia = m ? fechaBreve(m.fecha, idioma, horaEspana(ahora).fecha) : '';
  const diaHora = m ? dia + (m.hora ? ', ' + m.hora : '') : '';
  if (tipo === 'total') {
    if (hoy) return en ? 'Category total today' : 'Total de la categoría hoy';
    if (!m) return en ? 'Category total' : 'Total de la categoría';
    return en ? `Category total (snapshot from ${diaHora})` : `Total de la categoría (foto del ${diaHora})`;
  }
  if (tipo === 'valor') {
    const cuantos = typeof incluidos === 'number' ? (en ? ` (${incluidos} largest)` : ` (${incluidos} mayores)`) : '';
    if (hoy) return (en ? 'Value today' : 'Valor hoy') + cuantos;
    if (!m) return (en ? 'Value' : 'Valor') + cuantos;
    return (en ? `Value on ${dia}` : `Valor el ${dia}`) + cuantos;
  }
  if (tipo === 'copia') {
    if (!m || !m.hora) return en ? 'published copy' : 'copia publicada';
    if (hoy) return (en ? 'copy from ' : 'copia de las ') + m.hora;
    return en ? `copy from ${dia}, ${m.hora}` : `copia del ${dia}, ${m.hora}`;
  }
  if (tipo === 'tipos') {
    const resto = en ? "A token can count in two types, so the figures don't add up to the total."
      : 'Un mismo token puede contar en dos tipos, así que las cifras no suman el total.';
    const cuando = hoy ? (en ? 'Today.' : 'Hoy.') : m ? (en ? `Snapshot from ${diaHora}.` : `Foto del ${diaHora}.`) : '';
    return cuando ? cuando + ' ' + resto : resto;
  }
  return '';
}
/* La línea gris del total de la categoría, con su hora. Va bajo el gráfico,
   tras la nota corta (revisión del 11/11/2026: en la cabecera empujaba el
   gráfico fuera de la primera pantalla del móvil); que la cifra grande y el
   gráfico suman los N mayores ya lo dicen el subtítulo y la nota. '' sin
   total o sin serie (entonces la cifra grande ya es ese total). */
function lineaTotalCategoria(serie, vivo, idioma = 'es', ahora = Date.now()) {
  const v = vivo?.total?.valor;
  if (typeof v !== 'number' || !Number.isFinite(v)) return '';
  let s;
  try { s = validarSerie(serie); } catch { return ''; }
  if (!s) return '';
  const cuando = cuandoDato(vivo, idioma, ahora);
  if (idioma === 'en') return `CoinGecko category total, all tokens: ${millones(v, 'en')}${cuando ? ` (${cuando})` : ''}.`;
  return `Total de la categoría en CoinGecko, con todos sus tokens: ${millones(v)}${cuando ? ` (${cuando})` : ''}.`;
}
/* Debajo del cambio del periodo, siempre: el % es del tamaño del mercado. */
function explicacionCambio(idioma = 'es') {
  return idioma === 'en'
    ? 'It measures the total size of the market, which also grows when new tokens are issued. It is not the return on any investment.'
    : 'Mide cuánto vale en total el mercado: sube también cuando se emiten tokens nuevos. No es lo que habría ganado una inversión.';
}
/* El subtítulo de la cifra grande: qué suma (con la misma coletilla que la
   nota del gráfico) y de qué día. */
function subtituloCifra(serie, idioma = 'es') {
  let s;
  try { s = validarSerie(serie); } catch { s = null; }
  const u = s?.puntos?.[s.puntos.length - 1];
  if (!u) return idioma === 'en' ? 'CoinGecko category total, all tokens' : 'Total de la categoría en CoinGecko, con todos sus tokens';
  // Con las series finas, también la hora de la cifra, y que es la de España: «13/11/2026, 10:20 (hora de España)».
  const fino = ultimoFino(s);
  const cuando = fino ? fechaCorta(horaEspana(fino.ms).fecha, idioma) + ', ' + horaEspana(fino.ms).hora + (idioma === 'en' ? ' (Spain time)' : ' (hora de España)')
    : fechaCorta(u.fecha, idioma);
  // Un espacio duro antes del «·»: en el móvil, si no cabe, baja «completa · 11/11/2026» entero y no un «· 11/11/2026» suelto.
  return idioma === 'en' ? `Sum of the ${s.incluidos} largest tokens with a complete history\u00a0· ${cuando}`
    : `Suma de los ${s.incluidos} mayores tokens con historia completa\u00a0· ${cuando}`;
}
/* Coordenadas de los puntos en un dibujo de ancho «ancho» y alto «alto» (sin
   márgenes: los pone quien dibuja). x por fecha; y por la escala del eje. */
const msPunto = p => (typeof p.ms === 'number' ? p.ms : msFecha(p.fecha));
function coordenadas(g, ancho, alto) {
  if (!g) return [];
  const t = g.puntos, ms0 = msPunto(t[0]), ms1 = msPunto(t[t.length - 1]);
  const { lo, hi } = g.escala;
  return t.map(p => ({ x: ms1 > ms0 ? (msPunto(p) - ms0) / (ms1 - ms0) * ancho : 0,
    y: alto - (p.valor - lo) / (hi - lo) * alto }));
}
/* Los tramos de días seguidos de una pestaña (o de cubos de 5 minutos o de
   una hora seguidos, en las finas), como pares [primero, último] de índices.
   Donde falta un punto (no se pinta), la línea se corta: el dibujo no une
   dos puntos con una recta que parecería un dato. */
function tramosSeguidos(g) {
  if (!g) return [];
  const t = g.puntos, salida = [], paso = g.pasoMs || DIA_MS;
  let ini = 0;
  for (let i = 1; i <= t.length; i++) {
    if (i === t.length || msPunto(t[i]) - msPunto(t[i - 1]) > paso) { salida.push([ini, i - 1]); ini = i; }
  }
  return salida;
}
/* El trazo SVG de la línea (tramo a tramo), del área (hasta «suelo») y de
   los «puentes». La línea se corta donde falta un día; el área de fondo no
   se corta (un corte se veía como una raya vertical que parecía un fallo) y
   los dos días a los lados del hueco se unen con un trazo de puntos tenue
   (quien dibuja le da ese estilo), que no se confunde con un dato. */
function trazosSvg(coords, tramos, suelo) {
  const f = n => n.toFixed(1);
  if (!coords.length || !tramos.length) return { linea: '', area: '', puentes: '' };
  const camino = (a, b) => indicesPintar(coords, a, b).map((i, k) => (k ? 'L' : 'M') + f(coords[i].x) + ' ' + f(coords[i].y)).join(' ');
  const linea = tramos.map(([a, b]) => camino(a, b)).join(' ');
  const primero = tramos[0][0], ultimo = tramos[tramos.length - 1][1];
  const area = camino(primero, ultimo) +
    ` L${f(coords[ultimo].x)} ${f(suelo)} L${f(coords[primero].x)} ${f(suelo)} Z`;
  const puentes = tramos.slice(1).map(([a], i) => { const b = tramos[i][1];
    return `M${f(coords[b].x)} ${f(coords[b].y)} L${f(coords[a].x)} ${f(coords[a].y)}`; }).join(' ');
  return { linea, area, puentes };
}
/* Para pintar 720 puntos en un móvil sin tirones: si en un tramo hay más
   puntos que medios píxeles a lo ancho, de cada columna de un píxel se
   quedan el punto más alto y el más bajo (en su orden), más el primero y el
   último del tramo. La línea se ve igual, no se pierde ningún máximo ni
   mínimo y la cruz y la tabla siguen con todos los puntos. Con la diaria
   (365 puntos en 300 px o más) no quita ninguno. Devuelve los índices. */
function indicesPintar(coords, a, b) {
  const todos = [];
  if (b - a + 1 <= 2 * (coords[b].x - coords[a].x) + 2) { for (let i = a; i <= b; i++) todos.push(i); return todos; }
  const salida = [a];
  for (let i = a + 1; i < b;) {
    const columna = Math.floor(coords[i].x);
    let alto = i, bajo = i, j = i;
    for (; j < b && Math.floor(coords[j].x) === columna; j++) {
      if (coords[j].y < coords[alto].y) alto = j;
      if (coords[j].y > coords[bajo].y) bajo = j;
    }
    if (alto === bajo) salida.push(alto); else salida.push(Math.min(alto, bajo), Math.max(alto, bajo));
    i = j;
  }
  salida.push(b);
  return salida;
}
/* El punto más cercano a una «x» (para la cruz). Búsqueda binaria: las «x»
   van en orden; con 720 puntos, cada movimiento del dedo mira unos 10. Si
   dos están a la misma distancia, el primero. */
function indiceCercano(coords, x) {
  if (!Array.isArray(coords) || coords.length < 2) return 0;
  let lo = 0, hi = coords.length - 1;
  if (x <= coords[0].x) return 0;
  if (x >= coords[hi].x) { while (hi > 0 && coords[hi - 1].x === coords[hi].x) hi--; return hi; }
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (coords[m].x <= x) lo = m; else hi = m; }
  let mejor = Math.abs(coords[hi].x - x) < Math.abs(coords[lo].x - x) ? hi : lo;
  while (mejor > 0 && coords[mejor - 1].x === coords[mejor].x) mejor--;
  return mejor;
}

module.exports = { FUENTE, TOTAL, TIPOS, ORO, PERIODOS, MARGEN_DIAS, historicoVacio, extraerFoto, validarFoto, validarHistorico,
  anadirFoto, serializarHistorico, resumir, resumenValido, millones, porcentaje, cuota, direccion, fechaCorta, fechaBreve, horaDato, fechaDe,
  fechaLlegada, alturasLinea, textosLinea, millonesHablados, cambioPct, resumenCompacto, colorTipo, COLORES_COMPACTO,
  SERIE, PESTANAS, PESTANA_INICIAL, urlHistoria, elegirMayores, historiaToken, construirSerie, validarSerie, serializarSerie, serieValida,
  diasSinDato, tramo, estadisticasTramo, escalaValores, marcaValor, marcasFechas, graficoPestana, notaSerie, coordenadas, indiceCercano, tramosSeguidos, trazosSvg,
  avisoTokens, serieAtrasada, RETRASO_MAX_DIAS, finaAtrasada, FINA_RETRASO_MAX_HORAS, notaCorta, diasQueFaltan,
  CAMBIO_24H_MAX, cambio24hCreible, etiquetaPestana, anioSerie, coberturaTexto, entranAMitad, cifraGrande, cambio24h, esHoy, cuandoDato,
  lineaTotalCategoria, explicacionCambio, subtituloCifra, CATEGORIA_COINGECKO, textoCategoria, momentoEspana, datoDeHoy, rotuloDato,
  RESOLUCIONES, FUERA_MAX_PCT, avisoFuera, urlHistoriaFina, observacionesToken, construirSerieFina, validarSerieFina, serializarSerieFina, serieFinaValida, serieFinaVacia,
  seriesEnlazadas, unirSerieFina, serieFinaDe, seriePestana, pestanaDisponible, textoInstante, horaEspana, indicesPintar, isoMinuto, msMinuto,
  directoAFina, validarDirecto, transcurridoMs, edadDirecto, unirDirecto, motivoDirecto, avisoDirecto, esDirecto, notaDirecto,
  DIRECTO_MAX_MS, COSTURA_MAX };

window.RWAdarTokenizacionModelo=module.exports; })();

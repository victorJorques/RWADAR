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
   los 40 tokens mayores de hoy (más o menos el 93 % del total), con un año
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
   ===================================================================== */
const SERIE = Object.freeze({ mayores: 40, huecoMaxDias: 3, maxDiasSinDato: 3, dias: 365, maxPuntos: 400, minIncluidos: 25,
  categoria: TOTAL.id,
  apiMercados: 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=tokenized-products&order=market_cap_desc&per_page=250' });
const ID_TOKEN = /^[a-z0-9][a-z0-9-]{0,99}$/;
function urlHistoria(id) {
  exigir(typeof id === 'string' && ID_TOKEN.test(id), 'id de token no válido');
  return 'https://api.coingecko.com/api/v3/coins/' + id + '/market_chart?vs_currency=usd&days=' + SERIE.dias + '&interval=daily';
}
const valorCreible = v => typeof v === 'number' && Number.isFinite(v) && v > 0 && v < VALOR_MAX;

/* De /coins/markets a los «n» mayores de hoy y su cuota del total de la lista. */
function elegirMayores(lista, n = SERIE.mayores) {
  exigir(Array.isArray(lista) && lista.length > 0 && lista.length <= 1000, 'CoinGecko: la lista de tokens no es válida');
  const vistos = new Set(), validos = [];
  for (const t of lista) {
    if (!esObjeto(t) || typeof t.id !== 'string' || !ID_TOKEN.test(t.id) || vistos.has(t.id) || !valorCreible(t.market_cap)) continue;
    vistos.add(t.id); validos.push({ id: t.id, valor: t.market_cap });
  }
  exigir(validos.length >= Math.min(n, SERIE.minIncluidos), 'CoinGecko: la lista trae muy pocos tokens con valor');
  validos.sort((a, b) => b.valor - a.valor);
  const total = validos.reduce((s, t) => s + t.valor, 0);
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

function validarSerie(s) {
  exigir(esObjeto(s) && Object.keys(s).sort().join() === 'categoria,cobertura,discontinuos,fuente,generado,incluidos,pedidos,puntos,tokens,version',
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
  return { version: 1, fuente: FUENTE.nombre, categoria: SERIE.categoria, generado: s.generado, pedidos: s.pedidos, incluidos: s.incluidos,
    discontinuos: s.discontinuos, cobertura: s.cobertura, tokens: s.tokens.slice(), puntos };
}
/* Un punto por línea: la historia del archivo en Git se lee bien. */
function serializarSerie(serie) {
  const s = validarSerie(serie);
  const { puntos, ...cab } = s;
  return JSON.stringify(cab).slice(0, -1) + ',"puntos":[' + (puntos.length ? '\n' + puntos.map(p => JSON.stringify(p)).join(',\n') + '\n' : '') + ']}\n';
}
/* Lo que la web y la app aceptan de /datos/tokenizacion-serie.json. */
function serieValida(s) { try { validarSerie(s); return true; } catch { return false; } }

/* Las pestañas del gráfico. Sin «1 D»: no hay datos de cada hora. */
const PESTANAS = Object.freeze([
  Object.freeze({ clave: '1s', corto: '1 S', nombre: '1 semana', largo: 'última semana', dias: 7 }),
  Object.freeze({ clave: '1m', corto: '1 M', nombre: '1 mes', largo: 'último mes', dias: 30 }),
  Object.freeze({ clave: '3m', corto: '3 M', nombre: '3 meses', largo: 'últimos 3 meses', dias: 91 }),
  Object.freeze({ clave: '6m', corto: '6 M', nombre: '6 meses', largo: 'últimos 6 meses', dias: 182 }),
  Object.freeze({ clave: 'ytd', corto: 'YTD', nombre: 'Este año', largo: 'en lo que va de año', dias: null }),
  Object.freeze({ clave: '1a', corto: '1 A', nombre: '1 año', largo: 'último año', dias: 365 }),
]);
const PESTANA_INICIAL = '1m';

/* Los puntos de una pestaña. «YTD» parte del último punto del año anterior
   (el cierre del año), como en bolsa. Menos de dos puntos: null. */
function tramo(puntos, clave) {
  const p = PESTANAS.find(x => x.clave === clave);
  if (!p || !Array.isArray(puntos) || puntos.length < 2) return null;
  const ultimo = puntos[puntos.length - 1].fecha;
  const desde = p.dias === null ? (Number(ultimo.slice(0, 4)) - 1) + '-12-31' : fechaDe(msFecha(ultimo) - p.dias * DIA_MS);
  let i = puntos.findIndex(x => x.fecha >= desde);
  if (p.dias === null && i > 0 && puntos[i].fecha > desde) i -= 1;
  const t = i < 0 ? [] : puntos.slice(i);
  return t.length >= 2 ? t : null;
}
function estadisticasTramo(t) {
  if (!Array.isArray(t) || t.length < 2) return null;
  let max = t[0], min = t[0];
  for (const p of t) { if (p.valor > max.valor) max = p; if (p.valor < min.valor) min = p; }
  const a = t[0], b = t[t.length - 1];
  return { desde: a.fecha, hasta: b.fecha, inicio: a.valor, fin: b.valor, cambio: cambioPct(b.valor, a.valor),
    max: { valor: max.valor, fecha: max.fecha }, min: { valor: min.valor, fecha: min.fecha }, puntos: t.length };
}

/* El eje de valores: 4 o 5 marcas redondas (1, 2, 2,5 o 5 × 10^n) que
   abarcan el tramo. No empieza en cero: es un gráfico de evolución y las
   cifras del eje dicen la escala. Si el tramo es casi plano, abarca al
   menos un 1 % del valor, para que un 0,05 % no parezca un desplome. */
function pasoRedondo(bruto) {
  const e = 10 ** Math.floor(Math.log10(bruto)), f = bruto / e;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e;
}
function escalaValores(min, max) {
  if (!(Number.isFinite(min) && Number.isFinite(max) && max >= min && min > 0)) return null;
  const medio = (min + max) / 2, rango = Math.max(max - min, medio * 0.01);
  const lo0 = Math.min(min, medio - rango / 2), hi0 = Math.max(max, medio + rango / 2);
  // El paso redondo más fino que deja 4 o 5 marcas (y, si no hay, 3 a 6).
  const base = 10 ** Math.floor(Math.log10((hi0 - lo0) / 4));
  const pasos = [];
  for (const e of [base / 10, base, base * 10, base * 100]) for (const f of [1, 2, 2.5, 5]) pasos.push(f * e);
  let reserva = null;
  for (const paso of pasos) {
    const lo = Math.floor(lo0 / paso) * paso, hi = Math.ceil(hi0 / paso) * paso;
    const n = Math.round((hi - lo) / paso) + 1;
    if (n < 3 || n > 6) continue;
    const marcas = [];
    for (let k = 0; k < n; k++) marcas.push(redondear(lo + k * paso, 6));
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
   y principios de mes («ene 2026», «mar») en los largos. Cada una con su
   índice en el tramo, para colocarla. */
function marcasFechas(t, idioma = 'es') {
  if (!Array.isArray(t) || t.length < 2) return [];
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
    texto: mesCorto(p.fecha, idioma) + (i === 0 || p.fecha.slice(5, 7) === '01' ? ' \u2019' + p.fecha.slice(2, 4) : '') }));
}

/* Todo lo que pinta el gráfico de una pestaña, ya calculado y en el idioma
   elegido: la web y la app solo dibujan. null si la pestaña no tiene datos. */
function graficoPestana(serie, clave, idioma = 'es') {
  let s;
  try { s = validarSerie(serie); } catch { return null; }
  const t = tramo(s.puntos, clave), e = estadisticasTramo(t);
  if (!e) return null;
  const escala = escalaValores(e.min.valor, e.max.valor);
  if (!escala) return null;
  const p = PESTANAS.find(x => x.clave === clave);
  const en = idioma === 'en';
  const largo = en ? ({ '1s': 'past week', '1m': 'past month', '3m': 'past 3 months', '6m': 'past 6 months', ytd: 'year to date', '1a': 'past year' })[clave] : p.largo;
  return {
    clave, puntos: t, estadisticas: e, escala, direccion: direccion(e.cambio),
    marcasValores: escala.marcas.map(v => ({ valor: v, texto: marcaValor(v, escala.paso, idioma) })),
    marcasFechas: marcasFechas(t, idioma),
    cambioTexto: porcentaje(e.cambio, idioma), periodoTexto: largo,
    etiqueta: en
      ? `Sum of the ${s.incluidos} largest tokens, ${largo}: from ${millones(e.inicio, 'en')} (${fechaCorta(e.desde, 'en')}) to ${millones(e.fin, 'en')} (${fechaCorta(e.hasta, 'en')}), ${porcentaje(e.cambio, 'en')}. High ${millones(e.max.valor, 'en')}, low ${millones(e.min.valor, 'en')}.`
      : `Suma de los ${s.incluidos} mayores tokens, ${largo}: de ${millones(e.inicio)} (${fechaCorta(e.desde)}) a ${millones(e.fin)} (${fechaCorta(e.hasta)}), ${porcentaje(e.cambio)}. Máximo ${millones(e.max.valor)}, mínimo ${millones(e.min.valor)}.`,
  };
}
/* La línea que explica el gráfico, siempre a la vista: cuántos entran, su
   cuota del total de hoy y, si los hay, cuántos quedan fuera y por qué. */
function notaSerie(serie, idioma = 'es') {
  let s;
  try { s = validarSerie(serie); } catch { return ''; }
  const cob = numero(s.cobertura, 0, idioma) + (idioma === 'en' ? '%' : '\u00a0%');
  const huecos = s.discontinuos, sinLeer = s.pedidos - s.incluidos - s.discontinuos;
  // Los días que no se pintan (algún token sin dato en los 3 días anteriores).
  const p = s.puntos, sinPintar = p.length < 2 ? 0 : Math.round((msFecha(p[p.length - 1].fecha) - msFecha(p[0].fecha)) / DIA_MS) + 1 - p.length;
  const todos = s.incluidos === s.pedidos;
  if (idioma === 'en') {
    return (todos ? `Sum of the ${s.pedidos} largest` : `Sum of ${s.incluidos} of the ${s.pedidos} largest`) +
      ` real-world-asset tokens tracked by CoinGecko (${cob} of today's total). If a token started trading within the period, it enters on that day.` +
      (huecos > 0 ? ` ${huecos} ${huecos === 1 ? 'is' : 'are'} left out because ${huecos === 1 ? 'its' : 'their'} CoinGecko history is missing days.` : '') +
      (sinLeer > 0 ? ` ${sinLeer} could not be read.` : '') +
      (sinPintar > 0 ? ` Days without complete data are not drawn (${sinPintar} in the series).` : '');
  }
  return (todos ? `Suma de los ${s.pedidos} mayores` : `Suma de ${s.incluidos} de los ${s.pedidos} mayores`) +
    ` tokens de activos reales que sigue CoinGecko (${cob} del total de hoy). Si un token empezó a cotizar dentro del periodo, entra ese día.` +
    (huecos > 0 ? ` Quedan fuera ${huecos} a los que les faltan días en CoinGecko.` : '') +
    (sinLeer > 0 ? (sinLeer === 1 ? ' No se pudo leer 1.' : ` No se pudieron leer ${sinLeer}.`) : '') +
    (sinPintar > 0 ? ` Los días sin dato completo no se pintan (${sinPintar} en la serie).` : '');
}
/* Coordenadas de los puntos en un dibujo de ancho «ancho» y alto «alto» (sin
   márgenes: los pone quien dibuja). x por fecha; y por la escala del eje. */
function coordenadas(g, ancho, alto) {
  if (!g) return [];
  const t = g.puntos, ms0 = msFecha(t[0].fecha), ms1 = msFecha(t[t.length - 1].fecha);
  const { lo, hi } = g.escala;
  return t.map(p => ({ x: ms1 > ms0 ? (msFecha(p.fecha) - ms0) / (ms1 - ms0) * ancho : 0,
    y: alto - (p.valor - lo) / (hi - lo) * alto }));
}
/* Los tramos de días seguidos de una pestaña, como pares [primero, último]
   de índices. Donde falta un día (no se pinta), la línea se corta: el dibujo
   no une dos días con una recta que parecería un dato. */
function tramosSeguidos(g) {
  if (!g) return [];
  const t = g.puntos, salida = [];
  let ini = 0;
  for (let i = 1; i <= t.length; i++) {
    if (i === t.length || msFecha(t[i].fecha) - msFecha(t[i - 1].fecha) > DIA_MS) { salida.push([ini, i - 1]); ini = i; }
  }
  return salida;
}
/* El trazo SVG de la línea y del área (hasta «suelo»), tramo a tramo. */
function trazosSvg(coords, tramos, suelo) {
  const f = n => n.toFixed(1);
  let linea = '', area = '';
  for (const [a, b] of tramos) {
    const parte = coords.slice(a, b + 1).map((c, k) => (k ? 'L' : 'M') + f(c.x) + ' ' + f(c.y)).join(' ');
    linea += (linea ? ' ' : '') + parte;
    area += (area ? ' ' : '') + parte + ` L${f(coords[b].x)} ${f(suelo)} L${f(coords[a].x)} ${f(suelo)} Z`;
  }
  return { linea, area };
}
/* El punto más cercano a una «x» (para la cruz). */
function indiceCercano(coords, x) {
  let mejor = 0;
  for (let i = 1; i < coords.length; i++) if (Math.abs(coords[i].x - x) < Math.abs(coords[mejor].x - x)) mejor = i;
  return mejor;
}

module.exports = { FUENTE, TOTAL, TIPOS, ORO, PERIODOS, MARGEN_DIAS, historicoVacio, extraerFoto, validarFoto, validarHistorico,
  anadirFoto, serializarHistorico, resumir, resumenValido, millones, porcentaje, cuota, direccion, fechaCorta, fechaBreve, horaDato, fechaDe,
  fechaLlegada, alturasLinea, textosLinea, millonesHablados, cambioPct, resumenCompacto, colorTipo, COLORES_COMPACTO,
  SERIE, PESTANAS, PESTANA_INICIAL, urlHistoria, elegirMayores, historiaToken, construirSerie, validarSerie, serializarSerie, serieValida,
  diasSinDato, tramo, estadisticasTramo, escalaValores, marcaValor, marcasFechas, graficoPestana, notaSerie, coordenadas, indiceCercano, tramosSeguidos, trazosSvg };

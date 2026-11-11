'use strict';
/* ---------------------------------------------------------------------
   «Calcula tus números» (11/11/2026)
   ---------------------------------------------------------------------
   Un solo motor para la web (assets/calculadora-modelo-20261111.js, copia
   exacta envuelta por rwadar-app/calculadora/copiar-modelo-web.cjs) y la
   app (componentes/CalculadoraInicio.js). Sin dependencias, sin red y sin
   Intl (Hermes): recibe números escritos por la persona y devuelve datos y
   textos ya formateados («1.234,56 €», «4,0 %»).

   Cuentas claras y sin trucos:
   - Lo que pones (I). Si hay comisión de entrada (ce), la plataforma se
     queda ce·I y se invierte I·(1 − ce). Con precio de participación (p)
     se compran participaciones enteras: n = ⌊I·(1 − ce) / p⌋; lo
     invertido es n·p, lo que pagas por ellas, n·p / (1 − ce), y lo que
     sobra no se invierte (te lo quedas). G = lo que pagas de verdad.
   - Cada año, sobre el capital de principio de año (K): rendimiento K·r
     y comisión anual K·ca.
   - «Lo cobro» (interés simple): lo que queda (K·(r − ca)) se cobra cada
     año y paga impuestos ese año sobre lo cobrado (t). Si el año sale en
     negativo, no se cobra nada y la pérdida baja el capital.
   - «Lo reinvierto» (interés compuesto): K pasa a K·(1 + r − ca) y los
     impuestos se pagan al final, al vender, sobre la ganancia acumulada
     (lo que vale al final menos G): en España un fondo o un token suele
     tributar al venderlo, no cada año.
   - Los impuestos se aplican a la ganancia, nunca al capital. Sin
     ganancia no hay impuesto (no se cuentan pérdidas que pudieras
     compensar con otras ganancias).

   Impuestos por defecto, 19 %: desde el 1 de enero de 2025, la base del
   ahorro del IRPF (intereses, dividendos y ganancias al vender) tributa
   por tramos: 19 % hasta 6.000 €, 21 % hasta 50.000 €, 23 % hasta
   200.000 €, 27 % hasta 300.000 € y 30 % desde ahí. Es la suma de la
   escala estatal (9,5 / 10,5 / 11,5 / 13,5 / 15 %) y de la autonómica,
   igual (arts. 66 y 76 de la Ley del IRPF, cambiados por la disposición
   final 7.ª de la Ley 7/2024). Fuente primaria, la AEAT:
   https://sede.agenciatributaria.gob.es/Sede/irpf/novedades-impuesto/novedades-normativa-2024.html
   (leída el 11/11/2026). La calculadora aplica un solo tipo, el que
   pongas; no calcula el IRPF de nadie, y así lo dice su nota.
   --------------------------------------------------------------------- */

const LIMITES = Object.freeze({
  inversion: Object.freeze({ min: 1, max: 10000000, unidad: 'euros' }),
  rentabilidad: Object.freeze({ min: -20, max: 30, unidad: 'porcentaje' }),
  anios: Object.freeze({ min: 1, max: 40, unidad: 'anios', entero: true }),
  comisionAnual: Object.freeze({ min: 0, max: 10, unidad: 'porcentaje' }),
  comisionEntrada: Object.freeze({ min: 0, max: 10, unidad: 'porcentaje' }),
  impuestos: Object.freeze({ min: 0, max: 50, unidad: 'porcentaje' }),
  valorActivo: Object.freeze({ min: 1, max: 100000000000, unidad: 'euros', opcional: true }),
  precioParticipacion: Object.freeze({ min: 0.01, max: 10000000, unidad: 'euros', opcional: true }),
});
const CAMPOS = Object.freeze(Object.keys(LIMITES));
const MODOS = Object.freeze(['cobrar', 'reinvertir']);
/* El ejemplo de partida, editable («Ejemplo: cámbialo»). */
const PREDETERMINADOS = Object.freeze({
  inversion: 1000, rentabilidad: 4, anios: 5, modo: 'cobrar',
  comisionAnual: 0, comisionEntrada: 0, impuestos: 19, valorActivo: null, precioParticipacion: null,
});
const IMPORTES_RAPIDOS = Object.freeze([500, 1000, 5000, 10000]);
/* El explicador «¿Qué es tokenizar?»: un local de 300.000 € en trozos de 100 €. */
const EJEMPLO_EXPLICADOR = Object.freeze({ valorActivo: 300000, precioParticipacion: 100 });
const IMPUESTOS_NOTA = Object.freeze({
  es: 'En España, la ganancia del ahorro tributa del 19 % al 30 % según cuánto ganes.',
  en: 'In Spain, savings income is taxed at 19% to 30% depending on how much you earn.',
});
const MAX_OFERTAS = 8;

const tx = (idioma, es, en) => (idioma === 'en' ? en : es);
const finito = (v) => typeof v === 'number' && Number.isFinite(v);

/* ---- Leer lo que escribe la persona ----
   Acepta «10.000», «10 000», «1.000,50», «2,5», «2.5», «1,000», «−3» y,
   a medio escribir, «12,» y «,5».
   Una sola marca entre una a tres cifras (que no sean solo ceros) y
   exactamente tres cifras es de miles en los importes («10.000», «1,000»);
   «1234.567» o «0,500» son decimales. En los porcentajes y los años, una
   sola marca es siempre decimal («2.840» no es un tipo). */
function leerNumero(texto, { miles = true } = {}) {
  if (typeof texto === 'number') return finito(texto) ? { ok: true, valor: texto === 0 ? 0 : texto } : { ok: false, error: 'formato' };
  if (typeof texto !== 'string') return { ok: false, error: 'vacio' };
  let s = texto.replace(/[\s   ]/g, '').replace(/€|eur(?:os?)?|%|años?|years?/gi, '');
  s = s.replace(/[−‒–]/g, '-');
  if (!s) return { ok: false, error: 'vacio' };
  let signo = 1;
  if (/^[+-]/.test(s)) { if (s[0] === '-') signo = -1; s = s.slice(1); }
  // A medio escribir: «12,» vale 12 y «,5», 0,5 (que no salte un error al teclear).
  if (/^\d+[.,]$/.test(s)) s = s.slice(0, -1);
  else if (/^[.,]\d+$/.test(s)) s = '0' + s;
  if (!/^[\d.,]+$/.test(s) || !/\d/.test(s) || /^[.,]|[.,]$/.test(s)) return { ok: false, error: 'formato' };
  const puntos = (s.match(/\./g) || []).length, comas = (s.match(/,/g) || []).length;
  let normal;
  if (puntos && comas) {
    // La última marca es la decimal; las otras, de miles («1.234,56» o «1,234.56»).
    const dec = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ',';
    const mil = dec === '.' ? ',' : '.';
    const [entera, decimales, ...resto] = s.split(dec);
    if (resto.length || decimales.includes(mil) || !/^\d{1,3}([.,]\d{3})*$/.test(entera) || entera.includes(dec)) return { ok: false, error: 'formato' };
    normal = entera.split(mil).join('') + '.' + decimales;
  } else if (puntos + comas > 1) {
    // Varias marcas iguales: son de miles y van de tres en tres («1.000.000»).
    const mil = puntos ? '.' : ',';
    if (!new RegExp('^\\d{1,3}(\\' + mil + '\\d{3})+$').test(s)) return { ok: false, error: 'formato' };
    normal = s.split(mil).join('');
  } else if (puntos + comas === 1) {
    const [entera, decimales] = s.split(/[.,]/);
    normal = miles && decimales.length === 3 && /^\d{1,3}$/.test(entera) && !/^0+$/.test(entera) ? entera + decimales : entera + '.' + decimales;
  } else normal = s;
  const valor = signo * Number(normal);
  return finito(valor) ? { ok: true, valor: valor === 0 ? 0 : valor } : { ok: false, error: 'formato' };
}

/* ---- Formato (español: «1.234,56 €», «4,0 %»; inglés: «€1,234.56», «4.0%») ---- */
function redondear(v, d = 2) {
  const f = Math.pow(10, d), signo = v < 0 ? -1 : 1;
  return signo * Math.round(Math.abs(v) * f + 1e-9) / f;
}
function numero(v, idioma = 'es', d = 0) {
  if (!finito(v)) return '—';
  const r = redondear(v, d);
  const [entera, dec] = Math.abs(r).toFixed(d).split('.');
  const mil = idioma === 'en' ? ',' : '.', coma = idioma === 'en' ? '.' : ',';
  const grupos = entera.replace(/\B(?=(\d{3})+(?!\d))/g, mil);
  return (r < 0 ? '−' : '') + grupos + (dec ? coma + dec : '');
}
/* Céntimos solo si los hay y la cifra es pequeña: «1.000 €», «32,40 €», «12.166 €». */
function decimalesEuros(v) {
  if (!finito(v)) return 0;
  const r = redondear(v, 2);
  return Math.abs(r) >= 100000 || Math.round(Math.abs(r) * 100) % 100 === 0 ? 0 : 2;
}
function euros(v, idioma = 'es', d = decimalesEuros(v)) {
  if (!finito(v)) return '—';
  const n = numero(v, idioma, d);
  return idioma === 'en' ? (n.startsWith('−') ? '−€' + n.slice(1) : '€' + n) : n + ' €';
}
/* Una cifra «de unos»: de 100 € para arriba, sin céntimos (el titular y el gráfico). */
function eurosAprox(v, idioma = 'es') {
  return euros(v, idioma, finito(v) && Math.abs(v) >= 100 ? 0 : decimalesEuros(v));
}
function porcentaje(v, idioma = 'es', d = 1) {
  if (!finito(v)) return '—';
  return numero(v, idioma, d) + (idioma === 'en' ? '%' : ' %');
}
/* Lo que se escribe en un campo: sin unidad y con los decimales justos
   («1.000», «2,84»). Los importes, con céntimos como mucho; los
   porcentajes, hasta 4 decimales: al salir del campo no se cambia la cifra
   que puso la persona («2,845» sigue siendo 2,845). */
function valorCampo(v, idioma = 'es', campo = 'inversion') {
  if (!finito(v)) return '';
  const l = LIMITES[campo], euros = l?.unidad === 'euros', tope = l?.entero ? 0 : euros ? 2 : 4;
  let d = 0;
  while (d < tope && Math.abs(redondear(v, d) - v) > 1e-9) d++;
  if (euros && d === 1) d = 2;   // «1.000,50», no «1.000,5»
  return numero(v, idioma, d).replace('−', '-');
}
function anios(n, idioma = 'es') {
  return idioma === 'en' ? `${n} ${n === 1 ? 'year' : 'years'}` : `${n} ${n === 1 ? 'año' : 'años'}`;
}
function fechaCorta(iso, idioma = 'es') {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? (idioma === 'en' ? `${m[3]}/${m[2]}/${m[1]}` : `${m[3]}/${m[2]}/${m[1]}`) : '';
}

/* ---- Validar ---- */
function textoLimite(campo, idioma) {
  const l = LIMITES[campo];
  const f = (v) => (l.unidad === 'euros' ? euros(v, idioma, v < 1 ? 2 : 0) : l.unidad === 'porcentaje' ? porcentaje(v, idioma, 0) : numero(v, idioma, 0));
  return { min: f(l.min), max: f(l.max) };
}
function mensajeError(error, idioma = 'es') {
  if (!error) return '';
  const { codigo, campo } = error;
  const l = campo && LIMITES[campo] ? textoLimite(campo, idioma) : null;
  switch (codigo) {
    case 'vacio': return tx(idioma, 'Escribe una cantidad.', 'Enter an amount.');
    case 'formato': return tx(idioma, 'Escribe solo números, por ejemplo 1.000 o 2,5.', 'Use numbers only, for example 1,000 or 2.5.');
    case 'entero': return tx(idioma, 'Pon un número entero de años, de 1 a 40.', 'Enter a whole number of years, from 1 to 40.');
    case 'rango':
      if (campo === 'anios') return tx(idioma, 'Pon entre 1 y 40 años.', 'Enter between 1 and 40 years.');
      return tx(idioma, `Pon entre ${l.min} y ${l.max}.`, `Enter between ${l.min} and ${l.max}.`);
    case 'activo-menor': return tx(idioma, 'El activo no puede valer menos de lo que inviertes: revisa los dos importes.',
      'The asset cannot be worth less than you invest: check both amounts.');
    case 'sin-participaciones': return tx(idioma,
      `Con ${euros(error.disponible, idioma)} no llegas a una participación de ${euros(error.precio, idioma)}: sube lo que inviertes o baja el precio.`,
      `${euros(error.disponible, idioma)} does not buy one ${euros(error.precio, idioma)} unit: invest more or lower the price.`);
    default: return tx(idioma, 'Revisa este dato.', 'Check this figure.');
  }
}
/* entradas: textos (o números) por campo y el modo. Los opcionales vacíos
   valen 0 (comisiones), 0 (impuestos vacíos = sin impuestos) o null (activo
   y precio). Devuelve { ok, valores, errores: { campo: { codigo, campo } } }. */
function validarEntradas(entradas = {}) {
  const valores = {}, errores = {};
  for (const campo of CAMPOS) {
    const l = LIMITES[campo], bruto = entradas[campo];
    const vacio = bruto == null || (typeof bruto === 'string' && !bruto.trim());
    if (vacio) {
      if (l.opcional) { valores[campo] = null; continue; }
      if (campo === 'comisionAnual' || campo === 'comisionEntrada' || campo === 'impuestos') { valores[campo] = 0; continue; }
      errores[campo] = { codigo: 'vacio', campo }; continue;
    }
    const leido = leerNumero(bruto, { miles: l.unidad === 'euros' });
    if (!leido.ok) { errores[campo] = { codigo: leido.error === 'vacio' ? 'vacio' : 'formato', campo }; continue; }
    if (l.entero && !Number.isInteger(leido.valor)) { errores[campo] = { codigo: 'entero', campo }; continue; }
    if (leido.valor < l.min || leido.valor > l.max) { errores[campo] = { codigo: 'rango', campo }; continue; }
    valores[campo] = leido.valor;
  }
  valores.modo = MODOS.includes(entradas.modo) ? entradas.modo : PREDETERMINADOS.modo;
  if (!errores.inversion && !errores.comisionEntrada && !errores.precioParticipacion && valores.precioParticipacion != null) {
    const disponible = valores.inversion * (1 - valores.comisionEntrada / 100);
    if (Math.floor(disponible / valores.precioParticipacion + 1e-9) < 1) {
      errores.precioParticipacion = { codigo: 'sin-participaciones', campo: 'precioParticipacion', disponible, precio: valores.precioParticipacion };
    }
  }
  if (!Object.keys(errores).length && valores.valorActivo != null) {
    const invertido = capitalInicial(valores).capital;
    if (invertido > valores.valorActivo + 1e-9) errores.valorActivo = { codigo: 'activo-menor', campo: 'valorActivo' };
  }
  return { ok: !Object.keys(errores).length, valores, errores };
}

/* ---- Calcular ---- */
function capitalInicial({ inversion, comisionEntrada = 0, precioParticipacion = null }) {
  const ce = comisionEntrada / 100;
  if (precioParticipacion == null) {
    return { capital: inversion * (1 - ce), pagado: inversion, comisionEntrada: inversion * ce, sobra: 0, participaciones: null };
  }
  const participaciones = Math.floor(inversion * (1 - ce) / precioParticipacion + 1e-9);
  const capital = participaciones * precioParticipacion;
  const pagado = Math.min(inversion, capital / (1 - ce));
  return { capital, pagado, comisionEntrada: pagado - capital, sobra: Math.max(0, inversion - pagado), participaciones };
}
/* Devuelve null si los valores no pasan validarEntradas. */
function calcular(entrada) {
  const v = entrada && entrada.ok === true && entrada.valores ? entrada.valores : entrada;
  const comprobado = validarEntradas(v);
  if (!comprobado.ok) return null;
  const x = comprobado.valores;
  const r = x.rentabilidad / 100, ca = x.comisionAnual / 100, t = x.impuestos / 100, N = x.anios;
  const inicio = capitalInicial(x);
  const G = inicio.pagado;
  const tabla = [];
  let K = inicio.capital, cobradoNeto = 0, cobradoBruto = 0, impuestos = 0, comisiones = 0, rendimientos = 0;
  for (let anio = 1; anio <= N; anio++) {
    const capitalInicio = K, rendimiento = K * r, comision = K * ca, resto = rendimiento - comision;
    rendimientos += rendimiento; comisiones += comision;
    let impuesto = 0, cobrado = 0;
    if (x.modo === 'cobrar') {
      if (resto >= 0) { impuesto = resto * t; cobrado = resto - impuesto; cobradoBruto += resto; cobradoNeto += cobrado; impuestos += impuesto; }
      else K = Math.max(0, K + resto);
    } else K = Math.max(0, K + resto);
    const ganancia = K - G;
    const valorNeto = x.modo === 'cobrar' ? K + cobradoNeto : K - Math.max(0, ganancia) * t;
    tabla.push({ anio, capitalInicio, rendimiento, comision, impuestos: impuesto, cobrado, capitalFin: K, valorNeto });
  }
  let impuestosFinales = 0, finalBruto, finalNeto;
  if (x.modo === 'cobrar') { finalBruto = K + cobradoBruto; finalNeto = K + cobradoNeto; }
  else { impuestosFinales = Math.max(0, K - G) * t; impuestos = impuestosFinales; finalBruto = K; finalNeto = K - impuestosFinales; }
  const gananciaNeta = finalNeto - G;
  const rentNetaAnual = x.modo === 'cobrar' ? gananciaNeta / G / N * 100
    : finalNeto > 0 ? (Math.pow(finalNeto / G, 1 / N) - 1) * 100 : -100;
  const primero = tabla[0];
  const netoPrimero = x.modo === 'cobrar' ? primero.cobrado : primero.rendimiento - primero.comision;
  const resultado = {
    modo: x.modo, anios: N, valores: x,
    inversion: x.inversion, pagado: G, capital: inicio.capital, comisionEntrada: inicio.comisionEntrada, sobra: inicio.sobra,
    participaciones: inicio.participaciones, precioParticipacion: x.precioParticipacion, valorActivo: x.valorActivo,
    participacionesTotales: x.valorActivo != null && x.precioParticipacion != null ? x.valorActivo / x.precioParticipacion : null,
    porcentajeActivo: x.valorActivo != null ? inicio.capital / x.valorActivo * 100 : null,
    rentaActivo: x.valorActivo != null ? x.valorActivo * r : null,
    primerAnio: { bruto: primero.rendimiento, comision: primero.comision, impuestos: primero.impuestos, neto: netoPrimero, mes: netoPrimero / 12 },
    tabla, rendimientos, comisiones, impuestos, impuestosFinales, cobradoBruto, cobradoNeto,
    finalBruto, finalNeto, gananciaBruta: finalBruto - G, gananciaNeta,
    rentNetaAnual, tipoMedia: x.modo === 'cobrar' ? 'simple' : 'compuesta',
  };
  return resultado;
}

/* ---- Textos (los mismos en la web y en la app) ---- */
/* «ya con comisiones e impuestos», solo con lo que de verdad se ha restado. */
function conQue(x, idioma) {
  const com = x.comisionAnual > 0 || x.comisionEntrada > 0, imp = x.impuestos > 0;
  if (com && imp) return tx(idioma, 'ya con comisiones e impuestos', 'after fees and tax');
  if (com) return tx(idioma, 'ya con comisiones, sin impuestos', 'after fees, before tax');
  if (imp) return tx(idioma, 'ya con impuestos', 'after tax');
  return tx(idioma, 'sin comisiones ni impuestos', 'with no fees or tax');
}
function resumen(res, idioma = 'es') {
  if (!res) return { titular: tx(idioma, 'Revisa los datos marcados para ver el resultado.', 'Check the highlighted figures to see the result.'), detalle: '', signo: 'error' };
  const N = anios(res.anios, idioma), e = (v) => euros(v, idioma);
  // En el titular («unos …»), de 100 € para arriba, sin céntimos.
  const aprox = (v) => eurosAprox(v, idioma);
  const signo = res.gananciaNeta > 0.005 ? 'gana' : res.gananciaNeta < -0.005 ? 'pierde' : 'igual';
  const media = porcentaje(res.rentNetaAnual, idioma, res.modo === 'cobrar' ? 2 : 1);
  if (res.modo === 'cobrar' && res.primerAnio.neto > 0.005) {
    return { signo,
      titular: tx(idioma, `Cobrarías unos ${aprox(res.primerAnio.neto)} al año (${aprox(res.primerAnio.mes)} al mes)`,
        `You would receive about ${aprox(res.primerAnio.neto)} a year (${aprox(res.primerAnio.mes)} a month)`),
      detalle: signo === 'gana'
        ? tx(idioma, `Ganancia neta en ${N}: ${e(res.gananciaNeta)}, un ${media} al año, ${conQue(res.valores, idioma)}.`,
          `Net gain over ${N}: ${e(res.gananciaNeta)}, ${media} a year, ${conQue(res.valores, idioma)}.`)
        : tx(idioma, `Al cabo de ${N}, con lo cobrado, tendrías ${e(res.finalNeto)}: ${signo === 'igual' ? 'lo mismo que pusiste' : e(-res.gananciaNeta) + ' menos de lo que pusiste'}.`,
          `After ${N}, including what you received, you would have ${e(res.finalNeto)}: ${signo === 'igual' ? 'the same as you put in' : e(-res.gananciaNeta) + ' less than you put in'}.`) };
  }
  if (res.modo === 'cobrar') {
    return { signo,
      titular: tx(idioma, `No cobrarías nada: al cabo de ${N} tendrías ${aprox(res.finalNeto)}`, `You would receive nothing: after ${N} you would have ${aprox(res.finalNeto)}`),
      detalle: signo === 'pierde' ? tx(idioma, `Pierdes ${e(-res.gananciaNeta)} de lo que pusiste.`, `You lose ${e(-res.gananciaNeta)} of what you put in.`)
        : tx(idioma, 'Lo mismo que pusiste: ni ganas ni pierdes.', 'The same as you put in: no gain, no loss.') };
  }
  return { signo,
    titular: tx(idioma, `Al cabo de ${N} tendrías unos ${aprox(res.finalNeto)}`, `After ${N} you would have about ${aprox(res.finalNeto)}`),
    detalle: signo === 'gana'
      ? tx(idioma, `Ganancia neta: ${e(res.gananciaNeta)}, como un ${media} al año, ${conQue(res.valores, idioma)}.`,
        `Net gain: ${e(res.gananciaNeta)}, like ${media} a year, ${conQue(res.valores, idioma)}.`)
      : signo === 'igual' ? tx(idioma, 'Lo mismo que pusiste: ni ganas ni pierdes.', 'The same as you put in: no gain, no loss.')
        : tx(idioma, `Pierdes ${e(-res.gananciaNeta)} de lo que pusiste.`, `You lose ${e(-res.gananciaNeta)} of what you put in.`) };
}

/* La cuenta paso a paso: [{ op, res }]. Nada escondido. */
function pasos(res, idioma = 'es') {
  if (!res) return [];
  const e = (v) => euros(v, idioma), p = (v, d = 1) => porcentaje(v, idioma, d), x = res.valores, lista = [];
  const add = (op, r) => lista.push({ op, res: r });
  add(tx(idioma, 'Lo que pones', 'What you put in'), e(res.inversion));
  if (x.comisionEntrada > 0) {
    add(tx(idioma, `Comisión de entrada del ${p(x.comisionEntrada)}`, `${p(x.comisionEntrada)} entry fee`), '−' + e(res.comisionEntrada).replace('−', ''));
  }
  if (res.participaciones != null) {
    add(tx(idioma, `Participaciones de ${e(res.precioParticipacion)} que compras`, `${e(res.precioParticipacion)} units you buy`),
      tx(idioma, `${numero(res.participaciones, idioma)} (${e(res.capital)})`, `${numero(res.participaciones, idioma)} (${e(res.capital)})`));
    if (res.sobra > 0.005) add(tx(idioma, 'Te sobra (no se invierte)', 'Left over (not invested)'), e(res.sobra));
  } else if (x.comisionEntrada > 0) add(tx(idioma, 'Se invierte', 'Invested'), e(res.capital));
  if (res.valorActivo != null) {
    const total = res.participacionesTotales;
    const deTotal = total != null && Math.abs(total - Math.round(total)) < 1e-9
      ? tx(idioma, ` (${numero(res.participaciones, idioma)} de ${numero(total, idioma)})`, ` (${numero(res.participaciones, idioma)} of ${numero(total, idioma)})`) : '';
    add(tx(idioma, `Parte del activo de ${e(res.valorActivo)} que es tuya${deTotal}`, `Share of the ${e(res.valorActivo)} asset that is yours${deTotal}`),
      p(res.porcentajeActivo, res.porcentajeActivo < 10 ? 2 : 1));
    add(tx(idioma, `El activo entero rinde un ${p(x.rentabilidad)} al año`, `The whole asset yields ${p(x.rentabilidad)} a year`), e(res.rentaActivo));
  }
  add(tx(idioma, `Rendimiento del primer año: ${p(x.rentabilidad)} de ${e(res.capital)}`, `First-year return: ${p(x.rentabilidad)} of ${e(res.capital)}`), e(res.primerAnio.bruto));
  if (x.comisionAnual > 0) {
    add(tx(idioma, `Comisión anual del ${p(x.comisionAnual)} sobre el capital`, `${p(x.comisionAnual)} annual fee on the capital`), '−' + e(res.primerAnio.comision).replace('−', ''));
  }
  if (res.modo === 'cobrar') {
    if (x.impuestos > 0 && res.primerAnio.impuestos > 0) {
      add(tx(idioma, `Impuestos del ${p(x.impuestos, 0)} sobre lo que cobras`, `${p(x.impuestos, 0)} tax on what you receive`), '−' + e(res.primerAnio.impuestos));
    }
    add(tx(idioma, 'Cobras el primer año', 'You receive in the first year'), e(res.primerAnio.neto));
    add(x.impuestos > 0 ? tx(idioma, `Cobrado en ${anios(res.anios, idioma)}, ya con impuestos`, `Received over ${anios(res.anios, idioma)}, after tax`)
      : tx(idioma, `Cobrado en ${anios(res.anios, idioma)}`, `Received over ${anios(res.anios, idioma)}`), e(res.cobradoNeto));
    add(tx(idioma, 'Tu capital al final', 'Your capital at the end'), e(res.tabla[res.tabla.length - 1].capitalFin));
  } else {
    add(tx(idioma, `Reinviertes ${anios(res.anios, idioma)}: tu capital al final, antes de impuestos`, `Reinvested for ${anios(res.anios, idioma)}: your capital at the end, before tax`), e(res.finalBruto));
    if (x.impuestos > 0) {
      add(tx(idioma, `Impuestos del ${p(x.impuestos, 0)} al vender, sobre lo ganado (${e(Math.max(0, res.finalBruto - res.pagado))})`,
        `${p(x.impuestos, 0)} tax when you sell, on the gain (${e(Math.max(0, res.finalBruto - res.pagado))})`), '−' + e(res.impuestosFinales));
    }
  }
  add(tx(idioma, 'Lo que tendrías al final, neto', 'What you would have at the end, net'), e(res.finalNeto));
  add(tx(idioma, `Ganancia neta (sobre los ${e(res.pagado)} que pagas)`, `Net gain (on the ${e(res.pagado)} you pay)`), e(res.gananciaNeta));
  add(res.modo === 'cobrar' ? tx(idioma, 'Rentabilidad neta media al año', 'Average net return per year')
    : tx(idioma, 'Rentabilidad neta equivalente al año (compuesta)', 'Equivalent net return per year (compound)'),
  p(res.rentNetaAnual, res.modo === 'cobrar' ? 2 : 1));
  return lista;
}
/* Una línea que explica cómo se cuentan los impuestos en el modo elegido, y
   otra que dice lo que no sabemos: cómo tributa cada producto y cada
   persona (por eso no se afina más). */
function notaImpuestos(modo, idioma = 'es') {
  const regla = modo === 'reinvertir'
    ? tx(idioma, 'Si reinviertes, pagas impuestos al final, al vender, sobre lo ganado: en España un fondo o un token suele tributar así.',
      'If you reinvest, you pay tax at the end, when you sell, on the gain: in Spain a fund or a token is usually taxed this way.')
    : tx(idioma, 'Si cobras, pagas impuestos cada año sobre lo que cobras.', 'If you take the payouts, you pay tax every year on what you receive.');
  return regla + ' ' + tx(idioma, 'Es una aproximación con un solo tipo: cada producto y cada persona pueden tributar distinto.',
    'It is an approximation with a single rate: each product and each person may be taxed differently.');
}

/* «sin comisiones · impuestos 19 %», junto a «Afinar»: lo que hay dentro sin abrirlo. */
function resumenAfinar(v, idioma = 'es') {
  if (!v) return '';
  const p = (x) => porcentaje(x, idioma, redondear(x, 2) % 1 ? 2 : 0), partes = [];
  if (v.comisionAnual > 0) partes.push(tx(idioma, 'comisión anual ', 'annual fee ') + p(v.comisionAnual));
  if (v.comisionEntrada > 0) partes.push(tx(idioma, 'entrada ', 'entry fee ') + p(v.comisionEntrada));
  if (!(v.comisionAnual > 0) && !(v.comisionEntrada > 0)) partes.push(tx(idioma, 'sin comisiones', 'no fees'));
  partes.push(v.impuestos > 0 ? tx(idioma, 'impuestos ', 'tax ') + p(v.impuestos) : tx(idioma, 'sin impuestos', 'no tax'));
  if (v.valorActivo != null) partes.push(tx(idioma, 'activo ', 'asset ') + euros(v.valorActivo, idioma));
  if (v.precioParticipacion != null) partes.push(tx(idioma, 'participación ', 'unit ') + euros(v.precioParticipacion, idioma));
  return partes.join(' · ');
}

/* ---- El minigráfico: una barra por año con lo que tendrías (neto) ---- */
function barras(res, { ancho = 320, alto = 140, margenArriba = 18, margenAbajo = 22 } = {}) {
  if (!res) return null;
  const valores = res.tabla.map((f) => f.valorNeto);
  const base = res.pagado;
  const techo = Math.max(base, ...valores) || 1;
  const util = alto - margenArriba - margenAbajo;
  const n = valores.length, hueco = n > 20 ? 2 : n > 10 ? 3 : 6;
  const anchoBarra = Math.max(2, (ancho - hueco * (n - 1)) / n);
  const y = (v) => margenArriba + util - Math.max(0, v) / techo * util;
  return {
    ancho, alto, base, yBase: y(base), suelo: margenArriba + util,
    barras: valores.map((v, i) => {
      const x = i * (anchoBarra + hueco);
      const arriba = y(v), corte = y(Math.min(v, base));
      return { anio: i + 1, valor: v, x, ancho: anchoBarra, y: arriba, alto: margenArriba + util - arriba,
        // Parte de lo que pusiste (abajo) y de lo ganado (arriba, si lo hay).
        yGanancia: arriba, altoGanancia: Math.max(0, corte - arriba), yPuesto: corte, altoPuesto: margenArriba + util - corte,
        gana: v > base + 0.005 };
    }),
    etiquetas: n === 1 ? [1] : n <= 6 ? valores.map((_, i) => i + 1) : [1, Math.ceil(n / 2), n],
  };
}

/* Lo mismo que el gráfico, dicho en una frase para el lector de pantalla (la
   web lleva además una tabla; la app, esta etiqueta). */
function descripcionBarras(res, idioma = 'es') {
  if (!res) return '';
  const filas = res.tabla.map((f) => tx(idioma, `año ${f.anio}, ${euros(f.valorNeto, idioma)}`, `year ${f.anio}, ${euros(f.valorNeto, idioma)}`));
  return tx(idioma, `Lo que tendrías cada año, neto, sobre ${euros(res.pagado, idioma)} que pones: `,
    `What you would have each year, net, on the ${euros(res.pagado, idioma)} you put in: `) + filas.join('; ') + '.';
}

/* ---- «Usa la rentabilidad de una oferta» ----
   Las ofertas del catálogo con rentabilidad publicada y vigente: la misma
   regla que la vigencia de la web (estadoVigenciaLocal) y la app
   (transparencia.js): solo principales, revisión «actual» y dentro de su
   plazo en días UTC. El orden es el del catálogo: nunca por rentabilidad. */
function fechaIsoValida(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false;
  const d = new Date(s + 'T00:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
function leerPorcentajePublicado(texto) {
  const m = /^\s*([+−-]?\d{1,2}(?:[.,]\d{1,3})?)\s*%\s*$/.exec(String(texto || ''));
  if (!m) return null;
  const v = Number(m[1].replace('−', '-').replace(',', '.'));
  return finito(v) && v >= LIMITES.rentabilidad.min && v <= LIMITES.rentabilidad.max ? v : null;
}
function nombreCorto(titulo) {
  let t = String(titulo || '').split(/:\s| · | — | - /)[0].trim();
  if (t.length > 40) t = t.slice(0, 39).replace(/\s+\S*$/, '') + '…';
  return t;
}
function fechaRentabilidad(o) {
  const mostrada = o.rentabilidad && o.rentabilidad.mostrada;
  const ref = ((o.documentacion && o.documentacion.referencias) || []).find((r) => r && r.valor === mostrada && fechaIsoValida(r.fechaDato));
  if (ref) return ref.fechaDato;
  const met = (o.metricas || []).find((m) => m && /^Rentabilidad publicada/.test(m.etiqueta || '') && m.valor === mostrada);
  const f = met && /(\d{2})\/(\d{2})\/(\d{4})/.exec(met.etiqueta);
  if (f && fechaIsoValida(`${f[3]}-${f[2]}-${f[1]}`)) return `${f[3]}-${f[2]}-${f[1]}`;
  return fechaIsoValida(o.verificadaEl) ? o.verificadaEl : null;
}
function monedaOferta(o) {
  const mon = (o.metricas || []).find((m) => m && m.etiqueta === 'Moneda');
  const rent = (o.metricas || []).find((m) => m && /^Rentabilidad publicada/.test(m.etiqueta || ''));
  if ((mon && /^USD\b/.test(mon.valor || '')) || (rent && /\b(?:en )?USD\b/.test(rent.etiqueta)) ||
    /en dólares/i.test((o.rentabilidad && o.rentabilidad.literal) || '')) return 'USD';
  if (mon && /^EUR\b/.test(mon.valor || '')) return 'EUR';
  return null;
}
function vigente(o, ahora) {
  if (o.coleccion != null && o.coleccion !== 'principales') return false;
  if (o.estadoRevision !== 'actual' || !fechaIsoValida(o.verificadaEl)) return false;
  const ttl = Number(o.vigenciaDias), reloj = new Date(ahora);
  if (!Number.isInteger(ttl) || ttl < 1 || !Number.isFinite(reloj.getTime())) return false;
  const base = Date.parse(o.verificadaEl + 'T00:00:00Z');
  const hoy = Date.UTC(reloj.getUTCFullYear(), reloj.getUTCMonth(), reloj.getUTCDate());
  return base <= hoy && Math.floor((base + ttl * 86400000 - hoy) / 86400000) >= 0;
}
function ofertasConRentabilidad(ofertas, { ahora = new Date(), catalogoVigente = true } = {}) {
  if (!catalogoVigente || !Array.isArray(ofertas)) return [];
  const vistos = new Set(), lista = [];
  for (const o of ofertas) {
    if (!o || typeof o !== 'object' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(o.slug || '') || vistos.has(o.slug)) continue;
    if (!vigente(o, ahora) || !o.rentabilidad) continue;
    const valor = leerPorcentajePublicado(o.rentabilidad.mostrada);
    const fecha = fechaRentabilidad(o);
    if (valor == null || !fecha || fecha > new Date(ahora).toISOString().slice(0, 10)) continue;
    vistos.add(o.slug);
    const moneda = monedaOferta(o);
    lista.push({ slug: o.slug, nombre: nombreCorto(o.titulo), titulo: String(o.titulo), plataforma: String(o.plataformaNombre || ''),
      rentabilidad: valor, texto: o.rentabilidad.mostrada.trim(), fecha, moneda, enDolares: moneda === 'USD', ficha: '/ofertas/' + o.slug });
    if (lista.length >= MAX_OFERTAS) break;
  }
  return lista;
}
function textoOferta(of, idioma = 'es') {
  return `${of.nombre} · ${porcentaje(of.rentabilidad, idioma, 2)} · ${fechaCorta(of.fecha, idioma)}`;
}
/* Lo que oye el lector de pantalla en el chip. */
function etiquetaOferta(of, idioma = 'es') {
  const pct = porcentaje(of.rentabilidad, idioma, 2), fecha = fechaCorta(of.fecha, idioma);
  return tx(idioma, `Usar el ${pct} de ${of.nombre}, publicado el ${fecha}${of.enDolares ? ', en dólares' : ''}`,
    `Use ${pct} from ${of.nombre}, published on ${fecha}${of.enDolares ? ', in US dollars' : ''}`);
}
function notaOferta(of, idioma = 'es') {
  if (!of) return '';
  const base = tx(idioma,
    `Rentabilidad que publicó ${of.plataforma || 'la oferta'} con fecha ${fechaCorta(of.fecha, idioma)}. Puede cambiar y no está garantizada; mira en su ficha si ya descuenta comisiones.`,
    `Return published by ${of.plataforma || 'the offer'} dated ${fechaCorta(of.fecha, idioma)}. It can change and is not guaranteed; check its page to see whether fees are already deducted.`);
  return of.enDolares ? base + ' ' + tx(idioma, 'Es en dólares: en euros, el resultado cambia con el tipo de cambio.',
    'It is in US dollars: in euros, the result changes with the exchange rate.') : base;
}

/* ---- El explicador «¿Qué es tokenizar?» ---- */
function tituloExplicador({ valorActivo, precioParticipacion }, idioma = 'es') {
  const total = valorActivo / precioParticipacion, exacto = Math.abs(total - Math.round(total)) < 1e-9;
  const n = numero(exacto ? total : Math.floor(total + 1e-9), idioma);
  return tx(idioma,
    `Un local de ${euros(valorActivo, idioma)}, partido en ${exacto ? '' : 'unos '}${n} trozos de ${euros(precioParticipacion, idioma)}`,
    `A ${euros(valorActivo, idioma)} property divided into ${exacto ? '' : 'about '}${n} units of ${euros(precioParticipacion, idioma)}`);
}

module.exports = {
  LIMITES, CAMPOS, MODOS, PREDETERMINADOS, IMPORTES_RAPIDOS, EJEMPLO_EXPLICADOR, IMPUESTOS_NOTA, MAX_OFERTAS,
  leerNumero, redondear, numero, euros, eurosAprox, porcentaje, valorCampo, anios, fechaCorta,
  validarEntradas, mensajeError, capitalInicial, calcular, resumen, pasos, notaImpuestos, resumenAfinar, barras, descripcionBarras,
  leerPorcentajePublicado, nombreCorto, ofertasConRentabilidad, textoOferta, etiquetaOferta, notaOferta, tituloExplicador,
};

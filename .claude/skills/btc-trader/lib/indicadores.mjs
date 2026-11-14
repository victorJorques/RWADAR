// Indicadores técnicos puros y causales: el valor en `i` usa solo 0..i
// (donchian y volumenRel, solo las velas ANTERIORES a i). Devuelven arrays
// alineados con la entrada y `null` donde no hay datos suficientes.
// Un valor no numérico (NaN, null…) deja null en las ventanas que lo tocan y
// reinicia los indicadores encadenados (EMA, RSI, ATR): mejor un hueco que un
// número inventado.

const DIA_MS = 86_400_000;

const lista = x => (Array.isArray(x) ? x : []);
const esNum = x => typeof x === 'number' && Number.isFinite(x);
const velaValida = v => v != null && esNum(v.h) && esNum(v.l) && esNum(v.c);

function periodo(nombre, n, minimo = 1) {
  if (!Number.isInteger(n) || n < minimo) {
    throw new Error(`${nombre}: el periodo debe ser un entero mayor o igual que ${minimo} (llegó ${String(n)}).`);
  }
}

/** Media simple de las últimas n (incluida la actual). */
export function sma(valores, n) {
  periodo('sma', n);
  const v = lista(valores);
  const out = new Array(v.length).fill(null);
  let suma = 0;
  let malos = 0;
  for (let i = 0; i < v.length; i++) {
    if (esNum(v[i])) suma += v[i]; else malos++;
    if (i >= n) {
      if (esNum(v[i - n])) suma -= v[i - n]; else malos--;
    }
    if (i >= n - 1 && malos === 0) out[i] = suma / n;
  }
  return out;
}

/** Media exponencial (k = 2/(n+1)); arranca con la media simple de los primeros n. */
export function ema(valores, n) {
  periodo('ema', n);
  const v = lista(valores);
  const out = new Array(v.length).fill(null);
  const k = 2 / (n + 1);
  let previa = null;
  let suma = 0;
  let cuenta = 0;
  for (let i = 0; i < v.length; i++) {
    if (!esNum(v[i])) { previa = null; suma = 0; cuenta = 0; continue; }
    if (previa === null) {
      suma += v[i];
      cuenta++;
      if (cuenta === n) { previa = suma / n; out[i] = previa; }
    } else {
      previa += k * (v[i] - previa);
      out[i] = previa;
    }
  }
  return out;
}

/**
 * RSI de Wilder. Primer valor en el índice n: media simple de las primeras n
 * subidas y bajadas; después, suavizado de Wilder ((previa·(n−1) + actual)/n).
 * Sin bajadas da 100; sin movimiento ninguno, 50.
 */
export function rsi(cierres, n = 14) {
  periodo('rsi', n);
  const c = lista(cierres);
  const out = new Array(c.length).fill(null);
  let anterior = null;
  let mediaSube = null;
  let mediaBaja = null;
  let sumaSube = 0;
  let sumaBaja = 0;
  let cuenta = 0;
  const valor = () => {
    if (mediaBaja === 0) return mediaSube === 0 ? 50 : 100;
    return 100 - 100 / (1 + mediaSube / mediaBaja);
  };
  for (let i = 0; i < c.length; i++) {
    if (!esNum(c[i])) {
      anterior = null; mediaSube = null; mediaBaja = null; sumaSube = 0; sumaBaja = 0; cuenta = 0;
      continue;
    }
    if (anterior === null) { anterior = c[i]; continue; }
    const d = c[i] - anterior;
    anterior = c[i];
    const sube = d > 0 ? d : 0;
    const baja = d < 0 ? -d : 0;
    if (mediaSube === null) {
      sumaSube += sube;
      sumaBaja += baja;
      cuenta++;
      if (cuenta === n) {
        mediaSube = sumaSube / n;
        mediaBaja = sumaBaja / n;
        out[i] = valor();
      }
    } else {
      mediaSube = (mediaSube * (n - 1) + sube) / n;
      mediaBaja = (mediaBaja * (n - 1) + baja) / n;
      out[i] = valor();
    }
  }
  return out;
}

/** Rango verdadero de cada vela (la primera, o tras un hueco, solo h − l). */
export function rangoVerdadero(velas) {
  const v = lista(velas);
  const out = new Array(v.length).fill(null);
  let cierrePrevio = null;
  for (let i = 0; i < v.length; i++) {
    if (!velaValida(v[i])) { cierrePrevio = null; continue; }
    const { h, l, c } = v[i];
    out[i] = cierrePrevio === null
      ? h - l
      : Math.max(h - l, Math.abs(h - cierrePrevio), Math.abs(l - cierrePrevio));
    cierrePrevio = c;
  }
  return out;
}

/**
 * ATR de Wilder: primer valor (índice n−1) = media simple de los n primeros
 * rangos verdaderos; después (previo·(n−1) + RV)/n.
 */
export function atr(velas, n = 14) {
  periodo('atr', n);
  const rv = rangoVerdadero(velas);
  const out = new Array(rv.length).fill(null);
  let previo = null;
  let suma = 0;
  let cuenta = 0;
  for (let i = 0; i < rv.length; i++) {
    if (rv[i] === null) { previo = null; suma = 0; cuenta = 0; continue; }
    if (previo === null) {
      suma += rv[i];
      cuenta++;
      if (cuenta === n) { previo = suma / n; out[i] = previo; }
    } else {
      previo = (previo * (n - 1) + rv[i]) / n;
      out[i] = previo;
    }
  }
  return out;
}

/** Bandas de Bollinger: media de n y ± k desviaciones típicas (poblacionales). */
export function bollinger(cierres, n = 20, k = 2) {
  periodo('bollinger', n);
  if (!esNum(k) || k < 0) throw new Error(`bollinger: k debe ser un número no negativo (llegó ${String(k)}).`);
  const c = lista(cierres);
  const media = sma(c, n);
  const sup = new Array(c.length).fill(null);
  const inf = new Array(c.length).fill(null);
  for (let i = 0; i < c.length; i++) {
    if (media[i] === null) continue;
    let var2 = 0;
    for (let j = i - n + 1; j <= i; j++) var2 += (c[j] - media[i]) ** 2;
    const desv = Math.sqrt(var2 / n);
    sup[i] = media[i] + k * desv;
    inf[i] = media[i] - k * desv;
  }
  return { media, sup, inf };
}

/**
 * Canal de Donchian de las n velas ANTERIORES (sin la actual): así «cerrar
 * por encima de max[i]» es una ruptura de verdad y no se mira la propia vela.
 */
export function donchian(velas, n = 20) {
  periodo('donchian', n);
  const v = lista(velas);
  const max = new Array(v.length).fill(null);
  const min = new Array(v.length).fill(null);
  // Colas monótonas de índices válidos: O(N) aunque n sea grande.
  const colaMax = [];
  const colaMin = [];
  let iniMax = 0;
  let iniMin = 0;
  let ultimoMalo = -1;
  for (let i = 0; i < v.length; i++) {
    if (i >= n && ultimoMalo < i - n) {
      while (colaMax[iniMax] < i - n) iniMax++;
      while (colaMin[iniMin] < i - n) iniMin++;
      max[i] = v[colaMax[iniMax]].h;
      min[i] = v[colaMin[iniMin]].l;
    }
    if (!velaValida(v[i])) { ultimoMalo = i; continue; }
    while (colaMax.length > iniMax && v[colaMax.at(-1)].h <= v[i].h) colaMax.pop();
    colaMax.push(i);
    while (colaMin.length > iniMin && v[colaMin.at(-1)].l >= v[i].l) colaMin.pop();
    colaMin.push(i);
  }
  return { max, min };
}

/** VWAP acumulado del día UTC (se reinicia a las 00:00 UTC). Precio típico (h+l+c)/3. */
export function vwapDiario(velas) {
  const v = lista(velas);
  const out = new Array(v.length).fill(null);
  let dia = null;
  let sumaPV = 0;
  let sumaV = 0;
  for (let i = 0; i < v.length; i++) {
    const x = v[i];
    if (!velaValida(x) || !esNum(x.t) || !esNum(x.v) || x.v < 0) continue;
    const d = Math.floor(x.t / DIA_MS);
    if (d !== dia) { dia = d; sumaPV = 0; sumaV = 0; }
    sumaPV += ((x.h + x.l + x.c) / 3) * x.v;
    sumaV += x.v;
    out[i] = sumaV > 0 ? sumaPV / sumaV : null;
  }
  return out;
}

/** Volumen de la vela / media del volumen de las n ANTERIORES. */
export function volumenRel(velas, n = 20) {
  periodo('volumenRel', n);
  const v = lista(velas);
  const vol = v.map(x => (x != null && esNum(x.v) && x.v >= 0 ? x.v : null));
  const out = new Array(v.length).fill(null);
  let suma = 0;
  let malos = 0;
  for (let i = 0; i < v.length; i++) {
    // La ventana es [i−n, i−1]: se calcula antes de meter la vela i.
    if (i >= n && malos === 0 && vol[i] !== null) {
      const media = suma / n;
      if (media > 0) out[i] = vol[i] / media;
    }
    if (vol[i] !== null) suma += vol[i]; else malos++;
    if (i >= n) {
      if (vol[i - n] !== null) suma -= vol[i - n]; else malos--;
    }
  }
  return out;
}

/**
 * Pivotes: un alto en j es más alto que las `izq` velas anteriores y no más
 * bajo que las `der` siguientes (con empate gana el primero). Solo se sabe en
 * j+der: confirmadoEn = j + der, y solo lo puede usar quien esté en i ≥ confirmadoEn.
 * Solo se devuelven los ya confirmados dentro de la serie.
 */
export function pivotes(velas, izq = 3, der = 3) {
  periodo('pivotes (izq)', izq, 1);
  periodo('pivotes (der)', der, 0);
  const v = lista(velas);
  const altos = [];
  const bajos = [];
  for (let j = izq; j + der < v.length; j++) {
    let valida = true;
    for (let k = j - izq; k <= j + der; k++) if (!velaValida(v[k])) { valida = false; break; }
    if (!valida) continue;
    let alto = true;
    let bajo = true;
    for (let k = j - izq; k < j && (alto || bajo); k++) {
      if (v[k].h >= v[j].h) alto = false;
      if (v[k].l <= v[j].l) bajo = false;
    }
    for (let k = j + 1; k <= j + der && (alto || bajo); k++) {
      if (v[k].h > v[j].h) alto = false;
      if (v[k].l < v[j].l) bajo = false;
    }
    if (alto) altos.push({ i: j, t: v[j].t ?? null, precio: v[j].h, confirmadoEn: j + der });
    if (bajo) bajos.push({ i: j, t: v[j].t ?? null, precio: v[j].l, confirmadoEn: j + der });
  }
  return { altos, bajos };
}

/** Los pivotes que ya conoce quien está en la vela i (confirmadoEn ≤ i). */
export function pivotesHasta(piv, i) {
  const filtrar = xs => lista(xs).filter(p => p.confirmadoEn <= i);
  return { altos: filtrar(piv?.altos), bajos: filtrar(piv?.bajos) };
}

function intervaloDe(velas) {
  let minimo = Infinity;
  for (let i = 1; i < velas.length; i++) {
    const d = velas[i].t - velas[i - 1].t;
    if (d > 0 && d < minimo) minimo = d;
  }
  return Number.isFinite(minimo) ? minimo : null;
}

/**
 * Rango de apertura de cada día UTC: máximo y mínimo de los primeros
 * `minutos` desde las 00:00 UTC. Devuelve [{ dia, max, min, cierraEn,
 * confirmadoEn, n, completo }]:
 * - cierraEn: ms en que el rango queda cerrado (00:00 UTC + minutos).
 * - confirmadoEn: índice de la primera vela que cierra en o después de
 *   cierraEn (desde ahí se puede usar); null si aún no ha llegado.
 * - completo: la serie tiene la primera vela del día y el rango ya cerró.
 * `msVela` es el intervalo de las velas (si no se da, se deduce).
 * Con velas más largas que el rango no se puede medir: devuelve [].
 */
export function rangoApertura(velas, minutos = 60, msVela = null) {
  if (!esNum(minutos) || minutos <= 0 || minutos * 60_000 > DIA_MS) {
    throw new Error(`rangoApertura: los minutos deben estar entre 1 y 1440 (llegó ${String(minutos)}).`);
  }
  const v = lista(velas).filter(x => velaValida(x) && esNum(x.t));
  const indices = new Map(lista(velas).map((x, i) => [x, i]));
  const ms = msVela ?? intervaloDe(v);
  const largo = minutos * 60_000;
  if (ms !== null && ms > largo) return [];
  const porDia = new Map();
  for (const x of v) {
    const inicio = Math.floor(x.t / DIA_MS) * DIA_MS;
    const cierraEn = inicio + largo;
    let r = porDia.get(inicio);
    if (x.t < cierraEn) {
      if (!r) {
        r = { dia: new Date(inicio).toISOString().slice(0, 10), max: x.h, min: x.l, cierraEn, confirmadoEn: null, n: 0, primeraT: x.t };
        porDia.set(inicio, r);
      }
      r.max = Math.max(r.max, x.h);
      r.min = Math.min(r.min, x.l);
      r.n++;
    }
    // La primera vela que cierra en o después de cierraEn confirma el rango.
    if (r && r.confirmadoEn === null && ms !== null && x.t + ms >= cierraEn) r.confirmadoEn = indices.get(x);
  }
  return [...porDia.values()].map(({ primeraT, ...r }) => ({
    ...r,
    completo: r.confirmadoEn !== null && ms !== null && primeraT - Math.floor(primeraT / DIA_MS) * DIA_MS < ms,
  }));
}

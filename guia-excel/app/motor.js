/* Motor de la hoja de práctica: fórmulas de Excel en español (es-ES) sobre HyperFormula.
   - Acepta la sintaxis del Excel español: ";" entre argumentos, "," decimal, VERDADERO/FALSO sin paréntesis.
   - Corrige nombres que HyperFormula traduce distinto al Excel español real (FILTRAR, SI.ND, SIFECHA...).
   - Añade funciones que HyperFormula no trae (LET, CAMBIAR, PROMEDIO.SI.CONJUNTO, COINCIDIRX, ORDENARPOR,
     TEXTOANTES, TEXTODESPUES, DIVIDIRTEXTO, ELEGIRCOLS, ELEGIRFILAS, TOMAR, EXCLUIR, JERARQUIA.EQV, MODA.UNO, CONCAT...).
   - TEXTO entiende los códigos de formato en español (aaaa, dddd, mmmm, #.##0,00 €).
   - comprobar(): corrige un ejercicio comparando con la solución en varios escenarios. */
(function (root) {
  'use strict';

  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  /* Nombres del Excel español real que HyperFormula escribe distinto. clave = id interno (inglés). */
  const NOMBRES_REALES = {
    FILTER: 'FILTRAR', IFNA: 'SI.ND', DATEDIF: 'SIFECHA', DAYS: 'DIAS', ISFORMULA: 'ESFORMULA',
    ISOWEEKNUM: 'ISO.NUM.DE.SEMANA', XOR: 'XO', UNICHAR: 'UNICAR', 'CEILING.MATH': 'MULTIPLO.SUPERIOR.MAT',
    'FLOOR.MATH': 'MULTIPLO.INFERIOR.MAT', ARABIC: 'NUMERO.ARABE',
    'SKEW.P': 'COEFICIENTE.ASIMETRIA.P', PDURATION: 'P.DURACION', 'COVARIANCE.P': 'COVARIANCE.P', BITAND: 'BIT.Y', BITOR: 'BIT.O', BITXOR: 'BIT.XO',
    BITLSHIFT: 'BIT.DESPLIZQDA', BITRSHIFT: 'BIT.DESPLDCHA', 'ISO.CEILING': 'MULTIPLO.SUPERIOR.ISO',
    'CEILING.PRECISE': 'MULTIPLO.SUPERIOR.EXACTO', 'FLOOR.PRECISE': 'MULTIPLO.INFERIOR.EXACTO',
  };

  /* Funciones propias: id interno -> nombre español. */
  const PROPIAS = {
    CONCAT: 'CONCAT', XMATCH: 'COINCIDIRX', 'RANK.EQ': 'JERARQUIA.EQV', RANK: 'JERARQUIA', 'MODE.SNGL': 'MODA.UNO',
    TEXTBEFORE: 'TEXTOANTES', TEXTAFTER: 'TEXTODESPUES', SORTBY: 'ORDENARPOR', CHOOSECOLS: 'ELEGIRCOLS',
    CHOOSEROWS: 'ELEGIRFILAS', TAKE: 'TOMAR', DROP: 'EXCLUIR', TEXTSPLIT: 'DIVIDIRTEXTO', TOCOL: 'ENCOL', TOROW: 'ENFILA',
    'RANK.AVG': 'JERARQUIA.MEDIA', PERCENTOF: 'PORCENTAJEDE', NUMBERVALUE: 'VALOR.NUMERO', MODE: 'MODA',
  };

  /* ---------- Formato numérico/fecha con códigos españoles ---------- */
  function serialAFecha(n) { // serie de Excel (1900, con el 29/02/1900 ficticio ya corregido por HF: base 30/12/1899)
    const ms = Math.round((n - 25569) * 86400000);
    const d = new Date(ms);
    return { a: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), dow: d.getUTCDay(), h: d.getUTCHours(), mi: d.getUTCMinutes(), s: d.getUTCSeconds() };
  }
  function agrupar(entero) {
    return entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function numeroES(v, decimales, conMiles) {
    const neg = v < 0; let x = Math.abs(v);
    let s = decimales == null ? String(+x.toPrecision(15)) : x.toFixed(decimales);
    if (s.includes('e')) s = x.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 10 });
    let [e, f] = s.split('.');
    if (conMiles) e = agrupar(e);
    return (neg ? '-' : '') + e + (f ? ',' + f : '');
  }
  function esCodigoFecha(fmt) {
    const sin = fmt.replace(/"[^"]*"/g, '').replace(/\\./g, '');
    return /[dDaAyY]/.test(sin) || /[hH]/.test(sin) || /^m{1,4}$/i.test(sin.trim());
  }
  function formatearFecha(n, fmt) {
    const t = serialAFecha(n);
    let out = ''; let i = 0; const f = fmt; let ultimoFueHora = false;
    while (i < f.length) {
      const c = f[i];
      if (c === '"') { const j = f.indexOf('"', i + 1); out += f.slice(i + 1, j < 0 ? f.length : j); i = j < 0 ? f.length : j + 1; continue; }
      if (c === '\\') { out += f[i + 1] || ''; i += 2; continue; }
      const run = (ch) => { let k = i; while (k < f.length && f[k].toLowerCase() === ch) k++; return k - i; };
      const lc = c.toLowerCase();
      if (lc === 'd') { const k = run('d'); i += k; ultimoFueHora = false;
        out += k === 1 ? t.d : k === 2 ? String(t.d).padStart(2, '0') : k === 3 ? DIAS[t.dow].slice(0, 3) : DIAS[t.dow]; continue; }
      if (lc === 'a' || lc === 'y') { const k = run(lc); i += k; ultimoFueHora = false;
        out += k <= 2 ? String(t.a % 100).padStart(2, '0') : String(t.a); continue; }
      if (lc === 'm') { const k = run('m'); i += k;
        const resto = f.slice(i).replace(/"[^"]*"/g, '');
        const esMinuto = ultimoFueHora || /^[^dmay]*s/i.test(resto);
        if (esMinuto && k <= 2) { out += k === 1 ? t.mi : String(t.mi).padStart(2, '0'); }
        else out += k === 1 ? t.m : k === 2 ? String(t.m).padStart(2, '0') : k === 3 ? MESES[t.m - 1].slice(0, 3) : k === 4 ? MESES[t.m - 1] : MESES[t.m - 1][0];
        ultimoFueHora = false; continue; }
      if (lc === 'h') { const k = run('h'); i += k; out += k === 1 ? t.h : String(t.h).padStart(2, '0'); ultimoFueHora = true; continue; }
      if (lc === 's') { const k = run('s'); i += k; out += k === 1 ? t.s : String(t.s).padStart(2, '0'); continue; }
      out += c; i++;
    }
    return out;
  }
  function formatearNumero(v, fmtEntrada) {
    let fmt = fmtEntrada;
    const secciones = fmt.split(';');
    if (secciones.length > 1) {
      if (v < 0 && secciones[1]) { fmt = secciones[1]; v = Math.abs(v); }
      else if (v === 0 && secciones[2]) fmt = secciones[2];
      else fmt = secciones[0];
    }
    if (fmt.toLowerCase() === 'general' || fmt === '') return numeroES(v, null, false);
    // separar literales
    let pre = '', post = '', cuerpo = '';
    const m = fmt.match(/^([^0#?,.%]*)([0#?.,]+)(.*)$/);
    if (!m) return fmt.replace(/"/g, '');
    pre = m[1]; cuerpo = m[2]; post = m[3];
    const limpia = (s) => s.replace(/"([^"]*)"/g, '$1').replace(/\\(.)/g, '$1').replace(/_./g, ' ').replace(/\*./g, '');
    let pct = (post.match(/%/g) || []).length + (pre.match(/%/g) || []).length;
    let x = v * Math.pow(100, pct);
    const [ent, dec = ''] = cuerpo.split(',');
    const decimales = (dec.match(/[0#?]/g) || []).length;
    const opcionales = (dec.match(/#/g) || []).length;
    const miles = ent.includes('.');
    // escalado por punto final (#.##0. = miles)
    const ceros = (ent.replace(/\./g, '').match(/0/g) || []).length;
    let s = numeroES(Math.abs(x), decimales, miles);
    if (opcionales) { // quitar ceros opcionales del final
      let [e2, f2 = ''] = s.split(',');
      const minimos = decimales - opcionales;
      while (f2.length > minimos && f2.endsWith('0')) f2 = f2.slice(0, -1);
      s = e2 + (f2 ? ',' + f2 : '');
    }
    let [e3, f3] = s.split(',');
    const digitos = e3.replace(/\./g, '');
    if (digitos.length < ceros) { e3 = digitos.padStart(ceros, '0'); if (miles) e3 = agrupar(e3); }
    if (ceros === 0 && digitos === '0') e3 = '';
    s = e3 + (f3 ? ',' + f3 : '');
    return (x < 0 ? '-' : '') + limpia(pre) + s + limpia(post);
  }
  function formatear(valor, fmt) {
    if (valor === null || valor === undefined || valor === '') return '';
    if (typeof valor === 'boolean') return valor ? 'VERDADERO' : 'FALSO';
    if (typeof valor === 'object' && valor.value) return valor.value; // error
    if (typeof valor === 'string') return valor;
    if (typeof valor !== 'number' || !isFinite(valor)) return String(valor);
    if (!fmt) {
      // general: hasta 10 cifras significativas, coma decimal
      const r = +valor.toPrecision(10);
      return numeroES(r, null, false);
    }
    if (fmt === 'fecha') fmt = 'dd/mm/aaaa';
    if (fmt === 'eur') fmt = '#.##0,00 €';
    if (fmt === 'pct') fmt = '0%';
    if (fmt === 'pct1') fmt = '0,0%';
    if (fmt === 'num') fmt = '#.##0';
    if (fmt === 'num2') fmt = '#.##0,00';
    if (fmt === 'hora') fmt = 'hh:mm';
    return esCodigoFecha(fmt) ? formatearFecha(valor, fmt) : formatearNumero(valor, fmt);
  }

  /* ---------- Tokenizador mínimo de fórmulas ---------- */
  function tokenizar(f) {
    const t = []; let i = 0;
    while (i < f.length) {
      const c = f[i];
      if (c === '"') { let j = i + 1; while (j < f.length) { if (f[j] === '"' && f[j + 1] === '"') { j += 2; continue; } if (f[j] === '"') break; j++; } t.push({ k: 'str', v: f.slice(i, j + 1) }); i = j + 1; continue; }
      if (c === "'") { const j = f.indexOf("'", i + 1); const fin = j < 0 ? f.length : j + 1; t.push({ k: 'id', v: f.slice(i, fin) }); i = fin; continue; }
      if (/[A-Za-zÀ-ÿ_\\$]/.test(c)) { let j = i; while (j < f.length && /[A-Za-zÀ-ÿ0-9_.\\$!:]/.test(f[j])) j++; t.push({ k: 'id', v: f.slice(i, j) }); i = j; continue; }
      if (/[0-9]/.test(c)) { let j = i; while (j < f.length && /[0-9,.Ee]/.test(f[j])) { if ((f[j] === 'E' || f[j] === 'e') && !/[+\-0-9]/.test(f[j + 1] || '')) break; j++; } t.push({ k: 'num', v: f.slice(i, j) }); i = j; continue; }
      if (c === '(' || c === ')' || c === ';' || c === '{' || c === '}') { t.push({ k: c, v: c }); i++; continue; }
      if (/\s/.test(c)) { let j = i; while (j < f.length && /\s/.test(f[j])) j++; t.push({ k: 'sp', v: f.slice(i, j) }); i = j; continue; }
      t.push({ k: 'op', v: c }); i++;
    }
    return t;
  }
  const unir = (t) => t.map((x) => x.v).join('');
  function siguienteNoEspacio(t, i) { let j = i; while (j < t.length && t[j].k === 'sp') j++; return j; }
  /* Divide los argumentos de la llamada que abre en t[i] (token '(') y devuelve {args:[[tokens]], fin} */
  function argumentos(t, i) {
    let nivel = 0; const args = []; let actual = [];
    for (let j = i; j < t.length; j++) {
      const x = t[j];
      if (x.k === '(' || x.k === '{') { nivel++; if (nivel === 1) continue; }
      if (x.k === ')' || x.k === '}') { nivel--; if (nivel === 0) { args.push(actual); return { args, fin: j }; } }
      if (x.k === ';' && nivel === 1) { args.push(actual); actual = []; continue; }
      actual.push(x);
    }
    return null;
  }
  function nombreFuncionesUsadas(formula) {
    const t = tokenizar(formula.replace(/^=/, ''));
    const usadas = [];
    for (let i = 0; i < t.length; i++) if (t[i].k === 'id') { const j = siguienteNoEspacio(t, i + 1); if (t[j] && t[j].k === '(') usadas.push(t[i].v.toUpperCase().replace(/^_XLFN\./, '')); }
    return usadas;
  }

  /* Reescrituras previas: VERDADERO/FALSO sueltos, LET, CAMBIAR, PROMEDIO.SI.CONJUNTO */
  /* Pasos a nivel de carácter: "" dentro de textos, constantes matriciales {1;2\3} del Excel español */
  function prepararCaracteres(c) {
    let out = ''; let i = 0; let enLlave = 0;
    while (i < c.length) {
      const ch = c[i];
      if (ch === '"') {
        let j = i + 1; let partes = ['']; 
        while (j < c.length) {
          if (c[j] === '"' && c[j + 1] === '"') { partes.push(''); j += 2; continue; }
          if (c[j] === '"') break;
          partes[partes.length - 1] += c[j]; j++;
        }
        out += partes.length === 1 ? '"' + partes[0] + '"' : '(' + partes.map((x) => '"' + x + '"').join('&CARACTER(34)&') + ')';
        i = j + 1; continue;
      }
      if (ch === '{') enLlave++;
      if (ch === '}') enLlave--;
      if (enLlave > 0 && ch === ';') { out += '|'; i++; continue; }
      if (enLlave > 0 && ch === '\\') { out += ';'; i++; continue; }
      out += ch; i++;
    }
    return out;
  }
  function reescribir(formula) {
    let cuerpo = prepararCaracteres(formula.slice(1));
    for (let vuelta = 0; vuelta < 30; vuelta++) {
      const t = tokenizar(cuerpo);
      let cambiado = false;
      for (let i = 0; i < t.length && !cambiado; i++) {
        const x = t[i]; if (x.k !== 'id') continue;
        const N = x.v.toUpperCase();
        const j = siguienteNoEspacio(t, i + 1);
        const llamada = t[j] && t[j].k === '(';
        if ((N === 'VERDADERO' || N === 'FALSO') && !llamada) { t[i] = { k: 'id', v: N + '()' }; cuerpo = unir(t); cambiado = true; break; }
        if (!llamada) continue;
        if (N === 'LET') {
          const a = argumentos(t, j); if (!a || a.args.length < 3 || a.args.length % 2 === 0) continue;
          const pares = []; for (let k = 0; k + 1 < a.args.length - 1; k += 2) pares.push([unir(a.args[k]).trim().toUpperCase(), a.args[k + 1]]);
          let calc = a.args[a.args.length - 1];
          // sustitución de dentro hacia fuera: cada valor puede usar nombres anteriores
          const sustituir = (toks, hasta) => {
            let res = toks.slice();
            for (let p = hasta - 1; p >= 0; p--) {
              const [nombre, valor] = pares[p];
              res = res.flatMap((y, idx) => {
                if (y.k === 'id' && y.v.toUpperCase() === nombre) {
                  const sig = siguienteNoEspacio(res, idx + 1);
                  if (res[sig] && res[sig].k === '(') return [y];
                  return [{ k: '(', v: '(' }, ...sustituir(valor, p), { k: ')', v: ')' }];
                }
                return [y];
              });
            }
            return res;
          };
          const nuevo = [{ k: '(', v: '(' }, ...sustituir(calc, pares.length), { k: ')', v: ')' }];
          cuerpo = unir([...t.slice(0, i), ...nuevo, ...t.slice(a.fin + 1)]); cambiado = true; break;
        }
        if (N === 'SIFECHA' && !x.hecho) {
          const a = argumentos(t, j); if (!a || a.args.length !== 3) continue;
          const u = unir(a.args[2]).trim();
          if (/^"[a-zA-Z]{1,2}"$/.test(u) && u !== u.toUpperCase()) {
            const nuevo = unir(a.args[0]) + ';' + unir(a.args[1]) + ';' + u.toUpperCase();
            cuerpo = unir([...t.slice(0, j), { k: '(', v: '(' + nuevo + ')' }, ...t.slice(a.fin + 1)]); cambiado = true; break;
          }
          continue;
        }
        if (N === 'CAMBIAR') {
          const a = argumentos(t, j); if (!a || a.args.length < 3) continue;
          const expr = unir(a.args[0]); const resto = a.args.slice(1);
          let defecto = resto.length % 2 === 1 ? unir(resto.pop()) : 'NOD()';
          let s = defecto;
          for (let k = resto.length - 2; k >= 0; k -= 2) s = `SI((${expr})=(${unir(resto[k])});${unir(resto[k + 1])};${s})`;
          cuerpo = unir([...t.slice(0, i), { k: 'id', v: '(' + s + ')' }, ...t.slice(a.fin + 1)]); cambiado = true; break;
        }
        if (N === 'PROMEDIO.SI.CONJUNTO') {
          const a = argumentos(t, j); if (!a || a.args.length < 3) continue;
          const partes = a.args.map(unir);
          const s = `(SUMAR.SI.CONJUNTO(${partes.join(';')})/CONTAR.SI.CONJUNTO(${partes[0]};"<>";${partes.slice(1).join(';')}))`;
          cuerpo = unir([...t.slice(0, i), { k: 'id', v: s }, ...t.slice(a.fin + 1)]); cambiado = true; break;
        }
      }
      if (!cambiado) break;
    }
    return '=' + cuerpo;
  }

  /* ---------- Plugin con las funciones que faltan ---------- */
  function crearPlugin(HF) {
    const { FunctionPlugin, FunctionArgumentType: T, SimpleRangeValue, CellError, ErrorType, ArraySize } = HF;
    const R = { argumentType: T.RANGE };
    const opt = (tipo, def) => ({ argumentType: tipo, defaultValue: def, optionalArg: def === undefined });
    const plano = (rango) => rango.data.flat();
    const iguales = (a, b) => (typeof a === 'string' && typeof b === 'string') ? a.toLowerCase() === b.toLowerCase() : a === b;
    const comodin = (patron) => new RegExp('^' + String(patron).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/~\*/g, '\u0001').replace(/~\?/g, '\u0002').replace(/\*/g, '.*').replace(/\?/g, '.').replace(/\u0001/g, '\\*').replace(/\u0002/g, '\\?') + '$', 'i');
    const tam = (fnTam) => function (ast, state) { try { return fnTam.call(this, ast, state); } catch (e) { return ArraySize.error(); } };
    const tamArg = function (ast, state, k) { const z = this.arraySizeForAst(ast.args[k], { formulaAddress: state.formulaAddress, arraysFlag: true }); return new ArraySize(z.width, z.height); };
    const NA = () => new CellError(ErrorType.NA);
    const VAL = () => new CellError(ErrorType.VALUE);

    class PluginEs extends FunctionPlugin {
      concat(ast, state) {
        return this.runFunction(ast.args, state, this.metadata('CONCAT'), (...rangos) => rangos.map((r) => plano(r).map((v) => (v === null || v === undefined ? '' : typeof v === 'boolean' ? (v ? 'VERDADERO' : 'FALSO') : String(v))).join('')).join(''));
      }
      xmatch(ast, state) {
        return this.runFunction(ast.args, state, this.metadata('XMATCH'), (buscado, rango, modo, busq) => {
          const v = plano(rango); const n = v.length;
          const orden = busq === -1 || busq === -2 ? [...Array(n).keys()].reverse() : [...Array(n).keys()];
          if (modo === 2) { const re = comodin(buscado); for (const k of orden) if (re.test(String(v[k] ?? ''))) return k + 1; return NA(); }
          for (const k of orden) if (iguales(v[k], buscado)) return k + 1;
          if (modo === -1 || modo === 1) {
            let mejor = -1;
            for (const k of orden) { const x = v[k]; if (typeof x !== typeof buscado) continue;
              if (modo === -1 && x < buscado && (mejor < 0 || x > v[mejor])) mejor = k;
              if (modo === 1 && x > buscado && (mejor < 0 || x < v[mejor])) mejor = k; }
            return mejor < 0 ? NA() : mejor + 1;
          }
          return NA();
        });
      }
      rankeq(ast, state) {
        return this.runFunction(ast.args, state, this.metadata('RANK.EQ'), (num, rango, orden) => {
          const v = plano(rango).filter((x) => typeof x === 'number');
          if (!v.includes(num)) return NA();
          return 1 + v.filter((x) => (orden ? x < num : x > num)).length;
        });
      }
      rankavg(ast, state) {
        return this.runFunction(ast.args, state, this.metadata('RANK.AVG'), (num, rango, orden) => {
          const v = plano(rango).filter((x) => typeof x === 'number');
          const empates = v.filter((x) => x === num).length; if (!empates) return NA();
          const primero = 1 + v.filter((x) => (orden ? x < num : x > num)).length;
          return primero + (empates - 1) / 2;
        });
      }
      modesngl(ast, state) {
        return this.runFunction(ast.args, state, this.metadata('MODE.SNGL'), (...rangos) => {
          const v = rangos.flatMap(plano).filter((x) => typeof x === 'number');
          const cuenta = new Map(); let mejor = null, max = 1;
          for (const x of v) { const c = (cuenta.get(x) || 0) + 1; cuenta.set(x, c); if (c > max) { max = c; mejor = x; } }
          return mejor === null ? NA() : mejor;
        });
      }
      textbefore(ast, state) {
        return this.runFunction(ast.args, state, this.metadata('TEXTBEFORE'), (texto, delim, n, mayus, finCoincide, siNo) => {
          const s = String(texto); const d = String(delim); const cmp = mayus ? s.toLowerCase() : s; const dd = mayus ? d.toLowerCase() : d;
          let pos = -1;
          if (n > 0) { let desde = 0; for (let k = 0; k < n; k++) { pos = cmp.indexOf(dd, desde); if (pos < 0) break; desde = pos + dd.length; } }
          else { let hasta = cmp.length; for (let k = 0; k < -n; k++) { pos = cmp.lastIndexOf(dd, hasta); if (pos < 0) break; hasta = pos - 1; } }
          if (pos < 0) return siNo !== undefined ? siNo : (finCoincide ? s : NA());
          return s.slice(0, pos);
        });
      }
      textafter(ast, state) {
        return this.runFunction(ast.args, state, this.metadata('TEXTAFTER'), (texto, delim, n, mayus, finCoincide, siNo) => {
          const s = String(texto); const d = String(delim); const cmp = mayus ? s.toLowerCase() : s; const dd = mayus ? d.toLowerCase() : d;
          let pos = -1;
          if (n > 0) { let desde = 0; for (let k = 0; k < n; k++) { pos = cmp.indexOf(dd, desde); if (pos < 0) break; desde = pos + dd.length; } }
          else { let hasta = cmp.length; for (let k = 0; k < -n; k++) { pos = cmp.lastIndexOf(dd, hasta); if (pos < 0) break; hasta = pos - 1; } }
          if (pos < 0) return siNo !== undefined ? siNo : (finCoincide ? '' : NA());
          return s.slice(pos + dd.length);
        });
      }
      sortby(ast, state) {
        return this.runFunction(ast.args, state, this.metadata('SORTBY'), (rango, ...resto) => {
          const filas = rango.data.map((f, i) => ({ f, i }));
          const claves = [];
          for (let k = 0; k < resto.length; k += 2) {
            const r = resto[k]; const ord = typeof resto[k + 1] === 'number' ? resto[k + 1] : 1;
            if (!r || !r.data) return VAL();
            const v = plano(r); if (v.length !== filas.length) return VAL();
            claves.push({ v, ord });
          }
          filas.sort((A, B) => { for (const c of claves) { const a = c.v[A.i], b = c.v[B.i];
            let r = 0; if (typeof a === 'number' && typeof b === 'number') r = a - b; else r = String(a ?? '').localeCompare(String(b ?? ''), 'es');
            if (r) return r * c.ord; } return A.i - B.i; });
          return SimpleRangeValue.onlyValues(filas.map((x) => x.f));
        });
      }
      sortbySize(ast, state) { return tamArg.call(this, ast, state, 0); }
      choosecols(ast, state) {
        return this.runFunction(ast.args, state, this.metadata('CHOOSECOLS'), (rango, ...cols) => {
          const w = rango.data[0].length; const idx = cols.map((c) => (c < 0 ? w + c : c - 1));
          if (idx.some((c) => c < 0 || c >= w)) return VAL();
          return SimpleRangeValue.onlyValues(rango.data.map((f) => idx.map((c) => f[c])));
        });
      }
      choosecolsSize(ast, state) { const s = tamArg.call(this, ast, state, 0); return new ArraySize(ast.args.length - 1, s.height); }
      chooserows(ast, state) {
        return this.runFunction(ast.args, state, this.metadata('CHOOSEROWS'), (rango, ...filas) => {
          const h = rango.data.length; const idx = filas.map((c) => (c < 0 ? h + c : c - 1));
          if (idx.some((c) => c < 0 || c >= h)) return VAL();
          return SimpleRangeValue.onlyValues(idx.map((r) => rango.data[r].slice()));
        });
      }
      chooserowsSize(ast, state) { const s = tamArg.call(this, ast, state, 0); return new ArraySize(s.width, ast.args.length - 1); }
      take(ast, state) {
        return this.runFunction(ast.args, state, this.metadata('TAKE'), (rango, filas, cols) => {
          let d = rango.data;
          if (filas !== undefined && filas !== null && filas !== 0) d = filas > 0 ? d.slice(0, filas) : d.slice(filas);
          if (cols !== undefined && cols !== null && cols !== 0) d = d.map((f) => (cols > 0 ? f.slice(0, cols) : f.slice(cols)));
          if (!d.length || !d[0].length) return new CellError(ErrorType.VALUE);
          return SimpleRangeValue.onlyValues(d);
        });
      }
      takeSize(ast, state) {
        const s = tamArg.call(this, ast, state, 0);
        const num = (k) => { const a = ast.args[k]; if (!a) return null; if (a.type === 'NUMBER') return a.value; if (a.type === 'MINUS_UNARY_OP' && a.value && a.value.type === 'NUMBER') return -a.value.value; return null; };
        const f = num(1), c = num(2);
        return new ArraySize(c ? Math.min(Math.abs(c), s.width) : s.width, f ? Math.min(Math.abs(f), s.height) : s.height);
      }
      drop(ast, state) {
        return this.runFunction(ast.args, state, this.metadata('DROP'), (rango, filas, cols) => {
          let d = rango.data;
          if (filas) d = filas > 0 ? d.slice(filas) : d.slice(0, filas);
          if (cols) d = d.map((f) => (cols > 0 ? f.slice(cols) : f.slice(0, cols)));
          if (!d.length || !d[0].length) return new CellError(ErrorType.VALUE);
          return SimpleRangeValue.onlyValues(d);
        });
      }
      dropSize(ast, state) {
        const s = tamArg.call(this, ast, state, 0);
        const num = (k) => { const a = ast.args[k]; if (!a) return 0; if (a.type === 'NUMBER') return a.value; if (a.type === 'MINUS_UNARY_OP' && a.value && a.value.type === 'NUMBER') return -a.value.value; return 0; };
        return new ArraySize(Math.max(1, s.width - Math.abs(num(2))), Math.max(1, s.height - Math.abs(num(1))));
      }
      textsplit(ast, state) {
        return this.runFunction(ast.args, state, this.metadata('TEXTSPLIT'), (texto, delimCol, delimFila) => {
          const s = String(texto);
          const filas = delimFila ? s.split(String(delimFila)) : [s];
          const m = filas.map((f) => (delimCol ? f.split(String(delimCol)) : [f]));
          const w = Math.max(...m.map((f) => f.length));
          return SimpleRangeValue.onlyValues(m.map((f) => { const r = f.slice(); while (r.length < w) r.push(NA()); return r; }));
        });
      }
      textsplitSize(ast, state) {
        // tamaño solo predecible con texto constante o referencia: se calcula evaluando
        try {
          const v = this.evaluateAst(ast.args[0], state);
          const val = v && v.data ? v.data[0][0] : v;
          const dc = ast.args[1] ? this.evaluateAst(ast.args[1], state) : null;
          const df = ast.args[2] ? this.evaluateAst(ast.args[2], state) : null;
          const s = String(val ?? '');
          const filas = df ? s.split(String(df)) : [s];
          const w = Math.max(...filas.map((f) => (dc ? f.split(String(dc)).length : 1)));
          return new ArraySize(w, filas.length);
        } catch (e) { return ArraySize.error(); }
      }
      tocol(ast, state) {
        return this.runFunction(ast.args, state, this.metadata('TOCOL'), (rango, ignorar) => {
          let v = plano(rango); if (ignorar === 1 || ignorar === 3) v = v.filter((x) => x !== null && x !== undefined && x !== '');
          return SimpleRangeValue.onlyValues(v.map((x) => [x]));
        });
      }
      tocolSize(ast, state) { const s = tamArg.call(this, ast, state, 0); return new ArraySize(1, s.width * s.height); }
      torow(ast, state) {
        return this.runFunction(ast.args, state, this.metadata('TOROW'), (rango, ignorar) => {
          let v = plano(rango); if (ignorar === 1 || ignorar === 3) v = v.filter((x) => x !== null && x !== undefined && x !== '');
          return SimpleRangeValue.onlyValues([v]);
        });
      }
      torowSize(ast, state) { const s = tamArg.call(this, ast, state, 0); return new ArraySize(s.width * s.height, 1); }
      numbervalue(ast, state) {
        return this.runFunction(ast.args, state, this.metadata('NUMBERVALUE'), (texto, dec, grp) => {
          if (typeof texto === 'number') return texto;
          if (typeof texto === 'boolean') return VAL();
          let t = String(texto ?? '').replace(/\s/g, ''); const d = dec || ','; const g = grp === undefined ? '.' : grp;
          let pct = 0; while (t.endsWith('%')) { pct++; t = t.slice(0, -1); }
          if (g) t = t.split(g).join('');
          if (d && d !== '.') { if (t.includes('.') && !g.includes('.')) { /* punto no reconocido */ } t = t.split(d).join('.'); }
          if (t === '') return 0;
          const n = Number(t); if (!isFinite(n)) return VAL();
          return n / Math.pow(100, pct);
        });
      }
      filtrar(ast, state) {
        return this.runFunction(ast.args, state, this.metadata('FILTER'), (rango, incluir, siVacio) => {
          const d = rango.data; const h = d.length; const w = d[0].length;
          const inc = incluir.data; const ih = inc.length; const iw = inc[0].length;
          const verdad = (v) => (v instanceof CellError ? v : typeof v === 'number' ? v !== 0 : typeof v === 'boolean' ? v : false);
          let res;
          if (ih === h && iw === 1) res = d.filter((f, k) => verdad(inc[k][0]) === true);
          else if (iw === w && ih === 1) { const cols = inc[0].map((v, k) => (verdad(v) === true ? k : -1)).filter((k) => k >= 0); res = d.map((f) => cols.map((k) => f[k])); if (!cols.length) res = []; }
          else return VAL();
          if (!res.length || !res[0].length) return siVacio !== undefined ? siVacio : new CellError(ErrorType.VALUE, '__CALC__');
          return SimpleRangeValue.onlyValues(res);
        });
      }
      filtrarSize(ast, state) { return tamArg.call(this, ast, state, 0); }
      percentof(ast, state) {
        return this.runFunction(ast.args, state, this.metadata('PERCENTOF'), (sub, total) => {
          const a = plano(sub).filter((x) => typeof x === 'number').reduce((p, c) => p + c, 0);
          const b = plano(total).filter((x) => typeof x === 'number').reduce((p, c) => p + c, 0);
          return b === 0 ? new CellError(ErrorType.DIV_BY_ZERO) : a / b;
        });
      }
      texto(ast, state) {
        return this.runFunction(ast.args, state, this.metadata('TEXT'), (valor, fmt) => {
          if (typeof valor === 'string') { const n = Number(valor.replace(/\./g, '').replace(',', '.')); if (!isNaN(n) && valor.trim() !== '') valor = n; else return valor; }
          if (typeof valor === 'boolean') return valor ? 'VERDADERO' : 'FALSO';
          return formatear(valor, String(fmt));
        });
      }
    }
    PluginEs.implementedFunctions = {
      CONCAT: { method: 'concat', parameters: [R], repeatLastArgs: 1, expandRanges: false },
      XMATCH: { method: 'xmatch', parameters: [{ argumentType: T.NOERROR }, R, opt(T.INTEGER, 0), opt(T.INTEGER, 1)] },
      'RANK.EQ': { method: 'rankeq', parameters: [{ argumentType: T.NUMBER }, R, opt(T.INTEGER, 0)] },
      RANK: { method: 'rankeq', parameters: [{ argumentType: T.NUMBER }, R, opt(T.INTEGER, 0)] },
      'RANK.AVG': { method: 'rankavg', parameters: [{ argumentType: T.NUMBER }, R, opt(T.INTEGER, 0)] },
      'MODE.SNGL': { method: 'modesngl', parameters: [R], repeatLastArgs: 1 },
      TEXTBEFORE: { method: 'textbefore', parameters: [{ argumentType: T.STRING }, { argumentType: T.STRING }, opt(T.INTEGER, 1), opt(T.INTEGER, 0), opt(T.INTEGER, 0), { argumentType: T.SCALAR, optionalArg: true }] },
      TEXTAFTER: { method: 'textafter', parameters: [{ argumentType: T.STRING }, { argumentType: T.STRING }, opt(T.INTEGER, 1), opt(T.INTEGER, 0), opt(T.INTEGER, 0), { argumentType: T.SCALAR, optionalArg: true }] },
      SORTBY: { method: 'sortby', sizeOfResultArrayMethod: 'sortbySize', parameters: [R, R, { argumentType: T.INTEGER, optionalArg: true }], repeatLastArgs: 2, vectorizationForbidden: true },
      CHOOSECOLS: { method: 'choosecols', sizeOfResultArrayMethod: 'choosecolsSize', parameters: [R, { argumentType: T.INTEGER }], repeatLastArgs: 1, vectorizationForbidden: true },
      CHOOSEROWS: { method: 'chooserows', sizeOfResultArrayMethod: 'chooserowsSize', parameters: [R, { argumentType: T.INTEGER }], repeatLastArgs: 1, vectorizationForbidden: true },
      TAKE: { method: 'take', sizeOfResultArrayMethod: 'takeSize', parameters: [R, { argumentType: T.INTEGER, optionalArg: true }, { argumentType: T.INTEGER, optionalArg: true }], vectorizationForbidden: true },
      DROP: { method: 'drop', sizeOfResultArrayMethod: 'dropSize', parameters: [R, { argumentType: T.INTEGER, optionalArg: true }, { argumentType: T.INTEGER, optionalArg: true }], vectorizationForbidden: true },
      TEXTSPLIT: { method: 'textsplit', sizeOfResultArrayMethod: 'textsplitSize', parameters: [{ argumentType: T.STRING }, { argumentType: T.STRING, optionalArg: true }, { argumentType: T.STRING, optionalArg: true }], vectorizationForbidden: true },
      TOCOL: { method: 'tocol', sizeOfResultArrayMethod: 'tocolSize', parameters: [R, opt(T.INTEGER, 0), opt(T.BOOLEAN, false)], vectorizationForbidden: true },
      TOROW: { method: 'torow', sizeOfResultArrayMethod: 'torowSize', parameters: [R, opt(T.INTEGER, 0), opt(T.BOOLEAN, false)], vectorizationForbidden: true },
      PERCENTOF: { method: 'percentof', parameters: [R, R] },
      NUMBERVALUE: { method: 'numbervalue', parameters: [{ argumentType: T.SCALAR }, { argumentType: T.STRING, optionalArg: true }, { argumentType: T.STRING, optionalArg: true }] },
      MODE: { method: 'modesngl', parameters: [R], repeatLastArgs: 1 },
      FILTER: { method: 'filtrar', sizeOfResultArrayMethod: 'filtrarSize', parameters: [R, R, { argumentType: T.SCALAR, optionalArg: true }], vectorizationForbidden: true, enableArrayArithmeticForArguments: true },
    };
    class PluginTexto extends FunctionPlugin {}
    PluginTexto.prototype.texto = PluginEs.prototype.texto;
    PluginTexto.implementedFunctions = { TEXT: { method: 'texto', parameters: [{ argumentType: T.SCALAR }, { argumentType: T.STRING }] } };
    return { PluginEs, PluginTexto };
  }

  let preparado = false;
  function preparar(HF, esES) {
    if (preparado) return;
    const dicc = JSON.parse(JSON.stringify(esES));
    for (const [id, nombre] of Object.entries(NOMBRES_REALES)) if (dicc.functions[id]) dicc.functions[id] = nombre;
    for (const [id, nombre] of Object.entries(PROPIAS)) dicc.functions[id] = nombre;
    dicc.functions.FILTER = 'FILTRAR';
    dicc.functions.TEXT = 'TEXTO';
    dicc.errors.CYCLE = '#¡REF!'; // Excel avisa de referencia circular; HF lo marca como #CYCLE!
    dicc.langCode = 'esXL';
    const { PluginEs, PluginTexto } = crearPlugin(HF);
    try { HF.unregisterFunction('TEXT'); } catch (e) { /* */ }
    try { HF.unregisterFunction('FILTER'); } catch (e) { /* */ }
    const trad = {}; trad.esXL = {}; for (const id of Object.keys(PluginEs.implementedFunctions)) trad.esXL[id] = PROPIAS[id];
    // las traducciones de las funciones propias van en el diccionario del idioma
    HF.registerFunctionPlugin(PluginEs);
    HF.registerFunction('TEXT', PluginTexto);
    HF.registerLanguage('esXL', dicc);
    preparado = true;
  }

  const CONFIG = {
    licenseKey: 'gpl-v3', language: 'esXL', functionArgSeparator: ';', decimalSeparator: ',', thousandSeparator: '.',
    arrayColumnSeparator: ';', arrayRowSeparator: '|', /* constantes matriciales: poco usadas en la guía */
    useArrayArithmetic: true, dateFormats: ['DD/MM/YYYY', 'DD/MM/YY', 'YYYY-MM-DD'], timeFormats: ['hh:mm', 'hh:mm:ss'],
    nullDate: { year: 1899, month: 12, day: 30 }, leapYear1900: false, smartRounding: true, precisionRounding: 10,
    caseSensitive: false, accentSensitive: true, useWildcards: true, useRegularExpressions: false, matchWholeCell: true,
    currencySymbol: ['€'], localeLang: 'es-ES', evaluateNullToZero: true,
  };

  /* ---------- Hojas de ejercicio ---------- */
  function letraANumero(letras) { let n = 0; for (const c of letras.toUpperCase()) n = n * 26 + (c.charCodeAt(0) - 64); return n - 1; }
  function numeroALetra(n) { let s = ''; n += 1; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; }
  function dir(ref) { const m = /^\$?([A-Z]+)\$?(\d+)$/i.exec(ref.trim()); if (!m) throw new Error('Referencia no válida: ' + ref); return { col: letraANumero(m[1]), row: +m[2] - 1 }; }
  function celdasDeRango(r) {
    const [a, b] = r.split(':'); const A = dir(a); const B = b ? dir(b) : A; const out = [];
    for (let row = Math.min(A.row, B.row); row <= Math.max(A.row, B.row); row++) for (let col = Math.min(A.col, B.col); col <= Math.max(A.col, B.col); col++) out.push(numeroALetra(col) + (row + 1));
    return out;
  }
  function valorDeEntrada(v) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if ('fecha' in v) { const [a, m, d] = v.fecha.split('-').map(Number); return (Date.UTC(a, m - 1, d) / 86400000) + 25569; }
      if ('texto' in v) return String(v.texto); // texto literal aunque parezca número
      if ('v' in v) return v.v;
    }
    return v;
  }
  function construir(HF, hoja) {
    // hoja: { celdas: {A1: valor|"=fórmula"|{fecha:"2026-11-14"}}, nombre?: 'Hoja1', otras?: {Nombre: {celdas}} }
    const hojas = { [hoja.nombre || 'Hoja1']: hoja.celdas || {} };
    if (hoja.otras) for (const [n, h] of Object.entries(hoja.otras)) hojas[n] = h.celdas || {};
    const hf = HF.buildEmpty(CONFIG);
    const ids = {};
    for (const n of Object.keys(hojas)) { hf.addSheet(n); ids[n] = hf.getSheetId(n); }
    hf.suspendEvaluation();
    for (const [n, celdas] of Object.entries(hojas)) {
      for (const [ref, v] of Object.entries(celdas)) {
        const d = dir(ref); let val = valorDeEntrada(v);
        if (typeof val === 'string' && val.startsWith('=')) val = reescribir(val);
        hf.setCellContents({ sheet: ids[n], col: d.col, row: d.row }, [[val]]);
      }
    }
    hf.resumeEvaluation();
    return { hf, ids, principal: ids[hoja.nombre || 'Hoja1'] };
  }
  function leer(ctx, ref, hojaNombre) {
    const sheet = hojaNombre ? ctx.ids[hojaNombre] : ctx.principal; const d = dir(ref);
    const v = ctx.hf.getCellValue({ sheet, col: d.col, row: d.row });
    return v;
  }
  function escribir(ctx, ref, contenido) {
    const d = dir(ref); let c = valorDeEntrada(contenido);
    if (typeof c === 'string' && c.startsWith('=')) c = reescribir(c);
    ctx.hf.setCellContents({ sheet: ctx.principal, col: d.col, row: d.row }, [[c]]);
  }
  function copiarA(ctx, origen, destinos) {
    const o = dir(origen);
    ctx.hf.copy({ start: { sheet: ctx.principal, col: o.col, row: o.row }, end: { sheet: ctx.principal, col: o.col, row: o.row } });
    for (const r of destinos) for (const c of celdasDeRango(r)) { const d = dir(c); if (d.col === o.col && d.row === o.row) continue; ctx.hf.paste({ sheet: ctx.principal, col: d.col, row: d.row }); }
  }
  function rangoDerramado(ctx, ref) {
    // celdas que ocupa el resultado de una fórmula matricial que empieza en ref
    const d = dir(ref); const hf = ctx.hf; const s = ctx.principal;
    if (!hf.isCellPartOfArray({ sheet: s, col: d.col, row: d.row })) return [ref];
    let w = 1, h = 1;
    while (hf.isCellPartOfArray({ sheet: s, col: d.col + w, row: d.row }) && !hf.doesCellHaveFormula({ sheet: s, col: d.col + w, row: d.row })) w++;
    while (hf.isCellPartOfArray({ sheet: s, col: d.col, row: d.row + h }) && !hf.doesCellHaveFormula({ sheet: s, col: d.col, row: d.row + h })) h++;
    const out = []; for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) out.push(numeroALetra(d.col + c) + (d.row + r + 1));
    return out;
  }

  /* ---------- Diagnóstico de errores para la alumna ---------- */
  const EXPLICA_ERROR = {
    '#¿NOMBRE?': 'Excel no reconoce un nombre de la fórmula. Suele ser una función mal escrita (revisa tildes y puntos: SUMAR.SI.CONJUNTO, BUSCARX), un texto sin comillas o una función en inglés.',
    '#¡VALOR!': 'Hay un argumento del tipo equivocado: por ejemplo, operar con un texto como si fuera un número o una fecha escrita como texto.',
    '#¡DIV/0!': 'Estás dividiendo entre cero o entre una celda vacía.',
    '#N/D': 'La búsqueda no encuentra el valor. Comprueba que existe tal cual (sin espacios de más) y que buscas en el rango correcto.',
    '#¡REF!': 'La fórmula apunta a una celda que no existe o se refiere a sí misma (referencia circular).',
    '#¡NUM!': 'Un número no es válido para esa operación (por ejemplo, demasiado grande o un argumento fuera de rango).',
    '#¡DESBORDAMIENTO!': 'El resultado necesita varias celdas y alguna de ellas no está vacía. Deja libre el espacio donde se derrama.',
    'Referencia circular': 'La fórmula se usa a sí misma (por ejemplo, la celda del total está dentro del rango que suma). En Excel te saldría un aviso de «referencia circular» y la celda mostraría 0. Saca esa celda del rango.',
    '#¡CALC!': 'El cálculo no tiene resultado: por ejemplo, FILTRAR no encuentra ninguna fila que cumpla la condición. Usa su tercer argumento para decir qué mostrar entonces.',
    '#ERROR!': 'Excel no aceptaría esta fórmula: revisa paréntesis, comillas y que los argumentos van separados por punto y coma (;).',
  };
  function diagnosticarEscritura(f) {
    const avisos = [];
    const s = f.trim();
    if (!s.startsWith('=') && !s.startsWith('+')) avisos.push('Toda fórmula empieza por el signo igual (=). Sin él, Excel lo trata como texto.');
    const t = tokenizar(s.replace(/^=/, ''));
    let nivel = 0; for (const x of t) { if (x.k === '(') nivel++; if (x.k === ')') nivel--; }
    if (nivel > 0) avisos.push('Falta cerrar ' + nivel + ' paréntesis.');
    if (nivel < 0) avisos.push('Sobra algún paréntesis de cierre.');
    // coma usada como separador: num, num dentro de una llamada o id, id
    for (let i = 0; i < t.length; i++) {
      if (t[i].k === 'op' && t[i].v === ',') { avisos.push('En el Excel en español los argumentos se separan con punto y coma (;), no con coma. La coma es el separador decimal.'); break; }
      if (t[i].k === 'num' && /,\d*,/.test(t[i].v)) { avisos.push('En el Excel en español los argumentos se separan con punto y coma (;), no con coma.'); break; }
    }
    const fn = nombreFuncionesUsadas(s);
    const ingles = { SUM: 'SUMA', AVERAGE: 'PROMEDIO', IF: 'SI', VLOOKUP: 'BUSCARV', XLOOKUP: 'BUSCARX', COUNTIF: 'CONTAR.SI', SUMIF: 'SUMAR.SI', SUMIFS: 'SUMAR.SI.CONJUNTO', COUNTIFS: 'CONTAR.SI.CONJUNTO', IFERROR: 'SI.ERROR', INDEX: 'INDICE', MATCH: 'COINCIDIR', ROUND: 'REDONDEAR', TODAY: 'HOY', LEFT: 'IZQUIERDA', RIGHT: 'DERECHA', MID: 'EXTRAE', TRIM: 'ESPACIOS', LEN: 'LARGO', FILTER: 'FILTRAR', SORT: 'ORDENAR', UNIQUE: 'UNICOS', COUNT: 'CONTAR', COUNTA: 'CONTARA', AND: 'Y', OR: 'O', TEXT: 'TEXTO', CONCATENATE: 'CONCATENAR', TEXTJOIN: 'UNIRCADENAS', NETWORKDAYS: 'DIAS.LAB', EOMONTH: 'FIN.MES', YEAR: 'AÑO', MONTH: 'MES', DAY: 'DIA', DATE: 'FECHA', SUBSTITUTE: 'SUSTITUIR', UPPER: 'MAYUSC', LOWER: 'MINUSC', PROPER: 'NOMPROPIO', VALUE: 'VALOR', IFS: 'SI.CONJUNTO', MAXIFS: 'MAX.SI.CONJUNTO', MINIFS: 'MIN.SI.CONJUNTO', AVERAGEIFS: 'PROMEDIO.SI.CONJUNTO', XMATCH: 'COINCIDIRX', SWITCH: 'CAMBIAR', PMT: 'PAGO' };
    for (const n of fn) if (ingles[n]) avisos.push(`${n} es el nombre en inglés. En el Excel en español se escribe ${ingles[n]}.`);
    return avisos;
  }

  /* ---------- Comparación ---------- */
  function normal(v) {
    if (v && typeof v === 'object' && 'value' in v && 'type' in v) return { error: v.message === '__CALC__' ? '#¡CALC!' : v.type === 'CYCLE' ? 'Referencia circular' : v.value };
    if (v === null || v === undefined) return '';
    return v;
  }
  function igual(a, b, tol) {
    a = normal(a); b = normal(b);
    if (a && a.error) return !!(b && b.error === a.error);
    if (b && b.error) return false;
    if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= (tol ?? 1e-9) * Math.max(1, Math.abs(b));
    if (typeof a === 'string' && typeof b === 'string') return a === b;
    if (a === '' && b === 0) return false;
    return a === b;
  }
  function mostrar(v, fmt) { const n = normal(v); if (n && n.error) return n.error; return formatear(n, fmt); }

  /* ejercicio: { hoja, objetivo:'C2', copiar_a:['C3:C6'], solucion:'=...', debe_usar:[], no_usar:[], variantes:[{B2:5}], tolerancia, comparar:[celdas extra] } */
  let NOMBRES_ES = null;
  function comprobar(HF, ej, formulaUsuario) {
    const res = { ok: false, mensajes: [], avisos: [], valores: {}, celdas: [], errorUsuario: null };
    const f = String(formulaUsuario || '').trim();
    if (!f) { res.mensajes.push('Escribe tu fórmula en la celda ' + ej.objetivo + '.'); return res; }
    const avisos = diagnosticarEscritura(f);
    if (!f.startsWith('=')) { res.mensajes.push(...avisos); return res; }
    const usadas = nombreFuncionesUsadas(f);
    // El Excel español no acepta nombres de función en inglés (SUM, IF, VLOOKUP…): darían #¿NOMBRE?
    if (!NOMBRES_ES) NOMBRES_ES = new Set(HF.getRegisteredFunctionNames('esXL').map((x) => x.toUpperCase()).concat(['LET', 'CAMBIAR', 'PROMEDIO.SI.CONJUNTO']));
    const extranas = usadas.filter((n) => !NOMBRES_ES.has(n));
    if (extranas.length) {
      res.errorUsuario = '#¿NOMBRE?';
      const ing = avisos.filter((x) => /nombre en inglés/.test(x));
      res.mensajes.push(`En el Excel en español esta fórmula daría #¿NOMBRE?: ${extranas.join(', ')} no ${extranas.length > 1 ? 'son funciones' : 'es una función'} del Excel en español.`, ...(ing.length ? ing : ['Revisa cómo se escribe el nombre de la función (tildes, puntos) o búscala en la Consulta.']));
      return res;
    }
    const cU = construir(HF, ej.hoja); const cS = construir(HF, ej.hoja);
    try { escribir(cU, ej.objetivo, f); } catch (e) { res.mensajes.push(...(avisos.length ? avisos : ['Excel no aceptaría esta fórmula. Revisa paréntesis, comillas y separadores (;).'])); return res; }
    escribir(cS, ej.objetivo, ej.solucion);
    if (ej.copiar_a && ej.copiar_a.length) { copiarA(cU, ej.objetivo, ej.copiar_a); copiarA(cS, ej.objetivo, ej.copiar_a); }
    const celdasSol = [ej.objetivo, ...(ej.copiar_a || []).flatMap(celdasDeRango)].flatMap((c) => rangoDerramado(cS, c));
    const extra = (ej.comparar || []).flatMap(celdasDeRango);
    const celdas = [...new Set([...celdasSol, ...extra])];
    res.celdas = celdas;
    const fmt = (c) => (ej.formatos_resultado && ej.formatos_resultado[c]) || ej.formato_resultado || null;
    const primero = normal(leer(cU, ej.objetivo));
    for (const c of celdas) res.valores[c] = mostrar(leer(cU, c), fmt(c));
    if (primero && primero.error) {
      res.errorUsuario = primero.error;
      const sol = normal(leer(cS, ej.objetivo));
      if (!(sol && sol.error === primero.error)) {
        res.mensajes.push(`Tu fórmula devuelve ${primero.error}. ${EXPLICA_ERROR[primero.error] || ''}`.trim());
        res.mensajes.push(...avisos);
        return res;
      }
    }
    const tieneRefs = (x) => tokenizar(x.replace(/^=/, '')).some((k) => k.k === 'id' && /^'?[^(]*!?\$?[A-Z]{1,3}\$?\d+/i.test(k.v) && !/^(VERDADERO|FALSO)/i.test(k.v));
    if (!tieneRefs(f) && tieneRefs(ej.solucion)) {
      res.mensajes.push('Has escrito un número o un texto fijo en lugar de una fórmula que use las celdas. Si los datos cambian, tu resultado no se actualizará: apunta a las celdas (por ejemplo, B2).');
      return res;
    }
    const fallan = celdas.filter((c) => !igual(leer(cU, c), leer(cS, c), ej.tolerancia));
    if (fallan.length) {
      const c0 = fallan[0];
      if (c0 === ej.objetivo || !ej.copiar_a) res.mensajes.push(`En ${c0} tu fórmula da ${mostrar(leer(cU, c0), fmt(c0))} y debería dar ${mostrar(leer(cS, c0), fmt(c0))}.`);
      else if (/\$/.test(ej.solucion) && !/\$/.test(f)) res.mensajes.push(`En ${ej.objetivo} está bien, pero al copiar la fórmula a ${c0} da ${mostrar(leer(cU, c0), fmt(c0))} en vez de ${mostrar(leer(cS, c0), fmt(c0))}. ¿Hay alguna referencia que debería quedarse fija con $ (tecla F4)?`);
      else res.mensajes.push(`En ${ej.objetivo} da lo esperado, pero en ${c0} tu fórmula da ${mostrar(leer(cU, c0), fmt(c0))} y debería dar ${mostrar(leer(cS, c0), fmt(c0))}. Prueba tu fórmula con los datos de esa fila: falta contemplar algún caso.`);
      res.mensajes.push(...avisos);
      return res;
    }
    // escenarios: si cambian los datos, ¿sigue bien?
    for (const v of ej.variantes || []) {
      for (const [ref, val] of Object.entries(v)) { escribir(cU, ref, val); escribir(cS, ref, val); }
      const mal = celdas.filter((c) => !igual(leer(cU, c), leer(cS, c), ej.tolerancia));
      if (mal.length) {
        res.mensajes.push('Con estos datos da el resultado correcto, pero si cambian los datos tu fórmula no se actualiza bien. ¿Has escrito algún número o resultado a mano en lugar de apuntar a la celda?');
        return res;
      }
    }
    const faltan = (ej.debe_usar || []).filter((n) => !usadas.includes(n.toUpperCase()));
    if (faltan.length) { res.mensajes.push(`El resultado es correcto, pero en este ejercicio hay que practicar ${faltan.join(' y ')}. Inténtalo con ${faltan.length > 1 ? 'esas funciones' : 'esa función'}.`); return res; }
    const prohibidas = (ej.no_usar || []).filter((n) => usadas.includes(n.toUpperCase()));
    if (prohibidas.length) { res.mensajes.push(`El resultado es correcto, pero aquí se pide resolverlo sin ${prohibidas.join(' ni ')}.`); return res; }
    res.ok = true;
    return res;
  }

  /* Evalúa una fórmula suelta sobre una hoja (para «predice el resultado» y la hoja libre) */
  function evaluar(HF, hoja, celda, formula) {
    const c = construir(HF, hoja); escribir(c, celda, formula);
    const celdas = rangoDerramado(c, celda);
    const vals = {}; for (const x of celdas) vals[x] = normal(leer(c, x));
    return { valor: normal(leer(c, celda)), celdas, valores: vals, ctx: c };
  }
  function valoresHoja(ctx, ancho, alto) {
    const out = {}; for (let r = 0; r < alto; r++) for (let col = 0; col < ancho; col++) {
      const v = ctx.hf.getCellValue({ sheet: ctx.principal, col, row: r });
      if (v !== null && v !== undefined && v !== '') out[numeroALetra(col) + (r + 1)] = normal(v);
    }
    return out;
  }
  function interpretarNumeroES(s) { // "1.234,5" -> 1234.5 ; "15%" -> 0.15 ; "14/11/2026" -> serie
    if (typeof s !== 'string') return s; const x = s.trim().replace(/\s*€$/, '');
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(x)) { let [d, m, a] = x.split('/').map(Number); if (a < 100) a += 2000; return Date.UTC(a, m - 1, d) / 86400000 + 25569; }
    if (/^-?[\d.]*,?\d+%$/.test(x)) return Number(x.replace('%', '').replace(/\./g, '').replace(',', '.')) / 100;
    if (/^-?(\d{1,3}(\.\d{3})+|\d+)(,\d+)?$/.test(x)) return Number(x.replace(/\./g, '').replace(',', '.'));
    const up = x.toUpperCase(); if (up === 'VERDADERO') return true; if (up === 'FALSO') return false;
    return s.trim();
  }

  const API = { preparar, CONFIG, comprobar, evaluar, construir, escribir, leer, copiarA, rangoDerramado, valoresHoja, formatear, mostrar, igual, normal,
    reescribir, tokenizar, nombreFuncionesUsadas, diagnosticarEscritura, EXPLICA_ERROR, celdasDeRango, dir, numeroALetra, letraANumero, interpretarNumeroES, NOMBRES_REALES, PROPIAS };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.MotorExcel = API;
})(typeof window !== 'undefined' ? window : globalThis);

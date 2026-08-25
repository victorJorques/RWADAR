/* ===================================================================
   motor.js · las reglas de la liga y el libro mayor de cada rival
   -------------------------------------------------------------------
   El Mister no enseña el dinero de los demás. Pero sí enseña tres
   cosas: con cuánto empezó todo el mundo, qué plantilla tiene cada uno
   y todos los movimientos del mercado. Con eso el saldo de un rival no
   se adivina: se reconstruye, apunte a apunte, como una cuenta
   corriente.

       saldo = 50.000.000
             - lo que costó su plantilla de salida
             - lo que ha comprado desde entonces
             + lo que ha vendido

   Y lo que de verdad importa para el mercado no es el saldo, es lo
   máximo que puede poner encima de la mesa, que en esta liga es el
   saldo más un 25 % del valor de su plantilla a crédito:

       poder de compra = saldo + 25 % del valor de la plantilla

   Este archivo no habla con la red ni con el DOM: entra un estado y
   sale un análisis. Por eso vale igual en Node y en el navegador, y
   por eso se puede probar.
   =================================================================== */
(function (raiz) {
  'use strict';

  /* --- Las reglas. Todas las cifras discutibles viven aquí ---------- */
  var REGLAS = {
    presupuestoInicial: 50000000,  // con lo que arrancó cada manager
    porcentajeDeuda: 0.25,         // crédito sobre el valor de plantilla
    multiplicadorClausula: 2,      // solo si el Mister no da la cláusula
    jornadaInicio: 2,              // la liga se reinició en la J2
    moneda: '€'
  };

  /* --- Utilidades -------------------------------------------------- */

  function esNumero(v) { return typeof v === 'number' && isFinite(v); }

  /** Acepta 12345678, "12.345.678 €", "12,3M", "1.2 M" y devuelve euros. */
  function aEuros(v) {
    if (esNumero(v)) return Math.round(v);
    if (v == null) return null;
    var t = String(v).trim().toLowerCase();
    if (!t) return null;
    var multiplicador = 1;
    if (/\bm(il)?l?(ones)?\b|\dm\b|\d\s?m\b/.test(t) && !/mil\s/.test(t)) multiplicador = 1000000;
    if (/\bk\b|\d\s?k\b/.test(t)) multiplicador = 1000;
    t = t.replace(/[^\d.,-]/g, '');
    if (!t) return null;
    // "12.345.678" es separador de miles; "12,3" es decimal.
    if (t.indexOf(',') >= 0) {
      t = t.replace(/\./g, '').replace(',', '.');
    } else if (multiplicador === 1 && /^\d{1,3}(\.\d{3})+$/.test(t)) {
      t = t.replace(/\./g, '');
    }
    var n = parseFloat(t);
    if (!isFinite(n)) return null;
    return Math.round(n * multiplicador);
  }

  /** 12345678 -> "12.345.678 €" ; en corto -> "12,3 M" */
  function dinero(n, corto) {
    if (!esNumero(n)) return '—';
    var signo = n < 0 ? '-' : '';
    var a = Math.abs(n);
    if (corto) {
      if (a >= 1000000) return signo + recorta(a / 1000000) + ' M';
      if (a >= 1000) return signo + recorta(a / 1000) + ' k';
      return signo + a;
    }
    return signo + a.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ' + REGLAS.moneda;
  }

  function recorta(x) {
    var s = (x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2));
    return s.replace(/\.?0+$/, '').replace('.', ',');
  }

  function clave(s) {
    return String(s == null ? '' : s).toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function suma(lista, f) {
    var t = 0;
    for (var i = 0; i < lista.length; i++) { var v = f(lista[i]); if (esNumero(v)) t += v; }
    return t;
  }

  /* --- Normalización ----------------------------------------------
     La captura puede venir de la API del Mister, de un pegado a mano o
     de un archivo antiguo. Aquí se aplana todo a la misma forma, y se
     aceptan los nombres de campo que cada fuente usa.
     ---------------------------------------------------------------- */

  function elegir(objeto, nombres, porDefecto) {
    for (var i = 0; i < nombres.length; i++) {
      var v = objeto[nombres[i]];
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return porDefecto;
  }

  function normalizarJugador(j, reglas) {
    if (typeof j === 'string') j = { nombre: j };
    var valor = aEuros(elegir(j, ['valor', 'value', 'market_value', 'precio', 'price'], null));
    var clausulaBruta = aEuros(elegir(j, ['clausula', 'clause', 'clause_value', 'buyout'], null));
    return {
      id: String(elegir(j, ['id', 'player_id', 'idJugador'], clave(elegir(j, ['nombre', 'name'], '')))),
      nombre: String(elegir(j, ['nombre', 'name'], 'Sin nombre')),
      posicion: normalizarPosicion(elegir(j, ['posicion', 'position', 'role'], null)),
      equipo: elegir(j, ['equipo', 'team', 'team_name'], null),
      valor: esNumero(valor) ? valor : 0,
      puntos: aEuros(elegir(j, ['puntos', 'points'], null)) || 0,
      clausula: esNumero(clausulaBruta) ? clausulaBruta : null,
      clausulaEstimada: !esNumero(clausulaBruta),
      fichadoPor: aEuros(elegir(j, ['fichadoPor', 'precioCompra', 'bought_for'], null))
    };
  }

  var POSICIONES = { 1: 'POR', 2: 'DEF', 3: 'MED', 4: 'DEL' };
  function normalizarPosicion(p) {
    if (p == null) return null;
    if (esNumero(p)) return POSICIONES[p] || null;
    var t = clave(p);
    if (/port|gk|goal/.test(t)) return 'POR';
    if (/def|cb|lb|rb/.test(t)) return 'DEF';
    if (/med|mid|cm|mc/.test(t)) return 'MED';
    if (/del|fw|st|atac/.test(t)) return 'DEL';
    return String(p).slice(0, 3).toUpperCase();
  }

  var TIPOS = ['compra', 'venta', 'clausula', 'traspaso', 'ingreso', 'gasto', 'ajuste'];

  function normalizarMovimiento(m) {
    var tipo = clave(elegir(m, ['tipo', 'type', 'kind'], 'ajuste'));
    if (/claus|resci/.test(tipo)) tipo = 'clausula';
    else if (/compr|buy|fich/.test(tipo)) tipo = 'compra';
    else if (/vend|vent|sell/.test(tipo)) tipo = 'venta';
    else if (/traspas|transfer|acuerd/.test(tipo)) tipo = 'traspaso';
    else if (/premio|ingres|bonus/.test(tipo)) tipo = 'ingreso';
    else if (/multa|gasto|penal/.test(tipo)) tipo = 'gasto';
    else if (TIPOS.indexOf(tipo) < 0) tipo = 'ajuste';

    var paga = elegir(m, ['paga', 'pagaId', 'compradorId', 'buyer', 'to'], null);
    var cobra = elegir(m, ['cobra', 'cobraId', 'vendedorId', 'seller', 'from'], null);

    // Si la fuente solo dice "manager" y el tipo ya implica el sentido.
    var suelto = elegir(m, ['managerId', 'manager', 'usuario', 'user_id'], null);
    if (suelto != null && paga == null && cobra == null) {
      if (tipo === 'compra' || tipo === 'clausula' || tipo === 'gasto') paga = suelto;
      else cobra = suelto;
    }

    return {
      fecha: elegir(m, ['fecha', 'date', 'created_at', 'timestamp'], null),
      tipo: tipo,
      importe: aEuros(elegir(m, ['importe', 'amount', 'precio', 'price', 'valor'], 0)) || 0,
      jugador: elegir(m, ['jugador', 'player', 'nombre'], null),
      jugadorId: elegir(m, ['jugadorId', 'player_id'], null),
      paga: paga == null ? null : String(paga),
      cobra: cobra == null ? null : String(cobra),
      nota: elegir(m, ['nota', 'texto', 'note'], null)
    };
  }

  function normalizar(bruto) {
    bruto = bruto || {};
    var reglas = Object.assign({}, REGLAS, bruto.reglas || {});
    var managers = (bruto.managers || bruto.usuarios || bruto.standings || []).map(function (m, i) {
      var jugadores = (m.jugadores || m.players || m.plantilla || []).map(function (j) {
        return normalizarJugador(j, reglas);
      });
      return {
        id: String(elegir(m, ['id', 'user_id', 'idManager'], 'm' + (i + 1))),
        nombre: String(elegir(m, ['nombre', 'name', 'username', 'alias'], 'Manager ' + (i + 1))),
        equipoNombre: elegir(m, ['equipoNombre', 'team_name', 'nombreEquipo'], null),
        puntos: aEuros(elegir(m, ['puntos', 'points'], 0)) || 0,
        posicion: aEuros(elegir(m, ['posicion', 'position', 'rank'], i + 1)) || (i + 1),
        saldoReal: aEuros(elegir(m, ['saldoReal', 'saldo', 'balance', 'money'], null)),
        jugadores: jugadores
      };
    });

    var movimientos = (bruto.movimientos || bruto.movements || bruto.news || [])
      .map(normalizarMovimiento)
      .filter(function (m) { return m.importe !== 0 || m.tipo === 'ajuste'; });

    movimientos.sort(function (a, b) {
      return String(a.fecha || '').localeCompare(String(b.fecha || ''));
    });

    var plantillasIniciales = bruto.plantillasIniciales || null;

    return {
      version: 2,
      liga: Object.assign({ nombre: 'Mi liga', jornada: reglas.jornadaInicio }, bruto.liga || {}),
      capturado: bruto.capturado || new Date().toISOString(),
      fuente: bruto.fuente || 'desconocida',
      demo: !!bruto.demo,
      yo: bruto.yo == null ? null : String(bruto.yo),
      reglas: reglas,
      managers: managers,
      movimientos: movimientos,
      mercado: (bruto.mercado || bruto.market || []).map(function (j) { return normalizarJugador(j, reglas); }),
      plantillasIniciales: plantillasIniciales
    };
  }

  /* --- El libro mayor ---------------------------------------------- */

  function clausulaDe(jugador, reglas) {
    if (esNumero(jugador.clausula) && jugador.clausula > 0) return jugador.clausula;
    return Math.round((jugador.valor || 0) * reglas.multiplicadorClausula);
  }

  function analizar(estadoBruto) {
    var estado = normalizar(estadoBruto);
    var reglas = estado.reglas;
    var avisos = [];

    /* La plantilla de salida. Si no se guardó cuando se reinició la
       liga, se asume que la de hoy es la de entonces: es lo mejor que
       se puede hacer, pero hay que decirlo en voz alta. */
    var baseAsumida = !estado.plantillasIniciales;
    var base = estado.plantillasIniciales || {};
    if (baseAsumida) {
      estado.managers.forEach(function (m) {
        base[m.id] = m.jugadores.map(function (j) {
          return { id: j.id, nombre: j.nombre, valor: j.valor };
        });
      });
      if (estado.movimientos.length) {
        avisos.push({
          nivel: 'aviso',
          texto: 'No hay plantillas de salida guardadas: se han tomado las de hoy como las del reinicio, así que los movimientos ya registrados podrían contarse dos veces. Guarda la base con «node bin/fijar-base.js».'
        });
      }
    }

    var porId = {};
    estado.managers.forEach(function (m) { porId[m.id] = m; });

    var fichas = estado.managers.map(function (m) {
      var plantillaSalida = base[m.id] || [];
      var costeSalida = suma(plantillaSalida, function (j) { return j.valor; });
      var libro = [];
      var saldo = reglas.presupuestoInicial;

      libro.push({ fecha: null, concepto: 'Presupuesto de salida', importe: reglas.presupuestoInicial, saldo: saldo });
      saldo -= costeSalida;
      libro.push({
        fecha: null,
        concepto: 'Plantilla del reinicio (' + plantillaSalida.length + ' jugadores)',
        importe: -costeSalida,
        saldo: saldo
      });

      estado.movimientos.forEach(function (mv) {
        var importe = 0, concepto = null;
        if (mv.paga === m.id) {
          importe = -mv.importe;
          concepto = (mv.tipo === 'clausula' ? 'Cláusula de ' : mv.tipo === 'gasto' ? '' : 'Ficha a ') + (mv.jugador || mv.nota || '');
          if (mv.cobra && porId[mv.cobra]) concepto += ' (a ' + porId[mv.cobra].nombre + ')';
        } else if (mv.cobra === m.id) {
          importe = mv.importe;
          concepto = (mv.tipo === 'ingreso' ? '' : 'Vende a ') + (mv.jugador || mv.nota || '');
          if (mv.paga && porId[mv.paga]) concepto += ' (a ' + porId[mv.paga].nombre + ')';
        } else {
          return;
        }
        saldo += importe;
        libro.push({
          fecha: mv.fecha,
          concepto: (concepto || mv.tipo).trim() || mv.tipo,
          tipo: mv.tipo,
          importe: importe,
          saldo: saldo
        });
      });

      var valorPlantilla = suma(m.jugadores, function (j) { return j.valor; });
      var credito = Math.round(valorPlantilla * reglas.porcentajeDeuda);

      /* Cuadre: ¿la plantilla de hoy se explica con la de salida más
         los movimientos? Lo que no cuadra es dinero que no hemos visto. */
      var deberiaTener = {};
      plantillaSalida.forEach(function (j) { deberiaTener[j.id] = j.nombre; });
      estado.movimientos.forEach(function (mv) {
        if (!mv.jugadorId) return;
        if (mv.paga === m.id) deberiaTener[mv.jugadorId] = mv.jugador;
        if (mv.cobra === m.id) delete deberiaTener[mv.jugadorId];
      });
      var tieneHoy = {};
      m.jugadores.forEach(function (j) { tieneHoy[j.id] = j; });
      var sinExplicar = m.jugadores.filter(function (j) { return !(j.id in deberiaTener); });
      var desaparecidos = Object.keys(deberiaTener).filter(function (id) { return !(id in tieneHoy); });

      // Cada fichaje no visto es dinero de menos; cada venta no vista, de más.
      var ajusteProbable = -suma(sinExplicar, function (j) { return j.valor; });
      desaparecidos.forEach(function (id) {
        var j = (plantillaSalida.filter(function (x) { return x.id === id; })[0]) || null;
        if (j) ajusteProbable += j.valor;
      });

      var saldoFuente = 'calculado';
      if (esNumero(m.saldoReal)) { saldo = m.saldoReal; saldoFuente = 'real'; }

      var nivel = saldoFuente === 'real' ? 'exacto'
        : (sinExplicar.length || desaparecidos.length) ? 'incompleto'
        : baseAsumida && estado.movimientos.length ? 'dudoso' : 'estimado';

      return {
        id: m.id,
        nombre: m.nombre,
        equipoNombre: m.equipoNombre,
        esYo: estado.yo != null && m.id === estado.yo,
        puntos: m.puntos,
        posicion: m.posicion,
        jugadores: m.jugadores.map(function (j) {
          return Object.assign({}, j, { clausulaCalculada: clausulaDe(j, reglas) });
        }).sort(function (a, b) { return b.valor - a.valor; }),
        nJugadores: m.jugadores.length,
        costeSalida: costeSalida,
        valorPlantilla: valorPlantilla,
        saldo: saldo,
        saldoFuente: saldoFuente,
        ajusteProbable: ajusteProbable,
        saldoAjustado: saldo + ajusteProbable,
        credito: credito,
        poderCompra: saldo + credito,
        valorTotal: valorPlantilla + saldo,
        libro: libro,
        fiabilidad: nivel,
        sinExplicar: sinExplicar.map(function (j) { return j.nombre; }),
        desaparecidos: desaparecidos.map(function (id) { return deberiaTener[id]; })
      };
    });

    fichas.sort(function (a, b) { return b.poderCompra - a.poderCompra; });
    fichas.forEach(function (f, i) { f.puestoPoder = i + 1; });

    var yo = fichas.filter(function (f) { return f.esYo; })[0] || null;
    var rivales = fichas.filter(function (f) { return !f.esYo; });

    /* Amenazas: quién puede pagarme la cláusula de cada jugador mío. */
    var amenazas = [];
    if (yo) {
      yo.jugadores.forEach(function (j) {
        var pueden = rivales.filter(function (r) { return r.poderCompra >= j.clausulaCalculada; })
          .map(function (r) {
            return { id: r.id, nombre: r.nombre, poderCompra: r.poderCompra, margen: r.poderCompra - j.clausulaCalculada };
          })
          .sort(function (a, b) { return b.margen - a.margen; });
        var masCerca = null;
        if (!pueden.length && rivales.length) {
          var top = rivales.slice().sort(function (a, b) { return b.poderCompra - a.poderCompra; })[0];
          masCerca = { nombre: top.nombre, leFaltan: j.clausulaCalculada - top.poderCompra };
        }
        amenazas.push({
          jugador: j.nombre, posicion: j.posicion, equipo: j.equipo,
          valor: j.valor, clausula: j.clausulaCalculada, estimada: j.clausulaEstimada,
          pueden: pueden, masCerca: masCerca,
          riesgo: pueden.length === 0 ? 'a salvo' : pueden.length <= 2 ? 'vigilar' : 'en peligro'
        });
      });
      amenazas.sort(function (a, b) {
        return (b.pueden.length - a.pueden.length) || (b.valor - a.valor);
      });
    }

    /* Oportunidades: a quién le puedo pagar yo la cláusula. */
    var oportunidades = [];
    if (yo) {
      rivales.forEach(function (r) {
        r.jugadores.forEach(function (j) {
          if (j.clausulaCalculada <= yo.poderCompra) {
            oportunidades.push({
              jugador: j.nombre, posicion: j.posicion, equipo: j.equipo,
              de: r.nombre, deId: r.id,
              valor: j.valor, clausula: j.clausulaCalculada, estimada: j.clausulaEstimada,
              meQueda: yo.poderCompra - j.clausulaCalculada,
              sobrecoste: j.clausulaCalculada - j.valor
            });
          }
        });
      });
      oportunidades.sort(function (a, b) { return b.valor - a.valor; });
    }

    /* Mercado: quién puede permitirse cada jugador libre. */
    var mercado = estado.mercado.map(function (j) {
      var c = j.valor;
      return {
        jugador: j.nombre, posicion: j.posicion, equipo: j.equipo, valor: j.valor,
        puedenPujar: fichas.filter(function (f) { return f.poderCompra >= c; })
          .map(function (f) { return f.nombre; })
      };
    });

    if (!estado.managers.length) avisos.push({ nivel: 'error', texto: 'No hay ningún manager en los datos. Haz una captura desde el Mister.' });
    if (estado.yo == null && estado.managers.length) avisos.push({ nivel: 'aviso', texto: 'No está marcado cuál eres tú: sin eso no hay amenazas ni oportunidades. Ponlo en reglas.json («yo»).' });
    fichas.forEach(function (f) {
      if (f.sinExplicar.length) {
        avisos.push({
          nivel: 'aviso',
          texto: f.nombre + ' tiene ' + f.sinExplicar.length + ' jugador(es) que no vienen de la plantilla de salida ni de un movimiento registrado (' + f.sinExplicar.join(', ') + '). Su saldo está inflado en al menos ' + dinero(-f.ajusteProbable) + '.'
        });
      }
    });

    return {
      liga: estado.liga,
      capturado: estado.capturado,
      fuente: estado.fuente,
      demo: estado.demo,
      reglas: reglas,
      baseAsumida: baseAsumida,
      yo: yo,
      managers: fichas,
      rivales: rivales,
      amenazas: amenazas,
      oportunidades: oportunidades,
      mercado: mercado,
      movimientos: estado.movimientos,
      avisos: avisos,
      totales: {
        managers: fichas.length,
        dineroEnJuego: suma(fichas, function (f) { return f.saldo; }),
        valorTotalLiga: suma(fichas, function (f) { return f.valorPlantilla; }),
        movimientos: estado.movimientos.length
      }
    };
  }

  var api = {
    REGLAS: REGLAS,
    aEuros: aEuros,
    dinero: dinero,
    clave: clave,
    normalizar: normalizar,
    normalizarJugador: normalizarJugador,
    normalizarMovimiento: normalizarMovimiento,
    clausulaDe: clausulaDe,
    analizar: analizar
  };

  raiz.MotorMister = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

/* ===================================================================
   captura.js · saca TU liga del Mister desde TU navegador
   -------------------------------------------------------------------
   Cómo se usa (en el ordenador, con la liga abierta y la sesión
   iniciada en mister.mundodeportivo.com):

     1. F12 → pestaña «Console»
     2. Si Chrome te dice que no puedes pegar, escribe:  allow pasting
     3. Pega este archivo entero y pulsa Enter
     4. Sigue las instrucciones que salen en pantalla

   Por qué está hecho así: este archivo no supone que conoce la API del
   Mister. Se engancha a las llamadas que hace la propia página, apunta
   todo lo que pasa por ahí y luego lo interpreta. Si el Mister cambia
   sus rutas mañana, esto sigue funcionando, porque escucha en lugar de
   adivinar. Y si aun así no entiende algo, guarda el material en bruto
   para que no se pierda nada.
   =================================================================== */
(function () {
  'use strict';

  if (window.mister && window.mister.__vivo) {
    console.log('%cLa captura ya estaba puesta. Usa mister.estado() o mister.guardar()', 'color:#25E39A');
    return;
  }

  var CAP = {
    respuestas: [],   // {url, datos}
    pantallas: [],    // texto visible de cada pantalla, por si falla lo demás
    __vivo: true
  };

  var LIMITE = 400;   // respuestas guardadas como mucho

  /* ---------- 1. Escuchar lo que la página pide ------------------- */

  function apuntar(url, texto) {
    if (!texto || texto.length > 3000000) return;
    var datos;
    try { datos = JSON.parse(texto); } catch (e) { return; }
    if (!datos || typeof datos !== 'object') return;
    CAP.respuestas.push({ url: String(url), datos: datos, cuando: Date.now() });
    if (CAP.respuestas.length > LIMITE) CAP.respuestas.shift();
    pintarContador();
  }

  var fetchOriginal = window.fetch;
  window.fetch = function () {
    var url = (arguments[0] && arguments[0].url) || arguments[0];
    return fetchOriginal.apply(this, arguments).then(function (r) {
      try { r.clone().text().then(function (t) { apuntar(url, t); }).catch(function () {}); } catch (e) {}
      return r;
    });
  };

  var abrirOriginal = XMLHttpRequest.prototype.open;
  var enviarOriginal = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (metodo, url) {
    this.__url = url;
    return abrirOriginal.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    var xhr = this;
    xhr.addEventListener('load', function () {
      try { apuntar(xhr.__url, xhr.responseText); } catch (e) {}
    });
    return enviarOriginal.apply(this, arguments);
  };

  /* ---------- 2. Rebuscar en el árbol de cualquier JSON ----------- */

  function num(v) {
    if (typeof v === 'number' && isFinite(v)) return v;
    if (typeof v === 'string') {
      var t = v.replace(/[^\d,.-]/g, '');
      if (!t) return null;
      if (t.indexOf(',') >= 0) t = t.replace(/\./g, '').replace(',', '.');
      else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
      var n = parseFloat(t);
      return isFinite(n) ? n : null;
    }
    return null;
  }

  var CAMPO_NOMBRE = ['name', 'nombre', 'nickname', 'username', 'alias', 'player_name', 'slug'];
  var CAMPO_VALOR = ['value', 'market_value', 'valor', 'price', 'precio', 'player_value'];
  var CAMPO_PUNTOS = ['points', 'puntos', 'total_points', 'score'];

  function coger(o, campos) {
    for (var i = 0; i < campos.length; i++) {
      if (o[campos[i]] !== undefined && o[campos[i]] !== null && o[campos[i]] !== '') return o[campos[i]];
    }
    return null;
  }

  function esJugador(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
    var n = coger(o, CAMPO_NOMBRE);
    if (typeof n !== 'string' || !n.trim()) return false;
    var v = num(coger(o, CAMPO_VALOR));
    if (v == null) return false;
    if (v < 1000 || v > 900000000) return false;
    // Un jugador suele traer posición o equipo; un manager no.
    return o.position != null || o.posicion != null || o.role != null ||
           o.team != null || o.team_id != null || o.equipo != null || o.player_id != null;
  }

  function esManager(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
    var n = coger(o, CAMPO_NOMBRE);
    if (typeof n !== 'string' || !n.trim()) return false;
    var tienePlantilla = ['players', 'jugadores', 'squad', 'team', 'lineup'].some(function (k) {
      return Array.isArray(o[k]) && o[k].some(esJugador);
    });
    if (tienePlantilla) return true;
    var p = num(coger(o, CAMPO_PUNTOS));
    return p != null && (o.position != null || o.rank != null || o.team_name != null || o.id != null) && !esJugador(o);
  }

  function recorrer(raiz, visita, profundidad) {
    profundidad = profundidad || 0;
    if (!raiz || typeof raiz !== 'object' || profundidad > 8) return;
    if (Array.isArray(raiz)) {
      visita(raiz, profundidad);
      for (var i = 0; i < raiz.length && i < 500; i++) recorrer(raiz[i], visita, profundidad + 1);
      return;
    }
    for (var k in raiz) {
      if (Object.prototype.hasOwnProperty.call(raiz, k)) recorrer(raiz[k], visita, profundidad + 1);
    }
  }

  function jugadoresDe(o) {
    var lista = [];
    ['players', 'jugadores', 'squad', 'team', 'lineup'].forEach(function (k) {
      if (Array.isArray(o[k])) o[k].forEach(function (j) { if (esJugador(j)) lista.push(traducirJugador(j)); });
    });
    return lista;
  }

  function traducirJugador(j) {
    var valor = num(coger(j, CAMPO_VALOR));
    var clausula = num(coger(j, ['clause', 'clause_value', 'clausula', 'buyout', 'buyout_clause']));
    return {
      id: String(coger(j, ['id', 'player_id', 'playerId']) || coger(j, CAMPO_NOMBRE)),
      nombre: String(coger(j, CAMPO_NOMBRE)),
      posicion: coger(j, ['position', 'posicion', 'role']),
      equipo: (j.team && (j.team.name || j.team.short_name)) || j.team_name || j.equipo || null,
      valor: valor,
      clausula: clausula,
      puntos: num(coger(j, CAMPO_PUNTOS))
    };
  }

  function traducirManager(m) {
    return {
      id: String(coger(m, ['id', 'user_id', 'userId']) || coger(m, CAMPO_NOMBRE)),
      nombre: String(coger(m, CAMPO_NOMBRE)),
      equipoNombre: m.team_name || m.nombreEquipo || null,
      puntos: num(coger(m, CAMPO_PUNTOS)),
      posicion: num(coger(m, ['position', 'rank', 'posicion'])),
      saldoReal: num(coger(m, ['balance', 'money', 'saldo', 'budget'])),
      jugadores: jugadoresDe(m)
    };
  }

  var PALABRAS = [
    [/claus|resci/i, 'clausula'],
    [/vend|sold|sale/i, 'venta'],
    [/compr|bought|buy|sign|fich/i, 'compra'],
    [/traspas|transfer|swap/i, 'traspaso'],
    [/premio|bonus|prize/i, 'ingreso']
  ];

  function esMovimiento(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
    var importe = num(coger(o, ['amount', 'price', 'importe', 'value', 'transfer_price']));
    if (importe == null || importe < 1000) return false;
    var fecha = coger(o, ['date', 'created_at', 'fecha', 'datetime', 'timestamp']);
    return fecha != null;
  }

  function traducirMovimiento(o) {
    var texto = JSON.stringify(o).slice(0, 600);
    var tipo = 'ajuste';
    for (var i = 0; i < PALABRAS.length; i++) { if (PALABRAS[i][0].test(texto)) { tipo = PALABRAS[i][1]; break; } }
    var comprador = o.buyer || o.to || o.user_to || o.comprador || null;
    var vendedor = o.seller || o.from || o.user_from || o.vendedor || null;
    function id(x) { return x == null ? null : String(typeof x === 'object' ? (x.id || x.name) : x); }
    var jugador = o.player || o.jugador || null;
    return {
      fecha: coger(o, ['date', 'created_at', 'fecha', 'datetime', 'timestamp']),
      tipo: tipo,
      importe: num(coger(o, ['amount', 'price', 'importe', 'value', 'transfer_price'])),
      jugador: jugador && (jugador.name || jugador.nombre) || o.player_name || null,
      jugadorId: jugador && (jugador.id) || o.player_id || null,
      paga: id(comprador),
      cobra: id(vendedor),
      crudo: o
    };
  }

  /* ---------- 3. Montar la liga con lo apuntado ------------------- */

  function interpretar() {
    var managers = {}, movimientos = [], mercado = {}, liga = null;

    CAP.respuestas.forEach(function (r) {
      recorrer(r.datos, function (lista) {
        var deManagers = lista.filter(esManager);
        if (deManagers.length >= 2) {
          deManagers.forEach(function (m) {
            var t = traducirManager(m);
            if (!t.nombre) return;
            var previo = managers[t.id];
            if (!previo || (t.jugadores.length > previo.jugadores.length)) managers[t.id] = t;
            else if (previo && t.puntos != null && previo.puntos == null) previo.puntos = t.puntos;
          });
        }
        var deMovimientos = lista.filter(esMovimiento);
        if (deMovimientos.length) deMovimientos.forEach(function (m) { movimientos.push(traducirMovimiento(m)); });
      });

      // Un equipo suelto: la pantalla de la plantilla de un rival.
      if (esManager(r.datos)) {
        var t = traducirManager(r.datos);
        if (t.nombre && (!managers[t.id] || t.jugadores.length > managers[t.id].jugadores.length)) managers[t.id] = t;
      }
      if (r.datos && (r.datos.league || r.datos.community)) {
        var l = r.datos.league || r.datos.community;
        liga = { id: String(l.id || ''), nombre: l.name || l.nombre || 'Mi liga', jornada: num(l.gameweek || l.matchday) };
      }
      // Mercado: jugadores sueltos sin dueño en respuestas cuya url lo diga.
      if (/market|mercado/i.test(r.url)) {
        recorrer(r.datos, function (lista) {
          lista.filter(esJugador).forEach(function (j) {
            var t = traducirJugador(j); mercado[t.id] = t;
          });
        });
      }
    });

    // Quitar movimientos repetidos (la misma noticia vista dos veces).
    var vistos = {};
    movimientos = movimientos.filter(function (m) {
      var k = [m.fecha, m.importe, m.jugador].join('|');
      if (vistos[k]) return false; vistos[k] = 1; return true;
    }).sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)); });

    return {
      fuente: 'captura-navegador',
      capturado: new Date().toISOString(),
      liga: liga || { nombre: document.title || 'Mi liga' },
      yo: null,
      managers: Object.keys(managers).map(function (k) { return managers[k]; }),
      movimientos: movimientos,
      mercado: Object.keys(mercado).map(function (k) { return mercado[k]; })
    };
  }

  /* ---------- 4. Barrido automático de plantillas ----------------- */

  function barrer() {
    var liga = interpretar();
    var ids = liga.managers.map(function (m) { return m.id; }).filter(function (x) { return /^\d+$/.test(x); });
    // Buscar una url ya vista que lleve dentro el id de un manager.
    var patron = null;
    CAP.respuestas.forEach(function (r) {
      ids.forEach(function (id) {
        if (!patron && r.url.indexOf('/' + id) >= 0 && /team|plantilla|squad|user/i.test(r.url)) {
          patron = r.url.replace('/' + id, '/{ID}');
        }
      });
    });
    if (!patron) {
      console.log('%cAún no sé la dirección de las plantillas. Entra a mano en el equipo de UN rival y vuelve a ejecutar mister.barrer()', 'color:#F2B23C');
      return Promise.resolve(0);
    }
    console.log('%cBarriendo ' + ids.length + ' plantillas con ' + patron, 'color:#25E39A');
    return Promise.all(ids.map(function (id) {
      return fetchOriginal(patron.replace('{ID}', id), { credentials: 'include' })
        .then(function (r) { return r.text(); })
        .then(function (t) { apuntar(patron.replace('{ID}', id), t); })
        .catch(function () {});
    })).then(function () { return ids.length; });
  }

  /* ---------- 5. Salida ------------------------------------------- */

  function descargar(nombre, contenido) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([contenido], { type: 'application/json' }));
    a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
  }

  function resumen(liga) {
    var jug = liga.managers.reduce(function (t, m) { return t + m.jugadores.length; }, 0);
    console.log('%c\n  ' + liga.managers.length + ' managers   ' + jug + ' jugadores   ' +
      liga.movimientos.length + ' movimientos   ' + liga.mercado.length + ' en el mercado\n',
      'color:#25E39A;font-size:14px;font-weight:bold');
    liga.managers.forEach(function (m) {
      console.log('   ' + (m.nombre || '?').padEnd(20) + String(m.jugadores.length).padStart(3) + ' jugadores' +
        (m.puntos != null ? '   ' + m.puntos + ' pts' : ''));
    });
    var sinPlantilla = liga.managers.filter(function (m) { return !m.jugadores.length; });
    if (sinPlantilla.length) {
      console.log('%c   Faltan las plantillas de: ' + sinPlantilla.map(function (m) { return m.nombre; }).join(', ') +
        '\n   → entra en su equipo, o ejecuta mister.barrer()', 'color:#F2B23C');
    }
    return liga;
  }

  var contadorPintado = 0;
  function pintarContador() {
    if (CAP.respuestas.length - contadorPintado >= 10) {
      contadorPintado = CAP.respuestas.length;
      console.log('%c  … ' + CAP.respuestas.length + ' respuestas apuntadas', 'color:#8A8378');
    }
  }

  window.mister = {
    __vivo: true,
    estado: function () { return resumen(interpretar()); },
    barrer: function () { return barrer().then(function () { return resumen(interpretar()); }); },
    pantalla: function () {
      CAP.pantallas.push({ url: location.href, texto: document.body.innerText });
      console.log('Pantalla guardada (' + CAP.pantallas.length + ').');
    },
    guardar: function () {
      var liga = interpretar();
      liga.pantallas = CAP.pantallas;
      var texto = JSON.stringify(liga, null, 1);
      descargar('mi-liga-mister.json', texto);
      try {
        navigator.clipboard.writeText(texto).then(function () {
          console.log('%c  Copiado al portapapeles y descargado como mi-liga-mister.json', 'color:#25E39A;font-weight:bold');
        }).catch(function () {
          console.log('%c  Descargado como mi-liga-mister.json (el portapapeles lo ha bloqueado el navegador)', 'color:#25E39A;font-weight:bold');
        });
      } catch (e) {
        console.log('%c  Descargado como mi-liga-mister.json', 'color:#25E39A;font-weight:bold');
      }
      resumen(liga);
      return liga;
    },
    crudo: function () {
      descargar('mister-crudo.json', JSON.stringify(CAP.respuestas.map(function (r) {
        return { url: r.url, datos: r.datos };
      }), null, 1));
      console.log('Material en bruto descargado: mister-crudo.json');
    },
    respuestas: function () { return CAP.respuestas; }
  };

  console.log('%c\n  CAPTURA PUESTA\n', 'color:#25E39A;font-size:16px;font-weight:bold');
  console.log('%c  Ahora pasa por estas pantallas de la liga, sin prisa:\n' +
    '    1. Clasificación\n' +
    '    2. El equipo de UN rival (con eso ya sé la dirección del resto)\n' +
    '    3. Actividad / Noticias  — cuanto más atrás bajes, mejor sale el dinero\n' +
    '    4. Mercado\n\n' +
    '  Y luego, en esta consola:\n' +
    '    mister.barrer()    trae las plantillas de todos los demás de golpe\n' +
    '    mister.guardar()   descarga tu liga y la copia al portapapeles\n',
    'color:#F7F5F0;font-size:12px');
})();

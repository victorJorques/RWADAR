  /* ================= entrenamiento diario: recuperar, espaciar y mezclar ================= */
  const AUTO = ['formula', 'predice', 'test', 'respuesta_corta', 'cinta', 'senala', 'ordenar'];
  const SALTOS = [0, 1, 3, 7, 16, 35]; // días hasta el siguiente repaso según la caja
  function programarEntreno(l) {
    // Al terminar una lección: vuelven mañana los ejercicios fallados o con ayuda (su «gemelo») y, a los 3 días, dos ejercicios clave.
    P.mem = P.mem || {};
    const ejs = ejerciciosDe(l).filter((e) => AUTO.includes(e.modo));
    const flojos = ejs.filter((e) => P.ej[e.id] && !P.ej[e.id].primera);
    const formulas = ejs.filter((e) => e.modo === 'formula' && !flojos.includes(e));
    const clave = [...formulas.slice(-1), ...ejs.filter((e) => !flojos.includes(e) && !formulas.slice(-1).includes(e)).slice(-1)];
    for (const e of flojos) if (!P.mem[e.id]) P.mem[e.id] = { caja: 1, prox: sumarDias(1) };
    for (const e of clave) if (!P.mem[e.id]) P.mem[e.id] = { caja: 2, prox: sumarDias(3) };
  }
  function entrenoPendiente() {
    const m = P.mem || {}; const h0 = hoy();
    return Object.entries(m).filter(([id, v]) => v.prox && v.prox <= h0 && EJ_INDEX[id]).sort((a, b) => (a[1].prox < b[1].prox ? -1 : 1));
  }
  function elegirEntreno(max) {
    const porLeccion = {}; const out = [];
    for (const [id] of entrenoPendiente()) {
      const lec = id.replace(/-(e|q|r|s)\d+$/, '');
      porLeccion[lec] = (porLeccion[lec] || 0) + 1;
      if (porLeccion[lec] > 2) continue; // mezclar: como mucho dos de la misma lección
      out.push(id); if (out.length >= max) break;
    }
    return barajar(out, hoy());
  }
  let modoSesion = false; let sesionPista = false;
  function vistaEntrenar() {
    titulo('Entrenamiento');
    const ids = elegirEntreno(7);
    if (!ids.length) {
      vista().replaceChildren(h('div', { class: 'jugar' }, h('div', { class: 'jugar-cab' }, h('a', { class: 'cerrar', href: '#inicio', 'aria-label': 'Volver al mapa' }, '✕'), h('div'), h('span')), h('div', { class: 'resultado' }, h('h1', null, 'Hoy no toca entrenar'), h('p', { class: 'entradilla' }, 'El entrenamiento te trae de vuelta ejercicios de lecciones pasadas justo cuando empiezan a olvidarse. Aparecerán aquí a partir de mañana de tu primera lección.'), h('a', { class: 'boton primario gigante', href: '#inicio' }, 'Volver al mapa'))));
      return;
    }
    document.body.classList.add('jugando'); modoSesion = true;
    const cola = ids.map((id) => ({ id })); const res = {}; let i = 0; let xp0 = P.xp || 0;
    const barraProg = h('div', { class: 'progreso-leccion' }, h('i', { style: { width: '0%' } }));
    const zona = h('div', { class: 'pantalla-jugar' });
    const msj = h('span', { class: 'msj-barra', role: 'status' });
    const btn = h('button', { class: 'boton primario gigante', type: 'button', disabled: true }, 'Continuar');
    const barra = h('div', { class: 'barra-continuar' }, h('div', { class: 'in' }, msj, btn));
    const cont = h('div', { class: 'jugar' }, h('div', { class: 'jugar-cab' }, h('a', { class: 'cerrar', href: '#inicio', 'aria-label': 'Salir' }, '✕'), barraProg, h('span', { class: 'tenue mono' }, '')), zona, barra);
    function pintar() {
      const item = cola[i]; const orig = EJ_INDEX[item.id]; const lec = LEC[item.id.replace(/-(e|q|r|s)\d+$/, '')];
      const q = { ...orig, id: 'en-' + item.id + '-' + i };
      sesionPista = false;
      barraProg.firstChild.style.width = Math.round(i / cola.length * 100) + '%';
      cont.querySelector('.jugar-cab .mono').textContent = `${i + 1}/${cola.length}`;
      zona.replaceChildren(h('div', { class: 'etq-pantalla' }, item.rep ? 'Otra vez: a por él' : 'De una lección anterior' + (lec ? ': ' + lec.titulo : '')), renderEjercicio(q, { titulo: lec ? lec.titulo : 'entrenamiento' }));
      barra.className = 'barra-continuar'; msj.textContent = 'Recuerda cómo se hacía antes de mirar nada'; btn.disabled = true;
      let primerIntento = true;
      escuchaEj = (id, ok, info) => {
        if (id !== q.id) return;
        const limpio = ok && primerIntento && !sesionPista && !(info && info.vista);
        if (primerIntento && !item.rep) {
          res[item.id] = limpio;
          const m = P.mem[item.id];
          if (limpio) { m.caja = Math.min(5, (m.caja || 1) + 1); m.prox = m.caja >= 5 ? null : sumarDias(SALTOS[m.caja]); ganarXP(5, btn); }
          else { m.caja = 1; m.prox = sumarDias(1); if (AUTO.includes(orig.modo)) cola.push({ id: item.id, rep: true }); }
        }
        primerIntento = false;
        if (ok) { sonidoBien(); barra.className = 'barra-continuar bien'; msj.textContent = limpio ? '¡Lo recuerdas! +5 XP' : '¡Bien!'; btn.disabled = false; }
        else if (info && info.vista) { barra.className = 'barra-continuar mal'; msj.textContent = 'Mira la solución: mañana vuelve'; btn.disabled = false; }
        else { sonidoMal(); barra.className = 'barra-continuar mal'; if (orig.modo === 'formula') msj.textContent = 'Casi. Inténtalo otra vez o pide una pista'; else { msj.textContent = 'Mañana vuelve a salirte'; btn.disabled = false; } }
      };
      window.scrollTo(0, 0);
    }
    btn.addEventListener('click', () => { i++; if (i < cola.length) pintar(); else fin(); });
    function fin() {
      modoSesion = false; escuchaEj = null; document.body.classList.remove('jugando');
      P.entreno = hoy(); ganarXP(10); comprobarLogros(); guardar(); sonidoFin();
      const bien = Object.values(res).filter(Boolean).length; const total = Object.keys(res).length;
      cont.replaceChildren(h('div', { class: 'resultado' }, h('h1', null, bien === total ? '¡Memoria de elefanta!' : 'Entrenamiento hecho'), h('p', { class: 'entradilla' }, `Has recordado a la primera ${bien} de ${total}. ${bien < total ? 'Lo que ha fallado vuelve mañana; lo que has acertado, dentro de más días.' : 'Cada acierto aleja el siguiente repaso: así se queda para siempre.'}`),
        h('div', { class: 'recuadros' }, h('div', { class: 'recuadro oro' }, h('b', null, '+' + ((P.xp || 0) - xp0)), h('span', null, 'XP')), h('div', { class: 'recuadro fuego' }, h('b', null, rachaActual()), h('span', null, 'días de racha')), h('div', { class: 'recuadro verde' }, h('b', null, entrenoPendiente().length), h('span', null, 'pendientes'))),
        h('div', { class: 'fila', style: { justifyContent: 'center' } }, entrenoPendiente().length ? h('button', { class: 'boton', type: 'button', onclick: () => vistaEntrenar() }, 'Otra tanda') : null, h('a', { class: 'boton primario gigante', href: '#inicio' }, 'Volver al mapa'))));
      window.scrollTo(0, 0);
    }
    vista().replaceChildren(cont); pintar();
  }

  /* ================= misión de hoy ================= */
  function misionDeHoy() {
    const meta = P.meta || 50; const tareas = [];
    tareas.push({ t: `Consigue ${meta} XP`, hecho: xpHoy() >= meta, href: null, detalle: `${Math.min(xpHoy(), meta)}/${meta}` });
    const nE = entrenoPendiente().length;
    if (nE || P.entreno === hoy()) tareas.push({ t: 'Haz el entrenamiento', hecho: P.entreno === hoy() && !nE, href: '#entrenar', detalle: nE ? `${Math.min(nE, 7)} ejercicios` : '' });
    const nT = tarjetasPendientes().length;
    if (nT || P.repasoHoy === hoy()) tareas.push({ t: 'Repasa tus tarjetas', hecho: !nT, href: '#repaso', detalle: nT ? `${nT} tarjetas` : '' });
    const todas = tareas.every((x) => x.hecho);
    return { tareas, todas, cobrado: P.cofre === hoy() };
  }
  function panelMision() {
    const m = misionDeHoy();
    const fila = (x) => { const cont = [h('span', { class: x.hecho ? 'ok' : 'pend' }, x.hecho ? '✓' : '○'), h('span', null, x.t), h('span', { class: 'tenue mono' }, x.detalle || '')]; return x.href && !x.hecho ? h('a', { class: 'req', href: x.href, style: { textDecoration: 'none', color: 'inherit' } }, cont) : h('div', { class: 'req' }, cont); };
    return h('section', { class: 'mision-hoy' }, h('div', { class: 'entre' }, h('h3', null, 'Misión de hoy'), P.plan ? h('span', { class: 'tenue' }, 'Tu plan: ' + P.plan) : null), m.tareas.map(fila),
      m.todas && !m.cobrado ? h('button', { class: 'boton primario', type: 'button', onclick: (e) => { P.cofre = hoy(); ganarXP(15, e.currentTarget); confeti(); sonidoFin(); guardar(); vistaMapa(); } }, 'Misión cumplida: recoge +15 XP') : m.cobrado ? h('p', { class: 'tenue' }, 'Misión de hoy cumplida. Mañana, más.') : null);
  }

  /* ================= el método (la ciencia que hay detrás) ================= */
  const METODO = [
    { t: 'Recordar sin mirar enseña más que releer', dato: 'Una semana después, quienes se habían examinado recordaban el 56 % del texto; quienes lo habían releído, el 42 %. Y los que releyeron creían estar mejor preparados.', cita: 'Roediger y Karpicke (2006), Psychological Science 17(3), 249-255', aqui: 'Cada lección termina con «Recuerda sin mirar», cada módulo empieza con un repaso y casi todo lo que haces es contestar, no leer.' },
    { t: 'Repasar con huecos que crecen', dato: 'El hueco ideal entre repasos depende de cuánto tiempo quieres recordar: entre el 20 y el 40 % de ese tiempo si es una semana, entre el 5 y el 10 % si es un año.', cita: 'Cepeda, Vul, Rohrer, Wixted y Pashler (2008), Psychological Science 19(11), 1095-1102', aqui: 'Las tarjetas y el entrenamiento vuelven al cabo de 1, 3, 7, 16 y 35 días: cada acierto aleja el siguiente repaso.' },
    { t: 'Mezclar problemas distintos', dato: 'Con práctica mezclada, la nota un mes después fue del 74 %; con práctica por bloques del mismo tipo, del 42 %.', cita: 'Rohrer, Dedrick y Stershic (2015), Journal of Educational Psychology 107(3), 900-908', aqui: 'El entrenamiento diario mezcla ejercicios de lecciones diferentes: así aprendes a elegir la herramienta, que es lo difícil en la oficina.' },
    { t: 'Primero un ejemplo resuelto, luego a medias, luego sola', dato: 'Quitar la ayuda poco a poco (primero los últimos pasos) da mejores resultados que pasar de golpe del ejemplo al problema.', cita: 'Renkl, Atkinson, Maier y Staley (2002), Journal of Experimental Education 70(4), 293-315', aqui: 'El primer ejercicio de cada idea viene casi hecho, el siguiente tiene pistas y el último lo resuelves tú.' },
    { t: 'Guía clara al empezar; equivocarse sin miedo después', dato: 'Quien parte de cero aprende mejor con explicaciones y ejemplos que descubriendo sola. Y entrenar animando a explorar y a equivocarse mejora la capacidad de resolver tareas nuevas (efecto medio d = 0,44; 18 de los 24 estudios eran de aprender un programa de ordenador).', cita: 'Kirschner, Sweller y Clark (2006), Educational Psychologist 41(2); Keith y Frese (2008), Journal of Applied Psychology 93(1)', aqui: 'En los primeros niveles se explica y se muestra antes de pedir. Después hay ejercicios de «arregla el error», y fallar nunca penaliza: el ejercicio simplemente vuelve.' },
    { t: 'Una corrección que explica', dato: 'Decir solo «bien» o «mal» apenas enseña (d = 0,46); explicar qué ha pasado, por qué y qué hacer enseña el doble (d = 0,99).', cita: 'Wisniewski, Zierer y Hattie (2020), Frontiers in Psychology 10, 3087', aqui: 'La hoja te dice en qué celda falla tu fórmula, qué da y qué debería dar; cada opción de un test explica por qué es correcta o no.' },
    { t: 'Una pantalla, una idea', dato: 'Ir y venir entre unas instrucciones y el programa satura la memoria de trabajo y se aprende menos.', cita: 'Chandler y Sweller (1996), Applied Cognitive Psychology 10(2), 151-170', aqui: 'Cada pantalla tiene una sola idea o un solo ejercicio, y la hoja está siempre junto al enunciado.' },
    { t: 'Tareas completas y reales desde el principio', dato: 'Los modelos de formación profesional más contrastados ponen en el centro tareas enteras con sentido, no piezas sueltas.', cita: 'van Merriënboer y Kirschner, Ten Steps to Complex Learning (modelo 4C/ID)', aqui: 'Cada lección resuelve un encargo de una compañera de Electro Cierzo, y el curso termina con ocho proyectos de empresa.' },
    { t: 'Desconfiar del resultado', dato: 'En auditorías a fondo, el 94 % de 85 hojas de cálculo de empresa tenían errores, y al revisarlas solo se detecta de media el 60 % de los errores.', cita: 'Panko (2015), What We Don’t Know About Spreadsheet Errors Today', aqui: 'Desde el nivel 2 aprendes a comprobar: totales de control, celdas que avisan y casos límite antes de entregar.' },
    { t: 'No avanzar con lagunas', dato: 'Los programas que exigen dominar cada unidad antes de pasar a la siguiente dieron resultados positivos en 108 evaluaciones controladas.', cita: 'Kulik, Kulik y Bangert-Drowns (1990), Review of Educational Research 60(2), 265-299', aqui: 'Cada nivel acaba con un examen que se aprueba con el 80 % a la primera y sin pistas. Puedes repetirlo cuantas veces haga falta.' },
    { t: 'Un plan concreto y una racha que perdona', dato: 'Decidir de antemano «si pasa X, entonces hago Y» ayuda a cumplir lo que te propones (efecto medio d = 0,65 en 94 estudios; revisiones recientes lo rebajan a entre 0,15 y 0,35). Y ver una racha rota quita ganas de volver, salvo que se pueda reparar.', cita: 'Gollwitzer y Sheeran (2006), Advances in Experimental Social Psychology 38; Silverman y Barasch (2023), Journal of Consumer Research 49(6)', aqui: 'Al empezar eliges cuándo vas a practicar, y la racha te perdona un día de descanso a la semana.' },
    { t: 'El juego, al servicio del aprendizaje', dato: 'Los elementos de juego mejoran el aprendizaje de forma modesta pero real (g = 0,49). Pero las clasificaciones y las insignias vacías pueden quitar motivación.', cita: 'Sailer y Homner (2020), Educational Psychology Review 32(1), 77-112; Hanus y Fox (2015), Computers & Education 80, 152-161', aqui: 'Aquí los puntos, las estrellas y los logros solo se ganan haciendo cosas reales (acertar a la primera, cuadrar un total, entregar un proyecto). No hay clasificaciones ni castigos.' },
  ];
  function vistaMetodo() {
    titulo('El método');
    vista().replaceChildren(h('div', { class: 'pila-g lectura' },
      h('div', { class: 'pila' }, h('div', { class: 'sobretitulo' }, 'Por qué aquí se aprende de verdad'), h('h1', null, 'El método'), h('p', { class: 'entradilla' }, 'Esta guía no está hecha «como siempre se ha enseñado Excel». Cada decisión de diseño sale de estudios publicados sobre cómo aprendemos las personas. Estas son las doce ideas, lo que encontró la investigación y dónde las verás.')),
      ...METODO.map((m, i) => h('section', { class: 'pila', style: { gap: '.5rem' } }, h('h2', { style: { fontSize: '1.2rem' } }, `${i + 1}. ${m.t}`), h('p', null, m.dato), h('aside', { class: 'aviso atajo' }, h('div', { class: 't' }, h('span', { class: 'etq' }, 'En esta guía')), h('p', null, m.aqui)), h('p', { class: 'tenue' }, m.cita))),
      h('section', { class: 'pila' }, h('h2', { style: { fontSize: '1.2rem' } }, 'Lo que no hacemos'), h('p', null, 'No adaptamos nada a «estilos de aprendizaje» (visual, auditivo…): no hay pruebas de que funcione.'), h('p', { class: 'tenue' }, 'Pashler, McDaniel, Rohrer y Bjork (2008), Psychological Science in the Public Interest 9(3), 105-119')),
      h('p', { class: 'tenue' }, 'Ninguna investigación puede demostrar que un curso concreto sea «el mejor del mundo». Lo que sí se puede hacer, y es lo que hemos hecho, es construirlo con las técnicas que mejor resultado han dado en estudios controlados.'),
      h('div', null, h('a', { class: 'boton primario', href: '#inicio' }, 'Volver al mapa'))));
  }

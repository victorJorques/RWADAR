import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Bandeja de avisos sin correo ni push (AVISOS_BANDEJA_REMOTA, 07/11/2026),
// encendida el 12/11/2026 con la campana con número de la cabecera.
// Apagada: ninguna llamada y el panel de la cuenta como antes. Encendida: la
// lista de avisos recibidos (rpc/mis_avisos_recientes por /api/acceso/datos),
// que se pide al confirmar la sesión para contar lo no leído. Aquí se prueba
// la bandeja sola (Perfil › Avisos apagado en la copia de la prueba); los dos
// juntos, la campana y el número del icono, en campana-avisos-navegador.test.mjs.
// Mismo entorno que perfil-avisos-navegador.test.mjs.
const web = fs.readFileSync(new URL('../rwadar-site/assets/rwadar-20260820.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../rwadar-site/index.html', import.meta.url), 'utf8');
const bridge = fs.readFileSync(new URL('../rwadar-site/assets/acceso-privado.js', import.meta.url), 'utf8');
const ENCENDIDA = ' const AVISOS_BANDEJA_REMOTA=true;';
const NOVEDADES = ' const AVISOS_NOVEDADES_REMOTOS=true;';
const tick = async (veces = 6) => { for (let i = 0; i < veces; i++) await new Promise(resolve => setImmediate(resolve)); };
const consentimiento = codigo => codigo.slice(codigo.indexOf('const VERSION_CONSENTIMIENTO_CORREO='), codigo.indexOf('/* correo-consentimiento:fin */'));
const cuenta = codigo => codigo.slice(codigo.indexOf('const Cuenta = (function(){'), codigo.indexOf('/* comunidad:inicio */'));
const RECIENTES = [
  { id: '9', tipo: 'ofertas', titulo: '2 fichas nuevas en el radar de RWAdar', texto: 'Consulta en el radar qué ha entrado.',
    enlace: 'https://rwadar.pages.dev/#emisiones', creado_el: '2026-11-05T10:00:00Z' },
  // Enlace ajeno: no se enseña.
  { id: '8', tipo: 'novedad', titulo: 'Lección nueva', texto: 'Ya está la lección 7.', enlace: 'https://evil.test/',
    creado_el: '2026-11-04T10:00:00Z' },
  // Repetido: una sola vez.
  { id: '9', tipo: 'ofertas', titulo: 'Repetido', texto: 'Otra vez.', enlace: null, creado_el: '2026-11-05T10:00:00Z' },
  { id: '7', tipo: 'novedad', titulo: '<img src=x onerror=alert(1)>', texto: 'Texto con <b>etiquetas</b>.', enlace: null,
    creado_el: '2026-11-03T10:00:00Z' },
  { id: 'bienvenida', tipo: 'bienvenida', titulo: 'Te damos la bienvenida a RWAdar',
    texto: 'Tu cuenta está confirmada y la Academy ya está desbloqueada: es gratis con tu cuenta.',
    enlace: 'https://rwadar.pages.dev/academy/', creado_el: '2026-11-01T10:00:00Z' },
];
const SIN_LEER = '<span class="bandeja-punto" aria-hidden="true"></span><span class="solo-lector">Sin leer</span> ';

function entorno({ encendida = true, sesion = true, recientes = RECIENTES, falla = false, publicos = null, guardado = null } = {}) {
  const llamadas = [], nodos = new Map(), almacen = new Map(Object.entries(guardado || {}));
  function nodo(id) {
    if (!nodos.has(id)) {
      const atributos = html.match(new RegExp('<[a-z]+\\b[^>]*\\bid="' + id + '"[^>]*>'))?.[0] || '';
      nodos.set(id, { id, innerHTML: '', value: '', textContent: '', checked: false,
        disabled: /\bdisabled\b/.test(atributos), hidden: /\bhidden\b/.test(atributos), handlers: new Map(),
        addEventListener(tipo, fn) { this.handlers.set(tipo, fn); }, setAttribute() {}, removeAttribute() {},
        querySelectorAll() { return []; }, classList: { contains: () => false, add() {}, remove() {} } });
    }
    return nodos.get(id);
  }
  const context = vm.createContext({ window: { addEventListener() {} }, URL,
    document: { getElementById: nodo, addEventListener() {}, documentElement: { replaceChildren() {} } },
    location: { hash: '', pathname: '/', search: '', replace() {}, assign() {} },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} }, setInterval() {}, URLSearchParams,
    SERVICIOS_USUARIO_DISPONIBLES: true, OPINIONES_DISPONIBLES: false, AVISOS_CORREO_DISPONIBLES: false,
    openPanel() {}, closeAll() {}, avisar() {},
    // Sin sesión, la campana pide los avisos publicados con plazo (setTimeout) y guarda lo visto.
    ...(publicos ? { setTimeout, clearTimeout,
      localStorage: { getItem: k => almacen.has(k) ? almacen.get(k) : null, setItem: (k, v) => almacen.set(k, String(v)), removeItem: k => almacen.delete(k) } } : {}),
    fetch: async (ruta, opciones) => {
      llamadas.push({ ruta, opciones });
      if (ruta === '/api/avisos/recientes') return { ok: true, status: 200, json: async () => ({ v: 1, avisos: publicos || [] }) };
      if (ruta.startsWith('/api/avisos/')) return { ok: false, status: 404, json: async () => ({ ok: false, error: 'no_disponible' }) };
      if (ruta.endsWith('/sesion')) return sesion
        ? { ok: true, status: 200, json: async () => ({ autenticada: true, usuario: { id: 'cuenta-a', correo: 'qa@ejemplo.test', correoConfirmadoEl: '2026-11-05T00:00:00Z' } }) }
        : { ok: false, status: 401, json: async () => ({ error: 'sesion_necesaria' }) };
      assert.equal(ruta, '/api/acceso/datos');
      const { ruta: recurso, metodo } = JSON.parse(opciones.body);
      if (recurso === '/rpc/mis_avisos_recientes') {
        assert.equal(metodo, 'POST');
        return falla ? { ok: false, status: 503, json: async () => ({ error: 'servicio_no_disponible' }) }
          : { ok: true, status: 200, json: async () => recientes };
      }
      assert.ok(!recurso.startsWith('/rpc/'), 'la bandeja no llama a ' + recurso);
      const datos = recurso.startsWith('/mi_perfil?') ? [{ id: 'cuenta-a', nombre: 'Prueba' }] : [];
      return { ok: true, status: 200, json: async () => datos };
    } });
  let codigo = web.replace(NOVEDADES, ' const AVISOS_NOVEDADES_REMOTOS=false;');
  if (!encendida) codigo = codigo.replace(ENCENDIDA, ' const AVISOS_BANDEJA_REMOTA=false;');
  vm.runInContext(bridge, context);
  vm.runInContext(consentimiento(codigo) + '\n' + cuenta(codigo) + '\nglobalThis.cuentaPrueba=Cuenta;', context);
  const rpc = () => llamadas.filter(l => l.ruta === '/api/acceso/datos').map(l => JSON.parse(l.opciones.body))
    .filter(c => c.ruta.startsWith('/rpc/'));
  const publicas = () => llamadas.filter(l => l.ruta === '/api/avisos/recientes').map(l => [l.opciones.method, l.opciones.credentials]);
  return { context, nodo, rpc, publicas, almacen };
}

test('la bandeja está encendida (12/11/2026) y sigue siendo un interruptor aparte de los avisos de novedades', () => {
  assert.ok(web.includes(ENCENDIDA), 'AVISOS_BANDEJA_REMOTA encendido');
  assert.ok(web.includes(NOVEDADES), 'Perfil › Avisos encendido');
  assert.ok(web.includes(' const AVISOS_BANDEJA_DISPONIBLE=SERVICIOS_USUARIO_DISPONIBLES&&AVISOS_BANDEJA_REMOTA;'));
  // La casilla del alta y el texto versionado del permiso no dependen de la bandeja.
  const acceso = fs.readFileSync(new URL('../rwadar-site/assets/acceso.js', import.meta.url), 'utf8');
  assert.doesNotMatch(acceso, /AVISOS_BANDEJA/);
  assert.ok(web.includes("const VERSION_AVISOS_NOVEDADES='novedades-v2-2026-11-06';"));
  // El servidor web ya deja pasar la consulta (rutas cerradas de /api/acceso/datos).
  const servidor = fs.readFileSync(new URL('./servidor.mjs', import.meta.url), 'utf8');
  assert.match(servidor, /\|mis_avisos_recientes\|/);
});

test('apagada: con sesión no se pide nada y el panel de la cuenta queda como antes', async () => {
  const e = entorno({ encendida: false });
  await tick();
  await e.context.cuentaPrueba.abrirGestion();
  await tick();
  assert.deepEqual(e.rpc(), []);
  const panel = e.nodo('perfilCuerpo').innerHTML;
  assert.doesNotMatch(panel, /pfBandeja|Avisos recibidos/);
  assert.match(panel, /Próximamente: avisos por correo cuando cambie una plataforma que sigues/);
  assert.equal(e.nodo('btnAvisos').hidden, true, 'sin bandeja no hay campana');
});

test('encendida: pide mis_avisos_recientes al confirmar la sesión (para la campana) y pinta los avisos válidos, escapados y con enlaces propios', async () => {
  const e = entorno();
  await tick();
  assert.deepEqual(e.rpc(), [{ ruta: '/rpc/mis_avisos_recientes', metodo: 'POST', cuerpo: { p_limite: 10 } }],
    'una sola consulta al confirmar la sesión; ni estado_mis_avisos ni configurar_avisos_novedades');
  await e.context.cuentaPrueba.abrirGestion();
  await tick();
  assert.equal(e.rpc().length, 1, 'abrir la cuenta no repite la consulta');
  const panel = e.nodo('perfilCuerpo').innerHTML;
  assert.match(panel, /<section class="perfil-bandeja" aria-labelledby="pfBandejaTit"><h3 id="pfBandejaTit">Avisos recibidos<\/h3>/);
  // Sin casilla ni permiso: la bandeja no cambia la parte de avisos del panel.
  assert.doesNotMatch(panel, /type="checkbox"[^>]*pfNovedades|Avisos de novedades\./);
  assert.match(panel, /Próximamente: avisos por correo/);
  const lista = e.nodo('pfBandeja').innerHTML;
  assert.equal((lista.match(/<li\b/g) || []).length, 3, 'el del enlace ajeno y el repetido no salen');
  assert.ok(lista.includes('<li class="nuevo">' + SIN_LEER + '<b>2 fichas nuevas en el radar de RWAdar</b><p>Consulta en el radar qué ha entrado.</p><time datetime="2026-11-05">05/11/2026</time> <a href="/#emisiones" aria-label="Abrir 2 fichas nuevas en el radar de RWAdar">Abrir</a></li>'));
  assert.ok(lista.includes('<b>&lt;img src=x onerror=alert(1)&gt;</b><p>Texto con &lt;b&gt;etiquetas&lt;/b&gt;.</p>'), 'escapado');
  assert.ok(lista.includes('<a href="/academy/" aria-label="Abrir Te damos la bienvenida a RWAdar">Abrir</a>'));
  // Sin «Marcar como leídos» (21/11/2026): la lista se da por vista al estar en pantalla 1,5 s.
  assert.ok(lista.endsWith('</ul>'));
  assert.doesNotMatch(lista, /data-avisos-marcar|Marcar como leídos/);
  assert.doesNotMatch(lista, /evil\.test|Repetido|<img/);
  // Volver a abrir la cuenta no repite la consulta.
  await e.context.cuentaPrueba.abrirGestion();
  await tick();
  assert.equal(e.rpc().length, 1);
  // La campana cuenta los tres válidos, sin leer.
  assert.equal(e.context.cuentaPrueba.avisosSinLeer(), 3);
  assert.equal(e.nodo('btnAvisos').hidden, false);
  assert.equal(e.nodo('btnAvisosN').textContent, '3');
});

test('encendida: si la base falla lo dice y reintenta al volver a abrir; sin avisos, una frase', async () => {
  const caida = entorno({ falla: true });
  await tick();
  assert.equal(caida.rpc().length, 1, 'la de la campana, al confirmar la sesión');
  await caida.context.cuentaPrueba.abrirGestion();
  await tick();
  assert.equal(caida.nodo('pfBandeja').innerHTML,
    '<p class="perfil-nota" role="status">No se pudieron cargar tus avisos. Cierra y vuelve a abrir tu cuenta para reintentarlo.</p>');
  assert.equal(caida.rpc().length, 2, 'tras el error se vuelve a pedir al abrir la cuenta');
  await caida.context.cuentaPrueba.abrirGestion();
  await tick();
  assert.equal(caida.rpc().length, 3, 'y otra vez');
  assert.equal(caida.context.cuentaPrueba.avisosSinLeer(), 0, 'sin lista, la campana no inventa un número');
  const vacia = entorno({ recientes: [] });
  await tick();
  await vacia.context.cuentaPrueba.abrirGestion();
  await tick();
  assert.equal(vacia.nodo('pfBandeja').innerHTML, '<p class="perfil-nota">Aquí verás la bienvenida y los anuncios de RWAdar.</p>');
  const rara = entorno({ recientes: { no: 'es una lista' } });
  await tick();
  await rara.context.cuentaPrueba.abrirGestion();
  await tick();
  assert.match(rara.nodo('pfBandeja').innerHTML, /No se pudieron cargar tus avisos/);
});

// 21/11/2026, la dirección: «me gustaría que los avisos salieran en Inicio arriba a la derecha». Sin
// sesión la campana también sale: cuenta los avisos publicados (/api/avisos/recientes, sin cookies y
// sin la bienvenida) que este navegador no ha visto (rwadar.avisos.leidos.publicos.v1), sin pedir nada
// de ninguna cuenta. El globo de Perfil sigue siendo solo de la cuenta.
const PUBLICOS = [
  { id: '12', tipo: 'novedad', titulo: 'Novedad de prueba', texto: 'Texto.', enlace: 'https://rwadar.pages.dev/novedades-rwadar/', creado_el: '2026-11-20T10:00:00Z' },
  { id: '11', tipo: 'ofertas', titulo: 'Fichas nuevas', texto: 'Texto.', enlace: 'https://rwadar.pages.dev/#emisiones', creado_el: '2026-11-19T10:00:00Z' },
  { id: 'bienvenida', tipo: 'bienvenida', titulo: 'Bienvenida', texto: 'Solo de las cuentas.', enlace: null, creado_el: null },
];
test('encendida sin sesión: la campana sale con los avisos publicados no vistos en este navegador, sin pedir nada de la cuenta', async () => {
  const e = entorno({ sesion: false, publicos: PUBLICOS });
  await tick(20);
  assert.deepEqual(e.rpc(), [], 'nada de la cuenta');
  assert.deepEqual(e.publicas(), [['GET', 'omit']], 'una sola petición de los avisos publicados, sin cookies');
  assert.equal(e.nodo('btnAvisos').hidden, false);
  assert.equal(e.nodo('movilAvisos').hidden, false);
  assert.equal(e.nodo('btnAvisosN').textContent, '2', 'la bienvenida no cuenta');
  assert.equal(e.nodo('btnAvisosN').hidden, false);
  assert.equal(e.nodo('movilAvisosN').textContent, '2');
  assert.equal(e.context.cuentaPrueba.avisosSinLeer(), 0, 'el globo de Perfil sigue siendo de la cuenta');
  // Lo ya visto en este navegador no cuenta; lo de una cuenta (otra clave), tampoco se mezcla.
  const visto = entorno({ sesion: false, publicos: PUBLICOS,
    guardado: { 'rwadar.avisos.leidos.publicos.v1': '["12"]', 'rwadar.avisos.leidos.v1:cuenta-a': '["11"]' } });
  await tick(20);
  assert.equal(visto.nodo('btnAvisosN').textContent, '1');
  // «Borrar lo guardado aquí» lo olvida: vuelven a contar los dos.
  assert.equal(visto.context.cuentaPrueba.hayAvisosVistosAqui(), true);
  visto.context.cuentaPrueba.olvidarAvisosVistosAqui();
  assert.equal(visto.almacen.has('rwadar.avisos.leidos.publicos.v1'), false);
  assert.equal(visto.almacen.get('rwadar.avisos.leidos.v1:cuenta-a'), '["11"]', 'lo de la cuenta no se toca');
  assert.equal(visto.nodo('btnAvisosN').textContent, '2');
  assert.equal(visto.context.cuentaPrueba.hayAvisosVistosAqui(), false);
});
test('encendida con sesión: la campana no pide los avisos publicados', async () => {
  const e = entorno({ publicos: PUBLICOS });
  await tick(20);
  assert.deepEqual(e.publicas(), []);
  assert.equal(e.nodo('btnAvisosN').textContent, '3', 'los de la cuenta');
});

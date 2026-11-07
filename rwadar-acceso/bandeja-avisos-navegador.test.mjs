import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Bandeja de avisos sin correo ni push (AVISOS_BANDEJA_REMOTA, 07/11/2026).
// Apagada: ninguna llamada y el panel de la cuenta como hoy. Encendida: solo la
// lista de avisos recibidos (rpc/mis_avisos_recientes por /api/acceso/datos),
// sin casilla, sin permiso, sin correo y sin push. Mismo entorno que
// perfil-avisos-navegador.test.mjs.
const web = fs.readFileSync(new URL('../rwadar-site/assets/rwadar-20260820.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../rwadar-site/index.html', import.meta.url), 'utf8');
const bridge = fs.readFileSync(new URL('../rwadar-site/assets/acceso-privado.js', import.meta.url), 'utf8');
const APAGADA = ' const AVISOS_BANDEJA_REMOTA=false;';
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

function entorno({ encendida = false, sesion = true, recientes = RECIENTES, falla = false } = {}) {
  const llamadas = [], nodos = new Map();
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
    fetch: async (ruta, opciones) => {
      llamadas.push({ ruta, opciones });
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
  const codigo = encendida ? web.replace(APAGADA, ' const AVISOS_BANDEJA_REMOTA=true;') : web;
  vm.runInContext(bridge, context);
  vm.runInContext(consentimiento(codigo) + '\n' + cuenta(codigo) + '\nglobalThis.cuentaPrueba=Cuenta;', context);
  const rpc = () => llamadas.filter(l => l.ruta === '/api/acceso/datos').map(l => JSON.parse(l.opciones.body))
    .filter(c => c.ruta.startsWith('/rpc/'));
  return { context, nodo, rpc };
}

test('la bandeja nace apagada y es un interruptor aparte de los avisos de novedades', () => {
  assert.ok(web.includes(APAGADA), 'AVISOS_BANDEJA_REMOTA nace apagado');
  assert.ok(web.includes(' const AVISOS_NOVEDADES_REMOTOS=false;'));
  assert.ok(web.includes(' const AVISOS_BANDEJA_DISPONIBLE=SERVICIOS_USUARIO_DISPONIBLES&&AVISOS_BANDEJA_REMOTA;'));
  // La casilla del alta y el texto versionado del permiso no dependen de la bandeja.
  const acceso = fs.readFileSync(new URL('../rwadar-site/assets/acceso.js', import.meta.url), 'utf8');
  assert.doesNotMatch(acceso, /AVISOS_BANDEJA/);
  assert.ok(web.includes("const VERSION_AVISOS_NOVEDADES='novedades-v2-2026-11-06';"));
  // El servidor web ya deja pasar la consulta (rutas cerradas de /api/acceso/datos).
  const servidor = fs.readFileSync(new URL('./servidor.mjs', import.meta.url), 'utf8');
  assert.match(servidor, /\|mis_avisos_recientes\)\)/);
});

test('apagada: con sesión no se pide nada y el panel de la cuenta queda como hoy', async () => {
  const e = entorno();
  await tick();
  await e.context.cuentaPrueba.abrirGestion();
  await tick();
  assert.deepEqual(e.rpc(), []);
  const panel = e.nodo('perfilCuerpo').innerHTML;
  assert.doesNotMatch(panel, /pfBandeja|Avisos recibidos/);
  assert.match(panel, /Próximamente: avisos por correo cuando cambie una plataforma que sigues/);
});

test('encendida: solo pide mis_avisos_recientes y pinta los avisos válidos, escapados y con enlaces propios', async () => {
  const e = entorno({ encendida: true });
  await tick();
  assert.deepEqual(e.rpc(), [], 'nada hasta abrir la cuenta');
  await e.context.cuentaPrueba.abrirGestion();
  await tick();
  assert.deepEqual(e.rpc(), [{ ruta: '/rpc/mis_avisos_recientes', metodo: 'POST', cuerpo: { p_limite: 10 } }],
    'ni estado_mis_avisos ni configurar_avisos_novedades');
  const panel = e.nodo('perfilCuerpo').innerHTML;
  assert.match(panel, /<section class="perfil-bandeja" aria-labelledby="pfBandejaTit"><h3 id="pfBandejaTit">Avisos recibidos<\/h3>/);
  // Sin casilla ni permiso: la bandeja no cambia la parte de avisos del panel.
  assert.doesNotMatch(panel, /type="checkbox"[^>]*pfNovedades|Avisos de novedades\./);
  assert.match(panel, /Próximamente: avisos por correo/);
  const lista = e.nodo('pfBandeja').innerHTML;
  assert.equal((lista.match(/<li>/g) || []).length, 3, 'el del enlace ajeno y el repetido no salen');
  assert.ok(lista.includes('<li><b>2 fichas nuevas en el radar de RWAdar</b><p>Consulta en el radar qué ha entrado.</p><time datetime="2026-11-05">05/11/2026</time> <a href="/#emisiones" aria-label="Abrir 2 fichas nuevas en el radar de RWAdar">Abrir</a></li>'));
  assert.ok(lista.includes('<b>&lt;img src=x onerror=alert(1)&gt;</b><p>Texto con &lt;b&gt;etiquetas&lt;/b&gt;.</p>'), 'escapado');
  assert.ok(lista.includes('<a href="/academy/" aria-label="Abrir Te damos la bienvenida a RWAdar">Abrir</a>'));
  assert.doesNotMatch(lista, /evil\.test|Repetido|<img/);
  // Volver a abrir la cuenta no repite la consulta.
  await e.context.cuentaPrueba.abrirGestion();
  await tick();
  assert.equal(e.rpc().length, 1);
});

test('encendida: si la base falla lo dice y reintenta al volver a abrir; sin avisos, una frase', async () => {
  const caida = entorno({ encendida: true, falla: true });
  await tick();
  await caida.context.cuentaPrueba.abrirGestion();
  await tick();
  assert.equal(caida.nodo('pfBandeja').innerHTML,
    '<p class="perfil-nota" role="status">No se pudieron cargar tus avisos. Cierra y vuelve a abrir tu cuenta para reintentarlo.</p>');
  await caida.context.cuentaPrueba.abrirGestion();
  await tick();
  assert.equal(caida.rpc().length, 2, 'tras el error se vuelve a pedir');
  const vacia = entorno({ encendida: true, recientes: [] });
  await tick();
  await vacia.context.cuentaPrueba.abrirGestion();
  await tick();
  assert.equal(vacia.nodo('pfBandeja').innerHTML, '<p class="perfil-nota">Aquí verás la bienvenida y los anuncios de RWAdar.</p>');
  const rara = entorno({ encendida: true, recientes: { no: 'es una lista' } });
  await tick();
  await rara.context.cuentaPrueba.abrirGestion();
  await tick();
  assert.match(rara.nodo('pfBandeja').innerHTML, /No se pudieron cargar tus avisos/);
});

test('encendida sin sesión: no se pide nada', async () => {
  const e = entorno({ encendida: true, sesion: false });
  await tick();
  await e.context.cuentaPrueba.abrirGestion().catch(() => {});
  await tick();
  assert.deepEqual(e.rpc(), []);
});

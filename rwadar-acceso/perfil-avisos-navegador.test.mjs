import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Perfil › Avisos de novedades (docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md).
// Apagado: la tarjeta «Próximamente · Avisos de cambios» de siempre y ninguna
// llamada. Encendido: la tarjeta nueva con su interruptor, por /api/acceso/datos.
const web = fs.readFileSync(new URL('../rwadar-site/assets/rwadar-20260820.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../rwadar-site/index.html', import.meta.url), 'utf8');
const bridge = fs.readFileSync(new URL('../rwadar-site/assets/acceso-privado.js', import.meta.url), 'utf8');
const APAGADO = ' const AVISOS_NOVEDADES_REMOTOS=false;';
const VERSION = 'novedades-v1-2026-11-05';
const TEXTO_ES = 'Quiero recibir avisos de RWAdar por correo y, si los activo en mi móvil, como notificaciones: ' +
  'ofertas nuevas en el radar y novedades de la web y la app. Es opcional: la Academy se desbloquea igual. ' +
  'Puedes darte de baja en cada aviso o en Perfil. Más información en Privacidad.';
const tick = async (veces = 4) => { for (let i = 0; i < veces; i++) await new Promise(resolve => setImmediate(resolve)); };
const consentimiento = codigo => codigo.slice(codigo.indexOf('const VERSION_CONSENTIMIENTO_CORREO='), codigo.indexOf('/* correo-consentimiento:fin */'));
const cuenta = codigo => codigo.slice(codigo.indexOf('const Cuenta = (function(){'), codigo.indexOf('/* comunidad:inicio */'));
const estadoBase = { novedades: false, version: null, aceptado_el: null, version_vigente: VERSION,
  texto_es: TEXTO_ES, texto_en: 'x', dispositivos: 0, correo_activo: false, push_activo: false };

function entorno({ encendido = false, sesion = true, estado = estadoBase, configurar = null } = {}) {
  const llamadas = [], avisos = [], nodos = new Map();
  let actual = { ...estado };
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
  const context = vm.createContext({ window: { addEventListener() {} },
    document: { getElementById: nodo, addEventListener() {}, documentElement: { replaceChildren() {} } },
    location: { hash: '', pathname: '/', search: '', replace() {}, assign() {} },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} }, setInterval() {}, URLSearchParams,
    SERVICIOS_USUARIO_DISPONIBLES: true, OPINIONES_DISPONIBLES: false, AVISOS_CORREO_DISPONIBLES: false,
    openPanel() {}, closeAll() {}, avisar: texto => avisos.push(texto),
    fetch: async (ruta, opciones) => {
      llamadas.push({ ruta, opciones });
      if (ruta.endsWith('/sesion')) return sesion
        ? { ok: true, status: 200, json: async () => ({ autenticada: true, usuario: { id: 'cuenta-a', correo: 'qa@ejemplo.test', correoConfirmadoEl: '2026-11-05T00:00:00Z' } }) }
        : { ok: false, status: 401, json: async () => ({ error: 'sesion_necesaria' }) };
      assert.equal(ruta, '/api/acceso/datos');
      const { ruta: recurso, metodo, cuerpo } = JSON.parse(opciones.body);
      if (recurso === '/rpc/estado_mis_avisos') { assert.equal(metodo, 'POST'); return { ok: true, status: 200, json: async () => actual }; }
      if (recurso === '/rpc/configurar_avisos_novedades') {
        assert.equal(metodo, 'POST');
        if (configurar) return configurar(cuerpo);
        actual = { ...actual, novedades: cuerpo.p_activar, version: cuerpo.p_activar ? VERSION : actual.version };
        return { ok: true, status: 200, json: async () => actual };
      }
      const datos = recurso.startsWith('/mi_perfil?') ? [{ id: 'cuenta-a', nombre: 'Prueba' }] : [];
      return { ok: true, status: 200, json: async () => datos };
    } });
  const codigo = encendido ? web.replace(APAGADO, ' const AVISOS_NOVEDADES_REMOTOS=true;') : web;
  vm.runInContext(bridge, context);
  vm.runInContext(consentimiento(codigo) + '\n' + cuenta(codigo) + '\nglobalThis.cuentaPrueba=Cuenta;', context);
  const rpc = () => llamadas.filter(l => l.ruta === '/api/acceso/datos').map(l => JSON.parse(l.opciones.body))
    .filter(c => c.ruta.startsWith('/rpc/'));
  return { context, nodo, avisos, rpc };
}

test('el HTML trae las dos tarjetas: la de siempre visible y la nueva oculta, con el texto exacto', () => {
  assert.ok(web.includes(APAGADO), 'El interruptor de Perfil nace apagado');
  // El hidden va en un div: .movil-estado fija display en el CSS y taparía el atributo.
  assert.match(html, /<div id="perfilAvisosProximamente">\s*<article class="movil-estado">/);
  assert.match(html, /<div id="perfilAvisosNovedades" hidden>\s*<article class="movil-estado">/);
  assert.doesNotMatch(html, /<article class="movil-estado"[^>]*\shidden/);
  assert.match(html, /<input type="checkbox" role="switch" id="perfilNovedadesOpcion" disabled>/);
  assert.ok(html.includes('<span>' + TEXTO_ES + '</span>'));
  assert.ok(web.includes("const TEXTO_AVISOS_NOVEDADES='" + TEXTO_ES + "';"));
  assert.ok(web.includes("const VERSION_AVISOS_NOVEDADES='" + VERSION + "';"));
  // La tarjeta de hoy sigue diciendo lo que es cierto con el interruptor apagado.
  assert.match(html, /<h3>Avisos de cambios<\/h3>[\s\S]{0,200}Los avisos llegarán a la app en una próxima actualización\./);
});

test('apagado: con sesión no se consulta nada de avisos y Perfil queda como hoy', async () => {
  const e = entorno();
  await tick();
  assert.equal(e.context.cuentaPrueba.hay(), true);
  assert.deepEqual(e.rpc(), []);
  assert.equal(e.nodo('perfilAvisosNovedades').hidden, true);
  assert.equal(e.nodo('perfilAvisosProximamente').hidden, false);
  assert.equal(e.nodo('perfilNovedadesOpcion').disabled, true);
  await e.context.cuentaPrueba.abrirGestion();
  const panel = e.nodo('perfilCuerpo').innerHTML;
  assert.match(panel, /Próximamente: avisos por correo cuando cambie una plataforma que sigues/);
  assert.doesNotMatch(panel, /pfNovedades|Avisos de novedades/);
});

test('encendido sin sesión: la tarjeta nueva sustituye a la de siempre con el interruptor bloqueado', async () => {
  const e = entorno({ encendido: true, sesion: false });
  await tick();
  assert.equal(e.nodo('perfilAvisosNovedades').hidden, false);
  assert.equal(e.nodo('perfilAvisosProximamente').hidden, true);
  assert.equal(e.nodo('perfilNovedadesOpcion').disabled, true);
  assert.equal(e.nodo('perfilNovedadesOpcion').checked, false);
  assert.equal(e.nodo('perfilNovedadesEstado').textContent, 'Entra en tu cuenta para activarlos o desactivarlos.');
  assert.deepEqual(e.rpc(), []);
});

test('encendido con sesión: lee el estado, activa con la versión vigente y el canal web, y desactiva', async () => {
  const e = entorno({ encendido: true });
  await tick();
  assert.deepEqual(e.rpc(), [{ ruta: '/rpc/estado_mis_avisos', metodo: 'POST', cuerpo: {} }]);
  const opcion = e.nodo('perfilNovedadesOpcion');
  assert.equal(e.nodo('perfilAvisosNovedades').hidden, false);
  assert.equal(e.nodo('perfilAvisosProximamente').hidden, true);
  assert.equal(opcion.disabled, false);
  assert.equal(opcion.checked, false);
  assert.equal(e.nodo('perfilNovedadesEstado').textContent, 'Desactivados. Puedes activarlos cuando quieras.');
  opcion.checked = true;
  await opcion.handlers.get('change')({ target: opcion });
  assert.deepEqual(e.rpc().at(-1), { ruta: '/rpc/configurar_avisos_novedades', metodo: 'POST',
    cuerpo: { p_activar: true, p_version: VERSION, p_canal: 'web' } });
  assert.equal(opcion.checked, true);
  assert.equal(opcion.disabled, false);
  assert.equal(e.nodo('perfilNovedadesEstado').textContent, 'Activados. Todavía no hemos empezado a enviarlos.');
  assert.equal(e.avisos.at(-1), 'Avisos de novedades activados.');
  opcion.checked = false;
  await opcion.handlers.get('change')({ target: opcion });
  assert.deepEqual(e.rpc().at(-1).cuerpo, { p_activar: false, p_version: VERSION, p_canal: 'web' });
  assert.equal(opcion.checked, false);
  assert.equal(e.avisos.at(-1), 'Avisos de novedades desactivados.');
});

test('encendido: el panel de cuenta del escritorio lleva el mismo interruptor en lugar del «Próximamente»', async () => {
  const e = entorno({ encendido: true, estado: { ...estadoBase, novedades: true, version: VERSION, correo_activo: true } });
  await tick();
  await e.context.cuentaPrueba.abrirGestion();
  await tick();
  const panel = e.nodo('perfilCuerpo').innerHTML;
  assert.match(panel, /id="pfNovedades"/);
  assert.ok(panel.includes(TEXTO_ES));
  assert.doesNotMatch(panel, /Próximamente: avisos por correo/);
  assert.equal(e.nodo('pfNovedades').checked, true);
  assert.equal(e.nodo('pfNovedadesEstado').textContent, 'Activados. Puedes desactivarlos cuando quieras.');
  assert.equal(typeof e.nodo('pfNovedades').handlers.get('change'), 'function');
});

test('encendido: si la base no confirma el cambio, el interruptor vuelve a su estado y lo dice', async () => {
  const fallos = [
    () => ({ ok: false, status: 503, json: async () => ({ error: 'servicio_no_disponible' }) }),
    () => ({ ok: true, status: 200, json: async () => ({ ...estadoBase }) }),
    () => ({ ok: true, status: 200, json: async () => [] }),
  ];
  for (const configurar of fallos) {
    const e = entorno({ encendido: true, configurar });
    await tick();
    const opcion = e.nodo('perfilNovedadesOpcion');
    opcion.checked = true;
    await opcion.handlers.get('change')({ target: opcion });
    assert.equal(opcion.checked, false);
    assert.equal(opcion.disabled, false);
    assert.equal(e.avisos.at(-1), 'No se han activado los avisos de novedades. Vuelve a intentarlo.');
  }
});

test('seguir una plataforma solo deja de decir «todavía no enviamos avisos» con el interruptor encendido', () => {
  const codigo = cuenta(web);
  assert.ok(codigo.includes("aviso('Sigues '+nombre+(AVISOS_NOVEDADES_DISPONIBLES?'. Seguir una plataforma no envía avisos.':'. Todavía no enviamos avisos por correo.'));"));
  assert.ok(codigo.includes("(AVISOS_NOVEDADES_DISPONIBLES?'Guardada en tu lista. Seguir una plataforma no envía avisos.':'Guardada en tu lista. Todavía no enviamos avisos por correo.')"));
});

test('encendido: una versión distinta en la base bloquea el interruptor hasta recargar', async () => {
  const e = entorno({ encendido: true, estado: { ...estadoBase, version_vigente: 'novedades-v2-2027-01-01' } });
  await tick();
  assert.equal(e.nodo('perfilNovedadesOpcion').disabled, true);
  assert.equal(e.nodo('perfilNovedadesEstado').textContent, 'El texto de los avisos ha cambiado. Recarga la página para verlo.');
});

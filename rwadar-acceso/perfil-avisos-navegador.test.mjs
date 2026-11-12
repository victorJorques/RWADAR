import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Perfil › Avisos de novedades (docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md).
// Encendido desde el 12/11/2026 (la casilla del alta tiene su propio interruptor,
// AVISOS_CASILLA_ALTA, y sigue apagada). Apagado en la copia de la prueba: la
// tarjeta «Próximamente · Avisos de cambios» de siempre y ninguna llamada.
// Encendido: la tarjeta nueva con su interruptor, por /api/acceso/datos. La
// bandeja va apagada en la copia de la prueba para ver solo estas llamadas.
const web = fs.readFileSync(new URL('../rwadar-site/assets/rwadar-20260820.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../rwadar-site/index.html', import.meta.url), 'utf8');
const bridge = fs.readFileSync(new URL('../rwadar-site/assets/acceso-privado.js', import.meta.url), 'utf8');
const ENCENDIDO = ' const AVISOS_NOVEDADES_REMOTOS=true;';
const BANDEJA = ' const AVISOS_BANDEJA_REMOTA=true;';
// Versión v2 (revisión legal del 06/11/2026), palabra por palabra.
const VERSION = 'novedades-v2-2026-11-06';
const TEXTO_ES = 'Quiero recibir avisos de RWAdar por correo y, si los activo en mi móvil, como notificaciones: ' +
  'fichas nuevas en el radar y novedades de la web y la app. Es opcional: la Academy se desbloquea igual. ' +
  'Puedes darte de baja en Perfil o con el enlace de cada correo; las notificaciones también se quitan en los ' +
  'ajustes del móvil. Más información en Privacidad.';
const TEXTO_EN = 'I want to receive RWAdar notices by email and, if I enable them on my phone, as notifications: ' +
  'new listings on the radar and news about the website and the app. It\'s optional: the Academy unlocks anyway. ' +
  'You can unsubscribe in Profile or with the link in every email; notifications can also be turned off in your ' +
  'phone settings. More information in Privacy.';
// Información básica sobre los datos, junto al interruptor y fuera del texto versionado.
const INFO_ES = 'Información básica sobre tus datos. Responsable: el titular de RWAdar, identificado en el aviso legal. ' +
  'Datos: tu correo, tu contraseña y, si lo das, tu nombre; con los avisos, además, tu permiso y, si activas las ' +
  'notificaciones, un identificador de entrega de tu móvil. Para qué: tu cuenta, con la que también abres la Academy, ' +
  'y, solo si marcas la casilla de avisos, enviarte esos avisos. Base: el servicio que pides (cuenta) y tu ' +
  'consentimiento (avisos), que puedes retirar cuando quieras sin que afecte a lo anterior. Proveedores: Supabase, ' +
  'Cloudflare y Google; para los avisos, Lettermint y Expo. Algunos tratan datos fuera de la UE con garantías. Derechos: ' +
  'acceso, rectificación, supresión, oposición, limitación y portabilidad, en Perfil o en rwadares@gmail.com; ' +
  'también puedes reclamar ante la AEPD. Más información en Privacidad.';
// En la web, «Privacidad» del final es un enlace; el texto visible no cambia.
const enlazado = (textoPlano, href) => textoPlano.replace(/Privacidad\.$/, '') + '<a href="' + href + '">Privacidad</a>.';
const CASILLA_HTML = enlazado(TEXTO_ES, '/privacidad#avisos-novedades');
// «aviso legal» también enlaza: a los datos del titular, que ya no salen aquí (12/11/2026).
const INFO_HTML = enlazado(INFO_ES, '/privacidad')
  .replace(' identificado en el aviso legal.', ' identificado en el <a href="/privacidad#aviso-legal">aviso legal</a>.');
// Con el correo apagado no hay «enlace de cada correo»: no se promete.
const ACTIVADOS = 'Avisos de novedades activados. Puedes darte de baja aquí cuando quieras.';
const tick = async (veces = 4) => { for (let i = 0; i < veces; i++) await new Promise(resolve => setImmediate(resolve)); };
const consentimiento = codigo => codigo.slice(codigo.indexOf('const VERSION_CONSENTIMIENTO_CORREO='), codigo.indexOf('/* correo-consentimiento:fin */'));
const cuenta = codigo => codigo.slice(codigo.indexOf('const Cuenta = (function(){'), codigo.indexOf('/* comunidad:inicio */'));
const estadoBase = { novedades: false, version: null, aceptado_el: null, version_vigente: VERSION,
  texto_es: TEXTO_ES, texto_en: 'x', dispositivos: 0, correo_activo: false, push_activo: false };

// idioma: lo que devolvería RWAdarIdioma.obtenerIdioma() (sin él, no hay
// traductor). textoCasilla: el texto que se ve junto al interruptor.
function entorno({ encendido = false, sesion = true, estado = estadoBase, configurar = null, idioma, textoCasilla } = {}) {
  const llamadas = [], avisos = [], nodos = new Map();
  let actual = { ...estado };
  function nodo(id) {
    if (!nodos.has(id)) {
      const atributos = html.match(new RegExp('<[a-z]+\\b[^>]*\\bid="' + id + '"[^>]*>'))?.[0] || '';
      nodos.set(id, { id, innerHTML: '', value: '', textContent: '', checked: false,
        disabled: /\bdisabled\b/.test(atributos), hidden: /\bhidden\b/.test(atributos), handlers: new Map(),
        addEventListener(tipo, fn) { this.handlers.set(tipo, fn); }, setAttribute() {}, removeAttribute() {},
        querySelectorAll() { return []; }, classList: { contains: () => false, add() {}, remove() {} },
        ...(textoCasilla === undefined ? {} : { closest: selector => selector === 'label' ? { textContent: textoCasilla } : null }) });
    }
    return nodos.get(id);
  }
  const context = vm.createContext({ window: { addEventListener() {} },
    document: { getElementById: nodo, addEventListener() {}, documentElement: { replaceChildren() {} } },
    location: { hash: '', pathname: '/', search: '', replace() {}, assign() {} },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} }, setInterval() {}, URLSearchParams,
    SERVICIOS_USUARIO_DISPONIBLES: true, OPINIONES_DISPONIBLES: false, AVISOS_CORREO_DISPONIBLES: false,
    openPanel() {}, closeAll() {}, avisar: texto => avisos.push(texto),
    ...(idioma === undefined ? {} : { RWAdarIdioma: { obtenerIdioma: () => idioma } }),
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
  let codigo = web.replace(BANDEJA, ' const AVISOS_BANDEJA_REMOTA=false;');
  if (!encendido) codigo = codigo.replace(ENCENDIDO, ' const AVISOS_NOVEDADES_REMOTOS=false;');
  vm.runInContext(bridge, context);
  vm.runInContext(consentimiento(codigo) + '\n' + cuenta(codigo) + '\nglobalThis.cuentaPrueba=Cuenta;', context);
  const rpc = () => llamadas.filter(l => l.ruta === '/api/acceso/datos').map(l => JSON.parse(l.opciones.body))
    .filter(c => c.ruta.startsWith('/rpc/'));
  return { context, nodo, avisos, rpc };
}

test('el HTML trae las dos tarjetas: la de siempre visible y la nueva oculta, con el texto exacto', () => {
  assert.ok(web.includes(ENCENDIDO), 'Perfil › Avisos encendido (12/11/2026); el JS cambia una tarjeta por otra');
  // El hidden va en un div: .movil-estado fija display en el CSS y taparía el atributo.
  assert.match(html, /<div id="perfilAvisosProximamente">\s*<article class="movil-estado">/);
  assert.match(html, /<div id="perfilAvisosNovedades" hidden>\s*<article class="movil-estado">/);
  assert.doesNotMatch(html, /<article class="movil-estado"[^>]*\shidden/);
  assert.match(html, /<input type="checkbox" role="switch" id="perfilNovedadesOpcion" disabled>/);
  assert.ok(html.includes('<span>' + CASILLA_HTML + '</span>'), 'Texto exacto con «Privacidad» enlazada');
  assert.ok(web.includes("const TEXTO_AVISOS_NOVEDADES='" + TEXTO_ES + "';"));
  assert.ok(web.includes("const VERSION_AVISOS_NOVEDADES='" + VERSION + "';"));
  assert.match(html, /<!-- Avisos de novedades \(novedades-v2-2026-11-06\)/);
  // La información básica, dentro de la tarjeta nueva (oculta con ella) y fuera del <label>.
  const tarjeta = html.slice(html.indexOf('<div id="perfilAvisosNovedades" hidden>'), html.indexOf('</article>', html.indexOf('<div id="perfilAvisosNovedades" hidden>')));
  assert.ok(tarjeta.includes('<p class="perfil-aviso-detalle" id="perfilNovedadesDatos">' + INFO_HTML + '</p>'));
  assert.ok(tarjeta.indexOf('id="perfilNovedadesDatos"') > tarjeta.indexOf('</label>'));
  assert.ok(web.includes("const INFO_DATOS_AVISOS='" + INFO_ES + "';"));
  // La tarjeta «Próximamente» sigue diciendo lo que es cierto si se apaga el interruptor.
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
    cuerpo: { p_activar: true, p_version: VERSION, p_canal: 'web', p_idioma: 'es' } });
  assert.equal(opcion.checked, true);
  assert.equal(opcion.disabled, false);
  assert.equal(e.nodo('perfilNovedadesEstado').textContent, 'Activados. Todavía no hemos empezado a enviarlos.');
  // Con el correo y el envío al móvil apagados en la base, se dice (casilla del alta apagada con el correo).
  assert.equal(e.nodo('perfilNovedadesCorreo').hidden, false);
  assert.equal(e.nodo('perfilNovedadesCorreo').textContent,
    'El envío por correo y al móvil todavía no está activo. Mientras tanto, los avisos se ven en la campana.');
  assert.equal(e.avisos.at(-1), ACTIVADOS);
  opcion.checked = false;
  await opcion.handlers.get('change')({ target: opcion });
  assert.deepEqual(e.rpc().at(-1).cuerpo, { p_activar: false, p_version: VERSION, p_canal: 'web', p_idioma: 'es' });
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
  assert.ok(panel.includes('<b>Avisos de novedades.</b> ' + CASILLA_HTML + '</span></label>'), 'Texto exacto con «Privacidad» enlazada');
  assert.ok(panel.includes('<p class="perfil-nota perfil-ayuda">' + INFO_HTML + '</p>'), 'Con la información básica');
  assert.doesNotMatch(panel, /Próximamente: avisos por correo/);
  assert.equal(e.nodo('pfNovedades').checked, true);
  assert.equal(e.nodo('pfNovedadesEstado').textContent, 'Activados. Puedes desactivarlos cuando quieras.');
  // Con el correo activo en la base, sin nota de «todavía no está activo».
  assert.equal(e.nodo('pfNovedadesCorreo').hidden, true);
  // El bloque «Notificaciones en este móvil» va en el panel, oculto hasta que se pinta.
  assert.match(panel, /<div class="avisos-push" id="pfPush" hidden><h4 class="avisos-push-tit" id="pfPushTit">Notificaciones en este móvil<\/h4>/);
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

test('encendido: p_idioma es «en» solo si la web está en inglés y el texto del interruptor se ve traducido', async () => {
  for (const [opciones, esperado] of [
    [{}, 'es'],
    [{ idioma: 'es', textoCasilla: TEXTO_ES }, 'es'],
    // En inglés pero sin la frase en el diccionario: se ve el castellano.
    [{ idioma: 'en', textoCasilla: TEXTO_ES }, 'es'],
    [{ idioma: 'en', textoCasilla: 'Avisos de novedades. ' + TEXTO_ES }, 'es'],
    [{ idioma: 'en', textoCasilla: '' }, 'es'],
    [{ idioma: 'en' }, 'es'],
    [{ idioma: 'en', textoCasilla: TEXTO_EN }, 'en'],
  ]) {
    const e = entorno({ encendido: true, ...opciones });
    await tick();
    const opcion = e.nodo('perfilNovedadesOpcion');
    opcion.checked = true;
    await opcion.handlers.get('change')({ target: opcion });
    assert.equal(e.rpc().at(-1).cuerpo.p_idioma, esperado, JSON.stringify(opciones).slice(0, 60));
  }
});

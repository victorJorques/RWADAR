const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { crearControladorCuentas, crearClienteCuentas, crearTransporteCuentas, REDIRECT_CUENTAS,
  MAX_RESPUESTA, mensajeError } = require('../lib/cuentas');

const UID = '11111111-1111-4111-8111-111111111111';
const OTRO = '22222222-2222-4222-8222-222222222222';
const PLATAFORMA = '33333333-3333-4333-8333-333333333333';
const CORREO = 'persona@ejemplo.test';
const CLAVE = 'Esta clave tiene 12 o más caracteres';
const { crearAlmacenSesion } = require('../lib/almacen-sesion');
function almacenFalso() {
  const datos = new Map();
  return crearAlmacenSesion({ secureStore: {
    getItemAsync: async k => datos.get(k) ?? null,
    setItemAsync: async (k,v) => { datos.set(k,v); },
    deleteItemAsync: async k => { datos.delete(k); },
  } });
}
const entrada = { correo: CORREO, clave: CLAVE };
const alta = { ...entrada, nombre: 'Ana', aceptaCondiciones: true };
function pendiente() { let resolver; const promesa = new Promise(r => { resolver = r; }); return { promesa, resolver }; }

function entorno(opciones = {}) {
  const llamadas = [];
  const datos = { user: { id: UID, email: CORREO, email_confirmed_at: '2026-10-11T08:00:00Z' },
    accesoUser: null, perfil: { id: UID, nombre: 'Ana' }, vigiladas: [], fallo: null, ...opciones };
  const exito = data => ({ data, error: null });
  const cliente = {
    auth: {
      async signInWithPassword(cuerpo) { llamadas.push(['entrar', cuerpo]);
        if (datos.signIn) return datos.signIn(cuerpo);
        return exito({ user: datos.accesoUser || datos.user, session: { access_token: 'token-solo-prueba', refresh_token: 'refresh-prueba' } }); },
      async signUp(cuerpo) { llamadas.push(['registrar', cuerpo]); return datos.falloAlta || exito({ user: datos.user, session: datos.sesionAlta || null }); },
      async getUser() { llamadas.push(['getUser']); return datos.getUser ? datos.getUser() : datos.falloUser || exito({ user: datos.user }); },
      async getSession() { return exito({ session: { access_token: datos.token || 'cabecera.cuenta.prueba', refresh_token: 'refresh-prueba' } }); },
      async resend(cuerpo) { llamadas.push(['reenviar', cuerpo]); return exito({}); },
      async resetPasswordForEmail(correo, opciones) { llamadas.push(['recuperar', correo, opciones]); return exito({}); },
      async signOut(cuerpo) { llamadas.push(['salir', cuerpo]); return datos.signOut ? datos.signOut() : exito({}); },
      stopAutoRefresh() { llamadas.push(['stopAutoRefresh']); },
      dispose() {},
    },
    from(tabla) {
      const query = { tabla, filtros: [], metodo: 'leer' };
      const builder = {
        select(columnas) { query.columnas = columnas; return builder; },
        eq(campo, valor) { query.filtros.push([campo, valor]); return builder; },
        limit(n) { query.limite = n; return builder; },
        update(cuerpo) { query.metodo = 'actualizar'; query.cuerpo = cuerpo; return builder; },
        insert(cuerpo) { query.metodo = 'insertar'; query.cuerpo = cuerpo; return builder; },
        delete() { query.metodo = 'borrar'; return builder; },
        then(resolve, reject) {
          llamadas.push(['tabla', structuredClone(query)]);
          const ejecutar = async () => {
            if (datos.consulta) { const especial = await datos.consulta(query); if (especial) return especial; }
            if (datos.fallo) return { data: null, error: datos.fallo };
            if (tabla === 'mi_perfil') return exito(datos.perfil ? [datos.perfil] : []);
            if (tabla === 'perfiles') {
              datos.perfil = { ...datos.perfil, ...query.cuerpo };
              return exito([datos.perfil]);
            }
            if (tabla === 'plataformas') return exito(datos.plataformas || [{ id: PLATAFORMA, nombre: 'Empresa de prueba' }]);
            if (tabla === 'vigilancia') {
              if (query.metodo === 'insertar') datos.vigiladas.push({ ...query.cuerpo, plataformas: { nombre: 'Empresa de prueba' } });
              if (query.metodo === 'borrar') datos.vigiladas = [];
              return exito(datos.vigiladas);
            }
            throw new Error('Tabla no prevista: ' + tabla);
          };
          return ejecutar().then(resolve, reject);
        },
      };
      return builder;
    },
    async rpc(nombre) { llamadas.push(['rpc', nombre]); return datos.falloBaja || exito(null); },
  };
  const controlador = crearControladorCuentas({ modoLocal: false, cuentasRemotas: true,
    correoVerificado: true, cliente, plazoMs: 100, almacenSesion: almacenFalso(), ...opciones.controlador });
  return { controlador, cliente, llamadas, datos };
}

test('clienteCatalogo exige cuenta confirmada y perfil propio de la sesión actual', async () => {
  const e = entorno();
  await assert.rejects(e.controlador.clienteCatalogo());
  await e.controlador.entrar(entrada);
  assert.equal(await e.controlador.clienteCatalogo(), e.cliente);
  e.datos.perfil = null;
  await assert.rejects(e.controlador.clienteCatalogo());
  assert.equal(e.controlador.estado().usuario, null);
});

test('clienteCatalogo de A que termina después no purga la sesión B', async () => {
  const e = entorno(); await e.controlador.entrar(entrada);
  const p = pendiente(); e.datos.getUser = () => p.promesa;
  const antigua = e.controlador.clienteCatalogo();
  await e.controlador.salir(); e.datos.getUser = null;
  e.datos.user = { ...e.datos.user, id: OTRO }; e.datos.perfil = { id: OTRO, nombre: 'B' };
  await e.controlador.entrar(entrada);
  p.resolver({ data: { user: { id: UID, email: CORREO, email_confirmed_at: '2026-10-11T08:00:00Z' } }, error: null });
  await assert.rejects(antigua);
  assert.equal(e.controlador.estado().usuario.id, OTRO);
});
test('perfil protegido: 503 conserva la sesion verificada y 401 la elimina', async () => {
  for (const status of [503,401]) {
    const e=entorno();await e.controlador.entrar(entrada);
    e.datos.fallo={status,message:'Base no disponible'};
    assert.equal((await e.controlador.refrescar()).ok,false);
    if(status===503)assert.equal(e.controlador.estado().usuario.id,UID);
    else assert.equal(e.controlador.estado().usuario,null);
  }
});

test('accesoTutorial entrega cabecera solo al endpoint fijo tras corroborar cuenta',async()=>{
  const e=entorno();await assert.rejects(e.controlador.accesoTutorial());
  await e.controlador.entrar(entrada);
  const acceso=await e.controlador.accesoTutorial();
  assert.equal(acceso.uri,'https://rwadar.pages.dev/api/acceso/tutorial');
  assert.deepEqual(acceso.headers,{Authorization:'Bearer cabecera.cuenta.prueba'});
  assert.ok(!acceso.uri.includes('cabecera'));
  e.datos.perfil=null;await assert.rejects(e.controlador.accesoTutorial());
});

test('cuentas locales/cerradas nunca crean un cliente ni llaman a Auth', async () => {
  for (const opciones of [{}, { modoLocal: true, cuentasRemotas: true, correoVerificado: true },
    { modoLocal: false, cuentasRemotas: false, correoVerificado: true },
    { modoLocal: false, cuentasRemotas: true, correoVerificado: false }]) {
    let llamadas = 0;
    const c = crearControladorCuentas({ ...opciones, crearCliente() { llamadas++; throw new Error('Nunca'); } });
    assert.equal(c.estado().estado, 'pausa');
    for (const [accion, args] of [['registrar', alta], ['entrar', entrada], ['reenviar', { correo: CORREO }],
      ['recuperar', { correo: CORREO }], ['guardarPerfil', { nombre: 'Ana' }], ['alternarVigilancia', 'Empresa de prueba'],
      ['refrescar'], ['borrarCuenta', { clave: CLAVE, confirmacion: 'BORRAR' }]]) {
      assert.equal((await c[accion](args)).ok, false);
    }
    await c.salir(); c.cancelar(); c.destruir();
    assert.equal(llamadas, 0);
  }
});

test('candidato de cuentas autorizado: no abre el seguimiento por instalación ni push', () => {
  const modo = fs.readFileSync(path.join(__dirname, '../lib/modo-local.js'), 'utf8');
  assert.match(modo, /SERVICIOS_USUARIO_REMOTOS = false/);
  assert.match(modo, /CUENTAS_REMOTAS = true/);
  assert.match(modo, /CORREO_AUTH_E2E = true/);
});

test('el SDK de cuentas no persiste, no detecta URL, no usa almacenamiento y se fija su versión', () => {
  let config;
  crearClienteCuentas({ createClient(url, clave, opciones) { config = { url, clave, opciones }; return {}; } });
  const { storageKey, ...auth } = config.opciones.auth;
  assert.deepEqual(auth, { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, flowType: 'implicit' });
  assert.match(storageKey, /^rwadar\.cuenta\.memoria\.\d+$/);
  assert.equal(typeof config.opciones.global.fetch, 'function');
  const fuente = fs.readFileSync(path.join(__dirname, '../lib/cuentas.js'), 'utf8');
  assert.doesNotMatch(fuente, /require\(['"](?:@react-native-async-storage|expo-secure-store)|localStorage\./);
  const paquete = require('../package.json');
  const lock = require('../package-lock.json');
  assert.equal(paquete.dependencies['@supabase/supabase-js'], '2.112.1');
  assert.equal(lock.packages[''].dependencies['@supabase/supabase-js'], '2.112.1');
});

test('alta exige correo, 12 caracteres, nombre limpio y aceptación explícita antes de tocar la red', async () => {
  for (const parcial of [{ correo: 'mal' }, { clave: 'corta' }, { aceptaCondiciones: false },
    { nombre: 'a'.repeat(61) }, { nombre: 'Ana\u0000' }]) {
    const e = entorno();
    assert.equal((await e.controlador.registrar({ ...alta, ...parcial })).ok, false);
    assert.deepEqual(e.llamadas, []);
  }
});

test('alta confirma por la web oficial y nunca da por iniciada una sesión', async () => {
  const e = entorno({ sesionAlta: { access_token: 'config-autoconfirm-accidental' } });
  assert.equal((await e.controlador.registrar(alta)).ok, true);
  assert.equal(e.controlador.estado().estado, 'confirmacion');
  assert.equal(e.controlador.estado().usuario, null);
  assert.deepEqual(e.llamadas[0], ['registrar', { email: CORREO, password: CLAVE,
    options: { emailRedirectTo: REDIRECT_CUENTAS, data: { nombre: 'Ana' } } }]);
  assert.equal(e.llamadas.length, 1);
});

test('SMTP fallido no se presenta como cuenta creada ni revela mensajes internos', async () => {
  const e = entorno({ falloAlta: { data: null, error: { code: 'unexpected_failure', status: 500,
    message: 'smtp clave MUY-PRIVADA' } } });
  assert.equal((await e.controlador.registrar(alta)).ok, false);
  assert.equal(e.controlador.estado().estado, 'sin-sesion');
  assert.doesNotMatch(e.controlador.estado().error, /MUY-PRIVADA|smtp/);
});

test('acceso revalida getUser y lee solo el perfil propio antes de abrir la cuenta', async () => {
  const e = entorno();
  assert.equal((await e.controlador.entrar(entrada)).ok, true);
  assert.equal(e.controlador.estado().estado, 'autenticada');
  assert.deepEqual(e.controlador.estado().usuario, { id: UID, correo: CORREO });
  assert.deepEqual(e.llamadas.map(x => x[0]), ['entrar', 'getUser', 'tabla', 'tabla']);
  const perfil = e.llamadas[2][1];
  assert.equal(perfil.tabla, 'mi_perfil');
  assert.equal(perfil.columnas, 'id,nombre');
  assert.deepEqual(perfil.filtros, [['id', UID]]);
  assert.deepEqual(e.llamadas[3][1].filtros, [['usuario_id', UID]]);
  assert.doesNotMatch(JSON.stringify(e.controlador.estado()), /token-solo-prueba|access_token|refresh_token/);
});

for (const [titulo, opciones] of [
  ['sin confirmar', { user: { id: UID, email: CORREO, email_confirmed_at: null } }],
  ['anónimo', { user: { id: UID, email: CORREO, email_confirmed_at: '2026-10-11', is_anonymous: true } }],
  ['fecha inventada', { user: { id: UID, email: CORREO, email_confirmed_at: 'incorrecto' } }],
  ['usuario distinto', { accesoUser: { id: OTRO } }],
  ['perfil ajeno', { perfil: { id: OTRO, nombre: 'Ajeno' } }],
  ['perfil ausente', { perfil: null }],
]) test('rechaza acceso ' + titulo + ' y no retiene datos de la sesión', async () => {
  const e = entorno(opciones);
  assert.equal((await e.controlador.entrar(entrada)).ok, false);
  assert.equal(e.controlador.estado().usuario, null);
  assert.equal(e.controlador.estado().perfil, null);
  assert.deepEqual(e.controlador.estado().vigiladas, []);
});

test('reenvío y recuperación no enumeran cuentas y usan solo la URL oficial', async () => {
  const e = entorno();
  await e.controlador.reenviar({ correo: CORREO });
  assert.deepEqual(e.llamadas[0], ['reenviar', { type: 'signup', email: CORREO, options: { emailRedirectTo: REDIRECT_CUENTAS } }]);
  assert.match(e.controlador.estado().mensaje, /Si hay una cuenta pendiente/);
  await e.controlador.recuperar({ correo: CORREO });
  assert.deepEqual(e.llamadas[1], ['recuperar', CORREO, { redirectTo: REDIRECT_CUENTAS }]);
  assert.match(e.controlador.estado().mensaje, /Si ese correo tiene una cuenta/);
  assert.equal(e.controlador.estado().usuario, null);
});

test('vigilancia añade y quita solo filas propias y muestra el estado confirmado por la base', async () => {
  const e = entorno();
  await e.controlador.entrar(entrada);
  assert.equal((await e.controlador.alternarVigilancia('Empresa de prueba')).ok, true);
  assert.deepEqual(e.controlador.estado().vigiladas, [{ id: PLATAFORMA, nombre: 'Empresa de prueba' }]);
  const insercion = e.llamadas.find(x => x[0] === 'tabla' && x[1].metodo === 'insertar')[1];
  assert.deepEqual(insercion.cuerpo, { usuario_id: UID, plataforma_id: PLATAFORMA });
  assert.equal((await e.controlador.alternarVigilancia('Empresa de prueba')).ok, true);
  assert.deepEqual(e.controlador.estado().vigiladas, []);
  const baja = e.llamadas.find(x => x[0] === 'tabla' && x[1].metodo === 'borrar')[1];
  assert.deepEqual(baja.filtros, [['usuario_id', UID], ['plataforma_id', PLATAFORMA]]);
});

test('una plataforma fuera de contrato no se inventa ni se guarda', async () => {
  const e = entorno({ plataformas: [{ id: 'no-es-uuid', nombre: 'Empresa de prueba' }] });
  await e.controlador.entrar(entrada);
  assert.equal((await e.controlador.alternarVigilancia('Empresa de prueba')).ok, false);
  assert.ok(e.llamadas.every(x => x[0] !== 'tabla' || x[1].metodo !== 'insertar'));
});

test('editar nombre filtra por UID, limita columnas y no cambia privilegios ni consentimiento', async () => {
  const e = entorno();
  await e.controlador.entrar(entrada);
  assert.equal((await e.controlador.guardarPerfil({ nombre: '  Nombre nuevo  ' })).ok, true);
  const cambio = e.llamadas.find(x => x[0] === 'tabla' && x[1].metodo === 'actualizar')[1];
  assert.deepEqual(cambio.cuerpo, { nombre: 'Nombre nuevo' });
  assert.equal(cambio.columnas, 'id,nombre');
  assert.deepEqual(cambio.filtros, [['id', UID]]);
  assert.equal(e.controlador.estado().perfil.nombre, 'Nombre nuevo');
});

test('el nombre es opcional también al editar: vacío se guarda como null', async () => {
  const e = entorno();
  await e.controlador.entrar(entrada);
  assert.equal((await e.controlador.guardarPerfil({ nombre: '  ' })).ok, true);
  const cambio = e.llamadas.find(x => x[0] === 'tabla' && x[1].metodo === 'actualizar')[1];
  assert.deepEqual(cambio.cuerpo, { nombre: null });
  assert.equal(e.controlador.estado().perfil.nombre, '');
});

test('el error de correo no confirmado ofrece el reenvío sin iniciar sesión', async () => {
  const e = entorno({ signIn: () => ({ data: null, error: { code: 'email_not_confirmed' } }) });
  assert.equal((await e.controlador.entrar(entrada)).ok, false);
  assert.equal(e.controlador.estado().estado, 'confirmacion');
  assert.equal(e.controlador.estado().usuario, null);
});

test('fallo al revalidar identidad limpia inmediatamente todos los datos sensibles', async () => {
  const e = entorno();
  await e.controlador.entrar(entrada);
  e.datos.falloUser = { data: null, error: { status: 503, message: 'no disponible' } };
  assert.equal((await e.controlador.refrescar()).ok, false);
  assert.equal(e.controlador.estado().usuario.id, UID);
  assert.equal(e.controlador.estado().perfil.nombre, 'Ana');
});

test('salir purga memoria antes del resultado remoto y limita logout a este dispositivo', async () => {
  const e = entorno(), espera = pendiente();
  await e.controlador.entrar(entrada);
  e.datos.signOut = () => espera.promesa;
  const salida = e.controlador.salir();
  assert.equal(e.controlador.estado().usuario, null);
  assert.equal(e.controlador.estado().perfil, null);
  assert.deepEqual(e.llamadas.find(x => x[0] === 'salir'), ['salir', { scope: 'local' }]);
  espera.resolver({ data: null, error: { status: 500 } });
  assert.equal((await salida).ok, false);
  assert.match(e.controlador.estado().error, /no se pudo confirmar el cierre remoto/);
});

test('una salida tardía fallida no limpia otra entrada ni sustituye su mensaje', async () => {
  const e = entorno(), espera = pendiente();
  await e.controlador.entrar(entrada);
  e.datos.signOut = () => espera.promesa;
  const salida = e.controlador.salir();
  await e.controlador.entrar(entrada);
  espera.resolver({ data: null, error: { status: 500 } });
  assert.equal((await salida).cancelada, true);
  assert.equal(e.controlador.estado().estado, 'autenticada');
  assert.equal(e.controlador.estado().error, null);
});

test('cerrar durante un login pendiente impide que reaparezca una sesión', async () => {
  const e = entorno(), espera = pendiente();
  e.datos.signIn = () => espera.promesa;
  const acceso = e.controlador.entrar(entrada);
  await e.controlador.salir();
  espera.resolver({ data: { user: e.datos.user, session: { access_token: 'tardio' } }, error: null });
  assert.equal((await acceso).cancelada, true);
  assert.equal(e.controlador.estado().usuario, null);
  assert.ok(e.llamadas.every(x => x[0] !== 'getUser'));
});

test('identidad anterior tardía no borra una nueva sesión tras cancelar', async () => {
  const e = entorno(), espera = pendiente();
  let vueltas = 0;
  e.datos.getUser = () => ++vueltas === 1 ? espera.promesa : Promise.resolve({ data: { user: e.datos.user }, error: null });
  const anterior = e.controlador.entrar(entrada);
  await new Promise(r => setImmediate(r));
  e.controlador.cancelar();
  await e.controlador.entrar(entrada);
  espera.resolver({ data: null, error: { status: 401 } });
  assert.equal((await anterior).cancelada, true);
  assert.equal(e.controlador.estado().estado, 'autenticada');
});

test('la cota del modelo termina una petición que ignora abort sin quedarse procesando', async () => {
  const e = entorno({ controlador: { plazoMs: 10 } });
  e.datos.signIn = () => new Promise(() => {});
  assert.equal((await e.controlador.entrar(entrada)).ok, false);
  assert.equal(e.controlador.estado().procesando, false);
  assert.equal(e.controlador.estado().usuario, null);
  assert.match(e.controlador.estado().error, /tarda demasiado/);
});

test('doble toque en el acceso no envía dos logins ni mezcla identidades', async () => {
  const e = entorno(), espera = pendiente();
  e.datos.signIn = () => espera.promesa;
  const primera = e.controlador.entrar(entrada);
  assert.equal((await e.controlador.entrar(entrada)).ok, false);
  assert.equal(e.llamadas.filter(x => x[0] === 'entrar').length, 1);
  espera.resolver({ data: { user: e.datos.user, session: { access_token: 'prueba', refresh_token: 'refresh-prueba' } }, error: null });
  assert.equal((await primera).ok, true);
});

test('baja necesita BORRAR y contraseña fresca; nunca utiliza solo el JWT anterior', async () => {
  const e = entorno();
  await e.controlador.entrar(entrada);
  const antes = e.llamadas.length;
  assert.equal((await e.controlador.borrarCuenta({ clave: CLAVE, confirmacion: 'BORRA' })).ok, false);
  assert.equal(e.llamadas.length, antes);
  assert.equal((await e.controlador.borrarCuenta({ clave: CLAVE, confirmacion: 'BORRAR' })).ok, true);
  assert.deepEqual(e.llamadas.slice(antes).filter(x => x[0] !== 'stopAutoRefresh').map(x => x[0]), ['entrar', 'getUser', 'rpc']);
  assert.equal(e.controlador.estado().usuario, null);
  assert.deepEqual(e.controlador.estado().vigiladas, []);
});

test('reauth con otra identidad jamás llama al borrado', async () => {
  const e = entorno();
  await e.controlador.entrar(entrada);
  e.datos.user = { ...e.datos.user, id: OTRO };
  assert.equal((await e.controlador.borrarCuenta({ clave: CLAVE, confirmacion: 'BORRAR' })).ok, false);
  assert.ok(e.llamadas.every(x => x[0] !== 'rpc'));
});

test('cancelar la reautenticación impide enviar la baja irreversible', async () => {
  const e = entorno(), espera = pendiente();
  await e.controlador.entrar(entrada);
  e.datos.signIn = () => espera.promesa;
  const baja = e.controlador.borrarCuenta({ clave: CLAVE, confirmacion: 'BORRAR' });
  e.controlador.cancelar();
  espera.resolver({ data: { user: e.datos.user, session: { access_token: 'prueba', refresh_token: 'refresh-prueba' } }, error: null });
  assert.equal((await baja).cancelada, true);
  assert.ok(e.llamadas.every(x => x[0] !== 'rpc'));
  assert.equal(e.controlador.estado().estado, 'autenticada');
});

test('snapshots y suscripción no permiten mutar datos internos; destruir no reabre sesiones', async () => {
  const e = entorno(), vistas = [];
  const dejar = e.controlador.suscribir(estado => vistas.push(estado));
  await e.controlador.entrar(entrada);
  const copia = e.controlador.estado(); copia.usuario.id = OTRO; copia.perfil.nombre = 'Manipulado'; copia.vigiladas.push({});
  assert.equal(e.controlador.estado().usuario.id, UID);
  assert.equal(e.controlador.estado().perfil.nombre, 'Ana');
  assert.deepEqual(e.controlador.estado().vigiladas, []);
  dejar(); const longitud = vistas.length;
  e.controlador.destruir();
  assert.equal((await e.controlador.entrar(entrada)).ok, false);
  assert.equal(vistas.length, longitud);
});

test('transporte impide otro origen antes de enviar credenciales', async () => {
  let llamadas = 0;
  const transporte = crearTransporteCuentas({ fetchImpl() { llamadas++; } });
  for (const url of ['https://ejemplo.test/auth/v1/token', 'http://exgpmjpaaebyoolpwced.supabase.co/auth/v1/token',
    'https://exgpmjpaaebyoolpwced.supabase.co/storage/v1/object']) await assert.rejects(transporte(url), /destino_invalido/);
  assert.equal(llamadas, 0);
});

test('transporte limita cabeceras/cuerpo, no usa cookies y rechaza redirecciones', async () => {
  let opciones;
  const transporte = crearTransporteCuentas({ fetchImpl: async (_url, config) => {
    opciones = config; return new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } });
  } });
  assert.deepEqual(await (await transporte('https://exgpmjpaaebyoolpwced.supabase.co/auth/v1/user')).json(), { ok: true });
  assert.equal(opciones.redirect, 'error'); assert.equal(opciones.credentials, 'omit'); assert.equal(opciones.cache, 'no-store');
  for (const respuesta of [new Response('x', { headers: { 'content-length': String(MAX_RESPUESTA + 1) } }),
    new Response('x'.repeat(MAX_RESPUESTA + 1))]) {
    const grande = crearTransporteCuentas({ fetchImpl: async () => respuesta });
    await assert.rejects(grande('https://exgpmjpaaebyoolpwced.supabase.co/auth/v1/user'), /respuesta_excesiva/);
  }
});

test('transporte acota incluso un cuerpo que no termina y libera su temporizador', async () => {
  const transporte = crearTransporteCuentas({ plazoMs: 10, fetchImpl: async () => ({ status: 200,
    headers: new Headers(), text: () => new Promise(() => {}) }) });
  await assert.rejects(transporte('https://exgpmjpaaebyoolpwced.supabase.co/auth/v1/user'), /plazo/);
});

test('mensajes traducen códigos conocidos sin exponer texto remoto', () => {
  assert.match(mensajeError({ code: 'email_not_confirmed' }), /Confirma/);
  assert.match(mensajeError({ code: 'invalid_credentials' }), /no son correctos/);
  assert.match(mensajeError({ status: 429 }), /Espera/);
  assert.doesNotMatch(mensajeError({ message: 'token secreto' }), /token secreto/);
});

test('el SDK real con transporte simulado recorre alta, acceso, recuperación, perfil y logout sin red', async () => {
  // Formato que espera el SDK; no es un JWT emitido ni contiene una firma real.
  const tokenDePrueba = [{ alg: 'HS256' }, { sub: '1' }]
    .map(parte => Buffer.from(JSON.stringify(parte)).toString('base64url')).join('.') + '.prueba';
  const llamadas = [], user = { id: UID, email: CORREO, email_confirmed_at: '2026-10-11T08:00:00Z',
    aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-10-11T08:00:00Z' };
  const crearCliente = () => crearClienteCuentas({ fetchImpl: async (url, opciones) => {
    const destino = new URL(url), cuerpo = opciones.body && JSON.parse(opciones.body);
    llamadas.push({ ruta: destino.pathname, query: destino.searchParams, opciones, cuerpo });
    let data;
    if (destino.pathname === '/auth/v1/signup') data = user;
    else if (destino.pathname === '/auth/v1/token') data = { user, access_token: tokenDePrueba,
      refresh_token: 'refresh-aislado', expires_in: 3600, token_type: 'bearer' };
    else if (destino.pathname === '/auth/v1/user') data = user;
    else if (destino.pathname === '/rest/v1/mi_perfil') data = [{ id: UID, nombre: 'Ana' }];
    else if (destino.pathname === '/rest/v1/vigilancia') data = [];
    else if (['/auth/v1/resend', '/auth/v1/recover', '/auth/v1/logout'].includes(destino.pathname)) data = {};
    else throw new Error('Petición fuera del ensayo: ' + destino.pathname);
    return new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } });
  } });
  const c = crearControladorCuentas({ modoLocal: false, cuentasRemotas: true, correoVerificado: true, crearCliente, almacenSesion: almacenFalso() });
  assert.equal((await c.registrar(alta)).ok, true);
  assert.equal(c.estado().estado, 'confirmacion');
  assert.equal((await c.reenviar({ correo: CORREO })).ok, true);
  assert.equal((await c.recuperar({ correo: CORREO })).ok, true);
  assert.equal((await c.entrar(entrada)).ok, true);
  assert.equal(c.estado().usuario.id, UID);
  assert.equal((await c.salir()).ok, true);
  assert.equal(c.estado().usuario, null);
  assert.deepEqual(llamadas.map(x => x.ruta), ['/auth/v1/signup', '/auth/v1/resend', '/auth/v1/recover',
    '/auth/v1/token', '/auth/v1/user', '/rest/v1/mi_perfil', '/rest/v1/vigilancia', '/auth/v1/logout']);
  assert.equal(llamadas[0].query.get('redirect_to'), REDIRECT_CUENTAS);
  assert.equal(llamadas[2].query.get('redirect_to'), REDIRECT_CUENTAS);
  assert.equal(llamadas[7].query.get('scope'), 'local');
  for (const llamada of llamadas) assert.equal(llamada.opciones.credentials, 'omit');
  c.destruir();
});

/* Avisos de novedades (contrato del 05/11/2026): metadatos del alta y tarea
   previa a cerrar sesión (quitar este móvil de los avisos). */
const TOKEN_AVISOS = 'ExponentPushToken[abcdefghijklmnop1234]';
const VERSION_AVISOS = 'novedades-v2-2026-11-06';

test('alta con el interruptor de avisos apagado: nada nuevo en los metadatos aunque se pida', async () => {
  for (const avisosNovedades of [true, false, 'true', 1, undefined]) {
    const e = entorno();
    assert.equal((await e.controlador.registrar({ ...alta, avisosNovedades })).ok, true);
    assert.deepEqual(e.llamadas[0][1].options.data, { nombre: 'Ana' });
  }
});

test('alta con el interruptor encendido: avisos solo con la casilla marcada y booleano estricto', async () => {
  for (const [avisosNovedades, esperado] of [
    [true, { nombre: 'Ana', avisos_novedades: true, avisos_version: VERSION_AVISOS, avisos_canal: 'app', avisos_idioma: 'es' }],
    [false, { nombre: 'Ana' }], ['true', { nombre: 'Ana' }], [1, { nombre: 'Ana' }], [undefined, { nombre: 'Ana' }],
  ]) {
    const e = entorno({ controlador: { avisosNovedades: true } });
    assert.equal((await e.controlador.registrar({ ...alta, avisosNovedades, idioma: 'es' })).ok, true);
    assert.deepEqual(e.llamadas[0][1], { email: CORREO, password: CLAVE,
      options: { emailRedirectTo: REDIRECT_CUENTAS, data: esperado } }, String(avisosNovedades));
  }
  // Con el permiso se guarda el idioma en que se vio la casilla: 'es' o 'en'.
  // Sin él (o con otro valor), el de la app en ese momento; nunca otra cosa.
  const idioma = require('../lib/idioma');
  for (const [pedido, appEn, esperado] of [['en', false, 'en'], ['es', true, 'es'], [undefined, false, 'es'],
    [undefined, true, 'en'], ['fr', false, 'es'], ['EN', true, 'en']]) {
    await idioma.cambiarIdioma(appEn ? 'en' : 'es');
    try {
      const e = entorno({ controlador: { avisosNovedades: true } });
      assert.equal((await e.controlador.registrar({ ...alta, avisosNovedades: true, idioma: pedido })).ok, true);
      assert.equal(e.llamadas[0][1].options.data.avisos_idioma, esperado, `${pedido} / app en ${appEn ? 'inglés' : 'español'}`);
    } finally { await idioma.cambiarIdioma('es'); }
  }
  // Sin casilla no se guarda idioma ninguno.
  const sinCasilla = entorno({ controlador: { avisosNovedades: true } });
  await sinCasilla.controlador.registrar({ ...alta, avisosNovedades: false, idioma: 'en' });
  assert.deepEqual(sinCasilla.llamadas[0][1].options.data, { nombre: 'Ana' });
  const e = entorno({ controlador: { avisosNovedades: true } });
  assert.equal((await e.controlador.registrar({ ...alta, aceptaCondiciones: false, avisosNovedades: true })).ok, false);
  assert.deepEqual(e.llamadas, [], 'sin la casilla de 18 años y condiciones no se envía nada');
  assert.match(mensajeError({ code: 'condiciones' }), /18 años o más/);
});

test('cerrar sesión ejecuta la tarea previa con la sesión que se cierra, antes de revocarla', async () => {
  const orden = [];
  const e = entorno({ controlador: { antesDeSalir: async ({ cliente, usuarioId }) => {
    orden.push(['antes', usuarioId, cliente === e.cliente, e.controlador.estado().usuario]);
  } } });
  e.datos.signOut = () => { orden.push(['signOut']); return { data: {}, error: null }; };
  await e.controlador.entrar(entrada);
  const salida = e.controlador.salir();
  assert.equal(e.controlador.estado().usuario, null, 'la pantalla sale al momento');
  assert.equal((await salida).ok, true);
  assert.deepEqual(orden, [['antes', UID, true, null], ['signOut']]);
});

test('una tarea previa que falla o se cuelga no bloquea el cierre de sesión', async () => {
  for (const antesDeSalir of [async () => { throw new Error('red'); }, () => { throw new Error('síncrono'); },
    () => new Promise(() => {})]) {
    const e = entorno({ controlador: { antesDeSalir, plazoAntesDeSalir: 20 } });
    await e.controlador.entrar(entrada);
    assert.equal((await e.controlador.salir()).ok, true);
    assert.deepEqual(e.llamadas.find(x => x[0] === 'salir'), ['salir', { scope: 'local' }]);
    assert.equal(e.controlador.estado().usuario, null);
  }
  // Sin sesión abierta no hay nada que quitar.
  let llamadas = 0;
  const e = entorno({ controlador: { antesDeSalir: () => { llamadas++; } } });
  assert.equal((await e.controlador.salir()).ok, true);
  assert.equal(llamadas, 0);
});

test('el SDK real quita el móvil de los avisos por /rest/v1/rpc con el token de la sesión antes del logout', async () => {
  const tokenDePrueba = [{ alg: 'HS256' }, { sub: '1' }]
    .map(parte => Buffer.from(JSON.stringify(parte)).toString('base64url')).join('.') + '.prueba';
  const llamadas = [], user = { id: UID, email: CORREO, email_confirmed_at: '2026-10-11T08:00:00Z',
    aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-10-11T08:00:00Z' };
  const crearCliente = (opciones) => crearClienteCuentas({ ...opciones, fetchImpl: async (url, peticion) => {
    const destino = new URL(url), cuerpo = peticion.body && JSON.parse(peticion.body);
    llamadas.push({ ruta: destino.pathname, cuerpo, autorizacion: new Headers(peticion.headers).get('authorization') });
    let data;
    if (destino.pathname === '/auth/v1/signup') data = user;
    else if (destino.pathname === '/auth/v1/token') data = { user, access_token: tokenDePrueba,
      refresh_token: 'refresh-aislado', expires_in: 3600, token_type: 'bearer' };
    else if (destino.pathname === '/auth/v1/user') data = user;
    else if (destino.pathname === '/rest/v1/mi_perfil') data = [{ id: UID, nombre: 'Ana' }];
    else if (destino.pathname === '/rest/v1/vigilancia') data = [];
    else if (destino.pathname === '/rest/v1/rpc/quitar_aviso_push') data = true;
    else if (destino.pathname === '/auth/v1/logout') data = {};
    else throw new Error('Petición fuera del ensayo: ' + destino.pathname);
    return new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } });
  } });
  const { quitarPushConCliente } = require('../lib/avisos-cuenta');
  const c = crearControladorCuentas({ modoLocal: false, cuentasRemotas: true, correoVerificado: true, crearCliente,
    almacenSesion: almacenFalso(), avisosNovedades: true,
    antesDeSalir: ({ cliente }) => quitarPushConCliente(cliente, TOKEN_AVISOS) });
  assert.equal((await c.registrar({ ...alta, avisosNovedades: true })).ok, true);
  assert.deepEqual(llamadas[0].cuerpo.data, { nombre: 'Ana', avisos_novedades: true, avisos_version: VERSION_AVISOS, avisos_canal: 'app',
    avisos_idioma: 'es' });
  assert.equal((await c.entrar(entrada)).ok, true);
  assert.equal((await c.salir()).ok, true);
  const rutas = llamadas.map(x => x.ruta);
  const quitar = rutas.indexOf('/rest/v1/rpc/quitar_aviso_push');
  assert.ok(quitar > 0 && quitar < rutas.indexOf('/auth/v1/logout'), rutas.join(' '));
  assert.deepEqual(llamadas[quitar].cuerpo, { p_token: TOKEN_AVISOS });
  assert.equal(llamadas[quitar].autorizacion, 'Bearer ' + tokenDePrueba);
  c.destruir();
});

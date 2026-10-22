/* =====================================================================
   RWAdar · panel · la API del panel, igual en el ordenador y en la nube
   ---------------------------------------------------------------------
   Recibe una petición ya autenticada (el servidor de cada sitio se
   encarga de quién puede entrar) y devuelve { estado, cuerpo }.
   Lo que solo existe en el ordenador (subir el mantenimiento con
   wrangler, leer GitHub con gh, la comprobación a fondo, abrir el
   archivo de claves) llega en `extras`; en la nube no está.
   ===================================================================== */
'use strict';
const { ErrorPanel, crearCache } = require('./pedir');
const { crearSupabase } = require('./supabase');
const { crearCloudflare } = require('./cloudflare');
const { crearGithub } = require('./github');
const { crearInterruptorWeb } = require('./interruptor-web');
const { crearSalud } = require('./salud');
const { crearUsoApp } = require('./uso-app');
const { anotarDescargas, anotarHoras, leerHistorial } = require('./historial-app');

function crearApi({ config, almacen, extras = {} }) {
  const cache = crearCache();
  const supabase = crearSupabase(config);
  const cloudflare = crearCloudflare(config);
  const github = crearGithub(config, { leerPrivado: extras.leerGithub });
  const interruptor = crearInterruptorWeb({ config, cloudflare, almacen, subirMantenimiento: extras.subirMantenimiento });
  const salud = crearSalud({ config, supabase, github, cloudflare });
  const usoApp = crearUsoApp(config);
  let accionEnCurso = null;

  const resultado = p => p.status === 'fulfilled'
    ? { datos: p.value }
    : { error: p.reason?.message || 'sin respuesta', codigo: p.reason?.codigo || 'error' };

  /* Todo lo de la app de una vez. Lo que se lee se apunta en el
     historial; si el historial falla, la sección sale igual. */
  async function datosApp() {
    const [descargas, uso] = await Promise.allSettled([github.descargasApp(), usoApp.ultimas24h()]);
    try {
      if (descargas.status === 'fulfilled') await anotarDescargas(almacen, descargas.value);
      if (uso.status === 'fulfilled') await anotarHoras(almacen, uso.value.serie);
    } catch { /* el historial es un extra */ }
    const historial = await leerHistorial(almacen).catch(() => null);
    return { descargas: resultado(descargas), uso: resultado(uso), historial };
  }

  /* La llama el cron del panel de la nube cada hora para que el historial
     siga creciendo aunque nadie abra el panel. */
  async function tareaHoraria() {
    const [descargas, hora] = await Promise.allSettled([github.descargasApp(), usoApp.horaAnterior()]);
    if (descargas.status === 'fulfilled') await anotarDescargas(almacen, descargas.value);
    if (hora.status === 'fulfilled') await anotarHoras(almacen, [hora.value]);
    return { descargas: descargas.status, uso: hora.status };
  }

  const exigir = (condicion, mensaje) => { if (!condicion) throw new ErrorPanel(mensaje, { estado: 400 }); };

  const LECTURAS = {
    '/api/ajustes': async (url, quien) => ({
      modo: config.modo,
      modoDemo: config.modoDemo,
      quien,
      /* Dirección para compartir con los socios: la propia en la nube; en
         el ordenador, la que apuntó nube/publicar.mjs al subirlo. */
      urlNube: config.modo === 'nube' ? url.origin : (await extras.urlNube?.()) || null,
      /* Los enlaces personales solo los ve el panel del ordenador de Víctor. */
      enlaces: config.modo === 'nube' ? [] : (await extras.enlaces?.()) || [],
      web: config.web,
      proyecto: config.proyecto,
      archivoEnv: extras.archivoEnv || null,
      credenciales: {
        cloudflare: Boolean(config.cloudflareToken),
        supabase: Boolean(config.claveSecreta),
        registros: Boolean(config.supabaseAccessToken),
        github: extras.leerGithub ? 'gh' : config.githubToken ? 'token' : config.modoDemo ? 'simulado' : false,
      },
      puedeAFondo: Boolean(extras.aFondo),
      puedeAbrirClaves: Boolean(extras.abrirClaves),
    }),
    '/api/salud': async url => {
      if (url.searchParams.get('fresco') === '1') cache.olvidar('salud');
      return cache.obtener('salud', 60, () => salud.comprobar());
    },
    '/api/trafico': async url => {
      const periodo = url.searchParams.get('periodo') || '7d';
      return cache.obtener(`trafico:${periodo}`, 300, () => cloudflare.trafico(periodo));
    },
    '/api/app': async () => cache.obtener('app', 300, datosApp),
    '/api/cuentas': async () => cache.obtener('cuentas', 20, () => supabase.listarCuentas()),
    '/api/despliegues': async () => cache.obtener('despliegues', 30, () => cloudflare.desplieguesProduccion()),
    '/api/interruptores': async () => {
      const [web, catalogo] = await Promise.allSettled([interruptor.estado(), supabase.estadoCatalogo()]);
      const leer = x => x.status === 'fulfilled' ? x.value : { error: x.reason?.message || 'sin respuesta' };
      return { web: leer(web), catalogo: leer(catalogo), puedeApagar: Boolean(config.cloudflareToken), puedeRetirar: Boolean(config.claveSecreta) };
    },
    '/api/registro': async () => almacen.registro(),
  };

  /* Toda acción que cambia algo pide escribir una palabra de seguridad
     en la propia página y queda en el registro, salga bien o mal, con
     quién la hizo. */
  const ACCIONES = [
    [/^\/api\/web\/apagar$/, 'Apagar la web', async (_, c, quien) => {
      exigir(c.confirmacion === 'APAGAR', 'Escribe APAGAR para confirmar');
      return { objetivo: config.web, resultado: await interruptor.apagar({ quien }) };
    }],
    [/^\/api\/web\/encender$/, 'Encender la web', async () => ({ objetivo: config.web, resultado: await interruptor.encender() })],
    [/^\/api\/catalogo$/, 'Cambiar visibilidad del catálogo', async (_, c) => {
      if (c.retirado) exigir(c.confirmacion === 'RETIRAR', 'Escribe RETIRAR para confirmar');
      const resultado = await supabase.cambiarCatalogo({ retirado: c.retirado === true, motivo: c.motivo });
      return { objetivo: resultado.retirado ? 'retirado' : 'visible', resultado };
    }],
    [/^\/api\/cuentas\/([^/]+)\/borrar$/, 'Borrar cuenta', async (m, c) => {
      const resultado = await supabase.borrarCuenta(m[1], c.confirmacion);
      return { objetivo: resultado.correo, resultado };
    }],
    [/^\/api\/cuentas\/([^/]+)\/bloquear$/, 'Bloquear o desbloquear cuenta', async (m, c) => {
      const resultado = await supabase.bloquearCuenta(m[1], c.bloquear === true);
      return { objetivo: resultado.correo || m[1], resultado };
    }],
    [/^\/api\/cuentas\/([^/]+)\/confirmar$/, 'Confirmar correo de una cuenta', async m => {
      const resultado = await supabase.confirmarCuenta(m[1]);
      return { objetivo: resultado.correo || m[1], resultado };
    }],
  ];

  /* Herramientas que no cambian nada pero sí necesitan POST. */
  const HERRAMIENTAS = {
    '/api/salud/a-fondo': () => extras.aFondo
      ? extras.aFondo()
      : { disponible: false, correctas: 0, fallos: [], motivo: 'La comprobación a fondo solo se puede lanzar desde el panel del ordenador de Víctor.' },
    '/api/ajustes/abrir-claves': () => extras.abrirClaves
      ? extras.abrirClaves()
      : { abierto: false, motivo: 'En el panel de la nube las claves están guardadas en Cloudflare.' },
  };

  async function accion(ruta, cuerpo, quien) {
    const encontrada = ACCIONES.map(([patron, nombre, fn]) => [ruta.match(patron), nombre, fn]).find(([m]) => m);
    if (!encontrada) throw new ErrorPanel('No existe', { estado: 404 });
    if (accionEnCurso) throw new ErrorPanel(`Espera: todavía estoy con «${accionEnCurso}»`, { estado: 409 });
    const [m, nombre, fn] = encontrada;
    accionEnCurso = nombre;
    try {
      const { objetivo, resultado } = await fn(m, cuerpo, quien);
      await almacen.anotar({ accion: nombre, objetivo, resultado: 'hecho', quien });
      cache.olvidar('');
      return resultado;
    } catch (e) {
      await almacen.anotar({ accion: nombre, objetivo: m[1] || null, resultado: 'error', detalle: e.message, quien });
      throw e;
    } finally {
      accionEnCurso = null;
    }
  }

  /* metodo y ruta ya validados por quien llama; cuerpo ya es un objeto. */
  async function manejar({ metodo, url, cuerpo = {}, quien = null }) {
    try {
      const ruta = url.pathname;
      let datos;
      if (metodo === 'POST' && HERRAMIENTAS[ruta]) datos = await HERRAMIENTAS[ruta]();
      else if (metodo === 'POST') datos = await accion(ruta, cuerpo, quien);
      else if (metodo === 'GET' && LECTURAS[ruta]) datos = await LECTURAS[ruta](url, quien);
      else return { estado: 404, cuerpo: { ok: false, error: 'No existe' } };
      return { estado: 200, cuerpo: { ok: true, datos } };
    } catch (e) {
      const estado = e instanceof ErrorPanel ? e.estado : 500;
      return { estado, cuerpo: { ok: false, error: e.message || 'Error inesperado', codigo: e.codigo || 'error', detalle: e.detalle || null } };
    }
  }

  return { manejar, tareaHoraria };
}

module.exports = { crearApi };

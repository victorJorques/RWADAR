import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { exigirModoLocal, MODO_LOCAL, SERVICIOS_USUARIO_REMOTOS } from './modo-local';
import { validarRadarLocal, revisionTemporalOferta, ofertaConCifrasVigentes } from './verificacion-local';
import { CACHE_CATALOGO, crearLectorCatalogo } from './catalogo-remoto';
import { normalizarProgreso, progresoVacio } from './academy-progreso';
import { clavesPrivadasDispositivo } from './acceso-obligatorio';
import { quitarPushConCliente } from './avisos-cuenta';
import { bajaSinCuenta, validarGuardado } from './avisos-sin-cuenta';
import { compararVersiones, versionValida } from './novedades-rwadar';

/* Supabase no se importa al evaluar este módulo. En modo interno ni siquiera
   se ejecuta su archivo, de modo que cargar la app no puede crear un cliente
   dirigido al proyecto de producción por accidente. */
let moduloSupabase = MODO_LOCAL ? null : require('./supabase');
function supabaseRemoto() {
  if (MODO_LOCAL) throw new Error('Supabase está bloqueado en modo local');
  if (!moduloSupabase) throw new Error('No se pudo cargar el cliente remoto');
  return moduloSupabase;
}

let escaparateCache = null;
function escaparateLocal() {
  exigirModoLocal();
  if (!escaparateCache) {
    const cargado = require('../fixtures/escaparate-local.json');
    escaparateCache = cargado?.default || cargado;
  }
  if (!escaparateCache || !Array.isArray(escaparateCache.plataformas) ||
      !Array.isArray(escaparateCache.ofertas) || !Array.isArray(escaparateCache.secundario)) {
    throw new Error('El escaparate local no tiene el contrato esperado');
  }
  validarRadarLocal(escaparateCache.plataformas);
  return escaparateCache;
}

const USUARIO_LOCAL = MODO_LOCAL || SERVICIOS_USUARIO_REMOTOS !== true;
// No migrar ni reintentar operaciones de una instalación productiva anterior.
const PREFIJO = MODO_LOCAL ? 'rwadar.local.' : USUARIO_LOCAL ? 'rwadar.editorial.' : 'rwadar.';
const CACHE_RADAR = `${PREFIJO}cache.radar`;
const CACHE_FUERA = `${PREFIJO}cache.fuera`;
const CACHE_OFERTAS = `${PREFIJO}cache.ofertas`;
const CACHE_SECUNDARIO = `${PREFIJO}cache.secundario`;
const CACHE_EXCLUSIONES = `${PREFIJO}cache.exclusiones`;
const CACHE_FECHA = `${PREFIJO}cache.fecha`;
const CACHE_SIGO = `${PREFIJO}siguiendo`;
const CACHE_PENDIENTES = `${PREFIJO}seguimiento.pendiente`;
const PROGRESO_ACADEMY = `${PREFIJO}academy.progreso.v1`;
const OFERTAS_GUARDADAS = `${PREFIJO}ofertas.guardadas.v1`;
const CLAVES_LOCALES = [
  CACHE_RADAR, CACHE_FUERA, CACHE_OFERTAS, CACHE_SECUNDARIO,
  CACHE_EXCLUSIONES, CACHE_FECHA, CACHE_SIGO, CACHE_PENDIENTES, PROGRESO_ACADEMY,
  OFERTAS_GUARDADAS,
];
if (!MODO_LOCAL) CLAVES_LOCALES.push(CACHE_CATALOGO, 'rwadar.cache.catalogo.v1');
/* Novedades de RWAdar (12/11/2026): la última versión de la ventana de
   novedades que se ha visto en este dispositivo, p. ej. «2026-11-12». No es
   un dato personal ni va por cuenta; no sale del móvil. Solo evita enseñarla
   dos veces y se borra con «Borrar datos del dispositivo». */
const NOVEDADES_VISTAS = `${PREFIJO}novedades.vista.v2`;
CLAVES_LOCALES.push(NOVEDADES_VISTAS);
/* La v1 es la de las versiones de la app sin el recuadro «Activa los avisos»
   (14/11/2026). Con la OTA, el primer arranque aún corre la versión vieja: si
   la web ya tenía la 2026-11-14.2, la enseñaba sin el recuadro y la daba por
   vista en la v1. Por eso lo que diga la v1 desde la 2026-11-14.2 se lee como
   «2026-11-14» (la ventana sale una vez más, ya con el recuadro). Se sigue
   escribiendo también en la v1 por si se vuelve a una versión anterior. */
const NOVEDADES_VISTAS_V1 = `${PREFIJO}novedades.vista.v1`;
const V1_DESDE_RECUADRO = '2026-11-14.2';
const V1_ANTES_DEL_RECUADRO = '2026-11-14';
CLAVES_LOCALES.push(NOVEDADES_VISTAS_V1);

let lectorCatalogo = null;
let accesoCatalogo = null;
const DATOS_PERSONALES = new Set([CACHE_SIGO, CACHE_PENDIENTES, PROGRESO_ACADEMY, OFERTAS_GUARDADAS]);
function claveAlmacenamiento(clave) {
  if (MODO_LOCAL || !DATOS_PERSONALES.has(clave)) return clave;
  return accesoCatalogo ? clave + ':' + accesoCatalogo.usuarioId : null;
}
export function configurarAccesoCatalogo(usuarioId, obtenerCliente) {
  if (!usuarioId || typeof obtenerCliente !== 'function') {
    accesoCatalogo = null; lectorCatalogo = null; return;
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usuarioId)) throw new Error('Identidad de catálogo no válida');
  if (accesoCatalogo?.usuarioId !== usuarioId) {
    lectorCatalogo = null;
    accesoCatalogo = { usuarioId, obtenerCliente };
  } else accesoCatalogo.obtenerCliente = obtenerCliente;
}
async function cargarCatalogoRemoto(opciones) {
  if (MODO_LOCAL) throw new Error('El catálogo remoto está bloqueado en modo local');
  if (!accesoCatalogo) throw new Error('Se necesita una cuenta confirmada para consultar el catálogo');
  const acceso = accesoCatalogo;
  // Even a cache-only request requires the current verified account. Never
  // import the old anonymous cache into another person's account.
  await acceso.obtenerCliente();
  if (accesoCatalogo !== acceso) throw new Error('La cuenta ha cambiado');
  if (!lectorCatalogo) lectorCatalogo = crearLectorCatalogo({
    almacenamiento: {
      getItem: key => AsyncStorage.getItem(key + ':' + acceso.usuarioId),
      setItem: (key, value) => AsyncStorage.setItem(key + ':' + acceso.usuarioId, value),
      removeItem: key => AsyncStorage.removeItem(key + ':' + acceso.usuarioId),
    },
    clientePublico: acceso.obtenerCliente,
  });
  return lectorCatalogo.cargar(opciones);
}

export async function cargarCatalogo(opciones = {}) {
  if (!MODO_LOCAL) return cargarCatalogoRemoto(opciones);
  const [radar, ofertas] = await Promise.all([cargarRadar(opciones), cargarOfertas(opciones)]);
  return { plataformas: radar.datos, ofertas: ofertas.datos, deCache: false,
    local: true, error: radar.error || ofertas.error };
}

/* ---------------------------------------------------------------------
   Consulta sin conexión
   --------------------------------------------------------------------- */
async function guardar(clave, datos) {
  const destino = claveAlmacenamiento(clave);
  if (!destino) throw new Error('Entra para guardar tus datos');
  await AsyncStorage.setItem(destino, JSON.stringify(datos));
}

async function leer(clave) {
  try {
    const destino = claveAlmacenamiento(clave);
    if (!destino) return null;
    const cuenta = accesoCatalogo;
    const s = await AsyncStorage.getItem(destino);
    if (!MODO_LOCAL && DATOS_PERSONALES.has(clave) && cuenta !== accesoCatalogo) return null;
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export async function cargarRadar({ soloCache = false } = {}) {
  if (MODO_LOCAL) {
    /* En modo interno el fixture validado es la autoridad. Una caché de una
       versión anterior podría no traer el overlay y reactivar claims que el
       barrido actual contradice, así que nunca se usa para saltarse la
       validación aunque el llamador pida `soloCache`. */
    const datos = validarRadarLocal(escaparateLocal().plataformas);
    try {
      await guardar(CACHE_RADAR, datos);
      await AsyncStorage.setItem(CACHE_FECHA, new Date().toISOString());
    } catch {}
    return { datos, deCache: false, local: true, error: null };
  }
  const catalogo = await cargarCatalogoRemoto({ soloCache });
  return { ...catalogo, datos: catalogo.plataformas };
}

export async function cargarFuera({ soloCache = false } = {}) {
  if (!MODO_LOCAL && !accesoCatalogo) return { datos: [], deCache: false, error: 'Entra para consultar el catálogo' };
  const cacheado = await leer(CACHE_FUERA);
  if (MODO_LOCAL) {
    const datos = escaparateLocal().descartes || [];
    if (soloCache && cacheado) return { datos: cacheado, deCache: true, local: true, error: null };
    try { await guardar(CACHE_FUERA, datos); } catch {}
    return { datos, deCache: false, local: true, error: null };
  }
  try {
    const sb = await accesoCatalogo.obtenerCliente();
    const { data } = await sb
      .from('plataformas')
      .select('slug,nombre,etiqueta_descarte,motivo_descarte,fuentes(url,titulo)')
      .eq('estado', 'descartada')
      .order('nombre')
      .throwOnError();
    try { await guardar(CACHE_FUERA, data || []); } catch {}
    return { datos: data || [], deCache: false, error: null };
  } catch (error) {
    return { datos: cacheado || [], deCache: true, error: error?.message || 'sin conexión' };
  }
}

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function normalizarMetricas(metricas) {
  return (Array.isArray(metricas) ? metricas : [])
    .map((metrica, indice) => ({
      etiqueta: texto(metrica?.etiqueta) || `Dato ${indice + 1}`,
      valor: texto(metrica?.valor),
    }))
    .filter((metrica) => metrica.valor);
}

export function normalizarOferta(oferta, tipoForzado = null) {
  const tipo = tipoForzado || texto(oferta?.tipo) || 'rendimiento';
  const diasCrudos = oferta?.vigenciaDias;
  const diasValidos = diasCrudos !== null && diasCrudos !== undefined && diasCrudos !== '' &&
    Number.isFinite(Number(diasCrudos));
  return {
    ...oferta,
    slug: texto(oferta?.slug),
    tipo,
    titulo: texto(oferta?.titulo),
    plataformaSlug: texto(oferta?.plataformaSlug),
    plataformaNombre: texto(oferta?.plataformaNombre),
    categoria: texto(oferta?.categoria),
    pais: texto(oferta?.pais),
    resumen: texto(oferta?.resumen),
    url: texto(oferta?.url),
    urlMercado: texto(oferta?.urlMercado),
    imagen: texto(oferta?.imagen),
    imagenAlt: texto(oferta?.imagenAlt) || `Imagen de ${texto(oferta?.titulo)}`,
    verificadaEl: texto(oferta?.verificadaEl),
    vigenciaDias: diasValidos ? Math.max(0, Number(diasCrudos)) : null,
    permanente: oferta?.permanente === true,
    disponibleEs: oferta?.disponibleEs === true ? true : oferta?.disponibleEs === false ? false : null,
    patrocinada: oferta?.patrocinada === true,
    metricas: normalizarMetricas(oferta?.metricas),
    avisos: (Array.isArray(oferta?.avisos) ? oferta.avisos : [])
      .map((aviso) => ({ texto: texto(aviso?.texto), tono: texto(aviso?.tono) || 'neutro' }))
      .filter((aviso) => aviso.texto),
  };
}

export function proveedoresDeOfertas(ofertas) {
  const porSlug = new Map();
  for (const oferta of Array.isArray(ofertas) ? ofertas : []) {
    const slug = texto(oferta?.plataformaSlug);
    if (!slug) continue;
    const completo = texto(oferta?.plataformaNombre) || slug;
    const nombre = completo.split(/\s+·\s+/)[0].trim() || completo;
    const anterior = porSlug.get(slug);
    if (!anterior || nombre.length < anterior.nombre.length) porSlug.set(slug, { slug, nombre });
  }
  return [...porSlug.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

/* Hasta cuándo valen las cifras, en días enteros, como la web
   (estadoVigenciaLocal, LISTA-FINAL fila 14, 04/11/2026). */
function etiquetaValidez(dias) {
  return dias === 0 ? 'Cifras válidas hasta hoy' : `Cifras válidas ${dias} ${dias === 1 ? 'día' : 'días'} más`;
}

export function vigenciaOferta(oferta, ahora = new Date()) {
  if (oferta?.coleccion === 'secundario' || oferta?.coleccion === 'en_camino') {
    return { estado: 'documental', etiqueta: oferta.coleccion === 'en_camino'
      ? 'Anunciada · sin confirmar que abra'
      : 'Reventa · sin confirmar que se pueda operar', venceEl: null, dias: null };
  }
  if (oferta?.estadoRevision === 'no_verificable') {
    return {
      estado: 'bloqueada', etiqueta: 'Apertura no confirmada', venceEl: null, dias: null,
    };
  }
  if (oferta?.estadoRevision === 'fuentes_en_conflicto') {
    return {
      estado: 'conflicto', etiqueta: 'Fuentes oficiales en conflicto', venceEl: null, dias: null,
    };
  }
  const revision = revisionTemporalOferta(oferta, ahora);
  if (!revision) {
    return oferta?.permanente
      ? { estado: 'permanente-sin-fecha', etiqueta: 'Cifras sin fecha válida', venceEl: null, dias: null }
      : { estado: 'sin-fecha', etiqueta: 'Cifras sin fecha válida', venceEl: null, dias: null };
  }
  const { dias, venceEl } = revision;
  const vencida = dias < 0;
  if (oferta?.permanente) {
    if (vencida) {
      return {
        estado: 'permanente-vencida', etiqueta: 'Cifras por actualizar',
        venceEl, dias,
      };
    }
    if (dias <= 7) {
      return {
        estado: 'permanente-proxima',
        etiqueta: etiquetaValidez(dias),
        venceEl, dias,
      };
    }
    return {
      estado: 'permanente-vigente', etiqueta: etiquetaValidez(dias),
      venceEl, dias,
    };
  }
  if (vencida) {
    return { estado: 'vencida', etiqueta: 'Cifras por actualizar', venceEl, dias };
  }
  if (dias <= 7) {
    return {
      estado: 'proxima',
      etiqueta: etiquetaValidez(dias),
      venceEl, dias,
    };
  }
  return { estado: 'vigente', etiqueta: etiquetaValidez(dias), venceEl, dias };
}

export function textoBusquedaOferta(oferta) {
  oferta = ofertaConCifrasVigentes(oferta);
  const vigencia = vigenciaOferta(oferta);
  return [
    oferta?.titulo, oferta?.plataformaNombre, oferta?.categoria, oferta?.pais,
    oferta?.resumen, oferta?.tipo, vigencia.etiqueta, vigencia.estado,
    oferta?.rentabilidad?.mostrada, oferta?.rentabilidad?.literal,
    oferta?.precio?.mostrado, oferta?.precio?.unidad,
    ...(oferta?.metricas || []).flatMap((metrica) => [metrica.etiqueta, metrica.valor]),
    ...(oferta?.avisos || []).flatMap((aviso) => [aviso.texto, aviso.tono]),
  ].filter(Boolean).join(' ').toLocaleLowerCase('es');
}

async function cargarColeccionLocal(campo, clave, tipoForzado = null, { soloCache = false } = {}) {
  exigirModoLocal();
  // El fixture de esta versión manda también al pedir soloCache. Una copia de
  // agosto no puede ocultar la revalidación o reintroducir condiciones retiradas.
  const crudos = escaparateLocal()[campo];
  const datos = (Array.isArray(crudos) ? crudos : []).map((item) => normalizarOferta(item, tipoForzado));
  try { await guardar(clave, datos); } catch {}
  return { datos, deCache: false, local: true, error: null };
}

export async function cargarOfertas(opciones = {}) {
  if (!MODO_LOCAL) {
    const catalogo = await cargarCatalogoRemoto(opciones);
    return { ...catalogo, datos: catalogo.ofertas };
  }
  return cargarColeccionLocal('ofertas', CACHE_OFERTAS, null, opciones);
}

export function cargarSecundario(opciones = {}) {
  return cargarColeccionLocal('secundario', CACHE_SECUNDARIO, 'secundario', opciones);
}

export async function cargarExclusiones({ soloCache = false } = {}) {
  exigirModoLocal();
  const cacheado = await leer(CACHE_EXCLUSIONES);
  if (soloCache && cacheado) return { datos: cacheado, deCache: true, local: true, error: null };
  const datos = escaparateLocal().exclusionesOfertas || [];
  try { await guardar(CACHE_EXCLUSIONES, datos); } catch {}
  return { datos, deCache: false, local: true, error: null };
}

/* ---------------------------------------------------------------------
   Lista de seguimiento
   --------------------------------------------------------------------- */
export async function siguiendo() {
  return (await leer(CACHE_SIGO)) || [];
}

async function aseguraDispositivo(sb, id) {
  const sistema = ['ios', 'android', 'web'].includes(Platform.OS) ? Platform.OS : 'web';
  await sb
    .from('dispositivos')
    .upsert({ instalacion: id, sistema, visto_el: new Date().toISOString() }, { onConflict: 'instalacion' })
    .throwOnError();
}

async function aplicarSeguimientoRemoto(operacion) {
  if (USUARIO_LOCAL) throw new Error('Los servicios remotos de usuario están desactivados');
  const { clienteDispositivo, idInstalacion } = supabaseRemoto();
  const sb = await clienteDispositivo();
  const id = await idInstalacion();
  await aseguraDispositivo(sb, id);

  /* La lectura previa hace idempotente un reintento si la red se cortó justo
     después de que el servidor aceptara la escritura anterior. */
  const { data: existente } = await sb
    .from('seguimiento')
    .select('plataforma_id')
    .eq('instalacion', id)
    .eq('plataforma_id', operacion.plataformaId)
    .maybeSingle()
    .throwOnError();

  if (operacion.seguir && !existente) {
    await sb
      .from('seguimiento')
      .insert({ instalacion: id, plataforma_id: operacion.plataformaId })
      .throwOnError();
  } else if (!operacion.seguir && existente) {
    await sb
      .from('seguimiento')
      .delete()
      .eq('instalacion', id)
      .eq('plataforma_id', operacion.plataformaId)
      .throwOnError();
  }
}

async function quitarPendiente(slug) {
  const pendientes = (await leer(CACHE_PENDIENTES)) || [];
  await guardar(CACHE_PENDIENTES, pendientes.filter((p) => p.slug !== slug));
}

export async function alternarSeguimiento(slug, plataformaId) {
  if (!slug || !plataformaId) throw new Error('La plataforma no tiene un identificador válido');

  const cuenta = accesoCatalogo;
  const actual = await siguiendo();
  if (!MODO_LOCAL && (!cuenta || cuenta !== accesoCatalogo)) throw new Error('La cuenta ha cambiado');
  const seguir = !actual.includes(slug);
  const nuevo = seguir ? [...actual, slug] : actual.filter((s) => s !== slug);

  if (USUARIO_LOCAL) {
    await guardar(CACHE_SIGO, nuevo);
    return { lista: nuevo, sincronizado: true, local: true, error: null };
  }

  const pendientes = ((await leer(CACHE_PENDIENTES)) || []).filter((p) => p.slug !== slug);
  const operacion = { slug, plataformaId, seguir };

  /* La lista local y el reintento durable cambian juntos. La interfaz puede
     funcionar sin red, pero nunca presenta el servidor como sincronizado si
     Supabase rechazó o no confirmó la operación. */
  await AsyncStorage.multiSet([
    [claveAlmacenamiento(CACHE_SIGO), JSON.stringify(nuevo)],
    [claveAlmacenamiento(CACHE_PENDIENTES), JSON.stringify([...pendientes, operacion])],
  ]);

  try {
    await aplicarSeguimientoRemoto(operacion);
    await quitarPendiente(slug);
    return { lista: nuevo, sincronizado: true, error: null };
  } catch (error) {
    return {
      lista: nuevo,
      sincronizado: false,
      error: error?.message || 'no se pudo sincronizar',
    };
  }
}

export async function sincronizarSeguimientoPendiente() {
  if (USUARIO_LOCAL) return { sincronizados: 0, pendientes: 0, errores: [], local: true };
  const pendientes = (await leer(CACHE_PENDIENTES)) || [];
  if (!pendientes.length) return { sincronizados: 0, pendientes: 0, errores: [] };

  const fallidos = [];
  let sincronizados = 0;
  for (const operacion of pendientes) {
    try {
      await aplicarSeguimientoRemoto(operacion);
      sincronizados += 1;
    } catch (error) {
      fallidos.push({ ...operacion, error: error?.message || 'no se pudo sincronizar' });
    }
  }

  await guardar(
    CACHE_PENDIENTES,
    fallidos.map(({ error: _error, ...operacion }) => operacion)
  );
  return { sincronizados, pendientes: fallidos.length, errores: fallidos.map((p) => p.error) };
}

/* Borrado remoto primero: si Supabase falla, se conserva la identidad local
   para poder reintentar y no dejar una fila remota inaccesible. El token de
   avisos de este móvil sigue la misma regla, pero sin bloquear el borrado:
   ver clavesPushQuitadas. */
export async function borrarDatosDispositivo({ plazoQuitarPush = PLAZO_QUITAR_PUSH, fetchSinCuenta } = {}) {
  const todas = await AsyncStorage.getAllKeys();
  const quitados = [];
  const clavesCuenta = [...clavesPrivadasDispositivo(todas), ...await clavesPushQuitadas(todas, plazoQuitarPush, quitados),
    ...await claveSinCuentaQuitada(todas, plazoQuitarPush, fetchSinCuenta)];
  if (USUARIO_LOCAL) {
    await AsyncStorage.multiRemove([...CLAVES_LOCALES, ...clavesCuenta]);
    await requitarPushTrasBorrar(quitados, plazoQuitarPush);
    lectorCatalogo = null;
    return { ok: true, local: true };
  }
  const { borrarIdInstalacionLocal, clienteDispositivo, idInstalacionExistente } = supabaseRemoto();
  const instalacion = await idInstalacionExistente();
  if (instalacion) {
    const sb = await clienteDispositivo({ crear: false });
    if (!sb) throw new Error('No se pudo abrir la identidad de esta instalación');
    await sb
      .from('dispositivos')
      .delete()
      .eq('instalacion', instalacion)
      .throwOnError();
  }

  await borrarIdInstalacionLocal();
  await AsyncStorage.multiRemove([...CLAVES_LOCALES, ...clavesCuenta]);
  await requitarPushTrasBorrar(quitados, plazoQuitarPush);
  lectorCatalogo = null;
  return { ok: true };
}

/* Segunda pasada, ya sin la clave local: si una renovación diaria en curso
   volvió a registrar el token entre la primera retirada y el borrado de la
   clave, aquí se quita (quitar_aviso_push no falla si ya no estaba). Nunca
   bloquea ni hace fallar el borrado. */
async function requitarPushTrasBorrar(quitados, plazo) {
  for (const { usuarioId, token } of quitados) {
    const acceso = accesoCatalogo;
    if (!acceso || acceso.usuarioId !== usuarioId) continue;
    try {
      await conPlazo((async () => {
        const cliente = await acceso.obtenerCliente();
        if (accesoCatalogo !== acceso) throw new Error('La cuenta ha cambiado');
        await quitarPushConCliente(cliente, token);
      })(), plazo);
    } catch { /* La limpieza de 180 días de la base hace el resto. */ }
  }
}

/* Ofertas guardadas: como los favoritos, solo en este dispositivo y por
   slug público. Guardar una oferta no es invertir ni avisa de nada. */
const MAX_GUARDADAS = 200;
const limpiarGuardadas = (lista) => (Array.isArray(lista)
  ? [...new Set(lista.filter((s) => typeof s === 'string' && s.length > 0 && s.length <= 160))].slice(0, MAX_GUARDADAS)
  : []);

export async function ofertasGuardadas() {
  try {
    return limpiarGuardadas(await leer(OFERTAS_GUARDADAS));
  } catch {
    return [];
  }
}

export async function alternarOfertaGuardada(slug) {
  if (typeof slug !== 'string' || !slug) throw new Error('La oferta no tiene un identificador válido');
  const cuenta = accesoCatalogo;
  const actual = await ofertasGuardadas();
  if (!MODO_LOCAL && (!cuenta || cuenta !== accesoCatalogo)) throw new Error('La cuenta ha cambiado');
  const nueva = actual.includes(slug)
    ? actual.filter((s) => s !== slug)
    : [slug, ...actual].slice(0, MAX_GUARDADAS);
  await guardar(OFERTAS_GUARDADAS, nueva);
  return nueva;
}

/* Progreso de la Academy: solo en este dispositivo y borrado junto con el
   resto de datos locales. Un fallo de lectura devuelve un progreso vacío:
   la Academy se lee igual aunque no se pueda recordar nada. */
export async function leerProgresoAcademy(slugsValidos = null) {
  try {
    const cuenta = accesoCatalogo, destino = claveAlmacenamiento(PROGRESO_ACADEMY);
    if (!destino) return progresoVacio();
    const guardado = await AsyncStorage.getItem(destino);
    if (!MODO_LOCAL && cuenta !== accesoCatalogo) return progresoVacio();
    return normalizarProgreso(guardado ? JSON.parse(guardado) : null, slugsValidos);
  } catch {
    return progresoVacio();
  }
}

export async function guardarProgresoAcademy(progreso) {
  const limpio = normalizarProgreso(progreso);
  await guardar(PROGRESO_ACADEMY, limpio);
  return limpio;
}

/* Qué versión de las novedades de RWAdar se ha visto aquí. { ok: true,
   version } con la versión o null si no hay ninguna; { ok: false } si no se
   pudo leer: entonces la ventana no sale sola (para no repetirla en cada
   arranque) y sigue en Perfil. */
export async function leerNovedadesVistas() {
  try {
    const version = await AsyncStorage.getItem(NOVEDADES_VISTAS);
    if (versionValida(version)) return { ok: true, version };
    // Sin la v2, la v1 de una versión anterior de la app (ver arriba).
    const antigua = await AsyncStorage.getItem(NOVEDADES_VISTAS_V1);
    if (!versionValida(antigua)) return { ok: true, version: null };
    return { ok: true, version: compararVersiones(antigua, V1_DESDE_RECUADRO) >= 0 ? V1_ANTES_DEL_RECUADRO : antigua };
  } catch {
    return { ok: false, version: null };
  }
}

/* Guarda la versión vista, sin bajar nunca a una anterior (la copia incluida
   en la app puede ser más vieja que la descargada). Nunca lanza. */
export async function marcarNovedadesVistas(version) {
  if (!versionValida(version)) return false;
  const subir = async (clave) => {
    const actual = await AsyncStorage.getItem(clave);
    if (versionValida(actual) && compararVersiones(actual, version) >= 0) return;
    await AsyncStorage.setItem(clave, version);
  };
  try {
    await subir(NOVEDADES_VISTAS);
  } catch {
    return false;
  }
  // La copia en la v1, para una vuelta atrás; si falla, lo que manda es la v2.
  try { await subir(NOVEDADES_VISTAS_V1); } catch { /* nada */ }
  return true;
}

/* Avisos de novedades: qué avisos de Inicio has leído, el identificador de
   entrega de este móvil y el día en que se renovó por última vez. Solo en el
   dispositivo y por cuenta, bajo rwadar.editorial.avisos.*:<UUID>; «Borrar
   datos del dispositivo» los elimina con el resto (el identificador, solo
   después de quitarlo de la base). El identificador no se escribe en
   registros ni sale de aquí salvo hacia las funciones de avisos de la
   propia cuenta. */
const AVISOS_LEIDOS = `${PREFIJO}avisos.leidos.v1`;
const AVISOS_PUSH = `${PREFIJO}avisos.push.v1`;
const AVISOS_RENOVADO = `${PREFIJO}avisos.renovado.v1`;
const ID_AVISO = /^(?:bienvenida|[1-9]\d{0,18})$/;
const TOKEN_PUSH = /^Expo(nent)?PushToken\[[A-Za-z0-9_-]{16,64}\]$/;
const DIA = /^\d{4}-\d{2}-\d{2}$/;
const UUID_CUENTA = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_AVISOS_LEIDOS = 100;
// Como al cerrar sesión (PLAZO_ANTES_DE_SALIR de lib/cuentas.js).
const PLAZO_QUITAR_PUSH = 4000;
function claveAvisosCuenta(base, usuarioId) {
  if (MODO_LOCAL || typeof usuarioId !== 'string' || !UUID_CUENTA.test(usuarioId)) return null;
  return `${base}:${usuarioId}`;
}
const limpiarLeidos = (lista) => (Array.isArray(lista)
  ? [...new Set(lista.filter((id) => typeof id === 'string' && ID_AVISO.test(id)))].slice(0, MAX_AVISOS_LEIDOS)
  : []);

export async function avisosLeidos(usuarioId) {
  try {
    const clave = claveAvisosCuenta(AVISOS_LEIDOS, usuarioId);
    if (!clave) return [];
    const guardado = await AsyncStorage.getItem(clave);
    return limpiarLeidos(guardado ? JSON.parse(guardado) : []);
  } catch {
    return [];
  }
}

export async function marcarAvisosLeidos(usuarioId, ids) {
  const clave = claveAvisosCuenta(AVISOS_LEIDOS, usuarioId);
  if (!clave) throw new Error('Entra para guardar tus datos');
  const lista = limpiarLeidos([...limpiarLeidos(ids), ...await avisosLeidos(usuarioId)]);
  await AsyncStorage.setItem(clave, JSON.stringify(lista));
  return lista;
}

export async function tokenPushNovedades(usuarioId) {
  try {
    const clave = claveAvisosCuenta(AVISOS_PUSH, usuarioId);
    if (!clave) return null;
    const token = await AsyncStorage.getItem(clave);
    return typeof token === 'string' && TOKEN_PUSH.test(token) ? token : null;
  } catch {
    return null;
  }
}

export async function guardarTokenPushNovedades(usuarioId, token) {
  const clave = claveAvisosCuenta(AVISOS_PUSH, usuarioId);
  if (!clave || typeof token !== 'string' || !TOKEN_PUSH.test(token)) throw new Error('Identificador de avisos no válido');
  await AsyncStorage.setItem(clave, token);
}

export async function borrarTokenPushNovedades(usuarioId) {
  const clave = claveAvisosCuenta(AVISOS_PUSH, usuarioId);
  if (clave) await AsyncStorage.removeItem(clave);
}

// Día (AAAA-MM-DD, UTC) de la última renovación del registro de este móvil.
export async function renovacionPushNovedades(usuarioId) {
  try {
    const clave = claveAvisosCuenta(AVISOS_RENOVADO, usuarioId);
    if (!clave) return null;
    const dia = await AsyncStorage.getItem(clave);
    return typeof dia === 'string' && DIA.test(dia) ? dia : null;
  } catch {
    return null;
  }
}

export async function marcarRenovacionPushNovedades(usuarioId, dia) {
  const clave = claveAvisosCuenta(AVISOS_RENOVADO, usuarioId);
  if (!clave || typeof dia !== 'string' || !DIA.test(dia)) throw new Error('Fecha de renovación no válida');
  await AsyncStorage.setItem(clave, dia);
}

function conPlazo(promesa, ms) {
  let reloj;
  return Promise.race([promesa, new Promise((_, rechazar) => {
    reloj = setTimeout(() => rechazar(new Error('plazo')), ms);
  })]).finally(() => clearTimeout(reloj));
}

/* «Borrar datos del dispositivo» no deja este móvil apuntado a las
   notificaciones sin saberlo: con la cuenta abierta, quita antes su token de
   la base, como al desactivarlas. Devuelve las claves de token que ya se
   pueden borrar: las quitadas de la base y las que no guardan un token
   válido. Si no se puede quitar (sin conexión, sesión caducada, plazo
   corto vencido, o el token es de otra cuenta de este dispositivo), la
   clave se conserva para reintentarlo al desactivarlas, al cerrar esa
   sesión o al volver a borrar. Nunca bloquea ni hace fallar el borrado. */
async function clavesPushQuitadas(todas, plazo, quitados = []) {
  const prefijo = `${AVISOS_PUSH}:`;
  const quitadas = [];
  for (const clave of todas) {
    if (typeof clave !== 'string' || !clave.startsWith(prefijo)) continue;
    const usuarioId = clave.slice(prefijo.length);
    if (!UUID_CUENTA.test(usuarioId)) continue;
    const token = await tokenPushNovedades(usuarioId);
    if (!token) { quitadas.push(clave); continue; }
    const acceso = accesoCatalogo;
    if (!acceso || acceso.usuarioId !== usuarioId) continue;
    try {
      await conPlazo((async () => {
        const cliente = await acceso.obtenerCliente();
        if (accesoCatalogo !== acceso) throw new Error('La cuenta ha cambiado');
        await quitarPushConCliente(cliente, token);
      })(), plazo);
      quitadas.push(clave);
      quitados.push({ usuarioId, token });
    } catch { /* Se conserva para reintentarlo. */ }
  }
  return quitadas;
}

/* Notificaciones sin cuenta (14/11/2026, lib/avisos-sin-cuenta.js): lo de
   este móvil, sin cuenta y sin UUID (rwadar.editorial.avisos.sin-cuenta.v1):
   el token de Expo, la versión y el idioma del texto aceptado, dónde se
   activaron y el día de la última renovación. Solo en el dispositivo. No va
   en clavesPrivadasDispositivo (lib/acceso-obligatorio.js): «Borrar datos
   del dispositivo» lo quita solo después de darlo de baja en el servidor
   (claveSinCuentaQuitada). */
const AVISOS_SIN_CUENTA = `${PREFIJO}avisos.sin-cuenta.v1`;
export const CLAVE_AVISOS_SIN_CUENTA = AVISOS_SIN_CUENTA;
export async function avisosSinCuenta() {
  try {
    const guardado = await AsyncStorage.getItem(AVISOS_SIN_CUENTA);
    return guardado ? validarGuardado(JSON.parse(guardado)) : null;
  } catch {
    return null;
  }
}
export async function guardarAvisosSinCuenta(datos) {
  const limpio = validarGuardado(datos);
  if (MODO_LOCAL || !limpio) throw new Error('Datos de avisos no válidos');
  await AsyncStorage.setItem(AVISOS_SIN_CUENTA, JSON.stringify(limpio));
}
export async function borrarAvisosSinCuenta() {
  await AsyncStorage.removeItem(AVISOS_SIN_CUENTA);
}
/* «Borrar datos del dispositivo»: primero la baja (con plazo corto) y,
   confirmada, la clave. Sin conexión, la clave se conserva para reintentarlo
   al desactivarlas o al volver a borrar; nunca bloquea ni hace fallar el borrado. */
async function claveSinCuentaQuitada(todas, plazo, fetchImpl) {
  if (!todas.includes(AVISOS_SIN_CUENTA)) return [];
  const guardado = await avisosSinCuenta();
  if (!guardado) return [AVISOS_SIN_CUENTA];
  const ok = await bajaSinCuenta(guardado.token, { plazoMs: plazo, ...(fetchImpl ? { fetchImpl } : {}) });
  return ok ? [AVISOS_SIN_CUENTA] : [];
}

export async function novedades(slugs) {
  if (!slugs.length) return { datos: [], error: null };
  if (USUARIO_LOCAL) return { datos: [], local: true, error: null };
  try {
    const { clientePublico } = supabaseRemoto();
    const sb = clientePublico();
    const { data } = await sb
      .from('cambios_estado')
      .select('id,titular,detalle,ocurrido_el,plataformas(slug,nombre)')
      .order('ocurrido_el', { ascending: false })
      .limit(30)
      .throwOnError();
    return {
      datos: (data || []).filter((c) => c.plataformas && slugs.includes(c.plataformas.slug)),
      error: null,
    };
  } catch (error) {
    return { datos: [], error: error?.message || 'no se pudieron consultar las novedades' };
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { exigirModoLocal, MODO_LOCAL, SERVICIOS_USUARIO_REMOTOS } from './modo-local';
import { validarRadarLocal, revisionTemporalOferta, ofertaConCifrasVigentes } from './verificacion-local';
import { CACHE_CATALOGO, crearLectorCatalogo } from './catalogo-remoto';
import { normalizarProgreso, progresoVacio } from './academy-progreso';

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
const CLAVES_LOCALES = [
  CACHE_RADAR, CACHE_FUERA, CACHE_OFERTAS, CACHE_SECUNDARIO,
  CACHE_EXCLUSIONES, CACHE_FECHA, CACHE_SIGO, CACHE_PENDIENTES, PROGRESO_ACADEMY,
];
if (!MODO_LOCAL) CLAVES_LOCALES.push(CACHE_CATALOGO, 'rwadar.cache.catalogo.v1');

let lectorCatalogo = null;
function cargarCatalogoRemoto(opciones) {
  if (MODO_LOCAL) throw new Error('El catálogo remoto está bloqueado en modo local');
  if (!lectorCatalogo) lectorCatalogo = crearLectorCatalogo({
    almacenamiento: AsyncStorage,
    clientePublico: () => supabaseRemoto().clientePublico(),
  });
  return lectorCatalogo.cargar(opciones);
}

export async function cargarCatalogo(opciones = {}) {
  if (!MODO_LOCAL) return cargarCatalogoRemoto(opciones);
  const [radar, ofertas] = await Promise.all([cargarRadar(opciones), cargarOfertas(opciones)]);
  return { plataformas: radar.datos, ofertas: ofertas.datos, deCache: false,
    local: true, error: radar.error || ofertas.error };
}

export const CLAVES_MODO_LOCAL = Object.freeze({
  radar: 'rwadar.local.cache.radar',
  fuera: 'rwadar.local.cache.fuera',
  ofertas: 'rwadar.local.cache.ofertas',
  secundario: 'rwadar.local.cache.secundario',
  exclusiones: 'rwadar.local.cache.exclusiones',
  fecha: 'rwadar.local.cache.fecha',
  siguiendo: 'rwadar.local.siguiendo',
  pendientes: 'rwadar.local.seguimiento.pendiente',
});

/* ---------------------------------------------------------------------
   Consulta sin conexión
   --------------------------------------------------------------------- */
async function guardar(clave, datos) {
  await AsyncStorage.setItem(clave, JSON.stringify(datos));
}

async function leer(clave) {
  try {
    const s = await AsyncStorage.getItem(clave);
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
  const cacheado = await leer(CACHE_FUERA);
  if (MODO_LOCAL) {
    const datos = escaparateLocal().descartes || [];
    if (soloCache && cacheado) return { datos: cacheado, deCache: true, local: true, error: null };
    try { await guardar(CACHE_FUERA, datos); } catch {}
    return { datos, deCache: false, local: true, error: null };
  }
  try {
    const { clientePublico } = supabaseRemoto();
    const sb = clientePublico();
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

export function vigenciaOferta(oferta, ahora = new Date()) {
  if (oferta?.coleccion === 'secundario' || oferta?.coleccion === 'en_camino') {
    return { estado: 'documental', etiqueta: oferta.coleccion === 'en_camino'
      ? 'Anuncio documentado · apertura no confirmada'
      : 'Referencia documental · liquidez no confirmada', venceEl: null, dias: null };
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
        etiqueta: dias === 0 ? 'Cifras vigentes hasta hoy' : `Cifras vigentes ${dias} d`,
        venceEl, dias,
      };
    }
    return {
      estado: 'permanente-vigente', etiqueta: `Cifras vigentes ${dias} d`,
      venceEl, dias,
    };
  }
  if (vencida) {
    return { estado: 'vencida', etiqueta: 'Cifras por actualizar', venceEl, dias };
  }
  if (dias <= 7) {
    return {
      estado: 'proxima',
      etiqueta: dias === 0 ? 'Cifras vigentes hasta hoy' : `Cifras vigentes ${dias} d`,
      venceEl, dias,
    };
  }
  return { estado: 'vigente', etiqueta: `Cifras vigentes ${dias} d`, venceEl, dias };
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

export async function fechaSincronizacion() {
  return AsyncStorage.getItem(CACHE_FECHA);
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

  const actual = await siguiendo();
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
    [CACHE_SIGO, JSON.stringify(nuevo)],
    [CACHE_PENDIENTES, JSON.stringify([...pendientes, operacion])],
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
   para poder reintentar y no dejar una fila remota inaccesible. */
export async function borrarDatosDispositivo() {
  if (USUARIO_LOCAL) {
    await AsyncStorage.multiRemove(CLAVES_LOCALES);
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
  await AsyncStorage.multiRemove(CLAVES_LOCALES);
  return { ok: true };
}

/* Progreso de la Academy: solo en este dispositivo y borrado junto con el
   resto de datos locales. Un fallo de lectura devuelve un progreso vacío:
   la Academy se lee igual aunque no se pueda recordar nada. */
export async function leerProgresoAcademy(slugsValidos = null) {
  try {
    const guardado = await AsyncStorage.getItem(PROGRESO_ACADEMY);
    return normalizarProgreso(guardado ? JSON.parse(guardado) : null, slugsValidos);
  } catch {
    return progresoVacio();
  }
}

export async function guardarProgresoAcademy(progreso) {
  const limpio = normalizarProgreso(progreso);
  await AsyncStorage.setItem(PROGRESO_ACADEMY, JSON.stringify(limpio));
  return limpio;
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

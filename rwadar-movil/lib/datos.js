import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  borrarIdInstalacionLocal, clienteDispositivo, clientePublico,
  idInstalacion, idInstalacionExistente,
} from './supabase';

const CACHE_RADAR = 'rwadar.cache.radar';
const CACHE_FUERA = 'rwadar.cache.fuera';
const CACHE_FECHA = 'rwadar.cache.fecha';
const CACHE_SIGO = 'rwadar.siguiendo';
const CACHE_PENDIENTES = 'rwadar.seguimiento.pendiente';
const CLAVES_LOCALES = [CACHE_RADAR, CACHE_FUERA, CACHE_FECHA, CACHE_SIGO, CACHE_PENDIENTES];

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
  const cacheado = await leer(CACHE_RADAR);
  if (soloCache) return { datos: cacheado || [], deCache: true, error: null };

  try {
    const sb = clientePublico();
    const { data } = await sb.from('radar_publico').select('*').throwOnError();
    try {
      await guardar(CACHE_RADAR, data || []);
      await AsyncStorage.setItem(CACHE_FECHA, new Date().toISOString());
    } catch {
      /* La respuesta remota sigue siendo válida aunque falle la caché local. */
    }
    return { datos: data || [], deCache: false, error: null };
  } catch (error) {
    return { datos: cacheado || [], deCache: true, error: error?.message || 'sin conexión' };
  }
}

export async function cargarFuera() {
  const cacheado = await leer(CACHE_FUERA);
  try {
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

export async function novedades(slugs) {
  if (!slugs.length) return { datos: [], error: null };
  try {
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

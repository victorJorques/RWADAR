import AsyncStorage from '@react-native-async-storage/async-storage';
import { cliente, idInstalacion } from './supabase';

const CACHE_RADAR = 'rwadar.cache.radar';
const CACHE_FUERA = 'rwadar.cache.fuera';
const CACHE_FECHA = 'rwadar.cache.fecha';

/* ---------------------------------------------------------------------
   Consulta sin conexión
   ---------------------------------------------------------------------
   Un registro de consulta se lee en el metro, en una reunión o en un sitio
   con mala cobertura. Guardamos la última respuesta buena y la servimos al
   instante; si hay red, se refresca por detrás.
   --------------------------------------------------------------------- */
async function guardar(clave, datos) {
  try { await AsyncStorage.setItem(clave, JSON.stringify(datos)); } catch {}
}
async function leer(clave) {
  try {
    const s = await AsyncStorage.getItem(clave);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export async function cargarRadar({ soloCache = false } = {}) {
  const cacheado = await leer(CACHE_RADAR);
  if (soloCache) return { datos: cacheado || [], deCache: true };

  try {
    const sb = await cliente();
    const { data, error } = await sb.from('radar_publico').select('*');
    if (error) throw error;
    await guardar(CACHE_RADAR, data);
    await AsyncStorage.setItem(CACHE_FECHA, new Date().toISOString());
    return { datos: data, deCache: false };
  } catch (e) {
    return { datos: cacheado || [], deCache: true, error: e.message };
  }
}

export async function cargarFuera() {
  const cacheado = await leer(CACHE_FUERA);
  try {
    const sb = await cliente();
    const { data, error } = await sb
      .from('plataformas')
      .select('slug,nombre,etiqueta_descarte,motivo_descarte,fuentes(url,titulo)')
      .eq('estado', 'descartada')
      .order('nombre');
    if (error) throw error;
    await guardar(CACHE_FUERA, data);
    return { datos: data, deCache: false };
  } catch (e) {
    return { datos: cacheado || [], deCache: true, error: e.message };
  }
}

export async function fechaSincronizacion() {
  return AsyncStorage.getItem(CACHE_FECHA);
}

/* ---------------------------------------------------------------------
   Lista de seguimiento
   ---------------------------------------------------------------------
   Se guarda en el móvil para que responda al instante, y se replica en el
   servidor porque es lo que permite avisar cuando una plataforma cae del
   radar. Si no hay red, el cambio local se mantiene igualmente.
   --------------------------------------------------------------------- */
const CACHE_SIGO = 'rwadar.siguiendo';

export async function siguiendo() {
  return (await leer(CACHE_SIGO)) || [];
}

async function aseguraDispositivo(sb, id) {
  const { Platform } = require('react-native');
  /* Se guarda el sistema real. Etiquetar de "android" una sesión de web
     ensuciaría las métricas y el envío de avisos. */
  const sistema = ['ios', 'android', 'web'].includes(Platform.OS) ? Platform.OS : 'web';
  await sb.from('dispositivos').upsert(
    { instalacion: id, sistema },
    { onConflict: 'instalacion' }
  );
}

export async function alternarSeguimiento(slug, plataformaId) {
  const actual = await siguiendo();
  const sigue = actual.includes(slug);
  const nuevo = sigue ? actual.filter((s) => s !== slug) : [...actual, slug];
  await guardar(CACHE_SIGO, nuevo);

  /* El servidor se actualiza si se puede; si falla, la app no se rompe. */
  try {
    const sb = await cliente();
    const id = await idInstalacion();
    await aseguraDispositivo(sb, id);
    if (sigue) {
      await sb.from('seguimiento').delete()
        .eq('instalacion', id).eq('plataforma_id', plataformaId);
    } else {
      await sb.from('seguimiento').insert({ instalacion: id, plataforma_id: plataformaId });
    }
  } catch {}

  return nuevo;
}

/* Novedades de las plataformas que sigo: el motivo de que exista la app. */
export async function novedades(slugs) {
  if (!slugs.length) return [];
  try {
    const sb = await cliente();
    const { data, error } = await sb
      .from('cambios_estado')
      .select('id,titular,detalle,ocurrido_el,plataformas(slug,nombre)')
      .order('ocurrido_el', { ascending: false })
      .limit(30);
    if (error) throw error;
    return (data || []).filter((c) => c.plataformas && slugs.includes(c.plataformas.slug));
  } catch {
    return [];
  }
}

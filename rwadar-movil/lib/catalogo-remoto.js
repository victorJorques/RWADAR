'use strict';

const { validarLotePublico, MAX_VIGENCIA_DIAS, CUENTA_PLATAFORMAS, CUENTA_OFERTAS,
  esFecha } = require('./contrato-catalogo');

// Una sola entrada: nunca combinar el radar antiguo con ofertas de otra revisión.
const CACHE_CATALOGO = 'rwadar.cache.catalogo.v1';
const texto = valor => typeof valor === 'string' ? valor.trim() : '';

function adaptarCatalogo(lote, ahora) {
  if (lote?.version !== 1) throw new Error('Versión de caché de catálogo no válida');
  const revision = validarLotePublico(lote.plataformas, lote.ofertas, { hoy: ahora });
  const plataformas = lote.plataformas.map(p => {
    const url = new URL(p.web);
    if (url.protocol !== 'https:' || url.username || url.password ||
        !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(p.plataforma_id || '')) {
      throw new Error('Identidad o web de plataforma no válida');
    }
    return {
      revisionId: p.revision_id, slug: p.slug, nombre: p.nombre,
      plataforma_id: p.plataforma_id, categoria: texto(p.categoria),
      color: texto(p.color), actor: texto(p.actor), region: texto(p.region),
      cadenas: texto(p.cadenas), ticket: texto(p.ticket), acceso: texto(p.acceso),
      web: p.web, aval: texto(p.aval), nota: texto(p.nota),
      verificada_el: texto(p.verificada_el), verificacionLocal: p.verificacion_local,
    };
  });
  const hoy = ahora.toISOString().slice(0, 10);
  const ofertas = lote.ofertas.map(o => {
    const vence = new Date(Date.parse(`${o.verificada_el}T00:00:00Z`) +
      o.vigencia_dias * 86400000).toISOString().slice(0, 10);
    const vigente = o.estado_revision === 'actual' && hoy <= vence;
    return {
      catalogo: true, revisionId: o.revision_id, slug: o.slug, tipo: o.tipo,
      titulo: o.titulo, plataformaSlug: o.plataforma_slug,
      plataformaNombre: o.plataforma_nombre, categoria: o.categoria,
      pais: texto(o.pais), url: o.url, verificadaEl: o.verificada_el,
      vigenciaDias: o.vigencia_dias, permanente: o.permanente === true,
      estadoRevision: o.estado_revision, fuentesActuales: [...o.fuentes_actuales],
      documentacion: o.documentacion == null ? null : {
        ...o.documentacion, fuentes: [...o.documentacion.fuentes],
        caracteristicas: o.documentacion.caracteristicas.map(c => ({ ...c })),
        referencias: o.documentacion.referencias.map(r => ({ ...r })),
      },
      patrocinada: false, eu: o.eu === true ? true : o.eu === false ? false : null,
      fueraLadrillo: o.fuera_ladrillo === true, avisos: o.avisos,
      cifrasPendientes: !vigente,
      resumen: vigente ? o.resumen : '', metricas: vigente ? o.metricas : [],
      rentabilidad: vigente ? o.rentabilidad : null, precio: vigente ? o.precio : null,
      puntuacion: vigente ? o.puntuacion : null,
      disponibleEs: vigente ? o.disponible_es : null,
    };
  });
  return { plataformas, ofertas, ...revision };
}

function crearLectorCatalogo({ almacenamiento, clientePublico, ahora = () => new Date() }) {
  let enCurso = null;
  let cacheDescartada = false;
  const vacio = error => ({ plataformas: [], ofertas: [], deCache: false,
    error, revisionId: null });
  async function descartarCache() {
    // Si el disco falla tampoco se reutiliza en esta sesión una revisión retirada.
    cacheDescartada = true;
    try { await almacenamiento.removeItem(CACHE_CATALOGO); } catch {}
  }
  async function desdeCache(error = null) {
    if (cacheDescartada) return vacio(error || 'No hay un catálogo vigente guardado');
    try {
      const raw = await almacenamiento.getItem(CACHE_CATALOGO);
      if (!raw) return vacio(error || 'No hay un catálogo vigente guardado');
      return { ...adaptarCatalogo(JSON.parse(raw), ahora()), deCache: true, error };
    } catch {
      await descartarCache();
      return vacio(error || 'La copia guardada está caducada o no es verificable');
    }
  }
  async function desdeRed() {
    let respuestas;
    try {
      const sb = clientePublico();
      const resultados = await Promise.allSettled([
        sb.from('catalogo_plataformas_publicas').select('*').limit(27),
        sb.from('catalogo_ofertas_publicas').select('*').limit(29),
      ]);
      respuestas = resultados.map(r => r.status === 'fulfilled' ? r.value
        : { error: true, status: 0 });
    } catch {
      return desdeCache('No se pudo conectar para actualizar el catálogo');
    }
    const cantidades = [CUENTA_PLATAFORMAS, CUENTA_OFERTAS];
    if (respuestas.some((r, i) => !r?.error &&
        (!Array.isArray(r?.data) || r.data.length !== cantidades[i]))) {
      await descartarCache();
      return vacio('Catálogo incompleto, retirado o pendiente de revisión');
    }
    const fallos = respuestas.filter(r => r?.error);
    if (fallos.length) {
      // Errores de permisos/esquema o HTTP definitivos no son modo sin conexión.
      if (fallos.every(f => !f.status || f.status >= 500)) {
        return desdeCache('No se pudo actualizar el catálogo');
      }
      await descartarCache();
      return vacio('El catálogo no está disponible para consulta pública');
    }
    const lote = { version: 1, plataformas: respuestas[0]?.data, ofertas: respuestas[1]?.data };
    let adaptado;
    try {
      adaptado = adaptarCatalogo(lote, ahora());
    } catch {
      // Incluso un 200 con cero filas significa retirada/no publicable, no usar caché.
      await descartarCache();
      return vacio('Catálogo incompleto, caducado o pendiente de revisión');
    }
    try {
      await almacenamiento.setItem(CACHE_CATALOGO, JSON.stringify(lote));
      cacheDescartada = false;
    } catch {
      // No perder el lote válido recibido ni revivir una copia anterior.
      await descartarCache();
    }
    return { ...adaptado, deCache: false, error: null };
  }
  return {
    async cargar({ soloCache = false } = {}) {
      if (soloCache) return desdeCache();
      if (!enCurso) enCurso = desdeRed().finally(() => { enCurso = null; });
      return enCurso;
    },
  };
}

// Invalida también una app que permanece abierta o vuelve de suspensión.
function vigilarCaducidadCatalogo({ fecha, alCaducar, appState,
  ahora = () => Date.now(), programar = setTimeout, cancelar = clearTimeout }) {
  const inicio = esFecha(fecha) ? Date.parse(`${fecha}T00:00:00Z`) : NaN;
  const vence = inicio + (MAX_VIGENCIA_DIAS + 1) * 86400000;
  let temporizador, cerrada = false;
  const revisar = () => {
    cancelar(temporizador);
    if (cerrada) return;
    const instante = ahora();
    if (!Number.isFinite(instante) || !Number.isFinite(inicio) || instante < inicio || instante >= vence) {
      cerrada = true;
      alCaducar();
      return;
    }
    temporizador = programar(revisar, vence - instante);
  };
  revisar();
  const escucha = appState.addEventListener('change', estado => {
    if (estado === 'active') revisar();
  });
  return () => { cerrada = true; cancelar(temporizador); escucha.remove(); };
}

module.exports = { CACHE_CATALOGO, adaptarCatalogo, crearLectorCatalogo, vigilarCaducidadCatalogo };

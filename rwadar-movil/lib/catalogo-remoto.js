'use strict';

const { validarLotePublico, validarLotePublicoV2, MANIFIESTO_CATALOGO_V2, MAX_VIGENCIA_DIAS,
  LIMITES_CATALOGO_V2, esFecha } = require('./contrato-catalogo');

// Una sola entrada: nunca combinar el radar antiguo con ofertas de otra revisión.
const CACHE_CATALOGO = 'rwadar.cache.catalogo.v2';
const texto = valor => typeof valor === 'string' ? valor.trim() : '';

function adaptarCatalogo(lote, ahora) {
  if (lote?.version !== 1) throw new Error('Versión de caché de catálogo no válida');
  const revision = validarLotePublico(lote.plataformas, lote.ofertas, { hoy: ahora });
  return adaptarFilas(lote, revision, ahora);
}

// El catálogo se publica siempre salvo orden expresa de retirada (Víctor,
// 1/10/2026): un lote completo y vencido se acepta con `caducado: true` y sus
// cifras vencidas se ocultan oferta a oferta en adaptarFilas.
function adaptarCatalogoV2(lote, ahora, { manifiestoMinimo = MANIFIESTO_CATALOGO_V2 } = {}) {
  if (lote?.version !== 2) throw new Error('Versión de caché de catálogo no válida');
  const revision = validarLotePublicoV2(lote.plataformas, lote.ofertas,
    { manifiesto: manifiestoMinimo, hoy: ahora, permitirCaducado: true, permitirAmpliacion: true });
  return adaptarFilas(lote, revision, ahora);
}

function adaptarFilas(lote, revision, ahora) {
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
    const coleccion = lote.version === 2 ? o.coleccion : 'principales';
    const vigente = coleccion === 'principales' && o.estado_revision === 'actual' && hoy <= vence;
    return {
      catalogo: true, revisionId: o.revision_id, slug: o.slug, tipo: o.tipo, coleccion,
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
  let minimoCargado = false;
  let manifiestoMinimo = MANIFIESTO_CATALOGO_V2;
  function conservarMinimo(adaptado) {
    manifiestoMinimo = adaptado.manifiesto;
  }
  async function prepararMinimo() {
    if (minimoCargado) return;
    minimoCargado = true;
    // Una app reiniciada también recuerda el último lote completo. Desde el
    // 02/11/2026 un lote nuevo puede tener menos fichas si es coherente con su
    // propio manifiesto; uno cortado sigue sin aceptarse.
    try {
      const raw = await almacenamiento.getItem(CACHE_CATALOGO);
      if (raw) conservarMinimo(adaptarCatalogoV2(JSON.parse(raw), ahora(), {manifiestoMinimo}));
    } catch { /* Una copia no verificable no cambia el mínimo del binario. */ }
  }
  const vacio = (error, extra = {}) => ({ plataformas: [], ofertas: [], deCache: false,
    error, revisionId: null, ...extra });
  const SIN_COMPROBAR = 'No hemos podido comprobar la revisión más reciente';
  async function descartarCache() {
    // Si el disco falla tampoco se reutiliza en esta sesión una revisión retirada.
    cacheDescartada = true;
    try { await almacenamiento.removeItem(CACHE_CATALOGO); } catch {}
  }
  async function desdeCache(error = null) {
    if (cacheDescartada) return vacio(error || 'No hay un catálogo guardado');
    try {
      const raw = await almacenamiento.getItem(CACHE_CATALOGO);
      if (!raw) return vacio(error || 'No hay un catálogo guardado');
      const adaptado = adaptarCatalogoV2(JSON.parse(raw), ahora(), {manifiestoMinimo});
      conservarMinimo(adaptado);
      return { ...adaptado, deCache: true, error };
    } catch {
      await descartarCache();
      return vacio(error || 'La copia guardada no es verificable');
    }
  }
  async function desdeRed() {
    await prepararMinimo();
    let respuestas;
    try {
      const sb = await clientePublico();
      const resultados = await Promise.allSettled([
        sb.from('catalogo_plataformas_publicas_v2').select('*').limit(LIMITES_CATALOGO_V2.plataformas + 1),
        sb.from('catalogo_ofertas_publicas_v2').select('*').limit(LIMITES_CATALOGO_V2.ofertas + 1),
        sb.from('catalogo_publicacion').select('retirado,motivo').limit(1),
      ]);
      respuestas = resultados.map(r => r.status === 'fulfilled' ? r.value
        : { error: true, status: 0 });
    } catch {
      return desdeCache('No se pudo conectar para actualizar el catálogo');
    }
    // Solo la orden expresa de retirada borra la copia guardada. Si esa
    // consulta falla, o la base aún no tiene la tabla, no es una orden.
    const orden = !respuestas[2]?.error && Array.isArray(respuestas[2]?.data) ? respuestas[2].data[0] : null;
    if (orden?.retirado === true) {
      await descartarCache();
      return vacio('El catálogo se ha retirado temporalmente', { retirado: true });
    }
    // Una vista vacía, incompleta, un error de permisos o un lote que no
    // supera el contrato ya no retiran nada: se conserva la última copia
    // completa guardada y se avisa de que no se pudo comprobar la más reciente.
    const catalogo = respuestas.slice(0, 2);
    if (catalogo.some(r => !r?.error && !Array.isArray(r?.data))) {
      return desdeCache(SIN_COMPROBAR);
    }
    if (catalogo.some(r => r?.error)) {
      return desdeCache(catalogo.every(f => !f?.error || !f.status || f.status >= 500)
        ? 'No se pudo actualizar el catálogo' : SIN_COMPROBAR);
    }
    const lote = { version: 2, plataformas: respuestas[0]?.data, ofertas: respuestas[1]?.data };
    let adaptado;
    try {
      adaptado = adaptarCatalogoV2(lote, ahora(), {manifiestoMinimo});
    } catch {
      return desdeCache(SIN_COMPROBAR);
    }
    conservarMinimo(adaptado);
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
function vigilarCaducidadCatalogo({ fecha, vigenciaDias = MAX_VIGENCIA_DIAS, alCaducar, appState,
  ahora = () => Date.now(), programar = setTimeout, cancelar = clearTimeout }) {
  const inicio = esFecha(fecha) ? Date.parse(`${fecha}T00:00:00Z`) : NaN;
  const plazo = Number.isInteger(vigenciaDias) && vigenciaDias >= 1 && vigenciaDias <= MAX_VIGENCIA_DIAS
    ? vigenciaDias : NaN;
  const vence = inicio + (plazo + 1) * 86400000;
  let temporizador, cerrada = false;
  const revisar = () => {
    cancelar(temporizador);
    if (cerrada) return;
    const instante = ahora();
    if (!Number.isFinite(instante) || !Number.isFinite(inicio) || !Number.isFinite(vence) || instante < inicio || instante >= vence) {
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

// Con el lote ya caducado no hay vencimiento que vigilar, pero las cifras de
// cada oferta siguen venciendo en su propia fecha: se vuelve a cargar al
// cambiar de día (medianoche UTC o al volver a la app otro día).
function programarRevisionDiaria({ alCambiarDia, appState, ahora = () => Date.now(),
  programar = setTimeout, cancelar = clearTimeout }) {
  const dia = instante => new Date(instante).toISOString().slice(0, 10);
  let actual = dia(ahora()), temporizador, cerrada = false;
  const siguiente = () => {
    cancelar(temporizador);
    if (cerrada) return;
    const instante = ahora();
    const medianoche = Date.parse(`${dia(instante)}T00:00:00Z`) + 86400000;
    temporizador = programar(revisar, medianoche - instante + 100);
  };
  const revisar = () => {
    if (cerrada) return;
    const hoy = dia(ahora());
    if (hoy !== actual) { actual = hoy; alCambiarDia(); }
    siguiente();
  };
  siguiente();
  const escucha = appState.addEventListener('change', estado => {
    if (estado === 'active') revisar();
  });
  return () => { cerrada = true; cancelar(temporizador); escucha.remove(); };
}

module.exports = { CACHE_CATALOGO, adaptarCatalogo, adaptarCatalogoV2, crearLectorCatalogo, vigilarCaducidadCatalogo,
  programarRevisionDiaria };

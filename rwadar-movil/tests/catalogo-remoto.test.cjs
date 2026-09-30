const test = require('node:test');
const assert = require('node:assert/strict');
const { CACHE_CATALOGO, adaptarCatalogo, crearLectorCatalogo, vigilarCaducidadCatalogo } = require('../lib/catalogo-remoto');
const contrato = require('../lib/contrato-catalogo');
const fixture = require('../fixtures/escaparate-local.json');

const REVISION = '12345678-1234-4000-8000-123456789012';
const AHORA = new Date('2026-09-27T12:00:00Z');
function lotePrueba(fechaRadar = '2026-09-21') {
  const plataformas = structuredClone(fixture.plataformas).map((p, i) => {
    const v = p.verificacionLocal;
    v.verificadoEl = fechaRadar;
    for (const campo of [v.estadoOperativo, v.licenciaRegistro, v.acceso, ...v.alertasCriticas]) {
      for (const f of campo.fuentes) f.consultadaEl = fechaRadar;
    }
    return { ...p, revision_id: REVISION, verificacion_local: v,
      plataforma_id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}` };
  });
  const ofertas = structuredClone(fixture.ofertas).map(o => ({
    ...o, revision_id: REVISION, plataforma_slug: o.plataformaSlug,
    plataforma_nombre: o.plataformaNombre, verificada_el: o.verificadaEl,
    vigencia_dias: o.vigenciaDias, disponible_es: o.disponibleEs,
    fuera_ladrillo: o.fueraLadrillo, estado_revision: o.estadoRevision,
    fuentes_actuales: o.fuentesActuales, patrocinada: false,
  }));
  return { version: 1, plataformas, ofertas };
}
function entorno({ lote = lotePrueba(), cache, fallo, ahora = AHORA } = {}) {
  const mapa = new Map(cache ? [[CACHE_CATALOGO, JSON.stringify(cache)]] : []);
  const llamadas = [], escrituras = [];
  const almacenamiento = {
    async getItem(k) { return mapa.get(k) || null; },
    async setItem(k, v) { escrituras.push(k); mapa.set(k, v); },
    async removeItem(k) { mapa.delete(k); },
  };
  const estado = { lote, fallo, ahora };
  const lector = crearLectorCatalogo({ almacenamiento, ahora: () => estado.ahora,
    clientePublico: () => ({ from(tabla) {
      llamadas.push(['from', tabla]);
      return { select(columnas) {
        llamadas.push(['select', columnas]);
        return { async limit(n) {
          llamadas.push(['limit', n]);
          if (estado.fallo instanceof Error) throw estado.fallo;
          if (estado.fallo) return { error: { message: 'fallo simulado' }, status: estado.fallo };
          return { data: tabla === 'catalogo_plataformas_publicas'
            ? estado.lote.plataformas : estado.lote.ofertas, error: null, status: 200 };
        } };
      } };
    } }),
  });
  return { lector, mapa, llamadas, escrituras, estado, almacenamiento };
}

test('móvil e importador usan exactamente el mismo contrato de revisión', () => {
  assert.equal(require('../../rwadar-app/catalogo-publico').validarLotePublico,
    contrato.validarLotePublico);
});

test('el lector trae 26/28 por las vistas nuevas y guarda un único lote, sin escrituras de inversión', async () => {
  const e = entorno();
  const r = await e.lector.cargar();
  assert.equal(r.error, null);
  assert.equal(r.revisionId, REVISION);
  assert.equal(r.fecha, '2026-09-21');
  assert.equal(r.plataformas.length, 26);
  assert.equal(r.ofertas.length, 28);
  assert.equal(r.ofertas[0].verificadaEl, '2026-09-27');
  assert.ok(r.plataformas.every(p => p.verificacionLocal.alertasCriticas.length > 0));
  assert.ok(r.ofertas.every(o => !Object.hasOwn(o, 'imagen')));
  assert.deepEqual(e.escrituras, [CACHE_CATALOGO]);
  assert.deepEqual(e.llamadas, [
    ['from', 'catalogo_plataformas_publicas'], ['select', '*'], ['limit', 27],
    ['from', 'catalogo_ofertas_publicas'], ['select', '*'], ['limit', 29],
  ]);
});

test('dos consumidores simultáneos comparten una sola carga', async () => {
  const e = entorno();
  const [uno, dos] = await Promise.all([e.lector.cargar(), e.lector.cargar()]);
  assert.equal(uno, dos);
  assert.equal(e.llamadas.filter(([m]) => m === 'from').length, 2);
});

test('la copia sin conexión conserva el plazo original y no lee cachés antiguas por separado', async () => {
  const e = entorno({ cache: lotePrueba(), fallo: new Error('offline') });
  e.mapa.set('rwadar.cache.radar', '[{"nombre":"dato antiguo"}]');
  const r = await e.lector.cargar();
  assert.equal(r.deCache, true);
  assert.equal(r.ofertas.length, 28);
  assert.equal(r.fecha, '2026-09-21');
  assert.ok(r.error);
  assert.equal(e.escrituras.length, 0);
  e.estado.ahora = new Date('2026-09-29T00:00:00Z');
  const vencida = await e.lector.cargar({ soloCache: true });
  assert.equal(vencida.ofertas.length, 0);
  assert.equal(vencida.plataformas.length, 0);
  assert.equal(e.mapa.has(CACHE_CATALOGO), false);
  assert.equal(e.mapa.has('rwadar.cache.radar'), true);
});

test('cada oferta caduca en UTC incluso dentro de un lote aún vigente y sin red', async () => {
  const lote = lotePrueba('2026-09-27');
  const e = entorno({ cache: lote, ahora: new Date('2026-09-28T23:59:59Z') });
  const original = structuredClone(lote);
  const ultimo = await e.lector.cargar({ soloCache: true });
  assert.ok(ultimo.ofertas.some(o => o.rentabilidad || o.precio));
  e.estado.ahora = new Date('2026-09-29T00:00:00Z');
  const despues = await e.lector.cargar({ soloCache: true });
  assert.equal(despues.plataformas.length, 26);
  assert.ok(despues.ofertas.every(o => !o.precio && !o.rentabilidad && !o.resumen &&
    !o.metricas.length && o.disponibleEs == null && o.puntuacion == null));
  assert.ok(despues.ofertas.every(o => o.fuentesActuales.length && o.avisos.length));
  assert.deepEqual(lote, original);
});

test('el catálogo transporta la documentación fechada sin rescatar cifras vencidas el 30 de septiembre', async () => {
  const lote = lotePrueba('2026-09-28');
  const fuente = 'https://example.test/dato-publicado';
  const documentacion = {
    revisadaEl: '2026-09-30', descripcion: 'Referencia documental de un activo con condiciones publicadas.',
    fuentes: [fuente], caracteristicas: [{ etiqueta: 'Activo', valor: 'Participación inmobiliaria' }],
    referencias: [{ etiqueta: 'Precio publicado', valor: '54,20 CHF', fechaDato: '2026-09-26',
      fechaConsulta: '2026-09-27', fuente, alcance: 'Operación histórica; no equivale a cotización actual.' }],
  };
  lote.ofertas[0].documentacion = documentacion;
  const e = entorno({ lote, ahora: new Date('2026-09-30T12:00:00Z') });
  const resultado = await e.lector.cargar();
  assert.equal(resultado.error, null);
  const oferta = resultado.ofertas[0];
  assert.deepEqual(oferta.documentacion, documentacion);
  assert.notEqual(oferta.documentacion, documentacion);
  assert.notEqual(oferta.documentacion.referencias[0], documentacion.referencias[0]);
  assert.equal(oferta.verificadaEl, '2026-09-27');
  assert.equal(oferta.vigenciaDias, 1);
  assert.equal(oferta.cifrasPendientes, true);
  assert.equal(oferta.precio, null);
  assert.equal(oferta.rentabilidad, null);
  assert.equal(oferta.disponibleEs, null);
  assert.deepEqual(oferta.metricas, []);
  const sinConexion = await e.lector.cargar({ soloCache: true });
  assert.deepEqual(sinConexion.ofertas[0].documentacion, documentacion);
});

test('un 200 vacío, parcial o inválido retira el lote entero, sin rescatar una caché previa', async () => {
  const casos = [
    l => { l.plataformas = []; l.ofertas = []; },
    l => l.plataformas.pop(), l => l.ofertas.pop(),
    l => l.ofertas.push(structuredClone(l.ofertas[0])),
    l => { l.ofertas[1].slug = l.ofertas[0].slug; },
    l => { l.ofertas[0].revision_id = '87654321-1234-4000-8000-123456789012'; },
    l => { delete l.plataformas[0].revision_id; },
    l => { delete l.plataformas[0].verificacion_local; },
    l => { l.plataformas[0].verificacion_local.acceso.fuentes = []; },
    l => { l.plataformas[0].verificacion_local.estadoOperativo.fuentes[0].consultadaEl = '2026-09-27'; },
    l => { l.ofertas[0].verificada_el = '2026-09-28'; },
    l => { l.ofertas[0].verificada_el = '2026-02-30'; },
    l => { l.ofertas[0].verificada_el += 'T00:00:00Z'; },
    l => { l.ofertas[0].vigencia_dias = 8; },
    l => { l.ofertas[0].metricas = ['texto sin estructura']; },
    l => { l.ofertas[0].avisos = [{ texto: {}, tono: 'ok' }]; },
    l => { l.ofertas[0].url = 'https://usuario:secreto@example.test/'; },
    l => { l.ofertas[0].fuentes_actuales = ['javascript:alert(1)']; },
    l => { l.plataformas[0].web = 'http://example.test'; },
    l => { l.plataformas[0].plataforma_id = ''; },
    ...[true, null, undefined, 'false', 0].map(valor => l => { l.ofertas[0].patrocinada = valor; }),
  ];
  for (const cambiar of casos) {
    const lote = lotePrueba(); cambiar(lote);
    const e = entorno({ lote, cache: lotePrueba() });
    const r = await e.lector.cargar();
    assert.ok(r.error, String(cambiar));
    assert.deepEqual(r.plataformas, []);
    assert.deepEqual(r.ofertas, []);
    assert.equal(r.deCache, false);
    assert.equal(e.mapa.has(CACHE_CATALOGO), false);
    e.estado.fallo = new Error('offline');
    assert.equal((await e.lector.cargar()).ofertas.length, 0);
  }
});

test('la copia corrupta, de otra versión o con revisión futura también falla cerrada', async () => {
  for (const cache of [{ version: 0 }, lotePrueba('2026-09-28'), { ...lotePrueba(), ofertas: [] }]) {
    const e = entorno({ cache });
    const r = await e.lector.cargar({ soloCache: true });
    assert.equal(r.ofertas.length, 0);
    assert.equal(e.llamadas.length, 0);
    assert.equal(e.mapa.has(CACHE_CATALOGO), false);
  }
  const e = entorno(); e.mapa.set(CACHE_CATALOGO, '{json roto');
  assert.equal((await e.lector.cargar({ soloCache: true })).plataformas.length, 0);
});

test('permiso o vista retirada no se disfraza de fallo de conexión; un 503 sí admite copia vigente', async () => {
  for (const fallo of [401, 403, 404]) {
    const e = entorno({ fallo, cache: lotePrueba() });
    assert.equal((await e.lector.cargar()).plataformas.length, 0);
    assert.equal(e.mapa.has(CACHE_CATALOGO), false);
  }
  const e = entorno({ fallo: 503, cache: lotePrueba() });
  assert.equal((await e.lector.cargar()).deCache, true);
});

test('un fallo de disco no destruye la respuesta válida ni revive una revisión retirada', async () => {
  const e = entorno({ cache: lotePrueba() });
  e.almacenamiento.setItem = async () => { throw new Error('disco lleno'); };
  e.almacenamiento.removeItem = async () => { throw new Error('disco inaccesible'); };
  assert.equal((await e.lector.cargar()).ofertas.length, 28);
  assert.equal((await e.lector.cargar({ soloCache: true })).ofertas.length, 0);
  e.estado.fallo = new Error('offline');
  assert.equal((await e.lector.cargar()).ofertas.length, 0);
});

test('un 503 en una vista no oculta la denegación de la otra', async () => {
  const e = entorno({ cache: lotePrueba() });
  const lector = crearLectorCatalogo({ almacenamiento: e.almacenamiento, ahora: () => AHORA,
    clientePublico: () => ({ from: tabla => ({ select: () => ({ limit: async () => ({
      error: { message: 'error simulado' },
      status: tabla === 'catalogo_plataformas_publicas' ? 503 : 403,
    }) }) }) }),
  });
  assert.equal((await lector.cargar()).ofertas.length, 0);
  assert.equal(e.mapa.has(CACHE_CATALOGO), false);
});

test('una vista vacía retira la caché aunque la otra falle por red', async () => {
  const e = entorno({ cache: lotePrueba() });
  const lector = crearLectorCatalogo({ almacenamiento: e.almacenamiento, ahora: () => AHORA,
    clientePublico: () => ({ from: tabla => ({ select: () => ({ limit: async () => {
      if (tabla === 'catalogo_plataformas_publicas') throw new Error('offline');
      return { data: [], error: null, status: 200 };
    } }) }) }),
  });
  assert.equal((await lector.cargar()).ofertas.length, 0);
  assert.equal(e.mapa.has(CACHE_CATALOGO), false);
});

test('la adaptación no cambia fuentes, fechas, evidencia original ni pertenencia al radar', () => {
  const lote = lotePrueba(); const original = structuredClone(lote);
  const r = adaptarCatalogo(lote, AHORA);
  const slugs = new Set(r.plataformas.map(p => p.slug));
  for (const slug of ['aktionariat', 'alius-capital', 'brickwise', 'prosegur-crypto']) {
    assert.equal(slugs.has(slug), false);
  }
  assert.deepEqual(lote, original);
});

test('una app abierta o suspendida retira el catálogo completo al vencer sin consultar la red', () => {
  for (const evento of ['temporizador', 'reactivacion']) {
    let instante = Date.parse('2026-09-28T23:59:59Z'), temporizador, reactivar, retiradas = 0, limpia = false;
    const detener = vigilarCaducidadCatalogo({ fecha: '2026-09-21', ahora: () => instante,
      alCaducar: () => { retiradas += 1; },
      programar(fn, ms) { assert.equal(ms, 1000); temporizador = fn; return 1; }, cancelar() {},
      appState: { addEventListener(tipo, fn) { assert.equal(tipo, 'change'); reactivar = fn;
        return { remove() { limpia = true; } }; } },
    });
    assert.equal(retiradas, 0);
    instante = Date.parse('2026-09-29T00:00:00Z');
    if (evento === 'temporizador') temporizador(); else reactivar('active');
    assert.equal(retiradas, 1);
    reactivar('active');
    assert.equal(retiradas, 1);
    detener(); assert.equal(limpia, true);
  }
});

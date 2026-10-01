const test = require('node:test');
const assert = require('node:assert/strict');
const { CACHE_CATALOGO, adaptarCatalogo, adaptarCatalogoV2, crearLectorCatalogo, vigilarCaducidadCatalogo,
  programarRevisionDiaria } = require('../lib/catalogo-remoto');
const contrato = require('../lib/contrato-catalogo');
const fixture = require('../fixtures/escaparate-local.json');

const REVISION = '12345678-1234-4000-8000-123456789012';
const AHORA = new Date('2026-09-27T12:00:00Z');
function lotePruebaV1(fechaRadar = '2026-09-21') {
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
function lotePrueba(fechaRadar = '2026-09-21') {
  const lote = lotePruebaV1(fechaRadar);
  const metadata = { version_esquema: 2, plataformas_esperadas: 26, ofertas_esperadas: 49,
    colecciones_esperadas: { principales: 24, secundario: 21, en_camino: 4 },
    verificado_lote_el: fechaRadar, vigencia_lote_dias: 7 };
  const ofertas = lote.ofertas.slice(0, 24).map(o => ({ ...o, coleccion: 'principales' }));
  for (const [coleccion, n] of [['secundario', 21], ['en_camino', 4]]) {
    for (let i = 0; i < n; i++) ofertas.push({ ...structuredClone(lote.ofertas[i]),
      slug: `referencia-${coleccion.replace('_', '-')}-${i}`, coleccion,
      estado_revision: 'no_verificable', precio: null, rentabilidad: null,
      puntuacion: null, disponible_es: null });
  }
  for (const o of ofertas) o.documentacion = {
    revisadaEl: '2026-09-27', descripcion: 'Referencia documental sintética para comprobar el protocolo de catálogo.',
    fuentes: [o.url], caracteristicas: [{ etiqueta: 'Clase', valor: 'Fixture de prueba' }], referencias: [],
  };
  return { version: 2, plataformas: lote.plataformas.map(p => ({ ...p, ...structuredClone(metadata) })),
    ofertas: ofertas.map(o => ({ ...o, ...structuredClone(metadata) })) };
}
function entorno({ lote = lotePrueba(), cache, fallo, ahora = AHORA, orden = [{ retirado: false, motivo: null }] } = {}) {
  const mapa = new Map(cache ? [[CACHE_CATALOGO, JSON.stringify(cache)]] : []);
  const llamadas = [], escrituras = [];
  const almacenamiento = {
    async getItem(k) { return mapa.get(k) || null; },
    async setItem(k, v) { escrituras.push(k); mapa.set(k, v); },
    async removeItem(k) { mapa.delete(k); },
  };
  const estado = { lote, fallo, ahora, orden };
  const lector = crearLectorCatalogo({ almacenamiento, ahora: () => estado.ahora,
    clientePublico: () => ({ from(tabla) {
      llamadas.push(['from', tabla]);
      return { select(columnas) {
        llamadas.push(['select', columnas]);
        return { async limit(n) {
          llamadas.push(['limit', n]);
          if (estado.fallo instanceof Error) throw estado.fallo;
          if (estado.fallo) return { error: { message: 'fallo simulado' }, status: estado.fallo };
          if (tabla === 'catalogo_publicacion') {
            return estado.orden instanceof Error ? { error: { message: 'sin tabla' }, status: 404 }
              : { data: estado.orden, error: null, status: 200 };
          }
          return { data: tabla === 'catalogo_plataformas_publicas_v2'
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

test('el lector trae 26/49 por las vistas V2 y guarda un único lote, sin escrituras de inversión', async () => {
  const e = entorno();
  const r = await e.lector.cargar();
  assert.equal(r.error, null);
  assert.equal(r.revisionId, REVISION);
  assert.equal(r.fecha, '2026-09-21');
  assert.equal(r.plataformas.length, 26);
  assert.equal(r.ofertas.length, 49);
  assert.deepEqual(Object.fromEntries(['principales', 'secundario', 'en_camino']
    .map(c => [c, r.ofertas.filter(o => o.coleccion === c).length])),
  { principales: 24, secundario: 21, en_camino: 4 });
  assert.equal(r.ofertas[0].verificadaEl, '2026-09-27');
  assert.ok(r.plataformas.every(p => p.verificacionLocal.alertasCriticas.length > 0));
  assert.ok(r.ofertas.every(o => !Object.hasOwn(o, 'imagen')));
  assert.deepEqual(e.escrituras, [CACHE_CATALOGO]);
  assert.deepEqual(e.llamadas, [
    ['from', 'catalogo_plataformas_publicas_v2'], ['select', '*'], ['limit', 27],
    ['from', 'catalogo_ofertas_publicas_v2'], ['select', '*'], ['limit', 50],
    ['from', 'catalogo_publicacion'], ['select', 'retirado,motivo'], ['limit', 1],
  ]);
});

test('dos consumidores simultáneos comparten una sola carga', async () => {
  const e = entorno();
  const [uno, dos] = await Promise.all([e.lector.cargar(), e.lector.cargar()]);
  assert.equal(uno, dos);
  assert.equal(e.llamadas.filter(([m]) => m === 'from').length, 3);
});

test('la copia sin conexión conserva su fecha real, sigue disponible al caducar y no lee cachés antiguas', async () => {
  const e = entorno({ cache: lotePrueba(), fallo: new Error('offline') });
  e.mapa.set('rwadar.cache.radar', '[{"nombre":"dato antiguo"}]');
  const r = await e.lector.cargar();
  assert.equal(r.deCache, true);
  assert.equal(r.ofertas.length, 49);
  assert.equal(r.fecha, '2026-09-21');
  assert.ok(r.error);
  assert.equal(e.escrituras.length, 0);
  e.estado.ahora = new Date('2026-09-29T00:00:00Z');
  const vencida = await e.lector.cargar({ soloCache: true });
  assert.equal(vencida.caducado, true);
  assert.equal(vencida.fecha, '2026-09-21');
  assert.equal(vencida.plataformas.length, 26);
  assert.equal(vencida.ofertas.length, 49);
  assert.ok(vencida.ofertas.every(o => !o.precio && !o.rentabilidad && o.puntuacion == null));
  assert.equal(e.mapa.has(CACHE_CATALOGO), true);
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

test('un 200 vacío, parcial o inválido no se publica y conserva la última copia completa con aviso', async () => {
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
    assert.match(r.error, /No hemos podido comprobar/, String(cambiar));
    assert.equal(r.deCache, true);
    assert.equal(r.plataformas.length, 26);
    assert.equal(r.ofertas.length, 49);
    assert.deepEqual(JSON.parse(e.mapa.get(CACHE_CATALOGO)), lotePrueba());
    e.estado.fallo = new Error('offline');
    assert.equal((await e.lector.cargar()).ofertas.length, 49);
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

test('un error de permisos o de vista conserva la copia guardada y avisa; un 503 también', async () => {
  for (const fallo of [401, 403, 404]) {
    const e = entorno({ fallo, cache: lotePrueba() });
    const r = await e.lector.cargar();
    assert.equal(r.plataformas.length, 26);
    assert.match(r.error, /No hemos podido comprobar/);
    assert.equal(e.mapa.has(CACHE_CATALOGO), true);
  }
  const e = entorno({ fallo: 503, cache: lotePrueba() });
  assert.equal((await e.lector.cargar()).deCache, true);
});

test('un fallo de disco no destruye la respuesta válida ni revive una revisión retirada', async () => {
  const e = entorno({ cache: lotePrueba() });
  e.almacenamiento.setItem = async () => { throw new Error('disco lleno'); };
  e.almacenamiento.removeItem = async () => { throw new Error('disco inaccesible'); };
  assert.equal((await e.lector.cargar()).ofertas.length, 49);
  assert.equal((await e.lector.cargar({ soloCache: true })).ofertas.length, 0);
  e.estado.fallo = new Error('offline');
  assert.equal((await e.lector.cargar()).ofertas.length, 0);
});

test('un 503 en una vista y una denegación en la otra conservan la copia guardada', async () => {
  const e = entorno({ cache: lotePrueba() });
  const lector = crearLectorCatalogo({ almacenamiento: e.almacenamiento, ahora: () => AHORA,
    clientePublico: () => ({ from: tabla => ({ select: () => ({ limit: async () => ({
      error: { message: 'error simulado' },
      status: tabla === 'catalogo_plataformas_publicas_v2' ? 503 : 403,
    }) }) }) }),
  });
  const r = await lector.cargar();
  assert.equal(r.ofertas.length, 49);
  assert.match(r.error, /No hemos podido comprobar/);
  assert.equal(e.mapa.has(CACHE_CATALOGO), true);
});

test('una vista vacía con la otra sin red conserva la copia guardada', async () => {
  const e = entorno({ cache: lotePrueba() });
  const lector = crearLectorCatalogo({ almacenamiento: e.almacenamiento, ahora: () => AHORA,
    clientePublico: () => ({ from: tabla => ({ select: () => ({ limit: async () => {
      if (tabla === 'catalogo_plataformas_publicas_v2') throw new Error('offline');
      return { data: [], error: null, status: 200 };
    } }) }) }),
  });
  const r = await lector.cargar();
  assert.equal(r.ofertas.length, 49);
  assert.equal(r.deCache, true);
  assert.equal(e.mapa.has(CACHE_CATALOGO), true);
});

test('solo la orden expresa de retirada borra la copia guardada y oculta el catálogo', async () => {
  const e = entorno({ cache: lotePrueba(), orden: [{ retirado: true, motivo: 'Orden de prueba' }] });
  const r = await e.lector.cargar();
  assert.equal(r.retirado, true);
  assert.equal(r.plataformas.length, 0);
  assert.equal(r.ofertas.length, 0);
  assert.equal(e.mapa.has(CACHE_CATALOGO), false);
  e.estado.fallo = new Error('offline');
  assert.equal((await e.lector.cargar()).ofertas.length, 0);
});

test('con una base antigua sin la tabla de la orden, el catálogo se carga igual', async () => {
  const e = entorno({ orden: new Error('sin tabla') });
  const r = await e.lector.cargar();
  assert.equal(r.error, null);
  assert.equal(r.ofertas.length, 49);
});

test('un lote remoto completo y caducado se publica marcado, sin cifras vencidas', async () => {
  const e = entorno({ lote: lotePrueba('2026-09-21'), ahora: new Date('2026-10-15T09:00:00Z') });
  const r = await e.lector.cargar();
  assert.equal(r.error, null);
  assert.equal(r.caducado, true);
  assert.equal(r.plataformas.length, 26);
  assert.equal(r.ofertas.length, 49);
  assert.ok(r.ofertas.every(o => o.cifrasPendientes && !o.precio && !o.rentabilidad && o.puntuacion == null));
  assert.equal(e.mapa.has(CACHE_CATALOGO), true);
});

test('con el lote caducado se refresca una vez por cambio de día, por temporizador o al volver', () => {
  let instante = Date.parse('2026-10-10T22:00:00Z'), temporizador, espera, reactivar, cambios = 0, limpia = false;
  const detener = programarRevisionDiaria({ ahora: () => instante, alCambiarDia: () => { cambios += 1; },
    programar(fn, ms) { temporizador = fn; espera = ms; return 1; }, cancelar() {},
    appState: { addEventListener(tipo, fn) { assert.equal(tipo, 'change'); reactivar = fn;
      return { remove() { limpia = true; } }; } } });
  assert.equal(espera, 2 * 3600 * 1000 + 100);
  reactivar('active');
  assert.equal(cambios, 0);
  instante = Date.parse('2026-10-11T00:00:01Z');
  temporizador();
  assert.equal(cambios, 1);
  reactivar('active');
  assert.equal(cambios, 1);
  instante = Date.parse('2026-10-12T08:00:00Z');
  reactivar('active');
  assert.equal(cambios, 2);
  detener(); assert.equal(limpia, true);
});

test('la adaptación V2 no cambia fuentes, fechas, evidencia original ni pertenencia al radar', () => {
  const lote = lotePrueba(); const original = structuredClone(lote);
  const r = adaptarCatalogoV2(lote, AHORA);
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

test('V2 rechaza manifiestos, colecciones y revisiones mezclados, sin rescatar V1', async () => {
  const cambios = [
    l => { l.ofertas[24].coleccion = 'principales'; },
    l => { l.ofertas[24].estado_revision = 'actual'; },
    l => { l.ofertas[24].disponible_es = true; },
    l => { l.ofertas[24].puntuacion = 10; },
    l => { delete l.ofertas[0].documentacion; },
    l => { l.plataformas[0].version_esquema = 1; },
    l => { l.ofertas[0].ofertas_esperadas = 48; },
    l => { l.ofertas[0].colecciones_esperadas.secundario = 20; },
    l => { l.ofertas[0].verificado_lote_el = '2026-09-22'; },
    l => { l.ofertas[0].vigencia_lote_dias = 1; },
    l => { for (const f of [...l.plataformas, ...l.ofertas]) f.ofertas_esperadas = 48; l.ofertas.pop(); },
  ];
  for (const cambiar of cambios) {
    const lote = lotePrueba(); cambiar(lote);
    const e = entorno({ lote, cache: lotePrueba() });
    const r = await e.lector.cargar();
    assert.ok(r.error, String(cambiar)); assert.equal(r.deCache, true);
    assert.equal(e.mapa.has(CACHE_CATALOGO), true);
  }
  const e = entorno({ fallo: new Error('offline') });
  e.mapa.set('rwadar.cache.catalogo.v1', JSON.stringify(lotePruebaV1()));
  assert.equal((await e.lector.cargar()).ofertas.length, 0);
  assert.equal(adaptarCatalogo(lotePruebaV1(), AHORA).ofertas.length, 28);
  assert.throws(() => adaptarCatalogoV2(lotePruebaV1(), AHORA));
});

test('V2 conserva documentación secundaria pero elimina toda cifra actual en red y caché', async () => {
  const e = entorno();
  for (const opciones of [{}, { soloCache: true }]) {
    const r = await e.lector.cargar(opciones);
    const referencias = r.ofertas.filter(o => o.coleccion !== 'principales');
    assert.equal(referencias.length, 25);
    assert.ok(referencias.every(o => o.documentacion && o.cifrasPendientes &&
      o.precio === null && o.rentabilidad === null && o.disponibleEs === null &&
      o.puntuacion === null && o.resumen === '' && o.metricas.length === 0));
    assert.equal(r.vigenciaDias, 7);
  }
});

test('la app abierta respeta también una revisión con un plazo menor de siete días', () => {
  let retirada = 0;
  const detener = vigilarCaducidadCatalogo({ fecha: '2026-09-27', vigenciaDias: 1,
    ahora: () => Date.parse('2026-09-29T00:00:00Z'), alCaducar: () => { retirada++; },
    cancelar() {}, programar() { assert.fail('No debe esperar al plazo de siete días'); },
    appState: { addEventListener() { return { remove() {} }; } },
  });
  assert.equal(retirada, 1); detener();
});

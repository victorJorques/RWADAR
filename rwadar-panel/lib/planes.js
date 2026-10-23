/* =====================================================================
   RWAdar · panel · lo que queda de los planes gratis
   ---------------------------------------------------------------------
   Todo RWAdar va en planes gratis. Aquí, cuánto se ha gastado de cada
   uno y cuánto falta para el tope:
     · Cloudflare: peticiones a Workers y operaciones del almacén KV
       (se cuentan por día y vuelven a cero a las 00:00 UTC).
     · Supabase: el plan, si el proyecto está sano y su último uso (un
       proyecto gratis se pausa tras 7 días sin actividad).
     · GitHub Actions: minutos del mes en el repositorio privado (los
       públicos no gastan). La cifra exacta sale de los trabajos de cada
       ejecución; se apunta en el almacén (minutos-AAAA-MM) para no
       volver a pedirla, y mientras falta se estima por su duración.
     · Expo: compilaciones de Android del mes lanzadas desde GitHub.
   Topes comprobados el 23/10/2026 en las páginas de precios.
   ===================================================================== */
'use strict';
const { ErrorPanel, FaltaCredencial, pedir, pedirJson, mensajeRemoto } = require('./pedir');

const HEX = /^[0-9a-f]{32}$/i;
const DIA_MS = 86400000;
const LIMITES = Object.freeze({
  workersDia: 100000,
  kvLecturasDia: 100000,
  kvEscriturasDia: 1000,
  kvBorradosDia: 1000,
  kvListadosDia: 1000,
  supabaseUsuariosMes: 50000,
  supabaseDiasSinUso: 7,
  githubMinutosMes: 2000,
  expoAndroidMes: 15,
});
const AVISO = 0.8;
/* Cuántas ejecuciones de GitHub se cuentan exactas de una vez. En la nube
   cada visita puede hacer 50 consultas como mucho y la salud ya gasta
   unas 32: al abrir el panel se cuentan pocas y el grueso lo hace la
   tarea de cada hora, que va por su cuenta. */
const RELLENAR = { nube: { visita: 5, horaria: 30 }, local: { visita: 100, horaria: 100 } };

function medidor(nombre, usado, limite, extra = {}) {
  const porcentaje = limite ? Math.round((usado / limite) * 1000) / 10 : null;
  const estado = porcentaje === null ? 'ok' : porcentaje >= 100 ? 'fallo' : porcentaje >= AVISO * 100 ? 'aviso' : 'ok';
  return { nombre, usado, limite, porcentaje, estado, ...extra };
}

function crearPlanes({ config, almacen, github, cuentas }) {
  async function cloudflare(ahora) {
    if (!config.cloudflareToken) throw new FaltaCredencial('Cloudflare', 'ver lo gastado del plan gratis');
    if (!HEX.test(config.cloudflareCuenta)) throw new ErrorPanel('Cuenta de Cloudflare no válida', { estado: 400 });
    const hoy = ahora.toISOString().slice(0, 10);
    const filtro = `{date_geq: "${hoy}", date_leq: "${hoy}"}`;
    const query = `query { viewer { accounts(filter: {accountTag: "${config.cloudflareCuenta}"}) {
      workers: workersInvocationsAdaptive(limit: 50, filter: ${filtro}) { sum { requests } dimensions { scriptName } }
      kv: kvOperationsAdaptiveGroups(limit: 20, filter: ${filtro}) { sum { requests } dimensions { actionType } }
    } } }`;
    const r = await pedirJson(`${config.cloudflareApi}/graphql`, { method: 'POST', headers: { Authorization: `Bearer ${config.cloudflareToken}` }, cuerpo: { query } });
    if (r.datos?.errors?.length) throw new ErrorPanel(`Cloudflare: ${r.datos.errors[0].message}`, { estado: 502 });
    const c = r.datos?.data?.viewer?.accounts?.[0] || {};
    const porScript = (c.workers || [])
      .map(w => ({ nombre: w.dimensions?.scriptName || '(sin nombre)', peticiones: w.sum?.requests || 0 }))
      .sort((a, b) => b.peticiones - a.peticiones);
    const kv = tipo => (c.kv || []).filter(k => k.dimensions?.actionType === tipo).reduce((s, k) => s + (k.sum?.requests || 0), 0);
    const reinicia = 'cada día a las 00:00 UTC';
    return {
      servicio: 'Cloudflare', plan: 'Gratis',
      medidores: [
        medidor('Peticiones a Workers hoy', porScript.reduce((s, w) => s + w.peticiones, 0), LIMITES.workersDia, { reinicia, detalle: porScript.map(w => `${w.nombre}: ${w.peticiones}`).join(' · ') || null }),
        medidor('Lecturas del almacén hoy', kv('read'), LIMITES.kvLecturasDia, { reinicia }),
        medidor('Escrituras del almacén hoy', kv('write'), LIMITES.kvEscriturasDia, { reinicia }),
        medidor('Listados del almacén hoy', kv('list'), LIMITES.kvListadosDia, { reinicia }),
        medidor('Borrados del almacén hoy', kv('delete'), LIMITES.kvBorradosDia, { reinicia }),
      ],
      notas: ['La web (Cloudflare Pages) no tiene tope de visitas en el plan gratis. Lo que cuenta aquí es el panel y el almacén donde apunta su historial.'],
    };
  }

  async function supabase(ahora) {
    if (!config.supabaseAccessToken) throw new FaltaCredencial('Supabase (administración)', 'ver lo gastado del plan gratis');
    const ref = config.supabaseApi !== 'https://api.supabase.com' ? 'simulado' : (config.supabase.match(/^https:\/\/([a-z0-9]{20})\.supabase\.co$/) || [])[1];
    if (!ref) throw new ErrorPanel('No reconozco el proyecto de Supabase', { estado: 400 });
    const h = { headers: { Authorization: `Bearer ${config.supabaseAccessToken}` } };
    const leer = async ruta => {
      const r = await pedir(`${config.supabaseApi}${ruta}`, h);
      if (!r.ok) throw new ErrorPanel(`api.supabase.com respondió ${r.estado}: ${mensajeRemoto(r.datos, r.texto)}`, { estado: 502 });
      return r.datos;
    };
    const [proyecto, salud, uso, lista] = await Promise.allSettled([
      leer(`/v1/projects/${ref}`),
      leer(`/v1/projects/${ref}/health?services=db,auth,rest`),
      leer(`/v1/projects/${ref}/analytics/endpoints/usage.api-counts?interval=7day`),
      cuentas(),
    ]);
    if (proyecto.status === 'rejected') throw proyecto.reason;
    const org = await leer(`/v1/organizations/${encodeURIComponent(proyecto.value.organization_slug || proyecto.value.organization_id)}`).catch(() => null);
    const plan = org?.plan === 'free' ? 'Gratis' : org?.plan ? org.plan : 'sin dato';
    const dias = uso.status === 'fulfilled' ? (uso.value?.result || []) : [];
    const total = d => (d.total_auth_requests || 0) + (d.total_rest_requests || 0) + (d.total_storage_requests || 0) + (d.total_realtime_requests || 0);
    const conUso = dias.filter(d => total(d) > 0).map(d => d.timestamp).sort();
    const ultimoUso = conUso.at(-1) || null;
    const diasSinUso = ultimoUso ? Math.max(0, Math.floor((ahora - new Date(`${ultimoUso.slice(0, 10)}T00:00:00Z`)) / DIA_MS)) : null;
    const servicios = salud.status === 'fulfilled' ? salud.value : [];
    const enfermos = servicios.filter(s => !s.healthy).map(s => s.name);
    const numCuentas = lista.status === 'fulfilled' ? lista.value.cuentas.length : null;
    const medidores = [];
    if (numCuentas !== null) medidores.push(medidor('Usuarios activos al mes (como mucho)', numCuentas, LIMITES.supabaseUsuariosMes, { reinicia: 'cada mes', aproximado: true, detalle: 'Se cuenta cada cuenta como si entrara este mes: la cifra real es igual o menor.' }));
    return {
      servicio: 'Supabase', plan,
      estadoProyecto: proyecto.value.status || null,
      serviciosSanos: servicios.length ? enfermos.length === 0 : null,
      serviciosConProblemas: enfermos,
      peticiones7d: dias.reduce((s, d) => s + total(d), 0),
      porDia: dias.map(d => ({ fecha: String(d.timestamp).slice(0, 10), peticiones: total(d) })),
      ultimoUso, diasSinUso,
      pausaEstado: diasSinUso === null ? 'sin-datos' : diasSinUso >= LIMITES.supabaseDiasSinUso - 1 ? 'fallo' : diasSinUso >= 4 ? 'aviso' : 'ok',
      medidores,
      notas: [
        'Las peticiones a Supabase no tienen tope en el plan gratis.',
        `Un proyecto gratis se pausa si pasa ${LIMITES.supabaseDiasSinUso} días sin ningún uso. Con la web y la app abiertas por gente, no pasa.`,
        'Otros topes del plan gratis: 500 MB de base de datos y 5 GB de tráfico al mes; esos los enseña supabase.com › Usage.',
      ],
    };
  }

  /* Minutos de GitHub del mes: los exactos que ya estén apuntados y, para
     el resto, se piden unos cuantos cada vez y se apuntan. */
  async function githubYExpo(ahora, cuando = 'visita') {
    const mes = ahora.toISOString().slice(0, 7);
    const ejecuciones = await github.ejecucionesDesde(`${mes}-01`);
    const clave = `minutos-${mes}`;
    const apuntados = (await almacen.leer(clave).catch(() => null)) || {};
    const tope = RELLENAR[config.modo === 'nube' ? 'nube' : 'local'][cuando];
    const faltan = ejecuciones.filter(e => e.terminada && apuntados[e.id] === undefined).slice(0, tope);
    const nuevos = await Promise.allSettled(faltan.map(e => github.minutosDe(e.id)));
    const anadidos = Object.fromEntries(faltan.map((e, i) => [e.id, nuevos[i]]).filter(([, r]) => r.status === 'fulfilled').map(([id, r]) => [id, r.value]));
    const minutosPorId = { ...apuntados, ...anadidos };
    if (Object.keys(anadidos).length) await almacen.guardar(clave, minutosPorId).catch(() => {});
    const estimar = e => Math.ceil(Math.max(0, new Date(e.fin) - new Date(e.inicio)) / 60000);
    const minutos = ejecuciones.reduce((s, e) => s + (minutosPorId[e.id] ?? estimar(e)), 0);
    const sinExactos = ejecuciones.filter(e => minutosPorId[e.id] === undefined).length;
    const porTarea = new Map();
    for (const e of ejecuciones) porTarea.set(e.nombre, (porTarea.get(e.nombre) || 0) + (minutosPorId[e.id] ?? estimar(e)));

    const compilaciones = ejecuciones.filter(e => /\/compilar-app\.ya?ml$/.test(e.ruta) && e.resultado !== 'cancelled' && e.resultado !== 'skipped');
    return [
      {
        servicio: 'GitHub Actions', plan: 'Gratis (repositorio privado)',
        medidores: [medidor('Minutos de este mes', minutos, LIMITES.githubMinutosMes, {
          reinicia: 'cada mes', aproximado: sinExactos > 0,
          detalle: [...porTarea].sort((a, b) => b[1] - a[1]).map(([n, m]) => `${n}: ${m} min`).join(' · ') || null,
        })],
        ejecuciones: ejecuciones.length, pendientesDeContar: sinExactos,
        notas: [
          'Solo gasta el repositorio privado (RWADAR); el de descargas es público y no cuenta.',
          ...(sinExactos ? [`${sinExactos} ejecuciones aún van estimadas por su duración; el panel las va contando exactas poco a poco.`] : []),
        ],
      },
      {
        servicio: 'Expo (compilar la app)', plan: 'Gratis',
        medidores: [medidor('Compilaciones de Android este mes', compilaciones.length, LIMITES.expoAndroidMes, {
          reinicia: 'cada mes', aproximado: true,
          detalle: `${compilaciones.filter(e => e.resultado === 'success').length} salieron bien`,
        })],
        notas: ['Cuenta las lanzadas desde GitHub («Compilar app Android»). Si alguien compila a mano desde su ordenador, no sale aquí.'],
      },
    ];
  }

  async function resumen(ahora = new Date()) {
    const [cf, sb, gh] = await Promise.allSettled([cloudflare(ahora), supabase(ahora), githubYExpo(ahora)]);
    const leer = (x, servicio) => x.status === 'fulfilled' ? x.value : { servicio, error: x.reason?.message || 'sin respuesta', codigo: x.reason?.codigo || 'error' };
    const ghLista = gh.status === 'fulfilled' ? gh.value : [leer(gh, 'GitHub Actions'), leer(gh, 'Expo (compilar la app)')];
    return { servicios: [leer(cf, 'Cloudflare'), leer(sb, 'Supabase'), ...ghLista], limites: LIMITES };
  }

  /* La tarea horaria de la nube va apuntando minutos exactos aunque nadie mire. */
  async function apuntarMinutos(ahora = new Date()) {
    await githubYExpo(ahora, 'horaria');
  }

  return { resumen, apuntarMinutos };
}

module.exports = { crearPlanes, medidor, LIMITES };

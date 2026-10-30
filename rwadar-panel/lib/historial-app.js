/* =====================================================================
   RWAdar · panel · historial de la app
   ---------------------------------------------------------------------
   GitHub solo da el total de descargas acumulado y Supabase solo deja
   ver 24 horas de registros. Para tener días y semanas, el panel apunta
   cada vez que mira (y el de la nube, además, cada hora):
     descargas-AAAA-MM-DD  total de descargas del APK ese día
     uso-app-AAAA-MM-DD    aperturas del catálogo por hora (app y web)
   Las descargas de un día son la diferencia con el día anterior apuntado.
   ===================================================================== */
'use strict';

const DIA_MS = 86400000;
const dia = fecha => new Date(fecha).toISOString().slice(0, 10);

/* Solo se escribe si algo cambió: el plan gratis de KV da 1.000 escrituras
   al día y el panel abierto refresca cada pocos minutos. */
async function anotarDescargas(almacen, descargas, ahora = new Date()) {
  const clave = `descargas-${dia(ahora)}`;
  const porVersion = Object.fromEntries(descargas.versiones.map(v => [v.version, v.descargasApk]));
  const antes = await almacen.leer(clave);
  if (antes?.total === descargas.totalApk && JSON.stringify(antes.porVersion) === JSON.stringify(porVersion)) return;
  await almacen.guardar(clave, { total: descargas.totalApk, porVersion, apuntado: new Date(ahora).toISOString() });
}

async function anotarHoras(almacen, filas) {
  const porDia = new Map();
  for (const f of filas) {
    const d = f.hora.slice(0, 10);
    if (!porDia.has(d)) porDia.set(d, []);
    porDia.get(d).push(f);
  }
  for (const [d, horas] of porDia) {
    const antes = (await almacen.leer(`uso-app-${d}`)) || { horas: {} };
    const nuevas = Object.fromEntries(horas.map(f => [f.hora.slice(11, 13), { app: f.app, web: f.web, pasarela: f.pasarela || 0, conexionesApp: f.conexionesApp }]));
    const despues = { ...antes, horas: { ...antes.horas, ...nuevas } };
    if (JSON.stringify(despues.horas) !== JSON.stringify(antes.horas)) await almacen.guardar(`uso-app-${d}`, despues);
  }
}

async function leerHistorial(almacen, dias = 30, ahora = new Date()) {
  const fechas = [];
  for (let i = dias; i >= 0; i--) fechas.push(dia(new Date(ahora).getTime() - i * DIA_MS));
  const [descargas, uso] = await Promise.all([
    Promise.all(fechas.map(f => almacen.leer(`descargas-${f}`))),
    Promise.all(fechas.map(f => almacen.leer(`uso-app-${f}`))),
  ]);
  const descargasPorDia = [];
  for (let i = 1; i < fechas.length; i++) {
    /* Sin apunte ese día o el anterior no se sabe: se deja vacío, no a cero. */
    const nuevas = descargas[i] && descargas[i - 1] ? Math.max(0, descargas[i].total - descargas[i - 1].total) : null;
    descargasPorDia.push({ fecha: fechas[i], nuevas });
  }
  const usoPorDia = fechas.slice(1).map((f, i) => {
    const horas = Object.values(uso[i + 1]?.horas || {});
    const suma = clave => horas.reduce((s, h) => s + (h[clave] || 0), 0);
    return horas.length
      ? { fecha: f, app: suma('app'), web: suma('web'), pasarela: suma('pasarela'), horasApuntadas: horas.length }
      : { fecha: f, app: null, web: null, pasarela: null, horasApuntadas: 0 };
  });
  return {
    descargasPorDia,
    usoPorDia,
    diasConDescargas: descargasPorDia.filter(d => d.nuevas !== null).length,
    diasConUso: usoPorDia.filter(d => d.horasApuntadas > 0).length,
  };
}

/* Si Supabase no contesta, las últimas 24 horas salen de lo apuntado
   (el panel de la nube apunta cada hora). Devuelve null si no hay nada. */
async function ultimas24hApuntadas(almacen, ahora = new Date()) {
  const HORA_MS = 3600000;
  const fin = Math.floor(new Date(ahora).getTime() / HORA_MS) * HORA_MS;
  const dias = [...new Set([dia(fin - 24 * HORA_MS), dia(fin)])];
  const docs = Object.fromEntries(await Promise.all(dias.map(async d => [d, await almacen.leer(`uso-app-${d}`)])));
  const serie = [];
  let apuntadas = 0;
  for (let t = fin - 23 * HORA_MS; t <= fin; t += HORA_MS) {
    const hora = new Date(t).toISOString();
    const h = docs[hora.slice(0, 10)]?.horas?.[hora.slice(11, 13)];
    if (h) apuntadas++;
    serie.push({ hora, app: h?.app || 0, web: h?.web || 0, pasarela: h?.pasarela || 0, conexionesApp: h?.conexionesApp || 0 });
  }
  if (!apuntadas) return null;
  const suma = clave => serie.reduce((s, f) => s + f[clave], 0);
  return { serie, app: suma('app'), web: suma('web'), pasarela: suma('pasarela'), conexionesApp: Math.max(0, ...serie.map(f => f.conexionesApp)), desdeHistorial: true, horasApuntadas: apuntadas };
}

module.exports = { anotarDescargas, anotarHoras, leerHistorial, ultimas24hApuntadas };

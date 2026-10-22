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

async function anotarDescargas(almacen, descargas, ahora = new Date()) {
  const porVersion = Object.fromEntries(descargas.versiones.map(v => [v.version, v.descargasApk]));
  await almacen.guardar(`descargas-${dia(ahora)}`, { total: descargas.totalApk, porVersion, apuntado: new Date(ahora).toISOString() });
}

async function anotarHoras(almacen, filas) {
  const porDia = new Map();
  for (const f of filas) {
    const d = f.hora.slice(0, 10);
    if (!porDia.has(d)) porDia.set(d, []);
    porDia.get(d).push(f);
  }
  for (const [d, horas] of porDia) {
    const actual = (await almacen.leer(`uso-app-${d}`)) || { horas: {} };
    for (const f of horas) actual.horas[f.hora.slice(11, 13)] = { app: f.app, web: f.web, conexionesApp: f.conexionesApp };
    await almacen.guardar(`uso-app-${d}`, actual);
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
    return horas.length
      ? { fecha: f, app: horas.reduce((s, h) => s + h.app, 0), web: horas.reduce((s, h) => s + h.web, 0), horasApuntadas: horas.length }
      : { fecha: f, app: null, web: null, horasApuntadas: 0 };
  });
  return {
    descargasPorDia,
    usoPorDia,
    diasConDescargas: descargasPorDia.filter(d => d.nuevas !== null).length,
    diasConUso: usoPorDia.filter(d => d.horasApuntadas > 0).length,
  };
}

module.exports = { anotarDescargas, anotarHoras, leerHistorial };

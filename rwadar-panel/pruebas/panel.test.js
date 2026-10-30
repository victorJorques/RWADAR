/* RWAdar · panel · pruebas de punta a punta contra el simulador.
       node --test rwadar-panel/pruebas
   Arrancan el simulador y el panel en puertos libres y usan la API como
   lo hace la página. No tocan nada real ni leen .env.local. */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { crearSimulador, entornoPanel } = require('../demo/simulador');
const { cargarConfig } = require('../lib/config');
const { crearPanel } = require('../servidor');

const SIN_ENV = path.join(__dirname, 'no-existe.env');

function puertoLibre() {
  return new Promise(resolver => {
    const s = http.createServer().listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolver(port)); });
  });
}

async function montar(extra = {}) {
  const { servidor: simulador, estado } = crearSimulador();
  await new Promise(r => simulador.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${simulador.address().port}`;
  const puerto = await puertoLibre();
  const dirDatos = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-panel-'));
  const entorno = { ...entornoPanel(base), RWADAR_PANEL_PUERTO: String(puerto), RWADAR_PANEL_DATOS: dirDatos, ...extra };
  const panel = crearPanel(cargarConfig(entorno, SIN_ENV));
  await new Promise(r => panel.servidor.listen(puerto, '127.0.0.1', r));
  const url = `http://127.0.0.1:${puerto}`;
  const api = async (ruta, { metodo = 'GET', cuerpo, cabeceras = {} } = {}) => {
    const res = await fetch(url + ruta, {
      method: metodo,
      headers: { 'X-Panel-Token': panel.token, ...(cuerpo ? { 'Content-Type': 'application/json' } : {}), ...cabeceras },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    return { estado: res.status, ...(await res.json()) };
  };
  const cerrar = () => Promise.all([new Promise(r => panel.servidor.close(r)), new Promise(r => simulador.close(r))]);
  return { url, api, estado, panel, dirDatos, cerrar };
}

test('la página lleva la sesión, una CSP estricta y no se deja cargar en un marco', async () => {
  const p = await montar();
  try {
    const res = await fetch(`${p.url}/`);
    const html = await res.text();
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-security-policy'), /script-src 'self';/);
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
    assert.ok(html.includes(p.panel.token) && !html.includes('__TOKEN__'));
    for (const archivo of ['/panel.js', '/util.js', '/vistas.js', '/vistas-datos.js', '/vistas-catalogo.js', '/vistas-limites.js', '/graficos.js', '/panel.css']) {
      assert.equal((await fetch(p.url + archivo)).status, 200, archivo);
    }
    assert.equal((await fetch(`${p.url}/../.env.local`)).status, 404);
  } finally { await p.cerrar(); }
});

test('la API rechaza peticiones sin sesión, de otro host o de otra web', async () => {
  const p = await montar();
  try {
    assert.equal((await fetch(`${p.url}/api/cuentas`)).status, 403);
    const rebinding = await new Promise(resolver => {
      http.get({ host: '127.0.0.1', port: new URL(p.url).port, path: '/api/ajustes', headers: { Host: 'atacante.example:80', 'X-Panel-Token': p.panel.token } },
        res => resolver(res.statusCode));
    });
    assert.equal(rebinding, 421);
    const ajena = await p.api('/api/catalogo', { metodo: 'POST', cuerpo: { retirado: true, motivo: 'ataque', confirmacion: 'RETIRAR' }, cabeceras: { Origin: 'https://atacante.example' } });
    assert.equal(ajena.estado, 400);
    assert.equal(p.estado.retirado, false, 'no se ha cambiado nada');
  } finally { await p.cerrar(); }
});

test('el panel no apaga la web: solo dice si está encendida', async () => {
  const p = await montar();
  try {
    for (const ruta of ['/api/web/apagar', '/api/web/encender']) {
      assert.equal((await p.api(ruta, { metodo: 'POST', cuerpo: { confirmacion: 'APAGAR' } })).estado, 404, ruta);
    }
    assert.equal((await p.api('/api/despliegues')).estado, 404);
    const { datos } = await p.api('/api/interruptores');
    assert.equal(datos.web.encendida, true);
    assert.equal(datos.web.estadoHttp, 200);
    assert.equal('puedeApagar' in datos, false);
  } finally { await p.cerrar(); }
});

test('si la web se cae, la salud lo marca como fallo y dice a quién avisar', async () => {
  const p = await montar();
  try {
    p.estado.webCaida = true;
    const { datos } = await p.api('/api/salud?fresco=1');
    const web = datos.comprobaciones.find(c => c.id === 'web');
    assert.equal(web.estado, 'fallo');
    assert.match(web.detalle, /503/);
    assert.match(web.arreglo, /Claude o a Codex/);
    assert.equal(datos.comprobaciones.find(c => c.id === 'paginas').estado, 'sin-datos');
    assert.equal(datos.global, 'fallo');
    assert.equal((await p.api('/api/interruptores')).datos.web.encendida, false);
  } finally { await p.cerrar(); }
});

test('sin la clave de Cloudflare las visitas explican qué falta y lo demás sigue', async () => {
  const p = await montar({ CLOUDFLARE_API_TOKEN: '' });
  try {
    assert.equal((await p.api('/api/trafico?periodo=7d')).codigo, 'falta-credencial');
    const { datos } = await p.api('/api/salud');
    assert.ok(!datos.comprobaciones.some(c => c.id === 'despliegue'), 'ya no hay comprobación de despliegues');
    assert.equal(datos.comprobaciones.find(c => c.id === 'web').estado, 'ok');
  } finally { await p.cerrar(); }
});

test('retirar el catálogo solo se ofrece si la base da permiso de verdad', async () => {
  const p = await montar();
  try {
    let d = (await p.api('/api/interruptores')).datos;
    assert.equal(d.puedeRetirar, true);
    assert.equal(p.estado.retirado, false, 'la comprobación no cambia nada');
    /* Otro panel, con la base sin permiso (el permiso se recuerda 10 min). */
    const p2 = await montar();
    p2.estado.sinPermisoCatalogo = true;
    d = (await p2.api('/api/interruptores')).datos;
    assert.equal(d.puedeRetirar, false);
    assert.equal(d.motivoRetirar, 'sin-permiso');
    await p2.cerrar();
    const sinClave = await montar({ SUPABASE_SECRET_KEY: '' });
    assert.equal((await sinClave.api('/api/interruptores')).datos.motivoRetirar, 'falta-clave');
    await sinClave.cerrar();
  } finally { await p.cerrar(); }
});

test('si GitHub corta las consultas sin clave, las descargas dicen qué clave falta', async () => {
  const p = await montar();
  try {
    p.estado.githubLimitado = true;
    const { datos } = await p.api('/api/app');
    assert.equal(datos.descargas.codigo, 'falta-credencial');
    assert.match(datos.descargas.error, /GitHub/);
    const salud = (await p.api('/api/salud?fresco=1')).datos;
    assert.equal(salud.comprobaciones.find(c => c.id === 'app').estado, 'sin-datos');
    const conClave = await montar({ GITHUB_TOKEN: 'demo-token-github' });
    conClave.estado.githubLimitado = true;
    assert.ok((await conClave.api('/api/app')).datos.descargas.datos.totalApk > 0, 'con clave sí responde');
    await conClave.cerrar();
  } finally { await p.cerrar(); }
});

test('borrar una cuenta exige escribir su correo y queda en el registro', async () => {
  const p = await montar();
  try {
    const lista = await p.api('/api/cuentas');
    const victima = lista.datos.cuentas[3];
    const mal = await p.api(`/api/cuentas/${victima.id}/borrar`, { metodo: 'POST', cuerpo: { confirmacion: 'otra@example.com' } });
    assert.equal(mal.estado, 400);
    assert.equal(p.estado.cuentas.length, lista.datos.resumen.total);
    const bien = await p.api(`/api/cuentas/${victima.id}/borrar`, { metodo: 'POST', cuerpo: { confirmacion: victima.correo.toUpperCase() } });
    assert.equal(bien.estado, 200, bien.error);
    const despues = await p.api('/api/cuentas');
    assert.equal(despues.datos.resumen.total, lista.datos.resumen.total - 1);
    assert.ok(!despues.datos.cuentas.some(c => c.id === victima.id));
    assert.equal((await p.api('/api/registro')).datos[0].objetivo, victima.correo);
    assert.equal((await p.api('/api/cuentas/no-es-un-id/borrar', { metodo: 'POST', cuerpo: { confirmacion: 'x' } })).estado, 400);
  } finally { await p.cerrar(); }
});

test('bloquear, desbloquear y confirmar una cuenta', async () => {
  const p = await montar();
  try {
    const { cuentas } = (await p.api('/api/cuentas')).datos;
    const sinConfirmar = cuentas.find(c => !c.confirmada && !c.bloqueadaHasta);
    assert.ok(sinConfirmar, 'el simulador tiene alguna sin confirmar');
    assert.equal((await p.api(`/api/cuentas/${sinConfirmar.id}/bloquear`, { metodo: 'POST', cuerpo: { bloquear: true } })).estado, 200);
    let actual = (await p.api('/api/cuentas')).datos.cuentas.find(c => c.id === sinConfirmar.id);
    assert.ok(actual.bloqueadaHasta);
    await p.api(`/api/cuentas/${sinConfirmar.id}/bloquear`, { metodo: 'POST', cuerpo: { bloquear: false } });
    await p.api(`/api/cuentas/${sinConfirmar.id}/confirmar`, { metodo: 'POST', cuerpo: {} });
    actual = (await p.api('/api/cuentas')).datos.cuentas.find(c => c.id === sinConfirmar.id);
    assert.equal(actual.bloqueadaHasta, null);
    assert.equal(actual.confirmada, true);
  } finally { await p.cerrar(); }
});

test('retirar el catálogo pide motivo y la palabra RETIRAR; volver a mostrarlo limpia el motivo', async () => {
  const p = await montar();
  try {
    assert.equal((await p.api('/api/catalogo', { metodo: 'POST', cuerpo: { retirado: true, motivo: 'Revisión urgente' } })).estado, 400);
    assert.equal((await p.api('/api/catalogo', { metodo: 'POST', cuerpo: { retirado: true, motivo: 'x', confirmacion: 'RETIRAR' } })).estado, 400);
    const r = await p.api('/api/catalogo', { metodo: 'POST', cuerpo: { retirado: true, motivo: 'Revisión urgente', confirmacion: 'RETIRAR' } });
    assert.equal(r.estado, 200, r.error);
    assert.equal(p.estado.retirado, true);
    const salud = await p.api('/api/salud?fresco=1');
    assert.equal(salud.datos.global, 'fallo');
    assert.ok(salud.datos.problemas.some(x => x.id === 'retirado' && x.detalle.includes('Revisión urgente')));
    await p.api('/api/catalogo', { metodo: 'POST', cuerpo: { retirado: false } });
    assert.equal(p.estado.retirado, false);
    assert.equal(p.estado.motivo, null);
  } finally { await p.cerrar(); }
});

test('la salud avisa de la tarea fallida y da la vigencia del catálogo', async () => {
  const p = await montar();
  try {
    const { datos } = await p.api('/api/salud');
    assert.equal(datos.global, 'aviso');
    const por = Object.fromEntries(datos.comprobaciones.map(c => [c.id, c]));
    assert.equal(por.tareas.estado, 'aviso');
    assert.match(por.tareas.detalle, /Compilar app/);
    assert.equal(por.copias.estado, 'ok');
    assert.equal(por.android.estado, 'ok');
    assert.equal(por.paginas.estado, 'ok');
    assert.match(por.vigencia.detalle, /26 plataformas y 49 ofertas/);
    assert.match(por.app.detalle, /^v1\.3\.2/, 'la versión de prueba no cuenta como última');
  } finally { await p.cerrar(); }
});

test('el tráfico rellena los días sin visitas y agrupa el flujo por secciones', async () => {
  const p = await montar();
  try {
    const t7 = (await p.api('/api/trafico?periodo=7d')).datos;
    assert.equal(t7.serie.length, 8);
    assert.equal(t7.serie.reduce((s, x) => s + x.visitas, 0), t7.visitas);
    assert.ok(t7.flujo.secciones.some(s => s.id === 'ofertas'));
    assert.ok(t7.flujo.fichas.every(f => /^\/(ofertas|plataformas)\//.test(f.nombre)));
    const t24 = (await p.api('/api/trafico?periodo=24h')).datos;
    assert.equal(t24.porHora, true);
    assert.ok(t24.serie.length >= 24 && t24.serie.length <= 25);
    assert.equal((await p.api('/api/trafico?periodo=1año')).estado, 400);
  } finally { await p.cerrar(); }
});

test('los 30 días usan las visitas exactas apuntadas en vez de la estimación', async () => {
  const p = await montar();
  try {
    const t7 = (await p.api('/api/trafico?periodo=7d')).datos;
    const hoy = t7.serie.at(-1).momento;
    const apuntado = JSON.parse(fs.readFileSync(path.join(p.dirDatos, `visitas-${hoy}.json`), 'utf8'));
    assert.equal(apuntado.visitas, t7.serie.at(-1).visitas, 'se apuntan los días exactos');
    /* Un día viejo apuntado a mano: los 30 días deben usarlo tal cual. */
    const viejo = new Date(Date.now() - 20 * 86400000).toISOString().slice(0, 10);
    fs.writeFileSync(path.join(p.dirDatos, `visitas-${viejo}.json`), JSON.stringify({ visitas: 777, paginas: 999 }));
    const t30 = (await p.api('/api/trafico?periodo=30d')).datos;
    assert.equal(t30.serie.find(x => x.momento === viejo).visitas, 777);
    assert.equal(t30.visitas, t30.serie.reduce((s, x) => s + x.visitas, 0), 'el total es la suma de los días');
    assert.ok(t30.diasExactos >= 8);
  } finally { await p.cerrar(); }
});

test('el primer día de la semana, que va a medias, no se apunta, y lo apuntado nunca baja', async () => {
  const p = await montar();
  try {
    const t7 = (await p.api('/api/trafico?periodo=7d')).datos;
    const primero = t7.serie[0].momento;
    const segundo = t7.serie[1].momento;
    assert.equal(fs.existsSync(path.join(p.dirDatos, `visitas-${primero}.json`)), false, 'el día a medias no se guarda');
    const archivo = path.join(p.dirDatos, `visitas-${segundo}.json`);
    fs.writeFileSync(archivo, JSON.stringify({ visitas: 5000, paginas: 9000 }));
    await p.api('/api/trafico?periodo=7d');
    assert.deepEqual(JSON.parse(fs.readFileSync(archivo, 'utf8')), { visitas: 5000, paginas: 9000 }, 'una cifra más alta ya apuntada se respeta');
  } finally { await p.cerrar(); }
});

test('la app suma las descargas de APK sin contar las sumas de control', async () => {
  const p = await montar();
  try {
    const { datos } = await p.api('/api/app');
    assert.equal(datos.descargas.datos.ultima.version, 'v1.3.2');
    assert.equal(datos.descargas.datos.totalApk, 3 + 41 + 18 + 57 + 88 + 64 + 23);
  } finally { await p.cerrar(); }
});

test('el uso de la app sale hora a hora de los registros de Supabase y se apunta en el historial', async () => {
  const p = await montar();
  try {
    const { datos } = await p.api('/api/app');
    const uso = datos.uso.datos;
    assert.equal(uso.serie.length, 24);
    assert.equal(uso.serie.reduce((s, f) => s + f.app, 0), uso.app);
    assert.ok(uso.app > 0 && uso.web > 0);
    assert.ok(uso.pasarela > 0, 'las cargas por la pasarela de la web (sin agente) también cuentan');
    assert.equal(uso.serie.reduce((s, f) => s + f.pasarela, 0), uso.pasarela);
    assert.ok(datos.historial.usoPorDia.some(d => d.pasarela > 0), 'y se apuntan por día');
    assert.ok(uso.serie.every((f, i) => i === 0 || Date.parse(f.hora) - Date.parse(uso.serie[i - 1].hora) === 3600000), 'horas seguidas');
    const hoy = new Date().toISOString().slice(0, 10);
    assert.ok(fs.existsSync(path.join(p.dirDatos, `uso-app-${hoy}.json`)));
    assert.ok(fs.existsSync(path.join(p.dirDatos, `descargas-${hoy}.json`)));
    assert.ok(datos.historial.diasConUso >= 1);
    assert.equal(datos.historial.usoPorDia.length, 30);
  } finally { await p.cerrar(); }
});

test('si Supabase no contesta, el uso de la app sale de lo apuntado y lo avisa', async () => {
  const p = await montar();
  try {
    await p.api('/api/app'); // la primera vez se apuntan las 24 horas
    const p2 = await montar({ RWADAR_PANEL_SUPABASE_API: 'http://127.0.0.1:9/no-contesta', RWADAR_PANEL_DATOS: p.dirDatos });
    const { datos } = await p2.api('/api/app');
    assert.equal(datos.uso.datos.desdeHistorial, true);
    assert.ok(datos.uso.datos.horasApuntadas >= 23);
    assert.match(datos.uso.aviso, /no se pudo conectar|no respondió/);
    await p2.cerrar();
  } finally { await p.cerrar(); }
});

test('sin la clave de registros la app sale igual y explica qué falta', async () => {
  const p = await montar({ SUPABASE_ACCESS_TOKEN: '' });
  try {
    const { datos } = await p.api('/api/app');
    assert.equal(datos.uso.codigo, 'falta-credencial');
    assert.ok(datos.descargas.datos.totalApk > 0);
  } finally { await p.cerrar(); }
});

test('los correos dicen de dónde salen y cuántos, y un fallo de envío es fallo sin enseñar direcciones', async () => {
  const p = await montar();
  try {
    let { datos } = await p.api('/api/correos');
    assert.equal(datos.remitente.datos.servidor, 'smtp.example.com');
    assert.equal(datos.remitente.datos.limiteHora, 30);
    assert.equal(datos.registros.datos.altas, 3);
    assert.equal(datos.registros.datos.errores, 0);
    assert.ok(datos.cuentas.datos.altas30d > 0);
    const p2 = await montar();
    p2.estado.correoRoto = true;
    ({ datos } = await p2.api('/api/correos'));
    assert.equal(datos.registros.datos.errores, 2);
    assert.match(datos.registros.datos.ultimosErrores[0].mensaje, /535 .*<correo>/);
    assert.doesNotMatch(JSON.stringify(datos.registros), /@example\.com/);
    const correos = (await p2.api('/api/salud')).datos.comprobaciones.find(c => c.id === 'correos');
    assert.equal(correos.estado, 'fallo');
    assert.match(correos.arreglo, /Gmail/);
    await p2.cerrar();
  } finally { await p.cerrar(); }
});

test('límites y fechas: lo que caduca y los minutos exactos de GitHub, apuntados para no repetir', async () => {
  const p = await montar();
  try {
    const { datos } = await p.api('/api/limites');
    const fechas = Object.fromEntries(datos.fechas.datos.map(f => [f.id, f]));
    assert.equal(fechas.security.estado, 'ok');
    assert.ok(fechas.security.diasRestantes >= 199 && fechas.security.diasRestantes <= 201);
    assert.equal(fechas.cloudflare.que, 'No caduca.');
    assert.equal(fechas.catalogo.estado, 'ok');
    const servicios = Object.fromEntries(datos.planes.datos.servicios.map(s => [s.servicio, s]));
    assert.equal(servicios.Cloudflare.medidores[0].usado, 1840);
    assert.equal(servicios.Cloudflare.medidores[2].limite, 1000, 'escrituras del almacén: 1.000 al día');
    assert.equal(servicios.Supabase.plan, 'Gratis');
    assert.equal(servicios.Supabase.pausaEstado, 'ok');
    const gh = servicios['GitHub Actions'];
    assert.equal(gh.pendientesDeContar, 0);
    assert.ok(gh.medidores[0].usado >= 33, 'cada trabajo se redondea al minuto hacia arriba');
    assert.equal(gh.medidores[0].aproximado, false);
    const expo = servicios['Expo (compilar la app)'].medidores[0];
    assert.deepEqual([expo.usado, expo.limite, expo.detalle], [2, 15, '1 salieron bien']);
    assert.match(fs.readdirSync(p.dirDatos).join(' '), /minutos-/);
  } finally { await p.cerrar(); }
});

test('catálogo y Academy por dentro: inventario, lecturas y lo que nadie abre', async () => {
  const p = await montar();
  try {
    const { datos } = await p.api('/api/contenido?periodo=30d');
    assert.equal(datos.catalogo.plataformas.total, 26);
    assert.equal(datos.catalogo.ofertas.total, 49);
    assert.equal(datos.catalogo.plataformas.sinOfertas.length, 22);
    assert.equal(datos.catalogo.plataformas.sinRevisarMasDe60, 20);
    assert.equal(datos.academy.total, 4);
    assert.equal(datos.academy.lista[0].slug, 'que-es-tokenizar');
    assert.ok(datos.academy.lista[0].paginas > 0);
    assert.equal(datos.academy.nadie.length, 3);
    assert.deepEqual(datos.descartes, ['Toucan Protocol', 'Goldfinch', 'Realt']);
    assert.equal(datos.fichasMedidas, true, 'el simulador sí mide fichas: se cruzan solas');
    assert.ok(datos.vistasFichas.ofertas.lista[0].paginas > 0);
  } finally { await p.cerrar(); }
});

test('la velocidad separa móvil y ordenador y la salud la vigila', async () => {
  const p = await montar();
  try {
    const { datos } = await p.api('/api/velocidad');
    assert.deepEqual([datos.movil.lcp, datos.movil.notas.lcp, datos.movil.inp], [1840, 'ok', 168]);
    assert.deepEqual([datos.ordenador.cls, datos.ordenador.notas.cls], [0.13, 'aviso']);
    const salud = (await p.api('/api/salud')).datos.comprobaciones;
    const v = salud.find(c => c.id === 'velocidad');
    assert.equal(v.estado, 'aviso');
    assert.match(v.detalle, /ordenador la página salta/);
    for (const id of ['correos', 'fechas', 'planes']) assert.ok(salud.some(c => c.id === id), id);
    const t = (await p.api('/api/trafico?periodo=7d')).datos;
    assert.equal('paginasTodas' in t, false, 'la lista completa no viaja al navegador');
  } finally { await p.cerrar(); }
});

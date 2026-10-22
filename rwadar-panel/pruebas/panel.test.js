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
  process.env.RWADAR_PANEL_CLOUDFLARE_API = entorno.RWADAR_PANEL_CLOUDFLARE_API;
  process.env.RWADAR_WRANGLER_ESPERA_MS = '10';
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
    for (const archivo of ['/panel.js', '/util.js', '/vistas.js', '/vistas-datos.js', '/graficos.js', '/panel.css']) {
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
    const ajena = await p.api('/api/web/apagar', { metodo: 'POST', cuerpo: { confirmacion: 'APAGAR' }, cabeceras: { Origin: 'https://atacante.example' } });
    assert.equal(ajena.estado, 400);
    assert.equal(p.estado.despliegues.length, 4, 'no se ha desplegado nada');
  } finally { await p.cerrar(); }
});

test('apagar sube el mantenimiento y encender vuelve exactamente al despliegue anterior', async () => {
  const p = await montar();
  try {
    const anterior = p.estado.actual;
    assert.equal((await p.api('/api/web/apagar', { metodo: 'POST', cuerpo: { confirmacion: 'apagar' } })).estado, 400);
    const apagar = await p.api('/api/web/apagar', { metodo: 'POST', cuerpo: { confirmacion: 'APAGAR' } });
    assert.equal(apagar.estado, 200, apagar.error);
    assert.equal(apagar.datos.anterior.id, anterior);
    assert.equal(apagar.datos.via, 'subida', 'la primera vez se sube con wrangler');
    const apagada = await p.api('/api/interruptores');
    assert.equal(apagada.datos.web.enMantenimiento, true);
    assert.equal(apagada.datos.web.guardado.anterior.id, anterior);
    assert.equal((await p.api('/api/web/apagar', { metodo: 'POST', cuerpo: { confirmacion: 'APAGAR' } })).estado, 409, 'no se apaga dos veces');
    const salud = await p.api('/api/salud?fresco=1');
    assert.equal(salud.datos.comprobaciones.find(c => c.id === 'web').estado, 'aviso');
    const encender = await p.api('/api/web/encender', { metodo: 'POST', cuerpo: {} });
    assert.equal(encender.estado, 200, encender.error);
    assert.equal(p.estado.actual, anterior);
    assert.equal((await p.api('/api/interruptores')).datos.web.encendida, true);
    assert.ok(!fs.existsSync(path.join(p.dirDatos, 'estado-web.json')));
    assert.equal((await p.api('/api/web/encender', { metodo: 'POST', cuerpo: {} })).estado, 409, 'encendida no se toca');
    assert.equal(p.estado.actual, anterior);
    const registro = (await p.api('/api/registro')).datos;
    assert.deepEqual(registro.map(e => [e.accion, e.resultado]).slice(0, 4),
      [['Encender la web', 'error'], ['Encender la web', 'hecho'], ['Apagar la web', 'error'], ['Apagar la web', 'hecho']]);
    assert.equal(registro[0].quien, 'ordenador de Víctor');
    /* La segunda vez ya existe la página de mantenimiento: se vuelve a ella
       sin subir nada (así se puede apagar también desde la nube). */
    const desplieguesAntes = p.estado.despliegues.length;
    const otra = await p.api('/api/web/apagar', { metodo: 'POST', cuerpo: { confirmacion: 'APAGAR' } });
    assert.equal(otra.datos.via, 'vuelta');
    assert.equal(p.estado.despliegues.length, desplieguesAntes);
    assert.equal((await p.api('/api/interruptores')).datos.web.enMantenimiento, true);
    await p.api('/api/web/encender', { metodo: 'POST', cuerpo: {} });
    assert.equal(p.estado.actual, anterior);
  } finally { await p.cerrar(); }
});

test('sin la clave de Cloudflare no deja apagar y lo explica', async () => {
  const p = await montar({ CLOUDFLARE_API_TOKEN: '' });
  try {
    const r = await p.api('/api/web/apagar', { metodo: 'POST', cuerpo: { confirmacion: 'APAGAR' } });
    assert.equal(r.estado, 409);
    assert.equal(r.codigo, 'falta-credencial');
    assert.equal((await p.api('/api/trafico?periodo=7d')).codigo, 'falta-credencial');
    assert.equal((await p.api('/api/interruptores')).datos.puedeApagar, false);
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
    assert.ok(uso.serie.every((f, i) => i === 0 || Date.parse(f.hora) - Date.parse(uso.serie[i - 1].hora) === 3600000), 'horas seguidas');
    const hoy = new Date().toISOString().slice(0, 10);
    assert.ok(fs.existsSync(path.join(p.dirDatos, `uso-app-${hoy}.json`)));
    assert.ok(fs.existsSync(path.join(p.dirDatos, `descargas-${hoy}.json`)));
    assert.ok(datos.historial.diasConUso >= 1);
    assert.equal(datos.historial.usoPorDia.length, 30);
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

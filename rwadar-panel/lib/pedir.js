/* RWAdar · panel · peticiones a servicios externos y errores con sentido.
   Cada error lleva un mensaje que Víctor pueda leer sin saber de HTTP. */
'use strict';

const ESPERA_MS = 12000;

class ErrorPanel extends Error {
  constructor(mensaje, { estado = 500, codigo = 'error', detalle = null } = {}) {
    super(mensaje);
    this.estado = estado;
    this.codigo = codigo;
    this.detalle = detalle;
  }
}

/* Falta una credencial en .env.local: el panel lo dice en vez de fallar. */
class FaltaCredencial extends ErrorPanel {
  constructor(servicio, para) {
    super(`Falta la clave de ${servicio} para ${para}. Mira la pestaña Ajustes.`,
      { estado: 409, codigo: 'falta-credencial', detalle: { servicio } });
  }
}

function mensajeRemoto(datos, texto) {
  if (datos && typeof datos === 'object') {
    const e = datos.errors?.[0]?.message || datos.msg || datos.message ||
      datos.error_description || datos.error || datos.hint;
    if (e) return String(e).slice(0, 300);
  }
  return String(texto || '').replace(/\s+/g, ' ').slice(0, 200) || 'sin detalle';
}

async function pedir(url, { method = 'GET', headers = {}, cuerpo, espera = ESPERA_MS, redirect = 'follow' } = {}) {
  const inicio = performance.now();
  let res;
  try {
    res = await fetch(url, {
      method,
      redirect,
      cache: 'no-store',
      headers: cuerpo === undefined ? headers : { 'Content-Type': 'application/json', ...headers },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(espera),
    });
  } catch (e) {
    const motivo = e?.name === 'TimeoutError' ? `no respondió en ${espera / 1000} s` : 'no se pudo conectar';
    throw new ErrorPanel(`${new URL(url).host} ${motivo}`, { estado: 502, codigo: 'sin-conexion' });
  }
  const texto = await res.text();
  let datos = null;
  try { datos = texto ? JSON.parse(texto) : null; } catch { datos = null; }
  return { estado: res.status, ok: res.ok, cabeceras: res.headers, texto, datos, ms: Math.round(performance.now() - inicio) };
}

/* Como pedir(), pero un estado no 2xx se convierte en error legible. */
async function pedirJson(url, opciones = {}) {
  const r = await pedir(url, opciones);
  if (!r.ok) {
    throw new ErrorPanel(`${new URL(url).host} respondió ${r.estado}: ${mensajeRemoto(r.datos, r.texto)}`,
      { estado: 502, codigo: 'remoto' });
  }
  return r;
}

/* Memoria corta para no pedir 20 veces lo mismo al cambiar de pestaña. */
function crearCache() {
  const valores = new Map();
  return {
    async obtener(clave, segundos, producir) {
      const guardado = valores.get(clave);
      if (guardado && guardado.hasta > Date.now()) return guardado.valor;
      const valor = await producir();
      valores.set(clave, { valor, hasta: Date.now() + segundos * 1000 });
      return valor;
    },
    olvidar(prefijo) {
      for (const clave of valores.keys()) if (clave.startsWith(prefijo)) valores.delete(clave);
    },
  };
}

module.exports = { ErrorPanel, FaltaCredencial, pedir, pedirJson, crearCache, mensajeRemoto };

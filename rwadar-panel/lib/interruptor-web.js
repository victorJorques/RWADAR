/* =====================================================================
   RWAdar · panel · encender y apagar la web
   ---------------------------------------------------------------------
   APAGAR pone en producción la página de mantenimiento de
   rwadar-panel/mantenimiento/ (responde 503 con «Volvemos enseguida»,
   que es lo que Google entiende como pausa y no como cierre). Antes
   apunta qué despliegue estaba en producción.
     · Si esa página ya se subió alguna vez, basta con pedirle a
       Cloudflare que vuelva a ella: segundos, desde cualquier sitio.
     · Si nunca se subió, hay que subirla con wrangler, y eso solo puede
       hacerlo el panel del ordenador (subirMantenimiento).

   ENCENDER le pide a Cloudflare que vuelva al despliegue apuntado: es la
   misma web exacta que había, sin reconstruir ni volver a publicar.

   Por eso no se deja apagar sin el token de Cloudflare: sin él no
   habría forma de volver a encender desde aquí.

   Solo usa fetch y un almacén (archivos en el ordenador, KV en la nube).
   ===================================================================== */
'use strict';
const { ErrorPanel, pedir } = require('./pedir');
const { MARCA, CABECERA } = require('./constantes');

const CLAVE = 'estado-web';

function crearInterruptorWeb({ config, cloudflare, almacen, subirMantenimiento = null }) {
  async function estado() {
    const r = await pedir(`${config.web}/`, { redirect: 'manual' });
    const enMantenimiento = r.cabeceras.get(CABECERA) === 'si';
    return {
      encendida: r.ok && !enMantenimiento,
      enMantenimiento,
      estadoHttp: r.estado,
      ms: r.ms,
      guardado: await almacen.leer(CLAVE),
    };
  }

  async function despliegueBueno() {
    const lista = await cloudflare.desplieguesProduccion();
    return lista.find(d => d.estado === 'success' && !d.mensaje.includes(MARCA)) || null;
  }

  async function apagar({ quien = null } = {}) {
    if ((await estado()).enMantenimiento) throw new ErrorPanel('La web ya está apagada', { estado: 409 });
    const anterior = (await cloudflare.produccionActual()) || (await despliegueBueno());
    if (!anterior || anterior.mensaje.includes(MARCA)) {
      throw new ErrorPanel('No encuentro el despliegue actual en Cloudflare: no apago para no dejarte sin forma de volver', { estado: 409 });
    }
    const mantenimiento = await cloudflare.buscarMantenimiento(MARCA);
    if (!mantenimiento && !subirMantenimiento) {
      throw new ErrorPanel('La página de mantenimiento todavía no está en Cloudflare. La primera vez hay que apagar desde el panel del ordenador de Víctor; después ya se puede desde cualquier sitio.', { estado: 409 });
    }
    await almacen.guardar(CLAVE, { apagadaEl: new Date().toISOString(), anterior, quien });
    try {
      if (mantenimiento) await cloudflare.volverA(mantenimiento.id);
      else await subirMantenimiento();
    } catch (e) {
      await almacen.borrar(CLAVE);
      throw e;
    }
    return { apagada: true, anterior, via: mantenimiento ? 'vuelta' : 'subida' };
  }

  async function encender() {
    /* Si mientras estaba apagada alguien publicó una web nueva, volver al
       despliegue guardado la pisaría con una más vieja: no se toca nada. */
    if (!(await estado()).enMantenimiento) {
      await almacen.borrar(CLAVE);
      throw new ErrorPanel('La web ya está encendida: no hay nada que encender', { estado: 409 });
    }
    const guardado = await almacen.leer(CLAVE);
    const destino = guardado?.anterior?.id ? guardado.anterior : await despliegueBueno();
    if (!destino) throw new ErrorPanel('No encuentro a qué despliegue volver. Publica la web con rwadar-publicar.js', { estado: 409 });
    const vuelta = await cloudflare.volverA(destino.id);
    await almacen.borrar(CLAVE);
    return { encendida: true, despliegue: { ...destino, ...vuelta } };
  }

  return { estado, apagar, encender };
}

module.exports = { crearInterruptorWeb, MARCA, CABECERA };

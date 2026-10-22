/* RWAdar · panel en la nube · almacén en Cloudflare KV.
   Misma forma que lib/almacen-archivos.js. El registro se guarda como
   metadatos de claves con la fecha invertida, para que KV las liste de
   la más nueva a la más vieja sin leerlas una a una. */

const TOPE = 9999999999999;
const MAX_LEIDAS = 300;
const NOMBRE = /^[a-z0-9-]+$/;

const recortar = (texto, n) => texto == null ? null : String(texto).slice(0, n);

export function crearAlmacenKv(kv) {
  const clave = nombre => {
    if (!NOMBRE.test(nombre)) throw new Error(`Clave de almacén no válida: ${nombre}`);
    return `estado:${nombre}`;
  };
  return {
    async leer(nombre) { return kv.get(clave(nombre), 'json'); },
    async guardar(nombre, valor) { await kv.put(clave(nombre), JSON.stringify(valor)); },
    async borrar(nombre) { await kv.delete(clave(nombre)); },
    async anotar({ accion, objetivo = null, resultado, detalle = null, quien = null }) {
      const entrada = { fecha: new Date().toISOString(), accion, objetivo: recortar(objetivo, 200), resultado, detalle: recortar(detalle, 300), quien: recortar(quien, 120) };
      const orden = String(TOPE - Date.now()).padStart(13, '0');
      await kv.put(`registro:${orden}:${crypto.randomUUID().slice(0, 8)}`, '', { metadata: entrada });
      return entrada;
    },
    async registro(limite = MAX_LEIDAS) {
      const { keys } = await kv.list({ prefix: 'registro:', limit: limite });
      return keys.map(k => k.metadata).filter(Boolean);
    },
  };
}

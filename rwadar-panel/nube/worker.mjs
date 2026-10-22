/* RWAdar · panel en la nube · punto de entrada del Worker.
   publicos.json lo escribe nube/publicar.mjs a partir de
   rwadar-publicacion-segura.js antes de cada subida. */
import publicos from './generado/publicos.json';
import { crearManejador } from './manejador.mjs';

export default crearManejador(publicos);

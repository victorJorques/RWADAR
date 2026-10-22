/* RWAdar · panel · constantes compartidas por el panel local, el de la
   nube y la página de mantenimiento. */
'use strict';

/* Mensaje con el que se sube la página de mantenimiento a Cloudflare:
   así se reconoce ese despliegue en la lista. */
const MARCA = 'RWADAR-MANTENIMIENTO';
/* Cabecera que pone la página de mantenimiento en todas sus respuestas. */
const CABECERA = 'x-rwadar-mantenimiento';

const CUENTA_CLOUDFLARE = '52d07be006e7a27f5f793c59e1796b13';
const SITIO_ANALITICA = 'ddbd2a3f31ab43dfaf0c854a02ab34d8';
const REPO_DESCARGAS = 'victorJorques/RWAdar-downloads';
const REPO_FUENTE = 'victorJorques/RWADAR';

module.exports = { MARCA, CABECERA, CUENTA_CLOUDFLARE, SITIO_ANALITICA, REPO_DESCARGAS, REPO_FUENTE };

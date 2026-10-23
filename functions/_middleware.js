import { crearAccesoServidor } from '../rwadar-acceso/servidor.mjs';

const acceso = crearAccesoServidor();
export const onRequest = context => acceso.atender(context);

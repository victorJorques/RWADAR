#!/usr/bin/env node
/* RWAdar · panel en modo demostración.
       npm run panel:demo
   Arranca el simulador y el panel en http://127.0.0.1:4181 con datos
   inventados. No lee .env.local ni habla con Cloudflare, Supabase o
   GitHub: se puede pulsar cualquier botón sin miedo. */
'use strict';
const path = require('path');
const { crearSimulador, entornoPanel } = require('./simulador');
const { cargarConfig } = require('../lib/config');
const { crearPanel } = require('../servidor');

const PUERTO_DEMO = 4181;
const { servidor: simulador } = crearSimulador();

simulador.listen(0, '127.0.0.1', () => {
  const base = `http://127.0.0.1:${simulador.address().port}`;
  const entorno = {
    ...entornoPanel(base),
    RWADAR_PANEL_PUERTO: String(PUERTO_DEMO),
    RWADAR_PANEL_DATOS: path.join(__dirname, '..', 'datos-demo'),
  };
  const config = cargarConfig(entorno, path.join(__dirname, 'no-existe.env'));
  const { servidor } = crearPanel(config);
  servidor.listen(config.puerto, '127.0.0.1', () => {
    process.stdout.write(`\nPanel de RWAdar · DEMOSTRACIÓN (datos inventados)\n  http://127.0.0.1:${config.puerto}\n\n`);
  });
});

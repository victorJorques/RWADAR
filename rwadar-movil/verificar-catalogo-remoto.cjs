/* Diagnóstico explícito de lectura: usa el lector móvil real sobre REST.
   No escribe en Supabase, no inicia sesión y no imprime claves ni payloads. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');
const { crearLectorCatalogo } = require('./lib/catalogo-remoto');

async function verificar() {
  assert.deepEqual(process.argv.slice(2), ['--lectura-remota'],
    'Uso: node verificar-catalogo-remoto.cjs --lectura-remota');
  const codigo = fs.readFileSync(path.join(__dirname, 'lib/supabase.js'), 'utf8');
  const url = codigo.match(/const URL = '(https:\/\/[^']+)'/)?.[1];
  const clave = codigo.match(/const CLAVE = '(sb_publishable_[^']+)'/)?.[1];
  assert.equal(url, 'https://exgpmjpaaebyoolpwced.supabase.co');
  assert.ok(clave, 'Solo se admite la clave publicable del cliente, nunca una credencial administrativa');
  const peticiones = [];
  const cliente = createClient(url, clave, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (destino, opciones = {}) => {
      assert.equal((opciones.method || 'GET').toUpperCase(), 'GET', 'Diagnóstico de solo lectura');
      const ruta = new URL(destino).pathname;
      assert.ok(ruta.startsWith('/rest/v1/'), 'No se permite llamar a Auth ni otros servicios');
      peticiones.push(ruta);
      return fetch(destino, { ...opciones, signal: AbortSignal.timeout(12000) });
    } },
  });
  const memoria = new Map();
  const lector = crearLectorCatalogo({ clientePublico: () => cliente,
    almacenamiento: {
      async getItem(k) { return memoria.get(k) || null; },
      async setItem(k, v) { memoria.set(k, v); },
      async removeItem(k) { memoria.delete(k); },
    },
  });
  const lote = await lector.cargar();
  assert.equal(lote.error, null, lote.error || 'El catálogo debe llegar íntegro desde REST');
  assert.equal(lote.deCache, false);
  assert.equal(lote.plataformas.length, 26);
  assert.equal(lote.ofertas.length, 28);
  assert.ok(lote.ofertas.filter(o => o.estadoRevision !== 'actual')
    .every(o => o.precio === null && o.rentabilidad === null));
  const cache = await lector.cargar({ soloCache: true });
  assert.equal(cache.revisionId, lote.revisionId);
  assert.equal(cache.deCache, true);
  assert.equal(peticiones.length, 2, 'La lectura de caché no debe llamar a la red');
  const descartes = await cliente.from('plataformas')
    .select('slug,fuentes(url,titulo)').eq('estado', 'descartada');
  assert.equal(descartes.error, null, 'Los descartes deben poder consultarse');
  assert.equal(descartes.data.length, 4);
  assert.ok(descartes.data.every(p => p.fuentes?.some(f => /^https:\/\//.test(f.url))));
  const interna = await fetch(`${url}/rest/v1/revisiones?select=id&limit=1`, {
    headers: { apikey: clave, 'Accept-Profile': 'rwadar_catalogo' },
    signal: AbortSignal.timeout(12000),
  });
  assert.equal(interna.status, 406, 'El esquema interno no debe exponerse por REST');
  assert.equal((await interna.json()).code, 'PGRST106');
  console.log(JSON.stringify({ verificadoEl: new Date().toISOString(),
    proyecto: 'exgpmjpaaebyoolpwced', revision: lote.revisionId, fechaRadar: lote.fecha,
    plataformas: lote.plataformas.length, ofertas: lote.ofertas.length,
    cifrasNoDocumentadasOcultas: true, descartesConFuente: descartes.data.length,
    cacheValidada: true, esquemaInternoNoExpuesto: true, escriturasRemotas: 0,
  }, null, 2));
}

verificar().catch(error => {
  // Las aserciones no reciben claves ni cuerpos REST como valores comparados.
  console.error(`Verificación móvil remota fallida: ${error.message}`);
  process.exitCode = 1;
});

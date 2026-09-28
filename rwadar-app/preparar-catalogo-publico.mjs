import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const {
  cargarFuentesLocales,
  construirSqlImportacion,
  validarFuentesLocales,
} = require('./catalogo-publico.js');

const directorio = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.join(directorio, '..');
const argumentos = process.argv.slice(2);
const opciones = {};
for (let i = 0; i < argumentos.length; i += 2) {
  const nombre = argumentos[i];
  const valor = argumentos[i + 1];
  if (!['--salida', '--revision'].includes(nombre) || !valor || valor.startsWith('--') || nombre in opciones) {
    console.error('Uso: node preparar-catalogo-publico.mjs [--revision AAAA-MM-DD] [--salida RUTA_LOCAL]');
    process.exit(1);
  }
  opciones[nombre] = valor;
}

const fuentes = cargarFuentesLocales(raiz, { revision: opciones['--revision'] });
const fechas = validarFuentesLocales(fuentes);
const generado = construirSqlImportacion(fuentes);

if (opciones['--salida']) {
  const destinoArgumento = opciones['--salida'];
  const destino = path.resolve(raiz, destinoArgumento);
  const raizPermitida = path.resolve(raiz, 'rwadar-app', 'data', 'importaciones') + path.sep;
  if (!destino.startsWith(raizPermitida) || path.extname(destino).toLowerCase() !== '.sql') {
    console.error('La salida debe ser un .sql dentro de rwadar-app/data/importaciones/.');
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, generado.sql, { encoding: 'utf8', flag: 'wx' });
  console.log(`SQL local creado: ${path.relative(raiz, destino)}`);
}

console.log(`Catálogo validado: 26 plataformas, 28 ofertas; radar ${fechas.fecha}, corte de ofertas ${fechas.fechaOfertas}.`);
console.log(`Revisión local: ${generado.revisionId}; SHA-256 ${generado.hash}.`);
console.log('Estado de importación: BORRADOR. No se ha contactado ni modificado Supabase.');

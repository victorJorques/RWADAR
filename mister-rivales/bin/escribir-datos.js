/* escribir-datos.js · deja los datos en los tres sitios donde hacen falta.
   - datos.json  para las máquinas (el robot, las pruebas, otra app)
   - datos.js    para el navegador abriendo index.html con doble clic
                 (file:// no deja hacer fetch de un .json, pero sí cargar
                 un <script>; sin esto la app estaría vacía en local)
   - historico/  una foto por actualización, que es lo que permite ver
                 luego cómo evoluciona el saldo de cada rival */
const fs = require('fs');
const path = require('path');

module.exports = function escribir(datos, carpeta) {
  const json = JSON.stringify(datos, null, 1);
  fs.writeFileSync(path.join(carpeta, 'datos.json'), json + '\n');
  fs.writeFileSync(path.join(carpeta, 'datos.js'),
    '/* Generado por mister-rivales. No editar a mano. */\n' +
    'globalThis.DATOS_MISTER = ' + json + ';\n');

  const dir = path.join(carpeta, 'historico');
  fs.mkdirSync(dir, { recursive: true });
  const sello = (datos.capturado || new Date().toISOString()).replace(/[:.]/g, '-').slice(0, 19);
  fs.writeFileSync(path.join(dir, sello + '.json'), json + '\n');

  // El histórico no crece sin freno: se guardan las 90 últimas fotos.
  const fotos = fs.readdirSync(dir).filter(function (f) { return /\.json$/.test(f) && f !== 'base.json'; }).sort();
  fotos.slice(0, Math.max(0, fotos.length - 90)).forEach(function (f) { fs.unlinkSync(path.join(dir, f)); });

  return { json: path.join(carpeta, 'datos.json'), fotos: fotos.length };
};

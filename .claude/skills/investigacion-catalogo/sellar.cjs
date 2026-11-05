// Sella el commit actual (HEAD) para «Publicar web»: estado.json con el commit y la huella del contenido.
// Uso (desde la raíz, con el árbol limpio): node sellar.cjs "nota"
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const raiz = process.cwd();
const { huellaContenidoAprobado, comprobarRevisionGitPublicable } = require(path.join(raiz, 'rwadar-publicacion-segura.js'));
if (execSync('git status --porcelain=v1 --untracked-files=all').toString().trim()) throw new Error('árbol sucio');
const p = path.join(raiz, 'rwadar-app/data/relanzamiento/estado.json');
const e = JSON.parse(fs.readFileSync(p, 'utf8'));
e.actualizadoEl = new Date().toISOString().slice(0, 10);
e.nota = process.argv[2] || e.nota;
e.revisionAprobada.commit = execSync('git rev-parse HEAD').toString().trim();
e.revisionAprobada.contenidoSha256 = huellaContenidoAprobado(raiz);
fs.writeFileSync(p, JSON.stringify(e, null, 2) + '\n');
console.log(JSON.stringify(e.revisionAprobada));

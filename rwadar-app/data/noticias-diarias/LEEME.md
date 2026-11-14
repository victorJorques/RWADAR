# Noticias del sector automáticas: una carpeta por mañana

Aquí deja cada mañana automática (skill
[`noticias-automaticas`](../../../.claude/skills/noticias-automaticas/SKILL.md))
su edición verificada, en `AAAA-MM-DD/`. Solo llega a Git si la mañana pasó
todas las compuertas hasta el sello; un día frenado no deja carpeta.

Lista cerrada de archivos (la comprueba la regla V-15; solo `.json`, `.md` y
`.txt`, como mucho 200 kB en total, sin PDF ni HTML ni texto entero de las
fuentes):

| Archivo | Qué es | Quién lo escribe |
|---|---|---|
| `noticias-<fecha>.json` | La edición, byte a byte la de `rwadar-site/datos/noticias-v2.json` | el editor (y las correcciones del verificador, aplicadas por el programa) |
| `titulares.json` | Las propuestas de titular (3 por idioma), la elegida y la foto con su encaje | el editor |
| `barrido.json` | Lo que leyó el programa en la lista cerrada de fuentes (solo lo del sector, sin nombres) | el programa |
| `inventario-fuentes.json` | Cada fuente de la edición abierta por el programa: hora, HTTP y SHA-256 | el programa |
| `verificacion.json`, `VERIFICACION.md` | El veredicto del verificador independiente, atado al SHA-256 de la edición | el verificador |
| `verificacion-2.json`, `VERIFICACION-2.md`, `correcciones.json` | El segundo pase, si hubo correcciones | el verificador y el programa |
| `EDICION.md`, `inventario-consultas.txt` | Las notas del editor (se copian cuando el verificador ya terminó) | el editor |
| `validacion.json` | Las reglas V-1 … V-15 de la fase final | el programa |

Las copias en bruto de las fuentes no vienen aquí: se quedan en la carpeta de
trabajo de la sesión, fuera del repositorio. Sin datos personales en ningún
archivo (regla V-11, sobre todos los archivos de la carpeta).

Para volver a la edición de un día (solo con orden de la dirección):
`node .claude/skills/noticias-automaticas/noticias-auto.mjs volver --a <fecha>`.

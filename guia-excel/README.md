# Hoja a hoja · guía interactiva de Excel

Proyecto **aparte de RWAdar**: vive solo en la rama `claude/fervent-darwin-a1rmid`
y no se une a `main`. Es el código y el contenido de la guía de Excel publicada
como página privada en claude.ai:
<https://claude.ai/artifact/GwL1uLSZ8QTe2zJwHc7XA3>

La guía va del nivel 0 a llevar proyectos sola en una empresa:
- 7 niveles, 28 módulos, 98 lecciones y unos 1.000 ejercicios;
- un examen por nivel y una prueba de nivel al principio;
- 8 proyectos de empresa;
- examen final y certificado.

Todo pasa en una empresa inventada, Electro Cierzo Suministros (Zaragoza).

## Qué hay en cada carpeta

| Carpeta o archivo | Qué es |
|---|---|
| `app/` | La aplicación: `motor.js` (corrige fórmulas del Excel en español con HyperFormula), `app.js` (mapa, lecciones, exámenes, progreso), `estilos.css` y `cinta.json` (la cinta de opciones). |
| `contenido/` | Las lecciones por módulo (`n0m1.json` … `n6m3.json`), los exámenes de nivel, la prueba de nivel, el examen final y la hoja libre. |
| `proyectos/` | Los 8 proyectos (`p1.json` … `p8.json`). |
| `libros/` | Los archivos de Excel, CSV y ZIP que se descargan desde la guía, con sus fichas `.meta.json`. Los generadores están en `libros/src/`. |
| `research/` | La investigación: temario (`blueprint.json`), pedagogía, empresa, nombres de Excel en español (`es-referencia.json`) y `verificaciones.md`, que manda sobre lo demás. |
| `scripts/` | Ayudas para redactar módulos y la prueba de nivel. |
| `GUIA-AUTORES.md` | Las normas para escribir lecciones (método, formato y juego). |
| `ejemplo-modulo.json` | Un módulo de ejemplo con todos los tipos de bloque y de ejercicio. |

## Cómo se monta y se prueba

```bash
cd guia-excel
npm install                     # solo HyperFormula, para las pruebas del motor
node construir.cjs              # crea dist/hoja-a-hoja.html y dist/libros/*.b64.txt
node validar.cjs                # comprueba todo el contenido: debe salir «0 errores»
node robot.cjs dist/hoja-a-hoja.html            # juega las 98 lecciones y los 7 exámenes
node robot.cjs dist/hoja-a-hoja.html n0m1l1     # o solo las lecciones que digas
node probar-guardado.cjs        # prueba dónde se guarda el progreso (con y sin permiso)
node capturar-pantallas.cjs     # capturas en capturas/ (bienvenida, mapa, cofre, perfil) y crea dist/_v7.html
node probar-reinicio.cjs dist/_v7.html   # «Empezar de cero» y nombre obligatorio en la bienvenida
node probar-entreno.cjs dist/_v7.html    # una tanda de entrenamiento diario con fallos
ANCHO=390 CAPTURAS=capturas node robot.cjs dist/hoja-a-hoja.html n0m3l1   # el robot también hace capturas
```

## La capa de juego (versión 7)

- **A1, la mascota:** la celda seleccionada del logotipo, con cara. Presenta la
  bienvenida, reacciona en la barra de abajo (contenta al acertar, dando ánimo
  al fallar), celebra en los resultados y señala en el mapa la lección que toca.
- **Un solo botón abajo:** «Comprobar» (o «Ver qué pasa») mientras hay que
  responder y «Continuar» después; el botón del propio ejercicio queda oculto.
- **Al jugar:** combos de aciertos seguidos con llama y XP extra, y estrellas y
  puntos que aparecen con animación en los resultados.
- **Cofres:** uno al acabar cada módulo, con XP al azar y un truco de regalo.
- **Tarjeta de empleada:** con el nombre y el puesto, que sube con la
  experiencia; sale al final de la bienvenida y en «Mi progreso».
- **Mapa:** cada nivel tiene su color.
- **Bienvenida:** el nombre es obligatorio y no se puede saltar.
- **«Empezar de cero»:** en «Mi progreso», con confirmación. Deja una marca para
  que ninguna copia anterior (de otro navegador o de la cuenta) vuelva a colarse.

El robot y las pruebas usan Playwright con Chromium.

## Cómo se publica

Se publica desde una sesión de Claude con la herramienta de páginas (Artifact),
en la misma dirección de arriba:
- **la página:** `dist/hoja-a-hoja.html`;
- **los libros:** van como archivos aparte, `libros/<archivo>.b64.txt`. El visor
  no sirve .xlsx ni .zip, así que se publican en base64 y la página los
  reconstruye al descargar.

Capacidades de la página:
- **`db` y `user`:** guardan el progreso en la cuenta, en
  `data/users/<id>/progreso`.
- **`downloads`:** descarga los libros, los certificados y la copia del
  progreso.
- **`sample`:** la tutora IA.

## El progreso de la alumna

- **Siempre se guarda en el navegador.**
- **En la cuenta solo se guarda si tiene permiso para escribir.** Hace falta
  invitarla por correo con permiso para editar o, en un plan de equipo, como
  colaboradora. Quien solo puede ver la página no puede escribir en la cuenta.
- **La guía lo comprueba al abrirse.** Si no puede guardar en la cuenta, se lo
  dice en el mapa y le ofrece descargar una copia (.json). Esa copia se vuelve
  a cargar desde «Mi progreso».

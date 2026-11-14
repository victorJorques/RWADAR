# Verificador de las noticias de la mañana

Instrucciones del **verificador** (un subagente nuevo, sin el contexto de la
sesión ni del editor) de la skill `noticias-automaticas`. La sesión no le
escribe el encargo a mano: lo saca, literal, con

    node .claude/skills/noticias-automaticas/noticias-auto.mjs encargo --rol verificador --fecha <fecha>
    node .claude/skills/noticias-automaticas/noticias-auto.mjs encargo --rol verificador-2 --fecha <fecha>   (segundo pase)

El encargo no nombra las notas del editor. **No las busques**: el verificador
juzga la edición contra las fuentes, no contra el razonamiento de quien la
escribió.

## Qué comprueba, noticia a noticia

1. **Abre la fuente** (`fuente.url`) tú mismo: hora UTC, HTTP, SHA-256 de lo
   que recibes. Si no responde, `"caida": true` y la noticia solo vale si está
   letra a letra como la publicada (con su `consultadaEl` de antes).
2. **El titular** (castellano e inglés) dice lo que dice la fuente, sin
   exagerar ni prometer. Copia en `literal` una cita corta de la fuente (como
   mucho 400 caracteres) que lo respalde, **sin nombres de personas** (elige
   otra frase si la que respalda nombra a alguien).
3. **El resumen y «por qué importa»** no afirman nada que la fuente no diga.
   «No hay» solo si se puede probar; si no, «no hemos hallado».
4. **La fecha** es la del documento de la fuente; «Hoy» solo de hoy o de ayer.
5. **La foto** encaja con la noticia y no engaña (por ejemplo, una alerta para
   una noticia que no es de riesgo), y no se repite en la edición.
6. **Sin personas**: ningún nombre de persona física, tratamiento, cargo con
   nombre, correo ni teléfono. **Esto lo compruebas tú, literal, en cada
   noticia**: lee entero cada texto que se publica (titular, resumen, «por qué
   importa» y título informativo, en castellano y en inglés) y tu `literal`.
   El programa (V-11) solo caza un nombre con tratamiento o cargo delante, un
   correo o un teléfono; **no** caza un nombre suelto («la presidenta del BCE,
   Nombre Apellido», «Apellido dijo», «según Apellido»). Si ves uno, la
   noticia es `corregir` (quitando el nombre: «la presidenta del BCE») o
   `quitar`, y nunca `"personas": false`. Ante la duda (¿es una persona o una
   marca?), trátalo como persona.
7. **Lo que falta**: si en `barrido.json` hay algo de hoy o de ayer más
   importante que lo elegido, dilo en `faltaAlgo` (no cambia el veredicto por
   sí solo).

## Qué escribe

En la carpeta que dice el encargo:

- `verificacion.json` (o `verificacion-2.json` en el segundo pase):

  ```json
  {
    "version": 1, "pase": 1, "fecha": "<fecha>",
    "edicionSha256": "<sha256sum del JSON que has verificado>",
    "veredicto": "conforme | con_cambios | rechazado",
    "noticias": [
      { "id": "…", "veredicto": "confirmada | corregir | quitar",
        "fuente": { "url": "…", "http": 200, "horaUtc": "…", "sha256": "…", "caida": false },
        "literal": "cita corta de la fuente",
        "titularRespaldado": true, "fotoAdecuada": true, "personas": false, "fechaCorrecta": true }
    ],
    "hoyCorrecto": true, "faltaAlgo": [],
    "correcciones": []
  }
  ```

  - **conforme**: todas `confirmada`, sin correcciones (`"correcciones": []`).
  - **con_cambios** (solo en el pase 1): lista exacta de correcciones, que un
    programa aplica tal cual. Cada una es
    `{"id", "campo", "antes", "despues", "motivo"}` con `campo` entre
    `titulo`, `en.titulo`, `resumen`, `en.resumen`, `porQueImporta`,
    `en.porQueImporta`, `tituloInformativo`, `en.tituloInformativo`,
    `imagen`, `seccion`, y `antes` copiado **letra a letra** del JSON; o
    `{"id", "quitar": true, "motivo"}`. Nada de «reescribir»: si hace falta
    más que eso, `rechazado`.
  - **rechazado**: la edición no se puede publicar hoy. Di por qué.
  - En el **segundo pase** solo vale `conforme` o `rechazado`: compruebas que
    las correcciones están aplicadas y que lo demás no ha cambiado.
- `VERIFICACION.md` (o `VERIFICACION-2.md`): en castellano llano, una tabla
  con cada noticia y su veredicto, y por cada una la URL, la hora, el HTTP, el
  SHA-256 y la cita. Sin datos personales y sin las palabras «nombramiento»,
  «nombrado», «se nombra», «cese de» ni «appointed» (el programa para la
  mañana si las ve; para decir que no hay personas, escribe «sin personas»).

La huella: `sha256sum <ruta del JSON>`; tiene que ser la del archivo que
verificaste. Si el JSON cambia después, tu veredicto deja de valer.

## Encargo literal (lo saca `noticias-auto.mjs encargo --rol verificador`)

<!-- ENCARGO -->
Eres el VERIFICADOR independiente (pase {PASE}) de las noticias del sector de RWAdar del {FECHA}. No escribiste ni elegiste estas noticias. Trabajas solo y sin preguntar.

1. Lee {REPO}/.claude/skills/noticias-automaticas/VERIFICADOR.md (tus reglas) y {REPO}/rwadar-editorial-source/noticias/GUIA-TITULARES.md (la guía; si no existe, veredicto «rechazado»).
2. Lo que verificas: {EDICION} (la edición), {TITULARES} (las propuestas de titular y la foto elegida). Correcciones previas: {CORRECCIONES}. Para contrastar: {TRABAJO}/barrido/barrido.json, {TRABAJO}/fuentes/inventario-fuentes.json (lo que abrió el programa), {TRABAJO}/cerrojo/produccion-noticias-v2.json (lo publicado ahora) y {REPO}/rwadar-editorial-source/noticias/fotos.json.
3. No leas nada más de la carpeta de trabajo ni busques notas del editor. Abre tú mismo cada fuente.
4. Escribe {SALIDA_VERIFICADOR}/{VERIFICACION} y {SALIDA_VERIFICADOR}/{INFORME} con la forma de VERIFICADOR.md. edicionSha256 = sha256sum de {EDICION}.
5. No cambies la edición ni nada del repositorio: tú solo juzgas.

Responde SOLO con una línea: «HECHO: <veredicto>» (o «NO PUDE: <motivo en 10 palabras>»).
<!-- /ENCARGO -->

# Traspaso entre Codex y Claude

Cada sesión que cambie algo añade una entrada **arriba del todo**: qué hizo,
en qué commits, qué pruebas pasó y qué queda pendiente. Así la otra
herramienta sabe dónde está todo sin tener que adivinarlo.

---

## 14 de noviembre de 2026 (28) · Claude · Recuadro «Activa los avisos» en la ventana de novedades · SIN PUBLICAR (rama `aviso-activar-notificaciones`, solo commit local)

- **Encargo de la dirección (14/11):** «que para activar las notificaciones
  salga el aviso al salir la notificación de novedades al entrar a la app,
  para recordar e incitar a la gente a que las activen».
- **Qué cambia (web y app):** dentro de la ventana «Novedades de RWAdar»,
  debajo de los puntos, el recuadro **«Activa los avisos»** («Recibe cada
  novedad en el móvil, como un WhatsApp. Es gratis y puedes quitar los avisos
  cuando quieras.») con el botón **«Activar avisos»**: cierra la ventana (cuenta
  como vista) y lleva a Perfil › Avisos (web `/#perfil-avisos`; app
  `irAAvisosPerfil()`). Solo sale si en ese dispositivo las notificaciones
  no están ya activas (web: permiso y suscripción de push del navegador,
  `estadoAvisosNavegador` del modelo; app: el interruptor «Notificaciones en
  este móvil» y además «Avisos de novedades» encendido, `estadoAvisosMovil`
  de `lib/novedades-rwadar.js`); si no se sabe, sale. En el ordenador también
  sale (Perfil › Avisos explica que se activan desde el móvil y deja encender
  el correo de novedades). No pide permisos. Inglés en `UI` de la web y en el
  diccionario común (`lib/idioma-en.js`, copiado a la web).
- **JSON sin campos nuevos;** versión **2026-11-14.2** (la ventana vuelve a
  salir una vez a todos) y copia de la app al día.
- **Lo visto en la app, en una clave nueva** (`novedades.vista.v2`, en
  `lib/datos.js`): la OTA se aplica en el arranque siguiente, así que el
  primero tras publicar aún corre la versión vieja, que podía enseñar la
  2026-11-14.2 sin el recuadro y darla por vista. Si solo hay v1 y dice
  2026-11-14.2 o posterior, se lee como 2026-11-14: sale una vez más, con el
  recuadro. Se escribe también la v1 por si se vuelve atrás. **La OTA y la
  web se pueden publicar el mismo día** (mejor primero la OTA). Escrito en
  `NOVEDADES-RWADAR-2026-11-12.md`.
- **Pruebas:** `npm run test:web` (probar-web 723 correctas), `npm --prefix
  rwadar-movil test` (679 correctas, 2 omitidas de siempre),
  `novedades-producto-navegador` en Chromium (1 de 1: sale sin avisos, no
  sale con ellos, «Activar avisos» lleva a Perfil › Avisos y marca vista,
  320 px con letra al 200 %), guardián de OTA con la base `fa30779…`
  `ok:true`.

---

## 14 de noviembre de 2026 (27) · Claude · Ventana «Novedades» del 14/11 y noticias de cada mañana · PUBLICADO (OTA n.º 32, web n.º 101 revisión y n.º 102 producción, PR #147 y sello #148)

- **Encargo de la dirección (14/11):** «haz que las notificaciones salgan y lo
  nuevo que hemos puesto, que salga y publica». La notificación ya había
  salido (anuncio n.º 3, «El mercado, en directo, y noticias con foto», 12:12
  UTC, otra sesión). Faltaba que **la ventana que sale al abrir** la web y la
  app lo contara: seguía con lo del 12/11.
- **Qué cambia:** `novedades-producto.json` pasa a la versión **2026-11-14**
  (vuelve a salir una vez a todos): el mercado en directo (cada 5 minutos,
  pestaña «24 h»), las noticias con foto, los avisos en el móvil y la
  calculadora; el detalle conserva lo del 11 y el 12/11. Dos iconos nuevos
  (`grafico` y `noticias`) iguales en la web y en la app; la descripción de
  /novedades-rwadar/ al día. Pruebas actualizadas a la versión nueva (solo
  fechas y contenido de la edición; se añaden comprobaciones).
- **Una revisión** (un revisor independiente): sin bloqueos; 6 arreglos
  menores aplicados (descripción de la página, «crédito privado», «últimas
  24 horas», «tokenised», «hoy 4», y **con iconos nuevos, primero la OTA y
  después la web**, ya escrito en `NOVEDADES-RWADAR-2026-11-12.md`).
- **Pruebas:** `npm run test:web` (salida 0), `npm --prefix rwadar-movil test`
  (675 correctas, 2 omitidas de siempre), `novedades-producto-navegador` en
  Chromium (390 y 1366, en inglés también), guardián de OTA con la base
  `fa30779…` `ok:true`; CI del PR y del sello en verde.
- **Publicado y comprobado en vivo:** OTA n.º 32 (primero), «Publicar web»
  revisión (n.º 101) y producción (n.º 102). `https://rwadar.pages.dev/datos/novedades-producto.json`
  da `2026-11-14`; el directo responde 200 y la web lo usa
  (`data-mercado-origen="directo"`). No se envió otra notificación: la del
  12:12 ya anunciaba lo mismo.
- **Noticias de cada mañana (lo que fallaba):** la tarea abría cada mañana una
  sesión nueva **sin el repositorio** (ni el entorno «RWADAR noticias» que
  creó otra sesión lo clonaba). Arreglo preparado: una **sesión fija con el
  repositorio** («Noticias automáticas de RWAdar (sesión fija con el
  repositorio)», etiqueta `rwadar-noticias-automaticas`); su prueba de
  arranque salió bien (repositorio, push en seco, herramientas de GitHub,
  red, Skill y Agent). **Falta crear la tarea programada que la despierte a
  las 08:32**: el control de permisos bloqueó `create_trigger` dos veces y
  necesita la aprobación expresa de Víctor. La tarea anterior sigue
  desactivada (sin repositorio, no sirve). Las noticias del 14/11 no
  salieron.

> **Estado al cerrar el 14/11 (coordinador):** publicado y comprobado en vivo
> lo de (23) a (26). El directo responde 200 en `/api/tokenizacion/directo` y
> la web lo usa (`data-mercado-origen="directo"`). La tarea de las noticias
> existe, pero el ensayo de las 11:35 UTC paró sin hacer nada: la sesión nueva
> no trae el repositorio (el entorno «Rwadar Con Internet» no tiene
> `victorJorques/RWADAR` en Repositories) ni la herramienta add_repo. Hasta que
> Víctor lo añada en los ajustes del entorno, cada mañana frena y avisa sin
> publicar. Desde hoy rige en `CLAUDE.md`: una sola revisión del trabajo.

## 14 de noviembre de 2026 (26) · Claude · Noticias que entran por los ojos · PUBLICADO (web n.º 100, OTA n.º 31, PR #143)

- **Encargo de la dirección (13/11):** «que las noticias tengan titulares
  buenos y se priorice lo visual y la imagen, que atraiga». Es la tercera de
  las tres mejoras que se construyen a la vez (gráfico en directo, noticias
  solas con freno y esta); las une un integrador. Rama
  **`worktree-wf_1f50042c-37c-1`**, desde `main` en `a4a594f` (sellado). La
  empezó otra sesión, que se cortó cuando se reinició la máquina con dos
  commits hechos (`5d3053c` y `5c633b8`, rama `worktree-wf_dfb920ce-e87-3`);
  esta sesión los trajo, los revisó, arregló una prueba, midió, capturó y
  cerró. **SIN PUBLICAR NI ENCENDER**: ni push, ni flujos, ni Supabase, ni
  EAS, ni OTA. Plan y revisión del diseño, en el scratchpad de la sesión
  (`automatico/visual/PLAN.md` y `etapas-previas.json`).
- **Qué cambia, en llano:**
  1. **La primera noticia es una portada**: foto grande y, encima, sobre un
     velo oscuro, la categoría, «fuente · fecha» y el titular. Las demás, en
     tarjetas con su foto (dos columnas en el móvil; en escritorio, la portada
     ocupa dos columnas y dos filas y las tarjetas llevan el titular sobre la
     foto). Igual en Inicio, en «Mercado y noticias» (/mercado/, adonde lleva
     /noticias/) y en la app. Con la letra grande, la rejilla pasa sola a una
     columna (cortes en em) y la portada crece; ningún titular se corta. Se
     mantiene «Imágenes ilustrativas generadas con IA, no fotos de la
     noticia».
  2. **Las fotos pesan menos aunque se vean más grandes**: cada foto tiene
     tres tamaños (480, 960 y 1200 px; `srcset`/`sizes` en la web y
     `anchoFoto()` en la app) y cada pantalla baja el que necesita.
  3. **Inicio llega con las tres noticias ya escritas en el HTML publicado**
     (`rwadar-noticias-portada.js`): la foto de portada no espera al
     JavaScript. El JS no las rehace si son de la misma edición y la página
     está en castellano (firma FNV-1a de lo pintado en
     `data-nt-prepintado`); en inglés o con otra edición, sí.
     `rwadar-site/index.html` no se toca: la lista sigue vacía y con
     `hidden` en la fuente.
  4. **De 8 a 23 fotos** en la biblioteca, por temas (lista cerrada en
     `fotos.json`: 15 `temas`, cada uno con al menos una foto, y
     `genericas`). Cada toma se miró a tamaño completo; la sala de
     operaciones no se aprobó (los monitores salían con seudotexto). Hoja de
     contactos: `automatico/visual/capturas/biblioteca-23.png`.
  5. **Guía de titulares** (`rwadar-editorial-source/noticias/GUIA-TITULARES.md`)
     y lo medible de ella en el programa (`revisarEdicion()` del modelo): 60
     caracteres como mucho en las dos lenguas, sin frases de promesa, «¡»,
     emojis ni punto final (salvo abreviaturas), y una foto distinta y de la
     biblioteca para cada noticia. El publicador se para con un error y
     escribe los avisos. Es el punto de enganche de las noticias automáticas.
  6. **Titulares nuevos para la edición publicada del 13/11** (4 de 5
     cambian) y una foto distinta para cada noticia, comprobados contra sus
     fuentes abiertas de nuevo el 14/11 (misma huella que el 13/11); adenda
     en `rwadar-app/data/verificaciones/2026-11-13-v2/noticias/EDICION.md` y
     v1 regenerado. Ojo: la noticia 5 (consulta de la CNMV) admite
     comentarios hasta el 16/11; desde el 17/11 la edición siguiente tiene
     que quitarla o reescribirla.
- **Lo que pidió la revisión del diseño y cómo quedó** (las siete, hechas):
  1. (alta) **El cerrojo de la mañana y el `index.html` que ahora depende de
     la edición.** `sinNoticiasInicio(html)` deja el Inicio publicado como si
     no llevara noticias; probado (M39): dos ediciones distintas dan el mismo
     Inicio sin noticias, igual a la fuente. **Lo une el integrador** en
     `.claude/skills/noticias-automaticas/lib/produccion.mjs`
     (`compararArchivos`): para `index.html`, comparar
     `sinNoticiasInicio(local) === sinNoticiasInicio(producción)` en lugar de
     los sha256, con su mutación en esa rama.
  2. (media) **Falsos positivos de los titulares.** Error solo para las
     frases de promesa como palabras enteras, «¡» y «!»; las raíces sueltas
     («garantiz», «asegur», «oportunidad», «guarantee») son aviso; el punto
     final admite abreviaturas («EE. UU.», «S. A.»). Una prueba por cada
     falso positivo de la revisión.
  3. (media) **El camino entero del publicador, antes del PR.**
     `validaMarcadoEstricto` vive en `rwadar-noticias-portada.js` (el
     publicador la importa) y `prepararInicioPublicado(html, edición)` hace
     lo mismo que el publicador. **El integrador lo añade a V-17** de la
     mañana junto con `revisarEdicion(edición, { fotos })`. Ediciones de 1 y
     2 noticias: con 1, la portada a todo el ancho; con 2, la portada y una
     tarjeta sin hueco (web y app, probadas).
  4. (baja) **Firma** pura de lo pintado (FNV-1a), no la fecha.
  5. (baja) **Vuelta atrás**: ver abajo.
  6. (baja) **Volver a medir después de unir las tres ramas**: pendiente del
     integrador (ver «Para el integrador»).
  7. (baja) **Ritmo**: fotos en segundo plano desde el primer minuto; web y
     app a la vez; la biblioteca nueva, al final.
- **Arreglo de esta sesión:** `probar-precarga.cjs` (la prueba «la base las
  lleva todas») borraba la primera foto por orden alfabético y esperaba
  «Falta la foto de una noticia base». Con la biblioteca de 23, esa foto
  (`acciones-eeuu`) ya no la usa la edición, y que falte una foto que nadie
  usa está permitido: la prueba fallaba sin que hubiera un fallo. Ahora borra
  la foto de la primera noticia de la base. La regla no cambia.
- **Medidas de Inicio, antes (`a4a594f`) y después (esta rama)**, las dos
  construidas con `rwadar-publicar.js --local` y servidas con el worker local
  (sin comprimir, HTTP/1.1); `medir-inicio2.mjs`, mediana de 5 cargas,
  alternando antes y después en cada vista, con la máquina tranquila. Perfil
  lento: CPU × 4, 1,6 Mb/s y 150 ms.

  | Vista | Fotos de noticias al cargar | Total al cargar (rápido) | DCL lento | LCP rápido | LCP lento | Elemento del LCP |
  | --- | --- | --- | --- | --- | --- | --- |
  | 390 × 844 @2 | 266 → 73 kB (−73 %) | 1.962 → 1.779 kB (−9 %) | 10,6 → 9,7 s | 152 → 156 ms | 2.768 → 2.972 ms (+7 %) | el titular de arriba de Inicio, igual |
  | 1366 × 900 @1 | 266 → 73 kB (−73 %) | 2.270 → 2.015 kB (−11 %) | 10,8 → 10,0 s | 184 → 164 ms | 2.948 → 3.160 ms (+7 %) | igual |
  | 1024 × 1366 @2 | 266 → 153 kB (−43 %) | 2.447 → 2.167 kB (−11 %) | 11,1 → 10,5 s | 184 → 188 ms | 2.972 → 3.368 ms (**+13 %**) | pasa a ser la foto de portada |
  | 2560 × 1440 @1 | 266 → 73 kB (−73 %) | 2.394 → 2.087 kB (−13 %) | 10,9 → 10,1 s | 212 → 224 ms | 3.036 → 3.264 ms (+8 %) | pasa a ser la foto de portada |

  En el móvil, las tres fotos de Inicio pasan de 266 kB a 73 kB; la página
  entera baja entre un 9 y un 13 % y termina antes (DCL y load en el perfil
  lento, −5 a −9 %).
  **La meta del plan (LCP ≤ +10 % o 100 ms) se cumple en tres vistas y no en
  la tableta con el perfil lento (+13 %, +396 ms).** Por qué: en una tableta
  la foto de portada cabe en la primera pantalla y pasa a ser lo más grande
  (el LCP, que es justo lo que pide «lo visual primero»); se baja a la vez
  que el CSS que frena el primer pintado (161 kB sin comprimir) y le quita
  ancho de banda: el CSS principal acaba a los 2,6 s antes y a los 3,0 s
  después. Probé `fetchpriority="high"` y `"low"` en la foto (perfil lento,
  1024, 390 y 2560; `automatico/visual/c2/prioridad.log`): ninguno cambia la
  cascada en el servidor local, que reparte el ancho de banda por igual (con
  «low», la foto empieza igual a los 0,28 s), así que **no lo he añadido**.
  En producción (HTTP/2-3, que ordena por prioridad, y CSS comprimido) el CSS
  debería ir antes que la foto, **sin comprobar**. Si la dirección quiere la
  meta también en tableta: (a) aceptarlo y medir en vivo tras publicar;
  (b) una `<picture>` que en tableta con pantalla densa pida la foto de 960
  (−31 kB; unos −160 ms por la cuenta, sin medir) a cambio de algo de
  nitidez; (c) portada perezosa,
  que va contra «lazy salvo la portada». El integrador vuelve a medir tras
  unir las tres ramas (punto 6 de abajo).
- **Capturas a escala 2** (en `automatico/visual/capturas/`): antes y después
  de Inicio y de /mercado/ a 390 y 1366 (`antes-*`, `despues-*`; la página
  entera recortada al bloque, sin las capas fijas), la portada con una foto
  blanca (`despues-foto-blanca-*`: el titular se lee igual) y la letra del
  navegador a 32 px (`despues-letra32-inicio-390.png`: una columna, portada
  de 411 px, nada cortado). App con react-native-web (`capturas/app/`):
  Inicio y «Mercado y noticias» en castellano e inglés y la letra a 1,3
  (tarjetas en filas); antes, `antes-*`. En la app el arnés no agranda la
  letra (el sistema sí lo hace en el móvil): solo muestra el cambio de
  rejilla. Ningún desborde horizontal en ninguna vista.
- **Pruebas:**
  - `npm test` en la raíz: **salida 0** en una sola pasada (274 s): base (PGlite), web
    (publicador, `probar-web`, fichas, precarga), QR, móvil (661 correctas y
    las 2 saltadas de siempre), herramientas y acceso (337 correctas, **0
    saltadas**: las de Chromium corrieron en local).
  - **Mutaciones: 44 de 44 cazadas** (M1-M33, M37 y M38 del plan, con M15b
    y M18b, y M39-M45, que se añadieron al construir; M34-M36 son del
    integrador). Arnés:
    `automatico/visual/c2/mutar.mjs --con-construir` (deshace cada regla,
    corre la prueba que la vigila y la restaura); resultado en
    `c2/mutaciones.json`. Las cazan pruebas de Node (las ve la CI) salvo M27,
    que solo caza Chromium.
  - Guardián de OTA con la base `fa30779…`:
    `{"ok":true,"runtime":"1.4.2(24)",…}` (la app solo cambia JS).
  - `copiar-modelo-web.cjs --comprobar` (motor web y app idénticos) y
    `rwadar-noticias-editoriales.js --comprobar` (23 fotos, 46 variantes, 15
    temas).
  - gitleaks con `rwadar-app/gitleaks.toml` sobre los commits de la rama:
    sin hallazgos. Sin nombres de personas en lo añadido.
- **Para el integrador:**
  1. `produccion.mjs` (noticias automáticas): `index.html` con
     `sinNoticiasInicio()` (punto 1 de arriba), con su mutación.
  2. V-17 de la mañana: `revisarEdicion()` y `prepararInicioPublicado()`
     sobre la edición `editor`, `final` y `publicada` (punto 3), con la
     mutación M34 (la mañana sin V-17: un titular con «oportunidad única»
     frena antes del PR).
  3. Coherencias: `REGLAS_TITULAR.max` (60) = `config.titulares.maxCaracteres`
     (M35); `fotos.json.genericas` = `config.json.fotos.genericas` (M36:
     regulación → `regulador-espana`, mercado → `red-europea`, producto →
     `acciones-eeuu`, riesgo → `alerta-fraude`).
  4. Las pruebas de esta rama que leen la edición viva son de Node
     (`rwadar-acceso/noticias-sector.test.mjs`: «index.html publicado»,
     `rwadar-movil/tests/noticias-sector.test.cjs` y la de la precarga); las
     de Chromium usan la edición fija `rwadar-acceso/fixtures/noticias-visual.json`.
  5. Si la mañana trae una edición de prueba en `noticias-v2.json`, gana la
     más nueva y se le aplica la guía.
  6. **Repetir la medida de Inicio sobre la unión de las tres ramas** (el
     gráfico en directo añade una lectura en Inicio): `medir-inicio2.mjs`, las
     cuatro vistas, perfiles rápido y lento, mediana de 5, alternando antes
     y después (`automatico/visual/c2/medir-ab.sh`).
  7. Orden: esta rama va antes o a la vez que la mañana (la mañana necesita
     la guía). Publicar la web justo después de unir y sellar.
- **Vuelta atrás:** se pueden revertir el diseño (`noticias-sector-20261110.js`
  y `.css`, `mercado-20261111.css`, los dos `index.html`, el componente de la
  app) y el prepintado (la llamada en `rwadar-publicar.js`). **No se
  revierten** `rwadar-precargar-imagenes.js` (la base publicada ya llevará
  `noticias-editoriales/480/` y `960/`, y la regla antigua la rechazaría),
  `rwadar-noticias-editoriales.js`, la copia de las variantes de
  `rwadar-publicar.js`, `fotos.json` ni `fotos/` (las fotos publicadas no se
  cambian nunca). La regla de 60 caracteres se afloja en una línea
  (`REGLAS_TITULAR.max`), con su prueba. App: otra OTA con el JS anterior; la
  app nueva sigue funcionando con la web revertida (las variantes siguen
  publicadas).
- **Pendiente para la dirección:** ver las capturas, la hoja de contactos de
  las fotos nuevas y los titulares; dar la orden de publicar (PR, sello,
  «Publicar web» y, después, «OTA Android» con la base `fa30779…`: primero
  la web, para que las variantes existan cuando la app nueva las pida). Unos
  15-17 minutos de Actions, una vez; ningún gasto diario nuevo.
## 14 de noviembre de 2026 (25) · Claude · Gráfico en directo · ENCENDIDO (migración 35 aplicada 14/11 10:47 UTC, siembra y encendido 11:07, web n.º 98, OTA n.º 30, PR #141)

- **Entrega (14/11, rama `entrega-grafico`):** unida la rama del constructor
  con `merge --no-ff` sobre la rama de trabajo (al día con `main`) y
  aplicada la revisión adversarial de la construcción (7 puntos: 1 alta, 4
  medias, 2 bajas). **Queda LISTA PARA PUBLICAR la web, ENCENDER el directo
  y enviar la OTA**, en el orden del contrato (apartado 6); lo hace el
  coordinador. Aquí no se ha publicado, encendido ni subido nada.
  1. *(alta)* **La siembra para si un token de la diaria se queda sin
     historia** (`sembrar-directo.mjs`): antes seguía y lo guardaba con un
     solo dato; con figure-heloc (más de la mitad) no salía ninguna serie en
     24 h ni en 30 días. Ahora sale con código 3 sin escribir nada. Pruebas
     nuevas: el mayor sin sus dos historias y uno pequeño sin la de 5 min.
  2. *(media)* **Un directo sin ninguna serie ya no es un 200 vacío**: el
     servidor da 503 `directo_no_valido` y `validarDirecto` lo rechaza (así
     lo ven la alarma diaria y `comprobar-publicado`). Con una sola serie,
     sigue valiendo.
  3. *(media)* **Cualquier 404 es «apagado», sin aviso** (`motivoDirecto`):
     una web sin la ruta (OTA antes que la web, o una web anterior) ya no
     enseña el aviso falso a todos. `comprobar-publicado` y la alarma siguen
     exigiendo `directo_apagado`. Probado también en Chromium.
  4. *(media)* **Web: al refrescar, si la pestaña elegida se queda sin
     datos, la primera que sí** (como al empezar y como la app). Caso nuevo
     en Chromium: en «24 h», el directo cae y no hay fina → pasa a «1 S» con
     su gráfico y el aviso «día a día», sin «no disponible».
  5. *(media)* **`probar-coingecko` también pide la diaria publicada desde
     Supabase** (cambia `probar_pedir`/`probar_leer` en las dos copias de la
     35, idénticas) y **falla si no da 200**: así se ve antes de encender si
     Cloudflare no deja leerla. En el contrato, además, un segundo `estado` a
     los 25-30 minutos de encender.
  6. *(baja)* **No aplicado**: guardar 250 en vez de 60 cuadruplica el
     espacio (unos 25-35 MB en vez de 8,5) y no cubre el caso probable (un
     token recién añadido a la categoría). Lo que lo cubre: `sembrar` cuando
     cambie la lista de la diaria. Apuntado como pendiente en el contrato
     (apartado 7); con el punto 2, si pasa, salta la alarma.
  7. *(baja)* **Contrato al día**: la medida directo/diaria con fecha y
     cifras (−0,017 % a −0,027 %), y qué cambia en la fase 2 (respaldo día a
     día, «24 h» desactivada si el directo falla, adaptar
     `comprobar-publicado.mjs`, que exige la fina publicada).
  - **Pruebas de la entrega:** `npm test` entero en la raíz con salida 0
    (6 min; acceso 342/342 con Chromium, móvil 663 y las 2 omitidas de
    antes); Chromium del directo (390 y 1366) con los dos casos nuevos; base,
    regla y flujo del directo (21, 47 y 31 correctas); guardián de OTA con
    `--base fa30779…` `ok:true`; gitleaks sin hallazgos en los commits
    nuevos. **Mutaciones de los arreglos: 14 de 14 detectadas** (siembra
    ×2, sin series en el modelo ×2 y en el servidor ×2, 404 en el modelo,
    en la web y copia desactualizada, pestaña al refrescar, prueba de la
    diaria en la base ×2 y en el flujo ×2). Capturas a escala 2 de la web
    y de la app (con dos nuevas: «24 h» cuando el directo cae sin fina, y la
    app ante una web sin la ruta, sin aviso).

- **Encargo de la dirección (13/11):** «Supabase pregunta a CoinGecko cada 5
  minutos (una sola consulta para los 250 tokens) y guarda el punto. La web y
  la app lo leen directamente, sin publicar nada. La pestaña 24 h siempre está
  al día.» Construido sobre el diseño revisado (el plan del diseñador y los 14
  problemas que confirmó la revisión, todos aplicados). Rama
  `worktree-wf_44e63947-86f-1`, desde `main` en `ccedb52`. **SIN ENCENDER y
  SIN PUBLICAR**: ni Supabase, ni flujos, ni push, ni EAS, ni avisos.
  Contrato completo: [`MERCADO-DIRECTO-2026-11-14.md`](MERCADO-DIRECTO-2026-11-14.md).
- **Qué hace, en llano:**
  1. **La base (migración 35, nueva):** Supabase pide a CoinGecko una vez por
     ranura de 5 minutos (nunca dos a menos de 240 s), guarda el dato de cada
     token (los 60 mayores y los de la diaria) y rehace las dos series con la
     misma regla de hoy. Comprobado en PGlite: **idéntica** a
     `construirSerieFina` con la ejecución real del 13/11 (30 tokens, 289 y
     721 puntos, mismos «largos») y en 300 casos al azar con decimales.
  2. **Un corte del propio directo no culpa a CoinGecko** (lo más grave de la
     revisión): la edad de cada token solo cuenta en los cubos con lectura
     buena del directo o cubiertos por la siembra. Probado con cortes de 2 h,
     25 h y 73 h: nadie fuera ni en «largos» (la regla de hoy los habría
     marcado o tirado la serie) y la nota dice «El directo no pudo leer del …
     al …». Encender exige una siembra de menos de 30 minutos (la acción
     `encender` siembra antes en la misma ejecución).
  3. **El servidor de la web** sirve `/api/tokenizacion/directo` desde su
     memoria (como mucho una lectura de Supabase cada 5 minutos por copia),
     con la clave publicable y sin cookies; el formato es el de la fina
     publicada y pasa `validarSerieFina` sin cambios.
  4. **La web y la app** lo piden a la vez que la diaria; si vale, es lo que se
     pinta y la cifra grande, y todas las pestañas acaban en ella (los días que
     falten desde la diaria salen de la horaria del directo). La edad se mide
     con la hora del servidor (cabecera Date): un móvil con la hora mal puesta
     no lo rechaza. Si el directo está encendido y falla, la copia publicada
     con la línea «Ahora no se puede usar el dato en directo…» (en Inicio,
     «copia de las 16:05»); apagado, nada. Se refresca solo con la página a la
     vista o la app activa, sin cambiar de pestaña y esperando a la cruz.
  5. **Flujo nuevo «Mercado en directo (base)»** (ensayo, aplicar, verificar,
     probar CoinGecko desde Supabase, sembrar, encender, apagar, deshacer,
     estado), con DIRECTO en «confirmar». **Alarma** en el flujo diario (paso
     final): si el directo está encendido y no responde bien dos veces, el
     paso falla y GitHub avisa.
- **Arreglos de la revisión del diseño, uno a uno:** (1) cortes del propio
  directo → tabla `lecturas` y edad solo en cubos cubiertos; siembra < 30 min
  para encender. (2) `comprobar-publicado` acepta los 503 con código conocido
  (`.github/juzgar-directo.mjs`), con aviso. (3) «hoy» = día UTC del último
  dato, nunca la hora del aparato (pruebas a las 23:58, 00:01 y 00:06). (4)
  pruebas de la base en tres archivos de menos de 25 s cada uno (45 casos al
  azar en la CI; 300 en local), sin añadir partes a la CI. (5) alarma en el
  flujo diario y `diariaLeida` en el documento (más de 45 min → «atrasado»).
  (6) acción `probar-coingecko` desde la red de Supabase, agente de usuario
  fijo; la prueba del hueco de figure-heloc queda como condición obligatoria
  antes de encender. (7) tiempo transcurrido = el mayor de `performance.now()`
  y `Date.now()`; al volver a primer plano, se pide si pasaron más de 4 min.
  (8) esperas contadas desde la petición (Retry-After 900 → 15 min justos).
  (9) el freno «lista corta» solo con menos de 25 válidos o JSON roto; si
  falta figure-heloc, se guardan los demás. (10) `comparar-directo.mjs`
  compara el mismo instante. (11) memoria de 60 s si el dato ya pasó de su
  siguiente hora. (12) el último punto de una diaria vieja también sale de la
  horaria. (13) la clave Demo solo en `pedir()`; `estado` cuenta las llamadas
  del mes. (14) ranuras de 5 minutos más el mínimo de 240 s.
- **Dónde me aparto del plan:** la copia cifrada solo antes de `aplicar-35` y
  `deshacer` (las demás acciones solo tocan `rwadar_mercado`, que la copia no
  guarda): menos minutos de Actions. El archivo de prueba real lleva un trozo
  (6 y 3 tokens, 115 kB), no los 30: con 30 pesaría 2,4 MB; la ejecución
  entera se comprueba en local (`MERCADO_DIRECTO_REAL=…`).
- **Medido:** documento compacto ~13 kB (la fina publicada, 38 kB); 60 tokens
  con su retención, ~8,5 MB en PGlite; la regla, 0,1-0,3 s por serie en
  PGlite. Las tres pruebas de la base: unos 7, 8 y 6 s en esta máquina.
- **Archivos:** base `rwadar-app/db/35_mercado_directo{,_verificar,_encender,_apagar,_deshacer,_estado}.sql`
  y `rwadar-app/supabase/migrations/20261114090000_mercado_directo.sql`;
  siembra y vigilancia `rwadar-app/tokenizacion/{sembrar-directo,comparar-directo}.mjs`
  (y `pedirJSON` exportado de `serie-diaria.mjs`); pruebas
  `rwadar-app/probar-mercado-directo-{regla,base,flujo}.mjs`,
  `rwadar-app/mercado-directo-soporte.mjs`,
  `rwadar-app/tokenizacion/prueba-directo-20261113.json`; flujos
  `.github/workflows/mercado-directo-base.yml` y el paso nuevo de
  `tokenizacion-diaria.yml`; servidor `rwadar-acceso/{tokenizacion-servidor,servidor}.mjs`,
  `compilar.cjs`, `probar-worker-local.mjs`; `.github/{comprobar-publicado,juzgar-directo}.mjs`;
  modelo `rwadar-movil/lib/tokenizacion.js` (y su copia web); web
  `rwadar-site/assets/mercado-20261111.{js,css}`; app
  `rwadar-movil/lib/tokenizacion-serie-remota.js` y
  `rwadar-movil/componentes/MercadoBolsa.js`. Sin tocar `app.json`,
  `package.json` de la app, `scripts/`, `_headers`, `_routes.json`, el sello
  ni `rwadar-publicacion-segura.js`.
- **Pruebas:** `npm test` entero en la raíz con **salida 0** (6 min 17 s):
  la base del directo 21/21, 47/47 y 28/28 (8,5, 7,4 y 5,9 s); acceso
  342/342 (con el servidor, 8/8, y Chromium a 390 y 1366, es/en, con
  capturas a escala 2); móvil 663 (2 omitidas de antes). En local, además:
  la regla con la ejecución grabada entera (30 tokens) y 300 casos al azar,
  23/23. Guardián de OTA con `--base fa30779…`: `ok:true`, 1.4.2(24).
  gitleaks (`rwadar-app/gitleaks.toml`) sobre los commits nuevos: sin
  hallazgos. **Mutaciones: 57 de 57 detectadas** (arrastres, «>=», 1 %,
  «largos», último dato del cubo, hora de la respuesta, ranuras y 240 s,
  esperas y Retry-After, 60 mayores, limpieza, redondeo, orden de la suma,
  «primera», apagado, otra categoría, permisos, relojes, lista corta,
  `generado`, cobertura del directo, siembra reciente; en el modelo, tokens,
  20 min, 25 %, días rellenados, 23:00 del día anterior, `valorFuera`, punto
  de hoy, `generado`, aviso con apagado, costura, reloj del servidor, «hoy»,
  reloj que duerme, último punto de una diaria vieja; en el servidor,
  peticiones a la vez, 60 s, parámetros, sesión, tope de bytes, tokens, 21
  min, diaria sin leer; `comprobar-publicado`, la alarma, DIRECTO; y el
  respaldo, el aviso y el refresco en la web y la app). Pruebas de antes
  ajustadas (sin debilitar): la lista de exportaciones del worker
  (`compilar.test.mjs`), las rutas que pide `mercado-20261111.js`
  (`tokenizacion.test.mjs`), lo que el worker local pregunta a Supabase
  (`comprobar-publicado.test.mjs`) y el cargador por defecto de la app
  (`tokenizacion.test.cjs`: ahora el del directo).
- **Pendiente / para la dirección y el coordinador** (orden completo en el
  contrato, apartado 6):
  1. Antes de encender: la prueba del hueco de figure-heloc en una mañana
     laborable (07:00-12:30 UTC) y `probar-coingecko` 3-4 veces desde
     Supabase. Si salen muchos 429, la clave Demo (comprobar antes su tope
     mensual).
  2. PR a main, publicar la web (con la 35 sin aplicar, la ruta da 404
     «apagado» y todo sigue como hoy), `aplicar-35`, `encender`, OTA.
  3. Una semana de vigilancia y, si pasa, la fase 2: quitar las finas del
     flujo diario (unos 400 minutos de Actions al mes).
  4. `docs/INTERNO.md` se pone al día al encender.
  5. Choques con las otras dos ramas (noticias automáticas y noticias más
     visuales): esta entrada, `.github/partes-ci.mjs`, `rwadar-app/package.json`
     (`test`), `.github/comprobar-publicado.mjs`, `probar-worker-local.mjs`,
     `MercadoBolsa.js` y el CSS de /mercado/ (zonas distintas). Lo une el
     integrador.
## 14 de noviembre de 2026 (24) · Claude · Noticias del sector solas, con freno · tarea creada (trig_015P5b7guTMypbzynUu6HtMo, 08:32 Madrid); FALTA el repositorio en el entorno

- **Encargo de la dirección (13/11, respuesta expresa de Víctor):** «Cada
  mañana una sesión programada las escribe y las verifica. Si el verificador
  no encuentra problemas, se publican solas en la web y en la app; si
  encuentra alguno, no se publica nada y te aviso.» Rama
  **`worktree-wf_2b351839-8d5-1`** (desde `main` en `ccedb52`, con el
  borrador de `worktree-wf_e178936d-288-6`). Diseño y revisión adversarial:
  `PLAN.md` y `etapas-previas.json` del scratchpad de la sesión
  (`automatico/noticias/`). **Nada encendido ni publicado:** ni push, ni
  flujos, ni tareas programadas, ni Supabase, ni avisos. No toca contenido
  sellado (unir la rama no pide sello ni publicar) ni la app (guardián de la
  OTA `ok:true`, 1.4.2(24)).
- **Qué hay, en llano:** una skill nueva,
  [`.claude/skills/noticias-automaticas/`](../../.claude/skills/noticias-automaticas/SKILL.md),
  que una sesión nueva sin contexto sigue cada mañana a las 08:32 (España):
  1. **Cerrojo** (`noticias-auto.mjs cerrojo`): no hace nada si hay ciclo
     manual (rama `claude/cerrojo-ciclo-<fecha>`, que ahora pone y quita la
     skill `investigacion-catalogo`), un PR ajeno que toque la web, el
     catálogo, la base o la app, una ejecución manual en marcha, noticias de
     hoy ya publicadas, el catálogo a medias en Supabase, `main` sin pasar la
     compuerta, **el último sello revisado por una persona de hace más de 7
     días**, o **`main` distinto de producción** (construye `main` con el
     reloj de la última publicación y compara archivo a archivo, por
     SHA-256, todo `rwadar-publicado/`, y además lo sellado con git). Dice
     qué tiene que hacer la dirección y avisa, salvo en pausa o «ya
     publicadas».
  2. **Barrido** con un programa (CNMV, ESMA, BOE, Consejo, BCE, EBA y
     Comisión; `fuentes-barrido.json`): las críticas (CNMV y ESMA) caídas →
     freno. A Git solo va lo del sector y sin nada con forma de nombre (el
     BOE trae nombramientos a diario).
  3. **Editor** (subagente) con su encargo literal
     (`noticias-auto.mjs encargo --rol editor`): 3 propuestas de titular por
     idioma, la elegida y por qué, y la foto de la biblioteca que mejor
     encaja, sin repetir; si ninguna encaja, la genérica con lo que faltaría.
     Sus notas van a una carpeta de nombre aleatorio que el encargo del
     verificador no nombra.
  4. **El programa abre cada fuente** (`comprobar-fuentes`) y pasa **16
     reglas** (V-1 … V-16 en `lib/validar.mjs`).
  5. **Verificador** (otro subagente nuevo) con su encargo literal; su
     veredicto va atado al SHA-256 de la edición. «con_cambios» → el programa
     aplica solo esas correcciones (el «antes» letra a letra), valida otra
     vez y un **segundo pase** tiene que dar «conforme».
  6. **Un solo PR con las noticias y su sello**, unido con «merge» (nunca
     «squash»: rompe el sello, lo prueba la unión simulada). El sello
     automático solo cambia commit, huella y nota de `estado.json`, **nunca
     `actualizadoEl`** (la caducidad de 7 días sigue siendo de una persona).
     Antes de unir: base = `main`, cabeza = sello, solo archivos permitidos,
     CI en verde. «Publicar web» revisión y producción, comprobando antes y
     después que la ejecución publica el commit de unión (si no, se cancela),
     y comprobación en vivo byte a byte (JSON v2 y v1, cada foto por su
     SHA-256, Inicio y /mercado/).
  7. **El freno:** cualquier otra cosa → no se publica nada, resumen en
     llano y notificación (`noticias-auto.mjs resumen`). Nunca se avisa a
     usuarios.
- **Archivos:** `noticias-auto.mjs` (18 órdenes), `lib/` (cerrojo, barrido,
  validar, producción, flujo, personas, reloj), `config.json` (interruptor:
  `"activo"`), `fuentes-barrido.json`, `EDITOR.md`, `VERIFICADOR.md`,
  `ORDEN-TAREA.md` (texto exacto de la tarea, hora y encendido),
  `pruebas/` (78 pruebas), `ensayo.mjs`;
  `rwadar-app/data/noticias-diarias/LEEME.md`; `AGENTS.md` (la autorización
  permanente de Víctor del 13/11 solo para esto y lo que sigue necesitando su
  orden); `docs/INTERNO.md`; la skill `investigacion-catalogo` (rama de
  cerrojo, mismo procedimiento de titulares); `rwadar-app/package.json`
  (las pruebas de la skill y `validar --publicada` en `npm test`);
  `.github/partes-ci.mjs` (pesos, y las pruebas de la skill en el trabajo
  «Sello»: usan `estado.json`) y `.github/flujos.test.mjs` (lo vigila).
- **Arreglo que hacía falta:** la prueba 16 de
  `rwadar-movil/tests/noticias-sector.test.cjs` exigía «Council of the EU»
  entre las fuentes publicadas: se habría puesto en rojo sola (esa noticia sale
  de los 30 días el 04/12). Ahora comprueba la traducción de cada fuente
  publicada, sea cual sea (pasa con la edición de hoy y con una sin el
  Consejo; el caso del Consejo sigue probado con el ejemplo fijo).
- **Minutos de Actions** (medidos: PR #135 9 min facturados, #136 8, sello
  #137 3, «Publicar web» 1-2 cada una):
  - Construido (vía 2: un PR con noticias y sello): **11-13 al día, 330-390
    al mes**; un día frenado antes del PR, 0. Como hoy (dos PR) serían 14-16.
  - **Propuesto, sin construir** (vía 3, `PLAN.md` § 10.2): un trabajo
    «Noticias» en la CI para los PR que solo cambian las noticias y el sello
    (test:web, las pruebas de noticias de la web y la app, las de la skill,
    `validar --publicada` y la compuerta): **7-8 al día, 210-240 al mes**.
    Toca `cambios-ci.sh` (tercera salida `noticias=`), `ci.yml`,
    `partes-ci.mjs` y `flujos.test.mjs`: mejor en su propio PR, con el
    integrador del gráfico en directo (que también toca `.github/`).
- **Pruebas:** las 78 de la skill (`node --test
  .claude/skills/noticias-automaticas/pruebas/*.test.mjs`); **ensayo completo
  en local** (`node .claude/skills/noticias-automaticas/ensayo.mjs`): un
  «GitHub» de mentira (repositorio desnudo), la web servida por el worker
  local, fuentes locales, y 25 días (bueno, modo ensayo, verificador rechaza,
  con cambios y segundo pase conforme o no, cuatro validadores, verificación
  de otros bytes, CI falla, `main` se mueve, fuente crítica caída, fuente de
  una noticia caída, siete cerrojos, «Publicar web» de otro commit, revisión
  y producción que fallan); **32 mutaciones** que deshacen una regla cada una
  y hacen fallar su prueba.
- **Resultados (14/11, en este contenedor):** `npm test` entero en la raíz,
  **salida 0** (78 pruebas de la skill dentro; `validar --publicada` dice que
  la edición publicada aún no es automática); ensayo completo **25/25 días
  como se esperaba** (367 s; 16 push, todos al origin de ensayo; nada a
  GitHub ni a Cloudflare); mutaciones **32/32 cazadas** (guion `mutaciones.mjs`
  del scratchpad, sobre una copia del commit); guardián de la OTA
  `ok:true` (1.4.2(24)); gitleaks 8.30.1 con `rwadar-app/gitleaks.toml` sobre
  los commits de esta rama: **sin hallazgos** (sobre todo el historial salen
  los 4 de siempre, de commits del 05/11 que no son de esta rama). Capturas
  a escala 2 del día bueno servido por la «producción» local (Inicio y
  /mercado/ a 390 y 1366, con la noticia de «Hoy» del ensayo): carpeta
  `automatico/noticias/capturas/` del scratchpad.
- **Un fallo de verdad que encontró la construcción:** la regla de correos de
  V-11 tenía longitudes sin acotar y tardaba unos 20 s con una línea larga
  sin «@» (200 kB de notas); ahora 2 ms (`lib/personas.mjs`).
- **Para encender (lo hace el coordinador tras enseñárselo a Víctor):**
  `ORDEN-TAREA.md`. Obligatorio antes: añadir `victorJorques/RWADAR` a los
  repositorios del entorno «Rwadar Con Internet». Primero un disparo con
  «MODO ENSAYO»; el primer día real, vigilado.
- **Enganche con la mejora visual (para el integrador):** la mañana **frena
  si no existe `rwadar-editorial-source/noticias/GUIA-TITULARES.md`** (V-8
  exige su SHA-256 en `titulares.json`); las genéricas de `config.json`
  (`fotos.genericas`) tienen que existir en `fotos.json` y, si `fotos.json`
  declara las suyas (`genericas`, o `generica`/`categorias` por foto),
  coincidir (lo vigila una prueba); `titulares.maxCaracteres` (60) y
  `propuestasMin` (3) se alinean con la guía. Si la mejora visual añade
  campos a la noticia, V-13 frena hasta que estén en producción y en la OTA;
  si cambia la forma de servir las fotos (variantes, `srcset`), hay que
  ajustar `comprobarVivoUnaVez` en `lib/flujo.mjs` (pide
  `/noticias-editoriales/<clave>.webp` y compara con `fotos.json`).
- **Otros puntos de integración:** `main` tendrá commits de unión (solo los
  de las noticias); no encontré nada que dependa de la historia lineal. Las
  pruebas de `sello.test.mjs` hacen commits en una copia aparte (`git
  worktree`, sin ramas) y tardan unos 12-15 s aquí, con la máquina cargada;
  su peso en `partes-ci.mjs` es 15 s (las cinco partes siguen ≤ 40 s).

---

## 13 de noviembre de 2026 (23) · Claude · Limpieza de código de la web

- **Encargo de la dirección (13/11):** «Si hay código antiguo que no vale para
  nada, que hace más gasto que bien, yo lo quitaría» y «optimiza el trabajo
  para no malgastar». Parte de la auditoría de la tarde (candidatos C1 a C19,
  con sus condiciones). Rama **`worktree-wf_d48d491a-f9c-4`**, desde `main`
  en `caf7225`. **SIN PUBLICAR**: ni push, ni flujos, ni Supabase, ni EAS.
  El motor de idiomas y el diccionario de la app no se tocan: no hace falta
  OTA.
- **Qué se quitó, en llano:**
  1. **El diccionario inglés ya no se descarga en castellano (C1/C11).** Lo
     más pesado: 226 kB (56 kB comprimidos) en cada página y, en Inicio,
     10 kB más del de la campana. Las 73 páginas lo apuntan en
     `data-idioma-en` de `idioma-previo` (en `<head>`; el publicador le pone
     la huella). Con «en» guardado, `idioma-previo` escribe sus `<script
     defer>` antes del motor: entra en el mismo orden y momento que antes y
     la página nace en inglés (también `/#explain` en la app). En
     castellano, `RWAdarIdioma` es una fachada del motor: al pulsar
     «English» carga el diccionario, vuelve a ejecutar el motor (ya en la
     caché) y traduce en el sitio, sin recargar; sin red, cambia igual y lo
     reintenta. El motor (copia exacta de `rwadar-movil/lib/idioma.js`) no
     cambia. Actualizados a la vez el publicador (orden de scripts de Inicio
     y `data-idioma-en`), `.github/comprobar-publicado.mjs` (cuenta
     `data-idioma-en` entre los cuatro recursos de idioma), los generadores
     (`rwadar-fichas.js`, `rwadar-academy.js`) y las pruebas que exigían la
     etiqueta.
  2. **Funciones y ramas muertas de `rwadar-20260820.js` (C7, C8/C17):**
     `emisionRemota` y `textoOpcional`, `validarLoteCatalogoRemoto` (V1),
     `tarjetaNuevaHtml`, `supervisionOferta` con `ICONO_SUPERVISOR`,
     `documentacionOfertaHtml`; el carrusel «Quién más se ha movido»,
     «Fuentes de este apartado» y `.rel-revela` (solo existen en /aprende/,
     con su copia propia) y la subvista móvil de Avisos (`#movilVistaAvisos`
     no está en la página). Se conserva `delete estado.rwadarAvisos` en
     `estadoBaseSubvista`.
  3. **Unas 100 reglas CSS de diseños retirados (C6/C16)** en
     `rwadar-20260820.css`, `noticias-sector-20261110.css` y
     `secciones-20261110.css`; en las listas mixtas sale solo el selector
     muerto. Con `.rel-novedades` sale su generador sin llamadas
     (`bloqueWeb` de `rwadar-noticias.js`).
  4. **Comentarios HTML de las páginas publicadas (C5).** `rwadar-site/` los
     conserva; al publicar, `sinComentariosHTML` (en `rwadar-adelgazar.js`)
     quita solo el comentario, con un recorrido que respeta etiquetas,
     comillas, `<script>` (JSON-LD), `<style>`, `<pre>`, `<textarea>` y
     `<title>`. Se quedan las marcas `<!--pre:…-->`, `<!--academy:…-->`,
     `<!--academy-inicio:…-->`, los condicionales y un comentario entre dos
     textos con letras (el traductor los lee por separado). Actualizada la
     decisión escrita de la cabecera de `rwadar-adelgazar.js`.
- **Arreglos de la verificación independiente (14/11, aplicados por el
  coordinador):** (1) carrera al cambiar de idioma: si se pulsaba «English» y,
  mientras llegaba el diccionario, «Español», la página acababa en inglés y
  guardaba «en». Ahora gana la última elección (`cambiarIdioma` con turno en
  `idioma-previo-20261104.js`); prueba nueva de Chromium «gana la última
  elección…» en `rwadar-acceso/idioma-diferido-navegador.test.mjs`, que falla
  con el código de antes. (2) Fuera las 6 reglas `.rel-anim` que ya nadie
  activaba (y la prueba de `probar-web.mjs` que las exigía pasa a exigir que
  no estén y que la barra de progreso no se anime con «reducir movimiento»);
  fuera `mostrarAvisos`/`cierresAvisos` del arnés de pestañas; comentario
  corregido. (3) Conocido y aceptado: sin red para el diccionario, «English»
  marca el inglés aunque los textos sigan en castellano, y lo reintenta la
  vez siguiente (lo comprueba su prueba). `npm test` entero: salida 0.
- **Ahorro medido** (Inicio, móvil Pixel 5 en Chromium, caché vacía, worker
  local con host `rwadar.test`, misma máquina y mismo guion antes y
  después): en castellano, **46 → 44 peticiones; 2.288,0 → 2.028,9 kB
  (−259 kB); gzip-9 912,1 → 832,4 kB (−80 kB); brotli 837,0 → 773,3 kB
  (−64 kB)**. JS 1.297,2 → 1.053,7 kB (br 269,7 → 209,7), CSS 240,9 →
  233,0 kB (br 43,0 → 41,8), HTML 199,7 → 192,1 kB (br 32,6 → 30,1). En
  inglés (lo descarga todo): 2.288,0 → 2.265,0 kB (br 837,0 → 832,2).
  `idioma-previo` crece 0,8 kB comprimidos en cada página (la fachada); el
  resto baja. `rwadar-site/assets`: 2.105.221 → 2.090.108 B; lo publicado,
  assets 1.897.087 → 1.881.417 B y HTML 1.844.382 → 1.831.680 B.
- **Capturas** (Inicio, /mercado/ y una ficha; 390 y 1366; castellano e
  inglés), en el scratchpad de la sesión (`codigo-muerto/capturas/antes`,
  `despues` y `antes-repeticion`): 10 de 12 idénticas píxel a píxel; las
  dos de Inicio en escritorio difieren en el pie (3.453 y 3.732 píxeles de
  suavizado de letra) igual que dos tomas seguidas de la web de antes, y
  las de después son idénticas a esa segunda toma: no cambia nada visible.
- **Pruebas:** `npm test` entero con salida 0 (5 min; acceso 330/330 con
  las de Chromium, móvil 649 + 2 omitidas de antes);
  `comprobar-ota-compatible.cjs --base fa30779…` con salida 0; gitleaks sin
  hallazgos. Prueba nueva de Chromium
  `rwadar-acceso/idioma-diferido-navegador.test.mjs` (móvil y escritorio:
  en castellano no se pide el diccionario; con «en» guardado los
  diccionarios corren antes que el motor y en DOMContentLoaded ya está en
  inglés; «English» traduce en el sitio una sola vez; sin red no rompe;
  `/#explain` en la app). Comprobada con mutaciones: contra la web de antes
  falla, y si se quita la escritura previa también.
  Pruebas ajustadas porque comprobaban lo quitado (sin debilitar lo vivo):
  `probar-catalogo-publico` (el lector V1 pasa a una copia propia de la
  prueba; el catálogo caduco se comprueba en `comprobarCatalogoEmbebido`),
  `probar-web-tarjeta`, `probar-web` (etiqueta de supervisión en
  `etiquetaVerificacionLocal`; la regla de seguridad de la referencia mira
  `.escaparate-esencial dd small`, la de la ficha vigente; fuera la prueba
  de la subvista de Avisos), `ofertas-vigencia`, `probar-fichas`,
  `probar-web-escritorio`, `probar-para-empresas`,
  `probar-transparencia-comercial` y `academy-candado-navegador`.
- **Lo que no se quitó y por qué:**
  - **C12/C3, escaparate de revisión local (≈4 kB comprimidos):** la
    herramienta está viva (RUNBOOK y CI la ejecutan) y su código va
    entrelazado con lo de producción: `pintarTiposOfertaLocal` se llama
    siempre, `activaControlesEscaparateLocal` lo usa el respaldo local de la
    copia publicada en 127.0.0.1 y `MANIFIESTO_EDITORIAL_LOCAL` lo lee
    `imagenOfertaLocal`. Hacerlo bien pide quitarlo al publicar con marcas
    dentro de funciones, un sustituto de `cargarEscaparateLocal` que falle
    (para no llegar a `mirar()` ni a producción) y lo mismo en el CSS:
    cambio propio. `limpiarRetornoSinServiciosUsuario` y
    `activarBusquedaOfertas` no se tocan nunca (son de producción).
  - **C10, recortar el diccionario al publicar:** con C1 hecho, solo lo
    ahorraría quien navega en inglés, y necesita la lista blanca de textos
    del servidor (aviso de bienvenida, vocabulario del catálogo) y una
    prueba de recorrido en inglés con cuenta.
  - **C2, claves sin uso en `lib/idioma-en.js`:** cambia el paquete de la
    app (OTA) y la lista incluía dos textos vivos del aviso de bienvenida.
  - **C4/C14, poda de `tokenizacion-modelo`:** rompe la decisión «una sola
    fuente para web, app y servidor» y la tarea n.º 71 (gráfico en directo)
    puede necesitar en el navegador esas funciones: decidir antes.
  - **C13 (opiniones) y C15 (comunidad):** interruptores «en pausa»
    (INTERNO): lo decide Víctor.
  - **C19, imágenes de Leaflet:** 0 kB por visita y dejaría `url()` colgando
    en `leaflet-1.9.4.css`.
  - Visto al pasar, sin tocar (fuera de la lista): la rama `[data-emi-orden]`
    del clic de Inicio y la regla `#movilPanelMas.movil-subvista-abierta…`
    ya no tienen a quién servir, y las clases `.rel-nueva*` se quedaron sin
    generador al quitar `tarjetaNuevaHtml`.
- **Pendiente para Víctor:** nada que hacer ahora; al publicar, la web entra
  con su flujo normal (sin OTA).

## 13 de noviembre de 2026 (22) · Claude · Gráfico de la tokenización con más detalle

- **Encargo de la dirección (13/11):** «El gráfico, cuanto más detalle en el
  tiempo tenga, mejor» (el «estilo bolsa» de /mercado/, Inicio y la app).
  Rama **`grafico-fino-integrado`**: une las tres partes (datos y modelo,
  web y app; sus entradas detalladas, 20 y 21, van debajo) y aplica lo que
  confirmaron las dos revisiones. **SIN PUBLICAR**: ni push, ni flujos, ni
  Supabase, ni EAS, ni la rama `datos-tokenizacion`.
- **Qué cambia, en llano:**
  1. El flujo diario guarda, además de la serie diaria de un año,
     `tokenizacion-serie-fina.json`: un punto cada 5 minutos de las últimas
     24 horas (289) y uno cada hora de los últimos 30 días (721), con los
     mismos tokens que la diaria (30 de los 40 mayores el 13/11).
  2. Pestañas: **24 h** (nueva) con la de 5 minutos; **1 S y 1 M** con la
     horaria; 3 M, 6 M, 2026 y 1 A con la diaria, como antes. El cambio de
     la cabecera y el «Cambio en 24 h» salen de la serie de la pestaña. Con
     los datos reales del 13/11, todas acaban en la cifra grande (41.816 M$)
     y 24 h dice «▼ −4,0 % en las 24 horas hasta las 16:05».
  3. Eje y lectura al pasar el dedo o el ratón, en **hora de España**: 24 h,
     horas en el eje («18:00 · 00:00 · 06:00 · 12:00») y en la lectura
     («10:05»; «12 nov, 16:05» si el punto es de ayer); 1 S y 1 M, días en el
     eje y «día, hora» en la lectura; las diarias, como antes (meses en 1 A).
     En inglés, igual («24H», «12 Nov, 16:05», «Spain time»).
  4. Todas las horas de la pantalla son de España y lo dicen: el subtítulo
     de la cifra («13/11/2026, 16:05 (hora de España)»), «Valor hoy», la
     fuente y el total de la categoría («hoy, 15:42 hora de España»; antes
     iba en UTC y parecía 1 h 23 min más viejo).
  5. Sin serie fina (la semilla de main, una foto antigua, un archivo roto,
     de otra ejecución o de más de 256 kB), todo sigue con la diaria y
     «24 h» sale desactivada, sin errores.
  6. Rendimiento: el trazo se simplifica sin perder máximos ni mínimos (594
     de 721 puntos a 390 px) y la cruz busca con búsqueda binaria; con la
     CPU 4 veces más lenta, cada movimiento del dedo en la web cuesta menos
     de 8 ms (prueba de Chromium).
- **La regla de la suma:** cubos de 5 minutos o de 1 hora en UTC; de cada
  token, su último dato del cubo; si no tiene, el anterior, como mucho de
  **24 horas** antes en la de 5 minutos y de **72 horas** en la horaria (los
  3 días que ya arrastra la diaria). Si le falta más, ese token queda fuera
  de esa serie entera (la serie dice cuál y cuánto suma, y la pantalla lo
  avisa); si los de fuera pesan más del 1 %, esa serie no se guarda ese día
  y sus pestañas usan la siguiente.
- **Arreglos de esta integración (de las revisiones, comprobados antes):**
  - **Horaria con 72 horas de arrastre (antes 24).** El mayor token
    (figure-heloc, el 64 % de la suma) pasa 23-24 horas sin datos cada
    domingo y 72 en los puentes con lunes festivo en EE. UU. (19/01, 16/02,
    25/05 y 07/09/2026). Con 24 horas, un hueco algo más largo tiraba la
    horaria 30 días seguidos (1 S y 1 M volvían a 8 y 31 puntos). El
    validador acepta hasta el arrastre de cada serie. El archivo de prueba
    real, rehecho con las mismas respuestas grabadas: solo cambia ese dato
    (24 → 72); los puntos son idénticos.
  - **24 h ya no dice «en las últimas 24 horas»** sino «en las 24 horas
    hasta las 16:05», y si la serie fina tiene más de 26 horas respecto al
    dato de hoy, la web y la app avisan «Los datos cada 5 minutos y cada
    hora llegan hasta el 13/11/2026, 16:05 (hora de España)».
  - **Web a 320-360 px:** las 7 pestañas se reparten el ancho (a 360 «1 A»
    salía cortada; a 320 no se veían «2026» ni «1 A»); bajo 360, letra de
    14 px. Las fechas de abajo que se pisarían se quitan tras medirlas
    («Dec 2025Mar» a 360 en inglés).
  - **Web, cruz de 24 h:** los puntos de ayer llevan el día, como en la app;
    la burbuja se mide en x = 0 (medida donde estaba, la página quedaba
    21 px más ancha a 390 px; lo vi al probar el arreglo anterior).
  - **App:** la tarjeta de Inicio con la letra al 130 % baja el minigráfico
    a su fila (partía «Acti/vos/toke/niza/dos»); las fechas junto al borde
    van ancladas a él (se perdía la «D» de «Dec 2025»); la burbuja se coloca
    con al menos 244 px (se salía 8 px un fotograma).
  - La etiqueta para lectores de pantalla, sin paréntesis dentro de
    paréntesis.
- **Rechazado:** que en 1 M la lectura diga solo el día. El encargo lista
  «día en 30 días; mes en 1 año», pero en 1 A la lectura siempre ha dado la
  fecha, no el mes: la lista habla del eje (que ya cumple). En 1 M cada
  punto es una hora; con solo el día, al mover el dedo se repetiría el mismo
  día 24 veces con valores distintos. Si la dirección lo quiere así, es una
  línea en `textoInstante` (web) y en `cuandoCorto` (app).
- **Datos y flujo:** la fina ocupa 38,6 kB (39.491 B; 9,2 kB con gzip); la
  diaria, 20,8 kB. Límites: la web y la app no leen más de 256 kB; el
  publicador, 2 MB; 300 puntos de 5 minutos y 800 horarios como mucho. Flujo
  `tokenizacion-diaria.yml`: 13 s entre llamadas, gratis y con TLS; con las
  finas, unas 102 llamadas y 23 minutos (medido el 13/11, sin ningún 429);
  el paso tiene 40 minutos y el trabajo 50. Si falla la fina se conserva lo
  anterior: la diaria nueva y la fina vieja, que ya no casa y no se usa.
- **Archivos:** modelo `rwadar-movil/lib/tokenizacion.js` (copiado con
  `copiar-modelo-web.cjs` a `rwadar-site/assets/tokenizacion-modelo-20261110.js`),
  `rwadar-app/tokenizacion/serie-diaria.mjs`,
  `.github/workflows/tokenizacion-diaria.yml`, `rwadar-tokenizacion-historico.js`,
  `rwadar-publicar.js`, web `rwadar-site/assets/mercado-20261111.{js,css}`,
  app `rwadar-movil/componentes/MercadoBolsa.js`, datos de prueba
  `rwadar-app/tokenizacion/prueba-serie{,-fina}-20261113.json`. Ninguna
  clave nueva en los diccionarios; sin tocar `package.json` de la raíz,
  `app.json` ni `rwadar-movil/scripts/`.
- **Commits:** datos y modelo `3949e16`, `b0514f2`, `b76c501`; web
  `95d33ba`, `9804f6d`; app `fd7f412`, `c102f06`, `72e1533`; uniones
  `5d05498`, `517a627`, `8551284`, `63860cd`; arreglos de la revisión
  `d900991` (modelo y app) y `0d97b0b` (web), y este traspaso.
- **Pruebas (en la rama integrada):** `npm test` en la raíz, salida 0 (4 min
  33 s): `rwadar-app` 32 guiones con 1348 correctas, más 11 y 109 de
  `node --test`; `probar-web` 711/711, 70 de páginas y RSS, 40 de precarga;
  `rwadar-movil` 650 pruebas (648 bien, 0 fallos, 2 omitidas); `rwadar-acceso`
  315/315, con `mercado-fino-navegador.test.mjs` en Chromium (390 × 844,
  1366 × 900, 360 × 780 y 320 × 568, en castellano e inglés). Guardián de OTA
  con `--base fa30779…`: `ok:true`, 1.4.2(24). gitleaks (`rwadar-app/gitleaks.toml`)
  sobre los commits nuevos: sin hallazgos. Mutaciones de esta integración:
  20 de 20 detectadas (quitar cada arreglo hace fallar alguna prueba). Las
  pruebas se actualizaron, ninguna se borró.
- **Capturas** (en el scratchpad de la sesión, `grafico/final/`): web a 390 ×
  844 y 1366 × 900 con 24 h, 7 días y 30 días tocando un punto, y el primer
  punto de 24 h; web a 360 en 1 A (castellano e inglés) y con la fina vieja;
  app a 390 con 24 h (también el primer punto y en inglés) y 7 días, la
  tarjeta de Inicio a 360 con la letra al 130 % y 1Y en inglés a 360. Las de
  la app son los componentes reales con react-native-web, no un APK.
- **Pendiente / para Víctor:**
  - **Publicar**, cuando lo ordene: primero unir con main (solo choca este
    archivo: hay que renumerar esta entrada, porque main ya tiene una «(20)»
    del ciclo del 13/11), después la web y después la OTA. La OTA sola es
    segura: sin el archivo de la fina, la app sigue con la diaria.
  - La fina solo existe cuando el flujo corre desde main (GitHub solo
    ejecuta los horarios desde main): hasta entonces la web publica «sin
    serie fina» y «24 h» sale desactivada.
  - Frescura: la fina se hace una vez al día (06:23 UTC) y la web se publica
    a mano; si no se publica a diario, el aviso de «los datos llegan hasta…»
    saldrá a menudo. Es lo cierto; para evitarlo habría que publicar más.
  - Mirarlo en un Android de verdad (arrastre con 721 puntos y letra al
    130 %).
  - `docs/INTERNO.md` se pone al día al publicar.

---

## 13 de noviembre de 2026 (22, parte web) · Claude · Gráfico con más detalle: la web

- **Encargo (13/11):** el mismo que la entrada 20 («El gráfico, cuanto más
  detalle en el tiempo tenga, mejor»). Esta rama
  (`worktree-wf_9e649758-84d-2`) une la de datos y modelo (entrada 20, sin
  tocar nada suyo) y hace **la parte web**: /mercado/ e Inicio. La app
  (MercadoBolsa) va en otra rama. **Nada publicado**: ni push, ni flujos, ni
  Supabase, ni EAS, ni la rama `datos-tokenizacion`.
- **Qué cambia en la web, en llano:**
  1. La página lee, a la vez que la diaria, `/datos/tokenizacion-serie-fina.json`
     (como mucho 256 kB, igual que la app; hoy 38,6 kB, 9,7 kB comprimido).
     Solo la usa si vale y casa con la diaria (`unirSerieFina`); si falta,
     está rota, es de otra lectura o pesa demasiado, todo sigue con la
     diaria como hasta hoy y «24 h» sale desactivada.
  2. Cada pestaña usa la serie más fina que la cubre: **24 h, un punto cada
     5 minutos (289)**; **1 S y 1 M, cada hora (169 y 721)**; 3 M, 6 M, el
     año y 1 A, la diaria. La cabecera («▼ −4,0 % en las últimas 24 horas»)
     y el «Cambio en 24 h» de los datos clave salen de esa misma serie.
  3. **Abajo, el tiempo:** horas en 24 h («18:00 · 00:00 · 06:00 · 12:00»,
     hora de España); días en 1 S y 1 M («7 nov», «15 oct»); meses en 6 M, el
     año y 1 A. **La lectura al pasar el dedo o el ratón:** «10:05» en 24 h;
     «11 nov, 22:00» en 1 S y 1 M; la fecha en las diarias. Igual en inglés
     («24H», «12 Nov, 18:00», «Spain time»).
  4. **Teclado:** las flechas van de punto en punto; Re Pág / Av Pág saltan
     una hora (24 h), un día (1 S y 1 M) o una semana (diarias), y la ayuda
     del gráfico lo dice. La tabla para lectores de pantalla lleva todos los
     puntos, con su fecha y hora de España en las finas.
  5. **De cuándo es la cifra:** «Valor hoy» y la línea de la fuente dicen la
     hora («serie hasta el 13/11/2026, 16:05 (hora de España)»); el máximo y
     el mínimo del periodo, con día y hora en las finas.
  6. Si en una fina queda algún token fuera, se ve el aviso del modelo bajo
     el cambio («La línea suma 29 de los 30: …, así que acaba 150 M$ por
     debajo de la cifra grande.») y también en Inicio; el «Cambio en 24 h»
     dice «29 de los 30 mayores».
  7. **Inicio:** el minigráfico del mes sale de la serie de cada hora (721
     puntos), con la línea más fina (1,25 px) y, en escritorio, dibujado a
     600 de ancho para que el trazo simplificado no se note al estirarlo.
  8. **Rendimiento** (móvil simulado, CPU 4 veces más lenta, 390 × 844, el
     archivo real): cada movimiento del dedo sobre 1 M (721 puntos) cuesta
     1,6-1,8 ms de media (un fotograma son 16); en 390 de ancho se pintan
     594 de los 721 (sin perder ningún máximo ni mínimo; lo hace
     `indicesPintar` del modelo). Cambiar de pestaña costaba el doble con las
     finas porque cada cálculo del modelo vuelve a validar la serie (el
     perfil lo daba como la mitad del tiempo): la web guarda lo calculado
     por pestaña e idioma, y volver a una pestaña ya vista no recalcula
     nada. Mediana de 7 cambios: 24 h 97 ms, 1 S 83, 1 M 159, 1 A 121 (antes
     de este cambio, con la diaria: 1 S 79, 1 M 103, 1 A 166).
- **Dónde:** `rwadar-site/assets/mercado-20261111.js` (`cargarSerie`,
  `instante`, `fechaHora`, `una`, `SALTO`, `AYUDA_TECLADO`, `CAPTION`…) y
  `mercado-20261111.css` (`.mk-aviso-fuera`, `.mk-mini-svg .mk-linea--densa`);
  el comentario de `rwadar-site/mercado/index.html`. Prueba nueva
  `rwadar-acceso/mercado-fino-navegador.test.mjs` con los archivos reales
  del 13/11 como datos de prueba (`rwadar-app/tokenizacion/prueba-serie-20261113.json`
  y `prueba-serie-fina-20261113.json`); `rwadar-acceso/tokenizacion.test.mjs`
  actualizada (la web también pide la fina).
- **Commits:** la unión `5d05498` de la rama de datos (sin cambiarle nada),
  el de la web y este traspaso.
- **Pruebas:** `npm test` en la raíz con salida 0 (los guiones de
  `rwadar-app` y las 109 de `.github`; probar-web 711/711, 70 páginas y RSS,
  40 de precarga; `rwadar-movil` 640: 638 bien y 2 omitidas; `rwadar-acceso`
  315/315, con las 2 nuevas). Guardián de OTA con `--base fa30779…`:
  `ok:true`, 1.4.2(24) (esta rama no toca la app). Copia del motor web:
  idéntica (`copiar-modelo-web.cjs --comprobar`). La prueba nueva, en
  Chromium con los archivos reales: en 390 × 844 (dedo) y 1366 × 900
  (ratón), cada pestaña tiene sus puntos (289, 169, 721, 92, 182, 316 y
  364), pinta los del modelo (594 de 721 en 1 M a 390) con el máximo y el
  mínimo en su sitio, sus marcas («18:00», «7 nov», «jun 2026»), la cruz con
  su instante y su valor, Fin = cifra grande, Av Pág, la tabla, los datos
  clave, el inglés, Inicio, nada fuera de la pantalla, ningún error ni
  bloqueo de la CSP; con la CPU 4 veces más lenta, cada movimiento del dedo
  por debajo de 8 ms; y la diaria sola cuando la fina falta, está rota, es
  de otra lectura, pesa más de 256 kB o es la semilla de main; y un token
  fuera, con su aviso. **Mutaciones: 21 de 21** detectadas (sobre una copia
  del worktree): no leer la fina, quitar el tope de 256 kB, decidir las
  pestañas con `tramo`, la fecha en la cruz o en `aria-valuetext`, Av Pág fijo
  en 7, la ayuda del teclado o la tabla siempre «diaria», la tabla, «Valor
  hoy», el máximo o la fuente sin hora, el máximo de 24 h sin el día, sin el
  aviso de fuera (en /mercado/ o en Inicio), el «Cambio en 24 h» sin los de
  fuera, sin la memoria, el minigráfico a 112 o sin línea fina, el trazo con
  todos los puntos y la ruta de la fina cambiada. Capturas (escala 2) en
  `/tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/grafico/web/`.
- **Pendiente / dudas:**
  - Publicar (con permiso de Víctor): primero la web y después la OTA de la
    app, cuando esté su rama. `docs/INTERNO.md` se pone al día al publicar.
  - En la misma pantalla, la cifra grande dice la hora de España sin
    decirlo («· 13/11/2026, 16:05», texto del modelo) y el total de la
    categoría dice «hoy, 14:42 UTC». No es un error de datos, pero mezcla
    dos husos: lo cómodo sería que el modelo diga también «hora de España»
    en `subtituloCifra` o pase `cuandoDato` a hora de España (lo leen la web y
    la app, y las pruebas actuales esperan «UTC»). No lo toqué.
  - No hay pestaña «Histórico»: la serie diaria es de un año y «1 A» es la
    serie entera.
  - «Día y hora en 7 días»: en el eje de 1 S van días (las marcas caen a
    medianoche) y en la lectura, día y hora; en 1 M, igual (cada punto es
    una hora, así que la lectura necesita la hora para distinguirlos).

---

## 13 de noviembre de 2026 (22, parte app) · Claude · Gráfico con más detalle: la app

- **Encargo (13/11):** «El gráfico, cuanto más detalle en el tiempo tenga,
  mejor». Esta rama (`worktree-wf_9e649758-84d-3`) une la de datos y modelo
  (entrada 20, sin tocar su contenido) y hace **la parte de la app**:
  `rwadar-movil/componentes/MercadoBolsa.js` (pantalla «Mercado y noticias»
  y tarjeta de Inicio con su minigráfico). La web va en otra rama. **Nada
  publicado**: ni push, ni OTA, ni flujos.
- **Qué cambia, en llano:**
  1. La app lee la diaria **con su serie fina** (`cargarSerieConFina`) sin
     que nadie se lo pida, en la pantalla y en la tarjeta de Inicio. Cada
     pestaña usa la más fina que la cubre: **24 h, un punto cada 5 minutos;
     1 S y 1 M, cada hora; 3 M, 6 M, 2026 y 1 A, cada día**. Sin la fina (la
     web aún sin publicar, una foto antigua o una lectura que falla) todo
     sigue con la diaria, como hoy, y «24 h» sale desactivada.
  2. **Eje y cruz según el periodo, en hora de España**: en 24 h, horas
     («18:00», «00:00»…) y la cruz «02:15»; el primer punto, que es del día
     anterior, dice también el día («12 nov, 16:05»: si no, el primero y el
     último dirían la misma hora). En 1 S y 1 M, el eje con días y la cruz
     «día, hora» («9 nov, 15:00»). En las diarias, como antes (fecha; meses en
     1 A). En inglés igual («24H», «12 Nov, 16:05»).
  3. **Datos clave y fuente con la hora**: «Valor hoy … 13/11/2026, 16:05»,
     máximo y mínimo del periodo con su hora, «Cambio en 24 h» = el de la
     pestaña 24 h, y abajo «serie hasta el 13/11/2026, 16:05 (hora de
     España)» (el total de la categoría sigue en UTC y lo dice).
  4. Si una serie fina deja **tokens fuera**, el aviso del modelo
     (`g.avisoFuera`) sale bajo la cabecera, en la tarjeta de Inicio y para
     el lector, y «Cambio en 24 h» dice cuántos suma («29 de los 30
     mayores» si queda uno fuera).
  5. **Dedo fluido con 721 puntos**: el dibujo de fondo (rejilla, área,
     línea, eje, fechas, píldora) se calcula una vez por pestaña y tamaño;
     al arrastrar solo cambian la raya, el punto y la burbuja. El modelo de
     cada pestaña se calcula una vez por serie e idioma (antes, abrir «Cómo
     se calcula» lo rehacía y quitaba la cruz). Medido en Chromium con la
     CPU 4 veces más lenta (react-native-web, no un APK), mediana de 5
     arrastres de 150 movimientos: JavaScript por movimiento de **6,6 ms a
     4,8 ms** con 721 puntos (8,6 ms tenía 1 A diario con el código de
     antes); fotogramas de más de 33 ms, **de 10 a 4** (1 A: de 15 a 2).
  6. **Lector de pantalla a saltos que se oyen**: una hora en 24 h, 6 horas
     en 1 S, un día en 1 M y en las diarias (antes, de punto en punto: 288
     en 24 h).
  7. **Letra grande** (no pasaba solo con esto: con la letra al 200 %,
     «24 h» y «3 M» se partían en dos líneas, «2026» pisaba «1 A» y la
     burbuja se salía por los lados): las pestañas van en dos filas (4 y 3)
     si no caben; las cifras del eje crecen con la letra hasta 1,5 veces; las
     fechas de abajo que se pisarían se saltan; la burbuja mide su texto, no
     se sale y, si va en dos líneas, la franja de arriba crece para no tapar
     la línea. Con la letra normal, las medidas de siempre (270 px).
  8. Claves de las marcas por índice: en 24 h varias son del mismo día y se
     repetían. Las horas y fechas de abajo van centradas en su raya y, junto
     a los bordes, solo lo justo hacia dentro (con la letra al 130 % se
     perdía «00:00»).
- **Sin «Histórico» en la app:** el gráfico de la app nunca lo tuvo (sus
  pestañas son 24 h · 1 S · 1 M · 3 M · 6 M · 2026 · 1 A) y la serie diaria
  es de un año, así que sería igual que 1 A. «Histórico» es uno de los
  periodos del resumen (`PERIODOS`), no una pestaña.
- **Comprobado con el archivo real** de la entrada 20 (lectura del 13/11,
  30 tokens): 24 h acaba en la cifra grande (41.816 M$, «16:05»), −4,0 %;
  1 M +3,9 %. Los picos de 1-2 horas que se ven en 1 S y 1 M (p. ej. el 9/11
  de 13:00 a 15:00 UTC, unos −1.300 M$) son de figure-heloc en CoinGecko
  (bajó a 26.780 M$ y volvió a 27.903), no del gráfico.
- **Commits:** unión `517a627`, app `fd7f412` y `c102f06`, y este traspaso.
- **Pruebas:** `npm --prefix rwadar-movil test` 647 (645 bien, 0 fallos, 2
  omitidas; 41 en `tests/tokenizacion.test.cjs`, 7 nuevas y las de antes
  actualizadas, sin borrar ninguna). `npm test` en la raíz con el primer
  commit de la app: salida 0 (probar-web 711/711, 70 páginas y RSS,
  `rwadar-acceso` 313/313). Guardián de OTA con `--base fa30779…`:
  `ok:true`, 1.4.2(24). **Mutaciones: 23 de 23** (deshacer cada arreglo
  hace fallar alguna prueba). El modelo web sigue idéntico al de la app
  (`copiar-modelo-web.cjs --comprobar`; no lo toqué). Capturas de los
  componentes reales con react-native-web en Chromium (no un APK), con los
  datos reales, a 360 y 390 px, en inglés, con la letra al 130 % y al 200 %
  y sin serie fina: en el scratchpad de la sesión, `grafico/app/`.
- **Pendiente / para Víctor:**
  - Publicar primero la web (con el archivo `tokenizacion-serie-fina.json`)
    y después la OTA, cuando lo ordene. La OTA sola es segura: sin el
    archivo, la app sigue con la diaria.
  - Mirarlo en un Android de verdad (arrastre con 721 puntos y letra al
    130 %): las capturas y la medida son de Chromium.
  - Decidir si en 1 M la cruz debe decir solo el día (ahora «día, hora»,
    porque cada punto es una hora); es una línea en `cuandoCorto`.

---

## 13 de noviembre de 2026 (22, parte datos) · Claude · Gráfico con más detalle: los datos y el modelo

- **Encargo (13/11):** «El gráfico, cuanto más detalle en el tiempo tenga,
  mejor». Esta rama (`worktree-wf_cb8b9504-318-1`) es **solo la parte de
  datos y modelo**; las pantallas de la web y de la app van en otra rama.
  **Nada publicado**: ni push, ni flujos, ni la rama `datos-tokenizacion`.
  La empezó otro agente que se cortó por el límite de uso; esta sesión
  averiguó por qué no salía ninguna serie fina con datos reales, cambió la
  regla y lo terminó.
- **Qué cambia, en llano:**
  1. Además de la serie diaria de un año, dos series con más detalle, de
     **los mismos tokens** que la diaria: un punto **cada 5 minutos** de las
     últimas 24 horas (289 puntos) y uno **cada hora** de los últimos 30
     días (721). Van en un archivo aparte, `/datos/tokenizacion-serie-fina.json`
     (unos 39 kB, 10 kB comprimido), para que la app instalada y la web en
     caché sigan leyendo la diaria de siempre (su forma no cambia). Horaria
     de 30 días y no de 90: ninguna pestaña la usaría (3 M son 91 días y
     CoinGecko gratis da cada hora solo hasta 90) y el archivo, que leen
     Inicio y la app, pasaría de unos 39 a unos 90 kB.
  2. Pestaña nueva **«24 h»** («24H»), la primera. Cada pestaña usa la serie
     más fina que la cubre: 24 h, la de 5 minutos; 1 S y 1 M, la horaria;
     3 M, 6 M, el año y 1 A, la diaria. Sin la de 5 minutos, 24 h usa la
     horaria (25 puntos); sin ninguna fina, 24 h sale desactivada y lo demás
     va como antes. El «Cambio en 24 h» sale de la pestaña 24 h.
  3. **Por qué no salía ninguna serie fina (la nota anterior):** con datos
     reales, el mayor token, **figure-heloc (el 55 % del total de la
     categoría, el 64 % de la suma)**, no tiene datos en CoinGecko de 3 a 5
     horas cada mañana (de 07-08 a 11-12 UTC) ni de casi 24 horas cada fin
     de semana (26 huecos en 30 días en la horaria; uno de 3 h 35 min en la
     de 5 minutos). Con el margen de antes (media hora; 3 horas en la
     horaria) la de 5 minutos tenía 36 puntos sin dato completo y la
     horaria 85, y las dos se descartaban; quitar ese token habría dejado
     fuera más de la mitad del mercado.
  4. **La regla nueva:** cubos de 5 minutos o de 1 hora en UTC; de cada
     token vale su último dato en el cubo y, si no tiene, el anterior, **como
     mucho de 24 horas antes** (la diaria ya arrastra hasta 3 días). Si le
     falta más, o su lectura falla, **ese token queda fuera de esa serie
     entera** (no solo donde le faltan datos), y la serie guarda cuáles
     («fuera») y cuánto suman («valorFuera»); si pesan más del 1 %, esa serie
     no sale ese día. Los que pasan más de una hora sin dato van en
     «largos» y «Cómo se calcula» los nombra («1 token (figure-heloc) pasa
     ratos de más de una hora sin dato en CoinGecko: ahí cuenta su último
     dato»). Un token que CoinGecko empezó a seguir el primer día de la
     ventana o después cuenta 0 hasta su primer dato, como en la diaria.
  5. **Las tres acaban en el mismo punto** (el último dato de cada token):
     la cifra grande es el último punto de la diaria, el final de la línea
     de cada pestaña y la cruz en el último punto. Si en una fina queda un
     token fuera, su línea acaba «valorFuera» por debajo y el modelo da el
     aviso (`avisoFuera`: «la línea suma 29 de los 30: queda fuera 1 token
     sin datos de CoinGecko en este periodo (12 M$), así que acaba 12 M$ por
     debajo de la cifra grande»). La fina se une a su diaria por «generado»
     y por ese último punto; si no casa, el gráfico usa la diaria.
  6. Horas en **hora de España peninsular** (sin Intl, con el cambio de hora
     de la UE): eje de 24 h con horas («06:00», «12:00»), de 1 S y 1 M con
     días («7 nov»), de 1 A con meses; la cruz dice «10:20» en 24 h y «8 nov,
     18:00» en las horarias; con «largo», «13/11/2026, 10:20 (hora de
     España)». Igual en inglés.
  7. 720 puntos sin tirones: si hay más puntos que medios píxeles, de cada
     columna se pintan el más alto y el más bajo (no se pierde ningún máximo
     ni mínimo); la cruz busca entre todos con búsqueda binaria.
  8. **Flujo diario:** 13 s entre llamadas (como antes); unas 103 llamadas y
     23 minutos (medido el 13/11, sin ningún 429). La diaria se escribe
     antes de empezar las finas; las finas no empiezan llamadas pasados 34
     minutos; el paso tiene 40 y el trabajo 50. Si fallan las finas, queda
     la diaria nueva y la fina anterior, que no casa y no se usa. Archivos
     siempre enteros (nombre temporal y cambio de nombre).
- **Archivo real de prueba (para las pantallas y los revisores):**
  `/tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/grafico/tokenizacion-serie-fina.json`
  y su diaria `…/grafico/tokenizacion-serie.json` (la misma ejecución).
  Hecho de verdad con CoinGecko (gratis, sin clave, TLS y 13 s entre
  llamadas) y el código de esta rama, el 13/11 de 14:47 a 15:10 UTC: 102
  llamadas, 22,5 minutos, ningún 429. **30 tokens** (los de la diaria, 30 de
  los 40 mayores, un 85,7 % del total), **289 puntos de 5 minutos** (de las
  15:05 UTC del 12/11 a las 15:05 del 13/11) y **721 horarios** (del 14/10
  a las 15:00 del 13/11), ninguno fuera; «largos»: figure-heloc (en las
  dos) y theo-short-duration-us-treasury-fund (en la horaria). **38,6 kB**
  (9,7 kB comprimido). Las tres acaban en **41.816 M$** («13/11/2026,
  16:05» hora de España); cambio en 24 h −4,0 % (casi todo es figure-heloc,
  que en CoinGecko pasó de 28.320 a 26.617 M$ en esas horas). Con la regla
  anterior, esa misma lectura no daba ninguna serie fina. Las respuestas
  crudas están en `…/grafico/vivo/crudo/` (y otra lectura anterior en
  `…/grafico/real2/crudo/`), y `…/grafico/reproducir-real.mjs` rehace los
  archivos con ellas sin llamar a CoinGecko.
- **Dónde:** `rwadar-movil/lib/tokenizacion.js` (`RESOLUCIONES`,
  `construirSerieFina`, `validarSerieFina`, `seriesEnlazadas`,
  `unirSerieFina`, `seriePestana`, `avisoFuera`, `textoInstante`,
  `indicesPintar`…) y su copia `rwadar-site/assets/tokenizacion-modelo-20261110.js`;
  `rwadar-movil/lib/tokenizacion-serie-remota.js` (`cargarSerieConFina`);
  `rwadar-app/tokenizacion/serie-diaria.mjs --fina`;
  `rwadar-tokenizacion-historico.js` (`serieFinaTokenizacion`),
  `rwadar-publicar.js`, `rwadar-publicacion-segura.js`,
  `.github/comprobar-publicado.mjs`, `.github/workflows/tokenizacion-diaria.yml`
  y `publicar.yml`; semilla «sin serie fina» en
  `rwadar-site/datos/tokenizacion-serie-fina.json`.
- **Commits:** `3949e16` (modelo), `b0514f2` (generador, flujo y
  publicación) y este traspaso.
- **Pruebas:** `npm test` en la raíz con salida 0 (los guiones de
  rwadar-app y 11 + 109 de `node --test`, entre ellas las 15 de
  `.github/tokenizacion.test.mjs`;
  probar-web 711/711, 70 páginas y RSS, 40 de precarga; `rwadar-movil` 640:
  638 bien y 2 omitidas, con las 11 de `tests/tokenizacion-fina.test.cjs`;
  `rwadar-acceso` 313/313). Guardián de OTA con `--base fa30779…`:
  `ok:true`, 1.4.2(24). **Mutaciones: 47 de 47** (quitar cada regla, cada
  comprobación del validador, la unión, la cabecera, el generador, el
  publicador y el flujo hace fallar alguna prueba), hechas sobre una copia
  del worktree.
- **Pendiente / para quien una las pantallas:**
  - La web y la app tienen que leer la fina (`cargarSerieConFina` en la app;
    en la web, `/datos/tokenizacion-serie-fina.json` + `unirSerieFina`),
    decidir pestaña con `pestanaDisponible`/`seriePestana` (no con
    `tramo(serie.puntos, …)`, que con la diaria deja 24 h vacía) y enseñar
    `g.avisoFuera` cuando no esté vacío. Hasta entonces, si se publica esta
    rama sola, «24 h» sale desactivada y todo lo demás como hoy.
  - Al publicar: primero la web y después la OTA (la app lee el archivo de
    la web).
  - La fina es tan reciente como la última ejecución del flujo (06:23 UTC)
    **y** la última publicación de la web (manual): «24 h» son las 24 horas
    antes de la ejecución que se publicó. El subtítulo de la cifra dice la
    hora. Si se quiere más fresca, hay que ejecutar el flujo y publicar más
    a menudo (cada ejecución, unos 23 minutos de Actions).
  - `docs/INTERNO.md` describe lo publicado: ponerlo al día al publicar.

---

## 13 de noviembre de 2026 (21) · Claude · Ciclo más rápido

**Sin publicar.** Rama local `ciclo-rapido-integrado` (sobre `main` en
`f20b01b`), sin push ni PR: subirla y unirla necesita la orden de Víctor. No se
tocó Supabase, EAS, ningún flujo de GitHub ni el ciclo del 13/11.

- **Encargo (13/11):** «Hay que encontrar una forma de optimizar más aún estos
  procesos». Objetivo: que un día normal (re-fechas y pocas cifras) cueste
  alrededor de 1 h desde la orden hasta la publicación (hoy, unas 2 h), sin
  bajar el rigor: fuente primaria de hoy, revisor independiente y las mismas
  compuertas (`rwadar-publicacion-segura.js`, sello, guardián de la OTA,
  gitleaks).
- **Cómo se hizo:** tres mejoras en ramas aparte, cada una revisada por un
  revisor independiente («aprobado con cambios» las tres). Aquí se unen y se
  aplica todo lo que los revisores confirmaron, más dos fallos que solo
  aparecían al unir.

### Qué cambia

1. **CI en paralelo** (`.github/workflows/ci.yml`, `.github/partes-ci.mjs`,
   `.github/cambios-ci.sh`).
   - `npm test` ya no va en un solo trabajo: **«Batería 1/5» a «5/5»** y
     **«App móvil»** corren a la vez. El reparto sale solo de los
     `package.json`: una prueba nueva entra sola y ninguna corre dos veces.
     Cinco partes y no cuatro para que cada una quede bajo el minuto que
     cobra GitHub (unos 35 s estimados de pruebas por parte). Una prueba
     falla si una parte pasa de 40 s estimados: entonces hay que añadir otra.
   - El **PR que solo cambia el sello** (`estado.json`) no corre la batería:
     corre el trabajo **«Sello»** (las pruebas que leen el sello y la misma
     compuerta con la que empieza «Publicar web»). Es más estricto que antes:
     un sello que no publicaría ya sale en rojo en el PR.
   - La comprobación que exigen las reglas de la rama sigue llamándose
     **«pruebas»** (y «secretos» no cambia). Ahora es el último trabajo y
     falla si algo falla, se cancela o no corrió. También falla si el escáner
     de secretos encuentra algo (antes solo fallaba «secretos»).
   - Vigía en `flujos.test.mjs`: falla si otra prueba **o cualquier archivo
     de código** empieza a nombrar el sello sin que el trabajo «Sello» lo
     cubra.
2. **Vigía de fuentes** (`.claude/skills/investigacion-catalogo/vigia.mjs`).
   - En menos de 30 s y sin agentes lee Spiko, el oráculo de mTBILL, el libro
     de Brickwise, las tres suizas, el SHA-256 de los 50 PDF citados y las
     búsquedas de la CNMV. Escribe `<ciclo>/vigia.json` con «cambia», «no
     cambia» o «no se pudo leer», cada dato con su hora y su SHA-256.
   - El investigador confirma en la fuente lo que «cambia», re-fecha con la
     hora y la huella del vigía lo que «no cambia» (`"segunVigia": true`) y
     abre a mano lo demás. El revisor sigue reabriendo cada cambio crítico y
     muestrea lo re-fechado. Nunca se re-fecha nada que el vigía no leyó hoy.
   - Arreglado tras la revisión: el reparto de una venta en varias órdenes,
     la fecha de la mejor compra y las compañías de la CNMV ya se comparan.
     Antes salían «no cambia» y se habrían re-fechado sin releer. Hay una
     prueba que cambia 12 cifras de Brickwise y de las suizas y exige
     «cambia» en todas.
3. **Motor de la entrega** (`.claude/skills/investigacion-catalogo/entrega/`,
   manual en `FORMATO.md`) y flujo **`entrega-catalogo` por fases**.
   - Lo del día va en `<ciclo>/decisiones.json`. Ya no se copian ni adaptan
     a mano los tres guiones del día anterior; en la carpeta del ciclo quedan
     tres guiones finos que llaman al motor (`node <ciclo>/despues-de-aplicar.mjs`
     sigue igual).
   - Fases: `montar` (esfuerzo «high»); `revisar` **tres veces en el mismo
     mensaje**, una por lente, así los tres revisores van a la vez,
     independientes y empezando por `DIFF-ENTREGA.md`; `cerrar`: el corrector
     solo toca `decisiones.json`, después `motor.mjs auditar` y, si el SQL
     cambió, el auditor (esfuerzo máximo) con el diff.
   - Arreglado tras la revisión:
     - un día sin motor (altas o retiradas) con correcciones ya lo verifica
       el auditor de siempre (antes se quedaba sin verificar);
     - una prueba con la fecha de hoy pero de antes de empezar el ciclo
       (hora copiada de otro día, como las 79 de las suizas del 13/11) ya no
       vale, tampoco al re-fechar `transparencia.json`;
     - cinco guardas de `auditar` tienen ya su prueba;
     - `pedido` exige la fórmula exacta, sin nombres;
     - `despues --salida` ya no puede escribir fuera de la salida;
     - cada revisión lleva una **marca** y «cerrar» para si se copió mal
       entre fases. Se llama marca para no confundirla con el sello de
       publicación.
   - Arreglado al unir: `motor.test.mjs` y `pglite.test.mjs` rehacen el
     12/11 y fallaban en cuanto la web llevaba el catálogo de otro día (ya
     pasa con el del 13/11). Ahora se validan contra el catálogo de ese día.

### Cuánto se ahorra (estimación, salvo lo marcado como medido)

| Tramo | Antes (12 y 13/11) | Ahora | Ahorro |
|---|---|---|---|
| Investigación (reloj) | ≈ 26 min | ≈ 24–26 min (marca el ritmo el grupo de candidatas, que el vigía no cubre) | 0–2 min |
| Investigación (agentes) | ≈ 91 min-agente | ≈ 65 | ≈ 26 min-agente y menos CPU |
| Entrega | 60–65 min | 30–40 (35–50 si la corrección cambia el SQL) | 15–30 min |
| CI de los 3 PR del ciclo | ≈ 12 min | ≈ 4 min | ≈ 8 min (+ 2,5–3,5 por cada repetición) |
| Cifras que se mueven por la tarde | volver a investigar | segunda pasada del vigía (30 s) | 15–25 min esos días |

- **Medido:** la pasada del vigía (24 s, 99 peticiones) encontró las mismas
  12 cifras que los cuatro grupos a mano el 13/11. El motor rehace la entrega
  del 12/11 idéntica byte a byte. Los tiempos de CI de antes salen de los
  registros de GitHub.
- **Total en un día normal: unos 25–40 min menos.** El ciclo pasa de unas
  2 h a cerca de **1 h 20–1 h 35**. Para llegar a 1 h falta acortar lo que
  ninguna de estas mejoras toca: el grupo de candidatas (unos 26 min) y la
  cadena de publicación (PR, «Aplicar», sincronización, sello, preview y
  producción).
- **Minutos de Actions:** un PR con código pasa de unos 6 a unos 8 minutos
  facturados (hasta 14 si un runner lento pasa trabajos del minuto). El del
  sello, de 6 a 3. Un ciclo, de unos 18 a unos 19. Mirar Settings › Billing
  la primera semana.

### Cómo se usa mañana

1. **Antes:** subir esta rama, PR y unir (orden de Víctor). Sin eso, mañana
   todo funciona como hoy.
2. **Arranque:** tras la lectura pública, pasa el vigía contra la publicada
   del 13/11:
   `node .claude/skills/investigacion-catalogo/vigia.mjs --ciclo rwadar-app/data/verificaciones/2026-11-14-v2 --base rwadar-app/data/verificaciones/2026-11-13-v2`.
   Pon en el encargo de los investigadores lo que salga «cambia» o «no se
   pudo leer».
3. **Investigación:** lanza primero el grupo de candidatas y luego los otros
   tres. El flujo toma `<ciclo>/vigia.json` solo.
4. **Entrega:** escribe `<ciclo>/decisiones.json`. Solo existe el del 12/11
   (el 13/11 se hizo a mano), así que cópialo y cambia la cabecera (`desde`:
   `2026-11-13`, la publicada `434217eb`) y las ofertas. Con las entradas del
   13/11, el motor pidió 47 declaraciones `difiere`: la primera vez costará
   más que los 10–15 min de la tabla. Después:
   - `entrega-catalogo` con `fase: "montar"`;
   - `fase: "revisar"` tres veces en el mismo mensaje (`lentes: ["sql"]`,
     `["contenido"]`, `["cumplimiento"]`);
   - `fase: "cerrar"` con las tres revisiones **tal cual**, con su marca.

   Si hay altas o retiradas, `motor: false`.
5. **Antes de «Aplicar catálogo»:** segunda pasada del vigía contra la
   entrega que vas a aplicar (SKILL §3, punto 2).
6. **En el primer PR:** comprueba que salen «Batería 1/5» … «5/5», «App
   móvil» y «pruebas», y cuánto tardan. En el PR del sello, que sale
   «Sello». Anota los tiempos reales de cada fase en el informe del día.

### Commits

- Uniones: `481924b` (CI), `a4c03d8` (vigía) y `7b0dbff` (motor).
- Arreglos: `3fd390b` (CI: cinco partes, vigía del código y minutos en
  `INTERNO.md`), `7c213ec` (vigía) y `6e6cd3a` (motor, documentación y
  pruebas que no dependen del día).
- Ramas de origen: `worktree-wf_11b18fe9-ca5-1`, `-2` y `-3`. Sus entradas
  de traspaso se recogen aquí.

### Pruebas

- **`npm test` en la raíz: salida 0 en 4 min 46 s** (temporales en RAM). Base
  de datos (`rwadar-app`) entera en verde; motor y flujo de la entrega 22/22;
  `.github` 108/108 (`flujos.test.mjs` 11/11); `probar-web` 710/710; app
  móvil 630 (628 bien, 2 omitidas, 0 fallos); `rwadar-acceso` 324/324 (con
  las 11 del vigía).
- `npm --prefix rwadar-app run test:motor-entrega` (con PGlite): en verde.
  Antes del arreglo de la integración, fallaba («revisión futura o
  caducada»).
- **Como una parte de la CI:** en una copia limpia solo con las dependencias
  de `rwadar-app`, sin las de la raíz ni las de la app: motor y flujo 22/22,
  vigía 11/11 y `flujos.test.mjs` 11/11.
- **Mutaciones** (quitar cada arreglo; todas hacen fallar alguna prueba):
  - CI: volver a cuatro partes; que `rwadar-publicar.js` lea el sello fuera
    del modo remoto; un guion nuevo que nombra el sello.
  - Vigía: no comparar el reparto de la venta, la fecha de la mejor compra ni
    las compañías de la CNMV. Sin el arreglo entero fallan 2 pruebas.
  - Motor: sin auditor sin motor; «cerrar» sin mirar la marca; una afirmación
    o una prueba con hora copiada; `consultasDeHoy` sin el comienzo del ciclo
    (en `comun.mjs` y en `despues.mjs`); `pedido` con nombre;
    `transparencia.mjs` validando contra la web de hoy; `pglite.test.mjs`
    sin el catálogo de antes de aplicar.
  - Las de los autores (18 de la CI, 22 del vigía y 19 del motor) y las de
    los revisores no se han repetido aquí una a una: las pruebas que las
    cazaban siguen en la rama y pasan.
- **Vigía sin red:** la pasada en vivo del revisor (19:14 UTC, contra la
  publicada del 12/11), reproducida con el vigía arreglado, da lo mismo que
  antes: 16 cambian, 61 no, 50 PDF y 29 búsquedas iguales. Los arreglos no
  añaden falsos «cambia».
- **gitleaks** 8.30.1 con `rwadar-app/gitleaks.toml` sobre
  `origin/main..HEAD` (las ramas, las uniones, los arreglos y este
  traspaso): sin hallazgos.

### Rechazado (con motivo)

- **Quitar las dos regex con un nombre de pila de `preparar.mjs`**
  (recomendación del revisor de la entrega): siguen haciendo falta. Vigilan
  `notaOrigen` y `aprobadaReferencia` cuando se escriben a mano en
  `decisiones.json`, que la fórmula exacta de `pedido` no cubre.
- **Rehacer ya con el motor la entrega del 13/11 y cronometrarla**
  (recomendación del revisor de la entrega): queda para el primer ciclo
  real. Escribir ese `decisiones.json` es el trabajo de un montador y el
  ciclo del 13/11 está cerrado y publicado.

### Pendiente

- Medir en el primer ciclo real los tiempos de cada fase y los de la CI
  (`partes-ci.mjs` imprime lo que tarda cada orden, para ajustar `PESOS`).
- El disco de la máquina está casi lleno (unos 750 MB libres; el scratchpad
  ocupa unos 24 GB). Conviene liberar espacio, con permiso, antes del
  próximo ciclo.

---

## 13 de noviembre de 2026 (20) · Claude · Ciclo del 13/11: catálogo 434217eb aplicado, noticias y tokenización

- **Encargo (08:25 UTC):** «Actualiza las noticias, las ofertas y el gráfico
  de la evolución de la tokenización a hoy… lo más rápido posible pero bien
  hecho». Informe: [`INVESTIGACION-CATALOGO-2026-11-13.md`](../INVESTIGACION-CATALOGO-2026-11-13.md).
- **Catálogo:** revisión `434217eb` (SQL `b6f0129c…e7b4`), 22/25, vigente
  hasta el 20/11. Spiko 2,40 % / 3,98 % USD / 2,84 %; Brickwise con
  participaciones en venta al día; Pottendorfer sigue en 80 € (la orden de
  73 € desapareció antes de aplicar). PR #131, «Aplicar catálogo» n.º 18,
  PR #132 (sincronización) y #133 (sello). OTA n.º 28.
- **Noticias:** 5 «importantes»; ninguna de hoy (barridos de mañana y
  tarde). Las pruebas de noticias de la app y de Chromium usan ahora una
  edición fija de ejemplo (`rwadar-movil/fixtures/noticias-ejemplo.json`) y
  comprueban la publicada con reglas generales.
- **Web:** Cloudflare rechazó «Publicar web» n.º 86–90 por su avería de la API
  de Workers/Pages (15:42 UTC). Publicada al volver: n.º 91 (preview) y
  n.º 92 (producción, 16:07 UTC), comprobadas en vivo. Aviso «Ofertas y
  noticias al día (13/11)» enviado (avisar-novedad n.º 2).
- **Parado:** el límite de uso de 5 horas cortó a las ~10:00 UTC los cuatro
  trabajos en marcha; se retomaron a las 14:09 UTC.

## 13 de noviembre de 2026 (19) · Claude · Radar de Inicio legible

- **Encargo (13/11):** «Arregla el radar de inicio que se ve mal». Hecho en
  dos ramas (web y app), unido aquí y corregido con cuatro revisiones (aspecto
  y código, de cada lado). **Publicado el 13/11 (orden de Víctor: «lo más
  rápido y mejor posible»):** PR #128 y sello #129; OTA n.º 27 (base
  fa30779, 1.4.2(24)); web n.º 85 (preview n.º 84). En la web publicada,
  comprobaciones en vivo 88/88 (radar 19/19 en 320×568, 360×780, 390×664,
  390×844 y 1366×900: leyenda de 6 filas, 0 textos dentro del radar en el
  móvil, sin desborde, sin errores; más 1211, novedades, sesión, avisos y
  colabora).
- **Qué se veía mal (capturas de la web publicada):** en el móvil, los
  nombres de los tipos iban dentro del dibujo del radar; al escalarlo
  crecían y se montaban («Inmobiliario 3» encima del aro, «Materias primas»
  sobre puntos, «Acciones 7» sobre el borde). Con pantalla baja (un iPhone
  en Safari, 390 × 664) se escondían y quedaba una bolita de puntos sin
  sentido. En la app pasaba lo mismo (nombres de 6-7 px pegados al aro; en
  pantalla baja, una bolita de 84 px).
- **Qué se ve ahora (igual en la web móvil y en la app):**
  1. A la izquierda, el radar redondo **sin texto**: aro, anillos, marcas,
     sectores, barrido, ecos, puntos y el hexágono en el centro. Con
     «reducir movimiento», el barrido quieto a -38° y sin ecos.
  2. A la derecha, la **leyenda en texto real**: 6 filas en el orden del
     radar (Inmobiliario, Crédito, Tesoro, Acciones, Materias primas,
     Infraestructura), con el punto del color del tipo, el nombre en gris
     de lectura (13 px; 12 en pantalla baja) y la cifra de plataformas a la
     derecha en monoespaciada. En inglés, con el diccionario de siempre
     (Property, Credit, Treasury…): ninguna clave nueva.
  3. **Sin cifras** (revisión vencida o sin comprobar): solo los nombres.
     **Un tipo con 0 plataformas:** su fila se queda con «0» atenuado.
  4. El lector de pantalla oye la leyenda una sola vez (el dibujo sigue
     oculto). Tocar el radar (web) o un punto (app) sigue como antes.
  5. Medidas: con alto normal, aro de 150 px en la web y 157 en la app,
     bloque de 176; con pantalla baja (web: alto ≤ 700 y ancho < 768; app:
     alto < 700), aro de 113 y 116, bloque de 128 y 124. Por debajo de 350
     px de ancho con alto normal encoge el radar, no la leyenda (a 320, aro
     de 127 en la web y 129 en la app). «Ver las ofertas» y el aviso de
     riesgo siguen en la primera pantalla.
  6. **Tableta y escritorio (web):** el radar grande con los rótulos
     alrededor, recolocados para no pisar el aro ni las marcas (medido de 768
     × 1024 a 1920 × 1080 y en 1000 × 650); la leyenda queda solo para el
     lector. Un tipo a cero lleva también su «0» atenuado.
- **Arreglado tras las revisiones (comprobado antes):**
  - Web: la caja del radar ensanchaba la cabecera en móviles estrechos de
    alto normal (a 320 × 720 la página se salía 24 px; a 360 × 780 los
    márgenes quedaban 16 y 11,8). Arreglado con `min-width:0`. El dibujo
    recortado al aro tocaba la barra de arriba: ahora deja 8 px (4 en
    pantalla baja). En escritorio, el «0» atenuado. Fuera un resto de la
    letra de 11 px en `rotulos()`.
  - App: al quitar «reducir movimiento» con la app abierta, el barrido solo
    recorría 38°: ahora arranca desde 0. Ecos añadidos (salen del mismo giro
    del barrido, sin bucles nuevos). Con letra del sistema enorme, la
    leyenda pasa debajo con un radar de 112 (antes 168) y el punto crece con
    la letra. Las pruebas ya no llevan las cifras del catálogo de hoy
    escritas a mano (un ciclo del catálogo las habría roto).
- **Dónde:** web, `rwadar-site/index.html` (la leyenda `#inicioRadarLista`
  dentro de `[data-inicio-radar]`), `assets/rwadar-20260820.js`
  (`pintarRadarInicio`, `leyendaRadarInicio`, `radarInicioSvg(sin,rotulos)`),
  `assets/secciones-20261110.css` y `assets/rwadar-20260820.css`; app,
  `rwadar-movil/componentes/Radar.js` (`medidasPortada`,
  `filasLeyendaPortada`, `faseEco`, `rangosEco`) e `Inicio.js`.
- **Commits:** web `1369b1b` y `180b876`; app `09b5783` y `a1b9309`;
  uniones `fa9f863` y `4627625`; arreglos de la revisión `6152f51` (web) y
  `b1175c6` (app), y este traspaso.
- **Pruebas (integrado):** `npm test` en la raíz con salida 0: `rwadar-app`
  (32 guiones con 1348 correctas, más 11 y 103 de `node --test`),
  `test:web` (probar-web 710/710, 70 páginas y RSS, 40 de precarga), qr,
  `rwadar-movil` (629 pruebas: 627 bien, 0 fallos, 2 omitidas; 13 en
  `tests/radar-portada.test.cjs`), tools y `rwadar-acceso` 313/313 (con
  `radar-inicio-navegador.test.mjs`: 10 tamaños de móvil de 320 × 568 a 430
  × 932, entre ellos 320 × 720, 360 × 780 y 360 × 800, y 6 de tableta y
  escritorio, en castellano y en inglés; márgenes, aire, sin cifras, tipo a
  cero también en escritorio, cambio de tamaño en vivo y toque). Guardián de
  OTA con `--base fa30779…`: `ok:true`, 1.4.2(24). gitleaks sobre
  `origin/main..HEAD`: sin hallazgos. Mutaciones (quitar cada arreglo): las
  5 de la web y las 11 de la app hacen fallar alguna prueba; con el catálogo
  cambiado (una plataforma de Tesoro menos) las pruebas de la app siguen en
  verde. Capturas en el scratchpad de la sesión (`radar/final/web` y
  `radar/final/app`; las de la app son componentes reales con
  react-native-web, no un APK).
- **Pendiente / para Víctor:**
  - Publicar la web y enviar la OTA cuando lo ordene (el guardián de OTA da
    `ok:true`; solo cambia JavaScript).
  - Mirar la app en un Android de verdad con la letra al 130 %: las
    capturas son de los componentes reales con react-native-web, no de un
    APK.
  - Ya pasaba antes y no es del radar: con la letra al 130 % a 320 px (y al
    200 % a 412) la fila «Revisado el 12/11/2026» se sale por la derecha en
    la app.
  - `docs/INTERNO.md` describe lo publicado: ponerlo al día al publicar.

---

## 12 de noviembre de 2026 (18) · Claude · Novedades al abrir la app y la web

- **Víctor:** «que salga al abrir la app y como las novedades, tipo un texto
  informativo muy fácil de leer con las novedades y si clickan que salga en
  detalle». Hecho en dos ramas (web y app) y unido aquí con una revisión.
  **Publicado (12/11, orden de Víctor):** PR #125 y sello #126; web n.º 83
  (preview y producción, comprobaciones en vivo 69/69); OTA n.º 26 (base
  fa30779, 1.4.2(24)); anuncio 1 «Novedades de RWAdar» con enlace
  /novedades-rwadar/ por avisar-novedad.yml (sale por push y en la campana).
  Guía:
  [`NOVEDADES-RWADAR-2026-11-12.md`](NOVEDADES-RWADAR-2026-11-12.md).
- **Qué ve la gente:**
  1. Al abrir la web o la app, cuando ya se ve Inicio y no hay nada encima,
     sale **una vez por versión** una ventana: «Novedades de RWAdar», la
     fecha y 5 puntos de una línea con su icono (avisos en el móvil como un
     WhatsApp; el número de avisos sin leer; en la web, la sesión de 30 días;
     el correo rwadares@gmail.com y «¿Quieres colaborar…?»; «Calcula tus
     números» y «Mercado y noticias»). Botones **«Ver en detalle»** y
     **«Entendido»**.
  2. «Ver en detalle»: en la web, la página **/novedades-rwadar/**; en la
     app, una pantalla. Cada novedad en frases cortas, con «Cómo se hace» y
     el camino a **Perfil › Avisos**; las dos enlazan las anteriores (/cambios).
  3. Para volver a verlas: «Novedades de RWAdar» en Perfil (web y app), en la
     cuenta de escritorio y en el pie de la web.
  4. Un aviso con enlace `https://rwadar.pages.dev/novedades-rwadar/…`: en la
     web abre esa página; en la app, al tocarlo en la tarjeta «Avisos» de
     Inicio, abre la pantalla de detalle (`destinoAviso` → `novedades`), no el
     navegador.
- **Después (mismo PR #125):** quitado el nombre del responsable de los
  comentarios del código público de la web (`rwadar-site/assets`) y de los
  archivos nuevos; solo queda donde lo exige la ley (aviso legal y
  privacidad).
- **Una sola fuente:** `rwadar-site/datos/novedades-producto.json` (versión
  `2026-11-12`, inglés en campos `en`). La app lo descarga de
  rwadar.pages.dev (6 s, sin cookies, forma exacta, 32 kB) y lleva una copia
  igual en `rwadar-movil/lib/novedades-producto.js` y su ejemplo. **Esa copia
  la escribe `node rwadar-novedades-producto.js`** (raíz; `--comprobar` falla
  si no coinciden); probar-web y la prueba de la app exigen que coincidan.
- **Lo visto:** web, `localStorage["rwadar.novedades.vista"]`; app,
  `rwadar.editorial.novedades.vista.v1` (se borra con «Borrar datos del
  dispositivo»). Solo la versión. Privacidad de la web («Novedades ya
  vistas», apartado 2, y «Datos locales») y de la app: estrictamente
  necesario (LSSI, art. 22.2), sin datos personales.
- **Commits:** web `52c41dd` y `ed3c069`; app `a26a883` y `cf87a96`; uniones
  `972296a` y `4a1ec75` (único choque: esta entrada); correcciones de la
  revisión `264f571` (textos), `7a4d27b` (app) y `9259271` (web), y este
  traspaso.
- **Arreglado de la revisión (comprobado antes):**
  - **Textos ciertos en las dos.** La app no tiene campana ni la casilla
    «Mantener la sesión iniciada» y no pone número en el icono de Android.
    Ahora: «Un número, como un «1», te dice cuántos son»; el detalle dice
    dónde sale en la web (campana y Perfil) y en la app (pestaña Inicio); la
    sesión dice «en la web»; el paso 3 es «Activa «Notificaciones en este
    móvil»» (vale en las dos); en Android, «en la app de RWAdar o en la web».
    Prueba nueva: lo que solo es de la web dice «en la web», y cada «…» del
    resumen existe en la app.
  - **App:** la ventana espera también a «Mercado y noticias», «Aprende» o
    una noticia abiertas desde Inicio (`onPantalla` → `pantallaInicio`), y
    respeta la barra de estado y la de 3 botones (`useSafeAreaInsets` + 16).
  - **Web:** si el navegador deja leer pero no guardar, ya no sale en cada
    carga (se prueba a guardar antes). Cuándo sale lo deciden funciones puras
    del modelo (`motivoSinVentana`, `estadoVentana`) que probar-web prueba
    sin navegador: quitar la espera a otro diálogo ya falla en CI.
    `role="list"` en puntos y pasos (VoiceOver); el título no parte palabras
    a 320 px con la letra al 200 %. «Novedades anteriores» en la página.
  - Guía y LEEME: no se añaden campos ni se suben límites del JSON sin una
    OTA antes (la app ignoraría el archivo nuevo sin avisar).
- **Pruebas (integrado, todo en verde):** `npm test` en la raíz con salida 0:
  `npm --prefix rwadar-app test` (32 guiones con 1348 correctas, más 11 y
  103 de `node --test`), `npm run test:web` (probar-web 708/708, 70 páginas
  y RSS, 40 de precarga), `npm --prefix rwadar-movil test` (614 bien, 0
  fallos, 2 omitidas), qr, tools y `node --test rwadar-acceso/*.test.mjs`
  (312/312, con la de Chromium de las novedades, que ahora también prueba
  `setItem` que falla). Guardián de OTA con `--base fa30779…`: compatible con
  1.4.2(24). Diccionario de la web idéntico al de la app y copia de las
  novedades al día. gitleaks 8.30.1 sobre `git diff origin/main...HEAD`: sin
  hallazgos. Mutaciones: sin la espera a otro diálogo o sin la prueba de
  guardar, probar-web falla; con «campana» sin «en la web», la prueba de la
  app falla. Capturas a 390 px (web y app) en la carpeta de la sesión
  (`novedades/final/`); las de la app son de los componentes reales con
  react-native-web y las barras del móvil simuladas, no de un APK.
- **Para Víctor (decidir):**
  - La ventana también sale a quien entra por primera vez en la web (le
    habla de avisos y sesión que aún no conoce). Se puede no enseñarla a quien
    no tiene ningún rastro de uso; no lo he cambiado.
  - En Android digo «en la app de RWAdar o en la web»: el encargo decía solo
    la app, pero la web también activa las notificaciones en Android.
- **Pendiente (con orden de Víctor):** publicar la web (preview y producción)
  y después la OTA. Sin la web publicada, la app enseña su copia incluida.
  Para cada novedad nueva: editar el JSON, subir `version`,
  `node rwadar-novedades-producto.js` y las pruebas.

## 12 de noviembre de 2026 (17) · Claude · Envío de notificaciones ENCENDIDO para todos (decisión de Víctor)

- **Víctor (21:30 UTC):** «Activa ya las notificaciones y todo». Se le explicó
  que esperar un día era la cautela C5/C7 del anexo legal: los Android que
  sigan con el JS de la OTA n.º 23 podrían activar las notificaciones sin ver
  la frase de primera capa. Ventana pequeña y privacidad ya completa. Decide
  encenderlo hoy.
- **`activar-push`** (n.º 20, con copia cifrada): «RWAdar 30 OK: … push
  encendido, … reloj rwadar-novedades cada 5 minutos». Desde ahí `procesar()`
  envía cada 5 min, por Expo (Android) y por Web Push desde Supabase, a quien
  tenga el permiso vigente y el móvil activado. No hay anuncios pendientes y
  el aviso automático de ofertas sigue apagado.
- **Privacidad:** «ya las enviamos desde el 12/11/2026», sin el «cuando
  empecemos». probar-web 684/684.
- **Pendiente:**
  - C6, la prueba en un Android físico;
  - el primer anuncio real con «Avisar novedad», cuando Víctor lo pida;
  - las plantillas de Auth en el panel;
  - organización en GitHub.

## 12 de noviembre de 2026 (16) · Claude · Publicado: sesión que se mantiene, sin el nombre y prueba de notificaciones por Supabase aceptada por Apple

- **PR #118 y #119** (sello): sesión con `__Host-rwadar-renovar`, sin el nombre
  en la información básica y notificaciones sin atascos.
  - Web n.º 76 (preview) y n.º 77 (producción). OTA n.º 25.
- **PR #120 y #121** (sello): sin el nombre del titular en lo que ven los
  usuarios, y acción `hacer-admin` por huella SHA-256 del correo (ni el correo
  ni la huella van a Git).
  - Supabase: `ensayo-34` n.º 18 y `aplicar-34` n.º 19, «RWAdar 34 OK».
  - Web n.º 78 (preview) y n.º 79 (producción). Comprobaciones como visitante:
    sesión 6/6, notificaciones 6/6 y general 38/38. /acceso ya no lleva el
    usuario de GitHub.
- **Cuenta del móvil de Víctor** marcada como administración con `hacer-admin`
  (n.º 16), solo con la huella.
- **Prueba de punta a punta** (`prueba-webpush` n.º 17): «1 notificación; 1
  aceptada por el servicio de push», código [201] de Apple.
  - Recorrido: Supabase (pg_net) → servidor de la web (Cloudflare) → Apple →
    iPhone de Víctor (web en la pantalla de inicio).
  - Cumple la condición C4 del anexo legal.
  - Antes, el iPhone ya había enseñado la notificación local «Notificaciones
    activadas en este móvil».
- **Envío para todos: sigue apagado** (`push_habilitado=false`). Queda
  `activar-push` cuando las OTA n.º 24 y 25 lleven un día en uso (C5 y C7).
  C6 (Android físico) sigue sin poder hacerse.
- **El nombre del titular queda solo** en el aviso legal y la privacidad (la
  ley lo exige). También en:
  - las plantillas de Auth que hay hoy en el panel de Supabase: las del
    repositorio ya van sin él; hay que pegarlas o lanzar `plantillas` cuando
    haya SUPABASE_ACCESS_TOKEN;
  - el usuario de GitHub en el destino de `/android` y en la comprobación de
    versión de la app, hasta que haya organización en GitHub.

## 12 de noviembre de 2026 (15) · Claude · Sin el nombre del titular en lo que ven los usuarios

Víctor: «Siii todo lo que puedas quitar mi nombre hazlo». Su nombre completo
queda solo donde la ley lo pide: el aviso legal y la privacidad de la web
(LSSI, art. 10; RGPD, art. 13). Commits `b44a044`, `acd93d0`, `f1b13ef` y
`3ed26b8`, y los de la revisión: `3d5d61d` y `6306dcd` (más este traspaso),
en `claude/sharp-babbage-m3bbbw`, **sin push. Sin publicar; Supabase y EAS sin
tocar; la 34 sin aplicar.**

- **Hecho, en llano:**
  1. `/acceso`: «Descubre la app para Android» lleva a `/android`, no a la
     dirección de GitHub con el usuario. `_redirects` no cambia.
  2. Correos de Auth (alta y contraseña, `rwadar-app/plantillas-auth/`) y
     el de prueba de `correo-lettermint.sh`: el pie sin el nombre, con la
     dirección postal (la pide Lettermint) y el aviso legal enlazado.
  3. Avisos por correo (hoy apagados): **migración 34**
     (`db/34_pie_sin_nombre.sql`, copia idéntica en `supabase/migrations/`).
     Solo redefine `correo_mensaje`: el pie dice «Responsable: el titular de
     RWAdar, Plaza Generalitat, s/n, 46600 Alzira (Valencia), España (aviso
     legal · privacidad)». Se niega sin la 31 y con correos a medias de
     menos de 25 minutos. Verificador propio; el 31 ya no fija el nombre.
  4. **Corrección de la revisión** (`3d5d61d`): `activar-correo` se niega sin la 34
     (también si se reaplicó la 31 después) y pasa los verificadores 30, 31
     y 34; así ningún aviso puede salir con el nombre. Lo dicen el RUNBOOK
     (paso 11), el contrato (11.2) y el LEEME de `rwadar-app`.
  5. El comentario del HTML de Inicio (se publicaba tal cual) ya no lleva
     el nombre de pila (`6306dcd`). `probar-web` mira ahora también lo publicado: el
     nombre completo en cualquier archivo y el de pila en los comentarios
     del HTML, salvo `privacidad.html`, `_worker.js` y `_redirects`.
- **Pruebas:** `npm test` en la raíz con salida 0 (incluye
  `npm --prefix rwadar-app test`, `npm run test:web` y `rwadar-acceso`);
  `probar-pie-sin-nombre.mjs` 25/25 y `probar-avisos-registrados.mjs`
  277/277 (nuevas: activar sin la 34 o tras reaplicar la 31 se niega).
  Mutaciones, restauradas: sin la comprobación de la 34 en
  `activar_correo.sql` fallan 4 y 2; con el comentario de antes en Inicio
  falla `probar-web` (fuente y publicado). gitleaks sin hallazgos.
- **Lo que queda, a propósito:**
  - El aviso legal y la privacidad (`rwadar-site/privacidad.html`): lo
    exige la ley.
  - El usuario de GitHub en las URL de descarga (`_redirects`, la app y el
    vigilante) hasta que `RWAdar-downloads` pase a una organización; se ve
    en la página de descargas. Cambiarlo es alojamiento y OTA: con permiso.
  - Las plantillas de Auth del panel de Supabase **siguen con el nombre**
    hasta pegarlas: «Supabase (gestión de Auth)» › `plantillas` (o a mano,
    ver su LEEME). Hasta entonces `estado` dirá que no coinciden.
  - Documentos internos (repositorio privado) y las migraciones 30 y 31 ya
    aplicadas, cuyo pie sustituye la 34.
- **Cómo se publica** (cada paso, con orden expresa de Víctor):
  1. PR a main y CI.
  2. **Web:** sello, «Publicar web» en preview, mirarla y producción.
  3. **Base:** «Avisos a registrados (base)» › `ensayo-34` y `aplicar-34`
     (copia cifrada antes). Imprescindible antes de `activar-correo`.
  4. **Auth:** `plantillas`, como arriba.
- **Duda legal:** en los avisos de novedades (posible comunicación
  comercial, LSSI art. 20.1) va «el titular de RWAdar», su dirección y el
  aviso legal enlazado (nombre y NIF). Que lo confirme quien revise lo
  legal; la alternativa prudente sería dejar el nombre solo en los anuncios.

---

## 12 de noviembre de 2026 (14) · Claude · Integrador: la sesión que se mantiene, sin el nombre en los avisos y notificaciones web sin atascos

Víctor, en su iPhone con la web en la pantalla de inicio: «Y que al iniciar
sesión se mantenga porque no se mantiene», «No funciona lo de activar
notificaciones» y «No quiero que salga mi nombre aquí». Commits en
`claude/sharp-babbage-m3bbbw`, **sin push. Sin publicar; Supabase y EAS sin
tocar.** Sin SQL ni migraciones. El detalle de cada parte, en las entradas
(14a) y (14b) de abajo.

- **Qué cambia, en llano:**
  1. **La sesión ya no se pierde a la hora.** El servidor de la web guarda
     también el código de renovación (segunda cookie) y pide un pase nuevo
     solo. Con la casilla «Mantener la sesión iniciada en este dispositivo»
     (sale sin marcar; al entrar y, ahora también, al confirmar la cuenta
     desde el correo) dura 30 días desde el último uso aunque se cierre la
     web instalada; sin ella, hasta cerrar el navegador.
  2. **«Notificaciones en este móvil» ya no se queda colgado**, ni en
     «Comprobando…» ni en «Un momento…»: cada paso tiene plazo, el fallo se
     dice en llano y hay «Reintentar» o «Entrar de nuevo».
  3. **Sin el nombre** en la información básica de los avisos (web, `/acceso`
     y app): «Responsable: el titular de RWAdar (persona física),
     identificado con nombre, NIF y domicilio en el aviso legal», con enlace.
- **Uniones** (`git merge --no-ff`): la sesión (`9f8b935`) y el nombre y las
  notificaciones (`7e157fc`). Solo chocó la parte de arriba de este archivo:
  quedan las dos entradas como (14a) y (14b).
- **Revisión aplicada:**
  - `3222eea` (importante): al activar o desactivar, el registro del service
    worker, leer y quitar la suscripción y la notificación de muestra no
    tenían plazo; ahora sí, y al volver a la app un intento de más de un
    minuto se suelta. La prueba de Chromium de la sesión fallaba a ratos en
    paralelo (esperaba la dirección por una cadena que ya se cumplía): ahora
    espera por la ruta.
  - `a762a88` (menores): un 409 de Supabase al renovar es pasajero (503, no
    saca a nadie); salir con un pase rechazado renueva y repite el cierre;
    entrar, reautenticar o confirmar el correo con otra sesión abierta cierra
    la anterior en Supabase; el enlace del correo canjea su refresh_token y
    deja las dos cookies; privacidad («dos cookies necesarias para tu
    sesión», la duración larga solo si se pide) y registro de actividades al
    día. `6ab4982`: aire bajo la casilla nueva.
  - Corregido en (14b): las plantillas de Auth **sí se envían hoy** con el
    nombre completo en el pie (ver abajo).
- **Pruebas** (árbol de `6ab4982`):
  - `npm test` en la raíz, salida 0: `rwadar-app` (30 scripts con «0
    fallidas», entre ellos 275/275, 89/89 y 64/64; 11/11 y `.github`
    103/103), `probar-web` 683/683, 70 páginas y RSS, 40 de precarga, QR
    bien, `rwadar-movil` 596 y 2 omitidas, herramientas bien (diccionarios
    de la web y la app idénticos) y `rwadar-acceso` 311/311 con Chromium,
    en paralelo;
  - `node --test rwadar-acceso/*.test.mjs` aparte, dos veces: 307/307 (antes
    de las correcciones menores) y 311/311;
  - nuevas: 5 casos de Chromium con el navegador colgado al activar y al
    desactivar, y 4 del servidor (409, salir con el pase rechazado, la
    sesión anterior cerrada y el enlace con refresh_token);
  - mutaciones, restauradas y comprobadas con `cmp`: con el JS de antes o
    sin soltar al volver a la app, falla la prueba de Chromium; quitando
    cada arreglo del servidor, falla su prueba (4 de 4);
  - en Chromium, el enlace del correo enseña la casilla sin marcar (no en
    el de cambiar la contraseña) y manda `refresh_token` y `mantener`;
  - guardián de OTA con `--base fa30779`: compatible, 1.4.2(24);
  - gitleaks 8.30.1 (`rwadar-app/gitleaks.toml` y por defecto) sobre `git
    diff origin/main...HEAD` y sobre los commits `origin/main..HEAD`: sin
    hallazgos.
- **Para publicar** (cada paso con orden expresa de Víctor):
  1. PR a main y CI.
  2. **Web:** sello de main y «Publicar web», primero preview y después
     producción (cambia el servidor). En la preview: entrar con la casilla,
     cerrar del todo la web instalada, abrirla y seguir dentro; Perfil ›
     Avisos sin «Comprobando…».
  3. **App:** OTA («OTA Android»): cambian el texto de la información
     básica, el interruptor que ya no se queda ocupado y el aviso de sesión
     caducada (solo JavaScript; guardián compatible con 1.4.2(24)).
  4. **Víctor, una vez publicada la web:** volver a entrar en el iPhone desde
     la web instalada y marcar la casilla (las sesiones de antes no tienen
     código de renovación).
- **Queda pendiente o para decidir:**
  - **El nombre en los correos de Auth** (confirmar alta y recuperar
    contraseña, `rwadar-app/plantillas-auth/`): se envían hoy con «Víctor
    Manuel Jorques Granero» en el pie. Para quitarlo, un pie como «RWAdar ·
    su titular, identificado en rwadar.pages.dev/privacidad#aviso-legal ·
    Plaza Generalitat, s/n, 46600 Alzira (Valencia), España ·
    rwadares@gmail.com», y ponerlo en Supabase con su permiso. En los avisos
    por correo (apagados), el art. 20 de la LSSI pide identificar al
    remitente.
  - Riesgos aceptados: una renovación lenta de la sesión vieja que llega
    después de volver a entrar puede pisar las cookies nuevas (obliga, como
    mucho, a entrar otra vez); Supabase limita las renovaciones por IP y
    todas salen de Cloudflare (un abuso podría agotarlo un rato; con su
    permiso se puede subir en Supabase Auth › Rate Limits, u opcionalmente
    firmar la cookie con un secreto del servidor).
  - Que quien revise lo legal confirme la frase del responsable sin nombre
    (LOPDGDD, art. 11.2.a); el nombre está a un toque, en el aviso legal.

## 12 de noviembre de 2026 (14a) · Claude · Sesión de la web que se mantiene: el servidor renueva el pase y casilla «Mantener la sesión iniciada»

Víctor, probando en su iPhone con la web en la pantalla de inicio: «Y que al
iniciar sesión se mantenga porque no se mantiene». Commits `f4414f8` y
`43b0416` en la rama del worktree, **sin push. Sin publicar; Supabase y EAS
sin tocar.** Sin SQL ni migraciones.

- **La causa.** La pasarela (`rwadar-acceso/servidor.mjs`) guardaba en la
  cookie solo el pase de Supabase (access_token, una hora) y tiraba el
  refresh_token; la cookie no llevaba Max-Age. A la hora, o al cerrar la web
  instalada (iOS lo trata como cerrar el navegador), la sesión se perdía y
  Perfil › Avisos daba 401.
- **El servidor** (`f4414f8`):
  - segunda cookie `__Host-rwadar-renovar` con el refresh_token (HttpOnly,
    Secure, SameSite=Lax, Path=/). Su valor empieza por `p.` (marcó
    «mantener») o `s.` (no), para reescribir igual las dos al renovar;
  - con «mantener»: Max-Age en las dos; el pase, su `expires_in`; la de
    renovar, **30 días**, reescrita en cada renovación (caduca tras 30 días
    sin usar la cuenta en ese navegador: quien mira su cartera una vez al
    mes no tiene que volver a entrar, y un móvil perdido o compartido no queda
    abierto para siempre). Sin «mantener», sin Max-Age, como antes, pero el
    pase se renueva mientras el navegador siga abierto;
  - estado de la sesión, `/datos`, `/cartera`, `/reautenticar` y las lecciones
    de la Academy: si el pase falta, le queda menos de un minuto o Auth lo
    rechaza (401/403), se renueva una vez y se reescriben las dos cookies;
  - en paralelo: las peticiones con el mismo refresh_token en un isolate
    comparten una renovación 10 s (búsqueda síncrona, sin `await` antes de
    guardarla); entre isolates, Supabase da el refresh_token vigente (el padre
    del vigente se admite siempre). Ninguna cierra la sesión de otra;
  - Supabase rechaza la renovación (400/401/403): se borran las dos y es «sin
    sesión». Un fallo pasajero (red, 5xx, 429) no borra nada;
  - cupo de 60 renovaciones por visitante cada 10 minutos (todas llegan a
    Supabase desde la dirección compartida de Cloudflare, como las
    contraseñas);
  - salir revoca la sesión en Supabase (`/auth/v1/logout`, renovando antes el
    pase si hace falta) y borra las dos. Borrar la cuenta
    (`rpc/borrar_mi_cuenta`) borra las dos (la base ya quitó sus sesiones). El
    enlace del correo (`adoptar`) y el tutorial de la app dejan solo el pase y
    borran la de renovar;
  - ninguna respuesta lleva tokens; no se registra nada;
  - `compilar.cjs`: el `_worker.js` deja cada Set-Cookie en su cabecera
    (`getSetCookie`), sin unirlas con comas.
- **La web** (`43b0416`):
  - `/acceso`, solo en «Entrar»: casilla «Mantener la sesión iniciada en este
    dispositivo», **sin marcar**, con una nota (30 días con una cookie, se
    borra al salir, no en un dispositivo compartido, enlace a
    `/privacidad#cookies-sesion`). Se desmarca al cambiar de vista; el alta no
    la manda. El formulario de `rwadar-20260820.js` no cambia: con el servidor
    (siempre, en producción) «Entrar» lleva a `/acceso`;
  - por qué sin marcar: la LSSI (22.2) exime lo estrictamente necesario para
    el servicio que se pide, y la guía de cookies de la AEPD solo exime sin
    más las de autenticación «de sesión». Una cookie de autenticación que
    sobrevive al navegador la tiene que pedir la persona, marcando ella la
    casilla (el GT29, dictamen 4/2012, pone ese ejemplo, «recordarme»); una
    casilla ya marcada no es una petición expresa (TJUE, Planet49). Para el
    revisor legal;
  - inglés de la casilla y de su nota en el diccionario común
    (`rwadar-movil/lib/idioma-en.js` y su copia en la web). `/acceso` sigue
    sin traductor: hoy se ve en castellano;
  - privacidad §2 (fila «Sesión de tu cuenta», ancla `cookies-sesion`) y §9:
    nombre, finalidad y duración de las dos cookies y que son estrictamente
    necesarias para la sesión que se pide. Fecha sin cambiar (12/11/2026).
    Registro de actividades, versión 8.
- **Pruebas:**
  - `rwadar-acceso/sesion-mantenida.test.mjs` (19), con la rotación de GoTrue
    simulada: entrar con y sin «mantener», atributos exactos, renovación al
    caducar o a menos de 60 s, rechazo de Auth, paralelo en un isolate y en
    dos, rezagada pasados los 10 s, renovación rechazada y pasajera, cupo,
    cookie mal formada, salir revoca, borrar la cuenta, reautenticar,
    Academy, cartera, adoptar y tutorial, `_worker.js` compilado y que
    ninguna respuesta lleva tokens. 10 mutaciones del servidor: todas hacen
    fallar alguna prueba;
  - `rwadar-acceso/sesion-mantenida-navegador.test.mjs` (3): la casilla en
    un DOM simulado y, **en Chromium** con el worker local compilado desde
    las fuentes: con la casilla, las dos cookies con caducidad (1 h y 30
    días) sobreviven a cerrar el navegador y el pase se renueva solo; sin
    ella, al reabrir se está fuera; `document.cookie` no las ve; salir las
    borra;
  - `probar-web` fija la casilla, su inglés, las frases de privacidad y que
    los 30 días son los del servidor (681; 2 mutaciones comprobadas);
  - ajustadas al contrato nuevo: `servidor-errores` (dos Set-Cookie) y
    `cartera-errores-dirigidos` (`crearCarteraServidor` recibe `sesion`);
  - `npm test` en la raíz, salida 0: `rwadar-app` con 31 scripts a «0
    fallidas», 11/11 y `.github` 103/103; `probar-web` 681/681; QR bien;
    `rwadar-movil` 593 y 2 omitidas; herramientas bien; `rwadar-acceso`
    302/302, con Chromium;
  - gitleaks 8.30.1 (`rwadar-app/gitleaks.toml` y la configuración por
    defecto) sobre los dos commits: sin hallazgos.
- **Dudas que quedan:**
  - **Víctor tiene que entrar una vez más** en el iPhone, dentro de la web
    instalada, y marcar la casilla: las sesiones de antes no tienen
    refresh_token;
  - el enlace de confirmación del correo deja solo el pase (una hora, como
    antes); al caducar se entra con la contraseña y la casilla;
  - `.github/qa-web-browser-141/python-bff-141.py` y
    `qa-android-update-141/production-bff-native-fixture.cjs` esperan una sola
    Set-Cookie al entrar. No están en ningún flujo; si se vuelven a usar, hay
    que adaptarlos;
  - Supabase limita las renovaciones por dirección y todas salen de
    Cloudflare: con las cuentas de hoy sobra; si un día da 429, la web lo
    trata como pasajero y no saca a nadie;
  - la renovación entre isolates depende del intervalo de reutilización de
    Supabase (10 s por defecto, en los ajustes de Auth): no lo bajéis;
  - lo de Chromium es local; en el iPhone solo se ve publicado.
- **Para publicar** (con orden expresa de Víctor): PR a main y CI; «Publicar
  web» (preview y producción), porque cambia el servidor. En la preview:
  entrar con la casilla, cerrar del todo la web instalada, abrirla otra vez y
  seguir dentro; en las herramientas del navegador, dos cookies `__Host-` con
  caducidad. Sin SQL. La app no lo necesita: su diccionario gana dos entradas
  que no usa y viajan con la próxima OTA.

## 12 de noviembre de 2026 (14b) · Claude · Sin el nombre del titular en los avisos y «Notificaciones en este móvil» que nunca se queda en «Comprobando…»

Víctor, probando en su iPhone con la web en la pantalla de inicio: «No
quiero que salga mi nombre aquí» y «No funciona lo de activar
notificaciones». Commits en la rama del worktree (`worktree-wf_c54297be-d87-2`,
sobre `186bd3e`), **sin push. Sin publicar; Supabase y EAS sin tocar.** La
sesión que se pierde (la cookie del servidor de la web y el `refresh_token`)
la lleva otro cambio: aquí no se ha tocado `rwadar-acceso/servidor.mjs`, el
formulario de entrar ni las cookies de la privacidad.

- **El nombre** (`4edb3c1`). La información básica de Perfil › Avisos (web
  y app) y de la casilla del alta de `/acceso` ya no dice «Responsable:
  Víctor Manuel Jorques Granero (RWAdar)», sino «Responsable: el titular de
  RWAdar, identificado en el aviso legal». En la web, «aviso legal» enlaza
  a `/privacidad#aviso-legal`. Inglés: «Controller: the owner of RWAdar,
  identified in the legal notice». El texto entero va en el diccionario
  común (`rwadar-movil/lib/idioma-en.js` y su copia); los tres trozos que
  deja el enlace en la web, en `idioma-en-avisos-20261112.js`. El nombre se
  queda solo en el aviso legal y la privacidad. `probar-web` comprueba que
  ninguna página de `rwadar-site` lo lleva fuera de `privacidad.html`.
- **Notificaciones de la web** (`b7cb6cf`). Por qué se atascaba: si
  `estado_mis_avisos` fallaba o no contestaba, el bloque se quedaba en
  «Comprobando las notificaciones de este móvil…» con el botón apagado (y
  un fallo de la clave al pulsar «Activar» decía «todavía no están
  disponibles»). Ahora:
  - cada llamada de avisos tiene plazo (15 s) y «Comprobando…» no dura más
    de 20 s;
  - sin sesión: «Tu sesión ha caducado: vuelve a entrar.» con «Entrar de
    nuevo» (lleva a `/acceso` y vuelve); otro fallo: «No hemos podido
    comprobar las notificaciones de este móvil. Revisa la conexión y pulsa
    Reintentar.» con «Reintentar»; al volver a la app se reintenta solo;
  - al pulsar «Activar», el motivo en llano (permiso, el navegador no deja,
    el iPhone fuera de la pantalla de inicio, sin conexión, sesión
    caducada) y se puede volver a intentar;
  - inglés de todo.
  Hoy el puente (`assets/acceso-privado.js`) salta solo a `/acceso` con un
  401, así que «Tu sesión ha caducado» se ve sobre todo si eso cambia; la
  prueba acepta las dos cosas.
- **App** (`8aaee41`). El token de Expo lleva plazo (20 s): sin red, el
  interruptor del móvil se quedaba ocupado. Con «sin sesión» o sin red, el
  mensaje lo dice. Solo JavaScript: va en la próxima OTA.
- **Pruebas** (sobre el árbol de `8aaee41`, salvo la última retocada):
  - `npm test` en la raíz, salida 0: `rwadar-app` (275, 89, 64, 11/11 y
    `.github` 103/103), `probar-web` 681/681, 70 páginas y RSS, 40 de
    precarga, QR, `rwadar-movil` 596 y 2 omitidas, herramientas y
    `rwadar-acceso` 284/284 con Chromium;
  - `notificaciones-fallos-navegador.test.mjs` nueva (3 pruebas, Chromium:
    401, 500, sin red, sin respuesta y cada fallo al activar, también en
    inglés), pasada dos veces más tras el último retoque;
  - mutación: con el JS de antes fallan las 3 de Chromium (se quedan en
    «Comprobando…») y las 3 nuevas de la app; restaurado con `cmp`;
  - guardián de OTA con `--base fa30779`: compatible, 1.4.2(24);
  - gitleaks 8.30.1 (`rwadar-app/gitleaks.toml` y por defecto) sobre los
    3 commits y sobre el diff: sin hallazgos.
- **Dudas que quedan:**
  - la LOPDGDD (art. 11.2.a) pide la identidad del responsable en la
    primera capa; «el titular de RWAdar» con el enlace al aviso legal es
    una forma habitual de cumplirlo, pero lo confirma quien revise lo legal;
  - el nombre sigue en sitios que no son la web ni la app: el pie de los
    correos (`rwadar-app/correo-lettermint.sh`, `db/30` y `db/31` y sus
    migraciones, el verificador de la 31 y `probar-avisos-registrados.mjs`),
    las plantillas de Auth (`rwadar-app/plantillas-auth/`), `SECURITY.md`,
    `AGENTS.md` y `docs/legal/`. No se han tocado: el correo no está
    encendido y, si se enciende, el pie lo pide la LSSI. **Corrección del
    integrador (entrada 14):** eso vale para los avisos por correo, no para
    las plantillas de Auth, que **sí se envían hoy** (confirmar el alta y
    recuperar la contraseña) con el nombre completo en el pie; lo decide
    Víctor (ver la entrada 14);
  - «Tu sesión ha caducado» solo se arregla del todo con la sesión que
    dura (el otro cambio).
- **Para publicar** (con orden expresa de Víctor): web (preview y
  producción) y OTA de la app.

## 12 de noviembre de 2026 (13) · Claude · Notificaciones web desde Supabase y Cloudflare: base 33 y servidor unidos, revisión aplicada y textos legales al día

Víctor: «En GitHub no puedes? Pues hazlo en supabase mientras y ya haremos el
cambio». Commits en `claude/sharp-babbage-m3bbbw`, **sin push. Sin publicar;
Supabase y EAS sin tocar; el envío sigue apagado.** (El encargo la llamaba
«(11)», pero la (11) y la (12) ya existían: esta es la 13.)

- **Qué cambia, en llano.** Hasta ahora, las notificaciones de la web para
  todos las mandaba un flujo de GitHub, que con la cuenta gratuita no tiene
  contrato de encargo y habría visto las suscripciones de todos. Ahora:
  1. la base (Supabase, cada 5 minutos con el push encendido, como Expo)
     pide cada notificación por pg_net a la web;
  2. el servidor de la web (Cloudflare, `POST /api/interno/webpush`) comprueba
     que quien llama tiene la clave de RWAdar, la cifra, la firma y la entrega
     al servicio de push del navegador, sin guardarla;
  3. GitHub ya no envía a todos: «Avisar novedad» no lo llama y la acción
     «enviar» se retiró. Solo queda «Notificaciones web › prueba», que va a
     las cuentas de administración (datos de Víctor).
- **Uniones** (`git merge --no-ff`): la base (`d6beb4c`: migración 33, flujos y
  `probar-webpush-supabase.mjs`) y el servidor (`e5cb091`:
  `rwadar-acceso/webpush-servidor.mjs` y sus pruebas). Sin conflictos.
- **`probar-notificaciones.mjs`** (`c13e921`): el arreglo que dejó el
  constructor, aplicado sobre la versión de main (que ya traía la espera del
  reloj de PGlite). Sin la acción «enviar» ni la llamada desde «Avisar
  novedad»; lista de acciones con `ensayo-33`, `verificar-33`, `aplicar-33` y
  `prueba-webpush`. 89/89.
- **Revisión aplicada** (`2daee0e`):
  - pg_net espera **25 s** (antes 10). El servidor puede tardar 8 s con la
    clave y 10 s con el servicio de push: con 10 s, una entrega lenta ya
    aceptada se habría reintentado y la notificación saldría repetida. Una
    prueba nueva compara la espera de la 33 con los plazos del servidor;
  - una entrada que no sirve da **200 `{"codigo":-1}`** (antes 400, que la
    base reintentaba 3 veces); solo después de comprobar las claves;
  - el límite se cobra **después** de comprobar las claves, en dos cupos (2000
    cada 10 min con la clave de RWAdar, 300 sin ella): quien salga por la
    misma dirección que Supabase ya no puede agotar el de RWAdar;
  - **las copias de cada noche ya no llevan las suscripciones** de la web
    (`suscripciones_web` y `envios_web` van sin filas). Comprobado con un
    Postgres 16 local: la tabla está, sin datos, y se restaura bien. Tras una
    restauración, cada persona vuelve a pulsar «Activar»;
  - LEEME y RUNBOOK: orden de puesta en marcha, las 6 horas que pg_net guarda
    las respuestas y el consumo de Pages Functions.
- **Web** (`f970c93`): al cerrar sesión, un temporizador del teclado móvil
  podía encontrar la página sin `body` y daba un error en la consola. Hacía
  fallar a ratos, con la máquina cargada, la prueba de Chromium de
  «Notificaciones en este móvil» (7 de 12 ejecuciones en paralelo); arreglado
  con `document.body?.`, 0 de 18. Llega con la próxima web.
- **Textos legales** (`6dabfd2`), fecha sin cambiar (12/11/2026):
  - privacidad §6 y §8: las envía la base (Supabase) a través del servidor de
    la web (Cloudflare), que las cifra y entrega sin guardarlas; GitHub ya no
    interviene en las notificaciones de la web;
  - anexo: **C3 hecha en el código** (se cumple al aplicar la 33 y publicar
    la web); apartado 1.5 reescrito;
  - registro versión 7, `encargados/README.md` e INTERNO, al día.
- **Pruebas** (sobre el árbol de `f970c93`):
  - `npm test` en la raíz, salida 0, dos veces (la primera, antes del
    arreglo de la web, con 1 fallo de Chromium: el de arriba):
    - `rwadar-app`: 31 scripts con «0 fallidas»
      (`probar-avisos-registrados` 275/275, `probar-notificaciones` 89/89,
      `probar-webpush-supabase` 64/64), 11/11 y `.github` 103/103;
    - `probar-web` 679/679, 70 páginas y RSS, 40 de precarga;
    - QR bien; `rwadar-movil` 593 y 2 omitidas; herramientas bien;
    - `rwadar-acceso` 280/280, con Chromium (`webpush-interno` 18/18); y
      dos veces más `node --test rwadar-acceso/*.test.mjs`, 280/280.
  - Mutaciones: cobrar el límite antes de las claves o volver al 400 hace
    fallar 1 y 4 pruebas; restaurado y comprobado con `cmp`.
  - Guardián de OTA con `--base fa30779`: compatible, 1.4.2(24). Este cambio
    no toca la app.
  - gitleaks 8.30.1 (`rwadar-app/gitleaks.toml` y la configuración por
    defecto) sobre `git diff origin/main...HEAD` y sobre los commits: sin
    hallazgos.
- **Dudas que quedan:**
  - Cloudflare podría frenar las peticiones de pg_net (firewall o antirobots):
    solo se ve en línea, y `prueba-webpush` lo mide (códigos del servidor);
  - la clave privada viaja en una cabecera: no abrir los registros en tiempo
    real de Cloudflare (`wrangler pages deployment tail`) mientras haya envíos;
  - el resto del hueco de GitHub (copias y flujos de la base) sigue: se cierra
    con GitHub Team (decisión del 06/11);
  - el servidor necesita el nivel de compatibilidad de Cloudflare de 2025 o
    posterior (el login de producción ya lo usa); la primera `prueba-webpush`
    lo confirma.
- **Para publicar, en orden** (cada paso con orden expresa de Víctor):
  1. PR a main y CI (escáner de secretos y pruebas).
  2. «Avisos a registrados (base)» › `ensayo-33` (debe decir «RWAdar 33
     OK») y `aplicar-33` (AVISOS; copia cifrada antes; verificadores 30-33).
  3. Sello de main y «Publicar web» (preview y producción), porque cambia el
     servidor. En la preview: un GET a `/api/interno/webpush` da 405 y un POST
     sin claves, 403. Con el push apagado, 2 y 3 pueden ir en cualquier
     orden, pero los dos antes de 4.
  4. Con el iPhone de Víctor suscrito (web en la pantalla de inicio, cuenta de
     administración, «Notificaciones en este móvil» activadas):
     `prueba-webpush` (AVISOS). Debe decir «Aceptadas por el servicio de push:
     1» y llegar «Prueba de RWAdar». No depende del interruptor.
  5. `activar-push`, solo con el resto de condiciones del anexo cumplidas
     (C1, C2, C4, C5 con la OTA ya en uso, C6 y C7).

## 12 de noviembre de 2026 (12) · Claude · Corrector: anexo legal y retoques unidos, frases del anexo y la baja a la vista en Android

Víctor: «Haz lo que tengas que hacer para que funcione, con lógica, que no me
suponga a mí ni a RWAdar nada malo obvio». Commits en
`claude/sharp-babbage-m3bbbw`, **sin push. Sin publicar; Supabase y EAS sin
tocar; el envío sigue apagado.** Ni SQL ni migraciones.

- **Uniones** (`git merge --no-ff`): retoques (`8f2683b`, entrada 10) y anexo
  legal (`a62ec63`). Las dos traían una entrada «(10)» aquí: la legal pasa a
  ser la (11) y esta, la (12).
- **Frases junto al botón = las del anexo (2.4)**, palabra por palabra y con
  su inglés. `probar-web` comprueba ahora que coinciden con el anexo.
  - Web (`3ae3469`): párrafo propio bajo «Activar/Desactivar», también con
    ellas activadas (para quien las activó con la web n.º 71): «El servicio de
    tu navegador puede estar fuera de la UE: ve la hora de cada aviso, pero no
    puede leer su texto. Si no las activas, seguirás viendo los avisos en la
    campana. Más en Privacidad.», con enlace a `/privacidad#garantias-push`.
    Sustituye a la provisional, que decía «de su fabricante» (falso en Samsung
    Internet y Edge de Android, que entregan por Google).
  - App (`3c90ea8`): la frase del latido de Firebase, solo en Android y
    después del texto del identificador («envía también»).
- **App, condición nueva C7 (antes R2)** (`3c90ea8`): al abrir una
  notificación de novedades que lleva a Buscar o a la Academy (donde no está la
  tarjeta «Avisos»), sale arriba «¿No quieres estos avisos? Desactívalos en
  Perfil o en los ajustes del móvil.», con enlace a Perfil › Avisos y una ×.
  La bienvenida no. Es la misma vara que la web (entrada 8).
- **Anexo corregido** (`8a94cc6`), con registro, `encargados/README.md` e
  INTERNO:
  - C5 pide la OTA **publicada y ya en uso**: la app aplica una OTA en el
    arranque siguiente, así que hay que enviarla unos días antes y mirar en
    EAS que la mayoría de arranques la usan. Quien abra la app tras mucho
    tiempo verá una vez el texto antiguo. El arreglo completo (`push_activo`
    según la versión del texto: RPC nueva y migración) no compensa; anotado;
  - punto 1.3: lo más probable es que el envío **sí** sea una transferencia de
    RWAdar. Mozilla queda como riesgo bajo aceptado a sabiendas, con una salida
    sin coste si Víctor la quiere: no ofrecerlas en Firefox;
  - R1 (baja a la vista en la campana) y R6 (sin «el enlace de cada correo»),
    hechas.
- **Pruebas** (sobre `8a94cc6`):
  - `npm test` en la raíz, salida 0:
    - `rwadar-app`: 29 scripts con «0 fallidas» (`probar-avisos-registrados`
      275/275, `probar-notificaciones` 94/94), 11/11 y `.github` 103/103;
    - `probar-web` 679/679 (una nueva), 70 páginas y RSS, 40 de precarga;
    - `rwadar-movil` 593 y 2 omitidas;
    - herramientas bien (diccionarios web/móvil idénticos);
    - `rwadar-acceso` 262/262, con Chromium.
  - `campana-avisos-navegador` 3/3 con capturas: la frase nueva bajo el botón,
    con «Privacidad» en verde y subrayado.
  - La prueba nueva de la app falla si se quita la baja tras la notificación
    (28/29) y vuelve a 29/29 al restaurarla.
  - Guardián de OTA con `--base fa30779`: compatible, 1.4.2(24).
  - gitleaks 8.30.1 (`rwadar-app/gitleaks.toml`) sobre los commits desde
    `d927c09` y sobre el diff: sin hallazgos.
- **¿`activar-push` hoy? No.** Faltan:
  - publicar la web (C1 y C2);
  - la OTA, y que lleve unos días en uso (C5 y C7);
  - GitHub Team o el envío fuera de GitHub (C3);
  - las pruebas en el iPhone de Víctor y en un Android físico (C4 y C6).
- **Para publicar** (con orden de Víctor): «Publicar web» y la OTA. En
  Supabase no hay nada que aplicar.

## 12 de noviembre de 2026 (11) · Claude · Anexo legal de las notificaciones: «sí, con condiciones»

Víctor: «Haz lo que tengas que hacer para que funcione, con lógica, que no me
suponga a mí ni a RWAdar nada malo obvio». Esta parte es **solo lo legal**
(documentos y `rwadar-site/privacidad.html`); el código lo lleva otro agente a
la vez. **Sin push, sin publicar, Supabase y EAS sin tocar.**

- **Anexo** [`docs/legal/ANEXO-NOTIFICACIONES-2026-11-12.md`](../legal/ANEXO-NOTIFICACIONES-2026-11-12.md).
  Veredicto: **sí, con condiciones**.
  - Servicios de push de los navegadores: **no son encargados** de RWAdar (los
    elige el navegador, como el proveedor de correo de cada persona).
  - DPF en la lista oficial: Google LLC y Microsoft Corporation, «Active»;
    Apple y Mozilla, no figuran.
  - Apple: en el EEE responde Apple Distribution International (Irlanda), con
    cláusulas tipo. Mozilla: en EE. UU., queda como riesgo residual bajo,
    explicado en la privacidad, con la salida de no activarlas y ver los avisos
    en la campana.
  - «Latido» de Firebase: su envío al pulsar el botón vale con una frase clara
    junto al botón (consentimiento, LSSI 22.2). Guardarlo antes, como hace la
    1.4.2 desde el 06/11, es un riesgo residual: no lo cambia encender el
    push, y se arregla en la próxima versión nativa.
  - LSSI 21 (baja en cada aviso) y el permiso v2: se cumplen.
- **Condiciones antes de `activar-push`** (si se separa el interruptor, cada
  canal las suyas):
  - C1: publicar la privacidad de este commit;
  - C2 y C5: una frase de primera capa junto al botón de la web y de la app
    (la de la app, en una OTA antes de encender);
  - C3: GitHub con contrato de encargo (GitHub Team) **o** el envío de la web
    fuera de GitHub (Supabase o Cloudflare). Pasa de «recomendado» a
    condición porque, encendido, GitHub tendría en claro las suscripciones
    de todos;
  - C4 y C6: las pruebas en el iPhone de Víctor y en un Android físico.
- **Para el otro agente:** las frases exactas, en castellano y en inglés,
  están en el anexo, apartado 2.4:
  - la de la app se añade al final de `TEXTO_MOVIL`
    (`rwadar-movil/componentes/AvisosNovedades.js`);
  - la de la web, al final de `disponible` y `disponible-pausa` de
    `TEXTOS_PUSH` (`rwadar-site/assets/rwadar-20260820.js`);
  - las dos, con su inglés en los diccionarios.
- **Comprobado hoy** (hora UTC, fuentes en el anexo, apartado 6):
  - API pública de la lista del DPF (16:17-16:18, sin filtro de estado; da
    lo mismo que la consulta del coordinador de las 16:03);
  - políticas de Apple, Google (versión de España), Mozilla y Microsoft;
  - documentación de push de Apple y de autopush;
  - guía de datos de Firebase;
  - LSSI y LOPDGDD en el BOE;
  - Directrices 2/2023 y 05/2021 y Recomendaciones 01/2020 del CEPD.

  EUR-Lex no se dejó leer (página de comprobación): se cita sin leer hoy.
- **Pruebas del DPF en Git:** `docs/legal/encargados/2026-11-12-dpf-*.json`.
  Son las cuatro respuestas del coordinador, byte a byte, y un resumen de mis
  consultas con el SHA-256 de cada respuesta. Del detalle de Google y
  Microsoft va un extracto **sin los contactos** de sus empleados.
- **Privacidad** (fecha sin cambiar: 12/11/2026):
  - §8: Microsoft se suma a GitHub y Google en el DPF;
  - §8: la promesa «se comprobará» pasa a ser el párrafo `#garantias-push`,
    con lo que dice cada empresa y la salida de no activarlas;
  - §5: al activar las notificaciones se consiente también el envío del
    latido.
- **Registro** (versión 6): proveedores, terceros, A5, pendientes e
  historial. También al día `encargados/README.md` (Netlify ya figura «Active»
  en el DPF), INTERNO, LEEME y RUNBOOK.
- **Pruebas** (en el worktree, con `npm --prefix rwadar-app ci`, que faltaba):
  - `npm run test:web`: código 0; `probar-web` 678 correctas y 0 fallidas,
    70 páginas y RSS, 40 de precarga;
  - `node --test .github/*.test.mjs`: 103/103;
  - `probar-web` fija ahora el resultado. Cazó dos cambios a propósito: decir
    que Apple está adherida y quitar la frase del consentimiento de Firebase.
- **Pendiente:**
  - C1-C6;
  - las recomendaciones R1-R7 del anexo (la baja arriba en la campana; que
    todo anuncio abra Inicio en la app; completar la «Información básica»;
    Firebase solo al pulsar en la próxima versión nativa…);
  - **verificar** que el push web de Apple lo controla su empresa de Irlanda;
  - **verificar** qué hace Firebase tras desactivarlas (en el Android
    físico).

## 12 de noviembre de 2026 (10) · Claude · Notificaciones: retoques del auditor y dos pruebas que fallaban sin motivo

Víctor: «Haz lo que tengas que hacer para que funcione, con lógica, que no me
suponga a mí ni a RWAdar nada malo obvio». Commits en
`worktree-wf_546ac51b-386-2`, sobre `d927c09` (entrada 9), para unir a
`claude/sharp-babbage-m3bbbw`. **Sin push, sin publicar, Supabase y EAS sin
tocar. El envío sigue apagado (`push_habilitado = false`).** Ni SQL ni
migraciones: la base no cambia. `privacidad.html` y `docs/legal`, sin tocar
(los lleva otro agente).

- **Web, diálogo de la campana («Tus avisos»)** (`76ebc8e`): la frase de la
  baja («¿No quieres estos avisos? Desactívalos en Perfil o en los ajustes del
  móvil.») y el botón «Notificaciones y avisos en Perfil» van en un **pie fijo**,
  fuera de la lista que se desplaza. Antes, con 10 avisos, quedaban debajo de la
  lista y había que bajar para verlos. Comprobado en Chromium a 390 × 844 con 10
  avisos: se ven al abrir y siguen a la vista con la lista al final; con el
  diálogo de antes, la prueba nueva falla («baja: false»).
- **Primera capa junto al botón de las notificaciones** (texto provisional; el
  anexo legal puede pulirlo y el corrector ajustarlo):
  - web (`76ebc8e`), bajo «Activar/Desactivar notificaciones en este móvil»:
    «Al activarlas, tu navegador usa el servicio de notificaciones de su
    fabricante (Apple, Google, Mozilla o Microsoft); el texto va cifrado. Más en
    Privacidad.», con el enlace a `/privacidad#avisos-novedades` (en verde y
    subrayado). No sale en ordenador ni en el iPhone sin la web en la pantalla de
    inicio (ahí no hay botón).
  - app (`f3c2986` y `68ba090`), bajo «Notificaciones en este móvil»: «Al
    activarlas, tu móvil se registra en Firebase Cloud Messaging (Google) y
    Expo para recibirlas. Más en Privacidad.». Solo en Android (en un iPhone la entrega
    sería de Apple); no sale en la 1.4.1 ni en un dispositivo que no puede
    recibirlas.
  - Con su inglés: la de la web en `idioma-en-avisos-20261112.js`; la de la app
    en `lib/idioma-en.js` (copiado a la web).
- **App, mensaje al activar los avisos** (`f3c2986`): con el correo apagado
  ya no dice «o con el enlace de cada correo»; dice «Avisos de novedades
  activados. Puedes darte de baja aquí cuando quieras.», como la web. Con el
  correo encendido sigue la frase de antes. Esa frase en inglés pasa del
  diccionario solo de la web al común (probar-web exige que no se repitan).
  **Llega a los móviles con una OTA** (guardián: compatible, 1.4.2(24));
  enviarla es otra orden de Víctor.
- **Prueba que fallaba a veces en CI** (`691330b`):
  `probar-notificaciones.mjs`, «con el push encendido, el paso Enviar…».
  - Causa, comprobada: el reloj de PGlite va en milisegundos (sin
    microsegundos). `activar-push` guarda la hora con `clock_timestamp()` y el
    anuncio se publica con `now()`; si caen en el mismo milisegundo, la base no
    lo manda, porque solo manda lo publicado **después** de encender (`>`). En
    local hay 1 ms de margen (medido en 5 vueltas); en la máquina de CI, a
    veces 0.
  - Reproducido: forzando el mismo milisegundo salen exactamente los mismos 5
    fallos (88/93) que en el CI del traspaso (ejecución 43253888473, intento 1).
  - Arreglo, solo en la prueba: antes de publicar un anuncio, espera a que el
    reloj de la base haya pasado la activación y la última suscripción, y
    comprueba que el anuncio del flujo queda después. Lo que se comprueba no
    cambia. En producción no pasa: hay microsegundos y entre encender y publicar
    pasan minutos.
  - Resultado: 94/94 seis veces seguidas (unos 7 s cada una), cinco más con la
    CPU cargada (8 procesos ocupados en 4 núcleos, unos 16 s cada una) y una con
    la activación adelantada 20 ms a propósito.
- **`rwadar-acceso/tokenizacion.test.mjs`** (`d4d43a6`): fallaba desde hoy
  porque su dato fijo de CoinGecko es del 10/11 a las 15:25 UTC y el servidor
  rechaza los de más de 48 h. El arnés del worker local acepta un reloj
  (`ahora`, como `Date.now`) que el worker toma al crearse, igual que ya hacía
  con `fetch`; la prueba le da uno que empieza el 10/11 a las 15:31:37 UTC y
  avanza. Lo que se comprueba no cambia. El navegador sigue con su hora (solo
  cambia «hoy, 15:25» o «dato del 10/11/2026, 15:25», y se aceptan las dos).
- **Pruebas** (sobre `76ebc8e`; la app, también sobre `68ba090`):
  - `npm test` de la raíz, entero, salida 0: base sin fallos
    (`probar-avisos-registrados` 275/275, `probar-notificaciones` 94/94,
    `.github` 103/103), `probar-web` 678/678, `rwadar-movil` 591 y 2
    omitidas, herramientas bien y `rwadar-acceso` **262/262** (antes 261/262:
    ya pasa «Mercado y noticias» en Chromium).
  - `rwadar-movil` tras `68ba090`: 592 correctas, 0 fallidas, 2 omitidas.
  - `campana-avisos-navegador` (Chromium) 3/3; `tokenizacion` 9/9.
  - Guardián de OTA con `--base fa30779`: compatible, 1.4.2(24).
  - Copia de los diccionarios web/móvil: idénticos.
  - gitleaks 8.30.1 con `rwadar-app/gitleaks.toml` sobre estos commits: sin
    hallazgos.
- **Para publicar** (cada paso con la orden de Víctor): «Publicar web» (preview,
  comprobar, producción) y la OTA de la app. No hay nada que aplicar en Supabase.
- **Queda para el corrector o el anexo legal:**
  - en la web y en la app, la frase nueva sigue al texto de estado, que también
    empieza por «Al activarlas…» y ya nombra a Apple, Google, Mozilla y
    Microsoft (web) o a Expo y Google (app): se pueden fundir en una;
  - en la web, el enlace «Privacidad» de la información básica de Perfil no se
    distingue del texto (el nuevo, sí);
  - en la app, «Más en Privacidad» remite al botón «Leer privacidad», que está
    más arriba en el mismo panel.

## 12 de noviembre de 2026 (9) · Claude · Notificaciones publicadas: base 32, clave VAPID, web n.º 70/71 y OTA n.º 23

Víctor: «que salten las notificaciones en la app tipo WhatsApp y además salga
un 1», «hazlo como puedas sin necesidad de llave», «finaliza el trabajo y hazlo
bien hecho».

- **PR #112** (squash 35a2434): app (17a7356), base 32, remitente Web Push,
  web (campana, bandeja, Web Push), privacidad y registros (buzón Gmail).
  Tres revisiones independientes, corrector y auditor final: «aprobado».
- **PR #113** (eedb4be): sello de 35a2434.
- **Supabase**, desde «Avisos a registrados (base)»:
  - `ensayo-32` n.º 9 bien;
  - `aplicar-32` n.º 10, con copia cifrada: «RWAdar 32 OK: push de Expo con
    prioridad alta…»;
  - `crear-vapid` n.º 11, con copia: «clave VAPID creada». La privada está en
    Vault y nunca salió.
- **Web:** preview n.º 70 comprobada (38/38 general, 11/11 contacto y 6/6
  notificaciones: sw.js con push, privacidad con Gmail). Producción n.º 71.
- **OTA n.º 23** (base fa30779, runtime 1.4.2(24)).
- **Envío: SIGUE APAGADO** (`push_habilitado = false`). No se ha lanzado
  `activar-push`. Antes hace falta el anexo legal: el latido de Firebase
  (LSSI 22.2) y la adhesión al DPF de Apple, Mozilla y Microsoft (la web de
  dataprivacyframework.gov no se pudo leer desde aquí). La privacidad promete
  comprobarlo antes de enviar.
- **Prueba en el iPhone de Víctor** (no depende del envío):
  1. añadir la web a la pantalla de inicio;
  2. entrar con la cuenta de administración;
  3. Perfil › Avisos: activar «Avisos de novedades» y «Notificaciones en este
     móvil»;
  4. lanzar «Notificaciones web › prueba» (ENVIAR).
- **Pendientes menores** del auditor, para el siguiente ciclo:
  - la frase de la baja arriba del diálogo de la campana;
  - en la app, «o con el enlace de cada correo» con el correo apagado;
  - `rwadar-acceso/tokenizacion.test.mjs` caduca (dato de CoinGecko de más
    de 48 h): reloj fijo. En CI no corre, porque falta Playwright.
- **Plantillas de Auth:** siguen con el correo antiguo; falta
  SUPABASE_ACCESS_TOKEN.
- INTERNO.md y el registro (A6) quedan al día.

## 12 de noviembre de 2026 (8) · Claude · Notificaciones: correcciones de las tres revisiones (base, web y legal)

Víctor: «que las notificaciones salten al móvil tipo WhatsApp y además salga
un 1 en la app». Tres revisiones independientes de la integración (entrada 6)
pidieron cambios; aquí está lo aplicado. Commits en
`claude/sharp-babbage-m3bbbw`. **Sin push, sin publicar, Supabase y EAS sin
tocar, `rwadar-movil` sin tocar.** El contrato común (RPC, carga, interruptor
único, clave VAPID) **no cambia**; solo la `url` de la carga es siempre
`https://rwadar.pages.dev/?avisos=1` (con `#emisiones` si el destino es el
radar), que el contrato ya permitía (`https://rwadar.pages.dev/…`).

- **Lo más importante: ya se puede probar en el iPhone antes de encender el
  envío para todos.** Antes, con `push_habilitado` apagado, el botón
  «Activar notificaciones en este móvil» salía bloqueado y la acción
  «prueba» no tenía a quién ir. Ahora se puede activar aunque el envío esté
  apagado (registrarse no envía nada); solo se bloquea si aún no hay clave
  VAPID. El texto dice que llegarán cuando empecemos, sin prometer plazos.
  Visto en Chromium con un iPhone 13 con la web instalada y el envío
  apagado: el botón se pulsa, pide permiso, se suscribe y queda «Notificaciones
  activadas en este móvil. Te llegarán cuando empecemos a enviarlas.».
- **Base (`23e81b8`):**
  - `limpiar()` (la del reloj diario `rwadar-novedades-limpieza`) es la de la
    30 letra por letra más `webpush_limpiar()`: los 180 días de la privacidad
    se cumplen cada día aunque no haya anuncios ni push. Probado en PGlite:
    con el push apagado, el reloj borra una suscripción de hace 200 días y un
    envío de hace 95, y deja la vigente. Cerrojos: primero el de la 30 y
    luego el de la 32; nada toma el de la 32 y luego el de la 30.
  - Baja en cada notificación (LSSI, art. 21.2, párr. 2; era el bloqueante):
    toda notificación web lleva a `?avisos=1`, que abre la lista de la
    campana con «¿No quieres estos avisos? Desactívalos en Perfil o en los
    ajustes del móvil.» y el botón a Perfil › Avisos.
  - Verificador 32: compara entera la regla de servicios de push (un host de
    más ya no pasa), exige la limpieza diaria y la baja en el destino.
    Detecta 17 roturas (antes 14).
- **Web (`f4c495d`):** lo de arriba; abrir la campana ya es ver los avisos
  (como un chat de WhatsApp: el número de la campana, del icono y del service
  worker baja a 0; en el panel de la cuenta sigue «Marcar como leídos»);
  tocar una notificación con la web abierta abre la lista sin recargar
  (mensaje `abrir-avisos` del service worker); sin `badge` opaco (en Android
  salía un cuadrado blanco); globos en `#D92D20` (4,83:1, antes 3,55:1);
  «Perfil, 1 aviso sin leer» en singular; permisos bloqueados en Chrome sin
  instalar, con su camino; sin la cifra «0 Avisos recibidos» junto a la
  bandeja; con el correo apagado ya no promete «el enlace de cada correo».
  Inglés en `idioma-en-avisos-20261112.js`.
- **Legal (`da4993d`):** privacidad (en la web ya se activan y llegarán
  cuando empecemos; en la app, el botón espera al envío; GitHub figura como
  quien cifra y envía, con lo que recibe; Google LLC y GitHub en el DPF; la
  garantía de Apple, Mozilla y Microsoft se comprobará antes de enviar).
  Registro de actividades, versión 5 (A5, datos, destinatarios, plazos,
  fila de Apple, pendientes) y `encargados/README.md` (GitHub y una sección
  de los servicios de push).
- **Descartado, y por qué:**
  - Enviar la OTA con `AVISOS_NOVEDADES_REMOTOS = false` (opción b de una
    revisión): no hace falta para la compuerta legal, porque con el push
    apagado la app no registra el móvil en Expo ni le pide nada a Firebase
    (dice «todavía no disponible»). La compuerta va escrita aquí abajo.
  - Separar el interruptor de la web del de Expo: cambia el contrato común.
  - Nombrar los servicios de push y GitHub en la «Información básica» de
    Perfil: es un texto común de la web, /acceso y la app (y sus pruebas y
    diccionarios) y conviene que lo vea la revisión legal; queda en el anexo.
  - La app sigue diciendo «Puedes darte de baja aquí o con el enlace de cada
    correo» al activar los avisos con el correo apagado: cambiarlo es otra
    OTA; anotado.
  - Insignia monocroma propia para Android: se ha quitado `badge` (Chrome pone
    la suya); dibujarla queda como mejora.
- **Pruebas** (sobre `da4993d`): `npm test` de la raíz: base entera sin
  fallos (`probar-avisos-registrados` 275/275, `probar-notificaciones` 93/93,
  `.github` 103/103), `probar-web` 678/678, móvil 590 y 2 omitidas,
  `rwadar-acceso` 261/262. La que falla es «Mercado y noticias» en Chromium
  (`tokenizacion.test.mjs`), **ajena a esto**: su dato de CoinGecko es del
  10/11 a las 15:25 UTC y la web lo rechaza pasadas 48 horas; falla igual en
  `5f2bba0`, antes de estas correcciones (en CI no corre: no hay Playwright).
  `campana-avisos-navegador` (Chromium) 3/3 con los casos nuevos;
  `service-worker-activacion` 9/9. gitleaks 8.30.1 sobre
  `git diff origin/main...HEAD` y los 73 commits desde `main`: sin hallazgos.
  Copias de la 32 idénticas (`cmp`).
- **Orden de publicación corregido** (sustituye al de la entrada 6), cada
  paso con la orden de Víctor:
  1. PR a `main`; en CI, escáner de secretos y pruebas.
  2. «Avisos a registrados (base)» › `ensayo-32` (debe decir «RWAdar 32 OK»),
     `aplicar-32` y `crear-vapid` (AVISOS).
  3. «Publicar web» (preview, comprobar, producción) y la OTA de la app
     (`17a7356`, entrada 7), en el mismo ciclo.
  4. Víctor, en su iPhone: añadir rwadar.pages.dev a la pantalla de inicio,
     abrirla desde el icono, entrar con su cuenta de administración, activar
     «Avisos de novedades» y «Activar notificaciones en este móvil» (ya no
     está bloqueado).
  5. «Notificaciones web» › `prueba` (ENVIAR): le llega «Prueba de RWAdar»,
     sale el 1 en el icono y, al tocarla, se abre la lista con la baja y el 1
     baja a 0. Es la primera prueba real con Apple: hasta entonces, no dar por
     bueno el número del icono.
  6. **No lanzar `activar-push` todavía.** Enciende a la vez el push de
     Android (Expo) y las notificaciones de la web para todos. Antes: un
     anexo legal con fecha que decida si el «latido» de Firebase cabe en la
     LSSI, art. 22.2 (y ePrivacy, art. 5.3), y que cubra las notificaciones
     de la web (servicios de push como destinatarios, si son encargados,
     transferencias con el DPF de Apple, Mozilla y Microsoft comprobado, y la
     «Información básica»); recomendado también firmar GitHub Team (su DPA),
     porque sus máquinas cifran y envían; y la prueba en un Android físico.

## 12 de noviembre de 2026 (7) · Claude · App: avisos que saltan como un WhatsApp (commit `17a7356`, anotado después)

Este commit de la app va en `claude/sharp-babbage-m3bbbw` y sale con
cualquier OTA de esta rama, pero no tenía entrada. Lo anota la revisión.

- **Qué enciende en la app:** `AVISOS_NOVEDADES_REMOTOS = true` (Perfil ›
  Avisos con el texto versionado `novedades-v2-2026-11-06` y «Notificaciones
  en este móvil») y `AVISOS_BANDEJA_REMOTA = true` (la bandeja y el «1» de
  Inicio, que se recalcula al volver a la app, como mucho cada 30 s, y al
  llegar un aviso). La casilla del alta va con su propio interruptor,
  `AVISOS_CASILLA_ALTA_REMOTA`, **apagado**.
- **Android:** canales `cuenta` y `novedades` con importancia alta y
  vibración (se fija antes de que ningún móvil cree los canales); al leerlo
  todo se quitan del sistema solo las notificaciones de avisos de RWAdar.
- **Con el push apagado** (`push_habilitado`), la app no registra el móvil en
  Expo: el botón dice que aún no está disponible.
- **Llega por OTA a la 1.4.2** (guardián compatible, código 24). Pruebas:
  `rwadar-movil` 590 correctas, 0 fallidas, 2 omitidas.
- **Publicarlo es encender esos interruptores:** necesita la orden de Víctor
  (AGENTS.md, «encender `AVISOS_NOVEDADES_REMOTOS`»).

## 12 de noviembre de 2026 (6) · Claude · Notificaciones: base y web unidas y comprobadas entre sí

Víctor: «que las notificaciones salten al móvil tipo WhatsApp y además salga
un 1 en la app». Integración en `claude/sharp-babbage-m3bbbw` de las dos
ramas del encargo (entradas 4 y 5, aquí debajo). **Sin push, sin publicar,
Supabase sin tocar, sin EAS.** La integración no tocó `rwadar-movil`, pero la
rama sí lleva la app: el commit `17a7356` (entrada 7).

- **Uniones** (`git merge --no-ff`): `4998ba0` (base: migración 32, remitente
  Web Push y flujos; sin conflictos) y `51e9bf1` (web: campana, bandeja y Web
  Push; solo chocaba este archivo, se quedan las dos entradas).
- **Contrato revisado** (`53ed8cc`). Cuadraban los nombres y argumentos de las
  4 RPC, la carga `{v, titulo, texto, url, etiqueta}`, la clave pública de 87
  caracteres y el interruptor `push_habilitado`. No cuadraba, y ya está
  arreglado:
  - la base borra las suscripciones web sin renovar en 180 días y la web nunca
    las renovaba: ahora, al entrar con las notificaciones activas, vuelve a
    llamar a `registrar_aviso_webpush` (como mucho cada 12 horas por página);
  - tope del endpoint: la web cortaba en 1024 y la base admite 2048 (ahora
    2048 en las dos);
  - con «Avisos de novedades» apagado la web prometía «avisos de servicio,
    como la bienvenida», que por Web Push no existen: texto nuevo con inglés;
  - privacidad: la suscripción web también se borra tras 180 días sin entrar
    en la cuenta desde ese navegador.
- **Pruebas nuevas:** en `probar-notificaciones.mjs` (90/90), las cargas
  reales de la base pasan por el remitente y el `sw.js` de la web las enseña
  tal cual; las 4 RPC concedidas son las que llama la web y deja pasar la
  pasarela; clave y tope de endpoint iguales. En Chromium, una suscripción ya
  activa se renueva una vez al entrar sin pedir nada.
- **Pasado en este estado:** `npm test` de la raíz (código 0: `rwadar-acceso`
  261/261, móvil 590 y 2 omitidas, base 275/275 y 90/90, `.github` 103/103,
  `probar-web` 677/677), `npm run test:web` (código 0) y gitleaks sobre
  `git diff origin/main...HEAD` y los 69 commits desde `main`: sin hallazgos.
- **Pendiente** (este orden no se podía cumplir: con el envío apagado el botón
  salía bloqueado; el corregido está en la entrada 8)**, con la orden de
  Víctor y por este orden:** PR a `main`;
  «Avisos a registrados (base)» › `ensayo-32`, `aplicar-32` y `crear-vapid`
  (AVISOS); «Publicar web» en preview y comprobarla; Víctor añade RWAdar a la
  pantalla de inicio del iPhone, entra y activa las notificaciones en Perfil;
  «Notificaciones web» › `prueba` (ENVIAR): le debe llegar «Prueba de RWAdar»
  y salir el 1 en el icono. Encender el envío para todos (`activar-push`)
  enciende también Expo: publicar la web y la OTA de la app en el mismo ciclo.

## 12 de noviembre de 2026 (5) · Claude · Web: campana con «1», bandeja y notificaciones en el móvil (Web Push)

Víctor: «que las notificaciones salten al móvil tipo WhatsApp y además salga un 1
en la app». Esta parte es **solo la web** (rwadar-site, rwadar-acceso,
privacidad, pruebas). La base (migración 32, envío y clave VAPID) y la app van
en otras ramas del mismo encargo. Sin push, sin publicar, Supabase sin tocar.

- **Interruptores (`assets/rwadar-20260820.js`):** encendidos
  `AVISOS_NOVEDADES_REMOTOS` (Perfil › Avisos con el texto versionado
  `novedades-v2-2026-11-06`), `AVISOS_BANDEJA_REMOTA` y uno nuevo,
  `AVISOS_WEBPUSH_REMOTO`. La **casilla del alta** tiene ahora su propio
  interruptor, `AVISOS_CASILLA_ALTA`, **apagado**, en `assets/acceso.js` y
  `rwadar-acceso/servidor.mjs` (antes compartía nombre con el de Perfil). Con
  el correo apagado, Perfil lo dice: «El envío por correo todavía no está activo».
- **Campana:** en las dos cabeceras, solo con sesión confirmada. Cuenta los
  avisos de `mis_avisos_recientes` no leídos (lo leído, en
  `localStorage` `rwadar.avisos.leidos.v1:<uuid>`), 1…9 y 9+, `aria-label` con
  el número y un anuncio `aria-live="polite"`. Abre un diálogo con la lista y
  «Marcar como leídos». El globo de Perfil enseña los avisos sin leer (mandan
  sobre el de guardados). Badging API (`setAppBadge`/`clearAppBadge`) y aviso
  al service worker (`avisos-pendientes` / `avisos-vistos`).
- **Notificaciones en este móvil:** solo móviles y tabletas, con «Avisos de
  novedades» activado antes. En el mismo toque: `Notification.requestPermission()`,
  la clave con `clave_publica_webpush`, `pushManager.subscribe` y
  `registrar_aviso_webpush`; después, una notificación local. Estados:
  activadas, denegadas (cómo cambiarlo en Ajustes), todavía no disponibles
  (clave nula o `push_activo` falso), falta el permiso de avisos. iPhone/iPad
  sin la web en la pantalla de inicio: tres pasos y el diálogo de «RWAdar en
  iPhone». Desactivar, cerrar sesión (antes de cerrar) y borrar la cuenta la quitan.
- **`sw.js`:** `push` (siempre `showNotification`, contador en IndexedDB y
  `setAppBadge` en el mismo `waitUntil`), `notificationclick` (enlace ajeno →
  `/`) y `message`. **Ojo:** `setAppBadge` llamado desde el service worker
  tumba la página en Chromium sin ventana (headless); por eso el mensaje
  `avisos-pendientes` no toca la insignia (la pone la página) y las pruebas de
  Chromium bloquean el service worker real. Conviene confirmarlo en el iPhone.
- **Pasarela:** `servidor.mjs` deja pasar las 4 RPC del contrato.
- **Inglés:** `assets/idioma-en-avisos-20261112.js`, solo de la web (el común es
  copia exacta del de la app y no se toca aquí); va entre el común y el motor
  (`rwadar-publicar.js`, `rwadar-publicacion-segura.js` y
  `rwadar-app/probar-web-escritorio.mjs` al día).
- **Privacidad** (fecha 12/11/2026, también en `sitemap.xml`): la suscripción
  web (qué se guarda, quién la entrega, cifrada, cuándo se borra), lo local
  (avisos leídos y número del icono) y que las notificaciones del móvil ya se
  activan. La «Información básica» junto al interruptor no cambia (es común con
  la app y /acceso); el bloque del botón explica los servicios de push.
- **Pruebas:** nueva `rwadar-acceso/campana-avisos-navegador.test.mjs`
  (Chromium, origen https de prueba hacia el worker local); al día
  `service-worker-activacion`, `bandeja-avisos-navegador`,
  `perfil-avisos-navegador`, `alta-avisos-navegador`, `avisos-baja`,
  `probar-web.mjs`, `probar-web-escritorio.mjs` y `probar-para-empresas.mjs`.
  `npm test` de la raíz en verde (código 0; `rwadar-acceso` 261/261) y
  `npm run test:web` en verde; gitleaks sin hallazgos en el diff.
- **Commits:** 04ce16e (web), 680c014 (privacidad), 1b4c6a2 (pruebas) y este traspaso.
- **Pendiente:** que la base tenga la 32 y la clave VAPID antes de publicar la
  web (sin ellas el botón dice «todavía no disponibles»); probar en el iPhone de
  Víctor con la web en la pantalla de inicio; la `INFO_DATOS_AVISOS` común
  podría nombrar los servicios de push del navegador (cambio de web, app y
  /acceso a la vez).

## 12 de noviembre de 2026 (4) · Claude · Notificaciones que saltan en el móvil: base, remitente y flujos (migración 32)

Encargo de Víctor: «que las notificaciones salten al móvil tipo WhatsApp y
además salga un 1 en la app». Esta parte es la base, el envío y los flujos;
la web (service worker, botón en Perfil, pasarela) va aparte. Commits en la
rama del worktree, **sin push, sin publicar, Supabase sin tocar**.

- **Migración 32** (`rwadar-app/db/32_notificaciones.sql` y su copia
  idéntica `supabase/migrations/20261112130000_notificaciones.sql`). Solo
  añade; no enciende nada ni reinicia la configuración.
  - El push de Expo sale con prioridad alta (`enviar_push` igual que en la 30
    salvo `'priority', 'high'`). Reaplicar la 30 lo devuelve a `default`:
    después hay que reaplicar la 31 y la 32 (el verificador 32 lo detecta).
  - Notificaciones web: tablas privadas `suscripciones_web` (como mucho 5 por
    cuenta, solo los servicios de push de Google, Mozilla, Apple y Microsoft)
    y `envios_web`; RPC `registrar_aviso_webpush`, `quitar_aviso_webpush`,
    `mi_aviso_webpush_registrado` y `clave_publica_webpush` (sesión
    confirmada, solo `authenticated`); internas `webpush_pendientes`,
    `webpush_resultado`, `webpush_prueba` (solo `perfiles.es_admin`) y
    `webpush_limpiar`. Mismo interruptor que Expo: `push_habilitado`.
  - Verificador `32_notificaciones_verificar.sql`; clave VAPID con
    `32_notificaciones_vapid.sql`; resultados con
    `32_notificaciones_resultado.sql`.
- **Remitente** `rwadar-app/enviar-webpush.mjs`: solo `node:crypto` y
  `fetch` (RFC 8291 y RFC 8292), sin npm.
- **Flujos:** «Avisos a registrados (base)» gana `ensayo-32`, `verificar-32`,
  `aplicar-32`, `crear-vapid` y `rotar-vapid`; nuevo «Notificaciones web»
  (`enviar` y `prueba`, escribiendo ENVIAR); «Avisar novedad» lo lanza
  después de cada anuncio.
- **Pruebas:** `node rwadar-app/probar-notificaciones.mjs` (87/87, nueva, en
  `npm test`), `probar-avisos-registrados.mjs` (275/275), `npm --prefix
  rwadar-app test` entero y `.github/*.test.mjs` (103/103) pasan; gitleaks
  sin hallazgos en lo cambiado.
- **Pendiente, con orden de Víctor y por este orden:** unir el PR; en
  «Avisos a registrados (base)», `ensayo-32`, después `aplicar-32` y
  `crear-vapid` (AVISOS); publicar la web con su parte; Víctor activa las
  notificaciones en su iPhone (web en la pantalla de inicio) y se lanza
  «Notificaciones web» con `prueba`; encender el envío para todos
  (`activar-push`) es otra orden, con el texto de privacidad revisado.

## 12 de noviembre de 2026 (2) · Claude · «¿Quieres colaborar con nosotros?» y correo de contacto único, publicados

Víctor: «Añade un apartado al final de Inicio y Perfil tipo ¿Quieres colaborar con nosotros? Y el correo de contacto rwadares@gmail.com»; después, «Sí, cámbialo» (también en lo legal).

- **Apartado nuevo** al final de Inicio y de Perfil, en la web y en la app (un solo bloque o componente). Lleva la independencia editorial y el enlace a Transparencia comercial.
- **Correo de contacto único** `rwadares@gmail.com` en todo lo visible:
  - web, app y esquema;
  - privacidad, acceso, baja y `security.txt`;
  - documentos legales y sus pruebas.
- **No cambiado,** a propósito:
  - las migraciones aplicadas;
  - las plantillas de correo de Supabase y Lettermint;
  - `correo-lettermint.sh`.

  Los correos automáticos siguen con el antiguo hasta que se apliquen allí, con permiso de Víctor.
- **Publicado:**
  - PR #108 y #109 (sello), unidas con squash.
  - Web n.º 68 (preview) y n.º 69 (producción): 11/11 en la comprobación del apartado y del correo, y 38/38 en la general.
  - OTA n.º 22, enviada a las 11:13 UTC.

## 12 de noviembre de 2026 (3) · Claude · Repaso de la revisión: correo único y «Colaborar»

Commits locales en `claude/sharp-babbage-m3bbbw` (sin push, sin publicar, sin
OTA, Supabase sin tocar). Lo pidió la revisión del apartado «¿Quieres
colaborar con nosotros?»:

- **Correo único:** `rwadares@gmail.com` ya es el único correo que ve un
  visitante de la web o de la app (esquema de `index.html`, avisos, Perfil,
  pie, `rwadar-20260820.js`, `App.js` con su lista de `abrirEnlace()`, los dos
  diccionarios por igual, claves incluidas). También en
  `docs/plantillas/CORREO-PROPUESTA-PILOTO.md`. Pruebas al día:
  `probar-web.mjs`, `rwadar-app/probar-para-empresas.mjs`.
  `git grep -i protonmail -- rwadar-site rwadar-movil probar-web.mjs` no
  devuelve nada. Siguen con el antiguo, a propósito, las excepciones del
  commit 8e1abe2 (SQL, migraciones, plantillas de auth, docs/archive…).
- **Frase de independencia más prudente:** «…las ofertas se eligen con
  criterios editoriales y hoy RWAdar no cobra comisiones por las
  inversiones.», y tras el botón un enlace «Transparencia comercial»
  (`/transparencia-comercial` en la web; la misma página en el navegador desde
  la app). No se enlaza `/para-empresas`: hoy redirige a Inicio (302).
- **Fila de contacto de Perfil:** dice para qué es: «Datos y privacidad ·
  rwadares@gmail.com» (web y app, con su inglés).
- **Comentarios:** fuera las frases que decían que privacidad y avisos
  seguían en el correo antiguo (`index.html`, `Colabora.js`).
- **Pruebas nuevas:** en `probar-web.mjs` (enlace de transparencia, fila de
  Perfil y ningún correo antiguo en `rwadar-site`, `App.js`, `lib/` ni
  `componentes/`); en `colabora.test.cjs` (enlace, fila, `abrirEnlace`);
  en `colabora-navegador.test.mjs` (contraste y foco del enlace, inglés y
  captura de Perfil en inglés); `tokenizacion.test.mjs` cuenta el Tab nuevo.
- **Queda sin hacer (decisión de Víctor):** que el bloque salga en el HTML
  sin JavaScript (hoy lo copia `ponerColabora()` desde un `<template>`) y, en
  escritorio, si se quiere al final de toda la página y no tras Aprende.

## 12 de noviembre de 2026 (2) · Claude · «¿Quieres colaborar con nosotros?» al final de Inicio y Perfil (web y app)

Encargo de Víctor: «añade un apartado al final de Inicio y Perfil tipo
¿Quieres colaborar con nosotros? y el correo de contacto rwadares@gmail.com».
Commit local en `claude/sharp-babbage-m3bbbw` (sin push, sin publicar, sin OTA,
Supabase sin tocar).

- **Qué se ve:** un bloque con el título (h2), una frase para plataformas,
  emisores, gente del sector y quien quiera proponer mejoras, la frase de
  independencia («Colaborar no compra un puesto en el catálogo: las ofertas se
  eligen con criterios editoriales y RWAdar no recibe dinero de las
  inversiones.») y el botón verde «Escríbenos: rwadares@gmail.com»
  (`mailto:`). Va tras Aprende y antes del pie legal en Inicio, y al final de
  Perfil antes de la nota final. Este apartado no toca el correo de los
  textos legales: ese cambio va aparte, en su propio commit de la rama
  («Correo de contacto: rwadares@gmail.com…»), y las pruebas nuevas no
  dependen de él.
- **Web:** el bloque está una sola vez, en `<template id="colaboraPlantilla">`
  de `index.html`; `ponerColabora()` (en `assets/rwadar-20260820.js`) lo copia
  en cada hueco `[data-colabora]`: Inicio, Perfil del móvil y la cuenta de
  escritorio (`abrirPerfil`). Estilos en `assets/secciones-20261110.css`.
- **App:** `componentes/Colabora.js`, usado en `Inicio.js` y en
  `PantallaPerfil` de `App.js`. Abre el correo con `Linking.openURL`; si falla,
  lo dice y deja la dirección seleccionable. Sin dependencias nuevas: la OTA
  sigue siendo compatible.
- **Inglés:** 6 claves nuevas en `lib/idioma-en.js`, copiadas a la web.
- **Pruebas:** `rwadar-movil/tests/colabora.test.cjs` (4),
  `rwadar-acceso/colabora-navegador.test.mjs` (Chromium a 390 y 1366: sitio,
  h2, mailto, foco, contraste AA, sin desbordes e inglés) y una comprobación
  en `probar-web.mjs`. Ajustadas tres pruebas que montan `PantallaPerfil`
  a mano (les falta el nombre `Colabora`) y la de Tab de Inicio en
  `tokenizacion.test.mjs` (ahora pasa por «Escríbenos» antes de «Nota legal
  completa»). `npm test` de la raíz en verde (código 0) sobre la rama sin el
  commit del cambio de correo; con él fallan `probar-para-empresas.mjs` y dos
  pruebas del diccionario de avisos que siguen esperando
  RWAdar@protonmail.com: son de ese cambio, no de este apartado. Guardián de
  la OTA (base `fa30779…`): `ok`.
- **Pendiente (Víctor):** revisar y, si le gusta, publicar web y OTA con
  permiso expreso. La cuenta de escritorio solo se ve con sesión: se comprobó
  pintándola a mano en local, donde las cuentas están apagadas.

## 12 de noviembre de 2026 (1) · Claude · ciclo rápido del 12/11: catálogo a58dd22d aplicado y noticias del día

Víctor, a las 00:28 UTC: «actualizar la información a hoy y acelerar». Informe:
[`docs/INVESTIGACION-CATALOGO-2026-11-12.md`](../INVESTIGACION-CATALOGO-2026-11-12.md).

- **Investigación (00:32–01:00 UTC):** 4 grupos en paralelo (principales,
  brickwise, suiza y vigilancia), cada uno con revisor independiente, más las
  noticias (editor y verificador). Radar 69/69, con REGAFI leído hoy por su API
  pública.
- **Entrega:**
  - Revisión `a58dd22d-98a3-f94e-ba66-46898162215a`; `aplicar-y-aprobar.sql`
    con SHA-256 `d4d73024…4e4d`.
  - Revisiones: SQL y contenido «aprobado», cumplimiento «con cambios» (fuera
    del SQL más R1 de Hausera), auditor «conforme».
- **Cambios:**
  - mTBILL: métrica de rentabilidad pasada del 3,45 % en USD. El revisor
    rechazó el 3,53 % por la ventana con festivo.
  - Brickwise: Cohotel y GreenPoint, 102 €; Pottendorfer, 80 €; aviso común
    sobre la compra parcial y el 1,5 %.
  - Smart Cash, con la VL del 11/11.
  - Re-fechas en el resto.
- **Publicado:**
  - PR #104 (squash) y «Aplicar catálogo» n.º 17, comprobado como visitante
    a las 09:30 UTC.
  - PR #105 (sincronización, noticias del 12/11 y pruebas de noticias que
    ahora comparan con la edición publicada) y PR #106 (solo el sello),
    unidas con squash.
  - «Tokenización diaria» con el 12/11: 43.606 M$.
  - «Publicar web» n.º 66 (preview) y n.º 67 (producción): las dos pasan
    38/38 en la comprobación como visitante (noticias del 12/11, serie del
    12/11, fichas de Pottendorfer, Cohotel y Spiko, calculadora, gráfico, sin
    errores ni desbordes).
  - «OTA Android» n.º 21 (base `fa30779…`), enviada a las 10:12 UTC.
  - Retraso: entre las 03:05 y las 09:28 UTC el ciclo estuvo parado porque
    no quedó nada vigilando las pruebas de GitHub de la PR #104. Lección:
    nunca terminar un turno esperando algo externo sin un vigilante en
    segundo plano.
- **Datos personales:**
  - Recortados los nombres de consejeros de Backed que quedaban en copias de
    2026-11-03.3-v2 y 2026-11-05-v2 (19 archivos).
  - Los nombres de O1 siguen solo en la historia de la rama
    `claude/sharp-babbage-m3bbbw`; `main` se unió con squash.
- **Pendiente:**
  - Las VL nuevas de Spiko (18:00 y 19:30 UTC del 12/11).
  - El conflicto de reembolso de mTBILL.
  - «Participaciones en venta» de 4 fichas de Brickwise, que se quedan con su
    fecha anterior.

## 11 de noviembre de 2026 (5) · Claude · ciclo del 11/11 completo: catálogo aplicado, «Mercado y noticias», calculadora y guía de acceso

Víctor pidió el 11/11:
- actualizar ofertas, gráfico y noticias;
- el gráfico al estilo de una app de bolsa, con las noticias juntas;
- «nivel ultra elevado»;
- la calculadora con sección propia en Inicio, con los números de cada uno;
- «Apáñate para entrar en las páginas y apps que no deja»;
- «Los datos del gráfico que sean reales».

Informe: [`docs/INVESTIGACION-CATALOGO-2026-11-11.md`](../INVESTIGACION-CATALOGO-2026-11-11.md).

- **Catálogo:**
  - PR #100, unida con squash.
  - «Aplicar catálogo» n.º 16, correcto.
  - Publicada la revisión `24b5f7de-2834-3e15-6ae4-62a6d9565161` (25/22,
    8/13/1), vigente hasta el 18/11/2026.
  - `aplicar-y-aprobar.sql`: SHA-256 `dfeba195…a3cb`.
  - Revisiones: tres expertos (SQL aprobado; contenido y cumplimiento con
    cambios fuera del SQL, C1 y O1) y auditor final «conforme».
  - Lectura como visitante tras aplicar: `lectura-despues-de-aplicar/`.
- **Búsqueda profunda:** arttrade y winvesta (agentes de Effecta), no
  admitidas. Hoy no hay altas.
- **PR2:** sincronización tras aplicar, más las ramas locales `mercado-bolsa`
  y `calculadora`, unidas en `integracion-1111` y luego en esta rama. Las dos
  pasaron revisión, segunda ronda de calidad y verificación independiente.
- **Guía de acceso:** `.claude/skills/investigacion-catalogo/acceso/`, con
  `ACCESO-FUENTES.md` y `comprobar-rutas.mjs` (76 rutas verificadas por
  escépticos; el bruto, fuera de Git).
  - Límite firme: no se elude ningún control anti-bots. El sistema de
    seguridad bloqueó un intento con Midas y no se repitió.
- **Publicado** (orden de Víctor de investigar y publicar):
  - PR #101 y PR #102 (solo el sello), unidas con squash.
  - «Tokenización diaria» n.º 3: correcta, 9,5 min. La rama
    `datos-tokenizacion` ya tiene la serie: 30 de 40 tokens, último punto
    42.970 M$.
  - «Publicar web» n.º 64 (preview) y n.º 65 (producción), correctas. Las dos
    pasan 36/36 en la comprobación como visitante (Playwright a 390 y 1366):
    cifra = último punto, pestañas, sin el +124 %, calculadora (3.000 € al
    4 % en 10 años da «unos 4.167 €»), noticias del 11/11 con fotos, fichas
    de Spiko (2,41 %) y Schwarzer Weg (69,90 €), sin errores JS ni desbordes.
  - «OTA Android» n.º 20 con la base `fa30779…`: enviada el 12/11 a las
    00:27 UTC, tras las pruebas de la app y la de compatibilidad.
- **Límite de uso de 5 horas:** a las 10:45 UTC cortó todos los equipos. Se
  retomó a las 14:16, comprobado antes de decir nada.
- **Pendiente para el 12/11:**
  - rentabilidad de mTBILL, ≈ 3,5 % (30 d, oráculo);
  - aviso de Brickwise sobre compra parcial y comisión del 1,5 %;
  - motivo de Crypto.com;
  - radar de Midas;
  - pistas mAPOLLO y mHYPER;
  - (R9) por qué `/api/tokenizacion` de producción sirve la foto guardada y no
    el dato en vivo;
  - lanzar «Tokenización diaria» si la rama `datos-tokenizacion` no tiene aún
    la serie.
- **Ramas:** los nombres de personas que se recortaron hoy siguen en la
  historia de `claude/sharp-babbage-m3bbbw` en GitHub, no en `main`. Si se
  quiere limpiar, borrar esa rama remota con permiso de Víctor.

## 11 de noviembre de 2026 (4) · Claude · «Mercado y noticias»: lo que dejaron los verificadores independientes, sin publicar

Cuarto commit **local** en `mercado-bolsa`. Sin push, sin publicar, sin flujos, sin Supabase y sin claves.
- **Fallo serio encontrado al rehacer la serie en local: `days=366` rompía el flujo diario.** Sin clave, CoinGecko solo da los últimos 365 días y a `days=366` responde **401** a cada token (error 10012, comprobado el 11/11 a las 15:04 UTC). El flujo se habría quedado sin un solo token y la serie habría envejecido. Vuelve a `days=365` (`urlHistoria`); las pruebas lo fijan (nunca más de 365) y la prueba del flujo simula lo que da la API pública (365 puntos, del 12/11/2025). «1 A» abarca esos 365 días.
- **Cobertura de la serie (R1)**: rehecha en local con el código de hoy (`serie-diaria.mjs`, 13 s entre llamadas, 15:14 UTC): los mismos 29 tokens, 85,6 % sobre el total de la categoría (igual que la semilla) y los 363 días anteriores idénticos al céntimo; solo cambia el punto de hoy, que es intradía. La semilla de `rwadar-site/datos/tokenizacion-serie.json` **no se toca** (es la verificada).
- **Textos**: el subtítulo de la cifra grande y la nota del gráfico usan la misma coletilla, «Suma de los 29 mayores tokens con historia completa» (antes «… de 29 de los 40 mayores», que se leía como otra cosa); un espacio duro antes del «· 11/11/2026» para que no quede suelto al partirse la línea.
- **Pliegue**: la línea gris del total de la categoría sale de la cabecera y va bajo el gráfico, en la misma nota («… (86 % del total de la categoría). Total de la categoría en CoinGecko, con todos sus tokens: 49.698 M$ (hoy, 10:03 UTC).»). A 390 × 844 el gráfico entero, con sus fechas, cabe en la primera pantalla (prueba nueva en Chromium). Igual en la app.
- **Letra y triángulos**: los datos clave y las cifras de los tipos, en Geist con cifras tabulares (en Mono, «−0,1 %» se leía espaciado), en web y app; en la web, el triángulo de los tipos, del mismo tamaño que en los datos clave.
- **Menores**: un tipo sin cambio dice «Sin dato en 24 h» (no un «—» suelto); el avance de los tipos se oculta con la lista abierta (web; la app ya lo hacía); en la app, menos hueco bajo «Ver los 8 tipos»; la línea acaba 8 px antes del eje, y el punto de la cruz en el último día ya no toca la píldora (5 px de aire a 390 y a 1366).
- **Foco**: en `/mercado/`, el anillo de foco de las noticias va por fuera de la tarjeta (`outline-offset: 4px` y sin el recorte de `overflow`); ya no pisa la primera letra.
- **Fuente en inglés**: `fuenteCorta(noticia, idioma)` en el modelo de noticias (web y app): «Consejo de la UE» → «Council of the EU» y otros organismos; siglas y empresas, igual.
- **Código**: `cifraGrande()` de la web parte por `/\s/` (antes, un espacio duro literal entre comillas, que funcionaba pero no se veía).
- Sin cambio (correcto): la noticia más reciente es de la CNMV del 10/11 y sale como «Ayer»; a las 09:22 UTC la CNMV no había publicado nada del 11/11.

**Pruebas**: `npm test` de la raíz y el guardián de la OTA con la base `fa30779…` (`ok`). Capturas en el scratchpad de la sesión, `capturas-mercado-final/`.

**Para el traspaso** (sigue igual): (R8) publicar primero la web y después la OTA; (R9) mirar por qué `/api/tokenizacion` de producción daba `foto-guardada`.

## 11 de noviembre de 2026 (3) · Claude · «Mercado y noticias»: ronda final de calidad (auditor de datos, inversor novato y diseñador), sin publicar

Tercer commit **local** en `mercado-bolsa` (encima del que se cortó a medias por el límite de uso, que solo tenía el tope del cambio en 24 h). Sin push, sin publicar, sin flujos, sin Supabase y sin claves. Lo que pidió el coordinador tras los tres informes de calidad:
- **La cifra grande es el último punto de la serie** (42.947 M$ hoy), en `/mercado/`, en la tarjeta de Inicio y en la app: la misma que el final de la línea, la cruz en el último día y el minigráfico; nunca supera el máximo del periodo. Encima, «Suma de los 29 mayores tokens · 11/11/2026». Debajo, en gris, el total de la categoría de CoinGecko con todos sus tokens y su hora, y que la cifra grande y el gráfico suman los 29 mayores. En los datos clave, «Valor hoy (29 mayores)» y «Total de la categoría hoy». Sin serie, la cifra es el total y se avisa. En el modelo: `cifraGrande`, `lineaTotalCategoria`, `subtituloCifra`, `cuandoDato` («hoy, 09:57 UTC» solo si es de hoy).
- **Cambio en 24 h** (`cambio24h`): el de la serie si sus dos últimos días son seguidos (hoy −0,1 %); si no, el de CoinGecko solo si es menor de un ±25 % (`CAMBIO_24H_MAX`, también en la foto diaria: el 11/11 CoinGecko daba +124 % con el mercado plano); si no, «—».
- **Qué mide el %**: bajo el cambio, en web y app (y en Inicio), «Mide cuánto vale en total el mercado: sube también cuando se emiten tokens nuevos. No es lo que habría ganado una inversión.». «Cómo se calcula» dice cuántos entran a mitad del periodo elegido (13 de los 29 en 1 A y en 2026).
- **Pestaña del año**: en castellano «2026» (nombre accesible «En 2026»; en inglés, «YTD»), y se mide desde el 01/01 (el cierre del 31/12). La historia se pide con `days=366` (1 A ya cubre el año entero). **Corregido en (4): CoinGecko responde 401 a `days=366`; vuelve a 365.**
- **Flujo diario**: lo de la ronda anterior estaba bien (13 s, el paso con 14 min y `continue-on-error`, el trabajo con 25). Ahora `PERDIDA_MAX_PCT = 1` (si falla Ondo, del 4,8 %, se conserva la serie de ayer), la cuota se mide sobre el total de la categoría (una llamada más a `/coins/categories`; si falla, la suma de la lista) y el paso se llama «Rehacer la serie de un año (mayores tokens con historia completa)». La semilla de main no se ha rehecho (es la que verificaron tres revisiones al 0,000 %): su cuota es la de antes (85,6 % de la primera página); en pantalla sale «86 %» en todas partes.
- **Diseño**: franja de 40 px para la burbuja de la cruz (en una línea: fecha · valor · cambio; ya no tapa la línea), cruz solo vertical, píldora con el último valor en el eje, eje con un 8 % de aire y marcas dentro (sin bandas vacías), suelo que no tacha la marca de abajo, cambio en Geist, título en una línea (en la app, a 22 px), cifras de los tipos a la derecha, tarjeta de Inicio equilibrada en escritorio, un solo rojo, línea más fina con muchos puntos, degradado con parada intermedia, pestañas sin anillo, «dic 2025» en el eje y un violeta (no el verde de «sube») para el tipo mayor.
- **Inversor**: «El tipo que más pesa», «Un mismo token puede contar en dos tipos…», «En millones de dólares (M$)» en la fuente, los tipos plegados en el móvil (las noticias suben), la primera noticia de `/mercado/` dice «Por qué te importa» y las demás dos líneas de resumen, en la app «Ayer» va delante de la fuente (ya no cae sola en otra línea) y la cabecera de escritorio de Inicio lleva «Mercado» (desde 1280 px: con «Mercado y noticias», o por debajo de ese ancho, se partía en dos filas; «Mercado» → «Market» en el diccionario).
- **Noticias del 11/11**: `rwadar-site/datos/noticias-v2.json` es la copia del JSON verificado (6 noticias) y `noticias.json` la misma sin «imagen» (`noticias-v1.cjs`); las pruebas de noticias de web y app, al día con esos datos.
- Arreglo de paso: en la app, la unidad «M$» de la cifra grande no salía más pequeña (se partía por un espacio normal y `millones` usa uno duro).

**Pruebas**: `npm test` de la raíz con código 0 y el guardián de la OTA con la base `fa30779…` (`ok`); las nuevas comprueban en las dos suites que la cifra grande es la de la burbuja del último día y que el máximo de cada pestaña es ≥ que ella. Capturas (web a 390 y 1366, vista previa de la app con la letra Geist) en el scratchpad de la sesión, `capturas-mercado-final/`.

**Para el traspaso (sin arreglar aquí)**: (R8) `https://rwadar.pages.dev/datos/tokenizacion-serie.json` da 404 en producción: **publicar primero la web y después la OTA**. (R9) `/api/tokenizacion` de producción respondía `foto-guardada` y no el dato en vivo: mirar por qué el servidor no lee CoinGecko (ajeno a este cambio).

## 11 de noviembre de 2026 (2) · Claude · «Mercado y noticias»: correcciones de la revisión, sin publicar

Segundo commit **local** en `mercado-bolsa` (sin push, sin publicar, sin flujos, sin Supabase). Lo que pidió la revisora:
- **Flujo diario**: `PAUSA_MS` = 13 000 en `serie-diaria.mjs` (con 3 s CoinGecko daba 429 una vez sí y otra no). En `tokenizacion-diaria.yml`, el paso «Rehacer la serie» lleva `timeout-minutes: 14` (además de `continue-on-error`) y el trabajo pasa de 20 a 25 min: si CoinGecko se atasca, se corta la serie y la foto del día se guarda igual. Prueba nueva en `.github/tokenizacion.test.mjs`.
- **El % dice de qué es**: «▲ +8,3 % en el último mes · suma de los 29 mayores» (en: «past month · sum of the 29 largest») en `/mercado/`, en la tarjeta de Inicio y en la app, también en los `aria-label`. Antes parecía el cambio de los 49.684 M$ totales.
- **Tokens nuevos**: `graficoPestana` trae `avisoTokens`; en 1 A, 6 M y YTD sale «De 16 a 29 tokens: parte de la subida son tokens nuevos.» (también en `etiqueta`). Corrijo el traspaso anterior: hace un año cotizaban **16** de los 29, no 17.
- **Cruz con el dedo**: tras un toque se queda 3 s (en la web, también hasta tocar fuera del gráfico).
- **Hueco del 29/07**: el área de fondo ya no se corta (era la raya negra); el hueco se une con un trazo de puntos tenue y la nota dice «Falta el 29/07/2026».
- **Serie vieja**: si acaba más de 3 días antes del dato de hoy, no se pone su cambio junto a la cifra y se avisa «Serie hasta el dd/mm/aaaa» (`serieAtrasada`).
- **Nota**: una línea corta a la vista y el resto en «Cómo se calcula» (desplegable).
- Nuevas en el modelo: `cambioFrase`, `alcance`, `avisoTokens`, `serieAtrasada`, `notaCorta`, `diasQueFaltan`; `trazosSvg` devuelve también `puentes`. Copiado a `tokenizacion-modelo-20261110.js`.

**Al publicar: primero la web y después la OTA.** La app lee `https://rwadar.pages.dev/datos/tokenizacion-serie.json`, que aún no existe en producción (lo que decía abajo, «ninguna depende de la otra», era un error).
## 11 de noviembre de 2026 (3) · Claude · «Calcula tus números»: correcciones de la revisión, sin publicar

Tres revisores independientes (cuentas, un inversor sin formación financiera y diseño/accesibilidad) revisaron la calculadora. Un commit **local** más en la rama `calculadora`: sin push, sin publicar, sin flujos, sin Supabase y sin claves.

**Obligatorias, todas hechas**:
- Impuestos sin prometer de más: «Lo reinvierto» ya dice que así tributa un fondo que no reparte y que un producto que paga rentas tributa cada año aunque las reinviertas (tendrías algo menos); la nota dice que con más de 6.000 € de ganancia en un año pagarías algo más que el 19 %, y la ayuda del campo, «En España (salvo País Vasco y Navarra), la ganancia del ahorro paga un 19 % hasta 6.000 € al año y más por encima, hasta el 30 %».
- Explicador: con un error en el valor del activo o el precio, el título pasa a «Revisa el valor del activo o el precio de cada trozo» y los totales y la cuenta enseñan «—» (antes seguían las cifras anteriores).
- Los ejemplos vacíos, «Ej.: 300.000» y «Ej.: 100», en cursiva y más pequeños (web y app).
- Web: «+»/«−» en «Afinar» y «Ver la cuenta» (la flecha del explicador salía rota); en el móvil el resultado ya no cambia de tamaño al entrar en un campo (todo saltaba 31 px y por eso la prueba de Chromium fallaba a veces); «Details for …» en inglés; el lector de pantalla oye el resultado en `#ciAnuncio` una vez, 700 ms después de dejar de escribir (antes, una vez por tecla).

**Recomendadas hechas**: el detalle dice cuánto se paga («ya descontados 38 € de impuestos») y la cuenta, con «Lo cobro», «Impuestos en N años»; lo que sobra con trozos enteros sale en el detalle; «menos de 1 céntimo al mes»; «tendrías unos …» también con pérdidas; los mismos decimales en los dos modos («3,24 %» y «3,29 %»); en español la coma es siempre decimal («1,500» = 1,5 €) y en inglés el punto; una línea que explica «Lo cobro» y «Lo reinvierto»; la nota de las ofertas dice por qué solo salen esas y la de cada oferta pide mirar si reparte o acumula; las mismas palabras que el explicador («Valor del activo», «trozo»); «neto» explicado en la cuenta y rentabilidad «al año, de media»; al pulsar un chip en el móvil se sube hasta el resultado (web y app); en tableta, el resultado acompaña mientras se escribe en «Afinar»; bordes de los campos a 3,3:1; «Ejemplo: cámbialo» en gris, no en ámbar; el «✓» no se lee en voz alta; barra de «Lo que pones» más tenue; en la app, el resultado flotante con hasta tres líneas (con dos aún se cortaba si hay comisiones e impuestos) y el color de su signo; en la web, «Calcula con tus números →» del explicador lleva a Inicio sus números (lo que pones, el %, el activo y el trozo), no el ejemplo (en la app el enlace sigue abriendo la calculadora con el ejemplo: pasar los números cambiaría el mensaje entre el WebView y la app).

**No hechas, y por qué**: el enlace «Calcula tus números» en el pie o el menú del móvil (toca la navegación de todo el sitio, fuera del bloque); los chips en una fila con desplazamiento lateral (con 3 ofertas ahorra poco y esconde opciones); «Ficha» se queda (es la palabra de todo el sitio para la página de una oferta, y la nota ya dice «mira en su ficha»); escala por tramos de la AEAT (se eligió el texto, que los revisores daban como válido). Ya estaba en la base y no es de este cambio: abrir directamente `/#calculadora` o `/#mercado` en el móvil deja el bloque fuera de la pantalla, y a 320 px `#relPortada` ensancha la página a 344 px.

**Pruebas** (salida real, en local): `npm test` de la raíz con código 0 en 2 min 42 s (base 103/103 y 11/11, web 672 correctas, app 573 de 575 con 2 omitidas como antes, acceso 250/250); la prueba de Chromium de la calculadora, sola, 3 de 3; guardián de la OTA con la base `fa30779…`: `ok`, runtime 1.4.2(24). El motor tiene 4 casos nuevos (31) y la app 41 en total con los del componente.

## 11 de noviembre de 2026 (2) · Claude · «Calcula tus números» en Inicio (web y app), sin publicar

Encargo: «la calculadora que está dentro de RWAdar, hazle su propia sección en Inicio para que la gente calcule sus números; y que pongan ellos los números, no que sea sí o sí los 300.000». Dos commits **locales** en la rama `calculadora` (hecha desde `mercado-bolsa`): el primero, a medias, lo cortó el límite de uso; el segundo lo termina. Sin push, sin publicar, sin flujos, sin Supabase y sin claves.

**Motor común** (`rwadar-movil/lib/calculadora.js`; la web lleva su copia exacta en `rwadar-site/assets/calculadora-modelo-20261111.js`, que escribe y comprueba `node rwadar-app/calculadora/copiar-modelo-web.cjs [--comprobar]`):
- Entradas: lo que inviertes, la rentabilidad, los años, «Lo cobro» o «Lo reinvierto» y, opcionales, comisión anual (sobre el capital), comisión de entrada, impuestos sobre la ganancia (19 % por defecto), valor del activo entero y precio de cada participación.
- Cuentas: cada año, rendimiento = capital × r y comisión = capital × comisión anual. **Lo cobro** (simple): se cobra (r − comisión) × capital y se pagan impuestos ese año sobre lo cobrado; un año en negativo no cobra y baja el capital. **Lo reinvierto** (compuesto): capital × (1 + r − comisión) cada año e impuestos al final, al vender, sobre lo ganado (final − lo pagado). Nunca sobre el capital; sin ganancia, sin impuesto. La comisión de entrada se queda con su parte y cuenta como lo pagado; con precio de participación se compran participaciones enteras y lo que sobra no se invierte. Rentabilidad neta: media simple si cobras y anual equivalente ((final/pagado)^(1/N) − 1) si reinviertes.
- Validación: coma o punto decimal y puntos de miles («10.000», «2,5», «1.234,56», «1,234.56»; «12,» y «,5» a medio escribir); límites 1 € a 10.000.000 €, −20 % a 30 %, 1 a 40 años (enteros), comisiones 0–10 %, impuestos 0–50 %; fuera, un mensaje claro y ninguna cifra.
- Tramos del ahorro comprobados en la AEAT el 11/11/2026 (19/21/23/27/30 %, escala estatal + autonómica desde 2025, Ley 7/2024), citados en el comentario del motor. La nota dice que es una aproximación con un solo tipo.

**Web**: `<section class="ini-bloque calc-ini" id="calculadora">` entre «Mercado y noticias» y Aprende (`index.html`; script `assets/calculadora-20261111.js`, hoja `assets/calculadora-20261111.css`, los dos en `ARCHIVOS_PUBLICABLES`). Campos de escritura libre con `<label>` e `inputmode`, ejemplo editable (1.000 €, 4 %, 5 años) marcado «Ejemplo: cámbialo», importes rápidos, «Lo cobro / Lo reinvierto», resultado arriba en `role="status"`, minigráfico SVG con su tabla para lectores, «Afinar» y «Ver la cuenta paso a paso» en `<details>`, nota legal visible. Los chips de «Usa la rentabilidad de una oferta» salen del catálogo que ya carga la web (`pintarEmisiones` llama a `RWAdarCalculadoraInicio.ofertas`), solo de principales vigentes con cifra publicada, con fecha, «en dólares» y su ficha; sin cifras vigentes, el bloque no sale. En el móvil, mientras se escribe, el resultado se queda arriba bajo la cabecera. El explicador ya no está atado a 300.000 €: «Valor del activo» y «Precio de cada trozo» editables, título y cuenta recalculados con el motor y «Calcula con tus números →» (en el móvil cierra Academy y baja al bloque). Arreglado en este commit: el inglés de la calculadora no se aplicaba (el script se suscribía al idioma antes de que este cargara).

**App**: `componentes/CalculadoraInicio.js` en Inicio, en el mismo sitio (Inicio.js: el bloque, la referencia a la lista y el resultado flotante). `TextInput` con teclado decimal (rentabilidad con signo), los mismos textos y motor, chips de las ofertas que ya tiene la app con «Ficha →», «Afinar» y la cuenta plegables, gráfico con react-native-svg y una frase para el lector. El teclado no tapa el resultado: en los tres campos de arriba, Inicio sube hasta el resultado; en «Afinar», el resultado sale arriba en pequeño (`ResultadoFlotante`); además `keyboardShouldPersistTaps="handled"` y `automaticallyAdjustKeyboardInsets`. El explicador: el nativo lleva «Calcula con tus números →»; el web, dentro de la app, enseña ese enlace solo si la app nueva pone su marca (`CON_CALCULADORA`) y al tocarlo la app vuelve a Inicio y baja a la calculadora (`App.js`). La app instalada no pone la marca: no ve el enlace.

**Inglés**: las cadenas nuevas en `rwadar-movil/lib/idioma-en.js` y su copia web (`copiar-idiomas-web.cjs --comprobar` en verde).

**Pruebas** (salida real, en local): `npm test` de la raíz termina con código 0 en 3 min 24 s: base (todas las de `rwadar-app` y `.github` 11/11 y 103/103), web (`probar-web.mjs` 672 correctas y 0 fallidas, fichas, precarga 40), QR, app 569 de 571 (2 omitidas, como antes), herramientas y acceso 250/250. Nuevas: `rwadar-movil/tests/calculadora.test.cjs` (27 casos del motor calculados a mano), `rwadar-movil/tests/calculadora-inicio.test.cjs` (10, el componente con React aislado, Inicio y el explicador), `rwadar-acceso/calculadora.test.mjs` (Chromium a 390 y 1366: ejemplo, números escritos, errores, «Afinar», cuenta, gráfico y tabla, chips, inglés, foco y contraste AA; y el explicador con sus campos y su enlace, también dentro de un WebView simulado). Guardián de la OTA con la base `fa30779…`: `ok`.

**Pendiente**: revisar y, si gusta, publicar web y OTA con permiso expreso (no dependen una de otra). Unir con `mercado-bolsa`: Inicio.js e index.html solo llevan el bloque insertado entre «Mercado y noticias» y Aprende. Las capturas de la app son de una vista previa con react-native-web (el teclado de la captura del resultado flotante es un rectángulo simulado).

## 11 de noviembre de 2026 · Claude · «Mercado y noticias» al estilo de una app de bolsa (web y app), sin publicar

Encargo de Víctor (con una captura de una app de bolsa): «mejora la sección de noticias y la del gráfico; un gráfico de este estilo sobre la evolución del mercado de la tokenización; las noticias, con el gráfico». Un commit **local** en la rama `mercado-bolsa`: sin push, sin publicar, sin flujos, sin Supabase y sin claves.

**Datos (CoinGecko, gratis y sin clave)**:
- Serie diaria de un año = suma de la capitalización de los mayores tokens de hoy de «tokenized-products» (`/coins/markets` + `/coins/{id}/market_chart`). Motor en `rwadar-movil/lib/tokenizacion.js` (`elegirMayores`, `historiaToken`, `construirSerie`, `diasSinDato`, `validarSerie`, `serializarSerie`, pestañas, escala del eje, fechas, `graficoPestana`, `notaSerie`, `tramosSeguidos`): web, app y servidor usan el mismo.
- Reglas: último dato de como mucho 3 días; antes de su primer dato, el token cuenta 0; si a un token que ya cotiza le falta el dato, ese día no se pinta y la línea se corta. **Hallazgo con los datos reales**: a 8 de los 40 (Hashnote USYC, Janus Henderson Anemoy y 6 «tradable-…») CoinGecko les quita semanas enteras o deja de dar su historia antes de hoy; con la regla literal, la serie se cortaba en julio. Por eso, un token al que le faltan más de 3 días queda fuera de toda la serie y la nota del gráfico lo dice (con 7 días de margen, octubre salía con 7 días sin pintar por dos tokens de un 0,1 % cada uno): hoy, **29 de los 40, el 85,6 % del total**, 364 días del 12/11/2025 al 11/11/2026 (solo el 29/07/2026 sin pintar).
- `rwadar-app/tokenizacion/serie-diaria.mjs` la rehace (41 llamadas con 13 s entre ellas desde la revisión; 429 → espera). Si falla la lista, si los que no se leen pesan más del 5 % o si los que entran no llegan al 75 %, no escribe nada (código 3) y queda la anterior. El flujo «Tokenización diaria» lo ejecuta con `continue-on-error` tras la foto y guarda los dos archivos en un commit en `datos-tokenizacion` (timeout 20 min). `publicar.yml` trae `tokenizacion-serie.json` de esa rama y `rwadar-tokenizacion-historico.js` (`serieTokenizacion`) publica la más reciente entre la rama y la semilla de main (`rwadar-site/datos/tokenizacion-serie.json`, generada hoy con datos reales).
- `/api/tokenizacion` no cambia (la app instalada sigue igual): la web y la app nuevas leen la serie de `/datos/tokenizacion-serie.json`.
- Ojo: desde la IP de este entorno CoinGecko daba 429 con 3 s de pausa (la primera pasada tardó ~1 h); con 13 s no dio ninguno. En GitHub Actions puede ir distinto: si el flujo tarda, subir `PAUSA_MS`.

**Web**: `/mercado/` = «Mercado y noticias»: «Mercado de activos tokenizados», cifra de hoy en vivo, cambio del periodo con flecha, signo y texto, pestañas 1 S · 1 M · 3 M · 6 M · YTD · 1 A (botones con `aria-pressed`, 1 M por defecto), gráfico de área SVG propio (`assets/mercado-20261111.js` y `.css`): línea de 2 px y degradado, verde/rojo, eje a la derecha con 4–5 marcas, fechas abajo, rejilla suave, línea de puntos del valor de partida y cruz con ratón, dedo o teclado (`role="slider"`, flechas, Inicio/Fin, RePág/AvPág) + tabla para lectores de pantalla; datos clave, barras por tipo y, debajo, las noticias (fuente y fecha en pequeño, titular, una línea de resumen, foto a la derecha; el detalle de siempre). `/noticias/` y `/noticias/#id` llevan a `/mercado/#noticias` y `/mercado/#id` (`assets/noticias-a-mercado-20261111.js`, con refresco sin JS; canonical a /mercado/, noindex, fuera del sitemap). Inicio: un solo bloque «Mercado y noticias» (tarjeta tipo cotización con minigráfico del mes, 3 noticias compactas y «Ver mercado y noticias →»). Fuera `tokenizacion-20261110.js/.css`.

**App**: `componentes/MercadoBolsa.js` (`MercadoPantalla`, `GraficoBolsa` con `PanResponder` y `accessibilityRole="adjustable"`, `MercadoCotizacion`) y `lib/tokenizacion-serie-remota.js`; `NoticiasSector` con modos `compacta` (Inicio) y `lista` (debajo del gráfico); Inicio con el bloque unido y una sola pantalla «Mercado y noticias». Fuera `TokenizacionMundo.js`.

**Pruebas**: `npm test` de la raíz y el guardián `comprobar-ota-compatible.cjs --base fa30779…` (`ok`). Nuevas o rehechas: `rwadar-movil/tests/tokenizacion.test.cjs` (serie, pestañas, eje, tramos, lectura remota, pantalla, gráfico, cotización), `noticias-sector.test.cjs`, `inicio-historia.test.cjs`, `.github/tokenizacion.test.mjs` (serie diaria y flujo), `rwadar-acceso/tokenizacion.test.mjs` y `noticias-sector.test.mjs` (Chromium a 390 y 1366), `probar-web.mjs` y `rwadar-app/probar-web-escritorio.mjs`.

**Pendiente (Víctor)**: revisar y, si le gusta, publicar web y OTA (primero la web: ver la entrada de arriba). Tras unir a main, lanzar a mano una vez «Tokenización diaria» para que la rama `datos-tokenizacion` tenga ya la serie (si no, se publica la semilla de hoy). Las capturas de la app son de una vista previa con react-native-web (sin las fuentes ni las fotos de la app).
## 11 de noviembre de 2026 (1) · Claude · ciclo del 11/11 parado por el límite semanal de uso (SUPERADO: Víctor restableció el límite y el ciclo se completó el mismo día; ver la entrada (5))

Víctor pidió el 11/11: «Actualiza las ofertas y el gráfico y las noticias, y mejora aún más las noticias y el gráfico». Quiere el gráfico al estilo de una app de bolsa, con pestañas 1 S · 1 M · 3 M · 6 M · YTD · 1 A, y las noticias junto al gráfico.

- **Hecho:**
  - Foto diaria de la tokenización lanzada a mano: ya existe la rama `datos-tokenizacion`, con la foto del 11/11. El horario de las 06:23 UTC no se disparó el primer día.
  - Arranque del ciclo en `rwadar-app/data/verificaciones/2026-11-11-v2/`: encargo, lectura pública (sigue la `dfdc4c85`) y comprobador del radar.
  - Encargo del nuevo «Mercado y noticias» en el scratchpad de la sesión, con un año de serie reconstruida de los 40 mayores tokens de CoinGecko (el 93 % del total).
- **Parado:** todos los agentes se cortaron en el primer minuto por el límite semanal de la cuenta, que se restablece el 12/11 a las 18:00 UTC. No hay nada aplicado ni publicado a medias.
- **Retoma programada:** el 12/11 a las 18:05 UTC, en esta misma sesión. Si Codex trabaja antes, que no toque la entrega del catálogo del 11/11 ni la copia `.claude/worktrees/mercado-bolsa`.
- El catálogo publicado (10/11) vale hasta el 17/11: no hay prisa.

## 10 de noviembre de 2026 (8) · Claude · Inicio rediseñado, publicado; una prueba intermitente

**Publicado** (orden de Víctor, que pidió el rediseño):
- PR #97 unido. «Publicar web» en preview y producción y «OTA Android» con la base `fa30779…`, todo en verde.
- Comprobado en producción a 390 y 1366: /, /mercado/, /noticias/ y /aprende/ dan 200, sin desbordes ni errores de JavaScript; las 8 fotos de `/noticias-editoriales/` dan 200 (WebP).
- `/datos/noticias.json` sigue sin «imagen», para las apps que ya están instaladas.
- Inicio en el móvil: unos 3.400 px (antes, 10.300).
- El catálogo sigue en la revisión `dfdc4c85`.

**Prueba intermitente (anterior a hoy):** `rwadar-app/probar-avisos-registrados.mjs`, «como mucho 5 móviles por cuenta: los dos más antiguos dejan su sitio».
- Falló una vez en la CI del PR #98, que solo toca documentación. En local pasa 3 de 3, y el mismo código pasó en la CI del #97.
- Causa probable: registra 7 móviles seguidos en un bucle, y si dos caen en el mismo instante, el orden «más antiguo» queda empatado.
- **Arreglado el mismo día** (orden de Víctor, «arréglalo tú lo que falta»): en la prueba, cada móvil recibe una fecha distinta y creciente de la última hora justo después de registrarse. La función no cambia. Pasa 5 de 5 seguidas, y con la regla al revés (`asc`) falla, así que sigue comprobando lo que debe.
- **Transparencia de Kraken (documentoEspana) y mTBILL (supervisada)**: el coordinador volvió a leer sus fuentes exactas el 10/11 a las 21:38–21:39 UTC; dicen lo mismo y pasan a `consultadaEl` 2026-11-10 (`rwadar-app/data/verificaciones/2026-11-10-v2/remates/TRANSPARENCIA-KRAKEN-MTBILL.md`). Web y OTA publicadas otra vez.

## 10 de noviembre de 2026 (7) · Claude · Rediseño de Inicio: fin de las correcciones de la revisión y pulido visual

Encima de (6). Las correcciones de las dos revisoras independientes se cortaron a medias por el límite de uso (commit «Rediseño de Inicio: correcciones de la revisión (en curso…)»); este commit las termina y añade el pulido visual que pidió Víctor («hazlo bonito, acorde con la app y la web; bien guapo, fácil de leer y bien organizado»). Commits **locales**, sin publicar, sin flujos, sin Supabase y sin claves. Rama `rediseno-inicio`.

**Hecho ya en el commit anterior (comprobado una a una)**: `/datos/noticias.json` se queda con la forma de antes, sin «imagen», para la app que ya tiene la gente (OTA del 10/11 sobre `fa30779`); la web y la app nuevas leen `/datos/noticias-v2.json`. `rwadar-app/noticias/noticias-v1.cjs` deriva el v1 del v2 y lo valida con una copia congelada del motor de esa app (`motor-app-26664c9.cjs`, sha256 fijado); `rwadar-publicar.js` se para si no coinciden. «imagen» es opcional al leer (sin ella, el fondo oscuro) y obligatoria al publicar. La precarga admite y comprueba `noticias-editoriales/<clave>.webp` contra `fotos.json`. La prueba intermitente del diálogo de noticias espera a que se cierre **y** se quite la clase. El pie de Inicio vuelve a verse en la web móvil (`<div role="note">`, comprobado a 390 con Tab). Sin fotos válidas no se publica, tampoco en local. README de las fotos: `alt=""`, licencia y sin marca C2PA/IPTC. También: sin la cifra repetida de ofertas, rótulo antes que valor en las cifras, otra foto para `acciones-eeuu`, la fila de secciones arriba en el móvil y los colores por tipo en `/mercado/`.

**Hecho en este commit**:
- **Arreglo grave de la app**: Inicio se rompía (`ReferenceError: n is not defined`): el commit anterior quitó `n` de `Inicio.js` y seguía pasando `total={n}` a `RecienAnadidas`. Ninguna prueba lo vio porque las de la app leen el código como texto; salió al pintar Inicio con react-native-web.
- **/aprende/ capítulo 04**: vuelven «En el radar, N de las M ofertas tienen un mínimo documentado de 1 €…» (`#relMinimos`) y su aviso (`#relMinimosAviso`), y en el 06 la vigencia «Catálogo revisado el…» (`#relVigencia`), como en main. /aprende/ no carga el catálogo: `rwadar-publicar.js` calcula las cifras como Inicio (ofertas del lote y el mínimo corto de `transparencia.json` con la misma fecha de verificación) y las escribe en el `<main>` (`data-catalogo-*`); `aprende-20261110.js` las enseña solo mientras la revisión siga vigente y en el idioma elegido. Hoy: 5 de 22 (una de 1 $), revisado el 10/11, próxima el 17/11. La app vuelve a enseñar la frase y su aviso (`AprendeInicio.js`, solo con catálogo vigente).
- **Titulares**: adenda fechada en `rwadar-app/data/verificaciones/2026-11-10-v2/noticias/EDICION.md` con los 8 titulares antes → ahora (es y en), en qué frase de la fuente se apoya cada uno y que `tituloInformativo` se conserva. El de la UE dice «los Veintisiete». Las notas de las revisoras sobre el tono quedan anotadas para quien edite; no se cambió ningún titular.
- `.github/comprobar-publicado.mjs`: tras publicar, /mercado/, /noticias/ y /aprende/ dan 200 con su canonical; `/datos/noticias.json` no lleva «imagen» y `noticias-v2.json` es el del build; cada foto usada da 200, `image/webp` y el sha256 de `fotos.json`.
- Quitados del índice los enlaces `node_modules` que el commit anterior había metido por error.
- **Guardián de la OTA**: con el commit anterior daba «Requiere revisión nativa y otro APK: package.json», porque había añadido comprobaciones a `test:tools` en el `package.json` de la raíz. Vuelve a ser el de `fa30779` y esas comprobaciones (`rwadar-noticias-editoriales.js`, `noticias-v1.cjs` y `copiar-modelo-web.cjs` de las noticias) las lanza ahora `probar-web.mjs`.

**Pulido visual (web y app, sin tocar estructura ni textos verificados)**, copiando el sistema de la lista de Ofertas, la ficha y el radar: en escritorio, los bloques de Inicio a lo ancho de la portada (el mismo borde izquierdo que el título, la cabecera y la lista de Ofertas; antes iban 67 px más adentro); el mismo ritmo en todos los bloques (aire también bajo el «Ver …»); tarjetas de Ofertas de Inicio con la piel de las de Ofertas: «Nueva» y «Pasa las 5 comprobaciones» sobre la foto en su píldora oscura, títulos alineados y en la letra de los titulares, mismas alturas por fila con «Añadida el …» al pie (antes, en el móvil, un vacío bajo las cortas); en `/mercado/` (web y app) cada gráfico en una tarjeta; en la app, «El mercado hoy» sin el doble margen ni la raya de arriba y «1 año: disponible el 08/11/2027» sin cortar; títulos de las tarjetas de la app sin cortar (hasta 4 líneas); texto de lectura a 16 px en el móvil (subtítulos de bloque, tarjeta de Aprende, resumen y detalle de las noticias, «Saber más» de /aprende/, barras de /mercado/). Capturas de antes y después en el scratchpad de la sesión (`capturas-pulido/`).

**Pruebas** (salida real, en local): `npm test` de la raíz termina con código 0: base (las de `rwadar-app`, incluidas 30 comprobaciones SQL sin red, 11/11 y 99/99 de `.github`), web (`probar-web.mjs` 661 correctas y 0 fallidas, entre ellas las nuevas de /aprende/ y de las herramientas de las noticias; fichas 70; precarga 40), QR, app 525 de 527 (2 omitidas, como antes), herramientas y acceso 248/248 (con la prueba nueva de /aprende/ en Chromium: cifras vigentes, caducadas y sin cifras). Guardián: `node rwadar-movil/scripts/comprobar-ota-compatible.cjs --base fa30779f7d1d671f56b5f711cde9cac9eb090310` → `{"ok":true,…,"runtime":"1.4.2(24)"}`. Las capturas de la app son de una vista previa con react-native-web (sin fotos: las imágenes no cargan en ese modo).

**No hecho (recomendaciones que ampliaban el alcance)**: og:image propio de las secciones (hoy usan `og.png`); quitar la fuente 11 (rwa.xyz) del 03 y renumerar `fuentes.json`; cambiar titulares por las notas de las revisoras (decisión editorial).

**Pendiente (Víctor)**: revisar y, si le gusta, publicar web y OTA. El orden ya no importa: la app instalada sigue leyendo `/datos/noticias.json` sin «imagen» y la nueva lee `/datos/noticias-v2.json`. En cada ciclo de investigación, las noticias van a `rwadar-site/datos/noticias-v2.json` con su `imagen` y después `node rwadar-app/noticias/noticias-v1.cjs` escribe el v1.

## 10 de noviembre de 2026 (6) · Claude · Inicio por bloques (web y app) y fotos en las noticias

Víctor: «mucho lío en Inicio; las imágenes de las noticias no atraen; los titulares no atraen. Ordénala, que sea de fácil vista; si quieren más detalle, que entren en cada sección, y que no se repita». Un commit local, **sin publicar, sin lanzar flujos, sin Supabase y sin claves**.

**Inicio (web y app, el mismo orden)**: Cabecera (radar compacto, frase de marca, 3 cifras: ofertas, plataformas y fecha de revisión, «Ver las N ofertas» y un solo aviso de riesgo corto) · Ofertas (un carrusel que une recién añadidas y Selección sin duplicados, 6 como mucho con 3 huecos guardados para la Selección; «Pasa las 5 comprobaciones» en la tarjeta y las 5 plegadas debajo) · El mercado hoy (tarjeta compacta: total, 24 h y una barra apilada con los 3 tipos mayores + «Otros», fuente y hora) · Noticias (3 tarjetas grandes con foto y solo el titular, sobre un degradado) · Aprende (una tarjeta) · Pie (una línea legal + «Nota legal completa →»). Fuera de Inicio: los 6 capítulos, el escaparate aparte, «Mira, compara y decide tú» y la franja de novedades (web: siguen en /cambios; app: Perfil › «Novedades de RWAdar», que abre /cambios). Web a 390 px: de unos 10.290 px a unos 3.000 (medido en local con el catálogo pintado).

**Secciones nuevas (web)**: `/mercado/` (la tokenización entera, como estaba en Inicio), `/noticias/` (las 8 con foto, fecha, titular y resumen; el detalle en un `<dialog>`; `/noticias/#id` lo abre) y `/aprende/` (los seis capítulos tal cual, con «Saber más», carrusel y fuentes; el 03 sin las cifras de rwa.xyz, con un enlace a /mercado/; la tarjeta de la Academy y la nota legal en `#nota-legal`). Las tres en el sitemap, en `PAGINAS_SECCIONES`/`ARCHIVOS_PUBLICABLES` y con su `_headers`. Hojas y scripts nuevos: `secciones-20261110.css` y `aprende-20261110.js`. Los generadores siguen: `fuentes.mjs` y la tarjeta de `rwadar-academy.js` escriben en `aprende/index.html`; `rwadar-noticias.js` ya solo escribe el módulo de la app (y se para si la franja vuelve a Inicio). **App**: pantallas «El mercado hoy», «Noticias» y «Aprende» (`AprendeInicio.js`) encima de Inicio, en un `Modal` a pantalla completa como las fichas (atrás de Android vuelve).

**Noticias**: `rwadar-site/datos/noticias.json` = copia exacta del JSON verificado nuevo (`2026-11-10-v2`, titulares nuevos y campo `imagen`). El motor valida `imagen` (obligatoria, `[a-z0-9-]+`, 60 como mucho) y da `rutaFoto()`; fuera las ilustraciones SVG (web y app). Fotos: `rwadar-noticias-editoriales.js` comprueba la biblioteca de la directora de arte (`rwadar-editorial-source/noticias/fotos.json` + `fotos/<clave>.webp`, 1200×800, bytes y sha256) y `rwadar-publicar.js` las publica en `/noticias-editoriales/<clave>.webp`; la app las carga de `https://rwadar.pages.dev/noticias-editoriales/…`. En remoto, sin fotos válidas no se publica; en local, avisa. Debajo, «Imágenes ilustrativas generadas con IA, no fotos de la noticia». La foto va con `alt=""` (decorativa: el titular ya es el nombre del enlace).

**Pruebas** (**corregido en (7)**: con las fotos ya en el repositorio, `npm test` dejó de estar en verde en ese commit —la precarga rechazaba la base con `noticias-editoriales/`— hasta las correcciones de (7)): `npm test` de la raíz en verde (base 11/11; web: 1.820 comprobaciones OK, más fichas, precarga y QR; app 525 de 527, 2 omitidas como antes; herramientas; acceso 248/248). Actualizadas con criterio, ninguna desactivada: `probar-web.mjs` (Inicio por bloques, /aprende/, /mercado/, /noticias/, cifras, carrusel, hojas), `rwadar-app/probar-web-escritorio.mjs`, `rwadar-acceso/noticias-sector.test.mjs` y `tokenizacion.test.mjs` (Chromium: Inicio, /mercado/ y /noticias/ a 390 y 1366), y en la app `inicio-historia`, `navegacion`, `noticias-sector`, `tokenizacion` y `recien-anadidas` (con pruebas nuevas de `ofertasDestacadas`, `resumenCompacto` e `imagen`). Guardián de la OTA con la base `fa30779…`: `ok`. Capturas en el scratchpad de la sesión (`capturas-rediseno/`).

**Pendiente (Víctor)**:
- ~~Revisar y publicar web y OTA juntas~~ Ver (7): ya no hace falta que vayan juntas (la app instalada sigue con `/datos/noticias.json` sin «imagen»; la nueva lee `/datos/noticias-v2.json`).
- ~~Las 8 fotos aún no estaban~~ **Corregido en (7)**: las 8 fotos están desde el commit «Noticias: biblioteca de fotos editoriales por tema» (`fotos.json` con `bytes` y `sha256`, `fotos/<clave>.webp`) y `node rwadar-noticias-editoriales.js --comprobar` pasa.
- En cada ciclo de investigación: copiar las noticias a `rwadar-site/datos/noticias.json` con su `imagen` (una clave de `fotos.json`; un tema nuevo necesita su foto antes de publicar).
- La fuente 11 (rwa.xyz) sigue en el grupo del 03 de /aprende/ aunque el texto ya no cite su cifra; quitarla exige renumerar `fuentes.json`.

## 10 de noviembre de 2026 (5) · Claude · ciclo del catálogo completo, publicado; Inicio con tokenización y noticias

Víctor: «Hazme la investigación en profundidad de RWAdar buscando nuevas ofertas y publica la actualización de hoy». Después pidió calidad y expertos, y para Inicio un gráfico de la tokenización y una sección de noticias. Informe: [`docs/INVESTIGACION-CATALOGO-2026-11-10.md`](../INVESTIGACION-CATALOGO-2026-11-10.md).

**Publicado hoy** (con la orden de Víctor como permiso del ciclo):
- PR #94: la entrega `2026-11-10`. «Aplicar catálogo» en verde: la publicada pasa de la `88d5a757` a la `dfdc4c85` (25/22, 8/13/1, verificada el 10/11, vale hasta el 17/11). Leído como visitante antes y después (`lectura-despues-de-aplicar/`).
- PR #95: sincronización, transparencia (42 de 44 al 10/11), semilla, fichas, sello, y unión de las entradas (1) a (4) de abajo (tokenización y noticias). «Publicar web» en preview y producción; «OTA Android» con base `fa30779…`.
- PR de cierre: la nota de la foto guardada de la tokenización pasa a ser neutra («Cifras de la última foto diaria de RWAdar, del …»). Desde Cloudflare, CoinGecko responde unas veces sí y otras no (comprobado en producción a las 17:49 UTC: en vivo en una petición y foto guardada en otra). Cuando falla, la web enseña la foto diaria con su fecha; el aviso naranja «CoinGecko no responde ahora» alarmaba sin motivo. Sello nuevo, web y OTA otra vez.

**Cómo se hizo**: 8 grupos con revisor independiente, más una segunda oleada (registros, novedades, radar sin oferta, brókers). Montaje con el flujo nuevo `.claude/workflows/entrega-catalogo.js`: montador, tres revisores (SQL, contenido, cumplimiento), corrector y auditor; el SQL no cambió con las correcciones. Ninguna candidata entra (DECISIONES §3); a vigilar: pagarés tokenizados de Prosegur Cash, Securitize Stocks y Profitus.

**Datos personales**: recortados en las copias de hoy y en copias antiguas ya en `main` (Brickwise, Switzerlend, Spiko, Banco de Lituania, wemakeit, Zefix).

**Pendiente**:
- El límite de uso de la cuenta cortó a media mañana el panel de Alan Frei y la investigación de Securitize; los decidió el coordinador (no entran hoy).
- La foto diaria de la tokenización llega a la web solo al publicar. Si se quiere que la lectura en vivo no falle nunca, hace falta una clave Demo de CoinGecko (gratis) como secreto del servidor web: es una credencial, la decide Víctor.
- Kraken (documentoEspana) y mTBILL (supervisada) siguen con fecha 05/11 en transparencia.
- Desde la próxima entrega, «el responsable del proyecto» en `aprobada_referencia`.

## 10 de noviembre de 2026 (4) · Claude · «Noticias del sector»: correcciones de la revisión

La revisora aprobó con cambios. Hecho, en un commit local encima del anterior. **Sin publicar, sin lanzar flujos, sin Supabase y sin claves.**

**Obligatorias**
- «Hoy» ya no depende solo de `seccion`: `etiquetaReciente(n, hoyISO)` en `rwadar-movil/lib/noticias-sector.js` da «Hoy» solo si `seccion === 'hoy'` y la fecha es la de hoy, «Ayer» si es del día anterior y nada en el resto. `hoyISO` es la fecha local del dispositivo (`fechaLocal`, sin `Intl`). Web y app la usan en la tarjeta, en su nombre accesible y en el detalle. El 10/11: 1 «Hoy» y 2 «Ayer»; el 13/11, ninguna. Las de hoy siguen primero. «Ayer» → «Yesterday» en los dos `idioma-en`.
- Ilustración del detalle entera: el lienzo se recorta a la franja del motivo (`RECORTE_DETALLE`: `viewBox 0 30 320 224`, `xMidYMid slice`, 10:7). Web: `.nt-dlg-arte` en 10:7 (a pantalla completa en el móvil; en escritorio, lámina centrada de 514 × 360). App: alto = ancho × 0,7. Comprobado en capturas de las 8 noticias a 390 y 1366 px.

**Recomendadas hechas**
- Titular con una sola sombra corta (sin el rectángulo oscuro). Tarjetas de escritorio de 280 px con letra de 1,25 rem y fundido en el borde que aún tiene tarjetas (clases `nt-pista--antes/--despues`).
- Regulación con cuatro figuras (edificio, balanza, documento con sello, mazo); `variantes()` las reparte por turno dentro de cada categoría, así que dos vecinas nunca repiten.
- Foco visible en alto contraste (`outline` transparente y `CanvasText` en `forced-colors`). La flecha ↗ va dentro del texto del botón, con espacio de no separación.
- En inglés, «Original source text (Spanish)» encima del nombre de la fuente (web y app, con `FuenteOriginal`). Fuera `tituloInformativo` del detalle (repetía el titular); el dato sigue en el archivo y se valida.
- La app mira `content-length` antes de leer el cuerpo y corta si no puede caber.
- La sección de la app, vista con react-native-web (SSR) en capturas: tarjetas, «Hoy»/«Ayer», detalle en castellano e inglés. No es un dispositivo real.

**Pruebas:** `noticias-sector.test.cjs` (14) y `rwadar-acceso/noticias-sector.test.mjs` (2, con reloj fijo el 10/11 y el 13/11). `npm test` de la raíz en verde; guardián de la OTA con la base `fa30779…`: `ok`.

**Pendiente (Víctor):** publicar la web (`/datos/noticias.json`) **antes o a la vez** que la OTA; si la OTA va primero, la app dirá «Ahora no podemos mostrar las noticias» hasta que la web esté publicada.

## 10 de noviembre de 2026 (3) · Claude · «Noticias del sector» en Inicio (web y app)

Víctor pidió una sección pequeña de noticias, del día y las más importantes del sector, «muy visuales, solo el titular». Va en Inicio justo después de «La tokenización en el mundo», en la web y en la app, en un commit encima de ese módulo. **Sin publicar, sin lanzar flujos, sin Supabase y sin claves.**

**Qué hay**
- Datos: `rwadar-site/datos/noticias.json`, copia exacta de las 8 noticias verificadas del ciclo del 10/11 (`noticias-2026-11-10.json` de la verificación `2026-11-10-v2`). Ningún texto cambiado. Se publica como recurso estático en `/datos/noticias.json` (en `ARCHIVOS_PUBLICABLES`; la regla de `/datos/*` de `_headers` ya da `max-age=0, must-revalidate` y `noindex`). En cada ciclo de investigación se sustituye este archivo.
- Motor único `rwadar-movil/lib/noticias-sector.js` (web, app y generador): valida la forma entera (campos exactos, fechas, sección, categoría, ámbito, tipo de fuente, solo `https`, sin `<`/`>`, ids únicos), ordena (las de hoy primero, luego de la más nueva a la más antigua), elige los textos `en` en inglés, da fechas «10/11» / «10 Nov» y dibuja las ilustraciones. Copia web exacta: `node rwadar-app/noticias/copiar-modelo-web.cjs` (`assets/noticias-sector-modelo-20261110.js`). Entra en la huella del contenido aprobado.
- `rwadar-publicar.js` valida `/datos/noticias.json` con ese motor y **se para** si no vale («rwadar-site/datos/noticias.json no vale: …»).
- Ilustraciones propias en SVG, deterministas por noticia: una por categoría (regulación: institución con columnas; mercado: barras y tendencia; producto: fichas apiladas; riesgo: escudo agrietado) con el acento de su ámbito (España: anillos y barrido del radar en ámbar; UE: red de nodos en azul, sin estrellas; Mundo: globo de meridianos). Sin texto, logotipos, banderas, personas ni imágenes de terceros. Velo oscuro abajo para leer el titular.
- Web: sección `#noticias` (`assets/noticias-sector-20261110.{js,css}`): «Noticias del sector» y «Actualizadas el 10/11»; carrusel con `scroll-snap`, tarjetas 4:5 que son botones con el titular entero como nombre (3 líneas a la vista con «…»), «Hoy» en las del día; flechas del teclado, Inicio/Fin y botones ‹ › con ratón. Al pulsar, un `<dialog>` modal: fecha · categoría · ámbito, titular, título informativo, resumen, «Por qué te importa», fuente con «Consultada el», «Leer en la fuente (sales de RWAdar) ↗» (`target=_blank`, `rel="noopener noreferrer"`) y «No es una recomendación». Escape, «×» o el fondo cierran y el foco vuelve a la tarjeta. Solo `textContent` y DOM de SVG; el navegador solo pide `/datos/noticias.json` (la CSP no cambia).
- App: `componentes/NoticiasSector.js` en `Inicio.js` tras `TokenizacionMundo`; lee `https://rwadar.pages.dev/datos/noticias.json` (`lib/noticias-sector-remota.js`: sin cookies, 10 s de plazo, 256 kB como mucho, forma validada, reutiliza 10 min). `FlatList` horizontal con ajuste; el detalle en un `Modal` a pantalla completa; el enlace sale por `onAbrirEnlace` (solo https) con el texto «(sales de RWAdar)», como el resto. Con la red caída: aviso y «Reintentar». Solo JavaScript y `react-native-svg`: el guardián de la OTA con la base `fa30779…` da `ok`.
- Inglés: 11 textos nuevos en `lib/idioma-en.js` (copiados a la web); los de cada noticia salen de sus campos `en`.

**Pruebas:** `rwadar-movil/tests/noticias-sector.test.cjs` (11: forma y rechazos, textos por idioma, 12 ilustraciones distintas y solo formas, lectura sin cookies, caché de 10 min, la sección con React aislado, el detalle y su enlace, inglés, red caída y su sitio en Inicio), `rwadar-acceso/noticias-sector.test.mjs` (2: publicables, cabeceras, validación del generador, script sin `innerHTML` ni terceros; Chromium a 390 y 1366 px: 8 botones con su nombre, 3 líneas, sin desbordes, teclado, diálogo modal con su enlace, Escape devuelve el foco, inglés y archivo roto). Ajustadas `probar-web.mjs` (hojas, huellas y `/datos/noticias.json` publicado igual que la fuente) y `probar-web-escritorio.mjs` (orden de scripts). `npm test` de la raíz en verde. Capturas a 390×844 y 1366×900, en castellano e inglés, portada y diálogo.

**Pendiente (Víctor):**
- Unir la rama, sellar y publicar la web y la OTA cuando lo autorice (hacen falta las dos: la app lee el archivo de la web publicada; hasta entonces dirá «Ahora no podemos mostrar las noticias»).
- En cada ciclo de investigación, copiar las noticias nuevas a `rwadar-site/datos/noticias.json` (el generador las rechaza si no tienen la forma).

## 10 de noviembre de 2026 (2) · Claude · «La tokenización en el mundo»: correcciones de la revisión

Dos revisoras (código y seguridad; diseño, datos y accesibilidad) aprobaron con cambios. Hecho, en un commit encima del anterior. **Sin publicar, sin lanzar flujos, sin Supabase y sin claves.**

**Obligatorias**
- El generador ya no pierde la historia al publicar desde un ordenador: `rwadar-tokenizacion-historico.js` (nuevo, en la huella aprobada) usa `RWADAR_TOKENIZACION_HISTORICO` (publicar.yml) y, si no está, `git show origin/datos-tokenizacion:tokenizacion-historico.json`, validado igual. Si con `--preview` o `--produccion` solo hay semilla, sale un AVISO grande: «haz `git fetch origin datos-tokenizacion`». Prueba nueva en `.github/tokenizacion.test.mjs` (sin variable y con la ref; variable; enlace simbólico; ref rota o vacía).
- Sin nombres de personas en lo que se publica o va en la app (index.html, motor y su copia web, servidor, flujo).
- Línea de evolución con escala honesta (web y app, `alturasLinea` del motor): abarca como poco un 4 % del valor, sin área rellena hasta el suelo y con la escala escrita debajo («De 47.120 M$ (07/10/2025) a 49.684 M$ (10/11/2026) · +5,4 %», `textosLinea`).
- Escritorio: la sección va en la columna de 720 px de sus vecinas (título alineado con los capítulos); solo los gráficos se abren al ancho de las tarjetas. La prueba de Chromium lo mide.
- Orden de lectura: cada tabla para lectores de pantalla va justo detrás de su gráfico.

**Recomendadas aplicadas**
- Servidor: las peticiones simultáneas comparten una sola llamada a CoinGecko (20 a la vez → 1), y `User-Agent: RWAdar/1.0 (+https://rwadar.pages.dev)`.
- Flujo diario: primer paso «Solo desde main», como publicar.yml. publicar.yml anota el commit de `datos-tokenizacion` en el registro.
- Cápsulas: «desde 03/11» bajo cada cifra (con ±2 días, «7 días» puede ser 5 o 9); sin foto todavía, «disponible el 15/11» (`fechaLlegada`); con la foto guardada de otro día, «foto del 10/11» en «24 h». La quinta se llama «Histórico» («All time»).
- «M$» explicado: «…, en millones de dólares (M$)»; el lector de pantalla oye «49.684 millones de dólares». Cifra grande sin fuente monoespaciada. Fechas en inglés «10 Nov 2026». «= 0,0 %» con espacio. Con una sola foto, una columna.
- App: reutiliza una respuesta buena 10 minutos en la sesión (`REUSO_MS`); los fallos no se guardan. Pruebas nuevas: aviso de foto guardada, línea con varias fotos (onLayout a 320 px), «Reintentar» sin dígitos.

**Para tener en cuenta (no cambiado)**
- Cupo de Pages Functions: cada visita a la portada y cada apertura de Inicio en la app (como mucho una cada 10 min) es una llamada al worker; si falla la API, la web pide además `/datos/`, que también pasa por el worker. Al agotar las 100.000 diarias Pages sirve sin worker («fail open», ver `rwadar-acceso/compilar.cjs`) y las lecciones de /academy/ saldrían sin pedir cuenta. Vigilarlo en el panel de Cloudflare tras publicar.
- La Cache API (`caches.default`) no hace nada en `*.pages.dev`: en producción probablemente solo funcione la caché en memoria de cada worker (más la unión de peticiones simultáneas). Comprobarlo en la preview mirando las llamadas a CoinGecko por hora.
- `idioma-en-20261022.js` cambia sin cambiar de nombre, pero lo publicado lleva huella de contenido en el nombre (`idioma-en-20261022.<hash>.js`): `immutable` no sirve una copia vieja.

## 10 de noviembre de 2026 · Claude · «La tokenización en el mundo» en Inicio (web y app)

Víctor pidió en Inicio un gráfico muy visual de la evolución de la tokenización. Eligió: por **tipo de activo** (no por país ni por blockchain: no hay fuente gratis fiable), en la web y en la app, con datos **gratis de CoinGecko** y una foto diaria guardada por RWAdar para que 7 días, 30 días, 1 año y el total se rellenen solos. **Sin publicar, sin lanzar flujos, sin Supabase y sin claves.**

**Qué hay**
- Motor único `rwadar-movil/lib/tokenizacion.js` (web, app, servidor y foto diaria): total = categoría `tokenized-products`; ocho tipos (crédito privado, letras del Tesoro, materias primas con el oro aparte, acciones, fondos monetarios, otros créditos, ETF, inmuebles). No usa `real-world-assets-rwa` ni `rwa-protocol`. Los cambios a 7 d, 30 d, 1 año y total se calculan **solo con fotos reales** a ±2 días; si no hay, «aún sin datos» con la fecha desde la que se guardan. Formato «49.684 M$» / «+1,2 %» (en: «$49,684M» / «+1.2%»).
- Servidor web: `GET /api/tokenizacion` (`rwadar-acceso/tokenizacion-servidor.mjs`, compilado en `_worker.js` por `compilar.cjs`). Público, solo GET, sin parámetros, sin cookies. Lee CoinGecko desde el servidor (el navegador no habla con terceros: la CSP no cambia), caché de 30 min en memoria y Cache API, plazo de 6 s. Si CoinGecko falla o da 429: la última foto guardada con su fecha y `fuente: foto-guardada`, y no le vuelve a preguntar en 5 min (o su Retry-After, hasta 1 h). Sin nada: `sin-datos`, sin cifras.
- Foto diaria: flujo nuevo `tokenizacion-diaria.yml` (06:23 UTC y a mano) con `rwadar-app/tokenizacion/foto-diaria.mjs`: 3 intentos con espera, 20 s por intento, valida la forma y añade la foto del día a `tokenizacion-historico.json` de la rama **`datos-tokenizacion`** (la crea huérfana desde la semilla; un commit por día; idempotente). `contents: write` solo en su trabajo; acciones por SHA.
- Publicar: paso nuevo en `publicar.yml`, «Traer el histórico de la tokenización», que deja el archivo de la rama fuera del repositorio (árbol limpio) y lo pasa en `RWADAR_TOKENIZACION_HISTORICO`. `rwadar-publicar.js` lo valida, le suma la semilla y lo publica en `/datos/tokenizacion-historico.json`. Sin rama o roto: la semilla de main (`rwadar-site/datos/tokenizacion-historico.json`, la foto real del 10/11/2026 a las 15:25 UTC). Nunca bloquea la publicación.
- Web: sección `#tokenizacion` en Inicio, tras «Recién añadidas» y antes del capítulo 01 (la portada sigue entera en la primera pantalla a 390×844). Cifra grande, cinco cápsulas con signo, flecha y palabra, barras por tipo con cuota y cambio en 24 h, línea con dos o más fotos, dos tablas para lectores de pantalla y «Datos: CoinGecko» con la hora. `assets/tokenizacion-20261110.{js,css}` y `assets/tokenizacion-modelo-20261110.js` (copia exacta del motor: `node rwadar-app/tokenizacion/copiar-modelo-web.cjs`). Si el servidor falla, lee `/datos/…` y, si tampoco, un estado vacío honesto.
- App: `componentes/TokenizacionMundo.js` en `Inicio.js` tras «Recién añadidas», lee `https://rwadar.pages.dev/api/tokenizacion` (`lib/tokenizacion-remota.js`); con la red caída dice «Ahora no podemos mostrar…» y ofrece «Reintentar». Solo JavaScript y `react-native-svg` (ya instalado): el guardián de la OTA con la base `fa30779…` da `ok`.
- Inglés: 36 textos nuevos en `lib/idioma-en.js` (copiados a la web).
- `rwadar-movil/lib/tokenizacion.js` entra en la huella del contenido aprobado y los 4 archivos nuevos de la web, en `ARCHIVOS_PUBLICABLES`: **hace falta un sello nuevo** antes de publicar, como siempre.

**Pruebas:** `rwadar-movil/tests/tokenizacion.test.cjs` (12: motor, formato, lectura y la sección con React aislado, también en inglés y con la red caída), `rwadar-acceso/tokenizacion.test.mjs` (8: la ruta, caché, 429, plazo, el worker compilado, la copia web y Chromium a 390 y 1366 px con CoinGecko simulado), `.github/tokenizacion.test.mjs` (4: el flujo y el paso de publicar ejecutados de verdad contra un «origin» de usar y tirar: rama huérfana, un commit por día, idempotente, main intacto). Ajustadas `probar-web.mjs`, `probar-web-escritorio.mjs` y `compilar.test.mjs`. `npm test` de la raíz en verde.

**Pendiente (Víctor):**
- Unir la rama. GitHub solo ejecuta el horario desde main: la primera foto diaria llega la mañana siguiente (o con «Run workflow»). Las cápsulas de 7 d, 30 d y 1 año se irán llenando con los días; la línea sale con la segunda foto.
- Publicar la web (sello, preview y producción) y la OTA cuando lo autorice.
- CoinGecko gratis tiene límite de peticiones por IP. Con la caché de 30 min se le pregunta como mucho unas 2 veces por hora y centro de datos; si da 429, se ve la foto guardada con su aviso. Si en `rwadar.pages.dev` la Cache API no funcionara, quedaría solo la caché en memoria de cada worker (más peticiones, el mismo comportamiento).

## 9 de noviembre de 2026 (3) · Claude · informe «Números de RWAdar»

Víctor pidió las visitas y los números de la web y de la app. Nuevo flujo `numeros.yml` (a mano y los lunes a las 07:47 UTC) con `.github/numeros.mjs`. Solo lee y solo saca totales:
- cuentas, en una transacción de solo lectura;
- avisos por correo y cartera, que solo se cuentan si la protección (RLS) deja leerlos; si no, sale «—» en vez de un 0 falso;
- descargas del APK, de la API pública de GitHub;
- visitas, solo con el secreto opcional `CLOUDFLARE_ANALITICA_TOKEN`; no usa el de publicar.

Lo publica en el resumen y como comentario en la incidencia «Números de RWAdar». Pruebas: `.github/numeros.test.mjs` (7) y la regla TLS de `flujos.test.mjs`.

## 9 de noviembre de 2026 (2) · Claude · flujos con las claves de Víctor («Dominio de correo» y «Supabase (gestión de Auth)»)

Rama `claude/claves-0711`, sin unir ni lanzar: **las claves aún no existen y no se ha llamado a ninguna API de verdad.** Primer commit `3989d2a` (los dos flujos); el segundo corrige 15 hallazgos de la revisión independiente y aplica la decisión de Víctor del 08/11.

**Decisión del 08/11: no hay clave de Cloudflare.** Los registros DNS de Lettermint los copia en Cloudflare la sesión de Claude del PC de Víctor, con su Chrome, mientras él mira.
- «Dominio de correo» (`dominio-correo.yml`, `rwadar-app/dominio-correo.mjs`): `estado`, `verificar-dominio`, `ajustar-rutas` y `crear-token-base` funcionan sin `CLOUDFLARE_DNS_TOKEN`. `estado` dice «Sin clave de Cloudflare: el DNS se pone a mano desde el panel» y sigue con Lettermint, en verde. `preparar-dominio` queda por si algún día existe la clave; sin ella, para sin hacer ninguna petición.
- «Supabase (gestión de Auth)» (`supabase-gestion.yml`, `rwadar-app/supabase-gestion.mjs`): `estado`, `plantillas` y `smtp-lettermint`.

**Las dos claves** (detalle: `PLAN-CEO-2026-11-06.md`, «Claves que da Víctor»):
- `SUPABASE_ACCESS_TOKEN`: con alcance, solo `exgpmjpaaebyoolpwced`; Auth Config y Project Settings en lectura y escritura; **sin Database** (su «Read only query» lee toda la base, Vault incluido); un año de caducidad como mucho.
- `LETTERMINT_GESTION_TOKEN` (nombre nuevo): `read:team` y lectura y escritura de projects, domains y routes. Se revoca al acabar la ronda 2.
- `LETTERMINT_TEAM_TOKEN` se queda **solo** para `sincronizar-bajas` de «Correo Lettermint», con solo `read:suppressions`: uno por uso, y el trabajo diario no puede crear tokens que envían como `rwadar.app`.

**Lo que cambió con la revisión**
- `SUPABASE_DB_URL`: se comprueba su forma antes de llamar a psql, sin enseñar nada de ella; se enmascaran el usuario y la contraseña sueltos; el error de psql ya no se copia en crudo (libpq repetía la contraseña entre comillas: probado con psql 17.11).
- psql de `crear-token-base` con `verify-full` y la CA de Supabase. **Pendiente:** la CA (`rwadar-app/certificados/supabase-ca.crt`) aún no está; la sube la sesión de Claude del PC (ver el `LEEME.md` de esa carpeta). Sin ella, `crear-token-base` para sin crear nada. Cuando funcione, pasar a `verify-full` los demás flujos con `SUPABASE_DB_URL`.
- Si psql no responde limpio al guardar en Vault, se mira solo leyendo la huella SHA-256 de lo que guarda Vault antes de borrar nada; si no se puede mirar, no se borra ningún token.
- Con dos tokens del mismo nombre, ya no dice «Ya está hecho»; un remitente distinto del guardado sale en rojo; si Supabase responde 200 pero al releer no coincide, no se borra el token anterior.
- El estado del dominio se lee del listado de Lettermint (GET `/domains/{id}` no trae `status`), y el doble ya no se lo inventa.
- La prueba de recuperación mira el CAPTCHA de Supabase y el `error_code`; solo un 5xx sugiere volver al SMTP de antes, y remite al bloque «el SMTP de antes».
- RUNBOOK, «Encender el correo», pasos 3 a 9, reescritos con los flujos (`guardar-correo` queda como alternativa).

**Pruebas:** `node --test .github/claves.test.mjs` 42/42 (eran 26). 21 mutaciones de la capa que tapa claves, la paginación, el DKIM, las relecturas y lo nuevo: todas las tumba alguna prueba. `npm test` de la raíz en verde.

**Pendiente:**
- La CA de Supabase (arriba).
- `prueba-correo` de «Correo Lettermint» aún lee el token del secreto `LETTERMINT_API_TOKEN`, que con `crear-token-base` ya no existe: cambiarla para que lo lea del Vault antes de la prueba real (`PLAN-CEO`, «después de la ronda 2»).
- La primera ejecución real de cada flujo dirá si algún permiso o forma de respuesta de Lettermint no es como dice su documentación (están marcados «verificar»).
## 9 de noviembre de 2026 (1) · Claude · candado de la Academy: arreglos de la revisión independiente

Misma rama `claude/academy-candado`, encima del commit del candado (`3a1430a`). Revisores independientes confirmaron 9 hallazgos; están todos arreglados y cada uno tiene su prueba. **Sin publicar.**

- **La primera pantalla de `/academy/` no enseñaba ni difuminado ni candado (lo que pidió Víctor).** Ahora el bloque del candado va justo debajo de la entradilla. Sin cuenta, al abrir la página ya se ven el candado, el título, «Crear cuenta gratis» y «Ya tengo cuenta: entrar» sobre las lecciones difuminadas, sin bajar (comprobado a 390×844, 1280×800 y 1920×1080). Los saltos «Nivel 1/2/3» van dentro de lo difuminado. El tutorial 3D sigue nítido y público, pero pasa a ir **detrás** del bloque. Para no obligar a recorrer todas las lecciones a ciegas, cerrado y sin cuenta lo difuminado se corta a 640 px y se desvanece, y el tutorial queda justo debajo. Mientras se pregunta por la sesión no se corta, para que quien la tiene y recarga a mitad de la lista vuelva a su sitio (probado). La fila «Gratis con tu cuenta / Crea tu cuenta gratis…» repetía el botón del recuadro: queda solo la sobrelínea «Gratis con tu cuenta», que con sesión pasa a «Lecciones desbloqueadas». Al volver de `/acceso`, la primera pantalla enseña los niveles nítidos. Con `"publico"`, el índice queda exactamente como antes.
- **Redirección abierta en `volver` (ya existía, antes del candado).** `regresar()` de `acceso.js` y `retornoSeguro()` del servidor comprobaban la cadena, pero navegaban a la ruta ya normalizada. `/.//otra-web`, `/%2e//otra-web` o `/academy/..//otra-web` acababan en otra web tras entrar con la contraseña. Ahora también se rechaza la ruta normalizada que empiece por `//`. Pruebas en `servidor.test.mjs`, `alta-avisos-navegador.test.mjs` y Chromium (entrar con `volver=/.//atacante.test/` se queda en `/`).
- **Quien ya tiene cuenta veía «Crear cuenta gratis» al cargar.** El script del candado va ahora en `<head>` sin `defer` (en el índice y en la portada). Marca `html.candado-comprobando` y el recuadro dice «Comprobando tu sesión…» hasta que el servidor responde. Con un 401, un fallo de red o a los 8 s salen los botones; sin JavaScript se ven desde el principio. **Lo que no se puede quitar:** con sesión, durante una ida y vuelta al servidor (unos 0,2-0,5 s) se ve el recuadro con «Comprobando tu sesión…» sobre las lecciones difuminadas, y luego se desvanece en 0,35 s. Como el candado va ahora en la primera pantalla, ese momento se ve más que antes. El HTML no puede nacer abierto sin que el servidor confirme la sesión. Si el foco estaba en el recuadro, pasa al primer enlace de lo que se abre.
- **Con zoom al 200 % o 400 % el botón «entrar» quedaba cortado.** El recuadro solo es fijo con 600 px de alto o más. Por debajo queda arriba del bloque y más compacto. Medido a 683×319, 640×290 y 320×256: los dos botones se ven enteros.
- **Los saltos «Nivel 1/2/3» llevaban a contenido oculto.** Ahora van dentro de lo difuminado e inerte. Desde la entradilla, el Tab va a «Crear cuenta gratis», «Ya tengo cuenta: entrar» y el tutorial 3D. Si se llega sin sesión con `#intermedio`, el foco pasa al título del recuadro y el Tab sigue en «Crear cuenta gratis». Chromium aplica el ancla al terminar de cargar, así que el foco se pone después de `load`.
- **La portada con sesión seguía invitando a crear cuenta.** Ahora lleva `data-academy-sin-cuenta` y su versión `data-academy-con-cuenta`, que el script cambia al abrir. El índice usa las mismas marcas en su sobrelínea.
- **«Cuenta confirmada: Academy desbloqueada»** solo sale con la sesión ya confirmada. Antes salía también con el candado cerrado o con la red caída. Probado en Chromium sin sesión, con la red caída y con sesión.
- **Pruebas que faltaban:** `probar-precarga.cjs` rechaza tres índices mutados (abierto, sin `inert` o sin el script con huella). Con esa compuerta apagada en `comprobarLeccionesPublicadas`, la prueba falla. La parte de Chromium comprueba antes que `rwadar-publicado/` está construido con el código de hoy; si no, falla con «ejecuta antes npm run test:web».
- Textos ES/EN en `idioma-en.js`, copiados a la web: «Lecciones desbloqueadas» y la frase con cuenta de la portada. «Gratis con tu cuenta» y «Comprobando tu sesión…» ya existían. La app no los enseña; el guardián de la OTA con la base `fa30779…` da `ok`.

**Pendiente (Víctor):** publicar la web cuando lo autorice.

## 8 de noviembre de 2026 (2) · Claude · Academy con candado en la web (difuminada sin cuenta, se abre al entrar)

Víctor: «Quiero que esté bloqueado Academy, que solo se desbloquee al crearse la cuenta, que salga difuminada la página y con un candado, y al registrarse y entrar ya se desbloquee». Rama `claude/academy-candado`. **Sin publicar.**

**Qué hace**
- Sin sesión, `/academy/` y el bloque de lecciones de la portada enseñan las tarjetas difuminadas, con `inert` y `aria-hidden` (no se pulsan, no se enfocan y el lector no las oye). Encima, un recuadro con un candado SVG, «Las lecciones se abren con tu cuenta gratuita», «Es gratis…», «Crear cuenta gratis» (`/acceso?volver=/academy/`) y «Ya tengo cuenta: entrar» (`/acceso?volver=/academy/&vista=entrar`).
- El HTML nace bloqueado. `assets/academy-candado-20261108.js` lo abre solo si `RWADAR_ACCESO.verificar()` (la pasarela de siempre, `/api/acceso/sesion`) devuelve una cuenta. Con un 401 o una respuesta rara, sigue igual. Si la red o el servicio fallan, sigue bloqueado con «No hemos podido comprobar tu sesión. Recarga la página». Al volver con «Atrás» (caché del navegador) pregunta otra vez. En el WebView del tutorial de la app no pregunta.
- Hoja y script nuevos con fecha 20261108, compartidos por las dos páginas. El HTML sale de `htmlCandado` en `rwadar-academy.js`. Con `"publico"` no hay candado.
- `acceso.js`: `vista=entrar` abre «Entrar» cuando se llega desde la Academy.
- El tutorial 3D sigue nítido y público. La puerta del servidor de las lecciones no cambia. La app no cambia: ya exige cuenta para todo (`AccesoObligatorio`).

**`volver`, comprobado en el código**
- Tras entrar con la contraseña: `regresar()` lee `volver=/academy/` y va a `/academy/`, que se abre.
- Tras crear la cuenta: no se entra sola. El índice no guarda vuelta. Si después se pulsa «Entrar con mi cuenta» en esa misma pestaña, vuelve a `/academy/`.
- Tras confirmar el correo: el enlace lleva a la raíz y de ahí a `/acceso`. «Continuar con esta cuenta» deja la sesión y va a la lección guardada o, si no hay, a `/academy/#cuenta-confirmada`, que se ve abierta y con «Cuenta confirmada: Academy desbloqueada».

**Pruebas**
- Nuevo `rwadar-acceso/academy-candado-navegador.test.mjs`, con 12 pruebas: el HTML, el script en una VM con la pasarela de verdad y Chromium con el worker local (incluye entrar desde el candado). La parte de Chromium se omite si no hay Playwright, como en CI.
- Dos pruebas más en `alta-avisos-navegador.test.mjs` (`vista=entrar` y la vuelta tras el alta).
- Ajustadas las pruebas de hojas y scripts de la portada (`probar-web.mjs`, `probar-web-escritorio.mjs`). `comprobar-publicado.mjs` comprueba ahora que el índice llega bloqueado.
- `npm test` de la raíz termina con código 0: web 642/0, móvil 491/0 con 2 omitidas, acceso 231/231. El guardián de la OTA con la base `fa30779…` da `ok`.

**Pendiente (Víctor):**
- Publicar la web (preview y producción) cuando lo autorice.
- `idioma-en.js` solo suma textos de la web que la app no enseña, así que no hace falta OTA por esto.
## 8 de noviembre de 2026 (1) · Claude · web y OTA publicadas; el vigilante avisa con una incidencia

**Publicado** con el permiso general de Víctor:
- Sello de main (PR #86, `b13ddeb`). La primera publicación se paró con `[CONTENIDO_NO_APROBADO]`.
- «Publicar web», preview y producción: runs 42469759275 y 42469926454, las dos en verde, con «Comprobar la web publicada».
- OTA Android con base `fa30779…` (run 42470107925).

Comprobado desde fuera:
- Aktionariat dice «Ir a la web del proveedor (sales de RWAdar)» y Kraken, «Ver oferta en Kraken…».
- La privacidad lleva `#firebase-android`.
- `/assets/../academy/<lección>`, pedida tal cual, da 401, y `%2e%2e` da 404.

**Vigilante, primera vuelta** (a mano; la de las 05:17 UTC del 08/11 no salió):
- 6 de 7 en verde, pg_cron incluido, contra el Supabase real.
- Falló `version-android.json` con un 504 de GitHub, que estaba caído. El «Qué hacer» mandaba a editar la release: falsa alarma.

**Arreglado en esta rama:**
- Un 5xx, un 429 o un corte de red en ese archivo dicen ahora que es pasajero, sin mandar a tocar nada.
- Si algo falla, el flujo abre o comenta la incidencia «Vigilante: algo falla en RWAdar», que menciona a @victorJorques y enlaza la ejecución. Cuando vuelve a ir bien, la cierra.
- Con esto Víctor no tiene que hacer Disable/Enable.

**En marcha:**
- Academy web difuminada con candado sin cuenta (rama `claude/academy-candado`, orden de Víctor del 08/11).
- Flujos con las claves de Víctor (rama `claude/claves-0711`).
- El documento para Víctor, «RWAdar: lo que queda y quién lo hace» (Claude Docs).

## 7 de noviembre de 2026 (1) · Claude · ahorro de minutos, vigilante diario, copias, correo Lettermint, textos legales

Víctor: «todo lo que puedas hacer tú, todo lo haces». Rama `claude/apanarse-0711`. Lo hicieron agentes por zonas, con revisión adversarial: se confirmaron 22 de 29 hallazgos y se corrigieron todos. `npm test` de la raíz termina con código 0 (web 641/0, móvil 491/0 con 2 omitidas, acceso 217/217, `.github` 43/43, avisos 275/0).

**Minutos de GitHub Actions**
- `ci.yml` ya no corre al unir a main: solo en los PR y a mano.
- Si el PR solo toca `docs/**` o `.md` de la raíz que no lee ninguna prueba, se salta la batería (`.github/cambios-ci.sh`). gitleaks corre siempre.
- Los 4 flujos de QA viejos (1.4.0 y 1.4.1) pasan a `.github/qa-archivo/`.
- `compilar-app.yml` usa `upload-artifact` v7.0.1.

**Vigilante diario** (`vigilante.yml`, 05:17 UTC)
- Comprueba la caducidad del catálogo, `security.txt`, `version-android.json`, la web y los fallos de pg_cron de las últimas 48 h.
- Un fallo que ya se corrigió sale en verde.
- Cada fallo lleva «Qué hacer:» en llano.

**Copias**
- `copia-seguridad.yml` admite el modo «prueba» y la cartera (solo en prueba, nunca se sube).
- `copia-seguridad.sh` detecta FORCE RLS y compara filas.
- Nuevo `ensayo-restauracion.yml`: restaura la última copia en un Postgres de usar y tirar, con los registros del servidor apagados, y solo enseña recuentos.

**Correo**
- Nuevo flujo «Correo Lettermint» (`correo-lettermint.yml` y `.sh`) con `prueba-correo` y `sincronizar-bajas`. Está apagado hasta la ronda 2.
- TLS obligatorio (`PGSSLMODE=require`) en todos los flujos que usan `SUPABASE_DB_URL`.

**Web**
- `_routes.json` saca `/assets/*` del worker para ahorrar cupo de Functions; `/academy/*` sigue dentro.
- `_headers` pasa a `Referrer-Policy: no-referrer`, igual que el worker.
- `comprobar-publicado.mjs` prueba que `/assets/../academy/…` no abre una lección.

**Legal 5.3**
- «Datos comprobados a favor».
- El botón dice «Ver oferta en X» solo si se contrata hoy desde España **y** está supervisada; en los demás casos dice «Ir a la web del proveedor (sales de RWAdar)».

**Privacidad**
- El «latido» de Firebase, en la web y en la app.
- El registro de actividades, al día.

**Otros**
- Bandeja de avisos `AVISOS_BANDEJA_REMOTA`, apagada.
- Noticia del 05/11 corregida (Casa de Outeiro).
- Nuevos `BRECHAS-DE-DATOS.md`, los DPA de Netlify y Proton en `encargados/` y el borrador del formulario de Lettermint.

**Necesita OTA:** `App.js`, `Ofertas.js`, `idioma-en.js` y `noticias-contenido.js`. El guardián lo permite con la base `fa30779…`.

**Pendiente:**
- La LSSI 22.2 sobre el latido, antes de encender el push.
- Para que el correo de fallo del vigilante le llegue a Víctor: Actions › Vigilante diario › Disable y luego Enable.
- `rest-cerrada` y el vigilante no se han probado contra el Supabase real.

## 6 de noviembre de 2026 (8) · Claude · plan para encender los avisos (orden decidido)

Víctor: «Hacemos lo que tú como CEO creas que es mejor». Orden decidido en [`PLAN-CEO-2026-11-06.md`](PLAN-CEO-2026-11-06.md):
1. Correo propio con Lettermint. Quita el Gmail sin contrato, que la revisión legal marcó como infracción grave, y desbloquea los avisos.
2. GitHub Team.
3. Notificaciones del móvil, con prueba en un Android físico.

Coste: unos 60 $ al año.

El plan va por rondas:
- Ronda 1, Víctor: dominio, Lettermint y GitHub Team.
- Claude: Vault, privacidad y publicar.
- Ronda 2, Víctor: plantillas y SMTP de Supabase Auth.
- Claude: prueba real, encender el correo y la casilla.
- Ronda 3: el push.

## 6 de noviembre de 2026 (7) · Claude · GitHub: decisión de pasar a una organización con GitHub Team

Víctor: «Decide tú lo mejor para el proyecto» (el hueco de GitHub sin contrato de encargo).

**Decisión: opción A**, organización `rwadar` con **GitHub Team** (4 $ al mes) y el «GitHub Customer Agreement», que incluye el DPA. Motivos, comprobados en las páginas oficiales:
1. El DPA de GitHub solo se aplica a Team y Enterprise. Una organización gratuita no basta.
2. Supabase gratuito no hace copias, así que las de GitHub son las únicas. Sacar de GitHub los datos personales dejaría las cuentas sin copia.
3. Es lo más barato que cierra el hueco. Supabase Pro cuesta 25 $ al mes y no quitaría los flujos de GitHub.
4. Al trasladar el repositorio se conservan los secretos y las direcciones redirigen. Solo los flujos antiguos de pruebas de la 1.4.0 y la 1.4.1 nombran `victorJorques/RWADAR`, y ya no se usan.

`RWAdar-downloads` se queda en la cuenta personal: es público, no trata datos de usuarios y las apps instaladas usan su dirección exacta.

**Corrección del README de encargados:** decía que GitHub no tenía la clave de las copias. Sí la tiene, porque `COPIA_CLAVE` es un secreto de GitHub.

**Pendiente de Víctor** (pasos en `docs/legal/encargados/README.md`, «GitHub · hueco»):
1. Crear la organización con Team.
2. Firmar el «Customer Agreement».
3. Trasladar `RWADAR`.
4. Instalar Claude y Codex en la organización.
5. Probar la copia de seguridad.

Mientras tanto, las copias siguen como están.

## 6 de noviembre de 2026 (6) · Claude · app 1.4.2 publicada; base de OTA a la 1.4.2; migración 31 aplicada; web publicada

**Lo que se hizo:**
- **App 1.4.2 (código 24).**
  - Compilada en EAS desde `main` `fa30779f7d1d671f56b5f711cde9cac9eb090310` («Compilar app», run 42201003691).
  - APK: SHA-256 `89aeee5a76cb4e702590088a98d9b3688613131b59d908bf11a5e1ca081108e7`, 88.073.983 bytes, misma firma de siempre (`f506dea7…`).
  - Publicada en [RWAdar-downloads v1.4.2](https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.4.2) con `version-android.json`, `SHA256SUMS.txt` y `QA-1.4.2.json`.
  - Comprobado desde fuera: el `version-android.json` de la última versión es el exacto, y el APK público coincide byte a byte.
- **Prueba en emulador.** Flujo nuevo `android-142.yml` en RWAdar-downloads; [ejecución que publicó](https://github.com/victorJorques/RWAdar-downloads/actions/runs/42207814749). Android 15 con Google Play:
  - permisos: los de la 1.4.1 más `POST_NOTIFICATIONS`, `c2dm…RECEIVE` y `WAKE_LOCK`;
  - Firebase sin arranque automático, del proyecto `rwadar-14e3d`, e icono de notificación;
  - la 1.4.1 se instala y se abre; la 1.4.2 se instala encima sin desinstalar y se abre dos veces en frío sin cierres;
  - el permiso de notificaciones no se concede solo;
  - red: un proxy del sistema apunta cada servidor. Con la 1.4.2 abierta solo salen `u.expo.dev`, `github.com`, `release-assets.githubusercontent.com` y las comprobaciones de Android. **Ninguna conexión a Firebase.**
  - Los dos primeros intentos de grabar la red no valían, y el flujo los paró como debía. Con `-tcpdump` el wifi simulado no se graba, y sin wifi no hay internet. Quedó el proxy.
- **Base de OTA.** `ota-android.yml` pasa a la 1.4.2 (`fa30779…`). El guardián da `ok` con runtime `1.4.2(24)`. Desde ahora las OTA van a la 1.4.2. La 1.4.1 sigue funcionando y avisa de la versión nueva.
- **Migración 31.** Aplicada en producción con copia previa: ensayo (run 42204084669) y aplicar (run 42204422901). Verificadores 30 y 31 «OK». El correo sigue apagado.
- **Web.** Sello (PR #81) y publicada en revisión y en producción (runs 42204901001 y 42205768477). La privacidad nombra a Lettermint. Las lecciones siguen pidiendo cuenta: 303 a `/acceso`.

**Para encender el push, más adelante:**
1. Privacidad del push en la web y en la app, incluido el «latido» de Firebase; ver `APK-1.4.2-NOTIFICACIONES.md`.
2. Revisión legal de ese texto.
3. OTA con `AVISOS_NOVEDADES_REMOTOS = true`.
4. Prueba en un **Android físico**, porque Víctor usa iPhone.
5. `activar-push`.

**Pendiente menor.** En `main` hay cambios de texto de Lettermint en la app (ocultos mientras el correo esté apagado) que todavía no han ido por OTA. Irán en la próxima.

## 6 de noviembre de 2026 (5) · Claude · correo de los avisos con Lettermint (31, apagado), contratos de encargado, permiso de Eric y manual

Rama `claude/avisos-pendientes-0611`. Órdenes de Víctor: «haz todo lo que puedas, apáñate, te doy permiso de todo», «ya tenemos permiso de eric por escrito».

**Proveedor de correo: Lettermint en lugar de Brevo.** Brevo mete píxel de apertura en el correo transaccional (revisión legal). Lettermint B.V. es de Países Bajos y guarda los datos en la UE. No hace seguimiento por defecto, y además se fuerza en cada correo.

**Base de datos.** `rwadar-app/db/31_correo_lettermint.sql`, con su copia idéntica en `supabase/migrations/`, sustituye `correo_mensaje`, `leer_correos` y `enviar_correos`:
- envía a `api.lettermint.co` con `Idempotency-Key` en la cabecera HTTP (la misma en cada reintento) y `settings` con `track_opens` y `track_clicks` en `false`;
- usa la ruta `broadcast` solo para anuncios; el slug está sin confirmar;
- respuestas: 202 → aceptado; 409 → incierto, sin reenviar;
- pie con la dirección postal, que ya está publicada en el aviso legal y la exige la política de uso de Lettermint;
- el correo sigue **apagado**.

Archivos de apoyo:
- verificador 31;
- `31_correo_lettermint_guardar.sql`: guarda el token y el remitente en Vault sin que el token quede en los registros de Postgres;
- `activar_correo` exige la 31.

En el flujo «Avisos a registrados (base)», acciones nuevas `ensayo-31`, `verificar-31`, `aplicar-31` y `guardar-correo`. Plantillas de Auth (confirmar y la nueva `recuperar-acceso.html`) con la dirección postal.

**Web y app.**
- «Información básica» y Privacidad nombran a Lettermint.
- Privacidad de la web (apartado 8, proveedores), en condicional.
- Párrafo de Privacidad de la app, oculto mientras el correo esté apagado.

**Revisión independiente.** 4 enfoques, cada hallazgo verificado por otro agente: 18 confirmados y todos corregidos. Lo más importante:
- token en los registros de Postgres;
- dirección postal en las plantillas de Auth;
- prueba de idempotencia dentro de 25 minutos;
- privacidad publicada **antes** de pasar el SMTP de Auth a Lettermint (paso 5.8, con las frases ya escritas).

**Contratos de encargado.** [`docs/legal/encargados/`](../legal/encargados/): PDF fechados de los DPA de Supabase, Cloudflare, Google Firebase, Expo, GitHub y Lettermint (y de Postmark y Resend, descartados), con README y RAT v2.
- Firebase: proyecto `rwadar-14e3d`, condiciones aceptadas el 06/11/2026.
- **Hueco real:** GitHub gratuito no tiene DPA, y sus runners ven datos en claro en las copias de seguridad. Víctor elige: organización con GitHub Team y Customer Agreement, o sacar esos datos de los runners.

**Eric.** Licencia escrita recibida por WhatsApp; Víctor confirma que existe y la conserva (`docs/academy/VISTO-BUENO-ERIC-2026-11-06.md`). No se copia el texto.

**Manual PDF** (`docs/manual/`). La página 9 dice que la cuenta abre la Academy con 9 lecciones. Quita «baja en un clic» y «cuando una plataforma que vigila cambie» (revisión legal 5.13). Las demás páginas quedan idénticas píxel a píxel.

**Dominio.**
- rwadar.com y rwadar.io están aparcados en Afternic por un tercero.
- rwadar.app y rwadar.es parecen libres; no se ha comprado nada.

**Pruebas:**
- avisos: 248 correctas de 248;
- `npm --prefix rwadar-app test` sin fallos;
- app: 489 pruebas, 487 correctas, 2 omitidas y 0 fallos (con la 1.4.2 ya en `main`);
- `npm test` de la raíz sin fallos;
- diccionarios idénticos.

**Pendiente de Víctor**, paso 5 del contrato en orden:
- comprar el dominio;
- cuenta y proyecto en Lettermint y DNS;
- secreto `LETTERMINT_API_TOKEN` en GitHub;
- `aplicar-31` y `guardar-correo`;
- privacidad publicada y SMTP de Auth;
- pedir a Lettermint que quite su enlace de baja de la ruta de difusión;
- prueba real, y solo entonces `activar-correo`.

## 6 de noviembre de 2026 (4) · Claude · APK 1.4.2: Firebase hecho, revisión aplicada, unir y compilar

Firebase y EAS ya están listos. Los dejó la sesión local de Víctor:

- proyecto `rwadar-14e3d` (plan Spark), condiciones aceptadas el 06/11/2026;
- app `com.rwadar.app`;
- variable `GOOGLE_SERVICES_JSON` (archivo, secreta, `production`);
- clave FCM V1 de `firebase-adminsdk-fbsvc@rwadar-14e3d…` asignada a la app.

Detalle en [`APK-1.4.2-NOTIFICACIONES.md`](APK-1.4.2-NOTIFICACIONES.md),
apartado «Al día (06/11/2026, tarde)».

- **Revisión independiente de la rama (3 enfoques, cada hallazgo verificado).**
  Cambios aplicados:
  - icono propio de notificación (`assets/notification-icon.png`);
  - `RECEIVE_BOOT_COMPLETED` vuelve a estar bloqueado, porque no hay
    notificaciones locales programadas;
  - la guía parte la prueba en dos: emulador antes de publicar, Android
    físico antes de encender el push;
  - queda anotado el «latido» de Firebase, para la privacidad antes de
    encender el push.
- **Pruebas:** `npm --prefix rwadar-movil test` da 489, de ellas 487
  correctas, 0 fallos y 2 omitidas. `expo config --type introspect` enseña el
  icono `notification_icon` y `RECEIVE_BOOT_COMPLETED` retirado.
- **Emulador y publicación:** nuevo flujo `android-142.yml` en
  RWAdar-downloads (PR #1 unido). No usa cuentas ni secretos.
- **Pendiente:** unir a `main`, «Compilar app» `editorial`, `android-142.yml`
  sin publicar y después con `publicar=si`, y cambiar la base de OTA el mismo
  día.
- **Para encender el push, más adelante:** privacidad de web y app, revisión
  legal del «latido», OTA con `AVISOS_NOVEDADES_REMOTOS = true` y prueba en un
  **Android físico**. Víctor usa iPhone.

## 6 de noviembre de 2026 (3) · Claude · APK 1.4.2 con notificaciones: rama preparada (sin unir, sin compilar)

Rama `claude/apk-142-notificaciones`, sobre `main`, un solo commit. **Sin push,
sin merge, sin EAS, sin Firebase, sin Supabase.** Estado y pasos que faltan:
[`APK-1.4.2-NOTIFICACIONES.md`](APK-1.4.2-NOTIFICACIONES.md), apartado
«Estado: rama preparada».

- **Cambios:** `rwadar-movil/app.json` (1.4.2, código 24, sin bloquear
  `POST_NOTIFICATIONS`, `c2dm…RECEIVE`, `WAKE_LOCK` ni
  `RECEIVE_BOOT_COMPLETED`, `pushDeliveryEnabled: true`, plugin local),
  `rwadar-movil/app.config.js` (Firebase solo desde la variable de EAS
  `GOOGLE_SERVICES_JSON`; falla en EAS Build sin ella),
  `rwadar-movil/plugins/firebase-sin-autoarranque.js` (las dos `meta-data` de
  Firebase en `false`), `.easignore`, `LEEME.md` y pruebas (`flujo`,
  `actualizaciones-app`, `avisos-ui`, `empaquetado`, y nuevas `app-config` y
  `firebase-sin-autoarranque`).
- **Pruebas:** `npm --prefix rwadar-movil test` (486 + 2 omitidas, 0 fallos),
  `copiar-idiomas-web.cjs --comprobar` y `expo config --type introspect` sin
  red (runtime `1.4.2(24)`, las dos claves en `false`, sin
  `googleServicesFile` sin la variable).
- **Guardián de OTA con la base de la 1.4.1:** rechaza la rama, como debe
  («Requiere revisión nativa y otro APK»). **No unir a `main` hasta el día que
  se compile:** desde ese merge no se puede enviar OTA a la 1.4.1.
- **Sin tocar, a propósito:** `AVISOS_NOVEDADES_REMOTOS = false`, la base por
  defecto de `ota-android.yml` (se cambia el día que se publique el APK) y la
  privacidad de la web (frases de «Al encender el push», antes de encenderlo).
- **Pendiente de Víctor:** Firebase y `google-services.json`, la variable de
  EAS, la credencial FCM V1; después, merge y «Compilar app» desde `main`,
  prueba en móvil real, release `v1.4.2` con `version-android.json` y cambio
  de la base de OTA.

## 6 de noviembre de 2026 (2) · Claude · publicado: Academy con cuenta y 9 lecciones; migración 30 aplicada (avisos apagados); revisión legal

Órdenes de Víctor del 06/11: «Eric da el visto bueno», «La revisión legal hazla
tú», «3 hazlo tú» (aplicar la 30), «Sí, publica hoy», «Publicar las 9 ya» y
tutorial 3D «público en ambos». PR #74.

- **Revisión legal** hecha por Claude, con contraste adversarial:
  [`legal/REVISION-LEGAL-AVISOS-ACADEMY-2026-11-06.md`](../legal/REVISION-LEGAL-AVISOS-ACADEMY-2026-11-06.md).
  Sus cambios obligatorios ya están en el código:
  - permiso `novedades-v2-2026-11-06` con el texto nuevo;
  - información básica junto a la casilla y en Perfil;
  - historial del permiso, bloqueado 3 años tras borrar la cuenta;
  - `rwadar_novedades.baja_por_correo`;
  - pie con el responsable;
  - riesgo delante en el aviso de ofertas;
  - canales Android `cuenta` y `novedades`;
  - condiciones mínimas de la cuenta y `/condiciones` (antes 404).

  Registro de actividades: [`legal/REGISTRO-ACTIVIDADES-TRATAMIENTO.md`](../legal/REGISTRO-ACTIVIDADES-TRATAMIENTO.md).
- **Academy:** las 9 lecciones publicadas; el tutorial 3D, público otra vez.
  Visto bueno de Eric en
  [`academy/VISTO-BUENO-ERIC-2026-11-06.md`](../academy/VISTO-BUENO-ERIC-2026-11-06.md).
- **Base de datos:** flujo nuevo «Avisos a registrados (base)»
  (`.github/workflows/avisos-base.yml`): `ensayo-30`, `aplicar-30`,
  `verificar-30` y las activaciones, con copia previa y la palabra `AVISOS`.
- **Publicado y aplicado (06/11, ~03:00-03:12 UTC):**
  - PR #74 (todo), #75 (diagnóstico), #76 (sello) y #77 (verificador). Las
    cuatro pasaron CI.
  - «Publicar web» en preview y producción. Comprobado en
    https://rwadar.pages.dev con curl y Playwright (390 y 1366 px):
    - las lecciones sin sesión dan 303 a `/acceso?volver=…`;
    - una lección inventada da 404;
    - `/condiciones` da 301;
    - `/baja` da 200;
    - «9 de 9 lecciones disponibles»;
    - el tutorial 3D sigue público;
    - sin errores de JS;
    - el catálogo intacto: 22 ofertas y 25 plataformas.
  - «OTA Android» sobre la base `c1f7106` (1.4.1(23)), correcta.
  - **Migración 30 aplicada en Supabase** con «Avisos a registrados (base)»:
    primero el ensayo y después aplicar, con copia cifrada guardada 35 días.
    El verificador dice «RWAdar 30 OK: casilla del alta inactiva, correo
    apagado, push apagado, aviso automático de ofertas apagado, 0 anuncios
    retenidos, sin reloj de envío, reloj diario de limpieza». Las 9 cuentas
    existentes tienen preferencias con `novedades = false`.
  - **El primer ensayo paró**, y fue lo correcto: Supabase abre a todos los
    roles las colas de pg_net (las concede `supabase_admin`) y `postgres` no
    puede cerrarlas. Vault sí está cerrado.
    - Desde fuera, la API solo publica `public` y `graphql_public`
      (PGRST106 para `net` y `vault`), y pg_graphql está apagado.
    - Ahora el verificador para si Vault se abre y solo avisa de las colas.
    - Antes de encender el correo hay que repetir esa comprobación (contrato,
      paso 5).
- **Pendiente de Víctor:**
  - dominio propio y un proveedor de correo sin píxel (Brevo no lo quita en
    los transaccionales);
  - contratos de encargo en `docs/legal/encargados/`;
  - Firebase y credencial FCM V1 en expo.dev para compilar el APK 1.4.2;
  - licencia escrita de Eric.

## 6 de noviembre de 2026 · Claude · lecciones 8 y 9 de la Academy publicadas en el repositorio (sin publicar la web ni enviar OTA)

Orden de Víctor del 06/11/2026: «Publicar las 9 ya». Rama `lecciones-8-9`,
sobre `claude/avisos-y-academy-registro` (`fe3a9d2`). **Nada publicado, sin
Supabase, sin EAS, sin push.**

- **Academy:** `expediente-de-tokenizacion` (8) y
  `despues-de-emitir-ciclo-de-vida` (9) pasan a `"publicado"` en
  `academy.json` y entran en `PAGINAS_ACADEMY`. Regenerado con
  `node rwadar-academy.js`: sus dos páginas, el índice (9 de 9, ninguna
  «Próximamente»), «Lección N de 9» en todas, la portada («9 de 9 lecciones
  disponibles», «9 lecciones gratis en Academy») y `academy-contenido.js` de la
  app. Siguen en modo `"cuenta"`: `noindex`, fuera del `sitemap.xml` (sin
  cambios) y 303 a `/acceso` sin sesión. Revisión legal del 02/10/2026, válida
  hasta el 02/04/2027 (el generador no avisa).
- **Destinos que no existen:** el Evaluador de Viabilidad y la checklist del
  expediente salen como «Próximamente» en la web y en la app (comprobado y
  fijado en pruebas).
- **Inglés:** el diccionario cambia «7 de 9» por «9 de 9 lecciones
  disponibles» y añade «Preparación · 15 min» y «Post-emisión · 17 min»
  (copiado a la web con `copiar-idiomas-web.cjs`).
- **Pruebas adaptadas** a 9 publicadas y 0 «Próximamente»: `probar-web.mjs`,
  `probar-precarga.cjs`, `rwadar-acceso/academy-cuenta.test.mjs`,
  `rwadar-acceso/comprobar-publicado.test.mjs` y
  `rwadar-movil/tests/academy.test.cjs`. Siguen exigiendo 404 a una lección
  inventada, y el camino «Próximamente» se prueba con una Academy simulada.
  `.github/comprobar-publicado.mjs` no fija lecciones: no cambia.
- **Verificación de producción de la precarga** (`rwadar-precargar-imagenes.js`,
  `verificarHTTP`): sin «Próximamente» ya no pedía ningún 404 de la Academy;
  ahora pide también `/academy/rwadar-comprobacion-leccion-inexistente` y exige
  404 (la misma ruta que usa `comprobar-publicado.mjs`).
- **Pruebas:** `node rwadar-academy.js --comprobar` (9 de 9), `npm run
  test:web` (web 631, páginas 69, precarga 39), `npm run test:acceso` (201),
  `npm --prefix rwadar-movil test` (472 + 2 omitidas), `npm run test:tools`,
  `npm run test:qr` y guardián de OTA de la 1.4.1 con la base `c1f7106`:
  `ok:true`.
- **Se quedan como están, a propósito:** la noticia del 05/10 («Siete
  lecciones gratuitas…», en `noticias.json`, `cambios.html`, `novedades.xml` y
  su traducción), los flujos antiguos de QA de Android
  (`.github/pruebas-android/*`, esperan «de 7 lecciones leídas» del APK de
  entonces) y los informes con fecha.
- **Pendiente:** publicar la web y enviar la OTA, con permiso de Víctor (y lo
  que diga la entrada siguiente sobre unir la Academy con cuenta a `main`). El
  manual corregido de Eric (`docs/manual/`, sin publicar) aún dice «siete
  lecciones publicadas… y dos más en preparación»: cambiarlo exige regenerar el
  PDF con `corregir-manual.py`.

## 5 de noviembre de 2026 (8) · Claude · avisos a registrados y Academy con cuenta (preparado, sin aplicar ni publicar)

Petición de Víctor: «al registrarse, al sacar una nueva actualización o nuevas
ofertas se enviará un correo de aviso y una notificación a la aplicación» y
«que el apartado de Academy se desbloquee solo a los que se han registrado».
Rama `claude/avisos-y-academy-registro` (sin PR). **Nada aplicado en Supabase,
nada publicado, sin EAS.** Plan, decisiones y pasos de activación:
[`AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md`](AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md).

- **Academy con cuenta (web).** El worker (`rwadar-acceso/servidor.mjs`) cierra
  `/academy/<slug>`: sin sesión, 303 a `/acceso?volver=…` (401 si no es HTML),
  lecciones no publicadas 404, fallo de Supabase 503 (nunca manda a entrar),
  con sesión `private, no-store`, `noindex` y `Vary: Cookie`. El índice
  `/academy/` sigue público. Interruptor `"acceso"` en `rwadar-academy/academy.json`.
  El tutorial 3D sigue público en la web (decisión de Víctor del 06/11/2026;
  se quitó la puerta que se le había puesto). En la app ya pedía cuenta para
  todo desde la 1.4.1. Las capturas de Víctor (iPhone) eran de la web
  instalada en la pantalla de inicio.
- **Avisos (todo apagado).** Migración `rwadar-app/db/30_avisos_registrados.sql`
  (esquema `rwadar_novedades`; copia en `supabase/migrations/20261105200000_…`):
  bienvenida al confirmar; avisos de ofertas (disparador del catálogo, nacen
  **retenidos**) y de actualizaciones (flujo manual «Avisar novedad»); correo
  por Brevo y push por Expo con pg_net; baja sin cuenta (`/baja`); lista de
  avisos dentro de la app. El permiso es una casilla aparte, sin marcar, que se
  guarda al confirmar el correo y solo si `casilla_activa`. Interruptores:
  `AVISOS_NOVEDADES_REMOTOS` en `acceso.js`, `rwadar-20260820.js`,
  `servidor.mjs` y `rwadar-movil/lib/modo-local.js`, todos `false`.
- **Alta:** la casilla obligatoria dice ya «Tengo 18 años o más…» (web y app).
- **Push del sistema:** necesita el APK 1.4.2 (permisos y Firebase). Guía:
  [`APK-1.4.2-NOTIFICACIONES.md`](APK-1.4.2-NOTIFICACIONES.md). La rama no toca
  `app.json`: la OTA a la 1.4.1 sigue compatible (guardián `ok:true`).
- **Revisión:** diseño revisado antes de programar (legal, seguridad,
  operaciones); dos revisiones independientes del código, cada hallazgo
  verificado por dos agentes, y corrección de todo lo confirmado. La segunda
  comprobó que la primera ronda de arreglos funcionaba y cazó, entre otros:
  que «apagar» desactivaba la casilla del alta para siempre (ahora hay
  `30_avisos_registrados_apagar_casilla.sql` aparte); que un alta anterior a
  la casilla y confirmada después daba permiso (ahora se exige
  `confirmation_sent_at` ≥ `casilla_activada_el`); que sin envío activo no se
  limpiaba nada (reloj diario `rwadar-novedades-limpieza`), y una carrera
  entre «Borrar datos» y la renovación diaria del móvil. Lo más grave que se cazó: el `_worker.js`
  exportaba un texto y Cloudflare no lo habría desplegado (comprobado con
  workerd: «Incorrect type for map entry … not of type 'function or
  ExportedHandler'»), y el comprobador posterior a publicar habría fallado
  siempre en la vista previa.
- **Pruebas (al cerrar):** `npm test` en verde: web 619, acceso 201, móvil
  472 + 2 omitidas, avisos 175, el resto de la base sin fallos. Guardián de
  OTA de la 1.4.1: `ok:true`. El worker
  compilado arranca en workerd (Miniflare) y da 303/404/200 donde toca.
  Capturas en local con el arnés `rwadar-acceso/probar-worker-local.mjs`.
- **Copias:** `copia-seguridad.sh` añade `rwadar_novedades`. La cartera
  (`rwadar_cuentas_privadas`) sigue fuera a propósito: lleva FORCE RLS y, si
  `postgres` no puede saltarla, fallaría la copia entera, también la previa de
  «Aplicar catálogo». Incluirla es otro cambio, a probar antes con una copia manual.
- **Ojo al unir a `main`:** el siguiente «Publicar web» del ciclo del catálogo
  publicaría el cierre de la Academy. Antes, visto bueno escrito de Eric (su
  especificación decía «sin cuentas») y permiso de Víctor, o poner
  `"acceso": "publico"` (ver `rwadar-academy/LEEME.md`: hay textos que
  revertir a mano).
- **Pendiente de Víctor, cada paso con su permiso:** revisión legal (casilla,
  privacidad y avisos de ofertas); aplicar la 30 en el SQL Editor con copia
  previa (nunca `db push`); plantilla de Auth y `activar_casilla`; encender los
  interruptores y publicar web y OTA; dominio propio y Brevo para el correo;
  Firebase y APK 1.4.2 para el push; decidir si se publican las lecciones 8 y 9.

## 5 de noviembre de 2026 (7) · Claude · entrega 2026-11-05.2 y remates publicados: Supabase, web y app

Orden de Víctor: «Arregla todo, no dejes nada para mañana»; retiradas decididas
por él: «Retirar las dos hoy».

- **PRs unidas:** #70 (remates: transparencia 48/48 al 05/11, Hausera en
  Orihuela Costa, datos personales recortados en copias antiguas), #71 (entrega
  2026-11-05.2) y #72 (sincronización y sello).
- **Supabase:** «Aplicar catálogo» con `2026-11-05.2` (run 42082712442), tras
  releer como visitante la `cede1f27` a las 18:16 UTC. En línea, `88d5a757`:
  25 plataformas, **22 ofertas (8/13/1)**, sin BILLA ni Casa de Outeiro, Pax Gold
  con https://www.paxg.com/ y el acceso de Spiko con lo que muestra la CNMV.
- **Web:** «Publicar web» en preview (run 42083927291) y producción (run
  42084230282). Comprobado con curl en https://rwadar.pages.dev: revisión
  `88d5a757`, `/ofertas/casa-de-outeiro` y `/ofertas/terreno-con-arrendamiento-billa`
  dan 404, Pax Gold enlaza a paxg.com, Spiko cita a Aldana Capital y Hausera dice
  «Orihuela Costa · Alicante».
- **App:** OTA Android (run 42083933359), correcta, base c1f7106 (1.4.1(23)).
- **Pruebas:** `npm test` en verde tras sincronizar (web 601, móvil 410 + 2
  omitidas, acceso 146, base de datos sin fallos).
- **Pendiente (solo Víctor):** borrar en GitHub la rama `claude/catalogo-2026-11-05`.
  Lleva copias sin recortar con nombres de personas, no se unió a `main` y la
  herramienta no puede borrar ramas. Los nombres siguen en el historial de
  `main` de ciclos anteriores; borrarlos de ahí exigiría reescribir la historia
  y Víctor tendría que pedirlo expresamente.

## 5 de noviembre de 2026 (6) · Claude · entrega 2026-11-05.2 revisada; registro de Casa de Outeiro corregido

Misma orden de Víctor: «Arregla todo, no dejes nada para mañana». Rama
`claude/catalogo-2026-11-05-2`.

- **Revisión independiente** del SQL y de la entrega:
  [`REVISION-ENTREGA.md`](../../rwadar-app/data/verificaciones/2026-11-05.2-v2/REVISION-ENTREGA.md).
  Veredicto: aprobado con cambios. El SQL se puede aplicar tal cual.
- **El cambio obligatorio, hecho.** Era solo de documentación, en la retirada
  de Casa de Outeiro.
  - En la plataforma hay dos documentos del 30/10 que citan el 31/03/2027: la
    ficha de datos (263) y los anexos (264). El registro decía que nada más que
    la ficha lo confirmaba. Ahora lo dice bien: la campaña no lo recoge.
  - El 264 entra entre las fuentes.
  - Texto de la retirada: «sin ampliación registrada en la campaña».
  - El SQL no cambia: su SHA sigue siendo `24073c9f…ba19`, y la revisión,
    `88d5a757`.
- **Pruebas repetidas:** `preparar-entrega.mjs` dos veces (solo cambia el
  contraste); PGlite correcto; ensayo «después de aplicar» en una copia aparte,
  con `npm test` en verde, el 404 del worker para las dos fichas y la OTA
  compatible. El detalle está al final de `REVISION-ENTREGA.md`.
- **Commits:** el de la corrección y el de la revisión con este traspaso.
- **Pendiente:**
  - PR y merge; «Aplicar catálogo» `2026-11-05.2` antes del 12/11 incluido;
    después, `despues-de-aplicar.mjs` y la secuencia del informe (§5); publicar
    la web y enviar la OTA.
  - Para otra entrega:
    - el aval de Pax Gold dice NYDFS, y su web dice OCC;
    - la comprobación de la CNMV de Spiko no mira a Aldana Capital;
    - una nota interna del escaparate aún dice «sin prórroga publicada».

## 5 de noviembre de 2026 (5) · Claude · entrega 2026-11-05.2 preparada (sin aplicar ni publicar)

Orden de Víctor: «Arregla todo, no dejes nada para mañana». Sobre BILLA y Casa
de Outeiro, preguntado hacia las 17:10 UTC: «Retirar las dos hoy». Rama
`claude/catalogo-2026-11-05-2`. Informe en llano:
[`INFORME-ENTREGA.md`](../../rwadar-app/data/verificaciones/2026-11-05.2-v2/INFORME-ENTREGA.md).

- **Qué cambia** (revisión `88d5a757`, sobre la publicada `cede1f27`):
  - salen BILLA y Casa de Outeiro; quedan 22 ofertas (8/13/1);
  - la web de Pax Gold en `public.plataformas` pasa a `https://www.paxg.com/`;
  - el acceso de Spiko dice lo que muestra la CNMV, con dos fuentes nuevas de
    la CNMV.
  - Todo lo demás, igual. SHA del aplicador: `24073c9f…ba19`. Hay que aplicarla
    antes del 12/11 incluido.
- **Commits:** `205cead` (la entrega) y el de ensayo, informe y traspaso.
- **Pruebas:**
  - PGlite: 22 pruebas, de ellas 12 de funcionamiento y 10 casos de fallo que
    no dejan nada a medias;
  - `npm test` en verde antes de aplicar y en el ensayo «después de aplicar»
    (copia aparte);
  - worker: 404 para las dos fichas;
  - OTA compatible;
  - gitleaks sin hallazgos.
- **Fuera del encargo:**
  - una segunda fuente de la CNMV (Spiko Finance, n.º 5325), para que ese dato
    tenga la suya;
  - la ficha editorial de las dos sale ya, como con mF-ONE;
  - una prueba de la app ya no exige 24 ofertas fijas.
- **Pendiente:**
  - revisión independiente del SQL; PR y merge; «Aplicar catálogo» `2026-11-05.2`;
  - después, `despues-de-aplicar.mjs` y la secuencia del informe (§5);
  - publicar la web y enviar la OTA (cambian la transparencia y las
    ilustraciones de la app).
  - Para otro día: el «aval» de Pax Gold aún dice NYDFS, y su web dice OCC.

## 5 de noviembre de 2026 (6) · Claude · datos personales: segunda pasada pedida por la revisión independiente (sin publicar)

Misma orden de Víctor («Arregla todo, no dejes nada para mañana») y misma rama
`claude/remates-1105`. El revisor independiente de los remates encontró datos
personales que la primera pasada (`a5b6934`) no había recortado. **Sin tocar
Supabase, sin publicar la web y sin OTA.** Commit `ef893e6`.

- **IOD Occasio (Alius), copias del 01/11** (`2026-11-01-v2/grupos/alius-hausera/fuentes/iod-*.txt`):
  el FDF y la escritura de emisión llevaban los nombres de dos socios personas
  físicas (uno es también el administrador único), de la administradora de
  Alius Capital y de cuatro notarios; la escritura, además, la dirección y el
  estado civil de una persona física y el domicilio «a estos efectos» del
  administrador (calle, portal y piso, el mismo que el domicilio social).
  Ahora dicen «[nombre recortado]» y «[domicilio recortado]», sin estado civil
  (se deja el municipio). La primera línea de cada copia dice qué se recortó.
  En `inventario-consultas.json` el sha256 es el del PDF original: solo
  cambia la nota, que antes decía «datos personales omitidos» cuando solo
  faltaban los DNI y el correo.
- **Copia de exa de IOD del 23/10** (`docs/investigacion/2026-10-23/primaria/iod-aktionariat-documentos-exa.md`):
  los mismos nombres, el correo personal del administrador y los dos
  firmantes del contrato de Aktionariat que copia, recortados. En
  `huellas-capturas.json`, sha256 y bytes de la copia recortada;
  `sha256Captura` guarda la huella anotada al capturar (46347 bytes, la que
  cita `REVISION-IOD-OUTEIRO-SPIKO.md`, que no se toca). La nota explica que la
  copia que había en Git ya no cuadraba con ella (46346 bytes).
- **Hausera ETI, copias del 05/11** (folleto base y condiciones finales, en
  `grupos/candidatas-espana/fuentes/hausera-eti/` y en
  `revision-independiente/fuentes/candidatas-espana/hausera/`, idénticas dos a
  dos): recortado entero el registro de firma electrónica del final del
  folleto (nombre, correo, IP, ID de sesión y navegador de los dos firmantes),
  el dato familiar de un consejero y, de las dos opciones que dio el revisor,
  **también los nombres de consejeros y titulares reales** (folleto y
  condiciones finales, en inglés, castellano y alemán). Las funciones se
  mantienen («[nombre recortado] is a director and an owner of…»), así que el
  conflicto de intereses se sigue leyendo. En los dos inventarios,
  `sha256`/`bytes` siguen siendo los del PDF original (si se cambiaran,
  dejarían de describir el PDF de la URL); se añaden `sha256Texto`/`bytesTexto`
  (copia recortada) y `sha256TextoCaptura` (copia anterior), y en el de la
  revisión independiente, `textoExtraido`.
- **Aviso de la FMA de 2006** con el nombre de una persona física, que salió
  en el barrido: recortado en la copia de
  `2026-11-03.3-v2/grupos/brickwise-alius-hausera/` (nota en el inventario,
  cuyo sha256 es el del HTML) y en la de Brickwise del 05/11 (sha256 y bytes
  al día, `sha256Captura` con el anterior).
- **Comprobaciones después de recortar:**
  - todos los nombres recortados hoy (los de esta pasada y los de
    `a5b6934`), los correos, las dos IP y los dos ID de sesión: 0
    coincidencias en todos los archivos de Git y en los 6 `.gz`;
  - barrido de las 162 copias de Alius, Casa de Outeiro, IOD y Hausera
    (texto y `.gz`) en busca de correos, IP, rastros de sesión y tratamientos
    («Sr.», «Mr.»…) seguidos de un nombre: solo quedan correos de empresa
    (reclamaciones, protección de datos, contacto) y el de ejemplo
    `tu@email.com`; ninguna IP y ningún rastro de sesión;
  - los 6 JSON tocados son válidos y las 6 huellas nuevas cuadran con sus
    archivos;
  - gitleaks 8.30.1 sobre los 15 archivos cambiados: sin hallazgos;
  - `npm test` en verde (web 601, móvil 410 + 2 omitidas, acceso 146, base
    de datos sin fallos); guardián de la OTA contra `c1f7106`: correcto (1.4.1(23)).
- **Pendiente:**
  - lo del traspaso anterior sigue igual: unir la rama a `main` y, con permiso
    de Víctor, publicar la web y enviar la OTA; borrar la rama
    `claude/catalogo-2026-11-05` de origin, que conserva los nombres; las
    copias crudas de la carpeta local (fuera de Git) tampoco están
    recortadas;
  - fuera de estas cuatro plataformas siguen, como hasta ahora en `main`, los
    nombres de consejeros de otros folletos regulados (Backed, Spiko,
    Franklin Templeton), los firmantes en las demás copias de Aktionariat y
    algunos nombres de directivos en las lecturas del radar del 02/11. Si
    Víctor quiere el mismo criterio que en Hausera, hace falta otra pasada.

## 5 de noviembre de 2026 (5) · Claude · remates del día: transparencia, lugar de Hausera y datos personales (sin publicar)

Orden de Víctor: «Arregla todo, no dejes nada para mañana». Rama
`claude/remates-1105` (desde `main`), con push y sin PR. **Sin tocar Supabase,
sin publicar la web y sin OTA.** No toca Billa ni Casa de Outeiro en el
catálogo (se retiran en la entrega `2026-11-05.2`, en otra rama).

- **Transparencia** (commit `8633019`): las cuatro comprobaciones que seguían
  con fecha 03/11 se han vuelto a leer hoy y dicen lo mismo: condiciones
  finales n.º 159 de Backed (Kraken; mismo SHA-256 que el 03/11, solo
  Liechtenstein y Suiza), KID en español de Robinhood (01/07/2026, enlazado
  desde `robinhood.com/eu/es/` y su página legal), BaFin (para «Midas» solo
  la sociedad danesa; para «Midas Software», sin resultados) y aviso legal del
  portal de Boss Info («not subject to prudential supervision»). Solo cambia
  `consultadaEl` a 2026-11-05. Copias de texto y SHA-256 en
  `rwadar-app/data/verificaciones/2026-11-05-v2/remates/inventario-remates.json`
  (los PDF y HTML originales, fuera de Git). Regenerados el bloque de la web,
  `lib/transparencia-contenido.js` y las fichas.
- **Hausera** (commit `42f0f65`): el lugar de la ilustración pasa de
  «Alicante · España» a «Orihuela Costa · Alicante» (Alicante 2 son 14
  viviendas en La Zenia), como «Ribeira Sacra · Lugo». El texto alternativo
  dice «en la costa de Orihuela (Alicante)». La foto sirve igual (edificio
  mediterráneo blanco con balcones y palmeras, sin nada propio de la ciudad);
  su `prompt` no cambia porque es el que la generó. `generar.mjs`: las 24 webp
  salen idénticas; cambian el manifiesto de la app, el bloque de la web y la
  ficha publicada, y `npm test` reescribe la tarjeta pre-renderizada de
  `rwadar-site/index.html` (commit `d53bf50`). `generar.mjs --comprobar` en verde.
- **Datos personales** (commit `a5b6934`): los nombres recortados hoy en
  `2026-11-05-v2` seguían en copias de `2026-11-01-v2` y `2026-11-03.3-v2`, y
  también en `docs/investigacion/2026-10-23` (incluida la portada de Hausera
  en `.html.gz`). Ahora dicen «[nombre recortado]». En esas copias también se
  recortaron un correo y un teléfono personales y dos NIF que quedaban en el
  texto del FDF de la revisión del 01/11. Inventarios al día (`sha256` de la
  copia recortada y `sha256Captura` con el anterior). El informe con fecha
  `REVISION-IOD-OUTEIRO-SPIKO.md` no se toca.
- **Pruebas:** `npm test` en verde (web 601, móvil 410 + 2 omitidas, acceso
  146, base de datos sin fallos). Guardián de la OTA contra `c1f7106`: correcto
  (1.4.1(23)). gitleaks 8.30.1 sobre los 43 archivos cambiados: sin hallazgos.
- **Pendiente:**
  - unir la rama a `main` y, con permiso de Víctor, publicar la web y enviar
    la OTA: hasta entonces, la web y la app siguen enseñando «Alicante · España»
    y las fechas del 03/11;
  - la entrega `2026-11-05.2` también toca `fichas.json`, `fotos.json` y lo
    generado (manifiesto, bloque de la web): al unir las dos ramas, si chocan
    los archivos generados, volver a ejecutar `generar.mjs`,
    `transparencia.mjs` y `node rwadar-fichas.js` en vez de resolverlos a mano;
  - las copias crudas de la carpeta local (fuera de Git) y la rama
    `claude/catalogo-2026-11-05` de origin siguen con los nombres sin recortar:
    borrar esa rama (no se unió);
  - quedan del traspaso anterior: web de PAX Gold en `public.plataformas` y
    texto de acceso de Spiko en el radar.

## 5 de noviembre de 2026 (4) · Claude · investigación del día publicada: Supabase, web y app

Orden de Víctor: «Hazme la investigación de hoy de las ofertas, y actualiza la
web y la app». Informe: [`INVESTIGACION-CATALOGO-2026-11-05.md`](../INVESTIGACION-CATALOGO-2026-11-05.md).

- **Investigación:** 7 grupos con revisor independiente cada uno. Entrega
  `2026-11-05`, revisión `cede1f27`. SQL revisado por un agente independiente,
  con sus correcciones; el SQL corregido lo volvió a comprobar el coordinador.
  Sin altas ni retiradas.
- **PRs:** #66 (catálogo, rama limpia de un commit), #67 (tarjetas sencillas en
  web y app) y #68 (sincronización y sello). Las tres, unidas a `main`.
- **Supabase:** «Aplicar catálogo» run 42050045063. En línea, `cede1f27` con
  25/24 (8/13/3), vigente hasta el 12/11.
- **OTA Android:** run 42052119704, correcto (base c1f7106, 1.4.1(23)).
- **Web:** «Publicar web» en preview (run 42052080652, 220/0) y en producción
  (run 42069278129). Comprobado con curl en `https://rwadar.pages.dev`:
  catálogo `cede1f27`, Spiko 2,39 % y 3,99 %, «66,67 € la participación en
  reventa (05/11)» y tarjetas sencillas. Captura del móvil hecha.
- **Pruebas:** `npm test` en verde (web 601, móvil 410 + 2 omitidas, acceso
  146, base de datos sin fallos). La prueba de la tarjeta de la app sigue ahora
  al catálogo publicado.
- **Nuevo:** skill `investigacion-catalogo` y flujo guardado
  `investigacion-catalogo` en `.claude/`. `.gitignore` admite solo `skills/` y
  `workflows/`. Con «haz la investigación» se hace el ciclo entero ese día.
- **Pendiente:**
  - web de PAX Gold en `public.plataformas` (paxg.com);
  - texto de acceso de Spiko en el radar;
  - ilustración de Hausera (Orihuela Costa);
  - nombres de personas en copias de `2026-11-01-v2` y `2026-11-03.3-v2`;
  - la rama `claude/catalogo-2026-11-05` de origin lleva esas copias sin
    recortar: borrarla (no se unió).

## 5 de noviembre de 2026 (3) · Claude · correcciones de la revisión de las tarjetas sencillas (sin publicar)

Misma rama local `claude/tarjetas-simples` (worktree `tarjetas-simples`), un
commit encima de los dos de abajo. **Sin push, sin OTA, sin EAS y sin tocar
Supabase.** Un revisor independiente pidió dos correcciones y propuso varias
mejoras. Están todas hechas salvo las dos que no hacían falta.

**Correcciones obligatorias (web, en inglés):**
- **El lugar de la tarjeta de Ofertas** salía en castellano en las 24 ofertas
  («Estados Unidos», «Limasol · Chipre»), mientras «Recién añadidas» y la app
  ya decían «United States» y «Limasol · Cyprus». Ahora la tarjeta pinta el
  lugar con `lugarTarjetaHtml`: la ciudad es un dato y no se traduce; el país,
  sí. En `idioma-web`, `originales` protege solo la ciudad
  (`#emiLista .emi-lugar [lang="es"]`).
- **El aviso crítico** empezaba por «Importante» también en inglés. Ahora dice
  «Important · …» y el texto del aviso, que viene del catálogo, sigue en
  castellano (`<span lang="es" translate="no">`, y `originales` protege solo
  ese texto). Igual en «Recién añadidas».

**Mejoras propuestas por el revisor, aplicadas:**
- **Escritorio y tableta**: ya no queda un hueco bajo los títulos cortos. Las
  tarjetas de una fila miden lo mismo y la línea «Mínimo · España» va al pie,
  alineada en toda la fila (medido a 820 y 1366 px).
- **«Patrocinada»** va en gris neutro, como en la app. El verde queda para
  «Nueva» y la acción principal.
- **«No disponible en España»** va en rojo en la web, como en la app.
- **España dice «No»** (web y app) cuando la oferta no se contrata desde
  España. Antes podía decir a la vez «España Sin confirmar» y «No disponible
  en España». Hoy no pasa con datos reales.
- **Teclado**: al cerrar la ficha con Escape o con ×, el foco vuelve a la
  tarjeta. Antes acababa en `<body>`, porque al volver atrás en el historial
  Chrome aplica otra vez el `#emisiones`. Si la persona ya ha movido el foco,
  no se lo quita.
- El texto del aviso crítico ya no sale atenuado. Quité la regla antigua que
  apagaba el «N más en la ficha», que ya no existe.
- Corregida la nota de la entrada «(2)» sobre Spiko Euro: ese fallo no existe.

**No hacía falta tocar:** con el catálogo caducado, a 390 px «Mínimo No
verificado · España Sin confirmar» ocupa dos líneas y se lee bien. Los mínimos
de Reventa llevan su fecha dentro del valor (sale de `minimoCorto`, como
antes).

**Pruebas:**
- `npm test` completo en verde:
  - web: 601/0, más 71 de páginas y 32 de precarga;
  - móvil: 412 pruebas, 410 correctas, 0 fallidas y 2 omitidas;
  - acceso: 146/0;
  - db: 11/11 y 30 comprobaciones SQL;
  - tools en verde, con «Motor y diccionario ES/EN web/móvil idénticos».
- `comprobar-ota-compatible.cjs --base c1f7106…`: `ok: true`.
- Pruebas nuevas en `rwadar-app/probar-web-tarjeta.mjs`, que se llaman desde
  `probar-web.mjs`. Ejecutan el traductor real de la web (`idioma-en`, `idioma`
  e `idioma-web`) sobre el HTML real de las 24 tarjetas, en un DOM mínimo, y
  leen lo que sale. Comprueban que:
  - el país va en inglés y la ciudad tal cual;
  - el aviso crítico dice «Important ·» y su texto sigue en castellano, en
    Ofertas y en «Recién añadidas»;
  - el botón de cada tarjeta se llama «View details for <título> from
    <plataforma>».

  Además, el foco al cerrar la ficha, el gris de «Patrocinada», el rojo de «No
  disponible en España», la línea de datos al pie y el «No» de España en la
  web y en la app.
- Comprobación de las pruebas: provoqué 10 fallos a propósito y las pruebas
  pillaron los 10 (2 del lugar, 4 del aviso, 2 de España y 2 del foco).
- Capturas (Chromium, modo oscuro) en el scratchpad, `tarjetas-simples/final-*.png`:
  390×844 ES/EN, 1366×860 ES/EN, 360 y 820, y un ensayo con «Patrocinada»,
  «No disponible en España» y un aviso crítico. Sin errores de página ni
  desborde horizontal.

**Queda pendiente:**
- Probar la app en un Android de verdad: las capturas de la app de la entrada
  «(2)» se hicieron con react-native-web.
- Publicar la web y enviar la OTA necesitan el permiso de Víctor.
- `probar-web.mjs` sigue por encima del aviso 5S (243 KB; ya lo estaba). Las
  pruebas nuevas van en su propio archivo.

---

## 5 de noviembre de 2026 (2) · Claude · la misma tarjeta sencilla en la app Android (sin publicar)

Misma rama local `claude/tarjetas-simples` (worktree `tarjetas-simples`), un
commit encima del de la web. **Sin push, sin OTA, sin EAS y sin tocar
Supabase.** Completa lo que la entrada de abajo dejaba pendiente para la app.

- **La fila de Ofertas** (`FichaOferta`, `componentes/Ofertas.js`) sigue el
  mismo criterio que la web:
  - la miniatura (80 px);
  - «Patrocinada» y «Nueva», si lo son;
  - el título, en dos líneas como mucho;
  - proveedor · lugar;
  - una línea con el mínimo y el acceso desde España, por ejemplo «Mínimo 1 € ·
    España Sí»;
  - un «›» discreto.

  Solo si existen, por seguridad, enseña también un problema de la revisión
  («Cifras por actualizar», «Apertura no confirmada» o «Fuentes en
  conflicto»), «No disponible en España» y el aviso crítico entero. Ya no
  lleva el «· N más en la ficha».
- **Sale de la fila y sigue en la ficha**: los puntos fuertes, «Cifras válidas
  N días más», «Liquidez/Apertura no confirmada», la salida, «Revisa · N avisos
  en la ficha», el aviso ordinario, la fecha y «Ver ficha →». La ficha no
  cambia.
- **Accesibilidad**: toda la fila es un único botón, sin botones dentro.
  - Su nombre empieza por «Ver ficha de <título> en <plataforma>». En inglés
    es «View details for <título> from <plataforma>».
  - El nombre se compone en el componente, porque el patrón del diccionario
    corta mal los títulos que llevan «en».
  - Después dice solo lo que se ve. Ya no lee la fecha, los puntos fuertes ni
    los avisos ordinarios.
  - El «›» no se lee.
  - En la app, «Guardar» sigue en la cabecera de la ficha. La fila no lo
    tenía y no se ha añadido.
- **España en corto**: `textoEspanaOferta(resumen, corto)` y
  `datosTarjetaOferta` en `lib/transparencia.js`. Son la misma función que usa
  la ficha («Sí, según la fuente»), así que no hay cifras nuevas. Con el
  catálogo caducado (probado con el real al 12/11), las 24 fichas dicen
  «Mínimo No verificado · España Sin confirmar».
- **Encima de la lista**: una sola línea, «No es una recomendación de
  inversión · RWAdar no recibe dinero de las inversiones.». La cabecera de la
  Selección ya no repite la frase.
- **«Recién añadidas»** (`RecienAnadidas.js`): sin «Revisa · N avisos en la
  ficha» ni «N más en la ficha». Solo queda el aviso crítico, si lo hay.
- **Perfil**: no cambia, porque ya usa una fila corta propia.
- **Inglés**: no hay textos nuevos. Basta con los dos que añadió la web en
  `lib/idioma-en.js`.
- **Medidas** (react-native-web en Chrome, 412 px de ancho):

  | | Antes | Después |
  |---|---|---|
  | 3 primeras tarjetas, castellano | 575 px | 367 px (−36 %) |
  | 3 primeras tarjetas, inglés | 695 px | 367 px (−47 %) |
  | 8 principales, castellano | 1596 px | 999 px |
  | 8 principales, inglés | 1776 px | 981 px |

  Sin desborde a 360 px.
- **Contraste**: todo pasa AA. El texto suave da 6,1:1, el ámbar 11,2:1 y el
  aviso crítico 7,7:1.

**Pruebas:**
- `npm test` completo en verde:
  - web: 595/0, 71 de páginas y 32 de precarga;
  - móvil: 412 pruebas, 410 correctas, 0 fallidas y 2 omitidas;
  - tools en verde, con «Motor y diccionario ES/EN web/móvil idénticos»;
  - acceso: 146/0;
  - db y qr: sin fallos.
- `comprobar-ota-compatible.cjs --base c1f7106…`: `ok: true`, sin cambios
  nativos ni dependencias.
- Prueba nueva: recorre las 24 ofertas reales por `adaptarCatalogoV2`. Comprueba
  que:
  - la fila lleva solo Mínimo y España, y que coinciden con «Lo esencial» de la
    ficha;
  - no aparecen la salida, la vigencia, las fechas, los puntos fuertes ni los
    avisos ordinarios;
  - la ficha conserva todo eso.
- Comprobación de las pruebas: provoqué 7 fallos a propósito y las pruebas
  pillaron los 7. Fueron estos:
  - la salida vuelve a la fila;
  - la ficha pierde la salida;
  - desaparece el aviso crítico;
  - vuelve el aviso ordinario;
  - la fila dice España en largo;
  - se anida un botón;
  - desaparece el problema de la revisión.

**Queda pendiente:**
- ~~Web, accesibilidad en inglés: el nombre del botón de Spiko Euro se parte
  por su primer «en».~~ **No pasa** (corregido en la revisión de abajo, entrada
  «(3)»): antes de aplicar el patrón, `idioma-web` cambia el título y la
  plataforma por marcadores, así que en el navegador se lee entero: «View
  details for Spiko Euro (Smart Cash): fondo en euros ligado al €STR from
  Spiko». Una prueba nueva lo comprueba en las 24 ofertas.
- **Probarlo en un Android de verdad**: las capturas se hicieron con
  react-native-web, no en el dispositivo.
- **Publicar** la web y enviar la OTA necesitan el permiso de Víctor.

---

## 5 de noviembre de 2026 · Claude · tarjetas de Ofertas más sencillas en la web (sin publicar)

Rama local `claude/tarjetas-simples` (worktree `tarjetas-simples`, sale de
`main` 5a97fd2), un commit con esta entrada. **Sin push ni publicación, sin
tocar Supabase, sin OTA ni EAS.**

Encargo de Víctor, con una captura de Ofertas en el iPhone: «veo demasiada
información así de primeras, me marea; hazlo simple y fácil de leer; el que
quiera más detalle ya entrará en la tarjeta».

- **La tarjeta de la lista** (web en móvil y escritorio; una sola función,
  `tarjetaOfertaLocal`) enseña ahora:
  - la imagen con «Guardar»;
  - «Nueva» y «Patrocinada», si lo son;
  - el título, con dos líneas como mucho (entero en `title` y en el nombre del
    botón);
  - proveedor · lugar;
  - una línea con el mínimo y el acceso desde España: «Mínimo 1 € · España Sí».

  Solo si existen, por seguridad, enseña también el aviso crítico entero, un
  problema de la revisión (cifras por actualizar, apertura no confirmada en
  las principales o fuentes en conflicto) y «No disponible en España».

  Toda la tarjeta abre la ficha con un único botón «›», cuyo nombre accesible
  es «Ver ficha de <título> en <plataforma>». «Guardar» va aparte y no hay
  botones anidados. El foco marca la tarjeta entera.
- **Sale de la lista y sigue en la ficha**: los puntos fuertes, «cifras
  válidas N días más», «Liquidez/Apertura no confirmada», la salida, los
  avisos ordinarios y su recuento, la fecha de revisión y «Dato del …». Se
  comprobó oferta por oferta (24 de 24), en el navegador y en una prueba nueva.
- **España en corto**: `textoEspanaOferta(resumen, true)` devuelve «Sí», «No»
  o «Sin confirmar». La ficha sigue diciendo «Sí, según la fuente». No hay
  cifras nuevas: con el catálogo caducado manda `resumenOferta` y la tarjeta
  dice «Mínimo No verificado · España Sin confirmar» y «Cifras por actualizar».
- **Encima de la lista** (móvil), una sola línea pequeña: «No es una
  recomendación de inversión · RWAdar no recibe dinero de las inversiones.».
  La cabecera de la Selección ya no repite la frase.
- **«Recién añadidas» de Inicio** sigue el mismo criterio: quita «Revisa · N
  avisos en la ficha» y el «· N más en la ficha» del aviso crítico. Perfil no
  cambia: ya es una fila corta propia.
- **Inglés**: «Sí» → «Yes» y la línea de encima de la lista. Van en
  `rwadar-movil/lib/idioma-en.js` y en su copia web.
- **Normas**: el párrafo de las tarjetas de `CICLO-DIARIO-CATALOGO.md` dice
  ahora que la ficha lleva los tres datos y la lista, dos.
- **Medidas** (alto de las 3 primeras tarjetas): 390 px en castellano,
  469 → 359; 390 px en inglés, 621 → 359; 1366 px, 2228 → 1199. Sin errores
  de página. Sin desborde horizontal a 360 y 820 px.

**Pruebas:** `npm run test:web` 595 correctas y 0 fallidas, más 71 de páginas
y 32 de precarga. `npm run test:mobile`: 409 correctas, 0 fallidas y 2
omitidas. `npm run test:tools` en verde, con `copiar-idiomas-web.cjs
--comprobar`. Las pruebas de tarjeta comprueban qué se ve y qué no: con
mutaciones (la Salida vuelve a la tarjeta, la ficha pierde la Salida o
desaparece el aviso crítico), las pruebas fallan.

**Toqué `rwadar-movil` solo en dos sitios:**
- el diccionario, que se comparte con la web;
- tres aserciones de `tests/ofertas-vigencia.test.cjs` que comprueban la
  tarjeta **web** («cifras válidas hasta hoy» y «Fuente revisada el» pasan a
  comprobarse en la ficha).

**Queda pendiente:**
- **App Android** (otro agente): la misma tarjeta en la lista de Ofertas y en
  «Recién añadidas» (`RecienAnadidas.js`). Las pruebas de la app que esperan
  «Ver ficha →» y la Salida en la tarjeta (`ofertas-presentacion`,
  `navegacion`) siguen como estaban.
- Los títulos largos se cortan a dos líneas con «…». En escritorio, el título
  reserva dos líneas para que la línea de datos quede alineada en la fila.
- `probar-web.mjs` sigue por encima del aviso 5S (241 KB; ya lo estaba).
- Publicar la web necesita el permiso de Víctor.

---

## 4 de noviembre de 2026 (noche, 6) · Claude · publicadas la tercera y la cuarta subida: todo el barrido de calidad en producción

Cierra lo que quedaba pendiente en la entrada «(noche, 4)».

- **Tercera subida** (PR #59, merge `27d0cff`; sello `c65b0f4`): corrección de
  la revisión de `claude/qa-escritorio`. `idioma-previo` solo oculta en
  escritorio, con el tope contado desde la navegación y sin tocar `lang`; así
  desaparece la pantalla en blanco de 2–3 s en inglés en móviles lentos. También
  incluye la barra de filtros al filtrar, «No aplica» en el comparador y los
  botones de /acceso. Publicar web: runs 41913445850 (preview) y 41913969673
  (producción).
- **Cuarta subida** (PR #60, merge `6abdf94`; sello `9d06bca`): `claude/remates-3`,
  revisada y corregida.
  - Inicio sin salto al cargar: `escritorio-relato` y `movil-relato` desde
    `<head>`, el panel ya en su sitio en el HTML, Geist precargada y
    «Recién añadidas» visible desde el principio.
  - Inicio como historia también en tableta.
  - Sin la marca «Original source text» en la leyenda del radar.
  - «Qué se adquiere» una sola vez.

  Publicar web: runs 41926176848 (preview) y 41926601445 (producción). La app
  no cambia, así que no hubo OTA.
- **CLS medido en la web de prueba** (Playwright a través de curl, 3,5 s tras
  cargar): 1024 ES 0,874 → 0; 1366 EN 0,887 → 0,027; 820 ES/EN 0; 390 ES/EN 0.
  Sin «NaN», sin claves internas y sin aviso al cargar.

**Queda anotado** (no bloquea):
- Con el catálogo caducado, «Recién añadidas» nace visible y se oculta, lo que
  da un salto pequeño.
- Kraken xStocks y Spiko Smart Cash Euro conservan «Qué se adquiere» en el
  párrafo, porque su texto es distinto y más completo.
- La web hace una consulta 401 de sesión por carga: necesita tocar el worker de
  acceso.
- mTBILL necesita otra fuente de acceso desde España.
- Toucan: sin confirmar el estado de hoy.
- ARTEX no usa blockchain: decisión editorial de Víctor.
- /para-empresas sigue en noindex: decisión de Víctor.

## 4 de noviembre de 2026 (noche, 4) · Claude · remates 3: Inicio sin salto, tableta, leyenda en inglés y «Qué se adquiere» (sin publicar)

Rama local `claude/remates-3` (worktree `remates-3`, sale de `main` 857ef73,
que es lo publicado), commits 09fe24f, a43cd81 y 43c00e7, y tras la
revisión 663b309 y 484f977. **Sin push, nada publicado, Supabase sin tocar,
sin OTA ni EAS.** Sin textos nuevos.

- **Corrección tras la revisión (663b309 y 484f977):**
  - **Se une limpio con `claude/subida-3`.** Antes chocaba justo en
    `idioma-previo`. Ahora el bloque que marca `escritorio-relato` va aparte,
    al final del archivo, y el bloque del idioma queda como en `main`: los
    `return` que añade subida-3 no lo cortan. La prueba nueva se movió lejos
    de las de subida-3. `git merge-tree claude/subida-3 claude/remates-3`:
    solo choca este `PARA-CODEX.md` (dos entradas arriba; se quedan las dos).
    En una copia unida: web 593/0 y CLS 0 en castellano e inglés a 1024×768,
    1366×860, 820, 768, 390 y 360 (1920: 0,0015 en castellano); con el JS
    retrasado 1,5 s, inglés a 1024 y 1366: 0,007 y 0,018 (`main`: 0,84 y 0,85).
  - **Móvil con el JS tarde: 0,063 → 0.** Con el JS principal retrasado
    (primera visita con datos móviles), la página pintaba Ofertas con el hueco
    del selector de idioma y luego saltaba a Inicio (`<main>` subía 57 px).
    Ahora `idioma-previo` marca `html.movil-relato` en «/» sin ancla (misma
    consulta que `Movil`) y el CSS enseña ya Inicio, oculta Ofertas y el
    selector y marca la pestaña Inicio. La clase se quita en
    `DOMContentLoaded`; si el JS no llega, vuelve el catálogo sin JS de
    siempre. Con ancla (`/#emisiones`) sigue como en `main` (0,063 si el JS
    tarda). Castellano a 390 y 360, retrasos de 600 y 1500 ms: 0. Inglés con
    subida-3 (que en el móvil ya no oculta): 0,031 y 0,035 por el cambio de
    castellano a inglés (subida-3 sola: 0,105 y 0,065). Las posiciones finales
    de las 5 pestañas a 390 y 360 son las de `main`.
  - **«Recién añadidas» con el catálogo caducado: aceptado.** Con el lote
    vencido (reloj el 12/11) nace visible y se oculta: 0,011 (1024×768) y
    0,0065 (1366×860); en el móvil con el JS tarde, 0,020. Muy por debajo de
    0,1 (`main` daba 0,874 en escritorio). Evitarlo exige repetir en `<head>`
    la vigencia del lote y la ventana de 30 días de altas; no compensa.

- **Inicio ya no salta al cargar (09fe24f).** Medido con el reloj fijo
  (04/11 12:00 UTC) y el mismo catálogo, `main` local frente a la rama, en
  castellano: 1024×768 **0,874 → 0**; 1366×860 **0,886 → 0**; 1920×1080
  0,90 → 0,0015. En inglés ya era 0 (la página espera oculta a traducirse).
  Había tres causas: el JS subía el panel de Inicio y ponía la clase después
  de pintar; la letra Geist llegaba tarde (el subtítulo pasaba de 3 a 2
  líneas y el botón subía 29 px); y «Recién añadidas» aparecía de golpe en la
  franja que asoma bajo la portada. Ahora: `idioma-previo` marca
  `html.escritorio-relato` en `<head>` (solo en «/», misma consulta que
  `Movil.adaptar()`); el panel va en el HTML el primero dentro de `<main>`
  (el JS ya no lo mueve) y el CSS lo enseña aunque nazca con `hidden`;
  `<link rel="preload">` de `geist-normal`; «Recién añadidas» nace visible
  (`pintarInicio` la oculta si no hay altas). Con la letra retrasada 1 s,
  0,015. Cambio de tamaño en caliente 1366→900→390→1366, ES y EN: bien.
- **Tableta (768–1023 px):** cuenta la misma historia que el escritorio, en
  una columna: titular, «Ver las 24 ofertas» y su aviso antes del radar
  (a 820×1180, botón en 439–495 y aviso en 515–563). Cuatro tarjetas, dos y
  dos. El radar interactivo pasa a Plataformas, como en escritorio. Con
  pantalla baja (900×600) el aviso va antes del botón.
- **Inglés (a43cd81):** «Original source text (Spanish)» ya no sale sobre la
  leyenda del radar («26 platforms on the radar…»), solo sobre el punto
  leído al pasar el ratón; en Ofertas va sobre las tarjetas y no sobre
  «Main offers / 8 of 8 entries…». En el panel de Inicio no había ninguno.
- **«Qué se adquiere» (43c00e7):** en la ficha fija sale del párrafo inicial
  y va como fila de «Qué es y quién lo ofrece», con punto final (22 de 24).
  La ficha fija no tiene un apartado «Características»: esa lista es su
  equivalente. Kraken xStocks y Spiko Smart Cash Euro cuentan en el párrafo
  algo distinto y más detallado: no se toca. En el panel de la web tampoco
  se repite ya cuando la descripción no empieza por el resumen (17 ofertas).
- **Pruebas:** `npm test` completo en verde (base de datos 27 scripts con 886
  comprobaciones, 30 SQL y 11 del mapa; web 592; fichas 71; precarga 32;
  móvil 411 con 409 bien y 2 omitidas; acceso 145; herramientas sin
  diferencias). Pruebas nuevas funcionales, sin frases: `probar-web-escritorio.mjs`
  (clases en `<head>` para escritorio y móvil, panel primero en `<main>`,
  precarga de la letra) y
  `probar-fichas.cjs`. Guardián OTA `ok` (1.4.1(23)). CSS 178 462 B.
  `probar-orden.mjs` solo avisa de `rwadar-movil/App.js`, como en `main`.
- **Al unir:** el panel de Inicio se ha movido de sitio en `index.html`
  (430 líneas): si otra rama cambió algo dentro de ese panel, el conflicto se
  resuelve aplicando su cambio en la nueva posición y regenerando con
  `npm test`. `idioma-web` solo cambia la línea de `superficies`. Con
  `claude/subida-3` el código se une solo; choca únicamente este archivo.
- **Capturas y medidas:** `scratchpad/remates-3/` (`medidas.json`, con la
  corrección en `correccion_tras_revision`; `capturas/antes-*`, `despues-*`,
  `*-movil-primera-pintura` y `unida-subida3-*`).

## 4 de noviembre de 2026 (noche, 4) · Claude · publicado: Academy, Inicio en escritorio, barrido de calidad y catálogo 2026-11-04

Orden de Víctor: «hay que subirlo cuanto antes». Todo publicado en dos subidas,
cada una con npm test completo, CI (pruebas + secretos), web de prueba
comprobada a mano (Playwright a través de curl) y después producción.

**Primera subida** (PR #55, merge `f1b0426`; sello `24963d4`): Academy en
llano y tablas de Privacidad (`claude/academy-pulido`) e Inicio como historia
en escritorio desde 1024 px (`claude/escritorio-inicio`). Web: Publicar web
runs 41900720101 (preview) y 41901555827 (producción), ambos success.

**Segunda subida** (PR #56, merge `38eaa07`; PR #57, merge `857ef73`):
- Arreglos del barrido en móvil (`claude/qa-movil`, revisado y corregido):
  rótulos legibles en la ficha, test de Academy sin sesión, sin aviso
  «Registro actualizado» al cargar, saltar al contenido, inglés, una sola
  consulta de sesión, «de 7», toque de 44 px y menores.
- Arreglos del barrido en escritorio (`claude/qa-escritorio`, **solo la
  implementación**; la revisión y su corrección irán en la tercera subida):
  sin «NaN», inglés sin salto (idioma-previo en `<head>`), barra fija bajo la
  cabecera real, cabecera en una fila desde 820 px, consultas técnicas sin
  enlace, comparador, «Entrar», «Novedades», og/twitter.
- Ajuste de integración: `rotuloReferencia` acepta la clave interna y el
  rótulo legible de la entrega, quita la fecha y traduce; nombres alineados
  con `rwadar-app/rotulos-referencias.js`.
- Entrega de catálogo 2026-11-04 aplicada con «Aplicar catálogo» (run
  41904025384) tras releer como visitante la f2732257 a las 20:10 UTC.
  Comprobado en línea: revisión `cf79e4a4`, 26/24 (8/13/3), 20 «Acceso desde
  España · consulta …» y 0 «accesoEspana», Aktionariat con `/trade`, ARTEX
  «No usa blockchain», Toucan con 4 fuentes. Sincronizado (seed 12 fuentes,
  transparencia lote 2026-11-04). `probar-fichas.cjs`: SwitzerLend y Spiko ya
  no citan ninguna API.
- Sello `f17f460`. Publicar web runs 41905751641 (preview) y 41906630808
  (producción); OTA Android run 41906657970 (base c1f7106), todos success.

Medido en la web de prueba frente a la real: cabecera a 820/1024 de 117 a
69 px; CLS de Inicio en inglés a 1366 de 1,08 a 0; ningún «NaN», ninguna
clave interna, ningún aviso al cargar.

**Pendiente (tercera subida, en marcha):** corrección de la revisión de
`claude/qa-escritorio`; `claude/remates-3`: CLS 0,87 a 1024 en castellano
(viene de la primera subida), Inicio de tableta como historia, marca «texto
original» en la leyenda del radar en inglés y «Qué se adquiere» repetido en
la ficha fija. Sigue anotado: mTBILL necesita otra fuente de acceso desde
España; Toucan, sin confirmar si el bloqueo sigue hoy (Verra da 403); ARTEX
no usa blockchain (decisión editorial de Víctor si sigue en el radar).

## 4 de noviembre de 2026 (noche, 2) · Claude · entrega 2026-11-04: arreglos de datos del catálogo (sin aplicar)

Rama local `claude/catalogo-2026-11-04` (worktree `catalogo-1104`, sale de
`main` 081fc27), dos commits (preparación y corrección tras la revisión
independiente). **Sin push, Supabase solo leído como visitante,
nada publicado, sin OTA ni workflows.** Solo datos; la web va en otras ramas.

- **Parte de la publicada:** lectura como visitante a las 19:07:11 UTC del 04/11:
  `f2732257` (la .7 con los textos de la .8), 26 plataformas, 24 ofertas
  (8/13/3). Guardada en `verificaciones/2026-11-04-v2/lectura-publica/`; el
  preparador comprueba que coincide con la base local.
- **Etiqueta `2026-11-04`**, revisión nueva `cf79e4a4…`, `aplicar-y-aprobar.sql`
  SHA `85e848edc433efa6d1a240a16438e9ccfbce5061ef9be53444f81a4e081df464`.
  Entrega documental: radar, cifras y vigencia siguen del 03/11 (vence el 11/11).
- **Qué cambia:**
  - «Datos con su fecha»: 228 rótulos internos («accesoEspana · consulta …»)
    pasan a castellano («Acceso desde España · consulta …») en 21 ofertas;
    valores, fuentes y fechas iguales.
  - 39 referencias en 18 ofertas y 2 fuentes del radar (REGAFI de Spiko) dejan
    la dirección de API por la página para personas (Aktionariat, BOSS Info y
    SwitzerLend `/trade` e `/invest`; Spiko `data.spiko.io`; Brickwise
    `www.brickwise.at/assets/<isin>` o el mercado de la app; Alius Capital;
    buscador de ESMA; ficha del REGAFI). Comprobadas hoy con curl y Chrome sin
    interfaz. **Se decide por referencia:** si la página no enseña ese mismo
    dato, la referencia conserva la API (`seQuedan[].referencias`).
  - ARTEX «Blockchains»: «Mercado regulado (MTF)» → «No usa blockchain» (su FAQ).
  - Toucan: fuente nueva del ACR (30/05/2022) y motivo fechado en mayo de 2022.
- **Generador arreglado:** diccionario de los 67 campos en
  `rwadar-app/rotulos-referencias.js`; lo usan `2026-11-02-v2/preparar-lote.mjs`
  y `montar-revision.mjs` (que falla si llega un campo sin rótulo).
- **Lo que no se pudo:** el libro de órdenes de Brickwise
  (`api.app.brickwise.at/api/v1/assets`, 11 fichas) no tiene página pública y
  se queda; también se quedan 14 referencias de Brickwise (precio de emisión,
  disponibles en emisión, etapa, condiciones; y precio y rentabilidad de
  Cohotel y GreenPoint, que el mercado da con otra medida) y las 6 del mínimo
  y la salida de Aktionariat y BOSS Info (solo en la configuración que carga
  `/invest`, no en pantalla); el JS de Midas (mTBILL) no tiene equivalente; el
  estado de hoy de Verra/ACR no se pudo leer (Verra da 403). Detalle en el
  informe, §3.
- **Corrección tras la revisión independiente** (informe §7): Brickwise 15
  referencias (12 conservan la API; las 3 de «Precio más bajo en mercado
  secundario» enlazan el mercado, que enseña «Preis pro Anteil ab») y, con el
  mismo criterio, 2 más («disponibles en emisión» de Pottendorfer y
  Sonnleithnergasse); Aktionariat y BOSS Info 6 referencias con la API; Toucan
  «que la permitiría» → «que permitiría tokenizarlos». Tras corregir: PGlite correcto
  (27 + 16 fallos), preparador reproducible y `npm test` completo, salida 0.
- **Pruebas:** `comprobar-entrega.mjs` correcto (27 comprobaciones, 16 casos de
  fallo que no dejan nada); `preparar-entrega.mjs` reproducible; `npm test`
  completo en verde.
- **Pendiente (coordinador):** revisión independiente; unir a `main`; releer
  como visitante (con hora); «Aplicar catálogo» con `2026-11-04`; sincronizar,
  fichas, `volcar-seed.js`, `transparencia.json`, sello y «Publicar web». Sin OTA.
  Pasos en `rwadar-app/data/verificaciones/2026-11-04-v2/INFORME-ENTREGA.md` §6.

## 4 de noviembre de 2026 (noche, 2) · Claude · QA de escritorio: 9 arreglos de la web publicada (sin publicar)

**Corrección tras la revisión** (fb7dc26, 8e9a3d3, e1760bd, 88e938d; 5
hallazgos, 1 importante y 4 menores, todos corregidos):
- **idioma-previo (importante + menor):** solo oculta en escritorio (mismo
  corte que la vista móvil de la web); en el móvil no saltaba y ocultarla
  solo retrasaba la primera pintura (390 px con CPU x4: 2,2 s → 0,18 s, CLS
  0). El tope de 1,5 s cuenta desde el inicio de la navegación, no desde que
  corre el script. **Ojo:** no es un tope duro; el temporizador no puede
  cortar el JS diferido, así que en escritorio con la CPU x4 la página sale
  a los ~2–2,5 s, al terminar la traducción (CLS 0). Ya no pone `lang="en"`:
  lo pone idioma-web; si no carga, queda `lang="es"` con el texto en
  castellano.
- **Barra de filtros al filtrar (menor):** el ResizeObserver observa también
  `#plataformasResultados`. Si se filtra desde la barra con la lista
  desplazada, la vista vuelve al principio de los resultados, bajo la barra;
  antes la barra se quedaba sobre Academy y se iba al primer giro de rueda
  con el foco dentro.
- **/acceso (menor):** el botón que queda solo de su pareja ocupa la fila
  (solo CSS, con `+` y `:has()`); los botones con caja y los enlaces de texto
  ya no se mezclan. A 390 px la vista de entrar vuelve a medir 1010 px.
- **Comparador (menor):** Blocksquare, Fireblocks, Taurus y Tokeny vuelven a
  decir «No aplica» (no venden inversiones), no «Sin documentar».
- Pruebas funcionales nuevas o ajustadas en
  `rwadar-app/probar-web-escritorio.mjs` (idioma-previo en escritorio y
  móvil, barra al cambiar la lista, «No aplica»); fallan con el código de
  d469e06. `npm test` completo en verde (base de datos 886 en 27 scripts,
  30 SQL y 11 del mapa; web 590, fichas 70, precarga 32, móvil 409 + 2
  omitidas, acceso 145; herramientas al día). OTA `--base c1f7106…` `ok`;
  CSS 168 389 B. `probar-orden.mjs` sigue con el único aviso de
  `rwadar-movil/App.js`, que ya salía en `main` (no se toca la app).

Rama local `claude/qa-escritorio` (sale de `main`, 081fc27). **Sin push, sin
publicar, Supabase sin tocar, sin OTA ni EAS.** Los números son los de la
tabla del barrido de calidad (HALLAZGOS.md del coordinador). Va en paralelo
con `claude/qa-movil` y `claude/escritorio-inicio`; se unirán después.

- **n.º 1 · «0 €» → «NaN»** (94feb93): la franja de cifras anima solo el
  número y conserva prefijo y sufijo; sin cifra o con 0 no anima, y si otra
  parte de la página reescribe la cifra, se retira. Antes: «NaN» en inglés y
  «0» en castellano; ahora «€0» y «0 €».
- **n.º 7 · el inglés saltaba** (8570810, 1f8e32e): nuevo
  `assets/idioma-previo-20261104.js` (en `ARCHIVOS_PUBLICABLES`), externo y
  sin defer en `<head>` porque la CSP no admite scripts en línea. En
  escritorio, si la preferencia guardada es inglés, pone la clase
  `idioma-previo` (`body{visibility:hidden}` en idioma-20261022.css) hasta
  que idioma-web avisa de que ha traducido y ha llegado DOMContentLoaded;
  tope de 1,5 s desde la navegación (ver la corrección arriba).
  Va en Inicio, las páginas de rwadar-fichas.js, Academy, 404, privacidad,
  transparencia comercial y para empresas. CLS en inglés: **0,22 → 0** a
  1366 y **0,067 → 0** a 820; en escritorio la primera pintura en inglés
  pasa de ~0,25 s a ~0,6 s (espera a la traducción); en castellano y en el
  móvil no cambia.
- **n.º 8 · barra de filtros** (b315a15): `.barra` usa `top:var(--alto-cabecera)`
  (ResizeObserver sobre `.hdr`) y al acabar `#plataformasResultados` se
  empuja hacia arriba (`--barra-empuje`); no se mueven nodos del DOM, así que
  el orden móvil/escritorio de `Movil` no cambia. Tapado: 57 → 0 px a 1024 y
  820; ya no queda fija sobre Descartadas ni el pie, tampoco tras filtrar.
- **n.º 9 · cabecera de tableta** (38eb8f7): por debajo de 1280 px «Sonido y
  vibración» solo con icono (aria-label y title), enlaces y botones más
  juntos; por debajo de 1024 px salen el lema de la marca y «Ver ofertas →»
  (repite «Ofertas»). Una fila (69 px) de 768 a 1366, ES y EN, también con
  «Mis inversiones» e inicial. No toca la estructura de Inicio.
- **n.º 12 · fuentes que son API** (c6ece17): una URL con `/api/`, que acaba
  en `.json` o pide `format=json` no se enlaza; se cita «Consulta técnica ·
  fecha» (con su título si lo tiene). En rwadar-fichas.js
  (`sinEnlacesTecnicos` sobre el contenido de cada página, sin tocar las
  plantillas de secciones), ficha-pagina y la web (ficha de oferta y panel de
  plataforma; fbd7d91 la llama con guarda `typeof`, porque las pruebas de
  rwadar-movil ejecutan un trozo del script sin el ayudante). Cero enlaces a
  API en /ofertas/aktionariat, /boss-info, /switzerlend y /plataformas/spiko.
  Si al lado ya pone «consultada el …», no repite la fecha (bebc45d).
- **n.º 18 · comparador** (daf08ca): «Mínimo» es el mínimo más bajo
  documentado en euros entre las ofertas de esa plataforma («Desde 1 €» en
  Spiko), «No aplica» en los proveedores de infraestructura o «Sin
  documentar», no «Alto». `textoEspanaOferta` y
  `textoSalidaOferta`: una sola función para la tarjeta (escritorio y móvil)
  y «Lo esencial» de la ficha. **No hecho:** el campo «Blockchains» de ARTEX
  («Mercado regulado (MTF)») es un dato de Supabase; corregirlo va en una
  entrega del catálogo.
- **n.º 27 · «Mis inversiones» sin sesión** (df52b2e): rotula «Entrar»; en
  /acceso el botón de la vista abierta se oculta («Ya tengo cuenta» ya no
  repite «Entrar»).
- **n.º 28 · «Noticias de RWAdar»** (77a773a): el menú de las páginas fijas
  dice «Novedades» («Updates»). og.png regenerado con
  `rwadar-editorial-source/og.mjs`: sectores como en el radar (Inmobiliario,
  Crédito, Tesoro…) y un punto por plataforma del catálogo (26).
- **n.º 29 · compartir** (8570810, 141ad06): og:* y `twitter:card` en
  privacidad, transparencia comercial y para empresas, y `twitter:card` en
  todas las páginas de rwadar-fichas.js. Sin imágenes nuevas (las ofertas
  siguen con su .webp). **Decisión de Víctor:** /para-empresas sigue con
  `noindex,nofollow`; no se ha cambiado.
- **Pruebas** (1a90a20): funcionales nuevas en
  `rwadar-app/probar-web-escritorio.mjs` (las llama probar-web.mjs, que así
  no pasa su presupuesto de 240 000 B), `probar-fichas.cjs` y
  `rwadar-acceso/acceso-sin-duplicados.test.mjs`. Ninguna fija frases
  legales. `npm test` completo en verde (base de datos: 27 scripts con 886
  comprobaciones, 30 SQL y 11 del mapa; web 589, fichas 70, precarga 32, móvil 409 + 2 omitidas, acceso 145,
  herramientas y `copiar-idiomas-web --comprobar` sin diferencias). OTA:
  `comprobar-ota-compatible.cjs --base c1f7106…` da `ok`; no se tocan
  archivos protegidos. CSS 168 389 B. `probar-orden.mjs` solo avisa de
  `rwadar-movil/App.js` (119 KB > 110 KB), que ya pasaba en `main`.
- **Al unir con `claude/qa-movil`:** el código se une sin conflictos; chocan
  solo las páginas generadas de ofertas, plataformas y Descartadas (una
  línea cada una). Se resuelven regenerando con `node rwadar-fichas.js` y
  `node rwadar-academy.js` tras la unión. Con `claude/escritorio-inicio`, sin
  conflictos.
- **Pendiente:** publicar (con la sincronización completa) y comprobar en
  producción; la tarjeta de plataforma y el panel siguen diciendo «Mínimo:
  alto» / «Importe de entrada: Alto» (nivel de entrada; el barrido solo
  pedía el comparador). En inglés, «Sin documentar» y «Desde 1 €» del
  comparador siguen en castellano: idioma-web protege entera la celda
  `#modal tbody td` (frente de inglés de `claude/qa-movil`).

## 4 de noviembre de 2026 (noche, 3) · Claude · QA móvil: arreglos de la revisión

Misma rama local `claude/qa-movil`, 6 commits más sobre ee25496 (de 0595f79
a 7b28852, y este traspaso). **Sin push, nada publicado, Supabase sin tocar, sin OTA ni
workflows.** Solo cambia cómo se pinta; los datos del catálogo, igual.

- **Importante (arreglado):** 5 fichas fijas `/ofertas/<slug>` (aktionariat,
  prosegur-digital-gold, robinhood-classic-stock-tokens y las dos de Spiko)
  enseñaban «· comisiones · consulta 01/11/2026» en Costes. Ahora el enlace
  usa `rotuloReferencia()`: «· Comisiones · consultada el 01/11/2026 ↗».
  Comprobado en navegador: 0 de 24 fichas con claves internas.
- **Menores (arreglados):**
  - **Costes (web y app):** «Comisiones» va aparte y se traduce («Fees»); la
    cita lleva `lang` y la nota «Cita literal de la fuente, en inglés.», como
    en «Datos con su fecha».
  - **Idioma de la cita:** las 12 de Brickwise («Vermittlungsgebühr…») salen
    como alemán (más palabras alemanas, ä/ö/ü/ß y «Investor:in» no cuenta
    como «in»); «Start with as little as €1», como inglés. Sobre las 476
    referencias del catálogo de hoy solo cambian esas 17, todas a mejor.
  - **A 360 px:** «Mercado de compraventa» en dos líneas sin cortar; títulos
    de «Recién añadidas» a cuatro líneas, sin cortes; rótulos del radar a
    44 px (65-70×44); chips cortos («All», 37 px) con diana de 44×46.
  - **Inglés:** «+ Follow this platform» y su nota en la ficha de plataforma.
  - **App Academy:** «7 LECCIONES · 3 NIVELES» (antes 9, junto a «de 7»).
- **No hecho:** la página no vuelve a preguntar por la sesión tras el primer
  401 (`acceso-privado.js`). Vale mientras las cuentas sigan en pausa; al
  reabrirlas, comprobar al volver a la pestaña o con un evento `storage`.
- **Pruebas:** `npm test` en verde (1.466 correctas, 0 fallidas; node --test
  11/11, 409/411 con 2 omitidas, 144/144). Guardián OTA `ok` (1.4.1(23)).
  Ajustadas dos comprobaciones existentes de costes (web y app) al nuevo
  marcado; sin pruebas nuevas de textos. Medidas y capturas en
  `scratchpad/qa-movil-fix2/` (`resultados.json`, `capturas/`).
- **Al publicar:** web y OTA (la app cambia en Costes y Academy).

## 4 de noviembre de 2026 (noche, 2) · Claude · arreglos del barrido de calidad de la web en el móvil

Rama local `claude/qa-movil` (sale de `main`, 081fc27). **Sin push, nada
publicado, Supabase sin tocar, sin OTA ni workflows.** Los datos del catálogo
no cambian: todo es de cómo se pinta. Hallazgos en
`scratchpad/qa-prod/movil.json` (20).

- **Graves:**
  - **Ficha de oferta:** «accesoEspana · consulta 01/11/2026» pasa a
    «Acceso desde España» (y «Mínimo de inversión», «Qué se adquiere»,
    «Comisiones»…) en la web (panel y fichas fijas) y en la app, con
    `rotuloReferencia()` en `rwadar-movil/lib/ficha-editorial.js`. Las
    búsquedas internas por etiqueta siguen con la clave. La cita de la fuente
    lleva su `lang` y, si está en inglés, francés o alemán, la nota «Cita
    literal de la fuente, en inglés.». En inglés se traducen rótulos, «Fecha
    del dato», «Ver fuente» y «Fuente N». **Pendiente para el próximo ciclo
    del catálogo:** que `preparar-lote.mjs` escriba ya el rótulo legible.
  - **Academy:** el test funciona sin cuenta y no espera a la sesión; solo
    «Marcar como leída» y el progreso necesitan cuenta.
- **Importantes:** «Registro actualizado» ya no sale al cargar (solo si el
  catálogo cambia con la página abierta, y en inglés); «Saltar al
  contenido» lleva al contenido de la pestaña visible; inglés de Perfil,
  Descartadas, avisos flotantes, tipo y región de las plataformas y países de
  «Recién añadidas»; sin sondeos de sesión sin cuenta (queda **un** 401 al
  cargar; quitarlo exige que el servidor responda 200 sin sesión, que es
  Auth y no lo he tocado); «Lección 1 de 7» (web y app); toque de 44 px en
  radar (diana en pantalla), rótulos del radar, controles del mapa,
  «Descartadas, con su motivo» y enlaces de las fichas fijas (chips y
  estrella ya llegaban a 44 con su `::before`).
- **Menores:** fechas dd/mm/aaaa en la ficha de plataforma; sin «Actividad»
  repetida ni «Qué se adquiere» repetido (web y app); búsqueda vacía con
  «Borrar búsqueda»; «de 1 € o de 1 $» (web y app); «Austria» en el popup
  del mapa (al pintar); redirecciones de `/fuera-del-radar`, `/plataformas/`
  y `/ofertas/`; nota de uso personal bajo el CSV; títulos a tres líneas y
  tipo/región en dos líneas en la galería.
- **No hecho:** frases del capítulo 04, «mF-ONE» y advertencia repetida en
  Inicio (las toca el otro agente en `index.html`); barra de 5 botones en
  Academy y fichas fijas (plantillas de otro agente); fuentes externas que
  no responden a curl (abrir a mano); alt de las imágenes por oferta (texto
  editorial del catálogo, ya marcado como castellano).
- **Pruebas:** `npm test` completo en verde; guardián OTA `ok` (runtime
  1.4.1(23)); sin cambios en package.json, app.json, eas.json ni scripts/.
  Ajustadas tres comprobaciones de código existentes (radar, Academy,
  fuentes de plataforma) y la frase de mínimos de la app; sin pruebas
  nuevas de textos. Capturas antes/después en `scratchpad/qa-movil/`.
- **Pendiente (coordinador):** revisión, unir a `main` (choques posibles en
  `rwadar-20260820.js` e `index.html` pre-renderizado: regenerar con
  `npm test`), publicar web y OTA (la app cambia: rótulos, «de 7», mínimos).

## 4 de noviembre de 2026 (noche, 3) · Claude · Inicio en escritorio: arreglos de la revisión (sin publicar)

Misma rama `claude/escritorio-inicio`, commits 800b2d2 (CSS) y 1bdb505 (JS).
**Sin push, nada publicado, Supabase sin tocar, sin OTA.**

- **Pantallas bajas (importante):** con 760 px de alto o menos, el aviso de
  riesgo va antes de «Ver las 24 ofertas» y la portada encoge. Medido en
  294 tamaños (1024–1920 de ancho, 560–960 de alto, ES y EN): en ninguno se
  ve el botón sin el aviso. A 1366×650 el aviso queda en 425–473 y el botón
  en 493–549; a 1024×600 en inglés, aviso 495–543.
- **Foco (importante):** los botones del relato llevan el foco al título del
  destino («Activos y ofertas documentados», «El radar», «Plataformas
  descartadas»), como Movil.ir en el móvil.
- **Menores:** el título de Inicio hace de h1 en escritorio (`aria-level=1`;
  se quita por debajo de 1024); el logo y `/#top` llevan a scrollY 0;
  `#fuentes-…` deja el grupo bajo la cabecera real (132 px con cabecera de
  117 a 1024); los títulos de «Recién añadidas» salen enteros.
- **Pruebas:** `npm test` en verde (web 580, fichas 68, precarga 32, móvil
  411 con 409 bien y 2 omitidas, acceso 144/144, db 0 fallos + 30 SQL +
  11/11, Node seguro 16); guardián OTA ok, runtime 1.4.1(23). El móvil a
  390 px no cambia (barra de progreso a 59 px, sin `aria-level`).
- **Capturas:** `scratchpad/escritorio/corr/` (c-es-1366x650-arriba,
  c-en-1024x600-arriba, c-es-1024x768-logo, c-es-1024-nuevas-ancho…).

## 4 de noviembre de 2026 (noche, 2) · Claude · Inicio como historia también en escritorio (sin publicar)

Rama local `claude/escritorio-inicio` (sobre `main` 320ec05), commits
a213955 (CSS) y 12455de (JS). **Sin push, nada publicado, Supabase sin
tocar, sin OTA.** Solo cambian `rwadar-20260820.css` y `rwadar-20260820.js`;
`index.html` no hizo falta tocarlo.

- **Qué se ve:** a partir de 1024 px, Inicio es la misma historia que en el
  móvil y con el mismo texto: portada a dos columnas (titular, subtítulo,
  botón y aviso a la izquierda; el radar grande con sus cifras a la
  derecha), «Recién añadidas», capítulos 01–06 en una columna de 720 px con
  las cifras grandes, Selección, fuentes y nota legal. «Quién más se ha
  movido», «Recién añadidas» y la Selección pasan de carrusel a cuadrícula
  más ancha (3 por fila; 4 si son 4; si sobran 2, a medias). Debajo siguen
  Ofertas, Plataformas, Método, Descartadas y Academy como antes.
- **Cómo:** el JS mueve el panel de Inicio al principio de `<main>` y pone
  `html.escritorio-relato`; por debajo de 1024 px lo devuelve a su sitio. El
  radar interactivo de la portada antigua pasa a Plataformas, justo después
  de «El radar»; el titular antiguo y el marcador se ocultan en ese ancho.
  En escritorio, los botones del relato bajan a su sección, «Explorar el
  radar» lleva a Plataformas y las tarjetas abren su ficha. La barra de
  lectura va bajo la cabecera y solo mientras se lee Inicio.
- **Lo que no cambia:** el móvil y el escritorio de 768 a 1023 px. Comparado
  con `main` estilo a estilo (390 px en Inicio, Ofertas y Plataformas; 800 y
  1000 px): idéntico. Ofertas, Plataformas, Método, Descartadas y Academy a
  1366 y 1024: idénticos; solo se mueve el radar.
- **Pruebas:** `npm test` completo en verde; guardián de la OTA ok. CSS:
  173 579 B (presupuesto 180 000). Sin textos nuevos, así que sin cambios en
  inglés.
- **Pendiente:** que Víctor lo vea y, si le vale, unir y publicar la web.
  La cabecera de escritorio ya se partía en dos líneas a 1024 px antes de
  este cambio; no se ha tocado.

## 4 de noviembre de 2026 (tarde, 5) · Claude · corrector de Academy y Privacidad (sin publicar)

Misma rama `claude/academy-pulido`, encima de la entrada de abajo. **Sin push,
Supabase sin tocar, nada publicado, sin OTA.**

- **Fecha de revisión legal:** vuelve a **2026-10-02** en las lecciones 1-7
  (frontmatter, cabecera, pie, JSON-LD y sitemap). El pulido fue de estilo, no
  una revisión legal; la última que consta es la de Víctor del 2/10. Si Víctor
  revisa de nuevo, se cambia la fecha (y en la 04, «A 21 de agosto de 2026»
  con lo que haya hoy sobre el umbral de 12 millones).
- **Lección 6:** el título vuelve a «Cuatro espejismos de liquidez» y una
  línea explica la palabra, para que el aviso reforzado («Las condiciones,
  espejismos y preguntas…») siga remitiendo a algo que está en la lección.
  El aviso no se toca.
- **Lección 5:** primer punto del resumen acortado; la tarjeta vuelve a caber
  en 3 líneas a 390 px en castellano y en inglés (clave nueva en
  `idioma-en.js` y `copiar-idiomas-web.cjs`).
- **Hechos:** EBITDA = resultado bruto de explotación (no «beneficio de
  explotación», que es el EBIT); tanteo y retracto explicados los dos.
  Retoques de redacción en 02, 05, 06 y 07.
- **Privacidad:** espacio tras cada etiqueta de celda (al copiar ya no sale
  «Por qué ocurreEs lo mínimo…»). Visualmente igual.
- **Caché del CSS y del diccionario:** no se renombran. `rwadar-publicar.js`
  ya pone una huella del contenido en el nombre al publicar
  (`privacidad-20260820.<hash>.css`), así que el `immutable` nunca sirve bytes
  viejos con un nombre nuevo.
- **Pruebas:** `npm test` en verde; `comprobar-ota-compatible.cjs --base
  c1f7106` en ok.

## 4 de noviembre de 2026 (tarde, 4) · Claude · lecciones de Academy en llano y tablas de Privacidad en el móvil (sin publicar)

Rama local `claude/academy-pulido` (worktree `.claude/worktrees/academy-pulido`),
commits 969ab22 (lecciones), c9a19ab (Privacidad) y f6382f4 (retoque de la lección 6). **Sin push,
Supabase sin tocar, nada publicado, sin OTA.**

- **Academy, lecciones 1-7:** cuerpo pulido con la guía de LISTA-FINAL y
  «Frases de ese estilo» (metáforas, frases de folleto, calcos, rayas a la
  inglesa y jerga sin explicar). Sin cambiar hechos ni quitar avisos; el aviso
  legal común y el reforzado de cada lección no se tocan. Fecha de revisión
  legal **2026-11-04** en las siete (frontmatter, cabecera y pie). En la 04,
  «A fecha de esta revisión (21 de agosto de 2026)» pasa a «A 21 de agosto de
  2026». Regenerado con `node rwadar-academy.js` (web, sitemap y
  `rwadar-movil/lib/academy-contenido.js`). Inglés de los cuatro resúmenes de
  tarjeta que cambian (02, 03, 05, 06) y `copiar-idiomas-web.cjs`.
- **Privacidad:** por debajo de 600 px, las cuatro tablas pasan a filas
  apiladas con su etiqueta (`.tabla-apilada`, `.celda-etiqueta` en
  `privacidad-20260820.css`). En escritorio, la tabla de siempre. El texto
  legal, comparado con main sin las etiquetas, es idéntico.
- **Pruebas:** `npm test` en verde (web 580, móvil 409, acceso 144);
  `comprobar-ota-compatible.cjs --base c1f7106` en ok.
- **Pendiente:** la palabra «espejismos» sigue en el aviso reforzado de la
  lección 6 (texto legal, no lo he tocado). Las lecciones 8 y 9 («Próximamente»)
  no se han revisado.

## 4 de noviembre de 2026 (noche) · Claude · entrega 2026-11-03.8: textos de Reental, Toucan y RealT (sin aplicar)

Víctor: «hasta que no esté todo no has acabado». Rama local
`claude/catalogo-2026-11-03.8` (sale de `main`, b98719d), un commit.
**Sin push, Supabase sin tocar, nada publicado, sin OTA ni workflows.**

- **Qué es:** solo los textos de `public.plataformas` y `public.fuentes` que
  quedaron fuera de la .7. No crea revisión del catálogo: exige que la
  publicada sea la `f2732257` (aprobada y con su huella) y la deja publicada.
  `aplicar-y-aprobar.sql` SHA `c353e6d901f730b31b7be791c1d08e127c1c232b734c40d930bbe7f1847ea772`.
  - **Reental:** la nota sin «La opción más accesible…».
  - **Toucan:** «El bloqueo no viene de Toucan, sino de los registros de
    carbono: …» (el resto, igual).
  - **RealT:** «Liquidación anunciada» y un motivo nuevo que dice solo lo que
    dicen sus fuentes (BridgeDetroit ×2 y Outlier, abiertas con WebFetch hoy):
    la demanda «según la demanda», la orden «provisional», la liquidación «la
    dijo su cofundador» y «unos 700»; sin «la mayor demanda». Sus 3 fuentes,
    iguales, y una nueva: Outlier Media (16/07/2026), «RealT planea vender sus
    inmuebles de Detroit».
- **Guardas:** una transacción serializable; o todo como antes o todo ya como
  quedaría; las fuentes de RealT y de Toucan se comparan por **dirección y
  título** (el hueco del revisor), y Outlier también por sus fechas. Si algo
  no es exactamente lo previsto, no cambia nada.
- **Pruebas:** `comprobar-entrega.mjs` (PGlite) correcto, 29 comprobaciones,
  20 casos de fallo que no dejan nada; `preparar-entrega.mjs` reproducible;
  `npm test` completo en verde.
- **`comprobar-revision.mjs`:** una entrega sin revisión nueva no entra en la
  cadena de PGlite de las siguientes (su guarda depende de `02_seed.sql`).
- **El `textos-plataformas.sql` de la .7 queda superado: no aplicarlo.**
- **Pendiente (coordinador):** revisión independiente; unir a `main`; releer
  como visitante (compuerta, con hora); «Aplicar catálogo» con `2026-11-03.8`;
  comprobar en línea; `sincronizar.js`, `rwadar-fichas.js`, `volcar-seed.js`,
  `npm test`; sellar; «Publicar web». No hace falta OTA (la app lee estos
  textos de Supabase). Detalle en
  `rwadar-app/data/verificaciones/2026-11-03.8-v2/INFORME-ENTREGA.md`.


## 4 de noviembre de 2026 (tarde, 2) · Claude · remates, «Recién añadidas» y textos del catálogo publicados

Víctor: «hasta que no esté todo no has acabado» y «súbelo en cuanto esté».
PR #50 (remates, «Recién añadidas» y entrega 2026-11-03.7), unida a `main`.

- **Catálogo 2026-11-03.7:**
  - **Antes de aplicar:** lectura como visitante a las 16:58:48 UTC; la publicada
    era la `344a86aa`, con 24 ofertas (8/13/3).
  - **Aplicado** con «Aplicar catálogo» desde `main` (725a153).
  - **Después:** en línea, la `f2732257-206d-48ce-2067-c7e19fa33002`, con 24
    ofertas (8/13/3) y 26 plataformas. Sale el aviso nuevo («No está abierta a
    cualquier inversor minorista…») y ya no sale «No presentar como…».
  - **Sincronizado:** `sincronizar.js`, `rwadar-fichas.js` y
    `transparencia.json` (revisión y lote nuevos). `npm test` en verde.
- **Publicado:**
  - **Web:** «Publicar web» en preview y en producción desde `main` (d8dc6f5); la comprobación automática pasa en las dos. Comprobado con curl en producción: marca «Ofertas y plataformas tokenizadas», «Recién añadidas», el enlace a Academy, el aviso nuevo y el catálogo `f2732257`. `/ofertas/mf-one` sigue en 404.
  - **App:** OTA al canal production, runtime `1.4.1(23)`, con la comprobación de compatibilidad superada. No comprobada en un móvil.
- **Decisión de Víctor (04/11):** la nota legal NO lleva frase de «posiciones
  propias». Hoy no tiene inversiones en el radar y RWAdar no hace
  recomendaciones: valora datos y documentos. Si un día invierte en algo del
  radar, revisarlo con él.
- **Pendiente:** Reental, Toucan y RealT (`public.plataformas`), en otra
  entrega. El texto nuevo de RealT tiene que decir solo lo que dice su fuente.

## 4 de noviembre de 2026 (tarde, 3) · Claude · correcciones de la revisión a la entrega 2026-11-03.7 (sin aplicar)

Misma rama local `claude/catalogo-2026-11-04`, commits dd1cef2, 8caf488,
c72b09b, 37fc303, ca59546 y el de este traspaso. **Sin push, Supabase sin
tocar, nada publicado, sin OTA.** La entrada de abajo queda superada en lo
que diga distinto.

- **Revisión nueva `bd1f873b`** (la 89e88b04 no vale; sigue exigiendo la
  344a86aa publicada). 58 textos en vez de 51: además, el acceso de Spiko,
  Maple y Fireblocks (los vio la revisión) y, con la misma regla, Courtyard,
  OpenEden, Swarm y Reental. ARTEX ya no se contradice; retoques de
  castellano; la nota de RealT explica bien por qué se quita «la mayor
  demanda» (Outlier lo atribuye a la ciudad). Nada más cambia.
  `aplicar-y-aprobar.sql` d57b5dbc… (con `--con-textos-plataformas`,
  d2fecfef…).
- **App:** quitado el cambio a «Importante» (chocaba con `claude/remates`,
  que ya lo hace). La OTA tiene que salir después de unir remates.
- **Fila 19 hecha en el código:** «Marketplace» se lee «Mercado de
  compraventa» en la web, las fichas fijas y la app (en inglés,
  «Marketplace»); el valor de la base no cambia. La línea de tipo y región
  de la tarjeta móvil ocupa hasta dos líneas para no cortar la región.
- **Informe y revisión en el repositorio:**
  `rwadar-app/data/verificaciones/2026-11-03.7-v2/INFORME-ENTREGA.md` (pasos
  exactos en su §7) y `REVISION-ENTREGA.md`.
- **Pruebas:** ensayo PGlite correcto en las dos variantes; `npm test`
  completo en verde (web 579, fichas 68, precarga 32, móvil 406 + 2
  omitidas, acceso 144, base de datos sin fallos); guardián de la OTA ok;
  visto en Chrome sin red externa.
- **Unir con remates:** el código y los datos se unen sin conflictos; solo
  choca este archivo (las dos ramas añaden su entrada arriba): conservar las
  dos.
- **Pendiente (coordinador):** revisar los 15 textos marcados
  «(corrección)» y la fila 19; decidir `public.plataformas`; unir a `main`;
  leer como visitante que la publicada es la 344a86aa (compuerta, con hora);
  «Aplicar catálogo» con `2026-11-03.7`; sincronizar, regenerar y sellar;
  «Publicar web»; «OTA Android» después de remates.

## 4 de noviembre de 2026 (tarde, 2) · Claude · textos del catálogo para el lector (entrega 2026-11-03.7, sin aplicar)

Víctor: «hasta que no esté todo no has acabado». Rama local
`claude/catalogo-2026-11-04`, commits 7900819 (entrega) y 141812b (app).
**Sin push, Supabase sin tocar, nada publicado, sin OTA.**

- **Entrega `2026-11-03.7`** (revisión 89e88b04; exige que la publicada sea
  la 344a86aa). Solo cambian textos que ve el lector: los 26 avisos de
  plataforma (anexo A de la lista de frases), 22 notas de estado (anexo B) y
  tres detalles con «onboarding» o «ya se leen» (Ondo, Taurus, Blocksquare).
  Cifras, fechas, fuentes, colecciones y las 24 ofertas, idénticas a la .6.
  Cada texto, antes y después, en `textos-lector.json`; donde me aparto de
  la lista para no cambiar un hecho (ARTEX, INX, Lofty, Securitize, Swarm,
  Superstate, tZERO), lo explica su nota.
- **Por qué `.7` del 03/11 y no `2026-11-04`:** los datos son del 03/11 y el
  cargador exige esa fecha; fecharla el 04/11 alargaría la vigencia un día sin
  releer fuentes. No se usa `npm run catalogo` porque relee fuentes y renueva
  cifras; se hace como la .6, con `preparar-entrega.mjs`.
- **Reental (fila 18), Toucan (fila 75) y RealT** están en
  `public.plataformas` y `public.fuentes`, que el lote diario solo lee
  (CICLO-DIARIO §5). Van aparte en `textos-plataformas.sql`, con guarda e
  idempotente. Si se acepta tocar esas tablas,
  `preparar-entrega.mjs --con-textos-plataformas` los mete en el aplicador.
  RealT: sin «la mayor demanda…» (no está en las fuentes legibles; la de la
  ciudad da 403), «Liquidación anunciada», «unos 700» y una fuente nueva
  (Outlier Media, 16/07/2026) para la liquidación y la venta, que no tenían.
- **No se puede como dato (fila 19, «Marketplace»):** es un valor del tipo
  enumerado `rwa_actor`; cambiarlo es cambiar el esquema. Hay que hacerlo en
  el código de web y app, en lo que se enseña.
- **App:** el aviso de plataforma dice «Importante», como la web (antes
  «Alerta crítica»). El inglés ya existía.
- **Pruebas:** ensayo PGlite de la entrega correcto en las dos variantes;
  `npm test` completo en verde; `comprobar-ota-compatible.cjs` ok.
- **Pendiente (coordinador):** revisión independiente; decidir los textos de
  `public.plataformas`; unir a `main`; «Aplicar catálogo» con `2026-11-03.7`;
  sincronizar, regenerar fichas y sellar; «Publicar web» y «OTA Android».
  Si se aplican los textos de `public.plataformas`, `node rwadar-app/volcar-seed.js`
  para que `02_seed.sql` no se quede con los viejos.

## 4 de noviembre de 2026 (tarde, 3) · Claude · arreglos de la revisión de «Recién añadidas» (sin publicar)

Rama `claude/recien-anadidas`, commits 90b92c6 (web), 78ed069 (inglés) y
14c9510 (app); nada publicado, sin push ni OTA. Las
tarjetas del carrusel llevan su línea de riesgo (la de la Selección) y
«Revisa · N avisos en la ficha», o el aviso crítico entero, como la fila de
Ofertas; «Nueva» solo si tiene menos de 14 días; solo Principales.
«Ver todas las ofertas nuevas» quita filtros y búsqueda; con «Más nuevas
primero» no hay grupos por proveedor (escritorio y tableta). App: chips de
«Ordenar por» con diana de 48 px y «¿Cómo ordenamos?» propio para ese orden
(su inglés en el bloque «Recién añadidas (04/11)»). Web: una sola raya bajo
la portada, también con el carrusel oculto. Fuera dos pruebas que miraban el
texto del código. `npm test` en verde y OTA compatible con c1f7106.

## 4 de noviembre de 2026 (tarde, 2) · Claude · «Recién añadidas» en Inicio y «Nueva» en Ofertas, web y app (sin publicar)

Víctor: «pondría las más nuevas o las recién añadidas, algo así que venda».
Rama local `claude/recien-anadidas` (sale de `claude/remates`, 38cf6f1),
commits 574bb9a (web), 1872c68 (inglés) y 43cd0d5 (app). **Nada publicado,
sin push, Supabase y EAS sin tocar, sin OTA.** La novedad es un hecho: la
fecha de alta en el radar (`anadidaEl` de `transparencia.json`, que ya
llevaban la web y la app); sin «oportunidad», urgencia ni rentabilidades.

- **Inicio** (web y app): carrusel «Recién añadidas» justo bajo la portada y
  antes del 01, con las tarjetas de la Selección: foto, título en 2 líneas,
  proveedor y lugar, «Nueva» y «Añadida el 03/11/2026»; la tarjeta entera abre
  su ficha (los avisos siguen en ella). Altas de los últimos 30 días, de la
  más nueva a la más antigua y 6 como mucho: hoy Kraken xStocks y Spiko Smart
  Cash (03/11), Robinhood y Spiko Dólar (02/11). Sin ninguna, o con el
  catálogo caducado, no sale. Debajo, «Imágenes ilustrativas…» y «Ver todas
  las ofertas nuevas ›», que abre Principales con «Más nuevas primero».
- **Ofertas:** etiqueta de estado «Nueva» (verde suave, sin borde) en las
  filas de menos de 14 días y la opción «Más nuevas primero» (en la web, en
  el selector; en la app, nuevo «Ordenar por» con «Las más al día primero» y
  «Más nuevas primero»). Con ese orden la lista va seguida, sin separar la
  Selección, para que la más nueva quede arriba.
- **Código:** web en `rwadar-20260820.js` (`altaOferta`, `ofertaNueva`,
  `masNuevasPrimero` junto a `transparenciaOferta`; `ofertasRecienAnadidas` y
  `tarjetaNuevaHtml` junto a la Selección), `index.html` y 17 líneas de CSS;
  app en `lib/recien-anadidas.js` (la misma lógica),
  `componentes/RecienAnadidas.js`, y pocas líneas en `Inicio.js`,
  `Ofertas.js` (prop `nueva`) y `App.js`. El `index.html` se sube con el
  pre-renderizado de antes: lo rehace `rwadar-publicar.js` al publicar.
- **Inglés:** bloque «// Recién añadidas (04/11)» en `lib/idioma-en.js`, antes
  de las entradas del mapa («Just added», «New», «Added on…», «See all new
  offers», «Newest first»…); fuera dos entradas viejas sin uso. Copiado a la
  web con `copiar-idiomas-web.cjs`.
- **Pruebas** (sin fijar textos): `rwadar-movil/tests/recien-anadidas.test.cjs`
  (3) y una en `probar-web.mjs` (altas de 30 días, ordenadas, oculto sin
  ninguna); la de «Imágenes ilustrativas…» en Inicio cuenta ahora 2.
  `npm test` completo en verde (web 580, fichas 68, precarga 32, móvil 411:
  409 + 2 omitidas, acceso 144, base de datos sin fallos; `probar-orden.mjs`
  solo avisa de `App.js`, como antes). OTA compatible con c1f7106 (`ok: true`).
- **Capturas** (390 × 844, dsf 2, sin red) en el scratchpad de la sesión,
  `recien/`: `web-inicio-carrusel`, `web-ofertas-nuevas`,
  `app-inicio-carrusel` y `app-ofertas-nuevas`.
- **Al mezclar con `claude/remates`:** el bloque de inglés va aparte para no
  chocar; después, `node rwadar-movil/scripts/copiar-idiomas-web.cjs`.
  `probar-web.mjs` queda en 239,7 KB (presupuesto 240 KB).
- **Pendiente:** publicar web y OTA, solo con permiso de Víctor; probarlo en
  un Android real.

## 4 de noviembre de 2026 (noche, 2) · Claude · corrector de los remates (sin publicar)

Sigue la rama local `claude/remates`, sin push. **Nada publicado, Supabase y
EAS sin tocar, sin OTA.** `comprobar-ota-compatible.cjs --base c1f7106…` da
ok; el `package.json` raíz y los archivos protegidos de `rwadar-movil` no
cambian.

- **Fila 17 completa:** quedaban cinco «ha vencido» (aviso del catálogo, fila
  «Revisada esta semana» de la ficha, página fija y app). Ahora todo dice «la
  revisión semanal ha caducado». Comprobado con el reloj en el 12/11/2026.
- **Inglés que faltaba** (web y app comparten diccionario y motor):
  Academy (progreso, niveles, rótulos y resúmenes de las tarjetas, migas,
  fechas, índice, paginación y test de las lecciones, y las etiquetas
  accesibles de la app), Plataformas (recuento, «Show 20 more», filtros,
  regiones, radar, comparación, ficha), cabeceras de las colecciones de
  Ofertas, avisos del catálogo caducado y las filas del menú de Perfil de la
  app. Las dos etiquetas de filtros que la rama había dejado a medias
  («Filter by tipo de inversor») ya salen enteras. Un barrido en inglés de la
  web (390 y 1366 px) ya solo encuentra en castellano datos del catálogo
  (nombres, tipo · región de las plataformas, avisos de la fila 11) y el
  cuerpo de las lecciones.
- **Cuerpo de las lecciones y aviso legal de Academy:** siguen en castellano,
  ahora marcados como «Original source text (Spanish)» también en la app y en
  el índice de la web. **Lo decide Víctor** si el aviso legal se traduce.
- **«Registro» → «catálogo»** donde es interfaz: pie («Última revisión del
  catálogo»), «Explorar el catálogo», «Alcance del catálogo…», «El catálogo en
  cifras», el radar, el aviso de «Nada abierto con ese filtro» y el pie de
  Academy. **Quedan para Víctor** las frases legales que usan «registro»: «RWAdar
  es un registro editorial independiente…» (Inicio y app), «El registro y su
  selección no pueden reproducirse…» (pie) y la de Privacidad.
- **Aviso de correo** al aceptar los avisos: ya no habla de Brevo ni de la
  prueba «de extremo a extremo».
- **Tablas legales en el móvil:** letra un punto menor y menos relleno; por
  debajo de 380 px, guiones en las palabras largas. Las cuatro de Privacidad,
  la de Transparencia comercial y la de Para empresas caben en su caja a 390,
  360 y 320 px. El texto legal no cambia.
- **Corrección a la entrada anterior:** el enlace a Academy de Inicio solo se
  ve por debajo de 768 px. En escritorio no aparece; Academy sigue en el menú
  de arriba y en su sección de la portada.
- **Pruebas:** `npm test` completo en verde: rwadar-app sin fallos (27
  bloques, 30 comprobaciones SQL y el mapa, 11 de 11), web 579, fichas 68,
  precarga 32, QR, móvil 406 + 2 omitidas, herramientas al día, acceso 144.
  Gitleaks sin hallazgos en cada commit.
- **Capturas** a 390 × 844, dsf 2, en el scratchpad de la sesión
  (`corr-remates/capturas/`): Academy, Plataformas y ficha en inglés (web),
  índice de Academy en inglés con el aviso legal, tabla de Privacidad, ficha
  fija con la revisión caducada (12/11) y, en la app en inglés, Perfil,
  Academy y una lección con su aviso legal.

**Pendiente:** lo mismo que en la entrada anterior (catálogo, cuerpo de las
lecciones) y las decisiones de Víctor de arriba. En la ficha de plataforma,
los valores de la tabla de datos (acceso, tipo de activo, región) siguen en
castellano a propósito: se tratan como dato de la fuente.

---

## 4 de noviembre de 2026 (noche) · Claude · remates de web y app (sin publicar)

Víctor: «hasta que no esté todo no has acabado». Rama local `claude/remates`
(sale de `main` 2f9348d), commits f8f10a8…dae1ded. **Nada publicado, sin
push, Supabase y EAS sin tocar, sin OTA.** El `package.json` raíz y
`rwadar-movil/package.json`, `package-lock.json`, `app.json`, `eas.json` y
`scripts/` no cambian; `comprobar-ota-compatible.cjs --base c1f7106…` da ok.

- **Marca** (decisión de Víctor, fila 10): «Ofertas y plataformas
  tokenizadas» bajo el logo (cabecera y pie), en el título, el JSON-LD, el
  nombre al instalar y `og.png`; «Catálogo independiente» en vez de «Registro
  independiente». Inglés: «Tokenised offers and platforms». `og.mjs` incrusta
  ya las fuentes (antes salía con letra de sustitución), lleva el titular de la
  web y los sectores sin abreviar (filas 2, 71 y 92). La app no enseña
  subtítulo bajo el logo: no había dónde cambiarlo.
- **Academy desde Inicio** (decisión de Víctor): «¿Empiezas de cero? 7
  lecciones gratis en Academy ›» junto a «Mira, compara y decide tú», en la web
  (lo escribe `rwadar-academy.js` con el número real; solo se ve por
  debajo de 768 px, donde abre la pestaña Academy) y en la app (cuenta las lecciones
  publicadas y abre Academy). Inglés incluido.
- **Lista de frases, todo lo que vive en el código:** cuentas y seguimiento
  (49-51, 53, 54: «Seguir» y «lista de seguimiento» también en la app y en
  Privacidad; el aviso de correo sin Brevo ni «de extremo a extremo»), Academy
  (59-62, 64-69; solo títulos y rótulos, el cuerpo y las fechas de revisión
  legal de las lecciones no cambian), legales y comerciales (77, 78, 84, 85,
  88 y 89, sin cambiar ningún hecho; el ancla `#consultas-b2b` se queda), las
  partes que faltaban de 20, 23 y 39, y 6, 11, 13, 15, 16, 17, 21, 22, 26, 32,
  35, 37, 38, 42, 43, 44, 47 y 55 donde quedaban (sobre todo en la app). El
  texto centinela «Salida por volver a comprobar» cambia a la vez en web,
  fichas, `ficha-editorial` (web y app) y app.
- **App igual que la web:** la foto de la ficha sin etiqueta encima y con el
  pie «Imágenes ilustrativas, no fotos del activo» (el manifiesto exige ahora
  `pieVisibleObligatorio`; el alt sigue empezando por «Ilustración
  editorial»); «Ficha completa ↗» (abre /ofertas/<slug> con Linking) y
  «Compartir» (Share de react-native); la línea de novedades con el resumen
  corto (`rwadar-noticias.js` lo copia a la app); inglés que faltaba
  (categorías y niveles de Academy, chips con recuento, «Comprobado en»,
  etiquetas accesibles…).
- **Fuentes de Inicio en inglés:** `texto_en` en las 38 y `titulo_en` en los
  grupos; `fuentes.mjs` pinta las dos en la web (se ve la del idioma elegido) y
  genera `rwadar-movil/lib/inicio-fuentes.js`, que era copia a mano.
- **Fechas** de las fichas generadas en dd/mm/aaaa.
- **Prueba del mapa** al día: cuenta del catálogo (hoy 12 de 24 ofertas con
  ubicación), recoge el mapa nuevo (JSON local al abrir Mapa, `#mapaMargen`,
  marcadores agrupados por zoom, aviso sin teselas) y entra en la cadena
  `test` de `rwadar-app/package.json`.
- **Otros:** «Consúltalo en su web» no sale en grande donde va el precio; las
  tablas de las páginas legales caben a 390 px en Transparencia comercial.
- **Pruebas:** `npm test` completo en verde (rwadar-app con el mapa, 11
  pruebas; web 579; fichas 68; precarga 32; QR; móvil 406 + 2 omitidas;
  herramientas; acceso 144). Gitleaks sin hallazgos en cada commit.
- **Capturas** a 390 × 844, dsf 2, en el scratchpad de la sesión
  (`remates/`): cabecera (móvil y escritorio), Inicio con el enlace a Academy
  (web y app), ficha de la app, Academy (web y app), Transparencia comercial y
  Privacidad, y `og.png`.

**Pendiente:**
- **Ciclo de catálogo (otro agente, con permiso):** filas 11 (textos), 12, 18,
  19 y 75, anexos A y B y RealT. Esos textos siguen en castellano también en
  inglés: son datos.
- Las lecciones citan en su cuerpo «aprenderás a leer el radar» (lección 06),
  «Trazabilidad» (03) y «Mercado secundario»: cambiarlas obliga a renovar su
  fecha de revisión legal, así que no se han tocado.
- Las tablas de Privacidad siguen con desplazamiento lateral dentro de su caja
  a 390 px (como antes).
- Publicar web y OTA: lo hace el coordinador.

---

## 4 de noviembre de 2026 (tarde) · Claude · rediseño publicado en web y app

Víctor: «súbelo todo en cuanto esté». PR #47 (rediseño) y #48 (arreglo de la
OTA), unidas a `main` con merge commit.

- **Web:** preview y producción publicadas desde `main` (7df24f3) con
  `publicar.yml`; la comprobación automática pasa en las dos. Comprobado
  también con curl en producción: el nuevo Inicio, la barra de 5 y
  «Descartadas»; las fichas dan 200 y `/ofertas/mf-one` sigue en 404.
- **App:** OTA `ota-android.yml` al canal production, runtime `1.4.1(23)`,
  desde 8118886. La primera se paró en «Compatibilidad con el APK instalado»
  porque el `package.json` raíz había cambiado (solo `test:tools`). Ahora
  vuelve a ser el del APK y `generar.mjs --comprobar` lanza también
  `transparencia.mjs` y `fuentes.mjs` (PR #48). No comprobada en un móvil.
- **Sello:** `estado.json` sobre 031ac44, auditoría «LISTO PARA CORTE FINAL».
- **Las entradas de abajo marcadas «sin publicar» ya están publicadas.**
- **Pendiente:**
  - textos del catálogo en Supabase (alertas y notas de plataformas, Reental,
    RealT): necesitan un ciclo de catálogo con permiso de Víctor;
  - decisiones de Víctor sobre el subtítulo «Registro de tokenización» y sobre
    el acceso a Academy desde Inicio;
  - `rwadar-app/probar-mapa-buscar.test.cjs` está fuera de `npm test` y espera
    49 ofertas: hay que ponerlo al día.

## 4 de noviembre de 2026 (5) · Claude · revisión app frente a web final y arreglos pequeños (sin publicar)

- Rama local `claude/inicio-historia`, commits 8f2332b y 3e36d1d (**nada publicado, sin push, Supabase y EAS sin tocar, sin OTA**; `package.json`, `app.json`, `eas.json` y `scripts/` sin cambios desde 6b008ca). Comparado el texto visible de Inicio, Ofertas (las tres pestañas), la ficha (Robinhood, mTBILL, Boss Info) y el inglés en Expo web y en la web local: portada con «Fuentes» como la web; fila con el estado de la web («Cifras por actualizar», «Fuentes en conflicto», «Liquidez no confirmada», «Apertura no confirmada») en ámbar y la fecha de la revisión; reventa y próximas enseñan su mínimo y su salida documentados (antes «No verificado» en todas, porque el catálogo remoto las marca `cifrasPendientes`); «Otras ofertas principales» y buscador «Ej.: Spiko, Suiza…»; en la ficha, «Cifras» solo con el estado, la salida sin «Salida:» y los costes con la métrica. Zonas de toque ≥ 44 px. `npm test` completo en verde (móvil 406 + 2 omitidas). Pendiente (fuera de `rwadar-movil/`): la línea de novedades de la app usa el `titulo` y no el `resumen` porque `rwadar-noticias.js` no copia `resumen` a la app.

## 4 de noviembre de 2026 (4) · Claude · la app dice y enseña lo mismo que la web final (sin publicar)

- Rama local `claude/inicio-historia`, commits a485ded…a787dde encima del merge 6b008ca (**nada publicado, sin push, Supabase y EAS sin tocar, sin OTA**): Inicio con los textos cortos de la web (03 con carrusel de 5, nota legal corta con la completa plegada, aviso de riesgo junto a «Mira, compara y decide tú», «Ver las 24 ofertas» en el 06); ficha de oferta como `abrirDetalleOfertaLocal` («Lo esencial» y avisos arriba; «Antes de invertir», «No es una recomendación…» y «Ver oferta en <proveedor> ↗»; lo demás plegado; sin «Consultar fuente» grande); «Cifras válidas N días más», comprobación 2 y «Inscrita en la CNMV (UE)», «Selección RWAdar · pasan nuestras 5 comprobaciones», pestañas de Ofertas en inglés y fechas dd/mm/aaaa; fila con los puntos fuertes en la columna del texto; diccionario con 5 claves nuevas y una repetida fuera, copiado a la web; `npm test` completo en verde (móvil 406 + 2 omitidas); capturas en el scratchpad (`app-final/`). Pendiente: la app conserva su etiqueta obligatoria «Ilustración editorial» sobre la foto en vez del pie «Imágenes ilustrativas…», y no tiene «Ficha completa · Copiar enlace».

## 4 de noviembre de 2026 · Claude · corrector del Inicio: menos reglas, más fácil de leer (sin publicar)

Rama local `claude/inicio-historia`, commits c6a5475…0004444 (encima de
61cf23e). **Nada publicado, nada en `main`, Supabase sin tocar, sin push.**

- **Pruebas de frases, fuera** (decisión de Víctor del 04/11: «ese tipo de
  reglas quítalas… hay que tener en cuenta la legalidad y ya está»). Se
  quitan de `probar-web.mjs` la lista de frases prohibidas, la de llamadas
  [n], la de «Descartadas»/«Fuera del radar», la del tamaño de los avisos, la
  de notas x/5 y las frases exactas de Inicio, Perfil, Avisos, Buscar, la
  Selección y la ficha; en `probar-para-empresas.mjs`, «no es una oferta
  comercial» (y se aplica la fila 83). Se quedan las funcionales. Los avisos
  legales siguen en la web: los cuida la revisión editorial.
- **Inicio más corto** (textos del revisor de lectura, con su inglés): de
  1.833 a 1.118 palabras visibles y de 10.215 a 7.873 px a 390. Capítulo 03 con
  dos frases y un carrusel de 5 («1 de 5»); lo que sale de la vista va al
  «Saber más» de su capítulo, con las mismas fuentes. Aviso de riesgo junto a
  «Mira, compara y decide tú»; nota legal corta con la completa plegada;
  «Ver las 24 ofertas» junto a «Explorar el radar» en el 06.
- **Ficha de oferta:** «Lo esencial» y «Avisos de esta oferta» arriba;
  luego foto, «Antes de invertir», «No es una recomendación de inversión…»
  y «Ver oferta en <proveedor> ↗»; lo demás plegado. Robinhood: de 3.891 a
  1.978 px y los avisos a 641 px (antes, 3.241). El pie era un `<footer>` y la
  regla global lo ocultaba en el móvil. Página fija: supervisión con el
  motivo de la comprobación, los avisos arriba y el botón tras los riesgos.
- **Legal:** la comprobación 2 dice «autorizada por un supervisor de la UE e
  inscrita en la CNMV» y la cápsula «Inscrita en la CNMV (UE)»
  (`transparencia.json`, regenerado para web y app).
- **Otros:** «cifras válidas 6 días más»; fechas dd/mm/aaaa en la web
  dinámica (y el pie); Plataformas con la foto limpia y el texto debajo; el
  orden de Ofertas cabe entero; «Descartadas» en Academy, la noticia del
  28/09, /cambios y el RSS (regenera `academy-contenido.js` y
  `noticias-contenido.js` de la app); «Excluded» en inglés; Atrás cierra la
  ficha sin salir de la web y, desde Inicio, vuelve a Inicio; /#fuera y
  /#metodo abren su detalle y /#fuentes-cap3 se queda en Inicio; con el
  catálogo caducado, pasar de inglés a castellano ya no deja la portada en
  inglés (`data-rel-sin`); 320 px sin cortes; Academy y páginas legales sin
  mayúsculas de máquina ni borde verde.
- **Pruebas:** `npm test` completo en verde (web 579, fichas 68, precarga 32,
  móvil 394 + 2 omitidas, acceso 144, base de datos sin fallos).
  `probar-orden.mjs` solo avisa de `App.js`, como antes. CSS 165 279 B,
  `probar-web.mjs` 238 362 B. Capturas y `medidas.json` en el scratchpad de
  la sesión (`inicio-real/`), 0 errores y 0 peticiones externas.

**Pendiente:**
- **Víctor:** la línea de posiciones propias de la nota legal (MAR art. 20;
  no se ha escrito nada sin su respuesta), el relato en escritorio, el acceso
  a Academy desde Inicio (ya no lo frena ninguna prueba), el subtítulo
  «Registro de tokenización».
- **Ciclo de catálogo (con su permiso):** RealT («la mayor demanda…», «En
  liquidación» → «Liquidación anunciada», «unos 700»), la categoría de los
  derivados y la métrica de costes en castellano donde no exista.
- **Sin hacer por tamaño:** las 38 descripciones de fuentes en inglés
  (`texto_en` en `fuentes.json`), el texto del enlace de cada fuente, la
  página fija con todo plegado como la ficha y la app (otro agente).

## 4 de noviembre de 2026 · Claude · correcciones del revisor en el mapa de Ofertas (sin publicar)

Misma rama local `claude/mapa-ofertas`, commits efb366c, f095a09, f10ecf7 y
ad2749c sobre la entrada de abajo. **Nada publicado, sin push, Supabase sin
tocar.** Solo los tres archivos del mapa, el bloque `#buscarMapa` de
`index.html` y cuatro entradas junto a las del mapa en `idioma-en.js`
(copiadas con `copiar-idiomas-web.cjs`).

- **Marcadores que se tapaban:** `agruparCerca()` (en `mapa-buscar-util`)
  junta los que en pantalla quedarían a menos de 40 px con el zoom actual y
  se rehace al cambiar de zoom (si los grupos no cambian, no se toca nada y
  la ficha sigue abierta). El grupo muestra el número; su ficha dice «N
  ofertas en esta zona» y, si los puntos no son el mismo, trae «Acercar»,
  que amplía hasta separarlos. Leyenda: «Varias ofertas juntas». Medido: 0
  marcadores tapados a 320, 360, 390 y 1366 px, en castellano e inglés.
- **Teclado:** al abrir una ficha el foco va a su título; Escape (Leaflet no
  lo atendía con el foco dentro), la X o «Acercar» lo devuelven al marcador.
  «Quitar mi ubicación» pasa el foco a «Usar mi ubicación».
- **Avisos en una franja arriba del mapa** (`#mapaAvisos`, fuera del lienzo
  de Leaflet): «No se ha podido cargar el mapa base» con «Reintentar» ya no
  queda bajo los puntos, y los avisos que piden hacer algo (ubicación
  denegada, zona sin resultados) salen ahí con una X en vez de empujar los
  mandos. Antes de cargar siguen bajo la tarjeta. La ficha se abre por
  debajo de la franja y con alto máximo que no tapa el zoom.
- **Chips:** «Buscar aquí» (con `title` «Buscar en la zona visible del
  mapa») y «Quitar mi ubicación» baja junto a la línea de distancias. Caben
  en una línea de 320 a 1366 px; si no cupieran (iOS pone el selector a
  16 px), bajan de línea en vez de cortarse.
- **Contraste:** aro oscuro fino por fuera del blanco en cada marcador
  (borde 7,2:1 sobre el mapa claro). «Fuente» de la ficha, gris como se
  quería.
- **«Usar mi ubicación» desde España** encuadra tu punto y las tres ofertas
  más cercanas (hoy, un grupo «12» en Austria), en vez de un zoom 10 vacío.
- **Cifras con el idioma:** «1,558 km» y «± 15 km» en inglés (antes
  «± 15.000 m»); de 1 km en adelante el margen va en km.
- **Pruebas:** `npm test` completo en verde (probar-web 578 correctas;
  fichas 68; precarga 32; móvil 394; acceso 144; base de datos sin fallos).
  `probar-web.mjs` sin cambios. `rwadar-app/probar-mapa-buscar.test.cjs`
  sigue fuera de `npm test` y falla los mismos 6 de 10 que antes, por las
  mismas razones (catálogo de 49, JSON local al abrir Mapa, margen en
  `#mapaMargen`); no lo toqué porque estaba fuera del alcance de esta tanda.
- Capturas con teselas reales en el scratchpad de la sesión (`mapa/`, con
  `medidas.json`): 19 teselas nuevas bajadas con curl, 49 en la caché (tope
  80). Antes de «Cargar mapa», 0 teselas y sin Leaflet.

**Pendiente:** actualizar `probar-mapa-buscar.test.cjs` (24 ofertas, 12 con
ubicación, una petición local antes de cargar, margen en `#mapaMargen`) y
meterlo en `npm test`, si Víctor quiere. Publicar necesita su permiso.

---

## 4 de noviembre de 2026 · Claude · mapa de Ofertas claro (sin publicar)

Rama local `claude/mapa-ofertas` (sale de `claude/inicio-historia`), commits
25a3a14 y c341f0e. **Nada publicado, nada en `main`, Supabase sin tocar, app
sin tocar** (salvo el diccionario común `rwadar-movil/lib/idioma-en.js`).
Decisión de Víctor del 04/11: «Oscuro no me gusta el mapa, mejóralo».

- **Solo** `mapa-buscar-20261027.js`, `mapa-buscar-20261027.css`, el bloque
  `#buscarMapa` de `index.html` y 69 entradas de inglés junto a «Lista» y
  «Mapa» en `idioma-en.js` (copiadas con `copiar-idiomas-web.cjs`).
  `mapa-buscar-util-20261027.js` no cambia.
- **Antes de cargar:** «Dónde están los activos», «12 de 24 ofertas tienen
  ubicación documentada» (sale del JSON local de ubicaciones, que ahora se
  pide al abrir Mapa; es del propio sitio y no contacta con OpenStreetMap),
  una línea de privacidad, «Cargar mapa» y el detalle en «Más información».
- **Mandos:** buscador con botón de icono y «Usar mi ubicación» como botón de
  icono en una fila; selector «Todas», «Ver todo» y «Buscar en esta zona»
  como chips de 36 px en la segunda (caben enteros a 390 px). La instrucción
  queda para el lector de pantalla. Los avisos rutinarios solo se anuncian;
  los que piden hacer algo (permiso denegado, fallo) también se ven.
- **Mapa claro:** teselas estándar de OpenStreetMap sin filtro oscuro, solo
  `saturate(.72)`; 60 vh en el móvil, a todo el ancho y con radio de 16 px.
  Zoom blanco de 44 px abajo a la derecha. Si no llega ninguna tesela, aviso
  blanco «No se ha podido cargar el mapa base» con «Reintentar», bajo los
  puntos y la ficha. Las teselas se piden ya con la vista ajustada a las
  ofertas (antes se pedía primero el mundo entero). Fuera el
  `mix-blend-mode: plus-lighter` de Leaflet en las teselas: con el lienzo en
  fracción de píxel dejaba una raya blanca en cada junta.
- **Marcadores:** `divIcon` con el color de su tipo (clases `cat-N` del
  radar), icono del tipo o el número centrado si hay varias en el mismo
  punto, 44 px de toque; «ciudad aproximada» con halo. Leyenda bajo el mapa
  con los tipos presentes.
- **Ficha emergente blanca:** título en dos líneas que no tapa nada, tipo y
  colección, lugar, precisión en una línea («Punto indicado por el proveedor»
  o «Ciudad aproximada»), «Ver ficha» (abre la misma ficha que la lista:
  botón con `data-oferta-detalle`; Leaflet 1.9 deja subir el clic) y la fuente
  con su fecha. AutoPan con margen calculado al abrir: cabecera fija, barra
  inferior y zoom.
- **Debajo del mapa** (al lado en escritorio): «N ofertas en el mapa / en
  esta zona / por distancia a tu ubicación» y filas compactas con miniatura,
  como las de Ofertas; toda la fila abre la ficha, la fuente abre su pestaña.
  Las notas de precisión del JSON van una sola vez en el pie.
- **Privacidad igual:** teselas solo tras «Cargar mapa» (comprobado: 0
  teselas y 0 Leaflet antes), aviso de IP, ubicación con permiso, una vez y
  sin guardar, atribución de OpenStreetMap.
- **Pruebas:** `probar-web.mjs` sin cambios (578 correctas). `npm test`
  completo en verde. Ojo: `rwadar-app/probar-mapa-buscar.test.cjs` no está en
  `npm test` y ya fallaba 5 de 10 antes de este cambio (espera el catálogo de
  49 y hoy hay 24). Ahora fallan además, a propósito, dos comprobaciones: que
  abrir Mapa no pida nada (pide el JSON local para la cuenta) y que «140 m»
  esté en `#mapaOrigen` (el margen va en `#mapaMargen` para que la frase se
  traduzca). Siguen bien la del publicador, la de Leaflet y la de cabeceras.
- Capturas con teselas reales (30 descargadas con curl a una caché, de un
  máximo de 80) a 390 × 844 y 1366 × 900 en el scratchpad de la sesión
  (`mapa/`), con `medidas.json`; inglés comprobado sin restos en castellano.

**Pendiente:** actualizar `probar-mapa-buscar.test.cjs` al catálogo de 24 y
meterlo en `npm test`, si Víctor quiere. Publicar necesita su permiso.

---

## 4 de noviembre de 2026 · Claude · Inicio como historia, barra de 5 y «Descartadas» (sin publicar)

Rama local `claude/inicio-historia` (sale de `claude/acabados`), commits
cc11db1…fe349fb. **Nada publicado, nada en `main`, Supabase sin tocar, app sin
tocar** (salvo el diccionario `rwadar-movil/lib/idioma-en.js`, que es común).

- **Inicio cuenta la historia** de HISTORIA-v2 con el orden de ESPEC-INICIO:
  radar vivo arriba, seis capítulos, novedades, Selección con sus 5
  comprobaciones a la vista, «Mira, compara y decide tú», fuentes y nota legal.
  Sin buscador. La comunidad pasa a Perfil.
- **Texto limpio, sin llamadas [n]** (decisión de Víctor del 04/11: «Los
  números 9 10 14 18, ¿los puedes quitar del texto?»). Cada apartado acaba en
  «Fuentes de este apartado ›», que abre su grupo en la lista del final, con
  «Volver al texto». Las 38 fuentes viven en
  `rwadar-editorial-source/inicio/fuentes.json` y las escribe `fuentes.mjs`
  (con `--comprobar` en `test:tools`).
- **Cifras del catálogo** (24, 26, 4, 3, 5, «una de ellas, de 1 $», fechas) solo
  en `cifrasInicio()`; sin catálogo vigente se ocultan la Selección, los
  mínimos y la vigencia, y la línea de riesgo se queda.
- **Barra de 5:** Inicio · Ofertas · Plataformas · Academy · Perfil. Fuera el
  selector de Buscar; la vista sigue en `body[data-movil-buscar]`. Siguen
  igual `data-movil-ir`, `data-movil-tab`, los hash (`#tool` marca
  Plataformas), «Explorar el radar», las fichas y su vuelta. Escritorio igual.
- **«Descartadas»** («Discarded» en inglés) en todos los rótulos de la web y en
  las fichas de descarte («… · Plataforma descartada»). La ruta
  `/fuera-del-radar/` y `#fuera` no cambian.
- **Frases de LISTA-FINAL.md** que están en el código de la web: filas 1-3,
  5, 7-9, 11 (solo el rótulo), 13, 16, 20, 22, 23 (solo la tercera frase),
  24-34, 35, 36-42, 44-48, 52, 55-58, 63, 70-74, 76, 77, 79-83, 85-87, 89-91
  y 93, con su inglés.
- **Inglés:** Inicio entero (comprobado: ningún texto en castellano queda en
  el panel) y las frases nuevas; plantillas propias en `idioma-web`.
- **Pruebas** (`probar-web.mjs`, comentario con la decisión en cada cambio):
  la barra pasa a 5 botones, Inicio nuevo, Selección, comprobaciones y cifras;
  nuevas: sin `[n]` visible y cada apartado con su grupo de fuentes, frases
  prohibidas, «Descartadas» sí y «Fuera del radar» no, y los enlaces de
  siempre. Los arneses del service worker pasan a `probar-web-pwa.mjs` para
  que `probar-web.mjs` siga por debajo de su presupuesto (239 854 B). También
  `probar-fichas.cjs`, `rwadar-app/probar-verificacion-local-ui.mjs` y
  `rwadar-app/probar-transparencia-comercial.mjs` (frases nuevas).
- `npm test` completo en verde; `probar-orden.mjs` solo avisa de `App.js`,
  como antes. CSS 165 074 B (de 155 166), JS 381 378 B.
- Capturas a 390 × 844, 360 × 780, 375 × 667 y 1366 × 900, y `medidas.json`, en
  el scratchpad de la sesión (`inicio-real/`). La portada mide lo mismo que la
  maqueta: botón 595-643, aviso 651-723 y «Explorar el radar» 723-767 a 390 px.

**Pendiente:**
- **Datos del catálogo (ciclo con permiso de Víctor):** avisos y notas de
  plataforma (filas 11-12, anexos A y B), Reental (18), «Marketplace» (19) y
  el motivo de Toucan (75).
- **Decisión de Víctor:** el subtítulo «Registro de tokenización» (fila 10 y
  92, con `og.png`), el acceso a Academy desde Inicio, sus posiciones propias,
  la relación pagada y «la mayor demanda» de RealT (ESPEC-INICIO §10).
- **Ciclo de la app** (mismo texto o pruebas de paridad en `rwadar-movil`):
  filas 14, 17, 23 (dos primeras frases) y 43; «Descartadas» en `App.js`,
  `Inicio.js`, Academy y noticias (`noticias.json` y `academy.json` reescriben
  archivos de la app; por eso «Fuera del radar» sigue en las lecciones, en
  `/cambios` y en el RSS), y la barra de 5 en la app.
- **No aplicadas por ahora:** cuentas y vigilancia (49-51, 53, 54: la cuenta
  está en pausa y sus pruebas fijan esas frases), Academy (59-62, 64-69),
  conversión y B2B (78, 84, 88), y la fila 83 conserva «no es una oferta
  comercial» porque lo exige `probar-para-empresas.mjs`.
- `transparencia.json` sigue con sus criterios antiguos: Inicio enseña los de
  HISTORIA-v2 en llano y la ficha los del archivo (cambiarlo reescribe
  `rwadar-movil/lib/transparencia-contenido.js`).
- Notas del coordinador, confirmadas: portadas de Plataformas con texto y
  cápsula encima, «Cifras vigentes 6 d» y el «Consultar fuente» grande en el
  sitio del precio de la ficha. El tren del capítulo 6 es el único y no mete
  prisa.
- Publicar necesita el permiso de Víctor.

## 4 de noviembre de 2026 (3) · Claude · corrector del port a la app (sin publicar)

Misma rama local `claude/app-rediseno`, commits 9c8fcd9…12e8d44 encima de
7b09367, solo en `rwadar-movil/` y este archivo. **Nada publicado, sin push,
sin OTA ni EAS, Supabase sin tocar**, sin dependencias ni código nativo; ni
`package.json`, ni `app.json`, ni `eas.json`, ni `scripts/`, ni la web.

- **Aviso de riesgo medido** (ESPEC-INICIO §3): va antes del botón si,
  después, quedaría bajo la barra (lo mide con `onLayout`, así que cuenta la
  letra grande de Android y «Revisión pendiente» arriba). Medido en Expo
  web: 390 × 844 aviso después (botón 608-656, aviso 666-738, barra 776);
  360 × 780, 375 × 667, 320 × 640 y 390 × 844 caducado, aviso antes y
  entero sobre la barra. A 375 × 667 el botón ya cabe entero (518-566,
  barra 599): radar de 132 px y márgenes más cortos.
- **«Está en «Descartadas»»** abre Plataformas y baja a «Descartadas»
  (estaba 5.924 px más abajo). Captura `09-tras-descartadas.png`.
- **Inglés «Excluded»** (ESPEC §2.11 y HISTORIA-v2), no «Discarded»: 1
  entrada de `lib/idioma-en.js` y **3** de `lib/inicio-contenido.js`
  (no 2, como decía la entrada de abajo), con «we exclude».
- **Selección de Inicio como la web:** solo principales, en el orden de la
  web (Robinhood, Euro, Dólar), nota de riesgo de respaldo «Puedes perder
  parte o todo lo que inviertas.» si entra otra oferta, y «1 $».
- **Las cifras de mercado del 03 caducan solas:** pasados 7 días desde
  `CIFRAS_MERCADO_EL` (`lib/inicio-contenido.js`, hoy 2026-11-03) se quitan
  125, 14.230 millones, −3,9 % y las barras, y queda una frase sin cifra
  (`10-mercado-caducado.png`, reloj al 11/11). **Al rehacer las cifras en
  cada ciclo, cambiar a la vez el texto y esa fecha** (la prueba lo exige).
- **Menores:** «Fuentes de este apartado» del 05 antes del puente;
  «¿Cómo ordenamos?» solo nombra la Selección cuando la lista la lleva;
  cita a 28 y cifras a 36; «Revisión pendiente» sin mono; Academy sin mono;
  radios sueltos a R (BloqueoApp, Cuenta, segmentado); los enlaces de una
  fuente en fila (Inicio) y la fecha junto al enlace (ficha).
- **No hecho, a propósito:** puntos suspensivos en la barra (la prueba de
  `radar-geometria` prohíbe `numberOfLines` y `maxFontSizeMultiplier` en la
  barra para no bloquear la letra del sistema; que lo decida Víctor) y los
  nombres y el solape del radar de Plataformas («Materias primas» pisaría
  más el punto naranja; necesita recolocar rótulos).
- **CONDICIÓN DE LA OTA:** no enviarla hasta regenerar
  `lib/academy-contenido.js` y `lib/noticias-contenido.js` desde
  `rwadar-academy/` y `rwadar-noticias/` con «Descartadas» (hoy dicen
  «Fuera del radar» en 7 sitios de Academy). Es de la web: no se toca aquí.
- **Pruebas:** `npm --prefix rwadar-movil test` 408: 406 bien, 0 fallos y
  2 omitidas. Nuevas en `inicio-historia` (orden y nota de la Selección,
  caducidad de las cifras); cambiadas con comentario: el aviso medido y
  «Excluded» (`inicio-historia`) y el simulador de tema con `R`
  (`desbloqueo-app`).
- **Capturas** rehechas desde HEAD en el scratchpad, `app-rediseno/01` a
  `07`, más `08-inicio-360x780.png`, `09-tras-descartadas.png` y
  `10-mercado-caducado.png`. 0 errores y 0 peticiones externas.

## 4 de noviembre de 2026 (2) · Claude · la app con el rediseño de la web (sin publicar)

Rama local `claude/app-rediseno` (sale de `claude/acabados`, 2bcbd20), commits
d73ccc4…e4521db, solo en `rwadar-movil/`. **Nada publicado, sin OTA ni EAS,
Supabase sin tocar, sin dependencias ni código nativo** (todo cabe en una OTA).
Ni `package.json`, ni `app.json`, ni `eas.json`, ni `scripts/`, ni la web.

- **Acabados** (`lib/tema.js`, GUIA-ACABADOS §13): superficies s0-s3,
  relleno tonal, una sola línea al 8 %, radios 8 · 12 · 16 · 24 · píldora,
  dos elevaciones, tres botones con su pulsado (sin encoger con «reducir
  movimiento»), chips tonales sin borde, ✓ en texto, rótulos en frase normal
  y sin mono (la mono queda en las cifras del radar). Cabecera y barra opacas.
- **Barra de 5:** Inicio · Ofertas · Plataformas · Academy · Perfil. Fuera
  el selector de Buscar; Ofertas y Plataformas son sus dos vistas, así que
  los avisos, Academy, «fuera» y Perfil siguen llevando a donde iban. Las
  fichas se cierran con Atrás como antes (`onRequestClose`). El idioma, solo
  arriba de Perfil.
- **Ofertas:** fila compacta de la web (miniatura, 2 líneas, proveedor y
  lugar, 2 puntos fuertes ✓, Mínimo · España · Salida cortos, «Revisa · N
  avisos en la ficha», fecha y «Ver ficha»). Arriba, «Selección RWAdar · la
  documentación más completa» con «No es una recomendación de inversión» y
  luego «Resto de principales». `lib/transparencia.js` copia la lógica de la
  web y falla cerrado; con el catálogo de hoy salen las mismas 3.
- **Ficha:** «Transparencia: lo que hemos comprobado», con ✓/✗, el motivo y
  la fuente con su fecha, y los puntos fuertes con su fuente.
- **Inicio como historia** (ESPEC-INICIO y HISTORIA-v2, titular n.º 1):
  radar vivo sin buscador y con sus 4 cifras, «Ver las 24 ofertas» con el
  aviso pegado (antes del botón por debajo de 700 px), seis capítulos,
  novedad, Selección con las 5 comprobaciones a la vista, «Mira, compara y
  decide tú», fuentes y nota legal. **Sin llamadas [n]** (decisión de
  Víctor): cada apartado acaba en «Fuentes de este apartado», que abre la
  lista agrupada y baja a su grupo. Las cifras salen del catálogo y sin
  catálogo vigente no hay Selección, mínimos ni vigencia.
- **«Descartadas»** en la app; en inglés quedó «Excluded» en la entrada (3),
  como manda ESPEC-INICIO §2.11 (1 entrada de `lib/idioma-en.js` y 3 de
  `lib/inicio-contenido.js`).
- **Inglés:** 54 entradas nuevas al final de `lib/idioma-en.js`; el texto
  de Inicio va en `lib/inicio-contenido.js` en los dos idiomas.
- **Pruebas:** `npm --prefix rwadar-movil test` 406, 404 bien y 2 omitidas.
  Nuevas: `transparencia.test.cjs` (5) e `inicio-historia.test.cjs` (5).
  Cambiadas con comentario: barra de 5 y sin `SelectorBuscar`
  (`navegacion`), rótulo de barra a 11 px (`radar-geometria`), fila compacta
  (`ofertas-presentacion`, `ofertas-vigencia`) y rótulos en frase normal
  (`academy`, `cuentas-ui`, `verificacion-local`, `navegacion`).
- **Capturas** (Expo web en local, sin red, 390 × 844 y dsf 2) en el
  scratchpad de la sesión, `app-rediseno/01-inicio.png` a `07-ingles.png`,
  más `01b-inicio-375x667.png` y `02b-fuentes-del-apartado.png`. La cuenta se
  simula con el catálogo publicado (`app-rediseno/scripts/preparar.sh`).
- **Al mezclar con la web:** las dos ramas añaden entradas al final de
  `rwadar-movil/lib/idioma-en.js` (choque trivial: quedarse con las dos).
  Después, `node rwadar-movil/scripts/copiar-idiomas-web.cjs`, porque el
  `test:tools` de la raíz exige la copia idéntica en la web.
- **Pendiente:** regenerar `lib/academy-contenido.js` y
  `lib/noticias-contenido.js` cuando la web cambie «Fuera del radar» en
  `rwadar-academy/` y `rwadar-noticias/` (son generados); que
  `rwadar-editorial-source/inicio/fuentes.mjs` escriba también
  `lib/inicio-fuentes.js`; la etiqueta sobre la foto grande de la ficha
  (la web ya la quitó); probarlo en un Android real; y la OTA, solo con el
  permiso expreso de Víctor.

## 4 de noviembre de 2026 · Claude · acabados de la web (sin publicar)

Rama local `claude/acabados` (sale de 1b0e1e3), commits 53bb826…8a6afdb.
**Nada publicado, nada en `main`, Supabase sin tocar.** Aplica la guía de
acabados del diseñador (botones, bordes y rótulos que «se veían baratos»)
al CSS real, sustituyendo reglas, sin una capa encima.

- **Tokens** en `:root`: superficies, relleno tonal, una sola línea al 8 %,
  radios 8 · 12 · 16 · 24 · píldora, dos elevaciones, escala de letra y
  movimiento de 120-200 ms sin rebote. Los tokens viejos apuntan a los nuevos.
- **Botones:** tres (verde relleno, tonal y de texto) y uno de icono
  redondo de 44 px, cada uno en una sola regla; al pulsar se oscurecen y
  encogen (nada con «reducir movimiento»). «Ver ficha» no encoge (su
  `::after` abre la fila). Segmentados: la opción elegida en relieve, nunca
  en verde; el idioma, con la misma paleta y foco verde.
- **Chips, etiquetas y ✓:** píldora tonal sin borde (la elegida, blanca);
  etiquetas de estado en un rectángulo de 8 px y frase normal; el punto
  fuerte es texto con ✓ verde, sin cápsula.
- **Cajas:** una línea tenue y un solo nivel de caja (Academy, Perfil,
  ficha); vacíos sin discontinuas; campos tonales; fuera todo el cristal
  y las sombras sueltas; cabecera y barra opacas, también en escritorio.
- **Rótulos:** de mayúsculas de máquina a frase normal de 12 px; la mono
  solo en el radar. 16 textos del HTML/JS pasan a frase normal y sus claves
  de `idioma-en.js` también (el motor sigue traduciendo la versión en
  mayúsculas que usa la app); copiado a la web.
- **Iconos:** un solo trazo de 1,75; SVG en el menú de Perfil y en la
  estrella; chevrones de trazo. **Pesos** 400-700 e interletraje −.02em.
- **Pruebas cambiadas** (`probar-web.mjs`, comentario que cita la guía):
  la barra inferior sobre `--noche` (§6), «Ofertas específicas» en frase
  normal (§12.4) y el microtexto del secundario a 12 px (§5).
- **Medidas** (`medidas.json` y capturas antes/después en el scratchpad de
  la sesión): CSS 177 610 → 155 166 B; radios 35 → 15, bordes 33 → 20,
  sombras 29 → 7, cristal 14 → 0, mayúsculas 45 → 5; 4 filas enteras en
  Ofertas y Reventa a 390 px; CLS de Inicio en escritorio 0,039 → 0,000
  (el selector de idioma tiene su hueco reservado).
- `npm test` completo en verde; `probar-orden.mjs` solo avisa de `App.js`.
- **Pendiente:** la escala de letra completa (quedan 79 tamaños; solo se
  subieron los de menos de 11 px y los rótulos); las páginas sueltas con
  su propia hoja (lecciones de Academy, privacidad, 404); la app (§13 de la
  guía); los chips de Plataformas en una fila desplazable. Inicio, el
  cambio a «Descartadas» y la barra de 5 botones van en el paso de Inicio.
  Publicar necesita el permiso de Víctor.

## 3 de noviembre de 2026 (noche, 2) · Claude · corrección de la versión final de Inicio y Buscar (sin publicar)

Misma rama local `claude/rediseno-final-wf1`, seis commits sobre la entrada
de abajo. **Nada publicado, nada en `main`, Supabase sin tocar.** Recoge lo
que el corrector anterior dejó a medias y los fallos de la revisión.

- **Buscar › Ofertas:** fila compacta (todo junto a la miniatura y el pie
  debajo): 146-183 px, 4 filas enteras por pantalla a 390×844 desde
  cualquier fila (Principales y Reventa) y la primera en y=520. Mínimo, España y Salida
  a 12 px; el lugar nunca se corta; puntos fuertes y estado como texto, sin
  cápsulas. Chips y estrella con diana de 44 px; el orden del foco sigue al de
  la vista (Lista/Mapa va justo después del buscador, también en escritorio);
  «Ordenar por» ya no corta «Fuente y fecha»; recuento visible al filtrar;
  cabecera y barra inferior opacas; `scroll-padding-bottom` para que la barra
  no tape el foco. En escritorio vuelven los datos largos de las tarjetas.
- **Transparencia:** con el catálogo caducado «se contrata hoy» y «mínimo y
  salida» pasan a ✗ («pendiente de revalidar»), en la ficha y en la página
  fija (`ficha-pagina` lo mira con la fecha de hoy). La página fija enlaza la
  fuente fechada de las cuatro primeras, como la ficha. Una oferta con aviso
  crítico (tono stop) nunca entra en la Selección y su tarjeta de Inicio lo
  enseña entero. «Revisa · N avisos» cuenta también el aviso general, como la
  ficha.
- **Inglés:** solo `transparencia.json`, los datos del catálogo y el nombre
  de cada fuente quedan como texto de la fuente; los motivos que escribe
  RWAdar se traducen (27 frases y 3 patrones nuevos). Inicio ya no lleva el
  rótulo «Original source text (Spanish)».
- **Inicio (solo lo barato; se rehará entero):** fuera el botón con aspecto de
  buscador; tarjetas de los carruseles del mismo ancho; leyenda oculta de
  verdad con el catálogo caducado; recuentos del radar para el lector de
  pantalla; vigencia a 12 px; la tarjeta enfocada entra entera en su
  carrusel; «reducir movimiento» solo repinta el radar (no se pierde el foco).
- **Presupuestos:** CSS 177 610 B (comentarios largos en una línea);
  `probar-web.mjs` por debajo de 240 000 B. `probar-orden.mjs` solo avisa de
  `App.js`, como antes.
- **Pruebas:** 10 nuevas en `probar-web.mjs` y 2 en `probar-fichas.cjs`;
  `npm test` completo en verde.
- **Pendiente:** lo mismo que abajo (sellar, merge commit y permiso de Víctor
  para preview, producción y OTA), y la guía de acabados, que va en un paso
  aparte. Ver «No corregido» en el informe de esta corrección.

## 3 de noviembre de 2026 (noche) · Claude · versión final de Inicio y Buscar en la web móvil (sin publicar)

Víctor y Claude como CEO decidieron la versión final (base A «radar vivo» con
injertos de B y C). Rama local `claude/rediseno-final-wf1` (parte de
`claude/rediseno-inicio-buscar`, 7b951ed). **Nada publicado, nada en `main`,
Supabase sin tocar.** Falta sellar y el permiso de Víctor para publicar.

- **Transparencia (datos):** `rwadar-editorial-source/ofertas/transparencia.mjs`
  valida `transparencia.json` contra el catálogo publicado (slug y
  `verificadaEl`, textos cortos de 40 caracteres, sin «%», «rentab»,
  «garantiz», «benefici», «gananci», «recomend» ni «mejor», fuentes https) y
  escribe el bloque `TRANSPARENCIA_POR_SLUG` del JS web y
  `rwadar-movil/lib/transparencia-contenido.js`. Su `--comprobar` va en
  `test:tools`. **En cada ciclo del catálogo hay que revisar este archivo:** si
  cambia la `verificadaEl` de una oferta, `npm test` se para y la web no
  enseña nada de esa oferta (falla cerrado).
- **Imágenes limpias:** fuera todas las etiquetas sobre las fotos (tarjetas,
  filas, carruseles, detalle, galería). El `alt` sigue empezando por
  «Ilustración editorial»; línea visible «Imágenes ilustrativas, no fotos del
  activo» bajo la lista, cada carrusel y la foto del detalle, y «Portadas
  ilustrativas, no logotipos ni fotos de la empresa» bajo la galería.
- **Inicio:** radar vivo con los nombres cortos (Inmobiliario, Crédito,
  Tesoro, Acciones, Materias primas, Infraestructura), leyenda «Plataformas
  por tipo de activo», esquinas, vigencia «Revisado el … · vigente hasta el
  …» con pastilla «Vigente» (o «Revisión pendiente» y sin cifras), etiqueta
  «REGISTRO INDEPENDIENTE · NO VENDE NI ASESORA», botón con aspecto de
  buscador que enfoca `#emiBuscar`, «Ver ofertas» y «Ver plataformas»;
  carruseles «Selección RWAdar · la documentación más completa» (las 3 que
  cumplen las 5 comprobaciones; «No es una recomendación de inversión»;
  «Cómo elegimos») y «Recién añadidas» (4, por fecha de alta); por tipo,
  colecciones, noticias, fuera del radar y nota legal. Las fotos se piden al
  acercarse: la primera pantalla carga 0 KB de imágenes (antes 378 KB).
- **Buscar › Ofertas (móvil):** fila de una columna con miniatura de 88 px,
  título de 2 líneas con `title=`, proveedor · lugar, hasta 2 puntos fuertes,
  Mínimo · España · Salida en corto y pie «Revisa · N avisos en la ficha» con
  la fecha; el aviso crítico va entero. Selección arriba dentro de
  Principales y después «Resto de principales». Sin grupos por proveedor en
  el móvil. Primera fila en y=520 a 390×844; filas de 207-209 px.
- **Ficha:** apartado «Transparencia: lo que hemos comprobado» en el diálogo
  y en `/ofertas/<slug>` (la quinta comprobación la mira `ficha-pagina` con la
  fecha de hoy). Nada de notas «x/5».
- **Plataformas:** miniatura del radar y «0 € · Por aparecer en el radar» en
  la franja plegada; recuentos en los chips; nombres cortos en la galería y
  en el radar grande (también en la portada de escritorio).
- **Técnica:** CSS 179 674 B (poda de 31 declaraciones pisadas y comentarios
  largos); JS 372 188 B; CLS 0 al cargar en el móvil (0,033 con 4G lento y CPU
  ×4); 59 frases nuevas en inglés y patrones para «8 de 8 principales» y
  «cifras vigentes 7 d»; movimiento reducido también si cambia con la página
  abierta.
- **Pruebas cambiadas** (con comentario que cita la decisión): etiqueta
  «Ilustración» de las portadas, miniatura móvil centrada, `title=` del
  título, etiquetas «Mínimo · España · Salida», «Doc.» en su span y
  agrupación por proveedor solo en escritorio. 14 pruebas nuevas en
  `probar-web.mjs` y 1 en `probar-fichas.cjs`. `npm test` completo en verde
  (web 567, fichas 66, precarga 32, app 394, acceso 144).
- **Pendiente:**
  - sellar (`auditar-relanzamiento.mjs` → `estado.json`), unir con merge
    commit y pedir permiso a Víctor para preview, producción y OTA;
  - la app no cambia todavía (`transparencia-contenido.js` está listo);
  - en escritorio los chips siguen con el nombre largo, como pedía «no
    cambiar de aspecto»; si Víctor quiere el corto también ahí, es un cambio
    de una línea en el CSS.

## 3 de noviembre de 2026 (tarde, 5) · Claude · el worker da 404 a lo retirado aunque Cloudflare guarde copia

Víctor: «arréglalo», sobre la ficha de mF-ONE que seguía saliendo en
`/ofertas/mf-one`. PR #45, unida a `main`, publicada en preview y producción
(219/219).

- **Causa:** el servidor de archivos de Cloudflare Pages
  (`@cloudflare/pages-shared`, `asset-server/handler.ts`,
  `ASSET_PRESERVATION_CACHE`) guarda una semana, en cada centro de datos, una
  «copia de conservación» de cada archivo que sirve. Si el archivo desaparece
  del despliegue, la devuelve con `cf-cache-status: HIT` y
  `x-robots-tag: noindex`. Por eso mF-ONE solo seguía en IAD.
- **Arreglo** (`rwadar-acceso/compilar.cjs`):
  - el worker lleva la lista cerrada de fichas, sacada del manifiesto. En
    `ofertas/`, `plataformas/` y `fuera-del-radar/`, cualquier otra ficha da
    el 404 de `/404`, sin pedirla a ASSETS. Las barras repetidas se
    normalizan antes;
  - fuera de `/assets/`, una respuesta de ASSETS con `HIT` + `noindex` se
    trata como copia de un archivo retirado y da 404. Si la respuesta es un
    304 de una revalidación, se repite la consulta sin condiciones. Así queda
    cubierta, por ejemplo, la ilustración de mF-ONE;
  - el 404 del worker lleva `x-robots-tag: noindex, nofollow` y
    `cache-control: no-store`. El 404 propio de Pages no lleva esa marca.
- **Precarga:** `rwadar-precargar-imagenes.js` compila el worker esperado con
  las fichas del snapshot de la base, no con el manifiesto. Si no, un alta ya
  añadida al manifiesto bloquearía la precarga (prueba nueva en
  `probar-precarga.cjs`).
- **Comprobación tras publicar** (`.github/comprobar-publicado.mjs`):
  - las 29 fichas retiradas del historial de Git, y una que nunca existió,
    deben dar el 404 del worker;
  - las 29 ilustraciones retiradas deben dar 404, también al revalidar.
- **Pruebas:** `npm test` 394 + 144. `compilar.test.mjs` tiene 8 casos que ya
  no dependen de las fichas de hoy. Revisión con un workflow de 4 enfoques, con
  escépticos, y segunda verificación sin falsos positivos en unos 2.000 casos
  reales de producción y preview. Sello nuevo.
- **Retirar una ficha** sigue igual: quitarla del manifiesto y borrar su
  página. Ver `docs/tareas/CICLO-DIARIO-CATALOGO.md` §6.
- **Queda:** los despliegues antiguos con huella (`<hash>.rwadar.pages.dev`)
  siguen enseñando su versión, con `noindex`. Son inmutables: solo se quitarían
  borrándolos en Cloudflare, con permiso de Víctor, y algunos los citan
  informes de `docs/`.

## 3 de noviembre de 2026 (tarde, 4) · Claude · retirada de mF-ONE (entrega 2026-11-03.6)

Víctor: «retira las ofertas que ya no valgan o ya no estén». PR #42 (lote) y
#43 (web y app), unidas a `main`.

- **Cómo se decidió:** las 25 ofertas se releyeron esta tarde con sus fuentes
  primarias, contra cuatro criterios: ya no existe, campaña terminada sin
  prórroga publicada, no abierta al particular, o fuente caída o
  contradictoria. Cada propuesta de retirada pasó por dos escépticos que
  intentaron rebatirla. Resultado en
  `verificaciones/2026-11-03.6-v2/comprobacion-retiradas.json`.
- **Sale mF-ONE (Midas):** la web la trata como «Exempt offer», el memorando
  solo se ve con wallet en lista blanca y los dos contratos tienen la lista
  blanca activada (`greenlistEnabled()=true`). No hay folleto en ESMA. Es para
  inversores profesionales.
- **Se quedan:**
  - **Terreno BILLA:** la propuesta de retirarla se rebatió. Brickwise la
    sigue vendiendo en fase de financiación, a finales de octubre se
    suscribieron 20 participaciones más, y el contrato permite prorrogar.
  - **Casa de Outeiro:** la ficha de datos v5, firmada el 30/10, fija como
    fecha límite el 31/03/2027.
  - **Hausera:** su preventa empieza el 04/11.
  - **Las otras 21:** siguen abiertas.
- **Supabase:** «Aplicar catálogo» con `2026-11-03.6`. Revisión `344a86aa`
  (antes `d75a22fb`): 24 ofertas (8 principales, 13 de reventa y 3 en
  camino), 26 plataformas. Las otras 24 ofertas no cambian. Revisión
  independiente: `REVISION-ENTREGA.md`, aprobada sin cambios obligatorios.
- **Web:** borrada `rwadar-site/ofertas/mf-one.html`, quitada su ruta de
  `rwadar-fichas-manifiesto.js` y borradas su ilustración y la de la app.
  Preview y producción: 158/158. En el navegador se ven 8 principales sin
  errores.
- **Caché de Cloudflare:** `/ofertas/mf-one` siguió dando 200 en IAD por la
  copia de conservación de Cloudflare Pages. Ya está arreglado: ver la entrada
  de arriba («tarde, 5»).
- **App:** OTA, grupo `a468d25f`, runtime `1.4.1(23)`, con el mensaje
  «Catálogo 2026-11-03.6: retirada mF-ONE». No comprobada en un móvil.
- **Pendiente:**
  - revisar Casa de Outeiro el 10/11;
  - en BILLA, si no hay prórroga publicada con fecha, decidir en el próximo
    ciclo;
  - a partir del 04/11, que la tarjeta de Hausera diga «preventa desde el
    04/11».

## 3 de noviembre de 2026 (tarde, 3) · Claude · alta de Spiko Smart Cash Euro (entrega 2026-11-03.5)

Víctor: «si es tan buena oferta y tú lo ves bien y tú lo subirías, adelante».
La revisión independiente de la mañana la había rechazado: no consta en
ningún registro público su alta en España (la CNMV no muestra compartimentos
de fondos extranjeros) y la web contradice al KID. PR #39 y #40, unidas a
`main`.

- **Ficha** (`verificaciones/2026-11-03.5-v2/preparar-entrega.mjs`), en
  principales:
  - 2,84 % neto: lo publica Spiko con el valor liquidativo del 02/11; variable,
    sigue al €STR;
  - desde 1 €; reembolso diario con límite del 25 %;
  - riesgo KID 1/7 sin contar la contraparte;
  - 8 datos, porque la web enseña como mucho 8.
- **Avisos:**
  - no consta en ningún registro público su alta en España;
  - no es cuenta ni depósito, con las citas literales de la web frente al KID;
  - no es un fondo monetario: invierte en títulos y los cambia con bancos;
  - el límite del 25 %;
  - la gestora es Twenty First Capital;
  - todavía no tiene ficha en GECO.
- **Revisión independiente:** workflow de 3 enfoques (hechos, protección del
  inversor y entrega técnica) más una síntesis. `REVISION-ALTA.md`:
  `aprobado_con_cambios`, con los 13 cambios obligatorios aplicados.
- **Supabase:** «Aplicar catálogo» con `2026-11-03.5`. Revisión `d75a22fb`
  (antes `f26bba19`): 25 ofertas (8/14/3). Las otras 24, idénticas.
- **Imagen:** RealVisXL, semilla 37, con una calle parisina genérica. El
  concepto no puede llevar «€»: la compuerta de `generar.mjs --comprobar` lo
  toma por cifra; así falló una vez la CI.
- **Web:** preview y producción (160/160); revisada en navegador.
- **App:** OTA, grupo `43d5e26a`, runtime `1.4.1(23)`; no comprobada en un móvil.
- **Pendiente:**
  - preguntar por escrito a la CNMV o a Aldana Capital A.V. si FR0014015LD3
    está notificado: si sí, se quita el primer aviso; si no, se retira la ficha;
  - en Spiko Letras del Tesoro Euro, poner primero la limitación en «Salida»,
    porque la fila se corta.

## 3 de noviembre de 2026 (tarde, 2) · Claude · alta de Kraken xStocks (entrega 2026-11-03.4)

Víctor pidió incluir xStocks: «si es online como las demás… apáñate». La
revisión independiente lo había rechazado porque las condiciones finales del
emisor solo ofrecen el producto en Liechtenstein y Suiza. Víctor decidió
publicarlo con ese aviso. PR #36 y #37, unidas a `main`.

- **Ficha** (`verificaciones/2026-11-03.4-v2/preparar-entrega.mjs`), en
  principales:
  - desde 1 €; acceso «según Kraken UE»; salida por venta a Kraken en USD
    (24/5) o retirada a wallet;
  - avisos 1 y 2: «el folleto no cubre su venta en España» y «RWAdar no ha
    encontrado ningún documento oficial que explique en qué se basa la venta
    en España»;
  - sin datos del KID ni enlaces a `l-p-a.com`; las condiciones finales se
    citan desde la web oficial del emisor.
  - Revisión independiente `REVISION-ALTA.md`: `aprobado_con_cambios`, con
    todo aplicado.
- **Supabase:** «Aplicar catálogo» con `2026-11-03.4`. Revisión `f26bba19`
  (antes `fab6d2e4`): 24 ofertas (7/14/3). Las otras 23, idénticas.
- **Imagen:** RealVisXL, semilla 29, con un distrito financiero mediterráneo
  genérico (`fotos/kraken-xstocks.webp`). La tarjeta se compuso después del
  SQL. Ruta `ofertas/kraken-xstocks.html` en `rwadar-fichas-manifiesto.js`.
- **Arreglos:**
  - `rwadar-servir.js` cargaba solo la fecha de un lote `.N`;
  - `probar-fichas.cjs` buscaba la entrega por la fecha;
  - ahora los dos usan la etiqueta completa y la revisión publicada.
- **Web:** preview y producción (158/158); revisada en navegador.
- **App:** OTA, grupo `9e9d54ef`, runtime `1.4.1(23)`; no comprobada en un móvil.
- **Pendiente:** si el emisor publica condiciones finales con España (o la CNMV
  aclara la base de la venta), quitar los avisos 1 y 2.

## 3 de noviembre de 2026 (tarde) · Claude · investigación del día, normas de tarjeta y entrega 2026-11-03.3

Víctor pidió otra investigación para publicar lo más actualizado posible, el
cambio de las reglas de permisos y «normas del catálogo con sentido». Dio
permiso expreso a todo. PR #30 a #34, todas unidas a `main`.

- **Reglas (PR #30):** `AGENTS.md`, `CLAUDE.md` y el ciclo dicen ahora que la
  orden de Víctor de investigar o actualizar el catálogo autoriza ese ciclo
  completo: «Aplicar catálogo», «Publicar web» y «OTA Android», si pasan
  pruebas, PGlite, revisión independiente y sello. Siguen fuera cuentas,
  credenciales, `eas build`/`submit`, tiendas, visibilidad y migraciones.
- **Normas de tarjeta (PR #31):** en reventa y próximas, `ficha-editorial`
  (mismo archivo en web y app) enseña mínimo, acceso desde España y salida
  si hay una referencia con etiqueta fija:
  - `Mínimo de inversión`, `Acceso desde España`, `Salida` o `Reembolso`;
  - con paréntesis opcional;
  - la ficha tiene que estar vigente.

  Siguen sin rentabilidad ni precio, como exige la restricción
  `oferta_coleccion_documental`; no hubo migración. Las citas literales no
  suben a la tarjeta. Está documentado en `CICLO-DIARIO-CATALOGO.md`.
- **Investigación (PR #32):** `verificaciones/2026-11-03.3-v2/`.
  - 6 grupos y 35 expedientes: las 23 publicadas y 12 candidatas.
  - Tres revisiones independientes: candidatas, cambios y SQL
    (`REVISION-ENTREGA.md`, `aprobado_con_cambios`, ya aplicados).
  - Kraken xStocks rechazada: las condiciones finales oficiales solo ofrecen el
    producto en Liechtenstein y Suiza (`revision-independiente/kraken-xstocks-addenda.md`,
    con copias de la web del emisor).
  - Spiko Smart Cash Euro rechazada: no consta su venta en España en ningún
    supervisor.
  - Informe: `docs/INVESTIGACION-CATALOGO-2026-11-03.md`.
- **Supabase:** «Aplicar catálogo» con `2026-11-03.3` y copia previa. Revisión
  `fab6d2e4` (antes `62dca2f9`): 26 plataformas y 23 ofertas (6/14/3),
  comprobadas el 03/11 y vigentes hasta el 10/11. Spiko al 2,34 % y 3,95 %.
  La lectura pública posterior lo confirma.
- **Radar:** 69/69 fuentes. El PDF de la OCC (Paxos) se leyó con WebFetch
  porque al navegador le llegaba otra cosa; su SHA-256 queda en la captura.
  Antes, un `curl` con agente de navegador fue denegado por el control de
  seguridad («bot check») y no se insistió.
- **Web (PR #33 y #34):** sincronizada, sellada y publicada en preview y en
  producción (156/156). Revisada en navegador: tarjetas principales y de
  reventa, Spiko euro al 2,34 %, retiradas con 404. Además, la PR #34 apila
  etiqueta y dato cuando la zona de datos mide menos de 260 px, porque en los
  grupos abiertos del móvil el dato se cortaba («1 partici…»).
- **App:** OTA al canal production, runtime `1.4.1(23)`, grupo `0a4700ab`,
  394 pruebas. Lleva las normas de tarjeta. No comprobada en un móvil.
- **Escáner de secretos:** 4 copias de páginas públicas con parámetros
  `access=`/`token=` (Hausera, docs de Midas) salieron de Git; se conservan en
  disco. Desde entonces solo se guarda si el escáner da 0. Todo lo crudo va en
  `grupos/**/crudo/`, que está en el `.gitignore`.
- **Pendiente:**
  - Kraken xStocks: condiciones finales con España.
  - Spiko Smart Cash Euro: confirmación de su notificación a España.
  - Casa de Outeiro: retirarla si el 10/11 sigue igual.
  - `actualizar-catalogo.mjs` aún quita los avisos con fecha que no sabe
    rehacer; hay que revisarlos a mano.

## 3 de noviembre de 2026 (mediodía) · Claude · entrega 2026-11-03.2, varias entregas al día y tarjetas

Con permiso expreso de Víctor (cifras «7 días mejor», «quita el límite de
cargar dos veces en un día», «que se pueda modificar en cualquier momento»).
PR #26, #27 y #28 unidas a `main`.

- **Supabase:** flujo «Aplicar catálogo» con la etiqueta `2026-11-03.2` y copia
  previa. Ahora está publicada la revisión `62dca2f9`, antes `a4792f79`: 26
  plataformas y 23 ofertas (6/14/3). Las cifras de cada ficha valen 7 días
  (`vigenciaDias: 7`). Las 6 principales tienen referencias en castellano para
  «Mínimo de inversión», «Acceso desde España» y «Salida/Reembolso». La
  revisión independiente (`2026-11-03.2-v2/REVISION-ENTREGA.md`) aprobó con dos
  cambios ya aplicados: Spiko EUR «clase EUTBL» y Robinhood «24/5». La lectura
  pública posterior lo confirma.
- **Varias entregas el mismo día:** etiquetas `AAAA-MM-DD` y `AAAA-MM-DD.N`
  (`esRevisionLocal`/`ordenRevisionLocal` en `catalogo-publico.js`). Las
  aceptan `montar-revision`, `comprobar-revision`, `actualizar-catalogo`,
  `capturar-fuentes`, `generar.mjs`, el flujo `aplicar-catalogo.yml`,
  `rwadar-servir.js` y el lector web. Las fechas de los datos son siempre
  `slice(0,10)`.
- **`npm run catalogo` (`actualizar-catalogo.mjs`):**
  - elige sola la siguiente etiqueta libre;
  - parte de la revisión publicada en la última sincronización, y `--desde`
    la cambia;
  - con fichas retiradas ya no falla;
  - no da cifras a colecciones no principales ni pisa un
    `fuentes_en_conflicto`;
  - lee Spiko euro y dólar de `public-api.spiko.io` (31 días, como la
    investigación) sin borrar las demás métricas;
  - una ficha sin regla y con cifras pasa a `noRevisada`.

  Probado de punta a punta en una copia aparte: entrega `2026-11-03.3`, radar
  69/69 y PGlite correcto. Esa prueba no se guardó en Git ni se aplicó. **Ojo
  para el ciclo:** quita los avisos con fecha que no sabe rehacer (BILLA,
  Aktionariat, Casa de Outeiro…) y los lista en el informe. Quien revise los
  tiene que reponer si siguen vigentes.
- **Tarjetas (web y app):** un mínimo documentado en otra moneda o unidad se
  ve tal cual y la fila se llama «Mínimo»: «500 CHF…», «1 gramo de oro»,
  «1 USD». Si está en euros sigue siendo «Mínimo (EUR)». La fila «Salida» ya no
  repite «Salida:». Hay una prueba móvil nueva y la traducción EN «Minimum».
- **Web:** sello sobre `2ce46b0` y auditoría «LISTO PARA CORTE FINAL».
  «Publicar web» en preview y en producción (156/156; el primer intento
  falló dos comprobaciones por la caché del CDN con el JS de idioma nuevo y el
  reintento pasó). Revisado en navegador, en móvil y escritorio.
- **App:** OTA `ota-android.yml` al canal production, runtime `1.4.1(23)`,
  grupo `96bab3a2`. No comprobada en un móvil.
- **Docs:** `CICLO-DIARIO-CATALOGO.md` y `RUNBOOK.md` explican las entregas
  `.N` y que ya no hay mínimo respecto del lote anterior.
- **No hecho (bloqueado):** quise escribir en `AGENTS.md` y `CLAUDE.md` que
  la orden de Víctor de investigar o actualizar el catálogo autoriza, para ese
  ciclo, «Aplicar catálogo», «Publicar web» y la OTA si pasan las compuertas.
  El control de seguridad de Claude no deja que una herramienta se amplíe sus
  propios permisos. Si Víctor lo quiere, lo cambia él o lo pide a Codex. El
  texto propuesto está en el informe a Víctor de esta sesión.
- **Pruebas:** `npm test` completo en verde tres veces (antes de sincronizar,
  después y con el arreglo de tarjetas) y CI de las tres PR en verde.

## 3 de noviembre de 2026 · Claude · catálogo de 23 ofertas aplicado, web publicada y OTA enviada

**Añadido por la tarde:** tarjetas de oferta más limpias en la web (PR #24, solo
CSS al final de `rwadar-20260820.css`; mismo contenido y reglas editoriales),
selladas y publicadas en preview y producción. La app no cambia. El contenido
de «Mínimo / España / Salida» sigue saliendo de las referencias del 01/11 (citas
en inglés): se arregla con referencias en castellano en la próxima entrega
documental, que no puede ser del mismo día que una ya aplicada.

Con permiso expreso de Víctor («camino B», «te doy permiso a todo», 02-03/11).
Todo unido a `main` (PR #20, #21 y #22, con commit de unión).

- **Supabase:** flujo «Aplicar catálogo» dos veces, con copia previa en cada
  una: lote del 02/11 (`f2be1f5e`, 26 plataformas y 23 ofertas, 6/14/3) y
  corrección documental del 03/11 (`a4792f79`). La corrección solo cambia un
  localizador de Aktionariat («…onlyBuySide=true») que la compuerta CSP del
  publicador confundía con un manejador `on…=`. Lectura pública posterior: 23
  ofertas de `a4792f79`.
- **Sin mínimo de 49:** `contrato-catalogo.js`, el lector web y
  `sincronizar.js` aceptan un lote coherente más pequeño o reclasificado; lo
  cortado o mezclado se sigue rechazando. Las pruebas de la web leen las
  cantidades del propio lote.
- **Web:** «Publicar web» preview y producción desde GitHub, ya con el secreto
  `CLOUDFLARE_API_TOKEN`. Sello en `estado.json` sobre `f8a5a85`. En
  producción, en navegador real: 23 fichas, sin aviso de revisión pendiente,
  páginas de las altas 200 y de las retiradas 404. Los 401 de la consola son
  `/api/acceso/sesion` sin sesión, como antes.
- **App:** nuevo flujo `.github/workflows/ota-android.yml` (manual, solo
  `main`, pruebas y guard con `--base` del APK 1.4.1). OTA enviada al canal
  production, runtime `1.4.1(23)`. Todavía no se ha comprobado en un móvil.
- **Escáner de secretos:** 40 capturas JSON de la investigación con
  identificadores públicos de blockchain salen de Git (`.gitignore` del
  ciclo). No se tocó `gitleaks.toml`.
- **Pruebas:** `npm test` completo en verde y CI de las tres PR en verde.
- **Pendiente para el siguiente ciclo:**
  - El resumen de las tarjetas muestra «Mínimo: No verificado / España: Sin
    confirmar / Salida» con citas en inglés del 01/11. Hay que añadir
    referencias en castellano (`Mínimo de inversión`, `Acceso desde España`,
    `Reembolso`).
  - Las cifras de las ofertas caducan al día (`vigenciaDias: 1`).
  - Para un lote del mismo día que otro ya aplicado no queda carpeta de
    fecha libre: hay que esperar al día siguiente.

## 2 de noviembre de 2026 · Claude · investigación del catálogo (ciclo manual del 01/11), preparada sin aplicar

**Rama:** `claude/investigacion-catalogo-2026-11-01`. Nada aplicado en Supabase,
nada publicado. Víctor inició el ciclo el 01/11 («haz la investigación») y pidió
priorizar ofertas que un particular en España pueda comprar de verdad y que den
confianza. Informe: [`../INVESTIGACION-CATALOGO-2026-11-01.md`](../INVESTIGACION-CATALOGO-2026-11-01.md).

- **Expedientes:** 105 (49 publicadas + 56 candidatas) en
  `rwadar-app/data/verificaciones/2026-11-01-v2/expedientes/`, de 9 agentes
  investigadores, y 5 revisiones independientes en `revision-independiente/`.
  Lectura pública previa: lote del 23/10, 49 ofertas (24/21/4), vencido el 29/10.
- **Altas aprobadas con cambios:** `spiko-letras-del-tesoro-dolar` y
  `robinhood-classic-stock-tokens`. Kraken xStocks, rechazada en este ciclo.
- **28 retiradas justificadas por la revisión** (22 Reental, mGLO, mGLOBAL,
  mGLOeuro, IOD, wemakeit y quitt). **Las decide Víctor.**
- **Límite de 49 quitado** (commit «Quita el mínimo de 49 ofertas», con orden
  expresa de Víctor del 02/11). `contrato-catalogo.js`, el lector de
  `rwadar-20260820.js` y `sincronizar.js` ya no comparan con la copia anterior:
  aceptan un lote más pequeño o reclasificado si cuadra con su propio
  manifiesto. Lotes cortados o mezclados se siguen rechazando. Pruebas: web
  553/0, móvil 392/0, db, tools, acceso 140/140 y QR. **Sin publicar:** falta
  sellar `estado.json` y publicar la web, y la OTA de Android (permiso de
  Víctor), antes del lote reducido. La lista cerrada `rwadar-fichas-manifiesto.js`
  se edita a mano en ese lote (quitar retiradas, añadir altas).
- `propuesta-tarjetas.json` (con `preparar-propuesta.py`) trae las tarjetas
  con los cambios obligatorios aplicados y lo que hay que **releer el día de
  publicación** (Spiko, oráculo de mTBILL, precios de Brickwise y Aktionariat).
  `consolidar.py` valida los expedientes: solo quedan 2 errores de formato
  conocidos (mGLO y mGLOBAL citan el oráculo con la dirección abreviada).
- **PDF/HTML originales fuera de Git** (`.gitignore` del ciclo); SHA-256 en
  cada inventario. Se pierden si se recicla este contenedor.
- **Pendiente:** decisión de Víctor (A/B y retiradas), ilustraciones de las 2
  altas, montar lote, PGlite, revisión del SQL, precarga, SQL y publicación,
  cada paso con su permiso. No se ejecutaron `npm run catalogo`,
  `montar-revision.mjs` ni `npm test`: no hubo cambios de código.

---

## 1 de noviembre de 2026 · Claude · anti-robots y límite de intentos, preparados sin activar

**Rama:** `claude/anti-robots-2026-10-30`. Sin unir a `main`, porque toca
`rwadar-acceso/` y `rwadar-site/`, que están sellados. Nada publicado, nada
tocado en Supabase ni en Cloudflare. Plan completo y orden de activación en
[`ANTI-ROBOTS-Y-LIMITES-2026-11-01.md`](ANTI-ROBOTS-Y-LIMITES-2026-11-01.md).

- **Hallazgo:** el BFF llama a Supabase desde Cloudflare, y Supabase ve una IP
  compartida (`2a06:98c0:3600::103`), así que toda la web comparte un único cupo
  de intentos de Auth. Se puede confirmar sin tocar nada en Supabase › Logs › Auth.
- **BFF:** límite en memoria por visitante (IPv4 o bloque IPv6 /64): 30
  entradas y 10 envíos de correo cada 10 minutos. A propósito no hay
  límite por correo: la revisión independiente mostró que permitía bloquear a
  otra persona. Además, reenvío del testigo Turnstile como
  `gotrue_meta_security.captcha_token` y `captcha_fallido` claro. Sin testigo, el
  cuerpo que recibe Supabase es idéntico al de antes.
- **Web (`acceso.js`/`acceso.html`):** Turnstile listo y apagado
  (`TURNSTILE_SITEKEY = ''`); la CSP no cambia.
- **Pruebas con Node 22.23.4:** `test:acceso` 140/140 (14 nuevas en
  `anti-robots.test.mjs`) y `test:web` 550/0. En Chromium real, con el BFF
  verdadero y el `siteverify` de Cloudflare con sus claves de prueba: apagado
  entra sin peticiones externas, la clave que aprueba entra y la que rechaza lo
  explica.
- **Estado (01/11, tarde): unido a `main` y aprobado, pendiente solo de
  publicar.** PR #18 unida con merge commit (`ac4b26b`). Codex la revisó en
  GitHub (código y seguridad); su único aviso, que con *squash* se perdería el
  commit sellado, se evitó uniéndola con merge commit. Con autorización expresa
  de Víctor, Claude selló `estado.json` (`9cdeb13`) aprobando `7ff6537`. El
  auditor y la compuerta pasan en `main`.
- **La publicación desde GitHub falla** porque no existe el secreto
  `CLOUDFLARE_API_TOKEN` (ejecución del 01/11; la del 22/10 falló igual).
  **Para Codex:** publicar desde el PC con la sesión de Wrangler,
  `node rwadar-publicar.js --preview`, comprobar `revision.rwadar.pages.dev/acceso`
  (lleva `id="robot"` oculto y `acceso.js` nuevo) y después `--produccion`.
  Publicar solo activa el límite. No encender el CAPTCHA en Supabase hasta que
  Android mande `captchaToken` (fase 2 del plan).
- **Node del PC:** Codex usó un Node 22.23.4 portable y la instalación global
  seguía sin el parche. Víctor lanzó el 30/10 una tarea en su PC para
  actualizarla; confirmar con `node --version` (≥ 22.23.4).

---

## 30 de octubre de 2026 · Claude · web en iPhone, cuenta QA baneada y pruebas en UTC

- **Víctor usa iPhone**, así que en su móvil RWAdar es la web. En iPhone/iPad
  los enlaces a `/android` (icono de descarga de la cabecera móvil, «App
  Android») abren ahora instrucciones para «Añadir a pantalla de inicio»
  (es/en) en vez del APK. Ya instalada (`standalone`), se ocultan. Android y
  escritorio no cambian. Bloque `instalarEnIphone` en `rwadar-20260820.js`;
  estilos `.instalar-iphone` en la hoja principal.
- **Pruebas PGlite en UTC** (`rwadar-app/pruebas-soporte.mjs`): entre las 00:00
  y la 01:00 de España, `current_date` iba un día por delante y las pruebas del
  catálogo fallaban con revisiones «del futuro».
- **Cuenta QA** `8871c88e…` baneada de forma reversible (`ban_duration
  876000h`, como tus cierres). Seguía activa desde tu última ejecución. Para
  reactivarla: PUT `{"ban_duration":"none"}` con la clave del panel.
- Tu trabajo sin commitear de `Downloads` está en `main` (PR #16) y `Downloads`
  ya está en `main`. Lo del panel (scripts y `.gitignore`) sigue en
  `claude/panel-control`.

---

## 30 de octubre de 2026 · Claude · secretos QA retirados y rama unida a main

Con permiso expreso de Víctor («haz ambos arreglos»):

- **Secretos QA retirados** de GitHub: `RWADAR_QA_EMAIL` y
  `RWADAR_QA_PASSWORD`. Quedan `COPIA_CLAVE` y `SUPABASE_DB_URL`. Tus flujos
  `android-*`/`web-chrome-141` los necesitan: créalos solo para cada ejecución
  y retíralos al terminar. La cuenta QA de Supabase no se ha tocado (puede
  seguir habilitada).
- **PR #15**: esta rama a `main` por avance directo, sin perder nada de `main`.
  El escáner de secretos daba 23 falsos positivos en tus archivos (tokenId de
  Brickwise, enlaces PDF de mTBILL, JWT de prueba, clave publicable). Ahora hay
  excepciones acotadas en `rwadar-app/gitleaks.toml` (`25410a2`), comprobadas
  con gitleaks 8.30.1 y un canario que sigue detectando 3 de 3. **Si añades
  fuentes de investigación con IDs o enlaces firmados, el escáner volverá a
  pararse**: tapa el valor o añade una excepción igual de estrecha.
- Desde ahora trabaja sobre `main` actualizado. La carpeta `Downloads` sigue en
  el `main` antiguo con tu trabajo sin commitear: guárdalo en una rama propia
  antes de traerte `main`.

---

## 29 de octubre de 2026 · Claude · botón «Actualizar» enviado por OTA a la 1.4.1

Víctor pidió que la app se actualice con un botón, sin desinstalar. Hecho y
publicado con su permiso expreso («Sí, envíalo»):

- **OTA** `01a189a8-1c8d-781a-aaa1-4591b88c277f` (grupo `a9306bfa…`), canal
  `production`, Android, runtime `1.4.1(23)`, desde `ae36f05`. Guard
  `comprobar-ota-compatible.cjs --base c1f7106` correcto; sin permisos nuevos.
- **Qué hace** (`b32ef29`): mejora ya descargada → aviso «Aplicar» (reinicia
  solo al pulsar). Versión Android nueva → «Actualizar» descarga el APK tras
  confirmar. El aviso sale bajo la cabecera y en acceso, error de restauración
  y desbloqueo. Perfil › «Versión de la app» comprueba a mano.
- **Cada versión Android nueva debe subir `version-android.json`** a su
  release, con la forma exacta de `rwadar-movil/LEEME.md`. Ya está subido a
  v1.4.1 (código 23). Sin él, la app no avisa de APK nuevos.
- **Web** `1778479b`: privacidad con Expo y GitHub; sello en `ae36f05`;
  `comprobar-publicado.mjs` 208/208.
- `npm test` completo en verde; revisión independiente sin CRITICAL/HIGH y
  sus 7 avisos menores aplicados. No hay prueba en un móvil real todavía:
  Víctor lo verá en Perfil tras abrir la app dos veces.

Commits subidos a `origin/codex/claridad-cartera-sesion-141-20261028`
(sin unir a `main`). Siguen pendientes los secretos QA y unir esta rama a
`main`.

---

## 29 de octubre de 2026 · Claude · web y Android 1.4.1 publicadas; cierre de esta entrega

Tu sesión del 22/10 se cortó a las 00:44 UTC sin cerrar. Víctor pidió terminar
y publicar. Hecho, con su permiso expreso en el chat:

- **Web en producción**: `node rwadar-publicar.js --produccion` desde esta rama
  (despliegue `a83ea0bd`, caché `rwadar-v-ef591c2273229df5`, idéntico a la
  preview `revision`). `sw.js` de producción = local; `comprobar-publicado.mjs`
  208/208. **Víctor entró con su cuenta en la preview y se queda dentro**:
  el retorno al acceso está resuelto.
- **`npm test` completo en verde** (Node 22.23.4, EXIT 0). Se paraba en
  `probar-para-empresas.mjs`, que seguía exigiendo `ventana.navigate()` en el
  service worker; ahora exige `claim()` y ausencia de navegación (`d8c185e`).
  Ese commit incluye tu arreglo de reloj AMR que estaba sin guardar.
- **Android 1.4.1/código 23 publicado como Latest** en
  https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.4.1
  (APK `33663d48…`, descarga pública con la misma huella; `/android` lleva a
  ella). README de descargas actualizado (`66113346`). QA-1.4.1.json recoge
  las ejecuciones 40783151032 y 40795909732: actualización sobre 22 sin
  desinstalar, misma firma, sesión, cartera en la nube leída por la web y OTA
  descargada y lanzada. La 40795909732 falló **en el comprobador**: la captura
  del fallo muestra la cartera correcta (2,00 / 2,20 / 0,10 / 0,30 / 15 %).
  Cierre de sesión no se repitió en 23: su código no cambia desde 22.

**Pendiente, sin tocar por falta de permiso:** los secretos `RWADAR_QA_EMAIL` y
`RWADAR_QA_PASSWORD` siguen en el repo desde las 00:41 y la cuenta QA puede
seguir habilitada en Supabase. Esta rama va 116 commits por delante de `main`
y producción sale de ella: falta unirla. No relances QA nativa de 1.4.1 ni
compiles otra vez: está publicada.

---

## 29 de octubre de 2026 · Codex · recarga bloqueante aislada y corregida

Chrome real anónimo se bloquea con el trabajador y responde con 49 tarjetas al bloquear solo ese trabajador; WebGL no es la causa aislada. Quitada navegación de ventanas dentro de la activación, sin cambiar cachés privadas ni sesión. Dos pruebas y revisión independiente pasan; comprobación web y preview pendientes. `npm test` se detuvo antes en una prueba de sesión/baja y no se declara aprobado. APK23 sin recompilar; investigación pausada. [Detalle](../VERIFICACION-SW-ACCESO-2026-10-29.md). Fuente en el commit de esta entrada.

---
## 29 de octubre de 2026 · Codex · causas reales de acceso y valoración corregidas

Chrome reproduce sesión200 seguida de rechazo secundario convertido en401: corregidos BFF/cliente y consulta innecesaria de avisos;65 pruebas pasan. Reparado el validador SQL29 previamente autorizado mediante una pareja de paréntesis, con guarda;30 pruebasPGlite,8 independientes y comprobación remota positiva, sin ampliar permisos. Nueva preview/producción pendientes. Android23 conserva instalación y sesión acreditadas; se comprueba solo cartera/OTA/ficha/salida. [Detalle y reversión](../VERIFICACION-ACCESO-WEB-2026-10-29.md). InvestigaciónPAUSADA; main compartido intacto. Cambios en el commit que contiene esta entrada.

---

## 29 de octubre de 2026 · Codex · retorno al acceso web reproducido

Víctor confirma que el primer arreglo no basta. Corregidos errores transitorios del puente y comprobación de la sesión del navegador antes de regresar;37 controles dirigidos y generación local26/49 aprobados. Fuente en el commit de esta entrada; nueva preview y producción pendientes. [Detalle breve](../VERIFICACION-ACCESO-WEB-2026-10-29.md). APK23 conservado, recorrido40785078896 en curso; no recompilar. InvestigaciónPAUSADA, main compartido intacto.

---

## 28 de octubre de 2026 · Codex · cierre reanudado y corrección del bucle web

APK1.4.1/código23 terminado, sin otra compilación; OTA compatible preparada y recorrido nativo40783151032 en curso. El arnés de recursos se corrigió en7945f62. Web: corregidos cierre por fallo secundario y clic prematuro durante restauración;18 pruebas dirigidas pasan y generación local26/49 correcta. Cambios web en el commit que contiene esta entrada; preview y producción pendientes. BFF de producción comprobado de nuevo con nuestra cuentaQA. [Detalle](../VERIFICACION-ACTUALIZACION-141-2026-10-28.md). InvestigaciónPAUSADA; main compartido intacto.

---

## 28 de octubre de 2026 · Codex · web con cartera publicada; Android1.4.1 en cola

Producción https://rwadar.pages.dev actualizada (despliegue89a6801d): tarjetas claras, avisos íntegros y Mis inversiones. SQL29 privado aplicado con permiso;24controles públicos pasan. Previewmóvil/escritorio y CSS final comprobados con sus límites en [detalle](../VERIFICACION-ACTUALIZACION-141-2026-10-28.md). Android1.4.1/código23 está en cola gratuita, fuente c1f7106; no volver a compilar. Arnés dirigido preparado para actualizar22sin desinstalar, cartera privada y unaOTAcompatible del mismo móvil; aún no hay aprobación ni publicación de1.4.1. CuentaQA sigue limpiada: no se ha reactivado este ciclo. InvestigaciónPAUSADA, main compartido intacto.

---

## 28 de octubre de 2026 · Codex · actualización1.4.1 preparada

SQL29 privado autorizado y aplicado, RLS/ACL comprobadas. Corregida carrera real de renovación de sesión; tarjetas simplificadas sin perder avisos; Mis inversiones de cuenta en web/app y privacidad actualizada. PróximoAPK1.4.1/código23 activa Updates compatible y deberá reemplazar22 sin desinstalar. Fuente y pruebas en el commit de esta entrada. Compilación, comprobación nativa y publicación nuevas pendientes;1.4.0 sigue pública. [Detalle breve](../VERIFICACION-ACTUALIZACION-141-2026-10-28.md). InvestigaciónPAUSADA, main compartido intacto.

---

## 28 de octubre de 2026 · Codex · Android 1.4.0 publicado y cierre de QA

Android1.4.0/código22 ya publicado en https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.4.0. Descarga pública real, firma y SHA comprobados; web pública actualizada el28/10 en https://rwadar.pages.dev. Fuente móvil c663e35; arnés final 3c18055. Se conservan siete pruebas reales de sesión/PIN del mismo APK y las pruebas equivalentes anteriores; tutorial4pasos aprobado por revisión directa de capturas; cartera y cierre final aprobados. CuentaQA inhabilitada, sesiones revocadas y dos secretos retirados. Sin más builds por fallos del capturador. Investigación PAUSADA. Main compartido intacto. [Detalle breve](../VERIFICACION-ACCESO-PERSISTENTE-2026-10-28.md).

---

## 28 de octubre de 2026 · Codex · APK22 compilado, cierre asistido en curso

APK1.4.0/código22 compilado desde c663e35. Identidad, firma,49imágenes, entrada y siete pruebas reales de sesión/PIN aprobadas; se conservan sus evidencias. Los intentos siguientes fallan en el lector del tutorial: no equivalen a defectos demostrados de la app ni a aprobación final. Arnés9848c75 usa capturas consecutivas para revisión directa de los cuatro pasos, cartera y salida, sin recompilar. La descarga final aún es1.3.2. Web pública actualizada el28/10. [Seguridad verificada y pendientes](../SEGURIDAD-WEB-REVISION-2026-10-28.md). Investigación pausada; main compartido intacto.

---

## 28 de octubre de 2026 · Codex · acceso móvil persistente y bloqueo opcional

Víctor informa fallo de entrada móvil y pide conservar sesión y desbloquear con huella/cara/PIN. Se prepara APK nuevo sin repetir pruebas equivalentes: refresh seguro, restauración, errores de red sin expulsión y vigilancia separada del acceso; opción única en Perfil. Cuentas52 y UI8 criterios dirigidos aprobados; PIN Android y build pendientes. El tutorial web ya está corregido y publicado (502eb88/fbcc0d9, producción d2ad2a83): la última captura nativa muestra 3D; falló el capturador, no acredita cuatro pasos. La QA anterior quedó limpiada el 28/10. [Estado breve](../VERIFICACION-ACCESO-PERSISTENTE-2026-10-28.md). No iniciar investigación ni compilar de nuevo por fallos del arnés. Main compartido intacto.

---

## 28 de octubre de 2026 · Codex · nueva pieza «Ahora sabes dónde mirar»

Víctor rechazó «Hay más» y aportó una referencia de motion design. Nueva
propuesta de 28 s/25 fps en `rwadar-descubre-2026-10-28/output/`, con copia
ligera y reproductor. Rodaje real nuevo con app auténtica integrada en la
pantalla mediante tracking/perspectiva, escenario 3D, búsqueda, oferta limpia
Casa de Outeiro/Alius Capital y web actual. Música distinta: Gimme that Groove!,
Michael Ramir C.; no reutiliza temas/stems anteriores y no contiene locución.
[Informe](../VERIFICACION-ANUNCIO-DESCUBRE-2026-10-28.md).

Exportaciones descodificadas completas, 700 fotogramas/28 s, BT.709 y audio
verificados; setecientos hashes de píxeles main/picture iguales. Reproducción
silenciada del SHA definitivo completa, sin saltos. Correcciones visuales de
paneles, búsqueda y etiqueta editorial. No se presume aceptación creativa.
Capturas nuevas de Expo Web a 860 × 1790; adquisición 9–12 fps reales,
conformada a 25 respetando tiempos, sin interpolación inventada. No es APK.
Servidor temporal cerrado, producto sin cambios. Música para publicidad
online, no emisión de TV/radio. Sin commit, push, publicación, SQL, catálogo
nuevo, cuentas, build/OTA o créditos de generación. WIP compartido conservado.

---

## 28 de octubre de 2026 · Codex · anuncio rehecho con personas reales

Nueva propuesta local de 26 s en
`rwadar-spot-reboot-2026-10-27/output/rwadar-hay-mas-1080p.mp4`, con copia
ligera y reproductor. Sustituye el corte de treinta segundos que Víctor
rechazó. Rodaje humano licenciado de la misma actriz con móvil y portátil,
radar auténtico, selección real de Spiko en Expo Web, modelo educativo WebGL
real y una oferta de Spiko en alta resolución. Se retiró toda locución
generada. La web aparece como contexto de portátil, mención y URL, sin captura
de su interfaz. [Informe](../VERIFICACION-REBOOT-RWADAR-2026-10-28.md).

Dos exportaciones: descodificación completa, 624 fotogramas/24 fps/26 s,
BT.709 completo y AAC final dentro del objetivo. Reproducción del SHA final
completa, silenciada, sin errores ni pérdidas. Revisión visual muestreada
independiente y corrección de recortes, fuentes y párrafos ampliados.
Investigación documental de referentes con fuentes primarias; no se afirma
haber visionado sus spots. Calidad creativa pendiente de valorar por Víctor.

Sin commit ni push, créditos adicionales, publicación, SQL, catálogo nuevo,
cuentas, cambios de producto o build/OTA. Se conserva el WIP compartido.
Las capturas Expo Web no acreditan un APK. La música permite publicidad
online, pero no emisión de televisión/radio.

---

## 27 de octubre de 2026 · Codex · mapa publicado en producción

Web publicada en https://rwadar.pages.dev con Buscar → Lista/Mapa, 26 fichas geográficas (24 puntos, 4 aproximadas) y catálogo49 conservado. Fuente e1923c297dfd17924fd1a9cd2fee9d8b217f62d5; autorización y publicación registradas en552845c. Deployment https://0d881a1d.rwadar.pages.dev;8 controles HTTPS en producción y2 GET independientes con bytes exactos aprobados. Se reutilizan web549/fichas90/acceso55/mapa10/precarga31; no repetir. La revisión visual no quedó acreditada por el controlador. [Informe](../VERIFICACION-MAPA-2026-10-27.md). Android1.4.0 sigue pendiente, con APK20 y pruebas conservadas; no está publicado. CuentaQA limpiada. Investigación pausada. Main compartido intacto; fuente en rama aislada.

---

## 27 de octubre de 2026 · Codex · mapa en preview; control visual bloqueado

Mapa en Buscar, 26 ubicaciones documentadas y consulta pública. Fuente e1923c297dfd17924fd1a9cd2fee9d8b217f62d5. Pasan web549, fichas/RSS90, acceso55, mapa10 y precarga31. Preview https://3fbac666.rwadar.pages.dev desplegada y 8controlesHTTP aprobados. El control visual se detuvo al no poder verificar la URL de Chrome. Producción no promovida; no volver a desplegar preview ni repetir pruebas locales que pasan. Falta revisión visual y producción. [Informe breve](../VERIFICACION-MAPA-2026-10-27.md). App: idiomas/favorito57/57 y lección completados en40562598549; falló después por lectura temprana del tutorial aún cargando. PatchLF preparado en W/android-tutorial-continuation-40562598549.patch, sin aplicar. Generador público W/generar-qa-publica-c20-language-reuse-27.propuesto.py. Faltan tutorial, cartera y salida. CuentaQA limpiada al cierre del turno. APK20 sin recompilar. Investigación pausada; main compartido intacto.

---

## 27 de octubre de 2026 · Codex · anuncio centrado en app y web, con navegación

Víctor pidió rehacer el anuncio: aspecto de spot televisivo, app/web como
protagonistas, mensaje aspiracional y voz de España. Rechazó Elvira por
robótica e Ines por acento latino; ambas quedan fuera del corte vigente.
La nueva revisión de **30 s** está en
`rwadar-comercial-valencia-v2-2026-10-27/output/rwadar-mas-cerca-app-y-web-1080p.mp4`,
con copia ligera y reproductor. [Informe](../VERIFICACION-ANUNCIO-APP-WEB-2026-10-27.md).

UI durante 20,708 s, incluidos 14 s seleccionados de navegación real del
código React Native en **Expo Web**: buscar Casa, abrir Outeiro, recorrer la
ficha, cerrarla y volver al radar. Catálogo público real, cuatro GET 200;
sin mocks, cuentas, favoritos, mutaciones ni cambios de fuente/dependencias.
No se presenta como captura del APK. El servidor temporal quedó cerrado.
La web se capturó el 27/10; las imágenes nativas de apoyo son del 22/10.
Avisos y rótulos editoriales preservados. Cierre acordado:
«La inversión en activos tokenizados no está exenta de riesgos».

Dos copias descodificadas completas; 720 fotogramas, 24 fps, Full HD. AAC final
idéntico al máster director comprobado: −14,22 LUFS y −1,17 dBTP. Reproducción
completa de 30 s en Chrome aislado en silencio, sin pérdida de fotogramas ni
errores; revisión visual independiente muestreada sin bloqueantes. La nueva
voz se dirigió como narradora de Madrid y el guion se transcribió completo;
estas mediciones no certifican acento ni interpretación por escucha humana.

Esta revisión consumió 53,25 créditos: total acumulado 615,95 de los 650
autorizados, sin compras ni cambios de plan. Sin commit, push, publicación,
SQL, catálogo nuevo, cuentas, build/OTA ni cambios del producto. Se conserva
el WIP compartido. Falta la valoración creativa de Víctor de la revisión
entregada; no se afirma que haya aceptado la voz ni el resultado.

---

## 26 de octubre de 2026 · Codex · cierre Android en curso, sin otra compilación

La 1.4.0 corregida ya está compilada como APK20. No volver a compilar por fallos
del comprobador. Pasan 92 pruebas locales, firma y 49 recursos, acceso, radar26,
catálogo49, ficha con letra1.5 (título, X, Atrás y fuente) y grupo Brickwise12.
Faltan Reental21, contenido/idiomas, Academy, cartera y cierre de sesión.
La descarga final sigue en1.3.2; el draft1.4.0 conserva el APK19 y no debe publicarse así.
Fuente móvil en7c64b6c; arnés y pruebas conservadas hasta a501a3d, en rama aislada.
Investigación PAUSADA. [Estado breve](../VERIFICACION-ANDROID-140-CIERRE-2026-10-26.md).
No sobrescribir el main compartido con cambios de otras herramientas.

---

## 26 de octubre de 2026 · Codex · defecto real del catálogo Android corregido

APK19 entra con la cuentaQA, pero rechaza el catálogo real por tamaño y muestra0/0.
Arreglo mínimo en cuentas.js: soloGET de dos vistas V2 permite2MiB/15s;
Auth/privados conservan128KiB/8s.28pruebas nuevas+64regresiones pasan;
revisión independiente aprobada y contrato real26/49 correcto. NuevoAPKpendiente;
no publicar el19. Investigación pausada. [Informe breve](../VERIFICACION-CORRECCION-CATALOGO-ANDROID-2026-10-26.md).
Cambios en el commit que incorpora esta entrada. Main compartido no se toca.

---

## 26 de octubre de 2026 · Codex · web pública publicada; Android sigue pendiente

Web publicada en https://rwadar.pages.dev (despliegue
https://f0ec3606.rwadar.pages.dev), después de la preview
https://99d594e3.rwadar.pages.dev. Consulta sin registro y cuenta para funciones
personales; corregido el doble cierre que podía borrar la sesión recién abierta.
37 pruebas locales dirigidas, 16 comprobaciones HTTP en preview y otras 16 en
producción; login, sesión y logout reales pasaron en ambos entornos. No se
repite la inspección visual anterior: la nueva del 26/10 quedó bloqueada porque
Computer Use no pudo verificar la URL del navegador.

SQL28 revertido con permiso: 26 plataformas y 49 referencias conservadas,
lectura pública restaurada y RLS de perfiles/vigilancia mantenida. Se restaura
el contrato de sincronización de 1.3.2, sin nueva prueba en dispositivo.
Investigación PAUSADA; sin nuevas ofertas ni fechas rejuvenecidas.

Fuente y aprobación en `093ec47`, `9cfe70e`, `f2915dc`; arnés en `6c9373c`.
Android 1.4.0/código 19 sigue como draft: mismo APK y baselines conservados,
sin nueva compilación. Las tres continuaciones del 26/10 suman 442 segundos y
fallaron en el arnés; no acreditan 20/20 ni autorizan afirmar publicación.
El EOF de arranque del capturador ya está corregido y probado con un socket
local real; ampliar el límite es requisito para otra ejecución completa.
Cierre nativo, limpieza de QA y publicación si pasa siguen pendientes.
[Informe vigente](../VERIFICACION-ACCESO-PUBLICO-2026-10-26.md).
No integrar ni sobrescribir el main compartido con WIP de otras herramientas.

---

## 26 de octubre de 2026 · Codex · web pública y cierre del mismo APK

Por nueva orden expresa: web legible sin registro, cuenta para funciones personales
y cierre/publicación del APK19 existente. Investigación sigue PAUSADA.
SQL28 revertido con autorización específica:26/49conservados y lectura pública
restaurada; perfiles/vigilancia mantienenRLS. Worker y bridge públicos, login
serializado para evitar doble logout;34+3pruebas dirigidas aprobadas. Se conservan
los baselines APK19 y99/11 anteriores. Sin nueva compilación ni cambio móvil.
El arnés incorpora foco/IME actuales, cierre observado del radar y menos snapshots;
14simulaciones dirigidas. Estado de despliegue y QA aún pendientes en el
[informe26/10](../VERIFICACION-ACCESO-PUBLICO-2026-10-26.md).
Los commits que incorporan esta entrada contienen la fuente preparada y su
aprobación separada; no integrar el main compartido con WIP de otras herramientas.

---

## 26 de octubre de 2026 · Codex · anuncio cinematográfico Valencia terminado

Víctor rechazó la primera animación y después sustituyó el concepto por un
spot con mujer, coche de lujo, Valencia nocturna, edificio aspiracional y
cierre en casa con pijama y perro. **La entrega principal ahora es el anuncio
de 34 s** en `rwadar-comercial-valencia-2026-10-26/output/`, con copia para
compartir y portada. [Verificación](../VERIFICACION-ANUNCIO-VALENCIA-2026-10-26.md).

Cinco planos fotorrealistas y voz generados; pantalla auténtica integrada
en perspectiva, música licenciada para web/redes, foley, color y mezcla.
13 controles técnicos aprobados, 816 fotogramas descodificados, AAC final
−14,0 LUFS / −1,2 dBTP. Revisión visual muestreada del archivo completo.
No se afirma escucha humana ni funcionamiento nativo actual: las pantallas
proceden de la QA del 22/10. Edificio/precio ficticios, sin compra inventada
ni rentabilidad garantizada dentro de RWAdar.

Autorización expresa de 650 créditos Higgsfield; consumo real 562,70, sin
compras, cambio de plan ni reintentos. Se mantiene todo local sin publicar
web, app o redes. Sin commit y sin cambios del producto; se conserva el WIP.
Las animaciones anteriores quedan como material secundario, no como el spot
solicitado. No queda trabajo de producción requerido para entregar este MP4.

---

## 26 de octubre de 2026 · Codex · vídeo promocional «Sigue la fuente»

Víctor pidió una pieza de animación como la referencia adjunta, con edición,
postproducción y motivos para usar la app. Entrega local terminada en
`rwadar-promo-2026-10-26/`: MP4 principal de 24 s, vertical 1080 × 1920 a
60 fps, copia ligera, portada, reproductor y fuentes editables. Animación 3D,
música y efectos originales; tres agentes apoyaron sonido, recursos y revisión.
Sin commit de esta sesión y sin publicar.

La [verificación del vídeo](../VERIFICACION-VIDEO-PROMOCIONAL-2026-10-26.md)
registra 14 comprobaciones técnicas aprobadas, 1.440 fotogramas descodificados,
−14,1 LUFS / −1,7 dBTP en el AAC final, revisión visual muestreada y fuentes.
Las pantallas auténticas son de la QA aprobada del APK 1.3.2 del **22/10**;
no son capturas actuales ni una nueva validación nativa. Se conservan sus
rótulos editoriales. El intento de captura nueva se cerró por bloqueo del
navegador y no se presenta como completado.

Pendiente solo la decisión editorial de Víctor de usar/publicar el vídeo;
la entrega local no autoriza difusión. No hay nueva investigación, SQL,
build/OTA, cambios del producto ni pruebas nativas. Se preservó el trabajo
compartido anterior. No se afirma escucha humana ni reproducción del usuario.

---

## 24 de octubre de 2026 · Codex · revisión integral y compatibilidad pendiente

Se revisó la entrega desde `9d51f8b`, con tres ayudantes de lectura y cierre
acotado. No cambió la fuente del producto. Se corrigieron contradicciones del
estado vigente y se añadió la [revisión integral](../REVISION-INTEGRAL-2026-10-24.md).
GitHub consultado: latest sigue en1.3.2 y1.4.0 es draft. La última QA Android
fallida conserva todas sus evidencias y no se repite.

Hallazgo prioritario por código:1.3.2 consulta con cliente anónimo separado de
Perfil; SQL28 ya impide esa sincronización. Con caché válida conserva la copia;
sin ella el lector devuelve listas vacías. Falta observación actual en dispositivo.
El panel de Claude usa también lectura anónima y rutas web ahora protegidas;
necesita adaptación, sin tocar su WIP. Main aún no contiene la web publicada.

Solo se hicieron cuatro lecturas HTTP nuevas: robots200; sitemap/RSS401;
fichaHTML303 al acceso. No se repitieron11/99 ni baterías locales. Automatización
leída PAUSED; no se inicia investigación. Cartera sigue manual/local, investigación
49 incompleta, recuperación del titular sin guardado acreditado, seguridad y
vídeos con los límites del informe. Los tres ayudantes han terminado.

Los cambios de esta entrada son documentales, en el commit que la incorpora.
No hay SQL, correos, cuentas nuevas, builds, otra ejecución nativa ni despliegues.

---

## 24 de octubre de 2026 · Codex · web con cuenta y radar publicada

Producción real: https://414005a7.rwadar.pages.dev y https://rwadar.pages.dev.
Preview revisada: https://2b48b963.rwadar.pages.dev/acceso. Fuente visual en
46f38a0; aprobación web en9f7ea9f. El titular autorizó expresamente esta
producción después de que la revisión automática distinguiera app y web.
SQL28 aplicado con autorización:24 relaciones protegidas,26 plataformas,
49 referencias,retirado=false y SELECT anónimo denegado. No se alteraron filas
ni fechas del catálogo. Once comprobaciones dirigidas de producción aprobadas,
incluida identidad de los recursos de acceso. Investigación PAUSADA.

APK19 inmutable y con la misma firma, sin nueva compilación. Subido como borrador
v1.4.0 conRWAdar.apk ySHA256SUMS.txt; no es una release pública ni cambia latest.
Run privado40121753928 aprobó99peticionesweb/3páginas/87recursos y falló después
por importjson del arnés. Run40122469905 reutilizó esePASS y confirmó login,
pero falló en reauth al redimensionar. Corregido en2496686; UTF8 de etiquetas
restaurado y contrastado en2e6e96f antes de otra ejecución. Nunca atribuir20/20
ni publicar por estos resultados parciales. Víctor autorizó una última
ejecución≤9min:40123408614 falló en login_confirmed al perder la ventana de la
app. El XML final muestra Launcher/QuickSearchBox y ninguna ventana deRWAdar;
no determina si lo causó un gesto del arnés, cierre del proceso o cambio de
foco. Se detuvo conforme al acuerdo: no hay más ejecuciones ni release. Los
ayudantes han terminado.

La cuentaQA temporal se confirmó con un único correo. Limpieza terminada:
wrapper19417 salió con0, inhabilitación reversible comprobada, cero sesiones
restantes y los dos secretos temporales eliminados. No
guardar enlaces de confirmación, JWT ni passwords. Fuentes y resultados en
[verificación24/10](../VERIFICACION-CORREO-Y-ANDROID-2026-10-24.md).

---

## 24 de octubre de 2026 · Codex · correo y validación del mismo APK

Continúa en la rama aislada, sin tocar el main compartido. El alta que parecía
no enviar correo era repetida. Se comprobó recepción real de recuperación;
el primer enlace validó y el segundo intento reutilizó elOTP. Se corrige el
retorno de preview a revision, evitando producción antigua, y se aclara cómo
continuar tras alta200 sin revelar existencia de cuentas. Tres casos nuevos
dirigidos aprobados, sin repetir33/549. No guardar contraseñas ni enlacesOTP.

APK19 se reutiliza: QA40027041965 falló al desplazar sobre Nombre; se conservan
sus originales y fallo. El arnés usa ahora márgenes libres observados y la
continuación40119180570 comprueba solo fuente1,5/giro/excepciones. Aún no hay
aprobación autenticada ni release. SQL28 autorizado, reservado para la activación
web; lote editorial23 aplicado con26/49. [Verificación24/10](../VERIFICACION-CORREO-Y-ANDROID-2026-10-24.md).
La investigación sigue PAUSADA; no iniciar otro ciclo por horario.

---

## 24 de octubre de 2026 · Codex · revisión integral de la entrega actual

La [revisión integral](../../rwadar-entrega-integral-20261022/integracion-140/docs/REVISION-INTEGRAL-2026-10-24.md)
está en el checkout aislado `rwadar-entrega-integral-20261022/integracion-140`,
rama `codex/cierre-android-140-20261023`. Revisión guardada localmente en8f4e9dc,
sin push. Base revisada:9d51f8b. Cambios de esta
sesión: informe, evidencia de cuatro rutas nuevas y corrección del estado vigente;
sin cambios del producto. Se preservan los cambios compartidos de esta carpeta.

Web24/10 publicada; main remoto aún no la integra. GitHub confirma latest1.3.2
y1.4.0draft. El lector anónimo del APK132 no puede sincronizar tras SQL28 y el
panel también necesita adaptar su lectura del catálogo y rutas protegidas.
No hay observación nueva en dispositivo132. El APK19 conserva QA pendiente y
se mantiene detenido tras el último fallo autorizado. Tres ayudantes revisaron
áreas separadas y han terminado; no se repitieron tests aprobados.

InvestigaciónPAUSED, solo manual. Sin SQL, correo, cuentas nuevas, builds,
otra ejecución nativa ni publicación durante la revisión. El traspaso completo
de esta entrega está en el PARA-CODEX del checkout aislado.

---

## 23 de octubre de 2026 · Codex · acceso obligatorio, cartera y tutorial Academy

Se trabajó en la rama aislada codex/cierre-android-140-20261023 sin tocar el
main compartido ni el panel de Claude. Fuente Android consolidada en
`1ecf7e7aa8941400d6ad954680cd6deb89107c42`: acceso obligatorio, cartera manual
local por cuenta, fichas más legibles, aviso desplazable y tutorial de cuatro
pasos dentro de Academy. El APK18 falló de verdad con fuente1,5/lista de altura0;
no reutilizarlo ni reanudar su workflow desactivado como release. Víctor autorizó
una compilación corregida gratuita, terminada como1.4.0/código19. APK de88.961.445
bytes, SHA-256 `f384a20017e09a4bc0650a0be82231b29acf6abd9629e1075442d458bd277624`.
CRC y49 imágenes exactas aprobados. La QA anónima `40022139423` aprobó firma,
paquete y permisos y recorre los formularios; no autoriza la release.

Web: entrada/registro/recuperación, Worker sobre todas las rutas, cookie protegida,
progreso/favoritos UUID, limpieza de caché PWA y tutorial guiado. 549 comprobaciones
web locales al final del recolector sin fallos; 33 de acceso, incluyendo Worker
compilado, sesión, esquema real26/49, reversión y bloqueo de producción si la base
sigue admitiendo anónimos. La pasada móvil inicial223PASS tuvo11 fallos resueltos
con repeticiones dirigidas; los módulos antes bloqueados arrancaron22+18 casos.
QR y herramientas aprobados. Web integrada en `f3cfb1a`, manifiesto `ea64ca2`,
plantilla QA inerte `9c1f2ec`; ancla legal corregida en `3f9ce53`.
Preview final: https://648eaf1f.rwadar.pages.dev y https://revision.rwadar.pages.dev.
Navegador real390/1440 y revisión independiente HTTP de diez rutas protegidas
aprobados; el único hallazgo fue el ancla de condiciones, corregida y comprobada
en la preview final. Supabase continúa con sus permisos anteriores: SQL28 pendiente.
No presentar npm test interrumpido como ejecución
monolítica exitosa. Informe: [cierre local](../CIERRE-LOCAL-1.4.0-Y-ACCESO-2026-10-23.md).

El ciclo manual de hoy preparó cuatro referencias en tres fichas, sin nuevas
altas ni rejuvenecer las otras fechas. SQL editorial revisado independientemente;
SQL28 de acceso y reversión probados. Se solicitó permiso literal
para sus comprobaciones y aplicación: la revisión automática rechazó antes una
consulta de solo lectura por la regla de AGENTS.md. No ejecutar por silencio.
Víctor autorizó ambos cambios: el editorial quedó aplicado a21:19UTC con26/49,
retirado=false y las siete tablas anteriores idénticas por huella. Evidencia en
docs/investigacion/2026-10-23/aplicacion-supabase-editorial.json. SQL28 aún no
se aplica: coordinarlo con la web verificada. No renovar las fechas generales.
La tarea de investigación está PAUSADA; nunca reactivar el horario.

El usuario probó acceso y encontró fallo genérico. Diagnóstico en runtime
Cloudflare: redirect:error no implementado, antes deGoTrue. Parche manual+
rechazo3xx comprobado en workerd y dos pruebas enfocadas. Publicar en preview
antes de pedir otro intento. No cambiar Auth ni crear usuarios de prueba.

Pendientes: activar SQL28 junto a web verificada, cuenta/buzón controlados para alta-confirmación y
recuperación reales, QA autenticada del APK19 y publicación tras compuertas. Los originales
de los dos vídeos siguen sin enlaces recuperables; no atribuirles revisión.
Los ayudantes entregaron cada área y están detenidos, sin trabajo abierto.

---


## 23 de octubre de 2026 · Claude · panel: correos, fechas, velocidad, planes y catálogo

Víctor eligió seis añadidos para el panel (`rwadar-panel/`, rama
`claude/panel-control`). Todo es **de solo lectura**; no se tocó la web, la
app ni la base:

- **Cuentas › Correos** (`lib/correos.js`): remitente y límite por hora (de
  la configuración de Auth, **solo campos no secretos**), altas confirmadas y
  cuánto tardan, cuentas >24 h sin confirmar, y errores de envío de 24 h en
  `auth_logs` con correos e IP tapados.
- **Límites y fechas** (`lib/fechas.js`, `lib/planes.js`): caducidad del
  catálogo, `security.txt` (22/08/2027) y claves del panel; uso de Workers y
  KV de Cloudflare por día, Supabase (plan, salud, último uso), minutos de
  GitHub Actions del mes exactos por trabajo (13 % el 23/10) y compilaciones
  de Expo lanzadas desde GitHub (1 de 15).
- **Tráfico › Velocidad real** (`lib/velocidad.js`): LCP, INP y CLS p75 de 7
  días por móvil/ordenador; sin nota con menos de 10 visitas medidas.
- **Catálogo y Academy** (`lib/contenido.js`): inventario de lo publicado y
  lecciones más leídas. **Ojo:** la web solo carga la analítica en portada,
  Academy y legales (`assets/analitica-*.js`), así que **no se sabe qué
  fichas de oferta/plataforma se abren**. Medirlo (y los clics «Ir a la
  plataforma») es un cambio de la web propuesto aparte; el panel lo cruzará
  solo si aparecen rutas `/ofertas/…` en Web Analytics.
- Hallazgos para revisar: las **26 plataformas** llevan 76–89 días sin
  verificar; **23 de 26** no tienen ninguna oferta y hay ofertas de
  proveedores sin ficha de plataforma (Aktionariat · BOSS, Midas, Alius…).
- Salud pasa de 11 a 14 comprobaciones. Pruebas: `npm run test:panel` 45/45.

---

## 23 de octubre de 2026 · Codex · revisión de pendientes e investigación manual

Víctor pidió contrastar la lista completa, reutilizar el APK 1.4.0 y evitar
repetir pruebas. Tres ayudantes recibieron áreas separadas: web/catálogo,
Android y seguridad/vídeo. Sus revisiones de evidencias no ejecutaron nuevas
baterías ni operaciones remotas. La matriz está en
[`../REVISION-PENDIENTES-2026-10-23.md`](../REVISION-PENDIENTES-2026-10-23.md).
La web integral tiene comprobación de producción del 22/10; eso no se presenta
como una nueva inspección remota del 23/10. GitHub sí se consultó el 23/10:
la última versión pública sigue siendo **1.3.2**. El APK **1.4.0/código 18**
ya está compilado; falta cerrar las fases nativas pendientes antes de publicarlo.

**Corrección efectiva del programador:** la tarea existente se actualizó a
«RWAdar · investigación profunda bajo demanda», con estado **PAUSED**,
comprobado después en su configuración guardada. Solo se inicia al pulsar
**Ejecutar** o con una orden expresa de Víctor; cada inicio corresponde a un
solo ciclo y no reactiva el horario. Investigar no concede por sí solo permiso
para SQL remoto o publicación web. Esta entrada sustituye las referencias a
«ACTIVA a las 09:00» de los traspasos históricos inferiores. No se investigó
ni se publicó catálogo durante esta revisión.

Quedan parciales la investigación documental de las 49 ofertas, el plan 5S y
la revisión exhaustiva de textos. Comunidad sigue apagada: sus refuerzos
adicionales tienen pruebas locales, pero la migración no está aplicada.
Turnstile, allowlist de Auth y pruebas reales de cuentas/dispositivo mantienen
sus pendientes documentados. El vídeo local usa nueve perfiles simulados:
45 tareas observables no acreditan satisfacción humana del 90 %.

---

## 23 de octubre de 2026 · Claude · parche de seguridad de Node.js (aviso de Render)

**Rama:** `claude/node-seguro-2026-10-23`. Nada publicado, nada tocado en Supabase.

- **Origen:** correo auténtico de Render (`no-reply@render.com`) sobre el aviso de
  Node.js del 21/10 (Brotli con ejecución remota, saltos de la comprobación de
  nombre TLS y certificados comprometidos de eMudhra; corregido en 22.23.4,
  24.22.1 y 26.12.1) y PHP2Shell. RWAdar no usa Render ni PHP: la web es
  estática en Cloudflare Pages. Lo afectado es Node en GitHub Actions y en el PC.
- **Cambios:** `rwadar-node-seguro.js` (comprueba la versión y explica cómo
  actualizar; `--comprobar` prueba 16 versiones); los flujos `ci`, `publicar` y
  `compilar-app` fijan `node-version: 22.23.4` (antes `22`, que podía usar el
  Node anterior en caché del runner) y lo comprueban antes de usar la red;
  `test:tools` incluye la tabla; el ciclo diario lo ejecuta en su paso 1 y,
  si falla, sigue igual pero avisa a Víctor al principio del resumen.
- **EAS:** la imagen de Android de SDK 57 trae Node 22.23.1 (vulnerable), así
  que los cuatro perfiles de `rwadar-movil/eas.json` fijan `"node": "22.23.4"`.
  Solo afecta a la próxima compilación (la app no lleva Node dentro y
  `runtimeVersion` es `appVersion`); no se ejecutó EAS. Si esa compilación
  falla al instalar Node, mirar el registro «Spin up build environment».
- **No toqué** `rwadar-publicar.js` ni `rwadar-precargar-imagenes.js`: están en
  `RUTAS_CONTENIDO_APROBADO` y cambiarlos invalidaría la huella aprobada.
- **Pruebas con Node 22.23.4** (descargado y cotejado con `SHASUMS256.txt`):
  todo lo que toca este cambio pasa (`test:tools`, la tabla de 16 versiones,
  la compuerta de publicación sigue aprobada y el detector de secretos no
  encuentra nada). La comprobación para con v22.22.0 (salida 2 y mensaje) y
  deja pasar v22.23.4.
- **`main` ya estaba en rojo antes de esto** (Verificación de `1a0643d`), no por
  Node: con v22.22.0 falla igual. Víctor pidió no tocar el trabajo de Codex, así
  que **no se cambió**; queda para Codex, con el arreglo ya probado en una copia:
  1. `probar-precarga.cjs:47` crea su temporal dentro de
     `rwadar-entrega-integral-20261022/`, que solo existe en el PC → `ENOENT` en
     GitHub. Basta con `fs.mkdirSync(path.join(raiz,'rwadar-entrega-integral-20261022'),{recursive:true})`
     justo antes.
  2. `rwadar-movil/tests/ofertas-vigencia.test.cjs`: 16 pruebas fallan con
     `P is not defined`, porque el fragmento web usa `P` y `EMI` para
     `RUTAS_FICHAS_DESPLEGADAS`; basta con añadir `P: [], EMI: []` al contexto de
     `cargarWeb`. Otras 2 (líneas 681 y 699) siguen la regla antigua de imágenes;
     hay que ponerlas al día con el contrato que ya prueba `probar-precarga.cjs`
     (`oferta-<slug>.webp`, la categoría como `respaldo` y `null` con un slug no
     válido). Con esos tres cambios, en una copia limpia con Node 22.23.4:
     web 551/551, app 233/233, precarga 29/29 y `npm test` correcto.
- **Pendiente para Víctor:** actualizar Node en el PC a la última de su rama
  (`node --version`; instalador en `https://nodejs.org/dist/latest-v22.x/` o
  `latest-v24.x/`), o pedírselo a Codex en el PC. Hasta entonces el ciclo diario
  funciona igual y lo recuerda cada día.
  Después, `node rwadar-node-seguro.js` debe decir que lleva el parche.
  Navegadores y Android reciben la retirada de eMudhra con sus propias
  actualizaciones; no hace falta compilar la app.

---

## 22 de octubre de 2026 · Claude · panel de control (`rwadar-panel/`)

Víctor pidió un panel para controlarlo todo y compartirlo con sus socios por
WhatsApp, entrando solo con un enlace. **Commits en la rama local
`claude/panel-control`** (no subida a GitHub, no unida a `main`); en la carpeta
de trabajo los mismos archivos siguen sin seguimiento sobre `main`, junto a los
cambios sin subir de Codex en `AGENTS.md` y `docs/`, que no se han tocado.
**No se ha publicado nada ni se ha tocado Supabase ni Cloudflare**: todo se
probó contra un simulador local (`rwadar-panel/demo/simulador.js`).

- **23/10 (cierre):** rama `claude/panel-control` subida a GitHub (7 commits, sin unir a `main`; no lanza ningún flujo). Traspaso completo en `docs/tareas/PANEL-DE-CONTROL.md` de esa rama.
- **23/10 (tarde):** `GITHUB_TOKEN` fino de solo lectura (RWADAR y
  RWAdar-downloads; comprobado que no ve Calix) subido al Worker: la nube ya
  ve copia de seguridad, tareas y descargas. El uso de la app tiene 25 s de
  margen y, si Supabase no contesta, sale de lo apuntado cada hora. Recorrido
  final en la nube: todo correcto salvo el aviso real de Actions (Compilar
  app Android, Publicar web, Verificación). Pruebas 36/36.
- **23/10:** Víctor decidió que el panel **no apague la web** (cuando haga
  falta os lo pide a vosotros): quitados el botón, la página de
  mantenimiento y los despliegues de Pages (rama, commit `e174ccb`). Panel
  subido de nuevo con los mismos enlaces (huellas comprobadas). Cloudflare
  solo cuenta exacto los últimos 7 días (más allá muestrea 1/10): el panel
  apunta cada día las visitas exactas en KV. Retirar el catálogo solo se
  ofrece si la base da permiso (hoy no: 42501). Pruebas 35/35 y recorrido
  completo con datos reales, local y nube.
- **Estado al cierre (22/10, noche):** Víctor puso sus claves y dio permiso
  expreso para subirlo. Worker `rwadar-panel` subido a
  <https://rwadar-panel.victorjorquesgranero.workers.dev> con KV
  `rwadar-panel-almacen` y cron horario. Se renovó `wrangler login` (la sesión
  anterior solo tenía Pages; ahora tiene los permisos por defecto). Comprobado
  desde fuera: sin enlace 401, enlace falso 403, enlace real entra; salud,
  visitas, cuentas (9) y uso de la app (95 app / 81 web en 24 h) con datos
  reales. Rama con 4 commits (`f2441b3` y el de GitHub). **Pendiente de
  Víctor:** permiso «Cloudflare Pages · Edit» en el token del panel (sin él
  no hay encender/apagar), un `GITHUB_TOKEN` de solo lectura (desde Cloudflare
  GitHub limita las consultas sin clave) y decidir si se da a `service_role`
  `SELECT, UPDATE` en `catalogo_publicacion` (hoy el botón de retirar el
  catálogo da 42501; también `perfiles` y `vigilancia` están cerradas).
- **Segunda tanda:** datos de la app (aperturas del catálogo desde la app y la
  web por hora, leídas de los registros de Supabase con `SUPABASE_ACCESS_TOKEN`;
  historial por día y descargas por día) y entrada por **enlace personal** sin
  cuentas (llave tras `#`, cookie firmada 90 días, solo huellas en el Worker,
  anulable por persona). Cloudflare Access queda como opción. Cron horario en
  el Worker. Pruebas 31/31.
- **Sin comprobar contra producción (además de lo de abajo):** la consulta
  ClickHouse a `logs` (`source_name`, `log_attributes[...]`) y el formato de
  `event_message`; la doc de Supabase no es del todo coherente.

- **Qué hace:** encender/apagar la web (sube una página de mantenimiento 503 y
  vuelve al despliegue anterior con la API de Pages), retirar/mostrar el
  catálogo (`catalogo_publicacion.retirado`), salud con doce comprobaciones y
  qué hacer, visitas de Web Analytics (GraphQL `rumPageloadEventsAdaptiveGroups`),
  descargas del APK por versión, cuentas (listar, confirmar, bloquear, borrar
  con el correo escrito) y registro de acciones con quién las hizo.
- **Dos modos:** `npm run panel` (local, 127.0.0.1, sesión por arranque) y el
  Worker `rwadar-panel` en Cloudflare detrás de Cloudflare Access + lista
  `PANEL_SOCIOS`, con verificación propia del JWT (falla cerrado).
  Detalle y pasos en `rwadar-panel/LEEME.md`.
- **Toca fuera de la carpeta:** `.gitignore` (readmite `rwadar-panel/`,
  ignora `datos/`, `datos-demo/` y `nube/generado/`) y `package.json`
  (`panel`, `panel:demo`, `panel:nube`, `panel:nube:demo`, `test:panel`, y
  `test:panel` dentro de `npm test`). No toca `rwadar-site/` ni ninguna ruta
  con huella aprobada.
- **Pruebas:** `npm run test:panel` 25/25; `npm run test:tools` correcto;
  `npm run panel:nube -- --ensayo` empaqueta el Worker con wrangler 4.125.0
  (62 KB, sin módulos de Node ni claves); el Worker se ejecutó en `wrangler dev`
  con Access simulado y se recorrió en el navegador (socio, intruso, móvil).
- **Sin comprobar contra producción:** los nombres de campos de la consulta
  GraphQL de visitas, la vuelta atrás de Pages, la API de administrador de
  Supabase y el PATCH del catálogo con la clave secreta. Se verán la primera
  vez que Víctor abra el panel con sus claves.
- **Pendiente de Víctor:** crear el token de Cloudflare y la clave secreta de
  Supabase, rellenar `PANEL_SOCIOS`, ejecutar `npm run panel:nube`, activar
  Access en el Worker y apagar/encender una vez desde el ordenador para dejar
  subida la página de mantenimiento.

---

## 22 de octubre de 2026 · Codex · cierre de reintentos por consumo

Víctor ha reprochado el consumo desproporcionado. Se detuvieron los agentes y
las revisiones delegadas; no lanzar más reintentos por iniciativa automática.
La web integral está publicada en `rwadar.pages.dev` (e764634c) y comprobada.
Android público sigue en 1.3.2. El APK 1.4.0/código18 está compilado, pero sus
ensayos no han cerrado correctamente: **no está aprobado ni publicado**.
Último ensayo: 39812931682, head público40f926f, fallo en el recorrido;
la descarga diagnóstica no equivale a una QA superada.

El soporte de precarga está en `de7f2b1`, aprobado para preview en `b3deb41`;
`1a0643d` separa referencias documentales duplicadas. Preview `b0fa07a6`
publicada, sin comprobación remota final ni producción de ese soporte.
Pruebas locales:551web+90fichas+29precarga; no repetirlas sin un cambio o fallo.
La tarea diaria sigue ACTIVA a09:00localPC, pero las altas nuevas están
bloqueadas hasta publicar/verificar la compatibilidad web y Android>=1.4.0.
No se aplicó SQL nuevo durante este cierre. Revisar workingtree y
`rwadar-entrega-integral-20261022/CONTINUACION.md` antes de retomar; conservar
el catálogo completo y la versión pública. Falta cerrar también la lectura
canónica de Cloudflare mediante su autenticación vigente y el texto del horario.

## 22 de octubre de 2026 · Codex · segunda revisión integral, idiomas y ciclo diario

Trabajo posterior al cierre de la web y Android 1.3.2 descrito debajo. Se integró
la reorganización de Claude y se atendió la ampliación pedida por Víctor. La
publicación nueva se documenta por separado; no reutilizar la prueba de 1.3.2
como si demostrase el APK 1.4.0.

- **Fuente móvil:** `6735317` y `3af2033`, Android 1.4.0, fichas acotadas al área visible,
  radar y sus toques corregidos, datos editoriales citables e idiomas ES/EN.
  Suite final 233/233 y comprobación Expo/Metro correcta. El candidato de código
  17 se canceló por una modificación durante la preparación del archivo; se
  consolidó esa corrección y se inició el código 18 dentro de la cuota gratuita.
  La QA y publicación se cierran con sus propios identificadores cuando terminen.
- **Catálogo aplicado:** lote del 22/10, vigente hasta el 29/10, 26 plataformas,
  49 referencias y 4 descartes. SQL editorial revisado, PGlite y lectura pública
  posterior. IOD cerrado. Los nuevos detalles investigados en el informe de
  condiciones no se aplicaron automáticamente como hechos acreditados.
- **Web publicada y comprobada:** segunda mitad de la reorganización, detalle sin
  recorte, campos mínimo EUR/España/salida/costes, 49 páginas de oferta,
  26 de plataforma, 4 de descarte, metodología, cambios y RSS. Snapshot
  separado del comportamiento, helper común y fuentes WOFF2 reutilizadas.
  Fuente integrada en `ab61990`, correcciones públicas `386f86f`, `da2ae49`,
  `f0a413a` y comparación móvil `2c98d46`. Cuarta preview aprobada y producción
  desde `08b18a4`: 208/208 HTTP, 206/206 recursos idénticos y Chrome real a
  320/390/1440, ES/EN, persistencia, búsqueda, foco y comparación. Suite web
  final 551/0 y 90 comprobaciones de páginas; cobertura transversal completada
  por áreas en logs preservados, sin atribuir un único `npm test` final exitoso.
- **Vídeo local entregado:** evaluación grabada de la interfaz real mediante
  nueve perfiles simulados, 45/45 tareas observables y reproducción completa
  de la edición final. No es investigación con nueve personas reales.
- **Tarea diaria activa:** «RWAdar · investigación y publicación diaria», a las
  09:00 locales del PC por autorización expresa de Víctor; actualmente coincide
  con España peninsular. Investigación documental profunda, decisión diaria
  binaria, sin cola «en investigación», revisión independiente y publicación
  editorial tras las compuertas. PC y aplicación deben estar encendidos.
- **Seguridad:** comunidad OFF y su refuerzo probado localmente, sin aplicar
  esa migración; callback de cuentas corregido. Turnstile, allowlist real de
  Auth y los flujos con credenciales del titular siguen separados y pendientes.

Detalle: [`VERIFICACION-MEJORA-INTEGRAL-2026-10-22.md`](../VERIFICACION-MEJORA-INTEGRAL-2026-10-22.md),
[`CICLO-DIARIO-CATALOGO.md`](CICLO-DIARIO-CATALOGO.md) y los informes de
condiciones y seguridad fechados el 22/10. No borrar informes anteriores.

## 22 de octubre de 2026 · Codex · web desde main y Android 1.3.2 publicados

**Rama:** `main` de `victorJorques/RWADAR`, privado. Víctor autorizó en el turno
la preview, producción, EAS editorial y la distribución Android como 1.3.1.
Se leyó primero la entrada del 21/10 y se hizo `git pull --ff-only origin main`.

- **Web publicada:** <https://rwadar.pages.dev>. El catálogo del 21/10 ya estaba
  aplicado por Víctor; se leyó y sincronizó sin escribir en Supabase. Snapshot
  26 plataformas, 4 descartadas y 49 referencias (24/21/4), vigente hasta el
  28/10. Las 49 fichas tienen su imagen nueva. El primer intento se detuvo por
  snapshot modificado; se revisó y consolidó antes de publicar. Preview y
  producción tienen 35/35 controles HTTP y 113/113 recursos idénticos.
- **Commits fuente enviados:** `0a49969` (snapshot y preparación), `9f5ab61`
  (huella aprobada) y `8821228` (preview y dependencias). Web y APK salen de
  ese corte de main. El cierre documental y las copias inertes de workflows
  están en el commit que contiene esta entrada; no cambian el binario entregado.
- **Android final:** [RWAdar 1.3.2](https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.3.2),
  código **16**, perfil editorial. Una sola compilación EAS, misma firma que
  1.3.1. Publicada como latest final el 22/10; APK, sumas y ZIP de evidencia
  descargados sin autenticación y cotejados. `/android` lleva a 1.3.2.
- **QA del APK:** ejecución `39701844100` exitosa con el binario exacto:
  instalación, cuatro pestañas, catálogo, Academy, favorito tras reiniciar,
  cinco fotos y formularios sin credenciales. Capturas propias revisadas por
  tres agentes; separación de la nota de favoritos 92 px. La primera ejecución
  pasó el uso pero falló por el límite inicial del ZIP; se amplió solo ese
  límite y se repitió el mismo APK conservando todas las capturas.
- **Publicación Android:** ejecución `39702655647` exitosa; commits públicos
  `3b366a3` (QA definitiva), `77371f1` (publicación tras revisión) y `340a906`
  (controles de publicación devueltos a `NO`, sin repetir Actions). El origen
  privado no cambió de visibilidad. No se publicaron tiendas ni OTA.
- **Pruebas y coste:** `npm ci` raíz y móvil; `npm test` completo correcto,
  web 502/502, móvil 184/184, base/QR/herramientas correctos; compuerta final
  51/51. Navegador real
  móvil y escritorio y formularios observados sin envíos. EAS Free después:
  Android 5/15, total 6/30, cero exceso, complementos y coste estimado.
- **Avisos pendientes:** Expo Doctor 20/21 por seis parches recomendados;
  `npm audit` conserva 21 avisos móviles y uno alto en raíz, cero críticos.
  No se cambiaron locks ni se silenciaron avisos. Quedan Auth con credenciales
  reales, recuperación efectiva, entrega de correo y teléfono físico;
  no se atribuyen a la QA del emulador. Renovar catálogo antes del 28/10.
- **Archivos locales preservados:** los tres archivos sin seguimiento del
  manual están en `rwadar-respaldo-local-20261022/`, con manifiesto y SHA,
  fuera de rutas publicables. La evidencia detallada queda en la carpeta
  ignorada `rwadar-entrega-20261022/`; no restaurar el PDF al sitio público.

Informes: [`VERIFICACION-PUBLICACION-2026-10-22.md`](../VERIFICACION-PUBLICACION-2026-10-22.md),
[`VERIFICACION-ANDROID-1.3.2-2026-10-22.md`](../VERIFICACION-ANDROID-1.3.2-2026-10-22.md)
y [`VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-22.md`](../VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-22.md).

## 21 de octubre de 2026 · Claude (10) · catálogo del 21/10, fotos por ficha, revisión de la web y comunidad

**Rama:** `claude/integracion-2026-10-19` (une lo publicado por Codex el 11/10 con todo lo del catálogo). **Nada aplicado en Supabase ni publicado.** Codex no ha subido nada desde el 11/10, así que no hay solapes.

- **Catálogo:** lotes del 20/10 (`504bee7d`) y **21/10 (`c3b71e81`, vigente hasta el 28/10)** con `npm run catalogo`; 69/69 fuentes, PGlite OK dos veces. Vale el del 21/10. Detalle: `docs/CATALOGO-V2-2026-10-21.md`.
- **Imágenes por ficha (contrato editorial v2):** las 49 fichas tienen foto generada del activo (44 con RealVisXL V5.0 Lightning en la sesión, 5 con Canva), retocada y con lugar y tres pasos. Fuente en `rwadar-editorial-source/ofertas/` (`fotos.json`, `fotos/`, `fotografiar.py`, `generar.mjs`). La app las enseña desde su próxima versión: **hace falta 1.3.2 (número y EAS son tuyos)**. Revisión: `docs/comercial/REVISION-IMAGENES-OFERTAS-2026-10-21.md`.
- **Tarjetas al estilo Booking:** web: «Guardar» sobre la foto (solo móvil, 44 px), lugar con chincheta, tarjeta entera abre la ficha (el control sigue siendo «Ver ficha»), aviso no bloqueante a dos líneas. App: lugar con icono `lugar` en `FichaOferta`.
- **Revisión de 20 puntos de la web:** títulos de la Academy ≤ 65 caracteres (`tituloPestana`, el `og:title` conserva el completo), descripción del índice ≤ 160, objetivos táctiles del pie y migas ≥ 24 px, `og.png` rehecho con `rwadar-editorial-source/og.mjs` (decía `rwadar.netlify.app` y «26 pasan el filtro»; 639 → 75 KB).
- **Comunidad (27, preparada y sin aplicar):** se podía saltar «una al día» publicando, borrando y volviendo a publicar, y borrar una oculta por denuncias. Ahora el cupo vive en `cupos_publicacion` (no se libera al borrar) y la oculta no la borra su autor. `probar-comunidad.mjs` 33/33. Se editó `27_comunidad.sql` directamente porque **no está aplicada**: si alguien la aplicó, hace falta una migración aparte.
- **Pendiente de seguridad para Víctor/Codex** (revisión de solo lectura, sin verificar del todo): activar Turnstile (las altas y recuperaciones agotan los 30 correos/hora); dejar en Supabase solo `https://rwadar.pages.dev/` como URL de redirección; valorar en la comunidad comprobar `sesion_confirmada()`, filtrar enlaces también en `autor` y que tres cuentas nuevas no basten para ocultar; en la web, no pintar el `error_description` crudo y avisar con qué correo se entra al adoptar una sesión del enlace.

## 19 de octubre de 2026 · Claude (9) · orden única del catálogo y revisión total

**Rama:** `claude/revision-catalogo-2026-10-19` (PR #12). **Nada aplicado en Supabase ni publicado.**

- **`npm run catalogo`** (`rwadar-app/actualizar-catalogo.mjs`): captura,
  comprueba las 69 fuentes del radar contra `rwadar-app/data/comprobaciones-fuentes.json`
  (reintenta una vez las que fallan), pone al día las 49 fichas con lo leído
  (Brickwise app y API, Aktionariat y portales, Spiko, Prosegur, Alius,
  Hausera, P2P de Reental, Midas), monta, prueba en PGlite y escribe
  `informe-<fecha>.md`. Si falla una fuente del radar no monta nada (sale con 2).
  Probada de punta a punta con captura real simulando el 20/10: 69/69, lote OK.
- `capturar-fuentes.mjs`: hora de Madrid, PDF siempre con curl (dos
  identidades, comprueba `%PDF`), segundo intento por HTTP (navegador y curl)
  si hay bloqueo o 5xx, y paginación del P2P de Reental esperando a sus textos.
- **Lote del 19/10 rehecho:** `aa3aebce` (antes `f9876935`). Fuente de la
  portada de Midas → `midas.app/llms.txt` (la portada ya bloquea la nube);
  aviso general con la redacción de producción («Referencia editorial
  gratuita…»); aviso de quitt (encabezado y tabla no coinciden); número de
  accionistas.
- **Producción ≠ `main`:** Supabase tiene el lote `966c230c` (fichas del 11/10)
  cuya fuente no está en GitHub, y la web/app publicadas salen de
  `codex/cuentas-web-movil`, sin unir. El lote nuevo se probó también en una
  copia de esa rama: `comprobar-revision` OK, `probar-web` 501/501 y la web
  generada con las vistas que saldrán de Supabase se ve bien en Chromium
  (19.10.2026, Spiko 2,41 %, sin cookies ni errores). **Publicar desde esa
  rama**, no desde `main`.
- Revisión total: web en producción 35/35 y base 2/2 en solo lectura; sin
  cookies propias (la `__cf_bm` de Supabase no se guarda); cabeceras de
  seguridad presentes; `/android` → última release; copias diarias correctas
  hasta hoy; `npm audit` raíz y base 0, móvil 23 (los que Codex ya evaluó).

## 19 de octubre de 2026 · Claude (8) · revisión del catálogo del 19/10, preparada sin aplicar

**Rama:** `claude/revision-catalogo-2026-10-19`. **Nada aplicado en Supabase ni publicado.**

- Herramientas nuevas (primera sesión del día, sin internet):
  `rwadar-app/capturar-fuentes.mjs`, `montar-revision.mjs` y
  `comprobar-revision.mjs`, para cualquier fecha. Estado y reglas en
  `docs/tareas/REVISION-CATALOGO-2026-10-19.md`.
- **Revisión del 19/10** (segunda sesión, con internet): lote `aa3aebce`,
  vigente hasta el 26/10. 69 fuentes del radar y las 49 fichas consultadas el
  19/10 desde la nube (salida en EE. UU.). Mismo manifiesto 26/49 (24/21/4).
  Detalle en `docs/CATALOGO-V2-2026-10-19.md`; evidencia en
  `rwadar-app/data/verificaciones/2026-10-19-v2/contraste-2026-10-19.json`.
- **Retirado el documento de claude.ai** de las 49 fichas (205 referencias);
  los textos que lo citaban se reescriben con la fuente oficial.
- Midas bloquea la nube: mF-ONE y mTBILL pierden la cifra; las cuatro de Midas
  quedan «no verificable» con aviso. Spiko 2,41 %. IOD Occasio, ya en campaña.
- Pruebas: `comprobar-revision.mjs 2026-10-19` OK (aplicado dos veces sobre la
  cadena de producción en PGlite). `npm test`: db, qr, móvil y herramientas en
  verde; `test:web` falla hoy **también en `main`** porque el catálogo
  incrustado en la web (06/10) caducó; con el reloj al 10/10, 501/501.
- **Pendiente de Víctor:** pegar
  `rwadar-app/data/importaciones/catalogo-2026-10-19-v2/aplicar-y-aprobar.sql`
  en Supabase › SQL Editor › Run y publicar la web como el 06/10
  (sincronizar, dos rondas de commit + aprobación en `estado.json`,
  `--preview`, `--produccion`). Al sincronizar, `test:web` vuelve a verde.
## 11 de octubre de 2026 · Codex · cierre publicado: cuentas web y Android 1.3.1

Fuente en worktree `codex/cuentas-web-movil`; **no modificar la carpeta
principal**, que está atrasada y conserva material de Academy sin seguimiento.
Commit de contenido **`a213373`** (autor Codex): panel de cuentas Android
1.3.0, aislamiento de sesiones y carreras web, transporte acotado y baja
reautenticada, pruebas, privacidad y cuatro parches compatibles Expo SDK 57.
Fuente Android final en **`53d4c33`**: separación propia positiva de la nota
local, «1 guardado», versión 1.3.1 y dos regresiones; dependencias y motor de
cuentas intactos. El cierre técnico/documental conserva este commit compilado
y la huella web aprobada, sin regenerar ni volver a desplegar contenido web.
**Cierre guardado y sincronizado en `1148323`**: informes, manifiesto,
documentación vigente y QA de APK14; auditor local posterior con árbol limpio,
«LISTO PARA CORTE FINAL» y huellas de contenido/alcance idénticas a las aprobadas.

**Verificado:** `npm test` final salida 0, web 501/móvil 182/SQL de sesión 196;
Chrome aislado 61 y 30, revisión independiente 54 nativos/196 SQL/30 Chrome,
sin otro bloqueo del núcleo. Gitleaks 8.30.1 limpio y `git diff --check` limpio.
Los ensayos usan datos ficticios y no demuestran correo ni un APK instalado.

**En línea:** Víctor introdujo personalmente la contraseña de aplicación de
Gmail; confirmó recepción de alta y enlace válido (llegó a spam). Codex vio
el perfil y comprobó salir. Recuperación pedida a las 08:14:18 UTC y recibida
en INBOX, con DKIM/SPF/DMARC correctos, solo metadatos y sin leer el token.
El cambio final real de contraseña todavía **no se ha realizado**.

La migración `20261011074218_cuentas_sesion_confirmada.sql` **ya se aplicó**
con permiso expreso y se verificó en producción. No reaplicar la 26 sin
rehacer después este refuerzo. El catálogo sigue público (26/49 y 4
descartes), lote del 6/10 vigente hasta el 13/10. El asesor da 0 ERROR,
4 WARN y 3 INFO; límites documentados, no «seguridad absoluta».

**Web publicada y comprobada:** revisión `d91d4e14`, producción `4c7d38e5`,
<https://rwadar.pages.dev>. Las cuentas ya están abiertas; formularios de
acceso/alta y Perfil observados en navegador. HTTP **35/35** y huellas
**64/64** idénticas al artefacto aprobado. Aprobación y QA Android en
`aa886d2`, después del manifiesto `3a0d953`. La fuente web es `a213373`.

**Android autorizado solo sin cargos:** EAS terminó 1.3.0/código 13,
commit compilado `3a0d953`, 85.622.388 bytes. Firma y manifiesto comprobados
localmente; instalación y ejecución del APK exacto aprobadas en emulador API35. Expo Doctor
**21/21** y pruebas **180/180** en copia aislada, nunca sobre las junctions
principales. EAS Free: 2/15 usados y cargos cero. Publicación real
<https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.3.0>, a las
09:17:18 UTC, QA/release `38127611672` exitoso. La descarga anónima posterior
coincide byte a byte con el APK ensayado y conserva la firma. Evidencia pública
ZIP y sumas verificadas. Flujo publicado en `f01dbc2` y desarmado en `6d4280e`;
README público actualizado en `d045b4c`. No hay publicación en las tiendas.

La revisión visual posterior detectó una nota local que cruzaba el borde del
panel de recuperación. **Corregida, publicada y verificada en 1.3.1/código14**:
<https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.3.1>.
EAS terminó a las 09:36:36 UTC, fuente `53d4c33`, APK **85.622.508 bytes**;
cuota Free posterior Android **3/15**, total **4/30**, cero coste/exceso/addons.
QA y release propias `38129282799`, jobs `114440050549`/`114440579448`,
exitosas; publicación **09:45:05 UTC**, latest pública, no draft/prerelease.
Descarga anónima posterior comprobada: APK y ZIP idénticos a sumas/evidencia,
firma v2 válida y certificado anterior. Resultado propio: separación **92px**,
navegación, catálogo, Academy, favorito persistente y formularios correctos.
Cuatro capturas propias de cuentas revisadas por Codex y otro agente; nota
fuera del borde, singular correcto, sin otro bloqueo visual observado.
No atribuir al APK14 las pruebas históricas del13 ni declarar Auth real desde
Android, SMTP nativo o teléfono físico. Commit público de lanzamiento
`8c49368`; `2f44074` dejó `PUBLICAR_RELEASE=NO` con `[skip ci]`.
El espejo privado queda en NO; plantilla auxiliar no utilizada retirada,
recuperable en Git. Móvil **182/182** y Doctor **21/21** correctos.
[`VERIFICACION-ANDROID-1.3.1-2026-10-11.md`](../VERIFICACION-ANDROID-1.3.1-2026-10-11.md).
La auditoría npm no es limpia: 23 avisos, evaluados sin vía vulnerable
demostrada en el alcance analizado, con inventario estático adicional 1.3.1.
No equivale a descompilar Hermes. No ocultarlos ni forzar downgrades incompatibles.
[`VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-11.md`](../VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-11.md).

Publicidad, cobros, comisiones, opiniones, comunidad, avisos y manual siguen
apagados. El manual se reserva a usuarios registrados: no publicar un PDF
estático como entrega. Codex asume configuración, código, pruebas y despliegue;
Víctor solo introduce credenciales/identidad y autoriza operaciones reservadas.

Continuar según [`CUENTAS-WEB-MOVIL-2026-10-11.md`](CUENTAS-WEB-MOVIL-2026-10-11.md).
Evidencia en [`../VERIFICACION-CUENTAS-2026-10-11.md`](../VERIFICACION-CUENTAS-2026-10-11.md).
Publicación y descarga ya cerradas y comprobadas; queda mejorar entregabilidad
del correo en spam, cambio real de contraseña y entrada posterior, prueba de
Auth nativo con credenciales reales y teléfono físico. Son límites de evidencia,
no tareas de código asignadas a Víctor. No activar monetización, manual ni
tiendas sin cumplir sus requisitos separados. Repetición HTTP final: 35/35.


## 8 de octubre de 2026 · Claude (8) · cuentas fase 1: casi abiertas, falta que Gmail acepte la contraseña

**Rama:** `claude/abrir-cuentas` (sale de `main` tras el PR #10). PR abierto
para que lo revises. **La web pública NO tiene las cuentas encendidas**;
solo la vista previa `https://revision.rwadar.pages.dev`.

### Ya hecho y comprobado

| Qué | Dónde / cómo se comprobó |
|---|---|
| Web: `SERVICIOS_USUARIO_REMOTOS=true` y `CORREO_AUTH_E2E=true`; opiniones, avisos por correo, comunidad, manual y Turnstile siguen apagados | `rwadar-site/assets/rwadar-20260820.js` |
| Privacidad reescrita para cuentas abiertas (7/10/2026): apartado «Tu cuenta (opcional)», correos de confirmación/recuperación por una cuenta de Gmail de RWAdar, sesión solo en memoria, borrado desde Perfil, conservación | `rwadar-site/privacidad.html`, `sitemap.xml` |
| Pruebas: el camino cerrado se sigue probando sobre la misma web con los interruptores apagados (`jsCerrado` en `probar-web.mjs`) | `npm test` en verde |
| Ensayo E2E en Chrome real contra Supabase simulado (PGlite + 26): alta, confirmación, entrar, vigilar, recuperar, móvil, borrar, Turnstile | `node rwadar-app/ensayo-cuentas-web.mjs` → **61/61** (Playwright con `RWADAR_CHROMIUM` = Chrome instalado) |
| Migración 26 + verificador en una transacción | `rwadar-app/db/26_abrir_cuentas_un_paso.sql`; probado en PGlite (dos veces) |
| **Supabase producción:** 26 aplicada (SQL Editor, «Success», verificador sin excepción) | 07/10, 23:3x |
| **Supabase Auth:** SMTP propio activado (remitente y usuario `rwadares@gmail.com`, nombre `RWAdar`, `smtp.gmail.com`, puerto 587); plantillas en español «Confirma tu cuenta de RWAdar» y «Recupera tu acceso a RWAdar» (texto de `REABRIR-CUENTAS.md`); **altas abiertas**; confirmación de correo obligatoria; contraseña mínima 12 (ya estaba); Redirect URLs: añadido `https://revision.rwadar.pages.dev/` | `GET /auth/v1/settings` → `disable_signup:false`, `mailer_autoconfirm:false` |
| Vista previa con cuentas | despliegue `b8745f05`, alias `revision.rwadar.pages.dev`; `comprobar-publicado.mjs` 35/35; aprobación en `estado.json` (commit `e87141c`) |

### Lo que falla ahora (bloqueante)

Al crear una cuenta en la vista previa sale «Error sending confirmation
email». En *Logs › Auth* de Supabase:
1. Primer intento: `535 5.7.8 Username and Password not accepted` (credenciales).
2. Último intento (08/10 00:02): `534 5.7.9 Application-specific password required`.
   Es decir: la verificación en dos pasos de `rwadares@gmail.com` ya está
   activa, pero en *SMTP Settings › Password* sigue la contraseña normal de
   Gmail. Hay que generar una **contraseña de aplicación** en
   https://myaccount.google.com/apppasswords (16 letras, **sin espacios**) y
   pegarla ahí › *Save changes*. Esto solo lo puede hacer Víctor: ni Claude
   ni Codex deben crear credenciales ni escribir contraseñas.

Quedó una cuenta de prueba de Víctor **sin confirmar** en Auth › Users: al
registrarse otra vez con el mismo correo se reenvía la confirmación; si no,
borrarla desde ahí.

### Lo que falta, en orden

1. Víctor: contraseña de aplicación en Supabase (arriba).
2. Prueba real en `https://revision.rwadar.pages.dev`: crear cuenta, recibir
   «Confirma tu cuenta de RWAdar», confirmar, vigilar una plataforma, salir y
   entrar, «He olvidado la contraseña», borrar la cuenta. Si un paso falla,
   el motivo está en Supabase › Logs › Auth (abrir la fila y leer `error`).
3. Publicar en producción desde la rama: `node rwadar-publicar.js --produccion`
   (si sincroniza y ensucia JS/portada/sitemap: commit + nueva aprobación en
   `estado.json` y repetir, como siempre) y comprobar con
   `node .github/comprobar-publicado.mjs https://rwadar.pages.dev`.
4. Supabase › URL Configuration: quitar `https://revision.rwadar.pages.dev/`
   (y valorar quitar `https://rwadar.netlify.app/`, que es solo la página de
   limpieza). Deben quedar solo los de `rwadar.pages.dev`.
5. Unir el PR de `claude/abrir-cuentas` a `main`.
6. Recomendado antes de anunciar cuentas: anti-robots Turnstile (sección
   «Anti-robots» de `REABRIR-CUENTAS.md`: Víctor crea el widget y pega la
   Secret Key en Supabase; la Site Key va al JS, CSP en `_headers` y
   `rwadar-servir.js`, privacidad y pruebas).
7. Gmail no está pensado para envíos masivos (unos cientos al día). A medio
   plazo: dominio propio + Brevo (`REABRIR-CUENTAS.md`, opción B).

### Otros pendientes que no son de cuentas

- **El catálogo vence el 13/10** (lote `a0df3111`). Repetir la revisión antes
  (`docs/CATALOGO-V2-2026-10-06.md`); si no, web y app muestran «Revisión
  pendiente».
- Modo de la sesión de Claude: aun fuera de «Auto», el filtro de Claude bloquea
  pulsar «Run» en el SQL Editor de producción; Víctor tuvo que pulsarlo.

## 7 de octubre de 2026 · Claude (7) · catálogo del 06/10 en producción, web y app 1.2.0 publicadas

- **Supabase:** Víctor pegó `aplicar-y-aprobar.sql` tres veces (SQL Editor).
  Lote vigente **`a0df3111`** (06/10, hasta el 13/10). Sustituye a `36945ee9`
  (cifra principal de mF-ONE y Spiko sin actualizar: el montador buscaba la
  etiqueta en métricas ya cambiadas) y a `c0e20ca3` (texto de Spiko con
  «observado el 30/09»). Cada corrección se probó en PGlite encima de los
  lotes ya aplicados. Comprobado por REST anónimo: 26/49 y contrato de la app.
- **Web:** despliegue de producción `b3fcc32f` desde el ordenador de Víctor;
  `comprobar-publicado.mjs` 35/35 en `rwadar.pages.dev`; mF-ONE 7,58 %,
  Spiko 2,16 % «observado el 06/10/2026», «Última revisión del registro:
  06.10.2026». Sincronizar cambia JS y portada: dos rondas de commit +
  aprobación en `estado.json`, como siempre.
- **Pruebas:** `probar-web.mjs` tenía el reloj de la pestaña simulada fijo
  en el 30/09 y fichas sintéticas de septiembre; ahora se fechan respecto al
  lote incrustado (`fechaLoteEmbebido`, `pestanaCatalogo({ inicio })`).
  Sin esto, cualquier lote nuevo rompía `npm test`.
- **App 1.2.0, versionCode 12:** build EAS `99fd77d8` (la `6c3ed542` murió
  por un fallo del servidor de Expo). APK 85 558 264 bytes, SHA-256
  `87900ef2…b8e3ea`, certificado `f506dea7…` (el de siempre). Probada en
  emulador Android 15 con el flujo nuevo `android-smoke-120.yml` del repo
  `RWAdar-downloads` (run 37446968987: Inicio, Buscar 24/21/4, Spiko 2,16 %,
  Academy 7 lecciones, Perfil; sin errores). Release `v1.2.0` marcada como
  latest; `/android` lleva a ella y la descarga anónima coincide byte a byte.
- `gh` instalado en el ordenador de Víctor (cuenta victorJorques, con
  permiso `workflow`).

## 6 de octubre de 2026 · Claude (6) · revisión nueva del catálogo, app 1.2.0 compilando

**Rama:** `claude/revision-catalogo-2026-10-06` (sale de `claude/publicar-2026-10-05`,
PR #9 aún sin unir). **Nada aplicado en Supabase todavía.**

- **Revisión del 06/10** (lote `36945ee9`, vigente hasta el 13/10): 70 fuentes
  del radar y 49 fichas consultadas de nuevo; mismo manifiesto 26/49 (24/21/4).
  Detalle y criterios en `docs/CATALOGO-V2-2026-10-06.md`. No se alargó la
  vigencia de la anterior (la base limita a 7 días y la app instalada también).
- **Para publicarla:** pegar `rwadar-app/data/importaciones/catalogo-2026-10-06-v2/aplicar-y-aprobar.sql`
  entero en Supabase › SQL Editor › Run, **después de las 02:00 de España**
  (Supabase va en UTC; antes falla a propósito y no cambia nada). Importa y
  aprueba en una transacción y se deshace si el lote no queda publicable.
  Después: `rwadar-publicar.js --preview` (sincroniza; habrá que commitear JS
  y portada y reaprobar en `estado.json` dos veces, como el 5/10), comprobar
  y `--produccion`.
- Comprobado: `node -r <reloj+3h> rwadar-app/comprobar-revision-2026-10-06.mjs`
  aplica ese mismo SQL sobre la cadena de producción en PGlite: 26/49, 9 fichas
  con cifras el 06/10, caduca el 14/10. `npm test` en verde. Sin el reloj
  adelantado se ejecuta tal cual a partir de las 02:00 del 06/10.
- **App 1.2.0, versionCode 11:** build EAS `6c3ed542-aa13-45c6-9e4d-9c4dbd144cf9`
  (perfil `editorial`, misma clave), lanzada desde el ordenador de Víctor;
  estaba en cola. Falta: descargar APK, comprobar firma/huella, probar en un
  móvil real y publicarlo como release `v1.2.0` en `RWAdar-downloads`
  (`/android` apunta a `releases/latest`). `gh` no está instalado: hacerlo
  desde el Chrome de Víctor.
- Pendiente de Víctor: «Merge» en el PR #9 y en el de esta rama.

## 5 de octubre de 2026 · Claude (5) · web publicada en producción desde el ordenador de Víctor

- **Publicado** con `rwadar-publicar.js --produccion` desde una copia limpia
  de `main` (`23f9faf`) en el ordenador de Víctor, con su sesión de
  Wrangler (cuenta `52d07be0…`). Despliegue `cbe0aa77`; antes, preview
  `a060c69e` (alias `revision.rwadar.pages.dev`). Ya no hace falta el
  secreto `CLOUDFLARE_API_TOKEN` para esta publicación, aunque sigue
  pendiente para publicar desde GitHub.
- La sincronización con Supabase cambió dos archivos, igual que el 2/10:
  `eee89fc` (catálogo en el JS: 10 fichas del 30/09 con vigencia de 1 día
  pasan a «Cifras pendientes de nueva revisión») y `e320b21` (portada
  pre-renderizada). Aprobaciones en `589be2c` y `4e06d9e`, por orden expresa
  de Víctor en el chat.
- Comprobado: `npm test` en verde; `.github/comprobar-publicado.mjs` 35/35
  sobre la preview y sobre `https://rwadar.pages.dev`; en Chromium móvil, la
  barra Inicio · Buscar · Academy · Perfil cambia de panel, Academy muestra
  «0 de 7 lecciones leídas», Perfil muestra «Cuentas en pausa»; consola sin
  errores; cabeceras (CSP, HSTS, X-Frame-Options DENY, nosniff) presentes;
  `/.git/config`, `/package.json`, `/.env` y el código fuente dan 404;
  barrido de secretos de `rwadar-publicado/` sin coincidencias.
- **Cuentas: siguen en pausa.** Para abrirlas faltan los pasos 1 a 3 de
  `docs/tareas/REABRIR-CUENTAS.md` (SMTP, ajustes de Auth y SQL 26), que
  solo puede hacer Víctor.
- **Ojo:** el lote del catálogo vence el 5/10 inclusive; a partir del 6/10
  la web lo enseña con «Revisión pendiente» hasta que haya revisión nueva.

## 5 de octubre de 2026 · Claude (4) · #6 y #7 unidos, manual corregido, anti-robots preparado

- **PR #6 unido a `main`** (`ecba31e`): comunidad apagada, app 1.2.0, flujo
  «Compilar app Android» y tu mejora de tarjetas. CI verde (pruebas + gitleaks).
  `main` es idéntico a lo aprobado en `estado.json` (`70b2346`).
- **Publicar sigue bloqueado por la clave**: lancé «Publicar web» (preview)
  desde `main` y se paró en «Comprobar que existe la credencial de
  Cloudflare» (run 37311901615). No se tocó nada en línea. La aprobación
  caduca el 7/10.
- **Manual de Eric corregido** (sin tocar el original):
  `docs/manual/corregir-manual.py` → `RWAdar_Como_Usar_RWAdar_2026_corregido.pdf`.
  Página 9: lista de vigilancia hoy, guías y avisos «próximamente», Academy
  con 7 lecciones. Página 7: el checklist «llegará próximamente». Las demás
  páginas salen idénticas píxel a píxel. Falta el visto bueno de Eric; se
  enciende con las cuentas (`docs/manual/LEEME.md`).
- **Anti-robots (Turnstile), apagado**: `TURNSTILE_SITEKEY=''` en el módulo
  `Cuenta`. Encendido, alta, entrada con contraseña, recuperación y reenvío
  piden un testigo nuevo cada vez y lo mandan como
  `gotrue_meta_security.captcha_token` (formato comprobado en
  `@supabase/auth-js`). El script de Cloudflare solo se carga al pedir algo
  a Auth. Caja `#cuentaRobot` en la ventana de cuenta. Para encenderlo hay
  que tocar CSP, pruebas y privacidad: pasos en
  `docs/tareas/REABRIR-CUENTAS.md`, «Anti-robots». Ensayo, sección 11, con
  Turnstile y Supabase de mentira: alta, reenvío y entrada con testigos
  distintos, bloqueador que impide cargarlo, y Supabase que lo exige sin
  que la web lo lleve.
- **Fallo real arreglado** gracias al ensayo, que fallaba 1 de cada 3
  vueltas. Al abrir la ventana de cuenta, un temporizador de 60 ms movía el
  cursor a «Correo» aunque ya se estuviera escribiendo en «Contraseña», y la
  clave acababa en el campo del correo (`correo=[ana@ejemplo.testuna clave…]`).
  Ahora no mueve el cursor si ya hay un campo de la ventana activo. El ensayo
  también espera ya a que la lista de la comunidad se refresque.
- **Segundo fallo, del propio anti-robots, arreglado antes de salir**: si se
  cerraba la ventana mientras cargaba Turnstile, la entrada cancelada se
  enviaba igual en segundo plano. `antiRobots`/`conAntiRobots` comprueban
  ahora `operacionCuenta` tras cargar y tras el testigo.
- Pruebas: web 501, `rwadar-app` completo, móvil 126, QR, tools; ensayo en
  el navegador 61/61, repetido varias veces seguidas.

## 5 de octubre de 2026 · Claude (3) · comunidad preparada y app lista para compilar

- **Comunidad** (apagada, `PUBLICACIONES_REMOTAS=false`): `rwadar-app/db/27_comunidad.sql`
  + `27_comunidad_cerrar.sql`. Una publicación por cuenta y día de España
  (`unique (usuario_id, dia)`), 10–500 caracteres, sin enlaces (CHECK), autor
  «Miembro de RWAdar» salvo que elija su nombre, lectura pública solo de
  `id, autor, texto, creada_el`, escritura solo por RPC (`publicar`,
  `mis_publicaciones`, `borrar_mi_publicacion`, `denunciar_publicacion`,
  `moderar_publicacion`, `cola_publicaciones`), tres denuncias la ocultan.
  Prueba `probar-comunidad.mjs` 30/30 (en `npm test`). Web: módulo
  `Comunidad` (`comunidad:inicio/fin`) en Inicio, escucha el evento
  `rwadar:sesion` que lanza `Cuenta.pinta()`. Ensayo en el navegador 48/48.
  Moderación por SQL documentada en `docs/tareas/REABRIR-CUENTAS.md`.
- **App 1.2.0** y flujo manual `.github/workflows/compilar-app.yml` (pruebas →
  EAS → artefacto con SHA-256). Necesita el secreto `EXPO_TOKEN`
  (`rwadar-movil/LEEME.md`, «Compilar desde GitHub»).
- Pruebas: web 407, `rwadar-app` completo, móvil 104, tools y QR.
- **Tu mejora de tarjetas (`mejora-tarjetas-local`) está integrada** en esta
  rama: tarjeta nueva + botón «☆ Guardar», pruebas adaptadas (web 499, móvil
  126). `lib/config-ios-uuid-seguro.js` se conserva con sus pruebas pero se
  quitó de `app.json`: choca con `scripts/parchear-expo-uuidv5.cjs` (mismo
  archivo, huella distinta) y rompería la build de iOS. Hay que elegir uno.

## 5 de octubre de 2026 · Claude (2) · nueva barra: Inicio · Buscar · Academy · Perfil

**Rama:** `claude/zealous-shannon-endwcn` (reiniciada desde `main` tras unir
#4). Petición de Víctor: reorganizar la barra del móvil y dejar los avisos
como «próximamente». No toca producción, Supabase ni EAS.

### Web (móvil; el escritorio no cambia)

- Pestañas `inicio` · `buscar` · `academy` · `cuenta` (rótulo «Perfil»). Con
  JavaScript el móvil abre en Inicio salvo que la URL traiga ancla; sin él se
  ve Buscar (`movilPanelRadar` no lleva `hidden`, como el escritorio).
- **Inicio** (`movilPanelInicio`): presentación, atajos, noticias generadas
  (marcas `<!--noticias:ini-->`), Comunidad «próximamente» (una publicación al
  día por cuenta cuando haya cuentas) y Método/Fuera/3D.
- **Academy** (`movilPanelAcademy`): en el móvil se **mueve** el bloque real
  `.academia-lecciones` de la portada (con ancla para devolverlo en
  escritorio) y se cuenta lo leído con la clave `rwadar.academy.v1`.
- **Perfil** (`movilPanelMas`): tarjeta de cuenta (en pausa), empresas y
  ofertas guardadas, Avisos «llegarán próximamente a la app» con la vía para
  retirar un consentimiento anterior, privacidad, sonido, borrar guardados,
  CSV y contacto. Desaparecen Favoritos, Inversiones y la subvista de Avisos
  (su JS queda inerte: sin esos nodos no hace nada).
- **Favoritos locales**: módulo `Favoritos` (`favoritos-locales:inicio/fin`,
  al principio del JS porque las tarjetas se pintan antes), clave
  `rwadar.favoritos.v1` (nombres de empresa y slugs de oferta). Botón
  «Guardar en favoritos» en la ficha (cuando no hay cuentas) y «☆ Guardar» en
  las tarjetas de oferta; solo visibles en el móvil (`.fav-local`).
- Privacidad actualizada (5/10/2026) y `sitemap.xml`.

### Noticias

Fuente única `rwadar-noticias/noticias.json` → `rwadar-noticias.js` escribe
el bloque de Inicio de la web y `rwadar-movil/lib/noticias-contenido.js`.
`--comprobar` en `test:tools`; `rwadar-publicar.js` bloquea si no está al día;
añadido a `RUTAS_CONTENIDO_APROBADO`. **Ojo:** la noticia «RWAdar Academy ya
está abierta» lleva fecha 5/10; si se publica otro día, cambia la fecha.

### App (necesita versión nueva para llegar a los móviles)

- `Navegacion.js`: Inicio · Buscar · Academy · Perfil (iconos nuevos; insignia
  de guardados en Perfil).
- `componentes/Inicio.js` nuevo. Buscar = selector «Empresas | Ofertas» sobre
  las dos listas de siempre. Academy pasa de modal a pestaña (`onCerrar`
  opcional). `PantallaPerfil` sustituye a «Más», «Siguiendo» y «Avisos»: en
  modo editorial enseña «Avisos · próximamente»; con la capacidad remota
  vuelve a usar `PanelAvisos`.
- Ofertas guardadas en el dispositivo (`ofertasGuardadas`,
  `alternarOfertaGuardada`, clave `…ofertas.guardadas.v1`, borrada con el
  resto) y estrella en `DetalleOferta`.

### Pruebas

Web 406, `rwadar-app` completo, móvil 104, tools, QR y ensayo de cuentas 37.
Capturas reales en Chromium (web móvil y app exportada con react-native-web).

## 5 de octubre de 2026 · Claude · cuentas (fase 1) preparadas, manual, seguridad

**Rama:** `claude/zealous-shannon-endwcn`. **No toca producción:** nada
publicado, nada aplicado en Supabase, sin EAS. Todo lo nuevo queda apagado.

### Qué hay

| Pieza | Dónde |
|---|---|
| Migración de reapertura, fase 1: perfil, vigilancia, baja y fecha de descarga del manual. Opiniones, moderación, dispositivos y push siguen cerrados | `rwadar-app/db/26_reabrir_cuentas.sql` + `_verificar.sql`; marcha atrás = reaplicar 25 |
| Prueba sobre la cadena de producción (01-22, 24, 25, catálogo) | `rwadar-app/probar-reabrir-cuentas.mjs` (36/36), dentro de `npm test` |
| Ensayo E2E en Chromium: la web real con cuentas encendidas en memoria contra un Supabase simulado sobre PGlite + 26 | `rwadar-app/ensayo-cuentas-web.mjs` (37/37; necesita Playwright, no está en `npm test`) |
| Web: interruptores separados `OPINIONES_REMOTAS`, `AVISOS_CORREO_REMOTOS`, `MANUAL_BIENVENIDA` (todos apagados, igual que `SERVICIOS_USUARIO_REMOTOS` y `CORREO_AUTH_E2E`) | `rwadar-site/assets/rwadar-20260820.js` |
| Dos fallos corregidos que solo salían con cuentas abiertas: botón de cuenta del móvil siempre desactivado; botón «Entrar» bloqueado tras «Confirma tu correo» | mismo archivo; pruebas fijas en `probar-web.mjs` |
| Textos de cuenta sin promesas de opiniones mientras estén cerradas (etiqueta del nombre, aviso legal del alta, subtítulo) | `rwadar-site/index.html` |
| Manual de bienvenida de Eric (PDF original, revisión y cómo encenderlo). **Sección 8 promete avisos y guías por correo que no existen; la 6 remite a un checklist que no tenemos** | `docs/manual/` |
| Pasos de Víctor para abrir cuentas (SMTP, Auth, SQL, prueba real) | `docs/tareas/REABRIR-CUENTAS.md` |
| Revisión de seguridad | `docs/seguridad/REVISION-SEGURIDAD-2026-10-05.md` |
| Pasos exactos para crear la clave de Cloudflare | `docs/OPERACION-LANZAMIENTO.md`, «Publicar desde GitHub» |

Academy «ENTREGA_WEB_1_2»: las 9 lecciones son idénticas byte a byte a la
entrega del 2/10 (commit `5cecbb8`); no hay nada nuevo que montar.

### Pruebas

`npm test` por partes en verde: web 405, `rwadar-app` completo (incluida la
nueva), móvil 101, tools y QR. Gitleaks sobre 74 commits: 10 avisos, todos
falsos (detalle en la revisión de seguridad).

### Pendiente (de Víctor)

1. Secreto `CLOUDFLARE_API_TOKEN` en GitHub → Claude publica (la aprobación
   caduca el 7/10).
2. Pasos 1 a 3 de `REABRIR-CUENTAS.md` → Claude enciende cuentas en
   `revision`, Víctor prueba, se reescribe la privacidad y se publica.
3. Eric: corregir la sección 8 del manual y enviar el Checklist de
   Elegibilidad.

---

## 2 de octubre de 2026 · Claude · RWAdar Academy en la web y en la app

**Rama:** `claude/zealous-shannon-endwcn`, commit «feat(academy): …». No toca
producción: ni web publicada, ni Supabase, ni EAS.

Víctor pasó la entrega de Eric (`RWAdar_Academy_ENTREGA_WEB`): 9 lecciones en
Markdown y una especificación. Está montada en la web y en la app.

### Qué hay

| Pieza | Dónde |
|---|---|
| Fuente única: las 9 lecciones tal cual, `academy.json` (qué se publica, niveles, destinos de los botones) y el aviso legal común | `rwadar-academy/` (léete su `LEEME.md`) |
| Generador: valida las lecciones y escribe web + app; `--comprobar` no escribe | `rwadar-academy.js` |
| Web: índice `/academy/` y una página por lección publicada (TL;DR, índice lateral, recuadros, test con explicación, siguiente paso, aviso legal, progreso en `localStorage`) | `rwadar-site/academy/`, `assets/academy-20261002.{css,js}` |
| Portada: bloque de lecciones (entre `<!--academy:ini-->` y `<!--academy:fin-->`), enlace «Academy» en cabecera y pie, ancla `#comparador` | `rwadar-site/index.html` |
| App: pantalla nativa (Más › RWAdar Academy y aviso en el radar), test, progreso en el dispositivo | `rwadar-movil/componentes/Academy.js`, `lib/academy-contenido.js` (generado), `lib/academy-progreso.js` |
| Revisión del contenido y decisiones | `docs/academy/REVISION-CONTENIDO-2026-10-02.md` |

**Publicadas:** lecciones 1–6. **Próximamente:** 7 (sus «cuatro criterios» no
coinciden con el Método), 8 y 9 (calendario de Eric). Evaluador de Viabilidad
y checklist del expediente: «Próximamente», nunca enlace roto.

### Cambios en piezas existentes

- `rwadar-publicacion-segura.js`: `PAGINAS_ACADEMY` (lista cerrada) dentro de
  `ARCHIVOS_PUBLICABLES`, más los dos assets; `rwadar-academy` y
  `rwadar-academy.js` añadidos a `RUTAS_CONTENIDO_APROBADO`.
- `rwadar-publicar.js`: `PAGINAS_HTML` común (CSP estricta y assets con
  huella también en la Academy) y bloqueo si la Academy no está al día o no
  coincide con `PAGINAS_ACADEMY`.
- `rwadar-servir.js`: URL limpias `/academy/…` como en Cloudflare.
- `_headers` (`/academy/*` sin caché), analítica (mide `/academy/…` limpias),
  `sitemap.xml` (solo lo publicado).
- **`privacidad.html`**: dice que el progreso de la Academy se guarda en el
  navegador o en el dispositivo y no se envía. Fecha de revisión → 2/10/2026.
  En la app, «Borrar datos del dispositivo» también borra el progreso.
- Pruebas antiguas ajustadas: la «videoteca» ya no existe, y dos pruebas de
  `rwadar-app` contaban apariciones de nombres de página en el publicador.

### Pruebas

- `npm test` completo en verde: web 394 (48 nuevas de la Academy), app 101
  (8 nuevas, una pinta las 6 lecciones con react-native-web) y todas las de
  `rwadar-app`.
- Chromium real, web en escritorio y móvil: sin desbordamiento horizontal,
  test corrige y abre las explicaciones, «Marcar como leída» sobrevive a
  recargar y se ve en el índice, sin errores de consola.
- App exportada a web (copia aislada con datos locales, sin Supabase):
  índice, lección, test, tabla con desplazamiento, aviso reforzado, botón al
  radar y progreso tras recargar.

### Cierre del 2 de octubre (petición de Víctor)

- **Lección 7 publicada** (7 de 9). `PAGINAS_ACADEMY` ya la incluye.
- **Revisión legal:** Víctor la ha verificado; las nueve lecciones dicen
  2 de octubre de 2026.
- **Lectura:** letra mayor, más interlineado y gris más claro en web y app;
  cursiva real de Geist en la app.
- **Tipografía de toda la web arreglada:** la Geist incrustada en
  `rwadar-20260820.css` era solo el recorte «latin-ext» (sin a-z), así que la
  web se veía con la letra del sistema. Ahora es el paquete oficial `geist`
  1.7.2 recortado a latín (22 kB sans, 16 kB mono; la Academy lleva además
  la cursiva). Comprobado en Chromium: el 100 % del texto sale en Geist.
- **Aprobación registrada** en `estado.json` (commit propio) y **unido a
  `main`** con merge commit (PR #1); la auditoría sobre `main` da «LISTO PARA
  CORTE FINAL». Desde la nube de Claude no hay red ni credenciales de
  Cloudflare: la subida la hace Víctor o Codex en local (`git pull`,
  `--preview`, comprobar y `--produccion`).

### Pendiente

1. ~~Decidir con Eric los criterios y las funciones prometidas.~~ **Hecho**
   por petición de Víctor (tercer commit): las lecciones usan los cuatro
   criterios del Método y anuncian como «próximamente» el Evaluador, los
   filtros por categoría y por supervisión y la checklist. Detalle en
   `docs/academy/REVISION-CONTENIDO-2026-10-02.md`. La lección 7 ya se
   podría publicar (solo espera al calendario).
2. **Para publicar la web (con permiso de Víctor):** registrar la aprobación
   en `estado.json` (la auditoría dirá que el contenido cambió), `--preview`,
   comprobar `/academy/`, `--produccion`.
3. **App:** entra en la próxima compilación; subir versión al compilar.
4. ~~Cabecera compacta de la PWA móvil que solapaba «RWAdar» con el título.~~
   **Arreglado** en un segundo commit: los laterales de la rejilla ya no
   pueden medir menos que la marca y los botones, el título es lo único que
   cede (con «…»), la marca se aprieta un poco por debajo de 350 px y el
   título de la subvista pasa a «Academy». Medido en 320, 360, 390 y 430 px
   en Buscar, Academy, Método, Fuera, Favoritos, Inversiones y Mi cuenta:
   ningún solape. En la app nativa, «PRÓXIMAMENTE» ya no se parte en dos
   líneas a 320 px y las tarjetas anterior/siguiente dicen «← LECCIÓN 1».

---

## 1 de octubre de 2026 · Claude (2) · catálogo siempre disponible

Víctor se quedó sin créditos de Codex y pidió a Claude que siguiera. Regla
nueva de Víctor: **el catálogo tiene que estar siempre disponible para el
público, salvo que él diga lo contrario.** He hecho la tarea
[`CODEX-catalogo-no-desaparece.md`](CODEX-catalogo-no-desaparece.md) con esa
regla ampliada.

### Qué hace ahora

| Situación | Antes | Ahora |
|---|---|---|
| La revisión vence (7 días) | Web y app vacías | Se ve la última copia completa con el aviso «Revisión pendiente» |
| Cifras de una oferta vencidas | Ocultas | Ocultas (sin cambios) |
| Supabase responde vacío o incompleto | Web y app vacías | Se conserva la última copia completa con el aviso «No hemos podido comprobar…» |
| Revisión incompleta, futura o mezclada | No se publica | No se publica (sin cambios); nunca se vuelve a una anterior |
| Víctor quiere quitar el catálogo | No había forma clara | `public.catalogo_publicacion.retirado = true` (ver `RUNBOOK.md`) |

### Qué he cambiado

- **Base:** `rwadar-app/supabase/migrations/20261001150000_catalogo_siempre_disponible.sql`.
  - Políticas nuevas `*_de_revision_publicada_v2`: se puede leer la revisión
    del puntero `publicacion_v2` aunque haya vencido.
  - `revision_publicable_v2`: igual que antes, salvo que ya no exige
    vigencia.
  - Tabla `public.catalogo_publicacion`: es la orden expresa. Un disparador la
    activa al retirar la revisión publicada y la desactiva al aprobar otra.
  - **Las vistas públicas no cambian de columnas:** la web y el APK de hoy
    rechazan un lote caducado igual que antes.
- **Contrato compartido:** `validarLotePublicoV2(..., { permitirCaducado })`
  en `rwadar-movil/lib/contrato-catalogo.js`. Por defecto se comporta como
  antes; con la opción devuelve `caducado`.
- **Web** (`rwadar-site/assets/rwadar-20260820.js`, `index.html`, `.css`):
  - La caducidad ya no vacía nada. `alDia` consulta además
    `/catalogo_publicacion` y solo `retirado === true` oculta el catálogo.
  - Una vista vacía, incompleta o un lote fuera de contrato conservan la copia
    embebida o la descargada antes, con aviso.
  - Avisos nuevos: `#avisoCatalogoRadar` y `#avisoCatalogoOfertas`. El pie y
    el contador dicen «pendiente de renovar».
- **App** (`lib/catalogo-remoto.js`, `App.js`):
  - Al vencer se recarga en lugar de borrar.
  - Ya caducado, se refresca una vez al día (`programarRevisionDiaria`) para
    ocultar las cifras que vayan venciendo.
  - Solo la orden expresa borra la caché.
- **Publicación:** `sincronizar.js` admite un lote V2 caducado y avisa por
  pantalla. Así se puede publicar aunque la revisión haya vencido.

### Pruebas

- Nueva: `rwadar-app/probar-catalogo-siempre-disponible.mjs` → 29/29 contra
  PGlite. Cubre vigente, caducada, nueva revisión, incompleta, futura,
  retirada, reaprobación, orden manual y permisos.
- Web: 346/346. Las pruebas de caducidad ahora exigen que todo siga visible
  con aviso. Hay pruebas nuevas de la orden expresa y de una base antigua sin
  la tabla. Las 4 consultas anónimas están vigiladas.
- App: 93/93. Las pruebas de «retira la caché» ahora exigen que la conserve,
  y hay pruebas nuevas de la orden expresa, de una base antigua y de la
  revisión diaria.
- `npm test` completo en verde.
- Navegador real (Chromium) con la fecha fijada en el 10/10/2026 y Supabase
  caído: 26 plataformas, 49 referencias y el aviso visible, en escritorio y
  en móvil.

### Para ponerlo en producción (Víctor o Codex, con permiso de Víctor)

1. **Primero la migración** en el editor SQL de Supabase. Después del 5/10 es
   imprescindible: sin ella, Supabase devuelve las vistas vacías y la
   sincronización no puede publicar.
2. Registrar la aprobación (commit y huellas en `estado.json`, paso 2 de
   `docs/OPERACION-LANZAMIENTO.md`). La compuerta lo pide porque cambia
   `rwadar-site`, `sincronizar.js` y `contrato-catalogo.js`.
3. `--preview`, comprobar, y `--produccion`.
4. App: entra en la próxima compilación (no hay OTA).

---

## 1 de octubre de 2026 · Claude

**Rama:** `claude/magical-hamilton-aiddjs`, creada encima de
`codex/relanzamiento-publico` (último commit de Codex: `59ecbe3`). No toca nada
de producción: ni web publicada, ni Supabase, ni EAS.

### Qué he hecho

| Commit | Qué cambia | Qué tienes que saber |
|---|---|---|
| `fix(movil): parchea … uuidv5 en iOS` | `rwadar-movil/scripts/parchear-expo-uuidv5.cjs` + `postinstall` en `rwadar-movil/package.json` + `.easignore` + paso en `ci.yml` | Corrige el fallo de expo-modules-core (copiaba 20 bytes en un UUID de 16; sigue sin corregir en Expo 58.0.10). Se aplica solo en cada `npm install` o `npm ci`, también en EAS. **Si actualizas Expo** y el script se para, lee su mensaje: o el archivo cambió y hay que revisar, o Expo ya lo arregló y se puede borrar el script. Instalar con `--ignore-scripts` no aplica el parche: ejecuta luego `npm --prefix rwadar-movil run postinstall`. |
| `feat(datos): copia de seguridad cifrada diaria` | `.github/workflows/copia-seguridad.yml`, `rwadar-app/copia-seguridad.sh`, `docs/COPIAS-DE-SEGURIDAD.md` | `pg_dump` de `auth`, `public` y `rwadar_catalogo`, cifrado con gpg y comprobado. Necesita los secretos `SUPABASE_DB_URL` y `COPIA_CLAVE` y estar en `main`. **Antes de actualizar Postgres, una copia comprobada.** |
| `docs: pruebas de ataque … y tarea del catálogo` | `docs/seguridad/PRUEBAS-DE-ATAQUE-2026-10-01.md`, `docs/tareas/CODEX-catalogo-no-desaparece.md` | Todos los ataques probados en local están bloqueados. La tarea del catálogo es **tuya** (ver abajo). |
| `docs: documentación en lenguaje llano …` | `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/INTERNO.md`, `docs/RUNBOOK.md`, `docs/LEEME.md` nuevo | Ya no dicen que RWAdar está apagado. Las versiones anteriores están en `docs/archive/2026-09/`. Los informes con fecha **no se han movido**: los cita `rwadar-app/data/relanzamiento/estado.json`. En `CATALOGO-V2-2026-09-30.md` cambié «API35, run…» por «API 35, ejecución…» porque gitleaks lo confundía con una clave. |

### Autoría de commits (importante)

Desde ahora **firma como Codex**: lo tienes en `AGENTS.md` → «Autoría de los
commits». Los commits del 28 al 30 de septiembre salieron como «Claude» porque
la carpeta local tenía ese nombre configurado desde agosto. No cambies el
`git config` de la carpeta: usa `git -c user.name=… -c user.email=…` en cada
commit.

### Pruebas que he pasado

- Web: `npm run test:web` → 341/341.
- Base de datos: las 26 baterías de `npm --prefix rwadar-app test`, todas en
  verde.
- App: `npm --prefix rwadar-movil test` → 89/89 (5 nuevas del parche).
- Compuerta: `npm --prefix rwadar-app run auditar:relanzamiento` → «LISTO PARA
  CORTE FINAL» (los cambios de hoy no tocan rutas aprobadas).
- gitleaks 8.30.1 con `rwadar-app/gitleaks.toml` → 0 hallazgos en archivos
  versionados.

### Pendiente para Codex

1. **[`CODEX-catalogo-no-desaparece.md`](CODEX-catalogo-no-desaparece.md)**:
   que el catálogo caducado se siga viendo con aviso y sin cifras vencidas.
   Urgente: el lote vence al terminar el 5 de octubre.
2. Al siguiente build de iOS: comprobar en el simulador que la app abre y
   funciona con el parche de Expo.

### Pendiente para Víctor

1. Renovar el catálogo antes del 5 de octubre (o que Codex termine la tarea 1
   y la publique antes).
2. Crear los dos secretos de la copia en GitHub y lanzar la primera copia
   (`docs/COPIAS-DE-SEGURIDAD.md`, parte 1).
3. ~~Unir esta rama a `main`.~~ Hecho el 1 de octubre: `main` incluye todo.
4. En la carpeta local, una vez: `git config user.name "Victor Jorques"` y tu
   correo de GitHub.
5. Si quieres que Claude revise la web real: permitir en la red del entorno
   `rwadar.pages.dev` y `exgpmjpaaebyoolpwced.supabase.co`.

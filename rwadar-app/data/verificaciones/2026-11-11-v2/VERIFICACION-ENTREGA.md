# Verificación final de la entrega del catálogo «2026-11-11»

Hecha el 11/11/2026 (15:36–15:55 UTC) por Claude, como verificador final:
auditor independiente que no montó ni corrigió esta entrega. **Nada aplicado en
Supabase ni en ningún servicio remoto, nada publicado, ningún flujo lanzado, sin
commit ni push.** Las pruebas las hice con la salida a Internet cortada.

## Resultado

**Conforme.** El SQL que hay que aplicar es, byte a byte, el mismo que
revisaron los tres revisores: `aplicar-y-aprobar.sql`, SHA-256
`dfeba19516b2b688ddf4f8ad4ba1feb5049dbaae164b2d1abcee951ccb26a3cb`, revisión
`24b5f7de-2834-3e15-6ae4-62a6d9565161`, huella `24b5f7de…ceec22`. Las dos
correcciones obligatorias (C1 de contenido y O1 de cumplimiento) están hechas
tal cual y no colaron nada más. Las pruebas salen en verde y el escáner de
secretos no encuentra nada.

Antes de aplicar, el coordinador tiene que confirmar las tres desviaciones de
DECISIONES que ya declaró el montador y aceptaron los revisores (observación 1).

## Cómo lo comprobé

- Todo lo que ejecuta código lo hice en una copia aparte mía:
  `/tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/entrega-1111/verificador/copia`.
  Es un `git clone` del repositorio en `41617ec`, con las carpetas de los ciclos
  del 10/11 y del 11/11 y la del SQL copiadas encima (también lo que Git ignora)
  y `node_modules` enlazados. Las 1.174 + 2.113 + 3 copias tienen el mismo
  SHA-256 que los originales.
  - En la copia, seis CSV salen como modificados solo por el fin de línea: en
    disco tienen CRLF y Git los guarda con LF. `git diff` no da ninguna
    diferencia.
- En la carpeta de trabajo solo he escrito este archivo. Las dos carpetas de la
  entrega (1.177 archivos) tienen al terminar los mismos SHA-256 que al
  empezar, más este. `transparencia.json` sigue en `67e89ba3…2ea8`: no hay nada
  aplicado.
- Justo antes de empezar entró el commit `41617ec` (15:35:49 UTC), que solo
  guarda `INFORME-ENTREGA.md`. Lo verificado es exactamente lo que hay en ese
  commit: el árbol de trabajo estaba limpio y la rama local coincide con la
  remota.

## 1. El SQL antes y después de las correcciones

- Comparé la copia de antes de corregir
  (`…/scratchpad/entrega-1111/sql-antes-correcciones-2026-11-11/`, archivos de
  las 10:28:46 UTC) con `rwadar-app/data/importaciones/catalogo-2026-11-11-v2/`.
  `aplicar-y-aprobar.sql`, `catalogo.sql` y `revision.json` son **idénticos
  byte a byte** (`cmp`). También son los mismos en los nueve commits que van
  del informe del montador (`61a4390`) a `41617ec`.
- Hice además un diff normalizado, con los uuid, las huellas de 64 caracteres y
  las fechas-hora cambiados por marcadores: **0 líneas de diferencia**.
- El inventario no cambia. Lo saqué con un troceador propio, que respeta las
  cadenas y los bloques `$…$`:
  - **288 sentencias** en una sola transacción: `begin isolation level
    serializable`, la guarda (`do $guarda$`), 284 `insert`, la aprobación
    (`do $aprobar$`) y `commit`;
  - los inserts son 1 en `revisiones`, 25 en `plataformas`, 69 en `fuentes`,
    107 en `plataforma_fuentes`, 25 en `alertas`, 35 en `alerta_fuentes` y 22
    en `ofertas`. Todos van a `rwadar_catalogo` y todos llevan
    `on conflict … do nothing`;
  - antes y después, la misma secuencia de sentencias, y el mismo inventario
    que el lote publicado del 10/11.
- Nada escribe en `public.*`:
  - 192 inserts solo leen el id de `public.plataformas`
    (`select … from public.plataformas where slug=…`);
  - la guarda bloquea la fila de `public.catalogo_publicacion` para leer
    `retirado` (`select … for update`).
  - No hay DDL, `delete` ni permisos. El único `update` es el de la aprobación,
    sobre `rwadar_catalogo.revisiones`.
- La guarda exige cuatro cosas:
  - que lo publicado sea la `dfdc4c85-7f2f-fc4a-de27-a9f4a63f7656`, con su
    huella `dfdc4c85…015f` y aprobada (o ya la nueva);
  - que el catálogo no esté retirado;
  - que la fecha esté entre el 11/11 y el **18/11/2026**;
  - que la revisión nueva no exista con otra huella.
- Es lo esperado. Las dos correcciones dicen «no cambia el SQL» y no hay
  ninguna otra diferencia.

## 2. `preparar-entrega.mjs` (dos veces) y `comprobar-entrega.mjs`

En la copia borré primero las 8 salidas, para que el script las escribiera
desde cero. Lo ejecuté dos veces seguidas a las 15:40 UTC. Las dos salieron con
exit 0, con la misma salida por pantalla y con las mismas 8 huellas. Coinciden
con las de la carpeta de trabajo y con las que da el montador:

| Salida | SHA-256 |
| --- | --- |
| `radar-canonico-26.json` | `0b8a0d3e…57b0` |
| `escaparate-publicacion.json` | `367d0f8a…27c8` |
| `documentacion-ofertas.json` | `aa1cc5b2…3df6` |
| `manifiesto-catalogo.json` | `c2c51919…4224` |
| `contraste-2026-11-11.json` | `a55ff884…9845` |
| `catalogo.sql` | `d8d7f12d…7add` |
| `aplicar-y-aprobar.sql` | `dfeba195…a3cb` |
| `revision.json` | `03df9312…9d70` |

Lo que escribe el script: revisión `24b5f7de-…` sobre la `dfdc4c85-…`, 25
plataformas, 69 fuentes del radar, 22 ofertas (8 principales, 13 de reventa y
1 en camino), 63 cambios y 3 puntos no aplicados.

- El contraste guarda el SHA-256 de `DECISIONES-COORDINADOR.md`
  (`0f89547b…3224`), que es el del archivo de hoy.
- El script no mira la hora. El SQL es el que se montó entre las 10:05 y las
  10:35 UTC, antes de las 19:30, así que se cumple la condición de hora de
  Spiko Smart Cash (P1).

`comprobar-entrega.mjs --exportar=…` usa PGlite sin red, con la cadena de
producción: el seed de antes de ARTEX y 15 lotes hasta la 2026-11-10. Terminó
con **exit 0 en 23 s y «resultado: correcto»: 19 comprobaciones y 6 casos de
fallo, todos «OK»**, con el SHA `dfeba195…a3cb`. El `pruebas-locales.json` que
escribe es igual que el del repositorio, salvo la hora y la carpeta de
exportación.

## 3. Las correcciones obligatorias, una a una

| Corrección | Qué encontré | Estado |
| --- | --- | --- |
| **SQL e integridad** | No pidió ninguna obligatoria. | — |
| **C1** (contenido): mínimo corto de Switzerlend con la fecha de su ficha | El bloque de 6 líneas del revisor está literal en `despues-de-aplicar.mjs`, justo después del bucle de Brickwise. La línea de «Nada más cambia» es la que pide (`slug in BRICKWISE \|\| slug === 'switzerlend'`). Lo comprobé por programa contra el texto del informe del revisor. En el ensayo da el SHA-256 que obtuvo el revisor. | Hecha tal cual |
| **O1** (cumplimiento): nombres de personas físicas en 5 archivos | Saqué el script del §6 del informe del revisor. Es idéntico al que usó el corrector (SHA-256 `1a9f895c…`). Lo ejecuté sobre los 5 archivos tal como estaban en `b0d69aa`, antes de corregir: imprime 5, 9, 1, 1 y 15 líneas, y el resultado es **byte a byte** el de `338c209`, el de HEAD y el del disco. Son 31 líneas en esos 5 archivos y ninguna más. En cada línea solo cambia un nombre por «[persona física recortada]» o «[artista omitido]». | Hecha tal cual |

Revisé también qué más cambió desde el último informe de revisor (`b0d69aa`)
hasta HEAD, para ver si las correcciones colaron algo. En todo el repositorio
cambian 13 archivos, todos de la carpeta del ciclo:

- **`despues-de-aplicar.mjs`**: la C1. Además, dos líneas del comentario de
  cabecera, otro comentario y el mensaje de lo que cambia, que ahora nombran a
  Switzerlend, y una línea más en la salida («Mínimo corto de Switzerlend: …»).
  No cambian datos ni comprobaciones (observación 2).
- **Los 5 archivos de O1** (`338c209`).
- **4 copias más del menú de arttrade** (`8850b12`, 49 líneas):
  - `arttrade-basis-informationsblaetter.txt`, `arttrade-risikoinformationen.txt`
    y `arttrade-verbraucherinformationen.txt`: las líneas 42–76, que son las
    mismas 15 que tenía `arttrade-anleihebedingungen.txt`, antes y después del
    recorte;
  - `arttrade-art-investment.txt`: las líneas 83, 85, 87 y 89.
  - En cada línea solo cambia el nombre de un artista por «[artista omitido]»
    (observación 3).
- **`ensayo-despues.json` y `pruebas-locales.json`**: recogen la pasada de las
  15:23.
- **`INFORME-ENTREGA.md`**: solo documentación (§9 y retoques).

Lo que no cambia desde el informe del montador (`61a4390`): `expedientes/`,
`revision-independiente/`, `DECISIONES-COORDINADOR.md`,
`noticias/noticias-2026-11-11.json`, `docs/tareas/PARA-CODEX.md`,
`rwadar-site/`, `rwadar-movil/` y `rwadar-editorial-source/`. Cada
`REVISION-ENTREGA-*.md` lo toca un solo commit: el suyo.

### Ensayo de «después de aplicar» (solo en la copia y sin red)

Lo hice con los proxies apuntando a un puerto local cerrado, para que nada
pudiera salir a la red.

1. **`despues-de-aplicar.mjs` antes de sincronizar**: se niega con exit 1 («el
   catálogo sincronizado no es la revisión 24b5f7de-…»). No toca
   `transparencia.json`, que sigue en `67e89ba3…2ea8`.
2. **`sincronizar.js` con el REST simulado** (lo que exportó PGlite): exit 0.
   «25 plataformas verificadas, 5 descartadas y 22 ofertas clasificadas.
   rwadar.csv regenerado: 30 filas.» El CSV no cambia.
3. **`despues-de-aplicar.mjs`**: exit 0. Dice:
   - «… mínimos cortos de las 11 de Brickwise y de Switzerlend»;
   - «Comprobaciones de transparencia al 11/11: 43 de 44»: solo se queda en el
     10/11 la «supervisada» de mTBILL;
   - «11 de 11» títulos;
   - «Mínimo corto de Switzerlend: «1 acción (68,01 CHF, 11/11)»».

   `transparencia.json` queda en
   **`81e78ab905e5fc20ad42d6907325efd7cc37784277d9833926822fe40f5d3808`**, el
   mismo SHA-256 que obtuvieron el revisor y el corrector. Al repetirlo: «Nada
   que cambiar: ya estaba hecho.», con el mismo SHA-256.
4. **`transparencia.json`, campo a campo.** Frente al del repositorio cambian
   91 valores, todos de los previstos:
   - el lote, la revisión y la fecha de revisión;
   - las 22 «verificadaEl»;
   - 43 fechas de consulta;
   - 11 títulos de puntos fuertes;
   - los 11 mínimos cortos de Brickwise y el de Switzerlend.

   Frente al que salía antes de la C1 (`1959f8be…c66b`) solo cambia
   `switzerlend.minimoCorto`: «1 acción (68,01 CHF, 10/11)» → «1 acción (68,01
   CHF, 11/11)».
5. **Los demás pasos**:
   - `volcar-seed.js` con el REST simulado: «25 en el radar, 5 descartadas, 13
     fuentes», sin diferencias en `02_seed.sql`;
   - `transparencia.mjs`: «22 ofertas con transparencia»;
   - `rwadar-fichas.js`: «Archivos actualizados: 55».
   - La web (`rwadar-20260820.js`) y la app (`transparencia-contenido.js`) solo
     llevan «1 acción (68,01 CHF, 11/11)».
6. **Lo que verá el usuario en la app.** Lo calculé con su código
   (`datosCortosOferta` y `datosTarjetaOferta`), el 11/11 y también el 18/11:
   - Switzerlend: la tarjeta dice «Mínimo 1 acción (68,01 CHF, 11/11) · España
     Sí». «Lo esencial» dice «Mínimo: 1 acción (68,01 CHF, 11/11) · España: Sí,
     según la fuente · Salida: Venta a otros accionistas».
   - Schwarzer Weg: «Mínimo Desde 69,90 € la participación (11/11) · España Sin
     confirmar».
   - mTBILL sigue tapada: «Mínimo No verificado · España Sin confirmar».
7. **`npm test`**, con la lectura «después de aplicar» simulada solo en la
   copia: **exit 0 en 179 s**. Ningún error de red en el registro.
   - Base de datos: 28 scripts con «0 fallidas» (1.161 comprobaciones), «30
     comprobaciones SQL correctas, sin red», 11/11 y 99/99.
   - Web: 661 correctas y 0 fallidas, 70 de páginas y RSS y 40 de precarga.
   - QR: «Todo correcto: el código se lee.»
   - Móvil: 527 pruebas, 525 correctas, 0 fallos y 2 omitidas.
   - Herramientas: «fichas.json: 22 fichas (22 con foto), catálogo
     2026-11-11-v2», «Transparencia al día: 22 ofertas con transparencia» y
     «Diferencias: 0».
   - Acceso: 248/248.

Miré además, en lo exportado, lo que leería un visitante después de aplicar:

- 8/13/1, todas verificadas el 11/11.
- Spiko: 2,41 %, 4,02 % y 2,84 %.
- mTBILL, en `fuentes_en_conflicto` y sin rentabilidad. La fila del SQL lleva
  «Valor por token · 10/11/2026: 1,0777 USD (oráculo del emisor)», y la vista
  lo tapa, como hoy.
- Boss Info: «100 CHF por transferencia al emisor; en cripto, desde 2 acciones
  (unos 17 ZCHF el 11/11)».
- Switzerlend: «1 acción (68,01 CHF el 11/11)».
- El acceso y la salida de las tres suizas son los publicados.
- Brickwise: Schwarzer Weg desde 69,90 € y Pottendorfer desde 73 €. La mejor
  compra es de 60 € en Schwarzer Weg y de 56 € en Randhartingergasse.
- Hausera: la tarjeta de siempre.

### Datos personales en lo que irá a Git

- **Los 21 nombres distintos que quitaron O1 y su ampliación** (los saqué de
  los diffs sin escribirlos en ningún sitio): **0 apariciones completas** en
  los 350 archivos que irán a Git.
- **Solo el apellido**: 19 apariciones en 9 archivos, ninguna de una persona.
  Once son una palabra alemana corriente (significa «libre»). Las demás son una
  empresa del registro de ESMA (en dos copias), la firma auditora de un emisor y
  el nombre de una calle.
- **Barrido propio**: tratamientos (Mr, Herr, Sr. y parecidos), cargos pegados a
  un nombre y citas del tipo «said …». Dio 21 resultados, todos falsos: menús,
  empresas, cargos sin nombre y «according to Swiss Law». Los que estaban junto
  a un nombre ya decían «[persona física recortada]».
- Ningún PDF, HTML, imagen ni `crudo/` de la carpeta del ciclo está en Git.

## 4. Escáner de secretos

- **Qué irá a Git** de las dos carpetas: **350 archivos**, 347 de la carpeta
  del ciclo y los 3 del SQL.
  - Los elegí con las reglas de `.gitignore`, también las del ciclo:
    `git ls-files`, más los archivos que no están en Git y no se ignoran (no
    hay ninguno).
  - Los 827 que se ignoran (PDF, HTML, `crudo/`, la copia de Midas…) se quedan
    en disco.
  - Ningún archivo que ya esté en Git cae en una regla de ignorar.
- **Copia.** Los copié a
  `/tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/entrega-1111/verificador/escaneo-gitleaks/`,
  con el mismo SHA-256 que los originales.
- **El binario.** El que nombra el encargo
  (`…/scratchpad/entrega-1111/gitleaks/gitleaks`) no existía (observación 4).
  Lo saqué del paquete que había en `…/scratchpad/gitleaks/gitleaks.tar.gz`.
  Ese paquete tiene el SHA-256 que fija `ci.yml` para gitleaks 8.30.1
  (`551f6fc8…70eb`). Lo puse en esa ruta: SHA-256 `88f91962…5509`, y
  `gitleaks version` da 8.30.1.
- **Resultado.** `gitleaks dir <carpeta> --config rwadar-app/gitleaks.toml
  --redact=100 --no-banner`, con la configuración `51ca9646…`: **exit 0, «no
  leaks found»** sobre 11,71 MB, y el informe JSON vacío (`[]`). No marca
  ninguna ruta.
- **Repeticiones.** Salió lo mismo con las opciones de la CI (`--no-color
  --ignore-gitleaks-allow`) y sobre el contenido exacto de HEAD, sacado con
  `git archive` y con el fin de línea que guarda Git. Al terminar repetí el
  escaneo con este archivo dentro (351 archivos), y salió igual.

## Observaciones (no bloquean)

1. **Desviaciones de DECISIONES que declaró el montador (INFORME §6).** Son
   tres:
   - **mTBILL.** DECISIONES §2 dice que el acceso de su tarjeta es «Sí: oferta
     pública en España para particulares». El SQL no lo añade, porque la ficha
     publicada no tiene datos de tarjeta propios y la vista los tapa por estar
     en «fuentes en conflicto». Ningún texto nuevo apoya el acceso en la web de
     Midas. La referencia antigua «Países de oferta según la web de Midas ·
     consulta 05/11/2026» se queda con su fecha.
   - **Boss Info.** «Última operación» se queda con el 10/11.
   - **Schwarzer Weg.** «Participaciones en venta: 300» se queda con el 10/11.

   Los tres revisores están de acuerdo, y los tres datos son ciertos con su
   fecha. Pero DECISIONES está cerrado y es del coordinador: conviene que lo
   confirme expresamente. Si no lo acepta, hay que regenerar el SQL. Eso cambia
   el SHA-256 y obliga a repetir las pruebas y la revisión.
2. **`despues-de-aplicar.mjs` lleva algo más que la C1 literal**: cambios de
   comentario y de mensajes, y una línea más en la salida. No cambian lo que
   escribe ni lo que comprueba, y están declarados en INFORME §9.
3. **O1 se amplió a cuatro copias de arttrade** (`8850b12`) que no estaban en
   la lista del revisor. Es lo que pide el paso 4 de O1 (repetir el barrido) y
   la regla del ciclo. Solo cambia nombres por «[artista omitido]», en 49
   líneas, y está declarado en INFORME §9. Ningún inventario fija el SHA-256 de
   esas copias.
4. **El binario de gitleaks no estaba en la ruta que pasa el flujo**
   (`…/entrega-1111/gitleaks/gitleaks`). Lo puse yo, sacado del paquete
   comprobado contra `ci.yml`. Conviene que el flujo use esa ruta, o la del
   paquete.
5. **Historia de la rama remota.** La rama local coincide con
   `origin/claude/sharp-babbage-m3bbbw` en `41617ec`: los recortes ya están
   subidos. Pero los nombres que quitó O1 siguen en commits anteriores de esa
   rama. Si el PR se une con *squash* y se borra la rama, no llegan a `main`.
   Reescribir la historia necesita permiso del responsable del proyecto.

## Lo que queda (no lo hace el verificador)

- **El coordinador** confirma la observación 1. Este archivo está sin commit, y
  el traspaso en `docs/tareas/PARA-CODEX.md` también es suyo.
- **Antes de aplicar**, antes del 18/11/2026 y con margen, porque la guarda usa
  la fecha en UTC:
  - confirmar que el SHA-256 de `aplicar-y-aprobar.sql` sigue siendo
    `dfeba195…a3cb`;
  - volver a leer como visitante: tiene que seguir publicada la
    `dfdc4c85-7f2f-fc4a-de27-a9f4a63f7656`;
  - aplicar solo ese archivo, nunca `catalogo.sql`.
- **Después de aplicar**, en este orden:
  - guardar la lectura pública en `lectura-despues-de-aplicar/`;
  - `sincronizar.js`;
  - `despues-de-aplicar.mjs` (se espera «43 de 44» y `transparencia.json` en
    `81e78ab9…3808`);
  - `volcar-seed.js`, `transparencia.mjs` y `rwadar-fichas.js`;
  - `npm test`;
  - publicar la web y **enviar la OTA**, porque la app lleva
    `transparencia.json` dentro (mínimos de Brickwise y de Switzerlend).
- **Hausera**: mirarla el 18/11, día en que abre la preventa y último día
  vigente de la ficha.

## Dónde están las pruebas

Todo está en
`/tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/entrega-1111/verificador/`:

- `huellas-inicio.txt` y `huellas-final.txt`: las dos carpetas al empezar y al
  terminar;
- `sql_inventario.py` y `sql-inventario.out`: el inventario y el diff
  normalizado;
- `prep0.sha`, `prep1.sha` y `prep2.sha`, y `prep1.out` y `prep2.out`;
- `comprobar.out` y `rest-exportado/`;
- `o1-del-informe.py`;
- `despues-0.out`, `sincronizar.out`, `despues-1.out`, `despues-2.out`,
  `volcar.out`, `transparencia.out`, `fichas.out` y `npm-test.log`;
- `app-esencial/esencial.mjs`;
- `barrido_personas.py` y `barrido-personas.tsv`;
- `a-git-verificador.txt`, `escaneo-gitleaks/` y `gitleaks-informe.json`.

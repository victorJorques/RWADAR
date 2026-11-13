# Verificación final de la entrega del catálogo «2026-11-13»

Hecha el 13/11/2026, de 14:56 a 15:15 UTC, por Claude como verificador final:
auditor independiente que no montó ni corrigió esta entrega. **Nada aplicado en
Supabase, nada publicado, ningún flujo lanzado, sin commit ni push.** Todo lo
que ejecuta código lo hice sin salida a Internet. La única consulta a un
servicio de fuera fue una lectura (GET, sin sesión) del libro de órdenes
público de Brickwise (§3).

## Resultado

**Conforme.** El SQL que hay que aplicar es:

- `aplicar-y-aprobar.sql`, SHA-256
  **`b6f0129cc4e8e82033bd9b4171bfaecc790e6de84c42671e291091aef99ee7b4`**;
- revisión **`434217eb-9b7f-1cd9-a851-fbde7bced2bf`**, huella
  `434217eb9b7f1cd9a851fbde7bced2bf001c79ac17610ad1d2a24edb8a9c1b61`.

Frente al SQL que vieron los tres revisores (`7be64e86…6961`, revisión
`66907add`), y con la revisión y la huella igualadas, cambia **una sola
sentencia**: la oferta de Pottendorfer. En ella cambian **solo los textos de la
corrección O1**, letra a letra. Todo lo demás es igual: las mismas 288
sentencias, las mismas tablas, la misma guarda y la misma aprobación.

Las dos correcciones obligatorias están hechas tal cual:

- **O1** (cumplimiento): Pottendorfer, con el libro de órdenes de las 14:36 UTC.
- **O2** (cumplimiento), que es la misma que la **C1** (SQL): los datos
  personales de la copia de Profitus.

De la O2/C1 solo queda su paso 7 (unir a `main` con *squash*), que no se puede
hacer sin commit. Las pruebas salen en verde y el escáner de secretos no marca
nada.

**Ojo al aplicar:** el SHA-256 que aprobó el revisor de SQL (`7be64e86…6961`)
ya no es el bueno. Hay que aplicar el `b6f0129c…e7b4` (observación 1).

## Cómo lo comprobé

- **Copia aparte.** Todo lo que ejecuta código lo hice en
  `/tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/entrega-1311/verificador/copia`:
  - un `git clone` del repositorio en `80c6238`, que es `HEAD` y también la
    rama de trabajo remota;
  - encima, los 228 archivos de las dos carpetas de la entrega que irán a Git,
    idénticos a los de la carpeta de trabajo (`cmp`);
  - para una prueba más, las dos respuestas crudas de
    `correcciones-entrega/crudo/`, que no van a Git;
  - `node_modules` enlazados.
  - Al terminar la borré para dejar sitio en el disco, que estaba al 99 %.
    Las salidas de cada prueba siguen en la carpeta del verificador (al final
    de este informe).
- **Sin red.** Cada orden corrió en un espacio de red propio (`unshare -n`),
  con solo la interfaz local. Una petición a Internet desde dentro falla
  (`EAI_AGAIN`).
- **La carpeta de trabajo, intacta.** Solo he escrito este archivo:
  - los 968 archivos de las dos carpetas de la entrega tienen, antes de
    escribirlo, el mismo SHA-256 que al empezar;
  - `transparencia.json` sigue en `ae3ed55e…9f62` y el catálogo sincronizado
    de la web en `487c29c1…8e45`. No hay nada aplicado.

## 1. El SQL antes y después de las correcciones

**Los archivos.**

| Archivo | Antes (copia del corrector) | Ahora |
| --- | --- | --- |
| `aplicar-y-aprobar.sql` | `7be64e86…6961` | `b6f0129c…e7b4` |
| `catalogo.sql` | `85ad96a8…b379` | `ed917b57…bc37` |
| `revision.json` | `a336306d…87c4` | `238a2db7…207d` |

- La copia de antes
  (`…/scratchpad/sql-antes-correcciones-2026-11-13/`) es **byte a byte** la
  que hay en Git en `HEAD`, la que vieron los tres revisores.
- Lo de ahora es lo de la carpeta de trabajo, todavía sin commit.

**El inventario.** Lo saqué con un troceador propio, que respeta las cadenas,
los bloques `$…$` y los comentarios. Antes y después es idéntico, sentencia a
sentencia y en el mismo orden:

- **288 sentencias** en una sola transacción: `begin isolation level
  serializable`, la guarda (`do $guarda$`), 284 `insert`, la aprobación
  (`do $aprobar$`) y `commit`;
- los inserts: 1 en `revisiones`, 69 en `fuentes`, 25 en `plataformas`, 107 en
  `plataforma_fuentes`, 25 en `alertas`, 35 en `alerta_fuentes` y 22 en
  `ofertas`. Todos en `rwadar_catalogo` y todos con `on conflict … do nothing`;
- nada escribe en `public.*`. Los inserts solo leen `public.plataformas`, y la
  guarda lee y bloquea `public.catalogo_publicacion`;
- no hay DDL, `delete`, `truncate`, permisos ni funciones. El único `update` es
  el de la aprobación;
- fuera de las cadenas, las 288 sentencias son iguales a las de antes;
- los 5 comentarios de cabecera son los mismos;
- UTF-8, saltos LF, sin BOM, 336 líneas. Pasa de 425.821 a 425.802 bytes.

**El diff normalizado.**

- **Estricto:** solo cambié por un marcador la revisión y la huella propias de
  cada archivo. Los demás uuid, las huellas y las fechas los dejé tal cual,
  para que cualquier otro cambio saliera. Sale **una sentencia distinta**, la
  283 (línea 312): el `insert` en `rwadar_catalogo.ofertas` de
  `vivienda-pottendorfer-stra-e-62-wr-neustadt`. En ella cambian **8 valores**
  de la documentación, todos de la O1:

  | Referencia | Antes | Ahora |
  | --- | --- | --- |
  | Mínimo de inversión | Desde 73 € la participación en reventa (13/11) | **Desde 80 € la participación en reventa (13/11)** |
  | Mínimo de inversión (alcance) | … a ese precio había 1 participación a la venta … | … a ese precio había **11 participaciones** a la venta … (el resto, igual) |
  | Venta más barata · 13/11/2026 | 73,00 € por participación (1 a ese precio, orden del 12/11/2026) | **80,00 € por participación (11 a ese precio, orden del 08/02/2026)** |
  | Orden de venta de menor importe · 13/11/2026 | 1 participación a 73,00 € (74,10 € con el 1,5 %) | **1 participación a 115,00 € (116,73 € con el 1,5 %)** |
  | Participaciones en venta · 13/11/2026 | 107 | **106** |
  | Alcance de las tres referencias del libro | … leído el 13/11/2026 (08:30–08:33 UTC) … | … leído el 13/11/2026 **(14:36 UTC)** … |

  «Mejor oferta de compra · 13/11/2026» no cambia: `19,00 € (3
  participaciones, orden del 06/11/2025)`, como pide la O1.
- **Amplio** (todos los uuid, huellas y fechas-hora igualados): la misma única
  línea.
- **En todo el SQL**, «(08:30–08:33 UTC)» pasa de 33 a 30 apariciones (tres en
  cada una de las otras 10 fichas de Brickwise) y «(14:36 UTC)» de 0 a 3 (las
  de Pottendorfer).
- **En la sentencia de Pottendorfer** ya no quedan «73,00», «74,10», «1
  participación a la venta» ni «orden del 12/11/2026». El único «73 €» que
  queda es el final de «116,73 €».
- `catalogo.sql`: 286 sentencias, con la misma única diferencia (la 282, línea
  284). Sus 284 inserts son, byte a byte, los de `aplicar-y-aprobar.sql`.
- `revision.json`: idéntico salvo la revisión y la huella.

**La guarda** es la revisada, salvo los identificadores. Exige:

- que lo publicado sea la `a58dd22d-98a3-f94e-ba66-46898162215a`, con su
  huella `a58dd22d…ee21` y aprobada (o ya la nueva);
- que el catálogo no esté retirado;
- que la fecha esté entre el 13/11 y el **20/11/2026**;
- que la revisión nueva no exista con otra huella o retirada.

La aprobación sigue exigiendo 25 plataformas y 22 ofertas (8/13/1).

**Conclusión:** la única diferencia es la que pide la O1. No se ha colado
nada más.

## 2. `preparar-entrega.mjs` (dos veces) y `comprobar-entrega.mjs`

**`preparar-entrega.mjs`.**

- En la copia borré primero las 8 salidas, para que el script las escribiera
  desde cero.
- Lo ejecuté dos veces seguidas a las 15:01:24 UTC, sin red y solo con lo que
  irá a Git. Las dos salieron con exit 0, sin nada en la salida de errores,
  con la misma línea por pantalla y con las mismas 8 huellas.
- Las 8 huellas coinciden con las de la carpeta de trabajo y con las que da el
  corrector:

| Salida | SHA-256 |
| --- | --- |
| `radar-canonico-26.json` | `79683038…acc9` |
| `escaparate-publicacion.json` | `a1bebcc8…f193` |
| `documentacion-ofertas.json` | `a6e04bbb…a99d` |
| `manifiesto-catalogo.json` | `c2c51919…4224` |
| `contraste-2026-11-13.json` | `333b487b…4b72` |
| `catalogo.sql` | `ed917b57…bc37` |
| `aplicar-y-aprobar.sql` | `b6f0129c…e7b4` |
| `revision.json` | `238a2db7…207d` |

- Por pantalla: revisión `434217eb-…` sobre la `a58dd22d-…`, 25 plataformas,
  69 fuentes del radar, 22 ofertas (8/13/1), 81 cambios, 5 puntos no aplicados
  tal cual y 82 horas reales de las suizas.
- Una tercera pasada, con las dos respuestas crudas de Brickwise en
  `correcciones-entrega/crudo/`, da lo mismo. Con ellas en disco, el script
  comprueba también que su SHA-256 es el del inventario.

**`comprobar-entrega.mjs --exportar=…`** usa PGlite sin red, con la cadena de
producción: el seed de antes de ARTEX y 17 lotes, hasta la 2026-11-12.

- Terminó con **exit 0 en 24 s (15:02:01–15:02:25 UTC) y «resultado:
  correcto»: 19 comprobaciones y 6 casos de fallo, todos «OK»**, con el SHA
  `b6f0129c…e7b4`.
- Lo que comprueba, entre otras cosas:
  - el inventario de 288 sentencias;
  - antes de aplicar, PGlite enseña lo mismo que se leyó como visitante a las
    08:27:43–08:27:47 UTC;
  - es idempotente, y `public.plataformas`, `public.fuentes` y el historial
    quedan intactos;
  - los 81 cambios en 18 fichas, uno a uno. Pottendorfer: 80 €, 116,73 € con
    el 1,5 %, 106 en venta y ningún rastro de la orden de 73 €;
  - la vigencia: la web lo acepta el 13/11 y el 20/11 y lo da por caducado el
    21/11;
  - las tarjetas: cambia solo el mínimo, en 14;
  - el sincronizador real: la ficha web de Pottendorfer dice «Desde 80 € la
    participación en reventa (13/11)» y 116,73 €.
- Los 6 casos de fallo no dejan nada: otra publicada, otra huella, catálogo
  retirado, destino con otra huella, lote caducado y una plataforma que falta.
- Si la revisión nueva ya estaba importada como borrador, la aprueba sin
  duplicar filas.
- El `pruebas-locales.json` que escribe es igual que el de la carpeta de
  trabajo, salvo la hora, la carpeta de exportación y cuántas fichas cambian
  frente a las de `rwadar-site/` (observación 4).

**Un ensayo corto de «después de aplicar»** en la copia, sin red y con lo que
exportó PGlite:

1. `despues-de-aplicar.mjs` antes de sincronizar: se niega con exit 1 («el
   catálogo sincronizado no es la revisión…»). `transparencia.json` no cambia.
2. `sincronizar.js` con el REST simulado: exit 0, «25 plataformas
   verificadas, 5 descartadas y 22 ofertas clasificadas», «rwadar.csv
   regenerado: 30 filas».
3. `despues-de-aplicar.mjs`: exit 0.
   - «43 de 44» y «11 de 11».
   - El mínimo corto de Pottendorfer queda en **«Desde 80 € la participación
     (13/11)»**.
   - `transparencia.json` queda en `f5bb46fe…bbcf`, el mismo que el corrector.
   - Otra vez: «Nada que cambiar: ya estaba hecho.», con el mismo SHA-256.

No repetí `npm test`: lo pasó el corrector en su copia, y la única prueba que
falla (la de noticias de la web) falla igual sin la entrega.

## 3. Las correcciones obligatorias, una a una

| Corrección | Estado |
| --- | --- |
| **SQL e integridad · C1:** datos personales en la copia de Profitus | Hecha tal cual (pasos 1 a 6). El paso 7, unir a `main` con *squash*, queda para cuando se haga el commit. |
| **Contenido** | No pidió ninguna obligatoria. |
| **Cumplimiento · O1:** Pottendorfer | Hecha tal cual. |
| **Cumplimiento · O2:** es la misma que la C1 | Hecha tal cual (ver C1). |

### O1 · Pottendorfer

- **La lectura nueva.** Está en `correcciones-entrega/inventario-consultas.json`:
  - v1 a las 14:36:41 UTC, HTTP 200, SHA-256 `3493ef71…d29c`;
  - v2 a las 14:36:42 UTC, HTTP 200, SHA-256 `6b1b2572…a78d`.

  Los crudos en disco tienen esos SHA-256. Son los mismos archivos que leyó
  el revisor de cumplimiento a las 14:16:58, 14:18:36 y 14:29:09 UTC.
- **Mi propio cálculo**, con un guion mío sobre las respuestas crudas (no con
  el resumen del montador). Pottendorfer (`AT0000A324B4`):
  - 19 órdenes de venta abiertas y **106** participaciones en venta. La v1 y
    la v2 dicen 106 y la v2 da 80 € como precio más bajo;
  - la venta más barata es **80 € × 11**, en una sola orden del 08/02/2026;
  - la orden de menor importe es **1 × 115 €**. Con el 1,5 %, 116,725 €, que
    redondeado da **116,73 €**;
  - la mejor oferta de compra es **19 € × 3**, del 06/11/2025;
  - **no hay ninguna orden a 73 €**. En el libro de la mañana (08:30 UTC)
    estaban la orden de 1 × 73 € del 12/11 y 107 en venta.
- **Las otras 10 fichas de Brickwise** dan exactamente lo mismo por la mañana
  y por la tarde. Comparé, ficha a ficha, la venta más barata, las órdenes a
  ese precio, la orden de menor importe, la mejor compra y las participaciones
  en venta.
- **Lectura propia a las 15:08:48–15:08:49 UTC** (GET, sin sesión): HTTP 200
  y **los mismos SHA-256** (`3493ef71…d29c` y `6b1b2572…a78d`). El libro no ha
  cambiado desde las 14:36 UTC.
- **Los textos** son, letra a letra, los de la corrección (tabla del §1). Los
  tres alcances del libro de Pottendorfer llevan «(14:36 UTC)» y las otras 10
  fichas siguen con «(08:30–08:33 UTC)».
- **Frente a lo publicado (12/11)**, Pottendorfer vuelve a lo mismo. El
  mínimo, la venta más barata y la orden de menor importe tienen el mismo
  valor, y solo cambia la fecha. «Participaciones en venta» pasa de 107
  (11/11) a 106 (13/11), y la mejor compra no cambia.
- **DECISIONES.** La línea de Pottendorfer de §2 ya cuenta esta lectura y hay
  un §5 nuevo. Lo escribió el montador, y él mismo dice que falta que la
  coordinación lo confirme (observación 2).
- **`despues-de-aplicar.mjs`.** El mínimo de Pottendorfer pasa de `'73'` a
  `'80'`. En el ensayo da «Desde 80 € la participación (13/11)».
- **`preparar-entrega.mjs`.** Las comprobaciones que esperaban 73 € de las
  antiguas líneas 531, 537, 794–795 y 959 están adaptadas. Hay comprobaciones
  nuevas:
  - el inventario de la tarde, con sus horas y sus SHA-256;
  - cada texto es el de la O1;
  - las otras 10 fichas son iguales en las dos lecturas;
  - no queda ningún 73 € en Pottendorfer.

  Las de las antiguas 552 y 554 siguen igual, y está bien así
  (observación 3).
- **`comprobar-entrega.mjs`.** Exige 80 €, 116,73 €, 106 y 19 €, los tres
  alcances con «(14:36 UTC)» y ningún rastro de la orden de 73 €.
- **Regenerar y repetir las pruebas.** Lo hizo el corrector y lo he repetido
  yo (§2).
- **Spiko.** Se regeneró antes de las 18:00 UTC. Sus sentencias son las
  revisadas (VL del 12/11): no se mezcla nada.

### O2 y C1 · La copia de Profitus

Archivo:
`grupos/vigilancia/fuentes/profitus/nav-profitus-bonds-2026-11-13.txt`.

- **Qué cambia.** `git diff --numstat` da `4 4`. Cambian justo las líneas
  124, 240, 244 y 249, y el archivo sigue teniendo 304 líneas.
- **Cada línea cambiada** lleva una sola marca, y fuera de la marca es igual
  que antes. Comprobé lo quitado sin escribirlo:
  - **124:** la marca «[nombre recortado]» está entre «led by its founder, » y
    «, a former member». Lo quitado son dos palabras con mayúscula inicial y
    sin cifras;
  - **240:** la línea entera pasa a «[nombre recortado]» (eran dos palabras);
  - **244:** pasa a «[correo recortado]» (era una dirección con @);
  - **249:** pasa a «[teléfono recortado]» (eran 11 cifras).
- **Lo que se queda:** el teléfono de atención al cliente de la línea 291 y los
  correos genéricos de la empresa (info@ y support@).
- **`grupos/vigilancia/resumen-vigilancia.md`.** «Recortados en las copias»
  nombra ya la copia de Bit2Me (líneas 65, 69 y 82) y la de Profitus.
- **Barrido.** Un guion mío saca de la versión de Git lo que se quitó, sin
  escribirlo en ningún sitio. Busca cada dato con y sin tildes, en mayúsculas
  y minúsculas:
  - los dos nombres completos, cada apellido y cada nombre de pila;
  - el correo completo y la parte de antes de la @;
  - el teléfono sin espacios y sus 8 últimas cifras.

  Resultado:
  - en los 228 archivos que irán a Git: **0 apariciones**;
  - en los 311 archivos de las dos carpetas que no están en `crudo/`, también
    los que Git ignora: **0**;
  - los originales solo están en dos archivos de `crudo/`, que Git ignora por
    las reglas `grupos/**/crudo/` y `revision-independiente/**/crudo/`. El del
    grupo tiene el SHA-256 del inventario (`7d2afc89…`).
- **En el resto del repositorio** (4.966 archivos que vería Git) solo sale el
  teléfono, en dos copias de ciclos anteriores (observación 5).
- **Paso 7 (unir a `main` con *squash*): no hecho.** El encargo prohíbe commit
  y push. El commit `cccebe2`, que lleva los datos, está en
  `origin/claude/sharp-babbage-m3bbbw` y no en `main`.

### Qué más cambió después de las revisiones

De `80c6238` (la última revisión) a la carpeta de trabajo cambian 14 archivos
y hay 3 nuevos, todos de las dos carpetas de la entrega:

- **Los tres del SQL:** la O1 (§1).
- **`documentacion-ofertas.json`:** los mismos 8 valores que el SQL, solo en
  Pottendorfer. El escaparate, el radar y el manifiesto no cambian ni en un
  valor.
- **`contraste-2026-11-13.json`:**
  - la revisión y el SHA-256 de DECISIONES;
  - los 4 cambios de Pottendorfer, su tarjeta y su cifra;
  - la condición de hora de Brickwise;
  - la O1 y la O2 en «correccionesRevisores»;
  - una entrada más en «noAplicadoTalCual»: los textos de 73 € del
    expediente, que el montador no puede editar.
- **`preparar-entrega.mjs`, `comprobar-entrega.mjs` y
  `despues-de-aplicar.mjs`:** la O1. Leí los tres diffs. Solo cambian las
  comprobaciones que esperaban 73 €, se añaden comprobaciones nuevas y no se
  quita ninguna otra.
- **`DECISIONES-COORDINADOR.md`:** §2 (Pottendorfer) y §5 nuevo.
- **`INFORME-ENTREGA.md`:** la cabecera y el §9. La cabecera ya avisa de que
  los §1 a §8 cuentan la `66907add`.
- **`ensayo-despues.json` y `pruebas-locales.json`:** las pasadas corregidas.
- **La copia de Profitus y `resumen-vigilancia.md`:** la O2/C1.
- **`correcciones-entrega/`** (nuevo): el inventario, el resumen del libro sin
  direcciones y su `.gitignore`. Los crudos se quedan fuera de Git.

No han cambiado `expedientes/`, `revision-independiente/`, `lectura-publica/`,
el radar, las noticias ni el encargo. Cada `REVISION-ENTREGA-*.md` lo toca un
solo commit, el suyo. Fuera de las dos carpetas no cambia nada.

## 4. Escáner de secretos

- **Qué irá a Git** de las dos carpetas: **228 archivos**:
  - 225 de la carpeta del ciclo: 222 que ya están en Git y 3 nuevos de
    `correcciones-entrega/`;
  - y los 3 del SQL.

  Más este informe.
  - Los elegí con las reglas de `.gitignore`, también las del ciclo y las de
    `correcciones-entrega/`: `git ls-files`, más los archivos sin seguimiento
    que no se ignoran.
  - Ninguno es PDF, HTML, imagen ni está en `crudo/`. Ningún archivo que ya
    esté en Git cae en una regla de ignorar.
  - Los 740 que se ignoran se quedan en disco.
- **Copia.** Los copié a
  `/tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/entrega-1311/verificador/escaneo-gitleaks/`,
  con el mismo contenido que los originales (`cmp`).
- **El binario** es el que nombra el encargo
  (`…/scratchpad/gitleaks/gitleaks`):
  - gitleaks 8.30.1, SHA-256 `88f91962…5509`;
  - es el mismo que trae el paquete con el SHA-256 que fija `ci.yml`
    (`551f6fc8…70eb`).
- **Resultado.** Ejecuté `gitleaks dir <carpeta> --config
  rwadar-app/gitleaks.toml --redact=100 --no-banner`, con la configuración
  `51ca9646…2d95`: **exit 0 y «no leaks found»** sobre 5,07 MB. **No marca
  ninguna ruta.**
- **Repeticiones:**
  - con las opciones de la CI (`--no-color --ignore-gitleaks-allow`) y con
    informe JSON: lo mismo, y el informe vacío (`[]`);
  - al terminar, con este informe dentro (229 archivos): lo mismo.

## Observaciones (no bloquean)

1. **El SQL cambió después de las revisiones.**
   - Los tres revisores vieron la `66907add` (`7be64e86…6961`), y el de SQL
     ató su aprobación a ese SHA-256.
   - La de ahora es la `434217eb` (`b6f0129c…e7b4`). Solo cambian los textos
     de la O1, que son los que escribió el propio revisor de cumplimiento.
   - Lo que miró el revisor de SQL no cambia: inventario, guarda,
     transacción, idempotencia y permisos.
   - Como pide `CICLO-DIARIO-CATALOGO.md` §5.2, las pruebas se han repetido
     después del cambio: el corrector y yo.
   - La O1 pide pasar el SQL nuevo «por la revisión de SQL y el auditor».
     Este informe es lo segundo y cubre lo que cambia. Si la coordinación
     quiere además una revisión de SQL aparte sobre `b6f0129c…e7b4`, es lo
     único de la O1 que falta.
   - **Aplicar solo el `b6f0129c…e7b4`.**
2. **Quién escribió las correcciones.**
   - Los revisores pedían que la lectura y la línea de DECISIONES de la O1 las
     escribiera el investigador, el revisor de Brickwise o la coordinación.
     Pedían también que el recorte de la O2/C1 lo hiciera quien escribió la
     copia o la coordinación, «no el montador».
   - Lo hizo todo el montador. El resultado es el pedido, letra a letra, y la
     lectura tiene el mismo SHA-256 que las del revisor.
   - Falta que la coordinación dé por buenos DECISIONES §2 y §5, como dice el
     propio §5.
3. **Dos comprobaciones de `preparar-entrega.mjs` siguen con el 73.** Son las
   que la O1 cita como 552 y 554 (ahora 601 y 603):
   - una prueba que el redondeo de 73 × 1,015 da 74,10;
   - la otra, que el informe del revisor de Brickwise de la mañana confirmó la
     orden de 73 €, y eso sigue siendo cierto.

   Ninguna hace que la entrega diga 73 €. Cambiarlas a 80 € sería falso, así
   que no hay que tocarlas.
4. **`pruebas-locales.json` de la carpeta del ciclo dice «cambian 0» fichas.**
   - Sale de la segunda exportación del corrector, que hizo en la copia del
     ensayo después de regenerar allí las fichas.
   - En una copia limpia (la mía) salen 52 (22 de oferta, 25 de plataforma y 5
     descartadas), igual que por la mañana y que el 12/11.
   - No afecta al SQL. Hay que saberlo al leer ese archivo.
5. **Fuera de esta entrega: el mismo teléfono directo en dos copias antiguas.**
   - El teléfono directo del mismo empleado de Profitus sigue en dos copias de
     ciclos anteriores que ya están en `main`:
     - `rwadar-app/data/verificaciones/2026-11-10-v2/grupos/candidatas-europa/fuentes/profitus/profitus-bonds.render.txt`,
       línea 249;
     - `rwadar-app/data/verificaciones/2026-11-11-v2/grupos/vigilancia/fuentes/profitus/profitus-bonds-2026-11-11.txt`,
       línea 254.
   - En las dos, el nombre y el correo ya estaban recortados.
   - Ningún revisor lo pidió y no es parte de esta entrega. Recortarlo es un
     cambio aparte, que decide la coordinación.
6. **Historia de la rama remota.**
   - `cccebe2`, con los datos de Profitus sin recortar, está en
     `origin/claude/sharp-babbage-m3bbbw`.
   - Si se une a `main` con *squash* y se borra la rama, no llegan a `main`.
     Reescribir la historia necesita permiso del responsable del proyecto.

## Lo que queda (no lo hace el verificador)

- **La coordinación:**
  - confirmar DECISIONES §2 y §5 (observación 2);
  - el commit de los 14 archivos cambiados, de `correcciones-entrega/` (sin su
    `crudo/`) y de este informe;
  - unir con *squash* (paso 7 de la O2/C1);
  - el traspaso en `docs/tareas/PARA-CODEX.md`;
  - decidir sobre las observaciones 1 y 5.
- **Antes de aplicar.** Hay que hacerlo antes del **20/11/2026**, con margen,
  porque la guarda usa la fecha en UTC:
  - volver a leer el libro de Brickwise. A las 15:08 UTC seguía igual que a
    las 14:36. Si la venta más barata de Pottendorfer ya no es 80 €, o cambia
    cualquiera de las 11, hay que rehacer la entrega;
  - confirmar que el SHA-256 de `aplicar-y-aprobar.sql` sigue siendo
    `b6f0129c…e7b4`;
  - volver a leer como visitante: tiene que seguir publicada la
    `a58dd22d-98a3-f94e-ba66-46898162215a`;
  - aplicar solo ese archivo, nunca `catalogo.sql`.
- **Spiko** publica VL nuevas hoy a las 18:00 UTC (Letras) y a las 19:30 UTC
  (Smart Cash). Desde entonces, las cifras de la entrega siguen siendo ciertas
  con su fecha (VL del 12/11), pero ya no son las últimas.
- **Hausera:** la preventa abre el 18/11. Conviene otra puesta al día antes, o
  mirarla ese día.
- **Después de aplicar**, en este orden:
  - guardar la lectura pública en `lectura-despues-de-aplicar/`;
  - `sincronizar.js`;
  - `despues-de-aplicar.mjs`: se espera «43 de 44» y el mínimo corto «Desde
    80 € la participación (13/11)»;
  - `volcar-seed.js`, `transparencia.mjs` y `rwadar-fichas.js`;
  - `npm test`, con la prueba de noticias de la web ya ajustada;
  - publicar la web y **enviar la OTA**, porque la app lleva
    `transparencia.json` dentro.

## Dónde están las pruebas

Todo está en
`/tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/entrega-1311/verificador/`:

- `huellas-inicio.txt`, `huellas-antes-de-escribir.txt` y
  `huellas-final.txt`: las dos carpetas al empezar, antes de escribir este
  archivo y al terminar;
- `scripts/sql_auditoria.py`, `sql-auditoria-aplicar.out` y
  `sql-auditoria-catalogo.out`: el inventario y los diffs normalizados;
- `scripts/pottendorfer.py`: la sentencia de Pottendorfer, antes y después;
- `salidas.txt`, `prep0.sha`, `prep1.sha`, `prep2.sha`, `prep3.sha`,
  `prep1.out`, `prep2.out` y `prep3-con-crudo.out`;
- `comprobar.out`, `pruebas-locales-verificador.json` y `rest-exportado/`;
- `despues-0.out`, `sincronizar.out`, `despues-1.out` y `despues-2.out`;
- `scripts/libro_brickwise.py`, `libro-manana.out`, `libro-tarde.out`,
  `libro-propio-*.json` y `lectura-brickwise-1508/`: el libro de órdenes;
- `scripts/barrido_o2.py`, `a-git-entrega.txt`, `ciclo-fuera-de-crudo.txt` y
  `a-git-repo.txt`: el barrido de la O2/C1;
- `escaneo-gitleaks/`, `gitleaks.log`, `gitleaks-ci.log`,
  `gitleaks-informe.json` y `gitleaks-final.log`;
- `scripts/sin-red.sh`: cómo corrió cada orden sin red.

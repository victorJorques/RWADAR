# Verificación final de la entrega del catálogo «2026-11-12»

Hecha el 12/11/2026, de 02:40 a 03:02 UTC, por Claude como verificador final:
auditor independiente que no montó ni corrigió esta entrega. **Nada aplicado en
Supabase ni en ningún servicio remoto, nada publicado, ningún flujo lanzado, sin
commit ni push.** Todo lo que ejecuta código lo hice sin salida a Internet.

## Resultado

**Conforme.** El SQL que hay que aplicar es:

- `aplicar-y-aprobar.sql`, SHA-256
  **`d4d73024c079d447d34e01168d31401eb5f62c57a16c2ae2194dd031c2714e4d`**;
- revisión **`a58dd22d-98a3-f94e-ba66-46898162215a`**, huella
  `a58dd22d98a3f94eba6646898162215af1ea3d4faefbeaf46e14d9ac18b1ee21`.

Frente al SQL que vieron los tres revisores (`4815b3cb…e7ff`, revisión
`7ad7ea72`), y con la revisión y la huella igualadas, cambia **una sola
sentencia** (la oferta de Hausera) y en ella **dos palabras**: «Hoy no se puede
invertir» pasa a «El 12/11/2026 aún no se podía invertir». Es el texto exacto
que propusieron los revisores de contenido (R1) y de cumplimiento (primer punto
de su R1). Todo lo demás es igual: las mismas 288 sentencias, las mismas tablas,
la misma guarda y la misma aprobación.

La única corrección obligatoria (O1 de cumplimiento) está hecha tal cual. Las
pruebas salen en verde y el escáner de secretos no encuentra nada.

**Ojo al aplicar:** el SHA-256 que aprobó el revisor de SQL (`4815b3cb…e7ff`)
ya no es el bueno. Hay que aplicar el `d4d73024…4e4d` (observación 1).

## Cómo lo comprobé

- **Copia aparte.** Todo lo que ejecuta código lo hice en
  `/tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/entrega-1211/verificador/copia`:
  - un `git clone` del repositorio en `7af410e` (el mismo commit que la rama
    remota);
  - encima, las carpetas del ciclo del 12/11, del 11/11 y del SQL, también lo
    que Git ignora;
  - `node_modules` enlazados.
  - Los 1.968 archivos copiados son idénticos a los originales (`cmp`).
- **Sin red.** Cada orden corrió en un espacio de red propio
  (`unshare -n`), con solo la interfaz local. Una petición a Internet desde
  dentro falla (`EAI_AGAIN`).
- **La carpeta de trabajo, intacta.** Solo he escrito este archivo. Los 789
  archivos de las dos carpetas de la entrega tienen al terminar el mismo
  SHA-256 que al empezar. `transparencia.json` sigue en `81e78ab9…3808` y el
  catálogo sincronizado de la web en `3c4c5e98…5d72`: no hay nada aplicado.

## 1. El SQL antes y después de las correcciones

**Los archivos.**

| Archivo | Antes (copia del corrector) | Ahora |
| --- | --- | --- |
| `aplicar-y-aprobar.sql` | `4815b3cb…e7ff` | `d4d73024…4e4d` |
| `catalogo.sql` | `71b126d0…3fc6` | `e59781ba…282d` |
| `revision.json` | `3ac28c31…2c38` | `8d68aeb3…949d` |

- La copia de antes
  (`…/entrega-1211/sql-antes-correcciones-2026-11-12/`) es **byte a byte** la
  del commit del montaje (`523f89e`), la misma que siguió en Git hasta la última
  revisión (`16fc7a7`).
- Lo de ahora es lo que hay en `7af410e` y en la carpeta de trabajo.

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
- los 5 comentarios de cabecera son los mismos;
- UTF-8, saltos LF, sin BOM: 336 líneas y 425.881 bytes.

**El diff normalizado.**

- **Estricto:** solo cambié por un marcador la revisión y la huella propias de
  cada archivo. Los demás uuid, las huellas y las fechas los dejé tal cual, para
  que cualquier otro cambio saliera. Sale **una sentencia distinta**, la 286
  (`insert` en `rwadar_catalogo.ofertas`, `hausera-proximas-ofertas`), con dos
  cambios de palabra en el alcance del «Mínimo de inversión»:
  - «Hoy» → «El 12/11/2026 aún»;
  - «puede» → «podía».
- **Amplio** (como el del 11/11: todos los uuid, huellas y fechas-hora
  igualados): la misma única línea.
- **El texto queda así:** «… El 12/11/2026 aún no se podía invertir: la
  preventa abre el 18/11/2026 y la suscripción, el 25/11/2026.». La frase
  antigua sale 0 veces y la nueva, 1.
- `catalogo.sql`: 286 sentencias, la misma única diferencia. `revision.json`:
  idéntico con la revisión y la huella igualadas.

**La guarda** es la revisada, salvo los identificadores. Exige:

- que lo publicado sea la `24b5f7de-2834-3e15-6ae4-62a6d9565161`, con su
  huella `24b5f7de…ceec22` y aprobada (o ya la nueva);
- que el catálogo no esté retirado;
- que la fecha esté entre el 12/11 y el **19/11/2026**;
- que la revisión nueva no exista con otra huella o retirada.

**De dónde sale la diferencia.** No es una corrección obligatoria:

- es la R1 de contenido y el primer punto de la R1 de cumplimiento, con el
  texto exacto que propusieron los dos;
- el corrector podía aplicar las recomendadas que no amplían DECISIONES ni
  cambian cifras sin fuente. Esta re-fecha algo que se consultó hoy (DECISIONES
  §2, Hausera: «se refecha al 12/11 solo lo que se volvió a consultar hoy») y no
  cambia ninguna cifra;
- está declarada en INFORME §9;
- la skill del ciclo prevé este caso: si un corrector cambia el SQL tras la
  revisión, otro agente comprueba el diff normalizado y vuelve a pasar
  `comprobar-entrega.mjs`. Es lo que hago aquí.

La doy por corrección pedida, no por algo colado.

## 2. `preparar-entrega.mjs` (dos veces) y `comprobar-entrega.mjs`

**`preparar-entrega.mjs`.** En la copia borré primero las 8 salidas, para que
el script las escribiera desde cero. Lo ejecuté dos veces seguidas a las
02:44:09 UTC, sin red. Las dos salieron con exit 0, con la misma salida por
pantalla y con las mismas 8 huellas. Coinciden con las de la carpeta de trabajo
y con las que da el corrector:

| Salida | SHA-256 |
| --- | --- |
| `radar-canonico-26.json` | `0c9ca7db…5ac1` |
| `escaparate-publicacion.json` | `06212b6a…2ab3` |
| `documentacion-ofertas.json` | `8c5af487…c1ce` |
| `manifiesto-catalogo.json` | `c2c51919…4224` |
| `contraste-2026-11-12.json` | `c9cf81ef…187e` |
| `catalogo.sql` | `e59781ba…282d` |
| `aplicar-y-aprobar.sql` | `d4d73024…4e4d` |
| `revision.json` | `8d68aeb3…949d` |

- Por pantalla: revisión `a58dd22d-…` sobre la `24b5f7de-…`, 25 plataformas,
  69 fuentes del radar, 22 ofertas (8/13/1), 83 cambios y 10 puntos no
  aplicados tal cual. Lo mismo que antes de corregir.
- El contraste guarda los SHA-256 de `DECISIONES-COORDINADOR.md`
  (`6d4bfe3b…1cc9`), de `radar-contraste-2026-11-12.json` (`3126c4c6…2696`) y
  de `cambios-radar.json` (`714911da…8b5c`). Son los de los archivos de hoy.
  DECISIONES no ha cambiado desde `1b632af`.
- El script no mira la hora. Lo de Spiko vale porque la entrega se montó y se
  corrigió antes de las 18:00 UTC del 12/11.

**`comprobar-entrega.mjs --exportar=…`** usa PGlite sin red, con la cadena de
producción: el seed de antes de ARTEX y 16 lotes, hasta la 2026-11-11.

- Terminó con **exit 0 en 18 s y «resultado: correcto»: 19 comprobaciones y 6
  casos de fallo, todos «OK»**, con el SHA `d4d73024…4e4d`.
- Los 6 casos de fallo no dejan nada: otra publicada, otra huella, catálogo
  retirado, destino con otra huella, lote caducado y una plataforma que falta.
- Si la revisión nueva ya estaba importada como borrador, la aprueba sin
  duplicar filas.
- El `pruebas-locales.json` que escribe es igual que el de la carpeta de
  trabajo, salvo la hora y la carpeta de exportación.

**Con el reloj simulado** (prueba de la corrección SQL 2.ª):

- el 13/11 a las 10:00 UTC y el 18/11 a las 23:00 UTC: exit 0, «correcto», 18
  comprobaciones y 6 casos. El caso caducado sigue fallando: «Lote caducado: sus
  fichas valían hasta el 19/11/2026»;
- el 19/11 a las 23:00 UTC: exit 1. Lo explico en la observación 2: no es un
  fallo del SQL.

## 3. Las correcciones obligatorias, una a una

| Corrección | Qué encontré | Estado |
| --- | --- | --- |
| **SQL e integridad** | No pidió ninguna obligatoria. | — |
| **Contenido** | No pidió ninguna obligatoria. | — |
| **O1** (cumplimiento): nombres de cuatro personas físicas en `noticias/fuentes/rhj-supp.txt` | Ver debajo. | Hecha tal cual |

**Cómo comprobé la O1:**

- **El script.** Saqué el del §7 del informe de cumplimiento. Es idéntico byte
  a byte al que usó el corrector (`recortar-o1.py`, SHA-256 `74aab165…1617`).
- **Lo volví a ejecutar** sobre el archivo tal como estaba en `16fc7a7`, antes
  de corregir (SHA-256 `670caccc…3633`):
  - exit 0, e imprime «… 9 líneas»;
  - el resultado es **byte a byte** el de la carpeta de trabajo y el de `HEAD`
    (`1b5de3b4…2234`).
- **Lo que pide el revisor:**
  - `grep -c "persona física recortada"` da 9;
  - `git diff --numstat 16fc7a7` da `9 9`, solo en ese archivo.
- **Línea a línea.** Las 9 líneas son las que dice el revisor: 1232, 1237, 7843,
  7854, 7865, 7875, 7876, 14281 y 14286. En cada una:
  - hay una sola marca «[persona física recortada]»;
  - fuera de la marca, la línea es la de antes;
  - lo quitado son dos palabras con mayúscula inicial y sin cifras.
  - Quedan cubiertos los cuatro bloques de firma («By:») y la tabla de
    consejeros. La secretaría del emisor es una sociedad.
- **Barrido** de lo que irá a Git de las dos carpetas (246 archivos):
  - los cuatro nombres (los saqué del diff de Git sin escribirlos en ningún
    sitio): **0 apariciones completas y 0 del apellido solo**;
  - mi propio barrido de «nombre + cargo» y de firmas («By:», «Name:»,
    «Signed»…): nada más que los recortes (un «Name:» es el nombre de un
    producto);
  - tratamientos (Mr, Ms, Herr, Sr.…) en las noticias: 0.
  - En el resto del repositorio queda un caso antiguo, ajeno a esta entrega
    (observación 5).

### Qué más cambió después de las revisiones

De `16fc7a7` (la última revisión) a la carpeta de trabajo cambian 13 archivos,
todos de las dos carpetas de la entrega:

- **Los tres del SQL:** la R1 (§1).
- **`documentacion-ofertas.json`:** una línea, con las mismas dos palabras (R1).
- **`contraste-2026-11-12.json`:** solo la revisión nueva y el SHA-256 de
  `cambios-radar.json`.
- **`cambios-radar.json`:** la cabecera. `"fecha"` pasa de `2026-11-11` a
  `2026-11-12`, y la nota, de «11/11/2026» a «12/11/2026» (SQL 6.ª y R10 de
  contenido). Sus dos lecturas a mano son de hoy a las 00:37 UTC. No cambia el
  SQL.
- **`preparar-entrega.mjs`:**
  - la R1: antes de cambiar la frase, exige que el expediente lleve la nota del
    12/11 y que la frase antigua salga una sola vez;
  - exige ya la fecha y la nota de hoy en `cambios-radar.json`;
  - y comentarios.
- **`despues-de-aplicar.mjs`:** la R4 de contenido.
  - El motivo de «Documento para España» de Hausera pasa de «el 10/11/2026» a
    «el 12/11/2026».
  - Antes exige que el expediente consultara hoy el registro ERIR de la CNMV y
    que el aviso del catálogo ya diga 12/11.
  - Se iguala en «Nada más cambia», y la salida tiene una línea más.
- **`comprobar-entrega.mjs`:** la SQL 2.ª. En `base()`, cada lote de la cadena
  se aplica con su tope evaluado en su propio día, con el mismo `replace` que
  propuso el revisor. La cadena acaba en la 2026-11-11, así que el SQL de hoy se
  aplica tal cual.
- **`noticias/fuentes/rhj-supp.txt`:** la O1.
- **`INFORME-ENTREGA.md`, `ensayo-despues.json` y `pruebas-locales.json`** (sin
  commit): recogen la pasada corregida.

Desde `1b632af` no han cambiado `expedientes/`, `revision-independiente/`,
`DECISIONES-COORDINADOR.md`, `ENCARGO-INVESTIGADORES.md`, `lectura-publica/`,
`grupos/`, el radar ni las noticias (salvo la O1). Cada `REVISION-ENTREGA-*.md`
lo toca un solo commit: el suyo. Fuera de las dos carpetas no cambia nada.

### Ensayo de «después de aplicar» (en la copia y sin red)

1. **`despues-de-aplicar.mjs` antes de sincronizar**: se niega con exit 1 («el
   catálogo sincronizado no es la revisión a58dd22d-…: aplica antes el SQL…»).
   `transparencia.json` sigue en `81e78ab9…3808`.
2. **`sincronizar.js` con el REST simulado** (lo que exportó PGlite): exit 0.
   «25 plataformas verificadas, 5 descartadas y 22 ofertas clasificadas.
   rwadar.csv regenerado: 30 filas.» El CSV no cambia.
3. **`despues-de-aplicar.mjs`**: exit 0.
   - «Comprobaciones de transparencia al 12/11: 43 de 44». Solo se queda en el
     10/11 la «supervisada» de mTBILL.
   - «11 de 11» títulos.
   - Los mínimos cortos de Brickwise, Switzerlend «1 acción (68,01 CHF,
     12/11)» y Hausera «Desde 100 € en Alicante 3 (12/11)».
   - El motivo de Hausera ya dice «… el 12/11/2026 la emisión aún no estaba
     inscrita…».
   - `transparencia.json` queda en
     **`ae3ed55e56c8a29c444c839e205529c4f5c6bc721d1c47925ed027493aa59f62`**, el
     mismo que el corrector. Al repetirlo: «Nada que cambiar: ya estaba hecho.»,
     con el mismo SHA-256.
4. **`transparencia.json`, valor a valor:**
   - con el mismo catálogo, la versión revisada del script (`16fc7a7`) y la de
     ahora solo se diferencian en **un valor**: el motivo de Hausera, del 10/11
     al 12/11;
   - frente al de la carpeta de trabajo (el del 11/11) cambian 93 valores, todos
     de los previstos: lote, revisión y fecha de revisión (3), 22
     «verificadaEl», 43 fechas de consulta, 11 títulos, 13 mínimos cortos (11 de
     Brickwise, Switzerlend y Hausera) y el motivo de Hausera.
5. **Los demás pasos:**
   - `volcar-seed.js`: «25 en el radar, 5 descartadas, 13 fuentes», sin
     diferencias en `02_seed.sql`;
   - `transparencia.mjs`: «22 ofertas con transparencia»;
   - `rwadar-fichas.js`: «Archivos actualizados: 55».
6. **Lo que se genera:**
   - «Hoy no se puede invertir» ya no sale en ningún sitio;
   - la frase nueva está en las vistas exportadas, en el catálogo sincronizado y
     en la ficha web de Hausera;
   - el motivo nuevo está en `transparencia.json`, en la app
     (`transparencia-contenido.js`), en la web (`rwadar-20260820.js`) y en la
     ficha.
7. **Lo que verá el usuario en la app.** Lo calculé con su código
   (`datosCortosOferta` y `datosTarjetaOferta`). Sale igual que al corrector:
   - frente a lo publicado cambian 13 fichas, y solo en el mínimo;
   - Cohotel pasa de 110 a 102 €, GreenPoint de 100 a 102 € y Pottendorfer de 73
     a 80 €; en las demás solo cambia la fecha;
   - mTBILL sigue en «Mínimo No verificado · España Sin confirmar»;
   - el 19/11 se ve lo mismo que el 12/11.
8. **`npm test`**, con la lectura «después de aplicar» simulada solo en la copia.
   - La primera pasada dio exit 1 por **una** prueba: el guardián de la OTA
     hace un commit de prueba en una carpeta temporal. En este entorno los
     commits se firman con un servicio de la máquina, y mi espacio de red
     aislado no llega a él. Esa prueba sola, sin la firma del entorno: «ok».
   - Repetido entero así: **exit 0 en 155 s**.
     - Base de datos: 28 scripts con «0 fallidas» (1.161 comprobaciones), «30
       comprobaciones SQL correctas, sin red», 11/11 y 103/103.
     - Web: 672 correctas y 0 fallidas, 70 de páginas y RSS y 40 de precarga.
     - QR: «Todo correcto: el código se lee.»
     - Móvil: 584 pruebas, 582 correctas, 0 fallos y 2 omitidas.
     - Herramientas: «fichas.json: 22 fichas (22 con foto), catálogo
       2026-11-12-v2», «Transparencia al día: 22 ofertas con transparencia» y
       «Diferencias: 0».
     - Acceso: 250/250.

## 4. Escáner de secretos

- **Qué irá a Git** de las dos carpetas: **246 archivos**, 243 de la carpeta
  del ciclo y los 3 del SQL (más este informe).
  - Los elegí con las reglas de `.gitignore`, también las del ciclo:
    `git ls-files`, más los archivos sin seguimiento que no se ignoran (no
    había ninguno).
  - Los 543 que se ignoran (PDF, HTML, `crudo/`…) se quedan en disco.
  - Ningún archivo que ya esté en Git cae en una regla de ignorar.
- **Copia.** Los copié a
  `/tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/entrega-1211/verificador/escaneo-gitleaks/`,
  con el mismo contenido que los originales (`cmp`).
- **El binario.** El que nombra el encargo
  (`…/scratchpad/entrega-1211/gitleaks/gitleaks`) no existía (observación 3).
  - Lo saqué del paquete `…/scratchpad/gitleaks/gitleaks.tar.gz`, que tiene el
    SHA-256 que fija `ci.yml` para gitleaks 8.30.1 (`551f6fc8…70eb`).
  - Lo puse en esa ruta: SHA-256 `88f91962…5509`, y `gitleaks version` da
    8.30.1.
- **Resultado.** Ejecuté `gitleaks dir <carpeta> --config
  rwadar-app/gitleaks.toml --redact=100 --no-banner`, con la configuración
  `51ca9646…2d95`: **exit 0 y «no leaks found»** sobre 6,89 MB. **No marca
  ninguna ruta.**
- **Repeticiones:**
  - con las opciones de la CI (`--no-color --ignore-gitleaks-allow`) y con
    informe JSON: lo mismo, y el informe vacío (`[]`);
  - sobre el contenido exacto de `HEAD`, sacado con `git archive` (6,87 MB): lo
    mismo;
  - al terminar, con este informe dentro (247 archivos): lo mismo.

## Observaciones (no bloquean)

1. **El SQL cambió después de la revisión.**
   - Los tres revisores aprobaron la `7ad7ea72` (`4815b3cb…e7ff`), y el de SQL
     ató su aprobación a ese SHA-256.
   - La de ahora es la `a58dd22d` (`d4d73024…4e4d`). Solo cambian dos palabras
     dentro de un texto, con la redacción que propusieron dos revisores.
   - Lo que miró el revisor de SQL no cambia: inventario, guarda, transacción,
     idempotencia y permisos.
   - Como pide `CICLO-DIARIO-CATALOGO.md` §5.2, las pruebas se han repetido
     después del cambio: el corrector y yo.
   - El coordinador debe saber que el texto final no lo vio ningún revisor,
     aunque es el suyo. Y **aplicar solo el `d4d73024…4e4d`**.
2. **`comprobar-entrega.mjs` sirve para volver a ensayar hasta el 18/11.**
   - El 19/11 falla en el paso «antes de aplicar, PGlite enseña lo mismo que
     se leyó hoy como visitante».
   - Ese día la `24b5f7de` ya ha caducado (su último día es el 18/11), y la
     vista tapa sus cifras («disponible_es» sale vacío).
   - No es un fallo del SQL: la guarda acepta el lote hasta el 19/11.
   - Si hubiera que volver a ensayar ese día, hay que leer otra vez lo
     publicado y comparar con esa lectura.
3. **El binario de gitleaks no estaba en la ruta que pasa el flujo**
   (`…/entrega-1211/gitleaks/gitleaks`). Lo puse yo, sacado del paquete
   comprobado contra `ci.yml`, igual que el 11/11. Conviene que el flujo deje
   el binario en esa ruta o use la del paquete.
4. **Historia de la rama remota.**
   - La rama local coincide con `origin/claude/sharp-babbage-m3bbbw` en
     `7af410e`: el recorte de la O1 ya está subido.
   - Pero los cuatro nombres siguen en el commit `1b632af` de esa rama.
   - Si el PR se une con *squash* y se borra la rama, no llegan a `main`.
     Reescribir la historia necesita permiso del responsable del proyecto.
5. **Fuera de esta entrega.**
   - En carpetas de ciclos anteriores que ya están en `main`
     (`2026-11-03.3-v2` y `2026-11-05-v2`) hay cuatro copias de folletos de
     Backed con nombres de sus consejeros. Uno de ellos coincide con uno de los
     de la O1.
   - No es parte de esta entrega ni lo pidió ningún revisor. Lo decide el
     coordinador.

## Lo que queda (no lo hace el verificador)

- **El coordinador:**
  - el commit de este archivo y de los tres que el corrector dejó sin commit;
  - el traspaso en `docs/tareas/PARA-CODEX.md`;
  - los puntos 3, 4 y 6 del §6 del informe;
  - dejar escritas en DECISIONES, para la próxima vez, las interpretaciones
    de hoy (Smart Cash, «Orden de venta de menor importe» y el libro de órdenes
    re-fechado).
- **Antes de aplicar.** Hay que hacerlo antes del 19/11/2026, con margen,
  porque la guarda usa la fecha en UTC:
  - confirmar que el SHA-256 de `aplicar-y-aprobar.sql` sigue siendo
    `d4d73024…4e4d`;
  - volver a leer como visitante: tiene que seguir publicada la
    `24b5f7de-2834-3e15-6ae4-62a6d9565161`;
  - aplicar solo ese archivo, nunca `catalogo.sql`.
- **Después de aplicar**, en este orden:
  - guardar la lectura pública en `lectura-despues-de-aplicar/` antes de
    `npm test`;
  - `sincronizar.js`;
  - `despues-de-aplicar.mjs`: se espera «43 de 44» y `transparencia.json` en
    `ae3ed55e…9f62`;
  - `volcar-seed.js`, `transparencia.mjs` y `rwadar-fichas.js`;
  - `npm test`;
  - publicar la web y **enviar la OTA**, porque la app lleva
    `transparencia.json` dentro (mínimos y el motivo de Hausera).
- **Spiko:** si hubiera que regenerar el SQL después de las 18:00 UTC del
  12/11, volver a leer su API pública.
- **Hausera:** mirarla el 18/11, día en que abre la preventa (09:00).

## Dónde están las pruebas

Todo está en
`/tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/entrega-1211/verificador/`:

- `huellas-inicio.txt`, `huellas-antes-de-escribir.txt` y
  `huellas-final.txt`: las dos carpetas al empezar, antes de escribir este
  archivo y al terminar;
- `sql_auditoria.py`, `sql-auditoria-aplicar.out` y
  `sql-auditoria-catalogo.out`: el inventario y los diffs normalizados;
- `prep0.sha`, `prep1.sha`, `prep2.sha`, `prep1.out` y `prep2.out`;
- `comprobar.out`, `rest-exportado/`, `reloj.cjs` y
  `comprobar-2026-11-1*.out`;
- `o1-del-informe.py`, `o1-prueba/`, `barrido_o1.py` y `a-git-entrega.txt`;
- `sin-red.sh`, `subir-lo.py`, `ensayo-verificador.sh` y
  `ensayo-verificador.log`;
- `despues-0.out`, `despues-revisado.out`, `despues-1.out`, `despues-2.out`,
  `transparencia-*.json`, `sincronizar.out`, `volcar.out`,
  `transparencia.out` y `fichas.out`;
- `npm-test.log` (la pasada con la firma del entorno) y `npm-test-2.log`;
- `lo-esencial-app.cjs` y `lo-esencial-verificador*.json`;
- `escaneo-gitleaks/`, `escaneo-head/`, `gitleaks-ci.log` y
  `gitleaks-informe.json`.

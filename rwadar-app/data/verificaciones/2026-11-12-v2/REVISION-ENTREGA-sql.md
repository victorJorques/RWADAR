# Revisión independiente de SQL e integridad · entrega 2026-11-12

**Veredicto: `aprobado`. Sin correcciones obligatorias.** El SQL hace lo que se
pidió y nada más: inserta la revisión nueva en `rwadar_catalogo` y la aprueba al
final, en una sola transacción serializable con guarda. No toca
`public.plataformas` ni `public.fuentes`, ni usuarios, Auth, RLS, permisos,
funciones o esquema. Cada diferencia con la publicada sale de DECISIONES, de
los expedientes o de una corrección obligatoria de un revisor (§4; tres de
ellas están en DECISIONES solo de forma implícita y conviene dejarlas
escritas). `despues-de-aplicar.mjs` no pone la fecha de hoy a ninguna
comprobación que no se haya repetido hoy. En lo que va a Git no hay secretos
ni nombres de terceros.

Se puede aplicar **tal cual** (SHA-256 `4815b3cb…e7ff`). La aprobación vale
solo para ese SHA-256. Si el coordinador acepta algún punto que cambie el SQL
(el §6.4 del informe del montador, las participaciones en venta), hay que
regenerar, repetir las pruebas y repetir esta revisión.

Datos de la entrega:

- Revisión nueva: `7ad7ea72-d18e-4833-9f36-38f4a7ceaf25`
  (huella `7ad7ea72d18e48339f3638f4a7ceaf25fd3de7ed3f73cff8d30d0d294ca43474`).
- Guarda sobre la publicada: `24b5f7de-2834-3e15-6ae4-62a6d9565161`
  (huella `24b5f7de28343e156ae462a6d9565161d49d251cb45b9422b208c0fb0bceec22`),
  entrega 2026-11-11. Un visitante la leyó publicada hoy a las 00:30 UTC
  (`lectura-publica/`).
- **SHA-256 de `aplicar-y-aprobar.sql`: `4815b3cb3c63501f3fb69fa3b0ac0318d9c32210d88539cfb7742254f667e7ff`.**
  Es el mismo en la carpeta de trabajo y en `HEAD` (`523f89e`, el commit
  local del coordinador de las 01:27 UTC, que ya lleva esta entrega).
- SHA-256 de `catalogo.sql`: `71b126d075130aa5e09526502834b35f91bab42ea17eac92f2af3a05162d3fc6`.
  SHA-256 de `revision.json`: `3ac28c31a640b8dc5467f38013da5685fbe63a00ee91715eeefe073bd9b62c38`.
- Fichas verificadas el 12/11 con 7 días: el último día vigente es el
  **19/11/2026**. La guarda rechaza el lote desde el 20/11 (fecha UTC).
- Revisor: Claude, revisión independiente de SQL e integridad, 12/11/2026, de
  01:28 a 01:55 UTC. No monté esta entrega. Todo lo que se ejecuta lo hice en
  una copia aparte
  (`/tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/entrega-1211/revisor-sql/copia`,
  un `git clone` de esta carpeta en `523f89e`). En la carpeta de trabajo solo
  he escrito este archivo.

## 1. Qué ejecuté y qué salió

| Paso | Resultado |
|---|---|
| Copia aparte (`git clone` en `523f89e`, `node_modules` enlazados) | Los 243 archivos de la entrega y del ciclo, idénticos a la carpeta de trabajo, salvo dos CSV de fuentes que Git guarda con saltos LF (§6, recomendación 9). `preparar-entrega.mjs` no los lee. |
| `preparar-entrega.mjs`, **dos veces seguidas** (01:29:12–01:29:13 UTC), solo con lo que hay en Git | exit 0 las dos. Las 8 salidas tienen el mismo SHA-256 en las dos ejecuciones y **el mismo que en el repositorio**: `radar-canonico-26.json` 0c9ca7db…5ac1, `escaparate-publicacion.json` 06212b6a…2ab3, `documentacion-ofertas.json` 27a8db3f…f858, `manifiesto-catalogo.json` c2c51919…4224, `contraste-2026-11-12.json` cf479743…9dd9, `catalogo.sql` 71b126d0…3fc6, `aplicar-y-aprobar.sql` 4815b3cb…e7ff, `revision.json` 3ac28c31…2c38. Salida: `{"revisionId":"7ad7ea72-…","previa":"24b5f7de-…","sha256":"4815b3cb…e7ff","plataformas":25,"fuentesRadar":69,"ofertas":22,"colecciones":{"principales":8,"secundario":13,"en_camino":1},"cambios":83,"noAplicado":10}`. |
| `comprobar-entrega.mjs --exportar=DIR` (01:29:18–01:29:39 UTC) | exit 0 en 21 s, «resultado: correcto», 19 comprobaciones y 6 casos de fallo. Repetido sin `--exportar` sobre la copia limpia (01:48:22–01:48:43): exit 0, 18 + 6. Su informe es igual al `pruebas-locales.json` del repositorio salvo la hora y la ruta de la exportación. |
| Inventario propio de los dos SQL | Un analizador que separa las sentencias respetando comentarios, cadenas y bloques `$…$`, y mira lo que queda **fuera** de las cadenas. Además, la cuenta del propio servidor (PGlite ejecuta el archivo y da una respuesta por sentencia) y las filas que escribe cada una. §2. |
| Prueba propia en PGlite con la cadena de `comprobar-entrega.mjs` (seed de antes de ARTEX, migraciones del catálogo y 16 lotes hasta la 2026-11-11) | Huella de **todas** las tablas y secuencias (38 en 6 esquemas) y del catálogo del sistema (funciones, disparadores, políticas, permisos, columnas, restricciones, índices, tipos, esquemas, roles, pertenencias, privilegios por defecto, vistas y extensiones), antes y después. Aplicarla dos veces, aplicar solo `catalogo.sql`, tres errores forzados y una comparación columna a columna con la `24b5f7de`. §2 y §3. |
| Prueba propia con las migraciones 30 y 31 (avisos, en producción desde el 06/11) | 52 tablas y secuencias en 9 esquemas. §2. |
| Cinco casos de la guarda que `comprobar-entrega.mjs` no ensaya, y los cuatro límites de fecha **con el reloj de PGlite movido** y los bytes del SQL sin tocar | §3. |
| Comparación campo a campo con `2026-11-11-v2/` | De `escaparate-publicacion.json` y `documentacion-ofertas.json`, emparejando avisos, métricas y referencias por su texto o su etiqueta (no por la posición). §4. |
| «Después de aplicar», en la copia, con lo que exporté de PGlite | `despues-de-aplicar.mjs` antes y después de sincronizar, `sincronizar.js`, `volcar-seed.js`, `transparencia.mjs` y `rwadar-fichas.js`. Cada fecha de hoy, comprobada contra el expediente. §5. |
| gitleaks 8.30.1 con `rwadar-app/gitleaks.toml` y las mismas opciones que `ci.yml` | El paquete del scratchpad tiene el SHA-256 que fija `ci.yml` (551f6fc8…70eb). No descargué nada. §6. |
| Al terminar | `git status` de la carpeta de trabajo: limpio salvo este archivo. El SHA-256 del SQL y el de `transparencia.json` (81e78ab9…3808) no han cambiado. |

No repetí `npm test`: lo pasó el montador en su copia, y no depende del SQL.

## 2. Inventario de las sentencias

### `aplicar-y-aprobar.sql`: 288 sentencias, una sola transacción

El servidor también cuenta **288** (PGlite da una respuesta por sentencia).

| Orden | Sentencia | Tabla | Cuántas | Qué hace |
|---|---|---|---|---|
| 1 | `begin isolation level serializable` | — | 1 | Abre la transacción. Es el único `begin`. |
| 2 | `do $guarda$` | Lee `rwadar_catalogo.publicacion_v2` (`for update`), `rwadar_catalogo.revisiones` y `public.catalogo_publicacion` (`for update`) | 1 | Solo lee y, si algo falla, lanza un error. Detalle en §3. |
| 3 | `insert … on conflict (id) do nothing` | `rwadar_catalogo.revisiones` | 1 | La revisión nueva, en borrador, verificada el 12/11. |
| 4 | `insert … on conflict (revision_id,id) do nothing` | `rwadar_catalogo.fuentes` | 69 | Las 69 fuentes del radar, consultadas el 12/11. |
| 5 | `insert … select … from public.plataformas where slug=… on conflict (revision_id,plataforma_id) do nothing` | `rwadar_catalogo.plataformas` | 25 | Lee `public.plataformas` sin escribir en ella. |
| 6 | `insert … select … from public.plataformas … on conflict do nothing` | `rwadar_catalogo.plataforma_fuentes` | 107 | Igual. |
| 7 | Igual | `rwadar_catalogo.alertas` | 25 | Igual. |
| 8 | Igual | `rwadar_catalogo.alerta_fuentes` | 35 | Igual. |
| 9 | `insert … on conflict (revision_id,slug) do nothing` | `rwadar_catalogo.ofertas` | 22 | 8 principales, 13 de reventa y 1 en camino, verificadas el 12/11 con 7 días. Estados: 7 `actual`, 1 `fuentes_en_conflicto` (mTBILL) y 14 `no_verificable`, como ayer. |
| 10 | `do $aprobar$` | Cuenta filas en `rwadar_catalogo` y hace **un** `update rwadar_catalogo.revisiones set estado = 'aprobada' … where id = v and estado = 'borrador'` | 1 | Exige 25/22/8/13/1, que la vista `revision_publicable_v2` acepte la revisión y que el puntero quede en la nueva. Si no, error y se deshace todo. |
| 11 | `commit` | — | 1 | |

- **Filas que escribe cada sentencia** (la primera vez): el `begin`, la guarda,
  la aprobación y el `commit`, 0; cada uno de los 284 inserts, **exactamente
  1**. La segunda vez, 0 en todas.
- **Fuera de las cadenas** solo hay nombres de columnas, tipos (`uuid`, `date`,
  `jsonb` y los enumerados de `rwadar_catalogo`), `select … from
  public.plataformas where slug = …` y `on conflict … do nothing`. Ninguna
  llamada a funciones. El único uuid de los inserts es el de la revisión nueva,
  y los 284 empiezan por él.
- No hay DDL, `delete`, `truncate`, `grant`, `revoke`, políticas, funciones ni
  `set role`. Nada en `auth`, `storage` ni `vault`.
- **Bytes:** UTF-8 válido, saltos LF, sin BOM, sin retornos de carro, sin
  caracteres de control ni invisibles; termina en `commit;`. El blob de Git
  tiene el mismo SHA-256 (`.gitattributes`: `eol=lf`).
- **Direcciones:** 212 distintas, las mismas que en la 2026-11-11 (ni una nueva
  ni una menos), todas `https`.
- **Barras invertidas:** 138, todas escapes JSON (`\"`) dentro de los `jsonb`,
  las mismas que ayer. Si `standard_conforming_strings` estuviera apagado, el
  `jsonb` fallaría y se desharía todo: no hay corrupción silenciosa posible.

### Frente al SQL publicado (2026-11-11)

- Las 284 sentencias tienen **el mismo esqueleto** fuera de las cadenas que
  las de ayer, una a una.
- `plataformas`, `plataforma_fuentes`, `alertas` y `alerta_fuentes`: iguales
  byte a byte salvo el id de la revisión. `fuentes`: iguales salvo el id y la
  fecha de consulta. `revisiones`: cambian el id, la huella y la fecha (también
  en el texto de origen, que por lo demás es el de ayer).
- `ofertas`: cambian las 22 (§4).
- La guarda y la aprobación son las de ayer línea a línea. Solo cambian los
  identificadores, las huellas, las fechas (12/11 y 19/11) y la fecha del texto
  de la aprobación, que no lleva nombres de personas («el responsable del
  proyecto»).

### Lo que cambia de verdad en la base (PGlite, 38 tablas y secuencias)

| Tabla | Antes → después | Por qué |
|---|---|---|
| `rwadar_catalogo.revisiones` | 16 → 17 filas | Insert y aprobación. La `24b5f7de` sigue aprobada. |
| `rwadar_catalogo.plataformas` | 411 → 436 | +25 |
| `rwadar_catalogo.ofertas` | 425 → 447 | +22 |
| `rwadar_catalogo.fuentes` | 1.100 → 1.169 | +69 |
| `rwadar_catalogo.plataforma_fuentes` | 1.730 → 1.837 | +107 |
| `rwadar_catalogo.alertas` | 411 → 436 | +25 |
| `rwadar_catalogo.alerta_fuentes` | 571 → 606 | +35 |
| `rwadar_catalogo.publicacion_v2` | 1 → 1 | El puntero pasa a la `7ad7ea72`. Lo mueve el disparador `fijar_publicacion_v2`: es la publicación. |
| `public.catalogo_publicacion` | 1 → 1 | El disparador `sincronizar_publicacion_catalogo` deja `retirado = false` y `motivo = null`, como estaban. Solo cambia `actualizado_el`. |

- No cambia nada más: ni las otras 29 tablas y secuencias (`auth`, `cron`,
  `net`, `vault` y el resto de `public`, incluidas `plataformas`, `fuentes`,
  `cambios_estado`, los avisos y las emisiones), ni nada del catálogo del
  sistema.
- **Columna a columna** frente a la `24b5f7de`: en `ofertas` solo cambian
  `verificada_el` (22), `avisos` (22), `documentacion` (22), `metricas` (5:
  mTBILL, Smart Cash, Aktionariat, Boss Info y Switzerlend) y `rentabilidad`
  (1: el literal de Smart Cash). Ninguna cambia de colección, estado,
  dirección, título, resumen, precio ni disponibilidad. En `fuentes` solo
  cambia `consultada_el`. Las otras cuatro tablas, idénticas.
- La vista pública pasa de la `24b5f7de` (verificada el 11/11) a la `7ad7ea72`
  (verificada el 12/11), con 25 plataformas y 22 ofertas.
- **Aplicada dos veces**, la segunda no escribe ninguna fila ni cambia nada.

### Con las migraciones 30 y 31 instaladas, como en producción

52 tablas y secuencias en 9 esquemas. Los tres disparadores de
`rwadar_catalogo.revisiones` están activos (`avisar_ofertas_nuevas`,
`fijar_publicacion_v2` y `sincronizar_publicacion_catalogo`) y no hay otros en
`rwadar_catalogo`. Los avisos están apagados (`ofertas_automaticas`, correo,
push y casilla en `false`).

El lote se aplica sin error y sin avisos del servidor. Queda publicada la
`7ad7ea72`. Hay **0 → 0 anuncios** (no hay altas) y cambian las mismas 9 tablas
de arriba y ninguna más.

### `catalogo.sql`: 286 sentencias

Un `begin` (sin serializable), los mismos 284 inserts **byte a byte** y un
`commit`. No lleva guarda ni aprobación. En PGlite deja la revisión en
borrador, y lo publicado (`24b5f7de`) y la vista pública no cambian. Solo sirve
para importar un borrador; nunca para publicar.

## 3. La guarda

| Exigencia | Qué hace el SQL | Probado |
|---|---|---|
| Publicada exacta | Si `actual is null or actual not in ('24b5f7de…', '7ad7ea72…')`, error. Acepta la nueva solo para poder repetir sin efecto. | Con la publicada `dfdc4c85` falla (comprobar). Sin puntero (`publicacion_v2` vacía), «Publicación distinta… <NULL>» (mío). |
| Huella y estado | Si la publicada es la `24b5f7de`, exige `contenido_sha256 = '24b5f7de2834…bceec22'` y `estado = 'aprobada'`. | Con otra huella falla (comprobar). Con la `24b5f7de` retirada, «no tiene la identidad prevista o no está aprobada» (mío). |
| Catálogo no retirado | `retirado is distinct from false` da error. También si falta la fila. | Con el catálogo retirado falla (comprobar). Sin fila de control, «Catálogo retirado o control ausente» (mío). |
| Fechas | `current_date < date '2026-11-12'` da «Revisión futura». `current_date > date '2026-11-19'` da «Lote caducado: sus fichas valían hasta el 19/11/2026». | **Con los bytes del SQL sin tocar y el reloj de PGlite movido** (la cadena montada el 11/11 a las 16:50 UTC, como en producción): el 11/11 a las 23:59:50 UTC, «Revisión futura»; el 12/11 a las 00:00:05 y el 19/11 a las 23:59:50, se aplica y queda publicada; el 20/11 a las 00:00:05, «Lote caducado…». |
| Destino | Si la `7ad7ea72` ya existe con otra huella o retirada, error. | Con otra huella falla (comprobar). Con su huella pero retirada, falla (mío). |
| Destino aprobado pero no publicado | No está en la guarda: lo para la aprobación. | Con la `7ad7ea72` ya aprobada y el puntero devuelto a la `24b5f7de`: «Entrega no publicable: se deshace la transacción completa» y nada cambia (mío). |
| Serializable | `begin isolation level serializable` y `for update` sobre el puntero y sobre el control del catálogo. Si otra herramienta los cambia a la vez, Postgres da error de serialización o espera, y no se aplica nada a medias. | No se puede ensayar en PGlite (una sola conexión). Es la misma forma que se aplicó ayer en producción. |
| No deja nada | Cualquier error deshace la transacción entera. | No cambia ninguna tabla ni secuencia en ninguno de estos casos: los 6 de comprobar; los 7 míos de esta tabla que fallan; tres errores forzados (justo antes del `commit`, a mitad de los inserts y una colección que la base rechaza); y una rentabilidad en mTBILL (§4.4). |
| Ya importada como borrador | El aplicador la aprueba sin duplicar filas. | Comprobar. |

- El flujo «Aplicar catálogo» solo corre desde `main` y usa
  `psql -v ON_ERROR_STOP=1 -X -q -f`, sin `-1`. Así respeta el `begin` del
  archivo y, si algo falla, se para y la conexión se cierra sin `commit`. Antes
  hace una copia cifrada de la base.
- `current_date` va en UTC en Supabase: la guarda acepta el lote hasta la 01:00
  (hora de Madrid) del 20/11.
- El puntero lo mueve el disparador a la revisión aprobada más reciente
  (`aprobada_el`). En producción la `24b5f7de` se aprobó el 11/11 por la tarde,
  así que cualquier aplicación desde hoy queda por delante.

## 4. Diferencias con la publicada, campo a campo

Comparé cada hoja de `escaparate-publicacion.json` y de
`documentacion-ofertas.json` con las de `2026-11-11-v2/`: cada oferta y cada
plataforma por su slug, y los avisos, métricas y referencias por su texto o su
etiqueta. Cambian **589 hojas solo de fecha** (el valor de antes con 11/11 →
12/11 da el de ahora) y **72 de contenido**.

Los 22 slugs y las 25 plataformas son los mismos, en el mismo orden y con las
mismas claves. No cambian las fuentes de las ofertas ni las de las fichas, las
descripciones, los resúmenes, las colecciones, los estados ni las imágenes.
Referencias: 469 → 478 (+11 «Orden de venta de menor importe», −2 de mTBILL).

### 4.1 Lo que cambia en todas (DECISIONES §1)

- `verificadaEl` (22) y `revisadaEl` (22) pasan al 12/11, con 7 días.
- Los 133 avisos publicados pasan a `verificadaEl` 12/11, y los 12 nuevos
  nacen con esa fecha (145 en total). Cada aviso publicado está, tal cual o con
  su dato del día, en la propuesta del expediente de hoy.
- Los 63 datos de tarjeta (3 en cada una de las 21 fichas que los tienen;
  mTBILL no tiene) pasan a consulta del 12/11. **He comprobado los 63:** cada
  uno tiene su misma dirección leída hoy en el expediente, con hora (de 00:33 a
  00:38 UTC).
- Plataformas: los 25 `verificadoEl` y las 142 fechas de consulta de sus
  fuentes pasan al 12/11 (radar 69/69). Nada más.

### 4.2 Por ficha

| Ficha | Qué cambia, además de las fechas | ¿Dónde está? |
|---|---|---|
| Spiko Letras Euro y Dólar | Nada. El literal sigue «consultado el 11/11/2026» (mismos ficheros de la API). | DECISIONES §2 («sin cambios») |
| Spiko Smart Cash | 2,84 % con la VL del 11/11: la métrica «… · 11/11/2026», la fecha del dato de «Rendimiento neto publicado» y el literal. El literal y el alcance de esa referencia usan la explicación nueva del expediente («Tipo que publica Spiko…; la web lo presenta como el tipo que paga cada día el banco con el que el fondo tiene el swap»). | DECISIONES §2 da la cifra, la métrica y las fechas; la explicación es la del expediente, que el revisor confirma («actualizar (fecha y explicación)»). Ver §4.3. |
| mTBILL | Métrica nueva «Rentabilidad pasada · 5 semanas hasta el 10/11/2026 · en USD: 3,45 % anual», aviso nuevo con la ventana (texto exacto) y fuera «APY observado 3,41 %» y «3,42 % · 7D APY». Sigue en `fuentes_en_conflicto`, con `rentabilidad` en `null`. | DECISIONES §2. El campo, en §4.4. |
| Aktionariat | «Precio del emisor · 12/11/2026», «Supervisor (12/11/2026)» y el aviso «6,20 ZCHF frente a 7,25 CHF el 12/11/2026». Tarjeta igual. | DECISIONES §2 |
| Boss Info | «Supervisor», el aviso «venta más barata 8,40 ZCHF el 12/11/2026», el mínimo «… (unos 17 ZCHF el 12/11)» y «Última operación · 12/11/2026» con la fuente `https://shares.bossinfo.com/` y el alcance de la C1. | DECISIONES §2 y C1 del revisor de Suiza |
| Switzerlend | Los dos avisos con dato del día, «Supervisor» y el mínimo «1 acción (68,01 CHF el 12/11)». | DECISIONES §2 |
| Brickwise (11) | **Mínimos:** Cohotel 110 → 102 €, GreenPoint 100 → 102 €, Pottendorfer 73 → 80 €; las otras 8, solo la fecha. **Aviso común nuevo** en las 11 (texto exacto), antes del de «Los precios y el libro de órdenes cambian a diario». **Referencia nueva** «Orden de venta de menor importe · 12/11/2026» en las 11, con el 1,5 % bien redondeado (96,43, 100,49 y 116,73 €; los otros 8 importes, comprobados a mano). **Libro de órdenes** con la lectura de hoy (00:32–00:35 UTC): «Venta más barata» (11; cambia el valor en las 3 de arriba), «Mejor oferta de compra» (11, mismo texto) y «Participaciones en venta» (7, misma cifra). | DECISIONES §2; la referencia nueva y el libro re-fechado, ver §4.3 |
| Hausera | El aviso «El 12/11/2026 Alicante 3 aún no estaba inscrita…», el mínimo «… (12/11)…» y «Historial publicado · 12/11/2026». Las fechas que son hechos («financiada el 10/11/2026…») se quedan. | DECISIONES §2 (solo lo consultado hoy: ERIR a las 00:33, documento a las 00:35:22, portada a las 00:39:52) |
| Robinhood, Kraken y Prosegur | Solo las fechas. | DECISIONES §2 |

Fuera de las fichas cambian la `notaOrigen` y la `actualizacionLocal` del
escaparate. Son datos locales: no van en el SQL.

### 4.3 Lo que no está escrito tal cual en DECISIONES

Ninguna diferencia carece de respaldo, pero tres solo están en DECISIONES de
forma implícita. Las doy por buenas y recomiendo dejarlas escritas
(recomendación 3):

1. **«Orden de venta de menor importe · 12/11/2026» en las 11 de Brickwise.**
   DECISIONES dice «Importes con el 1,5 %, donde aparezcan». Solo aparecen
   ahí, y el revisor de Brickwise lo dice expresamente: «Hoy se añade en la
   ficha la “Orden de venta de menor importe … con el 1,5 %”». Las 11 cifras
   coinciden con el libro de hoy.
2. **La explicación nueva del literal de Smart Cash** (y el alcance de su
   referencia). DECISIONES cita solo las fechas. El literal es el del
   expediente, byte a byte, y el revisor lo confirma. Re-fechar el publicado
   sería falso: «lo que creció el fondo en su último día» con la VL del 11/11
   no da 2,84 %.
3. **Las referencias del libro de órdenes re-fechadas al 12/11**, con la hora
   de la lectura de hoy en el alcance. DECISIONES dice «Las otras 8 mantienen el
   precio y solo cambia la fecha». El script comprueba orden a orden que cada
   texto re-fechado sigue siendo exacto en el libro de hoy.

### 4.4 Lo que el montador no aplicó tal cual

Mi opinión, punto por punto (los 10 de `noAplicado`):

1. **Spiko Letras, literal.** De acuerdo: DECISIONES dice «sin cambios».
2. **Smart Cash, forma del literal.** De acuerdo (§4.3, punto 2).
3. **mTBILL, campo `rentabilidad`.** De acuerdo, y no hay otra salida. Lo probé:
   con `rentabilidad` puesta en mTBILL, la base rechaza la oferta
   («violates check constraint "oferta_bloqueada_sin_cifras"») y se deshace la
   transacción entera. Por eso la cifra va como métrica, que la vista pública
   tapa mientras dure el conflicto. El aviso nuevo sí se ve. En lo exportado
   de PGlite, mTBILL sale con «Cifras pendientes de nueva revisión», `null` y
   7 avisos, sin APY.
4. **Participaciones en venta de 4 fichas.** De acuerdo: siguen con su valor y
   su fecha (Cohotel 65, GreenPoint 351 y Pottendorfer 107 del 11/11;
   Schwarzer Weg 300 del 10/11), ciertas con ella. Cambiarlas cambia el SQL.
5. **Tres textos del libro con otra redacción.** De acuerdo.
6. **«Orden de venta de menor importe».** De acuerdo (§4.3, punto 1).
7. **Mínimo corto de Hausera.** De acuerdo: el documento se releyó hoy (mismo
   SHA-256) y así la tarjeta y la ficha llevan la misma fecha. No toca el SQL.
8. **Propuestas fuera de DECISIONES** (fuentes nuevas de API, textos nuevos de
   tarjeta). Bien que no entren: el SQL tiene las mismas 212 direcciones.
9. **`cambios-radar.json`.** Corregir su cabecera **no cambia el SQL**. Lo
   probé en la copia: con `"fecha": "2026-11-12"` y una línea más en
   DECISIONES, `preparar-entrega.mjs` da los mismos bytes en las 8 salidas
   salvo `contraste-2026-11-12.json`, que guarda el SHA-256 de esos dos
   archivos.
10. **Commit.** Ya hay uno: `523f89e`.

## 5. `despues-de-aplicar.mjs` y `transparencia.json`

Por orden, en la copia:

1. **Antes de sincronizar:** exit 1, «el catálogo sincronizado no es la
   revisión 7ad7ea72-…». `transparencia.json` no cambia (81e78ab9…3808).
2. **`sincronizar.js`**, con el REST simulado y lo que exporté de PGlite: exit
   0, «25 plataformas verificadas, 5 descartadas y 22 ofertas clasificadas» y
   `rwadar.csv` de 30 filas sin diferencias. Mi exportación es igual a la del
   montador salvo los uuid de las plataformas, que PGlite genera al azar.
3. **`despues-de-aplicar.mjs`:** exit 0. «Comprobaciones de transparencia al
   12/11: 43 de 44» (se queda en el 10/11 la «supervisada» de mTBILL: hoy no se
   releyó la BaFin); «Títulos de puntos fuertes … 11 de 11 pasan al 12/11»; los
   11 mínimos cortos de Brickwise, Switzerlend «1 acción (68,01 CHF, 12/11)» y
   Hausera «Desde 100 € en Alicante 3 (12/11)». `transparencia.json` queda en
   **c4edf956…3ad4, el mismo SHA-256 que da el montador**.
4. **Otra vez:** «Nada que cambiar: ya estaba hecho.», con el mismo SHA-256.
5. **El resto:** `volcar-seed.js`, `02_seed.sql` sin diferencias;
   `transparencia.mjs`, «22 ofertas con transparencia»; `rwadar-fichas.js`,
   «Archivos actualizados: 55».

**Qué cambia en `transparencia.json`** (diferencia completa, hoja a hoja):
`lote`, `revisionCatalogo` y `revisadoEl`; los 22 `verificadaEl`; 21 fechas de
`supervisada` y 22 de `documentoEspana`; 13 `minimoCorto` (11 de Brickwise,
Switzerlend y Hausera); y los 11 títulos «Brickwise · mercado de reventa en la
app (12/11/2026)». Nada más.

**He comprobado una a una las 54 fechas de hoy** (43 comprobaciones y 11
títulos). Cada una tiene en el expediente de hoy la misma dirección y una
lectura con hora del 12/11 (un registro, un documento descargado de nuevo o una
afirmación con `consultadoUtc`). Ninguna se apoya solo en
`cambiosRespectoPublicado`. Por ejemplo:

- **Brickwise:** el registro 5003 de la CNMV a las 00:33:22 (las 11
  `supervisada`), cada PDF entre las 00:33:15 y las 00:33:22 (las 11
  `documentoEspana`) y el libro de la app a las 00:35:06 (los 11 títulos).
- **Spiko:** la CNMV a las 00:33:12, el KID a las 00:33:22–00:33:23 y la ficha
  de la SICAV a las 00:33:08 (Smart Cash).
- **Robinhood** 00:33:23–00:33:31; **Kraken** 00:33:27 y 00:33:54;
  **Prosegur** 00:33:10 y 00:38:23–00:38:38; **Aktionariat** 00:34:46 y
  00:35:03; **Boss Info** 00:36:21 y 00:36:31; **Switzerlend** 00:38:09;
  **Hausera** 00:33:36 y 00:35:22.
- **mTBILL, `documentoEspana`:** las condiciones finales y el KID en español se
  descargaron hoy a las 00:33:24 (mismos SHA-256 que ayer), desde el CDN de
  GitBook, y hoy se comprobó también ESMA y la CNMV. La página
  `docs.midas.app` que figura como dirección dio 403 hoy. La comprobación sí se
  repitió hoy; solo cambió el camino (recomendación 7).

Se queda con su fecha la `supervisada` de mTBILL (BaFin, 10/11): en el
expediente de hoy no hay ninguna lectura de la BaFin. Está bien así.

Los mínimos cortos con fecha del 12/11 salen de datos leídos hoy: el libro de
Brickwise (00:32:59 por la API y 00:35 en la app), `/invest` de Switzerlend
(00:37:14) y el documento de Hausera (00:35:22). Los de Boss Info y Aktionariat
no llevan fecha.

**Conclusión: no pone la fecha de hoy a ninguna comprobación que no se repitió
hoy.**

## 6. Datos personales y escáner de secretos

### Lo que ya está en Git (`HEAD` `523f89e`, con toda la carpeta del ciclo)

- **gitleaks** sobre el contenido de `HEAD` (`git archive`, 4.678 archivos,
  145,6 MB): «no leaks found».
- **Archivos:** ningún PDF, HTML, imagen, `crudo/`, `.json.gz` ni
  `.inventario.jsonl` en Git. Los 243 archivos del ciclo son 130 `.txt`, 87
  `.json`, 13 `.md`, 4 `.mjs`, 2 `.sql`, 2 `.csv`, 2 `.tsv`, 1 `.xml`, 1 `.cjs`
  y el `.gitignore`.
- **El SQL y lo generado hoy** (escaparate, documentación, contraste, radar,
  informe, pruebas, ensayo y scripts) no llevan correos, teléfonos, IBAN, DNI o
  NIE, JWT ni prefijos de claves conocidos. Tampoco nombres de personas: frente
  a los mismos archivos de ayer no aparece ningún nombre propio nuevo.
- **Lo que sí lleva el SQL:** las tres direcciones públicas de los contratos de
  token de Aktionariat, Boss Info y Switzerlend (las de ayer) y sus UID de
  empresa. El texto de Boss Info en «Salida · consulta 01/11/2026» es solo la
  primera frase; el correo personal que trae la API está únicamente en `crudo/`
  (en los expedientes sale «[correo recortado]»).
- **Direcciones de cadena en las copias del ciclo:** todas son de contratos
  (tokens, Brokerbot, mercados entre accionistas, el oráculo, el feed y la
  bóveda de mTBILL y los tokens de Hausera en Polygon), más la dirección cero en
  respuestas de cadena. Ninguna cartera de una persona. El resumen del libro de
  Brickwise que va a Git no lleva carteras.
- **Correos:** solo de empresas y organismos (info@, contacto@, soporte@,
  dpo@, comunicacion@cnmv.es…).
- **Nombres:** en las copias de webs y blogs salen recortados («[nombre
  recortado]», «[persona física recortada]»). «Dr. Grass-Strasse» (Vaduz) y
  «Victory Tower» (Nicosia), en el registro de ESMA, son direcciones.
- **El nombre de pila del responsable del proyecto** aparece en dos documentos
  internos del coordinador: `DECISIONES-COORDINADOR.md` y
  `ENCARGO-INVESTIGADORES.md`. Es como en `AGENTS.md`. No está en el SQL ni en
  los datos públicos (recomendación 10).
- Lo revisado ya está en la rama de trabajo (local y remota, `523f89e`), no en
  `main`.

### Lo que se queda fuera de Git

- gitleaks sobre la carpeta del ciclo entera, también lo que Git ignora:
  1.599 avisos (`generic-api-key`, 2 `gcp-api-key` y 1 `jwt`) en 60 archivos,
  **todos en `crudo/`** (36 JSON, 22 HTML y 2 JS). `git check-ignore` confirma
  que ninguno va a Git. Son los falsos positivos que ya prevé el `.gitignore`
  del ciclo (identificadores, huellas, claves públicas de webs y direcciones).
- **Después de aplicar:** lo que regenera el ensayo (las 52 fichas, el catálogo
  sincronizado de la web, `rwadar-20260820.js`, `sitemap.xml`, `cambios.html`,
  `metodologia.html`, `transparencia.json` y su copia para la app): 59 archivos,
  2 MB, «no leaks found».

## Correcciones obligatorias

**Ninguna.**

## Recomendaciones (no bloquean)

1. **Antes de aplicar:** confirmar que en `main` el SHA-256 de
   `aplicar-y-aprobar.sql` sigue siendo `4815b3cb…e7ff`; volver a leer como
   visitante (tiene que seguir publicada la `24b5f7de`); aplicar solo ese
   archivo con «Aplicar catálogo», nunca `catalogo.sql`; hacerlo hoy mejor que
   al final de la ventana (vale hasta el 19/11 en UTC).
2. **`comprobar-entrega.mjs` deja de funcionar el 13/11.** Su cadena aplica los
   lotes reales y la guarda del `2026-11-05` caduca el 12/11. Lo probé con el
   reloj de PGlite: el 12/11 a las 23:00 se monta; el 13/11, el 18/11 y el
   19/11 falla en el `2026-11-05` («Lote caducado: sus fichas valían hasta el
   12/11/2026»). No afecta al SQL. Solo importa si hay que regenerar o volver a
   ensayar a partir del 13/11. El arreglo es el que ya usa
   `probar-avisos-registrados.mjs` (`loteReal`): en `base()`, cambiar
   `for (const f of LOTES) await db.exec(fs.readFileSync(…, 'utf8'));` por
   ```js
   for (const f of LOTES) await db.exec(fs.readFileSync(`data/importaciones/catalogo-${f}-v2/aplicar-y-aprobar.sql`, 'utf8')
     .replace(/current_date > date '(\d{4}-\d{2}-\d{2})'/g, `date '${f.slice(0, 10)}' > date '$1'`));
   ```
   Solo en la cadena, nunca en el SQL de hoy, y sin tocar el caso «caducado»
   (que debe seguir usando el tope real). Lo probé en la copia con el reloj en
   el 13/11 a las 09:00 UTC: sin el arreglo, exit 1 («Lote caducado: sus fichas
   valían hasta el 12/11/2026»); con él, exit 0, «resultado: correcto», 18 + 6,
   y el caso «caducado» sigue fallando como debe. Con el reloj de hoy, también
   correcto.
3. **Dejar escrito en DECISIONES** (una línea, no cambia el SQL) lo de §4.3: la
   referencia nueva «Orden de venta de menor importe» en las 11; el literal de
   Smart Cash tomado del expediente; y el libro de órdenes re-fechado con la
   lectura de hoy (salvo las participaciones de §4.4 punto 4). Si se vuelve a
   ejecutar `preparar-entrega.mjs` después, solo cambia
   `contraste-2026-11-12.json`.
4. **Si el coordinador acepta el §6.4 del montador** (participaciones en venta
   de 4 fichas), el SQL cambia: regenerar, `comprobar-entrega.mjs`, el ensayo y
   una nueva revisión de SQL. Mi consejo es dejarlas como están: son ciertas con
   su fecha.
5. **El paso «Leer el lote publicado» del flujo no sirve de prueba.** Ordena por
   id (`order by 1 desc limit 2`) y enseñará la `fab6d2e4` y la `f2be1f5e`, no
   la `7ad7ea72`. La prueba es la lectura pública de las vistas v2, guardada en
   `lectura-despues-de-aplicar/` antes de `npm test`.
6. **`cambios-radar.json`:** su cabecera se puede corregir sin tocar el SQL
   (§4.4, punto 9). Después, volver a ejecutar `preparar-entrega.mjs` para que
   `contraste-2026-11-12.json` guarde el SHA-256 nuevo.
7. **mTBILL, `documentoEspana`:** la fecha del 12/11 es correcta, pero la
   dirección que se enseña (`docs.midas.app`) dio 403 hoy y los documentos se
   bajaron del CDN de GitBook. Si se quiere precisión total, decirlo en el
   expediente o en el motivo. No cambia el SQL.
8. **Expedientes de Brickwise:** siguen diciendo 96,42, 100,48 y 116,72 €, y el
   resumen del libro (`desembolsoMas1_5`) también. El SQL lleva los importes
   bien redondeados. Que nadie copie esas cifras de los expedientes en el
   futuro.
9. **Copias de fuentes con saltos CRLF:** `grupos/principales/fuentes/esma-casps.csv`
   y `ecb-estr-ultimos8.csv` están en disco con CRLF y Git las guarda con LF
   (`* text=auto eol=lf`). El SHA-256 de `inventario-consultas.json` no coincide
   con la copia de Git. Para copias de fuentes, mejor `-text` en
   `.gitattributes` (por ejemplo, `rwadar-app/data/verificaciones/**/fuentes/** -text`).
   No afecta a la entrega.
10. **Nombre del responsable en dos documentos internos del ciclo** (§6). Si la
    regla «ningún nombre de persona en Git» le incluye a él, cambiarlo por «el
    responsable del proyecto». No toca el SQL.
11. **Para lotes futuros:** que la aprobación compruebe también una huella de las
    filas de la revisión nueva (`on conflict do nothing` da por buenas las que
    ya existan); y que `despues-de-aplicar.mjs` no cuente siempre
    `cambiosRespectoPublicado` como lectura de hoy. Hoy no hay riesgo: el id
    sale de la huella del contenido y ninguna fecha depende solo de esa lista.

## Lo que no hice

- No toqué Supabase ni ningún servicio remoto. Para gitleaks usé el paquete que
  ya estaba en el scratchpad, con el SHA-256 de `ci.yml`.
- No publiqué, no lancé flujos de GitHub y no hice commit ni push.
- No ensayé la concurrencia: PGlite tiene una sola conexión.
- No edité expedientes, informes de revisores ni ningún otro archivo. En la
  carpeta de trabajo solo escribí este. Mis guiones y salidas están en
  `/tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/entrega-1211/revisor-sql/`
  (`scripts/`, `inv/`, `prueba-propia.json`, `prueba-guarda-2.json`,
  `columnas.json`, `diferencias.json`, `fuentes-tarjeta.json`,
  `fechas-transparencia.json` y los registros de gitleaks).

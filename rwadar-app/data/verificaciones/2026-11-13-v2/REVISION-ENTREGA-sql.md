# Revisión independiente de SQL e integridad · entrega 2026-11-13

**Veredicto: `aprobado_con_cambios`.** El SQL se puede aplicar **tal cual**
(SHA-256 `7be64e86…6961`): no hay ninguna corrección que lo cambie. Inserta
la revisión nueva en `rwadar_catalogo` y la aprueba al final, en una sola
transacción serializable con guarda. No toca `public.plataformas` ni
`public.fuentes`, ni usuarios, Auth, RLS, permisos, funciones o esquema. Cada
diferencia con la publicada sale de DECISIONES, de los expedientes o de una
corrección obligatoria de un revisor (§4). `despues-de-aplicar.mjs` no pone la
fecha de hoy a ninguna comprobación que no se haya repetido hoy (§5).

El cambio obligatorio está **fuera del SQL**, en lo que va a Git: una copia de
la web de Profitus del grupo de vigilancia todavía lleva el nombre de dos
personas físicas, el correo y el teléfono directo de una de ellas (§6,
corrección C1). Ya está en el commit `cccebe2`, subido a la rama de trabajo
(no a `main`). Arreglarlo no cambia el SQL ni sus pruebas.

La aprobación vale solo para ese SHA-256. Si cambia el SQL (por ejemplo, si
hay que rehacer la entrega porque la orden de 73 € de Pottendorfer ya no
está), hay que regenerar, repetir las pruebas y repetir esta revisión.

Datos de la entrega:

- Revisión nueva: `66907add-8ebf-424b-3e04-b73e47b0c537`
  (huella `66907add8ebf424b3e04b73e47b0c5378fe5bbd6bafab0bc51da08de26f06e36`).
- Guarda sobre la publicada: `a58dd22d-98a3-f94e-ba66-46898162215a`
  (huella `a58dd22d98a3f94eba6646898162215af1ea3d4faefbeaf46e14d9ac18b1ee21`),
  entrega 2026-11-12, leída como visitante hoy de 08:27:43 a 08:27:47 UTC
  (`lectura-publica/`).
- **SHA-256 de `aplicar-y-aprobar.sql`: `7be64e861af7ba2895f07cedbb73a1e85a9dec055412aa27081e20a401d16961`.**
  Es el mismo en la carpeta de trabajo, en el blob de Git de `HEAD`
  (`5641af2`) y en la rama de trabajo remota, que está al día con `HEAD`.
- SHA-256 de `catalogo.sql`: `85ad96a83a7cd5c6bc71a6a59a0a1e9c6e0de16717b740ad44dfaa0f6c33b379`.
  SHA-256 de `revision.json`: `a336306de4b695e180ea7025d5f547f19052c77e8a9513954812c8ba45e787c4`.
- Fichas verificadas el 13/11 con 7 días: el último día vigente es el
  **20/11/2026**. La guarda rechaza el lote desde el 21/11 (fecha UTC; es
  decir, desde la 01:00 del 21/11 en Madrid).
- Revisor: Claude, revisión independiente de SQL e integridad, 13/11/2026, de
  09:24 a 09:45 UTC. No monté esta entrega. Todo lo que se ejecuta lo hice en
  una copia aparte
  (`/tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/entrega-1311/revisor-sql/copia`,
  un `git clone` de esta carpeta en `bed9752`). Mientras revisaba, la
  coordinación hizo el commit `5641af2` (09:26:43 UTC), que solo añade
  `INFORME-ENTREGA.md`, `pruebas-locales.json` y `ensayo-despues.json`: son
  exactamente las versiones que pasé por gitleaks y comparé. En la carpeta de
  trabajo solo he escrito este archivo.

## 1. Qué ejecuté y qué salió

| Paso | Resultado |
|---|---|
| Copia aparte (`git clone` en `bed9752`, `node_modules` enlazados) | Los 222 archivos de la entrega y del ciclo que van a Git, iguales a los de la carpeta de trabajo, salvo los tres que entraron después en `5641af2` y dos CSV de fuentes que Git guarda con saltos LF (recomendación R7). Ningún guion los lee. |
| `preparar-entrega.mjs`, **dos veces seguidas** (09:26:00 UTC), solo con lo que hay en Git | exit 0 las dos, sin nada en la salida de errores y con la misma línea: `{"revisionId":"66907add-…","previa":"a58dd22d-…","sha256":"7be64e86…6961","plataformas":25,"fuentesRadar":69,"ofertas":22,"colecciones":{"principales":8,"secundario":13,"en_camino":1},"cambios":81,"noAplicado":4,"horasRealesSuiza":82}`. Las 8 salidas tienen el mismo SHA-256 antes, tras la primera pasada y tras la segunda, y **el mismo que en la carpeta de trabajo**: `radar-canonico-26.json` 79683038…acc9, `escaparate-publicacion.json` a1bebcc8…f193, `documentacion-ofertas.json` a1cbcb23…4fa9, `manifiesto-catalogo.json` c2c51919…4224, `contraste-2026-11-13.json` c473ab8c…e344, `catalogo.sql` 85ad96a8…b379, `aplicar-y-aprobar.sql` 7be64e86…6961, `revision.json` a336306d…87c4. |
| `comprobar-entrega.mjs --exportar=DIR` (09:26:07–09:26:31 UTC) | exit 0 en 24 s, «resultado: correcto», 19 comprobaciones y 6 casos de fallo. Su informe es **igual** al `pruebas-locales.json` de `HEAD` salvo la hora y la ruta de la exportación. La cadena ya evalúa el tope de fecha de cada lote viejo en su propio día (la recomendación 2 del 12/11 está aplicada), así que el ensayo vale hasta el 20/11. |
| Inventario propio de los dos SQL | Un analizador que separa las sentencias respetando comentarios, cadenas y bloques `$…$`, y mira lo que queda **fuera** de las cadenas. Además, la cuenta del propio servidor (PGlite ejecuta el archivo y da una respuesta por sentencia) y las filas que escribe cada una. §2. |
| Prueba propia en PGlite (09:30:17–09:31:16 UTC) con la cadena de `comprobar-entrega.mjs` (seed de antes de ARTEX, migraciones del catálogo y 17 lotes hasta la 2026-11-12) | Huella de **todas** las tablas y secuencias (38 en 6 esquemas) y del catálogo del sistema (funciones, disparadores, políticas, permisos, columnas, restricciones, índices, tipos, esquemas, roles, pertenencias, privilegios por defecto, vistas, extensiones y ajustes), antes y después. Aplicarla dos veces, solo `catalogo.sql` y luego el aplicador, tres errores forzados y una comparación columna a columna con la `a58dd22d`. §2. |
| Prueba propia como producción: migraciones 30 a 34 y las notificaciones push encendidas | 56 tablas y secuencias en 9 esquemas. §2. |
| Diez casos de la guarda (seis que `comprobar-entrega.mjs` no ensaya y cuatro límites de fecha **con el reloj de PGlite movido** y los bytes del SQL sin tocar) | Los diez, correctos. §3. |
| Comparación campo a campo con `2026-11-12-v2/` | De `escaparate-publicacion.json` y `documentacion-ofertas.json`, emparejando avisos, métricas y referencias por su texto o su etiqueta (no por la posición). §4. |
| «Después de aplicar», en la copia, con lo que exporté de PGlite | `despues-de-aplicar.mjs` antes y después de sincronizar, `sincronizar.js`, `volcar-seed.js`, `transparencia.mjs` y `rwadar-fichas.js`. Cada fecha de hoy, comprobada contra el expediente (y, en las suizas, contra el inventario del grupo). §5. |
| gitleaks 8.30.1 con `rwadar-app/gitleaks.toml` y las opciones de `ci.yml` | Sacado del paquete del scratchpad, que tiene el SHA-256 que fija `ci.yml` (551f6fc8…70eb). No descargué nada. §6. |
| Búsqueda de datos personales en los 222 archivos que van a Git | Correos, teléfonos, cargos junto a nombres y tratamientos. Un hallazgo (C1). §6. |
| Al terminar | `git status` de la carpeta de trabajo: limpio salvo este archivo. El SHA-256 del SQL y el de `transparencia.json` (ae3ed55e…9f62) no han cambiado. |

No repetí `npm test`: lo pasó el montador en su copia y no depende del SQL (la
única prueba que falla, la de noticias de la web, falla igual sin la entrega).

## 2. Inventario de las sentencias

### `aplicar-y-aprobar.sql`: 288 sentencias, una sola transacción

El servidor también cuenta **288** (PGlite da una respuesta por sentencia).

| Orden | Sentencia | Tabla | Cuántas | Qué hace |
|---|---|---|---|---|
| 1 | `begin isolation level serializable` | — | 1 | Abre la transacción. Es el único `begin`. |
| 2 | `do $guarda$` | Lee `rwadar_catalogo.publicacion_v2` (`for update`), `rwadar_catalogo.revisiones` y `public.catalogo_publicacion` (`for update`) | 1 | Solo lee y, si algo falla, lanza un error. Detalle en §3. |
| 3 | `insert … values … on conflict (id) do nothing` | `rwadar_catalogo.revisiones` | 1 | La revisión nueva, en borrador, verificada el 13/11, con 25/22 y 8/13/1 esperadas. |
| 4 | `insert … values … on conflict (revision_id,id) do nothing` | `rwadar_catalogo.fuentes` | 69 | Las 69 fuentes del radar, consultadas el 13/11. |
| 5 | `insert … select … from public.plataformas where slug=… on conflict (revision_id,plataforma_id) do nothing` | `rwadar_catalogo.plataformas` | 25 | Lee `public.plataformas` sin escribir en ella. |
| 6 | `insert … select … from public.plataformas … on conflict do nothing` | `rwadar_catalogo.plataforma_fuentes` | 107 | Igual. |
| 7 | Igual | `rwadar_catalogo.alertas` | 25 | Igual. |
| 8 | Igual | `rwadar_catalogo.alerta_fuentes` | 35 | Igual. Las filas 5 a 8 van por plataforma, en 25 tandas. |
| 9 | `insert … values … on conflict (revision_id,slug) do nothing` | `rwadar_catalogo.ofertas` | 22 | 8 principales, 13 de reventa y 1 en camino, verificadas el 13/11 con 7 días. Estados: 7 `actual`, 1 `fuentes_en_conflicto` (mTBILL) y 14 `no_verificable`, como en la publicada. |
| 10 | `do $aprobar$` | Cuenta filas en `rwadar_catalogo` y hace **un** `update rwadar_catalogo.revisiones set estado = 'aprobada' … where id = v and estado = 'borrador'` | 1 | Exige 25/22/8/13/1, que la vista `revision_publicable_v2` acepte la revisión y que el puntero quede en la nueva. Si no, error y se deshace todo. |
| 11 | `commit` | — | 1 | |

- **Filas que escribe cada sentencia** (la primera vez): el `begin`, la guarda,
  la aprobación y el `commit`, 0; cada uno de los 284 inserts, **exactamente
  1** (284 en total). La segunda vez, 0 en todas.
- **Fuera de las cadenas** solo hay nombres de columnas, tipos (`uuid`, `date`,
  `jsonb` y los enumerados de `rwadar_catalogo`), `select … from
  public.plataformas where slug = …` y `on conflict … do nothing`. Ninguna
  llamada a funciones. El único uuid de los inserts es el de la revisión nueva,
  y los 284 empiezan por él.
- No hay DDL, `delete`, `truncate`, otro `update`, `grant`, `revoke`,
  políticas, funciones ni `set role`. Nada en `auth`, `storage`, `vault`,
  `net` ni `cron`.
- **Bytes:** UTF-8 válido, saltos LF, sin BOM, sin retornos de carro, sin
  caracteres de control ni invisibles; termina en `commit;`. El blob de Git
  tiene el mismo SHA-256 (`.gitattributes`: `eol=lf`).
- **Direcciones:** 212 distintas, las mismas que en la 2026-11-12 (ni una nueva
  ni una menos), todas `https`.
- **Barras invertidas:** 138, todas escapes JSON (`\"`) dentro de los `jsonb`,
  las mismas que ayer. Si `standard_conforming_strings` estuviera apagado, el
  `jsonb` fallaría y se desharía todo: no hay corrupción silenciosa posible.
- **Horas escritas:** solo «08:30–08:33 UTC» (33 veces: la lectura del libro de
  Brickwise de hoy; ayer «00:32–00:35 UTC») y 13:35 / 13:35:35 UTC (la
  operación de Boss Info del 05/11). Ninguna hora copiada de las 00:3x del 13/11
  (las falsas de los expedientes suizos) llega al SQL, al escaparate, a la
  documentación, al radar, al contraste ni a `transparencia.json`.

### Frente al SQL publicado (2026-11-12, `d4d73024…4e4d`)

- Las 288 sentencias tienen **el mismo esqueleto** fuera de las cadenas que
  las de ayer, una a una.
- El `begin` y el `commit`, iguales. `plataformas`, `plataforma_fuentes`,
  `alertas` y `alerta_fuentes` (192 sentencias): iguales byte a byte salvo el
  id de la revisión. `fuentes` (69): iguales salvo el id y la fecha de
  consulta. `revisiones`: cambian el id, la huella y la fecha (también en el
  texto de origen, que por lo demás es el de ayer).
- `ofertas`: cambian las 22 (§4).
- La guarda y la aprobación son las de ayer línea a línea. Solo cambian los
  identificadores, las huellas, las fechas (13/11 y 20/11) y la fecha del texto
  de la aprobación, que no lleva nombres de personas («el responsable del
  proyecto»).

### Lo que cambia de verdad en la base (PGlite, 38 tablas y secuencias)

| Tabla | Antes → después | Por qué |
|---|---|---|
| `rwadar_catalogo.revisiones` | 17 → 18 filas | Insert y aprobación. La `a58dd22d` sigue aprobada. |
| `rwadar_catalogo.plataformas` | 436 → 461 | +25 |
| `rwadar_catalogo.ofertas` | 447 → 469 | +22 |
| `rwadar_catalogo.fuentes` | 1.169 → 1.238 | +69 |
| `rwadar_catalogo.plataforma_fuentes` | 1.837 → 1.944 | +107 |
| `rwadar_catalogo.alertas` | 436 → 461 | +25 |
| `rwadar_catalogo.alerta_fuentes` | 606 → 641 | +35 |
| `rwadar_catalogo.publicacion_v2` | 1 → 1 | El puntero pasa a la `66907add`. Lo mueve el disparador `fijar_publicacion_v2`: es la publicación. |
| `public.catalogo_publicacion` | 1 → 1 | El disparador `sincronizar_publicacion_catalogo` deja `retirado = false` y `motivo = null`, como estaban. Solo cambia `actualizado_el`. |

- No cambia nada más: ni las otras 29 tablas y secuencias (`auth`, `cron`,
  `net`, `vault` y el resto de `public`, incluidas `plataformas`, `fuentes`,
  `cambios_estado`, los avisos y las emisiones), ni nada del catálogo del
  sistema. El servidor no da avisos.
- **Columna a columna** frente a la `a58dd22d`: en `ofertas` solo cambian
  `verificada_el` (22), `avisos` (22), `documentacion` (22), `metricas` (6: las
  tres de Spiko, Aktionariat, Boss Info y Switzerlend) y `rentabilidad` (3: las
  tres de Spiko). Ninguna cambia de colección, estado, dirección, título,
  resumen, precio ni disponibilidad. En `fuentes` solo cambia `consultada_el`.
  Las otras cuatro tablas, idénticas.
- La vista pública pasa de la `a58dd22d` (verificada el 12/11) a la `66907add`
  (verificada el 13/11), con 25 plataformas y 22 ofertas.
- **Aplicada dos veces**, la segunda ejecuta las 288 sentencias, no escribe
  ninguna fila y no cambia nada.

### Como en producción: migraciones 30 a 34 y push encendido

56 tablas y secuencias en 9 esquemas. En `rwadar_catalogo.revisiones` hay tres
disparadores activos (`avisar_ofertas_nuevas`, `fijar_publicacion_v2` y
`sincronizar_publicacion_catalogo`) y no hay otros en `rwadar_catalogo`. Las
migraciones 31 a 34 no crean ninguno en el catálogo (lo comprobé también en su
texto). Configuración como hoy en producción: `push_habilitado = true`, correo,
casilla y `ofertas_automaticas` en `false`.

El lote se aplica sin error y sin avisos del servidor. Queda publicada la
`66907add`. Hay **0 → 0 anuncios** (no hay altas: las mismas 22 fichas) y
**0 → 0 peticiones** en la cola de `pg_net`, así que no sale ninguna
notificación. Cambian las mismas 9 tablas de arriba y ninguna más.

### `catalogo.sql`: 286 sentencias

Un `begin` (sin serializable), los mismos 284 inserts **byte a byte** y un
`commit`. No lleva guarda ni aprobación. En PGlite deja la revisión en
borrador, y lo publicado (`a58dd22d`) y la vista pública no cambian. Si después
se aplica `aplicar-y-aprobar.sql`, no escribe ninguna fila nueva, la aprueba y
la publica (cambian solo `revisiones`, el puntero y `catalogo_publicacion`).
Solo sirve para importar un borrador; nunca para publicar.

## 3. La guarda

| Exigencia | Qué hace el SQL | Probado |
|---|---|---|
| Publicada exacta | Si `actual is null or actual not in ('a58dd22d…', '66907add…')`, error. Acepta la nueva solo para poder repetir sin efecto. | Con la publicada `24b5f7de` falla (comprobar). Sin puntero (`publicacion_v2` vacía): «Publicación distinta… <NULL>» (mío). |
| Huella y estado | Si la publicada es la `a58dd22d`, exige `contenido_sha256 = 'a58dd22d98a3…ee21'` y `estado = 'aprobada'`. | Con otra huella falla (comprobar). Con la `a58dd22d` retirada: «no tiene la identidad prevista o no está aprobada» (mío). |
| Catálogo no retirado | `retirado is distinct from false` da error. También si falta la fila. | Con el catálogo retirado falla (comprobar). Sin fila de control: «Catálogo retirado o control ausente» (mío). |
| Fechas | `current_date < date '2026-11-13'` da «Revisión futura». `current_date > date '2026-11-20'` da «Lote caducado: sus fichas valían hasta el 20/11/2026». | **Con los bytes del SQL sin tocar y el reloj de PGlite movido** (la cadena montada el 12/11 a las 09:25 UTC, como en producción): el 12/11 a las 23:59:50 UTC, «Revisión futura»; el 13/11 a las 00:00:05 y el 20/11 a las 23:59:50, se aplica y queda publicada; el 21/11 a las 00:00:05, «Lote caducado…». |
| Destino | Si la `66907add` ya existe con otra huella o retirada, error. | Con otra huella falla (comprobar). Con su huella pero retirada, falla (mío). |
| Destino aprobado pero no publicado | No está en la guarda: lo para la aprobación. | Con la `66907add` ya aprobada y el puntero devuelto a la `a58dd22d`: «Entrega no publicable: se deshace la transacción completa» y nada cambia (mío). |
| Ya publicada (repetición) | La guarda la deja pasar; los inserts y la aprobación no hacen nada. | Aplicada otra vez sobre la `66907add` publicada: sin error y sin ningún cambio (mío). |
| Serializable | `begin isolation level serializable` y `for update` sobre el puntero y sobre el control del catálogo. Si otra herramienta los cambia a la vez, Postgres da error de serialización o espera, y no se aplica nada a medias. | No se puede ensayar en PGlite (una sola conexión). Es la misma forma que se aplicó ayer en producción. |
| No deja nada | Cualquier error deshace la transacción entera. | No cambia ninguna tabla ni secuencia en ninguno de estos casos: los 6 de comprobar; los 7 míos de esta tabla que fallan; y tres errores forzados (justo antes del `commit`, a mitad de los inserts y una colección que la base rechaza con `oferta_coleccion_valida`). |
| Ya importada como borrador | El aplicador la aprueba sin duplicar filas. | Comprobar y mío (§2). |

- El flujo «Aplicar catálogo» solo corre desde `main` y usa
  `psql -v ON_ERROR_STOP=1 -X -q -f`, sin `-1`. Así respeta el `begin` del
  archivo y, si algo falla, se para y la conexión se cierra sin `commit`. Antes
  hace una copia cifrada de la base.
- `current_date` va en UTC en Supabase: la guarda acepta el lote hasta la 01:00
  (hora de Madrid) del 21/11.
- El puntero lo mueve el disparador a la revisión aprobada más reciente
  (`aprobada_el`). En producción la `a58dd22d` se aprobó el 12/11 por la
  mañana, así que cualquier aplicación desde hoy queda por delante.
- **Límite conocido** (no bloquea hoy; recomendación R4): la aprobación cuenta
  las filas de la revisión nueva, pero no comprueba su contenido. Lo probé: si
  ya existiera un borrador `66907add` con su huella y una cifra cambiada a mano
  (el mínimo de Pottendorfer), el aplicador lo aprobaría y lo publicaría con esa
  cifra. Para eso hace falta escribir antes en `rwadar_catalogo` con permisos
  de propietario y el id exacto de hoy, que solo existe en este repositorio.

## 4. Diferencias con la publicada, campo a campo

Comparé cada hoja de `escaparate-publicacion.json` y de
`documentacion-ofertas.json` con las de `2026-11-12-v2/`: cada oferta y cada
plataforma por su slug, y los avisos, métricas y referencias por su texto o su
etiqueta. Cambian **646 hojas solo de fecha** (el valor de antes con 12/11 →
13/11 da el de ahora) y **79 de contenido**.

Los 22 slugs y las 25 plataformas son los mismos, en el mismo orden y con las
mismas claves. No cambian las fuentes de las ofertas ni las de las fichas, las
descripciones, los resúmenes, las colecciones, los estados ni las imágenes.
No se añade ni se quita ningún aviso, métrica ni referencia.

### 4.1 Lo que cambia en todas (DECISIONES §1)

- `verificadaEl` (22) y `revisadaEl` (22) pasan al 13/11, con 7 días.
- Los 145 avisos pasan a `verificadaEl` 13/11. 130 están tal cual en el
  expediente de hoy; los otros 15 son el aviso fijo «Referencia editorial
  gratuita…» del guion. Cinco cambian solo la fecha de su dato (Aktionariat,
  Boss Info, las dos de Switzerlend y Hausera).
- 112 referencias de las fichas pasan a consulta del 13/11 (los 63 datos de
  tarjeta y 49 más: libro de Brickwise, Spiko, Boss Info y Hausera). **He
  comprobado las 112:** cada una tiene su misma dirección leída hoy en el
  expediente, con hora (de 08:30:37 a 08:36:16 UTC). En las tres de Spiko la
  página `data.spiko.io` está leída hoy dentro de la afirmación de la
  rentabilidad (08:30:37–08:30:40 UTC). En las suizas la hora es la real del
  inventario del grupo (de 08:31:15 a 08:34:19 UTC), no la copiada del
  expediente.
- Plataformas: los 25 `verificadoEl` y las 142 fechas de consulta de sus
  fuentes pasan al 13/11 (radar 69/69, sin bloqueos). Nada más.

### 4.2 Por ficha

| Ficha | Qué cambia, además de las fechas | ¿Dónde está? |
|---|---|---|
| Spiko Letras Euro | 2,41 % → 2,40 %: cifra, literal («publicado por Spiko el 12/11/2026 (VL fechada el 12/11/2026); consultado el 13/11/2026»), métrica «Rentabilidad publicada · 31 días · 12/11/2026» y referencia (valor, fecha del dato 12/11, consulta 13/11, alcance con 1,060664 € → 1,062803 €). «Acceso desde España»: fecha del dato 23/10 → 06/11. | DECISIONES §2 y §4 |
| Spiko Letras Dólar | 4,02 % → 3,98 % en USD: igual, con 1,099159 $ → 1,102694 $ (del 13/10, porque el 12/10 fue festivo en EE. UU.). «Acceso desde España»: 06/11. | DECISIONES §2 y §4 |
| Spiko Smart Cash | 2,84 % igual, con la VL del 12/11: literal, métrica «… · 12/11/2026» y «Rendimiento neto publicado» (fecha del dato 12/11 y alcance). «Acceso desde España»: 06/11 y «Tabla de disponibilidad de Spiko (06/11/2026)». | DECISIONES §2 y §4 |
| mTBILL, Robinhood, Kraken y Prosegur | Solo fechas. | DECISIONES §2 |
| Aktionariat | «Precio del emisor · 13/11/2026», «Supervisor (13/11/2026)» y el aviso «6,20 ZCHF frente a 7,25 CHF el 13/11/2026». | DECISIONES §2 |
| Boss Info | «Supervisor», el aviso «venta más barata 8,40 ZCHF el 13/11/2026», el mínimo «… (unos 17 ZCHF el 13/11)» y «Última operación · 13/11/2026» con la fuente `https://shares.bossinfo.com/`. Su alcance ya no dice «se comprobó el 10/11/2026 y hoy no se ha vuelto a leer»: dice que el 13/11 se comprobaron el portal, el historial y, en la cadena, la operación y lo que recibió quien vendió (8,2404 ZCHF; 0,1596 de comisión). | DECISIONES §2 y §4; el alcance, en la corrección 2 del revisor de Suiza (§4.3) |
| Switzerlend | Los dos avisos con dato del día, «Supervisor» y el mínimo «1 acción (68,01 CHF el 13/11)». | DECISIONES §2 |
| Pottendorfer | Mínimo 80 € → 73 € (13/11); «Venta más barata» 80 € (11, orden del 08/02/2026) → 73 € (1, orden del 12/11/2026); «Orden de venta de menor importe» 1 × 115 € (116,73 €) → 1 × 73 € (74,10 €: 73 × 1,015 = 74,095, redondeo normal); «Participaciones en venta» 107, del 11/11 al 13/11; el alcance del mínimo dice «había 1 participación a la venta». | DECISIONES §2 |
| Cohotel, GreenPoint y Schwarzer Weg | «Participaciones en venta» 65 → 59, 351 → 347 y 300 → 299, todas al 13/11. | DECISIONES §2 |
| Randhartingergasse | «Mejor oferta de compra» 56 € → 64 € (1 participación, orden del 12/11/2026). | DECISIONES §2 |
| Las 11 de Brickwise | Las cuatro referencias del libro pasan a «· 13/11/2026», y el alcance de tres de ellas a «leído el 13/11/2026 (08:30–08:33 UTC)». El aviso común, igual. | DECISIONES §2; la hora, en el expediente (API 08:30:44, app 08:33) |
| Hausera | El aviso «El 13/11/2026 Alicante 3 aún no estaba inscrita…», el mínimo «… (13/11); la preventa abre el 18/11.» y «Historial publicado · 13/11/2026». | DECISIONES §2 (ERIR 08:30:41, documento 08:36:16, portada 08:33:41) |

Fuera de las fichas cambian la `notaOrigen` y la `actualizacionLocal` del
escaparate. Son datos locales: no van en el SQL.

### 4.3 Lo que no está escrito tal cual en DECISIONES

Ninguna diferencia carece de respaldo, pero dos solo están en DECISIONES de
forma implícita. Las doy por buenas y recomiendo dejarlas escritas (R5):

1. **El alcance de «Última operación» de Boss Info.** DECISIONES dice «sin
   cambios de fondo; las fechas pasan al 13/11» y fija la fuente. El texto
   nuevo deja de decir que el importe del vendedor no se volvió a leer, porque
   hoy sí se leyó: lo hizo el revisor de Suiza en la cadena a las 08:45:52 UTC,
   y su corrección 2 dice que esa es la lectura que vale. El texto no se lo
   atribuye al investigador. Las cifras (8,2404 y 0,1596 ZCHF) son las del
   revisor.
2. **La hora de lectura del libro de Brickwise** («08:30–08:33 UTC») en el
   alcance de 33 referencias del libro (tres por ficha). Es la re-fecha de
   DECISIONES con la hora real del expediente de hoy (API a las 08:30:44, app a
   las 08:33).

### 4.4 Lo que el montador no aplicó tal cual

Mi opinión, punto por punto (los 4 de `noAplicado`):

1. **Boss Info, fuente de «Última operación».** De acuerdo: queda el portal,
   como piden DECISIONES §4 y la corrección 2 del revisor (la API da 405).
2. **Horas de los expedientes suizos.** De acuerdo con cómo se resolvió en la
   entrega: las horas reales salen del inventario del grupo, ninguna hora
   copiada llega a ningún archivo (lo comprobé aparte) y
   `despues-de-aplicar.mjs` exige hora real para re-fechar una fuente suiza.
   Los expedientes siguen con las horas falsas. Si quien los escribió los
   corrige, ojo: `preparar-entrega.mjs` comprueba que están como hoy (líneas
   353 y 511) y fallará; ver R6.
3. **Spiko, claim `accesoEspana` y nota interna.** De acuerdo: lo publicado lleva
   la fecha corregida (06/11) y el alcance corregido en Smart Cash; el literal
   y la nota corregidos están en `contraste-2026-11-13.json`. Los expedientes no
   cambian (mismo aviso que el punto 2).
4. **Propuestas fuera de DECISIONES** (textos nuevos de tarjeta, datos de
   tarjeta de mTBILL, fuentes nuevas, lugar, concepto y pasos). Bien que no
   entren: el SQL tiene las mismas 212 direcciones y las tarjetas solo cambian
   el mínimo donde DECISIONES lo dice.

## 5. `despues-de-aplicar.mjs` y `transparencia.json`

Por orden, en la copia:

1. **Antes de sincronizar:** exit 1, «el catálogo sincronizado no es la
   revisión 66907add-…: aplica antes el SQL y ejecuta node
   rwadar-app/sincronizar.js». `transparencia.json` no cambia (ae3ed55e…9f62).
2. **`sincronizar.js`**, con el REST simulado (copia exacta del de ayer) y lo
   que exporté de PGlite: exit 0, «Sincronizado desde Supabase: 25 plataformas
   verificadas, 5 descartadas y 22 ofertas clasificadas.» y `rwadar.csv` de
   30 filas sin diferencias.
3. **`despues-de-aplicar.mjs`:** exit 0. «Comprobaciones de transparencia al
   13/11: 43 de 44» (se queda en el 10/11 la «supervisada» de mTBILL: hoy no se
   releyó la BaFin); suizas con su hora real (Aktionariat 08:31:39 y 08:31:24,
   Boss Info 08:33:29 y 08:33:37, Switzerlend 08:32:34); «Títulos de puntos
   fuertes… 11 de 11 pasan al 13/11»; mínimos cortos. `transparencia.json`
   queda en **8666d60c…7956, el mismo SHA-256 que da el montador**.
4. **Otra vez:** «Nada que cambiar: ya estaba hecho.», con el mismo SHA-256.
5. **El resto:** `volcar-seed.js`, «02_seed.sql regenerado: 25 en el radar, 5
   descartadas, 13 fuentes.» sin diferencias; `transparencia.mjs`, «22 ofertas
   con transparencia»; `rwadar-fichas.js`, «Archivos actualizados: 55».

**Qué cambia en `transparencia.json`** (diferencia completa, hoja a hoja):
`lote`, `revisionCatalogo` y `revisadoEl`; los 22 `verificadaEl`; 21 fechas de
`supervisada` y 22 de `documentoEspana`; 13 `minimoCorto`; los 11 títulos
«Brickwise · mercado de reventa en la app (13/11/2026)»; y el motivo de
«Documento para España» de Hausera («el 13/11/2026 la emisión aún no estaba
inscrita»). Nada más. De los 13 mínimos cortos, solo Pottendorfer cambia de
precio («Desde 80 € la participación (12/11)» → «Desde 73 € la participación
(13/11)»); los otros 10 de Brickwise, Switzerlend («1 acción (68,01 CHF,
13/11)») y Hausera («Desde 100 € en Alicante 3 (13/11)») solo cambian la
fecha. Los de Boss Info y Aktionariat no llevan fecha y no cambian.

**He comprobado una a una las 54 fechas de hoy** (43 comprobaciones y 11
títulos). Cada una tiene en el expediente de hoy la misma dirección y una
lectura con hora del 13/11 (un registro, un documento descargado de nuevo o una
afirmación con `consultadoUtc`). Ninguna se apoya solo en
`cambiosRespectoPublicado`. Por ejemplo:

- **Brickwise:** el registro de la CNMV a las 08:30:50 (las 11 `supervisada`),
  cada PDF entre las 08:30:46 y las 08:30:49 (las 11 `documentoEspana`) y el
  libro de la app a las 08:33:24 (los 11 títulos).
- **Spiko:** la CNMV a las 08:30:38–08:30:40 y el KID a las 08:30:46–08:30:47.
- **Robinhood** 08:30:46 y 08:30:55; **Kraken** 08:30:48 y 08:31:04;
  **Prosegur** 08:30:39 y 08:32:25; **Hausera** 08:31:59 y 08:36:16.
- **Suizas:** sus expedientes llevan las horas copiadas (00:34–00:38), pero el
  guion solo re-fecha con la hora real del inventario del grupo (de 08:31:24 a
  08:33:37), y cada una está en `grupos/suiza/inventario-consultas.json`. La de
  FINMA (Aktionariat) sale de su API de búsqueda, que es la que alimenta la
  página citada; el revisor la volvió a abrir a las 08:44.
- **mTBILL, `documentoEspana`:** las condiciones finales y el KID en español se
  descargaron hoy a las 08:30:47 (mismos SHA-256 que ayer), desde el CDN de
  GitBook; la página `docs.midas.app` sigue dando 403. La comprobación sí se
  repitió hoy (como ayer, recomendación 7 del 12/11).

**Conclusión: no pone la fecha de hoy a ninguna comprobación que no se repitió
hoy.**

## 6. Datos personales y escáner de secretos

### Lo que va a Git (`HEAD` `5641af2`, ya en la rama de trabajo remota)

- **gitleaks** sobre el contenido de `HEAD` (`git archive`, 4.960 archivos,
  152 MB): «no leaks found». Sobre la historia que aún no está en `main`
  (`origin/main..HEAD`, 154 commits): «no leaks found».
- **Archivos:** ningún PDF, HTML, imagen, `crudo/`, `.json.gz` ni
  `.inventario.jsonl` en Git. Los 222 archivos del ciclo son 126 `.txt`, 71
  `.json`, 13 `.md`, 4 `.mjs`, 2 `.sql`, 2 `.csv`, 2 `.gitignore`, 1 `.xml` y
  1 `.cjs`.
- **El SQL y lo generado hoy** (escaparate, documentación, contraste, radar,
  informe, pruebas, ensayo y guiones) no llevan correos, teléfonos, IBAN, DNI o
  NIE, JWT ni prefijos de claves conocidos. Tampoco nombres de personas: frente
  a los mismos archivos de ayer no aparece ninguna palabra con mayúscula nueva
  en el SQL, el escaparate ni la documentación; en el informe y el contraste,
  solo términos técnicos y nombres de empresas.
- **Lo que sí lleva el SQL:** las tres direcciones públicas de los contratos de
  token de Aktionariat, Boss Info y Switzerlend (las mismas de ayer), sus UID
  de empresa y el enlace público al documento de emisión de Hausera. Nada de
  eso es una cuenta de una persona.
- **Correos:** de empresas y organismos (info@, contacto@, soporte@, dpo@…), un
  marcador de formulario de Brickwise («max.mustermann@…», el «Juan Pérez»
  alemán) y **uno personal** (C1).
- **Nombres:** en las copias de webs y blogs salen recortados («[nombre
  recortado]», «[correo recortado]»), también los de Bit2Me y el de la línea
  126 de Profitus que mandó recortar el revisor de vigilancia. «Dr.
  Grass-Strasse» (Vaduz) y «Calle Don Ramón de la Cruz» (Madrid) son
  direcciones. **Pero la copia de Profitus sigue con dos personas** (C1).

### C1 · La copia de Profitus lleva nombres, un correo y un teléfono

`grupos/vigilancia/fuentes/profitus/nav-profitus-bonds-2026-11-13.txt` (commit
`cccebe2`, ya en la rama de trabajo remota; no en `main`):

- **línea 124:** el nombre y apellido del fundador de Axiology. Es la misma
  persona cuyo nombre se recortó en la línea 126, así que el recorte no sirve;
- **línea 240:** nombre y apellido de un empleado de Profitus;
- **línea 244:** su correo de trabajo con su nombre;
- **línea 249:** su teléfono directo.

DECISIONES §4 dice que la copia de Profitus está recortada; solo lo está a
medias (el revisor de vigilancia señaló la línea 126, no estas). El original
completo ya está fuera de Git en `grupos/vigilancia/crudo/` (SHA-256
7d2afc89…, el que anota el inventario). Ningún guion de la entrega lee esta
copia: arreglarla no cambia ninguna de las 8 salidas.

### Lo que se queda fuera de Git

- gitleaks sobre la carpeta del ciclo entera, también lo que Git ignora:
  2.743 avisos (2.065 `generic-api-key`, 674 `aws-access-token`, 2
  `gcp-api-key` y 2 `jwt`) en 72 archivos, **todos en `crudo/`** (47 JSON, 23
  HTML y 2 JS). `git check-ignore` confirma que ninguno va a Git. Son falsos
  positivos de respuestas públicas: identificadores, huellas, la clave pública
  de la app de Brickwise, un JWT público de la web de Valorix y, los
  `aws-access-token`, enlaces firmados de las respuestas de la API pública de
  Profitus que guardó el revisor de vigilancia.
- **Después de aplicar:** lo que regenera el ensayo (las 52 fichas, el catálogo
  sincronizado de la web, `rwadar-20260820.js`, `sitemap.xml`, `cambios.html`,
  `metodologia.html`, `transparencia.json` y su copia para la app): 60
  archivos, 2,2 MB, «no leaks found».

## Correcciones obligatorias

**C1 · Datos personales en una copia que va a Git (no cambia el SQL).**
Quien escribió la copia o la coordinación (no el montador ni yo), en
`rwadar-app/data/verificaciones/2026-11-13-v2/grupos/vigilancia/fuentes/profitus/nav-profitus-bonds-2026-11-13.txt`:

1. Línea 124: cambiar el nombre y apellido que va entre «led by its founder, »
   y «, a former member» por «[nombre recortado]».
2. Línea 240: cambiar la línea entera (el nombre) por «[nombre recortado]».
3. Línea 244: cambiar el correo por «[correo recortado]».
4. Línea 249: cambiar el teléfono por «[teléfono recortado]». El de la línea
   291 es el de atención al cliente de la empresa: se queda.
5. Añadir esta copia (y la de Bit2Me) a la lista «Recortados en las copias» de
   `grupos/vigilancia/resumen-vigilancia.md`, como pidió el revisor.
6. Comprobar con `grep` que en la carpeta del ciclo, fuera de `crudo/`, ya no
   salen ni esos dos apellidos ni el correo.
7. Unir a `main` con *squash*, como siempre, para que la historia de `main` no
   lleve `cccebe2`. La rama de trabajo remota sí lo lleva; reescribirla o no es
   decisión de Víctor (el repositorio es privado).

No hace falta volver a ejecutar `preparar-entrega.mjs`, `comprobar-entrega.mjs`
ni el ensayo: ninguno lee esa copia.

## Recomendaciones (no bloquean)

1. **R1 · Antes de aplicar:** confirmar que en `main` el SHA-256 de
   `aplicar-y-aprobar.sql` sigue siendo `7be64e86…6961`; volver a leer como
   visitante (tiene que seguir publicada la `a58dd22d`); aplicar solo ese
   archivo con «Aplicar catálogo», nunca `catalogo.sql`. Mejor **hoy antes de
   las 18:00 UTC**: después, las cifras de Spiko siguen siendo ciertas con su
   fecha, pero ya no son las últimas. Y antes, volver a mirar la orden de 73 €
   de Pottendorfer: si ya no está, hay que rehacer la entrega (cambia el SQL) y
   repetir esta revisión.
2. **R2 · El paso «Leer el lote publicado» del flujo no sirve de prueba.**
   Ordena por id (`order by 1 desc limit 2`) y no enseñará la `66907add`. La
   prueba es la lectura pública de las vistas v2, guardada en
   `lectura-despues-de-aplicar/` antes de `npm test`.
3. **R3 · `npm test` antes de publicar la web:** la prueba de noticias de la
   web (`rwadar-acceso/noticias-sector.test.mjs:172`) falla también sin esta
   entrega; ajustarla como `ce9d5a9` ajustó las de la app. No toca el SQL.
4. **R4 · Para lotes futuros:** que la aprobación compruebe también una huella
   de las filas de la revisión nueva (por ejemplo, un `md5` de las filas de
   `ofertas` y `fuentes` calculado por el generador), porque `on conflict do
   nothing` da por buenas las que ya existan (§3, límite conocido); y que
   `despues-de-aplicar.mjs` no cuente siempre `cambiosRespectoPublicado` como
   lectura de hoy (sigue igual que ayer; hoy ninguna fecha depende solo de
   eso).
5. **R5 · Dejar escrito en DECISIONES** (una línea, no cambia el SQL) lo de
   §4.3: el alcance de Boss Info con la lectura en cadena del revisor y la hora
   del libro de Brickwise. Si se vuelve a ejecutar `preparar-entrega.mjs`
   después, solo cambia `contraste-2026-11-13.json`, que guarda el SHA-256 de
   DECISIONES.
6. **R6 · Si se corrigen los expedientes suizos y de Spiko** (como pidieron sus
   revisores), `preparar-entrega.mjs` dejará de pasar: comprueba que las horas
   copiadas siguen ahí (línea 511, 26/27, 26/27 y 27/28) y que el claim de Spiko
   sigue diciendo «October 23» (línea 353). Habría que adaptar esas dos
   comprobaciones y confirmar que el SQL da el mismo SHA-256 (solo debería
   cambiar el contraste).
7. **R7 · Copias de fuentes con saltos CRLF** (igual que ayer):
   `grupos/principales/fuentes/esma-casps.csv` y `ecb-estr-ultimos8.csv` están
   en disco con CRLF y Git las guarda con LF, así que su SHA-256 en Git no es el
   del inventario. Para copias de fuentes, mejor `-text` en `.gitattributes`.
   No afecta a la entrega.
8. **R8 · Hausera:** la ficha vale hasta el 20/11 y dice «la preventa abre el
   18/11». Si el lote se aplica pronto (R1) el problema es solo de los dos
   últimos días; que lo decida la revisión de contenido.

## Lo que no hice

- No toqué Supabase ni ningún servicio remoto. Para gitleaks usé el paquete que
  ya estaba en el scratchpad, con el SHA-256 de `ci.yml`.
- No publiqué, no lancé flujos de GitHub y no hice commit ni push.
- No ensayé la concurrencia: PGlite tiene una sola conexión.
- No edité expedientes, informes de revisores ni ningún otro archivo. En la
  carpeta de trabajo solo escribí este. Mis guiones y salidas están en
  `/tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/entrega-1311/revisor-sql/`
  (`scripts/` y `salidas/`).

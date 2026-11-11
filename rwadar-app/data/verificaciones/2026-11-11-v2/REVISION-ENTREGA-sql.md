# Revisión independiente de SQL e integridad · entrega 2026-11-11

**Veredicto: `aprobado`. Sin correcciones obligatorias.** El SQL hace lo que se
pidió y nada más: inserta la revisión nueva en `rwadar_catalogo` y la aprueba al
final, en una sola transacción serializable con guarda. No toca
`public.plataformas` ni `public.fuentes`, ni usuarios, Auth, RLS, permisos,
funciones o esquema. Cada diferencia con la publicada está en DECISIONES (o en
la indicación 4 del coordinador, «el resto solo re-fecha»).
`despues-de-aplicar.mjs` no pone la fecha de hoy a nada que no se haya vuelto a
consultar hoy. En lo que va a Git no hay secretos ni nombres de terceros.

Se puede aplicar **tal cual** (SHA-256 `dfeba195…a3cb`). La aprobación vale
solo para ese SHA-256. Si el coordinador acepta alguno de los puntos abiertos
que cambian el SQL (§4.4), hay que regenerar, repetir las pruebas y repetir esta
revisión.

Datos de la entrega:

- Revisión nueva: `24b5f7de-2834-3e15-6ae4-62a6d9565161`
  (huella `24b5f7de28343e156ae462a6d9565161d49d251cb45b9422b208c0fb0bceec22`).
- Guarda sobre la publicada: `dfdc4c85-7f2f-fc4a-de27-a9f4a63f7656`
  (huella `dfdc4c857f2ffc4ade27a9f4a63f7656ab4be9edc43d0037d0ad42fb94ac015f`),
  entrega 2026-11-10.
- **SHA-256 de `aplicar-y-aprobar.sql`: `dfeba19516b2b688ddf4f8ad4ba1feb5049dbaae164b2d1abcee951ccb26a3cb`.**
  Es el mismo en la carpeta de trabajo y en `HEAD` (`61a4390`).
- SHA-256 de `catalogo.sql`: `d8d7f12d31020476ae7c6cbe5c918f84d137c4254837fc049e64c4b2dd7e7add`.
  SHA-256 de `revision.json`: `03df931233bdc9ffae15ca3dc9228ffef1bd398cbf02953a454b6df879089d70`.
- Fichas verificadas el 11/11 con 7 días: el último día vigente es el
  **18/11/2026**. La guarda rechaza el lote desde el 19/11 (fecha UTC).
- Revisor: Claude, revisión independiente de SQL e integridad, 11/11/2026, de
  14:18 a 14:45 UTC. No monté esta entrega. Todo lo que se ejecuta lo hice en una
  copia aparte
  (`/tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/entrega-1111/revisor-sql/copia`).
  En la carpeta de trabajo solo he escrito este archivo.

## 1. Qué ejecuté y qué salió

| Paso | Resultado |
|---|---|
| Copia aparte del árbol de trabajo (sin `.git` ni `.claude`; los `node_modules` enlazados) | `diff -rq` de `2026-11-11-v2/` y de `importaciones/`: idénticas al repositorio. |
| `preparar-entrega.mjs`, **dos veces seguidas** (14:19:58–14:19:59 UTC) | exit 0 las dos. Las 8 salidas tienen el mismo SHA-256 en las dos ejecuciones y **el mismo que en el repositorio**: `radar-canonico-26.json` 0b8a0d3e…57b0, `escaparate-publicacion.json` 367d0f8a…27c8, `documentacion-ofertas.json` aa1cc5b2…3df6, `manifiesto-catalogo.json` c2c51919…4224, `contraste-2026-11-11.json` a55ff884…9845, `catalogo.sql` d8d7f12d…7add, `aplicar-y-aprobar.sql` dfeba195…a3cb, `revision.json` 03df9312…9d70. Salida: `{"revisionId":"24b5f7de-…","previa":"dfdc4c85-…","sha256":"dfeba195…a3cb","plataformas":25,"fuentesRadar":69,"ofertas":22,"colecciones":{"principales":8,"secundario":13,"en_camino":1},"cambios":63,"noAplicado":3}`. |
| `comprobar-entrega.mjs --exportar=DIR` (14:20:04–14:20:27 UTC) | exit 0 en 23 s, «resultado: correcto», 19 comprobaciones y 6 casos de fallo. Repetido sin `--exportar` (14:37 UTC): 18 + 6. Su informe es igual al `pruebas-locales.json` del repositorio, salvo la hora y la línea de la exportación. |
| Inventario propio de los dos SQL | Un analizador que separa las sentencias respetando comentarios, cadenas (`'…'`, `E'…'`) y bloques `$…$`. No busca palabras sueltas: cuenta y clasifica, y mira qué queda **fuera** de las cadenas. Resultado en §2. |
| Prueba propia en PGlite con la cadena de `comprobar-entrega.mjs` (seed de antes de ARTEX, migraciones del catálogo y 15 lotes hasta la 2026-11-10) | Huella de **todas** las tablas y secuencias (32 tablas y 6 secuencias en `auth`, `cron`, `net`, `public`, `rwadar_catalogo` y `vault`) y del catálogo del sistema (funciones, disparadores, políticas, permisos de tablas y esquemas, columnas, roles, privilegios por defecto y vistas), antes y después. Además: aplicarla dos veces, aplicar solo `catalogo.sql` y tres errores forzados. Resultado en §2 y §3. |
| Prueba propia con las migraciones 30 y 31 (avisos; en producción desde el 06/11), montada como en `probar-avisos-registrados.mjs` | §2. |
| Cuatro casos de la guarda que `comprobar-entrega.mjs` no ensaya, y el límite del último día | §3. |
| Comparación campo a campo con `2026-11-10-v2/` | De `escaparate-publicacion.json` y `documentacion-ofertas.json`. Resultado en §4. |
| «Después de aplicar», en la copia, con lo que exporté de PGlite | `despues-de-aplicar.mjs` antes y después de sincronizar, `sincronizar.js`, `volcar-seed.js`, `transparencia.mjs` y `rwadar-fichas.js`. Cada fecha de hoy, comprobada una a una contra el expediente. Resultado en §5. |
| gitleaks 8.30.1 con `rwadar-app/gitleaks.toml` y las mismas opciones que `ci.yml` | El paquete tiene el SHA-256 que fija `ci.yml` (551f6fc8…70eb). Ya estaba en el scratchpad: no descargué nada. Resultado en §6. |
| Al terminar | `git status`: limpio salvo este archivo. El SHA-256 del SQL y el de `transparencia.json` (67e89ba3…2ea8) no han cambiado. |

No repetí `npm test`. Lo pasó el montador en su copia y no cambia el SQL.

## 2. Inventario de las sentencias

### `aplicar-y-aprobar.sql`: 288 sentencias, una sola transacción

| Orden | Sentencia | Tabla | Cuántas | Qué hace |
|---|---|---|---|---|
| 1 | `begin isolation level serializable` | — | 1 | Abre la transacción. Es el único `begin`. |
| 2 | `do $guarda$` | Lee `rwadar_catalogo.publicacion_v2` (`for update`), `rwadar_catalogo.revisiones` y `public.catalogo_publicacion` (`for update`) | 1 | Solo lee y, si algo falla, lanza un error. Detalle en §3. |
| 3 | `insert … on conflict (id) do nothing` | `rwadar_catalogo.revisiones` | 1 | La revisión nueva, en borrador, verificada el 11/11. |
| 4 | `insert … on conflict (revision_id,id) do nothing` | `rwadar_catalogo.fuentes` | 69 | Las 69 fuentes del radar, las 69 con consulta del 11/11. |
| 5 | `insert … select … from public.plataformas where slug=… on conflict (revision_id,plataforma_id) do nothing` | `rwadar_catalogo.plataformas` | 25 | Lee `public.plataformas` sin escribir en ella. |
| 6 | `insert … select … from public.plataformas … on conflict do nothing` | `rwadar_catalogo.plataforma_fuentes` | 107 | Igual. |
| 7 | Igual | `rwadar_catalogo.alertas` | 25 | Igual. |
| 8 | Igual | `rwadar_catalogo.alerta_fuentes` | 35 | Igual. |
| 9 | `insert … on conflict (revision_id,slug) do nothing` | `rwadar_catalogo.ofertas` | 22 | 8 principales, 13 de reventa y 1 en camino. Las 22 verificadas el 11/11 y con 7 días. Estados: 7 `actual`, 1 `fuentes_en_conflicto` (mTBILL) y 14 `no_verificable`. |
| 10 | `do $aprobar$` | Cuenta filas en `rwadar_catalogo` y hace **un** `update rwadar_catalogo.revisiones set estado = 'aprobada' … where id = v and estado = 'borrador'` | 1 | Exige 25/22/8/13/1, que la vista `revision_publicable_v2` acepte la revisión y que el puntero quede en la nueva. Si no, error y se deshace todo. |
| 11 | `commit` | — | 1 | |

Lo que queda **fuera de las cadenas** en los 284 inserts son nombres de
columnas, los tipos (`uuid`, `date`, `jsonb` y los enumerados de
`rwadar_catalogo`), `select … from public.plataformas where slug = …` y
`on conflict … do nothing`. No hay ninguna llamada a funciones. El único uuid de
los inserts es el de la revisión nueva, y los 284 empiezan por él.

No hay DDL, `delete`, `truncate`, `grant`, `revoke`, políticas, funciones ni
`set role`. Nada en `auth`, `storage` ni `vault`. Tampoco caracteres de control
ni invisibles, BOM o retornos de carro: es UTF-8 válido, con saltos LF, y
termina en `commit;`.

Otros datos del SQL:

- **Direcciones:** 212 distintas, las mismas que en la 2026-11-10 (ni una nueva
  ni una menos), todas `https`.
- **Barras invertidas:** 138, todas escapes JSON (`\"`) dentro de los `jsonb`,
  las mismas que en la 2026-11-10. Dependen de `standard_conforming_strings`
  activado, que es lo normal en Supabase. Si estuviera apagado, el `jsonb`
  fallaría y se desharía todo: no hay corrupción silenciosa posible.

### Frente al SQL publicado (2026-11-10)

- `plataformas`, `plataforma_fuentes`, `alertas` y `alerta_fuentes`: iguales
  byte a byte, salvo el id de la revisión.
- `fuentes`: iguales salvo el id y la fecha de consulta.
- `revisiones`: cambia la fecha (11/11) y el texto de origen, que es el alcance
  del radar de hoy (DECISIONES §1).
- La guarda y la aprobación tienen la misma forma, línea a línea. Solo cambian:
  - los identificadores y las huellas;
  - las fechas (11/11 y 18/11);
  - el texto de la aprobación, que ya no lleva ningún nombre de persona («el
    responsable del proyecto»).

### Lo que cambia de verdad en la base (PGlite, 38 tablas y secuencias)

| Tabla | Antes → después | Por qué |
|---|---|---|
| `rwadar_catalogo.revisiones` | 15 → 16 filas | Insert y aprobación. |
| `rwadar_catalogo.plataformas` | 386 → 411 | Insert (+25). |
| `rwadar_catalogo.ofertas` | 403 → 425 | Insert (+22). |
| `rwadar_catalogo.fuentes` | 1.031 → 1.100 | Insert (+69). |
| `rwadar_catalogo.plataforma_fuentes` | 1.623 → 1.730 | Insert (+107). |
| `rwadar_catalogo.alertas` | 386 → 411 | Insert (+25). |
| `rwadar_catalogo.alerta_fuentes` | 536 → 571 | Insert (+35). |
| `rwadar_catalogo.publicacion_v2` | 1 → 1 | El puntero pasa a `24b5f7de`. Lo mueve el disparador `fijar_publicacion_v2`: es la publicación. |
| `public.catalogo_publicacion` | 1 → 1 | El disparador `sincronizar_publicacion_catalogo` deja `retirado = false` y `motivo = null`, como estaban. Solo cambia `actualizado_el`. |

- No cambia nada más: ni las otras 29 tablas y secuencias (`auth`, `cron`,
  `net`, `vault` y el resto de `public`, incluidas `plataformas`, `fuentes`,
  `cambios_estado`, los avisos y las emisiones), ni las funciones, disparadores,
  políticas, permisos, columnas, roles, privilegios por defecto o vistas.
- La vista pública pasa de la `dfdc4c85` (verificada el 10/11) a la `24b5f7de`
  (verificada el 11/11), con 25 plataformas y 22 ofertas.
- **Aplicada dos veces**, la segunda no cambia nada: ni una tabla, ni una
  secuencia, ni el catálogo del sistema.

### Con las migraciones 30 y 31 instaladas, como en producción

52 tablas y secuencias en 9 esquemas. Los tres disparadores de
`rwadar_catalogo.revisiones` están activos (`avisar_ofertas_nuevas`,
`fijar_publicacion_v2` y `sincronizar_publicacion_catalogo`), y los avisos,
apagados (`ofertas_automaticas`, correo, push y casilla en `false`).

El lote se aplica sin error y sin avisos del servidor. Queda publicada la
`24b5f7de`. Hay **0 → 0 anuncios**, porque no hay altas, y cambian las mismas 9
tablas de arriba y ninguna más.

### `catalogo.sql`: 286 sentencias

Un `begin` (sin serializable), los mismos 284 inserts byte a byte y un
`commit`. No lleva guarda ni aprobación. En PGlite deja la revisión en
borrador, y lo publicado (`dfdc4c85`) y la vista pública no cambian. Solo sirve
para importar un borrador; nunca para publicar.

## 3. La guarda

| Exigencia | Qué hace el SQL | Probado |
|---|---|---|
| Publicada exacta | Si `actual is null or actual not in ('dfdc4c85…', '24b5f7de…')`, error. Acepta la nueva solo para poder repetir sin efecto. | Con la publicada `88d5a757` falla (comprobar). Sin puntero (`publicacion_v2` vacía) también falla: «Publicación distinta… <NULL>» (mío). |
| Huella y estado | Si la publicada es la `dfdc4c85`, exige `contenido_sha256 = 'dfdc4c857f2f…ac015f'` y `estado = 'aprobada'`. | Con otra huella falla (comprobar). Con la `dfdc4c85` retirada, también (mío). |
| Catálogo no retirado | `retirado is distinct from false` da error. También si falta la fila. | Con el catálogo retirado falla (comprobar). Sin fila de control, «Catálogo retirado o control ausente» (mío). |
| Fechas | `current_date < date '2026-11-11'` da «Revisión futura». `current_date > date '2026-11-18'` da «Lote caducado: sus fichas valían hasta el 18/11/2026». | El literal `2026-11-18` lo he leído yo. Con el tope movido a ayer falla (comprobar). Con la fecha mínima movida a mañana, «Revisión futura» (mío). Con el tope movido a hoy, pasa: el 18/11 todavía vale y el 19/11 no. |
| Destino | Si la `24b5f7de` ya existe con otra huella o retirada, error. | Falla (comprobar). |
| Serializable | `begin isolation level serializable` y `for update` sobre el puntero y sobre el control del catálogo. Si otra herramienta los cambia a la vez, Postgres da error de serialización y no se aplica nada. | — |
| No deja nada | Cualquier error deshace la transacción entera. | No cambia ninguna tabla ni secuencia en ninguno de estos casos: los 6 de comprobar; tres míos (error justo antes del `commit`, error a mitad de los inserts y una oferta con una colección que la base rechaza), y los cuatro míos de esta tabla. |
| Ya importada como borrador | El aplicador la aprueba sin duplicar filas. | Comprobar. |

- El flujo «Aplicar catálogo» solo corre desde `main` y usa
  `psql -v ON_ERROR_STOP=1 -X -q -f`, sin `-1`. Así respeta el `begin` del
  archivo y, si algo falla, se para y la conexión se cierra sin `commit`.
- `current_date` va en UTC en Supabase: la guarda acepta el lote hasta la 01:00
  (hora de Madrid) del 19/11.

## 4. Diferencias con la publicada, campo a campo

Comparé cada hoja de `escaparate-publicacion.json` y de
`documentacion-ofertas.json` con las de `2026-11-10-v2/`: cada oferta y cada
plataforma por su slug, y las listas por su posición. Cambian 655 hojas: 603
solo de fecha (el valor de antes con 10/11 → 11/11 da el de ahora) y 52 de
contenido.

Los 22 slugs y las 25 plataformas son los mismos, en el mismo orden, con las
mismas claves; no sale ni entra ningún campo. No cambian las fuentes de las
ofertas ni las de las fichas, las características, las descripciones, los
resúmenes, las colecciones, los estados ni las imágenes.

### 4.1 Lo que cambia en todas (DECISIONES §1)

- `verificadaEl` (22) y `revisadaEl` (22) pasan al 11/11, con 7 días.
- Los 133 avisos pasan a `verificadaEl` 11/11. Cada uno está, tal cual o con
  su dato del día, en la propuesta del expediente de hoy.
- Los 63 datos de tarjeta (3 en cada una de las 21 fichas que los tienen;
  mTBILL no tiene) pasan a consulta del 11/11 con «Comprobado de nuevo en la
  fuente el 11/11/2026».
  - **He comprobado los 63:** cada uno tiene su misma dirección leída hoy en el
    expediente, con hora.
  - En Hausera el alcance decía «Redacción en castellano del dato comprobado en
    la fuente el 10/11/2026». Ahora dice «Comprobado de nuevo…»: su documento
    se volvió a descargar hoy a las 09:17:42 UTC.
- Plataformas: los 25 `verificadoEl` y las 142 fechas de consulta de sus
  fuentes pasan al 11/11. Nada más.

### 4.2 Por ficha

| Ficha | Qué cambia, además de las fechas | ¿En DECISIONES? |
|---|---|---|
| Spiko Letras Euro | 2,44 % → 2,41 %, con la VL fechada el 11/11. Cambian la rentabilidad (cifra y literal), la métrica «Rentabilidad publicada · 31 días · 11/11/2026» y la referencia (valor, fecha del dato y cálculo). | Sí (§2) |
| Spiko Letras Dólar | 4,09 % → 4,02 % en USD, con la VL del 10/11. Mismos campos. | Sí |
| Spiko Smart Cash | 2,84 %, ahora con la VL del 10/11 (antes, la del 09/11): literal, métrica y fecha del dato de la referencia. El aviso 2 se queda. | Sí. Montada a las 10:28 UTC, antes de las 19:30 (P1). Mi repetición de las 14:19 da los mismos bytes. |
| mTBILL | «Valor por token · 10/11/2026: 1,0777 USD (oráculo del emisor)». Sigue en `fuentes_en_conflicto`, con la rentabilidad en `null` y sin «lista blanca». | Sí. El acceso de la tarjeta, en §4.4. |
| Aktionariat | «Precio del emisor · 11/11/2026», «Supervisor (11/11/2026)» y el aviso «6,20 ZCHF frente a 7,25 CHF el 11/11/2026». Los tres textos de la tarjeta, iguales. | Sí (opción (a)) |
| Boss Info | «Supervisor (11/11/2026)», el aviso «venta más barata 8,40 ZCHF el 11/11/2026» y el mínimo «… (unos 17 ZCHF el 11/11)». El acceso y la salida, los publicados. | Sí |
| Switzerlend | Los dos avisos con dato del día, «Supervisor (11/11/2026)» y el mínimo «1 acción (68,01 CHF el 11/11)». El acceso y la salida, los publicados. | Sí |
| Brickwise (11) | **Mínimos:** Schwarzer Weg 65 → 69,90 € y Pottendorfer 74 → 73 €; las otras 9, solo la fecha. **Libro de órdenes**, con la lectura del 11/11 (09:16–09:20 UTC): «Venta más barata» en las 11 (Schwarzer Weg 69,90 €, orden del 27/10; Pottendorfer 73 €, orden del 11/11); «Mejor oferta de compra» en las 11 (Schwarzer Weg 35 → 60 €; Randhartingergasse 46 → 56 €); «Participaciones en venta» en 10, con el mismo número. | Sí: §2 (mínimos y mejor compra) y la indicación 4 del coordinador, «el resto solo re-fecha». Ver la recomendación 4. |
| Robinhood, Kraken, Prosegur y Hausera | Solo las fechas. | Sí |

Fuera de las fichas, cambian dos textos más:

- La `notaOrigen` del escaparate, que es un dato local y no va en el SQL: dice
  «puesta al día pedida por el responsable del proyecto» y «ninguna candidata
  admitida».
- El origen de la revisión (`rwadar_catalogo.revisiones.origen`): es el alcance
  del radar de hoy (DECISIONES §1).

### 4.3 Fuera de DECISIONES

**Ninguna diferencia.** Lo único que no está en el texto de DECISIONES, sino en
la indicación 4 del coordinador, es poner al 11/11 las referencias del libro de
órdenes de Brickwise que no cambian de valor (recomendación 4).

### 4.4 Lo que el montador no aplicó tal cual

Mi opinión, punto por punto:

1. **mTBILL, acceso de la tarjeta.** De acuerdo con no añadirlo.
   - La ficha publicada no tiene datos de tarjeta, y DECISIONES §1 conserva
     los publicados.
   - Mientras siga en `fuentes_en_conflicto`, la web y la app ocultan los tres
     datos («Sin comprobar si se puede contratar desde España»).
   - Lo que pide la indicación 1 está en el expediente, y `preparar-entrega.mjs`
     lo exige: el acceso «Sí: oferta pública en España para particulares»,
     «por qué destaca» sin la web y la lectura de `main-DWqV5Q2W.js` con su hora
     (09:26 UTC).
   - En la ficha sigue la referencia «Países de oferta según la web de Midas ·
     consulta 05/11/2026», con su fecha: es cierta y no cambia.
2. **Boss Info, «Última operación · 10/11/2026».** De acuerdo. DECISIONES no
   la re-fecha, y sigue siendo cierta con su fecha. El revisor de reventa la
   daba por buena con el 11/11; cambiarla cambia el SQL.
3. **Schwarzer Weg, «Participaciones en venta · 10/11/2026: 300».** De acuerdo.
   Re-fecharla con 300 sería falso (hoy hay 299, según el expediente y la tabla
   del revisor), y el 299 no está en DECISIONES. Cambiarla cambia el SQL.
4. **Expedientes suizos, el «antes» de `resumenTarjeta`.** La corrección está en
   `contraste-2026-11-11.json` (`expedientesSuizosCorregidos`). He comprobado
   que los nueve textos «publicado» de ahí son los que leyó hoy un visitante
   (`lectura-publica/`). Los expedientes siguen diciendo otra cosa (recomendación
   7). No afecta al SQL ni a `transparencia.json`: ninguna fecha de §5 depende
   solo de `cambiosRespectoPublicado`.
5. **Mínimo corto de Switzerlend en `transparencia.json`.** Sigue DECISIONES al
   pie de la letra (solo Brickwise). Ver la recomendación 3.
6. **Otras propuestas de los expedientes.** Bien que no entren: el SQL tiene
   las mismas 212 direcciones que la 2026-11-10.

## 5. `despues-de-aplicar.mjs` y `transparencia.json`

Por orden, en la copia:

1. **Antes de sincronizar:** exit 1, «el catálogo sincronizado no es la
   revisión 24b5f7de-…». `transparencia.json` no cambia (67e89ba3…2ea8).
2. **`sincronizar.js`**, con el REST simulado y lo que exporté de PGlite: exit
   0, «25 plataformas verificadas, 5 descartadas y 22 ofertas clasificadas» y
   `rwadar.csv` de 30 filas sin diferencias. Lo que exporté es igual a lo que
   exportó el montador, salvo los id que PGlite genera al azar.
3. **`despues-de-aplicar.mjs`:** exit 0.
   - «Comprobaciones de transparencia al 11/11: 43 de 44».
   - «Títulos de puntos fuertes … 11 de 11 pasan al 11/11».
   - 11 mínimos cortos de Brickwise (Schwarzer Weg «Desde 69,90 € la
     participación (11/11)», Pottendorfer «Desde 73 € …»).
   - `transparencia.json` queda en 1959f8be…c66b, el mismo SHA-256 que da el
     montador.
4. **Otra vez:** «Nada que cambiar: ya estaba hecho.», con el mismo SHA-256.
5. **El resto:**
   - `volcar-seed.js`: `02_seed.sql` sin diferencias;
   - `transparencia.mjs`: «22 ofertas con transparencia»;
   - `rwadar-fichas.js`: «Archivos actualizados: 55», con el manifiesto de
     fichas igual.

**Qué cambia en `transparencia.json`** (diferencia completa, hoja a hoja):

- `lote`, `revisionCatalogo` y `revisadoEl`;
- los 22 `verificadaEl`;
- 21 fechas de `supervisada` y 22 de `documentoEspana`;
- los 11 `minimoCorto` de Brickwise;
- los 11 títulos «Brickwise · mercado de reventa en la app (11/11/2026)».

Nada más: ni motivos, ni fuentes, ni otros mínimos o salidas.

**He comprobado una a una las 54 fechas de hoy** (43 comprobaciones y 11
títulos). Cada una tiene en el expediente de hoy la misma dirección y una
lectura con hora del 11/11: un registro o una afirmación con `consultadoUtc` de
hoy, o un documento descargado de nuevo hoy con su SHA-256. Ninguna se apoya
solo en `cambiosRespectoPublicado`. Estas son:

- **Brickwise:**
  - el registro 5003 de la CNMV a las 09:17:54 UTC (las 11 `supervisada`);
  - cada PDF con sus afirmaciones, de 09:17:10 a 09:17:24 (las 11
    `documentoEspana`);
  - el libro de órdenes de la app a las 09:20:24 (los 11 títulos).
- **Spiko:** la CNMV (n.º 5325) a las 09:19:47, los KID a las 09:16:14–09:16:15
  y la ficha de la SICAV en la CNMV a las 09:19:45 (Smart Cash).
- **Robinhood:** la CNMV (n.º 5299) a las 09:21:48 y el KID en español a las
  09:21:44.
- **Kraken:** la CNMV (n.º 4474) a las 09:22:44 y las condiciones finales LITEx,
  descargadas de nuevo a las 09:23:49 con el mismo SHA-256.
- **Prosegur:** el listado de la CNMV a las 09:24:19 y las condiciones a las
  09:24:42.
- **mTBILL:** la documentación legal de `docs.midas.app` a las 09:26:16
  (`documentoEspana`). Esa web sí se pudo leer; la que da 403 es `midas.app`.
- **Aktionariat:** FINMA a las 09:27:12 y su aviso legal a las 09:26:44.
- **Boss Info:** su portal a las 09:24:03 y `/invest` a las 09:24:15.
- **Switzerlend:** su página de inversores a las 09:26:48 (las dos).
- **Hausera:** el listado de plataformas de financiación participativa de la
  CNMV a las 09:28:55 y su documento de emisión a las 09:17:42.

Se queda con su fecha la `supervisada` de mTBILL (BaFin, 10/11): en el
expediente de hoy no hay ninguna lectura de la BaFin. Está bien así.

**Conclusión: no pone la fecha de hoy a ninguna comprobación que no se repitió
hoy.**

Dos notas, sin consecuencias para el SQL:

- El mínimo corto de Switzerlend sigue en «1 acción (68,01 CHF, 10/11)». La
  ficha dirá «1 acción (68,01 CHF el 11/11)», y en «Lo esencial» de la app
  saldrá la del 10/11. Las dos son ciertas. Ver la recomendación 3.
- El motivo de `documentoEspana` de Hausera dice «el 10/11/2026 la emisión aún
  no estaba inscrita», con consulta del 11/11. Es cierto, y DECISIONES §3 dice
  que hoy sigue sin inscribir. Ver la recomendación 8.

## 6. Datos personales y escáner de secretos

### Lo que ya está en Git (`HEAD` `61a4390`, con toda la carpeta del ciclo)

- **gitleaks** sobre el contenido de `HEAD` (`git archive`, 137,7 MB): «no
  leaks found».
- **Archivos:** no hay ningún PDF, HTML, imagen, `crudo/`, `.json.gz` ni
  `.inventario.jsonl` en Git. Los 344 archivos del ciclo son 247 `.txt`, 71
  `.json`, 14 `.md` y algunos `.mjs`, `.csv`, `.tsv` y `.xml`.
- **Lo generado** (el SQL, el escaparate, la documentación, el contraste, el
  radar, el informe, las pruebas, el ensayo y los scripts) no lleva correos,
  teléfonos, IBAN, DNI o NIE, JWT, prefijos de claves conocidos ni nombres de
  personas.
- **Lo que sí lleva:** tres direcciones públicas de contratos de token
  (Aktionariat, Boss Info y Switzerlend, ya publicadas), identificadores de
  empresas y el enlace público de Drive del documento de Hausera. Nada de eso
  salta en gitleaks.
- **Búsqueda de nombres** (tratamientos y cargos junto a un nombre propio) en los
  344 archivos del ciclo: solo 2 resultados, y los dos son nombres de calle (una
  de Madrid, en una copia de Securitize, y otra de Vaduz, en el registro de
  ESMA). La búsqueda no es exhaustiva: la pasada completa es de la revisión de
  cumplimiento.
- **El nombre de pila del responsable del proyecto** aparece en 4 documentos
  internos del ciclo: `DECISIONES-COORDINADOR.md`, `ENCARGO-INVESTIGADORES.md`,
  `grupos/reventa/resumen-reventa.md` y el expediente de la candidata
  `winvesta-verde-beach-sao-francisco-junior.json`. Es como en `AGENTS.md` y en
  el resto de `docs/`. No está en el SQL ni en los datos públicos
  (recomendación 9).

### Lo que se queda fuera de Git

- gitleaks sobre la carpeta del ciclo entera, también lo que Git ignora: 2.392
  avisos (`generic-api-key` y 2 `jwt`), **todos en archivos ignorados**. Son:
  - las respuestas de API en JSON (Brickwise, los `brokerbotsettings` de las
    suizas y los `page-data` de Hausera);
  - los HTML (Kraken, Securitize, Finexity, Switzerlend…);
  - las copias de Midas (`llms-full`, `main-DWqV5Q2W.js`).

  Son los falsos positivos que ya prevé el `.gitignore` del ciclo
  (identificadores, huellas y direcciones públicas). `git check-ignore` confirma
  que ninguno va a Git.
- **Después de aplicar:** lo que regenera el ensayo (las 52 fichas, el catálogo
  sincronizado de la web, `sitemap.xml`, `cambios.html`, `metodologia.html`,
  `transparencia.json` y su copia para la app) más la lectura REST «después de
  aplicar», con el mismo formato que `lectura-despues-de-aplicar/`. gitleaks
  sobre esos 68 archivos (2,4 MB): «no leaks found».

## Correcciones obligatorias

**Ninguna.**

## Recomendaciones (no bloquean)

1. **Antes de aplicar:**
   - confirmar que en `main` el SHA-256 de `aplicar-y-aprobar.sql` sigue siendo
     `dfeba195…a3cb`;
   - volver a leer como visitante: tiene que seguir publicada la `dfdc4c85`;
   - aplicar solo ese archivo con «Aplicar catálogo», nunca `catalogo.sql`;
   - hacerlo antes del 18/11 incluido, con margen (la guarda va en UTC).
2. **Puntos abiertos que cambian el SQL:** las 299 participaciones de Schwarzer
   Weg, la «Última operación · 11/11/2026» de Boss Info o un dato de tarjeta
   nuevo para mTBILL. Si el coordinador acepta alguno, hay que:
   - volver a ejecutar `preparar-entrega.mjs`;
   - repetir `comprobar-entrega.mjs` y el ensayo;
   - repetir esta revisión, porque el SHA-256 será otro.

   Mi consejo es dejarlos como están: lo montado es cierto, con su fecha.
3. **Mínimo corto de Switzerlend.** Si el coordinador quiere que la tarjeta de
   la lista y la ficha lleven la misma fecha (como se hizo el 10/11), basta con
   una línea en DECISIONES y este cambio en `despues-de-aplicar.mjs`. El dato se
   leyó hoy en `shares.lend.ch/invest` a las 09:24:51 UTC y el SQL no cambia.
   - Después del bucle de Brickwise:

     ```js
     {
       assert.equal(tarjeta('switzerlend', 'Mínimo de inversión'), '1 acción (68,01 CHF el 11/11)');
       assert.ok(['1 acción (68,01 CHF, 10/11)', '1 acción (68,01 CHF, 11/11)'].includes(antes.ofertas.switzerlend.minimoCorto));
       t.ofertas.switzerlend.minimoCorto = '1 acción (68,01 CHF, 11/11)';
     }
     ```

   - En `quita`, cambiar `if (slug in BRICKWISE) o.minimoCorto = 'F';` por
     `if (slug in BRICKWISE || slug === 'switzerlend') o.minimoCorto = 'F';`.
4. **Brickwise, para que conste.** Añadir a DECISIONES §2: «Referencias del
   libro de órdenes con la lectura del 11/11 (09:16–09:20 UTC): «Venta más
   barata», «Participaciones en venta» y «Mejor oferta de compra» pasan a
   «· 11/11/2026». Solo cambian de valor las de los mínimos y la mejor compra
   de arriba; «Participaciones en venta» de Schwarzer Weg se queda con su fecha
   del 10/11 (300).» No cambia el SQL.
5. **El paso «Leer el lote publicado» del flujo no sirve de prueba.** Ordena
   por id (`order by 1 desc limit 2`), así que no enseñará la `24b5f7de`. La
   prueba es la lectura pública de las vistas v2
   (`lectura-despues-de-aplicar/`).
6. **`despues-de-aplicar.mjs`, en lotes futuros:**
   - no contar siempre `cambiosRespectoPublicado` (`siempre = true`), sino
     exigir una lectura con hora de hoy;
   - comparar la ruta sin pasarla a minúsculas (salvo el `.aspx` de la CNMV).

   Hoy no afecta: las 54 fechas están comprobadas.
7. **Expedientes suizos.** Dejar escrito en DECISIONES que la corrección C1–C3
   está en `contraste-2026-11-11.json`. Otra opción es que quien pueda editar
   los expedientes añada en `cambiosRespectoPublicado` una nota fechada con el
   texto publicado. Así nadie leerá el «antes» equivocado como lo que se
   publicó.
8. **Hausera, en el próximo ciclo:** poner la fecha de la lectura en el motivo
   de `documentoEspana` («el 10/11/2026 …») y en los textos «(10/11)» del
   mínimo, si el coordinador vuelve a revisar la tarjeta. Hoy DECISIONES la
   deja igual.
9. **Nombre del responsable en 4 documentos internos del ciclo** (§6). Si la
   regla «ningún nombre de persona en Git» le incluye a él, hay que cambiarlo
   por «el responsable del proyecto». No toca el SQL.
10. **Generador, para el futuro.** La aprobación podría comprobar una huella de
    las filas de la revisión nueva, porque `on conflict do nothing` da por
    buenas las filas que ya existan. Hoy no hay riesgo: el id sale de la huella
    del contenido, `catalogo.sql` tiene los mismos bytes y el caso «ya importada
    como borrador» está probado.

## Lo que no hice

- No toqué Supabase ni ningún servicio remoto. Para gitleaks usé el paquete que
  ya estaba en el scratchpad, con el SHA-256 de `ci.yml`.
- No publiqué, no lancé flujos de GitHub y no hice commit ni push.
- No edité expedientes, informes de revisores ni ningún otro archivo. En la
  carpeta de trabajo solo escribí este.

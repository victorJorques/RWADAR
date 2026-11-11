# Entrega del catálogo 2026-11-11 · puesta al día del día

Preparada el 11/11/2026 por Claude (montador de datos y SQL), entre las 10:05
y las 10:35 UTC. **Nada aplicado en Supabase, nada publicado, sin OTA, ningún
flujo lanzado, sin push.** Estado: **preparada, revisada, corregida y probada
en local** (PGlite y tres ensayos completos de «después de aplicar» en copias
aparte). La revisó un equipo de tres (SQL e integridad: aprobado; contenido y
tarjetas, y cumplimiento: aprobados con cambios). Las dos correcciones
obligatorias (C1 y O1) están hechas desde las 15:20 UTC (§9) y **ninguna cambia
el SQL**: misma revisión, misma huella y mismo SHA-256. Falta el auditor.

Lo que entra es la lista cerrada de `DECISIONES-COORDINADOR.md` (SHA-256
`0f89547b…3224`), con las correcciones de los revisores de su §5. Los textos,
fuentes y fechas salen de `expedientes/` y de `revision-independiente/`. Sin
altas ni retiradas: las mismas **22 ofertas** (8 principales, 13 de reventa y
1 en camino) y **25 plataformas**. Hoy **no** se toca `public.plataformas` ni
`public.fuentes`. Las noticias no son parte de esta entrega.

## 1. Partida

- **Lo publicado.** Leído como visitante (REST de Supabase con la clave
  publicable, solo GET) el 11/11/2026 de 09:01:21 a 09:01:25 UTC, en
  `lectura-publica/`: revisión **`dfdc4c85-7f2f-fc4a-de27-a9f4a63f7656`**
  (entrega `2026-11-10`), 25 plataformas, 22 ofertas (8/13/1), verificadas el
  10/11, y 30 filas en `public.plataformas` (25 en el radar y 5 descartadas).
- `preparar-entrega.mjs` lo comprueba antes de cambiar nada:
  - la `2026-11-10` local da exactamente la revisión publicada y su huella
    `dfdc4c857f2ffc4ade27a9f4a63f7656ab4be9edc43d0037d0ad42fb94ac015f`, y su
    `revision.json` dice lo mismo (vigente hasta el 17/11);
  - el catálogo sincronizado de la web (`rwadar-site/assets/catalogo-publico-20261022.js`)
    es esa revisión (25/22, verificadas el 10/11);
  - lo leído hoy coincide con la base local: documentación, fuentes, colección,
    fecha, estado y avisos de las 22 ofertas; la verificación de las 25
    plataformas; y las filas de `public.plataformas`;
  - el radar de hoy: 69 de 69 fuentes (`radar-contraste-2026-11-11.json`, sin
    bloqueos), cada comprobación de `comprobaciones-fuentes.json` está en los
    literales capturados, y las dos de REGAFI se leyeron por su API pública
    (`cambios-radar.json`; copia del pasaporte con el mismo SHA-256 que el 10/11).

## 2. Revisión, huella, SHA-256 y vigencia

| Qué | Valor |
|---|---|
| Etiqueta | `2026-11-11` |
| Revisión nueva | **`24b5f7de-2834-3e15-6ae4-62a6d9565161`** |
| Huella (contenido) | `24b5f7de28343e156ae462a6d9565161d49d251cb45b9422b208c0fb0bceec22` |
| SHA-256 de `aplicar-y-aprobar.sql` | **`dfeba19516b2b688ddf4f8ad4ba1feb5049dbaae164b2d1abcee951ccb26a3cb`** |
| SHA-256 de `catalogo.sql` | `d8d7f12d31020476ae7c6cbe5c918f84d137c4254837fc049e64c4b2dd7e7add` |
| SHA-256 de `revision.json` | `03df931233bdc9ffae15ca3dc9228ffef1bd398cbf02953a454b6df879089d70` |
| Fichas | `verificadaEl` 11/11/2026 y 7 días: **último día vigente el 18/11/2026**; caduca el 19/11 |
| Radar | `verificadoEl` 11/11/2026, 69 fuentes (69/69) |

Una edición posterior del SQL invalida esta revisión y sus pruebas hasta
repetirlas.

## 3. Qué cambia (antes → ahora)

**En todas:** fecha de verificación 10/11 → 11/11, 7 días. Cada aviso
publicado se comprobó hoy (está tal cual, o con su dato del día, en la
propuesta del expediente) y pasa a `verificadaEl` 11/11. Los tres datos de la
tarjeta («Mínimo de inversión», «Acceso desde España», «Salida»/«Reembolso») se
conservan con consulta del 11/11, salvo los mínimos de abajo. No cambia ningún
estado de revisión, colección, fuente de oferta, resumen, descripción ni
imagen. En total, **63 cambios en 18 fichas** (`contraste-2026-11-11.json`).

### Spiko (métrica, literal y referencia)

| Ficha | Antes | Ahora | Cálculo |
|---|---|---|---|
| Letras del Tesoro Euro | 2,44 % (VL del 09/11) | **2,41 %** (VL fechada el 11/11, calculada por Spiko el 10/11) | (1,062738 / 1,060588)^(365/31) − 1 |
| Letras del Tesoro Dólar | 4,09 % en USD (VL del 09/11) | **4,02 %** en USD (VL del 10/11) | (1,102496 / 1,098694)^(365/32) − 1 (el 10/10 fue sábado) |
| Smart Cash Euro | 2,84 % (VL del 09/11) | **2,84 %** (VL del 10/11) | (1,016952 / 1,016874)^365 − 1 |

- El script recalcula las tres cifras con esos valores y falla si no salen.
- Métricas: «Rentabilidad publicada · 31 días · 11/11/2026: 2,41 %», «… · 10/11/2026 · en USD: 4,02 %» y «Rentabilidad publicada · neta y variable · 10/11/2026: 2,84 %».
- Referencias «Rentabilidad publicada · 31 días» y «Rendimiento neto publicado», con la fecha del dato y la consulta del 11/11.
- Smart Cash: el aviso 2 se mantiene (nadie confirma ni niega que se comercialice en España).
- **Condición de hora de Smart Cash (P1):** la entrega se montó a las 10:05–10:35 UTC del 11/11, antes de las 19:30 UTC; la VL del 10/11 vale.

### mTBILL

- «Valor por token · 09/11/2026: 1,0776 USD» → **«Valor por token · 10/11/2026: 1,0777 USD (oráculo del emisor)»**.
- Sigue en `fuentes_en_conflicto` y con la rentabilidad (APY) en `null`. Ningún texto dice «lista blanca» ni apoya el acceso en la web de Midas.
- La ficha publicada no tiene datos de tarjeta propios y la tarjeta sigue enmascarada («Sin mínimo vigente en euros · Sin comprobar si se puede contratar desde España · Salida no documentada»). Ver §6.1.

### Aktionariat, Boss Info y Switzerlend (opción (a): textos publicados)

- **Aktionariat:** «Precio del emisor · 10/11/2026» → «· 11/11/2026» (7,25 CHF, fijo); «Supervisor» con «FINMA (11/11/2026)»; aviso «… (6,20 ZCHF frente a 7,25 CHF el 11/11/2026).». Los tres textos de la tarjeta no llevan fecha y se quedan igual.
- **Boss Info:** «Supervisor» con «FINMA (11/11/2026)»; aviso «… (venta más barata 8,40 ZCHF el 11/11/2026).»; mínimo «100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF el 10/11)» → **«… (unos 17 ZCHF el 11/11)»**. Acceso y salida, los publicados.
- **Switzerlend:** los dos avisos con dato del día («… el 11/11/2026 la recompra seguía desactivada…» y «… (venta más barata 67,00 ZCHF el 11/11/2026).»); «Supervisor» con «FINMA (11/11/2026)»; mínimo «1 acción (68,01 CHF el 10/11)» → **«1 acción (68,01 CHF el 11/11)»**. Acceso y salida, los publicados.
- **El «antes» de los expedientes suizos (C1–C3), corregido al montar:** el montador no edita expedientes, así que la corrección está en `contraste-2026-11-11.json` (`expedientesSuizosCorregidos`): para cada una, el texto publicado (leído hoy como visitante), lo que proponía el expediente y lo que sale en la entrega. Por ejemplo, Aktionariat decía que solo cambiaban las fechas de «… (7,25 ZCHF el 10/11)» y «… (mejor compra 6,10 el 10/11)», pero lo publicado es «500 CHF por transferencia bancaria» y «Venta solo a otros accionistas; el emisor no recompra», y eso es lo que sale.

### Brickwise (11 de reventa)

| Ficha | Mínimo en la tarjeta (10/11 → 11/11) | Mejor compra en la ficha |
|---|---|---|
| Schwarzer Weg 18 (Graz) | 65 € → **69,90 €** | 35 € → **60 €** |
| Pottendorfer Straße 62 | 74 € → **73 €** | 19 € (igual) |
| Randhartingergasse 9 (Viena) | 78 € (igual) | 46 € → **56 €** |
| Las otras 8 | mismo precio, fecha 11/11 | igual, fecha 11/11 |

- Texto del mínimo: «Desde X € la participación en reventa (11/11)».
- Referencias del libro de órdenes («Venta más barata», «Participaciones en venta» y «Mejor oferta de compra»), con la lectura del 11/11 (API a las 09:16 UTC y app a las 09:20 UTC). Fuera de los cambios de la tabla, solo cambia la fecha. Excepción: ver §6.3.
- Acceso, salida, avisos, métricas, resumen y «Desistimiento»: sin cambios.

### Robinhood, Kraken xStocks, Prosegur Digital Gold y Hausera

- Sin cambios: solo las fechas (el script exige que no tengan ningún cambio
  anotado y PGlite que sean iguales a la `dfdc4c85` salvo las fechas, también en
  lo que la vista enmascara).
- Hausera: la tarjeta no cambia (sigue «Desde 100 € en Alicante 3, según su
  documento de emisión (10/11); la preventa abre el 18/11.»). La corrección de
  los 51.960 tokens de Alicante 2 está en el expediente (el script lo exige).

### Radar

- Solo la fecha (11/11), el alcance y la consulta de cada una de las 69 fuentes. Ninguna dirección ni texto cambia.

## 4. El SQL

`aplicar-y-aprobar.sql` (416.538 bytes) lleva **288 sentencias en una sola
transacción** `begin isolation level serializable; … commit;`:

| Bloque | Qué hace |
|---|---|
| `do $guarda$` (solo lee) | Exige que lo publicado sea la `dfdc4c85` (o ya la nueva), con su huella y aprobada; que el catálogo no esté retirado; que no sea antes del 11/11 ni después del **18/11**; y que la revisión nueva no exista con otra huella. |
| 284 `insert … on conflict do nothing` | Solo en `rwadar_catalogo`: 1 en `revisiones`, 25 en `plataformas`, 69 en `fuentes`, 107 en `plataforma_fuentes`, 25 en `alertas`, 35 en `alerta_fuentes` y 22 en `ofertas`. Todas de la revisión nueva; las mismas filas por tabla que la `2026-11-10`. |
| `do $aprobar$` | Comprueba 25 plataformas y 22 ofertas (8/13/1) y aprueba la revisión (solo `update rwadar_catalogo.revisiones`). Si no queda publicable o publicada, deshace todo. |

Sin DDL, borrados, permisos, Auth ni funciones. El texto del SQL no escribe en
`public.*`; al aprobar, como en todos los lotes, los disparadores mueven el
puntero `rwadar_catalogo.publicacion_v2` y tocan
`public.catalogo_publicacion.actualizado_el` (`retirado` sigue en `false`).
La cabecera y `aprobada_referencia` dicen «el responsable del proyecto», sin
nombres de personas.

## 5. Pruebas (salida real)

1. **`preparar-entrega.mjs`, dos veces seguidas** (10:28:45 UTC) → exit 0 las
   dos; las 8 salidas con el mismo SHA-256 las dos veces, y el mismo que en
   las ejecuciones anteriores (desde las 10:17 UTC), con y sin las dos
   candidatas de la búsqueda profunda que fueron apareciendo en `expedientes/`
   (no entran ni cambian nada):
   `radar-canonico-26.json` `0b8a0d3e…57b0`, `escaparate-publicacion.json`
   `367d0f8a…27c8`, `documentacion-ofertas.json` `aa1cc5b2…3df6`,
   `manifiesto-catalogo.json` `c2c51919…4224`, `contraste-2026-11-11.json`
   `a55ff884…9845`, `catalogo.sql` `d8d7f12d…7add`, `aplicar-y-aprobar.sql`
   `dfeba195…a3cb`, `revision.json` `03df9312…9d70`. Salida:
   `{"etiqueta":"2026-11-11","revisionId":"24b5f7de-2834-3e15-6ae4-62a6d9565161",…,"sha256":"dfeba195…a3cb","plataformas":25,"fuentesRadar":69,"ofertas":22,"colecciones":{"principales":8,"secundario":13,"en_camino":1},"cambios":63,"noAplicado":3}`.
2. **`comprobar-entrega.mjs --exportar=DIR`** (PGlite, cadena de producción
   hasta la `2026-11-10`) → `"resultado": "correcto"`, 19 comprobaciones y 6
   casos de fallo (`pruebas-locales.json`):
   - antes de aplicar, PGlite enseña lo mismo que la lectura pública de hoy;
   - idempotente (tablas y vistas iguales tras aplicarla dos veces);
   - `public.plataformas`, `public.fuentes`, cambios de estado, avisos y
     emisiones intactos; las 15 revisiones anteriores, tal cual (la `dfdc4c85`
     sigue aprobada);
   - publicada la `24b5f7de` con 25/22 (8/13/1), fechadas el 11/11;
   - los 63 cambios del contraste están en lo que se lee después, y lo de antes
     ya no; lo no aplicado sigue como estaba; todos los avisos con fecha del 11/11;
   - vigencia: el lector de la web lo acepta el 11/11 y el 18/11 y lo da por
     caducado el 19/11; el de la app acepta 25/22 con 1 en camino;
   - tarjetas (`resumenOferta`): el acceso desde España, la salida y el estado
     no cambian en ninguna; cambia solo el mínimo en 13 (las 11 de Brickwise,
     Boss Info y Switzerlend);
   - sincronizador real: 25/22/5, CSV de 30 filas idéntico al de la web, la
     lista cerrada de fichas de siempre (52 páginas), la de Spiko Euro dice
     2,41 % y la de Schwarzer Weg «Desde 69,90 € la participación en reventa (11/11)»;
   - fallan sin dejar nada: otra publicada (`88d5a757`: «Publicación distinta
     de la revisión anterior prevista…»), otra huella, catálogo retirado,
     destino con otra huella, aplicada después del último día («Lote caducado:
     sus fichas valían hasta el 18/11/2026. No aplicar este lote.») y una
     plataforma que falta («Catálogo incompleto: se conserva el lote anterior»);
     y si ya estaba importada como borrador, la aprueba sin duplicar filas.
3. **`despues-de-aplicar.mjs` antes de sincronizar** (carpeta de trabajo y
   copia) → exit 1: «el catálogo sincronizado no es la revisión
   24b5f7de-2834-3e15-6ae4-62a6d9565161: aplica antes el SQL y ejecuta node
   rwadar-app/sincronizar.js»; `transparencia.json` igual (`67e89ba3…2ea8`).
4. **Ensayo «después de aplicar»** en una copia aparte (`ensayo-despues.json`;
   hecho dos veces, mismo resultado):
   - `sincronizar.js` con el REST simulado → «25 plataformas verificadas, 5
     descartadas y 22 ofertas clasificadas. rwadar.csv regenerado: 30 filas.»
     (sin diferencias);
   - `despues-de-aplicar.mjs` → «Comprobaciones de transparencia al 11/11: 43
     de 44» (se queda en el 10/11 «supervisada» de mTBILL: la BaFin no se volvió
     a leer hoy); «Títulos de puntos fuertes … 11 de 11 pasan al 11/11»; 11
     mínimos cortos de Brickwise; repetido → «Nada que cambiar: ya estaba
     hecho.» (mismo SHA-256 `1959f8be…c66b`);
   - `volcar-seed.js` → «25 en el radar, 5 descartadas, 13 fuentes», sin
     diferencias;
   - `transparencia.mjs` → «22 ofertas con transparencia»; `rwadar-fichas.js`
     → «Archivos actualizados: 55»;
   - `npm test` con la lectura «después de aplicar» simulada (solo en la copia)
     → **exit 0 en 2 min 36 s**: base de datos 28 scripts «0 fallidas» (1.161
     comprobaciones), «30 comprobaciones SQL correctas, sin red», 11/11 y
     99/99; web 661 correctas y 0 fallidas, fichas y RSS 70, precarga 40; QR
     «Todo correcto»; móvil 525 de 527 (2 omitidas, 0 fallos); herramientas
     «fichas.json: 22 fichas (22 con foto), catálogo 2026-11-11-v2»,
     «Transparencia al día: 22 ofertas», «Diferencias: 0»; acceso 248/248.
   - «Lo esencial» de la app: Schwarzer Weg «Mínimo: Desde 69,90 € la
     participación (11/11) · España: Sin confirmar · Salida: Reventa en la app,
     si hay comprador».
   - Tras las correcciones se repitió todo en otra copia (§9): mismo resultado,
     salvo el mínimo corto de Switzerlend (C1); `transparencia.json` da
     `81e78ab9…3808` en vez de `1959f8be…c66b`. `ensayo-despues.json` y
     `pruebas-locales.json` ya son los de esa pasada.
5. **Datos personales:** ningún nombre de persona en lo que generé (scripts,
   SQL, escaparate, contraste, pruebas y ensayo). La documentación tiene las
   mismas apariciones que la publicada.

## 6. Lo que no se aplicó tal cual (y por qué)

1. **mTBILL, acceso de la tarjeta.** DECISIONES dice que el acceso de la
   tarjeta es «Sí: oferta pública en España para particulares», sin la frase de
   la web de Midas. Así está ya en el expediente (y «por qué destaca», sin la
   web; la lectura de `main-DWqV5Q2W.js` de las 09:26 UTC queda allí con su
   hora). Pero la ficha publicada de mTBILL **no tiene datos de tarjeta
   propios**. Por estar en «fuentes en conflicto», además, la web y la app
   ocultan los tres datos. DECISIONES §1 conserva los datos de tarjeta
   publicados, así que no se añade ninguno nuevo. La referencia antigua
   «Países de oferta según la web de Midas · consulta 05/11/2026» se queda con
   su fecha.
2. **Boss Info, «Última operación · 10/11/2026».** El expediente la re-fecha al
   11/11 (misma operación del 05/11). DECISIONES solo pasa al 11/11 «Precio del
   emisor», «Supervisor», los avisos con dato del día y el mínimo. Se queda con
   su fecha del 10/11: sigue siendo cierta.
3. **Schwarzer Weg, «Participaciones en venta».** El libro de hoy dice 299 (el
   10/11, 300), según el expediente y el revisor. DECISIONES no recoge ese
   cambio. Re-fecharla con 300 sería falso, así que se queda «Participaciones
   en venta · 10/11/2026: 300», cierta con su fecha. Las otras dos referencias
   del libro de esa ficha sí van con el 11/11.
4. **Expedientes suizos.** La indicación de corregir el «antes» de
   `cambiosRespectoPublicado` choca con la prohibición de editar expedientes.
   Se corrigió al montar, en `contraste-2026-11-11.json`
   (`expedientesSuizosCorregidos`), sin tocar los expedientes.
5. **Mínimo corto de Switzerlend en `transparencia.json`.** DECISIONES pone al
   día solo el de Brickwise. El de Switzerlend se queda en «1 acción (68,01 CHF,
   10/11)», mientras la ficha dirá «1 acción (68,01 CHF el 11/11)». Es el mismo
   precio, pero la tarjeta de la lista y la ficha llevarán fechas distintas: el
   10/11 la revisión de la entrega (C1) obligó a igualarlas. **Lo decide el
   coordinador**: es una línea en `despues-de-aplicar.mjs` y no cambia el SQL.
   *Resuelto:* la revisión de contenido lo hizo obligatorio (C1) y ya está
   aplicado (§9): la tarjeta dirá «1 acción (68,01 CHF, 11/11)».
6. **Propuestas de los expedientes fuera de DECISIONES:** no entran. Son las
   fuentes nuevas de las ofertas de Spiko (API y GECO) y de Brickwise. También
   los textos nuevos de tarjeta de Spiko, Robinhood, Kraken, Prosegur y
   Aktionariat, y el acceso y la salida nuevos de Boss Info y Switzerlend
   (opción (a)).
7. **Commit.** El encargo prohíbe `git commit`, pero las indicaciones del
   coordinador piden un commit local al terminar. Ante la contradicción, el
   montador no hizo ningún commit. La sesión que coordina ha ido guardando
   instantáneas de esta carpeta por su cuenta mientras se montaba (también
   durante las correcciones: 338c209, 17f2c01 y 8850b12).

## 7. Pendiente

- El auditor: que compruebe que las correcciones de §9 no colaron nada más.
- El coordinador decide los puntos 2 y 3 de §6 (el 5 ya está resuelto por la
  C1). Los dos cambian el SQL; si se cambian, hay que regenerar y repetir las
  pruebas y el ensayo. Los tres revisores aconsejan dejarlos como están.
- **Condiciones de hora si se vuelve a montar:**
  - Spiko Smart Cash: después de las 19:30 UTC del 11/11, la API dará la VL del
    11/11. Hay que volver a leerla y fechar con ella (P1).
  - mTBILL: el oráculo publica una ronda por día hábil (la del 10/11, a las
    18:40 UTC). Una ronda del 11/11 cambiaría el valor por token.
- Tras aplicar, guardar la lectura pública en `lectura-despues-de-aplicar/`
  **antes** de `npm test`: sin ella falla `ofertas-presentacion.test.cjs`.
- Traspaso en `docs/tareas/PARA-CODEX.md`: lo escribe el coordinador al cerrar
  el ciclo.

## 8. Pasos para aplicarla (ciclo autorizado por la orden del responsable del proyecto)

1. Confirmar que el SHA-256 de `aplicar-y-aprobar.sql` sigue siendo
   `dfeba195…a3cb`.
2. Antes del **18/11/2026**, volver a leer como visitante: tiene que seguir
   publicada la `dfdc4c85-7f2f-fc4a-de27-a9f4a63f7656`. Si no, parar. La guarda
   usa `current_date`, que en Supabase va en UTC: aceptaría el lote hasta la
   01:00 (hora de Madrid) del 19/11. Mejor aplicar con margen.
3. Aplicar exactamente `rwadar-app/data/importaciones/catalogo-2026-11-11-v2/aplicar-y-aprobar.sql`
   con el acceso autorizado («Aplicar catálogo»; una transacción; si falla, no
   seguir). Nunca `catalogo.sql`: no lleva guarda y solo crea un borrador.
4. Leer como visitante las vistas v2 y guardarlo en
   `lectura-despues-de-aplicar/`: revisión `24b5f7de-…`, 25/22 (8/13/1),
   `verificada_el` 11/11 y los cambios de §3. Esa lectura es la prueba de lo
   publicado: el paso «Leer el lote publicado» del flujo «Aplicar catálogo»
   ordena por id y puede no enseñar la `24b5f7de` (revisión de SQL).
5. `node rwadar-app/sincronizar.js`, luego
   `node rwadar-app/data/verificaciones/2026-11-11-v2/despues-de-aplicar.mjs`,
   `node rwadar-app/volcar-seed.js` (sin diferencias),
   `node rwadar-editorial-source/ofertas/transparencia.mjs`,
   `node rwadar-fichas.js` y `npm test`.
6. Publicar la web y **enviar la OTA**: la app lleva `transparencia.json`
   empaquetado (mínimos cortos de Brickwise y de Switzerlend).

## Archivos

- `preparar-entrega.mjs`, `comprobar-entrega.mjs`, `despues-de-aplicar.mjs` y
  `ensayo-rest-simulado.cjs` (copia exacta del de la `2026-11-10`).
- Salidas: `radar-canonico-26.json`, `escaparate-publicacion.json`,
  `documentacion-ofertas.json`, `manifiesto-catalogo.json`,
  `contraste-2026-11-11.json` y
  `rwadar-app/data/importaciones/catalogo-2026-11-11-v2/{catalogo.sql,aplicar-y-aprobar.sql,revision.json}`.
- Pruebas: `pruebas-locales.json` y `ensayo-despues.json`.

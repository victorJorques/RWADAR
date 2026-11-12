# Entrega del catálogo 2026-11-12 · puesta al día del día

Preparada el 12/11/2026 por Claude (montador de datos y SQL), entre las 01:00
y las 01:30 UTC. **Nada aplicado en Supabase, nada publicado, sin OTA, ningún
flujo lanzado, sin commit ni push.** Estado: **preparada y probada en local**
(PGlite y un ensayo completo de «después de aplicar» en una copia aparte).
Falta la revisión de la entrega (SQL, contenido y cumplimiento).

Lo que entra es la lista cerrada de `DECISIONES-COORDINADOR.md`, con las
correcciones obligatorias de los cuatro revisores. Los textos, fuentes y
fechas salen de `expedientes/` y de `revision-independiente/`. Sin altas ni
retiradas: las mismas **22 ofertas** (8 principales, 13 de reventa y 1 en
camino) y **25 plataformas**. Hoy **no** se toca `public.plataformas` ni
`public.fuentes`. Las noticias no son parte de esta entrega.

## 1. Partida

- **Lo publicado.** Leído como visitante (REST de Supabase con la clave
  publicable, solo GET) el 12/11/2026 de 00:30:28 a 00:30:32 UTC, en
  `lectura-publica/`: revisión **`24b5f7de-2834-3e15-6ae4-62a6d9565161`**
  (entrega `2026-11-11`), 25 plataformas, 22 ofertas (8/13/1), verificadas el
  11/11, y 30 filas en `public.plataformas` (25 en el radar y 5 descartadas).
- `preparar-entrega.mjs` lo comprueba antes de cambiar nada:
  - la `2026-11-11` local da exactamente la revisión publicada y su huella
    `24b5f7de28343e156ae462a6d9565161d49d251cb45b9422b208c0fb0bceec22`, y su
    `revision.json` dice lo mismo (vigente hasta el 18/11);
  - el catálogo sincronizado de la web (`rwadar-site/assets/catalogo-publico-20261022.js`)
    es esa revisión (25/22, verificadas el 11/11);
  - lo leído hoy coincide con la base local: documentación, fuentes, colección,
    fecha, estado y avisos de las 22 ofertas; la verificación de las 25
    plataformas; y las filas de `public.plataformas`;
  - el radar de hoy: 69 de 69 fuentes (`radar-contraste-2026-11-12.json`, sin
    bloqueos); cada comprobación de `comprobaciones-fuentes.json` está en los
    literales capturados; las dos de REGAFI se leyeron por su API pública a las
    00:37 UTC (`cambios-radar.json`), con las copias de `radar-manual/` (la del
    pasaporte, con el mismo SHA-256 que el 10 y el 11/11).

## 2. Revisión, huella, SHA-256 y vigencia

| Qué | Valor |
|---|---|
| Etiqueta | `2026-11-12` |
| Revisión nueva | **`7ad7ea72-d18e-4833-9f36-38f4a7ceaf25`** |
| Huella (contenido) | `7ad7ea72d18e48339f3638f4a7ceaf25fd3de7ed3f73cff8d30d0d294ca43474` |
| SHA-256 de `aplicar-y-aprobar.sql` | **`4815b3cb3c63501f3fb69fa3b0ac0318d9c32210d88539cfb7742254f667e7ff`** |
| SHA-256 de `catalogo.sql` | `71b126d075130aa5e09526502834b35f91bab42ea17eac92f2af3a05162d3fc6` |
| SHA-256 de `revision.json` | `3ac28c31a640b8dc5467f38013da5685fbe63a00ee91715eeefe073bd9b62c38` |
| Fichas | `verificadaEl` 12/11/2026 y 7 días: **último día vigente el 19/11/2026**; caduca el 20/11 |
| Radar | `verificadoEl` 12/11/2026, 69 fuentes (69/69) |

Una edición posterior del SQL invalida esta revisión y sus pruebas hasta
repetirlas.

## 3. Qué cambia (antes → ahora)

**En todas:** fecha de verificación 11/11 → 12/11, 7 días. Cada aviso
publicado se comprobó hoy (está tal cual, o con su dato del día, en la
propuesta del expediente) y pasa a `verificadaEl` 12/11. Los tres datos de la
tarjeta («Mínimo de inversión», «Acceso desde España», «Salida»/«Reembolso») se
conservan con consulta del 12/11, salvo los mínimos de abajo. No cambia ningún
estado de revisión, colección, fuente de oferta, resumen, descripción ni
imagen. En total, **83 cambios en 17 fichas** (`contraste-2026-11-12.json`).

### Spiko

- **Letras del Tesoro Euro (2,41 %) y Dólar (4,02 % en USD):** sin cambios.
  El script comprueba que la API da los mismos ficheros que ayer (yield
  `9cc1e1be…` y `1bbc7629…`; VL de 1,062738 € del 11/11 y de 1,102496 $ del
  10/11). Solo cambia la fecha de verificación. Ver §6.1.
- **Smart Cash Euro:** sigue en **2,84 %**, ahora con la VL del 11/11
  (1,017029 €; la API da 0.0284 en sus tres plazos).
  - Métrica: «Rentabilidad publicada · neta y variable · 10/11/2026» →
    **«… · 11/11/2026: 2,84 %»**.
  - Literal: el del expediente (confirmado por el revisor, «fecha y
    explicación»): «Tipo que publica Spiko, ya descontadas sus comisiones, con
    el valor liquidativo del 11/11/2026 (consultado el 12/11/2026); la web lo
    presenta como el tipo que paga cada día el banco con el que el fondo tiene
    el swap. …». Ver §6.2.
  - Referencia «Rendimiento neto publicado»: dato del 11/11, consulta del 12/11
    (data.spiko.io, que el expediente leyó hoy a las 00:36 UTC) y un alcance
    con las mismas palabras del literal nuevo.
  - El aviso 2 (nadie confirma en un registro que este fondo se venda en
    España) se mantiene.
- **Condición de hora:** la entrega se montó entre las 01:00 y las 01:30 UTC
  del 12/11, antes de las 18:00 UTC: valen las VL de hoy. Si se vuelve a
  montar después, hay que leer otra vez la API pública de Spiko.

### mTBILL

- **Métrica nueva: «Rentabilidad pasada · 5 semanas hasta el 10/11/2026 · en
  USD: 3,45 % anual»** (opción A del revisor). El script la recalcula con las
  rondas 468 (06/10/2026 14:16:11 UTC, 1,07410723 USD) y 492 (10/11/2026
  18:40:23 UTC, 1,07768132 USD) de la copia del revisor: 35,18 días y 3,452 %
  simple. No 3,53 % (el script falla si esa cifra aparece en un texto nuevo).
- **Aviso nuevo** (texto exacto de DECISIONES): «La rentabilidad es pasada y la
  calcula RWAdar con el valor que publica el emisor (del 06/10 al 10/11/2026):
  está en dólares, no descuenta el 0,07 % del reembolso inmediato ni el cambio
  euro/dólar, y no garantiza la futura.»
- **Fuera de la ficha** las dos referencias antiguas de midas.app: «APY
  observado: 3,41 %» (21/09) y «Rendimiento publicado en Midas: 3,42 % · 7D
  APY» (30/09).
- Sigue en `fuentes_en_conflicto`, con el valor por token en 1,0777 USD (10/11)
  y la **rentabilidad (campo) en `null`**: ver §6.3. La vista pública sigue
  tapando las métricas; el aviso sí se ve.

### Aktionariat, Boss Info y Switzerlend (textos publicados de acceso y salida)

- **Aktionariat:** «Precio del emisor · 11/11/2026» → «· 12/11/2026» (7,25 CHF,
  fijo); «Supervisor» con «FINMA (12/11/2026)»; aviso «… (6,20 ZCHF frente a
  7,25 CHF el 12/11/2026).». Los tres textos de la tarjeta no llevan fecha y se
  quedan igual.
- **Boss Info:** «Supervisor» con «FINMA (12/11/2026)»; aviso «… (venta más
  barata 8,40 ZCHF el 12/11/2026).»; mínimo **«100 CHF por transferencia al
  emisor; en cripto, desde 2 acciones (unos 17 ZCHF el 12/11)»**.
  - **«Última operación · 10/11/2026» → «· 12/11/2026»** (corrección C1 del
    revisor): fuente `https://shares.bossinfo.com/` (la publicada; no la API
    POST `getTrades`, que da 405 en un navegador). El alcance dice lo que se
    comprobó hoy (el portal, el historial igual byte a byte que el del 11/11 y
    la operación en cadena del 05/11/2026 a las 13:35:35 UTC) y que el importe
    de 8,2404 ZCHF del vendedor se comprobó el 10/11 y hoy no se releyó.
- **Switzerlend:** los dos avisos con dato del día («… el 12/11/2026 la recompra
  seguía desactivada…» y «… (venta más barata 67,00 ZCHF el 12/11/2026).»);
  «Supervisor» con «FINMA (12/11/2026)»; mínimo **«1 acción (68,01 CHF el
  12/11)»**.

### Brickwise (11 de reventa)

| Ficha | Mínimo en la tarjeta (11/11 → 12/11) | Orden de menor importe (nueva, con el 1,5 %) |
|---|---|---|
| Fotovoltaica Cohotel | 110 € → **102 €** | 1 a 102 € (103,53 €) |
| Fotovoltaica GreenPoint | 100 € → **102 €** | 1 a 102 € (103,53 €) |
| Pottendorfer Straße 62 | 73 € → **80 €** | 1 a 115 € (**116,73 €**) |
| Klagenfurt | 95 € (igual) | 1 a 95 € (**96,43 €**) |
| Plüddemanngasse 101 | 75 € (igual) | 1 a 99 € (**100,49 €**) |
| Hinterstoder 50 | 75 € (igual) | 1 a 90 € (91,35 €) |
| Drautalresidenz | 70 € (igual) | 1 a 84 € (85,26 €) |
| Randhartingergasse 9 | 78 € (igual) | 1 a 78 € (79,17 €) |
| Schwarzer Weg 18 | 69,90 € (igual) | 1 a 69,90 € (70,95 €) |
| Sonnleithnergasse 2 | 75 € (igual) | 1 a 80 € (81,20 €) |
| Stallhofstraße 28 | 68,80 € (igual) | 1 a 68,80 € (69,83 €) |

- Texto del mínimo: «Desde X € la participación en reventa (12/11)».
- **Aviso común nuevo en las 11** (texto exacto de DECISIONES), justo antes del
  de «Los precios y el libro de órdenes cambian a diario»: «Cada venta se
  anuncia con su precio y su número de participaciones; no consta que se pueda
  comprar solo una parte. El comprador paga además un 1,5 % de comisión.»
- **Importes con el 1,5 %:** los tres de DECISIONES, bien redondeados (96,43,
  100,49 y 116,73 €; el expediente decía 96,42, 100,48 y 116,72). El script
  calcula los 11 en céntimos enteros (0,005 sube) y los cruza con el libro de
  órdenes de hoy (`grupos/brickwise/fuentes/libro-ordenes-resumen-2026-11-12.json`).
- Referencias del libro de órdenes, con la lectura de hoy (API a las 00:32:59
  UTC y app a las 00:35 UTC): «Venta más barata» y «Mejor oferta de compra» al
  12/11 en las 11; «Participaciones en venta» al 12/11 donde la cifra no cambia
  (7 fichas). El script comprueba orden a orden que cada texto que se re-fecha
  sigue siendo exacto en el libro de hoy. Excepciones: §6.4 y §6.5.
- Acceso, salida, métricas, resumen y «Desistimiento»: sin cambios.

### Hausera (solo re-fechas de lo consultado hoy)

- Aviso «… El 10/11/2026 Alicante 3 aún no estaba inscrita en el registro de la
  CNMV.» → «El 12/11/2026 …» (ERIR de Ursus-3 leído hoy a las 00:33 UTC).
- Mínimo «Desde 100 € en Alicante 3, según su documento de emisión (10/11); la
  preventa abre el 18/11.» → «(12/11)» (documento releído hoy, mismo SHA-256).
- «Historial publicado · 10/11/2026» → «· 12/11/2026» (portada leída hoy a las
  00:39:52 UTC: mismas cifras, 42 operaciones, 24 terminadas, 128 M€).
- No se tocan las fechas que son hechos: «Alicante 2 ya figuraba como
  financiada el 10/11/2026, antes de su oferta pública del 11/11» (aviso y
  resumen).

### Robinhood, Kraken xStocks, Prosegur Digital Gold y Spiko Letras

- Sin cambios: solo las fechas. El script exige que no tengan ningún cambio
  anotado y PGlite, que sean iguales a la `24b5f7de` salvo las fechas, también
  en lo que la vista enmascara.

### Radar

- Solo la fecha (12/11), el alcance y la consulta de cada una de las 69
  fuentes. Ninguna dirección ni texto cambia.

### Después de aplicar (`despues-de-aplicar.mjs`, en `transparencia.json`)

- Revisión, lote y fecha al 12/11; fecha del 12/11 en las comprobaciones y en
  los títulos de los puntos fuertes **solo** donde el expediente de hoy volvió a
  consultar esa misma fuente (43 de 44: se queda en el 10/11 la «supervisada»
  de mTBILL, porque hoy no se releyó la BaFin; 11 de 11 títulos).
- Mínimos cortos que salen del texto largo del catálogo sincronizado: los 11 de
  Brickwise («Desde 102 € la participación (12/11)» en Cohotel y GreenPoint,
  «Desde 80 €…» en Pottendorfer; los otros 8, solo la fecha), Switzerlend
  «1 acción (68,01 CHF, 12/11)» y Hausera «Desde 100 € en Alicante 3 (12/11)»
  (§6.6). Nada más.
- Se niega a tocar nada si el catálogo sincronizado no es la `7ad7ea72`.

## 4. El SQL

`aplicar-y-aprobar.sql` (425.865 bytes) lleva **288 sentencias en una sola
transacción** `begin isolation level serializable; … commit;`:

| Bloque | Qué hace |
|---|---|
| `do $guarda$` (solo lee) | Exige que lo publicado sea la `24b5f7de` (o ya la nueva), con su huella y aprobada; que el catálogo no esté retirado; que no sea antes del 12/11 ni después del **19/11**; y que la revisión nueva no exista con otra huella. |
| 284 `insert … on conflict do nothing` | Solo en `rwadar_catalogo`: 1 en `revisiones`, 25 en `plataformas`, 69 en `fuentes`, 107 en `plataforma_fuentes`, 25 en `alertas`, 35 en `alerta_fuentes` y 22 en `ofertas`. Todas de la revisión nueva; las mismas filas por tabla que la `2026-11-11`. |
| `do $aprobar$` | Comprueba 25 plataformas y 22 ofertas (8/13/1) y aprueba la revisión (solo `update rwadar_catalogo.revisiones`). Si no queda publicable o publicada, deshace todo. |

Sin DDL, borrados, permisos, Auth ni funciones. El texto del SQL no escribe en
`public.*`; al aprobar, como en todos los lotes, los disparadores mueven el
puntero `rwadar_catalogo.publicacion_v2` y tocan
`public.catalogo_publicacion.actualizado_el` (`retirado` sigue en `false`).
La cabecera y `aprobada_referencia` dicen «el responsable del proyecto», sin
nombres de personas.

## 5. Pruebas (salida real)

1. **`preparar-entrega.mjs`, dos veces seguidas** (01:22:03 UTC) → exit 0 las
   dos; las 8 salidas con el mismo SHA-256 en la primera y en la segunda
   ejecución, y la misma línea por pantalla: `radar-canonico-26.json`
   `0c9ca7db…5ac1`, `escaparate-publicacion.json` `06212b6a…2ab3`,
   `documentacion-ofertas.json` `27a8db3f…f858`, `manifiesto-catalogo.json`
   `c2c51919…4224`, `contraste-2026-11-12.json` `cf479743…9dd9`, `catalogo.sql`
   `71b126d0…3fc6`, `aplicar-y-aprobar.sql` `4815b3cb…e7ff`, `revision.json`
   `3ac28c31…2c38`. Salida:
   `{"etiqueta":"2026-11-12","revisionId":"7ad7ea72-d18e-4833-9f36-38f4a7ceaf25",…,"sha256":"4815b3cb…e7ff","plataformas":25,"fuentesRadar":69,"ofertas":22,"colecciones":{"principales":8,"secundario":13,"en_camino":1},"cambios":83,"noAplicado":10}`.
   - Hubo una primera versión (revisión `115dc783`, SHA `73a79fbc…d200`, también
     reproducible y con todo el ensayo en verde). La cambié yo antes de
     entregarla: el alcance de la referencia de Smart Cash llevaba una cifra que
     calculaba RWAdar («con la VL del 11/11 eso da 2,80 % anualizado») y que
     DECISIONES no publica (§4 pide además decir que esa cifra es capitalizada).
     Ahora ese alcance usa las mismas palabras del literal del expediente. Es el
     único cambio; todo lo de abajo es de la versión final.
2. **`comprobar-entrega.mjs --exportar=DIR`** (PGlite, cadena de producción
   hasta la `2026-11-11`, en la copia aparte, 01:22:24 UTC) → `"resultado": "correcto"`, 19
   comprobaciones y 6 casos de fallo (`pruebas-locales.json`):
   - antes de aplicar, PGlite enseña lo mismo que la lectura pública de hoy;
   - idempotente (tablas y vistas iguales tras aplicarla dos veces);
   - `public.plataformas`, `public.fuentes`, cambios de estado, avisos y
     emisiones intactos; las 16 revisiones anteriores, tal cual (la `24b5f7de`
     sigue aprobada);
   - publicada la `7ad7ea72` con 25/22 (8/13/1), fechadas el 12/11;
   - los 83 cambios del contraste están en lo que se lee después, y lo de antes
     ya no; lo no aplicado sigue como estaba; todos los avisos con fecha del 12/11;
   - vigencia: el lector de la web lo acepta el 12/11 y el 19/11 y lo da por
     caducado el 20/11; el de la app acepta 25/22 con 1 en camino;
   - tarjetas (`resumenOferta`): el acceso desde España, la salida y el estado
     no cambian en ninguna; cambia solo el mínimo en 14 (las 11 de Brickwise,
     Boss Info, Switzerlend y Hausera); mTBILL sigue «Sin mínimo vigente en
     euros · Sin comprobar si se puede contratar desde España · Salida no
     documentada» (fuentes en conflicto);
   - sincronizador real: 25/22/5, CSV de 30 filas idéntico al de la web, la
     lista cerrada de fichas de siempre (52 páginas, todas cambian por la
     revisión y las fechas); la ficha de Smart Cash lleva el 2,84 % con la VL
     del 11/11, la de Cohotel «Desde 102 € la participación en reventa (12/11)»,
     la de Pottendorfer 116,73 € y el aviso común, y la de mTBILL ya no tiene
     los APY antiguos;
   - fallan sin dejar nada: otra publicada (`dfdc4c85`: «Publicación distinta
     de la revisión anterior prevista…»), otra huella, catálogo retirado,
     destino con otra huella, aplicada después del último día («Lote caducado:
     sus fichas valían hasta el 19/11/2026. No aplicar este lote.») y una
     plataforma que falta («Catálogo incompleto: se conserva el lote anterior»);
     y si ya estaba importada como borrador, la aprueba sin duplicar filas.
3. **`despues-de-aplicar.mjs` antes de sincronizar** (carpeta de trabajo y
   copia) → exit 1: «el catálogo sincronizado no es la revisión
   7ad7ea72-d18e-4833-9f36-38f4a7ceaf25: aplica antes el SQL y ejecuta node
   rwadar-app/sincronizar.js»; `transparencia.json` igual (`81e78ab9…3808`).
4. **Ensayo «después de aplicar»** en una copia aparte (`git clone` de esta
   carpeta en 1b632af, con los archivos de la entrega encima, idénticos a los de
   aquí; `ensayo-despues.json`), de 01:22 a 01:25 UTC:
   - `sincronizar.js` con el REST simulado → «Sincronizado desde Supabase: 25
     plataformas verificadas, 5 descartadas y 22 ofertas clasificadas.» y
     «rwadar.csv regenerado: 30 filas.» (sin diferencias en el CSV);
   - `despues-de-aplicar.mjs` → exit 0: «Comprobaciones de transparencia al
     12/11: 43 de 44» (se queda en el 10/11 la «supervisada» de mTBILL: la BaFin
     no se volvió a leer hoy); «Títulos de puntos fuertes … 11 de 11 pasan al
     12/11»; los 11 mínimos cortos de Brickwise, «Mínimo corto de Switzerlend:
     «1 acción (68,01 CHF, 12/11)»» y «Mínimo corto de Hausera: «Desde 100 € en
     Alicante 3 (12/11)»». `transparencia.json` → `c4edf956…3ad4`. Repetido →
     «Nada que cambiar: ya estaba hecho.» (mismo SHA-256);
   - `volcar-seed.js` → «02_seed.sql regenerado: 25 en el radar, 5 descartadas,
     13 fuentes.», sin diferencias;
   - `transparencia.mjs` → «Transparencia escrita: 22 ofertas con
     transparencia»; `rwadar-fichas.js` → «Archivos actualizados: 55» (ninguna
     ficha nueva ni retirada);
   - **`npm test`** con la lectura «después de aplicar» simulada (solo en la
     copia) → **exit 0 en 2 min 32 s**: base de datos, 28 scripts con «0
     fallidas» (1.161 comprobaciones), «30 comprobaciones SQL correctas, sin
     red», 11/11 y 103/103; web, «672 correctas, 0 fallidas», 70 verificaciones
     de páginas y RSS y 40 de precarga; QR, «Todo correcto: el código se lee.»;
     móvil, 582 de 584 (2 omitidas, 0 fallos); herramientas, «fichas.json: 22
     fichas (22 con foto), catálogo 2026-11-12-v2», «Transparencia al día: 22
     ofertas con transparencia» y «Diferencias: 0»; acceso, 250/250.
   - **Lo que verá el inversor en la app** («Lo esencial» y la tarjeta, con el
     código de la app): frente a ayer cambian 13 fichas y solo en el mínimo.
     Cambia el precio en Cohotel («Mínimo: Desde 102 € la participación (12/11)
     · España: Sin confirmar · Salida: Nominal en 2038; antes, reventa»),
     GreenPoint (102 €) y Pottendorfer («Desde 80 € la participación (12/11)»);
     solo la fecha en las otras 8 de Brickwise, en Switzerlend («Mínimo 1 acción
     (68,01 CHF, 12/11) · España Sí») y en Hausera («Desde 100 € en Alicante 3
     (12/11)»). Las otras 9 dicen lo mismo; mTBILL sigue «Mínimo: No verificado
     · España: Sin confirmar · Salida: Sin documentar».
5. **Datos personales:** ningún nombre de persona en lo que generé (scripts,
   SQL, escaparate, contraste, pruebas y ensayo). La documentación tiene las
   mismas apariciones que la publicada (ninguna nueva).

## 6. Lo que no se aplicó tal cual (y por qué)

1. **Spiko Letras Euro y Dólar, literal de la rentabilidad.** Los expedientes
   cambian «consultado el 11/11/2026» por «consultado el 12/11/2026».
   DECISIONES dice «sin cambios… Solo cambia la fecha de verificación». La
   cifra, la VL y la fuente son las de ayer (mismos ficheros), así que el
   literal publicado sigue siendo cierto con su fecha de consulta, igual que
   la referencia «Rentabilidad publicada · 31 días».
2. **Smart Cash, forma del literal.** DECISIONES cita «valor liquidativo del
   11/11/2026; consultado el 12/11/2026», con el punto y coma del literal
   publicado. Se usa el literal del expediente, que el revisor confirma
   («actualizar (fecha y explicación)»): dice lo mismo con paréntesis. Cambiar
   solo las fechas del publicado dejaría «lo que creció el fondo en su último
   día de cálculo, pasado a un año», y con la VL del 11/11 eso da **2,80 %**
   capitalizando y 2,76 % a ritmo simple, no 2,84 % (el script lo calcula; esas
   cifras no se publican).
3. **mTBILL, campo `rentabilidad`.** DECISIONES dice «null → 3,45 % anual en
   USD» y, a la vez, que siga en `fuentes_en_conflicto`. El contrato del
   catálogo (`validarOferta`: «una oferta bloqueada conserva cifras
   comerciales») y la base de datos (`estado_revision = 'actual' or
   (rentabilidad is null and precio is null)`) no admiten una rentabilidad en
   una ficha que no esté «actual». Así que la cifra entra como **métrica**
   («Rentabilidad pasada · 5 semanas hasta el 10/11/2026 · en USD: 3,45 %
   anual») y la ventana va en el aviso nuevo. El literal del revisor («entre el
   06/10/2026 (1,07410723 USD) y el 10/11/2026 (1,07768132 USD), 5 semanas»)
   no tiene sitio. La vista pública tapa las métricas mientras dure el
   conflicto, como prevé DECISIONES; el aviso se ve.
   - Tampoco entran los datos de tarjeta de mTBILL que propone el expediente
     (la ficha publicada no los tiene; DECISIONES no los añade).
4. **«Participaciones en venta» de cuatro fichas de Brickwise.** El libro de hoy
   dice Cohotel 59 (11/11: 65), GreenPoint 347 (351), Pottendorfer 106 (107) y
   Schwarzer Weg 299 (10/11: 300). DECISIONES solo recoge los mínimos, el aviso
   común y los importes con el 1,5 %. Re-fecharlas con la cifra vieja sería
   falso, así que se quedan con su fecha (ciertas con ella), como hizo el 11/11
   con Schwarzer Weg.
5. **Tres referencias del libro con otra redacción y las mismas cifras.** El
   expediente escribe «… en 3 órdenes de 5, 10, 1» (Klagenfurt) y «… en 2
   órdenes de 20, 1» (Randhartingergasse), y en Hinterstoder la mejor compra
   como «20,00 € (1 participación, orden del 19/05/2025)». Ahí el precio no
   cambia y «solo cambia la fecha»: se re-fecha el texto publicado, que el
   libro de hoy sostiene. En Hinterstoder, además, lo publicado es más exacto:
   a 20 € hay 2 órdenes (1 y 3 participaciones).
6. **Mínimo corto de Hausera en `transparencia.json`.** La indicación (6) del
   coordinador nombra los mínimos cortos de Brickwise y de Switzerlend.
   DECISIONES §2 re-fecha al 12/11 lo que se consultó hoy, y el documento de
   emisión se releyó: la ficha dirá «(12/11)». Si el corto se quedara en
   «(10/11)», la tarjeta y la ficha tendrían fechas distintas, lo que la C1 del
   11/11 hizo obligatorio igualar. Por eso pasa a «Desde 100 € en Alicante 3
   (12/11)». Es una línea de `despues-de-aplicar.mjs` y no cambia el SQL; el
   coordinador puede quitarla.
7. **Otras propuestas de los expedientes fuera de DECISIONES:** no entran.
   Son las fuentes nuevas de las ofertas (API de Spiko, Brickwise y Midas) y
   los textos nuevos de tarjeta de Spiko, Robinhood, Kraken y Prosegur.
8. **`cambios-radar.json`.** Su cabecera conserva `"fecha": "2026-11-11"` y la
   nota del 11/11 (se copió del día anterior); sus dos lecturas sí son de hoy
   (métodos «12/11/2026 a las 00:37 UTC»). El montaje no edita los archivos del
   coordinador: el script acepta las dos fechas en la cabecera y exige el
   contenido. La salida no depende de ello.
9. **Commit.** El encargo prohíbe `git commit`, aunque las indicaciones del
   coordinador piden un commit local al terminar. Ante la contradicción, el
   montador no hizo ningún commit (como el 11/11).

## 7. Pendiente

- La revisión de la entrega (SQL, contenido y cumplimiento) y su auditor.
- El coordinador decide los puntos 3, 4 y 6 de §6. El 4 cambia el SQL; si se
  cambia, hay que regenerar y repetir las pruebas y el ensayo.
- Corregir la cabecera de `cambios-radar.json` (§6.8).
- **Condiciones de hora si se vuelve a montar:**
  - Spiko: a las 18:00 UTC de hoy llega la VL nueva de las Letras y a las
    19:30 UTC la cifra de Smart Cash. Hay que volver a leer la API pública.
  - mTBILL: una ronda nueva del oráculo cambiaría el valor por token (no la
    métrica de 5 semanas hasta el 10/11).
- Tras aplicar, guardar la lectura pública en `lectura-despues-de-aplicar/`
  **antes** de `npm test`: sin ella falla `ofertas-presentacion.test.cjs`.
- Traspaso en `docs/tareas/PARA-CODEX.md`: lo escribe el coordinador al cerrar
  el ciclo.

## 8. Pasos para aplicarla (ciclo autorizado por la orden del responsable del proyecto)

1. Confirmar que el SHA-256 de `aplicar-y-aprobar.sql` sigue siendo
   `4815b3cb…e7ff`.
2. Antes del **19/11/2026**, volver a leer como visitante: tiene que seguir
   publicada la `24b5f7de-2834-3e15-6ae4-62a6d9565161`. Si no, parar. La guarda
   usa `current_date`, que en Supabase va en UTC: aceptaría el lote hasta la
   01:00 (hora de Madrid) del 20/11. Mejor aplicar con margen.
3. Aplicar exactamente `rwadar-app/data/importaciones/catalogo-2026-11-12-v2/aplicar-y-aprobar.sql`
   con el acceso autorizado («Aplicar catálogo», etiqueta `2026-11-12`; una
   transacción; si falla, no seguir). Nunca `catalogo.sql`: no lleva guarda y
   solo crea un borrador.
4. Leer como visitante las vistas v2 y guardarlo en
   `lectura-despues-de-aplicar/`: revisión `7ad7ea72-…`, 25/22 (8/13/1),
   `verificada_el` 12/11 y los cambios de §3.
5. `node rwadar-app/sincronizar.js`, luego
   `node rwadar-app/data/verificaciones/2026-11-12-v2/despues-de-aplicar.mjs`,
   `node rwadar-app/volcar-seed.js` (sin diferencias),
   `node rwadar-editorial-source/ofertas/transparencia.mjs`,
   `node rwadar-fichas.js` y `npm test`.
6. Publicar la web y **enviar la OTA**: la app lleva `transparencia.json`
   empaquetado (mínimos cortos de Brickwise, Switzerlend y Hausera).

## Archivos

- `preparar-entrega.mjs`, `comprobar-entrega.mjs`, `despues-de-aplicar.mjs` y
  `ensayo-rest-simulado.cjs` (copia exacta del de la `2026-11-11`).
- Salidas: `radar-canonico-26.json`, `escaparate-publicacion.json`,
  `documentacion-ofertas.json`, `manifiesto-catalogo.json`,
  `contraste-2026-11-12.json` y
  `rwadar-app/data/importaciones/catalogo-2026-11-12-v2/{catalogo.sql,aplicar-y-aprobar.sql,revision.json}`.
- Pruebas: `pruebas-locales.json` y `ensayo-despues.json`.

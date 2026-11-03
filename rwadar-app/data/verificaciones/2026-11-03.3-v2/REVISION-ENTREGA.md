# Revisión independiente · entrega 2026-11-03.3 (solo lectura)

**Veredicto: `aprobado_con_cambios`.** El SQL y la guarda están bien, y el radar
también. Spiko y los avisos cambiados están respaldados. Hay que corregir dos
textos nuevos antes de aplicar (ver §6): el «mínimo» de las 11 fichas de reventa
de Brickwise y el aviso de desistimiento de BILLA.

- Revisión `9bec5ff9-4744-58c3-5026-929cafb86427` (hash `9bec5ff9…b6c7ebe55651ef5b497a14cbd9f9094e`).
- Guarda sobre la publicada `62dca2f9-8a9b-0dae-bef9-82fbda910280` (entrega 2026-11-03.2).
- SHA-256 de `aplicar-y-aprobar.sql`: `ed07ceca38bb63607da9a26a13dcb8e07f633dae3f6c187644bc6b3e07e0a2db`.
- SHA-256 de `catalogo.sql`: `6f92f02954783dc45cfeb4f0d8964a5db3a85c71b0124f501f9fa53e106ecaff`.
- Revisor: Claude, 03/11/2026. No preparé esta entrega. Todo en local: sin red
  hacia Supabase, sin publicar y sin comandos git que cambien nada.

## 1. Qué ejecuté y qué salió

| Comprobación | Resultado |
|---|---|
| `node …/comprobar-entrega.mjs` (PGlite) | Código 0. Dio `"resultado": "correcto"` con el SHA-256 `ed07ceca…`. Reescribe `pruebas-locales.json` solo con una hora nueva; lo devolví al original y `git status` quedó limpio. |
| `preparar-entrega.mjs` en modo comparación (copia en el scratchpad que compara en vez de escribir) | Los 8 archivos que genera son **idénticos** byte a byte a los del lote: radar, escaparate, documentación, manifiesto, contraste, los dos SQL y `revision.json`. La base del 2026-11-03.2 da `62dca2f9`. |
| `comprobar-radar.mjs` con la captura `capturas-2026-11-03.3.json` (copia que escribe en el scratchpad) | Da `69/69 fuentes dicen lo que respaldan`, con un contraste idéntico byte a byte al del lote. |
| Rentabilidades de Spiko recalculadas con la serie de valor liquidativo de la API (copia del grupo) | EUTBL: 1,059941 (01/10) → 1,062097 (02/11), 32 días, **2,345 %**. USTBL: 1,097946 (02/10) → 1,101564 (02/11), 31 días, **3,950 %**. La API dice `monthlyYield "0.0234"` y `"0.0395"`, y la web en español 2,34 % y 3,95 %. |
| Precios de Brickwise frente al render del marketplace de la revisión independiente | Los 11 coinciden. La app los rotula **«Preis pro Anteil ab € X»**, es decir, precio por participación. |

## 2. Inventario del SQL

Separé las sentencias respetando comillas y bloques `$…$`, y las clasifiqué
por su forma y su tabla de destino. No me limité a buscar palabras.

### `aplicar-y-aprobar.sql`: 294 sentencias

| N.º | Sentencia | Tabla | Notas |
|---:|---|---|---|
| 1 | `begin isolation level serializable` | — | |
| 1 | `do $guarda$` | lee `rwadar_catalogo.publicacion_v2` y `public.catalogo_publicacion` (las dos `for update`) y `rwadar_catalogo.revisiones` | Solo `select` y `raise`. |
| 1 | `insert … values … on conflict (id) do nothing` | `rwadar_catalogo.revisiones` | Esperadas: 26 / 23 / `{"principales":6,"secundario":14,"en_camino":3}` |
| 69 | `insert … values … on conflict (revision_id,id) do nothing` | `rwadar_catalogo.fuentes` | Todas `primaria = true` y `consultada_el = '2026-11-03'`. |
| 26 | `insert … select … from public.plataformas where slug=… on conflict do nothing` | `rwadar_catalogo.plataformas` | Los mismos 26 slugs que en la entrega .2. |
| 109 | `insert … select … on conflict do nothing` | `rwadar_catalogo.plataforma_fuentes` | |
| 26 | ídem | `rwadar_catalogo.alertas` | |
| 36 | ídem | `rwadar_catalogo.alerta_fuentes` | |
| 23 | `insert … values … on conflict (revision_id,slug) do nothing` | `rwadar_catalogo.ofertas` | `verificada_el '2026-11-03'` y `vigencia_dias 7` en las 23. |
| 1 | `do $aprobar$` | cuenta en `plataformas` y `ofertas`; `update rwadar_catalogo.revisiones set estado='aprobada' … where id = v and estado = 'borrador'`; comprueba `rwadar_catalogo.revision_publicable_v2` | Exige 26 plataformas, 23 ofertas y 6/14/3. Si no, lanza un error y se deshace todo. |
| 1 | `commit` | — | |

- **Revisión de cada inserción.** Las 290 inserciones llevan
  `'9bec5ff9-…'::uuid` como primer valor. Solo hay dos UUID en todo el
  archivo: `9bec5ff9` (293 veces) y `62dca2f9` (1 vez, en la guarda).
- **`catalogo.sql`.** Tiene 292 sentencias: `begin`, las mismas 290
  inserciones (idénticas línea a línea a las del aplicador) y `commit`. No
  aprueba nada.
- **Lo que no hay** fuera de los literales: `create`, `alter`, `drop`,
  `delete`, `truncate`, `grant`, `revoke`, `policy`, `function`, `auth.`,
  `set role`, `execute` ni `copy`. Tampoco DDL, borrados, permisos, Auth ni
  funciones.
- **Efectos indirectos esperados.** La aprobación activa dos disparadores que
  ya existen en `rwadar_catalogo.revisiones`; el lote no los crea:
  - `fijar_publicacion_v2` mueve el puntero de `publicacion_v2` a la revisión
    nueva;
  - `sincronizar_publicacion_catalogo` pone `public.catalogo_publicacion.retirado = false`,
    que la guarda ya exige.

  Los disparadores de avisos (`cambios_estado`, `plataformas_cambio_estado`)
  no se activan, porque `public.plataformas` solo se lee.
- **Respecto de la entrega .2.**
  - Las partes que no son inserciones solo cambian en los UUID, el hash, los
    comentarios y el texto de `aprobada_referencia`.
  - Las inserciones de fuentes, plataformas y alertas son idénticas, salvo la
    revisión y la fecha.
  - En `ofertas` solo cambian `revision_id` y `verificada_el` (las 23), además
    de `avisos` y `documentacion`. `rentabilidad` cambia en 2 fichas y
    `metricas` en 7. No cambian `disponible_es`, `estado_revision`,
    `coleccion` ni `resumen`.

### La guarda, punto por punto

| Requisito | Cómo lo cumple |
|---|---|
| Transacción serializable | `begin isolation level serializable`; bloquea con `for update` el puntero y el control de retirada. |
| La publicada es exactamente 62dca2f9 o la nueva | `actual is null or actual not in (62dca2f9, 9bec5ff9)` → error. PGlite comprueba el rechazo con otra revisión y su `rollback`. |
| El catálogo no está retirado | `retirada is distinct from false` → error. También salta si falta la fila. |
| Fecha | `current_date < '2026-11-03'` → error. |
| Identidad | Si 9bec5ff9 ya existe con otro hash o en estado retirada → error. |
| Idempotencia | Todo usa `on conflict do nothing` y el `update` filtra por `estado = 'borrador'`. PGlite aplica el lote dos veces y las vistas salen idénticas. |
| Recuentos | 26 / 23 / 6 / 14 / 3 antes de aprobar, y además el filtro de `revision_publicable_v2`. |

**Observación (no bloquea).** La guarda no tiene fecha tope. Si se aplicara
después del 10/11, las fichas entrarían ya caducadas: la web ocultaría las
cifras y la prueba da «caducada» el 11/11. Ver R9.

## 3. Diferencias con el lote 2026-11-03.2, campo a campo

### Escaparate

- **Plataformas (26).** Solo cambian `verificadoEl` y 145 `consultadaEl`, de
  02/11 a 03/11. El radar canónico es idéntico salvo fechas y alcance (mismos
  ids y mismas URL).
- **Ofertas.** Son las mismas 23, en el mismo orden y las mismas colecciones
  (6/14/3). Todas pasan a `verificadaEl 2026-11-03` y `vigenciaDias 7`, y
  todos los avisos llevan `verificadaEl 2026-11-03`. El resto de cambios:

| Ficha | Cambio | Respaldo | Dictamen |
|---|---|---|---|
| Spiko EUR | 2,35 % → **2,34 %**; métrica «· 02/11/2026»; literal «publicado por Spiko el 02/11/2026» | expediente: `monthlyYield "0.0234"` de las 17:06 del 02/11; revisión B.1; mi cálculo, 2,345 % | Correcto |
| Spiko USD | 4,13 % → **3,95 %**; métrica «· 02/11/2026 · en USD» | expediente; revisión B.2; mi cálculo, 3,950 % | Correcto |
| Aktionariat | métrica «Precio del emisor · 03/11/2026» con 7,25 CHF; Supervisor «no figura en el registro de FINMA (03/11/2026)»; aviso con 6,20 ZCHF frente a 7,25 CHF el 03/11 | expediente: claims `supervision`, `precio` y venta a 6,20 (356 acciones) | Correcto |
| Boss Info | Supervisor FINMA; aviso de acceso: «solo publica una lista de países vetados… sin España, pero no dice que la oferta se dirija al EEE» | expediente: `accesoEspana` respaldado con alcance y `cambiosRespectoPublicado` | Correcto |
| Switzerlend | Supervisor «…afiliada a PolyReg solo a efectos de blanqueo»; aviso nuevo de recompra desactivada | expediente (`settings()=0x5`, 0,0318 ZCHF); revisión B.4 | Correcto. Se mantiene el aviso «La salida depende de compradores…», que es compatible. |
| mF-ONE | aviso: «El 03/11/2026 solo funcionaba la suscripción instantánea… la suscripción por solicitud estaba pausada» | revisión B.5 (`fnPaused(depositRequest)=true`) | Correcto; recoge el matiz del revisor. |
| Stallhofstraße | «La API da dos fechas de fin del alquiler (02/02/2022 y 31/03/2027)…» | revisión B.3 corrige la fecha del expediente (01/02 → **02/02/2022**) | Correcto; aplica la corrección. |
| Randhartingergasse | «Según la API, el inquilino se fue el 28/02/2026 y se busca otro…» | expediente y revisión B.3 («gekündigt und endet am 28.02.2026. Es wird ein Nachmieter gesucht») | Correcto. La redacción del revisor es más exacta (R7). |
| BILLA | «Suscrito / umbral… (API 03/11/2026)»; aviso con 82 suscritas (1,64 %); aviso nuevo de 14 días | expediente: 82 de 5.000 son el 1,64 %; Rücktrittsbelehrung | Cifras correctas. **El aviso de 14 días está incompleto (C2).** |
| Casa de Outeiro | «Recaudado · 03/11/2026»; aviso «tenía fin el 31/10/2026 y el 03/11/2026 no mostraba días restantes ni ampliación…» | expediente y revisión B.7 (`end_date 2026-10-31`, `extend_days null`) | Correcto |
| `fuente.notaOrigen` y las demás notas | Fechas y texto del ciclo, con Kraken y Spiko Smart Cash rechazadas | `kraken-xstocks.md`, la addenda y la revisión A | Correcto; no hay altas. |

### Documentación de las fichas

- **Las 23.** Pasan a `revisadaEl 2026-11-03`. Solo Switzerlend cambia
  `fuentes`: añade `brokerbotsettings?ticker=LENDS`.
- **Las 5 principales con tres datos ya publicados** (Spiko EUR y USD,
  Robinhood, Prosegur y Aktionariat). Conservan valor, fuente y fecha del dato.
  Cambian `fechaConsulta` (02/11 → 03/11) y el alcance («Comprobado de nuevo…
  mismo documento»). Los expedientes lo respaldan: los mismos SHA-256 o el
  mismo contenido. Spiko EUR mantiene «clase EUTBL… otras clases pueden tener
  otro mínimo».
- **Spiko.** Se quitan las referencias antiguas de rentabilidad (2,17 % y 2,36
  % en EUR, y las de la consulta del 01/11 en las dos clases). Se añade
  «Rentabilidad publicada · 31 días». El expediente EUR lo pide. Siguen
  algunas referencias fechadas del 30/09 y del 22/10 (valor liquidativo y
  patrimonio): no son falsas porque llevan su fecha (R6).
- **Datos de tarjeta nuevos.**
  - Tres en cada una de las 11 fichas de reventa de Brickwise y en BILLA.
  - Dos en Casa de Outeiro, Boss Info, Switzerlend y mF-ONE.
  - La fuente de cada uno coincide con la fuente primaria del expediente o
    con un documento suyo (los comprobé uno a uno).

### Lo que no cambió y conviene saber

- **Lo que propone el expediente y el lote no recoge.** No contradice nada:
  - Robinhood, métrica «Salida» con 24/5 (R1);
  - Hausera, resumen con la fecha del 03/11 (R4);
  - Boss Info, «nadie compra al emisor desde el 29/06/2026» (R10);
  - BILLA, fila «Plazo de suscripción». El aviso «El plazo publicado terminó
    el 16/05/2026…» ya lo cubre.
- **Contradicciones.** No encontré ninguna cifra ni aviso que contradiga los
  expedientes.

## 4. Textos de tarjeta nuevos

Esta es la tabla que imprime `comprobar-entrega.mjs`, con el texto completo
que verá el inversor el 03/11:

| Ficha | Mínimo | España | Salida |
|---|---|---|---|
| aktionariat | 500 CHF por transferencia bancaria | Disponible desde España según la fuente | Venta solo a otros accionistas; el emisor no recompra |
| spiko EUR / USD | 1 € / 1 USD | Disponible desde España según la fuente | Reembolso diario, corte 11:30 (París)… |
| robinhood | 1 € | Disponible desde España según la fuente | Cierras la posición con Robinhood Europe (24/5…); puede suspenderse |
| prosegur | 1 gramo de oro | Disponible desde España según la fuente | Solo recompra por Prosegur; 1 a 7 días hábiles; puede suspenderse |
| 11 de reventa de Brickwise | **Desde 69,90 / 70 / 72 / 75 / 78 / 80 / 95 / 100 / 110 € en reventa (03/11)** | Sin comprobar desde España | Sin reembolso: vendes en el tablón…; Pottendorfer: primera cancelación a los 15 años; fotovoltaicas: devolución del nominal el 31/12/2038, subordinada |
| BILLA | 1.000 € (10 participaciones de 100 €) | Sin comprobar desde España | Si no llega a 500.000 €, te devuelven el dinero; si se emite, cancelable a los 5 años o reventa en la app |
| casa-de-outeiro | 2.000 € (80 acciones de 25 €) | Sin comprobar desde España | Si no se llega a 2 M€, te devuelven el dinero; si sale, solo podrás vender un 2,5 % de tus acciones al año de 2027 a 2030 |
| boss-info | 100 CHF por transferencia bancaria | Sin comprobar desde España | El emisor no recompra ahora; vendes a otros accionistas en ZCHF si hay comprador |
| switzerlend | 1 acción (68,01 CHF el 03/11) | Sin comprobar desde España | El emisor no recompra hoy (su web dice lo contrario)… |
| mf-one | No documentado en euros | No disponible desde España según la fuente | Reembolso al emisor solo para direcciones en lista blanca |
| mtbill / hausera | Sin mínimo vigente / No documentado | Sin comprobar | Salida no documentada |

### «Disponible desde España»

Solo lo dicen las 5 principales con acceso confirmado en su expediente
(`disponibleEs: confirmado`).

- **Brickwise.** La referencia dice «Sin confirmar: …abre cuenta a residentes
  del EEE (España incluida), pero no confirma que esta emisión se distribuya en
  España». El lector la convierte en «Sin comprobar». Coincide con el alcance
  del expediente.
- **Sin referencia de acceso.** Casa de Outeiro, Boss Info y Switzerlend no la
  tienen y quedan en «Sin comprobar». En Casa de Outeiro es más prudente que
  el expediente, que la da por confirmada.
- **mF-ONE** queda en «No disponible», un texto prudente (R3).

### Comprobados frente a los expedientes, sin promesas

- **Fechas y documentos.**
  - BILLA: 1.000 € en tramos de 100 €, umbral de 500.000 € y cancelación a
    los 5 años.
  - Casa de Outeiro: la ficha de datos v5 dice «del 10 % en paquetes del 2.5 %
    anual» de 2027 a 2030.
  - Fotovoltaicas: el KID dice «Beendigungszeitpunkt: 31.12.2038».
  - Pottendorfer: §10.2, rescisión a los 15 años, para el inversor y para el
    emisor.
- **Datos técnicos.** Boss Info, 100 CHF (`bankTransferLimit min 100`), y
  Switzerlend, `min 0` y 68,01 CHF.

### Fallo: el mínimo de las 11 fichas de reventa (C1)

- **Qué dicen las fuentes.**
  - Los 11 expedientes proponen «Sin mínimo publicado; la venta más barata era
    de X € por participación» y dejan como bloqueo: «No se sabe si una orden
    se puede comprar en parte».
  - La app rotula la cifra «Preis pro Anteil ab» (precio por participación).
  - La norma de Víctor pone como ejemplo «**1 participación desde 78 € en
    reventa (03/11)**».
- **Qué publica el lote.** «Desde 78 € en reventa (03/11)», con la etiqueta
  «Mínimo de inversión». Así se lee como la inversión mínima, que nadie
  documenta.
- **Por qué importa.** El lector descarta a propósito como mínimo cualquier
  valor que diga «por participación» (`ficha-editorial-20261022.js`, línea
  78), y este texto se salta esa protección. En Cohotel, la venta más barata
  es una sola orden de 35 participaciones, de 2025.
- **El arreglo** es la fórmula de la norma, que el lector acepta (§6).

## 5. Radar y compuertas

### Radar

- **Fuentes.** Las 69 quedan con `consultadaEl 2026-11-03` y `primaria: true`.
  En la captura, las 69 tienen consulta del 03/11, entre las 10:04:57 y las
  10:49:55 UTC.
- **Contraste.** `radar-contraste-2026-11-03.json` dice `fecha 2026-11-03`,
  `fuentes 69`, `correctas 69` y `bloqueos []`. Su SHA-256 `1e7b0198…`
  coincide con el que cita `contraste-2026-11-03.3.json`, y lo reproduje byte
  a byte.

### paxg-occ leída con WebFetch: aceptable, con reparos

- **A favor.**
  - La URL final es la oficial (`occ.treas.gov/…/trust-by-name.pdf`):
    respuesta 200 y `application/pdf`.
  - La captura guarda el SHA-256 `90b526aa1814ab6bcdd584809fb8ab3592c3837f0465e1bb85689eab74fa9b1d`
    y una nota de por qué hizo falta. El intento anterior falló: «la respuesta
    no es un PDF».
  - El texto extraído (11.441 caracteres) dice «Trust Banks Active As of
    9/30/2026» y «25379 Paxos Trust Company, National Association… New York
    NY».
  - Lo corrobora `paxg-web`, leída con navegador el mismo día: «regulated by
    the Office of the Comptroller of the Currency (OCC)».
- **Reparos.**
  - No hay copia del PDF en disco (busqué un archivo con ese SHA-256 y no
    existe), así que el hash no se puede volver a comprobar.
  - La captura vive en el scratchpad, fuera de Git.
  - En el contraste, `capturadoEl` sale `null` en las 69 fuentes, porque el
    script lee `capturadoEl` u `hora` y la captura usa `consultada`.

  Ninguno bloquea (R8).

### Compuertas CSP

En el escaparate, la documentación, el radar, el manifiesto y los dos SQL hay
**0** coincidencias de `<style`, `style=`, `on…=` (con espacio previo o sin
él), `<script` y `<` + letra. La única coincidencia con `javascript:` es la
frase «La portada se lee con JavaScript:» del detalle de ARTEX. Ya estaba
publicada y la compuerta del publicador (`rwadar-publicar.js`) no la mira.

## 6. Cambios obligatorios (texto exacto)

### C1 · Mínimo de las 11 fichas de reventa de Brickwise

En `preparar-entrega.mjs`, bloque `REVENTA_BW`:

1. Línea 162. Cambiar el valor:
   - antes: ``R('Mínimo de inversión', `Desde ${precio} € en reventa (${FES.slice(0, 5)})`, BW_APP, FECHA,``
   - después: ``R('Mínimo de inversión', `1 participación desde ${precio} € en reventa (${FES.slice(0, 5)})`, BW_APP, FECHA,``
2. Línea 163. Cambiar la nota por esta:

   `'Precio por participación de la venta más barata del tablón de la app ese día («Preis pro Anteil ab»), más un 1,5 % de comisión. Brickwise no publica un mínimo en reventa ni si una orden se puede comprar en parte. El precio lo fija cada vendedor y cambia a diario. No es el precio de emisión.'`

**Valores resultantes:**

| Ficha | Mínimo |
|---|---|
| vivienda-pluddemanngasse-101-graz | «1 participación desde 80 € en reventa (03/11)» |
| vivienda-sonnleithnergasse-2-viena | «1 participación desde 75 € en reventa (03/11)» |
| local-de-estanco-klagenfurt | «1 participación desde 95 € en reventa (03/11)» |
| vivienda-stallhofstra-e-28-gratwein | «1 participación desde 69,90 € en reventa (03/11)» |
| vivienda-schwarzer-weg-18-graz | «1 participación desde 69,90 € en reventa (03/11)» |
| drautalresidenz-paternion | «1 participación desde 70 € en reventa (03/11)» |
| randhartingergasse-9-viena | «1 participación desde 78 € en reventa (03/11)» |
| apartamento-vacacional-hinterstoder-50 | «1 participación desde 72 € en reventa (03/11)» |
| vivienda-pottendorfer-stra-e-62-wr-neustadt | «1 participación desde 78 € en reventa (03/11)» |
| fotovoltaica-greenpoint | «1 participación desde 100 € en reventa (03/11)» |
| fotovoltaica-cohotel | «1 participación desde 110 € en reventa (03/11)» |

**Ensayo.** En `comprobar-entrega.mjs`, línea 82, cambiar
`/^(Desde \d|1\.000 €)/` por `/^(1 participación desde \d|1\.000 €)/`.

### C2 · Aviso de desistimiento de BILLA

En `preparar-entrega.mjs`, línea 128, el aviso:

- antes: `'Tienes 14 días para desistir de la suscripción, según su documento de desistimiento.'`
- después: `'Puedes desistir de la suscripción en 14 días, salvo que antes te entreguen los tokens; es un derecho que da el emisor y no existe en la reventa.'`

**Por qué.** La Rücktrittsbelehrung del 10/07/2026 dice: «Die Rücktrittsfrist
endet jedoch vorzeitig, … sobald die Emittentin die gezeichneten tokenisierten
Wertpapiere an dich ausgegeben hat». Añade que no hay desistimiento en el
mercado secundario y que es un derecho que concede el emisor. Así lo recogen
el expediente y la revisión B.3.

### Después de los cambios

1. Volver a ejecutar `preparar-entrega.mjs` y `comprobar-entrega.mjs`.
   Cambiarán la revisión, el hash y el SHA-256. La guarda sigue exigiendo
   `62dca2f9`.
2. Comprobar que la diferencia con este lote se reduce a las 11 referencias
   de mínimo y al aviso de BILLA.
3. Que un revisor confirme esa diferencia antes de aplicar.

## 7. Recomendados (no bloquean)

- **R1 · Robinhood, métrica «Salida».** Pasar a «Vendes a Robinhood en la
  app, 24/5; puede suspender el cierre», como propone el expediente. Hoy dice
  «en días de mercado de EE. UU.», distinto de la fila de la tarjeta.
- **R2 · Spiko EUR y USD, métrica «Supervisor».** Pasar a «AMF (fondo) · SICAV
  inscrita en la CNMV, n.º 2380». El número es de la SICAV (revisión, «Otros
  hallazgos»).
- **R3 · mF-ONE, alcance de «Acceso desde España» y «Salida».**
  - Qué falla: `llms-full.txt` no nombra mF-ONE ni dice «exempt». Eso sale de
    la web (`main-*.js`) y del contrato en cadena.
  - Alcance propuesto: «La documentación de Midas exige alta manual y lista
    blanca para las estrategias reservadas a profesionales; que mF-ONE sea una
    de ellas lo muestran el contrato (lista blanca activa el 03/11/2026) y la
    web («Exempt offer»).»
- **R4 · Hausera, resumen.** Cambiar «El 02/11/2026 anunciaba» por «El
  03/11/2026 anunciaba».
- **R5 · Sonnleithnergasse.** Escribir la fecha en el aviso como «vence el
  29/11/2026», no «2026-11-29».
- **R6 · Spiko EUR.** Quitar o marcar como históricas las referencias del
  30/09 y del 22/10 (valor liquidativo 1,0597 y patrimonio 467,94 M EUR), como
  pide el expediente.
- **R7 · Randhartingergasse.** Redacción propuesta: «Según Brickwise, el
  inquilino rescindió y el alquiler terminó el 28/02/2026; se busca otro. La
  rentabilidad no se muestra.»
- **R8 · Radar.**
  - Guardar el PDF de la OCC, o su `.txt` con el SHA-256, en las fuentes del
    ciclo.
  - Hacer que `comprobar-radar.mjs` lea `consultada` para rellenar
    `capturadoEl`.
- **R9 · Guarda del aplicador.** Añadir una fecha tope:
  `if current_date > date '2026-11-10' then raise exception 'Lote caducado'; end if;`.
- **R10 · Boss Info.** Aviso propuesto por el expediente: «Nadie ha comprado
  al emisor desde el 29/06/2026.»

## 8. Límites de esta revisión

- No comprobé en remoto que la publicada sea hoy `62dca2f9`: la guarda lo
  exige al aplicar.
- No volví a leer las fuentes en internet. Me apoyé en las copias del ciclo,
  en las de la revisión independiente y en las respuestas crudas que hay en
  disco.
- No edité ningún archivo salvo este informe. `pruebas-locales.json` quedó
  como estaba y `git status` está limpio.

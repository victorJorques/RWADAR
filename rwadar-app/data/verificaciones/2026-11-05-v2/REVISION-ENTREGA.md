# Revisión independiente · entrega 2026-11-05 (solo lectura)

**Veredicto: `aprobado_con_cambios`.** El SQL está bien y se puede aplicar tal
cual: solo escribe en `rwadar_catalogo`, la guarda exige la publicada
`723968ce` con su huella y todo lo que cambia en las fichas está en
DECISIONES, respaldado por el revisor de su grupo y, en los cambios críticos
que abrí yo, por la fuente de hoy. Hay **dos cambios obligatorios que no tocan
el SQL** (ver §7): el mínimo corto de las 11 fichas de reventa de Brickwise en
`despues-de-aplicar.mjs` y la forma de unir la rama a `main` (su historial
lleva copias con nombres de personas sin recortar).

- Revisión `8fe33ec4-725a-9a32-783c-e9c383aad49d` (huella `8fe33ec4725a9a32783ce9c383aad49d6432735caa6c923177dac4104baee826`).
- Guarda sobre la publicada `723968ce-00f7-7f42-b3e3-6c7f401b8f89` (entrega 2026-11-04.2), huella `723968ce00f7…5c5337585`.
- **SHA-256 de `aplicar-y-aprobar.sql`: `294db508c79bac83400a4c5367cd923736a4406f7fb944475629c69746483778`.**
- SHA-256 de `catalogo.sql`: `d953d66841cde2ab6eb14b5c67a4fd119beab32673e2bf1a708f42d24f90c35e`; de `revision.json`: `35dd1d176f896ed3507eadd908d72645b01d662bef721625dbaadcaf0ef8d765`.
- Revisor: Claude, 05/11/2026, de 09:05 a 09:30 UTC. No preparé esta entrega.
  Sin tocar Supabase, sin publicar, sin push. Solo he escrito este informe;
  `pruebas-locales.json` quedó como estaba y `git status` sigue limpio.

## 1. Qué ejecuté y qué salió

| Comprobación | Resultado |
|---|---|
| `preparar-entrega.mjs` en modo comparación (copia en mi scratchpad que compara en vez de escribir) | Los **8 archivos** que genera son **idénticos byte a byte** a los del lote: radar, escaparate, documentación, manifiesto, contraste, los dos SQL y `revision.json`. Da 139 cambios anotados y la base 2026-11-04.2 da la `723968ce` con su huella. |
| `comprobar-entrega.mjs --exportar=…` (PGlite, sin red) | Código 0 en 27 s: `"resultado": "correcto"`, 18 comprobaciones y 5 casos de fallo, con el SHA-256 `294db508…3778`. Reescribe `pruebas-locales.json` (solo cambia la hora); lo devolví al original (mismo SHA-256 `960810e2…`). |
| Ensayo «después de aplicar», repetido en un `git clone` de `13ae882` en mi scratchpad, con lo que exportó mi PGlite | `sincronizar.js`: «25 plataformas verificadas, 5 descartadas y 24 ofertas»; `rwadar.csv` de 30 filas sin diferencias. `despues-de-aplicar.mjs`: 44 de 48 comprobaciones al 05/11; repetido, «Nada que cambiar». `volcar-seed.js`: `02_seed.sql` sin diferencias. `rwadar-fichas.js`: 57 archivos. `transparencia.mjs`: 24 ofertas. **`npm test`: salida 0** (30 SQL, mapa 11/11, web 593, precarga 32, móvil 409 + 2 omitidas de 411, acceso 146, herramientas «Diferencias: 0»). Los archivos que cambian son los de `ensayo-despues.json` (`archivosQueCambian`). |
| Inventarios de copias de `espana-proximas` | `grupos/…/inventario-consultas.json`: 60 de 60 con SHA-256 y bytes correctos. `revision-independiente/fuentes/espana-proximas/inventario-consultas.json`: 44 de 44. |

## 2. Inventario del SQL

Separé las sentencias respetando comillas y bloques `$…$` y las clasifiqué
por su forma y su tabla. No me limité a buscar palabras.

### `aplicar-y-aprobar.sql`: 286 sentencias

| N.º | Sentencia | Tabla | Notas |
|---:|---|---|---|
| 1 | `begin isolation level serializable` | — | |
| 1 | `do $guarda$` | lee `rwadar_catalogo.publicacion_v2` y `public.catalogo_publicacion` (las dos `for update`) y `rwadar_catalogo.revisiones` | Solo `select` y `raise`. |
| 1 | `insert … values … on conflict (id) do nothing` | `rwadar_catalogo.revisiones` | Esperadas 25 / 24 / `{"principales":8,"secundario":13,"en_camino":3}`, `verificado_el 2026-11-05`. |
| 67 | `insert … values … on conflict (revision_id,id) do nothing` | `rwadar_catalogo.fuentes` | Las 67 con `primaria = true` y `consultada_el 2026-11-05`. |
| 25 | `insert … select … from public.plataformas where slug=… on conflict (revision_id,plataforma_id) do nothing` | `rwadar_catalogo.plataformas` | |
| 105 | `insert … select … on conflict do nothing` | `rwadar_catalogo.plataforma_fuentes` | |
| 25 | ídem | `rwadar_catalogo.alertas` | |
| 35 | ídem | `rwadar_catalogo.alerta_fuentes` | |
| 24 | `insert … values … on conflict (revision_id,slug) do nothing` | `rwadar_catalogo.ofertas` | Las 24 con `verificada_el 2026-11-05` y `vigencia_dias 7`. |
| 1 | `do $aprobar$` | cuenta en `plataformas` y `ofertas`; `update rwadar_catalogo.revisiones set estado='aprobada' … where id = v and estado = 'borrador'`; comprueba `revision_publicable_v2` y que `publicacion_v2` apunte a la nueva | Exige 25 / 24 / 8-13-3. Si no, error y se deshace todo. |
| 1 | `commit` | — | |

- **Revisión de cada inserción.** Las 282 inserciones llevan
  `'8fe33ec4-…'::uuid` como primer valor. El UUID `723968ce` solo sale en la
  guarda (y en el comentario de cabecera). Los demás UUID del archivo están
  dentro de URL de documentos (literales).
- **Fuera de los literales solo hay** `public.plataformas` (190 veces, siempre
  en `from public.plataformas where slug=…`, es decir, leída) y
  `public.catalogo_publicacion` (1, leída con `for update` en la guarda).
  `update` aparece 3 veces: los dos `for update` de la guarda y el `update` de
  la aprobación. No hay `create`, `alter`, `drop`, `delete`, `truncate`,
  `grant`, `revoke`, `policy`, `function`, `auth.`, `set role`, `execute`,
  `copy`, `perform` ni `pg_`.
- **`catalogo.sql`.** 284 sentencias: `begin`, las mismas 282 inserciones
  (idénticas una a una a las del aplicador) y `commit`. No aprueba nada.
- **Efectos indirectos esperados.** La aprobación activa dos disparadores que
  ya existen en `rwadar_catalogo.revisiones` (el lote no los crea):
  `fijar_publicacion_v2` mueve el puntero a la revisión nueva y
  `sincronizar_publicacion_catalogo` deja `retirado = false`, que la guarda ya
  exige. Hoy no hay escritura en `public.plataformas` ni en `public.fuentes`
  (la 2026-11-04.2 sí las tocaba, por ARTEX).
- **Respecto de la 2026-11-04.2.** En fuentes, plataformas, alertas y sus
  fuentes, las inserciones son idénticas salvo la revisión y la fecha, menos
  dos: la fuente `paxg-web` (`https://paxos.com/paxgold` →
  `https://www.paxg.com/`) y los dos textos de Pax Gold.

### La guarda, punto por punto

| Requisito | Cómo lo cumple |
|---|---|
| Serializable | `begin isolation level serializable`; bloquea el puntero y el control de retirada con `for update`. |
| La publicada es exactamente la anterior | `actual is null or actual not in (723968ce, 8fe33ec4)` → error. Si es la `723968ce`, además exige `contenido_sha256 = '723968ce00f7…5337585'` y `estado = 'aprobada'`. PGlite comprueba el rechazo con la `cf79e4a4` y con otra huella, y que no queda nada. |
| Catálogo no retirado | `retirada is distinct from false` → error (también si falta la fila). |
| Fecha | `current_date < '2026-11-05'` → error. **No hay fecha tope** (R7). |
| Identidad del destino | Si la `8fe33ec4` ya existe con otra huella o retirada → error. |
| Idempotencia | Todo con `on conflict do nothing` y el `update` filtra `estado = 'borrador'`. PGlite lo aplica dos veces y si ya estaba como borrador lo aprueba sin duplicar. |
| Recuentos | 25 / 24 / 8 / 13 / 3, `revision_publicable_v2` y puntero en la nueva; si no, se deshace todo (PGlite lo prueba quitando una plataforma). |

## 3. Diferencias con la 2026-11-04.2 publicada, ficha por ficha

Comparé `escaparate-publicacion.json` y `documentacion-ofertas.json` de las dos
entregas campo a campo. Mismas 24 ofertas, en el mismo orden y colecciones
(8/13/3); mismos `estadoRevision`, `disponibleEs`, `url`, `fuentesActuales`,
`tipo` y `coleccion`. En las 24: `verificadaEl` 03/11 → 05/11, 7 días, cada
aviso con `verificadaEl` 05/11 (mismo orden) y los datos de tarjeta conservados
con consulta del 05/11. Lo demás que cambia:

| Ficha | Cambio | DECISIONES | Revisor del grupo | Dictamen |
|---|---|---|---|---|
| Spiko Euro (Letras) | 2,34 % → **2,39 %**; métrica, literal y referencia con «VL del 04/11/2026; consultado el 05/11/2026»; fuera las 5 cifras viejas (NAV 1,0597 € ×2, 1,0613 €, 467,94 M€, 444,52 M€) | Sí | `spiko.md` §1 y §6 | Correcto; recalculado por mí (§4) |
| Spiko Dólar | 3,95 % → **3,99 %** en USD, misma forma; alcance de «Precio · consulta 01/11/2026» corregido (la cifra de GECO es la clase USD en euros) | Sí | `spiko.md` §1 y §6 (0,97858 € y 1,01881 €) | Correcto |
| Spiko Euro (Smart Cash) | 2,84 % con VL del 04/11; «Rendimiento neto publicado» con fecha 04/11; **«Reembolso» de la tarjeta reescrito** (172 → 105 caracteres) | Cifra sí; reembolso no (desviación declarada) | `spiko.md` §5 confirma el contenido | Aceptable: mismo contenido y ya cumple ≤ 120 (R6 de estilo) |
| Robinhood | métrica «Salida» → «Vendes a Robinhood en la app, 24/5; puede suspender el cierre» | Sí | `acciones-oro-tesoro.md` | Correcto |
| mTBILL | «Valor por token · 04/11/2026: 1,0773 USD (oráculo del emisor)»; referencia nueva «Países de oferta según la web de Midas · consulta 05/11/2026» | Sí | `acciones-oro-tesoro.md` §1-2 (ronda 488, 1,07725738) | Correcto; la URL de la fuente es mejorable (R2) |
| Aktionariat | aviso nuevo de la comisión del 1,9 %; vendedores «6,20 ZCHF frente a 7,25 CHF el 05/11/2026»; «Supervisor» con «registro de autorizados de FINMA (05/11/2026)»; «Precio del emisor · 05/11/2026» (mismo 7,25); fuera «Comisiones · 01/11 Fee (0%)» y nueva «Comisiones · 05/11» | Sí, salvo la fecha del precio (desviación declarada) | `suiza.md` | Correcto; lo vi en pantalla (§4). Quedan dos «Fee (0%)» del 01/11 (R3) |
| Boss Info | tarjeta «Acceso desde España» nueva (con «admite»); aviso de acceso sustituido por §9.1; mínimo «100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF el 05/11)»; avisos de comisión y XCHF/ZCHF; «Supervisor» | Sí («admite», desviación declarada) | `suiza.md`, correcciones 1 y 2 aplicadas | Correcto |
| Switzerlend | acceso como Boss Info; aviso «el portal no publica países» sustituido; recompra «el acuerdo firmado no le obliga… casi sin fondos (0,03 ZCHF)»; avisos de comisión y de 67,00 ZCHF; mínimo «1 acción (68,01 CHF el 05/11)»; «Supervisor» con fecha 05/11 | Sí (la fecha del supervisor, desviación declarada) | `suiza.md`, corrección 3 aplicada | Correcto |
| Brickwise, 11 de reventa | mínimo «Desde X € la participación en reventa (05/11)»: Plüddemanngasse 80 → 75, Schwarzer Weg 69,90 → 66,67, Hinterstoder 72 → 77, Pottendorfer 78 → 74, el resto igual; acceso de 116 caracteres; 4 avisos de alquiler con fecha; salida de Pottendorfer; 4 referencias nuevas por ficha | Sí, salvo 3 de las 4 referencias (desviación declarada) | `brickwise.md` §2 y §3 (mejor compra 35 € y 19 € corregidas) | Correcto; lo comprobé en la API (§4). Una nota inexacta (R1) |
| BILLA | «(API 05/11/2026)»; aviso «82 participaciones suscritas (8.200 €, el 1,64 % del mínimo)»; acceso de Brickwise | Sí | `brickwise.md` §2 | Correcto (6.404 − 6.322 = 82 en la API a las 09:18) |
| Casa de Outeiro | «Recaudado · 05/11/2026: 1.121.000 €…»; aviso del plazo con 05/11 | Sí, texto literal | `espana-proximas.md` | Correcto |
| Hausera | resumen, descripción y «Próxima operación» con el estado del 05/11; aviso de la preventa del revisor; mínimo «100 € según la FAQ de Hausera (05/11)…» | Sí | `espana-proximas.md`, correcciones 1 y 2 | Correcto; 100 € comprobado (§4) |
| Kraken y Prosegur | solo fechas | Sí | `acciones-oro-tesoro.md` | Correcto |

**Desviaciones del montador.** Las nueve que declara son razonables y ninguna
contradice una fuente:

- «admite» en Boss Info y Switzerlend: sin esa palabra el lector diría «Sin
  comprobar», lo contrario del «Sí» de DECISIONES.
- Reembolso de Spiko Euro: deja el dato igual y cumple ≤ 120.
- Las tres fechas puestas al día: los datos los comprobaron hoy el revisor y yo.
- Las tres referencias de Brickwise que no nombra DECISIONES (venta más
  barata, participaciones en venta y desistimiento) **están fuera de la lista
  cerrada**. El revisor confirmó los datos y yo los vi en la API. Las acepto,
  pero conviene que el coordinador lo ratifique en el cierre.

### Textos de la tarjeta (castellano llano, ≤ 120, reventa y próximas sin cifras principales)

- **Los 30 datos de tarjeta nuevos o reescritos** miden de 29 a 118
  caracteres. Están en castellano, sin citas en otro idioma, y ningún mínimo
  lleva «por participación».
- **Reventa y próximas.** Las 16 tienen `rentabilidad`, `precio` y
  `disponibleEs` a `null`.
- **Conservados de más de 120** (ya publicados): Robinhood, acceso (131) y
  salida (137); Kraken, acceso (121); Casa de Outeiro, salida (121). Ver R5.
- **Lo que verá el inversor** (`resumenOferta`, tabla «tarjetas» de
  `pruebas-locales.json`): cambian 15.
  - Boss Info y Switzerlend pasan a «Disponible desde España según la fuente».
    Es coherente con DECISIONES y con la §9.1, que solo vale para comprar al
    emisor, como dice el propio texto.
  - **En la tarjeta de la web y de la app el mínimo de Brickwise sale del
    texto corto de `transparencia.json`**, no del largo: ver C1.

## 4. Fuentes primarias que abrí yo (05/11/2026, UTC)

Sin sesión, sin escribir en formularios y sin saltar ninguna comprobación
anti-bots. Las copias están en mi scratchpad, fuera de Git: la respuesta de
Brickwise trae direcciones de monederos.

| Hora | Fuente | Lo que dice | ¿Coincide? |
|---|---|---|---|
| 09:18:06–09:18:23 | API de Spiko `public-api.spiko.io/v0/share-classes/{EUTBL,USTBL,eurSAFO}/yield` y `net-asset-values/…/latest` | EUTBL `monthlyYield "0.0239"`, VL 1,062242 € del 04/11. USTBL `"0.0399"`, VL 1,101837 USD del 04/11. eurSAFO `"0.0284"`, VL 1,016485 € del 04/11. | Sí |
| 09:18 | Serie de VL de la misma API, recalculada por mí | EUTBL: 1,060109 (04/10) → 1,062242 (04/11), 31 días = **2,3949 %**. USTBL: 1,097946 (02/10) → 1,101837 (04/11), 33 días = **3,9904 %**. eurSAFO: 1,016407 (03/11) → 1,016485 (04/11), un día anualizado = **2,8405 %**. | Sí: 2,39 / 3,99 / 2,84 |
| 09:18:29 | API de Brickwise `api.app.brickwise.at/api/v1/assets` (órdenes abiertas) | Las 11 fichas: venta más barata 75 / 75 / 95 / 69,90 / **66,67** (6) / 70 / 78 / **77** (5) / **74** (1) / 100 / 110. Participaciones en venta: 335, 97, 302, 313, 305, 150, 184, 258, 107, 351 y 65. Mejor compra: **35 € en Schwarzer Weg** y **19 € (3) en Pottendorfer**. BILLA: 6.404 − 6.322 = 82. | Sí, las 11 y BILLA |
| 09:18:58 | `/api/secondarymarketsettings` de DAKS, BOSS y LENDS | `"buyerFeeRate":0,"sellerFeeRate":0.0190` en los tres | Sí (1,9 % al vender) |
| 09:22:41 | `shares.aktionariat.com/trade` con Chrome sin interfaz, pulsando solo la pestaña «Sell» | Antes de pulsar, «Fee (0%)»; en «Sell», «Fee (1.9%): 0.12 ZCHF · Total Value 6.08 ZCHF». «Bid/Ask 6.10 / 6.20», 6,20 × 356 y «Buy DAKS at 7.25 CHF». | Sí (comisión, vendedores a 6,20 y precio 7,25) |
| 09:19:08 | `shares.bossinfo.com/investor-page-terms` | 26.055 bytes, SHA-256 `d3ed3a3c…` (el mismo que el revisor). «Version 1.0 • October 30, 2026». §9.1: «exclusively addressed to persons domiciled or resident in Switzerland or the EEA… limited to a total of €100,000». §4.1: «Applicable fees are borne by the seller». | Sí |
| 09:21:50 | `https://www.paxg.com/` | «For EU visitors: PAXG is currently not available to residents of the European Union» y «…regulated by the Office of the Comptroller of the Currency» | Sí (fuente nueva del radar) |
| 09:22:50 | `hausera.io/faq/` y `hausera.io/` | FAQ: «Lo mínimo que se puede invertir en cada oportunidad son 100€». Portada: «El importe mínimo son 100€.» | Sí |
| 09:24:59 | `midas.app/assets/main-C67ipI_t.js` | SHA-256 `19e9c54a…` (el mismo que el revisor), con «Permitted Jurisdictions» y la lista de 14 países con «Spain». `midas.app` en Chrome sin interfaz solo enseña la comprobación anti-bots de Cloudflare; no la salté. | Sí |

## 5. `despues-de-aplicar.mjs` y el ensayo

- **Bien hecho.**
  - No toca nada si el catálogo sincronizado no es la `8fe33ec4` con 25/24 y
    las 24 al 05/11.
  - Solo pone el 05/11 en `supervisada` y `documentoEspana` cuando el
    expediente de hoy volvió a leer esa misma dirección; las 4 que no, quedan
    del 03/11 y lo dice.
  - Cambia el motivo de Spiko Euro y Dólar como pide DECISIONES (el revisor
    de Spiko confirma la CNMV n.º 2380 y la tabla de países).
  - Valida con `cargarTransparencia` antes de escribir y se puede repetir sin
    efecto: lo comprobé.
- **Fallo (C1).** El mínimo corto de las 11 de reventa queda «Desde X € en
  reventa (05/11)». Le falta «la participación», y es lo que enseñan la
  tarjeta de la web y la app (`transparencia.js`, `minimoCorto`).
  - DECISIONES eligió «la participación» precisamente «para que no deje de
    verse».
  - La corrección obligatoria 1 del revisor de Brickwise pide que se lea como
    precio por participación.
  - En 7 de las 11, la venta más barata es un lote de varias participaciones.
    Leído como «Mínimo: Desde 110 €», parece la inversión mínima, que nadie
    documenta: es el mismo defecto que señaló la revisión del 03/11 (C1).
  - Hoy no es una regresión: el texto corto ya era así desde el 03/11.
- **Probé el arreglo en la copia.**
  - Con `Desde ${precio} € la participación (05/11)` (de 35 a 38 caracteres;
    el máximo es 40), `despues-de-aplicar.mjs` y `transparencia.mjs` pasan.
  - `npm test` con el arreglo: **salida 0** (web 593, móvil 409 + 2 omitidas
    de 411, acceso 146, precarga 32, 30 SQL, mapa 11/11, «Transparencia al
    día: 24 ofertas» y «Diferencias: 0»).

## 6. Datos personales

- **Las copias actuales están limpias.** En los 35 archivos de
  `grupos/espana-proximas/fuentes/` que entran en Git no queda ningún nombre
  de persona física:
  - la tabla de capital, los administradores, los promotores, la firma y el
    co-CEO de Hausera llevan «[nombre recortado]»;
  - una búsqueda de nombres de pila y de cargos solo encuentra el nombre de un
    premio en el pie de las páginas de la CNMV.

  Las copias del revisor (`revision-independiente/fuentes/espana-proximas/`)
  también están limpias. Los PDF, los HTML y `crudo/` están fuera de Git
  (`.gitignore` del ciclo).
- **El historial de la rama no está limpio.** Los commits de `301c690` a
  `91191f5`, que ya están en `origin/claude/catalogo-2026-11-05`, llevan las
  copias sin recortar:
  - páginas de Alius y del emisor con los nombres de los promotores y de la
    antigua propietaria;
  - **la tabla de capital con los nombres completos de dos accionistas
    personas físicas y su porcentaje** (`casa-fdf-v5.pdf.txt` y
    `casa-anexos-v3.pdf.txt`);
  - el nombre del co-CEO de Hausera.

  El revisor del grupo pidió recortarlos «antes de cualquier commit». Si la
  rama se une con un merge normal, ese historial entra en `main`. Ver C2.

## 7. Cambios obligatorios

### C1 · Mínimo corto de las 11 fichas de reventa de Brickwise (no cambia el SQL)

En `despues-de-aplicar.mjs`, línea 88:

- antes: ``t.ofertas[slug].minimoCorto = `Desde ${precio} € en reventa (05/11)`;``
- después: ``t.ofertas[slug].minimoCorto = `Desde ${precio} € la participación (05/11)`;``

Valores: «Desde 75 € la participación (05/11)» (Plüddemanngasse y
Sonnleithnergasse), 95 (Klagenfurt), 69,90 (Stallhofstraße), 66,67 (Schwarzer
Weg), 70 (Drautalresidenz), 78 (Randhartingergasse), 77 (Hinterstoder), 74
(Pottendorfer), 100 (GreenPoint) y 110 (Cohotel). Corregir también
`ensayo-despues.json` (tarjetas de la web) y repetir el ensayo
(`despues-de-aplicar.mjs`, `transparencia.mjs`, `npm test`). Se hace después
de aplicar y antes de publicar la web; no cambia la revisión, la huella ni el
SHA-256 del SQL.

### C2 · Unir a `main` sin el historial que lleva los nombres (no cambia el SQL)

No unir `claude/catalogo-2026-11-05` con un merge normal ni abrir el PR desde
ella:

1. Crear una rama nueva desde `origin/main`.
2. Traer los cambios con `git merge --squash claude/catalogo-2026-11-05` (y
   C1), en **un solo commit** firmado como Claude.
3. Abrir el PR desde esa rama nueva.
4. Después, con permiso de Víctor, borrar la rama remota
   `claude/catalogo-2026-11-05`.

Los archivos son los mismos, así que el SQL, su SHA-256 y las pruebas no
cambian.
Las copias de `2026-11-01-v2` y `2026-11-03.3-v2` que ya están en `main`
siguen pendientes aparte (lo dicen DECISIONES y el informe).

## 8. Recomendados (no bloquean; R1-R3 cambian el SQL, así que irían en otra entrega del día o en la siguiente)

- **R1 · Brickwise, nota de «Participaciones en venta · 05/11/2026».** Dice
  «…entre inversores en todo el mercado de la app ese día». La cifra es de
  esa emisión, no de todo el mercado: 305 en Schwarzer Weg y 97 en
  Sonnleithnergasse (suma de las órdenes de venta abiertas de ese ISIN).
  Propuesta: «Participaciones de esta emisión a la venta entre inversores ese
  día (suma de las órdenes abiertas en la app). Cambia a diario.»
  (`preparar-entrega.mjs`, línea 326).
- **R2 · mTBILL, fuente de «Países de oferta».**
  - La ficha enlaza «Abrir fuente ↗» a `https://midas.app/assets/main-C67ipI_t.js`,
    código minificado, y ese nombre cambiará con la próxima versión de la web.
  - La regla del 04/11 («fuentes para personas») pide la página que ve una
    persona o, si no se puede confirmar, dejar la dirección técnica anotada
    como «consulta técnica». El lector no trata `.js` como técnica y la guarda
    de `preparar-entrega.mjs` solo mira API y JSON.
  - Propuesta: fuente `https://midas.app/`, y el archivo `.js` como
    localizador en el alcance. Ampliar también la guarda a `.js`.
- **R3 · Aktionariat y Boss Info, «Fee (0%)» del 01/11 en «Salida».**
  - Aktionariat conserva «Salida · consulta 01/11/2026: Bid/Ask 6.00 / 6.20 ·
    Spread 3.23% · Fee (0%)».
  - Boss Info conserva «Salida · consulta 01/11/2026» con el alcance
    «Comisión mostrada 0 %».
  - Como datos de salida contradicen el aviso de hoy (vender cuesta 1,9 %):
    aquel 0 % era la pestaña de compra. Propuesta: quitar «· Fee (0%)» y «Comisión
    mostrada 0 %», o añadir «(comisión de la compra; al vender, 1,9 % el 05/11)».
- **R4 · Mínimo corto en las pruebas.** `comprobar-entrega.mjs` comprueba el
  texto largo de la tarjeta, pero la web y la app enseñan `minimoCorto`.
  Conviene que `despues-de-aplicar.mjs` o `probar-web.mjs` comprueben que el
  corto de reventa diga «la participación» (por eso no saltó C1).
- **R5 · Datos de tarjeta de más de 120 caracteres conservados.** Acortar en la
  próxima entrega:
  - Robinhood, acceso (131) y salida (137);
  - Kraken, acceso (121);
  - Casa de Outeiro, salida (121).
- **R6 · Spiko Euro (Smart Cash), estilo.** En la ficha se lee «Reembolso:
  Diario: orden antes…». Mejor: «Diario, con orden antes de las 15:00 (París)
  y abono al día hábil siguiente; puede limitarse (25 % del fondo)».
- **R7 · Fecha tope en la guarda** (ya lo pidió la revisión del 03/11):
  `if current_date > date '2026-11-12' then raise exception 'Lote caducado'; end if;`.
  Sin ella, aplicado después del 12/11 entraría caducado.
- **R8 · Pendientes ya anotados por el montador.** Los comparto:
  - la `web` de Pax Gold en `public.plataformas` (sigue en
    `paxos.com/paxgold`);
  - el texto de acceso de la plataforma Spiko en el radar (corrección 2 del
    revisor de Spiko, para cuando se toque el radar);
  - la ilustración de Hausera (Orihuela Costa).

## 9. Límites de esta revisión

- No comprobé en remoto que la publicada siga siendo la `723968ce`: hay que
  releerla como visitante justo antes de aplicar; la guarda lo exige.
- No abrí de nuevo las fuentes de Casa de Outeiro, BILLA (documentos), Kraken,
  Robinhood, Prosegur ni los registros de FINMA, PolyReg y CNMV. Me apoyo en
  los informes de `revision-independiente/` y en sus copias.
- El mercado de Brickwise lo leí en la API, no en la pantalla de la app. A las
  09:18 coincidía con lo que los revisores vieron a las 08:22–08:31.
- No vi en pantalla el aviso de países de Midas: `midas.app` pide una
  comprobación anti-bots que no se salta.

## 10. Correcciones aplicadas

Claude, 05/11/2026, de 09:33 a 09:50 UTC (quien montó la entrega, no el
revisor). Sin tocar Supabase, sin publicar, sin push ni flujos. Todo en la rama
local `claude/catalogo-2026-11-05-limpia`.

**El SQL cambió** (R1, R2, R3, R5, R6 y R7), así que lo aprobado arriba vale para
el `294db508…3778` y el nuevo hay que confirmarlo:

- Revisión nueva `cede1f27-b5eb-36d3-e223-eb4155df2572` (huella
  `cede1f27b5eb36d3e223eb4155df257228fc98e517776cefa0693a0657088823`).
- **SHA-256 de `aplicar-y-aprobar.sql`: `65c71cf0388c91dafcc9f7bcbfd646d98bb83051b74c27fa608d1bb6dd60cd80`.**
  `catalogo.sql`: `620ef1fe017fb67a39214f2a488055e9b1b270909fe783ae9a3e4dce1344a4fc`;
  `revision.json`: `5f05192b02cf0a99b819454e0595a95f447fadb96ebdfa77a0297433c7bdaeed`.
- **Diff con el aprobado.** Con los dos ids de la revisión nueva cambiados por
  los antiguos, quedan 39 líneas distintas:
  - 3 añadidas en la guarda (la fecha tope);
  - las filas de 18 ofertas (18 que salen y 18 que entran): las 11 de Brickwise,
    Spiko Euro, Robinhood, mTBILL, Aktionariat, Kraken, Boss Info y Casa de
    Outeiro.
  - Ninguna otra tabla ni sentencia cambia: mismo inventario (1 revisión, 67
    fuentes, 25 plataformas, 105 fuentes de campo, 25 alertas, 35 fuentes de
    alerta, 24 ofertas).
- `radar-canonico-26.json`, `escaparate-publicacion.json` y
  `manifiesto-catalogo.json` no cambian (mismo SHA-256). Cambian
  `documentacion-ofertas.json` y `contraste-2026-11-05.json`: 145 anotaciones,
  antes 139.

| Corrección | Qué se hizo | Comprobación |
|---|---|---|
| **C1** · mínimo corto de reventa | `despues-de-aplicar.mjs`: ``t.ofertas[slug].minimoCorto = `Desde ${precio} € la participación (05/11)` `` en las 11 de Brickwise (de 35 a 38 caracteres). `ensayo-despues.json`, rehecho con las tarjetas nuevas. No cambia el SQL. | Ensayo repetido en una copia aparte: `despues-de-aplicar.mjs` escribe los 11 mínimos («Desde 77 € la participación (05/11)»…), repetido «Nada que cambiar»; `transparencia.mjs` «24 ofertas»; `npm test` salida 0. En Chrome sin interfaz, a 1366×900 y a 390×844, las 24 tarjetas; la de Schwarzer Weg dice «Mínimo · Desde 66,67 € la participación (05/11)». |
| **C2** · unir sin el historial con nombres | `git switch -c claude/catalogo-2026-11-05-limpia origin/main` (`5a97fd2`; `origin/main` no se había movido) y `git merge --squash claude/catalogo-2026-11-05` (`13ae882`). Después C1 y lo demás, en **un solo commit** firmado como Claude. Se quitó el seguimiento de `origin/main` para que un `git push` sin rama no vaya a `main`. | Antes de tocar nada, el árbol de la rama nueva era idéntico a `13ae882` (`git diff 13ae882` vacío) y los 8 archivos del lote, con el mismo SHA-256. **Falta:** subir la rama, abrir el PR desde ella y, con permiso de Víctor, borrar la rama remota `claude/catalogo-2026-11-05`. |
| **R1** · «Participaciones en venta» | `preparar-entrega.mjs`: «Participaciones de esta emisión a la venta entre inversores ese día (suma de las órdenes abiertas en la app). Cambia a diario.» | 11 alcances cambiados en `documentacion-ofertas.json`; la ficha de Schwarzer Weg lo enseña y ninguna ficha dice ya «en todo el mercado de la app». |
| **R2** · fuente de los países de mTBILL | Fuente `https://midas.app/`. El archivo `midas.app/assets/main-C67ipI_t.js` («Permitted Jurisdictions») va como localizador en el alcance, que avisa de que su nombre cambia con cada versión. La guarda de fuentes técnicas de `preparar-entrega.mjs` incluye ahora `.js` (`\.js(?:$\|\?)`). | La ficha de mTBILL enlaza «Abrir fuente ↗» a `https://midas.app/`; `main-C67ipI_t.js` solo sale en el texto. Con la guarda ampliada, el lote no añade ninguna fuente `.js`. Queda la antigua, ya publicada: ver «Pendiente», abajo. |
| **R3** · «Fee (0%)» del 01/11 | Aktionariat: «Salida · consulta 01/11/2026» pasa a «Bid/Ask 6.00 / 6.20 · Spread 3.23%». Boss Info: su alcance ya no dice «Comisión mostrada 0 %». En los dos, el alcance aclara: «La comisión del 0 % que se veía ese día era la de la compra; al vender, el 05/11/2026 se cobraba un 1,9 %.» | `preparar-entrega.mjs` exige el texto «antes» de cada uno y anota los dos cambios. Las fichas generadas lo enseñan así. |
| **R4** · comprobar el mínimo corto | `despues-de-aplicar.mjs`, después de validar con `cargarTransparencia`, exige para las 11 de reventa de Brickwise: el corto es «Desde X € la participación (05/11)» con el mismo precio que el texto largo del catálogo, y tiene 40 caracteres o menos. Ningún mínimo corto puede ser «Desde … en reventa» sin «la participación». | Prueba en contra en la copia: con la línea antigua falla («apartamento-vacacional-hinterstoder-50: mínimo corto de la tarjeta») y no escribe `transparencia.json` (mismo SHA-256 antes y después). Con la nueva, pasa. |
| **R5** · tarjeta de más de 120 | Robinhood, acceso 131 → 111: «Disponible para residentes en España: Robinhood Europe está inscrita en la CNMV en libre prestación (n.º 5299).». Robinhood, salida 137 → 117: «Cierras con Robinhood Europe (24/5 según su web; horario ampliado no siempre disponible); el cierre puede suspenderse». Kraken, acceso 121 → 112: «…para sus clientes en la UE…». Casa de Outeiro, salida 121 → 118: «Si no llega a 2 M€, …». Mismo dato, fuente y fecha del dato. | `preparar-entrega.mjs` falla si queda algún dato de tarjeta de más de 120 (el más largo, 119). En `comprobar-entrega.mjs`, Robinhood y Kraken siguen en «Disponible desde España según la fuente». |
| **R6** · reembolso de Spiko Euro | «Diario, con orden antes de las 15:00 (París) y abono al día hábil siguiente; puede limitarse (25 % del fondo)» (109 caracteres). | `comprobar-entrega.mjs` exige «Reembolso: Diario, con orden antes…». |
| **R7** · fecha tope | En la guarda: `if current_date > date '2026-11-12' then raise exception 'Lote caducado: sus fichas valían hasta el 12/11/2026. No aplicar este lote.'; end if;` | `comprobar-entrega.mjs` exige esa línea y añade un caso de fallo: la misma guarda con el último día en el 04/11 (PGlite usa la fecha del sistema, el 05/11). Falla con «Lote caducado» y no deja nada. |
| **R8** · pendientes compartidos | No se aplica: todo lo que lista amplía el alcance de hoy (`public.plataformas`, radar, imagen, archivos ya en `main` y una decisión del coordinador). | Anotado en «Pendiente» de `INFORME-ENTREGA.md`. |

**Pruebas repetidas, con cifras**

- `preparar-entrega.mjs`, dos veces: los ocho archivos y la salida, idénticos
  byte a byte.
- `comprobar-entrega.mjs --exportar=…` (PGlite, sin red): código 0 en 28 s,
  `"resultado": "correcto"`, 19 comprobaciones y 6 casos de fallo, SHA-256
  `65c71cf0…cd80`. Lo que verá el inversor (`resumenOferta`, texto largo):
  cambian 17, antes 15. Las dos de más son Robinhood y Casa de Outeiro, por la
  salida acortada.
- Ensayo «después de aplicar», en un `git clone` de `13ae882` más los archivos
  de esta entrega:
  - `sincronizar.js`: 25 / 5 / 24, y `rwadar.csv` sin diferencias.
  - `despues-de-aplicar.mjs`: 44 de 48; repetido, «Nada que cambiar».
  - `volcar-seed.js`: `02_seed.sql` sin diferencias.
  - `rwadar-fichas.js`: 57 archivos.
  - `transparencia.mjs`: 24 ofertas.
  - **`npm test`: salida 0 en 2 min 12 s.** Base de datos, 27 scripts con 886
    comprobaciones, 30 SQL y mapa 11/11; web 593; pre-render 25 / 5 / 24;
    fichas 71; precarga 32; móvil 409 + 2 omitidas de 411; acceso 146;
    «Diferencias: 0».
  - Los archivos que cambian son los mismos de `archivosQueCambian`.

**Pendiente nuevo (fuera de R2).** En mTBILL, la referencia antigua «Acceso
desde España · consulta 01/11/2026» y la lista de fuentes de la ficha siguen
enlazando `https://midas.app/assets/main-DOxid0Zj.js`. Viene de una entrega
anterior y ya está publicada, por eso la guarda nueva no la para. Conviene
pasarla a `https://midas.app/` en la próxima entrega.

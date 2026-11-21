# Revisión de la entrega 2026-11-21 · contenido y tarjetas

Revisor independiente de contenido: no investigué, no monté y no corregí esta
entrega. Revisé el 21/11/2026 entre las **21:25 y las 21:46 UTC**, sin cuentas,
sin altas y sin tocar Supabase ni ningún servicio en línea. Mis copias y
pruebas están fuera del repositorio, en el scratchpad (`rev/`).

Lo revisado: `aplicar-y-aprobar.sql` (SHA-256 `c7f99442…fe5f`, revisión
`53747b1d-8b08-adda-5d0b-1f4875749a2d`), `decisiones.json`,
`escaparate-publicacion.json`, `documentacion-ofertas.json` y `DIFF-ENTREGA.md`,
contra `DECISIONES-COORDINADOR.md`, los expedientes, las seis revisiones de
grupo y las ocho auditorías. Rehíce la entrega con el motor en una copia
aparte y salió **el mismo SHA-256 (`c7f99442…`)**: lo de la carpeta es lo que
sale de `decisiones.json`.

## Veredicto: aprobada con cambios

Las cifras de hoy están bien: las abrí yo en su fuente y coinciden todas
(Spiko, mTBILL, las 11 de Brickwise, Hausera, Aktionariat, Switzerlend y Boss
Info). Las 14 tarjetas que cambian enseñan lo que deben, sin «por
participación», sin rentabilidad ni precio en reventa y próximas, y con la
fecha bien puesta.

Pero hay **7 correcciones obligatorias** (§5). Seis cambian el SQL y una solo
`transparencia.json`. Las más importantes:

- **C1 · mTBILL:** la etiqueta dice que las Condiciones Finales son «del
  21/11/2026». Son del 17/07/2026. Es un error nuevo de esta entrega.
- **C2 · Kraken:** la nota de «Salida» sigue diciendo «consultada el
  03/11/2026». La auditoría lo mandaba quitar y no se hizo.
- **C3 · Spiko Letras Euro:** al quitar «Comisión de gestión · 22/10/2026», la
  fila «Costes» de la ficha pasa a citar una consulta del **30/09/2026**.
- **C4 · Hausera:** la nota del mínimo dice que la preventa «está abierta». Del
  25 al 28/11 eso será falso.
- **C5 · Brickwise:** «participaciónes» (con tilde) en 7 fichas.
- **C6 · Robinhood:** «el KID en español dice 0,00 % (errata)» no dice de qué
  es ese 0,00 %.
- **C7 · Prosegur:** el aviso nuevo y la casilla de transparencia no dicen lo
  mismo sobre para qué está inscrita en la CNMV.

**Las siete las probé en una copia aparte y el motor las acepta.**
`preparar --repetir` da los mismos SHA-256 las dos veces (SQL `04d1ec23…3fd0`,
419 cambios). `comprobar` en PGlite da «correcto»: 18 comprobaciones, los 6
casos de fallo y las mismas 14 tarjetas. `despues` aplica bien el texto de
Prosegur. Como el SQL cambia, después de corregir hace falta
`motor.mjs auditar` y el auditor.

## 1. Fuentes primarias que abrí hoy

| Dato publicado | Fuente | Hora UTC | Literal corto que vi | ¿Coincide? |
|---|---|---|---|---|
| Spiko Letras Euro 2,45 %, VL 1,063496 € del viernes 20/11 | https://public-api.spiko.io/v0/share-classes/EUTBL/yield y …/net-asset-values/EUTBL/latest | 21:28:07–21:28:09 | `"monthlyYield":"0.0245"`, `"updatedAt":"2026-11-20T17:18:23…"`; `"day":"2026-11-22…","value":"1.063496"` (SHA-256 `02a03185…` y `98a9113d…`, los del vigía) | Sí |
| Spiko Letras Dólar 4,00 %, VL 1,103573 $ | …/USTBL/yield y …/USTBL/latest | 21:28:15 | `"monthlyYield":"0.04"`; `"day":"2026-11-20…","value":"1.103573"` | Sí |
| Spiko Smart Cash 2,84 %, VL 1,017886 € | …/eurSAFO/yield y …/eurSAFO/latest | 21:28:16 | `"dailyYield":"0.0284"`; `"value":"1.017886"`, día 20/11 | Sí |
| Spiko: gestión 0,25 % | https://data.spiko.io/eutbl/ | 21:36:55 | «Management fees 0.25%», «Minimum initial subscription 1» | Sí |
| Spiko SICAV en la CNMV | https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0401205J&lang=es | 21:45:09 | «SPIKO SICAV … 2380 30/01/2026 SICAV FRANCIA» | Sí |
| mTBILL 1,0789 USD del 20/11 y 3,46 % a 5 semanas | `eth_call` al oráculo 0x056339C0…2b5b en ethereum-rpc.publicnode.com (bloque 26.466.168) | 21:28:27 y 21:28:41 | ronda 498: 1,07890125 USD, `updatedAt` 2026-11-20 11:41:35; ronda 475: 1,0753419 USD (16/10 13:47:47); 34,91 días → 3,460 % simple | Sí |
| Brickwise, las 11 fichas: venta más barata, menor importe con el 1,5 %, en venta y mejor compra | https://api.app.brickwise.at/api/v1/assets y /api/v2/assets (SHA-256 `edaee0fe…` y `b6d47201…`, los mismos bytes que el investigador y el vigía) | 21:28:58–21:29:00 | Schwarzer Weg 18: 71,90 € × 1 (orden del 18/09), 1 × 71,90 → 72,98 €, 297 en venta, compra 62 € (17/11). Las otras diez, cifra por cifra como en la ficha (Cohotel 110 € en órdenes de 31 y 4, y 1 sola a 120 €; Randhartingergasse 78 € × 20 y 1 a 85 €; Hinterstoder 75 € × 5 y 1 a 82 €…) | Sí, las 11 |
| Hausera: mínimo 100 € y suscripción del 25/11/2026 al 30/6/2027 | documento de emisión de Alicante 3, https://drive.google.com/file/d/1cpWVN3J_Y1xdRDAxUzGnjmWXB-eTODH_ (SHA-256 `9170562a…`, el de los revisores) | 21:34:23 | «Ticket mínimo: 100,00 euros»; «El periodo de suscripción se iniciará el 25/11/2026 y se extenderá hasta el 30/6/2027»; «Si a fecha 02/12/2026 no se hubiera alcanzado al menos el 50%…» | Sí |
| Hausera: Alicante 3 en preventa | https://hausera.io/page-data/propiedad/alicante_3/page-data.json (SHA-256 `f95e3a75…`, el del vigía) | 21:34:43 | `"status":"PRESALE"`, `"presaleDate":"18/11/2026"`, `"launchDate":"25/11/2026"` | Sí: no ha pasado |
| Aktionariat: hoy 62 acciones a 5,00 ZCHF; venta más barata 6,20; mejor compra 5,01 × 5; 78 pedidas; última compra al emisor 31/10 (1 a 7,25) | POST https://shares.aktionariat.com/api/secondarymarkets/getTrades y …/getOrderBook (company 77; trades con el SHA-256 `ebad27e1…` del investigador) | 21:35:01–21:35:03 | trade 2026-11-21T08:02:23Z, 62 a 5; `asks` 6,20 × 356; `bids` 5,01×5, 5,00×38, 4,50×10, 2,00×5, 1,00×20; último PRIMARY 2026-10-31, 1 a 7,25 | Sí |
| Switzerlend 68,01 CHF (precio del emisor) y Boss Info «2 acciones, unos 17 ZCHF» | `getPrice()` de los contratos de venta del emisor 0x8d90…9b65 y 0x3e73…4e69 | 21:35:26 | 68,0105 y 8,50197 (2 × 8,50 = 17,00) | Sí |
| Robinhood: «el KID en español dice 0,00 % (errata)» | https://cdn.robinhood.com/assets/robinhood/legal/stock_and_etf_tokens_kid_es.pdf (SHA-256 `84f4f0a8…`, el del revisor) | 21:37:27 | «Costes de entrada 0,00 % del importe que invierta … 10 EUR» | Sí, pero el texto publicado no dice que es la entrada (C6) |

## 2. Lo que enseñarán las tarjetas (web y app)

Pasé `resumenOferta` (`rwadar-site/assets/ficha-editorial-20261022.js`) por
las 22 ofertas de `escaparate-publicacion.json`, con su documentación, antes y
después. Para la línea corta usé el `transparencia.json` que deja el ensayo
«después de aplicar»: web (`datosCortosOferta`) y app
(`rwadar-movil/lib/transparencia.js`) usan la misma regla. Lo comprobé el
21/11 y el 28/11.

- **Cambian 14, y solo el mínimo.** España, salida y estado siguen igual en
  las 22, y ninguna caduca antes del 29/11.
  - Brickwise: «Mínimo Desde X € la participación (21/11) · España Sin
    confirmar». Solo cambia la cifra en Schwarzer Weg 18: 69,90 → **71,90 €**.
  - Switzerlend: «Mínimo 1 acción (68,01 CHF a 21/11) · España Sí».
  - Boss Info: la línea sigue «Mínimo 100 CHF · España Sí»; solo cambia el
    mínimo largo de la ficha.
  - Hausera: «Mínimo Desde 100 € · suscripción desde el 25/11 · España Sin
    confirmar» (40 caracteres; sigue siendo cierto del 25 al 28/11).
- **Las otras 8, igual que ayer:** Spiko «1 €», «1 USD» y «1 €»; Robinhood y
  Kraken «1 €»; Prosegur «1 gramo de oro»; Aktionariat «500 CHF», con España
  «Sí»; mTBILL, «Las fuentes no coinciden».
- **Ningún aviso nuevo sale en la tarjeta:** todos llevan tono `warn`; la
  tarjeta solo enseña los `stop`. Los del número fiscal austriaco se ven solo
  en la ficha.
- **Las reglas de la tarjeta se cumplen:**
  - los datos de tarjeta, como mucho 118 caracteres;
  - en el mínimo nunca «por participación/token/acción»;
  - reventa y próximas, con `rentabilidad` y `precio` a `null`;
  - ninguna cita en otro idioma;
  - las fechas son la del precio del día (21/11) o la del evento (25/11).

## 3. DECISIONES, ficha a ficha

Lo que está bien aplicado, con su fuente y sus fechas de dato y de consulta:

- **Spiko:**
  - las tres rentabilidades;
  - el literal de Letras Euro, ya sin «22/11»;
  - «Riesgo KID» en Euro y Dólar, con el texto de §6;
  - la fuente de la CNMV y la referencia «Registro de la SICAV en España» en
    Dólar;
  - el patrimonio desfasado, fuera;
  - en Smart Cash, «desde el 20/11/2026» y el acceso de la opción (a) de §6.
- **Kraken:**
  - no entra nada de lo rechazado;
  - el aviso y la referencia de dividendos, sin «en EE. UU.»;
  - las 58 condiciones finales sin España, en la nota de «Países de oferta».
- **mTBILL:** las cifras no cambian, salen las 8 referencias de midas.app y las
  5 direcciones sin cita, y BaFin pasa a consultada el 21/11 en transparencia.
  **Pero** la etiqueta de las Condiciones Finales está mal (C1).
- **Robinhood y Prosegur:**
  - fuera las referencias que repetían o contradecían la tarjeta;
  - re-fechadas las que se leyeron hoy;
  - el mínimo, «sin fecha publicada»;
  - en Prosegur, el aviso nuevo de la CNMV y «Estado de la oferta» con la app
    de hoy.
- **Suiza:**
  - el aviso de precios de Aktionariat, con «se vendieron»; sus tres
    referencias nuevas (la tercera se llama «Libro entre accionistas», para que
    «Lo esencial» no cambie);
  - en Boss Info, las del 22/10 re-fechadas y sin duplicados;
  - en Switzerlend, «Clase» con «si el dinero alcanza… (no es un tope)», igual
    en la nota de «Qué se adquiere»;
  - las dos siguen en reventa, como decide §6.
- **Brickwise:**
  - las 11 se quedan;
  - aviso del número fiscal con el texto de §6 en las 8;
  - en las tres «KESt», el aviso C2 y el de la cuenta (R1);
  - Schwarzer Weg 69,90 → 71,90 €;
  - el libro de órdenes del 21/11;
  - las 13 referencias viejas de cada ficha, re-fechadas;
  - fuera «Distribuciones esperadas desde».
- **Hausera:**
  - el mínimo corto, en `transparencia.textos`, como dice §8;
  - el mínimo largo, el resumen, «Próxima operación» y el aviso de la
    inscripción, sin «tiene la preventa abierta»;
  - el motivo del documento y `consultadaEl`, al 21/11;
  - fuera la referencia del 30/09.
  **Pero** la nota del mínimo sigue con «está abierta» (C4).
- **Radar:** cambian solo las fechas (`verificadoEl`, el alcance y las 69
  `consultadaEl`), con 69 de 69 fuentes bien. Ningún texto ni ninguna
  dirección cambia.

**Lo que cambia sin estar en DECISIONES y he aceptado** (aclaraciones que las
auditorías recomiendan con su fuente de hoy, que §6 admite):

- la nota «Una sola participación cuesta desde 99 € / 80 €» de Plüddemanngasse
  y Sonnleithnergasse;
- el aviso de Prosegur sobre la CNMV;
- el aviso del piso vacío de Randhartingergasse;
- el de subordinación de GreenPoint y Cohotel;
- la errata del KID de Robinhood.

**Lo que cambia sin que nadie lo pida, y está mal:** la etiqueta de mTBILL (C1).

### Lo no aplicado (15 puntos de `noAplicado`)

Los he mirado uno a uno. Salvo uno, los acepto: lo publicado sigue siendo
cierto y el motivo es un límite real del motor.

- **El acceso de Spiko Letras, Hausera y las tres KESt:** el motor exige que un
  dato de tarjeta cambiado se vea en la tarjeta, y aquí la tarjeta enseña un
  texto fijo. Los textos publicados no dicen «el fondo está inscrito en la
  CNMV», que era lo que corregía el revisor de Spiko.
- **El mínimo en lote de Cohotel, Randhartingergasse e Hinterstoder:** lo
  decide §8.
- **Los cambios de nombre de etiquetas, la huella del vigía, la fuente nueva
  del radar de Midas y las fuentes de oferta de Brickwise.**
- **La excepción: «Gestión publicada» (×2) de Spiko Letras Euro.** Que no se
  pueda quitar es aceptable. Pero combinado con quitar «Comisión de gestión ·
  22/10/2026», sube la consulta del 30/09 a la fila «Costes» (C3). Queda
  también «Último cruce publicado» (×2, 30/09) de Aktionariat, en «Datos con
  su fecha». Son las 4 referencias viejas que quedan (R2).

## 4. Avisos con fecha

No hay ningún aviso re-fechado sin una comprobación de hoy:

- 138 avisos, sin contar el editorial común; todos llevan `verificadaEl` del
  21/11.
- Los que ya estaban tienen su lectura de hoy en el expediente: en
  `avisosConFecha` o `revisionAvisos`, entre las 17:36 y las 17:53 UTC. Los
  `segunVigia` coinciden con `vigia.json`. Unos pocos genéricos que el
  expediente no lista los releyeron hoy el revisor o la auditoría: el de USDC
  de mTBILL, «Producto complejo» de Robinhood y el del 10 % de Prosegur.
- Los nuevos salen de las revisiones y auditorías de hoy, con su literal.
- Las fechas de dentro de los avisos son del dato (21/11) o del evento (18/11,
  25/11, 28/02/2026…).
- Única salvedad: en Hausera, «Alicante 2 ya figuraba como financiada el
  10/11/2026». Es una observación de RWAdar de ese día que hoy no se puede
  volver a ver (la auditoría lo marca «sin poder comprobar»). Ver R6.

## 5. Correcciones obligatorias (todas en `decisiones.json`)

### C1 · mTBILL: la etiqueta cambia la fecha del documento (cambia el SQL)

- **Hoy se publicaría:** «Países de oferta pública · Condiciones Finales del
  **21/11/2026**», con `fechaDato` 2026-07-17 y una nota que dice
  «Condiciones Finales de mTBILL del 17/07/2026».
- **Por qué está mal:** el documento es del 17/07/2026 (ESMA FTWS-1420,
  SHA-256 `b1e58001…`). Nadie pidió cambiar esa etiqueta.
- **Corrección:** en `ofertas.mtbill.cambios`, en el cambio `referencia` con
  `etiqueta` «Países de oferta pública · Condiciones Finales del 17/07/2026»,
  borrar de `despues` la clave `"etiqueta"`. Se quedan `alcance` y
  `fechaConsulta`.
- **Queda:** «Países de oferta pública · Condiciones Finales del 17/07/2026»,
  consultado el 21/11/2026.

### C2 · Kraken: «Salida» sigue con «consultada el 03/11/2026» (cambia el SQL)

- **Hoy se publicaría:** «Comprobado de nuevo en la fuente el 21/11/2026.
  Página de xStocks de Kraken UE consultada el 03/11/2026.»
- **Por qué está mal:** la auditoría acciones-oro-tesoro (obligatorio 3) manda
  quitar esa frase en «Mínimo de inversión», «Acceso desde España» y «Salida».
  Se hizo en las dos primeras, no en «Salida», y no está en `noAplicado`.
- **Corrección:** en `ofertas.kraken-xstocks.cambios`, después del
  `tarjetaFecha` de «Acceso desde España», añadir:

```json
{"tipo":"tarjetaFecha","etiqueta":"Salida","antes":{"valor":"Vendes a Kraken en USD, con diferencial, 24/5, o retiras el token a tu wallet; sin plazo fijo","fechaDato":null},"despues":{"fechaDato":null,"alcance":"Página de xStocks de Kraken UE."},"prueba":[{"claim":"salida","url":"https://eu.kraken.com/xstocks"},{"documento":"auditoria/acciones-oro-tesoro.md","contiene":"Las referencias «Mínimo de inversión», «Acceso desde España» y «Salida» llevan en su nota «Página de xStocks de Kraken UE consultada el 03/11/2026»."}]}
```

- **Queda:** «Comprobado de nuevo en la fuente el 21/11/2026. Página de xStocks
  de Kraken UE.» La tarjeta no cambia.

### C3 · Spiko Letras Euro: la fila «Costes» pasaría a citar el 30/09 (cambia el SQL)

- **Hoy se publicaría:** `resumenOferta` saca los costes con una referencia
  por concepto y fuente, la más reciente. Al quitar «Comisión de gestión ·
  22/10/2026», la de `data.spiko.io` que queda es «Gestión publicada»,
  consultada el 30/09/2026, que el motor no puede quitar.
  - Antes: «Comisión de gestión · Consultada el 22/10/2026».
  - Ahora: «Gestión publicada · Consultada el **30/09/2026**», en el bloque
    «Acceso, salida y costes, con su fuente» (`rwadar-20260820.js`,
    `datosClaveOfertaHtml`).
- **Por qué está mal:** es justo lo que la auditoría sitio-web (obligatorio 5)
  mandaba limpiar, y además queda más vieja que antes.
- **Corrección:** en `ofertas.spiko-letras-del-tesoro-euro.cambios`, cambiar el
  `referenciaQuita` de «Comisión de gestión · 22/10/2026» por esto. La
  auditoría sitio-web admite «re-fechar … o quitar»; yo leí hoy en
  data.spiko.io «Management fees 0.25%» (21:36:55 UTC):

```json
{"tipo":"referencia","etiqueta":"Comisión de gestión · 22/10/2026","antes":"0,25 %","despues":{"etiqueta":"Comisión de gestión · 21/11/2026","alcance":"Visto en la fuente oficial el 21/11/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.","fechaConsulta":"2026-11-21"},"prueba":[{"documento":"auditoria/sitio-web.md","contiene":"`data.spiko.io/eutbl/` (20:19:47 UTC): «Management fees 0.25% … Minimum initial subscription 1 EUR»"},{"documento":"auditoria/sitio-web.md","contiene":"re-fechar al 21/11 con lo leído hoy (las mismas cifras) o quitar los duplicados"}]}
```

- **Queda:** «Costes» con «Comisiones · 21/11» y «Comisión de gestión ·
  21/11». Lo comprobé con `resumenOferta` en la copia.
- **Además:** en el punto de `noAplicado` de «Gestión publicada», cambiar la
  frase final para decir que se re-fecha «Comisión de gestión» en vez de
  quitarla.

### C4 · Hausera: la nota del mínimo dice «está abierta» (cambia el SQL)

- **Hoy se publicaría**, en «Datos con su fecha»: «… La preventa (reserva)
  está abierta desde el 18/11/2026 según la ficha.»
- **Por qué está mal:** del 25 al 28/11 será falso. Es el mismo motivo por el
  que §6 y la auditoría suiza-hausera (obligatorias 2 y 3) quitaron «tiene la
  preventa abierta».
- **Corrección:** en el cambio `tarjeta` de `hausera-proximas-ofertas`, en
  `nota`, sustituir «La preventa (reserva) está abierta desde el 18/11/2026
  según la ficha.» por **«La preventa (reserva) abrió el 18/11/2026 según la
  ficha.»**

### C5 · Brickwise: «participaciónes» (cambia el SQL)

- **Hoy se publicaría:** «a ese precio había 2 participaciónes a la venta», y
  lo mismo con 11, 16, 20, 5, 8 y 35. Ayer ponía «participaciones».
- **Dónde está:** en la `nota` del mínimo de Plüddemanngasse, Sonnleithnergasse,
  Klagenfurt, Randhartingergasse, Hinterstoder, GreenPoint y Cohotel (líneas
  3199, 3679, 4139, 6059, 6586, 7553 y 8101 de `decisiones.json`). También sale
  en las 7 páginas `rwadar-site/ofertas/*.html` del ensayo.
- **Corrección:** «participaciónes» → **«participaciones»** en las siete.

### C6 · Robinhood: a qué se refiere el 0,00 % (cambia el SQL)

- **Hoy se publicaría:** «KID: entrada 0,10 %, salida 0,10 %, costes
  corrientes 0,00 %; posibles diferenciales en horario ampliado Localizador:
  … ; el KID en español dice 0,00 % (errata).»
- **Por qué está mal:** se puede leer que la errata son los costes
  corrientes. En el KID en español, el 0,00 % es la entrada: «Costes de
  entrada 0,00 % … 10 EUR».
- **Corrección:** en el cambio `referencia` «Comisiones · consulta 01/11/2026»
  de `robinhood-classic-stock-tokens`, dejar `despues.alcance` así:
  **«KID en inglés: entrada 0,10 %, salida 0,10 %, costes corrientes 0,00 %;
  el KID en español pone 0,00 % de entrada (errata). Posibles diferenciales en
  horario ampliado. Localizador: Fee Schedule, apartado Robinhood Classic Stock
  Tokens.»**

### C7 · Prosegur: el aviso y la casilla de transparencia se contradicen (no cambia el SQL)

- **Lo que se contradice:**
  - el aviso nuevo dice «solo para custodiar, tramitar órdenes y transferir
    criptoactivos»;
  - la casilla «La entidad que la ofrece está autorizada…» sigue con «solo
    para custodiar y transferir criptoactivos», aunque su propia fuente se
    titula «Prosegur: custodia, recepción de órdenes y transferencia».
- **Por qué hay que arreglarlo:** la auditoría lo recomendaba para los dos
  textos y solo se hizo el aviso.
- **Corrección:** añadir a `transparencia.textos`:

```json
{"slug":"prosegur-digital-gold","campo":"supervisada.motivo","antes":"solo para custodiar y transferir criptoactivos","despues":"solo para custodiar, tramitar órdenes y transferir criptoactivos","prueba":[{"documento":"auditoria/acciones-oro-tesoro.md","contiene":"«solo para custodiar y transferir criptoactivos» omite la recepción y transmisión de órdenes, que la propia fuente de la casilla nombra."}],"avisoCatalogo":"Prosegur Crypto figura en la CNMV solo para custodiar, tramitar órdenes y transferir criptoactivos; su contrato dice que este oro no está supervisado."}
```

- **Probado:** con `despues` en la copia, sobre el catálogo sincronizado del
  ensayo, sale «Prosegur Crypto figura en la CNMV solo para custodiar, tramitar
  órdenes y transferir criptoactivos; su contrato dice que este oro no está
  supervisado.»

## 6. Recomendadas (no bloquean)

- **R1 · Brickwise, mínimo en lote.** En 5 fichas la tarjeta dice el precio de
  un lote, y una sola participación cuesta más:

  | Ficha | Tarjeta | Lote a ese precio | Una sola, desde |
  |---|---|---|---|
  | Plüddemanngasse | 75 € | 2 | 99 € |
  | Sonnleithnergasse | 75 € | 11 | 80 € |
  | Randhartingergasse | 78 € | 20 | 85 € |
  | Hinterstoder | 75 € | 5 | 82 € |
  | Cohotel | 110 € | 31 y 4 | 120 € |

  - Lo decide §8 y la ficha lo explica. La auditoría brickwise-b lo daba por
    obligatorio.
  - Para el próximo ciclo: que el motor admita «1 participación desde X € en
    reventa (DD/MM)», el ejemplo de las Normas.
  - Y que la nota diga «La orden más barata de una sola participación pide
    99 € (100,49 € con el 1,5 %)». Así no choca con «Brickwise no publica … si
    una orden se puede comprar en parte».
- **R2 · El motor, duplicados.** Que pueda quitar referencias repetidas
  («Gestión publicada» ×2 en Spiko Letras Euro y «Último cruce publicado» ×2
  en Aktionariat, del 30/09). Son las 4 referencias viejas que quedan.
- **R3 · Brickwise, precio y mínimo de la suscripción original.** «Precio ·
  consulta 21/11/2026: Ausgabepreis: EUR 103,37» y «Mínimo de inversión ·
  consulta 21/11/2026: Mindestzeichnungsbetrag: …» se pintan como «Precio» y
  «Mínimo de inversión» con fecha de hoy, al lado del mínimo de reventa.
  - Como el motor no renombra, se puede cambiar el `valor`: «Precio de emisión
    original (suscripción cerrada): 103,37 €».
- **R4 · Castellano llano.** «ImmoESt» y «KESt» van sin explicar. Por ejemplo:
  «pagas allí el impuesto austriaco sobre la ganancia inmobiliaria (ImmoESt)».
- **R5 · Spiko, «Estado de la oferta».** La nota («GECO 21/11/2026: …; VL del
  20/11/2026 (1,063496 €)») atribuye a GECO la VL de la API de Spiko. GECO
  enseña la del 19/11 (1,06328 €). Lo mismo en Dólar.
- **R6 · Hausera, «financiada el 10/11/2026».** Decir que lo vio RWAdar ese
  día, o quitar la fecha: hoy no se puede volver a ver.
- **R7 · Brickwise, «Moneda» y «Plazo».** La nota «Cifra indicativa y
  variable…» no encaja con «EUR» ni con «indefinido».
- **R8 · Fechas cortas.** «precio del 21/11» en Boss Info, y «1 acción (68,01
  CHF el 21/11)» en el corto de Switzerlend (28 caracteres), en vez de «a
  21/11».
- **R9 · mTBILL, transparencia.** La casilla del documento cita
  docs.midas.app, que hoy da 403. Mejor el PDF del CDN (`b1e58001…`), que es lo
  que se leyó.
- **R10 · Hausera, mínimo largo.**
  - un solo formato de fecha (18/11/2026 o 18/11);
  - y «(puede cerrarse antes si se cubre)», que dice el acuerdo de reserva.
- **R11 · Brickwise, aviso del número fiscal.** Ni en la tarjeta ni en la
  lista se ve (tono `warn`). Si el responsable del proyecto lo quiere a la
  vista, tiene que ser `stop`, y entonces la oferta sale de la Selección. Es
  una decisión para el próximo ciclo.

## 7. Fuera de mi lente (para el coordinador)

- **`npm test` falla:** la prueba de `probar-web.mjs` «Inicio: cada tarjeta
  pone su fecha más reciente…» está atada al catálogo del 20/11. Hay que
  arreglarla antes de publicar (INFORME-ENTREGA §7, paso 0).
- Boss Info y Switzerlend siguen en reventa con «no una oferta abierta» (§6 y
  PR #191).

## 8. Cómo lo comprobé

- **Rehacer la entrega:** `motor.mjs preparar 2026-11-21 --salida=<scratch>`
  sobre una copia del commit `9b9ec4df` da SHA-256 `c7f99442…`, igual que la
  carpeta.
- **Con las 7 correcciones aplicadas en la copia** (21:40–21:43 UTC):
  - `preparar --repetir`: los mismos SHA-256 las dos veces (SQL
    `04d1ec23386be0d159e814a578015ac2115733e0ef9cf5d6ef4053b016193fd0`; 419
    cambios y 407 pruebas);
  - `comprobar`: «correcto», 18 comprobaciones, 6 casos de fallo y las mismas
    14 tarjetas;
  - `despues`, con el catálogo sincronizado del ensayo: aplica el texto de
    Prosegur.
  - Ojo: si el corrector escribe otro texto, el SHA-256 será otro.
- **Tarjetas y fechas:** `resumenOferta` antes y después en las 22 fichas; la
  línea corta con el `transparencia.json` del ensayo; una búsqueda de fechas
  de consulta anteriores al 21/11 en todo el texto visible. Solo salen la nota
  de Kraken (C2) y las 4 referencias duplicadas.
- **Nombres de personas:** ni el SQL ni los JSON de la entrega llevan nombres
  de personas. Este informe tampoco.

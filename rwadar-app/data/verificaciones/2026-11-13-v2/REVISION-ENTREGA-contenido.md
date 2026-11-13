# Revisión independiente de contenido · entrega 2026-11-13 (solo lectura)

**Veredicto: `aprobado`.** Lo que va en el SQL se puede aplicar tal cual, y lo
que cambia después de aplicar (`despues-de-aplicar.mjs`) también. Cada cambio de
`DECISIONES-COORDINADOR.md` está aplicado con su texto, su fuente y sus fechas,
con las dos correcciones obligatorias de los revisores (Spiko y suizas), y no
cambia nada más. Las cifras que abrí yo hoy en la fuente primaria coinciden todas
con la entrega. **No hay correcciones obligatorias.** Dejo doce recomendadas
(§8). Las dos primeras son para hoy y para la semana: la R2 (volver a mirar la
orden de 73 € de Pottendorfer justo antes de aplicar; a las 09:41:14 UTC seguía)
y la R1 (Hausera deja de estar al día el 18/11, cuando abre la preventa, y la
ficha vale hasta el 20/11).

- Revisión `66907add-8ebf-424b-3e04-b73e47b0c537`, sobre la publicada
  `a58dd22d-98a3-f94e-ba66-46898162215a` (entrega 2026-11-12).
- **SHA-256 de `aplicar-y-aprobar.sql`: `7be64e861af7ba2895f07cedbb73a1e85a9dec055412aa27081e20a401d16961`**
  (comprobado a las 09:42:51 UTC; es el que dice el montador). `catalogo.sql`
  `85ad96a8…b379`, `revision.json` `a336306d…87c4`,
  `escaparate-publicacion.json` `a1bebcc8…f193`, `documentacion-ofertas.json`
  `a1cbcb23…4fa9`, `contraste-2026-11-13.json` `c473ab8c…e344`,
  `manifiesto-catalogo.json` `c2c51919…4224`, `DECISIONES-COORDINADOR.md`
  `0538b65c…21ee` y `despues-de-aplicar.mjs` `158ae957…acae`. Son los del commit
  `5641af2` (los datos y el SQL no cambian desde `d1463ee`).
- Revisor: Claude, 13/11/2026, de 09:24 a 09:50 UTC. No monté esta entrega. No
  he tocado Supabase, no he publicado, no he lanzado flujos y no he hecho commit.
  En el repositorio solo he escrito este informe. Mis scripts y mis lecturas están
  en la carpeta temporal de la sesión (`scratchpad/revcontenido`), fuera de Git.
  El documento de emisión de Alicante 3 (lleva datos personales) lo borré nada más
  leerlo. Las copias en bruto de la API de Brickwise (llevan direcciones de
  cartera) las borré al terminar.

## 1. Qué hice

1. Comprobé que la base es lo publicado: la documentación, los avisos, la
   colección, el estado y la fecha de las 22 ofertas de la `2026-11-12-v2` son
   iguales a `lectura-publica/ofertas-v2.json` (08:27 UTC), y también el resumen,
   las métricas y la rentabilidad de las 7 que se ven («principales» y «actual»).
   22 de 22.
2. Comparé campo a campo la base del 12/11 con la entrega (escaparate,
   documentación y las 25 plataformas): 725 diferencias, 670 solo de fecha y 55
   con contenido. Las 55 son: las cifras de DECISIONES (Spiko, Pottendorfer,
   Cohotel, GreenPoint, Schwarzer Weg y Randhartingergasse), la fecha de la tabla
   de países de Spiko, el alcance de la «Última operación» de Boss Info, la hora
   de lectura del libro de Brickwise en 33 alcances («08:30–08:33 UTC» en vez de
   «00:32–00:35 UTC») y la nota de origen del lote. Nada fuera de DECISIONES (§2).
3. Leí las 22 sentencias `insert` de ofertas de `aplicar-y-aprobar.sql` con un
   lector propio de literales SQL y las comparé campo a campo con el escaparate y
   la documentación revisados: **22 de 22 idénticas**, documentación incluida.
4. Ejecuté `resumenOferta` (`rwadar-site/assets/ficha-editorial-20261022.js`,
   igual byte a byte que `rwadar-movil/lib/ficha-editorial.js`) con las 22
   ofertas de `escaparate-publicacion.json` más su documentación, y encima la
   tarjeta y «Lo esencial» reales de la app (`datosTarjetaOferta` y
   `datosCortosOferta` de `rwadar-movil/lib/transparencia.js`, cargados con
   Babel como en sus pruebas). La web usa la misma regla (`datosCortosOferta` de
   `rwadar-20260820.js`); su tabla de transparencia en el ensayo es igual, oferta
   a oferta, a `transparencia.json`. Lo hice con el 13/11 a las 09:30, el 20/11 a
   las 23:30 y el 21/11 a las 00:30 UTC (§4).
5. Validé las 22 documentaciones con la regla de la web
   (`documentacionOfertaLocal`): si una referencia falla, la web no enseña
   ninguna. **22 de 22 válidas** el 13/11 y el 20/11.
6. Abrí yo hoy la fuente primaria de las cifras que cambian y de dos que no (§5).
7. Crucé cada aviso y cada referencia que pasan al 13/11 con lo que consultó hoy
   su expediente (§6).
8. Volví a ejecutar `despues-de-aplicar.mjs` en la copia del ensayo
   (`scratchpad/ensayo-2026-11-13`, con el catálogo ya sincronizado): exit 0,
   «Nada que cambiar: ya estaba hecho.», `transparencia.json` sigue en
   `8666d60c…7956`. Repetí aparte su regla de fechas (§6).

## 2. DECISIONES, punto por punto

| Ficha | Lo que pide DECISIONES | Lo que hay en la entrega | Veredicto |
|---|---|---|---|
| General | Etiqueta `2026-11-13`; las mismas 22 (8/13/1); `verificadaEl` 13/11 y 7 días (último día, el 20/11) | 22 ofertas y 25 plataformas; ninguna cambia de colección, estado, título, resumen, fuentes ni imagen. Las 22 con `verificadaEl` 2026-11-13, `vigenciaDias` 7 y documentación revisada el 13/11. La guarda del SQL corta después del 20/11 | correcto |
| Radar | 69 de 69; no cambia ninguna dirección ni ningún texto | En las 25 plataformas solo cambian `verificadoEl` y 142 `consultadaEl`. Las 142 direcciones están entre las 69 que `radar-contraste-2026-11-13.json` da por buenas hoy (69/69, sin bloqueos) | correcto |
| Spiko Letras Euro | 2,41 % → **2,40 %** (VL del 12/11, 1,062803 €; del 12/10 al 12/11); métrica «Rentabilidad publicada · 31 días · 12/11/2026: 2,40 %» | Así: cifra, métrica, literal («… publicado por Spiko el 12/11/2026 (VL fechada el 12/11/2026); consultado el 13/11/2026…») y referencia (`data.spiko.io/eutbl/`, dato 12/11, consulta 13/11, «1,060664 € → 1,062803 €») | correcto |
| Spiko Letras Dólar | 4,02 % → **3,98 % en USD** (VL 1,102694 $; del 13/10 al 12/11); métrica «… · 12/11/2026 · en USD: 3,98 %» | Así. El alcance explica que el 12/10 fue festivo en EE. UU. y que la base es la VL del 13/10 («1,099159 $ → 1,102694 $») | correcto (R12, menor) |
| Spiko Smart Cash | 2,84 % con la VL del 12/11 (1,017107 €); métrica «… · neta y variable · 12/11/2026: 2,84 %» | Así: métrica, literal («… con el valor liquidativo del 12/11/2026 (consultado el 13/11/2026)…») y referencia «Rendimiento neto publicado» (dato 12/11, consulta 13/11) | correcto |
| Las tres de Spiko (corrección del revisor) | «Acceso desde España» con fecha del dato 2026-11-06; en Smart Cash, «Tabla de disponibilidad de Spiko (06/11/2026)» | Así en las tres (`fechaDato` 2026-10-23 → 2026-11-06). El texto que lee el inversor no cambia. La fecha del 23/10 solo queda en las dos referencias históricas «· consulta 01/11/2026» (la de Euro, con el literal «Last updated: October 23, 2026»), como pide el revisor. El claim del expediente no se pudo tocar (R10) | correcto |
| mTBILL | Sin cambios; solo la fecha | Solo `verificadaEl`, la fecha de sus 7 avisos y `revisadaEl`. Ninguna referencia ni cifra cambia; sigue en `fuentes_en_conflicto` | correcto |
| Robinhood, Kraken, Prosegur | Sin cambios; solo la fecha | Solo `verificadaEl`, avisos, `revisadaEl` y la consulta de sus tres datos de tarjeta | correcto (R5 en Kraken) |
| Pottendorfer | Mínimo 80 → **73 €**; orden de menor importe 1 × 73 € (**74,10 €**); «Participaciones en venta» 107 al 13/11 | «Desde 73 € la participación en reventa (13/11)»; «Venta más barata · 13/11/2026: 73,00 € por participación (1 a ese precio, orden del 12/11/2026)»; «Orden de venta de menor importe · 13/11/2026: 1 participación a 73,00 € (74,10 € con el 1,5 %)»; «Participaciones en venta · 13/11/2026: 107» | correcto (R2) |
| Cohotel, GreenPoint, Schwarzer Weg | En venta 65 → **59**, 351 → **347**, 300 → **299**; mínimos 102, 102 y 69,90 € | Así, con fecha 13/11 | correcto |
| Randhartingergasse | Mejor compra 56 → **64 €** (orden del 12/11); mínimo 78 € | «Mejor oferta de compra · 13/11/2026: 64,00 € (1 participación, orden del 12/11/2026)» | correcto |
| Las otras 6 de Brickwise | Mismas cifras; solo la fecha | Las cuatro referencias del libro y el mínimo, con el mismo texto y «13/11» | correcto |
| Aviso común de Brickwise | Igual | Igual en las 11 (compra parcial no confirmada y 1,5 % del comprador) | correcto |
| Aktionariat | Fechas al 13/11 | «Precio del emisor · 13/11/2026: 7,25 CHF por acción (fijo)», «… FINMA (13/11/2026)» y «… (6,20 ZCHF frente a 7,25 CHF el 13/11/2026).» | correcto |
| Boss Info | Fechas al 13/11; mínimo «… (unos 17 ZCHF el 13/11)»; «Última operación · 13/11/2026» con la fuente `https://shares.bossinfo.com/` | Así. El alcance ya no dice «hoy no se ha vuelto a leer»: dice que el 13/11 se comprobaron el portal, el historial y, en cadena, la operación y lo que recibió quien vendió (8,2404 ZCHF; 0,1596 de comisión). Esa lectura en cadena es la del revisor (08:45:52 UTC) y el texto no se la atribuye al investigador | correcto (R4, de redacción) |
| Switzerlend | Fechas al 13/11; mínimo «1 acción (68,01 CHF el 13/11)» | Así, con sus dos avisos y «Supervisor» al 13/11 | correcto |
| Suizas (corrección del revisor) | Ninguna hora copiada del 12/11 en la entrega | Ninguna: busqué `2026-11-13T00:` y «13/11/2026 … 00:» en escaparate, documentación, radar, manifiesto, contraste, `revision.json`, el SQL y el `transparencia.json` del ensayo, y no sale. Las 82 horas reales de `horasRealesSuiza` salen del inventario del grupo (73 con la misma dirección; las 9 de FINMA y de la cadena, con la dirección de la API que se llamó a esa hora). Los expedientes siguen con las horas copiadas (R10) | correcto |
| Hausera | Sin cambios; re-fechar al 13/11 | Aviso «… El 13/11/2026 Alicante 3 aún no estaba inscrita…», mínimo «(13/11)» con su alcance «El 13/11/2026 aún no se podía invertir…» e «Historial publicado · 13/11/2026: 42 operaciones, 24 terminadas, 128 M€ financiados». «Alicante 2 ya figuraba como financiada el 10/11/2026» se queda con su fecha | correcto (R1) |
| Después de aplicar (`transparencia.json`) | Fecha 13/11 solo donde se volvió a consultar hoy la misma fuente; mínimos cortos | 43 de 44 comprobaciones al 13/11 (se queda en el 10/11 la «supervisada» de mTBILL: hoy no se releyó la BaFin); 11 de 11 títulos «Brickwise · mercado de reventa en la app (13/11/2026)»; mínimos cortos de las 11 de Brickwise (Pottendorfer «Desde 73 € la participación (13/11)», 35 caracteres; el más largo, 38), de Switzerlend «1 acción (68,01 CHF, 13/11)» y de Hausera «Desde 100 € en Alicante 3 (13/11)»; motivo de Hausera con «el 13/11/2026 la emisión aún no estaba inscrita» | correcto |

**En `aplicar-y-aprobar.sql` aparecen:** «2,40 %», «3,98 %» y «2,84 %» (3 veces
cada una: cifra, métrica y referencia), «Desde 73 € la participación en reventa
(13/11)» (1), «74,10 €» (1), «64,00 € (1 participación, orden del 12/11/2026)»
(1), «Participaciones en venta · 13/11/2026» (11), «(06/11/2026)» (1), «8,2404
ZCHF» y «0,1596» (1 cada uno), «unos 17 ZCHF el 13/11» (1), «68,01 CHF el 13/11»
(1), «Última operación · 13/11/2026» (1), «El 13/11/2026 Alicante 3» (1) e
«Historial publicado · 13/11/2026» (1).

**No aparecen:** «2,41 %», «4,02 %», «Desde 80 €», «116,73», «56,00 €»,
«(23/10/2026)», «November 6», «hoy no se ha vuelto a leer», «El 12/11/2026
Alicante 3», «Hoy no se puede invertir», «(12/11)», ninguna «Participaciones en
venta» del 10/11 o del 11/11 ni ninguna hora `T00:3…` del 13/11. «October 23» (1)
y «getTrades» (3) solo salen en referencias históricas «· consulta 01/11/2026»
que no cambian; «00:3» (1) es un `updatedAt` de una referencia del 01/11 de
Sonnleithnergasse.

## 3. Lo que el montador no aplicó tal cual: mi opinión

1. **Boss Info, fuente de «Última operación».** De acuerdo. Es la corrección 2
   del revisor y DECISIONES §4. El portal enseña «Last trade • 5 Nov 2026, 13:35»
   y la API `getTrades` da 405 a quien abre el enlace.
2. **Horas de los expedientes suizos.** De acuerdo con no tocarlos (el encargo lo
   prohíbe) y con llevar la corrección a la entrega. Lo que se publica no lleva
   ninguna hora copiada, y `despues-de-aplicar.mjs` solo re-fecha una fuente suiza
   con hora real (lo comprobé: Aktionariat 08:31:39 y 08:31:24, Boss Info 08:33:29
   y 08:33:37, Switzerlend 08:32:34 UTC). Para que el expediente también quede
   bien, ver la R10.
3. **Spiko, claim `accesoEspana` y nota «en las cuatro columnas».** De acuerdo.
   Lo que se publica lleva la fecha corregida; el literal y la nota corregidos
   están en `contraste-2026-11-13.json` («correccionesRevisores»). Yo vi hoy la
   misma tabla (§5). Ver la R10.
4. **Propuestas de los expedientes fuera de DECISIONES.** Bien excluidas: textos
   nuevos de tarjeta de Spiko, Robinhood, Kraken y Prosegur, datos de tarjeta de
   mTBILL, fuentes nuevas y los campos «lugar», «concepto» y «pasos». DECISIONES
   es una lista cerrada.

## 4. Lo que enseñarán la tarjeta y «Lo esencial» (web y app)

Calculado con `resumenOferta` y la regla real de la tarjeta. «Hoy» es lo
publicado (base del 12/11 con el `transparencia.json` actual, `ae3ed55e…9f62`).
«Tras aplicar» es la entrega con el `transparencia.json` que deja
`despues-de-aplicar.mjs` en el ensayo (`8666d60c…7956`). Ejecuté las funciones
de la app; la web aplica la misma regla, con una tabla igual (§1, punto 4).

| Oferta | Tarjeta hoy | Tarjeta tras aplicar | «Lo esencial» tras aplicar |
|---|---|---|---|
| Spiko Euro, Smart Cash, Robinhood y Kraken | Mínimo 1 € · España Sí | igual | Mínimo 1 € · España Sí, según la fuente · Salida: «Reembolso diario», «Reembolso diario, con límites», «Cierre con Robinhood, 24/5» y «Venta a Kraken, 24/5» |
| Spiko Dólar | Mínimo 1 USD · España Sí | igual | Salida: Reembolso diario |
| Prosegur | Mínimo 1 gramo de oro · España Sí | igual | Salida: Recompra por Prosegur |
| Aktionariat | Mínimo 500 CHF · España Sí | igual | Salida: Venta a otros accionistas |
| Boss Info | Mínimo 100 CHF · España Sí | igual | igual; el texto largo de la ficha sí pasa a «unos 17 ZCHF el 13/11» |
| mTBILL | Mínimo No verificado · España Sin confirmar | igual | Salida: Sin documentar (fuentes en conflicto: «Las fuentes no coinciden») |
| Switzerlend | Mínimo 1 acción (68,01 CHF, 12/11) · España Sí | Mínimo 1 acción (68,01 CHF, **13/11**) · España Sí | misma fecha que la ficha |
| Pottendorfer | Mínimo Desde 80 € la participación (12/11) · España Sin confirmar | Mínimo Desde **73 €** la participación (**13/11**) · España Sin confirmar | Salida: Primera cancelación a 15 años; reventa |
| Las otras 10 de Brickwise | Mínimo Desde X € la participación (12/11) · España Sin confirmar | el mismo precio con «(13/11)» | Salida: «Reventa en la app, si hay comprador» o «Nominal en 2038; antes, reventa» |
| Hausera | Mínimo Desde 100 € en Alicante 3 (12/11) · España Sin confirmar | Mínimo Desde 100 € en Alicante 3 (**13/11**) · España Sin confirmar | Salida: Al vender las viviendas, sin fecha fija |

- **Cambia solo el mínimo, en 13 tarjetas** (las 11 de Brickwise, Switzerlend y
  Hausera). En ninguna cambian España, la salida de «Lo esencial» ni el estado.
  A nivel de `resumenOferta` son 14, porque Boss Info cambia el texto largo y no
  el corto. Coincide con el montador.
- **Vigencia.** Las 22 siguen vigentes el 20/11 a las 23:30 UTC con los mismos
  textos. El 21/11 a las 00:30 UTC caducan todas: «Mínimo No verificado · España
  Sin confirmar».
- **Normas de las tarjetas.** 63 datos con etiqueta fija («Mínimo de
  inversión», «Acceso desde España», «Salida» o «Reembolso»), tres por ficha y
  ninguno en mTBILL: 119 caracteres como mucho, todos con consulta del 13/11 y
  fuente. Ningún mínimo dice «por participación», «por token» ni «por acción».
  Las 14 de reventa y próximas no llevan `rentabilidad` ni `precio`. Ninguna cita
  en alemán o inglés sube a la tarjeta.
- **Textos nuevos o cambiados.** Castellano llano y sin promesas («Variable y no
  garantizado», «No es el precio de emisión»). Todas las fechas van en DD/MM o
  DD/MM/AAAA y son las buenas: las comprobé contra la API de Spiko, el libro de
  Brickwise, el oráculo, la cadena y los registros (§5). Dos se pueden decir
  mejor (R4 y R5).
- **Entre aplicar el SQL y publicar la web y la OTA** (la web y la app leen el
  catálogo en línea, pero llevan dentro la transparencia del 12/11): la
  transparencia no casa con la fecha 13/11 y la tarjeta usa el texto largo
  recortado, por ejemplo «Mínimo Desde 73 € la participación en reventa… · España
  Sin confirmar» o «Mínimo 100 CHF por transferencia al emisor; en… · España Sí».
  No es falso, pero se ve peor. Por eso conviene publicar la web y la OTA nada más
  aplicar (paso 7 del montador; R3).

## 5. Fuentes primarias que abrí yo (13/11/2026, UTC)

| Cifra de la entrega | Fuente | Lo que leí | Hora |
|---|---|---|---|
| Spiko Letras Euro 2,40 % (VL del 12/11) | `https://public-api.spiko.io/v0/share-classes/EUTBL/yield` y `…/net-asset-values/EUTBL/latest` | `"monthlyYield":"0.024"`, `"updatedAt":"2026-11-12T17:44:43.923Z"`; VL `"day":"2026-11-12…"`, `"value":"1.062803"`. Próxima cifra: `nextYieldTimestamp` 1794592800 = hoy a las 18:00 UTC | 09:26:52 |
| Spiko Letras Dólar 3,98 % en USD | `…/share-classes/USTBL/yield` y `…/USTBL/latest` | `"monthlyYield":"0.0398"`, `updatedAt` 2026-11-12T17:44:58Z; VL `"1.102694"` USD del 12/11 | 09:26:53 |
| Spiko Smart Cash 2,84 % (VL del 12/11) | `…/share-classes/eurSAFO/yield` y `…/eurSAFO/latest` | `"dailyYield":"0.0284"`; VL `"1.017107"` EUR del 12/11, calculada el 12/11 a las 20:39:20 UTC. Próxima: 1794598200 = hoy a las 19:30 UTC | 09:26:54 |
| El cálculo de las dos Letras | `https://public-api.spiko.io/v0/net-asset-values/EUTBL?startDay=2026-10-08` y `…/USTBL?…` | EUTBL: 12/10 1,060664 → 12/11 1,062803: **2,4004 %** (capitalizando a 365/31). USTBL: no hay VL del 12/10; 13/10 1,099159 → 12/11 1,102694: **3,9839 %** (a 365/30) | 09:27:04 |
| «Acceso desde España» de Spiko (dato del 06/11) | `https://docs.spiko.io/documentation/product_overview/fund_availability` | «Last updated: November 6, 2026» y «Spain ✅ ✅ ✅ ❌» (Smart Cash, T-Bills Euro, T-Bills Dollar y T-Bills Pound) | 09:27:12 |
| Lo que dice la web de Spiko | `https://www.spiko.io/es/spiko-letras-del-tesoro-euro`, `…-dollar` y `…/spiko-euro` | «2,40% Rendimiento neto actual», «3,98% Rendimiento neto actual», «2,84% * Rendimiento neto actual» y «de los últimos 31 días» | 09:33:00 |
| Brickwise: los 11 mínimos y las referencias del libro | `https://api.app.brickwise.at/api/v1/assets` y `…/api/v2/assets` | SHA-256 `d04d417f…ce9a` y `197a25e3…1dd1`: los mismos archivos que leyeron el investigador (08:30:44) y el revisor (08:41:37 y 08:48:00). Calculado por mí: **Pottendorfer** (AT0000A324B4) más barata 73 € × 1, orden creada el 12/11 a las 21:45 UTC; menor importe 1 × 73 € → 74,10 € con el 1,5 %; 107 en venta (v1 y v2); compra 19 € × 3. **Cohotel** 59 en venta; **GreenPoint** 347 (102 € × 5 + 2 + 1); **Schwarzer Weg** 299; **Randhartingergasse** mejor compra 64 € × 1 (12/11, 15:34 UTC). Las otras seis fichas, y el resto de datos de estas cinco, igual que la entrega (precios, órdenes, fechas e importes con el 1,5 %) | 09:27:22–09:27:24 |
| Pottendorfer, justo antes de cerrar | `https://api.app.brickwise.at/api/v1/assets` | Mismo SHA-256 `d04d417f…`: la orden de 73 € sigue abierta | 09:41:14 |
| mTBILL: 3,45 % (06/10 → 10/11) y 1,0777 USD, sin cambios | Oráculo `0x056339C044055819E8Db84E71f5f2E1F536b2E5b`, `eth_call` en `https://ethereum-rpc.publicnode.com` y en `https://eth.drpc.org`, bloque 26.405.141 | Última ronda, la **492**: 1,07768132 USD, del 10/11 a las 18:40:23 UTC (no hay ronda del 11, del 12 ni del 13/11). Ronda **468**: 1,07410723 USD, del 06/10 a las 14:16:11 UTC. Son 35,183 días: **3,452 % anual simple** | 09:27:44–09:27:55 |
| Hausera: mínimo y documento | Documento de emisión de Alicante 3, `https://drive.google.com/file/d/1cpWVN3J_Y1xdRDAxUzGnjmWXB-eTODH_` (descarga pública) | SHA-256 `9170562a…47b4`, igual que el expediente. «Ticket mínimo: 100,00 euros», «no es considerado un folleto informativo» y la suscripción «se inicia el 25/11/2026 y se extenderá hasta el 30/6/2027». Borrado tras leerlo | 09:28:04–09:28:07 |
| Hausera: Alicante 3 sigue «próxima» | `https://hausera.io/page-data/propiedad/alicante_3/page-data.json` | SHA-256 `8f323413…5cfd`: el mismo archivo que el investigador, el revisor y el 12/11 | 09:28:30 |
| Hausera: «El 13/11/2026 … aún no estaba inscrita» | `https://www.cnmv.es/portal/consultas/esi/erir_esi?nif=A86796182&lang=es` (solo la página 1 de 3; las tres las leyó el revisor del grupo a las 08:46 UTC) | En esa página figuran HAUSERA PROPERTY MANAGER SPV 2 a SPV 8. No figura la SPV 11 (la de Alicante 3), ni la 9 ni la 10 | 09:40:10 |
| Switzerlend: 68,01 CHF y recompra apagada | Contrato de venta del emisor `0x8d90319fe817fe9e23973fcab9f1ff0f1e0d9b65`, `eth_call`, bloque 26.405.194 | `getPrice()` 68,0105; `settings()` 5 (sin el bit de recompra) | 09:38:17 |

No volví a abrir los documentos de Robinhood, Kraken, Prosegur ni los portales de
Aktionariat y Boss Info, ni FINMA, BaFin o ESMA: no cambian y los abrieron los
revisores de cada grupo entre las 08:40 y las 08:54 UTC (lo comprobé en sus
informes y en los expedientes, §6).

## 6. Avisos y referencias con fecha

- **Avisos.** Hay 145, todos con `verificadaEl` 13/11. Sin contar los 22
  genéricos («Referencia editorial gratuita…»), quedan 123, y **los 123 tienen su
  comprobación de hoy en el expediente** (`revisionAvisos` o `avisosConFecha`,
  con fecha del 13/11). En las suizas esas horas son las copiadas, pero el
  revisor del grupo los releyó todos de 08:40 a 08:47 UTC.
  - **Solo cinco avisos cambian de fecha en el texto, y los cinco se
    comprobaron hoy:** Aktionariat «6,20 ZCHF frente a 7,25 CHF el 13/11/2026»
    (libro y precio en cadena, revisor 08:40–08:42 UTC); Boss Info «venta más
    barata 8,40 ZCHF el 13/11/2026» (revisor 08:40:56 y portal 08:46 UTC);
    Switzerlend «el 13/11/2026 la recompra seguía desactivada y casi sin fondos
    (0,03 ZCHF)» (revisor 08:42:03; yo vi `settings()` 5 a las 09:38:17) y «venta
    más barata 67,00 ZCHF el 13/11/2026» (revisor); Hausera «El 13/11/2026
    Alicante 3 aún no estaba inscrita» (investigador 08:30:41, revisor
    08:46:06–08:46:44 y yo 09:40:10 UTC).
  - **No hay ningún aviso re-fechado sin comprobar.** Se quedan con su fecha, y
    siguen siendo ciertos: la ventana de mTBILL «del 06/10 al 10/11/2026» (no hay
    ronda nueva, §5), «MiCA, 30/06/2026» de Prosegur, «§9.1, versión del
    30/10/2026» de Boss Info y Switzerlend (mismo SHA-256), las fechas de alquiler
    de la API de Brickwise (iguales campo a campo, revisor 08:44 UTC) y «Alicante 2
    ya figuraba como financiada el 10/11/2026».
- **Referencias.** 112 llevan consulta del 13/11: los 63 datos de tarjeta, las 44
  del libro de Brickwise, las tres de rentabilidad de Spiko, la «Última
  operación» de Boss Info y el «Historial» de Hausera. **En las 112, la misma
  dirección está entre lo que consultó hoy su expediente**, y en las suizas además
  con hora real en `horasRealesSuiza`. Las demás conservan su fecha anterior.
- **Después de aplicar.** Repetí por mi cuenta la regla de
  `despues-de-aplicar.mjs`: 43 de 44 comprobaciones al 13/11, cada una con la misma
  dirección consultada hoy en su expediente (por ejemplo, la CNMV de Effecta a las
  08:30:50, la de Spiko Finance a las 08:30:40, la de Robinhood a las 08:30:55, el
  KID en español de Robinhood a las 08:30:46, las condiciones finales LITEx a las
  08:31:04, la lista de criptoactivos de la CNMV a las 08:30:39 y el listado de
  financiación participativa a las 08:31:59 UTC). Se queda en el 10/11 la
  «supervisada» de mTBILL. Ver la R11 sobre su «Documento para España».

## 7. Correcciones obligatorias

Ninguna.

## 8. Recomendadas (no bloquean)

- **R1 · Hausera, del 18/11 al 20/11 (la más importante de la semana).**
  - Hechos: la ficha de Alicante 3 dice «Preventa: 18/11/2026 09:00h» y no da la
    zona horaria (si es hora peninsular, son las 08:00 UTC). En la preventa ya se
    reserva con dinero por adelantado (acuerdo de reserva: «Los fondos anticipados
    podrán ser gestionados por el Emisor…»), y la propia ficha avisa de que «Las
    operaciones pueden cubrirse en la preventa». Esta entrega vale hasta el 20/11.
  - Desde ese momento quedan viejos «la preventa abre el 18/11» (mínimo de la
    ficha), la sección «Próximas» y el criterio de la web y la app «Es un anuncio:
    todavía no se puede contratar». Son casi tres días (con la entrega de ayer,
    algo más de uno y medio).
  - No la hago obligatoria: lo publicado es cierto con su fecha («(13/11)», «El
    13/11/2026 aún no se podía invertir…»), la tarjeta no enseña la fecha de la
    preventa y ningún cambio de texto arregla la colección: eso pide volver a
    mirar Hausera el 18/11.
  - Qué hacer: que el responsable del proyecto pida la siguiente puesta al día
    antes del 18/11 a las 08:00 UTC o, como muy tarde, que se mire Hausera ese
    día desde las 08:00 UTC.
    Si este SQL se vuelve a generar por otro motivo, cambiar en el mínimo «; la
    preventa abre el 18/11.» por «; preventa desde el 18/11.», y en su alcance «la
    preventa abre el 18/11/2026 y la suscripción, el 25/11/2026.» por «la preventa
    estaba prevista desde el 18/11/2026 y la suscripción, desde el 25/11/2026.».
    En ese caso hay que adaptar también la expresión de Hausera de
    `despues-de-aplicar.mjs`, que espera «…; la preventa abre el 18/11.».
- **R2 · Pottendorfer: mirar la orden de 73 € justo antes de aplicar.** Es una
  sola participación. A las 09:41:14 UTC seguía (el mismo archivo de la API que a
  las 08:30:44). Si ya no está, rehacer la entrega con la venta más barata de ese
  momento (cambia el SQL). Si sigue, no hay que hacer nada: el texto lleva su
  fecha.
- **R3 · Publicar la web y la OTA nada más aplicar** (§4, último punto). Mientras
  tanto, la tarjeta enseña el mínimo largo recortado y ninguna oferta enseña
  puntos fuertes ni entra en la Selección.
- **R4 · Boss Info, alcance de «Última operación · 13/11/2026».** «Igual byte a
  byte» no es lenguaje llano. En la próxima entrega, cambiar «que el historial de
  operaciones es igual byte a byte que el del 12/11 (ninguna operación nueva)» por
  «que no hay operaciones nuevas desde el 12/11». Es la R5 del 12/11.
- **R5 · Kraken, alcance de sus tres datos de tarjeta.** Dice a la vez
  «Comprobado de nuevo en la fuente el 13/11/2026.» y «Página de xStocks de Kraken
  UE consultada el 03/11/2026.», que se lee como dos fechas para lo mismo. En la
  próxima entrega, cambiar esas dos frases por «Comprobado de nuevo en la fuente
  el 13/11/2026 (página de xStocks de Kraken UE).»; en el de acceso, lo que sigue
  («Kraken no nombra España…») se queda igual.
- **R6 · Brickwise: rentabilidades viejas en la ficha de reventa (cuarta vez).**
  - En seis fichas (Plüddemanngasse, Sonnleithnergasse, Stallhofstraße,
    Schwarzer Weg, Randhartingergasse y Pottendorfer) un aviso dice «la
    rentabilidad no se muestra», pero «Datos con su fecha» enseña, por ejemplo,
    «Rentabilidad por alquiler esperada (API de la app) · 22/10/2026: 4,22 %» o
    «Distribución anual esperada · 22/10/2026: 3,76 %».
  - En otras seis (Hinterstoder, Drautalresidenz, Klagenfurt, Plüddemanngasse,
    Schwarzer Weg y Stallhofstraße) sale «Próxima distribución esperada ·
    22/10/2026: 15/11/2026», que del 16 al 20/11 será una fecha pasada.
  - No es de hoy y DECISIONES no lo recoge. Que el coordinador decida en el
    próximo ciclo quitarlas de las 11 fichas de reventa (R5 del 10/11, R4 del 11/11
    y R10 del 12/11).
- **R7 · Brickwise: «Desde X € la participación» cuando a ese precio solo hay un
  lote.** Hoy pasa en cuatro fichas: Sonnleithnergasse 11 × 75 € (837,38 € con el
  1,5 %), Hinterstoder 5 × 75 € (380,63 €), Drautalresidenz 3 × 70 € (213,15 €) y
  Plüddemanngasse 2 × 75 € (152,25 €). El aviso común lo explica, pero solo en la
  ficha. Pottendorfer ya no (1 × 73 €). Para la próxima decisión: «Desde 75 € (lote
  de 11, 13/11)».
- **R8 · mTBILL: el aviso de la rentabilidad se ve sin ninguna cifra.** La vista
  tapa la métrica mientras dure el conflicto. En la próxima entrega, cambiarlo por:
  «RWAdar no enseña la rentabilidad de mTBILL mientras sus documentos no
  coincidan. La que calcula con el valor que publica el emisor (del 06/10 al
  10/11/2026) es pasada, está en dólares, no descuenta el 0,07 % del reembolso
  inmediato ni el cambio euro/dólar, y no garantiza la futura.» (R2 del 12/11).
- **R9 · GreenPoint, «Venta más barata · 13/11/2026».** «(8 a ese precio, en 3
  órdenes de 5, 2, 1)» → «(8 a ese precio, en 3 órdenes de 5, 2 y 1)».
- **R10 · Expedientes sin corregir.** Lo publicado está bien, pero los
  expedientes de Spiko siguen con el claim `accesoEspana` «Last updated: October
  23, 2026» y `fechaDato` 2026-10-23 (y la nota «en las cuatro columnas»), y los
  tres suizos con 79 de 82 horas copiadas del 12/11. Que los corrija quien los
  escribió, o que el coordinador lo deje anotado, antes de cerrar el ciclo.
- **R11 · mTBILL, «Documento para España» al 13/11.** Su enlace
  (`https://docs.midas.app/resources/legal-product-documentation/mtbill`) da 403
  (investigador, entre las 08:30:58 y las 08:36:29; revisor, 08:46:02 UTC). El
  contenido sí se comprobó hoy: las condiciones finales y el KID en español, con
  el mismo SHA-256, desde el CDN de GitBook (08:30:47 UTC). En el próximo ciclo, apuntar la fuente al PDF o no
  contar una dirección que el expediente da por bloqueada (R7 del 12/11).
- **R12 · Spiko Dólar, «31 días».** La ventana real es del 13/10 al 12/11 (30
  días) por el festivo. Es la etiqueta de la propia Spiko («de los últimos 31
  días», 09:33 UTC) y el alcance lo explica, así que vale como cita.

## 9. Límites de esta revisión

- Mi revisión es de contenido. No ejecuté `npm test` ni el ensayo: usé el código
  real (`resumenOferta`, la tarjeta y «Lo esencial» de la app y la regla de la
  web) sobre los archivos de la entrega y, solo leyendo, sobre la copia del ensayo
  del montador, donde volví a ejecutar `despues-de-aplicar.mjs` (sin cambios).
  No miré la web en un navegador ni hice capturas.
- Mis lecturas son de las 09:26 a las 09:41 UTC. Los libros de órdenes y la API de
  Spiko cambian durante el día: Spiko publica VL nuevas hoy a las 18:00 (Letras) y
  a las 19:30 UTC (Smart Cash). Las cifras de la entrega seguirán siendo ciertas
  con su fecha.
- Datos personales y lo que entra en Git: es de la revisión de cumplimiento. En
  este informe no hay nombres de personas ni direcciones de cartera de
  particulares (las dos direcciones que cito son contratos: el oráculo de mTBILL y
  el contrato de venta de Switzerlend).
- Nota menor: si `despues-de-aplicar.mjs` se ejecuta una segunda vez, su resumen
  dice «Títulos de puntos fuertes con fecha de consulta: 0 de 0» (ya están al
  13/11). No cambia nada; la primera pasada dice 11 de 11.

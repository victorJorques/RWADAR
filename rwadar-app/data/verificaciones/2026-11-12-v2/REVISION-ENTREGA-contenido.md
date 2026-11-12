# Revisión independiente de contenido · entrega 2026-11-12 (solo lectura)

**Veredicto: `aprobado`.** Lo que va en el SQL se puede aplicar tal cual, y lo que
cambia después de aplicar (`despues-de-aplicar.mjs`) también. Cada cambio de
`DECISIONES-COORDINADOR.md` está aplicado con su texto, su fuente y sus fechas, y
no cambia nada más. Las cifras que abrí yo hoy en la fuente primaria coinciden
todas con la entrega. **No hay correcciones obligatorias.** Dejo diez
recomendadas (§8). La más urgente es la R1: en Hausera, «Hoy no se puede
invertir» deja de ser cierto el 18/11, cuando abre la preventa, y la ficha vale
hasta el 19/11.

- Revisión `7ad7ea72-d18e-4833-9f36-38f4a7ceaf25`, sobre la publicada
  `24b5f7de-2834-3e15-6ae4-62a6d9565161` (entrega 2026-11-11).
- **SHA-256 de `aplicar-y-aprobar.sql`: `4815b3cb3c63501f3fb69fa3b0ac0318d9c32210d88539cfb7742254f667e7ff`**
  (comprobado a las 01:27 UTC; es el que dice el montador). `catalogo.sql`
  `71b126d0…3fc6`, `revision.json` `3ac28c31…2c38`, `escaparate-publicacion.json`
  `06212b6a…2ab3`, `documentacion-ofertas.json` `27a8db3f…f858`,
  `contraste-2026-11-12.json` `cf479743…9dd9`, `manifiesto-catalogo.json`
  `c2c51919…4224`, `DECISIONES-COORDINADOR.md` `6d4bfe3b…6ef6`. Son los mismos
  bytes que guardó el coordinador en el commit local `523f89e` (lo comprobé a las
  01:57 UTC con `git show`).
- Revisor: Claude, 12/11/2026, de 01:27 a 02:00 UTC. No monté esta entrega. No
  he tocado Supabase, no he publicado, no he lanzado flujos y no he hecho commit.
  En el repositorio solo he escrito este informe. Mis scripts y mis lecturas están
  en la carpeta temporal de la sesión (`scratchpad/revision-contenido-1211`),
  fuera de Git. El documento de emisión de Alicante 3 (lleva datos personales) lo
  borré nada más leerlo. Las copias en bruto de la API de Brickwise (llevan
  direcciones de cartera) las borré al terminar; de ellas solo guardo un resumen
  sin direcciones.

## 1. Qué hice

1. Comprobé que la base de la entrega es lo publicado: la documentación y los
   avisos de las 22 ofertas de la 2026-11-11 son iguales a
   `lectura-publica/ofertas-v2.json`, y también las métricas, la rentabilidad y
   el resumen de las 7 que están «actual».
2. Comparé, ficha por ficha y campo por campo, `escaparate-publicacion.json` y
   `documentacion-ofertas.json` de la base con los de hoy. Emparejé métricas,
   avisos y referencias por su texto, no por su posición.
3. Comparé lo que leería un visitante después de aplicar (las vistas que exportó
   el ensayo del montador desde PGlite, con el mismo SQL `4815b3cb…`) con el
   escaparate y la documentación revisados: iguales en las 22 (documentación,
   avisos, colección, estado, fecha y vigencia; métricas, rentabilidad y resumen
   en las 7 «actual»). Así veo también lo que tapa la vista.
4. Ejecuté `resumenOferta` (`rwadar-site/assets/ficha-editorial-20261022.js`, el
   mismo archivo byte a byte que `rwadar-movil/lib/ficha-editorial.js`) con las 22
   ofertas de `escaparate-publicacion.json` más su documentación, y también con el
   catálogo sincronizado del ensayo. Lo hice el 12/11 a las 02:00, el 18/11 a las
   12:00, el 19/11 a las 23:30 y el 20/11 a las 00:30 UTC. Encima apliqué la regla
   de la tarjeta y de «Lo esencial» de la web (`datosCortosOferta`) y de la app
   (`rwadar-movil/lib/transparencia.js`), con el `transparencia.json` que deja
   `despues-de-aplicar.mjs` en el ensayo (SHA-256 `c4edf956…3ad4`).
5. Validé las 22 documentaciones con la misma regla de la web
   (`documentacionOfertaLocal`): si una referencia falla, la web no enseña
   ninguna. Resultado: 22 de 22 válidas el 12/11 y el 19/11.
6. Abrí yo hoy la fuente primaria de todas las cifras que cambian y de varias que
   no (§5).
7. Crucé cada aviso y cada referencia que pasan al 12/11 con lo que consultó hoy
   su expediente (§6).

## 2. DECISIONES, punto por punto

| Ficha | Lo que pide DECISIONES | Lo que hay en la entrega | Veredicto |
|---|---|---|---|
| General | Etiqueta `2026-11-12`; las mismas 22 ofertas (8/13/1); `verificadaEl` 12/11 y 7 días (último día, el 19/11) | 22 ofertas y 25 plataformas; ninguna cambia de colección, estado, título, resumen, fuentes ni imagen; las 22 con `verificadaEl` 2026-11-12, `vigenciaDias` 7 y documentación revisada el 12/11 | correcto |
| Spiko Letras Euro y Dólar | Sin cambios; solo la fecha de verificación | Solo cambian `verificadaEl` y la consulta de sus tres datos de tarjeta («Comprobado de nuevo en la fuente el 12/11/2026»). Cifra (2,41 % y 4,02 %), métrica, literal («… consultado el 11/11/2026») y referencia de rentabilidad, iguales | correcto (§3.1) |
| Spiko Smart Cash | 2,84 % con la VL del 11/11; literal «valor liquidativo del 11/11/2026; consultado el 12/11/2026»; métrica «… · 11/11/2026: 2,84 %» | Métrica exacta. Literal del expediente: «Tipo que publica Spiko, ya descontadas sus comisiones, con el valor liquidativo del 11/11/2026 (consultado el 12/11/2026); la web lo presenta como el tipo que paga cada día el banco con el que el fondo tiene el swap. Variable: sigue al €STR; no es un tipo fijo ni está garantizado.» Referencia «Rendimiento neto publicado»: dato del 11/11, consulta del 12/11, fuente `data.spiko.io/safo-eur`. El aviso 2 sigue igual | correcto (§3.2) |
| mTBILL | Rentabilidad null → 3,45 % anual en USD; métrica; aviso nuevo con la ventana; quitar «APY observado 3,41 %» y «3,42 % · 7D APY»; sigue en `fuentes_en_conflicto`; valor por token 1,0777 USD (10/11) | Métrica «Rentabilidad pasada · 5 semanas hasta el 10/11/2026 · en USD: 3,45 % anual». Aviso con el texto exacto de DECISIONES. Fuera las dos referencias de midas.app (11 → 9 referencias). Estado y valor por token, igual. El campo `rentabilidad` sigue en null | correcto, con la salvedad de §3.3 (la base no admite otra cosa) y la R2 |
| Robinhood, Kraken xStocks y Prosegur | Sin cambios; solo la fecha | Solo cambian `verificadaEl` y la consulta de los tres datos de tarjeta | correcto |
| Brickwise (11) | Cohotel 110 → 102 €; GreenPoint 100 → 102 €; Pottendorfer 73 → 80 €; las otras 8 solo la fecha; aviso común nuevo en las 11; importes con el 1,5 %: 96,43, 100,49 y 116,73 € | Los 11 mínimos «Desde X € la participación en reventa (12/11)», con los precios de DECISIONES. Aviso común con el texto exacto en las 11 (en el SQL, 11 veces). «Orden de venta de menor importe · 12/11/2026» en las 11, con los tres importes bien redondeados (y los otros ocho). Todo comprobado orden a orden en mi lectura del libro (§5). Acceso, salida, métricas, resumen y «Desistimiento», sin cambios | correcto (§3.4 a §3.6) |
| Aktionariat | «Precio del emisor», «Supervisor» y aviso con dato del día al 12/11; acceso y salida publicados | Así: «Precio del emisor · 12/11/2026: 7,25 CHF por acción (fijo)», «… FINMA (12/11/2026)» y «… (6,20 ZCHF frente a 7,25 CHF el 12/11/2026).» Tarjeta igual | correcto |
| Boss Info | «Supervisor», aviso y mínimo «… desde 2 acciones (unos 17 ZCHF el 12/11)»; «Última operación · 12/11/2026» con fuente `https://shares.bossinfo.com/` y su alcance | Así. El alcance dice lo que se comprobó el 12/11 (portal, historial sin operaciones nuevas, la operación en cadena del 05/11/2026 a las 13:35:35 UTC) y que el importe de 8,2404 ZCHF es del 10/11 | correcto (R5, de redacción) |
| Switzerlend | Dos avisos, «Supervisor» y mínimo «1 acción (68,01 CHF el 12/11)» | Así | correcto |
| Hausera | Sin cambios de contenido; re-fechar al 12/11 solo lo consultado hoy | Aviso «… El 12/11/2026 Alicante 3 aún no estaba inscrita…», mínimo «(12/11)» e «Historial publicado · 12/11/2026». Se quedan las fechas que son hechos («Alicante 2 ya figuraba como financiada el 10/11/2026») | correcto (R1 y R4) |
| Radar | 69 de 69; no cambia ninguna dirección ni texto | En las 25 plataformas solo cambian `verificadoEl` y `consultadaEl`; nada más | correcto |
| Después de aplicar (`transparencia.json`) | Fecha 12/11 solo donde el expediente volvió a consultar esa fuente; mínimos cortos de Brickwise (cambian Cohotel, GreenPoint y Pottendorfer) y de Switzerlend «1 acción (68,01 CHF, 12/11)» | Ensayo: 43 de 44 comprobaciones al 12/11 (se queda en el 10/11 la «supervisada» de mTBILL), 11 de 11 títulos de puntos fuertes, los 11 mínimos cortos de Brickwise, el de Switzerlend y el de Hausera | correcto (§3.7; matiz de mTBILL en la R7) |
| Noticias | No van en el SQL | El SQL no lleva noticias. La única palabra «noticias» es un texto de plataforma que ya estaba ayer | correcto |

En `aplicar-y-aprobar.sql` aparecen: «3,45 % anual» (1 vez), «(del 06/10 al
10/11/2026)» (1), el aviso común de Brickwise (11), «Desde 102 € la participación
en reventa (12/11)» (2), «Desde 80 € la participación en reventa (12/11)» (1),
«96,43 €», «100,49 €» y «116,73 €» (1 cada uno), «(unos 17 ZCHF el 12/11)» (1),
«1 acción (68,01 CHF el 12/11)» (1), «Última operación · 12/11/2026» (1) y «El
12/11/2026 Alicante 3 aún no estaba inscrita» (1).

No aparecen: «APY observado», «7D APY», «Desde 73 €», «Desde 110 €», «Desde 100 € la
participación», «96,42», «100,48», «116,72», «Última operación · 10/11/2026», «lo
que creció el fondo», «2,80 %», «2,83 %» ni «El 10/11/2026 Alicante 3». «3,53»
sale dos veces, pero dentro de «103,53 €» (Cohotel y GreenPoint), no como
rentabilidad de mTBILL.

## 3. Lo que el montador no aplicó tal cual: mi opinión

1. **Spiko Letras, literal «consultado el 11/11/2026».** De acuerdo. DECISIONES
   dice «sin cambios… Solo cambia la fecha de verificación». A las 01:28 UTC la
   API da los mismos ficheros que ayer (`9cc1e1be…` y `1bbc7629…`), así que el
   literal publicado sigue siendo cierto con su fecha.
2. **Smart Cash, literal del expediente.** De acuerdo. Cambiar solo las fechas
   del literal publicado dejaría «lo que creció el fondo en su último día de
   cálculo, pasado a un año». Con las VL del 10/11 (1,016952 €) y del 11/11
   (1,017029 €) eso da 2,76 % simple y 2,80 % capitalizando, no 2,84 %. El literal
   nuevo lo describe como lo que es, el tipo neto que publica Spiko, y dice lo
   mismo que la web, que he visto yo hoy (§5). DECISIONES §4 lo da por bueno al
   pedir la explicación de esas cifras.
3. **mTBILL, campo `rentabilidad` en null.** De acuerdo. La base de datos lo
   impide: `rwadar-app/db/24_catalogo_publico_verificado.sql`, línea 187,
   `estado_revision = 'actual' or (rentabilidad is null and precio is null)`.
   También lo impide el contrato (`validarOferta`: «una oferta bloqueada conserva
   cifras comerciales»). DECISIONES mantiene a la vez `fuentes_en_conflicto`. Para
   el visitante el resultado es el mismo que pedía DECISIONES: la vista tapa la
   cifra. Lo comprobé en la exportación del ensayo: resumen «Condiciones
   pendientes de nueva revisión…», métricas «Cifras pendientes de nueva revisión».
   El coordinador tiene que dar por buena esta lectura. El aviso sí se ve: ver la
   R2.
4. **«Participaciones en venta» de Cohotel, GreenPoint, Pottendorfer y Schwarzer
   Weg.** De acuerdo. Hoy son 59, 347, 106 y 299, y lo publicado dice 65, 351 y
   107 (al 11/11) y 300 (al 10/11). Re-fecharlas con la cifra vieja sería falso.
   Cambiar la cifra no está en DECISIONES. Con su fecha siguen siendo ciertas.
5. **Tres textos del libro con otra redacción en el expediente.** De acuerdo con
   re-fechar el texto publicado. En Hinterstoder lo publicado es más exacto:
   «20,00 € (4 participaciones en 2 órdenes; la más antigua del 19/05/2025)». Lo
   vi en la API: 1 participación del 19/05/2025 y 3 del 29/09/2026, las dos a
   20 €.
6. **«Orden de venta de menor importe» en las 11.** De acuerdo: es la única
   lectura posible de «Importes con el 1,5 %, donde aparezcan». El revisor de
   Brickwise lo dice así: «Hoy se añade en la ficha la «Orden de venta de menor
   importe … con el 1,5 %»». Los 11 importes están bien redondeados (0,005 sube):
   91,35; 85,26; 103,53 (dos veces); 96,43; 79,17; 100,49; 70,95; 81,20; 69,83 y
   116,73 €.
7. **Mínimo corto de Hausera, de «(10/11)» a «(12/11)».** De acuerdo. Cumple
   DECISIONES §2 (el documento de emisión se releyó hoy) y la regla de la C1 del
   11/11 (la tarjeta lleva la misma fecha que la ficha). No cambia el SQL.
8. **Propuestas de los expedientes que no están en DECISIONES.** Bien
   excluidas: las fuentes nuevas de Spiko, Brickwise y Midas y los textos nuevos
   de tarjeta de Spiko, Robinhood, Kraken y Prosegur. Tampoco entran los textos
   de tarjeta que proponía el expediente de mTBILL. Por estar en conflicto, la
   tarjeta los taparía igual.
9. **Cabecera de `cambios-radar.json`** (dice 2026-11-11). No llega al público ni
   cambia la salida. Que lo corrija el coordinador, que es quien firma ese
   archivo.

## 4. Lo que enseñarán la tarjeta y «Lo esencial» (web y app)

Calculado con `resumenOferta` y la regla de la tarjeta. «Hoy» es lo publicado
con el `transparencia.json` actual (`81e78ab9…3808`). «Tras aplicar» es la entrega
con el `transparencia.json` que deja `despues-de-aplicar.mjs` en el ensayo. Con el
escaparate sin la máscara de la vista sale exactamente lo mismo.

| Oferta | Tarjeta hoy | Tarjeta tras aplicar | Comentario |
|---|---|---|---|
| Spiko Euro, Smart Cash, Robinhood y Kraken | Mínimo 1 € · España Sí | igual | |
| Spiko Dólar | Mínimo 1 USD · España Sí | igual | |
| Prosegur | Mínimo 1 gramo de oro · España Sí | igual | |
| Aktionariat | Mínimo 500 CHF · España Sí | igual | |
| Boss Info | Mínimo 100 CHF · España Sí | igual | el texto largo de la ficha sí pasa a «unos 17 ZCHF el 12/11» |
| Switzerlend | Mínimo 1 acción (68,01 CHF, 11/11) · España Sí | Mínimo 1 acción (68,01 CHF, 12/11) · España Sí | misma fecha que la ficha |
| Brickwise (11) | Mínimo Desde N € la participación (11/11) · España Sin confirmar | Cohotel y GreenPoint «Desde 102 €…», Pottendorfer «Desde 80 €…»; las otras 8, su precio de ayer con «(12/11)» | el más largo tiene 38 caracteres (máximo 40); ver la R3 |
| Hausera | Mínimo Desde 100 € en Alicante 3 (10/11) · España Sin confirmar | Mínimo Desde 100 € en Alicante 3 (12/11) · España Sin confirmar | |
| mTBILL | Mínimo No verificado · España Sin confirmar | igual | fuentes en conflicto; «Lo esencial»: «Salida: Sin documentar» |

- **Cambia solo el mínimo, en 13 tarjetas:** las 11 de Brickwise, Switzerlend y
  Hausera. En ninguna cambian el acceso desde España, la salida de «Lo esencial»
  ni el estado. Coincide con lo que dice el montador. Él cuenta 14 cambios a nivel
  de `resumenOferta`, porque Boss Info cambia el texto largo pero no el corto.
- **Vigencia.** Las 22 siguen vigentes el 19/11 a las 23:30 UTC, con los mismos
  textos. El 20/11 a las 00:30 UTC caducan todas: «Mínimo No verificado · España
  Sin confirmar».
- **Normas de las tarjetas.** Hay 63 datos con etiqueta fija («Mínimo de
  inversión», «Acceso desde España», «Salida» o «Reembolso»): tres por ficha y
  ninguno en mTBILL. Tienen 119 caracteres como mucho y todos llevan la consulta
  del 12/11. Ningún mínimo dice «por participación», «por token» ni «por acción».
  Las 14 de reventa y próximas no llevan `rentabilidad` ni `precio`.
- **Textos nuevos o cambiados.** Están en castellano llano y sin promesas («no
  garantiza la futura», «no es un tipo fijo ni está garantizado», «No es el
  precio de emisión»). Las fechas van en DD/MM y son las buenas: las comprobé
  contra la API, el oráculo y los portales. Hay dos que se pueden decir mejor (R5
  y R9).

## 5. Fuentes primarias que abrí yo (12/11/2026, UTC)

| Cifra de la entrega | Fuente | Lo que leí | Hora |
|---|---|---|---|
| Smart Cash 2,84 % con la VL del 11/11 | `https://public-api.spiko.io/v0/share-classes/eurSAFO/yield` y `…/net-asset-values/eurSAFO/latest` | `"dailyYield":"0.0284","weeklyYield":"0.0284","monthlyYield":"0.0284"`; `previousYieldTimestamp` 1794414411 (11/11 a las 16:26:51); VL `"day":"2026-11-11"`, `"value":"1.017029"`. La próxima cifra llega a las 19:30 UTC de hoy (`nextYieldTimestamp` 1794511800) | 01:28:04 (y 01:51:36, igual) |
| La misma, en la fuente de la referencia | `https://data.spiko.io/safo-eur` (Chromium, sin sesión) | «30D YIELD 2.84% Annualised LATEST NAV 1.0170 2026-11-11» | 01:38:51 y 01:39:07 |
| Lo que dice la web (literal nuevo y aviso 2) | `https://www.spiko.io/es/spiko-euro` (Chromium) | «Interés a tipo fijo 2,84%», «Garantizado por contrapartes» y «*Tipo neto de comisiones abonado diariamente por la contraparte bancaria (BNP Paribas)» | 01:39:17 |
| Spiko Letras 2,41 % y 4,02 % (sin cambios) | `…/share-classes/EUTBL/yield` y `…/USTBL/yield`, y sus `…/latest` | Mismos archivos que ayer (`9cc1e1be…` y `1bbc7629…`): `monthlyYield` 0.0241 y 0.0402; VL 1,062738 € del 11/11 y 1,102496 $ del 10/11. Su próxima VL llega a las 18:00 UTC de hoy | 01:28:05–01:28:06 |
| mTBILL: 3,45 % (06/10 → 10/11) y 1,0777 USD | Oráculo `0x056339C044055819E8Db84E71f5f2E1F536b2E5b`, `eth_call` en `https://ethereum-rpc.publicnode.com`, bloque 26.395.576 | «mTBILL/USD», 8 decimales. Última ronda, la **492**: 1,07768132 USD, del martes 10/11 a las 18:40:23. Ronda **468**: 1,07410723 USD, del martes 06/10 a las 14:16:11. Son 35,183 días: **3,452 % simple** (3,506 % compuesta) | 01:29:02 (a las 01:51:36 la 492 sigue siendo la última) |
| Brickwise: los 11 mínimos y todas las referencias del libro | `https://api.app.brickwise.at/api/v1/assets` | SHA-256 `223cb2fd…`: el mismo archivo que leyeron el investigador (00:32:59) y el revisor (00:40:32); el libro no se ha movido desde entonces. **Cohotel:** más barata 102 € × 1 (11/11), 59 en venta, menor importe 1 × 102 € → 103,53 €, compra 3 € (23/11/2024). **GreenPoint:** 102 € × 8 (5, 2 y 1), 347 en venta, 1 × 102 € → 103,53 €, compra 84 €. **Pottendorfer:** 80 € × 11 (08/02/2026), 106 en venta, 1 × 115 € → 116,73 €, compra 19 € × 3. **Klagenfurt:** 95 € × 16 (5, 10 y 1), 302, 1 × 95 € → 96,43 €. **Plüddemanngasse:** 75 € × 2 (04/11), 335, 1 × 99 € → 100,49 €. **Hinterstoder:** 75 € × 5 (08/11), 265, 1 × 90 €. **Drautal:** 70 € × 3 (18/10), 150, 1 × 84 €. **Randhartinger:** 78 € × 21 (20 y 1), 189, compra 56 € (10/11). **Schwarzer Weg:** 69,90 € × 1 (27/10), 299, compra 60 € (10/11). **Sonnleithner:** 75 € × 11 (28/04), 97, 1 × 80 €. **Stallhof:** 68,80 € × 1 (08/11), 317. Todo coincide con la entrega | 01:28:14 (y 01:51:35, mismo SHA-256) |
| Lo mismo en la app | `https://app.brickwise.at/desktopWeb/marketplace` (Chromium, sin sesión) | GreenPoint y Cohotel «Preis pro Anteil ab € 102,00»; Pottendorfer «ab € 80,00» | 01:41:34 |
| Aviso común de Brickwise | `https://www.brickwise.at/support/wie-funktioniert-der-handel-am-marktplatz` y `https://api.app.brickwise.at/api/v1/utils/fees` | Mismo SHA-256 que ayer (`52d2e527…`): «Angebot (bestehend aus Preis pro Anteil und der Anzahl der angebotenen Wertpapiere)». Comisiones: `{"fees":0.015}` | 01:41:27–01:41:28 |
| Hausera: mínimo, documento y fechas | Documento de emisión de Alicante 3, `https://drive.google.com/file/d/1cpWVN3J_Y1xdRDAxUzGnjmWXB-eTODH_` (descarga pública) | SHA-256 `9170562a…`, igual que el expediente; 27 páginas, creado el 23/10/2026. «Ticket mínimo: 100,00 euros»; «El periodo de suscripción se iniciará el 25/11/2026 y se extenderá hasta el 30/6/2027»; «no es considerado un folleto informativo». Borrado tras leerlo | 01:29:19–01:29:26 |
| Hausera: preventa y Alicante 2 | `https://hausera.io/page-data/propiedad/alicante_3/page-data.json` y `…/alicante_2/…`; `https://hausera.io/propiedad/alicante_3/` | Alicante_3: `COMMINGSOON`, `presaleDate 18/11/2026`, `launchDate 25/11/2026`; en la página, «Preventa: 18/11/2026 09:00h» y «Reservar tickets». Alicante_2: `FUNDED`. Mismos SHA-256 que el investigador (`8f323413…` y `2f9272ee…`) | 01:29:36 y 01:46:11 |
| Hausera: «Historial publicado · 12/11/2026» | `https://hausera.io/` (Chromium) | «42 operaciones realizadas», «24 operaciones terminadas», «128M€ total». La cuenta atrás marca 06 días, 07 h y 13 min: la preventa abre hacia las 09:00 UTC del 18/11 | 01:46:01–01:46:27 |
| Hausera: «El 12/11/2026 … aún no estaba inscrita» | `https://www.cnmv.es/portal/consultas/esi/erir_esi?nif=A86796182&lang=es` (las tres páginas) | De Hausera figuran la SPV (14/05/2026), las SPV 2, 3 y 4 (19/06/2026), la 6 (24/07), la 5 (31/07) y la 7 y la 8 (23/10/2026). No figuran la SPV 9, la 10 ni la 11 | 01:30:04–01:30:24 |
| Aktionariat: 7,25 CHF y vendedores a 6,20 ZCHF | `https://shares.aktionariat.com/trade` y `getPrice()` del contrato `0x2f2c…350b` (bloque 26.395.633) | «Bid/Ask 6.10 / 6.20», «Buy DAKS at 7.25 CHF»; `getPrice()` 7,25; `settings()` 1: vende pero no recompra | 01:40:36–01:40:44 |
| Boss Info: mínimo, vendedores a 8,40 ZCHF y última operación | `https://shares.bossinfo.com/`, `…/trade` y el contrato `0x3e73…4e69` | «Current Price CHF 8.4», «Last trade • 5 Nov 2026, 13:35» y, al pie, «…not subject to prudential supervision». En /trade: «Bid/Ask 7.30 / 8.40», «5 Nov 2026 / 13:35 Secondary Trade 8.40 ZCHF 1 BOSS»; la anterior, «28 Sep 2026 / 11:32 … 6.70 ZCHF 474 BOSS». En cadena, `getBuyPrice(2)` da 17,0039: 2 acciones cuestan «unos 17 ZCHF» | 01:39:33, 01:40:56 y 01:47:56 |
| Switzerlend: 68,01 CHF, 67,00 ZCHF y recompra sin fondos | `https://shares.lend.ch/invest`, `…/trade` y el contrato `0x8d90319fe817fe9e23973fcab9f1ff0f1e0d9b65` | «Price per LENDS 68.01 CHF»; «Bid/Ask 59.00 / 67.00»; `getPrice()` 68,0105; `settings()` 5 (recompra apagada) y 0,0318 ZCHF en el contrato | 01:39:44–01:41:06 |
| mTBILL, «Documento para España» de `transparencia.json` | `https://docs.midas.app/resources/legal-product-documentation/mtbill` | HTTP 403. No insistí (ver la R7) | 01:48:09 |

## 6. Avisos y referencias con fecha

- **Avisos.** Hay 123, sin contar el genérico «Referencia editorial gratuita…».
  Pasan todos a `verificadaEl` 12/11.
  - 122 tienen su comprobación de hoy en el expediente (`revisionAvisos` o
    `avisosConFecha`, con veredicto «vigente», «sigue_vigente», «cambia» o
    «nuevo», entre las 00:32 y las 00:46 UTC).
  - El que falta es el aviso nuevo de mTBILL. Su texto viene de DECISIONES y lo
    respaldan las lecturas del oráculo del revisor (00:51–00:53 UTC) y la mía
    (01:29 UTC).
  - **No hay ningún aviso re-fechado sin comprobar.** Los cinco avisos que
    cambian la fecha los comprobé yo en la fuente (§5): Aktionariat (6,20 frente
    a 7,25), Boss Info (8,40), Switzerlend (recompra apagada con 0,03 ZCHF;
    vendedores a 67,00) y Hausera (sin la SPV 11 en la CNMV).
  - Se quedan con su fecha, y siguen siendo ciertos, «Alicante 2 ya figuraba
    como financiada el 10/11/2026» (aviso y resumen; a las 01:29 UTC sigue
    `FUNDED`) y «Valor por token · 10/11/2026» de mTBILL.
- **Referencias.** 106 llevan consulta del 12/11: las 63 de tarjeta, 40 del libro
  de Brickwise, la «Última operación» de Boss Info, el «Historial» de Hausera y el
  «Rendimiento neto publicado» de Smart Cash.
  - En 105, la dirección de la fuente está entre lo que consultó hoy su
    expediente.
  - La de Smart Cash (`data.spiko.io/safo-eur`) no sale por la dirección, pero
    el grupo la leyó hoy: en su inventario figura a las 00:33:47 y renderizada a
    las 00:36:15 UTC. Yo la leí a las 01:38:51.
  - Siguen con su fecha anterior, y son ciertas con ella: el literal y la
    referencia de rentabilidad de Spiko Letras (11/11) y las «Participaciones en
    venta» de cuatro fichas de Brickwise (§3.4).
- **Después de aplicar.** Repetí por mi cuenta la regla de `despues-de-aplicar.mjs`
  y salen 43 de 44 comprobaciones al 12/11. Se queda en el 10/11 la
  «supervisada» de mTBILL, porque hoy no se releyó la BaFin.
  - Las demás tienen detrás una lectura de hoy de la misma fuente. Ejemplos: la
    CNMV de Effecta (pestaña «Agentes»), los KID de Brickwise, el pie del portal
    de Boss Info («not subject to prudential supervision», 00:36:31 UTC, y yo a
    las 01:47:56), la página de inversores de LEND (00:38:09 UTC) y el listado
    de plataformas de financiación participativa de la CNMV para Hausera
    (00:33:36 UTC).
  - Los 11 títulos «Brickwise · mercado de reventa en la app (12/11/2026)» se
    apoyan en la app renderizada por el investigador a las 00:35:06 y por mí a
    las 01:41:34 UTC.
  - Hay un matiz en mTBILL: ver la R7.

## 7. Correcciones obligatorias

Ninguna.

## 8. Recomendadas (no bloquean)

- **R1 · Hausera, «Hoy no se puede invertir» (la más urgente).**
  - Dónde está: en el alcance visible del mínimo de la ficha, que se ve en
    «Datos con su fecha»: «… Hoy no se puede invertir: la preventa abre el
    18/11/2026 y la suscripción, el 25/11/2026.».
  - El problema: la ficha vale hasta el 19/11, y la preventa abre hacia las
    09:00 UTC del 18/11 (según la cuenta atrás que vi a las 01:46 UTC). Desde
    entonces se puede reservar y transferir el dinero, como dice el propio
    aviso 3. Durante unas 39 horas, quien lea «Hoy» lo entenderá como su día, y
    no es cierto.
  - Ya era la R3 del 11/11, cuando afectaba a un solo día.
  - Si el SQL se vuelve a generar por cualquier motivo (por ejemplo, por §3.4),
    cambiar «Hoy no se puede invertir:» por «El 12/11/2026 aún no se podía
    invertir:».
  - Si no se regenera, sacar otra entrega antes del 18/11 a las 09:00 UTC, y
    entonces mirar si Hausera sigue siendo «próxima». El expediente ya prevé
    revisarla el 18/11.
- **R2 · mTBILL: el aviso nuevo se verá sin ninguna cifra.**
  - La vista tapa la métrica mientras dure el conflicto, y las dos referencias
    de APY ya no están. El visitante leerá «La rentabilidad es pasada y la
    calcula RWAdar…» sin ver ninguna rentabilidad.
  - El expediente proponía ese aviso «si se publica la rentabilidad».
  - DECISIONES lo pide tal cual y no es falso, así que no lo hago obligatorio.
  - En la próxima entrega, o lo quita mientras dure el conflicto, o lo cambia
    por uno que se entienda solo: «RWAdar no enseña la rentabilidad de mTBILL
    mientras sus documentos no coincidan. La que calcula con el valor que
    publica el emisor (del 06/10 al 10/11/2026) es pasada, está en dólares, no
    descuenta el 0,07 % del reembolso inmediato ni el cambio euro/dólar, y no
    garantiza la futura.»
- **R3 · Brickwise: «Desde X € la participación» cuando ese precio solo se vende
  por lotes.**
  - Pasa en cinco fichas. En cada una, el lote a ese precio y la orden de
    menor importe, con el 1,5 %:

    | Ficha | Lote al precio más barato | Orden de menor importe |
    |---|---|---|
    | Pottendorfer | 11 a 80 € (893,20 €) | 1 a 115 € (116,73 €) |
    | Sonnleithner | 11 a 75 € (837,38 €) | 1 a 80 € (81,20 €) |
    | Hinterstoder | 5 a 75 € (380,63 €) | 1 a 90 € (91,35 €) |
    | Drautal | 3 a 70 € (213,15 €) | 1 a 84 € (85,26 €) |
    | Plüddemanngasse | 2 a 75 € (152,25 €) | 1 a 99 € (100,49 €) |

  - El aviso común lo explica, pero solo en la ficha: la tarjeta dice «Mínimo
    Desde 80 € la participación (12/11)».
  - El formato está acordado y DECISIONES fija los precios, así que no lo hago
    obligatorio.
  - Para la próxima entrega, el coordinador puede decidir uno de estos textos
    para la tarjeta: «Desde 80 € (lote de 11, 12/11)», de 31 caracteres, o el
    de la orden de menor importe.
- **R4 · Hausera, motivo de «Documento para España» en `transparencia.json`.**
  - Sigue diciendo «… y el 10/11/2026 la emisión aún no estaba inscrita», con
    «consultada el 12/11/2026». En la misma ficha, el aviso dice 12/11. No es
    falso, pero se ven dos fechas para el mismo hecho, y la CNMV se leyó hoy.
  - Se arregla sin tocar el SQL. En `despues-de-aplicar.mjs`, dentro del bloque
    de Hausera, cambiar en `documentoEspana.motivo` «el 10/11/2026 la emisión
    aún no estaba inscrita» por «el 12/11/2026 la emisión aún no estaba
    inscrita».
  - Además, en el bloque «Nada más cambia», igualar ese motivo en las dos
    partes de la comparación.
  - Después, repetir en la copia aparte `despues-de-aplicar.mjs` dos veces,
    `transparencia.mjs`, `rwadar-fichas.js` y `npm test`.
- **R5 · Boss Info, alcance de «Última operación · 12/11/2026».**
  - En la próxima entrega, cambiar «y hoy no se ha vuelto a leer» por «y el
    12/11/2026 no se volvió a leer». Ese «hoy» se leerá durante 7 días.
  - Cambiar también «que el historial de operaciones es igual byte a byte que
    el del 11/11 (ninguna operación nueva)» por «que no hay operaciones nuevas
    desde el 11/11», que se entiende mejor.
- **R6 · Spiko: la hora de aplicar.** Si se aplica después de las 18:00 UTC (VL
  nueva de las Letras) o de las 19:30 UTC (Smart Cash), las cifras siguen siendo
  ciertas con su fecha. Solo hay que volver a leer la API si se vuelve a montar la
  entrega.
- **R7 · mTBILL, «Documento para España» al 12/11.**
  - La fuente enlazada, `docs.midas.app/…/mtbill`, dio 403 hoy: lo dice el
    expediente («docs.midas.app da 403 hoy») y lo vi yo a las 01:48:09 UTC.
  - El contenido sí se comprobó hoy: las Condiciones Finales y el KID se
    descargaron del CDN de GitBook con el mismo SHA-256, y el revisor vio el
    pasaporte en la CNMV. La fecha es defendible.
  - Pero la regla «misma fuente» se cumple por un falso positivo: el script
    encuentra la dirección dentro del texto del expediente, aunque ese texto
    diga que dio 403.
  - En el próximo ciclo, apuntar la fuente al PDF del CDN o no contar una
    dirección que el expediente marca como bloqueada.
- **R8 · Trazabilidad de los expedientes.** DECISIONES §4 dice «Todas
  aplicadas», pero los expedientes no recogen dos de esas correcciones:
  - En los de Klagenfurt, Plüddemanngasse y Pottendorfer, en
    `resumen-brickwise.md` y en `libro-ordenes-resumen-2026-11-12.json` siguen
    96,42, 100,48 y 116,72.
  - En el de Smart Cash no se dice que el 2,80 % y el 2,83 % son capitalizados.

  Lo publicado está bien y esas cifras no se publican. Como el montador no puede
  editar los expedientes, que el coordinador lo anote donde corresponda.
- **R9 · GreenPoint, «Venta más barata · 12/11/2026».** «(8 a ese precio, en 3
  órdenes de 5, 2, 1)» se lee mal. En la próxima entrega, escribir «(8 a ese
  precio, en 3 órdenes)», como en Klagenfurt y Randhartinger, o «(… en 3 órdenes
  de 5, 2 y 1)».
- **R10 · Lo que se arrastra de otros días (sin cambio hoy).**
  - Brickwise conserva referencias de rentabilidad esperada en reventa
    («Distribución anual esperada · 22/10/2026», «Rentabilidad · consulta
    01/11/2026», «Precio desde anunciado»). Además, en cinco fichas sale
    «Próxima distribución esperada · 22/10/2026: 15/11/2026», que del 16 al
    19/11 será una fecha pasada. En seis fichas, esas referencias chocan con el
    aviso «la rentabilidad no se muestra». Es la tercera vez que se recomienda
    (R5 del 10/11 y R4 del 11/11).
  - El alcance de los datos de tarjeta de Kraken sigue diciendo «Página de
    xStocks de Kraken UE consultada el 03/11/2026».
  - La salida de Switzerlend dice «El emisor no recompra hoy».
  - La «supervisada» de mTBILL lleva la BaFin del 10/11.
  - «Participaciones en venta» (§3.4): meterla en DECISIONES la próxima vez.

## 9. Límites de esta revisión

- No ejecuté `npm test` ni el ensayo, porque mi revisión es de contenido. Para la
  tarjeta, «Lo esencial» y la validación de la documentación usé el código real
  (`resumenOferta`, la regla de `datosCortosOferta` y la de
  `documentacionOfertaLocal`). Lo ejecuté sobre los archivos de la entrega y,
  solo leyendo, sobre la copia del ensayo del montador. No miré la web en un
  navegador ni hice capturas.
- No volví a abrir los documentos de Robinhood, Kraken, Prosegur y Aktionariat
  (no cambian), ni la FINMA, la BaFin o ESMA. Me fío de los revisores de cada
  grupo, que los abrieron entre las 00:40 y las 00:58 UTC.
- Mis lecturas son de las 01:28 a las 01:52 UTC. Los libros de órdenes cambian
  durante el día. A las 01:51 el de Brickwise seguía siendo el mismo archivo que
  a las 00:32.
- Los datos personales de las copias de los grupos y lo que entra en Git son cosa
  de la revisión de cumplimiento. En lo que escribí no hay nombres de personas ni
  direcciones de cartera de particulares.

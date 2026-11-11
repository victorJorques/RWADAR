# Revisión independiente de contenido · entrega 2026-11-11 (solo lectura)

**Veredicto: `aprobado_con_cambios`.** Lo que va en el SQL se puede aplicar tal
cual. Cada cambio de `DECISIONES-COORDINADOR.md` está aplicado con su texto, su
fuente y sus fechas, y no cambia nada más. Las cifras que abrí yo hoy en la
fuente primaria coinciden con la entrega, con una excepción que no obliga a
cambiar nada (Pottendorfer, §5). Hay **una corrección obligatoria que no toca el
SQL** (C1, §7): el mínimo de Switzerlend en la tarjeta y en «Lo esencial» se
quedaría con la fecha del 10/11, mientras la ficha dice 11/11.

- Revisión `24b5f7de-2834-3e15-6ae4-62a6d9565161`, sobre la publicada
  `dfdc4c85-7f2f-fc4a-de27-a9f4a63f7656` (entrega 2026-11-10).
- **SHA-256 de `aplicar-y-aprobar.sql`: `dfeba19516b2b688ddf4f8ad4ba1feb5049dbaae164b2d1abcee951ccb26a3cb`**
  (comprobado a las 14:22 UTC; es el que dice el montador). `catalogo.sql`
  `d8d7f12d…7add`, `revision.json` `03df9312…9d70`, `escaparate-publicacion.json`
  `367d0f8a…27c8`, `documentacion-ofertas.json` `aa1cc5b2…3df6`,
  `contraste-2026-11-11.json` `a55ff884…9845`, `DECISIONES-COORDINADOR.md`
  `0f89547b…3224`.
- Revisor: Claude, 11/11/2026, de 14:15 a 14:50 UTC. No monté esta entrega. No
  he tocado Supabase, no he publicado y no he hecho commit. En el repositorio
  solo he escrito este informe. Mis copias de fuentes y mis scripts están en la
  carpeta temporal de la sesión, fuera de Git. El documento de Alicante 3 (lleva
  datos personales) lo borré nada más leerlo. La prueba de la C1 la hice en una
  copia aparte (`scratchpad/entrega-1111/revision-contenido-c1`).

## 1. Qué hice

1. Comparé, ficha por ficha y campo por campo, `escaparate-publicacion.json` y
   `documentacion-ofertas.json` de la base (2026-11-10-v2) con los de hoy.
   Emparejé referencias, avisos y métricas por su etiqueta o su texto, no por
   posición. Antes comprobé que la base es lo publicado: la documentación y los
   avisos de las 22 ofertas son iguales a `lectura-publica/ofertas-v2.json`, y
   también las métricas y la rentabilidad de las 7 que están «actual».
2. Comparé la lectura pública de hoy con lo que leería un visitante después de
   aplicar (las vistas que exportó el ensayo del montador desde PGlite, con el
   mismo SQL `dfeba195…`). Así veo lo que tapa la vista.
3. Ejecuté `resumenOferta` (`rwadar-site/assets/ficha-editorial-20261022.js`)
   con las 22 ofertas de `escaparate-publicacion.json` más su documentación, y
   también con el catálogo sincronizado del ensayo, el 11/11 a las 15:00, el
   18/11 a las 23:30 y el 19/11 a las 00:30 UTC. Encima apliqué la regla de la
   tarjeta y de «Lo esencial» de la web (`datosCortosOferta`,
   `rwadar-20260820.js`) y de la app (`rwadar-movil/lib/transparencia.js`), con
   el `transparencia.json` que deja `despues-de-aplicar.mjs` (SHA-256
   `1959f8be…c66b`).
4. Abrí yo hoy la fuente primaria de las cifras que cambian y de algunas que no
   (§5).
5. Crucé cada aviso y cada referencia que pasan al 11/11 con lo que consultó
   hoy su expediente (§6).
6. Validé las 22 documentaciones con la misma regla de la web
   (`documentacionOfertaLocal`): si una referencia falla, la web no enseña
   ninguna. Resultado: 22 de 22 válidas el 11/11 y el 18/11.
7. Probé la corrección C1 en una copia aparte (§7).

## 2. DECISIONES, punto por punto

| Ficha | Lo que pide DECISIONES | Lo que hay en la entrega | Veredicto |
|---|---|---|---|
| Spiko Letras Euro | 2,44 % → 2,41 %; cambian métrica, literal y referencia | Métrica «Rentabilidad publicada · 31 días · 11/11/2026: 2,41 %». Literal «… publicado por Spiko el 10/11/2026 (VL fechada el 11/11/2026); consultado el 11/11/2026. Variable y no garantizado.». Referencia con dato del 11/11, consulta del 11/11 y fuente `data.spiko.io/eutbl/` | correcto |
| Spiko Letras Dólar | 4,09 % → 4,02 % en USD, VL del 10/11 | Métrica «… · 10/11/2026 · en USD: 4,02 %»; literal y referencia con dato del 10/11 y consulta del 11/11 | correcto |
| Spiko Smart Cash | 2,84 % con la VL del 10/11; el aviso 2 se mantiene; condición de las 19:30 UTC (P1) | Métrica «Rentabilidad publicada · neta y variable · 10/11/2026: 2,84 %», literal y referencia con dato del 10/11. Aviso 2 igual. Montada de 10:05 a 10:35 UTC, antes de las 19:30 | correcto |
| mTBILL | «Valor por token · 10/11/2026: 1,0777 USD (oráculo del emisor)»; acceso sin la frase de la web; `fuentes_en_conflicto`; APY `null` | Métrica así (la vista pública la tapa, igual que hoy). Estado y `rentabilidad` sin cambios. No se añade dato de tarjeta (§3.1) | correcto |
| Brickwise (11) | Schwarzer Weg 65 → 69,90 €; Pottendorfer 74 → 73 €; las otras 9, solo fecha; mejor compra 35 → 60 € (Schwarzer Weg) y 46 → 56 € (Randhartinger) | Los 11 mínimos «Desde X € la participación en reventa (11/11)». «Venta más barata», «Participaciones en venta» y «Mejor oferta de compra», iguales a la propuesta de cada expediente, salvo una (§3.3). Acceso, salida, avisos y «Desistimiento», sin cambios de texto | correcto |
| Aktionariat | «Precio del emisor», «Supervisor» y aviso con dato del día al 11/11; tarjeta sin cambio de texto | Así. Los tres textos de la tarjeta son los publicados, letra por letra | correcto |
| Boss Info | «Supervisor», aviso y mínimo «… (unos 17 ZCHF el 11/11)»; acceso y salida publicados | Así; aviso «… (venta más barata 8,40 ZCHF el 11/11/2026).» | correcto |
| Switzerlend | Dos avisos, «Supervisor» y mínimo «1 acción (68,01 CHF el 11/11)»; acceso y salida publicados | En el SQL, así. **En la tarjeta y en «Lo esencial», no**: siguen con «10/11» | corregir fuera del SQL (C1) |
| Robinhood, Kraken, Prosegur y Hausera | Solo la fecha de verificación; la tarjeta de Hausera no cambia | Solo cambian la fecha de verificación, la consulta de los tres datos de tarjeta y la de los avisos. Hausera: mismos textos | correcto |
| Radar | 69 de 69; ninguna dirección ni texto cambia | Las 25 plataformas son iguales salvo las fechas. El texto de origen cambia la fecha y quita «la lista de la OCC, con curl»: hoy la OCC se leyó por HTTP normal (`radar-contraste-2026-11-11.json`, `"metodo": "http"`) | correcto |
| `transparencia.json`, después de aplicar | Fecha 11/11 solo donde el expediente volvió a consultar la misma fuente; más el mínimo corto de Brickwise | Ensayo: 43 de 44 comprobaciones al 11/11 (se queda en el 10/11 la «supervisada» de mTBILL); 11 títulos de puntos; 11 mínimos cortos de Brickwise | correcto, salvo Switzerlend (C1) |

En `aplicar-y-aprobar.sql` aparecen, una vez cada uno: «1,0777 USD (oráculo
del emisor)», «Desde 69,90 € la participación en reventa (11/11)», «Desde 73 €
la participación en reventa (11/11)», «(unos 17 ZCHF el 11/11)», «1 acción
(68,01 CHF el 11/11)», «60,00 € (1 participación, orden del 10/11/2026)», «56,00
€ (1 participación, orden del 10/11/2026)», «6,20 ZCHF frente a 7,25 CHF el
11/11/2026», «venta más barata 8,40 ZCHF el 11/11/2026», «venta más barata 67,00
ZCHF el 11/11/2026» y «el 11/11/2026 la recompra seguía desactivada». «2,41 %»,
«4,02 %» y «2,84 %» salen tres veces cada uno (cifra mostrada, métrica y
referencia).
No aparecen: «2,44 %», «4,09 %», «1,0776», «Desde 65 €», «Desde 74 €», «35,00 €
(1 participación», «46,00 € (1 participación», «(unos 17 ZCHF el 10/11)»,
«68,01 CHF el 10/11», «lista blanca» ni «países permitidos».

## 3. Lo que el montador no aplicó tal cual: mi opinión

1. **mTBILL, acceso de la tarjeta.** De acuerdo con no añadirlo. La ficha
   publicada no tiene datos de tarjeta propios con la etiqueta fija, y
   DECISIONES §1 conserva los publicados. Además, por estar en «fuentes en
   conflicto», `resumenOferta` lo taparía igual: la tarjeta seguiría diciendo
   «Mínimo No verificado · España Sin confirmar». Añadirlo cambiaría el SQL sin
   cambiar nada de la tarjeta. El texto corregido está en el expediente
   (`propuestaTarjeta`, «por qué destaca» sin la web y la lectura de
   `main-DWqV5Q2W.js` a las 09:26 UTC). Ni ese texto ni «por qué destaca» llegan
   al SQL (0 apariciones). La referencia antigua de la web («Países de oferta
   según la web de Midas · consulta 05/11/2026») se queda con su fecha, que es
   lo que pide P2.
2. **Boss Info, «Última operación · 10/11/2026».** De acuerdo. Es cierta con su
   fecha. A las 14:33:18 UTC, `getTrades` sigue dando como última operación la
   del 05/11 (1 acción a 8,4). Re-fecharla también sería cierto, pero
   DECISIONES no lo pide.
3. **Schwarzer Weg, «Participaciones en venta · 10/11/2026: 300».** De acuerdo
   para esta entrega. Es cierta con su fecha. Hoy hay 299: lo dice el
   expediente a las 09:16 UTC y lo vi yo a las 14:26 UTC. Re-fecharla con 300
   sería falso. Ponerla en 299 cambia el SQL y DECISIONES no lo recoge.
4. **Expedientes suizos.** El contraste está bien hecho. Comparé los nueve
   textos «publicado» de `expedientesSuizosCorregidos` con
   `lectura-publica/ofertas-v2.json` (9 de 9 iguales) y los nueve de «entrega»
   con `documentacion-ofertas.json` (9 de 9 iguales). Lo que ve el visitante no
   depende de los expedientes.
5. **Mínimo corto de Switzerlend en `transparencia.json`.** No estoy de
   acuerdo. Ver C1.
6. **Propuestas de los expedientes que no están en DECISIONES.** Bien
   excluidas: las fuentes nuevas de Spiko y de Brickwise, los textos nuevos de
   tarjeta de Spiko, Robinhood, Kraken, Prosegur y Aktionariat, y el acceso y
   la salida nuevos de Boss Info y Switzerlend.

## 4. Lo que enseñarán la tarjeta y «Lo esencial» (web y app)

Calculado con `resumenOferta` el 11/11 a las 15:00 UTC y la regla de la web y
de la app. «Hoy» es con lo publicado y el `transparencia.json` actual
(`67e89ba3…`); «tras aplicar», con la entrega y el `transparencia.json` que deja
`despues-de-aplicar.mjs`.

| Oferta | Tarjeta hoy | Tarjeta tras aplicar | Comentario |
|---|---|---|---|
| Spiko Euro, Smart Cash, Robinhood y Kraken | Mínimo 1 € · España Sí | igual | |
| Spiko Dólar | Mínimo 1 USD · España Sí | igual | |
| Prosegur | Mínimo 1 gramo de oro · España Sí | igual | |
| Aktionariat | Mínimo 500 CHF · España Sí | igual | |
| Boss Info | Mínimo 100 CHF · España Sí | igual | |
| Switzerlend | Mínimo 1 acción (68,01 CHF, 10/11) · España Sí | **igual, con 10/11** | la ficha dirá «el 11/11»: C1 |
| Brickwise (11) | Mínimo Desde N € la participación (10/11) · España Sin confirmar | lo mismo con (11/11): Schwarzer Weg 69,90 €, Pottendorfer 73 € y las otras 9 con su precio de ayer | correcto; el más largo tiene 38 caracteres (máximo 40) |
| Hausera | Mínimo Desde 100 € en Alicante 3 (10/11) · España Sin confirmar | igual | la tarjeta no cambia por decisión |
| mTBILL | Mínimo No verificado · España Sin confirmar | igual | fuentes en conflicto; «Lo esencial»: «Salida: Sin documentar» |

- **Lo único que cambia en la tarjeta** son los 11 mínimos de Brickwise. El
  acceso desde España, la salida de «Lo esencial» y el estado no cambian en
  ninguna. Lo mismo sale con el catálogo sincronizado del ensayo y con el
  escaparate sin la máscara de la vista.
- **Vigencia.** Las 22 siguen vigentes el 18/11 a las 23:30 UTC. El 19/11 a las
  00:30 UTC caducan todas y se tapan las cifras («Mínimo No verificado · España
  Sin confirmar»).
- **Normas de los textos de tarjeta.** Hay 63 datos con etiqueta fija («Mínimo
  de inversión», «Acceso desde España», «Salida» o «Reembolso»): tres por ficha,
  y ninguno en mTBILL. Tienen 119 caracteres como mucho y llevan la consulta del
  11/11. Ningún mínimo dice «por participación», «por token» ni «por acción».
  Las 14 de reventa y próximas no llevan ni `rentabilidad` ni `precio`.
- **Textos nuevos o cambiados.** Están en castellano llano, sin promesas («Variable
  y no garantizado», «El precio lo fija cada vendedor y cambia a diario. No es
  el precio de emisión.») y con fechas DD/MM bien puestas. Comprobé contra la
  API cada fecha de orden de Brickwise; las dos mejores compras «del 10/11» se
  crearon el 10/11 a las 22:07 y 22:12 UTC, que en Austria sigue siendo 10/11.

## 5. Fuentes primarias que abrí yo (11/11/2026, UTC)

| Cifra de la entrega | Fuente | Lo que leí | Hora |
|---|---|---|---|
| Spiko Euro 2,41 % (VL fechada el 11/11, calculada el 10/11) | `https://public-api.spiko.io/v0/share-classes/EUTBL/yield` y `…/net-asset-values/EUTBL/latest` | `"monthlyYield":"0.0241"`, `"updatedAt":"2026-11-10T17:55:23.019Z"`; VL `"day":"2026-11-11"`, `"value":"1.062738"`. Con la serie de la API (VL fechada el 11/10: 1,060588 €), (1,062738 / 1,060588)^(365/31) − 1 = **2,413 %** | 14:22:18–14:22:33 |
| La misma, en la fuente de la referencia | `https://data.spiko.io/eutbl/` (renderizada con navegador) | «30D YIELD 2.41% Annualised LATEST NAV 1.0627 2026-11-11» | 14:29:12 |
| Spiko Dólar 4,02 % (VL del 10/11) | `…/share-classes/USTBL/yield`, `…/USTBL/latest` y `https://data.spiko.io/ustbl/` | `"monthlyYield":"0.0402"`; VL del `2026-11-10`, 1,102496 $. Desde la del 09/10 (1,098694 $), 32 días: **4,019 %**. La web: «30D YIELD 4.02% … LATEST NAV 1.1025 2026-11-10» | 14:22:19 y 14:29:16 |
| Spiko Smart Cash 2,84 % (VL del 10/11) | `…/share-classes/eurSAFO/yield`, `…/eurSAFO/latest` y `https://data.spiko.io/safo-eur` | `"dailyYield":"0.0284"` (igual a 7 y a 30 días); VL del `2026-11-10`, 1,016952 €, calculada el 10/11 a las 19:42:58. Desde 1,016874 € (09/11), un día: **2,839 %**. `"nextYieldTimestamp":"1794425400"` = 11/11 a las 19:30 UTC. La web: «30D YIELD 2.84% … LATEST NAV 1.0170 2026-11-10» | 14:22:20 y 14:29:19 |
| mTBILL 1,0777 USD (10/11) | Oráculo `0x056339C044055819E8Db84E71f5f2E1F536b2E5b` (eth_call en `ethereum-rpc.publicnode.com`, bloque 26.392.273) | Se describe como «mTBILL/USD», 8 decimales. Ronda **492**, `answer 107768132` = 1,07768132 USD, actualizada el **10/11 a las 18:40:23**. Todavía no hay ronda del 11/11 | 14:26:57 |
| Brickwise: los 11 mínimos y las referencias del libro | `https://api.app.brickwise.at/api/v1/assets` (SHA-256 `39a532d3…`) y `/api/v2/assets` (`1aa463c6…`) | **Schwarzer Weg:** venta más barata 69,9 € × 1 (orden del 27/10), 299 en venta, mejor compra 60 € × 1 (10/11). **Randhartinger:** 78 € × 21 en 2 órdenes, 189 en venta, mejor compra 56 € × 1 (10/11). Las otras 8 (Hinterstoder, Drautal, Cohotel, GreenPoint, Estanco, Plüddemann, Sonnleithner y Stallhof): iguales a la entrega en precio, cuántas a ese precio, fecha de la orden, participaciones en venta y mejor compra. **Pottendorfer: ha cambiado** (ver abajo) | 14:26:03–14:26:05 |
| Lo mismo en la app | `https://app.brickwise.at/desktopWeb/marketplace` (renderizada, sin sesión) | «Wohnung, Schwarzer Weg 18, Graz … Preis pro Anteil ab € 69,90»; «Wohnung, Pottendorfer Straße 62 TOP 2.06 … Preis pro Anteil ab € 69,00» | 14:31:31 y 14:32:00 |
| Aktionariat 7,25 CHF y vendedores a 6,20 ZCHF | `https://shares.aktionariat.com/api/secondarymarkets/getOrderBook` (POST, `company` 77), `…/api/brokerbotsettings?ticker=DAKS` y `getPrice()` del contrato `0x2f2c…350b` (bloque 26.392.278) | Venta más barata 6,20 × 356; mejor compra 6,10 × 10. `getPrice()` 7,25. Mínimo por transferencia 500 | 14:27:06–14:27:49 |
| Boss Info: mínimo y vendedores a 8,40 ZCHF | `https://shares.bossinfo.com/api/secondarymarkets/getOrderBook` (`company` 1664), `…/brokerbotsettings?ticker=BOSS` y `getPrice()` de `0x3e73…4e69` | Venta más barata 8,40 × 103; compra 7,30 × 1.000. Mínimos: 100 por transferencia y 9 en cripto. `getPrice()` 8,50197, así que 2 acciones son 17,00. (Esa respuesta lleva un correo personal; no lo copio) | 14:27:06–14:27:49 |
| Switzerlend: 68,01 CHF, vendedores a 67,00 ZCHF y recompra sin fondos | `https://shares.lend.ch/api/secondarymarkets/getOrderBook` (`company` 40880), `…/brokerbotsettings?ticker=LENDS` y el contrato `0x8d90319fe817fe9e23973fcab9f1ff0f1e0d9b65` | Venta más barata 67,00 × 15; compra 59,00 × 4. `getPrice()` **68,0105**, `settings()` 5 y **0,0318 ZCHF** en el contrato. Mínimos 0 y 0, así que basta 1 acción | 14:27:06–14:27:49 |
| Boss Info, «Última operación … (1 acción, 05/11/2026)» | `https://shares.bossinfo.com/api/secondarymarkets/getTrades` (POST, `company` 1664) | Última: `2026-11-05T13:35:35Z`, 1 acción a 8,4, `SECONDARY` | 14:33:18 |
| Hausera (la tarjeta no cambia): mínimo y fechas | Documento de emisión de Alicante 3, `https://drive.google.com/file/d/1cpWVN3J_Y1xdRDAxUzGnjmWXB-eTODH_` | Se baja sin sesión; SHA-256 `9170562a…`, igual al del expediente. «Ticket mínimo: 100,00 euros»; «El periodo de suscripción se iniciará el 25/11/2026 y se extenderá hasta el 30/6/2027»; «venta efectiva del inmueble»; «no es considerado un folleto informativo» | 14:28:02–14:28:15 |
| Hausera: preventa y Alicante 2 | `https://hausera.io/page-data/propiedad/alicante_3/page-data.json` y `…/alicante_2/…` | Alicante_3: `COMMINGSOON`, `presaleDate 18/11/2026`, `launchDate 25/11/2026`. Alicante_2: `FUNDED`, `launchDate 11/11/2026` | 14:28:24 |
| Hausera: «aún no estaba inscrita» | `https://www.cnmv.es/portal/consultas/esi/erir_esi?nif=A86796182&lang=es` (las tres páginas) | De Hausera: la SPV sin número y las SPV 2 a 8 (la última, del 23/10/2026). No figuran la SPV 9, la 10 ni la 11 | 14:28:33 y 14:46:30 |
| mTBILL, «supervisada» de `transparencia.json` (se queda en el 10/11) | BaFin, `https://portal.mvp.bafin.de/database/InstInfo/sucheForm.do?institutName=Midas&sucheButtonInstitut=Suche` | Solo sale «Midas Fondsmaeglerselskab A/S · Grenzüberschreitender Dienstleister (WpI) gem. § 74 WpIG», otra entidad. Midas Software GmbH no aparece. «Stand der Daten: 10.11.2026» | 14:37:15 |

**Pottendorfer (único dato que ya no coincide).** La entrega dice «Desde 73 € la
participación en reventa (11/11)» y «Venta más barata · 11/11/2026: 73,00 € por
participación (1 a ese precio, orden del 11/11/2026)». Era cierto cuando se
leyó: lo vieron el investigador (09:16 UTC) y el revisor del grupo (09:38–09:50
UTC). Pero a las **14:25:17 UTC** alguien puso una venta a **69 € × 3**. La de
73 € sigue ahí. A las 14:26 la API da 69 € como la más barata y 110
participaciones en venta (la entrega dice 107). A las 14:32 la app enseña «ab €
69,00». **No lo hago obligatorio.** Cada precio de reventa va con su fecha, el
alcance dice «El precio lo fija cada vendedor y cambia a diario» y la ficha
lleva el aviso «Los precios y el libro de órdenes cambian a diario: compruébalos
en la app del proveedor antes de operar.». Si se vuelve a leer, el libro
seguirá cambiando. Además, la diferencia va a favor del comprador. Ver R1.

## 6. Avisos y referencias con fecha

- **Avisos.** Hay 111 avisos, sin contar el genérico «Referencia editorial
  gratuita…». Los 111 pasan a `verificadaEl` 11/11 y los 111 tienen su
  comprobación de hoy en el expediente (`revisionAvisos` o `avisosConFecha`,
  «vigente» o «sigue_vigente»; los que llevan hora, entre las 09:16 y las 09:27
  UTC; los de Spiko, con el documento descargado de nuevo hoy y el mismo
  SHA-256). **No hay ningún aviso re-fechado sin comprobar.**
- Los cuatro avisos que cambian el texto al 11/11 los comprobé yo en la fuente
  (§5): Aktionariat (6,20 frente a 7,25), Boss Info (8,40) y los dos de
  Switzerlend (67,00, y la recompra desactivada con 0,03 ZCHF).
- Los dos avisos de Hausera con «10/11/2026» («El 10/11/2026 Alicante 3 aún no
  estaba inscrita…» y «Alicante 2 ya figuraba como financiada el 10/11/2026…»)
  se quedan con ese texto, porque DECISIONES no cambia nada de Hausera. Siguen
  siendo ciertos: a las 14:28 UTC la CNMV aún no lista la SPV 11 y Alicante 2
  figura como `FUNDED`.
- **Referencias.** Las 98 que llevan consulta del 11/11 (las 63 de tarjeta,
  las 32 del libro de Brickwise y las tres de rentabilidad de Spiko) tienen su
  fuente, con la misma dirección, entre lo que consultó hoy su expediente. No
  hay ninguna excepción en las 22 fichas. Las que no se volvieron a mirar
  conservan su fecha.

## 7. Corrección obligatoria (no cambia el SQL)

### C1 · Switzerlend: el mínimo de la tarjeta, con la fecha de la ficha

**Problema.** DECISIONES §2 pasa el mínimo de Switzerlend a «1 acción (68,01 CHF
el 11/11)». Así está en el SQL. Pero la tarjeta de la lista y «Lo esencial», en
la web y en la app, no enseñan ese texto. Enseñan `minimoCorto` de
`transparencia.json`, y `despues-de-aplicar.mjs` lo deja en «1 acción (68,01
CHF, 10/11)». En la misma ficha, la tarjeta y «Lo esencial» dirían 10/11 y la
lista de referencias 11/11. Además, el 18/11, último día vigente, la tarjeta
enseñaría un precio leído 8 días antes. El 10/11 pasó lo mismo y la revisión lo
hizo obligatorio (C1 de ese día), y el coordinador lo aceptó. Esto no amplía
DECISIONES. Aplica su §2 (el mínimo de Switzerlend «… el 11/11») y la regla de
su §1: fecha 11/11 donde el expediente volvió a consultar la misma fuente. El
expediente leyó hoy `shares.lend.ch/invest` y el precio en cadena; yo vi
`getPrice()` = 68,0105 a las 14:27:49 UTC.

**Cambio exacto en `despues-de-aplicar.mjs`:**

1. Justo después del bucle de Brickwise (tras la línea
   `  t.ofertas[slug].minimoCorto = hecho;` y su `}`), añadir:

```js
// Switzerlend (DECISIONES §2: mínimo «1 acción (68,01 CHF el 11/11)»). La tarjeta y «Lo esencial» enseñan el mínimo
// corto: tiene que llevar la misma fecha que la ficha (revisión de contenido, C1; como la C1 del 10/11).
assert.equal(tarjeta('switzerlend', 'Mínimo de inversión'), '1 acción (68,01 CHF el 11/11)', 'switzerlend: mínimo del catálogo');
assert.ok(['1 acción (68,01 CHF, 10/11)', '1 acción (68,01 CHF, 11/11)'].includes(antes.ofertas.switzerlend.minimoCorto),
  `switzerlend: mínimo corto de partida («${antes.ofertas.switzerlend.minimoCorto}»)`);
t.ofertas.switzerlend.minimoCorto = '1 acción (68,01 CHF, 11/11)';
```

2. En el bloque «Nada más cambia», cambiar
   `    if (slug in BRICKWISE) o.minimoCorto = 'F';` por
   `    if (slug in BRICKWISE || slug === 'switzerlend') o.minimoCorto = 'F';`

**Lo probé** en una copia aparte, con el catálogo sincronizado del ensayo y
`transparencia.json` de partida `67e89ba3…`:

- `despues-de-aplicar.mjs` termina con exit 0 y deja `transparencia.json` con
  SHA-256 `81e78ab905e5fc20ad42d6907325efd7cc37784277d9833926822fe40f5d3808`.
  Repetido: exit 0, «Nada que cambiar: ya estaba hecho.» y el mismo SHA-256.
- Frente al resultado del montador (`1959f8be…`), la única diferencia es
  `"minimoCorto": "1 acción (68,01 CHF, 11/11)"`.
- `transparencia.mjs` da «Transparencia escrita: 22 ofertas con transparencia»;
  el bloque de la web y `rwadar-movil/lib/transparencia-contenido.js` llevan
  «1 acción (68,01 CHF, 11/11)».
- La tarjeta queda «Mínimo 1 acción (68,01 CHF, 11/11) · España Sí» el 11/11 y
  el 18/11. Tiene 27 caracteres (máximo 40) y no dice «por acción».

Después hay que repetir en la copia aparte `despues-de-aplicar.mjs` (dos
veces), `transparencia.mjs`, `rwadar-fichas.js` y `npm test`. Ninguna prueba
del repositorio busca «68,01» fuera de los datos. **El SHA-256 del SQL no
cambia.**

## 8. Recomendadas (no bloquean)

- **R1 · Pottendorfer y la hora del libro.** Si por cualquier otro motivo se
  vuelve a generar el SQL antes de aplicarlo, hay que leer otra vez el libro de
  las 11 de Brickwise y poner lo del momento (a las 14:26 UTC Pottendorfer
  estaba en 69 € × 3 y 110 en venta). En las próximas entregas, en el alcance
  del mínimo, poner la hora de lectura («a las 09:16 UTC») en vez de «ese día»,
  como ya hacen las referencias del libro.
- **R2 · mTBILL, «supervisada».** En `transparencia.json` se queda con la
  consulta del 10/11 y el 18/11 tendrá 8 días. A las 14:37 UTC la BaFin no
  tiene a Midas Software GmbH. Si el coordinador la vuelve a leer antes de
  aplicar, como hizo el 10/11, puede pasarla al 11/11 con esa lectura.
- **R3 · Hausera el 18/11.** La ficha vale hasta el 18/11, el día en que abre
  la preventa. El alcance visible del mínimo dice «Hoy no se puede invertir: la
  preventa abre el 18/11/2026…», y el «hoy» se refiere a la comprobación del
  11/11. En la próxima entrega, escribir «El 11/11 aún no se podía invertir…»,
  y pasar al día el «(10/11)» del mínimo y del motivo de `documentoEspana`.
  Hay que mirar Hausera el 18/11.
- **R4 · Referencias antiguas de rentabilidad en reventa.** Las 11 fichas de
  Brickwise conservan referencias como «Distribución anual esperada ·
  22/10/2026: 3,46 %», «Rentabilidad por alquiler esperada (API de la app) ·
  22/10/2026», «Precio desde anunciado» y, en seis, «Próxima distribución
  esperada · 22/10/2026: 15/11/2026». Chocan con la norma de reventa y, en las
  seis fichas que llevan el aviso «la rentabilidad no se muestra», también con
  ese aviso. Además, la fecha del 15/11 queda en el pasado del 16 al 18/11. Ya
  estaban (R5 del 10/11). En la próxima entrega, quitarlas o rotularlas como
  históricas.
- **R5 · Kraken.** El alcance de sus tres datos de tarjeta sigue diciendo
  «Comprobado de nuevo en la fuente el 11/11/2026. Página de xStocks de Kraken
  UE consultada el 03/11/2026.» (R2 del 10/11). En la próxima entrega, quitar
  la segunda frase.
- **R6 · Expedientes suizos.** El «antes» bien escrito está solo en el
  contraste. Si se quiere que el expediente se entienda solo, que el
  coordinador añada una nota. No toca el SQL.
- **R7 · Spiko Euro.** Para que no extrañe ver «publicado por Spiko el
  10/11/2026 (VL fechada el 11/11/2026)», en otra entrega se puede añadir
  «(festivo en Francia)». Es opcional: la cifra y las fechas son las de Spiko y
  las de la AMF.
- **R8 · Radar.** El texto de origen sigue diciendo «onboarding» (R7 del
  10/11). Mejor «alta de clientes».

## 9. Límites de esta revisión

- No ejecuté `npm test` ni el ensayo completo, porque mi revisión es de
  contenido. La C1 la probé solo con `despues-de-aplicar.mjs` y
  `transparencia.mjs`, en una copia aparte. La tarjeta y «Lo esencial» los
  calculé con el código real (`resumenOferta` y la misma regla de
  `datosCortosOferta`), no en un navegador ni con capturas.
- No volví a abrir los documentos de Robinhood, Kraken y Prosegur (no cambian),
  ni el registro de FINMA: me fío del revisor del grupo (09:46–09:50 UTC, 0
  resultados). midas.app sigue tras Cloudflare y no lo intenté.
- Mis lecturas son de las 14:22 a las 14:47 UTC. Los libros de órdenes cambian
  durante el día, como se ve en Pottendorfer.
- Los datos personales de las copias de los grupos y lo que va a Git son cosa
  de la revisión de cumplimiento. En lo que escribí no hay nombres de personas.

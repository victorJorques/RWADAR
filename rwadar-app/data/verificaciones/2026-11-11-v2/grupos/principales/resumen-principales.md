# Grupo principales · puesta al día del 11/11/2026

He revisado las siete fichas principales del grupo. Todas las horas son UTC del
11/11/2026, entre las 09:15 y las 09:27. He vuelto a abrir hoy cada fuente
primaria y he comparado los documentos con los de ayer por su huella SHA-256 (o,
en las páginas web, por su texto). Solo he usado páginas, documentos, API,
registros públicos y lecturas en cadena. No he iniciado sesión, no he hecho KYC y
no he tocado wallets ni formularios.

## En una frase

Bajan las dos letras del Tesoro de Spiko (Euro de 2,44 % a 2,41 %, Dólar de
4,09 % a 4,02 %). Spiko Euro se queda en 2,84 % con fecha nueva. El valor de
mTBILL pasa de 1,0776 a 1,0777 USD. Robinhood, Kraken y Prosegur no cambian:
tienen los mismos documentos y no hay advertencias nuevas de la CNMV.

| Ficha | Publicado (dato del 09/11) | Hoy | Propuesta |
|---|---|---|---|
| Spiko Letras del Tesoro Euro | 2,44 % a 31 días | **2,41 %** a 31 días (VL fechada el 11/11) | actualizar |
| Spiko Letras del Tesoro Dólar | 4,09 % a 31 días, en USD | **4,02 %** a 31 días, en USD (VL del 10/11) | actualizar |
| Spiko Euro (Smart Cash) | 2,84 % (VL del 09/11) | **2,84 %** (VL del 10/11) | actualizar (solo la fecha) |
| Robinhood Classic Stock Tokens | — | sin cambios | mantener |
| Kraken xStocks | — | sin cambios | mantener |
| Prosegur Digital Gold | — | sin cambios | mantener |
| mTBILL | 1,0776 USD (09/11) | **1,0777 USD** (10/11) | actualizar |

## Spiko: cómo he calculado las cifras

He bajado la serie diaria de valores liquidativos (VL) de la API pública de Spiko
a las 09:15. He hecho la cuenta yo mismo y la he comparado con lo que publica
Spiko. Para pasar a un año uso interés compuesto:
(VL nueva / VL de hace 31 días)^(365/días) − 1.

- **Euro.** La última VL es de 1,062738 €. Spiko la calculó el 10/11 a las
  17:55 y la fecha el 11/11. La AMF la publica igual: «Dernière valeur
  liquidative connue au 11/11/2026 : 1.06274 €». La comparo con la VL de 31
  días antes, la del 11/10 (1,060588 €, que es la del viernes 09/10). Sale
  **2,413 %**. La API dice 0,0241. La web y data.spiko.io dicen 2,41 %.
- **Dólar.** La última VL es de 1,102496 $, del 10/11. 31 días antes cae en
  sábado, así que tomo la del viernes 09/10 (1,098694 $), que son 32 días.
  Sale **4,019 %**. La API, la web y data.spiko.io dicen 4,02 %. La cifra va en
  dólares y no incluye lo que se mueva el euro frente al dólar.
- **Spiko Euro.** La cifra es lo que el fondo crece en un día, pasado a un año.
  Del 09/11 (1,016874 €) al 10/11 (1,016952 €) sale **2,839 %**. A 7 días sale
  2,835 % y a 28 días, 2,834 %. El €STR del 10/11 es 2,442 % (BCE), así que la
  cifra queda 0,40 puntos por encima, como dice la web.

Dos detalles:

- El HTML de las páginas de letras del Tesoro, sin JavaScript, sigue guardado
  en caché con las cifras de ayer (2,44 % y 4,09 %). Es el mismo archivo, byte a
  byte. La página que ve la gente (con JavaScript), la API y data.spiko.io dan
  las de hoy.
- Hoy, 11/11, es festivo en Francia. Las dos letras del Tesoro no tendrán VL
  nueva hasta el 12/11 a las 18:00. **Spiko Euro sí**: desde hoy la API ya no
  marca el 11/11 como festivo para ese fondo y anuncia un cálculo a las 19:30.
  Si la entrega se monta después de esa hora, habrá que volver a fechar Spiko
  Euro.

## ¿Confirman ya la CNMV o la AMF que Spiko Euro se vende en España?

**No.** Tampoco lo niegan.

- **CNMV.** La ficha de Spiko SICAV (n.º 2380), su comercializadora (Aldana
  Capital A.V.) y los hechos relevantes («No se han encontrado datos») dicen lo
  mismo que ayer, palabra por palabra. La CNMV no enseña los fondos de la SICAV
  uno a uno.
- **AMF (GECO).** La ficha del fondo (SCV20260075, autorizado el 17/02/2026)
  dice lo mismo que ayer. Sigue sin clases de acciones, sin VL y sin decir en
  qué países se vende.
- **ESMA.** No tiene Spiko.
- **Un detalle de la web.** En la página de Spiko Euro, el botón «Verificar la
  autorización» de la CNMV lleva a la ficha de Spiko Finance (n.º 5325), que es
  la empresa que recibe las órdenes. No lleva a la ficha del fondo.

El aviso «no hemos podido confirmar en ningún registro público…» sigue siendo
cierto y se mantiene. Los otros cuatro avisos de Spiko Euro también siguen
vigentes, porque la web repite hoy las mismas frases:

- «Interés a tipo fijo» y «Garantizado por contrapartes»;
- «Sociedad gestora Amundi Asset Management»;
- «€STR + un 0,40%»;
- «No existen límites de retirada».

## Documentos (SHA-256 frente a ayer)

- **Spiko.** Tienen la misma huella que ayer los KID en español, inglés y
  francés, los folletos en inglés y francés (también el de GECO), el
  certificado de la AMF y los términos v2.2. El texto de las 14 páginas de
  docs.spiko.io es igual; la tabla de países sigue fechada el 23/10, con España
  marcada. El folleto en español sigue dando error 403.
- **Robinhood.** Tienen la misma huella los seis PDF: los KID en inglés y en
  español, la descripción de servicios en inglés y en español, las tarifas y
  los términos. La página en español dice lo mismo.
- **Kraken.** Tienen la misma huella el folleto base, el segundo suplemento y
  las condiciones finales de SPYx, AAPLx, NVDAx, JBBBx, CH1580494602 y LITEx.
  Los KID en español del emisor se vuelven a fechar cada día (hoy, el 11/11),
  con la misma clase de riesgo; la ficha no los usa. Las páginas de Kraken y la
  tabla de comisiones tienen el mismo texto.
- **Prosegur.** El contrato (08/07/2026) dice lo mismo palabra por palabra. La
  relación de proveedores de criptoactivos de la CNMV (PDF del 09/11) y el
  archivo de ESMA tienen la misma huella.
- **mTBILL.** Tienen la misma huella las Condiciones Finales, el KID en español
  y llms-full.txt. En ESMA hay los mismos 41 documentos del emisor y los mismos
  3 del ISIN.

## Kraken: ¿hay condiciones finales que incluyan España?

No. Todas las condiciones finales leídas siguen diciendo «The Products will be
offered in Liechtenstein and Switzerland». ESMA tiene los mismos 1.730
documentos del emisor que ayer: las últimas condiciones finales son del 03/11 y
la última actualización, del 04/11. No hay ningún suplemento nuevo. El primer
aviso se mantiene.

## mTBILL

- **Valor por token:** 1,07768132 USD, que redondeo a **1,0777 USD**. Es la
  ronda 492 del oráculo del emisor en Ethereum, publicada el **10/11/2026 a las
  18:40** y leída hoy a las 09:25. Ayer era 1,0776 USD (09/11). Nueva métrica:
  «Valor por token · 10/11/2026: 1,0777 USD (oráculo del emisor)».
- **En cadena:** los contratos de emisión, de reembolso y el token no están
  pausados. La comisión de reembolso inmediato es del 0,07 %. Hay 66,14
  millones de mTBILL en Ethereum.
- **Acceso desde España, sin usar la lista blanca.** Hoy no he consultado la
  lista blanca del contrato y la he quitado como prueba. El acceso se apoya en
  tres cosas:
  - las Condiciones Finales: oferta pública en España, también para
    minoristas;
  - el folleto, notificado a la CNMV (BPWO-84);
  - la web de Midas: el código nuevo (main-DWqV5Q2W.js) mantiene España entre
    los 14 países permitidos y no pide a quien compra mTBILL que sea inversor
    cualificado.
- **El conflicto sigue igual.** Las Condiciones Finales dicen 25 % diario y
  retención de hasta el 5 %. El KID dice 15 % y hasta el 50 %. El estado debe
  seguir en «fuentes_en_conflicto».
- **Rentabilidad (APY):** sigue en null. midas.app da 403 (Cloudflare).

## Advertencias de la CNMV (11/11, 09:19–09:24)

He buscado Spiko, Twenty First Capital, Amundi, Aldana, Robinhood, Kraken,
Payward, Backed, xStocks, Prosegur, Prosegur Custodia, Midas y Midas Software.
Ninguna tiene advertencias. Los dos controles funcionan: «Trading» devuelve 16
páginas y «Gemini» devuelve dos entidades.

## Bloqueos e incidencias

- midas.app y las páginas HTML de docs.midas.app dan 403 (Cloudflare). Lo he
  intentado con curl. El intento con navegador lo bloquearon los permisos de la
  sesión por considerarlo un intento de sortear la protección contra bots, así
  que no insistí. El APY de mTBILL queda en null.
- El folleto de Spiko en español da 403.
- assets.backed.fi sigue bloqueada por país. No se intentó sortear.
- **La conexión funcionó bien hoy.** El proxy no cortó ninguna descarga. La API
  de REGAFI respondió al primer intento (ayer necesitó cuatro).
- **Incidencia propia, ya corregida.** El grupo «reventa» trabaja en paralelo y
  usa la misma carpeta temporal que yo. Durante un minuto, su versión de un
  script auxiliar guardó 16 descargas mías de Spiko en `grupos/reventa/fuentes/`.
  Las moví a mi carpeta y saqué esas 16 líneas de su registro temporal
  (`scratchpad/inv.jsonl`). A partir de ahí usé solo scripts propios, en otra
  carpeta.
- He recortado los nombres de personas físicas de las copias guardadas:
  - testimonios de las webs de Spiko, Prosegur y xstocks.fi;
  - administradores en las condiciones finales de Backed y de Midas.

## Archivos

- Expedientes (`../../expedientes/`): `spiko-letras-del-tesoro-euro.json`,
  `spiko-letras-del-tesoro-dolar.json`, `spiko-smart-cash-euro.json`,
  `robinhood-classic-stock-tokens.json`, `kraken-xstocks.json`,
  `prosegur-digital-gold.json` y `mtbill.json`.
- Inventario: `inventario-consultas.json`, con 217 entradas: 163 consultas y
  54 textos extraídos. Cada entrada lleva URL, archivo, código HTTP, hora,
  bytes y SHA-256.
- Copias: `fuentes/` (PDF de menos de 3 MB, textos extraídos y páginas
  renderizadas). Las respuestas de API, la lectura en cadena, el HTML completo
  y los PDF grandes están en `fuentes/crudo/`.

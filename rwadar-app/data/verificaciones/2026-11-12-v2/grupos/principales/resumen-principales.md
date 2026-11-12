# Grupo principales · puesta al día del 12/11/2026

He revisado las siete fichas principales del grupo entre las 00:32 y las 00:48
UTC del 12/11/2026. He vuelto a descargar hoy cada fuente primaria (185
consultas) y la he comparado con la de ayer por su huella SHA-256 o, en las
páginas web que cambian solas, por su texto. Solo he usado páginas,
documentos, API, registros públicos y lecturas en cadena. No he iniciado
sesión, no he hecho KYC y no he tocado wallets ni formularios.

## En una frase

Casi nada cambia. Spiko Euro tiene un valor liquidativo nuevo (del 11/11) con
la misma cifra, 2,84 %. Para mTBILL propongo, por fin, una rentabilidad
comprobada: **3,53 % al año en dólares**, calculada con el oráculo del emisor.
Las dos letras del Tesoro de Spiko, Robinhood, Kraken y Prosegur siguen
igual.

| Ficha | Publicado (11/11) | Hoy (12/11) | Propuesta |
|---|---|---|---|
| Spiko Letras del Tesoro Euro | 2,41 % (VL del 11/11) | 2,41 % (misma VL; la API da el mismo archivo) | mantener |
| Spiko Letras del Tesoro Dólar | 4,02 % en USD (VL del 10/11) | 4,02 % (misma VL; mismo archivo) | mantener |
| Spiko Euro (Smart Cash) | 2,84 % (VL del 10/11) | **2,84 % (VL del 11/11)** | actualizar (fecha) |
| mTBILL | sin rentabilidad; 1,0777 USD (10/11) | **3,53 % en USD (13/10–10/11)**; 1,0777 USD (sigue la ronda del 10/11) | actualizar |
| Robinhood Classic Stock Tokens | — | sin cambios | mantener |
| Kraken xStocks | — | sin cambios en la tarjeta | mantener |
| Prosegur Digital Gold | — | sin cambios | mantener |

## Spiko

- **Letras del Tesoro Euro y Dólar.** El 11/11 fue festivo en Francia y no hubo
  valor liquidativo (VL) nuevo. La API pública de Spiko devuelve hoy, a las
  00:33 UTC, los mismos archivos que ayer, byte a byte. Lo he recalculado con la
  serie de VL: Euro 2,413 % (31 días) y Dólar 4,019 % (32 días, en dólares). La
  web y data.spiko.io dicen 2,41 % y 4,02 %. La AMF sigue con «1.06274 € au
  11/11/2026». **La próxima VL de las dos llega hoy a las 18:00 UTC**: si la
  entrega se monta después, habrá cifras nuevas.
- **Spiko Euro.** Spiko calculó ayer a las 16:26 UTC una VL nueva, de 1,017029 €
  y con fecha del 11/11. La cifra publicada sigue en 2,84 %. Cambian la fecha
  del literal y de la métrica, que pasan del 10/11 al 11/11. **Propongo cambiar
  también cómo se explica la cifra**: lo que creció el fondo en un día, pasado a
  un año, sale hoy 2,80 %. Eso cabe en el margen de redondeo de la VL, que tiene
  6 decimales, pero ya no es «exactamente» 2,84 %. A 7 y a 28 días sale 2,83 %.
  La web dice que 2,84 % es el «tipo neto de comisiones abonado diariamente por
  la contraparte bancaria (BNP Paribas)». Mejor decir eso. **Próxima VL: hoy,
  hacia las 19:30 UTC.**
- **Documentos y registros.** Los KID en español, inglés y francés, los
  folletos en inglés y francés, la copia de la AMF (GECO) y los términos tienen
  la misma huella que ayer. Las 14 páginas de docs.spiko.io son iguales. La
  CNMV y la AMF dicen lo mismo que ayer. Siguen igual tres cosas:
  - el aviso de que ningún registro público confirma que Spiko Euro se venda
    en España;
  - el choque del mínimo de la clase EUR del fondo en dólares (1 € en el
    folleto, 1.000 en la API; lo he vuelto a comprobar a las 00:42 UTC);
  - el folleto en español da error 403.

## mTBILL: el pendiente de ayer

- **Rentabilidad con el oráculo del emisor.** He leído en cadena, a las 00:34
  UTC, las 492 rondas del oráculo mTBILL/USD. La última sigue siendo la del
  **10/11/2026 a las 18:40 UTC** (1,07768132 USD); el 11/11 no hubo ronda.
  Tomo la ronda más cercana a 30 días antes: la del **13/10/2026** (1,07474744
  USD), justo 4 semanas antes. Sale **3,53 % al año sin capitalizar** (3,59 %
  capitalizando).
  - Cuidado con la ventana: el valor sube más algunos miércoles y jueves. Por
    eso una ventana de 4 semanas justas es la más limpia. Con 32 días sale
    3,20 %; con 90 días, 3,36 %; con un año, 3,33 %. La tarjeta debe llevar las
    fechas exactas.
  - Contraste, no para la tarjeta: rwa.xyz da 3,44 % a 30 días (dato del 11/11
    a las 03:54 UTC, sin actualizar hoy). DefiLlama da una media de 3,28 % en
    sus 30 últimos puntos; su punto de hoy, 2,41 %, es un salto de su serie.
    Su precio coincide con el oráculo.
- **¿Va neto de la comisión de rendimiento del 5 %?** Sí, según el KID en
  español (mismo archivo que ayer). Dice tres cosas:
  - el valor del producto es el VL «calculado por el Agente de Cálculo, tras
    deducir todas las comisiones, costes y deducciones aplicables» (p. 1);
  - «El VL por Producto se publica en https://midas.app/mtbill y a través de
    oráculos on-chain» (p. 1);
  - la comisión de rendimiento es del «5 % de la rentabilidad positiva del
    mToken, deducido dentro del VL» (p. 3).

  El KID no da la dirección del oráculo. Que este sea el del producto se
  comprueba en cadena: la bóveda de reembolso usa un `mTokenDataFeed` cuyo
  `aggregator()` es este oráculo, con la descripción «mTBILL/USD».
- **Texto propuesto.**
  - Métrica: «Rentabilidad pasada · 4 semanas hasta el 10/11/2026 · en USD:
    3,53 % anual».
  - Aviso: «La rentabilidad es pasada y la calcula RWAdar con el valor que
    publica el emisor: está en dólares, no descuenta el 0,07 % del reembolso
    inmediato ni el cambio euro/dólar, y no garantiza la futura.»
- **Límites de reembolso: el conflicto sigue igual.** Las Condiciones Finales
  dicen 25 % al día y retención de hasta el 5 %. El KID dice 15 % y hasta el
  50 %. Son los mismos archivos que ayer, así que el estado debe seguir en
  «fuentes_en_conflicto».
- **En cadena (00:46 UTC).** La emisión, el reembolso y el token no están
  pausados. La comisión del reembolso inmediato es del 0,07 % y el mínimo, de
  1 mTBILL. En Ethereum hay 66,13 millones de mTBILL. En el contrato de
  Superstate hay 8.290.317 USDC disponibles (a las 00:34 UTC).
- **Registros.** ESMA tiene los mismos 41 documentos del emisor y los mismos 3
  del ISIN. La ficha de pasaportes de la CNMV dice lo mismo. La FMA de
  Liechtenstein sigue sin resultados.

## Robinhood, Kraken y Prosegur (muestreo)

- **Robinhood.** No cambia nada. Los seis PDF (KID en inglés y en español,
  descripción de servicios en inglés y en español, tarifas y términos) tienen
  la misma huella entre las 00:33:22 y las 00:33:27 UTC. La página en español
  dice lo mismo (00:37:44 UTC). El Banco de Lituania y la CNMV (n.º 5299)
  también dicen lo mismo.
- **Kraken.** La tarjeta no cambia.
  - El folleto, el suplemento y las seis condiciones finales tienen la misma
    huella (00:33:33–00:33:55 UTC). Siguen diciendo «offered in Liechtenstein
    and Switzerland».
  - ESMA tiene los mismos 1.730 documentos del emisor.
  - Las páginas de Kraken UE, el aviso de riesgos, los términos, las
    comisiones, CySEC y la CNMV tienen el mismo texto.
  - Los KID en español del emisor se regeneran cada día. Hoy llevan fecha del
    11/11 y la misma clase de riesgo.
  - **Novedad no crítica:** la ayuda global de Kraken, actualizada el 11/11,
    anuncia xStocks de bolsas del Reino Unido y de la UE, con el horario de su
    bolsa. Kraken UE no las menciona. Hay que vigilarlo, porque cambiaría el
    título («acciones de EE. UU.»).
- **Prosegur.** El contrato del 08/07/2026 dice lo mismo, carácter a carácter
  (00:38:23 UTC). Las comisiones siguen en LBMA +4 % y −6 %, y la salida sigue
  siendo solo la recompra por Prosegur. La web sigue diciendo «Compra mínima 1
  gramo». La relación de la CNMV es el mismo archivo. La fila de ESMA dice lo
  mismo; el CSV completo cambia porque añade entidades de otros países. El
  gramo cuesta hoy 119,97 € (ayer, 121,69 €); no va en la tarjeta.

## Advertencias de la CNMV (12/11, 00:33 UTC)

He buscado Spiko, Twenty First Capital, Amundi, Aldana, Robinhood, Kraken,
Payward, Backed, xStocks, Prosegur, Prosegur Custodia, Midas y Midas
Software: ninguna tiene advertencias. Las dos búsquedas de control funcionan:
«Trading» devuelve 16 páginas, la primera con una advertencia del 10/11/2026,
y «Gemini» devuelve dos entidades.

## Bloqueos e incidencias

- **Midas:** midas.app y docs.midas.app devuelven 403 (cuerpo «{}») a una
  petición normal entre las 00:33:21 y las 00:33:40 UTC. Afecta a la página de
  mTBILL, llms.txt, el JS de la web y las páginas de documentos. No he
  insistido ni lo he intentado con navegador. Por eso no he podido leer el
  APY oficial del emisor. Cinco datos de acceso desde España y uno de salida
  salían del JS de la web o de llms-full.txt y siguen con fecha del 11/11. El acceso se sostiene
  igual con las Condiciones Finales y la CNMV. Los PDF del emisor sí se
  descargan del CDN de GitBook y tienen la misma huella.
- Folleto de Spiko en español: 403, igual que ayer.
- assets.backed.fi sigue bloqueada por país. No lo he intentado sortear.
- Sin una cabecera de idioma, kraken.com sirve la versión inglesa en sus URL en
  español, y la app de Prosegur se abre en inglés. Las he vuelto a pedir con
  `accept-language: es` o con el idioma es-ES del navegador, que es pedir un
  idioma, no disfrazarse.
- He recortado los nombres de personas físicas de las copias renderizadas
  (testimonio de Spiko y nota de prensa de Prosegur). En `crudo/` quedan las
  descargas tal cual: no entran en Git.

## Archivos

- Expedientes en `../../expedientes/`: `spiko-letras-del-tesoro-euro.json`,
  `spiko-letras-del-tesoro-dolar.json`, `spiko-smart-cash-euro.json`,
  `mtbill.json`, `robinhood-classic-stock-tokens.json`, `kraken-xstocks.json` y
  `prosegur-digital-gold.json`.
- `inventario-consultas.json`, con 185 entradas. Cada una lleva URL, archivo,
  código HTTP, hora, bytes, SHA-256 y si la huella coincide con la del 11/11.
- Copias en `fuentes/`: los PDF de menos de 3 MB, los textos extraídos y las
  páginas renderizadas. En `fuentes/crudo/` están el HTML completo, las
  respuestas de API, las lecturas en cadena (con sus peticiones) y los PDF
  grandes.

# Verificación de las noticias del 21/11/2026 · pase 1

**Veredicto: conforme.** Las cinco noticias están confirmadas y no hay correcciones.

- Edición verificada: `editor/noticias-2026-11-21.json`, SHA-256 `f76ee267ba95c5c72e51c96138b5925e388f4f475d237f3739c4a706c83a7b37`.
- Guía leída: `GUIA-TITULARES.md`, SHA-256 `ef8916de157acf74be281491f5a1e5e4bc0a4b3267ea1fdf2f6b677745468edb` (la misma que cita `titulares.json`).
- He abierto yo mismo las cinco fuentes el 21/11/2026 entre las 16:52:55 y las 16:52:59 UTC.

## Resumen

| # | Noticia | Fecha | Foto | Veredicto |
| --- | --- | --- | --- | --- |
| 1 | Oro y acciones sin folleto: tres avisos llegan de Alemania | 18/11/2026 | alerta-fraude-3 | confirmada |
| 2 | 9 firmas sin registro; dos imitan a firmas registradas | 16/11/2026 | pago-online | confirmada |
| 3 | xStocks lanza tokens de más de 200 empresas europeas (nueva) | 11/11/2026 | acciones-eeuu | confirmada |
| 4 | Robinhood: el emisor podrá restarte Stock Tokens por costes | 09/11/2026 | acciones-movil | confirmada |
| 5 | España ya tiene dos mercados de valores tokenizados | 28/10/2026 | bolsa-madrid | confirmada |

Qué cambia frente a lo publicado ahora: las noticias 1, 2, 4 y 5 son idénticas, letra a letra, a las de `produccion-noticias-v2.json`. Entra la de xStocks y sale la del Consejo de la UE sobre el tope del régimen piloto (del 04/11; su fuente sigue respondiendo igual, así que sale por decisión editorial, no por un fallo).

Comprobaciones de toda la edición:

- Titulares: todos de 60 caracteres o menos en las dos lenguas (el más largo, 59), sin punto final, sin «¡» ni «!» y sin palabras de promesa o exageración.
- Fotos: cinco distintas, cada una de su tema en `fotos.json`. La de portada (alerta-fraude-3) es la misma que lleva hoy esa misma noticia en portada. La regla de cambiarla está pensada para una portada nueva, así que no la cambio.
- Fechas: cada una es la del documento de la fuente. Ninguna es de hoy ni de ayer, así que ninguna puede salir como «Hoy».
- Sin personas: he leído entero cada texto publicado (titular, resumen, «por qué importa» y título informativo, en castellano y en inglés) y cada cita. Solo salen organismos, empresas e índices (CNMV, BaFin, FMA, Kraken, Payward, Robinhood, Bit2Me, Securitize, DAX). La nota de xStocks trae una declaración firmada por un directivo y el suplemento de Robinhood, una firma: ninguna de las dos se usa.
- Lo que falta: el barrido no trae nada de hoy ni de ayer del sector. Lo único nuevo es un convenio del BOE ajeno al sector, y la CNMV y la ESMA no tienen nada nuevo.

## Noticia a noticia

### 1 · Oro y acciones sin folleto: tres avisos llegan de Alemania — confirmada

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7bb0c4a848-4bd7-40b7-9b28-8f013ad97bc4%7d
- Hora: 2026-11-21T16:52:55Z · HTTP 200 · PDF de 134.678 bytes
- SHA-256: `6b1d350e69c262faab5ab9ca1a14c88ce273f668b85909a1bac907da5f148820` (igual que el inventario)
- Cita: «BAFIN ha prohibido a Uniox Gold LLC la oferta al público de oro físico por no haber publicado EL FOLLETO INFORMATIVO O DOCUMENTO EQUIVALENTE REQUERIDO POR LA NORMATIVA DE VALORES.»
- El documento es del 18 de noviembre de 2026 y recoge tres avisos de BaFin: prohíbe ofrecer oro físico, suspende una oferta de acciones y tiene indicios de que se ofrece un producto de inversión sin folleto. Todo eso coincide con el resumen. El buscador de entidades advertidas que se recomienda está en la fuente. Foto de avisos y fraude, propia para un aviso de riesgo.

### 2 · 9 firmas sin registro; dos imitan a firmas registradas — confirmada

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7bf3fcb37a-091d-4f8b-b217-60ba8b126e7e%7d
- Hora: 2026-11-21T16:52:57Z · HTTP 200 · PDF de 149.664 bytes
- SHA-256: `d80481e506caff1bf39324084e323d5f9c79a271ff902ad92ae42d8600bbd355` (igual que el inventario)
- Cita: «La CNMV pone de manifiesto que dichas sociedades no figuran inscritas en el correspondiente registro de esta Comisión y, por tanto, no están autorizadas para prestar servicios de inversión u otras actividades sujetas a la supervisión de la CNMV.»
- El documento es del 16 de noviembre de 2026. He contado las entidades: son 9, y dos llevan la marca «clon». Una no guarda relación con una empresa de asesoramiento financiero registrada y la otra, con una sociedad de capital riesgo registrada, como dice el resumen. Foto propia de avisos y fraude, que no se repite.

### 3 · xStocks lanza tokens de más de 200 empresas europeas — confirmada (nueva)

- URL: https://xstocks.com/us/news/xstocks-brings-200-of-the-uk-and-eus-largest-companies-onchain
- Hora: 2026-11-21T16:52:58Z · HTTP 200 · HTML de 51.355 bytes
- SHA-256: `5adbaf19336bc991679752f970e30b621186090aded652aa12e4637adca37e78`. El SHA-256 cambia en cada descarga: el sitio cambia el código del enlace «Contact» en cada visita. El inventario recibió el mismo tamaño y el mismo texto.
- Cita: «xStocks has launched its first regional markets, bringing tokenized equities for 200+ of the largest UK and EU-listed companies, and every constituent of the DAX 40. [...] Each xStock is backed 1:1 by the underlying share but represents economic exposure only, not direct ownership.»
- La página está fechada el 11 de noviembre de 2026. La fuente respalda cada dato:
  - «más de 200», «las 40 del DAX» y el respaldo 1:1 están en la cita;
  - solo da exposición económica, no la propiedad directa;
  - se ofrecen en Kraken y en socios de la «xStocks Alliance»;
  - son los primeros mercados de fuera de EE. UU.;
  - en la UE los ofrece una firma del grupo autorizada por el supervisor de Chipre;
  - la nota dice: «xStocks are not, nor will they be registered with any local securities regulators»;
  - el pie de la página pone xStocks entre los servicios de Payward, la empresa de Kraken.
- El titular tiene verbo activo, el sujeto exacto y la cifra de la fuente. Foto de acciones tokenizadas: un escritorio con gráficos genéricos, nada que la ate a EE. UU. No se repite. Ninguna persona: la declaración del directivo que trae la nota no se usa.

### 4 · Robinhood: el emisor podrá restarte Stock Tokens por costes — confirmada

- URL: https://cdn.robinhood.com/assets/robinhood/legal/rhj_base_prospectus_supplement_09_november_2026.pdf
- Hora: 2026-11-21T16:52:58Z · HTTP 200 · PDF de 2.208.721 bytes
- SHA-256: `978eea67a47d5bb63f184a1efa419118166301ee94806e94f91f3fec710d29b9` (igual que el inventario)
- Cita: «the Issuer is permitted to pass on certain fees and costs charged to the Issuer in connection with an Underlying to Investors, which may include proportionately reducing the number of Products held by such Investors»
- El documento respalda cada dato:
  - el suplemento lleva fecha del 09/11/2026 y la FMA de Liechtenstein lo aprobó ese día;
  - la nueva condición 5.3 deja repercutir costes «resulting in a decrease in the number of Products»;
  - el cambio vale para las series ya emitidas desde la fecha del suplemento;
  - el folleto se notifica, entre otros países, a España;
  - los productos son «debt securities»;
  - la frase de que el emisor prevé incorporar a la filial europea de Robinhood como participante autorizado está en la versión del folleto del 25 de junio que acompaña al suplemento, no entre los cambios.
- Una observación que no cambia el veredicto: el documento no dice literalmente «de EE. UU.». Lo respaldan su apartado fiscal (retención de EE. UU. sobre dividendos, sección 871(m)) y los mercados de referencia que cita primero (NASDAQ, NYSE). La noticia ya estaba publicada así, con la misma fuente.
- Foto de acciones tokenizadas, distinta de la de xStocks.

### 5 · España ya tiene dos mercados de valores tokenizados — confirmada

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7be319e419-ac2f-4812-9d69-01ed76101aee%7d
- Hora: 2026-11-21T16:52:59Z · HTTP 200 · PDF de 97.216 bytes
- SHA-256: `e09fadd373bf36218aa83c02bad132b9e13cab4786b5087a3671ab78e1717727` (igual que el inventario)
- Cita: «El Consejo de la CNMV ha autorizado el Sistema de Negociación y Liquidación, SNL, basado en Tecnología de Registros Distribuidos, TRD [...] En Bit2MeSTX se podrán negociar acciones y bonos representados en TRD.»
- La nota es del 28 de octubre de 2026. Quién lo operará, qué se podrá negociar y que es del régimen piloto (Reglamento (UE) 2022/858) coinciden con la fuente.
- El «dos» suma la autorización anterior de Securitize, que no está en esta nota. Está documentada en público y la guía usa este mismo titular como ejemplo bueno. En las notas de la CNMV desde el 28/10 no aparece otra autorización de este tipo, así que la cifra sigue valiendo.
- «No consta» es una afirmación prudente, no un «no hay». Foto de bolsas y mercados, propia.

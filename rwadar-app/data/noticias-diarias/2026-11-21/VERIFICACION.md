# Verificación de las noticias del 21/11/2026 · pase 1

**Veredicto: con cambios** (dos correcciones de un tiempo verbal en una noticia; el resto, confirmado).

- Edición verificada: `editor/noticias-2026-11-21.json`, SHA-256 `f99c5c763bd37bec128dea8493560251534aa09ce60663d8b8667059ed7f84d2`.
- Guía leída: `rwadar-editorial-source/noticias/GUIA-TITULARES.md`.
- Abrí yo mismo las cinco fuentes el 21/11/2026 entre las 15:24:59 y las 15:25:04 UTC. Las cinco responden con HTTP 200 y dan la misma huella que el inventario del programa y que lo publicado ayer.
- La edición es la publicada ayer con dos cambios: la fecha de consulta (21/11) y la foto de portada (`alerta-fraude` pasa a `alerta-fraude-3`, como pide la guía § 4.3 si la portada repite foto).

| # | Noticia | Veredicto |
| --- | --- | --- |
| 1 | Oro y acciones sin folleto: tres avisos llegan de Alemania | confirmada |
| 2 | 9 firmas sin registro; dos imitan a firmas registradas | confirmada |
| 3 | Robinhood: el emisor podrá restarte Stock Tokens por costes | confirmada |
| 4 | Mercados tokenizados: los 27 piden un tope 50 veces mayor | confirmada |
| 5 | España ya tiene dos mercados de valores tokenizados | corregir (resumen, castellano e inglés) |

Comprobado en las cinco: titulares de 60 caracteres o menos en las dos lenguas (58/55, 54/49, 59/57, 57/55 y 51/46), sin punto final, sin promesas ni exageraciones, sin «¡» ni «!». Sin personas: leí entero cada texto que se publica (titular, resumen, «por qué importa» y título informativo, en castellano y en inglés) y cada cita. Las cinco fotos son de la biblioteca, distintas entre sí y del tema de cada noticia.

---

## 1 · Oro y acciones sin folleto: tres avisos llegan de Alemania · confirmada

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7bb0c4a848-4bd7-40b7-9b28-8f013ad97bc4%7d
- Hora: 2026-11-21T15:24:59Z · HTTP 200 · SHA-256 `6b1d350e69c262faab5ab9ca1a14c88ce273f668b85909a1bac907da5f148820`
- Cita: «BAFIN ha prohibido a Uniox Gold LLC la oferta al público de oro físico por no haber publicado EL FOLLETO INFORMATIVO O DOCUMENTO EQUIVALENTE REQUERIDO POR LA NORMATIVA DE VALORES.»
- El documento es del 18 de noviembre de 2026 y recoge tres avisos del supervisor alemán: una oferta de acciones suspendida, una oferta de oro físico prohibida y una tercera con indicios de ofrecer un producto de inversión, las tres sin folleto. El resumen lo cuenta así. La CNMV dice que su web «ofrece un buscador de entidades advertidas», lo que respalda el consejo de «por qué importa».
- Foto `alerta-fraude-3` (avisos y fraude): encaja con un aviso de riesgo. Fecha correcta. Sin personas.

## 2 · 9 firmas sin registro; dos imitan a firmas registradas · confirmada

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7bf3fcb37a-091d-4f8b-b217-60ba8b126e7e%7d
- Hora: 2026-11-21T15:25:01Z · HTTP 200 · SHA-256 `d80481e506caff1bf39324084e323d5f9c79a271ff902ad92ae42d8600bbd355`
- Cita: «La CNMV pone de manifiesto que dichas sociedades no figuran inscritas en el correspondiente registro de esta Comisión y, por tanto, no están autorizadas para prestar servicios de inversión u otras actividades sujetas a la supervisión de la CNMV.»
- El aviso es del 16 de noviembre de 2026. He contado las entidades de la lista: son 9, y dos llevan la marca «(clon)»: una de una empresa de asesoramiento financiero registrada y otra de una sociedad de capital riesgo registrada. Coincide con el titular y con el resumen.
- Foto `pago-online` (avisos y fraude; pagos): encaja con webs clonadas. Fecha correcta. Sin personas.

## 3 · Robinhood: el emisor podrá restarte Stock Tokens por costes · confirmada

- URL: https://cdn.robinhood.com/assets/robinhood/legal/rhj_base_prospectus_supplement_09_november_2026.pdf
- Hora: 2026-11-21T15:25:02Z · HTTP 200 · SHA-256 `978eea67a47d5bb63f184a1efa419118166301ee94806e94f91f3fec710d29b9`
- Cita: «Further, if fees or costs are charged to the Issuer in connection with the Underlying (for example, where the Underlying is a depositary receipt that does not pay dividends), then the Issuer may pass-through any such fees or costs to Investors. Such fees will be deducted by reducing the number of Products held by the Investor.»
- El suplemento tiene fecha del 09/11/2026 y lo aprobó la FMA de Liechtenstein ese mismo día. Cambia también las condiciones de los productos ya emitidos, con efecto desde esa fecha. Los productos son valores de deuda en forma de tokens. El folleto base pidió notificarse a España, entre otros países. La versión consolidada del folleto, con fecha del 25 de junio de 2026, ya dice que el emisor prevé sumar a la filial europea de Robinhood como participante autorizado, y el suplemento no añade esa frase. Todo lo que dicen el resumen y «por qué importa» consta en el documento.
- Un matiz que no cambia el veredicto: el documento dice que los productos van ligados a «equity instruments or ETPs», sin limitarlos a EE. UU. La referencia a EE. UU. del resumen casa con los productos que hay hoy, que usan la retención fiscal de EE. UU. y precios en dólares.
- Foto `acciones-movil` (acciones tokenizadas): encaja. Fecha correcta. Sin personas: el documento trae firmas, pero la noticia no las recoge.

## 4 · Mercados tokenizados: los 27 piden un tope 50 veces mayor · confirmada

- URL: https://data.consilium.europa.eu/doc/document/ST-13779-2026-REV-1/en/pdf
- Hora: 2026-11-21T15:25:02Z · HTTP 200 · SHA-256 `757b8851957af55c035cca5651b8d2d9a5a61f43036ec780bf06af999a498599`
- Cita: «an aggregate cap that limits the total value of financial instruments intermediated by a DLT market infrastructure of EUR 6 billion. Those activity thresholds have made it difficult for certain large market participants to use the Pilot framework [...]. Therefore, all asset-specific caps should be withdrawn, whereas the aggregate cap should be raised to EUR 300 billion.»
- El texto de la orientación general (nota de la Presidencia del 30/10/2026) quita los topes por activo y sube el tope total de 6.000 a 300.000 millones de euros. La cuenta 300.000 / 6.000 da 50 veces.
- La fecha (04/11/2026) sale del segundo documento que cita la fuente, que también abrí: la lista de puntos «A» del ECOFIN, https://data.consilium.europa.eu/doc/document/ST-14900-2026-INIT/en/pdf (2026-11-21T15:27:35Z, HTTP 200, SHA-256 `54f5eeefda10ae00b309e1996590999152cc10e77bf0449e2ac1f2da58eb2cb7`). Dice «General approach approved by Coreper. Part 2, on 04.11.2026». La noticia aclara bien que es una posición negociadora y no una ley.
- Foto `instituciones-ue-2` (regulación en la UE): encaja. Fecha correcta. Sin personas.

## 5 · España ya tiene dos mercados de valores tokenizados · corregir

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7be319e419-ac2f-4812-9d69-01ed76101aee%7d
- Hora: 2026-11-21T15:25:04Z · HTTP 200 · SHA-256 `e09fadd373bf36218aa83c02bad132b9e13cab4786b5087a3671ab78e1717727`
- Cita: «La infraestructura, denominada Bit2MeSTX, será operada por Bit2Me Security Tokens Exchange STX, A.V., S.A. [...] En Bit2MeSTX se podrán negociar acciones y bonos representados en TRD.»
- El titular es correcto. Abrí la lista de ESMA de infraestructuras DLT autorizadas, https://www.esma.europa.eu/sites/default/files/2026-01/Authorised_DLT_Market_Infrastructures.pdf (2026-11-21T15:27:54Z, HTTP 200, SHA-256 `8f223820d3223598b284c30a0556177fb40c0a9c31053d1a8f549055a830c1fc`). Trae exactamente dos en España, las dos de la CNMV: la de Securitize, desde el 26/11/2025, y Bit2Me STX, desde el 27/10/2026.
- Lo que falla es el resumen. Dice «Lo opera Bit2Me…» («It is run by…»), en presente, y la fuente dice «será operada»: está autorizada pero aún no funciona. La prensa del sector que encontré lo confirma: espera empezar a operar en las próximas semanas, con una primera emisión prevista para diciembre, para inversores que cumplan ciertos requisitos. Eso cuadra con el «no consta» de «por qué importa», que se queda como está.
- Correcciones (dos, exactas):
  - `resumen`: «Lo opera Bit2Me Security Tokens Exchange STX, A.V.» → «Lo operará Bit2Me Security Tokens Exchange STX, A.V.»
  - `en.resumen`: «It is run by Bit2Me Security Tokens Exchange STX, A.V.» → «It will be run by Bit2Me Security Tokens Exchange STX, A.V.»
- Foto `bolsa-madrid` (bolsas y mercados): encaja. Fecha correcta (nota del 28/10/2026). Sin personas.

---

## «Hoy» y lo que falta

- **Hoy**: ninguna noticia es del 20 ni del 21 de noviembre, así que ninguna puede salir como «Hoy». Correcto.
- **Lo que falta**: el barrido no trae nada nuevo del sector desde el 20/11. La CNMV y ESMA no tienen nada nuevo. El BOE trae un convenio de investigación, que no es del sector. El Consejo, el BCE y la EBA no traen nada del sector, y la Comisión no da elementos. La nota de ESMA del 18/11 sobre la supervisión de los proveedores de datos no es para particulares. No echo nada en falta.

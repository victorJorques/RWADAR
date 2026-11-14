# Verificación de las noticias del 14/11/2026 · segundo pase

**Veredicto: conforme.** Las cinco noticias quedan confirmadas.

- Edición verificada: `corregido/noticias-2026-11-14.json`, SHA-256
  `89a940b5e00d1f1eca339803f361af34615c54e506c6e8f12baa31f06948252b`.
- Las dos correcciones del primer pase (las dos frases de «Por qué importa»
  de Robinhood, en castellano y en inglés) están aplicadas letra a letra. Si
  se deshacen sobre el archivo verificado, sale exactamente la huella que
  juzgó el primer pase (`f38c1d26…b578`): no ha cambiado nada más.
- Frente a lo publicado ayer: las mismas cinco noticias en el mismo orden.
  Solo cambian la fecha de consulta (14/11), la foto de la portada
  (`alerta-fraude` pasa a `alerta-fraude-3`) y esas dos frases corregidas.
- He abierto yo mismo cada fuente: todas responden con HTTP 200 y la misma
  huella que registró el programa.

## Resumen

| Noticia | Veredicto | Titular respaldado | Foto | Sin personas | Fecha |
| --- | --- | --- | --- | --- | --- |
| 11 firmas sin registro: compruébalas antes de invertir | confirmada | sí | sí (`alerta-fraude-3`) | sí | 11/11/2026, correcta |
| Robinhood: el emisor podrá restarte Stock Tokens por costes | confirmada | sí | sí (`acciones-movil`) | sí | 09/11/2026, correcta |
| Mercados tokenizados: los 27 piden un tope 50 veces mayor | confirmada | sí | sí (`instituciones-ue-2`) | sí | 04/11/2026, correcta |
| España ya tiene dos mercados de valores tokenizados | confirmada | sí | sí (`bolsa-madrid`) | sí | 28/10/2026, correcta |
| La CNMV propone atender tus quejas contra plataformas cripto | confirmada | sí | sí (`documentos-consulta`) | sí | 15/10/2026, correcta |

Ninguna noticia es de hoy ni de ayer, así que ninguna debe llevar «Hoy».
Las cinco fotos son distintas y todas están en la biblioteca con el tema
de su noticia. Los titulares miden de 46 a 60 caracteres en las dos lenguas,
sin punto final ni palabras de promesa o exageración. He leído enteros
titular, resumen, «Por qué importa» y título informativo, en castellano y
en inglés: sin personas.

## Noticia a noticia

### 1 · 11 firmas sin registro: compruébalas antes de invertir

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7bcdb0a20a-39bd-473f-9ddc-47ea5d982dab%7d
- Hora: 2026-11-14T13:13:33.390Z · HTTP 200
- SHA-256: `e781ed720cec86116e08e0c4f26140f1befd67a519aee0caaf0998c237ca4782`
- Cita: «La Comisión Nacional del Mercado de Valores (CNMV) hace públicas las
  advertencias recibidas a través de los supervisores internacionales sobre
  las entidades no registradas […] por no haber publicado EL FOLLETO
  INFORMATIVO O DOCUMENTO EQUIVALENTE REQUERIDO POR LA NORMATIVA DE VALORES.
  […] Además, la web de la CNMV ofrece un buscador de entidades advertidas.»
- Contadas en el documento: seis de Austria, cuatro de Países Bajos y una de
  Alemania (11). La foto de aviso encaja con una noticia de riesgo y es otra
  que la de la portada de ayer.

### 2 · Robinhood: el emisor podrá restarte Stock Tokens por costes

- URL: https://cdn.robinhood.com/assets/robinhood/legal/rhj_base_prospectus_supplement_09_november_2026.pdf
- Hora: 2026-11-14T13:13:34.886Z · HTTP 200
- SHA-256: `978eea67a47d5bb63f184a1efa419118166301ee94806e94f91f3fec710d29b9`
- Cita: «the Issuer is permitted to pass on certain fees and costs charged to
  the Issuer in connection with an Underlying to Investors, which may include
  proportionately reducing the number of Products held by such Investors […]
  the Issuer has amended the Terms and Conditions of each Series of Products
  that have been issued and remain outstanding as at the date of this
  Supplement»
- El texto corregido («El cambio vale también para los tokens ya emitidos,
  desde el 9 de noviembre») lo respalda esa cita: la fecha efectiva es la
  del suplemento, el 09/11/2026. El plan de sumar a la filial europea como
  participante autorizado ya estaba en el folleto de junio (la parte que
  modifica el suplemento no lo añade).
- Apoyo: la web del emisor que cita el propio suplemento
  (https://docs.robinhood.com/rhj/faq/, 2026-11-14T13:16:27.124Z, HTTP 200,
  SHA-256 `3d616fe7eeea15324d8948d98742fc9a20ad378a4241c53fe89005aacaf788d8`):
  «Stock Tokens are tokenized debt securities issued by Robinhood Assets
  (Jersey) Limited. […] Stock Tokens are designed for global investors who
  want exposure to US capital markets.» Respalda el nombre «Stock Tokens» y
  lo de «acciones y ETF de EE. UU.».

### 3 · Mercados tokenizados: los 27 piden un tope 50 veces mayor

- URL: https://data.consilium.europa.eu/doc/document/ST-13779-2026-REV-1/en/pdf
- Hora: 2026-11-14T13:13:35.544Z · HTTP 200
- SHA-256: `757b8851957af55c035cca5651b8d2d9a5a61f43036ec780bf06af999a498599`
- Cita: «an aggregate cap that limits the total value of financial
  instruments intermediated by a DLT market infrastructure of EUR 6 billion.
  Those activity thresholds have made it difficult for certain large market
  participants to use the Pilot framework […] Therefore, all asset-specific
  caps should be withdrawn, whereas the aggregate cap should be raised to
  EUR 300 billion.»
- Apoyo para la fecha: https://data.consilium.europa.eu/doc/document/ST-14900-2026-INIT/en/pdf
  (2026-11-14T13:13:39.354Z, HTTP 200, SHA-256
  `54f5eeefda10ae00b309e1996590999152cc10e77bf0449e2ac1f2da58eb2cb7`):
  «General approach approved by Coreper. Part 2, on 04.11.2026».
- 300.000 / 6.000 = 50. Es una posición del Consejo, no una ley; el titular
  dice «piden».

### 4 · España ya tiene dos mercados de valores tokenizados

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7be319e419-ac2f-4812-9d69-01ed76101aee%7d
- Hora: 2026-11-14T13:13:37.124Z · HTTP 200
- SHA-256: `e09fadd373bf36218aa83c02bad132b9e13cab4786b5087a3671ab78e1717727`
- Cita: «El Consejo de la CNMV ha autorizado el Sistema de Negociación y
  Liquidación, SNL, basado en Tecnología de Registros Distribuidos, TRD, así
  como las normas internas que regirán su funcionamiento. […] En Bit2MeSTX se
  podrán negociar acciones y bonos representados en TRD.»
- Apoyo para «dos»: https://www.esma.europa.eu/sites/default/files/2026-01/Authorised_DLT_Market_Infrastructures.pdf
  (2026-11-14T13:13:39.894Z, HTTP 200, SHA-256
  `8f223820d3223598b284c30a0556177fb40c0a9c31053d1a8f549055a830c1fc`):
  «Securitize Europe DLT TSS Spain 26 November 2025 […] Bit2Me STX DLT TSS
  Spain 27 October 2026». Son las dos únicas de España en la lista.

### 5 · La CNMV propone atender tus quejas contra plataformas cripto

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7bcff2b57d-5b54-44e2-98db-057d90acc64b%7d
- Hora: 2026-11-14T13:13:38.247Z · HTTP 200
- SHA-256: `289265b26b53f727c54ce701024533e4dafdcd1a90189dea9601cb127eaece58`
- Cita: «Los interesados podrán enviar comentarios hasta el 16 de noviembre de
  2026. […] La CNMV inicia hoy el trámite de audiencia pública para el
  proyecto de Circular […] Ampliar dicho procedimiento a las reclamaciones
  derivadas de la prestación de servicios de criptoactivos y de financiación
  participativa»
- Es un proyecto en consulta y el plazo sigue abierto hoy; el titular dice
  «propone».

## Lo que falta

Nada. Lo único nuevo del barrido (en el BOE de hoy, unas sanciones de la
CNMV a una empresa industrial cotizada) no es del sector de la
tokenización. Nada de hoy ni de ayer supera a lo elegido.

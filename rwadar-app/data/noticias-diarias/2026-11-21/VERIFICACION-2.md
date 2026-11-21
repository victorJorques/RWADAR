# Verificación de las noticias del 21/11/2026 · segundo pase

**Veredicto: conforme.** La edición se puede publicar tal cual.

- Edición verificada: `corregido/noticias-2026-11-21.json`, SHA-256
  `5768fdc3196c25980680cc0dc18e10886c46e09058155f43b4880a47f698af27`.
- Guía de titulares leída: `GUIA-TITULARES.md`, SHA-256
  `ef8916de157acf74be281491f5a1e5e4bc0a4b3267ea1fdf2f6b677745468edb` (la misma
  que cita `titulares.json`).

## Qué he comprobado en este segundo pase

1. **Las correcciones del primer pase están aplicadas, y nada más ha cambiado.**
   Deshice las dos correcciones de `correcciones.json` sobre la edición y el
   resultado da exactamente la huella que verificó el primer pase
   (`f99c5c76…7f84d2`). Además, `correcciones.json` apunta a la huella real de
   `verificacion.json` (`2e91c251…632dbc2`). Las dos correcciones cambian
   «Lo opera» por «Lo operará» (y «It is run» por «It will be run») en la
   noticia de Bit2Me STX, que es lo que dice la nota de la CNMV («será
   operada»).
2. **Frente a lo publicado ahora**, la edición solo cambia: la fecha de
   actualización (21/11), la fecha de consulta de las cinco fuentes, esa
   corrección de tiempo verbal y la foto de la portada (de `alerta-fraude` a
   `alerta-fraude-3`). El cambio de foto cumple la guía (§ 4.3: si la portada de
   ayer llevaba la misma foto y hay otra del tema, se cambia). He mirado la
   foto: dos luces rojas de aviso en un muro de noche, sin texto, sin logotipos
   y sin personas; encaja con un aviso de riesgo. El archivo está ya en la
   carpeta publicada, con la misma huella que en `fotos.json`.
3. **Las cinco fuentes**, abiertas por mí: todas responden 200 y dan la misma
   huella que el inventario del programa y que el barrido. Es decir, no han
   cambiado desde que se eligieron los titulares.
4. **Titulares**: los diez (castellano e inglés) tienen 60 caracteres o menos,
   sin punto final, sin palabras de promesa ni exageraciones, y coinciden con
   los elegidos en `titulares.json`.
5. **Sin personas**: he leído entero cada texto publicado (titular, resumen,
   «por qué importa» y título informativo, en las dos lenguas) y cada cita.
   Solo aparecen organismos y empresas (CNMV, BaFin, FMA, Coreper, Robinhood,
   Securitize, Bit2Me STX). Sin personas.
6. **Fotos**: las cinco son distintas y cada una es de su tema.
7. **«Hoy»**: la noticia más reciente es del 18/11, así que ninguna lleva
   «Hoy». Correcto.
8. **Lo que falta**: en el barrido no hay nada de hoy ni de ayer del sector.
   Lo único nuevo es un convenio del BOE entre un centro de investigación y una
   universidad, fuera del tema.

## Noticia a noticia

| # | Noticia | Veredicto | HTTP | Hora UTC |
| --- | --- | --- | --- | --- |
| 1 | Oro y acciones sin folleto: tres avisos llegan de Alemania | confirmada | 200 | 2026-11-21T15:32:06Z |
| 2 | 9 firmas sin registro; dos imitan a firmas registradas | confirmada | 200 | 2026-11-21T15:32:07Z |
| 3 | Robinhood: el emisor podrá restarte Stock Tokens por costes | confirmada | 200 | 2026-11-21T15:32:09Z |
| 4 | Mercados tokenizados: los 27 piden un tope 50 veces mayor | confirmada | 200 | 2026-11-21T15:32:09Z |
| 5 | España ya tiene dos mercados de valores tokenizados | confirmada | 200 | 2026-11-21T15:32:11Z |

### 1 · Oro y acciones sin folleto (CNMV, 18/11/2026)

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7bb0c4a848-4bd7-40b7-9b28-8f013ad97bc4%7d
- HTTP 200 · 2026-11-21T15:32:06Z · SHA-256 `6b1d350e69c262faab5ab9ca1a14c88ce273f668b85909a1bac907da5f148820`
- Cita: «BAFIN ha prohibido a Uniox Gold LLC la oferta al público de oro físico
  por no haber publicado EL FOLLETO INFORMATIVO O DOCUMENTO EQUIVALENTE
  REQUERIDO POR LA NORMATIVA DE VALORES.»
- El documento lista tres avisos del supervisor alemán: una oferta de acciones
  suspendida, una oferta de oro físico prohibida y una tercera con indicios de
  ofrecer un producto de inversión sin folleto. La CNMV ofrece un buscador de
  entidades advertidas. Fecha del documento: 18/11/2026. Foto
  `alerta-fraude-3` (avisos y fraude), adecuada.

### 2 · 9 firmas sin registro (CNMV, 16/11/2026)

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7bf3fcb37a-091d-4f8b-b217-60ba8b126e7e%7d
- HTTP 200 · 2026-11-21T15:32:07Z · SHA-256 `d80481e506caff1bf39324084e323d5f9c79a271ff902ad92ae42d8600bbd355`
- Cita: «La CNMV pone de manifiesto que dichas sociedades no figuran inscritas
  en el correspondiente registro de esta Comisión y, por tanto, no están
  autorizadas para prestar servicios de inversión u otras actividades sujetas a
  la supervisión de la CNMV.»
- Conté las entidades: son 9, y dos están marcadas como clon (una imita a una
  empresa de asesoramiento financiero y otra a una sociedad de capital riesgo,
  las dos registradas en España). Fecha: 16/11/2026. Foto `pago-online`
  (avisos y fraude), adecuada.

### 3 · Robinhood Stock Tokens (suplemento aprobado por la FMA el 09/11/2026)

- URL: https://cdn.robinhood.com/assets/robinhood/legal/rhj_base_prospectus_supplement_09_november_2026.pdf
- HTTP 200 · 2026-11-21T15:32:09Z · SHA-256 `978eea67a47d5bb63f184a1efa419118166301ee94806e94f91f3fec710d29b9`
- Cita: «the Issuer is permitted to pass on certain fees and costs charged to
  the Issuer in connection with an Underlying to Investors, which may include
  proportionately reducing the number of Products held by such Investors»
- El suplemento lo aprobó la FMA de Liechtenstein el 09/11/2026; los productos
  son valores de deuda en forma de token; el folleto base está notificado,
  entre otros países, a España; y los cambios se aplican también a los
  productos ya emitidos desde la fecha del suplemento. Lo de la filial europea
  como participante autorizado figura en el folleto base de junio, no en lo que
  cambia el suplemento. Foto `acciones-movil` (acciones tokenizadas), adecuada.

### 4 · Tope del régimen piloto (Consejo de la UE)

- URL: https://data.consilium.europa.eu/doc/document/ST-13779-2026-REV-1/en/pdf
- HTTP 200 · 2026-11-21T15:32:09Z · SHA-256 `757b8851957af55c035cca5651b8d2d9a5a61f43036ec780bf06af999a498599`
- Cita: «an aggregate cap that limits the total value of financial instruments
  intermediated by a DLT market infrastructure of EUR 6 billion. [...] all
  asset-specific caps should be withdrawn, whereas the aggregate cap should be
  raised to EUR 300 billion.»
- 300.000 / 6.000 = 50 veces, la cuenta del titular. La fecha del 04/11 no
  sale de este documento (fechado el 30/10) sino del otro que cita la fuente,
  la lista de puntos «A» del ECOFIN (ST 14900/26), que abrí también:
  https://data.consilium.europa.eu/doc/document/ST-14900-2026-INIT/en/pdf ·
  HTTP 200 · 2026-11-21T15:33:21Z · SHA-256
  `54f5eeefda10ae00b309e1996590999152cc10e77bf0449e2ac1f2da58eb2cb7`. Dice
  «General approach approved by Coreper. Part 2, on 04.11.2026» para este
  reglamento. Fecha correcta. Foto `instituciones-ue-2` (regulación en la UE),
  adecuada.

### 5 · Bit2Me STX (CNMV, 28/10/2026)

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7be319e419-ac2f-4812-9d69-01ed76101aee%7d
- HTTP 200 · 2026-11-21T15:32:11Z · SHA-256 `e09fadd373bf36218aa83c02bad132b9e13cab4786b5087a3671ab78e1717727`
- Cita: «La infraestructura, denominada Bit2MeSTX, será operada por Bit2Me
  Security Tokens Exchange STX, A.V., S.A. [...] En Bit2MeSTX se podrán
  negociar acciones y bonos representados en TRD.»
- La corrección del primer pase («Lo operará» / «It will be run») está
  aplicada y ahora coincide con la fuente. Lo de que España tiene «dos» con
  Securitize no sale de la nota de la CNMV. Lo comprobé en la lista de ESMA de
  infraestructuras autorizadas del régimen piloto:
  https://www.esma.europa.eu/sites/default/files/2026-01/Authorised_DLT_Market_Infrastructures.pdf
  · HTTP 200 · 2026-11-21T15:34:08Z · SHA-256
  `8f223820d3223598b284c30a0556177fb40c0a9c31053d1a8f549055a830c1fc`. Hay dos
  autorizadas por la CNMV: Securitize y Bit2Me STX. Fecha: 28/10/2026. Foto
  `bolsa-madrid` (bolsas y mercados), adecuada.

## Correcciones

Ninguna. En el segundo pase solo vale «conforme» o «rechazado», y no hay nada
que impida publicar.

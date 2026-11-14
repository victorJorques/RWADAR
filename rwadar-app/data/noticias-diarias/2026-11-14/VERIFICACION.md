# Verificación de las noticias del 14/11/2026 · pase 1

**Veredicto: con cambios.** Cuatro noticias confirmadas y una que hay que
corregir: en la de Robinhood, «Por qué te importa» afirma algo que la fuente
no dice. La corrección es un cambio de texto en ese campo (castellano e
inglés); lo demás puede salir tal cual.

Edición verificada: `/tmp/rwadar-noticias-2026-11-14/editor/noticias-2026-11-14.json`,
SHA-256 `f38c1d26ef3d24711b0462939fb0a96562f361acb556c90721cb30d9c283b578`.
Guía leída: `GUIA-TITULARES.md`, SHA-256
`ef8916de157acf74be281491f5a1e5e4bc0a4b3267ea1fdf2f6b677745468edb` (la misma
que cita `titulares.json`).

Frente a lo publicado ahora, la edición solo cambia la foto de la portada
(`alerta-fraude` pasa a `alerta-fraude-3`, como pide la guía § 4.3 cuando la
portada repite foto) y la fecha de consulta de las cinco fuentes.

## Resumen

| # | Noticia | Veredicto | Titular | Foto | Fecha | Sin personas |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 11 firmas sin registro: compruébalas antes de invertir | confirmada | respaldado | `alerta-fraude-3`, adecuada | 11/11/2026, correcta | sí |
| 2 | Robinhood: el emisor podrá restarte Stock Tokens por costes | **corregir** | respaldado | `acciones-movil`, adecuada | 09/11/2026, correcta | sí |
| 3 | Mercados tokenizados: los 27 piden un tope 50 veces mayor | confirmada | respaldado | `instituciones-ue-2`, adecuada | 04/11/2026, correcta | sí |
| 4 | España ya tiene dos mercados de valores tokenizados | confirmada | respaldado | `bolsa-madrid`, adecuada | 28/10/2026, correcta | sí |
| 5 | La CNMV propone atender tus quejas contra plataformas cripto | confirmada | respaldado | `documentos-consulta`, adecuada | 15/10/2026, correcta | sí |

Las cinco fotos son distintas, de su tema en `fotos.json`, y ninguna dice lo
contrario que su noticia (el rojo de alarma solo va en la de avisos). Ningún
titular pasa de 60 caracteres en ninguna de las dos lenguas. Ninguna noticia
es de hoy ni de ayer, así que no lleva «Hoy». He leído entero cada texto que
se publica (titular, resumen, «por qué importa» y título informativo, en las
dos lenguas): solo salen organismos y empresas, sin personas.

## Noticia a noticia

### 1 · 11 firmas sin registro: compruébalas antes de invertir — confirmada

- Fuente: https://www.cnmv.es/webservices/verdocumento/ver?t=%7bcdb0a20a-39bd-473f-9ddc-47ea5d982dab%7d
- Abierta: 2026-11-14T13:05:52.044Z · HTTP 200 · PDF de 140.108 bytes
- SHA-256: `e781ed720cec86116e08e0c4f26140f1befd67a519aee0caaf0998c237ca4782` (igual que el inventario)
- Cita: «La Comisión Nacional del Mercado de Valores (CNMV) hace públicas las
  advertencias recibidas a través de los supervisores internacionales sobre
  las entidades no registradas que se adjuntan en el siguiente listado […]
  Además, la web de la CNMV ofrece un buscador de entidades advertidas.»
- Comprobado: 6 avisos de Austria, 4 de Países Bajos y 1 de Alemania (11);
  el supervisor alemán prohibió a una ofrecer acciones al público sin folleto;
  el consejo de buscar la entidad lo respalda el buscador que cita la CNMV.

### 2 · Robinhood: el emisor podrá restarte Stock Tokens por costes — corregir

- Fuente: https://cdn.robinhood.com/assets/robinhood/legal/rhj_base_prospectus_supplement_09_november_2026.pdf
- Abierta: 2026-11-14T13:05:53.675Z · HTTP 200 · PDF de 2.208.721 bytes
- SHA-256: `978eea67a47d5bb63f184a1efa419118166301ee94806e94f91f3fec710d29b9` (igual que el inventario)
- Cita: «the Issuer is permitted to pass on certain fees and costs charged to
  the Issuer in connection with an Underlying to Investors, which may include
  proportionately reducing the number of Products held by such Investors»
- Titular y resumen, bien: la FMA de Liechtenstein aprobó el suplemento el
  09/11/2026; son valores de deuda tokenizados; el emisor pide a la FMA
  notificar el folleto a España; el emisor podrá repercutir costes reduciendo
  los productos de cada inversor (nueva condición 5.3).
- **Lo que falla**: «En España, Robinhood solo vende hoy los «Classic»» (y en
  inglés «only sells the Classic tokens today») no está en la fuente. La
  palabra solo aparece en «Ethereum Classic», y el lector no sabe qué son los
  «Classic» porque la noticia no lo explica.
- **Corrección** (campo `porQueImporta` y `en.porQueImporta`): cambiarlo por
  lo que la fuente sí dice y le importa al lector, que el cambio alcanza a los
  tokens ya emitidos desde la fecha del suplemento:
  - «El cambio vale también para los tokens ya emitidos, desde el 9 de
    noviembre. Que la filial europea de Robinhood sea participante autorizado
    es un plan que el folleto ya recogía en junio.»
  - «The change also applies to tokens already issued, from 9 November.
    Making Robinhood's EU subsidiary an authorised participant is a plan the
    prospectus already set out in June.»
  - Respaldo: el suplemento dice que el emisor ha modificado las condiciones
    de cada serie ya emitida y en circulación («Existing Products»), con fecha
    efectiva la del suplemento (9/11/2026); y el folleto de 25/06/2026 ya
    preveía que la filial europea fuera participante autorizado «in the near
    future».
- Nota: el nombre comercial «Stock Tokens» no está en el documento; la guía
  pone este mismo titular como ejemplo bueno y el hecho que cuenta sí está.

### 3 · Mercados tokenizados: los 27 piden un tope 50 veces mayor — confirmada

- Fuente: https://data.consilium.europa.eu/doc/document/ST-13779-2026-REV-1/en/pdf
- Abierta: 2026-11-14T13:05:54.336Z · HTTP 200 · PDF de 2.824.126 bytes
- SHA-256: `757b8851957af55c035cca5651b8d2d9a5a61f43036ec780bf06af999a498599` (igual que el inventario)
- Cita: «an aggregate cap that limits the total value of financial instruments
  intermediated by a DLT market infrastructure of EUR 6 billion. Those
  activity thresholds have made it difficult for certain large market
  participants to use the Pilot framework […] Therefore, all asset-specific
  caps should be withdrawn, whereas the aggregate cap should be raised to EUR
  300 billion.»
- La aprobación por los embajadores y su fecha (04/11/2026) no están en ese
  PDF, que es el texto del 30/10/2026; están en la lista de puntos «A» del
  ECOFIN que cita la propia fuente. La abrí también:
  https://data.consilium.europa.eu/doc/document/ST-14900-2026-INIT/en/pdf ·
  2026-11-14T13:08:33.386Z · HTTP 200 · SHA-256
  `54f5eeefda10ae00b309e1996590999152cc10e77bf0449e2ac1f2da58eb2cb7` · cita:
  «General approach approved by Coreper. Part 2, on 04.11.2026».
- 300.000 / 6.000 = 50 veces. «Piden» y «es una posición negociadora, no una
  ley» describen bien una orientación general.
- Aviso del programa («27» y «50» no están tal cual en el resumen): visto.
  50 es la cuenta directa con dos cifras del resumen que admite la guía, y
  los 27 son los Estados de la UE que piden el cambio.

### 4 · España ya tiene dos mercados de valores tokenizados — confirmada

- Fuente: https://www.cnmv.es/webservices/verdocumento/ver?t=%7be319e419-ac2f-4812-9d69-01ed76101aee%7d
- Abierta: 2026-11-14T13:05:55.943Z · HTTP 200 · PDF de 97.216 bytes
- SHA-256: `e09fadd373bf36218aa83c02bad132b9e13cab4786b5087a3671ab78e1717727` (igual que el inventario)
- Cita: «El Consejo de la CNMV ha autorizado el Sistema de Negociación y
  Liquidación, SNL, basado en Tecnología de Registros Distribuidos, TRD, así
  como las normas internas que regirán su funcionamiento. […] En Bit2MeSTX se
  podrán negociar acciones y bonos representados en TRD.»
- El «dos» sale de la lista de ESMA que cita la fuente. La abrí:
  https://www.esma.europa.eu/sites/default/files/2026-01/Authorised_DLT_Market_Infrastructures.pdf ·
  2026-11-14T13:09:08.366Z · HTTP 200 · SHA-256
  `8f223820d3223598b284c30a0556177fb40c0a9c31053d1a8f549055a830c1fc`. En
  España figuran Securitize Europe DLT TSS (26/11/2025) y Bit2Me STX DLT TSS
  (27/10/2026).
- «Por ahora no consta ninguna» emisión es prudente (no dice «no hay»).

### 5 · La CNMV propone atender tus quejas contra plataformas cripto — confirmada

- Fuente: https://www.cnmv.es/webservices/verdocumento/ver?t=%7bcff2b57d-5b54-44e2-98db-057d90acc64b%7d
- Abierta: 2026-11-14T13:05:57.175Z · HTTP 200 · PDF de 126.383 bytes
- SHA-256: `289265b26b53f727c54ce701024533e4dafdcd1a90189dea9601cb127eaece58` (igual que el inventario)
- Cita: «La CNMV inicia hoy el trámite de audiencia pública para el proyecto de
  Circular que modifica la regulación del procedimiento de reclamaciones y
  quejas […] Ampliar dicho procedimiento a las reclamaciones derivadas de la
  prestación de servicios de criptoactivos y de financiación participativa»
- Es un proyecto en consulta y el titular lo dice («propone»). El plazo de
  comentarios, hasta el 16/11/2026, sigue abierto hoy.

## Lo que falta

Nada más importante de hoy ni de ayer en el barrido. Lo único nuevo es una
resolución del BOE de hoy con sanciones de la CNMV a una cotizada industrial,
que no es del sector de la tokenización. Aparte, y sin que cambie el
veredicto: la fuente «Comisión Europea, noticias de finanzas» respondió con
HTTP 200 pero el barrido leyó 0 elementos; conviene mirar si su lectura sigue
funcionando.

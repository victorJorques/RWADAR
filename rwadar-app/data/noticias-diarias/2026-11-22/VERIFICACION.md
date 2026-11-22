# Verificación de las noticias del 22/11/2026 (pase 1)

Veredicto: **conforme**. Las cinco noticias dicen lo que dicen sus fuentes,
las fechas son las de cada documento, las fotos encajan y no se repiten, y
todas van sin personas. No hace falta ninguna corrección.

Edición verificada: `editor/noticias-2026-11-22.json`, huella SHA-256
`9ea1490d0b04457a5f7a084553c59c60658b946c7bdeaf33d4f344bdf6155581`.

He abierto yo mismo cada fuente el 22/11/2026, entre las 01:38:03 y las
01:38:07 (hora UTC). Los tres PDF dan la misma huella que el inventario del
programa. Las dos páginas web dan otra huella en cada carga, porque son
dinámicas; he leído su texto visible entero.

| # | Noticia | Veredicto | Titular (es / en, caracteres) | Fecha | Foto |
| --- | --- | --- | --- | --- | --- |
| 1 | Kraken ofrece un token de Anthropic que no te da acciones | confirmada | 57 / 57 | 19/11 (sale a bolsa y empieza a negociarse) | `acciones-eeuu` |
| 2 | Oro y acciones sin folleto: tres avisos llegan de Alemania | confirmada | 58 / 55 | 18/11 | `alerta-fraude-3` |
| 3 | 9 firmas sin registro; dos imitan a firmas registradas | confirmada | 54 / 49 | 16/11 | `pago-online` |
| 4 | xStocks lanza tokens de más de 200 empresas europeas | confirmada | 52 / 54 | 11/11 | `bolsa-madrid` |
| 5 | Robinhood: el emisor podrá restarte Stock Tokens por costes | confirmada | 59 / 57 | 09/11 | `acciones-movil` |

## 1 · Kraken y el token ANTx (nueva)

- URL: https://www.kraken.com/es/ipo/anthropic
- Hora: 2026-11-22T01:38:03Z · HTTP 200 · SHA-256
  `4df15951cb5dc28677574ecd613775f3eea8864b491a9f94978ddc307dec57e6`
- Cita: «Anthropic listed on Nasdaq on Nov 19. Trade ANTx 24/5 alongside
  1,000+ xStocks. […] IPO xStocks are tokenized equities providing price
  exposure only — not direct ownership. […] xStocks are tokenized securities
  issued by Backed Assets (JE) Limited»
- Lo comprobado en la página: precio de salida 83,00 dólares por acción;
  negociación desde el 19/11 en el Nasdaq; solo exposición al precio, sin voto
  ni dividendos; lo emite Backed Assets (JE) Limited; en el EEE lo ofrece una
  firma del grupo autorizada por el supervisor de Chipre, con restricciones
  geográficas; precio de oferta más un 5 % de diferencial y «other fees may
  apply»; el valor puede bajar o subir. Todo lo que dicen el resumen y «por qué
  importa», en las dos lenguas, está en la página.
- Fecha: la página no tiene fecha de publicación; 19/11 es el día que la
  página da como salida a bolsa y primer día de negociación. No sale «Hoy».
- Foto: escritorio con monitores y gráficos genéricos (tema acciones
  tokenizadas). Encaja y no es de alarma. La portada de ayer llevaba otra.
- Observación, sin corrección: «token de Anthropic» podría leerse como un
  token que emite la propia empresa. Lo doy por bueno porque es el uso de la
  casa («tokens de más de 200 empresas europeas»), el titular añade «que no te
  da acciones» y el texto aclara «lo emite Backed, no Anthropic».

## 2 · Tres avisos de Alemania, uno de oro físico

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7bb0c4a848-4bd7-40b7-9b28-8f013ad97bc4%7d
- Hora: 2026-11-22T01:38:03Z · HTTP 200 · SHA-256
  `6b1d350e69c262faab5ab9ca1a14c88ce273f668b85909a1bac907da5f148820`
  (igual que la publicada)
- Cita: «BAFIN ha prohibido a Uniox Gold LLC la oferta al público de oro
  físico por no haber publicado EL FOLLETO INFORMATIVO O DOCUMENTO EQUIVALENTE
  REQUERIDO POR LA NORMATIVA DE VALORES»
- Son tres entidades, las tres del supervisor alemán: una prohibición (oro
  físico), una suspensión (acciones) y unos indicios (producto de inversión).
  La CNMV dice que su web «ofrece un buscador de entidades advertidas».
  Documento del 18/11/2026. Texto igual que el publicado.

## 3 · Nueve firmas sin registro, dos clones

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7bf3fcb37a-091d-4f8b-b217-60ba8b126e7e%7d
- Hora: 2026-11-22T01:38:06Z · HTTP 200 · SHA-256
  `d80481e506caff1bf39324084e323d5f9c79a271ff902ad92ae42d8600bbd355`
  (igual que la publicada)
- Cita: «La CNMV pone de manifiesto que dichas sociedades no figuran inscritas
  en el correspondiente registro de esta Comisión y, por tanto, no están
  autorizadas para prestar servicios de inversión»
- He contado las entidades de la lista: son 9. Dos llevan «(clon)»: una imita
  a una empresa de asesoramiento financiero y otra a una sociedad de capital
  riesgo, las dos registradas en España. Documento del 16/11/2026. Texto igual
  que el publicado.

## 4 · xStocks, más de 200 empresas europeas

- URL: https://xstocks.com/us/news/xstocks-brings-200-of-the-uk-and-eus-largest-companies-onchain
- Hora: 2026-11-22T01:38:07Z · HTTP 200 · SHA-256
  `5b177d27d69b1aad99acee91ffde27f973bc61ab48f1a198cba04fe682a6782f`
- Cita: «xStocks has launched its first regional markets, bringing tokenized
  equities for 200+ of the largest UK and EU-listed companies, and every
  constituent of the DAX 40. […] Each xStock is backed 1:1 by the underlying
  share but represents economic exposure only, not direct ownership.»
- La nota es del 11/11/2026 y dice además que se ofrecen en Kraken y en
  plataformas socias, que en la UE los ofrece una firma autorizada en Chipre y
  que «xStocks are not, nor will they be registered with any local securities
  regulators». El texto no ha cambiado frente al publicado; solo cambia la foto
  (`bolsa-madrid` en vez de `acciones-eeuu`, que pasa a la portada). La nueva
  es un horizonte de rascacielos genérico (tema bolsas y mercados): encaja y no
  engaña.

## 5 · Robinhood, el emisor podrá restar tokens por costes

- URL: https://cdn.robinhood.com/assets/robinhood/legal/rhj_base_prospectus_supplement_09_november_2026.pdf
- Hora: 2026-11-22T01:38:07Z · HTTP 200 · SHA-256
  `978eea67a47d5bb63f184a1efa419118166301ee94806e94f91f3fec710d29b9`
  (igual que la publicada)
- Cita: «the Issuer is permitted to pass on certain fees and costs charged to
  the Issuer in connection with an Underlying to Investors, which may include
  proportionately reducing the number of Products held by such Investors»
- Suplemento aprobado por la FMA de Liechtenstein el 09/11/2026; los cambios
  valen para los productos ya emitidos desde esa fecha; el folleto base de
  junio incluye a España entre los supervisores a los que pide notificar y ya
  preveía a la filial europea de Robinhood como participante autorizado. Texto
  igual que el publicado.

## Comprobaciones de toda la edición

- **Sin personas**: he leído entero cada titular, resumen, «por qué importa» y
  título informativo, en castellano y en inglés, y cada cita. Solo salen
  empresas, organismos y productos. La nota de xStocks cita a un directivo,
  pero la edición no lo recoge.
- **Titulares**: todos de 60 caracteres o menos en las dos lenguas, sin punto
  final, sin «¡» ni «!» y sin las palabras de promesa o exageración de la guía.
- **Fotos**: cinco distintas, todas de la biblioteca y del tema de su noticia;
  el rojo de alarma solo va en un aviso.
- **«Hoy»**: ninguna noticia es de hoy ni de ayer, y ninguna se presenta así.
- **Lo que falta**: el barrido de hoy (CNMV, ESMA, BOE, Consejo, BCE, EBA y
  Comisión) no trae nada del 21/11 ni del 22/11; el BOE no tiene edición hoy.
  No echo nada en falta.
- **Lo que sale**: la noticia de Bit2Me STX (28/10), la más antigua, deja la
  edición para hacer sitio a la de Kraken.

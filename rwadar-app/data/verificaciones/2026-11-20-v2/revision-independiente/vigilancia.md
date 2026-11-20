# Revisión independiente · grupo «vigilancia» · 20/11/2026

Revisor independiente (no preparó los expedientes). Fuentes abiertas hoy por mí
entre las **17:04 y las 17:07 UTC**. Extractos (sin nombres de personas) en
`fuentes/vigilancia/extractos-2026-11-20.txt`; los HTML y PDF completos, en
disco y fuera de Git; las respuestas de API y de cadena, en
`fuentes/vigilancia/crudo/` (fuera de Git).

**Veredicto global: aprobado.** La única ficha que cambia (Hausera · próximas
ofertas) se sostiene en la fuente de hoy. Las 7 candidatas siguen sin admitirse
y la fuente de hoy lo respalda. No hay correcciones obligatorias.

## 1. Hausera · próximas ofertas (publicada, «actualizar») · confirmado

Cambios críticos comprobados:

- **Estado de Alicante 3: «PREVENTA ABIERTA».** https://hausera.io/propiedad/alicante_3/
  y https://hausera.io/oportunidades/ (17:05 UTC): «Alicante 3 | PREVENTA
  ABIERTA | CRV | Importe a financiar: 5.196.000€ | Inicio de preventa:
  18/11/2026 | Inicio de oferta pública: 25/11/2026». Hay un botón «Reservar
  tickets» y ninguna cifra de lo reservado. Los datos públicos
  (`/page-data/propiedad/alicante_3/page-data.json`, 17:04 UTC) dicen
  `"status": "PRESALE"`, `presaleDate 18/11/2026` y `startDate 25/11/2026`,
  con **el mismo SHA-256 que el investigador** (f95e3a75…). Alicante 2
  (8e94a545…) y Oportunidades (f9913b84…) también coinciden. Alicante 2
  sigue `FUNDED` / «FINANCIADA».
- **0 tokens en Alicante 3.** En Polygon (publicnode, 17:05:17 UTC),
  `totalSupply` del contrato con nombre «Alicante_3» da 0; el de «Alicante_2»
  da 51.960 tokens.
- **Sin inscribir en la CNMV.** ERIR de Ursus-3
  (https://www.cnmv.es/portal/consultas/esi/erir_esi?nif=A86796182&lang=es
  y páginas 1 a 3, 17:04 UTC): 23 emisiones. De Hausera hay 8 (SPV, SPV 2 a
  SPV 8) y la última es del 23/10/2026 (SPV 7 y SPV 8). No aparecen ni la
  SPV 9, ni la 10 ni la 11. El aviso «El 20/11/2026, con la preventa ya
  abierta, Alicante 3 aún no estaba inscrita…» está respaldado.
- **Documentos.** El documento de emisión de Alicante 3 (Drive
  1cpWVN3J…, 9170562a…) y el acuerdo de reserva con la escritura (Drive
  1vfq0Ljr…, 69cbadaf…) tienen hoy, a las 17:05 UTC, **el mismo SHA-256**. En
  el documento siguen «Ticket mínimo: 100,00 euros» y «El periodo de
  suscripción se iniciará el 25/11/2026 y se extenderá hasta el 30/6/2027»,
  que respaldan la métrica «Próxima operación».
- **Advertencias de la CNMV** (marcadas `segunVigia`; abiertas hoy a las
  17:04 UTC): «Hausera» y «Holdtx» dan «No hay datos disponibles». En vigia.json
  están como «no cambia» (16:52 UTC). El SHA-256 de hoy no es el del vigía
  (la página de la CNMV cambia de bytes en cada carga: 212.203 bytes frente a
  211.370), pero el resultado es el mismo.

**Textos de la tarjeta:** mínimo 98, acceso 116 y salida 115 caracteres
(todos ≤ 120). Están en castellano llano, sin rentabilidad ni precio
principal (en camino) y con el respaldo de arriba. Se mantiene «en camino»,
lo que es coherente: la suscripción no empieza hasta el 25/11 y la emisión no
está inscrita.

Observaciones (no bloquean):
- La ficha de Alicante 3 enseña hoy una «Promoción especial»: un 0,5 % extra
  para quien invirtió en Alicante 2. No está en la tarjeta, y está bien así.
- La tarjeta vale 7 días (hasta el 27/11) y la suscripción empieza el 25/11.
  El resumen dice «la suscripción empieza el 25/11/2026»: a partir del 25/11
  conviene reescribirlo, o volver a mirarlo ese día, como ya anota el
  expediente.

## 2. Candidatas (todas «no_admitir») · confirmadas

- **Prosegur Cash · pagarés tokenizados.** ERIR de Minos (17:05 UTC): solo
  «06/11/2026 | PROSEGUR CASH, S.A. … “1ª Emisión de Pagarés Prosegur Cash
  2026” por importe de 500.000 euros». En la lista de ISIN de la CNMV
  (nif=A87498564) aparece «ES0505229338 | CASH/PAG 20270520 | 3.300.000,00 |
  18/11/2026 | 20/05/2027 | 100.000,00 | EUR». Es un pagaré convencional con
  un nominal de 100.000 €, igual que los demás de su programa. Sigue sin
  documento ni oferta. La advertencia «Prosegur» (`segunVigia`) da «No hay
  datos disponibles» (17:04 UTC), igual que en el vigía.
- **Securitize Stocks.** La página, renderizada a las 17:07 UTC, tiene el
  **mismo texto** que la copia del investigador (diff vacío): «offered by
  Securitize Markets, LLC … to eligible investors in permitted
  jurisdictions». También dice «Available in the U.S., EU and other eligible
  markets» (el expediente ya lo recoge), pero no hay lista de países, ni KID,
  ni mínimo para España. No admitir está bien.
- **Profitus/Axiology · bonos.** API pública (17:06 UTC): `total` 551. Hay 7
  abiertos (`open_for_investments`), todos `loan_type: standard` (4 en
  Lituania, 1 en Letonia y 2 en España). Las páginas 2 a 12 no tienen ninguno
  abierto. No hay ningún bono abierto.
- **Valorix / Bit2Me STX.** valorix.com y valorix.com/invertir.html tienen
  **el mismo SHA-256** (5ae0d7ef…, b233b45d…). El blog de Bit2Me dice
  «previsto para diciembre de 2026». La ERIR de Bit2Me STX dice «No se han
  encontrado datos disponibles».
- **CANDO1 / Token City.** En exchange.token-city.com/es (17:05 UTC), dentro
  de «Próximamente», figura «CANDO1 | (CDO1) | En estudio». La ERIR de Token
  City solo tiene «06/11/2026 | SERIES A GRUPO UAE SA».
- **Crypto.com Tokenized Stocks (EEE).** La página de la FSMA (159.983 bytes,
  igual tamaño) sigue diciendo «Free provision of services by EEA investment
  firms … 07/05/2026» (Bélgica). Los tres PDF (condiciones, política de
  eventos corporativos y declaración de riesgos) tienen **el mismo SHA-256**
  (1169bff5…, 06d4eac0…, 8d5a498f…). Sigue sin KID público.
- **Hausera Alicante 3.** Comprobado en el punto 1: solo está en preventa y
  no está inscrita. Se sigue en la ficha publicada.

## 3. Muestreo de lo marcado con el vigía

Hay 3 datos con `segunVigia` en el grupo: las búsquedas de advertencias de la
CNMV de Hausera, Holdtx y Prosegur. Las abrí las tres. En vigia.json las tres
están como «no cambia». El resultado de hoy coincide («No hay datos
disponibles»), pero el SHA-256 no, porque la página de la CNMV cambia de bytes
en cada carga. No hay ningún dato `segunVigia` que esté «cambia», «no se pudo
leer» o fuera del vigía.

## 4. Datos personales

Las copias del grupo que van a Git (`grupos/vigilancia/fuentes/*/…txt`) están
recortadas. Por ejemplo, la portada de Hausera dice «co-CEO, [nombre
recortado]» y la EAFN nº 21 figura sin su nombre. Las copias con el nombre sin
recortar están en `fuentes/crudo/`, que `.gitignore` deja fuera de Git
(`grupos/**/crudo/`). En mis copias, las respuestas de API y de cadena están
en `crudo/` y los HTML están ignorados.

## Bloqueos

- No pulsé «Reservar tickets» ni hice ningún registro, así que no sé cuánto se
  ha reservado en la preventa.
- No reabrí la ayuda de Crypto.com, la ficha ESI de Ursus-3, la de la EAFN
  nº 21 ni la comunicación de «otra información relevante» de Prosegur Cash.
  Las descargué, pero no las comparé línea a línea.

## Correcciones obligatorias

Ninguna.

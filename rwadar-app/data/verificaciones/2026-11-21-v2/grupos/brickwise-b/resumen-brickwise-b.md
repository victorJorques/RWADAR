# Brickwise (grupo b) · puesta al día del 21/11/2026

Cinco fichas de reventa de Brickwise: Randhartingergasse 9 (Viena),
apartamento vacacional Hinterstoder 50, vivienda Pottendorfer Straße 62
(Wiener Neustadt), fotovoltaica GreenPoint y fotovoltaica Cohotel.
Consultas entre las 17:41 y las 17:54 UTC del 21/11/2026, con `curl` y
Playwright, sin sesión, sin cuenta y sin formularios. Partí del vigía
(17:36–17:37 UTC, base `2026-11-20.2-v2`), que daba las cinco como «no
cambia».

## En una frase

Las cinco siguen solo en reventa, con vendedores y con el mismo precio de
entrada que ayer. Lo nuevo es la respuesta a lo que pidió Víctor: **en
Randhartingergasse y Hinterstoder un residente en España sin número fiscal
austriaco no puede comprar hoy**, así que propongo retirarlas. En las otras
tres no hace falta ese número, pero sigue «sin confirmar» que la emisión se
venda en España.

## ¿Hace falta el número fiscal austriaco? (lo que pidió Víctor)

| Ficha | Tipo de producto | ¿Número fiscal austriaco para comprar? | ¿Puede comprar hoy un residente en España sin él? |
|---|---|---|---|
| Randhartingergasse 9 | Capital propio (`participationRightEquity`), sin etiqueta «KESt» | **Sí, obligatorio** | **No** |
| Hinterstoder 50 | Capital propio (`participationRightEquity`), sin etiqueta «KESt» | **Sí, obligatorio** | **No** |
| Pottendorfer Straße 62 | Capital ajeno (`participationRightDebtCapital`), etiqueta «KESt» | No | Sin confirmar (ver abajo) |
| GreenPoint | Capital ajeno, etiqueta «KESt» | No | Sin confirmar |
| Cohotel | Capital ajeno, etiqueta «KESt» | No | Sin confirmar |

De dónde sale (fuentes primarias de hoy):

- **Ayuda de Brickwise «Wie sind die Erträge zu versteuern?»**
  (`https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2`,
  17:42:41 UTC). Literal: «Investor:innen, deren Steuersitz nicht in
  Österreich liegt, und die in ein solches Eigenkapital-Produkt
  österreichischer Emittentinnen investieren möchten, können dies durch
  vorherige Bekanntgabe einer Steuernummer in Österreich tun. Sollte keine
  österreichische Steuernummer vorhanden sein, so kann diese beim
  österreichischen Finanzamt persönlich oder durch einen Steuerberater
  beantragt werden.» En llano: quien no tributa en Austria solo puede
  invertir en estos productos si **antes** da un número fiscal austriaco, que
  se pide a Hacienda de Austria en persona o con un asesor (Brickwise ofrece
  ponerte en contacto con uno sin coste). La misma página dice que ese número
  es «zwingend» (obligatorio) para la declaración de la comunidad de
  inversores y que la ganancia al vender paga en Austria el impuesto
  inmobiliario (ImmoESt).
- **Código público de la app** (`https://app.brickwise.at/js/app.85dda63a.js`,
  17:47:22 UTC, y `8388.098ec0ae.js`, 17:48:19 UTC; extracto en
  `fuentes/web/app-js-extracto-numero-fiscal-2026-11-21.txt`). Al pulsar
  comprar, también en reventa, en un producto de capital propio de una
  sociedad austriaca, si la cuenta no tiene número fiscal de Austria se abre
  el aviso «Bei diesem Produkt wird eine österreichische Steuernummer
  benötigt … Um in dieses Produkt investieren zu können, wird eine
  österreichische Steuernummer benötigt.» con dos botones: «Steuernummer
  hinzufügen» o «In ein anderes Produkt investieren». **La compra no sigue**
  hasta que se añade el número. Para vender no se pide. El mismo aviso dice:
  «Investitionen in Produkte, deren Einkünfte der Kapitalertragssteuer
  (KESt/KapEst) unterliegen, sind hingegen jederzeit möglich.» Es lectura
  del código, no una compra real (no se inicia sesión).
- **Ficha de cada emisión en la API** (17:42 UTC): Randhartingergasse y
  Hinterstoder son `participationRightEquity` con sociedad en Austria;
  Pottendorfer, GreenPoint y Cohotel son `participationRightDebtCapital`.
  Ninguna limita domicilios (`isAllowedDomicile: []`).
- **Mercado de la app** (17:44:40 UTC): Pottendorfer, GreenPoint y Cohotel
  llevan la etiqueta «KESt»; Randhartingergasse y Hinterstoder no.

Por qué las otras tres siguen «sin confirmar»: puedes abrir cuenta desde
España («Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten
kann einen Account eröffnen.», 17:42:41 UTC) y la app no te pone traba,
pero no consta que la emisión se comercialice en España: Effecta figura en la
CNMV en libre prestación (n.º 5003, solo recepción y transmisión de órdenes)
y la pestaña «Agentes» dice «No se han encontrado datos disponibles»
(17:49:37 UTC): Brickwise no está notificado como agente para España. Los
documentos están solo en alemán.

## Orden de venta más barata de hoy (API pública, 17:41:24 UTC)

Fuente: `https://api.app.brickwise.at/api/v1/assets` (órdenes abiertas),
contrastada con `lowestOfferPrice` de la v2 (17:41:25 UTC) y con «Preis pro
Anteil ab» del mercado de la app (17:44:40 UTC). Son exactamente los mismos
bytes que leyó el vigía (SHA-256 `edaee0fe…` y `b6d47201…`).

| Ficha | Venta más barata (cantidad) | Orden de 1 sola más barata (+1,5 %) | En venta | Mejor compra |
|---|---|---|---|---|
| Randhartingergasse 9 | 78,00 € (**20**, un solo lote, orden del 29/06/2026) | 1 a 85,00 € → 86,28 € | 188 | 64,00 € |
| Hinterstoder 50 | 75,00 € (**5**, un solo lote, 08/11/2026) | 1 a 82,00 € → 83,23 € | 252 | 20,00 € |
| Pottendorfer Straße 62 | 81,00 € (1, 15/11/2026) | 1 a 81,00 € → 82,22 € | 96 | 64,00 € |
| GreenPoint | 102,00 € (8, en órdenes de 5, 2 y 1) | 1 a 102,00 € → 103,53 € | 347 | 29,00 € |
| Cohotel | 110,00 € (**35**, en lotes de 31 y 4) | 1 a 120,00 € → 121,80 € | 59 | 3,00 € |

Todo igual que ayer. Ninguna de las ventas más baratas tiene hoy un
interesado con bloqueo activo (las fechas de bloqueo ya pasaron).

## Qué cambia frente a lo publicado

**Randhartingergasse 9 y Hinterstoder 50 → `retirar_propuesta`.** Sin número
fiscal austriaco no se puede comprar, y conseguirlo exige un trámite con
Hacienda de Austria; además las rentas y la venta tributan allí. Para el
inversor común en España no es comprable hoy. Si el coordinador prefiere
mantenerlas, dejo listo el «España: No»: «No, sin número fiscal austriaco la
app no deja comprar; hay que pedirlo antes en Austria.» y un aviso más claro
del número fiscal. (Ojo: el 20/11 el motor no dejaba montar un acceso que no
empiece por «Sin confirmar»; ver A21 en `../../2026-11-20-v2/decisiones.json`.)
En Randhartingergasse la API sigue diciendo que el inquilino se fue el
28/02/2026, y la ayuda «Was passiert bei einem Leerstand?» dice que mientras
esté vacía «keine Ausschüttungen erfolgen» (no hay repartos).

**Pottendorfer, GreenPoint y Cohotel → `actualizar`.**
- Acceso desde España, con el porqué más claro: «Sin confirmar: cuenta para
  residentes del EEE y sin número fiscal austriaco; no consta su venta en
  España.» (sigue empezando por «Sin confirmar»).
- Aviso nuevo, recomendado: Austria retiene impuesto (KESt) de cada reparto y
  quien vive en España declara aquí repartos y ganancias.
- GreenPoint y Cohotel: **quitar** «Distribuciones esperadas desde ·
  22/10/2026: 15/02/2024», una fecha de 2024 presentada como «esperada» (la
  app dice hoy 14.2.2024 en GreenPoint). El plazo «hasta el 31/12/2038» pasa a
  citar la KID («Beendigungszeitpunkt: 31.12.2038»); la app enseña
  30.12.2038 porque pinta la fecha en hora UTC. Aviso de subordinación más
  preciso (cláusula 9.2 del contrato), recomendado.

**En las cinco (fechas viejas que confunden):**
- Mínimo: misma cifra con la fecha de hoy, «Desde X € la participación en
  reventa (21/11)». La fecha es el día en que se vio el precio.
- «Destino de consulta comprobado» decía 30/09/2026 (con la errata
  «el30/09/2026»): pasa a 21/11/2026.
- «Moneda · 22/10/2026», «Plazo · 22/10/2026» y todas las «· consulta
  01/11/2026» pasan a 21/11/2026 con su fuente de hoy (los PDF, con el vigía:
  mismo SHA-256).
- «Mínimo de inversión · consulta 01/11/2026: Mindestzeichnungsbetrag EUR
  100,xx» es el mínimo de la **emisión original, cerrada** (2022–2024). Al
  lado del mínimo de reventa se lee como el de hoy: propongo llamarlo «Mínimo
  de la suscripción original (cerrada)». Igual «Precio» → «Precio de emisión
  original».
- Referencia nueva en cada ficha: «Número fiscal austriaco · 21/11/2026».
- Recomendado (no aplicado), en Randhartingergasse, Hinterstoder y Cohotel:
  el precio más bajo solo se vende en lotes; una sola participación cuesta
  desde 85 €, 82 € y 120 €. Alternativa con el formato de las Normas: «1
  participación desde 120 € en reventa (21/11)».

Todo está en `expedientes/<slug>.json`: `cambiosRespectoPublicado`,
`revisionAvisos` (cada aviso publicado, vigente o con texto nuevo) y
`referenciasConFechaVieja` (cada referencia de la ficha con su acción).

## Lo que no cambia (con la consulta de hoy)

- **Documentos** (contrato, KID, Kosteninformationen y Rücktrittsbelehrung):
  mismo SHA-256 que lo publicado según el vigía (17:36:56–17:37:02 UTC); van
  con `segunVigia: true`. Los cinco «Informationsblatt», que el vigía no
  cubre, los descargué hoy (17:51:45 UTC): mismo SHA-256 que el 20/11.
- **Fichas de la API por emisión:** las cinco, iguales byte a byte que el
  20/11 (textos de alquiler, garantía y plazo).
- **Ayudas e Impressum:** «Kann ich einen Account…» y «Wie funktioniert der
  Handel…» con el mismo SHA-256; Impressum igual.
- **Registros:** BaFin, Effecta GmbH (BaFin-ID 10133261, Anlagevermittlung y
  Anlageberatung desde 26.06.2021) y Brickwise Investment GmbH, agente
  vinculado n.º 80174029, «Tätig ab 04.08.2021», sin baja, datos a 20.11.2026.
  CNMV: Effecta n.º 5003, solo recepción y transmisión de órdenes, sin
  agentes. La dirección vieja de la CNMV (`…ESISExtranjerasLP.aspx`) redirige
  ahora (301) a `…/portal/Consultas/ESI/ESISExtranjerasLP`; el contenido es
  el mismo.
- **Advertencias de la CNMV** (Brickwise, Effecta, Brick Sagarmatha, Brick
  Qogir, Green-Point y Cohotel): sin coincidencias; re-fechadas con el vigía,
  cuya búsqueda de control («Trading») sí da resultados.
- **Salida y desistimiento:** sin cambios.

## Bloqueos

- FMA (Austria): la base de empresas responde 200 pero el HTML estático no
  trae resultados (17:53:54 UTC); no insistí. Vale la lectura del 11/11.
- Firmenbuch (de pago): no consultado; los FN salen de los contratos.
- Si se puede comprar solo una parte de una orden: ninguna fuente pública lo
  dice.
- Número fiscal: leído en la ayuda y en el código de la app, no comprobado con
  una cuenta (no se inicia sesión).
- Randhartingergasse: `availableBricks = 374` con la emisión cerrada desde
  2022 (la app enseña «Verfügbare Anteile 374»); sigue sin explicación.

## Decisión por ficha

| Ficha | Decisión |
|---|---|
| `randhartingergasse-9-viena` | `retirar_propuesta` (sin número fiscal austriaco no se puede comprar desde España) |
| `apartamento-vacacional-hinterstoder-50` | `retirar_propuesta` (mismo motivo) |
| `vivienda-pottendorfer-stra-e-62-wr-neustadt` | `actualizar` |
| `fotovoltaica-greenpoint` | `actualizar` |
| `fotovoltaica-cohotel` | `actualizar` |

Copias: `fuentes/web/` (textos), `fuentes/reguladores/`,
`fuentes/libro-ordenes-resumen-2026-11-21.json` y `fuentes/crudo/` (crudos,
JS, PDF y capturas; fuera de Git). Inventario en `inventario-consultas.json`.

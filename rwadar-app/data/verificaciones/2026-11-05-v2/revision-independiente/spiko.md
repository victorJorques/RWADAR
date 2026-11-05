# Revisión independiente · grupo spiko · 05/11/2026

Revisor independiente; no preparé estos expedientes. Abrí yo mismo las fuentes
primarias entre las **08:22 y las 08:30 UTC del 05/11/2026**, después del
investigador (08:01–08:20). Solo páginas, documentos, API y registros públicos:
sin sesión, sin KYC, sin tocar expedientes, git, Supabase ni nada publicado.

Copias de lo leído: `fuentes/spiko/` (inventario con URL, hora, código HTTP,
tamaño y SHA-256 en `fuentes/spiko/inventario-revisor.json`). Las respuestas
crudas de API (Spiko, GECO, ESMA) están en `fuentes/spiko/crudo/`, fuera de Git.

## Veredicto en una frase

**Aprobado con cambios menores.** Las tres cifras nuevas son correctas y las
he recalculado yo: Euro 2,39 %, Dólar 3,99 % en USD y Spiko Euro 2,84 % (las
tres con valor liquidativo del 04/11). Los documentos son idénticos byte a byte,
los avisos siguen vigentes y el pendiente de España de Spiko Euro sigue sin
resolverse (nadie lo confirma ni lo niega). Solo hay dos correcciones de
registro, ninguna cambia una cifra.

## 1. Cambios críticos: las cifras

### Spiko Letras del Tesoro Euro: 2,34 % → 2,39 % · confirmado

- API de Spiko, `https://public-api.spiko.io/v0/share-classes/EUTBL/yield`
  (08:22:25Z): `"monthlyYield":"0.0239"`, `"updatedAt":"2026-11-04T16:33:40Z"`.
- Valor liquidativo, `…/net-asset-values/EUTBL/latest` (08:22:26Z):
  `"day":"2026-11-04"`, `1.062242 EUR`.
- Lo recalculé con la serie de valores liquidativos
  (`…/net-asset-values/EUTBL?startDay=2026-09-20`, 08:22:36Z):
  1,060109 (fechado 04/10) → 1,062242 (04/11), 31 días, capitalizado =
  **2,3949 %** (Spiko trunca a 2,39). Igual que el investigador.
- Web en español, `https://www.spiko.io/es/spiko-letras-del-tesoro-euro`
  (08:22:54Z): «2,39% · Rendimiento neto actual» y «Rentabilidades netas
  anualizadas (después de comisiones) de los últimos 31 días».
- `https://data.spiko.io/eutbl/` (08:22:57Z): «30d yield 2.39%».
- AMF GECO, `…/back-office/funds/lastVl/FR001400ODL1` (08:24:34Z):
  `valuationDate 2026-11-04`, `netAssetValue 1.06224`; la página pública
  `geco.amf-france.org/produit-d-epargne/c79399` (Playwright, 08:28:52Z):
  «Dernière valeur liquidative connue au 04/11/2026 : 1.06224 €», «Statut :
  Vivant».

La métrica «Rentabilidad publicada · 31 días · 04/11/2026: 2,39 %» y el
literal «publicado por Spiko el 04/11/2026 (VL del 04/11/2026); consultado el
05/11/2026» son correctos.

### Spiko Letras del Tesoro Dólar: 3,95 % → 3,99 % en USD · confirmado

- API `…/share-classes/USTBL/yield` (08:22:26Z): `"monthlyYield":"0.0399"`,
  `"updatedAt":"2026-11-04T15:57:25Z"`; VL `1.101837 USD` del 04/11 (08:22:27Z).
- Recalculado con la serie (08:22:37Z): 1,097946 (02/10) → 1,101837 (04/11) =
  **3,9904 %**. Como no hay VL del 03 ni del 04/10 (fin de semana), el tramo
  real es de 33 días; Spiko lo llama «últimos 31 días» y así lo dice la web.
  El literal de la ficha repite lo que publica Spiko: correcto.
- Web en español (08:22:55Z): «3,99% · Rendimiento neto actual»;
  `data.spiko.io/ustbl/` (08:22:57Z): «30d yield 3.99%».

### Spiko Euro (Smart Cash): 2,84 % con fecha nueva · confirmado

- API `…/share-classes/eurSAFO/yield` (08:22:27Z): `"dailyYield":"0.0284"`,
  `"weeklyYield":"0.0284"`, `"monthlyYield":"0.0284"`;
  `previousYieldTimestamp` = 04/11/2026 16:13:53Z. Ojo: el `updatedAt` de este
  endpoint es la hora de cada petición (08:22:27Z hoy), no la del dato; la
  fecha válida es la del valor liquidativo.
- VL `1.016485 EUR` del 04/11 (08:22:28Z). Recalculado: 1,016407 (03/11) →
  1,016485 (04/11), un día pasado a un año = **2,8405 %**. Coincide con el
  literal de la ficha («lo que creció el fondo en su último día de cálculo,
  pasado a un año»).
- Web en español, `https://www.spiko.io/es/spiko-euro` (08:22:55Z): «2,84% ·
  Rendimiento neto actual»; `data.spiko.io/safo-eur` (08:22:57Z): «30d yield
  2.84%».
- €STR del BCE,
  `https://data-api.ecb.europa.eu/service/data/EST/B.EU000A2X2A25.WT?lastNObservations=8&format=csvdata`
  (08:24:47Z): 04/11/2026 = **2,442 %**. La cifra queda 0,40 puntos por
  encima, como dice el investigador.

Spiko recalcula hoy: `nextYieldTimestamp` = 05/11 18:00:00Z (Euro y Dólar) y
19:30:00Z (Spiko Euro). La ficha lleva la fecha del dato (04/11), así que no
caduca por eso.

## 2. Lo que el investigador dice «sin cambios» (comprobado)

Las tres fichas tienen cambio crítico (la cifra), así que no hay ficha entera
«sin cambios». Comprobé por muestreo todo lo que el investigador da por igual:

- **Documentos: idénticos.** SHA-256 de hoy (08:23:19Z–08:23:24Z) iguales a
  los de los expedientes y a los del 03/11: KID ES Euro `cb1a621d…`, KID ES
  Dólar `c1ce5400…`, KID ES Spiko Euro `53effea2…`, folleto EN `7457e79f…`,
  folleto FR en GECO (doc 438274) `940559b4…`, certificado AMF `709e0585…`,
  términos v2.2 `71dd7ba1…`.
- **docs.spiko.io: idéntico byte a byte** (08:23:43Z–08:23:45Z): tabla de
  países `46152ac3…` («🇪🇸 Spain ✅ ✅ ✅ ❌», «Last updated: October 23,
  2026»), restricciones de alta `d8ecac72…` (España no figura), depósitos y
  retiradas `d38427dd…`, cambio de divisa `df59f6fb…`, fondos Smart Cash
  `6ba85433…`.
- **Folleto en español:** sigue en 403 (`AccessDenied`, 08:23:22Z).
- **Web Spiko Euro:** mi copia (08:22:55Z) tiene el mismo SHA-256 que la del
  investigador (`f6091a5f…`).
- **Clases de acciones:** la API tiene las mismas 14 clases que el 01/11 y que
  la copia del investigador. Cash & Carry (SPKCC / eurSPKCC) pide 120.000 USD
  / 100.000 EUR y docs.spiko.io dice «Spiko Cash & Carry is a professional
  fund». No hay producto nuevo para particulares. (No volví a abrir su ficha
  de la AMF como «Fonds dédié».)
- **Estado abierto:** GECO c79399 y c79398 «Vivant», «Tous souscripteurs»
  (API 08:24:28Z–08:24:29Z); VL diaria del 04/11 en las tres.

## 3. Avisos

**Euro y Dólar (2 + 2 avisos con dato):** siguen vigentes.
- KID ES: «El capital no está garantizado» (los dos).
- Folleto EN, apartados 3.2.1 (US) y 3.2.2 (EU): «the management company may
  trigger the redemption cap when a threshold of 10% of net assets is reached».
- KID ES Dólar: «Atención al riesgo de cambio … la ganancia final dependerá del
  tipo de cambio entre ambas monedas».

**Spiko Euro (7 avisos):** los siete siguen vigentes hoy.
- Web ES (08:22:55Z): «Interés a tipo fijo | 2,84% | Garantizado por
  contrapartes»; «rendimiento diario garantizado»; «Sociedad gestora | Amundi
  Asset Management»; «BNP Paribas paga €STR + 0,40%».
- KID ES Spiko Euro: «Productor de este producto: TWENTY FIRST CAPITAL»;
  «No existe rentabilidad mínima garantizada. Podría perder la totalidad o
  parte de su inversión.»; corte «a más tardar a las 15:00 (hora de París)».
- Folleto FR (GECO 438274), compartimento SAFO: «seuil de 25 % de l’actif
  net» y «le règlement intervient en J+1».
- Página Particulares (08:22:56Z): «No existen límites de retirada.»
- Enlaces de la web Spiko Euro: «Verificar la aprobación» →
  `cdn.spiko.finance/legal_docs/EN/SAFO_Letter_EN.pdf`; «Verificar la
  autorización» → `geco.amf-france.org/produit-d-epargne/c124199`, que hoy
  sale vacía («Aucune part disponible.», Playwright 08:28:58Z; API
  `"published":false`, igual que el código inexistente c999999991). Hay un
  tercer enlace «Verificar la autorización» a la CNMV, ficha de Spiko Finance
  (n.º 5325): es la empresa, no el fondo. El aviso 7 sigue siendo cierto.

## 4. El pendiente de España de Spiko Euro

Intenté rebatir «nadie lo confirma ni lo niega». No lo consigo:

- CNMV, `https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0401205J&lang=es`
  (08:24:00Z): «SPIKO SICAV | 2380 | 30/01/2026 | SICAV | FRANCIA», solo
  «Datos generales» y «Entidades comercializadoras» (vista 18, 08:24:01Z:
  «ALDANA CAPITAL, SOCIEDAD ANONIMA AGENCIA DE VALORES»). Las vistas 1, 2, 17 y
  19 dan error 400 (08:28:02Z–08:28:04Z). No hay lista de compartimentos.
- CNMV, Aldana Capital (n.º 280, 06/04/2018), 08:24:05Z: «SPIKO SICAV» entre
  sus IIC extranjeras, sin desglose.
- Web de Aldana (08:26:03Z): no aparece «Spiko»; se dirige a «Inversores
  Institucionales/Profesionales».
- AMF GECO: c124199 sin publicar; `lastVl/FR0014015LD3` vacío (08:24:36Z).
- ESMA (08:25:57Z): ninguna entrada «Spiko»; la base solo tiene 1.236 fondos
  domiciliados en Francia (08:25:53Z), así que no prueba nada.
- Spiko, tabla de países (08:23:43Z): «Spain ✅» en Smart Cash. La misma
  página dice: «A share class created later needs its own registration before
  it can be distributed there».

**Dato que refuerza el aviso:** el certificado de la AMF que lista el
compartimento SAFO (SCV20260075) es del **23/02/2026**, posterior a la
inscripción de la SICAV en la CNMV (**30/01/2026**). Y Spiko UK T-Bills
(SCV20250464, de 2025) ya existía el 30/01/2026 pero sale «❌» para España.
Es decir, la inscripción de la SICAV no demuestra por sí sola qué
compartimentos se pueden vender aquí. El aviso 2 es correcto y no hay base
para quitarlo ni para proponer la retirada.

## 5. Los tres datos de la tarjeta (≤ 120 caracteres)

Las tres fichas son principales, así que pueden llevar rentabilidad.

| Ficha | Dato | Texto (caracteres) | Respaldo de hoy | Veredicto |
|---|---|---|---|---|
| Euro | mínimo | «Desde 1 € (clase EUTBL)» (23) | web «Depósito inicial mínimo €1»; API `minimumInitialSubscription "1"`; folleto FR «FR001400ODL1 … 1 EUR» | correcto |
| Euro | acceso | «Sí, para particulares residentes en España, tras el alta y la verificación de identidad (KYC).» (94) | tabla de países; KID «todo tipo de inversores»; CNMV n.º 2380 | correcto (ver nota) |
| Euro | salida | «Reembolso cada día hábil, pidiéndolo antes de las 11:30 (París); puede limitarse si se pide más del 10 % del fondo.» (115) | KID ES «a más tardar a las 11:30 (hora de París)»; folleto 3.2.2 «10% of net assets» | correcto |
| Dólar | mínimo | «Desde 1 dólar (clase USD); si ingresas euros, Spiko los cambia a dólares.» (73) | web «$1»; docs «When you deposit euros into a USD or GBP product, your funds are automatically converted» | correcto |
| Dólar | acceso | igual que Euro (94) | tabla de países (columna T-Bills Dollar ✅) | correcto (ver nota) |
| Dólar | salida | «Reembolso diario en días hábiles de Francia y EE. UU., antes de las 11:30 (París); puede limitarse (10 % del fondo).» (116) | KID ES 11:30; folleto 3.2.1 «public holidays in France or the United States … following business day» y «10% of net assets» | correcto |
| Spiko Euro | mínimo | «Desde 1 €» (9) | web «€1»; folleto FR «FR0014015LD3 … 1 EUR» | correcto |
| Spiko Euro | acceso | «Según Spiko, sí para residentes en España tras alta y KYC; ningún registro público confirma este fondo aquí.» (108) | tabla de países + comprobaciones del punto 4 | correcto, **pero es un texto nuevo** (ver corrección 1) |
| Spiko Euro | salida | «Reembolso diario: orden antes de las 15:00 (París) y abono al día hábil siguiente; puede limitarse (25 % del fondo).» (116) | KID ES 15:00; folleto FR «J+1» y «25 %» | correcto |

Todos en castellano llano y por debajo de 120 caracteres. Los de Euro, Dólar y
el mínimo y la salida de Spiko Euro son idénticos a los del 03/11.

**Nota (no obligatoria) sobre «Sí» en Euro y Dólar:** el expediente de Euro
añade como prueba «este compartimento existía cuando se inscribió la SICAV».
Eso no prueba nada: UK T-Bills también existía y no se puede vender en España.
El «Sí» se apoya en la tabla de Spiko, el KID y la ausencia de pruebas en
contra, como ya se publicó. No pido cambiar la tarjeta; sí quitar esa frase
como prueba en el expediente o en la documentación.

## 6. Correcciones de la documentación que propone el investigador

- **Dólar, «Precio · consulta 01/11/2026»:** confirmo que hay que corregirla.
  GECO `lastVl/FR001400ODM9` (08:24:35Z): `netAssetValue 0.97858`,
  `quotationCurrency "USD"`, `netAssetValueInCurrency 1.10184`; la página
  pública c79398 (08:28:46Z) muestra «0.97858 €». Es la clase en dólares
  pasada a euros. La clase EUR (`FR001400SBD3`) vale **1,01881 €** (08:24:35Z).
  La frase publicada («corresponde a la clase EUR no cubierta») es falsa.
- **Euro, referencias antiguas:** confirmo que siguen publicadas (NAV 1,0597 €
  del 28/09, 1,0613 € y 467,94 M€ del 22/10, 444,52 M€ del 30/10). Se pueden
  quitar o marcar como históricas.
- **Spiko Euro, «Rendimiento neto publicado»:** fecha del dato 04/11 y consulta
  05/11. Correcto.
- **Plataforma «spiko»:** su texto de acceso aún dice «No hemos comprobado en
  la CNMV que el fondo se comercialice en España». Hoy la CNMV muestra SPIKO
  SICAV (n.º 2380, 30/01/2026, Aldana Capital comercializadora, 08:24:00Z) y
  Spiko Finance como empresa de servicios de inversión en libre prestación
  (n.º 5325, 14/01/2026, «Recepción y transmisión de órdenes … Participaciones
  y acciones en instituciones de inversión colectiva», 08:24:04Z). Ver
  corrección 2 para la redacción.

## 7. Conflictos que siguen (sin efecto en la tarjeta)

- Dólar, valor liquidativo de ejecución: KID ES «último valor liquidativo
  conocido»; API `/funds` USTBL `executionMethod "unknownNAVs"` (08:22:39Z),
  EUTBL `knownNAVs`. Confirmado.
- Dólar, mínimo de la clase EUR: API `eurUSTBL` `minimumInitialSubscription
  "1000"`. La tarjeta usa la clase USD (1 $). Confirmado.
- Spiko Euro, tamaño: API 1.669,42 M€ (08:22:27Z) frente a web «€2.203 M».
  No se publica.

## 8. Bloqueos

- Folleto en español: 403 `AccessDenied` (08:23:22Z). Usé el inglés de Spiko y
  el francés de GECO, los dos del 01/09/2026.
- REGAFI (ACPR): curl cortado por el proxy (`Connection reset by peer`,
  08:26:08Z). Lo leí con WebFetch hacia las 08:26:30Z, sin copia local:
  España, «Libre prestation de services», `date_debut 2026-01-08`, A1:C3;
  auxiliares B2:C3 y B4:C3 desde 16/06/2026; sin campo de retirada. Sin
  cambios.
- La CNMV no tiene búsqueda pública por ISIN ni vista de compartimentos
  (`/portal/consultas/busqueda?qS=…` da error 400, 08:28:13Z–08:28:16Z).
- No volví a abrir la ficha de Cash & Carry en la AMF.

## 9. Correcciones obligatorias

1. **Spiko Euro, texto de «Acceso desde España».** Lo publicado hoy dice
   «Disponible para particulares residentes en España según Spiko, tras el alta
   y la verificación de identidad (KYC)». La propuesta lo cambia a «Según
   Spiko, sí para residentes en España tras alta y KYC; ningún registro público
   confirma este fondo aquí.», pero el cambio no está en
   `cambiosRespectoPublicado`. El texto nuevo es correcto y más claro. Hay que
   anotarlo como cambio (no crítico) o mantener el publicado; no puede entrar
   sin registrar.
2. **Plataforma «spiko».** Al corregir el texto, no digas que «el fondo se
   comercializa en España» en general. Di lo que muestra la CNMV: SPIKO SICAV
   inscrita (n.º 2380) con Aldana Capital como comercializadora, Spiko Finance
   inscrita (n.º 5325), y la CNMV no muestra qué compartimentos están dados de
   alta.

Recomendado, no obligatorio: en el expediente de Euro, no usar «este
compartimento existía cuando se inscribió la SICAV» como prueba (punto 5).
Internamente, `disponibleEs: "confirmado"` y `compraDesdeEspanaComoParticular:
"si"` de Spiko Euro no encajan con su claim `accesoEspana_registro:
"no_verificable"`. Es la decisión editorial ya publicada del 03/11; no la
reabro, pero conviene que quien seleccione lo sepa.

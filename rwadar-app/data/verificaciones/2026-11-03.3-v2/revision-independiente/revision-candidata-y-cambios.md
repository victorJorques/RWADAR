# Revisión independiente · Spiko Euro y cambios críticos · 03/11/2026

Revisor independiente: no participé en la investigación de hoy. Abrí yo mismo
cada fuente entre las **10:42 y las 11:04 UTC del 03/11/2026**. Solo usé
páginas, documentos, API y registros públicos, y lecturas de cadena de solo
lectura (`eth_call`). No inicié sesión, no hice KYC, no rellené formularios de
alta ni conecté wallets. No sorteé bloqueos: `docs.midas.app` me devolvió un
desafío de Cloudflare y lo dejé así.

Cada copia está en `fuentes/`, con su hora, su código HTTP y su SHA-256 en
`fuentes/inventario-consultas.json`. Las respuestas de API, las de cadena, los
folletos con direcciones de contrato y las páginas con parámetros de enlace
están en `fuentes/crudo/`, que no entra en Git.

Todas las horas son UTC del 03/11/2026.

## Veredictos en una tabla

| Punto | Veredicto | En pocas palabras |
|---|---|---|
| **A. spiko-smart-cash-euro** | **rechazado** | Ningún registro de un supervisor muestra que este compartimento pueda venderse en España. Solo lo dice Spiko. |
| B. Spiko Letras Euro 2,35 → 2,34 % | confirmado | API y web: 2,34 % a 31 días con el valor liquidativo del 02/11. Yo lo recalculo en 2,345 %. |
| B. Spiko Letras Dólar 4,13 → 3,95 % | confirmado | API y web: 3,95 %. Yo lo recalculo en 3,9495 %. |
| B. Brickwise · Stallhofstraße, dos fechas | **corregir** | Hay dos fechas, pero la del campo es el **02/02/2022**, no el 01/02/2022. |
| B. Brickwise · Randhartingergasse, inquilino | confirmado | «gekündigt und endet am 28.02.2026. Es wird ein Nachmieter gesucht.» |
| B. Brickwise · Drautal a 70 € | confirmado | Precio de referencia 70 € y venta más barata 70 € (3 participaciones). |
| B. Brickwise · Pottendorfer, venta más barata 78 € | confirmado | 21 participaciones a 78 € (orden del 02/11/2026). |
| B. Brickwise · BILLA | confirmado | 82 suscritas, mínimo de 5.000 para emitir (de 6.404). Plazo vencido el 16/05/2026 sin prórroga publicada. 14 días para desistir. |
| B. Switzerlend · recompra | confirmado | La web dice que puedes revender al Brokerbot. En el contrato, esa función está apagada (`settings = 0x5`) y hay 0,03 ZCHF. |
| B. mF-ONE · lista blanca | confirmado | Sin pausa general y con lista blanca activa. Matiz: la suscripción por solicitud está pausada; solo funciona la instantánea. |
| B. Hausera Alicante 2 | confirmado | Preventa el 04/11/2026 a las 09:00 y oferta pública el 11/11/2026. La ficha pide sesión: no hay documento de emisión público. |
| B. Casa de Outeiro | confirmado | 1.121.000 € de un mínimo de 2.000.000 €, igual que el 01/11. La fecha de fin era el 31/10/2026 y sigue «en campaña». |

---

## A. Candidata spiko-smart-cash-euro (Spiko Euro, ISIN FR0014015LD3) · **rechazado**

### A.1 Punto decisivo: ¿se puede comercializar a minoristas en España?

**No consta en ningún registro de un supervisor.** Solo lo afirma el propio
Spiko.

- **CNMV, registro de IIC extranjeras.**
  - **Qué hay.** «SPIKO SICAV · Nº Registro oficial 2380 · 30/01/2026 · SICAV ·
    FRANCIA · IIC Sujeto a la directiva 2009/65/CE». La única comercializadora
    inscrita es «ALDANA CAPITAL, SOCIEDAD ANONIMA AGENCIA DE VALORES».
  - **Fuentes.**
    - Ficha: https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0401205J&lang=es (10:44:10)
    - Pestaña de comercializadoras: `…&vista=18` (10:44:26)
  - **Pestañas.** La ficha solo tiene dos: «Datos generales» y «Entidades
    comercializadoras». Probé las vistas 1 a 17 y 19 a 22, y todas dan «No ha
    sido posible completar su consulta» (10:45:06).
  - **No lista compartimentos.** Lo comprobé con tres SICAV que sí tienen
    compartimentos, y en ninguna aparecen:
    - AB SICAV I, n.º 444 (10:46:35);
    - AB SICAV III, n.º 2122 (10:46:37);
    - 2XIDEAS UCITS, n.º 2036 (10:46:38).

    Por tanto, en la web de la CNMV no se puede ver qué compartimentos están
    notificados.
  - **Buscador de la CNMV** (https://www.cnmv.es/portal/consultas/busqueda.aspx?id=34):
    - «SPIKO» (UCITS): un único resultado, la SICAV n.º 2380 (10:47:07);
    - «OVERNIGHT SWAP»: «No se han encontrado resultados» (10:47:22);
    - «TWENTY FIRST»: sin resultados (10:47:29);
    - «SPIKO» como FIA: sin resultados (10:47:36).
  - **Fechas.** La SICAV se inscribió el **30/01/2026**. El certificado de la
    AMF que incluye el compartimento SCV20260075 es del **23/02/2026**, y la web
    da como fecha de lanzamiento el **03/03/2026**. El compartimento es
    posterior a la inscripción. Para venderlo en España hacía falta una
    notificación propia, y no hay forma pública de verla.
- **ESMA, base central de comercialización transfronteriza** (Solr público
  `esma_registers_funds_cbdif`, actualizado el 03/11/2026).
  - «Spiko», con cualquier grafía: **0 resultados** (10:49:54).
  - Twenty First Capital tiene 10 fondos, ninguno de Spiko (10:49:55).
  - **No es concluyente.** Para la AMF solo hay 707 UCITS cargados (120 con
    España como país de acogida), y ni siquiera aparecen los compartimentos de
    Letras del Tesoro, que sí se venden en España (10:49:56).
- **AMF, GECO.**
  - **Ficha del compartimento** (https://geco.amf-france.org/back-office/funds/compartment/c124199,
    10:50:04): `{"idInterne":0,…,"published":false}`.
    - Participaciones: `[]`.
    - Último valor liquidativo de FR0014015LD3: respuesta vacía (10:50:06).
  - **Control con EU T-Bills** (c79399, 10:50:05): sale publicado, con
    «Tous souscripteurs», agrément SCV20240014 y valor liquidativo del 02/11
    de 1,0621.
  - **Folleto de la SICAV.** Para el compartimento solo hay el folleto de la
    SICAV (doc 438274, con efecto desde el 01/09/2026) y los estatutos
    (10:50:27).
- **Spiko, tabla de disponibilidad.**
  - **Fuente:** https://docs.spiko.io/documentation/product_overview/fund_availability
    (10:47:53; «Last updated: October 23, 2026»).
  - **Lo que dice:** «🇪🇸 Spain ✅» para Smart Cash. Y añade: «can be
    distributed … in every other country of the European Economic Area (EEA)
    where the share class has been registered».
  - **Es una fuente del emisor, no del supervisor.**
  - España no está en la lista de países excluidos del alta
    (https://docs.spiko.io/documentation/product_overview/onboarding_restrictions,
    10:51:14).
- **Web de Spiko Euro.** El enlace «Registrado · Comisión Nacional del Mercado
  de Valores (CNMV) · Verificar la autorización» lleva a la ficha de **Spiko
  Finance** como intermediario (ESI n.º 5325), no a la del fondo
  (https://www.spiko.io/es/spiko-euro, 10:43:44).
  - En la CNMV, Spiko Finance figura con el n.º 5325 desde el 14/01/2026 para
    «Recepción y transmisión de órdenes … Participaciones y acciones en
    instituciones de inversión colectiva»
    (https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp?tipo=CLP&numero=5325&vista=17&lang=es,
    10:53:39).
  - Eso acredita al intermediario, no la comercialización de este
    compartimento.

**Conclusión de A.1.** Con la regla del encargo («si no consta que se pueda
comercializar a minoristas en España, la candidata no se admite»), **no se
admite hoy**. El KID en español y la tabla de Spiko apoyan que se vende en
España, pero no son un registro del supervisor.

**Qué la desbloquearía.** Una de estas cuatro pruebas:

1. la CNMV confirma por escrito que FR0014015LD3 (o el compartimento
   SCV20260075) está notificado;
2. una certificación de la AMF de la notificación a España de ese
   compartimento;
3. la memoria de comercialización o la lista de compartimentos que da la
   comercializadora inscrita (Aldana Capital A.V.);
4. que el compartimento aparezca en GECO o en la base de ESMA.

### A.2 KID en español, aprobación de la AMF y folleto

- **KID en español**
  - **Fuente:** https://cdn.spiko.finance/legal_docs/ES/KID_eurSAFO_ES.pdf
    (10:50:28; mismo SHA-256 que la copia del grupo).
  - **Fecha:** «Este documento se ha publicado el 1 de septiembre de 2026».
  - **Qué es:** «SPIKO AMUNDI OVERNIGHT SWAP FUND es un compartimento de Spiko
    SICAV. Este compartimento está autorizado en Francia por la AMF». Lo
    produce TWENTY FIRST CAPITAL (GP 11000029). «Clasificación AMF: No
    aplicable»: no es un fondo monetario.
  - **Riesgo:** «indicador de riesgo 1 de 7». Plazo recomendado: 3 meses. El
    riesgo de contraparte de los swaps queda fuera del indicador.
  - **Capital no garantizado:** «El capital no está garantizado para los
    inversores» y «No existe rentabilidad mínima garantizada. Podría perder la
    totalidad o parte de su inversión».
  - **Escenarios a 3 meses con 10.000 €:** tensión 9.980 €, desfavorable
    9.990 €, **moderado 9.990 € (−0,10 %)** y favorable 10.100 €.
  - **Costes:** 0 € de entrada y 0 € de salida. «Gastos de gestión y otros
    gastos: 0,06 % del valor de su inversión» en 3 meses (6 € sobre 10.000 €).
- **Aprobación de la AMF (SCV20260075).**
  - **Certificado de la AMF:** fechado en París el 2026-02-23 y firmado por la
    Direction de la Gestion d'Actifs. Dice: «List of subfunds also covered by
    this certificate: SCV20260075 · SPIKO AMUNDI OVERNIGHT SWAP FUND».
  - **Dónde está:** es una copia que aloja Spiko, no la base de la AMF
    (https://cdn.spiko.finance/legal_docs/EN/SAFO_Letter_EN.pdf, 10:50:29).
  - **Folleto en la base de la AMF:** el folleto que publica la propia AMF en
    GECO incluye el compartimento (§3.2.4) con la clase EUR FR0014015LD3
    (https://geco.amf-france.org/back-office/document/download/438274, 10:50:27).
  - **Conclusión:** la autorización está respaldada, aunque **sin ficha
    pública en GECO** (ver A.1).
- **Folleto**
  - **Español:** **403 AccessDenied**
    (https://cdn.spiko.finance/legal_docs/ES/Prospectus_Spiko_SICAV_ES.pdf, 10:50:30).
  - **Francés (GECO) e inglés:** leídos (10:50:27 y 10:50:31). Ninguno
    menciona España ni los países donde se comercializa.

### A.3 La cifra del 2,84 % neto

- **Qué publica Spiko**
  - **API:** `dailyYield "0.0284"`, `weeklyYield "0.0284"`,
    `monthlyYield "0.0284"`
    (https://public-api.spiko.io/v0/share-classes/eurSAFO/yield, 10:42:52).
    - `previousYieldTimestamp` = 2026-11-02 18:58:32 UTC, la hora del valor
      liquidativo del 02/11.
    - `updatedAt` cambia en cada consulta, así que no indica la fecha del dato.
  - **Web en español:** «2,84% · Rendimiento neto actual · Rentabilidad neta de
    comisiones» (https://www.spiko.io/es/spiko-euro, 10:43:44).
  - **data.spiko.io:** «30d yield 2.84% · Annualised · Latest NAV 1.0163 ·
    2026-11-02» (https://data.spiko.io/safo-eur, 10:51:12).
- **Qué es exactamente.**
  - Es el **devengo diario del valor liquidativo, anualizado con
    capitalización y ya neto de comisiones**.
  - El valor liquidativo sube unos 0,768 puntos básicos al día. El del viernes
    ya incluye el sábado y el domingo.
  - Recalculado con la serie oficial
    (https://public-api.spiko.io/v0/net-asset-values/eurSAFO?startDay=2026-09-25,
    10:43:07):
    - 30/10 → 02/11 (un día de devengo): **2,841 %**;
    - 26/10 → 02/11: **2,831 %**;
    - 01/10 → 02/11 (32 días): **2,833 %**.
  - Por eso las tres cifras de la API coinciden. La etiqueta «30d» de
    data.spiko.io no describe el método.
- **Fecha del dato:** valor liquidativo del **02/11/2026** (1,016329). Si se
  publica, la etiqueta debe ser «· VL 02/11/2026», **no «· 03/11/2026»** como
  propone el expediente.
- **No es un tipo fijo: sigue al €STR.** El BCE publica 2,441 % para el 02/11
  (https://data-api.ecb.europa.eu/service/data/EST/B.EU000A2X2A25.WT?lastNObservations=6&format=csvdata,
  10:51:26). Eso da un margen neto real de unos +0,32 a +0,34 puntos.
- **Ese margen no coincide con ninguna versión publicada:**
  - KID: «neta al menos igual al … €STR + 0,50 %»;
  - folleto: «+ 0,50 %, diminuée des frais»;
  - docs.spiko.io: «€STR + 0.25%»;
  - web: el banco paga «€STR + un 0,40%».

  El objetivo no debe publicarse como cifra.

### A.4 «Tipo fijo garantizado» en la web frente al KID: **sí, la web promete lo que el KID niega**

| Web de Spiko (https://www.spiko.io/es/spiko-euro, 10:43:44) | KID en español (10:50:28) |
|---|---|
| «Interés a tipo fijo 2,84% · Garantizado por contrapartes · Pagado diariamente» | «No existe rentabilidad mínima garantizada. Podría perder la totalidad o parte de su inversión.» |
| «Spiko Euro recibe a cambio un rendimiento diario garantizado» | El swap paga «el indicador de referencia más un margen»: el €STR, que es variable. «Este riesgo podría no ser, en su caso, compensado por las garantías financieras recibidas.» |
| «Tu dinero siempre accesible · 100% liquidez nocturna» | «La sociedad gestora podrá implementar un mecanismo de limitación de reembolsos (denominado « Gates »)»: el 25 % del patrimonio, según el folleto. |
| «Sociedad gestora: Amundi Asset Management» | «Productor de este producto: TWENTY FIRST CAPITAL». Amundi es solo el gestor delegado, según el folleto de GECO. |

### A.5 Mínimo, comisiones, reembolso, límites y advertencias

- **Mínimo: 1 €.** Fuentes:
  - tabla de clases del folleto de GECO: «Action EUR FR0014015LD3 … 1 EUR · 1
    EUR · 1 EUR · Tous souscripteurs» (10:50:27);
  - API: `minimumInitialSubscription "1"`
    (https://public-api.spiko.io/v0/share-classes/eurSAFO, 10:42:53);
  - web: «Depósito inicial mínimo €1».
- **Comisiones**
  - **Folleto:**
    - «P1 Frais de gestion financière … 0,25% TTC»;
    - «P2 Frais de fonctionnement et autres services 0,10% TTC maximum»;
    - comisiones de suscripción y de reembolso: «Néant».
  - **KID:** 0,06 % en 3 meses.
  - **Web:** «La única comisión … 0,25%».
  - Las comisiones de red DLT corren por cuenta del inversor (folleto).
- **Reembolso** (folleto de GECO, §3.2.4, 10:50:27)
  - **Cada día:** las órdenes que llegan antes de las 15:00 (París) se
    ejecutan con el valor liquidativo del día: «S'agissant des rachats, le
    règlement intervient en J+1».
  - **Límite:** «le plafonnement des rachats peut être déclenché … lorsqu'un
    seuil de 25 % de l'actif net est atteint». Como máximo, durante 20 valores
    liquidativos en 3 meses.
  - **Retirada instantánea SEPA:** hasta 500.000 € al día, como servicio de
    Spiko Finance
    (https://docs.spiko.io/documentation/account_management/deposits_withdrawals,
    10:51:14).
  - **Conflicto:** la página «Particulares» dice «No existen límites de
    retirada» (https://www.spiko.io/es/usos-principales/particulares, 10:43:46),
    pero el folleto prevé el gate.
- **Advertencias de la CNMV**
  - «Spiko» y «Twenty First Capital»: «No hay datos disponibles» (10:53:06 y
    10:53:08). Fuente:
    https://www.cnmv.es/portal/ResultadoBusqueda?tipo=1&nombre=Spiko
  - Control: «Trading» devuelve 16 páginas de entidades advertidas (10:53:22).
- **Dato menor.** La dirección de Spiko Finance en la CNMV es «16, rue des
  Immeubles Industriels - 75011 París». La web dice «229 rue Saint-Honoré».

### Texto exacto de los cambios obligatorios de la tarjeta (si se vuelve a proponer con la prueba de A.1)

Hoy **no se publica**. Si en otro ciclo consta la notificación a España, la
tarjeta propuesta en `expedientes/spiko-smart-cash-euro.json` debe cambiar así:

1. `resumenTarjeta.accesoEspana`: «Sí, para particulares residentes en España,
   tras el alta y la verificación de identidad (KYC); compartimento notificado
   en la CNMV el [fecha y fuente]». Sin esa fuente, no se publica.
2. Métrica «Rendimiento neto actual · 03/11/2026» → **«Rendimiento neto actual
   · VL 02/11/2026»** (o la fecha del valor liquidativo de ese día).
3. `rentabilidad.literal`: «Rendimiento neto actual que publica Spiko: devengo
   diario del valor liquidativo del 02/11/2026, anualizado y neto de
   comisiones; consultado el 03/11/2026. Variable: sigue al €STR; no es un
   tipo fijo ni está garantizado.»
4. Métrica «Supervisor»: «AMF (compartimento SCV20260075; sin ficha pública en
   GECO) · SICAV inscrita en la CNMV, n.º 2380 (la CNMV no publica los
   compartimentos)».
5. Métrica nueva «Gestora»: «Twenty First Capital (gestión delegada en
   Amundi)».
6. Métrica «Reembolso»: «Diario, corte 15:00 (París), abono al día hábil
   siguiente; puede limitarse (25 %)».
7. Aviso 2, sustituirlo por: «No es una cuenta ni un depósito: el KID dice que
   no hay rentabilidad mínima garantizada y que puedes perder parte o toda la
   inversión, aunque la web de Spiko hable de «tipo fijo» «garantizado por
   contrapartes».»
8. Mantener los avisos 3 (contraparte), 4 (gate del 25 %) y 5 (sin ficha en
   GECO).

---

## B. Cambios críticos de las ofertas publicadas

### B.1 Spiko Letras del Tesoro Euro, 2,35 → 2,34 % · **confirmado**

- **API:** `monthlyYield "0.0234"` y `updatedAt "2026-11-02T17:06:40.879Z"`
  (https://public-api.spiko.io/v0/share-classes/EUTBL/yield, 10:42:51).
- **Web:** «2,34% · Rentabilidad neta de comisiones, calculada diariamente
  basándose en los últimos 31 días» (https://www.spiko.io/es/spiko-letras-del-tesoro-euro,
  10:43:45).
- **Mi cálculo:** del 01/10 (1,059941) al 02/11 (1,062097) da **2,3448 %**
  (serie oficial, 10:43:06). Spiko etiqueta el viernes 02/10 como «04/10», así
  que la base cubre 32 días naturales.
- **GECO:** el valor liquidativo del 02/11 es 1,0621, el mismo (10:50:06).
- **Métrica:** «Rentabilidad publicada · 31 días · **02/11/2026**».
- **Ojo:** la API recalcula hoy a las 18:00 UTC (`nextYieldTimestamp`), así que
  la cifra lleva la fecha del 02/11.

### B.2 Spiko Letras del Tesoro Dólar, 4,13 → 3,95 % · **confirmado**

- **API:** `monthlyYield "0.0395"` y `updatedAt "2026-11-02T17:06:32.644Z"`
  (https://public-api.spiko.io/v0/share-classes/USTBL/yield, 10:42:52).
- **Web:** «3,95% … últimos 31 días» (https://www.spiko.io/es/spiko-letras-del-tesoro-dollar,
  10:43:45).
- **Mi cálculo:** del 02/10 (1,097946) al 02/11 (1,101564), 31 días, da
  **3,9495 %**.
- **Métrica:** «Rentabilidad publicada · 31 días · 02/11/2026 · en USD».

### B.3 Brickwise (API pública y marketplace)

Fuentes:

- `https://bwrealestate.app.brickwise.at/api/v1/asset/<ISIN>` (10:54:18–10:54:20);
- `https://api.app.brickwise.at/api/v1/assets`, con el libro de órdenes
  (10:55:22);
- `https://api.app.brickwise.at/api/v2/assets` (10:54:17);
- el render público de https://app.brickwise.at/desktopWeb/marketplace
  (10:58:18).

Las fichas individuales de la app dan «404 · Diese Seite existiert zurzeit
nicht» sin sesión (10:56:09).

**Stallhofstraße 28 (AT0000A2WCD0) · corregir.** Las dos fechas existen:

- **Campo de la API:** `rentalDetails.contractEndDate = "2022-02-01T23:00:00.000Z"`.
- **Descripción:** «Die Wohnung ist seit Oktober 2021 befristet auf 5 Jahre
  vermietet. Der Mietvertrag wurde mit 01.03.2024 upgedatet. Das
  Mietverhältnis endet am 31.03.2027».

Pero el campo marca la medianoche de Viena del **02/02/2022**, no el
01/02/2022. La app muestra estas fechas en hora de Viena. Dos pruebas:

- en BILLA, `plannedFirstRentalIncomeDate = "2026-07-14T22:00:00.000Z"` sale en
  el marketplace como «Ausschüttungen erw. ab: **15.7.2026**»;
- `issueStartDate = "2026-02-15T23:00:00.000Z"` corresponde al «STAND:
  16.02.2026» del contrato.

**Texto correcto:** «La API da dos fechas de fin del alquiler (02/02/2022 y
31/03/2027); la rentabilidad no se muestra.»

- El resto se confirma:
  - venta más barata a 69,90 € (1 participación, orden del 01/11);
  - 313 en venta;
  - mejor compra a 30,00 € (1, orden del 01/07/2026).

**Randhartingergasse 9 (AT0000A2ZT84) · confirmado.**

- **Descripción de la API:** «Das Mietverhältnis wurde vom Mieter gekündigt
  und endet am 28.02.2026. Es wird ein Nachmieter gesucht.» (ficha con
  `updatedAt` del 16/10/2026).
- **Matices para el texto:**
  - el campo `contractEndDate` da una tercera fecha (30/06/2024);
  - el marketplace sigue mostrando «2,38 % p.a. Erw. laufende Ausschüttung» y
    «Erw. nächste Ausschüttung: 15.11.2026», como si hubiera inquilino.
- **Redacción más exacta (opcional):** «Según Brickwise, el inquilino
  rescindió y el alquiler terminó el 28/02/2026; se busca otro. La
  rentabilidad no se muestra.»
- **Libro de órdenes:** confirmado. Venta más barata a 78 €, con 21
  participaciones a ese precio (20 de una orden del 18/07 y 1 del 02/11); 184
  en venta; mejor compra a 40,50 € (10, del 22/04/2026).

**Drautalresidenz (AT0000A2YPQ0) · confirmado.**

- **API:** `sharePrice 70` (antes 67,80) y `lowestOfferPrice 70`.
- **Libro:** 3 participaciones a 70 € (orden del 18/10/2026) y 150 en venta.
- **Marketplace:** «Preis pro Anteil ab € 70,00».

**Pottendorfer Straße 62 (AT0000A324B4) · confirmado.**

- **API:** `lowestOfferPrice 78`.
- **Libro:** **21 participaciones a 78 €** en una orden actualizada el
  02/11/2026, y 127 en venta. La mejor compra es de 63 € (1, del 15/10).
- **Marketplace:** «ab € 78,00».

**BILLA (AT0000A3SE89) · confirmado.**

- **Suscripción:** `bricks 6404`, `availableBricks 6322` → **82 suscritas**.
- **Contrato** («Investitionsbedingungen», «STAND: 16.02.2026», copia en
  `crudo/`, 10:55:43):
  - «Mindestausgabemenge: 5.000» y «Gesamtnennbetrag: EUR 640.400,00»;
  - «Mindestzeichnungsbetrag: EUR 1.000,00» y «Zeichnungsfrist: 3 Monate».

  La métrica «82 de 5.000 participaciones necesarias» es correcta.
  - **Campo de la API sin explicar:** `issueFundingFloor = 78076` no coincide
    con el contrato. Manda el contrato.
- **Plazo y prórroga**
  - **Fin:** `issueEndDate = issueEndDateOriginal = "2026-05-15T22:00:00.000Z"`,
    es decir, el 16/05/2026 en hora de Viena. **Sin prórroga en la API.**
  - **Prórroga posible:** el §4.3 del contrato permite alargar la
    suscripción «höchstens dem dreifachen der ursprünglichen Zeichnungsfrist».
  - **Sigue ofrecida:** el marketplace la mantiene en «Neue Objekte», con «1%»
    y «Mindestinvestition € 1.000,00».
- **14 días para desistir** (Rücktrittsbelehrung, «Stand: 10.07.2026»,
  https://storage.googleapis.com/brickwise_templates/assets/AT0000A3SE89/AT0000A3SE89_Ruecktrittsbelehrung.pdf,
  10:55:44):
  - «Du kannst von deiner Zeichnung … innerhalb von 14 Tagen ohne Angabe von
    Gründen zurücktreten». Es un derecho que da el emisor, no la ley.
  - «Die Rücktrittsfrist endet jedoch vorzeitig, … sobald die Emittentin die
    gezeichneten tokenisierten Wertpapiere an dich ausgegeben hat».
  - En la reventa no hay derecho a desistir.
- **Corrección al resumen del grupo (no a la tarjeta).** «Repartos desde el
  14/07/2026» debe ser **15/07/2026**: es lo que muestra el marketplace.

### B.4 Switzerlend · **confirmado**

- **Web de inversores:** «Kann ich meine Token später verkaufen? Du kannst an
  den Brokerbot zurückverkaufen, sofern dieser über genügend Liquidität
  verfügt» (https://www.lend.ch/de/investor-relations, 11:00:44; copia en
  `crudo/`).
- **Contrato** (código verificado en Sourcify, «exact_match», 10:59:59):
  - `BUYING_ENABLED = 0x1`;
  - `SELLING_ENABLED = 0x2`;
  - `KEEP_ETHER = 0x4`;
  - `sell()` hace `revert Brokerbot_SellingDisabled()` si falta el bit 0x2.
- **Lectura en cadena:** `eth_call` con https://ethereum-rpc.publicnode.com,
  bloque 26.333.836, a las 11:00:25.
  - `settings() = 0x5`: se puede comprar al emisor y **la recompra está
    desactivada**;
  - el saldo en ZCHF del contrato es **0,0318**;
  - el contrato tiene **57 LENDS** para vender;
  - `getPrice()` = 68,0105 ZCHF.
  - Comprobé los símbolos de los tokens a las 11:00:54: la moneda base es ZCHF
    y el token es LENDS.

### B.5 mF-ONE · **confirmado, con un matiz**

- **Contratos.** El vault de emisión 0x4143…C3DE y el de reembolso 0x44b0…D19C
  son los de la tabla de docs.midas.app.
  - Esa página me dio un desafío de Cloudflare (11:01:14), así que usé la
    copia del grupo aktionariat-midas (`crudo/docs-llms-full.txt`, SHA-256
    aca8b6c7…, de las 10:19).
  - Lo comprobé en cadena: el `mToken()` de los dos vaults es el token mF-ONE
    0x238a…66Ba.
- **Lectura en cadena:** bloque 26.333.842, a las 11:01:42.
  - **Vault de emisión:**
    - `paused() = false`;
    - `greenlistEnabled() = true`, es decir, solo direcciones en lista blanca.
  - **Matiz:** `fnPaused(depositInstant) = false`, pero
    **`fnPaused(depositRequest) = true`**. Hoy solo funciona la suscripción
    instantánea; la suscripción por solicitud está pausada.
  - **Primer depósito mínimo:** `minMTokenAmountForFirstDeposit = 148.000
    mF-ONE` (11:02:00). Es un dato técnico, sin documento público.
  - **Vault de reembolso:** `paused() = false`, `greenlistEnabled() = true` y
    sin pausas por función.
- **Texto propuesto:** «El 03/11/2026 la suscripción estaba activa en Ethereum
  solo para direcciones en lista blanca (instantánea; la de solicitud,
  pausada)».

### B.6 Hausera Alicante 2 · **confirmado**

- **Página de oportunidades** (render de https://hausera.io/oportunidades/,
  11:02:10):
  - «MAÑANA A LAS 9:00 (ESP), PREVENTA DE ALICANTE 2»;
  - «Preventa: 04/11/2026 09:00h»;
  - «Importe a financiar: 5.196.000€»;
  - «Inicio de oferta pública: 11/11/2026».
- **Conflicto, confirmado.** El HTML que sirve la web (11:02:47) trae en el
  buscador la tarjeta «PREVENTA: 11/11/2026 09:00h · Alicante 2».
- **Sin documento público.** La ficha https://hausera.io/propiedad/alicante_2/
  solo muestra «Inicia sesión» (11:02:10).
- **Términos** (https://hausera.io/terms/, 11:03:01; copia en `crudo/`):
  - la preventa es una «manifestación de interés no vinculante»;
  - el «Documento de Emisión» se envía por correo después de manifestar ese
    interés.
- **Advertencias de la CNMV:** ninguna para «Hausera» ni «Holdtx» (10:53:16 y
  10:53:17).

### B.7 Casa de Outeiro · **confirmado**

- **API de Token City**
  (https://saas-pfp-base-api.token-city.com/v3/dashboard/issuance/slug/casa-de-outeiro/expand/…,
  11:03:16).
  - **Estado y cifras:**
    - `campaign_status "CAMPAIGN"`;
    - `campaign.end_date "2026-10-31"` y `extend_days null`;
    - `invested 1121000`;
    - `minimum_revenue_money 2000000` y `target_amount 3220000`.
  - **Sin cambios:** el SHA-256 es idéntico al de la copia del grupo de las
    10:13. La copia del 01/11 tiene los mismos valores.
  - **Texto del proceso:** «hasta completar suscripción, con fecha límite el
    31/10/2026 … se cancelará la financiación participativa y se reembolsarán
    las aportaciones».
- **Render de Alius** (https://aliuscap.com/projects/casa-de-outeiro, 11:03:39):
  «Campaña», «Días restantes --», «1.121.000,00 €», «2.000.000,00 €» e
  «Invertir».
- **Advertencias de la CNMV:** ninguna para «Alius» ni «Outeiro» (10:53:19 y
  10:53:21).

---

## Otros hallazgos (fuera de lo pedido)

- **Letras del Tesoro de Spiko (publicadas).** La métrica dice «inscrito en la
  CNMV para su comercialización, n.º 2380», pero ese número es de la SICAV. La
  CNMV no muestra compartimentos, igual que en A.1.
  - La diferencia con Spiko Euro es que estos compartimentos ya existían antes
    de la inscripción del 30/01/2026.
  - Además, Spiko marca ❌ el Pound para España, lo que encaja con una
    notificación por compartimento.
  - Propuesta, más exacta: «SICAV inscrita en la CNMV, n.º 2380».
- **Advertencias de la CNMV, sin coincidencias** (10:53:06–10:53:21):
  - Effecta, Brickwise, Switzerlend y Midas;
  - Hausera, Holdtx, Alius y Outeiro;
  - Spiko y Twenty First Capital.

## Bloqueos y límites

- La CNMV no publica qué compartimentos de una IIC extranjera están
  notificados. Es así para todas, como muestran los tres controles.
- La base de ESMA tiene una cobertura de la AMF incompleta.
- El folleto en español de Spiko da 403.
- docs.midas.app tiene desafío de Cloudflare. No lo sorteé.
- Las fichas individuales de la app de Brickwise dan 404 sin sesión. Para leer
  las fechas usé la API y el marketplace.
- En esta misma carpeta hay archivos de otra revisión (`kraken-xstocks.md` y
  `fuentes/kraken-xstocks/`). No son míos y no los he tocado.

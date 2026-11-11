# Acceso a fuentes que bloquean · guía para cada ciclo

Versión del 11/11/2026. Para quien investiga las ofertas del catálogo.

Si una web o una app no nos deja entrar, buscamos **el mismo dato en otra fuente
legítima**. No forzamos la puerta.

Comprobación rápida (tarda menos de un minuto):

```
node /tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/acceso-fuentes/comprobar-rutas.mjs --guardar
```

Dice qué rutas siguen vivas y guarda las respuestas en bruto, con su SHA-256 y su
hora UTC, en `crudo/comprobar-rutas/<hora>/`. Hazlo al empezar cada ciclo.
Para una sola plataforma: `--solo midas` (o `spiko`, `spiko-letras`, `brickwise`,
`crowdedhero`, `cryptocom`).

El bruto que guarda `--guardar` es solo para trabajar: la API de Brickwise trae
direcciones de cartera de particulares y las fichas de CrowdedHero traen nombres de
personas. **No se publica.**

---

## 1. Límites firmes (no se negocian)

| No se hace | Por qué |
|---|---|
| Eludir un control anti-bots o un CAPTCHA (Cloudflare, etc.) | La web ha dicho que no. Saltarlo es acceso no autorizado. El 11/11 el control de seguridad ya bloqueó un intento: no se repite. |
| Falsear el agente de usuario o imitar un navegador para engañar | Es lo mismo que lo anterior, con otro disfraz. |
| VPN o proxy para cambiar de país | Fingir que estamos en otro sitio falsea el dato de acceso desde España y salta los filtros del emisor. |
| Crear cuentas, iniciar sesión, KYC, conectar wallets, rellenar formularios | Nos haría clientes o usuarios. Exige datos personales y aceptar condiciones. |
| Decompilar apps o usar API internas que piden token | Es entrar por la puerta de atrás. La API interna de la web de Midas (`api-prod.midas.app`) la denegó el control de seguridad: está fuera de límites. |
| Usar la Wayback Machine (u otra copia) para sacar documentos que la plataforma reserva a inversores verificados | Es saltarse la restricción por otra puerta. El 11/11 el control de seguridad bloqueó la búsqueda de copias de la KIIS de CrowdedHero: no se repite. |

Sí vale:

- Dominios oficiales alternativos del emisor: docs, centro de ayuda, `llms.txt` y
  `llms-full.txt`, `sitemap.xml`, estado, blog, prensa, CDN público de documentos.
- API públicas documentadas, o que la página pública usa sin sesión ni desafío.
- Registros y supervisores: CNMV, ESMA, AMF GECO, CSSF, FMA, BaFin, CBI, MFSA,
  AFM, FSMA, Consob, BOE, registros mercantiles.
- Datos en cadena con nodos RPC públicos (solo lectura, `eth_call`).
- Wayback Machine, **siempre con la fecha de la copia**: es una foto, no el dato de hoy.
  Solo para páginas públicas. **Nunca** para documentos reservados a inversores
  verificados (ver la tabla de arriba).
- Publicaciones que la ley obliga a hacer en abierto. Ejemplo: el registrador alemán
  de criptovalores publica los términos de cada emisión (art. 5 de la eWpG).
- Fichas de tiendas de apps, KID y condiciones en PDF, notas de prensa, GitHub
  público, agregadores gratuitos (CoinGecko, DefiLlama, rwa.xyz).

Herramientas: `curl` con su agente por defecto, Python con `-I` y `pdftotext`,
Node `fetch`, Playwright sin trucos de ocultación.

Una regla práctica: **si la respuesta es un 403 o trae `cf-mitigated: challenge`,
se anota y se pasa a otra fuente.** Ni un segundo intento con otro disfraz.

Matiz útil: una cabecera honesta no es un disfraz. La web de la CNMV da error 500
si se manda `accept-language: *` (lo que manda `fetch` por defecto). Mandar
`accept-language: es` es pedir un idioma, no hacerse pasar por nadie.

Otro matiz: el portal de BaFin manda una cabecera partida en varias líneas. Node
`fetch` la rechaza (`HPE_INVALID_HEADER_TOKEN`) y `curl` la acepta. No es un
bloqueo: se usa `curl` con su agente por defecto, la misma petición normal.

---

## 2. Por plataforma

Cada ruta: qué está bloqueado, la ruta que funciona, cómo usarla, qué dato da y de
qué fecha. Solo van las rutas que el verificador **reprodujo por su cuenta**.

### 2.1 Midas · mTBILL (tarjeta publicada) y ficha del radar

**Bloqueado:**
- `midas.app/mtbill` y `midas.app/llms.txt`: 403 de Cloudflare con desafío. Siguió
  así a las 15:29 UTC del 11/11.
- `docs.midas.app` (documentación, `llms.txt`, `llms-full.txt`): **intermitente**.
  200 a las 09:26 UTC; 403 de 10:20 a 15:12; otra vez 200 a las 15:29, con el mismo
  contenido que a las 09:26 (SHA-256 `aca8b6c7…`). Si responde a una petición
  normal, se puede leer. Si da 403, no se insiste.
- La API interna de la web (APY «oficial»): fuera de límites.

#### a) Valor del token y rentabilidad: oráculo en cadena (fuente primaria)

- **Ruta:** contrato del oráculo mTBILL/USD en Ethereum,
  `0x056339C044055819E8Db84E71f5f2E1F536b2E5b`, por el nodo público
  `https://ethereum-rpc.publicnode.com`. Solo lectura, sin wallet y sin firmar.
- **Cómo:** `eth_call` a `latestRoundData()` (selector `0xfeaf968c`) y a
  `getRoundData(uint80)` (`0x9a6fc8f5`) de las rondas anteriores. 8 decimales.
  Script del verificador: `verif-midas/scripts/oraculo.py`. Comprobación rápida:
  `comprobar-rutas.mjs`.
  ```
  curl -s https://ethereum-rpc.publicnode.com -H 'content-type: application/json' \
    -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x056339C044055819E8Db84E71f5f2E1F536b2E5b","data":"0xfeaf968c"},"latest"]}'
  ```
- **Dato (11/11):** ronda 492 = **1,07768132 USD**, del **10/11/2026 a las 18:40:23 UTC**.
  A las 15:29 UTC del 11/11 seguía siendo la última ronda.
- **Rentabilidad anualizada** (última ronda frente a la más cercana N días antes):
  30 d 3,53 % simple / 3,59 % compuesta; 7 d 3,86 % / 3,93 %; 90 d 3,36 % / 3,40 %;
  180 d 3,30 %; 365 d 3,33 %. Los 7 días son ruidosos: usar 30 días.
- **Cuidado:**
  - La fecha del dato es la de la ronda (10/11 18:40 UTC), no la de la lectura.
  - Es en USD. No descuenta el 0,07 % del reembolso inmediato ni el cambio EUR/USD.
  - Comisión de rendimiento del 5 %: el KID en español (ruta c) dice que se
    «deduce dentro del VL» y que el VL va «tras deducir todas las comisiones». Si
    el oráculo publica ese VL, la rentabilidad ya va neta de esa comisión. Falta
    un documento que diga que el oráculo es el VL del Agente de Cálculo: decirlo
    con prudencia.
  - **La documentación del emisor tiene un enlace mal puesto.** El texto dice
    `0x0563…`, pero el enlace a Etherscan va a `0xe4f2…0d24`, que es el oráculo
    de **mBASIS**/USD. La dirección buena se confirma en cadena: la bóveda de
    reembolso usa `mTokenDataFeed` `0xfcee…4a2b`, cuyo `aggregator()` es `0x0563…2E5b`.

#### b) Reembolso inmediato: bóveda en cadena

- **Ruta:** bóveda de reembolso inmediato `0x569D7dccBF6923350521ecBC28A555A500c4f0Ec`
  (proxy verificado en Sourcify; implementación `RedemptionVaultWithUSTB`) y
  contrato de reembolso de Superstate `0x4c21b7577c8fe8b0b0669165ee7c8f67fa1454cf`.
  Mismo nodo público.
- **Cómo:** `eth_call` a `paused()` `0x5c975abb`, `instantDailyLimit()` `0x3972183c`,
  `instantFee()` `0xc47d51be`, `minAmount()` `0x9b2cb5d8`; y `balanceOf` de USDC
  (`0xA0b8…eB48`) en el contrato de Superstate. Script: `verif-midas/scripts/boveda.py`.
- **Dato:** sin pausar; límite de 10.000.000 mTBILL al día; comisión 7 pb (0,07 %);
  mínimo 1 mTBILL. USDC disponible en Superstate: 9.000.010 a las 10:22 UTC y
  **8.500.009 a las 15:07 y a las 15:29 UTC** del 11/11.
- **Cuidado:** la capacidad inmediata real (≈ 8,5 M USD a las 15:29 UTC) cambia
  durante el día. Publicarla **siempre con bloque y hora**, como «no garantizada»
  y compartida por todos los tenedores.
- El circulante que da `totalSupply()` (66.135.847 mTBILL) es **solo el de
  Ethereum**. mTBILL está en varias cadenas: no presentarlo como el total.

#### c) Documentos legales: CDN público de GitBook del emisor

- **Ruta:** los PDF de la documentación están en un CDN sin sesión ni token.
  - Condiciones Finales de mTBILL (17/07/2026):
    `https://3475141875-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FMndxFHqGeA4nzBBeKDTV%2Fuploads%2FUDquVH8yRhSxnVqxp0X4%2F20260714_mTBILL_FT_signed_final.pdf?alt=media`
    SHA-256 `b1e58001…944a`.
  - KID de mTBILL en español (revisión 17/07/2026):
    `https://3475141875-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FMndxFHqGeA4nzBBeKDTV%2Fuploads%2Fo0H3P2VXZM3GM2QeIOa2%2FKID_mTBILL%20es.pdf?alt=media`
    SHA-256 `6c228709…a545`.
- **Cómo:** `curl -sSO '<url>'` y `pdftotext -layout`. En las Condiciones Finales,
  buscar en la Part B «Countr(y)(ies) Where the Offer(s) to the Public Takes Place»,
  «Prohibition of Sales to EEA Retail Investors» y «Target market»; el importe
  mínimo está en la **Part A §3** (Subscription, Redemption).
- **Dato:** oferta pública en 14 países del EEE, **España incluida**; prohibición
  de venta a minoristas del EEE: **not applicable**; mercado objetivo con clientes
  minoristas; importe mínimo: not applicable; periodo de oferta hasta el fin del
  folleto base (17/07/2027). Comisiones: suscripción inmediata hasta 0,2 %,
  emisión 0 %, reembolso hasta 0,05 %, límite de reembolso del 25 % al día.
  KID: riesgo 7 de 7, minoristas con conocimientos de productos estructurados y
  tokens, horizonte de 1 año, comisión de rendimiento del 5 % dentro del VL.
- **Cuidado:**
  - No escribir «venta directa» ni «sin colocadores». La Part C solo dice que no
    hay colocadores designados a esa fecha, y la Part B autoriza a cualquier
    intermediario a usar el folleto.
  - Los metadatos del KID dicen que el PDF se generó el 12/10/2026, aunque declara
    la revisión del 17/07/2026. El dato es el mismo.
  - El mismo CDN sirvió el KID de mHYPER
    (`content.gitbook.com/content/MndxFHqGeA4nzBBeKDTV/blobs/0mtdYQ1fSELYbNqAP9jd/KID_mHYPER.pdf`).
    El mecanismo funciona, pero solo si se conoce el enlace exacto: no se adivinan
    enlaces.

#### d) Registros: ESMA, CNMV y MFSA

- **ESMA, folletos por ISIN** (API Solr pública de su web):
  `https://registers.esma.europa.eu/solr/esma_registers_priii_documents/select?q=instrument_isins:CH1371002986&wt=json&rows=50&sort=approval_filing_date%20desc`
  Dato: 3 documentos; el último es **FTWS-1420 (17/07/2026)**, origen Liechtenstein,
  pasaportado a **SPAIN** (y documentos en español). Nada posterior. El hash cambia
  en cada consulta por el campo `QTime`: comparar el bloque `response`.
- **ESMA, todo el emisor por LEI:**
  `…/select?q=party_name:*984500BB00BN6D2B7C48*&wt=json&rows=100&sort=approval_filing_date%20desc`
  Dato: 41 documentos; folletos base BPWO-84, BPWO-63 y BPWO-45, sin suplementos;
  los 14 FTWS de 2026 pasaportados a España; el último, FTWS-2788 del 26/10/2026.
  **Si el número sube de 41, hay producto o suplemento nuevo: mirarlo.**
- **CNMV, pasaportes recibidos:**
  `https://www.cnmv.es/portal/Consultas/Folletos/Pasaportes?denominacion=&lei=984500BB00BN6D2B7C48`
  Dato: BPWO-84 de Midas Software GmbH (Liechtenstein), aprobado y notificado el
  17/07/2026; también BPWO-63 y BPWO-45. Sin suplementos ni traducción.
  Cuidado: la frase «la CNMV no revisa el folleto ni autoriza a la entidad» **no
  está en esa página**. Es cierta por el régimen de pasaporte, pero no se le
  atribuye a la página.
- **MFSA, copia del folleto base del 17/07/2026:**
  `https://www.mfsa.mt/wp-content/uploads/2026/07/Midas-Software-GmbH-Base-Prospectus-Document-dated-17-July-2026.pdf`
  (SHA-256 `a8fd6320…1349`). Da la tabla de productos con ISIN: mTBILL
  CH1371002986, mBASIS CH1392624172, mEDGE CH1423036651, mAPOLLO CH1475894601,
  mHYPER CH1475894585, mHyperBTC DE000A4AQV70, mRe7ETH DE000A4AT408, mRe7BTC
  CH1487692530. El «not guaranteed» del reembolso inmediato está en las
  **páginas 15 y 22** (no en la 21).

#### e) Contraste (no para la tarjeta)

- **rwa.xyz** `https://app.rwa.xyz/assets/mTBILL` (datos `__NEXT_DATA__` de la propia
  página, sin sesión): APY 7 d 3,91 %, 30 d 3,44 % (actualizado 11/11 03:53 UTC).
  **No usar sus comisiones:** dice 0 en reembolso y en éxito, y contradice la
  cadena y el KID.
- **DefiLlama** `https://yields.llama.fi/chart/b8d0d351-ac04-40de-9768-1fb9fdc68114`,
  `https://yields.llama.fi/pools` (filtrar `project=midas-rwa`) y
  `https://coins.llama.fi/prices/current/ethereum:0xdd629e5241cbc5919847783e6c96b2de4754e438`:
  APY del día 2,41 % (salto de la serie: no va a la tarjeta), media 30 d 3,30 %,
  TVL 71,27 M USD, precio 1,07768132 (igual que el oráculo).
- **CoinGecko** `https://api.coingecko.com/api/v3/coins/midas-mtbill`: 1,078 USD,
  capitalización 72,86 M USD (no cuadra con la TVL de Ethereum: no mezclar).

#### Rutas descartadas para Midas

- Wayback Machine: la API `archive.org/wayback/available` responde (hay copia de
  `midas.app/mtbill` del 22/10/2026), pero `web.archive.org` corta la conexión
  desde nuestra salida. Además sería una foto del 22/10.
- API interna `api-prod.midas.app`: fuera de límites.

### 2.2 Spiko · Smart Cash Euro (tarjeta publicada)

**Bloqueado:** no hay una web cerrada, sino un hueco en los registros. La CNMV
inscribe la SICAV, pero no enseña qué compartimentos se venden en España. AMF GECO
tampoco publica los países de notificación.

#### a) Por qué la CNMV nunca lo enseñará: BOE

- **Ruta:** Circular 2/2011 de la CNMV, versión consolidada.
  `https://www.boe.es/buscar/act.php?id=BOE-A-2011-10830`
- **Dato:** «se elimina el requisito de la inscripción en el Registro de la
  Comisión Nacional del Mercado de Valores de compartimentos». Los compartimentos
  comercializados en España con más de 500 accionistas se comunican con fines
  fiscales (art. 52 del RIRPF).
- **Cuidado:** que esa comunicación «no es pública» es una deducción nuestra; el
  BOE no lo dice.

#### b) La ficha española: CNMV

- **Ruta:** `https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0401205J&vista=0`
  (y `&vista=18`, comercializadoras).
- **Dato:** SPIKO SICAV n.º 2380, inscrita el 30/01/2026, Francia, armonizada
  (Directiva 2009/65/CE). Comercializadora: Aldana Capital, S.A., A.V. Ningún
  compartimento.
- Otra información relevante: usar
  `https://www.cnmv.es/Portal/HR/ResultadoBusquedaHR.aspx?division=2&nif=N0401205J`
  («No se han encontrado datos disponibles»). La misma ruta en minúsculas da 403.
- Mandar `accept-language: es` (ver sección 1).

#### c) Prueba de pasaporte del compartimento en otros países

- **AFM (Países Bajos):**
  `https://www.afm.nl/nl-nl/sector/registers/vergunningenregisters/beleggingsinstellingen/details?id=3EB284BB-7CF7-F011-8406-000D3A4674CC`
  Dato: SPIKO SICAV, EER-ICBE desde el 31/12/2025; oferta a minoristas «Ja» en la
  fila de la SICAV. Subfondo «Spiko Amundi Overnight Swap Fund» (SAFO) inscrito el
  **16/03/2026**. En las filas de los subfondos la columna de minoristas está vacía.
- **FSMA (Bélgica):** ficha `https://www.ctr-csr.be/en/party/spiko-sicav` y su JSON
  `https://www.ctr-csr.be/en/export/party/560743` (SHA-256 `5ef1227a…`, estable).
  Dato: Spiko Sicav n.º 07795, EEA UCITS desde el 31/12/2025; productos SAFO, EU
  T-Bills y US T-Bills, sin fecha por producto.
- **FSC (Bulgaria):** API pública de WordPress
  `https://www.fsc.bg/wp-json/wp/v2/media?search=spiko` (9 documentos; último
  subido el 26/10/2026). Informe semestral a 30/06/2026 con el subfondo SAFO y
  7 KID en búlgaro a 01/09/2026. Las fechas 03/03, 26/03, 04/05, 29/07 y 01/09 son
  **versiones del folleto**, no fechas de depósito.
- Ninguno de los tres es España. Prueban que el subfondo tiene pasaporte en otros
  países del EEE.

#### d) Lo que dice el emisor

- **Ruta:** `https://docs.spiko.io/documentation/product_overview/fund_availability/`
  (aparece en `https://docs.spiko.io/sitemap.xml`).
- **Dato:** España ✅ en Smart Cash (incluye Spiko Euro). «Last updated: October 23,
  2026». Aviso del emisor: una clase creada después «needs its own registration».
  La página del servicio Embedded también marca España ✅.
- Es una **declaración del emisor**, no un registro.

#### e) Control y contexto

- **ESMA, comercialización transfronteriza:**
  `https://registers.esma.europa.eu/solr/esma_registers_funds_cbdif/select?q=spiko&rows=0&wt=json`
  Da 0, pero la base no tiene ni siquiera SPIKO SICAV: **que no aparezca no prueba
  nada**. (Con `funds_host_country_codes:ES` hay 202 fondos franceses con España
  como destino; el «93» de la primera búsqueda estaba mal calculado).
- **Nota de prensa de Amundi** (18/03/2026):
  `https://int.media.amundi.com/article/spiko-and-amundi-introduce-safo`.
  SAFO «available to eligible investors through Spiko», para empresas e
  instituciones. Foto del lanzamiento; no nombra países.

#### Ruta descartada para Spiko

- Wayback Machine para el historial de la tabla de países: la copia más antigua es
  del 04/11/2026 y el CDX corta la conexión. No sirve para saber desde cuándo
  figura España.

### 2.3 Spiko · Letras del Tesoro EUR/USD (tarjeta publicada)

**Qué falta:** no hay web cerrada. Hay un choque entre dos fuentes públicas. La
clase EUR del fondo en dólares (FR001400SBD3, símbolo `eurUSTBL`) tiene un mínimo
de **1 €** según el folleto y de **1.000 €** según la API de Spiko. Estas rutas
dicen quién está en esa clase.

El verificador lo rehízo todo el 11/11 entre las 15:14 y las 15:17 UTC, con `curl`.
En lo estático salieron los mismos bytes que al experto.

#### a) API pública de Spiko (sin cuenta ni token)

- **Por qué vale:** `https://docs.spiko.io/developers/public_api/getting_started`
  dice «no account or authentication required» y «No authentication is needed».
  (La frase «No authentication is required» no aparece; el sentido es el mismo).
- **Rutas:**
  - `https://public-api.spiko.io/v0/share-classes/eurUSTBL/totals`
  - `https://public-api.spiko.io/v0/share-classes/eurUSTBL/totals/from-day?startDay=2024-11-01`
  - `https://public-api.spiko.io/v0/share-classes/eurUSTBL` (ficha de la clase)
  - `https://public-api.spiko.io/v0/share-classes/USTBL/totals` (clase USD, para comparar)
- **Cómo:** `curl -s '<url>'`. Devuelve JSON.
- **Dato:**
  - Clase EUR: 1 titular, 10.000 acciones, 10.230,45 EUR, VL 1,023045 EUR
    **del 10/11/2026**, órdenes acumuladas de 10.000 EUR.
  - Ficha: `minimumInitialSubscription "1000"`.
  - Historial: 497 días, del 07/11/2024 al 10/11/2026. Las órdenes pasan a 10.000
    el 12/11/2024 y las acciones el 13/11/2024. Desde entonces no cambian.
  - Clase USD: 881 titulares y 174.085.623,17 USD.
- **Confirmado:** 15:14:49–15:14:51 UTC. SHA-256 `50af02a5…d981` (totales) y
  `9d405a3d…d5d1` (historial), iguales a los del experto.
- **Cuidado:** «es la dotación inicial y ningún cliente la usa» es una deducción
  razonable. La API solo dice «1 titular».

#### b) Documentación y web de Spiko

- `https://docs.spiko.io/direct/recipes/available_products` (SHA-256 `4be804a8…4ac3`):
  «If a Euro order is placed for Spiko T-Bills Dollar, the funds are converted into
  Dollars using Bloomberg's exchange rate at 11:30 AM Paris time … with no exchange fees».
- `https://docs.spiko.io/documentation/account_management/currency_exchange`
  (`44ffba9a…6703`): índice Bloomberg BFIX a las 11:30 de París.
- `https://www.spiko.io/es/spiko-letras-del-tesoro-dollar` (`da4d37ce…9581`):
  «Depósito inicial mínimo $1» y cambio automático sin comisión.
- `https://data.spiko.io/ustbl/`: «Minimum initial subscription 1 USD». Es dinámica:
  el hash cambia, el texto no.
- **Fecha:** páginas sin fecha, leídas el 11/11.
- **Confirmado:** 15:15:01–15:15:04 UTC.
- **Cuidado:** el «$1» es de la **clase USD**, no de la EUR. `data.spiko.io/eurustbl/`
  da 404 (no existe esa página).

#### c) AMF GECO (supervisor francés, JSON público sin sesión)

- `https://geco.amf-france.org/back-office/funds/lastVl/FR001400SBD3` (`82dedb12…2731`):
  VL 1,02305 EUR **del 10/11/2026** y `shareNumber 10000`.
- `https://geco.amf-france.org/back-office/funds/compartment/c79398/shares`: la clase
  «EUR non hedgée» está «Vivant», para «Tous souscripteurs». Su único DICI en GECO es
  un borrador de 2024 en .docx.
- Informe semestral: `https://geco.amf-france.org/back-office/document/download/429960`
  (`3c55af88…f488`). Al **30/06/2026**, la «ACTION EUR» tiene 10 000,00000 acciones,
  9 942,73 EUR y VL 0,994272. Es dato de esa fecha, no de hoy.
- **Confirmado:** 15:15:29–15:15:33 UTC.

#### d) En cadena: `totalSupply()` del token eurUSTBL

- **Direcciones** (salen de la ficha de la API, punto a):
  - Ethereum `0x0183ace58bc8b8f1f84cc8b9ed1210e1c87df7e0`, nodo `https://ethereum-rpc.publicnode.com`
  - Polygon `0x75cb1bd539ee2cb22031603a7b437f1f7077b05e`, nodo `https://polygon-bor-rpc.publicnode.com`
  - Base `0xa260d72df8ff2696f3a8d0be46b7bc4d743be764`, nodo `https://base-rpc.publicnode.com`
  - Arbitrum `0xa8de1f55aa0e381cb456e1dcc9ff781ea0079068`, nodo `https://arbitrum-one-rpc.publicnode.com`
- **Cómo:** `eth_call` a `totalSupply()` (`0x18160ddd`) y `decimals()` (`0x313ce567`).
  5 decimales. Solo lectura.
  ```
  curl -s https://polygon-bor-rpc.publicnode.com -H 'content-type: application/json' \
    -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x75cb1bd539ee2cb22031603a7b437f1f7077b05e","data":"0x18160ddd"},"latest"]}'
  ```
- **Dato:** Ethereum 5.000 y Polygon 5.000 fichas. Base y Arbitrum, 0. Total 10.000,
  igual que la API y GECO. Fecha: la del bloque (Ethereum 26.392.519, el 11/11).
- **Confirmado:** 15:16:30–15:16:31 UTC.
- No se miraron Etherlink, Starknet, Stellar ni Solana. No hace falta: la suma ya
  cuadra con la API.

#### e) Folleto de la SICAV

- `https://cdn.spiko.finance/legal_docs/EN/Prospectus_Spiko_SICAV_EN.pdf` (`7457e79f…fb35`).
  «Publication date: 1 September 2026». En la tabla de clases, «EUR Share
  FR001400SBD3»: mínimo inicial 1 EUR, posterior 1 EUR, «All Investors».
- Copia en GECO: `https://geco.amf-france.org/back-office/document/download/438274`
  (`940559b4…74fe`).
- Lista de documentos en GECO:
  `https://geco.amf-france.org/back-office/document/byCompartAndProduct?compartCode=c79398&prdCode=p79397`.
  El folleto más reciente es el 438274, con efecto el 01/09/2026.
- **Confirmado:** 15:16:08–15:16:12 UTC.
- Letras en euros (EUTBL, FR001400ODL1): 1 EUR en el folleto y "1" en la API. Sin choque.

**Conclusión del verificador:** el choque es real y sigue hoy. Folleto vigente
(01/09/2026): 1 EUR. API: 1.000 (en el repositorio, al menos desde el 01/11/2026).
Los euros de un cliente se cambian a dólares y compran la clase USD (mínimo 1 USD).

### 2.4 Brickwise · 11 fichas de reventa (publicadas)

**Bloqueado:** el enlace viejo `cdn.brickwise.at/legal/AGB/Nutzungsbedingungen.pdf`
da 404. Faltaba saber: si se puede comprar parte de una orden de venta, qué es
`sharePrice` y si se ofrece en España.

El verificador lo rehízo el 11/11 entre las 15:18 y las 15:22 UTC, con `curl`.

#### a) Condiciones de uso

- **Ruta:** `https://www.brickwise.at/contracts`, que enlaza el PDF
  `https://cdn.prod.website-files.com/62414ac6ad5d1a1acc6c486a/62414ac6ad5d1a78816c4903_Nutzungsbedingungen_Brickwise.pdf`.
- **Cómo:** `curl -sSO '<url>'` y `pdftotext -layout`.
- **Dato:** «Datum: 29.09.2021» (Last-Modified 28/03/2022).
  - 3.2.2(b): la plataforma deja publicar ofertas de compra y venta y pone en
    contacto a las partes.
  - 3.2.3: BWInvest no influye en esas ofertas.
  - No hay cláusula de cantidad mínima ni de compra parcial.
- **Fecha:** 29/09/2021. Se presenta como vigente porque es el que enlaza hoy `/contracts`.
- **Confirmado:** 15:18:18 UTC. SHA-256 `38067d75…6c9c`, igual al del experto.
- **Cuidado:** la expresión «Bulletin Board» **no está en el PDF**. Está en los
  avisos de riesgo de la web (`/support`, `/how-it-works`, magazine). Citarla de ahí.

#### b) Guía de venta y preguntas frecuentes

- `https://www.brickwise.at/how-it-works/verkaufen-kann-so-einfach-sein-auch-bei-immobilieninvestments`
  (`51041281…6340`)
- `https://www.brickwise.at/support/wie-funktioniert-der-handel-am-marktplatz`
- `https://www.brickwise.at/support/wie-kann-ich-investieren`
- **Dato:** quien elige una oferta ya publicada sabe que la otra parte está de
  acuerdo «mit dem Preis und der Anzahl der Anteile». Si la cantidad o el precio que
  quieres «nicht als bestehendes Angebot verfügbar sind», creas una oferta nueva. En
  tu propia oferta eliges la cantidad y el precio.
- **Fecha:** sin fecha. La guía está marcada como «Marketingmitteilung».
- **Confirmado:** 15:18:55 UTC (FAQ) y 15:19:53 UTC (guía, mismo hash que el experto).
- **Cuidado:** la FAQ **no** pone «por ejemplo, 1». Que una orden se tome entera es
  una deducción, no algo que diga la web.

#### c) JavaScript público de la web

- **Ruta:** `https://app.brickwise.at/js/app.85dda63a.js`. Lo descarga la página
  pública del mercado, sin sesión.
- **Cómo:** descargar y buscar textos. Ejemplo:
  `curl -s '<url>' | grep -o 'Max. verfügbar'`. Solo se buscan textos: no se
  decompila nada ni se llama a ninguna API con token.
- **Dato:** «Max. verfügbar», «Es sind nicht so viele Anteile verfügbar», «die
  gewünschten Anteile» y «Letzter Preis / Anteil: … den letzten Preis zu dem ein
  Anteil am Marktplatz gehandelt wurde». El gráfico usa una media ponderada de 30 días.
- **Confirmado:** 15:20:08 UTC (`b5c9c154…601d`, igual).
- **Cuidado:**
  - «nicht so viele Anteile verfügbar» también sale con la clave `issuer_*`
    (mercado primario). Atribuirlo a la reventa es una interpretación.
  - La **compra parcial sigue sin confirmar**.
  - Si el archivo da 404, la web cambió de versión: buscar el nuevo `js/app.*.js`
    en la página pública del mercado.

#### d) API pública que usa la web

- **Ruta:** `https://api.app.brickwise.at/api/v1/assets`. Sin token.
- **Cómo:** `curl -s '<url>'`. Para cada ficha, la orden de venta abierta con
  menor desembolso (cantidad × precio), más el 1,5 % de comisión del comprador.
- **Dato (15:20:23 UTC):** 424 ventas y 95 compras abiertas, todas con
  `contactType "bulletin"`. Orden de venta más barata publicada, más el 1,5 %:

  | Ficha | ISIN | € |
  |---|---|---|
  | Plüddemanngasse | AT0000A2RAH5 | 100,48 |
  | Sonnleithnergasse | AT0000A2T4D7 | 81,20 |
  | Klagenfurt | AT0000A2U5V3 | 96,42 |
  | Stallhofstraße | AT0000A2WCD0 | 69,83 |
  | Schwarzer Weg | AT0000A2WCE8 | 70,95 |
  | Drautal | AT0000A2YPQ0 | 85,26 |
  | Randhartingergasse | AT0000A2ZT84 | 79,17 |
  | Hinterstoder | AT0000A31KP7 | 91,35 |
  | Pottendorfer | AT0000A324B4 | 74,09 |
  | GreenPoint | AT0000A38J32 | 121,80 |
  | Cohotel | AT0000A38J40 | 446,60 (4 a 110 €; no hay órdenes de 1) |

- **Fecha:** la de la consulta. Cambia durante el día: a las 15:41 UTC la orden de
  73 € de Pottendorfer ya no estaba (ver sección 5). Klagenfurt sale 96,43 en el
  script por redondeo de 96,425.
- **Confirmado:** 15:20:23 UTC, con el mismo SHA-256 que el experto a las 14:54:51
  (`39a532d3…87c0`).
- **Cuidado:**
  - Es un precio publicado, no la garantía de poder comprar. 309 de las 424 ventas
    tienen más de un año. Las órdenes más baratas de Drautal, Hinterstoder y
    GreenPoint ya tienen un interesado apuntado (sin bloqueo activo).
  - Decir «orden de venta más barata publicada hoy, más el 1,5 %». **No** decir
    «mínimo seguro».
  - **La respuesta trae direcciones de cartera de particulares
    (`firstParty`, `interestedParty`): no publicarlas.**

#### e) Pregunta frecuente sobre el valor de mercado

- **Ruta:** `https://www.brickwise.at/support/wie-berechnet-sich-der-marktwert` (`f6046b83…dbb3`).
- **Dato:** «Der Marktwert berechnet sich auf Basis der insgesamt verfügbaren
  Anteile, multipliziert mit dem zuletzt gehandelten Preis am Marktplatz».
- **Confirmado:** 15:18:30 UTC.
- **Cuidado:** que `sharePrice` sea el último precio negociado es una deducción
  coherente (en Schwarzer Weg pasó de 60 a 65 al desaparecer una venta a 65). No es
  una definición del campo. No es una tasación ni un precio que se pueda pagar hoy.

#### f) CNMV: EFFECTA GmbH, n.º 5003

- **Rutas** (con `accept-language: es`, ver sección 1):
  - `https://www.cnmv.es/Portal/Consultas/ESI/ESISExtranjerasLP.aspx?numero=5003&tipo=CLP`
  - `…?tipo=CLP&numero=5003&vista=17` (programa de actividades)
  - `…?tipo=CLP&numero=5003&vista=8` (agentes)
- **Dato:** país de origen Alemania; registro del 11/11/2020; «Recepción y
  transmisión de órdenes» sobre «Valores negociables» y «Participaciones y acciones
  en IIC». Agentes: «No se han encontrado datos disponibles».
- **Confirmado:** 15:21 UTC. El hash cambia en cada visita; el contenido no.
- **Cuidado:** solo prueba que Effecta tiene pasaporte para España. No prueba que
  cada emisión de Brickwise se ofrezca a residentes en España. La ficha de la FMA
  austriaca no la pudo repetir el verificador: no se da por buena.

### 2.5 CrowdedHero · bonos DLT (proveedor letón listado por la CNMV)

**Bloqueado:** la KIIS de cada emisión solo la ven inversores verificados (cuenta y
KYC). **No se intenta verla por ninguna otra vía.** Lo que se puede reconstruir
sale de fuentes oficiales.

El verificador lo rehízo el 11/11 entre las 15:21 y las 15:25 UTC, con `curl` y solo GET.

#### a) Emisor de Simpleros: su web y el BORME

- **Rutas:**
  - `https://simpleros.es/condiciones-generales` (también `/politica-de-privacidad` y
    `/informacion-sobre-prestamo`)
  - `https://www.boe.es/borme/dias/2020/09/01/pdfs/BORME-A-2020-169-08.pdf` (`39fcba8e…398d`)
- **Dato:**
  - Web: «NIF B-01787720, Avenida Diagonal 442, 1º-1, 08037 Barcelona, RM Barcelona
    Tomo 47434 Folio 134 Hoja 551677».
  - BORME: SIMPLEROS S.L., constituida el 24/07/2020, objeto de «asesoramiento
    general», capital de 3.000 €, sociedad unipersonal.
- **Fecha:** BORME del 01/09/2020. El capital es el de 2020; no se ha mirado en BORME
  posteriores.
- **Confirmado:** 15:21:39 UTC (BORME, mismo hash que el experto) y 15:22:03–15:22:04 UTC (web).
- **Cuidado:** `/conditions` **no** tiene el NIF ni los datos registrales. `/contacts`
  sigue con el relleno «Company reg number».

#### b) Emisor de Amber: registro mercantil de Letonia (data.gov.lv)

API CKAN pública, sin token. Base: `https://data.gov.lv/dati/api/3/action/datastore_search?resource_id=`

- **Rutas:**
  - Registro: `…25e80bf3-f107-4ab4-89ef-251b5b9374e9&q=42103079662`
  - Cuentas presentadas: `…27fcc5ec-c63b-4bfd-bb08-01f073a52d04&q=42103079662`
  - Balance: `…50ef4f26-f410-4007-b296-22043ca3dc43&filters={"statement_id":2340045}`
  - Pérdidas y ganancias: `…d5fd17ef-d32e-40cb-8399-82b780095af0&filters={"statement_id":2340045}`
- **Dato:** SIA «BALVORA Group», n.º 42103079662, alta el 06/04/2017, sin baja.
  Cuentas de 2025 (presentadas el 08/06/2026): ventas 293.258 €, beneficio 21.126 €,
  activo 546.973 €, **fondos propios −150.078 €**, deuda 697.051 €. Pérdidas de
  81.856 € en 2023 y de 59.209 € en 2024. Resultado antes de impuestos más intereses
  netos: unos 22.948 €. El cupón máximo (12 % de 200.000 €) son 24.000 € al año.
- **Fecha:** ejercicio 2025.
- **Confirmado:** 15:22:22–15:22:53 UTC.
- **Cuidado:** «sin insolvencia» (recurso `8065ad80`) no lo repitió el verificador:
  no darlo por confirmado.

#### c) Fichas públicas y página de riesgos

- **Rutas:** `https://www.crowdedhero.com/project/view?id=50` (Simpleros),
  `https://www.crowdedhero.com/project/view?id=49` (Amber) y
  `https://www.crowdedhero.com/legal?category=risk`.
- **Dato (11/11, 15:23 UTC):** Simpleros lleva 82.500 € de un mínimo de 100.250 €
  (82,3 %), con 3 días restantes. Amber lleva 1.000 € de 50.000 € (2 %), con 34 días.
  Riesgos: subordinado, pérdida total, sin mercado secundario, crédito al consumo.
  Amber: un solo inmueble alquilado, fondos propios negativos, lista blanca.
- **Confirmado:** 15:23:08 UTC. Las páginas son dinámicas: el hash cambia, las cifras no.
- **Cuidado:**
  - «Sin garantía» engaña. La ficha dice «No deposit guarantee or investor
    compensation scheme» (sin fondo de garantía). Y los términos de la emisión
    (punto d) recogen una **prenda**.
  - La cabecera de p50 pone «Min target €100 250», pero el texto de la ficha y los
    términos dicen 50.000 €. Avisar de la incoherencia; no elegir una cifra sin más.
  - Las fichas traen nombres de personas: no copiarlos.

#### d) Registrador y términos de la emisión (BaFin y publicación del registrador)

- **Rutas:**
  - BaFin, búsqueda de NYALA:
    `https://portal.mvp.bafin.de/database/InstInfo/sucheForm.do?institutName=NYALA&sucheButtonInstitut=Suche`
    (`a03e220c…220f`) → «Keine Ergebnisse».
  - BaFin, ficha de Smart Registry GmbH:
    `https://portal.mvp.bafin.de/database/InstInfo/institutDetails.do?cmd=loadInstitutAction&institutId=160639`
    (`851ce9e0…de90`) → Kryptowertpapierregisterführer, Berlín, autorizado el **19.08.2026**.
  - Contrato DLT genérico: `https://www.crowdedhero.com/legal?category=dlt` →
    «Kryptowertpapiere… issued by "NYALA Digital Asset" AG pursuant to §16 eWpG».
  - Publicación del registrador (art. 5 eWpG):
    `https://www.nyala.de/en/products/electronic-securities` → «Simpleros Bonds X»,
    ISIN DE000A4EXNM2.
  - Sus términos de emisión:
    `https://de000a4exnm2.register.nyala.de/BondProspectus_SIMPLEROS%2003.07.2026.pdf`
    (`c0c445e4…f056`).
- **Dato de los términos:**
  - Emisor SIMPLEROS, S.L. (CIF B01787720, LEI 98450082BEF114765441). ISIN
    DE000A4EXNM2, WKN A4EXNM.
  - Bonos subordinados (Kryptowertpapiere, §16 eWpG) por 500.000 € en total, en
    participaciones de 250 €. Primera campaña de 200.000 €, con mínimo de 50.000 €.
  - 10,50 % semestral (30E/360). Emisión el 01/07/2026, vencimiento el 15/11/2028,
    suscripción hasta el 30/06/2027.
  - Registrador Smart Registry GmbH. Custodio Tangany GmbH. Agente de pagos Lemonway.
  - Comisión de entrada del 1,25 % a cargo del inversor.
  - Prenda sobre 3 bonos de Audacia Capital OÜ (EE3300002252, 300.000 € nominales),
    con CrowdedHero como fiduciario. Ley de Letonia.
- **Fecha:** términos del 03/07/2026 (nombre del archivo). BaFin, vivo hoy.
- **Confirmado:** 15:23:08–15:23:44 UTC (BaFin y contrato, mismos hashes que el
  experto) y 15:25:17 UTC (PDF de los términos, hallado por el verificador).
- **Por qué vale:** la ley obliga al registrador a publicar los términos en abierto.
  No es saltarse la KIIS.
- **Cuidado:**
  - Es **falso** que «no hay fuente pública que diga qué registrador lleva estas
    emisiones». Quitar esa frase.
  - El emisor es Simpleros, no NYALA. Lo de NYALA es un error de redacción del
    contrato genérico de CrowdedHero.
  - En esa página **no** aparece ninguna emisión de BALVORA/Amber. La ficha de Amber
    decía «septiembre de 2026»: está desfasada.
  - El PDF nombra a una persona física (la que constituye la prenda): no copiar ese nombre.
  - BaFin: usar `curl` (ver sección 1, cabecera partida).

#### e) Licencia de la plataforma: ESMA y CNMV

- **ESMA:**
  `https://registers.esma.europa.eu/solr/esma_registers_upreg/select?q=ae_lei:984500B08DG03M3EA171&wt=json`
  → SIA CrowdedHero Latvia, «Active», `hostMemberStates ["EUROPEAN UNION"]`,
  autorizada el 16/08/2022 por Latvijas Banka. Última actualización: **22/02/2024**.
  Confirmado: 15:23:55 UTC.
- **CNMV:**
  `https://www.cnmv.es/portal/consultas/servicios-financiacion-participativa/Proveedor-Europeo?nreg=1&nif=PSFPUE0001`
  (`fe578b14…e4fb`) → n.º de registro 1, del 01/09/2022, LETONIA. Confirmado: 15:24:15 UTC.
- **Cuidado:** la URL `/Portal/Consultas/PSFP/Proveedor-Europeo.aspx?nreg=1&nif=PSFPUE0001`
  acaba en 403 (`errorcode=CVFE`). Usar la de arriba. El dato de ESMA es de 2024:
  citarlo con su fecha.

#### f) Cuentas de la plataforma (data.gov.lv)

- **Rutas:** las del punto b, con `q=50203309441` y `statement_id` 2269545 (2025) y
  2076497 (2024).
- **Dato:** 2025 (presentadas el 26/05/2026): ventas 39.322 €, pérdida de 68.723 €,
  **fondos propios −51.085 €**. Al cierre de 2024, los fondos propios eran +17.639 €.
  El pie de la ficha p50 sigue con
  «AGENT NAME … REGAFI NUMBER» sin rellenar.
- **Confirmado:** 15:22:43 UTC.
- **Cuidado:** que no cumpla el art. 11 del ECSPR es una inferencia razonable que se
  apoya en el cierre del 31/12/2025. Decirlo con esa fecha. Ni la web ni las fichas
  hablan de un seguro.

### 2.6 Crypto.com · acciones tokenizadas EEE (Foris Capital CY Ltd, CySEC 344/17)

**Bloqueado:** la página del KID, `crypto.com/eea/financialservices/disclosures`,
filtra por país. Desde nuestra salida redirige (hoy, 301 a `https://crypto.com/`).
`/es-es/disclosures` y `/en-es/eea-tokenized-stocks` dan 404. No se intenta saltar.

El verificador lo rehízo el 11/11 entre las 15:18:18 y las 15:20:45 UTC, con `curl`.

#### a) Documentos legales en el CDN del emisor (sin filtro por país)

- **Rutas:**
  - `https://crypto.com/document/fccy-tokenised-equities-terms` (`1169bff5…1c6f`)
  - `https://crypto.com/document/tokenised-equities-corporate-action-policy` (`06d4eac0…c974`)
  - `https://crypto.com/document/fccy-tokenised-equities-risk-statement` (`8d5a498f…fe3e`)
- **Cómo:** `curl -sSO '<url>'` y `pdftotext -layout`.
- **Dato:**
  - Condiciones: «Last Update: 11 August 2026». Licencia CySEC 344/17. 3.1(d) remite
    a unas «Tokenized Stocks FAQs» con los países excluidos. 4: test de conveniencia.
    5.2: el KID se entrega «via the Crypto.com App». 6.3: no transferible a una
    cartera externa. 11.1 y 11.4: todo en USD; el riesgo de cambio es del cliente.
  - Declaración de riesgos: derivado OTC bilateral con FCCY como única contraparte.
    Fondo de compensación hasta el menor de 90 % o 20.000 €. No transferible ni
    retirable. Remite al KID.
  - Política de eventos corporativos: título interno «CDC Legal Draft v1».
- **Fecha:** condiciones del 11/08/2026. Declaración de riesgos y política: **sin fecha**.
- **Confirmado:** 15:18:18–15:18:20 UTC. Mismos hashes que el experto.
- **Por qué vale:** `robots.txt` pone «Disallow: /document/*» solo para Googlebot y AdsBot.
- **Cuidado:** el 5.2 dice que el KID se da «via the Crypto.com App», no que se dé
  **solo** ahí. Escribir «KID no localizado en una fuente pública accesible desde
  aquí», **no** «no hay KID público».

#### b) Centro de ayuda

- **Rutas:**
  - `https://help.crypto.com/en/articles/15855813-about-crypto-com-tokenized-stocks-eea`
  - `https://help.crypto.com/en/articles/15855830-corporate-actions-and-dividends-of-tokenized-stocks-eea`
  - `https://help.crypto.com/en/collections/19682896-tokenized-stocks-eea` (3 artículos:
    15855813, 15855825 y 15855830)
- **Dato:** unas 1.500 acciones y ETF de EE. UU., desde 1 USD, 24/7, comisión del 0 %,
  «if the feature is available in your jurisdiction». Fecha del 11/08/2026. El
  enlace al KID lleva a la página filtrada por país. La retención del 30 % de EE. UU.
  y la reinversión automática están en el 15855830, no en el 15855813.
- **Confirmado:** 15:18:42 y 15:19:04 UTC. Páginas dinámicas: el hash cambia, el texto no.
- **Cuidado:** la versión en español redirige a la inglesa. «On-chain» (9(b) de las
  condiciones) frente a «no transferible» (6.3): es una tensión que hay que explicar
  (registro en cadena a favor del usuario, pero sin poder sacarlo), no un error probado.

#### c) CySEC (supervisor de origen)

- **Ruta:** `https://www.cysec.gov.cy/en-GB/entities/investment-firms/cypriot/46172/`
- **Dato:** licencia 344/17 del 27/11/2017. Dominio aprobado
  `crypto.com/eea/financialservices`. Servicios transfronterizos en 29 países del
  EEE, **España incluida**: recepción y transmisión, ejecución, cuenta propia, gestión
  de carteras y asesoramiento, sobre los instrumentos 1 a 10.
- **Fecha:** registro vivo hoy.
- **Confirmado:** 15:19:22 UTC (página dinámica; el dato es el mismo).

#### d) CNMV (supervisor de destino)

- **Rutas** (con `accept-language: es`):
  - `https://www.cnmv.es/portal/Consultas/ESI/ESISExtranjerasLP.aspx?tipo=CLP&numero=4485`
  - `…&vista=17` (servicios)
  - Listado: `https://www.cnmv.es/portal/Consultas/listadoentidad?id=1&tipoent=4`
- **Dato:** FORIS CAPITAL CY LIMITED, n.º 4485, inscrita el 19/01/2018, libre
  prestación desde Chipre. Servicios 1 a 5 sobre los instrumentos 1 a 10 (con
  derivados). Auxiliares: custodia (1), crédito (2), cambio de divisas (4) e
  informes de inversiones (5).
- **Confirmado:** 15:19:24 UTC (`031f36b7…a9d5`, igual al del experto).
- **Cuidado:** los auxiliares **no** son solo el cambio de divisas.

#### e) FSMA (Bélgica)

- **Ruta:** `https://www.fsma.be/en/party/foris-capital-cy` (`31fa6bfc…4ef2`).
- **Dato:** «Foris Capital CY», libre prestación en Bélgica desde el 07/05/2026, con
  MiFID A1-A5 y B1, B2, B4 y B5. Solo prueba Bélgica; España la prueba la CNMV.
- **Confirmado:** 15:19:27 UTC.

#### f) App Store española (API pública de iTunes)

- **Ruta:** `https://itunes.apple.com/lookup?id=1262148500&country=es`
- **Dato:** «Crypto.com: Opera cada mercado», versión 3.244.01, publicada el
  11/11/2026 a las 01:49:40 UTC. En castellano anuncia acciones tokenizadas «desde
  1 USD», «0 USD de comisión por tiempo limitado» y «respaldo 1:1», con el aviso
  legal de FCCY 344/17 y la frase «consulta aquí el KID». El enlace al KID no viene.
- **Confirmado:** 15:19:27 UTC (JSON dinámico; el contenido es el mismo).
- **Cuidado:** que España esté en el pasaporte no garantiza que el producto se
  ofrezca aquí. La ficha española de la tienda sí lo anuncia en castellano.

---

## 3. Lo que sigue sin ruta y qué haría falta

| Falta | Por qué no hay ruta | Qué haría falta |
|---|---|---|
| Que la web de Midas deja darse de alta hoy a un residente en España | La web está tras Cloudflare; el alta pide wallet y KYC | Que el responsable del proyecto abra `midas.app` desde España en su navegador, con capturas, sin darse de alta. O pedirlo por escrito a Midas. Mientras, el estado es «confirmado con condiciones» por documento. |
| Texto literal de la web de Midas sobre España | Solo en la Wayback (copias del 22/10/2026 y 15/04/2026), que corta desde nuestra salida | Abrir la copia desde otra red (el navegador del responsable) y citarla con su fecha. |
| APY «oficial» de la web de Midas | Su API interna está fuera de límites | Nada: el oráculo en cadena es la fuente primaria y basta. |
| Que el oráculo es el VL del Agente de Cálculo (y por tanto neto de la comisión del 5 %) | Ningún documento leído hoy lo dice | Pedirlo por escrito a Midas, o encontrarlo en `docs.midas.app` cuando responda. |
| Producto de los ISIN DE000A4AXH53, DE000A4AXQV4, DE000A4AXS50, DE000A4AXS43 y DE000A4AYDK3; ISIN y documentos de mGLOeuro | La página de documentos de `docs.midas.app` daba 403 | Reintentar `docs.midas.app/llms-full.txt` (a las 15:29 volvió a dar 200) y buscar los enlaces del CDN; si no, pedirlo por escrito a Midas. |
| Que el compartimento Smart Cash Euro (FR0014015LD3) se comercializa en España según un registro español | La CNMV no inscribe compartimentos (Circular 2/2011) y la comunicación fiscal no se publica | Escrito de la CNMV (oficina de atención al inversor), de Spiko o de Aldana Capital. Lo tiene que pedir el responsable del proyecto. |
| Países y clases del compartimento en AMF GECO | GECO no los publica | Pedirlo a Spiko por escrito. |
| Calificación de S&P (AAAf/S1+) de Spiko Smart Cash Euro | S&P pide registro | Solo con cuenta en S&P: decide el responsable del proyecto. Mientras, citar el blog de Spiko como fuente del emisor. |
| Historial de la tabla de países de Spiko | La Wayback no tiene copias anteriores al 04/11/2026 | Pedir a Spiko la fecha en que añadió España. |
| Por qué la API de Spiko pone 1.000 € de mínimo a la clase EUR (FR001400SBD3), si el folleto dice 1 € | Ninguna fuente pública lo explica | Pedirlo a Spiko por escrito. |
| Si en Brickwise se puede comprar solo una parte de una orden de venta | Las fuentes oficiales se contradicen y la API no muestra ningún caso. La única prueba directa es comprar, y eso pide cuenta | Pedirlo a Brickwise por escrito. Mientras, publicar «orden de venta más barata publicada hoy, más el 1,5 %». |
| Si cada emisión de Brickwise se ofrece a residentes en España | Solo consta el pasaporte de Effecta (CNMV n.º 5003); no hay agentes en España | Pedirlo a Brickwise o a Effecta por escrito. Mantener «no confirmado». |
| KIIS de las emisiones de CrowdedHero: países de la oferta y comisiones (parte G) | Solo la ven inversores verificados | Pedirla a CrowdedHero por correo (el art. 23 del ECSPR obliga a darla a los posibles inversores; si se niegan, también es un dato). O preguntar a la CNMV si ha recibido notificaciones de ofertas en España. |
| Cifras de Simpleros S.L. de 2025 («1,96 M de ventas, 202.505 € de beneficio» según la ficha) | Las cuentas del Registro Mercantil son de pago y piden alta | Nota simple o cuentas del Registro Mercantil de Barcelona. Decide el responsable del proyecto. |
| Que BALVORA Group no está en concurso | El verificador no repitió esa consulta | Repetir `datastore_search` del recurso `8065ad80-1a4d-4afb-b1d1-d93b9a62b1cc` con `q=42103079662` y que lo confirme otro verificador. |
| Si CrowdedHero tiene un seguro que cubra los requisitos del art. 11 del ECSPR | Ninguna fuente pública lo dice | Pedirlo a CrowdedHero o a Latvijas Banka por escrito. |
| KID de las acciones tokenizadas de Crypto.com | La página de divulgaciones del EEE filtra por país; las condiciones dicen que se da «via the Crypto.com App» | Que el responsable del proyecto abra `crypto.com/eea/financialservices/disclosures` desde España en su navegador, con capturas y sin darse de alta. O pedirlo por escrito. Nunca con VPN o proxy. |
| Lista de países excluidos de Crypto.com («Tokenized Stocks FAQs», 3.1(d)) | No aparece en el centro de ayuda público | Pedirla por escrito a Crypto.com (Foris Capital CY). |

### Rutas rechazadas por el verificador (no se usan)

Las de Midas y Spiko Smart Cash están al final de sus apartados (2.1 y 2.2).

| Plataforma | Ruta rechazada | Por qué |
|---|---|---|
| Spiko · Letras | Wayback Machine para `public-api.spiko.io/v0/share-classes/` | `archive.org/wayback/available` no tiene copias y el CDX corta la conexión (15:16:39–15:16:59 UTC). No da ningún dato. La copia del repositorio (01/11/2026) es interna, no una fuente pública fechada. |
| Brickwise | Wayback Machine (CDX de `cdn.brickwise.at/legal/*`) | Corta la conexión (15:21:45 UTC, código 000). No da ningún dato. |
| Brickwise | Cadena Brickprotocol (`explorer.brickprotocol.com` y nodos `node.`, `nodes.` y `api.brickprotocol.com`) | El explorador es una aplicación sin datos legibles y los tres nodos no responden (000). No hay prueba en cadena de ventas parciales. El hash que dio el experto era el del HTML vacío. |
| CrowdedHero | Wayback Machine (CDX de `crowdedhero.com`) para sacar copias de la KIIS | **Límite firme.** La plataforma reserva la KIIS a inversores verificados. El control de seguridad lo bloqueó. No se reintenta. |
| CrowdedHero | Lista de criptovalores de BaFin (§20(3) eWpG) y registro de `bank.lv` | La URL antigua de BaFin da 404. `bank.lv` corta la conexión; no se insiste. No dan el dato. |
| Crypto.com | Wayback Machine (`archive.org/wayback/available?url=crypto.com/eea/financialservices/disclosures`) | La única copia es del 27/04/2026, anterior al producto (condiciones del 11/08/2026). No puede tener su KID. |
| Crypto.com | Sitemap y páginas por idioma (`/es-es/disclosures`, `/en-es/eea-tokenized-stocks`) | El sitemap existe, pero esas páginas dan 404 desde aquí: es un filtro por país. No se salta (ni VPN ni proxy). |

---

## 4. Orden de rutas para una web nueva que bloquee

Ve en este orden y para cuando tengas el dato con fuente primaria y fecha.

1. **Anota el bloqueo.** Una sola petición normal con `curl`. Guarda código,
   cabecera `server` y `cf-mitigated`, SHA-256 y hora UTC. Si es un desafío,
   no hay segundo intento.
2. **Otros dominios oficiales del emisor.** `docs.`, `help.`, `support.`, `status.`,
   `blog.`, `press.`; `/llms.txt`, `/llms-full.txt`, `/sitemap.xml`, `/robots.txt`
   (solo para encontrar el mapa). Puede que el bloqueo sea intermitente: vuelve a
   probar más tarde, con la misma petición normal.
3. **Documentos legales en su CDN.** GitBook (`*.gitbook.io/~/files/…?alt=media`,
   `content.gitbook.com`), Notion público, S3/CloudFront del emisor. Solo enlaces
   que aparezcan en una página pública o en el buscador; no se adivinan.
4. **Supervisores y registros.** Primero el del país de origen (aprobación del
   folleto o licencia); luego ESMA (folletos por ISIN o LEI, registro MiCA, DLT,
   comercialización transfronteriza), la CNMV (pasaportes, IIC extranjeras, otra
   información relevante) y los de los países de acogida (MFSA, AFM, FSMA, FSC,
   CSSF, BaFin, CBI…), que a menudo publican copias del folleto. El BOE explica
   por qué un registro no muestra algo. Mira también las publicaciones obligatorias
   (p. ej., el registrador de criptovalores alemán publica los términos de cada
   emisión) y los registros mercantiles con datos abiertos (BORME, data.gov.lv).
5. **Datos en cadena.** Si el producto es un token: direcciones de la documentación
   del emisor, comprobadas en cadena (el contrato que las usa) y con código
   verificado (Sourcify, Etherscan). Lectura con `eth_call` en un nodo público.
   Fecha del dato = fecha del bloque o de la ronda.
6. **API públicas documentadas del emisor** (las que su documentación dice que no
   piden autenticación). Nunca las internas con token.
7. **Agregadores públicos** (DefiLlama, CoinGecko, rwa.xyz) **solo para contrastar**.
   No para comisiones ni condiciones.
8. **Fichas de tiendas de apps** (`apps.apple.com`, API de búsqueda de iTunes,
   `play.google.com`) para saber si la app existe en la tienda española.
9. **Prensa oficial** del emisor o de sus socios: foto de una fecha.
10. **Wayback Machine** al final y siempre con la fecha de la copia. Nunca para
    documentos que la plataforma reserva a inversores verificados.
11. **Si no hay ruta:** dilo en la ficha («no verificable hoy») y deja anotado qué
    haría falta (mirarlo desde España, pedir el documento por escrito).

Para cada dato, guarda: URL, hora UTC, código HTTP, tamaño, SHA-256 y la fecha
**del dato** (que no es la de la lectura).

---

## 5. Salida de `comprobar-rutas.mjs` del 11/11/2026, 15:41:39 UTC

Orden: `node comprobar-rutas.mjs` (sin `--guardar`). Empezó a las 15:41:31 UTC y
tardó 7,1 s. Resultado: **76 de 76 rutas vivas**, más los dos controles de Midas.
Código de salida 0. Salida tal cual:

```
Comprobación de rutas · 2026-11-11T15:41:39Z · 7.1 s · vivas 76/76

[VIVA] midas/rpc-oraculo-y-boveda  HTTP 200  1033 B  sha256 a921c5a9a1e38842…  2026-11-11T15:41:32Z
    bloque 26392644 (2026-11-11T15:41:23Z); oráculo ronda 492: 1.07768132 USD del 2026-11-10T18:40:23Z; circulante en Ethereum 66135847 mTBILL; bóveda inmediata sin pausar; límite diario 10000000 mTBILL; comisión inmediata 7 pb; mínimo 1 mTBILL; USDC en Superstate 8500009 (capacidad inmediata de momento, no garantizada)
[VIVA] midas/mfsa-folleto-base  HTTP 200  1530534 B  sha256 a8fd63202caeccf1…  2026-11-11T15:41:31Z
    mismo hash que el 11/11
[VIVA] midas/gitbook-condiciones-finales-mtbill  HTTP 200  1248073 B  sha256 b1e58001ec0f688a…  2026-11-11T15:41:31Z
    mismo hash que el 11/11
[VIVA] midas/gitbook-kid-mtbill-es  HTTP 200  154610 B  sha256 6c22870917cda81e…  2026-11-11T15:41:32Z
    mismo hash que el 11/11
[VIVA] midas/esma-folletos-isin-mtbill  HTTP 200  4419 B  sha256 0d8650f52f7ffd58…  2026-11-11T15:41:31Z
    documentos=3; último=FTWS-1420 (2026-07-17)
[VIVA] midas/esma-folletos-lei-midas  HTTP 200  57763 B  sha256 5e288cdb07b1c91c…  2026-11-11T15:41:33Z
    documentos=41 (el 11/11 eran 41); último=FTWS-2788 (2026-10-26)
[VIVA] midas/cnmv-pasaportes-midas  HTTP 200  216411 B  sha256 6890ae90ba7ece40…  2026-11-11T15:41:31Z
    mismo hash que el 11/11
[VIVA] midas/rwaxyz-mtbill  HTTP 200  242947 B  sha256 c906486f1350c1ca…  2026-11-11T15:41:31Z
    APY 30 d=3.44 % (solo contraste; no usar sus comisiones)
[VIVA] midas/defillama-serie-mtbill  HTTP 200  24627 B  sha256 7f9c678701ed982f…  2026-11-11T15:41:31Z
    último 2026-11-11: apy=2.41 tvl=71273367
[VIVA] midas/defillama-precio-mtbill  HTTP 200  159 B  sha256 947e8e1e7ca92033…  2026-11-11T15:41:31Z
    precio=1.07768132 USD
[VIVA] midas/coingecko-mtbill  HTTP 200  29177 B  sha256 0350b04c01c59c4e…  2026-11-11T15:41:31Z
    precio=1.078 USD; capitalización=72857965
[VIVA] spiko/boe-circular-2-2011  HTTP 200  64208 B  sha256 3acd992c646803f4…  2026-11-11T15:41:31Z
[VIVA] spiko/cnmv-ficha-spiko-sicav  HTTP 200  151261 B  sha256 2416fae7d0f137bd…  2026-11-11T15:41:33Z
[VIVA] spiko/cnmv-otra-info-relevante  HTTP 200  212488 B  sha256 6a2d0c7f5e701bf8…  2026-11-11T15:41:33Z
[VIVA] spiko/afm-spiko-sicav  HTTP 200  61058 B  sha256 eff0964ff47ea127…  2026-11-11T15:41:31Z
[VIVA] spiko/fsma-spiko-json  HTTP 200  2087 B  sha256 5ef1227ae67d6270…  2026-11-11T15:41:31Z
    mismo hash que el 11/11
[VIVA] spiko/fsc-bulgaria-medios  HTTP 200  27448 B  sha256 51b90eabf3541495…  2026-11-11T15:41:31Z
    9 documentos; último 2026-10-26 (el 11/11 eran 9, último 26/10)
[VIVA] spiko/spiko-docs-paises  HTTP 200  32104 B  sha256 cc8069ac232c1e77…  2026-11-11T15:41:31Z
    mismo hash que el 11/11; Last updated: October 23, 2026
[VIVA] spiko/esma-cbdif-spiko  HTTP 200  200 B  sha256 17cd55819b19e2f6…  2026-11-11T15:41:35Z
    resultados=0 (0 no prueba nada: la base no tiene SPIKO SICAV)
[VIVA] spiko/amundi-nota-safo  HTTP 200  67288 B  sha256 d533fb4a7727f561…  2026-11-11T15:41:31Z
[VIVA] spiko-letras/api-eurUSTBL-totales  HTTP 200  428 B  sha256 50af02a599de2517…  2026-11-11T15:41:31Z
    acciones=10000; titulares=1; VL 1.023045 EUR del 2026-11-10; órdenes=10000 EUR (el 11/11: 10000 acciones y 1 titular)
[VIVA] spiko-letras/api-eurUSTBL-historial  HTTP 200  212832 B  sha256 9d405a3d89fbc5bd…  2026-11-11T15:41:32Z
    497 días (2024-11-07 a 2026-11-10); último cambio de acciones o titulares: 2024-11-13 (el 11/11: 2024-11-13)
[VIVA] spiko-letras/api-eurUSTBL-ficha  HTTP 200  2141 B  sha256 999fa7beb7d196bc…  2026-11-11T15:41:33Z
    minimumInitialSubscription=1000 (el folleto del 01/09/2026 dice 1 EUR)
[VIVA] spiko-letras/api-USTBL-totales  HTTP 200  475 B  sha256 5ddfe79761dd85b4…  2026-11-11T15:41:33Z
    titulares=881; activos=174085623.17 USD; VL 1.102496 USD del 2026-11-10
[VIVA] spiko-letras/docs-api-sin-autenticacion  HTTP 200  23857 B  sha256 bac58183081f4b27…  2026-11-11T15:41:32Z
[VIVA] spiko-letras/docs-productos-disponibles  HTTP 200  26381 B  sha256 4be804a880bb3623…  2026-11-11T15:41:33Z
    mismo hash que el 11/11
[VIVA] spiko-letras/docs-cambio-divisa  HTTP 200  35057 B  sha256 44ffba9a0f645279…  2026-11-11T15:41:33Z
    mismo hash que el 11/11
[VIVA] spiko-letras/web-es-letras-dollar  HTTP 200  195204 B  sha256 da4d37cea7f5f93f…  2026-11-11T15:41:31Z
    mismo hash que el 11/11
[VIVA] spiko-letras/data-spiko-ustbl  HTTP 200  51653 B  sha256 986c3b5454c54ace…  2026-11-11T15:41:31Z
    mínimo inicial 1 USD (página dinámica: se mira el texto)
[VIVA] spiko-letras/geco-ultimo-vl-SBD3  HTTP 200  511 B  sha256 82dedb129bfbe335…  2026-11-11T15:41:31Z
    VL 1.02305 EUR del 2026-11-10; acciones=10000
[VIVA] spiko-letras/geco-clases-c79398  HTTP 200  1489 B  sha256 b7e9c49d7f3bccdf…  2026-11-11T15:41:32Z
[VIVA] spiko-letras/geco-lista-documentos  HTTP 200  672 B  sha256 8de6426fee19e220…  2026-11-11T15:41:32Z
    3 documentos; último folleto: 438274 «Spiko SICAV_Prospectus vFR 2026.09.01.pdf» con efecto 2026-09-01 (el 11/11: 438274, 2026-09-01)
[VIVA] spiko-letras/geco-informe-semestral-429960  HTTP 200  273743 B  sha256 3c55af880c642271…  2026-11-11T15:41:33Z
    mismo hash que el 11/11
[VIVA] spiko-letras/geco-folleto-438274  HTTP 200  2150362 B  sha256 940559b4976a6837…  2026-11-11T15:41:33Z
    mismo hash que el 11/11
[VIVA] spiko-letras/folleto-en-spiko  HTTP 200  1734485 B  sha256 7457e79f285397aa…  2026-11-11T15:41:31Z
    mismo hash que el 11/11
[VIVA] brickwise/pagina-contratos  HTTP 200  42843 B  sha256 0218f969a201e7ab…  2026-11-11T15:41:31Z
[VIVA] brickwise/condiciones-de-uso-pdf  HTTP 200  159247 B  sha256 38067d75c7f3d09c…  2026-11-11T15:41:31Z
    mismo hash que el 11/11
[VIVA] brickwise/guia-vender  HTTP 200  51661 B  sha256 5104128136086df5…  2026-11-11T15:41:32Z
    mismo hash que el 11/11
[VIVA] brickwise/faq-handel-marktplatz  HTTP 200  56675 B  sha256 52d2e52750799577…  2026-11-11T15:41:32Z
    mismo hash que el 11/11
[VIVA] brickwise/faq-wie-kann-ich-investieren  HTTP 200  56640 B  sha256 2d34986c29dbc401…  2026-11-11T15:41:32Z
    mismo hash que el 11/11
[VIVA] brickwise/app-js-publico  HTTP 200  512911 B  sha256 b5c9c15438379efc…  2026-11-11T15:41:31Z
    mismo hash que el 11/11
[VIVA] brickwise/api-v1-assets  HTTP 200  236533 B  sha256 07e4a2ed4afad884…  2026-11-11T15:41:31Z
    422 ventas y 95 compras abiertas (el 11/11: 424 y 95); tipo bulletin; 309 ventas con más de un año; orden de venta más barata publicada + 1,5 %: Plüddemanngasse 100,48 € (1×99), Sonnleithnergasse 81,20 € (1×80), Klagenfurt 96,43 € (1×95), Stallhofstraße 69,83 € (1×68.8), Schwarzer Weg 70,95 € (1×69.9), Drautal 85,26 € (1×84), Randhartingergasse 79,17 € (1×78), Hinterstoder 91,35 € (1×90), Pottendorfer 116,73 € (1×115), GreenPoint 121,80 € (1×120), Cohotel 446,60 € (4×110)
[VIVA] brickwise/faq-marktwert  HTTP 200  55525 B  sha256 f6046b832e7a8093…  2026-11-11T15:41:32Z
    mismo hash que el 11/11
[VIVA] brickwise/cnmv-effecta-5003  HTTP 200  217226 B  sha256 d5cd17ff146bb06d…  2026-11-11T15:41:35Z
[VIVA] brickwise/cnmv-effecta-programa  HTTP 200  217942 B  sha256 8f61127378c96593…  2026-11-11T15:41:36Z
[VIVA] brickwise/cnmv-effecta-agentes  HTTP 200  217424 B  sha256 eae65b635ff34888…  2026-11-11T15:41:36Z
[VIVA] crowdedhero/borme-simpleros-2020  HTTP 200  334151 B  sha256 39fcba8e188fdf9a…  2026-11-11T15:41:32Z
    mismo hash que el 11/11
[VIVA] crowdedhero/simpleros-condiciones-generales  HTTP 200  65596 B  sha256 48b4c80bf9346688…  2026-11-11T15:41:31Z
[VIVA] crowdedhero/lv-registro-balvora  HTTP 200  2015 B  sha256 bcf53f52dd721cad…  2026-11-11T15:41:31Z
    SIA "BALVORA Group"; alta 2017-04-06; baja ninguna
[VIVA] crowdedhero/lv-registro-crowdedhero  HTTP 200  2014 B  sha256 67ed8f8f0d5a4878…  2026-11-11T15:41:32Z
    SIA "CrowdedHero Latvia"; alta 2021-04-13; baja ninguna
[VIVA] crowdedhero/lv-ejercicios-balvora  HTTP 200  4274 B  sha256 5ebd62f1d9a7f482…  2026-11-11T15:41:33Z
    último ejercicio presentado 2025 (statement 2340045, presentado 2026-06-08)
[VIVA] crowdedhero/lv-ejercicios-crowdedhero  HTTP 200  2895 B  sha256 19d39c730d1c3228…  2026-11-11T15:41:34Z
    último ejercicio presentado 2025 (statement 2269545, presentado 2026-05-26)
[VIVA] crowdedhero/lv-balance-2025  HTTP 200  2453 B  sha256 8aa7cb5a24f17197…  2026-11-11T15:41:34Z
    CrowdedHero Latvia: activo 35150 €, fondos propios -51085 €, deuda 86235 €; BALVORA Group: activo 546973 €, fondos propios -150078 €, deuda 697051 €
[VIVA] crowdedhero/lv-pyg-2025  HTTP 200  4084 B  sha256 8d03c2d350961490…  2026-11-11T15:41:35Z
    CrowdedHero Latvia: ventas 39322 €, resultado -68723 €; BALVORA Group: ventas 293258 €, resultado 21126 €
[VIVA] crowdedhero/ficha-simpleros-p50  HTTP 200  73357 B  sha256 cdc42a7ad2dc1921…  2026-11-11T15:41:31Z
    captado 82 500.00 € (82.3 %) de un mínimo de 100 250.00 €; quedan 3 días
[VIVA] crowdedhero/ficha-amber-p49  HTTP 200  104652 B  sha256 ca54b0490c36f2f6…  2026-11-11T15:41:33Z
    captado 1 000.00 € (2 %) de un mínimo de 50 000.00 €; quedan 34 días
[VIVA] crowdedhero/legal-riesgos  HTTP 200  78637 B  sha256 625b2bac6650809d…  2026-11-11T15:41:33Z
[VIVA] crowdedhero/legal-contrato-dlt  HTTP 200  92695 B  sha256 ab31c0493bac7db5…  2026-11-11T15:41:33Z
[VIVA] crowdedhero/bafin-busqueda-nyala  HTTP 200  24453 B  sha256 a03e220cd78c1ef7…  2026-11-11T15:41:31Z
    mismo hash que el 11/11
[VIVA] crowdedhero/bafin-smart-registry  HTTP 200  25984 B  sha256 851ce9e0d4d957dc…  2026-11-11T15:41:33Z
    mismo hash que el 11/11
[VIVA] crowdedhero/nyala-valores-electronicos  HTTP 200  206578 B  sha256 b0b4675d9331d097…  2026-11-11T15:41:31Z
[VIVA] crowdedhero/terminos-bono-simpleros  HTTP 200  99476 B  sha256 c0c445e493def11b…  2026-11-11T15:41:31Z
    mismo hash que el 11/11
[VIVA] crowdedhero/esma-ecsp-crowdedhero  HTTP 200  1486 B  sha256 8648122fa7b37932…  2026-11-11T15:41:35Z
    SIA CrowdedHero Latvia: Active; acogida EUROPEAN UNION; autorizada 16/08/2022; actualizado 22/02/2024
[VIVA] crowdedhero/cnmv-psfp-crowdedhero  HTTP 200  150697 B  sha256 fe578b1438a90bc3…  2026-11-11T15:41:37Z
    mismo hash que el 11/11
[VIVA] cryptocom/condiciones-ue-fccy  HTTP 200  217691 B  sha256 1169bff5d9a4deaf…  2026-11-11T15:41:31Z
    mismo hash que el 11/11
[VIVA] cryptocom/politica-eventos-corporativos  HTTP 200  107211 B  sha256 06d4eac0142ce673…  2026-11-11T15:41:32Z
    mismo hash que el 11/11
[VIVA] cryptocom/declaracion-riesgos-fccy  HTTP 200  99578 B  sha256 8d5a498fe8787ae0…  2026-11-11T15:41:32Z
    mismo hash que el 11/11
[VIVA] cryptocom/ayuda-acerca-eee  HTTP 200  134254 B  sha256 c8501a3501b2fb39…  2026-11-11T15:41:31Z
[VIVA] cryptocom/ayuda-dividendos-eee  HTTP 200  137026 B  sha256 eab96029423f8c2d…  2026-11-11T15:41:32Z
[VIVA] cryptocom/ayuda-coleccion-eee  HTTP 200  103130 B  sha256 b39d8181f338adbb…  2026-11-11T15:41:33Z
    3 artículos (el 11/11 eran 3)
[VIVA] cryptocom/cysec-foris-46172  HTTP 200  627120 B  sha256 a8621ba084356fb5…  2026-11-11T15:41:31Z
[VIVA] cryptocom/cnmv-foris-4485  HTTP 200  217313 B  sha256 031f36b7773b5614…  2026-11-11T15:41:37Z
[VIVA] cryptocom/cnmv-foris-4485-servicios  HTTP 200  272066 B  sha256 966fe17043d86f7e…  2026-11-11T15:41:38Z
    mismo hash que el 11/11
[VIVA] cryptocom/fsma-foris  HTTP 200  159983 B  sha256 31fa6bfcd16c3691…  2026-11-11T15:41:31Z
    mismo hash que el 11/11
[VIVA] cryptocom/app-store-es  HTTP 200  11825 B  sha256 8e4dfc81a53fe589…  2026-11-11T15:41:31Z
    «Crypto.com: Opera cada mercado» 3.244.01 del 2026-11-11T01:49:40Z; anuncia acciones tokenizadas: sí; menciona el KID: sí
[sigue bloqueada] midas/control-midas-web  HTTP 403  5386 B  sha256 3dff2a0ff20925db…  2026-11-11T15:41:31Z
    403 cloudflare cf-mitigated=challenge
[ABIERTA ahora] midas/control-midas-docs  HTTP 200  217884 B  sha256 aca8b6c750158759…  2026-11-11T15:41:31Z
    200 cloudflare; mismo contenido que la copia de las 09:26 del 11/11: se puede leer con --guardar (petición normal, sin eludir nada)
[VIVA] spiko-letras/rpc-eurUSTBL-4-redes  HTTP 200  586 B  sha256 a971d9ebe60d58d1…  2026-11-11T15:41:32Z
    Ethereum 5000 (bloque 26392644); Polygon 5000 (bloque 97137490); Base 0 (bloque 56106583); Arbitrum 0 (bloque 523318328); total 10000 (el 11/11: 5000+5000+0+0 = 10000)

Resumen: /tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/acceso-fuentes/crudo/comprobar-rutas/2026-11-11T154139Z/resumen.json
```

Notas de esta pasada:

- Pasada anterior, 15:40:29 UTC: 74 de 76. Las dos rutas de BaFin dieron
  `HPE_INVALID_HEADER_TOKEN` por la cabecera partida (ver sección 1). Se pasaron a
  `curl` con su agente por defecto y a las 15:41 dieron 200 con el mismo hash que
  el experto y el verificador.
- Brickwise cambia durante el día: a las 15:20 había 424 ventas; a las 15:40, 422.
  La orden de 73 € de Pottendorfer ya no está; la más barata es ahora de 115 €.
- Las tres páginas de la CNMV de la primera versión dieron 500 a las 15:29:06Z
  porque `fetch` manda `accept-language: *`. Se corrigió mandando `accept-language: es`.
- Resúmenes: `crudo/comprobar-rutas/2026-11-11T154029Z/` y
  `crudo/comprobar-rutas/2026-11-11T154139Z/` (y los de las 15:29 de la versión anterior).

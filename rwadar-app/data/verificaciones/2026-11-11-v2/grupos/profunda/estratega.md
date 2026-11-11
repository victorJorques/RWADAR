# Estratega de búsqueda · huecos y pistas nuevas · 11/11/2026

Grupo `profunda`. Esto son pistas, no expedientes. Leí entre las 09:54 y las
10:06 UTC. Solo usé páginas, documentos, API y registros públicos: no inicié
sesión, no hice KYC, no conecté monederos, no rellené formularios y no usé git.
Las copias están en `fuentes/crudo/`, que no entra en Git porque el registro de
la BaFin y algunas webs llevan nombres de personas físicas. Aquí no cito
ninguno.

## En una frase

Lo que se podía encontrar por los caminos habituales ya está mirado. Hoy
encuentro un hueco de registro que nadie había abierto: **la lista de la BaFin
de agentes vinculados de Effecta GmbH**. Effecta es la misma empresa de
servicios de inversión que da a Brickwise el pasaporte a España (CNMV
n.º 5003). La lista tiene 45 agentes, y entre ellos salen **dos plataformas
tokenizadas nuevas para RWAdar: arttrade (arte) y winvesta (inmuebles)**.
Ninguna se puede admitir hoy: falta comprobar que un residente en España pueda
abrir cuenta. Las dejo con prioridad 3 de 5, donde 1 es la más alta.

## 1. Lo que ya está cubierto (10 y 11/11 y ciclos anteriores)

| Vía | Qué se miró | Dónde |
|---|---|---|
| Folletos con pasaporte a España (ESMA) | 208 emisores no españoles desde el 10/11/2025 y 219 documentos desde el 01/07/2026. Tokenizados: Backed/xStocks, Ondo, Robinhood RHJ, Midas, S01/ST0x, DeXentra/OilXCoin y Altarius. | candidatas-europa, ampliacion |
| Financiación participativa del EEE en España | Las 48–53 de la lista de la CNMV y sus portadas. Solo hay tokens en CrowdedHero y Profitus/Axiology. | candidatas-europa, barrido-registros |
| Financiación participativa española (27) y ERIR | Ursus-3 (23 emisiones, Hausera…), Minos (pagarés de Prosegur Cash) y Token City (Series A Grupo UAE). | candidatas-espana, vigilancia |
| Régimen piloto DLT (8 infraestructuras) | CSD Prague, 21X, 360X, Axiology, LISE, Securitize, Seturion y Bit2Me STX. | barrido-registros |
| MiCA (ARTZZ vacío; OTHER) | LCX Gold, DGLD, NatGold, APF Agrifund, Digital Energy y Fuse Energy. | barrido-registros |
| ESI del EEE en España (altas de 2025–2026) | IZNES, Taurus, Axiology, Spiko, One Trading, PM MTF, Webull, Finary, Backpack… | barrido-brokers |
| Brókers, bancos y exchanges | IBKR, Degiro, XTB, Scalable, Trade Republic, Revolut, N26, bunq, Bitpanda, Bitvavo, Bit2Me, Kraken, Bybit, OKX, Gate, Crypto.com, Coinbase, Gemini, Bitstamp, eToro, Assetera… | candidatas-mercados, barrido-brokers |
| Radar sin oferta (23 plataformas) | Securitize Stocks queda en vigilancia; las demás, sin oferta. | barrido-radar-sin-oferta |
| Suiza | Directorio de Aktionariat: [persona física recortada], Robin des Fermes, Revario… | suiza |
| Fondos tokenizados | Spiko, Amundi, Franklin, BUIDL, Azvalor, BBVA (sandbox), Generali y Schroders. | spiko, candidatas-mercados |

## 2. Huecos que busqué hoy y qué saqué

1. **Agentes vinculados de las empresas alemanas con pasaporte a España (BaFin, registro de agentes vinculados, datos a 10.11.2026).** Nadie lo había abierto. Brickwise entra en España como agente vinculado de Effecta, así que cualquier otro agente de Effecta puede tener la misma vía. La consulta da **45 agentes activos** (09:03 UTC, `bafin-effecta-vgv.html`). Los que tokenizan:
   - Brickwise: ya publicada.
   - Finexity Invest/VolksInvest: ya mirada. Solo vende en Alemania y hoy dice «Hier entsteht Ihr neuer Broker»; el traspaso de clientes empieza «voraussichtlich ab Dezember 2026».
   - **arttrade GmbH (n.º 80175757)**: nueva, pista 1.
   - **winvesta GmbH (n.º 80176451)**: nueva, pista 2.
   - **VB Token GmbH (n.º 80182079, desde el 27/01/2026)**: plataforma de Volksbank y Finexity, de 500 € en adelante. La nota de prensa del 27/04/2026 (EQS) la dirige a «retail customers of Volksbanken». Es un canal regional alemán y no la propongo.
   - Pendientes de identificar: LAIQON Token GmbH, Golden Circle Digital, Twelvebytwelve (su web devuelve 114 bytes), DDW Deutsche Digitale Wertpapiere Operations (TLS falla) y Achtstein Invest AG (alta del 27/10/2026; achtstein.com es otra empresa).

   Repetí la búsqueda con otras empresas alemanas con pasaporte a España (BN & Partners, DonauCapital y NFS Netfonds; Bankhaus Scheich y Upvest no tienen agentes). Ninguno de sus agentes tiene nombre de plataforma tokenizada; solo salen dos gestoras de inmuebles. **Effecta es el centro de la tokenización minorista alemana:** «more than 45 tied agents… Tokenised securities via the Group's infrastructure» (finexity-group.com/infrastructure/effecta, 10:01 UTC).
2. **Programas de «Blockchain-based Certificates» con folleto de Liechtenstein y pasaporte a España** (ESMA, 09:54 UTC). Nadie los había estudiado:
   - **Optima Financial UG** (BPWO-81, 22/05/2026, 50 documentos). Son certificados ligados a cestas de criptoactivos, no a activos reales. Fuera de alcance.
   - **NOEMON TECH LIMITED** (BPWO-71, 01/12/2025). Tiene el mismo título de programa y la AFM pone su ficha como «Last updated: 11 November 2026». No encontré el folleto. Lo más probable es que sea igual que Optima. **Hueco abierto:** hay que leer el folleto.
   - **BE BRAVE AG** (STDA-92): «Partizipationsscheine», no son tokens.
   - **SecurAsset**: titulización clásica (XS).
3. **Folletos pasaportados a España desde el 15/10/2026, sin las condiciones finales** (41 documentos, 10:00 UTC). El único tokenizado es el suplemento de RHJ del 09/11, que ya estaba visto. **Ondo Global Markets no tiene folleto base nuevo:** su último documento en ESMA son unas condiciones finales del 21/09/2026, y el folleto cumplía 12 meses hoy.
4. **Materias primas que no sean oro.** El registro MiCA OTHER tiene tokens ofrecidos en España con activo real que nadie había anotado:
   - **Steelcoin X** (SC Steelcoin GmbH, Viena; ficha del 20/10/2026). Su web dice «This crypto-asset has not been reviewed or approved by any competent authority», «As a utility token, one SCX grants a right of redemption for hot-rolled steel strip» y «Physical redemption … from a minimum quantity of one coil». El emisor no está supervisado (solo licencia comercial) y el reembolso solo es práctico para empresas. Descartada.
   - **TCG-Vault** (cartas coleccionables), **Water150** y **SUN AG**: no son instrumentos financieros y el emisor no está supervisado. Fuera de alcance.
5. **Arte con derechos económicos.** Hasta hoy solo se había mirado Artex, rechazada el 01/11. Splint Invest es suiza y no tiene licencia en la UE (fuente secundaria); Konvi no está en la lista de la CNMV. **arttrade llena este hueco** (pista 1).
6. **Fondos tokenizados españoles.** BBVA Token Renta Fija Corto Plazo sigue en el sandbox y solo para empleados (prensa de 2024; no hay nada nuevo). Azvalor ya estaba visto. Ninguna novedad.
7. **Distribuidores.** Revolut (mercados privados a través de un fondo, no tokenizado, en 2027), Bitpanda (acciones reales, no tokens; Steelcoin en 2024), Alpaca (licencia española B2B, sin producto para particulares), Trade Republic y Scalable: sin productos tokenizados para particulares. No los vuelvo a proponer.

## 3. Pistas nuevas

### Pista 1 · arttrade · bonos de arte tokenizados · prioridad 3

- **Entidad.** arttrade GmbH (Düsseldorf), agente vinculado de **Effecta GmbH** (BaFin n.º 80175757, activo desde el 01/12/2021). Effecta está en la CNMV con el n.º 5003, en libre prestación y solo para recibir y transmitir órdenes. Los bonos los emite una sociedad vehículo, p. ej. «arttrade custody 004 UG (haftungsbeschränkt)».
- **Producto.** Bonos subordinados con un derecho económico sobre obras de arte (artista único o cartera), emitidos como **criptovalores alemanes (eWpG)**. El registro lo lleva Cashlink Technologies y el token está en Polygon. Cada bono tiene su **documento de datos fundamentales (KID PRIIPs)** y sus condiciones, todos públicos.
  - KID de ATTRAM#03: «Risikoklasse 6», «Empfohlene Haltedauer: 03. Juni 2029», «Eine laufende Aufsicht besteht nicht».
  - Página de arttrade: «Bereits ab 1.000 € investieren Sie anteilig», «Emissionsgebühr in Höhe von 2 %». Se paga por transferencia bancaria y la plataforma crea la cartera digital.
- **Por qué interesa.** Es el primer producto de arte con derechos económicos que encuentro con KID, criptovalor inscrito y una entidad supervisada con pasaporte, la misma vía que ya aceptamos en Brickwise. Rellena un segmento vacío del catálogo.
- **Dudas.**
  1. No hay ninguna fuente que diga que un residente en España pueda abrir cuenta. La web solo cita los impuestos alemanes.
  2. Hay que saber qué emisión está abierta hoy. El KID más reciente que encontré, el de ATTRAM#03, empezó el 04/06/2024.
  3. Son bonos subordinados con «vorinsolvenzliche Durchsetzungssperre» de una sociedad vehículo pequeña.
  4. No hay mercado secundario: «Langfristig arbeitet arttrade an einem eigenen Zweitmarkt». Se cobra al vender las obras, a los 5 años, y el emisor puede alargarlo 2 años más.
  5. Los documentos solo están en alemán.
  6. En la CNMV, Effecta no tiene agentes notificados en España, y es la misma duda que con Brickwise.

### Pista 2 · winvesta · bonos inmobiliarios tokenizados con mercado secundario · prioridad 3

- **Entidad.** winvesta GmbH (Hamburgo), agente vinculado de **Effecta GmbH** (BaFin n.º 80176451, activo desde el 16/03/2022). La web dice: «Die winvesta GmbH ist ein gebundener Vermittler gemäß § 3 (2) WpIG der Effecta GmbH».
- **Producto.** Bonos tokenizados sobre inmuebles («tokenisierte Schuldverschreibung»). Proyecto abierto en portada: **Verde Beach São Francisco** (Portugal). Tiene un tramo «Junior» de 5.000 €, con un 5,50 % de interés previsto más una participación en beneficios, y vence en junio de 2028. La plataforma dice «ab 500 €» en general.
- **Salida.** Las preguntas frecuentes dicen: «Über unseren Sekundärmarkt besteht für Sie die Möglichkeit, mit ihren Token zu handeln … vollkommen gebührenfrei». También se puede cancelar antes del vencimiento recuperando solo el capital y el interés fijo.
- **Por qué interesa.** Es la misma vía regulatoria que Brickwise, con mercado secundario sin comisiones y un inmueble del EEE.
- **Dudas.**
  1. No hay ninguna fuente sobre si pueden comprar residentes en España.
  2. No encontré KID ni documento de emisión públicos. Según la web, los documentos solo se ven tras registrarse.
  3. El proyecto abierto no cumple lo de «mínimo asequible» (5.000 €).
  4. La rentabilidad es una previsión y el bono probablemente es subordinado (sin confirmar).
  5. Las cifras de la web vienen de la propia plataforma.

## 4. Avisos para el coordinador

- **Pistas del 10/11 que no están en la lista de vigilancia de hoy (§3):**
  - los bonos DLT de **CrowdedHero** (prioridad 2 en `barrido-registros.md`);
  - los **Stock Tokens de Robinhood RHJ** (en ESMA no hay nada nuevo después del suplemento del 09/11);
  - **Seturion con flatexDEGIRO y SG** (la búsqueda de hoy no encuentra ningún producto).

  Conviene añadirlos a la vigilancia para que no se pierdan.
- **Effecta y la CNMV.** El pasaporte de Effecta es «solo recepción y transmisión de órdenes», y en la pestaña «Agentes» de la CNMV no hay datos. Si un revisor concluye que los agentes vinculados alemanes no pueden captar clientes en España, eso afecta a Brickwise, que ya está publicada, y a las dos pistas de hoy. Es una pregunta de cumplimiento que vale la pena cerrar una vez para todas.
- **Finexity tiene el 90,1 % de Effecta** (pendiente del control de titularidad, según Cashlink en abril de 2026). La infraestructura y el centro de distribución de casi toda la tokenización minorista alemana dependen de un solo grupo cotizado.
- **Para el próximo ciclo:**
  - leer el folleto de NOEMON TECH (la AFM lo actualizó el 11/11);
  - identificar LAIQON Token, Golden Circle Digital, Twelvebytwelve, DDW y Achtstein Invest;
  - recorrer la lista de criptovalores que publica la BaFin según el § 20 de la eWpG, que no abrí hoy.

## 5. Consultas de hoy (copias en `fuentes/crudo/`, fuera de Git)

| Fuente | Archivo | Hora UTC | SHA-256 (16) |
|---|---|---|---|
| ESMA, documentos de Optima Financial UG | esma-39120039T7O75I0QGJ97.json | 09:54:45 | d27078d111dd516e |
| ESMA, documentos de NOEMON TECH | esma-254900JFRZG8P67ZHI74.json | 09:54:45 | 2b8bf074efb86a7c |
| ESMA, documentos de BE BRAVE AG | esma-894500OHY9QCQH1EVD36.json | 09:54:46 | 35300800cc67daa1 |
| ESMA, documentos de SecurAsset | esma-54930048RHLTJXAMT751.json | 09:54:48 | f3d6ea72f15ae647 |
| steelcoin.com | steelcoin.html | 09:56:47 | bf0629d84f0a52f7 |
| ESMA, Ondo Global Markets | esma-984500Z0Q6A5E8BE2B61.json | 10:00:21 | d3ce74f0a61f9116 |
| ESMA, Robinhood Assets (Jersey) | esma-984500ADFHQZ9D6B9A29.json | 10:00:22 | 81a951e166dcc4db |
| ESMA, folletos pasaportados a España desde el 15/10, sin condiciones finales | esma-es-noft-desde-1015.json | 10:00:43 | 2e0cfac1e85e444d |
| finexity-group.com, VolksInvest | fx-capital-markets_volksinvest.html | 10:01:25 | 6544407124bfb336 |
| volks-invest.de | volks-invest.de_.html | 10:01:35 | 72023a0d87c53c63 |
| BaFin, agentes vinculados de Effecta | bafin-effecta-vgv.html | 10:03:03 | 4af7bd7ea3385d5a |
| winvesta.de (portada) | home-winvesta.de.html | 10:03:21 | b1443c608dde83b8 |
| winvesta.de/faq | p-winvesta.de_faq.html | 10:03:42 | d484a1c93feace1d |
| arttrade.de/art-investment | p-arttrade.de_art-investment.html | 10:03:44 | bbc7eeb0865fabc5 |
| arttrade, condiciones de ATTRAM#03 | pdf/240604_ATTRAM03_Anleihebedingungen.pdf | 10:04:07 | 735721abfe0ffc17 |
| arttrade, KID de ATTRAM#03 | pdf/2512_ATTRAM03_Basisinformationsblatt.pdf | 10:04:07 | f6914ec191013a46 |
| BaFin, agentes de BN & Partners, DonauCapital y NFS | bafin-vgv-*.html | 10:05:24–10:05:30 | (en crudo) |

WebSearch y WebFetch solo sirvieron para descubrir pistas: Finexity/Effecta,
VB Token, la AFM para NOEMON, Revolut, Bitpanda, Splint, Seturion y Alpaca.
Ninguna afirmación de las pistas se apoya solo en ellos. La nota de VB Token
(EQS, leída con WebFetch) no es fuente primaria del producto.

# Noticias del sector · analista de mercado · 10/11/2026

Encargo: candidatas para una sección corta de noticias en Inicio (lo del día y
lo más importante de los últimos 30 días, del 11/10 al 10/11/2026). Consultas
del 10/11/2026 entre las 15:30 y las 15:36 UTC, con curl (agente de usuario
por defecto) y, solo para descubrir, WebSearch, WebFetch y el mapa del sitio
de Ledger Insights. Cada hecho se apoya en una fuente primaria abierta hoy.
Sin nombres de personas físicas. Copias de trabajo fuera del repositorio (en
el directorio temporal de la sesión); aquí van URL, hora y SHA-256.

Material del día leído antes: `grupos/ampliacion/barrido-*.md`,
`grupos/*/resumen-*.md` y `DECISIONES-COORDINADOR.md`. Lo que ya estaba allí
(RHJ, Amundi, Prosegur Cash, Bit2Me STX, Seturion) se ha vuelto a abrir hoy.

## Candidatas (orden propuesto)

| # | Fecha del hecho | Ámbito | Hecho | Fuente primaria | Hora UTC | SHA-256 |
|---|---|---|---|---|---|---|
| 1 | 10/11/2026 | Mundo | rwa.xyz: 40,01 mil M$ en activos reales tokenizados «distribuidos» (+0,02 % en 30 días); letras/fondos del Tesoro de EE. UU. 14,04 mil M$ (−5,58 % en 30 días); acciones 3,87 mil M$ (+11,06 %); materias primas (sobre todo oro) 5,43 mil M$ | https://app.rwa.xyz/ · /treasuries · /stocks · /commodities | 15:30:34–15:30:51 | 22ce9e43… (portada), d7d49089… (treasuries), 232a122b… (stocks), 153bee4c… (commodities) |
| 2 | 09/11/2026 | UE (España) | Suplemento del folleto de Robinhood Assets (Jersey) aprobado por la FMA de Liechtenstein: prevé nombrar a Robinhood Europe, UAB «Authorised Participant» de sus Stock Tokens | https://cdn.robinhood.com/assets/robinhood/legal/rhj_base_prospectus_supplement_09_november_2026.pdf | 15:33:42 | 978eea67a47d5bb63f184a1efa419118166301ee94806e94f91f3fec710d29b9 (igual que a las 09:20) |
| 3 | 06/11/2026 | España | CNMV inscribe a Minos Securities (grupo Prosegur) como ERIR de la «1ª Emisión de Pagarés Prosegur Cash 2026», 500.000 €, en registro DLT | https://www.cnmv.es/portal/consultas/esi/erir_esi.aspx?nif=A23875529&lang=es | 15:34:43 | 6d7eb7cbca433bc81f8489971315388b477626fe974a774dccf3573ff46721f0 |
| 4 | 05/11/2026 | UE | Amundi lanza una clase tokenizada de un fondo indexado de renta variable europea; la dirige a «institutional clients and digital platforms» | https://about.amundi.com/article/amundi-extends-tokenisation-index-investing | 15:33:42 | 23f2c19e9b9f67b19a53c346db5a3d7b5f68753d23e91045e8fe949e81a1f45f |
| 5 | 28/10/2026 | Mundo | DTCC (DTC) pone en marcha su DTCC Tokenization Service; 20 participantes firmados | https://www.dtcc.com/press-releases/2026/dtcc-tokenization-service-goes-live | 15:33:42 | 268277a5f2c6312189877ef095c271bedcf92958333122465e6576c5d4307391 |
| 6 | 27/10/2026 | España | ESMA lista a Bit2Me STX como sistema DLT de negociación y liquidación autorizado por la CNMV el 27/10/2026 | https://www.esma.europa.eu/sites/default/files/2026-01/Authorised_DLT_Market_Infrastructures.pdf | 15:34:28 | 8f223820d3223598b284c30a0556177fb40c0a9c31053d1a8f549055a830c1fc |
| 7 | 26/10/2026 | UE | El MEDE (ESM) emite su primer bono digital de 1.000 M€ liquidado en Pontes (Eurosistema) con Bundesbank y Clearstream | https://www.clearstream.com/clearstream-en/newsroom/261026-5660778 | 15:33:42 | e060e1a40c51c013f0c9c620d54a8a6075b95678313a7a647669bf217672167c |
| 8 | 26/10/2026 | Mundo | La SFC de Hong Kong aprueba la primera negociación secundaria 24/7 de fondos monetarios tokenizados para el público | https://apps.sfc.hk/edistributionWeb/gateway/EN/news-and-announcements/news/doc?refNo=26PR174 (texto leído por su API pública `api/news/content?refNo=26PR174`) | 15:35:28 | d2fd02d8817481b70b30c4d544779a0d80ad3d82c0d9d75c729e21a56852c42d (JSON de la API) |
| 9 | 20/10/2026 | UE | Börse Stuttgart obtiene de la BaFin la licencia DLT TSS para Seturion (ESMA la fecha el 16/10); socios: flatexDEGIRO, Nasdaq, Société Générale, SG-FORGE | https://group.boerse-stuttgart.com/en/seturion-blog/boerse-stuttgart-group-obtains-dlt-tss-license-and-lays-regulatory-basis-for-seturion/ | 15:34:11 | 0261a8285ecd738feae34ed764b98d5032200502b46c7f0804f6bdea282fee32 |
| 10 | 15/10/2026 | España | Iberdrola, BBVA y Santander: préstamo sindicado de 150 M€ gestionado entero en DLT (plataforma de ioBuilders) | https://www.bbva.com/es/empresas/iberdrola-bbva-y-santander-firman-la-primera-financiacion-sindicada-gestionada-en-su-totalidad-con-tecnologia-blockchain/ | 15:33:42 | 146cb7da9dc8f05405e9b4e0562bf7ca291d784cf36ae963b4b48fb316fef8e0 |

## Matices que la sección debe respetar

- **rwa.xyz** es un agregador privado (empresa), no un regulador. Sus cifras
  dependen de su definición («distributed» ≠ «represented»: 402,73 mil M$
  «represented», que no se debe sumar ni comparar). La caída de los fondos del
  Tesoro (−5,58 % en 30 días) es un dato del día, no una tendencia probada.
- **RHJ:** el suplemento dice «anticipates appointing … in the near future».
  Hoy el único oferente autorizado es Bitstamp Global Ltd (BVI) y la app
  española solo ofrece los Classic Stock Tokens (ver `barrido-novedades.md`).
  No es un producto disponible hoy.
- **Prosegur Cash:** la CNMV dice que la inscripción «no implica que la CNMV
  haya validado las condiciones de la emisión ni la información facilitada por
  el emisor». No hay documento ni condiciones públicas (DECISIONES §3).
- **Bit2Me STX:** la autorización es de infraestructura; no hay todavía
  emisiones públicas con documento (Bono Valorix sin documento, DECISIONES §3).
  La prensa fecha la noticia el 28/10; ESMA da el 27/10 como fecha de
  autorización. Uso la de ESMA.
- **Amundi:** sin ISIN, KID ni distribuidor para particulares
  (`candidatas-mercados`). La fecha de la página es «11.05.26» en formato
  mes.día.año; los metadatos dicen `2026-11-05T15:43:25+0100`.
- **Seturion:** el producto para particulares (estructurados de SG
  distribuidos por flatexDEGIRO) sigue anunciado, sin emisión ni folleto.
- **ESM:** bono mayorista; los inversores lo reciben en el sistema
  convencional de Clearstream. Cotización en LuxSE y admisión como colateral
  del Eurosistema son «expected», no hechos.
- **DTCC y SFC:** fuera de la UE. DTS es para participantes de DTC (no para
  particulares europeos). En Hong Kong los tokens no se pueden retirar de la
  plataforma (según prensa; la nota de la SFC no lo dice).
- **Iberdrola/BBVA/Santander:** préstamo entre bancos, no es un producto para
  particulares; importa como señal de adopción de la banca española.

## Miradas y no propuestas

- **Consejo de la UE, posición sobre el paquete de integración de mercados
  (límite del régimen piloto DLT a 300.000 M€):** según Ledger Insights fue el
  viernes 09/10/2026, fuera de la ventana de 30 días. No abrí la nota del
  Consejo. Importante para el sector; candidata si se amplía la ventana.
- **ESMA, dictamen sobre stablecoins no MiCA (08/10/2026)** y **convocatoria
  sobre colateral tokenizado en ECC (09/10/2026):** fuera de la ventana.
- **Hackeo de Binance (30/10/2026, 6.360 M$ según Ledger Insights)** y
  **sustracción de ~133 M$ a Crédit Mutuel Arkéa (01–04/11/2026)**: son
  incidentes cripto y bancarios, no de plataformas de activos reales; el
  segundo pasó por cuentas de Kraken, pero Kraken dice que no se originó en su
  plataforma. Sin fuente primaria abierta. No propuestos.
- **Incidentes de activos reales tokenizados (impagos, suspensiones de
  reembolso, hackeos) en la ventana:** no encontré ninguno con fuente. Las
  búsquedas devuelven casos de 2025 y de la primera mitad de 2026.
- **Schroders + Centrifuge (bono emergente en Solana, 04/11)**, **Janus
  Henderson JQQQ (27/10, profesionales, mínimo 100.000 USDC)**, **Generali
  (21/10, solo grupo; sin nota oficial)**: institucionales.
- **Schroders SOAR y BlackRock clases tokenizadas de UCITS monetarios:** las
  fechas del mapa del sitio de Ledger Insights eran de modificación; la prensa
  las sitúa en junio y julio–agosto de 2026. Fuera de la ventana.
- **NYSE (04/11) y Canton/Formation (09/11):** plataformas de EE. UU. pendientes
  de aprobación o sin acceso desde la UE.
- **Ondo:** su folleto base cumple 12 meses el 11/11 (`candidatas-mercados`);
  no lo volví a abrir hoy.

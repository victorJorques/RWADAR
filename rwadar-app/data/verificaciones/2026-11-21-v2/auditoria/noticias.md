# Auditoría independiente · noticias del 21/11/2026 (edición de las 17:00 UTC)

Ámbito: las 5 noticias de `https://rwadar.pages.dev/datos/noticias-v2.json`
(carpeta `rwadar-app/data/noticias-diarias/2026-11-21/`), contra su fuente
primaria de hoy. Todo abierto con `curl` y petición normal, sin cuenta ni
trucos, entre las 18:46:48 y las 18:53:00 UTC. Copias solo en
`/tmp/auditoria-2026-11-21/noticias/` (fuera del repositorio).

## En una frase

Las cinco noticias aguantan: cada cifra, fecha y enlace coincide con su
fuente de hoy y ninguna fecha visible está pasada ni es de «Hoy». No hay
nada **obligatorio**. Hay **cuatro mejoras de claridad** (recomendadas): en
dos resúmenes no queda claro quién hace qué (CNMV o BaFin; quién autoriza
Bit2Me STX), la de Robinhood se puede confundir con los «Classic Stock
Tokens» que RWAdar tiene en el catálogo, y la doble fecha de la fuente de
Bit2Me STX puede despistar.

## Lo que está publicado es lo que se revisó

- El archivo en vivo (HTTP 200, 18:46:48 UTC, 9.867 bytes) tiene el mismo
  SHA-256 que el del repositorio: `f76ee267…7b37`, el mismo que cita la
  verificación de la tarde.
- `/datos/noticias.json` (la app ya instalada) es idéntico quitando la foto.
- La portada en vivo trae prepintadas las tres primeras (CNMV 18/11, CNMV
  16/11, xStocks 11/11), igual que el archivo.
- Las 5 fotos responden en sus tres tamaños (15 respuestas 200, `image/webp`).

## Noticia a noticia

### 1 · «Oro y acciones sin folleto: tres avisos llegan de Alemania» (CNMV, 18/11/2026)

- Fuente: `https://www.cnmv.es/webservices/verdocumento/ver?t=%7bb0c4a848-4bd7-40b7-9b28-8f013ad97bc4%7d`
  · 200 · 18:47 UTC · PDF de 134.678 bytes · SHA-256 `6b1d350e…8820` (el mismo
  que el editor y el verificador).
- Literal: «18 de noviembre de 2026»; «BAFIN ha prohibido a Uniox Gold LLC la
  oferta al público de oro físico por no haber publicado EL FOLLETO…»; «BAFIN
  ha suspendido el ofrecimiento al público de valores en forma de acciones…»;
  «BAFIN tiene indicios que indican que … está ofreciendo un producto de
  inversión al público sin haber publicado EL FOLLETO…»; «la web de la CNMV
  ofrece un buscador de entidades advertidas».
- Comprobado: tres avisos, los tres de BaFin; fecha; nombre de la fuente;
  consejo del buscador.
- **Recomendada (claridad).** El resumen dice «La CNMV difunde tres avisos
  del supervisor alemán (BaFin). Prohibió a una firma…». Sin sujeto, en
  castellano «Prohibió» se lee como «la CNMV prohibió», y no fue la CNMV:
  fue BaFin. En inglés pasa lo mismo con «It barred…». Cambio exacto:
  - es: «La CNMV difunde tres avisos del supervisor alemán (BaFin). BaFin
    prohibió a una firma ofrecer oro físico al público y suspendió la oferta
    de acciones de otra, ambas sin el folleto exigido. De la tercera tiene
    indicios de que ofrece un producto de inversión sin él.» (264 caracteres)
  - en: «The CNMV relays three alerts from Germany's supervisor (BaFin). BaFin
    barred one firm from offering physical gold to the public and suspended
    another's share offer, both without the required prospectus. It has signs
    that the third offers an investment product without one.» (272)

### 2 · «9 firmas sin registro; dos imitan a firmas registradas» (CNMV, 16/11/2026)

- Fuente: `https://www.cnmv.es/webservices/verdocumento/ver?t=%7bf3fcb37a-091d-4f8b-b217-60ba8b126e7e%7d`
  · 200 · 18:47 UTC · 149.664 bytes · SHA-256 `d80481e5…d355` (el mismo).
- Conté las entidades una a una: 9. Dos llevan «(clon)»: una «No guarda
  relación con … EAF … debidamente registrada en España como Empresa de
  Asesoramiento Financiero» y otra «No guarda relación con … SCR …
  registrada en España como Sociedad de Capital-Riesgo». Literal del
  registro: «no figuran inscritas en el correspondiente registro de esta
  Comisión y, por tanto, no están autorizadas para prestar servicios de
  inversión».
- Sin hallazgos.

### 3 · «xStocks lanza tokens de más de 200 empresas europeas» (xStocks, 11/11/2026)

- Fuente: `https://xstocks.com/us/news/xstocks-brings-200-of-the-uk-and-eus-largest-companies-onchain`
  · 200 · 18:47 UTC · HTML de 51.355 bytes. El SHA-256 cambia en cada carga
  (hoy `200d6ad1…a1bc`), como ya anotó el verificador; el texto visible es el
  mismo. Fecha visible «November 11, 2026» y `datePublished` 2026-11-11.
- Literales que respaldan cada dato: «bringing tokenized equities for 200+ of
  the largest UK and EU-listed companies, and every constituent of the DAX
  40»; «Each xStock is backed 1:1 by the underlying share but represents
  economic exposure only, not direct ownership»; «available on Kraken, Kraken
  Pro, participating xStocks Alliance partners»; «The first non-US regional
  markets are live on xStocks»; «to eligible EU customers via Payward Europe
  Digital Solutions Ltd., a company authorised and regulated by the Cyprus
  Securities and Exchange Commission»; «xStocks are not, nor will they be
  registered with any local securities regulators»; «xStocks are issued by
  Backed Assets (JE) Limited»; el pie pone xStocks entre los servicios de
  Payward.
- El índice de noticias de xStocks (18:49:59 UTC) no tiene nada posterior del
  mismo tema que lo deje viejo.
- Sin hallazgos. (La nota cita a un directivo: la noticia no lo usa.)

### 4 · «Robinhood: el emisor podrá restarte Stock Tokens por costes» (09/11/2026)

- Fuente: `https://cdn.robinhood.com/assets/robinhood/legal/rhj_base_prospectus_supplement_09_november_2026.pdf`
  · 200 · 18:47 UTC · 2.208.721 bytes · SHA-256 `978eea67…29b9` (el mismo).
- Literales: «Supplement dated 09 November 2026»; «approved by the Financial
  Market Authority Liechtenstein (the "FMA") on 09 November 2026»; propósito
  (C) «pass on certain fees and costs … which may include proportionately
  reducing the number of Products held by such Investors»; condición 5.3
  «resulting in a decrease in the number of Products»; «the Effective Date
  shall be the date of this Supplement» para los «Existing Products».
- «Notificado a España»: la ESMA (registro público de folletos, 18:49:46 UTC)
  tiene el suplemento SUPP-69 del 09/11/2026, de Liechtenstein, pasaportado
  ese día a 29 países, **SPAIN** incluida.
- «Un plan que el folleto ya recogía en junio»: el folleto base original
  (`rhj_base_prospectus.pdf`, 18:49:36 UTC, SHA-256 `e3b4697a…db46`, fechado
  «25 June 2026») dice «The Issuer anticipates appointing Robinhood Europe,
  UAB as an Authorised Participant in the near future». Y hoy la página de
  proveedores del emisor solo nombra a Bitstamp Global Ltd como participante
  autorizado: sigue siendo un plan.
- «Acciones y ETF de EE. UU.»: el suplemento no lo dice con esas palabras,
  pero la FAQ del emisor sí («designed for global investors who want exposure
  to US capital markets», `docs.robinhood.com/rhj/faq`, 18:51:55 UTC) y las
  214 condiciones finales publicadas son de valores que cotizan en EE. UU.
  (miré dos dudosas, SK hynix y Anthropic: «Primary Exchange … Nasdaq Global
  Select Market»).
- **Recomendada (claridad).** RWAdar tiene en el catálogo la tarjeta
  `robinhood-classic-stock-tokens`, y la página española de Robinhood dice
  hoy (`https://robinhood.com/eu/es/invest/`, 18:52:11 UTC): «Classic Stock
  Tokens son contratos derivados entre tú y Robinhood» y «se ofrecen como
  derivados conforme a MiFID II». La noticia trata de otro producto: los
  «Stock Tokens» de Robinhood Assets (Jersey) Limited, que son «tokenized debt
  securities» y se compran «through Robinhood Wallet, decentralized exchanges
  (DEXs), or centralized exchanges (CEXs)» (FAQ del emisor). Con «restarte» y
  sin el emisor en el resumen, quien tenga Classic en la app puede creer que
  le van a restar tokens. Cambio exacto:
  - resumen es: «La FMA de Liechtenstein aprobó un suplemento al folleto de
    los tokens de deuda de Robinhood Assets (Jersey) Limited, ligados a
    acciones y ETF de EE. UU. y notificado a España. Deja al emisor repercutir
    costes, incluso restando tokens a cada inversor.» (250)
  - porQueImporta es: «Afecta también a los ya emitidos, desde el 9 de
    noviembre. No son los «Classic Stock Tokens» de la app de Robinhood, que
    son derivados con Robinhood Europe. Que esa filial sea participante
    autorizado ya era un plan del folleto de junio.» (236)
  - en (resumen): «Liechtenstein's FMA approved a supplement to the
    prospectus of the tokenised debt securities of Robinhood Assets (Jersey)
    Limited, tied to US shares and ETFs and notified to Spain. It lets the
    issuer pass on costs, even by cutting each investor's tokens.» (254)
  - en (porQueImporta): «It also applies to tokens already issued, from 9
    November. These are not the «Classic Stock Tokens» in Robinhood's app,
    which are derivatives with Robinhood Europe. Making that subsidiary an
    authorised participant was planned in June.» (234)
  - Ojo: la frase de los Classic sale de la página de Robinhood en España,
    no del suplemento. Si la norma de la edición obliga a que todo salga de
    la fuente citada, basta con el cambio del resumen (que nombra al emisor y
    sí está en el suplemento).

### 5 · «España ya tiene dos mercados de valores tokenizados» (CNMV, 28/10/2026)

- Fuente: `https://www.cnmv.es/webservices/verdocumento/ver?t=%7be319e419-ac2f-4812-9d69-01ed76101aee%7d`
  · 200 · 18:47 UTC · 97.216 bytes · SHA-256 `e09fadd3…7727` (el mismo).
- Literales: «28 de octubre de 2026»; «El Consejo de la CNMV ha autorizado el
  Sistema de Negociación y Liquidación, SNL, basado en Tecnología de Registros
  Distribuidos»; «será operada por Bit2Me Security Tokens Exchange STX, A.V.,
  S.A.»; «En Bit2MeSTX se podrán negociar acciones y bonos representados en
  TRD»; «Reglamento (UE) 2022/858 establece un régimen piloto».
- El «dos»: la lista de ESMA de infraestructuras DLT
  (`https://www.esma.europa.eu/sites/default/files/2026-01/Authorised_DLT_Market_Infrastructures.pdf`,
  18:50:21 UTC, SHA-256 `8f223820…c1fc`, la misma que usó el editor) tiene dos
  en España: «Securitize Europe DLT TSS … 26 November 2025» y «Bit2Me STX DLT
  TSS … 27 October 2026». En las notas de prensa de la CNMV (18:50:35 UTC) no
  hay otra autorización después del 28/10: la última nota es la del 18/11.
- «No consta ninguna emisión con documento público para particulares»: la
  página pública de Bit2Me STX (18:50:53 UTC) solo enseña el proyecto del
  sandbox («Valorix»), con un «documento de consentimiento informado para el
  Sandbox», no un folleto público. Es un negativo: ver «sin poder comprobar».
- **Recomendada (claridad).** El resumen empieza «Es un sistema…» sin decir
  qué ni quién lo autoriza (el diálogo de la web no enseña el título
  informativo). Además recorta la razón social. Cambio exacto:
  - es: «La CNMV ha autorizado Bit2MeSTX, un sistema de negociación y
    liquidación basado en registros distribuidos, del régimen piloto europeo.
    Lo operará Bit2Me Security Tokens Exchange STX, A.V., S.A. y en él se
    podrán negociar acciones y bonos tokenizados.» (250)
  - en: «The CNMV has authorised Bit2MeSTX, a DLT-based trading and
    settlement system under the EU pilot regime. It will be run by Bit2Me
    Security Tokens Exchange STX, A.V., S.A. and will allow trading in
    tokenised shares and bonds.» (223)
- **Recomendada (fecha que puede confundir).** La fuente visible dice «CNMV,
  nota de prensa del 28/10/2026 (ESMA la registra con fecha 27/10/2026)». En
  la lista de ESMA el 27/10 es el «Starting date of specific permission», no
  una fecha de registro, y la lista no está enlazada: el lector ve una fecha
  anterior a la de la nota sin saber por qué. Cambio exacto de
  `fuente.nombre`: «CNMV, nota de prensa del 28/10/2026 (en la lista de ESMA,
  con permiso desde el 27/10/2026)».

## Fechas visibles

Tarjetas: 18/11, 16/11, 11/11, 09/11 y 28/10/2026, cada una la del documento
de su fuente y todas dentro de los 30 días (desde el 22/10). Ninguna es de
hoy ni de ayer, así que no sale «Hoy» ni «Ayer». «Actualizadas el 21/11» y
«Consultada el 21/11/2026» son ciertas (todas las fuentes se abrieron hoy). El
plazo de desistimiento del suplemento de Robinhood (hasta el 12/11) ya pasó,
pero la noticia no lo menciona: no hay fecha vencida a la vista.

## Sin poder comprobar

- Que no haya ninguna emisión con documento público para particulares en
  Bit2Me STX (ni en Securitize): es un negativo. Miré la página pública de
  Bit2Me STX y las notas de la CNMV; no miré, emisor por emisor, los
  registros de folletos.

Nada de esto es una recomendación de inversión.

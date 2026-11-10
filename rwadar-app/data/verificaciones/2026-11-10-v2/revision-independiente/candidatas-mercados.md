# Revisión independiente · grupo candidatas-mercados · 10/11/2026

Yo no preparé estos expedientes. Volví a abrir las fuentes primarias entre las
**09:27 y las 09:44 UTC** del 10/11/2026 y busqué fallos en las cinco
candidatas, en los rechazos del 05/11 que el grupo da por «iguales» y en las
copias guardadas. Solo usé páginas públicas: sin sesión, sin KYC y sin
wallets. No he editado expedientes ni otros archivos del repositorio.

Mis copias (sin nombres de personas) están en
`revision-independiente/fuentes/candidatas-mercados/`, con su
`inventario-consultas.json` (URL, HTTP, hora, bytes y SHA-256). La respuesta
en bruto de ESMA está en `crudo/`.

## Resultado en una línea

**Aprobado con cambios.** Las cinco candidatas están bien rechazadas
(`no_admitir`) y no hay ninguna oferta que admitir ni que retirar. Hay que
corregir cinco cosas: dos licencias MiCA que no se mencionan, un
`disponibleEs` exagerado, varias frases internas de la tarjeta que no
coinciden con la fuente y nombres de personas que siguen en dos copias del
grupo.

No hay cambios críticos, ni `admitir_propuesta`, ni `retirar_propuesta`
que revisar en este grupo.

---

## 1. `coinbase-tokenized-stocks` · confirmado con cambios

**Comprobado hoy:**
- Folleto de NVDAc: `https://api.coinbase.com/v1/tokenized-stocks/prospectus/NVDAc.pdf`,
  que redirige al PDF del ADGM. HTTP 200, 509 páginas, **09:27:03 UTC**.
  SHA-256 `95df029c…2f54`, igual que el del investigador.
  - Portada: «approved by the FSRA as the Listing Authority of the ADGM … on 4 August 2026»
    y «is not for distribution in any jurisdiction other than in the ADGM».
    Validez: «valid until its expiry on 3 August 2027».
  - Oferta: «The Securities will be offered in the ADGM and only to Authorised
    Participants». Los Authorised Participants tienen que ser «Professional
    Client or Market Counterparty».
  - Matiz que el expediente no destaca: después de emitirse, los
    participantes «may make Securities available in DeFi Markets, including to
    retail investors». O sea, un particular puede conseguirlos en DeFi, pero
    no por una oferta en España.
  - Reembolso: «Vested Holders have the right to redeem Securities … Unvested
    Holders are not entitled to redeem». **«Vested Holder» no quiere decir
    «autorizado».** Es quien supera las «Vesting Conditions» (cond. 2.4(c)):
    procedimientos de cumplimiento, control de la wallet, cuenta bancaria y
    ausencia de sanciones.
  - Custodio Alpaca Securities LLC y riesgo «Holders can in no circumstances
    rely on the opportunity to sell Securities at a specific price or time»:
    confirmados.
- `https://blog.base.org/tokenized-stocks` (09:27:22 UTC): «Aug 24, 2026» y
  «tokenized stocks issued by Coinbase, built on the B20 standard, are now live
  natively on Base». Confirmado.
- `https://www.base.org/stocks` (Playwright, 09:28:46 UTC): «Available only in
  eligible jurisdictions outside the US». No publica la lista de países.
  Confirmado.
- CNMV, listado de empresas de inversión del EEE en libre prestación (09:29:59
  UTC): «COINBASE FINANCIAL SERVICES EUROPE LTD · 4854 - 23/10/2019 · CHIPRE».
  Confirmado.
- Advertencias de la CNMV, «Coinbase» (09:35:20 UTC): «No hay datos
  disponibles». Confirmado.
- Intenté rebatirlo buscando una venta en el EEE: help.coinbase.com y
  coinbase.com/es-es dan 403. La prensa de hoy no muestra ningún lanzamiento
  en el EEE.

**Correcciones:**
1. `resumenTarjeta.salida` dice «Solo reembolsan los tenedores autorizados».
   Es una mala traducción y se confunde con los «Authorised Participants».
   Texto propuesto (104 caracteres): «Solo reembolsa quien supera los controles
   de identidad del emisor; el resto depende de venderlos en DeFi».
2. En `motivoDecision` o en un claim, añadir que el folleto prevé reventa a
   minoristas en DeFi («including to retail investors»). La decisión no
   cambia: no hay oferta autorizada en España ni entidad de la UE que lo
   venda.

## 2. `amundi-core-stoxx-europe-600-tokenizada` · confirmado con cambios

**Comprobado hoy:**
- Nota de prensa en HTML y PDF (09:28:52 UTC). El SHA-256 del PDF,
  `c92bb075…1dd8`, es igual que el del investigador, pero **el PDF tiene 2
  páginas**, no 1.
  - «Paris, November 5th 2026» y «The new share class has been issued on the
    public Ethereum blockchain». Confirmado.
  - La frase de los institucionales dice: «ambition to progressively develop a
    range of tokenised funds to respond to the evolving needs of institutional
    clients and digital platforms». **Habla de la ambición de la gama, no dice
    que esta clase esté reservada a institucionales.** La nota tampoco dice
    quién puede comprarla, ni cómo, ni con qué ISIN, KID, mínimo o reembolso.
- Advertencias de la CNMV, «Amundi» (09:35:48 UTC): «No hay datos
  disponibles». Confirmado.
- Busqué para rebatirlo. La prensa (Ledger Insights, de pago, y otros) no da
  ISIN ni distribuidor; solo nombra a CACEIS como agente de tokenización. No
  hay fuente primaria con ISIN o KID de la clase.

**Correcciones:**
1. `resumenTarjeta.accesoEspana` y `motivoDecision` dicen que Amundi «la
   dirige a institucionales». Hay que ajustarlo a lo que dice la nota. Texto
   propuesto (92 caracteres): «No consta cómo comprarla: Amundi no publica
   ISIN, KID ni distribuidor de la clase tokenizada». En el motivo: «Amundi
   enmarca su gama tokenizada en las necesidades de "institutional clients
   and digital platforms"».
2. `documentos[1].paginas`: 2, no 1.

## 3. `blockchain-com-ondo-stocks` · confirmado con cambios

**Comprobado hoy:**
- Nota de la empresa vía EQS en gettex (09:29:51 UTC): «03.02.2026 / 19:50
  CET», «The issuer is solely responsible for the content», «Users across 30
  EEA states can now buy, sell, and hold over 200 tokenized U.S. stocks and
  ETFs via the DeFi wallet» y «self-custody solutions through our DeFi wallet».
  Confirmado.
- `https://docs.ondo.finance/ondo-stocks/eligibility.md` (09:29:39 UTC):
  SHA-256 `76916fd4…ed61`, igual que el 05/11. Para el EEE: «"Professional
  Client" under MiFID II … or "Qualified Investor"», y el requisito se aplica
  «in order to be issued Ondo Stocks». Confirmado: **la restricción es para
  la emisión.**
- `https://docs.ondo.finance/ondo-stocks/secondary-market-restrictions.md`
  (09:42:13 UTC, mismo SHA-256 que el 05/11). En reventa solo se exige no ser
  una «Prohibited Person» (EE. UU., sanciones…). El reembolso exige el KYC del
  emisor: «As a condition to redeeming any of its Tokens, a Token holder must
  satisfy the Issuer's customer due diligence».
- ESMA, folletos de Ondo Global Markets por LEI (09:29:29 UTC): BPWO-68 del
  11/11/2025 y suplementos del 05/05 y 28/08/2026. No hay folleto base nuevo.
  **Los tres documentos llevan España en `member_states`**: el folleto base
  está pasaportado a España, y eso el expediente no lo dice.
- CNMV, listado de empresas de inversión del EEE (09:29:59 UTC): 0 entradas
  con «BLOCKCHAIN». Confirmado.
- **Dato que falta**: en el registro MiCA de ESMA (`CASPS.csv`, 09:30:12 UTC)
  figura «Blockchain.com Operations (Malta) Limited · MFSA · autorización
  22/10/2025 · España en pasaporte: sí». Esa licencia es para criptoactivos.
  Las Ondo Stocks se emiten con folleto, son valores y quedan fuera de MiCA.
  La decisión no cambia, pero la frase «ninguna entidad suya figura en la
  CNMV» del resumen es demasiado amplia.
- Advertencias de la CNMV: «Blockchain.com» (09:34:03 UTC) sin datos; «Ondo»
  (09:36:21 UTC) solo con webs ajenas («LONDONBANK», «LONDONEX»…).
  Confirmado.

**Correcciones:**
1. Añadir a `registros` la autorización MiCA de Blockchain.com Operations
   (Malta) Limited (ESMA, MFSA, 22/10/2025, con pasaporte a España). Aclarar
   que no cubre valores como las Ondo Stocks. Cambiar «ninguna entidad suya
   figura en la CNMV» por «ninguna figura como empresa de servicios de
   inversión».
2. `disponibleEs: "excluido"` es exagerado. Ondo permite la compra en reventa
   salvo a las «Prohibited Persons», y la nota habla de los 30 Estados del EEE.
   Debe ser `no_confirmado`, explicando que la emisión y el reembolso exigen
   ser elegible ante el emisor (en el EEE, profesional o cualificado).
3. `resumenTarjeta.accesoEspana` («No como particular…»). Texto propuesto
   (111 caracteres): «Solo en reventa desde una wallet propia, sin entidad
   autorizada en España; el emisor solo emite a profesionales».
4. Anotar que el BPWO-68 está pasaportado a España. La limitación a
   profesionales la pone Ondo, no la falta de pasaporte.

## 4. `etoro-tokenized-stocks` · confirmado

**Comprobado hoy:**
- Nota del 29/07/2025 (09:37:54 UTC): «etoro today announced the forthcoming
  launch of US-listed equities as ERC20 tokens on the Ethereum blockchain».
  Confirmado.
- `https://www.etoro.com/investing/tokenized-stocks/` (09:37:54 UTC):
  «Updated: 08/09/2026» y «investors will be able to access tokenized versions
  of popular stocks». Confirmado: sigue en futuro, sin términos, KID ni emisor.
  Ojo: desde nuestra conexión la página sale con el aviso «It looks like
  you're in the United States».
- CNMV (09:29:59 UTC): «ETORO (EUROPE) LIMITED · 2534 - 13/04/2010 · CHIPRE».
  Confirmado.
- Advertencias de la CNMV, «eToro» (09:35:34 UTC): solo «VETOROBANC /
  HTTPS://VETORO.IO/» (13/01/2020). Confirmado.
- Busqué para rebatirlo: la prensa sigue siendo la de 2025 y no encontré
  ninguna fuente fiable de un lanzamiento en 2026.

**Correcciones menores** (no cambian el veredicto):
- En `registros[0].alcance`, «El pie de eToro cita la licencia CySEC 109/10»
  no está en las copias del grupo ni en lo que leí hoy (se sirvió la versión
  de EE. UU.). Hay que quitarlo o citar el registro de CySEC.
- Se puede añadir `fechaDato` 2026-09-08 al claim de la página explicativa.

## 5. `gate-xstocks-eee` · confirmado con cambios

**Comprobado hoy:**
- Programa de actividades de la CNMV, n.º 5063 (09:37:09 UTC). Todos los
  servicios figuran solo para los apartados «4) Contratos de opciones,
  futuros, permutas…», «5) … materias primas…» y «9) Contratos financieros
  por diferencias». No aparece ningún apartado de valores negociables.
  Confirmado.
- Advertencias de la CNMV, «Gate.io» (09:33:48 UTC): «07/02/2022 ·
  HTTPS://WWW.GATE.IO/ · GATE.IO», en la lista de no autorizadas. Confirmado.
  «Gate.com» (09:37:04 UTC): sin datos.
- gate.com/xstocks, /en-eu, /eu y /legal/user-agreement dan 403 con curl
  (09:37:26 UTC). Confirmado. Con WebFetch, gate.com/en-eu enseña el sello
  «MiCA&PSD2 Licensed» y no menciona xStocks; gate.com/xstocks dio 404.
- **Dato que falta**: en el registro MiCA de ESMA (09:30:12 UTC) figura «Gate
  Technology Limited · MFSA · autorización 29/09/2025 · web
  www.gate.com/en-eu · España en pasaporte: sí». Es una licencia de
  criptoactivos y no cubre certificados como los xStocks, pero el expediente
  presenta a Gate Securities (Cyprus) como la única entidad.

**Correcciones:**
1. Añadir a `registros` la autorización MiCA de Gate Technology Limited
   (Malta), con su alcance, y explicar que no permite vender valores.
2. `resumenTarjeta.accesoEspana` («la entidad de Gate en la CNMV…»). Texto
   propuesto (108 caracteres): «No para valores: su entidad en la CNMV solo
   tiene derivados y su licencia de criptoactivos no cubre acciones».

---

## 6. Muestreo de rechazos «sin cambios» del 05/11 (los cinco)

| Rechazo | Lo que comprobé hoy | Resultado |
|---|---|---|
| Assetera / Ondo | Elegibilidad de Ondo con el mismo SHA-256 (`76916fd4…`, 09:29:39). ESMA sin folleto base nuevo (09:29:29). | Igual |
| Crypto.com | Términos con el mismo SHA-256 `1169bff5…` (09:38:36). La página de avisos del EEE no tiene texto de KID y sus enlaces de «Tokenized Stocks» llevan a `crypto.com/us/onchain` (09:39:27). | Igual |
| Franklin grBENJI | Folleto con el mismo SHA-256 `ec0458b6…` (09:38:37). | Igual |
| OKX | Advertencia de la CNMV «04/04/2022 · HTTPS://WWW.OKX.COM/ · OKX» vigente (09:39:27). Hay además otra de 18/05/2026 sobre «AAYOKX», una web ajena. | Igual |
| Bybit | 0 entradas «BYBIT» en el listado de la CNMV (09:29:59). En ESMA solo figura como proveedor MiCA de criptoactivos (Bybit EU GmbH, FMA, 28/05/2025). | Igual |

## 7. Ideas descartadas en una línea (comprobación por muestreo)

- **Gemini:** ahora lo respalda una fuente primaria, no solo la prensa.
  `https://www.gemini.com/areas-of-operation` (09:42:55 UTC): «Effective 6
  April 2026, Gemini will close all customer accounts in the United Kingdom
  and European Economic Area». Su página de acciones tokenizadas («from
  anywhere in the EU») está desfasada.
- **Oro (ESMA ARTZZ):** el CSV solo tiene la cabecera; mismo SHA-256 que el
  del investigador (09:41:02 UTC). Confirmado.
- **«38 folletos pasaportados a España desde septiembre»:** la consulta
  excluye las condiciones finales (`-document_type:FTWS`) y los suplementos.
  Muchos productos tokenizados se emiten con condiciones finales bajo un
  folleto base, así que esa comprobación no los descarta. No cambia ningún
  expediente, pero el resumen no debería presentarla como barrido completo.
- WisdomTree Prime («intended solely for U.S. persons») y Bitpanda («Custody
  of fractions … on an omnibus basis», «cannot be transferred»): confirmados
  en las copias del grupo.

## 8. Datos personales en las copias del grupo

Las copias de texto recortadas (folleto de Coinbase, notas de Amundi,
Blockchain.com y eToro, SG-FORGE, Axiology) están bien: no quedan los nombres
de los administradores ni el contacto de prensa. **Pero quedan nombres en dos
archivos:**

1. `grupos/candidatas-mercados/fuentes/etoro-tokenized-stocks-explainer.txt`,
   líneas 33-34: el nombre y el apellido del autor del artículo, sin
   recortar. El inventario dice que la copia está recortada.
2. `grupos/candidatas-mercados/fuentes/gemini-tokenizedstocks.html`: en el
   JSON de la página aparecen los nombres de los fundadores de Gemini y de
   otras personas («Our CEO (…) and President (…)», «SumZero CEO …»).

**Corrección obligatoria:** recortar los dos archivos o quitar el HTML de
Gemini (vale el `.txt`) antes de entregarlos o hacer commit, y corregir el
inventario.

## 9. Bloqueos

- coinbase.com (blog, help y páginas de España) da 403 con curl.
  support.gemini.com da 403 con curl y con WebFetch. No intenté eludir nada.
- gate.com da 403 con curl. WebFetch leyó /en-eu pero no la sección xStocks
  (404). La disponibilidad de xStocks para el EEE en Gate no se puede
  verificar.
- base.org/stocks no terminó de cargar en 60 s; el texto se leyó igual.
- La clase tokenizada de Amundi no tiene ISIN, KID ni folleto públicos.
- Las horas de WebFetch son aproximadas (la herramienta no da la hora
  exacta).

## 10. Correcciones obligatorias (resumen)

1. **Datos personales:** recortar el nombre del autor en
   `etoro-tokenized-stocks-explainer.txt` y los nombres de
   `gemini-tokenizedstocks.html` (o quitar ese HTML). Corregir el inventario.
2. **Blockchain.com:** añadir la licencia MiCA de Blockchain.com Operations
   (Malta) Limited y su alcance; pasar `disponibleEs` a `no_confirmado`;
   anotar que el BPWO-68 está pasaportado a España; nuevo `accesoEspana`.
3. **Gate:** añadir la licencia MiCA de Gate Technology Limited y su alcance;
   nuevo `accesoEspana`.
4. **Coinbase:** cambiar «tenedores autorizados» por quien supera los
   controles del emisor; anotar la reventa a minoristas en DeFi que prevé el
   folleto.
5. **Amundi:** no atribuir a la nota que la clase esté «dirigida a
   institucionales»; nuevo `accesoEspana`; el PDF tiene 2 páginas.
6. **eToro (menor):** quitar o respaldar «CySEC 109/10».
7. **Resumen del grupo:** el barrido de «38 folletos» no incluye condiciones
   finales; Gemini ya tiene fuente primaria.

Ninguna corrección cambia una decisión: las cinco siguen en `no_admitir`.

# Textos del radar corregidos · 20/11/2026 (migración 38)

Orden de la dirección del 20/11/2026 (17:40 UTC): «Todo lo falso fuera… que no vuelvan a haber textos ni datos falsos».

La auditoría de hoy (`auditoria/radar-plataformas.md` y `auditoria/sitio-web.md`) encontró falsos o sin fuente varios textos de julio y agosto de la tabla base `public.plataformas`, que salen en cada página de plataforma, en la app y en `rwadar.csv`. Regla aplicada: lo falso o sin fuente, fuera; superlativos y cifras promocionales sin fuente, fuera; nada que contradiga la licencia o el acceso verificados del radar. Cuando no había fuente para un texto nuevo, se quitó la afirmación en vez de suponer.

**23 plataformas** (21 del radar y 2 descartadas). Los «antes» son exactamente lo que servía producción el 20/11 a las 16:52 UTC (`lectura-publica/plataformas-v2.json`); los datos, en `textos-radar.json`.

Cómo se aplica: «Textos del radar (base)» (`.github/workflows/textos-radar-base.yml`), primero `ensayo-38`, después `aplicar-38` (escribir TEXTOS; hace copia cifrada antes) y `verificar-38` (aviso «RWAdar 38 OK: 23 plataformas»). Después, «Publicar web» para que la web y el CSV lo lean. Prueba local: `node rwadar-app/probar-textos-radar.mjs`.

## swarm

- **Cómo funciona y qué se ha comprobado (aval)**
  - Antes: «Opera bajo licencia de intermediación financiera de BaFin, el regulador alemán, con respaldo 1:1 verificable.»
  - Ahora: «Según sus términos, la contraparte es Swarm Capital GmbH (Vaduz, Liechtenstein). No consta licencia: BaFin no la tiene en su base de datos (20/11/2026) y su aviso legal no nombra supervisor.»
- **Resumen (nota)**
  - Antes: «Acciones y bonos tokenizados negociables dentro del marco regulatorio alemán.»
  - Ahora: «Acciones y bonos tokenizados. Sus términos designan como contraparte a una sociedad de Liechtenstein y eligen la ley alemana.»
- **Región**
  - Antes: «union-europea»
  - Ahora: «liechtenstein»
- **Fuente y lo quitado:**
  - Base de datos de BaFin (portal.mvp.bafin.de), búsquedas «Swarm» y «Swarm Markets»: «Keine Ergebnisse» · 20/11/2026 17:20:37 y 17:20:44 UTC
  - https://docs.swarm.com/about/terms/imprint · «Swarm Capital GmbH Landstr. 37 9490 FL-Vaduz Liechtenstein», sin licencia ni supervisor · 20/11/2026 17:20:33 UTC
  - Términos de docs.swarm.com: ley alemana y tribunales de Berlín · 20/11/2026 17:27 UTC

## inx

- **Cómo funciona y qué se ha comprobado (aval)**
  - Antes: «Bróker-dealer registrado ante la SEC y miembro de FINRA; su matriz cotiza en Nasdaq.»
  - Ahora: «INX Securities, LLC es bróker-dealer registrado ante la SEC, miembro de FINRA, y opera un sistema alternativo de negociación (ATS). Desde 11/2025 pertenece a OpenDeal, Inc. (Republic), que según FINRA no es una sociedad cotizada.»
- **Resumen (nota)**
  - Antes: «Plataforma regulada de valores digitales con negociación secundaria abierta a minoristas.»
  - Ahora: «Plataforma de valores digitales con negociación secundaria.»
- **Fuente y lo quitado:**
  - https://files.brokercheck.finra.org/firm/firm_162182.pdf · dueño indirecto «OPENDEAL, INC.» desde «11/2025»; «Is this a public reporting company? No» · 20/11/2026 17:16:13 UTC

## superstate

- **Cómo funciona y qué se ha comprobado (aval)**
  - Antes: «Fondos estadounidenses registrados con administrador y auditor independientes; fundada por un antiguo responsable de Compound.»
  - Ahora: «Fondo privado estadounidense (USTB, gestionado por Invesco Advisers), con auditor (PwC) y custodio (BNY) independientes; no está registrado como sociedad de inversión. Superstate Services es agente de transferencias registrado ante la SEC.»
- **Cadenas**
  - Antes: «Ethereum»
  - Ahora: «Ethereum, Solana, Plume»
- **Fuente y lo quitado:**
  - https://superstate.com/assets/ustb · «Tokenized private fund», «The Fund is not registered as an investment company under the Investment Company Act», redes «Ethereum, Solana or Plume» · 20/11/2026 17:16:14 UTC

## pax-gold

- **Cómo funciona y qué se ha comprobado (aval)**
  - Antes: «Emitido por Paxos bajo supervisión del regulador bancario de Nueva York (NYDFS), con atestaciones mensuales del oro asignado.»
  - Ahora: «Lo emite Paxos Trust Company, N.A., banco fiduciario nacional de EE. UU. supervisado por la OCC, con atestaciones mensuales del oro.»
- **Cadenas**
  - Antes: «Ethereum»
  - Ahora: «Ethereum, Solana, Base»
- **Fuente y lo quitado:**
  - https://paxg.com · «PAXG is issued by Paxos Trust Company, N.A., a U.S. national trust bank regulated by the OCC»; «Available on Ethereum, Solana and Base» · 20/11/2026 17:16:14 UTC

## midas

- **Cómo funciona y qué se ha comprobado (aval)**
  - Antes: «Emite bajo folleto aprobado en la Unión Europea, lo que obliga a información periódica y responsabilidad del emisor.»
  - Ahora: «Emite bajo un folleto base aprobado por la FMA de Liechtenstein el 17/07/2026 y notificado a la CNMV. Aprobar el folleto no es una licencia: según el propio folleto, el emisor no está regulado por la FMA.»
- **Resumen (nota)**
  - Antes: «Certificados tokenizados sobre estrategias de renta fija. Levantó 50 M$ con Franklin Templeton y Coinbase Ventures.»
  - Ahora: «Certificados tokenizados sobre estrategias de renta fija.»
- **Fuente y lo quitado:**
  - Folleto base de Midas Software GmbH aprobado por la FMA el 17/07/2026, válido hasta el 17/07/2027, y pasaporte en la CNMV (BPWO-84): comprobado en auditoria/radar-plataformas.md («Lo que se sostiene hoy») · 20/11/2026 17:22 UTC
  - Quitado sin fuente: «Levantó 50 M$ con Franklin Templeton y Coinbase Ventures» (ninguna fuente enlazada) y «aprobado en la Unión Europea» (la FMA es de Liechtenstein, del EEE)

## blocksquare

- **Cómo funciona y qué se ha comprobado (aval)**
  - Antes: «Vincula cada token a una anotación en el registro de la propiedad, no solo a un contrato inteligente.»
  - Ahora: «Cada token se apoya en un acuerdo societario del emisor, guardado en IPFS, que identifica el inmueble con sus datos registrales y le obliga frente a los tenedores. No es una inscripción en el registro de la propiedad.»
- **Resumen (nota)**
  - Antes: «Tecnología para que una inmobiliaria tokenice sus propios activos con respaldo registral.»
  - Ahora: «Tecnología para que una inmobiliaria tokenice sus propios activos.»
- **Fuente y lo quitado:**
  - Documentación oficial de Blocksquare: «Corporate resolution… uploaded and stored on IPFS… creates a financial obligation by the issuer»; «Blocksquare's Property Registry — a smart contract» · 20/11/2026 17:19:05 UTC

## lofty

- **Cómo funciona y qué se ha comprobado (aval)**
  - Antes: «Estructura de LLC por inmueble con oferta registrada; una de las pocas vías reales de entrada minorista al inmobiliario tokenizado.»
  - Ahora: «Según sus términos, Lofty no está registrada ante la SEC ni ante ningún otro organismo, y según su web no es un bróker-dealer registrado. Su mercado no es una oferta registrada.»
- **Fuente y lo quitado:**
  - https://www.lofty.ai/terms · «Not Registered with the SEC or Any Other Agency» · 20/11/2026 17:16:13 UTC
  - https://lofty.ai · «Lofty AI, Inc., which is not a registered broker-dealer or investment advisor» · 20/11/2026 17:16:13 UTC

## franklin-templeton

- **Cómo funciona y qué se ha comprobado (aval)**
  - Antes: «Gestora tradicional con décadas de historial y fondo registrado ante la SEC. La vía más conservadora para empezar.»
  - Ahora: «Fondo monetario estadounidense (FOBXX). Solo para residentes en EE. UU.: su folleto del 01/08/2026 dice que no está registrado ni puede ofrecerse en ningún país de la UE o del EEE.»
- **Fuente y lo quitado:**
  - https://www.franklintempleton.com/forms-literature/download-preview/9001-P · «is not registered… in any member country of the European Union (EU) or European Economic Area (EEA), and may not be directly or indirectly offered or distributed in any such country» · 20/11/2026 17:16:13 UTC
  - Quitado: «La vía más conservadora para empezar» (recomendación) y «décadas de historial» y «registrado ante la SEC» (sin fuente enlazada)

## reental

- **Cómo funciona y qué se ha comprobado (aval)**
  - Antes: «Historial de proyectos completados y devueltos, con cientos de reseñas públicas verificadas de inversores.»
  - Ahora: «Según su web, es una empresa norteamericana que ofrece inversiones desde EE. UU. y España, y su actividad en España no está sujeta a autorización ni registro previo de la CNMV.»
- **Fuente y lo quitado:**
  - https://reental.co (web en español) · «Reental es una empresa norteamericana que ofrece inversiones desde Estados Unidos y España»; «La actividad no está sujeta a autorización ni registro previo de la CNMV» · 20/11/2026 17:16:14 UTC
  - Quitado sin fuente: «Historial de proyectos completados y devueltos» y «reseñas públicas verificadas»

## spiko

- **Cómo funciona y qué se ha comprobado (aval)**
  - Antes: «Fondos monetarios autorizados y supervisados por la AMF, el regulador financiero francés. Marco europeo completo.»
  - Ahora: «Fondos monetarios de la SICAV francesa Spiko SICAV, gestionados por Twenty First Capital. No todos aparecían el 20/11/2026 en la base pública de la AMF: compruébalo fondo a fondo.»
- **Resumen (nota)**
  - Antes: «Fondos en euros y dólares pensados para la tesorería de empresas, con reembolso diario.»
  - Ahora: «Fondos en euros y dólares para la tesorería de empresas y particulares, con reembolso diario.»
- **Quién puede entrar (acceso)**
  - Antes: «Empresas»
  - Ahora: «Minorista»
- **Fuente y lo quitado:**
  - https://www.spiko.io · «Individuals» entre sus clientes; página Web3: «Spiko funds are approved as UCITS and can therefore accept non-professional investors» · 20/11/2026 17:16:14 UTC
  - AMF GECO, ficha c79399 (EU T-Bills) «Vivant»; Smart Cash ya no aparece · 20/11/2026 17:20:29 UTC

## backed-finance

- **Cómo funciona y qué se ha comprobado (aval)**
  - Antes: «Emisor suizo con el activo real depositado 1:1 en custodia de un tercero y atestaciones públicas de respaldo.»
  - Ahora: «Los xStocks los emite una sociedad de Jersey (Backed Assets (JE) Limited), con el activo 1:1 en custodios regulados y prueba de reservas pública.»
- **Resumen (nota)**
  - Antes: «Réplicas tokenizadas de acciones y bonos cotizados, activas desde 2021.»
  - Ahora: «Réplicas tokenizadas de acciones y bonos cotizados.»
- **Fuente y lo quitado:**
  - https://docs.xstocks.fi · «xStocks are issued by Backed Assets (JE) Limited, a Jersey-based special purpose vehicle» · 20/11/2026 17:16:12 UTC
  - Quitado sin fuente: «activas desde 2021»

## addx

- **Cómo funciona y qué se ha comprobado (aval)**
  - Antes: «Licencia de mercado reconocido del MAS de Singapur; accionistas de referencia: la bolsa SGX y el fondo estatal Temasek.»
  - Ahora: «Licencia de mercado reconocido del MAS de Singapur. Accionistas de su matriz: la bolsa SGX, Heliconia, UOB y otros.»
- **Fuente y lo quitado:**
  - https://www.addx.co/en/inside-addx/ · «Key shareholders of ICHX Tech, in turn the shareholder of ADDX Pte. Ltd.»: SGX, Hanwha, UOB, Heliconia y otros · 20/11/2026 17:16:12 UTC

## maple-finance

- **Cómo funciona y qué se ha comprobado (aval)**
  - Antes: «Cifras auditadas y publicadas cada trimestre en formato de resultados; crédito institucional integrado con Robinhood y Kraken.»
  - Ahora: «Su crédito institucional es para inversores acreditados que completan el alta (KYC/AML). Maple dice que syrupUSDC y syrupUSDT están abiertos en cadena fuera de EE. UU., pero los términos de esa interfaz excluyen además otras jurisdicciones y dicen que la operadora no está registrada ante ningún regulador.»
- **Resumen (nota)**
  - Antes: «El mayor actor del crédito privado tokenizado: cerró el primer semestre de 2026 con 4.600 M$ gestionados (+81 % interanual) y 1.900 M$ en préstamos vivos.»
  - Ahora: «Crédito privado para instituciones y productos de rendimiento en cadena (syrupUSDC y syrupUSDT).»
- **Fuente y lo quitado:**
  - https://maple.finance/earn/maple-institutional · «Accredited allocators who complete onboarding (KYC/AML). syrupUSDC/USDT remains open to anyone onchain outside of the United States.» · 20/11/2026 17:16:14 UTC
  - https://docs.maple.finance/legal/interface-terms-of-use-syrupusdc-and-syrupusdt · la interfaz syrup excluye varias jurisdicciones, entre ellas EE. UU. (radar del 13/11, contrastado el 20/11 a las 16:57 UTC)
  - https://docs.maple.finance/legal/interface-terms-of-use-syrupusdc-and-syrupusdt · la operadora no está registrada ante ningún regulador (radar del 13/11, contrastado el 20/11 a las 16:57 UTC)
  - Quitado sin fuente: «El mayor actor…», 4.600 M$, +81 %, 1.900 M$, «cifras auditadas… cada trimestre» e «integrado con Robinhood y Kraken»

## securitize

- **Cómo funciona y qué se ha comprobado (aval)**
  - Antes: «Agente de transferencia registrado ante la SEC. Es quien emite y administra el fondo tokenizado BUIDL de BlackRock.»
  - Ahora: «Su filial Securitize Markets, LLC es bróker-dealer registrado ante la SEC, miembro de FINRA, y opera un sistema alternativo de negociación (ATS). Las demás funciones del grupo están en otras filiales.»
- **Resumen (nota)**
  - Antes: «La infraestructura sobre la que las grandes gestoras sacan sus fondos a la cadena. El nombre más institucional del sector.»
  - Ahora: «Plataforma de tokenización, administración y negociación de valores; cada función la lleva una sociedad distinta del grupo.»
- **Fuente y lo quitado:**
  - FINRA BrokerCheck, Securitize Markets, LLC: bróker-dealer SEC/FINRA y ATS (radar del 13/11, contrastado el 20/11 a las 16:57 UTC)
  - Quitado sin fuente: «Es quien emite y administra… BUIDL» (BUIDL lo emite BlackRock USD Institutional Digital Liquidity Fund, rwa.xyz 20/11/2026 17:21 UTC) y «El nombre más institucional del sector»

## courtyard

- **Cómo funciona y qué se ha comprobado (aval)**
  - Antes: «El objeto físico se guarda en cámara asegurada y el token es canjeable por él en cualquier momento: respaldo comprobable.»
  - Ahora: «Es un mercado de NFT de coleccionables físicos, no un mercado de valores con licencia. No hemos podido comprobar el 20/11/2026 en su web la custodia ni el canje.»
- **Resumen (nota)**
  - Antes: «Cromos y coleccionables físicos (cartas Pokémon, deportivas) tokenizados. Líder por volumen semanal en 2026.»
  - Ahora: «Cromos y coleccionables físicos (cartas Pokémon, deportivas) tokenizados.»
- **Fuente y lo quitado:**
  - https://docs.courtyard.io/courtyard/logistics-and-legal/user-agreements/terms-of-service · mercado de NFT y coleccionables (radar del 13/11, contrastado el 20/11 a las 16:57 UTC)
  - https://courtyard.io respondió 403 el 20/11/2026 a las 17:16:13 UTC: sin poder comprobar. Quitado: «canjeable… en cualquier momento: respaldo comprobable» y «Líder por volumen semanal en 2026»

## ondo-finance

- **Cómo funciona y qué se ha comprobado (aval)**
  - Antes: «La mayor plataforma de valores tokenizados por volumen, con los activos subyacentes en custodia de gestoras reguladas.»
  - Ahora: «En el EEE, USDY exige ser cliente profesional o inversor cualificado. Emisor, producto y jurisdicción se revisan por separado: no consta una licencia única para toda la marca.»
- **Fuente y lo quitado:**
  - Documentación de USDY para el EEE: cliente profesional o inversor cualificado (auditoria/radar-plataformas.md, «Lo que se sostiene hoy») · 20/11/2026 17:16 UTC
  - Quitado sin fuente: «La mayor plataforma de valores tokenizados por volumen» y «en custodia de gestoras reguladas»

## centrifuge

- **Cómo funciona y qué se ha comprobado (aval)**
  - Antes: «Una de las tres plataformas que concentran dos tercios del crédito privado tokenizado; estructura de tramos senior/junior.»
  - Ahora: «Es un protocolo, no el emisor: cada fondo tiene su propio vehículo, jurisdicción y documento de oferta. Sus términos dicen que los productos pueden no estar regulados.»
- **Resumen (nota)**
  - Antes: «Financiación de carteras de préstamos y facturas con garantía fuera de cadena. Tuvo impagos por 5,8 M$ en 2023 y reforzó su modelo después.»
  - Ahora: «Financiación de carteras de préstamos y facturas con garantía fuera de cadena.»
- **Fuente y lo quitado:**
  - https://centrifuge.io/terms · ni Centrifuge ni sus afiliadas se licencian en cada jurisdicción; los productos pueden no estar regulados (radar del 13/11, contrastado el 20/11 a las 16:57 UTC)
  - centrifuge.io respondió 403 el 20/11/2026 a las 17:16:12 UTC. Quitado sin fuente: «dos tercios del crédito privado tokenizado», «tramos senior/junior» y «impagos por 5,8 M$ en 2023 y reforzó su modelo después»

## fireblocks

- **Cómo funciona y qué se ha comprobado (aval)**
  - Antes: «Custodia institucional con seguros y certificaciones de seguridad, usada por bancos y gestoras de primer nivel.»
  - Ahora: «Fireblocks Trust Company, LLC figura en el NYDFS como trust de propósito limitado. Esa licencia es de esa sociedad, no de todo su software.»
- **Resumen (nota)**
  - Antes: «El motor de custodia y emisión detrás de decenas de proyectos institucionales de tokenización.»
  - Ahora: «Software de custodia y emisión de activos digitales para empresas e instituciones.»
- **Fuente y lo quitado:**
  - NYDFS, Fireblocks Trust Company, LLC (auditoria/radar-plataformas.md, «Lo que se sostiene hoy») · 20/11/2026 17:16 UTC
  - Quitado sin fuente: «seguros y certificaciones de seguridad», «usada por bancos y gestoras de primer nivel» y «decenas de proyectos»

## figure

- **Cómo funciona y qué se ha comprobado (aval)**
  - Antes: «Cotiza en Nasdaq (FIGR): cuentas auditadas, información pública trimestral y supervisión de la SEC como emisor.»
  - Ahora: «Figure Securities, Inc. es bróker-dealer registrado ante la SEC (FINRA, CRD 307093) y opera un ATS. Ese registro no cubre a las demás sociedades de Figure.»
- **Fuente y lo quitado:**
  - https://files.brokercheck.finra.org/firm/firm_307093.pdf · Figure Securities, Inc., CRD 307093 (auditoria/radar-plataformas.md, «Lo que se sostiene hoy») · 20/11/2026 17:16 UTC
  - investors.figure.com respondió 403 el 20/11/2026 a las 17:19:26 UTC. Quitado sin poder comprobar: «Cotiza en Nasdaq (FIGR)…»

## tzero

- **Cómo funciona y qué se ha comprobado (aval)**
  - Antes: «Opera un sistema alternativo de negociación (ATS) autorizado por la SEC y supervisado por FINRA.»
  - Ahora: «tZERO Securities, LLC es bróker-dealer registrado en FINRA y opera un sistema alternativo de negociación (ATS). Las demás funciones del grupo están en otras sociedades.»
- **Resumen (nota)**
  - Antes: «El mercado secundario de referencia en EE. UU. para valores emitidos en cadena.»
  - Ahora: «Mercado secundario en EE. UU. para valores emitidos en cadena.»
- **Fuente y lo quitado:**
  - FINRA BrokerCheck, tZERO Securities, LLC, CRD 123421 (auditoria/radar-plataformas.md, «Lo que se sostiene hoy») · 20/11/2026 17:16 UTC
  - Quitado: «de referencia» (superlativo sin fuente) y «autorizado por la SEC» (un ATS se registra, no lo autoriza la SEC)

## tokeny

- **Cómo funciona y qué se ha comprobado (aval)**
  - Antes: «Autora del estándar ERC-3643, hoy la referencia del sector para tokens con reglas de cumplimiento incorporadas.»
  - Ahora: «Autora del estándar ERC-3643, para tokens con reglas de cumplimiento incorporadas.»
- **Resumen (nota)**
  - Antes: «La capa de cumplimiento normativo que usan decenas de emisores institucionales.»
  - Ahora: «Capa de cumplimiento normativo para emisores de tokens.»
- **Fuente y lo quitado:**
  - Quitado sin fuente: «hoy la referencia del sector» y «que usan decenas de emisores institucionales»

## domoblock

- **Motivo del descarte**
  - Antes: «La propia plataforma declara que no está supervisada por la CNMV, que no es una Empresa de Servicios de Inversión y que sus productos no son valores negociables. Antes sus emisiones pasaban por una ESI autorizada; dejó de ser así a partir del proyecto DOMO-VLC-4.»
  - Ahora: «La propia plataforma declara que no está supervisada por la CNMV, que no es una Empresa de Servicios de Inversión y que sus productos no son valores negociables.»
- **Fuente y lo quitado:**
  - https://domoblock.io/faq · «en ningún caso ofrece instrumentos financieros sujetos a supervisión por parte de la CNMV ni opera a través de una entidad de servicios de inversión (ESI)» · 20/11/2026 17:23:54 UTC
  - Quitado sin fuente: «Antes sus emisiones pasaban por una ESI autorizada; dejó de ser así a partir del proyecto DOMO-VLC-4» (0 menciones en las fuentes enlazadas, 17:16:17 UTC)

## toucan-protocol

- **Etiqueta del descarte**
  - Antes: «Registro bloqueado»
  - Ahora: «Registro bloqueado en 2022»
- **Motivo del descarte**
  - Antes: «El bloqueo no viene de Toucan, sino de los registros de carbono: en mayo de 2022, Verra prohibió tokenizar créditos ya retirados y el American Carbon Registry prohibió tokenizar los suyos sin su autorización expresa. Verra estudiaba entonces un estado «inmovilizado» que permitiría tokenizarlos. Toucan respaldó públicamente la decisión de Verra.»
  - Ahora: «En mayo de 2022, Verra prohibió tokenizar créditos ya retirados y el American Carbon Registry prohibió tokenizar los suyos sin su autorización expresa. Hoy Toucan solo tokeniza créditos del registro Puro (su cesta CHAR, de biocarbón), con los créditos inmovilizados en ese registro. No la hemos vuelto a evaluar para el radar.»
- **Fuente y lo quitado:**
  - Documentación de Toucan: tokeniza «CORCs from the Puro Registry», «immobilized in an omnibus account within the Puro Registry» · 20/11/2026 17:24:26 UTC
  - Web de Toucan: cesta CHAR de créditos de biocarbón · 20/11/2026 17:24:17 UTC

## Lo que no entra en este cambio

- Licencias, avisos y acceso verificados (verificacion_local del radar: Pax Gold fecha OCC 31/10/2026, Midas condiciones finales de mTBILL, Reental «sin registro declarado» y su aviso) van en la capa de revisión del catálogo, no en esta tabla.
- Región de Reental: la auditoría propone «EE. UU. y España», que no existe en la tabla regiones; se deja «España» y el aval dice ahora que es una empresa norteamericana que ofrece inversiones desde EE. UU. y España.
- Securitize: importe de entrada «Alto» y acceso «Institucional» (la portada anuncia mínimos desde 500 $ y cuentas minoristas, 17:17:25 UTC). Sin una regla escrita de qué importe es «Medio» o «Bajo», no se cambian en este paso.
- Fuentes nuevas (domoblock.io/faq, documentación de Toucan) no se añaden a la tabla fuentes en este paso.
- La fecha `verificada_el` de la tabla base no se cambia (la 38 solo toca las columnas de texto).
- Copias históricas (`lectura-publica/` y `lectura-despues-de-aplicar/` de ciclos anteriores) se dejan como estaban: son registros de lo que se leyó.
- `rwadar-site/` (páginas de plataforma, `rwadar.csv`, `catalogo-publico-20261022.js`) se rehace al publicar la web desde la base.
- `rwadar-app/db/pruebas/02_seed_radar_26.sql` es una copia fija del 04/11 que solo usan las pruebas de lotes antiguos (sus guardas esperan los textos de entonces); no se toca.
- En `rwadar-movil/fixtures/escaparate-local.json` el motivo de Toucan ya era otro texto anterior; se deja.

# Entrega del catálogo 2026-11-03.7 · textos para el lector

Preparada el 04/11/2026 por Claude en el worktree
`/home/user/RWADAR/.claude/worktrees/catalogo-1104`, rama
`claude/catalogo-2026-11-04` (sin push), y corregida el mismo día tras la
revisión independiente (§9). **Nada aplicado en Supabase, nada publicado,
sin OTA.**

## 1. Etiqueta

- **`2026-11-03.7`** (revisión `bd1f873b-95ec-2d2e-1fb5-17ccb505e283`,
  hash `bd1f873b95ec2d2e1fb517ccb505e2831b9bead5789891ac06b3c8f104014ad4`).
  La primera versión de la entrega era la `89e88b04`; las correcciones de la
  revisión cambian textos y, con ellos, la identidad. La `89e88b04` no se ha
  aplicado en ningún sitio y no hay que usarla.
- Exige que la publicada sea la `344a86aa-2c53-d2f0-fed4-5fdaadda33ad`
  (entrega 2026-11-03.6, la del snapshot de la última sincronización).
- **Por qué no `2026-11-04`.** El cargador (`catalogo-publico.js`,
  `cargarFuentesLocales`) exige que la fecha de la carpeta sea la del radar o
  la del último documento revisado. Los datos siguen siendo del 03/11. Para
  llamarla 2026-11-04 habría que cambiar una fecha de verificación, y eso
  alargaría un día la vigencia (hasta el 11/11) sin haber releído las
  fuentes. Con la regla de `npm run catalogo` (primera etiqueta libre de la
  fecha de los datos) sale `.7`.
- **Por qué no `npm run catalogo`.** Vuelve a leer todas las fuentes y pone
  al día cifras y fechas: justo lo que esta entrega no puede hacer. Se ha
  hecho como la 2026-11-03.6: `preparar-entrega.mjs` copia la .6 y cambia
  solo los textos de `textos-lector.json`, comprobando el texto anterior
  exacto de cada uno.
- Vigencia: igual que la .6, vence el 11/11/2026.

## 2. Qué cambia y qué no

- **Cambian 58 textos de la revisión** (`rwadar_catalogo`): los 26 avisos
  de plataforma (anexo A), 22 notas de estado (anexo B) y 10 detalles de
  acceso o licencia con jerga: los 3 de la lista (Ondo, Taurus, Blocksquare),
  3 que encontró la revisión (Spiko, Maple, Fireblocks) y 4 más con la misma
  jerga que añadí al corregir (Courtyard, OpenEden, Swarm y Reental). En el
  SQL son 51 líneas: 26 de `alertas` y 25 de `plataformas`.
- **No cambia nada más:** las 24 ofertas y su documentación son idénticas
  (comprobado byte a byte y en las vistas de PGlite), las 69 fuentes y sus
  fechas, los estados de cada campo, las colecciones 8/13/3 y el manifiesto.
  Las 24 tarjetas se ven igual.
- **Rótulo «Importante» en la app:** ya no va en esta rama. La rama
  `claude/remates` hace el mismo cambio en las mismas líneas de `App.js` (y
  traduce también la etiqueta accesible); unir las dos daba conflicto. Lo
  quité (commit `dd1cef2`, que deshace `141812b`). Llega a la app con remates.
- **Fila 19 («Marketplace» → «Mercado de compraventa»): hecha en el código,
  en esta rama** (commit `c72b09b`). Es un valor del tipo enumerado
  `rwa_actor`, así que la base no se toca: solo cambia lo que se enseña.
  - Web (`rwadar-20260820.js`): al validar el snapshot embebido y al leer el
    lote remoto o local. El pre-render de `index.html` (18 líneas) y las 9
    fichas fijas de plataformas afectadas (`rwadar-fichas.js`) regenerados.
  - App (`lib/catalogo-remoto.js`, al adaptar las filas; la caché guarda el
    lote tal cual). En inglés sigue diciendo «Marketplace»
    (`idioma-en.js`, copiado a la web).
  - El CSV de descarga (`rwadar.csv`) sigue con los valores de la base, como
    «Acreditado» con la fila 21.
  - Se une sin conflictos con `claude/remates` (comprobado con
    `git merge-tree` contra su último commit, `8595f54`).
- **Aparte, en `textos-plataformas.sql`:** Reental (fila 18), Toucan
  (fila 75) y RealT. No están en la revisión: viven en `public.plataformas`
  y `public.fuentes`, y el lote diario solo puede insertar en
  `rwadar_catalogo` (CICLO-DIARIO-CATALOGO.md §5; la revisión de la .6
  comprobaba «public.plataformas solo se lee»). Por eso van en un archivo
  aparte, con guarda (el texto anterior exacto o ya el nuevo), idempotente,
  en una transacción serializable y sin tocar el estado (no genera cambios de
  estado ni avisos). **Hace falta que el coordinador o Víctor acepten tocar
  esas tablas.** Si se acepta, `preparar-entrega.mjs --con-textos-plataformas`
  los mete en `aplicar-y-aprobar.sql` antes de aprobar, y se aplica todo con
  «Aplicar catálogo». Las dos variantes están ensayadas en PGlite.

## 3. Textos de la revisión, antes → después, con su fuente

Las fuentes son las mismas de antes (ids del radar del 03/11). En cursiva,
dónde me he apartado de la lista para no cambiar un hecho. «(corrección)»
marca los 15 textos nuevos o cambiados tras la revisión independiente.

| Plataforma | Campo | Antes | Después | Fuente |
|---|---|---|---|---|
| addx | Nota de estado **(corrección)** | La web mantiene alta y catálogo de oportunidades. | La web sigue ofreciendo el alta y muestra su catálogo de oportunidades. | `addx-web` (https://addx.co/) |
| addx | Aviso «Importante» | No presentar como acceso minorista general ni como disponible automáticamente en España. | No está abierta a cualquier inversor minorista, y no puedes dar por hecho que se pueda contratar desde España. | `addx-acceso` (https://www.addx.co/en/inside-addx/) |
| archax | Nota de estado **(corrección)** | Las webs del grupo y de Europa ya se leen (requieren JavaScript). El grupo dice operar mediante entidades en Reino Unido y España; la web europea marca el MTF, la intermediación, la custodia y la tokenización como 'pre-launch'. No se confirma actividad comercial en la UE. | El grupo dice que opera a través de sociedades en Reino Unido y España. Su web europea marca como «pre-launch» (aún sin lanzar) el sistema multilateral de negociación (MTF), la intermediación, la custodia y la tokenización. No hemos podido confirmar actividad comercial en la UE. *Se quita «ya se leen (requieren JavaScript)», que es un apunte de cómo se leyó la web.* | `archax-web` (https://archax.com/); `archax-eu` (https://eu.archax.com/) |
| archax | Aviso «Importante» | El registro de la sociedad europea no confirma que un producto esté abierto ni que una persona concreta sea elegible. | Que su sociedad europea esté registrada no confirma que un producto esté abierto ni que tú puedas invertir. | `archax-cnmv` (https://www.cnmv.es/portal/consultas/listadoentidad?id=1&tipoent=0); `archax-eu` (https://eu.archax.com/) |
| artex-global-markets | Nota de estado | La portada se lee con JavaScript: ARTEX se presenta como MTF de arte regulado por la FMA de Liechtenstein. Su página de valores muestra una sola cotización (un tríptico de Francis Bacon) con último precio de 67 € y volumen 4, pero sin mejor oferta de compra ni de venta ni fecha de la operación, así que no se confirma negociación activa. | ARTEX se presenta como un sistema multilateral de negociación (MTF) de arte regulado por la FMA de Liechtenstein. Su página de valores muestra una sola cotización (un tríptico de Francis Bacon) con un último precio de 67 € y un volumen de 4, pero sin mejor precio de compra ni de venta ni fecha de la operación. Por eso no podemos confirmar que haya negociación activa. | `artex-web` (https://www.artexgm.com/) |
| artex-global-markets | Aviso «Importante» **(corrección)** | Mantener la fila como no verificable hasta confirmar web, instrumento vivo y proceso de alta. | No hemos podido confirmar que haya un instrumento que se negocie de verdad; hasta que lo confirmemos, su actividad figura como no verificable. *La lista proponía «No hemos podido confirmar que su web funcione…», pero su portada sí se lee (ver el estado), y el acceso de este lote ya explica cómo se opera (a través de los miembros y brokers que publica ARTEX; confirmado con condiciones). Lo que sigue sin confirmar es un instrumento que se negocie de verdad. Solo la actividad figura como no verificable: la licencia está confirmada por el regulador.* | `artex-lb` (https://www.lb.lt/en/sfi-financial-market-participants/artex-global-markets-ag) |
| backed-finance | Nota de estado | La web muestra xStocks y documentación de producto vigente. | La web muestra los xStocks y su documentación de producto en vigor. | `backed-web` (https://backed.fi/); `xstocks-legal` (https://docs.xstocks.fi/docs/product-legal-overview) |
| backed-finance | Aviso «Importante» | No traducir 'folleto aprobado' a disponibilidad minorista universal ni a aval del regulador. | Que el folleto esté aprobado no significa que cualquier inversor minorista pueda comprar ni que el supervisor avale el producto. | `xstocks-legal` (https://docs.xstocks.fi/docs/product-legal-overview) |
| blocksquare | Nota de estado | La portada, que requiere JavaScript, presenta una oferta B2B: protocolo de tokenización inmobiliaria y plataforma de marca blanca con contacto comercial. El apartado de noticias no muestra entradas fechadas, así que no se confirma actividad actual ni portales vivos. | Su web se dirige a empresas: ofrece un protocolo de tokenización inmobiliaria y una plataforma de marca blanca, con contacto comercial. Sus noticias no tienen fecha, así que no podemos confirmar que siga activa ni que haya portales en funcionamiento. | `blocksquare-web` (https://blocksquare.io/) |
| blocksquare | Licencia o registro | Los términos ya se leen. Son una plantilla para socios certificados (operador 'CP_COMPANY') que declara que el operador no presta servicios financieros licenciados ni regulados. No identifican entidad ni registro, y la web marca 'Regulation' como 'Available soon'. | Ya se pueden leer sus condiciones de uso. Son una plantilla para socios certificados (operador 'CP_COMPANY') que declara que el operador no presta servicios financieros licenciados ni regulados. No identifican entidad ni registro, y la web marca 'Regulation' como 'Available soon'. *Solo cambia la primera frase, como pide la lista.* | `blocksquare-terms` (https://docs.blocksquare.io/certified-partners/legal/terms-of-service.md) |
| blocksquare | Aviso «Importante» **(corrección)** | No atribuir a cada portal una licencia o vínculo registral por utilizar tecnología de tokenización. Revisar emisor, contrato y jurisdicción del activo. | Que un portal use su tecnología de tokenización no significa que tenga licencia ni que esté inscrito en un registro. Revisa quién emite el activo, el contrato y su jurisdicción. | `blocksquare-web` (https://blocksquare.io/); `blocksquare-terms` (https://docs.blocksquare.io/certified-partners/legal/terms-of-service.md) |
| centrifuge | Nota de estado | La web mantiene infraestructura de gestión de activos on-chain. | La web sigue ofreciendo infraestructura para gestionar activos en blockchain. | `centrifuge-web` (https://centrifuge.io/) |
| centrifuge | Aviso «Importante» **(corrección)** | Verificar cada fondo, emisor, jurisdicción y documento de oferta; no atribuir al protocolo la licencia del vehículo. | Centrifuge es el protocolo, no el emisor: la licencia, si la hay, es del vehículo de cada fondo, no de Centrifuge. Revisa en cada fondo el emisor, la jurisdicción y el documento de la oferta. | `centrifuge-terms` (https://centrifuge.io/terms) |
| courtyard | Licencia o registro **(corrección)** | La documentación revisada describe un marketplace de NFT/coleccionables, no una licencia de mercado de valores. | La documentación revisada describe un mercado de NFT y coleccionables, no una licencia de mercado de valores. *Corrector: «marketplace» es el anglicismo de la fila 19; como en Lofty, «mercado».* | `courtyard-terms` (https://docs.courtyard.io/courtyard/logistics-and-legal/user-agreements/terms-of-service) |
| courtyard | Aviso «Importante» | No presentar coleccionables, recompra o mercado secundario como inversión regulada ni como liquidez garantizada. | Los coleccionables, la recompra y su mercado de reventa no son una inversión regulada ni garantizan que puedas vender. | `courtyard-terms` (https://docs.courtyard.io/courtyard/logistics-and-legal/user-agreements/terms-of-service) |
| figure | Nota de estado | Figure.com mantiene servicios de crédito y enlaces a OPEN y Figure Markets; esto no acredita una oferta de inversión concreta abierta. | Figure.com sigue ofreciendo servicios de crédito y enlaces a OPEN y Figure Markets; eso no demuestra que haya una oferta de inversión concreta abierta. | `figure-web` (https://figure.com/) |
| figure | Aviso «Importante» | Distinguir Figure Securities de los servicios de crédito y otras entidades de la marca; comprobar el contrato específico del producto. | Figure Securities es una empresa distinta de los servicios de crédito y de las demás empresas de la marca. Comprueba el contrato del producto concreto. | `figure-finra` (https://files.brokercheck.finra.org/firm/firm_307093.pdf); `figure-web` (https://figure.com/) |
| fireblocks | Acceso **(corrección)** | La oferta principal es B2B/institucional, no un marketplace minorista directo. | Su oferta principal se dirige a empresas e instituciones; no es un mercado en el que los minoristas inviertan directamente. *Revisión independiente: «B2B» y «marketplace» son lo que la lista quita en las filas 84 y 19. Se conserva «principal» y «directo».* | `fireblocks-web` (https://fireblocks.com/); `fireblocks-trust` (https://www.fireblocks.com/trustco) |
| fireblocks | Aviso «Importante» | No describir todos los servicios Fireblocks como custodia regulada; separar Trust Company, software y terceros custodios. | No todos los servicios de Fireblocks son custodia regulada: su Trust Company, su software y los custodios externos son cosas distintas. | `fireblocks-trust` (https://www.fireblocks.com/trustco); `nydfs-virtual` (https://www.dfs.ny.gov/apps_and_licensing/virtual_currency_businesses) |
| franklin-templeton | Nota de estado | Benji y el Franklin OnChain U.S. Government Money Fund mantienen superficies y folleto. | Las páginas de Benji y del Franklin OnChain U.S. Government Money Fund, y su folleto, siguen publicadas. | `franklin-benji` (https://digitalassets.franklintempleton.com/benji/); `franklin-prospectus` (https://www.franklintempleton.com/forms-literature/download-preview/9001-P) |
| franklin-templeton | Aviso «Importante» | No convertir un fondo estadounidense accesible por Benji en oferta minorista global. | Que un fondo estadounidense se pueda contratar a través de Benji no lo convierte en una oferta abierta a minoristas de cualquier país. | `franklin-prospectus` (https://www.franklintempleton.com/forms-literature/download-preview/9001-P) |
| inx | Aviso «Importante» | No afirmar que INX cotiza en Nasdaq; la evidencia revisada confirma el broker/ATS, no ese mercado bursátil. | Lo que hemos revisado confirma su bróker y su sistema alternativo de negociación (ATS), pero no que INX cotice en Nasdaq. *La lista proponía «No hemos encontrado pruebas…»; se deja como en el original: lo revisado confirma el bróker y el ATS, no Nasdaq.* | `inx-finra` (https://files.brokercheck.finra.org/firm/firm_162182.pdf) |
| lofty | Nota de estado | La web y el marketplace de participaciones inmobiliarias siguen activos. | La web y su mercado de participaciones inmobiliarias siguen activos. | `lofty-web` (https://lofty.ai/) |
| lofty | Aviso «Importante» | No llamar 'oferta registrada' al marketplace ni prometer liquidez instantánea; la ejecución ocurre en redes públicas y no se garantiza mejor ejecución. | Su mercado no es una oferta registrada y no garantiza que puedas vender al momento. Las operaciones se hacen en redes públicas y no se garantiza que se ejecuten en las mejores condiciones. *«Mejor ejecución» no es solo el precio; por eso «en las mejores condiciones» y no «al mejor precio».* | `lofty-terms` (https://www.lofty.ai/terms) |
| maple-finance | Nota de estado | La web mantiene productos de crédito institucional y syrup. | La web sigue ofreciendo productos de crédito para instituciones y syrup. | `maple-web` (https://maple.finance/); `maple-institutional` (https://maple.finance/earn/maple-institutional) |
| maple-finance | Acceso **(corrección)** | La interfaz syrup excluye varias jurisdicciones, entre ellas EE. UU. La página institucional no permite confirmar en este corte todos los requisitos de alta; comprobar el producto concreto. | La interfaz syrup excluye varias jurisdicciones, entre ellas EE. UU. Con la página institucional no hemos podido confirmar, en esta revisión, todos los requisitos de alta; comprueba los del producto concreto. *Revisión independiente: «en este corte» es jerga interna. Solo cambia la segunda frase.* | `maple-terms` (https://docs.maple.finance/legal/interface-terms-of-use-syrupusdc-and-syrupusdt); `maple-institutional` (https://maple.finance/earn/maple-institutional) |
| maple-finance | Aviso «Importante» | No atribuir licencia o elegibilidad de un pool a todo Maple; protocolo, interfaz, emisor y vehículo son capas distintas. | La licencia o los requisitos de un fondo (pool) no valen para todo Maple: el protocolo, la interfaz, el emisor y el vehículo son piezas distintas. | `maple-terms` (https://docs.maple.finance/legal/interface-terms-of-use-syrupusdc-and-syrupusdt) |
| midas | Nota de estado **(corrección)** | El índice oficial de productos de midas.app (llms.txt) mantiene su catálogo, con mTBILL, mF-ONE, mGLO, mGLOBAL y mGLOeuro, y el folleto base de 17/07/2026 sigue incluyendo mTBILL. La web y las páginas de cada producto bloquean las consultas automáticas, así que no se comprobó cada emisión. | La lista oficial de productos de midas.app sigue incluyendo mTBILL, mF-ONE, mGLO, mGLOBAL y mGLOeuro, y el folleto base del 17/07/2026 sigue incluyendo mTBILL. La web y las páginas de cada producto no se dejan leer con herramientas automáticas, así que no hemos comprobado cada emisión. | `midas-mtbill` (https://www.mfsa.mt/wp-content/uploads/2026/07/Midas-Software-GmbH-Base-Prospectus-Document-dated-17-July-2026.pdf); `midas-web` (https://midas.app/llms.txt) |
| midas | Aviso «Importante» | No usar 'aprobado por la FMA' como aval ni como licencia de Midas. El folleto base de 17/07/2026 dice que la FMA solo revisa completitud, comprensibilidad y coherencia y que el emisor no queda regulado por ella. Exigir los términos finales vigentes de mTBILL, que deciden si se admite a minoristas del EEE. | Que el folleto esté «aprobado por la FMA» no es un aval ni una licencia de Midas: según el folleto base del 17/07/2026, la FMA solo revisa que esté completo, se entienda y sea coherente, y el emisor no queda regulado por ella. Si pueden entrar minoristas del EEE lo deciden los términos finales vigentes de mTBILL, que no hemos podido obtener. *«Que no hemos podido obtener»: lo dice la licencia de Midas en este mismo lote («No se obtuvieron los términos finales vigentes de mTBILL»).* | `midas-mtbill` (https://www.mfsa.mt/wp-content/uploads/2026/07/Midas-Software-GmbH-Base-Prospectus-Document-dated-17-July-2026.pdf); `midas-old-prospectus` (https://www.mfsa.mt/wp-content/uploads/2024/11/Midas-Software-GmbH-Base-Prospectus-Document-dated-17-July-2024.pdf) |
| ondo-finance | Nota de estado | La web mantiene USDY, OUSG y Ondo Stocks. | La web sigue ofreciendo USDY, OUSG y Ondo Stocks. | `ondo-web` (https://ondo.finance/) |
| ondo-finance | Acceso | Para residentes del EEE, USDY exige cliente profesional o inversor cualificado, además del onboarding del emisor. | Para residentes del EEE, USDY exige cliente profesional o inversor cualificado, además del alta con el emisor. | `ondo-usdy-access` (https://docs.ondo.finance/general-access-products/usdy/eligibility) |
| ondo-finance | Aviso «Importante» | No presentar Ondo como minorista global; incluso productos llamados de acceso general tienen restricciones por jurisdicción. | Ondo no está abierta a minoristas de todo el mundo: incluso los productos que llama «de acceso general» tienen restricciones según la jurisdicción. | `ondo-usdy-access` (https://docs.ondo.finance/general-access-products/usdy/eligibility) |
| openeden | Nota de estado | La portada muestra TBILL, USDO y HYBOND con sus volúmenes, y la documentación oficial de TBILL y su proceso de onboarding es legible. | La portada muestra TBILL, USDO y HYBOND con sus volúmenes, y se puede leer la documentación oficial de TBILL y de su proceso de alta. | `openeden-web` (https://openeden.com/); `openeden-intro` (https://docs.openeden.com/tbill/introduction); `openeden-onboarding` (https://docs.openeden.com/tbill/investor-onboarding) |
| openeden | Acceso **(corrección)** | TBILL es permissioned y se limita a inversores profesionales BVI o acreditados de EE. UU. tras KYC/KYT. | TBILL es de acceso restringido y se limita a inversores profesionales BVI o acreditados de EE. UU., tras pasar los controles KYC/KYT. *Corrector: «permissioned» en castellano. Su fuente: «The TBILL Vault is a permissioned protocol, meaning an Investor must meet specific criteria to be eligible» (docs.openeden.com/tbill/investor-onboarding, leído el 04/11/2026).* | `openeden-onboarding` (https://docs.openeden.com/tbill/investor-onboarding) |
| openeden | Aviso «Importante» | No presentar TBILL como acceso minorista ni confundir rating del fondo con garantía de capital. | TBILL no está abierto a inversores minoristas, y la calificación (rating) del fondo no garantiza tu capital. | `openeden-intro` (https://docs.openeden.com/tbill/introduction); `openeden-onboarding` (https://docs.openeden.com/tbill/investor-onboarding) |
| pax-gold | Nota de estado | Paxos mantiene la ficha PAXG, custodia y opciones de redención. | Paxos sigue publicando la ficha de PAXG, su custodia y las opciones de canje. | `paxg-web` (https://paxos.com/paxgold) |
| pax-gold | Aviso «Importante» | Respaldado y canjeable no significa sin riesgo; verificar custodio, comisiones, tamaño mínimo y canal de redención. | Que esté respaldado por oro y se pueda canjear no significa que no tenga riesgo. Comprueba el custodio, las comisiones, el mínimo y cómo se canjea. | `paxg-web` (https://paxos.com/paxgold); `paxg-nydfs` (https://www.dfs.ny.gov/reports_and_publications/press_releases/pr1909051) |
| reental | Nota de estado **(corrección)** | La FAQ oficial describe registro, KYC/AML y firma del acuerdo; no se comprobó la apertura actual de una emisión concreta. | Sus preguntas frecuentes oficiales explican el registro, la verificación de identidad y los controles contra el blanqueo (KYC/AML), y la firma del contrato. No hemos comprobado si ahora hay una emisión concreta abierta. | `reental-faq` (https://www.reental.co/en/faqs) |
| reental | Acceso **(corrección)** | La FAQ declara alta de adultos tras KYC/AML y exige acreditación a residentes fiscales de EE. UU.; cada emisión conserva sus propios términos. | Sus preguntas frecuentes dicen que pueden darse de alta los adultos, tras la verificación de identidad y los controles contra el blanqueo (KYC/AML), y que a los residentes fiscales en EE. UU. se les exige ser inversores acreditados. Cada emisión tiene sus propios términos. *Corrector: «La FAQ declara alta de adultos…», junto a la nota de estado ya reescrita («Sus preguntas frecuentes oficiales…»).* | `reental-faq` (https://www.reental.co/en/faqs) |
| reental | Aviso «Importante» | No convertir el registro de una emisión/ERIR en licencia global de plataforma ni dar por abierta una oportunidad sin ficha actual. | Que una emisión esté inscrita (ERIR) no es una licencia para toda la plataforma, y una oportunidad sin ficha actual no hay que darla por abierta. | `reental-emision` (https://www.reental.co/en/corporate/reental-lanza-la-primera-emision-de-un-security-token-inmobiliario-en-espana-autorizado-por-la-cnmv) |
| republic | Nota de estado | republic.com bloquea las consultas automatizadas. El centro de ayuda oficial de Republic Europe sigue guiando el alta, la exploración de oportunidades y la inversión en campañas. | republic.com no deja leer su web con herramientas automáticas. El centro de ayuda oficial de Republic Europe sigue explicando cómo darse de alta, ver oportunidades e invertir en campañas. | `republic-web` (https://help.republic.com/en/) |
| republic | Aviso «Importante» | No atribuir a Republic en bloque el registro de una filial ni omitir el régimen específico de cada oferta. | El registro de una filial no cubre a todo Republic, y cada oferta tiene sus propias reglas. | `republic-entities` (https://www.finra.org/about/entities-we-regulate/funding-portals-we-regulate); `republic-finra` (https://files.brokercheck.finra.org/firm/firm_291387.pdf) |
| securitize | Nota de estado **(corrección)** | La portada ya se lee: presenta inversiones tokenizadas (acciones de EE. UU. en cadena y fondos como ARK Venture Fund) con alta y acceso. No se comprobó una oferta concreta abierta; el registro de Securitize Markets se comprueba por separado. | La portada presenta inversiones tokenizadas (acciones de EE. UU. en blockchain y fondos como ARK Venture Fund), con la opción de darse de alta e invertir. No hemos comprobado una oferta concreta abierta; el registro de Securitize Markets se revisa aparte. | `securitize-web` (https://securitize.io/); `securitize-finra` (https://files.brokercheck.finra.org/firm/firm_283256.pdf) |
| securitize | Aviso «Importante» | Nombrar la filial regulada y no extender su permiso a tokenización, administración o asesoramiento del grupo. | El permiso es de una filial concreta, Securitize Markets, LLC (bróker registrado ante la SEC y la FINRA, y ATS), y no cubre la tokenización, la administración ni el asesoramiento del resto del grupo. *La lista dejaba «(Si se conoce, nombrar la filial.)». Se conoce: es la que acredita su fuente, el informe de FINRA BrokerCheck de Securitize Markets, LLC, y la que nombra la licencia de este lote.* | `securitize-finra` (https://files.brokercheck.finra.org/firm/firm_283256.pdf) |
| spiko | Nota de estado | La página oficial Web3 mantiene productos de tesorería, suscripción y reembolso; no se realizó onboarding. | Su página oficial Web3 sigue mostrando productos de tesorería, con suscripción y reembolso. No llegamos a darnos de alta. | `spiko-access` (https://www.spiko.io/use-cases/web3) |
| spiko | Acceso **(corrección)** | La AMF marca el compartimento EU T-Bills como abierto a todo suscriptor y Spiko dice que sus productos principales son UCITS aprobados por el regulador francés. El registro REGAFI de la ACPR muestra que Spiko Finance tiene pasaporte de libre prestación de servicios en España desde el 08/01/2026 para recibir y transmitir órdenes sobre participaciones de IIC. No se comprobó en la CNMV la comercialización del fondo en España ni se hizo el onboarding. | La AMF marca el compartimento EU T-Bills como abierto a todo suscriptor y Spiko dice que sus productos principales son UCITS aprobados por el regulador francés. El registro REGAFI de la ACPR muestra que Spiko Finance tiene pasaporte de libre prestación de servicios en España desde el 08/01/2026 para recibir y transmitir órdenes sobre participaciones de IIC. No hemos comprobado en la CNMV que el fondo se comercialice en España, ni llegamos a darnos de alta. *Revisión independiente: quedaba «onboarding» junto a la nota de estado ya reescrita. Solo cambia la última frase.* | `spiko-web` (https://spiko.io/); `spiko-amf` (https://geco.amf-france.org/back-office/funds/compartment/c79399); `spiko-regafi-pasaporte-es` (https://www.regafi.fr/api/explore/v2.1/catalog/datasets/prd-banque-passeports-sortants/records?where=id_referentiel%3D751211%20and%20pays%3D%22ESPAGNE%22) |
| spiko | Aviso «Importante» | UCITS no equivale por sí solo a onboarding disponible en España; comprobar pasaporte, distribuidor y clase. | Ser un fondo UCITS no basta, por sí solo, para poder contratarlo desde España: hay que comprobar el pasaporte, el distribuidor y la clase de participación. | `spiko-amf` (https://geco.amf-france.org/back-office/funds/compartment/c79399) |
| superstate | Nota de estado | La web mantiene fondos tokenizados y FundOS. | La web sigue ofreciendo fondos tokenizados y FundOS. | `superstate-web` (https://superstate.co/); `superstate-ustb` (https://superstate.com/assets/ustb) |
| superstate | Aviso «Importante» | No omitir la doble elegibilidad ni confundir filing/registro con aprobación o garantía. | Para USTB hay que cumplir dos requisitos a la vez: ser inversor acreditado y «qualified purchaser». Presentar documentos o estar inscrito ante un supervisor no es una aprobación ni una garantía. *Los dos requisitos son los del acceso de Superstate en este lote («USTB exige acreditado y qualified purchaser»), con la misma fuente.* | `superstate-ustb` (https://superstate.com/assets/ustb) |
| swarm | Nota de estado | La web redirige a una aplicación sin contenido extraíble; no se confirmó actividad transaccional ni una oferta abierta. | La web lleva a una aplicación de la que no se puede leer el contenido; no hemos confirmado que haya operaciones ni una oferta abierta. | `swarm-web` (https://docs.swarm.com/) |
| swarm | Acceso **(corrección)** | Los términos legibles en docs.swarm.com (Swarm Capital GmbH, versión del 22/04/2024) y la FAQ (03/07/2024) exigen KYC/AML y excluyen a las personas estadounidenses, pero no hay condiciones de alta de 2026 por jurisdicción y la aplicación no muestra contenido extraíble. | Los términos que se pueden leer en docs.swarm.com (Swarm Capital GmbH, versión del 22/04/2024) y sus preguntas frecuentes (03/07/2024) exigen KYC/AML y excluyen a las personas estadounidenses, pero no hay condiciones de alta de 2026 por jurisdicción y no se puede leer el contenido de la aplicación. *Corrector: «legibles», «FAQ» y «contenido extraíble», como en la nota de estado de Swarm ya reescrita.* | `swarm-terms` (https://docs.swarm.com/about/terms/tos) |
| swarm | Aviso «Importante» | No presentar Swarm como acceso minorista disponible sin condiciones actuales de alta, entidad y jurisdicción verificables. | No está confirmado que un inversor minorista pueda entrar: no hemos podido comprobar unas condiciones de alta actuales que digan con qué empresa se contrata y desde qué jurisdicciones. *La lista decía «no hemos podido comprobar … la empresa». Su aviso legal sí nombra a Swarm Capital GmbH (licencia de este lote); lo que falta son condiciones de alta actuales por empresa y jurisdicción.* | `swarm-web` (https://docs.swarm.com/); `swarm-terms` (https://docs.swarm.com/about/terms/tos) |
| taurus | Acceso | La documentación contempla clientes minoristas, profesionales e institucionales, en ejecución-only; onboarding desde España no confirmado. | La documentación contempla clientes minoristas, profesionales e institucionales, en régimen de solo ejecución, sin asesoramiento; no está confirmado que se pueda dar de alta desde España. | `taurus-disclosure` (https://www.taurushq.com/legal/taurus-sa-terms/important-risk-regulatory-disclosure/) |
| taurus | Aviso «Importante» | No confundir clasificación de cliente con disponibilidad universal, asesoramiento o evaluación de idoneidad. | Que Taurus clasifique a sus clientes (minoristas, profesionales o institucionales) no significa que el servicio esté abierto a todos, ni que te asesoren o comprueben si te conviene. | `taurus-disclosure` (https://www.taurushq.com/legal/taurus-sa-terms/important-risk-regulatory-disclosure/) |
| tokeny | Nota de estado | La web mantiene software de emisión y cumplimiento on-chain. | La web sigue ofreciendo software para emitir tokens y cumplir la normativa en blockchain. | `tokeny-web` (https://tokeny.com/) |
| tokeny | Aviso «Importante» | No atribuir a Tokeny la licencia, custodia, solvencia o elegibilidad del emisor que usa su software. | Tokeny es el proveedor del software: la licencia, la custodia, la solvencia y los requisitos de acceso son del emisor que lo usa, no de Tokeny. | `tokeny-terms` (https://tokeny.com/general-terms-of-service/) |
| tzero | Nota de estado | La web mantiene infraestructura de emisión, trading y custodia. | La web sigue ofreciendo infraestructura de emisión, negociación y custodia. | `tzero-web` (https://tzero.com/); `tzero-company` (https://tzero.com/company) |
| tzero | Aviso «Importante» | No extender SEC/FINRA a todo el grupo ni asumir que cada activo del ATS está abierto a minoristas. | Su registro ante la SEC y la FINRA no cubre a todo el grupo, y no hay que dar por hecho que cada activo de su sistema de negociación (ATS) esté abierto a minoristas. *El original no dice que haya activos cerrados a minoristas, solo que no se dé por hecho que todos estén abiertos.* | `tzero-finra` (https://files.brokercheck.finra.org/firm/firm_123421.pdf); `tzero-company` (https://tzero.com/company) |

## 4. Textos de `public.plataformas` (aparte, `textos-plataformas.sql`)

| Plataforma | Campo | Antes | Después | Fuente |
|---|---|---|---|---|
| Reental (fila 18) | nota | Proyectos inmobiliarios en España y Latinoamérica desde 100 €. La opción más accesible para un inversor español. | Proyectos inmobiliarios en España y Latinoamérica desde 100 €. | Sin fuente nueva: solo se quita la valoración. |
| Toucan Protocol (fila 75) | motivo del descarte | El bloqueo no es suyo sino del registro: Verra prohibió en 2022… | El bloqueo no viene de Toucan, sino de los registros de carbono: Verra prohibió en 2022… (el resto, igual) | Sus tres fuentes de siempre (S&P Global, CarbonCredits, Toucan). |
| RealT | etiqueta | En liquidación | Liquidación anunciada | Outlier Media, 16/07/2026: «We are entering voluntary liquidation» (llamada del 2 de julio). Cryptoast, 04/07/2026: no se puede confirmar que afecte a la sociedad matriz. |
| RealT | motivo del descarte | Detroit la demandó junto a sus 165 sociedades por más de 400 viviendas con infracciones, en la mayor demanda por insalubridad de la historia de la ciudad. Un juez le prohibió cobrar alquileres en las no conformes y le ordenó reparar. En julio de 2026 la propia empresa anunció liquidación voluntaria y la venta de sus más de 700 inmuebles en Detroit. | En julio de 2025, Detroit la demandó junto a sus 165 sociedades por más de 400 viviendas con infracciones. Un juez le prohibió cobrar alquileres hasta que las viviendas cumplieran la normativa y le ordenó repararlas. En julio de 2026 la empresa anunció una liquidación voluntaria y la venta de toda su cartera. Había vendido, en forma de tokens, participaciones de unos 700 inmuebles de Detroit. | BridgeDetroit, 24/07/2025 (leída con curl el 04/11): «…filed earlier this month, against Real Token…; its co-founders…; and 165 affiliates, for public nuisance violations involving more than 400 residential properties in Detroit with substandard conditions», «barred Real Token … from collecting rent from tenants until properties are brought up to code», titular «…orders repairs». Outlier Media, 16/07/2026 (leída con WebFetch el 04/11; curl daba 429): «A cryptocurrency real estate company that sold shares of about 700 Detroit properties says it plans to sell off its entire portfolio», «We are entering voluntary liquidation». |
| RealT | fuentes | 3 (ciudad de Detroit, 2 de BridgeDetroit) | Las 3 de siempre + Outlier Media (`https://outliermedia.org/realt-crypto-real-estate-detroit-properties/`, publicada el 16/07/2026, consultada el 04/11/2026) | La liquidación, la venta y los 700 inmuebles no tenían ninguna fuente en la ficha. |

- **«La mayor demanda…», fuera.** Outlier Media (16/07/2026) recoge que la
  ciudad la llamó «the largest nuisance abatement lawsuit in the city's
  history» (releído con WebFetch el 04/11). Es una valoración de la propia
  ciudad, no un dato comprobado, y la nota de la ciudad de Detroit devuelve
  403 con curl y con WebFetch. Tampoco se dice «insalubridad», que no traduce
  «nuisance abatement» (son molestias públicas). BridgeDetroit y Michigan
  Public no usan el superlativo (verificación cs22 del 03/11). *La primera
  versión de este informe decía que no estaba en las fuentes legibles; no
  era exacto: Outlier lo atribuye a la ciudad.*
- **«Unos 700»** coincide con Outlier (julio, «about 700»), con Michigan
  Public (marzo, «around 700») y con Cryptoast («les quelque 700 biens»). El
  titular de Outlier dice «over 700»; por eso el texto dice cuántos vendió en
  tokens, como el cuerpo del artículo y como Inicio.
- **Fuentes de RealT:** solo se añade una (Outlier), la mínima para que cada
  frase tenga la suya. Cryptoast queda como contraste en `textos-lector.json`.

## 5. Archivos de la entrega

En `rwadar-app/data/verificaciones/2026-11-03.7-v2/`:

- `textos-lector.json`: cada texto, antes y después, con las notas de dónde
  me aparto de la lista; los textos de `public.plataformas` con sus literales;
  y la fila 19 (hecha en el código).
- `preparar-entrega.mjs`: monta la entrega desde la .6 (sin red);
  `--con-textos-plataformas` mete los textos de `public.plataformas` en el
  aplicador.
- `comprobar-entrega.mjs`: ensayo en PGlite (escribe `pruebas-locales.json`).
- `radar-canonico-26.json`, `escaparate-publicacion.json` (solo cambian los
  textos y la nota local de origen), `documentacion-ofertas.json` y
  `manifiesto-catalogo.json` (idénticos a la .6), `contraste-2026-11-03.7.json`
  (los 58 cambios con sus fuentes) y `pruebas-locales.json`.
- `INFORME-ENTREGA.md` (este informe) y `REVISION-ENTREGA.md` (la revisión
  independiente y qué se hizo con cada hallazgo).

En `rwadar-app/data/importaciones/catalogo-2026-11-03.7-v2/`:

- `catalogo.sql` (borrador, SHA-256
  `1170bcb5eb8dd7ea1a65c5d29eee44d6cfff5001252091a50de91ab0b68abe80`) y
  `aplicar-y-aprobar.sql`, SHA-256
  `d57b5dbce55abfb80f227ef8e467b4e01c8679aa5c9fb9d507fa5f85391a2e2c`
  (variante sin los textos de `public.plataformas`).
  Con `--con-textos-plataformas`:
  `d2fecfefa50b43ae6d6e3e38fb328da893e9a842fbb049e6e54f432cc3306da1`.
- `textos-plataformas.sql`, SHA-256
  `3c762ccd348edeb57fa674562a6a1a7c65a5752fe336cd203f8c10f1b4911acc`.
- `revision.json` (`textosPlataformasEnAplicador: false`).

Código (fila 19): `rwadar-site/assets/rwadar-20260820.js`, `rwadar-fichas.js`,
`rwadar-movil/lib/catalogo-remoto.js`, `rwadar-movil/lib/idioma-en.js` (y su
copia web), `rwadar-site/index.html` y 9 páginas de `rwadar-site/plataformas/`
regeneradas.

Commits en `claude/catalogo-2026-11-04`: `7900819` (entrega), `141812b`
(app, deshecho en `dd1cef2`), `b4d5fb1` (traspaso), `dd1cef2` (quita el
cambio de la app), `8caf488` (correcciones de la entrega), `c72b09b`
(fila 19) y el de este informe y el traspaso.

## 6. Comprobaciones

`node rwadar-app/data/verificaciones/2026-11-03.7-v2/comprobar-entrega.mjs`
(PGlite, sin red), correcto en las dos variantes (14 OK):

- cadena de producción 22/10 → 03/11.6, con la 344a86aa publicada;
- rechaza otra revisión anterior y lo deshace todo; idempotente;
- 26 plataformas y 24 ofertas; las 24 ofertas idénticas; fechas del 03/11 y
  7 días; el lector de la web lo acepta y caduca el 11/11;
- en las 26 plataformas solo cambian los 58 textos previstos; estados,
  fuentes y fechas iguales; las 24 tarjetas se ven igual;
- el lote solo lee `public.plataformas` (notas, descartes, cambios de estado
  y avisos, iguales);
- `textos-plataformas.sql`: se niega si un texto anterior no es el previsto,
  es idempotente, cambia solo esas cuatro columnas, no toca estados ni
  fechas, no crea cambios de estado ni avisos; como visitante salen las 4
  descartadas, RealT con «Liquidación anunciada», sin «la mayor», con «unos
  700» y 4 fuentes; la nota nueva de Reental sale en la vista pública;
- con `--con-textos-plataformas`: una sola transacción, guarda, idempotente
  y el mismo resultado.

`node rwadar-app/comprobar-revision.mjs 2026-11-03.7` no sirve aquí: pide el
`cambios-*.json` de `montar-revision.mjs`, que esta entrega no usa (tampoco
la .6).

Otras comprobaciones, tras las correcciones:

- `node rwadar-editorial-source/ofertas/generar.mjs --comprobar`: 24 fichas
  con foto, catálogo 2026-11-03.7-v2.
- `node rwadar-movil/scripts/copiar-idiomas-web.cjs --comprobar`: motor y
  diccionario ES/EN de web y app idénticos. En la app, «Mercado de
  compraventa» sale en inglés como «Marketplace».
- `node rwadar-movil/scripts/comprobar-ota-compatible.cjs --base c1f7106a49e988ca1dde214f0e75b7fe7d4d2719`:
  `{"ok":true,…,"runtime":"1.4.1(23)"}`. No he tocado el `package.json` raíz
  ni `package.json`, `package-lock.json`, `app.json`, `eas.json` o `scripts/`
  de `rwadar-movil`.
- `npm test` completo (raíz, con los `node_modules` enlazados): **en verde,
  código 0**. Base de datos: 28 baterías con 0 fallidas y 30 comprobaciones
  SQL; web: `probar-web.mjs` 579 correctas, fichas 68, precarga 32; QR
  correcto; móvil 406 correctas y 2 omitidas, 0 fallos; herramientas
  correctas (solo el aviso de siempre: `App.js` supera 107 KiB); acceso 144
  correctas. `git status` igual antes y después. La primera pasada falló en
  5 pruebas de `ofertas-vigencia.test.cjs`: cargan de la web solo las
  funciones que nombran y faltaba `tipoEmpresaVisible` (commit `37fc303`; no
  fija ningún texto).
- **Visto en Chrome** (servidor local, sin red fuera de 127.0.0.1, 0
  peticiones externas): en Plataformas, las tarjetas dicen «Mercado de
  compraventa · Asia-Pacífico» / «· Reino Unido»; en la ficha lateral de
  ADDX, «Tipo de empresa: Mercado de compraventa»; en la ficha fija
  `/plataformas/addx`, «Mercado de compraventa · Acciones y capital privado ·
  Asia-Pacífico». A 390 px tres tarjetas cortaban la región con «…»: la línea
  ocupa ahora hasta dos (commit `ca59546`); medido a 320, 390, 768 y
  1280 px, ninguna se corta. Capturas en el scratchpad de la sesión
  (`corrector-1104/capturas/`).
- `git merge-tree` contra `claude/remates` (`8595f54`): el código y los datos
  se unen sin conflictos. El único conflicto es `docs/tareas/PARA-CODEX.md`,
  porque las dos ramas añaden su entrada arriba del todo: hay que conservar
  las dos.

## 7. Pasos exactos que quedan (coordinador)

Todos con la orden de Víctor de este ciclo y solo si pasa cada compuerta. Un
fallo para el ciclo en ese paso.

1. **Revisión de las correcciones** (otro agente): los 15 textos marcados
   «(corrección)» en el §3 contra sus fuentes, y la fila 19 en el código.
   Repetir `node rwadar-app/data/verificaciones/2026-11-03.7-v2/comprobar-entrega.mjs`
   y `preparar-entrega.mjs` en una copia para ver que sale lo mismo byte a
   byte (SHA `d57b5dbc…`). Añadirlo a `REVISION-ENTREGA.md`.
2. **Decidir `public.plataformas`.** Si se acepta (fuera de §5):
   `node rwadar-app/data/verificaciones/2026-11-03.7-v2/preparar-entrega.mjs --con-textos-plataformas`,
   después `node rwadar-app/data/verificaciones/2026-11-03.7-v2/comprobar-entrega.mjs`,
   comprobar que el SHA de `aplicar-y-aprobar.sql` es
   `d2fecfefa50b43ae6d6e3e38fb328da893e9a842fbb049e6e54f432cc3306da1`
   y hacer commit. Si no, se queda como está (`d57b5dbc…`) y Reental, Toucan
   y RealT siguen pendientes. **Ojo:** en esa variante los textos van en la
   misma transacción que el lote. Si en producción el texto de Reental,
   Toucan o RealT, o las fuentes de RealT, no son exactamente los previstos,
   la guarda deshace también los 58 textos del catálogo. Falla sin dejar
   nada a medias, pero entonces hay que volver a la variante sin textos
   (`d57b5dbc…`) y tratar los de `public.plataformas` en una entrega aparte.
3. **Unir a `main`** (PR con merge commit) y push. **Antes o junto con
   `claude/remates`**: las dos ramas se unen sin conflictos. Si remates entra
   antes, regenerar el pre-render y las fichas en el paso 7 (lo hacen
   `npm test` y `rwadar-fichas.js`).
4. **Releer la publicada como visitante** justo antes de aplicar: tiene que
   ser la `344a86aa-2c53-d2f0-fed4-5fdaadda33ad`. **Compuerta obligatoria**
   (CICLO §1.2): nadie la ha leído en línea para esta entrega
   (`revisionAnteriorComprobadaEnRemoto: false`). Guardar la hora y el
   resultado en la evidencia; si no es la 344a86aa, no aplicar. El SQL la
   exige igualmente y lo deshace todo si no coincide.
5. **Aplicar:** GitHub › Actions › «Aplicar catálogo» › Run workflow desde
   `main`, fecha `2026-11-03.7`.
6. **Comprobar en línea** como visitante: revisión `bd1f873b`, 26
   plataformas y 24 ofertas (8/13/3), fecha del lote 03/11, un aviso nuevo
   (por ejemplo ADDX: «No está abierta a cualquier inversor minorista…»); y,
   si se aplicaron, la nota de Reental y RealT con «Liquidación anunciada».
7. **Sincronizar:** `node rwadar-app/sincronizar.js` (reescribe
   `rwadar-site/assets/catalogo-publico-20261022.js` y `rwadar-site/rwadar.csv`),
   `node rwadar-fichas.js` (fichas de plataformas y descartes),
   `node rwadar-editorial-source/ofertas/generar.mjs --comprobar`, `npm test`
   y `npm --prefix rwadar-app run auditar:relanzamiento`. Si se aplicaron los
   textos de `public.plataformas`: `node rwadar-app/volcar-seed.js` para
   `rwadar-app/db/02_seed.sql`. Revisar el diff y hacer commit.
8. **Sellar** `rwadar-app/data/relanzamiento/estado.json` con el commit de la
   sincronización (como en 7e5b481), commit y unir a `main`.
9. **Publicar:** «Publicar web» en preview, revisarla (tarjetas y fichas de
   plataformas con sus avisos y «Mercado de compraventa», `/fuera-del-radar/realt`),
   y después en producción; la comprobación automática tiene que pasar.
10. **OTA:** «OTA Android» desde `main`, **después de unir remates** (trae el
    rótulo «Importante» de la app). Esta rama lleva a la app la fila 19.
    Repetir `comprobar-ota-compatible.cjs --base c1f7106…` sobre `main`.
11. **Traspaso:** marcar en `PARA-CODEX.md` lo aplicado y publicado.

## 8. Lo que no he hecho y por qué

- **Reental, Toucan y RealT:** preparados y probados, pero fuera del lote
  diario (§5). Necesitan que se acepte tocar `public.plataformas` y
  `public.fuentes` (paso 2).
- **Otras filas marcadas como datos:** la fila 6 (noticia de Inicio) está en
  `rwadar-noticias/noticias.json`, que es del repositorio y no del catálogo.
  La lista dice que en las ofertas hay más notas internas («Localizador:
  Ficha GECO», «API: NAV…», «Sin onboarding») que no revisó una a una; no las
  he tocado porque no tienen texto nuevo en la lista y tocarlas cambiaría la
  documentación de las ofertas.
- **Quedan siglas y nombres legales** en algunos detalles («broker-dealer»,
  «ATS», «funding portals», «securities firm», «KYC/AML»): son el nombre del
  registro o del control y se dejan. «trading» en la nota de estado de Taurus
  y «stablecoins» en la de Fireblocks tampoco cambian: son dos de las 4 notas
  que la lista deja como están.
- **No he leído Supabase en línea** (ni siquiera como visitante): la
  revisión anterior sale del snapshot de la última sincronización y el SQL
  la exige (paso 4).

## 9. Correcciones tras la revisión independiente (04/11/2026)

La revisión (veredicto: «se puede aplicar», sin nada grave) está en
`REVISION-ENTREGA.md`. Qué se hizo con cada hallazgo:

| Hallazgo | Gravedad | Qué se ha hecho |
|---|---|---|
| El cambio a «Importante» en la app choca con `claude/remates` | importante | Quitado de esta rama (`dd1cef2`). Llega con remates; la OTA, después de unirla (paso 10). |
| La fila 19 no estaba en ninguna rama | importante | Hecha en esta rama, en el código y solo en lo que se enseña (`c72b09b`); sin conflictos con remates. |
| Quedaba jerga en el acceso de Spiko, Maple y Fireblocks | importante | Reescritos. Con la misma regla, también Courtyard (licencia), OpenEden, Swarm y Reental (acceso). 51 → 58 textos. |
| La nota de RealT sobre «la mayor demanda» no era exacta | menor | Corregida: Outlier lo atribuye a la ciudad; se quita por ser su valoración (§4). |
| El aviso de ARTEX contradecía su nota y el acceso | menor | «No hemos podido confirmar que haya un instrumento que se negocie de verdad; hasta que lo confirmemos, su actividad figura como no verificable.» |
| Retoques de castellano | menor | Midas, Blocksquare, Reental, Archax, ADDX, Centrifuge, Securitize y RealT, como proponía la revisión (Archax: «a través de sociedades», sin «propias», que no dice la fuente; Securitize: «con la opción de darse de alta e invertir»). |
| No se leyó lo publicado antes de preparar (CICLO §1.2) | menor | Sigue sin leerse (este paso no toca nada en línea). El paso 4 es ahora compuerta obligatoria con hora y resultado. |
| El informe solo estaba en el scratchpad | menor | Copiado aquí (`INFORME-ENTREGA.md`), con la revisión (`REVISION-ENTREGA.md`). |
| Con `--con-textos-plataformas`, un fallo de esa guarda para también el lote | menor | Avisado en el paso 2, con la vuelta a la variante sin textos. |

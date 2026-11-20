# Auditoría independiente · radar de plataformas · 20/11/2026

Ámbito: las 25 plataformas activas del radar (`lectura-publica/plataformas-v2.json`)
y las 5 descartadas (`plataformas-todas.json` y `rwadar-site/fuera-del-radar/*.html`).
Hoy el radar no cambia ningún texto (`cambios-radar.json`), así que lo que se
publica es lo mismo que el 13/11. Lo visible en cada plataforma: nombre, tipo,
categoría, región, «quién puede entrar» (`acceso`), «importe de entrada»
(`ticket`), cadenas, resumen (`nota`), «cómo funciona y qué se ha comprobado»
(`aval`, en la página propia de cada plataforma), actividad, licencia, acceso,
avisos y cada fuente con su enlace. En las descartadas: etiqueta, motivo y fuentes.

Cómo se hizo: una petición normal con `curl` (agente por defecto) a las 107
direcciones publicadas (69 fuentes del radar, 25 botones «web oficial» y 13
fuentes de las descartadas) entre las 17:16:12 y las 17:16:19 UTC, más 16 fuentes
primarias extra (BaFin, aviso legal de Swarm, documentación de Blocksquare,
condiciones finales de mTBILL, CNMV, REGAFI, Domoblock, Toucan) entre las 17:19 y
las 17:25 UTC. Las páginas que solo se pintan con JavaScript se abrieron con
Playwright sin trucos (17:16:57–17:18:02 UTC). Ningún 403 se reintentó. Copias en
`/tmp/auditoria-2026-11-20/radar/` (fuera del repositorio).

Resultado: **14 correcciones obligatorias y 6 recomendadas.** El contraste
automático del ciclo (69/69) solo mira la capa de revisión del 13/11; los textos
`aval` y `nota` de julio y agosto no los mira nadie, y ahí están casi todos los
fallos.

## Obligatorias

1. **Swarm · aval.** Publica «Opera bajo licencia de intermediación financiera de
   BaFin, el regulador alemán». La base de datos de BaFin da «Keine Ergebnisse»
   para «Swarm» (17:20:37 UTC) y para «Swarm Markets» (17:20:44 UTC); la misma
   búsqueda con «Smart» sí lista entidades, así que la búsqueda funciona. El
   aviso legal (`docs.swarm.com/about/terms/imprint`, 17:20:33 UTC) dice «Swarm
   Capital GmbH Landstr. 37 9490 FL-Vaduz Liechtenstein» y no nombra licencia ni
   supervisor. La propia ficha dice al lado «ninguna fuente primaria consultada
   indica licencia ni regulador». Corregir a: «La contraparte es Swarm Capital
   GmbH (Vaduz, Liechtenstein). No consta licencia: BaFin no la tiene en su base
   de datos (20/11/2026) y su aviso legal no nombra supervisor.»
2. **INX · aval.** Publica «su matriz cotiza en Nasdaq». El informe de FINRA de
   INX Securities (CRD 162182, 17:16:13 UTC) da como dueña indirecta a «OPENDEAL,
   INC.» (Republic) desde «11/2025» y, para todos los dueños, «Is this a public
   reporting company? No». La alerta de la misma ficha ya dice que no consta que
   INX cotice en Nasdaq. Corregir a: «Bróker-dealer registrado ante la SEC y
   miembro de FINRA (INX Securities, LLC). Desde 11/2025 pertenece a OpenDeal,
   Inc. (Republic), que según FINRA no es una sociedad cotizada.»
3. **Superstate · aval.** Publica «Fondos estadounidenses registrados». La ficha
   de USTB (17:16:14 UTC) dice «Tokenized private fund» y «The Fund is not
   registered as an investment company under the Investment Company Act». Corregir
   a: «Fondo privado estadounidense (USTB, gestionado por Invesco Advisers), con
   auditor (PwC) y custodio (BNY) independientes; no está registrado como sociedad
   de inversión. Superstate Services es agente de transferencias registrado ante
   la SEC.»
4. **Pax Gold · aval.** Publica «Emitido por Paxos bajo supervisión del regulador
   bancario de Nueva York (NYDFS)». La web de PAXG (17:16:14 UTC) dice «PAXG is
   issued by Paxos Trust Company, N.A., a U.S. national trust bank regulated by
   the OCC». Corregir a: «Lo emite Paxos Trust Company, N.A., banco fiduciario
   nacional supervisado por la OCC, con atestaciones mensuales del oro.»
5. **Pax Gold · licencia.** Publica «lista OCC de trust banks activos a
   30/09/2026». El PDF enlazado (17:16:15 UTC) dice ahora «Trust Banks Active As
   of 10/31/2026» (Paxos sigue, charter 25379). Cambiar la fecha a 31/10/2026.
6. **Midas · acceso, aviso y licencia.** Dicen «No se obtuvieron términos finales
   vigentes» y «lo deciden los términos finales vigentes de mTBILL, que no hemos
   podido obtener». Las condiciones finales de mTBILL son públicas: el folleto
   base remite a ellas («Final Terms can be downloaded at https://midas.app/legal»)
   y el PDF del CDN de GitBook (17:22:41 UTC, SHA-256 `b1e58001…944a`, el mismo
   que usa la tarjeta de mTBILL) dice: oferta pública en «Spain» y otros 13
   países, «Prohibition of Sales to EEA Retail Investors: not applicable» y
   mercado objetivo con «retail clients». Corregir a: «Las condiciones finales de
   mTBILL (17/07/2026) incluyen España entre los países de la oferta pública y no
   prohíben la venta a minoristas del EEE. Eso no confirma que la web te deje
   darte de alta.» El radar y la tarjeta de mTBILL no pueden decir cosas distintas.
7. **Blocksquare · aval y nota.** Publican «Vincula cada token a una anotación en
   el registro de la propiedad» y «con respaldo registral». La documentación
   oficial (17:19:05 UTC) dice que el vínculo es un acuerdo societario («Corporate
   resolution… uploaded and stored on IPFS… creates a financial obligation by the
   issuer») que identifica el inmueble con sus datos registrales, y que el
   «registro» es suyo en cadena («Blocksquare's Property Registry — a smart
   contract»). En ninguna página dice que se inscriba nada en el registro de la
   propiedad. Corregir a: «Cada token se apoya en un acuerdo societario del emisor,
   guardado en IPFS, que identifica el inmueble con sus datos registrales y le
   obliga frente a los tenedores. No es una inscripción en el registro de la
   propiedad.»
8. **Lofty · aval.** Publica «con oferta registrada». Sus términos (17:16:13 UTC)
   dicen «Not Registered with the SEC or Any Other Agency» y la web, «Lofty AI,
   Inc., which is not a registered broker-dealer or investment advisor». Ninguna
   fuente dice que la oferta esté registrada; la alerta de la misma ficha dice lo
   contrario. Corregir a: «Inmuebles de EE. UU. troceados con reparto diario de
   renta. Lofty no está registrada ante la SEC y no es un bróker-dealer
   registrado.»
9. **Franklin Templeton · aval y acceso.** El aval termina en «La vía más
   conservadora para empezar» y el acceso se clasifica como «Minorista». El folleto
   del 01/08/2026 (17:16:13 UTC) dice que el fondo «is not registered… in any
   member country of the European Union (EU) or European Economic Area (EEA), and
   may not be directly or indirectly offered or distributed in any such country».
   Quitar la frase de «empezar» (es una recomendación para algo que no se puede
   contratar desde España) y añadir: «Solo para residentes en EE. UU.».
10. **Reental · licencia, aviso y región.** La ficha dice que la licencia «no es
    verificable» y la región es «España». La web de Reental (17:16:14 UTC) dice:
    «Reental es una empresa norteamericana que ofrece inversiones desde Estados
    Unidos y España» y «La actividad no está sujeta a autorización ni registro
    previo de la CNMV». Es un aviso de riesgo importante para una plataforma
    clasificada como minorista. Licencia: «sin registro declarado», con ese
    literal. Aviso: «Reental dice que su actividad en España no necesita
    autorización ni registro de la CNMV: no hay supervisor que la vigile». Región:
    «EE. UU. y España».
11. **Spiko · acceso y nota.** Se clasifica como «Empresas» y la nota dice
    «pensados para la tesorería de empresas». La web de Spiko (17:16:14 UTC)
    incluye «Individuals» entre sus clientes y su página Web3 dice «Spiko funds are
    approved as UCITS and can therefore accept non-professional investors». El
    catálogo publica tres fondos de Spiko disponibles en España desde 1 €.
    Corregir el acceso a «Minorista» y la nota a «Fondos en euros y dólares para
    la tesorería de empresas y particulares, con reembolso diario».
12. **Backed Finance · aval.** Publica «Emisor suizo». La documentación de xStocks
    (17:16:12 UTC) dice «xStocks are issued by Backed Assets (JE) Limited, a
    Jersey-based special purpose vehicle». Corregir a: «Grupo suizo; los xStocks
    los emite una sociedad de Jersey (Backed Assets (JE) Limited), con el activo
    1:1 en custodios regulados y prueba de reservas pública.»
13. **Domoblock (descartada) · motivo.** La frase «Antes sus emisiones pasaban
    por una ESI autorizada; dejó de ser así a partir del proyecto DOMO-VLC-4» no
    aparece en ninguna de las dos fuentes enlazadas (0 menciones de «VLC» a las
    17:16:17 UTC). El resto del motivo sí se sostiene, y además lo dice la propia
    Domoblock en `domoblock.io/faq` (17:23:54 UTC): «en ningún caso ofrece
    instrumentos financieros sujetos a supervisión por parte de la CNMV ni opera a
    través de una entidad de servicios de inversión (ESI)». Quitar la frase de
    DOMO-VLC-4 (o citar su fuente) y añadir `https://domoblock.io/faq` como fuente
    primaria.
14. **Toucan Protocol (descartada) · etiqueta y motivo.** «Registro bloqueado»
    se presenta como motivo actual, pero los hechos son de mayo de 2022. Hoy
    Toucan opera: su documentación (17:24:26 UTC) explica cómo tokenizar «CORCs
    from the Puro Registry», con los créditos «immobilized in an omnibus account
    within the Puro Registry», y su web (17:24:17 UTC) ofrece el fondo CHAR de
    créditos de biocarbón. Revisar el descarte o reescribirlo: «En 2022 Verra y
    ACR prohibieron tokenizar sus créditos sin autorización. Hoy Toucan solo
    tokeniza créditos del registro Puro (fondo CHAR de biocarbón), con los
    créditos inmovilizados en ese registro.»

## Recomendadas

15. **ADDX · aval.** «Accionistas de referencia: la bolsa SGX y el fondo estatal
    Temasek». Su página (17:16:12 UTC) lista «Key shareholders of ICHX Tech, in
    turn the shareholder of ADDX Pte. Ltd.»: SGX, Hanwha, UOB, Heliconia y otros.
    Temasek no aparece con ese nombre. Mejor: «accionistas de su matriz: la bolsa
    SGX, Heliconia (del grupo Temasek), UOB y otros».
16. **Maple Finance · acceso.** Dice que con la página institucional no se pudieron
    confirmar los requisitos. Hoy los da (17:16:14 UTC): «Accredited allocators who
    complete onboarding (KYC/AML). syrupUSDC/USDT remains open to anyone onchain
    outside of the United States.» Conviene ponerlo tal cual en castellano.
17. **Securitize · importe de entrada y acceso.** «Alto» e «Institucional». Su
    portada (17:17:25 UTC) dice «minimum investments starting at $500» y «500K+
    Retail Accounts». Revisar ambos campos y la nota («El nombre más institucional
    del sector»).
18. **Pax Gold · cadenas.** «Ethereum». La web dice «available on Ethereum and
    Solana» y, en otro bloque, «Available on Ethereum, Solana and Base».
19. **Superstate · cadenas.** «Ethereum». La ficha de USTB habla de «Ethereum,
    Solana or Plume» y da saldos en Solana y Plume.
20. **Swarm · nota y región.** «Dentro del marco regulatorio alemán» y «Unión
    Europea». La contraparte está en Liechtenstein (EEE, no UE); los términos solo
    eligen ley alemana y tribunales de Berlín. Mejor: «Acciones y bonos
    tokenizados; contrato con una sociedad de Liechtenstein bajo ley alemana» y
    región «Liechtenstein (EEE)».

## Lo que se sostiene hoy

Archax (CNMV 289 del 08/08/2019; web europea «pre-launch» y solo profesionales),
Fireblocks (NYDFS), Figure (FINRA CRD 307093), OpenEden (solo profesionales BVI y
acreditados de EE. UU.; S&P y BNY), Ondo (EEE: cliente profesional o inversor
cualificado), Taurus (FINMA, CySEC 465/26, TDX como OTF), Tokeny (solo clientes
profesionales), tZERO (FINRA CRD 123421), Republic (FINRA 291387 y portal 7-167),
Spiko (AMF, CNMV 2380 y 5325; REGAFI España desde el 08/01/2026, misma huella
`fdf10d2d…` a las 17:22:08 UTC), Midas (folleto del 17/07/2026 válido hasta el
17/07/2027 y pasaporte en la CNMV, BPWO-84), Franklin (mínimo de 20 USD en
Stellar), Reental (mínimo de 100, 311 reseñas), ARTEX (sin blockchain) y RealT
(demanda de julio de 2025, 165 sociedades, más de 400 inmuebles, liquidación
anunciada en julio de 2026, unos 700 inmuebles).

## Sin poder comprobar

- Centrifuge: `centrifuge.io` y `/terms` dan 403 de Cloudflare (17:16:12–13 UTC).
  No se comprueban su aval («dos tercios del crédito privado tokenizado»), su nota
  («impagos por 5,8 M$ en 2023») ni su acceso y licencia.
- Courtyard: `courtyard.io` da 403 (17:16:13 UTC). Ni actividad ni «Líder por
  volumen semanal en 2026».
- Midas: `midas.app/llms.txt` da 403 de Cloudflare (17:16:14 UTC). La lista de
  productos de la actividad queda sin comprobar.
- Republic: el botón `republic.com` da 403 con desafío (17:16:16 UTC). Lo de los
  Mirror Tokens de la nota queda sin comprobar.
- Goldfinch (descartada): The Block (403 con desafío) y The Defiant (403), a las
  17:16:17 UTC. Motivo sin comprobar.
- RealT y Toucan: `detroitmi.gov` (403 con desafío) y S&P Global (403 de Akamai).
  Las otras fuentes de esas fichas sí responden.
- Figure: «Cotiza en Nasdaq (FIGR)». `investors.figure.com` da 403 (17:19:26 UTC).
- Sin fuente enlazada y sin comprobar hoy: la nota de Midas («Levantó 50 M$ con
  Franklin Templeton y Coinbase Ventures»), las cifras de Maple del primer
  semestre (4.600 M$, +81 %, 1.900 M$), los superlativos de Ondo y tZERO, «Es
  quien emite… BUIDL» de Securitize (las fuentes enlazadas no nombran BUIDL),
  «activas desde 2021» de Backed y los avisos de la FCA sobre clones de Archax.

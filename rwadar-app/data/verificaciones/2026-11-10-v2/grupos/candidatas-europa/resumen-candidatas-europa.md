# Candidatas de Europa · resumen (ciclo 10/11/2026)

Grupo: **candidatas-europa**. Busqué ofertas nuevas de **inmuebles, deuda,
energía y préstamos tokenizados** de proveedores de otros países del EEE que un
particular residente en España pueda comprar hoy. Leí todo hoy, 10/11/2026,
entre las 09:02 y las 09:30 UTC. Las horas exactas de cada consulta están en
`inventario-consultas.json`. Solo usé páginas y documentos públicos: no inicié
sesión, no hice KYC, no conecté wallets ni rellené formularios.

## Resultado en una línea

**Hoy no propongo admitir ninguna.** He barrido los dos caminos por los que una
oferta tokenizada del EEE puede llegar legalmente a un particular en España
(plataforma de financiación participativa con pasaporte y folleto aprobado con
pasaporte). En inmuebles, deuda, energía y préstamos no hay hoy ninguna oferta
abierta que cumpla todo lo esencial. La vía más prometedora es **Profitus**: es
una plataforma lituana con pasaporte en España que distribuye bonos digitales
anotados en un sistema DLT autorizado (Axiology). Pero **hoy no tiene ninguna
emisión de bonos abierta**.

## Expedientes

| Slug | Decisión | Por qué, en pocas palabras |
|---|---|---|
| `dexentra-oilxcoin` (nueva) | no_admitir | Token de deuda ligado a petróleo y gas, con folleto aprobado por la FMA de Liechtenstein (10/04/2026) y notificado a la CNMV. Pero lo vende el propio emisor suizo, sin intermediario regulado. Su web lo dirige a «accredited and qualified investors». No paga rendimiento ni tiene mercado ni recompra: solo cobras si se da por terminado el token. Además, el emisor tenía unos 51.000 USD de fondos propios a 31/12/2024. |
| `blocksquare-oceanpoint-marketplace` (nueva) | no_admitir | Responde al pendiente: **sí** hay hoy una oferta concreta en la red Blocksquare. Es Oceanpoint, con 3 inmuebles en Brujas (Bélgica). Pero el operador (Blocksquare S.à r.l., Luxemburgo) no tiene licencia de financiación participativa (ECSP), MiFID ni de criptoactivos (CASP). Tampoco publica documento de emisión ni lista de países, y sus términos (de 2022) son los de un protocolo DeFi. |
| `profitus-axiology-bonos-digitales` (nueva) | no_admitir (vigilar) | Profitus tiene licencia de financiación participativa (ECSP) y figura en la CNMV (nº 21). España es uno de sus cuatro países principales y tiene web en español. Sus bonos se anotan en Axiology, que el Banco de Lituania autorizó como sistema DLT de negociación y liquidación el 09/07/2025 (lista de ESMA). **Pero hoy no hay ningún bono a la venta**: solo préstamos con garantía inmobiliaria, que no están tokenizados. |
| `bergfuerst` (nueva) | no_admitir | Su propio aviso legal dice **«BERGFÜRST AG i.L. (in Liquidation)»**. Su licencia solo cubre intermediar préstamos y no tokeniza nada. La CNMV (nº 47, desde el 20/12/2025) y ESMA la siguen listando como activa sin indicar la liquidación. |
| `reinvest24` (nueva) | no_admitir | **La CNMV publicó una advertencia el 09/06/2025**: REINVEST24 OÜ no está autorizada como plataforma de financiación participativa. Además, su web dice que no acepta inversiones desde noviembre de 2023. No hay que volver a proponerla. |

## Cómo barrí el mercado

1. **Plataformas de financiación participativa del EEE con pasaporte en España.**
   - El listado de la CNMV tiene **48 proveedores** notificados, sin cambios desde el 03/11.
   - El registro de ESMA tiene **261** proveedores (239 activos).
   - Abrí la portada de 44 de los 48 notificados en España (Acredius, Blast Angels, Gamevestor y We Take Part no respondieron por el proxy; trade.eurivex.com dio 403 y digilo.com es un dominio aparcado). **Ninguna habla de tokenización ni de blockchain** como producto. StockEstate solo lo usa como etiqueta de blog.
   - Las que ofrecen inmuebles (Estateguru, Profitus, Nordstreet, Inrento, StockEstate, Crowdestate…) y préstamos agrícolas (LANDE) venden préstamos o notas **no tokenizados**. Quedan fuera del criterio de RWAdar.
   - El resultado está en `fuentes/barrido-portadas-ecsp.json`.
2. **Folletos aprobados en otro país del EEE y notificados a España.** En el registro de folletos de ESMA hay **208 emisores no españoles** con folleto o folleto base pasaportado a España desde el 10/11/2025. Entre ellos, los tokenizados son:
   - **ya en el radar o revisados por otros grupos:** Backed (xStocks), Ondo, Robinhood, Midas (mTBILL) y Altarius (Hausera ETI);
   - **nuevo y de mi ámbito:** DeXentra (OilXCoin), con expediente arriba;
   - **nuevos y de acciones (pista para el grupo acciones-oro-tesoro, no estudiados a fondo):**
     - **S01 Issuer GmbH**: «Program on the Issuance and Offer of Token», folleto BPWO-77 de la FMA del 30/03/2026, con pasaporte a España. Según fuentes secundarias, emite los tokens de acciones de ST0x.
     - **NOEMON TECH LIMITED**: «Program on the Issuance and Offer of Blockchain-based Certificates», BPWO-71 del 01/12/2025, con pasaporte a 10 Estados, España incluida.
   - **lo que no son tokens:**
     - Floin AG: acciones preferentes anotadas en cuenta.
     - iMAPS: certificados.
     - Notas de préstamos no tokenizadas: Mintos (decenas de «Mintos Finance No. X»), Indemo (NPL españoles), Nectaro, TWINO, VIAINVEST y DN Funding Zeta.
     - ETP de cripto: 21Shares, CoinShares, DDA, Fineqia, Valour, Bitwise y otros.
3. **Régimen piloto DLT de la UE.** La lista de ESMA (enero de 2026) incluye 4 infraestructuras: CSD Prague, 21X, 360X y Axiology. Solo Axiology tiene hoy un canal claro hacia particulares con pasaporte en España, que es Profitus.

## Las ideas del encargo, una a una

| Idea | Qué hay hoy | Fuente de hoy |
|---|---|---|
| Bergfürst | En liquidación; solo préstamos. Expediente. | Aviso legal de bergfuerst.com |
| Exporo | Su proveedor de financiación participativa (EPH Investment GmbH, Alemania) está activo en ESMA (05/12/2023), pero **no está notificado en España** según la CNMV. Sus folletos en ESMA son de 2019–2020. | ESMA ECSP; listado CNMV |
| Rendity, Ecoligo, Bettervest | No figuran como proveedores de financiación participativa en ESMA ni en el listado de la CNMV. | ESMA ECSP; listado CNMV |
| Reinvest24 | Advertencia de la CNMV del 09/06/2025; en cierre ordenado. Expediente. | Buscador de advertencias de la CNMV |
| Estateguru | Notificada en España (nº 5), pero vende préstamos, no tokens. | Listado CNMV; portada |
| LANDE | Notificada en España (nº 23); préstamos agrícolas al 11,2 % anunciado, **sin tokens**. | Listado CNMV; portada lande.finance/es |
| Blocksquare | Oceanpoint: oferta concreta, pero sin licencia. Expediente. | oceanpoint.fi |
| STOKR | Hoy solo es CASP y entidad de pago (CSSF, 22/06/2026). Su web dice que **no ofrece ni comercializa instrumentos financieros**. Sus productos son notas de minería de bitcoin y una acción preferente tokenizada (STRC), no activos reales de mi ámbito. No hay folletos suyos en ESMA. | stokr.io; registro MiCA de ESMA |
| Smart Valor | CASP de Liechtenstein desde el 01/07/2026 (custodia y plataforma de criptoactivos). No tiene producto de activos reales. | Registro MiCA de ESMA |
| Tokentus | Solo un folleto de acciones de 2021 (Alemania), sin pasaporte y sin tokens. | Registro de folletos de ESMA |
| Bitbond / Cashlink | Son infraestructura (emisión y registro de criptovalores). No hay folleto suyo pasaportado ni oferta a particulares. | Registro de folletos de ESMA |
| Mintos | Sus notas tienen folleto pasaportado a España, pero **no están tokenizadas**. | Registro de folletos de ESMA |
| Inveniam, Realtyfi, Tokenise | No encontré ninguna entidad ni oferta con esos nombres en ESMA ni en la CNMV. | ESMA; CNMV |
| Bonos digitales de bancos | El único documento leído es el del NN Bank (26/05/2026): es un piloto de «programa ficticio» con **prohibición expresa de venta a minoristas del EEE**. No comprobé LuxSE ni SIX Digital Exchange (SDX es suiza; corresponde al grupo suiza). | Condiciones del NN Bank |
| LCX (bonos tokenizados) | Sigue: «LCX Earn is closed to new investments». | lcx.com/en/earn |
| MetaWealth (pista que salió hoy) | Tokeniza inmuebles europeos, pero no figura en ESMA como ECSP ni como CASP. | Registros de ESMA |

## Advertencias de la CNMV consultadas hoy

- **Con coincidencias:**
  - **Reinvest24:** advertencia del 09/06/2025.
  - **Lande:** tres coincidencias ajenas (dos dominios «…/lander/…» y Clandestiny Group), nada sobre LANDE Platform.
- **Sin coincidencias:** DeXentra, OilXCoin, Blocksquare, Oceanpoint, Profitus, Axiology, Bergfürst, Bergfurst, Stokr, Smart Valor, Stock.estate, Stockestate, Exporo, Indemo, Mintos, Estateguru, Realtyfi, Tokenise, Bitbond, Cashlink, Tokentus, Rendity, Ecoligo, Bettervest, Inveniam, MetaWealth y Bricks.co.
- **Control positivo:** la búsqueda «OKX» sí devuelve sus dos advertencias, así que el buscador funcionaba.

## Avisos para el coordinador y otros grupos

- **Bergfürst sigue en el listado de la CNMV** de plataformas europeas con pasaporte, aunque está en liquidación. No afecta a nada publicado.
- **Para el grupo acciones-oro-tesoro:** hay dos programas de tokens con folleto de Liechtenstein pasaportado a España que no he estudiado: S01 Issuer GmbH (ST0x) y NOEMON TECH LIMITED.
- **Para un ciclo futuro:** vigilar si Profitus abre un bono registrado en Axiology. Sería la primera deuda tokenizada con todo en regla para un particular en España desde otro país del EEE.

## Bloqueos

- El proxy devolvió 502 o cortó la conexión con wetakepart.com, gamevestor.com, blastangels.com, acredius.ch, acredius.pt y fundaus.eu. Reintenté con pausas, sin éxito. Sí abrí fundaus.com. Los cuatro restantes no se pudieron barrer.
- Lo que solo se ve con cuenta y no intenté:
  - el mercado de Oceanpoint (precio por token, documentos y países admitidos);
  - el área de compra de OilXCoin (precio vigente);
  - la ficha de cada oferta de Profitus.
- El registro ECSP de ESMA no dice a qué países tiene pasaporte cada plataforma. Para España usé el listado de la CNMV.
- El folleto completo de OilXCoin pesa 4,4 MB. Está en `fuentes/crudo/`, fuera de Git. La nota de síntesis en español también está ahí, porque nombra a personas físicas. En `fuentes/oilxcoin/` dejé su texto con los nombres recortados.

## Archivos

- **Expedientes:** `../../expedientes/dexentra-oilxcoin.json`, `blocksquare-oceanpoint-marketplace.json`, `profitus-axiology-bonos-digitales.json`, `bergfuerst.json` y `reinvest24.json`.
- **Copias de lo leído:** `fuentes/`, con los nombres de personas recortados.
- **Barrido de portadas:** `fuentes/barrido-portadas-ecsp.json`.
- **Respuestas crudas, HTML completos y PDF grandes o con nombres:** `fuentes/crudo/`, fuera de Git. Están los JSON de ESMA (proveedores de financiación participativa, folletos pasaportados a España desde el 10/11/2025, DeXentra y otros), los CSV de MiCA y la API de países de Profitus.
- **Inventario:** `inventario-consultas.json`, con URL, archivo, HTTP, hora, bytes y SHA-256 de cada consulta, más las búsquedas de descubrimiento.

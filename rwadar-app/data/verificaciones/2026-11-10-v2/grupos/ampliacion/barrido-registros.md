# Barrido por registros oficiales · pistas nuevas · 10/11/2026

Grupo: **ampliacion** (buscador de pistas, no expedientes). Lectura entre las
09:13 y las 09:35 UTC. Solo páginas, documentos y API públicas: sin iniciar
sesión, sin KYC, sin wallets, sin formularios. Las horas, los SHA-256 y los
bytes de cada consulta están en `inventario-barrido-registros.json`. Las
respuestas crudas están en `fuentes/crudo/`.

## Resultado en una línea

El barrido de registros **solo deja una pista nueva con oferta abierta hoy**:
los **bonos digitales DLT de CrowdedHero** (plataforma de financiación
participativa de Letonia que la CNMV lista como prestadora de servicios en
España). Tiene dudas serias y le doy **prioridad 2 de 5**. Todo lo demás que
sale en los registros ya lo cubre RWAdar o lo estudia otro grupo, o no tiene
hoy una oferta concreta abierta a particulares en España.

## Qué registros recorrí

| Registro | Qué saqué | Fuente |
|---|---|---|
| ESMA, proveedores de financiación participativa (ECSP) | 261 entidades; 64 activas con sede en España o notificadas a España. El registro de ESMA está incompleto para España: varias que la CNMV sí lista no llevan la notificación a España en ESMA (CrowdedHero figura como «EUROPEAN UNION»). Por eso uso la lista de la CNMV como referencia para España. | API pública `esma_registers_upreg` (tipo CSP), `crudo/esma-ecsp-entidades.json` |
| CNMV, PSFP españolas (27) y europeas que prestan servicios en España (53) | Revisé las portadas de todas en busca de «token», «DLT», «blockchain» o «security token». Solo hay ofertas tokenizadas reales en **CrowdedHero**. Aparte salen Alius y Urbanitae, que ya están cubiertas. Stock.estate solo tiene una etiqueta de blog. | `cnmv/psfp-espanoles.html`, `cnmv/psfp-europeos.html` |
| ESMA, infraestructuras del régimen piloto DLT (PDF creado el 04/11/2026) | Hay 8: CSD Prague, 21X, 360X, Axiology, LISE, Securitize Europe, **Seturion** (Börse Stuttgart, 16/10/2026) y Bit2Me STX (27/10/2026). Revisé cada una más abajo. | `esma-dlt-autorizadas.pdf` |
| ESMA, registro provisional de MiCA (CASPS, OTHER, ARTZZ) | `ARTZZ.csv` sigue vacío: no hay ningún emisor de fichas referenciadas a activos autorizado. En `OTHER.csv` (1.071 white papers) los tokens con algún activo real detrás son white papers notificados, no autorizados. Por definición no son instrumentos financieros: LCX Gold, DGLD, NatGold, APF Digital Agrifund (el PDF da 403), Digital Energy y Fuse Energy. | `crudo/mica-*.csv` |
| CNMV, proveedores de criptoactivos (PDF del 09/11/2026) | No aparece ningún proveedor nuevo que ofrezca a particulares activos reales tokenizados. Los nombres posibles (Stokr, Bit2Me, Criptan) ya están cubiertos. DLT Securities GmbH es la entidad de Nexo en el EEE (cripto). Prakma Markets, S.L. (09/10/2026) no tiene nada público. | `cnmv/listado-casp.pdf` |
| CNMV, empresas de servicios de inversión del EEE en libre prestación (hoy) | Frente al 01/11 solo cambian espacios en los nombres; no hay entidades nuevas. **UAB Axiology DLT** sí está. **LISE no está**. | `cnmv/esi-eee-libre-prestacion.html` |
| Folletos con pasaporte a España aprobados desde el 01/07/2026 (219 documentos) | Los únicos con tokens o DLT son Backed (xStocks), Ondo Global Markets, Robinhood Assets (Jersey), que tiene un suplemento del 09/11 y lo estudia otro buscador de este grupo, y Midas. Los demás son productos estructurados de bancos, ETP de cripto, Mintos y notas de Nectaro (no tokenizadas). | API `esma_registers_priii_documents`, `crudo/esma-folletos-es-2026h2.json` |
| Advertencias de la CNMV | Busqué CrowdedHero, Crowded, Balvora, Simpleros, Nyala, Profitus, Axiology y LISE: «No hay datos disponibles» en todas. Control positivo: OKX sí devuelve su advertencia del 04/04/2022. En el PDF de «otras entidades» (27/10/2026) no hay coincidencias. | `advertencias/` |

## Pista que propongo mirar

### CrowdedHero · bonos digitales DLT (eWpG) · prioridad 2

- **Entidad.** SIA «CrowdedHero Latvia». Es proveedor europeo de financiación
  participativa autorizado por Latvijas Banka el 16/08/2022 (LEI
  984500B08DG03M3EA171, registro ESMA). La CNMV la incluye entre los
  proveedores europeos que prestan servicios en España: «CROWDEDHERO LATVIA
  LTD (SIA CROWDEDHERO LATVIA) · LETONIA · 1 · 01/09/2022».
- **Qué se compra.** Según el contrato de suscripción de bonos DLT (versión
  1.0, en vigor desde el 01/07/2026), son «DLT-based transferable securities
  (Kryptowertpapiere)», inscritos en un registro electrónico de criptovalores
  alemán (eWpG), en el que «Registration constitutes legal ownership».
- **Ofertas abiertas hoy:**
  - **Amber Hostelis**, de SIA «BALVORA Group» (Liepāja, Letonia): «DLT
    digital bond €250 nominal value · 12% p.a. · 3.5 years». El mínimo es de
    500 € (dos bonos). Quedan 35 días. Lleva recaudados 1.000 € de un mínimo
    de 50.000 €. El principal se devuelve el 15/03/2030.
  - **Simpleros**, de Simpleros S.L. (Barcelona, crédito al consumo): «10,5%
    Fixed Yield Tokenized Digital Bonds», con un mínimo de 250 € y
    vencimiento el 15/11/2028. Son **subordinados**. Quedan 4 días y va
    financiado al 82,3 %.
- **Acceso.** El contrato exige que el inversor sea «resident … in an EU/EEA
  Member State». Se paga en euros a través de Lemonway. La comisión de
  administración es del 1,25 % de lo invertido.
- **Salida.** No hay salida antes del vencimiento: «there is no secondary
  market for Digital Bonds; they are issued under a 'buy and hold' model».
  Solo se puede traspasar a otro inversor dentro de la plataforma, con KYC y
  pagando una comisión.
- **Dudas que impiden subir la prioridad:**
  1. **La ficha clave (KIIS) no es pública.** La página dice «only registered
     and Verified investors could access the restricted Project campaign
     documents». Sin la KIIS no se puede comprobar el emisor, los países de
     la oferta ni los riesgos.
  2. **Las páginas no están terminadas.** En la de Amber se lee «[TO BE
     COMPLETED AFTER FINAL BUDGET APPROVAL…]» y la emisión figura como
     «Planned for September 2026», aunque sigue abierta en noviembre. En las
     dos, la sección de documentos tiene texto de relleno («Lorem ipsum…»,
     «Moneyz.csv»).
  3. **Conflicto sobre quién emite.** El contrato dice que los bonos «are
     issued by "NYALA Digital Asset" AG». La ficha de Amber dice «direct
     issuance without an SPV».
  4. **Emisores pequeños y frágiles.** Del de Amber: «The company's equity
     was negative at the end of 2025» y «The property is leased». El de
     Simpleros es subordinado, cierra en 4 días y es crédito al consumo.
  5. La web solo está en EN, DE y LV. La plataforma promociona además un
     token cripto propio, CrowdX (CRDX), con su white paper.
- **Para cerrarla hace falta:** la KIIS de Amber Hostelis con su lista de
  países, el nombre del registrador eWpG (¿NYALA / Smart Registry?) y que las
  páginas estén completas. Si no, no es admisible.

## Miradas y descartadas (resumen)

- **Profitus + Axiology** (bonos digitales DLT desde 500 €). Profitus está
  notificada a España en ESMA y en la CNMV (nº 21), y Axiology está en la
  lista de la CNMV de libre prestación. Pero la API pública de Profitus solo
  da préstamos («loan_type: standard»), sin ningún bono abierto. El último
  bono DLT del que hay noticia cerró en mayo de 2026. **Vigilar.**
- **LISE** (Francia, sistema DLT de negociación y liquidación). Tiene una
  sola acción tokenizada, ST Group, en el mercado secundario. Su salida a
  bolsa fue en abril de 2026. LISE no está en la lista de la CNMV de libre
  prestación y sus condiciones generales no hablan de no residentes.
- **Seturion** (Börse Stuttgart, autorizada el 16/10/2026). Société Générale
  y flatexDEGIRO anunciaron productos estructurados tokenizados para
  minoristas, pero no hay ninguna emisión publicada.
- **21X y 360X.** Solo atienden a clientes institucionales o profesionales.
- **Securitize Europe**, sistema DLT autorizado por la CNMV. No se ve ninguna
  emisión para minoristas (también la mira otro buscador del grupo).
- **CSD Prague.** Es solo un sistema de liquidación, sin oferta a
  particulares.
- **CONDA Capital** (Austria, notificada a España). Usa NYALA, pero sus bonos
  abiertos se ofrecen solo en Alemania y Austria («Angeboten in AT, DE») y
  llevan ISIN clásico.
- **Nectaro** (notas con folleto pasaportado a España). No son tokenizadas.
- **Tokens de MiCA con activo real** (APF Digital Agrifund, Digital Energy,
  Fuse Energy, NatGold, DGLD, LCX). Son white papers notificados, no
  autorizados, y no son instrumentos financieros. El oro lo lleva otro grupo.

## Avisos para el coordinador

- El registro de ECSP de ESMA (API `upreg`, tipo CSP) no lleva completas las
  notificaciones a España. La lista de la CNMV es la referencia buena.
- Otros buscadores del grupo `ampliacion` trabajan en la misma carpeta
  (Robinhood Assets Jersey, Amundi, Kriptown, Metawealth, Openbrick,
  Securitize EU). No toqué sus archivos.

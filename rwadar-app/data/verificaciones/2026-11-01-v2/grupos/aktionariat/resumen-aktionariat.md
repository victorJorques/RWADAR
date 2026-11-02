# Grupo aktionariat · resumen · 01–02/11/2026

## Qué he revisado

Las cinco fichas publicadas que usan la tecnología de Aktionariat (portales
`shares.*`), más seis empresas candidatas sacadas del directorio de
aktionariat.com. Por cada una he guardado y consultado:

- la portada del portal y los datos que lleva dentro (precio, política de
  valoración, documentos);
- la lista de operaciones (`/api/secondarymarkets/getTrades`);
- la configuración del contrato de venta (`/api/brokerbotsettings`);
- las páginas `/invest` y `/trade` tal como se ven en un navegador (texto y
  captura), con el libro de órdenes;
- la lectura on-chain de solo lectura (`settings()`, `getPrice()`,
  `increment()`) del contrato de venta del emisor;
- su ficha en el registro mercantil suizo (ZefixREST);
- la lista de advertencias de FINMA completa (2.401 entradas) y el buscador de
  advertencias de la CNMV.

Todo está en `fuentes/`, con el `inventario-consultas.json` (hora, tamaño y
sha256 de cada fichero).

Cómo leer los datos del contrato. Según `DirectInvestment.sol` (GitHub de
Aktionariat, commit 288fd7d), el bit 0x1 de `settings()` indica que la compra
está habilitada. No he comprobado en el código qué significan los demás bits.

## Lo que tienen en común (y la respuesta para el cliente)

- **Supervisión.** Ninguna de estas empresas está supervisada como entidad
  financiera. El propio portal dice que su mercado secundario es una
  «non-commercial trading facility» y que no tiene supervisión prudencial.
  Ninguna aparece en la lista de advertencias de FINMA. En la CNMV no sale
  ninguna de las que pude buscar: Aktionariat, Boss Info, wemakeit,
  ServiceHunter, Switzerlend, Alan Frei y RealUnit.
- **Folleto.** No hay folleto ni KID en ninguna. Las ventas se acogen a umbrales
  de exención (FinSA en Suiza; 100.000 € en total para el EEE en el aviso de
  Aktionariat).
- **Cómo se vende.** El emisor ya no recompra en ninguna de las cinco. La única
  salida es vender a otros accionistas en el mercado secundario. Ese mercado se
  paga solo en Frankencoin (ZCHF, una criptomoneda ligada al franco suizo) desde
  un monedero propio, sin transferencia bancaria. Hoy cobra 0 % de comisión.

## Fichas publicadas

| slug | decisión | qué cambia (fuente) |
|---|---|---|
| aktionariat | **actualizar** | Venta del emisor **abierta a 7,25 por acción, precio fijo** (`/invest`; on-chain `getPrice()`=7,25, incremento 0). La última compra fue el **31/10/2026** (`getTrades`). El aviso legal de aktionariat.com admite a **residentes en Suiza o el EEE** (España incluida), con un **tope total para el EEE de 100.000 €** cuyo consumo no se publica. Mínimo por transferencia: 500 CHF. Para vender: la **recompra está cerrada «for the foreseeable future»**; la mejor oferta de compra en el secundario es 6,00 ZCHF y solo por 5 acciones (`/trade`). |
| boss-info | **actualizar** | El emisor vende a **8,50197** (on-chain), pero la última operación es del **28/09/2026: 6,70 ZCHF entre accionistas**. Recompra desactivada por «ventana de mantenimiento». La mejor oferta de compra es 7,30 ZCHF por 1.000 acciones. El portal no dice qué países pueden comprar. |
| wemakeit | **retirar_propuesta** | **Conflicto resuelto.** Los 8,38 CHF son el precio guardado en un contrato de venta desactivado (`settings()`=0; valoración «ISSUER_DEFINED»). No corresponden a ninguna operación. El precio real es **0,80 ZCHF (20/10/2026)**, con cruces entre 0,10 y 1,00 desde julio. El emisor no vende. Diferencial del 86 %: la mejor compra es 0,11 ZCHF. |
| servicehunter-quitt | **retirar_propuesta** | **Conflicto resuelto.** El «Last trade 2 Oct 2026, 00:00» es un punto de control de precio, no una operación. La última operación real es del **23/07/2026 a 8,00 ZCHF** (`getTrades`, 480 operaciones). El emisor no vende. Los compradores visibles suman 16 acciones. Además, los **estatutos restringen la transmisión de las acciones desde 2023** (Zefix, SHAB 17/11/2023). |
| switzerlend | **actualizar** | Venta del emisor **abierta a 68,0105 por acción preferente C1** (on-chain); última compra el 07/10/2026. La recompra está cerrada; la mejor compra en el secundario es 59,00 ZCHF por 4 acciones. Las C1 tienen preferencia en caso de liquidación y no tienen restricción de transmisión (Zefix). El portal no dice qué países pueden comprar. |

Retirar una ficha lo decide Víctor. Yo lo propongo para wemakeit y quitt por
tres motivos: no se puede comprar al emisor, la liquidez es casi nula y la cifra
de precio que se ve en el portal confunde.

## Candidatas (todas `no_admitir`)

- **art-leasing-invest**: su aviso legal admite expresamente Suiza y el EEE
  (tope de 100.000 €), pero no he comprobado actividad reciente, la página está
  desfasada (habla de XCHF y de una app antigua), el mínimo es de 5.000 CHF y no
  he leído los acuerdos. Merece revisarla en el próximo ciclo.
- **alan-frei-company**: venta abierta, última compra el 20/10/2026, 683
  accionistas y mínimo de 1 CHF. No hay ningún aviso que admita a residentes en
  España y no he leído los acuerdos.
- **realunit**: excluye España; solo admite residentes en Suiza, Alemania,
  Austria y Liechtenstein. Además, la compra por el contrato está desactivada.
- **twiliner**: mínimo de 5.000 CHF, sin compras desde el 06/11/2025 y dos
  precios distintos (3,00 y 2,56).
- **fieldoo**: 15 accionistas y última compra el 11/06/2026.
- **carnault**: portal privado (HTTP 401).

## Bloqueos y pendientes

- No he probado el registro ni el KYC de ningún portal; el encargo lo prohíbe.
  Que Aktionariat admita a residentes en España sale del aviso legal, no de una
  prueba.
- No he buscado a ninguna empresa por nombre en el registro de entidades
  autorizadas de FINMA; solo he consultado su lista de advertencias.
- CNMV: la búsqueda de «Art Leasing» no cargó resultados. Twiliner, Fieldoo y
  Carnault no se buscaron.
- Los Registration Agreements de quitt y de Switzerlend están escaneados y no
  tienen texto que se pueda extraer.
- De las candidatas no he descargado ningún documento legal (se cerró la fase
  de captura).

# Resumen · grupo acciones-oro-tesoro · 10/11/2026

Investigador: Claude. Consultas hechas el 10/11/2026 entre las 09:01 y las 09:16 UTC.
Revisé las cuatro fichas publicadas del grupo volviendo a abrir hoy sus fuentes primarias:
documentos del emisor, páginas del proveedor, registros de supervisores, advertencias de la
CNMV y, en mTBILL, la cadena de bloques. Cada documento se comparó con el del 05/11 por su
huella SHA-256 o, en las páginas web, palabra a palabra.

| Ficha | Decisión | Qué cambia hoy |
|---|---|---|
| Robinhood Classic Stock Tokens | mantener | Nada crítico. Aparece un KID en español (conviene citarlo) |
| Kraken xStocks | mantener | Nada. El primer aviso se queda |
| Prosegur Digital Gold | mantener | Nada en la tarjeta. El gramo cuesta 122,33 € hoy |
| mTBILL | actualizar | Valor por token 1,0776 USD (09/11). Más pruebas de que un particular en España puede comprarlo |

## Robinhood Classic Stock Tokens (mantener)

- **Lo mismo que el 05/11.** El KID en inglés, la descripción de servicios y la tabla de
  tarifas son los mismos archivos (SHA-256 idéntico). La página en español dice lo mismo:
  desde 1 €, más de 2.000 acciones y ETP, sin derecho sobre la acción.
- **Horario 24/5:** la web en español dice que se negocia «desde el lunes a las 2 de la
  madrugada CET/CEST hasta el sábado a las 2 de la madrugada». El KID matiza que lo normal es
  el horario del NASDAQ y que el horario ampliado puede no estar siempre disponible.
- **Supervisión:** el Banco de Lituania (3 licencias) y la CNMV (n.º 5299, con derivados en el
  programa) muestran lo mismo. No hay advertencias de la CNMV.
- **Novedad (no crítica):** la página en español enlaza un **KID en español** (1 de julio de
  2026, riesgo 7 de 7, plazo de 1 año) y la descripción de servicios en español. RWAdar no los
  tenía registrados. Propongo añadir el KID en español a las fuentes de la ficha.
  Ojo: ese KID tiene una errata en la tabla de costes (dice 0,00 % de entrada, pero calcula
  10 € sobre 10.000 €, que es un 0,10 %, igual que el KID inglés y la tarifa). La métrica
  publicada sale de la tarifa oficial y no cambia.

## Kraken xStocks (mantener)

- **Pendiente: ¿hay condiciones finales del emisor que incluyan España?** No. Las de SPYx,
  AAPLx y NVDAx (08/05/2026) y la más reciente leída (JBBBx, 03/11/2026) son los mismos
  archivos que el 05/11 y siguen diciendo «The Products will be offered in Liechtenstein and
  Switzerland (only to Swiss Professional Investors)». El registro de ESMA no tiene condiciones
  finales ni suplementos del emisor posteriores al 03/11 (consulta de las 09:03 UTC).
  **El primer aviso no se puede quitar.**
- El folleto base, el segundo suplemento y las condiciones finales de LITEx (las que cita la
  ficha) se descargaron de nuevo: mismo SHA-256.
- Página de Kraken UE, tabla de comisiones (1 % o hasta 2 USD en la versión inglesa, más un
  diferencial sin cifra), soporte, CySEC (342/17), CNMV (4474), pasaporte del folleto en la
  CNMV y advertencias: sin cambios.
- Los KID en español se volvieron a fechar el 09/11, con la misma clase de riesgo. La ficha no
  los usa.
- La web del emisor (assets.backed.fi) sigue bloqueada por país. No se intentó sortear.
- Los términos de xStocks de kraken.com describen la venta por la sociedad de Bermudas, no por
  la europea. Tampoco explican la base de la venta en España.

## Prosegur Digital Gold (mantener)

- **Condiciones:** el contrato (actualizado el 08/07/2026) dice lo mismo, palabra a palabra.
- **Comisiones:** se compra a precio LBMA +4 % y se vende a LBMA −6 % (§5.4). La cifra de la
  tarjeta sigue vigente.
- **Custodia:** oro en el búnker de Prosegur Cash, en lingotes de 1 kg de pureza 999,9. Es un
  inventario común: no hay un lingote asignado a cada cliente. La página de transparencia
  sigue sin enlazar ningún informe de auditoría ni la póliza de seguro.
- **Salida:** solo puedes revender a Prosegur Crypto. Pagan en 1 a 7 días hábiles y la
  recompra puede suspenderse.
- **Precio de compra del gramo:** 122,33 € el 10/11 a las 09:06 UTC (122,64 € el 05/11). No va
  en la tarjeta.
- **Registros:** la CNMV publicó una lista nueva de proveedores de criptoactivos (PDF del
  09/11) y ESMA un CSV nuevo. La fila de Prosegur no cambia (autorizada desde el 30/06/2026
  para custodia, recepción y transmisión de órdenes y transferencias). Sin advertencias.

## mTBILL (actualizar)

- **Valor por token (oráculo de Midas en Ethereum):** **1,0776 USD**, ronda 491, publicado el
  **09/11/2026 a las 14:23 UTC** y leído el 10/11 a las 09:08 UTC (antes: 1,0773 USD, 04/11).
  Nueva métrica: «Valor por token · 09/11/2026: 1,0776 USD (oráculo del emisor)».
- **Países permitidos:** el código que sirve hoy midas.app (archivo nuevo, main-BSIncFBO.js)
  mantiene el aviso v1.0.2 con 14 países: Austria, Bélgica, Francia, Alemania, Irlanda,
  Italia, Luxemburgo, Malta, Países Bajos, Polonia, Portugal, Rumanía, **España** y Suecia.
  Son los mismos 14 de las Condiciones Finales.
- **¿Puede comprarlo un particular en España? Sí, según las fuentes públicas, aunque no hay
  una frase del emisor que lo diga para España en concreto.**
  - Las Condiciones Finales hacen oferta pública en España y la dirigen también a minoristas.
  - El folleto base está notificado a la CNMV (17/07/2026).
  - La web trata mTBILL como oferta pública. No le aplica la ventana de inversor cualificado o
    de 100.000 €, que solo usan mKRalpha y mM1-USD. Su ficha dice «Accessible to investors in
    eligible jurisdictions».
  - En cadena, la lista blanca del contrato de emisión sigue desactivada.
  - La documentación de Midas cita al «sophisticated retail investor» y pide verificación de
    identidad según el riesgo.
- **Conflicto de límites de reembolso:** sigue igual. Las Condiciones Finales dicen 25 % diario
  y retención de hasta el 5 %. El KID en español dice 15 % y hasta el 50 %. Ambos son los mismos
  archivos desde el 01/11 y ESMA no tiene documentos nuevos. Además, la ficha web describe la
  capacidad de reembolso inmediato como «50 % del circulante, repuesto en 3 días». Es otra
  cifra distinta, que tampoco resuelve el conflicto. **El estado debe seguir en
  «fuentes_en_conflicto» y el aviso se mantiene.**
- **En cadena:** los contratos de emisión y de reembolso no están pausados. La comisión de
  reembolso inmediato es del 0,07 %. Hay 66,13 millones de mTBILL en Ethereum (66,74 millones
  el 05/11).
- **Rentabilidad (APY):** no se puede comprobar. midas.app sigue tras Cloudflare (403), así que
  se queda en null.

## Advertencias de la CNMV (10/11, 09:02–09:05 UTC)

Busqué Robinhood, Kraken, Payward, Backed, xStocks, Midas, Midas Software, Prosegur y
Prosegur Custodia. Ninguna tiene advertencias. La búsqueda de control «Gemini» sí devuelve
resultados, así que el buscador funciona.

## Bloqueos y conflictos

- midas.app y las páginas HTML de docs.midas.app dan 403 (Cloudflare). Leí la exportación
  oficial llms-full.txt, los PDF de GitBook y el código JS público.
- assets.backed.fi está bloqueada por país.
- Ni Kraken UE ni el emisor publican un documento que explique en qué se basa la venta de
  xStocks en España.
- Prosegur: no hay informes de auditoría publicados. Sigue el conflicto sobre la red del token
  (Polygon en la web, Ethereum en el contrato).
- Robinhood: no hay lista oficial de países. El KID en español tiene la errata del coste de
  entrada.

## Pista para los grupos de candidatas

La lista de proveedores de criptoactivos de la CNMV del 09/11/2026 tiene un alta nueva:
ABANCA Corporación Bancaria (06/11/2026), para recepción y transmisión de órdenes,
transferencias y custodia. No es de este grupo ni es una oferta concreta. Lo anoto por si a
alguien le sirve.

## Archivos

- Expedientes: `../../expedientes/{robinhood-classic-stock-tokens,kraken-xstocks,prosegur-digital-gold,mtbill}.json`
- Inventario: `inventario-consultas.json` (77 entradas, con hora, código HTTP, tamaño y SHA-256).
- Copias de lo leído: `fuentes/` (textos y PDF de menos de 3 MB). El HTML en bruto, el código JS
  de Midas, las respuestas de ESMA y la lectura en cadena están en `fuentes/crudo/`, que queda
  fuera de Git.

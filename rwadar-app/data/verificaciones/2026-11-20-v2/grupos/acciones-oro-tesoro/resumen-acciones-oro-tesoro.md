# Grupo acciones-oro-tesoro · 20/11/2026

Investigación hecha entre las 16:53 y las 17:03 UTC. Partí del vigía
(`vigia.json`, generado a las 16:52:42 UTC del 20/11 con base en el 13/11, así
que vale). Las cifras que el vigía da como «cambia» las comprobé yo en su
fuente. Lo que da como «no cambia» lo volví a fechar con su hora y su SHA-256,
marcado con `segunVigia`. Lo que el vigía no cubre (textos de las webs, acceso
desde España, salida, registros y avisos) lo abrí a mano.

## Resultado por ficha

| Ficha | Decisión | Qué cambia |
|---|---|---|
| mTBILL | **actualizar** | Valor por token 1,0777 → **1,0789 USD (20/11)**; rentabilidad pasada de 5 semanas 3,45 % → **3,46 % (16/10 → 20/11)** |
| Kraken xStocks | **actualizar** | Resumen: «más de 130» → **«más de 1.000» acciones y ETF de EE. UU.** |
| Robinhood Classic Stock Tokens | mantener | Nada |
| Prosegur Digital Gold | mantener | Nada en la tarjeta (el gramo cuesta hoy 108,02 €, dato que no va en la tarjeta) |

## mTBILL

- **Oráculo del emisor** (lectura en cadena, 16:54 UTC): desde el 13/11 ha
  vuelto a publicar a diario (rondas 493 a 498). La última es la 498, del
  viernes 20/11 a las 11:41:35 UTC: **1,07890125 USD → 1,0789 USD**.
- **Rentabilidad pasada**: con la misma regla que el 13/11 (de la ronda nueva a
  la del mismo día de la semana cinco semanas antes, sin festivo en los
  extremos), la base es la ronda 475 del viernes 16/10 (1,07534190 USD). Entre
  las dos hay 34,91 días: **3,46 % anual en USD** (3,52 % si se capitaliza).
  Coincide con el vigía. Hay que cambiar a la vez la métrica, la fecha de su
  etiqueta y el aviso de la ventana («del 16/10 al 20/11/2026»).
- **Límites de reembolso**: el conflicto **sigue**. Las Condiciones Finales
  (25 % al día) y el KID en español (15 % al día) son los mismos archivos de
  siempre (mismo SHA-256, 16:54–16:55 UTC). Sin condiciones finales nuevas en
  ESMA. El estado sigue en **«fuentes_en_conflicto»**.
- ESMA y CNMV (pasaporte BPWO-84), iguales. Sin advertencias de la CNMV según
  el vigía. Contratos sin pausar; 66,15 millones de mTBILL en Ethereum.
- docs.midas.app vuelve a servir `llms-full.txt` (200), con las mismas frases
  sobre países y verificación de identidad. midas.app y las páginas HTML de la
  documentación siguen en 403.

## Kraken xStocks

- **Condiciones finales con España: no hay.** En ESMA el emisor tiene un
  documento nuevo, FTWS-2878: las condiciones finales del 19/11/2026 de
  «Anthropic xStock ANTx». Las leí: se ofrecen solo «en Liechtenstein y Suiza
  (en Suiza, solo a profesionales)». España sale solo como país donde se
  notificó el folleto. Las seis condiciones finales de siempre tienen el mismo
  SHA-256. No hay suplementos nuevos del folleto.
- **Cambio de texto**: Kraken UE dice ahora «Kraken ofrece acceso a más de
  1.000 acciones y ETF de EE. UU.» (antes «más de 130»), en español y en
  inglés. El resumen de la tarjeta debe decir «más de 1.000».
- Mínimo 1 EUR, acceso para clientes de la UE tras el test, venta en USD o
  retirada a wallet, comisiones (1 % o hasta 2 USD más diferencial), CySEC
  342/17 y CNMV 4474: igual. Los KID en español se regeneraron el 19 y el 20/11
  con la misma clase de riesgo (5, 5 y 6). Sin advertencias de la CNMV según el
  vigía. La web de documentos del emisor sigue en «Access Restricted».
- Detalle menor: en los pasaportes de la CNMV la columna «Traducción de la Nota
  de Síntesis» aparece hoy vacía (el 13/11 decía «Sí»). No afecta a la tarjeta.

## Robinhood Classic Stock Tokens

- La página en español dice exactamente lo mismo que el 13/11 (desde 1 €, más
  de 2.000 subyacentes, 24/5). KID y descripción de servicios en español con el
  mismo SHA-256 (descargados hoy). KID y descripción en inglés y tabla de
  comisiones, iguales según el vigía.
- CNMV n.º 5299 y Banco de Lituania (mismas tres licencias), iguales. La lista
  de proveedores de criptoactivos de la CNMV tiene versión nueva y Robinhood
  sigue en ella. Sin advertencias según el vigía.

## Prosegur Digital Gold

- Contrato (08/07/2026), página comercial («Compra mínima 1 gramo»),
  transparencia y preguntas frecuentes: mismo texto que el 13/11, salvo la
  cotización y el aviso de cookies. Compra a LBMA +4 %, venta a LBMA −6 %,
  recompra solo por Prosegur en 1–7 días hábiles, producto no supervisado.
- La fila de Prosegur Custodia en la CNMV (30/06/2026) y en ESMA es la misma,
  aunque los dos archivos tienen versión nueva. Sin advertencias según el vigía.

## Bloqueos

- midas.app y las páginas HTML de docs.midas.app: 403 (no se insistió).
- API del registro de la FMA de Liechtenstein: 400 «Bad Request»; último dato
  del 13/11.
- assets.backed.fi: «Access Restricted».
- Copias: `fuentes/` y, con direcciones, tokens o páginas muy grandes,
  `fuentes/crudo/`. Inventario en `inventario-consultas.json`.

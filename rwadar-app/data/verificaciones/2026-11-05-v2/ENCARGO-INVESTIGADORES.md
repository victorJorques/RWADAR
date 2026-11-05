# Encargo común · investigación del catálogo · 5 de noviembre de 2026

Víctor inició manualmente este ciclo el 05/11/2026 hacia las 07:50 UTC. Lo
pidió así en el chat: «Hazme la investigación de hoy de las ofertas, y actualiza
la web y la app».

**Lo publicado hoy** (leído como visitante el 05/11 a las 07:56 UTC, guardado en
`lectura-publica/`): revisión `723968ce` (entrega `2026-11-04.2`), **25
plataformas en el radar, 24 ofertas (8 principales, 13 de reventa y 3 en
camino) y 5 descartadas** (ARTEX, Domoblock, Goldfinch, RealT, Toucan). Las
cifras de las 24 fichas son del **03/11** y valen 7 días.

**Lee primero el encargo del 01/11:**
[`../2026-11-01-v2/ENCARGO-INVESTIGADORES.md`](../2026-11-01-v2/ENCARGO-INVESTIGADORES.md).
Sus reglas valen igual hoy, sin cambios: lo que NO se hace, el criterio de
selección, las reglas que no se negocian, las herramientas, el formato del
expediente, `prioridadEditorial` y el enfoque de Víctor para los clientes.
Después lee el del 03/11
([`../2026-11-03.3-v2/ENCARGO-INVESTIGADORES.md`](../2026-11-03.3-v2/ENCARGO-INVESTIGADORES.md)):
también vale hoy (los tres datos de la tarjeta, avisos con fecha, crudo fuera
de Git). Abajo solo va lo que cambia hoy.

## Qué cambia hoy

- **Carpeta del ciclo:** `rwadar-app/data/verificaciones/2026-11-05-v2/`.
  Tu carpeta es `grupos/<tu-grupo>/`. Los expedientes van en
  `expedientes/<slug>.json`, con `"grupo": "<tu-grupo>"`.
- **Punto de partida de cada oferta publicada:**
  - la tarjeta publicada: `../2026-11-04.2-v2/escaparate-publicacion.json`;
  - su descripción, características, referencias y fuentes:
    `../2026-11-04.2-v2/documentacion-ofertas.json`;
  - lo que se ve en línea hoy: `lectura-publica/ofertas-v2.json`;
  - su último expediente: `../2026-11-03.3-v2/expedientes/<slug>.json`
    (Kraken xStocks y Spiko Smart Cash Euro eran candidatas allí; su alta se
    revisó en `../2026-11-03.4-v2/REVISION-ALTA.md` y
    `../2026-11-03.5-v2/REVISION-ALTA.md`; las retiradas se discutieron en
    `../2026-11-03.6-v2/comprobacion-retiradas.json`).

  No repitas a ciegas lo del 03/11. **Vuelve a abrir hoy las fuentes
  primarias** y registra en `cambiosRespectoPublicado` todo lo que haya
  cambiado: cifras, estado, precios, disponibilidad, mínimos, comisiones,
  avisos, documentos con versión nueva (compara SHA-256) y advertencias de
  reguladores. Si no cambia nada, dilo con la fuente y la hora de la consulta
  de hoy.
- **Cifras de hoy:** cada cifra que proponga la tarjeta lleva la fecha del dato
  y la consulta de hoy. Una cifra que hoy no se puede leer en su fuente
  primaria se queda en `null`.
- **Tres datos de la tarjeta** (`resumenTarjeta`: `minimo`, `accesoEspana`,
  `salida`), en castellano llano y ≤ 120 caracteres, con su claim de hoy. En
  reventa y próximas siguen las normas del 03/11
  (`docs/tareas/CICLO-DIARIO-CATALOGO.md`, «Normas de las tarjetas»): sin
  rentabilidad ni precio principal; un precio de reventa del día va con su
  fecha y nunca como precio de emisión.
- **Avisos con fecha:** para cada aviso de la tarjeta publicada que lleve una
  fecha o un dato del día, di si sigue vigente hoy (fuente y literal), si
  cambia (texto nuevo, en castellano llano) o si ya no aplica. No re-feches un
  aviso que no hayas vuelto a comprobar.
- **Pendientes que dejó el ciclo anterior** (compruébalos hoy si son de tu
  grupo):
  - Kraken xStocks: ¿publicó el emisor (Backed Assets / xStocks) condiciones
    finales que incluyan España? Si sí, el primer aviso se puede quitar.
  - Spiko Smart Cash Euro: ¿confirman la CNMV, la AMF o Aldana Capital la
    comercialización del compartimento en España? Si sí, se quita el primer
    aviso; si lo niegan, se propone retirarla.
  - Casa de Outeiro: el 03/11 se vio una prórroga hasta el 31/03/2027 en la
    ficha de datos del emisor del 30/10; ¿avanza la financiación?
  - Hausera: preventa de Alicante 2 el 04/11 y oferta pública anunciada para el
    11/11. ¿Hay ya documento de emisión público, emisor identificado y registro?
  - mTBILL: hace falta una fuente que diga si un particular en España puede
    comprarlo; sigue el conflicto de límites de reembolso.
  - Bono Valorix (Bit2Me STX): anunciado para diciembre.
- **Respuestas crudas** de API o de cadena (direcciones, tokenId, UUID, JSON
  largos) van en `grupos/<tu-grupo>/fuentes/crudo/` (fuera de Git; anota su
  `sha256` en `inventario-consultas.json`).
- **Guarda cada expediente en cuanto lo termines.**

## Candidatas

- Antes de proponer una candidata, mira si ya tiene expediente en
  `../2026-11-03.3-v2/expedientes/` o `../2026-11-01-v2/expedientes/`. Si lo
  tiene, parte de su `motivoDecision` y de sus `bloqueos`, y comprueba si hoy
  se resuelven.
- Solo propón `admitir_propuesta` con todo lo esencial respaldado hoy por
  fuente primaria (entidad y registro del regulador, estado, acceso desde
  España como particular, mínimo, salida y riesgos). Si falta algo,
  `no_admitir` con el motivo concreto. **Mejor pocas excelentes que muchas
  dudosas.**
- Una candidata admitible es un producto concreto, comprable hoy desde España
  por un particular con KYC normal, con documentos públicos (folleto o KID
  cuando corresponda) y salida explicada. Fuera de alcance: cripto/DeFi sin
  activo real, coleccionables y «plataformas» sin una oferta concreta.
- Si propones admitir, rellena también `propuestaTarjeta` completa (incluidos
  `lugar`, `pasos` y `concepto` para la ilustración).

## Entrega

Los expedientes, `grupos/<tu-grupo>/resumen-<tu-grupo>.md` en español llano y
un `inventario-consultas.json`. Tu respuesta final al coordinador es breve
(máx. 400 palabras): cada slug con su decisión, lo que cambia hoy, lo que
propones admitir y los bloqueos.

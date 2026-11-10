# Encargo común · investigación del catálogo · 10 de noviembre de 2026

Víctor inició manualmente este ciclo el 10/11/2026 hacia las 08:55 UTC. Lo
pidió así en el chat: «Hazme la investigación en profundidad de RWAdar
buscando nuevas ofertas y publica la actualización de hoy».

**Hoy el acento está en buscar ofertas nuevas.** Las 22 publicadas se revisan
igual que siempre, pero los grupos de candidatas tienen que barrer el mercado
a fondo (proveedores españoles y del EEE, y plataformas de acciones, fondos,
deuda y oro tokenizados con licencia en la UE) y traer expedientes completos
de lo que sí se pueda comprar hoy desde España.

**Lo publicado hoy** (leído como visitante el 10/11 a las 08:59 UTC, guardado
en `lectura-publica/`): revisión `88d5a757` (entrega `2026-11-05.2`), **25
plataformas en el radar, 22 ofertas (8 principales, 13 de reventa y 1 en
camino) y 5 descartadas** (ARTEX, Domoblock, Goldfinch, RealT, Toucan). Las
cifras de las 22 fichas son del **05/11** y valen hasta el **12/11**.

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

- **Carpeta del ciclo:** `rwadar-app/data/verificaciones/2026-11-10-v2/`.
  Tu carpeta es `grupos/<tu-grupo>/`. Los expedientes van en
  `expedientes/<slug>.json`, con `"grupo": "<tu-grupo>"`.
- **Punto de partida de cada oferta publicada:**
  - la tarjeta publicada: `../2026-11-05.2-v2/escaparate-publicacion.json`;
  - su descripción, características, referencias y fuentes:
    `../2026-11-05.2-v2/documentacion-ofertas.json`;
  - lo que se ve en línea hoy: `lectura-publica/ofertas-v2.json`;
  - su último expediente: `../2026-11-05-v2/expedientes/<slug>.json`, y lo
    que el coordinador decidió entonces:
    `../2026-11-05-v2/DECISIONES-COORDINADOR.md`.
  - La tarde del 05/11 salieron BILLA y Casa de Outeiro
    (`../2026-11-05.2-v2/INFORME-ENTREGA.md`); no se vuelven a proponer salvo
    que hoy cumplan todo lo que se exige a una candidata nueva.

  No repitas a ciegas lo del 05/11. **Vuelve a abrir hoy las fuentes
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
  fecha y nunca como precio de emisión. En el mínimo no escribas «por
  participación», «por token» ni «por acción»: usa «Desde X € la participación
  en reventa (DD/MM)».
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
  - Hausera: la oferta pública de Alicante 2 se anunció para el **11/11**.
    ¿Hay ya documento de emisión público, emisor identificado y registro? Si
    lo hay y todo lo esencial está respaldado, puede proponerse como oferta
    propia (`admitir_propuesta`) además de la ficha «próximas».
  - mTBILL: hace falta una fuente que diga si un particular en España puede
    comprarlo; sigue el conflicto de límites de reembolso.
  - Bono Valorix (Bit2Me STX): anunciado para diciembre; ¿hay ya folleto o
    documento de emisión?
  - CANDO1 (Token City): «en estudio» el 05/11; ¿hay ya documento de emisión?
  - Brickwise: ¿hay alguna emisión primaria abierta hoy (no reventa) con
    documentos públicos?
- **Respuestas crudas** de API o de cadena (direcciones, tokenId, UUID, JSON
  largos) van en `grupos/<tu-grupo>/fuentes/crudo/` (fuera de Git; anota su
  `sha256` en `inventario-consultas.json`).
- **Guarda cada expediente en cuanto lo termines.**

## Candidatas

- Antes de proponer una candidata, mira si ya tiene expediente en
  `../2026-11-05-v2/expedientes/`, `../2026-11-03.3-v2/expedientes/` o
  `../2026-11-01-v2/expedientes/`. Si lo tiene, parte de su `motivoDecision` y
  de sus `bloqueos`, y comprueba si hoy se resuelven. No gastes el tiempo en
  rehacer un rechazo que hoy sigue igual: anótalo en una línea con la fuente
  de hoy y dedica el resto a buscar **candidatas que no se hayan estudiado**.
- Solo propón `admitir_propuesta` con todo lo esencial respaldado hoy por
  fuente primaria (entidad y registro del regulador, estado, acceso desde
  España como particular, mínimo, salida y riesgos; advertencias de la CNMV
  consultadas). Si falta algo, `no_admitir` con el motivo concreto. **Mejor
  pocas excelentes que muchas dudosas.**
- Una candidata admitible es un producto concreto, comprable hoy desde España
  por un particular con KYC normal, con documentos públicos (folleto o KID
  cuando corresponda) y salida explicada. Fuera de alcance: cripto/DeFi sin
  activo real, coleccionables y «plataformas» sin una oferta concreta.
- Si propones admitir, rellena también `propuestaTarjeta` completa (incluidos
  `lugar`, `pasos` y `concepto` para la ilustración) y la plataforma, si no
  está ya en el radar (`propuestaPlataforma`: nombre, web, país, regulador y
  registro con su URL, acceso desde España con su fuente).

## Entrega

Los expedientes, `grupos/<tu-grupo>/resumen-<tu-grupo>.md` en español llano y
un `inventario-consultas.json`. Tu respuesta final al coordinador es breve
(máx. 400 palabras): cada slug con su decisión, lo que cambia hoy, lo que
propones admitir y los bloqueos.

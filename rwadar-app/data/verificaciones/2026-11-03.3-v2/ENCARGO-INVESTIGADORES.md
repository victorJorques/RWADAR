# Encargo común · investigación del catálogo · 3 de noviembre de 2026

Víctor inició manualmente este ciclo el 03/11/2026 hacia las 10:00 UTC. Lo
pidió así en el chat: «hazme otra investigación y así publicamos lo más
actualizado posible a día de hoy». La investigación anterior es del 01/11. Su
resultado está publicado desde hoy (revisión `62dca2f9`, entrega
`2026-11-03.2`): 26 plataformas y 23 ofertas (6 principales, 14 de reventa y 3
en camino).

**Lee primero el encargo del 01/11:**
[`../2026-11-01-v2/ENCARGO-INVESTIGADORES.md`](../2026-11-01-v2/ENCARGO-INVESTIGADORES.md).
Sus reglas valen igual hoy, sin cambios: lo que NO se hace, el criterio de
selección, las reglas que no se negocian, las herramientas, el formato del
expediente, `prioridadEditorial` y el enfoque de Víctor para los clientes.
Abajo solo va lo que cambia hoy.

## Qué cambia hoy

- **Carpeta del ciclo:** `rwadar-app/data/verificaciones/2026-11-03.3-v2/`.
  Tu carpeta es `grupos/<tu-grupo>/`. Los expedientes van en
  `expedientes/<slug>.json`, con `"grupo": "<tu-grupo>"`.
- **Punto de partida de cada oferta publicada:**
  - lo publicado hoy: `../2026-11-03.2-v2/escaparate-publicacion.json` (la
    tarjeta) y `../2026-11-03.2-v2/documentacion-ofertas.json` (descripción,
    características, referencias y fuentes);
  - su expediente del 01/11: `../2026-11-01-v2/expedientes/<slug>.json`.

  No repitas a ciegas lo del 01/11. **Vuelve a abrir hoy las fuentes primarias**
  y registra en `cambiosRespectoPublicado` todo lo que haya cambiado: cifras,
  estado, precios, disponibilidad, mínimos, comisiones, avisos, documentos con
  versión nueva y advertencias de reguladores. Si no cambia nada, dilo con la
  fuente y la hora de la consulta de hoy.
- **Cifras de hoy:** cada cifra que proponga la tarjeta lleva la fecha del
  dato y la consulta de hoy. Una cifra que hoy no se puede leer en su fuente
  primaria se queda en `null`.
- **Tres datos de la tarjeta.** Para cada oferta publicada y cada candidata
  que propongas admitir, deja claims respaldados hoy de estos tres datos, con
  texto en castellano llano y corto (≤ 120 caracteres), listo para el
  inversor:
  - **Mínimo**, con moneda o unidad (p. ej. «Desde 1 €», «1 gramo de oro»,
    «500 CHF»): claim `campo: "minimo"`;
  - **Acceso desde España como particular**: `campo: "accesoEspana"`;
  - **Salida o reembolso**: cómo y cuándo se recupera el dinero, con sus
    límites: `campo: "salida"`.

  Añade en `propuestaTarjeta` el bloque:
  `"resumenTarjeta": {"minimo": "…", "accesoEspana": "…", "salida": "…"}`,
  con la fuente primaria de cada uno en `claims`.
- **Avisos con fecha:** para cada aviso de la tarjeta publicada que lleve una
  fecha o un dato del día, di si sigue vigente hoy (fuente y literal), si
  cambia (texto nuevo) o si ya no aplica. No re-feches un aviso que no hayas
  vuelto a comprobar.
- **Respuestas crudas de API o de cadena** (direcciones, tokenId, UUID, JSON
  largos) van en `grupos/<tu-grupo>/fuentes/crudo/`. Esa carpeta no entra en
  Git porque el escáner de secretos las confunde con claves. En
  `inventario-consultas.json` anota su `sha256`.
- **Guarda cada expediente en cuanto lo termines.** Si te cortan por límite de
  uso, lo guardado se conserva.

## Candidatas

- Antes de proponer una candidata, mira si ya tiene expediente del 01/11 en
  `../2026-11-01-v2/expedientes/`. Si lo tiene, parte de su `motivoDecision` y
  de sus `bloqueos`, y comprueba si hoy se resuelven.
- Solo propón `admitir_propuesta` con todo lo esencial respaldado hoy por
  fuente primaria (entidad y registro del regulador, estado, acceso desde España
  como particular, mínimo, salida y riesgos). Si falta algo, `no_admitir` con
  el motivo concreto. **Mejor pocas excelentes que muchas dudosas.**
- Una candidata admitible debe ser un producto concreto, comprable hoy desde
  España por un particular con KYC normal, con documentos públicos (folleto o
  KID cuando corresponda) y salida explicada. Fuera de alcance: cripto/DeFi sin
  activo real, coleccionables y «plataformas» sin una oferta concreta.

## Entrega

Lo mismo que el 01/11: los expedientes, `grupos/<tu-grupo>/resumen-<tu-grupo>.md`
en español llano y un `inventario-consultas.json`. Tu respuesta final al
coordinador debe ser breve (máx. 400 palabras): cada slug con su decisión, lo
que cambia hoy, lo que propones admitir y los bloqueos.

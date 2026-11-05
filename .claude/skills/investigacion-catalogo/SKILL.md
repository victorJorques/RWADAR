---
name: investigacion-catalogo
description: Ciclo completo del catálogo de RWAdar en el mismo día con una sola orden de Víctor («haz la investigación», «investiga las ofertas», «actualiza el catálogo», «actualiza la web y la app con las ofertas de hoy»). Investiga las ofertas publicadas y busca candidatas con fuentes primarias, las hace revisar por agentes independientes, monta y prueba la entrega, la aplica en Supabase, publica la web y envía la OTA si hace falta.
---

# «Haz la investigación» · el ciclo completo en el mismo día

La orden de Víctor **es el permiso** para este ciclo (AGENTS.md, 03/11/2026):
aplicar el SQL revisado con «Aplicar catálogo», publicar la web con «Publicar
web» (preview y producción) y enviar la OTA con «OTA Android», si pasan las
compuertas. No incluye cuentas, Auth, RLS, funciones, esquema, credenciales,
pagos, tiendas, `eas build`/`eas submit` ni visibilidad. **No pidas más
permisos ni confirmaciones**: Víctor quiere dar una orden simple y que esté
hecho ese día. Si una compuerta falla, para en ese paso, explica por qué y deja
lo publicado como estaba.

Procedimiento de fondo: `docs/tareas/CICLO-DIARIO-CATALOGO.md`. Esta skill es
el orden de trabajo y lo aprendido para hacerlo rápido.

## 0 · Arranque (10 min)

1. Lee `AGENTS.md`, la entrada de arriba de `docs/tareas/PARA-CODEX.md` y el
   «Qué está funcionando hoy» de `docs/INTERNO.md`. `node rwadar-node-seguro.js`.
2. `git fetch origin main && git checkout -b claude/catalogo-<fecha> origin/main`.
3. En segundo plano: `npm ci` en la raíz, `rwadar-app` y `rwadar-movil`.
4. Lectura pública (precondición, con hora):
   `bash .claude/skills/investigacion-catalogo/leer-publico.sh rwadar-app/data/verificaciones/<fecha>-v2/lectura-publica`.
   Anota revisión, cantidades y la entrega local que le corresponde
   (`rwadar-site/assets/catalogo-publico-20261022.js` lleva su `revisionId`).
5. En segundo plano: `node rwadar-app/capturar-fuentes.mjs <entrega publicada> <scratchpad>/capturas-<fecha>.json`
   (unos 15 min). Copia `comprobar-radar.mjs` del último ciclo y cambia la
   fecha y la carpeta base.
6. Copia el `ENCARGO-INVESTIGADORES.md` del último ciclo, cambia fecha,
   publicada y pendientes (salen de `INTERNO.md` y del último informe).

## 1 · Investigación en paralelo (35–45 min)

**Cada flujo de Workflow solo corre 2 agentes a la vez en esta máquina** (4
CPU). Para que todos los grupos trabajen a la vez, lanza el flujo guardado
`investigacion-catalogo` **varias veces en el mismo mensaje**, con 1 o 2 grupos
cada vez (`args`: `fecha`, `ciclo`, `base`, `grupos: [{id, slugs, extra}]`).
Cada grupo pasa por su investigador y después por un revisor independiente.

Grupos que funcionaron el 05/11/2026 (ajústalos a lo publicado):

| Grupo | Fichas |
|---|---|
| `spiko` | las de Spiko (rentabilidad recalculada con la serie de VL; registros CNMV/AMF) |
| `acciones-oro-tesoro` | Robinhood, Kraken xStocks, Prosegur, mTBILL |
| `suiza` | Aktionariat, Boss Info, Switzerlend (FINMA, comisiones, libro de órdenes) |
| `brickwise` | las de reventa de Brickwise y su emisión primaria (API pública) |
| `espana-proximas` | Casa de Outeiro, Hausera y otras «en camino» |
| `candidatas-espana` | candidatas nuevas de proveedores españoles |
| `candidatas-europa` | candidatas del EEE con pasaporte a España |

Mientras investigan: comprueba el radar con la captura. Si una fuente no
carga (REGAFI suele dar 502 y el proxy corta curl), léela por la API pública
del mismo registro o con WebFetch y regístralo en `cambios-radar.json`
(`verificacionesManuales`); si una página cambió de dirección pero dice lo
mismo, cambia la fuente ahí y su comprobación en
`rwadar-app/data/comprobaciones-fuentes.json` (edición mínima, sin reformatear).

## 2 · Decidir y montar (60–90 min)

1. Lee los resultados (diario `journal.jsonl` de cada flujo) y escribe
   `DECISIONES-COORDINADOR.md`: lista cerrada de lo que entra. Solo lo
   `confirmado` o `confirmado_con_cambios` por el revisor, con sus
   correcciones; lo `rechazado` no entra.
2. Lanza el flujo guardado `entrega-catalogo` (o un agente con el mismo
   encargo): `preparar-entrega.mjs` (reproducible, con la guarda de la
   publicada y su huella), `comprobar-entrega.mjs` (PGlite, casos de fallo,
   idempotencia, tarjetas), `despues-de-aplicar.mjs` (`transparencia.json`
   con la fecha nueva) y un ensayo «después de aplicar» en una copia; luego un
   revisor independiente del SQL y los datos; luego las correcciones.
3. Una candidata nueva necesita además su imagen editorial y su ficha
   (`rwadar-editorial-source/ofertas/README.md`, `rwadar-fichas-manifiesto.js`):
   si no da tiempo con calidad, **no se admite hoy**, sin cola pendiente.

Trampas conocidas:
- El escáner de secretos de CI (gitleaks) confunde identificadores públicos de
  algunas copias (por ejemplo `llms-full.txt` de Midas) con claves. Antes del
  PR: `git archive HEAD | tar -x -C <tmp>` y gitleaks 8.30.1 con
  `--config rwadar-app/gitleaks.toml`; lo que marque, fuera de Git en el
  `.gitignore` del ciclo (se queda en disco con su SHA-256).
- No reescribas historia (`--amend` + `--force`): está bloqueado. Si hace falta
  quitar algo, crea una rama limpia desde `origin/main` con
  `git merge --squash` y abre el PR desde ella.
- Si un corrector cambia el SQL después de la revisión, otro agente (o el
  coordinador, que no lo preparó) comprueba el diff normalizado: mismo
  inventario de sentencias y solo los cambios pedidos; y vuelve a pasar
  `comprobar-entrega.mjs`.
- En el mínimo de una tarjeta, «por participación/token/acción» hace que el
  lector lo descarte: usa «Desde X € la participación en reventa (DD/MM)».
- Reventa y próximas no llevan rentabilidad ni precio principal.
- Nombres de personas físicas en copias de fuentes (promotores de Alius):
  recórtalos antes de cualquier commit.

## 3 · Publicar (40–60 min)

1. `npm test` completo en verde. Commit y push de la rama; PR a `main`
   (`mcp__github__create_pull_request`), CI en verde y merge
   (`mcp__github__merge_pull_request`).
2. Vuelve a leer como visitante (debe seguir la misma publicada).
3. «Aplicar catálogo» desde `main` con la etiqueta (`mcp__github__actions_run_trigger`,
   `aplicar-catalogo.yml`, `inputs: {fecha: "<etiqueta>"}`); espera a que
   acabe y vuelve a leer como visitante: revisión nueva, cantidades y cifras.
4. En una rama nueva desde `main`: `node rwadar-app/sincronizar.js`,
   `node rwadar-app/data/verificaciones/<etiqueta>-v2/despues-de-aplicar.mjs`,
   `node rwadar-app/volcar-seed.js`,
   `node rwadar-editorial-source/ofertas/transparencia.mjs`, otra vez
   `node rwadar-fichas.js` y `npm test`. Commit. Después el **sello**, con el
   árbol limpio: `node .claude/skills/investigacion-catalogo/sellar.cjs "nota"`
   (pone en `estado.json` el commit actual y la huella del contenido) y commit
   aparte de `estado.json`. PR y merge.
5. «Publicar web» (`publicar.yml`) con `destino: preview` y, a la vez,
   «OTA Android» (punto 6), que no depende de la web; comprueba la
   preview (curl y Playwright a 390 y 1366: catálogo nuevo, cifras, tarjetas,
   ficha); después `destino: produccion` y la misma comprobación en
   `https://rwadar.pages.dev`.
6. «OTA Android» (`ota-android.yml`) si cambió algo de `rwadar-movil/` o
   `transparencia.json` (la app lo lleva dentro); antes,
   `node rwadar-movil/scripts/comprobar-ota-compatible.cjs --base <commit del APK>`.
   El catálogo en sí le llega a la app sola desde Supabase.

## 4 · Cerrar

Informe fechado (`docs/INVESTIGACION-CATALOGO-<fecha>.md`), `docs/INTERNO.md`
en llano, entrada arriba de `docs/tareas/PARA-CODEX.md` y, para Víctor, un
resumen corto: qué cambió en las ofertas, qué no entró y por qué, y qué está
publicado y comprobado.

## Tiempos reales del 05/11/2026

Orden a las 07:50 UTC. Investigación y revisión de los 7 grupos: unos 40 min.
Montaje, revisión del SQL y correcciones: unos 65 min. Unir, aplicar,
sincronizar, sellar, publicar y OTA: unos 25 min. (Ese día hubo además un
parón por el límite de uso de la cuenta; sin él, el ciclo cabe en unas 3 horas.)

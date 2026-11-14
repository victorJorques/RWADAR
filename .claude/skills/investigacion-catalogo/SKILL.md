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
   **Cerrojo para las noticias automáticas** (desde el 14/11/2026): crea la
   rama `claude/cerrojo-ciclo-<fecha>` en GitHub
   (`git push origin origin/main:refs/heads/claude/cerrojo-ciclo-<fecha>`; no
   lanza ningún flujo ni gasta minutos). Mientras exista, la mañana automática
   no hace nada. Bórrala al cerrar (paso 4). Si al empezar ves abierto un PR
   «Noticias automáticas del …», espera a que se una o se cierre antes de unir
   nada tuyo.
3. En segundo plano: `npm ci` en la raíz, `rwadar-app` y `rwadar-movil`.
4. Lectura pública (precondición, con hora):
   `bash .claude/skills/investigacion-catalogo/leer-publico.sh rwadar-app/data/verificaciones/<fecha>-v2/lectura-publica`.
   Anota revisión, cantidades y la entrega local que le corresponde
   (`rwadar-site/assets/catalogo-publico-20261022.js` lleva su `revisionId`).
5. **Vigía (menos de 1 minuto, sin agentes):**
   `node .claude/skills/investigacion-catalogo/vigia.mjs --ciclo rwadar-app/data/verificaciones/<fecha>-v2 --base rwadar-app/data/verificaciones/<entrega publicada>-v2`.
   Lee las fuentes que más cambian (Spiko, oráculo de mTBILL, libro de órdenes
   de Brickwise y de los portales suizos), el SHA-256 de cada PDF citado en
   `documentacion-ofertas.json` y las búsquedas de advertencias de la CNMV del
   ciclo publicado, y escribe `<ciclo>/vigia.json`: por ficha, cifra
   publicada, cifra de hoy, fuente, hora UTC, SHA-256 y «cambia / no cambia /
   no se pudo leer». En la terminal sale solo lo que cambia o no se pudo leer:
   eso es lo que hay que mirar hoy. Las respuestas en bruto quedan en
   `<ciclo>/vigia-crudo/`, fuera de Git. Mismas reglas que
   `acceso/ACCESO-FUENTES.md`: petición normal, TLS, sin eludir bloqueos.
6. En segundo plano: `node rwadar-app/capturar-fuentes.mjs <entrega publicada> <scratchpad>/capturas-<fecha>.json`
   (unos 15 min). Copia `comprobar-radar.mjs` del último ciclo y cambia la
   fecha y la carpeta base.
7. Copia el `ENCARGO-INVESTIGADORES.md` del último ciclo, cambia fecha,
   publicada y pendientes (salen de `INTERNO.md` y del último informe). Pon
   en él lo que el vigía dio como «cambia» y «no se pudo leer».

## 1 · Investigación en paralelo (≈ 25 min: marca el ritmo el grupo de candidatas, que el vigía no cubre; el vigía ahorra tiempo de agente en los otros grupos)

**El investigador parte del vigía.** El flujo `investigacion-catalogo` busca
`<ciclo>/vigia.json` (o la ruta de `args.vigia`; `vigia: false` lo apaga) y,
si es de hoy y de la misma publicada, el investigador:
- confirma en la fuente primaria cada cifra que el vigía da como «cambia»;
- re-fecha lo que «no cambia» con la hora y el SHA-256 del vigía, sin volver
  a leerlo, y lo marca con `"segunVigia": true`;
- abre a mano lo que «no se pudo leer» y todo lo que el vigía no cubre
  (`noCubre`: textos, avisos sin cifra, acceso, salida, registros, Hausera,
  Robinhood, Kraken, Prosegur…).

El revisor independiente sigue reabriendo **cada** cambio crítico y además
muestrea lo re-fechado con el vigía. Si el vigía no se pudo pasar, el flujo
trabaja como siempre.

El grupo de candidatas (`vigilancia`), que el vigía no cubre, es el que marca
el ritmo de la fase (el 13/11: 15 min de investigador y 12 de revisor). Se
lanza el primero, como ya se hacía, sin esperar al vigía, que no lo necesita.
El vigía no acorta ese grupo: lo que ahorra es tiempo de agente (y de CPU) en
los otros tres, estimado y aún sin medir en un ciclo real.

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

**Noticias del sector (desde el 10/11/2026, petición de Víctor).** Si las
noticias automáticas de esta mañana ya salieron (`actualizadoEl` de
`https://rwadar.pages.dev/datos/noticias-v2.json` es hoy), no se rehacen salvo
novedad importante. Si se hacen, con el mismo procedimiento que la mañana
(skill `noticias-automaticas`): la guía de titulares y fotos
(`rwadar-editorial-source/noticias/GUIA-TITULARES.md`), `titulares.json` con
tres propuestas por idioma, y `noticias-auto.mjs validar` antes del
verificador. En cada
ciclo se renuevan las noticias de Inicio: flujo con dos analistas (regulación
España/UE; mercado, productos y riesgos), un redactor jefe y un verificador
independiente (modelo: `rwadar-app/data/verificaciones/2026-11-10-v2/noticias/`,
con `EDICION.md` y `VERIFICACION.md`). «Hoy» = 2–3 del día o del anterior (si
no hay ninguna con fuente, ninguna); «Lo más importante» = 4–5 de los últimos
30 días. Titulares propios con gancho y sin engañar (≤ 70 caracteres, lo que
cambia para el lector primero, con cifra o consecuencia; nada de promesas ni
exageraciones), comprobados contra el resumen y la fuente. El JSON verificado
se copia a `rwadar-site/datos/noticias.json` (lo valida `rwadar-publicar.js`)
y sale con «Publicar web»; la app lo lee de la web. Sin nombres de personas;
PDF y HTML de las fuentes, fuera de Git.

**La tokenización en el mundo** (Inicio) no necesita nada del ciclo: el flujo
«Tokenización diaria» guarda una foto de CoinGecko cada día en la rama
`datos-tokenizacion` y «Publicar web» la incluye.

## 2 · Decidir y montar con el motor (30–40 min; 35–50 si la corrección cambia el SQL)

1. Lee los resultados (diario `journal.jsonl` de cada flujo) y escribe
   `DECISIONES-COORDINADOR.md`: lista cerrada de lo que entra. Solo lo
   `confirmado` o `confirmado_con_cambios` por el revisor, con sus
   correcciones; lo `rechazado` no entra.
2. La entrega la hace el **motor** (`.claude/skills/investigacion-catalogo/entrega/`,
   manual en `entrega/FORMATO.md`):
   - lo propio del día va en `<ciclo>/decisiones.json`;
   - las guardas, iguales cada día: publicada y huella, PGlite, casos de
     fallo, idempotencia, tarjetas y transparencia.

   Ya no se copian ni se adaptan los guiones del día anterior. Lanza el flujo
   guardado `entrega-catalogo` **por fases**: cada flujo solo corre 2 agentes
   a la vez, y así ninguno espera.

   Los `args` comunes a las tres fases:

   ```json
   {"etiqueta": "AAAA-MM-DD", "fecha": "AAAA-MM-DD",
    "ciclo": "rwadar-app/data/verificaciones/AAAA-MM-DD-v2",
    "desde": "<etiqueta publicada>",
    "previa": {"revisionId": "…", "hash": "…"},
    "ultimoDia": "AAAA-MM-DD", "scratch": "<scratchpad>"}
   ```

   a. **`fase: "montar"`** (10–15 min). El montador, con esfuerzo «high»:
      - escribe `decisiones.json` (copia el del último día y cambia la
        cabecera y las ofertas);
      - ejecuta `preparar` dos veces y `comprobar` (PGlite);
      - ejecuta `revisar`, que escribe `DIFF-ENTREGA.md`;
      - guarda la copia del SQL revisado (`<scratch>/sql-revisado-<etiqueta>/`);
      - deja el ensayo «después de aplicar» corriendo en segundo plano.
   b. **`fase: "revisar"`, tres veces en el mismo mensaje**: una por lente
      (`lentes: ["sql"]`, `["contenido"]` y `["cumplimiento"]`), con
      `montaje` = lo que devolvió (a). Los tres revisan **a la vez**
      (12–15 min). Cada uno es independiente y empieza por
      `DIFF-ENTREGA.md`, que le dice qué cambia frente a la entrega anterior,
      antes de hacer sus propias pruebas.
   c. **`fase: "cerrar"`**, con `montaje` y `revisiones`: las tres, juntando
      las `revisiones` que devolvió cada lanzamiento de (b). Pasa las tres
      revisiones tal cual las devolvió cada lanzamiento, con su `marca`; si
      se cambia o se pierde algo al copiarlas, «cerrar» para. Qué pasa:
      - Si nadie pide nada, queda aprobada.
      - Si piden correcciones, el corrector (esfuerzo «high») las hace solo en
        `decisiones.json` y rehace con el motor.
      - Después, la **comprobación determinista**: un agente ejecuta
        `motor.mjs auditar` y comprueba las correcciones que no tocan el SQL.
        `auditar` rehace la entrega, exige que la copia sea el SQL revisado,
        compara el inventario de sentencias y el diff normalizado, y pasa
        PGlite y el escáner de secretos.
      - Si el SQL no cambió, con eso basta (2–3 min).
      - Si cambió, sigue el auditor (agente, esfuerzo máximo) con el diff en
        la mano (8–10 min).

   Si omites `fase`, corre todo seguido, pero el tercer revisor espera. **Un
   día con un alta o una retirada** el motor no la monta: lanza con
   `motor: false` y `modelo: "rwadar-app/data/verificaciones/2026-11-05.2-v2"`.
   Ese día el montador trabaja como antes, con esfuerzo «xhigh», y si hay
   correcciones las verifica el auditor de siempre (esfuerzo máximo).
3. Una candidata nueva necesita además su imagen editorial y su ficha
   (`rwadar-editorial-source/ofertas/README.md`, `rwadar-fichas-manifiesto.js`):
   si no da tiempo con calidad, **no se admite hoy**, sin cola pendiente.

Trampas conocidas:
- **Webs y apps que bloquean** (Cloudflare, bloqueo por país, contenido solo
  con cuenta): no se elude nada. Están prohibidos:
  - los controles anti-bots y los CAPTCHA;
  - falsear el agente;
  - las VPN;
  - las cuentas;
  - las API internas con token;
  - la Wayback para documentos reservados a inversores verificados.

  Usa las rutas legítimas ya verificadas de `acceso/ACCESO-FUENTES.md`
  (supervisores, documentos del emisor, API públicas, datos en cadena) y
  empieza cada ciclo con
  `node .claude/skills/investigacion-catalogo/acceso/comprobar-rutas.mjs`,
  que en un minuto dice qué rutas siguen vivas. El bruto va a `acceso/crudo/`,
  fuera de Git.
- El escáner de secretos de CI (gitleaks) confunde identificadores públicos de
  algunas copias (por ejemplo `llms-full.txt` de Midas) con claves. Antes del
  PR: `git archive HEAD | tar -x -C <tmp>` y gitleaks 8.30.1 con
  `--config rwadar-app/gitleaks.toml`; lo que marque, fuera de Git en el
  `.gitignore` del ciclo (se queda en disco con su SHA-256).
- No reescribas historia (`--amend` + `--force`): está bloqueado. Si hace falta
  quitar algo, crea una rama limpia desde `origin/main` con
  `git merge --squash` y abre el PR desde ella.
- Antes del PR, aunque no haya habido correcciones, repite tú `node
  .claude/skills/investigacion-catalogo/entrega/motor.mjs auditar <etiqueta>
  --antes=<scratch>/sql-revisado-<etiqueta> --revisado=<SHA del montaje>
  --secretos=<scratch>/gitleaks/gitleaks --exigir-secretos` (un minuto). Si
  el SQL cambió después de la revisión, hace falta el auditor, que no preparó
  ni corrigió la entrega.
- En el mínimo de una tarjeta, «por participación/token/acción» hace que el
  lector lo descarte: usa «Desde X € la participación en reventa (DD/MM)».
- Reventa y próximas no llevan rentabilidad ni precio principal.
- Nombres de personas físicas en copias de fuentes (promotores de Alius):
  recórtalos antes de cualquier commit.

## 3 · Publicar (40–60 min)

1. `npm test` completo en verde. Commit y push de la rama; PR a `main`
   (`mcp__github__create_pull_request`), CI en verde y merge
   (`mcp__github__merge_pull_request`).
2. Vuelve a leer como visitante (debe seguir la misma publicada). Y pasa otra
   vez el vigía, ahora contra la entrega que vas a aplicar (30 s):
   `node .claude/skills/investigacion-catalogo/vigia.mjs --ciclo <scratchpad>/vigia-antes-de-aplicar --base rwadar-app/data/verificaciones/<etiqueta>-v2`.
   Si algo sale «cambia» (por ejemplo, Spiko publicó otra VL por la tarde),
   las cifras se movieron desde la investigación: re-fecha o corrige antes de
   aplicar, con su revisión.
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
publicado y comprobado. Borra la rama de cerrojo de las noticias
automáticas (`git push origin --delete claude/cerrojo-ciclo-<fecha>`), también
si el ciclo se paró a medias.

## Vigía: medido el 13/11/2026

Pasada en vivo a las 09:32 UTC contra la publicada del 12/11: 24 s y 99
peticiones (Spiko 1,3 s; mTBILL 0,6 s; Brickwise 1,4 s; suizas 1,7 s; 50 PDF
6,3 s; CNMV 24 s, de una en una). Dio 12 cifras que cambian, las mismas que
los cuatro grupos de agentes encontraron a mano esa mañana (Spiko 2,41 → 2,40 %
y 4,02 → 3,98 %, VL nueva de las tres de Spiko, Pottendorfer 80 → 73 €,
mejor compra de Randhartingergasse 56 → 64 €, participaciones en venta de
Cohotel, GreenPoint y Schwarzer Weg), 65 que no cambian, 50 PDF con la misma
huella y 29 búsquedas de la CNMV iguales.

## Tiempos esperados con el motor (desde el 13/11/2026)

La entrega pasa de unos 60–65 min a unos 30–40 min si la corrección no
cambia el SQL, y a unos 35–50 min si lo cambia (pasó el 12 y el 13/11),
porque entonces sigue el auditor:

| Paso | Antes | Ahora |
|---|---|---|
| Montaje | unos 25 min (copiar y adaptar guiones; «xhigh») | 10–15 min (`decisiones.json` y el motor; «high») |
| Revisión | 2 revisores y después el tercero: unos 25–30 min | los 3 a la vez y con el diff: 12–15 min |
| Corrección | 7–10 min («xhigh») | unos 5 min («high», solo `decisiones.json`) |
| Cierre | auditor (máximo) 8–10 min | 2–3 min si el SQL no cambió; si cambió, el auditor con el diff |

Es una estimación sobre las medidas del 12 y el 13/11, no una medida de un
ciclo con el motor: anota el tiempo real del primero.

## Tiempos reales del 05/11/2026

Orden a las 07:50 UTC. Investigación y revisión de los 7 grupos: unos 40 min.
Montaje, revisión del SQL y correcciones: unos 65 min. Unir, aplicar,
sincronizar, sellar, publicar y OTA: unos 25 min. (Ese día hubo además un
parón por el límite de uso de la cuenta; sin él, el ciclo cabe en unas 3 horas.)

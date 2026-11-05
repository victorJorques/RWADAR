# Entrega del catálogo 2026-11-04.2 · ARTEX Global Markets pasa a Descartadas

Preparada el 04/11/2026 (terminada el 05/11 hacia las 00:25 UTC) por Claude en el
worktree `/home/user/RWADAR/.claude/worktrees/catalogo-artex`, rama
`claude/catalogo-2026-11-04-2` (sale de `origin/main`, 3bb010b; sin push).
**Nada aplicado en Supabase, nada publicado, sin OTA, ningún flujo lanzado.**
Estado: **preparada y probada en local, también en un ensayo de «después de
aplicar»; revisada por un corrector independiente el 05/11, que encontró dos
fallos menores (ver «Revisión independiente», al final). El motivo de ARTEX está
corregido y el SQL, regenerado y vuelto a probar.**

## 1. La decisión y lo comprobado

- **Decisión de Víctor (04/11/2026):** «Si las demás usan blockchain, ARTEX fuera».
- **Lectura como visitante** (REST de Supabase con la clave publicable, solo GET)
  el 04/11/2026 de 23:33:43 a 23:33:48 UTC, guardada en `lectura-publica/`:
  publicada la `cf79e4a4-f828-96ce-681b-ae69c3d1b81b` (entrega 2026-11-04),
  **26 plataformas, 24 ofertas (8/13/3) y 4 descartadas** (Domoblock, Goldfinch,
  RealT, Toucan Protocol). Igual que la lectura del intento anterior (22:47 UTC).
- **La premisa se cumple:** las otras 25 plataformas del radar tienen una o varias
  blockchains en «Blockchains» (`cambios-plataformas.json`, `premisa.otras`).
  ARTEX dice «No usa blockchain», no tiene ofertas en el catálogo ni fuentes propias
  en `public.fuentes`.
- **Fuente del descarte:** `https://www.artexgm.com/faq`, abierta con Chrome sin
  interfaz (la página pinta el texto con JavaScript) por la entrega 2026-11-04 y
  otra vez hoy a las 22:54 y a las 23:35 UTC, con el mismo texto: «3. Is ARTEX
  involved in NFTs? ARTEX is not involved in non-fungible tokens (NFTs) nor does
  it rely on blockchain technology in any way for the time being.» La misma página
  dice que es «the first regulated art Multilateral Trading Facility (MTF)» y que
  compensa en SIX x-clear y liquida en Euroclear y Clearstream. No tiene fecha de
  publicación; no se guarda la página.

## 2. Etiqueta, revisión y SHA

- **Etiqueta: `2026-11-04.2`** (la segunda del día; la primera fue la 2026-11-04).
- **Revisión nueva: `723968ce-00f7-7f42-b3e3-6c7f401b8f89`**
  (huella `723968ce00f77f42b3e36c7f401b8f8919eaa5dbc35b782f15fa40f5c5337585`).
- Exige que la publicada sea la `cf79e4a4…` con su huella `cf79e4a4f828…1712`.
- **SHA-256 de `rwadar-app/data/importaciones/catalogo-2026-11-04.2-v2/aplicar-y-aprobar.sql`:
  `2ce8084d049a7ab309723c4d8a2ed9a0a65fcd150a51b0e910fd2396363dfb33`.**
  `preparar-entrega.mjs` lo reproduce byte a byte (comprobado dos veces después de
  corregir el motivo). El SHA anterior, `a4d99551…e15`, era el del motivo viejo y
  ya no vale.
- El radar, las cifras y la vigencia siguen siendo del 03/11: el lote vence el
  11/11, como la 2026-11-04. No se alarga ningún plazo.

## 3. Qué cambia (antes → después)

| Qué | Antes | Después |
|---|---|---|
| ARTEX, estado | En el radar | **Descartada** |
| ARTEX, etiqueta | — | **Sin blockchain** |
| ARTEX, motivo | — | «ARTEX se presenta como un sistema multilateral de negociación (MTF) regulado de acciones sobre obras de arte, y su propia web dice que, por ahora, no usa blockchain de ninguna forma. RWAdar solo recoge plataformas de activos tokenizados.» |
| ARTEX, fuente pública | ninguna | «ARTEX · preguntas frecuentes: por ahora no usa blockchain de ninguna forma» (`https://www.artexgm.com/faq`), consultada el 04/11/2026, sin fecha de publicación |
| ARTEX, ficha del radar (categoría, región, tipo, acceso, entrada, blockchains, web, aval y descripción) | Materias primas · Liechtenstein · Marketplace · Acreditado · Alto · «No usa blockchain» · artexgm.com · … | vacías, como en las otras 4 descartadas (la ficha anterior queda en `lectura-publica/artex-plataforma.json` y en las revisiones anteriores) |
| ARTEX, fecha de verificación | 26/07/2026 | 04/11/2026 |
| Plataformas en el radar | 26 | **25** |
| Fuentes del radar | 69 | 67 (salen `artex-web` y `artex-lb`, que solo usaba ARTEX) |
| Descartadas | 4 | **5** |
| Ofertas | 24 (8/13/3) | 24 (8/13/3), iguales: solo cambian la revisión y «plataformas_esperadas» |
| `/plataformas/artex-global-markets` | ficha de ARTEX | **301 a `/fuera-del-radar/artex-global-markets`** (sin caché) |
| `/fuera-del-radar/artex-global-markets` | no existe | ficha de la descartada, con su motivo y su fuente |
| Imagen al compartir (`og.png`) | 26 puntos | 25 puntos (2 en Materias primas) |

**Lo que hace la base por su cuenta al cambiar el estado** (disparadores de siempre,
probados en PGlite): `actualizada_el = now()`; una fila en `cambios_estado`
(«ARTEX Global Markets sale del radar», con el motivo); y un aviso en cola para
quien vigile ARTEX con los avisos activados. Los avisos por correo y push están en
pausa: no se envía nada. Como visitante no se puede saber si alguien vigila ARTEX.

## 4. Cifras que estaban escritas a mano

Ahora salen del catálogo (o, en las pruebas, de `02_seed.sql` y del snapshot):

| Dónde | Antes | Ahora |
|---|---|---|
| `rwadar-app/sincronizar.js` | exigía «exactamente 4 descartes» (tras aplicar, la sincronización habría fallado) | al menos uno, todos con etiqueta, motivo de 40+ caracteres y fuente HTTPS, sin repetidos ni en el radar; la lista cerrada de fichas vuelve a contrastar cuántos y cuáles |
| Web, refresco del catálogo (`rwadar-20260820.js`) | exigía 4 descartadas (tras aplicar, la web publicada no se habría actualizado) | cualquier cantidad, cada una con fuente |
| Web, revisión local V2 | 4 descartadas | las que traiga el lote |
| Web, subtítulo «N plataformas revisadas» | caía en «26» | `P.length` |
| `index.html` estático (franja «En el radar» y «Descartadas», leyenda del radar, subtítulo móvil, textos alternativos de la imagen al compartir) | 26 y 4 | los escribe el pre-render (`rwadar-publicar.js`) desde P y FUERA |
| Inglés (`idioma.js`, `idioma-en.js` y copias web) | claves con 26 y 4 («26 platforms on the radar»; con 25 salía «25 platforms en el radar») | patrones con el número |
| `db/14_seguridad_integral_verificar.sql` y `db/fresh_install_verificar.sql` (los usan `aplicar-sql.cmd` y `activar-push.cmd` en producción) | 26/4 | ninguna lista vacía; el 14 compara el radar con la revisión V2 publicada |
| Pruebas (`probar-db`, `probar-seguridad`, `probar-cierre-22`, `probar-cuentas`, `probar-catalogo-publico`, `probar-web`) | 26, 25, 24 y 4 fijos | de `02_seed.sql` (`cuentaSeed`) o del snapshot |
| `volcar-seed.js` | perdía la fecha de publicación de las fuentes | la conserva; `02_seed.sql` releído hoy como visitante (solo cambian las 12 líneas de fuentes) |

Las pruebas que importan **lotes antiguos** del catálogo (con ARTEX en el radar:
`probar-catalogo-publico`, `-v2`, `-siempre-disponible`, `probar-documentacion-ofertas`,
`probar-cuentas-sesion-confirmada` y `rwadar-acceso/catalogo-sql.test.mjs`) usan
una copia fija del seed de hoy (`db/pruebas/02_seed_radar_26.sql`); las demás, el
`02_seed.sql` vigente.

**Se quedan como están, a propósito:** el fixture local de la app y de la web
(`fixtures/escaparate-local.json`, 26/4 del 21/09) y sus validaciones; la noticia
del 28/09 («Radar revisado: 26 plataformas y 4 descartes»); el README («desde el
28 de septiembre, con 26 plataformas…»); y los flujos antiguos de QA de Android
(`.github/pruebas-android/*`, `qa-android-authenticated-140`), que prueban APK
antiguos con su interfaz de entonces.

## 5. La dirección vieja

- **Worker de acceso** (`rwadar-acceso/compilar.cjs`): si `/plataformas/<slug>` ya
  no está en la lista cerrada de fichas pero `/fuera-del-radar/<slug>` sí (o al
  revés, si una descartada vuelve), responde **301** a la ficha publicada, con
  `Cache-Control: no-store` y **sin pedir nada a Cloudflare Pages**: ni da 404 ni
  sirve la copia de conservación. Vale con o sin `.html` y con barra final;
  conserva la consulta (`?x=1`). El destino solo puede ser una ficha de la lista.
- No hace falta `_redirects`: el worker atiende esas rutas antes de llegar a Pages
  (y un `_redirects` ahora redirigiría la ficha de ARTEX antes de aplicar).
- `.github/comprobar-publicado.mjs` exige ese 301 para las fichas que cambian de
  carpeta; las otras 29 retiradas siguen exigiendo el 404 del worker.
- `despues-de-aplicar.mjs` mueve la ficha en `rwadar-fichas-manifiesto.js`, borra
  `rwadar-site/plataformas/artex-global-markets.html` y anota la revisión en
  `transparencia.json`. Se puede repetir sin efecto.

## 6. El SQL

Una transacción serializable, en este orden:

1. **Guarda:** la publicada es la `cf79e4a4` (o ya la nueva) con su huella y
   aprobada; catálogo no retirado; la revisión nueva no existe con otra huella.
2. El lote nuevo en `rwadar_catalogo` (revisión, 25 plataformas sin ARTEX, 24
   ofertas, fuentes y avisos), como borrador.
3. **Guarda de plataformas:** las otras plataformas del radar usan blockchain;
   ARTEX no tiene ofertas ni emisiones; la página de ARTEX no está en otra
   plataforma; y todo está como lo publicado (ARTEX tal cual, sin fuentes, 26/4) o
   ya como quedaría (revisión nueva, ARTEX descartada con su fuente, 25/5). Nada a
   medias. Luego 1 `update` de `public.plataformas` (ARTEX, solo si sigue en el
   radar) y 1 `insert` en `public.fuentes` (`on conflict do nothing`), y la
   comprobación (incluida «ninguna descartada sin fuente»).
4. **Aprobación** solo si el lote está completo (25 / 24 / 8-13-3), sin ARTEX, y
   es publicable.

Sin borrados, esquema, permisos, cuentas ni funciones.

## 7. Pruebas

- **`comprobar-entrega.mjs` (PGlite, cadena 22/10 → 2026-11-04 sobre `02_seed.sql`):
  correcto, 26 comprobaciones** (27 con `--exportar`) **y 12 casos de fallo que no
  dejan nada:** otra publicada, otra huella, catálogo retirado, otra plataforma
  del radar sin blockchain, ARTEX con otros datos, con otro texto, con una fuente
  propia o con una emisión, la página de ARTEX colgada de otra plataforma, una
  quinta descartada que no es ARTEX y dos «a medias». Además: antes de aplicar,
  PGlite enseña lo mismo que la lectura de producción (salvo el uuid de cada
  plataforma y «publicadaEl» de las fuentes del radar); idempotente; las otras 25
  plataformas y las 24 ofertas idénticas; los lectores de la web y de la app lo
  aceptan (25/24, vence el 11/11); las 24 tarjetas se ven igual; con alguien
  vigilando ARTEX queda un aviso en cola sin enviar; las vistas V1 (Android 1.3.2)
  ya estaban vacías antes y siguen igual. Resultado en `pruebas-locales.json`.
- **Ensayo «después de aplicar»** en una copia aparte (`ensayo-despues.json`):
  `sincronizar.js` con lo que leería un visitante tras aplicar («25 plataformas
  verificadas, 5 descartadas y 24 ofertas»), `despues-de-aplicar.mjs`,
  `volcar-seed.js` («25 en el radar, 5 descartadas, 13 fuentes»), `rwadar-fichas.js`,
  `transparencia.mjs`, `og.mjs` y **`npm test`: salida 0** (pre-render «25 fichas, 5
  descartadas y 24 emisiones»). En el navegador (servidor local, Chrome sin
  interfaz): franja «25 Plataformas / 5 Descartadas», «25 plataformas en el
  radar», «25 platforms on the radar», ARTEX primera en Descartadas con su motivo y
  su fuente en escritorio y móvil, y la ficha `/fuera-del-radar/artex-global-markets`.
  El worker compilado sobre los archivos construidos: `/plataformas/artex-global-markets`
  → 301 a `/fuera-del-radar/artex-global-markets`, sin pedir nada a Pages.
- **`npm test` en la rama: salida 0.** Base de datos 27 scripts con 886
  comprobaciones, 30 SQL y mapa 11/11; web 593; fichas 71; precarga 32; móvil 409
  correctas y 2 omitidas de 411; acceso 146 (una nueva: el 301); herramientas sin
  diferencias. Guardián OTA `ok` (1.4.1(23)). Gitleaks sin hallazgos.

## 8. Lo que no se pudo o queda fuera

- **No se aplica ni se publica** (orden de esta tarea). Falta la revisión
  independiente.
- La guarda «ARTEX tiene ofertas en el catálogo» no tiene caso de fallo en PGlite:
  una revisión aprobada no se puede modificar y ARTEX no tiene ofertas.
- **Entre aplicar el SQL y publicar la web**, la web publicada hoy no puede
  actualizar el catálogo (su JavaScript exige 4 descartadas) y sigue enseñando su
  copia (26, con ARTEX en el radar), sin vaciarse. Se arregla al publicar la web
  nueva: hay que hacer las dos cosas seguidas.
- **La app** (Android 1.4.1) lee el catálogo de Supabase y acepta el lote de 25
  (su lector usa el número que declara cada lote; las descartadas no tienen cuenta
  fija): no hace falta OTA para estos datos. Cambian `rwadar-movil/lib/idioma.js` e
  `idioma-en.js` (patrones de inglés que comparte con la web); llegarán con la
  próxima OTA, sin prisa.
- La portada de ARTEX (`plataformas/artex-global-markets.webp`) sigue publicada,
  aunque ninguna página la enseña; se puede quitar en otra entrega.
- En el servidor local (`rwadar-servir.js`) la dirección vieja da 404: la
  redirección la hace el worker de Cloudflare.
- El ensayo de la entrega 2026-11-04 (`2026-11-04-v2/comprobar-entrega.mjs`) ya no
  corre sobre el `02_seed.sql` de hoy (espera el texto de Toucan de antes de esa
  entrega); es histórico y no se toca.
- `docs/INTERNO.md` habla de 26 plataformas: se actualiza al aplicar.

## 9. Pasos para aplicarla (con la orden de Víctor)

1. Revisión independiente de este informe, `cambios-plataformas.json`, el SQL y
   los cambios de código (worker, sincronizador, pre-render, verificadores,
   pruebas). **Hecha el 05/11**; sus dos fallos están resueltos (ver al final).
2. Unir a `main` (PR y CI).
3. Releer como visitante, con hora, que la publicada sigue siendo la `cf79e4a4`,
   con 26/24 y 4 descartadas, y ARTEX como en `lectura-publica/artex-plataforma.json`.
4. «Aplicar catálogo» con `2026-11-04.2`.
5. Comprobar en línea: revisión `723968ce…`, 25 plataformas sin ARTEX, 24 ofertas
   (8/13/3), 5 descartadas, ARTEX con «Sin blockchain», su motivo y la página de
   preguntas frecuentes.
6. Sin esperar, desde la raíz:
   ```
   node rwadar-app/sincronizar.js
   node rwadar-app/data/verificaciones/2026-11-04.2-v2/despues-de-aplicar.mjs
   node rwadar-app/volcar-seed.js
   node rwadar-fichas.js
   node rwadar-editorial-source/ofertas/transparencia.mjs
   RWADAR_CHROMIUM=<chrome> node rwadar-editorial-source/og.mjs   # un punto menos
   npm test
   ```
   `git status` debe enseñar lo de `ensayo-despues.json` (`archivosQueCambian`).
   Commit, sello y «Publicar web» (preview y producción).
7. Comprobar: `curl -I https://rwadar.pages.dev/plataformas/artex-global-markets`
   → 301 con `location: /fuera-del-radar/artex-global-markets` y
   `cache-control: no-store`; la ficha nueva → 200. `comprobar-publicado.mjs` lo
   exige.
8. Actualizar `docs/INTERNO.md` (25 plataformas y 5 descartadas). No hace falta OTA.

## Archivos

- `cambios-plataformas.json`: decisión, premisa, ARTEX antes/después y su fuente.
- `lectura-publica/`: lo leído hoy como visitante.
- `preparar-entrega.mjs`: monta el lote y el SQL desde la 2026-11-04.
- `comprobar-entrega.mjs` y `pruebas-locales.json`: ensayo en PGlite.
- `despues-de-aplicar.mjs`: lista cerrada, página vieja y transparencia.json.
- `ensayo-despues.json` y `ensayo-rest-simulado.cjs`: el ensayo «después de aplicar»
  (solo en una copia aparte del repositorio).
- `contraste-2026-11-04.2.json`, `manifiesto-catalogo.json`, `radar-canonico-26.json`
  (con 25 plataformas: el nombre lo fija el cargador), `escaparate-publicacion.json`,
  `documentacion-ofertas.json`.

## Revisión independiente (05/11/2026)

Un corrector revisó la rama solo leyendo (releyó la publicada como visitante a las
00:24 UTC, comparó el lote con el de la 2026-11-04, abrió la página de preguntas
frecuentes de ARTEX con Chrome sin interfaz, repitió las pruebas y el ensayo en
copias aparte). Todo lo que dice esta entrega se cumplía, con dos fallos menores:

1. **El motivo llamaba «mercado regulado» a un MTF y lo daba por hecho.** En la
   normativa europea (MiFID II, art. 4.1.21 y 4.1.22) un mercado regulado y un
   sistema multilateral de negociación (MTF) son dos clases distintas de centro de
   negociación, y la página de ARTEX solo dice que es «the first regulated art
   Multilateral Trading Facility (MTF)». **Corregido:** el motivo es ahora «ARTEX
   se presenta como un sistema multilateral de negociación (MTF) regulado de
   acciones sobre obras de arte, y su propia web dice que, por ahora, no usa
   blockchain de ninguna forma. RWAdar solo recoge plataformas de activos
   tokenizados.» La razón del descarte (no usa blockchain) no cambia.
   - `preparar-entrega.mjs` regenera el SQL: cambian las tres líneas con el motivo
     (la guarda «después», el `update` y la comprobación) y el SHA, que pasa de
     `a4d99551…e15` a **`2ce8084d…fb33`**. La revisión `723968ce…`, `catalogo.sql`
     y `revision.json` no cambian. Repetido dos veces: mismo SHA.
   - `comprobar-entrega.mjs` otra vez (05/11, 00:43 UTC): **correcto, 26
     comprobaciones y 12 casos de fallo** (27 con `--exportar`).
   - Ensayo «después de aplicar» repetido con el motivo nuevo
     (`ensayo-despues.json`, `repetidoTrasCorregirElMotivo`): 25 / 5 / 24;
     `despues-de-aplicar.mjs` comprueba el motivo nuevo; el motivo nuevo sale en la
     ficha `/fuera-del-radar/artex-global-markets`, en Descartadas (escritorio y
     móvil), en `rwadar.csv` y en `02_seed.sql`, y el viejo en ninguna parte;
     `npm test` con salida 0.
2. **La ruta del SQL en el resumen de la entrega estaba mal** (faltaba `data/`).
   Este informe ya usaba la buena:
   `rwadar-app/data/importaciones/catalogo-2026-11-04.2-v2/aplicar-y-aprobar.sql`.
   Hay que usar esa misma ruta en la entrada de `docs/tareas/PARA-CODEX.md` cuando
   se escriba.

**`npm test` en la rama después de la corrección: salida 0** (mismos números que en
el apartado 7). Guardián OTA `--base c1f7106…`: `ok`, 1.4.1(23). Gitleaks sin
hallazgos.

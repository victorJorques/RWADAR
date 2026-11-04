# Entrega del catálogo 2026-11-03.8 · textos de Reental, Toucan y RealT

Preparada el 04/11/2026 por Claude en el worktree
`/home/user/RWADAR/.claude/worktrees/catalogo-1103-8`, rama
`claude/catalogo-2026-11-03.8` (sale de `origin/main`, b98719d; sin push).
**Nada aplicado en Supabase, nada publicado, sin OTA, ningún workflow lanzado.**
Estado: **preparada y probada en local** (no aplicada, no revisada aún por otro
agente).

## 1. Etiqueta y SHA

- **Etiqueta: `2026-11-03.8`.**
- **SHA-256 de `rwadar-app/data/importaciones/catalogo-2026-11-03.8-v2/aplicar-y-aprobar.sql`:
  `20d876b2e28b5bd02a3001913fc8c8dd2d103eeb07952c5af183cdb08313c49e`.**
- Exige que la publicada sea la `f2732257-206d-48ce-2067-c7e19fa33002`
  (entrega 2026-11-03.7), aprobada y con su huella
  `f2732257206d48ce2067c7e19fa3300202a22060ffcda457d2aea8f6d20da7a9`, y la
  deja publicada: **no crea ninguna revisión del catálogo**. Solo toca
  `public.plataformas` (4 textos) y `public.fuentes` (1 fuente nueva).
- Por qué `.8`: sigue a la `.7` publicada y no hay datos nuevos del catálogo.
  La carpeta `verificaciones/2026-11-03.8-v2/` no lleva
  `escaparate-publicacion.json` a propósito: así `npm run catalogo`, el
  generador de fichas y las pruebas siguen tomando la `.7` como la última
  revisión (comprobado: `probar-fichas.cjs`, `generar.mjs` y
  `actualizar-catalogo.mjs` buscan ese archivo).
- El nombre del archivo es `aplicar-y-aprobar.sql` porque es el que lee el
  flujo «Aplicar catálogo»; aquí no hay nada que aprobar (lo dice su cabecera).

## 2. Antes → después, con la fuente de cada texto

«Antes» es lo que hay hoy en producción según la última sincronización (el
snapshot `catalogo-publico-20261022.js`, tras aplicar la .7);
`preparar-entrega.mjs` comprueba que coincide campo a campo.

| Plataforma | Campo | Antes | Después | Fuente |
|---|---|---|---|---|
| Reental (fila 18) | nota | Proyectos inmobiliarios en España y Latinoamérica desde 100 €. La opción más accesible para un inversor español. | Proyectos inmobiliarios en España y Latinoamérica desde 100 €. | Sin fuente nueva: solo se quita la valoración. |
| Toucan Protocol (fila 75) | motivo del descarte | El bloqueo no es suyo sino del registro: Verra prohibió en 2022… (resto igual) | El bloqueo no viene de Toucan, sino de los registros de carbono: Verra prohibió en 2022 tokenizar créditos ya retirados, y tanto Verra como el American Carbon Registry suspendieron la tokenización desde sus registros. Verra estudia un estado «inmovilizado» que la permitiría, todavía sin resolver. Toucan respaldó públicamente la decisión. | Sus 3 fuentes, sin cambios. Releídas con WebFetch el 04/11: CarbonCredits (27/05/2022): Verra va a «prohibit the practice of creating instruments or tokens based on retired credits»; Toucan «is supportive». Toucan (25/05/2022): «Toucan welcomes this announcement from Verra». S&P Global: 403. |
| RealT | etiqueta | En liquidación | Liquidación anunciada | Outlier Media, 16/07/2026: «RealT co-founder Jean-Marc Jacobson made the announcement on a July 2 call with investors», «We are entering voluntary liquidation», «Details of the proposed liquidation remain unclear». |
| RealT | motivo, frase 1 | Detroit la demandó junto a sus 165 sociedades por más de 400 viviendas con infracciones, en la mayor demanda por insalubridad de la historia de la ciudad. | En julio de 2025, Detroit demandó a RealT, a sus dos cofundadores y a 165 sociedades vinculadas por más de 400 inmuebles residenciales que, según la demanda, incumplían las normas de construcción, salud y seguridad. | BridgeDetroit, 03/07/2025 (WebFetch 04/11): presentada el 2 de julio; «brothers Remy Jacobson and Jean-Marc Jacobson, and 165 affiliates»; «more than 400 residential properties in Detroit»; la demanda dice que «repeatedly violated local building, health and safety codes». |
| RealT | motivo, frase 2 | Un juez le prohibió cobrar alquileres en las no conformes y le ordenó reparar. | Ese mismo mes, una orden judicial provisional le prohibió cobrar alquileres en sus inmuebles hasta que tuvieran certificado de cumplimiento y le ordenó corregir las infracciones. | BridgeDetroit, 24/07/2025 (WebFetch 04/11): «temporary restraining order on July 22»; no pueden cobrar «rent from any tenant living in the properties they own» hasta tener «a certificate of compliance»; «correct code violations within 90 days». |
| RealT | motivo, frase 3 | En julio de 2026 la propia empresa anunció liquidación voluntaria y la venta de sus más de 700 inmuebles en Detroit. | En julio de 2026, su cofundador Jean-Marc Jacobson dijo a los inversores que la empresa entraba en liquidación voluntaria y que iban a vender todos sus activos. | Outlier Media, 16/07/2026 (WebFetch 04/11): llamada con inversores del 2 de julio; «We are entering voluntary liquidation»; «We are going to sell every asset, all of them.» |
| RealT | motivo, frase 4 | (no estaba) | RealT había vendido en tokens participaciones de unos 700 inmuebles de Detroit. | Outlier Media, 16/07/2026: «that sold shares of about 700 Detroit properties»; «selling digital tokens to overseas investors». |
| RealT | fuentes | 3: ciudad de Detroit y dos de BridgeDetroit | Las mismas 3, con la misma dirección y el mismo título, + Outlier Media: `https://outliermedia.org/realt-crypto-real-estate-detroit-properties/`, «Outlier Media · RealT planea vender sus inmuebles de Detroit», publicada el 16/07/2026, consultada el 04/11/2026 | Titular de Outlier: «Crypto real estate company plans to sell over 700 Detroit properties». La ciudad de Detroit da 403 con WebFetch; se conserva y ninguna frase depende solo de ella. |

Motivo completo de RealT (635 caracteres): «En julio de 2025, Detroit demandó a RealT, a
sus dos cofundadores y a 165 sociedades vinculadas por más de 400 inmuebles
residenciales que, según la demanda, incumplían las normas de construcción,
salud y seguridad. Ese mismo mes, una orden judicial provisional le prohibió
cobrar alquileres en sus inmuebles hasta que tuvieran certificado de
cumplimiento y le ordenó corregir las infracciones. En julio de 2026, su
cofundador Jean-Marc Jacobson dijo a los inversores que la empresa entraba en
liquidación voluntaria y que iban a vender todos sus activos. RealT había
vendido en tokens participaciones de unos 700 inmuebles de Detroit.»

**Qué decía de más el motivo propuesto en la .7** (y ya no dice):

- «Detroit la demandó… por más de 400 viviendas con infracciones»: las
  infracciones son lo que alega la demanda, no un hecho juzgado → «según la
  demanda». Las 165 son «affiliates» → «sociedades vinculadas»; también se
  demandó a los dos cofundadores. «Residential properties» → «inmuebles
  residenciales» (Outlier habla de casas y edificios de pisos).
- «Un juez le prohibió cobrar alquileres hasta que las viviendas cumplieran la
  normativa»: fue una orden **provisional** («temporary restraining order»,
  90 días o hasta nueva orden) ligada al **certificado de cumplimiento**.
- «La empresa anunció una liquidación voluntaria y la venta de toda su
  cartera»: lo dijo un cofundador en una llamada con inversores; los detalles
  no estaban claros, la ciudad dice que RealT no había presentado nada en el
  juzgado y, por un acuerdo con la ciudad, la venta de los inmuebles de
  Detroit la decide un administrador especial (Charles Bullock). El texto
  cuenta lo que él dijo, sin dar la venta por hecha ni decidida. No se
  menciona al administrador porque Outlier no dice el año del acuerdo ni si
  sigue igual hoy.
- Fuera «la mayor demanda…»: BridgeDetroit (03/07/2025) y Outlier lo citan
  como valoración de la propia ciudad. «Más de 700» pasa a «unos 700», como
  el cuerpo de Outlier.
- El título de Outlier en la .7 decía «anuncia que venderá»; ahora «planea
  vender», como el titular («plans to sell»).

Todo, frase a frase y con sus literales, en
`rwadar-app/data/verificaciones/2026-11-03.8-v2/textos-plataformas.json`.

## 3. Guardas: si producción no está exactamente como se espera, no cambia nada

Una sola transacción serializable. Antes de tocar nada, la guarda exige:

1. que la publicada sea la `f2732257` (y no otra), aprobada y con su huella;
   que el catálogo no esté retirado;
2. que Reental siga en el radar y Toucan y RealT descartadas, cada texto en su
   valor anterior exacto (o ya en el nuevo);
3. **fuentes de RealT por dirección Y título** (el hueco que vio el revisor):
   como conjunto exacto, o las 3 de antes, o las 3 + Outlier con su título y
   sus dos fechas exactas. Una fuente con otro título, sin título, una de más,
   una de menos, u Outlier ya puesta con otro título u otras fechas → falla;
4. las 3 fuentes de Toucan por dirección y título;
5. exactamente 4 descartadas;
6. **nada a medias**: o todo como antes, o todo ya como quedaría (entonces no
   cambia nada; ni siquiera `actualizada_el`).

Después de cambiar, comprueba el resultado (textos, 4 fuentes de RealT, 3 de
Toucan, 4 descartadas, la publicada sigue siendo la f2732257). Cualquier
fallo lanza un error y psql (`ON_ERROR_STOP=1`) deshace la transacción entera.

Inventario del SQL: `begin isolation level serializable`, bloque de guarda (solo
lee), 4 `update public.plataformas` (nota, motivo_descarte, etiqueta_descarte,
motivo_descarte), 1 `insert into public.fuentes … on conflict do nothing`,
bloque de comprobación (solo lee), `commit`. Nada en `rwadar_catalogo`, ningún
`estado` (no salta el disparador de cambios de estado ni los avisos), sin
esquema, permisos ni funciones.

## 4. Pruebas

- `node rwadar-app/data/verificaciones/2026-11-03.8-v2/comprobar-entrega.mjs`
  (PGlite, sin red, cadena 22/10 → 03/11.7 como producción): **correcto, 29
  comprobaciones** (`pruebas-locales.json`):
  - inventario del SQL;
  - con producción como se espera: la publicada sigue siendo la f2732257,
    `rwadar_catalogo` igual, sin cambios de estado ni avisos; en
    `public.plataformas` cambian solo esas 4 columnas (y `actualizada_el` de
    esas 3 filas); en `public.fuentes` las 10 de antes intactas y solo una nueva
    (Outlier, con su título y fechas);
  - idempotente; como visitante, 26 plataformas y 24 ofertas idénticas salvo
    la nota de Reental, y el lector de la web lo acepta; los descartes como
    los lee `sincronizar.js` (RealT con 4 fuentes, Toucan con sus 3,
    Domoblock y Goldfinch iguales); las fichas fijas
    (`/fuera-del-radar/realt`, `/fuera-del-radar/toucan-protocol`,
    `/plataformas/reental`) se generan con los textos nuevos;
  - ya aplicada: no cambia nada;
  - **20 casos de producción distinta que fallan sin dejar nada** (foto de
    publicación, revisiones, catálogo, plataformas, fuentes, cambios de estado
    y avisos idéntica antes y después): otra publicada, catálogo retirado,
    revisión con otra huella, cada texto distinto, Reental fuera del radar,
    el `textos-plataformas.sql` de la .7 ya aplicado, RealT con una fuente de
    más o de menos, **una fuente de RealT con otro título o sin título,
    Outlier ya puesta con otro título u otras fechas, una fuente de Toucan con
    otro título**, una quinta descartada y tres estados a medias.
- `preparar-entrega.mjs` dos veces: mismos bytes (SHA 20d876b2…).
- `npm test` completo (raíz, con los `node_modules` enlazados): **en verde, código 0**. Base de
  datos: todas las baterías con 0 fallidas y 30 comprobaciones SQL; web: `probar-web.mjs` 580
  correctas, fichas 68, precarga 32; QR correcto; móvil 409 correctas y 2 omitidas, 0 fallos;
  herramientas correctas; acceso 144 correctas. `git status` igual antes y después.
- No se añade ninguna prueba que fije textos.

## 5. Archivos

- `rwadar-app/data/verificaciones/2026-11-03.8-v2/`: `textos-plataformas.json`
  (textos, frases, literales y contraste), `preparar-entrega.mjs`,
  `comprobar-entrega.mjs`, `contraste-2026-11-03.8.json`,
  `pruebas-locales.json`, `INFORME-ENTREGA.md` (este informe).
- `rwadar-app/data/importaciones/catalogo-2026-11-03.8-v2/`:
  `aplicar-y-aprobar.sql` (20d876b2…) y `revision.json`
  (`tipo: textos_plataformas`, `revisionNueva: false`).
- `rwadar-app/comprobar-revision.mjs`: una entrega sin revisión nueva no entra
  en la cadena de PGlite de las entregas siguientes (su guarda depende del
  contenido de `02_seed.sql`, que cambiará al volcarlo tras aplicar). Sin
  esto, la primera entrega posterior a una revisión nueva podía fallar.
- El `textos-plataformas.sql` de la `.7` queda superado: **no aplicarlo**
  (si se aplicara, la .8 se negaría; está probado).

## 6. Pasos que quedan (coordinador)

Todos con la orden de Víctor de este ciclo y solo si pasa cada compuerta. Un
fallo para el ciclo en ese paso.

1. **Revisión independiente** (otro agente): los textos de §2 contra sus
   fuentes (BridgeDetroit ×2 y Outlier; la ciudad de Detroit y S&P dan 403);
   el SQL (inventario y guardas); `preparar-entrega.mjs` en una copia → SHA
   `20d876b2…`; `comprobar-entrega.mjs` correcto. Anotarla en la carpeta.
2. **Unir a `main`** (PR con merge commit) y push.
3. **Releer como visitante** justo antes de aplicar (compuerta, con hora): la
   publicada es la `f2732257`; RealT «En liquidación» con sus 3 fuentes y
   títulos; la nota de Reental y el motivo de Toucan, los de antes. Si algo
   no coincide, no aplicar (el SQL lo exige igualmente y no cambiaría nada).
4. **Aplicar:** GitHub › Actions › «Aplicar catálogo» › Run workflow desde
   `main`, fecha `2026-11-03.8`.
5. **Comprobar en línea** como visitante: la publicada sigue siendo la
   `f2732257`; RealT «Liquidación anunciada», el motivo nuevo y 4 fuentes
   (con Outlier); el motivo nuevo de Toucan; la nota de Reental sin «La
   opción más accesible…».
6. **Sincronizar:** `node rwadar-app/sincronizar.js` (el snapshot sigue con la
   revisión f2732257; cambian la nota de Reental y los descartes),
   `node rwadar-fichas.js`, `node rwadar-app/volcar-seed.js` (02_seed.sql),
   `node rwadar-editorial-source/ofertas/generar.mjs --comprobar`, `npm test`
   y `npm --prefix rwadar-app run auditar:relanzamiento`. Revisar el diff y
   hacer commit.
7. **Sellar** `rwadar-app/data/relanzamiento/estado.json` con el commit de la
   sincronización y unir a `main`.
8. **Publicar:** «Publicar web» en preview (revisar Descartadas,
   `/fuera-del-radar/realt`, `/fuera-del-radar/toucan-protocol` y
   `/plataformas/reental`) y después en producción.
9. **OTA: no hace falta para estos textos**: la app lee los descartes y la
   nota de Supabase (`lib/datos.js`, `lib/catalogo-remoto.js`).
10. **Traspaso:** marcar en `PARA-CODEX.md` lo aplicado y publicado.

## 7. Observaciones

- `volcar-seed.js` no vuelca `publicada_el` de las fuentes: tras aplicar, el
  02_seed.sql tendrá la fuente de Outlier sin esa fecha (en producción sí la
  tendrá). No afecta a la web ni a la app.
- Toucan: el American Carbon Registry y «todavía sin resolver» solo los
  respalda S&P Global (403 hoy) y no cambian en esta entrega.
- `rwadar-movil/fixtures/escaparate-local.json` (respaldo local de la app,
  del 21/09) conserva los textos viejos; no se ha tocado.

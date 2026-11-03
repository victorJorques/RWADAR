# Revisión independiente · entrega 2026-11-03.6 (retirada de mF-ONE, solo lectura)

**Veredicto: `aprobado`.** El SQL solo hace dos cosas: inserta la revisión nueva
en `rwadar_catalogo` y la aprueba. La guarda es la correcta. Frente a la entrega
2026-11-03.5 la única diferencia es que falta mF-ONE: las otras 24 ofertas, su
documentación, las 26 plataformas y el radar son idénticos. El ensayo en PGlite
sale correcto. La retirada se apoya en fuentes primarias y ninguno de los dos
escépticos la rebate. Las fichas editoriales ya no incluyen mF-ONE.
No hay cambios obligatorios. En el §7 dejo notas menores que no bloquean.

- Revisión nueva: `344a86aa-2c53-d2f0-fed4-5fdaadda33ad`
  (hash `344a86aa2c53d2f0fed45fdaadda33adefd19f6c22049d34891f0b8eb4649a3f`).
- Guarda sobre la publicada: `d75a22fb-929d-5b5c-6110-13d1ce3731fd` (entrega 2026-11-03.5).
- SHA-256 de `aplicar-y-aprobar.sql`: `0fc59754257ae5e5bec17b5cb22d0dfe07f72076bad1d1fe664db327fc320cfa`.
- SHA-256 de `catalogo.sql`: `0c9862a1ccd42f0b8eb7c8616edae9bb9e7463f75281feef243e0f435978d1e7`.
- SHA-256 de `comprobacion-retiradas.json`: `1bd70ff328285ea75205141b0afb7b9835da7dfc0f5e358c8ff568872f9c1a7d`.
  Es el mismo que cita `contraste-2026-11-03.6.json`.
- Revisor: Claude, 03/11/2026. No preparé esta entrega. Trabajé solo en local:
  no conecté con Supabase, no publiqué nada y no usé ningún comando git que
  cambiara el estado.
- Mientras revisaba, quien preparó la entrega la guardó en el commit `4a03ecf`
  (rama `claude/retirar-ofertas-2026-11-03`). Volví a calcular los hashes
  después de ese commit y son los mismos de arriba: revisé exactamente lo que
  está guardado.

## 1. Qué ejecuté y qué salió

| Comprobación | Resultado |
|---|---|
| `node rwadar-app/data/verificaciones/2026-11-03.6-v2/comprobar-entrega.mjs` (PGlite) | Terminó con código 0, `"resultado": "correcto"` y el SHA-256 `0fc59754…`. Pinta las 24 tarjetas (mínimo, acceso desde España y salida) sin citas literales. El ensayo reescribe `pruebas-locales.json`, pero solo le cambió la hora (`15:08:27Z` → `15:11:28Z`). Le devolví el contenido original y `git status` quedó limpio. |
| `preparar-entrega.mjs` ejecutado en una copia en el scratchpad, con la base 2026-11-03.5 y `comprobacion-retiradas.json` | Comprueba que la base da `d75a22fb`. Los 8 archivos que genera coinciden byte a byte con los del lote: escaparate, documentación, manifiesto, contraste, radar, `catalogo.sql`, `aplicar-y-aprobar.sql` y `revision.json`. |
| `node rwadar-editorial-source/ofertas/generar.mjs --comprobar` | Código 0: `fichas.json: 24 fichas (24 con foto), catálogo 2026-11-03.6-v2`. Sin errores y sin fichas sin ilustración. Con `--comprobar` no escribe nada. |
| `npm test` | No lo ejecuté, porque `test:web` escribe archivos generados. El commit de la entrega dice que pasó. |

## 2. Inventario de `aplicar-y-aprobar.sql`

Separé las sentencias respetando comillas y bloques `$…$`, y clasifiqué cada
una por su forma y por la tabla en la que escribe. No me limité a buscar
palabras sueltas en el texto.

### 295 sentencias

| N.º | Sentencia | Tabla | Notas |
|---:|---|---|---|
| 1 | `begin isolation level serializable` | — | Transacción serializable. |
| 1 | `do $guarda$` | Lee `rwadar_catalogo.publicacion_v2` y `public.catalogo_publicacion`, las dos `for update`, y `rwadar_catalogo.revisiones` | Solo `select` y `raise`. Detalle en el §3. |
| 1 | `insert … values … on conflict (id) do nothing` | `rwadar_catalogo.revisiones` | Esperadas: 26 plataformas, 24 ofertas, `{"principales":8,"secundario":13,"en_camino":3}`. |
| 69 | `insert … values … on conflict (revision_id,id) do nothing` | `rwadar_catalogo.fuentes` | Las 69 con `primaria = true` y `consultada_el = '2026-11-03'`. |
| 26 | `insert … select … from public.plataformas where slug=… on conflict (revision_id,plataforma_id) do nothing` | `rwadar_catalogo.plataformas` | `public.plataformas` solo se lee. |
| 109 | `insert … select … on conflict do nothing` | `rwadar_catalogo.plataforma_fuentes` | |
| 26 | ídem | `rwadar_catalogo.alertas` | |
| 36 | ídem | `rwadar_catalogo.alerta_fuentes` | |
| 24 | `insert … values … on conflict (revision_id,slug) do nothing` | `rwadar_catalogo.ofertas` | Las 24 con `verificada_el '2026-11-03'` y `vigencia_dias 7`. Ninguna es `mf-one`. |
| 1 | `do $aprobar$` | Cuenta filas en `plataformas` y `ofertas`. Hace `update rwadar_catalogo.revisiones set estado='aprobada', aprobada_el=now(), aprobada_referencia=… where id = v and estado = 'borrador'`. Comprueba `rwadar_catalogo.revision_publicable_v2`. | Exige **26 / 24 / 8 / 13 / 3**. Si no se cumple, o si la revisión no queda publicable, lanza un error y se deshace la transacción entera. |
| 1 | `commit` | — | |

- **Cada inserción, con su revisión.** Las 291 inserciones llevan
  `'344a86aa-…'::uuid` como primer literal y ninguna lleva otro UUID entre
  comillas. Los demás UUID del archivo están dentro de enlaces a PDF de
  `cdn.brickwise.at`, y son los mismos que en la entrega .5.
  `344a86aa` aparece 294 veces: 291 en las inserciones, 2 en la guarda y 1 en
  la aprobación. `d75a22fb` aparece una sola vez, en la guarda.
- **Escritura.** Solo hay inserciones en siete tablas de `rwadar_catalogo` y un
  `update` en `rwadar_catalogo.revisiones`, el de la aprobación. Ninguna
  inserción llama a funciones ni lleva subconsultas, salvo el
  `select … from public.plataformas where slug=…` que busca el id de cada
  plataforma.
- **Lo que no hay** fuera de los literales: `create`, `alter`, `drop`,
  `delete`, `truncate`, `grant`, `revoke`, `policy`, `execute`, `perform`,
  `copy`, `call`, `set role`/`session`, `comment on`, `auth.`, `storage.` ni
  `pg_`. Es decir: sin DDL, sin borrados, sin permisos, sin Auth y sin
  funciones. Los dos `do` son bloques anónimos y no crean nada.
- **Efectos indirectos, los mismos de siempre.** La aprobación dispara dos
  disparadores que ya existen en `rwadar_catalogo.revisiones`; el lote no los
  crea ni los cambia:
  - `fijar_publicacion_v2` mueve el puntero de `publicacion_v2` a `344a86aa`;
  - `sincronizar_publicacion_catalogo` deja `public.catalogo_publicacion` con
    `retirado = false`, `motivo = null` y `actualizado_el = now()`. La guarda
    ya exige `retirado = false`, así que no reactiva un catálogo retirado.

  Ningún otro disparador del esquema actúa sobre las tablas en las que escribe
  el lote.
- **`catalogo.sql`** tiene 293 sentencias: `begin`, las mismas 291 inserciones
  y `commit`. No aprueba nada. `diff` contra el aplicador solo muestra la
  cabecera, la guarda y el bloque de aprobación.

## 3. La guarda

| Exigencia | Cómo lo hace | ¿Cumple? |
|---|---|---|
| Transacción serializable | `begin isolation level serializable;` es la primera sentencia | Sí |
| La publicada es exactamente `d75a22fb` o la nueva | `select revision_id … from publicacion_v2 where unica for update`; error si es `null` o no está en (`d75a22fb…`, `344a86aa…`) | Sí |
| El catálogo no está retirado | `select retirado … from public.catalogo_publicacion where unica for update`; error si `retirado is distinct from false`, lo que cubre también que falte la fila | Sí |
| Fecha | Error «Revisión futura» si `current_date < '2026-11-03'` | Sí |
| Identidad | Error si ya existe `344a86aa` con otro `contenido_sha256` o en estado `retirada` | Sí |

Al repetirlo no pasa nada: las inserciones no hacen nada, el `update` no
encuentra la fila en `borrador` y la vista publicable ya muestra la revisión.
El ensayo lo prueba aplicando el lote dos veces seguidas. Si la revisión ya
existiera aprobada pero sin ser la publicada, la comprobación final de
`revision_publicable_v2` falla y se deshace todo.

## 4. Diferencias revisadas frente a la entrega 2026-11-03.5

- **SQL.** Comparé los dos aplicadores sustituyendo las revisiones y el hash
  por marcadores. Solo cambian:
  - el comentario de la cabecera;
  - en la inserción de `revisiones`, las cuentas esperadas (25 → 24 ofertas y
    14 → 13 de reventa);
  - una línea menos: la inserción de `mf-one` en `ofertas`;
  - las cuentas de la aprobación (25 → 24 y 14 → 13);
  - el texto de `aprobada_referencia`.

  Las 69 fuentes, las 26 plataformas, las 109 + 26 + 36 filas de fuentes y
  alertas y las 24 ofertas restantes son idénticas línea a línea.
- **`escaparate-publicacion.json`.**
  - `plataformas`: igual (26).
  - `ofertas`: falta solo `mf-one`. Las 24 restantes son iguales campo a campo
    y van en el mismo orden.
  - Solo cambian tres datos internos de `fuente`: `notaOrigen`, que añade una
    frase sobre la retirada, y las rutas y la nota de `actualizacionLocal` y
    `actualizacionRadarLocal`. Ninguno entra en el hash ni en el SQL.
- **`documentacion-ofertas.json`.** Falta solo `mf-one`. Las 24 restantes son
  iguales campo a campo y van en el mismo orden.
- **`manifiesto-catalogo.json`.** Pasa de 26 / 25 / 8-14-3 a 26 / 24 / 8-13-3,
  que es lo que cuentan las colecciones del escaparate.
- **`radar-canonico-26.json`.** Es idéntico byte a byte al del .5: SHA-256
  `31f567b8…`. Sigue nombrando mF-ONE en la ficha de la plataforma Midas,
  porque es uno de los productos de Midas; no es una oferta de RWAdar.
- **En PGlite**, con las vistas públicas V2 leídas como visitante, tras aplicar
  en orden las entregas del 22/10 al 03/11.5:
  - antes hay 25 ofertas de `d75a22fb`;
  - después hay 26 plataformas y 24 ofertas, todas de `344a86aa`;
  - sin `mf-one`, las mismas fichas en el mismo orden;
  - cada una idéntica a la anterior salvo en `revision_id`, `ofertas_esperadas`
    y `colecciones_esperadas`;
  - siguen vigentes el 10/11 y caducan el 11/11;
  - Spiko: 2,34 %, 3,95 % y 2,84 %.

## 5. La retirada (`comprobacion-retiradas.json`)

- Se volvieron a comprobar las 25 ofertas. Se propusieron dos retiradas:
  - **mF-ONE** (`no_abierta_al_particular`): **se retira**. Los dos escépticos
    la dan por buena (`refutada: false`).
  - **Terreno BILLA** (`campana_caducada`): los dos escépticos la rebaten con
    datos (20 participaciones suscritas a finales de octubre, `stage=primary`
    y un contrato que permite prorrogar el plazo). **Se mantiene**, y por eso
    no está en el SQL.

  `gruposSinResultado` está vacío.
- **Fuentes primarias de mF-ONE**, consultadas el 03/11 entre las 14:36 y las
  14:38 UTC:
  - el código que sirve la web de Midas (`main-Z8x886kR.js`, SHA-256
    `72c4ccc7…`): la llama «Exempt offer» y solo enseña su memorando a
    direcciones en lista blanca (`requiresGreenlist`);
  - la documentación de Midas (`llms-full.txt`, SHA-256 `aca8b6c7…`): los
    productos con lista blanca piden alta manual y suelen estar reservados por
    ley a inversores profesionales;
  - la cadena de bloques: los contratos de suscripción y de reembolso tienen
    `greenlistEnabled()=1` y no están en pausa;
  - el registro de folletos de ESMA: 38 valores y 41 documentos del emisor,
    ninguno de mF-ONE ni de Fasanara;
  - `docs.midas.app/llms.txt`: no tiene página legal de mF-ONE y sí la de
    mTBILL.
- **Lo que añaden los escépticos:**
  - el primero leyó otros 12 contratos de Midas como control. Todos tienen la
    lista blanca desactivada, así que la restricción es propia de mF-ONE;
  - el segundo cita del código del producto «Accessible only to qualified
    investors or those investing at least $150,000.» y no encuentra ningún
    mercado de reventa (GeckoTerminal, DexScreener ni CoinGecko).
- **Decisión editorial expresa:** Víctor, 03/11/2026: «retira las ofertas que
  ya no valgan o ya no estén». Se cumple la regla del ciclo: una retirada
  necesita una fuente citable y una decisión editorial explícita.

## 6. Fichas editoriales

- `rwadar-editorial-source/ofertas/fichas.json` y `fotos.json` ya no tienen
  ninguna entrada ni mención de mF-ONE. Su foto maestra, `fotos/mf-one.webp`,
  está borrada en el mismo commit.
- `generar.mjs --comprobar` pasa: 24 fichas, las 24 con foto, contra el
  catálogo `2026-11-03.6-v2`.

## Cambios obligatorios

**Ninguno.**

## 7. Notas que no bloquean

1. **Un texto interno se contradice.** `escaparate.fuente.notaOrigen` dice
   «…; sin retiradas.» y al final añade «Retirada de mF-ONE…». Es un dato
   interno: no se publica ni entra en el hash.
2. **El motivo no está redactado igual en todas partes.**
   - `textoRetirada` (en `comprobacion-retiradas.json` y en el contraste) dice
     «solo… a inversores profesionales».
   - La aprobación y la nota dicen, con el matiz que pidió el segundo
     escéptico, «solo para inversores cualificados o desde 150.000 USD, con
     lista blanca».

   La cita de los 150.000 USD solo aparece en el razonamiento de ese escéptico,
   no en la lista `fuentes` de la retirada. La retirada se sostiene igual con
   la lista blanca y la oferta exenta, que sí tienen fuente. Si se quiere
   reutilizar el texto, conviene dejarlo como el de la aprobación.
3. **Una etiqueta del ensayo está desfasada.** En `pruebas-locales.json`, la
   lista `pruebas` dice «cadena de producción 22/10 → 03/11.2», pero el ensayo
   aplica la cadena hasta el 03/11.5.

## 8. Antes y después de aplicar (recordatorio, no son cambios de la entrega)

- **Desde `main`.** El flujo «Aplicar catálogo» solo funciona desde `main`
  (`2026-11-03.6`). Hay que unir antes la rama.
- **Volver a leer la revisión publicada.** Justo antes de aplicar hay que
  comprobar que sigue siendo `d75a22fb`. La guarda lo exige de todas formas.
- **Leer después las vistas públicas V2 como visitante:**
  - revisión `344a86aa`;
  - 26 plataformas y 24 ofertas, con 8 / 13 / 3;
  - sin `mf-one`.

  La lectura final del propio flujo no basta: ordena `revisiones` por id
  (`order by 1 desc limit 2`) y saldrían `fab6d2e4` y `f2be1f5e`, no
  `344a86aa`.
- **Quitar mF-ONE de la web y de la app.** Siguen generadas con mF-ONE:
  - en la web: `rwadar-site/ofertas/mf-one.html`, `index.html`, `sitemap.xml`,
    `plataformas/midas.html` y `assets/*.js`;
  - en la app: `rwadar-movil/fixtures/*` y
    `assets/ofertas-editoriales/manifest.json`.

  Se regeneran al sincronizar y sellar la web y al ejecutar `generar.mjs` sin
  `--comprobar`, antes de «Publicar web» y de la OTA. Después hay que
  comprobar que `ofertas/mf-one` da 404.

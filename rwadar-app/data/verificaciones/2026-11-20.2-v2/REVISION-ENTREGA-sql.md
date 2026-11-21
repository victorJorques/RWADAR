# Revisión independiente · SQL e integridad · entrega 2026-11-20.2

Revisor: DBA (SQL e integridad), sin haber montado la entrega. 21/11/2026,
02:10–02:25 UTC. Sin red hacia Supabase ni hacia GitHub; nada aplicado,
publicado ni subido.

**Veredicto: aprobada con un cambio, solo en el informe. El SQL no cambia.**
El SQL es el que dice el montador (SHA-256 `7b13a3d2…8391`, revisión
`1d2cd6b1-0aca-2400-88c1-d8aa31d01f6a`), sale igual byte a byte al rehacerlo,
solo escribe datos editoriales de la revisión nueva en `rwadar_catalogo` y su
aprobación, y la guarda frena todo lo que tiene que frenar. Fuera de la lista
cerrada solo cambia una cosa: el comienzo del alcance de «Mínimo de inversión»
en 14 fichas (lo pone el motor). Es cierto, pero el informe dice que no cambia
ningún texto: hay que decirlo (misma corrección que O1 de la revisión de
contenido).

## Qué ejecuté y qué salió

| Orden | Resultado |
|---|---|
| `motor.mjs preparar 2026-11-20.2 --repetir --salida=<scratchpad>/rev-sql-2026-11-20.2` | Mismos SHA-256 las dos veces; 73 cambios, 73 pruebas, 0 sin aplicar |
| `cmp` de los 8 archivos rehechos con los de la rama | **Los 8 iguales byte a byte** (los 2 SQL, `revision.json`, escaparate, documentación, contraste, manifiesto y radar) |
| `motor.mjs comprobar 2026-11-20.2` (PGlite, cadena de producción) | `correcto`: 18 comprobaciones (19 con `--exportar`) y 6 casos de fallo, todos «falla y no deja nada» |
| Mi propio divisor de sentencias (respeta comillas, `$…$` y comentarios) sobre los dos SQL | Inventario de abajo |
| Comparación sentencia a sentencia con el SQL publicado (`catalogo-2026-11-20-v2`), quitando revisión y huella | 20 distintas: 19 inserts de ofertas y la aprobación |
| Lectura de los valores de los 22 inserts de ofertas | Solo cambia la columna `documentacion` (19 fichas); en las dos entregas, igual a su `documentacion-ofertas.json`; `verificada_el` 2026-11-20 y 7 días en las 22 |
| Comparación campo a campo de escaparate y documentación con `2026-11-20-v2` | Ver «Diferencias» |
| gitleaks 8.30.1 (la versión de la CI), con `rwadar-app/gitleaks.toml` y con sus reglas por defecto, sobre los 77 archivos que cambia la rama | 0 hallazgos en los dos |

Nota de limpieza: `comprobar` reescribe `pruebas-locales.json` al ejecutarlo
(solo cambiaban la hora y la fecha del caso «caducado»); lo devolví a como
estaba con `git checkout`. Dos listas de sentencias que mi guion escribió por
error en la carpeta del SQL las saqué al momento al scratchpad. La rama queda
como la dejó el montador, más este informe.

## Inventario (contado por mí)

`aplicar-y-aprobar.sql` · 288 sentencias, en una sola transacción:

| # | Sentencia | Tabla | Cuántas |
|---|---|---|---|
| 1 | `begin isolation level serializable` | — | 1 |
| 2 | `do $guarda$` (solo lee y bloquea) | `rwadar_catalogo.publicacion_v2`, `rwadar_catalogo.revisiones`, `public.catalogo_publicacion` | 1 |
| 3 | insert … `on conflict (id) do nothing` | `rwadar_catalogo.revisiones` | 1 |
| 4 | insert … `on conflict (revision_id,id) do nothing` | `rwadar_catalogo.fuentes` | 69 |
| 5 | insert … select de `public.plataformas` … `on conflict do nothing` | `rwadar_catalogo.plataformas` | 25 |
| 6 | ídem | `rwadar_catalogo.plataforma_fuentes` | 107 |
| 7 | ídem | `rwadar_catalogo.alertas` | 25 |
| 8 | ídem | `rwadar_catalogo.alerta_fuentes` | 35 |
| 9 | insert … `on conflict (revision_id,slug) do nothing` | `rwadar_catalogo.ofertas` | 22 |
| 10 | `do $aprobar$`: cuenta 25/22/8/13/1, un `update` de la revisión nueva `where id = v and estado = 'borrador'`, y exige que sea publicable y quede publicada | `rwadar_catalogo.revisiones` | 1 |
| 11 | `commit` | — | 1 |

- Las 284 inserciones llevan la revisión `1d2cd6b1`; ninguna lleva otra.
- `public.*` solo se lee: `public.plataformas` para sacar el identificador de
  cada plataforma, y la fila única de `public.catalogo_publicacion` se bloquea
  (`for update`) para que nadie la retire a medias. No se escribe en `public`.
- Nada de usuarios, Auth, RLS, ACL, `grant`, funciones, disparadores, esquema,
  capacidades, servicios ni credenciales. Fuera de los literales no hay
  `drop`, `alter`, `create`, `grant`, `revoke`, `truncate`, `delete`,
  `security definer` ni `set role`; el único `update` es el de la aprobación.
- `catalogo.sql` · 286 sentencias: `begin`, las mismas 284 inserciones (iguales
  una a una) y `commit`. Sin guarda ni aprobación: solo importa un borrador.
- Las mismas filas por tabla que la entrega publicada.

## La guarda

Comparada con la del SQL publicado (quitando revisión y huella) es idéntica,
con las mismas fechas. Hace, en este orden y dentro de la transacción
serializable:

1. Bloquea la publicación y exige que la publicada sea la `eca89db7` (o ya la
   `1d2cd6b1`, para repetir sin daño).
2. Si es la `eca89db7`: tiene que estar aprobada y con la huella
   `eca89db7aac535faf7925bffbe8795e2edf8096c80af6789c7ab59b960a5af43`.
3. Bloquea `public.catalogo_publicacion` y exige `retirado = false` (un nulo
   o la falta de la fila también paran).
4. Fecha: ni antes del 20/11 ni después del **27/11/2026** (`current_date`,
   que en Supabase es UTC).
5. Si la revisión destino ya existe, tiene que tener la huella
   `1d2cd6b10aca2400…a6141be6` y no estar retirada.

Al final, `$aprobar$` deshace todo si faltan filas, si la revisión no es
publicable o si no queda publicada. Los 6 casos de fallo de `comprobar`
(publicada anterior, otra huella, catálogo retirado, destino con otra huella,
lote caducado, plataforma ausente) fallan con su mensaje y dejan todo igual;
aplicarlo dos veces da lo mismo. Bien.

## Diferencias con la entrega publicada (campo a campo)

**Escaparate:** las 22 ofertas y las 25 plataformas, iguales en todo y en el
mismo orden. Solo cambian 4 notas de `fuente` (de qué entrega parte y qué
archivo la respalda): «434217eb (entrega 2026-11-13)» → «eca89db7 (entrega
2026-11-20)», y las rutas y la nota de la carpeta `2026-11-20.2-v2`. Esperado.

**Documentación** (comparando cada referencia entera, también las repetidas):

| Cambio | Cuántos | ¿En DECISIONES? |
|---|---|---|
| Referencias quitadas | 68 | Sí: las 68 viñetas «quita» casan una a una con una referencia quitada, y no se quita ninguna otra |
| Direcciones quitadas de las fuentes (mTBILL `main-DOxid0Zj.js`, Smart Cash GECO `c124199`) | 2 | Sí |
| «Acceso desde España» de las tres de Spiko: fecha del dato 06/11 → 13/11; en Smart Cash, además el alcance, igual letra a letra que el hallazgo 3 de `auditoria/spiko.md` | 3 | Sí |
| **Comienzo del alcance de «Mínimo de inversión»: «Redacción en castellano del dato comprobado en la fuente el 20/11/2026.» → «Comprobado de nuevo en la fuente el 20/11/2026.»** en las 11 de Brickwise, Boss Info, Switzerlend y Hausera | 14 | **No** |

Nada más cambia: ni valores, ni cifras, ni avisos, ni métricas, ni
características, ni descripciones, ni el orden. El radar
(`radar-canonico-26.json`, `radar-contraste-2026-11-20.json`) es idéntico.

Lo de las 14 fichas lo hace `preparar.mjs` (línea 224) con todo dato de
tarjeta que se conserva; no viene de este cambio del motor. El valor, la fecha
del dato, la de consulta y el resto de la nota no cambian, y lo que dice es
cierto (se comprobó en la fuente el 20/11). Por eso no pido rehacer el SQL.
Pero se ve en la ficha, contradice «no cambia ningún texto» del informe y
«Hausera: solo la fecha» de DECISIONES, y es la razón de que la sentencia de
Hausera cuente entre las 20.

Lo quitado no deja huecos: cada ficha de Brickwise conserva «Venta más
barata», «Orden de venta de menor importe», «Participaciones en venta» y
«Mejor oferta de compra» del 20/11, y su descripción dice que hoy solo se
compra a otros inversores; Boss Info conserva «Última operación · 20/11/2026»;
Aktionariat, la métrica «Precio del emisor · 20/11/2026: 7,25 CHF por acción
(fijo)»; Switzerlend, «1 acción (68,01 CHF el 20/11)»; las Letras de Spiko, la
rentabilidad con la VL del 20/11.

## «Después de aplicar» y transparencia.json

En el ensayo en copia aparte, `transparencia.json` solo cambia el lote y la
revisión del catálogo (`2026-11-20` → `2026-11-20.2`, `eca89db7` →
`1d2cd6b1`). Como la fecha del ciclo y la de partida son las dos el
20/11/2026, el motor no mueve ninguna fecha de comprobación ni de título. Ni
`despues.mjs`, ni `transparencia.mjs`, ni `rwadar-fichas.js`, ni
`sincronizar.js` escriben la fecha del reloj (solo la usan para comprobar la
vigencia), así que aplicarlo el 21/11 o más tarde tampoco pondrá «hoy» a nada.
En lo que cambian el catálogo de la web y las 22 páginas no aparece el 21/11.
Bien.

## Datos personales y escáner de secretos

- gitleaks: 0 con la configuración del repositorio y 0 con sus reglas por
  defecto.
- Lo que parece un secreto y no lo es: huellas SHA-256, identificadores de
  revisión, UUID de documentos públicos (Aktionariat en Google Storage, PDF de
  Brickwise) y direcciones `0x…` de contratos públicos (tokens, oráculos,
  bóvedas, mercados). Ninguna es de una persona.
- Correos añadidos: el de contacto del proyecto que enseña la web y el de
  soporte de una empresa. Ningún nombre de persona física añadido en esta
  rama.
- Ya estaba antes (desde el 10/11, no es de esta entrega): un nombre completo
  en `docs/tareas/PARA-CODEX.md` (línea 7631).

## Corrección obligatoria (no cambia el SQL)

**S1 · Decir el único cambio fuera de la lista.** Es la misma que O1 de
`REVISION-ENTREGA-contenido.md`; basta con hacerla una vez, en
`INFORME-ENTREGA.md`:

- Donde dice «no cambia ningún texto, cifra, aviso, métrica ni dato de
  tarjeta (salvo la fecha de «Acceso desde España» en las tres de Spiko, que
  no cambia de valor).», poner: «no cambia ninguna cifra, aviso, métrica ni
  dato de tarjeta (salvo la fecha de «Acceso desde España» en las tres de
  Spiko, que no cambia de valor). Fuera de la lista solo cambia el comienzo
  del alcance de «Mínimo de inversión» en 14 fichas (las 11 de Brickwise, Boss
  Info, Switzerlend y Hausera): «Redacción en castellano del dato comprobado
  en la fuente el 20/11/2026.» pasa a «Comprobado de nuevo en la fuente el
  20/11/2026.», como pone el motor a todo dato de tarjeta que se conserva; la
  fecha y el resto de la nota no cambian.»
- Donde dice «(las 18 ofertas con cambios y sus revisiones)», poner: «(las 18
  ofertas con cambios, Hausera solo por ese comienzo del alcance, y la
  aprobación)».

## Recomendaciones (no frenan la entrega)

- En la misma edición del informe, «Sin DDL, borrados, permisos ni nada en
  `public.*`» queda más exacto como «Sin DDL, borrados ni permisos, y sin
  escribir en `public.*` (solo lee `public.plataformas` y bloquea la fila de
  `public.catalogo_publicacion` mientras dura)».
- Si se quiere, en DECISIONES §3: «hausera-proximas-ofertas (solo la fecha)»
  → «(solo la fecha y el comienzo del alcance de «Mínimo de inversión», que
  pone el motor)».
- Motor, para el próximo ciclo: que `revisar` enseñe ese cambio en «Cambios
  por ficha», y que en una segunda entrega del mismo día conserve «Redacción
  en castellano…» cuando la fecha es la misma, para no tocar textos sin
  motivo.
- `pruebas-locales.json` guarda una ruta del scratchpad («exportado a
  /tmp/claude-0/…/exportado-2026-11-20.2»). No es secreto ni dato personal,
  pero sobra en Git: mejor «<scratchpad>/…», como en `ensayo-despues.json`. Y
  `comprobar` no debería reescribir ese archivo cuando lo ejecuta un revisor.
- Quitar aparte el nombre completo que ya había en `PARA-CODEX.md`.

# Revisión independiente · SQL e integridad · entrega 2026-11-21

Revisor: DBA (SQL e integridad), sin haber montado la entrega. 21/11/2026,
21:10–21:45 UTC. Sin red hacia Supabase ni hacia GitHub; nada aplicado,
publicado ni subido.

**Veredicto: aprobada con dos cambios, los dos en textos (cambian el SQL).**
El SQL es el que dice el montador (SHA-256 `c7f99442…22fe5f`, revisión
`53747b1d-8b08-adda-5d0b-1f4875749a2d`). Sale igual byte a byte al rehacerlo.
Solo escribe datos editoriales de la revisión nueva en `rwadar_catalogo` y su
aprobación, y la guarda frena todo lo que tiene que frenar. Todo lo que cambia
frente a la `2026-11-20.2` viene de `decisiones.json`, con su prueba, o de las
re-fechas que hace solo el motor, y cada fecha de hoy tiene una consulta de hoy.
Lo que no está bien son **dos erratas que el montador escribió hoy** y que irían
a la web y a la app:

- «participaciónes», en 7 fichas de Brickwise;
- «coincidencias.Registro», sin espacio, en Aktionariat.

Se arreglan en `decisiones.json` (S1 y S2, abajo). Lo he probado en una copia:
cambian solo 8 sentencias y PGlite da correcto.

## Qué ejecuté y qué salió

| Orden | Resultado |
|---|---|
| `motor.mjs preparar 2026-11-21 --repetir --salida=<scratchpad>/rev-sql-2026-11-21` | Mismos SHA-256 las dos veces. 418 cambios, 406 pruebas, 53 diferencias con el expediente declaradas y 15 puntos no aplicados |
| `cmp` de los 8 archivos rehechos con los de la carpeta | **Los 8, iguales byte a byte** (los 2 SQL, `revision.json`, escaparate, documentación, contraste, manifiesto y radar) |
| `motor.mjs comprobar 2026-11-21 --salida=… --exportar=…` (PGlite, cadena de producción de 20 lotes) | `correcto`: 19 comprobaciones y 6 casos de fallo, todos «falla y no deja nada»; idempotente (26 s) |
| `motor.mjs revisar 2026-11-21 --salida=…` | `DIFF-ENTREGA.md` igual byte a byte al de la carpeta |
| `motor.mjs auditar … --antes=<scratchpad>/sql-revisado-2026-11-21 --revisado=c7f99442… --secretos=<gitleaks 8.30.1> --exigir-secretos` (sin `--escribir`, temporales en el scratchpad) | `conforme_sin_cambios_en_el_sql`. La copia es el SQL revisado, el inventario es el mismo, PGlite da 18 + 6 y el escáner no encuentra nada |
| Mi propio divisor de sentencias (respeta comillas, `$…$` y comentarios) y mi lector de `values (…)` y `select …` | Inventario de abajo |
| Comparación fila a fila con el SQL publicado (`catalogo-2026-11-20.2-v2`), por clave de cada tabla | Las mismas 284 filas. Cambian 22 filas de ofertas, la de la revisión y la aprobación (23 sentencias, como dice el DIFF); en fuentes solo cambia la fecha; plataformas, alertas y sus fuentes, iguales |
| Las 22 filas de ofertas del SQL frente a `escaparate-publicacion.json` y `documentacion-ofertas.json` | **Iguales campo a campo** y en el mismo orden |
| Escaparate y documentación frente a `2026-11-20.2-v2`, campo a campo, y cada diferencia cruzada con `decisiones.json` | Ver «Diferencias» |
| Ensayo «después de aplicar» en una copia aparte (`git clone` de la rama en el scratchpad, carpeta del ciclo encima): `comprobar --exportar`, `sincronizar.js` con el REST simulado, `despues-de-aplicar.mjs` dos veces | 25 plataformas, 5 descartadas y 22 ofertas. Transparencia: 43 de 44 comprobaciones, más la de BaFin por `textos`. 12 mínimos cortos y 3 textos. La segunda vez, «Nada que cambiar» |
| Lo mismo con `main` de hoy unido en la copia (sin commit), porque la rama no lleva los PR #190 y #191 y estos cambian `rwadar-fichas.js` | Mismo SHA-256 del SQL; PGlite correcto (19 + 6); `despues`, `transparencia.mjs` y `rwadar-fichas.js` sin errores |
| gitleaks 8.30.1 (la versión de la CI), con `rwadar-app/gitleaks.toml` y con sus reglas por defecto: los 287 archivos de la rama, los 13 del montaje y el árbol entero de la rama, como la CI | **0 hallazgos** en todo |
| Simulación de S1 y S2 en el scratchpad (`preparar --repetir --decisiones=<copia>` y `comprobar`) | `correcto` (18 + 6). Cambian solo 8 sentencias en cada SQL (abajo) |

Mientras revisaba, la entrega se subió a la rama (commit `9b9ec4df`). Los
archivos subidos son los que revisé, con los mismos SHA-256. Mis órdenes
escribieron solo en el scratchpad: `comprobar`, `revisar` y `preparar` con
`--salida`, y el ensayo en una copia aparte. La rama queda como estaba, más
este informe.

## Inventario (contado por mí)

`aplicar-y-aprobar.sql`: 288 sentencias en una sola transacción.

| # | Sentencia | Tabla | Cuántas |
|---|---|---|---|
| 1 | `begin isolation level serializable` | — | 1 |
| 2 | `do $guarda$` (solo lee y bloquea; ver abajo) | `rwadar_catalogo.publicacion_v2` (`for update`), `rwadar_catalogo.revisiones`, `public.catalogo_publicacion` (`for update`) | 1 |
| 3 | insert … `on conflict (id) do nothing` | `rwadar_catalogo.revisiones` | 1 |
| 4 | insert … `on conflict (revision_id,id) do nothing` | `rwadar_catalogo.fuentes` | 69 |
| 5 | insert … select de `public.plataformas where slug=…` … `on conflict (revision_id,plataforma_id) do nothing` | `rwadar_catalogo.plataformas` | 25 |
| 6 | ídem, `on conflict do nothing` | `rwadar_catalogo.plataforma_fuentes` | 107 |
| 7 | ídem | `rwadar_catalogo.alertas` | 25 |
| 8 | ídem | `rwadar_catalogo.alerta_fuentes` | 35 |
| 9 | insert … `on conflict (revision_id,slug) do nothing` | `rwadar_catalogo.ofertas` | 22 |
| 10 | `do $aprobar$`: cuenta 25 / 22 / 8 / 13 / 1, hace un único `update` de la revisión nueva `where id = v and estado = 'borrador'` y exige que sea publicable y quede publicada | `rwadar_catalogo.revisiones` | 1 |
| 11 | `commit` | — | 1 |

- Las 284 inserciones llevan la revisión `53747b1d…`; ninguna lleva otra.
- Fuera de los literales no hay `drop`, `alter`, `create`, `grant`, `revoke`,
  `truncate`, `delete`, `copy`, `execute`, `perform`, `lock`, `set role`,
  `security definer`, `policy`, `trigger` ni `function`. El único `update` es
  el de la aprobación; los otros dos «update» del texto son `for update`.
- Ningún cambio en usuarios, Auth, RLS, ACL, funciones, esquema, capacidades,
  servicios ni credenciales. Tampoco hay cadenas `E'…'`: las 22 barras
  invertidas son `\"` dentro de JSON y valen igual con
  `standard_conforming_strings` encendido, como en Supabase y en PGlite.
- `catalogo.sql`: 286 sentencias. Lleva `begin`, las mismas 284 inserciones
  (iguales una a una) y `commit`, sin guarda ni aprobación: solo importa un
  borrador (el estado por omisión de `revisiones` es `borrador`).
- Las mismas filas por tabla que la entrega publicada. Las mismas 22 ofertas y
  las mismas 25 plataformas (por su slug), en las mismas colecciones
  (8 / 13 / 1) y con los mismos estados de revisión. Las 22 ofertas, con
  `verificada_el` 2026-11-21 y 7 días; las 69 fuentes, consultadas el
  2026-11-21, igual que `verificado_el`, como exige la vista publicable.
- Lo que hacen los disparadores de `revisiones` al aprobar, igual que en cada
  entrega:
  - `fijar_publicacion_v2` mueve el puntero a la revisión nueva;
  - `sincronizar_publicacion_catalogo` reescribe la fila de
    `public.catalogo_publicacion` (`retirado = false`, `motivo = null`,
    `actualizado_el = now()`);
  - `avisar_ofertas_nuevas` no hace nada, porque no hay ningún slug nuevo.

  Así que el SQL no escribe en `public.*`, pero la aprobación sí toca esa fila
  de control, como está diseñado.

## La guarda

Comparé las dos guardas quitando revisión, huella y fechas: la de hoy es
idéntica a la del SQL publicado. La aprobación solo cambia su etiqueta. Dentro
de la transacción serializable, la guarda hace esto en este orden:

1. Bloquea el puntero de publicación. Exige que la publicada sea la
   `94f7fd5d-f6e5-c28e-1c31-a6ea5a5f38d7`, o ya la `53747b1d…`, para poder
   repetirla sin daño.
2. Si es la `94f7fd5d`, tiene que estar aprobada y tener la huella
   `94f7fd5df6e5c28e1c31a6ea5a5f38d792b57febb4f1b695d925c2f7636905ba`. Es la
   de su `revision.json`; el motor la rehace desde la `2026-11-20.2` local y
   coincide con lo leído hoy como visitante a las 17:36 UTC.
3. Bloquea `public.catalogo_publicacion` y exige `retirado = false`. Un nulo o
   que falte la fila también paran.
4. Fecha: ni antes del 21/11 ni después del **28/11/2026** (`current_date`, en
   UTC en Supabase). Coincide con `venceTrasEl` y con 7 días de vigencia.
5. Si la revisión destino ya existe, tiene que tener la huella `53747b1d…` y
   no estar retirada.

Al final, `$aprobar$` deshace todo si faltan filas, si la revisión no es
publicable o si no queda publicada. Si la nueva ya estuviera aprobada pero el
puntero siguiera en otra, también para: «no quedó publicada». El flujo
«Aplicar catálogo» lo ejecuta con `psql -v ON_ERROR_STOP=1 -X -f`, así que un
error corta la sesión y la transacción se deshace entera.

Los 6 casos de fallo de PGlite fallan con su mensaje y dejan todo igual:
publicada anterior, otra huella, catálogo retirado, destino con otra huella,
lote caducado y plataforma ausente. Aplicarlo dos veces da lo mismo, y con la
revisión ya importada como borrador se aprueba sin duplicar filas. Bien.

## Diferencias con la entrega publicada (campo a campo)

**Escaparate.** Cambia esto:

- las 4 notas de `fuente`, que dicen de qué entrega se parte;
- en las 25 plataformas, solo las fechas de verificación de sus fuentes;
- en las 22 ofertas, `verificadaEl`, la fecha de los 130 avisos que no
  cambian de texto, y solo la fecha de 4 métricas (FINMA y «Precio del
  emisor») y de 2 literales de rentabilidad;
- 5 métricas, 1 literal de rentabilidad, el resumen de Hausera, la fuente nueva
  de la CNMV en Letras Dólar y los avisos cambiados.

Todo eso es un cambio de `decisiones.json`.

**Documentación** (cada referencia emparejada y cruzada con su cambio):

| Cambio | Cuántos | ¿De dónde sale? |
|---|---|---|
| Referencias re-fechadas o retocadas (`referencia`) | 247 | De `decisiones.json`, con su prueba. Busqué la fuente de cada una entre las consultas de hoy: en 240 está en el expediente con hora de hoy y 1 tiene copia con SHA-256. De las otras 6, los auditores abrieron hoy 5 (data.spiko.io de Letras Euro y Dólar a las 20:15–20:16, Robinhood a las 20:16 y el mercado de Brickwise a las 20:19 UTC). La 6.ª es la de Spiko Euro (data.spiko.io/safo-eur): su cifra se volvió a leer hoy en la API pública de Spiko (17:42:38 UTC), que es de donde la saca esa página |
| Referencias quitadas y nuevas | 62 y 19 | De `decisiones.json` (`referenciaQuita` y `referenciaNueva`), una a una, y sin ninguna otra |
| Datos de la tarjeta | 14 de valor y 4 de fecha | De `tarjeta` y `tarjetaFecha` |
| Direcciones de la ficha | 5 fuera (Midas) y 12 nuevas | `fuenteQuita`. Las nuevas son la ayuda de impuestos de Brickwise en 11 fichas y la CNMV en Letras Dólar, las dos en `fuentesNuevas` |
| Descripción de Hausera | 1 | Empieza por el resumen, que cambia |
| **Datos de tarjeta re-fechados solos**: «Comprobado de nuevo en la fuente el 21/11/2026» y la consulta del 21/11 | 45 | Del motor (FORMATO.md). Comprobé las 45: cada fuente está entre las consultas del expediente de hoy con hora posterior a la lectura pública |
| **Comienzo de la nota en las 14 tarjetas que cambian**: «Comprobado de nuevo…» pasa a «Redacción en castellano del dato comprobado en la fuente el 21/11/2026.» | 14 | Del motor (`preparar.mjs`, línea 330), que lo pone a todo dato de tarjeta que cambia. Es cierto y esperado |
| **«participaciónes»** en la nota del mínimo (Plüddemanngasse, Sonnleithnergasse, Klagenfurt, Randhartingergasse, Hinterstoder, GreenPoint y Cohotel) | 7 | **Errata** de las `nota` de `decisiones.json`. El 20/11 decía «participaciones» |
| **«sin coincidencias.Registro de autorizados»** en «Supervisión · consulta 21/11/2026» de Aktionariat | 1 | **Errata** del `alcance` de `decisiones.json` (falta el espacio) |

No cambia nada más: ni características, ni el orden de las referencias o de
los avisos (las nuevas van donde dice `despuesDe`), ni plataformas. El radar
(`radar-canonico-26.json`) solo cambia fechas: `verificadoEl` y la consulta
de las 69 fuentes, contrastadas hoy 69 de 69. El manifiesto, igual. Busqué
erratas en los 493 textos nuevos (tildes de plural, palabras repetidas,
signos pegados, paréntesis y comillas sin cerrar): solo salen esas dos.

Lo que DECISIONES pide y no entra tal cual está declarado en `noAplicado`
(15 puntos, con su motivo), y PGlite comprueba que lo publicado sigue igual.
Son estos:

- el acceso desde España de Spiko Euro y Dólar, Hausera y las tres KESt;
- el mínimo en lote de Cohotel, Randhartingergasse e Hinterstoder (§8);
- las referencias repetidas que el motor no puede quitar;
- los cambios de nombre de etiquetas;
- las fuentes de Midas en el radar (§7 (4) lo permite).

Juzgar esos motivos es de las otras dos revisiones.

## «Después de aplicar» y transparencia.json

En la copia aparte, `despues-de-aplicar.mjs` solo cambia esto en
`transparencia.json`:

- lote, revisión, `revisadoEl` y `verificadaEl` de las 22, al 21/11;
- la fecha de consulta de 43 de las 44 comprobaciones de «supervisada» y
  «documentoEspana»;
- 11 títulos de puntos fuertes («mercado de reventa en la app (21/11/2026)»);
- 12 mínimos cortos, el de Hausera («Desde 100 € · suscripción desde el
  25/11», 40 caracteres) y el motivo de Hausera.

Comprobé las 43 fechas y los 11 títulos con mi propia normalización de
direcciones: cada uno tiene en el expediente de hoy una consulta de esa misma
ficha de registro o documento con hora posterior a la lectura pública. La
44.ª, BaFin de mTBILL, pasa al 21/11 por `transparencia.textos`, y la respalda
la consulta que hizo hoy el auditor (20:17:55 UTC, `auditoria/acciones-oro-tesoro.md`).

Ni el motor, ni `sincronizar.js`, ni `transparencia.mjs`, ni
`rwadar-fichas.js` escriben la fecha del reloj: solo la usan para ver si el
lote caducó. Aplicarlo el lunes o más tarde no pondrá «hoy» a nada. Ninguna
fecha de hoy queda sin una comprobación de hoy. Bien.

## Datos personales y escáner de secretos

- gitleaks no encuentra nada: ni en los 13 archivos del montaje, ni en los 287
  de la rama, ni en el árbol entero como lo pasa la CI, con la configuración
  del repositorio o con la suya por defecto.
- Lo que parece un secreto y no lo es:
  - huellas SHA-256 e identificadores de revisión;
  - el identificador público del documento de emisión de Hausera en Google
    Drive y los UUID de los PDF públicos de Brickwise;
  - ISIN suizos;
  - las tres direcciones `0x…` de los contratos de los tokens DAKS, LENDS y
    BOSS, publicadas desde octubre.

  Ninguno es de una persona.
- Ningún nombre de persona física en lo que va a Git: los nombres de las
  copias salen como «[nombre recortado]», y la cabecera y la aprobación del
  SQL dicen «el responsable del proyecto». Los correos son de contacto de
  empresas, el del proyecto que enseña la web y un ejemplo ficticio de la
  página de Brickwise.
- `pruebas-locales.json` (línea 20) guarda la ruta absoluta del scratchpad,
  con el identificador de la sesión. No es un secreto, pero sobra en un
  repositorio público (recomendación R3).

## Correcciones obligatorias (las dos cambian el SQL)

**S1 · «participaciónes» → «participaciones».** En `decisiones.json`, en la
`nota` del cambio `tarjeta` «Mínimo de inversión» de estas 7 fichas:

- `vivienda-pluddemanngasse-101-graz`;
- `vivienda-sonnleithnergasse-2-viena`;
- `local-de-estanco-klagenfurt`;
- `randhartingergasse-9-viena`;
- `apartamento-vacacional-hinterstoder-50`;
- `fotovoltaica-greenpoint`;
- `fotovoltaica-cohotel`.

Hay que cambiar «{{BW_MINIMO}} N participaciónes {{BW_MINIMO_FIN}}» por
«{{BW_MINIMO}} N participaciones {{BW_MINIMO_FIN}}», con N = 2, 11, 16, 20, 5,
8 y 35 en ese orden. Son las 7 apariciones del archivo. Las de «1 participación»
están bien.

**S2 · Espacio en Aktionariat.** En `decisiones.json`, en el cambio
`referencia` «Supervisión · consulta 01/11/2026» de `aktionariat`, dentro de
`despues.alcance`, cambiar «Lista de advertencias FINMA y CNMV sin
coincidencias.Registro de autorizados de FINMA: 0 resultados el 21/11/2026.»
por «Lista de advertencias FINMA y CNMV sin coincidencias. Registro de
autorizados de FINMA: 0 resultados el 21/11/2026.».

Después, lo de siempre con el motor:

1. `preparar --repetir`, `comprobar --exportar`, `revisar` y el ensayo
   «después de aplicar». Las 2 erratas no tocan `transparencia.json`.
2. Actualizar los SHA-256 de `INFORME-ENTREGA.md`.
3. `auditar 2026-11-21 --antes=<scratchpad>/sql-revisado-2026-11-21
   --revisado=c7f994423f918cfd5c1a24e6e9822cc758cec2ab5491a19894c994a9d722fe5f
   --secretos=<gitleaks> --exigir-secretos --escribir`.

Lo que debe salir, comprobado en mi simulación:

- `sql_cambiado_falta_auditor`, con **8 sentencias** cambiadas en cada SQL (las
  ofertas de esas 7 fichas y la de Aktionariat) y una sola palabra en cada una;
- el mismo inventario y PGlite correcto;
- si no entra ninguna otra corrección, la revisión
  `75343c8d-c64e-c5ed-2421-8324c8f8a3aa` y el SHA-256
  `8248add579052f8220cb20ab1fde7a25595ec85d27b9a66521263ad764f9e2d2`.

Si las otras revisiones piden más cambios, estos valores cambian.

## Recomendaciones (no frenan la entrega)

- **R1.** En `INFORME-ENTREGA.md` §4, «Sin DDL, borrados, permisos, Auth ni
  funciones; nada en `public.*`» es más exacto así: «Sin DDL, borrados,
  permisos, Auth ni funciones. No escribe en `public.*`: solo lee
  `public.plataformas` y bloquea la fila de `public.catalogo_publicacion`, que
  la aprobación pone al día (`retirado = false`) con su disparador, como en
  cada entrega.» El mensaje de PGlite dice lo mismo («nada en public.*»).
- **R2.** Guardar en la carpeta del ciclo la copia de la consulta de BaFin del
  auditor (Midas, 20:17:55 UTC, SHA-256 `a8a0daad…`), en texto. Hoy la fecha
  de esa casilla de transparencia solo la respalda la frase del informe.
- **R3.** Al rehacer `comprobar`, cambiar en `pruebas-locales.json` la ruta
  absoluta por «<scratchpad>/exportado-2026-11-21», como en
  `ensayo-despues.json`. Mejor aún: que el motor no escriba rutas absolutas.
- **R4.** Para el motor, en el próximo ciclo:
  - que `revisar` enseñe en «Cambios por ficha» las 45 re-fechas automáticas y
    el cambio de comienzo de la nota, que hoy solo se ven en la parte del SQL;
  - que las reglas de las tarjetas busquen erratas fáciles («-ónes»,
    «.Mayúscula» sin espacio) en los textos nuevos.
- **R5.** No es del SQL, pero frena la publicación: la CI fallará con este
  catálogo hasta que entre el arreglo de la prueba de Inicio con fecha fija
  (`probar-web.mjs`, rama `claude/prueba-fecha-relativa-2026-11-21`), como dice
  el informe del montador. Además, la rama no lleva los PR #190 y #191 de
  `main`. Con `main` unido el SQL sale igual y el ensayo pasa, pero
  `auditar` y el ensayo final deben correr sobre la rama ya puesta al día.

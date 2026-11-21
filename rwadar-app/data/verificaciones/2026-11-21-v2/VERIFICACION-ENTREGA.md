# Verificación de la entrega 2026-11-21 (comprobación determinista)

Generado por `motor.mjs auditar 2026-11-21`. Compara el SQL que vieron los revisores con el de después de corregir.

**Veredicto:** EL SQL CAMBIÓ. Hace falta el auditor (agente) para ver que cada diferencia de abajo es una corrección pedida.

- SQL revisado (antes de corregir): `c7f994423f918cfd5c1a24e6e9822cc758cec2ab5491a19894c994a9d722fe5f` (es el que dio el montador).
- SQL final: `0486c6fd7104e93e1265f654d4870308b9b3abbf5e6dba0192bd26f8e8984d40`.
- Rehecho dos veces desde decisiones.json en una carpeta aparte: mismos SHA-256 las dos veces: sí; igual byte a byte a lo de la carpeta: sí.
- Mismo inventario de sentencias antes y después: sí (288 sentencias: 35 en alerta_fuentes, 25 en alertas, 69 en fuentes, 22 en ofertas, 107 en plataforma_fuentes, 25 en plataformas, 1 en revisiones).
- Sentencias que cambian (sin contar la revisión y la huella): 18.
  - rwadar_catalogo.ofertas 'spiko-letras-del-tesoro-euro' 'https://www.spiko.io/es/spiko-letras-del-tesoro-euro':
    - «» → «Comisión de gestión · 21/11/2026","valor":"0,25 %","fechaDato":null,"fechaConsulta":"2026-11-21","fuente":"https://data.spiko.io/eutbl/","alcance":"Visto en la fuente oficial el 21/11/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura."},{"etiqueta":"»
    - «; VL » → «. El último valor liquidativo, »
    - «» → «, es el que publica Spiko en su API»
  - rwadar_catalogo.ofertas 'spiko-letras-del-tesoro-dolar' 'https://www.spiko.io/es/spiko-letras-del-tesoro-dollar':
    - «; VL » → «. El último valor liquidativo, »
    - «» → «, es el que publica Spiko en su API»
  - rwadar_catalogo.ofertas 'robinhood-classic-stock-tokens' 'https://robinhood.com/eu/es/invest':
    - «» → « en inglés»
    - «posibles » → «el KID en español pone 0,00 % de entrada (errata). Posibles »
    - «» → «.»
    - «; el KID en español dice 0,00 % (errata)» → «»
  - rwadar_catalogo.ofertas 'mtbill' 'https://midas.app/mtbill':
    - «21» → «17»
    - «11» → «07»
  - rwadar_catalogo.ofertas 'aktionariat' 'https://shares.aktionariat.com/invest':
    - «» → « »
  - rwadar_catalogo.ofertas 'kraken-xstocks' 'https://eu.kraken.com/xstocks':
    - « consultada el 03/11/2026» → «»
  - rwadar_catalogo.ofertas 'vivienda-pluddemanngasse-101-graz' 'https://app.brickwise.at/desktopWeb/marketplace':
    - «» → «no consta que se comercialice en España y »
    - «si lo pides» → «según Brickwise, pedirlo»
    - «Brickwise, » → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - «participaciónes» → «participaciones»
  - rwadar_catalogo.ofertas 'vivienda-sonnleithnergasse-2-viena' 'https://app.brickwise.at/desktopWeb/marketplace':
    - «» → «no consta que se comercialice en España y »
    - «si lo pides» → «según Brickwise, pedirlo»
    - «Brickwise, » → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - «participaciónes» → «participaciones»
  - rwadar_catalogo.ofertas 'local-de-estanco-klagenfurt' 'https://app.brickwise.at/desktopWeb/marketplace':
    - «» → «no consta que se comercialice en España y »
    - «si lo pides» → «según Brickwise, pedirlo»
    - «Brickwise, » → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - «participaciónes» → «participaciones»
  - rwadar_catalogo.ofertas 'vivienda-stallhofstra-e-28-gratwein' 'https://app.brickwise.at/desktopWeb/marketplace':
    - «» → «no consta que se comercialice en España y »
    - «si lo pides» → «según Brickwise, pedirlo»
    - «Brickwise, » → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
  - rwadar_catalogo.ofertas 'vivienda-schwarzer-weg-18-graz' 'https://app.brickwise.at/desktopWeb/marketplace':
    - «» → «no consta que se comercialice en España y »
    - «si lo pides» → «según Brickwise, pedirlo»
    - «Brickwise, » → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
  - rwadar_catalogo.ofertas 'drautalresidenz-paternion' 'https://app.brickwise.at/desktopWeb/marketplace':
    - «» → «no consta que se comercialice en España y »
    - «si lo pides» → «según Brickwise, pedirlo»
    - «Brickwise, » → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
  - rwadar_catalogo.ofertas 'randhartingergasse-9-viena' 'https://app.brickwise.at/desktopWeb/marketplace':
    - «Mientras esté» → «Si sigue»
    - « » → «, puede »
    - «hay» → «haber»
    - «si lo pides» → «según Brickwise, pedirlo»
    - «Brickwise, » → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - «participaciónes» → «participaciones»
  - rwadar_catalogo.ofertas 'apartamento-vacacional-hinterstoder-50' 'https://app.brickwise.at/desktopWeb/marketplace':
    - «si lo pides» → «según Brickwise, pedirlo»
    - «Brickwise, » → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - «participaciónes» → «participaciones»
  - rwadar_catalogo.ofertas 'vivienda-pottendorfer-stra-e-62-wr-neustadt' 'https://app.brickwise.at/desktopWeb/marketplace':
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
  - rwadar_catalogo.ofertas 'fotovoltaica-greenpoint' 'https://app.brickwise.at/desktopWeb/marketplace':
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - «participaciónes» → «participaciones»
  - rwadar_catalogo.ofertas 'fotovoltaica-cohotel' 'https://app.brickwise.at/desktopWeb/marketplace':
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - «participaciónes» → «participaciones»
  - rwadar_catalogo.ofertas 'hausera-proximas-ofertas' 'https://hausera.io/oportunidades/':
    - «está abierta desde » → «abrió »
- Ensayo en PGlite: correcto, 18 comprobaciones y 6 casos de fallo.
- Escáner de secretos sobre lo que irá a Git: sin hallazgos.

## Hallazgos

Ninguno.

## Auditor

Auditor independiente: no monté, ni corregí, ni revisé esta entrega. 21/11/2026,
de 22:14 a 22:35 UTC. Sin tocar Supabase ni ningún servicio en línea, sin
publicar y sin commits. Mis guiones y salidas están fuera del repositorio, en
`<scratchpad>/auditor-21/`.

**Veredicto: conforme.** Cada diferencia del SQL sale de una corrección que
pidieron los revisores y están todas las obligatorias. El motor rehace lo mismo,
y el ensayo y el escáner de secretos salen limpios. Se puede seguir con el PR.

### 1. Lo que cambia en el SQL, mirado por mí

- La copia que vieron los revisores sigue intacta:
  `<scratchpad>/sql-revisado-2026-11-21/aplicar-y-aprobar.sql` da
  `c7f99442…fe5f`, igual que en el commit del montaje (`9b9ec4df`) y en el de
  las revisiones (`6234394b`).
- Lo comparé con un divisor de sentencias propio (no el del motor), que respeta
  comillas, `$…$` y comentarios. Solo igualé la revisión y la huella, que salen
  las mismas veces antes y después (287 y 2).
  - `aplicar-y-aprobar.sql`: 288 sentencias antes y después, en el mismo orden
    y con el mismo inventario: `begin`, la guarda, 1 en revisiones, 69 en
    fuentes, 25 en plataformas, 107 en plataforma_fuentes, 25 en alertas, 35 en
    alerta_fuentes, 22 en ofertas, la aprobación y `commit`. La cabecera, la
    guarda, la aprobación y todas las filas que no son de ofertas son iguales.
    Cambian 18 filas de `rwadar_catalogo.ofertas`, las mismas 18 que lista
    arriba el motor; las otras 4 (Smart Cash, Prosegur, Boss Info y
    Switzerlend) no cambian.
  - `catalogo.sql`: 286 sentencias y las mismas 18 diferencias, campo a campo.
    Sus 284 inserciones son idénticas, una a una, a las de
    `aplicar-y-aprobar.sql`.
- La guarda sigue exigiendo la publicada 94f7fd5d con su huella, el catálogo
  sin retirar y aplicarla del 21/11 al 28/11. No hay DDL, ni borrados, ni
  permisos; el único `update` es el de la aprobación.

Cada diferencia, campo a campo, y de dónde sale:

| Ficha | Qué cambia | Corrección |
|---|---|---|
| Spiko Letras Euro | Vuelve «Comisión de gestión», re-fechada: «· 21/11/2026», consulta del 21/11 y la nota pedida. Valor (0,25 %), fuente, fecha del dato y sitio en la lista, los de lo publicado | C3 (contenido) |
| Spiko Letras Euro y Dólar | «Estado de la oferta»: la VL del 20/11 se atribuye a la API de Spiko, no a GECO | recomendada R5 (contenido) |
| Robinhood | Nota de «Comisiones», con el texto exacto pedido | C6 (contenido) |
| mTBILL | La etiqueta vuelve a «… Condiciones Finales del 17/07/2026»; la nota y la consulta, como estaban | C1 (contenido y cumplimiento) |
| Aktionariat | El espacio que faltaba en «coincidencias. Registro» | S2 (SQL) |
| Kraken | La nota de «Salida» pierde «consultada el 03/11/2026» | C2 (contenido; es también la recomendada 7 de cumplimiento) |
| Las 8 de Brickwise con número fiscal | El aviso dice «según Brickwise, pedirlo con el asesor fiscal que te presenta no cuesta nada» | C2 (cumplimiento) |
| Plüddemanngasse, Sonnleithnergasse, Klagenfurt, Randhartingergasse, Hinterstoder, GreenPoint y Cohotel | «participaciónes» → «participaciones» en la nota del mínimo (2, 11, 16, 20, 5, 8 y 35) | S1 (SQL) = C5 (contenido) |
| Las 6 de brickwise-a | El aviso de la cuenta añade «no consta que se comercialice en España y» | recomendada 3 (cumplimiento) |
| Randhartingergasse | «Mientras esté vacía no hay repartos» → «Si sigue vacía, puede no haber repartos» | recomendada 6 (cumplimiento) |
| Las 11 de Brickwise | «Moneda» y «Plazo» sin «Cifra indicativa y variable…» (19 referencias; tres fichas no tienen «Plazo») | recomendada R7 (contenido) |
| Hausera | Nota del mínimo: la preventa «abrió el 18/11/2026» | C4 (contenido) |

No hay ninguna otra diferencia. Las cuatro recomendadas que entran (R5, R7, 3
y 6) están declaradas en INFORME-ENTREGA.md §8 y son el texto de los revisores.
Solo aclaran textos que ya entraban hoy, sin cifras ni fuentes nuevas, como
permite DECISIONES §6 («las recomendadas entran si solo aclaran un texto de la
entrega y el informe da su fuente de hoy»). Lo que añade la 3 ya lo dice el
«Acceso desde España» de esas 6 fichas: «no consta que esta emisión se
distribuya en España».

### 2. Las correcciones obligatorias, una a una

Cada una está en `decisiones.json` tal cual se pidió. Lo comprobé comparando
textos y objetos exactos: 35 comprobaciones, todas bien.

- **S1 y C5:** las 7 notas dicen «N participaciones»; «participaciónes» solo
  queda en `comprobar.ausentes`.
- **S2, C4 y C6:** los textos exactos.
- **C1 (contenido y cumplimiento):** el cambio ya no lleva la clave
  `etiqueta`; la nota y la consulta (21/11) siguen igual.
  `comprobar.ausentes` lleva «Condiciones Finales del 21/11/2026».
- **C2:** el `tarjetaFecha` de «Salida», idéntico al pedido y justo detrás del
  de «Acceso desde España».
- **C3:** el objeto `referencia` idéntico al pedido, y ya no está el
  `referenciaQuita`. El punto de `noAplicado` de «Gestión publicada» dice que
  «Comisión de gestión» se re-fecha.
- **C7 (no cambia el SQL):** el objeto idéntico en `transparencia.textos`.
  Además lo probé con `despues` en una carpeta aparte, sobre el catálogo
  sincronizado del ensayo. La casilla de Prosegur pasa de «solo para custodiar
  y transferir criptoactivos» a «solo para custodiar, tramitar órdenes y
  transferir criptoactivos». El `transparencia.json` que sale es igual al del
  ensayo del montador.
- **C2 de cumplimiento:** `plantillas.AVISO_NF` con el texto exacto, los 8
  `avisoNuevo` con la prueba de la revisión de cumplimiento y el texto viejo en
  `comprobar.ausentes`.

En los dos SQL finales ya no está ninguno de los textos que había que quitar:
«participaciónes», «coincidencias.Registro», «Condiciones Finales del
21/11/2026», «si lo pides con el asesor fiscal…», «está abierta desde el
18/11», «Kraken UE consultada el 03/11/2026», «dice 0,00 % (errata)» y
«Mientras esté vacía». Los nuevos salen las veces que tocan: por ejemplo, el
aviso nuevo del número fiscal, 8 veces.

### 3. El motor, ejecutado por mí

- **`motor.mjs preparar 2026-11-21 --repetir`** (22:20 UTC, en la carpeta del
  ciclo): salida 0, «mismos SHA-256 las dos veces».
  - `aplicar-y-aprobar.sql` `0486c6fd…4d40`, `catalogo.sql` `94aaacf6…213c` y
    `revision.json` `c245be3b…43a4`, con la revisión
    `508d0366-3c8e-8f9c-611d-bf49025a08d1`.
  - 425 cambios, 413 pruebas, 53 diferencias declaradas y 15 puntos no
    aplicados.
  - Son los mismos SHA-256 que da el corrector. Git no vio ningún cambio: lo
    que hay en la carpeta es justo lo que sale de `decisiones.json`.
- **`motor.mjs comprobar 2026-11-21`** (PGlite, 29 s): salida 0, «correcto»,
  18 comprobaciones y 6 casos de fallo, todos «falla y no deja nada». Solo
  cambió la hora `ejecutadoEl` de `pruebas-locales.json`, y la devolví a la del
  commit.
- **Rehecho también en una carpeta aparte** (`preparar --repetir` y `revisar`
  con `--salida`): los 9 archivos, `DIFF-ENTREGA.md` incluido, salen iguales
  byte a byte a los de la carpeta.

### 4. Secretos y nombres

- **gitleaks 8.30.1** (la versión de la CI), con `rwadar-app/gitleaks.toml` y
  las mismas opciones que la CI. Lo pasé sobre una copia exacta de lo que irá a
  Git: `git archive HEAD` más esta sección, 5.585 archivos. Resultado: «no leaks
  found». Tampoco encuentra nada en la carpeta del ciclo ni en la del SQL tal
  como están en Git.
- **Ojo al hacer el commit:** en el disco, la carpeta del ciclo tiene además
  172 copias en bruto (`crudo/` y `.html` de `grupos/` y
  `revision-independiente/`) en las que gitleaks sí marca cosas. Ninguna está
  en Git y todas las deja fuera el `.gitignore` del ciclo. No hay que añadirlas
  a la fuerza (`git add -f`).
- **Nombres:** no hay nombres de personas en los 14 archivos de la entrega (los
  13 del montaje y este).

### 5. Notas (no frenan)

- **C3, orden en la lista de cambios.** Entra con el objeto exacto, pero una
  posición más abajo en `decisiones.json`: detrás de quitar «Mínimo de
  inversión · consulta 01/11/2026», y no delante. Solo cambia el orden de las
  líneas del contraste. En el SQL y en la ficha, la referencia queda donde
  estaba en lo publicado, justo antes de «Estado de la oferta».
- **INFORME-ENTREGA.md, desfasado.** El §6 y el paso 2 del §7 dicen aún que
  `auditar` se pasó sin escáner de secretos. Ya se pasó con él, en la
  comprobación determinista y aquí, sin hallazgos. Conviene ponerlo al día al
  preparar el PR.
- **Antes de aplicar, lo de siempre:**
  - volver a leer como visitante: la publicada tiene que seguir siendo la
    94f7fd5d;
  - si Spiko publica VL nueva antes de aplicar (el lunes 23/11 por la tarde),
    rehacer sus cifras;
  - aplicar antes del 29/11.

## 9. Auditor del cambio de antes de aplicar (Schwarzer Weg 18)

Auditor independiente: no preparé ni corregí nada de esta entrega. 21/11/2026,
de 22:43 a 22:50 UTC. Sin tocar Supabase ni ningún servicio en línea salvo la
lectura de la API pública de Brickwise, sin publicar y sin commits. Mis guiones
y salidas están en `<scratchpad>/auditor-sw18/`, y la lectura de la API en
`<scratchpad>/auditor-sw18-api-224637/`.

**Veredicto: no conforme, por un solo hallazgo pequeño (H1).** El cambio de
cifras es exacto y no toca nada más, pero deja mal la hora de lectura que ve el
usuario en dos de esas cifras.

### 1. El motor, ejecutado por mí (sin `--escribir`)

Orden: `motor.mjs auditar 2026-11-21 --antes=<scratchpad>/sql-auditado-2026-11-21
--revisado=0486c6fd…4d40 --secretos=<scratchpad>/gitleaks/gitleaks
--exigir-secretos` (22:44 UTC). Salida 0. Lo que dio:

- La copia auditada sigue intacta: `aplicar-y-aprobar.sql` da `0486c6fd…4d40`,
  igual que en el commit `7ffe31a7` («copiaEsLaRevisada»: sí).
- Rehecho desde `decisiones.json`: reproducible y la carpeta igual a lo que
  sale de él.
- Mismo inventario: 288 sentencias (35 alerta_fuentes, 25 alertas, 69 fuentes,
  22 ofertas, 107 plataforma_fuentes, 25 plataformas, 1 revisiones).
- Una sola sentencia cambia: la oferta `vivienda-schwarzer-weg-18-graz`.
- PGlite: «correcto», 18 comprobaciones y 6 casos de fallo.
- Secretos: «sin hallazgos».
- SHA-256 final `1f892b7608789ce6410979b4158815c1c62ff4f112711430b47b68c73075e9bd`,
  el esperado. Revisión `753b4cc9-3c01-e879-ba96-05dc3cf95b05`.
- Hallazgos del motor: ninguno. Veredicto del motor:
  «sql_cambiado_falta_auditor» (por eso esta sección).
- Después, `git status` limpio: el motor no cambió nada en el disco.

### 2. Lo que cambia en el SQL, mirado por mí

Con un comparador propio, igualando solo la revisión y la huella (salen 288
veces la revisión y 2 la huella, antes y después; la huella nueva empieza por
la revisión nueva, como debe):

- `aplicar-y-aprobar.sql`: solo cambia la línea 308 (la oferta de Schwarzer
  Weg 18), con la misma longitud. La guarda, la aprobación y las otras 287
  sentencias son iguales.
- `catalogo.sql`: solo cambia la misma oferta (línea 280), con los mismos 7
  cambios. `revision.json`: solo cambian `revisionId` y `hash`.

Los 7 cambios de esa sentencia, uno a uno:

| Dónde | Antes | Después | Cifra de §9 |
|---|---|---|---|
| Mínimo de la tarjeta | Desde 71,90 € la participación en reventa (21/11) | Desde 71,00 € … (21/11) | mínimo 71,00 € |
| Venta más barata · 21/11/2026 | 71,90 € … (1 a ese precio, orden del 18/09/2026) | 71,00 € … (1 a ese precio, orden del 21/11/2026) | 71,00 €, 1 a ese precio, orden del 21/11/2026 |
| Orden de venta de menor importe | 1 participación a 71,90 € (72,98 € con el 1,5 %) | 1 participación a 71,00 € (72,07 € con el 1,5 %) | 1 a 71,00 €, 72,07 € con el 1,5 % |
| Participaciones en venta · 21/11/2026 | 297 | 298 | 298 |

En el SQL nuevo ya no queda «71,90», «72,98», «18/09» ni «297» en ninguna
parte. La mejor oferta de compra sigue en 62,00 €. Ninguna otra ficha cambia.

### 3. La copia del libro de órdenes de las 22:38

`grupos/brickwise-a/fuentes/libro-ordenes-resumen-2026-11-21-2238.json`:

- SHA-256 `298af8e9501f3527fa12cc0a5211271b24864522c8020c6983869a4fbeedd4f5`,
  el mismo que citan las 4 pruebas de `decisiones.json`. Está en Git
  (`7c7c7131`). Leída a las 22:38:58 UTC.
- Para AT0000A2WCE8 dice lo mismo que el SQL: venta más barata 71 (1
  participación, orden creada el 21/11/2026, actualizada 21:36:29 UTC); orden
  de menor importe 1 a 71 (72,07 con el 1,5 %); 298 en venta (v1 y v2);
  `lowestOfferPrice` 71; mejor compra 62.
- Las otras 10 fichas de Brickwise (5 en esta copia y 5 en la de
  `brickwise-b`) dan las mismas cifras que a las 17:42 UTC.
- Sin datos personales: miré todas las claves y todos los textos. No hay
  direcciones de cartera (`0x…`), ni identificadores de usuario, de orden ni de
  token (`offerId`, `assetId`, `tokenId`, UUID o cadenas hexadecimales largas:
  0 coincidencias), ni nombres de personas. Los únicos textos son la fuente, la
  nota, «bulletin», el estado de cada activo y los títulos de los 17 activos.
  Uno de ellos, «Oskars Hundehütte» (KTGG-0944, de prueba), es el título de un
  activo en la API, no una persona.

### 4. La API pública, leída por mí otra vez

`curl` a `https://api.app.brickwise.at/api/v1/assets` a las **22:46:37 UTC**
(200, SHA-256 `d983efc6…1a8f`) y a `https://api.app.brickwise.at/api/v2/assets`
a las **22:46:39 UTC** (200, `c625c2a2…04c7`). Para AT0000A2WCE8:

- Órdenes `status: open` y `type: sell`: 73, que suman **298** participaciones.
- La más barata sigue siendo **71,00 €**: 1 orden de 1 participación, creada a
  las 21:35:49 UTC y actualizada a las 21:36:29 UTC del 21/11/2026. Detrás:
  71,90 (1), 72,27 (1), 74 (25), 75 (1).
- La de menor importe: 1 participación a 71,00 €. Mejor compra: 62,00 € (1).
- v1 `availableBricksSecondary` 298; v2 `availableBricksSecondary` **298** y
  `lowestOfferPrice` **71**.

No ha cambiado nada desde las 22:38:58 UTC.

### 5. La cuenta de la comisión

71,00 × 1,015 = 72,065 exacto (7.100 céntimos × 1.015 / 1.000 = 7.206,5
céntimos). Redondeado al céntimo con 0,005 hacia arriba, como en el resto del
catálogo (99 → 100,49): **72,07 €**. `comprobarCalculo` del motor da 72,07 y
rechaza 72,06.

### 6. Hallazgo

**H1 · la hora de lectura de dos cifras ya no es verdad.** En la ficha, dentro
de «Ver los datos consultados y sus fechas», la «Venta más barata» y la «Orden
de venta de menor importe» llevan el alcance `{{LIBRO}}`: «Libro de órdenes de
la app de Brickwise leído el 21/11/2026 (17:41–17:42 UTC)…». Pero sus cifras
nuevas (71,00 € y 72,07 €) salen de la lectura de las 22:38:58 UTC, y esa
orden no existía a las 17:42: se creó a las 21:35 UTC. El usuario lo ve en la
ficha (`rwadar-fichas.js` pinta el alcance). Solo afecta a esas dos cifras: la
mejor compra (62,00 €) sí estaba a las 17:42, y «Participaciones en venta» no
dice hora.

Arreglo propuesto, en `decisiones.json`, solo en esas dos referencias de
Schwarzer Weg 18: cambiar el alcance para que diga la hora buena, por ejemplo
«Libro de órdenes de la app de Brickwise leído el 21/11/2026 (22:38 UTC) en los
datos que usa la app; ninguna página pública enseña las órdenes una a una.
Cambia a diario.» (y en la de menor importe, seguido de `{{BW_MENOR}}`).
Rehacer con el motor y volver a pasar `auditar`.

Todo lo demás que pedía comprobar está bien: las cifras, la copia, la API y la
cuenta.

### 7. Arreglo de H1 (coordinador, 22:52 UTC)

Se hizo el arreglo propuesto, solo en esas dos referencias de
`decisiones.json`: el alcance dice «Libro de órdenes de la app de Brickwise
leído el 21/11/2026 (22:38 UTC)…» (y, en la de menor importe, sigue
`{{BW_MENOR}}`). `motor.mjs auditar` frente a `0486c6fd…4d40`: salida 0, mismo
inventario (288), «sql_cambiado_falta_auditor» con una sola sentencia cambiada
(Schwarzer Weg 18: 71,90 → 71,00, orden del 18/09 → 21/11, 72,98 → 72,07,
297 → 298 y la hora 17:41–17:42 → 22:38 en esos dos alcances), PGlite
«correcto» (18 y 6), secretos «sin hallazgos», 0 hallazgos del motor. Con H1
arreglado no queda nada de este hallazgo. Revisión `fe0cfaa8-9682-b729-69e2-9bb4f8587ce9`, SQL `e9a671b3ab43ca5b650dc709b6875dbe18fe732eeb85ae31baff64a3eb1c3206`.

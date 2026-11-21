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

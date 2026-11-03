# Investigación del catálogo de RWAdar · inicio manual

Vigente desde el 22 de octubre de 2026. Encargo de Víctor: investigar en
profundidad las ofertas actuales y nuevas y publicar un catálogo de calidad
con tarjeta e imagen editorial realista. Por su indicación posterior del mismo
día, la tarea queda **preparada y PAUSADA, con inicio manual**: Víctor debe
pulsar **Ejecutar** o pedir **«haz la investigación»**. La programación anterior
de las 09:00 deja de iniciar trabajo por sí sola. No reactivar la tarea ni
programar otra ejecución sin una nueva indicación expresa.

Cada inicio manual abre un solo ciclo. Investigar con profundidad y completar
las revisiones sin una hora límite artificial. Las comprobaciones y cualquier
publicación autorizada se realizan cuando concluyan las compuertas. No hay
cuota de altas ni de cambios: una investigación sin novedades verificables
puede terminar sin publicar.

La decisión diaria por candidata es binaria: **admitida y publicada tras las
compuertas**, o **no admitida y no publicada hoy**. No se crea una categoría ni
estado público «en investigación», ni una cola editorial persistente de
candidatas pendientes. Se conserva el expediente interno histórico para
trazabilidad; en el siguiente inicio manual se investiga de nuevo desde fuentes
vigentes y se decide de nuevo, sin arrastrar aprobaciones.

El inicio manual habilita la investigación de ese ciclo; **no concede una
autorización recurrente autónoma** (nada se programa por horario). Desde el
03/11/2026 (indicación expresa de Víctor), **su orden de investigar o
actualizar el catálogo es el permiso expreso de ese ciclo** para aplicar el SQL
revisado con «Aplicar catálogo», publicar preview y producción con «Publicar
web» y enviar la OTA con «OTA Android», siempre tras las revisiones y
compuertas. No abarca cuentas, comunidad, políticas o funciones, credenciales,
correo, pagos, `eas build`/`eas submit`, tiendas, cambios de visibilidad ni
activaciones de servicios. Una tarea que necesite esas
operaciones se deja pendiente y se explica por separado. No ejecutar una
migración general ni un `db push` como parte del ciclo.

**Varias entregas el mismo día** (indicación de Víctor del 03/11/2026). No hay
límite de una por día. La primera lleva la fecha (`AAAA-MM-DD`) y las
siguientes `AAAA-MM-DD.2`, `.3`… en las carpetas `verificaciones/<etiqueta>-v2/`
e `importaciones/catalogo-<etiqueta>-v2/`. `npm run catalogo` elige sola la
siguiente etiqueta libre y parte de la revisión publicada en la última
sincronización. El SQL de cada entrega exige que la publicada sea exactamente
la anterior, así que dos entregas no se pisan. El flujo de GitHub «Aplicar
catálogo» recibe la etiqueta. Las cifras de cada ficha valen 7 días desde su
consulta (`vigenciaDias`).

## 1. Preparar la revisión y leer lo publicado

1. Leer `AGENTS.md`, la entrada vigente de `PARA-CODEX.md`, `INTERNO.md` y la
   sección necesaria de `RUNBOOK.md`. Confirmar rama, cambios compartidos y
   autorización. `git status --short --branch` antes y después de generadores.
   Ejecutar `node rwadar-node-seguro.js`. Si no confirma el parche de
   seguridad de Node del 21/10/2026, el ciclo sigue igual, pero el resumen del
   día empieza avisando a Víctor de que actualice Node, con el mensaje que
   muestra.
2. Leer, sin mutar, el lote público actual y su manifiesto: revisión, fecha,
   cantidades y distribución por colecciones. Guardar esa identidad y la hora
   como precondición del SQL. No suponer que Git describe lo que está en línea.
3. Crear el expediente del día bajo
   `rwadar-app/data/verificaciones/AAAA-MM-DD-v2/`. Conservar las fuentes de la
   revisión anterior; nunca sobrescribir una fecha histórica para fingir una
   consulta nueva. Registrar el inventario completo de fichas que se revisará.
4. Conservar el catálogo público completo mientras se investiga. Un fallo de
   red o una revisión caducada produce un aviso y oculta cifras vencidas; no
   vacía tarjetas ni elimina plataformas. Una retirada necesita una fuente
   citable y una decisión editorial explícita.

## 2. Investigar cada oferta, también las ya publicadas

La captura y las expresiones de `comprobaciones-fuentes.json` son una base de
transporte y contraste. **69/69 fuentes correctas no demuestra una investigación
en profundidad**. En el corte inicial hay 69 fuentes del radar; el inventario
debe crecer con las fuentes necesarias para nuevas fichas. También hay que
leer las fuentes particulares de todas las ofertas, documentos y registros.

Cada ficha tiene un expediente por slug en `expedientes/`, con una matriz
de evidencias que permite reconstruir cada afirmación publicada:

| Campo o afirmación | Literal breve | Fuente primaria y localizador | Fecha del dato | Consulta | Alcance, límites y conflicto |
|---|---|---|---|---|---|
| Ejemplo: mínimo | Texto exacto imprescindible | URL HTTPS; documento, versión y página/sección | Fecha o «no consta» | Fecha y hora con zona | Moneda, clase, mercado, residencia y discrepancias |

Registrar además el título del documento, emisor, entidad legal, jurisdicción,
ISIN o identificador del producto cuando exista y el hash de los documentos
conservados. No copiar documentos restringidos o datos personales al sitio.
El literal se conserva corto; el texto de la tarjeta se redacta con sus límites.

Para **cada oferta actual y cada candidata**:

- Leer la ficha oficial completa y sus condiciones vigentes. Abrir el folleto,
  KID/KIID, documento de emisión, términos de token y tarifas cuando apliquen.
  Volver a comprobar versión y fechas del PDF relevante: una URL estable puede
  servir un documento nuevo o antiguo. Guardar página y sección exactas.
- Triangular la entidad que comercializa, el emisor, el vehículo, el token y
  el derecho adquirido. Consultar directamente el registro regulador aplicable
  y su alcance; una licencia de la entidad no acredita cualquier producto,
  rentabilidad, distribución en España o protección del inversor.
- Acreditar acceso desde España, restricciones y elegibilidad, mínimo y moneda,
  comisiones de entrada/gestión/salida, custodia y titularidad, mecanismo de
  salida, liquidez, plazos, estado de la emisión, agotamiento/cierre y riesgos.
  Distinguir mercado primario, reventa y mera referencia documental.
- Para precios y rendimiento: anotar fecha del dato y de consulta, base de
  cálculo, plazo, divisa, clase, bruto/neto, histórico/objetivo/variable y fuente
  que respalda exactamente la cifra. No deducir una cifra de una imagen ni
  convertir una expectativa en rendimiento disponible.
- Contrastar cambios y conflictos entre portada, contrato, folleto, API,
  registro y documento del activo. Explicar la discrepancia; no elegir la
  cifra más atractiva ni renovar su fecha por descargar otra página.
- Si el script queda bloqueado, abrir la fuente con navegador y leerla. Si no
  se puede acceder, registrar el bloqueo, el último dato realmente comprobado
  y la incertidumbre. No marcar «consultada hoy» una fuente que no se leyó.
  La portada, un buscador, un resumen de IA o una coincidencia de regex no
  sustituyen el documento primario.

Una candidata sin datos esenciales citables **no se admite ni se publica hoy**.
Su expediente puede conservar la razón fechada de esa decisión, sin convertirse
en una cola de publicación pendiente. Una ficha existente con datos no renovados conserva su
información documental y avisos, pero pierde las cifras que ya no pueden
sostenerse. No inventar una renovación completa porque el script terminó.

Un agente distinto revisa el expediente y las fuentes de **cada alta y cada
cambio crítico**: cifras, acceso, licencia, derecho/token, comisiones, custodia,
salida y estado de apertura/cierre. Debe dejar su conclusión, hechos comprobados
y bloqueos concretos. No basta con contar comprobaciones, pasar un porcentaje
o declarar satisfacción sin evidencias.

## 3. Preparar datos e imágenes completos

La fuente de verdad pública es Supabase. Los datos se preparan en el expediente
y el lote editorial; no se añaden manualmente al HTML ni a los arrays del JS.

Como punto de partida de captura y preparación, desde la raíz:

```powershell
npm run catalogo -- --fecha=AAAA-MM-DD
```

Revisar el informe, contraste y cambios que produce. La salida del script no
sustituye el expediente de la sección anterior ni autoriza por sí sola una
publicación. Tras completar la investigación manual, volver a montar y probar
el lote con las utilidades existentes:

```powershell
node rwadar-app/montar-revision.mjs AAAA-MM-DD[.N]
node rwadar-app/comprobar-revision.mjs AAAA-MM-DD[.N]
```

Cada alta se incorpora al manifiesto editorial explícito
`manifiesto-catalogo.json`, a las ofertas, documentación, fuentes e imágenes del
mismo corte. El importador sigue validando cantidades y colecciones **exactas**;
no deduce que un fichero truncado sea un nuevo catálogo. Comprobar que el
generador toma la revisión deseada antes de ejecutarlo, especialmente si hay
otras herramientas trabajando en la misma carpeta.

Cada nueva ficha exige revisar y añadir su ruta literal exacta en
`rwadar-fichas-manifiesto.js`. El generador y el publicador conservan esta lista
cerrada: validar un lote mayor no autoriza automáticamente rutas nuevas.

Para la imagen de cada alta o cambio visual:

- Definir la escena a partir de las fuentes del activo y su lugar; producir una
  ilustración realista sin marcas falsas, texto inventado ni promesas de valor.
  No presentar una imagen generada como fotografía del activo.
- Mantener `rwadar-editorial-source/ofertas/fichas.json`, `fotos.json` y la foto
  maestra por slug. Generar mediante el flujo editorial documentado en su
  `README.md`; conservar dimensiones, tamaños, SHA y manifiesto de salida.
- Revisar personalmente la imagen nueva completa y el recorte de **tarjeta y
  detalle**, en móvil y escritorio: activo/lugar coherentes, rótulo editorial,
  texto legible, sin solapes ni errores visibles. Un segundo agente inspecciona
  cada imagen nueva y los casos de conflicto. Corregir antes de publicar.
- El texto alternativo opcional `documentacion.imagenEditorialAlt` admite
  20–400 caracteres. El cliente añade la identificación de ilustración generada
  con IA. Una oferta nueva usa únicamente la ruta editorial canónica
  `https://rwadar.pages.dev/ofertas-editoriales/oferta-<slug>.webp`; no recibe
  URLs de imagen arbitrarias de la API. Mantener los fallback de categoría.

## 4. Publicar y comprobar las imágenes antes de activar el SQL

Una fila aprobada aparece inmediatamente en las vistas públicas y los clientes
pueden aceptarla antes de desplegar la web. Por eso **no ejecutar todavía
`aplicar-y-aprobar.sql`**. Una imagen preparada en disco, una preview o un HEAD
no prueban que la URL canónica de producción entregue esa imagen.

Primera preparación, una sola vez: publicar por el publicador normal (preview,
revisión y producción, con sincronización) el soporte web de altas canónicas y
de enlaces estáticos limitados al snapshot desplegado, conservando el lote
público anterior. No utilizar la precarga para introducir ese JavaScript.
Hasta comprobar ese despliegue no está operativo el ciclo ampliado.

Además, antes de admitir más de 49 ofertas, `releases/latest` de
`RWAdar-downloads` debe señalar **Android 1.4.0 o posterior**, con el APK, las
sumas y su evidencia de QA publicados y revisados. La herramienta comprueba la
release pública y las identidades SHA-256 de esos recursos. La versión 1.3.2
no supera esta guarda: una instalación limpia no puede aceptar el lote de 50.
Mientras latest siga en 1.3.2, conservar 49 y no activar altas. Esto no autoriza
compilar ni publicar una app dentro de la tarea diaria.

Ejecutar el ciclo bajo **exclusión de despliegues y rollbacks**: ninguna otra
herramienta debe publicar, precargar ni volver a una producción anterior desde
el sellado hasta el cierre. El sello registra el ID del despliegue de producción;
la herramienta lo contrasta antes de precargar y compara luego el ID de su
propio despliegue antes de verificar y activar SQL. Un cambio observado detiene
el proceso. Usa el API canónico si ya tiene credenciales vigentes en el proceso;
en otro caso utiliza Wrangler 4.125.0 con su sesión OAuth actual, sin leer
archivos de credenciales ni solicitar tokens nuevos. La salida JSON de Wrangler
identifica el último despliegue de producción terminado, **no prueba por sí sola
el destino canónico tras un rollback externo**. Si hay duda o no se puede
garantizar la exclusión, detenerse y comprobar `canonical_deployment` mediante
el API antes de continuar. Los chequeos de identidad no son una transacción
atómica con Cloudflare y SQL.

Antes de los generadores de cada lote, conservar en una carpeta de evidencia
`rwadar-entrega-<fecha>/base-diaria/artefacto` una copia del artefacto de la
última producción comprobada, incluidos `_headers` y `_redirects`. No copiar
un build de la candidata. Con el árbol limpio y la revisión vigente aprobada:

```powershell
node rwadar-precargar-imagenes.js --sellar --base=rwadar-entrega-<fecha>/base-diaria
```

El sellado contrasta por GET todos los recursos públicos con
`https://rwadar.pages.dev`, exige el comportamiento web aprobado actual y
guarda el inventario SHA-256 cerrado en `sello.json`. Un build que aún no esté
en producción falla esa comparación. La configuración se compara además con
la fuente aprobada. No sobrescribir el sello ni regenerar dentro de esa copia.

Preparar las WebP nuevas en
`rwadar-editorial-source/ofertas/precargas/<id-lote>/oferta-<slug>.webp` y añadir
un lote literal a `precargas/manifest.json`. Cada lote declara `id`,
`baseSha256` (del sello), `revisionAnterior` pública exacta, dos `revisores`
distintos y `imagenes`. Cada imagen declara `slug`, `archivo` literal completo,
`bytes`, `sha256`, `ancho:960`, `alto:660` y `alt` editorial de 20–400 caracteres.
Las imágenes deben pasar la revisión propia y la independiente de tarjeta y
detalle; copiar una imagen ajena a la candidata para superar el hash no cumple
esa revisión. Los nombres, cantidades y hashes son revisables en Git. No se
aceptan enlaces, archivos extra, rutas arbitrarias ni sustituciones de imágenes
ya publicadas. No hace falta reconstruir el APK para este paso.

Consolidar estos archivos y la aprobación del contenido concreto antes de la
precarga; las mismas compuertas Git, legales y de publicación se mantienen:

```powershell
node rwadar-precargar-imagenes.js --comprobar --base=rwadar-entrega-<fecha>/base-diaria --lote=<id-lote>
node rwadar-precargar-imagenes.js --produccion --base=rwadar-entrega-<fecha>/base-diaria --lote=<id-lote>
node rwadar-precargar-imagenes.js --verificar --base=rwadar-entrega-<fecha>/base-diaria --lote=<id-lote>
```

La precarga publica exclusivamente la base sellada más las WebP del lote:
HTML, JavaScript, CSS, service worker y configuración conservan todos sus
bytes. Su salida queda en evidencia separada, sin sustituir `rwadar-publicado`.
Verifica el catálogo público completo con el sincronizador en un directorio
temporal, exige que aún coincida con la revisión anterior y comprueba de nuevo
los recursos de producción tras desplegar. Nunca usa ni habilita un
`--sin-sincronizar` remoto. Repetir la verificación inmediatamente antes de
activar SQL y adjuntar su evidencia al inventario del SQL. Si cambia el lote
público, la base o una imagen, detenerse y revisar otra vez.

Sólo después de GET 200, MIME WebP, bytes y SHA exactos de **cada imagen nueva**
y revisión visual de esas URLs públicas se puede ejecutar la activación SQL.
Un fallo anterior deja las candidatas **no admitidas y no publicadas hoy**; las
imágenes precargadas no son fichas admitidas ni aparecen en el catálogo anterior.
Nunca borrar ni sustituir precargas en un reintento. El publicador normal
incluye también las imágenes de este registro para conservarlas tras el
despliegue definitivo.

No hay rollback automático de esta herramienta. Ni siquiera antes de activar
SQL se puede restaurar una base por suposiciones: cualquier recuperación manual
necesita comprobar que la revisión pública sigue siendo exactamente la anterior
y que producción sigue siendo el ID de **nuestra** precarga. Si otra herramienta
publicó entre medias, detenerse y reconciliar sus recursos. Después de activar
SQL, conservar siempre el lote nuevo y las imágenes; reparar hacia delante.

## 5. Revisar el SQL de forma independiente

Una segunda revisión debe comparar `catalogo.sql`, `aplicar-y-aprobar.sql`,
`revision.json`, fuentes y expedientes. Inventariar **todas** las sentencias y
tablas afectadas, no solo buscar palabras en el texto del SQL.

El lote diario solo puede insertar datos editoriales de la revisión nueva en
`rwadar_catalogo` y aprobar esa revisión. Debe conservar el historial y el
catálogo anterior. No puede modificar usuarios, Auth, RLS, ACL, funciones,
esquema, capacidades, servicios ni credenciales. No incluir en este flujo la
migración de comunidad preparada en el repositorio.

Antes de aplicar:

1. Probar en PGlite la carga inicial y repetida (idempotencia), completitud y
   aprobación. La importación técnica sin aprobar conserva el lote público
   anterior y solo la revisión
   completa aprobada puede sustituirlo. Contrastar cantidades, colecciones,
   slugs, documentación y cifras con el manifiesto y los expedientes.
2. Registrar SHA-256 del SQL final y el inventario de mutaciones. Una edición
   posterior invalida esa revisión y sus pruebas hasta repetirlas.
3. Volver a leer la revisión pública inmediatamente antes de aplicar. Usar una
   transacción con aislamiento serializable y una guarda que compare la
   revisión anterior exacta. Si cambió por otra herramienta, detener ese lote,
   reconciliar y volver a revisar; no aprobar sobre un estado supuesto.
4. Comprobar otra vez la evidencia de precarga y las imágenes canónicas en
   producción, con el catálogo público todavía en la revisión anterior.
   Aplicar exclusivamente los bytes revisados mediante el acceso autorizado,
   sin recuperar tokens antiguos ni copiar claves a la documentación. Ante
   error de transacción no continuar con una aprobación separada.
5. Leer después, como público, las vistas V2: revisión, fechas, cantidades,
   colecciones y cada dato crítico cambiado. El éxito local o del comando SQL
   no acredita por sí solo el estado remoto. Guardar esta comprobación.

El SQL de catálogo revisado lo autoriza la orden de Víctor que abrió el ciclo. Una necesidad de ampliar el esquema o tocar otra área se presenta aparte.

## 6. Comprobar web, clientes y publicar

El contrato de lectores V2 admite ampliación explícita con
`permitirAmpliacion:true`. Todas las filas deben declarar el mismo lote,
fecha/vigencia y manifiesto, y sus cantidades reales deben coincidir. Límites
del lector: **256 plataformas y 1000 ofertas**. Desde el 02/11/2026 (Víctor)
no hay mínimo respecto del lote anterior: el catálogo puede crecer o reducirse
cuando la revisión lo decida. Lo que se exige es que el lote coincida
exactamente con su propio manifiesto (filas y colecciones), así que un truncado
sigue rechazándose.

Las vistas V2 ya usan los conteos declarados y permiten que una oferta tenga
un proveedor distinto de las 26 plataformas canónicas. Añadir una oferta no
exige añadir su proveedor al radar ni cambiar la estructura SQL. Esto se prueba
localmente con una revisión de 50 ofertas y proveedor nuevo; no equivale a
haber aplicado o comprobado cualquier lote futuro en producción.

```powershell
node rwadar-app/sincronizar.js
node rwadar-editorial-source/ofertas/generar.mjs --comprobar
npm test
npm --prefix rwadar-app run auditar:relanzamiento
```

El sincronizador escribe solo después de validar el lote completo contra su
manifiesto. Ante una respuesta parcial conserva los archivos anteriores y
devuelve error.

Revisar el diff completo, las fichas/portadas generadas, las rutas de cada alta
y los snapshots. Actualizar las evidencias y el estado de aprobación del corte
real conforme a la compuerta, sin inventar pruebas ni rebajar guardas. Consolidar
los cambios revisados con autoría propia de la herramienta y sin secretos antes
de desplegar: el publicador exige que la sincronización no deje diferencias.

```powershell
node rwadar-publicar.js --preview
```

Abrir la preview en navegador real de escritorio y móvil. Verificar el conjunto
completo y especialmente altas/cambios: catálogo, filtros, tarjeta/detalle,
fichas indexables, enlaces oficiales, imagen y rótulo, texto alternativo,
metodología y aviso de vigencia. No iniciar sesión ni enviar formularios como
parte de una comprobación pública. Si hay fallo, corregir, repetir las pruebas
afectadas y revisar otra preview del mismo corte.

Tras aprobar la preview y comprobar que el corte y el lote no cambiaron:

```powershell
node rwadar-publicar.js --produccion
```

Verificar las URLs públicas sin autenticación y contrastar recursos/contenido
con el corte revisado. Conservar prueba HTTP y revisión visual de cada imagen
nueva y de los cambios críticos. **Una publicación web no actualiza el APK
instalado**: registrar qué versión móvil puede consumir el catálogo ampliado
y sus imágenes; la app publicada anterior puede seguir con su último lote
completo. El ciclo diario no compila ni publica una app.

## 7. Cerrar con evidencia y decisiones del día

Guardar un informe fechado con expedientes revisados, consultas/limitaciones,
cambios aceptados y descartados, manifiesto, identidad del lote, SHA del SQL,
revisor independiente, pruebas, comprobación remota, preview, producción y
revisión de imágenes. Diferenciar «preparado», «probado localmente», «aplicado
en Supabase» y «publicado y comprobado». Añadir el traspaso arriba de
`PARA-CODEX.md`; mantener `INTERNO.md` en lenguaje llano, sin hashes ni IDs.

Si falta una evidencia esencial, no hay acceso o falla una compuerta **antes de
activar SQL**: conservar el último catálogo completo y cerrar cada candidata
afectada como **no admitida y no publicada hoy**, indicando el motivo concreto
en su expediente histórico.
No dejarla «en investigación» ni con una aprobación pendiente para mañana.
La siguiente ejecución manual vuelve a consultar las fuentes vigentes y toma
una decisión nueva. El inicio manual no convierte una investigación incompleta
en una publicación válida ni autoriza otra ejecución por horario.

**Después de activar SQL**, el lote nuevo ya es público. Si falla la preview o
el despliegue definitivo, conservar ese lote completo (por ejemplo, 50 o más
ofertas) y todas las imágenes precargadas. No volver a 49, no borrar imágenes
ni retirar el catálogo para fingir una decisión de no admisión. Registrar el
incidente y reparar hacia delante hasta comprobar el despliegue definitivo.
Los clientes compatibles continúan mostrando las nuevas tarjetas con la imagen
canónica precargada y su diálogo; el enlace a una página estática nueva sólo
aparece cuando esa página pertenece al snapshot desplegado. Cerrar el día con
el estado real y la evidencia del incidente; no declarar el despliegue final
completado hasta verificarlo.

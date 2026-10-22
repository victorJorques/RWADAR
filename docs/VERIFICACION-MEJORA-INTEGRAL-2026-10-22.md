# RWAdar · interfaz, catálogo y ciclo diario · 22/10/2026

## Alcance y estados comprobados

Trabajo posterior a la publicación de Android 1.3.2 y de la web desde main.
Se integró la reorganización de Claude desde su rama de interfaz y se repararon
los problemas encontrados al usarla. Este informe distingue el contenido local,
los datos ya aplicados, las previews y las entregas públicas. Las secciones de
publicación se completan solo cuando exista la comprobación remota.

## Catálogo aplicado

El lote público es `349df4ef-97a2-db57-841f-a2f5114a6837`, fechado el 22/10,
vigente hasta el 29/10: 26 plataformas, 4 descartes y 49 referencias, distribuidas 24/21/4.
Se capturaron 123 URL; las 69 fuentes del radar pasaron su contraste. Este recuento
no sustituye una investigación documental profunda de cada oferta.

El SQL aplicado tiene SHA-256
`13791c8f0a8e0fe239cbf7728a7a4cba1b7ada1710acf9319b0c51cd5bd9a181`.
Una revisión independiente comprobó las siete tablas editoriales afectadas,
la aprobación y la ausencia de DDL, cambios de cuentas, Auth o privilegios.
Se probó en PGlite dos veces y se aplicó en transacción serializable con guarda
de revisión anterior. La lectura posterior y la sincronización pública confirman
26/49 y el lote nuevo. IOD está cerrado; Spiko muestra 2,36 % observado hoy y
mF-ONE 7,43 % con su ventana de rendimiento. Los bloqueos de Midas identificados
en el informe del lote no se transforman en datos comprobados.

## Interfaz y datos de decisión

- Web: detalle acotado a la altura visible, cabecera y cierre accesibles,
  desplazamiento propio y foco/retorno conservados. Se probó a 320/390/768/844/1440 px.
  Se corrigieron búsqueda transversal de Reventa, cabecera intermedia sin wrap,
  puntos fuera del radar y la columna omitida de acceso «Sin comprobar».
- App: SafeArea en los cuatro bordes, título completo dentro del scroll,
  controles persistentes y foto de detalle completa. Texto de lectura de 16 px,
  título de 20, proveedor de 14, valores de 15 y navegación de 13, respetando la escala del sistema.
  Se limita el radar incluyendo halo y trazo y se resuelve el toque por el centro
  visible más cercano cuando se solapan las cajas. La comprobación física del
  nuevo APK se acredita por separado; las pruebas del modelo no la sustituyen.
- Tarjetas y fichas: mínimo en euros, España, salida y costes con fuente/fecha
  cuando están documentados. No se convierten divisas ni gramos, ni se usa el
  precio por token como mínimo. Todas las49fichas conservan España desconocida
  en este corte: una licencia europea o el país del activo no acreditan admisión.
  Se distinguen revisión editorial, consulta de la fuente y fecha del dato.
- Agrupación por proveedor dentro de cada colección, con acceso a todas las
  fichas y búsqueda individual. No se suman mínimos, retornos ni condiciones.
  El orden conserva independencia de pagos y rentabilidades.

## Páginas, novedades y orden del código

Hay 49 páginas permanentes de oferta, 26 de plataforma y 4 de descarte, además de
metodología, cambios y RSS: 82 rutas explícitas. Sitemap y canonical propios,
JSON-LD descriptivo sin Offer/Product/precios y fuentes con fechas separadas.
Las cifras iniciales no se presentan como vigentes sin ejecutar la guarda de
fecha; también se reevalúan al regresar a la pestaña y mientras permanece abierta.

Los generadores rechazan un snapshot parcial o mezclado, validan el manifiesto
V2 y exigen una whitelist literal revisada para nuevas páginas. Los lectores web
y Android admiten crecimiento completo hasta 256 plataformas/1000 ofertas y recuerdan
el último manifiesto para impedir una regresión por truncado, también al reiniciar.
Las imágenes de futuras altas usan exclusivamente el origen y la ruta editorial
canónicos; tienen identificación de IA, alt y fallback local.

La lógica editorial común se extrajo a un helper compartido por web y app.
El snapshot generado del catálogo se separó del código de comportamiento en
`assets/catalogo-publico-20261022.js`: los tres arrays permanecen en una sola
copia derivada de Supabase, cargada antes del comportamiento y conservada para
el uso sin conexión. Los lectores lo analizan con Acorn sin ejecutar datos;
se comprueba identidad, contenido y huella después de publicar.
Las tres tipografías WOFF2 se guardan una sola vez, con huella, y se reutilizan
desde portada, Academy y fichas. Se comprobaron los bytes originales y publicados:
el publicador trata las fuentes como binarios. `probar-orden.mjs` verifica la
lista cerrada, integridad, ausencia de enlaces privados y campos comerciales
no autorizados y los presupuestos de tamaño. La división restante por funciones
del JS/CSS y de la suite web sigue siendo trabajo de arquitectura posterior,
sin atribuirla a esta extracción. Se conservan los históricos e informes
protegidos por AGENTS; las propuestas de borrarlos en 5S no se aplican.

## Seguridad

El callback web no muestra error_description remoto crudo y confirma la identidad
antes de adoptar una sesión de enlace. Comunidad conserva los interruptores OFF.
Su refuerzo de sesión, enlaces en autor y peso de denuncias está probado localmente,
64/64; la migración NO se aplicó. Aplicarla abriría un servicio fuera del alcance
editorial. Detalle y límites en
`VERIFICACION-SEGURIDAD-COMUNIDAD-2026-10-22.md`.

Turnstile y la allowlist real de Auth siguen pendientes de inventario y configuración
del titular. Activar CAPTCHA global requiere integración compatible web/Android;
no se afirma que esos controles estén ya activados ni que se hayan probado altas,
recuperaciones, correo o bajas reales en el nuevo APK.

## Español e inglés

La interfaz dispone de selector ES/EN con preferencia local persistente. Motor
y diccionario son compartidos, con copias web idénticas comprobadas por la suite.
Solo se traducen frases de interfaz revisadas y plantillas explícitas: se
conservan nombres, valores, fechas, URL, campos del usuario y documentos
financieros originales, identificados en inglés cuando permanecen en español.
Las páginas canónicas continúan siendo las rutas reales existentes; no se
publican rutas inglesas ni hreflang ficticios.

Móvil: fuente congelada en `3af2033`, suite final 233/233 y comprobación de
integración Expo/Metro correcta. El candidato 17 se canceló por un cambio
durante la preparación del archivo. El candidato 18 utiliza el corte posterior
consolidado. La QA nativa debe comprobar ES/EN y su persistencia tras reiniciar,
con el mismo APK; las pruebas de fuente no se presentan como esa comprobación.

Web: la revisión local recorre ES a EN y de vuelta, cinco tamaños de pantalla,
fichas y páginas independientes, datos originales, filtros, foco y guardados.
Las comprobaciones de preview y producción se añaden tras publicar. El vídeo
precede a esta integración de idiomas y mantiene su alcance en español.
Mantenimiento y límites en `tareas/IDIOMAS-ES-EN.md`.

## Ciclo diario activo

Tarea `rwadar-investigaci-n-y-publicaci-n-diaria`, nombre
«RWAdar · investigación y publicación diaria», ACTIVE, guardada en la aplicación
y verificada en su configuración. Todos los días a las 09:00 de la hora local del PC,
con autorización expresa de Víctor para ese modo tras conocer la limitación para
fijar una zona. El equipo usa Europe/Warsaw, que coincide con Madrid según las
reglas consultadas; si se cambia la zona, hay que reajustar la programación.
El equipo y la aplicación deben seguir encendidos.

El encargo exige documentos primarios, registros, matriz por afirmación,
fechas y conflictos, revisión independiente de altas/cambios críticos y de sus
imágenes, SQL limitado, preview y producción comprobadas. Sin cuotas de altas.
Decisión binaria: entra y se publica tras las compuertas, o no entra hoy.
No existe una cola ni categoría pública «en investigación». Mañana se investiga
de nuevo. El expediente histórico se conserva como evidencia, sin arrastrar una
aprobación. Procedimiento en `tareas/CICLO-DIARIO-CATALOGO.md`.

## Pruebas y entregas

Todos los componentes de la suite están comprobados sobre la fuente final:
web 551/551, fichas y RSS 90/90, móvil 233/233, QR y herramientas correctos.
La ejecución integral registró 807 aserciones en 23 resúmenes numéricos,
además de documentación y catálogo V2, antes de detenerse por una expectativa
estática antigua sobre scripts de idiomas. Se conservaron los fallos y se
completaron las áreas restantes, sin repetir la SQL ya correcta: transparencia
17/17, empresas 19/19, cobro 12/12, auditoría de relanzamiento 51/51 y verificación.
Los logs por fase acreditan el cierre; no se atribuye un EXIT 0 a la primera
invocación de `npm test` que se había detenido.

Las dos pruebas de CSP admiten solo los cuatro scripts externos exactos con
defer y rechazan código inline, scripts desconocidos, duplicados y async.
Se conservó el matiz de la revocación histórica declarada por el titular.
La prueba de fichas admite atributos legítimos de idioma sin dejar de exigir
un único h1 y los cuatro campos de decisión. Una prueba anterior que exigía
vaciar el catálogo se actualizó para verificar la última copia completa.

Chrome local ES/EN: cinco anchos, datos originales, filtros, foco y favoritos
conservados, barra vacía sin foco ni solapes y barra con dos selecciones
operativa. El diálogo conserva 250 px de desplazamiento; el reflujo inglés en
paisaje cambia cinco píxeles sin perder el contexto del buscador. No se promete
igualdad numérica absoluta cuando cambia la altura del texto.

La QA del APK nuevo se registra con sus artefactos exactos. No se confunden
perfiles simulados con usuarios humanos, pruebas de modelos con Android ni
resultados locales con publicación.

## Preview y publicación remotas

Primera preview: `f0fe0e61`, alias `https://revision.rwadar.pages.dev`, desde
main `dc895da`, con 206/206 recursos idénticos y 208/208 comprobaciones HTTP.
La primera ejecución HTTP había contado incorrectamente los h1 con atributos;
se corrigió solo el comprobador y se conservó su log fallido.

La revisión en navegador de esta preview encontró un fallo real que el servidor
local con fixture no mostraba: el buscador de ofertas permanecía oculto porque
su inicialización dependía del modo interno. Se separó un helper público
idempotente que activa únicamente el buscador, sin revelar avisos ni controles
internos. La nueva regresión ejecuta el JS reducido de la publicación normal,
sin API local, y busca Houston entre las referencias de reventa. Las 543
comprobaciones finales incluyen filtros, orden, recarga pública y conservación
de 26/49/4 ante HTTP 500 o un lote incompleto, con búsqueda activa. La nueva
preview corregida fue `8a75b926`, nuevamente con 208/208 controles HTTP y 206/206
recursos idénticos.

El segundo recorrido real permitió usar el buscador. También observó el refresco
público normal de URL canónicas —por ejemplo, añadir la barra final— mientras
estaba abierto un detalle. La lista repintada desconectaba su botón de origen y
el cierre no devolvía el foco. Se añadió un retorno al control visible del mismo
slug, conservando el origen vivo como prioridad y sin desplazar la página.
Dos etiquetas inglesas y el aviso duplicado de documento original se corrigieron
solo en el adaptador web. Las 545 regresiones finales incluyen la restauración
de foco del JavaScript minificado. La tercera preview debe comprobar este corte.

Se amplió la lectura de las tarjetas web: título 20 px, datos de decisión 16 px,
cifra 24 px y secundarios/fecha 14 px; tres columnas de unos 409 px a 1440,
sin desbordamiento en la comprobación de 320 y 1440. También se eliminó una
inferencia incorrecta: `confirmada_documento_producto` se presenta como
«Documentación de producto consultada», sin deducir que todos los productos
tienen folleto aprobado. Cinco casos documentales y el registro específico de
Spiko tienen regresiones propias. El detalle conserva sus fuentes y alcance.

## Vídeo revisado

Entrega: `rwadar-entrega-integral-20261022/RWAdar-evaluacion-nueve-perfiles.mp4`, 154,32segundos,1600×1080,H.264a25fps,nuevecapítulos;22.909.224bytes. SHA-256 `765335a2f91b06040ade42758dc59f65b6544b95e9b6d466d0052ce86081d050`. Rótulos de perfil, tarea y criterios; viewport móvil centrado sin cambiar su contenido ni secuencia. Se conserva el MP4 continuo original y su WebM, con el registro de todas las iteraciones. Decodificación completa sin errores y revisión visual de los nueve capítulos, más cuatro fotogramas de la edición final. No tiene voz ni personas reales. Resultado45/45 de tareas observables; no satisfacción humana.

La grabación usa el servidor local aislado; su rótulo histórico «SIN aplicar» describe el modo de revisión del fixture y no el estado remoto, que fue aplicado y verificado por separado. No demuestra publicación. La corrección posterior de costes no modifica la escena Spiko mostrada; mF-ONE y mGLO tienen QA adicional propio con los conceptos separados. La integración de idiomas posterior se comprueba aparte.

Reproducción real completa en Chromium local, desde00:00hasta02:34,32: ended=true, tiempoFinal=duración=154,32s y error=null. Se observaron la continuidad de capítulos, los rótulos y las vistas móviles; se mantuvo la ausencia de audio declarada. Evidencia técnica en video-final-verificacion.json.

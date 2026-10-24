# Revisión integral de la entrega · 24 de octubre de 2026

**No está todo terminado.** La web con acceso obligatorio y radar está publicada;
Android 1.4.0/código 19 sigue en borrador. Esta revisión cruza las peticiones de
Víctor con fuente, informes, artefactos originales y dos consultas de estado de
GitHub. No inicia un ciclo editorial ni otra ejecución de QA Android.

Tres ayudantes realizaron revisiones separadas y terminaron: Android y descarga;
web, catálogo y Academy; cuentas, seguridad, cartera, vídeos y organización.
El agente principal contrastó sus conclusiones e inspeccionó la integración.
No se repitieron las baterías aprobadas, las compilaciones ni los correos.

## Prioridad 1 · entrega y compatibilidad

### La descarga pública 1.3.2 no incorpora el nuevo acceso del catálogo

GitHub consultado en esta revisión: `v1.3.2` sigue siendo la última release
final; `v1.4.0` es borrador. No confundir los dos assets subidos al borrador con
una publicación.

La fuente exacta de 1.3.2 es `882122874e8d329b7c7b3969f1c5613880db38a3`.
En ella, `rwadar-movil/lib/datos.js:58` usa `clientePublico()`;
`rwadar-movil/lib/supabase.js:93` devuelve un lector separado, sin la sesión de
Perfil. SQL28, aplicado el 24/10, deniega esa lectura anónima. Por inspección de
código, iniciar sesión en Perfil no corrige la sincronización de ese lector.

**Incompatibilidad demostrada entre contratos; efecto visual actual no observado
en un dispositivo 1.3.2.** El modo publicado solo restaura desde AsyncStorage:
`lib/catalogo-remoto.js:75–91` devuelve listas vacías cuando no existe caché válida,
y `App.js:180` prepara el aviso «Todavía no hay un catálogo guardado». El fixture
local no se usa como respaldo en ese modo. Las instalaciones que conservan una
caché válida mantienen esa copia. La QA antigua del APK
precede al cambio de permisos y no acredita compatibilidad posterior.

Acción mínima: tratar la descarga antigua como incompatible con la actualización
del catálogo; dirigir al acceso web vigente y cerrar la comprobación del APK19.
No se han revertido permisos ni publicado un APK sin validar.

Fuentes: [QA de 1.3.2](VERIFICACION-ANDROID-1.3.2-2026-10-22.md),
[SQL de acceso](../rwadar-app/db/28_catalogo_cuenta_obligatoria.sql),
[aplicación y verificación](VERIFICACION-CORREO-Y-ANDROID-2026-10-24.md).

### Android 1.4.0 aún no tiene aprobación nativa completa

Se conserva el mismo APK19, de 88.961.445 bytes y SHA-256
`f384a20017e09a4bc0650a0be82231b29acf6abd9629e1075442d458bd277624`.
Identidad, firma y correspondencia de las 49 imágenes ya tienen evidencia.

El último intento autorizado, `40123408614`, terminó con `status=failed`,
`checks={}`, `full20PointQA=false` y `releaseApproved=false`. Su XML final muestra
el Launcher de Android, sin ventana de RWAdar. No identifica si lo causó el
arnés, un gesto, pérdida de foco o el proceso de la app.

Siguen sin acreditar los puntos 02–15, 17, 18 y 20 de la matriz preparada:
idiomas y persistencia, radar y conteos, tarjetas y fichas, grupos, documentación,
riesgos, salida al proveedor, imágenes visibles, ficha autenticada con letra
grande, Academy y favorito. También falta cerrar cartera y logout autenticados.
Las observaciones válidas de los baselines 01, 16 y 19 se conservan con su
alcance; un login observado en el intento anterior no aprueba el resto.

Víctor autorizó un último intento limitado y que se detuviera si volvía a fallar.
Se ha respetado ese cierre. Esta revisión no ejecuta otra continuación.

Artefactos externos originales:
`../qa-40123408614-private/evidence-private/authenticated-result.json`,
`latest-ui.xml` y `matrix-20-result.json`, dentro de la carpeta de entrega
`rwadar-entrega-integral-20261022`, no dentro del repositorio.
La [matriz preparada](../.github/qa-android-authenticated-140/matrix-20.json)
sigue siendo una planificación; sus estados pendientes y algunos textos con
codificación deteriorada no son un resultado final. No se modificaron los
originales de las ejecuciones.

### Main, documentación y panel necesitan integrar el acceso nuevo

El checkout de entrega está 23 commits por delante de `origin/main` y cambia
331 archivos. `git ls-remote` confirmó que main remoto sigue en
`9a54b543a08eb073f095201437db6c337761b900`, igual que esa referencia local.
La carpeta principal está en `main`, con
trabajo compartido sin confirmar, y su referencia local lleva cinco commits de
retraso. No se ha hecho pull, reset, stash ni una mezcla sobre ese trabajo.

La fuente publicada el 24/10 está en la rama aislada
`codex/cierre-android-140-20261023`. Volver a publicar desde el main antiguo sin
integrarla no reproduce la web vigente. Los párrafos antiguos de `INTERNO.md`
que decían que main contenía toda la fuente publicada eran incorrectos para
esta entrega; se corrigen con esta revisión. Los informes fechados se conservan
como evidencias históricas.

El panel de Claude también depende del contrato anterior:
`rwadar-panel/lib/contenido.js:122–149` y `lib/supabase.js:24–50`, en la carpeta
principal, consultan las vistas con la clave publicable sin sesión y leen
Academy/sitemap sin sesión web. Ese código necesita adaptación al nuevo acceso.
No se ha observado el resultado actual del panel desplegado; es una
incompatibilidad deducida del código y los permisos comprobados. No se ha
modificado el trabajo activo de Claude.

## Prioridad 2 · alcance del producto y contenido

| Petición | Estado acreditado | Lo que falta |
|---|---|---|
| Web con radar, entrada, registro y cuenta confirmada | Publicada el 24/10. Alta real confirmada, sesión y logout comprobados en preview; 11 comprobaciones dirigidas en producción y recursos de acceso coincidentes. Diseño observado a 390 y 1440 px. | La nueva comprobación HTTP no sustituye las interacciones de cada pantalla después de la integración del acceso. |
| Recuperar la cuenta del titular | El correo correcto llegó; el enlace abrió identidad y formulario de nueva contraseña. | No consta que el titular guardara la nueva contraseña y entrara después con ella. La sesión observada en Chrome y el alta de QA son evidencias distintas. |
| Tarjetas sin corte y cierre cómodo | Web: diálogo limitado al área visible, contenido desplazable, X de 44 px y foco restaurado; recorridos guardados a 320/390/1440 px del 22/10. | Android: corrección en el APK19, sin cierre de su recorrido autenticado a letra grande. No afirmar aprobación nativa por las pruebas web. |
| Orden de escritorio y accesos repetidos | Web reorganizada reutilizando nodos, sin clonarlos; evidencia guardada del 22/10. | La navegación del APK19 y la revisión exhaustiva de cada texto siguen abiertas. |
| Mínimo EUR, acceso desde España y salida | Campos y estados honestos implementados. Sin inferir euros ni elegibilidad por licencias. | Las 49 referencias no tienen acceso desde España documentalmente confirmado en este corte; mínimos y salidas no documentados siguen identificados como tales. |
| Investigación profunda de ofertas y búsqueda de nuevas | Investigación manual del 23/10: cuatro referencias documentales en tres fichas; lote aplicado y revisión anterior conservada. | No acredita investigación profunda integral de las 49. No se han admitido nuevas candidatas por esta revisión ni renovado fechas generales. Otro ciclo requiere inicio manual de Víctor. |
| Imágenes realistas propias | 49 ilustraciones editoriales existentes, con identificación de IA y aclaración de que no son fotografías reales; correspondencia por contenido documentada en los APK. | No se generaron imágenes nuevas ni candidatas nuevas en este cierre. La visualización de cinco imágenes en el recorrido autenticado del APK19 sigue pendiente. |
| Seguimiento de inversiones | Implementado en el candidato Android: registro manual de compras, precio, cantidad, comisiones, cobros, ventas y valoración; cálculo local por cuenta. | No conecta con proveedores, no confirma operaciones, no actualiza cotizaciones y no sincroniza entre dispositivos. Las anotaciones no se recuperan al reinstalar. No equivale todavía al seguimiento automático solicitado ni está entregado por la release pública antigua. |
| Radar 3D como tutorial de Academy | Tutorial de cuatro pasos integrado dentro de Academy. | El recorrido real de su WebView en el APK19 sigue sin acreditar. Las lecciones 8 y 9 de Academy permanecen sin publicar. |
| Seguridad de comunidad y cuentas | SQL28 del catálogo aplicado. Limpieza de QA cerrada: cuenta de prueba inhabilitada, cero sesiones y dos secretos eliminados. Comunidad OFF. | Refuerzos de comunidad probados localmente pero migración no aplicada; Turnstile y cierre del inventario de redirecciones no acreditados. SQL28 no demuestra esas protecciones. |
| Evaluación con nueve perfiles y vídeos | Vídeo local de nueve perfiles simulados, 45 tareas de guion y reproducción completa acreditada. | No mide 90 % de satisfacción humana y precede a cambios posteriores. Faltan los enlaces recuperables de los dos vídeos originales; no se atribuye una nueva revisión de ellos. |
| 5S, traducciones y repaso pantalla por pantalla | Helpers extraídos y fuentes reutilizadas; ES/EN implementado. | JS/CSS y suite aún pendientes de división funcional; quedan plantillas dinámicas en español documentadas en `tareas/IDIOMAS-ES-EN.md`. No consta cierre exhaustivo de todos los textos. |

Fuentes de alcance: [revisión independiente del lote parcial](investigacion/2026-10-23/revision-independiente/REVISION-LOTE-EDITORIAL-PARCIAL.md),
[cartera y acceso](CIERRE-LOCAL-1.4.0-Y-ACCESO-2026-10-23.md),
[seguridad](VERIFICACION-SEGURIDAD-COMUNIDAD-2026-10-22.md),
[interfaz, vídeo y 5S](VERIFICACION-MEJORA-INTEGRAL-2026-10-22.md),
[idiomas](tareas/IDIOMAS-ES-EN.md).

## Descubrimiento público: SEO y RSS

El acceso obligatorio cambia deliberadamente el objetivo SEO anterior. Las
fichas, sitemap y RSS están protegidos; el Worker añade `noindex, nofollow` a
las respuestas autenticadas. No se ha abierto contenido para rastreadores ni
hecho una excepción que contradiga la orden de exigir cuenta.

Cuatro lecturas nuevas, a las 19:13:37 UTC, sin login, cookies ni correo:

| Ruta | Respuesta observada |
|---|---|
| `/robots.txt` | 200; sigue anunciando el sitemap protegido. |
| `/sitemap.xml` | 401, `sesion_necesaria`. |
| `/novedades.xml` | 401, `sesion_necesaria`. |
| `/ofertas/wemakeit` con Accept HTML | 303 al acceso y retorno a esa ficha. |

Evidencia nueva: [respuestas de las cuatro rutas](VERIFICACION-RUTAS-DESCUBRIMIENTO-2026-10-24.json).
El original y su comprobador están en `revision-integral-20261024`, fuera del
checkout. Estas cuatro rutas no repetían las once pruebas del cierre.

Quedan dos contradicciones concretas de texto en fuente:

- `rwadar-site/index.html:1241` todavía dice «La cuenta es opcional».
- `rwadar-fichas.js:228–230` y la página `/cambios` prometen RSS sin registro o
  sin cuenta, aunque los lectores externos reciben 401.

Son correcciones locales pendientes de producto; esta auditoría no cambia ni
despliega una web ya aprobada. Tampoco presenta las páginas generadas como una
estrategia SEO pública que siga funcionando después del cierre de acceso.

## Programación y siguiente orden de trabajo

Se leyó el archivo de la automatización existente: nombre «RWAdar · investigación
profunda bajo demanda», `status = "PAUSED"`. La regla horaria conservada no la
activa. Solo Ejecutar o la orden explícita de Víctor inicia un ciclo; no se ha
iniciado investigación por esta revisión.

1. Resolver primero la compatibilidad de la descarga pública y el cierre nativo
   del APK19; conservar los resultados válidos y el límite del último permiso.
2. Integrar la fuente web publicada, adaptar el panel y unificar el estado
   documental, preservando el trabajo de la carpeta compartida.
3. Corregir el texto residual de cuenta/RSS y comprobar solo esas diferencias;
   cualquier despliegue posterior necesita autorización para esa operación.
4. Completar los flujos aún sin evidencia, incluida la recuperación del titular
   y el progreso autenticado de Academy. No sustituirlos por un HTTP 200.
5. Completar investigación profunda únicamente tras inicio manual; el lote
   parcial, los enlaces o los tests de formato no cierran esa investigación.
6. Planificar aparte la conexión real de inversiones y el resto del plan de
   producto. No anunciar rentabilidad automática con anotaciones manuales.

No hay ayudantes trabajando indefinidamente. No se han ejecutado EAS, otra QA
remota, SQL, cambios de Auth, correos ni una publicación durante esta revisión.

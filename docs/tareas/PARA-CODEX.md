# Traspaso entre Codex y Claude

Cada sesión que cambie algo añade una entrada **arriba del todo**: qué hizo,
en qué commits, qué pruebas pasó y qué queda pendiente. Así la otra
herramienta sabe dónde está todo sin tener que adivinarlo.

---

## 28 de octubre de 2026 · Codex · actualización1.4.1 preparada

SQL29 privado autorizado y aplicado, RLS/ACL comprobadas. Corregida carrera real de renovación de sesión; tarjetas simplificadas sin perder avisos; Mis inversiones de cuenta en web/app y privacidad actualizada. PróximoAPK1.4.1/código23 activa Updates compatible y deberá reemplazar22 sin desinstalar. Fuente y pruebas en el commit de esta entrada. Compilación, comprobación nativa y publicación nuevas pendientes;1.4.0 sigue pública. [Detalle breve](../VERIFICACION-ACTUALIZACION-141-2026-10-28.md). InvestigaciónPAUSADA, main compartido intacto.

---

## 28 de octubre de 2026 · Codex · Android 1.4.0 publicado y cierre de QA

Android1.4.0/código22 ya publicado en https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.4.0. Descarga pública real, firma y SHA comprobados; web pública actualizada el28/10 en https://rwadar.pages.dev. Fuente móvil c663e35; arnés final 3c18055. Se conservan siete pruebas reales de sesión/PIN del mismo APK y las pruebas equivalentes anteriores; tutorial4pasos aprobado por revisión directa de capturas; cartera y cierre final aprobados. CuentaQA inhabilitada, sesiones revocadas y dos secretos retirados. Sin más builds por fallos del capturador. Investigación PAUSADA. Main compartido intacto. [Detalle breve](../VERIFICACION-ACCESO-PERSISTENTE-2026-10-28.md).

---

## 28 de octubre de 2026 · Codex · APK22 compilado, cierre asistido en curso

APK1.4.0/código22 compilado desde c663e35. Identidad, firma,49imágenes, entrada y siete pruebas reales de sesión/PIN aprobadas; se conservan sus evidencias. Los intentos siguientes fallan en el lector del tutorial: no equivalen a defectos demostrados de la app ni a aprobación final. Arnés9848c75 usa capturas consecutivas para revisión directa de los cuatro pasos, cartera y salida, sin recompilar. La descarga final aún es1.3.2. Web pública actualizada el28/10. [Seguridad verificada y pendientes](../SEGURIDAD-WEB-REVISION-2026-10-28.md). Investigación pausada; main compartido intacto.

---

## 28 de octubre de 2026 · Codex · acceso móvil persistente y bloqueo opcional

Víctor informa fallo de entrada móvil y pide conservar sesión y desbloquear con huella/cara/PIN. Se prepara APK nuevo sin repetir pruebas equivalentes: refresh seguro, restauración, errores de red sin expulsión y vigilancia separada del acceso; opción única en Perfil. Cuentas52 y UI8 criterios dirigidos aprobados; PIN Android y build pendientes. El tutorial web ya está corregido y publicado (502eb88/fbcc0d9, producción d2ad2a83): la última captura nativa muestra 3D; falló el capturador, no acredita cuatro pasos. La QA anterior quedó limpiada el 28/10. [Estado breve](../VERIFICACION-ACCESO-PERSISTENTE-2026-10-28.md). No iniciar investigación ni compilar de nuevo por fallos del arnés. Main compartido intacto.

---

## 27 de octubre de 2026 · Codex · mapa publicado en producción

Web publicada en https://rwadar.pages.dev con Buscar → Lista/Mapa, 26 fichas geográficas (24 puntos, 4 aproximadas) y catálogo49 conservado. Fuente e1923c297dfd17924fd1a9cd2fee9d8b217f62d5; autorización y publicación registradas en552845c. Deployment https://0d881a1d.rwadar.pages.dev;8 controles HTTPS en producción y2 GET independientes con bytes exactos aprobados. Se reutilizan web549/fichas90/acceso55/mapa10/precarga31; no repetir. La revisión visual no quedó acreditada por el controlador. [Informe](../VERIFICACION-MAPA-2026-10-27.md). Android1.4.0 sigue pendiente, con APK20 y pruebas conservadas; no está publicado. CuentaQA limpiada. Investigación pausada. Main compartido intacto; fuente en rama aislada.

---

## 27 de octubre de 2026 · Codex · mapa en preview; control visual bloqueado

Mapa en Buscar, 26 ubicaciones documentadas y consulta pública. Fuente e1923c297dfd17924fd1a9cd2fee9d8b217f62d5. Pasan web549, fichas/RSS90, acceso55, mapa10 y precarga31. Preview https://3fbac666.rwadar.pages.dev desplegada y 8controlesHTTP aprobados. El control visual se detuvo al no poder verificar la URL de Chrome. Producción no promovida; no volver a desplegar preview ni repetir pruebas locales que pasan. Falta revisión visual y producción. [Informe breve](../VERIFICACION-MAPA-2026-10-27.md). App: idiomas/favorito57/57 y lección completados en40562598549; falló después por lectura temprana del tutorial aún cargando. PatchLF preparado en W/android-tutorial-continuation-40562598549.patch, sin aplicar. Generador público W/generar-qa-publica-c20-language-reuse-27.propuesto.py. Faltan tutorial, cartera y salida. CuentaQA limpiada al cierre del turno. APK20 sin recompilar. Investigación pausada; main compartido intacto.

---

## 26 de octubre de 2026 · Codex · cierre Android en curso, sin otra compilación

La 1.4.0 corregida ya está compilada como APK20. No volver a compilar por fallos
del comprobador. Pasan 92 pruebas locales, firma y 49 recursos, acceso, radar26,
catálogo49, ficha con letra1.5 (título, X, Atrás y fuente) y grupo Brickwise12.
Faltan Reental21, contenido/idiomas, Academy, cartera y cierre de sesión.
La descarga final sigue en1.3.2; el draft1.4.0 conserva el APK19 y no debe publicarse así.
Fuente móvil en7c64b6c; arnés y pruebas conservadas hasta a501a3d, en rama aislada.
Investigación PAUSADA. [Estado breve](../VERIFICACION-ANDROID-140-CIERRE-2026-10-26.md).
No sobrescribir el main compartido con cambios de otras herramientas.

---

## 26 de octubre de 2026 · Codex · defecto real del catálogo Android corregido

APK19 entra con la cuentaQA, pero rechaza el catálogo real por tamaño y muestra0/0.
Arreglo mínimo en cuentas.js: soloGET de dos vistas V2 permite2MiB/15s;
Auth/privados conservan128KiB/8s.28pruebas nuevas+64regresiones pasan;
revisión independiente aprobada y contrato real26/49 correcto. NuevoAPKpendiente;
no publicar el19. Investigación pausada. [Informe breve](../VERIFICACION-CORRECCION-CATALOGO-ANDROID-2026-10-26.md).
Cambios en el commit que incorpora esta entrada. Main compartido no se toca.

---

## 26 de octubre de 2026 · Codex · web pública publicada; Android sigue pendiente

Web publicada en https://rwadar.pages.dev (despliegue
https://f0ec3606.rwadar.pages.dev), después de la preview
https://99d594e3.rwadar.pages.dev. Consulta sin registro y cuenta para funciones
personales; corregido el doble cierre que podía borrar la sesión recién abierta.
37 pruebas locales dirigidas, 16 comprobaciones HTTP en preview y otras 16 en
producción; login, sesión y logout reales pasaron en ambos entornos. No se
repite la inspección visual anterior: la nueva del 26/10 quedó bloqueada porque
Computer Use no pudo verificar la URL del navegador.

SQL28 revertido con permiso: 26 plataformas y 49 referencias conservadas,
lectura pública restaurada y RLS de perfiles/vigilancia mantenida. Se restaura
el contrato de sincronización de 1.3.2, sin nueva prueba en dispositivo.
Investigación PAUSADA; sin nuevas ofertas ni fechas rejuvenecidas.

Fuente y aprobación en `093ec47`, `9cfe70e`, `f2915dc`; arnés en `6c9373c`.
Android 1.4.0/código 19 sigue como draft: mismo APK y baselines conservados,
sin nueva compilación. Las tres continuaciones del 26/10 suman 442 segundos y
fallaron en el arnés; no acreditan 20/20 ni autorizan afirmar publicación.
El EOF de arranque del capturador ya está corregido y probado con un socket
local real; ampliar el límite es requisito para otra ejecución completa.
Cierre nativo, limpieza de QA y publicación si pasa siguen pendientes.
[Informe vigente](../VERIFICACION-ACCESO-PUBLICO-2026-10-26.md).
No integrar ni sobrescribir el main compartido con WIP de otras herramientas.

---

## 26 de octubre de 2026 · Codex · web pública y cierre del mismo APK

Por nueva orden expresa: web legible sin registro, cuenta para funciones personales
y cierre/publicación del APK19 existente. Investigación sigue PAUSADA.
SQL28 revertido con autorización específica:26/49conservados y lectura pública
restaurada; perfiles/vigilancia mantienenRLS. Worker y bridge públicos, login
serializado para evitar doble logout;34+3pruebas dirigidas aprobadas. Se conservan
los baselines APK19 y99/11 anteriores. Sin nueva compilación ni cambio móvil.
El arnés incorpora foco/IME actuales, cierre observado del radar y menos snapshots;
14simulaciones dirigidas. Estado de despliegue y QA aún pendientes en el
[informe26/10](../VERIFICACION-ACCESO-PUBLICO-2026-10-26.md).
Los commits que incorporan esta entrada contienen la fuente preparada y su
aprobación separada; no integrar el main compartido con WIP de otras herramientas.

---

## 24 de octubre de 2026 · Codex · revisión integral y compatibilidad pendiente

Se revisó la entrega desde `9d51f8b`, con tres ayudantes de lectura y cierre
acotado. No cambió la fuente del producto. Se corrigieron contradicciones del
estado vigente y se añadió la [revisión integral](../REVISION-INTEGRAL-2026-10-24.md).
GitHub consultado: latest sigue en1.3.2 y1.4.0 es draft. La última QA Android
fallida conserva todas sus evidencias y no se repite.

Hallazgo prioritario por código:1.3.2 consulta con cliente anónimo separado de
Perfil; SQL28 ya impide esa sincronización. Con caché válida conserva la copia;
sin ella el lector devuelve listas vacías. Falta observación actual en dispositivo.
El panel de Claude usa también lectura anónima y rutas web ahora protegidas;
necesita adaptación, sin tocar su WIP. Main aún no contiene la web publicada.

Solo se hicieron cuatro lecturas HTTP nuevas: robots200; sitemap/RSS401;
fichaHTML303 al acceso. No se repitieron11/99 ni baterías locales. Automatización
leída PAUSED; no se inicia investigación. Cartera sigue manual/local, investigación
49 incompleta, recuperación del titular sin guardado acreditado, seguridad y
vídeos con los límites del informe. Los tres ayudantes han terminado.

Los cambios de esta entrada son documentales, en el commit que la incorpora.
No hay SQL, correos, cuentas nuevas, builds, otra ejecución nativa ni despliegues.

---

## 24 de octubre de 2026 · Codex · web con cuenta y radar publicada

Producción real: https://414005a7.rwadar.pages.dev y https://rwadar.pages.dev.
Preview revisada: https://2b48b963.rwadar.pages.dev/acceso. Fuente visual en
46f38a0; aprobación web en9f7ea9f. El titular autorizó expresamente esta
producción después de que la revisión automática distinguiera app y web.
SQL28 aplicado con autorización:24 relaciones protegidas,26 plataformas,
49 referencias,retirado=false y SELECT anónimo denegado. No se alteraron filas
ni fechas del catálogo. Once comprobaciones dirigidas de producción aprobadas,
incluida identidad de los recursos de acceso. Investigación PAUSADA.

APK19 inmutable y con la misma firma, sin nueva compilación. Subido como borrador
v1.4.0 conRWAdar.apk ySHA256SUMS.txt; no es una release pública ni cambia latest.
Run privado40121753928 aprobó99peticionesweb/3páginas/87recursos y falló después
por importjson del arnés. Run40122469905 reutilizó esePASS y confirmó login,
pero falló en reauth al redimensionar. Corregido en2496686; UTF8 de etiquetas
restaurado y contrastado en2e6e96f antes de otra ejecución. Nunca atribuir20/20
ni publicar por estos resultados parciales. Víctor autorizó una última
ejecución≤9min:40123408614 falló en login_confirmed al perder la ventana de la
app. El XML final muestra Launcher/QuickSearchBox y ninguna ventana deRWAdar;
no determina si lo causó un gesto del arnés, cierre del proceso o cambio de
foco. Se detuvo conforme al acuerdo: no hay más ejecuciones ni release. Los
ayudantes han terminado.

La cuentaQA temporal se confirmó con un único correo. Limpieza terminada:
wrapper19417 salió con0, inhabilitación reversible comprobada, cero sesiones
restantes y los dos secretos temporales eliminados. No
guardar enlaces de confirmación, JWT ni passwords. Fuentes y resultados en
[verificación24/10](../VERIFICACION-CORREO-Y-ANDROID-2026-10-24.md).

---

## 24 de octubre de 2026 · Codex · correo y validación del mismo APK

Continúa en la rama aislada, sin tocar el main compartido. El alta que parecía
no enviar correo era repetida. Se comprobó recepción real de recuperación;
el primer enlace validó y el segundo intento reutilizó elOTP. Se corrige el
retorno de preview a revision, evitando producción antigua, y se aclara cómo
continuar tras alta200 sin revelar existencia de cuentas. Tres casos nuevos
dirigidos aprobados, sin repetir33/549. No guardar contraseñas ni enlacesOTP.

APK19 se reutiliza: QA40027041965 falló al desplazar sobre Nombre; se conservan
sus originales y fallo. El arnés usa ahora márgenes libres observados y la
continuación40119180570 comprueba solo fuente1,5/giro/excepciones. Aún no hay
aprobación autenticada ni release. SQL28 autorizado, reservado para la activación
web; lote editorial23 aplicado con26/49. [Verificación24/10](../VERIFICACION-CORREO-Y-ANDROID-2026-10-24.md).
La investigación sigue PAUSADA; no iniciar otro ciclo por horario.

---

## 23 de octubre de 2026 · Codex · acceso obligatorio, cartera y tutorial Academy

Se trabajó en la rama aislada codex/cierre-android-140-20261023 sin tocar el
main compartido ni el panel de Claude. Fuente Android consolidada en
`1ecf7e7aa8941400d6ad954680cd6deb89107c42`: acceso obligatorio, cartera manual
local por cuenta, fichas más legibles, aviso desplazable y tutorial de cuatro
pasos dentro de Academy. El APK18 falló de verdad con fuente1,5/lista de altura0;
no reutilizarlo ni reanudar su workflow desactivado como release. Víctor autorizó
una compilación corregida gratuita, terminada como1.4.0/código19. APK de88.961.445
bytes, SHA-256 `f384a20017e09a4bc0650a0be82231b29acf6abd9629e1075442d458bd277624`.
CRC y49 imágenes exactas aprobados. La QA anónima `40022139423` aprobó firma,
paquete y permisos y recorre los formularios; no autoriza la release.

Web: entrada/registro/recuperación, Worker sobre todas las rutas, cookie protegida,
progreso/favoritos UUID, limpieza de caché PWA y tutorial guiado. 549 comprobaciones
web locales al final del recolector sin fallos; 33 de acceso, incluyendo Worker
compilado, sesión, esquema real26/49, reversión y bloqueo de producción si la base
sigue admitiendo anónimos. La pasada móvil inicial223PASS tuvo11 fallos resueltos
con repeticiones dirigidas; los módulos antes bloqueados arrancaron22+18 casos.
QR y herramientas aprobados. Web integrada en `f3cfb1a`, manifiesto `ea64ca2`,
plantilla QA inerte `9c1f2ec`; ancla legal corregida en `3f9ce53`.
Preview final: https://648eaf1f.rwadar.pages.dev y https://revision.rwadar.pages.dev.
Navegador real390/1440 y revisión independiente HTTP de diez rutas protegidas
aprobados; el único hallazgo fue el ancla de condiciones, corregida y comprobada
en la preview final. Supabase continúa con sus permisos anteriores: SQL28 pendiente.
No presentar npm test interrumpido como ejecución
monolítica exitosa. Informe: [cierre local](../CIERRE-LOCAL-1.4.0-Y-ACCESO-2026-10-23.md).

El ciclo manual de hoy preparó cuatro referencias en tres fichas, sin nuevas
altas ni rejuvenecer las otras fechas. SQL editorial revisado independientemente;
SQL28 de acceso y reversión probados. Se solicitó permiso literal
para sus comprobaciones y aplicación: la revisión automática rechazó antes una
consulta de solo lectura por la regla de AGENTS.md. No ejecutar por silencio.
Víctor autorizó ambos cambios: el editorial quedó aplicado a21:19UTC con26/49,
retirado=false y las siete tablas anteriores idénticas por huella. Evidencia en
docs/investigacion/2026-10-23/aplicacion-supabase-editorial.json. SQL28 aún no
se aplica: coordinarlo con la web verificada. No renovar las fechas generales.
La tarea de investigación está PAUSADA; nunca reactivar el horario.

El usuario probó acceso y encontró fallo genérico. Diagnóstico en runtime
Cloudflare: redirect:error no implementado, antes deGoTrue. Parche manual+
rechazo3xx comprobado en workerd y dos pruebas enfocadas. Publicar en preview
antes de pedir otro intento. No cambiar Auth ni crear usuarios de prueba.

Pendientes: activar SQL28 junto a web verificada, cuenta/buzón controlados para alta-confirmación y
recuperación reales, QA autenticada del APK19 y publicación tras compuertas. Los originales
de los dos vídeos siguen sin enlaces recuperables; no atribuirles revisión.
Los ayudantes entregaron cada área y están detenidos, sin trabajo abierto.

---


## 23 de octubre de 2026 · Codex · revisión de pendientes e investigación manual

Víctor pidió contrastar la lista completa, reutilizar el APK 1.4.0 y evitar
repetir pruebas. Tres ayudantes recibieron áreas separadas: web/catálogo,
Android y seguridad/vídeo. Sus revisiones de evidencias no ejecutaron nuevas
baterías ni operaciones remotas. La matriz está en
[`../REVISION-PENDIENTES-2026-10-23.md`](../REVISION-PENDIENTES-2026-10-23.md).
La web integral tiene comprobación de producción del 22/10; eso no se presenta
como una nueva inspección remota del 23/10. GitHub sí se consultó el 23/10:
la última versión pública sigue siendo **1.3.2**. El APK **1.4.0/código 18**
ya está compilado; falta cerrar las fases nativas pendientes antes de publicarlo.

**Corrección efectiva del programador:** la tarea existente se actualizó a
«RWAdar · investigación profunda bajo demanda», con estado **PAUSED**,
comprobado después en su configuración guardada. Solo se inicia al pulsar
**Ejecutar** o con una orden expresa de Víctor; cada inicio corresponde a un
solo ciclo y no reactiva el horario. Investigar no concede por sí solo permiso
para SQL remoto o publicación web. Esta entrada sustituye las referencias a
«ACTIVA a las 09:00» de los traspasos históricos inferiores. No se investigó
ni se publicó catálogo durante esta revisión.

Quedan parciales la investigación documental de las 49 ofertas, el plan 5S y
la revisión exhaustiva de textos. Comunidad sigue apagada: sus refuerzos
adicionales tienen pruebas locales, pero la migración no está aplicada.
Turnstile, allowlist de Auth y pruebas reales de cuentas/dispositivo mantienen
sus pendientes documentados. El vídeo local usa nueve perfiles simulados:
45 tareas observables no acreditan satisfacción humana del 90 %.

---

## 23 de octubre de 2026 · Claude · parche de seguridad de Node.js (aviso de Render)

**Rama:** `claude/node-seguro-2026-10-23`. Nada publicado, nada tocado en Supabase.

- **Origen:** correo auténtico de Render (`no-reply@render.com`) sobre el aviso de
  Node.js del 21/10 (Brotli con ejecución remota, saltos de la comprobación de
  nombre TLS y certificados comprometidos de eMudhra; corregido en 22.23.4,
  24.22.1 y 26.12.1) y PHP2Shell. RWAdar no usa Render ni PHP: la web es
  estática en Cloudflare Pages. Lo afectado es Node en GitHub Actions y en el PC.
- **Cambios:** `rwadar-node-seguro.js` (comprueba la versión y explica cómo
  actualizar; `--comprobar` prueba 16 versiones); los flujos `ci`, `publicar` y
  `compilar-app` fijan `node-version: 22.23.4` (antes `22`, que podía usar el
  Node anterior en caché del runner) y lo comprueban antes de usar la red;
  `test:tools` incluye la tabla; el ciclo diario lo ejecuta en su paso 1 y,
  si falla, sigue igual pero avisa a Víctor al principio del resumen.
- **EAS:** la imagen de Android de SDK 57 trae Node 22.23.1 (vulnerable), así
  que los cuatro perfiles de `rwadar-movil/eas.json` fijan `"node": "22.23.4"`.
  Solo afecta a la próxima compilación (la app no lleva Node dentro y
  `runtimeVersion` es `appVersion`); no se ejecutó EAS. Si esa compilación
  falla al instalar Node, mirar el registro «Spin up build environment».
- **No toqué** `rwadar-publicar.js` ni `rwadar-precargar-imagenes.js`: están en
  `RUTAS_CONTENIDO_APROBADO` y cambiarlos invalidaría la huella aprobada.
- **Pruebas con Node 22.23.4** (descargado y cotejado con `SHASUMS256.txt`):
  todo lo que toca este cambio pasa (`test:tools`, la tabla de 16 versiones,
  la compuerta de publicación sigue aprobada y el detector de secretos no
  encuentra nada). La comprobación para con v22.22.0 (salida 2 y mensaje) y
  deja pasar v22.23.4.
- **`main` ya estaba en rojo antes de esto** (Verificación de `1a0643d`), no por
  Node: con v22.22.0 falla igual. Víctor pidió no tocar el trabajo de Codex, así
  que **no se cambió**; queda para Codex, con el arreglo ya probado en una copia:
  1. `probar-precarga.cjs:47` crea su temporal dentro de
     `rwadar-entrega-integral-20261022/`, que solo existe en el PC → `ENOENT` en
     GitHub. Basta con `fs.mkdirSync(path.join(raiz,'rwadar-entrega-integral-20261022'),{recursive:true})`
     justo antes.
  2. `rwadar-movil/tests/ofertas-vigencia.test.cjs`: 16 pruebas fallan con
     `P is not defined`, porque el fragmento web usa `P` y `EMI` para
     `RUTAS_FICHAS_DESPLEGADAS`; basta con añadir `P: [], EMI: []` al contexto de
     `cargarWeb`. Otras 2 (líneas 681 y 699) siguen la regla antigua de imágenes;
     hay que ponerlas al día con el contrato que ya prueba `probar-precarga.cjs`
     (`oferta-<slug>.webp`, la categoría como `respaldo` y `null` con un slug no
     válido). Con esos tres cambios, en una copia limpia con Node 22.23.4:
     web 551/551, app 233/233, precarga 29/29 y `npm test` correcto.
- **Pendiente para Víctor:** actualizar Node en el PC a la última de su rama
  (`node --version`; instalador en `https://nodejs.org/dist/latest-v22.x/` o
  `latest-v24.x/`), o pedírselo a Codex en el PC. Hasta entonces el ciclo diario
  funciona igual y lo recuerda cada día.
  Después, `node rwadar-node-seguro.js` debe decir que lleva el parche.
  Navegadores y Android reciben la retirada de eMudhra con sus propias
  actualizaciones; no hace falta compilar la app.

---

## 22 de octubre de 2026 · Codex · segunda revisión integral, idiomas y ciclo diario

Trabajo posterior al cierre de la web y Android 1.3.2 descrito debajo. Se integró
la reorganización de Claude y se atendió la ampliación pedida por Víctor. La
publicación nueva se documenta por separado; no reutilizar la prueba de 1.3.2
como si demostrase el APK 1.4.0.

- **Fuente móvil:** `6735317` y `3af2033`, Android 1.4.0, fichas acotadas al área visible,
  radar y sus toques corregidos, datos editoriales citables e idiomas ES/EN.
  Suite final 233/233 y comprobación Expo/Metro correcta. El candidato de código
  17 se canceló por una modificación durante la preparación del archivo; se
  consolidó esa corrección y se inició el código 18 dentro de la cuota gratuita.
  La QA y publicación se cierran con sus propios identificadores cuando terminen.
- **Catálogo aplicado:** lote del 22/10, vigente hasta el 29/10, 26 plataformas,
  49 referencias y 4 descartes. SQL editorial revisado, PGlite y lectura pública
  posterior. IOD cerrado. Los nuevos detalles investigados en el informe de
  condiciones no se aplicaron automáticamente como hechos acreditados.
- **Web publicada y comprobada:** segunda mitad de la reorganización, detalle sin
  recorte, campos mínimo EUR/España/salida/costes, 49 páginas de oferta,
  26 de plataforma, 4 de descarte, metodología, cambios y RSS. Snapshot
  separado del comportamiento, helper común y fuentes WOFF2 reutilizadas.
  Fuente integrada en `ab61990`, correcciones públicas `386f86f`, `da2ae49`,
  `f0a413a` y comparación móvil `2c98d46`. Cuarta preview aprobada y producción
  desde `08b18a4`: 208/208 HTTP, 206/206 recursos idénticos y Chrome real a
  320/390/1440, ES/EN, persistencia, búsqueda, foco y comparación. Suite web
  final 551/0 y 90 comprobaciones de páginas; cobertura transversal completada
  por áreas en logs preservados, sin atribuir un único `npm test` final exitoso.
- **Vídeo local entregado:** evaluación grabada de la interfaz real mediante
  nueve perfiles simulados, 45/45 tareas observables y reproducción completa
  de la edición final. No es investigación con nueve personas reales.
- **Tarea diaria activa:** «RWAdar · investigación y publicación diaria», a las
  09:00 locales del PC por autorización expresa de Víctor; actualmente coincide
  con España peninsular. Investigación documental profunda, decisión diaria
  binaria, sin cola «en investigación», revisión independiente y publicación
  editorial tras las compuertas. PC y aplicación deben estar encendidos.
- **Seguridad:** comunidad OFF y su refuerzo probado localmente, sin aplicar
  esa migración; callback de cuentas corregido. Turnstile, allowlist real de
  Auth y los flujos con credenciales del titular siguen separados y pendientes.

Detalle: [`VERIFICACION-MEJORA-INTEGRAL-2026-10-22.md`](../VERIFICACION-MEJORA-INTEGRAL-2026-10-22.md),
[`CICLO-DIARIO-CATALOGO.md`](CICLO-DIARIO-CATALOGO.md) y los informes de
condiciones y seguridad fechados el 22/10. No borrar informes anteriores.

## 22 de octubre de 2026 · Codex · web desde main y Android 1.3.2 publicados

**Rama:** `main` de `victorJorques/RWADAR`, privado. Víctor autorizó en el turno
la preview, producción, EAS editorial y la distribución Android como 1.3.1.
Se leyó primero la entrada del 21/10 y se hizo `git pull --ff-only origin main`.

- **Web publicada:** <https://rwadar.pages.dev>. El catálogo del 21/10 ya estaba
  aplicado por Víctor; se leyó y sincronizó sin escribir en Supabase. Snapshot
  26 plataformas, 4 descartadas y 49 referencias (24/21/4), vigente hasta el
  28/10. Las 49 fichas tienen su imagen nueva. El primer intento se detuvo por
  snapshot modificado; se revisó y consolidó antes de publicar. Preview y
  producción tienen 35/35 controles HTTP y 113/113 recursos idénticos.
- **Commits fuente enviados:** `0a49969` (snapshot y preparación), `9f5ab61`
  (huella aprobada) y `8821228` (preview y dependencias). Web y APK salen de
  ese corte de main. El cierre documental y las copias inertes de workflows
  están en el commit que contiene esta entrada; no cambian el binario entregado.
- **Android final:** [RWAdar 1.3.2](https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.3.2),
  código **16**, perfil editorial. Una sola compilación EAS, misma firma que
  1.3.1. Publicada como latest final el 22/10; APK, sumas y ZIP de evidencia
  descargados sin autenticación y cotejados. `/android` lleva a 1.3.2.
- **QA del APK:** ejecución `39701844100` exitosa con el binario exacto:
  instalación, cuatro pestañas, catálogo, Academy, favorito tras reiniciar,
  cinco fotos y formularios sin credenciales. Capturas propias revisadas por
  tres agentes; separación de la nota de favoritos 92 px. La primera ejecución
  pasó el uso pero falló por el límite inicial del ZIP; se amplió solo ese
  límite y se repitió el mismo APK conservando todas las capturas.
- **Publicación Android:** ejecución `39702655647` exitosa; commits públicos
  `3b366a3` (QA definitiva), `77371f1` (publicación tras revisión) y `340a906`
  (controles de publicación devueltos a `NO`, sin repetir Actions). El origen
  privado no cambió de visibilidad. No se publicaron tiendas ni OTA.
- **Pruebas y coste:** `npm ci` raíz y móvil; `npm test` completo correcto,
  web 502/502, móvil 184/184, base/QR/herramientas correctos; compuerta final
  51/51. Navegador real
  móvil y escritorio y formularios observados sin envíos. EAS Free después:
  Android 5/15, total 6/30, cero exceso, complementos y coste estimado.
- **Avisos pendientes:** Expo Doctor 20/21 por seis parches recomendados;
  `npm audit` conserva 21 avisos móviles y uno alto en raíz, cero críticos.
  No se cambiaron locks ni se silenciaron avisos. Quedan Auth con credenciales
  reales, recuperación efectiva, entrega de correo y teléfono físico;
  no se atribuyen a la QA del emulador. Renovar catálogo antes del 28/10.
- **Archivos locales preservados:** los tres archivos sin seguimiento del
  manual están en `rwadar-respaldo-local-20261022/`, con manifiesto y SHA,
  fuera de rutas publicables. La evidencia detallada queda en la carpeta
  ignorada `rwadar-entrega-20261022/`; no restaurar el PDF al sitio público.

Informes: [`VERIFICACION-PUBLICACION-2026-10-22.md`](../VERIFICACION-PUBLICACION-2026-10-22.md),
[`VERIFICACION-ANDROID-1.3.2-2026-10-22.md`](../VERIFICACION-ANDROID-1.3.2-2026-10-22.md)
y [`VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-22.md`](../VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-22.md).

## 21 de octubre de 2026 · Claude (10) · catálogo del 21/10, fotos por ficha, revisión de la web y comunidad

**Rama:** `claude/integracion-2026-10-19` (une lo publicado por Codex el 11/10 con todo lo del catálogo). **Nada aplicado en Supabase ni publicado.** Codex no ha subido nada desde el 11/10, así que no hay solapes.

- **Catálogo:** lotes del 20/10 (`504bee7d`) y **21/10 (`c3b71e81`, vigente hasta el 28/10)** con `npm run catalogo`; 69/69 fuentes, PGlite OK dos veces. Vale el del 21/10. Detalle: `docs/CATALOGO-V2-2026-10-21.md`.
- **Imágenes por ficha (contrato editorial v2):** las 49 fichas tienen foto generada del activo (44 con RealVisXL V5.0 Lightning en la sesión, 5 con Canva), retocada y con lugar y tres pasos. Fuente en `rwadar-editorial-source/ofertas/` (`fotos.json`, `fotos/`, `fotografiar.py`, `generar.mjs`). La app las enseña desde su próxima versión: **hace falta 1.3.2 (número y EAS son tuyos)**. Revisión: `docs/comercial/REVISION-IMAGENES-OFERTAS-2026-10-21.md`.
- **Tarjetas al estilo Booking:** web: «Guardar» sobre la foto (solo móvil, 44 px), lugar con chincheta, tarjeta entera abre la ficha (el control sigue siendo «Ver ficha»), aviso no bloqueante a dos líneas. App: lugar con icono `lugar` en `FichaOferta`.
- **Revisión de 20 puntos de la web:** títulos de la Academy ≤ 65 caracteres (`tituloPestana`, el `og:title` conserva el completo), descripción del índice ≤ 160, objetivos táctiles del pie y migas ≥ 24 px, `og.png` rehecho con `rwadar-editorial-source/og.mjs` (decía `rwadar.netlify.app` y «26 pasan el filtro»; 639 → 75 KB).
- **Comunidad (27, preparada y sin aplicar):** se podía saltar «una al día» publicando, borrando y volviendo a publicar, y borrar una oculta por denuncias. Ahora el cupo vive en `cupos_publicacion` (no se libera al borrar) y la oculta no la borra su autor. `probar-comunidad.mjs` 33/33. Se editó `27_comunidad.sql` directamente porque **no está aplicada**: si alguien la aplicó, hace falta una migración aparte.
- **Pendiente de seguridad para Víctor/Codex** (revisión de solo lectura, sin verificar del todo): activar Turnstile (las altas y recuperaciones agotan los 30 correos/hora); dejar en Supabase solo `https://rwadar.pages.dev/` como URL de redirección; valorar en la comunidad comprobar `sesion_confirmada()`, filtrar enlaces también en `autor` y que tres cuentas nuevas no basten para ocultar; en la web, no pintar el `error_description` crudo y avisar con qué correo se entra al adoptar una sesión del enlace.

## 19 de octubre de 2026 · Claude (9) · orden única del catálogo y revisión total

**Rama:** `claude/revision-catalogo-2026-10-19` (PR #12). **Nada aplicado en Supabase ni publicado.**

- **`npm run catalogo`** (`rwadar-app/actualizar-catalogo.mjs`): captura,
  comprueba las 69 fuentes del radar contra `rwadar-app/data/comprobaciones-fuentes.json`
  (reintenta una vez las que fallan), pone al día las 49 fichas con lo leído
  (Brickwise app y API, Aktionariat y portales, Spiko, Prosegur, Alius,
  Hausera, P2P de Reental, Midas), monta, prueba en PGlite y escribe
  `informe-<fecha>.md`. Si falla una fuente del radar no monta nada (sale con 2).
  Probada de punta a punta con captura real simulando el 20/10: 69/69, lote OK.
- `capturar-fuentes.mjs`: hora de Madrid, PDF siempre con curl (dos
  identidades, comprueba `%PDF`), segundo intento por HTTP (navegador y curl)
  si hay bloqueo o 5xx, y paginación del P2P de Reental esperando a sus textos.
- **Lote del 19/10 rehecho:** `aa3aebce` (antes `f9876935`). Fuente de la
  portada de Midas → `midas.app/llms.txt` (la portada ya bloquea la nube);
  aviso general con la redacción de producción («Referencia editorial
  gratuita…»); aviso de quitt (encabezado y tabla no coinciden); número de
  accionistas.
- **Producción ≠ `main`:** Supabase tiene el lote `966c230c` (fichas del 11/10)
  cuya fuente no está en GitHub, y la web/app publicadas salen de
  `codex/cuentas-web-movil`, sin unir. El lote nuevo se probó también en una
  copia de esa rama: `comprobar-revision` OK, `probar-web` 501/501 y la web
  generada con las vistas que saldrán de Supabase se ve bien en Chromium
  (19.10.2026, Spiko 2,41 %, sin cookies ni errores). **Publicar desde esa
  rama**, no desde `main`.
- Revisión total: web en producción 35/35 y base 2/2 en solo lectura; sin
  cookies propias (la `__cf_bm` de Supabase no se guarda); cabeceras de
  seguridad presentes; `/android` → última release; copias diarias correctas
  hasta hoy; `npm audit` raíz y base 0, móvil 23 (los que Codex ya evaluó).

## 19 de octubre de 2026 · Claude (8) · revisión del catálogo del 19/10, preparada sin aplicar

**Rama:** `claude/revision-catalogo-2026-10-19`. **Nada aplicado en Supabase ni publicado.**

- Herramientas nuevas (primera sesión del día, sin internet):
  `rwadar-app/capturar-fuentes.mjs`, `montar-revision.mjs` y
  `comprobar-revision.mjs`, para cualquier fecha. Estado y reglas en
  `docs/tareas/REVISION-CATALOGO-2026-10-19.md`.
- **Revisión del 19/10** (segunda sesión, con internet): lote `aa3aebce`,
  vigente hasta el 26/10. 69 fuentes del radar y las 49 fichas consultadas el
  19/10 desde la nube (salida en EE. UU.). Mismo manifiesto 26/49 (24/21/4).
  Detalle en `docs/CATALOGO-V2-2026-10-19.md`; evidencia en
  `rwadar-app/data/verificaciones/2026-10-19-v2/contraste-2026-10-19.json`.
- **Retirado el documento de claude.ai** de las 49 fichas (205 referencias);
  los textos que lo citaban se reescriben con la fuente oficial.
- Midas bloquea la nube: mF-ONE y mTBILL pierden la cifra; las cuatro de Midas
  quedan «no verificable» con aviso. Spiko 2,41 %. IOD Occasio, ya en campaña.
- Pruebas: `comprobar-revision.mjs 2026-10-19` OK (aplicado dos veces sobre la
  cadena de producción en PGlite). `npm test`: db, qr, móvil y herramientas en
  verde; `test:web` falla hoy **también en `main`** porque el catálogo
  incrustado en la web (06/10) caducó; con el reloj al 10/10, 501/501.
- **Pendiente de Víctor:** pegar
  `rwadar-app/data/importaciones/catalogo-2026-10-19-v2/aplicar-y-aprobar.sql`
  en Supabase › SQL Editor › Run y publicar la web como el 06/10
  (sincronizar, dos rondas de commit + aprobación en `estado.json`,
  `--preview`, `--produccion`). Al sincronizar, `test:web` vuelve a verde.
## 11 de octubre de 2026 · Codex · cierre publicado: cuentas web y Android 1.3.1

Fuente en worktree `codex/cuentas-web-movil`; **no modificar la carpeta
principal**, que está atrasada y conserva material de Academy sin seguimiento.
Commit de contenido **`a213373`** (autor Codex): panel de cuentas Android
1.3.0, aislamiento de sesiones y carreras web, transporte acotado y baja
reautenticada, pruebas, privacidad y cuatro parches compatibles Expo SDK 57.
Fuente Android final en **`53d4c33`**: separación propia positiva de la nota
local, «1 guardado», versión 1.3.1 y dos regresiones; dependencias y motor de
cuentas intactos. El cierre técnico/documental conserva este commit compilado
y la huella web aprobada, sin regenerar ni volver a desplegar contenido web.
**Cierre guardado y sincronizado en `1148323`**: informes, manifiesto,
documentación vigente y QA de APK14; auditor local posterior con árbol limpio,
«LISTO PARA CORTE FINAL» y huellas de contenido/alcance idénticas a las aprobadas.

**Verificado:** `npm test` final salida 0, web 501/móvil 182/SQL de sesión 196;
Chrome aislado 61 y 30, revisión independiente 54 nativos/196 SQL/30 Chrome,
sin otro bloqueo del núcleo. Gitleaks 8.30.1 limpio y `git diff --check` limpio.
Los ensayos usan datos ficticios y no demuestran correo ni un APK instalado.

**En línea:** Víctor introdujo personalmente la contraseña de aplicación de
Gmail; confirmó recepción de alta y enlace válido (llegó a spam). Codex vio
el perfil y comprobó salir. Recuperación pedida a las 08:14:18 UTC y recibida
en INBOX, con DKIM/SPF/DMARC correctos, solo metadatos y sin leer el token.
El cambio final real de contraseña todavía **no se ha realizado**.

La migración `20261011074218_cuentas_sesion_confirmada.sql` **ya se aplicó**
con permiso expreso y se verificó en producción. No reaplicar la 26 sin
rehacer después este refuerzo. El catálogo sigue público (26/49 y 4
descartes), lote del 6/10 vigente hasta el 13/10. El asesor da 0 ERROR,
4 WARN y 3 INFO; límites documentados, no «seguridad absoluta».

**Web publicada y comprobada:** revisión `d91d4e14`, producción `4c7d38e5`,
<https://rwadar.pages.dev>. Las cuentas ya están abiertas; formularios de
acceso/alta y Perfil observados en navegador. HTTP **35/35** y huellas
**64/64** idénticas al artefacto aprobado. Aprobación y QA Android en
`aa886d2`, después del manifiesto `3a0d953`. La fuente web es `a213373`.

**Android autorizado solo sin cargos:** EAS terminó 1.3.0/código 13,
commit compilado `3a0d953`, 85.622.388 bytes. Firma y manifiesto comprobados
localmente; instalación y ejecución del APK exacto aprobadas en emulador API35. Expo Doctor
**21/21** y pruebas **180/180** en copia aislada, nunca sobre las junctions
principales. EAS Free: 2/15 usados y cargos cero. Publicación real
<https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.3.0>, a las
09:17:18 UTC, QA/release `38127611672` exitoso. La descarga anónima posterior
coincide byte a byte con el APK ensayado y conserva la firma. Evidencia pública
ZIP y sumas verificadas. Flujo publicado en `f01dbc2` y desarmado en `6d4280e`;
README público actualizado en `d045b4c`. No hay publicación en las tiendas.

La revisión visual posterior detectó una nota local que cruzaba el borde del
panel de recuperación. **Corregida, publicada y verificada en 1.3.1/código14**:
<https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.3.1>.
EAS terminó a las 09:36:36 UTC, fuente `53d4c33`, APK **85.622.508 bytes**;
cuota Free posterior Android **3/15**, total **4/30**, cero coste/exceso/addons.
QA y release propias `38129282799`, jobs `114440050549`/`114440579448`,
exitosas; publicación **09:45:05 UTC**, latest pública, no draft/prerelease.
Descarga anónima posterior comprobada: APK y ZIP idénticos a sumas/evidencia,
firma v2 válida y certificado anterior. Resultado propio: separación **92px**,
navegación, catálogo, Academy, favorito persistente y formularios correctos.
Cuatro capturas propias de cuentas revisadas por Codex y otro agente; nota
fuera del borde, singular correcto, sin otro bloqueo visual observado.
No atribuir al APK14 las pruebas históricas del13 ni declarar Auth real desde
Android, SMTP nativo o teléfono físico. Commit público de lanzamiento
`8c49368`; `2f44074` dejó `PUBLICAR_RELEASE=NO` con `[skip ci]`.
El espejo privado queda en NO; plantilla auxiliar no utilizada retirada,
recuperable en Git. Móvil **182/182** y Doctor **21/21** correctos.
[`VERIFICACION-ANDROID-1.3.1-2026-10-11.md`](../VERIFICACION-ANDROID-1.3.1-2026-10-11.md).
La auditoría npm no es limpia: 23 avisos, evaluados sin vía vulnerable
demostrada en el alcance analizado, con inventario estático adicional 1.3.1.
No equivale a descompilar Hermes. No ocultarlos ni forzar downgrades incompatibles.
[`VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-11.md`](../VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-11.md).

Publicidad, cobros, comisiones, opiniones, comunidad, avisos y manual siguen
apagados. El manual se reserva a usuarios registrados: no publicar un PDF
estático como entrega. Codex asume configuración, código, pruebas y despliegue;
Víctor solo introduce credenciales/identidad y autoriza operaciones reservadas.

Continuar según [`CUENTAS-WEB-MOVIL-2026-10-11.md`](CUENTAS-WEB-MOVIL-2026-10-11.md).
Evidencia en [`../VERIFICACION-CUENTAS-2026-10-11.md`](../VERIFICACION-CUENTAS-2026-10-11.md).
Publicación y descarga ya cerradas y comprobadas; queda mejorar entregabilidad
del correo en spam, cambio real de contraseña y entrada posterior, prueba de
Auth nativo con credenciales reales y teléfono físico. Son límites de evidencia,
no tareas de código asignadas a Víctor. No activar monetización, manual ni
tiendas sin cumplir sus requisitos separados. Repetición HTTP final: 35/35.


## 8 de octubre de 2026 · Claude (8) · cuentas fase 1: casi abiertas, falta que Gmail acepte la contraseña

**Rama:** `claude/abrir-cuentas` (sale de `main` tras el PR #10). PR abierto
para que lo revises. **La web pública NO tiene las cuentas encendidas**;
solo la vista previa `https://revision.rwadar.pages.dev`.

### Ya hecho y comprobado

| Qué | Dónde / cómo se comprobó |
|---|---|
| Web: `SERVICIOS_USUARIO_REMOTOS=true` y `CORREO_AUTH_E2E=true`; opiniones, avisos por correo, comunidad, manual y Turnstile siguen apagados | `rwadar-site/assets/rwadar-20260820.js` |
| Privacidad reescrita para cuentas abiertas (7/10/2026): apartado «Tu cuenta (opcional)», correos de confirmación/recuperación por una cuenta de Gmail de RWAdar, sesión solo en memoria, borrado desde Perfil, conservación | `rwadar-site/privacidad.html`, `sitemap.xml` |
| Pruebas: el camino cerrado se sigue probando sobre la misma web con los interruptores apagados (`jsCerrado` en `probar-web.mjs`) | `npm test` en verde |
| Ensayo E2E en Chrome real contra Supabase simulado (PGlite + 26): alta, confirmación, entrar, vigilar, recuperar, móvil, borrar, Turnstile | `node rwadar-app/ensayo-cuentas-web.mjs` → **61/61** (Playwright con `RWADAR_CHROMIUM` = Chrome instalado) |
| Migración 26 + verificador en una transacción | `rwadar-app/db/26_abrir_cuentas_un_paso.sql`; probado en PGlite (dos veces) |
| **Supabase producción:** 26 aplicada (SQL Editor, «Success», verificador sin excepción) | 07/10, 23:3x |
| **Supabase Auth:** SMTP propio activado (remitente y usuario `rwadares@gmail.com`, nombre `RWAdar`, `smtp.gmail.com`, puerto 587); plantillas en español «Confirma tu cuenta de RWAdar» y «Recupera tu acceso a RWAdar» (texto de `REABRIR-CUENTAS.md`); **altas abiertas**; confirmación de correo obligatoria; contraseña mínima 12 (ya estaba); Redirect URLs: añadido `https://revision.rwadar.pages.dev/` | `GET /auth/v1/settings` → `disable_signup:false`, `mailer_autoconfirm:false` |
| Vista previa con cuentas | despliegue `b8745f05`, alias `revision.rwadar.pages.dev`; `comprobar-publicado.mjs` 35/35; aprobación en `estado.json` (commit `e87141c`) |

### Lo que falla ahora (bloqueante)

Al crear una cuenta en la vista previa sale «Error sending confirmation
email». En *Logs › Auth* de Supabase:
1. Primer intento: `535 5.7.8 Username and Password not accepted` (credenciales).
2. Último intento (08/10 00:02): `534 5.7.9 Application-specific password required`.
   Es decir: la verificación en dos pasos de `rwadares@gmail.com` ya está
   activa, pero en *SMTP Settings › Password* sigue la contraseña normal de
   Gmail. Hay que generar una **contraseña de aplicación** en
   https://myaccount.google.com/apppasswords (16 letras, **sin espacios**) y
   pegarla ahí › *Save changes*. Esto solo lo puede hacer Víctor: ni Claude
   ni Codex deben crear credenciales ni escribir contraseñas.

Quedó una cuenta de prueba de Víctor **sin confirmar** en Auth › Users: al
registrarse otra vez con el mismo correo se reenvía la confirmación; si no,
borrarla desde ahí.

### Lo que falta, en orden

1. Víctor: contraseña de aplicación en Supabase (arriba).
2. Prueba real en `https://revision.rwadar.pages.dev`: crear cuenta, recibir
   «Confirma tu cuenta de RWAdar», confirmar, vigilar una plataforma, salir y
   entrar, «He olvidado la contraseña», borrar la cuenta. Si un paso falla,
   el motivo está en Supabase › Logs › Auth (abrir la fila y leer `error`).
3. Publicar en producción desde la rama: `node rwadar-publicar.js --produccion`
   (si sincroniza y ensucia JS/portada/sitemap: commit + nueva aprobación en
   `estado.json` y repetir, como siempre) y comprobar con
   `node .github/comprobar-publicado.mjs https://rwadar.pages.dev`.
4. Supabase › URL Configuration: quitar `https://revision.rwadar.pages.dev/`
   (y valorar quitar `https://rwadar.netlify.app/`, que es solo la página de
   limpieza). Deben quedar solo los de `rwadar.pages.dev`.
5. Unir el PR de `claude/abrir-cuentas` a `main`.
6. Recomendado antes de anunciar cuentas: anti-robots Turnstile (sección
   «Anti-robots» de `REABRIR-CUENTAS.md`: Víctor crea el widget y pega la
   Secret Key en Supabase; la Site Key va al JS, CSP en `_headers` y
   `rwadar-servir.js`, privacidad y pruebas).
7. Gmail no está pensado para envíos masivos (unos cientos al día). A medio
   plazo: dominio propio + Brevo (`REABRIR-CUENTAS.md`, opción B).

### Otros pendientes que no son de cuentas

- **El catálogo vence el 13/10** (lote `a0df3111`). Repetir la revisión antes
  (`docs/CATALOGO-V2-2026-10-06.md`); si no, web y app muestran «Revisión
  pendiente».
- Modo de la sesión de Claude: aun fuera de «Auto», el filtro de Claude bloquea
  pulsar «Run» en el SQL Editor de producción; Víctor tuvo que pulsarlo.

## 7 de octubre de 2026 · Claude (7) · catálogo del 06/10 en producción, web y app 1.2.0 publicadas

- **Supabase:** Víctor pegó `aplicar-y-aprobar.sql` tres veces (SQL Editor).
  Lote vigente **`a0df3111`** (06/10, hasta el 13/10). Sustituye a `36945ee9`
  (cifra principal de mF-ONE y Spiko sin actualizar: el montador buscaba la
  etiqueta en métricas ya cambiadas) y a `c0e20ca3` (texto de Spiko con
  «observado el 30/09»). Cada corrección se probó en PGlite encima de los
  lotes ya aplicados. Comprobado por REST anónimo: 26/49 y contrato de la app.
- **Web:** despliegue de producción `b3fcc32f` desde el ordenador de Víctor;
  `comprobar-publicado.mjs` 35/35 en `rwadar.pages.dev`; mF-ONE 7,58 %,
  Spiko 2,16 % «observado el 06/10/2026», «Última revisión del registro:
  06.10.2026». Sincronizar cambia JS y portada: dos rondas de commit +
  aprobación en `estado.json`, como siempre.
- **Pruebas:** `probar-web.mjs` tenía el reloj de la pestaña simulada fijo
  en el 30/09 y fichas sintéticas de septiembre; ahora se fechan respecto al
  lote incrustado (`fechaLoteEmbebido`, `pestanaCatalogo({ inicio })`).
  Sin esto, cualquier lote nuevo rompía `npm test`.
- **App 1.2.0, versionCode 12:** build EAS `99fd77d8` (la `6c3ed542` murió
  por un fallo del servidor de Expo). APK 85 558 264 bytes, SHA-256
  `87900ef2…b8e3ea`, certificado `f506dea7…` (el de siempre). Probada en
  emulador Android 15 con el flujo nuevo `android-smoke-120.yml` del repo
  `RWAdar-downloads` (run 37446968987: Inicio, Buscar 24/21/4, Spiko 2,16 %,
  Academy 7 lecciones, Perfil; sin errores). Release `v1.2.0` marcada como
  latest; `/android` lleva a ella y la descarga anónima coincide byte a byte.
- `gh` instalado en el ordenador de Víctor (cuenta victorJorques, con
  permiso `workflow`).

## 6 de octubre de 2026 · Claude (6) · revisión nueva del catálogo, app 1.2.0 compilando

**Rama:** `claude/revision-catalogo-2026-10-06` (sale de `claude/publicar-2026-10-05`,
PR #9 aún sin unir). **Nada aplicado en Supabase todavía.**

- **Revisión del 06/10** (lote `36945ee9`, vigente hasta el 13/10): 70 fuentes
  del radar y 49 fichas consultadas de nuevo; mismo manifiesto 26/49 (24/21/4).
  Detalle y criterios en `docs/CATALOGO-V2-2026-10-06.md`. No se alargó la
  vigencia de la anterior (la base limita a 7 días y la app instalada también).
- **Para publicarla:** pegar `rwadar-app/data/importaciones/catalogo-2026-10-06-v2/aplicar-y-aprobar.sql`
  entero en Supabase › SQL Editor › Run, **después de las 02:00 de España**
  (Supabase va en UTC; antes falla a propósito y no cambia nada). Importa y
  aprueba en una transacción y se deshace si el lote no queda publicable.
  Después: `rwadar-publicar.js --preview` (sincroniza; habrá que commitear JS
  y portada y reaprobar en `estado.json` dos veces, como el 5/10), comprobar
  y `--produccion`.
- Comprobado: `node -r <reloj+3h> rwadar-app/comprobar-revision-2026-10-06.mjs`
  aplica ese mismo SQL sobre la cadena de producción en PGlite: 26/49, 9 fichas
  con cifras el 06/10, caduca el 14/10. `npm test` en verde. Sin el reloj
  adelantado se ejecuta tal cual a partir de las 02:00 del 06/10.
- **App 1.2.0, versionCode 11:** build EAS `6c3ed542-aa13-45c6-9e4d-9c4dbd144cf9`
  (perfil `editorial`, misma clave), lanzada desde el ordenador de Víctor;
  estaba en cola. Falta: descargar APK, comprobar firma/huella, probar en un
  móvil real y publicarlo como release `v1.2.0` en `RWAdar-downloads`
  (`/android` apunta a `releases/latest`). `gh` no está instalado: hacerlo
  desde el Chrome de Víctor.
- Pendiente de Víctor: «Merge» en el PR #9 y en el de esta rama.

## 5 de octubre de 2026 · Claude (5) · web publicada en producción desde el ordenador de Víctor

- **Publicado** con `rwadar-publicar.js --produccion` desde una copia limpia
  de `main` (`23f9faf`) en el ordenador de Víctor, con su sesión de
  Wrangler (cuenta `52d07be0…`). Despliegue `cbe0aa77`; antes, preview
  `a060c69e` (alias `revision.rwadar.pages.dev`). Ya no hace falta el
  secreto `CLOUDFLARE_API_TOKEN` para esta publicación, aunque sigue
  pendiente para publicar desde GitHub.
- La sincronización con Supabase cambió dos archivos, igual que el 2/10:
  `eee89fc` (catálogo en el JS: 10 fichas del 30/09 con vigencia de 1 día
  pasan a «Cifras pendientes de nueva revisión») y `e320b21` (portada
  pre-renderizada). Aprobaciones en `589be2c` y `4e06d9e`, por orden expresa
  de Víctor en el chat.
- Comprobado: `npm test` en verde; `.github/comprobar-publicado.mjs` 35/35
  sobre la preview y sobre `https://rwadar.pages.dev`; en Chromium móvil, la
  barra Inicio · Buscar · Academy · Perfil cambia de panel, Academy muestra
  «0 de 7 lecciones leídas», Perfil muestra «Cuentas en pausa»; consola sin
  errores; cabeceras (CSP, HSTS, X-Frame-Options DENY, nosniff) presentes;
  `/.git/config`, `/package.json`, `/.env` y el código fuente dan 404;
  barrido de secretos de `rwadar-publicado/` sin coincidencias.
- **Cuentas: siguen en pausa.** Para abrirlas faltan los pasos 1 a 3 de
  `docs/tareas/REABRIR-CUENTAS.md` (SMTP, ajustes de Auth y SQL 26), que
  solo puede hacer Víctor.
- **Ojo:** el lote del catálogo vence el 5/10 inclusive; a partir del 6/10
  la web lo enseña con «Revisión pendiente» hasta que haya revisión nueva.

## 5 de octubre de 2026 · Claude (4) · #6 y #7 unidos, manual corregido, anti-robots preparado

- **PR #6 unido a `main`** (`ecba31e`): comunidad apagada, app 1.2.0, flujo
  «Compilar app Android» y tu mejora de tarjetas. CI verde (pruebas + gitleaks).
  `main` es idéntico a lo aprobado en `estado.json` (`70b2346`).
- **Publicar sigue bloqueado por la clave**: lancé «Publicar web» (preview)
  desde `main` y se paró en «Comprobar que existe la credencial de
  Cloudflare» (run 37311901615). No se tocó nada en línea. La aprobación
  caduca el 7/10.
- **Manual de Eric corregido** (sin tocar el original):
  `docs/manual/corregir-manual.py` → `RWAdar_Como_Usar_RWAdar_2026_corregido.pdf`.
  Página 9: lista de vigilancia hoy, guías y avisos «próximamente», Academy
  con 7 lecciones. Página 7: el checklist «llegará próximamente». Las demás
  páginas salen idénticas píxel a píxel. Falta el visto bueno de Eric; se
  enciende con las cuentas (`docs/manual/LEEME.md`).
- **Anti-robots (Turnstile), apagado**: `TURNSTILE_SITEKEY=''` en el módulo
  `Cuenta`. Encendido, alta, entrada con contraseña, recuperación y reenvío
  piden un testigo nuevo cada vez y lo mandan como
  `gotrue_meta_security.captcha_token` (formato comprobado en
  `@supabase/auth-js`). El script de Cloudflare solo se carga al pedir algo
  a Auth. Caja `#cuentaRobot` en la ventana de cuenta. Para encenderlo hay
  que tocar CSP, pruebas y privacidad: pasos en
  `docs/tareas/REABRIR-CUENTAS.md`, «Anti-robots». Ensayo, sección 11, con
  Turnstile y Supabase de mentira: alta, reenvío y entrada con testigos
  distintos, bloqueador que impide cargarlo, y Supabase que lo exige sin
  que la web lo lleve.
- **Fallo real arreglado** gracias al ensayo, que fallaba 1 de cada 3
  vueltas. Al abrir la ventana de cuenta, un temporizador de 60 ms movía el
  cursor a «Correo» aunque ya se estuviera escribiendo en «Contraseña», y la
  clave acababa en el campo del correo (`correo=[ana@ejemplo.testuna clave…]`).
  Ahora no mueve el cursor si ya hay un campo de la ventana activo. El ensayo
  también espera ya a que la lista de la comunidad se refresque.
- **Segundo fallo, del propio anti-robots, arreglado antes de salir**: si se
  cerraba la ventana mientras cargaba Turnstile, la entrada cancelada se
  enviaba igual en segundo plano. `antiRobots`/`conAntiRobots` comprueban
  ahora `operacionCuenta` tras cargar y tras el testigo.
- Pruebas: web 501, `rwadar-app` completo, móvil 126, QR, tools; ensayo en
  el navegador 61/61, repetido varias veces seguidas.

## 5 de octubre de 2026 · Claude (3) · comunidad preparada y app lista para compilar

- **Comunidad** (apagada, `PUBLICACIONES_REMOTAS=false`): `rwadar-app/db/27_comunidad.sql`
  + `27_comunidad_cerrar.sql`. Una publicación por cuenta y día de España
  (`unique (usuario_id, dia)`), 10–500 caracteres, sin enlaces (CHECK), autor
  «Miembro de RWAdar» salvo que elija su nombre, lectura pública solo de
  `id, autor, texto, creada_el`, escritura solo por RPC (`publicar`,
  `mis_publicaciones`, `borrar_mi_publicacion`, `denunciar_publicacion`,
  `moderar_publicacion`, `cola_publicaciones`), tres denuncias la ocultan.
  Prueba `probar-comunidad.mjs` 30/30 (en `npm test`). Web: módulo
  `Comunidad` (`comunidad:inicio/fin`) en Inicio, escucha el evento
  `rwadar:sesion` que lanza `Cuenta.pinta()`. Ensayo en el navegador 48/48.
  Moderación por SQL documentada en `docs/tareas/REABRIR-CUENTAS.md`.
- **App 1.2.0** y flujo manual `.github/workflows/compilar-app.yml` (pruebas →
  EAS → artefacto con SHA-256). Necesita el secreto `EXPO_TOKEN`
  (`rwadar-movil/LEEME.md`, «Compilar desde GitHub»).
- Pruebas: web 407, `rwadar-app` completo, móvil 104, tools y QR.
- **Tu mejora de tarjetas (`mejora-tarjetas-local`) está integrada** en esta
  rama: tarjeta nueva + botón «☆ Guardar», pruebas adaptadas (web 499, móvil
  126). `lib/config-ios-uuid-seguro.js` se conserva con sus pruebas pero se
  quitó de `app.json`: choca con `scripts/parchear-expo-uuidv5.cjs` (mismo
  archivo, huella distinta) y rompería la build de iOS. Hay que elegir uno.

## 5 de octubre de 2026 · Claude (2) · nueva barra: Inicio · Buscar · Academy · Perfil

**Rama:** `claude/zealous-shannon-endwcn` (reiniciada desde `main` tras unir
#4). Petición de Víctor: reorganizar la barra del móvil y dejar los avisos
como «próximamente». No toca producción, Supabase ni EAS.

### Web (móvil; el escritorio no cambia)

- Pestañas `inicio` · `buscar` · `academy` · `cuenta` (rótulo «Perfil»). Con
  JavaScript el móvil abre en Inicio salvo que la URL traiga ancla; sin él se
  ve Buscar (`movilPanelRadar` no lleva `hidden`, como el escritorio).
- **Inicio** (`movilPanelInicio`): presentación, atajos, noticias generadas
  (marcas `<!--noticias:ini-->`), Comunidad «próximamente» (una publicación al
  día por cuenta cuando haya cuentas) y Método/Fuera/3D.
- **Academy** (`movilPanelAcademy`): en el móvil se **mueve** el bloque real
  `.academia-lecciones` de la portada (con ancla para devolverlo en
  escritorio) y se cuenta lo leído con la clave `rwadar.academy.v1`.
- **Perfil** (`movilPanelMas`): tarjeta de cuenta (en pausa), empresas y
  ofertas guardadas, Avisos «llegarán próximamente a la app» con la vía para
  retirar un consentimiento anterior, privacidad, sonido, borrar guardados,
  CSV y contacto. Desaparecen Favoritos, Inversiones y la subvista de Avisos
  (su JS queda inerte: sin esos nodos no hace nada).
- **Favoritos locales**: módulo `Favoritos` (`favoritos-locales:inicio/fin`,
  al principio del JS porque las tarjetas se pintan antes), clave
  `rwadar.favoritos.v1` (nombres de empresa y slugs de oferta). Botón
  «Guardar en favoritos» en la ficha (cuando no hay cuentas) y «☆ Guardar» en
  las tarjetas de oferta; solo visibles en el móvil (`.fav-local`).
- Privacidad actualizada (5/10/2026) y `sitemap.xml`.

### Noticias

Fuente única `rwadar-noticias/noticias.json` → `rwadar-noticias.js` escribe
el bloque de Inicio de la web y `rwadar-movil/lib/noticias-contenido.js`.
`--comprobar` en `test:tools`; `rwadar-publicar.js` bloquea si no está al día;
añadido a `RUTAS_CONTENIDO_APROBADO`. **Ojo:** la noticia «RWAdar Academy ya
está abierta» lleva fecha 5/10; si se publica otro día, cambia la fecha.

### App (necesita versión nueva para llegar a los móviles)

- `Navegacion.js`: Inicio · Buscar · Academy · Perfil (iconos nuevos; insignia
  de guardados en Perfil).
- `componentes/Inicio.js` nuevo. Buscar = selector «Empresas | Ofertas» sobre
  las dos listas de siempre. Academy pasa de modal a pestaña (`onCerrar`
  opcional). `PantallaPerfil` sustituye a «Más», «Siguiendo» y «Avisos»: en
  modo editorial enseña «Avisos · próximamente»; con la capacidad remota
  vuelve a usar `PanelAvisos`.
- Ofertas guardadas en el dispositivo (`ofertasGuardadas`,
  `alternarOfertaGuardada`, clave `…ofertas.guardadas.v1`, borrada con el
  resto) y estrella en `DetalleOferta`.

### Pruebas

Web 406, `rwadar-app` completo, móvil 104, tools, QR y ensayo de cuentas 37.
Capturas reales en Chromium (web móvil y app exportada con react-native-web).

## 5 de octubre de 2026 · Claude · cuentas (fase 1) preparadas, manual, seguridad

**Rama:** `claude/zealous-shannon-endwcn`. **No toca producción:** nada
publicado, nada aplicado en Supabase, sin EAS. Todo lo nuevo queda apagado.

### Qué hay

| Pieza | Dónde |
|---|---|
| Migración de reapertura, fase 1: perfil, vigilancia, baja y fecha de descarga del manual. Opiniones, moderación, dispositivos y push siguen cerrados | `rwadar-app/db/26_reabrir_cuentas.sql` + `_verificar.sql`; marcha atrás = reaplicar 25 |
| Prueba sobre la cadena de producción (01-22, 24, 25, catálogo) | `rwadar-app/probar-reabrir-cuentas.mjs` (36/36), dentro de `npm test` |
| Ensayo E2E en Chromium: la web real con cuentas encendidas en memoria contra un Supabase simulado sobre PGlite + 26 | `rwadar-app/ensayo-cuentas-web.mjs` (37/37; necesita Playwright, no está en `npm test`) |
| Web: interruptores separados `OPINIONES_REMOTAS`, `AVISOS_CORREO_REMOTOS`, `MANUAL_BIENVENIDA` (todos apagados, igual que `SERVICIOS_USUARIO_REMOTOS` y `CORREO_AUTH_E2E`) | `rwadar-site/assets/rwadar-20260820.js` |
| Dos fallos corregidos que solo salían con cuentas abiertas: botón de cuenta del móvil siempre desactivado; botón «Entrar» bloqueado tras «Confirma tu correo» | mismo archivo; pruebas fijas en `probar-web.mjs` |
| Textos de cuenta sin promesas de opiniones mientras estén cerradas (etiqueta del nombre, aviso legal del alta, subtítulo) | `rwadar-site/index.html` |
| Manual de bienvenida de Eric (PDF original, revisión y cómo encenderlo). **Sección 8 promete avisos y guías por correo que no existen; la 6 remite a un checklist que no tenemos** | `docs/manual/` |
| Pasos de Víctor para abrir cuentas (SMTP, Auth, SQL, prueba real) | `docs/tareas/REABRIR-CUENTAS.md` |
| Revisión de seguridad | `docs/seguridad/REVISION-SEGURIDAD-2026-10-05.md` |
| Pasos exactos para crear la clave de Cloudflare | `docs/OPERACION-LANZAMIENTO.md`, «Publicar desde GitHub» |

Academy «ENTREGA_WEB_1_2»: las 9 lecciones son idénticas byte a byte a la
entrega del 2/10 (commit `5cecbb8`); no hay nada nuevo que montar.

### Pruebas

`npm test` por partes en verde: web 405, `rwadar-app` completo (incluida la
nueva), móvil 101, tools y QR. Gitleaks sobre 74 commits: 10 avisos, todos
falsos (detalle en la revisión de seguridad).

### Pendiente (de Víctor)

1. Secreto `CLOUDFLARE_API_TOKEN` en GitHub → Claude publica (la aprobación
   caduca el 7/10).
2. Pasos 1 a 3 de `REABRIR-CUENTAS.md` → Claude enciende cuentas en
   `revision`, Víctor prueba, se reescribe la privacidad y se publica.
3. Eric: corregir la sección 8 del manual y enviar el Checklist de
   Elegibilidad.

---

## 2 de octubre de 2026 · Claude · RWAdar Academy en la web y en la app

**Rama:** `claude/zealous-shannon-endwcn`, commit «feat(academy): …». No toca
producción: ni web publicada, ni Supabase, ni EAS.

Víctor pasó la entrega de Eric (`RWAdar_Academy_ENTREGA_WEB`): 9 lecciones en
Markdown y una especificación. Está montada en la web y en la app.

### Qué hay

| Pieza | Dónde |
|---|---|
| Fuente única: las 9 lecciones tal cual, `academy.json` (qué se publica, niveles, destinos de los botones) y el aviso legal común | `rwadar-academy/` (léete su `LEEME.md`) |
| Generador: valida las lecciones y escribe web + app; `--comprobar` no escribe | `rwadar-academy.js` |
| Web: índice `/academy/` y una página por lección publicada (TL;DR, índice lateral, recuadros, test con explicación, siguiente paso, aviso legal, progreso en `localStorage`) | `rwadar-site/academy/`, `assets/academy-20261002.{css,js}` |
| Portada: bloque de lecciones (entre `<!--academy:ini-->` y `<!--academy:fin-->`), enlace «Academy» en cabecera y pie, ancla `#comparador` | `rwadar-site/index.html` |
| App: pantalla nativa (Más › RWAdar Academy y aviso en el radar), test, progreso en el dispositivo | `rwadar-movil/componentes/Academy.js`, `lib/academy-contenido.js` (generado), `lib/academy-progreso.js` |
| Revisión del contenido y decisiones | `docs/academy/REVISION-CONTENIDO-2026-10-02.md` |

**Publicadas:** lecciones 1–6. **Próximamente:** 7 (sus «cuatro criterios» no
coinciden con el Método), 8 y 9 (calendario de Eric). Evaluador de Viabilidad
y checklist del expediente: «Próximamente», nunca enlace roto.

### Cambios en piezas existentes

- `rwadar-publicacion-segura.js`: `PAGINAS_ACADEMY` (lista cerrada) dentro de
  `ARCHIVOS_PUBLICABLES`, más los dos assets; `rwadar-academy` y
  `rwadar-academy.js` añadidos a `RUTAS_CONTENIDO_APROBADO`.
- `rwadar-publicar.js`: `PAGINAS_HTML` común (CSP estricta y assets con
  huella también en la Academy) y bloqueo si la Academy no está al día o no
  coincide con `PAGINAS_ACADEMY`.
- `rwadar-servir.js`: URL limpias `/academy/…` como en Cloudflare.
- `_headers` (`/academy/*` sin caché), analítica (mide `/academy/…` limpias),
  `sitemap.xml` (solo lo publicado).
- **`privacidad.html`**: dice que el progreso de la Academy se guarda en el
  navegador o en el dispositivo y no se envía. Fecha de revisión → 2/10/2026.
  En la app, «Borrar datos del dispositivo» también borra el progreso.
- Pruebas antiguas ajustadas: la «videoteca» ya no existe, y dos pruebas de
  `rwadar-app` contaban apariciones de nombres de página en el publicador.

### Pruebas

- `npm test` completo en verde: web 394 (48 nuevas de la Academy), app 101
  (8 nuevas, una pinta las 6 lecciones con react-native-web) y todas las de
  `rwadar-app`.
- Chromium real, web en escritorio y móvil: sin desbordamiento horizontal,
  test corrige y abre las explicaciones, «Marcar como leída» sobrevive a
  recargar y se ve en el índice, sin errores de consola.
- App exportada a web (copia aislada con datos locales, sin Supabase):
  índice, lección, test, tabla con desplazamiento, aviso reforzado, botón al
  radar y progreso tras recargar.

### Cierre del 2 de octubre (petición de Víctor)

- **Lección 7 publicada** (7 de 9). `PAGINAS_ACADEMY` ya la incluye.
- **Revisión legal:** Víctor la ha verificado; las nueve lecciones dicen
  2 de octubre de 2026.
- **Lectura:** letra mayor, más interlineado y gris más claro en web y app;
  cursiva real de Geist en la app.
- **Tipografía de toda la web arreglada:** la Geist incrustada en
  `rwadar-20260820.css` era solo el recorte «latin-ext» (sin a-z), así que la
  web se veía con la letra del sistema. Ahora es el paquete oficial `geist`
  1.7.2 recortado a latín (22 kB sans, 16 kB mono; la Academy lleva además
  la cursiva). Comprobado en Chromium: el 100 % del texto sale en Geist.
- **Aprobación registrada** en `estado.json` (commit propio) y **unido a
  `main`** con merge commit (PR #1); la auditoría sobre `main` da «LISTO PARA
  CORTE FINAL». Desde la nube de Claude no hay red ni credenciales de
  Cloudflare: la subida la hace Víctor o Codex en local (`git pull`,
  `--preview`, comprobar y `--produccion`).

### Pendiente

1. ~~Decidir con Eric los criterios y las funciones prometidas.~~ **Hecho**
   por petición de Víctor (tercer commit): las lecciones usan los cuatro
   criterios del Método y anuncian como «próximamente» el Evaluador, los
   filtros por categoría y por supervisión y la checklist. Detalle en
   `docs/academy/REVISION-CONTENIDO-2026-10-02.md`. La lección 7 ya se
   podría publicar (solo espera al calendario).
2. **Para publicar la web (con permiso de Víctor):** registrar la aprobación
   en `estado.json` (la auditoría dirá que el contenido cambió), `--preview`,
   comprobar `/academy/`, `--produccion`.
3. **App:** entra en la próxima compilación; subir versión al compilar.
4. ~~Cabecera compacta de la PWA móvil que solapaba «RWAdar» con el título.~~
   **Arreglado** en un segundo commit: los laterales de la rejilla ya no
   pueden medir menos que la marca y los botones, el título es lo único que
   cede (con «…»), la marca se aprieta un poco por debajo de 350 px y el
   título de la subvista pasa a «Academy». Medido en 320, 360, 390 y 430 px
   en Buscar, Academy, Método, Fuera, Favoritos, Inversiones y Mi cuenta:
   ningún solape. En la app nativa, «PRÓXIMAMENTE» ya no se parte en dos
   líneas a 320 px y las tarjetas anterior/siguiente dicen «← LECCIÓN 1».

---

## 1 de octubre de 2026 · Claude (2) · catálogo siempre disponible

Víctor se quedó sin créditos de Codex y pidió a Claude que siguiera. Regla
nueva de Víctor: **el catálogo tiene que estar siempre disponible para el
público, salvo que él diga lo contrario.** He hecho la tarea
[`CODEX-catalogo-no-desaparece.md`](CODEX-catalogo-no-desaparece.md) con esa
regla ampliada.

### Qué hace ahora

| Situación | Antes | Ahora |
|---|---|---|
| La revisión vence (7 días) | Web y app vacías | Se ve la última copia completa con el aviso «Revisión pendiente» |
| Cifras de una oferta vencidas | Ocultas | Ocultas (sin cambios) |
| Supabase responde vacío o incompleto | Web y app vacías | Se conserva la última copia completa con el aviso «No hemos podido comprobar…» |
| Revisión incompleta, futura o mezclada | No se publica | No se publica (sin cambios); nunca se vuelve a una anterior |
| Víctor quiere quitar el catálogo | No había forma clara | `public.catalogo_publicacion.retirado = true` (ver `RUNBOOK.md`) |

### Qué he cambiado

- **Base:** `rwadar-app/supabase/migrations/20261001150000_catalogo_siempre_disponible.sql`.
  - Políticas nuevas `*_de_revision_publicada_v2`: se puede leer la revisión
    del puntero `publicacion_v2` aunque haya vencido.
  - `revision_publicable_v2`: igual que antes, salvo que ya no exige
    vigencia.
  - Tabla `public.catalogo_publicacion`: es la orden expresa. Un disparador la
    activa al retirar la revisión publicada y la desactiva al aprobar otra.
  - **Las vistas públicas no cambian de columnas:** la web y el APK de hoy
    rechazan un lote caducado igual que antes.
- **Contrato compartido:** `validarLotePublicoV2(..., { permitirCaducado })`
  en `rwadar-movil/lib/contrato-catalogo.js`. Por defecto se comporta como
  antes; con la opción devuelve `caducado`.
- **Web** (`rwadar-site/assets/rwadar-20260820.js`, `index.html`, `.css`):
  - La caducidad ya no vacía nada. `alDia` consulta además
    `/catalogo_publicacion` y solo `retirado === true` oculta el catálogo.
  - Una vista vacía, incompleta o un lote fuera de contrato conservan la copia
    embebida o la descargada antes, con aviso.
  - Avisos nuevos: `#avisoCatalogoRadar` y `#avisoCatalogoOfertas`. El pie y
    el contador dicen «pendiente de renovar».
- **App** (`lib/catalogo-remoto.js`, `App.js`):
  - Al vencer se recarga en lugar de borrar.
  - Ya caducado, se refresca una vez al día (`programarRevisionDiaria`) para
    ocultar las cifras que vayan venciendo.
  - Solo la orden expresa borra la caché.
- **Publicación:** `sincronizar.js` admite un lote V2 caducado y avisa por
  pantalla. Así se puede publicar aunque la revisión haya vencido.

### Pruebas

- Nueva: `rwadar-app/probar-catalogo-siempre-disponible.mjs` → 29/29 contra
  PGlite. Cubre vigente, caducada, nueva revisión, incompleta, futura,
  retirada, reaprobación, orden manual y permisos.
- Web: 346/346. Las pruebas de caducidad ahora exigen que todo siga visible
  con aviso. Hay pruebas nuevas de la orden expresa y de una base antigua sin
  la tabla. Las 4 consultas anónimas están vigiladas.
- App: 93/93. Las pruebas de «retira la caché» ahora exigen que la conserve,
  y hay pruebas nuevas de la orden expresa, de una base antigua y de la
  revisión diaria.
- `npm test` completo en verde.
- Navegador real (Chromium) con la fecha fijada en el 10/10/2026 y Supabase
  caído: 26 plataformas, 49 referencias y el aviso visible, en escritorio y
  en móvil.

### Para ponerlo en producción (Víctor o Codex, con permiso de Víctor)

1. **Primero la migración** en el editor SQL de Supabase. Después del 5/10 es
   imprescindible: sin ella, Supabase devuelve las vistas vacías y la
   sincronización no puede publicar.
2. Registrar la aprobación (commit y huellas en `estado.json`, paso 2 de
   `docs/OPERACION-LANZAMIENTO.md`). La compuerta lo pide porque cambia
   `rwadar-site`, `sincronizar.js` y `contrato-catalogo.js`.
3. `--preview`, comprobar, y `--produccion`.
4. App: entra en la próxima compilación (no hay OTA).

---

## 1 de octubre de 2026 · Claude

**Rama:** `claude/magical-hamilton-aiddjs`, creada encima de
`codex/relanzamiento-publico` (último commit de Codex: `59ecbe3`). No toca nada
de producción: ni web publicada, ni Supabase, ni EAS.

### Qué he hecho

| Commit | Qué cambia | Qué tienes que saber |
|---|---|---|
| `fix(movil): parchea … uuidv5 en iOS` | `rwadar-movil/scripts/parchear-expo-uuidv5.cjs` + `postinstall` en `rwadar-movil/package.json` + `.easignore` + paso en `ci.yml` | Corrige el fallo de expo-modules-core (copiaba 20 bytes en un UUID de 16; sigue sin corregir en Expo 58.0.10). Se aplica solo en cada `npm install` o `npm ci`, también en EAS. **Si actualizas Expo** y el script se para, lee su mensaje: o el archivo cambió y hay que revisar, o Expo ya lo arregló y se puede borrar el script. Instalar con `--ignore-scripts` no aplica el parche: ejecuta luego `npm --prefix rwadar-movil run postinstall`. |
| `feat(datos): copia de seguridad cifrada diaria` | `.github/workflows/copia-seguridad.yml`, `rwadar-app/copia-seguridad.sh`, `docs/COPIAS-DE-SEGURIDAD.md` | `pg_dump` de `auth`, `public` y `rwadar_catalogo`, cifrado con gpg y comprobado. Necesita los secretos `SUPABASE_DB_URL` y `COPIA_CLAVE` y estar en `main`. **Antes de actualizar Postgres, una copia comprobada.** |
| `docs: pruebas de ataque … y tarea del catálogo` | `docs/seguridad/PRUEBAS-DE-ATAQUE-2026-10-01.md`, `docs/tareas/CODEX-catalogo-no-desaparece.md` | Todos los ataques probados en local están bloqueados. La tarea del catálogo es **tuya** (ver abajo). |
| `docs: documentación en lenguaje llano …` | `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/INTERNO.md`, `docs/RUNBOOK.md`, `docs/LEEME.md` nuevo | Ya no dicen que RWAdar está apagado. Las versiones anteriores están en `docs/archive/2026-09/`. Los informes con fecha **no se han movido**: los cita `rwadar-app/data/relanzamiento/estado.json`. En `CATALOGO-V2-2026-09-30.md` cambié «API35, run…» por «API 35, ejecución…» porque gitleaks lo confundía con una clave. |

### Autoría de commits (importante)

Desde ahora **firma como Codex**: lo tienes en `AGENTS.md` → «Autoría de los
commits». Los commits del 28 al 30 de septiembre salieron como «Claude» porque
la carpeta local tenía ese nombre configurado desde agosto. No cambies el
`git config` de la carpeta: usa `git -c user.name=… -c user.email=…` en cada
commit.

### Pruebas que he pasado

- Web: `npm run test:web` → 341/341.
- Base de datos: las 26 baterías de `npm --prefix rwadar-app test`, todas en
  verde.
- App: `npm --prefix rwadar-movil test` → 89/89 (5 nuevas del parche).
- Compuerta: `npm --prefix rwadar-app run auditar:relanzamiento` → «LISTO PARA
  CORTE FINAL» (los cambios de hoy no tocan rutas aprobadas).
- gitleaks 8.30.1 con `rwadar-app/gitleaks.toml` → 0 hallazgos en archivos
  versionados.

### Pendiente para Codex

1. **[`CODEX-catalogo-no-desaparece.md`](CODEX-catalogo-no-desaparece.md)**:
   que el catálogo caducado se siga viendo con aviso y sin cifras vencidas.
   Urgente: el lote vence al terminar el 5 de octubre.
2. Al siguiente build de iOS: comprobar en el simulador que la app abre y
   funciona con el parche de Expo.

### Pendiente para Víctor

1. Renovar el catálogo antes del 5 de octubre (o que Codex termine la tarea 1
   y la publique antes).
2. Crear los dos secretos de la copia en GitHub y lanzar la primera copia
   (`docs/COPIAS-DE-SEGURIDAD.md`, parte 1).
3. ~~Unir esta rama a `main`.~~ Hecho el 1 de octubre: `main` incluye todo.
4. En la carpeta local, una vez: `git config user.name "Victor Jorques"` y tu
   correo de GitHub.
5. Si quieres que Claude revise la web real: permitir en la red del entorno
   `rwadar.pages.dev` y `exgpmjpaaebyoolpwced.supabase.co`.

# Publicación web y Android 1.3.2 · 22 de octubre de 2026

## Autorización y fuente

Víctor pidió en este chat publicar desde `main` de `victorJorques/RWADAR`,
comprobar primero la preview, publicar producción y después compilar Android
1.3.2 con el perfil editorial y distribuirlo como la 1.3.1.

Se leyeron el traspaso del 21/10, `INTERNO.md`, las secciones necesarias del
runbook y las instrucciones de la app. `git pull --ff-only origin main`
actualizó la carpeta desde `a7b9fe2` hasta `cf54532`. El repositorio fuente
sigue privado; el repositorio de descargas es público.

## Catálogo y preparación local

La lectura anónima real del 22/10 confirmó el lote del **21/10**
`c3b71e81-aa91-87fd-45c0-2277e401ac10`: 26 plataformas, 4 descartadas y 49
referencias. No se ejecutó SQL remoto ni se renovó la fecha de las fuentes.
La revisión dura hasta el 28/10. Las 49 ofertas tienen imagen propia y
correspondencia exacta entre su slug remoto, manifiesto y recurso móvil.

La aprobación recibida apuntaba a `911c046`, pero su snapshot web seguía con
datos del 6/10. El primer `--preview` con acceso de red se detuvo después de
sincronizar, antes de contactar a Cloudflare, por árbol Git modificado. Se
generó el corte con `--local`, se revisó y se consolidó su nueva huella.
Solo cambian `rwadar-site/assets/rwadar-20260820.js`, `index.html` y
`sitemap.xml`: datos/pre-render y fechas. El JS fuera de sus arrays y el HTML
fuera de datos y fechas permanecen idénticos a `cf54532`.

Los tres archivos locales sin seguimiento del manual se conservaron con
huellas SHA-256 en `rwadar-respaldo-local-20261022/respaldo.json`, fuera de
las rutas publicables. No se publican ni se incorporan a Git.

## Pruebas de la fuente final

- `npm ci` raíz y móvil terminaron con salida 0. Móvil coincide con las 567
  versiones del lock, sin modificar manifests, lock, configuración ni exclusiones.
- `npm test` completo: **salida 0**, web **502/502**, móvil **184/184**,
  base de datos completa, QR y herramientas correctos. Academy 7/9,
  noticias 3 y fichas 49/49 con foto al día.
- Los dos intentos previos toparon con permisos de temporales y loopback
  del sandbox. La ejecución final usó temporales del workspace y permisos
  para el servidor local; no se cambiaron pruebas para conseguir el resultado.
- `git diff --check` y escaneo proporcional de líneas añadidas: correctos,
  sin patrones de credenciales detectados.
- Tras incorporar el cierre al manifiesto, `probar-auditoria-relanzamiento.mjs`:
  **51 correctas, 0 fallidas**. Solo cambian documentos, evidencia del manifiesto
  y copias inertes de workflows; no se repite la compilación ni el despliegue.

Evidencia local en `rwadar-entrega-20261022/npm-test.log` y los informes JSON
del mismo directorio. Las pruebas locales no acreditan producción ni un APK
instalado.

## Android: controles previos

EAS confirmó plan Free, Android 4/15 y total 5/30 antes de compilar, cero
exceso, coste estimado y complementos. El código remoto era 15 (candidato
1.4.0 anterior); la siguiente compilación debe usar su incremento real.

`build:inspect --stage archive` produjo 93 archivos: únicamente fuente móvil,
configuración y recursos autorizados, incluidas las 49 imágenes nuevas y
cuatro ilustraciones de categoría. No hay enlaces simbólicos, archivos de
credenciales, otros proyectos, SQL, APK ni mapas. Los 54 recursos requeridos
por el módulo de imágenes existen.

Expo Doctor online actual pasa **20/21**, con seis recomendaciones de parches
del mismo SDK. La auditoría npm conserva avisos: no es una auditoría limpia.
La evaluación actual de alcance y compatibilidad está en
[`VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-22.md`](VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-22.md).

## Preview publicada y comprobada

Despliegue **`a54fa4e3`**, desde `main` en `9f5ab61`, con contenido aprobado
`0a49969`. Destinos: <https://a54fa4e3.rwadar.pages.dev> y
<https://revision.rwadar.pages.dev>.

- Comprobador HTTP oficial: **35/35**, salida 0.
- Comparación SHA-256 y bytes: **113/113 recursos idénticos**, sin fallos.
  `_headers` y `_redirects` son configuración de Pages, no recursos HTTP.
- Navegador real: Inicio, Buscar, ficha de Outeiro y Spiko con foto propia,
  rótulo editorial y alt IA; Spiko 2,40 % con fecha de fuente del 21/10.
- Sin desbordamiento horizontal a 320, 390 y 1440 px. Búsqueda de Spiko
  devuelve 1 de 26 plataformas. Índice Academy con siete lecciones abiertas.
- Perfil y formularios de entrada, alta y recuperación observados sin
  credenciales ni envío de correo. Comunidad y avisos permanecen próximos.
- Consola observada sin errores ni avisos. Tres capturas propias revisadas
  también por un segundo agente, sin bloqueos visuales concretos observados.
- Git limpio después de sincronizar, construir y desplegar.

Evidencia local: `http-preview.log`, `recursos-preview.json`,
`preview-spiko-390.png`, `preview-recuperar-320.png` y
`preview-escritorio.png` en `rwadar-entrega-20261022/`.

## Producción publicada y comprobada

Despliegue **`309687f0`**, desde `main` en **`8821228`**. El dominio canónico
<https://rwadar.pages.dev> responde con el mismo corte revisado en preview:
**35/35 controles HTTP** y **113/113 recursos idénticos**, incluidos el
manifiesto PWA y el service worker. Git quedó limpio después de desplegar.

En el navegador del dominio canónico se observaron el catálogo con fecha
21.10.2026 y las imágenes nuevas cargadas, sin errores ni avisos de consola.
La captura propia `produccion-escritorio.png` y los logs `http-produccion.log`
y `recursos-produccion.json` quedan en la carpeta local de evidencia.

La ruta `/android` devuelve 302 a la última release de GitHub. Antes de
publicar la app nueva seguía apuntando correctamente a la 1.3.1.
Después del lanzamiento Android se comprobó de nuevo: `/android` → 302 a
latest → 302 a `v1.3.2` → 200.

## Android 1.3.2 compilado

Compilación EAS **`25cff9b2-8937-4d2a-a0f5-0f91bbc2b198`**, solicitada el
22/10 a las **00:31:41 UTC**, versión **1.3.2**, código **16**, perfil
`editorial`, fuente **`882122874e8d329b7c7b3969f1c5613880db38a3`**. Se emplean
las credenciales de firma existentes con `--freeze-credentials`.

La compilación terminó correctamente a las **00:39:19 UTC**. El APK tiene
**88.777.561 bytes**, firma v2 válida y el mismo certificado que 1.3.1.
Su SHA-256 es `998d0aed3b183b8f045c36e2772421da806e0e0996e5513de8549ccc13f3fdf9`.
Incluye las 49 imágenes nuevas, idénticas por contenido a la fuente.

La [QA 39701844100](https://github.com/victorJorques/RWAdar-downloads/actions/runs/39701844100)
del mismo APK terminó con éxito, incluido su ZIP de evidencias. La primera
ejecución pasó el uso pero falló al superar el límite inicial del ZIP; se
repitió el mismo binario conservando todas las capturas y ampliando solo ese
límite. La revisión visual y el cierre de publicación se detallan en
[`VERIFICACION-ANDROID-1.3.2-2026-10-22.md`](VERIFICACION-ANDROID-1.3.2-2026-10-22.md).

La [release final 1.3.2](https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.3.2)
quedó pública a las **00:56:18 UTC**, como latest, sin estado draft ni
prerelease. La ejecución de publicación **39702655647** terminó con éxito.
La descarga anónima local independiente confirmó a las **00:58:05 UTC** el
APK exacto, su firma, las sumas y el ZIP de capturas de **13.679.319 bytes**.
La compilación permaneció dentro del plan gratuito: Android 5/15, total 6/30,
cero exceso, complementos o coste estimado. Los controles automáticos de
publicación se devolvieron a `NO`.

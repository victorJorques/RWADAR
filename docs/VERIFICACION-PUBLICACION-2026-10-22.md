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

## Estado pendiente al aprobar la preview

Producción y el APK nuevo todavía están pendientes de su ejecución y
verificación. Este apartado se actualizará con los resultados reales; no
reutiliza como prueba los de la 1.3.1.

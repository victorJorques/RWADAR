# RWAdar · vídeo promocional «Sigue la fuente» · 26/10/2026

Entrega **local terminada**, por petición de Víctor de crear una animación
promocional inspirada en el MOV adjunto y de dar motivos para usar la app.
No se ha publicado el vídeo, la web ni una versión de la aplicación.

## Entrega

- [MP4 principal](../rwadar-promo-2026-10-26/output/rwadar-sigue-la-fuente-1080p.mp4):
  24 segundos, vertical 1080 × 1920, 60 fps, 1.440 fotogramas, H.264 / AAC,
  15.696.988 bytes.
- [Copia ligera](../rwadar-promo-2026-10-26/output/rwadar-sigue-la-fuente-ligero.mp4):
  720 × 1280, 3.259.516 bytes.
- [Portada](../rwadar-promo-2026-10-26/output/portada.jpg),
  [reproductor local](../rwadar-promo-2026-10-26/ver-video.html) y
  [fuentes editables](../rwadar-promo-2026-10-26/rwadar-fuentes-editables.zip).
- [Instrucciones](../rwadar-promo-2026-10-26/LEEME.txt) y
  [verificación técnica](../rwadar-promo-2026-10-26/review/export-qa.json).

## Realización y mensaje

Animación 3D propia, renderizada por fotogramas en Chrome con Three.js:
tarjetas biseladas, dioramas conceptuales de inmuebles/oro/crédito, tokens,
radar, cámara con paralaje y una señal verde que conecta los planos.
Postproducción con bloom gaussiano, viñeta, grano fino y transiciones sobre
el pulso musical. Tipografía Geist y marca procedentes del proyecto.

El recorrido presenta la dificultad de empezar entre información dispersa,
organiza la búsqueda en el radar y muestra tres usos: encontrar plataformas,
consultar fuentes y aprender con Academy. Cierra con «Abre RWAdar» y
«Explora gratis». No promete rentabilidad ni anuncia disponibilidad en tiendas.

La música y los efectos son originales, sintetizados para esta pieza a
120 BPM. Golpes principales en 0, 3, 7, 11, 16 y 20 segundos; pasos interiores
ajustados al pulso. El MOV de referencia se utilizó para analizar el lenguaje
visual; no se incorporó su imagen ni su audio al montaje final.

## Procedencia de las pantallas

Las pantallas auténticas de Inicio, catálogo y Academy **son del 22/10/2026**,
del APK 1.3.2 y de su verificación aprobada. Proceden de
`rwadar-entrega-20261022/qa-review-39701844100/evidence/`. Se quitaron las
barras del sistema Android y se conservó la proporción. La ilustración de
Casa de Outeiro mantiene su rótulo «Ilustración editorial» y no presenta una
cifra de rentabilidad. El
[manifiesto](../rwadar-promo-2026-10-26/assets/product/capture-manifest.json)
conserva rutas, fechas, dimensiones, recorte y sumas.

No son capturas nuevas ni prueban el funcionamiento nativo actual. El intento
de captura nueva de la web se atascó; no se realizaron nuevos intentos después
del cierre de ese diagnóstico. Tampoco se eludió el bloqueo del control visual
de Chrome, que no pudo determinar la URL de la ventana en Windows. El render
local de la animación es una operación distinta y no accede a cuentas.

## Verificación de la entrega

`source/verify_export.py` pasó sus 14 comprobaciones sobre el MP4 principal:
formato, resolución, frecuencia, conteo real de fotogramas, duración, audio,
descodificación completa sin errores, extracción de muestras visuales y
metadatos faststart. Medición del **AAC final**: −14,1 LUFS integrados,
pico verdadero −1,7 dBTP y rango de sonoridad 1,9 LU.

Se inspeccionaron 48 muestras del MP4 final, una cada medio segundo, además
del teléfono, el cierre y los dos fotogramas contiguos de la unión en 12 s.
No se observó discontinuidad en esa unión ni solapes en el cierre definitivo.
La revisión creativa independiente corrigió el exceso de texto en el bloque
de fuentes, el solapamiento inicial del cierre y el bloom que repetía bordes.
Las pantallas definitivas quedan libres de las etiquetas decorativas que
tapaban parte de la interfaz en una preview.

El render inicial de la primera mitad terminó el MP4 y después devolvió error
por precargar tres imágenes todavía no preparadas, que esa mitad no utiliza.
La segunda mitad se renderizó con las imágenes presentes. La entrega unida
pasó la descodificación y la revisión de fotogramas del archivo final.

Estas comprobaciones no equivalen a escucha humana ni a una reproducción
perceptiva completa del vídeo. El intento de mostrar el MP4 en Codex devolvió
estado `queued`; no se afirma que el usuario lo haya reproducido.

SHA-256 del MP4 principal:
`350d236cfe272710609caffc7187617df5459b634f8e65bb28e13108d0b29868`.

## Alcance local

Sin servicios de generación de pago, créditos externos, cargas de material
privado, inicio de sesión, SQL, compilaciones móviles ni publicaciones.
No se modifica el producto ni se ejecuta `npm test`, al ser una entrega de
medios con verificaciones específicas. Se conservan los cambios compartidos
que ya tenía esta carpeta. Sin commit de esta sesión; las fuentes y los
entregables están en la carpeta local indicada.

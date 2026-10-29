# RWAdar · anuncio de app y web · 27 de octubre de 2026

Revisión local de 30 segundos entregada como corte del director. Sustituye
como propuesta vigente al montaje de Valencia del 26/10 y al corte de 26 s
de esta sesión, cuya voz Elvira rechazó Víctor. No se ha publicado.

## Archivos vigentes

- [Full HD](../rwadar-comercial-valencia-v2-2026-10-27/output/rwadar-mas-cerca-app-y-web-1080p.mp4):
  19.361.654 bytes, 1920 × 1080, 24 fps, 720 fotogramas, 30 segundos.
- [Para compartir](../rwadar-comercial-valencia-v2-2026-10-27/output/rwadar-mas-cerca-app-y-web-compartir.mp4):
  4.810.301 bytes, 1280 × 720, H.264 y AAC.
- [Reproductor](../rwadar-comercial-valencia-v2-2026-10-27/ver-corte-director.html),
  [instrucciones](../rwadar-comercial-valencia-v2-2026-10-27/LEEME-DIRECTOR.txt)
  y [hoja de contacto del MP4 final](../rwadar-comercial-valencia-v2-2026-10-27/review/director-final-contact.jpg).

## Dirección y montaje

La interfaz de RWAdar aparece durante **20,708 de los 30 segundos**. La mujer,
Valencia y el perro enmarcan brevemente una historia de descubrimiento. El
bloque central muestra dispositivos 3D con pantallas auténticas a gran tamaño,
detalle de una oferta y el conjunto web/app. Tres planos nuevos reducen la
inmovilidad y eliminan el ralentizado largo del primer anuncio.

La navegación es una grabación de acciones reales en el código React Native
de `rwadar-movil`, ejecutado en **Expo Web**, en contexto de navegador aislado:
Inicio → Buscar → búsqueda Casa → Casa de Outeiro → ficha y desplazamiento →
cierre → Plataformas/radar/listado. No es una grabación del APK Android ni una
nueva validación en un teléfono. Se recibieron cuatro respuestas públicas GET
200 del catálogo real, sin fixtures, mocks ni datos inventados. Auth, favoritos
y escrituras remotas estuvieron bloqueados. Fuente y dependencias intactas;
el servidor temporal quedó cerrado.

Se seleccionaron 14 segundos de la grabación original a velocidad normal,
quitando preparación y pausas. Se retiró el relleno gris añadido por el
grabador alrededor del viewport; no se repintaron la UI ni sus avisos.
Las condiciones, cifras ocultas y etiquetas «Ilustración editorial» permanecen.
El cierre sostiene un fotograma real del radar. La web pública se capturó el
27/10; las imágenes nativas de apoyo proceden de la QA del 22/10.

Aviso final acordado con Víctor:

> La inversión en activos tokenizados no está exenta de riesgos.

No se muestra una compra ficticia dentro de RWAdar, propiedad automática,
rentas garantizadas ni una cartera personal inventada. El edificio de la
ficción no se identifica como una oferta del catálogo.

## Voz y mezcla

Víctor rechazó Elvira por robótica e Ines por acento latino. Ambas quedan
descartadas del archivo vigente. La nueva toma se generó con dirección
explícita de narradora original de Madrid y tono conversado. Su guion completo
coincide con la transcripción local. Esto **no certifica el acento ni la
actuación por escucha humana**; la locución continúa siendo generada y la
valoración creativa corresponde a escuchar esta revisión.

La música Cat Walk, de Arulo, se editó sobre su drop real a 7,5 s, con respiro
en hogar y resolución en el cierre. La voz conserva tono, velocidad,
respiraciones y pausas internas. Mezcla con atenuación musical y foley discreto.
La licencia documentada cubre web, redes y publicidad online; el aspecto de
spot televisivo no acredita licencia para emitir la música en televisión.

## Comprobaciones

- Las dos copias finales se descodificaron completas con `ffmpeg -xerror`.
- La principal conserva 720 fotogramas, 24 fps, H.264/yuv420p, AAC estéreo de
  48 kHz y duración de 30 segundos.
- El AAC del final con navegación es idéntico, bit a bit, al del corte director
  ya medido: **−14,22 LUFS, −1,17 dBTP, LRA 7,0 LU**. No se repitió una batería
  de audio sin cambios; la identidad del flujo comprimido se verificó por hash.
- La última frase termina completa a 28,303 s, con margen hasta el cierre.
- Codex revisó el recorrido y la hoja final; otro agente inspeccionó muestras
  del archivo final a 12,5, 19 y 27 s sin encontrar solapes, avisos truncados
  ni fallos visuales bloqueantes. Es una revisión visual muestreada.
- La primera reproducción visible se pausó a 4,216 s, sin error del medio;
  no se presenta como reproducción completa ni como escucha humana.
- Después se reprodujeron los **30 segundos completos** en un contexto de
  Chrome aislado, en silencio: evento `ended`, cero fotogramas perdidos y cero
  errores del medio. Esta prueba confirma reproducción; no escucha humana.

Evidencia y fuentes en `review/director-export-qa.json`,
`review/final-audio-identical.json`, `review/director-final-audio-qa.json`,
`review/navigation-editorial-cuts.json`, `review/app-runtime/` y
`assets/video/app-navigation-real.json`, dentro de la carpeta de producción.

SHA-256 del MP4 principal:
`424c43ec40787111fd1088bd3561b8b74c300a5a93601aedc370ce4c2cec4ec4`.

## Consumo y límites

Esta revisión consumió **53,25 créditos** adicionales: tres planos, 15; voz
Ines descartada, 0,75; toma interpretada nueva, 37,5. El total acumulado de la
producción es **615,95 de los 650 autorizados**, comprobado contra saldo
1.066,30. Sin compras ni cambios de plan. El registro conserva los trabajos.

No hay publicación, SQL remoto, investigación de catálogo, cuentas, cambios de
producto, APK/OTA nuevo, push ni commit. Se conserva el WIP compartido.

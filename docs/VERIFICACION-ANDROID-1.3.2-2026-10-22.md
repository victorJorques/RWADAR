# RWAdar Android 1.3.2 · verificación del 22 de octubre de 2026

## Estado de la entrega

**Android 1.3.2/código 16 está publicado como versión final y última descarga. El APK público es idéntico al compilado, probado en un emulador Android 15 y revisado visualmente.**

La evidencia de uso corresponde al binario nuevo; las pruebas de 1.3.1 se conservan como históricas. La descarga pública se comprobó por separado después del workflow de release.

Víctor autorizó publicar la web desde main, compilar Android con el perfil editorial y distribuir 1.3.2 como la 1.3.1. Se hizo una sola compilación y se reutilizó para toda la QA y la distribución. No se cambiaron credenciales.

## Fuente y compilación terminada

| Dato | Valor comprobado |
|---|---|
| Repositorio fuente | `victorJorques/RWADAR`, privado |
| Commit fuente exacto del APK | `882122874e8d329b7c7b3969f1c5613880db38a3` |
| Cuenta EAS | `trapis-team` |
| Proyecto EAS | `43de8651-0c57-40fc-8cdb-c9a8c72e6835` |
| Build | `25cff9b2-8937-4d2a-a0f5-0f91bbc2b198` |
| Estado EAS | `FINISHED` |
| Perfil y plataforma | `editorial`, `ANDROID` |
| Versión/código | **1.3.2 / 16** |
| Creación | **2026-10-22 00:31:41.020 UTC** |
| Finalización | **2026-10-22 00:39:19.248 UTC** |
| Verificación local final | **2026-10-22 00:40:52.134 UTC** |

[Build en EAS](https://expo.dev/accounts/trapis-team/projects/rwadar/builds/25cff9b2-8937-4d2a-a0f5-0f91bbc2b198).
[Artefacto APK oficial](https://expo.dev/artifacts/eas/tXOv6yjJzj71MReCmcRunqCqo_lK4sEwkZQpGV7vOLY.apk).

Los metadatos leídos mediante EAS CLI 21.8.0 confirman commit, versión, código, perfil, plataforma, proyecto y cuenta. Se guardaron únicamente campos relevantes; no se copiaron URLs firmadas de logs ni credenciales. El contador remoto previo era 15 y esta compilación editorial usó el incremento a 16; no se compiló una versión alternativa para este corte.

## Preparación y dependencias

`npm ci` móvil terminó con código 0. Se cotejaron **567 versiones instaladas** con el lock: **cero diferencias**, sin modificar manifests ni locks. El postinstall existente aplicó el parche UUIDv5 de ExpoModulesCore; se confirmó en Swift la copia limitada a 16 bytes.

SHA-256 del lock móvil: `a3e2546af63a9000831a1f20766df2eae127ff8b25143b6d4ac1ab85b48a3bb9`.

La suite completa coordinada después de instalar las dependencias terminó con **código 0**: web **502/502**, móvil **184/184**, base, QR y herramientas correctas. Estas son pruebas de fuente y comportamiento simulado; no prueban por sí mismas el APK instalado ni producción.

**Expo Doctor actual pasó 20/21**, con código 1 por seis recomendaciones de parches más recientes dentro de SDK 57. La comparación adicional con el mapa incluido en el Expo 57.0.27 fijado pasó **18/18** dependencias directas mapeadas. El diagnóstico offline separado no se presenta como Doctor 21/21.

**npm audit no está limpio:** raíz 1 paquete alto; móvil completo 21 avisos de paquetes (17 altos, 4 moderados), y móvil sin dev 19 (16 altos, 3 moderados), cero críticos. Los avisos y su alcance están detallados en [`VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-22.md`](VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-22.md). No se ejecutó `audit fix`, no se añadió una exclusión y no se cambió el lock para silenciar estos resultados.

## Identidad del binario exacto

| Dato | Valor |
|---|---|
| Archivo local | `rwadar-entrega-20261022/RWAdar.apk` |
| Tamaño | **88.777.561 bytes** |
| SHA-256 | `998d0aed3b183b8f045c36e2772421da806e0e0996e5513de8549ccc13f3fdf9` |
| Paquete | `com.rwadar.app` |
| Versión/código en el manifiesto del APK | **1.3.2 / 16** |
| Firma | APK Signature Scheme **v2 válida** |
| Firmantes | **1**, RSA de **2048 bits** |
| Certificado SHA-256 | `f506dea70ad644184161542d583455d2ad849c4dea3fffa0469c9ca400f58b72` |

La descarga anónima desde la URL oficial EAS se repitió durante la verificación: el archivo existente y los bytes descargados coinciden. `apksigner` oficial ya instalado terminó con código 0 y el resultado `Verifies`; el certificado es el mismo usado por 1.3.1. Se conservaron la salida de firma y la suma local.

Se usaron las herramientas ya disponibles en `rwadar-herramientas-apk-20260928/`: `aapt` **v0.2-13193326**, `apksigner` **0.9** y Java **21.0.12.1**. No se descargaron herramientas ni credenciales durante esta comprobación.

## Manifiesto y permisos efectivos

`aapt dump badging` y `aapt dump xmltree` comprobaron el APK descargado, no solo la configuración fuente:

- Android mínimo **API 24**, objetivo **API 36**.
- `android:allowBackup=false`.
- `expo.modules.updates.ENABLED=false`: OTA apagado en el manifiesto real.
- No aparecen `debuggable=true` ni `usesCleartextTraffic=true` explícitos.
- Exactamente estos **cuatro permisos**, sin otros permisos ni variantes SDK adicionales:

```text
android.permission.ACCESS_NETWORK_STATE
android.permission.INTERNET
android.permission.VIBRATE
com.rwadar.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION
```

No declara permisos de notificaciones push, micrófono, lectura/escritura de almacenamiento externo, superposición, arranque, biometría ni contadores OEM. La inspección del manifiesto no sustituye las comprobaciones de permisos remotos de Supabase ni el funcionamiento de cada función nativa.

## Catálogo visual e inventario del APK

El archivo ZIP interno del APK tiene **1.349 entradas**, **109.689.506 bytes sin comprimir** y CRC correcto en todas las entradas. No hay rutas duplicadas ni rutas de extracción inseguras en el inventario examinado. El bundle `index.android.bundle` ocupa **2.690.504 bytes**.

Las **49 WebP editoriales de las fichas del 21/10 están incluidas y son idénticas byte a byte a la fuente**, comprobadas mediante SHA-256. El empaquetador Android renombra los recursos a rutas como `res/XX.webp`, por lo que la correspondencia se estableció por hash de contenido. El inventario conserva para cada imagen fuente las rutas del recurso empaquetado que coincide; no se dedujo su presencia solo por nombres o capturas.

Una primera comprobación auxiliar buscó nombres legibles y no pudo correlacionar los recursos renombrados. Su diagnóstico se conservó como `apk-132-zip-summary-name-probe.json`; la comprobación posterior por contenido pasó **49/49** sin modificar ni recompilar el APK. No fue un fallo del binario.

El examen de rutas no encontró `.env`, keystores, claves privadas con las extensiones examinadas, SQL ni mapas JavaScript. El único PEM es `assets/expo-root.pem`, con SHA-256 `901e7b0da287ca154fc09d982d37769b09ee291255b239265b5b0a8b75165baa`, idéntico al del APK 1.3.1 conservado localmente: es el certificado público de Expo.

Este inventario y las búsquedas de rutas **no son un análisis exhaustivo de los recursos, el código nativo o el bundle Hermes**, ni una garantía de ausencia de secretos con otro formato o de toda vulnerabilidad.

## Cuota y coste después de terminar

La consulta EAS a las **2026-10-22 00:40:46.079 UTC**, posterior al estado `FINISHED`, confirmó:

| Concepto | Resultado |
|---|---:|
| Plan | **Free** |
| Android utilizado | **5/15** |
| Total utilizado | **6/30** |
| iOS utilizado | **1/15** |
| Compilaciones con exceso | **0** |
| Coste de exceso | **0 céntimos** |
| Facturación total estimada | **0 céntimos** |
| Complementos | **0** |

La API no devolvió una próxima factura; el valor de cero corresponde a su estimación actual, no a una factura nueva emitida. No se contrataron planes, complementos ni servicios durante esta subtarea.

## QA del APK exacto

La primera [ejecución 39701178744](https://github.com/victorJorques/RWAdar-downloads/actions/runs/39701178744), trabajo `119570510177`, pasó la identidad, instalación, arranque y todas las comprobaciones de uso. Su resultado global fue **failure** porque el ZIP final de capturas superó el límite inicial de 12 MiB. No produjo un ZIP revisable y no se usó para autorizar la release.

Se amplió exclusivamente el límite del ZIP a 24 MiB, manteniendo el límite total extraído de 24 MiB, 4 MiB por archivo, 200 entradas y los controles de nombres, CRC y huellas. Se conservan todas las capturas y las mismas aserciones. La nueva [ejecución 39701844100](https://github.com/victorJorques/RWAdar-downloads/actions/runs/39701844100), intento 1, trabajo `119572672939`, usa el commit público `3b366a3b6e71746e0d8609feaf1e6820b529f96d` y **el mismo APK**, sin recompilar.

La segunda ejecución terminó **success**. Sus logs abarcan las **00:47:55–00:52:13 UTC**. Pasaron instalación y arranque del APK firmado, las cuatro pestañas, 26 plataformas y 49 referencias (24/21/4), detalle documental de Spiko, siete lecciones de Academy y una lección abierta, favorito conservado después de reiniciar y los cuatro formularios de cuentas. Se probaron validación vacía y campos de contraseña enmascarados, sin introducir credenciales ni aceptar las condiciones de alta.

Se muestrearon tarjeta y detalle de **Spiko, Casa de Outeiro, Prosegur Digital Gold, Fotovoltaica GreenPoint y Houston 3**. Las diez capturas se revisaron con sus imágenes específicas, lugares y tres pasos legibles, rótulo «Ilustración editorial», controles visibles y sin solapes observados. Un segundo agente revisó de forma independiente Outeiro, Prosegur y GreenPoint; otro revisó entrada, alta, recuperación, confirmación, Perfil y favorito persistente. La separación nativa medida entre panel de recuperación y nota de favoritos es **92 px**, superior al mínimo de 40. `app-errors` y `final-errors` están vacíos; el mensaje de Chromium sobre la semilla de variations no es un fallo de la app.

El log completo ocupó **19.334.013 bytes**, SHA-256 `ab4d1b33326d4f00d620bcc12525bbba01c73ac9fde09c056af90d2d32ff5f7d`. El conector no pudo transportar ese volumen; se recuperó el trabajo exacto con la autenticación Git existente, mantenida solo en memoria. No se guardaron ni imprimieron credenciales ni URLs firmadas.

El ZIP reconstruido de los logs tiene **13.679.319 bytes**, SHA-256 **`2169efb89b58b3430196aab389f5ce46aaad122f826ff0d636c0c39c650d4041`**, 73 archivos y 15.245.120 bytes extraídos. Se comprobaron sus 17.812 fragmentos, orden, base64, tamaño, SHA, nombres, CRC y la identidad del APK, ejecución y commit en `result.json`. El valor `editorialVisualReviewCompleted=false` de ese JSON se conserva: la QA automática no afirma la revisión visual posterior por los agentes, que queda documentada aquí y en la compuerta separada de publicación.

La inspección de formularios sin introducir credenciales ni enviar mensajes no demuestra alta/inicio/baja reales, SMTP ni recuperación efectiva. Una prueba en emulador no es una prueba en teléfono físico.

## Publicación y descarga permanente comprobadas

La [ejecución de publicación 39702655647](https://github.com/victorJorques/RWAdar-downloads/actions/runs/39702655647), intento 1, commit público `77371f17580f05a21c6bc983b71b7890dcf89fb8`, terminó **success** entre las **00:55:52 y 00:56:24 UTC**. Pasaron la compuerta de QA exacta (trabajo `119575295969`) y la publicación (trabajo `119575328146`). El commit de publicación es posterior al de QA; la compuerta liga la evidencia y el destino de la etiqueta al commit QA, sin confundir ambos.

La compuerta volvió a descargar el APK y reconstruir la evidencia, comprobó sus identidades y los campos de `result.json`, creó un borrador nuevo y descargó sus tres archivos para cotejarlos antes de publicarlo. Después verificó de nuevo anónimamente el APK y ZIP públicos.

La API pública confirma la release **`420197570`**, etiqueta **`v1.3.2`**, publicada el **22/10/2026 a las 00:56:18 UTC**, con `draft=false`, `prerelease=false` y como **latest**:

- [Página final de RWAdar 1.3.2](https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.3.2).
- [RWAdar.apk](https://github.com/victorJorques/RWAdar-downloads/releases/download/v1.3.2/RWAdar.apk): **88.777.561 bytes**, SHA-256 `998d0aed3b183b8f045c36e2772421da806e0e0996e5513de8549ccc13f3fdf9`.
- [SHA256SUMS.txt](https://github.com/victorJorques/RWAdar-downloads/releases/download/v1.3.2/SHA256SUMS.txt): **175 bytes**, dos sumas exactas; SHA-256 del propio archivo `eb88a5b1ca564c860db6ca88aabb7a9d9066f41b9e0e830ec37f3e47e57123aa`.
- [Evidencia del APK](https://github.com/victorJorques/RWAdar-downloads/releases/download/v1.3.2/rwadar-android-132-evidence.zip): **13.679.319 bytes**, SHA-256 `2169efb89b58b3430196aab389f5ce46aaad122f826ff0d636c0c39c650d4041`.

La comprobación local independiente terminó con **código 0 a las 00:58:05 UTC**. Se consultó latest y se descargaron los tres archivos **sin credenciales** a una carpeta nueva. API, tamaño, huellas y sumas coinciden; el APK público mantiene versión 1.3.2/código 16, firma v2 válida, un firmante y el certificado de 1.3.1. El ZIP público conserva CRC/rutas válidos y el resultado ligado a QA `39701844100`/commit `3b366a3…`. El coordinador volvió a calcular ambas huellas locales y confirmó esos valores.

La ruta web **`/android` → 302 → `releases/latest` → 302 → `releases/tag/v1.3.2` → 200** se comprobó anónimamente a las **00:57:46 UTC**.

Los controles `PUBLICAR_RELEASE` y `VISUAL_REVIEWED` se devolvieron a **`NO`** en el commit público `340a9062be343c0995aaa4d3a7c8162fd568c5bd`, enviado a su rama con `[skip ci]`. Las copias privadas en `.github/pruebas-android/` quedan inertes y conservan los metadatos exactos de esta entrega. Validación final: dos YAML, 12 scripts Bash y nueve bloques Python correctos.

Esta entrega es un APK firmado para descarga directa, con el mismo certificado de actualización que 1.3.1; no es una publicación en Google Play o App Store. No se contrató ningún plan ni servicio adicional.

## Evidencia local conservada

Directorio de trabajo: `rwadar-entrega-20261022/`.

- `build-132-metadata.json`: metadatos EAS sanitizados y URL oficial del APK.
- `RWAdar.apk`, `SHA256SUMS-apk.txt`, `apk-132-verification.json`: binario exacto y resultado final de su validación local.
- `apk-132-signature.txt`, `apk-132-package.txt`, `apk-132-manifest.txt`: salidas de herramientas oficiales.
- `apk-132-zip-inventory.json`, `apk-132-zip-summary.json`: inventario, CRC, bundle, PEM y 49 correspondencias por contenido.
- `eas-usage-after-build.json`: cuota y estimación de coste tras finalizar.
- `DEPENDENCIAS-2026-10-22.md`, `dependency-preflight.json` y sus JSON/logs: instalación, compatibilidad, Doctor 20/21 y audit no limpio.
- `npm-test.log`: suite completa de fuente posterior a instalar dependencias móviles.
- `qa-39701844100.log`, `qa-review-39701844100/` y `visual-review-132.json`: log, ZIP reconstruido, capturas, resultado y revisión posterior por los agentes.
- `public-132-0vD3yy/verification.json`, APK, ZIP, sumas y salidas oficiales: descarga pública independiente y comprobación final.
- `android-public-route.json`: redirecciones hasta la release nueva.

No se incorporaron enlaces firmados de logs ni material de firma privado al informe o a estos resúmenes.

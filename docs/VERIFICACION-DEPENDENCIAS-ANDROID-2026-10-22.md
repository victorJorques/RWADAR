# Dependencias de RWAdar · revisión del 22/10/2026

## Resultado y alcance

Se reinstalaron las dependencias móviles **exactamente desde el lock aprobado de main**, sin cambiar `package.json`, `package-lock.json`, `app.json`, `eas.json` ni `.easignore`. No se ejecutaron `audit fix`, actualizaciones, exclusiones de Expo Doctor, compilaciones, publicaciones ni consultas de valores de credenciales en esta subtarea.

**La auditoría no está limpia.** Expo Doctor en línea pasó **20/21**, con una comprobación fallida por seis recomendaciones de parches más recientes dentro de SDK 57. La comparación independiente con el mapa incluido en el Expo realmente fijado pasó **18/18**. No se identificó un bloqueo concreto de compatibilidad o seguridad para compilar este lock sin cambios; los avisos y los parches pendientes se mantienen explícitos. Esta conclusión no es una garantía de ausencia de vulnerabilidades ni sustituye las comprobaciones del APK firmado.

## Instalación y fidelidad al lock

Antes de instalar se confirmó que `C:/Users/vcicr/Downloads/rwadar-movil/node_modules` era un directorio normal dentro del proyecto, sin junction ni otro reparse point. Se esperó a que acabara el uso de esas dependencias por la suite del otro agente.

`npm ci --no-fund` en `rwadar-movil` terminó con **código 0**: instaló **567 paquetes** desde el lock y ejecutó el `postinstall` existente. Después se compararon las **567 versiones de paquetes instalados** con el lock: **cero diferencias**. Las huellas anteriores y posteriores de los cinco archivos de fuente/configuración comprobados coinciden; no se cambió el lock para intentar silenciar avisos.

Versiones verificadas: Expo **57.0.27**, constants **57.0.21**, notifications **57.0.22**, updates **57.0.25**, modules-core **57.0.21**, React Native **0.86.3**, Supabase JS **2.112.1**.

SHA-256 de los locks vigentes:

| Archivo | SHA-256 |
|---|---|
| `package-lock.json` | `dd18f83829b648ad4d962a5ce4c66c05f1745f0f4e3be69e3409c9fed50c95cc` |
| `rwadar-app/package-lock.json` | `7f1107f25628a5a83b71f747f0d21b346c697682b2286ba97ca0ab18ffc38143` |
| `rwadar-movil/package-lock.json` | `a3e2546af63a9000831a1f20766df2eae127ff8b25143b6d4ac1ab85b48a3bb9` |

El backend instalado se contrastó con sus **16 entradas** del lock: cero entradas ausentes y cero diferencias de versiones; tampoco usa junction. No se reinstaló ni cambió el backend en esta subtarea.

## Expo Doctor: 20/21 en línea

Se ejecutó el Expo Doctor oficial **1.20.4 ya instalado**, sin descargar otro CLI. Terminó con **código 1**, **20/21** comprobaciones correctas. El único fallo es `Check that packages match versions required by installed Expo SDK`:

| Paquete | Instalado desde lock | Recomendado en línea |
|---|---:|---:|
| `@expo/metro-runtime` | 57.0.16 | ~57.0.17 |
| `expo` | 57.0.27 | ~57.0.31 |
| `expo-constants` | 57.0.21 | ~57.0.22 |
| `expo-crypto` | 57.0.3 | ~57.0.4 |
| `expo-notifications` | 57.0.22 | ~57.0.23 |
| `expo-updates` | 57.0.25 | ~57.0.26 |

El código del CLI instalado muestra que combina el mapa local `expo/bundledNativeModules.json` con versiones remotas y da preferencia a estas últimas, incluso para permitir distribuir correcciones urgentes. Por eso el fallo en línea no se elimina ni se presenta como irrelevante.

Se comprobó además, con `semver.satisfies`, cada dependencia directa que figura en el mapa de **Expo 57.0.27** incluido en el paquete instalado: **18/18 compatibles**, incluidos React 19.2.3 y React Native 0.86.3. No se encontró una mezcla interna de versiones contraria a ese mapa fijado. Un `expo install --check --json` adicional en modo offline devolvió código 0, pero el propio CLI avisa de que esa validación offline es menos fiable: se conserva como evidencia separada y **no convierte el Doctor en 21/21**.

### Parches posteriores y uso real en RWAdar

Los changelogs primarios se leyeron durante esta revisión; para notifications y modules-core se consultó también el contenido actual de `sdk-57` mediante GitHub porque la copia del lector web estaba atrasada.

- [Expo 57.0.28–57.0.31](https://github.com/expo/expo/blob/sdk-57/packages/expo/CHANGELOG.md), [constants 57.0.22](https://github.com/expo/expo/blob/sdk-57/packages/expo-constants/CHANGELOG.md), [metro-runtime 57.0.17](https://github.com/expo/expo/blob/sdk-57/packages/@expo/metro-runtime/CHANGELOG.md) y [updates 57.0.26](https://github.com/expo/expo/blob/sdk-57/packages/expo-updates/CHANGELOG.md) declaran que no añaden cambios visibles para el usuario. Esto no demuestra por sí solo que sus dependencias transitivas sean idénticas.
- [Crypto 57.0.4](https://github.com/expo/expo/blob/sdk-57/packages/expo-crypto/CHANGELOG.md) corrige `digest()` cuando recibe `ArrayBuffer` o `DataView` en Android/iOS. La fuente de RWAdar usa `Crypto.randomUUID()`; no se encontró una llamada a `Crypto.digest()` ni `digestString`.
- [Notifications 57.0.23](https://github.com/expo/expo/blob/sdk-57/packages/expo-notifications/CHANGELOG.md) corrige un cierre al importar el módulo en **Expo Go en Android**. La entrega solicitada es un APK independiente firmado y mantiene push apagado.
- [Modules-core 57.0.22–57.0.24](https://github.com/expo/expo/blob/sdk-57/packages/expo-modules-core/CHANGELOG.md) recoge cambios de layout de Compose Host, accesorio SwiftUI e inicio con módulos precompilados en Xcode 27. No se encontró `@expo/ui`, `RNHostView` ni `ModalBottomSheet` en la fuente/lock de RWAdar. No se ha demostrado que esas vías afecten a este Android; su ejecución se comprobará con el APK final.

### Parche UUIDv5 existente

El `postinstall` imprimió que el parche de `expo-modules-core/ios/Uuidv5/Uuidv5.swift` se aplicó. Se comprobó el archivo instalado: `capacity: 16` y `digest.prefix(16).enumerated()` están presentes; no está la copia con `capacity: 20`. Se mantiene el parche existente, sin añadir plugins ni modificar Expo. Es código Swift de iOS; esta comprobación no debe atribuirse como una prueba nativa Android ni confundirse con el advisory del paquete npm `uuid`.

## npm audit: avisos actuales

Las consultas a npm terminaron con **código 1 por avisos**, no por un error de red. Los tres JSON se guardaron localmente:

| Alcance | Total | Altos | Moderados | Críticos |
|---|---:|---:|---:|---:|
| Raíz | 1 | 1 | 0 | 0 |
| Móvil completo | 21 | 17 | 4 | 0 |
| Móvil `--omit=dev` | 19 | 16 | 3 | 0 |

Los totales son paquetes afectados y propagación transitiva; no equivalen a 21 o 19 vías explotables demostradas en el APK. Tampoco se debe reutilizar el total histórico de 23 como si describiera la consulta de hoy.

### Raíz: sharp 0.35.3

El paquete raíz afectado es la dependencia de desarrollo `sharp` **0.35.3**, con dos avisos: [libheif](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) y [librsvg](https://github.com/advisories/GHSA-wq5f-xc86-pv6w). El upstream describe posibles problemas de ejecución de código bajo ciertas condiciones en Linux glibc al procesar imágenes no fiables; los parches indicados son sharp 0.35.4 y 0.35.5, respectivamente.

En este repositorio sharp se usa para generar localmente fotografías editoriales y `og.png`; está ausente del lock móvil y de los scripts de publicación/sincronización. La web distribuida es estática. `generar.mjs --comprobar`, utilizado por `npm test`, termina antes de cargar sharp. Para esta entrega se reutilizan los activos ya generados: no se identificó una exposición de runtime de sharp en la web o APK. El riesgo del tooling persiste para un futuro procesado de HEIF/SVG no fiable; no se actualizó sharp durante este corte.

### Móvil: advisories y frontera de runtime

- [Braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm): agotamiento de pila con patrones muy anidados; la versión afectada llega por micromatch/Metro. El advisory revisado no anuncia versión corregida. RWAdar no importa esas herramientas en su código de aplicación.
- [Node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv): comprobación RSA PKCS#1 v1.5 defectuosa, propagada por herramientas/certificados de Expo. El advisory revisado no anuncia versión corregida. La fuente de la app no importa forge y OTA sigue apagado; se debe comprobar también el manifiesto del APK resultante.
- [UUID npm](https://github.com/uuidjs/uuid/security/advisories/GHSA-w5hq-g745-h8pq): afecta a métodos v3/v5/v6 con buffer externo mal acotado. La fuente de RWAdar usa la generación de UUID de Expo Crypto y no importa estos métodos npm. El paquete npm `uuid` y el parche Swift UUIDv5 anterior son componentes distintos.
- [HTTP cache semantics](https://github.com/advisories/GHSA-ch52-4w7c-c8xp): posible filtración entre usuarios de una caché compartida con `max-stale`. `npm explain` confirma la única cadena local **dev**: `@expo/ngrok → got → cacheable-request → http-cache-semantics 4.2.0`. La fuente de la app no importa esa cadena y el aviso desaparece de `audit --omit=dev`.

Estas búsquedas de imports y la separación dev/runtime acotan las vías encontradas; **no son una descompilación ni inventario nuevo del JavaScript Hermes del APK firmado**. No se afirma ausencia absoluta de vulnerabilidades. No se aceptaron los downgrades incompatibles que propone npm para eliminar algunos avisos.

## Validación coordinada y lo que falta

Después de `npm ci` móvil, el agente que coordinó las pruebas ejecutó `npm test` completo fuera del bloqueo de loopback del sandbox: terminó con **código 0**, web **502/502**, móvil **184/184**, base, QR y herramientas correctas. Su evidencia está en `npm-test.log`; esta subtarea no duplicó la suite móvil ni atribuye aquellas pruebas a un APK instalado.

La siguiente fase aún debe comprobar el APK 1.3.2 exacto: metadatos EAS, hash, bytes, firma, permisos/manifest, instalación y navegación nativa, capturas, y descarga pública idéntica al binario probado. Este informe no prueba Auth nativo con credenciales reales, SMTP, hardware físico ni publicación.

## Evidencia local

Todos los archivos siguientes quedan bajo `C:/Users/vcicr/Downloads/rwadar-entrega-20261022/`, fuera de la fuente pública y del archivo EAS:

- `npm-ci-mobile.log`: instalación y postinstall, código 0.
- `mobile-source-hashes-before-ci.json` y `mobile-install-verification.json`: hashes, 567 versiones, cero cambios y parche UUID.
- `expo-doctor.log`: ejecución en línea **20/21**, código 1.
- `expo-bundled-compatibility.json`: comparación independiente **18/18** con el SDK fijado.
- `expo-bundled-version-check.log`: diagnóstico offline adicional, sin sustituir Doctor.
- `audit-root.json`, `audit-mobile-full.json`, `audit-mobile-prod.json`: respuestas actuales de npm.
- `dependency-preflight.json`: resumen estructurado de este alcance.
- `npm-test.log`: suite completa posterior a la instalación móvil, coordinada por el otro agente.

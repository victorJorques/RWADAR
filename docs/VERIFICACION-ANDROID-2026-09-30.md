# RWAdar Android · verificación y publicación del 30/09/2026

Android **1.1.2 / versionCode 10** publicado el 30/09/2026 a las **10:50:52 UTC**.
Se publicó el mismo APK que superó la prueba final en emulador; no se reconstruyó
ni se modificó el binario después del PASS. Publicación autorizada por el titular
y ejecutada después de revisar la evidencia final del catálogo y del CI.

- [Release 1.1.2](https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.1.2).
- [APK público](https://github.com/victorJorques/RWAdar-downloads/releases/download/v1.1.2/RWAdar.apk).
- [Checksum público](https://github.com/victorJorques/RWAdar-downloads/releases/download/v1.1.2/SHA256SUMS.txt).
- [CI final aprobado, run 36703760962](https://github.com/victorJorques/RWAdar-downloads/actions/runs/36703760962).

## Identidad del binario publicado

| Dato | Resultado verificado |
|---|---|
| Paquete | `com.rwadar.app` |
| Versión / código | `1.1.2` / `10` |
| Tamaño | 85.274.516 bytes |
| SHA256 APK | `0e06d6c4f8e32048fc761b8630467dd91b5a57940f577263571c7915fdd5b574` |
| Certificado SHA256 | `f506dea70ad644184161542d583455d2ad849c4dea3fffa0469c9ca400f58b72` |
| Firma | APK Signature Scheme v2 válida; mismo certificado que APK8/9 |
| EAS build | `ba9a6cb9-718c-4e5c-a338-16af0bb238df` |
| Commit fuente del build | `4146293f279af41da2de53fa08d8cd14d7b42b65` |
| Fin del build | 30/09/2026, 09:53:19 UTC |
| SDK mínimo / objetivo | 24 / 36 |

Permisos comprobados: `INTERNET`, `ACCESS_NETWORK_STATE`, `VIBRATE` y
`com.rwadar.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`. Backup y actualizaciones
OTA desactivados; sin `debuggable` ni tráfico claro habilitados en el manifiesto.

El bundle contiene las vistas del catálogo V2 y la caché `rwadar.cache.catalogo.v2`.
La cadena de caché V1 sigue presente en la lista de borrado de datos locales;
el lector del commit construido usa V2. La presencia de cadenas en el binario
es una comprobación estática; el recorrido real siguiente acredita la lectura
V2 de una instalación limpia.

## Prueba real del mismo APK

Run `36703760962`, workflow/head
`5ba5a6f4178edbe2fd7a41f61adcb8f210f3576a`, resultado registrado a las
**10:44:58 UTC**. El helper comprobó la evidencia original descargada de GitHub,
incluidos run, commit, paquete, versión, bytes, SHA256 y certificado.

- Instalación limpia y apertura en **emulador Android API35**.
- Radar con 26 plataformas y catálogo V2 con 49 referencias: **24 principales,
  21 secundarias y 4 en camino**. Cabecera, pestañas y contadores coinciden; el
  recorrido rechaza el catálogo V1 de 28 y las indicaciones de copia sin conexión.
- Búsqueda y detalles de Spiko y BOSS. Spiko conserva ISIN `FR001400ODL1`, el
  2,17 % observado el 30/09 y NAV histórico 1,0597 EUR del 28/09. BOSS destaca
  «Consultar fuente» y mantiene 8,44 CHF y 6,70 CHF como referencias fechadas.
- Miami 1 en secundario: referencia documental, 14,88 % dentro de la sección
  histórica, dato del 28/09 y consulta del 30/09, sin confirmar liquidez; CTA
  «Consultar fuente en Reental».
- IOD Occasio en camino: «En estudio», apertura no confirmada, fechas 28/09 y
  30/09 y CTA documental a Alius Capital.
- GreenPoint: ISIN `AT0000A38J32`, localizadores antiguos conservados como texto,
  sin controles pulsables hacia `/desktopWeb/asset/`; fuentes y CTA al marketplace.
- Hausera en camino: fuentes y CTA `https://hausera.io/`; `hausera.com` aparece
  solo como texto histórico, sin enlace activo ni afirmación de oferta abierta.
- Explicador en WebView con la lección aislada, comprobado en cuatro posiciones;
  cierre y retorno al radar de 26 plataformas, con la aplicación viva.

Se conservaron PNG, árboles XML, logs y resultado JSON. Se revisaron capturas
reales de detalles, fuentes, CTAs, localizadores históricos y retorno. Los CTA
externos no se pulsaron en el emulador: su destino exacto se contrastó por REST,
y la UI se inspeccionó para comprobar el texto y la ausencia de enlaces antiguos
pulsables. No se acredita con este recorrido la navegación dentro de terceros.

## Catálogo definitivo antes y después del CI

Lectura REST anónima a las **10:39:03** y **10:45:32 UTC** de la misma revisión
`06abe207-0b5d-9918-5c48-ca647c013bd5`: 26 plataformas, 49 referencias,
grupos 24/21/4 y 49 documentos iguales a la fuente versionada. Los dos pares
de respuestas tuvieron hashes idénticos:

- Plataformas: `9008b5a188cc25cbce68216b3afac69848d865ce6b70c798fe81cc6bded9936c`.
- Referencias: `ff2ebafed665c521a5884ee35df5cb87a77b8bf9e72428a0281a07f405334595`.

GreenPoint tenía como enlaces activos solo la fuente documental y
`https://app.brickwise.at/desktopWeb/marketplace`; el localizador histórico se
conservaba en texto. Hausera usaba `.io`. Ninguna fila conservaba localizadores
Brickwise antiguos o Hausera.com en los campos de enlace activo comprobados.
El ISIN y 2,17 % de Spiko estaban preservados. Estas comprobaciones no cambiaron
fechas de evidencia ni prolongaron la vigencia del catálogo.

## Publicación y descarga pública

El guard del helper volvió a descargar la evidencia del CI final antes de publicar;
exigió también los tres resultados nuevos de GreenPoint y Hausera. Contrastó el
digest y tamaño del asset preparado y publicó la release `399948886` como latest.
El repositorio fuente continuaba privado; no se cambió ninguna visibilidad.

A las **10:52:17 UTC**, una descarga **sin autenticación** desde la URL pública
exacta del APK verificó de nuevo bytes, SHA256, checksum y firma/certificado con
`apksigner`. La API de latest y la redirección web
`https://github.com/victorJorques/RWAdar-downloads/releases/latest` apuntaban ambas
a **v1.1.2**. El APK público es idéntico al instalado en el emulador.

## Límites y evidencia local

`app-errors.log` y `final-errors.log` están vacíos. Se recuperó un fallo transitorio
de raíz UI mediante los reintentos acotados del comprobador. Chromium registró
terminación del renderer con código **-1** a las **10:44:44 UTC**, entre la última
captura de la lección y el retorno correcto a las 10:44:58. No se atribuye una
causa al registro ni se afirma ausencia total de errores Chromium. La limitación
fue revisada y aceptada antes de autorizar la publicación.

Esta es distribución directa por APK y prueba en emulador. **No acredita prueba
en dispositivo físico, publicación en Google Play/App Store ni reaperturas
repetidas del explicador.** No se activaron anuncios ni tiendas en esta entrega.

Evidencia privada conservada en `rwadar-entrega-android-112-20260930/`:

- `artifact.json`, `verificacion-apk10.json`, `signature.txt`, `package.txt`,
  `manifest.txt` y `bundle-identity.json`.
- `verified-run-36703760962.json`, `evidence-36703760962.zip`,
  `logs-36703760962.zip` y sus carpetas extraídas.
- `rest-final-06abe207-0b5d-9918-5c48-ca647c013bd5-before-ci.json` y `-after-ci.json`.
- `public-download-verification.json`, `public-signature.txt` y
  `rwadar-1.1.2-10-public.apk`.

El PASS anterior `36701947682` y el primer fallo del comprobador `36701365065`
se conservan como antecedentes; la publicación se fundamenta en el PASS final
`36703760962`. No se cambió el APK entre ejecuciones. APK9/1.1.1 queda como una
release anterior separada; latest ya sirve APK10/1.1.2.

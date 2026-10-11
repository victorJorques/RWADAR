# Cuentas de RWAdar · web y app · 11 de octubre de 2026

## Resultado y ubicación

Implementación integrada sobre `claude/abrir-cuentas`, en la rama
`codex/cuentas-web-movil` del worktree adjunto a este chat. No se tocó la copia
antigua de `Downloads` ni sus carpetas sin seguimiento de manual/descargas.
**La web ya está publicada con cuentas en `https://rwadar.pages.dev` desde el
11/10**, despliegue `4c7d38e5`. Pasó **35/35** comprobaciones HTTP y **64/64**
comparaciones de recursos por SHA; se observaron los formularios de alta,
entrada y Perfil en el navegador de producción. El APK **1.3.0, código 13**, se
compiló con EAS sin cargos, pasó las comprobaciones de firma y tamaño y la QA
de ejecución del mismo APK intacto en emulador API 35. **Ya está publicado** en
[GitHub, versión 1.3.0](https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.3.0):
el flujo iniciado mediante `f01dbc2`, en `codex/android-130-release`, terminó
con éxito en QA y release; la API anónima confirma la publicación final.
No se ha enviado a tiendas
ni activado publicidad o cobros. El refuerzo SQL se aplicó con permiso expreso
y se verificó después mediante consultas de lectura.

La web pública responde con las cuentas activadas. Supabase acepta altas y
exige confirmar el correo. **Víctor confirmó que el correo de alta llega y que el enlace
funciona; llega a spam.** Se mostró el perfil confirmado y cerrar sesión
funcionó en la revisión existente. Codex solicitó la recuperación desde esa
interfaz el **11/10 a las 08:14:18 UTC**. Los metadatos de Gmail confirman el
asunto «Recupera tu acceso a RWAdar», llegada a **INBOX** y **DKIM/SPF/DMARC
correctos**, sin leer cuerpo, enlace ni token. Todavía no se han verificado
el cambio final de contraseña ni la entrada posterior con esa contraseña
nueva. Víctor la introduce directamente, nunca en el chat. La recuperación
real no se declara completada.
El catálogo público sigue disponible, con **26 plataformas y 49 referencias**;
no está retirado. El APK disponible ya es el **1.3.0**, con estos cambios:
compilado, revisado, probado en emulador y publicado. La descarga anónima local
del release ya terminó correctamente: APK y evidencia coinciden con las sumas
y metadatos públicos; la firma del APK descargado volvió a verificarse.
Una revisión de acabado **1.3.1/código 14 está en preparación**, no publicada.

## Cambios integrados

- Motor nativo con Supabase JS fijado a `2.112.1`, sesión solo en memoria y
  validación de usuario confirmado mediante `getUser()`. Panel de alta,
  reenvío, entrada, recuperación, perfil, nombre y vigilancia compartida con la
  web. Los favoritos locales siguen siendo independientes.
- Baja nativa y web con contraseña recién comprobada de la misma identidad
  y escritura de BORRAR. Cancelar, cambiar de formulario, desmontar la app o
  iniciar otra sesión invalida respuestas antiguas. Salir retira los datos
  locales antes de esperar a la red; si el servidor no confirma la revocación,
  se informa de que la sesión remota podría seguir activa.
- Web: protección ante carreras de identidad/renovación/carga; no declarar
  guardado si RLS devuelve cero filas; contraseña en campo oculto, no en un
  diálogo de texto del navegador; respuestas y cuerpo limitados a 8 segundos
  y 128 KiB. No se guarda la sesión en caché ni almacenamiento persistente.
- SQL adicional: sesión confirmada, vigente y propia en RLS restrictivo,
  sin reemplazar las reglas de propiedad; baja exige AMR de contraseña de
  los últimos cinco minutos y revoca todas las sesiones antes de borrar datos.
- Privacidad actualizada para diferenciar cuentas, vigilancia y favoritos,
  las versiones nativas anteriores y la sesión nativa en memoria. Manual,
  opiniones, comunidad, avisos, instalación histórica, publicidad y cobros siguen apagados.

La migración aplicada es
`rwadar-app/supabase/migrations/20261011074218_cuentas_sesion_confirmada.sql`.
Se creó con el CLI oficial fijado a `2.120.0`, y se probó su SQL literal
localmente. **Ya se aplicó en producción, después de la 26, con permiso expreso
de Víctor en este turno.** La lectura posterior verificó las tres políticas
RLS restrictivas, la comprobación de sesión confirmada y vigente, la exclusión
de usuarios anónimos, el esquema privado fuera de REST y la comprobación AMR
de contraseña reciente para la baja. No se activaron opiniones, dispositivos
históricos ni push.

## Compuertas, sin atajos

En la web publicada `SERVICIOS_USUARIO_REMOTOS=true` y `CORREO_AUTH_E2E=true`
permiten usar las cuentas. La recepción de confirmación ya
está acreditada por Víctor; la recuperación real todavía no se considera
completada. El valor del interruptor no es una prueba de recuperación por sí
mismo; los flujos pendientes se comprueban sobre la versión realmente servida.
La app publicada **1.3.0** tiene `CUENTAS_REMOTAS=true` y
`CORREO_AUTH_E2E=true` para comprobar estos mismos flujos. Su guarda antigua
`SERVICIOS_USUARIO_REMOTOS=false` se conserva. Su APK está compilado y probado
en emulador. La QA no introdujo credenciales ni completó Auth nativo; no
equivale a una prueba en un teléfono físico.

Víctor autorizó expresamente en este turno la compilación **Android con EAS**
y publicación del APK verificado en **GitHub, sin cargos**. La compilación ya
terminó dentro de la cuota gratuita: EAS registra **2/15**, **sin cargos**.
Expo Doctor pasó **21/21**. La firma, el tamaño y la ejecución del mismo APK
en emulador se comprobaron, y la publicación en GitHub ya terminó con éxito.
La descarga anónima del release y su comparación local también terminaron
correctamente; esta evidencia corresponde a la 1.3.0, no a la revisión de
acabado 1.3.1 en preparación. Si otro paso exige un
cargo, esa autorización no permite aceptarlo.

**No encender `SERVICIOS_USUARIO_REMOTOS` de la app**: protege la identidad
de instalación, sincronización y push antiguos. Las cuentas usan su guarda
independiente. No activar opiniones, comunidad, manual, publicidad ni cobros por abrir
las cuentas. El catálogo público tampoco depende de estas compuertas.

## Lo que hace Codex a continuación

1. Completar la recuperación real: el correo ya está entregado;
   falta abrir su enlace, cambiar la contraseña y entrar con la nueva. Comprobar
   también alta sin confirmar bloqueada, entrada, vigilancia propia y salida
   sobre la versión publicada. No basta un mensaje de envío exitoso. Víctor
   introduce contraseñas y abre sus enlaces; Codex comprueba resultados y
   errores sin leer secretos. No borrar una cuenta real sin autorización de baja.
2. Mejorar la entrega que llega a spam y conservar la confirmación obligatoria.
   El refuerzo de sesión ya está aplicado y verificado; no repetir 26 sin una
   necesidad concreta y nueva autorización. Reejecutarla reemplaza funciones:
   en ese caso hay que reaplicar el refuerzo. Para cerrar, 25 sigue disponible
   y el refuerzo detecta sus ACL; para reabrir: 26 y luego refuerzo.
3. Mantener la verificación de la web pública ya desplegada y completar los
   flujos reales pendientes sobre lo servido. Las pruebas finales locales,
   HTTP y huellas han pasado; no sustituyen el cambio real de contraseña.
   Cualquier cambio posterior exige pruebas y una aprobación nueva antes de
   republicar. No reciclar aprobaciones de hashes anteriores ni declarar
   terminado lo no comprobado.
4. Conservar solo las guardas nativas de cuentas activadas en la publicada
   1.3.0, compilada y probada en emulador. La descarga anónima y la comparación
   de APK, evidencia, sumas y firma ya están verificadas. Preparar la revisión
   de acabado 1.3.1/código 14 y someter el nuevo APK a sus propias pruebas y
   comprobaciones; no reutilizar como resultado suyo la QA de 1.3.0 ni darlo
   por publicado antes de verificar su release y descarga.
   La autorización actual es **sin cargos**: si otro paso requiere pagar,
   detenerlo, no aceptar el coste. No presentar pruebas Node/SSR o verificación
   del paquete como una instalación real ni QA de formularios como Auth E2E.
5. Entregar los enlaces de web y Android 1.3.0 públicos, con sus comprobaciones
   y límites explícitos. La 1.2.0 queda como versión anterior sin el panel nuevo.
   Tiendas e iOS siguen siendo entregas
   distintas, con sus requisitos de identidad y pruebas.
6. Mantener visibles los avisos de dependencias y preparar una actualización
   compatible del tooling. Revaluar el alcance antes de otra compilación,
   activar OTA o cambiar el árbol runtime; no utilizar `audit fix --force`
   ni rebajas de Expo como sustituto de una corrección validada.

Codex asume toda integración, configuración no secreta, pruebas y publicación
que se autoricen. A Víctor solo le corresponden credenciales/verificación de
identidad, comprobación de su correo y las autorizaciones de producción,
compilación, costes o borrado. No se le asignan cambios de código.

## Pruebas y límites

Evidencia detallada en [`../VERIFICACION-CUENTAS-2026-10-11.md`](../VERIFICACION-CUENTAS-2026-10-11.md).
La ejecución final de `npm test`, sobre las guardas de cuentas de web y app
**activadas** y la candidata nativa **1.3.0**, terminó con **código de salida 0**:
web **501**, móvil **180** y SQL **196**; QR y herramientas al día.
Chrome con servicios simulados pasó
**61/61** en el ensayo general y **30/30** en las regresiones adversariales
de sesión, callback, transporte y baja.

La revisión independiente pasó **54/54** casos nativos, **196** SQL y **30**
de Chrome, sin bloqueos. Estos resultados finales no son una prueba de
instalación nativa ni de cambio real de contraseña.

La web publicada pasó **35/35** comprobaciones HTTP y **64/64** comparaciones
de recursos por SHA. Las vistas de alta, entrada y Perfil se observaron en
producción. El APK 1.3.0 pasó comprobaciones de firma y tamaño; Expo Doctor
pasó **21/21**, y la compilación EAS se realizó sin cargos. Son controles
distintos de la QA real del APK instalado en emulador, descrita a continuación.

Esas pruebas locales usan fixtures y no envían correos, no escriben en Supabase
y no prueban ni la firma de los JWT reales ni los triggers internos de GoTrue.
La aplicación y postlectura del refuerzo SQL, la confirmación de correo por
Víctor, el perfil y la salida visibles, y los metadatos de entrega de recuperación
son evidencias en línea distintas. No acreditan todavía una recuperación real
completada ni Auth E2E nativo.

### QA de ejecución Android superada · mismo APK intacto

Ejecución `38126514363`, trabajo `114431885819`: **PASS**. Se instaló el APK
1.3.0, código 13, sin modificarlo, en un emulador **API 35**. Se comprobaron:

- Inicio y búsqueda: **26 plataformas y 49 referencias**, y ficha de Spiko.
- Academy: **siete lecciones publicadas** y apertura de una lección.
- Favorito local conservado después de reiniciar la app.
- Formularios de entrada, alta y recuperación; campos de contraseña y
  confirmación ocultos y vacíos; validación local de entrada vacía.

No se introdujeron contraseñas, enviaron correos, crearon cuentas ni aceptaron
condiciones personales; no se usó hardware físico. La prueba **no acredita
Auth E2E nativo**. En ese primer flujo, el paso de release quedó **SKIPPED**
por la elección deliberada **NO**. El flujo posterior autorizado terminó con
éxito y publicó el release; las comprobaciones de la API pública se registran
por separado abajo. La QA no se confunde con Auth E2E nativo.

**Antecedente local:** el intento anterior de comprobación móvil interactiva
con Metro no se completó; no se conserva ni se contabiliza ese arnés no
verificado. La QA válida de esta entrega es la del APK instalado descrita arriba.

### Publicación Android confirmada · 11/10, 09:17:18 UTC

Flujo público `38127611672`: trabajos de QA `114435137044` y release
`114435715230`, ambos **completed/success**, con todos sus pasos correctos.
La API anónima de `releases/latest` confirma **v1.3.0**, `draft=false`,
`prerelease=false` y `published_at=2026-10-11T09:17:18Z`.
Release final:
[RWAdar 1.3.0](https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.3.0).

Activos descargados anónimamente y comparados con sus metadatos públicos:

| Activo | Bytes | Huella pública y comparación local |
|---|---:|---|
| `RWAdar.apk` | 85.622.388 | `0bc76f885a4dde467e428e0abb9eddb773092d36f9bc474227e487ce96dbda32` |
| `rwadar-android-130-evidence.zip` | 6.658.600 | `d927d98f03472701f4acc2b7820494a67d41d0672f7086c0a58e70f01641ba6a` |
| `SHA256SUMS.txt` | 175 | Coincide con las huellas locales de APK y ZIP |

La descarga anónima desde los enlaces permanentes terminó con **salida 0**, en
`C:/Users/vcicr/Downloads/rwadar-android-130-publicado-20261011/`. El APK
descargado es idéntico al probado; `apksigner` volvió a verificar firma v2,
un firmante y el certificado previsto. La lista acotada de entradas del ZIP
se validó antes de expandirlo en `qa/evidence/`; el flujo también comprobó CRC.
Se leyó completo el `result.json` de `38127611672`, con instalación, navegación,
catálogo, Academy, detalle, favorito persistente y formularios correctos.
Conserva `authEndToEndTested=false`, `smtpTested=false` y `physicalDevice=false`:
no acredita Auth nativo real, hardware físico ni cambio real de contraseña.

Codex revisó visualmente las seis capturas descargadas de Inicio, ofertas,
Academy, detalle Spiko, alta y recuperación, sin datos ni credenciales. Es una
revisión acotada, no una afirmación de interfaz perfecta. Se detectó que la
nota de favoritos invade unos 14 dp el borde del formulario de recuperación,
por `marginTop: -14`; se prepara la revisión de acabado **1.3.1/código 14**,
todavía no publicada. El resultado de 1.3.0 no se presenta como QA de ese
nuevo binario.

El commit público `6d4280e` dejó de nuevo `PUBLICAR_RELEASE=NO` sin iniciar
otro lanzamiento; `d045b4c` actualizó el README público sobre las cuentas
opcionales de 1.3.0. Google Play y App Store siguen fuera de esta publicación.

### Dependencias: avisos presentes y alcance documentado

Informe específico:
[`../VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-11.md`](../VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-11.md).
`npm audit --omit=dev --audit-level=high` **NO pasa**: **23** avisos de paquetes,
**16 high**, **7 moderate**, cero critical. Son tres advisories base y sus
dependencias propagadas, no 23 exploits independientes demostrados en la app.

El análisis revisó braces, node-forge y uuid, sus consumidores y el inventario
del runtime Android exportado en una copia aislada. No se demostró una vía
vulnerable alcanzable en el APK actual para esos tres avisos. El inventario
exportado no es una descompilación ni el mapa del Hermes del APK firmado;
esa evidencia estática no garantiza ausencia de otros fallos, no sustituye
la QA del binario y **no permite afirmar auditoría limpia**.

OTA sigue apagado. No se cambió ningún paquete, lock, firma ni APK durante
la revisión de dependencias. Queda actualizar tooling compatible y revaluar
antes de otra compilación o de ampliar el runtime; no ocultar avisos mediante
excepciones globales, cambios incompatibles ni `audit fix --force`.

## Antecedente histórico del correo · 11/10, 07:46 UTC

El intento anterior falló con **Gmail 535, credenciales rechazadas**. El
remitente configurado es `rwadares@gmail.com`; las credenciales las introduce
Víctor directamente en Supabase, nunca en el chat ni recuperándolas de
historiales. Este fallo queda como diagnóstico anterior, no como estado actual:
después Víctor confirmó la recepción del correo de alta y su enlace funcionando.

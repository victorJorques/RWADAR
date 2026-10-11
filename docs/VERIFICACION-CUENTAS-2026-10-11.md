# RWAdar · cuentas web y Android · verificación del 11 de octubre de 2026

## Alcance y autorización

Actualización de las cuentas opcionales, gratuitas y con confirmación de correo.
El catálogo continúa público y de solo lectura. No se activan publicidad,
comisiones, atribución, cobros, opiniones, comunidad, avisos ni entrega del manual.
Los favoritos locales y la vigilancia de una cuenta son funciones distintas.

Víctor autorizó en esta sesión la lectura de metadatos de Supabase de RWAdar,
la aplicación de la migración de sesión probada, la publicación web y después
la compilación y publicación Android únicamente sin cargos adicionales.
No se ha operado sobre CALIX. No se han leído ni introducido contraseñas,
claves administrativas, tokens de correo o códigos de autenticación.

Fuente revisada en el worktree `codex/cuentas-web-movil`. La carpeta principal
de Downloads y sus archivos de Academy sin seguimiento se conservan.

## Comprobaciones reales en línea

- Antes de esta publicación, producción y revisión respondían HTTP 200.
  La producción aún tenía las cuentas apagadas; la revisión anterior sí las
  mostraba. Una URL accesible no prueba todos los flujos de autenticación.
- Auth permite altas, mantiene la confirmación obligatoria y no permite
  usuarios anónimos. No se ha desactivado la confirmación para evitar el SMTP.
- El intento de alta del 11/10 a las 07:46:22 UTC falló por Gmail 535.
  Víctor sustituyó personalmente la contraseña de aplicación. Después
  confirmó que recibió el correo de alta y pudo confirmar su cuenta.
  Indicó que ese correo había llegado a spam.
- Se observó en revisión el perfil de esa cuenta, su nombre y su vigilancia
  vacía; después se comprobó el cierre de sesión y la pantalla «Sin sesión».
  No se modificó el nombre, la vigilancia ni se borró esa cuenta.
- A las **08:14:18 UTC** se pidió recuperación desde la interfaz de revisión.
  La interfaz mostró «Solicitud recibida». Una consulta de Gmail limitada
  a ese mensaje confirmó su **recepción en INBOX**, asunto «Recupera tu acceso
  a RWAdar» y cabeceras **DKIM, SPF y DMARC pass**. Se leyeron solo metadatos:
  no se abrió el cuerpo ni se obtuvo el enlace o su token. Esto prueba la
  entrega de ese correo, no la llegada futura de todos los mensajes.
- El cambio final de contraseña y la entrada posterior con ella **no se han
  realizado con esa cuenta real**. Son pasos personales; se han probado con
  servicios aislados, no se presentan como prueba real de extremo a extremo.
- La lectura de catálogo comprobó 26 plataformas y 49 referencias V2. La
  publicación del catálogo no está retirada. La sincronización pública
  regeneró 26 plataformas, 4 descartes y 49 referencias sin cambiar las fechas
  de comprobación del lote del 6/10, vigente hasta el 13/10.

## Refuerzo aplicado y comprobado en Supabase

Migración: `rwadar-app/supabase/migrations/20261011074218_cuentas_sesion_confirmada.sql`.
Creada con Supabase CLI oficial 2.120.0 y aplicada mediante la herramienta de
migraciones al proyecto RWAdar tras autorización concreta de Víctor.
La aplicación devolvió éxito. No borra usuarios al instalarla.

La lectura posterior de metadatos comprobó:

- Tres políticas restrictivas adicionales en perfiles, vigilancia y avisos
  de correo, conservando las políticas de propiedad anteriores.
- El helper privado exige usuario confirmado, no anónimo y sesión existente,
  propia, no vencida y no revocada. Comprueba los claims firmados y el registro
  real en `auth.sessions`, no solo un JWT todavía dentro de su fecha.
- Baja con contraseña comprobada en los últimos cinco minutos: AMR de
  contraseña, tolerancia de reloj de 30 segundos y rechazo de recuperación/OTP
  solos. Borra primero las sesiones propias y después el usuario propio en
  la misma transacción. No se hizo una baja de un usuario real para probarlo.
- Funciones privilegiadas con `search_path` vacío y acceso anónimo revocado;
  la vista del perfil mantiene `security_invoker`.
- Sin JWT, el helper deniega el acceso. Los clientes no leen `auth.users` ni
  `auth.sessions` ni usan el esquema privado. REST rechazó el esquema privado
  con 406/PGRST106; solo `public` y `graphql_public` están expuestos.
- Opiniones y administración siguen cerradas a los clientes; no se reabrió
  el envío de avisos ni una RPC de consentimiento antigua.

El asesor de seguridad posterior dio **0 ERROR, 4 WARN y 3 INFO**. Los dos
avisos de `SECURITY DEFINER` corresponden a la baja y al marcador privado del
manual, no a permiso anónimo. Las tres tablas con RLS y sin políticas ni
permisos de cliente son funciones deliberadamente cerradas.

La advertencia de `pg_net` no se oculta: conserva permisos gestionados por
Supabase en funciones y colas SQL. `net` no está expuesto en la Data API y los
puentes públicos directos encontrados están cerrados a anon/authenticated.
No se ejecutaron funciones de red ni se leyeron colas o respuestas. No se
afirma que las cabeceras de esa extensión sean secretas frente a roles con
conexión SQL. Véanse las limitaciones oficiales:

- <https://supabase.com/docs/guides/troubleshooting/revoking-access-to-pg_net-objects-has-no-effect-0bbc16>
- <https://supabase.com/docs/guides/troubleshooting/database-roles-can-read-request-headers-queued-by-pg_net-ad6357>

La protección de contraseñas filtradas sigue apagada. Requiere un plan Pro o
superior según la documentación actual; no se cambió el plan ni se contrató
un servicio. <https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection>

## Implementación y pruebas locales

Web: identidad comprobada con `/user`, confirmación/no anonimato, invalidación
de respuestas de sesiones anteriores, renovación sin mezclar cuentas,
transporte acotado y rechazo de falsos éxitos con cero filas por RLS. La baja
pide contraseña enmascarada y `BORRAR`; salir limpia la memoria y no afirma
revocación remota si esta falla. Alta y recuperación muestran solicitud
aceptada, no prometen entrega sin comprobarla.

Android: panel de cuentas independiente del motor histórico de instalaciones;
SDK 2.112.1 con sesión exclusivamente en memoria, sin persistencia ni descarga
OTA. Nombre y vigilancia propios, alta/recuperación, salida y baja con
contraseña reciente. La confirmación y la recuperación abren la web oficial.
Se conserva el catálogo si vence una revisión o falla la red.

La suite completa anterior a activar las guardas terminó con código 0:
**501 pruebas web, 180 móviles y 196 del refuerzo SQL**, además del resto de
la cadena de base, QR y herramientas. El ensayo Chrome aislado de cuentas
pasó **61/61**, incluido el recorrido de recuperación con contraseña ficticia.

Al activar el candidato se detectó que el ensayo de carreras tomaba la guarda
real para su caso «correo cerrado». Se corrigió el ensayo para forzar ambos
estados explícitamente sin cambiar las protecciones de la aplicación.
La repetición final de `npm test` con las guardas web y Android activadas
terminó con **código 0**: web **501**, móvil **180**, refuerzo SQL **196**,
QR y herramientas correctos. Academy conserva 7 de 9 lecciones publicadas.
Chrome volvió a pasar **61/61** para cuentas y **30/30** para carreras.
La revisión independiente volvió a pasar 54 casos de motor/UI nativos,
196 SQL y 30 de carreras Chrome; no encontró otro bloqueo en el núcleo.

Gitleaks 8.30.1 encontró dos falsos positivos identificados: el JWT ficticio
de un test y la copia generada del beacon público de Cloudflare. El test ahora
construye explícitamente un token sin firma real; la excepción del beacon
exige a la vez el mismo valor público ya documentado y su nombre de recurso
generado con huella. No se admiten otros tokens, archivos ni claves de servidor.
El escaneo repetido terminó con código 0 y **ningún secreto detectado**.

Estos ensayos no envían correos, no modifican usuarios reales y no demuestran
por sí solos SMTP, funcionamiento en un dispositivo o tiendas.

## Publicación y límites de la comprobación

La web publicada activa acceso, alta y recuperación; mantiene las guardas de
opiniones, avisos, comunidad y manual apagadas. Android 1.3.0 activa
solo `CUENTAS_REMOTAS` y `CORREO_AUTH_E2E`; el motor histórico permanece apagado.
La cuenta EAS está en Free; antes de compilar tenía 1 de 15 compilaciones Android
utilizadas en octubre, sin sobrecostes ni complemento de pago. Se usó el perfil
editorial, APK, credenciales existentes congeladas y sin OTA.

Fuente revisada en `a213373af21ab009dffa0cb81bcee3384c6775c3`; manifiesto y
traspaso en `3a0d9536d01c3613e8d79939cce9d9b40072f108`. La revisión web se
publicó en <https://d91d4e14.rwadar.pages.dev>, alias
<https://revision.rwadar.pages.dev>. A las 08:39 UTC pasó el comprobador HTTP
**35/35** y se compararon por SHA-256 los **64/64 archivos públicos** con el
artefacto local aprobado: todos idénticos y HTTP 200. Se observaron los
formularios vacíos de acceso, alta y recuperación y el catálogo completo
26/49 en navegador, sin enviar nuevas credenciales ni solicitudes. La anchura
DOM observada fue 614 px, sin desbordamiento horizontal; la petición de
viewport 390 px no se reflejó y no se contabiliza como prueba a 390 px. Se
restauró el viewport. Los tamaños estrechos de los ensayos locales se
mantienen separados de esta comprobación publicada.

Android se validó también con sus dependencias finales en una carpeta
aislada: instalación limpia de 567 paquetes, Expo Doctor **21/21** y pruebas
nativas **180/180**. La compilación EAS editorial gratuita se inició a las
08:41 UTC, versión 1.3.0/código 13, commit real `3a0d9536d01c3613e8d79939cce9d9b40072f108`,
credenciales existentes congeladas y solo 44 archivos móviles (661 KB).
Ejecución: <https://expo.dev/accounts/trapis-team/projects/rwadar/builds/7523ec9a-79d9-4775-893e-50c00022f494>.
La compilación y las pruebas locales no sustituyen la instalación del APK exacto
ni su posterior descarga desde el enlace público permanente.

Producción web publicada con el publicador canónico (salida 0) en
<https://4c7d38e5.rwadar.pages.dev>, principal <https://rwadar.pages.dev>.
Comprobación posterior del 11/10: **35/35 HTTP y 64/64 huellas idénticas**,
misma caché `rwadar-v-40ce7fbf94590692` que la revisión aprobada. En el
navegador se abrió Perfil → Entrar → Crear cuenta en la dirección principal;
alta opcional/gratuita y confirmación obligatoria visibles. No se introdujeron
credenciales ni se aceptaron condiciones. Captura del formulario público,
sin datos personales, guardada en `rwadar-cuentas-publicadas-20261011/alta-web-publicada.jpg`
fuera de Git. No se confunde este formulario visible con un segundo alta real.

EAS terminó a las 08:48:41 UTC; descarga oficial:
<https://expo.dev/artifacts/eas/Jh-m2xO1U1-ZWgqJsAxEJaKHpdvOdW01zhwOCyIhi-k.apk>.
Binario **85.622.388 bytes**, SHA-256
`0bc76f885a4dde467e428e0abb9eddb773092d36f9bc474227e487ce96dbda32`.
`apksigner` verificó el APK intacto (un firmante, v2) con el mismo certificado
`f506dea70ad644184161542d583455d2ad849c4dea3fffa0469c9ca400f58b72`;
`aapt` confirmó `com.rwadar.app`, 1.3.0/código 13, SDK mínimo 24/objetivo 36,
exactamente cuatro permisos previstos, backup y OTA desactivados. Cuota EAS
posterior: Free 2/15 Android, sobrecostes y facturación estimada cero.
El APK exacto pasó instalación y ejecución en un emulador Android API35:
<https://github.com/victorJorques/RWAdar-downloads/actions/runs/38126514363>.
Job `114431885819`, commit del flujo público `e2ffc88366ee3253f2d67b057eb9a8859484d97b`.
Se comprobaron arranque, ausencia de caída/errores JS, navegación Inicio/Buscar/
Academy/Perfil, catálogo completo 26/49, ficha de Spiko, favorito local que
persistió después de reiniciar el proceso, siete lecciones y apertura/cierre
de la primera, formularios de acceso/alta/recuperación/confirmación, contraseña
enmascarada y validación de acceso vacío. No se introdujeron credenciales,
aceptaron condiciones, visitaron enlaces de inversión ni escribieron datos remotos.

El resultado marca expresamente `authEndToEndTested=false`, `smtpTested=false`
y `physicalDevice=false`. La instalación/navegación y los formularios nativos
están probados; un alta/inicio/baja real desde Android y un móvil físico no lo están.
La captura nativa de alta se extrajo, comprobó y revisó visualmente: campos vacíos,
condiciones desmarcadas y botones legales separados. Archivo fuera de Git:
`rwadar-android-130-20261011/qa-38126514363/10-perfil-alta-sin-aceptacion.png`,
180.287 bytes, SHA-256
`1e44d5d5ade92fa5b74dc5ff25445a58e7e81de11af9dbe7e2a32f35452d1a76`.
El lector visual de ofertas excedió su límite de exportación: no se presenta
como prueba visual superada ni como fallo funcional de la app.

El flujo usa un runner público estándar gratuito y evidencia acotada en sus
logs, sin `upload-artifact`, cachés ni minutos privados. La repetición autorizada
<https://github.com/victorJorques/RWAdar-downloads/actions/runs/38127611672>
terminó con **éxito**: job QA `114435137044` y publicación `114435715230`,
todos los pasos aprobados. Se repitió el QA del mismo binario, recuperó su
evidencia exacta, creó una versión nueva en borrador sin sobrescribir las
anteriores, comprobó los activos subidos y solo después hizo pública la versión.

**Android 1.3.0 está publicado** desde las **09:17:18 UTC**:
<https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.3.0>.
La API pública confirmó que es la versión latest, no un borrador ni prerelease.
El navegador anónimo mostró el título de esa versión y sus instrucciones.
Codex descargó desde el enlace permanente, sin autenticación, el APK y la
evidencia en `C:/Users/vcicr/Downloads/rwadar-android-130-publicado-20261011/`:

- `RWAdar.apk`: **85.622.388 bytes**, misma huella
  `0bc76f885a4dde467e428e0abb9eddb773092d36f9bc474227e487ce96dbda32`.
  `apksigner` volvió a verificar v2, un firmante y el certificado previsto.
- `rwadar-android-130-evidence.zip`: **6.658.600 bytes**, SHA-256
  `d927d98f03472701f4acc2b7820494a67d41d0672f7086c0a58e70f01641ba6a`.
  Coincide con `SHA256SUMS.txt` y la huella del activo en GitHub. Se validó la
  lista acotada de entradas antes de extraer; el workflow comprobó además CRC.
- `result.json`: instalación, arranque, navegación, 26/49, siete lecciones,
  detalle documental, favorito persistente y formularios correctos. Mantiene
  explícitamente las tres limitaciones Auth E2E/SMTP/dispositivo físico en false.

Se revisaron visualmente las capturas descargadas de Inicio, ofertas, Academy,
detalle Spiko, alta y recuperación. No se introdujeron datos ni credenciales.
La APK es distribución directa firmada: **no supone publicación en Google Play
ni en la App Store**. En iPhone está disponible la web.
El commit público `f01dbc2` publicó y verificó; `6d4280e` volvió a dejar
`PUBLICAR_RELEASE=NO` sin iniciar otro lanzamiento. El README público se
actualizó en `d045b4c` para explicar cuentas opcionales y correos.

## Cierre de Android 1.3.1 y nueva comprobación web

La versión vigente ya es **1.3.1/código14**, publicada a las 09:45:05 UTC:
<https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.3.1>.
Fuente compilada `53d4c33b4308098226714f61b66ee2017789823e`; solo corrige
la separación de la nota local y «1 guardado», sin cambiar el motor de cuentas
ni las dependencias. Su QA y publicación propias, run `38129282799`,
jobs `114440050549`/`114440579448`, terminaron con éxito. La descarga pública
anónima del APK y ZIP coincide con las sumas; la firma volvió a comprobarse.
La nota tiene separación nativa de **92 píxeles** y las cuatro capturas finales
de cuentas se revisaron. Los resultados de APK13 se conservan como historial.
Detalles, huellas y límites en
[`VERIFICACION-ANDROID-1.3.1-2026-10-11.md`](VERIFICACION-ANDROID-1.3.1-2026-10-11.md).

Pruebas locales finales con 1.3.1: `npm test` **código0**, web **501**, móvil
**182**, SQL de sesión **196**, base/QR/herramientas correctos. La web pública
no cambió con esta revisión Android; Codex repitió el comprobador HTTP y
obtuvo otra vez **35/35**, además de la comparación de 64 archivos ya registrada.
La confirmación/recuperación por correo sigue teniendo las mismas pruebas
y límites: no se realizó un cambio real de contraseña ni Auth nativo real.

## Dependencias: advertencias presentes, alcance revisado

`npm audit --omit=dev --audit-level=high` terminó con código **1**: 23 avisos
(16 altos, 7 moderados, ninguno crítico), propagados desde tres advisories.
No es una auditoría limpia. Se evaluaron los caminos reales de `braces`,
`node-forge` y `uuid` con dependencias finales, los 44 archivos de la compilación
y un export local Android con 920 módulos/927 fuentes en su mapa.
No se demostró un camino vulnerable alcanzable en este APK: los paquetes
afectados son herramientas de compilación y las llamadas de UUID examinadas
usan v4, no las variantes vulnerables. Eso no demuestra seguridad absoluta ni
equivale a descompilar el bytecode Hermes del APK. No se forzó una actualización
incompatible, cambió el binario ni ocultaron los avisos. Evaluación y límites:
[`VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-11.md`](VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-11.md).

La entrega en spam del alta es un problema de entregabilidad, no resuelto
porque un segundo mensaje llegue a INBOX. Un dominio de envío propio y un
servicio transaccional necesitan configuración y condiciones separadas;
no se han comprado. No se promete seguridad absoluta ni capacidad de correo
masivo con una cuenta de Gmail.

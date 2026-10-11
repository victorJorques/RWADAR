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

## Publicación y límites pendientes

El candidato web activa acceso, alta y recuperación; mantiene las guardas de
opiniones, avisos, comunidad y manual apagadas. Android candidato 1.3.0 activa
solo `CUENTAS_REMOTAS` y `CORREO_AUTH_E2E`; el motor histórico permanece apagado.
La cuenta EAS está en Free; se comprobaron 1 de 15 compilaciones Android
utilizadas en octubre, sin sobrecostes ni complemento de pago. La compilación
utilizará el perfil editorial, APK, credenciales existentes y sin OTA.
El APK necesita su propia revisión antes de publicarse.

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
Esto no demuestra todavía instalación ni publicación del APK.

Pendiente registrar producción web y el resultado real del APK firmado.

La entrega en spam del alta es un problema de entregabilidad, no resuelto
porque un segundo mensaje llegue a INBOX. Un dominio de envío propio y un
servicio transaccional necesitan configuración y condiciones separadas;
no se han comprado. No se promete seguridad absoluta ni capacidad de correo
masivo con una cuenta de Gmail.

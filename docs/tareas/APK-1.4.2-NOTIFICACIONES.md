# APK 1.4.2 · notificaciones de novedades en el móvil

Guía del cambio **nativo** que necesitan las notificaciones del sistema
(contrato: [`AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md`](AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md),
punto 5). Es el paso 6 de la activación y **cada acción de esta guía necesita
el permiso expreso de Víctor**: crear Firebase, subir credenciales a EAS,
compilar y publicar el APK.

## Por qué hace falta un APK nuevo

La 1.4.1 (código 23) no puede mostrar notificaciones del sistema:

- `app.json` bloquea `android.permission.POST_NOTIFICATIONS`,
  `com.google.android.c2dm.permission.RECEIVE`, `android.permission.WAKE_LOCK`
  y `android.permission.RECEIVE_BOOT_COMPLETED`;
- no lleva `google-services.json`, así que no tiene Firebase Cloud Messaging
  (FCM), que es lo que usa Expo para entregar en Android.

Eso no se arregla por OTA: el guardián `comprobar-ota-compatible.cjs` rechaza
cualquier cambio en `app.json`, `app.config.js` o los permisos.

**Lo que ya llega por OTA a la 1.4.1** (solo JS, con
`AVISOS_NOVEDADES_REMOTOS = true` en `rwadar-movil/lib/modo-local.js`):

- la casilla de avisos del alta;
- la tarjeta «Avisos» de Inicio;
- «Avisos de novedades (correo y móvil)» en Perfil;
- «Notificaciones en este móvil», que en la 1.4.1 dice «Llegan con la versión
  1.4.2 de la app» y **no llama al SDK de notificaciones**.

La app sabe qué binario tiene con
`codigoNativoInstalado(Updates.runtimeVersion) >= 24` (`lib/avisos-cuenta.js`,
`capacidadPushNativa`). Con la política `nativeVersion`, la 1.4.2 tiene el
runtime `1.4.2(24)`; la 1.4.1, `1.4.1(23)`. Nunca se usa `expo-application`.

## Lo que hace Víctor antes (fuera del repositorio)

1. **Proyecto de Firebase** con una app Android de paquete `com.rwadar.app`.
   Descargar su `google-services.json`. **Nunca se sube a Git**: ya está en
   `rwadar-movil/.gitignore`, en el `.gitignore` de la raíz y en `.easignore`.
2. **El archivo, como variable de EAS de tipo archivo** (entorno
   `production`, que es el que usa el perfil `editorial`):

   ```bash
   eas env:create --scope project --environment production \
     --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json \
     --visibility secret
   ```

   EAS entrega en la compilación una ruta temporal en
   `process.env.GOOGLE_SERVICES_JSON`. Antes de lanzarlo, comprobar las
   opciones con `eas env:create --help` en la versión fijada en los flujos
   (`eas-cli@21.8.0`). Borrar después la copia local del archivo.
3. **Credencial FCM V1 en EAS.** En Google Cloud, una cuenta de servicio del
   mismo proyecto con permiso para la API de Firebase Cloud Messaging (V1) y
   su clave JSON. Subirla en `eas credentials -p android` (perfil
   `editorial`) › *Google Service Account* › *Push Notifications (FCM V1)*, o
   en expo.dev › Project › Credentials › Android › `com.rwadar.app`. Sin ella
   Expo no puede entregar en Android. **La clave no se guarda en el
   repositorio ni en el Vault.**
4. `EXPO_ACCESS_TOKEN` en el Vault de Supabase solo si se activa la
   «seguridad de push» de Expo (ver la 30, `procesar()`).

## El cambio en el repositorio (un solo commit, el mismo día que se compila)

El contrato pide que entre en `main` **el mismo día** que se compila la 1.4.2
desde `main`. Mientras no se compile, `main` tiene que seguir siendo
compatible con la 1.4.1 para poder enviarle OTA.

### 1. `rwadar-movil/app.json` (diff exacto)

```diff
--- rwadar-movil/app.json
+++ rwadar-movil/app.json
@@ -2,7 +2,7 @@
   "expo": {
     "name": "RWAdar",
     "slug": "rwadar",
-    "version": "1.4.1",
+    "version": "1.4.2",
     "orientation": "portrait",
     "icon": "./assets/icon.png",
     "scheme": "rwadar",
@@ -21,14 +21,10 @@
       "package": "com.rwadar.app",
       "allowBackup": false,
       "blockedPermissions": [
-        "android.permission.POST_NOTIFICATIONS",
         "android.permission.RECORD_AUDIO",
         "android.permission.READ_EXTERNAL_STORAGE",
         "android.permission.WRITE_EXTERNAL_STORAGE",
         "android.permission.SYSTEM_ALERT_WINDOW",
-        "android.permission.RECEIVE_BOOT_COMPLETED",
-        "android.permission.WAKE_LOCK",
-        "com.google.android.c2dm.permission.RECEIVE",
         "com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE",
         "com.sec.android.provider.badge.permission.READ",
         "com.sec.android.provider.badge.permission.WRITE",
@@ -57,14 +53,14 @@
         "android.permission.USE_BIOMETRIC",
         "android.permission.USE_FINGERPRINT"
       ],
-      "versionCode": 23
+      "versionCode": 24
     },
     "web": {
       "favicon": "./assets/favicon.png"
     },
     "extra": {
       "rwadar": {
-        "pushDeliveryEnabled": false
+        "pushDeliveryEnabled": true
       },
       "eas": {
         "projectId": "43de8651-0c57-40fc-8cdb-c9a8c72e6835"
```

Comprobado en local con el SDK 57 instalado: con este `app.json`,
`getRuntimeVersionAsync` da `1.4.2(24)` y `capacidadPushNativa('1.4.2(24)')`
da `true`.

Notas:

- **Siguen bloqueados** los permisos de insignias de lanzadores
  (`com.sec…badge`, `com.huawei…`, etc.), `SYSTEM_ALERT_WINDOW`, audio,
  almacenamiento y el *install referrer*. Solo salen los cuatro de la lista.
- **`pushDeliveryEnabled: true`** dice que este binario sí puede entregar
  push. Hoy solo lo lee el panel de las instalaciones antiguas, que sigue
  apagado (`SERVICIOS_USUARIO_REMOTOS = false`); las novedades usan el código
  nativo (24) y `push_activo` de la base. No se toca `SERVICIOS_USUARIO_REMOTOS`.
- El plugin `expo-notifications` ya está (`color #25E39A`). No hace falta
  `defaultChannel`: la app crea el canal `novedades` (el mismo `channelId` que
  manda la base) antes de pedir el permiso.
- `eas.json` no cambia: `appVersionSource: local` y `autoIncrement: false`
  toman la versión y el código de `app.json`.

### 2. `rwadar-movil/app.config.js` (nuevo)

`googleServicesFile` sale de la variable de EAS; nunca de un archivo en Git.

```js
// Configuración dinámica: lo único que añade a app.json es el archivo de
// Firebase, que llega como variable de EAS de tipo archivo (GOOGLE_SERVICES_JSON).
// google-services.json nunca va en Git.
module.exports = ({ config }) => {
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON;
  // En las máquinas de compilación de EAS (EAS_BUILD=true) sin el archivo, el
  // APK saldría sin FCM y las notificaciones no llegarían: mejor no compilar.
  if (process.env.EAS_BUILD === 'true' && !googleServicesFile) {
    throw new Error('Falta GOOGLE_SERVICES_JSON (variable de EAS de tipo archivo, entorno production).');
  }
  return googleServicesFile
    ? { ...config, android: { ...config.android, googleServicesFile } }
    : config;
};
```

- Comprobado en local con `@expo/config` del SDK 57 (copia aparte, sin
  compilar): sin la variable no añade nada; con
  `GOOGLE_SERVICES_JSON=/tmp/eas/google-services.json` añade solo
  `android.googleServicesFile`; con `EAS_BUILD=true` y sin la variable, falla.
  En los tres casos el runtime es `1.4.2(24)` y `POST_NOTIFICATIONS` ya no está
  bloqueado.
- En local, `expo start` y `eas update` (el flujo de OTA) funcionan sin la
  variable: la configuración es la de `app.json`.
- `@expo/config-plugins` (`android/GoogleServices`) copia el archivo a
  `android/app/google-services.json` en la compilación y añade el plugin
  `com.google.gms.google-services`. Las carpetas `android/` e `ios/` siguen
  fuera de Git (prebuild de EAS).

### 3. `.easignore`: dejar subir `app.config.js`

`.easignore` es una lista blanca. Sin esta línea, EAS no recibiría el archivo:

```diff
 !/rwadar-movil/app.json
+!/rwadar-movil/app.config.js
 !/rwadar-movil/eas.json
```

`google-services.json` sigue excluido (línea de defensa al final).

### 4. Pruebas que cambian con el binario

| Prueba | Hoy (1.4.1) | Con la 1.4.2 |
|---|---|---|
| `tests/flujo.test.cjs`, «la configuración conserva el producto nuevo y falla cerrado» | `app.version === '1.4.1'`, `pushDeliveryEnabled === false` y los cuatro permisos en la lista de bloqueados | `'1.4.2'`, `true`, y `POST_NOTIFICATIONS`, `c2dm.permission.RECEIVE`, `WAKE_LOCK` y `RECEIVE_BOOT_COMPLETED` pasan al bucle de «se conserva la capacidad» (`!blockedPermissions.includes`). El resto de la lista sigue bloqueado. |
| `tests/actualizaciones-app.test.cjs`, «configuración: runtime nativo aislado…» | `versionCode === 23` y runtime `1.4.1(23)` | `24` y `1.4.2(24)` |
| `tests/avisos-ui.test.cjs`, «App: solo con el interruptor…» | `pushDeliveryEnabled === false` | `true` |
| `tests/empaquetado.test.cjs` | — | Añadir `rwadar-movil/app.config.js` a la lista que EAS debe incluir y `rwadar-movil/google-services.json` a la de excluidos |
| Nueva: `tests/app-config.test.cjs` | — | `app.config.js` sin la variable devuelve `app.json` tal cual; con `GOOGLE_SERVICES_JSON=/tmp/x.json` solo añade `android.googleServicesFile`; con `EAS_BUILD=true` y sin la variable, lanza el error |

No cambian: `ota-compatible.test.cjs` (usa su propio repositorio de prueba),
`actualizacion-boton.test.cjs` (ya prueba el paso a `1.4.2`/24),
`avisos-movil.test.cjs` y `avisos-cuenta.test.cjs` (ya prueban 23 y 24).

### 5. Textos

- `rwadar-movil/LEEME.md`: la sección de actualizaciones pasa a «1.4.2/código
  24» y explica la variable de EAS y la credencial FCM V1.
- Privacidad de la app: con la 1.4.2, `Privacidad` ya cambia sola a «Si
  activas «Notificaciones en este móvil»…» (depende de la capacidad nativa).
- Privacidad de la web (`privacidad.html:349-351, 455-459, 493-494`): las
  frases de «Al encender el push» del contrato.

## Compilar y publicar (con permiso de Víctor)

1. PR con los puntos 1 a 5, `npm test` completo en verde, merge a `main`.
2. «Compilar app Android» (`compilar-app.yml`), perfil `editorial`, desde
   `main`. Apuntar el **commit completo** de esa compilación: es la base de
   las OTA de la 1.4.2.
3. Probar el APK en un móvil real **antes** de publicarlo:
   - instalar encima de la 1.4.1 (mismo paquete y firma), sin desinstalar;
   - Perfil › Avisos: «Notificaciones en este móvil» pide permiso solo al
     pulsarlo; con `push_activo = false` en la base dice que todavía no están
     activas;
   - Perfil › «Versión de la app» dice 1.4.2.
4. Publicar en `RWAdar-downloads` la release `v1.4.2` con `RWAdar.apk` **y**
   `version-android.json`, con esta forma exacta (la app rechaza cualquier
   otra URL o versión):

   ```json
   {"plataforma":"android","version":"1.4.2","versionCode":24,"apk":"https://github.com/victorJorques/RWAdar-downloads/releases/download/v1.4.2/RWAdar.apk"}
   ```

   Sin ese archivo en la última release, la 1.4.1 no avisa de la versión
   nueva.
5. Activar el push en la base (`30_avisos_registrados_activar_push.sql`) y
   repetir la prueba en el móvil real: registrar el móvil, recibir la
   bienvenida por push (una vez por cuenta), tocarla (abre la Academy),
   desactivar y cerrar sesión (el token se quita).

## Transición de las OTA

1. **Antes** de este cambio: las OTA de JS siguen yendo a la 1.4.1 con la base
   `c1f7106a49e988ca1dde214f0e75b7fe7d4d2719` (por defecto en
   `ota-android.yml`). El guardián da `ok:true` mientras `app.json` y los
   archivos nativos no cambien:

   ```bash
   cd rwadar-movil && node scripts/comprobar-ota-compatible.cjs --base c1f7106a49e988ca1dde214f0e75b7fe7d4d2719
   ```

2. **El mismo día** que se compila la 1.4.2 desde `main`: en
   `.github/workflows/ota-android.yml`, `inputs.base.default` pasa a ser el
   commit completo de esa compilación, y la descripción, «Commit completo del
   APK instalado (1.4.2 = <primeros 7>…)».
3. Desde entonces, una OTA lleva el runtime `1.4.2(24)`: **la 1.4.1 deja de
   recibir OTA** y ve el aviso «Nueva versión 1.4.2» (gracias a
   `version-android.json`). Su código sigue funcionando: avisos dentro de la
   app, sin notificaciones del sistema.
4. No se envía ninguna OTA nueva a la 1.4.1 desde un `main` con el cambio
   nativo: el guardián lo rechaza («Requiere revisión nativa y otro APK»).

## Lo que no cambia

- `SERVICIOS_USUARIO_REMOTOS = false`: las instalaciones antiguas y su tabla
  `public.dispositivos` siguen cerradas. El push de novedades usa
  `rwadar_novedades.dispositivos` por cuenta.
- La app nunca pide permiso al abrirse: solo al pulsar «Notificaciones en este
  móvil».
- Ningún dato personal viaja en la notificación: `data` solo lleva
  `{tipo, destino}` y la app solo acepta `destino` ∈ `inicio`, `buscar`,
  `academy` (y el `slug` antiguo).
- Al cerrar sesión, la app quita el token de este móvil
  (`quitar_aviso_push`) con la sesión que se cierra, con un plazo de 4 s y
  sin bloquear la salida si falla.

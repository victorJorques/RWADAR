# RWAdar · app móvil

App Android de RWAdar, hecha con Expo (SDK 57) y React Native. Enseña el
catálogo editorial conectado (ofertas y plataformas), la Academy, las
noticias, la calculadora y el Perfil con cuenta. Para ver el catálogo hace
falta una cuenta confirmada.

Las reglas de trabajo están en [`AGENTS.md`](AGENTS.md) y en el
[`AGENTS.md`](../AGENTS.md) de la raíz. La historia de este documento (cortes
de agosto a noviembre de 2026) está archivada en
[`docs/archive/2026-11/LEEME-MOVIL-hasta-2026-11-21.md`](../docs/archive/2026-11/LEEME-MOVIL-hasta-2026-11-21.md).

## Estructura

```
App.js            Pantallas, navegación (Inicio · Ofertas · Plataformas ·
                  Academy · Perfil) y estado de la app
index.js          Punto de entrada de Expo
componentes/      Una pieza de interfaz por archivo (Inicio, Ofertas, Radar,
                  Academy, Cuenta, avisos, calculadora, noticias…)
lib/              Lógica sin interfaz: datos y caché (datos.js,
                  catalogo-remoto.js), cuentas, avisos, cartera, tema e
                  idioma, y los interruptores (modo-local.js)
tests/            Pruebas con node:test (npm test)
fixtures/         Mapa de imágenes editoriales (imagenes-editoriales.js, que
                  sí usa la app) y datos de prueba, como el escaparate de
                  agosto (escaparate-local.json), que ya no va en la app
assets/           Iconos, fotos editoriales y de ofertas
scripts/          Guardián de la OTA, copia de idiomas a la web y parche de
                  expo-modules-core (postinstall)
plugins/          Complemento de Expo que impide que Firebase arranque solo
app.json, app.config.js, eas.json   Configuración de Expo y EAS
```

Algunos motores de `lib/` son los mismos que usa la web y están sellados
(`RUTAS_CONTENIDO_APROBADO` en `../rwadar-publicacion-segura.js`): entre
otros `idioma.js`, `idioma-en.js`, `tokenizacion.js`, `calculadora.js`,
`noticias-sector.js`, `cartera.js`, `contrato-catalogo.js` y
`ficha-editorial.js`. No se cambian sin pasar por la publicación de la web.

## Cómo se prueba

```bash
cd rwadar-movil
npm test
```

`npm test` ejecuta `node --test` sobre `tests/`. No necesita red, móvil ni
Expo: las pruebas cargan el código con dobles de Expo, React Native y
Supabase. Para mirar la interfaz, `npx expo start` (Expo Go o emulador) sirve
de apoyo, pero no sustituye probar el APK en un móvil real.

## La OTA y su guardián

La app recibe mejoras por OTA (Expo Updates): `updates.enabled` es `true` y la
runtime usa la política `nativeVersion`, que hoy resuelve Android `1.4.2(24)`
en el canal `production`. Una OTA solo puede llevar JavaScript y activos.

Antes de enviar una OTA, el guardián comprueba que no ha cambiado nada nativo
desde el commit del APK instalado:

```bash
node scripts/comprobar-ota-compatible.cjs --base COMMIT_COMPLETO_DEL_APK
```

La bloquea cualquier cambio (o archivo nuevo sin seguimiento) en la raíz del
repositorio en `.easignore`, `.gitattributes`, `package.json`,
`package-lock.json` y `.npmrc`, y dentro de `rwadar-movil/` en `package.json`,
`package-lock.json`, `.npmrc`, `app.json`, `app.config.*`, `eas.json`,
`plugins/`, `scripts/`, `android/`, `ios/` y en los iconos y archivos que
`app.json` nombra por ruta. Eso exige otro APK. La OTA
se envía con el flujo `.github/workflows/ota-android.yml` y siempre con
permiso expreso de Víctor.

Cada versión Android nueva sube a su release de RWAdar-downloads un
`version-android.json` con esta forma exacta, para que la app avise de que
hay una versión nueva (sin él, las OTA siguen llegando igual):

```json
{"plataforma":"android","version":"1.4.2","versionCode":24,"apk":"https://github.com/victorJorques/RWAdar-downloads/releases/download/v1.4.2/RWAdar.apk"}
```

## Interruptores (`lib/modo-local.js`)

Son constantes en el código, no variables de entorno. Valor de hoy:

| Interruptor | Valor | Qué hace |
| --- | --- | --- |
| `MODO_DATOS` | `'catalogo-editorial'` | La app lee el catálogo editorial conectado |
| `SERVICIOS_USUARIO_REMOTOS` | `false` | Sin seguimiento por instalación: favoritos y progreso se quedan en el móvil |
| `CUENTAS_REMOTAS` | `true` | Cuentas con correo confirmado |
| `CORREO_AUTH_E2E` | `true` | Alta y recuperación por correo comprobadas |
| `AVISOS_NOVEDADES_REMOTOS` | `true` | Perfil › Avisos y la tarjeta de avisos de Inicio |
| `AVISOS_CASILLA_ALTA_REMOTA` | `false` | La casilla de avisos del alta, apagada hasta que salga el correo |
| `AVISOS_BANDEJA_REMOTA` | `true` | Bandeja de avisos recibidos en Inicio; hoy no hace nada, porque `AVISOS_NOVEDADES_REMOTOS` está encendido y ya trae la tarjeta |
| `AVISOS_SIN_CUENTA_REMOTOS` | `true` | «Notificaciones en este móvil» en la pantalla de acceso, sin cuenta |

Cambiar uno es solo JavaScript (llega por OTA), pero cambia lo que ve la gente:
se hace con orden de Víctor.

## Compilar desde GitHub

Un APK o AAB nuevo se compila con el flujo manual **Compilar app Android**
(`.github/workflows/compilar-app.yml`): pasa `npm test`, compila en EAS con el
perfil elegido (`editorial` = APK firmado para la página de descargas;
`production` = AAB para Google Play) y deja el archivo y su SHA-256 como
artefacto del flujo durante 30 días.

Necesita una vez el secreto `EXPO_TOKEN` (lo hace Víctor):

1. expo.dev › icono de perfil › **Account settings** › **Access tokens** ›
   **Create token**. Nombre: `RWAdar GitHub`. Copiar el valor (se ve una vez).
2. GitHub › RWADAR › **Settings** › **Secrets and variables** › **Actions** ›
   **New repository secret**. Name: `EXPO_TOKEN`; Secret: el valor › **Add secret**.

Después se lanza desde *Actions › Compilar app Android › Run workflow*, con
permiso de Víctor. El APK se instala en un móvil real antes de subirlo a la
página de descargas.
